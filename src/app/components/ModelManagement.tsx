import { useMemo, useRef, useState, type ChangeEvent, type CSSProperties } from "react";
import { Image as ImageIcon, MoreHorizontal, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { MODEL_CAPABILITIES, MODEL_CATEGORIES, type ModelCapability, type ModelCategory, type ModelRecord } from "../model-management/types";

interface ModelManagementPageProps {
  models: ModelRecord[];
  onModelsChange: (models: ModelRecord[]) => void;
  onDeploy?: (model: ModelRecord) => void;
}

type ModalMode = "add" | "edit" | "view";

const EMPTY_FORM: ModelRecord = {
  id: "",
  name: "",
  developer: "",
  iconData: "",
  paramSize: "",
  category: "LLM",
  capabilities: [],
  weightPath: "",
  imagePath: "",
  description: "",
  createdAt: "",
};

const IMAGE_OPTIONS = [
  "harbor.xxx.com/lm/vllm:v0.12.0",
  "harbor.xxx.com/lm/vllm:v0.11.0",
  "harbor.xxx.com/lm/sglang:v0.4.0",
  "harbor.xxx.com/lm/vllm:deepseek-v3",
  "harbor.xxx.com/lm/embedding:v3",
];

const buttonPrimary: CSSProperties = {
  height: 36,
  padding: "0 16px",
  border: 0,
  borderRadius: 7,
  background: "#4f6ef7",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 11px",
  border: "1px solid #dfe3eb",
  borderRadius: 7,
  outline: "none",
  background: "#fff",
  color: "#20242d",
  fontSize: 13,
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "#374151",
  fontSize: 13,
  fontWeight: 600,
};

function categoryTone(category: ModelCategory) {
  if (category === "Embedding") return { background: "#ecf9ef", color: "#128237" };
  if (category === "Image") return { background: "#fff4e9", color: "#c84413" };
  if (category === "Reranker") return { background: "#fff0f3", color: "#cc1748" };
  if (category.includes("Speech")) return { background: "#f3efff", color: "#6d3bd1" };
  return { background: "#edf2ff", color: "#4169f6" };
}

function capabilityTone(capability: ModelCapability) {
  if (capability === "vision") return { background: "#eef6ff", color: "#1769dd", border: "#cfe2ff" };
  if (capability === "tool") return { background: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
  return { background: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
}

function brandTone(developer: string) {
  const value = developer.toLowerCase();
  if (value.includes("deepseek")) return "linear-gradient(145deg,#079bd2,#18b7e8)";
  if (value.includes("千问") || value.includes("通义")) return "linear-gradient(145deg,#ff5537,#ff7135)";
  if (value.includes("meta")) return "linear-gradient(145deg,#bd123e,#dd174c)";
  return "linear-gradient(145deg,#4267ef,#5668ff)";
}

function ModelIcon({ model }: { model: ModelRecord }) {
  if (model.iconData) {
    return <img src={model.iconData} alt={`${model.name} 图标`} style={{ width: 44, height: 44, borderRadius: 9, objectFit: "cover", flex: "0 0 44px" }} />;
  }
  return (
    <div style={{ width: 44, height: 44, borderRadius: 9, flex: "0 0 44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 750, background: brandTone(model.developer) }}>
      {(model.developer || model.name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

function ModelCard({ model, onView, onEdit, onDelete, onDeploy }: {
  model: ModelRecord;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeploy: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const metaLabel: CSSProperties = { color: "#9aa5b5", whiteSpace: "nowrap" };
  const metaValue: CSSProperties = { color: "#374151", textAlign: "right", fontWeight: 650, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
  return (
    <article className="maas-model-card" style={{ minWidth: 0, minHeight: 288, padding: 16, display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #dfe5ee", borderRadius: 10, boxShadow: "0 3px 12px rgba(31,41,55,.03)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, marginBottom: 14 }}>
        <ModelIcon model={model} />
        <h3 title={model.name} style={{ minWidth: 0, flex: 1, margin: 0, color: "#20232a", fontSize: 17, fontWeight: 700, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{model.name}</h3>
        <div style={{ position: "relative" }}>
          <button type="button" title="更多操作" onClick={() => setMenuOpen(v => !v)} style={{ width: 28, height: 28, border: 0, borderRadius: 6, background: "transparent", color: "#9ba6b7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><MoreHorizontal size={18} /></button>
          {menuOpen && (
            <div style={{ position: "absolute", top: 32, right: 0, zIndex: 20, width: 88, padding: 4, border: "1px solid #e5e7eb", borderRadius: 7, background: "#fff", boxShadow: "0 8px 24px rgba(15,23,42,.12)" }}>
              <button type="button" onClick={() => { setMenuOpen(false); onDelete(); }} style={{ width: "100%", height: 30, border: 0, borderRadius: 5, background: "transparent", color: "#e5484d", fontSize: 12, cursor: "pointer" }}>删除</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "70px minmax(0,1fr)", rowGap: 8, alignItems: "center", fontSize: 13, lineHeight: 1.35 }}>
        <span style={metaLabel}>参数量</span><span style={metaValue}>{model.paramSize}B</span>
        <span style={metaLabel}>开发者</span><span title={model.developer} style={metaValue}>{model.developer}</span>
        <span style={metaLabel}>模型分类</span>
        <span style={{ display: "flex", justifyContent: "flex-end" }}><span className="notranslate" translate="no" style={{ ...categoryTone(model.category), display: "inline-flex", alignItems: "center", minHeight: 22, padding: "2px 7px", borderRadius: 5, fontSize: 12, fontWeight: 650, whiteSpace: "nowrap" }}>{model.category}</span></span>
        <span style={metaLabel}>能力</span>
        <span style={{ display: "flex", justifyContent: "flex-end", gap: 4, flexWrap: "wrap", minWidth: 0 }}>
          {model.capabilities.length ? model.capabilities.map(capability => {
            const tone = capabilityTone(capability);
            return <span key={capability} style={{ display: "inline-flex", alignItems: "center", minHeight: 20, padding: "1px 6px", border: `1px solid ${tone.border}`, borderRadius: 5, background: tone.background, color: tone.color, fontSize: 11.5, fontWeight: 650, whiteSpace: "nowrap" }}>{capability}</span>;
          }) : <span style={{ ...metaValue, color: "#b0b8c4" }}>—</span>}
        </span>
        <span style={metaLabel}>创建时间</span><span style={{ ...metaValue, color: "#687386", fontWeight: 500 }}>{model.createdAt}</span>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #edf0f5", display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" onClick={onView} style={{ border: 0, background: "transparent", color: "#4169f6", fontSize: 13, fontWeight: 650, cursor: "pointer", padding: "5px 0" }}>查看</button>
        <button type="button" onClick={onEdit} style={{ border: 0, background: "transparent", color: "#4169f6", fontSize: 13, fontWeight: 650, cursor: "pointer", padding: "5px 0" }}>编辑</button>
        <button type="button" onClick={onDeploy} style={{ ...buttonPrimary, marginLeft: "auto", minWidth: 64, height: 34, justifyContent: "center", padding: "0 13px" }}>部署</button>
      </div>
    </article>
  );
}

function ModelModal({ mode, model, models, onClose, onSave }: {
  mode: ModalMode;
  model?: ModelRecord;
  models: ModelRecord[];
  onClose: () => void;
  onSave: (model: ModelRecord) => void;
}) {
  const [form, setForm] = useState<ModelRecord>(model ? { ...EMPTY_FORM, ...model, capabilities: model.capabilities ?? [] } : { ...EMPTY_FORM });
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const readOnly = mode === "view";

  const set = <K extends keyof ModelRecord>(key: K, value: ModelRecord[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleCapability = (capability: ModelCapability) => {
    setForm(prev => {
      const next = prev.capabilities.includes(capability)
        ? prev.capabilities.filter(item => item !== capability)
        : [...prev.capabilities, capability];
      return { ...prev, capabilities: next };
    });
  };

  const handleIcon = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/svg+xml"];
    if (!allowed.includes(file.type)) { setError("仅支持 PNG、JPG、SVG 图片"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("图标文件不能超过 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { set("iconData", String(reader.result || "")); setError(""); };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!form.name.trim()) return setError("请输入模型名称");
    if (!form.developer.trim()) return setError("请输入开发者");
    if (!form.iconData) return setError("请上传模型图标");
    if (!form.paramSize.trim() || Number(form.paramSize) <= 0) return setError("请输入有效参数量");
    if (!form.weightPath.trim()) return setError("请输入模型权重地址");
    if (!form.imagePath.trim()) return setError("请选择或输入模型镜像地址");
    const duplicate = models.some(item => item.name.toLowerCase() === form.name.trim().toLowerCase() && item.id !== form.id);
    if (duplicate) return setError("模型名称已存在");
    const today = new Date().toISOString().slice(0, 10);
    onSave({ ...form, id: form.id || `model-${Date.now()}`, name: form.name.trim(), developer: form.developer.trim(), paramSize: form.paramSize.trim(), weightPath: form.weightPath.trim(), imagePath: form.imagePath.trim(), createdAt: form.createdAt || today });
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={mode === "add" ? "新建模型" : mode === "edit" ? "编辑模型" : "查看模型"} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(31,38,49,.48)" }}>
      <div style={{ width: "min(760px, calc(100vw - 32px))", maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 14, background: "#fff", boxShadow: "0 28px 80px rgba(15,23,42,.26)" }}>
        <div style={{ minHeight: 62, padding: "14px 22px", display: "flex", alignItems: "center", borderBottom: "1px solid #edf0f4" }}>
          <h2 style={{ margin: 0, color: "#20242d", fontSize: 18 }}>{mode === "add" ? "新建模型" : mode === "edit" ? "编辑模型" : "查看模型"}</h2>
          <button type="button" aria-label="关闭" onClick={onClose} style={{ width: 32, height: 32, marginLeft: "auto", border: 0, borderRadius: 7, background: "transparent", color: "#98a2b3", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>
          <div className="maas-model-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px" }}>
            <label><span style={labelStyle}><b style={{ color: "#e5484d" }}>*</b> 模型名称</span><input disabled={readOnly} value={form.name} onChange={e => set("name", e.target.value)} style={inputStyle} placeholder="请输入模型名称" /></label>
            <label><span style={labelStyle}><b style={{ color: "#e5484d" }}>*</b> 开发者</span><input disabled={readOnly} value={form.developer} onChange={e => set("developer", e.target.value)} style={inputStyle} placeholder="如 DeepSeek" /></label>

            <div>
              <span style={labelStyle}><b style={{ color: "#e5484d" }}>*</b> 图标</span>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleIcon} hidden />
              <div style={{ minHeight: 82, padding: 10, border: "1px dashed #cbd3df", borderRadius: 8, display: "flex", alignItems: "center", gap: 12, background: "#fafbfc" }}>
                {form.iconData ? <img src={form.iconData} alt="模型图标预览" style={{ width: 54, height: 54, borderRadius: 9, objectFit: "cover" }} /> : <div style={{ width: 54, height: 54, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f6", color: "#8c96a5" }}><ImageIcon size={25} /></div>}
                {!readOnly && <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5 }}>
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ height: 28, padding: "0 10px", border: "1px solid #d9deea", borderRadius: 6, background: "#fff", color: "#4f6ef7", fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Upload size={13} />{form.iconData ? "重新上传" : "上传图片"}</button>
                  {form.iconData && <button type="button" onClick={() => { set("iconData", ""); if (fileRef.current) fileRef.current.value = ""; }} style={{ border: 0, background: "transparent", color: "#e5484d", fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}><Trash2 size={12} />删除图片</button>}
                </div>}
              </div>
              <div style={{ marginTop: 4, color: "#98a2b3", fontSize: 11 }}>支持 PNG、JPG、SVG，最大 5 MB</div>
            </div>

            <label><span style={labelStyle}><b style={{ color: "#e5484d" }}>*</b> 参数量（B）</span><input disabled={readOnly} type="number" min="0" step="0.1" value={form.paramSize} onChange={e => set("paramSize", e.target.value)} style={inputStyle} placeholder="如 7" /></label>

            <label style={{ gridColumn: "1 / -1" }}><span style={labelStyle}><b style={{ color: "#e5484d" }}>*</b> 模型类型</span>
              <select disabled={readOnly} value={form.category} onChange={e => set("category", e.target.value as ModelCategory)} className="notranslate" translate="no" style={inputStyle}>
                {MODEL_CATEGORIES.map(category => <option key={category} className="notranslate" translate="no">{category}</option>)}
              </select>
            </label>

            <div style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>能力</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {MODEL_CAPABILITIES.map(capability => {
                  const checked = form.capabilities.includes(capability);
                  const tone = capabilityTone(capability);
                  return (
                    <label key={capability} style={{
                      minHeight: 32,
                      padding: "0 11px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      border: `1px solid ${checked ? tone.border : "#dfe3eb"}`,
                      borderRadius: 7,
                      background: checked ? tone.background : "#fff",
                      color: checked ? tone.color : "#374151",
                      fontSize: 13,
                      fontWeight: checked ? 650 : 500,
                      cursor: readOnly ? "default" : "pointer",
                    }}>
                      <input disabled={readOnly} type="checkbox" checked={checked} onChange={() => toggleCapability(capability)} style={{ accentColor: "#4f6ef7" }} />
                      {capability}
                    </label>
                  );
                })}
              </div>
            </div>

            <label><span style={labelStyle}><b style={{ color: "#e5484d" }}>*</b> 模型权重地址</span><input disabled={readOnly} value={form.weightPath} onChange={e => set("weightPath", e.target.value)} style={inputStyle} placeholder="如 /models/Qwen3-8B" /></label>
            <label><span style={labelStyle}><b style={{ color: "#e5484d" }}>*</b> 模型镜像地址</span><input disabled={readOnly} value={form.imagePath} onChange={e => set("imagePath", e.target.value)} style={inputStyle} list="maas-image-options" placeholder="搜索或输入 Harbor 镜像地址" /><datalist id="maas-image-options">{IMAGE_OPTIONS.map(option => <option key={option} value={option} />)}</datalist></label>
            <label style={{ gridColumn: "1 / -1" }}><span style={labelStyle}>简介</span><textarea disabled={readOnly} value={form.description} onChange={e => set("description", e.target.value)} maxLength={500} style={{ ...inputStyle, height: 70, paddingTop: 9, resize: "vertical" }} placeholder="模型简介，最长 500 字" /></label>
          </div>
          {error && <div role="alert" style={{ marginTop: 12, color: "#e5484d", fontSize: 12 }}>{error}</div>}
        </div>

        <div style={{ minHeight: 60, padding: "12px 22px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, borderTop: "1px solid #edf0f4" }}>
          <button type="button" onClick={onClose} style={{ height: 34, padding: "0 16px", border: "1px solid #dfe3eb", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 13, cursor: "pointer" }}>{readOnly ? "关闭" : "取消"}</button>
          {!readOnly && <button type="button" onClick={submit} style={buttonPrimary}>确认</button>}
        </div>
      </div>
    </div>
  );
}

export function ModelManagementPage({ models, onModelsChange, onDeploy }: ModelManagementPageProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [developer, setDeveloper] = useState("");
  const [modal, setModal] = useState<{ mode: ModalMode; model?: ModelRecord } | null>(null);

  const developers = useMemo(
    () => Array.from(new Set(models.map(model => model.developer).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-CN")),
    [models],
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return models.filter(model =>
      (!keyword || model.name.toLowerCase().includes(keyword)) &&
      (!category || model.category === category) &&
      (!developer || model.developer === developer)
    );
  }, [models, query, category, developer]);

  const save = (record: ModelRecord) => {
    const exists = models.some(model => model.id === record.id);
    onModelsChange(exists ? models.map(model => model.id === record.id ? record : model) : [record, ...models]);
    setModal(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: "#f5f7fa" }}>
      <div style={{ padding: "14px 24px 0", color: "#6b7280", fontSize: 13 }}><span style={{ color: "#4f6ef7" }}>模型管理</span><span style={{ margin: "0 7px" }}>/</span><b style={{ color: "#1a1d23", fontWeight: 500 }}>模型库</b></div>
      <div className="flex-1 min-h-0 overflow-auto" style={{ padding: "14px 24px 24px" }}>
        <div style={{ minHeight: 66, marginBottom: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", border: "1px solid #e3e8f1", borderRadius: 10, background: "#fff" }}>
          <div style={{ position: "relative", width: 260 }}>
            <Search size={16} color="#aab2bf" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索模型名称..." style={{ ...inputStyle, paddingLeft: 34, paddingRight: query ? 36 : 11 }} />
            {query && <button type="button" aria-label="清空搜索词" onClick={() => setQuery("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, padding: 0, border: 0, borderRadius: "50%", background: "#c5c9d0", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} /></button>}
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)} className="notranslate" translate="no" style={{ ...inputStyle, width: 150 }}><option value="">全部类型</option>{MODEL_CATEGORIES.map(item => <option key={item} className="notranslate" translate="no">{item}</option>)}</select>
          <select value={developer} onChange={e => setDeveloper(e.target.value)} aria-label="开发者筛选" style={{ ...inputStyle, width: 160 }}><option value="">全部开发者</option>{developers.map(item => <option key={item}>{item}</option>)}</select>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => setModal({ mode: "add" })} style={buttonPrimary}><Plus size={14} />新建模型</button>
        </div>

        {filtered.length ? (
          <div className="maas-model-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
            {filtered.map(model => <ModelCard key={model.id} model={model} onView={() => setModal({ mode: "view", model })} onEdit={() => setModal({ mode: "edit", model })} onDelete={() => onModelsChange(models.filter(item => item.id !== model.id))} onDeploy={() => onDeploy?.(model)} />)}
          </div>
        ) : <div style={{ padding: 70, textAlign: "center", color: "#98a2b3", border: "1px dashed #d8dee9", borderRadius: 10, background: "#fff" }}>暂无符合条件的模型</div>}
      </div>

      {modal && <ModelModal key={`${modal.mode}-${modal.model?.id || "new"}`} mode={modal.mode} model={modal.model} models={models} onClose={() => setModal(null)} onSave={save} />}

      <style>{`
        @media (max-width: 1180px) { .maas-model-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; } }
        @media (max-width: 720px) { .maas-model-grid { grid-template-columns: 1fr !important; } .maas-model-form-grid { grid-template-columns: 1fr !important; } .maas-model-form-grid > * { grid-column: auto !important; } }
        .maas-model-card { transition: transform .16s, box-shadow .16s, border-color .16s; }
        .maas-model-card:hover { transform: translateY(-2px); border-color: #cad4e4 !important; box-shadow: 0 8px 20px rgba(31,41,55,.07) !important; }
      `}</style>
    </div>
  );
}
