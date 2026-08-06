import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  Download,
  FileCode2,
  GitBranch,
  Layers3,
  LoaderCircle,
  Network,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";

type ParallelKind = "dp" | "mp" | "pp" | "tp";
type ValidationState = "idle" | "passed" | "failed";

type ModelSummary = {
  name: string;
  paramSize: string;
  category: string;
} | null;

type ParallelTrainingConfigProps = {
  model: ModelSummary;
  batchSize: number;
  onValidationChange?: (valid: boolean) => void;
};

const COLORS = {
  blue: "#4f6ef7",
  blueSoft: "#f3f6ff",
  ink: "#1a1d23",
  text: "#374151",
  muted: "#6b7280",
  faint: "#9ca3af",
  line: "#e0e3ed",
  soft: "#f8f9fc",
  green: "#16a34a",
  greenSoft: "#f0faf5",
  amber: "#d97706",
  amberSoft: "#fffbeb",
  red: "#dc2626",
  redSoft: "#fef2f2",
};

const PARALLEL_CARDS: Array<{
  id: ParallelKind;
  title: string;
  short: string;
  description: string;
  bestFor: string;
  icon: typeof Database;
}> = [
  { id: "dp", title: "数据并行", short: "DP", description: "复制模型到多个 GPU，拆分训练数据。", bestFor: "通用加速，建议保留", icon: Database },
  { id: "mp", title: "模型并行", short: "MP", description: "将不同模型层放到不同设备。", bestFor: "不规则结构或手动分层", icon: Layers3 },
  { id: "pp", title: "流水线并行", short: "PP", description: "按层切为多个阶段，微批次流水执行。", bestFor: "深层网络与跨节点训练", icon: GitBranch },
  { id: "tp", title: "张量并行", short: "TP", description: "在算子内部切分权重和张量。", bestFor: "单层参数量较大的模型", icon: Network },
];

const fieldStyle: CSSProperties = {
  width: "100%",
  height: 34,
  padding: "0 10px",
  border: `1px solid ${COLORS.line}`,
  borderRadius: 6,
  background: "#fff",
  color: COLORS.ink,
  fontSize: 12.5,
  outline: "none",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={{ display: "block", marginBottom: 6, color: COLORS.text, fontSize: 12.5, fontWeight: 500 }}>{label}</span>
      {children}
      {hint && <span style={{ display: "block", marginTop: 5, color: COLORS.faint, fontSize: 11, lineHeight: 1.45 }}>{hint}</span>}
    </label>
  );
}

