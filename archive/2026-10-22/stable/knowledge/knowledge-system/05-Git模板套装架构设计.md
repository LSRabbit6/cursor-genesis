# Git 模板套装架构设计

## 元信息
- 创建日期：2026-02-23
- 状态：方案设计阶段，待落地验证
- 依赖：Git 2.25+（推荐 2.53.0）

---

## 一、核心设计理念

### 1.1 两层架构：原子层 + 套装层

| 层级 | 定位 | 特点 |
|------|------|------|
| atoms（原子层） | 最小可复用单元 | 细粒度、跨套装复用、无场景绑定 |
| packs（套装层） | 场景化组合 | 面向用户、开箱即用、可定制 |

### 1.2 设计原则

1. **原子不感知场景**：一个 prompt 不知道自己会被哪个 pack 用
2. **套装面向用户**：用户只需选 pack，不需要了解原子细节
3. **manifest 声明依赖**：交叉引用通过声明解决，不复制文件
4. **overrides 支持定制**：套装可补充/覆盖原子内容
5. **版本可控**：pack 有版本号，项目可锁定

---

## 二、目录结构模板

```
template-repo/
├── atoms/                    # 原子层（最小可复用单元）
│   ├── prompts/              # 原子提示词
│   │   ├── code-review.md
│   │   ├── git-commit.md
│   │   ├── refactor.md
│   │   └── ...
│   ├── rules/                # 规则文件
│   ├── skills/               # 技能定义
│   ├── commands/             # 命令定义
│   ├── subagents/            # 子代理配置
│   └── hooks/                # 钩子脚本
│
├── packs/                    # 套装层（场景化组合）
│   ├── frontend-dev/         # 示例：前端开发套装
│   │   ├── manifest.yaml     # 声明用了哪些 atoms
│   │   ├── README.md         # 使用说明
│   │   └── overrides/        # 套装专属覆盖/补充
│   │
│   ├── code-review/          # 示例：代码审查套装
│   │   └── manifest.yaml
│   │
│   └── full-stack/           # 示例：全栈套装
│       └── manifest.yaml
│
├── experiences/              # 业务经验沉淀（知识库，可选）
│   ├── debugging/
│   ├── architecture/
│   └── ...
│
└── index.yaml                # 全局索引（可选）
```

---

## 三、manifest.yaml 规范

```yaml
# packs/<pack-name>/manifest.yaml

# 基础信息
name: frontend-dev
description: 前端开发全套配置
version: 1.2.0
author: your-name
tags: [frontend, react, typescript]

# 目标用户（可选，用于多版本区分）
audience: intermediate  # beginner | intermediate | advanced

# 引用原子层
atoms:
  prompts:
    - code-review
    - git-commit
    - refactor
  rules:
    - typescript
    - react-best-practice
  skills:
    - component-generator
  commands:
    - build
    - test
  subagents: []
  hooks: []

# 套装专属内容（不在 atoms 里的补充文件）
includes:
  - overrides/

# 继承其他套装（可选）
extends:
  - base-dev

# 与其他套装的冲突声明（可选）
conflicts:
  - legacy-frontend
```

---

## 四、多版本/多用户群体支持

### 4.1 场景

- v1（beginner）：一句话搞定，不暴露细节
- v2（advanced）：完全掌控，可自由组合

### 4.2 实现方式

**方案 A：同仓库多 pack**

```
packs/
├── frontend-simple/      # 面向新手，打包好的
│   └── manifest.yaml     # audience: beginner
└── frontend-advanced/    # 面向高手，细粒度
    └── manifest.yaml     # audience: advanced
```

**方案 B：同 pack 多 profile**

```yaml
# manifest.yaml
profiles:
  simple:
    atoms:
      prompts: [all-in-one]  # 一个大而全的提示词
  advanced:
    atoms:
      prompts: [code-review, git-commit, refactor, ...]  # 细分
```

使用时：
```bash
./install-pack.sh frontend-dev --profile=simple
./install-pack.sh frontend-dev --profile=advanced
```

