import { useMemo, useState } from "react";
import {
  AlertTriangle, ChevronRight, Copy, Download, Plus, RefreshCw,
  RotateCcw, Search, X,
} from "lucide-react";

// 页面结构与演示数据基准：
// /Users/a1/Downloads/maas-super-admin-preview(1).html
// SHA-256: a24dccf6e9dbd3469f264948e83d00d96eb96127a206a1da1216bbff044bc43c

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
  return (
    <Page
      section="权限与调度"
      title="角色配置"
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
    </Page>
  );
}

type QueueRole = "管理员" | "VIP" | "开发人员" | "普通用户" | "独立机构";

const QUEUE_ROWS: Record<QueueRole, { name: string; time: string; wait: string; block: string; reason: string }[]> = {
  管理员: [
    { name: "管理员推理资源组0001", time: "16:18", wait: "00:07:00", block: "占比上限已达", reason: "管理员推理资源组当前占比已达到 80% 上限，等待资源释放。" },
    { name: "VIP推理资源组2031", time: "15:16", wait: "00:55:00", block: "占比上限已达", reason: "VIP 当前占比已达到 80% 上限，等待资源释放。" },
    { name: "开发人员训练资源组1011", time: "15:42", wait: "1天 02:00:00", block: "空闲 GPU 不足", reason: "当前空闲 GPU 占比不足，建议拆分为单卡任务。" },
    { name: "机构共享资源组1025", time: "15:18", wait: "01:15:00", block: "空闲 GPU 不足", reason: "当前空闲 GPU 占比不足，暂不满足任务规格。" },
    { name: "开发人员训练资源组1012", time: "15:36", wait: "02:05:20", block: "全局资源不足", reason: "开发人员资源等待全局资源释放。" },
    { name: "机构共享资源组2100", time: "15:44", wait: "00:49:00", block: "全局资源不足", reason: "全局 GPU 空闲占比不足，等待全局资源释放。" },
    { name: "普通用户训练资源组1003", time: "15:18", wait: "01:05:00", block: "全局资源不足", reason: "全局 GPU 空闲占比不足，等待全局资源释放。" },
  ],
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
    { name: "普通用户训练资源组1003", time: "15:18", wait: "01:05:00", block: "全局资源不足", reason: "全局 GPU 空闲占比不足，等待全局资源释放。" },
  ],
  独立机构: [
    { name: "机构共享资源组1024", time: "15:12", wait: "01:21:00", block: "占比上限已达", reason: "机构B 当前占比已达到 80% 上限。" },
    { name: "机构共享资源组1025", time: "15:18", wait: "01:15:00", block: "空闲 GPU 不足", reason: "当前空闲 GPU 占比不足，暂不满足任务规格。" },
    { name: "机构共享资源组2100", time: "15:44", wait: "00:49:00", block: "全局资源不足", reason: "全局 GPU 空闲占比不足。" },
  ],
};

