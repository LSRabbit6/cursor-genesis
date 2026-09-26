import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { digest } from "../service/access.mjs";

const path = process.argv[2];
const owner = process.argv[3] || "local-owner";
if (!path || process.argv.length > 4 || !owner.trim() || owner.length > 120) {
  console.error(
    "用法：node scripts/init-access.mjs /项目外/access.json [维护空间标识]",
  );
  process.exit(1);
}
const key = "cg_admin_" + randomBytes(32).toString("base64url");
try {
  await mkdir(dirname(resolve(path)), { recursive: true, mode: 0o700 });
  await writeFile(
    path,
    JSON.stringify({ version: 1, owner, key_hash: digest(key) }, null, 2) +
      "\n",
    { flag: "wx", mode: 0o600 },
  );
  console.log(
    `配置已保存到 ${resolve(path)}。管理密钥只显示这一次，请保存到密码管理器：\n${key}\n不要将管理密钥交给 harness；请在网页为每个接入创建项目令牌。`,
  );
} catch (error) {
  console.error(
    error.code === "EEXIST"
      ? "文件已存在，没有覆盖。轮换时请使用新路径，并保留原维护空间标识。"
      : "无法写入访问配置：" + error.message,
  );
  process.exit(1);
}
