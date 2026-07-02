import { useState, useRef, useEffect } from "react";
import { Plus, ChevronDown, ChevronLeft, ChevronRight, X, ChevronRight as CRight, MoreVertical } from "lucide-react";

// ─── Role data ─────────────────────────────────────────────────────────────────

interface RoleRow {
  id: number; name: string; addType: "系统创建" | "手动创建"; updatedAt: string;
}

const ROLES_INIT: RoleRow[] = [
  { id: 1, name: "超级管理员",         addType: "系统创建", updatedAt: "2025-05-19 20:00:48" },
  { id: 2, name: "空间管理员",         addType: "系统创建", updatedAt: "2025-05-12 20:51:54" },
  { id: 3, name: "空间成员",           addType: "系统创建", updatedAt: "2025-05-12 20:51:56" },
  { id: 4, name: "zsh自定义角色",      addType: "手动创建", updatedAt: "2025-06-05 12:00:14" },
  { id: 5, name: "空间成员-不带模型实验室", addType: "手动创建", updatedAt: "2025-11-26 09:57:42" },
];

// ─── Permission tree ────────────────────────────────────────────────────────────

interface PermNode {
  key: string;
  label: string;
  children?: PermNode[];
}

const PERM_TREE: PermNode[] = [
  {
    key: "model-lab", label: "模型实验室", children: [
      { key: "model-center", label: "模型中心" },
      { key: "model-mgmt",   label: "模型管理" },
      {
        key: "model-service", label: "模型服务", children: [
          { key: "svc-list",      label: "模型服务列表" },
          { key: "svc-deploy",    label: "部署模型实例" },
          { key: "svc-scale",     label: "模型服务扩容" },
          { key: "svc-delete",    label: "删除模型服务" },
          { key: "svc-monitor",   label: "查看实例监控" },
          { key: "infer-list",    label: "查看推理服务列表" },
          { key: "api-publish",   label: "API 服务发布" },
          { key: "infer-delete",  label: "删除推理服务" },
          { key: "infer-stats",   label: "查看推理服务统计" },
          { key: "auto-scale",    label: "设置自动扩缩容" },
          { key: "route-list",    label: "查看路由策略列表" },
          { key: "route-create",  label: "创建路由策略" },
          { key: "route-edit",    label: "修改路由策略" },
          { key: "route-delete",  label: "删除路由策略" },
        ],
      },
      {
        key: "model-train", label: "模型训练", children: [
          { key: "train-view",    label: "查看训练任务" },
          { key: "tune-create",   label: "创建微调任务" },
          { key: "tune-edit",     label: "编辑微调任务" },
          { key: "tune-cancel",   label: "取消微调任务" },
          { key: "tune-delete",   label: "删除微调任务" },
          { key: "ds-view",       label: "查看数据集列表" },
          { key: "ds-upload",     label: "上传训练数据集" },
          { key: "ds-edit",       label: "编辑训练数据集" },
          { key: "ds-delete",     label: "删除训练数据集" },
        ],
      },
      {
        key: "space-mgmt", label: "空间管理", children: [
          { key: "space-view",    label: "查看工作空间成员" },
          { key: "space-add",     label: "添加工作空间成员" },
          { key: "space-remove",  label: "移除工作空间成员" },
        ],
      },
      {
        key: "cluster-mgmt", label: "集群管理", children: [
          { key: "pool-list",     label: "查看资源池列表" },
          { key: "node-list",     label: "查看集群节点列表" },
          { key: "group-list",    label: "查看资源组列表" },
          { key: "group-assign",  label: "分配资源组" },
          { key: "group-edit",    label: "修改资源组信息" },
          { key: "group-scale",   label: "扩缩容资源组" },
          { key: "group-delete",  label: "删除资源组" },
        ],
      },
      { key: "log-monitor", label: "日志监控" },
      {
        key: "model-eval", label: "模型评测", children: [
          { key: "eval-view",     label: "查看评测任务列表" },
          { key: "eval-create",   label: "创建评测任务" },
          { key: "eval-edit",     label: "编辑评测任务" },
          { key: "eval-cancel",   label: "取消评测任务" },
          { key: "eval-delete",   label: "删除评测任务" },
          { key: "eval-export",   label: "导出评测任务" },
          { key: "evds-view",     label: "查看评测数据集" },
          { key: "evds-create",   label: "创建评测数据集" },
          { key: "evds-edit",     label: "编辑评测数据集" },
          { key: "evds-cancel",   label: "取消评测数据集" },
        ],
      },
    ],
  },
];

// Default checked (matches screenshots)
const DEFAULT_CHECKED = new Set([
  "model-lab", "model-center", "model-mgmt",
  "model-service", "svc-list","svc-deploy","svc-scale","svc-delete","svc-monitor",
  "infer-list","api-publish","infer-delete","infer-stats",
  "route-list","route-create","route-edit","route-delete",
  "model-train","train-view","tune-create","tune-edit","tune-cancel","tune-delete",
  "ds-view","ds-upload","ds-edit","ds-delete",
  "space-mgmt","space-view",
  "cluster-mgmt","pool-list",
  "model-eval","eval-view","eval-create","eval-edit","eval-cancel","eval-delete","eval-export",
  "evds-view","evds-create","evds-edit","evds-cancel",
]);

// Collect all leaf keys under a node
function allLeaves(node: PermNode): string[] {
  if (!node.children) return [node.key];
  return node.children.flatMap(allLeaves);
}

