import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('release', ROOT / 'scripts/check-release.py')
release = importlib.util.module_from_spec(spec); spec.loader.exec_module(release)

class ReleaseTests(unittest.TestCase):
    def test_tampered_content_cannot_keep_published_version(self):
        original = release.ROOT, release.LOCK
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ['delivery-data-app', 'second-loop-compounding']:
                shutil.copytree(ROOT / 'stable/packs' / name, root / 'stable/packs' / name)
            (root / 'scripts').mkdir(); (root / 'stable/knowledge').mkdir()
            for name in ['install-pack.py', 'build-pack-catalog.py']:
                shutil.copyfile(ROOT / 'scripts' / name, root / 'scripts' / name)
            shutil.copyfile(ROOT / 'stable/knowledge/index.yaml', root / 'stable/knowledge/index.yaml')
            shutil.copyfile(ROOT / 'release-lock.json', root / 'release-lock.json')
            def git(*args): return subprocess.run(['git', *args], cwd=root, check=True, capture_output=True, text=True).stdout.strip()
            git('init', '-q');git('add', '.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','baseline')
            base=git('rev-parse','HEAD')
            try:
                release.ROOT, release.LOCK = root, root / 'release-lock.json'
                release.check(base)
                source = root / 'stable/packs/delivery-data-app/README.md'
                source.write_text(source.read_text(encoding='utf-8') + '\nChanged source\n', encoding='utf-8')
                with self.assertRaises(ValueError): release.check()
                with self.assertRaises(ValueError): release.check(base, write=True)
                manifest = root / 'stable/packs/delivery-data-app/install-manifest.yaml'
                manifest.write_text(manifest.read_text(encoding='utf-8').replace('version: 0.1.0', 'version: 0.1.1'), encoding='utf-8')
                release.check(base, write=True);release.check(base)
                source.unlink()
                with self.assertRaises(ValueError): release.check()
            finally: release.ROOT, release.LOCK = original
