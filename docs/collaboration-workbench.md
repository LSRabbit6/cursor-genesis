# CG 协作工作台

这个入口把架构图中的交接变成真实记录：客户端交自查与反馈，服务端返回材料或缺口编号；维护者处理后，客户端按编号查结果、下载包，并记录自己的执行证据。

页面顶部是整体架构，下面并排放服务端与客户端。需求与反馈共用可搜索、按项目与状态筛选的列表。选中一条记录即可看到原始材料、包、处理操作和完整历史。

## 本地启动

需要 Node.js 22.13+、Python 3.10+ 和 pnpm。Python 只用标准库；数据库和 HTTP 服务不需要外部运行时包。构建工具依赖用于生成数据库迁移。

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm dev
```

打开终端显示的本机地址，默认 `http://127.0.0.1:4317`。数据库保存在被 Git 忽略的 `.cg-menu/workbench.sqlite`。可通过 `PORT`、`CG_DB`、`PYTHON` 指定端口、数据库位置和 Python 路径。本地服务只监听回环地址，验证 Host / Origin，删除来访者伪造的平台身份头；同源浏览器使用本地维护身份。

线上使用相同接口核心与平台数据库，依赖平台转发的登录身份。所有数据以当前使用者为所有者隔离，不按提交内容中的项目名授予跨使用者访问权。初始部署仅本人可访问。扩大网站受众前须重新评审使用场景；不能把自托管反向代理传来的任意身份头直接当可信身份。

## 一次完整使用

1. 客户端视角填写项目名、选择工作类型与行业，逐项自查。未知写“给不出”。
2. 提交后获取一个总回执和每个类型的编号。有发布包的类型给出下载链接和接入提示；缺口给出通用骨架。
3. 服务端在列表里打开同一编号，阅读材料，保存处理状态、说明和关联包。只有实际发布目录中的包能被关联为“有包可用”。维护者可以重新调整状态；每次变化都留历史。
4. 在项目本地安装材料、接入宿主并运行检查。页面或客户端分别记录安装、接入、加载、触发、检查、验收、交付的证据。记录可追加更正，服务不代跑、不替提交者背书。
5. 规范或检查器问题用反馈入口登记，再按编号查询。提交者可以撤回；维护者可以重新打开。

当前可下载 `delivery-data-app 0.1.0` 和 `second-loop-compounding 0.1.0`。零售和病理仍只有骨架，企业交付先指向材料。包目录采用明确白名单；不能把所有存在安装清单的目录都当已验证的下载包。

本实现独立于之前下游使用的在线菜单部署：不继承其票据、令牌、包版本或私有数据，不替换它的服务地址。

## 项目客户端

从页面下载 `menu.py`，或使用仓库的 `scripts/menu.py`。在工作台为项目创建令牌，将其保存在项目外的 `CG_MENU_TOKEN` 环境变量或 `~/.config/cg-workbench/token` 文件中。项目名必须与令牌授权的项目完全相同。

```sh
# 在项目根目录运行；CG_MENU_URL 默认本机服务
python /path/to/menu.py checklist
python /path/to/menu.py packs
python /path/to/menu.py submit /tmp/answers.json
python /path/to/menu.py install delivery-data-app
python /path/to/menu.py status T-回执中的编号
python /path/to/menu.py feedback --project 项目名 --category validator --where 页面 --text 看到的现象
python /path/to/menu.py evidence T-回执中的编号 --stage checked --text '检查命令、结果和证据位置'
python /path/to/menu.py resend
```

答案模板由 `checklist` 返回。只提交显式填写的内容和已安装版本，不扫描上传仓库。每次提交在发送前写入项目外的待补交目录；响应丢失或进程中断后重交沿用同一标识，服务不会重复登记。待补交文件绑定原服务地址，不会自动发到其他服务。成功拿到回执后才删除暂存。

**私有 Sites 地址有外层网页登录保护**，普通命令行请求不能仅凭项目令牌穿过这层登录。网页内的提交、处理、下载、记录功能可直接使用；命令行完整链路用于本机或另行正确配置身份入口的自托管服务。不要复制网页登录 cookie 来绕过登录层。本地和线上数据库是两个独立实例，不会隐式同步。

客户端下载同源包，校验摘要后再解压安装。拒绝跳转转发令牌、越界路径、Windows 锚定路径、符号链接、重复成员、过大归档和不在指定包范围内的文件。安装器在写入前预检全部映射；失败不能记录为成功安装。

## 接口与权限

| 接口 | 用途 | 权限 |
|---|---|---|
| `GET /v1/checklist`、`GET /v1/packs` | 清单、模板、发布包目录 | 服务公开读取；线上另受平台访问策略保护 |
| `POST /v1/requests` | 自查或反馈；带 `client_request_id` | 当前使用者或指定项目令牌 |
| `GET /v1/tickets` | 搜索、项目 / 状态筛选、每页 50 条 | 仅自己可见记录；令牌再限项目 |
| `GET /v1/tickets/:id` | 回执内容、当前状态、历史 | 同上 |
| `POST /v1/tickets/:id` | 维护状态、关联包，或撤回 | 维护操作仅浏览器所有者；项目令牌可撤回自己的项目请求 |
| `POST /v1/tickets/:id/evidence` | 追加本地执行证据 | 同项目读取权限 |
| `POST /v1/tokens`、`POST /v1/tokens/:id/revoke` | 创建 / 撤销项目令牌 | 当前使用者的维护视角 |

所有 SQL 使用参数绑定。多表写入在同一事务中完成。状态更新带 revision，旧页面不能静默覆盖别人刚保存的处理。令牌只存摘要，原文只返回一次。生产迁移由平台应用，本地由启动入口按迁移名记录，应用请求不修改表结构。

## 验证与交付

```sh
pnpm build
pnpm test
python -m unittest discover -s scripts/tests -q
python stable/packs/delivery-data-app/validators/data-app-norms-check/scripts/check_data_app_norms.py web/index.html
```

测试包含真实 HTTP 与独立 Python 客户端的完整链路、服务重启后的持久性、并发重试幂等、跨使用者 / 项目隔离、令牌撤销、并发状态冲突、搜索分页、跨站请求及归档校验。原安装器两个 Mac 路径判据已修复实现并保留测试要求。

网页提供可选的只读 WebMCP 列表与详情工具。浏览器不支持时，普通按钮和表单照常工作。已在本机支持 WebMCP 的宿主验证两个工具的注册、正常调用和无效输入拒绝，另外以模拟页面测试覆盖同一界面状态。布局包含手机断点和长文本换行；本次功能验证不替代尚未执行的浏览器视觉验收。

设计稿见 [六段设计](design/2026-09-26-cg协作工作台.md)。既有离线图表继续保留在 [collaboration-map.html](collaboration-map.html)。
