import { useState, useRef, useEffect } from "react";
import { Search, RotateCcw, Plus, ChevronDown, ChevronLeft, ChevronRight, X, AlertCircle, Download, BarChart2, LineChart as LineChartIcon } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface EvalTask {
  id: number; name: string;
  status: "成功" | "失败" | "运行中" | "等待中";
  evalMethod: string; evalModel: string; modelType: string;
  datasets: string[]; desc: string; creator: string; space: string; updatedAt: string;
}

const MODEL_OPTS = ["qwen3-8b", "qwen-32b", "qwen3-72b", "chatglm4-32b", "glm-4-flash", "DeepSeek-R1"];
const PRESET_DATASETS = ["C-Eval-lite", "GSM8k", "MMLU", "HumanEval", "TruthfulQA"];

const TASKS_INIT: EvalTask[] = [
  { id: 1,  name: "eval_20260201722",   status: "成功",  evalMethod: "基线评测", evalModel: "qwen3-8b",                       modelType: "文生文", datasets: ["C-Eval-lite","GSM8k"], desc: "", creator: "admin", space: "admin空间", updatedAt: "2026-01-21 01:06:00" },
  { id: 2,  name: "eval_20260201721",   status: "成功",  evalMethod: "基线评测", evalModel: "qwen3-8b",                       modelType: "文生文", datasets: ["C-Eval-lite"],         desc: "", creator: "admin", space: "admin空间", updatedAt: "2026-01-21 01:06:00" },
  { id: 3,  name: "eval_20260201721",   status: "成功",  evalMethod: "基线评测", evalModel: "qwen-32b",                       modelType: "文生文", datasets: ["GSM8k"],              desc: "", creator: "admin", space: "admin空间", updatedAt: "2026-01-20 18:24:00" },
  { id: 4,  name: "eval_20260201705",   status: "成功",  evalMethod: "基线评测", evalModel: "chatglm4-chat-250414-9b-uid-67513d85352a8e169772da38-ffcb-20260119142194 45-4bcqm-glm49b.full", modelType: "文生文", datasets: ["C-Eval-lite","MMLU"], desc: "", creator: "admin", space: "admin空间", updatedAt: "2026-01-20 17:12:00" },
  { id: 5,  name: "eval_20260201705",   status: "成功",  evalMethod: "基线评测", evalModel: "qwen3-8b",                       modelType: "文生文", datasets: ["C-Eval-lite"],         desc: "", creator: "admin", space: "admin空间", updatedAt: "2026-01-20 19:21:00" },
  { id: 6,  name: "eval_20260201705",   status: "失败",  evalMethod: "基线评测", evalModel: "qwen-32b",                       modelType: "文生文", datasets: ["GSM8k"],              desc: "", creator: "admin", space: "admin空间", updatedAt: "2026-01-20 17:12:00" },
  { id: 7,  name: "eval_20251224_1536", status: "成功",  evalMethod: "基线评测", evalModel: "qwen-32b,qwen3-8b",              modelType: "文生文", datasets: ["C-Eval-lite","GSM8k"], desc: "", creator: "admin", space: "admin空间", updatedAt: "2025-12-24 16:15:00" },
  { id: 8,  name: "eval_20251204",      status: "运行中", evalMethod: "基线评测", evalModel: "qwen3-8b",                       modelType: "文生文", datasets: ["C-Eval-lite"],         desc: "", creator: "admin", space: "admin空间", updatedAt: "2025-12-04 10:00:00" },
];

