import { useState, useRef, useEffect } from "react";
import { Search, RotateCcw, Plus, X, Eye, Pencil, Trash2, Upload } from "lucide-react";

// ─── Model card data ───────────────────────────────────────────────────────────

interface ModelCard {
  id: string;
  developer: string;      // 智谱, 千问, DeepSeek
  name: string;
  size: string;           // parameter size in B (e.g. "671", "0.3")
  category: string;       // 通用大模型, 嵌入模型, 图片模型, 重排模型, 语音识别模型, 语音合成模型
  types: string[];        // array of selected types
  capability: string;     // 文生文, 图生文, 语音识别
  createdAt: string;      // date string
  weightPath: string;     // /models/xxx
  imagePath: string;      // harbor.xxx.com/...
  description: string;
  iconData?: string;      // base64 uploaded icon
}

const ALL_MODELS: ModelCard[] = [
  { id: "deepseek-v3", developer: "DeepSeek", name: "deepseek-v3", size: "671", category: "通用大模型", types: ["通用大模型"], capability: "文生文", createdAt: "2026-06-24", weightPath: "/models/deepseek-v3", imagePath: "harbor.xxx.com/lm/vllm:deepseek-v3", description: "DeepSeek V3 通用大语言模型。" },
  { id: "embedding-v3", developer: "智谱", name: "embedding-v3", size: "0.3", category: "嵌入模型", types: ["嵌入模型"], capability: "文生文", createdAt: "2026-04-08", weightPath: "/models/embedding-v3", imagePath: "harbor.xxx.com/lm/embedding:v3", description: "文本向量化模型。" },
  { id: "cogvlm-9b", developer: "智谱", name: "cogvlm-9b", size: "9", category: "图片模型", types: ["图片模型"], capability: "图生文", createdAt: "2026-03-03", weightPath: "/models/cogvlm-9b", imagePath: "harbor.xxx.com/lm/vllm:cogvlm-9b", description: "视觉语言理解模型。" },
  { id: "chatglm4-32b", developer: "智谱", name: "chatglm4-32b", size: "32", category: "通用大模型", types: ["通用大模型"], capability: "文生文", createdAt: "2026-03-03", weightPath: "/models/chatglm4-32b", imagePath: "harbor.xxx.com/lm/vllm:chatglm4-32b", description: "面向对话与生成任务的通用模型。" },
  { id: "llama-3-1", developer: "智谱", name: "LLaMA 3.1", size: "70", category: "通用大模型", types: ["通用大模型"], capability: "文生文", createdAt: "2025-11-24", weightPath: "/models/llama-3.1", imagePath: "harbor.xxx.com/lm/vllm:llama-3.1", description: "LLaMA 3.1 通用语言模型。" },
  { id: "baichuan-m2-plus", developer: "千问", name: "Baichuan-M2 Plus", size: "13", category: "通用大模型", types: ["通用大模型"], capability: "文生文", createdAt: "2025-11-24", weightPath: "/models/baichuan-m2-plus", imagePath: "harbor.xxx.com/lm/vllm:baichuan-m2-plus", description: "百川通用大语言模型。" },
  { id: "qwen3-7b", developer: "千问", name: "Qwen3-7B", size: "7", category: "通用大模型", types: ["通用大模型"], capability: "文生文", createdAt: "2025-10-28", weightPath: "/models/Qwen3-7B", imagePath: "harbor.xxx.com/lm/vllm:qwen3-7b", description: "通义千问 Qwen3 7B 模型。" },
  { id: "t1-100", developer: "千问", name: "T1-100", size: "100", category: "重排模型", types: ["重排模型"], capability: "文生文", createdAt: "2025-12-12", weightPath: "/models/T1-100", imagePath: "harbor.xxx.com/lm/vllm:t1-100", description: "面向复杂任务的推理模型。" },
  { id: "whisper-large-v3", developer: "智谱", name: "whisper-large-v3", size: "1.5", category: "语音识别模型", types: ["语音识别模型"], capability: "语音识别", createdAt: "2026-01-15", weightPath: "/models/whisper-large-v3", imagePath: "harbor.xxx.com/lm/vllm:whisper-v3", description: "OpenAI Whisper Large V3 语音识别模型。" },
];

