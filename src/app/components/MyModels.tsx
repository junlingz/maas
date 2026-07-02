import { useState, useRef, useEffect } from "react"; // eslint-disable-line
import { Search, MoreVertical, Cpu, ChevronRight } from "lucide-react";

interface MyModel {
  id: number;
  name: string;
  desc: string;
  baseModel: string;
  modelType: string;
  capability: string;
  trainedAt: string;
  status: "已部署" | "未部署" | "部署中";
  space: string;
}

const MODELS: MyModel[] = [
  {
    id: 1,
    name: "客服智能应答助手-Pro",
    desc: "基于企业内部客服知识库微调，专注于产品售后咨询、退换货流程指引及技术支持场景，响应准确率提升 40% 以上，支持多轮对话与意图识别。",
    baseModel: "Qwen3-32B",
    modelType: "通用大模型",
    capability: "文生文",
    trainedAt: "2026.10.26 18:02:36",
    status: "已部署",
    space: "admin空间",
  },
  {
    id: 2,
    name: "医疗病历结构化模型-v2",
    desc: "针对医院电子病历系统深度微调，支持非结构化病历文本的自动解析、ICD 编码推荐及临床术语标准化处理，有效减少人工录入工作量。",
    baseModel: "GLM-4-Flash",
    modelType: "通用大模型",
    capability: "文生文",
    trainedAt: "2026.10.29 18:02:36",
    status: "未部署",
    space: "admin空间",
  },
];

const STATUS_CFG = {
  "已部署": { bg: "#f0faf5", text: "#16a34a", border: "#bbf7d0" },
  "未部署": { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb" },
  "部署中": { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
};

function CardMenu({ onDelete, onView }: { onDelete: () => void; onView: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#9ca3af", display: "flex", alignItems: "center", borderRadius: 4 }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
        <MoreVertical size={15} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 100, overflow: "hidden" }}>
          <button onClick={() => { onView(); setOpen(false); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#374151" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>查看详情</button>
          <button onClick={() => { onDelete(); setOpen(false); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>删除</button>
        </div>
      )}
    </div>
  );
}

function ModelCard({ model, onDelete }: { model: MyModel; onDelete: () => void }) {
  const sc = STATUS_CFG[model.status];

  return (
    <div style={{
      background: "#fff", borderRadius: 12, border: "1px solid #e0e6ff",
      padding: "18px 20px", display: "flex", flexDirection: "column",
      boxShadow: "0 2px 8px rgba(79,110,247,0.06)", transition: "box-shadow 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 20px rgba(79,110,247,0.12)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(79,110,247,0.06)"}>

      {/* Header: icon + name only */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 32, height: 32, background: "linear-gradient(135deg,#4f6ef7,#7c5cf6)" }}>
          <Cpu size={15} color="#fff" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1d23", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {model.name}
        </span>
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12.5, color: "#6b7280", lineHeight: 1.7, marginBottom: 14,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {model.desc}
      </div>

      {/* Meta fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14, flex: 1 }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, color: "#9ca3af", width: 56, flexShrink: 0 }}>基座模型：</span>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "#374151", fontFamily: "monospace" }}>{model.baseModel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, color: "#9ca3af", width: 56, flexShrink: 0 }}>模型类型：</span>
          <div className="flex items-center gap-1.5">
            {[model.modelType, model.capability].map(t => (
              <span key={t} style={{ fontSize: 11.5, fontWeight: 500, padding: "1px 8px", borderRadius: 4, background: "#eff4ff", color: "#4f6ef7" }}>{t}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, color: "#9ca3af", width: 56, flexShrink: 0 }}>所属空间：</span>
          <span style={{ fontSize: 12.5, color: "#374151" }}>{model.space}</span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, color: "#9ca3af", width: 56, flexShrink: 0 }}>部署状态：</span>
          <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
            {model.status}
          </span>
          {model.status === "未部署" && (
            <button
              style={{ fontSize: 12, fontWeight: 500, color: "#4f6ef7", background: "#eff4ff", border: "1px solid #c7d9ff", borderRadius: 5, padding: "2px 10px", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#e0e8ff")}
              onMouseLeave={e => (e.currentTarget.style.background = "#eff4ff")}>
              部署
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ height: 1, background: "#f0f2f7", marginBottom: 12 }} />
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 11.5, color: "#9ca3af" }}>{model.trainedAt}</span>
        <div className="flex items-center gap-3">
          <button
            style={{ fontSize: 12.5, fontWeight: 500, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 2 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>
            查看 <ChevronRight size={12} />
          </button>
          <CardMenu onView={() => {}} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

export function MyModelsPage() {
  const [models, setModels]     = useState<MyModel[]>(MODELS);
  const [search, setSearch]     = useState("");
  const [query, setQuery]       = useState("");

  const filtered = models.filter(m =>
    !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.baseModel.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>模型训练</span>
        <ChevronRight size={13} />
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>我的模型</span>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: "16px 24px 32px" }}>
        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1d23", marginBottom: 16, letterSpacing: -0.3 }}>
          我的模型
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center rounded-lg" style={{ background: "#fff", border: "1px solid #e0e3ed", height: 36, padding: "0 12px", width: 260 }}>
            <Search size={14} color="#9ca3af" style={{ marginRight: 8, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="请输入模型名称"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setQuery(search)}
              style={{ fontSize: 13, border: "none", outline: "none", background: "transparent", width: "100%", color: "#1a1d23" }}
            />
          </div>
          <button onClick={() => setQuery(search)}
            style={{ height: 36, padding: "0 20px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Search size={13} /> 查询
          </button>
        </div>

        {/* Card grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl" style={{ background: "#fff", border: "1px solid #e8ebf2", padding: "64px 0", color: "#9ca3af" }}>
            <Cpu size={36} color="#d1d5db" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>暂无训练模型</div>
            <div style={{ fontSize: 12.5, marginTop: 4 }}>完成模型训练后，模型将自动出现在此处</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {filtered.map(m => (
              <ModelCard key={m.id} model={m} onDelete={() => setModels(prev => prev.filter(x => x.id !== m.id))} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
