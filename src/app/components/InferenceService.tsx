import { useState } from "react";
import { Search, RotateCcw, Plus, ChevronDown, ChevronLeft, ChevronRight, Copy, X, Check, Info } from "lucide-react";

interface ServiceRow {
  id: number;
  modelKey: string;
  status: "运行中" | "停止" | "异常";
  publishType: "自定义服务发布" | "从模型实例";
  type: string;
  callMode: string;
  qpm: number;
  creator: string;
  space: string;
  updatedAt: string;
}

const MK1 = "glm-turbo:1:177814520638";
const MK2 = "chatglm4-32b:1:1778140573042";
const MK3 = "glm-4.5:1:1778133574746";
const MK4 = "glm-5:1:1772534438230";

const ALL_SERVICES: ServiceRow[] = [
  { id: 1, modelKey: MK1, status: "运行中", publishType: "自定义服务发布", type: "默认", callMode: "",    qpm: 0, creator: "admin", space: "admin空间", updatedAt: "2026-05-10 09:30:00" },
  { id: 2, modelKey: MK2, status: "运行中", publishType: "从模型实例",    type: "默认", callMode: "SSE", qpm: 0, creator: "admin", space: "admin空间", updatedAt: "2026-05-08 14:20:00" },
  { id: 3, modelKey: MK3, status: "运行中", publishType: "从模型实例",    type: "默认", callMode: "SSE", qpm: 0, creator: "admin", space: "admin空间", updatedAt: "2026-05-07 16:48:00" },
  { id: 4, modelKey: MK4, status: "运行中", publishType: "自定义服务发布", type: "默认", callMode: "",    qpm: 0, creator: "admin", space: "admin空间", updatedAt: "2026-03-22 11:15:00" },
];

