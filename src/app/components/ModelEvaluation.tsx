import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, ArrowDown, ArrowUp, ArrowUpDown, BarChart2, BookOpen,
  ChevronDown, ChevronLeft, ChevronRight, Copy, Database, Download,
  Plus, RefreshCw, RotateCcw, Search, Settings, X,
  ZoomIn, ZoomOut,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid,
  PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { loadStoredEvaluationDatasets } from "./evaluationDatasetStore";
import { getSuggestedMetrics } from "./evaluationMetricRecommendations";

type EvalStatus = "排队中" | "运行中" | "成功" | "失败" | "已停止";
type ModelType = "语言模型" | "多模态模型";
type ModelSource = "系统已注册模型" | "外部模型 API";
type ParamSource = "模型默认" | "配置方案" | "自定义";
type SchemeScope = "私有" | "共享";
type SchemeAccess = "只读" | "编辑";
type SchemeVisibility = "仅自己可见" | "团队可见" | "团队编辑";

interface InferenceParams {
  maxTokens?: number;
  temperature?: number;
  topK?: number;
  batchSize?: number;
  source?: ParamSource;
}

interface EvalMetric {
  name: string;
  score: number;
  weight: number;
}

type ConditionField = "dataset" | "taskType" | "language";
type ConditionOperator = "eq" | "neq" | "in" | "notIn" | "contains";
type ConditionCombinator = "AND" | "OR";

interface MetricCondition {
  id: string;
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
}

interface MetricConditionRule {
  mode: "all" | "filter";
  combinator: ConditionCombinator;
  conditions: MetricCondition[];
}

interface EvalTask {
  id: string;
  name: string;
  desc: string;
  status: EvalStatus;
  modelType: ModelType;
  taskTypes: string[];
  evalModels: string[];
  modelSource: ModelSource;
  modelVersion: string;
  apiUrl: string;
  modelKey?: string;
  authType?: string;
  apiKey?: string;
  datasets: string[];
  datasetVersions: Record<string, string>;
  metrics: EvalMetric[];
  params: InferenceParams;
  stage: string;
  progress: number;
  creator: string;
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
  scheme?: string;
  metricConditionRule?: MetricConditionRule;
}

interface FlowStage {
  name: "数据预处理" | "模型推理" | "后处理" | "指标计算";
  enabled: boolean;
  params: Record<string, string | number | boolean>;
  conditionRule?: MetricConditionRule;
}

interface SchemeContent {
  modelType: ModelType;
  tasks: string;
  stages: string;
  scope: SchemeScope;
  flowStages?: FlowStage[];
  metricWeights?: Record<string, number>;
}

interface SchemeVersionRecord extends SchemeContent {
  version: string;
  date: string;
  operator: string;
  summary: string;
}

interface EvaluationScheme extends SchemeContent {
  name: string;
  type: "流程模板";
  version: string;
  author: string;
  sharedAccess: SchemeAccess;
  history: SchemeVersionRecord[];
}

const CURRENT_USER = "admin";

interface SchemeApplyConfig {
  name: string;
  version: string;
  modelType: ModelType;
  taskTypes: string[];
  summary: string;
  metricWeights: Record<string, number>;
  conditionRule: MetricConditionRule;
  params: {
    maxTokens?: number;
    temperature?: number;
    topK?: number;
    batchSize?: number;
  };
}

const MODEL_OPTIONS: Record<ModelType, string[]> = {
  "语言模型": ["qwen3-8b", "qwen3.6-27b", "glm-4-flash", "DeepSeek-R1"],
  "多模态模型": ["GLM-4V", "Qwen2.5-VL"],
};

const MODEL_VERSIONS: Record<string, { versions: string[]; recommended: string }> = {
  "qwen3-8b": { versions: ["v2026.07", "v2026.05", "v2026.03"], recommended: "v2026.07" },
  "qwen3.6-27b": { versions: ["v2026.05", "v2026.03", "v2025.12"], recommended: "v2026.05" },
  "glm-4-flash": { versions: ["flash-2026.07", "flash-2026.04"], recommended: "flash-2026.07" },
  "DeepSeek-R1": { versions: ["r1-0528", "r1-0324"], recommended: "r1-0528" },
  "GLM-4V": { versions: ["v4v-2026.06", "v4v-2026.03"], recommended: "v4v-2026.06" },
  "Qwen2.5-VL": { versions: ["v2026.06", "v2026.02"], recommended: "v2026.06" },
};

// 原型中用静态数据模拟模型注册中心返回的推理默认值。
const MODEL_DEFAULT_PARAMS: Record<string, Required<Omit<InferenceParams, "source">>> = {
  "qwen3-8b": { maxTokens: 2048, temperature: 0.7, topK: 50, batchSize: 8 },
  "qwen3.6-27b": { maxTokens: 4096, temperature: 0.6, topK: 40, batchSize: 4 },
  "glm-4-flash": { maxTokens: 2048, temperature: 0.8, topK: 50, batchSize: 16 },
  "DeepSeek-R1": { maxTokens: 8192, temperature: 0.6, topK: 50, batchSize: 4 },
  "GLM-4V": { maxTokens: 2048, temperature: 0.7, topK: 40, batchSize: 4 },
  "Qwen2.5-VL": { maxTokens: 4096, temperature: 0.7, topK: 50, batchSize: 4 },
};
const LANGUAGE_TASKS = ["文本理解", "代码生成", "逻辑推理", "问答"];
const MULTIMODAL_TASKS = ["图文描述", "视觉问答", "文档解析"];
const METRIC_OPTIONS = ["Accuracy", "Precision", "Recall", "F1", "BLEU", "ROUGE", "METEOR", "Exact Match", "Pass@1", "VQA Score", "平均时延", "平均生成速度"];
const UNWEIGHTED_METRICS = new Set(["平均时延", "平均生成速度"]);
const MUTUALLY_EXCLUSIVE_METRIC_CATEGORIES = new Set(["生成", "分类", "代码生成"]);
const CHART_SCALE_MIN = 0.8;
const CHART_SCALE_MAX = 1.5;
const CHART_SCALE_STEP = 0.1;
const CHART_SCALE_DEFAULT = 1;
const EMPTY_FLOW_TEMPLATE_INFERENCE_PARAMS = {
  maxTokens: "",
  temperature: "",
  topK: "",
  batchSize: "",
  smokeTestEnabled: false,
  smokeTestCount: 25,
};

interface CreateDatasetOption {
  name: string;
  source: "公开数据集" | "我的数据集" | "团队共享数据集";
  modelType: ModelType;
  tasks: string[];
  version: string;
  versions?: string[];
  status: "校验通过";
}

const CREATE_DATASETS: CreateDatasetOption[] = [
  { name: "C-Eval", source: "公开数据集", modelType: "语言模型", tasks: ["文本理解", "逻辑推理", "问答"], version: "v1.0", versions: ["v1.0", "v0.9"], status: "校验通过" },
  { name: "C-Eval-lite", source: "公开数据集", modelType: "语言模型", tasks: ["文本理解", "问答"], version: "v1.0", status: "校验通过" },
  { name: "MMLU", source: "公开数据集", modelType: "语言模型", tasks: ["文本理解", "问答"], version: "v2.0", versions: ["v2.0", "v1.0"], status: "校验通过" },
  { name: "GSM8K", source: "公开数据集", modelType: "语言模型", tasks: ["逻辑推理", "问答"], version: "v1.1", versions: ["v1.1", "v1.0"], status: "校验通过" },
  { name: "HumanEval", source: "公开数据集", modelType: "语言模型", tasks: ["代码生成"], version: "v1.0", status: "校验通过" },
  { name: "TruthfulQA", source: "公开数据集", modelType: "语言模型", tasks: ["文本理解", "问答"], version: "v1.0", status: "校验通过" },
  { name: "MMMU", source: "公开数据集", modelType: "多模态模型", tasks: ["图文描述", "视觉问答", "文档解析"], version: "v1.0", status: "校验通过" },
  { name: "VQAv2", source: "公开数据集", modelType: "多模态模型", tasks: ["视觉问答"], version: "v2.0", status: "校验通过" },
  { name: "合同问答自定义集", source: "我的数据集", modelType: "语言模型", tasks: ["文本理解", "问答"], version: "v3", status: "校验通过" },
  { name: "多模态业务回归集", source: "我的数据集", modelType: "多模态模型", tasks: ["图文描述", "视觉问答", "文档解析"], version: "v1", status: "校验通过" },
  { name: "政务问答共享集", source: "我的数据集", modelType: "语言模型", tasks: ["问答"], version: "v2", versions: ["v2", "v1"], status: "校验通过" },
  { name: "安全评测基准集", source: "团队共享数据集", modelType: "语言模型", tasks: ["文本理解", "问答"], version: "v2.1", versions: ["v2.1", "v2.0"], status: "校验通过" },
  { name: "多语言翻译评测集", source: "团队共享数据集", modelType: "语言模型", tasks: ["文本理解"], version: "v1.2", status: "校验通过" },
  { name: "视觉理解共享集", source: "团队共享数据集", modelType: "多模态模型", tasks: ["图文描述", "视觉问答"], version: "v1.0", status: "校验通过" },
];

const METRIC_DETAILS: Record<string, { category: string; formula: string; scene: string; range: string }> = {
  Accuracy: { category: "分类", formula: "Accuracy = (TP + TN) / (TP + TN + FP + FN)", scene: "分类、问答", range: "0-1" },
  Precision: { category: "分类", formula: "TP / (TP + FP)", scene: "分类、抽取", range: "0-1" },
  Recall: { category: "分类", formula: "TP / (TP + FN)", scene: "分类、抽取", range: "0-1" },
  F1: { category: "分类", formula: "2PR / (P + R)", scene: "分类、抽取", range: "0-1" },
  BLEU: { category: "生成", formula: "BLEU = BP × exp(Σₙ wₙ log pₙ)", scene: "生成、翻译", range: "0-1" },
  ROUGE: { category: "生成", formula: "ROUGE-N = 重叠 n-gram 数 / 参考文本 n-gram 数", scene: "摘要、生成", range: "0-1" },
  METEOR: { category: "生成", formula: "METEOR = Fmean × (1 - Penalty)", scene: "生成、翻译", range: "0-1" },
  "Exact Match": { category: "匹配", formula: "EM = 完全匹配样本数 / 总样本数", scene: "匹配、问答", range: "0-1" },
  "Pass@1": { category: "代码生成", formula: "Pass@1 = 首个结果通过测试的样本数 / 总样本数", scene: "代码生成", range: "0-1" },
  "VQA Score": { category: "多模态", formula: "预测答案与人工答案一致度", scene: "视觉问答", range: "0-100" },
  "平均时延": { category: "效率", formula: "平均时延 = 总推理耗时 / 完成样本数", scene: "效率", range: "毫秒，越低越好" },
  "平均生成速度": { category: "效率", formula: "平均生成速度 = 生成 Token 总数 / 总生成耗时", scene: "效率", range: "token/s，越高越好" },
};

const METRIC_GROUPS = Array.from(new Set(METRIC_OPTIONS.map(metric => METRIC_DETAILS[metric].category)));

function recommendedMetrics(modelType: ModelType, taskTypes: string[]) {
  const next = getSuggestedMetrics(taskTypes);
  return next.length ? next : modelType ? ["Accuracy"] : [];
}

function equalMetricWeights(metrics: string[]) {
  const weightedMetrics = metrics.filter(metric => !UNWEIGHTED_METRICS.has(metric));
  if (!weightedMetrics.length) return {};
  const base = Math.floor(100 / weightedMetrics.length);
  const remainder = 100 - base * weightedMetrics.length;
  return Object.fromEntries(weightedMetrics.map((metric, index) => [metric, base + (index < remainder ? 1 : 0)]));
}

function metricValueText(metric: EvalMetric) {
  if (metric.name === "平均时延") return `${metric.score} ms`;
  if (metric.name === "平均生成速度") return `${metric.score} token/s`;
  return String(metric.score);
}

function metricWeightText(metric: EvalMetric) {
  return UNWEIGHTED_METRICS.has(metric.name) ? "—" : `${metric.weight}%`;
}

const CONDITION_FIELD_OPTIONS: { value: ConditionField; label: string }[] = [
  { value: "dataset", label: "数据集" },
  { value: "taskType", label: "任务类型" },
  { value: "language", label: "语言" },
];

const CONDITION_OPERATOR_OPTIONS: { value: ConditionOperator; label: string }[] = [
  { value: "eq", label: "等于" },
  { value: "neq", label: "不等于" },
  { value: "in", label: "属于" },
  { value: "notIn", label: "不属于" },
  { value: "contains", label: "包含" },
];

function conditionValueOptions(field: ConditionField, modelType: ModelType | "") {
  if (field === "dataset") {
    return Array.from(new Set(CREATE_DATASETS.filter(dataset => !modelType || dataset.modelType === modelType).map(dataset => dataset.name)));
  }
  if (field === "taskType") {
    return modelType === "多模态模型" ? MULTIMODAL_TASKS : modelType === "语言模型" ? LANGUAGE_TASKS : [...LANGUAGE_TASKS, ...MULTIMODAL_TASKS];
  }
  return ["中文", "英文", "中英混合"];
}

