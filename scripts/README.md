# Legacy Code Scanner (遗留代码批量扫描工具)

用 LLM 批量分析 Java/Vue 遗留代码，提取结构化信息，生成"代码画像"。

## 用途

- 快速了解遗留项目的代码结构
- 识别哪些是标准模板代码，哪些是自定义业务逻辑
- 为 AI Migration Team 提供输入数据

## 依赖

```bash
pip install -r legacy_scanner_requirements.txt
```

## 使用方式

```bash
# 基本用法
python legacy_scanner.py --target /path/to/legacy/project

# 完整参数
python legacy_scanner.py \
    --target /path/to/project \
    --output my_report \
    --workers 10 \
    --api-key sk-xxx \
    --base-url https://api.deepseek.com/v1 \
    --model deepseek-chat
```

## 环境变量

可通过环境变量配置默认值：
- `LLM_API_BASE`: API 地址（默认 DeepSeek）
- `LLM_API_KEY`: API Key
- `LLM_MODEL`: 模型名称

## 输出

- `{output}.json`: 完整的结构化分析结果
- `{output}.csv`: 扁平化摘要，方便筛选

## 配套提示词

此工具依赖以下提示词文件（2026-10-22 随 standalone/ 归档到 `archive/2026-10-22/stable/atoms/standalone/legacy/`。另：脚本里 `PROMPT_LIB` 从 02-25 搬进现位置起就算到了仓库外面，这两份提示词一直没读到，用前先改路径）：
- `standalone/legacy/java-excavator.md` - Java 文件分析
- `standalone/legacy/vue-inspector.md` - Vue 文件分析
