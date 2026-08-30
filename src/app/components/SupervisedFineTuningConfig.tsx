import { useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronDown, Clock3, Cpu, Network, Puzzle, Server, ShieldCheck, WandSparkles, X, Zap } from "lucide-react";
import { DEFAULT_ENABLED_FINE_TUNING_EXTENSIONS, type EnabledFineTuningExtension } from "./UnifiedExtensionManagement";

const EXT_STAGE: Record<EnabledFineTuningExtension["type"], string> = { "数据处理": "数据预处理阶段", "微调算法": "训练策略阶段", "优化器": "参数优化阶段", "评估方法": "训练后评估阶段" };
const EXT_STAGE_ORDER: EnabledFineTuningExtension["type"][] = ["数据处理", "微调算法", "优化器", "评估方法"];

export type SupervisedFineTuningModelSummary = {
  name: string;
  paramSize: string;
  category: string;
} | null;

export interface SupervisedFineTuningConfigProps {
  model: SupervisedFineTuningModelSummary;
  batchSize: number;
  onValidationChange?: (valid: boolean) => void;
  onOpenExtensionManagement?: () => void;
  enabledExtensions?: EnabledFineTuningExtension[];
}

type RunMode = "single" | "distributed";
type ConfigureMode = "auto" | "custom";
type NodeRole = "Parameter Server" | "Worker";

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
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 34,
  padding: "0 10px",
  border: `1px solid ${C.line}`,
  borderRadius: 6,
  background: "#fff",
  color: C.ink,
  fontSize: 12.5,
  outline: "none",
  boxSizing: "border-box",
};

