import { useMemo, useState } from "react";
import {
  AlertTriangle, ChevronRight, Copy, Download, Plus, RefreshCw,
  RotateCcw, Search, X,
} from "lucide-react";

const C = {
  primary: "#4f6ef7",
  primaryDark: "#3b5de8",
  text: "#1a1d23",
  text2: "#374151",
  muted: "#6b7280",
  soft: "#9ca3af",
  line: "#e0e3ed",
  line2: "#f0f2f7",
  bg: "#f5f7fa",
  green: "#16a34a",
  orange: "#d97706",
  red: "#dc2626",
  purple: "#7c3aed",
};

const inputStyle: React.CSSProperties = {
  height: 34,
  border: `1px solid ${C.line}`,
  borderRadius: 6,
  padding: "0 10px",
  fontSize: 12.5,
  color: C.text2,
  background: "#fff",
  outline: "none",
};

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 600,
  color: C.muted,
  background: "#f8f9fc",
  borderBottom: `1px solid ${C.line}`,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "11px 12px",
  fontSize: 12.5,
  color: C.text2,
  borderBottom: `1px solid ${C.line2}`,
  verticalAlign: "middle",
};

function Button({
  children,
  onClick,
  primary,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "0 13px",
        borderRadius: 6,
        border: `1px solid ${primary ? C.primary : danger ? "#fecaca" : C.line}`,
        background: primary ? C.primary : danger ? "#fff7f7" : "#fff",
        color: primary ? "#fff" : danger ? C.red : C.text2,
        fontSize: 12.5,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function LinkButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 0,
        border: 0,
        background: "transparent",
        color: danger ? C.red : C.primary,
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Badge({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "orange" | "red" | "purple" | "gray";
}) {
  const palette = {
    blue: ["#eff4ff", C.primary],
    green: ["#effaf3", C.green],
    orange: ["#fff7ed", C.orange],
    red: ["#fef2f2", C.red],
    purple: ["#f5f0ff", C.purple],
    gray: ["#f3f4f6", C.muted],
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        padding: "0 8px",
        borderRadius: 4,
        background: palette[0],
        color: palette[1],
        fontSize: 11.5,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Page({
  section,
  title,
  description,
  actions,
  children,
}: {
  section: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="sa-page" style={{ height: "100%", overflow: "auto", background: C.bg }}>
      <style>{`
        .sa-page * { box-sizing: border-box; }
        .sa-page table { width: 100%; border-collapse: collapse; }
        .sa-toolbar { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .sa-grid-5 { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; }
        .sa-grid-2 { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:14px; }
        .sa-doc-layout { display:grid; grid-template-columns:240px minmax(0,1fr); min-height:560px; }
        .sa-repo-layout { display:grid; grid-template-columns:220px minmax(0,1fr); gap:14px; }
        .sa-repo-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
        @media (max-width: 760px) {
          .sa-page-head { align-items:flex-start !important; flex-direction:column; }
          .sa-grid-5 { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .sa-grid-2,.sa-doc-layout,.sa-repo-layout { grid-template-columns:1fr; }
          .sa-repo-grid { grid-template-columns:1fr; }
          .sa-table-wrap { overflow-x:auto; }
          .sa-table-wrap table { min-width:760px; }
          .sa-doc-tree { border-right:0 !important; border-bottom:1px solid ${C.line2}; max-height:220px; overflow:auto; }
        }
      `}</style>
      <div style={{ padding: "14px 24px 0", fontSize: 12.5, color: C.muted }}>
        <span style={{ color: C.primary }}>首页</span>
        <span style={{ margin: "0 6px" }}>/</span>
        <span style={{ color: C.primary }}>{section}</span>
        <span style={{ margin: "0 6px" }}>/</span>
        <span style={{ color: C.text }}>{title}</span>
      </div>
      <div
        className="sa-page-head"
        style={{
          padding: "12px 24px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: C.text, fontSize: 20, fontWeight: 700 }}>{title}</h1>
          {description && <div style={{ marginTop: 5, color: C.muted, fontSize: 12.5 }}>{description}</div>}
        </div>
        {actions}
      </div>
      <div style={{ padding: "0 24px 24px" }}>{children}</div>
    </div>
  );
}

function Card({
  title,
  actions,
  children,
  flush,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
}) {
  return (
    <section style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 8, overflow: "hidden" }}>
      {(title || actions) && (
        <div
          style={{
            minHeight: 48,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            borderBottom: `1px solid ${C.line2}`,
          }}
        >
          <strong style={{ color: C.text, fontSize: 13.5 }}>{title}</strong>
          {actions}
        </div>
      )}
      <div style={{ padding: flush ? 0 : 16 }}>{children}</div>
    </section>
  );
}

function Modal({
  title,
  children,
  onClose,
  onConfirm,
  confirmText = "确定",
  danger,
  width = 560,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  danger?: boolean;
  width?: number;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,24,39,.38)" }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: "fixed",
          zIndex: 301,
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: `min(${width}px, calc(100vw - 32px))`,
          maxHeight: "calc(100vh - 48px)",
          overflow: "auto",
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 24px 64px rgba(0,0,0,.18)",
        }}
      >
        <div style={{ height: 52, padding: "0 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.line2}` }}>
          <strong style={{ fontSize: 15, color: C.text }}>{title}</strong>
          <button type="button" aria-label="关闭" onClick={onClose} style={{ border: 0, background: "transparent", color: C.soft, cursor: "pointer" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
        <div style={{ minHeight: 56, padding: "10px 18px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, borderTop: `1px solid ${C.line2}`, background: "#fafbfd" }}>
          <Button onClick={onClose}>取消</Button>
          {onConfirm && <Button primary={!danger} danger={danger} onClick={onConfirm}>{confirmText}</Button>}
        </div>
      </div>
    </>
  );
}

function Toast({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 68,
        right: 24,
        zIndex: 400,
        border: 0,
        borderRadius: 7,
        background: "#1f2937",
        color: "#fff",
        padding: "10px 14px",
        fontSize: 12.5,
        boxShadow: "0 8px 24px rgba(0,0,0,.16)",
        cursor: "pointer",
      }}
    >
      {text}
    </button>
  );
}

const ROLE_ROWS = [
  { role: "管理员", tone: "gray" as const, group: "管理员推理资源组", task: "推理", resource: "4卡 · 256G", members: ["admin"] },
  { role: "VIP", tone: "purple" as const, group: "VIP推理资源组", task: "推理", resource: "6卡 · 384G", members: ["刘洋"] },
  { role: "开发人员", tone: "orange" as const, group: "开发人员训练资源组", task: "训练", resource: "8卡 · 512G", members: ["陈浩", "周琳", "孙悦"] },
  { role: "普通用户", tone: "green" as const, group: "普通用户训练资源组", task: "训练", resource: "2卡 · 128G", members: ["王琪"] },
  { role: "独立机构", tone: "blue" as const, group: "独立机构训练资源组", task: "训练", resource: "32卡 · 2048G", members: ["智谱", "深势"] },
  { role: "专项项目成员", tone: "gray" as const, group: "专项项目训练资源组", task: "训练", resource: "4卡 · 256G", members: ["李雯"] },
];

export function ResourceRoleConfigPage() {
  const [members, setMembers] = useState<(typeof ROLE_ROWS)[number] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState("");
  return (
    <Page
      section="权限与调度"
      title="角色配置"
      description="将资源角色与资源组、任务类型和人员范围统一绑定。"
      actions={<Button primary onClick={() => setShowCreate(true)}><Plus size={13} />新增角色</Button>}
    >
      <Card title="角色配置" flush>
        <div className="sa-table-wrap">
          <table>
            <thead><tr>{["资源角色", "绑定资源组", "任务标签", "资源组资源", "人员"].map(item => <th key={item} style={thStyle}>{item}</th>)}</tr></thead>
            <tbody>
              {ROLE_ROWS.map(row => (
                <tr key={row.role}>
                  <td style={tdStyle}><Badge tone={row.tone}>{row.role}</Badge></td>
                  <td style={tdStyle}>{row.group}</td>
                  <td style={tdStyle}>{row.task}</td>
                  <td style={tdStyle}>{row.resource}</td>
                  <td style={tdStyle}>
                    <span style={{ marginRight: 8 }}>{row.members.length}</span>
                    <LinkButton onClick={() => setMembers(row)}>查看人员</LinkButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {members && (
        <Modal title={`${members.role} · 人员`} onClose={() => setMembers(null)} width={480}>
          <div style={{ display: "grid", gap: 8 }}>
            {members.members.map((name, index) => (
              <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", border: `1px solid ${C.line2}`, borderRadius: 7 }}>
                <div>
                  <strong style={{ fontSize: 13, color: C.text }}>{name}</strong>
                  <div style={{ marginTop: 3, fontSize: 11.5, color: C.soft }}>member-{String(index + 1).padStart(3, "0")}</div>
                </div>
                <Badge tone="green">已生效</Badge>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {showCreate && (
        <Modal title="新增角色" onClose={() => setShowCreate(false)} onConfirm={() => { setShowCreate(false); setToast("角色配置已保存（演示）"); }}>
          <div className="sa-grid-2">
            <label style={{ display: "grid", gap: 6, fontSize: 12.5, color: C.text2 }}>角色名称<input placeholder="请输入角色名称" style={inputStyle} /></label>
            <label style={{ display: "grid", gap: 6, fontSize: 12.5, color: C.text2 }}>绑定资源组<select style={inputStyle}><option>管理员推理资源组</option><option>VIP推理资源组</option><option>开发人员训练资源组</option></select></label>
            <label style={{ display: "grid", gap: 6, fontSize: 12.5, color: C.text2 }}>任务标签<select style={inputStyle}><option>推理</option><option>训练</option><option>评测</option></select></label>
            <label style={{ display: "grid", gap: 6, fontSize: 12.5, color: C.text2 }}>排队策略<select style={inputStyle}><option>普通排队</option><option>优先排队</option><option>机构内 FIFO</option></select></label>
          </div>
        </Modal>
      )}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
    </Page>
  );
}

type QueueRole = "管理员" | "VIP" | "开发人员" | "普通用户" | "独立机构";

const QUEUE_ROWS: Record<QueueRole, { name: string; time: string; wait: string; block: string; reason: string }[]> = {
  管理员: [{ name: "管理员推理资源组0001", time: "16:18", wait: "00:07:00", block: "占比上限已达", reason: "管理员推理资源组已达到 80% 上限，等待资源释放。" }],
  VIP: [
    { name: "VIP推理资源组2031", time: "15:16", wait: "00:55:00", block: "占比上限已达", reason: "VIP 当前占比已达到 80% 上限，等待资源释放。" },
    { name: "VIP训练资源组2042", time: "15:48", wait: "00:23:00", block: "空闲 GPU 不足", reason: "当前空闲 GPU 占比不足，暂不满足任务规格。" },
  ],
  开发人员: [
    { name: "开发人员推理资源组1000", time: "16:05", wait: "00:20:10", block: "占比上限已达", reason: "开发人员当前占比已达到 80% 上限，等待资源释放。" },
    { name: "开发人员训练资源组1011", time: "15:42", wait: "1天 02:00:00", block: "空闲 GPU 不足", reason: "当前空闲 GPU 占比不足，建议拆分为单卡任务。" },
    { name: "开发人员训练资源组1012", time: "15:36", wait: "02:05:20", block: "全局资源不足", reason: "开发人员当前占用接近上限，等待全局资源释放。" },
  ],
  普通用户: [
    { name: "普通用户训练资源组1001", time: "15:10", wait: "01:13:00", block: "占比上限已达", reason: "普通用户当前占比已达到 80% 上限。" },
    { name: "普通用户推理资源组1002", time: "15:14", wait: "01:09:00", block: "空闲 GPU 不足", reason: "空闲 GPU 不足，等待资源释放。" },
  ],
  独立机构: [
    { name: "机构共享资源组1024", time: "15:12", wait: "01:21:00", block: "占比上限已达", reason: "机构B 当前占比已达到 80% 上限。" },
    { name: "机构共享资源组2100", time: "15:44", wait: "00:49:00", block: "全局资源不足", reason: "全局 GPU 空闲占比不足。" },
  ],
};

export function ResourceRoleQueuePage() {
  const [role, setRole] = useState<QueueRole>("开发人员");
  const [sort, setSort] = useState<"wait" | "time">("wait");
  const [toast, setToast] = useState("");
  const rows = QUEUE_ROWS[role];
  const color = role === "VIP" ? C.purple : role === "开发人员" ? "#f97316" : role === "普通用户" ? "#10b981" : C.primary;
  return (
    <Page section="权限与调度" title="角色队列" description="查看各资源角色的 GPU 占用、排队任务与阻塞原因。" actions={<Button onClick={() => setToast("队列状态已刷新")}><RefreshCw size={13} />刷新</Button>}>
      <div className="sa-toolbar" style={{ marginBottom: 12 }}>
        {(Object.keys(QUEUE_ROWS) as QueueRole[]).map(item => (
          <button key={item} type="button" onClick={() => setRole(item)} style={{ height: 32, padding: "0 14px", border: `1px solid ${role === item ? C.primary : C.line}`, borderRadius: 6, background: role === item ? C.primary : "#fff", color: role === item ? "#fff" : C.text2, fontSize: 12.5, cursor: "pointer" }}>{item}</button>
        ))}
      </div>
      <div className="sa-grid-2" style={{ marginBottom: 14 }}>
        <Card title={`${role} GPU 占比`}>
          <div style={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", gap: 34, flexWrap: "wrap" }}>
            <div style={{ width: 138, height: 138, borderRadius: "50%", background: `conic-gradient(${color} 0 75%, #e5e7eb 75% 100%)`, display: "grid", placeItems: "center" }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", textAlign: "center" }}>
                <div><strong style={{ display: "block", fontSize: 23, color: C.text }}>75%</strong><span style={{ fontSize: 11.5, color: C.soft }}>已占用</span></div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12, minWidth: 160 }}>
              {[["当前角色占用", "75%", color], ["空闲 GPU", "25%", "#cbd5e1"], ["不可用 GPU", "0%", "#6b7280"]].map(([label, value, dot]) => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: dot }} />
                  <span style={{ color: C.muted }}>{label}</span><strong style={{ color: C.text }}>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="调度策略">
          <div style={{ display: "grid", gap: 10 }}>
            {[["最大占比上限", "80%"], ["队列规则", role === "独立机构" ? "机构内 FIFO" : "按提交时间 FIFO"], ["资源不足处理", "不抢占 · 排队等待"], ["当前排队任务", `${rows.length} 个`]].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.line2}`, fontSize: 12.5 }}><span style={{ color: C.muted }}>{label}</span><strong style={{ color: C.text }}>{value}</strong></div>
            ))}
          </div>
        </Card>
      </div>
      <Card
        title="任务队列"
        actions={
          <div className="sa-toolbar">
            <Button primary={sort === "wait"} onClick={() => setSort("wait")}>等待时长↓</Button>
            <Button primary={sort === "time"} onClick={() => setSort("time")}>提交时间↑</Button>
          </div>
        }
        flush
      >
        <div className="sa-table-wrap">
          <table>
            <thead><tr>{["归属", "任务名称", "提交时间", "已等待时长", "阻塞分类标签", "等待原因"].map(item => <th key={item} style={thStyle}>{item}</th>)}</tr></thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.name}>
                  <td style={tdStyle}><Badge tone={role === "VIP" ? "purple" : role === "开发人员" ? "orange" : role === "普通用户" ? "green" : "gray"}>{role}</Badge></td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: C.text }}>{row.name}</td>
                  <td style={tdStyle}>{row.time}</td><td style={tdStyle}>{row.wait}</td>
                  <td style={tdStyle}><Badge tone={row.block === "空闲 GPU 不足" ? "gray" : "orange"}>{row.block}</Badge></td>
                  <td style={tdStyle}>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
    </Page>
  );
}

interface ApiKeyRow {
  id: number;
  name: string;
  masked: string;
  owner: string;
  role: string;
  quota: string;
  lastUsed: string;
  enabled: boolean;
}

const API_KEYS: ApiKeyRow[] = [
  { id: 1, name: "personal-free-key", masked: "sk-************************31fd", owner: "王琪", role: "普通个人用户", quota: "个人额度", lastUsed: "2026-07-21 14:38", enabled: true },
  { id: 2, name: "vip-personal-key", masked: "sk-************************7a8c", owner: "刘洋", role: "VIP个人用户", quota: "个人额度", lastUsed: "2026-07-21 15:41", enabled: true },
  { id: 3, name: "rd-team-key", masked: "sk-************************9f2a", owner: "陈浩", role: "普通个人用户", quota: "研发团队", lastUsed: "2026-07-21 15:52", enabled: true },
  { id: 4, name: "org-owner-test-key", masked: "sk-************************41bc", owner: "周航", role: "普通机构用户", quota: "测试团队", lastUsed: "2026-07-21 15:30", enabled: true },
  { id: 5, name: "gov-team-key", masked: "sk-************************88de", owner: "李雯", role: "普通机构用户", quota: "政务专项", lastUsed: "2026-03-12 10:04", enabled: false },
];

export function ApiKeyManagementPage() {
  const [rows, setRows] = useState(API_KEYS);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState<{ type: "create" | "detail" | "toggle" | "delete"; row?: ApiKeyRow } | null>(null);
  const [toast, setToast] = useState("");
  const filtered = rows.filter(row => (!query || `${row.name}${row.owner}${row.quota}`.toLowerCase().includes(query.toLowerCase())) && (!role || row.role === role) && (!status || (status === "启用") === row.enabled));
  const close = () => setModal(null);
  return (
    <Page section="统计监控" title="API Key" description="管理平台 API 访问凭证、额度归属与启停状态。" actions={<Button primary onClick={() => setModal({ type: "create" })}><Plus size={13} />创建 API Key</Button>}>
      <Card
        title="API Key 列表"
        actions={<Button onClick={() => setToast("API Key 状态已刷新")}><RefreshCw size={13} />刷新</Button>}
        flush
      >
        <div className="sa-toolbar" style={{ padding: 14, borderBottom: `1px solid ${C.line2}` }}>
          <div style={{ position: "relative" }}><Search size={13} color={C.soft} style={{ position: "absolute", left: 10, top: 10 }} /><input aria-label="搜索 API Key" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索 Key 名称 / 用户 / 团队" style={{ ...inputStyle, width: 245, paddingLeft: 30 }} /></div>
          <select aria-label="角色筛选" value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, minWidth: 150 }}><option value="">全部角色</option><option>普通个人用户</option><option>VIP个人用户</option><option>普通机构用户</option></select>
          <select aria-label="状态筛选" value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, minWidth: 120 }}><option value="">全部状态</option><option>启用</option><option>禁用</option></select>
          <Button primary><Search size={13} />查询</Button>
          <Button onClick={() => { setQuery(""); setRole(""); setStatus(""); }}><RotateCcw size={13} />重置</Button>
        </div>
        <div className="sa-table-wrap">
          <table>
            <thead><tr>{["Key 名称", "Key", "名称", "额度归属", "最后使用", "状态", "操作"].map(item => <th key={item} style={thStyle}>{item}</th>)}</tr></thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: C.text }}>{row.name}</td>
                  <td style={{ ...tdStyle, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", color: C.muted }}>{row.masked}</td>
                  <td style={tdStyle}>{row.owner}</td>
                  <td style={tdStyle}><span style={{ marginRight: 6 }}><Badge tone={row.role.includes("VIP") ? "orange" : row.role.includes("机构") ? "purple" : "green"}>{row.role}</Badge></span>{row.quota}</td>
                  <td style={tdStyle}>{row.lastUsed}</td>
                  <td style={tdStyle}><Badge tone={row.enabled ? "green" : "red"}>{row.enabled ? "启用" : "禁用"}</Badge></td>
                  <td style={tdStyle}>
                    <div className="sa-toolbar">
                      <LinkButton onClick={() => setModal({ type: "detail", row })}>详情</LinkButton>
                      <LinkButton onClick={() => setToast("Key 已复制（演示）")}>复制</LinkButton>
                      <LinkButton danger={row.enabled} onClick={() => setModal({ type: "toggle", row })}>{row.enabled ? "禁用" : "启用"}</LinkButton>
                      <LinkButton danger onClick={() => setModal({ type: "delete", row })}>删除</LinkButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.line2}`, fontSize: 12, color: C.soft }}>
          <span>共 {filtered.length} 条</span><Badge>1</Badge>
        </div>
      </Card>
      {modal?.type === "create" && (
        <Modal title="创建 API Key" onClose={close} onConfirm={() => { close(); setToast("API Key 创建成功（演示）"); }}>
          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12.5 }}>API Key 名称<input placeholder="请输入 API Key 名称" style={inputStyle} /></label>
            <label style={{ display: "grid", gap: 6, fontSize: 12.5 }}>额度归属<select style={inputStyle}><option>个人额度</option><option>研发团队</option><option>测试团队</option><option>政务专项</option></select></label>
            <label style={{ display: "grid", gap: 6, fontSize: 12.5 }}>有效期<select style={inputStyle}><option>90 天</option><option>180 天</option><option>永久有效</option></select></label>
          </div>
        </Modal>
      )}
      {modal?.type === "detail" && modal.row && (
        <Modal title="API Key 详情" onClose={close}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "12px 16px", fontSize: 12.5 }}>
            {[["Key 名称", modal.row.name], ["Key", modal.row.masked], ["名称", modal.row.owner], ["额度归属", modal.row.quota], ["最后使用", modal.row.lastUsed], ["状态", modal.row.enabled ? "启用" : "禁用"]].map(([label, value]) => <div key={label} style={{ display: "contents" }}><span style={{ color: C.soft }}>{label}</span><strong style={{ color: C.text }}>{value}</strong></div>)}
          </div>
        </Modal>
      )}
      {modal?.type === "toggle" && modal.row && (
        <Modal title={`${modal.row.enabled ? "禁用" : "启用"} API Key`} onClose={close} confirmText={modal.row.enabled ? "确认禁用" : "确认启用"} danger={modal.row.enabled} onConfirm={() => { setRows(prev => prev.map(row => row.id === modal.row?.id ? { ...row, enabled: !row.enabled } : row)); close(); setToast("API Key 状态已更新"); }}>
          <div style={{ color: C.text2, fontSize: 13, lineHeight: 1.7 }}>确认{modal.row.enabled ? "禁用" : "启用"} <strong>{modal.row.name}</strong>？状态变更后将立即生效。</div>
        </Modal>
      )}
      {modal?.type === "delete" && modal.row && (
        <Modal title="删除 API Key" onClose={close} confirmText="确认删除" danger onConfirm={() => { setRows(prev => prev.filter(row => row.id !== modal.row?.id)); close(); setToast("API Key 已删除"); }}>
          <div style={{ display: "flex", gap: 10, color: C.text2, fontSize: 13, lineHeight: 1.7 }}><AlertTriangle size={18} color={C.red} /><span>删除后无法恢复，使用该 Key 的调用将立即失败。</span></div>
        </Modal>
      )}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
    </Page>
  );
}

type UsageTab = "总览" | "Token" | "GPU 实例" | "存储" | "资源事件";

export function AdminUsageStatsPage() {
  const [tab, setTab] = useState<UsageTab>("总览");
  const [granularity, setGranularity] = useState("按天");
  const [toast, setToast] = useState("");
  const metrics = tab === "GPU 实例"
    ? [["GPU 小时", "1,824"], ["实例小时", "642"], ["活跃实例", "18"], ["活跃用户", "31"], ["峰值 GPU", "72%"]]
    : tab === "存储"
      ? [["模型存储", "2.6 TB"], ["数据集存储", "1.8 TB"], ["日志存储", "428 GB"], ["本月增长", "12%"], ["存储空间", "68%"]]
      : [["输入 Token 数", "8.24M"], ["输出 Token 数", "3.61M"], ["总 Token 数", "11.85M"], ["API 请求数", "48,216"], ["使用的模型数", "12"]];
  return (
    <Page section="统计监控" title="用量统计" description="按 Token、GPU、存储和资源事件统一分析平台消耗。">
      <div className="sa-toolbar" style={{ marginBottom: 12 }}>
        {(["总览", "Token", "GPU 实例", "存储", "资源事件"] as UsageTab[]).map(item => <button key={item} type="button" onClick={() => setTab(item)} style={{ height: 34, padding: "0 16px", border: `1px solid ${tab === item ? C.primary : C.line}`, borderRadius: 6, background: tab === item ? C.primary : "#fff", color: tab === item ? "#fff" : C.text2, fontSize: 12.5, cursor: "pointer" }}>{item}</button>)}
      </div>
      <Card>
        <div className="sa-toolbar">
          <div style={{ ...inputStyle, display: "inline-flex", alignItems: "center" }}>2026-06-22 <span style={{ margin: "0 8px", color: C.soft }}>→</span> 2026-07-21</div>
          <select aria-label="按模型查询" style={{ ...inputStyle, minWidth: 150 }}><option>按模型查询</option><option>DeepSeek-R1</option><option>Qwen3-32B</option></select>
          <select aria-label="按用户查询" style={{ ...inputStyle, minWidth: 140 }}><option>按用户查询</option><option>admin</option><option>chenhao</option></select>
          <select aria-label="按 API Key 查询" style={{ ...inputStyle, minWidth: 170 }}><option>按 API Key 查询</option><option>personal-free-key</option><option>rd-team-key</option></select>
          <Button onClick={() => setToast("用量数据已刷新")}><RefreshCw size={13} />刷新</Button>
          <Button onClick={() => setToast("已生成用量导出文件（演示）")}><Download size={13} />导出</Button>
        </div>
      </Card>
      {tab === "资源事件" ? (
        <div style={{ marginTop: 14 }}>
          <Card title="资源事件" flush>
            <div className="sa-table-wrap"><table><thead><tr>{["时间", "事件", "资源", "操作者", "结果"].map(item => <th key={item} style={thStyle}>{item}</th>)}</tr></thead><tbody>
              {[["2026-07-21 15:30", "资源组扩容", "VIP推理资源组", "admin", "成功"], ["2026-07-21 14:18", "实例释放", "gpu-instance-028", "scheduler", "成功"], ["2026-07-21 10:42", "节点告警", "node04", "monitor", "已恢复"]].map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={cell} style={tdStyle}>{index === 4 ? <Badge tone="green">{cell}</Badge> : cell}</td>)}</tr>)}
            </tbody></table></div>
          </Card>
        </div>
      ) : (
        <>
          <div className="sa-grid-5" style={{ marginTop: 14 }}>
            {metrics.map(([label, value]) => <div key={label} style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 8, padding: 15 }}><strong style={{ display: "block", color: C.text, fontSize: 21 }}>{value}</strong><span style={{ display: "block", marginTop: 7, color: C.muted, fontSize: 11.5 }}>{label}</span></div>)}
          </div>
          <div style={{ marginTop: 14 }}>
            <Card title={`${tab === "总览" ? "总 Token 数" : tab}趋势`} actions={<div className="sa-toolbar">{["按天", "按周", "按月"].map(item => <Button key={item} primary={granularity === item} onClick={() => setGranularity(item)}>{item}</Button>)}</div>}>
              <div style={{ height: 230, display: "flex", alignItems: "flex-end", gap: 16, padding: "28px 16px 0", background: "linear-gradient(#fff,#fafbfd)", borderBottom: `1px solid ${C.line}` }}>
                {[38, 52, 46, 68, 61, 79, 72, 88, 66, 81, 75, 91].map((height, index) => <div key={index} title={`${height}%`} style={{ flex: 1, minWidth: 8, height: `${height}%`, borderRadius: "5px 5px 0 0", background: index === 11 ? C.primary : "#dbe4ff" }} />)}
              </div>
            </Card>
          </div>
        </>
      )}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
    </Page>
  );
}

interface LogRow {
  time: string;
  requestId: string;
  taskId: string;
  task: string;
  queue: string;
  type: string;
  user: string;
  quota: string;
  duration: string;
  status: "执行中" | "已完成" | "失败";
}

const LOG_ROWS: LogRow[] = [
  { time: "2026-07-21 14:19:05", requestId: "REQ-20260721-0001", taskId: "TASK-0721-001", task: "客服问答模型评估", queue: "评测公共队列", type: "评测", user: "陈浩", quota: "研发团队", duration: "18 分钟", status: "执行中" },
  { time: "2026-07-21 13:42:18", requestId: "REQ-20260721-0002", taskId: "TASK-0721-002", task: "政务摘要模型评估", queue: "政务专项队列", type: "评测", user: "李雯", quota: "政务专项", duration: "42 分钟", status: "执行中" },
  { time: "2026-07-21 11:30:26", requestId: "REQ-20260721-0003", taskId: "TASK-0721-003", task: "文档助手调用任务", queue: "VIP 推理队列", type: "调用", user: "刘洋", quota: "个人额度", duration: "1 天", status: "已完成" },
  { time: "2026-07-21 10:08:42", requestId: "REQ-20260721-0004", taskId: "TASK-0721-004", task: "默认调用任务", queue: "公共推理队列", type: "推理", user: "王琪", quota: "个人额度", duration: "36 分钟", status: "已完成" },
  { time: "2026-07-18 10:02:39", requestId: "REQ-20260718-0011", taskId: "TASK-0718-006", task: "客服语料微调训练", queue: "VIP 训练队列", type: "训练", user: "周琳", quota: "个人额度", duration: "42 分钟", status: "已完成" },
  { time: "2026-07-17 09:28:11", requestId: "REQ-20260717-0016", taskId: "TASK-0717-004", task: "政策问答批处理训练", queue: "机构训练队列", type: "训练", user: "何远", quota: "政务专项", duration: "8 分钟", status: "失败" },
];

export function TaskLogPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [detail, setDetail] = useState<LogRow | null>(null);
  const [toast, setToast] = useState("");
  const filtered = LOG_ROWS.filter(row => (!query || Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())) && (!status || row.status === status) && (!type || row.type === type));
  return (
    <Page section="统计监控" title="任务日志" description="检索训练、推理、评测和调用任务的运行结果与执行日志。">
      <Card>
        <div className="sa-toolbar">
          <input aria-label="关键词" value={query} onChange={e => setQuery(e.target.value)} placeholder="任务名称 / 任务 ID / 请求 ID / 用户" style={{ ...inputStyle, minWidth: 270 }} />
          <select aria-label="执行状态" value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, minWidth: 130 }}><option value="">全部状态</option><option>执行中</option><option>已完成</option><option>失败</option></select>
          <select aria-label="任务类型" value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle, minWidth: 130 }}><option value="">全部类型</option><option>评测</option><option>训练</option><option>推理</option><option>调用</option></select>
          <div style={{ ...inputStyle, display: "inline-flex", alignItems: "center" }}>2026/07/15 - 2026/07/21</div>
          <Button primary><Search size={13} />搜索</Button>
          <Button onClick={() => { setQuery(""); setStatus(""); setType(""); }}><RotateCcw size={13} />重置</Button>
        </div>
      </Card>
      <div style={{ marginTop: 14 }}>
        <Card title="实时日志" actions={<Button onClick={() => setToast("任务日志已刷新")}><RefreshCw size={13} />刷新</Button>} flush>
          <div className="sa-table-wrap">
            <table>
              <thead><tr>{["日志时间", "请求 ID", "任务 ID", "任务名称", "任务类型", "提交用户", "额度归属", "运行时长", "执行状态", "操作"].map(item => <th key={item} style={thStyle}>{item}</th>)}</tr></thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.requestId}>
                    <td style={tdStyle}>{row.time}</td><td style={tdStyle}>{row.requestId}</td><td style={tdStyle}>{row.taskId}</td>
                    <td style={tdStyle}><strong style={{ display: "block", color: C.text }}>{row.task}</strong><span style={{ display: "block", marginTop: 3, color: C.soft, fontSize: 11 }}>{row.queue}</span></td>
                    <td style={tdStyle}>{row.type}</td><td style={tdStyle}>{row.user}</td><td style={tdStyle}>{row.quota}</td><td style={tdStyle}>{row.duration}</td>
                    <td style={tdStyle}><Badge tone={row.status === "已完成" ? "green" : row.status === "失败" ? "red" : "orange"}>{row.status}</Badge></td>
                    <td style={tdStyle}><LinkButton onClick={() => setDetail(row)}>查看结果</LinkButton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      {detail && (
        <Modal title="任务结果详情" onClose={() => setDetail(null)} width={680}>
          <div className="sa-grid-2">
            {[["请求 ID", detail.requestId], ["任务 ID", detail.taskId], ["任务名称", detail.task], ["执行状态", detail.status], ["日志时间", detail.time], ["任务类型", detail.type], ["提交用户", detail.user], ["运行时长", detail.duration]].map(([label, value]) => <div key={label} style={{ padding: 10, border: `1px solid ${C.line2}`, borderRadius: 7 }}><span style={{ display: "block", color: C.soft, fontSize: 11.5 }}>{label}</span><strong style={{ display: "block", marginTop: 5, color: C.text, fontSize: 12.5 }}>{value}</strong></div>)}
          </div>
          <div style={{ marginTop: 14, background: "#111827", color: "#d1d5db", borderRadius: 7, padding: 14, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 11.5, lineHeight: 1.8 }}>
            <div><span style={{ color: "#93c5fd" }}>INFO</span> 接收请求 {detail.requestId}</div>
            <div><span style={{ color: "#93c5fd" }}>INFO</span> 进入 {detail.queue}</div>
            <div><span style={{ color: detail.status === "失败" ? "#fca5a5" : "#86efac" }}>{detail.status === "失败" ? "WARN" : "OK"}</span> {detail.status === "失败" ? "训练容器退出码异常，已写入错误报告。" : "资源、权限与额度校验通过。"}</div>
            <div><span style={{ color: "#93c5fd" }}>INFO</span> 当前状态：{detail.status}</div>
          </div>
        </Modal>
      )}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
    </Page>
  );
}