const STATUS_CFG = {
  "成功":  { bg: "#f0faf5", text: "#16a34a", border: "#bbf7d0" },
  "失败":  { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  "运行中":{ bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  "等待中":{ bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb" },
};

// ─── Chart data for detail ─────────────────────────────────────────────────────

const makeChartData = (task: EvalTask) => task.datasets.map(ds => ({
  name: ds,
  [task.evalModel.split(",")[0]]: Math.round(60 + Math.random() * 30),
}));

// ─── Create Task Drawer ────────────────────────────────────────────────────────

function CreateDrawer({ onClose, onDone }: { onClose: () => void; onDone: (t: Omit<EvalTask, "id" | "updatedAt">) => void }) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultName = `eval_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;

  const [name, setName]           = useState(defaultName);
  const [desc, setDesc]           = useState("");
  const [modelType, setModelType] = useState("文生文");
  const [evalModels, setEvalModels] = useState<string[]>([]);
  const [dataMode, setDataMode]   = useState<"preset" | "user">("preset");
  const [datasets, setDatasets]   = useState<string[]>([]);
  const [modelOpen, setModelOpen] = useState(false);
  const [dataOpen, setDataOpen]   = useState(false);
  const [errors, setErrors]       = useState<Record<string, boolean>>({});
  const modelRef = useRef<HTMLDivElement>(null);
  const dataRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
      if (dataRef.current  && !dataRef.current.contains(e.target as Node))  setDataOpen(false);
    };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggleModel = (m: string) => {
    if (evalModels.includes(m)) setEvalModels(prev => prev.filter(x => x !== m));
    else if (evalModels.length < 3) setEvalModels(prev => [...prev, m]);
  };
  const toggleDataset = (d: string) => setDatasets(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim())         e.name = true;
    if (!evalModels.length)   e.model = true;
    if (!datasets.length)     e.data = true;
    if (Object.keys(e).length) { setErrors(e); return; }
    onDone({ name: name.trim(), desc, status: "等待中", evalMethod: "基线评测", evalModel: evalModels.join(","), modelType, datasets, creator: "admin", space: "admin空间" });
    onClose();
  };

  const inputSt: React.CSSProperties = { width: "100%", height: 38, padding: "0 12px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, outline: "none", color: "#1a1d23", boxSizing: "border-box" as const };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1a1d23" }}>创建评测任务</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: "20px 24px" }}>
          {/* 任务名称 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 7 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>任务名称</div>
            <input value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: false })); }}
              style={{ ...inputSt, borderColor: errors.name ? "#ef4444" : "#e0e3ed" }} />
            {errors.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入任务名称</div>}
          </div>

          {/* 任务描述 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 7 }}>任务描述</div>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="请输入任务描述"
              style={{ width: "100%", height: 70, padding: "8px 12px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" as const }} />
          </div>

          {/* 评测方式 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>评测方式</div>
            <div style={{ border: "2px solid #4f6ef7", borderRadius: 8, padding: "12px 14px", background: "#f5f8ff", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "#4f6ef7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BarChart2 size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23" }}>模型基线评测</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>选择评测策略，评测模型的基本能力</div>
              </div>
            </div>
          </div>

          {/* 模型类型 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>模型类型</div>
            <div className="flex items-center gap-4">
              {["文生文", "图生文"].map(t => (
                <label key={t} className="flex items-center gap-2" style={{ cursor: "pointer", fontSize: 13, color: modelType === t ? "#4f6ef7" : "#374151" }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${modelType === t ? "#4f6ef7" : "#d1d5db"}`, background: modelType === t ? "#4f6ef7" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {modelType === t && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
                  </span>
                  <input type="radio" checked={modelType === t} onChange={() => setModelType(t)} style={{ display: "none" }} />{t}
                </label>
              ))}
            </div>
          </div>

          {/* 评测模型 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 7 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>评测模型</div>
            <div ref={modelRef} style={{ position: "relative" }}>
              <div onClick={() => setModelOpen(o => !o)}
                className="flex flex-wrap items-center gap-1.5"
                style={{ minHeight: 38, padding: "5px 36px 5px 10px", border: `1px solid ${errors.model ? "#ef4444" : "#e0e3ed"}`, borderRadius: 7, background: "#fff", cursor: "pointer", position: "relative" }}>
                {evalModels.length === 0
                  ? <span style={{ fontSize: 13, color: "#9ca3af" }}>请选择</span>
                  : evalModels.map(m => (
                    <span key={m} className="flex items-center gap-1" style={{ fontSize: 12, background: "#eff4ff", color: "#4f6ef7", borderRadius: 4, padding: "2px 8px" }}>
                      {m}
                      <span onClick={e => { e.stopPropagation(); toggleModel(m); }} style={{ cursor: "pointer", color: "#9ca3af", marginLeft: 2 }}>×</span>
                    </span>
                  ))}
                <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }} />
              </div>
              {modelOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
                  {MODEL_OPTS.map(m => (
                    <div key={m} onClick={() => toggleModel(m)} className="flex items-center gap-2"
                      style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer", background: evalModels.includes(m) ? "#f5f8ff" : "#fff", color: evalModels.includes(m) ? "#4f6ef7" : "#374151" }}
                      onMouseEnter={e => { if (!evalModels.includes(m)) (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = evalModels.includes(m) ? "#f5f8ff" : "#fff"; }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${evalModels.includes(m) ? "#4f6ef7" : "#d1d5db"}`, background: evalModels.includes(m) ? "#4f6ef7" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {evalModels.includes(m) && <span style={{ width: 8, height: 8, borderRadius: 1, background: "#fff", display: "block" }} />}
                      </span>
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 5 }}>选择评测的模型列表，可多选，不超过3个</div>
            {errors.model && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请至少选择一个模型</div>}
          </div>

          {/* 评测数据 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>评测数据</div>
            <div className="flex items-center gap-4 mb-3">
              {[["preset","预置数据集"],["user","用户数据集"]].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2" style={{ cursor: "pointer", fontSize: 13, color: dataMode === val ? "#4f6ef7" : "#374151" }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${dataMode === val ? "#4f6ef7" : "#d1d5db"}`, background: dataMode === val ? "#4f6ef7" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {dataMode === val && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
                  </span>
                  <input type="radio" checked={dataMode === val} onChange={() => setDataMode(val as "preset" | "user")} style={{ display: "none" }} />{label}
                </label>
              ))}
            </div>
            <div ref={dataRef} style={{ position: "relative" }}>
              <div onClick={() => setDataOpen(o => !o)}
                className="flex flex-wrap items-center gap-1.5"
                style={{ minHeight: 38, padding: "5px 36px 5px 10px", border: `1px solid ${errors.data ? "#ef4444" : "#e0e3ed"}`, borderRadius: 7, background: "#fff", cursor: "pointer", position: "relative" }}>
                {datasets.length === 0
                  ? <span style={{ fontSize: 13, color: "#9ca3af" }}>请选择</span>
                  : datasets.map(d => (
                    <span key={d} className="flex items-center gap-1" style={{ fontSize: 12, background: "#eff4ff", color: "#4f6ef7", borderRadius: 4, padding: "2px 8px" }}>
                      {d}<span onClick={e => { e.stopPropagation(); toggleDataset(d); }} style={{ cursor: "pointer", color: "#9ca3af", marginLeft: 2 }}>×</span>
                    </span>
                  ))}
                <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }} />
              </div>
              {dataOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 10, overflow: "hidden" }}>
                  {PRESET_DATASETS.map(d => (
                    <div key={d} onClick={() => toggleDataset(d)} className="flex items-center gap-2"
                      style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer", background: datasets.includes(d) ? "#f5f8ff" : "#fff", color: datasets.includes(d) ? "#4f6ef7" : "#374151" }}
                      onMouseEnter={e => { if (!datasets.includes(d)) (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = datasets.includes(d) ? "#f5f8ff" : "#fff"; }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${datasets.includes(d) ? "#4f6ef7" : "#d1d5db"}`, background: datasets.includes(d) ? "#4f6ef7" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {datasets.includes(d) && <span style={{ width: 8, height: 8, borderRadius: 1, background: "#fff", display: "block" }} />}
                      </span>
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.data && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请至少选择一个数据集</div>}
          </div>
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

// ─── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({ task, onClose }: { task: EvalTask; onClose: () => void }) {
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const sc = STATUS_CFG[task.status];
  const chartData = makeChartData(task);
  const modelKey = task.evalModel.split(",")[0];

  const DR = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start" style={{ marginBottom: 14 }}>
      <div style={{ width: 80, fontSize: 13, color: "#6b7280", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, color: "#1a1d23" }}>{children}</div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 560, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 17, fontWeight: 600, color: "#1a1d23" }}>评测任务详情</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-auto" style={{ padding: "20px 24px" }}>
          <DR label="任务名称">{task.name}</DR>
          <DR label="任务描述">{task.desc || "—"}</DR>
          <DR label="评测方式">{task.evalMethod}</DR>
          <DR label="任务状态">
            <span style={{ fontSize: 12.5, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{task.status}</span>
          </DR>
          <DR label="评测模型"><span style={{ fontFamily: "monospace", fontSize: 12.5, wordBreak: "break-all" }}>{task.evalModel}</span></DR>
          <DR label="模型类型">{task.modelType}</DR>
          <DR label="评测数据">预置数据集 {task.datasets.join(", ")}</DR>
          <DR label="所属空间">{task.space}</DR>
          <DR label="创建人">{task.creator}</DR>
          <DR label="更新时间">{task.updatedAt}</DR>

          {/* 评测结果 */}
          {task.status === "成功" && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 1, background: "#f0f2f7", marginBottom: 16 }} />
              <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23", display: "flex", alignItems: "center", gap: 6 }}>
                  <BarChart2 size={15} color="#4f6ef7" /> 评测结果
                </div>
                <div className="flex items-center gap-2">
                  <button style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#4f6ef7", background: "#eff4ff", border: "1px solid #c7d9ff", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                    <Download size={12} /> 下载
                  </button>
                  <button onClick={() => setChartType(t => t === "bar" ? "line" : "bar")} style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    {chartType === "bar" ? <LineChartIcon size={13} /> : <BarChart2 size={13} />}
                    {chartType === "bar" ? "切换为折线图" : "切换为柱状图"}
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                {chartType === "bar" ? (
                  <BarChart data={chartData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#e8ebf2" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12, borderWidth: 1, borderStyle: "solid", borderColor: "#e0e3ed", borderRadius: 7 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey={modelKey} fill="#4f6ef7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#e8ebf2" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12, borderWidth: 1, borderStyle: "solid", borderColor: "#e0e3ed", borderRadius: 7 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey={modelKey} stroke="#4f6ef7" strokeWidth={2} dot={{ r: 4, fill: "#4f6ef7" }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ task, onClose, onConfirm }: { task: EvalTask; onClose: () => void; onConfirm: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 380, background: "#fff", borderRadius: 14, zIndex: 201, boxShadow: "0 24px 64px rgba(0,0,0,0.16)", padding: "24px 24px 20px" }}>
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle size={22} color="#f59e0b" />
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>删除评测任务</span>
        </div>
        <div style={{ fontSize: 13.5, color: "#374151", marginBottom: 14 }}>确定要删除评测任务 <span style={{ fontWeight: 600 }}>{task.name}</span> 吗?</div>
        <div style={{ fontSize: 13, color: "#6b7280", background: "#f8f9fc", borderRadius: 7, padding: "10px 14px", marginBottom: 20 }}>
          评测模型：{task.evalModel.split(",")[0]}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 7, padding: "8px 20px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
          <button onClick={onConfirm} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 7, padding: "8px 20px", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function ModelEvaluationPage() {
  const [tasks, setTasks]           = useState<EvalTask[]>(TASKS_INIT);
  const [methodFilter, setMethodFilter] = useState("");
  const [nameInput, setNameInput]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [nameQuery, setNameQuery]   = useState("");
  const [page, setPage]             = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [viewTask, setViewTask]     = useState<EvalTask | null>(null);
  const [deleteTask, setDeleteTask] = useState<EvalTask | null>(null);

  const PAGE_SIZE = 10;
  const filtered = tasks.filter(t => {
    if (methodFilter && t.evalMethod !== methodFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (nameQuery    && !t.name.toLowerCase().includes(nameQuery.toLowerCase())) return false;
    return true;
  });
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const doSearch = () => { setNameQuery(nameInput); setPage(1); };
  const doReset  = () => { setMethodFilter(""); setNameInput(""); setStatusFilter(""); setNameQuery(""); setPage(1); };

  const handleCreate = (data: Omit<EvalTask, "id" | "updatedAt">) => {
    const now = new Date(); const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setTasks(prev => [{ ...data, id: prev.length + 1, updatedAt: ts }, ...prev]);
  };

  const thSt: React.CSSProperties = { padding: "11px 14px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", background: "#f8f9fc" };
  const tdSt: React.CSSProperties = { padding: "13px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>模型评测</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>评测任务</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 评测方式 */}
            <div style={{ position: "relative" }}>
              <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1); }}
                style={{ height: 34, padding: "0 28px 0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: methodFilter ? "#1a1d23" : "#9ca3af", width: 110 }}>
                <option value="">评测方式</option>
                <option value="基线评测">基线评测</option>
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            {/* 任务名称 */}
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 10px" }}>
              <input type="text" placeholder="任务名称" value={nameInput}
                onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
                style={{ fontSize: 13, border: "none", outline: "none", width: 130, background: "transparent" }} />
            </div>
            {/* 任务状态 */}
            <div style={{ position: "relative" }}>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                style={{ height: 34, padding: "0 28px 0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", background: "#fff", appearance: "none", color: statusFilter ? "#1a1d23" : "#9ca3af", width: 100 }}>
                <option value="">任务状态</option>
                {["成功","失败","运行中","等待中"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
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
            <Plus size={14} /> 创建评测任务
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["任务名称","任务状态","评测方式","评测模型","模型类型","创建时间","创建人","所属空间","操作"].map(c => (
                  <th key={c} style={thSt}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>暂无数据</td></tr>
              ) : pageRows.map(task => {
                const sc = STATUS_CFG[task.status];
                return (
                  <tr key={task.id}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23", maxWidth: 130 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.name}</div>
                    </td>
                    <td style={tdSt}>
                      <span style={{ fontSize: 12.5, fontWeight: 500, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{task.status}</span>
                    </td>
                    <td style={tdSt}>{task.evalMethod}</td>
                    <td style={{ ...tdSt, maxWidth: 160 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 12, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.evalModel}</div>
                    </td>
                    <td style={tdSt}>{task.modelType}</td>
                    <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{task.updatedAt}</td>
                    <td style={tdSt}>{task.creator}</td>
                    <td style={tdSt}>{task.space}</td>
                    <td style={tdSt}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setViewTask(task)} style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>查看</button>
                        <button onClick={() => setDeleteTask(task)} style={{ fontSize: 12.5, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}>
                          {task.status === "运行中" ? "取消" : "删除"}
                        </button>
                      </div>
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
            <select style={{ height: 28, padding: "0 24px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", appearance: "none", color: "#374151" }}>
              <option>10条/页</option>
            </select>
            <ChevronDown size={11} color="#9ca3af" style={{ position: "absolute", right: 5, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
            <ChevronLeft size={13} />
          </button>
          {[1, 2].map(n => (
            <button key={n} onClick={() => setPage(n)}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderColor: page === n ? "#4f6ef7" : "#e0e3ed", borderRadius: 5, background: page === n ? "#4f6ef7" : "#fff", color: page === n ? "#fff" : "#374151", fontSize: 12.5, fontWeight: page === n ? 600 : 400, cursor: "pointer" }}>
              {n}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(2, p + 1))} disabled={page === 2}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: page === 2 ? "not-allowed" : "pointer", opacity: page === 2 ? 0.4 : 1 }}>
            <ChevronRight size={13} />
          </button>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>前往</span>
            <input type="number" defaultValue={1} style={{ width: 40, height: 28, textAlign: "center", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }} />
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>页</span>
          </div>
        </div>
      </div>

      {showCreate && <CreateDrawer onClose={() => setShowCreate(false)} onDone={handleCreate} />}
      {viewTask   && <DetailDrawer task={viewTask} onClose={() => setViewTask(null)} />}
      {deleteTask && <DeleteModal  task={deleteTask} onClose={() => setDeleteTask(null)} onConfirm={() => { setTasks(prev => prev.filter(t => t.id !== deleteTask.id)); setDeleteTask(null); }} />}
    </div>
  );
}
