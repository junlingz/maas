import React, { useState, useRef, useEffect } from "react";
import {
  Plus, RotateCcw, Pencil, Trash2,
  Play, Square, Copy, Activity,
} from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────

type DeployStatus = "running" | "stopped" | "pending";

interface DeployChild {
  name: string;
  status: "running" | "pending";
  createdAt: string;
}

interface DeployGroup {
  name: string;
  modelId: string;
  type: string;            // e.g. LLM, 语音识别模型
  resourceGroup: string;
  source: string;          // Hugging Face/...
  replicas: string;        // "running/configured" e.g. "0/3"
  status: DeployStatus;
  createdAt: string;
  selected: boolean;
  children: DeployChild[];
}

// Inline edit state for the replicas stepper
interface InlineEdit { running: number; configured: number; }

const RESOURCE_GROUPS = ["推理组", "测试1", "GPU-Cluster-Prod"];

const RESOURCE_GROUP_CAPACITIES: Record<string, number> = {
  "推理组": 4,
  "测试1": 10,
  "GPU-Cluster-Prod": 6,
};

// Catalog models used by the deploy modal search dropdown (mirrors prototype data)
interface CatalogModelLite {
  id: string;
  name: string;
  size: string;
  category: string;
  developer: string;
  weightPath: string;
  imagePath: string;
  description: string;
}

const CATALOG_MODELS_LITE: CatalogModelLite[] = [
  { id: "deepseek-v3",      name: "deepseek-v3",      size: "671", category: "通用大模型",   developer: "DeepSeek", weightPath: "/models/deepseek-v3",      imagePath: "harbor.xxx.com/lm/vllm:deepseek-v3",   description: "DeepSeek V3 通用大语言模型。" },
  { id: "embedding-v3",     name: "embedding-v3",     size: "0.3", category: "嵌入模型",     developer: "智谱",     weightPath: "/models/embedding-v3",     imagePath: "harbor.xxx.com/lm/embedding:v3",       description: "文本向量化模型。" },
  { id: "cogvlm-9b",        name: "cogvlm-9b",        size: "9",   category: "图片模型",     developer: "智谱",     weightPath: "/models/cogvlm-9b",        imagePath: "harbor.xxx.com/lm/vllm:cogvlm-9b",     description: "视觉语言理解模型。" },
  { id: "chatglm4-32b",     name: "chatglm4-32b",     size: "32",  category: "通用大模型",   developer: "智谱",     weightPath: "/models/chatglm4-32b",     imagePath: "harbor.xxx.com/lm/vllm:chatglm4-32b",  description: "面向对话与生成任务的通用模型。" },
  { id: "llama-3-1",        name: "LLaMA 3.1",        size: "70",  category: "通用大模型",   developer: "智谱",     weightPath: "/models/llama-3.1",        imagePath: "harbor.xxx.com/lm/vllm:llama-3.1",     description: "LLaMA 3.1 通用语言模型。" },
  { id: "baichuan-m2-plus", name: "Baichuan-M2 Plus", size: "13",  category: "通用大模型",   developer: "千问",     weightPath: "/models/baichuan-m2-plus", imagePath: "harbor.xxx.com/lm/vllm:baichuan-m2-plus", description: "百川通用大语言模型。" },
  { id: "qwen3-7b",         name: "Qwen3-7B",         size: "7",   category: "通用大模型",   developer: "千问",     weightPath: "/models/Qwen3-7B",         imagePath: "harbor.xxx.com/lm/vllm:qwen3-7b",      description: "通义千问 Qwen3 7B 模型。" },
  { id: "t1-100",           name: "T1-100",           size: "100", category: "重排模型",     developer: "千问",     weightPath: "/models/T1-100",           imagePath: "harbor.xxx.com/lm/vllm:t1-100",        description: "面向复杂任务的推理模型。" },
  { id: "whisper-large-v3", name: "whisper-large-v3", size: "1.5", category: "语音识别模型", developer: "智谱",     weightPath: "/models/whisper-large-v3", imagePath: "harbor.xxx.com/lm/vllm:whisper-v3",    description: "OpenAI Whisper Large V3 语音识别模型。" },
];

const DEPLOYMENTS_INIT: DeployGroup[] = [
  {
    name: "qwen3.6-27b", modelId: "qwen3-7b", type: "通用大模型", resourceGroup: "测试1",
    source: "Hugging Face/Qwen/Qwen3.6-27B", replicas: "0/3", status: "stopped", createdAt: "2026-06-30 14:17:42", selected: false,
    children: [
      { name: "qwen3.6-27b-X1xEx", status: "pending", createdAt: "2026-07-02 10:05:00" },
      { name: "qwen3.6-27b-7DRSg", status: "pending", createdAt: "2026-06-30 16:39:02" },
      { name: "qwen3.6-27b-2ejux", status: "pending", createdAt: "2026-06-30 14:17:42" },
    ],
  },
  {
    name: "demo-whisper-large-v3", modelId: "whisper-large-v3", type: "语音识别模型", resourceGroup: "测试1",
    source: "Hugging Face/openai/whisper-large-v3", replicas: "0/3", status: "stopped", createdAt: "2026-06-30 14:10:36", selected: false,
    children: [
      { name: "demo-whisper-large-v3-r1",    status: "pending", createdAt: "2026-06-30 14:10:36" },
      { name: "demo-whisper-large-v3-than4", status: "pending", createdAt: "2026-06-28 09:41:32" },
      { name: "demo-whisper-large-v3-PNYsA", status: "pending", createdAt: "2026-06-28 09:41:32" },
    ],
  },
  {
    name: "glm-4-flash-prod", modelId: "chatglm4-32b", type: "通用大模型", resourceGroup: "GPU-Cluster-Prod",
    source: "Hugging Face/THUDM/glm-4-flash", replicas: "2/2", status: "running", createdAt: "2026-06-24 10:00:00", selected: false,
    children: [
      { name: "glm-4-flash-prod-a1b2c", status: "running", createdAt: "2026-06-24 10:05:00" },
      { name: "glm-4-flash-prod-d3e4f", status: "running", createdAt: "2026-06-24 10:05:00" },
    ],
  },
];

