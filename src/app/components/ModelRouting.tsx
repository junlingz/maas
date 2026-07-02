import { useState } from "react";
import { Search, RotateCcw, Plus, ChevronDown, ChevronLeft, ChevronRight, X, AlertCircle } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Strategy {
  id: number; name: string; strategyId: string; desc: string;
  ruleType: string; threshold: number;
  longRoute: string; shortRoute: string; fallbackRoute: string;
  createdAt: string;
}

const INSTANCE_OPTS = [
  "chatglm4-32b-20260507155613025",
  "glm4moe-360b-20260507135934723",
  "glm-turbo-177814520638",
  "glm-4.5-177813357474",
];

const genId = () => "strategy-" + Math.random().toString(36).slice(2, 10) + "-" + Math.random().toString(36).slice(2, 6) + "-" + Math.random().toString(36).slice(2, 6) + "-" + Math.random().toString(36).slice(2, 6) + "-" + Math.random().toString(36).slice(2, 14);

const STRATEGIES_INIT: Strategy[] = [
  {
    id: 1, name: "test",
    strategyId: "strategy-f430b9d6-98d9-41f3-9835-afb6f8ae005c",
    desc: "", ruleType: "上下文规则", threshold: 4000,
    longRoute: "chatglm4-32b-20260507155613025",
    shortRoute: "chatglm4-32b-20260507155613025",
    fallbackRoute: "",
    createdAt: "2026-06-24 18:03:45",
  },
];

// ─── Shared ────────────────────────────────────────────────────────────────────

const inputSt = (hasErr = false): React.CSSProperties => ({
  width: "100%", height: 38, padding: "0 12px", fontSize: 13,
  border: `1px solid ${hasErr ? "#ef4444" : "#e0e3ed"}`, borderRadius: 7,
  outline: "none", color: "#1a1d23", background: "#fff", boxSizing: "border-box" as const,
});

const selectSt = (hasErr = false): React.CSSProperties => ({
  ...inputSt(hasErr), appearance: "none", paddingRight: 32, cursor: "pointer",
});

const FL = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 7, flexShrink: 0 }}>
    {required && <span style={{ color: "#ef4444", marginRight: 3 }}>*</span>}{children}
  </div>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <div style={{ marginBottom: 16 }}>{children}</div>
);

const SelectField = ({ value, onChange, opts, placeholder, hasErr }: {
  value: string; onChange: (v: string) => void; opts: string[]; placeholder: string; hasErr?: boolean;
}) => (
  <div style={{ position: "relative" }}>
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...selectSt(hasErr), color: value ? "#1a1d23" : "#9ca3af" }}>
      <option value="">{placeholder}</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
  </div>
);

// ─── Strategy Form (shared by Create/Edit) ─────────────────────────────────────

interface StrategyFormProps {
  title: string; onClose: () => void;
  initial?: Partial<Strategy>;
  onDone: (data: Omit<Strategy, "id" | "createdAt">) => void;
  editMode?: boolean;
}

