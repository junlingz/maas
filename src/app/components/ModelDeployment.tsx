import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown, ChevronRight, Plus, RotateCcw, Pencil, Trash2, X,
  Search, MoreVertical, Play, Square, Copy, Activity,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DeployStatus = "running" | "stopped" | "pending";

interface DeployChild {
  name: string;
  status: "pending" | "running";
  createdAt: string;
}

interface DeployGroup {
  name: string;
  modelId: string;
  type: string;
  resourceGroup: string;
  source: string;
  replicas: string;
  status: DeployStatus;
  createdAt: string;
  selected: boolean;
  children: DeployChild[];
}

interface CatalogModel {
  id: string;
  developer: string;
  name: string;
  size: string;
  category: string;
  weightPath: string;
  imagePath: string;
  description: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const GROUPS_INIT: DeployGroup[] = [
  {
    name: "qwen3.6-27b", modelId: "qwen3-7b", type: "通用大模型",
    resourceGroup: "测试1", source: "Hugging Face/Qwen/Qwen3.6-27B",
    replicas: "0/3", status: "stopped", createdAt: "2026-06-30 14:17:42", selected: false,
    children: [
      { name: "qwen3.6-27b-X1xEx", status: "pending", createdAt: "2026-07-02 10:05:00" },
      { name: "qwen3.6-27b-7DRSg", status: "pending", createdAt: "2026-06-30 16:39:02" },
      { name: "qwen3.6-27b-2ejux", status: "pending", createdAt: "2026-06-30 14:17:42" },
    ],
  },
  {
    name: "demo-whisper-large-v3", modelId: "whisper-large-v3", type: "语音识别模型",
    resourceGroup: "测试1", source: "Hugging Face/openai/whisper-large-v3",
    replicas: "0/3", status: "stopped", createdAt: "2026-06-30 14:10:36", selected: false,
    children: [
      { name: "demo-whisper-large-v3-r1", status: "pending", createdAt: "2026-06-30 14:10:36" },
      { name: "demo-whisper-large-v3-than4", status: "pending", createdAt: "2026-06-28 09:41:32" },
      { name: "demo-whisper-large-v3-PNYsA", status: "pending", createdAt: "2026-06-28 09:41:32" },
    ],
  },
  {
    name: "glm-4-flash-prod", modelId: "chatglm4-32b", type: "通用大模型",
    resourceGroup: "GPU-Cluster-Prod", source: "Hugging Face/THUDM/glm-4-flash",
    replicas: "2/2", status: "running", createdAt: "2026-06-24 10:00:00", selected: false,
    children: [
      { name: "glm-4-flash-prod-a1b2c", status: "running", createdAt: "2026-06-24 10:05:00" },
      { name: "glm-4-flash-prod-d3e4f", status: "running", createdAt: "2026-06-24 10:05:00" },
    ],
  },
];

const RESOURCE_GROUP_CAPACITIES: Record<string, number> = {
  "推理组": 4,
  "测试1": 10,
  "GPU-Cluster-Prod": 6,
};

const CATALOG_MODELS: CatalogModel[] = [
  { id: "deepseek-v3", developer: "DeepSeek", name: "deepseek-v3", size: "671", category: "通用大模型", weightPath: "/models/deepseek-v3", imagePath: "harbor.xxx.com/lm/vllm:deepseek-v3", description: "DeepSeek V3 通用大语言模型。" },
  { id: "embedding-v3", developer: "智谱", name: "embedding-v3", size: "0.3", category: "嵌入模型", weightPath: "/models/embedding-v3", imagePath: "harbor.xxx.com/lm/embedding:v3", description: "文本向量化模型。" },
  { id: "cogvlm-9b", developer: "智谱", name: "cogvlm-9b", size: "9", category: "图片模型", weightPath: "/models/cogvlm-9b", imagePath: "harbor.xxx.com/lm/vllm:cogvlm-9b", description: "视觉语言理解模型。" },
  { id: "chatglm4-32b", developer: "智谱", name: "chatglm4-32b", size: "32", category: "通用大模型", weightPath: "/models/chatglm4-32b", imagePath: "harbor.xxx.com/lm/vllm:chatglm4-32b", description: "面向对话与生成任务的通用模型。" },
  { id: "llama-3-1", developer: "智谱", name: "LLaMA 3.1", size: "70", category: "通用大模型", weightPath: "/models/llama-3.1", imagePath: "harbor.xxx.com/lm/vllm:llama-3.1", description: "LLaMA 3.1 通用语言模型。" },
  { id: "baichuan-m2-plus", developer: "千问", name: "Baichuan-M2 Plus", size: "13", category: "通用大模型", weightPath: "/models/baichuan-m2-plus", imagePath: "harbor.xxx.com/lm/vllm:baichuan-m2-plus", description: "百川通用大语言模型。" },
  { id: "qwen3-7b", developer: "千问", name: "Qwen3-7B", size: "7", category: "通用大模型", weightPath: "/models/Qwen3-7B", imagePath: "harbor.xxx.com/lm/vllm:qwen3-7b", description: "通义千问 Qwen3 7B 模型。" },
  { id: "t1-100", developer: "千问", name: "T1-100", size: "100", category: "重排模型", weightPath: "/models/T1-100", imagePath: "harbor.xxx.com/lm/vllm:t1-100", description: "面向复杂任务的推理模型。" },
  { id: "whisper-large-v3", developer: "智谱", name: "whisper-large-v3", size: "1.5", category: "语音识别模型", weightPath: "/models/whisper-large-v3", imagePath: "harbor.xxx.com/lm/vllm:whisper-v3", description: "OpenAI Whisper Large V3 语音识别模型。" },
];

const CATEGORY_FILTER_OPTS = ["全部分类", "通用大模型", "嵌入模型", "图片模型", "重排模型", "语音识别模型", "语音合成模型"];
const STATUS_FILTER_OPTS: { value: string; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "running", label: "已启用" },
  { value: "stopped", label: "已停用" },
  { value: "pending", label: "未就绪" },
];
const RG_FILTER_OPTS = ["全部资源组", "测试1", "GPU-Cluster-Prod"];
const RG_DEPLOY_OPTS = ["推理组", "测试1", "GPU-Cluster-Prod"];