function StepRail({ step, onStep }: { step: number; onStep: (step: number) => void }) {
  const steps = ["分析模型", "选择策略", "参数配置", "校验与预览"];
  return (
    <div className="parallel-step-rail" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", borderBottom: `1px solid ${COLORS.line}`, background: "#fff" }}>
      {steps.map((label, index) => {
        const id = index + 1;
        const active = step === id;
        const done = step > id;
        return (
          <button key={label} type="button" onClick={() => onStep(id)} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            minHeight: 46, border: 0, borderBottom: `2px solid ${active ? COLORS.blue : "transparent"}`,
            background: active ? "#fbfcff" : "transparent", color: active ? COLORS.blue : done ? COLORS.text : COLORS.muted,
            fontSize: 12.5, fontWeight: active ? 600 : 500, cursor: "pointer",
          }}>
            <span style={{
              width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%", background: active || done ? COLORS.blue : "#eef0f5", color: active || done ? "#fff" : COLORS.faint,
              fontSize: 10.5, fontWeight: 700,
            }}>{done ? <Check size={11} strokeWidth={3} /> : id}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ParallelTrainingConfig({ model, batchSize, onValidationChange }: ParallelTrainingConfigProps) {
  const [enabled, setEnabled] = useState(true);
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<"platform" | "upload">("platform");
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [selected, setSelected] = useState<Set<ParallelKind>>(new Set(["dp", "pp", "tp"]));
  const [nodes, setNodes] = useState(2);
  const [gpusPerNode, setGpusPerNode] = useState(8);
  const [dpDegree, setDpDegree] = useState(2);
  const [mpDegree, setMpDegree] = useState(2);
  const [ppDegree, setPpDegree] = useState(2);
  const [tpDegree, setTpDegree] = useState(4);
  const [pipelineLayers, setPipelineLayers] = useState("32, 32");
  const [microBatch, setMicroBatch] = useState(1);
  const [tensorSplit, setTensorSplit] = useState("column");
  const [modelPlacement, setModelPlacement] = useState("auto");
  const [backend, setBackend] = useState("NCCL");
  const [validation, setValidation] = useState<ValidationState>("idle");
  const [saved, setSaved] = useState(false);

  const parameterBillions = Number.parseFloat(model?.paramSize ?? "32") || 32;
  const modelLayers = parameterBillions >= 60 ? 80 : parameterBillions >= 20 ? 64 : parameterBillions >= 7 ? 32 : 24;
  const totalGpus = nodes * gpusPerNode;
  const recommendedTp = parameterBillions >= 20 ? 4 : parameterBillions >= 7 ? 2 : 1;
  const recommendedPp = parameterBillions >= 20 ? 2 : 1;
  const recommendedDp = Math.max(1, Math.floor(totalGpus / (recommendedTp * recommendedPp)));
  const recommendationLabel = [
    `DP ${recommendedDp}`,
    ...(recommendedPp > 1 ? [`PP ${recommendedPp}`] : []),
    ...(recommendedTp > 1 ? [`TP ${recommendedTp}`] : []),
  ].join(" × ");
  const degreeFor = (kind: ParallelKind) => {
    if (!selected.has(kind)) return 1;
    if (kind === "dp") return dpDegree;
    if (kind === "mp") return mpDegree;
    if (kind === "pp") return ppDegree;
    return tpDegree;
  };
  const usedGpus = degreeFor("dp") * degreeFor("mp") * degreeFor("pp") * degreeFor("tp");

  const issues = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (selected.size === 0) errors.push("至少选择一种并行范式。建议先使用数据并行。");
    if (usedGpus > totalGpus) errors.push(`并行度乘积为 ${usedGpus}，超过当前可用的 ${totalGpus} 张 GPU。`);
    if (usedGpus < totalGpus) warnings.push(`当前仅使用 ${usedGpus}/${totalGpus} 张 GPU；可提高数据并行度，或保留资源给其他任务。`);
    if (selected.has("mp") && (selected.has("pp") || selected.has("tp"))) {
      warnings.push("通用模型并行与 PP/TP 同时启用会增加通信复杂度，请确认训练框架支持该组合。");
    }
    if (selected.has("pp")) {
      const layers = pipelineLayers.split(",").map(item => Number(item.trim())).filter(item => Number.isFinite(item));
      if (layers.length !== ppDegree) errors.push(`流水线阶段数为 ${ppDegree}，应填写 ${ppDegree} 个阶段的层数。`);
      else if (layers.some(item => item <= 0 || !Number.isInteger(item))) errors.push("每个流水线阶段的层数必须为正整数。");
      else if (layers.reduce((sum, item) => sum + item, 0) !== modelLayers) errors.push(`各阶段层数之和应为模型总层数 ${modelLayers}。`);
    }
    if (batchSize % (Math.max(1, degreeFor("dp")) * Math.max(1, microBatch)) !== 0) {
      errors.push(`Batch size ${batchSize} 不能被 DP × 微批次大小整除，请调整数据并行度或微批次。`);
    }
    return { errors, warnings };
  }, [batchSize, dpDegree, microBatch, modelLayers, pipelineLayers, ppDegree, selected, totalGpus, usedGpus]);

  const yaml = useMemo(() => {
    const strategies = [...selected].sort();
    const lines = [
      "parallel_training:",
      "  enabled: true",
      `  model: ${model?.name ?? "custom-model"}`,
      `  model_definition: ${source === "upload" ? fileName || "custom_model.py" : `registry://${model?.name ?? "selected-model"}`}`,
      `  backend: ${backend.toLowerCase()}`,
      "  resources:",
      `    nodes: ${nodes}`,
      `    gpus_per_node: ${gpusPerNode}`,
      `  strategies: [${strategies.join(", ")}]`,
    ];
    if (selected.has("dp")) lines.push("  data_parallel:", `    degree: ${dpDegree}`);
    if (selected.has("mp")) lines.push("  model_parallel:", `    degree: ${mpDegree}`, `    placement: ${modelPlacement}`);
    if (selected.has("pp")) lines.push("  pipeline_parallel:", `    stages: ${ppDegree}`, `    layers_per_stage: [${pipelineLayers}]`, `    micro_batch_size: ${microBatch}`);
    if (selected.has("tp")) lines.push("  tensor_parallel:", `    degree: ${tpDegree}`, `    split_dimension: ${tensorSplit}`);
    return lines.join("\n");
  }, [backend, dpDegree, fileName, gpusPerNode, microBatch, model?.name, modelPlacement, mpDegree, nodes, pipelineLayers, ppDegree, selected, source, tensorSplit, tpDegree]);

  useEffect(() => {
    setValidation("idle");
    setSaved(false);
    onValidationChange?.(false);
  }, [batchSize, model?.name, onValidationChange]);

  const markChanged = () => {
    setValidation("idle");
    setSaved(false);
    onValidationChange?.(false);
  };

  const analyze = () => {
    setAnalyzing(true);
    setValidation("idle");
    window.setTimeout(() => {
      const suggestedTp = recommendedTp;
      const suggestedPp = recommendedPp;
      const suggestedDp = recommendedDp;
      const next = new Set<ParallelKind>(["dp"]);
      if (suggestedTp > 1) next.add("tp");
      if (suggestedPp > 1) next.add("pp");
      setSelected(next);
      setTpDegree(suggestedTp);
      setPpDegree(suggestedPp);
      setDpDegree(suggestedDp);
      setPipelineLayers(suggestedPp === 1 ? String(modelLayers) : `${modelLayers / 2}, ${modelLayers / 2}`);
      setAnalyzed(true);
      setAnalyzing(false);
    }, 650);
  };

  const toggleKind = (kind: ParallelKind) => {
    markChanged();
    setSelected(current => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind); else next.add(kind);
      return next;
    });
  };

  const validate = () => {
    const next = issues.errors.length ? "failed" : "passed";
    setValidation(next);
    onValidationChange?.(next === "passed");
  };

  const downloadConfig = () => {
    const blob = new Blob([yaml], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "parallel-training.yaml";
    anchor.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  };

  const changeNumber = (setter: (value: number) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    markChanged();
    setter(Math.max(1, Number(event.target.value) || 1));
  };

  return (
    <section style={{ marginBottom: 20, border: `1px solid ${enabled ? "#cfd8ff" : COLORS.line}`, borderRadius: 9, overflow: "hidden", background: "#fff" }}>
      <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, background: enabled ? "#f7f9ff" : COLORS.soft, borderBottom: enabled ? `1px solid ${COLORS.line}` : 0 }}>
        <div style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 7, background: enabled ? "#e8edff" : "#eef0f4", color: enabled ? COLORS.blue : COLORS.muted }}>
          <Network size={17} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: COLORS.ink, fontSize: 13.5, fontWeight: 650 }}>多范式并行训练</div>
          <div style={{ marginTop: 2, color: COLORS.muted, fontSize: 11.5 }}>根据模型结构和集群资源生成可执行的组合并行配置</div>
        </div>
        <span style={{ marginLeft: "auto", color: enabled ? COLORS.green : COLORS.faint, fontSize: 11.5 }}>{enabled ? "已启用" : "单卡 / 默认框架策略"}</span>
        <button type="button" role="switch" aria-checked={enabled} aria-label="启用多范式并行训练" onClick={() => {
          const next = !enabled;
          setEnabled(next);
          setValidation(next ? "idle" : "passed");
          onValidationChange?.(!next);
        }} style={{
          width: 34, height: 20, padding: 2, display: "flex", alignItems: "center", justifyContent: enabled ? "flex-end" : "flex-start",
          border: 0, borderRadius: 10, background: enabled ? COLORS.blue : "#cfd3dc", cursor: "pointer",
        }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
        </button>
      </div>

      {enabled && (
        <>
          <StepRail step={step} onStep={setStep} />
          <div style={{ padding: 16 }}>
            {step === 1 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 14 }}>
                  <div><b style={{ color: COLORS.ink, fontSize: 13 }}>选择模型定义来源</b><div style={{ marginTop: 4, color: COLORS.muted, fontSize: 11.5 }}>平台模型可直接读取配置；仅自定义网络需要上传定义文件。</div></div>
                  <span style={{ padding: "3px 8px", borderRadius: 4, background: COLORS.blueSoft, color: COLORS.blue, fontSize: 11 }}>当前集群 · 2 节点 / 16 × A100 80G</span>
                </div>
                <div className="parallel-source-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button type="button" onClick={() => { setSource("platform"); setAnalyzed(false); }} style={{ padding: 13, textAlign: "left", border: `1px solid ${source === "platform" ? COLORS.blue : COLORS.line}`, borderRadius: 7, background: source === "platform" ? COLORS.blueSoft : "#fff", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Cpu size={15} color={source === "platform" ? COLORS.blue : COLORS.muted} /><b style={{ color: COLORS.ink, fontSize: 12.5 }}>使用已选基础模型</b>{source === "platform" && <CheckCircle2 size={14} color={COLORS.blue} style={{ marginLeft: "auto" }} />}</div>
                    <div style={{ marginTop: 7, color: COLORS.muted, fontSize: 11.5 }}>{model ? `${model.name} · ${model.paramSize}B · ${model.category}` : "请先在基本信息中选择模型"}</div>
                  </button>
                  <button type="button" onClick={() => { setSource("upload"); setAnalyzed(false); }} style={{ padding: 13, textAlign: "left", border: `1px solid ${source === "upload" ? COLORS.blue : COLORS.line}`, borderRadius: 7, background: source === "upload" ? COLORS.blueSoft : "#fff", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FileCode2 size={15} color={source === "upload" ? COLORS.blue : COLORS.muted} /><b style={{ color: COLORS.ink, fontSize: 12.5 }}>上传自定义定义文件</b>{source === "upload" && <CheckCircle2 size={14} color={COLORS.blue} style={{ marginLeft: "auto" }} />}</div>
                    <div style={{ marginTop: 7, color: COLORS.muted, fontSize: 11.5 }}>支持 PyTorch .py 文件，原始文件仅用于结构分析</div>
                  </button>
                </div>
                {source === "upload" && (
                  <label style={{ marginTop: 10, minHeight: 54, padding: "10px 13px", display: "flex", alignItems: "center", gap: 10, border: "1px dashed #b8c1d8", borderRadius: 7, background: "#fbfcff", cursor: "pointer" }}>
                    <Upload size={16} color={COLORS.blue} /><div><b style={{ color: COLORS.text, fontSize: 12 }}>{fileName || "点击选择模型定义文件"}</b><div style={{ marginTop: 2, color: COLORS.faint, fontSize: 10.5 }}>单个 .py 文件，最大 5 MB</div></div>
                    <input type="file" accept=".py,text/x-python" onChange={event => { setFileName(event.target.files?.[0]?.name ?? ""); setAnalyzed(false); }} style={{ display: "none" }} />
                  </label>
                )}
                {analyzed && (
                  <div className="parallel-analysis-grid" style={{ marginTop: 12, padding: 13, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, border: "1px solid #ccebd8", borderRadius: 7, background: COLORS.greenSoft }}>
                    {[["模型架构", model?.category === "Image" ? "Diffusion" : "Decoder-only"], ["参数规模", `${parameterBillions}B`], ["Transformer 层", String(modelLayers)], ["权重显存估算", `${Math.ceil(parameterBillions * 2)} GB`], ["建议策略", recommendationLabel]].map(([label, value]) => <div key={label}><span style={{ display: "block", color: COLORS.muted, fontSize: 10.5 }}>{label}</span><b style={{ display: "block", marginTop: 4, color: COLORS.ink, fontSize: 12 }}>{value}</b></div>)}
                  </div>
                )}
                <div style={{ marginTop: 13, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" disabled={(source === "platform" && !model) || (source === "upload" && !fileName) || analyzing} onClick={analyze} style={{ height: 32, padding: "0 13px", display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 6, background: COLORS.blue, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: (source === "platform" && !model) || (source === "upload" && !fileName) ? .5 : 1 }}>
                    {analyzing ? <LoaderCircle size={13} style={{ animation: "parallel-spin 1s linear infinite" }} /> : <Sparkles size={13} />}{analyzing ? "分析中..." : analyzed ? "重新分析" : "分析模型"}
                  </button>
                  <button type="button" disabled={!analyzed} onClick={() => setStep(2)} style={{ height: 32, padding: "0 13px", display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${COLORS.line}`, borderRadius: 6, background: "#fff", color: COLORS.text, fontSize: 12, fontWeight: 500, cursor: analyzed ? "pointer" : "not-allowed", opacity: analyzed ? 1 : .5 }}>下一步 <ChevronRight size={13} /></button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div style={{ padding: "9px 11px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, borderRadius: 6, background: COLORS.blueSoft, color: COLORS.blue, fontSize: 11.5 }}><Sparkles size={14} /><b>系统推荐：{recommendationLabel}</b><span style={{ color: COLORS.muted }}>充分使用 {totalGpus} 张 GPU，平衡显存与通信开销。</span></div>
                <div className="parallel-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 9 }}>
                  {PARALLEL_CARDS.map(card => {
                    const active = selected.has(card.id);
                    const Icon = card.icon;
                    return (
                      <button key={card.id} type="button" onClick={() => toggleKind(card.id)} style={{ minHeight: 145, padding: 12, position: "relative", textAlign: "left", border: `1px solid ${active ? COLORS.blue : COLORS.line}`, borderRadius: 7, background: active ? COLORS.blueSoft : "#fff", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span style={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 6, background: active ? "#e4eaff" : "#f1f3f6" }}><Icon size={14} color={active ? COLORS.blue : COLORS.muted} /></span><b style={{ color: COLORS.ink, fontSize: 12.5 }}>{card.title}</b><span style={{ color: COLORS.faint, fontSize: 10.5 }}>{card.short}</span></div>
                        <p style={{ margin: "10px 0 6px", color: COLORS.muted, fontSize: 11, lineHeight: 1.55 }}>{card.description}</p>
                        <span style={{ color: COLORS.faint, fontSize: 10.5 }}>{card.bestFor}</span>
                        <span style={{ position: "absolute", right: 10, top: 10, width: 16, height: 16, display: "grid", placeItems: "center", border: `1px solid ${active ? COLORS.blue : "#cfd3dc"}`, borderRadius: 4, background: active ? COLORS.blue : "#fff" }}>{active && <Check size={10} color="#fff" strokeWidth={3} />}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 13, display: "flex", justifyContent: "flex-end" }}><button type="button" disabled={!selected.size} onClick={() => setStep(3)} style={{ height: 32, padding: "0 13px", display: "inline-flex", alignItems: "center", gap: 5, border: 0, borderRadius: 6, background: COLORS.blue, color: "#fff", fontSize: 12, fontWeight: 600, cursor: selected.size ? "pointer" : "not-allowed", opacity: selected.size ? 1 : .5 }}>配置参数 <ChevronRight size={13} /></button></div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="parallel-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
                  <Field label="节点数"><input aria-label="节点数" type="number" min={1} value={nodes} onChange={changeNumber(setNodes)} style={fieldStyle} /></Field>
                  <Field label="每节点 GPU 数"><input aria-label="每节点 GPU 数" type="number" min={1} value={gpusPerNode} onChange={changeNumber(setGpusPerNode)} style={fieldStyle} /></Field>
                  <Field label="通信后端"><select aria-label="通信后端" value={backend} onChange={event => { markChanged(); setBackend(event.target.value); }} style={fieldStyle}><option>NCCL</option><option>Gloo</option><option>HCCL</option></select></Field>
                  {selected.has("dp") && <Field label="数据并行度（DP）" hint="模型副本数量"><input aria-label="数据并行度" type="number" min={1} value={dpDegree} onChange={changeNumber(setDpDegree)} style={fieldStyle} /></Field>}
                  {selected.has("mp") && <><Field label="模型并行度（MP）"><input aria-label="模型并行度" type="number" min={1} value={mpDegree} onChange={changeNumber(setMpDegree)} style={fieldStyle} /></Field><Field label="模型放置策略"><select aria-label="模型放置策略" value={modelPlacement} onChange={event => { markChanged(); setModelPlacement(event.target.value); }} style={fieldStyle}><option value="auto">自动均衡</option><option value="manual">手动层映射</option></select></Field></>}
                  {selected.has("pp") && <><Field label="流水线阶段数（PP）"><input aria-label="流水线阶段数" type="number" min={1} value={ppDegree} onChange={changeNumber(setPpDegree)} style={fieldStyle} /></Field><Field label="各阶段模型层数" hint={`逗号分隔，总和需为 ${modelLayers} 层`}><input aria-label="各阶段模型层数" value={pipelineLayers} onChange={event => { markChanged(); setPipelineLayers(event.target.value); }} style={fieldStyle} /></Field><Field label="微批次大小"><input aria-label="微批次大小" type="number" min={1} value={microBatch} onChange={changeNumber(setMicroBatch)} style={fieldStyle} /></Field></>}
                  {selected.has("tp") && <><Field label="张量并行度（TP）"><input aria-label="张量并行度" type="number" min={1} value={tpDegree} onChange={changeNumber(setTpDegree)} style={fieldStyle} /></Field><Field label="张量切分维度"><select aria-label="张量切分维度" value={tensorSplit} onChange={event => { markChanged(); setTensorSplit(event.target.value); }} style={fieldStyle}><option value="column">按列切分（Column）</option><option value="row">按行切分（Row）</option><option value="auto">自动选择</option></select></Field></>}
                </div>
                <div style={{ marginTop: 13, padding: "9px 11px", display: "flex", alignItems: "center", gap: 8, borderRadius: 6, background: usedGpus > totalGpus ? COLORS.redSoft : COLORS.soft, color: usedGpus > totalGpus ? COLORS.red : COLORS.muted, fontSize: 11.5 }}><Cpu size={14} /><b>资源计算</b><span>{[...selected].map(kind => `${kind.toUpperCase()} ${degreeFor(kind)}`).join(" × ")} = {usedGpus} GPU</span><span style={{ marginLeft: "auto" }}>集群可用 {totalGpus} GPU</span></div>
                <div style={{ marginTop: 13, display: "flex", justifyContent: "flex-end" }}><button type="button" onClick={() => setStep(4)} style={{ height: 32, padding: "0 13px", display: "inline-flex", alignItems: "center", gap: 5, border: 0, borderRadius: 6, background: COLORS.blue, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>校验配置 <ChevronRight size={13} /></button></div>
              </div>
            )}

            {step === 4 && (
              <div className="parallel-review-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(320px,.9fr)", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}><b style={{ color: COLORS.ink, fontSize: 12.5 }}>有效性校验</b><button type="button" onClick={validate} style={{ height: 30, padding: "0 11px", display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 6, background: COLORS.blue, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}><RefreshCw size={12} />校验</button></div>
                  {validation === "idle" ? <div style={{ padding: 14, border: `1px dashed ${COLORS.line}`, borderRadius: 7, color: COLORS.muted, fontSize: 11.5 }}>配置已更新，请点击“校验”检查资源与模型约束。</div> : (
                    <div style={{ padding: 13, border: `1px solid ${validation === "passed" ? "#ccebd8" : "#fecaca"}`, borderRadius: 7, background: validation === "passed" ? COLORS.greenSoft : COLORS.redSoft }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, color: validation === "passed" ? COLORS.green : COLORS.red, fontSize: 12.5, fontWeight: 650 }}>{validation === "passed" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}{validation === "passed" ? "配置有效，可以提交训练任务" : `发现 ${issues.errors.length} 个需修改问题`}</div>
                      {issues.errors.map(item => <div key={item} style={{ marginTop: 8, color: COLORS.red, fontSize: 11.5, lineHeight: 1.5 }}>• {item}</div>)}
                      {issues.warnings.map(item => <div key={item} style={{ marginTop: 8, color: COLORS.amber, fontSize: 11.5, lineHeight: 1.5 }}>• 建议：{item}</div>)}
                      {validation === "passed" && !issues.warnings.length && <div style={{ marginTop: 7, color: COLORS.muted, fontSize: 11.5 }}>资源数量、并行度、模型分层及批次关系均检查通过。</div>}
                    </div>
                  )}
                  <div style={{ marginTop: 10, display: "grid", gap: 7 }}>{["模型定义可解析", `${usedGpus} 张 GPU 拓扑可调度`, `Batch size ${batchSize} 与并行配置匹配`, "通信后端与设备类型兼容"].map((item, index) => <div key={item} style={{ display: "flex", alignItems: "center", gap: 7, color: COLORS.muted, fontSize: 11.5 }}><CheckCircle2 size={13} color={validation === "passed" || index === 0 ? COLORS.green : COLORS.faint} />{item}</div>)}</div>
                </div>
                <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 7, overflow: "hidden" }}>
                  <div style={{ height: 36, padding: "0 11px", display: "flex", alignItems: "center", borderBottom: `1px solid ${COLORS.line}`, background: COLORS.soft }}><FileCode2 size={13} color={COLORS.muted} /><b style={{ marginLeft: 6, color: COLORS.text, fontSize: 11.5 }}>parallel-training.yaml</b><button type="button" disabled={validation !== "passed"} onClick={downloadConfig} style={{ marginLeft: "auto", padding: 0, display: "inline-flex", alignItems: "center", gap: 5, border: 0, background: "transparent", color: validation === "passed" ? COLORS.blue : COLORS.faint, fontSize: 11, cursor: validation === "passed" ? "pointer" : "not-allowed" }}><Download size={12} />{saved ? "已保存" : "保存配置"}</button></div>
                  <pre style={{ margin: 0, padding: 12, minHeight: 210, overflow: "auto", background: "#111827", color: "#d7e0ef", fontSize: 10.5, lineHeight: 1.55, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" }}>{yaml}</pre>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <style>{`
        @keyframes parallel-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .parallel-card-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
          .parallel-analysis-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
          .parallel-review-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 680px) {
          .parallel-step-rail { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
          .parallel-source-grid, .parallel-form-grid { grid-template-columns: 1fr !important; }
          .parallel-card-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