const CATEGORY_OPTS = ["", "通用大模型", "嵌入模型", "图片模型", "重排模型", "语音识别模型", "语音合成模型"];
const STATUS_OPTS: { value: string; label: string }[] = [
  { value: "",         label: "全部状态" },
  { value: "running",  label: "已启用" },
  { value: "stopped",  label: "已停用" },
  { value: "pending",  label: "未就绪" },
];

function getRemaining(rg: string, deployments: DeployGroup[]): number {
  const cap = RESOURCE_GROUP_CAPACITIES[rg] || 0;
  const used = deployments.reduce((sum, d) => {
    if (d.resourceGroup !== rg) return sum;
    const parts = String(d.replicas).split("/");
    const configured = Number(parts[1] ?? parts[0]) || 0;
    return sum + configured;
  }, 0);
  return Math.max(0, cap - used);
}

function replicasConfigured(replicas: string): number {
  const parts = String(replicas).split("/");
  return parseInt(parts[1] ?? parts[0]) || 0;
}

// ─── More Menu (per deploy row) ───────────────────────────────────────────────

function DeployMoreMenu({
  status, onStart, onStop, onClone, onMonitor, onDelete,
}: {
  status: DeployStatus;
  onStart: () => void;
  onStop: () => void;
  onClone: () => void;
  onMonitor: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const itemSt: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#344054", borderRadius: 5, whiteSpace: "nowrap", fontFamily: "inherit" };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }} title="更多"
        style={{ width: 28, height: 32, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: 0, background: "transparent", color: "#98a3b3", fontSize: 21, cursor: "pointer", borderRadius: 6 }}
        onMouseEnter={e => { (e.currentTarget.style.background = "#f2f5fa"); (e.currentTarget.style.color = "#536df5"); }}
        onMouseLeave={e => { (e.currentTarget.style.background = "transparent"); (e.currentTarget.style.color = "#98a3b3"); }}>⋮</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 50, minWidth: 120, padding: 4, background: "#fff", border: "1px solid #e3e8f1", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,.12)" }}>
          {status === "running" ? (
            <button onClick={e => { e.stopPropagation(); onStop(); setOpen(false); }} style={itemSt}
              onMouseEnter={e => (e.currentTarget.style.background = "#f2f5fa")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <Square size={14} /> 停止
            </button>
          ) : (
            <button onClick={e => { e.stopPropagation(); onStart(); setOpen(false); }} style={itemSt}
              onMouseEnter={e => (e.currentTarget.style.background = "#f2f5fa")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <Play size={14} /> 启动
            </button>
          )}
          <button onClick={e => { e.stopPropagation(); onClone(); setOpen(false); }} style={itemSt}
            onMouseEnter={e => (e.currentTarget.style.background = "#f2f5fa")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <Copy size={14} /> 克隆
          </button>
          <button onClick={e => { e.stopPropagation(); onMonitor(); setOpen(false); }} style={itemSt}
            onMouseEnter={e => (e.currentTarget.style.background = "#f2f5fa")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <Activity size={14} /> 监控
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); setOpen(false); }} style={{ ...itemSt, color: "#e5484d" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fff1f1")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <Trash2 size={14} /> 删除
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Inline replica stepper ────────────────────────────────────────────────────

function ReplicaStepper({
  edit, displayVal, atMax, onChange, onConfirm, onCancel,
}: {
  edit: boolean;
  displayVal: string;
  atMax: boolean;
  onChange: (delta: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const btnSt: React.CSSProperties = { width: 22, height: 24, padding: 0, border: 0, background: "#f8fafc", color: "#667085", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 0, border: "1px solid #dce2ec", borderRadius: 5, overflow: "hidden", background: "#fff", verticalAlign: "middle" }}>
      <button type="button" onClick={e => { e.stopPropagation(); onChange(-1); }} style={btnSt}
        onMouseEnter={e => { (e.currentTarget.style.background = "#f0f4ff"); (e.currentTarget.style.color = "#4169f6"); }}
        onMouseLeave={e => { (e.currentTarget.style.background = "#f8fafc"); (e.currentTarget.style.color = "#667085"); }}>−</button>
      <span style={{ minWidth: 28, textAlign: "center", color: "#20242d", fontSize: 12, fontWeight: 600, padding: "0 1px", whiteSpace: "nowrap" }}>{displayVal}</span>
      <button type="button" disabled={atMax && !edit} onClick={e => { e.stopPropagation(); onChange(1); }} style={{ ...btnSt, ...(atMax && !edit ? { color: "#c3cad5", background: "#f6f7f9", cursor: "not-allowed" } : {}) }}
        onMouseEnter={e => { if (!(atMax && !edit)) { (e.currentTarget.style.background = "#f0f4ff"); (e.currentTarget.style.color = "#4169f6"); } }}
        onMouseLeave={e => { if (!(atMax && !edit)) { (e.currentTarget.style.background = "#f8fafc"); (e.currentTarget.style.color = "#667085"); } }}>＋</button>
      {edit && (
        <>
          <button type="button" title="确认" onClick={e => { e.stopPropagation(); onConfirm(); }} style={{ width: 22, height: 24, padding: 0, border: 0, background: "#eaf8ef", color: "#0c9d42", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#d2f0dd")} onMouseLeave={e => (e.currentTarget.style.background = "#eaf8ef")}>✓</button>
          <button type="button" title="取消" onClick={e => { e.stopPropagation(); onCancel(); }} style={{ width: 22, height: 24, padding: 0, border: 0, background: "#fff1f1", color: "#e5484d", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#ffe0e0")} onMouseLeave={e => (e.currentTarget.style.background = "#fff1f1")}>✗</button>
        </>
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, isError, onClose }: { msg: string; isError: boolean; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2000); return () => clearTimeout(t); }, [msg, onClose]);
  return (
    <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", background: isError ? "#e5484d" : "#059669", color: "#fff", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 1000, boxShadow: "0 6px 20px rgba(0,0,0,.15)" }}>{msg}</div>
  );
}

// ─── Deploy Modal ─────────────────────────────────────────────────────────────

export interface DeployPrefill { modelName: string; modelPath: string; classify: string; paramSize: string; contextLen: string; }

const inpSt: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", border: "1px solid #d5ddea", borderRadius: 7, color: "#20242d", fontSize: 14, outline: "none", background: "#fff", fontFamily: "inherit", boxSizing: "border-box" as const };

function DeployModal({
  mode, sourceName, prefill, deployments, onClose, onSubmit, showToast,
}: {
  mode: "add" | "clone" | "edit";
  sourceName: string | null;
  prefill?: DeployPrefill | null;
  deployments: DeployGroup[];
  onClose: () => void;
  onSubmit: (d: DeployGroup) => void;
  showToast: (msg: string, isError?: boolean) => void;
}) {
  const [modelId, setModelId] = useState<string>("");
  const [modelSearch, setModelSearch] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [modelPath, setModelPath] = useState("");
  const [imageAddr, setImageAddr] = useState("");
  const [remark, setRemark] = useState("");
  const [resourceGroup, setResourceGroup] = useState("");
  const [replicas, setReplicas] = useState(1);
  const [advOpen, setAdvOpen] = useState(false);
  const [placement, setPlacement] = useState("free");
  const searchRef = useRef<HTMLDivElement>(null);

  // Initialize based on mode (pre-fill from prefill prop for add, or from source deployment for clone/edit)
  useEffect(() => {
    if (mode === "add") {
      if (prefill) {
        const matched = CATALOG_MODELS_LITE.find(m => m.name === prefill.modelName || m.id === prefill.modelName);
        if (matched) {
          setModelId(matched.id);
          setModelSearch(matched.name);
          setModelPath(matched.weightPath);
          setImageAddr(matched.imagePath);
          setRemark(matched.description);
        } else {
          setModelSearch(prefill.modelName);
          setModelPath(prefill.modelPath);
          setRemark(`${prefill.modelName} 模型部署（参数量 ${prefill.paramSize}）`);
        }
      }
      setReplicas(1);
      setResourceGroup(RESOURCE_GROUPS.length === 1 ? RESOURCE_GROUPS[0] : "");
      setPlacement("free");
    } else if ((mode === "clone" || mode === "edit") && sourceName) {
      const src = deployments.find(d => d.name === sourceName);
      if (src) {
        setModelId(src.modelId);
        const m = CATALOG_MODELS_LITE.find(x => x.id === src.modelId);
        setModelSearch(m ? m.name : src.name);
        setModelPath(m ? m.weightPath : "");
        setImageAddr(m ? m.imagePath : "");
        setRemark(m ? m.description : "");
        setResourceGroup(src.resourceGroup);
        setReplicas(replicasConfigured(src.replicas));
        setPlacement("free");
      }
    }
    setAdvOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) { setDropdownOpen(false); } };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const items = modelSearch.trim()
    ? CATALOG_MODELS_LITE.filter(m => m.name.toLowerCase().includes(modelSearch.trim().toLowerCase()))
    : CATALOG_MODELS_LITE;

  const maxForRg = resourceGroup ? getRemaining(resourceGroup, deployments) : 0;

  const selectModel = (m: CatalogModelLite) => {
    setModelId(m.id);
    setModelSearch(m.name);
    setModelPath(m.weightPath);
    setImageAddr(m.imagePath);
    setRemark(m.description);
    setDropdownOpen(false);
    setActiveIdx(-1);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => (i + 1) % Math.max(items.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => (i - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && items[activeIdx]) selectModel(items[activeIdx]);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  const changeReplicas = (delta: number) => {
    const max = resourceGroup ? getRemaining(resourceGroup, deployments) : 0;
    if (max === 0) { setReplicas(0); return; }
    setReplicas(r => Math.min(max, Math.max(1, r + delta)));
  };

  const submit = () => {
    if (!modelId) { showToast("请从模型库中选择模型", true); return; }
    if (!resourceGroup) { showToast("请选择资源组", true); return; }
    const m = CATALOG_MODELS_LITE.find(x => x.id === modelId);
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    let deployName: string;
    if (mode === "edit") {
      deployName = sourceName || (m ? m.name : "deployment");
    } else if (mode === "clone") {
      const base = (m ? m.name : "deployment") + "-clone";
      deployName = base;
      let c = 1;
      while (deployments.some(d => d.name === deployName)) { c++; deployName = `${base}-${c}`; }
    } else {
      const base = m ? m.name : "deployment";
      deployName = base;
      let c = 1;
      while (deployments.some(d => d.name === deployName)) { c++; deployName = `${base}-${c}`; }
    }
    const rep = `${0}/${replicas}`;
    onSubmit({
      name: deployName,
      modelId,
      type: m ? m.category : "LLM",
      resourceGroup,
      source: m ? `Hugging Face/${m.name}` : "",
      replicas: mode === "edit" ? `${replicas}/${replicas}` : rep,
      status: mode === "edit" ? "running" : "stopped",
      createdAt: mode === "edit" ? (deployments.find(d => d.name === sourceName)?.createdAt || now) : now,
      selected: false,
      children: mode === "edit" ? (deployments.find(d => d.name === sourceName)?.children || []) : [],
    });
    showToast("部署已提交");
    onClose();
  };

  const labelSt: React.CSSProperties = { display: "block", marginBottom: 5, color: "#344054", fontSize: 13, fontWeight: 700 };
  const hintSt: React.CSSProperties = { display: "block", marginTop: 4, color: "#99a4b5", fontSize: 12, lineHeight: 1.45 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(31,38,49,.48)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(640px, calc(100vw - 32px))", maxHeight: "calc(100vh - 40px)", background: "#fff", borderRadius: 14, zIndex: 201, boxShadow: "0 20px 60px rgba(15,23,42,.26)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "16px 24px", borderBottom: "1px solid #edf0f4" }}>
          <h3 style={{ color: "#20242d", fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{mode === "add" ? "新建部署" : mode === "clone" ? "克隆部署" : "编辑部署"}</h3>
          <button onClick={onClose} aria-label="关闭" style={{ width: 28, height: 28, border: 0, borderRadius: 6, background: "transparent", color: "#9aa4b3", fontSize: 22, fontWeight: 400, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto" style={{ padding: "0 24px 20px" }}>
          {/* Model search */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 4 }}>*</span>名称（选择模型）</label>
            <div ref={searchRef} style={{ position: "relative" }}>
              <input
                value={modelSearch}
                onChange={e => { setModelSearch(e.target.value); setDropdownOpen(true); setActiveIdx(-1); setModelId(""); setModelPath(""); setImageAddr(""); setRemark(""); }}
                onFocus={() => { if (!modelId) { setDropdownOpen(true); } }}
                onKeyDown={onSearchKey}
                placeholder="输入关键词搜索模型库中的模型..."
                style={{ ...inpSt, cursor: "pointer", paddingRight: 32, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2399a4b5' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
              />
              {dropdownOpen && (
                <div style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 60, maxHeight: 220, overflowY: "auto", marginTop: 2, background: "#fff", border: "1px solid #d5ddea", borderRadius: 7, boxShadow: "0 8px 24px rgba(15,23,42,.14)" }}>
                  {items.length === 0 ? (
                    <div style={{ padding: "16px 12px", textAlign: "center", color: "#99a4b5", fontSize: 13 }}>无匹配模型</div>
                  ) : items.map((m, i) => (
                    <div key={m.id} onClick={() => selectModel(m)} style={{ padding: "9px 12px", cursor: "pointer", fontSize: 13, color: "#344054", borderBottom: "1px solid #f0f2f6", display: "flex", flexDirection: "column", gap: 2, background: i === activeIdx || m.id === modelId ? "#f0f4ff" : "#fff" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f0f4ff")} onMouseLeave={e => (e.currentTarget.style.background = i === activeIdx || m.id === modelId ? "#f0f4ff" : "#fff")}>
                      <span style={{ fontWeight: 650 }}>{m.name}</span>
                      <span style={{ color: "#99a4b5", fontSize: 12 }}>{m.size}B ｜ {m.category} ｜ {m.developer}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span style={hintSt}>从模型库中选择已有模型，自动加载基础信息</span>
          </div>

          {/* Model path */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 4 }}>*</span>模型路径（权重地址）</label>
            <input value={modelPath} readOnly placeholder="选择模型后自动带入" style={{ ...inpSt, background: "#f6f8fb", color: "#667085", cursor: "not-allowed" }} />
            <span style={hintSt}>来自模型库中的模型权重地址，不可修改</span>
          </div>

          {/* Image address */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 4 }}>*</span>模型镜像地址</label>
            <input value={imageAddr} readOnly placeholder="选择模型后自动带入" style={{ ...inpSt, background: "#f6f8fb", color: "#667085", cursor: "not-allowed" }} />
            <span style={hintSt}>来自新建模型时选择的镜像地址，不可修改</span>
          </div>

          {/* Resource group + replicas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
            <div>
              <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 4 }}>*</span>资源组</label>
              <select value={resourceGroup} onChange={e => { setResourceGroup(e.target.value); if (maxForRg === 0 && replicas > 0) setReplicas(1); }} style={{ ...inpSt, cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2399a4b5' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30 }}>
                <option value="">-- 请选择资源组 --</option>
                {RESOURCE_GROUPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <span style={hintSt}>选择目标资源组，后端 GPU 选项显示该组内可用 GPU</span>
            </div>
            <div>
              <label style={labelSt}>实例数</label>
              <div style={{ height: 38, display: "grid", gridTemplateColumns: "44px 1fr 44px", overflow: "hidden", border: "1px solid #d5ddea", borderRadius: 7, background: "#fff" }}>
                <button type="button" onClick={() => changeReplicas(-1)} disabled={replicas <= 1} style={{ border: 0, borderRight: "1px solid #d5ddea", background: "#f8fafc", color: replicas <= 1 ? "#c3cad5" : "#667085", fontWeight: 700, fontSize: 18, cursor: replicas <= 1 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { if (replicas > 1) { (e.currentTarget.style.background = "#f0f4ff"); (e.currentTarget.style.color = "#4169f6"); } }}
                  onMouseLeave={e => { if (replicas > 1) { (e.currentTarget.style.background = "#f8fafc"); (e.currentTarget.style.color = "#667085"); } }}>−</button>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#20242d", fontSize: 15 }}>{replicas}</div>
                <button type="button" onClick={() => changeReplicas(1)} disabled={!!resourceGroup && replicas >= maxForRg} style={{ border: 0, borderLeft: "1px solid #d5ddea", background: "#f8fafc", color: (!!resourceGroup && replicas >= maxForRg) ? "#c3cad5" : "#667085", fontWeight: 700, fontSize: 18, cursor: (!!resourceGroup && replicas >= maxForRg) ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { if (!(!resourceGroup || replicas >= maxForRg)) { (e.currentTarget.style.background = "#f0f4ff"); (e.currentTarget.style.color = "#4169f6"); } }}
                  onMouseLeave={e => { if (!(!resourceGroup || replicas >= maxForRg)) { (e.currentTarget.style.background = "#f8fafc"); (e.currentTarget.style.color = "#667085"); } }}>＋</button>
              </div>
              {resourceGroup && (
                <span style={{ display: "block", marginTop: 5, color: "#e5484d", fontSize: 12, lineHeight: 1.45 }}>该资源组的剩余资源最多可部署 {maxForRg} 个实例</span>
              )}
            </div>
          </div>

          {/* Remark */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>备注</label>
            <textarea value={remark} onChange={e => setRemark(e.target.value)} aria-label="备注" style={{ ...inpSt, height: 68, paddingTop: 10, resize: "none" }} />
          </div>

          {/* Advanced config */}
          <div style={{ marginTop: 20, overflow: "hidden", border: "1px solid #dce2ec", borderRadius: 8, background: "#fff" }}>
            <button onClick={() => setAdvOpen(o => !o)} style={{ width: "100%", minHeight: 40, padding: "0 16px", display: "flex", alignItems: "center", gap: 10, border: 0, background: "linear-gradient(180deg,#fafbfd,#f6f8fb)", color: "#344054", fontWeight: 700, fontSize: 13, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ color: "#677386", fontSize: 18, transform: advOpen ? "rotate(90deg)" : "rotate(0)", transition: "transform .15s", display: "inline-block" }}>›</span>
              <span>高级配置</span>
            </button>
            {advOpen && (
              <div style={{ padding: "14px 16px 4px" }}>
                <div>
                  <label style={labelSt}>放置策略</label>
                  <select value={placement} onChange={e => setPlacement(e.target.value)} style={{ ...inpSt, cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2399a4b5' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 30 }}>
                    <option value="free">自由调度</option>
                    <option value="balanced">平均分配</option>
                  </select>
                  <span style={hintSt}>自由调度：优先匹配可用资源，减少 GPU/节点上的资源碎片；平均分配：将实例分散到不同节点，可能会在单个节点上产生较多资源碎片。</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "14px 24px", borderTop: "1px solid #edf0f4", background: "rgba(255,255,255,.98)" }}>
          <button onClick={onClose} style={{ minWidth: 100, height: 38, padding: "0 16px", border: "1px solid #e0e3ed", borderRadius: 7, background: "#fff", cursor: "pointer", color: "#374151", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>取消</button>
          <button onClick={submit} style={{ minWidth: 140, height: 38, padding: "0 24px", border: 0, borderRadius: 7, background: "linear-gradient(135deg,#4168f6,#5668ed)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit" }}>确认部署</button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function ModelDeploymentPage({ prefill }: { prefill?: DeployPrefill | null }) {
  const [deployments, setDeployments] = useState<DeployGroup[]>(DEPLOYMENTS_INIT);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rgFilter, setRgFilter] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [inlineEdits, setInlineEdits] = useState<Record<string, InlineEdit>>({});
  const [modalState, setModalState] = useState<{ mode: "add" | "clone" | "edit"; source: string | null } | null>(null);
  const [toast, setToast] = useState<{ msg: string; isError: boolean } | null>(null);

  // Open modal automatically when prefill is provided
  useEffect(() => {
    if (prefill) setModalState({ mode: "add", source: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const showToast = (msg: string, isError = false) => setToast({ msg, isError });

  // Filtered + sorted deployments
  const filtered = (() => {
    let list = deployments.filter(d => {
      if (rgFilter && d.resourceGroup !== rgFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (search && d.name.toLowerCase().indexOf(search.toLowerCase()) === -1) return false;
      if (category) {
        const m = CATALOG_MODELS_LITE.find(x => x.id === d.modelId);
        if (!m || m.category !== category) return false;
      }
      return true;
    });
    if (sortCol) {
      list = [...list].sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (sortCol) {
          case "name": va = a.name.toLowerCase(); vb = b.name.toLowerCase(); break;
          case "resourceGroup": va = a.resourceGroup; vb = b.resourceGroup; break;
          case "source": va = a.source; vb = b.source; break;
          case "replicas": va = replicasConfigured(a.replicas); vb = replicasConfigured(b.replicas); break;
          case "createdAt": va = a.createdAt; vb = b.createdAt; break;
          default: return 0;
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  })();

  const selCount = deployments.filter(d => d.selected).length;
  const allChecked = deployments.length > 0 && selCount === deployments.length;
  const indeterminate = selCount > 0 && selCount < deployments.length;

  const toggleAll = (checked: boolean) => setDeployments(prev => prev.map(d => ({ ...d, selected: checked })));
  const toggleOne = (name: string, checked: boolean) => setDeployments(prev => prev.map(d => d.name === name ? { ...d, selected: checked } : d));

  const toggleExpand = (name: string) => setExpanded(prev => {
    const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next;
  });

  const toggleAllGroups = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    setExpanded(next ? new Set(filtered.map(d => d.name)) : new Set());
  };

  const sortClick = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const sortArrow = (col: string) => sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  // Inline edit handlers
  const changeInline = (name: string, delta: number) => {
    setDeployments(prev => {
      const d = prev.find(x => x.name === name);
      if (!d) return prev;
      const origConfigured = replicasConfigured(d.replicas);
      const maxForThis = getRemaining(d.resourceGroup, prev) + origConfigured;
      setInlineEdits(edits => {
        const existing = edits[name] || { running: parseInt(String(d.replicas).split("/")[0]) || 0, configured: origConfigured };
        let newConfigured = existing.configured;
        let newRunning = existing.running;
        if (delta > 0) {
          if (existing.configured >= maxForThis) { showToast(`该资源组的剩余资源最多可部署 ${maxForThis} 个实例`, true); return edits; }
          newConfigured = existing.configured + 1;
        } else {
          newConfigured = Math.max(0, existing.configured - 1);
          newRunning = Math.min(existing.running, newConfigured);
        }
        return { ...edits, [name]: { running: newRunning, configured: newConfigured } };
      });
      return prev;
    });
  };

  const confirmInline = (name: string) => {
    setDeployments(prev => prev.map(d => {
      if (d.name !== name) return d;
      const edit = inlineEdits[name];
      if (!edit) return d;
      return { ...d, replicas: `${edit.running}/${edit.configured}` };
    }));
    setInlineEdits(edits => { const next = { ...edits }; delete next[name]; return next; });
  };

  const cancelInline = (name: string) => setInlineEdits(edits => { const next = { ...edits }; delete next[name]; return next; });

  // Row actions
  const startDeploy = (name: string) => setDeployments(prev => prev.map(d => d.name === name ? { ...d, status: "running" } : d));
  const stopDeploy = (name: string) => setDeployments(prev => prev.map(d => d.name === name ? { ...d, status: "stopped" } : d));
  const deleteDeploy = (name: string) => setDeployments(prev => prev.filter(d => d.name !== name));
  const editDeploy = (name: string) => { setModalState({ mode: "edit", source: name }); };
  const cloneDeploy = (name: string) => { setModalState({ mode: "clone", source: name }); };
  const monitorDeploy = (name: string) => {
    if (typeof window !== "undefined") window.open(`https://grafana.example.com/d/model-monitor?deployment=${encodeURIComponent(name)}`, "_blank");
  };

  // Batch ops
  const batchStart = () => {
    const stopped = deployments.filter(d => d.selected && d.status !== "running");
    if (!stopped.length) { showToast("所选部署均已处于运行状态", true); return; }
    if (!window.confirm(`确认启动选中的 ${stopped.length} 个部署？`)) return;
    setDeployments(prev => prev.map(d => (d.selected && d.status !== "running") ? { ...d, status: "running" } : d));
    showToast(`已启动 ${stopped.length} 个部署`);
  };
  const batchStop = () => {
    const running = deployments.filter(d => d.selected && d.status === "running");
    if (!running.length) { showToast("所选部署均已处于停止状态", true); return; }
    if (!window.confirm(`确认停止选中的 ${running.length} 个部署？`)) return;
    setDeployments(prev => prev.map(d => (d.selected && d.status === "running") ? { ...d, status: "stopped" } : d));
    showToast(`已停止 ${running.length} 个部署`);
  };
  const batchDelete = () => {
    const sel = deployments.filter(d => d.selected);
    if (!sel.length) return;
    if (!window.confirm(`确认删除选中的 ${sel.length} 个部署？此操作不可撤销。`)) return;
    setDeployments(prev => prev.filter(d => !d.selected));
    showToast(`已删除 ${sel.length} 个部署`);
  };

  const resetFilter = () => { setSearch(""); setCategory(""); setStatusFilter(""); setRgFilter(""); };

  const handleSubmit = (d: DeployGroup) => {
    setDeployments(prev => {
      if (modalState?.mode === "edit") {
        const idx = prev.findIndex(x => x.name === modalState.source);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...d, createdAt: prev[idx].createdAt };
          return next;
        }
      }
      return [...prev, d];
    });
  };

  // Table styles
  const th: React.CSSProperties = { height: 54, padding: "0 14px", background: "#fafbfc", borderBottom: "1px solid #e8ecf2", color: "#667085", fontSize: 14, fontWeight: 650, whiteSpace: "nowrap", textAlign: "left" };
  const td: React.CSSProperties = { height: 58, padding: "0 14px", borderBottom: "1px solid #edf0f4", background: "#fff", verticalAlign: "middle", fontSize: 15 };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>模型管理</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>部署模型</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e7ebf2", boxShadow: "0 2px 12px rgba(31,45,61,.05)", overflow: "hidden" }}>
        {/* Toolbar */}
        <div className="flex items-center flex-shrink-0 flex-wrap" style={{ minHeight: 84, padding: "20px 24px", gap: 12, borderBottom: "1px solid #edf0f5" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索模型名称..." style={{ height: 44, width: 220, padding: "0 36px 0 14px", border: "1px solid #d5ddea", borderRadius: 8, fontSize: 14, color: "#20242d", background: "#fff", outline: "none", fontFamily: "inherit" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#536df5")} onBlur={e => (e.currentTarget.style.borderColor = "#d5ddea")} />
            {search && (
              <button onClick={() => setSearch("")} aria-label="清空" style={{ position: "absolute", right: 6, width: 24, height: 24, border: 0, background: "transparent", color: "#99a4b5", fontSize: 18, cursor: "pointer", borderRadius: 4 }}
                onMouseEnter={e => { (e.currentTarget.style.background = "#f0f2f5"); (e.currentTarget.style.color = "#667085"); }} onMouseLeave={e => { (e.currentTarget.style.background = "transparent"); (e.currentTarget.style.color = "#99a4b5"); }}>×</button>
            )}
          </div>

          <select value={category} onChange={e => setCategory(e.target.value)} aria-label="模型分类筛选" style={{ height: 44, minWidth: 165, padding: "0 42px 0 16px", border: "1px solid #d5ddea", borderRadius: 8, background: "#fff", color: "#344054", fontWeight: 600, fontSize: 15, fontFamily: "inherit", cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2399a4b5' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}>
            {CATEGORY_OPTS.map(o => <option key={o} value={o}>{o || "全部分类"}</option>)}
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="状态筛选" style={{ height: 44, minWidth: 165, padding: "0 42px 0 16px", border: "1px solid #d5ddea", borderRadius: 8, background: "#fff", color: "#344054", fontWeight: 600, fontSize: 15, fontFamily: "inherit", cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2399a4b5' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={rgFilter} onChange={e => setRgFilter(e.target.value)} aria-label="资源组筛选" style={{ height: 44, minWidth: 165, padding: "0 42px 0 16px", border: "1px solid #d5ddea", borderRadius: 8, background: "#fff", color: "#344054", fontWeight: 600, fontSize: 15, fontFamily: "inherit", cursor: "pointer", appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2399a4b5' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}>
            <option value="">全部资源组</option>
            <option>测试1</option>
            <option>GPU-Cluster-Prod</option>
          </select>

          <button onClick={resetFilter} style={{ height: 44, padding: "0 18px", display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #d5ddea", borderRadius: 8, background: "#fff", color: "#344054", fontWeight: 600, fontSize: 15, fontFamily: "inherit", cursor: "pointer" }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = "#9eacf8"); (e.currentTarget.style.color = "#4169f6"); }} onMouseLeave={e => { (e.currentTarget.style.borderColor = "#d5ddea"); (e.currentTarget.style.color = "#344054"); }}>
            <RotateCcw size={17} /> <span>重置</span>
          </button>

          <div style={{ flex: 1 }} />

          <button onClick={() => setModalState({ mode: "add", source: null })} style={{ height: 44, padding: "0 20px", border: 0, borderRadius: 9, fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg,#4168f6,#5b63ed)", boxShadow: "0 5px 12px rgba(65,104,246,.18)", color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={16} /> <span>新建部署</span>
          </button>
        </div>

        {/* Batch bar */}
        {selCount > 0 && (
          <div className="flex items-center flex-shrink-0" style={{ gap: 10, padding: "10px 24px", background: "#f0f4ff", borderBottom: "1px solid #dce3f5" }}>
            <span style={{ color: "#344054", fontSize: 13, fontWeight: 650 }}>已选 {selCount} 项</span>
            <button onClick={batchStart} style={{ height: 34, padding: "0 16px", border: "1px solid #9ecfff", borderRadius: 6, background: "#fff", color: "#0c7fcf", fontSize: 13, fontWeight: 650, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { (e.currentTarget.style.background = "#f0f8ff"); (e.currentTarget.style.borderColor = "#4fa0f0"); }} onMouseLeave={e => { (e.currentTarget.style.background = "#fff"); (e.currentTarget.style.borderColor = "#9ecfff"); }}>▶ 一键启动</button>
            <button onClick={batchStop} style={{ height: 34, padding: "0 16px", border: "1px solid #ffc9c9", borderRadius: 6, background: "#fff", color: "#e5484d", fontSize: 13, fontWeight: 650, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { (e.currentTarget.style.background = "#fff5f5"); (e.currentTarget.style.borderColor = "#f05252"); }} onMouseLeave={e => { (e.currentTarget.style.background = "#fff"); (e.currentTarget.style.borderColor = "#ffc9c9"); }}>■ 批量停止</button>
            <button onClick={batchDelete} style={{ height: 34, padding: "0 16px", border: "1px solid #e0e0e0", borderRadius: 6, background: "#fff", color: "#666", fontSize: 13, fontWeight: 650, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { (e.currentTarget.style.background = "#f5f5f5"); (e.currentTarget.style.borderColor = "#ccc"); (e.currentTarget.style.color = "#e5484d"); }} onMouseLeave={e => { (e.currentTarget.style.background = "#fff"); (e.currentTarget.style.borderColor = "#e0e0e0"); (e.currentTarget.style.color = "#666"); }}>⌫ 批量删除</button>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", minWidth: 1160, tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, color: "#354052", fontSize: 15 }}>
            <colgroup>
              <col style={{ width: 78 }} />
              <col style={{ width: "31%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: 92 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "center" }}>
                  <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = indeterminate; }} onChange={e => toggleAll(e.target.checked)} aria-label="全选部署" style={{ width: 17, height: 17, margin: 0, accentColor: "#536df5", cursor: "pointer" }} />
                </th>
                <th style={th}>
                  <button onClick={toggleAllGroups} title="展开/收起全部" style={{ width: 22, height: 22, padding: 0, marginRight: 4, border: "1px solid #d5ddea", borderRadius: 4, background: "#fff", color: "#667085", fontSize: 13, cursor: "pointer", verticalAlign: "middle", lineHeight: 1 }}
                    onMouseEnter={e => { (e.currentTarget.style.background = "#f0f4ff"); (e.currentTarget.style.color = "#4169f6"); (e.currentTarget.style.borderColor = "#9eacf8"); }} onMouseLeave={e => { (e.currentTarget.style.background = "#fff"); (e.currentTarget.style.color = "#667085"); (e.currentTarget.style.borderColor = "#d5ddea"); }}>{allExpanded ? "⊟" : "⊞"}</button>
                  <span onClick={() => sortClick("name")} style={{ cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.color = "#4169f6")} onMouseLeave={e => (e.currentTarget.style.color = "#667085")}>名称 <span style={{ color: "#99a4b5", fontSize: 11 }}>{sortArrow("name")}</span></span>
                </th>
                <th style={th}><span onClick={() => sortClick("resourceGroup")} style={{ cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.color = "#4169f6")} onMouseLeave={e => (e.currentTarget.style.color = "#667085")}>资源组 <span style={{ color: "#99a4b5", fontSize: 11 }}>{sortArrow("resourceGroup")}</span></span></th>
                <th style={th}><span onClick={() => sortClick("source")} style={{ cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.color = "#4169f6")} onMouseLeave={e => (e.currentTarget.style.color = "#667085")}>来源 <span style={{ color: "#99a4b5", fontSize: 11 }}>{sortArrow("source")}</span></span></th>
                <th style={th}><span onClick={() => sortClick("replicas")} style={{ cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.color = "#4169f6")} onMouseLeave={e => (e.currentTarget.style.color = "#667085")}>实例数 <span style={{ color: "#99a4b5", fontSize: 11 }}>{sortArrow("replicas")}</span></span></th>
                <th style={th}><span onClick={() => sortClick("createdAt")} style={{ cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.color = "#4169f6")} onMouseLeave={e => (e.currentTarget.style.color = "#667085")}>创建时间 <span style={{ color: "#99a4b5", fontSize: 11 }}>{sortArrow("createdAt")}</span></span></th>
                <th style={th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>暂无数据</td></tr>
              ) : filtered.flatMap(d => {
                const isExp = expanded.has(d.name);
                const catModel = CATALOG_MODELS_LITE.find(m => m.id === d.modelId);
                const displayType = catModel ? catModel.category : d.type;
                const isSpeech = displayType === "语音识别模型" || displayType === "Speech-To-Text";
                const edit = inlineEdits[d.name];
                const displayVal = edit ? `${edit.running}/${edit.configured}` : d.replicas;
                const origConfigured = replicasConfigured(d.replicas);
                const remaining = getRemaining(d.resourceGroup, deployments);
                const atMax = (edit ? edit.configured : origConfigured) >= (RESOURCE_GROUP_CAPACITIES[d.resourceGroup] || 0) || remaining <= 0;
                const rows: React.ReactNode[] = [];
                rows.push(
                  <tr key={d.name} style={{ background: "#fff" }} onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fbfcff"; }} onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fff"; }}>
                    {/* Checkbox */}
                    <td style={{ ...td, textAlign: "center" }}>
                      <input type="checkbox" checked={d.selected} onChange={e => toggleOne(d.name, e.target.checked)} aria-label={`选择 ${d.name}`} style={{ width: 17, height: 17, margin: 0, accentColor: "#536df5", cursor: "pointer" }} />
                    </td>
                    {/* Name + type tag */}
                    <td style={td}>
                      <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={() => toggleExpand(d.name)} style={{ width: 20, height: 24, padding: 0, border: 0, background: "transparent", color: "#687386", fontSize: 20, lineHeight: 1, cursor: "pointer", transform: isExp ? "rotate(0)" : "rotate(-90deg)", transition: "transform .15s" }}>⌄</button>
                        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#20242d", fontWeight: 750 }}>{d.name}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", height: 28, padding: "0 10px", borderRadius: 6, background: isSpeech ? "#ecf9ef" : "#eef3ff", color: isSpeech ? "#12a04a" : "#4b6ff2", fontSize: 13, fontWeight: 650, whiteSpace: "nowrap" }}>{displayType}</span>
                      </div>
                    </td>
                    {/* Resource group */}
                    <td style={td}>{d.resourceGroup}</td>
                    {/* Source */}
                    <td style={td}>
                      <span title={d.source} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#657084", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 14 }}>{d.source}</span>
                    </td>
                    {/* Replicas stepper */}
                    <td style={td}>
                      <ReplicaStepper
                        edit={!!edit}
                        displayVal={displayVal}
                        atMax={atMax}
                        onChange={delta => changeInline(d.name, delta)}
                        onConfirm={() => confirmInline(d.name)}
                        onCancel={() => cancelInline(d.name)}
                      />
                    </td>
                    {/* Created at */}
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{d.createdAt}</td>
                    {/* Actions */}
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, position: "relative" }}>
                        <button onClick={() => editDeploy(d.name)} title="编辑" style={{ width: 28, height: 32, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: 0, background: "transparent", color: "#98a3b3", cursor: "pointer", borderRadius: 6 }}
                          onMouseEnter={e => { (e.currentTarget.style.background = "#f2f5fa"); (e.currentTarget.style.color = "#536df5"); }} onMouseLeave={e => { (e.currentTarget.style.background = "transparent"); (e.currentTarget.style.color = "#98a3b3"); }}>
                          <Pencil size={16} />
                        </button>
                        <DeployMoreMenu
                          status={d.status}
                          onStart={() => startDeploy(d.name)}
                          onStop={() => stopDeploy(d.name)}
                          onClone={() => cloneDeploy(d.name)}
                          onMonitor={() => monitorDeploy(d.name)}
                          onDelete={() => deleteDeploy(d.name)}
                        />
                      </div>
                    </td>
                  </tr>
                );
                // Child rows
                if (isExp) {
                  d.children.forEach(child => {
                    const statusLabel = child.status === "running" ? "运行中" : "待处理";
                    rows.push(
                      <tr key={`${d.name}__${child.name}`} style={{ background: "#fff" }} onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fbfcff"; }} onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fff"; }}>
                        <td style={{ ...td, textAlign: "center" }} />
                        <td style={td}>
                          <div style={{ paddingLeft: 34, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#354052" }}>{child.name}</div>
                        </td>
                        <td style={td} />
                        <td style={td} />
                        <td style={td}>
                          <span style={{ display: "inline-flex", alignItems: "center", height: 30, padding: "0 12px", borderRadius: 16, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", background: child.status === "running" ? "#eaf8ef" : "#edf5ff", color: child.status === "running" ? "#0c9d42" : "#1769dd" }}>{statusLabel}</span>
                        </td>
                        <td style={{ ...td, whiteSpace: "nowrap" }}>{child.createdAt}</td>
                        <td style={td}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            <button title="删除" style={{ width: 28, height: 32, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: 0, background: "transparent", color: "#ff3b41", cursor: "pointer", borderRadius: 6 }}
                              onMouseEnter={e => { (e.currentTarget.style.background = "#fff1f1"); (e.currentTarget.style.color = "#e92d34"); }} onMouseLeave={e => { (e.currentTarget.style.background = "transparent"); (e.currentTarget.style.color = "#ff3b41"); }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                }
                return rows;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalState && (
        <DeployModal
          mode={modalState.mode}
          sourceName={modalState.source}
          prefill={prefill}
          deployments={deployments}
          onClose={() => setModalState(null)}
          onSubmit={handleSubmit}
          showToast={showToast}
        />
      )}

      {toast && <Toast msg={toast.msg} isError={toast.isError} onClose={() => setToast(null)} />}
    </div>
  );
}
