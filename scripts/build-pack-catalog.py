#!/usr/bin/env python3
"""Build a deterministic, allowlisted download catalog from release sources."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def build(output):
    spec = importlib.util.spec_from_file_location('installer', ROOT / 'scripts/install-pack.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    packs = []
    # Only self-contained packs whose manifests are validated by the installer.
    for name in ('delivery-data-app', 'second-loop-compounding'):
        folder = ROOT / 'stable/packs' / name
        manifest = module.load_yaml_simple(folder / 'install-manifest.yaml')
        for mapping in manifest['mappings']:
            source = module._validated_relative_path(mapping['source'], 'source')
            module._mapping_destination(Path('/unused-target'), mapping)
            if not (folder / source).exists():
                raise ValueError(f'Missing source: {name}/{source}')
        files = [ROOT / 'scripts/install-pack.py'] + sorted(p for p in folder.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc')
        data = io.BytesIO()
        with zipfile.ZipFile(data, 'w', zipfile.ZIP_DEFLATED) as archive:
            for p in files:
                if p.is_symlink():
                    raise ValueError(f'Symlink not allowed: {p.name}')
                item = zipfile.ZipInfo(p.relative_to(ROOT).as_posix(), (2026, 1, 1, 0, 0, 0))
                item.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(item, p.read_bytes())
        blob = data.getvalue()
        path = output / 'downloads' / f'{name}.zip'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(blob)
        packs.append(dict(name=name, version=str(manifest['version']), description=manifest['description'], zip=f'/downloads/{name}.zip', sha256=hashlib.sha256(blob).hexdigest(), size=len(blob)))
    commit = subprocess.check_output(['git','rev-parse','HEAD'], cwd=ROOT, text=True).strip()
    return dict(cg_ref='source-build', cg_commit=commit, packs=packs)

if __name__ == '__main__':
    import sys
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    (out / 'catalog.json').write_text(json.dumps(build(out), ensure_ascii=False, indent=2), encoding='utf-8')