const STATUS_CFG = {
  "运行中": { bg: "#f0faf5", text: "#16a34a", border: "#bbf7d0" },
  "停止":   { bg: "#f9fafb", text: "#6b7280", border: "#e5e7eb" },
  "异常":   { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
};

const PUBLISH_TYPE_CFG = {
  "自定义服务发布": { bg: "#eff4ff", text: "#4f6ef7", border: "#c7d9ff" },
  "从模型实例":    { bg: "#f0faf5", text: "#16a34a", border: "#bbf7d0" },
};

const STATUS_OPTS      = ["运行中", "停止", "异常"];
const PUBLISH_TYPE_OPTS = ["自定义服务发布", "从模型实例"];
const PAGE_SIZE = 10;

// ─── 发布推理服务 Drawer ───────────────────────────────────────────────────────

const CALL_MODE_OPTS = ["SSE", "HTTP", "gRPC", "WebSocket"];

function RadioDot({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2" style={{ cursor: "pointer", fontSize: 13, color: checked ? "#4f6ef7" : "#374151" }}>
      <span style={{
        width: 16, height: 16, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`, background: checked ? "#4f6ef7" : "#fff",
      }}>
        {checked && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
      </span>
      <input type="radio" checked={checked} onChange={onChange} style={{ display: "none" }} />
      {label}
    </label>
  );
}

function CheckboxItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-1.5" style={{ cursor: "pointer", fontSize: 13, padding: "4px 10px", borderRadius: 5, border: `1px solid ${checked ? "#4f6ef7" : "#e0e3ed"}`, background: checked ? "#eff4ff" : "#fff", color: checked ? "#4f6ef7" : "#374151" }}>
      <span style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`, background: checked ? "#4f6ef7" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {checked && <Check size={9} color="#fff" strokeWidth={3} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      {label}
    </label>
  );
}

const fieldLabelSt: React.CSSProperties = { fontSize: 12.5, color: "#9ca3af", width: 90, flexShrink: 0, paddingTop: 7 };
const inputSt: React.CSSProperties = {
  flex: 1, height: 34, padding: "0 10px", fontSize: 12.5, border: "1px solid #e0e3ed",
  borderRadius: 6, outline: "none", color: "#1a1d23", background: "#fff", boxSizing: "border-box" as const,
};

function PublishServiceDrawer({ onClose }: { onClose: () => void }) {
  const [publishMode, setPublishMode] = useState<"instance" | "custom">("instance");
  const [instanceCode, setInstanceCode] = useState("glm4moe-360b-20260507135934723");
  const [modelKey, setModelKey] = useState("glm-4.5:1:177822951311777");
  const [requestUrl, setRequestUrl] = useState("http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions");
  const [requestHeader, setRequestHeader] = useState('{"Authorization": "Bearer xxxxx", "Content-Type": "application/json"}');
  const [customModel, setCustomModel] = useState("");
  const [inferType, setInferType] = useState("默认");
  const [callMode, setCallMode] = useState("SSE");
  const [featureTool, setFeatureTool] = useState(true);
  const [featureMulti, setFeatureMulti] = useState(true);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23" }}>发布推理服务</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: "16px 20px" }}>
          {/* 发布方式 */}
          <div className="flex items-center gap-4 mb-4">
            <span style={fieldLabelSt}>发布方式：</span>
            <div className="flex items-center gap-4">
              <RadioDot label="从模型实例" checked={publishMode === "instance"} onChange={() => setPublishMode("instance")} />
              <RadioDot label="自定义服务发布" checked={publishMode === "custom"} onChange={() => setPublishMode("custom")} />
            </div>
          </div>

          {publishMode === "instance" ? (
            <>
              {/* 模型实例编码 */}
              <div className="flex items-start gap-2 mb-3">
                <span style={{ ...fieldLabelSt, color: "#374151" }}><span style={{ color: "#ef4444" }}>*</span> 模型实例编码：</span>
                <input value={instanceCode} onChange={e => setInstanceCode(e.target.value)} style={inputSt} />
              </div>
              {/* 模型类型 */}
              <div className="flex items-center gap-2 mb-3">
                <span style={fieldLabelSt}>模型类型：</span>
                <span style={{ fontSize: 13, color: "#374151" }}>文生文</span>
              </div>
              {/* Model Key */}
              <div className="flex items-start gap-2 mb-3">
                <span style={fieldLabelSt}>Model Key：</span>
                <input value={modelKey} onChange={e => setModelKey(e.target.value)} placeholder="glm-4.5:1:177..." style={{ ...inputSt, color: "#9ca3af" }} />
              </div>
            </>
          ) : (
            <>
              {/* 自定义Model */}
              <div className="flex items-start gap-2 mb-3">
                <span style={{ ...fieldLabelSt, color: "#374151" }}><span style={{ color: "#ef4444" }}>*</span> 自定义Model：</span>
                <input value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="请输入自定义模型名" style={inputSt} />
              </div>
            </>
          )}

          {/* 请求URL */}
          <div className="flex items-start gap-2 mb-3">
            <span style={fieldLabelSt}>请求URL：</span>
            <input value={requestUrl} onChange={e => setRequestUrl(e.target.value)} style={inputSt} />
          </div>

          {/* 请求Header */}
          <div className="flex items-start gap-2 mb-3">
            <span style={fieldLabelSt}>请求Header：</span>
            <textarea value={requestHeader} onChange={e => setRequestHeader(e.target.value)}
              style={{ flex: 1, height: 60, padding: "6px 10px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", resize: "vertical", fontFamily: "monospace", color: "#374151" }} />
          </div>

          {/* Inference Type */}
          <div className="flex items-center gap-4 mb-3">
            <span style={fieldLabelSt}>Inference Type：</span>
            <div className="flex items-center gap-4">
              <RadioDot label="默认" checked={inferType === "默认"} onChange={() => setInferType("默认")} />
              <RadioDot label="流式" checked={inferType === "流式"} onChange={() => setInferType("流式")} />
            </div>
          </div>

          {/* 调用方式 */}
          <div className="flex items-center gap-2 mb-3">
            <span style={fieldLabelSt}>调用方式：</span>
            <div style={{ position: "relative", flex: 1 }}>
              <select value={callMode} onChange={e => setCallMode(e.target.value)}
                style={{ width: "100%", height: 34, padding: "0 28px 0 10px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none" }}>
                <option value="">请选择</option>
                {CALL_MODE_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* 支持特性 */}
          <div className="flex items-center gap-2 mb-3">
            <span style={fieldLabelSt}>支持特性：</span>
            <div className="flex items-center gap-2">
              <CheckboxItem label="工具调用" checked={featureTool} onChange={() => setFeatureTool(v => !v)} />
              <CheckboxItem label="多轮对话" checked={featureMulti} onChange={() => setFeatureMulti(v => !v)} />
            </div>
          </div>

          {/* 所属空间 */}
          <div className="flex items-center gap-2 mb-3">
            <span style={fieldLabelSt}>所属空间：</span>
            <span style={{ fontSize: 13, color: "#374151" }}>admin空间</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "14px 20px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确认</button>
        </div>
      </div>
    </>
  );
}

// ─── 推理服务详情 Drawer ───────────────────────────────────────────────────────

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2" style={{ marginTop: 6, background: "#f8faff", border: "1px solid #e0e8ff", borderRadius: 8, padding: "10px 12px" }}>
      <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 20, height: 20, background: "#4f6ef7", marginTop: 1 }}>
        <Info size={11} color="#fff" />
      </div>
      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, wordBreak: "break-all", fontFamily: "monospace" }}>{children}</div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#374151" }}>{children}</div>
    </div>
  );
}

