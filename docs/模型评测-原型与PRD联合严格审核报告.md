# 模型评测 HTML 原型与 PRD 联合严格审核报告

## 一、审核口径

- 唯一标书基线：[/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md)
- 原型项目：[/Users/a1/Documents/Z/08超大规模/原型/maas](/Users/a1/Documents/Z/08超大规模/原型/maas)
- 需求文档：[/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md)
- 审核日期：2026-07-20
- 审核方式：原始需求逐条拆解、原型源码核对、PRD 规则核对、http://127.0.0.1:5173/ 浏览器实测。
- 验收口径：HTML/React 原型负责表达页面、字段、按钮、状态和关键交互；PRD 负责说明生产实现中的业务逻辑、接口、权限、状态机、异常和验收标准。不因原型使用演示数据或前端模拟交互判定不满足。

## 二、结论与统计

**当前不能声称“原型与需求文档完全满足标书要求”。** 60 条明确要求中，53 条已通过原型、PRD或二者联合形成完整证据，7 条部分满足，未发现完全没有覆盖的要求。

| 结论 | 数量 |
|---|---:|
| 完全满足（聚合） | 53 |
| 其中：原型展示满足 | 31 |
| 其中：PRD说明满足 | 1 |
| 其中：原型与PRD联合满足 | 21 |
| 部分满足 | 7 |
| 不满足 | 0 |
| 无法验证 | 0 |
| **总要求数** | **60** |

## 三、Findings

### P0

无。按本次原型阶段口径，缺少真实后端、数据库、队列或鉴权不构成 P0。

### P1

1. **R-026：模型对比被无依据限制为最多 4 个。** 原文只规定“两个或多个”，未规定上限；页面、PRD字段、提示和验收标准都强制 2–4 个。[原型](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1390) [PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:528)
   修复对象：**页面 + PRD**。删除最多 4 个限制、N/4 和第 5 个阻断规则，改为“至少选择 2 个”；通过横向滚动、列虚拟化或分页处理更多模型。如果确需上限，须取得招标需求方书面确认。

2. **R-029：并排对比未完整表达“每个模型栏内包含指标卡片、关键图表和详细数据表”。** 当前是统一指标矩阵加一张叠加雷达图，没有每个模型栏内的独立关键图表和详细表。[原型](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1542) [PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:571)
   修复对象：**页面 + PRD**。在每个模型列增加核心指标摘要、小型关键图表和明细入口/表格，并明确所有模型列使用同一坐标范围。

3. **R-033：差异摘要只比较综合得分。** 原文要求明确指出具体哪些指标显著领先、哪些指标表现相当；页面仅输出综合得分差值，PRD也未给“显著/相当”的阈值规则。[原型](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1444) [PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:554)
   修复对象：**页面 + PRD**。定义逐指标判断阈值、指标方向和同分规则，摘要至少输出一条显著领先指标及一条相当指标；无对应指标时明确说明。

4. **R-034：公开数据集列表缺少引用信息。** 原文明确要求引用信息随列表展示；目前只在详情页显示。PRD字段表包含引用信息，但产品设计列出的列表字段又将其遗漏，开发口径不唯一。[原型列表](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:259) [原型详情](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:99) [PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:610)
   修复对象：**页面 + PRD**。列表增加“引用信息”摘要或“查看引用”入口，并同步补入 PRD 产品设计和验收标准。

5. **R-037：上传数据集必填规则和控件类型不一致。** 原文要求填写名称、描述、适用任务；页面将描述标为必填并在提交时校验，PRD却标为非必填。页面适用任务为单选，PRD定义为多选。[原型](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:205) [PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:655)
   修复对象：**页面 + PRD**。PRD将描述改为必填；适用任务统一为多选控件，或经需求方确认后将PRD统一为单选。

### P2

