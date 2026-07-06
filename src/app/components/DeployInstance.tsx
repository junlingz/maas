import { useState, useEffect } from "react";
import { Search, RefreshCw, RotateCcw } from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────

type InstanceStatus = "pending" | "error" | "running";

interface ModelInstance {
  id: string;
  name: string;
  runtime: string;       // e.g. vLLM, SGLang:0.4.0, AceBound:1.0
  resourceGroup: string;
  node: string;
  memory: string;        // 分配显存
  status: InstanceStatus;
  created: string;
  selected: boolean;
}

const STATUS_LABEL: Record<InstanceStatus, string> = {
  pending: "待处理",
  error: "异常",
  running: "运行中",
};

const ALL_INSTANCES: ModelInstance[] = [
  { id: "mi-01", name: "qwen3.6-27b-X1xEx",          runtime: "vLLM",          resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-07-02 16:36:21", selected: true },
  { id: "mi-02", name: "qwen3.6-27b-ZDRSg",           runtime: "vLLM",          resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 16:39:02", selected: true },
  { id: "mi-03", name: "qwen3.6-27b-2ejux",           runtime: "vLLM",          resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 14:17:42", selected: true },
  { id: "mi-04", name: "demo-whisper-large-v3-r1",    runtime: "AceBound:1.0",  resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 14:10:36", selected: true },
  { id: "mi-05", name: "mimo-v2.5-jG5kP",             runtime: "vLLM",          resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 13:10:54", selected: true },
  { id: "mi-06", name: "mimo-v2.5-mYXMr",             runtime: "vLLM",          resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 13:10:54", selected: true },
  { id: "mi-07", name: "demo-deepseek-r1-70b-r2",     runtime: "SGLang:0.4.0",  resourceGroup: "测试1", node: "—", memory: "144 GiB", status: "error",   created: "2026-06-30 12:22:36", selected: true },
  { id: "mi-08", name: "mimo-v2.5-ZvuDW",             runtime: "vLLM",          resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 13:10:55", selected: true },
  { id: "mi-09", name: "glm-4-flash-prod-a1b2c",      runtime: "vLLM",          resourceGroup: "公共组", node: "—", memory: "80 GiB", status: "running", created: "2026-06-24 10:05:00", selected: true },
  { id: "mi-10", name: "qwen3.6-27b-Q8pLm",           runtime: "vLLM",          resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-23 18:42:17", selected: true },
];

const RG_OPTS = ["", "测试1", "公共组"];
const NODE_OPTS = ["", "node-01", "node-02", "node-03"];
const STATUS_OPTS: { value: string; label: string }[] = [
  { value: "",        label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "error",   label: "异常" },
  { value: "running", label: "运行中" },
];

// ─── Status badge (pill style matching prototype) ─────────────────────────────

function InstanceStatusBadge({ status }: { status: InstanceStatus }) {
  const cfg: Record<InstanceStatus, { color: string; border: string; background: string; isError?: boolean }> = {
    pending: { color: "#3475ee", border: "#b9d6ff", background: "#f6faff" },
    error:   { color: "#d55a28", border: "#ffc58e", background: "#fff9f0", isError: true },
    running: { color: "#18a94b", border: "#a9e8bd", background: "#f3fff6" },
  };
  const c = cfg[status];
  return (
    <span style={{ minWidth: 112, height: 36, padding: "0 14px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, border: `1px solid ${c.border}`, borderRadius: 18, background: c.background, color: c.color, fontWeight: 700, lineHeight: 1 }}>
      {c.isError ? (
        <span style={{ fontSize: 14, lineHeight: 1 }}>×</span>
      ) : (
        <span style={{ width: 9, height: 9, border: `2px solid ${status === "running" ? "#20b552" : c.color}`, borderRadius: "50%", background: status === "running" ? "#20b552" : "transparent", display: "inline-block" }} />
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Log content generator ────────────────────────────────────────────────────

function getInstanceLog(instance: ModelInstance): string {
  if (instance.status === "pending") return "Model instance not assigned to a worker";
  if (instance.status === "error") return [
    "[2026-06-30 12:22:36 INFO] Starting SGLang runtime 0.4.0",
    "[2026-06-30 12:22:37 INFO] Resolving model artifacts",
    "[2026-06-30 12:22:41 ERROR] Failed to allocate 144 GiB GPU memory",
    "[2026-06-30 12:22:41 ERROR] No eligible worker satisfies the resource request",
    "[2026-06-30 12:22:42 INFO] Model instance stopped",
  ].join("\n");
  return [
    "[2026-06-24 10:05:00 INFO] Starting vLLM engine",
    "[2026-06-24 10:05:03 INFO] Loading model weights from shared storage",
    "[2026-06-24 10:05:19 INFO] Allocated 80 GiB GPU memory",
    "[2026-06-24 10:05:21 INFO] Model loaded successfully",
    "[2026-06-24 10:05:21 INFO] Listening on 0.0.0.0:8000",
  ].join("\n");
}

// ─── PDF builder for log download ─────────────────────────────────────────────

function escapePdfText(value: string): string {
  return String(value).replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");
}

function buildLogPdf(instance: ModelInstance, logText: string): Uint8Array {
  const lines = [
    "Model Instance Logs",
    "Instance: " + instance.name,
    "Status: " + instance.status,
    "Generated: " + new Date().toISOString(),
    "",
  ].concat(String(logText).split("\n"));
  const content = "BT\n/F1 11 Tf\n50 790 Td\n14 TL\n" + lines.map(line => `(${escapePdfText(line)}) Tj\nT*`).join("\n") + "\nET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

function downloadInstanceLogsPdf(instance: ModelInstance) {
  const pdfBytes = buildLogPdf(instance, getInstanceLog(instance));
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = instance.name + "-logs.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

// ─── Log viewer modal (dark console) ──────────────────────────────────────────

function InstanceLogModal({ instance, onClose }: { instance: ModelInstance; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 220, padding: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(25,31,41,.46)" }}>
      <div style={{ width: "min(1320px, calc(100vw - 36px))", height: "min(820px, calc(100vh - 36px))", display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 18, background: "#fff", boxShadow: "0 30px 90px rgba(15,23,42,.28)" }}>
        <div style={{ height: 68, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flex: "0 0 auto" }}>
          <h3 style={{ color: "#20242c", fontSize: 20, fontWeight: 750, margin: 0 }}>查看日志</h3>
          <button onClick={onClose} aria-label="关闭日志" style={{ width: 38, height: 38, border: 0, borderRadius: 8, background: "transparent", color: "#2f3641", fontSize: 28, cursor: "pointer", lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f2f4f7")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>×</button>
        </div>
        <div style={{ minHeight: 0, flex: 1, padding: "0 24px 24px" }}>
          <pre style={{ width: "100%", height: "100%", margin: 0, overflow: "auto", padding: "14px 16px", borderRadius: 3, background: "#171717", color: "#d5d5d5", font: "14px/1.65 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{getInstanceLog(instance)}</pre>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function DeployInstancePage() {
  const [instances, setInstances] = useState<ModelInstance[]>(ALL_INSTANCES);
  const [search, setSearch] = useState("");
  const [rgFilter, setRgFilter] = useState("");
  const [nodeFilter, setNodeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [logInstance, setLogInstance] = useState<ModelInstance | null>(null);

  const filtered = instances.filter(inst => {
    if (search && inst.name.toLowerCase().indexOf(search.trim().toLowerCase()) === -1) return false;
    if (rgFilter && inst.resourceGroup !== rgFilter) return false;
    if (statusFilter && inst.status !== statusFilter) return false;
    if (nodeFilter && inst.node !== nodeFilter) return false;
    return true;
  });

  const selCount = instances.filter(i => i.selected).length;
  const allChecked = instances.length > 0 && selCount === instances.length;
  const indeterminate = selCount > 0 && selCount < instances.length;

  const toggleAll = (checked: boolean) => setInstances(prev => prev.map(i => ({ ...i, selected: checked })));
  const toggleOne = (id: string, checked: boolean) => setInstances(prev => prev.map(i => i.id === id ? { ...i, selected: checked } : i));

  const deleteSelected = () => {
    const sel = instances.filter(i => i.selected);
    if (!sel.length) return;
    if (!window.confirm(`确认删除选中的 ${sel.length} 个模型实例？`)) return;
    setInstances(prev => prev.filter(i => !i.selected));
  };

  const resetFilter = () => { setSearch(""); setRgFilter(""); setNodeFilter(""); setStatusFilter(""); };

  const onRefresh = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 550);
  };

  // Table cell styles (matching prototype's larger row height and font sizes)
  const th: React.CSSProperties = { height: 58, padding: "0 14px", color: "#687386", background: "#fafbfc", fontSize: 13, fontWeight: 650, textAlign: "left", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { height: 92, padding: 14, color: "#4c5668", verticalAlign: "middle", fontSize: 14, borderBottom: "1px solid #edf0f5" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>模型管理</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>模型实例</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e4e9f1", boxShadow: "0 8px 28px rgba(31,41,55,.045)", overflow: "hidden" }}>
        {/* Toolbar */}
        <div className="flex items-center flex-shrink-0 flex-wrap" style={{ padding: "18px 20px", gap: 12, borderBottom: "1px solid #edf0f5" }}>
          {/* Search */}
          <label className="flex items-center" aria-label="按名称搜索" style={{ width: 260, height: 48, padding: "0 15px", display: "flex", alignItems: "center", gap: 10, border: "1px solid #dce3ed", borderRadius: 8, color: "#9aa5b5", fontSize: 22, background: "#fff", flexShrink: 0 }}>
            <Search size={16} color="#9aa5b5" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="名称搜索" style={{ width: "100%", border: 0, outline: 0, color: "#313846", font: "inherit", fontSize: 14, background: "transparent" }} />
          </label>

          {/* Resource group filter */}
          <select value={rgFilter} onChange={e => setRgFilter(e.target.value)} aria-label="资源组筛选" style={{ height: 48, minWidth: 190, padding: "0 36px 0 14px", border: "1px solid #dce3ed", borderRadius: 8, color: "#384152", font: "inherit", fontSize: 14, background: "#fff", cursor: "pointer", appearance: "none", flexShrink: 0 }}>
            {RG_OPTS.map(o => <option key={o} value={o}>{o || "全部资源组"}</option>)}
          </select>

          {/* Node filter */}
          <select value={nodeFilter} onChange={e => setNodeFilter(e.target.value)} aria-label="节点筛选" style={{ height: 48, minWidth: 190, padding: "0 36px 0 14px", border: "1px solid #dce3ed", borderRadius: 8, color: "#384152", font: "inherit", fontSize: 14, background: "#fff", cursor: "pointer", appearance: "none", flexShrink: 0 }}>
            {NODE_OPTS.map(o => <option key={o} value={o}>{o || "全部节点"}</option>)}
          </select>

          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="状态筛选" style={{ height: 48, minWidth: 190, padding: "0 36px 0 14px", border: "1px solid #dce3ed", borderRadius: 8, color: "#384152", font: "inherit", fontSize: 14, background: "#fff", cursor: "pointer", appearance: "none", flexShrink: 0 }}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Reset */}
          <button onClick={resetFilter} style={{ height: 48, padding: "0 18px", display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid #d5ddea", borderRadius: 8, background: "#fff", color: "#344054", font: "600 15px/1.2 inherit", cursor: "pointer", flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = "#9eacf8"); (e.currentTarget.style.color = "#4169f6"); }} onMouseLeave={e => { (e.currentTarget.style.borderColor = "#d5ddea"); (e.currentTarget.style.color = "#344054"); }}>
            <RotateCcw size={17} /> <span>重置</span>
          </button>

          <div style={{ flex: 1 }} />

          {/* Refresh */}
          <button onClick={onRefresh} title="刷新" style={{ width: 48, height: 48, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #dce3ed", background: "#fff", color: "#6f7b8d", font: "inherit", cursor: "pointer", flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = "#4f67f4"); (e.currentTarget.style.color = "#4f67f4"); }} onMouseLeave={e => { (e.currentTarget.style.borderColor = "#dce3ed"); (e.currentTarget.style.color = "#6f7b8d"); }}>
            <RefreshCw size={20} style={refreshing ? { animation: "instance-spin .55s linear" } : undefined} />
          </button>

          {/* Batch delete */}
          <button onClick={deleteSelected} style={{ height: 48, minWidth: 132, padding: "0 18px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 8, border: "1px solid #ff9e9e", background: "#fff", color: "#ee3f43", font: "inherit", fontWeight: 650, fontSize: 15, cursor: "pointer", flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget.style.background = "#fff5f5"); (e.currentTarget.style.borderColor = "#f05252"); }} onMouseLeave={e => { (e.currentTarget.style.background = "#fff"); (e.currentTarget.style.borderColor = "#ff9e9e"); }}>
            ⌫&nbsp; 删除(<span>{selCount}</span>)
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto" style={{ width: "100%" }}>
          <table style={{ minWidth: 1120, width: "100%", tableLayout: "fixed", fontSize: 14 }}>
            <colgroup>
              <col style={{ width: 50 }} />
              <col style={{ width: 275 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 95 }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 150 }} />
              <col style={{ width: 190 }} />
              <col style={{ width: 220 }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...th, textAlign: "center" }}>
                  <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = indeterminate; }} onChange={e => toggleAll(e.target.checked)} aria-label="选择全部实例" style={{ width: 18, height: 18, margin: 0, accentColor: "#526df4", cursor: "pointer" }} />
                </th>
                <th style={th}>名称 ↕</th>
                <th style={th}>资源组 ↕</th>
                <th style={th}>节点 ↕</th>
                <th style={th}>分配显存 ↕</th>
                <th style={th}>状态</th>
                <th style={th}>创建时间 ↕</th>
                <th style={th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ height: 180, color: "#9aa5b5", textAlign: "center", fontSize: 14 }}>未找到符合条件的模型实例</td></tr>
              ) : filtered.map(inst => (
                <tr key={inst.id} style={{ background: "#fff" }} onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fbfcff"; }} onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fff"; }}>
                  {/* Checkbox */}
                  <td style={{ ...td, textAlign: "center" }}>
                    <input type="checkbox" checked={inst.selected} onChange={e => toggleOne(inst.id, e.target.checked)} aria-label={`选择 ${inst.name}`} style={{ width: 18, height: 18, margin: 0, accentColor: "#526df4", cursor: "pointer" }} />
                  </td>
                  {/* Name + runtime */}
                  <td style={td}>
                    <div style={{ color: "#202631", fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{inst.name}</div>
                    <div style={{ marginTop: 5, color: "#9aa5b5", font: "600 12px/1.3 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" }}># {inst.runtime}</div>
                  </td>
                  {/* Resource group */}
                  <td style={td}>{inst.resourceGroup}</td>
                  {/* Node */}
                  <td style={{ ...td, color: inst.node && inst.node !== "—" ? "#4c5668" : "#c4cad3" }}>{inst.node || "—"}</td>
                  {/* Memory */}
                  <td style={{ ...td, color: inst.memory !== "0" ? "#545e70" : "#c4cad3", font: "600 13px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" }}>{inst.memory}</td>
                  {/* Status */}
                  <td style={td}><InstanceStatusBadge status={inst.status} /></td>
                  {/* Created */}
                  <td style={td}>{inst.created}</td>
                  {/* Actions */}
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                      <button onClick={() => setLogInstance(inst)} style={{ height: 32, padding: "0 10px", border: "1px solid #dbe2ec", borderRadius: 6, background: "#fff", color: "#536bdf", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        onMouseEnter={e => { (e.currentTarget.style.borderColor = "#6d7ff0"); (e.currentTarget.style.background = "#f5f7ff"); }} onMouseLeave={e => { (e.currentTarget.style.borderColor = "#dbe2ec"); (e.currentTarget.style.background = "#fff"); }}>查看日志</button>
                      <button onClick={() => downloadInstanceLogsPdf(inst)} style={{ height: 32, padding: "0 10px", border: "1px solid #dbe2ec", borderRadius: 6, background: "#fff", color: "#536bdf", fontFamily: "inherit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        onMouseEnter={e => { (e.currentTarget.style.borderColor = "#6d7ff0"); (e.currentTarget.style.background = "#f5f7ff"); }} onMouseLeave={e => { (e.currentTarget.style.borderColor = "#dbe2ec"); (e.currentTarget.style.background = "#fff"); }}>下载日志</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end flex-shrink-0" style={{ minHeight: 72, padding: "12px 20px", gap: 10, borderTop: "1px solid #edf0f5", color: "#8c97a7", fontSize: 14 }}>
          <span>共 {filtered.length} 条</span>
          <select aria-label="每页条数" style={{ height: 40, minWidth: 100, padding: "0 28px 0 14px", border: "1px solid #dce3ed", borderRadius: 8, color: "#384152", font: "inherit", fontSize: 14, background: "#fff", cursor: "pointer", appearance: "none" }}>
            <option>10条/页</option>
          </select>
          <button type="button" disabled style={{ width: 40, height: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #dce3ed", background: "#fff", color: "#c8ced8", cursor: "not-allowed" }}>‹</button>
          <button type="button" style={{ width: 40, height: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #516bf3", background: "#516bf3", color: "#fff", cursor: "pointer" }}>1</button>
          <button type="button" disabled style={{ width: 40, height: 40, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #dce3ed", background: "#fff", color: "#c8ced8", cursor: "not-allowed" }}>›</button>
        </div>
      </div>

      {logInstance && (
        <InstanceLogModal instance={logInstance} onClose={() => setLogInstance(null)} />
      )}

      {/* Keyframes for refresh spin animation */}
      <style>{`@keyframes instance-spin { to { transform: rotate(360deg); } }`}</style>
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