export interface DeployPrefill {
  modelName: string;
  modelPath: string;
  classify?: string;
  paramSize?: string;
  contextLen?: string;
  modelId?: string;
  imagePath?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getResourceGroupRemaining(resourceGroup: string, groups: DeployGroup[]): number {
  const capacity = RESOURCE_GROUP_CAPACITIES[resourceGroup] || 0;
  const used = groups.reduce((total, d) => {
    if (d.resourceGroup !== resourceGroup) return total;
    const parts = d.replicas.split("/");
    const configured = Number(parts[1] || parts[0]) || 0;
    return total + configured;
  }, 0);
  return Math.max(0, capacity - used);
}

function getReplicasConfigured(replicas: string): number {
  const parts = String(replicas).split("/");
  return parseInt(parts[1] || parts[0]) || 0;
}

function getReplicasRunning(replicas: string): number {
  const parts = String(replicas).split("/");
  return parseInt(parts[0]) || 0;
}

function highlightMatch(text: string, keyword: string): React.ReactNode {
  if (!keyword) return text;
  const lowerText = text.toLowerCase();
  const lowerKw = keyword.toLowerCase();
  const idx = lowerText.indexOf(lowerKw);
  if (idx === -1) return text;
  return (
    <>
      {text.substring(0, idx)}
      <mark style={{ background: "#fff3b0", color: "#20242d", borderRadius: 2 }}>
        {text.substring(idx, idx + keyword.length)}
      </mark>
      {text.substring(idx + keyword.length)}
    </>
  );
}

function isSpeechType(type: string): boolean {
  return type === "语音识别模型" || type === "语音合成模型" || type === "Speech-To-Text";
}

// ─── Toast hook ───────────────────────────────────────────────────────────────

interface ToastState { message: string; isError: boolean; }

function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const show = (message: string, isError = false) => {
    setToast({ message, isError });
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setToast(null), 2000);
  };
  useEffect(() => () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); }, []);
  return { toast, show };
}

// ─── Deploy Modal ─────────────────────────────────────────────────────────────

interface DeployModalProps {
  mode: "add" | "edit" | "clone";
  groups: DeployGroup[];
  onClose: () => void;
  onSubmit: () => void;
  showToast: (msg: string, isError?: boolean) => void;
  // Modal form state (lifted to parent for prefill access)
  modelId: string;
  setModelId: (v: string) => void;
  modelSearch: string;
  setModelSearch: (v: string) => void;
  modelPath: string;
  setModelPath: (v: string) => void;
  imagePath: string;
  setImagePath: (v: string) => void;
  remark: string;
  setRemark: (v: string) => void;
  rg: string;
  setRg: (v: string) => void;
  replicas: number;
  setReplicas: (v: number) => void;
  placement: string;
  setPlacement: (v: string) => void;
  advOpen: boolean;
  setAdvOpen: (v: boolean) => void;
}

