import importlib.util
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
CHECKER_PATH = REPO_ROOT / "scripts" / "check-bundles.py"
SPEC = importlib.util.spec_from_file_location("check_bundles", CHECKER_PATH)
check_bundles = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(check_bundles)


class CheckBundlesTests(unittest.TestCase):
    def test_repo_bundles_have_no_errors(self):
        for manifest in sorted((REPO_ROOT / "bundles").glob("*/bundle.yaml")):
            _, errors, _ = check_bundles.check_bundle(manifest.parent, REPO_ROOT)
            self.assertEqual(errors, [], manifest.parent.name)

    def test_broken_bundle_is_reported(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            bundle_dir = root / "bundles" / "demo"
            bundle_dir.mkdir(parents=True)
            (bundle_dir / "bundle.yaml").write_text(
                "bundle: other\n"
                "version: 1.0\n"
                "for: x\n"
                "gate: passed\n"
                "recipients: []\n"
                "packs: [missing-pack@0.1.0, no-version]\n"
                "adapters: {claude-code: adapters/claude-code/}\n"
                "setup: SETUP.md\n"
                "condition_label: {basis: [], environment: {model_tier: any}}\n",
                encoding="utf-8",
            )
            _, errors, _ = check_bundles.check_bundle(bundle_dir, root)
            text = "\n".join(errors)
            for expected in [
                "与目录名 demo 不一致",
                "不是语义化版本",
                "recipients 为空",
                "货架上没有 missing-pack",
                "名@版本：no-version",
                "adapters.claude-code 指的路径不在",
                "setup 指的文件不在",
                "condition_label 缺 rejudge_when",
                "environment 缺 host",
            ]:
                self.assertIn(expected, text)

    def test_placeholder_may_skip_adapters_and_todo_setup(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            bundle_dir = root / "bundles" / "self"
            bundle_dir.mkdir(parents=True)
            (bundle_dir / "bundle.yaml").write_text(
                "bundle: self\nversion: 0.0.0\nfor: x\ngate: placeholder\nrecipients: []\npacks: []\n"
                "adapters: {}\nsetup: 'TODO: later'\n"
                "condition_label: {basis: [], rejudge_when: '', environment: "
                "{model_tier: any, host: [codex], project: cursor-genesis, date: 2026-10-22, reading: '', source: ''}}\n",
                encoding="utf-8",
            )
            _, errors, _ = check_bundles.check_bundle(bundle_dir, root)
            self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
