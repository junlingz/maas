import { useState } from "react";
import { Search, RotateCcw, Plus, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

// ─── Shared ────────────────────────────────────────────────────────────────────

const thSt: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "#6b7280", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", background: "#f8f9fc", whiteSpace: "nowrap" };
const tdSt: React.CSSProperties = { padding: "11px 12px", fontSize: 12.5, borderBottom: "1px solid #f5f7fa", verticalAlign: "top" };
const inpSt: React.CSSProperties = { width: "100%", height: 34, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" };

const CLUSTERS = ["h20-node1", "a100-prod-cluster"];
const RGROUPS  = ["资源组1", "推理组-A"];

function FilterDrop({ value, onChange, opts, placeholder, width = 140 }: { value: string; onChange: (v: string) => void; opts: string[]; placeholder: string; width?: number }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ height: 32, padding: "0 26px 0 10px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: value ? "#1a1d23" : "#9ca3af", cursor: "pointer", width }}>
        <option value="">{placeholder}</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={12} color="#9ca3af" style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

function SearchBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 13px", fontSize: 12.5, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
      <Search size={12} /> 搜索
    </button>
  );
}

// ─── Node & User data ─────────────────────────────────────────────────────────

interface NodeItem { id: string; name: string; ip: string; allocated: boolean; gpuCount: number; cluster: string; }
interface UserItem { id: string; email: string; nickname: string; }

const ALL_NODES: NodeItem[] = [
  { id: "n02", name: "node02", ip: "10.2.0.2", allocated: true,  gpuCount: 8, cluster: "h20-node1" },
  { id: "n03", name: "node03", ip: "10.2.0.3", allocated: false, gpuCount: 8, cluster: "h20-node1" },
  { id: "n04", name: "node04", ip: "10.2.0.4", allocated: false, gpuCount: 8, cluster: "h20-node1" },
  { id: "n05", name: "node05", ip: "10.2.0.5", allocated: false, gpuCount: 8, cluster: "h20-node1" },
  { id: "a01", name: "a100-node1", ip: "192.168.1.10", allocated: false, gpuCount: 4, cluster: "a100-prod-cluster" },
  { id: "a02", name: "a100-node2", ip: "192.168.1.11", allocated: false, gpuCount: 4, cluster: "a100-prod-cluster" },
];

const ALL_USERS: UserItem[] = [
  { id: "u1", email: "testuser1@demo.com", nickname: "user001" },
  { id: "u2", email: "testuser2@demo.com", nickname: "user002" },
  { id: "u3", email: "testuser3@demo.com", nickname: "user003" },
  { id: "u4", email: "admin@demo.com",     nickname: "admin"   },
];

// ─── 3-Step Wizard Drawer ─────────────────────────────────────────────────────

interface RGFormData {
  cluster: string; name: string; usage: string; desc: string;
  selectedNodes: string[]; authorizedUsers: string[];
}

interface RGWizardProps {
  isEdit?: boolean;
  initial?: RGRow | null;
  onClose: () => void;
  onDone: (data: RGFormData) => void;
}

function StepIndicator({ step, isEdit, onJump }: { step: number; isEdit: boolean; onJump: (s: number) => void }) {
  const steps = [
    { n: 1, label: "基本信息" },
    { n: 2, label: "选择节点" },
    { n: 3, label: "授权用户" },
  ];
  return (
    <div className="flex items-center gap-0" style={{ marginBottom: 20 }}>
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div
            onClick={() => (isEdit || s.n < step) ? onJump(s.n) : undefined}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              cursor: (isEdit || s.n < step) ? "pointer" : "default",
              color: s.n === step ? "#4f6ef7" : s.n < step ? "#374151" : "#9ca3af",
              fontWeight: s.n === step ? 600 : 400,
              fontSize: 13,
              textDecoration: s.n === step ? "underline" : "none",
              textDecorationColor: "#4f6ef7",
              textUnderlineOffset: 3,
            }}>
            <span style={{ fontWeight: 600 }}>{s.n}</span> {s.label}
          </div>
          {i < steps.length - 1 && (
            <span style={{ fontSize: 12, color: "#d1d5db", margin: "0 8px" }}>————</span>
          )}
        </div>
      ))}
    </div>
  );
}

