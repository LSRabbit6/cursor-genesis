#!/usr/bin/env python3
"""CG menu client (Python standard library). CG_MENU_URL and CG_MENU_TOKEN configure access."""
from __future__ import annotations
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath, PureWindowsPath
import re
import stat
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile

CONFIG = Path(os.environ.get('CG_MENU_CONFIG', Path.home() / '.config/cg-workbench'))
LIMIT = 32 * 1024 * 1024
class Offline(Exception): pass
class Rejected(Exception): pass
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise Rejected('服务发生重定向；请确认地址，不自动转发令牌。')

def endpoint():
    url = os.environ.get('CG_MENU_URL', 'http://127.0.0.1:4317').rstrip('/')
    p = urllib.parse.urlsplit(url)
    if p.scheme != 'https' and not (p.scheme == 'http' and p.hostname in ('localhost','127.0.0.1','::1')):
        raise Rejected('服务地址必须使用 HTTPS；本机回环地址可以用 HTTP。')
    if p.username or p.password or p.query or p.fragment or p.path:
        raise Rejected('服务地址只填写协议、主机和端口。')
    return url

def token():
    value = os.environ.get('CG_MENU_TOKEN')
    if value: return value.strip()
    path = CONFIG / 'token'
    return path.read_text(encoding='utf-8').strip() if path.exists() else None

def request(method, path, body=None, auth=False, raw=False):
    if not path.startswith('/') or path.startswith('//'):
        raise Rejected('拒绝越出当前服务的下载地址。')
    headers = {'Accept':'application/json','User-Agent':'cg-workbench/0.1'}
    if auth:
        value = token()
        if not value: raise Rejected('缺少项目令牌：在工作台创建后，设 CG_MENU_TOKEN，或保存到 ~/.config/cg-workbench/token。')
        headers['Authorization'] = 'Bearer ' + value
    data = None
    if body is not None:
        data = json.dumps(body,ensure_ascii=False).encode();headers['Content-Type']='application/json'
    req = urllib.request.Request(endpoint()+path,data=data,headers=headers,method=method)
    try:
        handlers = [NoRedirect()]
        if urllib.parse.urlsplit(endpoint()).hostname in ('localhost', '127.0.0.1', '::1'):
            handlers.append(urllib.request.ProxyHandler({}))
        with urllib.request.build_opener(*handlers).open(req,timeout=20) as response:
            value=response.read(LIMIT+1)
            if len(value)>LIMIT: raise Rejected('响应过大，已停止。')
            if raw: return value
            try: return json.loads(value)
            except (ValueError,UnicodeError): raise Rejected('服务未返回 JSON；私有网页可能需要先通过平台登录。请使用可直连的自托管地址。')
    except urllib.error.HTTPError as e:
        try: message=json.loads(e.read(65536)).get('error',str(e.reason))
        except (ValueError,UnicodeError): message=str(e.reason)
        raise Rejected(f'服务回 {e.code}：{message}') from e
    except (urllib.error.URLError,TimeoutError,ConnectionError) as e: raise Offline(str(e)) from e

def root():
    r=subprocess.run(['git','rev-parse','--show-toplevel'],capture_output=True,text=True)
    return Path(r.stdout.strip()) if r.returncode==0 else Path.cwd()

def installed(project):
    result={}
    for base in ('.agents','.cursor'):
        file=project/base/'installed-packs.yaml'
        if not file.exists(): continue
        current=None
        for line in file.read_text(encoding='utf-8').splitlines():
            match=re.match(r'^  ([\w.-]+):\s*$',line)
            if match: current=match.group(1)
            match=re.match(r'''^    version:\s*['"]?([^'"\s]+)''',line)
            if current and match: result.setdefault(current,match.group(1))
    return result

def park(body):
    pending=CONFIG/'pending';pending.mkdir(parents=True,exist_ok=True,mode=0o700)
    path=pending/(body['client_request_id']+'.json')
    fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
    with os.fdopen(fd,'w',encoding='utf-8') as out: json.dump({'url':endpoint(),'body':body},out,ensure_ascii=False,indent=2)
    return path

def post(body):
    body.setdefault('client_request_id',str(uuid.uuid4()))
    # Persist before sending: interrupted or response-lost submissions keep the same key.
    path=park(body)
    try: result=request('POST','/v1/requests',body,auth=True)
    except Offline as e:
        raise Offline(f'{e}\n待补交内容已存到 {path}；恢复连接后运行 resend，沿用原提交标识。') from e
    except Rejected:
        # Keep the payload for inspection; only explicit successful receipt removes it.
        raise
    path.unlink();return result

def valid_member(name):
    p=PurePosixPath(name);w=PureWindowsPath(name)
    return bool(name) and not p.is_absolute() and not w.anchor and not w.drive and '\\' not in name and '..' not in p.parts and name.strip('/') not in ('','.')