1. **R-008：任务成功状态显示不统一。** PRD声明统一状态为“成功”，任务列表和详情头也显示“成功”，但监控页显示“已完成”。原文两处示例本身分别出现“已完成”和“成功”，因此不是原文缺失，但当前交付物没有定义二者映射。[原型](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:969) [PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:917)
   修复对象：**页面或PRD**。最低成本是监控页统一显示“成功”；若保留“已完成”，PRD必须明确它只是阶段文案，不是任务状态枚举。

2. **R-041：共享弹窗与PRD字段模型、按钮文案不一致。** PRD将“共享范围”和“共享权限”分开，并规定保存按钮为“确定”；页面把“私有”放进共享权限下拉框，使用“保存”按钮。[原型](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:230) [PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:711)
   修复对象：**页面**。按PRD拆成“私有/资源组内共享/指定成员共享”和“只读/可编辑”两个字段，保存按钮改为“确定”。

### P3

无。原文未约束的通用按钮色值、圆角、字号、卡片间距和布局密度均未判错。

## 四、浏览器实测结果

- 已实测菜单：评测任务、评测数据、模型对比、配置方案、评测文档。
- 已实测流程：创建任务抽屉、语言/多模态联动、任务详情、执行监控、结果看板、指标下钻、公开数据集详情、上传数据集、共享设置、流程模板编辑、版本历史与回滚、API文档、在线调试表单、代码示例、全文搜索高亮。
- 明确颜色要求：对比页最优项为绿色、最差项为红色，已符合原文；指标卡也使用颜色表达优劣，符合“颜色或箭头”的任选要求。
- 未发现浏览器访问限制。本次未上传真实业务文件，也未触发会修改交付物的下载或提交动作。

## 五、完整逐条审核矩阵

### 5.1 多类型模型测评

| ID | 原文摘要 | 原型证据 | PRD证据 | 结论 | 差异 | 最低成本修复 |
|---|---|---|---|---|---|---|
| R-001 | 可选择“语言模型”。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:10) | 创建任务提供“语言模型”。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:769) | 模型类型枚举。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:131) | 原型展示满足 | 无 | 无 |
| R-002 | 可选择“多模态模型”。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:12) | 创建任务提供“多模态模型”。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:769) | 模型类型枚举。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:131) | 原型展示满足 | 无 | 无 |
| R-003 | 切换类型动态更新任务、数据集并提示。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:14) | 浏览器实测切换后任务变为图文描述、视觉问答、文档解析；代码同步联动数据集和指标。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:550) | 明确动态更新和移除不匹配项。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:147) | 原型展示满足 | 无 | 无 |
| R-004 | 可选择一个或多个评测任务。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:18) | 任务类型按钮支持多选。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:785) | 任务类型定义为多选。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:132) | 原型展示满足 | 无 | 无 |
| R-005 | 指定模型版本，支持API地址或已注册模型。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:20) | 提供系统已部署模型、外部模型API、版本、地址、Model Key和测试连接。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:810) | 写明部署实例、API地址、鉴权、Header和Model Key规则。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:179) | 联合满足 | 无 | 无 |
| R-006 | 可配置最大Token、温度、Top-K等基础参数。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:22) | 参数输入、默认值和范围均可演示。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:912) | 定义字段、范围、默认值和越界提示。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:140) | 原型展示满足 | 无 | 无 |
| R-007 | 点击“开始测评”，校验后提交后台队列。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:26) | 按钮名称准确，提交后进入监控形态。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:949) | 写明必填校验、模型和数据集校验、任务ID、异步队列及失败处理。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:120) | 联合满足 | 无 | 无 |
| R-008 | 进度条、状态标签和实时日志展示当前阶段。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:28) | 监控页有状态、时间线、进度和滚动日志。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1084) | 规定状态机、5秒轮询、日志和异常重试。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:325) | 部分满足 | 监控页“已完成”与PRD统一状态“成功”不一致。 | 页面改“成功”，或PRD定义显示别名。 |
| R-009 | 实时展示GPU、内存等资源占用。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:30) | 资源区包含GPU、显存、CPU、内存和队列位置。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1114) | 字段、展示条件、采集流程和验收均明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:334) | 联合满足 | 无 | 无 |

