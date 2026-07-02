import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, RotateCcw, Pencil, Trash2, X } from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────

type InstanceStatus = "Running" | "Pending" | "Failed" | "Stopped";

interface DeployInstance {
  id: string;
  name: string;
  status: InstanceStatus;
  createdAt: string;
}

interface DeployGroup {
  id: string;
  name: string;
  modelType: string;         // e.g. LLM, Speech-To-Text
  resourceGroup: string;     // 资源组
  source: string;            // 来源 (Hugging Face path)
  replicasRunning: number;
  replicasTotal: number;
  createdAt: string;
  instances: DeployInstance[];
}

const STATUS_CFG: Record<InstanceStatus, { bg: string; color: string }> = {
  "Running": { bg: "#f0faf5", color: "#16a34a" },
  "Pending": { bg: "#eff6ff", color: "#2563eb" },
  "Failed":  { bg: "#fef2f2", color: "#dc2626" },
  "Stopped": { bg: "#f3f4f6", color: "#6b7280" },
};

const TYPE_CFG: Record<string, { bg: string; color: string }> = {
  "LLM":            { bg: "#eff4ff", color: "#4f6ef7" },
  "Speech-To-Text": { bg: "#f0fdf4", color: "#16a34a" },
  "Embedding":      { bg: "#faf5ff", color: "#7c3aed" },
  "Vision":         { bg: "#fff7ed", color: "#c2410c" },
};

const GROUPS_INIT: DeployGroup[] = [
  {
    id: "g1", name: "qwen3.6-27b", modelType: "LLM", resourceGroup: "测试1",
    source: "Hugging Face/Qwen/Qwen3...", replicasRunning: 0, replicasTotal: 3,
    createdAt: "2026-06-30 14:17:42",
    instances: [
      { id: "i1", name: "qwen3.6-27b-X1xEx", status: "Pending", createdAt: "2026-07-02 10:05:00" },
      { id: "i2", name: "qwen3.6-27b-7DRSg", status: "Pending", createdAt: "2026-06-30 16:39:02" },
      { id: "i3", name: "qwen3.6-27b-2ejux", status: "Pending", createdAt: "2026-06-30 14:17:42" },
    ],
  },
  {
    id: "g2", name: "demo-whisper-large-v3", modelType: "Speech-To-Text", resourceGroup: "测试1",
    source: "Hugging Face/openai/whisper...", replicasRunning: 0, replicasTotal: 3,
    createdAt: "2026-06-30 14:10:36",
    instances: [
      { id: "i4", name: "demo-whisper-large-v3-r1",    status: "Pending", createdAt: "2026-06-30 14:10:36" },
      { id: "i5", name: "demo-whisper-large-v3-than4",  status: "Pending", createdAt: "2026-06-28 09:41:32" },
      { id: "i6", name: "demo-whisper-large-v3-PNYsA",  status: "Pending", createdAt: "2026-06-28 09:41:32" },
    ],
  },
  {
    id: "g3", name: "glm-4-flash-prod", modelType: "LLM", resourceGroup: "GPU-Cluster-Prod",
    source: "Hugging Face/THUDM/glm-4...", replicasRunning: 2, replicasTotal: 2,
    createdAt: "2026-06-24 10:00:00",
    instances: [
      { id: "i7", name: "glm-4-flash-prod-a1b2c",  status: "Running", createdAt: "2026-06-24 10:05:00" },
      { id: "i8", name: "glm-4-flash-prod-d3e4f",  status: "Running", createdAt: "2026-06-24 10:05:00" },
    ],
  },
];

const RESOURCE_GROUPS = ["全部", "测试1", "GPU-Cluster-Prod", "GPU-Cluster-Test"];

// ─── More Menu ─────────────────────────────────────────────────────────────────

