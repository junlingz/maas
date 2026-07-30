import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const evaluationSource = await readFile(new URL("../src/app/components/ModelEvaluation.tsx", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../src/app/components/EvaluationData.tsx", import.meta.url), "utf8");
const dataStoreSource = await readFile(new URL("../src/app/components/evaluationDatasetStore.ts", import.meta.url), "utf8");
const metricRecommendationSource = await readFile(new URL("../src/app/components/evaluationMetricRecommendations.ts", import.meta.url), "utf8");
const prdSource = await readFile(new URL("../docs/PRD-模型评测.md", import.meta.url), "utf8");
const metricRecommendationDoc = await readFile(new URL("../docs/模型评测-评价指标建议映射表.md", import.meta.url), "utf8");
const createDrawerSource = evaluationSource.slice(evaluationSource.indexOf("function CreateDrawer"), evaluationSource.indexOf("function TaskDetailPage"));
const configPageSource = evaluationSource.slice(evaluationSource.indexOf("export function EvaluationConfigPage"), evaluationSource.indexOf("function WorkbenchPage"));
const flowInferenceSource = configPageSource.slice(configPageSource.indexOf('{stage.enabled && stage.name === "模型推理"'), configPageSource.indexOf('{stage.enabled && stage.name === "后处理"'));

test("自定义数据集使用原始需求指定的上传文案、校验状态与权限", () => {
  assert.match(dataSource, />上传数据集</);
  assert.doesNotMatch(dataSource, />创建数据集</);
  for (const status of ["校验中", "校验通过", "校验失败"]) assert.match(dataSource, new RegExp(status));
  for (const field of ["数据集描述", "适用任务", "引用信息", "团队共享", "权限范围", "仅自己可见", "团队可见", "团队可编辑"]) assert.match(dataSource, new RegExp(field));
  assert.match(dataSource, /function UploadDatasetPage/);
  assert.match(dataSource, /await file\.text\(\)/);
  assert.match(dataSource, /JSON\.parse\(line\)/);
  assert.match(dataSource, /parseCsvLine/);
  assert.match(dataSource, /第 \$\{index \+ 1\} 行/);
  assert.match(dataSource, /disabled=\{!validation \|\| validation === "校验中"\}/);
  assert.match(dataSource, /onClick=\{submit\}>上传<\/PrimaryButton>/);
  assert.match(dataSource, /saveStoredEvaluationDataset\(row\)/);
  assert.match(evaluationSource, /loadStoredEvaluationDatasets\(\)/);
  assert.match(evaluationSource, /dataset\.status === "校验通过"/);
  assert.match(dataStoreSource, /window\.localStorage/);
  assert.doesNotMatch(dataSource, /20GB|20 GB/);
});

test("上传评测数据文件支持删除后重新上传", () => {
  assert.match(dataSource, /aria-label="删除已上传文件"/);
  assert.match(dataSource, /fileValidationRun\.current \+= 1/);
  assert.match(dataSource, /fileInput\.current\.value = ""/);
  assert.match(dataSource, /setFileName\(""\)/);
  assert.match(dataSource, /setValidation\(""\)/);
  assert.match(dataSource, /setValidationSummary\(""\)/);
  assert.match(dataSource, /setSample\(""\)/);
  assert.match(dataSource, /validationRun !== fileValidationRun\.current/);
  assert.match(prdSource, /删除已上传文件后重新选择/);
  assert.match(prdSource, /再次选择同名文件/);
});

test("数据集详情按任务映射展示评价指标建议和 Schema", () => {
  const detailSource = dataSource.slice(dataSource.indexOf("function DatasetDetailPage"), dataSource.indexOf("function EditDatasetPage"));
  assert.match(detailSource, /\["评价指标建议", suggestedMetricText\]/);
  assert.match(detailSource, /getSuggestedMetrics\(row\.tasks\)/);
  assert.doesNotMatch(detailSource, /row\.metrics\.join/);
  assert.match(detailSource, />Schema</);
  assert.match(detailSource, />字段结构</);
  assert.match(detailSource, /\{currentSchema\}/);
  assert.match(dataSource, /系统根据适用任务自动生成，不需要手动配置/);
  assert.match(prdSource, /评价指标建议根据适用任务自动生成且只读/);
  assert.match(metricRecommendationSource, /"文本理解": \["Accuracy", "F1"\]/);
  assert.match(metricRecommendationSource, /"逻辑推理": \["Accuracy"\]/);
  assert.match(metricRecommendationSource, /"图文描述": \["BLEU", "ROUGE", "METEOR"\]/);
  assert.match(metricRecommendationSource, /"视觉问答": \["Accuracy"\]/);
  assert.match(metricRecommendationSource, /"文档解析": \["Accuracy", "F1"\]/);
  assert.doesNotMatch(metricRecommendationSource, /Precision|Recall|VQA Score/);
  assert.match(metricRecommendationDoc, /任务与指标映射/);
  assert.match(metricRecommendationDoc, /Exact Match.*不在建议指标范围内/);
  assert.match(prdSource, /任务与字段映射候选方案/);
  assert.match(prdSource, /model_type \+ task_type \+ schema_version/);
});

test("评测数据页签不显示统计数字且公开数据集支持管理员编辑", () => {
  const datasetTabsSource = dataSource.slice(dataSource.indexOf('label: "公开数据集"'), dataSource.indexOf('tab === "mine" && <PrimaryButton'));
  assert.doesNotMatch(datasetTabsSource, /rows\.filter|\.length|<span/);
  assert.match(dataSource, /row\.source === "mine" \|\| \(row\.source === "public" && isAdmin\)/);
  assert.match(dataSource, /<TextButton onClick=\{\(\) => setEditRow\(row\)\}>编辑<\/TextButton>/);
  assert.match(dataStoreSource, /dataset\.source !== "mine" && dataset\.source !== "public"/);
});

test("评测任务列表显式展示核心字段并提供原始需求操作", () => {
  for (const status of ["排队中", "运行中", "成功", "失败", "已停止"]) assert.match(evaluationSource, new RegExp(status));
  for (const status of ["排队中", "执行中", "已完成"]) assert.match(evaluationSource, new RegExp(status));
  for (const column of ["任务 ID", "任务名称", "模型类型", "模型版本", "创建时间", "当前状态", "操作人"]) assert.match(evaluationSource, new RegExp(column));
  assert.match(evaluationSource, /创建开始日期/);
  assert.match(evaluationSource, /停止评测任务/);
  assert.match(evaluationSource, /下载报告/);
  assert.match(evaluationSource, /task\.status === "成功" \|\| task\.status === "失败"/);
  assert.doesNotMatch(evaluationSource, /评测方式|自定义评测|基线评测/);
});

test("创建评测任务严格使用动态模型类型、任务、数据和版本", () => {
  assert.match(evaluationSource, /语言模型可选择文本理解、代码生成、逻辑推理、问答，可多选/);
  assert.match(evaluationSource, /多模态模型可选择图文描述、视觉问答、文档解析，可多选/);
  assert.match(evaluationSource, /系统已注册模型/);
  assert.match(evaluationSource, /外部模型 API/);
  assert.match(evaluationSource, /模型版本/);
  assert.match(evaluationSource, /公开数据集/);
  assert.match(evaluationSource, /我的数据集/);
  assert.match(evaluationSource, /选择后自动回填任务、数据集、指标和执行参数/);
  for (const metric of ["Precision", "Recall", "METEOR"]) assert.match(evaluationSource, new RegExp(metric));
  assert.match(evaluationSource, /category: "分类"/);
  assert.match(evaluationSource, /category: "生成"/);
  assert.match(evaluationSource, /公式：/);
  assert.match(evaluationSource, /label="指标权重"/);
  assert.doesNotMatch(evaluationSource, /label="指标权重" required/);
  assert.match(evaluationSource, /MODEL_OPTIONS\[modelType\]/);
  assert.match(evaluationSource, /数据集版本/);
  assert.match(evaluationSource, /datasetVersions/);
  assert.match(evaluationSource, /task\.modelSource === "外部模型 API" \? "外部模型 API" : "系统已注册模型"/);
  assert.match(evaluationSource, /task\.modelSource === "外部模型 API" \? \[\["API 地址", task\.apiUrl\]\] : \[\]/);
  assert.doesNotMatch(evaluationSource, /系统已部署模型|model-connections\/test|Model Key|鉴权方式|任务描述|连接测试/);
});

test("创建任务只选择流程模板并按模型类型联动", () => {
  const taskSelectionSource = createDrawerSource.slice(
    createDrawerSource.indexOf("const setTaskSelection"),
    createDrawerSource.indexOf("const applyFlowScheme"),
  );
  assert.match(createDrawerSource, /availableSchemeConfigs\.filter\(config => !modelType \|\| config\.modelType === modelType\)/);
  assert.match(createDrawerSource, /disabled=\{!modelType\}/);
  assert.match(createDrawerSource, /请先选择模型类型/);
  assert.match(createDrawerSource, /仅按模型类型展示/);
  assert.doesNotMatch(createDrawerSource, /config\.taskTypes\.includes/);
  assert.doesNotMatch(createDrawerSource, /disabled=\{!modelType \|\| !taskTypes\.length\}/);
  assert.doesNotMatch(createDrawerSource, /请先选择模型类型和评测任务/);
  assert.doesNotMatch(taskSelectionSource, /setFlowScheme\(""\)/);
  assert.match(createDrawerSource, /<FormRow label="流程模板">/);
  assert.doesNotMatch(createDrawerSource, /label="指标方案"/);
  assert.match(createDrawerSource, /评估指标及权重来自流程模板的“指标计算”阶段/);
});

test("创建评测任务默认不选择评测任务和依赖指标", () => {
  assert.match(createDrawerSource, /const \[taskTypes, setTaskTypes\] = useState<string\[]>\(\[\]\)/);
  assert.match(createDrawerSource, /const \[metrics, setMetrics\] = useState<string\[]>\(\[\]\)/);
  assert.match(createDrawerSource, /const \[metricWeights, setMetricWeights\] = useState<Record<string, number>>\(\{\}\)/);
  assert.match(evaluationSource, /return \{ templates \}/);
  assert.match(evaluationSource, /catalog\.templates\.map\(schemeApplyConfig\)/);
  assert.doesNotMatch(evaluationSource, /metricScheme|catalog\.schemes|\[\.\.\.templates, \.\.\.schemes\]/);
  assert.doesNotMatch(createDrawerSource, /useState<string\[]>\(\["文本理解"\]\)/);
});

test("创建评测任务使用单页弹窗并直接开始测评", () => {
  assert.match(createDrawerSource, /function FormRow|const FormRow/);
  assert.match(createDrawerSource, /<PrimaryButton onClick=\{submit\}>开始测评<\/PrimaryButton>/);
  assert.doesNotMatch(createDrawerSource, /StepButton|setStep|上一步|下一步/);
  assert.doesNotMatch(createDrawerSource, /SectionTitle|配置确认|费用预估|运行参数与费用/);
  assert.doesNotMatch(createDrawerSource, /评估方法|规则评估|模型评估|人工评估/);
  assert.match(createDrawerSource, /label="流程模板"/);
  assert.match(createDrawerSource, /<b>评估指标：<\/b>/);
  assert.match(prdSource, /同一滚动弹窗/);
  assert.match(prdSource, /不显示评测方式、评估方法、四步导航、分块标题、配置确认和费用预估/);
});

test("指标选择和权重统一配置在流程模板的指标计算阶段", () => {
  assert.match(evaluationSource, /统一管理执行流程、阶段参数、评估指标、指标权重和样本计算范围/);
  assert.match(evaluationSource, /renderMetricConfiguration\(selectedMetrics, stage\)/);
  assert.match(evaluationSource, /当前权重合计：\{totalWeight\}%/);
  assert.match(evaluationSource, /metricWeights: savedWeights/);
  assert.match(evaluationSource, /flowStages: savedFlowStages/);
  assert.doesNotMatch(evaluationSource, /指标方案|指标组合方案/);
  assert.match(prdSource, /不再维护独立指标方案/);
});

test("配置方案列表展示创建人", () => {
  assert.match(configPageSource, /\["方案名称", "适用范围", "配置内容", "版本", "创建人", "共享权限", "操作"\]/);
  assert.match(configPageSource, /\{row\.author\}/);
  assert.match(prdSource, /列表展示模板名称、适用模型\/任务、阶段、版本、创建人和共享权限/);
});

test("流程模板使用结构化样本条件并驱动指标计算集合", () => {
  for (const field of ["数据集", "任务类型", "语言"]) assert.match(evaluationSource, new RegExp(`label: "${field}"`));
  assert.doesNotMatch(evaluationSource, /\{ value: "category", label: "样本类别" \}/);
  assert.doesNotMatch(evaluationSource, /\{ value: "difficulty", label: "难度" \}/);
  assert.match(prdSource, /仅支持数据集、任务类型和语言三类/);
  for (const operator of ["等于", "不等于", "属于", "不属于", "包含"]) assert.match(evaluationSource, new RegExp(operator));
  assert.match(evaluationSource, /全部满足（AND）/);
  assert.match(evaluationSource, /任一满足（OR）/);
  assert.match(evaluationSource, /samplesForMetricCalculation\(task\)/);
  assert.match(evaluationSource, /metricConditionMatches\(sample, condition\)/);
  assert.match(evaluationSource, /metricConditionRule: cloneMetricConditionRule\(metricConditionRule\)/);
  assert.match(evaluationSource, /参与计算 \{metricSamples\.length\} 条/);
  assert.match(evaluationSource, /function ConditionValueControl/);
  assert.match(evaluationSource, /请选择条件值（可多选）/);
  assert.match(evaluationSource, /conditionValueOptions\(condition\.field, draftModelType\)/);
  assert.doesNotMatch(evaluationSource, /placeholder=\{condition\.operator === "in"/);
  assert.doesNotMatch(evaluationSource, /stage\.params\.conditionRule/);
  assert.match(prdSource, /条件值禁止自由输入/);
  assert.match(prdSource, /不允许使用模型输出、判分结果或指标得分作为筛选字段/);
  assert.match(prdSource, /条件命中 0 条时，指标计算阶段失败/);
});

test("页面和需求文档均取消 Reasoning Score 指标", () => {
  assert.doesNotMatch(evaluationSource, /Reasoning Score|推理步骤与答案联合评分/);
  assert.doesNotMatch(dataSource, /Reasoning Score|推理步骤与答案联合评分/);
  assert.match(evaluationSource, /getSuggestedMetrics\(taskTypes\)/);
  assert.doesNotMatch(metricRecommendationSource, /Exact Match/);
  assert.match(evaluationSource, /removeRetiredMetrics\(task\.metrics\)/);
  assert.match(dataStoreSource, /metrics\.filter\(\(metric: string\) => metric !== retiredMetricName\)/);
  assert.match(prdSource, /配置方案模板不提供匹配类指标 Exact Match/);
  assert.match(prdSource, /不提供或计算 `Reasoning Score`/);
});

test("流程模板的模型推理参数直接展示、默认空且非必填", () => {
  assert.match(evaluationSource, /EMPTY_FLOW_TEMPLATE_INFERENCE_PARAMS/);
  assert.match(evaluationSource, /maxTokens: ""/);
  assert.match(evaluationSource, /temperature: ""/);
  assert.match(evaluationSource, /topK: ""/);
  assert.match(evaluationSource, /batchSize: ""/);
  assert.doesNotMatch(flowInferenceSource, /advancedOpen|aria-expanded|高级配置/);
  assert.match(flowInferenceSource, /以下模型推理参数均为选填/);
  assert.match(flowInferenceSource, /placeholder="选填"/);
  assert.doesNotMatch(flowInferenceSource, /inferenceParamsIncomplete|required/);
  assert.match(prdSource, /四个字段直接展示且均为选填/);
  assert.match(prdSource, /不显示“高级配置”标题、不折叠、不提供默认值/);
});

test("流程模板支持默认关闭且条数可编辑的冒烟测试", () => {
  assert.match(evaluationSource, /smokeTestEnabled: false/);
  assert.match(evaluationSource, /smokeTestCount: 25/);
  assert.match(evaluationSource, /role="switch"/);
  assert.match(flowInferenceSource, /<CompactSwitch checked=\{stage\.params\.smokeTestEnabled === true\}/);
  assert.match(flowInferenceSource, /aria-label="冒烟测试条数"/);
  assert.match(flowInferenceSource, /适用于快速验证端口的可用性/);
  assert.match(flowInferenceSource, /stage\.params\.smokeTestEnabled === true/);
  assert.match(configPageSource, /smokeTestCountInvalid/);
  assert.match(configPageSource, /Number\.isInteger\(Number\(smokeTestCountValue\)\)/);
  assert.match(prdSource, /冒烟测试.*默认关闭.*25 条/s);
  assert.match(prdSource, /关闭后保留用户最后填写的值/);
});

test("高级推理参数默认继承所选模型并允许用户覆盖", () => {
  assert.match(createDrawerSource, /useState<ModelType \| "">\(initialModelType\)/);
  assert.match(evaluationSource, /MODEL_DEFAULT_PARAMS/);
  assert.match(createDrawerSource, /useState\(false\).*advancedOpen|advancedOpen, setAdvancedOpen/s);
  assert.doesNotMatch(createDrawerSource, /useModelDefaults|使用模型默认值/);
  assert.match(createDrawerSource, />高级配置<\/span>/);
  assert.doesNotMatch(createDrawerSource, /推理参数<\/span>/);
  for (const field of ["最大 Token", "Temperature", "Top-K", "Batch Size"]) assert.match(createDrawerSource, new RegExp(field));
  assert.match(createDrawerSource, /placeholder="不填则跟随模型默认配置"/);
  assert.match(createDrawerSource, /Temperature 必须在 0～2 之间/);
  assert.match(createDrawerSource, /Top-K 必须为 1～100 的整数/);
  assert.match(createDrawerSource, /Batch Size 必须为 1～128 的整数/);
  assert.match(createDrawerSource, /source: hasOverrides \? paramSource : "模型默认"/);
  assert.match(createDrawerSource, /initialScheme \|\| "不使用配置方案"/);
  assert.match(createDrawerSource, /useState<ModelSource>\("系统已注册模型"\)/);
  assert.match(createDrawerSource, /useState<"公开数据集" \| "我的数据集" \| "团队共享数据集">\("公开数据集"\)/);
  assert.match(evaluationSource, /const \[selected, setSelected\] = useState<string\[]>\(\[\]\)/);
  assert.match(evaluationSource, /const \[baselineDataset, setBaselineDataset\] = useState\(""\)/);
  assert.match(evaluationSource, /cleaningRule: "不清洗", samplingStrategy: "全量采样"/);
  assert.match(evaluationSource, /enabled: false, params: \{ normalizationRule: "" \}/);
  assert.match(evaluationSource, /const \[metricWeights, setMetricWeights\] = useState<Record<string, number>>\(\{\}\)/);
  assert.match(dataSource, /useState<"语言模型" \| "多模态模型" \| "">\(""\)/);
  assert.match(dataSource, /<option value="">请选择模型类型<\/option>/);
  assert.match(dataSource, /<option value="">请选择适用任务<\/option>/);
  assert.match(prdSource, /初始默认值/);
  assert.match(prdSource, /Temperature.*不填则跟随模型默认配置/s);
  assert.match(prdSource, /参数来源.*模型默认.*配置方案.*自定义/s);
});

test("模型对比选择以已完成模型结果为主并自动收敛统一条件", () => {
  const compareSource = evaluationSource.slice(evaluationSource.indexOf("interface CompareBaseline"), evaluationSource.indexOf("function SchemePermissionEditor"));
  assert.match(compareSource, /添加对比模型/);
  assert.match(compareSource, /首个结果会自动确定统一对比条件/);
  assert.match(compareSource, /deriveCompareBaseline/);
  assert.match(compareSource, /compareIncompatibilityReason/);
  assert.match(compareSource, /搜索模型评测结果/);
  assert.match(compareSource, /查看不可比较结果/);
  assert.match(compareSource, /确认选择/);
  assert.match(compareSource, /pickerSelected\.length < 2/);
  assert.match(compareSource, /type="checkbox"/);
  assert.doesNotMatch(compareSource, /aria-label="对比数据集"|aria-label="对比数据集版本"|aria-label="对比任务"/);
  assert.match(prdSource, /选择首个模型后自动确定/);
  assert.match(prdSource, /提交及保存时仍记录对应评测任务 ID/);
});

test("模型对比、流程配置和文档中心覆盖原始需求关键能力", () => {
  assert.match(evaluationSource, /type="checkbox"/);
  assert.match(evaluationSource, /保存对比场景/);
  assert.match(evaluationSource, /选择两个或多个/);
  assert.match(evaluationSource, /已选 \{selected\.length\} 个模型/);
  assert.doesNotMatch(evaluationSource, /MAX_COMPARE_TASKS|2–4|最多选择/);
  assert.match(evaluationSource, /最优/);
  assert.match(evaluationSource, /下载对比结果/);
  assert.match(evaluationSource, /添加对比模型/);
  assert.match(evaluationSource, /首个结果会自动确定统一对比条件/);
  assert.match(evaluationSource, /deriveCompareBaseline/);
  assert.match(evaluationSource, /compareIncompatibilityReason/);
  assert.match(evaluationSource, /搜索模型评测结果/);
  assert.match(evaluationSource, /查看不可比较结果/);
  assert.match(evaluationSource, /确认选择/);
  assert.doesNotMatch(evaluationSource, /aria-label="对比数据集"|aria-label="对比数据集版本"|aria-label="对比任务"/);
  assert.match(evaluationSource, /baselineVersion/);
  assert.match(evaluationSource, /得分更高的共同指标/);
  assert.match(evaluationSource, /数据预处理必须在模型推理之前/);
  assert.match(evaluationSource, /团队成员可协作编辑/);
  assert.match(evaluationSource, /版本历史/);
  assert.match(evaluationSource, /全文搜索/);
  assert.match(evaluationSource, /HighlightText/);
  assert.match(evaluationSource, /未找到相关文档/);
  assert.match(evaluationSource, /在线调试/);
  assert.match(evaluationSource, /await fetch\(path/);
  assert.doesNotMatch(evaluationSource, /setDebugResponse\(`HTTP 200/);
  for (const method of ["DELETE", "results", "validation"]) assert.match(evaluationSource, new RegExp(method));
  for (const language of ["Python", "cURL", "Java"]) assert.match(evaluationSource, new RegExp(language));
  assert.match(evaluationSource, /maas-evaluation-example\.py/);
  assert.match(evaluationSource, /maas-evaluation-example\.ipynb/);
  assert.match(evaluationSource, /OAuth 2\.0/);
});

test("报告、看板、指标详情和流程约束具备可演示交互", () => {
  assert.match(evaluationSource, /new Blob/);
  assert.match(evaluationSource, /anchor\.download/);
  assert.match(evaluationSource, /window\.print\(\)/);
  assert.match(evaluationSource, /flowError/);
  assert.match(evaluationSource, /开始：/);
  assert.match(evaluationSource, /结束：/);
  assert.match(evaluationSource, /环境加载：/);
  assert.match(evaluationSource, /数据预处理：/);
  assert.match(evaluationSource, /GPU 利用率/);
  assert.match(evaluationSource, /内存占用/);
  assert.doesNotMatch(evaluationSource, /CPU 利用率/);
  assert.match(evaluationSource, /性能随参数变化趋势/);
  assert.match(evaluationSource, /向左平移图表/);
  assert.match(evaluationSource, /向右平移图表/);
  assert.match(evaluationSource, /任务目标：/);
  assert.match(evaluationSource, /数据集介绍/);
  assert.match(evaluationSource, /分项任务表现分析/);
  assert.match(evaluationSource, /差异统计摘要/);
  assert.match(evaluationSource, /PolarRadiusAxis domain=\{\[0, 100\]\}/);
  assert.match(evaluationSource, /清洗规则/);
  assert.match(evaluationSource, /采样策略/);
  assert.match(evaluationSource, /\["生成", "分类", "代码生成", "效率"\]\.map\(category/);
  assert.doesNotMatch(evaluationSource, /\{ category: "匹配", name: "Exact Match"/);
  assert.match(evaluationSource, /\{category\}类指标/);
  assert.match(evaluationSource, /计算原理 \/ 公式/);
  assert.match(evaluationSource, /系统按权重计算加权综合得分/);
  assert.match(evaluationSource, /saveEvaluationTasks\(tasks\)/);
});

test("评测结果数据明细仅使用通过和未通过二元判分", () => {
  const taskDetailSource = evaluationSource.slice(evaluationSource.indexOf("function TaskDetailPage"), evaluationSource.indexOf("function EvaluationTaskListPage"));
  assert.match(evaluationSource, /verdict: "通过" \| "未通过"/);
  assert.doesNotMatch(evaluationSource, /部分通过/);
  assert.match(taskDetailSource, /<option>通过<\/option><option>未通过<\/option>/);
  assert.match(taskDetailSource, /sample\.verdict === "通过" \? "green" : "orange"/);
  assert.match(prdSource, /判分结果仅包含“通过”和“未通过”/);
  assert.match(prdSource, /未满足完整通过条件的样本统一记为“未通过”/);
});

test("流程模板删除自定义评估逻辑", () => {
  assert.doesNotMatch(evaluationSource, /自定义评估逻辑/);
  assert.match(evaluationSource, /delete params\.customLogic/);
  assert.doesNotMatch(prdSource, /自定义评估逻辑|自定义逻辑/);
});

test("指标统计趋势图缩放范围为 80% 到 150% 且默认 100%", () => {
  assert.match(evaluationSource, /const CHART_SCALE_MIN = 0\.8/);
  assert.match(evaluationSource, /const CHART_SCALE_MAX = 1\.5/);
  assert.match(evaluationSource, /const CHART_SCALE_DEFAULT = 1/);
  assert.match(evaluationSource, /缩放范围 80%–150%/);
  assert.match(evaluationSource, /width: `\$\{Math\.round\(barScale \* 100\)\}%`/);
  assert.match(evaluationSource, /width: `\$\{Math\.round\(lineScale \* 100\)\}%`/);
  assert.doesNotMatch(evaluationSource, /Math\.max\(100, Math\.round\((?:bar|line)Scale \* 100\)\)/);
});

test("PRD 各功能具备完整业务规则且不保留无依据限制", () => {
  for (const heading of ["核心功能", "用户操作流程", "字段规则", "系统规则", "交互设计", "产品设计", "异常处理"]) assert.match(prdSource, new RegExp(heading));
  assert.match(prdSource, /任务 ID.*任务名称.*模型类型.*模型版本.*创建时间.*当前状态.*操作人/s);
  assert.match(prdSource, /语言模型：文本理解、代码生成、逻辑推理、问答/);
  assert.match(prdSource, /多模态模型：图文描述、视觉问答、文档解析/);
  assert.match(prdSource, /不设置原始需求之外的数量上限/);
  assert.match(prdSource, /选择首个模型后自动确定/);
  assert.match(prdSource, /查看不可比较结果/);
  assert.match(prdSource, /提交及保存时仍记录对应评测任务 ID/);
  assert.match(prdSource, /原始需求未规定文件大小上限/);
  assert.match(prdSource, /不得用固定延时或硬编码成功响应模拟/);
  assert.doesNotMatch(prdSource, /竞品参考|最多 4|2–4|20GB|操作审计|资源组共享/);
  assert.doesNotMatch(prdSource, /等待中|已就绪|创建数据集/);
});