### 5.2 测评任务管理

| ID | 原文摘要 | 原型证据 | PRD证据 | 结论 | 差异 | 最低成本修复 |
|---|---|---|---|---|---|---|
| R-010 | 列表展示ID、名称、模型类型与版本、时间、状态、操作人。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:37) | 所有字段均在组合列中展示。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1342) | 字段和组合展示规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:62) | 原型展示满足 | 无 | 无 |
| R-011 | 按创建时间、状态排序；按状态、类型、日期筛选。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:39) | 两个表头可排序，三类筛选可操作。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1268) | 交互和默认排序明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:77) | 原型展示满足 | 无 | 无 |
| R-012 | 任务ID或名称实时搜索。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:41) | 输入即过滤并支持清空。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1315) | 实时过滤和空结果文案明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:78) | 原型展示满足 | 无 | 无 |
| R-013 | “查看”进入完整配置、日志和结果详情。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:45) | “查看”按钮及任务概览、执行监控、评测结果、评测报告四页签可用。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1029) | 查询对象、快照、权限和异常规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:377) | 联合满足 | 无 | 无 |
| R-014 | 运行中或排队中显示“停止”，确认后发停止指令。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:47) | 按状态展示“停止”，有“停止评测任务”确认弹窗。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1362) | Worker取消信号、状态流转、失败提示明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:350) | 联合满足 | 无 | 无 |
| R-015 | 已完成或失败显示“删除”，确认后移除记录。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:49) | 成功/失败显示“删除”，有确认弹窗。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1364) | 删除条件、数据库处理、权限和异常明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:83) | 联合满足 | 无 | 无 |
| R-016 | 时间轴/流程图展示各阶段起止时间。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:53) | 监控页展示任务创建至任务完成各阶段开始/结束时间。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:970) | 生命周期字段和Worker持续写入机制明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:330) | 联合满足 | 无 | 无 |
| R-017 | 可滚动实时日志，覆盖加载、预处理、推理、计算和错误。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:55) | 日志区可滚动并支持暂停自动滚动。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1085) | 日志写入、轮询、错误红色和失败原因明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:344) | 联合满足 | 无 | 无 |
| R-018 | 完整回显创建时所有配置参数。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:57) | 概览回显模型、部署实例、Model Key、数据集版本、指标权重和推理参数。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1003) | 快照、不受后续变更影响及脱敏规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:386) | 联合满足 | 无 | 无 |

### 5.3 自动化报告与可视化

| ID | 原文摘要 | 原型证据 | PRD证据 | 结论 | 差异 | 最低成本修复 |
|---|---|---|---|---|---|---|
| R-019 | 成功后自动生成PDF/HTML，列表提供“下载报告”。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:64) | 成功任务显示“下载报告”，详情有报告页。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1363) | 自动触发、状态、HTML/PDF生成、失败重试和权限明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:423) | 联合满足 | 无 | 无 |
| R-020 | 报告含概述、模型、数据集、指标、分项分析、结论建议。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:66) | 报告模板包含全部章节。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:148) | 报告章节、数据快照和验收明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:441) | 联合满足 | 无 | 无 |
| R-021 | 核心指标卡用颜色或箭头标识优劣。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:70) | 指标卡以绿色/橙色和评价文案区分表现。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1137) | 指标卡和颜色表达规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:496) | 原型展示满足 | 无 | 无 |
| R-022 | 提供雷达图、柱状图、折线图。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:72) | 三类图表均可见或切换。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1141) | 明确三类图表及对应数据。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:499) | 原型展示满足 | 无 | 无 |
| R-023 | 图例显隐、悬停详情、缩放和平移。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:74) | 图例复选、Tooltip、缩放和左右平移控件齐全。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1141) | 交互和验收明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:496) | 原型展示满足 | 无 | 无 |
| R-024 | 点击指标打开侧栏/弹窗，展示计算、子项得分和样本分布。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:78) | 浏览器实测指标详情抽屉含三类内容。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1191) | 指标下钻字段和适用范围明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:500) | 原型展示满足 | 无 | 无 |
| R-025 | 图表数据或指标表导出CSV/Excel。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:80) | 提供“导出 CSV”“导出 Excel”。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1133) | 导出范围、错误和生产制品规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:501) | 原型展示满足 | 无 | 无 |