function RGWizard({ isEdit, initial, onClose, onDone }: RGWizardProps) {
  const [step, setStep] = useState(1);

  // Step 1
  const [cluster, setCluster]   = useState(initial?.clusterName ?? "");
  const [name, setName]         = useState(initial?.name ?? "");
  const [usage, setUsage]       = useState(initial?.usage === "训练" ? "训练" : "推理");
  const [desc, setDesc]         = useState("");
  const [errs1, setErrs1]       = useState<Record<string, boolean>>({});

  // Step 2
  const clusterNodes = ALL_NODES.filter(n => n.cluster === (cluster || "h20-node1"));
  const [selNodes, setSelNodes] = useState<Set<string>>(new Set(initial?.selectedNodes ?? []));

  // Step 3
  const [userSearch, setUserSearch] = useState("");
  const [authUsers, setAuthUsers]   = useState<Set<string>>(new Set(initial?.authorizedUserIds ?? []));

  const filteredUsers = ALL_USERS.filter(u =>
    !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.nickname.toLowerCase().includes(userSearch.toLowerCase())
  );

  const selectedGPU = [...selNodes].reduce((s, id) => {
    const n = ALL_NODES.find(n => n.id === id);
    return s + (n?.gpuCount ?? 0);
  }, 0);

  const goNext1 = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (Object.keys(e).length) { setErrs1(e); return; }
    setStep(2);
  };

  const handleFinish = () => {
    onDone({ cluster: cluster || "h20-node1", name: name.trim(), usage, desc, selectedNodes: [...selNodes], authorizedUsers: [...authUsers] });
    onClose();
  };

  const radioSt = (checked: boolean): React.CSSProperties => ({
    width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
    border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`,
    background: checked ? "#4f6ef7" : "#fff",
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 460, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.14)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>
            {isEdit ? "编辑资源组" : "创建资源组"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto" style={{ padding: "20px" }}>
          <StepIndicator step={step} isEdit={!!isEdit} onJump={setStep} />

          {/* ── Step 1: 基本信息 ── */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>所属集群：</div>
                <div style={{ position: "relative" }}>
                  <select value={cluster} onChange={e => setCluster(e.target.value)}
                    disabled={isEdit}
                    style={{ ...inpSt, appearance: "none", paddingRight: 26, cursor: isEdit ? "not-allowed" : "pointer", background: isEdit ? "#f8f9fc" : "#fff", color: cluster ? "#1a1d23" : "#9ca3af" }}>
                    <option value="">请选择集群</option>
                    {CLUSTERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {!isEdit && <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
                  资源组名称：<span style={{ color: "#ef4444" }}>*</span>
                </div>
                <input value={name} onChange={e => { setName(e.target.value); setErrs1({}); }}
                  style={{ ...inpSt, borderColor: errs1.name ? "#ef4444" : "#e0e3ed" }} />
                {errs1.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入资源组名称</div>}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 8 }}>
                  用途：<span style={{ color: "#ef4444" }}>*</span>
                </div>
                <div className="flex items-center gap-6">
                  {["推理", "训练"].map(u => (
                    <label key={u} className="flex items-center gap-2" style={{ cursor: "pointer", fontSize: 13, color: "#374151" }}>
                      <div style={radioSt(usage === u)} onClick={() => setUsage(u)}>
                        {usage === u && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", display: "block" }} />}
                      </div>
                      <input type="radio" style={{ display: "none" }} checked={usage === u} onChange={() => setUsage(u)} />
                      {u}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>描述：</div>
                <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 200))} placeholder=""
                  style={{ width: "100%", height: 100, padding: "8px 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" as const }} />
                <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "right", marginTop: 2 }}>（选填，最多200字）</div>
              </div>
            </div>
          )}

          {/* ── Step 2: 选择节点 ── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                当前集群：<span style={{ fontWeight: 500 }}>{cluster || "h20-node1"}</span>
              </div>
              <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>选择节点：</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ ...thSt, width: 32 }}>
                      <input type="checkbox"
                        checked={clusterNodes.filter(n => !n.allocated).every(n => selNodes.has(n.id))}
                        onChange={e => {
                          const next = new Set(selNodes);
                          clusterNodes.filter(n => !n.allocated).forEach(n => e.target.checked ? next.add(n.id) : next.delete(n.id));
                          setSelNodes(next);
                        }}
                        style={{ accentColor: "#4f6ef7", cursor: "pointer" }} />
                    </th>
                    {["节点名称", "节点IP", "状态", "GPU卡数"].map(c => <th key={c} style={thSt}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {clusterNodes.map(n => {
                    const disabled = n.allocated;
                    const checked  = selNodes.has(n.id);
                    return (
                      <tr key={n.id} style={{ opacity: disabled ? 0.6 : 1 }}
                        onMouseEnter={e => { if (!disabled) (e.currentTarget.style.background = "#fafbfd"); }}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={tdSt}>
                          <input type="checkbox" disabled={disabled} checked={checked}
                            onChange={e => { const next = new Set(selNodes); e.target.checked ? next.add(n.id) : next.delete(n.id); setSelNodes(next); }}
                            style={{ accentColor: "#4f6ef7", cursor: disabled ? "not-allowed" : "pointer" }} />
                        </td>
                        <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23" }}>{n.name}</td>
                        <td style={{ ...tdSt, fontFamily: "monospace", fontSize: 12 }}>{n.ip}</td>
                        <td style={tdSt}>
                          <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 7px", borderRadius: 4, background: n.allocated ? "#f3f4f6" : "#f0faf5", color: n.allocated ? "#6b7280" : "#16a34a" }}>
                            {n.allocated ? "已分配" : "未分配"}
                          </span>
                        </td>
                        <td style={tdSt}>{n.gpuCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 10 }}>
                已选：{selNodes.size} 个节点，{selectedGPU} 个GPU
              </div>
            </div>
          )}

          {/* ── Step 3: 授权用户 ── */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>授权用户：</div>
              {/* Search */}
              <div className="flex items-center" style={{ border: "1px solid #e0e3ed", height: 34, borderRadius: 6, padding: "0 10px", marginBottom: 10, gap: 6 }}>
                <Search size={13} color="#9ca3af" />
                <input type="text" placeholder="搜索用户/邮箱地址" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent" }} />
              </div>
              {/* User table */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 16 }}>
                <thead>
                  <tr>
                    <th style={{ ...thSt, width: 32 }} />
                    <th style={thSt}>用户账号</th>
                    <th style={thSt}>昵称</th>
                    <th style={thSt}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const isAuth = authUsers.has(u.id);
                    return (
                      <tr key={u.id}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={tdSt}>
                          <input type="checkbox" checked={isAuth} onChange={e => { const next = new Set(authUsers); e.target.checked ? next.add(u.id) : next.delete(u.id); setAuthUsers(next); }}
                            style={{ accentColor: "#4f6ef7", cursor: "pointer" }} />
                        </td>
                        <td style={{ ...tdSt, fontSize: 12.5, color: "#374151" }}>{u.email}</td>
                        <td style={tdSt}>{u.nickname}</td>
                        <td style={tdSt}>
                          <button onClick={() => { const next = new Set(authUsers); isAuth ? next.delete(u.id) : next.add(u.id); setAuthUsers(next); }}
                            style={{ fontSize: 12.5, color: isAuth ? "#6b7280" : "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>
                            {isAuth ? "撤销" : "添加"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Authorized list */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>已授权用户：</div>
                {[...authUsers].map(uid => {
                  const u = ALL_USERS.find(x => x.id === uid);
                  if (!u) return null;
                  return (
                    <div key={uid} className="flex items-center justify-between" style={{ padding: "7px 10px", background: "#f8f9fc", borderRadius: 6, marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 12.5, color: "#374151" }}>{u.email}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 10 }}>{u.nickname}</span>
                      </div>
                      <button onClick={() => { const next = new Set(authUsers); next.delete(uid); setAuthUsers(next); }}
                        style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>删除</button>
                    </div>
                  );
                })}
                <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 8 }}>已授权 {authUsers.size} 人</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "14px 20px", borderTop: "1px solid #f0f2f7" }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} style={{ height: 34, padding: "0 18px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#374151" }}>上一步</button>
          )}
          {step < 3 ? (
            <button onClick={step === 1 ? goNext1 : () => setStep(s => s + 1)}
              style={{ height: 34, padding: "0 24px", fontSize: 13, fontWeight: 500, border: "none", borderRadius: 6, background: "#4f6ef7", color: "#fff", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>下一步</button>
          ) : (
            <button onClick={handleFinish}
              style={{ height: 34, padding: "0 24px", fontSize: 13, fontWeight: 500, border: "none", borderRadius: 6, background: "#4f6ef7", color: "#fff", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确定</button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Resource Group Detail ────────────────────────────────────────────────────

function RGDetailPage({ rg, onBack }: { rg: RGRow; onBack: () => void }) {
  const nodes = ALL_NODES.filter(n => rg.selectedNodes?.includes(n.id));
  const users = ALL_USERS.filter(u => rg.authorizedUserIds?.includes(u.id));

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }} onClick={onBack}>资源组</span>
        <span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>{rg.name}</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ padding: "16px 24px 24px" }}>
        {/* Basic info */}
        <div style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 10, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23", marginBottom: 14 }}>基本信息</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 24px" }}>
            {[
              { l: "资源组名称", v: rg.name },
              { l: "用途",       v: rg.usage },
              { l: "资源组状态", v: rg.status },
              { l: "GPU总数",    v: String(rg.gpuTotal) },
              { l: "已用GPU",    v: String(rg.gpuUsed) },
              { l: "创建时间",   v: rg.createdAt },
            ].map(item => (
              <div key={item.l}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 3 }}>{item.l}</div>
                <div style={{ fontSize: 13, color: "#1a1d23", fontWeight: 500 }}>{item.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Nodes */}
        <div style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 10, padding: "20px", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>节点列表（{nodes.length}）</div>
          {nodes.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af" }}>暂无节点</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["节点名称","节点IP","状态","GPU卡数"].map(c=><th key={c} style={thSt}>{c}</th>)}</tr></thead>
              <tbody>
                {nodes.map(n=>(
                  <tr key={n.id}>
                    <td style={{ ...tdSt, fontWeight: 500 }}>{n.name}</td>
                    <td style={{ ...tdSt, fontFamily: "monospace", fontSize: 12 }}>{n.ip}</td>
                    <td style={tdSt}><span style={{ fontSize: 12, padding: "2px 7px", borderRadius: 4, background: "#f0faf5", color: "#16a34a" }}>已分配</span></td>
                    <td style={tdSt}>{n.gpuCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Users */}
        <div style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 10, padding: "20px" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>已授权用户（{users.length}）</div>
          {users.length === 0 ? (
            <div style={{ fontSize: 13, color: "#9ca3af" }}>暂无授权用户</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["用户账号","昵称"].map(c=><th key={c} style={thSt}>{c}</th>)}</tr></thead>
              <tbody>
                {users.map(u=>(
                  <tr key={u.id}>
                    <td style={tdSt}>{u.email}</td>
                    <td style={tdSt}>{u.nickname}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Resource Group Data interface ────────────────────────────────────────────

export interface RGRow {
  id: number; name: string; usage: string; nodeCount: number;
  gpuTotal: number; gpuUsed: number; status: string; createdAt: string;
  clusterName?: string; selectedNodes?: string[]; authorizedUserIds?: string[];
}

// ─── Node Page ────────────────────────────────────────────────────────────────

export function NodeListPage() {
  const [nameQ, setNameQ]   = useState("");
  const [nameI, setNameI]   = useState("");
  const [cluster, setCluster] = useState("");
  const [rg, setRg]         = useState("");

  const filtered = ALL_NODES.filter(n => {
    if (nameQ    && !n.name.toLowerCase().includes(nameQ.toLowerCase())) return false;
    if (cluster  && n.cluster !== cluster) return false;
    return true;
  });

  const doSearch = () => setNameQ(nameI);
  const doReset  = () => { setNameI(""); setNameQ(""); setCluster(""); setRg(""); };

  const MultiCell = ({ items }: { items: string[] }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {items.map((item, i) => <span key={i} style={{ fontSize: 11.5, color: "#374151", whiteSpace: "nowrap" }}>{item}</span>)}
    </div>
  );

  const NODE_TABLE = [
    { id: 1, name: "node3", cluster: "h20-node1", rg: "资源组1", status: "Ready" as const, ip: "10.12.1.10", cpu: "0%", mem: "19%", gpu: ["[0]0%","[1]0%","[2]0%","[3]0%","[4]0%","[5]0%","[6]0%","[7]0%"], vram: ["[0]96%","[2]96%","[3]86%","[4]95%","[5]85%","[6]95%","[7]94%"], disk: "52%" },
    { id: 2, name: "node4", cluster: "h20-node1", rg: "资源组1", status: "Ready" as const, ip: "10.12.1.11", cpu: "12%", mem: "34%", gpu: ["[0]45%","[1]62%","[2]38%","[3]71%"], vram: ["[0]72%","[1]85%","[2]61%","[3]90%"], disk: "37%" },
    { id: 3, name: "node1", cluster: "a100-prod-cluster", rg: "推理组-A", status: "Ready" as const, ip: "192.168.1.10", cpu: "8%", mem: "45%", gpu: ["[0]88%","[1]92%"], vram: ["[0]95%","[1]98%"], disk: "61%" },
  ].filter(n => {
    if (nameQ   && !n.name.toLowerCase().includes(nameQ.toLowerCase())) return false;
    if (cluster && n.cluster !== cluster) return false;
    if (rg      && n.rg !== rg) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>资源管理</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>节点</span>
      </div>
      <div style={{ padding: "10px 24px 0", fontSize: 18, fontWeight: 700, color: "#1a1d23", flexShrink: 0 }}>节点</div>
      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "12px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0" style={{ padding: "12px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 32, padding: "0 9px", background: "#fff" }}>
            <input type="text" placeholder="名称搜索" value={nameI} onChange={e => setNameI(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
              style={{ fontSize: 12.5, border: "none", outline: "none", width: 120, background: "transparent" }} />
          </div>
          <FilterDrop value={cluster} onChange={setCluster} opts={CLUSTERS} placeholder="所属集群" />
          <FilterDrop value={rg}      onChange={setRg}      opts={RGROUPS}  placeholder="所属资源组" />
          <SearchBtn onClick={doSearch} />
          <button onClick={doReset} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 13px", fontSize: 12.5, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}>
            <RotateCcw size={12} /> 重置
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["节点名称","所属集群","所属资源组","节点状态","节点IP","CPU","内存","GPU","显存","磁盘"].map(c=><th key={c} style={thSt}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {NODE_TABLE.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td></tr>
              ) : NODE_TABLE.map(n => {
                const sc = n.status === "Ready" ? { bg: "#f0faf5", text: "#16a34a", dot: "#22c55e" } : { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" };
                return (
                  <tr key={n.id}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23" }}>{n.name}</td>
                    <td style={tdSt}>{n.cluster}</td>
                    <td style={tdSt}>{n.rg}</td>
                    <td style={tdSt}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, padding: "2px 7px", borderRadius: 4, background: sc.bg, color: sc.text }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, display: "block" }} />{n.status}
                      </span>
                    </td>
                    <td style={{ ...tdSt, fontFamily: "monospace", fontSize: 12 }}>{n.ip}</td>
                    <td style={tdSt}>{n.cpu}</td>
                    <td style={tdSt}>{n.mem}</td>
                    <td style={tdSt}><MultiCell items={n.gpu} /></td>
                    <td style={tdSt}><MultiCell items={n.vram} /></td>
                    <td style={tdSt}>{n.disk}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "10px 14px", borderTop: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {NODE_TABLE.length} 条</span>
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #4f6ef7", borderRadius: 5, background: "#4f6ef7", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>1</div>
        </div>
      </div>
    </div>
  );
}

// ─── Resource Group Page ──────────────────────────────────────────────────────

const RG_INIT: RGRow[] = [
  { id: 1, name: "推理组-A", usage: "推理", nodeCount: 2, gpuTotal: 16, gpuUsed: 8,  status: "正常", createdAt: "2026-06-24 10:00:00", clusterName: "h20-node1",       selectedNodes: ["n04","n05"], authorizedUserIds: ["u1"] },
  { id: 2, name: "训练组-B", usage: "训练", nodeCount: 3, gpuTotal: 24, gpuUsed: 12, status: "正常", createdAt: "2026-06-20 14:30:00", clusterName: "a100-prod-cluster", selectedNodes: ["a01","a02"], authorizedUserIds: ["u2"] },
  { id: 3, name: "公共组",   usage: "通用", nodeCount: 1, gpuTotal: 8,  gpuUsed: 0,  status: "正常", createdAt: "2026-05-10 09:00:00", clusterName: "h20-node1",       selectedNodes: [],           authorizedUserIds: [] },
];

export function ResourceGroupPage() {
  const [rows, setRows]     = useState<RGRow[]>(RG_INIT);
  const [nameI, setNameI]   = useState("");
  const [nameQ, setNameQ]   = useState("");
  const [clusterF, setClusterF] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editRow, setEditRow]       = useState<RGRow | null>(null);
  const [detailRow, setDetailRow]   = useState<RGRow | null>(null);

  if (detailRow) return <RGDetailPage rg={detailRow} onBack={() => setDetailRow(null)} />;

  const filtered = rows.filter(r => !nameQ || r.name.toLowerCase().includes(nameQ.toLowerCase()));
  const doSearch = () => { setNameQ(nameI); };
  const doReset  = () => { setNameI(""); setNameQ(""); setClusterF(""); };

  const handleDone = (data: RGFormData, existingId?: number) => {
    const nodes = ALL_NODES.filter(n => data.selectedNodes.includes(n.id));
    const totalGpu = nodes.reduce((s, n) => s + n.gpuCount, 0);
    const now = new Date(); const pad = (n: number) => String(n).padStart(2, "0");
    const ts  = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    if (existingId) {
      setRows(prev => prev.map(r => r.id === existingId ? { ...r, name: data.name, usage: data.usage, nodeCount: data.selectedNodes.length, gpuTotal: totalGpu, selectedNodes: data.selectedNodes, authorizedUserIds: data.authorizedUsers } : r));
    } else {
      setRows(prev => [...prev, { id: Date.now(), name: data.name, usage: data.usage, nodeCount: data.selectedNodes.length, gpuTotal: totalGpu, gpuUsed: 0, status: "正常", createdAt: ts, clusterName: data.cluster, selectedNodes: data.selectedNodes, authorizedUserIds: data.authorizedUsers }]);
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>资源管理</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>资源组</span>
      </div>
      <div style={{ padding: "10px 24px 0", fontSize: 18, fontWeight: 700, color: "#1a1d23", flexShrink: 0 }}>资源组</div>
      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "12px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "12px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 32, padding: "0 9px", background: "#fff" }}>
              <input type="text" placeholder="名称搜索" value={nameI} onChange={e => setNameI(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ fontSize: 12.5, border: "none", outline: "none", width: 120, background: "transparent" }} />
            </div>
            <FilterDrop value={clusterF} onChange={setClusterF} opts={CLUSTERS} placeholder="投集群过滤" />
            <SearchBtn onClick={doSearch} />
            <button onClick={doReset} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 13px", fontSize: 12.5, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}>
              <RotateCcw size={12} /> 重置
            </button>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", fontSize: 12.5, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Plus size={13} /> 创建资源组
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["资源组名称","用途","节点数","GPU总数","已用GPU","资源组状态","创建时间","操作"].map(c=><th key={c} style={thSt}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23" }}>{r.name}</td>
                  <td style={tdSt}>{r.usage}</td>
                  <td style={tdSt}>
                    <div className="flex items-center gap-2">
                      <span>{r.nodeCount}</span>
                      <button onClick={() => setDetailRow(r)} style={{ fontSize: 12, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>查看</button>
                    </div>
                  </td>
                  <td style={tdSt}>{r.gpuTotal}</td>
                  <td style={tdSt}>{r.gpuUsed}</td>
                  <td style={tdSt}>
                    <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: "#f0faf5", color: "#16a34a" }}>{r.status}</span>
                  </td>
                  <td style={{ ...tdSt, color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>{r.createdAt}</td>
                  <td style={tdSt}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDetailRow(r)} style={{ fontSize: 12, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>查看</button>
                      <button onClick={() => setEditRow(r)} style={{ fontSize: 12, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>编辑</button>
                      <button onClick={() => setRows(prev => prev.filter(x => x.id !== r.id))} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "10px 14px", borderTop: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {filtered.length} 条</span>
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #4f6ef7", borderRadius: 5, background: "#4f6ef7", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>1</div>
        </div>
      </div>

      {showCreate && (
        <RGWizard
          onClose={() => setShowCreate(false)}
          onDone={data => { handleDone(data); setShowCreate(false); }}
        />
      )}
      {editRow && (
        <RGWizard
          isEdit
          initial={editRow}
          onClose={() => setEditRow(null)}
          onDone={data => { handleDone(data, editRow.id); setEditRow(null); }}
        />
      )}
    </div>
  );
}