// Check state: "all" | "none" | "partial"
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
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        border: `2px solid ${state === "none" ? "#d1d5db" : "#4f6ef7"}`,
        background: state === "all" ? "#4f6ef7" : state === "partial" ? "#4f6ef7" : "#fff",
      }}>
      {state === "all"     && <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
      {state === "partial" && <div style={{ width: 8, height: 2, background: "#fff", borderRadius: 1 }} />}
    </div>
  );
}

function PermTreeNode({ node, checked, setChecked, depth = 0 }: {
  node: PermNode; checked: Set<string>; setChecked: (s: Set<string>) => void; depth?: number;
}) {
  const [expanded, setExpanded] = useState(
    ["model-service", "model-train", "space-mgmt", "cluster-mgmt", "model-eval"].includes(node.key)
  );
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
        style={{ padding: "5px 0 5px", paddingLeft: depth * 20, cursor: hasChildren ? "default" : "pointer" }}
        onClick={() => !hasChildren && toggle()}>
        {/* Expand arrow */}
        {hasChildren ? (
          <div onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", color: "#9ca3af", transition: "transform 0.15s", transform: expanded ? "rotate(90deg)" : "none" }}>
            <CRight size={13} />
          </div>
        ) : (
          <div style={{ width: 13 }} />
        )}
        <Checkbox state={state} onChange={toggle} />
        <span style={{ fontSize: 13.5, color: "#1a1d23", fontWeight: hasChildren ? 500 : 400 }}>{node.label}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map(child => (
            <PermTreeNode key={child.key} node={child} checked={checked} setChecked={setChecked} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Role Drawer ────────────────────────────────────────────────────────

function CreateRoleDrawer({ onClose, onDone }: { onClose: () => void; onDone: (name: string) => void }) {
  const [name, setName]       = useState("");
  const [checked, setChecked] = useState(new Set(DEFAULT_CHECKED));
  const [nameErr, setNameErr] = useState(false);

  const submit = () => {
    if (!name.trim()) { setNameErr(true); return; }
    onDone(name.trim()); onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "20px 24px 16px" }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1d23" }}>新增角色</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto" style={{ padding: "0 24px 16px" }}>
          {/* 角色名称 */}
          <div className="flex items-center gap-3 mb-5">
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "#374151", flexShrink: 0, width: 64 }}>
              <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>角色名称：
            </div>
            <div style={{ flex: 1 }}>
              <input value={name} onChange={e => { setName(e.target.value); setNameErr(false); }}
                placeholder="搜索角色名称"
                style={{ width: "100%", height: 34, padding: "0 10px", fontSize: 13, border: `1px solid ${nameErr ? "#ef4444" : "#e0e3ed"}`, borderRadius: 6, outline: "none", boxSizing: "border-box" as const }} />
              {nameErr && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入角色名称</div>}
            </div>
          </div>

          {/* 权限码 */}
          <div className="flex items-start gap-3">
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "#374151", flexShrink: 0, width: 64, paddingTop: 6 }}>
              <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>权限码：
            </div>
            <div style={{ flex: 1 }}>
              {PERM_TREE.map(node => (
                <PermTreeNode key={node.key} node={node} checked={checked} setChecked={setChecked} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "14px 24px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={submit}
            style={{ fontSize: 13.5, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 8, padding: "9px 32px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── MoreMenu ──────────────────────────────────────────────────────────────────

function RoleMoreMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#6b7280", display: "flex", alignItems: "center" }}>
        <MoreVertical size={15} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 100, overflow: "hidden" }}>
          <button onClick={() => { onDelete(); setOpen(false); }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>删除</button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function UserRolePage() {
  const [roles, setRoles]       = useState<RoleRow[]>(ROLES_INIT);
  const [showCreate, setShowCreate] = useState(false);
  const [page] = useState(1);

  const handleCreate = (name: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setRoles(prev => [...prev, { id: prev.length + 1, name, addType: "手动创建", updatedAt: ts }]);
  };

  const thSt: React.CSSProperties = { padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", background: "#f8f9fc" };
  const tdSt: React.CSSProperties = { padding: "14px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>用户管理</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>角色权限</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <button onClick={() => setShowCreate(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Plus size={14} /> 自定义角色
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["角色名称", "添加方式", "更新时间", "操作"].map(c => (
                  <th key={c} style={thSt}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23", width: "40%" }}>{role.name}</td>
                  <td style={{ ...tdSt, color: "#374151" }}>{role.addType}</td>
                  <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5 }}>{role.updatedAt}</td>
                  <td style={tdSt}>
                    <div className="flex items-center gap-2">
                      <button style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>查看</button>
                      {role.addType === "手动创建" && (
                        <>
                          <button style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>编辑</button>
                          <RoleMoreMenu onDelete={() => setRoles(prev => prev.filter(r => r.id !== role.id))} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {roles.length} 条</span>
          <div style={{ position: "relative" }}>
            <select style={{ height: 28, padding: "0 22px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", appearance: "none", color: "#374151" }}>
              <option>10条/页</option>
            </select>
            <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <button disabled style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", opacity: 0.4 }}><ChevronLeft size={13} /></button>
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #4f6ef7", borderRadius: 5, background: "#4f6ef7", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>1</div>
          <button disabled style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", opacity: 0.4 }}><ChevronRight size={13} /></button>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>前往</span>
            <input type="number" defaultValue={1} style={{ width: 40, height: 28, textAlign: "center", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }} />
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>页</span>
          </div>
        </div>
      </div>

      {showCreate && <CreateRoleDrawer onClose={() => setShowCreate(false)} onDone={handleCreate} />}
    </div>
  );
}