function DeployModal(props: DeployModalProps) {
  const {
    mode, groups, onClose, onSubmit, showToast,
    modelId, setModelId, modelSearch, setModelSearch,
    modelPath, setModelPath, imagePath, setImagePath,
    remark, setRemark, rg, setRg, replicas, setReplicas,
    placement, setPlacement, advOpen, setAdvOpen,
  } = props;

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIdx, setSearchIdx] = useState(-1);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const title = mode === "add" ? "新建部署" : mode === "clone" ? "克隆部署" : "编辑部署";

  const filteredModels = useMemo(() => {
    const kw = modelSearch.toLowerCase().trim();
    if (!kw) return CATALOG_MODELS;
    return CATALOG_MODELS.filter(m => m.name.toLowerCase().indexOf(kw) !== -1);
  }, [modelSearch]);

  // Click outside to close search dropdown
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectModel = (id: string) => {
    const model = CATALOG_MODELS.find(m => m.id === id);
    if (model) {
      setModelId(model.id);
      setModelSearch(model.name);
      setModelPath(model.weightPath);
      setImagePath(model.imagePath);
      setRemark(model.description);
    }
    setSearchOpen(false);
    setSearchIdx(-1);
  };

  const openSearch = () => {
    setSearchIdx(-1);
    if (modelSearch) setModelSearch("");
    setSearchOpen(true);
  };

  const handleSearchKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen) return;
    const items = filteredModels;
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchIdx(i => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchIdx(i => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (searchIdx >= 0 && items[searchIdx]) {
        selectModel(items[searchIdx].id);
      }
    } else if (e.key === "Escape") {
      setSearchOpen(false);
    }
  };

  const replicaMax = modelId && rg ? getResourceGroupRemaining(rg, groups) : 0;

  const changeReplicas = (delta: number) => {
    const max = rg ? getResourceGroupRemaining(rg, groups) : 0;
    if (max === 0) {
      setReplicas(0);
      return;
    }
    setReplicas(Math.min(max, Math.max(1, replicas + delta)));
  };

  const handleSubmit = () => {
    if (!modelId) return showToast("请从模型库中选择模型", true);
    if (!rg) return showToast("请选择资源组", true);
    onSubmit();
  };

  const inputSt: React.CSSProperties = {
    width: "100%", height: 38, padding: "0 12px", border: "1px solid #d5ddea",
    borderRadius: 7, color: "#20242d", fontSize: 14, outline: "none",
    boxSizing: "border-box" as const, fontFamily: "inherit",
  };
  const readonlyInputSt: React.CSSProperties = { ...inputSt, background: "#f6f8fb", color: "#667085", cursor: "not-allowed" };
  const labelSt: React.CSSProperties = { marginBottom: 5, color: "#344054", fontSize: 13, fontWeight: 700 };
  const hintSt: React.CSSProperties = { display: "block", marginTop: 4, color: "#99a4b5", fontSize: 12, lineHeight: 1.45 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(31,38,49,0.48)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(640px, calc(100vw - 32px))", maxHeight: "calc(100vh - 40px)",
        background: "#fff", borderRadius: 14, zIndex: 201, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(15,23,42,0.26)", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          flex: "0 0 auto", padding: "16px 24px", borderBottom: "1px solid #edf0f4",
          borderRadius: "14px 14px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h3 style={{ color: "#20242d", fontSize: 17, lineHeight: 1.3, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} aria-label="关闭"
            style={{ width: 28, height: 28, border: 0, background: "transparent", cursor: "pointer", borderRadius: 6, color: "#9aa4b3", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "0 24px 20px" }}>
          {/* 名称（选择模型） */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}><span style={{ color: "#e5484d", marginRight: 4 }}>*</span>名称（选择模型）</label>
            <div ref={searchWrapRef} style={{ position: "relative" }}>
              <input
                value={modelSearch}
                onChange={e => { setModelSearch(e.target.value); setSearchIdx(-1); setSearchOpen(true); }}
                onFocus={openSearch}
                onKeyDown={handleSearchKeydown}
                placeholder="输入关键词搜索模型库中的模型..."
                autoComplete="off"
                style={{ ...inputSt, cursor: "pointer", paddingRight: 32, background: "#fff" }}
              />
              <Search size={16} color="#99a4b5" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              {searchOpen && (
                <div style={{
                  position: "absolute", left: 0, right: 0, top: "100%", zIndex: 60,
                  maxHeight: 220, overflowY: "auto", marginTop: 2, background: "#fff",
                  border: "1px solid #d5ddea", borderRadius: 7, boxShadow: "0 8px 24px rgba(15,23,42,0.14)",
                }}>
                  {filteredModels.length === 0 ? (
                    <div style={{ padding: "16px 12px", textAlign: "center", color: "#99a4b5", fontSize: 13 }}>无匹配模型</div>
                  ) : filteredModels.map((m, i) => (
                    <div key={m.id}
                      onMouseDown={e => { e.preventDefault(); selectModel(m.id); }}
                      style={{
                        padding: "9px 12px", cursor: "pointer", fontSize: 13, color: "#344054",
                        borderBottom: i < filteredModels.length - 1 ? "1px solid #f0f2f6" : "none",
                        display: "flex", flexDirection: "column", gap: 2,
                        background: i === searchIdx ? "#f0f4ff" : m.id === modelId ? "#f0f4ff" : "#fff",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "#f0f4ff"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = i === searchIdx || m.id === modelId ? "#f0f4ff" : "#fff"; }}
                    >
                      <span style={{ fontWeight: 650 }}>{highlightMatch(m.name, modelSearch.toLowerCase().trim())}</span>
                      <span style={{ color: "#99a4b5", fontSize: 12 }}>{m.size}B ｜ {m.category} ｜ {m.developer}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span style={hintSt}>从模型库中选择已有模型，自动加载基础信息</span>
          </div>

          {/* 模型路径 */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}><span style={{ color: "#e5484d", marginRight: 4 }}>*</span>模型路径（权重地址）</label>
            <input value={modelPath} readOnly placeholder="选择模型后自动带入" style={readonlyInputSt} />
            <span style={hintSt}>来自模型库中的模型权重地址，不可修改</span>
          </div>

          {/* 模型镜像地址 */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}><span style={{ color: "#e5484d", marginRight: 4 }}>*</span>模型镜像地址</label>
            <input value={imagePath} readOnly placeholder="选择模型后自动带入" style={readonlyInputSt} />
            <span style={hintSt}>来自新建模型时选择的镜像地址，不可修改</span>
          </div>

          {/* 资源组 + 实例数 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
            <div>
              <label style={labelSt}><span style={{ color: "#e5484d", marginRight: 4 }}>*</span>资源组</label>
              <select value={rg} onChange={e => setRg(e.target.value)} style={{ ...inputSt, cursor: "pointer" }}>
                <option value="">-- 请选择资源组 --</option>
                {RG_DEPLOY_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <span style={hintSt}>选择目标资源组，后端 GPU 选项显示该组内可用 GPU</span>
            </div>
            <div>
              <label style={labelSt}>实例数</label>
              <div style={{
                height: 38, display: "grid", gridTemplateColumns: "44px 1fr 44px", overflow: "hidden",
                border: "1px solid #d5ddea", borderRadius: 7, background: "#fff",
              }}>
                <button type="button" onClick={() => changeReplicas(-1)} aria-label="减少实例数"
                  style={{ border: 0, borderRight: "1px solid #d5ddea", background: "#f8fafc", color: "#667085", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>−</button>
                <output style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#20242d", fontSize: 15 }}>{replicas}</output>
                <button type="button" onClick={() => changeReplicas(1)} aria-label="增加实例数" disabled={replicaMax <= 0 || replicas >= replicaMax}
                  style={{ border: 0, borderLeft: "1px solid #d5ddea", background: "#f8fafc", color: replicaMax <= 0 || replicas >= replicaMax ? "#c3cad5" : "#667085", fontSize: 18, fontWeight: 700, cursor: replicaMax <= 0 || replicas >= replicaMax ? "not-allowed" : "pointer" }}>＋</button>
              </div>
              {modelId && rg && (
                <span style={{ display: "block", marginTop: 5, color: "#e5484d", fontSize: 12, lineHeight: 1.45 }}>
                  该资源组的剩余资源最多可部署 {replicaMax} 个实例
                </span>
              )}
            </div>
          </div>

          {/* 备注 */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelSt}>备注</label>
            <textarea value={remark} onChange={e => setRemark(e.target.value)} aria-label="备注"
              style={{ width: "100%", height: 68, padding: "10px 12px", border: "1px solid #d5ddea", borderRadius: 7, color: "#20242d", fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" as const }} />
          </div>

          {/* 高级配置 */}
          <div style={{ marginTop: 20, overflow: "hidden", border: "1px solid #dce2ec", borderRadius: 8, background: "#fff" }}>
            <button type="button" onClick={() => setAdvOpen(!advOpen)} aria-expanded={advOpen}
              style={{
                width: "100%", minHeight: 40, padding: "0 16px", display: "flex", alignItems: "center", gap: 10,
                border: 0, background: "linear-gradient(180deg,#fafbfd,#f6f8fb)", color: "#344054",
                fontSize: 13, fontWeight: 700, textAlign: "left", cursor: "pointer", fontFamily: "inherit",
              }}>
              <span style={{ color: "#677386", fontSize: 18, transform: advOpen ? "rotate(90deg)" : "none", transition: "transform .2s", display: "inline-block" }}>›</span>
              <span>高级配置</span>
            </button>
            {advOpen && (
              <div style={{ padding: "14px 16px 4px" }}>
                <div>
                  <label style={labelSt} htmlFor="deployPlacementStrategy">放置策略</label>
                  <select id="deployPlacementStrategy" value={placement} onChange={e => setPlacement(e.target.value)} style={{ ...inputSt, cursor: "pointer" }}>
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
        <div style={{
          flex: "0 0 auto", padding: "14px 24px", borderTop: "1px solid #edf0f4",
          borderRadius: "0 0 14px 14px", background: "rgba(255,255,255,0.98)",
          display: "flex", gap: 8, justifyContent: "flex-end",
        }}>
          <button type="button" onClick={onClose}
            style={{ minWidth: 100, height: 38, border: "1px solid #d5ddea", borderRadius: 7, background: "#fff", color: "#344054", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            取消
          </button>
          <button type="button" onClick={handleSubmit}
            style={{ minWidth: 140, height: 38, border: 0, borderRadius: 7, background: "linear-gradient(135deg,#4168f6,#5668ed)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            确认部署
          </button>
        </div>
      </div>
    </>
  );
}

// ─── More Menu ─────────────────────────────────────────────────────────────────

function GroupMoreMenu({
  group, onEdit, onStart, onStop, onClone, onMonitor, onDelete,
}: {
  group: DeployGroup;
  onEdit: () => void;
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
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const menuBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
    border: 0, background: "transparent", color: "#344054", fontSize: 13,
    fontFamily: "inherit", cursor: "pointer", borderRadius: 5, whiteSpace: "nowrap", textAlign: "left",
  };

  return (
    <div ref={ref} className="deploy-more-wrap" style={{ position: "relative", display: "inline-block" }}>
      <button type="button" title="更多" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          width: 28, height: 32, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: 0, background: "transparent", color: "#98a3b3", cursor: "pointer", borderRadius: 6,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f2f5fa"; e.currentTarget.style.color = "#536df5"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#98a3b3"; }}>
        <MoreVertical size={18} />
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "100%", zIndex: 50, minWidth: 120, padding: 4,
          background: "#fff", border: "1px solid #e3e8f1", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
        }}>
          {group.status === "running" ? (
            <button type="button" style={menuBtn}
              onMouseEnter={e => e.currentTarget.style.background = "#f2f5fa"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              onClick={e => { e.stopPropagation(); onStop(); setOpen(false); }}>
              <Square size={16} /> 停止
            </button>
          ) : (
            <button type="button" style={menuBtn}
              onMouseEnter={e => e.currentTarget.style.background = "#f2f5fa"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              onClick={e => { e.stopPropagation(); onStart(); setOpen(false); }}>
              <Play size={16} /> 启动
            </button>
          )}
          <button type="button" style={menuBtn}
            onMouseEnter={e => e.currentTarget.style.background = "#f2f5fa"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            onClick={e => { e.stopPropagation(); onClone(); setOpen(false); }}>
            <Copy size={16} /> 克隆
          </button>
          <button type="button" style={menuBtn}
            onMouseEnter={e => e.currentTarget.style.background = "#f2f5fa"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            onClick={e => { e.stopPropagation(); onMonitor(); setOpen(false); }}>
            <Activity size={16} /> 监控
          </button>
          <button type="button" style={{ ...menuBtn, color: "#e5484d" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fff1f1"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            onClick={e => { e.stopPropagation(); onDelete(); setOpen(false); }}>
            <Trash2 size={16} /> 删除
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ModelDeploymentPage({ prefill }: { prefill?: DeployPrefill | null }) {
  const [groups, setGroups] = useState<DeployGroup[]>(GROUPS_INIT);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rgFilter, setRgFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [inlineEdits, setInlineEdits] = useState<Record<string, { running: number; configured: number }>>({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "clone">("add");
  const [modalSource, setModalSource] = useState<DeployGroup | null>(null);
  const [mModelId, setMModelId] = useState("");
  const [mModelSearch, setMModelSearch] = useState("");
  const [mModelPath, setMModelPath] = useState("");
  const [mImagePath, setMImagePath] = useState("");
  const [mRemark, setMRemark] = useState("");
  const [mRg, setMRg] = useState("");
  const [mReplicas, setMReplicas] = useState(1);
  const [mPlacement, setMPlacement] = useState("free");
  const [mAdvOpen, setMAdvOpen] = useState(false);

  const { toast, show: showToast } = useToast();

  // ─── Prefill: auto-open modal ───
  useEffect(() => {
    if (!prefill) return;
    setModalMode("add");
    setModalSource(null);
    const matched = CATALOG_MODELS.find(m =>
      (prefill.modelId && m.id === prefill.modelId) || m.name === prefill.modelName
    );
    if (matched) {
      setMModelId(matched.id);
      setMModelSearch(matched.name);
      setMModelPath(matched.weightPath);
      setMImagePath(matched.imagePath);
      setMRemark(matched.description);
    } else {
      setMModelId("");
      setMModelSearch(prefill.modelName || "");
      setMModelPath(prefill.modelPath || "");
      setMImagePath(prefill.imagePath || "");
      setMRemark("");
    }
    setMRg("");
    setMReplicas(1);
    setMPlacement("free");
    setMAdvOpen(false);
    setModalOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  // ─── Modal open/close ───
  const openDeployModal = (mode: "add" | "edit" | "clone", group: DeployGroup | null = null) => {
    setModalMode(mode);
    setModalSource(group);
    if (mode === "add") {
      setMModelId("");
      setMModelSearch("");
      setMModelPath("");
      setMImagePath("");
      setMRemark("");
      setMRg("");
      setMReplicas(1);
      setMPlacement("free");
    } else if (group) {
      const model = CATALOG_MODELS.find(m => m.id === group.modelId);
      setMModelId(group.modelId);
      setMModelSearch(model ? model.name : "");
      setMModelPath(model ? model.weightPath : "");
      setMImagePath(model ? model.imagePath : "");
      setMRemark(model ? model.description : "");
      setMRg(group.resourceGroup || "");
      setMReplicas(getReplicasConfigured(group.replicas));
      setMPlacement("free");
    }
    setMAdvOpen(false);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // ─── Deploy submit ───
  const handleDeploy = () => {
    const catalogModel = CATALOG_MODELS.find(m => m.id === mModelId);
    const replicas = mReplicas || 1;
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);

    if (modalMode === "clone") {
      const nameBase = (catalogModel ? catalogModel.name : "deployment") + "-clone";
      let deployName = nameBase;
      let counter = 1;
      while (groups.some(d => d.name === deployName)) { counter++; deployName = `${nameBase}-${counter}`; }
      setGroups(prev => [...prev, {
        name: deployName, modelId: mModelId,
        type: catalogModel ? catalogModel.category : "通用大模型",
        resourceGroup: mRg, source: catalogModel ? `Hugging Face/${catalogModel.name}` : "",
        replicas: `0/${replicas}`, status: "stopped", createdAt: now, selected: false, children: [],
      }]);
    } else if (modalMode === "add") {
      const nameBase = catalogModel ? catalogModel.name : "deployment";
      let deployName = nameBase;
      let counter = 1;
      while (groups.some(d => d.name === deployName)) { counter++; deployName = `${nameBase}-${counter}`; }
      setGroups(prev => [...prev, {
        name: deployName, modelId: mModelId,
        type: catalogModel ? catalogModel.category : "通用大模型",
        resourceGroup: mRg, source: catalogModel ? `Hugging Face/${catalogModel.name}` : "",
        replicas: `0/${replicas}`, status: "stopped", createdAt: now, selected: false, children: [],
      }]);
    } else if (modalMode === "edit" && modalSource) {
      setGroups(prev => prev.map(d => d.name !== modalSource.name ? d : {
        ...d, resourceGroup: mRg, replicas: `${replicas}/${replicas}`, modelId: mModelId,
        source: catalogModel ? `Hugging Face/${catalogModel.name}` : d.source,
        type: catalogModel ? catalogModel.category : d.type,
      }));
    }
    setModalOpen(false);
    showToast("部署已提交");
  };

  // ─── Selection ───
  const selectedCount = groups.filter(g => g.selected).length;
  const allSelected = groups.length > 0 && selectedCount === groups.length;
  const indeterminate = selectedCount > 0 && selectedCount < groups.length;

  const toggleSelectAll = (checked: boolean) => {
    setGroups(prev => prev.map(g => ({ ...g, selected: checked })));
  };
  const toggleSelect = (name: string, checked: boolean) => {
    setGroups(prev => prev.map(g => g.name === name ? { ...g, selected: checked } : g));
  };

  // ─── Batch ops ───
  const batchStart = () => {
    const stopped = groups.filter(g => g.selected && g.status !== "running");
    if (!stopped.length) { showToast("所选部署均已处于运行状态", true); return; }
    if (!window.confirm(`确认启动选中的 ${stopped.length} 个部署？`)) return;
    setGroups(prev => prev.map(g => g.selected && g.status !== "running" ? { ...g, status: "running" as DeployStatus } : g));
    showToast(`已启动 ${stopped.length} 个部署`);
  };
  const batchStop = () => {
    const running = groups.filter(g => g.selected && g.status === "running");
    if (!running.length) { showToast("所选部署均已处于停止状态", true); return; }
    if (!window.confirm(`确认停止选中的 ${running.length} 个部署？`)) return;
    setGroups(prev => prev.map(g => g.selected && g.status === "running" ? { ...g, status: "stopped" as DeployStatus } : g));
    showToast(`已停止 ${running.length} 个部署`);
  };
  const batchDelete = () => {
    const selected = groups.filter(g => g.selected);
    if (!selected.length) return;
    if (!window.confirm(`确认删除选中的 ${selected.length} 个部署？此操作不可撤销。`)) return;
    setGroups(prev => prev.filter(g => !g.selected));
    showToast(`已删除 ${selected.length} 个部署`);
  };

  // ─── Expand / collapse ───
  const toggleGroup = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };
  const toggleAllGroups = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    if (next) setExpanded(new Set(groups.map(g => g.name)));
    else setExpanded(new Set());
  };

  // ─── Sorting ───
  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };
  const getSortArrow = (col: string) => {
    if (sortCol !== col) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  const sortedFiltered = useMemo(() => {
    let result = groups.filter(g => {
      if (rgFilter && g.resourceGroup !== rgFilter) return false;
      if (statusFilter && g.status !== statusFilter) return false;
      if (search && g.name.toLowerCase().indexOf(search.toLowerCase()) === -1) return false;
      if (categoryFilter) {
        const catModel = CATALOG_MODELS.find(m => m.id === g.modelId);
        if (!catModel || catModel.category !== categoryFilter) return false;
      }
      return true;
    });
    if (sortCol) {
      result = [...result].sort((a, b) => {
        let va: string | number, vb: string | number;
        switch (sortCol) {
          case "name": va = a.name.toLowerCase(); vb = b.name.toLowerCase(); break;
          case "resourceGroup": va = a.resourceGroup; vb = b.resourceGroup; break;
          case "source": va = a.source; vb = b.source; break;
          case "replicas": va = getReplicasConfigured(a.replicas); vb = getReplicasConfigured(b.replicas); break;
          case "createdAt": va = a.createdAt; vb = b.createdAt; break;
          default: return 0;
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [groups, search, categoryFilter, statusFilter, rgFilter, sortCol, sortDir]);

  // ─── Inline replica editing ───
  const changeInline = (name: string, delta: number) => {
    const d = groups.find(x => x.name === name);
    if (!d) return;
    const currentEdit = inlineEdits[name] || {
      running: getReplicasRunning(d.replicas),
      configured: getReplicasConfigured(d.replicas),
    };
    if (delta > 0) {
      const originalConfigured = getReplicasConfigured(d.replicas);
      const maxForThis = getResourceGroupRemaining(d.resourceGroup, groups) + originalConfigured;
      if (currentEdit.configured >= maxForThis) {
        showToast(`该资源组的剩余资源最多可部署 ${maxForThis} 个实例`, true);
        return;
      }
      currentEdit.configured += 1;
    } else {
      currentEdit.configured = Math.max(0, currentEdit.configured - 1);
      currentEdit.running = Math.min(currentEdit.running, currentEdit.configured);
    }
    setInlineEdits(prev => ({ ...prev, [name]: { ...currentEdit } }));
  };
  const confirmInline = (name: string) => {
    const edit = inlineEdits[name];
    if (!edit) return;
    setGroups(prev => prev.map(g => g.name === name ? { ...g, replicas: `${edit.running}/${edit.configured}` } : g));
    setInlineEdits(prev => { const next = { ...prev }; delete next[name]; return next; });
  };
  const cancelInline = (name: string) => {
    setInlineEdits(prev => { const next = { ...prev }; delete next[name]; return next; });
  };

  // ─── Single deploy actions ───
  const startDeploy = (name: string) => setGroups(prev => prev.map(g => g.name === name ? { ...g, status: "running" as DeployStatus } : g));
  const stopDeploy = (name: string) => setGroups(prev => prev.map(g => g.name === name ? { ...g, status: "stopped" as DeployStatus } : g));
  const cloneDeploy = (g: DeployGroup) => openDeployModal("clone", g);
  const monitorDeploy = (name: string) => window.open(`https://grafana.example.com/d/model-monitor?deployment=${encodeURIComponent(name)}`, "_blank");
  const deleteDeploy = (name: string) => setGroups(prev => prev.filter(g => g.name !== name));

  // ─── Reset filters ───
  const resetFilters = () => { setSearch(""); setCategoryFilter(""); setStatusFilter(""); setRgFilter(""); };

  // ─── Table styles ───
  const thSt: React.CSSProperties = {
    height: 54, padding: "0 14px", background: "#fafbfc", borderBottom: "1px solid #e8ecf2",
    color: "#667085", fontSize: 14, fontWeight: 650, whiteSpace: "nowrap", textAlign: "left",
  };
  const tdSt: React.CSSProperties = {
    height: 58, padding: "0 14px", borderBottom: "1px solid #edf0f4", background: "#fff", verticalAlign: "middle",
  };
  const sortInnerSt: React.CSSProperties = { cursor: "pointer", userSelect: "none" };
  const sortArrowSt: React.CSSProperties = { color: "#99a4b5", fontSize: 11 };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 12, color: "#9ca3af" }}>
        <span>模型管理 / 部署模型</span>
      </div>

      {/* Panel */}
      <div className="flex-1 flex flex-col min-h-0" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e7ebf2", borderRadius: 16, boxShadow: "0 2px 12px rgba(31,45,61,0.05)", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{
          minHeight: 84, padding: "20px 24px", display: "flex", alignItems: "center", gap: 12,
          borderBottom: "1px solid #edf0f5", flexWrap: "wrap",
        }}>
          {/* Search */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索模型名称..."
              style={{
                height: 44, width: 220, padding: "0 36px 0 14px", border: "1px solid #d5ddea",
                borderRadius: 8, fontSize: 14, color: "#20242d", background: "#fff", outline: "none",
                fontFamily: "inherit",
              }}
              onFocus={e => e.currentTarget.style.borderColor = "#536df5"}
              onBlur={e => e.currentTarget.style.borderColor = "#d5ddea"}
            />
            {search && (
              <button type="button" aria-label="清空" onClick={() => setSearch("")}
                style={{
                  position: "absolute", right: 6, width: 24, height: 24, border: 0,
                  background: "transparent", color: "#99a4b5", fontSize: 18, cursor: "pointer", borderRadius: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#f0f2f5"; e.currentTarget.style.color = "#667085"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#99a4b5"; }}>
                ×
              </button>
            )}
          </div>

          {/* Category filter */}
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} aria-label="模型分类筛选"
            style={{
              height: 44, minWidth: 165, padding: "0 42px 0 16px", border: "1px solid #d5ddea",
              borderRadius: 8, background: "#fff", color: "#344054", fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
            {CATEGORY_FILTER_OPTS.map(o => <option key={o} value={o === "全部分类" ? "" : o}>{o}</option>)}
          </select>

          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="状态筛选"
            style={{
              height: 44, minWidth: 165, padding: "0 42px 0 16px", border: "1px solid #d5ddea",
              borderRadius: 8, background: "#fff", color: "#344054", fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
            {STATUS_FILTER_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Resource group filter */}
          <select value={rgFilter} onChange={e => setRgFilter(e.target.value)} aria-label="资源组筛选"
            style={{
              height: 44, minWidth: 165, padding: "0 42px 0 16px", border: "1px solid #d5ddea",
              borderRadius: 8, background: "#fff", color: "#344054", fontSize: 15, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>
            {RG_FILTER_OPTS.map(o => <option key={o} value={o === "全部资源组" ? "" : o}>{o}</option>)}
          </select>

          {/* Reset */}
          <button type="button" onClick={resetFilters}
            style={{
              height: 44, padding: "0 18px", display: "inline-flex", alignItems: "center", gap: 7,
              border: "1px solid #d5ddea", borderRadius: 8, background: "#fff", color: "#344054",
              fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#9eacf8"; e.currentTarget.style.color = "#4169f6"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d5ddea"; e.currentTarget.style.color = "#344054"; }}>
            <RotateCcw size={17} /> <span>重置</span>
          </button>

          <span style={{ flex: 1 }} />

          {/* Create button */}
          <button type="button" onClick={() => openDeployModal("add")}
            style={{
              height: 44, padding: "0 20px", border: 0, borderRadius: 9, fontSize: 15, fontWeight: 700,
              background: "linear-gradient(135deg,#4168f6,#5b63ed)", color: "#fff", cursor: "pointer",
              boxShadow: "0 5px 12px rgba(65,104,246,0.18)", display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: "inherit",
            }}>
            <Plus size={18} /> <span>新建部署</span>
          </button>
        </div>

        {/* Batch bar */}
        {selectedCount > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 24px",
            background: "#f0f4ff", borderBottom: "1px solid #dce3f5",
          }}>
            <span style={{ color: "#344054", fontSize: 13, fontWeight: 650 }}>已选 {selectedCount} 项</span>
            <button type="button" onClick={batchStart}
              style={{ height: 34, padding: "0 16px", border: "1px solid #9ecfff", borderRadius: 6, background: "#fff", color: "#0c7fcf", fontSize: 13, fontWeight: 650, cursor: "pointer", fontFamily: "inherit" }}>
              ▶ 一键启动
            </button>
            <button type="button" onClick={batchStop}
              style={{ height: 34, padding: "0 16px", border: "1px solid #ffc9c9", borderRadius: 6, background: "#fff", color: "#e5484d", fontSize: 13, fontWeight: 650, cursor: "pointer", fontFamily: "inherit" }}>
              ■ 批量停止
            </button>
            <button type="button" onClick={batchDelete}
              style={{ height: 34, padding: "0 16px", border: "1px solid #e0e0e0", borderRadius: 6, background: "#fff", color: "#666", fontSize: 13, fontWeight: 650, cursor: "pointer", fontFamily: "inherit" }}>
              ⌫ 批量删除
            </button>
          </div>
        )}

        {/* Table */}
        <div style={{ flex: 1, overflowX: "auto", overflowY: "auto" }}>
          <table style={{ minWidth: 1160, width: "100%", tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, color: "#354052", fontSize: 15 }}>
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
                <th style={{ ...thSt, textAlign: "center", width: 78 }}>
                  <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = indeterminate; }}
                    onChange={e => toggleSelectAll(e.target.checked)} aria-label="全选部署"
                    style={{ width: 17, height: 17, margin: 0, accentColor: "#536df5", cursor: "pointer" }} />
                </th>
                <th style={thSt}>
                  <button type="button" onClick={toggleAllGroups} title="展开/收起全部"
                    style={{
                      width: 22, height: 22, padding: 0, marginRight: 4, border: "1px solid #d5ddea",
                      borderRadius: 4, background: "#fff", color: "#667085", fontSize: 13, cursor: "pointer",
                      verticalAlign: "middle", lineHeight: 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f0f4ff"; e.currentTarget.style.color = "#4169f6"; e.currentTarget.style.borderColor = "#9eacf8"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#667085"; e.currentTarget.style.borderColor = "#d5ddea"; }}>
                    {allExpanded ? "⊟" : "⊞"}
                  </button>
                  <span style={sortInnerSt} onClick={() => handleSort("name")}>
                    名称 <span style={sortArrowSt}>{getSortArrow("name")}</span>
                  </span>
                </th>
                <th style={thSt}>
                  <span style={sortInnerSt} onClick={() => handleSort("resourceGroup")}>
                    资源组 <span style={sortArrowSt}>{getSortArrow("resourceGroup")}</span>
                  </span>
                </th>
                <th style={thSt}>
                  <span style={sortInnerSt} onClick={() => handleSort("source")}>
                    来源 <span style={sortArrowSt}>{getSortArrow("source")}</span>
                  </span>
                </th>
                <th style={thSt}>
                  <span style={sortInnerSt} onClick={() => handleSort("replicas")}>
                    实例数 <span style={sortArrowSt}>{getSortArrow("replicas")}</span>
                  </span>
                </th>
                <th style={thSt}>
                  <span style={sortInnerSt} onClick={() => handleSort("createdAt")}>
                    创建时间 <span style={sortArrowSt}>{getSortArrow("createdAt")}</span>
                  </span>
                </th>
                <th style={{ ...thSt, textAlign: "center" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...tdSt, height: 180, textAlign: "center", color: "#99a4b5", fontSize: 14 }}>
                    暂无数据
                  </td>
                </tr>
              ) : sortedFiltered.map(group => {
                const isExp = expanded.has(group.name);
                const edit = inlineEdits[group.name];
                const displayVal = edit ? `${edit.running}/${edit.configured}` : group.replicas;
                const isEditing = !!edit;
                const remaining = getResourceGroupRemaining(group.resourceGroup, groups);
                const configured = edit ? edit.configured : getReplicasConfigured(group.replicas);
                const capacity = RESOURCE_GROUP_CAPACITIES[group.resourceGroup] || 0;
                const atMax = configured >= capacity || remaining <= 0;
                const speech = isSpeechType(group.type);

                return (
                  <React.Fragment key={group.name}>
                    {/* Parent row */}
                    <tr>
                      <td style={{ ...tdSt, textAlign: "center" }}>
                        <input type="checkbox" checked={group.selected} onChange={e => toggleSelect(group.name, e.target.checked)}
                          aria-label={`选择 ${group.name}`}
                          style={{ width: 17, height: 17, margin: 0, accentColor: "#536df5", cursor: "pointer" }} />
                      </td>
                      <td style={tdSt}>
                        <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
                          <button type="button" onClick={() => toggleGroup(group.name)} aria-label="展开/收起"
                            style={{
                              width: 20, height: 24, padding: 0, border: 0, background: "transparent",
                              color: "#687386", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                            }}>
                            {isExp ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </button>
                          <span style={{
                            minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            color: "#20242d", fontWeight: 750,
                          }}>{group.name}</span>
                          <span style={{
                            display: "inline-flex", alignItems: "center", height: 28, padding: "0 10px",
                            borderRadius: 6, fontSize: 13, fontWeight: 650, whiteSpace: "nowrap",
                            background: speech ? "#ecf9ef" : "#eef3ff",
                            color: speech ? "#12a04a" : "#4b6ff2",
                          }}>{group.type}</span>
                        </div>
                      </td>
                      <td style={tdSt}>{group.resourceGroup}</td>
                      <td style={tdSt}>
                        <span style={{
                          display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          color: "#657084", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 14,
                        }} title={group.source}>{group.source}</span>
                      </td>
                      <td style={tdSt}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 0, border: "1px solid #dce2ec", borderRadius: 5, overflow: "hidden", background: "#fff", verticalAlign: "middle" }}>
                          <button type="button" onClick={() => changeInline(group.name, -1)} aria-label="减少实例数"
                            style={{ width: 22, height: 24, padding: 0, border: 0, background: "#f8fafc", color: "#667085", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>−</button>
                          <span style={{ minWidth: 28, textAlign: "center", color: "#20242d", fontSize: 12, fontWeight: 600, padding: "0 1px", whiteSpace: "nowrap" }}>{displayVal}</span>
                          <button type="button"
                            className={atMax && !isEditing ? "rs-btn-max" : ""}
                            onClick={() => changeInline(group.name, 1)} aria-label="增加实例数"
                            style={{
                              width: 22, height: 24, padding: 0, border: 0,
                              background: atMax && !isEditing ? "#f6f7f9" : "#f8fafc",
                              color: atMax && !isEditing ? "#c3cad5" : "#667085",
                              fontSize: 14, fontWeight: 700, cursor: "pointer",
                              display: "inline-flex", alignItems: "center", justifyContent: "center",
                            }}>＋</button>
                          {isEditing && (
                            <>
                              <button type="button" onClick={() => confirmInline(group.name)} title="确认"
                                style={{ width: 22, height: 24, padding: 0, border: 0, background: "#eaf8ef", color: "#0c9d42", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✓</button>
                              <button type="button" onClick={() => cancelInline(group.name)} title="取消"
                                style={{ width: 22, height: 24, padding: 0, border: 0, background: "#fff1f1", color: "#e5484d", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>✗</button>
                            </>
                          )}
                        </div>
                      </td>
                      <td style={tdSt}>{group.createdAt}</td>
                      <td style={{ ...tdSt, textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, position: "relative" }}>
                          <button type="button" title="编辑" onClick={() => openDeployModal("edit", group)}
                            style={{
                              width: 28, height: 32, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                              border: 0, background: "transparent", color: "#98a3b3", cursor: "pointer", borderRadius: 6,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#f2f5fa"; e.currentTarget.style.color = "#536df5"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#98a3b3"; }}>
                            <Pencil size={18} />
                          </button>
                          <GroupMoreMenu
                            group={group}
                            onEdit={() => openDeployModal("edit", group)}
                            onStart={() => startDeploy(group.name)}
                            onStop={() => stopDeploy(group.name)}
                            onClone={() => cloneDeploy(group)}
                            onMonitor={() => monitorDeploy(group.name)}
                            onDelete={() => deleteDeploy(group.name)}
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Child rows */}
                    {isExp && group.children.map(child => (
                      <tr key={child.name}
                        onMouseEnter={e => { e.currentTarget.querySelectorAll("td").forEach(td => (td as HTMLTableCellElement).style.background = "#fbfcff"); }}
                        onMouseLeave={e => { e.currentTarget.querySelectorAll("td").forEach(td => (td as HTMLTableCellElement).style.background = "#fff"); }}>
                        <td style={tdSt} />
                        <td style={tdSt}>
                          <div style={{ paddingLeft: 34, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#354052" }}>
                            {child.name}
                          </div>
                        </td>
                        <td style={tdSt} />
                        <td style={tdSt} />
                        <td style={tdSt}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", height: 30, padding: "0 12px",
                            borderRadius: 16, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap",
                            background: child.status === "running" ? "#eaf8ef" : "#edf5ff",
                            color: child.status === "running" ? "#0c9d42" : "#1769dd",
                          }}>
                            {child.status === "running" ? "运行中" : "待处理"}
                          </span>
                        </td>
                        <td style={tdSt}>{child.createdAt}</td>
                        <td style={{ ...tdSt, textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            <button type="button" title="删除"
                              style={{
                                width: 28, height: 32, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
                                border: 0, background: "transparent", color: "#ff3b41", cursor: "pointer", borderRadius: 6,
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#fff1f1"; e.currentTarget.style.color = "#e92d34"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ff3b41"; }}>
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deploy Modal */}
      {modalOpen && (
        <DeployModal
          mode={modalMode}
          groups={groups}
          onClose={closeModal}
          onSubmit={handleDeploy}
          showToast={showToast}
          modelId={mModelId}
          setModelId={setMModelId}
          modelSearch={mModelSearch}
          setModelSearch={setMModelSearch}
          modelPath={mModelPath}
          setModelPath={setMModelPath}
          imagePath={mImagePath}
          setImagePath={setMImagePath}
          remark={mRemark}
          setRemark={setMRemark}
          rg={mRg}
          setRg={setMRg}
          replicas={mReplicas}
          setReplicas={setMReplicas}
          placement={mPlacement}
          setPlacement={setMPlacement}
          advOpen={mAdvOpen}
          setAdvOpen={setMAdvOpen}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.isError ? "#e5484d" : "#059669", color: "#fff",
          padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 500,
          zIndex: 1000, pointerEvents: "none", transition: "opacity .3s",
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