### 5.4 模型对比分析

| ID | 原文摘要 | 原型证据 | PRD证据 | 结论 | 差异 | 最低成本修复 |
|---|---|---|---|---|---|---|
| R-026 | 专门入口，勾选两个或多个已完成任务。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:87) | 有专门入口和成功任务复选，但强制最多4个。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1390) | 明知原文无上限仍将2–4写入字段和验收。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:532) | 部分满足 | 无依据收窄为最多4个。 | 页面和PRD删除上限。 |
| R-027 | 指定统一数据集和任务作为对比基准。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:89) | 数据集、版本、任务三个基准可选，不兼容任务禁用。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1500) | 共同基准和异常规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:552) | 联合满足 | 无 | 无 |
| R-028 | 保存并复用对比场景。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:91) | 保存、场景列表、复用和删除入口齐全。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1458) | 保存字段、系统处理和异常明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:542) | 联合满足 | 无 | 无 |
| R-029 | 每个模型一栏，栏内含指标卡、关键图表和详细数据表。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:95) | 现有固定列矩阵和全局雷达图未达到每栏独立内容要求。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1542) | 仅描述固定列核心指标表、全局雷达和分项表。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:571) | 部分满足 | 缺每个模型栏内的关键图表和详细数据表。 | 页面和PRD补每栏内容。 |
| R-030 | 所有图表坐标范围一致。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:97) | 叠加雷达图统一0–100。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1576) | 统一范围为系统规则和验收项。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:567) | 原型展示满足 | 无 | 无 |
| R-031 | 差异表以绿色最优、红色最差或箭头标记排名。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:101) | 浏览器实测绿色最优、红色最低，高亮可开关。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1549) | 指标方向和颜色规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:561) | 原型展示满足 | 无 | 无 |
| R-032 | 多模型数据叠加同一雷达图并用不同颜色区分。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:103) | 多条不同颜色雷达线和图例已实现。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1576) | 对比结果要求明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:572) | 原型展示满足 | 无 | 无 |
| R-033 | 摘要指出具体指标显著领先或表现相当。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:105) | 只比较综合得分差值。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1444) | 未定义显著/相当阈值。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:554) | 部分满足 | 缺逐指标显著领先和相当判断。 | 页面和PRD补阈值与逐指标摘要。 |

### 5.5 测评数据集支持