function GroupMoreMenu({ onStop, onClone, onDelete }: { onStop: () => void; onClone: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "#9ca3af", borderRadius: 4, display: "flex", alignItems: "center", fontSize: 16, lineHeight: 1 }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}>⋮</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", zIndex: 50, minWidth: 100, overflow: "hidden" }}>
          {[
            { label: "停止", action: onStop },
            { label: "克隆", action: onClone },
          ].map(item => (
            <button key={item.label} onClick={() => { item.action(); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#374151" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>{item.label}</button>
          ))}
          <button onClick={() => { onDelete(); setOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <Trash2 size={13} /> 删除
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export interface DeployPrefill { modelName: string; modelPath: string; classify: string; paramSize: string; contextLen: string; }

// ─── Shared form helpers ───────────────────────────────────────────────────────

const inpSt2: React.CSSProperties = { width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", color: "#1a1d23", background: "#fff", boxSizing: "border-box" as const, fontFamily: "inherit" };

function Sel2({ value, onChange, opts, placeholder }: { value: string; onChange: (v: string) => void; opts: string[]; placeholder?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inpSt2, appearance: "none", paddingRight: 26, cursor: "pointer", color: value ? "#1a1d23" : "#9ca3af" }}>
        {placeholder && <option value="">{placeholder}</option>}
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

function FL2({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
    {required && <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>}{children}
  </div>;
}

const BACKEND_OPTS = ["harbor.xxx.com/lm/vllm:v0.12.0", "harbor.xxx.com/lm/vllm:v0.11.0", "harbor.xxx.com/lm/sglang:v0.4.0", "harbor.xxx.com/lm/llama-box:v0.3.0"];
const CLASSIFY_OPTS2 = ["LLM", "Embedding", "Vision", "Speech-To-Text", "Reranker"];
const RG_OPTS2 = ["推理组", "公共组", "test", "GPU-Cluster-Prod"];

function NewDeploymentModal({ onClose, onDone, prefill }: { onClose: () => void; onDone: () => void; prefill?: DeployPrefill | null }) {
  const [name, setName]         = useState(prefill ? `${prefill.modelName}-deploy` : "");
  const [modelPath, setModelPath] = useState(prefill?.modelPath ?? "");
  const [backendVer, setBackendVer] = useState(BACKEND_OPTS[0]);
  const [resourceGroup, setRg]  = useState("推理组");
  const [classify, setClassify] = useState(prefill?.classify ?? "LLM");
  const [contextLen, setCtxLen] = useState(prefill?.contextLen ?? "32768");
  const [replicas, setReplicas] = useState(1);
  const [remark, setRemark]     = useState(prefill ? `${prefill.modelName} 模型部署（参数量 ${prefill.paramSize}）` : "");
  const [advOpen, setAdvOpen]   = useState(false);
  const [envVars, setEnvVars]   = useState<{key: string; val: string}[]>([{key: "", val: ""}]);
  const [loraList, setLoraList] = useState<string[]>([]);
  const [autoRestart, setAutoRestart] = useState(true);
  const [schedule, setSchedule] = useState("Spread（分散）");
  const [workerSel, setWorkerSel] = useState("");
  const [errs, setErrs]         = useState<Record<string, boolean>>({});

  const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 };

  const submit = () => {
    if (!name.trim()) { setErrs({ name: true }); return; }
    onDone(); onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 560, maxHeight: "90vh", background: "#fff", borderRadius: 12, zIndex: 201, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px" }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1a1d23" }}>新建部署</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: "0 20px 16px" }}>
          {/* Info banner */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, padding: "10px 14px", marginBottom: 18, fontSize: 12.5, color: "#1d4ed8", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ flexShrink: 0 }}>ℹ️</span>
            <span>仅支持本地 NFS 模型部署，权重文件存放在共享盘，镜像从 Harbor 仓库拉取。</span>
          </div>

          {/* Pre-fill hint */}
          {prefill && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, padding: "10px 14px", marginBottom: 18, fontSize: 12.5, color: "#15803d" }}>
              ✓ 已从模型「{prefill.modelName}」填入基础信息，参数量 {prefill.paramSize}，上下文 {prefill.contextLen}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <FL2 required>名称</FL2>
            <input value={name} onChange={e => { setName(e.target.value); setErrs({}); }}
              style={{ ...inpSt2, borderColor: errs.name ? "#ef4444" : "#e0e3ed" }} />
            {errs.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 3 }}>请输入部署名称</div>}
          </div>

          <div style={{ marginBottom: 14 }}>
            <FL2 required>模型路径（权重地址）</FL2>
            <input value={modelPath} onChange={e => setModelPath(e.target.value)} placeholder="/nfs/models/..."
              style={inpSt2} />
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>NFS 共享盘上的模型权重文件路径</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <FL2 required>后端版本（镜像地址）</FL2>
            <Sel2 value={backendVer} onChange={setBackendVer} opts={BACKEND_OPTS} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <FL2 required>资源组</FL2>
            <Sel2 value={resourceGroup} onChange={setRg} opts={RG_OPTS2} />
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>选择目标资源组，后端 GPU 选项显示该组内可用 GPU</div>
          </div>

          <div style={{ ...row2 }}>
            <div>
              <FL2>上下文长度</FL2>
              <input value={contextLen} onChange={e => setCtxLen(e.target.value)} style={inpSt2} />
            </div>
            <div>
              <FL2>副本数</FL2>
              <div className="flex items-center" style={{ border: "1px solid #e0e3ed", borderRadius: 6, height: 36, overflow: "hidden" }}>
                <button onClick={() => setReplicas(r => Math.max(1, r - 1))} style={{ width: 32, height: "100%", background: "#f8f9fc", border: "none", borderRight: "1px solid #e0e3ed", cursor: "pointer", fontSize: 16, color: "#6b7280" }}>−</button>
                <input type="number" value={replicas} onChange={e => setReplicas(Math.max(1, Number(e.target.value)))}
                  style={{ flex: 1, height: "100%", textAlign: "center", border: "none", outline: "none", fontSize: 14, fontWeight: 500 }} />
                <button onClick={() => setReplicas(r => r + 1)} style={{ width: 32, height: "100%", background: "#f8f9fc", border: "none", borderLeft: "1px solid #e0e3ed", cursor: "pointer", fontSize: 16, color: "#6b7280" }}>+</button>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <FL2>分类</FL2>
            <Sel2 value={classify} onChange={setClassify} opts={CLASSIFY_OPTS2} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <FL2>备注</FL2>
            <textarea value={remark} onChange={e => setRemark(e.target.value)}
              style={{ width: "100%", height: 68, padding: "8px 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" as const }} />
          </div>

          <div style={{ border: "1px solid #e8ebf2", borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setAdvOpen(o => !o)} className="flex items-center gap-2 w-full"
              style={{ padding: "11px 14px", background: "#f8f9fc", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151", textAlign: "left" }}>
              {advOpen ? <ChevronDown size={14} color="#6b7280" /> : <ChevronRight size={14} color="#6b7280" />}
              高级配置 <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 400 }}>环境变量、LoRA、调度策略…</span>
            </button>
            {advOpen && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 16 }}>

                {/* 环境变量 */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>环境变量</div>
                  {envVars.map((ev, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                      <input value={ev.key} onChange={e => setEnvVars(p => p.map((x, j) => j === i ? { ...x, key: e.target.value } : x))}
                        placeholder="变量名"
                        style={{ ...inpSt2, color: "#9ca3af" }} />
                      <input value={ev.val} onChange={e => setEnvVars(p => p.map((x, j) => j === i ? { ...x, val: e.target.value } : x))}
                        placeholder="变量值"
                        style={{ ...inpSt2, color: "#9ca3af" }} />
                    </div>
                  ))}
                  <button onClick={() => setEnvVars(p => [...p, { key: "", val: "" }])}
                    style={{ fontSize: 13, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                    <Plus size={13} /> 添加环境变量
                  </button>
                </div>

                {/* LoRA 适配器 */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>LoRA 适配器</div>
                  {loraList.map((l, i) => (
                    <input key={i} value={l} onChange={e => setLoraList(p => p.map((x, j) => j === i ? e.target.value : x))}
                      placeholder="LoRA 路径" style={{ ...inpSt2, marginBottom: 8 }} />
                  ))}
                  <button onClick={() => setLoraList(p => [...p, ""])}
                    style={{ fontSize: 13, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
                    <Plus size={13} /> 添加 LoRA
                  </button>
                </div>

                {/* 出错自动重启 */}
                <label className="flex items-center gap-2" style={{ cursor: "pointer" }}>
                  <div onClick={() => setAutoRestart(v => !v)}
                    style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${autoRestart ? "#4f6ef7" : "#d1d5db"}`, background: autoRestart ? "#4f6ef7" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {autoRestart && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5L8 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ fontSize: 13, color: "#374151" }}>出错自动重启</span>
                </label>

                {/* 调度策略 + Worker 选择器 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>调度策略</div>
                    <Sel2 value={schedule} onChange={setSchedule} opts={["Spread（分散）", "Binpack（集中）", "Random（随机）"]} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Worker 选择器</div>
                    <input value={workerSel} onChange={e => setWorkerSel(e.target.value)}
                      placeholder="标签过滤 worker 节点，如 gpu=a100"
                      style={inpSt2} />
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "14px 20px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose} style={{ height: 34, padding: "0 20px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, background: "#fff", cursor: "pointer", color: "#374151", fontWeight: 500 }}>取消</button>
          <button onClick={submit} style={{ height: 34, padding: "0 24px", fontSize: 13, border: "none", borderRadius: 7, background: "#4f6ef7", color: "#fff", cursor: "pointer", fontWeight: 500 }}>确认部署</button>
        </div>
      </div>
    </>
  );
}

export function ModelDeploymentPage({ prefill }: { prefill?: DeployPrefill | null }) {
  const [groups, setGroups]     = useState<DeployGroup[]>(GROUPS_INIT);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["g1", "g2", "g3"]));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rgFilter, setRgFilter] = useState("");
  const [rgOpen, setRgOpen]     = useState(false);
  const [showNewDeploy, setShowNewDeploy] = useState(!!prefill);
  const rgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (rgRef.current && !rgRef.current.contains(e.target as Node)) setRgOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  const deleteGroup    = (gid: string) => setGroups(prev => prev.filter(g => g.id !== gid));
  const deleteInstance = (gid: string, iid: string) =>
    setGroups(prev => prev.map(g => g.id !== gid ? g : { ...g, instances: g.instances.filter(i => i.id !== iid) }));
  const cloneGroup = (g: DeployGroup) =>
    setGroups(prev => [...prev, { ...g, id: g.id + "_clone", name: g.name + "-clone", instances: [] }]);

  const filtered = groups.filter(g => !rgFilter || g.resourceGroup === rgFilter);

  // thead styles
  const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: 12.5, fontWeight: 500, color: "#6b7280", borderBottom: "1px solid #f0f2f7", background: "#f8f9fc", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "11px 12px", fontSize: 13, borderBottom: "1px solid #f5f7fa", verticalAlign: "middle" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>模型管理</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>模型部署</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2">
            {/* 资源组 filter */}
            <div ref={rgRef} style={{ position: "relative" }}>
              <button onClick={() => setRgOpen(o => !o)} className="flex items-center gap-1.5"
                style={{ height: 32, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", cursor: "pointer", color: rgFilter ? "#1a1d23" : "#6b7280", minWidth: 110 }}>
                {rgFilter || "全部资源组"} <ChevronDown size={12} color="#9ca3af" style={{ transform: rgOpen ? "rotate(180deg)" : "none", transition: "transform .15s", marginLeft: "auto" }} />
              </button>
              {rgOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 150, overflow: "hidden" }}>
                  {RESOURCE_GROUPS.map(opt => (
                    <div key={opt} onClick={() => { setRgFilter(opt === "全部" ? "" : opt); setRgOpen(false); }}
                      style={{ padding: "9px 14px", fontSize: 13, cursor: "pointer", color: (opt === "全部" ? "" : opt) === rgFilter ? "#4f6ef7" : "#374151", background: (opt === "全部" ? "" : opt) === rgFilter ? "#f0f4ff" : "#fff" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = (opt === "全部" ? "" : opt) === rgFilter ? "#f0f4ff" : "#fff"; }}>
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setRgFilter("")}
              style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 12px", fontSize: 13, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <RotateCcw size={12} /> 重置
            </button>
          </div>
          <button onClick={() => setShowNewDeploy(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Plus size={14} /> 新建部署
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...th, width: 40 }}>
                  <input type="checkbox" style={{ accentColor: "#4f6ef7", cursor: "pointer" }} />
                </th>
                <th style={{ ...th, width: 28 }} />
                <th style={th}>名称</th>
                <th style={th}>资源组</th>
                <th style={th}>来源</th>
                <th style={th}>副本数 ⓘ</th>
                <th style={th}>创建时间</th>
                <th style={{ ...th, textAlign: "center" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td></tr>
              ) : filtered.map(group => {
                const isExp = expanded.has(group.id);
                const isSel = selected.has(group.id);
                const tc = TYPE_CFG[group.modelType] ?? { bg: "#f3f4f6", color: "#6b7280" };
                return (
                  <React.Fragment key={group.id}>
                    {/* Group row */}
                    <tr style={{ background: "#fafbfd", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f5f7ff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#fafbfd")}>
                      {/* Checkbox */}
                      <td style={{ ...td, borderBottom: "1px solid #f0f2f7" }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSel} onChange={() => toggleSelect(group.id)} style={{ accentColor: "#4f6ef7", cursor: "pointer" }} />
                      </td>
                      {/* Expand */}
                      <td style={{ ...td, borderBottom: "1px solid #f0f2f7", padding: "11px 4px" }} onClick={() => toggleExpand(group.id)}>
                        {isExp ? <ChevronDown size={14} color="#6b7280" /> : <ChevronRight size={14} color="#6b7280" />}
                      </td>
                      {/* 名称 */}
                      <td style={{ ...td, borderBottom: "1px solid #f0f2f7" }} onClick={() => toggleExpand(group.id)}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontWeight: 600, color: "#1a1d23" }}>{group.name}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 500, padding: "1px 7px", borderRadius: 4, background: tc.bg, color: tc.color }}>{group.modelType}</span>
                        </div>
                      </td>
                      {/* 资源组 */}
                      <td style={{ ...td, borderBottom: "1px solid #f0f2f7" }} onClick={() => toggleExpand(group.id)}>
                        <span style={{ fontSize: 12.5, color: "#374151" }}>{group.resourceGroup}</span>
                      </td>
                      {/* 来源 */}
                      <td style={{ ...td, borderBottom: "1px solid #f0f2f7", maxWidth: 200 }} onClick={() => toggleExpand(group.id)}>
                        <span style={{ fontSize: 12.5, color: "#6b7280", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                          {group.source}
                        </span>
                      </td>
                      {/* 副本数 */}
                      <td style={{ ...td, borderBottom: "1px solid #f0f2f7" }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontWeight: 500, color: "#1a1d23" }}>{group.replicasRunning}/{group.replicasTotal}</span>
                          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#9ca3af" }}>
                            <Pencil size={12} />
                          </button>
                        </div>
                      </td>
                      {/* 创建时间 */}
                      <td style={{ ...td, borderBottom: "1px solid #f0f2f7", color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }} onClick={() => toggleExpand(group.id)}>
                        {group.createdAt}
                      </td>
                      {/* 操作 */}
                      <td style={{ ...td, borderBottom: "1px solid #f0f2f7", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 6px", color: "#9ca3af", borderRadius: 4 }}
                            onMouseEnter={e => { (e.currentTarget.style.background = "#f3f4f6"); (e.currentTarget.style.color = "#374151"); }}
                            onMouseLeave={e => { (e.currentTarget.style.background = "none"); (e.currentTarget.style.color = "#9ca3af"); }}>
                            <Pencil size={14} />
                          </button>
                          <GroupMoreMenu
                            onStop={() => {}}
                            onClone={() => cloneGroup(group)}
                            onDelete={() => deleteGroup(group.id)}
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Instance rows */}
                    {isExp && group.instances.map(inst => {
                      const sc = STATUS_CFG[inst.status];
                      return (
                        <tr key={inst.id}
                          onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          {/* Checkbox */}
                          <td style={td}>
                            <input type="checkbox" style={{ accentColor: "#4f6ef7", cursor: "pointer", marginLeft: 0 }} />
                          </td>
                          {/* No expand */}
                          <td style={td} />
                          {/* 名称 (indented) */}
                          <td style={{ ...td, paddingLeft: 32 }}>
                            <span style={{ fontSize: 13, color: "#374151" }}>{inst.name}</span>
                          </td>
                          {/* 资源组 - empty */}
                          <td style={td} />
                          {/* 来源 - empty */}
                          <td style={td} />
                          {/* 副本数 → status */}
                          <td style={td}>
                            <span style={{ fontSize: 12.5, fontWeight: 500, padding: "3px 10px", borderRadius: 12, background: sc.bg, color: sc.color }}>
                              {inst.status === "Pending" ? "待处理" : inst.status === "Running" ? "运行中" : inst.status === "Failed" ? "失败" : "已停止"}
                            </span>
                          </td>
                          {/* 创建时间 */}
                          <td style={{ ...td, color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{inst.createdAt}</td>
                          {/* 操作 - delete only */}
                          <td style={{ ...td, textAlign: "center" }}>
                            <button onClick={() => deleteInstance(group.id, inst.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "#ef4444", borderRadius: 4 }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
                              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {filtered.length} 条</span>
          <button disabled style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", opacity: 0.4 }}>
            <ChevronDown size={13} style={{ transform: "rotate(90deg)" }} />
          </button>
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #4f6ef7", borderRadius: 5, background: "#4f6ef7", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>1</div>
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", fontSize: 12.5, color: "#374151", cursor: "pointer" }}>2</div>
          <button style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: "pointer" }}>
            <ChevronDown size={13} style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>
      </div>

      {showNewDeploy && (
        <NewDeploymentModal
          onClose={() => setShowNewDeploy(false)}
          onDone={() => setShowNewDeploy(false)}
          prefill={prefill}
        />
      )}
    </div>
  );
}