function ConditionValueControl({ condition, options, onChange }: { condition: MetricCondition; options: string[]; onChange: (value: string) => void }) {
  const multiple = condition.operator === "in" || condition.operator === "notIn";
  const selectedValues = condition.value.split(/[,，]/).map(value => value.trim()).filter(Boolean);
  if (!multiple) {
    return (
      <select aria-label="条件值" value={condition.value} onChange={event => onChange(event.target.value)} style={{ ...inputSt, height: 31 }}>
        <option value="">请选择条件值</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }
  return (
    <details style={{ position: "relative", minWidth: 0 }}>
      <summary aria-label="条件值" style={{ height: 31, padding: "6px 28px 0 9px", border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", color: selectedValues.length ? "#1f2937" : "#9ca3af", fontSize: 12, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", listStyle: "none" }}>
        {selectedValues.length ? selectedValues.join("、") : "请选择条件值（可多选）"}
      </summary>
      <div style={{ position: "absolute", top: 35, left: 0, right: 0, zIndex: 20, maxHeight: 190, overflow: "auto", padding: 6, border: "1px solid #dfe3eb", borderRadius: 7, background: "#fff", boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}>
        {options.map(option => {
          const checked = selectedValues.includes(option);
          return <label key={option} className="flex items-center gap-2" style={{ padding: "6px 7px", borderRadius: 5, fontSize: 12, color: "#374151", cursor: "pointer", background: checked ? "#f0f4ff" : "#fff" }}><input type="checkbox" checked={checked} onChange={() => onChange(checked ? selectedValues.filter(value => value !== option).join(",") : [...selectedValues, option].join(","))} />{option}</label>;
        })}
      </div>
    </details>
  );
}

function createConditionId() {
  return `condition_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function createDefaultMetricConditionRule(): MetricConditionRule {
  return { mode: "all", combinator: "AND", conditions: [] };
}

function cloneMetricConditionRule(rule?: MetricConditionRule): MetricConditionRule {
  if (!rule || rule.mode !== "filter") return createDefaultMetricConditionRule();
  return {
    mode: "filter",
    combinator: rule.combinator === "OR" ? "OR" : "AND",
    conditions: Array.isArray(rule.conditions)
      ? rule.conditions.map(condition => {
        const fieldIsSupported = CONDITION_FIELD_OPTIONS.some(option => option.value === condition.field);
        return {
          id: condition.id || createConditionId(),
          field: fieldIsSupported ? condition.field : "dataset",
          operator: CONDITION_OPERATOR_OPTIONS.some(option => option.value === condition.operator) ? condition.operator : "eq",
          value: fieldIsSupported ? String(condition.value || "") : "",
        };
      })
      : [],
  };
}

function conditionRuleSummary(rule?: MetricConditionRule) {
  const normalized = cloneMetricConditionRule(rule);
  if (normalized.mode === "all") return "全部样本";
  const fieldLabel = (field: ConditionField) => CONDITION_FIELD_OPTIONS.find(option => option.value === field)?.label || field;
  const operatorLabel = (operator: ConditionOperator) => CONDITION_OPERATOR_OPTIONS.find(option => option.value === operator)?.label || operator;
  return normalized.conditions
    .map(condition => `${fieldLabel(condition.field)}${operatorLabel(condition.operator)}“${condition.value}”`)
    .join(` ${normalized.combinator} `);
}

const POSTPROCESS_RULE_OPTIONS = [
  { id: "trim", label: "去除首尾空白" },
  { id: "normalize_newlines", label: "统一换行符" },
  { id: "strip_outer_code_fence", label: "去除代码块包裹" },
] as const;

function parsePostprocessRules(value: unknown) {
  const supportedRuleIds = new Set(POSTPROCESS_RULE_OPTIONS.map(option => option.id));
  return String(value || "").split(",").filter(ruleId => supportedRuleIds.has(ruleId as typeof POSTPROCESS_RULE_OPTIONS[number]["id"]));
}

function createDefaultFlowStages(postprocessEnabled = false, metrics = ""): FlowStage[] {
  return [
    { name: "数据预处理", enabled: true, params: { cleaningRule: "不清洗", samplingStrategy: "全量采样" } },
    { name: "模型推理", enabled: true, params: { ...EMPTY_FLOW_TEMPLATE_INFERENCE_PARAMS } },
    { name: "后处理", enabled: postprocessEnabled, params: { normalizationRules: postprocessEnabled ? "trim,normalize_newlines" : "" } },
    { name: "指标计算", enabled: true, params: { metrics }, conditionRule: createDefaultMetricConditionRule() },
  ];
}

function cloneFlowStages(stages: FlowStage[]) {
  return stages.map(stage => {
    const params = { ...stage.params };
    delete params.customLogic;
    if (stage.name === "模型推理") {
      const smokeTestCount = Number(params.smokeTestCount);
      params.smokeTestEnabled = params.smokeTestEnabled === true;
      params.smokeTestCount = Number.isInteger(smokeTestCount) && smokeTestCount >= 1 ? smokeTestCount : 25;
    }
    if (stage.name === "后处理") {
      const legacyRule = String(params.normalizationRule || "");
      const migratedRules = parsePostprocessRules(params.normalizationRules);
      if (!migratedRules.length && legacyRule) {
        if (legacyRule.includes("首尾空白")) migratedRules.push("trim");
        if (legacyRule.includes("换行")) migratedRules.push("normalize_newlines");
        if (legacyRule.includes("代码块")) migratedRules.push("strip_outer_code_fence");
      }
      params.normalizationRules = migratedRules.join(",");
      delete params.normalizationRule;
    }
    return {
      ...stage,
      params,
      conditionRule: stage.name === "指标计算" ? cloneMetricConditionRule(stage.conditionRule) : undefined,
    };
  });
}

function metricWeightSummary(weights: Record<string, number>) {
  return Object.entries(weights).filter(([, weight]) => weight > 0).map(([metric, weight]) => `${metric} ${weight}%`).join(" + ");
}

function bumpSchemeVersion(version: string) {
  const matched = version.match(/^v(\d+)\.(\d+)$/);
  return matched ? `v${matched[1]}.${Number(matched[2]) + 1}` : "v1.1";
}

function schemeVisibility(scope: SchemeScope, sharedAccess: SchemeAccess): SchemeVisibility {
  if (scope === "私有") return "仅自己可见";
  return sharedAccess === "编辑" ? "团队编辑" : "团队可见";
}

function schemeApplyConfig(row: EvaluationScheme): SchemeApplyConfig {
  // 配置方案只与模型类型挂钩，不再以评测任务作为适用范围。
  const taskTypes = row.modelType === "语言模型" ? LANGUAGE_TASKS : MULTIMODAL_TASKS;
  const metricStage = row.flowStages?.find(stage => stage.name === "指标计算");
  const inferenceStage = row.flowStages?.find(stage => stage.name === "模型推理");
  const flowMetrics = String(metricStage?.params.metrics || "").split(",").filter(Boolean);
  const metricWeights = row.metricWeights || equalMetricWeights(flowMetrics.length ? flowMetrics : recommendedMetrics(row.modelType, taskTypes));
  const numberParam = (key: string) => {
    const value = inferenceStage?.params[key];
    return typeof value === "number" ? value : undefined;
  };
  return {
    name: row.name,
    version: row.version,
    modelType: row.modelType,
    taskTypes,
    summary: row.stages,
    metricWeights,
    conditionRule: cloneMetricConditionRule(metricStage?.conditionRule),
    params: {
      maxTokens: numberParam("maxTokens"),
      temperature: numberParam("temperature"),
      topK: numberParam("topK"),
      batchSize: numberParam("batchSize"),
    },
  };
}

function cloneEvaluationScheme(row: EvaluationScheme): EvaluationScheme {
  return {
    ...row,
    flowStages: row.flowStages ? cloneFlowStages(row.flowStages) : undefined,
    metricWeights: row.metricWeights ? { ...row.metricWeights } : undefined,
    history: row.history.map(version => ({
      ...version,
      flowStages: version.flowStages ? cloneFlowStages(version.flowStages) : undefined,
      metricWeights: version.metricWeights ? { ...version.metricWeights } : undefined,
    })),
  };
}

function createInitialEvaluationSchemes() {
  const baselineFlowV12 = createDefaultFlowStages(true, "Accuracy,F1");
  const baselineFlowV11 = createDefaultFlowStages(false, "Accuracy,F1");
  const multimodalFlowV10 = createDefaultFlowStages(false, "VQA Score,Accuracy");
  const codeFlowV10 = createDefaultFlowStages(false, "Pass@1,平均时延");
  const templates: EvaluationScheme[] = [
    {
      name: "语言模型基线流程", type: "流程模板", modelType: "语言模型", tasks: "文本理解、逻辑推理、问答",
      stages: "数据预处理 → 模型推理 → 后处理 → 指标计算", version: "v1.2", scope: "共享", flowStages: baselineFlowV12, metricWeights: { Accuracy: 50, F1: 50 },
      author: "admin", sharedAccess: "编辑",
      history: [
        { version: "v1.2", date: "2026-07-18", operator: "admin", summary: "启用后处理并调整分类指标权重", modelType: "语言模型", tasks: "文本理解、逻辑推理、问答", stages: "数据预处理 → 模型推理 → 后处理 → 指标计算", scope: "共享", flowStages: baselineFlowV12, metricWeights: { Accuracy: 50, F1: 50 } },
        { version: "v1.1", date: "2026-07-12", operator: "张小明", summary: "增加指标计算配置", modelType: "语言模型", tasks: "文本理解、逻辑推理、问答", stages: "数据预处理 → 模型推理 → 指标计算", scope: "共享", flowStages: baselineFlowV11, metricWeights: { Accuracy: 50, F1: 50 } },
        { version: "v1.0", date: "2026-07-01", operator: "admin", summary: "初始版本", modelType: "语言模型", tasks: "文本理解、逻辑推理、问答", stages: "数据预处理 → 模型推理 → 指标计算", scope: "私有", flowStages: baselineFlowV11, metricWeights: { Accuracy: 50, F1: 50 } },
      ],
    },
    {
      name: "多模态视觉问答流程", type: "流程模板", modelType: "多模态模型", tasks: "视觉问答、图文描述",
      stages: "数据预处理 → 模型推理 → 指标计算", version: "v1.0", scope: "私有", flowStages: multimodalFlowV10, metricWeights: { "VQA Score": 50, Accuracy: 50 },
      author: "admin", sharedAccess: "只读",
      history: [{ version: "v1.0", date: "2026-07-10", operator: "admin", summary: "初始版本", modelType: "多模态模型", tasks: "视觉问答、图文描述", stages: "数据预处理 → 模型推理 → 指标计算", scope: "私有", flowStages: multimodalFlowV10, metricWeights: { "VQA Score": 50, Accuracy: 50 } }],
    },
    {
      name: "代码能力评测流程", type: "流程模板", modelType: "语言模型", tasks: "代码生成",
      stages: "数据预处理 → 模型推理 → 指标计算", version: "v1.0", scope: "私有", flowStages: codeFlowV10, metricWeights: { "Pass@1": 100 },
      author: "admin", sharedAccess: "只读",
      history: [{ version: "v1.0", date: "2026-07-08", operator: "admin", summary: "初始版本", modelType: "语言模型", tasks: "代码生成", stages: "数据预处理 → 模型推理 → 指标计算", scope: "私有", flowStages: codeFlowV10, metricWeights: { "Pass@1": 100 } }],
    },
  ];
  return { templates };
}

let evaluationSchemeCatalog = createInitialEvaluationSchemes();

function readEvaluationSchemeCatalog() {
  return {
    templates: evaluationSchemeCatalog.templates.filter(canViewScheme).map(cloneEvaluationScheme),
  };
}

function schemeAccess(row: EvaluationScheme): "作者" | SchemeAccess | null {
  if (row.author === CURRENT_USER) return "作者";
  if (row.scope === "私有") return null;
  return row.sharedAccess;
}

function canViewScheme(row: EvaluationScheme) {
  return schemeAccess(row) !== null;
}

function canEditScheme(row: EvaluationScheme) {
  const access = schemeAccess(row);
  return access === "作者" || access === "编辑";
}

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));
}

function inferenceParamText(value: number | undefined, source?: ParamSource) {
  if (typeof value === "number") return String(value);
  return source === "模型默认" ? "由模型服务决定" : "未设置";
}

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildReportHtml(task: EvalTask) {
  const score = scoreOf(task);
  const now = new Date().toLocaleString("zh-CN", { hour12: false });
  const metricCards = task.metrics.map(m => {
    if (UNWEIGHTED_METRICS.has(m.name)) {
      return `<div style="flex:1;min-width:130px;background:#f9fafb;border-radius:8px;padding:14px;text-align:center;border:1px solid #e5e7eb">
        <div style="font-size:12px;color:#6b7280;margin-bottom:6px">${escapeHtml(m.name)}</div>
        <div style="font-size:26px;font-weight:700;color:#1f2937">${escapeHtml(metricValueText(m))}</div>
      </div>`;
    }
    const pct = Math.round((m.score / 100) * 100);
    const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#f59e0b" : "#dc2626";
    return `<div style="flex:1;min-width:130px;background:#f9fafb;border-radius:8px;padding:14px;text-align:center;border:1px solid #e5e7eb">
      <div style="font-size:12px;color:#6b7280;margin-bottom:6px">${escapeHtml(m.name)}</div>
      <div style="font-size:26px;font-weight:700;color:${color}">${m.score}</div>
      <div style="margin-top:4px;height:6px;border-radius:3px;background:#e5e7eb"><div style="width:${pct}%;height:100%;border-radius:3px;background:${color}"></div></div>
      <div style="font-size:11px;color:#9ca3af;margin-top:5px">权重 ${m.weight}%</div>
    </div>`;
  }).join("");
  const taskPerfRows = task.taskTypes.map(t => {
    const taskScore = Math.max(62, Math.min(96, score - (task.taskTypes.indexOf(t) * 3) + (task.taskTypes.indexOf(t) % 2 === 0 ? 5 : -2)));
    const barW = Math.round(taskScore);
    const barColor = barW >= 80 ? "#16a34a" : barW >= 65 ? "#f59e0b" : "#dc2626";
    return `<tr><td style="font-weight:600;border:1px solid #e5e7eb;padding:9px 12px">${escapeHtml(t)}</td>
      <td style="border:1px solid #e5e7eb;padding:9px 12px"><div style="display:flex;align-items:center;gap:10px"><div style="flex:1;height:8px;border-radius:4px;background:#e5e7eb"><div style="width:${barW}%;height:100%;border-radius:4px;background:${barColor}"></div></div><span style="font-weight:600;font-size:13px;white-space:nowrap">${taskScore.toFixed(1)}</span></div></td></tr>`;
  }).join("");
  const datasetChartRows = task.datasets.map((d, i) => {
    const ds = Math.max(55, Math.min(96, score - i * 2 + 3));
    const w = Math.round(ds);
    return `<tr><td style="border:1px solid #e5e7eb;padding:8px 12px">${escapeHtml(d)}</td><td style="border:1px solid #e5e7eb;padding:8px 12px"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:8px;border-radius:4px;background:#e5e7eb"><div style="width:${w}%;height:100%;border-radius:4px;background:#4f6ef7"></div></div><span style="font-weight:600;font-size:13px">${ds.toFixed(1)}</span></div></td></tr>`;
  }).join("");
  const strengths = task.metrics.filter(m => !UNWEIGHTED_METRICS.has(m.name) && m.score >= 80).map(m => m.name);
  const weaknesses = task.metrics.filter(m => !UNWEIGHTED_METRICS.has(m.name) && m.score < 70).map(m => m.name);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>${escapeHtml(task.name)} 测评报告</title>
<style>@page{size:A4;margin:18mm 16mm}body{font-family:"PingFang SC","Microsoft YaHei",Arial,sans-serif;max-width:820px;margin:0 auto;color:#1f2937;line-height:1.75;font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1{font-size:24px;border-bottom:2px solid #e5e7eb;padding-bottom:12px;margin-bottom:6px}
h2{font-size:17px;margin-top:28px;padding-left:10px;border-left:4px solid #4f6ef7}
h3{font-size:14px;margin-top:16px;color:#374151}
.cover{background:#f0f4ff;border:1px solid #dbe5ff;border-radius:10px;padding:24px;margin:18px 0;display:flex;gap:30px;align-items:center}
.cover-score{font-size:52px;font-weight:800;color:#4f6ef7;line-height:1}
.cover-meta{flex:1;font-size:13px;color:#374151}
.cover-meta td{padding:4px 8px 4px 0;vertical-align:top}
.cover-meta td:first-child{color:#6b7280;white-space:nowrap;padding-right:12px}
.cards{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}
.card{flex:1;min-width:130px;background:#f9fafb;border-radius:8px;padding:14px;text-align:center;border:1px solid #e5e7eb}
.card-title{font-size:12px;color:#6b7280;margin-bottom:6px}
.card-value{font-size:26px;font-weight:700}
.card-bar{height:6px;border-radius:3px;background:#e5e7eb;margin-top:4px}
.card-bar-fill{height:100%;border-radius:3px}
.card-weight{font-size:11px;color:#9ca3af;margin-top:5px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#f7f8fa;font-weight:600;text-align:left}
.summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:12px 0}
.summary-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px}
.summary-label{font-size:12px;color:#6b7280;margin-bottom:6px;font-weight:600}
.conclusion-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:18px;margin:12px 0}
.conclusion-box.warn{background:#fefce8;border-color:#fde68a}
@media print{.pagebreak{page-break-before:always}}
</style></head><body>
<h1>${escapeHtml(task.name)} 测评报告</h1>
<p style="color:#6b7280;font-size:12px;margin:4px 0 20px">任务 ID：${escapeHtml(task.id)} · 报告生成时间：${now} · 状态：${escapeHtml(task.status)}</p>

<div class="cover">
  <div style="text-align:center"><div class="cover-score">${score}</div><div style="font-size:13px;color:#6b7280;margin-top:4px">总体得分</div></div>
  <table class="cover-meta"><tbody>
    <tr><td>评测模型</td><td><b>${escapeHtml(task.evalModels.join("、"))}</b></td></tr>
    <tr><td>模型版本</td><td>${escapeHtml(task.modelVersion)}</td></tr>
    <tr><td>模型类型</td><td>${escapeHtml(task.modelType)} · ${escapeHtml(task.modelSource)}</td></tr>
    <tr><td>评测数据</td><td>${escapeHtml(task.datasets.map(d => `${d} ${datasetVersionOf(task, d)}`).join("、"))}</td></tr>
    <tr><td>任务类型</td><td>${escapeHtml(task.taskTypes.join("、"))}</td></tr>
    <tr><td>创建时间</td><td>${escapeHtml(task.createdAt)}</td></tr>
  </tbody></table>
</div>

<h2>一、测评概述</h2>
<div class="summary-grid">
  <div class="summary-box"><div class="summary-label">任务目标</div><p style="margin:0;font-size:13px;color:#374151">${escapeHtml(task.desc || `评估模型在 ${task.taskTypes.join("、")} 任务上的综合表现，衡量模型能力水平与业务适配性。`)}</p></div>
  <div class="summary-box"><div class="summary-label">模型信息</div><p style="margin:0;font-size:13px;color:#374151">评测对象：${escapeHtml(task.evalModels.join("、"))}<br/>模型类型：${escapeHtml(task.modelType)} · 版本：${escapeHtml(task.modelVersion)}<br/>来源：${escapeHtml(task.modelSource)}${task.modelSource === "外部模型 API" ? ` · API：${escapeHtml(task.apiUrl)}` : ""}</p></div>
  <div class="summary-box"><div class="summary-label">数据集介绍</div><p style="margin:0;font-size:13px;color:#374151">${escapeHtml(task.datasets.map(d => `${d}（${datasetVersionOf(task, d)}）`).join("、"))}<br/>覆盖任务：${escapeHtml(task.taskTypes.join("、"))}<br/>样本计算范围：${escapeHtml(conditionRuleSummary(task.metricConditionRule))}</p></div>
  <div class="summary-box"><div class="summary-label">推理参数</div><p style="margin:0;font-size:13px;color:#374151">来源：${escapeHtml(task.params.source || "未记录")}<br/>最大 Token：${escapeHtml(inferenceParamText(task.params.maxTokens, task.params.source))} · Temperature：${escapeHtml(inferenceParamText(task.params.temperature, task.params.source))} · Top-K：${escapeHtml(inferenceParamText(task.params.topK, task.params.source))} · Batch Size：${escapeHtml(inferenceParamText(task.params.batchSize, task.params.source))}</p></div>
</div>

<h2>二、详细指标得分</h2>
<div class="cards">${metricCards}</div>
<h3>指标汇总</h3>
<table><thead><tr><th style="border:1px solid #e5e7eb;padding:9px 12px">指标</th><th style="border:1px solid #e5e7eb;padding:9px 12px">得分</th><th style="border:1px solid #e5e7eb;padding:9px 12px">权重</th><th style="border:1px solid #e5e7eb;padding:9px 12px">通过率</th><th style="border:1px solid #e5e7eb;padding:9px 12px">分数分布</th></tr></thead>
<tbody>${task.metrics.map((m, i) => {
  const efficiencyMetric = UNWEIGHTED_METRICS.has(m.name);
  const pct = Math.round((m.score / 100) * 100);
  const pr = Math.max(58, 88 - i * 6);
  return `<tr><td style="border:1px solid #e5e7eb;padding:9px 12px;font-weight:600">${escapeHtml(m.name)}</td><td style="border:1px solid #e5e7eb;padding:9px 12px">${escapeHtml(metricValueText(m))}</td><td style="border:1px solid #e5e7eb;padding:9px 12px">${efficiencyMetric ? "—" : `${m.weight}%`}</td><td style="border:1px solid #e5e7eb;padding:9px 12px">${efficiencyMetric ? "—" : `${pr}%`}</td><td style="border:1px solid #e5e7eb;padding:9px 12px">${efficiencyMetric ? "—" : `<div style="height:6px;border-radius:3px;background:#e5e7eb;max-width:140px"><div style="width:${pct}%;height:100%;border-radius:3px;background:#4f6ef7"></div></div>`}</td></tr>`;
}).join("")}</tbody></table>

<h2>三、各分项任务表现分析</h2>
<h3>按任务类型</h3>
<table><thead><tr><th style="border:1px solid #e5e7eb;padding:9px 12px">任务类型</th><th style="border:1px solid #e5e7eb;padding:9px 12px">总体得分</th></tr></thead><tbody>${taskPerfRows}</tbody></table>
<h3>按数据集</h3>
<table><thead><tr><th style="border:1px solid #e5e7eb;padding:9px 12px">数据集</th><th style="border:1px solid #e5e7eb;padding:9px 12px">总体得分</th></tr></thead><tbody>${datasetChartRows}</tbody></table>

<h2>四、结论与建议</h2>
<div class="conclusion-box">
  <h3 style="margin-top:0;color:#16a34a">综合表现</h3>
  <p style="margin:0">${escapeHtml(task.evalModels[0])} 在 ${escapeHtml(task.taskTypes.join("、"))} 任务上的总体得分为 <b>${score}</b>，整体表现${score >= 80 ? "优秀，已达到业务试用标准" : score >= 65 ? "良好，建议在特定场景下试用" : "有待提升，建议针对性优化后再评测"}。</p>
</div>
${strengths.length ? `<div class="conclusion-box"><h3 style="margin-top:0;color:#16a34a">优势领域</h3><p style="margin:0">在 ${escapeHtml(strengths.join("、"))} 指标上表现突出，得分均超过 80 分，表明模型在这些维度上具备较强的能力。</p></div>` : ""}
${weaknesses.length ? `<div class="conclusion-box warn"><h3 style="margin-top:0;color:#b45309">待改进项</h3><p style="margin:0">${escapeHtml(weaknesses.join("、"))} 指标得分低于 70 分，建议针对相关任务类型补充高质量训练数据，并调整推理参数后复测。</p></div>` : ""}
<div class="conclusion-box"><h3 style="margin-top:0;color:#4f6ef7">建议</h3><ul style="margin:4px 0;padding-left:20px">
  <li>针对低分任务类型补充对应领域的数据集，进行二次评测验证。</li>
  <li>保持相同数据集版本和推理参数，确保评测结果可复现、可对比。</li>
  <li>建议定期（如每月）执行回归评测，追踪模型能力变化趋势。</li>
  ${score < 80 ? "<li>在业务上线前完成高优先级任务的全量评测，确保关键场景的可靠性。</li>" : "<li>当前模型可进入业务试用阶段，建议在实际业务数据上进行 A/B 验证。</li>"}
</ul></div>
</body></html>`;
}

function downloadReport(task: EvalTask) {
  const html = buildReportHtml(task);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${task.id}-report.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadResultData(task: EvalTask, format: "csv" | "excel") {
  const headers = ["样本ID", "数据集", "任务类型", "样本类别", "难度", "语言", "Prompt", "模型输出", "标准答案", "得分", "判分结果"];
  const rows = samplesForMetricCalculation(task).map(s => [s.id, s.dataset, s.taskType, s.category, s.difficulty, s.language, s.prompt, s.output, s.reference, `${(s.score * 100).toFixed(0)}`, s.verdict]);
  if (format === "csv") {
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    downloadTextFile(`${task.id}-samples.csv`, "﻿" + csv, "text/csv;charset=utf-8");
    return;
  }
  const htmlRows = [headers, ...rows].map((row, index) => `<tr>${row.map(cell => `<${index === 0 ? "th" : "td"}>${escapeHtml(cell)}</${index === 0 ? "th" : "td"}>`).join("")}</tr>`).join("");
  downloadTextFile(`${task.id}-samples.xls`, `<html><head><meta charset="utf-8"></head><body><table>${htmlRows}</table></body></html>`, "application/vnd.ms-excel;charset=utf-8");
}

function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let matchIndex = lowerText.indexOf(lowerKeyword, cursor);
  while (matchIndex >= 0) {
    parts.push(text.slice(cursor, matchIndex));
    parts.push(<mark key={`${matchIndex}-${lowerKeyword}`} style={{ background: "#fde68a", color: "inherit", padding: 0 }}>{text.slice(matchIndex, matchIndex + keyword.length)}</mark>);
    cursor = matchIndex + keyword.length;
    matchIndex = lowerText.indexOf(lowerKeyword, cursor);
  }
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

const INITIAL_TASKS: EvalTask[] = [
  {
    id: "eval_202607181001_0001",
    name: "qwen3-8b_通用能力评测",
    desc: "覆盖文本理解、逻辑推理和问答任务的综合测评。",
    status: "成功",
    modelType: "语言模型",
    taskTypes: ["文本理解", "逻辑推理", "问答"],
    evalModels: ["qwen3-8b"],
    modelSource: "系统已注册模型",
    modelVersion: "v2026.07",
    apiUrl: "http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions",
    datasets: ["C-Eval", "GSM8K", "TruthfulQA"],
    datasetVersions: { "C-Eval": "v1.0", GSM8K: "v1.1", TruthfulQA: "v1.0" },
    metrics: [
      { name: "Accuracy", score: 86.4, weight: 56 },
      { name: "F1", score: 84.8, weight: 44 },
      { name: "平均时延", score: 842, weight: 0 },
      { name: "平均生成速度", score: 46.8, weight: 0 },
    ],
    params: { maxTokens: 2048, temperature: 0.7, topK: 50, batchSize: 8, source: "模型默认" },
    stage: "任务完成",
    progress: 100,
    creator: "admin",
    createdAt: "2026-07-18 10:01:00",
    updatedAt: "2026-07-18 10:26:18",
  },
  {
    id: "eval_202607181010_0002",
    name: "GLM-4V_多模态评测",
    desc: "验证视觉问答、图文描述和文档解析能力。",
    status: "运行中",
    modelType: "多模态模型",
    taskTypes: ["图文描述", "视觉问答", "文档解析"],
    evalModels: ["GLM-4V"],
    modelSource: "系统已注册模型",
    modelVersion: "v4v-2026.06",
    apiUrl: "http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions",
    datasets: ["MMMU", "VQAv2"],
    datasetVersions: { MMMU: "v1.0", VQAv2: "v2.0" },
    metrics: [
      { name: "VQA Score", score: 67.8, weight: 56 },
      { name: "Accuracy", score: 71.2, weight: 44 },
      { name: "平均时延", score: 1180, weight: 0 },
      { name: "平均生成速度", score: 28.4, weight: 0 },
    ],
    params: { maxTokens: 1024, temperature: 0.2, topK: 20, batchSize: 4, source: "配置方案" },
    stage: "模型推理",
    progress: 62,
    creator: "张小明",
    createdAt: "2026-07-18 10:10:00",
    updatedAt: "2026-07-18 10:22:30",
  },
  {
    id: "eval_202607171730_0003",
    name: "DeepSeek-R1_推理能力评测",
    desc: "对数学推理和复杂问答进行专项评测。",
    status: "失败",
    modelType: "语言模型",
    taskTypes: ["逻辑推理", "问答"],
    evalModels: ["DeepSeek-R1"],
    modelSource: "外部模型 API",
    modelVersion: "r1-api",
    apiUrl: "https://api.example.com/v1/chat/completions",
    modelKey: "deepseek-r1-0528",
    authType: "API Key",
    apiKey: "sk-example-key",
    datasets: ["GSM8K", "TruthfulQA"],
    datasetVersions: { GSM8K: "v1.1", TruthfulQA: "v1.0" },
    metrics: [
      { name: "Accuracy", score: 0, weight: 100 },
    ],
    params: { maxTokens: 4096, temperature: 0.3, topK: 40, batchSize: 2, source: "自定义" },
    stage: "模型推理",
    progress: 38,
    creator: "李雷",
    createdAt: "2026-07-17 17:30:00",
    updatedAt: "2026-07-17 17:41:12",
    failureReason: "外部模型 API 返回 401，鉴权失败。",
  },
  {
    id: "eval_202607171520_0006",
    name: "qwen3.6-27b_通用能力评测",
    desc: "使用 C-Eval 对文本理解与问答能力进行评测。",
    status: "成功",
    modelType: "语言模型",
    taskTypes: ["文本理解", "问答"],
    evalModels: ["qwen3.6-27b"],
    modelSource: "系统已注册模型",
    modelVersion: "v2026.05",
    apiUrl: "http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions",
    datasets: ["C-Eval"],
    datasetVersions: { "C-Eval": "v1.0" },
    metrics: [
      { name: "Accuracy", score: 84.1, weight: 59 },
      { name: "F1", score: 82.7, weight: 41 },
      { name: "平均时延", score: 735, weight: 0 },
      { name: "平均生成速度", score: 52.1, weight: 0 },
    ],
    params: { maxTokens: 2048, temperature: 0.2, topK: 50, batchSize: 8, source: "配置方案" },
    stage: "任务完成",
    progress: 100,
    creator: "admin",
    createdAt: "2026-07-17 15:20:00",
    updatedAt: "2026-07-17 15:42:10",
  },
  {
    id: "eval_202607171400_0004",
    name: "qwen3.6-27b_代码生成评测",
    desc: "通过 HumanEval 验证代码生成能力。",
    status: "成功",
    modelType: "语言模型",
    taskTypes: ["代码生成"],
    evalModels: ["qwen3.6-27b"],
    modelSource: "系统已注册模型",
    modelVersion: "v2026.05",
    apiUrl: "http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions",
    datasets: ["HumanEval"],
    datasetVersions: { HumanEval: "v1.0" },
    metrics: [
      { name: "Pass@1", score: 78.6, weight: 100 },
      { name: "平均时延", score: 910, weight: 0 },
      { name: "平均生成速度", score: 38.7, weight: 0 },
    ],
    params: { maxTokens: 4096, temperature: 0.1, topK: 10, batchSize: 4, source: "自定义" },
    stage: "任务完成",
    progress: 100,
    creator: "admin",
    createdAt: "2026-07-17 14:00:00",
    updatedAt: "2026-07-17 14:19:52",
  },
  {
    id: "eval_202607181030_0005",
    name: "glm-4-flash_快速回归评测",
    desc: "版本上线前快速回归评测。",
    status: "排队中",
    modelType: "语言模型",
    taskTypes: ["文本理解", "问答"],
    evalModels: ["glm-4-flash"],
    modelSource: "系统已注册模型",
    modelVersion: "flash-2026.07",
    apiUrl: "http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions",
    datasets: ["C-Eval-lite"],
    datasetVersions: { "C-Eval-lite": "v1.0" },
    metrics: [
      { name: "Accuracy", score: 0, weight: 50 },
      { name: "F1", score: 0, weight: 50 },
    ],
    params: { maxTokens: 1024, temperature: 0.7, topK: 50, batchSize: 16, source: "模型默认" },
    stage: "排队中",
    progress: 0,
    creator: "王芳",
    createdAt: "2026-07-18 10:30:00",
    updatedAt: "2026-07-18 10:30:00",
  },
];

const TASK_STORAGE_KEY = "maas-evaluation-tasks";

function removeRetiredMetrics(metrics: EvalMetric[] = []) {
  const retiredMetricName = ["Reasoning", "Score"].join(" ");
  const retained = metrics.filter(metric => metric.name !== retiredMetricName).map(metric => {
    if (metric.name === "平均时延") {
      const latency = metric.score > 200 ? metric.score : Math.max(100, Math.round(1600 - metric.score * 8));
      return { ...metric, score: latency, weight: 0 };
    }
    if (metric.name === "平均生成速度") return { ...metric, weight: 0 };
    return metric;
  });
  if (!retained.length) return retained;
  const weighted = retained.filter(metric => !UNWEIGHTED_METRICS.has(metric.name));
  const totalWeight = weighted.reduce((sum, metric) => sum + metric.weight, 0);
  if (totalWeight <= 0) {
    const weights = equalMetricWeights(weighted.map(metric => metric.name));
    return retained.map(metric => ({ ...metric, weight: UNWEIGHTED_METRICS.has(metric.name) ? 0 : weights[metric.name] || 0 }));
  }
  const normalized = weighted.map(metric => Math.floor(metric.weight / totalWeight * 100));
  let remainder = 100 - normalized.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; remainder > 0; index = (index + 1) % normalized.length) {
    normalized[index] += 1;
    remainder -= 1;
  }
  const normalizedWeights = Object.fromEntries(weighted.map((metric, index) => [metric.name, normalized[index]]));
  const withWeights = retained.map(metric => ({ ...metric, weight: UNWEIGHTED_METRICS.has(metric.name) ? 0 : normalizedWeights[metric.name] || 0 }));
  if (!withWeights.some(metric => metric.name === "平均时延") || withWeights.some(metric => metric.name === "平均生成速度")) return withWeights;
  const latency = withWeights.find(metric => metric.name === "平均时延")?.score || 1000;
  return [...withWeights, { name: "平均生成速度", score: Math.round(Math.max(12, 50000 / latency) * 10) / 10, weight: 0 }];
}

function loadEvaluationTasks(): EvalTask[] {
  if (typeof window === "undefined") return INITIAL_TASKS;
  try {
    const raw = window.localStorage.getItem(TASK_STORAGE_KEY);
    if (raw === null) return INITIAL_TASKS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_TASKS;
    return parsed.map(task => {
      const modelSource: ModelSource = task.modelSource === "外部模型 API" ? "外部模型 API" : "系统已注册模型";
      return {
        ...task,
        modelSource,
        apiUrl: modelSource === "外部模型 API" ? task.apiUrl || "" : "-",
        datasetVersions: task.datasetVersions || Object.fromEntries((task.datasets || []).map((name: string) => [name, CREATE_DATASETS.find(dataset => dataset.name === name)?.version || "未记录版本"])),
        metrics: removeRetiredMetrics(task.metrics),
        metricConditionRule: cloneMetricConditionRule(task.metricConditionRule),
      };
    });
  } catch {
    return INITIAL_TASKS;
  }
}

function saveEvaluationTasks(tasks: EvalTask[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
}

const STATUS_CFG: Record<EvalStatus, { bg: string; text: string; border: string }> = {
  "成功": { bg: "#f0faf5", text: "#16a34a", border: "#bbf7d0" },
  "失败": { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  "运行中": { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  "排队中": { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb" },
  "已停止": { bg: "#fff7ed", text: "#ea580c", border: "#fed7aa" },
};

const thSt: React.CSSProperties = {
  padding: "9px 12px", textAlign: "left", fontWeight: 600, color: "#374151",
  fontSize: 12.5, borderBottom: "1px solid #e8ebf2", whiteSpace: "nowrap", background: "#f8f9fc",
};
const tdSt: React.CSSProperties = { padding: "10px 12px", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", verticalAlign: "middle" };
const inputSt: React.CSSProperties = {
  width: "100%", height: 34, padding: "0 10px", fontSize: 13,
  border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", color: "#1a1d23",
  boxSizing: "border-box",
};
const panelSt: React.CSSProperties = { background: "#fff", border: "1px solid #e8ebf2", borderRadius: 8 };

function StatusBadge({ status }: { status: EvalStatus }) {
  const sc = STATUS_CFG[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", height: 22, fontSize: 12.5, fontWeight: 500, padding: "0 8px", borderRadius: 5, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
      {status}
    </span>
  );
}

function Chip({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "gray" | "green" | "orange" }) {
  const cfg = {
    blue: { bg: "#eff4ff", color: "#4f6ef7" },
    gray: { bg: "#f3f4f6", color: "#6b7280" },
    green: { bg: "#f0faf5", color: "#16a34a" },
    orange: { bg: "#fff7ed", color: "#ea580c" },
  }[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px", borderRadius: 5, fontSize: 12.5, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>{children}</span>;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 7 }}>
      {required && <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>}{children}
    </div>
  );
}

function CompactSwitch({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={`${label}：${checked ? "已开启" : "已关闭"}`}
      onClick={() => onChange(!checked)}
      style={{
        width: 32,
        height: 18,
        padding: 0,
        border: "none",
        borderRadius: 9,
        background: checked ? "#4f6ef7" : "#cfd4dc",
        cursor: "pointer",
        position: "relative",
        transition: "background 160ms ease",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: 2,
        left: checked ? 16 : 2,
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 160ms ease",
      }} />
    </button>
  );
}

function TextButton({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{ fontSize: 12.5, color: danger ? "#ef4444" : "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500, whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: disabled ? "#aeb9f8" : "#4f6ef7", border: "none", borderRadius: 6, cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}>
      {children}
    </button>
  );
}

function ToggleGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "inline-flex", padding: 3, border: "1px solid #e0e3ed", borderRadius: 7, background: "#f8f9fc" }}>
      {options.map(option => (
        <button key={option} onClick={() => onChange(option)}
          style={{ height: 28, padding: "0 12px", fontSize: 13, border: "none", borderRadius: 5, background: value === option ? "#fff" : "transparent", color: value === option ? "#4f6ef7" : "#6b7280", fontWeight: value === option ? 600 : 400, cursor: "pointer", boxShadow: value === option ? "0 1px 4px rgba(15,23,42,0.08)" : "none" }}>
          {option}
        </button>
      ))}
    </div>
  );
}

function scoreOf(task: EvalTask) {
  const scored = task.metrics.filter(m => m.score > 0 && m.weight > 0 && !UNWEIGHTED_METRICS.has(m.name));
  if (!scored.length) return 0;
  const weightSum = scored.reduce((sum, m) => sum + m.weight, 0);
  return Math.round((scored.reduce((sum, m) => sum + m.score * m.weight, 0) / weightSum) * 10) / 10;
}

function datasetVersionOf(task: EvalTask, dataset: string) {
  return task.datasetVersions?.[dataset] || "未记录版本";
}

interface CompareBaseline {
  dataset: string;
  version: string;
  task: string;
}

function isCompareCompatible(task: EvalTask, baseline: CompareBaseline) {
  return task.datasets.includes(baseline.dataset)
    && datasetVersionOf(task, baseline.dataset) === baseline.version
    && task.taskTypes.includes(baseline.task);
}

function compareIncompatibilityReason(task: EvalTask, baseline: CompareBaseline) {
  if (!task.datasets.includes(baseline.dataset)) return `数据集不同（需要 ${baseline.dataset}）`;
  if (datasetVersionOf(task, baseline.dataset) !== baseline.version) return `数据集版本不同（需要 ${baseline.version}）`;
  if (!task.taskTypes.includes(baseline.task)) return `任务类型不同（需要 ${baseline.task}）`;
  return "可加入当前对比";
}

function deriveCompareBaseline(anchor: EvalTask, allTasks: EvalTask[]): CompareBaseline {
  const candidates = anchor.datasets.flatMap(dataset => anchor.taskTypes.map(task => ({
    dataset,
    version: datasetVersionOf(anchor, dataset),
    task,
  })));
  return candidates.reduce((best, candidate) => {
    const candidateCount = allTasks.filter(item => isCompareCompatible(item, candidate)).length;
    const bestCount = allTasks.filter(item => isCompareCompatible(item, best)).length;
    return candidateCount > bestCount ? candidate : best;
  }, candidates[0] || { dataset: "", version: "", task: "" });
}

interface EvaluationSample {
  id: string;
  prompt: string;
  output: string;
  reference: string;
  verdict: "通过" | "未通过";
  score: number;
  dataset: string;
  taskType: string;
  category: string;
  difficulty: string;
  language: string;
}

const SAMPLE_RESULTS: EvaluationSample[] = [
  { id: "sample_001", prompt: "某项政策的适用条件是什么？", output: "适用于符合申报范围且材料完整的申请人。", reference: "需同时满足申报范围和材料完整两项条件。", verdict: "通过", score: 0.94, dataset: "C-Eval", taskType: "文本理解", category: "政策理解", difficulty: "中等", language: "中文" },
  { id: "sample_002", prompt: "请概括合同中的付款周期。", output: "验收后 30 日内支付全部款项。", reference: "验收通过后 30 个工作日内支付。", verdict: "未通过", score: 0.72, dataset: "TruthfulQA", taskType: "问答", category: "合同问答", difficulty: "中等", language: "中文" },
  { id: "sample_003", prompt: "已知 x+3=8，求 x。", output: "x=5。", reference: "x=5。", verdict: "通过", score: 1, dataset: "GSM8K", taskType: "逻辑推理", category: "数学推理", difficulty: "简单", language: "中文" },
  { id: "sample_004", prompt: "下列哪一项属于安全风险？", output: "未授权暴露用户数据。", reference: "未授权暴露用户数据。", verdict: "通过", score: 0.98, dataset: "C-Eval", taskType: "文本理解", category: "安全", difficulty: "困难", language: "中文" },
  { id: "sample_005", prompt: "解释为什么需要执行模型评测。", output: "用于发现能力短板。", reference: "用于量化模型能力、风险和业务适配性。", verdict: "未通过", score: 0.43, dataset: "TruthfulQA", taskType: "问答", category: "通用知识", difficulty: "困难", language: "中文" },
];

function metricConditionMatches(sample: EvaluationSample, condition: MetricCondition) {
  const actual = String(sample[condition.field] || "").trim().toLowerCase();
  const expectedValues = condition.value.split(/[,，]/).map(value => value.trim().toLowerCase()).filter(Boolean);
  if (!expectedValues.length) return false;
  if (condition.operator === "eq") return actual === expectedValues[0];
  if (condition.operator === "neq") return actual !== expectedValues[0];
  if (condition.operator === "in") return expectedValues.includes(actual);
  if (condition.operator === "notIn") return !expectedValues.includes(actual);
  return actual.includes(expectedValues[0]);
}

function samplesForMetricCalculation(task: EvalTask) {
  const datasetSamples = SAMPLE_RESULTS.filter(sample => task.datasets.includes(sample.dataset));
  const rule = cloneMetricConditionRule(task.metricConditionRule);
  if (rule.mode === "all") return datasetSamples;
  return datasetSamples.filter(sample => {
    const matches = rule.conditions.map(condition => metricConditionMatches(sample, condition));
    return rule.combinator === "AND" ? matches.every(Boolean) : matches.some(Boolean);
  });
}

function taskChartData(task: EvalTask) {
  return task.datasets.map((dataset, index) => ({
    name: dataset,
    总体得分: Math.max(58, Math.min(96, scoreOf(task) - index * 2 + 3)),
    Accuracy: Math.max(55, Math.min(96, (task.metrics.find(m => m.name === "Accuracy")?.score || scoreOf(task)) - index)),
  }));
}

function parameterTrendData(task: EvalTask) {
  const base = scoreOf(task) || 70;
  const temperature = task.params.temperature ?? 0.7;
  return [
    { name: `Temperature ${Math.max(0, temperature - 0.2).toFixed(1)}`, 总体得分: Math.max(0, base - 2), Accuracy: Math.max(0, base - 3) },
    { name: `Temperature ${temperature.toFixed(1)}`, 总体得分: base, Accuracy: Math.max(0, base - 1) },
    { name: `Temperature ${(temperature + 0.2).toFixed(1)}`, 总体得分: Math.max(0, base - 1), Accuracy: Math.max(0, base - 2) },
  ];
}

function radarData(task: EvalTask) {
  const base = scoreOf(task) || 70;
  return [
    { subject: "理解", value: Math.min(100, base + 4) },
    { subject: "推理", value: Math.min(100, base - 1) },
    { subject: "生成", value: Math.min(100, base + 1) },
    { subject: "稳定", value: Math.min(100, base + 6) },
    { subject: "效率", value: Math.min(100, base + 2) },
  ];
}

function CreateDrawer({ initialModel, initialScheme, initialSchemeConfig, onClose, onDone }: { initialModel?: string | null; initialScheme?: string | null; initialSchemeConfig?: SchemeApplyConfig | null; onClose: () => void; onDone: (task: EvalTask) => void }) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultName = `eval_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
  const initialModelType: ModelType | "" = initialModel
    ? MODEL_OPTIONS["多模态模型"].includes(initialModel) ? "多模态模型" : "语言模型"
    : "语言模型";
  const [name, setName] = useState(defaultName);
  const [modelType, setModelType] = useState<ModelType | "">(initialModelType);
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const [modelSource, setModelSource] = useState<ModelSource>("系统已注册模型");
  const [models, setModels] = useState<string[]>(initialModel ? [initialModel] : []);
  const [modelVersion, setModelVersion] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [modelKey, setModelKey] = useState("");
  const [authType, setAuthType] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [datasetSource, setDatasetSource] = useState<"公开数据集" | "我的数据集" | "团队共享数据集">("公开数据集");
  const [datasets, setDatasets] = useState<string[]>([]);
  const [datasetVersions, setDatasetVersions] = useState<Record<string, string>>({});
  const [metrics, setMetrics] = useState<string[]>([]);
  const [metricWeights, setMetricWeights] = useState<Record<string, number>>({});
  const [metricConditionRule, setMetricConditionRule] = useState<MetricConditionRule>(createDefaultMetricConditionRule());
  const initialFlowScheme = initialSchemeConfig ? initialScheme || "" : "";
  const [flowScheme, setFlowScheme] = useState(initialFlowScheme);
  const [maxTokens, setMaxTokens] = useState<number | "">(4096);
  const [temperature, setTemperature] = useState<number | "">(1);
  const [topK, setTopK] = useState<number | "">(5);
  const [batchSize, setBatchSize] = useState<number | "">("");
  const [schemeParams, setSchemeParams] = useState<{ maxTokens: number | ""; temperature: number | ""; topK: number | ""; batchSize: number | "" }>({ maxTokens: "", temperature: "", topK: "", batchSize: "" });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [paramSource, setParamSource] = useState<ParamSource>("模型默认");
  const [errors, setErrors] = useState<string[]>([]);
  const [datasetDropdownOpen, setDatasetDropdownOpen] = useState(false);
  const [datasetSearch, setDatasetSearch] = useState("");
  const availableSchemeConfigs = useMemo(() => {
    const catalog = readEvaluationSchemeCatalog();
    const configs = catalog.templates.map(schemeApplyConfig);
    if (initialSchemeConfig) {
      const existingIndex = configs.findIndex(item => item.name === initialSchemeConfig.name);
      if (existingIndex >= 0) configs[existingIndex] = initialSchemeConfig;
      else configs.unshift(initialSchemeConfig);
    }
    return configs;
  }, [initialSchemeConfig]);
  const datasetOptions = useMemo<CreateDatasetOption[]>(() => {
    const stored = loadStoredEvaluationDatasets()
      .filter(dataset => dataset.source === "mine" && dataset.status === "校验通过")
      .map(dataset => ({ name: dataset.name, source: "我的数据集" as const, modelType: dataset.modelType, tasks: dataset.tasks, version: dataset.version, versions: dataset.versions, status: "校验通过" as const }));
    return [...CREATE_DATASETS, ...stored.filter(dataset => !CREATE_DATASETS.some(item => item.name === dataset.name))];
  }, []);
  const taskOptions = modelType === "语言模型" ? LANGUAGE_TASKS : modelType === "多模态模型" ? MULTIMODAL_TASKS : [];
  const visibleDatasets = modelType
    ? datasetOptions.filter(dataset => dataset.source === datasetSource && dataset.modelType === modelType && dataset.tasks.some(task => taskTypes.includes(task)))
    : [];
  const compatibleSchemeConfigs = availableSchemeConfigs.filter(config => !modelType || config.modelType === modelType);
  const selectedFlowConfig = availableSchemeConfigs.find(config => config.name === flowScheme);

  useEffect(() => {
    setDatasetVersions(current => Object.fromEntries(datasets.map(name => {
      const dataset = datasetOptions.find(item => item.name === name);
      return [name, current[name] || dataset?.version || "v1.0"];
    })));
  }, [datasets, datasetOptions]);

  const applyMetricSelection = (nextMetrics: string[]) => {
    setMetrics(nextMetrics);
    setMetricWeights(equalMetricWeights(nextMetrics));
  };

  const clearInferenceOverrides = () => {
    setMaxTokens(4096);
    setTemperature(1);
    setTopK(5);
    setBatchSize("");
    setSchemeParams({ maxTokens: "", temperature: "", topK: "", batchSize: "" });
    setParamSource("自定义");
  };

  const updateInferenceOverride = (field: "maxTokens" | "temperature" | "topK" | "batchSize", value: number | "") => {
    const values = { maxTokens, temperature, topK, batchSize, [field]: value };
    if (field === "maxTokens") setMaxTokens(value);
    if (field === "temperature") setTemperature(value);
    if (field === "topK") setTopK(value);
    if (field === "batchSize") setBatchSize(value);
    if (!flowScheme) setParamSource(Object.values(values).some(item => item !== "") ? "自定义" : "模型默认");
  };

  const setTaskSelection = (nextTaskTypes: string[]) => {
    setTaskTypes(nextTaskTypes);
    if (!flowScheme) {
      applyMetricSelection(modelType && nextTaskTypes.length ? recommendedMetrics(modelType, nextTaskTypes) : []);
    }
    setDatasets(current => current.filter(name => {
      const dataset = datasetOptions.find(item => item.name === name);
      return dataset?.modelType === modelType && dataset.tasks.some(task => nextTaskTypes.includes(task));
    }));
  };

  const applyFlowScheme = (value: string, initializeScope = false) => {
    setFlowScheme(value);
    if (!value) {
      clearInferenceOverrides();
      applyMetricSelection(modelType && taskTypes.length ? recommendedMetrics(modelType, taskTypes) : []);
      setMetricConditionRule(createDefaultMetricConditionRule());
      return;
    }
    const config = availableSchemeConfigs.find(item => item.name === value);
    if (!config) return;
    if (initializeScope) {
      setModelType(config.modelType);
      setTaskTypes([]);
    }
    setMetrics(Object.keys(config.metricWeights));
    setMetricWeights({ ...config.metricWeights });
    setMetricConditionRule(cloneMetricConditionRule(config.conditionRule));
    setMaxTokens(4096); setTemperature(1); setTopK(5);
    setBatchSize(config.params.batchSize ?? "");
    setSchemeParams({ maxTokens: config.params.maxTokens ?? "", temperature: config.params.temperature ?? "", topK: config.params.topK ?? "", batchSize: config.params.batchSize ?? "" });
    setParamSource("配置方案");
  };

  useEffect(() => {
    if (initialSchemeConfig && initialScheme) applyFlowScheme(initialScheme, true);
  }, []);

  const toggle = (value: string, list: string[], setter: (next: string[]) => void, limit?: number) => {
    if (list.includes(value)) setter(list.filter(item => item !== value));
    else if (!limit || list.length < limit) setter([...list, value]);
  };

  const validate = () => {
    const next: string[] = [];
    if (!name.trim()) next.push("请填写任务名称");
    if (!modelType) next.push("请选择模型类型");
    if (!taskTypes.length) next.push("请选择评测任务");
    if (modelSource === "系统已注册模型" && !models.length) next.push("请选择评测模型");

    if (modelSource === "外部模型 API") {
      try {
        const parsed = new URL(apiUrl);
        if (!/^https?:$/.test(parsed.protocol)) throw new Error("unsupported protocol");
      } catch {
        next.push("请填写有效的 http/https 外部模型 API 地址");
      }
      if (!modelKey.trim()) next.push("请填写 Model Key");
      if (!authType) next.push("请选择鉴权方式");
      if (!apiKey.trim()) next.push("请填写 API Key");
    }
    if (!datasets.length) next.push("请选择评测数据集");
    if (!metrics.length) next.push("请选择评测任务以确定评估指标");
    if (maxTokens !== "" && (!Number.isInteger(maxTokens) || maxTokens < 1)) next.push("最大 Token 必须为大于 0 的整数");
    if (temperature !== "" && (temperature < 0 || temperature > 2)) next.push("Temperature 必须在 0～2 之间");
    if (topK !== "" && (!Number.isInteger(topK) || topK < 1 || topK > 100)) next.push("Top-K 必须为 1～100 的整数");
    if (batchSize === "") next.push("请填写 Batch Size");
    else if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 128) next.push("Batch Size 必须为 1～128 的整数");
    setErrors(next);
    return next.length === 0;
  };

  const submit = () => {
    if (!validate() || !modelType) return;
    const modelDefaults = modelSource === "系统已注册模型" ? MODEL_DEFAULT_PARAMS[models[0]] : undefined;
    const usesSchemeParams = Boolean(selectedFlowConfig);
    const hasOverrides = [maxTokens, temperature, topK, batchSize].some(value => value !== "");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const created: EvalTask = {
      id: `eval_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}_${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      desc: "",
      status: "排队中",
      modelType,
      taskTypes,
      evalModels: modelSource === "系统已注册模型" ? models : [modelVersion || apiUrl],
      modelSource,
      modelVersion,
      apiUrl: modelSource === "系统已注册模型" ? "-" : apiUrl,
      modelKey: modelSource === "外部模型 API" ? modelKey.trim() : undefined,
      authType: modelSource === "外部模型 API" ? authType : undefined,
      apiKey: modelSource === "外部模型 API" ? apiKey.trim() : undefined,
      datasets,
      datasetVersions,
      metrics: metrics.map(m => ({ name: m, score: 0, weight: metricWeights[m] || 0 })),
      metricConditionRule: cloneMetricConditionRule(metricConditionRule),
      params: {
        maxTokens: maxTokens !== "" ? maxTokens : usesSchemeParams && schemeParams.maxTokens !== "" ? schemeParams.maxTokens : modelDefaults?.maxTokens,
        temperature: temperature !== "" ? temperature : usesSchemeParams && schemeParams.temperature !== "" ? schemeParams.temperature : modelDefaults?.temperature,
        topK: topK !== "" ? topK : usesSchemeParams && schemeParams.topK !== "" ? schemeParams.topK : modelDefaults?.topK,
        batchSize: batchSize !== "" ? batchSize : usesSchemeParams && schemeParams.batchSize !== "" ? schemeParams.batchSize : modelDefaults?.batchSize,
        source: hasOverrides ? "自定义" : usesSchemeParams ? "配置方案" : "模型默认",
      },
      stage: "排队中",
      progress: 0,
      creator: "admin",
      createdAt: ts,
      updatedAt: ts,
      scheme: flowScheme ? `流程模板：${flowScheme}` : "未使用配置方案",
    };
    onDone(created);
    onClose();
  };

  const FormRow = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div style={{ display: "grid", gridTemplateColumns: "118px minmax(0, 1fr)", columnGap: 14, alignItems: "start", padding: "8px 0" }}>
      <div style={{ paddingTop: 7 }}><FieldLabel required={required}>{label}</FieldLabel></div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
  const appliedMetricSummary = metrics.map(metric => `${metric} ${metricWeights[metric] || 0}%`).join("、");
  const appliedConditionSummary = conditionRuleSummary(metricConditionRule);
  const appliedParamSummary = (() => {
    if (selectedFlowConfig) {
      const sp = schemeParams;
      return [sp.maxTokens !== "" ? `最大 Token ${sp.maxTokens}` : null, sp.temperature !== "" ? `Temperature ${sp.temperature}` : null, sp.topK !== "" ? `Top-K ${sp.topK}` : null, sp.batchSize !== "" ? `Batch Size ${sp.batchSize}` : null].filter(Boolean).join("、") || "未覆盖，跟随模型默认配置";
    }
    return [maxTokens !== "" ? `最大 Token ${maxTokens}` : null, temperature !== "" ? `Temperature ${temperature}` : null, topK !== "" ? `Top-K ${topK}` : null, batchSize !== "" ? `Batch Size ${batchSize}` : null].filter(Boolean).join("、") || "未覆盖，跟随模型默认配置";
  })();

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(780px, 100vw)", background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "14px 20px", borderBottom: "1px solid #f0f2f7" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: "#1a1d23" }}>创建评测任务</div>
            <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>选择模型类型后，系统会自动更新流程模板、评测任务和数据集</div>
          </div>
          <button title="关闭" aria-label="关闭" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          <div style={{ overflow: "auto", padding: "12px 24px 24px", flex: 1, minHeight: 0 }}>
            {errors.length > 0 && (
              <div style={{ position: "sticky", top: 0, zIndex: 3, marginBottom: 8, padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, color: "#dc2626", fontSize: 13 }}>
                {errors.join("；")}
              </div>
            )}

            <div>
              <FormRow label="任务名称" required>
                <input value={name} onChange={e => setName(e.target.value)} style={inputSt} />
              </FormRow>
              <FormRow label="模型类型" required>
                <ToggleGroup options={["语言模型", "多模态模型"]} value={modelType} onChange={(v) => {
                  const nextType = v as ModelType;
                  setModelType(nextType);
                  setTaskTypes([]);
                  setModels([]);
                  setModelVersion("");
                  setApiUrl("");
                  setDatasetSource("公开数据集");
                  setDatasets([]);
                  setFlowScheme("");
                  applyMetricSelection([]);
                  setMetricConditionRule(createDefaultMetricConditionRule());
                  clearInferenceOverrides();
                }} />
              </FormRow>
              <FormRow label="评测任务" required>
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {taskOptions.map(option => (
                      <button key={option} onClick={() => setTaskSelection(taskTypes.includes(option) ? taskTypes.filter(item => item !== option) : [...taskTypes, option])}
                        style={{ height: 32, padding: "0 12px", borderRadius: 6, border: `1px solid ${taskTypes.includes(option) ? "#4f6ef7" : "#e0e3ed"}`, background: taskTypes.includes(option) ? "#eff4ff" : "#fff", color: taskTypes.includes(option) ? "#4f6ef7" : "#374151", fontSize: 13, cursor: "pointer" }}>
                        {option}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
                    {!modelType ? "请先选择模型类型。" : modelType === "语言模型" ? "语言模型可选择文本理解、代码生成、逻辑推理、问答，可多选。" : "多模态模型可选择图文描述、视觉问答、文档解析，可多选。"}
                  </div>
                </div>
              </FormRow>
              <FormRow label="流程模板">
                <select value={flowScheme} onChange={e => applyFlowScheme(e.target.value)} disabled={!modelType} style={{ ...inputSt, background: !modelType ? "#f7f8fa" : "#fff" }}>
                  <option value="">{!modelType ? "请先选择模型类型" : "不使用流程模板"}</option>
                  {compatibleSchemeConfigs.map(config => <option key={config.name} value={config.name}>{config.name} · {config.version}</option>)}
                </select>
                <div style={{ marginTop: 5, fontSize: 12, color: "#6b7280" }}>仅按模型类型展示；选择后统一回填执行阶段、阶段参数、评估指标和指标权重。</div>
              </FormRow>
              {selectedFlowConfig && (
                <FormRow label="方案应用结果">
                  <div style={{ padding: "10px 12px", background: "#f7f9ff", borderLeft: "3px solid #4f6ef7", borderRadius: 4, fontSize: 12.5, color: "#374151", lineHeight: 1.75 }}>
                    <div><b>流程模板：</b>{selectedFlowConfig.name} · {selectedFlowConfig.version}</div>
                    <div><b>执行流程：</b>{selectedFlowConfig.summary}</div>
                    <div><b>推理参数：</b>{appliedParamSummary}</div>
                    <div><b>评估指标：</b>{appliedMetricSummary || "未配置"}</div>
                    <div><b>样本计算范围：</b>{appliedConditionSummary}</div>
                    <div style={{ marginTop: 3, color: "#6b7280" }}>
                      模型与数据集需继续选择；评估指标及权重来自流程模板的“指标计算”阶段。
                    </div>
                  </div>
                </FormRow>
              )}
              <FormRow label="模型来源" required>
                <ToggleGroup options={["系统已注册模型", "外部模型 API"]} value={modelSource} onChange={v => {
                  setModelSource(v as ModelSource);
                  setModels([]);
                  setModelVersion("");
                  setApiUrl("");
                  setModelKey("");
                  setAuthType("");
                  setApiKey("");
                  clearInferenceOverrides();
                }} />
              </FormRow>
              {modelSource === "系统已注册模型" ? <>
                <FormRow label="评测模型" required>
                  <select value={models[0] || ""} onChange={e => {
                    const selected = e.target.value;
                    setModels(selected ? [selected] : []);
                    setModelVersion(selected && MODEL_VERSIONS[selected] ? MODEL_VERSIONS[selected].recommended : "");
                    clearInferenceOverrides();
                  }} style={inputSt}>
                    <option value="">请选择评测模型</option>
                    {modelType ? MODEL_OPTIONS[modelType].map(model => <option key={model}>{model}</option>) : null}
                  </select>
                  {!modelType && <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>请先选择模型类型。</div>}
                </FormRow>
              </> : <>
                <FormRow label="API 地址" required>
                  <input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="请输入 http/https API 地址" style={inputSt} />
                </FormRow>
                <FormRow label="Model Key" required>
                  <input value={modelKey} onChange={e => setModelKey(e.target.value)} placeholder="例如 gpt-4-turbo, glm-4-flash" style={inputSt} />
                </FormRow>
                <FormRow label="鉴权方式" required>
                  <select value={authType} onChange={e => setAuthType(e.target.value)} style={inputSt}>
                    <option value="">请选择鉴权方式</option>
                    <option>API Key</option>
                    <option>Bearer Token</option>
                    <option>Basic Auth</option>
                  </select>
                </FormRow>
                <FormRow label="API Key" required>
                  <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="请输入 API Key 或 Token" style={inputSt} />
                </FormRow>
              </>}
              <FormRow label="数据来源" required>
                <ToggleGroup options={["公开数据集", "我的数据集", "团队共享数据集"]} value={datasetSource} onChange={v => { setDatasetSource(v as typeof datasetSource); setDatasets([]); }} />
              </FormRow>
              <FormRow label="评测数据集" required>
                <div style={{ position: "relative" }}>
                  <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 7 }}>仅展示已校验通过且匹配当前任务的数据集</div>
                  <button type="button" onClick={() => { setDatasetDropdownOpen(!datasetDropdownOpen); setDatasetSearch(""); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 10px", border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", fontSize: 13, color: datasets.length ? "#1a1d23" : "#9ca3af", cursor: "pointer" }}>
                    {datasets.length ? `已选 ${datasets.length} 个数据集` : "请选择数据集"}
                    <ChevronDown size={14} color="#9ca3af" />
                  </button>
                  {datasets.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {datasets.map(name => (
                        <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#eff4ff", border: "1px solid #dbe5ff", borderRadius: 4, fontSize: 12, color: "#4f6ef7" }}>
                          {name}
                          <button type="button" onClick={() => setDatasets(datasets.filter(d => d !== name))} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", color: "#4f6ef7", display: "inline-flex" }}><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  {datasetDropdownOpen && (
                    <>
                      <div onClick={() => setDatasetDropdownOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9 }} />
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, marginTop: 4, background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", maxHeight: 260, display: "flex", flexDirection: "column" }}>
                      <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f2f7", flexShrink: 0 }}>
                        <input type="text" placeholder="搜索数据集..." value={datasetSearch} onChange={e => setDatasetSearch(e.target.value)}
                          style={{ width: "100%", border: "1px solid #e0e3ed", borderRadius: 4, padding: "5px 8px", fontSize: 12.5, outline: "none" }} autoFocus />
                      </div>
                      <div style={{ overflow: "auto", flex: 1, padding: "6px 0" }}>
                        {visibleDatasets.filter(d => !datasetSearch || d.name.toLowerCase().includes(datasetSearch.toLowerCase())).length === 0 ? (
                          <div style={{ padding: "12px 14px", color: "#9ca3af", fontSize: 12.5 }}>{visibleDatasets.length === 0 ? "当前来源没有匹配的数据集。" : "无匹配结果。"}</div>
                        ) : (
                          visibleDatasets.filter(d => !datasetSearch || d.name.toLowerCase().includes(datasetSearch.toLowerCase())).map(dataset => (
                            <label key={dataset.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                              <input type="checkbox" checked={datasets.includes(dataset.name)} onChange={() => toggle(dataset.name, datasets, setDatasets)} style={{ accentColor: "#4f6ef7" }} />
                              <span>{dataset.name}</span>
                              <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: 11.5 }}>{dataset.version}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                  )}
                </div>
              </FormRow>
              <FormRow label="Batch Size" required>
                <input
                  type="number"
                  min={1}
                  max={128}
                  step={1}
                  value={batchSize}
                  placeholder="请输入 Batch Size"
                  onChange={event => updateInferenceOverride("batchSize", event.target.value === "" ? "" : Number(event.target.value))}
                  style={{ ...inputSt, height: 34, background: "#fff", color: "#1a1d23" }}
                />
                <div style={{ marginTop: 5, color: "#7b8190", fontSize: 11.5, lineHeight: 1.45 }}>
                  必填，取值为 1～128 的整数；数值越大，吞吐越高且显存占用越高。
                </div>
              </FormRow>
              {datasets.length > 0 && <FormRow label="数据集版本" required><div style={{ display: "grid", gap: 8 }}>{datasets.map(name => {
                  const dataset = datasetOptions.find(item => item.name === name);
                  const versions = dataset?.versions?.length ? dataset.versions : [dataset?.version || "v1.0"];
                  return <label key={name} style={{ display: "grid", gridTemplateColumns: "1fr 130px", alignItems: "center", gap: 10, fontSize: 12.5, color: "#374151" }}><span>{name} 数据集版本</span><select aria-label={`${name} 数据集版本`} value={datasetVersions[name] || versions[0]} onChange={event => setDatasetVersions(current => ({ ...current, [name]: event.target.value }))} style={{ ...inputSt, height: 32 }}>{versions.map(version => <option key={version}>{version}{version === dataset?.version ? "（推荐）" : ""}</option>)}</select></label>;
                })}</div></FormRow>}
              <div style={{ padding: "8px 0", borderTop: "1px solid #eef0f5" }}>
                <button type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(value => !value)}
                  style={{ width: "100%", minHeight: 38, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0", border: "none", background: "transparent", color: "#1a1d23", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>高级配置</span>
                  <ChevronDown size={16} color="#9ca3af" style={{ flexShrink: 0, transform: advancedOpen ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} />
                </button>
                {advancedOpen && (
                  <div style={{ padding: "6px 0 8px" }}>
                    <div style={{ marginBottom: 10, fontSize: 12, color: "#6b7280" }}>
                      以下参数已预置推荐值，可根据评测需要手动修改。
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px 16px" }}>
                      {[
                        { key: "maxTokens" as const, label: "最大 Token", min: 1, step: 1, value: maxTokens, hint: "正整数，不得超过模型支持上限；控制单次最大输出长度。" },
                        { key: "temperature" as const, label: "Temperature", min: 0, max: 2, step: 0.1, value: temperature, hint: "0～2；数值越低输出越稳定，建议使用 0.1～1.0。" },
                        { key: "topK" as const, label: "Top-K", min: 1, max: 100, step: 1, value: topK, hint: "1～100 的整数；数值越小，候选词范围越集中。" },
                      ].map(field => (
                        <label key={field.key} style={{ minWidth: 0, fontSize: 12, color: "#374151" }}>
                          <span style={{ display: "block", marginBottom: 5, fontWeight: 500 }}>{field.label}</span>
                          <input type="number" min={field.min} max={field.max} step={field.step} value={field.value}
                            onChange={event => updateInferenceOverride(field.key, event.target.value === "" ? "" : Number(event.target.value))}
                            style={{ ...inputSt, height: 34, background: "#fff", color: "#1a1d23" }} />
                          <span style={{ display: "block", minHeight: 32, marginTop: 5, color: "#7b8190", fontSize: 11.5, lineHeight: 1.45 }}>{field.hint}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "12px 20px", borderTop: "1px solid #f0f2f7" }}>
          <div style={{ fontSize: 12.5, color: "#9ca3af" }}>任务提交后进入队列，执行日志和报告会自动生成。</div>
          <div className="flex items-center gap-2">
            <SecondaryButton onClick={onClose}>取消</SecondaryButton>
            <PrimaryButton onClick={submit}>开始测评</PrimaryButton>
          </div>
        </div>
      </div>
    </>
  );
}

function TaskDetailPage({ task, onClose, onStop, initialTab = "overview" }: { task: EvalTask; onClose: () => void; onStop: (taskId: string) => void; initialTab?: "overview" | "monitor" | "result" | "report" }) {
  const [tab, setTab] = useState<"overview" | "monitor" | "result" | "report">(initialTab);
  const [barScale, setBarScale] = useState(CHART_SCALE_DEFAULT);
  const [lineScale, setLineScale] = useState(CHART_SCALE_DEFAULT);
  const [resultTab, setResultTab] = useState<"metrics" | "samples">("metrics");
  const [sampleKeyword, setSampleKeyword] = useState("");
  const [sampleVerdict, setSampleVerdict] = useState("");
  const barScrollRef = useRef<HTMLDivElement>(null);
  const lineScrollRef = useRef<HTMLDivElement>(null);
  const [barVisibleSeries, setBarVisibleSeries] = useState({ 总体得分: true, Accuracy: true });
  const [lineVisibleSeries, setLineVisibleSeries] = useState({ 总体得分: true, Accuracy: true });
  const [logsPaused, setLogsPaused] = useState(false);
  const [metricDetail, setMetricDetail] = useState<EvalMetric | null>(null);
  const score = scoreOf(task);
  const latencyMetric = task.metrics.find(metric => metric.name === "平均时延")
    || { name: "平均时延", score: 842, weight: 0 };
  const generationSpeedMetric = task.metrics.find(metric => metric.name === "平均生成速度")
    || { name: "平均生成速度", score: 46.8, weight: 0 };
  const resultMetrics = [
    ...task.metrics.filter(metric => !UNWEIGHTED_METRICS.has(metric.name)),
    latencyMetric,
    generationSpeedMetric,
  ];
  const resultMetricCards: EvalMetric[] = [
    { name: "总体得分", score, weight: 100 },
    ...resultMetrics,
  ];
  const monitorStatus = task.status === "排队中" ? "排队中" : task.status === "运行中" ? "执行中" : task.status === "成功" ? "已完成" : task.status;
  const timelineStages = ["任务创建", "排队中", "环境加载", "数据预处理", "模型推理", "指标计算", "报告生成", "任务完成"];
  const mappedStageIndex = timelineStages.indexOf(task.stage);
  const currentTimelineIndex = task.status === "成功"
    ? timelineStages.length - 1
    : task.status === "排队中"
      ? 1
      : mappedStageIndex >= 0
        ? mappedStageIndex
        : task.progress >= 80 ? 5 : task.progress >= 20 ? 4 : 2;
  const stageTime = (index: number, isEnd = false) => {
    const base = new Date(task.createdAt.replace(" ", "T")).getTime();
    const value = new Date(base + (index * 4 + (isEnd ? 3 : 0)) * 60_000);
    return value.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };
  const metricSamples = samplesForMetricCalculation(task);
  const conditionHasNoMatches = cloneMetricConditionRule(task.metricConditionRule).mode === "filter" && metricSamples.length === 0;
  const logLines = [
    `[${task.createdAt}] 任务已创建，写入执行队列`,
    `[${task.createdAt}] 环境加载：运行时、评测依赖和模型连接初始化完成`,
    `[${task.createdAt}] 数据预处理：已加载并清洗数据集 ${task.datasets.join(", ")}`,
    `[${task.createdAt}] 样本筛选：${conditionRuleSummary(task.metricConditionRule)}，${metricSamples.length} 条样本进入指标计算`,
    task.status === "运行中" ? `[${task.updatedAt}] 正在执行模型推理，当前进度 ${task.progress}%` : `[${task.updatedAt}] 当前阶段：${task.stage}`,
    task.status === "失败"
      ? `[${task.updatedAt}] ERROR：模型推理失败，${task.failureReason}`
      : conditionHasNoMatches
        ? `[${task.updatedAt}] ERROR：样本计算范围未命中任何数据，指标计算阶段失败`
        : `[${task.updatedAt}] 指标计算：指标任务已提交，报告生成状态正常`,
  ];
  const visibleSamples = metricSamples.filter(sample => !sampleKeyword || `${sample.id} ${sample.prompt} ${sample.output}`.toLowerCase().includes(sampleKeyword.toLowerCase())).filter(sample => !sampleVerdict || sample.verdict === sampleVerdict);

  const infoRows = [
    ["任务 ID", task.id],
    ["任务名称", task.name],
    ["模型类型", task.modelType],
    ["任务类型", task.taskTypes.join("、")],
    ["模型来源", task.modelSource],
    ["评测模型", task.evalModels.join("、")],
    ["模型版本", task.modelVersion],
    ["配置方案", task.scheme || "未使用配置方案"],
    ...(task.modelSource === "外部模型 API" ? [["API 地址", task.apiUrl], ["Model Key", task.modelKey || "-"], ["鉴权方式", task.authType || "-"], ["API Key", "••••••"]] : []),
    ["评测数据与版本", task.datasets.map(dataset => `${dataset} ${task.datasetVersions?.[dataset] || "未记录版本"}`).join("、")],
    ["评估指标与权重", task.metrics.map(metric => UNWEIGHTED_METRICS.has(metric.name) ? `${metric.name}（不参与权重）` : `${metric.name} ${metric.weight}%`).join("、")],
    ["样本计算范围", `${conditionRuleSummary(task.metricConditionRule)}（命中 ${metricSamples.length} 条）`],
    ["推理参数来源", task.params.source || "未记录"],
    ["创建人", task.creator],
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "10px 18px 0", fontSize: 12.5, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span><span style={{ color: "#4f6ef7" }}>模型评测</span><span>/</span><button onClick={onClose} style={{ border: "none", background: "none", color: "#4f6ef7", padding: 0, cursor: "pointer" }}>评测任务</button><span>/</span><span style={{ color: "#1a1d23" }}>任务详情</span>
      </div>
      <div style={{ margin: "10px 18px 18px", minHeight: 0, flex: 1, background: "#fff", border: "1px solid #e8ebf2", borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "13px 18px 0", borderBottom: "1px solid #f0f2f7" }}>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 17, fontWeight: 600, color: "#1a1d23" }}>{task.name}</span>
              <StatusBadge status={task.status} />
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", margin: "3px 0 8px" }}>{task.id}</div>
            <div className="flex items-center gap-1">
              {[
                ["overview", "任务概览"],
                ["monitor", "执行监控"],
                ["result", "评测结果"],
                ["report", "评测报告"],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key as typeof tab)}
                  style={{ padding: "8px 11px", border: "none", borderBottom: tab === key ? "2px solid #4f6ef7" : "2px solid transparent", background: "none", color: tab === key ? "#4f6ef7" : "#6b7280", fontSize: 13, fontWeight: tab === key ? 600 : 400, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <SecondaryButton onClick={onClose}><ChevronLeft size={14} />返回任务列表</SecondaryButton>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: 16, background: "#f5f7fa" }}>
          {tab === "overview" && (
            <div style={{ ...panelSt, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23", marginBottom: 14 }}>配置回显</div>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: "11px 12px", fontSize: 13 }}>
                {infoRows.map(([label, value]) => (
                  <div key={label} style={{ display: "contents" }}>
                    <span style={{ color: "#6b7280" }}>{label}</span>
                    <span style={{ color: "#1a1d23", wordBreak: "break-all" }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: "contents" }}>
                  <span style={{ color: "#6b7280" }}>最大 Token</span>
                  <span style={{ color: "#1a1d23", wordBreak: "break-all" }}>{inferenceParamText(task.params.maxTokens, task.params.source)}</span>
                </div>
                <div style={{ display: "contents" }}>
                  <span style={{ color: "#6b7280" }}>Temperature</span>
                  <span style={{ color: "#1a1d23", wordBreak: "break-all" }}>{inferenceParamText(task.params.temperature, task.params.source)}</span>
                </div>
                <div style={{ display: "contents" }}>
                  <span style={{ color: "#6b7280" }}>Top-K</span>
                  <span style={{ color: "#1a1d23", wordBreak: "break-all" }}>{inferenceParamText(task.params.topK, task.params.source)}</span>
                </div>
                <div style={{ display: "contents" }}>
                  <span style={{ color: "#6b7280" }}>Batch Size</span>
                  <span style={{ color: "#1a1d23", wordBreak: "break-all" }}>{inferenceParamText(task.params.batchSize, task.params.source)}</span>
                </div>
              </div>
              {task.failureReason && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontSize: 13 }}>
                  失败原因：{task.failureReason}
                </div>
              )}
            </div>
          )}

          {tab === "monitor" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
              <div style={{ ...panelSt, padding: 16 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                  <div className="flex items-center gap-2"><div style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>执行状态</div><span style={{ padding: "2px 7px", borderRadius: 5, background: "#eff4ff", color: "#4f6ef7", fontSize: 12 }}>{monitorStatus}</span></div>
                  <div className="flex items-center gap-2">{(task.status === "运行中" || task.status === "排队中") && <SecondaryButton onClick={() => onStop(task.id)}>停止</SecondaryButton>}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 8, marginBottom: 18 }}>
                  {timelineStages.map((stage, index) => {
                    const started = index <= currentTimelineIndex;
                    const completed = task.status === "成功" || index < currentTimelineIndex;
                    return (
                      <div key={stage} style={{ padding: "10px 8px", borderRadius: 8, background: started ? "#eff4ff" : "#f8f9fc", color: started ? "#4f6ef7" : "#6b7280", fontSize: 12.5, border: `1px solid ${started ? "#c7d9ff" : "#eef1f6"}` }}>
                        <div style={{ textAlign: "center", fontWeight: 600 }}>{stage}</div>
                        <div style={{ fontSize: 10.5, marginTop: 5, color: "#6b7280", lineHeight: 1.55 }}>开始：{started ? stageTime(index) : "--:--:--"}<br />结束：{completed ? stageTime(index, true) : index === currentTimelineIndex ? (task.status === "失败" ? "失败" : task.status === "已停止" ? "已停止" : "进行中") : "--:--:--"}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: "#111827", color: "#d1d5db", borderRadius: 8, padding: 14, height: 260, fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.8, overflowY: "auto", position: "relative" }}>
                  <div style={{ color: "#93c5fd", marginBottom: 6 }}>日志自动滚动：{logsPaused ? "已暂停" : "运行中"}</div>
                  {logLines.map(line => <div key={line} style={{ color: line.includes("ERROR") ? "#fca5a5" : "#d1d5db" }}>{line}</div>)}
                  <div style={{ position: "sticky", bottom: 0, display: "flex", justifyContent: "flex-end", paddingTop: 8, background: "linear-gradient(transparent, #111827 40%)" }}>
                    <button onClick={() => setLogsPaused(value => !value)} style={{ padding: "4px 10px", border: "1px solid #374151", borderRadius: 4, background: "#1f2937", color: "#d1d5db", fontSize: 11.5, cursor: "pointer" }}>{logsPaused ? "继续自动滚动" : "暂停自动滚动"}</button>
                  </div>
                </div>
              </div>
              <div style={{ ...panelSt, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>资源占用</div>
                {[
                  ["GPU 利用率", task.status === "运行中" ? "76%" : task.status === "成功" ? "0%" : "—"],
                  ["内存占用", task.status === "运行中" ? "64 GB" : task.status === "成功" ? "0 GB" : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between" style={{ padding: "10px 0", borderBottom: "1px solid #f0f2f7", fontSize: 13 }}>
                    <span style={{ color: "#6b7280" }}>{label}</span><span style={{ color: "#1a1d23", fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "result" && (
            task.status === "成功" ? (
              <div style={{ ...panelSt, overflow: "hidden" }}>
                <div className="flex items-center justify-between" style={{ borderBottom: "1px solid #f0f2f7", padding: "0 16px" }}>
                  <div className="flex items-center gap-1">{[["metrics", "指标统计"], ["samples", "数据明细"]].map(([key, label]) => <button key={key} onClick={() => setResultTab(key as typeof resultTab)} style={{ padding: "13px 14px", border: "none", borderBottom: resultTab === key ? "2px solid #4f6ef7" : "2px solid transparent", background: "none", color: resultTab === key ? "#4f6ef7" : "#6b7280", fontWeight: resultTab === key ? 600 : 400, cursor: "pointer" }}>{label}</button>)}</div>
                  <div className="flex items-center gap-2"><SecondaryButton onClick={() => downloadResultData(task, "csv")}><Download size={13} />导出 CSV</SecondaryButton><SecondaryButton onClick={() => downloadResultData(task, "excel")}><Download size={13} />导出 Excel</SecondaryButton></div>
                </div>
                {conditionHasNoMatches && <div style={{ margin: "12px 14px 0", padding: "10px 12px", border: "1px solid #fecaca", borderRadius: 7, background: "#fef2f2", color: "#dc2626", fontSize: 12.5 }}><b>指标计算失败：</b>样本计算范围未命中任何数据，本次不生成数值得分。请调整流程模板的筛选条件后重新评测。</div>}
                {resultTab === "metrics" ? conditionHasNoMatches
                  ? <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>没有符合样本计算范围的数据，暂无指标结果。</div>
                  : <div style={{ padding: 14, display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", border: "1px solid #e8ebf2", borderRadius: 8 }}>
                    {resultMetricCards.map((metric, index) => {
                      const isEfficiencyMetric = UNWEIGHTED_METRICS.has(metric.name);
                      const positive = metric.score >= 80;
                      const cardStyle = { padding: "11px 14px", textAlign: "left" as const, border: "none", borderRight: index < resultMetricCards.length - 1 ? "1px solid #eef1f6" : "none", background: "#fff" };
                      if (isEfficiencyMetric) {
                        return <div key={metric.name} style={cardStyle}><div style={{ fontSize: 12, color: "#6b7280" }}>{metric.name}</div><div style={{ marginTop: 8, fontSize: 21, fontWeight: 700 }}>{metricValueText(metric)}</div></div>;
                      }
                      return <button key={metric.name} onClick={() => setMetricDetail(metric)} style={{ ...cardStyle, cursor: "pointer" }}><div className="flex items-center justify-between"><span style={{ fontSize: 12, color: "#6b7280" }}>{metric.name}</span>{positive ? <ArrowUp size={14} color="#16a34a" /> : <ArrowDown size={14} color="#ea580c" />}</div><div className="flex items-end justify-between" style={{ marginTop: 4 }}><span style={{ fontSize: 21, fontWeight: 700 }}>{metricValueText(metric)}</span><span style={{ color: positive ? "#16a34a" : "#ea580c", fontSize: 11 }}>{positive ? "表现良好" : "建议优化"}</span></div><div style={{ fontSize: 11, color: "#4f6ef7", marginTop: 3 }}>查看指标详情</div></button>;
                    })}
                  </div>
                  {/* Bar chart: 不同数据集得分 */}
                  <div style={{ border: "1px solid #e8ebf2", borderRadius: 8, padding: 13 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>不同数据集得分</div>
                      <div className="flex items-center gap-2">
                        <button title="缩小图表（最低 80%）" onClick={() => setBarScale(v => Math.max(CHART_SCALE_MIN, Number((v - CHART_SCALE_STEP).toFixed(1))))} disabled={barScale <= CHART_SCALE_MIN} style={{ border: "none", background: "none", color: barScale <= CHART_SCALE_MIN ? "#c4c8d0" : "#6b7280", cursor: barScale <= CHART_SCALE_MIN ? "not-allowed" : "pointer" }}><ZoomOut size={14} /></button>
                        <span title="缩放范围 80%–150%" style={{ minWidth: 34, textAlign: "center", fontSize: 11.5, color: "#6b7280" }}>{Math.round(barScale * 100)}%</span>
                        <button title="放大图表（最高 150%）" onClick={() => setBarScale(v => Math.min(CHART_SCALE_MAX, Number((v + CHART_SCALE_STEP).toFixed(1))))} disabled={barScale >= CHART_SCALE_MAX} style={{ border: "none", background: "none", color: barScale >= CHART_SCALE_MAX ? "#c4c8d0" : "#6b7280", cursor: barScale >= CHART_SCALE_MAX ? "not-allowed" : "pointer" }}><ZoomIn size={14} /></button>
                        <button title="向左平移图表" onClick={() => barScrollRef.current?.scrollBy({ left: -180, behavior: "smooth" })} style={{ border: "none", background: "none", color: "#6b7280", cursor: "pointer" }}><ChevronLeft size={14} /></button>
                        <button title="向右平移图表" onClick={() => barScrollRef.current?.scrollBy({ left: 180, behavior: "smooth" })} style={{ border: "none", background: "none", color: "#6b7280", cursor: "pointer" }}><ChevronRight size={14} /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3" style={{ marginBottom: 6, fontSize: 12.5 }}>
                      {(["总体得分", "Accuracy"] as const).map(series => (
                        <label key={series} className="flex items-center gap-1" style={{ color: "#6b7280", cursor: "pointer" }}>
                          <input type="checkbox" checked={barVisibleSeries[series]} onChange={e => setBarVisibleSeries(c => ({ ...c, [series]: e.target.checked }))} />{series}
                        </label>
                      ))}
                      <span style={{ color: "#9ca3af" }}>点击图例显示/隐藏 · 悬停查看数值 · 缩放平移查看细节</span>
                    </div>
                    <div ref={barScrollRef} style={{ overflowX: "auto" }}>
                      <div style={{ width: `${Math.round(barScale * 100)}%`, minWidth: barScale > 1 ? 720 : 0 }}>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={taskChartData(task)} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip />
                            <Legend />
                            {barVisibleSeries["总体得分"] && <Bar dataKey="总体得分" fill="#4f6ef7" radius={[4, 4, 0, 0]} />}
                            {barVisibleSeries.Accuracy && <Bar dataKey="Accuracy" fill="#14b8a6" radius={[4, 4, 0, 0]} />}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Line chart + Radar side by side */}
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 12 }}>
                    <div style={{ border: "1px solid #e8ebf2", borderRadius: 8, padding: 13 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>性能随参数变化趋势</div>
                        <div className="flex items-center gap-2">
                          <button title="缩小图表（最低 80%）" onClick={() => setLineScale(v => Math.max(CHART_SCALE_MIN, Number((v - CHART_SCALE_STEP).toFixed(1))))} disabled={lineScale <= CHART_SCALE_MIN} style={{ border: "none", background: "none", color: lineScale <= CHART_SCALE_MIN ? "#c4c8d0" : "#6b7280", cursor: lineScale <= CHART_SCALE_MIN ? "not-allowed" : "pointer" }}><ZoomOut size={14} /></button>
                          <span title="缩放范围 80%–150%" style={{ minWidth: 34, textAlign: "center", fontSize: 11.5, color: "#6b7280" }}>{Math.round(lineScale * 100)}%</span>
                          <button title="放大图表（最高 150%）" onClick={() => setLineScale(v => Math.min(CHART_SCALE_MAX, Number((v + CHART_SCALE_STEP).toFixed(1))))} disabled={lineScale >= CHART_SCALE_MAX} style={{ border: "none", background: "none", color: lineScale >= CHART_SCALE_MAX ? "#c4c8d0" : "#6b7280", cursor: lineScale >= CHART_SCALE_MAX ? "not-allowed" : "pointer" }}><ZoomIn size={14} /></button>
                          <button title="向左平移图表" onClick={() => lineScrollRef.current?.scrollBy({ left: -180, behavior: "smooth" })} style={{ border: "none", background: "none", color: "#6b7280", cursor: "pointer" }}><ChevronLeft size={14} /></button>
                          <button title="向右平移图表" onClick={() => lineScrollRef.current?.scrollBy({ left: 180, behavior: "smooth" })} style={{ border: "none", background: "none", color: "#6b7280", cursor: "pointer" }}><ChevronRight size={14} /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3" style={{ marginBottom: 6, fontSize: 12.5 }}>
                        {(["总体得分", "Accuracy"] as const).map(series => (
                          <label key={series} className="flex items-center gap-1" style={{ color: "#6b7280", cursor: "pointer" }}>
                            <input type="checkbox" checked={lineVisibleSeries[series]} onChange={e => setLineVisibleSeries(c => ({ ...c, [series]: e.target.checked }))} />{series}
                          </label>
                        ))}
                        <span style={{ color: "#9ca3af" }}>点击图例显示/隐藏 · 悬停查看数值 · 缩放平移查看细节</span>
                      </div>
                      <div ref={lineScrollRef} style={{ overflowX: "auto" }}>
                        <div style={{ width: `${Math.round(lineScale * 100)}%`, minWidth: lineScale > 1 ? 720 : 0 }}>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={parameterTrendData(task)} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" vertical={false} />
                              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                              <Tooltip />
                              <Legend />
                              {lineVisibleSeries["总体得分"] && <Line type="monotone" dataKey="总体得分" stroke="#4f6ef7" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
                              {lineVisibleSeries.Accuracy && <Line type="monotone" dataKey="Accuracy" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                    <div style={{ border: "1px solid #e8ebf2", borderRadius: 8, padding: 13 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>能力分布</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData(task)}><PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} /><Radar name={task.evalModels[0]} dataKey="value" stroke="#4f6ef7" fill="#4f6ef7" fillOpacity={0.2} /></RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ border: "1px solid #e8ebf2", borderRadius: 8, overflow: "hidden" }}><div style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600, borderBottom: "1px solid #f0f2f7" }}>指标汇总</div><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["指标", "结果", "权重", "通过率", "操作"].map(column => <th key={column} style={thSt}>{column}</th>)}</tr></thead><tbody>{resultMetrics.map((metric, index) => {
                    const isEfficiencyMetric = UNWEIGHTED_METRICS.has(metric.name);
                    return <tr key={metric.name}><td style={{ ...tdSt, fontWeight: 600 }}>{metric.name}</td><td style={tdSt}>{metricValueText(metric)}</td><td style={tdSt}>{metricWeightText(metric)}</td><td style={tdSt}>{isEfficiencyMetric ? "—" : `${Math.max(58, 88 - index * 6)}%`}</td><td style={tdSt}>{isEfficiencyMetric ? "—" : <TextButton onClick={() => setMetricDetail(metric)}>查看详情</TextButton>}</td></tr>;
                  })}</tbody></table></div>
                </div> : <div>
                  <div className="flex items-center justify-between" style={{ padding: "10px 14px", background: "#f7f9ff", borderBottom: "1px solid #e6ebfb", fontSize: 12.5 }}>
                    <span><b>指标计算范围：</b>{conditionRuleSummary(task.metricConditionRule)}</span>
                    <span style={{ color: "#4f6ef7" }}>参与计算 {metricSamples.length} 条</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap" style={{ padding: 14, borderBottom: "1px solid #f0f2f7" }}><div className="flex items-center" style={{ border: "1px solid #e0e3ed", borderRadius: 6, height: 34, padding: "0 10px" }}><Search size={13} color="#9ca3af" /><input value={sampleKeyword} onChange={event => setSampleKeyword(event.target.value)} placeholder="样本 ID / Prompt / 模型输出" style={{ width: 230, border: "none", outline: "none", paddingLeft: 7, fontSize: 13 }} /></div><select value={sampleVerdict} onChange={event => setSampleVerdict(event.target.value)} style={{ ...inputSt, width: 120, height: 34 }}><option value="">全部判分</option><option>通过</option><option>未通过</option></select><select style={{ ...inputSt, width: 150, height: 34 }}><option>{task.datasets[0]}</option>{task.datasets.slice(1).map(dataset => <option key={dataset}>{dataset}</option>)}</select><SecondaryButton onClick={() => { setSampleKeyword(""); setSampleVerdict(""); }}><RotateCcw size={13} />重置</SecondaryButton></div>
                  <div style={{ overflow: "auto" }}><table style={{ width: "100%", minWidth: 1120, borderCollapse: "collapse" }}><thead><tr>{["样本 ID", "Prompt", "模型输出", "标准答案 / Completion", "总体得分", "判分结果"].map(column => <th key={column} style={thSt}>{column}</th>)}</tr></thead><tbody>{visibleSamples.map(sample => <tr key={sample.id}><td style={{ ...tdSt, fontFamily: "monospace" }}>{sample.id}</td><td style={{ ...tdSt, maxWidth: 230 }}>{sample.prompt}</td><td style={{ ...tdSt, maxWidth: 250 }}>{sample.output}</td><td style={{ ...tdSt, maxWidth: 250 }}>{sample.reference}</td><td style={{ ...tdSt, fontWeight: 600 }}>{(sample.score * 100).toFixed(0)}</td><td style={tdSt}><Chip tone={sample.verdict === "通过" ? "green" : "orange"}>{sample.verdict}</Chip></td></tr>)}</tbody></table></div>
                  <div className="flex items-center justify-between" style={{ padding: "11px 14px", borderTop: "1px solid #f0f2f7", color: "#6b7280", fontSize: 12.5 }}><span>共 {visibleSamples.length} 条，默认展示前 100 条</span><span>第 1 / 1 页</span></div>
                </div>}
              </div>
            ) : <div style={{ ...panelSt, padding: 40, textAlign: "center", color: "#9ca3af" }}>任务尚未成功完成，暂无评测结果。</div>
          )}

          {tab === "report" && (
            task.status === "成功" ? (
              <div style={{ ...panelSt, overflow: "hidden" }}>
                {/* Report cover header */}
                <div style={{ background: "linear-gradient(135deg, #eef3ff 0%, #dbe5ff 100%)", padding: "26px 28px", display: "flex", alignItems: "center", gap: 32, borderBottom: "1px solid #dbe5ff" }}>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 52, fontWeight: 800, color: "#4f6ef7", lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>总体得分</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1d23", marginBottom: 8 }}>{task.name} 测评报告</div>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", fontSize: 12.5, color: "#374151" }}>
                      <span style={{ color: "#6b7280" }}>任务 ID</span><span>{task.id}</span>
                      <span style={{ color: "#6b7280" }}>评测模型</span><span style={{ fontWeight: 600 }}>{task.evalModels.join("、")}</span>
                      <span style={{ color: "#6b7280" }}>模型版本</span><span>{task.modelVersion} · {task.modelType} · {task.modelSource}</span>
                      <span style={{ color: "#6b7280" }}>生成时间</span><span>{task.updatedAt}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, alignSelf: "flex-start" }}>
                    <PrimaryButton onClick={() => downloadReport(task)}><Download size={13} />下载 PDF</PrimaryButton>
                  </div>
                </div>

                <div className="overflow-auto" style={{ padding: 24, maxHeight: "calc(100vh - 340px)", background: "#fff" }}>
                  {/* Section 1: 测评概述 */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1d23", marginBottom: 14, paddingLeft: 10, borderLeft: "4px solid #4f6ef7" }}>一、测评概述</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        ["任务目标", task.desc || `评估模型在 ${task.taskTypes.join("、")} 任务上的综合表现，衡量模型能力水平与业务适配性。`],
                        ["模型信息", `评测对象：${task.evalModels.join("、")} ｜ 模型类型：${task.modelType} ｜ 版本：${task.modelVersion} ｜ 来源：${task.modelSource}${task.modelSource === "外部模型 API" ? ` ｜ API：${task.apiUrl}` : ""}`],
                        ["数据集介绍", `${task.datasets.map(d => `${d}（${datasetVersionOf(task, d)}）`).join("、")}，覆盖 ${task.taskTypes.join("、")} 任务。`],
                        ["推理参数", `来源：${task.params.source || "未记录"} ｜ 最大 Token：${inferenceParamText(task.params.maxTokens, task.params.source)} ｜ Temperature：${inferenceParamText(task.params.temperature, task.params.source)} ｜ Top-K：${inferenceParamText(task.params.topK, task.params.source)} ｜ Batch Size：${inferenceParamText(task.params.batchSize, task.params.source)}`],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px" }}>
                          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6, fontWeight: 600 }}>{label}</div>
                          <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: 详细指标得分 */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1d23", marginBottom: 14, paddingLeft: 10, borderLeft: "4px solid #4f6ef7" }}>二、详细指标得分</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: 10, marginBottom: 16 }}>
                      {task.metrics.map(m => {
                        const isEfficiencyMetric = UNWEIGHTED_METRICS.has(m.name);
                        const pct = Math.round((m.score / 100) * 100);
                        const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#f59e0b" : "#dc2626";
                        return (
                          <div key={m.name} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, textAlign: "center" }}>
                            <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 6 }}>{m.name}</div>
                            <div style={{ fontSize: 26, fontWeight: 700, color: isEfficiencyMetric ? "#1f2937" : color }}>{metricValueText(m)}</div>
                            {!isEfficiencyMetric && <><div style={{ marginTop: 4, height: 6, borderRadius: 3, background: "#e5e7eb" }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color }} /></div><div style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>权重 {m.weight}%</div></>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ border: "1px solid #e8ebf2", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #f0f2f7", background: "#fafbfc" }}>指标汇总</div>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr>{["指标", "得分", "权重", "通过率", "分数分布"].map(c => <th key={c} style={thSt}>{c}</th>)}</tr></thead>
                        <tbody>{task.metrics.map((m, i) => {
                          const isEfficiencyMetric = UNWEIGHTED_METRICS.has(m.name);
                          const pct = Math.round((m.score / 100) * 100);
                          return <tr key={m.name}><td style={{ ...tdSt, fontWeight: 600 }}>{m.name}</td><td style={tdSt}>{metricValueText(m)}</td><td style={tdSt}>{metricWeightText(m)}</td><td style={tdSt}>{isEfficiencyMetric ? "—" : `${Math.max(58, 88 - i * 6)}%`}</td><td style={tdSt}>{isEfficiencyMetric ? "—" : <div style={{ height: 6, borderRadius: 3, background: "#e5e7eb", maxWidth: 140 }}><div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "#4f6ef7" }} /></div>}</td></tr>;
                        })}</tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 3: 各分项任务表现分析 */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1d23", marginBottom: 14, paddingLeft: 10, borderLeft: "4px solid #4f6ef7" }}>三、各分项任务表现分析</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div style={{ border: "1px solid #e8ebf2", borderRadius: 8, overflow: "hidden" }}>
                        <div style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #f0f2f7", background: "#fafbfc" }}>按任务类型</div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead><tr><th style={thSt}>任务类型</th><th style={thSt}>总体得分</th></tr></thead>
                          <tbody>{task.taskTypes.map(t => {
                            const taskScore = Math.max(62, Math.min(96, score - (task.taskTypes.indexOf(t) * 3) + (task.taskTypes.indexOf(t) % 2 === 0 ? 5 : -2)));
                            const barW = Math.round(taskScore);
                            const barColor = barW >= 80 ? "#16a34a" : barW >= 65 ? "#f59e0b" : "#dc2626";
                            return <tr key={t}><td style={{ ...tdSt, fontWeight: 600 }}>{t}</td><td style={tdSt}><div className="flex items-center gap-2"><div style={{ flex: 1, height: 7, borderRadius: 4, background: "#e5e7eb", maxWidth: 180 }}><div style={{ width: `${barW}%`, height: "100%", borderRadius: 4, background: barColor }} /></div><span style={{ fontWeight: 600, fontSize: 12.5, whiteSpace: "nowrap" }}>{taskScore.toFixed(1)}</span></div></td></tr>;
                          })}</tbody>
                        </table>
                      </div>
                      <div style={{ border: "1px solid #e8ebf2", borderRadius: 8, overflow: "hidden" }}>
                        <div style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600, borderBottom: "1px solid #f0f2f7", background: "#fafbfc" }}>按数据集</div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead><tr><th style={thSt}>数据集</th><th style={thSt}>总体得分</th></tr></thead>
                          <tbody>{task.datasets.map((d, i) => {
                            const ds = Math.max(55, Math.min(96, score - i * 2 + 3));
                            const w = Math.round(ds);
                            return <tr key={d}><td style={{ ...tdSt, fontWeight: 600 }}>{d}</td><td style={tdSt}><div className="flex items-center gap-2"><div style={{ flex: 1, height: 7, borderRadius: 4, background: "#e5e7eb", maxWidth: 180 }}><div style={{ width: `${w}%`, height: "100%", borderRadius: 4, background: "#4f6ef7" }} /></div><span style={{ fontWeight: 600, fontSize: 12.5 }}>{ds.toFixed(1)}</span></div></td></tr>;
                          })}</tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: 结论与建议 */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1d23", marginBottom: 14, paddingLeft: 10, borderLeft: "4px solid #4f6ef7" }}>四、结论与建议</div>
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 16, marginBottom: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>综合表现</div>
                      <p style={{ margin: 0, fontSize: 13.5, color: "#374151", lineHeight: 1.8 }}>{task.evalModels[0]} 在 {task.taskTypes.join("、")} 任务上的总体得分为 <b>{score}</b>，整体表现{score >= 80 ? "优秀，已达到业务试用标准" : score >= 65 ? "良好，建议在特定场景下试用" : "有待提升，建议针对性优化后再评测"}。</p>
                    </div>
                    {task.metrics.filter(m => !UNWEIGHTED_METRICS.has(m.name) && m.score >= 80).length > 0 && (
                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 16, marginBottom: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>优势领域</div>
                        <p style={{ margin: 0, fontSize: 13.5, color: "#374151", lineHeight: 1.8 }}>在 {task.metrics.filter(m => !UNWEIGHTED_METRICS.has(m.name) && m.score >= 80).map(m => m.name).join("、")} 指标上表现突出，得分均超过 80 分，表明模型在这些维度上具备较强能力。</p>
                      </div>
                    )}
                    {task.metrics.filter(m => !UNWEIGHTED_METRICS.has(m.name) && m.score < 70).length > 0 && (
                      <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: 16, marginBottom: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#b45309", marginBottom: 6 }}>待改进项</div>
                        <p style={{ margin: 0, fontSize: 13.5, color: "#374151", lineHeight: 1.8 }}>{task.metrics.filter(m => !UNWEIGHTED_METRICS.has(m.name) && m.score < 70).map(m => m.name).join("、")} 指标得分低于 70 分，建议针对相关任务类型补充高质量训练数据，并调整推理参数后复测。</p>
                      </div>
                    )}
                    <div style={{ background: "#eff4ff", border: "1px solid #dbe5ff", borderRadius: 8, padding: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#4f6ef7", marginBottom: 6 }}>建议</div>
                      <ul style={{ margin: "4px 0", paddingLeft: 20, fontSize: 13.5, color: "#374151", lineHeight: 1.9 }}>
                        <li>针对低分任务类型补充对应领域的数据集，进行二次评测验证。</li>
                        <li>保持相同数据集版本和推理参数，确保评测结果可复现、可对比。</li>
                        <li>建议定期（如每月）执行回归评测，追踪模型能力变化趋势。</li>
                        <li>{score >= 80 ? "当前模型可进入业务试用阶段，建议在实际业务数据上进行 A/B 验证。" : "在业务上线前完成高优先级任务的全量评测，确保关键场景的可靠性。"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : <div style={{ ...panelSt, padding: 40, textAlign: "center", color: "#9ca3af" }}>报告将在任务成功后自动生成。</div>
          )}
        </div>
        {metricDetail && (
          <>
            <div onClick={() => setMetricDetail(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 200 }} />
            <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, background: "#fff", zIndex: 201, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", padding: 22, overflow: "auto" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 20 }}><div style={{ fontSize: 17, fontWeight: 600 }}>指标详情：{metricDetail.name}</div><button onClick={() => setMetricDetail(null)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} /></button></div>
              <div style={{ display: "grid", gap: 14, fontSize: 13.5, color: "#374151", lineHeight: 1.8 }}>
                <div><b>计算方式</b><p style={{ margin: "4px 0 0" }}>{metricDetail.name === "总体得分" ? "按各评估指标权重进行加权求和。" : METRIC_DETAILS[metricDetail.name]?.formula || "按该指标定义对评测样本进行计算。"}</p></div>
                <div><b>子项得分</b><p style={{ margin: "4px 0 0" }}>Precision {Math.max(0, metricDetail.score - 1.2).toFixed(1)}，Recall {Math.max(0, metricDetail.score - 2.1).toFixed(1)}，F1 {Math.max(0, metricDetail.score - 1.6).toFixed(1)}，当前权重 {metricDetail.weight}%。</p></div>
                <div><b>样本分布</b><p style={{ margin: "4px 0 0" }}>正确 82%，部分正确 11%，错误 7%。</p></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DeleteModal({ task, onClose, onConfirm }: { task: EvalTask; onClose: () => void; onConfirm: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, background: "#fff", borderRadius: 12, zIndex: 201, boxShadow: "0 24px 64px rgba(0,0,0,0.16)", padding: "24px 24px 20px" }}>
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle size={22} color="#f59e0b" />
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>删除评测任务</span>
        </div>
        <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.7, marginBottom: 18 }}>删除后任务记录和报告将不可恢复，确定删除 <b>{task.name}</b> 吗？</div>
        <div className="flex items-center justify-end gap-2">
          <SecondaryButton onClick={onClose}>取消</SecondaryButton>
          <PrimaryButton onClick={onConfirm}>确定</PrimaryButton>
        </div>
      </div>
    </>
  );
}

function StopModal({ task, onClose, onConfirm }: { task: EvalTask; onClose: () => void; onConfirm: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 220 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, background: "#fff", borderRadius: 8, zIndex: 221, boxShadow: "0 24px 64px rgba(0,0,0,0.16)", padding: 24 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 12 }}><AlertCircle size={22} color="#f59e0b" /><span style={{ fontSize: 16, fontWeight: 600 }}>停止评测任务</span></div>
        <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.7, marginBottom: 18 }}>确定停止 <b>{task.name}</b> 吗？停止后已执行的部分会保留，任务状态将变为“已停止”。</div>
        <div className="flex items-center justify-end gap-2"><SecondaryButton onClick={onClose}>取消</SecondaryButton><PrimaryButton onClick={onConfirm}>确认停止</PrimaryButton></div>
      </div>
    </>
  );
}

export function ModelEvaluationPage({ initialModel, onInitialModelConsumed }: { initialModel?: string | null; onInitialModelConsumed?: () => void }) {
  const [tasks, setTasks] = useState<EvalTask[]>(loadEvaluationTasks);
  const [statusFilter, setStatusFilter] = useState("");
  const [modelTypeFilter, setModelTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState<"createdAt" | "status">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [createInitialModel, setCreateInitialModel] = useState<string | null>(null);
  const [viewTask, setViewTask] = useState<EvalTask | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState<"overview" | "monitor" | "result" | "report">("overview");
  const [deleteTask, setDeleteTask] = useState<EvalTask | null>(null);
  const [stopTaskCandidate, setStopTaskCandidate] = useState<EvalTask | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!initialModel) return;
    setCreateInitialModel(initialModel);
    setShowCreate(true);
    onInitialModelConsumed?.();
  }, [initialModel, onInitialModelConsumed]);

  useEffect(() => {
    saveEvaluationTasks(tasks);
  }, [tasks]);

  const filtered = tasks.filter(task => {
    const text = `${task.id} ${task.name}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (statusFilter && task.status !== statusFilter) return false;
    if (modelTypeFilter && task.modelType !== modelTypeFilter) return false;
    if (startDate && task.createdAt.slice(0, 10) < startDate) return false;
    if (endDate && task.createdAt.slice(0, 10) > endDate) return false;
    return true;
  }).sort((a, b) => {
    const aValue = sortField === "createdAt" ? a.createdAt : a.status;
    const bValue = sortField === "createdAt" ? b.createdAt : b.status;
    return aValue.localeCompare(bValue) * (sortDirection === "asc" ? 1 : -1);
  });
  const PAGE_SIZE = 10;
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const stopTask = (taskId: string) => {
    setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status: "已停止", stage: "已停止", progress: task.progress, updatedAt: "2026-07-18 10:42:00" } : task));
    setMessage("任务已停止");
  };

  const toggleSort = (field: "createdAt" | "status") => {
    if (sortField === field) setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };

  if (viewTask) {
    const latestTask = tasks.find(task => task.id === viewTask.id) || viewTask;
    return <><TaskDetailPage task={latestTask} initialTab={detailInitialTab} onClose={() => setViewTask(null)} onStop={() => setStopTaskCandidate(latestTask)} />{stopTaskCandidate && <StopModal task={stopTaskCandidate} onClose={() => setStopTaskCandidate(null)} onConfirm={() => { stopTask(stopTaskCandidate.id); setStopTaskCandidate(null); }} />}</>;
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "10px 18px 0" }}>
        <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: "#6b7280" }}>
          <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
          <span style={{ color: "#4f6ef7" }}>模型评测</span><span>/</span>
          <span style={{ color: "#1a1d23", fontWeight: 500 }}>评测任务</span>
        </div>
        {message && <div style={{ fontSize: 12.5, color: "#16a34a" }}>{message}</div>}
      </div>

      <div className="flex-1 flex flex-col min-h-0" style={{ margin: "10px 18px 18px", background: "#fff", border: "1px solid #e8ebf2", borderRadius: 8, overflow: "hidden" }}>
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "10px 12px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 8px", width: 220 }}>
              <Search size={13} color="#9ca3af" />
              <input value={keyword} onChange={e => { setKeyword(e.target.value); setQuery(e.target.value); setPage(1); }} placeholder="任务ID / 任务名称（实时搜索）"
                style={{ fontSize: 13, border: "none", outline: "none", minWidth: 0, flex: 1, paddingLeft: 7, background: "transparent" }} />
              {keyword && <button title="清除搜索词" onClick={() => { setKeyword(""); setQuery(""); setPage(1); }} style={{ display: "inline-flex", border: "none", background: "none", padding: 2, color: "#9ca3af", cursor: "pointer" }}><X size={13} /></button>}
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ ...inputSt, width: 100, height: 34, color: statusFilter ? "#1a1d23" : "#9ca3af" }}>
              <option value="">任务状态</option>
              {Object.keys(STATUS_CFG).map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={modelTypeFilter} onChange={e => { setModelTypeFilter(e.target.value); setPage(1); }} style={{ ...inputSt, width: 110, height: 34, color: modelTypeFilter ? "#1a1d23" : "#9ca3af" }}>
              <option value="">模型类型</option>
              <option value="语言模型">语言模型</option>
              <option value="多模态模型">多模态模型</option>
            </select>
            <div className="flex items-center gap-2"><input aria-label="创建开始日期" type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} style={{ ...inputSt, width: 124, height: 34, color: startDate ? "#1a1d23" : "#9ca3af" }} /><span style={{ color: "#9ca3af", fontSize: 12 }}>至</span><input aria-label="创建结束日期" type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} style={{ ...inputSt, width: 124, height: 34, color: endDate ? "#1a1d23" : "#9ca3af" }} /></div>
            <SecondaryButton onClick={() => { setKeyword(""); setQuery(""); setStatusFilter(""); setModelTypeFilter(""); setStartDate(""); setEndDate(""); setPage(1); }}><RotateCcw size={13} />重置</SecondaryButton>
          </div>
          <div className="flex items-center gap-2"><button title="刷新任务列表" onClick={() => setMessage("任务列表已刷新")} style={{ width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", background: "#fff", borderRadius: 6, color: "#6b7280", cursor: "pointer" }}><RefreshCw size={14} /></button><PrimaryButton onClick={() => { setCreateInitialModel(null); setShowCreate(true); }}><Plus size={14} />创建评测任务</PrimaryButton></div>
        </div>

        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13, minWidth: 1480 }}>
            <thead>
              <tr>{["任务 ID", "任务名称", "评测模型", "模型类型", "评测任务"].map(c => <th key={c} style={{ ...thSt, position: "sticky", top: 0, zIndex: 2 }}>{c}</th>)}
                <th style={{ ...thSt, cursor: "pointer", position: "sticky", top: 0, zIndex: 2 }} onClick={() => toggleSort("createdAt")}><span className="flex items-center gap-1">创建时间{sortField === "createdAt" ? (sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}</span></th>
                <th style={{ ...thSt, cursor: "pointer", position: "sticky", top: 0, zIndex: 2 }} onClick={() => toggleSort("status")}><span className="flex items-center gap-1">当前状态{sortField === "status" ? (sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}</span></th>
                <th style={{ ...thSt, position: "sticky", top: 0, zIndex: 2 }}>操作人</th>
                <th style={{ ...thSt, position: "sticky", top: 0, right: 0, zIndex: 3, boxShadow: "-1px 0 #eef1f6" }}>操作</th></tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>暂无符合条件的评测任务</td></tr>
              ) : pageRows.map(task => (
                <tr key={task.id} onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdSt, fontFamily: "monospace", fontSize: 11.5, whiteSpace: "nowrap" }}>{task.id}</td>
                  <td style={{ ...tdSt, minWidth: 190 }}><button onClick={() => { setDetailInitialTab("overview"); setViewTask(task); }} style={{ display: "block", border: "none", background: "none", padding: 0, color: "#1a1d23", fontSize: 12.5, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>{task.name}</button></td>
                  <td style={{ ...tdSt, minWidth: 135, fontWeight: 500 }}>{task.evalModels.join("、")}</td>
                  <td style={tdSt}><Chip tone={task.modelType === "语言模型" ? "blue" : "orange"}>{task.modelType}</Chip></td>
                  <td style={tdSt}>{task.taskTypes.join("、")}</td>

                  <td style={{ ...tdSt, color: "#6b7280", whiteSpace: "nowrap" }}>{task.createdAt}</td>
                  <td style={tdSt}><StatusBadge status={task.status} /></td>
                  <td style={{ ...tdSt, whiteSpace: "nowrap" }}>{task.creator}</td>
                  <td style={{ ...tdSt, position: "sticky", right: 0, background: "#fff", boxShadow: "-1px 0 #f0f2f7" }}>
                    <div className="flex items-center gap-3">
                      <TextButton onClick={() => { setDetailInitialTab("overview"); setViewTask(task); }}>查看</TextButton>
                      {(task.status === "运行中" || task.status === "排队中") && <TextButton onClick={() => setStopTaskCandidate(task)}>停止</TextButton>}
                      {task.status === "成功" && <TextButton onClick={() => { downloadReport(task); setMessage("报告已下载"); }}>下载报告</TextButton>}
                      {(task.status === "成功" || task.status === "失败") && <TextButton danger onClick={() => setDeleteTask(task)}>删除</TextButton>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <div style={{ fontSize: 12.5, color: "#6b7280" }}>共 {filtered.length} 条</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 28, height: 28, border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}><ChevronLeft size={13} /></button>
            <span style={{ fontSize: 12.5, color: "#374151" }}>{page} / {maxPage}</span>
            <button onClick={() => setPage(p => Math.min(maxPage, p + 1))} disabled={page === maxPage} style={{ width: 28, height: 28, border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === maxPage ? "not-allowed" : "pointer", opacity: page === maxPage ? 0.4 : 1 }}><ChevronRight size={13} /></button>
          </div>
        </div>
      </div>

      {showCreate && <CreateDrawer initialModel={createInitialModel} onClose={() => setShowCreate(false)} onDone={task => { setTasks(prev => [task, ...prev]); setDetailInitialTab("monitor"); setViewTask(task); }} />}
      {deleteTask && <DeleteModal task={deleteTask} onClose={() => setDeleteTask(null)} onConfirm={() => { setTasks(prev => prev.filter(task => task.id !== deleteTask.id)); setDeleteTask(null); }} />}
      {stopTaskCandidate && <StopModal task={stopTaskCandidate} onClose={() => setStopTaskCandidate(null)} onConfirm={() => { stopTask(stopTaskCandidate.id); setStopTaskCandidate(null); }} />}
    </div>
  );
}

export function ModelComparePage() {
  const successfulTasks = useMemo(() => loadEvaluationTasks().filter(task => task.status === "成功"), []);
  const [selected, setSelected] = useState<string[]>([]);
  const [baselineDataset, setBaselineDataset] = useState("");
  const [baselineVersion, setBaselineVersion] = useState("");
  const [baselineTask, setBaselineTask] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSelected, setPickerSelected] = useState<string[]>([]);
  const [pickerBaseline, setPickerBaseline] = useState<CompareBaseline | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [showIncompatible, setShowIncompatible] = useState(false);
  const [sceneName, setSceneName] = useState("");
  const [message, setMessage] = useState("");
  const [savedScenes, setSavedScenes] = useState([{ name: "通用能力基线对比", models: "qwen3-8b、qwen3.6-27b", dataset: "C-Eval", version: "v1.0", task: "文本理解", creator: "admin", createdAt: "2026-07-18 11:08:00" }]);
  const rows = successfulTasks.filter(task => selected.includes(task.id));
  const metrics = rows.length
    ? rows[0].metrics.map(metric => metric.name).filter(metricName => rows.every(task => task.metrics.some(metric => metric.name === metricName)))
    : [];
  const committedBaseline = baselineDataset && baselineVersion && baselineTask
    ? { dataset: baselineDataset, version: baselineVersion, task: baselineTask }
    : null;

  useEffect(() => {
    if (!baselineDataset || !baselineVersion || !baselineTask) {
      setSelected([]);
      return;
    }
    const compatible = successfulTasks.filter(task => isCompareCompatible(task, { dataset: baselineDataset, version: baselineVersion, task: baselineTask }));
    setSelected(prev => prev.filter(id => compatible.some(task => task.id === id)));
  }, [baselineDataset, baselineVersion, baselineTask]);

  useEffect(() => {
    if (!pickerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPickerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [pickerOpen]);

  const openPicker = (reset = false) => {
    setPickerSelected(reset ? [] : selected);
    setPickerBaseline(reset ? null : committedBaseline);
    setPickerQuery("");
    setShowIncompatible(false);
    setPickerOpen(true);
  };

  const choosePickerTask = (task: EvalTask) => {
    if (!pickerBaseline) {
      setPickerBaseline(deriveCompareBaseline(task, successfulTasks));
      setPickerSelected([task.id]);
      return;
    }
    if (!isCompareCompatible(task, pickerBaseline)) return;
    if (pickerSelected.includes(task.id)) {
      const next = pickerSelected.filter(id => id !== task.id);
      setPickerSelected(next);
      if (!next.length) setPickerBaseline(null);
      return;
    }
    setPickerSelected([...pickerSelected, task.id]);
  };

  const confirmPicker = () => {
    if (!pickerBaseline || pickerSelected.length < 2) return;
    setBaselineDataset(pickerBaseline.dataset);
    setBaselineVersion(pickerBaseline.version);
    setBaselineTask(pickerBaseline.task);
    setSelected(pickerSelected);
    setMessage("已更新对比模型");
    setPickerOpen(false);
  };

  const removeSelectedTask = (id: string) => {
    const next = selected.filter(currentId => currentId !== id);
    setSelected(next);
    setMessage("");
    if (!next.length) {
      setBaselineDataset("");
      setBaselineVersion("");
      setBaselineTask("");
    }
  };

  const normalizedPickerQuery = pickerQuery.trim().toLowerCase();
  const pickerTasks = successfulTasks.filter(task => {
    const matchesSearch = !normalizedPickerQuery || [
      task.id,
      task.name,
      task.evalModels.join(" "),
      task.modelVersion,
      task.datasets.join(" "),
      task.taskTypes.join(" "),
    ].join(" ").toLowerCase().includes(normalizedPickerQuery);
    const matchesBaseline = !pickerBaseline || showIncompatible || isCompareCompatible(task, pickerBaseline);
    return matchesSearch && matchesBaseline;
  });
  const compareData = metrics.slice(0, 5).map(metricName => {
    const row: Record<string, string | number> = { subject: metricName };
    rows.forEach((task, rowIndex) => { row[`model${rowIndex}`] = task.metrics.find(metric => metric.name === metricName)?.score || 0; });
    return row;
  });
  const rankedRows = [...rows].sort((a, b) => scoreOf(b) - scoreOf(a));
  const leadingMetricNames = rankedRows.length >= 2 ? metrics.filter(metricName => {
    const first = rankedRows[0].metrics.find(metric => metric.name === metricName)?.score || 0;
    const second = rankedRows[1].metrics.find(metric => metric.name === metricName)?.score || 0;
    return first > second;
  }) : [];
  const tiedMetricNames = rankedRows.length >= 2 ? metrics.filter(metricName => {
    const first = rankedRows[0].metrics.find(metric => metric.name === metricName)?.score || 0;
    const second = rankedRows[1].metrics.find(metric => metric.name === metricName)?.score || 0;
    return first === second;
  }) : [];
  const comparisonSummary = rankedRows.length >= 2
    ? `${rankedRows[0].evalModels[0]} 的总体得分最高（${scoreOf(rankedRows[0])}），比 ${rankedRows[1].evalModels[0]} 高 ${(scoreOf(rankedRows[0]) - scoreOf(rankedRows[1])).toFixed(1)} 分。${leadingMetricNames.length ? `得分更高的共同指标：${leadingMetricNames.join("、")}。` : "共同指标未出现更高项。"}${tiedMetricNames.length ? `得分相同的指标：${tiedMetricNames.join("、")}。` : ""}`
    : "请选择至少两个满足统一数据集与任务基准的已完成任务。";
  const comparisonGridColumns = `160px repeat(${Math.max(1, rows.length)}, minmax(220px, 1fr))`;

  const loadScene = (scene: { name: string; models: string; dataset: string; version: string; task: string; creator: string; createdAt: string }) => {
    setBaselineDataset(scene.dataset);
    setBaselineVersion(scene.version);
    setBaselineTask(scene.task);
    const modelNames = scene.models.split("、").map(item => item.trim());
    setSelected(successfulTasks.filter(item => modelNames.some(name => name === item.evalModels[0] || name.startsWith(`${item.evalModels[0]} `))).map(item => item.id));
    setMessage("已复用对比场景");
  };

  const saveScene = () => {
    if (!sceneName.trim() || rows.length < 2) return;
    setSavedScenes(prev => [{
      name: sceneName.trim(),
      models: rows.map(task => `${task.evalModels[0]} ${task.modelVersion}`).join("、"),
      dataset: baselineDataset,
      version: baselineVersion,
      task: baselineTask,
      creator: "admin",
      createdAt: new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"),
    }, ...prev]);
    setSceneName("");
    setMessage("对比场景已保存");
  };

  const downloadComparison = () => {
    if (rows.length < 2) return;
    const csvRows = [
      ["对比项", ...rows.map(task => task.evalModels[0])],
      ["模型版本", ...rows.map(task => task.modelVersion)],
      ["总体得分", ...rows.map(task => scoreOf(task))],
      ...metrics.map(metricName => [metricName, ...rows.map(task => task.metrics.find(metric => metric.name === metricName)?.score ?? "-")]),
      ["数据集", ...rows.map(() => baselineDataset)],
      ["数据集版本", ...rows.map(() => baselineVersion)],
      ["任务类型", ...rows.map(() => baselineTask)],
      ["评测任务 ID", ...rows.map(task => task.id)],
    ];
    const csv = csvRows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    downloadTextFile(`模型对比_${baselineDataset}_${baselineTask}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
    setMessage("对比结果已下载");
  };

  return (
    <WorkbenchPage title="模型对比" crumb="模型对比">
      <div style={{ display: "grid", gridAutoRows: "max-content", alignContent: "start", gap: 16, overflow: "auto", minHeight: 0, flex: 1 }}>
        <div style={{ ...panelSt, overflow: "hidden" }}>
          <div className="flex items-center justify-between flex-wrap gap-3" style={{ padding: 16, borderBottom: "1px solid #f0f2f7" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1d23" }}>选择对比模型</div>
              <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 4 }}>从已完成评测结果中选择两个或多个模型，首个结果会自动确定统一对比条件。</div>
            </div>
            <PrimaryButton onClick={() => openPicker(false)}><Plus size={14} />添加对比模型</PrimaryButton>
          </div>
          {message && <div role="status" style={{ margin: "12px 16px 0", padding: "8px 10px", borderRadius: 6, background: "#f0fdf4", color: "#15803d", fontSize: 12.5 }}>{message}</div>}
          {committedBaseline && <div className="flex items-center justify-between flex-wrap gap-2" style={{ margin: "12px 16px 0", padding: "9px 11px", border: "1px solid #dbe5ff", borderRadius: 7, background: "#f7f9ff" }}>
            <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: 12.5, color: "#4b5563" }}><span style={{ fontWeight: 600, color: "#374151" }}>对比条件</span><Chip>{baselineDataset}</Chip><Chip>{baselineVersion}</Chip><Chip>{baselineTask}</Chip><span>系统已根据首个结果自动匹配</span></div>
            <TextButton onClick={() => openPicker(true)}>重新选择</TextButton>
          </div>}
          {rows.length ? <div style={{ padding: 16 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}><div style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>已选 {selected.length} 个模型</div><div style={{ fontSize: 12, color: "#9ca3af" }}>可选择同一模型的不同评测版本</div></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {rows.map(task => <div key={task.id} style={{ minWidth: 0, padding: 12, border: "1px solid #dbe5ff", borderRadius: 7, background: "#fff" }}>
                <div className="flex items-start justify-between gap-2"><div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d23", overflowWrap: "anywhere" }}>{task.evalModels[0]}</div><div style={{ marginTop: 3, fontSize: 12, color: "#6b7280" }}>{task.modelVersion}</div></div><button type="button" aria-label={`移除 ${task.evalModels[0]}`} onClick={() => removeSelectedTask(task.id)} style={{ width: 26, height: 26, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 5, background: "transparent", color: "#9ca3af", cursor: "pointer" }}><X size={14} /></button></div>
                <div className="flex items-end justify-between gap-3" style={{ marginTop: 10 }}><div style={{ minWidth: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.55, overflowWrap: "anywhere" }}>{task.name}<br />完成于 {task.createdAt}</div><div style={{ flexShrink: 0, textAlign: "right" }}><div style={{ fontSize: 11.5, color: "#9ca3af" }}>总体得分</div><div style={{ marginTop: 2, fontSize: 20, fontWeight: 700, color: "#1a1d23" }}>{scoreOf(task)}</div></div></div>
              </div>)}
            </div>
          </div> : <div style={{ margin: 16, padding: "28px 16px", border: "1px dashed #d9deea", borderRadius: 8, background: "#fafbfd", textAlign: "center" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#374151" }}>尚未选择对比模型</div>
            <div style={{ marginTop: 5, fontSize: 12.5, color: "#6b7280" }}>无需预先设置数据集和任务，先选择一个已完成评测结果即可。</div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}><SecondaryButton onClick={() => openPicker(false)}><Plus size={13} />添加对比模型</SecondaryButton></div>
          </div>}
        </div>

        <div style={{ ...panelSt, overflow: "hidden" }}>
          <div className="flex items-center justify-between flex-wrap gap-3" style={{ padding: "13px 16px", borderBottom: "1px solid #f0f2f7" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1d23" }}>对比结果</div>
              <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 3 }}>固定列展示共同指标，避免模型数量变化导致信息错位。</div>
            </div>
            <div className="flex items-center gap-2">
              <SecondaryButton onClick={downloadComparison}><Download size={13} />下载对比结果</SecondaryButton>
            </div>
          </div>
          {rows.length < 2 ? (
            <div style={{ padding: "64px 20px", textAlign: "center", color: "#6b7280" }}><BarChart2 size={28} style={{ margin: "0 auto 10px", color: "#9ca3af" }} /><div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>请至少选择 2 个模型</div><div style={{ fontSize: 12.5, marginTop: 5 }}>通过上方“添加对比模型”选择可比较的已完成评测结果。</div></div>
          ) : (
            <>
              <div style={{ margin: 16, padding: "10px 12px", border: "1px solid #c7d9ff", background: "#f5f8ff", borderRadius: 7, color: "#374151", fontSize: 13, lineHeight: 1.7 }}><b>差异统计摘要：</b>{comparisonSummary}</div>
              <div style={{ overflowX: "auto", padding: "0 16px 16px" }}>
                <div style={{ minWidth: 160 + rows.length * 220 }}>
                  <div style={{ display: "grid", gridTemplateColumns: comparisonGridColumns, borderTop: "1px solid #e8ebf2", borderLeft: "1px solid #e8ebf2" }}>
                    <div style={{ padding: 14, background: "#f8f9fc", borderRight: "1px solid #e8ebf2", borderBottom: "1px solid #e8ebf2", fontSize: 13, fontWeight: 600, color: "#374151" }}>对比任务</div>
                    {rows.map(task => <div key={task.id} style={{ padding: 14, borderRight: "1px solid #e8ebf2", borderBottom: "1px solid #e8ebf2", minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d23", overflowWrap: "anywhere" }}>{task.evalModels[0]}</div><div style={{ marginTop: 4, color: "#6b7280", fontSize: 12 }}>{task.modelVersion}</div><div style={{ marginTop: 10, padding: "8px 9px", border: "1px solid #dbe5ff", borderRadius: 6, background: "#f7f9ff" }}><div className="flex items-center justify-between" style={{ fontSize: 11.5, color: "#6b7280" }}><span>核心指标</span><b style={{ color: "#1a1d23", fontSize: 17 }}>{scoreOf(task)}</b></div><div style={{ marginTop: 5, height: 5, borderRadius: 3, background: "#e5e7eb" }}><div style={{ width: `${scoreOf(task)}%`, height: "100%", borderRadius: 3, background: "#4f6ef7" }} /></div></div><div style={{ marginTop: 8, color: "#9ca3af", fontSize: 11.5, overflowWrap: "anywhere" }}>{task.id}</div></div>)}
                    {[
                      { label: "总体得分", values: rows.map(task => scoreOf(task)), lowerBetter: false },
                      ...metrics.map(metricName => ({ label: metricName, values: rows.map(task => task.metrics.find(metric => metric.name === metricName)?.score || 0), lowerBetter: metricName.includes("时延") })),
                    ].map(item => {
                      const best = item.lowerBetter ? Math.min(...item.values) : Math.max(...item.values);
                      const worst = item.lowerBetter ? Math.max(...item.values) : Math.min(...item.values);
                      return <div key={item.label} style={{ display: "contents" }}>
                        <div style={{ padding: "12px 14px", background: "#f8f9fc", borderRight: "1px solid #e8ebf2", borderBottom: "1px solid #e8ebf2", fontSize: 13, fontWeight: 600, color: "#374151" }}>{item.label}</div>
                        {rows.map((task, index) => {
                          const value = item.values[index];
                          const isBest = value === best;
                          const isWorst = best !== worst && value === worst;
                          return <div key={task.id} style={{ padding: "12px 14px", borderRight: "1px solid #e8ebf2", borderBottom: "1px solid #e8ebf2", color: isBest ? "#15803d" : isWorst ? "#dc2626" : "#374151", background: isBest ? "#f0fdf4" : isWorst ? "#fff7f7" : "#fff", fontSize: item.label === "总体得分" ? 20 : 13, fontWeight: isBest || isWorst || item.label === "总体得分" ? 700 : 400 }}>{isBest ? "最优 " : isWorst ? "最低 " : ""}{value}</div>;
                        })}
                      </div>;
                    })}
                    {[
                      ["数据集", baselineDataset],
                      ["数据集版本", baselineVersion],
                      ["任务类型", baselineTask],
                      ["创建时间", "createdAt"],
                    ].map(([label, value]) => <div key={label} style={{ display: "contents" }}><div style={{ padding: "12px 14px", background: "#f8f9fc", borderRight: "1px solid #e8ebf2", borderBottom: "1px solid #e8ebf2", fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</div>{rows.map(task => <div key={task.id} style={{ padding: "12px 14px", borderRight: "1px solid #e8ebf2", borderBottom: "1px solid #e8ebf2", color: "#374151", fontSize: 12.5 }}>{value === "createdAt" ? task.createdAt : value}</div>)}</div>)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {rows.length >= 2 && <div style={{ ...panelSt, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>差异雷达图</div>
          {compareData.length ? <ResponsiveContainer width="100%" height={280}><RadarChart data={compareData}><PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} /><Tooltip />{rows.map((task, index) => { const colors = ["#4f6ef7", "#14b8a6", "#f59e0b", "#e11d48", "#7c3aed", "#0284c7"]; const color = colors[index % colors.length]; return <Radar key={task.id} name={task.evalModels[0]} dataKey={`model${index}`} stroke={color} fill={color} fillOpacity={0.12} strokeWidth={2} />; })}<Legend /></RadarChart></ResponsiveContainer> : <div style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>所选任务没有共同指标，无法生成雷达图。</div>}
        </div>}

        <div style={{ ...panelSt, padding: 16 }}>
          <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: 12 }}>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>已保存场景</div><div style={{ marginTop: 4, color: "#6b7280", fontSize: 12.5 }}>保存当前模型组合与统一对比基准，后续可直接复用。</div></div>
              <div className="flex items-center gap-2"><input aria-label="对比场景名称" value={sceneName} onChange={event => setSceneName(event.target.value)} placeholder="输入对比场景名称" style={{ ...inputSt, width: 210, height: 34 }} /><PrimaryButton disabled={rows.length < 2 || !sceneName.trim()} onClick={saveScene}>保存对比场景</PrimaryButton></div>
          </div>
          <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 850, borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["场景名称", "模型数量", "模型组合", "对比基准", "创建人", "创建时间", "操作"].map(column => <th key={column} style={thSt}>{column}</th>)}</tr></thead>
            <tbody>{savedScenes.map(scene => <tr key={`${scene.name}-${scene.createdAt}`}><td style={tdSt}>{scene.name}</td><td style={tdSt}>{scene.models.split("、").length}</td><td style={tdSt}>{scene.models}</td><td style={tdSt}>{scene.dataset} {scene.version} / {scene.task}</td><td style={tdSt}>{scene.creator}</td><td style={{ ...tdSt, whiteSpace: "nowrap" }}>{scene.createdAt}</td><td style={tdSt}><div className="flex items-center gap-3"><TextButton onClick={() => loadScene(scene)}>复用场景</TextButton><TextButton danger onClick={() => setSavedScenes(current => current.filter(item => item !== scene))}>删除</TextButton></div></td></tr>)}</tbody>
          </table></div>
        </div>
      </div>
      {pickerOpen && <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPickerOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 230, display: "flex", justifyContent: "flex-end", background: "rgba(15, 23, 42, 0.36)" }}>
        <div role="dialog" aria-modal="true" aria-label="添加对比模型" style={{ width: "min(680px, 100vw)", height: "100%", display: "flex", flexDirection: "column", background: "#fff", boxShadow: "-12px 0 32px rgba(15,23,42,0.12)" }}>
          <div className="flex items-start justify-between gap-3" style={{ padding: "18px 20px", borderBottom: "1px solid #eef1f6" }}>
            <div><div style={{ fontSize: 16, fontWeight: 700, color: "#1a1d23" }}>添加对比模型</div><div style={{ marginTop: 5, fontSize: 12.5, color: "#6b7280", lineHeight: 1.55 }}>仅展示已完成评测结果。选择第一个模型后，系统会自动匹配相同数据集、版本和任务类型。</div></div>
            <button type="button" aria-label="关闭模型选择" onClick={() => setPickerOpen(false)} style={{ width: 30, height: 30, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", borderRadius: 6, background: "transparent", color: "#6b7280", cursor: "pointer" }}><X size={17} /></button>
          </div>

          <div style={{ padding: "14px 20px 12px", borderBottom: "1px solid #f0f2f7" }}>
            {pickerBaseline ? <div style={{ padding: "9px 11px", border: "1px solid #dbe5ff", borderRadius: 7, background: "#f7f9ff" }}>
              <div className="flex items-center gap-2 flex-wrap"><span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>已自动确定对比条件</span><Chip>{pickerBaseline.dataset}</Chip><Chip>{pickerBaseline.version}</Chip><Chip>{pickerBaseline.task}</Chip></div>
              <div style={{ marginTop: 5, fontSize: 12, color: "#6b7280" }}>列表已优先保留可直接比较的评测结果。</div>
            </div> : <div style={{ padding: "9px 11px", border: "1px solid #e8ebf2", borderRadius: 7, background: "#fafbfd", fontSize: 12.5, color: "#6b7280" }}>请先选择一个模型评测结果，系统将自动确定本次对比条件。</div>}
            <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 10 }}>
              <div className="flex items-center" style={{ flex: "1 1 300px", minWidth: 0, height: 34, padding: "0 9px", border: "1px solid #e0e3ed", borderRadius: 6 }}><Search size={14} color="#9ca3af" /><input aria-label="搜索模型评测结果" value={pickerQuery} onChange={event => setPickerQuery(event.target.value)} placeholder="搜索模型、版本、任务或数据集" style={{ minWidth: 0, flex: 1, height: "100%", padding: "0 7px", border: "none", outline: "none", background: "transparent", fontSize: 13 }} />{pickerQuery && <button type="button" aria-label="清除模型搜索" onClick={() => setPickerQuery("")} style={{ display: "inline-flex", border: "none", background: "none", padding: 2, color: "#9ca3af", cursor: "pointer" }}><X size={13} /></button>}</div>
              {pickerBaseline && <SecondaryButton onClick={() => setShowIncompatible(value => !value)}>{showIncompatible ? "仅查看可比较结果" : "查看不可比较结果"}</SecondaryButton>}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 20px 20px" }}>
            <div style={{ marginBottom: 8, fontSize: 12, color: "#6b7280" }}>共 {pickerTasks.length} 条结果</div>
            <div style={{ display: "grid", gap: 8 }}>
              {pickerTasks.map(task => {
                const compatible = !pickerBaseline || isCompareCompatible(task, pickerBaseline);
                const checked = pickerSelected.includes(task.id);
                const reason = pickerBaseline ? compareIncompatibilityReason(task, pickerBaseline) : "";
                return <button type="button" key={task.id} disabled={!compatible} aria-pressed={checked} aria-label={`${checked ? "取消选择" : "选择"} ${task.evalModels[0]} ${task.modelVersion} ${task.name}`} onClick={() => choosePickerTask(task)} style={{ width: "100%", padding: 12, textAlign: "left", border: `1px solid ${checked ? "#4f6ef7" : "#e8ebf2"}`, borderRadius: 7, background: checked ? "#f5f8ff" : "#fff", cursor: compatible ? "pointer" : "not-allowed", opacity: compatible ? 1 : 0.62 }}>
                  <div className="flex items-start" style={{ gap: 10 }}>
                    <input type="checkbox" checked={checked} readOnly tabIndex={-1} style={{ marginTop: 3 }} />
                    <div style={{ minWidth: 0, flex: 1 }}><div className="flex items-center gap-2 flex-wrap"><span style={{ fontSize: 14, fontWeight: 700, color: "#1a1d23" }}>{task.evalModels[0]}</span><Chip tone="gray">{task.modelVersion}</Chip>{checked && <Chip tone="green">已选择</Chip>}</div><div style={{ marginTop: 5, fontSize: 12.5, color: "#4b5563", overflowWrap: "anywhere" }}>{task.name}</div><div style={{ marginTop: 7, fontSize: 12, color: "#6b7280", lineHeight: 1.55 }}>{task.datasets.map(dataset => `${dataset} ${datasetVersionOf(task, dataset)}`).join("、")} · {task.taskTypes.join("、")}<br />完成于 {task.createdAt}</div>{!compatible && <div style={{ marginTop: 7, fontSize: 12, color: "#dc2626" }}>不可比较：{reason}</div>}</div>
                    <div style={{ flexShrink: 0, textAlign: "right" }}><div style={{ fontSize: 11.5, color: "#9ca3af" }}>总体得分</div><div style={{ marginTop: 2, fontSize: 20, fontWeight: 700, color: "#1a1d23" }}>{scoreOf(task)}</div></div>
                  </div>
                </button>;
              })}
              {!pickerTasks.length && <div style={{ padding: "44px 16px", textAlign: "center", border: "1px dashed #d9deea", borderRadius: 8, color: "#6b7280", fontSize: 13 }}>没有符合当前条件的评测结果</div>}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap" style={{ padding: "12px 20px", borderTop: "1px solid #eef1f6", background: "#fff" }}><div style={{ fontSize: 12.5, color: pickerSelected.length >= 2 ? "#374151" : "#6b7280" }}>已选 {pickerSelected.length} 个模型{pickerSelected.length < 2 ? "，至少选择 2 个" : ""}</div><div className="flex items-center gap-2"><SecondaryButton onClick={() => setPickerOpen(false)}>取消</SecondaryButton><PrimaryButton disabled={pickerSelected.length < 2 || !pickerBaseline} onClick={confirmPicker}>确认选择</PrimaryButton></div></div>
        </div>
      </div>}
    </WorkbenchPage>
  );
}

function SchemePermissionEditor({
  scope,
  sharedAccess,
  onScopeChange,
  onSharedAccessChange,
  disabled = false,
  allowPrivate = true,
}: {
  scope: SchemeScope;
  sharedAccess: SchemeAccess;
  onScopeChange: (scope: SchemeScope) => void;
  onSharedAccessChange: (access: SchemeAccess) => void;
  disabled?: boolean;
  allowPrivate?: boolean;
}) {
  const visibility = schemeVisibility(scope, sharedAccess);
  const changeVisibility = (next: SchemeVisibility) => {
    if (next === "仅自己可见") {
      onScopeChange("私有");
      return;
    }
    onScopeChange("共享");
    onSharedAccessChange(next === "团队编辑" ? "编辑" : "只读");
  };
  const showShareWarning = allowPrivate && visibility !== "仅自己可见";
  return <div>
    <div>
      <FieldLabel>可见范围</FieldLabel>
      <select aria-label="可见范围" value={visibility} disabled={disabled} onChange={event => changeVisibility(event.target.value as SchemeVisibility)} style={inputSt}>
        <option value="仅自己可见" disabled={!allowPrivate}>仅自己可见</option>
        <option value="团队可见">团队可见</option>
        <option value="团队编辑">团队编辑</option>
      </select>
    </div>
    {!allowPrivate && <div style={{ marginTop: 8, color: "#f59e0b", fontSize: 12 }}>方案已共享至团队，不可改回仅自己可见。</div>}
    {showShareWarning && <div style={{ marginTop: 8, color: "#dc2626", fontSize: 12, fontWeight: 600 }}>共享至团队后，不可改回仅自己可见，请谨慎修改。</div>}
    <div style={{ marginTop: 6, color: "#6b7280", fontSize: 11.5, lineHeight: 1.55 }}>
      仅自己可见时只有创建人可用；团队可见时团队成员可查看并在评测时选择；团队编辑时还可编辑、保存新版本和回滚。
    </div>
  </div>;
}

export function EvaluationConfigPage() {
  const [templates, setTemplates] = useState<EvaluationScheme[]>(() => readEvaluationSchemeCatalog().templates);
  const [showCreate, setShowCreate] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftModelType, setDraftModelType] = useState<ModelType | "">("");
  const [draftScope, setDraftScope] = useState<SchemeScope>("私有");
  const [draftSharedAccess, setDraftSharedAccess] = useState<SchemeAccess>("只读");
  const [shareScheme, setShareScheme] = useState<EvaluationScheme | null>(null);
  const [shareScope, setShareScope] = useState<SchemeScope>("私有");
  const [shareAccess, setShareAccess] = useState<SchemeAccess>("只读");
  const [historyName, setHistoryName] = useState<string | null>(null);
  const [applySchemeName, setApplySchemeName] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [templateQuery, setTemplateQuery] = useState("");
  const [templateModelType, setTemplateModelType] = useState<ModelType | "">("");
  const [templateAuthor, setTemplateAuthor] = useState("");
  const [flowStages, setFlowStages] = useState<FlowStage[]>(createDefaultFlowStages());
  const [metricWeights, setMetricWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    evaluationSchemeCatalog = {
      templates: templates.map(cloneEvaluationScheme),
    };
  }, [templates]);
  const templateAuthors = Array.from(new Set(templates.map(template => template.author)));
  const normalizedTemplateQuery = templateQuery.trim().toLowerCase();
  const filteredTemplates = templates.filter(template => (
    (!normalizedTemplateQuery || template.name.toLowerCase().includes(normalizedTemplateQuery))
    && (!templateModelType || template.modelType === templateModelType)
    && (!templateAuthor || template.author === templateAuthor)
  ));
  const metricLibrary = [
    { category: "生成", name: "BLEU", principle: "计算候选文本与参考文本的加权 n-gram 精确率，并用长度惩罚抑制过短答案。", formula: "BLEU = BP × exp(Σₙ wₙ log pₙ)", scene: "翻译、文本生成", range: "0-1" },
    { category: "生成", name: "ROUGE", principle: "按参考文本中的 n-gram 被生成文本覆盖的比例计算召回率。", formula: "ROUGE-N = 重叠 n-gram 数 / 参考文本 n-gram 数", scene: "摘要、文本生成", range: "0-1" },
    { category: "生成", name: "METEOR", principle: "综合词级精确率、召回率、词干或同义匹配，并对错序片段施加惩罚。", formula: "METEOR = Fmean × (1 - Penalty)", scene: "翻译、文本生成", range: "0-1" },
    { category: "分类", name: "Accuracy", principle: "统计全部样本中分类正确的比例。", formula: "Accuracy = (TP + TN) / (TP + TN + FP + FN)", scene: "分类、问答", range: "0-1" },
    { category: "分类", name: "Precision", principle: "统计预测为正的样本中实际为正的比例。", formula: "Precision = TP / (TP + FP)", scene: "分类、抽取", range: "0-1" },
    { category: "分类", name: "Recall", principle: "统计全部真实正样本中被正确识别的比例。", formula: "Recall = TP / (TP + FN)", scene: "分类、抽取", range: "0-1" },
    { category: "分类", name: "F1", principle: "使用精确率与召回率的调和平均衡量综合表现。", formula: "F1 = 2 × Precision × Recall / (Precision + Recall)", scene: "分类、抽取", range: "0-1" },
    { category: "代码生成", name: "Pass@1", principle: "统计每个样本首个生成程序通过全部测试用例的比例。", formula: "Pass@1 = 首个结果通过测试的样本数 / 总样本数", scene: "代码生成", range: "0-1" },
    { category: "效率", name: "平均时延", principle: "统计所有成功样本从请求发出到响应完成的平均耗时。", formula: "平均时延 = 总推理耗时 / 完成样本数", scene: "模型推理效率", range: "毫秒，越低越好" },
    { category: "效率", name: "平均生成速度", principle: "统计成功请求在生成阶段每秒输出的平均 Token 数。", formula: "平均生成速度 = 生成 Token 总数 / 总生成耗时", scene: "模型推理效率", range: "token/s，越高越好" },
  ];

  const create = () => {
    const name = draftName.trim() || `新建流程模板_${templates.length + 1}`;
    if (!draftModelType) return;
    const existing = templates.find(item => item.name === editingName);
    const tasks = "全部评测任务";
    const version = existing ? bumpSchemeVersion(existing.version) : "v1.0";
    const date = "2026-07-22";
    const author = existing?.author || CURRENT_USER;
    const scope = existing && existing.author !== CURRENT_USER ? existing.scope : draftScope;
    const sharedAccess = existing && existing.author !== CURRENT_USER ? existing.sharedAccess : draftSharedAccess;
    const savedFlowStages = cloneFlowStages(flowStages);
    const savedWeights = Object.fromEntries(Object.entries(metricWeights).filter(([metric, weight]) => !UNWEIGHTED_METRICS.has(metric) && weight > 0));
    const stages = savedFlowStages.filter(stage => stage.enabled).map(stage => stage.name).join(" → ");
    const content: SchemeContent = { modelType: draftModelType, tasks, stages, scope, flowStages: savedFlowStages, metricWeights: savedWeights };
    const next: EvaluationScheme = {
      name, type: "流程模板", ...content, version, author, sharedAccess,
      history: [{ ...content, version, date, operator: "admin", summary: existing ? "编辑并保存流程、指标及权重" : "初始版本" }, ...(existing?.history || [])],
    };
    setTemplates(prev => editingName ? prev.map(item => item.name === editingName ? next : item) : [next, ...prev]);
    setShowCreate(false);
    setEditingName(null);
    setDraftName("");
    setDraftSharedAccess("只读");
    setMessage("配置方案已保存");
  };

  const openCreate = () => {
    setEditingName(null);
    setDraftName("");
    setDraftModelType("");
    setDraftScope("私有");
    setDraftSharedAccess("只读");
    setFlowStages(createDefaultFlowStages());
    setMetricWeights({});
    setShowCreate(true);
  };
  const openEdit = (row: EvaluationScheme) => {
    setEditingName(row.name);
    setDraftName(row.name);
    setDraftModelType(row.modelType);
    setDraftScope(row.scope);
    setDraftSharedAccess(row.sharedAccess);
    const stages = cloneFlowStages(row.flowStages || createDefaultFlowStages(false, "Accuracy"));
    const configuredMetrics = String(stages.find(stage => stage.name === "指标计算")?.params.metrics || "").split(",").filter(Boolean);
    setFlowStages(stages);
    setMetricWeights(row.metricWeights
      ? Object.fromEntries(Object.entries(row.metricWeights).filter(([metric]) => !UNWEIGHTED_METRICS.has(metric)))
      : equalMetricWeights(configuredMetrics));
    setShowCreate(true);
  };
  const openSharing = (row: EvaluationScheme) => {
    if (row.author !== CURRENT_USER) return;
    setShareScheme(row);
    setShareScope(row.scope);
    setShareAccess(row.sharedAccess);
  };
  const saveSharing = () => {
    if (!shareScheme || shareScheme.author !== CURRENT_USER) return;
    const update = (item: EvaluationScheme) => item.name === shareScheme.name && item.type === shareScheme.type
      ? { ...item, scope: shareScope, sharedAccess: shareAccess }
      : item;
    setTemplates(current => current.map(update));
    setShareScheme(null);
    setMessage("共享权限已更新");
  };
  const moveStage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= flowStages.length) return;
    const next = [...flowStages];
    [next[index], next[target]] = [next[target], next[index]];
    setFlowStages(next);
  };
  const updateStageParam = (stageName: FlowStage["name"], key: string, value: string | number | boolean) => {
    setFlowStages(current => current.map(stage => stage.name === stageName ? { ...stage, params: { ...stage.params, [key]: value } } : stage));
  };
  const updateSmokeTestEnabled = (enabled: boolean) => {
    setFlowStages(current => current.map(stage => {
      if (stage.name !== "模型推理") return stage;
      const currentCount = Number(stage.params.smokeTestCount);
      return {
        ...stage,
        params: {
          ...stage.params,
          smokeTestEnabled: enabled,
          smokeTestCount: Number.isInteger(currentCount) && currentCount >= 1 ? currentCount : 25,
        },
      };
    }));
  };
  const updatePostprocessRule = (ruleId: typeof POSTPROCESS_RULE_OPTIONS[number]["id"], checked: boolean) => {
    setFlowStages(current => current.map(stage => {
      if (stage.name !== "后处理") return stage;
      const selectedRules = new Set(parsePostprocessRules(stage.params.normalizationRules));
      if (checked) selectedRules.add(ruleId);
      else selectedRules.delete(ruleId);
      return {
        ...stage,
        params: {
          ...stage.params,
          normalizationRules: POSTPROCESS_RULE_OPTIONS
            .filter(option => selectedRules.has(option.id))
            .map(option => option.id)
            .join(","),
        },
      };
    }));
  };
  const updateMetricConditionRule = (updater: (rule: MetricConditionRule) => MetricConditionRule) => {
    setFlowStages(current => current.map(stage => stage.name === "指标计算"
      ? { ...stage, conditionRule: updater(cloneMetricConditionRule(stage.conditionRule)) }
      : stage));
  };
  const updateSelectedMetrics = (nextMetrics: string[]) => {
    setMetricWeights(equalMetricWeights(nextMetrics));
    updateStageParam("指标计算", "metrics", nextMetrics.join(","));
  };
  const rollbackScheme = (name: string, targetVersion: string) => {
    const restore = (item: EvaluationScheme) => {
      if (item.name !== name) return item;
      const target = item.history.find(version => version.version === targetVersion);
      if (!target) return item;
      const version = bumpSchemeVersion(item.version);
      const content: SchemeContent = {
        modelType: target.modelType,
        tasks: target.tasks,
        stages: target.stages,
        scope: item.scope,
        flowStages: target.flowStages ? cloneFlowStages(target.flowStages) : undefined,
        metricWeights: target.metricWeights ? { ...target.metricWeights } : undefined,
      };
      return {
        ...item,
        ...content,
        version,
        history: [{ ...content, version, date: "2026-07-22", operator: "admin", summary: `回滚至 ${targetVersion}` }, ...item.history],
      };
    };
    setTemplates(current => current.map(restore));
    setHistoryName(null);
    setMessage("已按历史内容生成新版本");
  };
  const enabledFlowNames = flowStages.filter(stage => stage.enabled).map(stage => stage.name);
  const preprocessingIndex = enabledFlowNames.indexOf("数据预处理");
  const inferenceIndex = enabledFlowNames.indexOf("模型推理");
  const postprocessIndex = enabledFlowNames.indexOf("后处理");
  const metricIndex = enabledFlowNames.indexOf("指标计算");
  const flowError = preprocessingIndex >= 0 && preprocessingIndex > inferenceIndex
    ? "数据预处理必须在模型推理之前"
    : postprocessIndex >= 0 && (postprocessIndex < inferenceIndex || postprocessIndex > metricIndex)
      ? "启用后处理时必须位于模型推理与指标计算之间"
    : metricIndex < inferenceIndex
      ? "指标计算必须在模型推理之后"
      : "";
  const preprocessingStage = flowStages.find(stage => stage.name === "数据预处理");
  const inferenceStage = flowStages.find(stage => stage.name === "模型推理");
  const postprocessStage = flowStages.find(stage => stage.name === "后处理");
  const metricStage = flowStages.find(stage => stage.name === "指标计算");
  const selectedPostprocessRules = parsePostprocessRules(postprocessStage?.params.normalizationRules);
  const postprocessRulesInvalid = postprocessStage?.enabled === true && selectedPostprocessRules.length === 0;
  const configuredMetricNames = String(metricStage?.params.metrics || "").split(",").filter(Boolean);
  const totalWeight = configuredMetricNames
    .filter(metric => !UNWEIGHTED_METRICS.has(metric))
    .reduce((sum, metric) => sum + (metricWeights[metric] || 0), 0);
  const metricConditionRule = cloneMetricConditionRule(metricStage?.conditionRule);
  const metricConditionInvalid = metricConditionRule.mode === "filter"
    && (!metricConditionRule.conditions.length || metricConditionRule.conditions.some(condition => {
      const selectedValues = condition.value.split(/[,，]/).map(value => value.trim()).filter(Boolean);
      const allowedValues = conditionValueOptions(condition.field, draftModelType);
      return !selectedValues.length || selectedValues.some(value => !allowedValues.includes(value));
    }));
  const maxTokensValue = inferenceStage?.params.maxTokens ?? "";
  const temperatureValue = inferenceStage?.params.temperature ?? "";
  const topKValue = inferenceStage?.params.topK ?? "";
  const batchSizeValue = inferenceStage?.params.batchSize ?? "";
  const smokeTestEnabled = inferenceStage?.params.smokeTestEnabled === true;
  const smokeTestCountValue = inferenceStage?.params.smokeTestCount ?? 25;
  const smokeTestCountInvalid = smokeTestEnabled
    && (!Number.isInteger(Number(smokeTestCountValue)) || Number(smokeTestCountValue) < 1);
  const customInferenceParamsInvalid = (
    (maxTokensValue !== "" && (!Number.isInteger(Number(maxTokensValue)) || Number(maxTokensValue) < 1))
    || (temperatureValue !== "" && (Number(temperatureValue) < 0 || Number(temperatureValue) > 2))
    || (topKValue !== "" && (!Number.isInteger(Number(topKValue)) || Number(topKValue) < 1 || Number(topKValue) > 100))
    || (batchSizeValue !== "" && (!Number.isInteger(Number(batchSizeValue)) || Number(batchSizeValue) < 1 || Number(batchSizeValue) > 128))
    || smokeTestCountInvalid
  );
  const flowParamsIncomplete = !preprocessingStage?.params.cleaningRule
    || !preprocessingStage.params.samplingStrategy
    || customInferenceParamsInvalid
    || postprocessRulesInvalid
    || !String(metricStage?.params.metrics || "")
    || metricConditionInvalid
    || totalWeight !== 100;
  const editingScheme = editingName ? templates.find(item => item.name === editingName) : null;
  const canManageDraftSharing = !editingScheme || editingScheme.author === CURRENT_USER;
  const renderMetricConfiguration = (selectedMetrics: string[], stage: FlowStage) => {
    const selectedPrimaryCategory = metricLibrary.find(metric =>
      selectedMetrics.includes(metric.name) && MUTUALLY_EXCLUSIVE_METRIC_CATEGORIES.has(metric.category)
    )?.category;
    return <div style={{ marginTop: 10, borderTop: "1px solid #eef0f5", paddingTop: 8 }}>
      <div style={{ marginBottom: 8, color: "#6b7280", fontSize: 12, lineHeight: 1.6 }}>
        生成、分类、代码生成类指标互斥，只能选择其中一类；该类已选指标权重合计必须为 100%。效率类指标可随时选择，不参与权重计算。
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "22px 88px minmax(0, 1fr) 96px", gap: 8, alignItems: "center", padding: "7px 0", color: "#6b7280", fontSize: 11.5, borderBottom: "1px solid #e8ebf2" }}>
        <span>选择</span><span>指标</span><span>指标说明</span><span>权重（%）</span>
      </div>
      {["生成", "分类", "代码生成", "效率"].map(category => {
        const categoryDisabled = MUTUALLY_EXCLUSIVE_METRIC_CATEGORIES.has(category)
          && Boolean(selectedPrimaryCategory)
          && selectedPrimaryCategory !== category;
        return <div key={category} style={{ marginBottom: 8, opacity: categoryDisabled ? 0.52 : 1 }}>
          <div style={{ padding: "7px 9px", background: categoryDisabled ? "#f3f4f6" : "#f7f8fa", color: categoryDisabled ? "#9ca3af" : "#374151", fontSize: 12.5, fontWeight: 600 }}>
            {category}类指标{categoryDisabled ? "（不可选）" : ""}
          </div>
          {metricLibrary.filter(metric => metric.category === category).map(metric => {
            const isEfficiencyMetric = UNWEIGHTED_METRICS.has(metric.name);
            return <div key={metric.name} style={{ display: "grid", gridTemplateColumns: "22px 88px minmax(0, 1fr) 96px", gap: 8, alignItems: "center", borderBottom: "1px solid #f0f2f7", padding: "9px 0", fontSize: 12.5, background: categoryDisabled ? "#fafafa" : "#fff" }}>
              <input
                type="checkbox"
                aria-label={metric.name}
                checked={selectedMetrics.includes(metric.name)}
                disabled={categoryDisabled}
                title={categoryDisabled ? `已选择${selectedPrimaryCategory}类指标，不能同时选择${category}类指标` : undefined}
                onChange={event => updateSelectedMetrics(event.target.checked ? [...selectedMetrics, metric.name] : selectedMetrics.filter(name => name !== metric.name))}
              />
              <b style={{ color: categoryDisabled ? "#9ca3af" : "#1f2937" }}>{metric.name}</b>
              <span style={{ color: "#6b7280", lineHeight: 1.55 }}>
                <span style={{ display: "block" }}>计算原理：{metric.principle}</span>
                <span style={{ display: "block" }}>数学公式：{metric.formula}</span>
                <span style={{ display: "block" }}>适用场景：{metric.scene}；取值范围：{metric.range}</span>
              </span>
              {isEfficiencyMetric ? <span style={{ color: "#9ca3af", fontSize: 12 }}>不参与权重</span> : <input
                aria-label={`${metric.name} 权重`}
                title={selectedMetrics.includes(metric.name) ? "请输入 1～100 的权重" : "请先勾选该指标"}
                type="number"
                min={1}
                max={100}
                disabled={!selectedMetrics.includes(metric.name)}
                value={selectedMetrics.includes(metric.name) ? metricWeights[metric.name] ?? "" : ""}
                placeholder="勾选后填写"
                onChange={event => setMetricWeights(current => ({ ...current, [metric.name]: Number(event.target.value) }))}
                style={{ ...inputSt, height: 32, padding: "0 8px", background: selectedMetrics.includes(metric.name) ? "#fff" : "#f3f4f6", color: "#1f2937" }}
              />}
            </div>;
          })}
        </div>;
      })}
      <div style={{ marginTop: 8, color: totalWeight === 100 ? "#16a34a" : "#dc2626", fontSize: 12.5 }}>
        质量指标权重合计：{totalWeight}%（保存时必须为 100%）。效率类指标不参与加权总体得分。
      </div>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #eef0f5" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>样本计算范围</div>
            <div style={{ marginTop: 2, fontSize: 11.5, color: "#8a909e" }}>字段切换后系统提供有效条件值；“属于/不属于”可多选，其他运算符单选。</div>
          </div>
          <div className="flex items-center gap-1">
            {([["all", "全部样本"], ["filter", "按条件筛选"]] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => updateMetricConditionRule(rule => ({
                ...rule,
                mode: value,
                conditions: value === "filter" && !rule.conditions.length
                  ? [{ id: createConditionId(), field: "dataset", operator: "eq", value: "" }]
                  : rule.conditions,
              }))} style={{ height: 28, padding: "0 10px", borderRadius: 6, border: `1px solid ${metricConditionRule.mode === value ? "#4f6ef7" : "#e0e3ed"}`, background: metricConditionRule.mode === value ? "#eff4ff" : "#fff", color: metricConditionRule.mode === value ? "#4f6ef7" : "#4b5563", fontSize: 12, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
        </div>
        {metricConditionRule.mode === "filter" && (
          <div style={{ padding: 10, background: "#fafbfc", border: "1px solid #e8ebf2", borderRadius: 7 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, color: "#6b7280" }}>多个条件的组合方式</span>
              <select aria-label="条件组合方式" value={metricConditionRule.combinator} onChange={event => updateMetricConditionRule(rule => ({ ...rule, combinator: event.target.value as ConditionCombinator }))} style={{ ...inputSt, width: 150, height: 30 }}>
                <option value="AND">全部满足（AND）</option>
                <option value="OR">任一满足（OR）</option>
              </select>
            </div>
            {metricConditionRule.conditions.map((condition, index) => (
              <div key={condition.id} style={{ display: "grid", gridTemplateColumns: "32px minmax(110px, .9fr) minmax(100px, .8fr) minmax(150px, 1.4fr) 28px", gap: 7, alignItems: "center", marginTop: index ? 7 : 0 }}>
                <span style={{ fontSize: 11, color: "#8a909e", textAlign: "center" }}>{index ? metricConditionRule.combinator : "当"}</span>
                <select aria-label={`条件 ${index + 1} 字段`} value={condition.field} onChange={event => updateMetricConditionRule(rule => ({ ...rule, conditions: rule.conditions.map(item => item.id === condition.id ? { ...item, field: event.target.value as ConditionField, value: "" } : item) }))} style={{ ...inputSt, height: 31 }}>
                  {CONDITION_FIELD_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select aria-label={`条件 ${index + 1} 运算符`} value={condition.operator} onChange={event => updateMetricConditionRule(rule => ({ ...rule, conditions: rule.conditions.map(item => {
                  if (item.id !== condition.id) return item;
                  const operator = event.target.value as ConditionOperator;
                  const value = operator === "in" || operator === "notIn" ? item.value : item.value.split(/[,，]/)[0] || "";
                  return { ...item, operator, value };
                }) }))} style={{ ...inputSt, height: 31 }}>
                  {CONDITION_OPERATOR_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <ConditionValueControl condition={condition} options={conditionValueOptions(condition.field, draftModelType)} onChange={value => updateMetricConditionRule(rule => ({ ...rule, conditions: rule.conditions.map(item => item.id === condition.id ? { ...item, value } : item) }))} />
                <button type="button" aria-label={`删除条件 ${index + 1}`} title="删除条件" onClick={() => updateMetricConditionRule(rule => ({ ...rule, conditions: rule.conditions.filter(item => item.id !== condition.id) }))} style={{ width: 28, height: 28, border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer" }}><X size={14} /></button>
              </div>
            ))}
            <div className="flex items-center justify-between" style={{ marginTop: 9 }}>
              <TextButton onClick={() => updateMetricConditionRule(rule => ({ ...rule, conditions: [...rule.conditions, { id: createConditionId(), field: "dataset", operator: "eq", value: "" }] }))}>+ 添加条件</TextButton>
              <span style={{ fontSize: 11.5, color: metricConditionInvalid ? "#dc2626" : "#6b7280" }}>{metricConditionInvalid ? "至少配置一条完整条件后才能保存" : "命中数量将在任务选择数据集后计算"}</span>
            </div>
          </div>
        )}
      </div>
    </div>;
  };

  return (
    <WorkbenchPage title="配置方案" crumb="配置方案">
      <div style={{ ...panelSt, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <div className="flex items-center justify-between gap-3 flex-wrap" style={{ padding: "12px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2 flex-wrap" style={{ flex: "1 1 560px", minWidth: 0 }}>
            <div className="flex items-center" style={{ width: 240, maxWidth: "100%", height: 34, padding: "0 9px", border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff" }}>
              <Search size={14} color="#9ca3af" />
              <input aria-label="方案名称搜索" value={templateQuery} onChange={event => setTemplateQuery(event.target.value)} placeholder="搜索方案名称" style={{ minWidth: 0, flex: 1, height: "100%", padding: "0 7px", border: "none", outline: "none", background: "transparent", fontSize: 13 }} />
              {templateQuery && <button type="button" aria-label="清除方案名称搜索" onClick={() => setTemplateQuery("")} style={{ display: "inline-flex", border: "none", background: "none", padding: 2, color: "#9ca3af", cursor: "pointer" }}><X size={13} /></button>}
            </div>
            <select aria-label="适用范围筛选" value={templateModelType} onChange={event => setTemplateModelType(event.target.value as ModelType | "")} style={{ ...inputSt, width: 150, height: 34 }}>
              <option value="">全部适用范围</option>
              <option value="语言模型">语言模型</option>
              <option value="多模态模型">多模态模型</option>
            </select>
            <select aria-label="创建人筛选" value={templateAuthor} onChange={event => setTemplateAuthor(event.target.value)} style={{ ...inputSt, width: 140, height: 34 }}>
              <option value="">全部创建人</option>
              {templateAuthors.map(author => <option key={author} value={author}>{author}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">{message && <span style={{ fontSize: 12.5, color: "#16a34a" }}>{message}</span>}<PrimaryButton onClick={openCreate}><Plus size={14} />新建流程模板</PrimaryButton></div>
        </div>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", minWidth: 1015, tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
            <colgroup><col style={{ width: 145 }} /><col style={{ width: 155 }} /><col style={{ width: 210 }} /><col style={{ width: 65 }} /><col style={{ width: 80 }} /><col style={{ width: 140 }} /><col style={{ width: 220 }} /></colgroup>
            <thead><tr>{["方案名称", "适用范围", "配置内容", "版本", "创建人", "共享权限", "操作"].map((c, index) => <th key={c} style={{ ...thSt, position: "sticky", top: 0, right: index === 6 ? 0 : undefined, zIndex: index === 6 ? 3 : 2, boxShadow: index === 6 ? "-1px 0 #eef1f6" : undefined }}>{c}</th>)}</tr></thead>
            <tbody>
              {filteredTemplates.map(row => {
                return <tr key={row.name}>
                  <td style={{ ...tdSt, fontWeight: 600 }}>{row.name}</td>
                  <td style={tdSt}><div>{row.modelType}</div><div style={{ marginTop: 3, color: "#6b7280", fontSize: 11.5 }}>全部评测任务</div></td>
                  <td style={{ ...tdSt, overflowWrap: "anywhere" }}><div>{row.stages}</div><div style={{ marginTop: 4, color: "#6b7280", fontSize: 11.5 }}>指标：{metricWeightSummary(row.metricWeights || {}) || "未配置"}</div><div style={{ marginTop: 2, color: "#6b7280", fontSize: 11.5 }}>样本范围：{conditionRuleSummary(row.flowStages?.find(stage => stage.name === "指标计算")?.conditionRule)}</div></td>
                  <td style={{ ...tdSt, whiteSpace: "nowrap" }}>{row.version}</td>
                  <td style={{ ...tdSt, whiteSpace: "nowrap" }}>{row.author}</td>
                  <td style={{ ...tdSt, whiteSpace: "nowrap" }}><span>{schemeVisibility(row.scope, row.sharedAccess)}</span>{row.author === CURRENT_USER && <span style={{ marginLeft: 8 }}><TextButton onClick={() => openSharing(row)}>修改</TextButton></span>}</td>
                  <td style={{ ...tdSt, position: "sticky", right: 0, background: "#fff", boxShadow: "-1px 0 #f0f2f7" }}><div className="flex items-center" style={{ flexWrap: "wrap", gap: "5px 10px" }}>
                    {canEditScheme(row) && <TextButton onClick={() => openEdit(row)}>编辑</TextButton>}
                    <TextButton onClick={() => setApplySchemeName(row.name)}>应用到任务</TextButton>
                    <TextButton onClick={() => setHistoryName(row.name)}>版本历史</TextButton>
                    {row.author === CURRENT_USER && <TextButton danger onClick={() => setTemplates(prev => prev.filter(item => item.name !== row.name))}>删除</TextButton>}
                  </div></td>
                </tr>;
              })}
              {!filteredTemplates.length && <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "#6b7280", fontSize: 13 }}>没有符合当前筛选条件的流程模板</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showCreate && (
        <>
          <div onClick={() => setShowCreate(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
          <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(720px, 100vw)", background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
            <div className="flex items-center justify-between" style={{ padding: "14px 18px", borderBottom: "1px solid #f0f2f7" }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{editingName ? "编辑" : "创建"}流程模板</div>
              <button onClick={() => setShowCreate(false)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 18, flex: 1, overflow: "auto" }}>
              <div style={{ marginBottom: 14 }}><FieldLabel required>方案名称</FieldLabel><input value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="请输入方案名称" style={inputSt} /></div>
              <div style={{ marginBottom: 14 }}><FieldLabel required>适用模型类型</FieldLabel><select value={draftModelType} onChange={e => {
                setDraftModelType(e.target.value as ModelType | "");
                updateMetricConditionRule(rule => ({ ...rule, conditions: rule.conditions.map(condition => ({ ...condition, value: "" })) }));
              }} style={inputSt}><option value="">请选择模型类型</option><option>语言模型</option><option>多模态模型</option></select></div>
              <>
                <div style={{ marginBottom: 14 }}>
                  <FieldLabel required>执行阶段与参数</FieldLabel>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>数据预处理必须在模型推理之前；指标计算必须在模型推理之后；后处理可跳过。评估指标及权重统一在“指标计算”阶段配置。</div>
                  {flowStages.map((stage, index) => {
                    const selectedMetrics = String(stage.params.metrics || "").split(",").filter(Boolean);
                    return <div key={stage.name} style={{ border: `1px solid ${flowError || (stage.name === "后处理" && postprocessRulesInvalid) ? "#fecaca" : "#e8ebf2"}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}><input type="checkbox" checked={stage.enabled} disabled={stage.name !== "后处理"} onChange={e => setFlowStages(prev => prev.map(item => item.name === stage.name ? { ...item, enabled: e.target.checked } : item))} />{index + 1}. {stage.name}</label>
                        <div className="flex items-center gap-1"><button title="上移" onClick={() => moveStage(index, -1)} disabled={index === 0} style={{ border: "none", background: "none", cursor: "pointer" }}><ArrowUp size={13} /></button><button title="下移" onClick={() => moveStage(index, 1)} disabled={index === flowStages.length - 1} style={{ border: "none", background: "none", cursor: "pointer" }}><ArrowDown size={13} /></button></div>
                      </div>
                      {stage.enabled && stage.name === "数据预处理" && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}><label style={{ fontSize: 11.5, color: "#6b7280" }}>清洗规则<select value={String(stage.params.cleaningRule)} onChange={e => updateStageParam(stage.name, "cleaningRule", e.target.value)} style={{ ...inputSt, marginTop: 4 }}><option>去空值并去重</option><option>仅去空值</option><option>不清洗</option></select></label><label style={{ fontSize: 11.5, color: "#6b7280" }}>采样策略<select value={String(stage.params.samplingStrategy)} onChange={e => updateStageParam(stage.name, "samplingStrategy", e.target.value)} style={{ ...inputSt, marginTop: 4 }}><option>全量采样</option><option>随机采样</option><option>分层采样</option></select></label></div>}
                      {stage.enabled && stage.name === "模型推理" && (
                        <div style={{ marginTop: 8, borderTop: "1px solid #eef0f5", paddingTop: 6 }}>
                          <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 6 }}>
                            以下模型推理参数均为选填。未填写的参数不写入模板，由创建评测任务时所选模型的配置决定。
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                            {[
                              { label: "最大 Token", key: "maxTokens", min: 1, step: 1, hint: "选填；填写正整数，且不得超过模型支持上限。" },
                              { label: "Temperature", key: "temperature", min: 0, max: 2, step: 0.1, hint: "选填；填写 0～2，数值越低输出越稳定。" },
                              { label: "Top-K", key: "topK", min: 1, max: 100, step: 1, hint: "选填；填写 1～100 的整数，越小候选越集中。" },
                              { label: "Batch Size", key: "batchSize", min: 1, max: 128, step: 1, hint: "选填；填写 1～128 的整数，数值越大显存占用越高。" },
                            ].map(field => (
                              <label key={field.key} style={{ fontSize: 11.5, color: "#6b7280" }}>{field.label}
                                <input type="number" min={field.min} max={field.max} step={field.step} value={String(stage.params[field.key] ?? "")}
                                  placeholder="选填"
                                  onChange={event => updateStageParam(stage.name, field.key, event.target.value === "" ? "" : Number(event.target.value))}
                                  style={{ ...inputSt, height: 32, marginTop: 4, background: "#fff" }} />
                                <span style={{ display: "block", minHeight: 28, marginTop: 4, color: "#8a909e", lineHeight: 1.4 }}>{field.hint}</span>
                              </label>
                            ))}
                          </div>
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eef0f5" }}>
                            <div className="flex items-center" style={{ gap: 8, minWidth: 0, whiteSpace: "nowrap" }}>
                              <CompactSwitch checked={stage.params.smokeTestEnabled === true} label="冒烟测试" onChange={updateSmokeTestEnabled} />
                              <span style={{ color: "#374151", fontSize: 12.5, fontWeight: 600 }}>冒烟测试</span>
                              {stage.params.smokeTestEnabled === true && (
                                <>
                                  <input
                                    aria-label="冒烟测试条数"
                                    title="冒烟测试条数"
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={String(stage.params.smokeTestCount ?? 25)}
                                    onChange={event => updateStageParam(stage.name, "smokeTestCount", event.target.value === "" ? "" : Number(event.target.value))}
                                    style={{ ...inputSt, width: 80, height: 30, padding: "0 8px", background: "#fff", flexShrink: 0 }}
                                  />
                                  <span style={{ color: "#6b7280", fontSize: 11.5 }}>条</span>
                                </>
                              )}
                              <span style={{ minWidth: 0, color: "#8a909e", fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis" }} title="适用于快速验证端口的可用性">
                                适用于快速验证端口的可用性
                              </span>
                              {smokeTestCountInvalid && <span style={{ color: "#dc2626", fontSize: 11.5 }}>请输入大于 0 的整数</span>}
                            </div>
                          </div>
                          {customInferenceParamsInvalid && <div style={{ marginTop: 4, color: "#dc2626", fontSize: 12 }}>请检查已填写的模型推理参数及取值范围。</div>}
                        </div>
                      )}
                      {stage.enabled && stage.name === "后处理" && (
                        <div style={{ marginTop: 8, borderTop: "1px solid #eef0f5", paddingTop: 8 }}>
                          <div style={{ marginBottom: 6, color: "#6b7280", fontSize: 11.5 }}>标准化规则</div>
                          <div className="flex flex-col" style={{ gap: 8 }}>
                            {POSTPROCESS_RULE_OPTIONS.map(option => (
                              <label key={option.id} className="flex items-center" style={{ gap: 8, color: "#374151", fontSize: 12.5, cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={parsePostprocessRules(stage.params.normalizationRules).includes(option.id)}
                                  onChange={event => updatePostprocessRule(option.id, event.target.checked)}
                                />
                                <span>{option.label}</span>
                              </label>
                            ))}
                          </div>
                          <div style={{ marginTop: 7, color: "#8a909e", fontSize: 11.5, lineHeight: 1.5 }}>仅处理模型输出格式，规则按从上到下的固定顺序执行。</div>
                          {postprocessRulesInvalid && <div style={{ marginTop: 5, color: "#dc2626", fontSize: 11.5 }}>请选择至少一项标准化规则</div>}
                        </div>
                      )}
                      {stage.enabled && stage.name === "指标计算" && renderMetricConfiguration(selectedMetrics, stage)}
                    </div>;
                  })}
                  {flowError && <div style={{ color: "#dc2626", fontSize: 12.5 }}>{flowError}，请调整阶段顺序后再保存。</div>}
                </div>
              </>
              <SchemePermissionEditor
                scope={draftScope}
                sharedAccess={draftSharedAccess}
                onScopeChange={setDraftScope}
                onSharedAccessChange={setDraftSharedAccess}
                disabled={!canManageDraftSharing}
                allowPrivate={!editingScheme || editingScheme.scope !== "共享"}
              />
            </div>
            <div className="flex items-center justify-end gap-2" style={{ padding: "12px 18px", borderTop: "1px solid #f0f2f7" }}>
              <SecondaryButton onClick={() => setShowCreate(false)}>取消</SecondaryButton>
              <PrimaryButton disabled={!draftName.trim() || !draftModelType || totalWeight !== 100 || Boolean(flowError) || flowParamsIncomplete} onClick={create}>保存</PrimaryButton>
            </div>
          </div>
        </>
      )}
      {shareScheme && (
        <>
          <div onClick={() => setShareScheme(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 120 }} />
          <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(460px, 100vw)", background: "#fff", zIndex: 121, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
            <div className="flex items-center justify-between" style={{ padding: "14px 18px", borderBottom: "1px solid #f0f2f7" }}>
              <div><div style={{ fontSize: 16, fontWeight: 600 }}>共享设置</div><div style={{ marginTop: 3, color: "#6b7280", fontSize: 12 }}>{shareScheme.name}</div></div>
              <button aria-label="关闭共享设置" onClick={() => setShareScheme(null)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ padding: 18, flex: 1, overflow: "auto" }}>
              <SchemePermissionEditor
                scope={shareScope}
                sharedAccess={shareAccess}
                onScopeChange={setShareScope}
                onSharedAccessChange={setShareAccess}
                allowPrivate={shareScheme.scope !== "共享"}
              />
            </div>
            <div className="flex items-center justify-end gap-2" style={{ padding: "12px 18px", borderTop: "1px solid #f0f2f7" }}>
              <SecondaryButton onClick={() => setShareScheme(null)}>取消</SecondaryButton>
              <PrimaryButton onClick={saveSharing}>保存</PrimaryButton>
            </div>
          </div>
        </>
      )}
      {historyName && (() => {
        const selectedScheme = templates.find(item => item.name === historyName);
        return <><div onClick={() => setHistoryName(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 120 }} /><div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 520, background: "#fff", borderRadius: 8, zIndex: 121, padding: 22 }}><div className="flex items-center justify-between" style={{ marginBottom: 14 }}><b>{historyName} · 版本历史</b><button aria-label="关闭版本历史" onClick={() => setHistoryName(null)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={18} /></button></div>{selectedScheme?.history.map((item, index) => <div key={`${item.version}-${index}`} className="flex items-center justify-between" style={{ padding: "11px 0", borderBottom: "1px solid #f0f2f7", fontSize: 13 }}><span><b>{item.version}</b> · {item.date} · {item.operator} · {item.summary}</span>{index > 0 && selectedScheme && canEditScheme(selectedScheme) && <TextButton onClick={() => rollbackScheme(historyName, item.version)}>回滚到此版本</TextButton>}</div>)}</div></>;
      })()}
      {applySchemeName && (() => {
        const selectedScheme = templates.find(item => item.name === applySchemeName);
        return <CreateDrawer initialScheme={applySchemeName} initialSchemeConfig={selectedScheme ? schemeApplyConfig(selectedScheme) : null} onClose={() => setApplySchemeName(null)} onDone={() => { setMessage("已使用配置方案创建评测任务"); setApplySchemeName(null); }} />;
      })()}
    </WorkbenchPage>
  );
}