function SegmentedControl<T extends string>({
  ariaLabel, value, options, onChange,
}: { ariaLabel: string; value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void }) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: "inline-flex", padding: 2, border: `1px solid ${C.line}`, borderRadius: 8, background: "#f5f7fa" }}>
      {options.map(option => {
        const active = option.value === value;
        return <button key={option.value} type="button" aria-pressed={active} onClick={() => onChange(option.value)} style={{ minWidth: 80, height: 28, padding: "0 12px", border: 0, borderRadius: 6, background: active ? "#fff" : "transparent", boxShadow: active ? "0 1px 3px rgba(17,24,39,.08)" : "none", color: active ? C.primary : C.muted, fontSize: 12, fontWeight: active ? 600 : 500, cursor: "pointer" }}>{option.label}</button>;
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label style={{ display: "block", minWidth: 0 }}><span style={{ display: "block", marginBottom: 6, color: C.text, fontSize: 12, fontWeight: 500 }}>{label}</span>{children}</label>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} style={{ width: 38, height: 21, padding: 2, border: 0, borderRadius: 99, background: checked ? C.primary : "#cbd1db", cursor: "pointer", transition: "background .15s" }}><span style={{ display: "block", width: 17, height: 17, marginLeft: checked ? 17 : 0, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)", transition: "margin .15s" }} /></button>;
}

function GpuNode({ name, gpus, role, link }: { name: string; gpus: GpuInfo[]; role?: NodeRole; link: string }) {
  const statusColor = (s: GpuStatus) => s === "idle" ? { border: "#86dba6", bg: "#eafaf0", text: "#16a34a" } : s === "allocated" ? { border: "#d5dbe5", bg: "#f3f4f6", text: "#9ca3af" } : { border: "#fecaca", bg: "#fef2f2", text: "#dc2626" };
  return (
    <article style={{ minWidth: 0, padding: 10, border: `1px solid ${C.line}`, borderRadius: 7, background: "#fff", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}><b style={{ display: "block", color: C.ink, fontSize: 11.5, fontWeight: 600 }}>{name}</b><span style={{ display: "block", marginTop: 2, color: C.faint, fontSize: 9.5 }}>{link}</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flex: "0 0 auto" }}>{role && <span style={{ padding: "2px 6px", borderRadius: 4, background: role === "Parameter Server" ? C.primarySoft : C.greenSoft, color: role === "Parameter Server" ? C.primary : C.green, fontSize: 9.5, fontWeight: 600 }}>{role === "Parameter Server" ? "PS" : "Worker"}</span>}<span style={{ padding: "2px 6px", borderRadius: 4, background: C.greenSoft, color: C.green, fontSize: 9.5, fontWeight: 600 }}>{gpus.length} GPU</span></div>
      </div>
      <div style={{ marginTop: 9, position: "relative" }}>
        <div aria-hidden="true" style={{ height: 3, margin: "0 2px 5px", borderRadius: 99, background: "linear-gradient(90deg, #8ea2fa, #4f6ef7)" }} />
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${gpus.length},minmax(0,1fr))`, gap: 4 }}>
          {gpus.map(g => { const c = statusColor(g.status); return <span key={g.id} title={`GPU ${g.id} · ${g.model} · ${g.status}`} style={{ minWidth: 0, height: 25, display: "grid", placeItems: "center", border: `1px solid ${c.border}`, borderRadius: 4, background: c.bg, color: c.text, fontSize: 9, fontWeight: 650, cursor: "default" }}>{g.id}</span>; })}
        </div>
      </div>
    </article>
  );
}

type GpuStatus = "idle" | "allocated" | "unavailable";
type GpuInfo = { id: number; model: string; memory: string; status: GpuStatus; nvlinkPeers: number[]; pcieRoot: string; numaNode: number };
type NodeGpuInfo = { name: string; ip: string; gpus: GpuInfo[]; fabric: string };

type GpuAllocationPlan = {
  nodes: Array<{ name: string; gpus: GpuInfo[]; role: NodeRole }>;
  summary: string; fabric: string; detail: string[];
};

/** HAMi 拓扑数据 mock：模拟 kube-scheduler 通过 HAMi device-plugin 上报的 GPU 拓扑 */
function fetchClusterTopology(nodeCount: number, gpusPerNode: number): NodeGpuInfo[] {
  const nodes: NodeGpuInfo[] = [];
  const fabrics = ["fabric-01", "fabric-02", "fabric-03"];
  for (let n = 0; n < nodeCount; n++) {
    const gpus: GpuInfo[] = [];
    for (let g = 0; g < gpusPerNode; g++) {
      // 模拟：第 7 个 GPU 故障，第 2 个 GPU 被其他任务占用（多节点时首节点）
      const isUnavailable = g === 7;
      const isAllocated = !isUnavailable && n === 0 && g === 2;
      gpus.push({ id: g, model: "A100-SXM4-80GB", memory: "80GB", status: isUnavailable ? "unavailable" : isAllocated ? "allocated" : "idle", nvlinkPeers: [Math.max(0, g - 1), Math.min(gpusPerNode - 1, g + 1)], pcieRoot: g < 4 ? "PCIe Gen4 Root 0" : "PCIe Gen4 Root 1", numaNode: g < 4 ? 0 : 1 });
    }
    nodes.push({ name: `a100-node${String(n + 1).padStart(2, "0")}`, ip: `192.168.12.2${n + 1}`, gpus, fabric: fabrics[n % 3] });
  }
  return nodes;
}

/** HAMi 拓扑感知分配：优先同 fabric → NVLink 连续空闲 GPU → 首节点 PS */
function generateAllocation(nodeCount: number, gpusPerNode: number, multiNode: boolean): GpuAllocationPlan {
  const topology = fetchClusterTopology(nodeCount, gpusPerNode);
  const fabric = topology[0].fabric;
  const needPerNode = gpusPerNode;
  const planNodes = topology.map((node, i) => {
    const role: NodeRole = multiNode && i === 0 ? "Parameter Server" : "Worker";
    // 按 NVLink 连续优先选择空闲 GPU，跳过已占用和故障
    const idle = node.gpus.filter(g => g.status === "idle");
    const selected = idle.slice(0, needPerNode);
    return { ...node, gpus: selected, role };
  });
  const detail = multiNode
    ? [`已扫描 ${nodeCount} 个节点，同交换域 ${fabric}（优先）。`, `拓扑感知选择：优先 NVLink 连续空闲 GPU，排除已占用和故障卡。`, `首节点(${planNodes[0].name})作为 PS 承载梯度聚合。`]
    : [`单节点 ${gpusPerNode} GPU，NVLink 域内分配。`, `跳过故障 GPU，优先连续 NVLink 空闲卡。`];
  return { nodes: planNodes, fabric, summary: multiNode ? `${nodeCount} 节点 × ${gpusPerNode} GPU · 同交换域 ${fabric} · 拓扑感知分配` : `1 节点 × ${gpusPerNode} GPU · NVLink 域内分配`, detail };
}

export function SupervisedFineTuningConfig({ model, onValidationChange, onOpenExtensionManagement, enabledExtensions }: SupervisedFineTuningConfigProps) {
  const parameterBillions = Number.parseFloat(model?.paramSize ?? "32") || 32;
  const [configureMode, setConfigureMode] = useState<ConfigureMode>("auto");
  const [nodes, setNodes] = useState(2);
  const [gpusPerNode, setGpusPerNode] = useState(8);
  const [draftNodes, setDraftNodes] = useState(2);
  const [draftGpusPerNode, setDraftGpusPerNode] = useState(8);
  const [backend, setBackend] = useState("NCCL");
  const [gangEnabled, setGangEnabled] = useState(true);
  const [gangTimeout, setGangTimeout] = useState(10);
  const [gangRetries, setGangRetries] = useState(2);
  const [allocationConfirmed, setAllocationConfirmed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [extToggles, setExtToggles] = useState<Record<string, boolean>>({});
  const [topologyGenerated, setTopologyGenerated] = useState(false);
  const [nodeRoles, setNodeRoles] = useState<NodeRole[]>(["Parameter Server", "Worker"]);
  const [communicationOpen, setCommunicationOpen] = useState(false);
  const [transport, setTransport] = useState("RDMA");
  const [compression, setCompression] = useState("不压缩");
  const [compressionThreshold, setCompressionThreshold] = useState(4);
  const [gradientPriority, setGradientPriority] = useState(true);
  const [bandwidthPolicy, setBandwidthPolicy] = useState<"梯度优先" | "均衡" | "CheckPoint优先">("梯度优先");
  const [commDialogOpen, setCommDialogOpen] = useState(false);
  const [distributedCollapsed, setDistributedCollapsed] = useState(true);

  const recommendation = useMemo(() => {
    return { nodes: parameterBillions >= 60 ? 4 : 2, gpusPerNode: 8, backend: "NCCL" };
  }, [parameterBillions]);

  const effectiveNodes = configureMode === "auto" ? recommendation.nodes : nodes;
  const effectiveGpusPerNode = configureMode === "auto" ? recommendation.gpusPerNode : gpusPerNode;
  const effectiveBackend = configureMode === "auto" ? recommendation.backend : backend;
  const multiNode = effectiveNodes > 1;
  const totalGpus = effectiveNodes * effectiveGpusPerNode;
  const allocationPlan = useMemo(() => generateAllocation(effectiveNodes, effectiveGpusPerNode, multiNode), [effectiveNodes, effectiveGpusPerNode, multiNode]);
  const valid = effectiveNodes >= 1 && effectiveGpusPerNode >= 1 && (!multiNode || gangTimeout >= 1) && gangRetries >= 0;
  useEffect(() => onValidationChange?.(valid), [onValidationChange, valid]);

  const changeInteger = (setter: (v: number) => void, min: number, max: number) => (e: ChangeEvent<HTMLInputElement>) => { const p = Number(e.target.value); setter(Math.min(max, Math.max(min, Number.isFinite(p) ? p : min))); };
  const layoutLabel = multiNode ? `${effectiveNodes} 节点 × ${effectiveGpusPerNode} GPU` : `1 节点 × ${effectiveGpusPerNode} GPU`;
  const topologyLabel = multiNode ? "节点内 NVLink · 节点间 RDMA" : "节点内 NVLink";
  const generateTopology = () => { setNodeRoles(Array.from({ length: Math.min(effectiveNodes, 4) }, (_, i) => i === 0 && multiNode ? "Parameter Server" : "Worker")); setTopologyGenerated(true); };
  const updateNodeRole = (i: number, role: NodeRole) => setNodeRoles(c => c.map((v, idx) => idx === i ? role : v));

  const orderedExtensions = [...(enabledExtensions?.length ? enabledExtensions : DEFAULT_ENABLED_FINE_TUNING_EXTENSIONS)].sort((a, b) => EXT_STAGE_ORDER.indexOf(a.type) - EXT_STAGE_ORDER.indexOf(b.type));
  const algoExtActive = orderedExtensions.some(e => e.type === "微调算法" && extToggles[e.id] !== false);

  return (
<>
<style>{`@media (max-width: 640px) {
  .sft-extension-row { display: grid !important; grid-template-columns: minmax(0, 1fr) auto; align-items: start !important; gap: 8px 10px !important; }
  .sft-extension-stage { grid-column: 1; grid-row: 1; align-self: center; width: max-content; }
  .sft-extension-action { grid-column: 2; grid-row: 1; }
  .sft-extension-copy { grid-column: 1 / -1; grid-row: 2; }
}`}</style>
<section style={{ marginBottom: 20, minWidth: 0, overflow: "hidden", border: `1px solid ${C.line}`, borderRadius: 8, background: "#fff" }}>
<header style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.lineSoft}`, background: C.panel }}>
<span style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 7, background: C.primarySoft, color: C.primary }}><Puzzle size={16} /></span>
<div style={{ minWidth: 0, flex: 1 }}><b style={{ display: "block", color: C.ink, fontSize: 13, fontWeight: 650 }}>已启用扩展（{orderedExtensions.length}）</b><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 11 }}>默认用于本次训练，可按任务逐项关闭。</span></div>
<button type="button" onClick={onOpenExtensionManagement} style={{ height: 30, padding: "0 12px", border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", color: C.primary, fontSize: 11.5, fontWeight: 600, cursor: "pointer", flex: "0 0 auto" }}>管理扩展</button>
</header>
<div style={{ padding: 12 }}>
{orderedExtensions.length === 0 ? (
<div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, border: `1px dashed ${C.line}`, borderRadius: 7, background: "#fafbfd", color: C.faint, fontSize: 11 }}>暂未启用扩展，可在框架扩展页完成验证与启用后回到此处使用。</div>
) : (
<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
{orderedExtensions.map(e => {
const on = extToggles[e.id] !== false;
return (
<div className="sft-extension-row" key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", border: `1px solid ${C.lineSoft}`, borderRadius: 7, background: on ? "#fbfcfe" : "#f8f9fb" }}>
<span className="sft-extension-stage" style={{ padding: "2px 7px", borderRadius: 4, background: C.primarySoft, color: C.primary, fontSize: 9.5, fontWeight: 650, flex: "0 0 auto", whiteSpace: "nowrap" }}>{EXT_STAGE[e.type]}</span>
<div className="sft-extension-copy" style={{ minWidth: 0, flex: 1 }}>
<b style={{ color: C.ink, fontSize: 11.5 }}>{e.name} <span style={{ color: C.faint, fontWeight: 400 }}>{e.version}</span></b>
<span style={{ display: "block", marginTop: 1, color: C.faint, fontSize: 10, lineHeight: 1.55, overflowWrap: "anywhere" }}>{e.type} · 参数 {Object.entries(e.parameters).map(([k, v]) => `${k}=${v}`).join(" · ") || "无"}</span>
</div>
<div className="sft-extension-action" style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
<span style={{ color: on ? C.green : C.faint, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap" }}>{on ? "本次任务启用" : "本次任务关闭"}</span>
<Toggle checked={on} onChange={v => setExtToggles(t => ({...t, [e.id]: v}))} label={`启用 ${e.name}`} />
</div>
</div>
);
})}
{algoExtActive && (
<div style={{ padding: "9px 11px", borderRadius: 7, background: "#fffbeb", color: "#d97706", fontSize: 11, lineHeight: 1.55 }}>已注入微调算法扩展，本次任务的训练策略阶段将由该扩展执行，替代内置训练方式。</div>
)}
</div>
)}
</div>
</section>
<section style={{ marginBottom: 20, minWidth: 0, overflow: "hidden", border: `1px solid ${C.line}`, borderRadius: 8, background: "#fff" }}>
<header onClick={() => setDistributedCollapsed(v => !v)} style={{ minHeight: 58, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: distributedCollapsed ? "none" : `1px solid ${C.lineSoft}`, background: C.panel, cursor: "pointer", userSelect: "none" }}>
<span style={{ width: 32, height: 32, display: "grid", placeItems: "center", flex: "0 0 auto", borderRadius: 7, background: C.primarySoft, color: C.primary }}><Network size={16} /></span>
<div style={{ minWidth: 180, flex: "1 1 260px" }}><div style={{ color: C.ink, fontSize: 13, fontWeight: 650 }}>高级配置</div><div style={{ marginTop: 2, color: C.muted, fontSize: 11.5 }}>按模型规模与 GPU 拓扑推荐资源，提交前确认分配方案。</div></div>
<span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 5, background: C.greenSoft, color: C.green, fontSize: 11, fontWeight: 600 }}><CheckCircle2 size={12} />资源可用</span>
<span style={{ color: C.faint, transition: "transform .2s", transform: distributedCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}><ChevronDown size={16} /></span>
</header>
{!distributedCollapsed && (
<div style={{ padding: 14 }}>
<div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
<SegmentedControl ariaLabel="资源配置方式" value={configureMode} options={[{ value: "auto", label: "自动推荐" }, { value: "custom", label: "自定义" }]} onChange={v => { setConfigureMode(v); setAllocationConfirmed(false); if (v === "custom") { setDraftNodes(nodes); setDraftGpusPerNode(gpusPerNode); } }} />
</div>
{configureMode === "custom" && (
<>
<div className="sft-config-grid" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
<Field label="节点数"><input aria-label="节点数" type="number" min={2} max={64} value={draftNodes} onChange={changeInteger(setDraftNodes, 2, 64)} style={inputStyle} /></Field>
<Field label="每节点 GPU"><input aria-label="每节点 GPU 数" type="number" min={1} max={16} value={draftGpusPerNode} onChange={changeInteger(setDraftGpusPerNode, 1, 16)} style={inputStyle} /></Field>
<Field label="通信后端"><select aria-label="通信后端" value={backend} onChange={e => setBackend(e.target.value)} style={inputStyle}><option>NCCL</option><option>Gloo</option></select></Field>
</div>
<div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
  <button type="button" onClick={() => { setNodes(draftNodes); setGpusPerNode(draftGpusPerNode); setAllocationConfirmed(false); }} style={{ height: 31, padding: "0 14px", border: 0, borderRadius: 6, background: C.primary, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>保存</button>
</div>
</>
)}
<div className="sft-recommendation-grid" style={{ marginTop: 12, padding: 11, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8, border: "1px solid #dce3ff", borderRadius: 7, background: C.primarySoft }}>
{[{ label: "总 GPU", value: `${totalGpus} 张`, icon: <Cpu size={14} /> }, { label: "资源布局", value: layoutLabel, icon: <Server size={14} /> }, { label: "推荐拓扑", value: topologyLabel, icon: <Network size={14} /> }, { label: "通信后端", value: effectiveBackend, icon: <ShieldCheck size={14} /> }].map(item => (
<div key={item.label} style={{ minWidth: 0, display: "grid", gridTemplateColumns: "18px minmax(0,1fr)", gap: 5 }}><span style={{ color: C.primary }}>{item.icon}</span><span style={{ minWidth: 0 }}><span style={{ display: "block", color: C.faint, fontSize: 10.5 }}>{item.label}</span><b style={{ display: "block", marginTop: 3, color: C.ink, fontSize: 11.5, fontWeight: 600, lineHeight: 1.4 }}>{item.value}</b></span></div>
))}
</div>
<section style={{ marginTop: 12, padding: 12, border: `1px solid ${C.line}`, borderRadius: 7, background: C.panel }}>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
<div><b style={{ color: C.ink, fontSize: 12, fontWeight: 600 }}>GPU 分配预览</b><div style={{ marginTop: 2, color: C.muted, fontSize: 10.5 }}>HAMi 按 NVLink 与节点网络拓扑选择空闲 GPU。</div></div>
<div style={{ display: "flex", alignItems: "center", gap: 8 }}>{allocationConfirmed && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.green, fontSize: 10.5, fontWeight: 600 }}><CheckCircle2 size={12} />已确认，将随任务提交</span>}<button type="button" onClick={() => setPreviewOpen(true)} style={{ height: 31, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${C.primary}`, borderRadius: 6, background: C.primary, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}><Cpu size={13} />查看 GPU 分配预览</button></div>
</div>
</section>
{previewOpen && (
<div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,.45)", padding: 20 }} onClick={() => setPreviewOpen(false)}>
<div style={{ width: "min(780px, 100%)", maxHeight: "85vh", overflow: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 24px 64px rgba(17,24,39,.25)", padding: 18 }} onClick={e => e.stopPropagation()}>
<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 7, background: C.primarySoft, color: C.primary }}><Cpu size={16} /></span><div><b style={{ display: "block", color: C.ink, fontSize: 14, fontWeight: 650 }}>GPU 分配预览</b><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 11 }}>HAMi 拓扑感知 · {allocationPlan.summary}</span></div></div><button onClick={() => setPreviewOpen(false)} style={{ flex: "0 0 auto", width: 28, height: 28, display: "grid", placeItems: "center", border: 0, borderRadius: 6, background: C.panel, color: C.muted, cursor: "pointer" }}><X size={15} /></button></div>
<div style={{ position: "relative" }}><div aria-hidden="true" style={{ position: "absolute", top: 40, left: 0, right: 0, height: 2, background: C.primary, opacity: .35 }} /><div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(allocationPlan.nodes.length, 2)},minmax(0,1fr))`, gap: 9, position: "relative" }}>{allocationPlan.nodes.map(node => <div key={node.name} style={{ position: "relative", zIndex: 1 }}><GpuNode name={node.name} gpus={node.gpus} role={node.role} link={node.role === "Parameter Server" ? "聚合与参数同步 · NVLink 域" : "梯度计算与传输 · NVLink 域"} /></div>)}</div></div>
<div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", color: C.faint, fontSize: 10.5 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 22, height: 3, borderRadius: 99, background: C.primary }} />节点间 InfiniBand 400 Gbps</span><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 22, height: 3, borderRadius: 99, background: "#8ea2fa" }} />GPU 间 NVLink 600 GB/s</span><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 22, height: 1, background: "#c7cdd8" }} />GPU 与 PCIe Root</span></div>
<div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap", color: C.faint, fontSize: 10.5 }}>
<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, border: "1px solid #86dba6", background: "#eafaf0" }} />空闲 GPU</span>
<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, border: "1px solid #d5dbe5", background: "#f3f4f6" }} />已占用</span>
<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 3, border: "1px solid #fecaca", background: "#fef2f2" }} />不可用</span>
</div>
<div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}><button onClick={() => { setAllocationConfirmed(true); setPreviewOpen(false); }} style={{ height: 31, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 6, border: 0, borderRadius: 6, background: C.primary, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}><Check size={13} />确认分配方案</button></div>
</div>
</div>
)}
<section style={{ marginTop: 12, padding: 12, border: `1px solid ${C.line}`, borderRadius: 7, background: "#fff" }}>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
<div style={{ minWidth: 180, flex: "1 1 320px" }}><b style={{ display: "block", color: C.ink, fontSize: 12, fontWeight: 600 }}>逻辑训练拓扑</b><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 10.5 }}>{model?.name ?? "已选模型"} · 训练目标：有监督微调</span></div>
{!topologyGenerated && <button type="button" onClick={generateTopology} style={{ height: 31, padding: "0 11px", display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${C.primary}`, borderRadius: 6, background: C.primary, color: "#fff", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}><WandSparkles size={13} />生成训练拓扑</button>}
</div>
{topologyGenerated ? (
<><div style={{ marginTop: 11, padding: 10, display: "flex", alignItems: "stretch", gap: 8, overflowX: "auto", border: `1px solid ${C.lineSoft}`, borderRadius: 7, background: C.panel }}>
{nodeRoles.map((role, i) => (
<div key={i} style={{ display: "contents" }}>{i > 0 && <span style={{ minWidth: 38, display: "grid", placeItems: "center", color: C.primary }}><ArrowRight size={18} /></span>}
<article style={{ minWidth: 180, flex: "1 1 0", padding: 10, border: `1px solid ${role === "Parameter Server" ? "#cbd5ff" : "#cfe9d8"}`, borderRadius: 7, background: "#fff" }}>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><div><b style={{ display: "block", color: C.ink, fontSize: 11.5, fontWeight: 650 }}>a100-node{String(i + 1).padStart(2, "0")}</b><span style={{ display: "block", marginTop: 2, color: C.faint, fontSize: 9.5 }}>{role === "Parameter Server" ? "聚合与参数同步" : "梯度计算与传输"}</span></div><Network size={14} color={role === "Parameter Server" ? C.primary : C.green} /></div>
<select aria-label={`节点 ${i + 1} 角色`} value={role} onChange={e => updateNodeRole(i, e.target.value as NodeRole)} style={{ ...inputStyle, height: 30, marginTop: 8, fontSize: 11 }}><option>Parameter Server</option><option>Worker</option></select>
</article></div>
))}
</div><p role="status" style={{ margin: "8px 0 0", color: C.muted, fontSize: 10.5 }}>仅允许调整节点角色；调整会实时更新拓扑。</p></>
) : <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 6, background: C.panel, color: C.muted, fontSize: 10.5 }}>系统将根据已扫描资源与网络拓扑生成节点角色和通信路径。</div>}
</section>
<div style={{ marginTop: 12, padding: "9px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", border: `1px solid ${C.line}`, borderRadius: 7, background: "#fff" }}>
<div style={{ minWidth: 0, flex: 1 }}><b style={{ display: "block", color: C.ink, fontSize: 12, fontWeight: 600 }}>节点通信策略</b><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 10.5 }}>{effectiveBackend} · {transport} · {compression} · 带宽分配：{bandwidthPolicy}</span></div>
<button type="button" onClick={() => setCommDialogOpen(true)} style={{ height: 31, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", color: C.primary, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}><ShieldCheck size={13} />配置</button>
</div>

{commDialogOpen && (
<div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,24,39,.45)", padding: 20 }} onClick={() => setCommDialogOpen(false)}>
<div style={{ width: "min(560px, 100%)", maxHeight: "80vh", overflow: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 24px 64px rgba(17,24,39,.25)", padding: 18 }} onClick={e => e.stopPropagation()}>
<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
<div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 7, background: C.primarySoft, color: C.primary }}><Network size={16} /></span><div><b style={{ display: "block", color: C.ink, fontSize: 14, fontWeight: 650 }}>通信策略</b><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 11 }}>配置传输协议、压缩算法与带宽分配</span></div></div>
<button onClick={() => setCommDialogOpen(false)} style={{ flex: "0 0 auto", width: 28, height: 28, display: "grid", placeItems: "center", border: 0, borderRadius: 6, background: C.panel, color: C.muted, cursor: "pointer" }}><X size={15} /></button>
</div>

<Field label="通信后端"><input readOnly value={effectiveBackend} style={{ ...inputStyle, background: "#f3f4f6", color: C.muted }} /></Field>
<div style={{ marginTop: 12 }}><Field label="传输协议"><select value={transport} onChange={e => setTransport(e.target.value)} style={inputStyle}><option>RDMA</option><option>TCP</option></select></Field></div>

<div style={{ marginTop: 12 }}><Field label="压缩算法"><select value={compression} onChange={e => setCompression(e.target.value)} style={inputStyle}><option>不压缩（推荐）</option><option>FP16 压缩</option><option>8-bit 量化压缩</option></select></Field></div>

{compression === "8-bit 量化压缩" && (
<div style={{ marginTop: 12 }}><Field label="压缩阈值"><select value={compressionThreshold} onChange={e => setCompressionThreshold(Number(e.target.value))} style={inputStyle}>{[1, 4, 16, 64].map(v => <option key={v} value={v}>{v} MB</option>)}</select></Field></div>
)}

<div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.lineSoft}` }}>
<Field label="带宽分配策略"><select value={bandwidthPolicy} onChange={e => setBandwidthPolicy(e.target.value as "梯度优先" | "均衡" | "CheckPoint优先")} style={inputStyle}><option>梯度优先</option><option>均衡</option><option>CheckPoint优先</option></select></Field>
<div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 6, background: C.primarySoft, color: C.text, fontSize: 10.5, lineHeight: 1.65 }}>{bandwidthPolicy === "梯度优先" ? "梯度同步（高）· Checkpoint（中）· 日志监控（低）" : bandwidthPolicy === "均衡" ? "梯度同步（中）· Checkpoint（中）· 日志监控（中）" : "梯度同步（中）· Checkpoint（高）· 日志监控（低）"}</div>
</div>

