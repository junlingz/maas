import { useState, useRef, useEffect } from "react";
import { Search, RotateCcw, Plus, ChevronDown, MoreVertical, ChevronLeft, ChevronRight, ArrowLeft, Check } from "lucide-react";

// ─── Create Model Series Wizard ───────────────────────────────────────────────

const STEPS = [
  { id: 1, key: "step1", label: "填写模型信息" },
  { id: 2, key: "step2", label: "配置模型训练" },
  { id: 3, key: "step3", label: "配置模型部署" },
  { id: 4, key: "step4", label: "配置推理服务" },
];

const TYPE1_OPTS = ["通用大模型", "推理模型", "图像模型", "向量模型", "代码模型", "拟人模型"];
const TYPE2_OPTS = ["文生文", "图生文", "文生图", "文生视频", "文生音频", "向量模型", "音频生文", "语音生语音"];

interface Step2Form { _unused?: boolean; }
interface Step3Form { _unused?: boolean; }
interface Step4Form { _unused?: boolean; }

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center" style={{ padding: "20px 40px", background: "#fff", borderBottom: "1px solid #f0f2f7" }}>
      {STEPS.map((step, i) => {
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Badge */}
              <div style={{
                padding: "2px 10px", borderRadius: 4,
                background: active ? "#4f6ef7" : done ? "#f0fdf4" : "#f3f4f6",
                border: done ? "1px solid #bbf7d0" : "none",
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 800, fontStyle: "italic",
                  color: active ? "#fff" : done ? "#16a34a" : "#9ca3af",
                  fontFamily: "system-ui",
                }}>{step.key}</span>
              </div>
              {/* Label */}
              <span style={{
                fontSize: 14, fontWeight: active ? 600 : done ? 500 : 400,
                color: active ? "#4f6ef7" : done ? "#16a34a" : "#9ca3af",
                whiteSpace: "nowrap",
              }}>{step.label}</span>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: done ? "#bbf7d0" : "#e0e3ed", margin: "0 16px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Shared field label
function FL({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 88, fontSize: 13, fontWeight: 500, color: "#374151", flexShrink: 0, paddingTop: 8 }}>
      <span style={{ color: "#ef4444", marginRight: 3 }}>*</span>{children}
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: "100%", height: 38, padding: "0 12px", fontSize: 13, border: "1px solid #e0e3ed",
  borderRadius: 6, outline: "none", color: "#1a1d23", background: "#fff", boxSizing: "border-box",
};
const selectSt: React.CSSProperties = {
  ...({ width: "100%", height: 38, padding: "0 12px", fontSize: 13, border: "1px solid #e0e3ed",
    borderRadius: 6, outline: "none", color: "#374151", background: "#fff", boxSizing: "border-box", appearance: "none" } as React.CSSProperties),
};

function RadioBtn({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2" style={{ cursor: "pointer", fontSize: 13, color: checked ? "#4f6ef7" : "#374151", fontWeight: checked ? 500 : 400 }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%", border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`,
        background: checked ? "#4f6ef7" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s",
      }}>
        {checked && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "block" }} />}
      </span>
      <input type="radio" checked={checked} onChange={onChange} style={{ display: "none" }} />
      {label}
    </label>
  );
}

// Step 1 form
function Step1({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  return (
    <div style={{ maxWidth: 580 }}>
      {[
        { key: "name", label: "模型系列名", type: "combo", placeholder: "请输入模型系列名", opts: [] },
      ].map(() => null)}

      {/* 模型系列名 */}
      <div className="flex items-start gap-4 mb-6">
        <FL>模型系列名</FL>
        <div style={{ flex: 1, position: "relative" }}>
          <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="请输入模型系列名"
            style={inputSt} />
          <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      {/* 支持版本 */}
      <div className="flex items-start gap-4 mb-6">
        <FL>支持版本</FL>
        <input value={form.version} onChange={e => set("version", e.target.value)} placeholder="支持版本"
          style={{ ...inputSt, flex: 1 }} />
      </div>

      {/* 一级分类 */}
      <div className="flex items-start gap-4 mb-6">
        <FL>一级分类</FL>
        <div style={{ flex: 1, position: "relative" }}>
          <select value={form.type1} onChange={e => set("type1", e.target.value)} style={selectSt}>
            <option value="">一级分类</option>
            {TYPE1_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      {/* 二级分类 */}
      <div className="flex items-start gap-4 mb-6">
        <FL>二级分类</FL>
        <div style={{ flex: 1, position: "relative" }}>
          <select value={form.type2} onChange={e => set("type2", e.target.value)} style={selectSt}>
            <option value="">二级分类</option>
            {TYPE2_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown size={14} color="#9ca3af" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        </div>
      </div>

      {/* 是否开源 */}
      <div className="flex items-center gap-4 mb-6">
        <FL>是否开源</FL>
        <div className="flex items-center gap-6">
          <RadioBtn checked={form.openSource === true}  label="是" onChange={() => set("openSource", true)} />
          <RadioBtn checked={form.openSource === false} label="否" onChange={() => set("openSource", false)} />
        </div>
      </div>

      {/* 模型厂商 */}
      <div className="flex items-start gap-4 mb-6">
        <FL>模型厂商</FL>
        <input value={form.vendor} onChange={e => set("vendor", e.target.value)} placeholder="模型厂商"
          style={{ ...inputSt, flex: 1 }} />
      </div>

      {/* 参数量大小 */}
      <div className="flex items-start gap-4 mb-6">
        <FL>参数量大小</FL>
        <input value={form.paramSize} onChange={e => set("paramSize", e.target.value)} placeholder="参数量大小"
          style={{ ...inputSt, flex: 1 }} />
      </div>
    </div>
  );
}

// ── Step 2: 配置模型训练 ──────────────────────────────────────────────────────

interface TrainingRow {
  id: number;
  modelVersion: string;
  type: string;
  resourceType: string;
  finetuneCode: string;
  datasetLimit: number;
  cardCount: string;
  autoPublish: boolean;
  note: string;
}

const MODEL_VERSION_OPTS = ["240528", "v3.0-240601", "dpo-v12-240605", "128k-v0.4", "flash-250414"];
const TYPE_OPTS = ["default", "lora", "qlora", "full"];
const RESOURCE_TYPE_OPTS = ["CPU训练", "GPU训练", "混合训练", "分布式训练"];
const CARD_OPTS = ["部署卡", "共享卡", "独占卡"];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: 40, height: 22, borderRadius: 11,
      background: checked ? "#4f6ef7" : "#d1d5db",
      position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 2, left: checked ? 20 : 2,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
      }} />
    </div>
  );
}

