# 验证记录 · 2026-09-26

基线：公开仓 main `426a73d8b235d16778d5e66bc471639ad8584f78`。改动范围是文档和独立 HTML 页面。

## 本次页面

- Chromium：1200 / 736 / 390 / 320px 全部无横向溢出，所有展开后仍无溢出。
- 六个环节：鼠标可折叠，Enter 键可重新展开；页内导航到对应章节。
- 检查明暗主题和手机、桌面截图，文字与结构可读。
- 页面无脚本错误，无外部网络请求；无远程脚本、样式、字体或图片。
- HTML 所有本地链接与锚点、architecture.md 的链接目标均存在；HTML id 无重复。

规范检查：

```bash
python stable/packs/delivery-data-app/validators/data-app-norms-check/scripts/check_data_app_norms.py docs/collaboration-map.html
```

结果：1 个文件 PASS，0 FAIL。

## 既有安装器测试：基线失败如实保留

使用 Python 3.12.14：

```bash
python -m unittest discover -s scripts/tests -p test_install_pack.py -q
```

运行 6 个测试；其中 `test_mapping_rejects_parent_traversal` 的两个子用例失败：

- `unsafe_target='\\outside.txt'`：预期抛出 ValueError，实际没有。
- `unsafe_target='C:outside.txt'`：预期抛出 ValueError，实际没有。

将 HEAD 中未经修改的安装器和测试文件取出到临时目录，仅重跑该测试，得到同样的两处失败。本次 `git diff HEAD -- scripts/install-pack.py scripts/tests/test_install_pack.py` 为空，确认不是文档变更引入。

本机系统 Python 3.9 无法加载安装器的 `dict | None` 类型表达式，故正式验证改用 Python 3.12。这里记录的是 Mac 环境的实测，不推断其他系统结果，也不修改测试让其变绿。

## 人工核对

- 公开包版本仍是 0.1.0；未修改版本或包内容。
- 在线菜单单列为下游观察；没有写成公开仓已实现的服务。
- 生效状态、业务决定权、回流接受权与交付授权分别说明。
- 未包含原下游项目的真实票据、资料与本机路径。
- 本次提交不部署任何在线服务。
