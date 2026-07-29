import { useState } from "react";
import { Search, RotateCcw, Plus, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

// ─── Role data ─────────────────────────────────────────────────────────────────

type RoleType = "系统角色" | "自定义角色";
type RoleStatus = "启用" | "禁用";

interface RoleRow {
  id: number;
  name: string;
  code: string;
  type: RoleType;
  status: RoleStatus;
  createdAt: string;
  description?: string;
}

const ALL_ROLES: RoleRow[] = [
  { id: 1,  name: "超管",            code: "role_super_admin",  type: "系统角色", status: "启用", createdAt: "2025-05-19 20:00:48" },
  { id: 2,  name: "普通用户",        code: "role_normal_user",  type: "系统角色", status: "启用", createdAt: "2025-05-12 20:51:56" },
  { id: 3,  name: "VIP用户",         code: "role_vip_user",     type: "系统角色", status: "启用", createdAt: "2025-05-12 20:51:56" },
  { id: 4,  name: "普通机构用户",    code: "role_org_user",     type: "系统角色", status: "启用", createdAt: "2025-05-12 20:51:56" },
  { id: 5,  name: "VIP机构用户",     code: "role_vip_org_user", type: "系统角色", status: "启用", createdAt: "2025-05-12 20:51:56" },
  { id: 6,  name: "政府用户",        code: "role_gov_user",     type: "系统角色", status: "启用", createdAt: "2025-05-12 20:51:56" },
  { id: 7,  name: "独立机构A用户",   code: "role_org_a_user",   type: "自定义角色", status: "启用", createdAt: "2025-06-05 12:00:14" },
  { id: 8,  name: "独立机构B用户",   code: "role_org_b_user",   type: "自定义角色", status: "启用", createdAt: "2025-06-05 12:05:30" },
];

const PAGE_SIZE = 10;
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

// ─── Permission tree ───────────────────────────────────────────────────────────

interface PermNode {
  key: string;
  label: string;
  children?: PermNode[];
}

const PERM_TREE: PermNode[] = [
  { key: "model-plaza", label: "模型广场" },
  { key: "model-exp",   label: "模型体验" },
  {
    key: "model-train", label: "模型训练", children: [
      { key: "train-view",   label: "查看训练任务" },
      { key: "train-create", label: "创建训练任务" },
      { key: "train-data",   label: "训练数据管理" },
    ],
  },
  {
    key: "model-mgmt", label: "模型管理", children: [
      { key: "model-lib",    label: "模型库" },
      { key: "model-deploy", label: "模型部署" },
    ],
  },
  { key: "user-mgmt", label: "用户管理" },
];

const DEFAULT_CHECKED = new Set<string>([
  "model-plaza", "model-exp",
  "model-train", "train-view", "train-create", "train-data",
  "model-mgmt", "model-lib", "model-deploy",
  "user-mgmt",
]);

function allLeaves(node: PermNode): string[] {
  if (!node.children) return [node.key];
  return node.children.flatMap(allLeaves);
}

function checkState(node: PermNode, checked: Set<string>): "all" | "none" | "partial" {
  if (!node.children) return checked.has(node.key) ? "all" : "none";
  const leaves = allLeaves(node);
  const cnt = leaves.filter(k => checked.has(k)).length;
  if (cnt === 0) return "none";
  if (cnt === leaves.length) return "all";
  return "partial";
}

function Checkbox({ state, onChange }: { state: "all" | "none" | "partial"; onChange: () => void }) {
  return (
    <div onClick={e => { e.stopPropagation(); onChange(); }}
      style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${state === "none" ? "#d1d5db" : "#4f6ef7"}`,
        background: state === "none" ? "#fff" : "#4f6ef7",
      }}>
      {state === "all" && (
        <svg width="10" height="8" viewBox="0 0 10 8">
          <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {state === "partial" && <div style={{ width: 8, height: 2, background: "#fff", borderRadius: 1 }} />}
    </div>
  );
}

function PermTreeNode({ node, checked, setChecked, depth = 0 }: {
  node: PermNode; checked: Set<string>; setChecked: (s: Set<string>) => void; depth?: number;
}) {
  const state = checkState(node, checked);
  const hasChildren = !!node.children?.length;

  const toggle = () => {
    const next = new Set(checked);
    const leaves = allLeaves(node);
    if (state === "all") leaves.forEach(k => next.delete(k));
    else leaves.forEach(k => next.add(k));
    setChecked(next);
  };

  return (
    <div>
      <div className="flex items-center gap-2"
        style={{ padding: "5px 0", paddingLeft: depth * 22, cursor: "pointer" }}
        onClick={toggle}>
        {hasChildren && <div style={{ width: 13, flexShrink: 0 }} />}
        <Checkbox state={state} onChange={toggle} />
        <span style={{ fontSize: 13.5, color: "#1a1d23", fontWeight: hasChildren ? 600 : 400 }}>{node.label}</span>
      </div>
      {hasChildren && node.children!.map(child => (
        <PermTreeNode key={child.key} node={child} checked={checked} setChecked={setChecked} depth={depth + 1} />
      ))}
    </div>
  );
}

// ─── Create / Edit Role Modal ──────────────────────────────────────────────────

interface RoleFormData {
  name: string;
  code: string;
  type: RoleType;
  status: RoleStatus;
  description: string;
  checked: Set<string>;
}

function RoleFormModal({ mode, initial, onClose, onSubmit }: {
  mode: "create" | "edit";
  initial: RoleFormData;
  onClose: () => void;
  onSubmit: (data: { name: string; code: string; type: RoleType; status: RoleStatus; description: string }) => void;
}) {
  const [name, setName]               = useState(initial.name);
  const [code, setCode]               = useState(initial.code);
  const [type, setType]               = useState<RoleType>(initial.type);
  const [status, setStatus]           = useState<RoleStatus>(initial.status);
  const [description, setDescription] = useState(initial.description);
  const [checked, setChecked]         = useState(new Set(initial.checked));
  const [errors, setErrors]           = useState<Record<string, boolean>>({});

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (!code.trim()) e.code = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit({ name: name.trim(), code: code.trim(), type, status, description });
    onClose();
  };

  const inputSt = (hasErr: boolean): React.CSSProperties => ({
    width: "100%", height: 36, padding: "0 12px", fontSize: 13.5,
    border: `1px solid ${hasErr ? "#ef4444" : "#e0e3ed"}`, borderRadius: 8,
    outline: "none", background: "#fff", boxSizing: "border-box" as const, color: "#1a1d23",
  });

  const labelSt: React.CSSProperties = {
    fontSize: 13.5, fontWeight: 500, color: "#374151", flexShrink: 0, width: 80, textAlign: "right",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 520, maxHeight: "90vh", background: "#fff", borderRadius: 16, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column",
      }}>
        {/* Title */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "22px 28px 16px" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1d23" }}>{mode === "create" ? "创建角色" : "编辑角色"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-auto" style={{ padding: "0 28px 8px" }}>
          {/* 角色名称 */}
          <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
            <div style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>角色名称：</div>
            <div style={{ flex: 1 }}>
              <input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
                placeholder="请输入角色名称" style={inputSt(errors.name)} />
              {errors.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入角色名称</div>}
            </div>
          </div>

          {/* 角色编码 */}
          <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
            <div style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>角色编码：</div>
            <div style={{ flex: 1 }}>
              <input value={code} onChange={e => { setCode(e.target.value); setErrors(p => ({ ...p, code: false })); }}
                placeholder="请输入角色编码，如 role_xxx"
                style={{ ...inputSt(errors.code), fontFamily: MONO }} />
              {errors.code && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入角色编码</div>}
            </div>
          </div>

          {/* 角色类型 + 状态 */}
          <div className="flex items-start gap-3" style={{ marginBottom: 14 }}>
            <div style={{ ...labelSt, paddingTop: 8 }}>角色类型：</div>
            <div style={{ flex: 1, position: "relative" }}>
              <select value={type} onChange={e => setType(e.target.value as RoleType)}
                style={{ width: "100%", height: 36, padding: "0 28px 0 12px", fontSize: 13.5, border: "1px solid #e0e3ed", borderRadius: 8, outline: "none", background: "#fff", appearance: "none", color: "#1a1d23" }}>
                <option value="系统角色">系统角色</option>
                <option value="自定义角色">自定义角色</option>
              </select>
              <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <div style={{ ...labelSt, width: 56, paddingTop: 8 }}>状态：</div>
            <div style={{ flex: 1, position: "relative" }}>
              <select value={status} onChange={e => setStatus(e.target.value as RoleStatus)}
                style={{ width: "100%", height: 36, padding: "0 28px 0 12px", fontSize: 13.5, border: "1px solid #e0e3ed", borderRadius: 8, outline: "none", background: "#fff", appearance: "none", color: "#1a1d23" }}>
                <option value="启用">启用</option>
                <option value="禁用">禁用</option>
              </select>
              <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </div>

          {/* 描述 */}
          <div className="flex items-start gap-3" style={{ marginBottom: 14 }}>
            <div style={{ ...labelSt, paddingTop: 8 }}>描述：</div>
            <div style={{ flex: 1 }}>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="请输入角色描述"
                style={{ width: "100%", minHeight: 70, padding: "8px 12px", fontSize: 13.5, border: "1px solid #e0e3ed", borderRadius: 8, outline: "none", background: "#fff", boxSizing: "border-box" as const, color: "#1a1d23", resize: "vertical" as const, fontFamily: "inherit" }} />
            </div>
          </div>

          {/* 权限配置 */}
          <div className="flex items-start gap-3" style={{ marginBottom: 8 }}>
            <div style={{ ...labelSt, paddingTop: 5 }}>权限配置：</div>
            <div style={{ flex: 1, padding: "12px 14px", border: "1px solid #e0e3ed", borderRadius: 8, background: "#fafbfd", maxHeight: 200, overflow: "auto" }}>
              {PERM_TREE.map(node => (
                <PermTreeNode key={node.key} node={node} checked={checked} setChecked={setChecked} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0" style={{ padding: "14px 28px 22px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose}
            style={{ fontSize: 13.5, fontWeight: 500, color: "#6b7280", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, padding: "9px 28px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={submit}
            style={{ fontSize: 13.5, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 8, padding: "9px 28px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>{mode === "create" ? "确定" : "保存"}</button>
        </div>
      </div>
    </>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({ roleName, onClose, onConfirm }: {
  roleName: string; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 420, background: "#fff", borderRadius: 16, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
      }}>
        <div style={{ padding: "22px 28px 8px" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1d23" }}>删除角色</span>
        </div>
        <div style={{ padding: "8px 28px 20px", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
          确定要删除此角色吗？已分配该角色的用户将取消该角色权限。
          {roleName && <span style={{ color: "#1a1d23", fontWeight: 500 }}>（{roleName}）</span>}
        </div>
        <div className="flex items-center justify-end gap-3" style={{ padding: "0 28px 22px" }}>
          <button onClick={onClose}
            style={{ fontSize: 13.5, fontWeight: 500, color: "#6b7280", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, padding: "9px 28px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={onConfirm}
            style={{ fontSize: 13.5, fontWeight: 500, color: "#fff", background: "#ef4444", border: "none", borderRadius: 8, padding: "9px 28px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
            onMouseLeave={e => (e.currentTarget.style.background = "#ef4444")}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── View Members Modal ────────────────────────────────────────────────────────

interface MemberRow { account: string; name: string; team: string; }

const SAMPLE_MEMBERS: MemberRow[] = [
  { account: "admin",                   name: "管理员",   team: "平台团队" },
  { account: "testuser1@demo.com",      name: "测试用户1", team: "研发团队" },
  { account: "xun.wu@aminer.cn",        name: "吴迅",     team: "算法团队" },
  { account: "xiao.liu@aminer.cn",      name: "刘晓",     team: "算法团队" },
  { account: "qixiang.ding@aminer.cn",  name: "丁启翔",   team: "研发团队" },
  { account: "zhonghua.zhang@aminer.cn", name: "张中华",  team: "产品团队" },
  { account: "jiahe.zhang@aminer.cn",   name: "张嘉禾",   team: "产品团队" },
  { account: "xiang.chen@aminer.cn",    name: "陈翔",     team: "运营团队" },
];

function ViewMembersModal({ roleName, onClose }: { roleName: string; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(SAMPLE_MEMBERS.length / pageSize));
  const rows = SAMPLE_MEMBERS.slice((page - 1) * pageSize, page * pageSize);

  const thSt: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", background: "#f8f9fc" };
  const tdSt: React.CSSProperties = { padding: "11px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 640, maxHeight: "90vh", background: "#fff", borderRadius: 16, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column",
      }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "22px 28px 16px" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1d23" }}>角色人员 - {roleName}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: "0 28px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: "1px solid #f0f2f7", borderRadius: 8, overflow: "hidden" }}>
            <thead>
              <tr>
                <th style={thSt}>账号</th>
                <th style={thSt}>姓名</th>
                <th style={thSt}>所属团队</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(m => (
                <tr key={m.account}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdSt, color: "#6b7280", fontFamily: MONO, fontSize: 12.5 }}>{m.account}</td>
                  <td style={{ ...tdSt, color: "#1a1d23", fontWeight: 500 }}>{m.name}</td>
                  <td style={{ ...tdSt, color: "#374151" }}>{m.team}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "16px 28px 22px" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {SAMPLE_MEMBERS.length} 条</span>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
            <ChevronLeft size={13} />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: page === i + 1 ? "#4f6ef7" : "#e0e3ed", borderRadius: 5, background: page === i + 1 ? "#4f6ef7" : "#fff", color: page === i + 1 ? "#fff" : "#374151", fontSize: 12.5, fontWeight: page === i + 1 ? 600 : 400, cursor: "pointer" }}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function UserRolePage() {
  const [roles, setRoles]               = useState<RoleRow[]>(ALL_ROLES);
  const [nameInput, setNameInput]       = useState("");
  const [typeFilter, setTypeFilter]    = useState<"" | RoleType>("");
  const [statusFilter, setStatusFilter] = useState<"" | RoleStatus>("");
  const [nameQuery, setNameQuery]      = useState("");
  const [appliedType, setAppliedType]  = useState<"" | RoleType>("");
  const [appliedStatus, setAppliedStatus] = useState<"" | RoleStatus>("");
  const [page, setPage]                 = useState(1);

  const [showCreate, setShowCreate]     = useState(false);
  const [editTarget, setEditTarget]     = useState<RoleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);
  const [viewTarget, setViewTarget]     = useState<RoleRow | null>(null);

  const filtered = roles.filter(r => {
    if (nameQuery && !r.name.toLowerCase().includes(nameQuery.toLowerCase())) return false;
    if (appliedType && r.type !== appliedType) return false;
    if (appliedStatus && r.status !== appliedStatus) return false;
    return true;
  });

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNums: number[] = [];
  for (let i = 1; i <= totalPages; i++) pageNums.push(i);

  const doSearch = () => {
    setNameQuery(nameInput);
    setAppliedType(typeFilter);
    setAppliedStatus(statusFilter);
    setPage(1);
  };
  const doReset = () => {
    setNameInput("");
    setTypeFilter("");
    setStatusFilter("");
    setNameQuery("");
    setAppliedType("");
    setAppliedStatus("");
    setPage(1);
  };

  const nowTs = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  };

  const handleCreate = (data: { name: string; code: string; type: RoleType; status: RoleStatus; description: string }) => {
    const maxId = roles.reduce((m, r) => Math.max(m, r.id), 0);
    setRoles(prev => [{ id: maxId + 1, name: data.name, code: data.code, type: data.type, status: data.status, createdAt: nowTs(), description: data.description }, ...prev]);
    setPage(1);
  };

  const handleEdit = (data: { name: string; code: string; type: RoleType; status: RoleStatus; description: string }) => {
    if (!editTarget) return;
    setRoles(prev => prev.map(r => r.id === editTarget.id ? { ...r, name: data.name, code: data.code, type: data.type, status: data.status, description: data.description } : r));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRoles(prev => prev.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const thSt: React.CSSProperties = { padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#6b7280", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", background: "#f8f9fc" };
  const tdSt: React.CSSProperties = { padding: "11px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }}>用户管理</span>
        <span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 600 }}>角色权限</span>
      </div>

      {/* Page title */}
      <div className="flex-shrink-0" style={{ padding: "12px 24px 0" }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#1a1d23" }}>角色权限</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Filter toolbar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "16px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-3 flex-wrap">
            {/* 角色名称 */}
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13, color: "#374151", flexShrink: 0 }}>角色名称</span>
              <input type="text" placeholder="请输入角色名称" value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ height: 34, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", width: 180, boxSizing: "border-box" as const }} />
            </div>

            {/* 角色类型 */}
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13, color: "#374151", flexShrink: 0 }}>角色类型</span>
              <div style={{ position: "relative" }}>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as "" | RoleType)}
                  style={{ height: 34, padding: "0 28px 0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: typeFilter ? "#1a1d23" : "#9ca3af", width: 120 }}>
                  <option value="">全部</option>
                  <option value="系统角色">系统角色</option>
                  <option value="自定义角色">自定义角色</option>
                </select>
                <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* 状态 */}
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 13, color: "#374151", flexShrink: 0 }}>状态</span>
              <div style={{ position: "relative" }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as "" | RoleStatus)}
                  style={{ height: 34, padding: "0 28px 0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: statusFilter ? "#1a1d23" : "#9ca3af", width: 100 }}>
                  <option value="">全部</option>
                  <option value="启用">启用</option>
                  <option value="禁用">禁用</option>
                </select>
                <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            </div>

            <button onClick={doSearch} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
              onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
              <Search size={13} /> 搜索
            </button>
            <button onClick={doReset} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#4f6ef7", background: "#fff", border: "1px solid #4f6ef7", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#eff4ff")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <RotateCcw size={13} /> 重置
            </button>
          </div>

          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Plus size={14} /> 创建角色
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["角色名称", "角色类型", "状态", "创建时间", "操作"].map(c => (
                  <th key={c} style={thSt}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map(role => (
                <tr key={role.id}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdSt, fontWeight: 600, color: "#1a1d23" }}>{role.name}</td>
                  <td style={tdSt}>
                    <span style={{
                      fontSize: 12.5, fontWeight: 500, padding: "2px 10px", borderRadius: 5, display: "inline-block",
                      background: role.type === "系统角色" ? "#eff4ff" : "#f5f3ff",
                      color: role.type === "系统角色" ? "#4f6ef7" : "#7c3aed",
                    }}>{role.type}</span>
                  </td>
                  <td style={tdSt}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 12.5, fontWeight: 500, padding: "2px 10px", borderRadius: 5,
                      background: role.status === "启用" ? "#f0faf5" : "#f3f4f6",
                      color: role.status === "启用" ? "#16a34a" : "#6b7280",
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", display: "inline-block", background: role.status === "启用" ? "#16a34a" : "#6b7280" }} />
                      {role.status}
                    </span>
                  </td>
                  <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{role.createdAt}</td>
                  <td style={tdSt}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setEditTarget(role)} style={{ fontSize: 13, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>编辑</button>
                      <button onClick={() => setViewTarget(role)} style={{ fontSize: 13, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>查看人员</button>
                      <button onClick={() => setDeleteTarget(role)} style={{ fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ ...tdSt, textAlign: "center", color: "#9ca3af", padding: "40px 14px" }}>暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {totalCount} 条</span>
          <div style={{ position: "relative" }}>
            <select style={{ height: 28, padding: "0 22px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", appearance: "none", color: "#374151" }}>
              <option>10条/页</option>
            </select>
            <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.4 : 1 }}>
            <ChevronLeft size={13} />
          </button>
          {pageNums.map(n => (
            <button key={n} onClick={() => setPage(n)}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: currentPage === n ? "#4f6ef7" : "#e0e3ed", borderRadius: 5, background: currentPage === n ? "#4f6ef7" : "#fff", color: currentPage === n ? "#fff" : "#374151", fontSize: 12.5, fontWeight: currentPage === n ? 600 : 400, cursor: "pointer" }}>
              {n}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.4 : 1 }}>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {showCreate && (
        <RoleFormModal mode="create"
          initial={{ name: "", code: "", type: "自定义角色", status: "启用", description: "", checked: DEFAULT_CHECKED }}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate} />
      )}
      {editTarget && (
        <RoleFormModal mode="edit"
          initial={{ name: editTarget.name, code: editTarget.code, type: editTarget.type, status: editTarget.status, description: editTarget.description ?? "", checked: DEFAULT_CHECKED }}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit} />
      )}
      {deleteTarget && (
        <DeleteConfirmModal roleName={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      )}
      {viewTarget && (
        <ViewMembersModal roleName={viewTarget.name} onClose={() => setViewTarget(null)} />
      )}
    </div>
  );
}
