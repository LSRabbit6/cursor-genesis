# 独立部署 CG

CG 的运行、身份、记录和接口不依赖 ChatGPT、Cursor 或任何模型平台账号。人用 CG 管理密钥登录，harness 用分别签发的项目令牌。当前提供一个维护空间；尚未实现多人账号注册和企业单点登录。

## 在自己的服务器启动

需要 Node.js 22.13+（建议使用已验证的 24 系列）、构建时需要 Python 3.10+。没有 Node 运行时第三方依赖。以下从仓库根目录运行；示例域名须换成自己的。

```sh
node scripts/build-workbench.mjs
node scripts/init-access.mjs /var/lib/cg/access.json
CG_ACCESS_FILE=/var/lib/cg/access.json \
CG_ORIGIN=https://cg.example.com \
CG_DB=/var/lib/cg/workbench.sqlite \
node service/standalone.mjs
```

初始化只显示一次随机管理密钥，保存到密码管理器。配置文件只保存 SHA-256 摘要和维护空间标识，权限为 0600；使用服务运行账号生成和读取。程序不会覆盖已有配置。不要把管理密钥给 harness，不要提交配置和数据库到 Git。

默认监听 `127.0.0.1:4317`，前面使用 HTTPS 反向代理。`deploy/Caddyfile.example` 给出最小示例：将域名解析到服务器、配置 TLS，并保留原始 Host。CG 使用显式配置的 `CG_ORIGIN` 校验请求，不读取代理提供的用户身份头，也不根据转发头猜测站点地址。不要把后端 HTTP 端口直接公开。`CG_HOST` 和 `PORT` 可调整监听地址。

在本机体验独立登录可改用 `CG_ORIGIN=http://127.0.0.1:4317`，并将配置和数据库放入用户有权限的目录。外部 HTTP origin 会被拒绝。`node service/local.mjs` 是另一个仅本机入口，同源浏览器可直接使用，不应作为公网启动方式。

打开自己的域名，进入 CG 登录页，输入管理密钥即可使用。会话使用 HttpOnly、SameSite=Strict cookie；HTTPS 下加 Secure，8 小时过期，退出立即失效。会话保存在服务内存，重启后需重新登录；项目令牌和业务记录持久化，不受影响。错误密钥连续尝试 10 次后等待一分钟。当前为单进程 SQLite 部署，不能用多副本内存会话假装水平扩容。

## 容器构建

```sh
docker build --build-arg CG_SOURCE_COMMIT="$(git rev-parse HEAD)" -t cg-workbench .
docker volume create cg-data
docker run --rm --name cg-workbench \
  -p 127.0.0.1:4317:4317 \
  -e CG_ORIGIN=https://cg.example.com \
  -e CG_ACCESS_FILE=/run/cg/access.json \
  -v /var/lib/cg/access.json:/run/cg/access.json:ro \
  -v cg-data:/data \
  cg-workbench
```

容器使用非 root 用户 `node`（UID 1000）。确保访问配置只对该服务用户可读；不要把文件权限改成全员可读。`CG_SOURCE_COMMIT` 要与构建目录对应，用于包目录溯源。容器不复制 Git 元数据、Sites 配置或本机数据库。本轮在 Docker Desktop 的 Linux ARM64 容器中完成构建、非 root 启动、登录、项目令牌、提交与重启持久化验证。目标主机的域名、反向代理和 TLS 仍需部署时验证。

## 接入多种 harness

在“多 harness 接入”中，填相同的项目名，为不同 harness 分别创建令牌并填写接入名称。例如一个令牌给 Cursor，另一个给 Codex，第三个给自己的脚本。名字不授予权限；身份由令牌确定。设置各自的 `CG_MENU_URL`、`CG_MENU_TOKEN` 即可使用同一个 `scripts/menu.py`。能调用 HTTP 的 harness 也可以直接使用 [接入契约](harness-api.md)。这些名称只是接入示例，不宣称已开发或验证每个平台的专用插件。

同项目令牌能读取同一项目的回执、追加证据、撤回需求，不能创建令牌或执行维护者的状态处理。不同项目隔离；撤销一个接入不影响另一个。事件 actor 保存令牌编号，可与接入列表对应追溯。

## 更新、备份与恢复

更新代码并重新构建后重启。启动时依次运行尚未应用的 SQLite 迁移；此次仅为令牌补上名称，旧令牌继续有效。更新前停服务并备份整个数据目录（含 SQLite WAL/SHM 文件）和访问配置；恢复时使用备份对应的代码/迁移版本。不要只复制正在写入的 SQLite 主文件。

管理密钥遗失或需轮换时，用 `init-access.mjs` 创建另一个配置文件，保持相同维护空间标识，修改 `CG_ACCESS_FILE` 并重启。旧浏览器会话随重启失效，已有 harness 令牌不自动撤销；需要时在页面逐个撤销。

默认维护空间标识为 `local-owner`，延续已有本机记录。原 Sites 线上数据属于另一实例与平台身份，**不会自动复制或映射**。本次没有迁移该平台的数据或切换旧网址。根目录 `.openai/hosting.json` 只保留历史部署关联，独立构建不读取它；不得把私有 `chatgpt.site` 链接当作独立版接入地址。