| ID | 原文摘要 | 原型证据 | PRD证据 | 结论 | 差异 | 最低成本修复 |
|---|---|---|---|---|---|---|
| R-034 | 公开数据集列表展示简介、适用任务、版本和引用信息。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:112) | 列表有简介、任务和版本，引用仅在详情。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:259) | 字段表有引用，产品设计列表字段遗漏。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:610) | 部分满足 | 列表缺引用且PRD内部有歧义。 | 页面和PRD补引用摘要/入口。 |
| R-035 | 点击名称查看规模、领域、样例、指标建议。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:114) | 名称可点击，详情含全部要求及Schema。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:91) | 详情字段、加载失败和空样例规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:613) | 原型展示满足 | 无 | 无 |
| R-036 | 列出全部版本、标推荐版本并可选择特定版本。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:116) | 版本管理表和“选择此版本”可操作。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:101) | 推荐版本、历史版本选择和任务快照明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:608) | 联合满足 | 无 | 无 |
| R-037 | 点击“上传数据集”，填写名称、描述、适用任务并上传JSONL/CSV。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:120) | 按钮名称准确；页面将描述必填、适用任务单选。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:219) | 描述写为非必填，适用任务写为多选。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:655) | 部分满足 | 页面和PRD规则冲突。 | PRD将描述改必填；适用任务控件统一。 |
| R-038 | 上传后自动Schema校验并给结果和错误提示。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:122) | 可演示JSONL逐行、CSV表头/列数/必填值校验和错误行。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:129) | 后端Schema Validator、状态更新和异常规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:647) | 联合满足 | 无 | 无 |
| R-039 | 我的数据集状态为校验中/通过/失败，仅通过可用于任务。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:124) | 三种状态可见，创建任务只装载校验通过数据集。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:544) | 状态机、禁用和验收明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:661) | 联合满足 | 无 | 无 |
| R-040 | 创建任务时提供“公开数据集”“我的数据集”标签页。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:128) | 创建任务有两类数据源切换并按任务过滤。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:531) | 选择、权限变更和默认版本规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:228) | 原型展示满足 | 无 | 无 |
| R-041 | 我的数据集可共享给团队用户并设置只读/编辑。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:130) | 有共享对象与私有/只读/编辑控件，但字段分组和按钮与PRD不一致。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:230) | 定义范围、成员、只读/可编辑及“确定”。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:698) | 部分满足 | 原型把“私有”放入权限，按钮为“保存”。 | 页面按PRD拆字段并改“确定”。 |
| R-042 | 用户只能访问自己或被授权的数据集。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:132) | 公开/我的/共享给我三个视图表达可见范围。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/EvaluationData.tsx:257) | 明确创建者、ACL、资源组隔离、跨组例外、异常与验收。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:723) | PRD说明满足 | 无；后台规则无需在原型真实实现。 | 无 |

### 5.6 可配置化测评流程与指标

| ID | 原文摘要 | 原型证据 | PRD证据 | 结论 | 差异 | 最低成本修复 |
|---|---|---|---|---|---|---|
| R-043 | 四阶段流程、独立参数、调序、依赖提示、跳过非必要阶段。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:139) | 编辑器提供四阶段、上下移动、依赖错误和后处理开关。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1717) | 阶段依赖、可跳过、版本和验收明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:785) | 原型展示满足 | 无 | 无 |
| R-044 | 清洗/采样、Batch/温度/长度、指标和条件逻辑配置。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:141) | 各阶段对应控件齐全。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1727) | 阶段参数对象和校验明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:761) | 原型展示满足 | 无 | 无 |
| R-045 | 模板保存、加载、团队共享协作、版本控制和回滚。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:143) | 保存、应用到任务、资源组协作说明、版本历史、回滚入口齐全。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1738) | 保存快照、版本不可覆盖、历史任务隔离和异常明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:757) | 联合满足 | 无 | 无 |
| R-046 | 指标按生成、分类、匹配分类并包含指定指标。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:147) | 指标库包含生成、分类、匹配及BLEU/ROUGE/METEOR/Accuracy/Precision/Recall/F1。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1620) | 指标分类和适用任务规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:772) | 原型展示满足 | 无 | 无 |
| R-047 | 每个指标有说明、公式、场景和范围。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:149) | 指标卡tooltip和指标方案列表展示计算、场景、范围。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:898) | 字段、帮助说明和验收明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:278) | 原型展示满足 | 无 | 无 |
| R-048 | 多指标组合、权重和加权综合得分。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:151) | 支持多选、逐项权重、100%校验和综合分计算。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:905) | 公式、适用性、异常和验收明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:289) | 原型展示满足 | 无 | 无 |
| R-049 | “配置方案”页展示流程模板和指标组合方案。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:155) | 两个Tab及列表存在。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1684) | 页面入口、字段和产品设计明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:744) | 原型展示满足 | 无 | 无 |
| R-050 | 可重命名、修改内容或删除方案。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:157) | “编辑”支持修改名称和内容，列表提供删除。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1698) | 版本、引用冲突和删除异常明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:777) | 原型展示满足 | 无 | 无 |
| R-051 | 创建任务时选择方案，自动填充相关配置。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:159) | “应用到任务”和创建任务方案下拉均可回填。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:577) | 读取方案快照、自动填充和历史隔离明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:757) | 联合满足 | 无 | 无 |

