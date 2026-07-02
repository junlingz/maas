import { useState, useRef, useEffect } from "react";
import { Search, RotateCcw, Plus, ChevronDown, ChevronLeft, ChevronRight, X, MoreHorizontal, FileText } from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────

interface Template {
  id: number;
  title: string;
  type: string;
  desc: string;
  version: string;
  updatedAt: string;
}

const TYPE_OPTS = ["文本理解", "图像理解", "代码生成", "问答", "翻译", "摘要"];

const TEMPLATES_INIT: Template[] = [
  { id: 1, title: "写作助手",       type: "文本理解", desc: "写作助手",       version: "V1", updatedAt: "2026-01-19 11:55:47" },
  { id: 2, title: "自动化运维助手", type: "文本理解", desc: "自动化运维助手", version: "V2", updatedAt: "2025-11-26 17:01:32" },
];

// ─── More Menu ─────────────────────────────────────────────────────────────────

function CardMoreMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", color: "#9ca3af", borderRadius: 4, display: "flex", alignItems: "center" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 100, overflow: "hidden" }}>
          {[{ label: "编辑", action: onEdit }, { label: "删除", action: onDelete, danger: true }].map(item => (
            <button key={item.label} onClick={e => { e.stopPropagation(); item.action(); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: (item as any).danger ? "#ef4444" : "#374151" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({ tpl, onClick, onDelete }: { tpl: Template; onClick: () => void; onDelete: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 12, padding: "18px 20px", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(79,110,247,0.1)"; (e.currentTarget as HTMLDivElement).style.borderColor = "#c7d2fe"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "#e8ebf2"; }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#eff4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileText size={18} color="#4f6ef7" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23" }}>{tpl.title}</div>
            <span style={{ fontSize: 12, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "#eff4ff", color: "#4f6ef7", display: "inline-block", marginTop: 3 }}>{tpl.type}</span>
          </div>
        </div>
        <CardMoreMenu onEdit={() => {}} onDelete={onDelete} />
      </div>

      {/* Description */}
      <div style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.6, marginBottom: 16, minHeight: 22 }}>
        {tpl.desc}
      </div>

      {/* Footer */}
      <div style={{ height: 1, background: "#f0f2f7", marginBottom: 12 }} />
      <div className="flex items-center justify-between" style={{ fontSize: 12.5, color: "#9ca3af" }}>
        <span>最新版本：<span style={{ color: "#374151", fontWeight: 500 }}>{tpl.version}</span></span>
        <span>更新于：{tpl.updatedAt}</span>
      </div>
    </div>
  );
}

// ─── Create/Edit Modal (right drawer) ─────────────────────────────────────────

function TemplateModal({ initial, onClose, onDone }: {
  initial?: Template | null;
  onClose: () => void;
  onDone: (t: Omit<Template, "id" | "version" | "updatedAt">) => void;
}) {
  const [title, setTitle]     = useState(initial?.title ?? "");
  const [type, setType]       = useState(initial?.type ?? "");
  const [desc, setDesc]       = useState(initial?.desc ?? "");
  const [typeOpen, setTypeOpen] = useState(false);
  const [errs, setErrs]       = useState<Record<string, boolean>>({});
  const typeRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!title.trim()) e.title = true;
    if (!type)         e.type  = true;
    if (!desc.trim())  e.desc  = true;
    if (Object.keys(e).length) { setErrs(e); return; }
    onDone({ title: title.trim(), type, desc: desc.trim() });
    onClose();
  };

  const inputSt = (err = false): React.CSSProperties => ({
    width: "100%", height: 44, padding: "0 12px", fontSize: 14,
    border: `1px solid ${err ? "#ef4444" : "#e0e3ed"}`, borderRadius: 8,
    outline: "none", color: "#1a1d23", background: "#fff", boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "20px 24px 18px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#1a1d23" }}>{initial ? "编辑模板" : "新增模板"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto" style={{ padding: "28px 24px" }}>
          {/* 模板标题 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1d23", marginBottom: 8 }}>
              <span style={{ color: "#ef4444", marginRight: 4 }}>*</span>模板标题
            </div>
            <div style={{ position: "relative" }}>
              <input
                value={title}
                onChange={e => { setTitle(e.target.value.slice(0, 50)); setErrs(p => ({ ...p, title: false })); }}
                placeholder="请输入模板标题"
                style={{ ...inputSt(errs.title), paddingRight: 64 }}
              />
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12.5, color: "#9ca3af" }}>
                {title.length} / 50
              </span>
            </div>
            {errs.title && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入模板标题</div>}
          </div>

          {/* 模板类型 */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1d23", marginBottom: 8 }}>
              <span style={{ color: "#ef4444", marginRight: 4 }}>*</span>模板类型
            </div>
            <div ref={typeRef} style={{ position: "relative" }}>
              <button
                onClick={() => setTypeOpen(o => !o)}
                className="flex items-center justify-between w-full"
                style={{
                  height: 44, padding: "0 12px", fontSize: 14,
                  border: `1px solid ${errs.type ? "#ef4444" : typeOpen ? "#4f6ef7" : "#e0e3ed"}`,
                  borderRadius: 8, background: "#fff", cursor: "pointer", color: type ? "#1a1d23" : "#9ca3af",
                  boxShadow: typeOpen ? "0 0 0 2px rgba(79,110,247,0.15)" : "none",
                  transition: "all 0.15s",
                }}>
                <span>{type || "请选择模板类型"}</span>
                <ChevronDown size={16} color="#9ca3af" style={{ transform: typeOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              </button>
              {typeOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", zIndex: 10, overflow: "hidden" }}>
                  {TYPE_OPTS.map(opt => (
                    <div key={opt} onClick={() => { setType(opt); setTypeOpen(false); setErrs(p => ({ ...p, type: false })); }}
                      style={{ padding: "12px 16px", fontSize: 14, cursor: "pointer", color: opt === type ? "#4f6ef7" : "#1a1d23", background: opt === type ? "#f0f4ff" : "#fff", fontWeight: opt === type ? 500 : 400 }}
                      onMouseEnter={e => { if (opt !== type) (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = opt === type ? "#f0f4ff" : "#fff"; }}>
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errs.type && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请选择模板类型</div>}
          </div>

          {/* 模板描述 */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1d23", marginBottom: 8 }}>
              <span style={{ color: "#ef4444", marginRight: 4 }}>*</span>模板描述
            </div>
            <textarea
              value={desc}
              onChange={e => { setDesc(e.target.value); setErrs(p => ({ ...p, desc: false })); }}
              placeholder="请输入模板描述"
              style={{
                width: "100%", height: 140, padding: "12px", fontSize: 14, lineHeight: 1.7,
                border: `1px solid ${errs.desc ? "#ef4444" : "#e0e3ed"}`, borderRadius: 8,
                outline: "none", resize: "vertical", fontFamily: "inherit", color: "#1a1d23",
                boxSizing: "border-box" as const, transition: "border-color 0.15s",
              }}
              onFocus={e => (e.target.style.borderColor = "#4f6ef7")}
              onBlur={e => (e.target.style.borderColor = errs.desc ? "#ef4444" : "#e0e3ed")}
            />
            {errs.desc && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入模板描述</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0" style={{ padding: "16px 24px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose}
            style={{ height: 40, padding: "0 24px", fontSize: 14, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={submit}
            style={{ height: 40, padding: "0 28px", fontSize: 14, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 8, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── Detail page (when clicking a card) ───────────────────────────────────────

function TemplateDetail({ tpl, onBack }: { tpl: Template; onBack: () => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }} onClick={onBack}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }} onClick={onBack}>模型体验</span><span>/</span>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }} onClick={onBack}>Prompt模板</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>{tpl.title}</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ padding: "16px 24px 24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 12, padding: "24px" }}>
          <div className="flex items-center gap-3 mb-4">
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={22} color="#4f6ef7" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1d23" }}>{tpl.title}</div>
              <span style={{ fontSize: 12.5, fontWeight: 500, padding: "2px 10px", borderRadius: 5, background: "#eff4ff", color: "#4f6ef7", display: "inline-block", marginTop: 4 }}>{tpl.type}</span>
            </div>
          </div>
          <div style={{ height: 1, background: "#f0f2f7", marginBottom: 20 }} />
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>模板描述</div>
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 20 }}>{tpl.desc}</div>
          <div className="flex items-center gap-8" style={{ fontSize: 13, color: "#9ca3af" }}>
            <span>最新版本：<span style={{ color: "#374151", fontWeight: 500 }}>{tpl.version}</span></span>
            <span>更新于：{tpl.updatedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PromptTemplatePage({ onOpenTuning }: { onOpenTuning?: (title: string, version: string) => void }) {
  const [templates, setTemplates]   = useState<Template[]>(TEMPLATES_INIT);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [query, setQuery]           = useState("");
  const [page, setPage]             = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = templates.filter(t => {
    if (typeFilter && t.type !== typeFilter) return false;
    if (query && !t.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const handleCreate = (data: Omit<Template, "id" | "version" | "updatedAt">) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setTemplates(prev => [...prev, { ...data, id: Date.now(), version: "V1", updatedAt: ts }]);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>模型体验</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>Prompt模板</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0" style={{ padding: "14px 24px 24px" }}>
        {/* Filter bar */}
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap" style={{ marginBottom: 20 }}>
          {/* 搜索模板 */}
          <div style={{ background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, height: 36, padding: "0 12px", display: "flex", alignItems: "center", minWidth: 160 }}>
            <input type="text" placeholder="搜索模板" value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && setQuery(search)}
              style={{ fontSize: 13, border: "none", outline: "none", background: "transparent", width: "100%", color: "#1a1d23" }} />
          </div>

          {/* 搜索类型 */}
          <div style={{ position: "relative" }}>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
              style={{ height: 36, padding: "0 32px 0 12px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 8, background: "#fff", appearance: "none", color: typeFilter ? "#1a1d23" : "#9ca3af", outline: "none", minWidth: 140, cursor: "pointer" }}>
              <option value="">搜索类型</option>
              {TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>

          <button onClick={() => { setQuery(search); setPage(1); }}
            style={{ height: 36, padding: "0 16px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
            <Search size={14} /> 搜索
          </button>

          <button onClick={() => { setSearch(""); setTypeFilter(""); setQuery(""); setPage(1); }}
            style={{ height: 36, padding: "0 16px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
            <RotateCcw size={13} /> 重置
          </button>

          <div style={{ flex: 1 }} />

          <button onClick={() => setShowCreate(true)}
            style={{ height: 36, padding: "0 16px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Plus size={14} /> 添加模板
          </button>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full rounded-xl" style={{ background: "#fff", border: "1px solid #e8ebf2", padding: "64px 0", color: "#9ca3af" }}>
              <FileText size={36} color="#d1d5db" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>暂无模板</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>点击「添加模板」创建第一个 Prompt 模板</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, alignContent: "start" }}>
              {filtered.map(tpl => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  onClick={() => onOpenTuning?.(tpl.title, tpl.version)}
                  onDelete={() => setTemplates(prev => prev.filter(t => t.id !== tpl.id))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ paddingTop: 16 }}>
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {filtered.length} 条</span>
            <div style={{ position: "relative" }}>
              <select style={{ height: 30, padding: "0 26px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: "#374151" }}>
                <option>10条/页</option>
              </select>
              <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <button disabled style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", opacity: 0.4 }}><ChevronLeft size={13} /></button>
            <div style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #4f6ef7", borderRadius: 6, background: "#4f6ef7", color: "#fff", fontSize: 13, fontWeight: 600 }}>1</div>
            <button disabled style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", opacity: 0.4 }}><ChevronRight size={13} /></button>
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>前往</span>
              <input type="number" defaultValue={1} style={{ width: 40, height: 30, textAlign: "center", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none" }} />
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>页</span>
            </div>
          </div>
        )}
      </div>

      {showCreate && <TemplateModal onClose={() => setShowCreate(false)} onDone={handleCreate} />}
    </div>
  );
}