function StrategyForm({ title, onClose, initial = {}, onDone, editMode }: StrategyFormProps) {
  const [name, setName]           = useState(initial.name ?? "");
  const [strategyId]              = useState(initial.strategyId ?? genId());
  const [desc, setDesc]           = useState(initial.desc ?? "");
  const [threshold, setThreshold] = useState(initial.threshold ?? 4000);
  const [longRoute, setLongRoute] = useState(initial.longRoute ?? "");
  const [shortRoute, setShortRoute] = useState(initial.shortRoute ?? "");
  const [fallback, setFallback]   = useState(initial.fallbackRoute ?? "");
  const [errors, setErrors]       = useState<Record<string, boolean>>({});

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim())  e.name = true;
    if (!longRoute)    e.long = true;
    if (!shortRoute)   e.short = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    onDone({ name: name.trim(), strategyId, desc, ruleType: "上下文规则", threshold, longRoute, shortRoute, fallbackRoute: fallback });
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1a1d23" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: "20px 24px" }}>
          <Row><FL required>策略名称</FL>
            <input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
              placeholder="请输入策略名称" style={inputSt(errors.name)} />
            {errors.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入策略名称</div>}
          </Row>

          <Row><FL>策略ID</FL>
            <input value={strategyId} readOnly style={{ ...inputSt(), background: "#f8f9fc", color: "#9ca3af" }} />
          </Row>

          <Row><FL>策略描述</FL>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="请输入策略描述"
              style={{ width: "100%", height: 80, padding: "8px 12px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" as const }} />
          </Row>

          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23", margin: "4px 0 16px", paddingBottom: 10, borderBottom: "1px solid #f0f2f7" }}>规则配置</div>

          <Row><FL>规则类型</FL>
            <div style={{ position: "relative" }}>
              <select value="上下文规则" disabled style={{ ...selectSt(), background: "#f8f9fc", color: "#9ca3af" }}>
                <option>上下文规则</option>
              </select>
              <ChevronDown size={14} color="#d1d5db" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
          </Row>

          <Row><FL required>上下文阈值</FL>
            <div className="flex items-center" style={{ border: "1px solid #e0e3ed", borderRadius: 7, overflow: "hidden", height: 38 }}>
              <button onClick={() => setThreshold(t => Math.max(0, t - 100))}
                style={{ width: 44, height: "100%", background: "#f8f9fc", border: "none", borderRight: "1px solid #e0e3ed", cursor: "pointer", fontSize: 18, color: "#6b7280" }}>−</button>
              <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                style={{ flex: 1, height: "100%", textAlign: "center", border: "none", outline: "none", fontSize: 14, fontWeight: 500 }} />
              <button onClick={() => setThreshold(t => t + 100)}
                style={{ width: 44, height: "100%", background: "#f8f9fc", border: "none", borderLeft: "1px solid #e0e3ed", cursor: "pointer", fontSize: 18, color: "#6b7280" }}>+</button>
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 5 }}>设置token数量阈值,超过阈值流向长上下文路由,否则流向短上下文路由</div>
          </Row>

          <Row><FL required>长上下文路由</FL>
            <SelectField value={longRoute} onChange={v => { setLongRoute(v); setErrors(p => ({ ...p, long: false })); }}
              opts={INSTANCE_OPTS} placeholder="请选择模型实例" hasErr={errors.long} />
            {errors.long && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请选择模型实例</div>}
          </Row>

          <Row><FL required>短上下文路由</FL>
            <SelectField value={shortRoute} onChange={v => { setShortRoute(v); setErrors(p => ({ ...p, short: false })); }}
              opts={INSTANCE_OPTS} placeholder="请选择模型实例" hasErr={errors.short} />
            {errors.short && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请选择模型实例</div>}
          </Row>

          <Row><FL>备用路由</FL>
            <SelectField value={fallback} onChange={setFallback} opts={INSTANCE_OPTS} placeholder="请选择模型实例" />
          </Row>
        </div>

        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "14px 24px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 7, padding: "9px 24px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={submit} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 7, padding: "9px 24px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── View Drawer ───────────────────────────────────────────────────────────────

