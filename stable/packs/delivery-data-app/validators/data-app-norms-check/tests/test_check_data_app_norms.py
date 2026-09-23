"""check_data_app_norms 行为测试（stdlib unittest）。

跑法：在本目录的上一级执行 `python -m unittest tests.test_check_data_app_norms -v`，
或直接 `python tests/test_check_data_app_norms.py`。
"""
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "scripts"))
import check_data_app_norms as c  # noqa: E402

GOOD = (
    '<!doctype html><html><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>t</title></head>'
    '<body><input type="search" placeholder="搜索商品"><table>'
    + "".join(f"<tr><td>{i}</td></tr>" for i in range(20))
    + '</table><p data-empty>暂无数据</p></body></html>'
)
BAD = (
    '<html><head><script src="https://cdn.example.com/x.js"></script></head>'
    '<body><ul>' + "".join(f"<li>{i}</li>" for i in range(20)) + '</ul></body></html>'
)


def codes(findings, level=None):
    return sorted({f["code"] for f in findings if level is None or f["level"] == level})


class CheckTextTests(unittest.TestCase):
    def test_good_page_passes(self):
        self.assertEqual(c.check_text(GOOD), [])

    def test_bad_page_fails_r1_r3_s2(self):
        self.assertEqual(codes(c.check_text(BAD), "FAIL"), ["R1", "R3", "S2"])

    def test_empty_state_is_warn_unless_strict(self):
        page = GOOD.replace('<p data-empty>暂无数据</p>', "")
        self.assertEqual(codes(c.check_text(page), "WARN"), ["S3"])
        self.assertEqual(codes(c.check_text(page, strict=True), "FAIL"), ["S3"])

    def test_short_list_does_not_need_search(self):
        page = GOOD.replace('<input type="search" placeholder="搜索商品">', "")
        page = page.replace("".join(f"<tr><td>{i}</td></tr>" for i in range(20)), "<tr><td>1</td></tr><tr><td>2</td></tr><tr><td>3</td></tr>")
        self.assertNotIn("S2", codes(c.check_text(page)))

    def test_file_input_is_not_a_search_control(self):
        page = GOOD.replace('<input type="search" placeholder="搜索商品">', '<input type="file">')
        self.assertIn("S2", codes(c.check_text(page), "FAIL"))

    def test_script_rendered_list_is_warned_not_passed(self):
        page = ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="w"></head>'
                '<body><table><tbody id="rows"></tbody></table><p>暂无数据</p><script>render()</script></body></html>')
        self.assertEqual(codes(c.check_text(page), "WARN"), ["S2"])
        self.assertEqual(codes(c.check_text(page), "FAIL"), [])

    def test_terms_blacklist(self):
        page = GOOD.replace("<title>t</title>", "<title>知识图谱看板</title>")
        self.assertEqual(codes(c.check_text(page, terms=["知识图谱"]), "FAIL"), ["R7"])

    def test_anchor_href_is_not_external_dependency(self):
        page = GOOD.replace("<body>", '<body><a href="https://example.com">链接</a>')
        self.assertNotIn("R3", codes(c.check_text(page)))


class CheckFileTests(unittest.TestCase):
    def test_non_utf8_file_fails_r1(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "gbk.html"
            p.write_bytes(GOOD.replace("暂无数据", "中文").encode("gbk"))
            self.assertIn("R1", codes(c.check_file(p), "FAIL"))

    def test_cli_exit_codes(self):
        with tempfile.TemporaryDirectory() as d:
            good = Path(d) / "good.html"
            bad = Path(d) / "bad.html"
            good.write_text(GOOD, encoding="utf-8")
            bad.write_text(BAD, encoding="utf-8")
            self.assertEqual(c.main([str(good)]), 0)
            self.assertEqual(c.main([str(bad)]), 1)
            self.assertEqual(c.main([d]), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
