import { useState } from "react";
import { Search, RotateCcw, Plus, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

interface UserRow {
  id: number;
  account: string;
  name: string;
  team: string;
  roles: string[];
  status: "正常" | "禁用";
  createdAt: string;
  addType: string;
}

const TEAM_OPTIONS = ["无团队", "智谱1", "企业2", "机构3", "企业4"];
const TEAM_FILTER_OPTIONS = ["全部", "智谱1", "企业2", "机构3", "企业4", "无团队"];
const ROLE_OPTIONS = ["超级管理员", "空间管理员", "空间成员", "普通用户", "VIP用户", "普通机构用户", "VIP机构用户", "政府用户"];
const ROLE_FILTER_OPTIONS = ["全部", ...ROLE_OPTIONS];
const STATUS_OPTIONS = ["全部", "正常", "禁用"];

const ALL_USERS: UserRow[] = [
  { id: 1,     account: "admin",            name: "admin",                    team: "系统",   roles: ["超级管理员"],                     status: "正常", createdAt: "2025-06-28 10:11:27", addType: "系统创建" },
  { id: 10000, account: "testuser1",        name: "testuser1@demo.com",       team: "智谱1",  roles: ["空间管理员"],                     status: "正常", createdAt: "2025-06-19 14:11:45", addType: "手动创建" },
  { id: 10001, account: "xun.wu",           name: "xun.wu@aminer.cn",         team: "智谱1",  roles: ["普通用户", "VIP用户"],            status: "正常", createdAt: "2025-06-19 18:03:16", addType: "手动创建" },
  { id: 10002, account: "xiao.liu",         name: "xiao001.liu@aminer.cn",    team: "企业2",  roles: ["普通机构用户"],                   status: "正常", createdAt: "2025-06-19 18:03:54", addType: "手动创建" },
  { id: 10003, account: "qixiang.ding",     name: "qixiang.ding@aminer.cn",   team: "企业2",  roles: ["VIP机构用户"],                    status: "正常", createdAt: "2025-06-23 11:18:12", addType: "手动创建" },
  { id: 10004, account: "zhonghua.zhang",   name: "zhonghua.zhang@aminer.cn", team: "机构3",  roles: ["政府用户"],                       status: "正常", createdAt: "2025-06-23 23:23:08", addType: "手动创建" },
  { id: 10005, account: "jiahe.zhang",      name: "jiahe.zhang@aminer.cn",    team: "企业4",  roles: ["普通机构用户"],                   status: "正常", createdAt: "2025-06-23 11:25:18", addType: "手动创建" },
  { id: 10006, account: "xiang.chen",       name: "xyyght8126.com",           team: "无团队", roles: ["普通用户"],                       status: "正常", createdAt: "2025-06-23 11:26:56", addType: "手动创建" },
  { id: 10007, account: "jiaqi.song",       name: "jiaqi.song@aminer.cn",     team: "智谱1",  roles: ["空间成员"],                       status: "正常", createdAt: "2025-06-23 11:28:29", addType: "手动创建" },
  { id: 10008, account: "yan.sun",          name: "yan.sun@aminer.cn",        team: "无团队", roles: ["普通用户"],                       status: "禁用", createdAt: "2025-06-24 10:30:00", addType: "手动创建" },
  { id: 10009, account: "xiaoyu.xiang",     name: "xiaoyu.xiang@aminer.cn",   team: "智谱1",  roles: ["VIP用户"],                        status: "正常", createdAt: "2025-06-23 11:31:48", addType: "手动创建" },
  { id: 10010, account: "ming.li",          name: "ming.li@aminer.cn",        team: "企业2",  roles: ["普通机构用户", "VIP机构用户"],    status: "正常", createdAt: "2025-06-24 09:05:00", addType: "手动创建" },
  { id: 10011, account: "fang.wang",        name: "fang.wang@aminer.cn",      team: "机构3",  roles: ["政府用户"],                       status: "禁用", createdAt: "2025-06-24 09:20:00", addType: "手动创建" },
  { id: 10012, account: "lei.zhao",         name: "lei.zhao@aminer.cn",       team: "企业4",  roles: ["空间成员", "普通用户"],           status: "正常", createdAt: "2025-06-24 10:00:00", addType: "手动创建" },
];

const TOTAL_COUNT = 141;

// ─── Shared styles ────────────────────────────────────────────────────────────

const tagStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 12,
  padding: "2px 8px",
  borderRadius: 4,
  background: "#eff4ff",
  color: "#4f6ef7",
  whiteSpace: "nowrap",
};