interface DocItem {
  id: string;
  group: string;
  title: string;
  intro: string;
  steps: string[];
  code?: string;
}

const DOCS: DocItem[] = [
  { id: "quickstart", group: "快速入门", title: "完成第一个训练任务", intro: "从模型选择、训练配置到获取模型，完成一条可运行的 MaaS 训练链路。", steps: ["选择模型并确认可训练版本", "上传或选择训练数据集", "设置资源规格与训练参数", "提交任务并查看评估报告"], code: `POST /v1/train/tasks\nAuthorization: Bearer <API_KEY>\nContent-Type: application/json\n\n{\n  "model_name": "stable-diffusion-xl",\n  "dataset_path": "oss://demo/custom-dataset",\n  "task_type": "text_to_image_finetune"\n}` },
  { id: "train", group: "功能指南", title: "提交训练任务", intro: "介绍继续预训练、监督微调和文生图训练的提交方法。", steps: ["选择任务类型", "绑定基础模型和数据", "配置 LoRA 或全量微调", "确认并提交"] },
  { id: "api", group: "API 参考", title: "自回归预训练框架", intro: "使用 SDK 或 REST API 创建、查询和管理自回归预训练任务。", steps: ["初始化 MaaSClient", "创建 TrainingConfig", "提交训练任务", "轮询任务状态"], code: `from maas import Client\n\nclient = Client(api_key="YOUR_API_KEY")\njob = client.training.create(\n    name="autoregressive-demo",\n    framework="PyTorch",\n    dataset="oss://bucket/train.jsonl"\n)\nprint(job.id)` },
  { id: "auth", group: "开发指南", title: "认证与权限", intro: "平台接口使用 API Key 鉴权，并按角色、空间与额度归属校验权限。", steps: ["创建 API Key", "设置 Authorization Header", "处理 401 / 403 错误", "轮换或禁用密钥"] },
  { id: "faq", group: "常见问题", title: "额度与权限", intro: "排查资源额度不足、权限拒绝和任务排队等常见问题。", steps: ["检查额度归属", "确认资源角色", "查看角色队列阻塞原因", "联系管理员调整策略"] },
];