function ViewDrawer({ s, onClose }: { s: Strategy; onClose: () => void }) {
  const DRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-start" style={{ marginBottom: 18 }}>
      <div style={{ width: 110, fontSize: 13, color: "#6b7280", flexShrink: 0, textAlign: "right", paddingRight: 12 }}>{label}：</div>
      <div style={{ flex: 1, color: value ? "#1a1d23" : "#9ca3af", wordBreak: "break-all", ...(label.includes("ID") || label.includes("路由") ? { fontFamily: "monospace", fontSize: 12 } : { fontSize: 13 }) }}>{value || "—"}</div>
    </div>
  );
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1a1d23" }}>查看策略</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-auto" style={{ padding: "24px" }}>
          <DRow label="策略名称" value={s.name} />
          <DRow label="策略ID" value={s.strategyId} />
          <DRow label="策略描述" value={s.desc} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23", margin: "8px 0 18px", paddingBottom: 10, borderBottom: "1px solid #f0f2f7" }}>规则配置</div>
          <DRow label="规则类型" value={s.ruleType} />
          <DRow label="上下文阈值" value={String(s.threshold)} />
          <DRow label="长上下文路由" value={s.longRoute} />
          <DRow label="短上下文路由" value={s.shortRoute} />
          <DRow label="备份路由" value={s.fallbackRoute} />
        </div>
      </div>
    </>
  );
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 420, background: "#fff", borderRadius: 14, zIndex: 201, boxShadow: "0 24px 64px rgba(0,0,0,0.16)", padding: "28px 28px 24px" }}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={24} color="#f59e0b" />
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1a1d23" }}>删除路由策略</span>
        </div>
        <div style={{ fontSize: 14, color: "#374151", marginBottom: 16 }}>
          确定要删除路由策略「<span style={{ fontWeight: 600 }}>{name}</span>」吗?
        </div>
        <div style={{ background: "#f8f9fc", border: "1px solid #e8ebf2", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
          关联推理服务：暂无关联的推理服务
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 7, padding: "9px 24px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={onConfirm} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 7, padding: "9px 24px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function ModelRoutingPage() {
  const [strategies, setStrategies]   = useState<Strategy[]>(STRATEGIES_INIT);
  const [nameInput, setNameInput]     = useState("");
  const [nameQuery, setNameQuery]     = useState("");
  const [page, setPage]               = useState(1);
  const [goPage, setGoPage]           = useState("");

  const [showCreate, setShowCreate]   = useState(false);
  const [editTarget, setEditTarget]   = useState<Strategy | null>(null);
  const [viewTarget, setViewTarget]   = useState<Strategy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Strategy | null>(null);

  const filtered = strategies.filter(s =>
    !nameQuery || s.name.toLowerCase().includes(nameQuery.toLowerCase())
  );

  const doSearch = () => { setNameQuery(nameInput); setPage(1); };
  const doReset  = () => { setNameInput(""); setNameQuery(""); setPage(1); };

  const handleCreate = (data: Omit<Strategy, "id" | "createdAt">) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setStrategies(prev => [...prev, { ...data, id: prev.length + 1, createdAt: ts }]);
  };

  const handleEdit = (data: Omit<Strategy, "id" | "createdAt">) => {
    if (!editTarget) return;
    setStrategies(prev => prev.map(s => s.id === editTarget.id ? { ...s, ...data } : s));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setStrategies(prev => prev.filter(s => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const thSt: React.CSSProperties = { padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13, borderBottom: "1px solid #f0f2f7", background: "#f8f9fc" };
  const tdSt: React.CSSProperties = { padding: "14px 16px", fontSize: 13, borderBottom: "1px solid #f5f7fa" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>模型服务</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>模型路由</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0" style={{ margin: "14px 24px 24px" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ marginBottom: 0, background: "#fff", border: "1px solid #e8ebf2", borderBottom: "none", borderRadius: "12px 12px 0 0", padding: "14px 16px" }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 10px" }}>
              <input type="text" placeholder="策略名称" value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ fontSize: 13, border: "none", outline: "none", width: 150, background: "transparent" }} />
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
          <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Plus size={14} /> 创建路由策略
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto" style={{ background: "#fff", border: "1px solid #e8ebf2", borderTop: "none" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thSt}>策略名称</th>
                <th style={thSt}>策略ID</th>
                <th style={thSt}>描述</th>
                <th style={thSt}>创建时间</th>
                <th style={thSt}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>暂无数据</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f5f8ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23" }}>{s.name}</td>
                  <td style={{ ...tdSt, fontFamily: "monospace", fontSize: 12.5, color: "#6b7280" }}>{s.strategyId}</td>
                  <td style={{ ...tdSt, color: "#6b7280" }}>{s.desc || "—"}</td>
                  <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5 }}>{s.createdAt}</td>
                  <td style={tdSt}>
                    <div className="flex items-center gap-3">
                      {[
                        { label: "编辑", onClick: () => setEditTarget(s) },
                        { label: "查看", onClick: () => setViewTarget(s) },
                        { label: "删除", onClick: () => setDeleteTarget(s), danger: true },
                      ].map(a => (
                        <button key={a.label} onClick={a.onClick}
                          style={{ fontSize: 12.5, color: (a as any).danger ? "#ef4444" : "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = (a as any).danger ? "#dc2626" : "#3b5de8")}
                          onMouseLeave={e => (e.currentTarget.style.color = (a as any).danger ? "#ef4444" : "#4f6ef7")}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0"
          style={{ padding: "12px 16px", background: "#fff", border: "1px solid #e8ebf2", borderTop: "1px solid #f0f2f7", borderRadius: "0 0 12px 12px" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {filtered.length} 条</span>
          <div style={{ position: "relative" }}>
            <select style={{ height: 28, padding: "0 24px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", appearance: "none", color: "#374151" }}>
              <option>10条/页</option>
            </select>
            <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <button disabled style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", opacity: 0.4 }}><ChevronLeft size={13} /></button>
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #4f6ef7", borderRadius: 5, background: "#4f6ef7", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>1</div>
          <button disabled style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", opacity: 0.4 }}><ChevronRight size={13} /></button>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>前往</span>
            <input type="number" value={goPage} onChange={e => setGoPage(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && goPage) { setPage(Number(goPage)); setGoPage(""); } }}
              style={{ width: 40, height: 28, textAlign: "center", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }} />
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>页</span>
          </div>
        </div>
      </div>

      {showCreate && <StrategyForm title="创建路由策略" onClose={() => setShowCreate(false)} onDone={handleCreate} />}
      {editTarget  && <StrategyForm title="编辑路由策略" onClose={() => setEditTarget(null)} initial={editTarget} onDone={handleEdit} editMode />}
      {viewTarget  && <ViewDrawer  s={viewTarget}   onClose={() => setViewTarget(null)} />}
      {deleteTarget && <DeleteModal name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </div>
  );
}
