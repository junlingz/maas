import { useState } from "react";
import { Search, RotateCcw, Download, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface AuditRow {
  id: number;
  eventId: string;
  eventType: "查询" | "创建" | "编辑" | "删除";
  eventName: string;
  workspace: string;
  workspaceId: string;
  userAccount: string;
  userId: string;
  resource: string;
  resourceId: string;
  resourceName: string;
  resourceParams: Record<string, unknown> | null;
  eventTime: string;
}

const MODEL_CARD_PARAMS = {
  isOpenSource: [], label: [], modelType: [],
  pageNum: 1, pageSize: 12, primaryType: [],
  searchInput: "", secondaryTypes: [],
};

const ALL_EVENTS: AuditRow[] = [
  { id: 1,  eventId: "40347", eventType: "查询", eventName: "ModelCard:Page",           workspace: "", workspaceId: "196", userAccount: "qiang.lin@aminer.cn", userId: "10112", resource: JSON.stringify(MODEL_CARD_PARAMS), resourceId: "40347", resourceName: "ModelCard:Page",           resourceParams: MODEL_CARD_PARAMS, eventTime: "2026-06-24 19:53:40" },
  { id: 2,  eventId: "40341", eventType: "查询", eventName: "ModelCard:Page",           workspace: "", workspaceId: "196", userAccount: "qiang.lin@aminer.cn", userId: "10112", resource: JSON.stringify(MODEL_CARD_PARAMS), resourceId: "40341", resourceName: "ModelCard:Page",           resourceParams: MODEL_CARD_PARAMS, eventTime: "2026-06-24 15:38:19" },
  { id: 3,  eventId: "40340", eventType: "查询", eventName: "TrainingData:Page",        workspace: "", workspaceId: "196", userAccount: "qiang.lin@aminer.cn", userId: "10112", resource: "",                                resourceId: "40340", resourceName: "TrainingData:Page",        resourceParams: null,              eventTime: "2026-06-24 15:37:21" },
  { id: 4,  eventId: "40339", eventType: "查询", eventName: "ModelCard:Page",           workspace: "", workspaceId: "196", userAccount: "qiang.lin@aminer.cn", userId: "10112", resource: JSON.stringify(MODEL_CARD_PARAMS), resourceId: "40339", resourceName: "ModelCard:Page",           resourceParams: MODEL_CARD_PARAMS, eventTime: "2026-06-24 15:37:15" },
  { id: 5,  eventId: "40310", eventType: "查询", eventName: "ModelCard:Page",           workspace: "", workspaceId: "196", userAccount: "qiang.lin@aminer.cn", userId: "10112", resource: "0",                               resourceId: "40310", resourceName: "ModelCard:Page",           resourceParams: null,              eventTime: "2026-06-24 14:25:11" },
  { id: 6,  eventId: "40280", eventType: "查询", eventName: "ModelCard:CardMenuDetail", workspace: "", workspaceId: "196", userAccount: "qiang.lin@aminer.cn", userId: "10112", resource: "0",                               resourceId: "40280", resourceName: "ModelCard:CardMenuDetail", resourceParams: null,              eventTime: "2026-06-24 12:41:30" },
  { id: 7,  eventId: "40271", eventType: "查询", eventName: "ModelCard:CardMenuDetail", workspace: "", workspaceId: "196", userAccount: "qiang.lin@aminer.cn", userId: "10112", resource: "0",                               resourceId: "40271", resourceName: "ModelCard:CardMenuDetail", resourceParams: null,              eventTime: "2026-06-24 11:19:05" },
  { id: 8,  eventId: "40309", eventType: "查询", eventName: "ModelCard:Page",           workspace: "", workspaceId: "196", userAccount: "qiang.lin@aminer.cn", userId: "10112", resource: JSON.stringify(MODEL_CARD_PARAMS), resourceId: "40309", resourceName: "ModelCard:Page",           resourceParams: MODEL_CARD_PARAMS, eventTime: "2026-06-24 14:25:00" },
  { id: 9,  eventId: "40308", eventType: "查询", eventName: "ModelCard:Page",           workspace: "", workspaceId: "196", userAccount: "qiang.lin@aminer.cn", userId: "10112", resource: JSON.stringify(MODEL_CARD_PARAMS), resourceId: "40308", resourceName: "ModelCard:Page",           resourceParams: MODEL_CARD_PARAMS, eventTime: "2026-06-24 14:24:50" },
  { id: 10, eventId: "40290", eventType: "查询", eventName: "ModelCard:Page",           workspace: "", workspaceId: "196", userAccount: "qiang.lin@aminer.cn", userId: "10112", resource: JSON.stringify(MODEL_CARD_PARAMS), resourceId: "40290", resourceName: "ModelCard:Page",           resourceParams: MODEL_CARD_PARAMS, eventTime: "2026-06-24 14:12:51" },
  { id: 11, eventId: "40260", eventType: "创建", eventName: "ModelTrain:Create",        workspace: "admin空间", workspaceId: "100", userAccount: "admin@maas.cn",          userId: "1",     resource: "model-train-task-001",    resourceId: "40260", resourceName: "ModelTrain:Create",        resourceParams: { taskName: "天文资料搜索", baseModel: "Qwen3-32B", trainType: "微调" }, eventTime: "2026-06-23 10:05:00" },
  { id: 12, eventId: "40245", eventType: "删除", eventName: "DeployInstance:Delete",    workspace: "admin空间", workspaceId: "100", userAccount: "admin@maas.cn",          userId: "1",     resource: "chatglm4-32b-inst-001",   resourceId: "40245", resourceName: "DeployInstance:Delete",    resourceParams: { instanceId: "chatglm4-32b-20260507155613025" }, eventTime: "2026-06-22 16:30:22" },
  { id: 13, eventId: "40230", eventType: "编辑", eventName: "ResourcePool:Update",      workspace: "admin空间", workspaceId: "100", userAccount: "admin@maas.cn",          userId: "1",     resource: "公共资源池",               resourceId: "40230", resourceName: "ResourcePool:Update",      resourceParams: { poolName: "公共资源池", schedule: "自动调度" }, eventTime: "2026-06-21 09:18:44" },
];

const EVENT_TYPE_OPTS = ["查询", "创建", "编辑", "删除"];
const PAGE_SIZE = 10;
const TOTAL = 137;

const TYPE_CFG: Record<string, { bg: string; text: string }> = {
  "查询": { bg: "#f0faf5", text: "#16a34a" },
  "创建": { bg: "#eff4ff", text: "#4f6ef7" },
  "编辑": { bg: "#fffbeb", text: "#d97706" },
  "删除": { bg: "#fef2f2", text: "#dc2626" },
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ event, onClose }: { event: AuditRow; onClose: () => void }) {
  const Field = ({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) => (
    <div className="flex items-start" style={{ marginBottom: 14 }}>
      <div style={{ width: 80, fontSize: 13, color: "#9ca3af", flexShrink: 0, paddingTop: 1 }}>{label}：</div>
      <div style={{ flex: 1, fontSize: 13, color: "#1a1d23", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>{value}</div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 520, maxHeight: "85vh", background: "#fff", borderRadius: 14, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>审计事件详情</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto" style={{ padding: "20px 24px" }}>
          {/* 事件信息 */}
          <Field label="事件id"   value={event.eventId} mono />
          <Field label="事件类型" value={
            <span style={{ fontSize: 12.5, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: TYPE_CFG[event.eventType]?.bg, color: TYPE_CFG[event.eventType]?.text }}>
              {event.eventType}
            </span>
          } />
          <Field label="事件名称" value={event.eventName} mono />
          <Field label="事件时间" value={event.eventTime} />

          <div style={{ height: 1, background: "#f5f7fa", margin: "8px 0 14px" }} />

          {/* 工作空间信息 */}
          <Field label="工作空间"   value={event.workspace || "—"} />
          <Field label="workspace id" value={event.workspaceId} mono />
          <Field label="用户账号"   value={event.userAccount} />
          <Field label="用户id"     value={event.userId} mono />

          <div style={{ height: 1, background: "#f5f7fa", margin: "8px 0 14px" }} />

          {/* 资源信息 */}
          <Field label="资源id"   value={event.resourceId} mono />
          <Field label="资源名称" value={event.resourceName} mono />
          <div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>资源参数：</div>
            {event.resourceParams ? (
              <div style={{ background: "#f8f9fc", border: "1px solid #e8ebf2", borderRadius: 8, padding: "14px 16px" }}>
                <pre style={{ margin: 0, fontSize: 12.5, color: "#374151", fontFamily: "monospace", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(event.resourceParams, null, 2)}
                </pre>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: "#9ca3af" }}>—</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function AuditEventsPage() {
  const [typeFilter, setTypeFilter]       = useState("");
  const [nameInput, setNameInput]         = useState("");
  const [accountInput, setAccountInput]   = useState("");
  const [nameQuery, setNameQuery]         = useState("");
  const [accountQuery, setAccountQuery]   = useState("");
  const [page, setPage]                   = useState(1);
  const [goPage, setGoPage]               = useState("");
  const [detailEvent, setDetailEvent]     = useState<AuditRow | null>(null);

  const filtered = ALL_EVENTS.filter(e => {
    if (typeFilter    && e.eventType !== typeFilter) return false;
    if (nameQuery     && !e.eventName.toLowerCase().includes(nameQuery.toLowerCase())) return false;
    if (accountQuery  && !e.userAccount.toLowerCase().includes(accountQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(TOTAL / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNums   = [1, 2, 3, 4, 5];

  const doSearch = () => { setNameQuery(nameInput); setAccountQuery(accountInput); setPage(1); };
  const doReset  = () => { setTypeFilter(""); setNameInput(""); setAccountInput(""); setNameQuery(""); setAccountQuery(""); setPage(1); };

  const thSt: React.CSSProperties = { padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", background: "#f8f9fc" };
  const tdSt: React.CSSProperties = { padding: "12px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>统计监控</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>操作审计事件</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 事件类型 */}
            <div style={{ position: "relative" }}>
              <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                style={{ height: 34, padding: "0 28px 0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: typeFilter ? "#1a1d23" : "#9ca3af", width: 120 }}>
                <option value="">事件类型</option>
                {EVENT_TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>

            {/* 事件名称 */}
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 10px" }}>
              <input type="text" placeholder="事件名称" value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ fontSize: 13, border: "none", outline: "none", width: 130, background: "transparent" }} />
            </div>

            {/* 用户账号 */}
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 10px" }}>
              <input type="text" placeholder="用户账号" value={accountInput}
                onChange={e => setAccountInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ fontSize: 13, border: "none", outline: "none", width: 160, background: "transparent" }} />
            </div>

            <button onClick={doSearch} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <Search size={13} /> 搜索
            </button>
            <button onClick={doReset} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <RotateCcw size={13} /> 重置
            </button>
          </div>

          <button style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Download size={13} /> 导出报告
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["事件类型", "事件名称", "工作空间", "用户账号", "资源", "事件时间", "操作"].map(c => (
                  <th key={c} style={thSt}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>暂无数据</td></tr>
              ) : pageRows.map(row => {
                const tc = TYPE_CFG[row.eventType] ?? { bg: "#f3f4f6", text: "#6b7280" };
                const resourceStr = row.resource && row.resource !== "0"
                  ? (row.resource.startsWith("{") ? row.resource.slice(0, 60) + "..." : row.resource)
                  : row.resource;
                return (
                  <tr key={row.id}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={tdSt}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: tc.bg, color: tc.text }}>{row.eventType}</span>
                    </td>
                    <td style={{ ...tdSt, fontFamily: "monospace", fontSize: 12.5, color: "#374151" }}>{row.eventName}</td>
                    <td style={{ ...tdSt, color: "#6b7280" }}>{row.workspace || "—"}</td>
                    <td style={{ ...tdSt, color: "#374151", fontSize: 12.5 }}>{row.userAccount}</td>
                    <td style={{ ...tdSt, maxWidth: 200 }}>
                      <span style={{ fontSize: 12, color: "#6b7280", fontFamily: "monospace", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {resourceStr || "—"}
                      </span>
                    </td>
                    <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{row.eventTime}</td>
                    <td style={tdSt}>
                      <button onClick={() => setDetailEvent(row)}
                        style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>查看</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 12.5, color: "#9ca3af", marginRight: 4 }}>共 {TOTAL} 条</span>
            <div style={{ position: "relative" }}>
              <select style={{ height: 28, padding: "0 22px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", appearance: "none", color: "#374151" }}>
                <option>10条/页</option>
                <option>20条/页</option>
              </select>
              <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={13} />
            </button>
            {pageNums.map(n => (
              <button key={n} onClick={() => setPage(n)}
                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: page === n ? "#4f6ef7" : "#e0e3ed", borderRadius: 5, background: page === n ? "#4f6ef7" : "#fff", color: page === n ? "#fff" : "#374151", fontSize: 12.5, fontWeight: page === n ? 600 : 400, cursor: "pointer" }}>
                {n}
              </button>
            ))}
            <span style={{ fontSize: 13, color: "#9ca3af", padding: "0 2px" }}>…</span>
            <button onClick={() => setPage(14)}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: page === 14 ? "#4f6ef7" : "#e0e3ed", borderRadius: 5, background: page === 14 ? "#4f6ef7" : "#fff", color: page === 14 ? "#fff" : "#374151", fontSize: 12.5, cursor: "pointer" }}>
              14
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
              <ChevronRight size={13} />
            </button>
            <div className="flex items-center gap-1.5" style={{ marginLeft: 4 }}>
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>前往</span>
              <input type="number" value={goPage} onChange={e => setGoPage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && goPage) { setPage(Math.min(totalPages, Math.max(1, Number(goPage)))); setGoPage(""); } }}
                style={{ width: 40, height: 28, textAlign: "center", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }} />
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>页</span>
            </div>
          </div>
        </div>
      </div>

      {detailEvent && <DetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />}
    </div>
  );
}