export function DocumentationCenterPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("quickstart");
  const [toast, setToast] = useState("");
  const filtered = DOCS.filter(doc => !query || `${doc.group}${doc.title}${doc.intro}`.toLowerCase().includes(query.toLowerCase()));
  const selected = DOCS.find(doc => doc.id === selectedId) ?? DOCS[0];
  const groups = Array.from(new Set(filtered.map(doc => doc.group)));
  return (
    <Page section="文档中心" title="在线文档" description="按产品流程、功能指南和 API 参考快速查阅 MaaS 使用方法。">
      <Card flush>
        <div style={{ minHeight: 54, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: `1px solid ${C.line2}`, flexWrap: "wrap" }}>
          <strong style={{ fontSize: 13.5, color: C.text }}>文档目录与正文</strong>
          <div style={{ position: "relative" }}><Search size={13} color={C.soft} style={{ position: "absolute", left: 10, top: 10 }} /><input aria-label="搜索文档" value={query} onChange={e => setQuery(e.target.value)} placeholder="请输入产品、文档关键词" style={{ ...inputStyle, width: 270, paddingLeft: 30 }} /></div>
        </div>
        <div className="sa-doc-layout">
          <aside className="sa-doc-tree" style={{ padding: 14, borderRight: `1px solid ${C.line2}`, background: "#fafbfd" }}>
            {groups.map(group => (
              <div key={group} style={{ marginBottom: 15 }}>
                <strong style={{ display: "block", marginBottom: 5, color: C.muted, fontSize: 11.5 }}>{group}</strong>
                {filtered.filter(doc => doc.group === group).map(doc => <button key={doc.id} type="button" onClick={() => setSelectedId(doc.id)} style={{ width: "100%", minHeight: 34, padding: "6px 9px", textAlign: "left", border: 0, borderRadius: 5, background: selected.id === doc.id ? "#eff4ff" : "transparent", color: selected.id === doc.id ? C.primary : C.text2, fontSize: 12.5, cursor: "pointer" }}>{doc.title}</button>)}
              </div>
            ))}
          </aside>
          <article style={{ minWidth: 0, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div><Badge>{selected.group}</Badge><h2 style={{ margin: "12px 0 7px", color: C.text, fontSize: 21 }}>{selected.title}</h2><p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{selected.intro}</p></div>
              <Button onClick={() => setToast("Markdown 已复制（演示）")}><Copy size={13} />复制 MD</Button>
            </div>
            <div style={{ marginTop: 22 }}>
              <h3 style={{ fontSize: 14, color: C.text }}>操作步骤</h3>
              <div style={{ display: "grid", gap: 9 }}>
                {selected.steps.map((step, index) => <div key={step} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 9, alignItems: "center", padding: "10px 12px", border: `1px solid ${C.line2}`, borderRadius: 7 }}><span style={{ width: 22, height: 22, borderRadius: 99, display: "grid", placeItems: "center", background: "#eff4ff", color: C.primary, fontSize: 11.5, fontWeight: 700 }}>{index + 1}</span><span style={{ color: C.text2, fontSize: 12.5 }}>{step}</span></div>)}
              </div>
            </div>
            {selected.code && <div style={{ marginTop: 20 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><strong style={{ fontSize: 13, color: C.text }}>调用示例</strong><LinkButton onClick={() => setToast("代码已复制（演示）")}>一键复制</LinkButton></div><pre style={{ margin: 0, maxWidth: "100%", overflow: "auto", borderRadius: 7, padding: 15, background: "#111827", color: "#dbeafe", fontSize: 11.5, lineHeight: 1.7 }}>{selected.code}</pre></div>}
          </article>
        </div>
      </Card>
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
    </Page>
  );
}

interface Sample {
  title: string;
  framework: string;
  language: string;
  scene: string;
  description: string;
}

const SAMPLES: Sample[] = [
  { title: "基于 GCN 的论文分类", framework: "PyTorch Geometric", language: "Jupyter Notebook", scene: "论文分类", description: "加载 Cora 数据集，构建两层 GCN 并输出论文类别。" },
  { title: "使用 Graph2Vec 进行图相似度计算", framework: "NetworkX", language: "Jupyter Notebook", scene: "图相似度", description: "提取 WL 子树特征，训练图向量并计算余弦相似度。" },
  { title: "GraphSAGE 节点分类", framework: "DGL", language: "Python", scene: "节点分类", description: "使用邻居采样聚合局部结构，降低全图训练成本。" },
  { title: "GAT 引文网络分类", framework: "PyTorch Geometric", language: "Python", scene: "注意力", description: "通过注意力权重学习邻居重要性，提升可解释性。" },
  { title: "DeepWalk 节点表示学习", framework: "NetworkX", language: "Python", scene: "图表示", description: "随机游走生成节点序列，使用 Skip-gram 训练嵌入。" },
  { title: "自定义数据集接入", framework: "Dataset", language: "Jupyter Notebook", scene: "数据准备", description: "定义节点、边、标签映射，封装 Dataset 进入训练流程。" },
  { title: "训练任务 API 提交", framework: "RESTful API", language: "cURL", scene: "任务提交", description: "通过 API 创建训练任务并轮询状态与结果路径。" },
  { title: "批量评测与报告导出", framework: "Evaluation", language: "Python", scene: "评测", description: "批量计算准确率、F1 与 AUC，统一导出报告。" },
];

export function SampleRepositoryPage() {
  const [framework, setFramework] = useState("");
  const [language, setLanguage] = useState("");
  const [scene, setScene] = useState("");
  const [detail, setDetail] = useState<Sample | null>(null);
  const [toast, setToast] = useState("");
  const filtered = useMemo(() => SAMPLES.filter(item => (!framework || item.framework === framework) && (!language || item.language === language) && (!scene || item.scene === scene)), [framework, language, scene]);
  return (
    <Page section="文档中心" title="示例代码库" description="提供可运行的训练、图学习、数据接入与评测代码示例。" actions={<Button primary onClick={() => setToast("示例代码包已生成（演示）")}><Download size={13} />下载示例代码包</Button>}>
      <div className="sa-repo-layout">
        <Card title="文档树形导航">
          {[["图学习入门", ["基于 GCN 的论文分类", "GraphSAGE 节点分类", "GAT 引文网络分类"]], ["图表示学习", ["Graph2Vec 图相似度", "DeepWalk 节点表示学习"]], ["工程化运行", ["自定义数据集接入", "训练任务 API 提交", "批量评测与报告导出"]]].map(([group, items]) => <div key={group as string} style={{ marginBottom: 14 }}><strong style={{ display: "block", marginBottom: 5, color: C.muted, fontSize: 11.5 }}>{group}</strong>{(items as string[]).map(item => <div key={item} style={{ minHeight: 31, padding: "6px 7px", color: C.text2, fontSize: 12 }}>{item}</div>)}</div>)}
        </Card>
        <div style={{ minWidth: 0 }}>
          <Card>
            <div className="sa-toolbar">
              <select aria-label="训练框架" value={framework} onChange={e => setFramework(e.target.value)} style={{ ...inputStyle, minWidth: 175 }}><option value="">全部框架</option>{Array.from(new Set(SAMPLES.map(item => item.framework))).map(item => <option key={item}>{item}</option>)}</select>
              <select aria-label="编程语言" value={language} onChange={e => setLanguage(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}><option value="">全部语言</option>{Array.from(new Set(SAMPLES.map(item => item.language))).map(item => <option key={item}>{item}</option>)}</select>
              <select aria-label="应用场景" value={scene} onChange={e => setScene(e.target.value)} style={{ ...inputStyle, minWidth: 150 }}><option value="">全部场景</option>{Array.from(new Set(SAMPLES.map(item => item.scene))).map(item => <option key={item}>{item}</option>)}</select>
              <Button primary><Search size={13} />筛选</Button><Button onClick={() => { setFramework(""); setLanguage(""); setScene(""); }}><RotateCcw size={13} />重置</Button>
            </div>
          </Card>
          <div className="sa-repo-grid" style={{ marginTop: 12 }}>
            {filtered.map(item => <button key={item.title} type="button" onClick={() => setDetail(item)} style={{ minHeight: 150, padding: 16, textAlign: "left", border: "1px solid #e8ebf2", borderRadius: 8, background: "#fff", cursor: "pointer" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong style={{ color: C.text, fontSize: 14 }}>{item.title}</strong><ChevronRight size={15} color={C.soft} /></div><p style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.7 }}>{item.description}</p><div className="sa-toolbar"><Badge>{item.framework}</Badge><Badge tone="green">{item.language}</Badge><Badge tone="gray">{item.scene}</Badge></div></button>)}
          </div>
        </div>
      </div>
      {detail && (
        <Modal title={detail.title} onClose={() => setDetail(null)} width={760}>
          <div className="sa-toolbar" style={{ marginBottom: 14 }}><Badge>{detail.framework}</Badge><Badge tone="green">{detail.language}</Badge><Badge tone="gray">{detail.scene}</Badge></div>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>{detail.description}</p>
          <pre style={{ margin: "14px 0 0", overflow: "auto", borderRadius: 7, padding: 15, background: "#111827", color: "#dbeafe", fontSize: 11.5, lineHeight: 1.7 }}>{`from maas import Client\n\nclient = Client(api_key="YOUR_API_KEY")\njob = client.training.create(\n    name="${detail.title}",\n    framework="${detail.framework}",\n    dataset="oss://bucket/dataset"\n)\nprint(job.id)`}</pre>
        </Modal>
      )}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
    </Page>
  );
}
