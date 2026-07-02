import { useState } from "react";
import { Search, RotateCcw, Plus, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface MiningTask {
  id: number;
  name: string;
  modelName: string;
  detailCount: number;
  createdAt: string;
  endAt: string;
  status: "运行中" | "已完成" | "失败" | "已停止";
  processed: number;
}

const MODEL_OPTS = [
  "qwen-20260223T045281",
  "GLM-4-Flash",
  "chatglm4-32b-20260507",
  "DeepSeek-R1-671B",
];

const TASKS_INIT: MiningTask[] = [
  {
    id: 1, name: "test", modelName: "qwen-20260223T045281", detailCount: 1,
    createdAt: "2026-03-24 11:17:08", endAt: "2026-03-27 11:00:00",
    status: "运行中", processed: 0,
  },
];

const STATUS_CFG = {
  "运行中": { bg: "#f0faf5", text: "#16a34a", border: "#bbf7d0" },
  "已完成": { bg: "#eff4ff", text: "#4f6ef7", border: "#c7d9ff" },
  "失败":   { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  "已停止": { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb" },
};

// ─── Create Task Modal ────────────────────────────────────────────────────────

function CreateTaskModal({ onClose, onDone }: { onClose: () => void; onDone: (task: Omit<MiningTask, "id" | "detailCount" | "processed">) => void }) {
  const [name, setName]       = useState("");
  const [desc, setDesc]       = useState("");
  const [model, setModel]     = useState("");
  const [timeRange, setTimeRange] = useState(1);
  const [errors, setErrors]   = useState<Record<string, boolean>>({});

  const inputSt = (hasErr = false): React.CSSProperties => ({
    width: "100%", height: 38, padding: "0 12px", fontSize: 13,
    border: `1px solid ${hasErr ? "#ef4444" : "#e0e3ed"}`,
    borderRadius: 7, outline: "none", boxSizing: "border-box" as const, color: "#1a1d23",
  });

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (!model)       e.model = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const createdAt = fmt(now);
    const endDate   = new Date(now); endDate.setDate(endDate.getDate() + timeRange);
    onDone({ name: name.trim(), modelName: model, createdAt, endAt: fmt(endDate), status: "运行中" });
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 480, background: "#fff", borderRadius: 14, zIndex: 201,
        boxShadow: "0 24px 64px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>创建挖掘任务</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* 任务名称 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 7 }}>
              <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>任务名称
            </div>
            <input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
              placeholder="输入任务名称（英文、数字）"
              style={inputSt(errors.name)} />
            {errors.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入任务名称</div>}
          </div>

          {/* 任务说明 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 7 }}>任务说明</div>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="输入任务说明（英文、数字）"
              style={inputSt()} />
          </div>

          {/* 选择模型 */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 7 }}>
              <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>选择模型
            </div>
            <div style={{ position: "relative" }}>
              <select value={model} onChange={e => { setModel(e.target.value); setErrors(p => ({ ...p, model: false })); }}
                style={{ ...inputSt(errors.model), appearance: "none", paddingRight: 32, color: model ? "#1a1d23" : "#9ca3af" }}>
                <option value="">请选择</option>
                {MODEL_OPTS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            {errors.model && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请选择模型</div>}
          </div>

          {/* 时间范围 */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 10 }}>时间范围</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center" style={{ border: "1px solid #e0e3ed", borderRadius: 7, overflow: "hidden", height: 38 }}>
                <button onClick={() => setTimeRange(r => Math.max(1, r - 1))}
                  style={{ width: 36, height: "100%", background: "#f8f9fc", border: "none", borderRight: "1px solid #e0e3ed", cursor: "pointer", fontSize: 16, color: "#6b7280" }}>−</button>
                <input type="number" value={timeRange} onChange={e => setTimeRange(Math.min(30, Math.max(1, Number(e.target.value))))}
                  style={{ width: 52, height: "100%", textAlign: "center", border: "none", outline: "none", fontSize: 14, fontWeight: 500 }} />
                <button onClick={() => setTimeRange(r => Math.min(30, r + 1))}
                  style={{ width: 36, height: "100%", background: "#f8f9fc", border: "none", borderLeft: "1px solid #e0e3ed", cursor: "pointer", fontSize: 16, color: "#6b7280" }}>+</button>
              </div>
              <span style={{ fontSize: 13, color: "#374151" }}>天</span>
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>自定义范围为 1 ~ 30 天</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "14px 24px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={submit}
            style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 7, padding: "9px 32px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function LogMiningPage() {
  const [tasks, setTasks]         = useState<MiningTask[]>(TASKS_INIT);
  const [nameInput, setNameInput] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage]           = useState(1);

  const filtered = tasks.filter(t =>
    !nameQuery || t.name.toLowerCase().includes(nameQuery.toLowerCase())
  );

  const doSearch = () => { setNameQuery(nameInput); setPage(1); };
  const doReset  = () => { setNameInput(""); setNameQuery(""); setPage(1); };

  const handleCreate = (task: Omit<MiningTask, "id" | "detailCount" | "processed">) => {
    setTasks(prev => [...prev, { ...task, id: prev.length + 1, detailCount: 0, processed: 0 }]);
  };

  const thSt: React.CSSProperties = { padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", background: "#f8f9fc" };
  const tdSt: React.CSSProperties = { padding: "13px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>统计监控</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>日志挖掘</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 10px" }}>
              <input type="text" placeholder="任务名称" value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ fontSize: 13, border: "none", outline: "none", width: 140, background: "transparent" }} />
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
            <Plus size={14} /> 新增挖掘任务
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["任务名称", "大模型名称", "详细内容", "创建时间", "结束时间", "任务状态", "已处理量", "操作"].map(c => (
                  <th key={c} style={thSt}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>暂无数据</td></tr>
              ) : filtered.map(task => {
                const sc = STATUS_CFG[task.status];
                return (
                  <tr key={task.id}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23" }}>{task.name}</td>
                    <td style={{ ...tdSt, fontFamily: "monospace", fontSize: 12.5, color: "#374151" }}>{task.modelName}</td>
                    <td style={{ ...tdSt, color: "#374151" }}>{task.detailCount} 条</td>
                    <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5 }}>{task.createdAt}</td>
                    <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5 }}>{task.endAt}</td>
                    <td style={tdSt}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, padding: "3px 10px", borderRadius: 5, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {task.status}
                      </span>
                    </td>
                    <td style={{ ...tdSt, color: "#374151" }}>{task.processed}</td>
                    <td style={tdSt}>
                      <button style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>详情</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {filtered.length} 条</span>
          <div style={{ position: "relative" }}>
            <select style={{ height: 28, padding: "0 22px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", appearance: "none", color: "#374151" }}>
              <option>10条/页</option>
            </select>
            <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <button disabled style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", opacity: 0.4 }}><ChevronLeft size={13} /></button>
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #4f6ef7", borderRadius: 5, background: "#4f6ef7", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>{page}</div>
          <button disabled style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", opacity: 0.4 }}><ChevronRight size={13} /></button>
        </div>
      </div>

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} onDone={handleCreate} />}
    </div>
  );
}
