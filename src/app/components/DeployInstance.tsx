import { useMemo, useState, type CSSProperties } from "react";
import { RefreshCw, X } from "lucide-react";
import type { InstanceStatus, ModelInstanceRecord } from "../model-management/types";

interface DeployInstancePageProps {
  instances: ModelInstanceRecord[];
  onInstancesChange: (instances: ModelInstanceRecord[]) => void;
}

const controlStyle: CSSProperties = {
  height: 40,
  minWidth: 190,
  padding: "0 32px 0 14px",
  border: "1px solid #d6deea",
  borderRadius: 10,
  outline: "none",
  background: "#fff",
  color: "#3a4353",
  fontSize: 14,
  fontWeight: 600,
};

function normalizeStatus(status: InstanceStatus) {
  if (status === "Running") return "running";
  if (status === "Error") return "error";
  return "pending";
}

function statusLabel(status: InstanceStatus) {
  if (status === "Running") return "运行中";
  if (status === "Error") return "异常";
  return "待处理";
}

function statusTone(status: InstanceStatus) {
  if (status === "Running") return { color: "#18a94b", border: "#a9e8bd", background: "#f3fff6", dot: "#20b552" };
  if (status === "Error") return { color: "#d55a28", border: "#ffc58e", background: "#fff9f0", dot: "#d55a28" };
  return { color: "#3475ee", border: "#b9d6ff", background: "#f6faff", dot: "#3475ee" };
}