def extract_pack(blob,name,directory):
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:
        seen=set();size=0
        for entry in archive.infolist():
            size+=entry.file_size
            if size>LIMIT or len(archive.infolist())>5000: raise Rejected('下载包解压后过大。')
            allowed=entry.filename=='scripts/install-pack.py' or entry.filename.startswith('stable/packs/'+name+'/')
            if not valid_member(entry.filename) or not allowed or entry.filename in seen or stat.S_ISLNK(entry.external_attr>>16):
                raise Rejected('下载包含越界、链接或重复路径，未安装。')
            seen.add(entry.filename)
        archive.extractall(directory)
    if not (directory/'scripts/install-pack.py').is_file() or not (directory/'stable/packs'/name/'install-manifest.yaml').is_file():
        raise Rejected('下载包缺少安装器或清单。')

def install(names):
    listing={p['name']:p for p in request('GET','/v1/packs')['packs']}
    for name in names:
        if name not in listing: raise Rejected('服务未发布这个包：'+name)
        p=listing[name];data=request('GET',p['zip'],raw=True)
        if hashlib.sha256(data).hexdigest()!=p['sha256']: raise Rejected('下载包摘要不匹配，未安装。')
        with tempfile.TemporaryDirectory(prefix='cg-pack-') as d:
            directory=Path(d);extract_pack(data,name,directory)
            subprocess.run([sys.executable,str(directory/'scripts/install-pack.py'),name,str(root()),'--source',d],check=True)
        print(f"已安装 {name} {p['version']}。请核对项目变更，再接入规则入口；加载与触发需另外验证。")

def output(value): print(json.dumps(value,ensure_ascii=False,indent=2))

def main(argv=None):
    parser=argparse.ArgumentParser(description='CG 协作客户端：本机服务默认 http://127.0.0.1:4317；项目根目录运行。')
    sub=parser.add_subparsers(dest='cmd',required=True)
    sub.add_parser('checklist');sub.add_parser('packs');sub.add_parser('resend')
    s=sub.add_parser('submit');s.add_argument('file');s.add_argument('--project')
    s=sub.add_parser('install');s.add_argument('packs',nargs='+')
    s=sub.add_parser('status');s.add_argument('ticket')
    s=sub.add_parser('feedback');s.add_argument('--category',required=True,choices=['misfit','validator','want']);s.add_argument('--where',default='');s.add_argument('--text',required=True);s.add_argument('--project')
    s=sub.add_parser('evidence');s.add_argument('ticket');s.add_argument('--stage',required=True,choices=['installed','connected','loaded','triggered','checked','accepted','delivered']);s.add_argument('--text',required=True)
    a=parser.parse_args(argv)
    try:
        if a.cmd=='checklist': output(request('GET','/v1/checklist'))
        elif a.cmd=='packs':
            mine=installed(root())
            for p in request('GET','/v1/packs')['packs']:
                state='最新' if mine.get(p['name'])==p['version'] else '未安装' if p['name'] not in mine else '可更新'
                print(f"{p['name']} {p['version']} · {state} · {p['description']}")
        elif a.cmd=='submit':
            body=json.loads(sys.stdin.read() if a.file=='-' else Path(a.file).read_text(encoding='utf-8'))
            if not isinstance(body,dict): raise Rejected('答案应为 JSON 对象。')
            body.setdefault('kind','solution');body.setdefault('project',a.project or root().name);body['installed']=installed(root());output(post(body))
        elif a.cmd=='feedback': output(post(dict(kind='feedback',category=a.category,where=a.where,text=a.text,project=a.project or root().name,installed=installed(root()))))
        elif a.cmd=='status': output(request('GET','/v1/tickets/'+urllib.parse.quote(a.ticket,safe=''),auth=True))
        elif a.cmd=='evidence': output(request('POST','/v1/tickets/'+urllib.parse.quote(a.ticket,safe='')+'/evidence',dict(stage=a.stage,detail=a.text),auth=True))
        elif a.cmd=='install': install(a.packs)
        elif a.cmd=='resend':
            files=sorted((CONFIG/'pending').glob('*.json'))
            if not files: print('没有待补交的。')
            for file in files:
                envelope=json.loads(file.read_text(encoding='utf-8'))
                if envelope['url']!=endpoint(): print(f'跳过其他服务的记录：{file.name}');continue
                result=request('POST','/v1/requests',envelope['body'],auth=True);file.unlink();output(result)
    except (Rejected,Offline,ValueError,OSError,subprocess.CalledProcessError,zipfile.BadZipFile) as e:
        print(str(e),file=sys.stderr);return 3 if isinstance(e,Offline) else 1
    return 0
if __name__=='__main__': sys.exit(main())
