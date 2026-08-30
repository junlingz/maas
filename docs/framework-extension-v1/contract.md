# MaaS 框架扩展参数配置契约 v1

状态：当前实施契约。原“ZIP + Python 入口 + Smoke Test”草案已被需求评审结论替代，不得继续作为开发或验收依据。

规则集：`extension-params/1.0.0`

## 1. 输入边界

- 单次只接收一个 UTF-8 `.yaml/.yml` 文件，大小 1 B～64 KB。
- 输入是平台内置能力的参数配置，不是扩展程序。
- 禁止 ZIP/TAR、Python、依赖包、二进制、脚本、命令、凭证和任意可执行内容。
- 调试过程只做确定性静态解析与映射，不启动容器、训练任务或测试任务，不加载样本，不申请 GPU。

## 2. YAML 信封

```yaml
schema_version: "maas.extension-params/v1"
template_id: "optimizer"
template_version: "1.0.0"
extension_name: "自适应优化器"
extension_type: "optimizer"
parameters:
  optimizer: "AdamW"
  learning_rate: 0.00002
  weight_decay: 0.01
  lr_scheduler_type: "cosine"
```

根节点只能包含以上六个字段，且均为必填。信封 JSON Schema 见同目录 `manifest.schema.json`；具体 `parameters` 的字段、类型、范围、枚举、步长和映射由 `template_id + template_version` 对应的服务端模板 Schema 决定。

## 3. 解析器配置

服务端与前端必须保持以下行为一致：

1. YAML 1.2 Core Schema、strict 模式、键必须为字符串、重复键报错。
2. 禁止自定义 tag、merge key、anchor 和 alias；别名解析上限设为 0。
3. 根节点必须为对象；最大深度 6、最大节点 128、单个字符串最大 1024 字符。
4. 禁止多文档输入；解码失败或包含 NUL 控制字符直接拒绝。
5. 不做字符串到数字、浮点数到整数等隐式类型转换。

## 4. 模板参数契约

每个模板参数必须声明：

- `key`、展示名和强类型（`string`、`integer`、`float`）；
- 默认值；
- 数字的闭区间、步长和可选建议区间，或字符串枚举；
- 唯一的训练字段 `mappingPath`。

当前模板映射：

| 模板 | 参数 | 规则 | 训练字段 |
|---|---|---|---|
| `lora-algorithm` | `rank` | integer，1～256，步长 1，建议 8～64 | `training.method.lora.rank` |
| `lora-algorithm` | `alpha` | integer，1～512，步长 1 | `training.method.lora.alpha` |
| `optimizer` | `optimizer` | AdamW / Adam / SGD / Adafactor | `training.optimizer.name` |
| `optimizer` | `learning_rate` | float，0.000001～1，步长 0.000001 | `training.optimizer.learning_rate` |
| `optimizer` | `weight_decay` | float，0～1，步长 0.001 | `training.optimizer.weight_decay` |
| `optimizer` | `lr_scheduler_type` | cosine / polynomial / constant_with_warmup | `training.optimizer.scheduler` |
| `dialogue-processing` | `maxTurns` | integer，1～256，步长 1 | `training.data.max_turns` |
| `dialogue-processing` | `deduplicate` | 关闭 / 精确匹配 / 归一化匹配 | `training.data.deduplicate` |
| `domain-evaluation` | `threshold` | float，0～1，步长 0.01 | `training.evaluation.threshold` |

未知参数、缺失参数、类型错误、越界值、步长不对齐和枚举外值均为阻断错误；进入建议区间之外但仍在合法区间内仅产生警告。

## 5. 安全规则

- 六个根字段之外出现任何字段均阻断。
- `parameters` 的值只能是标量，数组和对象均阻断。
- 原文出现 YAML tag、anchor、alias 或 merge key 语法均阻断。
- 字段名命中 `script`、`command`、`entrypoint`、`module`、`import`、`eval`、`exec`、`runtime`、`dependency`、`permission`、`network`、`filesystem` 均阻断。
- 文本命中 PEM 私钥头、AWS Access Key、`sk-` 类令牌、或 `password/secret/token/private_key/access_key` 赋值模式均阻断。

这些检查用于防止配置通道被滥用，不构成对任意代码的安全认证，因为本契约根本不接收代码。

## 6. 调试报告与判定

五类结果固定为「文件与语法、模板兼容性、参数合法性、安全性、训练参数映射」，不可用单元测试、集成测试或性能测试替代。

报告至少包含：版本 ID、文件名、文件 SHA-256、规则集版本、开始/结束时间、总耗时、五类结果、每条发现的规则 ID/严重级别/字段路径/问题说明/修复建议，以及规范化参数和映射预览。

- 存在任一 `ERROR`：`failed`，禁止启用。
- 不存在 `ERROR`：`passed`；`WARNING` 可保留但不阻断。
- 上传成功只进入 `pending`；必须由用户显式发起调试。
- 调试通过后可直接启用，不再重复展示一套参数编辑或“确认启用”步骤。

## 7. 生产接口

```http
POST /api/v1/framework-extension-configs/{version_id}/debug
GET  /api/v1/framework-extension-configs/debug-jobs/{job_id}
```

生产后端必须复用同一模板 Schema 和规则集；不得只信任前端结果。目标：64 KB 合法文件的 P95 判定时间不超过 2 秒，服务端硬超时 5 秒；调试报告和输入摘要至少保留 180 天。

## 8. 训练任务引用

任务快照必须固化扩展配置 ID、版本、文件 SHA-256、规则集版本、模板 ID/版本、规范化参数和训练字段映射。任务提交时服务端再次校验快照；配置停用或升级不得改变历史任务。

在后端上传、调试、启用、任务提交二次校验和持久化证据齐全前，只能称为“原型中可执行的配置校验”，不能称为“平台链路已交付”。