<div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}><button onClick={() => setCommDialogOpen(false)} style={{ height: 31, padding: "0 14px", border: `1px solid ${C.line}`, borderRadius: 6, background: "#fff", color: C.muted, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>确定</button></div>
</div>
</div>
)}
{multiNode && (
<section style={{ marginTop: 12, padding: 12, border: `1px solid ${C.line}`, borderRadius: 7, background: "#fff" }}>
<div style={{ display: "flex", alignItems: "center", gap: 10 }}><Toggle checked={gangEnabled} onChange={setGangEnabled} label="启用 Gang Scheduling" /><div style={{ minWidth: 0, flex: 1 }}><b style={{ color: C.ink, fontSize: 12, fontWeight: 600 }}>Gang Scheduling</b><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 10.5 }}>由 Volcano 保证全部 Worker 同时获取资源后启动。</span></div><span style={{ padding: "2px 7px", borderRadius: 5, background: gangEnabled ? C.greenSoft : "#f3f4f6", color: gangEnabled ? C.green : C.muted, fontSize: 10.5, fontWeight: 600 }}>{gangEnabled ? "已启用" : "已关闭"}</span></div>
<div className="sft-gang-grid" style={{ marginTop: 11, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,220px))", gap: 12 }}><Field label="等待超时（分钟）"><input type="number" min={1} max={120} disabled={!gangEnabled} value={gangTimeout} onChange={changeInteger(setGangTimeout, 1, 120)} style={{ ...inputStyle, background: gangEnabled ? "#fff" : "#f5f7fa" }} /></Field><Field label="失败重试次数"><input type="number" min={0} max={10} disabled={!gangEnabled} value={gangRetries} onChange={changeInteger(setGangRetries, 0, 10)} style={{ ...inputStyle, background: gangEnabled ? "#fff" : "#f5f7fa" }} /></Field></div>
</section>
)}

        <section style={{ marginTop: 12, overflow: "hidden", border: `1px solid ${C.line}`, borderRadius: 8, background: "#fff" }}>
          <header style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.lineSoft}`, background: C.panel }}>
            <span style={{ width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 7, background: C.primarySoft, color: C.primary }}><Zap size={16} /></span>
            <div><b style={{ display: "block", color: C.ink, fontSize: 13, fontWeight: 650 }}>集群资源监控</b><span style={{ display: "block", marginTop: 2, color: C.muted, fontSize: 11 }}>a100-prod-cluster · 3 节点 · 12 GPU</span></div>
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 5, background: C.greenSoft, color: C.green, fontSize: 11, fontWeight: 600 }}><CheckCircle2 size={12} />实时</span>
          </header>
          <div style={{ padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8, marginBottom: 12 }}>
              {[{ label: "节点数", value: "3", icon: <Server size={14} /> }, { label: "GPU", value: "12 卡", icon: <Cpu size={14} /> }, { label: "内存", value: "1.5 TB", icon: <Zap size={14} /> }, { label: "网络", value: "400 Gbps", icon: <Network size={14} /> }].map(item => (
                <div key={item.label} style={{ padding: "9px 11px", display: "flex", alignItems: "center", gap: 8, border: `1px solid ${C.lineSoft}`, borderRadius: 7, background: "#fbfcfe" }}><span style={{ color: C.primary }}>{item.icon}</span><div><span style={{ display: "block", color: C.faint, fontSize: 10 }}>{item.label}</span><b style={{ color: C.ink, fontSize: 13 }}>{item.value}</b></div></div>
              ))}
            </div>
            <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse", fontSize: 11.5, marginBottom: 12 }}>
              <thead><tr style={{ color: C.muted, background: "#f8f9fc" }}>{["节点", "CPU", "GPU", "内存", "网络带宽"].map(l => <th key={l} style={{ padding: "9px 12px", textAlign: "left", borderBottom: `1px solid ${C.lineSoft}`, fontWeight: 600 }}>{l}</th>)}</tr></thead>
              <tbody>
                {[{ n: "a100-node01", ip: "192.168.12.21", cpu: 62, cd: "60/96 核", gpu: 91, gd: "4×A100 80GB", mem: 68, md: "348/512 GB", netIn: 118, netOut: 96 },
                  { n: "a100-node02", ip: "192.168.12.22", cpu: 55, cd: "53/96 核", gpu: 86, gd: "4×A100 80GB", mem: 63, md: "323/512 GB", netIn: 110, netOut: 102 },
                  { n: "a100-node03", ip: "192.168.12.23", cpu: 39, cd: "37/96 核", gpu: 42, gd: "4×A100 80GB", mem: 48, md: "246/512 GB", netIn: 36, netOut: 28 },
                ].map((nd, i) => (
                  <tr key={nd.n}>
                    <td style={{ padding: "10px 12px", borderBottom: i < 2 ? `1px solid ${C.lineSoft}` : 0 }}><b style={{ color: C.ink, fontSize: 12 }}>{nd.n}</b><code style={{ display: "block", marginTop: 1, color: C.faint, fontSize: 10 }}>{nd.ip}</code></td>
                    <td style={{ padding: "10px 12px", borderBottom: i < 2 ? `1px solid ${C.lineSoft}` : 0 }}><b style={{ color: C.ink, fontSize: 12 }}>{nd.cpu}%</b><span style={{ display: "block", color: C.faint, fontSize: 10 }}>{nd.cd}</span></td>
                    <td style={{ padding: "10px 12px", borderBottom: i < 2 ? `1px solid ${C.lineSoft}` : 0 }}><b style={{ color: C.ink, fontSize: 12 }}>{nd.gpu}%</b><span style={{ display: "block", color: C.faint, fontSize: 10 }}>{nd.gd}</span></td>
                    <td style={{ padding: "10px 12px", borderBottom: i < 2 ? `1px solid ${C.lineSoft}` : 0 }}><b style={{ color: C.ink, fontSize: 12 }}>{nd.mem}%</b><span style={{ display: "block", color: C.faint, fontSize: 10 }}>{nd.md}</span></td>
                    <td style={{ padding: "10px 12px", borderBottom: i < 2 ? `1px solid ${C.lineSoft}` : 0 }}><span style={{ color: C.faint }}>入</span> {nd.netIn} / <span style={{ color: C.faint }}>出</span> {nd.netOut} Gbps</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: 12, border: `1px solid ${C.lineSoft}`, borderRadius: 7, background: "#fcfdff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", color: C.faint, fontSize: 9.5, marginBottom: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 18, height: 3, borderRadius: 99, background: C.primary }} />节点间 InfiniBand</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 18, height: 3, borderRadius: 99, background: "#8ea2fa" }} />GPU 间 NVLink</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 18, height: 1, background: "#c7cdd8" }} />GPU ↔ PCIe Root</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
                {["a100-node01", "a100-node02", "a100-node03"].map((n, i) => (
                  <div key={n} style={{ padding: 10, border: `1px solid ${C.lineSoft}`, borderRadius: 7, background: "#fff" }}>
                    <b style={{ display: "block", color: C.ink, fontSize: 11, textAlign: "center" }}>{n}</b>
                    <code style={{ display: "block", color: C.faint, fontSize: 9, textAlign: "center", marginTop: 2 }}>192.168.12.2{i + 1}</code>
                    <div style={{ marginTop: 7, padding: "3px 0", textAlign: "center", border: "1px solid #dfe3eb", borderRadius: 4, color: C.muted, background: "#f5f7fa", fontSize: 9 }}>PCIe Gen4 Root</div>
                    <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 3 }}>
                      {[0, 1, 2, 3].map(g => <span key={g} style={{ height: 22, display: "grid", placeItems: "center", border: "1px solid #cbd5ff", borderRadius: 4, background: "#f7f9ff", color: C.primary, fontSize: 8.5, fontWeight: 650 }}>GPU {g}</span>)}
                    </div>
                    <div style={{ marginTop: 6, textAlign: "center", color: C.muted, fontSize: 9 }}><span style={{ display: "inline-block", width: 14, height: 2, borderRadius: 99, background: "#8ea2fa", verticalAlign: "middle", marginRight: 4 }} />NVLink 600 GB/s</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, color: C.faint, fontSize: 10.5 }}><Clock3 size={12} />预计资源等待约 8 分钟，预计训练 2 小时 10 分。</div>
</div>
)}
</section>
</>
  );
}
