import { useState, useEffect, useMemo, useRef } from "react";
import { Search, ChevronDown, RotateCcw, Trash2, X } from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────

type InstanceStatus = "pending" | "error" | "running";

interface ModelInstance {
  id: string;
  name: string;
  runtime: string;          // e.g. "vLLM", "SGLang:0.4.0", "AceBound:1.0"
  resourceGroup: string;    // 资源组
  node: string;             // "—" when empty
  memory: string;           // allocated VRAM, e.g. "0", "144 GiB", "80 GiB"
  status: InstanceStatus;
  created: string;          // created timestamp
  selected: boolean;
}

const ALL_INSTANCES: ModelInstance[] = [
  { id: "mi-01", name: "qwen3.6-27b-X1xEx",          runtime: "vLLM",         resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-07-02 16:36:21", selected: true },
  { id: "mi-02", name: "qwen3.6-27b-ZDRSg",           runtime: "vLLM",         resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 16:39:02", selected: true },
  { id: "mi-03", name: "qwen3.6-27b-2ejux",           runtime: "vLLM",         resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 14:17:42", selected: true },
  { id: "mi-04", name: "demo-whisper-large-v3-r1",    runtime: "AceBound:1.0", resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 14:10:36", selected: true },
  { id: "mi-05", name: "mimo-v2.5-jG5kP",             runtime: "vLLM",         resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 13:10:54", selected: true },
  { id: "mi-06", name: "mimo-v2.5-mYXMr",             runtime: "vLLM",         resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 13:10:54", selected: true },
  { id: "mi-07", name: "demo-deepseek-r1-70b-r2",     runtime: "SGLang:0.4.0", resourceGroup: "测试1", node: "—", memory: "144 GiB", status: "error",   created: "2026-06-30 12:22:36", selected: true },
  { id: "mi-08", name: "mimo-v2.5-ZvuDW",             runtime: "vLLM",         resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-30 13:10:55", selected: true },
  { id: "mi-09", name: "glm-4-flash-prod-a1b2c",      runtime: "vLLM",         resourceGroup: "公共组", node: "—", memory: "80 GiB", status: "running", created: "2026-06-24 10:05:00", selected: true },
  { id: "mi-10", name: "qwen3.6-27b-Q8pLm",           runtime: "vLLM",         resourceGroup: "测试1", node: "—", memory: "0",       status: "pending", created: "2026-06-23 18:42:17", selected: true },
];

const RESOURCE_GROUP_OPTS = [
  { value: "", label: "全部资源组" },
  { value: "测试1", label: "测试1" },
  { value: "公共组", label: "公共组" },
];

const NODE_OPTS = [
  { value: "", label: "全部节点" },
  { value: "node-01", label: "node-01" },
  { value: "node-02", label: "node-02" },
  { value: "node-03", label: "node-03" },
];

const STATUS_OPTS: { value: string; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "error", label: "异常" },
  { value: "running", label: "运行中" },
];

const STATUS_BADGE_CFG: Record<InstanceStatus, { label: string; color: string; border: string; background: string; filledDot?: string }> = {
  pending: { label: "待处理", color: "#3475ee", border: "#b9d6ff", background: "#f6faff" },
  error:   { label: "异常",   color: "#d55a28", border: "#ffc58e", background: "#fff9f0" },
  running: { label: "运行中", color: "#18a94b", border: "#a9e8bd", background: "#f3fff6", filledDot: "#20b552" },
};

// ─── Log helper ───────────────────────────────────────────────────────────────

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

// ─── PDF generation ───────────────────────────────────────────────────────────

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

  const content = "BT\n/F1 11 Tf\n50 790 Td\n14 TL\n" +
    lines.map(line => "(" + escapePdfText(line) + ") Tj\nT*").join("\n") +
    "\nET";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += (index + 1) + " 0 obj\n" + object + "\nendobj\n";
  });

  const xrefOffset = pdf.length;
  pdf += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i++) {
    pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  pdf += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF";
  return new TextEncoder().encode(pdf);
}

function downloadInstanceLogsPdf(instance: ModelInstance) {
  const pdfBytes = buildLogPdf(instance, getInstanceLog(instance));
  const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = instance.name + "-logs.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: InstanceStatus }) {
  const cfg = STATUS_BADGE_CFG[status];
  const dotStyle: React.CSSProperties = {
    width: 9,
    height: 9,
    borderRadius: "50%",
    border: `2px solid ${cfg.color}`,
    boxSizing: "border-box",
    flexShrink: 0,
  };
  // error uses a × glyph instead of a dot
  let indicator: React.ReactNode;
  if (status === "error") {
    indicator = <span style={{ fontSize: 14, lineHeight: 1, color: cfg.color, fontWeight: 700, width: 9, textAlign: "center" }}>×</span>;
  } else if (status === "running" && cfg.filledDot) {
    indicator = <span style={{ ...dotStyle, background: cfg.filledDot, borderColor: cfg.filledDot }} />;
  } else {
    indicator = <span style={dotStyle} />;
  }
  return (
    <span style={{
      minWidth: 112,
      height: 36,
      padding: "0 14px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      border: `1px solid ${cfg.border}`,
      borderRadius: 18,
      background: cfg.background,
      color: cfg.color,
      fontWeight: 700,
      lineHeight: 1,
      fontSize: 13,
    }}>
      {indicator}
      {cfg.label}
    </span>
  );
}

// ─── Toolbar select ───────────────────────────────────────────────────────────

function ToolbarSelect({
  value, onChange, options, minWidth,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  minWidth: number;
}) {
  return (
    <div style={{ position: "relative", minWidth }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          height: 48,
          width: "100%",
          padding: "0 36px 0 14px",
          border: "1px solid #dce3ed",
          borderRadius: 8,
          color: "#384152",
          fontSize: 14,
          background: "#fff",
          cursor: "pointer",
          fontFamily: "inherit",
          appearance: "none",
          outline: "none",
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={16} color="#9aa5b5" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

// ─── Log modal ────────────────────────────────────────────────────────────────

function InstanceLogModal({ instance, onClose }: { instance: ModelInstance; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="instance-log-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 220,
        padding: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(25, 31, 41, 0.46)",
      }}
    >
      <div style={{
        width: "min(1320px, calc(100vw - 36px))",
        height: "min(820px, calc(100vh - 36px))",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 18,
        background: "#fff",
        boxShadow: "0 30px 90px rgba(15, 23, 42, 0.28)",
      }}>
        <div style={{
          height: 68,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flex: "0 0 auto",
        }}>
          <h3 id="instance-log-title" style={{ margin: 0, color: "#20242c", fontSize: 20, fontWeight: 750 }}>查看日志</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭日志"
            style={{
              width: 38, height: 38, border: 0, borderRadius: 8, background: "transparent",
              color: "#2f3641", fontSize: 28, cursor: "pointer", lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f2f4f7")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <X size={22} />
          </button>
        </div>
        <div style={{ minHeight: 0, flex: 1, padding: "0 24px 24px" }}>
          <pre style={{
            width: "100%",
            height: "100%",
            margin: 0,
            overflow: "auto",
            padding: "14px 16px",
            borderRadius: 3,
            background: "#171717",
            color: "#d5d5d5",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 14,
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {getInstanceLog(instance)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DeployInstancePage() {
  const [instances, setInstances] = useState<ModelInstance[]>(() => ALL_INSTANCES.map(i => ({ ...i })));
  const [search, setSearch] = useState("");
  const [rgFilter, setRgFilter] = useState("");
  const [nodeFilter, setNodeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [logInstance, setLogInstance] = useState<ModelInstance | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return instances.filter(i => {
      if (q && !i.name.toLowerCase().includes(q)) return false;
      if (rgFilter && i.resourceGroup !== rgFilter) return false;
      if (nodeFilter && i.node !== nodeFilter) return false;
      if (statusFilter && i.status !== statusFilter) return false;
      return true;
    });
  }, [instances, search, rgFilter, nodeFilter, statusFilter]);

  const selectedCount = instances.filter(i => i.selected).length;
  const allChecked = instances.length > 0 && selectedCount === instances.length;
  const indeterminate = selectedCount > 0 && selectedCount < instances.length;

  // Reflect indeterminate state on the header checkbox
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const toggleAll = (checked: boolean) => {
    setInstances(prev => prev.map(i => ({ ...i, selected: checked })));
  };
  const toggleOne = (id: string, checked: boolean) => {
    setInstances(prev => prev.map(i => i.id === id ? { ...i, selected: checked } : i));
  };

  const deleteSelected = () => {
    const count = instances.filter(i => i.selected).length;
    if (count === 0) return;
    if (!window.confirm(`确认删除选中的 ${count} 个模型实例？`)) return;
    setInstances(prev => prev.filter(i => !i.selected));
  };

  const resetFilter = () => {
    setSearch("");
    setRgFilter("");
    setNodeFilter("");
    setStatusFilter("");
  };

  // ── Shared styles ───────────────────────────────────────────────────────────
  const thBase: React.CSSProperties = {
    height: 58,
    padding: "0 14px",
    color: "#687386",
    background: "#fafbfc",
    fontSize: 13,
    fontWeight: 650,
    textAlign: "left",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #edf0f5",
  };
  const tdBase: React.CSSProperties = {
    height: 92,
    padding: 14,
    color: "#4c5668",
    fontSize: 14,
    verticalAlign: "middle",
    borderBottom: "1px solid #edf0f5",
  };
  const checkboxStyle: React.CSSProperties = {
    width: 18, height: 18, margin: 0, accentColor: "#526df4", cursor: "pointer",
  };
  const actionBtnStyle: React.CSSProperties = {
    height: 32,
    padding: "0 10px",
    border: "1px solid #dbe2ec",
    borderRadius: 6,
    background: "#fff",
    color: "#536bdf",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#f5f6fa" }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "#9aa5b5", padding: "14px 28px 4px" }}>
        <span style={{ color: "#9aa5b5" }}>首页 / 模型管理 / </span>
        <span style={{ color: "#202631", fontWeight: 600 }}>模型实例</span>
      </div>

      <section style={{
        overflow: "hidden",
        margin: "14px 28px 24px",
        background: "#fff",
        border: "1px solid #e4e9f1",
        borderRadius: 14,
        boxShadow: "0 8px 28px rgba(31, 41, 55, 0.045)",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
      }}>
        {/* Toolbar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "18px 20px",
          borderBottom: "1px solid #edf0f5",
          background: "#fff",
          flexWrap: "wrap",
        }}>
          {/* Search */}
          <label style={{
            width: 260, height: 48, padding: "0 15px",
            display: "flex", alignItems: "center", gap: 10,
            border: "1px solid #dce3ed", borderRadius: 8,
            color: "#9aa5b5", background: "#fff",
            boxSizing: "border-box",
          }}>
            <Search size={18} color="#9aa5b5" />
            <input
              type="text"
              placeholder="名称搜索"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", border: 0, outline: 0,
                color: "#313846", fontSize: 14, background: "transparent",
                fontFamily: "inherit",
              }}
            />
          </label>

          <ToolbarSelect value={rgFilter} onChange={setRgFilter} options={RESOURCE_GROUP_OPTS} minWidth={190} />
          <ToolbarSelect value={nodeFilter} onChange={setNodeFilter} options={NODE_OPTS} minWidth={190} />
          <ToolbarSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTS} minWidth={190} />

          {/* Reset */}
          <button
            type="button"
            onClick={resetFilter}
            style={{
              height: 48, padding: "0 18px",
              display: "inline-flex", alignItems: "center", gap: 7,
              border: "1px solid #d5ddea", borderRadius: 8,
              background: "#fff", color: "#344054",
              fontFamily: "inherit", fontSize: 15, fontWeight: 600,
              cursor: "pointer", transition: "border-color .15s, color .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#9eacf8"; e.currentTarget.style.color = "#4169f6"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#d5ddea"; e.currentTarget.style.color = "#344054"; }}
          >
            <RotateCcw size={17} />
            <span>重置</span>
          </button>

          <div style={{ flex: 1 }} />

          {/* Batch delete */}
          <button
            type="button"
            onClick={deleteSelected}
            style={{
              height: 48, minWidth: 132, padding: "0 18px",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
              border: "1px solid #ff9e9e", borderRadius: 8,
              background: "#fff", color: "#ee3f43",
              fontFamily: "inherit", fontSize: 15, fontWeight: 650,
              cursor: "pointer", transition: "background .15s, border-color .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fff5f5"; e.currentTarget.style.borderColor = "#f05252"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#ff9e9e"; }}
          >
            <Trash2 size={16} />
            <span>删除({selectedCount})</span>
          </button>
        </div>

        {/* Table */}
        <div style={{ width: "100%", overflowX: "auto", flex: 1, minHeight: 0 }}>
          <table style={{
            width: "100%",
            minWidth: 1120,
            tableLayout: "fixed",
            borderCollapse: "collapse",
            fontSize: 14,
          }}>
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
                <th style={{ ...thBase, width: 50, textAlign: "center" }}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allChecked}
                    onChange={e => toggleAll(e.target.checked)}
                    aria-label="选择全部实例"
                    style={checkboxStyle}
                  />
                </th>
                <th style={thBase}>名称 ↕</th>
                <th style={thBase}>资源组 ↕</th>
                <th style={thBase}>节点 ↕</th>
                <th style={thBase}>分配显存 ↕</th>
                <th style={thBase}>状态</th>
                <th style={thBase}>创建时间 ↕</th>
                <th style={thBase}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tdBase, height: 180, color: "#9aa5b5", textAlign: "center" }}>
                    未找到符合条件的模型实例
                  </td>
                </tr>
              ) : filtered.map(instance => (
                <tr
                  key={instance.id}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = "#fbfcff"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                >
                  {/* Checkbox */}
                  <td style={{ ...tdBase, width: 50, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={instance.selected}
                      onChange={e => toggleOne(instance.id, e.target.checked)}
                      aria-label={`选择 ${instance.name}`}
                      style={checkboxStyle}
                    />
                  </td>
                  {/* 名称 */}
                  <td style={tdBase}>
                    <div style={{ color: "#202631", fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
                      {instance.name}
                    </div>
                    <div style={{
                      marginTop: 5,
                      color: "#9aa5b5",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                      fontSize: 12,
                      fontWeight: 600,
                      lineHeight: 1.3,
                    }}>
                      # {instance.runtime}
                    </div>
                  </td>
                  {/* 资源组 */}
                  <td style={tdBase}>{instance.resourceGroup}</td>
                  {/* 节点 */}
                  <td style={{ ...tdBase, color: "#c4cad3" }}>{instance.node}</td>
                  {/* 分配显存 */}
                  <td style={{
                    ...tdBase,
                    color: "#545e70",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    {instance.memory}
                  </td>
                  {/* 状态 */}
                  <td style={tdBase}>
                    <StatusBadge status={instance.status} />
                  </td>
                  {/* 创建时间 */}
                  <td style={tdBase}>{instance.created}</td>
                  {/* 操作 */}
                  <td style={tdBase}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => setLogInstance(instance)}
                        style={actionBtnStyle}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#6d7ff0"; e.currentTarget.style.background = "#f5f7ff"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#dbe2ec"; e.currentTarget.style.background = "#fff"; }}
                      >
                        查看日志
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadInstanceLogsPdf(instance)}
                        style={actionBtnStyle}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#6d7ff0"; e.currentTarget.style.background = "#f5f7ff"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#dbe2ec"; e.currentTarget.style.background = "#fff"; }}
                      >
                        下载日志
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          minHeight: 72,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 10,
          borderTop: "1px solid #edf0f5",
          color: "#8c97a7",
          fontSize: 14,
        }}>
          <span>共 {filtered.length} 条</span>
          <div style={{ position: "relative", minWidth: 100 }}>
            <select
              aria-label="每页条数"
              style={{
                height: 40, width: "100%", padding: "0 28px 0 14px",
                border: "1px solid #dce3ed", borderRadius: 8,
                color: "#384152", fontSize: 14, background: "#fff",
                fontFamily: "inherit", cursor: "pointer",
                appearance: "none", outline: "none",
              }}
            >
              <option>10条/页</option>
            </select>
            <ChevronDown size={14} color="#9aa5b5" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <button
            type="button"
            disabled
            style={{
              width: 40, height: 40,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #dce3ed", borderRadius: 8,
              background: "#fff", color: "#c8ced8",
              cursor: "not-allowed", fontFamily: "inherit", fontSize: 16,
            }}
          >
            ‹
          </button>
          <button
            type="button"
            style={{
              width: 40, height: 40,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #516bf3", borderRadius: 8,
              background: "#516bf3", color: "#fff",
              fontFamily: "inherit", fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            1
          </button>
          <button
            type="button"
            disabled
            style={{
              width: 40, height: 40,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #dce3ed", borderRadius: 8,
              background: "#fff", color: "#c8ced8",
              cursor: "not-allowed", fontFamily: "inherit", fontSize: 16,
            }}
          >
            ›
          </button>
        </div>
      </section>

      {logInstance && (
        <InstanceLogModal instance={logInstance} onClose={() => setLogInstance(null)} />
      )}
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