function InlineSelect({ value, onChange, opts, placeholder, width = 130 }: {
  value: string; onChange: (v: string) => void; opts: string[]; placeholder?: string; width?: number;
}) {
  return (
    <div style={{ position: "relative", width }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", height: 32, padding: "0 28px 0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", background: "#fff", color: value ? "#1a1d23" : "#9ca3af", appearance: "none", cursor: "pointer" }}>
        {placeholder && <option value="">{placeholder}</option>}
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={12} color="#9ca3af" style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

function NumberStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center" style={{ border: "1px solid #e0e3ed", borderRadius: 5, overflow: "hidden", width: 100 }}>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, height: 32, padding: "0 6px", fontSize: 12.5, border: "none", outline: "none", textAlign: "center", background: "#fff" }} />
      <div className="flex flex-col" style={{ borderLeft: "1px solid #e0e3ed" }}>
        <button onClick={() => onChange(value + 1)} style={{ height: 16, width: 22, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "#f8f9fc", cursor: "pointer", borderBottom: "1px solid #e0e3ed", padding: 0 }}>
          <ChevronDown size={10} style={{ transform: "rotate(180deg)" }} />
        </button>
        <button onClick={() => onChange(Math.max(0, value - 1))} style={{ height: 16, width: 22, display: "flex", alignItems: "center", justifyContent: "center", border: "none", background: "#f8f9fc", cursor: "pointer", padding: 0 }}>
          <ChevronDown size={10} />
        </button>
      </div>
    </div>
  );
}

function TrainingTable({ rows, setRows, validated }: {
  rows: TrainingRow[];
  setRows: (r: TrainingRow[]) => void;
  validated: boolean;
}) {
  const update = (id: number, patch: Partial<TrainingRow>) =>
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: number) => setRows(rows.filter(r => r.id !== id));

  const cols = [
    { label: "模型版本",     width: 140 },
    { label: "类型",         width: 120 },
    { label: "训练资源类型", width: 150 },
    { label: "微调编码",     width: 180 },
    { label: "训练数据集上限", width: 130 },
    { label: "训练卡数",     width: 120 },
    { label: "训练后上架模型", width: 120 },
    { label: "训练支持参数", width: 100 },
    { label: "说明",         width: 140 },
    { label: "操作",         width: 70  },
  ];

  return (
    <div style={{ overflowX: "auto", border: "1px solid #e8ebf2", borderRadius: 8 }}>
      <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: cols.reduce((s, c) => s + c.width, 0) }}>
        <thead>
          <tr style={{ background: "#f8f9fc" }}>
            {cols.map(c => (
              <th key={c.label} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "#374151", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", width: c.width, minWidth: c.width }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={10} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td></tr>
          ) : rows.map(row => (
            <tr key={row.id} style={{ borderBottom: "1px solid #f5f7fa" }}>
              {/* 模型版本 */}
              <td style={{ padding: "10px 12px" }}>
                <InlineSelect value={row.modelVersion} onChange={v => update(row.id, { modelVersion: v })} opts={MODEL_VERSION_OPTS} placeholder="请选择版本" width={120} />
              </td>
              {/* 类型 */}
              <td style={{ padding: "10px 12px" }}>
                <InlineSelect value={row.type} onChange={v => update(row.id, { type: v })} opts={TYPE_OPTS} width={100} />
              </td>
              {/* 训练资源类型 */}
              <td style={{ padding: "10px 12px" }}>
                <InlineSelect value={row.resourceType} onChange={v => update(row.id, { resourceType: v })} opts={RESOURCE_TYPE_OPTS} placeholder="请选择训练类型" width={130} />
              </td>
              {/* 微调编码 */}
              <td style={{ padding: "10px 12px" }}>
                <input value={row.finetuneCode} onChange={e => update(row.id, { finetuneCode: e.target.value })}
                  placeholder="请输入微调编码"
                  style={{ width: 160, height: 32, padding: "0 8px", fontSize: 12.5, border: `1px solid ${validated && !row.finetuneCode ? "#ef4444" : "#e0e3ed"}`, borderRadius: 5, outline: "none" }} />
                {validated && !row.finetuneCode && (
                  <div style={{ fontSize: 11.5, color: "#ef4444", marginTop: 3 }}>微调模型编码不能为空</div>
                )}
              </td>
              {/* 训练数据集上限 */}
              <td style={{ padding: "10px 12px" }}>
                <NumberStepper value={row.datasetLimit} onChange={v => update(row.id, { datasetLimit: v })} />
              </td>
              {/* 训练卡数 */}
              <td style={{ padding: "10px 12px" }}>
                <InlineSelect value={row.cardCount} onChange={v => update(row.id, { cardCount: v })} opts={CARD_OPTS} width={100} />
              </td>
              {/* 训练后上架模型 */}
              <td style={{ padding: "10px 12px" }}>
                <Toggle checked={row.autoPublish} onChange={() => update(row.id, { autoPublish: !row.autoPublish })} />
              </td>
              {/* 训练支持参数 */}
              <td style={{ padding: "10px 12px" }}>
                <button style={{ fontSize: 12.5, color: "#4f6ef7", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}>配置</button>
              </td>
              {/* 说明 */}
              <td style={{ padding: "10px 12px" }}>
                <input value={row.note} onChange={e => update(row.id, { note: e.target.value })}
                  placeholder="说明"
                  style={{ width: 120, height: 32, padding: "0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }} />
              </td>
              {/* 操作 */}
              <td style={{ padding: "10px 12px" }}>
                <button onClick={() => remove(row.id)}
                  style={{ fontSize: 12.5, fontWeight: 500, color: "#fff", background: "#ef4444", border: "none", borderRadius: 5, padding: "5px 12px", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#ef4444")}>
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function newRow(id: number): TrainingRow {
  return { id, modelVersion: "240528", type: "default", resourceType: "", finetuneCode: "", datasetLimit: 0, cardCount: "部署卡", autoPublish: true, note: "" };
}

// Step 2 form
function Step2({ form: _form, setForm: _setForm }: { form: Step2Form; setForm: (f: Step2Form) => void }) {
  const [tab, setTab] = useState<"sft" | "dpo">("sft");
  const [sftRows, setSftRows] = useState<TrainingRow[]>([]);
  const [dpoRows, setDpoRows] = useState<TrainingRow[]>([]);
  const [nextId, setNextId] = useState(1);
  const [validated, setValidated] = useState(false);

  const addRow = () => {
    const row = newRow(nextId);
    setNextId(n => n + 1);
    if (tab === "sft") setSftRows(r => [...r, row]);
    else setDpoRows(r => [...r, row]);
  };

  const rows = tab === "sft" ? sftRows : dpoRows;
  const setRows = tab === "sft" ? setSftRows : setDpoRows;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Tabs */}
      <div className="flex" style={{ borderBottom: "1px solid #e8ebf2", marginBottom: 20 }}>
        {(["sft", "dpo"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "11px 20px", fontSize: 14, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? "#4f6ef7" : "#6b7280",
            background: "none", border: "none", cursor: "pointer",
            borderBottom: tab === t ? "2px solid #4f6ef7" : "2px solid transparent",
            marginBottom: -1,
          }}>
            {t === "sft" ? "SFT微调" : "DPO训练"}
          </button>
        ))}
      </div>

      {/* Table */}
      <TrainingTable rows={rows} setRows={setRows} validated={validated} />

      {/* Add button */}
      <div style={{ marginTop: 16 }}>
        <button onClick={addRow}
          style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 7, padding: "8px 24px", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
          onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
          添加
        </button>
      </div>
    </div>
  );
}

// ── Step 3: 配置模型部署 ──────────────────────────────────────────────────────

interface DeployRow {
  id: number;
  enabled: boolean;
  deployType: string;
  resourceType: string;
  weights: string;
  quantVersion: string;
  cardCount: number;
  concurrencyMin: number;
  concurrencyMax: number;
  qpsMin: number;
  qpsMax: number;
  versionNote: string;
}

const DEPLOY_TYPE_OPTS   = ["基础模型", "微调模型"];
const RESOURCE_TYPE_OPTS3 = ["default", "Huawei", "Nvidia"];
const QUANT_OPTS          = ["bf16", "fp16", "int8", "int4", "awq", "gptq"];

function CustomDropdown({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: string[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: 130 }}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between"
        style={{ width: "100%", height: 32, padding: "0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: "pointer", color: "#1a1d23" }}>
        <span>{value || "请选择"}</span>
        <ChevronDown size={12} color="#9ca3af" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
          {opts.map(o => (
            <div key={o} onClick={() => { onChange(o); setOpen(false); }}
              style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer", color: o === value ? "#4f6ef7" : "#374151", fontWeight: o === value ? 500 : 400, background: o === value ? "#f5f8ff" : "#fff" }}
              onMouseEnter={e => { if (o !== value) (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = o === value ? "#f5f8ff" : "#fff"; }}>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RangeSteppers({ min, max, onMin, onMax }: { min: number; max: number; onMin: (v: number) => void; onMax: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <NumberStepper value={min} onChange={onMin} />
      <span style={{ fontSize: 12, color: "#6b7280" }}>至</span>
      <NumberStepper value={max} onChange={onMax} />
    </div>
  );
}

function DeployTable({ rows, setRows }: { rows: DeployRow[]; setRows: (r: DeployRow[]) => void }) {
  const update = (id: number, patch: Partial<DeployRow>) =>
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: number) => setRows(rows.filter(r => r.id !== id));

  const cols = [
    { label: "启用状态",         width: 80  },
    { label: "模型部署",         width: 140 },
    { label: "部署资源类型",     width: 150 },
    { label: "部署权重",         width: 220 },
    { label: "量化版本",         width: 130 },
    { label: "部署卡数",         width: 110 },
    { label: "单实例并发上下限", width: 220 },
    { label: "单实例QPS上下限",  width: 220 },
    { label: "部署版本说明",     width: 120 },
    { label: "操作",             width: 70  },
  ];

  return (
    <div style={{ overflowX: "auto", border: "1px solid #e8ebf2", borderRadius: 8 }}>
      <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: cols.reduce((s, c) => s + c.width, 0) }}>
        <thead>
          <tr style={{ background: "#f8f9fc" }}>
            {cols.map(c => (
              <th key={c.label} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "#374151", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", width: c.width, minWidth: c.width }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={10} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td></tr>
          ) : rows.map(row => (
            <tr key={row.id} style={{ borderBottom: "1px solid #f5f7fa" }}>
              {/* 启用状态 */}
              <td style={{ padding: "10px 12px" }}>
                <Toggle checked={row.enabled} onChange={() => update(row.id, { enabled: !row.enabled })} />
              </td>
              {/* 模型部署 */}
              <td style={{ padding: "10px 12px" }}>
                <InlineSelect value={row.deployType} onChange={v => update(row.id, { deployType: v })} opts={DEPLOY_TYPE_OPTS} width={120} />
              </td>
              {/* 部署资源类型 */}
              <td style={{ padding: "10px 12px" }}>
                <CustomDropdown value={row.resourceType} onChange={v => update(row.id, { resourceType: v })} opts={RESOURCE_TYPE_OPTS3} />
              </td>
              {/* 部署权重 */}
              <td style={{ padding: "10px 12px" }}>
                <input value={row.weights} onChange={e => update(row.id, { weights: e.target.value })}
                  placeholder="请输入部署权重"
                  style={{ width: 200, height: 32, padding: "0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }} />
              </td>
              {/* 量化版本 */}
              <td style={{ padding: "10px 12px" }}>
                <InlineSelect value={row.quantVersion} onChange={v => update(row.id, { quantVersion: v })} opts={QUANT_OPTS} width={110} />
              </td>
              {/* 部署卡数 */}
              <td style={{ padding: "10px 12px" }}>
                <NumberStepper value={row.cardCount} onChange={v => update(row.id, { cardCount: v })} />
              </td>
              {/* 单实例并发上下限 */}
              <td style={{ padding: "10px 12px" }}>
                <RangeSteppers min={row.concurrencyMin} max={row.concurrencyMax}
                  onMin={v => update(row.id, { concurrencyMin: v })}
                  onMax={v => update(row.id, { concurrencyMax: v })} />
              </td>
              {/* 单实例QPS上下限 */}
              <td style={{ padding: "10px 12px" }}>
                <RangeSteppers min={row.qpsMin} max={row.qpsMax}
                  onMin={v => update(row.id, { qpsMin: v })}
                  onMax={v => update(row.id, { qpsMax: v })} />
              </td>
              {/* 部署版本说明 */}
              <td style={{ padding: "10px 12px" }}>
                <input value={row.versionNote} onChange={e => update(row.id, { versionNote: e.target.value })}
                  placeholder="无"
                  style={{ width: 100, height: 32, padding: "0 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }} />
              </td>
              {/* 操作 */}
              <td style={{ padding: "10px 12px" }}>
                <button onClick={() => remove(row.id)}
                  style={{ fontSize: 12.5, fontWeight: 500, color: "#fff", background: "#ef4444", border: "none", borderRadius: 5, padding: "5px 12px", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#ef4444")}>
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function newDeployRow(id: number): DeployRow {
  return { id, enabled: true, deployType: "基础模型", resourceType: "default", weights: "deepseek-ai:deepseek-r1:min", quantVersion: "bf16", cardCount: 32, concurrencyMin: 0, concurrencyMax: 0, qpsMin: 100, qpsMax: 100, versionNote: "无" };
}

// Step 3 form
function Step3({ form: _form, setForm: _setForm }: { form: Step3Form; setForm: (f: Step3Form) => void }) {
  const [rows, setRows] = useState<DeployRow[]>([]);
  const [nextId, setNextId] = useState(1);

  const addRow = () => { setRows(r => [...r, newDeployRow(nextId)]); setNextId(n => n + 1); };

  return (
    <div>
      {/* Tab */}
      <div style={{ borderBottom: "1px solid #e8ebf2", marginBottom: 20 }}>
        <button style={{ padding: "11px 20px", fontSize: 14, fontWeight: 600, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", borderBottom: "2px solid #4f6ef7", marginBottom: -1 }}>
          基础模型
        </button>
      </div>

      <DeployTable rows={rows} setRows={setRows} />

      <div style={{ marginTop: 16 }}>
        <button onClick={addRow}
          style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 7, padding: "8px 24px", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
          onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
          添加
        </button>
      </div>
    </div>
  );
}

// ── Step 4: 配置推理服务 ──────────────────────────────────────────────────────

interface InferRow {
  id: number;
  modelVersion: string;
  type: string;
  callModes: string[];
  multiTurn: boolean;
  toolCall: boolean;
  note: string;
}

const CALL_MODE_OPTS = ["SSE调用", "HTTP调用", "gRPC调用", "WebSocket调用"];
const INFER_VERSION_OPTS = ["deepseek-r1", "240528", "v3.0-240601", "dpo-v12-240605", "128k-v0.4"];

function MultiSelect({ values, onChange, opts, placeholder = "请选择" }: {
  values: string[]; onChange: (v: string[]) => void; opts: string[]; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  };
  const remove = (v: string, e: React.MouseEvent) => { e.stopPropagation(); onChange(values.filter(x => x !== v)); };

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 180 }}>
      <div
        onClick={() => setOpen(o => !o)}
        className="flex flex-wrap items-center gap-1"
        style={{ minHeight: 32, padding: "3px 28px 3px 6px", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: "pointer", position: "relative" }}
      >
        {values.length === 0
          ? <span style={{ fontSize: 12.5, color: "#9ca3af" }}>{placeholder}</span>
          : values.map(v => (
            <span key={v} className="flex items-center gap-1"
              style={{ fontSize: 12, background: "#f0f4ff", color: "#4f6ef7", borderRadius: 4, padding: "1px 6px", fontWeight: 500 }}>
              {v}
              <span onClick={e => remove(v, e)} style={{ cursor: "pointer", fontSize: 13, lineHeight: 1, color: "#9ca3af" }}>×</span>
            </span>
          ))}
        <ChevronDown size={12} color="#9ca3af" style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)" }} />
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: "100%", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
          {opts.map(o => (
            <div key={o} onClick={() => toggle(o)}
              className="flex items-center gap-2"
              style={{ padding: "9px 12px", fontSize: 13, cursor: "pointer", background: values.includes(o) ? "#f5f8ff" : "#fff", color: values.includes(o) ? "#4f6ef7" : "#374151" }}
              onMouseEnter={e => { if (!values.includes(o)) (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = values.includes(o) ? "#f5f8ff" : "#fff"; }}>
              <span className="flex items-center justify-center rounded flex-shrink-0"
                style={{ width: 14, height: 14, border: `2px solid ${values.includes(o) ? "#4f6ef7" : "#d1d5db"}`, background: values.includes(o) ? "#4f6ef7" : "#fff" }}>
                {values.includes(o) && <Check size={9} color="#fff" strokeWidth={3} />}
              </span>
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InferTable({ rows, setRows }: { rows: InferRow[]; setRows: (r: InferRow[]) => void }) {
  const update = (id: number, patch: Partial<InferRow>) =>
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: number) => setRows(rows.filter(r => r.id !== id));

  const cols = [
    { label: "模型版本",    width: 170 },
    { label: "类型",        width: 130 },
    { label: "调用方式",    width: 220 },
    { label: "多轮对话",    width: 100 },
    { label: "工具调用",    width: 100 },
    { label: "推理支持参数", width: 110 },
    { label: "推理服务说明", width: 180 },
    { label: "操作",        width: 70  },
  ];

  return (
    <div style={{ overflowX: "auto", border: "1px solid #e8ebf2", borderRadius: 8 }}>
      <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: cols.reduce((s, c) => s + c.width, 0) }}>
        <thead>
          <tr style={{ background: "#f8f9fc" }}>
            {cols.map(c => (
              <th key={c.label} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 500, color: "#374151", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap", width: c.width, minWidth: c.width }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td></tr>
          ) : rows.map(row => (
            <tr key={row.id} style={{ borderBottom: "1px solid #f5f7fa" }}>
              {/* 模型版本 */}
              <td style={{ padding: "10px 12px" }}>
                <InlineSelect value={row.modelVersion} onChange={v => update(row.id, { modelVersion: v })} opts={INFER_VERSION_OPTS} width={150} />
              </td>
              {/* 类型 */}
              <td style={{ padding: "10px 12px" }}>
                <InlineSelect value={row.type} onChange={v => update(row.id, { type: v })} opts={TYPE_OPTS} width={110} />
              </td>
              {/* 调用方式 */}
              <td style={{ padding: "10px 12px" }}>
                <MultiSelect values={row.callModes} onChange={v => update(row.id, { callModes: v })} opts={CALL_MODE_OPTS} placeholder="请选择调用方式" />
              </td>
              {/* 多轮对话 */}
              <td style={{ padding: "10px 12px" }}>
                <Toggle checked={row.multiTurn} onChange={() => update(row.id, { multiTurn: !row.multiTurn })} />
              </td>
              {/* 工具调用 */}
              <td style={{ padding: "10px 12px" }}>
                <Toggle checked={row.toolCall} onChange={() => update(row.id, { toolCall: !row.toolCall })} />
              </td>
              {/* 推理支持参数 */}
              <td style={{ padding: "10px 12px" }}>
                <button style={{ fontSize: 12.5, color: "#4f6ef7", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}>配置</button>
              </td>
              {/* 推理服务说明 */}
              <td style={{ padding: "10px 12px" }}>
                <textarea value={row.note} onChange={e => update(row.id, { note: e.target.value })}
                  style={{ width: 160, height: 52, padding: "6px 8px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
              </td>
              {/* 操作 */}
              <td style={{ padding: "10px 12px" }}>
                <button onClick={() => remove(row.id)}
                  style={{ fontSize: 12.5, fontWeight: 500, color: "#fff", background: "#ef4444", border: "none", borderRadius: 5, padding: "5px 12px", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#dc2626")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#ef4444")}>
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function newInferRow(id: number): InferRow {
  return { id, modelVersion: "deepseek-r1", type: "default", callModes: ["SSE调用"], multiTurn: true, toolCall: true, note: "" };
}

// Step 4 form
function Step4({ form: _form, setForm: _setForm }: { form: Step4Form; setForm: (f: Step4Form) => void }) {
  const [rows, setRows] = useState<InferRow[]>([]);
  const [nextId, setNextId] = useState(1);

  const addRow = () => { setRows(r => [...r, newInferRow(nextId)]); setNextId(n => n + 1); };

  return (
    <div>
      {/* Tab */}
      <div style={{ borderBottom: "1px solid #e8ebf2", marginBottom: 20 }}>
        <button style={{ padding: "11px 20px", fontSize: 14, fontWeight: 600, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", borderBottom: "2px solid #4f6ef7", marginBottom: -1 }}>
          基础模型
        </button>
      </div>

      <InferTable rows={rows} setRows={setRows} />

      <div style={{ marginTop: 16 }}>
        <button onClick={addRow}
          style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 7, padding: "8px 24px", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
          onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
          添加
        </button>
      </div>
    </div>
  );
}

export function CreateModelSeriesPage({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [form1, setForm1] = useState({ name: "", version: "", type1: "", type2: "", openSource: false, vendor: "", paramSize: "" });
  const [form2, setForm2] = useState<Step2Form>({ framework: "", resource: "", epoch: "", batchSize: "" });
  const [form3, setForm3] = useState<Step3Form>({ cluster: "", replicas: "", gpu: "", memory: "" });
  const [form4, setForm4] = useState<Step4Form>({ endpoint: "", timeout: "", concurrency: "", enableLog: false });

  if (submitted) {
    return (
      <div className="flex flex-col h-full">
        <div style={{ padding: "14px 24px", borderBottom: "1px solid #f0f2f7", background: "#fff" }}>
          <button onClick={onBack} className="flex items-center gap-1.5" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#374151", padding: 0 }}>
            <ArrowLeft size={14} /> 返回
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center" style={{ background: "#f5f7fa" }}>
          <div className="flex flex-col items-center rounded-2xl" style={{ background: "#fff", border: "1px solid #e8ebf2", padding: "56px 80px" }}>
            <div className="rounded-full flex items-center justify-center" style={{ width: 64, height: 64, background: "#f0faf5", marginBottom: 20 }}>
              <Check size={32} color="#22c55e" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1d23", marginBottom: 8 }}>创建成功</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 28 }}>模型系列已成功创建，可在模型库列表中查看</div>
            <button onClick={onBack} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 8, padding: "10px 32px", cursor: "pointer" }}>
              返回列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f0f2f7" }}>
        <div className="flex items-center gap-3" style={{ padding: "12px 24px" }}>
          <button onClick={onBack} className="flex items-center gap-1" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#374151", padding: 0, fontWeight: 500 }}>
            <ArrowLeft size={14} /> 返回
          </button>
          <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: "#6b7280" }}>
            <span>首页</span>
            <span>/</span>
            <span style={{ cursor: "pointer", color: "#4f6ef7" }} onClick={onBack}>模型库</span>
            <span>/</span>
            <span style={{ color: "#1a1d23", fontWeight: 500 }}>创建模型系列</span>
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} />
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-auto" style={{ padding: "40px 60px" }}>
        {step === 1 && <Step1 form={form1} setForm={setForm1} />}
        {step === 2 && <Step2 form={form2} setForm={setForm2} />}
        {step === 3 && <Step3 form={form3} setForm={setForm3} />}
        {step === 4 && <Step4 form={form4} setForm={setForm4} />}
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-end gap-3" style={{ padding: "16px 24px", background: "#fff", borderTop: "1px solid #f0f2f7" }}>
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : onBack()}
          style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, padding: "9px 28px", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >上一步</button>
        <button
          onClick={() => step < 4 ? setStep(s => s + 1) : setSubmitted(true)}
          style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 8, padding: "9px 28px", cursor: "pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
          onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}
        >{step < 4 ? "下一步" : "保存"}</button>
      </div>
    </div>
  );
}

// ─── Model Catalog (模型库) — aligned with prototype ─────────────────────────

interface ModelCard {
  id: string;
  name: string;
  developer: string;
  size: string;          // 参数量（B）
  category: string;      // 模型分类
  types: string[];       // 模型类型（多选）
  capabilities?: string[]; // 能力（多选，非必填）
  weightPath: string;
  imagePath: string;
  description: string;
  iconData?: string;     // base64 图标
  createdAt: string;
  // 兼容 App.tsx onDeploy 回调字段
  type1: string;
  paramSize: string;
  contextLen: string;
}

const CATALOG_MODELS: ModelCard[] = [
  { id: "deepseek-v3",       developer: "DeepSeek", name: "deepseek-v3",       size: "671", category: "LLM",            types: ["LLM"],            weightPath: "/models/deepseek-v3",       imagePath: "harbor.xxx.com/lm/vllm:deepseek-v3", description: "DeepSeek V3 通用大语言模型。",          createdAt: "2026-06-24", type1: "通用大模型", paramSize: "671B", contextLen: "128K" },
  { id: "embedding-v3",      developer: "智谱",     name: "embedding-v3",      size: "0.3", category: "Embedding",      types: ["Embedding"],      weightPath: "/models/embedding-v3",      imagePath: "harbor.xxx.com/lm/embedding:v3",      description: "文本向量化模型。",                     createdAt: "2026-04-08", type1: "向量模型", paramSize: "0.3B", contextLen: "8K" },
  { id: "cogvlm-9b",         developer: "智谱",     name: "cogvlm-9b",         size: "9",   category: "Image",          types: ["Image"],          weightPath: "/models/cogvlm-9b",         imagePath: "harbor.xxx.com/lm/vllm:cogvlm-9b",    description: "视觉语言理解模型。",                   createdAt: "2026-03-03", type1: "图像模型", paramSize: "9B",   contextLen: "4K" },
  { id: "chatglm4-32b",      developer: "智谱",     name: "chatglm4-32b",      size: "32",  category: "LLM",            types: ["LLM"],            weightPath: "/models/chatglm4-32b",      imagePath: "harbor.xxx.com/lm/vllm:chatglm4-32b", description: "面向对话与生成任务的通用模型。",       createdAt: "2026-03-03", type1: "通用大模型", paramSize: "32B",  contextLen: "128K" },
  { id: "llama-3-1",         developer: "智谱",     name: "LLaMA 3.1",         size: "70",  category: "LLM",            types: ["LLM"],            weightPath: "/models/llama-3.1",         imagePath: "harbor.xxx.com/lm/vllm:llama-3.1",    description: "LLaMA 3.1 通用语言模型。",             createdAt: "2025-11-24", type1: "通用大模型", paramSize: "70B",  contextLen: "128K" },
  { id: "baichuan-m2-plus",  developer: "千问",     name: "Baichuan-M2 Plus",  size: "13",  category: "LLM",            types: ["LLM"],            weightPath: "/models/baichuan-m2-plus",  imagePath: "harbor.xxx.com/lm/vllm:baichuan-m2-plus", description: "百川通用大语言模型。",             createdAt: "2025-11-24", type1: "通用大模型", paramSize: "13B",  contextLen: "32K" },
  { id: "qwen3-7b",          developer: "千问",     name: "Qwen3-7B",          size: "7",   category: "LLM",            types: ["LLM"],            weightPath: "/models/Qwen3-7B",          imagePath: "harbor.xxx.com/lm/vllm:qwen3-7b",     description: "通义千问 Qwen3 7B 模型。",             createdAt: "2025-10-28", type1: "通用大模型", paramSize: "7B",   contextLen: "32K" },
  { id: "t1-100",            developer: "千问",     name: "T1-100",            size: "100", category: "Reranker",       types: ["Reranker"],       weightPath: "/models/T1-100",            imagePath: "harbor.xxx.com/lm/vllm:t1-100",       description: "面向复杂任务的推理模型。",             createdAt: "2025-12-12", type1: "推理模型", paramSize: "100B", contextLen: "64K" },
  { id: "whisper-large-v3",  developer: "智谱",     name: "whisper-large-v3",  size: "1.5", category: "Speech-to-Text", types: ["Speech-to-Text"], weightPath: "/models/whisper-large-v3", imagePath: "harbor.xxx.com/lm/vllm:whisper-v3",   description: "OpenAI Whisper Large V3 语音识别模型。", createdAt: "2026-01-15", type1: "推理模型", paramSize: "1.5B", contextLen: "—" },
];

const DEVELOPERS = ["智谱", "千问", "DeepSeek"];
const CATEGORY_OPTIONS = ["LLM", "Embedding", "Reranker", "Image", "Text-to-Speech", "Speech-to-Text"];
const CAPABILITY_OPTIONS = ["vision", "tool", "reasoning"];
const IMAGE_OPTIONS = [
  "harbor.xxx.com/lm/vllm:v0.12.0",
  "harbor.xxx.com/lm/vllm:v0.11.0",
  "harbor.xxx.com/lm/sglang:v0.4.0",
  "harbor.xxx.com/lm/vllm:deepseek-v3",
  "harbor.xxx.com/lm/embedding:v3",
];

const BRAND_DEVS: Record<string, { glyph: string; bg: string }> = {
  "智谱":     { glyph: "智", bg: "linear-gradient(145deg,#4267ef,#5668ff)" },
  "千问":     { glyph: "千", bg: "linear-gradient(145deg,#ff5537,#ff7135)" },
  "DeepSeek": { glyph: "D",  bg: "linear-gradient(145deg,#079bd2,#18b7e8)" },
};

function getBrand(developer: string) {
  return BRAND_DEVS[developer] ?? { glyph: (developer || "?").charAt(0).toUpperCase(), bg: "linear-gradient(145deg,#6d28d9,#8b2cf2)" };
}

function categoryTagStyle(category: string): React.CSSProperties {
  if (category === "嵌入模型") return { background: "#ecf9ef", color: "#128237" };
  if (category === "图片模型") return { background: "#fff4e9", color: "#c84413" };
  if (category === "重排模型") return { background: "#fff0f3", color: "#cc1748" };
  return { background: "#edf2ff", color: "#4169f6" };
}

// ─── Card More Menu ────────────────────────────────────────────────────────────

function CardMoreMenu({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", color: "#9ba6b7", borderRadius: 4, fontSize: 18, letterSpacing: 1, lineHeight: 1 }}
        onMouseEnter={e => (e.currentTarget.style.color = "#53627a")}
        onMouseLeave={e => (e.currentTarget.style.color = "#9ba6b7")}>•••</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1px solid #e3e8f1", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,.12)", zIndex: 50, minWidth: 120, overflow: "hidden" }}>
          <button onClick={() => { onView(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#344054" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f2f5fa")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>查看详情</button>
          <button onClick={() => { onEdit(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#344054" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f2f5fa")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>编辑</button>
          <button onClick={() => { onDelete(); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#e5484d" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fff1f1")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>删除</button>
        </div>
      )}
    </div>
  );
}

// ─── Model Card ────────────────────────────────────────────────────────────────

function ModelCardItem({ card, onView, onEdit, onDelete, onDeploy }: {
  card: ModelCard; onView: () => void; onEdit: () => void; onDelete: () => void; onDeploy: () => void;
}) {
  const brand = getBrand(card.developer);
  return (
    <div style={{ minWidth: 0, minHeight: 260, padding: 16, display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #dfe5ee", borderRadius: 10, boxShadow: "0 3px 12px rgba(31,41,55,.03)", transition: "transform .18s,box-shadow .18s,border-color .18s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "#cad4e4"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 20px rgba(31,41,55,.07)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "#dfe5ee"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 3px 12px rgba(31,41,55,.03)"; }}>

      {/* head */}
      <div className="flex items-center" style={{ gap: 12, minWidth: 0, marginBottom: 14 }}>
        {card.iconData ? (
          <img src={card.iconData} alt={card.name} style={{ width: 44, height: 44, borderRadius: 9, flex: "0 0 44px", objectFit: "cover", background: "#f4f6fa" }} />
        ) : (
          <span style={{ width: 44, height: 44, borderRadius: 9, flex: "0 0 44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 19, fontWeight: 750, background: brand.bg, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.12)" }}>{brand.glyph}</span>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 title={card.name} style={{ minWidth: 0, color: "#20232a", fontSize: 17, fontWeight: 700, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{card.name}</h3>
        </div>
        <CardMoreMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* meta */}
      <div style={{ display: "grid", gridTemplateColumns: "70px minmax(0,1fr)", rowGap: 8, alignItems: "center", fontSize: 13, lineHeight: 1.35 }}>
        <span style={{ color: "#9aa5b5", whiteSpace: "nowrap" }}>参数量</span>
        <span style={{ color: "#374151", textAlign: "right", fontWeight: 650, minWidth: 0 }}>{card.size}B</span>
        <span style={{ color: "#9aa5b5", whiteSpace: "nowrap" }}>开发者</span>
        <span title={card.developer} style={{ color: "#374151", textAlign: "right", fontWeight: 650, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.developer}</span>
        <span style={{ color: "#9aa5b5", whiteSpace: "nowrap" }}>模型分类</span>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", minHeight: 22, padding: "2px 7px", borderRadius: 5, fontSize: 12, fontWeight: 650, whiteSpace: "nowrap", ...categoryTagStyle(card.category) }}>{card.category}</span>
        </div>
        <span style={{ color: "#9aa5b5", whiteSpace: "nowrap" }}>创建时间</span>
        <span style={{ color: "#687386", textAlign: "right", fontWeight: 500, fontSize: 12.5 }}>{card.createdAt}</span>
      </div>

      {/* actions */}
      <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #edf0f5", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onView} style={{ border: 0, background: "transparent", color: "#4169f6", fontSize: 14, fontWeight: 650, cursor: "pointer", padding: "5px 0" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#274bd8")} onMouseLeave={e => (e.currentTarget.style.color = "#4169f6")}>查看</button>
        <button onClick={onEdit} style={{ border: 0, background: "transparent", color: "#4169f6", fontSize: 14, fontWeight: 650, cursor: "pointer", padding: "5px 0" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#274bd8")} onMouseLeave={e => (e.currentTarget.style.color = "#4169f6")}>编辑</button>
        <button onClick={onDeploy} style={{ marginLeft: "auto", minWidth: 64, height: 34, border: 0, borderRadius: 7, cursor: "pointer", background: "linear-gradient(135deg,#4168f6,#5668ed)", color: "#fff", fontSize: 14, fontWeight: 700, boxShadow: "0 3px 8px rgba(65,104,246,.16)" }}
          onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg,#3157e9,#4859df)")}
          onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg,#4168f6,#5668ed)")}>部署</button>
      </div>
    </div>
  );
}

// ─── Catalog Create/Edit/View Modal ───────────────────────────────────────────

type CatalogModalMode = "add" | "edit" | "view";

function CatalogModal({ mode, initial, onClose, onSave }: {
  mode: CatalogModalMode;
  initial: ModelCard | null;
  onClose: () => void;
  onSave: (m: ModelCard) => void;
}) {
  const isView = mode === "view";
  const [name, setName]           = useState(initial?.name ?? "");
  const [developer, setDeveloper] = useState(initial?.developer ?? "");
  const [size, setSize]           = useState(initial?.size ?? "");
  const [weightPath, setWeight]   = useState(initial?.weightPath ?? "");
  const [imagePath, setImage]     = useState(initial?.imagePath ?? "");
  const [desc, setDesc]           = useState(initial?.description ?? "");
  const [types, setTypes]         = useState<string[]>(initial?.types ?? ["LLM"]);
  const [capabilities, setCapabilities] = useState<string[]>(initial?.capabilities ?? []);
  const toggleCapability = (c: string) => setCapabilities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const [iconData, setIconData]   = useState<string | undefined>(initial?.iconData);
  const [formErr, setFormErr]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const titleMap: Record<CatalogModalMode, string> = { add: "新建模型", edit: "编辑模型", view: "模型详情" };

  const toggleType = (t: string) => setTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const onIconFile = (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|svg\+xml)$/.test(file.type)) { setFormErr("请上传 PNG、JPG 或 SVG 图片"); return; }
    if (file.size > 5 * 1024 * 1024) { setFormErr("图标文件不能超过 5 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setIconData(String(reader.result || "")); setFormErr(""); };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!name.trim() || !developer.trim() || size === "" || Number(size) < 0 || !iconData || !types.length || !weightPath.trim() || !imagePath.trim()) {
      setFormErr("请填写必填项"); return;
    }
    const category = types[0];
    const t1Map: Record<string, string> = { "LLM": "通用大模型", "Embedding": "向量模型", "Image": "图像模型", "Reranker": "推理模型", "Speech-to-Text": "推理模型", "Text-to-Speech": "推理模型" };
    const result: ModelCard = {
      ...(initial ?? {}),
      id: initial?.id ?? `model-${Date.now()}`,
      name: name.trim(),
      developer: developer.trim(),
      size: size.trim(),
      category,
      types,
      capabilities,
      weightPath: weightPath.trim(),
      imagePath: imagePath.trim(),
      iconData,
      description: desc.trim(),
      createdAt: initial?.createdAt ?? new Date().toISOString().slice(0, 10),
      type1: t1Map[category] ?? "通用大模型",
      paramSize: `${size.trim()}B`,
      contextLen: initial?.contextLen ?? "—",
    };
    onSave(result);
  };

  const inp: React.CSSProperties = { width: "100%", height: 40, padding: "0 12px", fontSize: 13, border: "1px solid #d5ddea", borderRadius: 7, outline: "none", color: "#20232a", background: isView ? "#f8fafc" : "#fff", boxSizing: "border-box" as const, fontFamily: "inherit" };
  const labelSt: React.CSSProperties = { display: "block", marginBottom: 5, color: "#344054", fontSize: 13, fontWeight: 650 };
  const fgSt: React.CSSProperties = { marginBottom: 14 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(31,41,55,.44)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", width: "min(860px, calc(100vw - 32px))", maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column", background: "#fff", borderRadius: 14, zIndex: 201, boxShadow: "0 28px 80px rgba(15,23,42,.24)", overflow: "hidden" }}>
        {/* header */}
        <div className="flex items-center justify-between" style={{ flex: "0 0 auto", padding: "18px 24px 16px", borderBottom: "1px solid #edf0f4" }}>
          <h3 style={{ fontSize: 20, color: "#20232a", margin: 0 }}>{titleMap[mode]}</h3>
          <button onClick={onClose} aria-label="关闭" style={{ width: 30, height: 30, border: "none", background: "none", cursor: "pointer", borderRadius: 6, fontSize: 24, fontWeight: 600, color: "#9aa4b3" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>×</button>
        </div>

        {/* body */}
        <div style={{ flex: "1 1 auto", overflowY: "auto", padding: "18px 24px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20 }}>
            <div style={fgSt}>
              <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>模型名称</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="如 Qwen3-8B" disabled={isView} style={inp} />
            </div>
            <div style={fgSt}>
              <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>开发者</label>
              <input value={developer} onChange={e => setDeveloper(e.target.value)} placeholder="请输入开发者，如 DeepSeek" disabled={isView} style={inp} />
            </div>
            <div style={fgSt}>
              <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>参数量（B）</label>
              <input type="number" value={size} onChange={e => setSize(e.target.value)} placeholder="如 8.0" min={0} step={0.1} disabled={isView} style={inp} />
              <span style={{ display: "block", marginTop: 4, color: "#929dad", fontSize: 11 }}>保留 1 位小数</span>
            </div>
            <div style={fgSt}>
              <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>图标</label>
              <div className="flex items-center" style={{ gap: 12, minHeight: 56 }}>
                <div style={{ width: 56, height: 56, flex: "0 0 56px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #d9e0ea", borderRadius: 8, background: "#f8fafc" }}>
                  {iconData ? (
                    <img src={iconData} alt="预览" style={{ width: 56, height: 56, objectFit: "cover" }} />
                  ) : (
                    <span style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", color: "#586273", fontSize: 22 }}>·</span>
                  )}
                </div>
                {!isView && (
                  <div style={{ minWidth: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5 }}>
                    <div className="flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
                      <label style={{ height: 36, padding: "0 13px", display: "inline-flex", alignItems: "center", border: "1px solid #cfd7e5", borderRadius: 7, color: "#4b5fdf", background: "#fff", fontSize: 13, fontWeight: 650, cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "#7890f6")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "#cfd7e5")}>
                        {iconData ? "重新上传" : "上传本地图片"}
                        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={e => onIconFile(e.target.files?.[0])} style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />
                      </label>
                      {iconData && (
                        <button type="button" onClick={() => setIconData(undefined)} style={{ height: 36, padding: "0 12px", border: "1px solid #f3b8bb", borderRadius: 7, color: "#d83b42", background: "#fff", fontSize: 13, fontWeight: 650, cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = "#e86a70")} onMouseLeave={e => (e.currentTarget.style.borderColor = "#f3b8bb")}>删除</button>
                      )}
                    </div>
                    <span style={{ color: "#929dad", fontSize: 11, whiteSpace: "nowrap" }}>支持 PNG、JPG、SVG，最大 5 MB</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ ...fgSt, gridColumn: "1 / -1" }}>
              <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>模型类型</label>
              <div className="flex flex-wrap" style={{ gap: 9 }}>
                {CATEGORY_OPTIONS.map(c => {
                  const checked = types.includes(c);
                  return (
                    <label key={c} style={{ position: "relative", cursor: isView ? "default" : "pointer" }}>
                      <input type="checkbox" checked={checked} disabled={isView} onChange={() => toggleType(c)} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                      <span style={{ minHeight: 36, padding: "7px 12px", display: "inline-flex", alignItems: "center", border: `1px solid ${checked ? "#7890f6" : "#d9e0ea"}`, borderRadius: 7, background: checked ? "#f0f4ff" : "#fff", color: checked ? "#3f5bd8" : "#596579", fontSize: 13, fontWeight: checked ? 650 : 400, boxShadow: checked ? "0 0 0 1px rgba(81,107,243,.06)" : "none" }}>{c}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div style={{ ...fgSt, gridColumn: "1 / -1" }}>
              <label style={labelSt}>能力<span style={{ color: "#929dad", fontSize: 11, fontWeight: 400, marginLeft: 6 }}>（非必填，可多选）</span></label>
              <div className="flex flex-wrap" style={{ gap: 9 }}>
                {CAPABILITY_OPTIONS.map(c => {
                  const checked = capabilities.includes(c);
                  return (
                    <label key={c} style={{ position: "relative", cursor: isView ? "default" : "pointer" }}>
                      <input type="checkbox" checked={checked} disabled={isView} onChange={() => toggleCapability(c)} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                      <span style={{ minHeight: 36, padding: "7px 12px", display: "inline-flex", alignItems: "center", border: `1px solid ${checked ? "#7890f6" : "#d9e0ea"}`, borderRadius: 7, background: checked ? "#f0f4ff" : "#fff", color: checked ? "#3f5bd8" : "#596579", fontSize: 13, fontWeight: checked ? 650 : 400, boxShadow: checked ? "0 0 0 1px rgba(81,107,243,.06)" : "none" }}>{c}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div style={fgSt}>
              <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>模型权重地址</label>
              <input value={weightPath} onChange={e => setWeight(e.target.value)} placeholder="如 /models/Qwen3-8B" disabled={isView} style={inp} />
              <span style={{ display: "block", marginTop: 4, color: "#929dad", fontSize: 11 }}>NFS 共享盘权重文件路径</span>
            </div>
            <div style={fgSt}>
              <label style={labelSt}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>模型镜像地址</label>
              <input value={imagePath} onChange={e => setImage(e.target.value)} list="catalog-image-options" placeholder="搜索或输入 Harbor 镜像地址" disabled={isView} style={inp} />
              <datalist id="catalog-image-options">
                {IMAGE_OPTIONS.map(o => <option key={o} value={o} />)}
              </datalist>
              <span style={{ display: "block", marginTop: 4, color: "#929dad", fontSize: 11 }}>输入关键字可搜索 Harbor 镜像，也可直接粘贴完整地址</span>
            </div>
            <div style={{ ...fgSt, gridColumn: "1 / -1" }}>
              <label style={labelSt}>简介</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 500))} maxLength={500} placeholder="模型简介，最长 500 字" disabled={isView} style={{ ...inp, height: 72, minHeight: 72, padding: "9px 12px", lineHeight: 1.5, resize: "vertical" }} />
              <span style={{ display: "block", marginTop: 4, color: "#929dad", fontSize: 11, textAlign: "right" }}>{desc.length}/500</span>
            </div>
            {formErr && <div style={{ gridColumn: "1 / -1", margin: "-10px 0 18px", padding: "10px 13px", borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 14 }}>{formErr}</div>}
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end" style={{ flex: "0 0 auto", gap: 10, padding: "12px 24px", borderTop: "1px solid #edf0f4", background: "rgba(255,255,255,.97)" }}>
          <button onClick={onClose} style={{ height: 40, minWidth: 84, justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 8, background: "#fff", color: "#374151", fontSize: 14, fontWeight: 650, cursor: "pointer" }}>取消</button>
          {!isView && (
            <button onClick={submit} style={{ height: 40, minWidth: 92, justifyContent: "center", border: 0, borderRadius: 8, background: "linear-gradient(135deg,#4168f6,#5668ed)", color: "#fff", fontSize: 14, fontWeight: 650, cursor: "pointer" }}>确认</button>
          )}
        </div>
      </div>
    </>
  );
}

export function ModelManagementPage({ onDeploy }: { onDeploy?: (card: ModelCard) => void } = {}) {
  const [models, setModels]           = useState<ModelCard[]>(CATALOG_MODELS);
  const [searchInput, setSearchInput] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDeveloper, setFilterDeveloper] = useState("");
  const [modal, setModal]             = useState<{ mode: CatalogModalMode; id: string | null } | null>(null);

  const filtered = models.filter(m => {
    if (searchInput.trim() && !m.name.toLowerCase().includes(searchInput.trim().toLowerCase())) return false;
    if (filterCategory && !(m.types || [m.category]).includes(filterCategory)) return false;
    if (filterDeveloper && m.developer !== filterDeveloper) return false;
    return true;
  });

  const doReset = () => { setSearchInput(""); setFilterCategory(""); setFilterDeveloper(""); };

  const editing = modal && modal.id ? models.find(m => m.id === modal.id) ?? null : null;

  const handleSave = (m: ModelCard) => {
    setModels(prev => {
      const idx = prev.findIndex(x => x.id === m.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = m; return next; }
      return [m, ...prev];
    });
    setModal(null);
  };

  const selSt: React.CSSProperties = { height: 38, padding: "0 28px 0 12px", fontSize: 13, border: "1px solid #d5ddea", borderRadius: 8, outline: "none", background: "#fff", color: "#344054", appearance: "none", cursor: "pointer", fontFamily: "inherit" };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f6fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 12, color: "#9ca3af" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>模型管理</span><span>/</span>
        <span style={{ color: "#1f2937", fontWeight: 500 }}>模型库</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0" style={{ margin: "16px 24px 24px" }}>
        {/* Toolbar */}
        <div className="flex items-center flex-wrap" style={{ gap: 10, padding: "16px 18px", marginBottom: 20, background: "#fff", border: "1px solid #e3e8f1", borderRadius: 10, boxShadow: "0 2px 10px rgba(31,41,55,.035)" }}>
          {/* search */}
          <div style={{ position: "relative", width: 260, flex: "0 0 260px" }}>
            <Search size={17} color="#aab2bf" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="搜索模型名称..."
              style={{ width: "100%", height: 38, padding: "6px 40px 6px 38px", fontSize: 13, border: "1px solid #d5ddea", borderRadius: 8, outline: "none", fontFamily: "inherit", color: "#20232a" }} />
            {searchInput && (
              <button type="button" aria-label="清空搜索词" onClick={() => setSearchInput("")}
                style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", border: 0, borderRadius: "50%", background: "#c5c9d0", color: "#fff", fontSize: 16, fontWeight: 500, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#9da5b1")}
                onMouseLeave={e => (e.currentTarget.style.background = "#c5c9d0")}>×</button>
            )}
          </div>
          {/* category */}
          <div style={{ position: "relative" }}>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selSt}>
              <option value="">全部类型</option>
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          {/* developer */}
          <div style={{ position: "relative" }}>
            <select value={filterDeveloper} onChange={e => setFilterDeveloper(e.target.value)} style={selSt}>
              <option value="">全部开发者</option>
              {DEVELOPERS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          {/* reset */}
          <button type="button" onClick={doReset} className="flex items-center" style={{ height: 38, padding: "0 14px", gap: 6, border: "1px solid #d5ddea", borderRadius: 8, background: "#fff", color: "#344054", fontSize: 13, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
            <RotateCcw size={16} /> <span>重置</span>
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => setModal({ mode: "add", id: null })}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 38, padding: "0 16px", fontSize: 13, fontWeight: 500, color: "#fff", background: "linear-gradient(135deg,#4168f6,#5668ed)", border: "none", borderRadius: 8, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "linear-gradient(135deg,#3157e9,#4859df)")}
            onMouseLeave={e => (e.currentTarget.style.background = "linear-gradient(135deg,#4168f6,#5668ed)")}>
            <Plus size={14} /> 新建模型
          </button>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div style={{ padding: "80px 20px", color: "#98a2b3", textAlign: "center", background: "#fff", border: "1px dashed #d8dee9", borderRadius: 14 }}>暂无符合条件的模型</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
              {filtered.map(m => (
                <ModelCardItem key={m.id} card={m}
                  onView={() => setModal({ mode: "view", id: m.id })}
                  onEdit={() => setModal({ mode: "edit", id: m.id })}
                  onDelete={() => setModels(prev => prev.filter(x => x.id !== m.id))}
                  onDeploy={() => onDeploy?.(m)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <CatalogModal
          mode={modal.mode}
          initial={editing}
          onClose={() => setModal(null)}
          onSave={handleSave} />
      )}
    </div>
  );
}