// Brand/developer config — matches prototype's catalogDevelopers
const CATALOG_DEVELOPERS: Record<string, { label: string; glyph: string; className: string; bg: string }> = {
  "智谱": { label: "智谱", glyph: "智", className: "brand-zhipu", bg: "linear-gradient(145deg,#4267ef,#5668ff)" },
  "千问": { label: "千问", glyph: "千", className: "brand-tongyi", bg: "linear-gradient(145deg,#ff5537,#ff7135)" },
  "DeepSeek": { label: "DeepSeek", glyph: "D", className: "brand-deepseek", bg: "linear-gradient(145deg,#079bd2,#18b7e8)" },
};

const CATALOG_TYPE_OPTIONS = ["通用大模型", "嵌入模型", "图片模型", "重排模型", "语音识别模型", "语音合成模型"];

const CATALOG_CATEGORY_OPTIONS = ["全部类型", "通用大模型", "嵌入模型", "图片模型", "重排模型", "语音识别模型", "语音合成模型"];
const CATALOG_DEVELOPER_OPTIONS = ["全部开发者", "智谱", "千问", "DeepSeek"];

const CATALOG_IMAGE_OPTIONS = [
  "harbor.xxx.com/lm/vllm:v0.12.0",
  "harbor.xxx.com/lm/vllm:v0.11.0",
  "harbor.xxx.com/lm/sglang:v0.4.0",
  "harbor.xxx.com/lm/vllm:deepseek-v3",
  "harbor.xxx.com/lm/embedding:v3",
];

function getDeveloperConfig(developer: string) {
  return CATALOG_DEVELOPERS[developer] || {
    label: developer,
    glyph: (developer || "?").charAt(0).toUpperCase(),
    className: "brand-zhipu",
    bg: "linear-gradient(145deg,#4267ef,#5668ff)",
  };
}

// Category tag colors
function catalogCategoryClass(category: string): string {
  if (category === "嵌入模型" || category === "向量模型") return "category-embedding"; // green
  if (category === "图片模型" || category === "图像模型") return "category-image"; // orange
  if (category === "重排模型" || category === "推理模型") return "category-reasoning"; // pink
  return "category-llm"; // blue
}

const CATEGORY_STYLES: Record<string, React.CSSProperties> = {
  "category-llm": { background: "#edf2ff", color: "#4169f6" },
  "category-embedding": { background: "#ecf9ef", color: "#128237" },
  "category-image": { background: "#fff4e9", color: "#c84413" },
  "category-reasoning": { background: "#fff0f3", color: "#cc1748" },
};

// ─── Card More Menu ────────────────────────────────────────────────────────────