// ─── Confirm Modal (reset password / delete) ──────────────────────────────────

function ConfirmModal({
  title,
  message,
  confirmColor = "#4f6ef7",
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmColor?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 420, background: "#fff", borderRadius: 16, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
      }}>
        <div style={{ padding: "24px 28px 8px", fontSize: 17, fontWeight: 700, color: "#1a1d23" }}>{title}</div>
        <div style={{ padding: "8px 28px 28px", fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>{message}</div>
        <div className="flex items-center justify-end gap-3" style={{ padding: "0 28px 24px" }}>
          <button onClick={onClose}
            style={{ fontSize: 14, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, padding: "9px 24px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={onConfirm}
            style={{ fontSize: 14, fontWeight: 500, color: "#fff", background: confirmColor, border: "none", borderRadius: 8, padding: "9px 24px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = confirmColor === "#4f6ef7" ? "#3b5de8" : "#dc2626")}
            onMouseLeave={e => (e.currentTarget.style.background = confirmColor)}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── User Form Modal (create / edit) ──────────────────────────────────────────

interface UserFormData {
  account: string;
  name: string;
  phone: string;
  email: string;
  team: string;
  roles: string[];
  status: "正常" | "禁用";
}

function UserFormModal({
  mode,
  initial,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  initial?: UserRow;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
}) {
  const [account, setAccount] = useState(initial?.account ?? "");
  const [name, setName]       = useState(initial?.name ?? "");
  const [phone, setPhone]     = useState("");
  const [email, setEmail]     = useState("");
  const [team, setTeam]       = useState(initial?.team ?? "无团队");
  const [roles, setRoles]     = useState<string[]>(initial?.roles ?? []);
  const [status, setStatus]   = useState<"正常" | "禁用">(initial?.status ?? "正常");
  const [errors, setErrors]   = useState<Record<string, boolean>>({});

  const title       = mode === "create" ? "创建用户账号" : "编辑用户账号";
  const submitText  = mode === "create" ? "确定" : "保存";

  const toggleRole = (role: string) => {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!account.trim()) e.account = true;
    if (!name.trim())    e.name    = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit({ account: account.trim(), name: name.trim(), phone: phone.trim(), email: email.trim(), team, roles, status });
    onClose();
  };

  const inputSt = (hasErr: boolean): React.CSSProperties => ({
    width: "100%", height: 36, padding: "0 12px", fontSize: 13,
    border: `1px solid ${hasErr ? "#ef4444" : "#e0e3ed"}`, borderRadius: 8,
    outline: "none", background: "#fff", boxSizing: "border-box" as const, color: "#1a1d23",
  });

  const labelSt: React.CSSProperties = { width: 80, fontSize: 13, fontWeight: 500, color: "#374151", textAlign: "right", flexShrink: 0 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 520, maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 16, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
      }}>
        {/* Title */}
        <div className="flex items-center justify-between" style={{ padding: "24px 28px 0" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1d23" }}>{title}</span>
          <X size={18} color="#9ca3af" style={{ cursor: "pointer" }} onClick={onClose} />
        </div>

        {/* Form */}
        <div style={{ padding: "20px 28px" }}>
          {/* 账号 */}
          <div className="flex items-start gap-3" style={{ marginBottom: 16 }}>
            <div style={{ ...labelSt, paddingTop: 8 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>账号</div>
            <div style={{ flex: 1 }}>
              <input value={account} placeholder="请输入账号"
                onChange={e => { setAccount(e.target.value); setErrors(p => ({ ...p, account: false })); }}
                style={inputSt(errors.account)} />
              {errors.account && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入账号</div>}
            </div>
          </div>

          {/* 姓名 */}
          <div className="flex items-start gap-3" style={{ marginBottom: 16 }}>
            <div style={{ ...labelSt, paddingTop: 8 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>姓名</div>
            <div style={{ flex: 1 }}>
              <input value={name} placeholder="请输入姓名"
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
                style={inputSt(errors.name)} />
              {errors.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入姓名</div>}
            </div>
          </div>

          {/* 手机号 */}
          <div className="flex items-start gap-3" style={{ marginBottom: 16 }}>
            <div style={{ ...labelSt, paddingTop: 8 }}>手机号</div>
            <div style={{ flex: 1 }}>
              <input value={phone} placeholder="请输入手机号" onChange={e => setPhone(e.target.value)} style={inputSt(false)} />
            </div>
          </div>

          {/* 邮箱 */}
          <div className="flex items-start gap-3" style={{ marginBottom: 16 }}>
            <div style={{ ...labelSt, paddingTop: 8 }}>邮箱</div>
            <div style={{ flex: 1 }}>
              <input value={email} placeholder="请输入邮箱" onChange={e => setEmail(e.target.value)} style={inputSt(false)} />
            </div>
          </div>

          {/* 所属团队 */}
          <div className="flex items-start gap-3" style={{ marginBottom: 16 }}>
            <div style={{ ...labelSt, paddingTop: 8 }}>所属团队</div>
            <div style={{ flex: 1, position: "relative" }}>
              <select value={team} onChange={e => setTeam(e.target.value)}
                style={{ ...inputSt(false), appearance: "none", paddingRight: 28, cursor: "pointer" }}>
                {TEAM_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* 角色 */}
          <div className="flex items-start gap-3" style={{ marginBottom: 16 }}>
            <div style={{ ...labelSt, paddingTop: 8 }}>角色</div>
            <div className="flex flex-wrap gap-2" style={{ flex: 1, paddingTop: 4 }}>
              {ROLE_OPTIONS.map(role => {
                const selected = roles.includes(role);
                return (
                  <span key={role} onClick={() => toggleRole(role)}
                    style={{
                      fontSize: 12.5, padding: "5px 12px", borderRadius: 6, cursor: "pointer", userSelect: "none",
                      border: `1px solid ${selected ? "#4f6ef7" : "#e0e3ed"}`,
                      background: selected ? "#4f6ef7" : "#fff",
                      color: selected ? "#fff" : "#374151",
                    }}
                    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = "#4f6ef7"; }}
                    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = "#e0e3ed"; }}>
                    {role}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 账号状态 */}
          <div className="flex items-start gap-3" style={{ marginBottom: 4 }}>
            <div style={{ ...labelSt, paddingTop: 8 }}>账号状态</div>
            <div style={{ flex: 1, position: "relative" }}>
              <select value={status} onChange={e => setStatus(e.target.value as "正常" | "禁用")}
                style={{ ...inputSt(false), appearance: "none", paddingRight: 28, cursor: "pointer" }}>
                <option value="正常">正常</option>
                <option value="禁用">禁用</option>
              </select>
              <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3" style={{ padding: "0 28px 24px" }}>
          <button onClick={onClose}
            style={{ fontSize: 14, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, padding: "9px 24px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={submit}
            style={{ fontSize: 14, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 8, padding: "9px 24px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>{submitText}</button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function UserAccountPage() {
  const [users, setUsers]               = useState<UserRow[]>(ALL_USERS);
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordQuery, setKeywordQuery] = useState("");
  const [teamFilter, setTeamFilter]     = useState("全部");
  const [roleFilter, setRoleFilter]     = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [startDate, setStartDate]       = useState("");
  const [endDate, setEndDate]           = useState("");
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(10);
  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState<UserRow | null>(null);
  const [resetTarget, setResetTarget]   = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const filtered = users.filter(u => {
    if (keywordQuery) {
      const q = keywordQuery.toLowerCase();
      if (!u.account.toLowerCase().includes(q) && !u.name.toLowerCase().includes(q)) return false;
    }
    if (teamFilter !== "全部" && u.team !== teamFilter) return false;
    if (roleFilter !== "全部" && !u.roles.includes(roleFilter)) return false;
    if (statusFilter !== "全部" && u.status !== statusFilter) return false;
    const createdDate = u.createdAt.slice(0, 10);
    if (startDate && createdDate < startDate) return false;
    if (endDate && createdDate > endDate) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(TOTAL_COUNT / pageSize));
  const pageRows   = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getPageNums = (current: number, total: number): (number | string)[] => {
    const nums: (number | string)[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) nums.push(i);
      return nums;
    }
    nums.push(1);
    if (current > 4) nums.push("...");
    const start = Math.max(2, current - 1);
    const end   = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) nums.push(i);
    if (current < total - 3) nums.push("...");
    nums.push(total);
    return nums;
  };
  const pageNums = getPageNums(page, totalPages);

  const doSearch = () => { setKeywordQuery(keywordInput); setPage(1); };
  const doReset  = () => {
    setKeywordInput(""); setKeywordQuery("");
    setTeamFilter("全部"); setRoleFilter("全部"); setStatusFilter("全部");
    setStartDate(""); setEndDate("");
    setPage(1);
  };

  const handleCreate = (data: UserFormData) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const maxId = Math.max(0, ...users.map(u => u.id));
    setUsers(prev => [{
      id: maxId + 1,
      account: data.account,
      name: data.name,
      team: data.team,
      roles: data.roles.length ? data.roles : ["普通用户"],
      status: data.status,
      createdAt: ts,
      addType: "手动创建",
    }, ...prev]);
    setPage(1);
  };

  const handleEdit = (data: UserFormData) => {
    if (!editTarget) return;
    setUsers(prev => prev.map(u => u.id === editTarget.id ? {
      ...u,
      account: data.account,
      name: data.name,
      team: data.team,
      roles: data.roles.length ? data.roles : u.roles,
      status: data.status,
    } : u));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleResetPassword = () => { setResetTarget(null); };

  const thSt: React.CSSProperties = { padding: "11px 14px", textAlign: "left", fontWeight: 500, color: "#6b7280", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", background: "#f8f9fc" };
  const tdSt: React.CSSProperties = { padding: "11px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa", verticalAlign: "middle" };

  const selectSt: React.CSSProperties = { height: 34, padding: "0 28px 0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: "#374151", cursor: "pointer" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }}>用户管理</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 700 }}>用户账号</span>
      </div>

      {/* Page title */}
      <div className="flex items-center gap-2 flex-shrink-0" style={{ padding: "12px 24px 0" }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#1a1d23" }}>用户账号</span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>（此页面只有超管视角）</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Filter bar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-3" style={{ padding: "16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 账号/姓名 */}
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 10px", background: "#fff" }}>
              <input type="text" placeholder="请输入账号或姓名" value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ fontSize: 13, border: "none", outline: "none", width: 160, background: "transparent", color: "#1a1d23" }} />
            </div>

            {/* 团队 */}
            <div style={{ position: "relative" }}>
              <select value={teamFilter} onChange={e => { setTeamFilter(e.target.value); setPage(1); }} style={{ ...selectSt, width: 100 }}>
                {TEAM_FILTER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>

            {/* 角色 */}
            <div style={{ position: "relative" }}>
              <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={{ ...selectSt, width: 120 }}>
                {ROLE_FILTER_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>

            {/* 状态 */}
            <div style={{ position: "relative" }}>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ ...selectSt, width: 90 }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>

            {/* 创建时间 */}
            <span style={{ fontSize: 13, color: "#6b7280", flexShrink: 0 }}>创建时间</span>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
              style={{ height: 34, padding: "0 8px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", color: startDate ? "#1a1d23" : "#9ca3af" }} />
            <span style={{ fontSize: 13, color: "#9ca3af" }}>—</span>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
              style={{ height: 34, padding: "0 8px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", color: endDate ? "#1a1d23" : "#9ca3af" }} />

            {/* 搜索 */}
            <button onClick={doSearch} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 16px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
              onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
              <Search size={14} /> 搜索
            </button>
            {/* 重置 */}
            <button onClick={doReset} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 16px", fontSize: 13, fontWeight: 500, color: "#4f6ef7", background: "#fff", border: "1px solid #4f6ef7", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#eff4ff")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <RotateCcw size={14} /> 重置
            </button>
          </div>

          {/* 创建用户账号 */}
          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 16px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Plus size={14} /> 创建用户账号
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["账号", "姓名", "所属团队", "角色", "账号状态", "创建时间", "添加方式", "操作"].map(c => (
                  <th key={c} style={thSt}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(row => (
                <tr key={row.id}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdSt, color: "#374151" }}>{row.account}</td>
                  <td style={{ ...tdSt, fontWeight: 600, color: "#1a1d23" }}>{row.name}</td>
                  <td style={tdSt}>
                    {row.team === "无团队" ? (
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>无团队</span>
                    ) : (
                      <span style={tagStyle}>{row.team}</span>
                    )}
                  </td>
                  <td style={tdSt}>
                    <div className="flex items-center" style={{ gap: 4, flexWrap: "wrap" }}>
                      {row.roles.map((r, i) => (
                        <span key={i} style={tagStyle}>{r}</span>
                      ))}
                    </div>
                  </td>
                  <td style={tdSt}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 12.5, padding: "2px 10px", borderRadius: 5,
                      background: row.status === "正常" ? "#f0faf5" : "#fef2f2",
                      color: row.status === "正常" ? "#16a34a" : "#dc2626",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: row.status === "正常" ? "#16a34a" : "#dc2626", display: "inline-block" }} />
                      {row.status}
                    </span>
                  </td>
                  <td style={{ ...tdSt, color: "#6b7280", whiteSpace: "nowrap" }}>{row.createdAt}</td>
                  <td style={{ ...tdSt, color: "#6b7280" }}>{row.addType}</td>
                  <td style={tdSt}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setResetTarget(row)}
                        style={{ fontSize: 13, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>重置密码</button>
                      <button onClick={() => setEditTarget(row)}
                        style={{ fontSize: 13, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>编辑</button>
                      <button onClick={() => setDeleteTarget(row)}
                        style={{ fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ ...tdSt, textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "14px 16px", borderTop: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {TOTAL_COUNT} 条</span>
            <div style={{ position: "relative" }}>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{ height: 30, padding: "0 26px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", appearance: "none", color: "#374151", cursor: "pointer" }}>
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
              <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={14} />
            </button>
            {pageNums.map((n, i) =>
              typeof n === "string" ? (
                <span key={`e${i}`} style={{ fontSize: 13, color: "#9ca3af", padding: "0 2px" }}>…</span>
              ) : (
                <button key={n} onClick={() => setPage(n)}
                  style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: page === n ? "#4f6ef7" : "#e0e3ed", borderRadius: 5, background: page === n ? "#4f6ef7" : "#fff", color: page === n ? "#fff" : "#374151", fontSize: 12.5, fontWeight: page === n ? 600 : 400, cursor: "pointer" }}>
                  {n}
                </button>
              )
            )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {showCreate && <UserFormModal mode="create" onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
      {editTarget && <UserFormModal mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEdit} />}
      {resetTarget && (
        <ConfirmModal
          title="重置密码"
          message="确定要重置该用户的密码吗？重置后密码将发送至用户邮箱。"
          onConfirm={handleResetPassword}
          onClose={() => setResetTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          title="删除用户账号"
          message="删除后该账号将无法登录，此操作不可恢复。"
          confirmColor="#ef4444"
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