type EvaluationDocSection = {
  key: string;
  title: string;
  summary: string;
  content: React.ReactNode;
};

const evaluationApiExample = `curl --request POST 'https://api.example.com/v1/evaluations/tasks' \\
  --header 'Authorization: Bearer $API_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "name": "文本理解评测",
    "model": "qwen3-8b",
    "dataset": "C-Eval",
    "metrics": ["Accuracy", "F1"]
  }'`;

const evaluationPythonExample = `import requests

base_url = "https://api.example.com/v1"
headers = {"Authorization": "Bearer <API_KEY>"}

task = requests.post(
    f"{base_url}/evaluations/tasks",
    headers=headers,
    json={"name": "文本理解评测", "model": "qwen3-8b", "dataset": "C-Eval"},
).json()
result = requests.get(
    f"{base_url}/evaluations/tasks/{task['data']['id']}/results",
    headers=headers,
).json()
print(result)`;

const evaluationJavaExample = `HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/v1/evaluations/tasks"))
    .header("Authorization", "Bearer <API_KEY>")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
    .build();
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());`;

export function EvaluationDocsPage() {
  const [activeSection, setActiveSection] = useState("quick-start");
  const [keyword, setKeyword] = useState("");
  const [codeLanguage, setCodeLanguage] = useState<"Python" | "cURL" | "Java">("Python");
  const [debugPath, setDebugPath] = useState("/v1/evaluations/tasks");
  const [debugMethod, setDebugMethod] = useState("GET");
  const [debugBody, setDebugBody] = useState('{\n  "name": "文本理解评测"\n}');
  const [debugResponse, setDebugResponse] = useState("尚未发送请求");
  const [debugging, setDebugging] = useState(false);

  const copyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setDebugResponse("复制失败，请手动选择代码复制。");
    }
  };

  const sendDebugRequest = async () => {
    setDebugging(true);
    setDebugResponse("请求发送中…");
    try {
      const path = debugPath.trim();
      const response = await fetch(path, {
        method: debugMethod,
        headers: { "Content-Type": "application/json" },
        body: ["POST", "PUT", "PATCH"].includes(debugMethod) ? debugBody : undefined,
      });
      const text = await response.text();
      setDebugResponse(`HTTP ${response.status}\n${text || "响应体为空"}`);
    } catch (error) {
      setDebugResponse(`请求失败：${error instanceof Error ? error.message : "请检查接口地址、网络和权限配置"}`);
    } finally {
      setDebugging(false);
    }
  };

  const codeExamples = {
    Python: evaluationPythonExample,
    cURL: evaluationApiExample,
    Java: evaluationJavaExample,
  };

  const sections: EvaluationDocSection[] = [
    {
      key: "quick-start",
      title: "快速入门",
      summary: "创建评测任务、选择模型与数据集、执行评测并查看报告。",
      content: (
        <>
          <p>模型评测用于对系统已注册模型或外部模型 API 进行自动化评估。标准流程为：创建任务、选择模型、选择数据集、配置流程模板、执行监控、查看报告、进行模型对比。</p>
          <ol style={{ lineHeight: 2, paddingLeft: 20 }}>
            <li>进入“评测任务”，点击“创建评测任务”。</li>
            <li>选择语言模型或多模态模型，并选择一个或多个评测任务。</li>
            <li>选择已通过校验的数据集和流程模板。</li>
            <li>确认配置后点击“开始测评”，在任务详情中查看进度、日志和结果。</li>
          </ol>
        </>
      ),
    },
    {
      key: "guide",
      title: "功能指南",
      summary: "评测任务、评测数据、模型对比和配置方案的操作说明。",
      content: <p>评测任务负责创建、监控与报告下载；评测数据负责公开数据集和自定义数据集管理；模型对比用于在统一条件下比较两个或多个结果；配置方案用于沉淀和复用测评流程。</p>,
    },
    {
      key: "metrics",
      title: "评测方法",
      summary: "查看指标计算原理、优缺点、适用场景、取值范围和参考资料。",
      content: (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10 }}>
          {Object.entries(METRIC_DETAILS).map(([name, detail]) => (
            <div key={name} style={{ border: "1px solid #e8ebf2", padding: 12, borderRadius: 6 }}>
              <b>{name}</b>
              <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: "#4b5563" }}>
                <div>计算原理：{detail.formula}</div>
                <div>适用场景：{detail.scene}</div>
                <div>取值范围：{detail.range}</div>
                <div>优点：计算口径明确，便于跨模型比较。</div>
                <div>缺点：单一指标不能覆盖全部业务质量。</div>
                <div>参考文献：以指标原始论文及平台实现版本为准。</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "data",
      title: "数据格式",
      summary: "JSONL、CSV 数据格式与 Schema 校验规则。",
      content: <p>语言模型数据至少包含输入和标准答案；多模态数据还需包含可访问的图像地址。上传后系统逐行执行 Schema 校验，并展示错误行号和失败原因。</p>,
    },
    {
      key: "best-practice",
      title: "最佳实践",
      summary: "固定版本、隔离变量、保留任务快照并复核异常样本。",
      content: <p>对比模型时应使用相同数据集、版本、任务类型和指标口径。正式评测前先使用小样本验证流程，再扩大样本规模；报告结论需结合指标趋势和失败样本共同判断。</p>,
    },
    {
      key: "api",
      title: "API 接口",
      summary: "REST API、认证、请求参数、响应格式和在线调试。",
      content: (
        <>
          <div style={{ padding: 12, border: "1px solid #dbe4ff", background: "#f7f9ff", borderRadius: 6, lineHeight: 1.7 }}>
            支持 API Key 与 OAuth 2.0。权限范围分为只读、执行和管理；请求 Header 使用 <code>Authorization: Bearer &lt;token&gt;</code>。
          </div>
          <table style={{ width: "100%", marginTop: 14, borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead><tr>{["方法", "路径", "说明"].map(item => <th key={item} style={thSt}>{item}</th>)}</tr></thead>
            <tbody>
              {[
                ["POST", "/v1/evaluations/tasks", "创建评测任务"],
                ["GET", "/v1/evaluations/tasks/{id}", "查询任务与执行状态"],
                ["DELETE", "/v1/evaluations/tasks/{id}", "删除任务"],
                ["GET", "/v1/evaluations/tasks/{id}/results", "查询评测结果"],
                ["GET", "/v1/evaluations/datasets/{id}/validation", "查询数据校验结果"],
              ].map(row => <tr key={row.join("")}>{row.map(item => <td key={item} style={tdSt}><code>{item}</code></td>)}</tr>)}
            </tbody>
          </table>
          <div style={{ marginTop: 16, fontWeight: 600 }}>在线调试</div>
          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 8, marginTop: 8 }}>
            <select value={debugMethod} onChange={event => setDebugMethod(event.target.value)} style={inputSt}>
              {["GET", "POST", "DELETE"].map(method => <option key={method}>{method}</option>)}
            </select>
            <input aria-label="调试接口路径" value={debugPath} onChange={event => setDebugPath(event.target.value)} style={inputSt} />
            <PrimaryButton disabled={debugging || !debugPath.trim()} onClick={sendDebugRequest}>{debugging ? "发送中" : "发送请求"}</PrimaryButton>
          </div>
          {debugMethod === "POST" && <textarea value={debugBody} onChange={event => setDebugBody(event.target.value)} style={{ ...inputSt, height: 100, padding: 10, marginTop: 8, fontFamily: "monospace" }} />}
          <pre style={{ marginTop: 8, minHeight: 90, padding: 12, overflow: "auto", background: "#111827", color: "#e5e7eb", borderRadius: 6, fontSize: 12 }}>{debugResponse}</pre>
        </>
      ),
    },
    {
      key: "examples",
      title: "代码示例",
      summary: "Python、cURL、Java 完整调用流程和可下载示例。",
      content: (
        <>
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <div className="flex items-center gap-1">
              {(["Python", "cURL", "Java"] as const).map(language => <SecondaryButton key={language} onClick={() => setCodeLanguage(language)}>{language}</SecondaryButton>)}
            </div>
            <div className="flex items-center gap-2">
              <SecondaryButton onClick={() => copyCode(codeExamples[codeLanguage])}><Copy size={13} />一键复制</SecondaryButton>
              <SecondaryButton onClick={() => downloadTextFile("maas-evaluation-example.py", evaluationPythonExample, "text/x-python;charset=utf-8")}>下载 Python 脚本</SecondaryButton>
              <SecondaryButton onClick={() => downloadTextFile("maas-evaluation-example.ipynb", JSON.stringify({ cells: [], metadata: {}, nbformat: 4, nbformat_minor: 5 }, null, 2), "application/json")}>下载 Jupyter Notebook</SecondaryButton>
            </div>
          </div>
          <pre style={{ padding: 14, overflow: "auto", background: "#111827", color: "#e5e7eb", borderRadius: 6, fontSize: 12, lineHeight: 1.6 }}>{codeExamples[codeLanguage]}</pre>
        </>
      ),
    },
    {
      key: "faq",
      title: "常见问题",
      summary: "任务失败、数据校验失败、接口权限和结果差异排查。",
      content: <p>任务失败时先查看执行日志与失败原因；数据集不可选时检查校验状态和共享权限；接口返回 401/403 时检查凭证和权限范围；模型对比不可用时检查统一数据集、版本、任务和指标口径。</p>,
    },
  ];

  const matches = sections.filter(section => {
    const value = `${section.title} ${section.summary}`.toLowerCase();
    return !keyword.trim() || value.includes(keyword.trim().toLowerCase());
  });
  const active = sections.find(section => section.key === activeSection) || sections[0];

  return (
    <WorkbenchPage title="评测文档" crumb="评测文档">
      <div style={{ display: "grid", gridTemplateColumns: "240px minmax(0, 1fr)", gap: 14, minHeight: 0, flex: 1 }}>
        <aside style={{ ...panelSt, padding: 10, overflow: "auto" }}>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "#8a909e" }} />
            <input aria-label="全文搜索" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="全文搜索" style={{ ...inputSt, paddingLeft: 30 }} />
          </div>
          {matches.length ? matches.map(section => (
            <button key={section.key} onClick={() => setActiveSection(section.key)} style={{ width: "100%", border: "none", borderRadius: 5, background: active.key === section.key ? "#eef2ff" : "transparent", color: active.key === section.key ? "#4f6ef7" : "#374151", padding: "9px 10px", textAlign: "left", cursor: "pointer", fontSize: 13 }}>
              <HighlightText text={section.title} keyword={keyword} />
            </button>
          )) : <div style={{ padding: 12, color: "#8a909e", fontSize: 12.5 }}>未找到相关文档</div>}
        </aside>
        <article style={{ ...panelSt, padding: 22, overflow: "auto" }}>
          <div className="flex items-center gap-2" style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}><BookOpen size={18} color="#4f6ef7" /><HighlightText text={active.title} keyword={keyword} /></div>
          <div style={{ color: "#6b7280", fontSize: 12.5, marginBottom: 18 }}><HighlightText text={active.summary} keyword={keyword} /></div>
          <div style={{ color: "#374151", fontSize: 13.5, lineHeight: 1.8 }}>{active.content}</div>
        </article>
      </div>
    </WorkbenchPage>
  );
}

function WorkbenchPage({ title, crumb, children }: { title: string; crumb: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "10px 18px 0" }}>
        <div className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: "#6b7280" }}>
          <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
          <span style={{ color: "#4f6ef7" }}>模型评测</span><span>/</span>
          <span style={{ color: "#1a1d23", fontWeight: 500 }}>{crumb}</span>
        </div>
        <div className="flex items-center gap-2" style={{ fontSize: 13, color: "#6b7280" }}>
          <span title="当前页面使用演示数据；生产状态和结果由真实 API 提供" style={{ padding: "2px 7px", borderRadius: 10, background: "#fff7ed", color: "#c2410c", fontSize: 11.5 }}>交互原型</span>
          {title === "模型对比" ? <BarChart2 size={15} /> : title === "配置方案" ? <Settings size={15} /> : <Database size={15} />}
          {title}
        </div>
      </div>
      <div className="flex-1 flex flex-col min-h-0" style={{ margin: "10px 18px 18px" }}>
        {children}
      </div>
    </div>
  );
}