function instanceLog(instance: ModelInstanceRecord) {
  if (instance.status === "Pending") return "Model instance not assigned to a worker";
  if (instance.status === "Error") return [
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

function escapePdfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");
}

function buildLogPdf(instance: ModelInstanceRecord, logText: string) {
  const lines = [
    "Model Instance Logs",
    `Instance: ${instance.name}`,
    `Status: ${normalizeStatus(instance.status)}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    ...logText.split("\n"),
  ];
  const content = `BT\n/F1 11 Tf\n50 790 Td\n14 TL\n${lines.map(line => `(${escapePdfText(line)}) Tj\nT*`).join("\n")}\nET`;
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
  for (let i = 1; i < offsets.length; i += 1) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function DeployInstancePage({ instances, onInstancesChange }: DeployInstancePageProps) {
  const [search, setSearch] = useState("");
  const [resourceGroup, setResourceGroup] = useState("");
  const [node, setNode] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(instances.map(item => item.id)));
  const [logTarget, setLogTarget] = useState<ModelInstanceRecord | null>(null);

  const rows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return instances.filter(instance =>
      (!keyword || instance.name.toLowerCase().includes(keyword)) &&
      (!resourceGroup || instance.resourceGroup === resourceGroup) &&
      (!node || instance.node === node) &&
      (!status || normalizeStatus(instance.status) === status)
    );
  }, [instances, search, resourceGroup, node, status]);

  const selectedVisible = rows.filter(item => selected.has(item.id));
  const allSelected = rows.length > 0 && selectedVisible.length === rows.length;

  const resetFilter = () => { setSearch(""); setResourceGroup(""); setNode(""); setStatus(""); };
  const deleteSelected = () => {
    if (!selected.size) return;
    onInstancesChange(instances.filter(instance => !selected.has(instance.id)));
    setSelected(new Set());
  };

  const toggleAll = (checked: boolean) => {
    setSelected(previous => {
      const next = new Set(previous);
      rows.forEach(instance => checked ? next.add(instance.id) : next.delete(instance.id));
      return next;
    });
  };

  const downloadLogPdf = (instance: ModelInstanceRecord) => {
    const pdfBytes = buildLogPdf(instance, instanceLog(instance));
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${instance.name}-logs.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: "#f5f7fa" }}>
      <div style={{ padding: "14px 24px 0", color: "#6b7280", fontSize: 13 }}><span style={{ color: "#4f6ef7" }}>模型管理</span><span style={{ margin: "0 7px" }}>/</span><b style={{ color: "#1a1d23", fontWeight: 500 }}>模型实例</b></div>
      <section className="flex-1 min-h-0 overflow-auto" style={{ margin: "14px 24px 24px", overflow: "hidden", border: "1px solid #e6ebf3", borderRadius: 16, background: "#fff", boxShadow: "0 2px 12px rgba(31,45,61,.05)" }}>
        <div style={{ minHeight: 76, padding: "18px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #edf0f5" }}>
          <label aria-label="按名称搜索" style={{ width: 240, height: 44, padding: "0 14px", display: "flex", alignItems: "center", gap: 10, border: "1px solid #d6deea", borderRadius: 10, background: "#fff", color: "#7b8798" }}>
            <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>⌕</span>
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="名称搜索" style={{ width: "100%", border: 0, outline: 0, color: "#313846", fontSize: 14, background: "transparent" }} />
          </label>
          <select value={resourceGroup} onChange={event => setResourceGroup(event.target.value)} aria-label="资源组筛选" style={controlStyle}>
            <option value="">全部资源组</option>
            <option value="测试1">测试1</option>
            <option value="公共组">公共组</option>
          </select>
          <select value={node} onChange={event => setNode(event.target.value)} aria-label="节点筛选" style={controlStyle}>
            <option value="">全部节点</option>
            <option value="node-01">node-01</option>
            <option value="node-02">node-02</option>
            <option value="node-03">node-03</option>
          </select>
          <select value={status} onChange={event => setStatus(event.target.value)} aria-label="状态筛选" style={controlStyle}>
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="error">异常</option>
            <option value="running">运行中</option>
          </select>
          <button type="button" onClick={resetFilter} style={{ height: 40, padding: "0 16px", border: "1px solid #d6deea", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", color: "#667085", fontSize: 14, fontWeight: 650, cursor: "pointer" }}><RefreshCw size={17} /><span>重置</span></button>
          <button type="button" onClick={deleteSelected} style={{ minWidth: 132, height: 40, marginLeft: "auto", padding: "0 18px", border: "1px solid #ff9e9e", borderRadius: 10, background: "#fff", color: "#ee3f43", fontSize: 14, fontWeight: 650, cursor: "pointer" }}>⌫&nbsp; 删除(<span>{selected.size}</span>)</button>
        </div>

        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 1120, tableLayout: "fixed", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#fafbfc" }}>
                <th style={{ ...th, width: 50, textAlign: "center" }}><input type="checkbox" checked={allSelected} onChange={event => toggleAll(event.target.checked)} aria-label="选择全部实例" style={checkboxStyle} /></th>
                <th style={{ ...th, width: 275 }}>名称 ↕</th>
                <th style={{ ...th, width: 120 }}>资源组 ↕</th>
                <th style={{ ...th, width: 95 }}>节点 ↕</th>
                <th style={{ ...th, width: 130 }}>分配显存 ↕</th>
                <th style={{ ...th, width: 150 }}>状态</th>
                <th style={{ ...th, width: 190 }}>创建时间 ↕</th>
                <th style={{ ...th, width: 220 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map(instance => {
                const tone = statusTone(instance.status);
                return (
                  <tr key={instance.id}>
                    <td style={{ ...td, textAlign: "center" }}><input type="checkbox" checked={selected.has(instance.id)} onChange={event => setSelected(previous => { const next = new Set(previous); event.target.checked ? next.add(instance.id) : next.delete(instance.id); return next; })} aria-label={`选择 ${instance.name}`} style={checkboxStyle} /></td>
                    <td style={td}><div style={{ color: "#202631", fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{instance.name}</div><div style={{ marginTop: 5, color: "#9aa5b5", font: "600 12px/1.3 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" }}># {instance.runtime}</div></td>
                    <td style={td}>{instance.resourceGroup}</td>
                    <td style={{ ...td, color: "#c4cad3" }}>{instance.node}</td>
                    <td style={{ ...td, color: "#545e70", font: "600 13px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" }}>{instance.memory}</td>
                    <td style={td}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 30, padding: "0 12px", border: `1px solid ${tone.border}`, borderRadius: 16, background: tone.background, color: tone.color, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {instance.status === "Error" ? <span style={{ fontSize: 14, lineHeight: 1 }}>×</span> : <span style={{ width: 9, height: 9, border: `2px solid ${tone.dot}`, borderRadius: "50%", background: instance.status === "Running" ? tone.dot : "transparent" }} />}
                        {statusLabel(instance.status)}
                      </span>
                    </td>
                    <td style={td}>{instance.createdAt}</td>
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                        <button type="button" onClick={() => setLogTarget(instance)} style={instanceActionStyle}>查看日志</button>
                        <button type="button" onClick={() => downloadLogPdf(instance)} style={instanceActionStyle}>下载日志</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan={8} style={{ height: 180, color: "#9aa5b5", textAlign: "center" }}>未找到符合条件的模型实例</td></tr>}
            </tbody>
          </table>
        </div>

        <div style={{ minHeight: 68, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, color: "#667085", fontSize: 14, borderTop: "1px solid #edf0f5" }}>
          <span>共 {rows.length} 条</span>
          <select aria-label="每页条数" style={{ ...controlStyle, minWidth: 100, height: 40 }}><option>10条/页</option></select>
          <button type="button" disabled style={pageBtnDisabled}>‹</button>
          <button type="button" style={pageBtnActive}>1</button>
          <button type="button" disabled style={pageBtnDisabled}>›</button>
        </div>
      </section>

      {logTarget && (
        <div role="dialog" aria-modal="true" aria-label="查看日志" onClick={event => { if (event.currentTarget === event.target) setLogTarget(null); }} style={{ position: "fixed", inset: 0, zIndex: 220, padding: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(25,31,41,.46)" }}>
          <div style={{ width: "min(860px, calc(100vw - 36px))", height: "min(620px, calc(100vh - 36px))", overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 18, background: "#fff", boxShadow: "0 28px 80px rgba(15,23,42,.28)" }}>
            <div style={{ height: 68, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flex: "0 0 auto" }}>
              <h3 style={{ margin: 0, color: "#20242c", fontSize: 20, fontWeight: 750 }}>查看日志</h3>
              <button type="button" onClick={() => setLogTarget(null)} aria-label="关闭日志" style={{ width: 38, height: 38, border: 0, borderRadius: 8, background: "transparent", color: "#2f3641", cursor: "pointer" }}><X size={22} /></button>
            </div>
            <div style={{ minHeight: 0, flex: 1, padding: "0 24px 24px" }}>
              <pre style={{ width: "100%", height: "100%", margin: 0, padding: 18, overflow: "auto", borderRadius: 12, background: "#111827", color: "#d7e0ee", font: "12.5px/1.7 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace", whiteSpace: "pre-wrap" }}>{instanceLog(logTarget)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const th: CSSProperties = { height: 58, padding: "0 14px", color: "#687386", background: "#fafbfc", fontSize: 13, fontWeight: 650, textAlign: "left", borderBottom: "1px solid #e8ecf2", whiteSpace: "nowrap" };
const td: CSSProperties = { height: 92, padding: 14, color: "#4c5668", verticalAlign: "middle", borderBottom: "1px solid #edf0f4" };
const checkboxStyle: CSSProperties = { width: 18, height: 18, margin: 0, accentColor: "#526df4", cursor: "pointer" };
const instanceActionStyle: CSSProperties = { height: 32, padding: "0 12px", border: "1px solid #dce2ee", borderRadius: 8, background: "#fff", color: "#526df4", fontSize: 13, fontWeight: 650, cursor: "pointer" };
const pageBtnDisabled: CSSProperties = { width: 40, height: 40, border: "1px solid #d6deea", borderRadius: 10, background: "#fff", color: "#c8ced8", cursor: "not-allowed" };
const pageBtnActive: CSSProperties = { width: 40, height: 40, border: "1px solid #516bf3", borderRadius: 10, background: "#516bf3", color: "#fff", cursor: "pointer" };
