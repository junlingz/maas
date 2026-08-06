import { useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { Bug, CheckCircle2, ChevronDown, ChevronRight, Circle, Clock3, Code2, Download, FileText, Gauge, GitBranch, Package, Puzzle, ShieldCheck, SlidersHorizontal, Terminal, TestTube, Upload, X, XCircle } from "lucide-react";

type ExtensionType = "微调算法" | "优化器" | "数据处理" | "评估方法";
type ValidationKey = "compatibility" | "security" | "unit" | "integration" | "performance";
type ValidationState = "passed" | "failed" | "running" | "pending";
type NoticeTone = "success" | "info" | "error";

type ParameterDefinition = { key: string; label: string; defaultValue: string; helper: string; type?: "text" | "number" | "select"; options?: string[]; min?: number; max?: number; step?: number };
type ExtensionTemplate = { id: string; type: ExtensionType; name: string; description: string; scenarios: string[]; guide: string[]; parameters: ParameterDefinition[]; codeExample: string };
type ValidationResult = { key: ValidationKey; state: ValidationState; summary: string };
type ExtensionVersion = { id: string; templateId: string; name: string; type: ExtensionType; version: string; fileName: string; uploadedAt: string; validations: ValidationResult[]; parameters: Record<string, string>; enabled: boolean };
export type EnabledFineTuningExtension = { id: string; name: string; type: ExtensionType; version: string; parameters: Record<string, string> };
export interface UnifiedExtensionManagementProps { onEnable?: (ext: EnabledFineTuningExtension) => void; }

const C = { primary: "#4f6ef7", primarySoft: "#f3f6ff", ink: "#1a1d23", text: "#374151", muted: "#6b7280", faint: "#9ca3af", line: "#e0e3ed", lineSoft: "#eef0f5", panel: "#f8f9fc", green: "#16a34a", greenSoft: "#f0faf5", amber: "#d97706", amberSoft: "#fffbeb", red: "#dc2626", redSoft: "#fef2f2" };
const surface: CSSProperties = { minWidth: 0, border: `1px solid ${C.line}`, borderRadius: 8, background: "#fff" };
const inputStyle: CSSProperties = { width: "100%", height: 34, padding: "0 10px", border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", color: C.ink, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

const TEMPLATES: ExtensionTemplate[] = [
  { id: "a1", type: "微调算法", name: "LoRA 算法扩展", description: "实现参数高效微调算法，冻结原模型参数，注入低秩适配器。", scenarios: ["参数高效微调", "大模型适配", "低资源训练"], guide: ["实现 Extension 入口并保持 train / save 接口签名不变。", "在 manifest.yaml 中声明参数 Schema、框架版本。", "使用模板样例数据在本地跑通后打包上传。"], parameters: [{ key: "rank", label: "LoRA Rank", defaultValue: "16", helper: "适配器秩，建议 8–64。", type: "number", min: 1, max: 256, step: 1 }, { key: "alpha", label: "Alpha", defaultValue: "32", helper: "缩放系数。", type: "number", min: 1, max: 512, step: 1 }], codeExample: "class LoRAExtension:\n    def __init__(self, rank=16, alpha=32):\n        self.rank = rank\n        self.alpha = alpha\n    def train(self, model, dataset):\n        for p in model.parameters():\n            p.requires_grad = False\n        return model.fit(dataset, lora_rank=self.rank)" },
  { id: "a2", type: "优化器", name: "自定义优化器", description: "封装优化器初始化与参数组规则，对接平台学习率调度。", scenarios: ["自定义优化策略", "学习率调度", "梯度裁剪"], guide: ["实现 build_optimizer 入口，返回 PyTorch 优化器对象。", "声明可配置参数、默认值与数值范围。", "使用最小模型完成单步更新后打包上传。"], parameters: [{ key: "beta1", label: "Beta 1", defaultValue: "0.9", helper: "一阶动量。", type: "number", min: 0, max: 0.999, step: 0.001 }, { key: "beta2", label: "Beta 2", defaultValue: "0.99", helper: "二阶动量。", type: "number", min: 0, max: 0.9999, step: 0.0001 }], codeExample: "def build_optimizer(params, beta1=0.9, beta2=0.99):\n    return CustomAdam(params, lr=1e-3, betas=(beta1, beta2))" },
  { id: "a3", type: "数据处理", name: "对话数据处理", description: "逐样本预处理、过滤统计、错误回传，用于训练前数据标准化。", scenarios: ["对话系统", "数据清洗", "格式标准化"], guide: ["实现 process_sample 和 summarize 两个入口。", "输出符合平台 messages Schema。", "使用样例 JSONL 验证后打包上传。"], parameters: [{ key: "maxTurns", label: "最大轮次", defaultValue: "32", helper: "超出截断。", type: "number", min: 1, max: 256, step: 1 }, { key: "deduplicate", label: "去重策略", defaultValue: "精确匹配", helper: "对话样本去重。", type: "select", options: ["关闭", "精确匹配", "归一化匹配"] }], codeExample: "def process_sample(sample):\n    if not sample.get('messages'): return None\n    sample['messages'] = sample['messages'][:32]\n    return sample" },
  { id: "a4", type: "评估方法", name: "领域评估方法", description: "预测解析、样本计分和全局汇总，接入业务自定义评估指标。", scenarios: ["业务指标", "领域评估", "自动打分"], guide: ["实现 score_sample 返回样本级结果。", "实现 aggregate 声明指标名称和优化方向。", "补全样例断言后打包上传。"], parameters: [{ key: "threshold", label: "判定阈值", defaultValue: "0.8", helper: "得分达到阈值计为通过。", type: "number", min: 0, max: 1, step: 0.01 }], codeExample: "def score_sample(prediction, reference):\n    return 1.0 if prediction.strip() == reference.strip() else 0.0" },
];

const VALIDATION_KEYS: ValidationKey[] = ["compatibility", "security", "unit", "integration", "performance"];
const V_META: Record<ValidationKey, { label: string; icon: ReactNode }> = { compatibility: { label: "兼容", icon: <Puzzle size={13} /> }, security: { label: "安全", icon: <ShieldCheck size={13} /> }, unit: { label: "单元", icon: <TestTube size={13} /> }, integration: { label: "集成", icon: <Code2 size={13} /> }, performance: { label: "性能", icon: <Gauge size={13} /> } };

const V_REPORT: Record<ValidationKey, { name: string; cases: string; duration: string; passDetail: string; failDetail: string; guidance: string }> = {
  compatibility: { name: "兼容性检查", cases: "4 项检查", duration: "0.8s", passDetail: "接口签名、框架版本、参数 Schema、依赖声明均与平台匹配", failDetail: "train() 接口签名与模板定义不一致，缺少 dataset 形参", guidance: "保持 train / save 接口签名与模板一致，并在 manifest.yaml 中声明框架版本后重新上传。" },
  security: { name: "安全性检查", cases: "3 项扫描", duration: "5.4s", passDetail: "静态代码扫描、危险调用检测、依赖漏洞扫描均未发现问题", failDetail: "静态扫描发现未声明的系统调用 os.system，命中危险调用规则", guidance: "移除 os.system 等未声明的系统调用与外部网络访问，如确需使用请在 manifest.yaml 的 permissions 中声明后重新提交。" },
  unit: { name: "单元测试", cases: "12/12 用例", duration: "4.6s", passDetail: "模板内置用例全部通过，入口函数返回值与断言一致", failDetail: "3 个用例失败：process_sample 对空 messages 返回异常", guidance: "参照模板 test_template 补齐边界用例处理（空样本应返回 None），修复后重新上传。" },
  integration: { name: "集成测试", cases: "1 轮训练流程", duration: "38s", passDetail: "挂载至最小微调流程完成单步训练与保存，产物校验通过", failDetail: "单步训练中断：优化器参数组与平台调度器不兼容", guidance: "确认扩展在最小训练流程中可完成单步更新，参考模板使用指引调整参数组定义。" },
  performance: { name: "性能测试", cases: "4 项指标", duration: "62s", passDetail: "吞吐 31 条/s · 单步延迟 412ms · 内存峰值 184MB · 无内存泄漏", failDetail: "内存峰值 3.2GB 超出阈值 1GB，存在疑似泄漏", guidance: "检查批处理缓存释放逻辑，控制内存峰值在 1GB 阈值内后重新提交性能测试。" },
};
const PERF_METRICS = [{ label: "吞吐", value: "31 条/s" }, { label: "单步延迟", value: "412 ms" }, { label: "内存峰值", value: "184 MB" }, { label: "CPU 峰值", value: "63%" }];
const V_STATE_TEXT: Record<ValidationState, string> = { passed: "通过", failed: "失败", running: "执行中", pending: "未执行" };
function initParams(templateId: string) { const t = TEMPLATES.find(i => i.id === templateId); return Object.fromEntries((t?.parameters ?? []).map(p => [p.key, p.defaultValue])); }

const INITIAL_EXTENSIONS: ExtensionVersion[] = [
  { id: "e1v3", templateId: "a1", name: "LoRA+ 训练器", type: "微调算法", version: "v1.2.0", fileName: "lora-plus-v1.2.0.zip", uploadedAt: "2026-08-04 10:24", validations: [{ key: "compatibility", state: "passed", summary: "通过" }, { key: "security", state: "passed", summary: "通过" }, { key: "unit", state: "passed", summary: "通过" }, { key: "integration", state: "passed", summary: "通过" }, { key: "performance", state: "passed", summary: "通过" }], parameters: initParams("a1"), enabled: false },
  { id: "e1v2", templateId: "a1", name: "LoRA+ 训练器", type: "微调算法", version: "v1.1.0", fileName: "lora-plus-v1.1.0.zip", uploadedAt: "2026-07-20 15:30", validations: [{ key: "compatibility", state: "passed", summary: "通过" }, { key: "security", state: "passed", summary: "通过" }, { key: "unit", state: "passed", summary: "通过" }, { key: "integration", state: "passed", summary: "通过" }, { key: "performance", state: "passed", summary: "通过" }], parameters: initParams("a1"), enabled: false },
  { id: "e1v1", templateId: "a1", name: "LoRA+ 训练器", type: "微调算法", version: "v1.0.0", fileName: "lora-plus-v1.0.0.zip", uploadedAt: "2026-07-15 09:12", validations: [{ key: "compatibility", state: "passed", summary: "通过" }, { key: "security", state: "failed", summary: "失败" }, { key: "unit", state: "passed", summary: "通过" }, { key: "integration", state: "pending", summary: "跳过" }, { key: "performance", state: "pending", summary: "跳过" }], parameters: initParams("a1"), enabled: false },
  { id: "e2v2", templateId: "a3", name: "医疗对话清洗器", type: "数据处理", version: "v0.8.0", fileName: "dialog-cleaner-v0.8.0.tar.gz", uploadedAt: "2026-08-04 11:08", validations: [{ key: "compatibility", state: "passed", summary: "通过" }, { key: "security", state: "running", summary: "验证中" }, { key: "unit", state: "pending", summary: "等待" }, { key: "integration", state: "pending", summary: "等待" }, { key: "performance", state: "pending", summary: "等待" }], parameters: initParams("a3"), enabled: false },
  { id: "e2v1", templateId: "a3", name: "医疗对话清洗器", type: "数据处理", version: "v0.5.0", fileName: "dialog-cleaner-v0.5.0.tar.gz", uploadedAt: "2026-07-28 17:44", validations: [{ key: "compatibility", state: "passed", summary: "通过" }, { key: "security", state: "passed", summary: "通过" }, { key: "unit", state: "passed", summary: "通过" }, { key: "integration", state: "passed", summary: "通过" }, { key: "performance", state: "passed", summary: "通过" }], parameters: initParams("a3"), enabled: false },
  { id: "e3", templateId: "a4", name: "事实性评分", type: "评估方法", version: "v0.5.2", fileName: "factuality-v0.5.2.zip", uploadedAt: "2026-08-03 17:36", validations: [{ key: "compatibility", state: "passed", summary: "通过" }, { key: "security", state: "failed", summary: "失败" }, { key: "unit", state: "passed", summary: "通过" }, { key: "integration", state: "pending", summary: "跳过" }, { key: "performance", state: "pending", summary: "跳过" }], parameters: initParams("a4"), enabled: false },
  { id: "e4", templateId: "a2", name: "自适应优化器", type: "优化器", version: "v1.0.1", fileName: "adaptive-opt-v1.0.1.tar.gz", uploadedAt: "2026-08-05 14:12", validations: [{ key: "compatibility", state: "passed", summary: "通过" }, { key: "security", state: "passed", summary: "通过" }, { key: "unit", state: "passed", summary: "通过" }, { key: "integration", state: "passed", summary: "通过" }, { key: "performance", state: "passed", summary: "通过" }], parameters: initParams("a2"), enabled: false },
  { id: "e5", templateId: "a3", name: "多语言数据清洗器", type: "数据处理", version: "v2.0.0", fileName: "multilang-cleaner-v2.0.0.zip", uploadedAt: "2026-08-05 16:45", validations: [{ key: "compatibility", state: "passed", summary: "通过" }, { key: "security", state: "passed", summary: "通过" }, { key: "unit", state: "passed", summary: "通过" }, { key: "integration", state: "passed", summary: "通过" }, { key: "performance", state: "passed", summary: "通过" }], parameters: initParams("a3"), enabled: false },
];

function getState(vs: ValidationResult[]) { if (vs.some(v => v.state === "failed")) return "failed"; if (vs.every(v => v.state === "passed")) return "passed"; if (vs.some(v => v.state === "running")) return "validating"; return "pending"; }
function VIcon({ state }: { state: ValidationState }) { if (state === "passed") return <CheckCircle2 size={15} color={C.green} />; if (state === "failed") return <XCircle size={15} color={C.red} />; if (state === "running") return <Clock3 size={15} color={C.amber} />; return <Circle size={15} color={C.faint} />; }
function Notice({ tone, children }: { tone: NoticeTone; children: ReactNode }) { const cfg = { success: { c: C.green, b: C.greenSoft, i: <CheckCircle2 size={14} /> }, info: { c: C.primary, b: C.primarySoft, i: <Clock3 size={14} /> }, error: { c: C.red, b: C.redSoft, i: <XCircle size={14} /> } }[tone]; return <div role="status" style={{ padding: "9px 11px", display: "flex", alignItems: "flex-start", gap: 7, borderRadius: 7, color: cfg.c, background: cfg.b, fontSize: 11.5, lineHeight: 1.55 }}><span style={{ flex: "0 0 auto", marginTop: 1 }}>{cfg.i}</span><span>{children}</span></div>; }

function groupByName(exts: ExtensionVersion[]): { key: string; name: string; type: ExtensionType; templateId: string; versions: ExtensionVersion[] }[] {
  const map = new Map<string, ExtensionVersion[]>();
  for (const e of exts) { const k = `${e.name}::${e.type}`; if (!map.has(k)) map.set(k, []); map.get(k)!.push(e); }
  return Array.from(map.entries()).map(([key, versions]) => {
    versions.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return { key, name: versions[0].name, type: versions[0].type, templateId: versions[0].templateId, versions };
  });
}

const MOCK_DEBUG_LOG = `[14:32:01] 沙箱初始化完成 · Python 3.10 · PyTorch 2.4
[14:32:02] 加载测试数据集: sft_dialog_100.jsonl (100 条)
[14:32:03] 执行入口: process_sample() 
[14:32:03] 样本 1/100 通过 (耗时 2ms)
[14:32:03] 样本 2/100 通过 (耗时 1ms)
...
[14:32:05] 样本 100/100 通过 (耗时 2ms)
[14:32:05] ========== 调试完成 ==========
[14:32:05] 总耗时: 3.2s · 吞吐: 31 条/s
[14:32:05] 内存峰值: 184 MB · 无内存泄漏`;

export function UnifiedExtensionManagement({ onEnable }: UnifiedExtensionManagementProps) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [exts, setExts] = useState(INITIAL_EXTENSIONS);
  const [sel, setSel] = useState("");
  const [notice, setNotice] = useState<{ tone: NoticeTone; text: string } | null>(null);
  const [codeOpen, setCodeOpen] = useState<string | null>(null);
  const [uploadTemplateId, setUploadTemplateId] = useState<string | null>(null);
  const [uploadGroupKey, setUploadGroupKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [debugExt, setDebugExt] = useState<ExtensionVersion | null>(null);
  const [reportExt, setReportExt] = useState<ExtensionVersion | null>(null);

  const groups = useMemo(() => groupByName(exts), [exts]);
  const selectedExt = exts.find(e => e.id === sel);
  const selGroup = groups.find(g => g.key === sel);
  const selGroupLatest = selGroup?.versions[0];
  const extState = selectedExt ? getState(selectedExt.validations) : "pending";
  const canEnable = extState === "passed" && selectedExt && !selectedExt.enabled;

  const toggleExpand = (key: string) => setExpanded(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const download = (t: ExtensionTemplate) => { const c = [`# ${t.name}`, "", ...t.guide.map((g, i) => `${i + 1}. ${g}`), "", "# 参数", ...t.parameters.map(p => `${p.key}: ${p.defaultValue}`)].join("\n"); const u = URL.createObjectURL(new Blob([c], { type: "text/plain" })); const a = document.createElement("a"); a.href = u; a.download = `${t.id}-template.txt`; a.click(); URL.revokeObjectURL(u); };

  const downloadReport = (ext: ExtensionVersion) => {
    const lines = [`# 测试结果与性能指标报告`, `扩展: ${ext.name} ${ext.version} (${ext.type})`, `扩展包: ${ext.fileName}`, `提交时间: ${ext.uploadedAt}`, ""];
    for (const v of ext.validations) {
      const r = V_REPORT[v.key];
      lines.push(`## ${r.name} — ${V_STATE_TEXT[v.state]}`);
      if (v.state === "passed" || v.state === "failed") {
        lines.push(`范围: ${r.cases} · 耗时: ${r.duration}`, `结果: ${v.state === "passed" ? r.passDetail : r.failDetail}`);
        if (v.state === "failed") lines.push(`集成指导: ${r.guidance}`);
      }
      lines.push("");
    }
    if (ext.validations.find(v => v.key === "performance")?.state === "passed") lines.push("## 性能指标", ...PERF_METRICS.map(m => `${m.label}: ${m.value}`));
    const u = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    const a = document.createElement("a"); a.href = u; a.download = `${ext.name}-${ext.version}-report.txt`; a.click(); URL.revokeObjectURL(u);
  };

  const upload = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) { setUploadGroupKey(null); setUploadTemplateId(null); return; }
    const id = `ext-${Date.now()}`;
    const n = f.name.replace(/\.(tar\.gz|tgz|zip)$/i, "");
    const isNewVersion = !!uploadGroupKey;
    // 模拟解析扩展包内 manifest.yaml 的类型声明：按文件名关键词归类
    const inferTemplate = (fileName: string): ExtensionTemplate => {
      const s = fileName.toLowerCase();
      if (/(opt|adam|lr|sched)/.test(s)) return TEMPLATES.find(t => t.type === "优化器")!;
      if (/(data|clean|process|dedup|filter|dialog)/.test(s)) return TEMPLATES.find(t => t.type === "数据处理")!;
      if (/(eval|score|metric|judge)/.test(s)) return TEMPLATES.find(t => t.type === "评估方法")!;
      return TEMPLATES.find(t => t.type === "微调算法")!;
    };
    const t = isNewVersion ? (TEMPLATES.find(tm => tm.id === uploadTemplateId) ?? TEMPLATES[0]) : inferTemplate(f.name);
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const groupName = isNewVersion ? (groups.find(g => g.key === uploadGroupKey)?.name ?? n) : n;
    const ne: ExtensionVersion = {
      id, templateId: t.id, name: groupName, type: t.type,
      version: isNewVersion ? `v${now.getFullYear() % 100}.${now.getMonth() + 1}.${now.getDate()}` : "v0.1.0",
      fileName: f.name, uploadedAt: ts,
      validations: [{ key: "compatibility", state: "running", summary: "验证中" }, { key: "security", state: "pending", summary: "等待" }, { key: "unit", state: "pending", summary: "等待" }, { key: "integration", state: "pending", summary: "等待" }, { key: "performance", state: "pending", summary: "等待" }],
      parameters: initParams(t.id), enabled: false,
    };
    setExts(c => [ne, ...c]);
    setNotice({ tone: "info", text: isNewVersion ? `已为「${groupName}」上传新版本，进入验证。` : `已解析 manifest.yaml：类型=${t.type}，参数 Schema 已加载，进入五类验证。` });
    setUploadTemplateId(null); setUploadGroupKey(null); e.target.value = "";
    VALIDATION_KEYS.forEach((_, i) => {
      setTimeout(() => {
        setExts(c => c.map(item => item.id !== id ? item : { ...item, validations: item.validations.map((v, j) => j === i ? { ...v, state: "passed" as ValidationState, summary: "通过" } : j === i + 1 ? { ...v, state: "running" as ValidationState, summary: "验证中" } : v) }));
        if (i === VALIDATION_KEYS.length - 1) setNotice({ tone: "success", text: `「${groupName}」五类验证全部通过，已生成测试报告，可配置参数并启用集成。` });
      }, (i + 1) * 1300);
    });
  };

  const setParam = (k: string, v: string) => { if (!selectedExt) return; setExts(c => c.map(i => i.id === selectedExt.id ? { ...i, parameters: { ...i.parameters, [k]: v } } : i)); };

  const enable = (extId?: string) => {
    const target = extId ? exts.find(e => e.id === extId) : selectedExt;
    if (!target || getState(target.validations) !== "passed") return;
    setExts(c => c.map(i => {
      if (i.id === target.id) return { ...i, enabled: true };
      if (i.name === target.name && i.type === target.type && i.enabled) return { ...i, enabled: false };
      return i;
    }));
    setNotice({ tone: "success", text: `${target.name} ${target.version} 已启用。` });
    onEnable?.({ id: target.id, name: target.name, type: target.type, version: target.version, parameters: target.parameters });
  };

  const codeTemplate = TEMPLATES.find(t => t.id === codeOpen);

  return (
    <div style={{ width: "100%", height: "100%", overflowY: "auto", color: C.ink, background: "#f5f7fa" }}>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px 36px" }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, color: C.primary, background: C.primarySoft }}><Puzzle size={17} /></span>
          <div style={{ flex: 1 }}><h1 style={{ margin: 0, fontSize: 19, fontWeight: 720 }}>扩展管理</h1><p style={{ margin: "3px 0 0", color: C.muted, fontSize: 11.5 }}>从标准模板开发到上传验证与启用</p></div>
          <button onClick={() => { setUploadGroupKey(null); setUploadTemplateId(null); uploadRef.current?.click(); }} style={{ height: 34, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 6, background: C.primary, color: "#fff", fontSize: 12, fontWeight: 650, cursor: "pointer" }}><Upload size={14} />上传扩展包</button>
          <input ref={uploadRef} type="file" accept=".zip,.tar.gz,.tgz" onChange={upload} style={{ display: "none" }} />
        </div>

        {notice && <div style={{ marginBottom: 12 }}><Notice tone={notice.tone}>{notice.text}</Notice></div>}

        {/* 模板卡片 */}
        <section style={{ ...surface, marginBottom: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.lineSoft}` }}><Package size={15} color={C.primary} style={{ marginRight: 8, verticalAlign: -2 }} /><span style={{ fontSize: 13, fontWeight: 700 }}>标准模板</span><span style={{ marginLeft: 10, color: C.faint, fontSize: 10.5 }}>选择一个模板查看开发指引和代码示例</span></div>
          <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
            {TEMPLATES.map(t => {
              const tc: Record<ExtensionType, string> = { "微调算法": "#4f46e5", "优化器": "#0369a1", "数据处理": "#047857", "评估方法": "#a15c07" };
              return (
                <div key={t.id} style={{ padding: "12px 14px", border: `1px solid ${C.lineSoft}`, borderRadius: 8, background: "#fbfcfe" }}>
                  <span style={{ padding: "1px 6px", borderRadius: 4, background: `${tc[t.type]}15`, color: tc[t.type], fontSize: 9.5, fontWeight: 650 }}>{t.type}</span>
                  <b style={{ display: "block", marginTop: 6, color: C.ink, fontSize: 12.5 }}>{t.name}</b>
                  <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 11, lineHeight: 1.55 }}><span style={{ color: C.ink, fontSize: 10, fontWeight: 700 }}>模板描述</span> {t.description}</p>
                  <p style={{ margin: "4px 0 0", color: C.text, fontSize: 10.5, lineHeight: 1.55 }}><span style={{ color: C.ink, fontSize: 10, fontWeight: 700 }}>使用场景</span> {t.scenarios.join(" · ")}</p>
                  <p style={{ margin: "4px 0 0", color: C.text, fontSize: 10.5, lineHeight: 1.55 }}><span style={{ color: C.ink, fontSize: 10, fontWeight: 700 }}>使用指引</span> {t.guide.join(" ")}</p>
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => setCodeOpen(t.id)} style={{ height: 28, padding: "0 10px", display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.primary, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}><Code2 size={11} />代码示例</button>
                    <button onClick={() => download(t)} style={{ height: 28, padding: "0 10px", display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.muted, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}><Download size={11} />下载模板</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 版本分组表格 */}
        {groups.length > 0 && (
          <section style={{ ...surface, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.lineSoft}`, display: "flex", alignItems: "center", gap: 8 }}><SlidersHorizontal size={15} color={C.primary} /><span style={{ fontSize: 13, fontWeight: 700 }}>扩展版本与验证</span><span style={{ color: C.faint, fontSize: 10.5 }}>五类验证全部通过后可启用</span></div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ color: C.muted, background: "#fbfcfe", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600, width: 28 }}></th>
                  <th style={{ padding: "9px 12px", textAlign: "left", fontWeight: 600 }}>扩展</th>
                  {VALIDATION_KEYS.map(k => <th key={k} style={{ padding: "9px 10px", textAlign: "left", fontWeight: 600 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{V_META[k].icon}<span style={{ fontSize: 11 }}>{V_META[k].label}</span></span></th>)}
                  <th style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600, minWidth: 180 }}>操作</th>
                </tr></thead>
                <tbody>
                  {groups.map(g => {
                    const latest = g.versions[0];
                    const ls = getState(latest.validations);
                    const isExp = expanded.has(g.key);
                    const isSel = sel === g.key;
                    const enabledVer = g.versions.find(v => v.enabled);
                    return (
                      <>
                        <tr key={g.key}
                          onClick={() => setSel(isSel ? "" : g.key)}
                          style={{ cursor: "pointer", background: isSel ? C.primarySoft : "#fff", borderBottom: `1px solid ${C.lineSoft}` }}>
                          <td style={{ padding: "9px 12px" }}>
                            <button onClick={e => { e.stopPropagation(); toggleExpand(g.key); }} style={{ width: 22, height: 22, display: "grid", placeItems: "center", border: 0, borderRadius: 4, background: "transparent", color: C.muted, cursor: "pointer" }}>
                              {g.versions.length > 1 ? (isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span style={{ width: 14 }} />}
                            </button>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <b style={{ color: C.ink, fontSize: 11.5 }}>{g.name}</b>
                              {enabledVer && <span style={{ padding: "1px 5px", borderRadius: 4, background: C.greenSoft, color: C.green, fontSize: 9, fontWeight: 650 }}>当前 {enabledVer.version}</span>}
                              {g.versions.length > 1 && <span style={{ color: C.faint, fontSize: 9.5 }}>{g.versions.length} 版本</span>}
                            </div>
                            <span style={{ display: "block", color: C.faint, fontSize: 9.5 }}>{g.type} · 最新 {latest.version} · {latest.uploadedAt}</span>
                          </td>
                          {VALIDATION_KEYS.map(k => { const v = latest.validations.find(x => x.key === k)?.state ?? "pending"; return <td key={k} style={{ padding: "10px 10px", textAlign: "left" }}><VIcon state={v} /></td>; })}
                          <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                              {ls === "passed" && !enabledVer ? (
                                <button onClick={ev => { ev.stopPropagation(); const best = g.versions.find(v => getState(v.validations) === "passed"); if (best) enable(best.id); }} style={{ height: 26, padding: "0 8px", border: `1px solid ${C.green}`, borderRadius: 5, background: C.greenSoft, color: C.green, fontSize: 10.5, fontWeight: 650, cursor: "pointer" }}>启用</button>
                              ) : enabledVer ? (
                                <span style={{ padding: "2px 7px", borderRadius: 5, color: C.green, background: C.greenSoft, fontSize: 10, fontWeight: 650 }}>已启用</span>
                              ) : ls === "failed" ? <span style={{ color: C.red, fontSize: 10.5, fontWeight: 600 }}>失败</span> : <span style={{ color: C.muted, fontSize: 10.5 }}>等待</span>}
                              {latest.validations.some(v => v.state === "passed" || v.state === "failed") && <button onClick={ev => { ev.stopPropagation(); setReportExt(latest); }} style={{ height: 26, padding: "0 8px", display: "inline-flex", alignItems: "center", gap: 3, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.primary, fontSize: 10, fontWeight: 600, cursor: "pointer" }}><FileText size={11} />报告</button>}
                              {ls === "passed" && <button onClick={ev => { ev.stopPropagation(); setDebugExt(latest); }} style={{ height: 26, padding: "0 8px", display: "inline-flex", alignItems: "center", gap: 3, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.amber, fontSize: 10, fontWeight: 600, cursor: "pointer" }}><Bug size={11} />调试</button>}
                              <button onClick={ev => { ev.stopPropagation(); setUploadGroupKey(g.key); setUploadTemplateId(g.templateId); uploadRef.current?.click(); }} style={{ height: 26, padding: "0 8px", display: "inline-flex", alignItems: "center", gap: 3, border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.primary, fontSize: 10, fontWeight: 600, cursor: "pointer" }}><GitBranch size={11} />新版本</button>
                            </div>
                          </td>
                        </tr>
                        {isExp && g.versions.slice(1).map(v => {
                          const vs = getState(v.validations);
                          return (
                            <tr key={v.id} style={{ background: "#fafbfd", borderBottom: `1px solid ${C.lineSoft}` }}>
                              <td style={{ padding: "8px 12px" }}><span style={{ color: C.faint, fontSize: 9 }}>└</span></td>
                              <td style={{ padding: "8px 12px" }}>
                                <span style={{ color: C.ink, fontSize: 11 }}>{v.version}</span>
                                <span style={{ display: "block", color: C.faint, fontSize: 9.5 }}>{v.uploadedAt} · {v.fileName}</span>
                              </td>
                              {VALIDATION_KEYS.map(k => { const vv = v.validations.find(x => x.key === k)?.state ?? "pending"; return <td key={k} style={{ padding: "8px 10px", textAlign: "left" }}><VIcon state={vv} /></td>; })}
                              <td style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                                <div style={{ display: "inline-flex", gap: 4 }}>
                                  {v.enabled && <span style={{ padding: "2px 7px", borderRadius: 5, color: C.green, background: C.greenSoft, fontSize: 9.5, fontWeight: 650 }}>已启用</span>}
                                  {v.validations.some(x => x.state === "passed" || x.state === "failed") && <button onClick={ev => { ev.stopPropagation(); setReportExt(v); }} style={{ height: 24, padding: "0 6px", border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.primary, fontSize: 10, cursor: "pointer" }}><FileText size={10} /></button>}
                                  {vs === "passed" && <button onClick={ev => { ev.stopPropagation(); setDebugExt(v); }} style={{ height: 24, padding: "0 6px", border: `1px solid ${C.line}`, borderRadius: 5, background: "#fff", color: C.muted, fontSize: 10, cursor: "pointer" }}><Bug size={10} /></button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {selGroup && selGroupLatest && getState(selGroupLatest.validations) === "passed" && !selGroupLatest.enabled && (
              <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.lineSoft}`, background: C.primarySoft }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                  {(TEMPLATES.find(t => t.id === selGroupLatest.templateId)?.parameters ?? []).map(p => (
                    <label key={p.key} style={{ display: "block" }}>
                      <span style={{ display: "block", marginBottom: 4, color: C.text, fontSize: 10.5, fontWeight: 600 }}>{p.label}</span>
                      {p.type === "select" && p.options ? (
                        <select value={selGroupLatest.parameters[p.key] ?? p.defaultValue} onChange={e => setParam(p.key, e.target.value)} style={inputStyle}>{p.options.map(o => <option key={o}>{o}</option>)}</select>
                      ) : (
                        <input type={p.type ?? "text"} min={p.min} max={p.max} step={p.step} value={selGroupLatest.parameters[p.key] ?? p.defaultValue} onChange={e => setParam(p.key, e.target.value)} style={inputStyle} />
                      )}
                      <span style={{ display: "block", marginTop: 2, color: C.faint, fontSize: 9.5 }}>{p.helper}</span>
                    </label>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => enable()} style={{ height: 31, padding: "0 14px", border: 0, borderRadius: 6, background: C.green, color: "#fff", fontSize: 11.5, fontWeight: 650, cursor: "pointer" }}>确认启用</button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* 代码示例弹窗 */}
      {codeTemplate && (
        <div role="dialog" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,.45)", padding: 20 }} onClick={() => setCodeOpen(null)}>
          <div style={{ width: "min(680px, 100%)", maxHeight: "80vh", overflow: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 24px 64px rgba(17,24,39,.25)", padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <b style={{ fontSize: 14 }}>{codeTemplate.name}</b>
                <span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 11 }}>{codeTemplate.description}</span>
                <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>{codeTemplate.scenarios.map(s => <span key={s} style={{ padding: "1px 6px", borderRadius: 4, background: C.primarySoft, color: C.primary, fontSize: 9.5, fontWeight: 600 }}>{s}</span>)}</div>
              </div>
              <button onClick={() => setCodeOpen(null)} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: 0, borderRadius: 6, background: C.panel, color: C.muted, cursor: "pointer" }}><X size={15} /></button>
            </div>
            <div style={{ marginBottom: 12 }}><h3 style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.text }}>开发步骤</h3><ol style={{ margin: 0, paddingLeft: 16, fontSize: 10.5, color: C.muted, lineHeight: 1.75 }}>{codeTemplate.guide.map((g, i) => <li key={i}>{g}</li>)}</ol></div>
            <h3 style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.text }}>代码示例</h3>
            <pre style={{ margin: 0, padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 7, background: "#1a1d23", color: "#c9d1d9", fontSize: 10.5, lineHeight: 1.65, overflowX: "auto" }}><code>{codeTemplate.codeExample}</code></pre>
            <div style={{ marginTop: 12 }}><h3 style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.text }}>可配置参数</h3><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}><thead><tr style={{ color: C.muted, borderBottom: `1px solid ${C.lineSoft}` }}><th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600 }}>参数</th><th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600 }}>默认值</th><th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600 }}>说明</th></tr></thead><tbody>{codeTemplate.parameters.map(p => <tr key={p.key} style={{ borderBottom: `1px solid ${C.lineSoft}` }}><td style={{ padding: "6px 8px", color: C.ink, fontFamily: "monospace", fontSize: 10.5 }}>{p.key}</td><td style={{ padding: "6px 8px", color: C.muted }}>{p.defaultValue}</td><td style={{ padding: "6px 8px", color: C.muted }}>{p.helper}</td></tr>)}</tbody></table></div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}><button onClick={() => { download(codeTemplate); setCodeOpen(null); }} style={{ height: 31, padding: "0 14px", border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", color: C.primary, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}><Download size={12} />下载模板</button></div>
          </div>
        </div>
      )}

      {/* 调试沙箱弹窗 */}
      {debugExt && (
        <div role="dialog" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,.45)", padding: 20 }} onClick={() => setDebugExt(null)}>
          <div style={{ width: "min(720px, 100%)", maxHeight: "80vh", overflow: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 24px 64px rgba(17,24,39,.25)", padding: 18 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <b style={{ fontSize: 14 }}>调试沙箱 — {debugExt.name} {debugExt.version}</b>
                <span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 11 }}>{debugExt.type} · 测试数据集: sft_dialog_100.jsonl (100 条)</span>
              </div>
              <button onClick={() => setDebugExt(null)} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: 0, borderRadius: 6, background: C.panel, color: C.muted, cursor: "pointer" }}><X size={15} /></button>
            </div>
            <div style={{ marginBottom: 10, display: "flex", gap: 6 }}>
              <span style={{ padding: "2px 6px", borderRadius: 4, background: C.greenSoft, color: C.green, fontSize: 9.5, fontWeight: 600 }}>运行成功</span>
              <span style={{ padding: "2px 6px", borderRadius: 4, background: C.panel, color: C.muted, fontSize: 9.5, fontWeight: 600 }}>总耗时 3.2s</span>
              <span style={{ padding: "2px 6px", borderRadius: 4, background: C.panel, color: C.muted, fontSize: 9.5, fontWeight: 600 }}>吞吐 31 条/s</span>
              <span style={{ padding: "2px 6px", borderRadius: 4, background: C.panel, color: C.muted, fontSize: 9.5, fontWeight: 600 }}>内存峰值 184 MB</span>
            </div>
            <div style={{ border: `1px solid ${C.line}`, borderRadius: 7, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.lineSoft}`, background: C.panel, display: "flex", alignItems: "center", gap: 6 }}>
                <Terminal size={13} color={C.muted} />
                <span style={{ color: C.muted, fontSize: 10.5, fontWeight: 600 }}>执行日志</span>
              </div>
              <pre style={{ margin: 0, padding: "12px 14px", background: "#1a1d23", color: "#a5d6a5", fontSize: 10, lineHeight: 1.7, fontFamily: "'SF Mono', 'Fira Code', monospace", maxHeight: 280, overflowY: "auto" }}><code>{MOCK_DEBUG_LOG}</code></pre>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setDebugExt(null)} style={{ height: 31, padding: "0 14px", border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", color: C.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 测试结果与性能指标报告弹窗 */}
      {reportExt && (() => {
        const passed = reportExt.validations.filter(v => v.state === "passed").length;
        const failedItems = reportExt.validations.filter(v => v.state === "failed");
        const perfPassed = reportExt.validations.find(v => v.key === "performance")?.state === "passed";
        return (
          <div role="dialog" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,.45)", padding: 20 }} onClick={() => setReportExt(null)}>
            <div style={{ width: "min(720px, 100%)", maxHeight: "82vh", overflow: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 24px 64px rgba(17,24,39,.25)", padding: 18 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <b style={{ fontSize: 14 }}>测试结果与性能指标报告 — {reportExt.name} {reportExt.version}</b>
                  <span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 11 }}>{reportExt.type} · {reportExt.fileName} · 提交于 {reportExt.uploadedAt}</span>
                </div>
                <button onClick={() => setReportExt(null)} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: 0, borderRadius: 6, background: C.panel, color: C.muted, cursor: "pointer" }}><X size={15} /></button>
              </div>
              <div style={{ marginBottom: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 6px", borderRadius: 4, background: failedItems.length ? C.redSoft : C.greenSoft, color: failedItems.length ? C.red : C.green, fontSize: 9.5, fontWeight: 600 }}>{failedItems.length ? "验证未通过" : passed === 5 ? "全部通过" : "验证进行中"}</span>
                <span style={{ padding: "2px 6px", borderRadius: 4, background: C.panel, color: C.muted, fontSize: 9.5, fontWeight: 600 }}>通过 {passed}/5 项</span>
                <span style={{ padding: "2px 6px", borderRadius: 4, background: C.panel, color: C.muted, fontSize: 9.5, fontWeight: 600 }}>总耗时 111s</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
                <thead><tr style={{ color: C.muted, background: "#fbfcfe", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600 }}>测试项</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600 }}>状态</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600 }}>用例/检查项</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600 }}>耗时</th>
                  <th style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600 }}>结果说明</th>
                </tr></thead>
                <tbody>
                  {reportExt.validations.map(v => {
                    const r = V_REPORT[v.key];
                    const done = v.state === "passed" || v.state === "failed";
                    return (
                      <tr key={v.key} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                        <td style={{ padding: "8px 8px", color: C.ink, fontWeight: 600, whiteSpace: "nowrap" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{V_META[v.key].icon}{r.name}</span></td>
                        <td style={{ padding: "8px 8px", whiteSpace: "nowrap" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: v.state === "passed" ? C.green : v.state === "failed" ? C.red : v.state === "running" ? C.amber : C.faint, fontWeight: 600 }}><VIcon state={v.state} />{V_STATE_TEXT[v.state]}</span></td>
                        <td style={{ padding: "8px 8px", color: C.muted, whiteSpace: "nowrap" }}>{done ? r.cases : "—"}</td>
                        <td style={{ padding: "8px 8px", color: C.muted, whiteSpace: "nowrap" }}>{done ? r.duration : "—"}</td>
                        <td style={{ padding: "8px 8px", color: C.text, lineHeight: 1.55 }}>{v.state === "passed" ? r.passDetail : v.state === "failed" ? r.failDetail : v.state === "running" ? "正在执行…" : "等待前序验证完成"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: 14 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.text }}>性能指标</h3>
                {perfPassed ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
                    {PERF_METRICS.map(m => (
                      <div key={m.label} style={{ padding: "9px 11px", border: `1px solid ${C.lineSoft}`, borderRadius: 7, background: "#fbfcfe" }}><span style={{ display: "block", color: C.faint, fontSize: 10 }}>{m.label}</span><b style={{ color: C.ink, fontSize: 13 }}>{m.value}</b></div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: C.faint, fontSize: 10.5 }}>性能测试尚未执行完成，指标将在测试通过后生成。</span>
                )}
              </div>
              {failedItems.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: C.text }}>集成指导</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {failedItems.map(v => <Notice key={v.key} tone="error"><b>{V_REPORT[v.key].name}：</b>{V_REPORT[v.key].guidance}</Notice>)}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setReportExt(null)} style={{ height: 31, padding: "0 14px", border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", color: C.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>关闭</button>
                <button onClick={() => downloadReport(reportExt)} style={{ height: 31, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 5, border: 0, borderRadius: 6, background: C.primary, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}><Download size={12} />下载报告</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
