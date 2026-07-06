import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, RefreshCw, Trash2, RotateCcw, MoreVertical, X, ChevronUp, ChevronLeft, ChevronRight, Settings2, Plus, Upload, Check, Info } from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────

type WorkerStatus = "Pending" | "Running" | "Error" | "Stopped";

interface WorkerRow {
  id: number;
  name: string;
  backend: string;    // e.g. vLLM, SGLang:0.4.0, AceBound:1.0
  resourceGroup: string;  // 资源组 (was 集群)
  node: string;
  vram: string;       // 分配显存
  status: WorkerStatus;
  createdAt: string;
}

const STATUS_CFG: Record<WorkerStatus, { bg: string; color: string; border: string; icon: string }> = {
  "Pending": { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", icon: "○" },
  "Running": { bg: "#f0faf5", color: "#16a34a", border: "#bbf7d0", icon: "●" },
  "Error":   { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", icon: "⊗" },
  "Stopped": { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", icon: "◎" },
};

const ALL_WORKERS: WorkerRow[] = [
  { id: 1,  name: "qwen3.6-27b-X1xEx",          backend: "vLLM",          resourceGroup: "测试1", node: "", vram: "0",       status: "Pending", createdAt: "2026-07-02 16:36:21" },
  { id: 2,  name: "qwen3.6-27b-7DRSg",           backend: "vLLM",          resourceGroup: "测试1", node: "", vram: "0",       status: "Pending", createdAt: "2026-06-30 16:39:02" },
  { id: 3,  name: "qwen3.6-27b-2ejux",           backend: "vLLM",          resourceGroup: "测试1", node: "", vram: "0",       status: "Pending", createdAt: "2026-06-30 14:17:42" },
  { id: 4,  name: "demo-whisper-large-v3-r1",    backend: "AceBound:1.0",  resourceGroup: "测试1", node: "", vram: "0",       status: "Pending", createdAt: "2026-06-30 14:10:36" },
  { id: 5,  name: "mimo-v2.5-jG5kP",             backend: "vLLM",          resourceGroup: "测试1", node: "", vram: "0",       status: "Pending", createdAt: "2026-06-30 13:10:54" },
  { id: 6,  name: "mimo-v2.5-mYXMr",             backend: "vLLM",          resourceGroup: "测试1", node: "", vram: "0",       status: "Pending", createdAt: "2026-06-30 13:10:54" },
  { id: 7,  name: "demo-deepseek-r1-70b-r2",     backend: "SGLang:0.4.0",  resourceGroup: "测试1", node: "", vram: "144 GiB", status: "Error",   createdAt: "2026-06-30 12:22:36" },
  { id: 8,  name: "mimo-v2.5-ZvuDW",             backend: "vLLM",          resourceGroup: "测试1", node: "", vram: "0",       status: "Pending", createdAt: "2026-06-30 13:10:55" },
  { id: 9,  name: "glm-4-flash-prod-a1b2c",      backend: "vLLM",          resourceGroup: "公共组", node: "", vram: "80 GiB", status: "Running", createdAt: "2026-06-24 10:05:00" },
  { id: 10, name: "glm-4-flash-prod-d3e4f",      backend: "vLLM",          resourceGroup: "公共组", node: "", vram: "80 GiB", status: "Running", createdAt: "2026-06-24 10:05:00" },
];

const RG_OPTS   = ["全部资源组", "测试1", "公共组", "GPU-Cluster-Prod"];
const SORT_OPTS = ["默认排序", "按创建时间升序", "按创建时间降序", "按名称升序"];
const STATUS_OPTS = ["全部状态", "Pending", "Running", "Error", "Stopped"];

// ─── Row More Menu ────────────────────────────────────────────────────────────

function RowMoreMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 5px", color: "#9ca3af", borderRadius: 4, display: "flex", alignItems: "center", fontSize: 16, lineHeight: 1 }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}>⋮</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 100, overflow: "hidden" }}>
          <button onClick={() => setOpen(false)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#374151" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>查看详情</button>
          <button onClick={() => setOpen(false)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#374151" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>重启</button>
          <button onClick={() => { onDelete(); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>删除</button>
        </div>
      )}
    </div>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

function FilterDrop({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: string[] }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ height: 32, padding: "0 26px 0 10px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: "#374151", cursor: "pointer", fontFamily: "inherit", minWidth: 120 }}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={12} color="#9ca3af" style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

// ─── Sort Column Header ───────────────────────────────────────────────────────

function SortTh({ label, style: s }: { label: string; style?: React.CSSProperties }) {
  const [dir, setDir] = useState<"none" | "asc" | "desc">("none");
  return (
    <th onClick={() => setDir(d => d === "none" ? "asc" : d === "asc" ? "desc" : "none")}
      style={{ padding: "10px 14px", textAlign: "left", fontSize: 12.5, fontWeight: 500, color: "#6b7280", borderBottom: "1px solid #f0f2f7", background: "#f8f9fc", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", ...s }}>
      <span className="flex items-center gap-1">
        {label}
        <span style={{ fontSize: 10, color: "#c9cdd4", display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ color: dir === "asc" ? "#4f6ef7" : "#c9cdd4" }}>▲</span>
          <span style={{ color: dir === "desc" ? "#4f6ef7" : "#c9cdd4" }}>▼</span>
        </span>
      </span>
    </th>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function DeployInstancePage() {
  const [workers, setWorkers]   = useState<WorkerRow[]>(ALL_WORKERS);
  const [selected, setSelected] = useState<Set<number>>(new Set(ALL_WORKERS.map(w => w.id)));
  const [search, setSearch]     = useState("");
  const [rgFilter, setRgFilter] = useState("全部资源组");
  const [sortOpt, setSortOpt]   = useState("默认排序");
  const [statusFilter, setStatusFilter] = useState("全部状态");

  const filtered = workers.filter(w => {
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (rgFilter !== "全部资源组" && w.resourceGroup !== rgFilter) return false;
    if (statusFilter !== "全部状态" && w.status !== statusFilter) return false;
    return true;
  });

  const allChecked = filtered.length > 0 && filtered.every(w => selected.has(w.id));
  const toggleAll = () => {
    if (allChecked) setSelected(prev => { const next = new Set(prev); filtered.forEach(w => next.delete(w.id)); return next; });
    else setSelected(prev => { const next = new Set(prev); filtered.forEach(w => next.add(w.id)); return next; });
  };
  const toggleOne = (id: number) => setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const deleteRow = (id: number) => { setWorkers(p => p.filter(w => w.id !== id)); setSelected(p => { const n = new Set(p); n.delete(id); return n; }); };
  const deleteSel = () => { setWorkers(p => p.filter(w => !selected.has(w.id))); setSelected(new Set()); };
  const selCount  = filtered.filter(w => selected.has(w.id)).length;

  const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 12.5, fontWeight: 500, color: "#6b7280", borderBottom: "1px solid #f0f2f7", background: "#f8f9fc", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "12px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa", verticalAlign: "middle" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>模型管理</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>部署实例</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap" style={{ padding: "12px 16px", borderBottom: "1px solid #f0f2f7" }}>
          {/* Search */}
          <div className="flex items-center" style={{ border: "1px solid #e0e3ed", height: 32, padding: "0 10px", borderRadius: 6, background: "#fff", gap: 6 }}>
            <Search size={13} color="#9ca3af" />
            <input type="text" placeholder="名称搜索" value={search} onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 12.5, border: "none", outline: "none", width: 130, background: "transparent", color: "#1a1d23" }} />
          </div>

          <FilterDrop value={rgFilter}     onChange={setRgFilter}     opts={RG_OPTS} />
          <FilterDrop value={sortOpt}      onChange={setSortOpt}      opts={SORT_OPTS} />
          <FilterDrop value={statusFilter} onChange={setStatusFilter}  opts={STATUS_OPTS} />

          {/* Refresh */}
          <button onClick={() => { setSearch(""); setRgFilter("全部资源组"); setSortOpt("默认排序"); setStatusFilter("全部状态"); }}
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#6b7280" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
            <RefreshCw size={13} />
          </button>

          <div style={{ flex: 1 }} />

          {/* Batch delete */}
          <button onClick={deleteSel} disabled={selCount === 0}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: selCount > 0 ? "#dc2626" : "#9ca3af", background: "#fff", border: `1px solid ${selCount > 0 ? "#fca5a5" : "#e0e3ed"}`, borderRadius: 6, cursor: selCount > 0 ? "pointer" : "not-allowed" }}>
            <Trash2 size={13} />
            删除{selCount > 0 ? `(${selCount})` : ""}
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {/* Checkbox */}
                <th style={{ ...th, width: 40 }}>
                  <input type="checkbox" checked={allChecked} onChange={toggleAll}
                    style={{ accentColor: "#4f6ef7", cursor: "pointer", width: 14, height: 14 }} />
                </th>
                <SortTh label="名称" />
                <SortTh label="资源组" />
                <SortTh label="节点" />
                <SortTh label="分配显存" />
                <th style={th}>状态</th>
                <SortTh label="创建时间" />
                <th style={{ ...th, textAlign: "center" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td></tr>
              ) : filtered.map(row => {
                const sc = STATUS_CFG[row.status];
                const isSel = selected.has(row.id);
                return (
                  <tr key={row.id} style={{ background: isSel ? "#f8f9ff" : "transparent", transition: "background .1s" }}
                    onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLTableRowElement).style.background = "#fafbfd"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = isSel ? "#f8f9ff" : "transparent"; }}>
                    {/* Checkbox */}
                    <td style={{ ...td, width: 40 }}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleOne(row.id)}
                        style={{ accentColor: "#4f6ef7", cursor: "pointer", width: 14, height: 14 }} />
                    </td>
                    {/* 名称 */}
                    <td style={td}>
                      <div style={{ fontWeight: 500, color: "#1a1d23", fontSize: 13 }}>{row.name}</div>
                      <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>
                        <span style={{ fontFamily: "monospace" }}># {row.backend}</span>
                      </div>
                    </td>
                    {/* 资源组 */}
                    <td style={{ ...td, color: "#374151" }}>{row.resourceGroup}</td>
                    {/* 节点 */}
                    <td style={{ ...td, color: row.node ? "#374151" : "#d1d5db" }}>{row.node || "—"}</td>
                    {/* 分配显存 */}
                    <td style={{ ...td, color: row.vram !== "0" ? "#374151" : "#6b7280", fontFamily: "monospace", fontSize: 12.5 }}>
                      {row.vram !== "0" ? row.vram : "0"}
                    </td>
                    {/* 状态 */}
                    <td style={td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 500, padding: "3px 10px", borderRadius: 12, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                        {sc.icon} {row.status}
                      </span>
                    </td>
                    {/* 创建时间 */}
                    <td style={{ ...td, color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{row.createdAt}</td>
                    {/* 操作 */}
                    <td style={{ ...td, textAlign: "center" }}>
                      {row.status === "Error" ? (
                        <div className="flex items-center justify-center gap-1">
                          <button title="重试" style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 5px", color: "#6b7280", borderRadius: 4, display: "flex", alignItems: "center" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                            <RefreshCw size={14} />
                          </button>
                          <RowMoreMenu onDelete={() => deleteRow(row.id)} />
                        </div>
                      ) : (
                        <button onClick={() => deleteRow(row.id)} title="删除"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 5px", color: "#ef4444", borderRadius: 4, display: "flex", alignItems: "center", margin: "0 auto" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {filtered.length} 条</span>
          <div style={{ position: "relative" }}>
            <select style={{ height: 28, padding: "0 22px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", appearance: "none", color: "#374151", cursor: "pointer" }}>
              <option>10条/页</option><option>20条/页</option>
            </select>
            <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <button disabled style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", opacity: 0.4 }}><ChevronLeft size={13} /></button>
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #4f6ef7", borderRadius: 5, background: "#4f6ef7", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>1</div>
          <button disabled style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", opacity: 0.4 }}><ChevronRight size={13} /></button>
        </div>
      </div>
    </div>
  );
}

// Keep these exports for compatibility with other pages that import them
export function ScaleModal({ row, onClose }: { row: any; onClose: () => void }) { return null; }
export function ScaleRecordModal({ row, onClose }: { row: any; onClose: () => void }) { return null; }
export function QpmDetailModal({ row, onClose }: { row: any; onClose: () => void }) { return null; }
export function ViewDetailDrawer({ row, onClose }: { row: any; onClose: () => void }) { return null; }
export function AutoScalingModal({ onClose }: { onClose: () => void }) { return null; }
export function DeployModelModal({ onClose }: { onClose: () => void }) { return null; }