### 5.7 技术文档与支持

| ID | 原文摘要 | 原型证据 | PRD证据 | 结论 | 差异 | 最低成本修复 |
|---|---|---|---|---|---|---|
| R-052 | 导航含快速入门、功能指南、最佳实践、常见问题。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:166) | 左侧目录完整包含指定模块。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1765) | 文档分类和布局明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:821) | 原型展示满足 | 无 | 无 |
| R-053 | 每种指标说明原理、优缺点、场景和参考文献。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:168) | 评测方法表覆盖当前支持的12项指标及六类信息。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1778) | 文档内容和验收明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:808) | 原型展示满足 | 无 | 无 |
| R-054 | 全文搜索、高亮匹配并列出相关页面。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:170) | 浏览器实测搜索“多模态”返回2个页面并用mark高亮。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1947) | 搜索标题与正文、无结果异常明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:830) | 原型展示满足 | 无 | 无 |
| R-055 | REST API列表与URL、方法、Header、参数、成功/失败响应。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:174) | 九个核心接口均展示上述内容。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1766) | 最小闭环接口、统一响应、权限和验收明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:817) | 联合满足 | 无 | 无 |
| R-056 | 页面填写参数、发送请求并查看响应。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:176) | 在线调试区有凭证、请求体、发送和响应区域。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1989) | 真实开发接口和未配置错误处理明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:929) | 联合满足 | 无；原型阶段不要求真实API成功。 | 无 |
| R-057 | 说明API Key/OAuth 2.0及不同权限范围。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:178) | 页面明确两种认证和只读/执行/管理权限范围。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1984) | RBAC、资源组和脱敏规则明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:837) | 联合满足 | 无 | 无 |
| R-058 | Python、cURL、Java完整调用流程。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:182) | 三语言切换，示例覆盖创建、轮询、结果和报告。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:1792) | 示例语言和典型流程明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:828) | 原型展示满足 | 无 | 无 |
| R-059 | 独立代码块和“一键复制”。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:184) | 独立代码块及“一键复制”按钮存在。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:2002) | 复制成功/失败反馈明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:830) | 原型展示满足 | 无 | 无 |
| R-060 | 可下载运行的脚本或Notebook。[原文](/Users/a1/Documents/Z/08超大规模/原始需求/模型评测原始需求.md:186) | 提供Python脚本和Jupyter Notebook下载入口。[源码](/Users/a1/Documents/Z/08超大规模/原型/maas/src/app/components/ModelEvaluation.tsx:2004) | 下载示例和生产接口要求明确。[PRD](/Users/a1/Documents/Z/08超大规模/原型/maas/docs/PRD-模型评测.md:808) | 原型展示满足 | 无 | 无 |

## 六、完全满足标书前的最小修改清单

1. 删除模型对比最多4个限制，保留“至少2个”。修改页面和PRD。
2. 模型对比每个模型列补核心指标卡、关键图表和详细数据表。修改页面和PRD。
3. 差异摘要改为逐指标输出，PRD定义“显著领先/表现相当”阈值。修改页面和PRD。
4. 公开数据集列表补引用摘要或入口，并写入PRD列表字段和验收标准。修改页面和PRD。
5. 上传数据集描述统一为必填；适用任务统一单选或多选。修改页面和PRD。
6. 监控页成功状态统一为“成功”，或在PRD定义“已完成”为阶段别名。修改页面或PRD。
7. 数据集共享弹窗按PRD拆分共享范围与权限，按钮改为“确定”。修改页面。

上述7项全部修复并重新回归后，才可以声明“模型评测原型与需求文档完全满足标书要求”。
