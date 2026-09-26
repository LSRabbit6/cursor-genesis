import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import tempfile
import unittest
from unittest.mock import patch
import zipfile

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('menu_client',ROOT/'scripts/menu.py')
menu=importlib.util.module_from_spec(spec);spec.loader.exec_module(menu)

class ClientTests(unittest.TestCase):
    def test_archive_rejects_cross_platform_escape_symlinks_duplicate_and_unexpected_files(self):
        for name in ('../escape','/outside','C:outside','\\outside','stable/packs/demo/../../escape','unrelated.txt'):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as d:
                b=io.BytesIO()
                with zipfile.ZipFile(b,'w') as z:z.writestr(name,'x')
                with self.assertRaises(menu.Rejected):menu.extract_pack(b.getvalue(),'demo',Path(d))
        with tempfile.TemporaryDirectory() as d:
            b=io.BytesIO()
            with zipfile.ZipFile(b,'w') as z:
                i=zipfile.ZipInfo('stable/packs/demo/link');i.external_attr=(stat.S_IFLNK|0o777)<<16;z.writestr(i,'../escape')
            with self.assertRaises(menu.Rejected):menu.extract_pack(b.getvalue(),'demo',Path(d))
    def test_park_before_send_retains_same_id_for_response_loss_and_resend(self):
        with tempfile.TemporaryDirectory() as d, patch.object(menu,'CONFIG',Path(d)),patch.dict(os.environ,{'CG_MENU_URL':'http://127.0.0.1:4317'}):
            body={'kind':'feedback','project':'demo','text':'test'}
            with patch.object(menu,'request',side_effect=menu.Offline('response lost')):
                with self.assertRaises(menu.Offline):menu.post(body)
            saved=list((Path(d)/'pending').glob('*.json'));self.assertEqual(len(saved),1)
            envelope=json.loads(saved[0].read_text());self.assertEqual(envelope['body']['client_request_id'],body['client_request_id'])
            with patch.object(menu,'request',return_value={'request_id':'R-original'}) as request:
                self.assertEqual(menu.main(['resend']),0)
                self.assertEqual(request.call_args.args[2]['client_request_id'],body['client_request_id'])
            self.assertFalse(saved[0].exists())
    def test_resend_never_sends_to_a_different_service(self):
        with tempfile.TemporaryDirectory() as d, patch.object(menu,'CONFIG',Path(d)),patch.dict(os.environ,{'CG_MENU_URL':'http://127.0.0.1:4317'}):
            file=menu.park({'client_request_id':'test'})
            with patch.dict(os.environ,{'CG_MENU_URL':'http://127.0.0.1:4318'}),patch.object(menu,'request') as request:
                self.assertEqual(menu.main(['resend']),0);request.assert_not_called();self.assertTrue(file.exists())
    def test_http_is_only_allowed_for_loopback(self):
        for url in ('http://example.com','https://user:password@example.com','https://example.com/path'):
            with self.subTest(url=url),patch.dict(os.environ,{'CG_MENU_URL':url}):
                with self.assertRaises(menu.Rejected):menu.endpoint()
    def test_hash_mismatch_prevents_execution(self):
        with patch.object(menu,'request',side_effect=[{'packs':[{'name':'demo','sha256':'wrong','zip':'/downloads/demo.zip'}]},b'payload']),patch.object(menu.subprocess,'run') as run:
            with self.assertRaises(menu.Rejected):menu.install(['demo'])
            run.assert_not_called()
    def test_redirect_never_forwards_credentials(self):
        with self.assertRaises(menu.Rejected):menu.NoRedirect().redirect_request(None,None,302,'',{},'https://elsewhere')

if __name__=='__main__':unittest.main()