**方案 C：分支/标签隔离**

```bash
git checkout v1-beginner   # 简化版
git checkout v2-advanced   # 完整版
```

### 4.3 命名演进支持

如果 v1 叫 `prompt-library`，v2 改名叫 `ai-toolkit`：

```yaml
# index.yaml 或 manifest.yaml
aliases:
  prompt-library: ai-toolkit  # 旧名 → 新名映射
  team: pack                  # 概念重命名
```

---

## 五、Git 操作命令

### 5.1 项目引入套装

```bash
# 克隆模板仓库（稀疏 + 部分克隆）
git clone --filter=blob:none --sparse https://github.com/you/template.git .template
cd .template

# 只拉取指定 pack 及其依赖的 atoms
git sparse-checkout set packs/frontend-dev atoms/prompts atoms/rules atoms/skills
```

### 5.2 更新套装

```bash
cd .template
git pull origin main

# 如果是子模块方式
git submodule update --remote --merge
```

### 5.3 回流改进

```bash
cd .template
git add .
git commit -m "feat: 优化 code-review prompt"
git push origin feature/improvement
# 然后提 PR
```

---

## 六、install-pack.sh 脚本模板

```bash
#!/bin/bash
# install-pack.sh - 根据 manifest 自动配置 sparse-checkout

PACK_NAME=$1
PROFILE=${2:-default}
TEMPLATE_REPO="https://github.com/you/template.git"
TARGET_DIR=".template"

# 克隆（如果不存在）
if [ ! -d "$TARGET_DIR" ]; then
  git clone --filter=blob:none --sparse "$TEMPLATE_REPO" "$TARGET_DIR"
fi

cd "$TARGET_DIR"

# 读取 manifest，解析依赖的 atoms
MANIFEST="packs/$PACK_NAME/manifest.yaml"

# 提取所有需要的路径（需要 yq 工具）
PATHS=$(yq -r '
  "packs/'" + "$PACK_NAME" + '",
  (.atoms | to_entries[] | "atoms/" + .key + "/" + .value[])
' "$MANIFEST" | sort -u | tr '\n' ' ')

# 设置 sparse-checkout
git sparse-checkout set $PATHS

echo "✓ Pack '$PACK_NAME' installed"
```

---

## 七、交叉依赖处理

### 7.1 问题

pack-A 和 pack-B 都依赖 `atoms/prompts/code-review.md`

### 7.2 解决

**Git sparse-checkout 自动去重**：
```bash
git sparse-checkout set \
  packs/pack-A atoms/prompts/code-review \
  packs/pack-B atoms/prompts/code-review
# 实际只会检出一份 code-review.md
```

**manifest 层面**：各自声明，脚本合并去重

---

## 八、与现有资产的映射

| 现有资产 | 新架构位置 | 说明 |
|----------|------------|------|
| prompt-library | atoms/prompts/ | 拆成原子文件 |
| team | packs/<team-name>/ | 变成套装，用 manifest 声明组合 |
| rules | atoms/rules/ | 直接迁移 |
| skills | atoms/skills/ | 直接迁移 |
| commands | atoms/commands/ | 直接迁移 |
| subagents | atoms/subagents/ | 直接迁移 |
| hooks | atoms/hooks/ | 直接迁移 |
| 业务经验 | experiences/ 或 atoms/prompts/ | 看粒度决定 |

---

## 九、待定事项

- [ ] 确定 v1/v2 的用户分层策略（多 pack vs 多 profile vs 多分支）
- [ ] 确定命名规范（prompt-library → ? ）
- [ ] 设计 experiences 的组织方式
- [ ] 实现 install-pack.sh 完整版
- [ ] 考虑是否需要 GUI 或 CLI 工具辅助选择 pack

---

## 十、参考

- 关联文档：[预处理文档-gitworktree.md](../预处理文档-gitworktree.md)
- Git sparse-checkout 官方文档：https://git-scm.com/docs/git-sparse-checkout
- Git submodule 官方文档：https://git-scm.com/docs/git-submodule