export function ResourceRoleQueuePage() {
  const [role, setRole] = useState<QueueRole>("开发人员");
  const [resourceScope, setResourceScope] = useState("全局");
  const [sort, setSort] = useState<"wait" | "time">("wait");
  const [toast, setToast] = useState("");
  const rows = QUEUE_ROWS[role];
  const scopedRole = role === "管理员" && resourceScope !== "全局"
    ? resourceScope.replace("推理资源组", "").replace("训练资源组", "")
    : role;
  const color = scopedRole === "VIP" ? C.purple : scopedRole === "开发人员" ? "#f97316" : scopedRole === "普通用户" ? "#10b981" : scopedRole === "独立机构" ? "#2563eb" : C.primary;
  return (
    <Page section="权限与调度" title="角色队列" actions={<Button onClick={() => setToast("队列状态已刷新")}><RefreshCw size={13} />刷新</Button>}>
      <div className="sa-toolbar" style={{ marginBottom: 12 }}>
        {(Object.keys(QUEUE_ROWS) as QueueRole[]).map(item => (
          <button key={item} type="button" onClick={() => setRole(item)} style={{ height: 32, padding: "0 14px", border: `1px solid ${role === item ? C.primary : C.line}`, borderRadius: 6, background: role === item ? C.primary : "#fff", color: role === item ? "#fff" : C.text2, fontSize: 12.5, cursor: "pointer" }}>{item}</button>
        ))}
      </div>
      <div style={{ marginBottom: 14 }}>
        <Card title={role === "管理员" ? "GPU 占比" : `${role}占用`}>
          <div style={{ minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", gap: 34, flexWrap: "wrap" }}>
            {role === "管理员" && (
              <select aria-label="资源组筛选" value={resourceScope} onChange={event => setResourceScope(event.target.value)} style={{ ...inputStyle, width: 190 }}>
                {["全局", "管理员推理资源组", "VIP推理资源组", "开发人员训练资源组", "普通用户训练资源组", "独立机构训练资源组"].map(item => <option key={item}>{item}</option>)}
              </select>
            )}
            <div style={{ width: 138, height: 138, borderRadius: "50%", background: role === "管理员" && resourceScope === "全局" ? "conic-gradient(#7c3aed 0 10%,#8b5cf6 10% 25%,#f97316 25% 45%,#2563eb 45% 60%,#10b981 60% 75%,#e5e7eb 75% 100%)" : `conic-gradient(${color} 0 75%, #e5e7eb 75% 100%)`, display: "grid", placeItems: "center" }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", textAlign: "center" }}>
                <div><strong style={{ display: "block", fontSize: 23, color: C.text }}>75%</strong><span style={{ fontSize: 11.5, color: C.soft }}>已占用</span></div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12, minWidth: 160 }}>
              {(role === "管理员" && resourceScope === "全局"
                ? [["管理员占用", "10%", "#7c3aed"], ["VIP占用", "15%", "#8b5cf6"], ["开发人员占用", "20%", "#f97316"], ["独立机构占用", "15%", "#2563eb"], ["普通用户占用", "15%", "#10b981"], ["空闲 GPU", "25%", "#cbd5e1"]]
                : [[`${scopedRole}占用`, "75%", color], ["空闲 GPU", "25%", "#cbd5e1"], ["不可用 GPU", "0%", "#6b7280"]]).map(([label, value, dot]) => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "10px 1fr auto", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: dot }} />
                  <span style={{ color: C.muted }}>{label}</span><strong style={{ color: C.text }}>{value}</strong>
                </div>
              ))}
            </div>
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
                  <td style={tdStyle}><Badge tone={row.name.startsWith("VIP") ? "purple" : row.name.startsWith("开发") ? "orange" : row.name.startsWith("普通") ? "green" : "gray"}>{role === "管理员" ? (row.name.startsWith("VIP") ? "VIP" : row.name.startsWith("开发") ? "开发人员" : row.name.startsWith("普通") ? "普通用户" : row.name.startsWith("机构") ? "独立机构" : "管理员") : role}</Badge></td>
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
  const [quota, setQuota] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState<{ type: "create" | "detail" | "toggle" | "delete"; row?: ApiKeyRow } | null>(null);
  const [toast, setToast] = useState("");
  const filtered = rows.filter(row => (!query || `${row.name}${row.owner}${row.quota}`.toLowerCase().includes(query.toLowerCase())) && (!role || row.role === role) && (!quota || row.quota === quota) && (!status || (status === "启用") === row.enabled));
  const close = () => setModal(null);
  return (
    <Page section="统计监控" title="API Key">
      <Card
        title="API Key 列表"
        actions={<div className="sa-toolbar">
          <select aria-label="状态筛选" value={status} onChange={event => setStatus(event.target.value)} style={{ ...inputStyle, minWidth: 120 }}><option value="">全部状态</option><option>启用</option><option>禁用</option></select>
          <Button onClick={() => setToast("API Key 状态已刷新")}><RefreshCw size={13} />刷新</Button>
          <Button primary onClick={() => setModal({ type: "create" })}><Plus size={13} />创建 API Key</Button>
        </div>}
        flush
      >
        <div className="sa-toolbar" style={{ padding: 14, borderBottom: `1px solid ${C.line2}` }}>
          <div style={{ position: "relative" }}><Search size={13} color={C.soft} style={{ position: "absolute", left: 10, top: 10 }} /><input aria-label="搜索 API Key" value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索 Key 名称 / 用户 / 团队" style={{ ...inputStyle, width: 245, paddingLeft: 30 }} /></div>
          <select aria-label="角色筛选" value={role} onChange={e => setRole(e.target.value)} style={{ ...inputStyle, minWidth: 150 }}><option value="">全部角色</option><option>超级管理员</option><option>普通个人用户</option><option>VIP个人用户</option><option>普通机构用户</option><option>机构成员</option></select>
          <select aria-label="额度归属筛选" value={quota} onChange={event => setQuota(event.target.value)} style={{ ...inputStyle, minWidth: 175 }}><option value="">全部额度归属</option><option>个人额度</option><option>研发团队</option><option>测试团队</option><option>政务专项</option></select>
          <Button primary><Search size={13} />查询</Button>
          <Button onClick={() => { setQuery(""); setRole(""); setQuota(""); setStatus(""); }}><RotateCcw size={13} />重置</Button>
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
          <span>共 128 条</span>
          <div className="sa-toolbar"><Button disabled>上一页</Button><Button primary>1</Button><Button>2</Button><Button>下一页</Button></div>
        </div>
      </Card>
      {modal?.type === "create" && (
        <Modal title="创建 API Key" onClose={close} onConfirm={() => { close(); setToast("API Key 创建成功（演示）"); }}>
          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6, fontSize: 12.5 }}>API Key 名称<input placeholder="请输入 API Key 名称" style={inputStyle} /></label>
            <label style={{ display: "grid", gap: 6, fontSize: 12.5 }}>归属用户<input value="admin · 超级管理员" readOnly style={{ ...inputStyle, background: "#f5f7fa", color: C.muted }} /></label>
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
    ? [["GPU 小时", "0"], ["实例小时", "0"], ["活跃实例", "0"], ["活跃用户", "0"]]
    : [["输入 Token 数", "0"], ["输出 Token 数", "0"], ["总 Token 数", "0"], ["API 请求数", "0"], ["使用的模型数", "0"]];
  return (
    <Page section="统计监控" title="用量统计">
      <style>{`
        .sa-usage-tabs{display:inline-flex;border:1px solid #d9dde6;border-radius:6px;overflow:hidden;background:#fff;margin-bottom:14px}
        .sa-usage-tabs button{height:36px;padding:0 18px;border:0;border-right:1px solid #d9dde6;background:#fff;color:#4e5969;cursor:pointer}
        .sa-usage-tabs button:last-child{border-right:0}
        .sa-usage-tabs button.active{background:#165dff;color:#fff}
        .sa-usage-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:14px}
        .sa-usage-metric{background:#fff;border:1px solid #e8ebf2;border-radius:6px;padding:16px}
        .sa-usage-metric b{display:block;font-size:24px;color:#1d2129}
        .sa-usage-metric span{display:block;margin-top:7px;color:#86909c;font-size:12px}
        .sa-usage-chart{background:#fff;border:1px solid #e8ebf2;border-radius:6px;margin-top:14px;overflow:hidden}
        .sa-usage-chart-head{min-height:52px;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #f0f2f7}
        .sa-usage-chart-left{display:flex;align-items:center;gap:10px;font-size:13px}
        .sa-usage-chart-left span{color:#86909c}
        .sa-usage-empty{height:220px;display:grid;place-items:center;color:#86909c;font-size:13px}
        .sa-usage-detail-tabs{display:flex;gap:24px;padding:18px 2px 10px;color:#4e5969;font-size:13px}
        .sa-usage-detail-tabs span.active{color:#165dff;font-weight:650;border-bottom:2px solid #165dff;padding-bottom:9px}
        @media(max-width:900px){.sa-usage-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.sa-usage-chart-head{align-items:flex-start;flex-direction:column}}
      `}</style>
      <div className="sa-usage-tabs">
        {(["总览", "Token", "GPU 实例", "存储", "资源事件"] as UsageTab[]).map(item => <button className={tab === item ? "active" : ""} key={item} type="button" onClick={() => setTab(item)}>{item}</button>)}
      </div>
      {tab === "存储" || tab === "资源事件" ? (
        <Card title={tab === "存储" ? "存储用量" : "资源事件"}>
          <div className="sa-usage-empty">暂无数据</div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="sa-toolbar">
              <div style={{ ...inputStyle, display: "inline-flex", alignItems: "center" }}>2026-06-22 <span style={{ margin: "0 8px", color: C.soft }}>→</span> 2026-07-21</div>
              {tab !== "GPU 实例" && <select aria-label="按模型查询" style={{ ...inputStyle, minWidth: 150 }}><option>按模型查询</option><option>DeepSeek-R1</option><option>Qwen3-32B</option><option>Llama-3.1-70B</option></select>}
              <select aria-label="按用户查询" style={{ ...inputStyle, minWidth: 140 }}><option>按用户查询</option><option>admin</option><option>chenhao</option><option>liuyang</option><option>wangqi</option></select>
              {tab === "GPU 实例"
                ? <select aria-label="按实例查询" style={{ ...inputStyle, minWidth: 160 }}><option>按实例查询</option></select>
                : <select aria-label="按 API Key 查询" style={{ ...inputStyle, minWidth: 170 }}><option>按 API Key 查询</option><option>personal-free-key</option><option>rd-team-key</option><option>org-owner-test-key</option></select>}
              <Button onClick={() => setToast("用量数据已刷新")}><RefreshCw size={13} />刷新</Button>
              <Button onClick={() => setToast("已生成用量导出文件（演示）")}><Download size={13} />导出</Button>
            </div>
          </Card>
          <div className="sa-usage-summary">
            {metrics.map(([label, value]) => <div className="sa-usage-metric" key={label}><b>{value}</b><span>{label}</span></div>)}
          </div>
          <div className="sa-usage-chart">
            <div className="sa-usage-chart-head">
              <div className="sa-usage-chart-left">
                <span>指标</span><b>{tab === "GPU 实例" ? "GPU 小时" : "总 Token 数"}</b>
                <span>分组</span><b>{tab === "GPU 实例" ? "实例类型" : "模型"}</b>
              </div>
              <div className="sa-toolbar">{(tab === "GPU 实例" ? ["按小时", "按天", "按周", "按月"] : ["按天", "按周", "按月"]).map(item => <Button key={item} primary={granularity === item} onClick={() => setGranularity(item)}>{item}</Button>)}</div>
            </div>
            <div className="sa-usage-empty">暂无数据</div>
          </div>
          {tab !== "GPU 实例" && <>
            <div className="sa-usage-detail-tabs"><span>模型</span><span>额度归属</span><span className="active">API 密钥</span></div>
            <Card flush>
              <div className="sa-table-wrap">
                <table>
                  <thead><tr>{["名称", "Key", "额度归属", "使用的模型数", "输入 Token 数", "输出 Token 数", "总 Token 数", "API 请求数", "最后活跃时间"].map(item => <th key={item} style={thStyle}>{item}</th>)}</tr></thead>
                  <tbody><tr><td colSpan={9}><div className="sa-usage-empty" style={{ height: 140 }}>暂无数据</div></td></tr></tbody>
                </table>
              </div>
            </Card>
          </>}
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
  { time: "2026-07-20 19:15:44", requestId: "REQ-20260720-0048", taskId: "TASK-0720-014", task: "政务材料问答调用", queue: "机构共享队列", type: "推理", user: "赵铭", quota: "政务项目组", duration: "1 小时 12 分钟", status: "已完成" },
  { time: "2026-07-19 10:56:40", requestId: "REQ-20260719-0026", taskId: "TASK-0719-008", task: "知识库检索效果评估", queue: "业务评估队列", type: "业务", user: "孙悦", quota: "测试团队", duration: "26 分钟", status: "已完成" },
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
    <Page section="统计监控" title="任务日志">
      <style>{`
        .sa-log-filters{display:grid;grid-template-columns:minmax(260px,1.8fr) minmax(140px,1fr) minmax(140px,1fr) auto;gap:12px;align-items:end;padding:16px}
        .sa-log-field label{display:block;margin-bottom:6px;color:#4e5969;font-size:12px}
        .sa-log-field input,.sa-log-field select{width:100%}
        .sa-log-date{padding:0 16px 16px}
        .sa-log-static{height:34px;display:inline-flex;align-items:center;border:1px solid #e0e3ed;border-radius:6px;padding:0 10px;color:#374151;font-size:12.5px;background:#fff}
        .sa-log-title{min-height:50px;padding:0 16px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f0f2f7;border-bottom:1px solid #f0f2f7}
        .sa-log-task-main{display:block;font-weight:650;color:#1d2129}
        .sa-log-task-sub{display:block;margin-top:3px;color:#86909c;font-size:11px}
        @media(max-width:900px){.sa-log-filters{grid-template-columns:1fr 1fr}.sa-log-filter-actions{grid-column:1/-1}}
      `}</style>
      <Card flush>
        <div className="sa-log-filters">
          <div className="sa-log-field"><label>关键词</label><input aria-label="关键词" value={query} onChange={e => setQuery(e.target.value)} placeholder="任务名称 / 任务 ID / 请求 ID / 用户" style={inputStyle} /></div>
          <div className="sa-log-field"><label>执行状态</label><select aria-label="执行状态" value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}><option value="">全部状态</option><option>执行中</option><option>已完成</option><option>失败</option></select></div>
          <div className="sa-log-field"><label>任务类型</label><select aria-label="任务类型" value={type} onChange={e => setType(e.target.value)} style={inputStyle}><option value="">全部类型</option><option>评测</option><option>训练</option><option>推理</option><option>调用</option></select></div>
          <div className="sa-toolbar sa-log-filter-actions"><Button primary><Search size={13} />搜索</Button><Button onClick={() => { setQuery(""); setStatus(""); setType(""); }}><RotateCcw size={13} />重置</Button></div>
        </div>
        <div className="sa-log-date"><div className="sa-log-field"><label>日志日期</label><div className="sa-log-static">2026/07/15 - 2026/07/21</div></div></div>
        <div className="sa-log-title"><b>实时日志</b><Button onClick={() => setToast("任务日志已刷新")}><RefreshCw size={13} />刷新</Button></div>
          <div className="sa-table-wrap">
            <table>
              <thead><tr>{["日志时间", "请求 ID", "任务 ID", "任务名称", "任务类型", "提交用户", "额度归属", "运行时长", "执行状态", "操作"].map(item => <th key={item} style={thStyle}>{item}</th>)}</tr></thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.requestId}>
                    <td style={tdStyle}>{row.time}</td><td style={tdStyle}>{row.requestId}</td><td style={tdStyle}>{row.taskId}</td>
                    <td style={tdStyle}><span className="sa-log-task-main">{row.task}</span><span className="sa-log-task-sub">{row.queue}</span></td>
                    <td style={tdStyle}>{row.type}</td><td style={tdStyle}>{row.user}</td><td style={tdStyle}>{row.quota}</td><td style={tdStyle}>{row.duration}</td>
                    <td style={tdStyle}><Badge tone={row.status === "已完成" ? "green" : row.status === "失败" ? "red" : "orange"}>{row.status}</Badge></td>
                    <td style={tdStyle}><LinkButton onClick={() => setDetail(row)}>查看结果</LinkButton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        <div style={{ padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.line2}`, fontSize: 12, color: C.soft }}>
          <span>共 24 条</span><div className="sa-toolbar"><Button disabled>上一页</Button><Button primary>1</Button><Button>2</Button><Button>下一页</Button></div>
        </div>
      </Card>
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

interface DocNavItem {
  id: string;
  label: string;
}

interface DocNavGroup {
  group: string;
  items: DocNavItem[];
}

const DOC_GROUPS: DocNavGroup[] = [
  { group: "关于", items: [{ id: "about-whitepaper", label: "技术白皮书" }] },
  { group: "快速入门", items: [
    { id: "quickstart", label: "第一个完整流程" },
    { id: "quickstart-model", label: "选择模型" },
    { id: "quickstart-train", label: "配置训练" },
    { id: "quickstart-eval", label: "评估结果" },
  ] },
  { group: "功能指南", items: [
    { id: "guide-submit", label: "提交训练任务" },
    { id: "guide-sd", label: "StableDiffusion 微调" },
    { id: "guide-progress", label: "查询训练进度" },
  ] },
  { group: "API参考", items: [
    { id: "api-autoregressive", label: "自回归预训练框架" },
    { id: "api-seq2seq", label: "序列到序列预训练框架" },
    { id: "api-text-image", label: "文-图生成训练框架" },
    { id: "api-distributed", label: "拓扑与资源感知的分布式训练" },
    { id: "api-sft", label: "有监督的微调框架" },
    { id: "api-rl", label: "强化学习框架" },
    { id: "api-eval", label: "模型测评框架" },
  ] },
  { group: "模型架构详解", items: [
    { id: "about-architecture", label: "系统架构概览" },
    { id: "model-architecture", label: "总体架构" },
    { id: "model-autoregressive", label: "自回归预训练框架" },
    { id: "model-relation", label: "RelationNetwork 架构" },
  ] },
  { group: "算法原理", items: [
    { id: "algo-gcn", label: "GCN 图卷积网络" },
    { id: "algo-graph2vec", label: "Graph2Vec 图表示" },
    { id: "algo-rlhf", label: "RM / DPO 对齐算法" },
  ] },
  { group: "开发指南", items: [
    { id: "dev-auth", label: "认证与权限" },
    { id: "dev-python", label: "Python API" },
    { id: "dev-relation", label: "RelationNetwork 五分类案例" },
    { id: "dev-dataset", label: "自定义数据集" },
  ] },
  { group: "代码示例库", items: [
    { id: "code-library", label: "多语言调用示例" },
    { id: "code-python", label: "Python 脚本" },
    { id: "code-notebook", label: "Jupyter Notebook" },
  ] },
  { group: "常见问题", items: [
    { id: "faq-quota", label: "额度与权限" },
    { id: "faq-errors", label: "错误码排查" },
  ] },
];

const DOC_LOOKUP = new Map(
  DOC_GROUPS.flatMap(group => group.items.map(item => [item.id, { ...item, group: group.group }]))
);

const quickStartCode = `POST /v1/train/tasks
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "model_name": "stable-diffusion-xl",
  "dataset_path": "oss://demo/stable-diffusion/custom-dataset",
  "task_type": "text_to_image_finetune"
}`;

const notebookCells = [
  {
    title: "Cell 1：配置自定义数据集",
    code: `dataset_path = "oss://demo/stable-diffusion/custom-dataset"
client = MaasClient(api_key="YOUR_API_KEY")`,
  },
  {
    title: "Cell 2：提交 StableDiffusion 微调任务",
    code: `task = client.train.create(
    model_name="stable-diffusion-xl",
    dataset_path=dataset_path,
    task_type="text_to_image_finetune"
)`,
  },
  {
    title: "Cell 3：查询进度并获取最终模型",
    code: `status = client.train.status(task.id)
final_model = client.models.get(status.output_model)`,
  },
];

function DocArticle({
  selectedId,
  onCopy,
}: {
  selectedId: string;
  onCopy: (text: string) => void;
}) {
  const current = DOC_LOOKUP.get(selectedId) ?? DOC_LOOKUP.get("quickstart")!;
  const isQuickStart = selectedId === "quickstart";
  const isApi = current.group === "API参考" || current.group === "开发指南";
  const title = isQuickStart ? "快速入门：完成第一个训练任务" : `${current.group}：${current.label}`;
  const genericCode = isApi
    ? `from maas import MaasClient

client = MaasClient(api_key="YOUR_API_KEY")
task = client.train.create(
    framework="${current.label}",
    dataset_path="oss://demo/dataset",
    resource_group="developer-training"
)
print(task.id, task.status)`
    : `# ${current.label}
model = client.models.get("qwen3-32b")
result = model.run(dataset="oss://demo/dataset")
print(result.status)`;

  return (
    <div className="sa-doc-shell">
      <div className="sa-doc-md-bar">
        <b>{title}</b>
        <button type="button" onClick={() => onCopy(`# ${title}`)}>复制 MD</button>
      </div>
      <div className="sa-doc-md-body">
        <article className="sa-doc-article">
          <div className="sa-doc-hero">
            <h2>{title}</h2>
            <div className="sa-doc-meta">
              <Badge>{current.group}</Badge>
              <Badge>API 调用</Badge>
              <Badge>Jupyter Notebook</Badge>
            </div>
          </div>
          {isQuickStart ? (
            <>
              <div className="sa-doc-anchors">
                {["1. 选择模型", "2. 提交微调", "3. 获取模型"].map(item => <div key={item}><b>{item}</b></div>)}
              </div>
              <section className="sa-doc-section">
                <h3>准备 API Key</h3>
                <div className="sa-doc-code-head"><b>创建训练任务</b><Button onClick={() => onCopy(quickStartCode)}>一键复制</Button></div>
                <pre className="sa-doc-code">{quickStartCode}</pre>
              </section>
              <section className="sa-doc-section">
                <h3>在 Notebook 中运行</h3>
                <div className="sa-doc-notebook">
                  {notebookCells.map(cell => (
                    <div className="sa-doc-cell" key={cell.title}>
                      <b>{cell.title}</b>
                      <pre className="sa-doc-code">{cell.code}</pre>
                    </div>
                  ))}
                </div>
                <div className="sa-doc-tip">预期结果：Notebook 返回 task_id、运行状态、训练日志摘要和评估报告地址。</div>
              </section>
            </>
          ) : (
            <>
              <section className="sa-doc-section">
                <h3>{current.label}</h3>
                <p>
                  本文说明 MaaS 平台中“{current.label}”的适用场景、配置方法和运行结果。
                  任务提交后会经过身份认证、资源校验、队列调度和产物归档。
                </p>
                <table className="sa-doc-lite-table">
                  <tbody>
                    <tr><td>所属模块</td><td>{current.group}</td></tr>
                    <tr><td>适用角色</td><td>管理员、开发人员、普通用户</td></tr>
                    <tr><td>资源范围</td><td>按绑定资源组和额度归属校验</td></tr>
                  </tbody>
                </table>
              </section>
              <section className="sa-doc-section">
                <div className="sa-doc-code-head"><b>调用示例</b><Button onClick={() => onCopy(genericCode)}>一键复制</Button></div>
                <pre className="sa-doc-code">{genericCode}</pre>
              </section>
            </>
          )}
        </article>
      </div>
    </div>
  );
}

