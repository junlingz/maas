import { useState } from "react";
import {
  Search, RotateCcw, Plus, ChevronDown, ChevronLeft, ChevronRight, X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type TeamType = "系统" | "有团队" | "无团队";
type TeamStatus = "启用" | "禁用";

interface TeamRow {
  id: number;
  name: string;
  code: string;
  type: TeamType;
  status: TeamStatus;
  memberCount: number;
  createdAt: string;
}

interface MemberOption {
  account: string;
  nickname: string;
}

interface TeamMember {
  account: string;
  nickname: string;
}

// ─── Sample data ───────────────────────────────────────────────────────────────

const ALL_TEAMS: TeamRow[] = [
  { id: 1, name: "系统",   code: "team_system", type: "系统",   status: "启用", memberCount: 1,   createdAt: "2025-05-19 20:00:48" },
  { id: 2, name: "智谱1",  code: "team_zhipu1", type: "有团队", status: "启用", memberCount: 15,  createdAt: "2025-06-19 14:11:45" },
  { id: 3, name: "企业2",  code: "team_corp2",  type: "有团队", status: "启用", memberCount: 8,   createdAt: "2025-06-19 18:03:16" },
  { id: 4, name: "机构3",  code: "team_org3",   type: "有团队", status: "启用", memberCount: 12,  createdAt: "2025-06-23 11:18:12" },
  { id: 5, name: "企业4",  code: "team_corp4",  type: "有团队", status: "启用", memberCount: 5,   createdAt: "2025-06-23 23:23:08" },
  { id: 6, name: "无团队", code: "team_none",   type: "无团队", status: "启用", memberCount: 134, createdAt: "2025-05-19 20:00:48" },
];

// 可选成员（无团队 + 正常状态的用户）
const AVAILABLE_MEMBERS: MemberOption[] = [
  { account: "xyyght8126.com",      nickname: "xiang.chen" },
  { account: "yan.sun@aminer.cn",   nickname: "yan.sun" },
  { account: "xun.wu@aminer.cn",    nickname: "xun.wu" },
  { account: "xiao.liu@aminer.cn",  nickname: "xiao.liu" },
  { account: "qixiang.ding@aminer.cn", nickname: "qixiang.ding" },
  { account: "zhonghua.zhang@aminer.cn", nickname: "zhonghua.zhang" },
];

const ROLE_OPTIONS = ["普通机构用户", "VIP机构用户", "政府用户", "独立机构1", "独立机构2"];

const PAGE_SIZE = 10;

// ─── Team form modal (Create / Edit) ───────────────────────────────────────────

interface TeamFormModalProps {
  title: string;
  initialName?: string;
  initialCode?: string;
  initialRole?: string;
  initialMembers?: TeamMember[];
  onClose: () => void;
  onSubmit: (data: { name: string; code: string; role: string; members: TeamMember[] }) => void;
}

function TeamFormModal({ title, initialName = "", initialCode = "", initialRole = "普通机构用户", initialMembers = [], onClose, onSubmit }: TeamFormModalProps) {
  const [name, setName]           = useState(initialName);
  const [code, setCode]           = useState(initialCode);
  const [role, setRole]           = useState(initialRole);
  const [members, setMembers]     = useState<TeamMember[]>(initialMembers);
  const [errors, setErrors]       = useState<Record<string, boolean>>({});
  const [roleOpen, setRoleOpen]   = useState(false);

  const addMember = (m: MemberOption) => {
    if (members.some(x => x.account === m.account)) return;
    setMembers(prev => [...prev, { account: m.account, nickname: m.nickname }]);
  };

  const removeMember = (account: string) => {
    setMembers(prev => prev.filter(x => x.account !== account));
  };

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (!code.trim()) e.code = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit({ name: name.trim(), code: code.trim(), role, members });
    onClose();
  };

  const inputSt = (hasErr: boolean): React.CSSProperties => ({
    width: "100%", height: 34, padding: "0 12px", fontSize: 13,
    border: `1px solid ${hasErr ? "#ef4444" : "#e0e3ed"}`, borderRadius: 6,
    outline: "none", background: "#fff", boxSizing: "border-box" as const, color: "#1a1d23",
  });

  const labelSt: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center" };

  const availThSt: React.CSSProperties = { padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 12, background: "#f8f9fc", borderBottom: "1px solid #f0f2f7" };
  const availTdSt: React.CSSProperties = { padding: "8px 10px", fontSize: 12.5, borderBottom: "1px solid #f5f7fa", color: "#374151" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 680, maxHeight: "85vh", background: "#fff", borderRadius: 16, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column",
      }}>
        {/* Title */}
        <div className="flex items-center justify-between" style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#1a1d23" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#9ca3af" }}>
            <X size={18} />
          </button>
        </div>

        {/* Body — two-column layout */}
        <div className="flex" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Left — available members (~45%) */}
          <div style={{ width: "45%", padding: "16px 12px 16px 20px", borderRight: "1px solid #f0f2f7", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 10 }}>可选成员</div>
            <div style={{ flex: 1, overflow: "auto", border: "1px solid #f0f2f7", borderRadius: 6 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th style={availThSt}>账号</th>
                    <th style={availThSt}>姓名</th>
                    <th style={{ ...availThSt, width: 40, textAlign: "center" }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {AVAILABLE_MEMBERS.map(m => {
                    const added = members.some(x => x.account === m.account);
                    return (
                      <tr key={m.account}>
                        <td style={{ ...availTdSt, color: "#6b7280" }}>{m.account}</td>
                        <td style={availTdSt}>{m.nickname}</td>
                        <td style={{ ...availTdSt, textAlign: "center" }}>
                          <button
                            onClick={() => addMember(m)}
                            disabled={added}
                            style={{
                              fontSize: 14, fontWeight: 600, color: added ? "#d1d5db" : "#4f6ef7",
                              background: "none", border: "none", cursor: added ? "default" : "pointer", padding: 0, lineHeight: 1,
                            }}
                            onMouseEnter={e => { if (!added) e.currentTarget.style.color = "#3b5de8"; }}
                            onMouseLeave={e => { if (!added) e.currentTarget.style.color = "#4f6ef7"; }}>
                            +
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right — team info form (~55%) */}
          <div style={{ width: "55%", padding: "16px 20px 16px 16px", display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" }}>
            {/* Team name */}
            <div style={{ marginBottom: 14 }}>
              <div style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>团队名称</div>
              <input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
                placeholder="请输入团队名称" style={inputSt(errors.name)} />
              {errors.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入团队名称</div>}
            </div>

            {/* Team code */}
            <div style={{ marginBottom: 14 }}>
              <div style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>团队编码</div>
              <input value={code} onChange={e => { setCode(e.target.value); setErrors(p => ({ ...p, code: false })); }}
                placeholder="请输入团队编码，如 team_xxx"
                style={{ ...inputSt(errors.code), fontFamily: "monospace" }} />
              {errors.code && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入团队编码</div>}
            </div>

            {/* Member role */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelSt}>团队成员角色</div>
              <div style={{ position: "relative" }}>
                <button onClick={() => setRoleOpen(o => !o)}
                  style={{
                    width: "100%", height: 34, padding: "0 28px 0 12px", fontSize: 13,
                    border: "1px solid #e0e3ed", borderRadius: 6, outline: "none",
                    background: "#fff", cursor: "pointer", textAlign: "left", color: "#1a1d23",
                    display: "flex", alignItems: "center",
                  }}>
                  {role}
                </button>
                <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                {roleOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
                    {ROLE_OPTIONS.map(r => (
                      <button key={r}
                        onClick={() => { setRole(r); setRoleOpen(false); }}
                        style={{
                          display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
                          fontSize: 13, border: "none", background: r === role ? "#f5f7ff" : "none",
                          cursor: "pointer", color: r === role ? "#4f6ef7" : "#374151",
                          fontWeight: r === role ? 600 : 400,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f5f7ff")}
                        onMouseLeave={e => (e.currentTarget.style.background = r === role ? "#f5f7ff" : "none")}>
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Current team members */}
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 8 }}>当前团队成员</div>
            <div style={{ flex: 1, minHeight: 120, border: "1px solid #f0f2f7", borderRadius: 6, overflow: "auto" }}>
              {members.length === 0 ? (
                <div className="flex items-center justify-center" style={{ height: "100%", minHeight: 120, fontSize: 12.5, color: "#9ca3af" }}>
                  暂无成员，请从左侧添加
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr>
                      <th style={availThSt}>账号</th>
                      <th style={availThSt}>姓名</th>
                      <th style={{ ...availThSt, width: 40, textAlign: "center" }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.account}>
                        <td style={{ ...availTdSt, color: "#6b7280" }}>{m.account}</td>
                        <td style={availTdSt}>{m.nickname}</td>
                        <td style={{ ...availTdSt, textAlign: "center" }}>
                          <button onClick={() => removeMember(m.account)}
                            style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
                            x
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3" style={{ padding: "14px 24px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose}
            style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "7px 22px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={submit}
            style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "7px 22px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteTeamModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 420, background: "#fff", borderRadius: 12, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
      }}>
        <div style={{ padding: "22px 24px 8px" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1d23" }}>删除团队</span>
        </div>
        <div style={{ padding: "8px 24px 20px", fontSize: 13.5, color: "#374151", lineHeight: 1.7 }}>
          确定要删除此团队吗？删除后团队内用户将无团队归属，无法使用企业资源。
        </div>
        <div className="flex items-center justify-end gap-3" style={{ padding: "0 24px 20px" }}>
          <button onClick={onClose}
            style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "7px 22px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={onConfirm}
            style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#ef4444", border: "none", borderRadius: 6, padding: "7px 22px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
            onMouseLeave={e => (e.currentTarget.style.background = "#ef4444")}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── Status tag helpers ────────────────────────────────────────────────────────

const STATUS_TAG_CFG: Record<TeamStatus, { bg: string; color: string }> = {
  "启用": { bg: "#f0faf5", color: "#16a34a" },
  "禁用": { bg: "#f3f4f6", color: "#6b7280" },
};

// ─── Main page ─────────────────────────────────────────────────────────────────

export function TeamManagementPage() {
  const [teams, setTeams] = useState<TeamRow[]>(ALL_TEAMS);

  // Filters
  const [nameInput, setNameInput]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [nameQuery, setNameQuery]   = useState("");

  const [page, setPage] = useState(1);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamRow | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<TeamRow | null>(null);

  const filtered = teams.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (nameQuery && !t.name.toLowerCase().includes(nameQuery.toLowerCase())) return false;
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const doSearch = () => { setNameQuery(nameInput); setPage(1); };
  const doReset  = () => { setNameInput(""); setStatusFilter(""); setNameQuery(""); setPage(1); };

  const handleCreate = (data: { name: string; code: string; role: string; members: TeamMember[] }) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const maxId = teams.reduce((m, t) => Math.max(m, t.id), 0);
    setTeams(prev => [{
      id: maxId + 1, name: data.name, code: data.code, type: "有团队",
      status: "启用", memberCount: data.members.length, createdAt: ts,
    }, ...prev]);
  };

  const handleEdit = (data: { name: string; code: string; role: string; members: TeamMember[] }) => {
    if (!editingTeam) return;
    setTeams(prev => prev.map(t => t.id === editingTeam.id ? { ...t, name: data.name, code: data.code, memberCount: data.members.length } : t));
    setEditingTeam(null);
  };

  const handleDelete = () => {
    if (!deletingTeam) return;
    setTeams(prev => prev.filter(t => t.id !== deletingTeam.id));
    setDeletingTeam(null);
  };

  const canOperate = (t: TeamRow) => t.type !== "系统" && t.type !== "无团队";

  const thSt: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", background: "#f8f9fc" };
  const tdSt: React.CSSProperties = { padding: "11px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa", verticalAlign: "middle" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>用户管理</span>
        <span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 600 }}>团队管理</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Title */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f2f7" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1d23" }}>团队管理</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>（此页面只有超管视角）</div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Team name */}
            <div className="flex items-center" style={{ fontSize: 12.5, color: "#374151", flexShrink: 0 }}>团队名称</div>
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 32, padding: "0 10px" }}>
              <input type="text" placeholder="请输入团队名称" value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ fontSize: 13, border: "none", outline: "none", width: 140, background: "transparent", color: "#1a1d23" }} />
            </div>

            {/* Status */}
            <div style={{ fontSize: 12.5, color: "#374151", flexShrink: 0 }}>状态</div>
            <div style={{ position: "relative" }}>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ height: 32, padding: "0 26px 0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: statusFilter ? "#1a1d23" : "#9ca3af", width: 90 }}>
                <option value="">全部</option>
                <option value="启用">启用</option>
                <option value="禁用">禁用</option>
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>

            {/* Search */}
            <button onClick={doSearch} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
              onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
              <Search size={13} /> 搜索
            </button>

            {/* Reset */}
            <button onClick={doReset} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#4f6ef7", background: "#fff", border: "1px solid #4f6ef7", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#eff4ff")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <RotateCcw size={13} /> 重置
            </button>
          </div>

          {/* Create */}
          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Plus size={14} /> 创建团队
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["团队名称", "状态", "成员数", "创建时间", "操作"].map(c => (
                  <th key={c} style={thSt}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdSt, textAlign: "center", color: "#9ca3af", padding: "40px 14px" }}>暂无数据</td>
                </tr>
              ) : pageRows.map(row => {
                const sc = STATUS_TAG_CFG[row.status];
                const operable = canOperate(row);
                return (
                  <tr key={row.id}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ ...tdSt, fontWeight: 600, color: "#1a1d23" }}>{row.name}</td>
                    <td style={tdSt}>
                      <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12.5, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, display: "inline-block" }} />
                        {row.status}
                      </span>
                    </td>
                    <td style={tdSt}>
                      <span style={{ color: "#374151", marginRight: 8 }}>{row.memberCount}</span>
                      <button style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>查看</button>
                    </td>
                    <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{row.createdAt}</td>
                    <td style={tdSt}>
                      {operable ? (
                        <div className="flex items-center gap-3">
                          <button onClick={() => setEditingTeam(row)}
                            style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>编辑</button>
                          <button onClick={() => setDeletingTeam(row)}
                            style={{ fontSize: 12.5, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}>删除</button>
                        </div>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "14px 16px", borderTop: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 12.5, color: "#9ca3af", marginRight: 4 }}>共 {total} 条</span>
            <div style={{ position: "relative" }}>
              <select style={{ height: 28, padding: "0 22px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", appearance: "none", color: "#374151" }}>
                <option>10条/页</option>
                <option>20条/页</option>
              </select>
              <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={curPage === 1}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: curPage === 1 ? "not-allowed" : "pointer", opacity: curPage === 1 ? 0.4 : 1 }}>
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: curPage === n ? "#4f6ef7" : "#e0e3ed", borderRadius: 5, background: curPage === n ? "#4f6ef7" : "#fff", color: curPage === n ? "#fff" : "#374151", fontSize: 12.5, fontWeight: curPage === n ? 600 : 400, cursor: "pointer" }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={curPage === totalPages}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: curPage === totalPages ? "not-allowed" : "pointer", opacity: curPage === totalPages ? 0.4 : 1 }}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <TeamFormModal title="创建团队" onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}

      {/* Edit modal */}
      {editingTeam && (
        <TeamFormModal
          title="编辑团队"
          initialName={editingTeam.name}
          initialCode={editingTeam.code}
          initialRole="普通机构用户"
          initialMembers={[]}
          onClose={() => setEditingTeam(null)}
          onSubmit={handleEdit}
        />
      )}

      {/* Delete confirm modal */}
      {deletingTeam && (
        <DeleteTeamModal
          onClose={() => setDeletingTeam(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
