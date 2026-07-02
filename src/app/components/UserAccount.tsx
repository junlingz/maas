import { useState } from "react";
import { Search, RotateCcw, Plus, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

interface UserRow {
  id: number; nickname: string; account: string;
  status: "正常" | "禁用"; createdAt: string; addType: string;
}

const ALL_USERS: UserRow[] = [
  { id: 1,     nickname: "admin",          account: "admin",                     status: "正常", createdAt: "2025-06-28 10:11:27", addType: "系统创建" },
  { id: 10000, nickname: "testuser1",      account: "testuser1@demo.com",        status: "正常", createdAt: "2025-06-19 14:11:45", addType: "手动创建" },
  { id: 10001, nickname: "xun.wu",         account: "xun.wu@aminer.cn",          status: "正常", createdAt: "2025-06-19 18:03:16", addType: "手动创建" },
  { id: 10002, nickname: "xiao.liu",       account: "xiao001.liu@aminer.cn",     status: "正常", createdAt: "2025-06-19 18:03:54", addType: "手动创建" },
  { id: 10003, nickname: "qixiang.ding",   account: "qixiang.ding@aminer.cn",    status: "正常", createdAt: "2025-06-23 11:18:12", addType: "手动创建" },
  { id: 10004, nickname: "zhonghua.zhang", account: "zhonghua.zhang@aminer.cn",  status: "正常", createdAt: "2025-06-23 23:23:08", addType: "手动创建" },
  { id: 10005, nickname: "jiahe.zhang",    account: "jiahe.zhang@aminer.cn",     status: "正常", createdAt: "2025-06-23 11:25:18", addType: "手动创建" },
  { id: 10006, nickname: "xiang.chen",     account: "xyyght8126.com",            status: "正常", createdAt: "2025-06-23 11:26:56", addType: "手动创建" },
  { id: 10007, nickname: "jiaqi.song",     account: "jiaqi.song@aminer.cn",      status: "正常", createdAt: "2025-06-23 11:28:29", addType: "手动创建" },
  { id: 10008, nickname: "xiaoyu.xiang",   account: "xiaoyu.xiang@aminer.cn",    status: "正常", createdAt: "2025-06-23 11:31:48", addType: "手动创建" },
  { id: 10009, nickname: "ming.li",        account: "ming.li@aminer.cn",         status: "正常", createdAt: "2025-06-24 09:05:00", addType: "手动创建" },
  { id: 10010, nickname: "fang.wang",      account: "fang.wang@aminer.cn",       status: "正常", createdAt: "2025-06-24 09:20:00", addType: "手动创建" },
  { id: 10011, nickname: "lei.zhao",       account: "lei.zhao@aminer.cn",        status: "正常", createdAt: "2025-06-24 10:00:00", addType: "手动创建" },
  { id: 10012, nickname: "yan.sun",        account: "yan.sun@aminer.cn",         status: "禁用", createdAt: "2025-06-24 10:30:00", addType: "手动创建" },
];

const PAGE_SIZE = 10;
const TOTAL_COUNT = 134;

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateUserModal({ onClose, onDone }: { onClose: () => void; onDone: (nickname: string, account: string) => void }) {
  const [nickname, setNickname] = useState("");
  const [account, setAccount]   = useState("");
  const [errors, setErrors]     = useState<Record<string, boolean>>({});

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!nickname.trim()) e.nickname = true;
    if (!account.trim())  e.account  = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    onDone(nickname.trim(), account.trim());
    onClose();
  };

  const inputSt = (hasErr: boolean): React.CSSProperties => ({
    width: "100%", height: 40, padding: "0 14px", fontSize: 14,
    border: `1px solid ${hasErr ? "#ef4444" : "#e0e3ed"}`, borderRadius: 8,
    outline: "none", background: "#fff", boxSizing: "border-box" as const, color: "#1a1d23",
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 520, background: "#fff", borderRadius: 16, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
      }}>
        {/* Title */}
        <div style={{ padding: "28px 32px 0" }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#1a1d23" }}>新增用户</span>
        </div>

        {/* Form area */}
        <div style={{ margin: "20px 32px", background: "#f5f7fb", borderRadius: 12, padding: "24px 28px" }}>
          {/* 昵称 */}
          <div className="flex items-center gap-3 mb-5">
            <div style={{ width: 70, fontSize: 14, fontWeight: 500, color: "#374151", textAlign: "right", flexShrink: 0 }}>
              <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>昵称：
            </div>
            <div style={{ flex: 1 }}>
              <input value={nickname} onChange={e => { setNickname(e.target.value); setErrors(p => ({ ...p, nickname: false })); }}
                placeholder="搜索昵称" style={inputSt(errors.nickname)} />
              {errors.nickname && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入昵称</div>}
            </div>
          </div>

          {/* 账号 */}
          <div className="flex items-center gap-3 mb-5">
            <div style={{ width: 70, fontSize: 14, fontWeight: 500, color: "#374151", textAlign: "right", flexShrink: 0 }}>
              <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>账号：
            </div>
            <div style={{ flex: 1 }}>
              <input value={account} onChange={e => { setAccount(e.target.value); setErrors(p => ({ ...p, account: false })); }}
                placeholder="搜索账号(邮箱)" style={inputSt(errors.account)} />
              {errors.account && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入账号</div>}
            </div>
          </div>

          {/* 密码设置 */}
          <div className="flex items-center gap-3">
            <div style={{ width: 70, fontSize: 14, fontWeight: 500, color: "#374151", textAlign: "right", flexShrink: 0 }}>密码设置：</div>
            <span style={{ fontSize: 14, color: "#6b7280" }}>随机生成</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3" style={{ padding: "0 32px 28px" }}>
          <button onClick={onClose}
            style={{ fontSize: 14, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, padding: "10px 28px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={submit}
            style={{ fontSize: 14, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 8, padding: "10px 28px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function UserAccountPage() {
  const [users, setUsers]           = useState<UserRow[]>(ALL_USERS);
  const [nicknameInput, setNicknameInput] = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [startDate, setStartDate]         = useState("");
  const [endDate, setEndDate]             = useState("");
  const [nicknameQuery, setNicknameQuery] = useState("");
  const [page, setPage]                   = useState(1);
  const [goPage, setGoPage]               = useState("");
  const [showCreate, setShowCreate]       = useState(false);

  const filtered = users.filter(u => {
    if (statusFilter  && u.status !== statusFilter) return false;
    if (nicknameQuery && !u.nickname.toLowerCase().includes(nicknameQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil((TOTAL_COUNT) / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageNums   = [1, 2, 3, 4, 5, 6];

  const doSearch = () => { setNicknameQuery(nicknameInput); setPage(1); };
  const doReset  = () => { setNicknameInput(""); setStatusFilter(""); setStartDate(""); setEndDate(""); setNicknameQuery(""); setPage(1); };

  const handleCreate = (nickname: string, account: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const maxId = Math.max(...users.map(u => u.id));
    setUsers(prev => [{ id: maxId + 1, nickname, account, status: "正常", createdAt: ts, addType: "手动创建" }, ...prev]);
  };

  const thSt: React.CSSProperties = { padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", background: "#f8f9fc" };
  const tdSt: React.CSSProperties = { padding: "12px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>用户管理</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>用户账号</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 昵称 */}
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 10px" }}>
              <input type="text" placeholder="请输入昵称" value={nicknameInput}
                onChange={e => setNicknameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ fontSize: 13, border: "none", outline: "none", width: 120, background: "transparent" }} />
            </div>

            {/* 状态 */}
            <div style={{ position: "relative" }}>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ height: 34, padding: "0 28px 0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: statusFilter ? "#1a1d23" : "#374151", width: 90 }}>
                <option value="">全部</option>
                <option value="正常">正常</option>
                <option value="禁用">禁用</option>
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>

            {/* 创建时间 range */}
            <div style={{ fontSize: 12.5, color: "#6b7280", flexShrink: 0 }}>创建时间</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ height: 34, padding: "0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", color: startDate ? "#1a1d23" : "#9ca3af" }} />
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>—</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={{ height: 34, padding: "0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", color: endDate ? "#1a1d23" : "#9ca3af" }} />

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

          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
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
                {["用户ID", "昵称", "账号", "账号状态", "创建时间", "添加方式", "操作"].map(c => (
                  <th key={c} style={thSt}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(row => (
                <tr key={row.id}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdSt, color: "#6b7280" }}>{row.id}</td>
                  <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23" }}>{row.nickname}</td>
                  <td style={{ ...tdSt, color: "#374151" }}>{row.account}</td>
                  <td style={tdSt}>
                    <span style={{
                      fontSize: 12.5, fontWeight: 500, padding: "2px 10px", borderRadius: 5,
                      background: row.status === "正常" ? "#f0faf5" : "#fef2f2",
                      color: row.status === "正常" ? "#16a34a" : "#dc2626",
                      border: `1px solid ${row.status === "正常" ? "#bbf7d0" : "#fecaca"}`,
                    }}>{row.status}</span>
                  </td>
                  <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{row.createdAt}</td>
                  <td style={{ ...tdSt, color: "#374151" }}>{row.addType}</td>
                  <td style={tdSt}>
                    <div className="flex items-center gap-3">
                      <button style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>重置密码</button>
                      <button onClick={() => setUsers(prev => prev.filter(u => u.id !== row.id))}
                        style={{ fontSize: 12.5, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ padding: "14px 16px", borderTop: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 12.5, color: "#9ca3af", marginRight: 4 }}>共 {TOTAL_COUNT} 条</span>
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
            <button onClick={() => setPage(p => Math.min(14, p + 1))} disabled={page === 14}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === 14 ? "not-allowed" : "pointer", opacity: page === 14 ? 0.4 : 1 }}>
              <ChevronRight size={13} />
            </button>
            <div className="flex items-center gap-1.5" style={{ marginLeft: 4 }}>
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>前往</span>
              <input type="number" value={goPage} onChange={e => setGoPage(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && goPage) { setPage(Math.min(14, Math.max(1, Number(goPage)))); setGoPage(""); } }}
                style={{ width: 40, height: 28, textAlign: "center", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }} />
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>页</span>
            </div>
          </div>
        </div>
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onDone={handleCreate} />}
    </div>
  );
}