function ServiceDetailDrawer({ row, onClose }: { row: ServiceRow; onClose: () => void }) {
  const ptc = {
    "自定义服务发布": { bg: "#eff4ff", text: "#4f6ef7", border: "#c7d9ff" },
    "从模型实例":    { bg: "#f0faf5", text: "#16a34a", border: "#bbf7d0" },
  }[row.publishType];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 400, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23" }}>推理服务详情</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: "18px 20px" }}>
          {/* 发布方式 */}
          <DetailRow label="发布方式：">
            <span style={{ fontSize: 12.5, fontWeight: 500, padding: "3px 10px", borderRadius: 5, background: ptc.bg, color: ptc.text, border: `1px solid ${ptc.border}` }}>
              {row.publishType}
            </span>
          </DetailRow>

          {row.publishType === "自定义服务发布" ? (
            <>
              <DetailRow label="自定义Model：">glm-turbo</DetailRow>
              <DetailRow label="请求URL：">http://10.2.0.68:8013/v1/chat/completions</DetailRow>
              <DetailRow label="请求Header：">xxx</DetailRow>
            </>
          ) : null}

          <div style={{ height: 1, background: "#f0f2f7", margin: "4px 0 16px" }} />

          {/* 模型实例编码 */}
          <DetailRow label="模型实例编码：">
            <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>
              {row.publishType === "自定义服务发布"
                ? "general-model-20260507171332484"
                : row.modelKey.replace(/:.+/, "-inst-20260507155613025")}
            </span>
          </DetailRow>

          {/* Model Key */}
          <DetailRow label="Model Key：">
            <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>{row.modelKey}</span>
            <InfoCard>http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions</InfoCard>
          </DetailRow>

          {/* 请求Header */}
          <DetailRow label="请求Header：">
            <InfoCard>{"{"}"Authorization": "Bearer xxxxx", "Content-Type": "application/json"{"}"}</InfoCard>
          </DetailRow>

          {/* 推理类型 */}
          <DetailRow label="推理类型：">
            <span style={{ fontSize: 12.5, fontWeight: 500, padding: "3px 10px", borderRadius: 5, background: "#eff4ff", color: "#4f6ef7", border: "1px solid #c7d9ff" }}>默认</span>
          </DetailRow>

          {/* 调用方式 */}
          <DetailRow label="调用方式：">
            <span style={{ color: row.callMode ? "#374151" : "#9ca3af" }}>{row.callMode || "—"}</span>
          </DetailRow>

          {/* 支持特性 */}
          <DetailRow label="支持特性：">
            <span style={{ color: "#9ca3af" }}>—</span>
          </DetailRow>

          <div style={{ height: 1, background: "#f0f2f7", margin: "4px 0 16px" }} />

          {/* 更新时间 */}
          <DetailRow label="更新时间：">{row.updatedAt}</DetailRow>
          <DetailRow label="创建人：">{row.creator}</DetailRow>
          <DetailRow label="所属空间：">{row.space}</DetailRow>
        </div>
      </div>
    </>
  );
}