function CardMoreMenu({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        title="更多操作"
        style={{ marginLeft: "auto", border: 0, background: "transparent", color: "#9ba6b7", fontSize: 18, letterSpacing: 1, cursor: "pointer", padding: "5px 0 5px 8px", lineHeight: 1 }}
        onMouseEnter={e => (e.currentTarget.style.color = "#53627a")}
        onMouseLeave={e => (e.currentTarget.style.color = "#9ba6b7")}>•••</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", minWidth: 130, background: "#fff", border: "1px solid #e3e8f1", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,.12)", zIndex: 50, padding: 4, overflow: "hidden" }}>
          <button onClick={() => { onView(); setOpen(false); }} className="flex items-center gap-2"
            style={{ display: "flex", width: "100%", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, border: 0, background: "transparent", cursor: "pointer", color: "#344054", borderRadius: 5, whiteSpace: "nowrap" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f2f5fa")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <Eye size={16} /> 查看详情
          </button>
          <button onClick={() => { onEdit(); setOpen(false); }} className="flex items-center gap-2"
            style={{ display: "flex", width: "100%", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, border: 0, background: "transparent", cursor: "pointer", color: "#344054", borderRadius: 5, whiteSpace: "nowrap" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f2f5fa")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <Pencil size={16} /> 编辑
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }} className="flex items-center gap-2"
            style={{ display: "flex", width: "100%", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, border: 0, background: "transparent", cursor: "pointer", color: "#e5484d", borderRadius: 5, whiteSpace: "nowrap" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fff1f1")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <Trash2 size={16} /> 删除
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Model Card ────────────────────────────────────────────────────────────────

function ModelCardItem({ card, onView, onEdit, onDelete, onDeploy }: {
  card: ModelCard; onView: () => void; onEdit: () => void; onDelete: () => void; onDeploy: () => void;
}) {
  const dev = getDeveloperConfig(card.developer);
  const catClass = catalogCategoryClass(card.category);
  const catStyle = CATEGORY_STYLES[catClass] || CATEGORY_STYLES["category-llm"];

  return (
    <div style={{
      minWidth: 0, minHeight: 260, padding: 16, display: "flex", flexDirection: "column",
      background: "#fff", border: "1px solid #dfe5ee", borderRadius: 10,
      boxShadow: "0 3px 12px rgba(31,41,55,.03)", transition: "transform .18s,box-shadow .18s,border-color .18s",
    }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.transform = "translateY(-2px)"; el.style.borderColor = "#cad4e4"; el.style.boxShadow = "0 8px 20px rgba(31,41,55,.07)"; }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.transform = "translateY(0)"; el.style.borderColor = "#dfe5ee"; el.style.boxShadow = "0 3px 12px rgba(31,41,55,.03)"; }}>

      {/* Header: brand icon + name + more */}
      <div className="flex items-center" style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, marginBottom: 14 }}>
        {card.iconData ? (
          <img src={card.iconData} alt={card.name} style={{ width: 44, height: 44, borderRadius: 9, flex: "0 0 44px", objectFit: "cover", background: "#f4f6fa" }} />
        ) : (
          <span style={{
            width: 44, height: 44, borderRadius: 9, flex: "0 0 44px", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 19, fontWeight: 750, lineHeight: 1, background: dev.bg,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12)",
          }}>{dev.glyph}</span>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 title={card.name} style={{ minWidth: 0, color: "#20232a", fontSize: 17, fontWeight: 700, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{card.name}</h3>
        </div>
        <CardMoreMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Meta section */}
      <div style={{ display: "grid", gridTemplateColumns: "70px minmax(0,1fr)", rowGap: 8, alignItems: "center", fontSize: 13, lineHeight: 1.35 }}>
        <span style={{ color: "#9aa5b5", whiteSpace: "nowrap" }}>参数量</span>
        <span style={{ color: "#374151", textAlign: "right", fontWeight: 650, minWidth: 0 }}>{card.size}B</span>

        <span style={{ color: "#9aa5b5", whiteSpace: "nowrap" }}>开发者</span>
        <span title={card.developer} style={{ color: "#374151", textAlign: "right", fontWeight: 650, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.developer}</span>

        <span style={{ color: "#9aa5b5", whiteSpace: "nowrap" }}>模型分类</span>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", minHeight: 22, padding: "2px 7px", borderRadius: 5, fontSize: 12, fontWeight: 650, whiteSpace: "nowrap", ...catStyle }}>{card.category}</span>
        </span>

        <span style={{ color: "#9aa5b5", whiteSpace: "nowrap" }}>创建时间</span>
        <span style={{ color: "#687386", textAlign: "right", fontWeight: 500, minWidth: 0 }}>{card.createdAt}</span>
      </div>

      {/* Footer actions */}
      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #edf0f5", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onView} style={{ border: 0, background: "transparent", color: "#4169f6", fontSize: 14, fontWeight: 650, cursor: "pointer", padding: "5px 0" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#274bd8")}
          onMouseLeave={e => (e.currentTarget.style.color = "#4169f6")}>查看</button>
        <button onClick={onEdit} style={{ border: 0, background: "transparent", color: "#4169f6", fontSize: 14, fontWeight: 650, cursor: "pointer", padding: "5px 0" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#274bd8")}
          onMouseLeave={e => (e.currentTarget.style.color = "#4169f6")}>编辑</button>
        <button onClick={onDeploy} style={{ marginLeft: "auto", minWidth: 64, height: 34, border: 0, borderRadius: 7, cursor: "pointer", background: "linear-gradient(135deg,#4168f6,#5668ed)", color: "#fff", fontSize: 14, fontWeight: 700, boxShadow: "0 3px 8px rgba(65,104,246,.16)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg,#3157e9,#4859df)" )}
          onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg,#4168f6,#5668ed)")}>部署</button>
      </div>
    </div>
  );
}

// ─── Catalog Modal (Add / Edit / View) ─────────────────────────────────────────

interface CatalogModalProps {
  mode: "add" | "edit" | "view";
  initialData?: ModelCard | null;
  existingNames: string[];
  onClose: () => void;
  onSave: (card: ModelCard) => void;
}

function CatalogModal({ mode, initialData, existingNames, onClose, onSave }: CatalogModalProps) {
  const isView = mode === "view";
  const title = mode === "add" ? "新建模型" : mode === "edit" ? "编辑模型" : "模型详情";

  const [name, setName] = useState(initialData?.name || "");
  const [developer, setDeveloper] = useState(initialData?.developer || "");
  const [size, setSize] = useState(initialData?.size || "");
  const [iconData, setIconData] = useState(initialData?.iconData || "");
  const [types, setTypes] = useState<string[]>(initialData?.types || []);
  const [weightPath, setWeightPath] = useState(initialData?.weightPath || "");
  const [imagePath, setImagePath] = useState(initialData?.imagePath || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasIcon = !!iconData;

  const toggleType = (t: string) => {
    setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|svg\+xml)$/.test(file.type)) {
      e.target.value = "";
      setError("请上传 PNG、JPG 或 SVG 图片");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      e.target.value = "";
      setError("图标文件不能超过 5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setIconData(String(reader.result || ""));
      e.target.value = "";
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const clearIcon = () => {
    setIconData("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError("");
  };

  const handleSave = () => {
    if (!name.trim() || !developer.trim() || size === "" || Number(size) < 0 || !iconData || !types.length || !weightPath.trim() || !imagePath.trim()) {
      setError("请填写必填项");
      return;
    }
    const duplicate = existingNames.some(n => n.toLowerCase() === name.trim().toLowerCase() && n !== initialData?.name);
    if (duplicate) {
      setError("模型名称不可与已有记录重复");
      return;
    }
    const category = types[0] || "";
    const capability = (category === "图片模型" || category === "图像模型") ? "图生文" : "文生文";
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const createdAt = initialData?.createdAt || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const id = initialData?.id || `model-${now.getTime()}`;
    onSave({
      id, developer: developer.trim(), name: name.trim(), size: size.trim(),
      category, types, capability, createdAt,
      weightPath: weightPath.trim(), imagePath: imagePath.trim(),
      description: description.trim(), iconData,
    });
  };

  // Shared styles
  const inputSt: React.CSSProperties = {
    width: "100%", height: 40, padding: "0 12px", border: "1px solid #d5ddea",
    borderRadius: 7, color: "#20232a", fontSize: 13, outline: "none",
    background: isView ? "#f8fafc" : "#fff", boxSizing: "border-box" as const,
  };
  const textareaSt: React.CSSProperties = {
    width: "100%", height: 72, minHeight: 72, padding: "9px 12px", border: "1px solid #d5ddea",
    borderRadius: 7, color: "#20232a", fontSize: 13, outline: "none", lineHeight: 1.5,
    background: isView ? "#f8fafc" : "#fff", resize: "vertical", fontFamily: "inherit",
    boxSizing: "border-box" as const,
  };
  const labelSt: React.CSSProperties = { marginBottom: 5, color: "#344054", fontSize: 13, fontWeight: 650 };
  const hintSt: React.CSSProperties = { display: "block", marginTop: 4, color: "#929dad", fontSize: 11, lineHeight: 1.4 };
  const reqSt: React.CSSProperties = { color: "#ef4444", marginRight: 4 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(31,41,55,.44)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 16, overflow: "hidden" }}>
        <div onClick={e => e.stopPropagation()} style={{
          width: "min(860px, calc(100vw - 32px))", maxHeight: "calc(100vh - 32px)", overflow: "hidden",
          display: "flex", flexDirection: "column", borderRadius: 14, background: "#fff",
          boxShadow: "0 28px 80px rgba(15,23,42,.24)",
        }}>
          {/* Header */}
          <div className="flex items-center justify-between" style={{ flex: "0 0 auto", padding: "18px 24px 16px", borderBottom: "1px solid #edf0f4", borderRadius: "14px 14px 0 0" }}>
            <h3 style={{ fontSize: 20, lineHeight: 1.25, color: "#20232a", margin: 0 }}>{title}</h3>
            <button onClick={onClose} aria-label="关闭" style={{ width: 30, height: 30, border: 0, background: "transparent", cursor: "pointer", borderRadius: 6, fontSize: 24, fontWeight: 600, color: "#9aa4b3", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "18px 24px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20, rowGap: 0, alignItems: "start" }}>
              {/* 模型名称 */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt}><span style={reqSt}>*</span>模型名称</label>
                <input value={name} onChange={e => setName(e.target.value)} disabled={isView} placeholder="如 Qwen3-8B" style={inputSt} />
              </div>

              {/* 开发者 */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt}><span style={reqSt}>*</span>开发者</label>
                <input value={developer} onChange={e => setDeveloper(e.target.value)} disabled={isView} type="text" placeholder="请输入开发者，如 DeepSeek" style={inputSt} />
              </div>

              {/* 参数量（B） */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt}><span style={reqSt}>*</span>参数量（B）</label>
                <input value={size} onChange={e => setSize(e.target.value)} disabled={isView} type="number" placeholder="如 8.0" min={0} step={0.1} style={inputSt} />
                <span style={hintSt}>保留 1 位小数</span>
              </div>

              {/* 图标 */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt}><span style={reqSt}>*</span>图标</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 56 }}>
                  <div style={{ width: 56, height: 56, flex: "0 0 56px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #d9e0ea", borderRadius: 8, background: "#f8fafc" }}>
                    {hasIcon ? (
                      <img src={iconData} alt="模型图标预览" style={{ width: 56, height: 56, objectFit: "cover", background: "#f8fafc" }} />
                    ) : (
                      <span style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", color: "#586273" }}>
                        <svg width={36} height={36} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" style={{ color: "#566173", display: "block" }}>
                          <rect x="7" y="5" width="50" height="50" rx="7" />
                          <circle cx="21" cy="19" r="5" />
                          <path d="M8 42c7-7 13-11 20-10 4 .5 7 2.4 10 1.3 6-2.3 10-8.2 19-8.8" />
                          <path d="M25 55c-.5-11 3.5-18.5 13-21.7" />
                        </svg>
                      </span>
                    )}
                  </div>
                  {!isView && (
                    <div style={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <label style={{ height: 36, padding: "0 13px", display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #cfd7e5", borderRadius: 7, color: "#4b5fdf", background: "#fff", fontSize: 13, fontWeight: 650, cursor: "pointer" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#7890f6"; e.currentTarget.style.background = "#f5f7ff"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#cfd7e5"; e.currentTarget.style.background = "#fff"; }}>
                          <Upload size={14} />
                          <span>{hasIcon ? "重新上传" : "上传本地图片"}</span>
                          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleIconUpload} style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
                        </label>
                        {hasIcon && (
                          <button onClick={clearIcon} type="button" style={{ height: 36, padding: "0 12px", border: "1px solid #f3b8bb", borderRadius: 7, color: "#d83b42", background: "#fff", fontSize: 13, fontWeight: 650, cursor: "pointer" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#e86a70"; e.currentTarget.style.background = "#fff5f5"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "#f3b8bb"; e.currentTarget.style.background = "#fff"; }}>
                            删除
                          </button>
                        )}
                      </div>
                      <span style={{ color: "#929dad", fontSize: 11, lineHeight: 1.35, whiteSpace: "nowrap" }}>支持 PNG、JPG、SVG，最大 5 MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 模型类型 — full row */}
              <div style={{ gridColumn: "1 / -1", marginBottom: 14 }}>
                <label style={labelSt}><span style={reqSt}>*</span>模型类型</label>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  {CATALOG_TYPE_OPTIONS.map(t => {
                    const checked = types.includes(t);
                    return (
                      <label key={t} style={{ position: "relative", cursor: isView ? "default" : "pointer" }}>
                        <input type="checkbox" checked={checked} disabled={isView} onChange={() => toggleType(t)} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                        <span style={{
                          minHeight: 36, padding: "7px 12px", display: "inline-flex", alignItems: "center",
                          border: `1px solid ${checked ? "#7890f6" : "#d9e0ea"}`, borderRadius: 7,
                          background: checked ? "#f0f4ff" : "#fff", color: checked ? "#3f5bd8" : "#596579",
                          fontSize: 13, lineHeight: 1.35, fontWeight: checked ? 650 : 400,
                          boxShadow: checked ? "0 0 0 1px rgba(81,107,243,.06)" : "none",
                          opacity: isView ? 0.72 : 1,
                        }}>{t}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 模型权重地址 */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt}><span style={reqSt}>*</span>模型权重地址</label>
                <input value={weightPath} onChange={e => setWeightPath(e.target.value)} disabled={isView} placeholder="如 /models/Qwen3-8B" style={inputSt} />
                <span style={hintSt}>NFS 共享盘权重文件路径</span>
              </div>

              {/* 模型镜像地址 */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelSt}><span style={reqSt}>*</span>模型镜像地址</label>
                <input value={imagePath} onChange={e => setImagePath(e.target.value)} disabled={isView} list="catalogImageOptions" placeholder="搜索或输入 Harbor 镜像地址" autoComplete="off" style={inputSt} />
                <datalist id="catalogImageOptions">
                  {CATALOG_IMAGE_OPTIONS.map(o => <option key={o} value={o} />)}
                </datalist>
                <span style={hintSt}>输入关键字可搜索 Harbor 镜像，也可直接粘贴完整地址</span>
              </div>

              {/* 简介 — full row */}
              <div style={{ gridColumn: "1 / -1", marginBottom: 14 }}>
                <label style={labelSt}>简介</label>
                <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))} disabled={isView} maxLength={500} placeholder="模型简介，最长 500 字" style={textareaSt} />
              </div>

              {/* Form error — full row */}
              {error && (
                <div style={{ gridColumn: "1 / -1", margin: "-10px 0 18px", padding: "10px 13px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 14 }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ flex: "0 0 auto", padding: "12px 24px", borderTop: "1px solid #edf0f4", display: "flex", justifyContent: "flex-end", gap: 10, background: "rgba(255,255,255,.97)" }}>
            <button onClick={onClose} style={{ height: 40, minWidth: 84, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 14, fontWeight: 650, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
            {!isView && (
              <button onClick={handleSave} style={{ height: 40, minWidth: 92, display: "inline-flex", alignItems: "center", justifyContent: "center", border: 0, borderRadius: 8, background: "linear-gradient(135deg,#4168f6,#5668ed)", color: "#fff", fontSize: 14, fontWeight: 650, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg,#3157e9,#4859df)")}
                onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg,#4168f6,#5668ed)")}>确认</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Model Management Page ─────────────────────────────────────────────────────

export function ModelManagementPage({ onDeploy }: { onDeploy?: (card: ModelCard) => void } = {}) {
  const [searchInput, setSearchInput] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDeveloper, setFilterDeveloper] = useState("");
  const [models, setModels] = useState<ModelCard[]>(ALL_MODELS);
  const [modalState, setModalState] = useState<{ mode: "add" | "edit" | "view"; id: string | null } | null>(null);

  const filtered = models.filter(m => {
    const query = searchInput.trim().toLowerCase();
    const matchesName = !query || m.name.toLowerCase().includes(query);
    const matchesCategory = !filterCategory || (m.types || [m.category]).includes(filterCategory);
    const matchesDeveloper = !filterDeveloper || m.developer === filterDeveloper;
    return matchesName && matchesCategory && matchesDeveloper;
  });

  const doReset = () => { setSearchInput(""); setFilterCategory(""); setFilterDeveloper(""); };

  const handleSave = (card: ModelCard) => {
    setModels(prev => {
      const idx = prev.findIndex(m => m.id === card.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = card;
        return next;
      }
      return [card, ...prev];
    });
    setModalState(null);
  };

  const handleDelete = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
  };

  const currentModel = modalState?.id ? models.find(m => m.id === modalState.id) || null : null;
  const existingNames = models.map(m => m.name);

  const selSt: React.CSSProperties = {
    height: 38, padding: "0 28px 0 12px", fontSize: 13, border: "1px solid #d5ddea",
    borderRadius: 8, outline: "none", background: "#fff", color: "#344054",
    appearance: "none", cursor: "pointer", fontFamily: "inherit",
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex-1 flex flex-col min-h-0" style={{ margin: "16px 24px 24px" }}>
        {/* Filter bar — white card with border */}
        <div className="flex items-center" style={{
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          padding: "16px 18px", marginBottom: 20, background: "#fff",
          border: "1px solid #e3e8f1", borderRadius: 10, boxShadow: "0 2px 10px rgba(31,41,55,.035)",
        }}>
          {/* Search box with icon + clear */}
          <div style={{ position: "relative", width: 260, flex: "0 0 260px" }}>
            <Search size={17} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aab2bf", pointerEvents: "none" }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="搜索模型名称..."
              style={{
                width: "100%", height: 38, padding: "6px 40px 6px 38px", fontSize: 13,
                border: "1px solid #d5ddea", borderRadius: 8, outline: "none",
                color: "#20232a", background: "#fff", fontFamily: "inherit", boxSizing: "border-box" as const,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "#4169f6")}
              onBlur={e => (e.currentTarget.style.borderColor = "#d5ddea")}
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} aria-label="清空搜索词" type="button" style={{
                position: "absolute", right: 9, top: "50%", width: 22, height: 22, padding: 0,
                transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center",
                border: 0, borderRadius: "50%", background: "#c5c9d0", color: "#fff", cursor: "pointer",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#9da5b1"; e.currentTarget.style.transform = "translateY(-50%) scale(1.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#c5c9d0"; e.currentTarget.style.transform = "translateY(-50%)"; }}>
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div style={{ position: "relative" }}>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value === "全部类型" ? "" : e.target.value)} style={selSt}>
              {CATALOG_CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#9aa5b5", pointerEvents: "none" }}>▾</span>
          </div>

          {/* Developer filter */}
          <div style={{ position: "relative" }}>
            <select value={filterDeveloper} onChange={e => setFilterDeveloper(e.target.value === "全部开发者" ? "" : e.target.value)} style={selSt}>
              {CATALOG_DEVELOPER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "#9aa5b5", pointerEvents: "none" }}>▾</span>
          </div>

          {/* Reset button */}
          <button onClick={doReset} type="button" style={{
            height: 38, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 6,
            border: "1px solid #d5ddea", borderRadius: 8, background: "#fff", color: "#344054",
            fontSize: 13, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#b0bdd0"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#d5ddea"; }}>
            <RotateCcw size={16} /> <span>重置</span>
          </button>

          <div style={{ flex: 1 }} />

          {/* New model button */}
          <button onClick={() => setModalState({ mode: "add", id: null })}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px",
              fontSize: 13, fontWeight: 500, color: "#fff", background: "#4169f6", border: "none",
              borderRadius: 8, cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3157e9")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4169f6")}>
            <Plus size={14} /> 新建模型
          </button>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div style={{ padding: "80px 20px", color: "#98a2b3", textAlign: "center", background: "#fff", border: "1px dashed #d8dee9", borderRadius: 14 }}>
              暂无符合条件的模型
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
              {filtered.map(m => (
                <ModelCardItem
                  key={m.id}
                  card={m}
                  onView={() => setModalState({ mode: "view", id: m.id })}
                  onEdit={() => setModalState({ mode: "edit", id: m.id })}
                  onDelete={() => handleDelete(m.id)}
                  onDeploy={() => onDeploy?.(m)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {modalState && (
        <CatalogModal
          mode={modalState.mode}
          initialData={currentModel}
          existingNames={existingNames}
          onClose={() => setModalState(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