export function DocumentationCenterPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("quickstart");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = DOC_GROUPS.flatMap(group =>
    group.items
      .filter(item => !normalizedQuery || `${group.group}${item.label}`.toLowerCase().includes(normalizedQuery))
      .map(item => ({ ...item, group: group.group }))
  );
  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text);
    setToast("内容已复制");
  };
  const selectDoc = (id: string) => {
    setSelectedId(id);
    setQuery("");
  };
  return (
    <Page section="文档中心" title="文档中心">
      <style>{`
        .sa-doc-console{background:#f5f7fa;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
        .sa-doc-preview{background:#fff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
        .sa-doc-preview-top{min-height:64px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:0 18px;background:#fff}
        .sa-doc-search-wrap{position:relative}
        .sa-doc-search{width:420px;height:38px;border:1px solid #d9dde6;border-radius:7px;padding:0 42px 0 14px;color:#1d2129;font:inherit;background:#fff;outline:none}
        .sa-doc-search:focus{border-color:#4f6ef7;box-shadow:0 0 0 2px rgba(79,110,247,.1)}
        .sa-doc-search-icon{position:absolute;right:13px;top:50%;transform:translateY(-50%);color:#4e5969;pointer-events:none}
        .sa-doc-search-results{position:absolute;right:0;top:42px;width:520px;max-height:320px;overflow:auto;background:#fff;border:1px solid #d9dde6;border-radius:6px;box-shadow:0 10px 28px rgba(29,33,41,.14);z-index:8;padding:8px}
        .sa-doc-result{display:block;width:100%;padding:10px 12px;text-align:left;border:0;border-bottom:1px solid #eef0f4;background:#fff;cursor:pointer;border-radius:4px}
        .sa-doc-result:hover{background:#f0f7ff}
        .sa-doc-result b{display:block;color:#1d2129}
        .sa-doc-result span{display:block;margin-top:4px;color:#86909c;font-size:12px}
        .sa-doc-preview-body{display:grid;grid-template-columns:260px minmax(0,1fr);min-height:720px;background:#f5f7fa}
        .sa-doc-tree{border-right:1px solid #e5e7eb;padding:18px 14px;background:#fafbfc;overflow:auto}
        .sa-doc-tree-head{height:34px;display:flex;align-items:center;font-size:16px;font-weight:650;margin-bottom:8px;color:#1d2129}
        .sa-doc-tree-group{margin-bottom:6px}
        .sa-doc-tree-toggle{width:100%;height:32px;display:flex;align-items:center;padding:0 8px;border:0;background:transparent;color:#1d2129;cursor:pointer;font:inherit;font-weight:650;text-align:left}
        .sa-doc-tree-children{padding-left:18px}
        .sa-doc-tree-item{width:100%;min-height:30px;display:flex;align-items:center;padding:5px 8px;border:0;border-radius:4px;background:transparent;color:#4e5969;font:inherit;font-size:13px;text-align:left;cursor:pointer}
        .sa-doc-tree-item.active{background:#e8f1ff;color:#165dff;font-weight:650;border-left:3px solid #165dff;padding-left:7px}
        .sa-doc-content{padding:18px 20px;min-width:0}
        .sa-doc-shell{background:#fff;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
        .sa-doc-md-bar{min-height:52px;padding:0 16px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;gap:12px;color:#344054}
        .sa-doc-md-bar button{border:0;background:transparent;color:#4f46e5;font:inherit;font-weight:650;cursor:pointer}
        .sa-doc-md-body{padding:24px 30px}
        .sa-doc-article{border:1px solid #e5e7eb;border-radius:6px;padding:24px 30px;color:#1d2129;background:#fff}
        .sa-doc-hero h2{margin:0 0 14px;font-size:25px}
        .sa-doc-meta{display:flex;gap:10px;flex-wrap:wrap}
        .sa-doc-anchors{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:24px 0 6px}
        .sa-doc-anchors>div{height:62px;border:1px solid #d9dde6;border-radius:6px;display:flex;align-items:center;padding:0 18px}
        .sa-doc-section{margin-top:18px}
        .sa-doc-section h3{font-size:18px;margin:0 0 14px}
        .sa-doc-section p{color:#4e5969;line-height:1.8}
        .sa-doc-code-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
        .sa-doc-code{margin:0;border-radius:6px;padding:18px 20px;background:#111827;color:#e5e7eb;font-family:"SFMono-Regular",Consolas,monospace;font-size:12.5px;line-height:1.85;white-space:pre-wrap;overflow:auto}
        .sa-doc-notebook{border:1px solid #d9dde6;border-radius:6px;padding:12px;background:#fafbfc}
        .sa-doc-cell{border:1px solid #e5e7eb;border-radius:6px;margin-bottom:10px;background:#fff;overflow:hidden}
        .sa-doc-cell:last-child{margin-bottom:0}
        .sa-doc-cell>b{display:block;padding:10px 12px;border-bottom:1px solid #e5e7eb}
        .sa-doc-cell .sa-doc-code{border-radius:0}
        .sa-doc-tip{margin-top:12px;padding:12px;border:1px solid #bedaff;background:#f0f7ff;border-radius:6px;color:#4e5969;font-size:13px}
        .sa-doc-lite-table{width:100%;border-collapse:collapse;margin-top:14px}
        .sa-doc-lite-table td{padding:11px 12px;border:1px solid #e5e7eb;font-size:13px}
        .sa-doc-lite-table td:first-child{width:150px;background:#fafbfc;font-weight:650}
        @media(max-width:900px){
          .sa-doc-preview-top{align-items:flex-start;flex-direction:column;padding:14px}
          .sa-doc-search-wrap,.sa-doc-search{width:100%}
          .sa-doc-search-results{left:0;right:auto;width:100%}
          .sa-doc-preview-body{grid-template-columns:1fr}
          .sa-doc-tree{border-right:0;border-bottom:1px solid #e5e7eb;max-height:260px}
          .sa-doc-md-body,.sa-doc-article{padding:16px}
          .sa-doc-anchors{grid-template-columns:1fr}
        }
      `}</style>
      <div className="sa-doc-console">
        <div className="sa-doc-preview">
          <div className="sa-doc-preview-top">
            <strong>文档目录与正文</strong>
            <div className="sa-doc-search-wrap">
              <input
                className="sa-doc-search"
                aria-label="搜索文档"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="请输入产品、文档关键词"
              />
              <Search className="sa-doc-search-icon" size={17} />
              {normalizedQuery && (
                <div className="sa-doc-search-results">
                  {searchResults.length ? searchResults.map(item => (
                    <button className="sa-doc-result" type="button" key={item.id} onClick={() => selectDoc(item.id)}>
                      <b>{item.label}</b><span>{item.group}</span>
                    </button>
                  )) : <div style={{ padding: 18, color: C.soft, fontSize: 13 }}>没有匹配的文档</div>}
                </div>
              )}
            </div>
          </div>
          <div className="sa-doc-preview-body">
            <aside className="sa-doc-tree">
              <div className="sa-doc-tree-head">文档目录</div>
              {DOC_GROUPS.map(group => {
                const isCollapsed = collapsed.has(group.group);
                return (
                  <div className="sa-doc-tree-group" key={group.group}>
                    <button
                      className="sa-doc-tree-toggle"
                      type="button"
                      onClick={() => setCollapsed(previous => {
                        const next = new Set(previous);
                        next.has(group.group) ? next.delete(group.group) : next.add(group.group);
                        return next;
                      })}
                    >
                      {isCollapsed ? "▸" : "▾"}&nbsp;{group.group}
                    </button>
                    {!isCollapsed && (
                      <div className="sa-doc-tree-children">
                        {group.items.map(item => (
                          <button
                            className={`sa-doc-tree-item ${selectedId === item.id ? "active" : ""}`}
                            key={item.id}
                            type="button"
                            onClick={() => selectDoc(item.id)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </aside>
            <section className="sa-doc-content">
              <DocArticle selectedId={selectedId} onCopy={copy} />
            </section>
          </div>
        </div>
      </div>
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
  const [detailLanguage, setDetailLanguage] = useState("Python");
  const [toast, setToast] = useState("");
  const filtered = useMemo(() => SAMPLES.filter(item => (!framework || item.framework === framework) && (!language || item.language === language) && (!scene || item.scene === scene)), [framework, language, scene]);
  const detailCode = detailLanguage === "cURL"
    ? `curl -X POST /v1/train/tasks \\
  -H "Authorization: Bearer <API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{"framework":"${detail?.framework ?? "PyTorch Geometric"}","dataset":"cora"}'`
    : `from maas import MaasClient

client = MaasClient(api_key="YOUR_API_KEY")
job = client.training.create(
    name="${detail?.title ?? "GCN 论文分类"}",
    framework="${detail?.framework ?? "PyTorch Geometric"}",
    dataset="cora"
)
print(job.id)`;
  return (
    <Page
      section="文档中心"
      title={detail ? detail.title : "开发示例代码库"}
      description={detail ? "代码详情页面，支持多语言示例、Notebook 预览、复制代码和下载完整示例项目。" : "提供覆盖典型图学习应用场景的可运行代码示例，降低二次开发难度。"}
      actions={detail
        ? <Button onClick={() => setDetail(null)}>返回示例库</Button>
        : <Button primary onClick={() => setToast("示例代码包已生成（演示）")}><Download size={13} />一键下载示例代码包</Button>}
    >
      <style>{`
        .sa-repo-shell{display:grid;grid-template-columns:240px minmax(0,1fr);gap:14px}
        .sa-repo-side{background:#fff;border:1px solid #e8ebf2;border-radius:6px;padding:14px}
        .sa-repo-side-title{font-weight:650;padding:4px 6px 12px;border-bottom:1px solid #f0f2f7;margin-bottom:10px}
        .sa-repo-tree-group{margin-bottom:14px}
        .sa-repo-tree-head{font-size:13px;font-weight:650;color:#1d2129;padding:5px 7px}
        .sa-repo-tree-item{font-size:12.5px;color:#4e5969;padding:7px 9px;border-radius:4px}
        .sa-repo-tree-item.active{background:#e8f1ff;color:#165dff;border-left:3px solid #165dff;padding-left:6px}
        .sa-repo-main{min-width:0}
        .sa-repo-filter{background:#fff;border:1px solid #e8ebf2;border-radius:6px;padding:14px;margin-bottom:14px}
        .sa-repo-filter-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:12px;align-items:end}
        .sa-repo-field label{display:block;font-size:12px;color:#4e5969;margin-bottom:6px}
        .sa-repo-field select{width:100%;height:36px;border:1px solid #d9dde6;border-radius:6px;padding:0 10px;background:#fff;color:#4e5969}
        .sa-repo-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .sa-repo-card{min-height:150px;background:#fff;border:1px solid #e8ebf2;border-radius:6px;padding:16px;text-align:left;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between}
        .sa-repo-card:hover{border-color:#8fb1ff;box-shadow:0 6px 18px rgba(22,93,255,.08)}
        .sa-repo-card h3{margin:0 0 8px;font-size:16px;color:#1d2129}
        .sa-repo-card p{margin:0;color:#4e5969;font-size:13px;line-height:1.7}
        .sa-repo-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:12px}
        .sa-repo-detail-head{background:#fff;border:1px solid #e8ebf2;border-radius:6px;padding:16px;margin-bottom:14px}
        .sa-repo-detail-head h2{margin:0 0 8px;font-size:20px}
        .sa-repo-detail-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px;border-top:1px solid #f0f2f7;padding-top:14px}
        .sa-repo-language{display:inline-flex;border:1px solid #d9dde6;border-radius:6px;overflow:hidden;background:#fff}
        .sa-repo-language button{height:34px;border:0;border-right:1px solid #d9dde6;background:#fff;padding:0 16px;cursor:pointer;color:#4e5969}
        .sa-repo-language button:last-child{border-right:0}
        .sa-repo-language button.active{background:#165dff;color:#fff}
        .sa-repo-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .sa-repo-code-card,.sa-repo-notebook-card{background:#fff;border:1px solid #e8ebf2;border-radius:6px;padding:16px}
        .sa-repo-code-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .sa-repo-code{margin:0;background:#111827;color:#e5e7eb;border-radius:6px;padding:14px;font-family:"SFMono-Regular",Consolas,monospace;font-size:12px;line-height:1.8;min-height:260px;white-space:pre-wrap;overflow:auto}
        .sa-repo-cell{border:1px solid #d9dde6;border-radius:6px;margin-bottom:10px;background:#fafbfc}
        .sa-repo-cell b{display:block;padding:10px 12px;border-bottom:1px solid #e8ebf2}
        .sa-repo-cell p{margin:0;padding:10px 12px;color:#4e5969;line-height:1.7;font-size:13px}
        .sa-repo-result{border:1px solid #bedaff;background:#f0f7ff;border-radius:6px;padding:12px;color:#4e5969;font-size:13px;line-height:1.7}
        @media(max-width:900px){
          .sa-repo-shell,.sa-repo-detail-grid{grid-template-columns:1fr}
          .sa-repo-side{max-height:260px;overflow:auto}
          .sa-repo-filter-grid{grid-template-columns:1fr 1fr}
          .sa-repo-cards{grid-template-columns:1fr}
        }
      `}</style>
      {detail ? (
        <>
          <div className="sa-repo-detail-head">
            <h2>{detail.title}</h2>
            <p style={{ color: C.muted, margin: 0, lineHeight: 1.7 }}>{detail.description}</p>
            <div className="sa-repo-tags"><Badge>{detail.framework}</Badge><Badge tone="green">{detail.language}</Badge><Badge tone="gray">{detail.scene}</Badge></div>
            <div className="sa-repo-detail-actions">
              <div className="sa-repo-language">
                {["Python", "cURL", "Notebook"].map(item => <button className={detailLanguage === item ? "active" : ""} key={item} type="button" onClick={() => setDetailLanguage(item)}>{item}</button>)}
              </div>
              <Button primary onClick={() => setToast("完整示例项目已生成（演示）")}><Download size={13} />下载项目</Button>
            </div>
          </div>
          <div className="sa-repo-detail-grid">
            <div className="sa-repo-code-card">
              <div className="sa-repo-code-head"><b>{detailLanguage} 示例</b><Button onClick={() => { void navigator.clipboard?.writeText(detailCode); setToast("代码已复制"); }}><Copy size={13} />复制代码</Button></div>
              <pre className="sa-repo-code">{detailCode}</pre>
            </div>
            <div className="sa-repo-notebook-card">
              <b style={{ display: "block", marginBottom: 12 }}>Notebook 预览</b>
              {[
                ["步骤 1：初始化环境", "安装 SDK，配置 API Key，设置训练框架和默认资源队列。"],
                ["步骤 2：加载数据集", "加载 Cora 数据集，检查节点、边和标签分布。"],
                ["步骤 3：创建并运行任务", `使用 ${detail.framework} 构建任务，提交后持续查询运行状态。`],
              ].map(([title, text]) => <div className="sa-repo-cell" key={title}><b>{title}</b><p>{text}</p></div>)}
              <div className="sa-repo-result">运行结果：返回任务 ID、训练指标、模型产物地址和可下载评测报告。</div>
            </div>
          </div>
        </>
      ) : (
        <div className="sa-repo-shell">
          <aside className="sa-repo-side">
            <div className="sa-repo-side-title">文档树形导航</div>
            {[["图学习入门", ["基于 GCN 的论文分类", "GraphSAGE 节点分类", "GAT 引文网络分类"]], ["图表示学习", ["使用 Graph2Vec 进行图相似度计算", "DeepWalk 节点表示学习", "图聚类与可视化"]], ["工程化运行", ["自定义数据集接入", "训练任务 API 提交", "批量评测与报告导出"]]].map(([group, items], groupIndex) => (
              <div className="sa-repo-tree-group" key={group as string}>
                <div className="sa-repo-tree-head">{group}</div>
                {(items as string[]).map((item, itemIndex) => <div className={`sa-repo-tree-item ${groupIndex === 0 && itemIndex === 0 ? "active" : ""}`} key={item}>{item}</div>)}
              </div>
            ))}
          </aside>
          <section className="sa-repo-main">
            <div className="sa-repo-filter">
              <div className="sa-repo-filter-grid">
                <div className="sa-repo-field"><label>训练框架</label><select aria-label="训练框架" value={framework} onChange={event => setFramework(event.target.value)}><option value="">全部框架</option>{Array.from(new Set(SAMPLES.map(item => item.framework))).map(item => <option key={item}>{item}</option>)}</select></div>
                <div className="sa-repo-field"><label>编程语言</label><select aria-label="编程语言" value={language} onChange={event => setLanguage(event.target.value)}><option value="">全部语言</option>{Array.from(new Set(SAMPLES.map(item => item.language))).map(item => <option key={item}>{item}</option>)}</select></div>
                <div className="sa-repo-field"><label>应用场景</label><select aria-label="应用场景" value={scene} onChange={event => setScene(event.target.value)}><option value="">全部场景</option>{Array.from(new Set(SAMPLES.map(item => item.scene))).map(item => <option key={item}>{item}</option>)}</select></div>
                <div className="sa-toolbar"><Button primary><Search size={13} />筛选</Button><Button onClick={() => { setFramework(""); setLanguage(""); setScene(""); }}><RotateCcw size={13} />重置</Button></div>
              </div>
            </div>
            <div className="sa-repo-cards">
              {filtered.map(item => (
                <button className="sa-repo-card" key={item.title} type="button" onClick={() => { setDetail(item); setDetailLanguage("Python"); }}>
                  <div><h3>{item.title}</h3><p><b>问题描述：</b>{item.description}<br /><b>实现思路：</b>加载示例数据，创建训练任务并输出运行结果。</p></div>
                  <div className="sa-repo-tags"><Badge>{item.framework}</Badge><Badge tone="green">{item.language}</Badge><Badge tone="gray">{item.scene}</Badge></div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
      {toast && <Toast text={toast} onClose={() => setToast("")} />}
    </Page>
  );
}