function QpmDetailModal({ row, onClose }: { row: ServiceRow; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 520, background: "#fff", borderRadius: 12, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.15)", padding: "24px",
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>QPM 详情</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          Model Key：<span style={{ fontFamily: "monospace", color: "#374151" }}>{row.modelKey}</span>
        </div>
        <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 13 }}>当前 QPM：<span style={{ fontSize: 24, fontWeight: 700, color: "#1a1d23" }}>0</span></div>
        <div className="flex justify-end">
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "8px 24px", cursor: "pointer" }}>关闭</button>
        </div>
      </div>
    </>
  );
}

export function InferenceServicePage() {
  const [statusFilter, setStatusFilter]       = useState("");
  const [modelKeyInput, setModelKeyInput]     = useState("");
  const [modelKeyQuery, setModelKeyQuery]     = useState("");
  const [publishTypeFilter, setPublishTypeFilter] = useState("");
  const [page, setPage]                       = useState(1);
  const [goPage, setGoPage]                   = useState("");
  const [rows, setRows]                       = useState<ServiceRow[]>(ALL_SERVICES);
  const [qpmRow, setQpmRow]                   = useState<ServiceRow | null>(null);
  const [showPublish, setShowPublish]         = useState(false);
  const [detailRow, setDetailRow]             = useState<ServiceRow | null>(null);

  const filtered = rows.filter(r => {
    if (statusFilter      && r.status !== statusFilter)           return false;
    if (publishTypeFilter && r.publishType !== publishTypeFilter) return false;
    if (modelKeyQuery     && !r.modelKey.includes(modelKeyQuery)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const reset = () => {
    setStatusFilter(""); setPublishTypeFilter(""); setModelKeyInput(""); setModelKeyQuery(""); setPage(1);
  };
  const doSearch = () => { setModelKeyQuery(modelKeyInput); setPage(1); };

  const selectSt: React.CSSProperties = {
    height: 34, padding: "0 30px 0 10px", fontSize: 13, border: "1px solid #e0e3ed",
    borderRadius: 6, outline: "none", background: "#fff", appearance: "none", cursor: "pointer",
    color: "#9ca3af",
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }}>首页</span>
        <span>/</span>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }}>模型服务</span>
        <span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>推理服务</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 服务状态 */}
            <div style={{ position: "relative" }}>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ ...selectSt, width: 148, color: statusFilter ? "#1a1d23" : "#9ca3af" }}>
                <option value="">请选择服务状态</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>

            {/* Model Key */}
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 10px" }}>
              <input type="text" placeholder="请输入Model Key" value={modelKeyInput}
                onChange={e => setModelKeyInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ fontSize: 13, border: "none", outline: "none", width: 160, background: "transparent", color: "#1a1d23" }} />
            </div>

            {/* 发布类型 */}
            <div style={{ position: "relative" }}>
              <select value={publishTypeFilter} onChange={e => { setPublishTypeFilter(e.target.value); setPage(1); }}
                style={{ ...selectSt, width: 148, color: publishTypeFilter ? "#1a1d23" : "#9ca3af" }}>
                <option value="">请选择发布类型</option>
                {PUBLISH_TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>

            {/* 搜索 */}
            <button onClick={doSearch} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <Search size={13} /> 搜索
            </button>

            {/* 重置 */}
            <button onClick={reset} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <RotateCcw size={13} /> 重置
            </button>
          </div>

          {/* 发布推理服务 */}
          <button onClick={() => setShowPublish(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Plus size={14} /> 发布推理服务
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f9fc" }}>
                {["Model Key", "服务状态", "发布类型", "类型", "调用方式", "QPM", "创建人", "所属空间", "更新时间", "操作"].map(col => (
                  <th key={col} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td></tr>
              ) : pageRows.map(row => {
                const sc  = STATUS_CFG[row.status];
                const ptc = PUBLISH_TYPE_CFG[row.publishType];
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f5f7fa" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                    {/* Model Key */}
                    <td style={{ padding: "12px 14px", maxWidth: 180 }}>
                      <div className="flex items-start gap-1.5">
                        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 16, height: 16, marginTop: 2 }}>
                          <Copy size={13} color="#9ca3af" />
                        </div>
                        <span style={{ fontFamily: "monospace", fontSize: 12.5, color: "#374151", wordBreak: "break-all", lineHeight: 1.6 }}>{row.modelKey}</span>
                      </div>
                    </td>

                    {/* 服务状态 */}
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, padding: "3px 10px", borderRadius: 5, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {row.status}
                      </span>
                    </td>

                    {/* 发布类型 */}
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, padding: "3px 10px", borderRadius: 5, background: ptc.bg, color: ptc.text, border: `1px solid ${ptc.border}` }}>
                        {row.publishType}
                      </span>
                    </td>

                    {/* 类型 */}
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{row.type}</td>

                    {/* 调用方式 */}
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{row.callMode || "—"}</td>

                    {/* QPM */}
                    <td style={{ padding: "12px 14px" }}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: "#374151" }}>{row.qpm}</span>
                        <button onClick={() => setQpmRow(row)} style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>详情</button>
                      </div>
                    </td>

                    {/* 创建人 */}
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{row.creator}</td>

                    {/* 所属空间 */}
                    <td style={{ padding: "12px 14px", color: "#374151" }}>{row.space}</td>

                    {/* 更新时间 */}
                    <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{row.updatedAt.slice(0, 7)}...</td>

                    {/* 操作 */}
                    <td style={{ padding: "12px 14px" }}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setDetailRow(row)} style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>查看</button>
                        <button onClick={() => setRows(prev => prev.filter(r => r.id !== row.id))}
                          style={{ fontSize: 12.5, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}>删除</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {filtered.length} 条</span>
            <div style={{ position: "relative" }}>
              <select style={{ height: 28, padding: "0 28px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", appearance: "none", cursor: "pointer", color: "#374151" }}>
                <option>10条/页</option>
                <option>20条/页</option>
              </select>
              <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: page === n ? "#4f6ef7" : "#e0e3ed", borderRadius: 5, background: page === n ? "#4f6ef7" : "#fff", color: page === n ? "#fff" : "#374151", fontSize: 12.5, fontWeight: page === n ? 600 : 400, cursor: "pointer" }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
              <ChevronRight size={13} />
            </button>
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>前往</span>
              <input type="number" value={goPage} onChange={e => setGoPage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && goPage) { setPage(Math.min(totalPages, Math.max(1, Number(goPage)))); setGoPage(""); } }}
                style={{ width: 40, height: 28, textAlign: "center", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }} />
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>页</span>
            </div>
          </div>
        </div>
      </div>

      {qpmRow && <QpmDetailModal row={qpmRow} onClose={() => setQpmRow(null)} />}
      {showPublish && <PublishServiceDrawer onClose={() => setShowPublish(false)} />}
      {detailRow && <ServiceDetailDrawer row={detailRow} onClose={() => setDetailRow(null)} />}
    </div>
  );
}
