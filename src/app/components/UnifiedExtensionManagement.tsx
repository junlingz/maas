import { Fragment, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Download,
  FileCheck2,
  FileText,
  GitBranch,
  Info,
  Package,
  Play,
  Puzzle,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Terminal,
  TestTube2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import {
  ExtensionTestWorkbench,
  buildPassedExtensionTestReport,
  type ExtensionTestReport,
} from "./ExtensionTestWorkbench";
import {
  CATEGORY_LABELS,
  EXTENSION_RULE_SET_VERSION,
  MAX_YAML_BYTES,
  buildTemplateYaml,
  emptyConfigValidation,
  extractExtensionName,
  extractTemplateId,
  validateExtensionConfig,
  type ConfigCategoryResult,
  type ConfigFinding,
  type ConfigValidationKey,
  type ConfigValidationState,
  type ExtensionConfigReport,
  type ExtensionTemplateRule,
  type ExtensionTypeCode,
  type ParameterValidationRule,
} from "./extensionConfigValidation";

type ExtensionType = "微调算法" | "优化器" | "数据处理" | "评估方法";
type NoticeTone = "success" | "info" | "error";

type ParameterDefinition = ParameterValidationRule & {
  helper: string;
  type?: "text" | "number" | "select";
};

type ExtensionTemplate = ExtensionTemplateRule & {
  type: ExtensionType;
  name: string;
  description: string;
  scenarios: string[];
  guide: string[];
  parameters: ParameterDefinition[];
};

type ExtensionVersion = {
  id: string;
  templateId: string;
  name: string;
  type: ExtensionType;
  version: string;
  fileName: string;
  fileSize: number;
  fileHash?: string;
  uploadedAt: string;
  debuggedAt?: string;
  validations: ConfigCategoryResult[];
  report: ExtensionConfigReport | null;
  yamlSource: string;
  parameters: Record<string, string | number>;
  enabled: boolean;
};

export type EnabledFineTuningExtension = {
  id: string;
  name: string;
  type: ExtensionType;
  version: string;
  parameters: Record<string, string | number>;
};

export interface UnifiedExtensionManagementProps {
  onEnable?: (ext: EnabledFineTuningExtension) => void;
}

const C = {
  primary: "#4f6ef7",
  primarySoft: "#f3f6ff",
  ink: "#1a1d23",
  text: "#374151",
  muted: "#6b7280",
  faint: "#9ca3af",
  line: "#e0e3ed",
  lineSoft: "#eef0f5",
  panel: "#f8f9fc",
  green: "#16a34a",
  greenSoft: "#f0faf5",
  amber: "#d97706",
  amberSoft: "#fffbeb",
  red: "#dc2626",
  redSoft: "#fef2f2",
};
const surface: CSSProperties = { minWidth: 0, border: `1px solid ${C.line}`, borderRadius: 8, background: "#fff" };

const TEMPLATES: ExtensionTemplate[] = [
  {
    id: "a1",
    configId: "lora-algorithm",
    configVersion: "1.0.0",
    type: "微调算法",
    typeCode: "fine_tuning_algorithm",
    name: "LoRA 算法扩展",
    description: "以参数模板覆盖 LoRA 训练配置，不上传代码，也不改变现有训练算法流程。",
    scenarios: ["参数高效微调", "大模型适配", "低资源训练"],
    guide: ["下载本模板。", "仅修改 extension_name 与 parameters。", "上传后点击“开始调试”，通过后启用。"],
    parameters: [
      { key: "rank", label: "LoRA Rank", valueType: "integer", defaultValue: "16", helper: "允许 1～256，建议 8～64。", type: "number", min: 1, max: 256, step: 1, recommendedMin: 8, recommendedMax: 64, mappingPath: "training.method.lora.rank" },
      { key: "alpha", label: "Alpha", valueType: "integer", defaultValue: "32", helper: "允许 1～512。", type: "number", min: 1, max: 512, step: 1, mappingPath: "training.method.lora.alpha" },
    ],
  },
  {
    id: "a2",
    configId: "optimizer",
    configVersion: "1.0.0",
    type: "优化器",
    typeCode: "optimizer",
    name: "自定义优化器",
    description: "将优化器、学习率、权重衰减和调度策略映射到现有训练入参。",
    scenarios: ["通用优化器", "微调学习率", "学习率调度"],
    guide: ["下载本模板。", "按字段约束调整参数，不新增字段。", "上传后完成调试校验，再启用到训练任务。"],
    parameters: [
      { key: "optimizer", label: "优化器", valueType: "string", defaultValue: "AdamW", helper: "支持 AdamW、Adam、SGD、Adafactor。", type: "select", options: ["AdamW", "Adam", "SGD", "Adafactor"], mappingPath: "training.optimizer.name" },
      { key: "learning_rate", label: "微调学习率", valueType: "float", defaultValue: "2e-5", helper: "允许 0.000001～1。", type: "number", min: 0.000001, max: 1, step: 0.000001, mappingPath: "training.optimizer.learning_rate" },
      { key: "weight_decay", label: "权重衰减", valueType: "float", defaultValue: "0.01", helper: "允许 0～1。", type: "number", min: 0, max: 1, step: 0.001, mappingPath: "training.optimizer.weight_decay" },
      { key: "lr_scheduler_type", label: "学习率调度策略", valueType: "string", defaultValue: "cosine", helper: "支持 cosine、polynomial、constant_with_warmup。", type: "select", options: ["cosine", "polynomial", "constant_with_warmup"], mappingPath: "training.optimizer.scheduler" },
    ],
  },
  {
    id: "a3",
    configId: "dialogue-processing",
    configVersion: "1.0.0",
    type: "数据处理",
    typeCode: "data_processing",
    name: "对话数据处理",
    description: "选择平台已经实现的数据处理参数；本期不上传或执行自定义清洗代码。",
    scenarios: ["对话系统", "轮次截断", "去重策略"],
    guide: ["下载本模板。", "调整最大轮次和去重策略。", "通过配置调试后，在训练任务中选择使用。"],
    parameters: [
      { key: "maxTurns", label: "最大轮次", valueType: "integer", defaultValue: "32", helper: "允许 1～256。", type: "number", min: 1, max: 256, step: 1, mappingPath: "training.data.max_turns" },
      { key: "deduplicate", label: "去重策略", valueType: "string", defaultValue: "精确匹配", helper: "支持关闭、精确匹配、归一化匹配。", type: "select", options: ["关闭", "精确匹配", "归一化匹配"], mappingPath: "training.data.deduplicate" },
    ],
  },
  {
    id: "a4",
    configId: "domain-evaluation",
    configVersion: "1.0.0",
    type: "评估方法",
    typeCode: "evaluation_method",
    name: "领域评估方法",
    description: "选择平台已有评估方法的阈值配置；本期不上传自定义评分代码。",
    scenarios: ["业务指标", "阈值判定", "训练后评估"],
    guide: ["下载本模板。", "设置 0～1 范围内的判定阈值。", "通过调试后，可在训练任务中引用。"],
    parameters: [
      { key: "threshold", label: "判定阈值", valueType: "float", defaultValue: "0.8", helper: "允许 0～1，步长 0.01。", type: "number", min: 0, max: 1, step: 0.01, mappingPath: "training.evaluation.threshold" },
    ],
  },
];

const VALIDATION_KEYS: ConfigValidationKey[] = ["syntax", "compatibility", "parameters", "security", "mapping"];
const CATEGORY_ICONS: Record<ConfigValidationKey, ReactNode> = {
  syntax: <FileCheck2 size={13} />,
  compatibility: <Puzzle size={13} />,
  parameters: <SlidersHorizontal size={13} />,
  security: <ShieldCheck size={13} />,
  mapping: <Code2 size={13} />,
};
const STATE_TEXT: Record<ConfigValidationState, string> = { passed: "通过", failed: "未通过", running: "调试中", pending: "待调试" };

function initParams(templateId: string) {
  const template = TEMPLATES.find(item => item.id === templateId);
  return Object.fromEntries((template?.parameters ?? []).map(parameter => [
    parameter.key,
    parameter.valueType === "string" ? parameter.defaultValue : Number(parameter.defaultValue),
  ]));
}

function presetResult(failedKey?: ConfigValidationKey, finding?: ConfigFinding): ExtensionConfigReport {
  const categories = emptyConfigValidation().map(category => {
    const failedDirectly = category.key === failedKey;
    const failedByDependency = category.key === "mapping" && (failedKey === "parameters" || failedKey === "compatibility");
    const findings = failedDirectly && finding
      ? [finding]
      : failedByDependency
        ? [{ ruleId: "MAP-003", severity: "error" as const, message: "兼容性或参数检查未通过，无法生成训练请求预览", guidance: "先修复前序阻断项。" }]
        : [];
    return {
      ...category,
      state: failedDirectly || failedByDependency ? "failed" as const : "passed" as const,
      checks: category.key === "parameters" ? 7 : category.key === "mapping" ? 4 : 5,
      durationMs: 12,
      summary: findings.length ? `${findings.length} 个阻断项` : "全部通过",
      findings,
    };
  });
  const errorCount = categories.flatMap(category => category.findings).length;
  return {
    passed: !failedKey,
    categories,
    errorCount,
    warningCount: 0,
    totalDurationMs: 68,
    normalizedParameters: {},
    mappingPreview: null,
    logs: [`[00:00:00] 历史版本校验记录`, `[00:00:01] ${failedKey ? "FAIL 存在 1 个阻断项" : "PASS 五类检查全部通过"}`],
  };
}

const PASSED_REPORT = presetResult();
const SECRET_FINDING: ConfigFinding = { ruleId: "SEC-006", severity: "error", message: "检测到疑似密钥、令牌或凭证", path: "yaml", guidance: "删除敏感信息后重新上传并调试。" };
const PARAM_FINDING: ConfigFinding = { ruleId: "PAR-005", severity: "error", message: "threshold=1.2 超出范围 0～1", path: "parameters.threshold", guidance: "将参数调整到模板声明的闭区间内。" };

function templateSource(templateId: string, name: string) {
  const template = TEMPLATES.find(item => item.id === templateId)!;
  return buildTemplateYaml(template, name);
}

const INITIAL_EXTENSIONS: ExtensionVersion[] = [
  { id: "e1v3", templateId: "a1", name: "LoRA+ 训练器", type: "微调算法", version: "v1.2.0", fileName: "lora-plus.yaml", fileSize: 356, uploadedAt: "2026-08-04 10:24", debuggedAt: "2026-08-04 10:26", validations: PASSED_REPORT.categories, report: PASSED_REPORT, yamlSource: templateSource("a1", "LoRA+ 训练器"), parameters: initParams("a1"), enabled: true },
  { id: "e1v2", templateId: "a1", name: "LoRA+ 训练器", type: "微调算法", version: "v1.1.0", fileName: "lora-plus.yaml", fileSize: 352, uploadedAt: "2026-07-20 15:30", debuggedAt: "2026-07-20 15:33", validations: PASSED_REPORT.categories, report: PASSED_REPORT, yamlSource: templateSource("a1", "LoRA+ 训练器"), parameters: initParams("a1"), enabled: false },
  { id: "e1v1", templateId: "a1", name: "LoRA+ 训练器", type: "微调算法", version: "v1.0.0", fileName: "lora-plus.yaml", fileSize: 418, uploadedAt: "2026-07-15 09:12", debuggedAt: "2026-07-15 09:13", validations: presetResult("security", SECRET_FINDING).categories, report: presetResult("security", SECRET_FINDING), yamlSource: `${templateSource("a1", "LoRA+ 训练器")}private_key: "-----BEGIN PRIVATE KEY-----"\n`, parameters: initParams("a1"), enabled: false },
  { id: "e2v2", templateId: "a3", name: "医疗对话清洗器", type: "数据处理", version: "v0.8.0", fileName: "medical-dialogue.yaml", fileSize: 402, uploadedAt: "2026-08-04 11:08", validations: emptyConfigValidation(), report: null, yamlSource: templateSource("a3", "医疗对话清洗器"), parameters: initParams("a3"), enabled: false },
  { id: "e2v1", templateId: "a3", name: "医疗对话清洗器", type: "数据处理", version: "v0.5.0", fileName: "medical-dialogue.yaml", fileSize: 398, uploadedAt: "2026-07-28 17:44", debuggedAt: "2026-07-28 17:45", validations: PASSED_REPORT.categories, report: PASSED_REPORT, yamlSource: templateSource("a3", "医疗对话清洗器"), parameters: initParams("a3"), enabled: false },
  { id: "e3", templateId: "a4", name: "事实性评分", type: "评估方法", version: "v0.5.2", fileName: "factuality.yaml", fileSize: 344, uploadedAt: "2026-08-03 17:36", debuggedAt: "2026-08-03 17:38", validations: presetResult("parameters", PARAM_FINDING).categories, report: presetResult("parameters", PARAM_FINDING), yamlSource: templateSource("a4", "事实性评分").replace("threshold: 0.8", "threshold: 1.2"), parameters: { threshold: "1.2" }, enabled: false },
  { id: "e4", templateId: "a2", name: "自适应优化器", type: "优化器", version: "v1.0.1", fileName: "adaptive-optimizer.yaml", fileSize: 468, uploadedAt: "2026-08-05 14:12", debuggedAt: "2026-08-05 14:14", validations: PASSED_REPORT.categories, report: PASSED_REPORT, yamlSource: templateSource("a2", "自适应优化器"), parameters: initParams("a2"), enabled: true },
];

function getState(validations: ConfigCategoryResult[]): "passed" | "failed" | "validating" | "pending" {
  if (validations.some(item => item.state === "running")) return "validating";
  if (validations.some(item => item.state === "failed")) return "failed";
  if (validations.every(item => item.state === "passed")) return "passed";
  return "pending";
}

function VIcon({ state }: { state: ConfigValidationState }) {
  if (state === "passed") return <CheckCircle2 size={15} color={C.green} />;
  if (state === "failed") return <XCircle size={15} color={C.red} />;
  if (state === "running") return <Clock3 size={15} color={C.amber} />;
  return <Circle size={15} color={C.faint} />;
}

function Notice({ tone, children }: { tone: NoticeTone; children: ReactNode }) {
  const config = {
    success: { color: C.green, background: C.greenSoft, icon: <CheckCircle2 size={14} /> },
    info: { color: C.primary, background: C.primarySoft, icon: <Info size={14} /> },
    error: { color: C.red, background: C.redSoft, icon: <XCircle size={14} /> },
  }[tone];
  return <div role="status" style={{ padding: "9px 11px", display: "flex", alignItems: "flex-start", gap: 7, borderRadius: 7, color: config.color, background: config.background, fontSize: 11.5, lineHeight: 1.55 }}><span style={{ flex: "0 0 auto", marginTop: 1 }}>{config.icon}</span><span>{children}</span></div>;
}

function groupByName(exts: ExtensionVersion[]) {
  const map = new Map<string, ExtensionVersion[]>();
  for (const extension of exts) {
    const key = `${extension.name}::${extension.type}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(extension);
  }
  return Array.from(map.entries()).map(([key, versions]) => {
    versions.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return { key, name: versions[0].name, type: versions[0].type, templateId: versions[0].templateId, versions };
  });
}

function nextVersion(current?: string) {
  if (!current) return "v1.0.0";
  const match = current.match(/^v(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return "v1.0.0";
  return `v${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

function nowText() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function fileSizeText(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

async function sha256Hex(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("");
}

export function UnifiedExtensionManagement({ onEnable }: UnifiedExtensionManagementProps) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [exts, setExts] = useState(INITIAL_EXTENSIONS);
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
  const [configOpen, setConfigOpen] = useState<string | null>(null);
  const [uploadTemplateId, setUploadTemplateId] = useState<string | null>(null);
  const [uploadGroupKey, setUploadGroupKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [debugExtId, setDebugExtId] = useState<string | null>(null);
  const [reportExtId, setReportExtId] = useState<string | null>(null);
  const [debugRunning, setDebugRunning] = useState(false);
  const [testExtId, setTestExtId] = useState<string | null>(null);
  const [testReports, setTestReports] = useState<Record<string, ExtensionTestReport>>(() => ({
    e1v3: buildPassedExtensionTestReport("e1v3", "2026-08-04 10:29:18"),
    e4: buildPassedExtensionTestReport("e4", "2026-08-05 14:18:36"),
  }));

  const groups = useMemo(() => groupByName(exts), [exts]);
  const debugExt = exts.find(item => item.id === debugExtId) ?? null;
  const reportExt = exts.find(item => item.id === reportExtId) ?? null;
  const testExt = exts.find(item => item.id === testExtId) ?? null;
  const openTemplate = TEMPLATES.find(item => item.id === configOpen) ?? null;

  const toggleExpand = (key: string) => setExpanded(previous => {
    const next = new Set(previous);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const requestUpload = (templateId: string | null, groupKey: string | null = null) => {
    setUploadTemplateId(templateId);
    setUploadGroupKey(groupKey);
    uploadRef.current?.click();
  };

  const downloadTemplate = (template: ExtensionTemplate) => {
    const content = buildTemplateYaml(template, template.name);
    const url = URL.createObjectURL(new Blob([content], { type: "application/yaml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${template.configId}.yaml`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setUploadTemplateId(null);
      setUploadGroupKey(null);
      return;
    }
    try {
      if (!/\.ya?ml$/i.test(file.name)) {
        setNotice({ tone: "error", text: "仅支持单个 .yaml 或 .yml 参数配置文件。" });
        return;
      }
      if (file.size <= 0 || file.size > MAX_YAML_BYTES) {
        setNotice({ tone: "error", text: `YAML 文件大小必须为 1 B～${MAX_YAML_BYTES / 1024} KB。` });
        return;
      }
      const buffer = await file.arrayBuffer();
      let source = "";
      try {
        source = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch {
        setNotice({ tone: "error", text: "文件不是有效 UTF-8 文本，请重新保存后上传。" });
        return;
      }
      const identity = extractTemplateId(source);
      const template = TEMPLATES.find(item => item.id === uploadTemplateId)
        ?? TEMPLATES.find(item => item.configId === identity);
      if (!template) {
        setNotice({ tone: "error", text: "无法识别 template_id，请从对应模板卡片下载并上传 YAML。" });
        return;
      }

      const group = uploadGroupKey ? groups.find(item => item.key === uploadGroupKey) : null;
      const name = group?.name ?? extractExtensionName(source) ?? file.name.replace(/\.ya?ml$/i, "");
      const version = nextVersion(group?.versions[0]?.version);
      const uploadedAt = nowText();
      const hash = await sha256Hex(buffer);
      const extension: ExtensionVersion = {
        id: `ext-${Date.now()}`,
        templateId: template.id,
        name,
        type: template.type,
        version,
        fileName: file.name,
        fileSize: file.size,
        fileHash: hash,
        uploadedAt,
        validations: emptyConfigValidation(),
        report: null,
        yamlSource: source,
        parameters: {},
        enabled: false,
      };
      setExts(current => [extension, ...current]);
      setNotice({ tone: "info", text: `「${name}」${version} 已上传，当前为“待调试”；系统尚未执行校验，也未占用 GPU。` });
    } finally {
      event.target.value = "";
      setUploadTemplateId(null);
      setUploadGroupKey(null);
    }
  };

  const runDebug = async (extensionId: string) => {
    const extension = exts.find(item => item.id === extensionId);
    const template = extension ? TEMPLATES.find(item => item.id === extension.templateId) : null;
    if (!extension || !template || debugRunning) return;
    setDebugRunning(true);
    setExts(current => current.map(item => item.id === extensionId ? {
      ...item,
      validations: item.validations.map(category => ({ ...category, state: "running", summary: "正在校验" })),
    } : item));
    await new Promise(resolve => setTimeout(resolve, 650));
    const report = validateExtensionConfig({
      source: extension.yamlSource,
      fileName: extension.fileName,
      fileSize: extension.fileSize,
      expectedTemplate: template,
    });
    const debuggedAt = nowText();
    setExts(current => current.map(item => item.id === extensionId ? {
      ...item,
      validations: report.categories,
      report,
      debuggedAt,
      parameters: report.passed ? report.normalizedParameters : item.parameters,
      enabled: report.passed ? item.enabled : false,
    } : item));
    setNotice(report.passed
      ? { tone: "success", text: `「${extension.name}」${extension.version} 调试通过，已生成版本级报告，可以启用。` }
      : { tone: "error", text: `「${extension.name}」${extension.version} 存在 ${report.errorCount} 个阻断项，已禁止启用。` });
    setDebugRunning(false);
  };

  const enable = (extensionId: string) => {
    const target = exts.find(item => item.id === extensionId);
    if (!target || getState(target.validations) !== "passed" || testReports[extensionId]?.status !== "passed") return;
    setExts(current => current.map(item => {
      if (item.id === target.id) return { ...item, enabled: true };
      if (item.name === target.name && item.type === target.type && item.enabled) return { ...item, enabled: false };
      return item;
    }));
    setNotice({ tone: "success", text: `${target.name} ${target.version} 已启用；同名旧版本已自动停用。` });
    onEnable?.({ id: target.id, name: target.name, type: target.type, version: target.version, parameters: target.parameters });
  };

  const downloadReport = (extension: ExtensionVersion) => {
    if (!extension.report) return;
    const lines = [
      "# 框架扩展配置校验报告",
      `扩展: ${extension.name} ${extension.version} (${extension.type})`,
      `文件: ${extension.fileName} · ${fileSizeText(extension.fileSize)}`,
      `SHA-256: ${extension.fileHash ?? "历史记录未保存"}`,
      `规则集: ${EXTENSION_RULE_SET_VERSION}`,
      `调试时间: ${extension.debuggedAt ?? "—"}`,
      `结论: ${extension.report.passed ? "通过，可启用" : "未通过，禁止启用"}`,
      "",
    ];
    for (const category of extension.report.categories) {
      lines.push(`## ${CATEGORY_LABELS[category.key].name} — ${STATE_TEXT[category.state]}`);
      lines.push(`检查数: ${category.checks} · 耗时: ${category.durationMs} ms · ${category.summary}`);
      for (const finding of category.findings) {
        lines.push(`- [${finding.severity.toUpperCase()}] ${finding.ruleId} ${finding.path ? `${finding.path} ` : ""}${finding.message}`);
        lines.push(`  修复: ${finding.guidance}`);
      }
      lines.push("");
    }
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${extension.name}-${extension.version}-validation-report.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: "100%", height: "100%", overflowY: "auto", color: C.ink, background: "#f5f7fa" }}>
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "20px 24px 36px" }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, color: C.primary, background: C.primarySoft }}><Puzzle size={17} /></span>
          <div style={{ flex: "1 1 260px" }}><h1 style={{ margin: 0, fontSize: 19, fontWeight: 720 }}>扩展管理</h1><p style={{ margin: "3px 0 0", color: C.muted, fontSize: 11.5 }}>下载 YAML 参数模板、上传版本、完成调试与自动化测试后启用</p></div>
          <button onClick={() => requestUpload(null)} style={{ height: 34, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 6, background: C.primary, color: "#fff", fontSize: 12, fontWeight: 650, cursor: "pointer" }}><Upload size={14} />上传 YAML 配置</button>
          <input ref={uploadRef} type="file" accept=".yaml,.yml,application/yaml,text/yaml" onChange={upload} style={{ display: "none" }} />
        </div>

        <div style={{ marginBottom: 12 }}><Notice tone="info">调试与测试是两个独立弹窗：“调试沙箱”保留 YAML 配置校验；“测试”弹窗提供单元、集成、性能测试工具与内置用例，并展示测试结果和性能指标报告。</Notice></div>
        {notice && <div style={{ marginBottom: 12 }}><Notice tone={notice.tone}>{notice.text}</Notice></div>}

        <section style={{ ...surface, marginBottom: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.lineSoft}` }}><Package size={15} color={C.primary} style={{ marginRight: 8, verticalAlign: -2 }} /><span style={{ fontSize: 13, fontWeight: 700 }}>YAML 参数模板</span><span style={{ marginLeft: 10, color: C.faint, fontSize: 10.5 }}>每个模板一个文件，下载修改后再上传</span></div>
          <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
            {TEMPLATES.map(template => {
              const colors: Record<ExtensionType, string> = { "微调算法": "#4f46e5", "优化器": "#0369a1", "数据处理": "#047857", "评估方法": "#a15c07" };
              return (
                <div key={template.id} style={{ padding: "12px 14px", border: `1px solid ${C.lineSoft}`, borderRadius: 8, background: "#fbfcfe" }}>
                  <span style={{ padding: "1px 6px", borderRadius: 4, background: `${colors[template.type]}15`, color: colors[template.type], fontSize: 9.5, fontWeight: 650 }}>{template.type}</span>
                  <b style={{ display: "block", marginTop: 6, color: C.ink, fontSize: 12.5 }}>{template.name}</b>
                  <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 11, lineHeight: 1.55 }}>{template.description}</p>
                  <p style={{ margin: "5px 0 0", color: C.text, fontSize: 10.5, lineHeight: 1.55 }}><b style={{ color: C.ink, fontSize: 10 }}>使用场景</b> {template.scenarios.join(" · ")}</p>
                  <div style={{ marginTop: 10, display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <button onClick={() => setConfigOpen(template.id)} style={{ height: 28, padding: "0 9px", display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.primary, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}><FileText size={11} />配置说明</button>
                    <button onClick={() => downloadTemplate(template)} style={{ height: 28, padding: "0 9px", display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.muted, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}><Download size={11} />下载 YAML</button>
                    <button onClick={() => requestUpload(template.id)} style={{ height: 28, padding: "0 9px", display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.green, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}><Upload size={11} />上传 YAML</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {groups.length > 0 && (
          <section style={{ ...surface, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><SlidersHorizontal size={15} color={C.primary} /><span style={{ fontSize: 13, fontWeight: 700 }}>扩展版本、调试与测试</span><span style={{ color: C.faint, fontSize: 10.5 }}>调试校验和自动化测试均通过后才能启用</span></div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 990, borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ color: C.muted, background: "#fbfcfe", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <th style={{ padding: "9px 12px", width: 28 }}></th>
                  <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600 }}>扩展</th>
                  {VALIDATION_KEYS.map(key => <th key={key} style={{ padding: "9px 10px", textAlign: "left", fontWeight: 600 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{CATEGORY_ICONS[key]}<span>{CATEGORY_LABELS[key].short}</span></span></th>)}
                  <th style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600, minWidth: 310 }}>操作</th>
                </tr></thead>
                <tbody>
                  {groups.map(group => {
                    const latest = group.versions[0];
                    const state = getState(latest.validations);
                    const latestTestReport = testReports[latest.id];
                    const latestTestState = latestTestReport?.status ?? "pending";
                    const isExpanded = expanded.has(group.key);
                    const enabledVersion = group.versions.find(version => version.enabled);
                    return (
                      <Fragment key={group.key}>
                        <tr style={{ background: "#fff", borderBottom: `1px solid ${C.lineSoft}` }}>
                          <td style={{ padding: "9px 12px" }}><button onClick={() => toggleExpand(group.key)} style={{ width: 22, height: 22, display: "grid", placeItems: "center", border: 0, borderRadius: 4, background: "transparent", color: C.muted, cursor: "pointer" }}>{group.versions.length > 1 ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{ width: 14 }} />}</button></td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><b style={{ color: C.ink, fontSize: 11.5 }}>{group.name}</b>{enabledVersion && <span style={{ padding: "1px 5px", borderRadius: 4, background: C.greenSoft, color: C.green, fontSize: 9, fontWeight: 650 }}>当前 {enabledVersion.version}</span>}{group.versions.length > 1 && <span style={{ color: C.faint, fontSize: 9.5 }}>{group.versions.length} 版本</span>}</div>
                            <span style={{ display: "block", color: C.faint, fontSize: 9.5 }}>{group.type} · 最新 {latest.version} · {latest.fileName}</span>
                          </td>
                          {VALIDATION_KEYS.map(key => <td key={key} style={{ padding: "10px" }}><VIcon state={latest.validations.find(item => item.key === key)?.state ?? "pending"} /></td>)}
                          <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
                              {latest.enabled ? <span style={{ padding: "2px 7px", borderRadius: 5, color: C.green, background: C.greenSoft, fontSize: 10, fontWeight: 650 }}>已启用</span> : state === "passed" && latestTestState === "passed" ? <button onClick={() => enable(latest.id)} style={{ height: 26, padding: "0 8px", border: `1px solid ${C.green}`, borderRadius: 5, background: C.greenSoft, color: C.green, fontSize: 10.5, fontWeight: 650, cursor: "pointer" }}>启用</button> : <span style={{ color: state === "failed" || latestTestState === "failed" ? C.red : state === "validating" || latestTestState === "running" ? C.amber : C.muted, fontSize: 10.5, fontWeight: 600 }}>{state === "failed" ? "调试未通过" : state === "validating" ? "调试中" : state === "pending" ? "待调试" : latestTestState === "failed" ? "测试未通过" : latestTestState === "running" ? "测试中" : "待测试"}</span>}
                              <button disabled={state === "validating"} onClick={() => { setDebugExtId(latest.id); if (state === "pending") setNotice(null); }} style={{ height: 26, padding: "0 8px", display: "inline-flex", alignItems: "center", gap: 3, border: `1px solid ${state === "pending" ? C.amber : C.line}`, borderRadius: 5, background: state === "pending" ? C.amberSoft : "#fff", color: C.amber, fontSize: 10, fontWeight: 600, cursor: state === "validating" ? "not-allowed" : "pointer", opacity: state === "validating" ? 0.55 : 1 }}><Bug size={11} />{state === "pending" ? "开始调试" : "重新调试"}</button>
                              <button onClick={() => setTestExtId(latest.id)} style={{ height: 26, padding: "0 8px", display: "inline-flex", alignItems: "center", gap: 3, border: `1px solid ${latestTestState === "passed" ? "#b7e4c7" : C.line}`, borderRadius: 5, background: latestTestState === "passed" ? C.greenSoft : "#fff", color: latestTestState === "passed" ? C.green : C.primary, fontSize: 10, fontWeight: 600, cursor: "pointer" }}><TestTube2 size={11} />测试</button>
                              {latest.report && <button onClick={() => setReportExtId(latest.id)} style={{ height: 26, padding: "0 8px", display: "inline-flex", alignItems: "center", gap: 3, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.primary, fontSize: 10, fontWeight: 600, cursor: "pointer" }}><FileText size={11} />报告</button>}
                              <button onClick={() => requestUpload(group.templateId, group.key)} style={{ height: 26, padding: "0 8px", display: "inline-flex", alignItems: "center", gap: 3, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.primary, fontSize: 10, fontWeight: 600, cursor: "pointer" }}><GitBranch size={11} />新版本</button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && group.versions.slice(1).map(version => {
                          const versionState = getState(version.validations);
                          const versionTestReport = testReports[version.id];
                          const versionTestState = versionTestReport?.status ?? "pending";
                          return <tr key={version.id} style={{ background: "#fafbfd", borderBottom: `1px solid ${C.lineSoft}` }}>
                            <td style={{ padding: "8px 12px", color: C.faint }}>└</td>
                            <td style={{ padding: "8px 12px" }}><span style={{ color: C.ink, fontSize: 11 }}>{version.version}</span><span style={{ display: "block", color: C.faint, fontSize: 9.5 }}>{version.uploadedAt} · {version.fileName}</span></td>
                            {VALIDATION_KEYS.map(key => <td key={key} style={{ padding: "8px 10px" }}><VIcon state={version.validations.find(item => item.key === key)?.state ?? "pending"} /></td>)}
                            <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}><div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                              {version.enabled && <span style={{ padding: "2px 7px", borderRadius: 5, color: C.green, background: C.greenSoft, fontSize: 9.5, fontWeight: 650 }}>已启用</span>}
                              {!version.enabled && versionState === "passed" && versionTestState === "passed" && <button onClick={() => enable(version.id)} style={{ height: 24, padding: "0 7px", border: `1px solid ${C.green}`, borderRadius: 5, background: "#fff", color: C.green, fontSize: 10, cursor: "pointer" }}>启用</button>}
                              <button onClick={() => setDebugExtId(version.id)} style={{ height: 24, padding: "0 7px", border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.amber, fontSize: 10, cursor: "pointer" }}>{versionState === "pending" ? "开始调试" : "重新调试"}</button>
                              <button onClick={() => setTestExtId(version.id)} style={{ height: 24, padding: "0 7px", display: "inline-flex", alignItems: "center", gap: 3, border: `1px solid ${versionTestState === "passed" ? "#b7e4c7" : C.line}`, borderRadius: 5, background: versionTestState === "passed" ? C.greenSoft : "#fff", color: versionTestState === "passed" ? C.green : C.primary, fontSize: 10, cursor: "pointer" }}><TestTube2 size={10} />测试</button>
                              {version.report && <button onClick={() => setReportExtId(version.id)} style={{ height: 24, padding: "0 7px", border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.primary, fontSize: 10, cursor: "pointer" }}>报告</button>}
                            </div></td>
                          </tr>;
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {openTemplate && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,.45)", padding: 16 }} onClick={() => setConfigOpen(null)}>
          <div style={{ width: "min(700px,100%)", maxHeight: "84vh", overflow: "auto", background: "#fff", borderRadius: 10, boxShadow: "0 24px 64px rgba(17,24,39,.25)", padding: 18 }} onClick={event => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><b style={{ fontSize: 14 }}>{openTemplate.name} · YAML 配置说明</b><span style={{ display: "block", marginTop: 3, color: C.muted, fontSize: 11 }}>模板版本 {openTemplate.configVersion} · 仅允许修改名称和参数值</span></div><button onClick={() => setConfigOpen(null)} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: 0, borderRadius: 6, background: C.panel, color: C.muted, cursor: "pointer" }}><X size={15} /></button></div>
            <ol style={{ margin: "12px 0", paddingLeft: 18, color: C.muted, fontSize: 10.5, lineHeight: 1.75 }}>{openTemplate.guide.map((step, index) => <li key={index}>{step}</li>)}</ol>
            <pre style={{ margin: 0, padding: "12px 14px", borderRadius: 7, background: "#1a1d23", color: "#c9d1d9", fontSize: 10.5, lineHeight: 1.65, overflowX: "auto" }}><code>{buildTemplateYaml(openTemplate, openTemplate.name)}</code></pre>
            <div style={{ marginTop: 12, overflowX: "auto" }}><table style={{ width: "100%", minWidth: 600, borderCollapse: "collapse", fontSize: 10.5 }}><thead><tr style={{ color: C.muted, borderBottom: `1px solid ${C.lineSoft}` }}><th style={{ padding: "6px 8px", textAlign: "left" }}>参数</th><th style={{ padding: "6px 8px", textAlign: "left" }}>类型</th><th style={{ padding: "6px 8px", textAlign: "left" }}>默认值</th><th style={{ padding: "6px 8px", textAlign: "left" }}>约束</th><th style={{ padding: "6px 8px", textAlign: "left" }}>训练字段</th></tr></thead><tbody>{openTemplate.parameters.map(parameter => <tr key={parameter.key} style={{ borderBottom: `1px solid ${C.lineSoft}` }}><td style={{ padding: "7px 8px", fontFamily: "monospace" }}>{parameter.key}</td><td style={{ padding: "7px 8px", color: C.muted }}>{parameter.valueType}</td><td style={{ padding: "7px 8px", color: C.muted }}>{parameter.defaultValue}</td><td style={{ padding: "7px 8px", color: C.muted }}>{parameter.helper}</td><td style={{ padding: "7px 8px", color: C.muted, fontFamily: "monospace" }}>{parameter.mappingPath}</td></tr>)}</tbody></table></div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}><button onClick={() => downloadTemplate(openTemplate)} style={{ height: 31, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 5, border: 0, borderRadius: 6, background: C.primary, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}><Download size={12} />下载 YAML</button></div>
          </div>
        </div>
      )}

      {debugExt && (() => {
        const state = getState(debugExt.validations);
        const logs = debugExt.report?.logs ?? ["[00:00:00] 尚未开始调试", "[00:00:01] 点击“开始调试”后，系统调用配置校验接口并输出日志。"];
        return <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,.45)", padding: 16 }} onClick={() => !debugRunning && setDebugExtId(null)}>
          <div style={{ width: "min(760px,100%)", maxHeight: "86vh", overflow: "auto", background: "#fff", borderRadius: 10, boxShadow: "0 24px 64px rgba(17,24,39,.25)", padding: 18 }} onClick={event => event.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}><div><b style={{ fontSize: 14 }}>调试沙箱 — {debugExt.name} {debugExt.version}</b><span style={{ display: "block", marginTop: 3, color: C.muted, fontSize: 11 }}>{debugExt.fileName} · {fileSizeText(debugExt.fileSize)} · 规则集 {EXTENSION_RULE_SET_VERSION}</span></div><button disabled={debugRunning} onClick={() => setDebugExtId(null)} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: 0, borderRadius: 6, background: C.panel, color: C.muted, cursor: debugRunning ? "not-allowed" : "pointer", opacity: debugRunning ? 0.5 : 1 }}><X size={15} /></button></div>
            <div style={{ marginTop: 12 }}><Notice tone="info">当前调试只校验 YAML 配置并生成版本级报告；生产环境由后端接口执行同一规则集，不创建训练任务、不加载样本、不使用 GPU。</Notice></div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(118px,1fr))", gap: 7 }}>{debugExt.validations.map(category => <div key={category.key} style={{ padding: "9px 10px", border: `1px solid ${category.state === "failed" ? "#fecaca" : category.state === "passed" ? "#c9efda" : C.lineSoft}`, borderRadius: 7, background: category.state === "failed" ? C.redSoft : category.state === "passed" ? C.greenSoft : "#fbfcfe" }}><span style={{ display: "flex", alignItems: "center", gap: 5, color: C.muted, fontSize: 10 }}><VIcon state={category.state} />{CATEGORY_LABELS[category.key].short}</span><b style={{ display: "block", marginTop: 4, color: category.state === "failed" ? C.red : category.state === "passed" ? C.green : C.text, fontSize: 10.5 }}>{category.state === "running" ? "正在校验" : category.summary}</b></div>)}</div>
            <div style={{ marginTop: 12, border: `1px solid ${C.line}`, borderRadius: 7, overflow: "hidden" }}><div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.lineSoft}`, background: C.panel, display: "flex", alignItems: "center", gap: 6 }}><Terminal size={13} color={C.muted} /><span style={{ color: C.muted, fontSize: 10.5, fontWeight: 600 }}>校验日志</span></div><pre style={{ margin: 0, padding: "12px 14px", background: "#1a1d23", color: state === "failed" ? "#fca5a5" : "#a5d6a5", fontSize: 10, lineHeight: 1.7, fontFamily: "'SF Mono','Fira Code',monospace", maxHeight: 260, overflow: "auto" }}><code>{debugRunning ? "[00:00:00] 正在调用配置校验接口…\n[00:00:01] 正在执行五类规则，请稍候。" : logs.join("\n")}</code></pre></div>
            <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}><button disabled={debugRunning} onClick={() => setDebugExtId(null)} style={{ height: 31, padding: "0 14px", border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", color: C.muted, fontSize: 11.5, fontWeight: 600, cursor: debugRunning ? "not-allowed" : "pointer" }}>关闭</button>{debugExt.report && <button disabled={debugRunning} onClick={() => { setDebugExtId(null); setReportExtId(debugExt.id); }} style={{ height: 31, padding: "0 14px", border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", color: C.primary, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}><FileText size={12} style={{ marginRight: 5, verticalAlign: -2 }} />查看报告</button>}<button disabled={debugRunning} onClick={() => runDebug(debugExt.id)} style={{ height: 31, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 5, border: 0, borderRadius: 6, background: C.primary, color: "#fff", fontSize: 11.5, fontWeight: 650, cursor: debugRunning ? "not-allowed" : "pointer", opacity: debugRunning ? 0.65 : 1 }}>{debugExt.report ? <RotateCcw size={12} /> : <Play size={12} />}{debugRunning ? "调试中…" : debugExt.report ? "重新调试" : "开始调试"}</button></div>
          </div>
        </div>;
      })()}

      {reportExt?.report && (() => {
        const report = reportExt.report;
        const findings = report.categories.flatMap(category => category.findings);
        return <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,.45)", padding: 16 }} onClick={() => setReportExtId(null)}>
          <div style={{ width: "min(820px,100%)", maxHeight: "88vh", overflow: "auto", background: "#fff", borderRadius: 10, boxShadow: "0 24px 64px rgba(17,24,39,.25)", padding: 18 }} onClick={event => event.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}><div><b style={{ fontSize: 14 }}>配置校验报告 — {reportExt.name} {reportExt.version}</b><span style={{ display: "block", marginTop: 3, color: C.muted, fontSize: 11 }}>{reportExt.fileName} · SHA-256 {reportExt.fileHash ? `${reportExt.fileHash.slice(0, 12)}…` : "历史记录未保存"} · {reportExt.debuggedAt ?? "—"}</span></div><button onClick={() => setReportExtId(null)} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: 0, borderRadius: 6, background: C.panel, color: C.muted, cursor: "pointer" }}><X size={15} /></button></div>
            <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}><span style={{ padding: "3px 7px", borderRadius: 5, background: report.passed ? C.greenSoft : C.redSoft, color: report.passed ? C.green : C.red, fontSize: 10, fontWeight: 700 }}>{report.passed ? "通过，可启用" : "未通过，禁止启用"}</span><span style={{ padding: "3px 7px", borderRadius: 5, background: C.panel, color: C.muted, fontSize: 10 }}>阻断项 {report.errorCount}</span><span style={{ padding: "3px 7px", borderRadius: 5, background: C.panel, color: C.muted, fontSize: 10 }}>提示 {report.warningCount}</span><span style={{ padding: "3px 7px", borderRadius: 5, background: C.panel, color: C.muted, fontSize: 10 }}>耗时 {report.totalDurationMs} ms</span><span style={{ padding: "3px 7px", borderRadius: 5, background: C.panel, color: C.muted, fontSize: 10 }}>规则集 {EXTENSION_RULE_SET_VERSION}</span></div>
            <div style={{ marginTop: 12, overflowX: "auto" }}><table style={{ width: "100%", minWidth: 700, borderCollapse: "collapse", fontSize: 10.5 }}><thead><tr style={{ color: C.muted, background: "#fbfcfe", borderBottom: `1px solid ${C.lineSoft}` }}><th style={{ padding: "7px 8px", textAlign: "left" }}>检查类别</th><th style={{ padding: "7px 8px", textAlign: "left" }}>状态</th><th style={{ padding: "7px 8px", textAlign: "left" }}>检查数</th><th style={{ padding: "7px 8px", textAlign: "left" }}>耗时</th><th style={{ padding: "7px 8px", textAlign: "left" }}>结果</th></tr></thead><tbody>{report.categories.map(category => <tr key={category.key} style={{ borderBottom: `1px solid ${C.lineSoft}` }}><td style={{ padding: "8px", fontWeight: 600 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{CATEGORY_ICONS[category.key]}{CATEGORY_LABELS[category.key].name}</span></td><td style={{ padding: "8px", color: category.state === "passed" ? C.green : C.red, fontWeight: 650 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><VIcon state={category.state} />{STATE_TEXT[category.state]}</span></td><td style={{ padding: "8px", color: C.muted }}>{category.checks}</td><td style={{ padding: "8px", color: C.muted }}>{category.durationMs} ms</td><td style={{ padding: "8px", color: C.text }}>{category.summary}</td></tr>)}</tbody></table></div>
            <div style={{ marginTop: 14 }}><h3 style={{ margin: "0 0 7px", fontSize: 11.5 }}>阻断项与提示</h3>{findings.length ? <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>{findings.map((finding, index) => <div key={`${finding.ruleId}-${index}`} style={{ padding: "9px 11px", display: "flex", gap: 8, border: `1px solid ${finding.severity === "error" ? "#fecaca" : "#fde68a"}`, borderRadius: 7, background: finding.severity === "error" ? C.redSoft : C.amberSoft }}><span style={{ color: finding.severity === "error" ? C.red : C.amber, flex: "0 0 auto" }}>{finding.severity === "error" ? <XCircle size={14} /> : <AlertTriangle size={14} />}</span><div style={{ minWidth: 0 }}><b style={{ color: C.ink, fontSize: 10.5 }}>{finding.ruleId}{finding.path ? ` · ${finding.path}` : ""}</b><span style={{ display: "block", marginTop: 2, color: C.text, fontSize: 10.5 }}>{finding.message}</span><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 10 }}>修复：{finding.guidance}</span></div></div>)}</div> : <Notice tone="success">未发现阻断项或提示；五类检查全部通过。</Notice>}</div>
            <div style={{ marginTop: 14 }}><Notice tone="info">统一判定：任一 ERROR 即整体验证失败并禁止启用；WARNING 不阻断启用但必须进入报告；上传新版本后状态重置为“待调试”。</Notice></div>
            {report.mappingPreview && <details style={{ marginTop: 12 }}><summary style={{ color: C.primary, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}>查看训练参数映射预览</summary><pre style={{ margin: "8px 0 0", padding: "10px 12px", borderRadius: 7, background: "#1a1d23", color: "#c9d1d9", fontSize: 10, overflowX: "auto" }}>{JSON.stringify(report.mappingPreview, null, 2)}</pre></details>}
            <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}><button onClick={() => setReportExtId(null)} style={{ height: 31, padding: "0 14px", border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", color: C.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>关闭</button><button onClick={() => downloadReport(reportExt)} style={{ height: 31, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 5, border: 0, borderRadius: 6, background: C.primary, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}><Download size={12} />下载报告</button></div>
          </div>
        </div>;
      })()}

      {testExt && <ExtensionTestWorkbench
        key={testExt.id}
        extension={{
          id: testExt.id,
          name: testExt.name,
          type: testExt.type,
          version: testExt.version,
          fileName: testExt.fileName,
          debugState: getState(testExt.validations),
        }}
        initialReport={testReports[testExt.id] ?? null}
        onReportChange={testReport => setTestReports(current => ({ ...current, [testExt.id]: testReport }))}
        onBack={() => {
          const testReport = testReports[testExt.id];
          if (testReport?.status === "passed") setNotice({ tone: "success", text: `「${testExt.name}」${testExt.version} 自动化测试通过，已生成测试结果和性能指标报告。` });
          setTestExtId(null);
        }}
      />}
    </div>
  );
}
