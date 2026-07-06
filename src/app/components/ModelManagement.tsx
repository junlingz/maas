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
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 28 }}>模型系列已成功创建，可在模型管理列表中查看</div>
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
            <span style={{ cursor: "pointer", color: "#4f6ef7" }} onClick={onBack}>模型管理</span>
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

// ─── Model card data ───────────────────────────────────────────────────────────

interface ModelCard {
  id: number; name: string; type1: string; type2: string;
  paramSize: string; contextLen: string;
  vendor: string; createdAt: string; iconKey: string;
}

const ALL_MODELS: ModelCard[] = [
  { id: 1, name: "deepseek-v3",      type1: "通用大模型", type2: "文生文", paramSize: "671B",  contextLen: "128K", vendor: "deepseek", createdAt: "2026-06-24 10:00:00", iconKey: "deepseek" },
  { id: 2, name: "embedding-v3",     type1: "向量模型",   type2: "文生文", paramSize: "0.3B",  contextLen: "8K",   vendor: "智谱",     createdAt: "2026-04-08 21:14:09", iconKey: "智谱"    },
  { id: 3, name: "cogvlm-9b",        type1: "图像模型",   type2: "图生文", paramSize: "9B",    contextLen: "4K",   vendor: "智谱",     createdAt: "2026-03-03 17:05:13", iconKey: "智谱"    },
  { id: 4, name: "chatglm4-32b",     type1: "通用大模型", type2: "文生文", paramSize: "32B",   contextLen: "128K", vendor: "智谱AI",   createdAt: "2026-03-03 15:42:01", iconKey: "智谱AI" },
  { id: 5, name: "LLaMA 3.1",        type1: "通用大模型", type2: "文生文", paramSize: "70B",   contextLen: "128K", vendor: "meta",     createdAt: "2025-11-24 18:25:22", iconKey: "meta"    },
  { id: 6, name: "Baichuan-M2 Plus", type1: "通用大模型", type2: "文生文", paramSize: "13B",   contextLen: "32K",  vendor: "百川",     createdAt: "2025-11-24 18:00:14", iconKey: "百川"    },
  { id: 7, name: "Qwen3-7B",         type1: "通用大模型", type2: "文生文", paramSize: "7B",    contextLen: "32K",  vendor: "通义",     createdAt: "2025-10-28 14:33:09", iconKey: "通义"    },
  { id: 8, name: "T1-100",           type1: "推理模型",   type2: "文生文", paramSize: "100B",  contextLen: "64K",  vendor: "T1",       createdAt: "2025-12-12 01:05:22", iconKey: "deepseek" },
];

const TYPE1_OPTIONS = ["通用大模型", "推理模型", "图像模型", "向量模型", "代码模型"];
const TYPE2_OPTIONS = ["文生文", "图生文", "文生图", "文生视频"];

// Icon color per vendor/type
const ICON_CFG: Record<string, { bg: string; color: string }> = {
  "deepseek": { bg: "#eff4ff", color: "#4f6ef7" },
  "智谱":     { bg: "#f0fdf4", color: "#16a34a" },
  "智谱AI":   { bg: "#f0fdf4", color: "#16a34a" },
  "通义":     { bg: "#fff7ed", color: "#c2410c" },
  "meta":     { bg: "#fff1f2", color: "#be123c" },
  "百川":     { bg: "#faf5ff", color: "#7c3aed" },
  "T1":       { bg: "#eff4ff", color: "#4f6ef7" },
};

function getIconCfg(vendor: string) { return ICON_CFG[vendor] ?? { bg: "#f3f4f6", color: "#6b7280" }; }

// type tag colors
function typeTagStyle(type: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    "通用大模型": { background: "#eff4ff", color: "#4f6ef7" },
    "推理模型":   { background: "#fff1f2", color: "#be123c" },
    "图像模型":   { background: "#fff7ed", color: "#c2410c" },
    "向量模型":   { background: "#f0fdf4", color: "#15803d" },
    "代码模型":   { background: "#f0f9ff", color: "#0369a1" },
    "文生文":     { background: "#f8fafc", color: "#6b7280" },
    "图生文":     { background: "#f0fdfa", color: "#0f766e" },
    "文生图":     { background: "#fdf2f8", color: "#9d174d" },
  };
  return map[type] ?? { background: "#f3f4f6", color: "#6b7280" };
}

// ─── Card More Menu ────────────────────────────────────────────────────────────

function CardMoreMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", color: "#9ca3af", borderRadius: 4, fontSize: 16, lineHeight: 1 }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={e => (e.currentTarget.style.background = "none")}>⋯</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 100, overflow: "hidden" }}>
          {["查看详情", "编辑"].map(lbl => (
            <button key={lbl} onClick={() => setOpen(false)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#374151" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>{lbl}</button>
          ))}
          <button onClick={() => { onDelete(); setOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: 13, border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fff5f5")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>删除</button>
        </div>
      )}
    </div>
  );
}

// ─── Model Card ────────────────────────────────────────────────────────────────

function ModelCardItem({ card, onDelete, onDeploy }: { card: ModelCard; onDelete: () => void; onDeploy: () => void }) {
  const ic = getIconCfg(card.iconKey ?? card.vendor);
  const iconOpt = ICON_OPTS.find(o => o.label === card.iconKey) ?? ICON_OPTS[0];

  return (
    <div style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 10, padding: "16px 16px 12px", transition: "box-shadow 0.2s" }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}>

      {/* 图标 + 模型名称 + more menu */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div style={{ width: 34, height: 34, borderRadius: 8, background: iconOpt.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, fontSize: 15, color: "#fff" }}>
            {iconOpt.letter}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.name}</span>
        </div>
        <CardMoreMenu onDelete={onDelete} />
      </div>

      {/* Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {/* 参数量 */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, color: "#9ca3af" }}>参数量</span>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "#374151" }}>{card.paramSize}</span>
        </div>
        {/* 上下文长度 */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, color: "#9ca3af" }}>上下文长度</span>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: "#374151" }}>{card.contextLen}</span>
        </div>
        {/* 模型类型 */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, color: "#9ca3af" }}>模型类型</span>
          <div className="flex gap-1">
            {[card.type1, card.type2].map((t, i) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 500, padding: "1px 6px", borderRadius: 3, ...typeTagStyle(t) }}>{t}</span>
            ))}
          </div>
        </div>
        {/* 创建时间 */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 12, color: "#9ca3af" }}>创建时间</span>
          <span style={{ fontSize: 11.5, color: "#6b7280" }}>{card.createdAt.slice(0, 10)}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ height: 1, background: "#f5f7fa", marginBottom: 10 }} />
      <div className="flex items-center gap-3">
        {["查看", "编辑"].map(a => (
          <button key={a} style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>{a}</button>
        ))}
        <button onClick={onDeploy}
          style={{ fontSize: 12.5, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 5, padding: "3px 12px", cursor: "pointer", marginLeft: "auto" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
          onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>部署</button>
      </div>
    </div>
  );
}

// ─── New Model Modal ───────────────────────────────────────────────────────────

const ICON_OPTS = [
  { label: "通义千问",  bg: "#ff6b35", letter: "通" },
  { label: "智谱",      bg: "#4f6ef7", letter: "智" },
  { label: "DeepSeek",  bg: "#0ea5e9", letter: "D"  },
  { label: "百川",      bg: "#7c3aed", letter: "百" },
  { label: "Meta",      bg: "#be123c", letter: "M"  },
];
const CATEGORIES = ["通用大模型", "向量", "图片", "重排", "语音识别", "语音合成"];

function NewModelModal({ onClose, onDone }: { onClose: () => void; onDone: (m: ModelCard) => void }) {
  const [name, setName]         = useState("");
  const [icon, setIcon]         = useState(ICON_OPTS[0]);
  const [iconOpen, setIconOpen] = useState(false);
  const [params, setParams]     = useState("");
  const [ctx, setCtx]           = useState("8192");
  const [cats, setCats]         = useState<string[]>(["LLM"]);
  const [weights, setWeights]   = useState("");
  const [image, setImage]       = useState("");
  const [desc, setDesc]         = useState("");
  const [errs, setErrs]         = useState<Record<string, boolean>>({});
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (iconRef.current && !iconRef.current.contains(e.target as Node)) setIconOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggleCat = (c: string) => setCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (!params)      e.params = true;
    if (cats.length === 0) e.cats = true;
    if (Object.keys(e).length) { setErrs(e); return; }
    const now = new Date(); const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const t1Map: Record<string, string> = { "通用大模型": "通用大模型", "向量": "向量模型", "图片": "图像模型", "重排": "推理模型", "语音识别": "推理模型", "语音合成": "推理模型" };
    onDone({ id: Date.now(), name: name.trim(), type1: t1Map[cats[0]] ?? "通用大模型", type2: "文生文", paramSize: params + "B", contextLen: Math.round(Number(ctx) / 1024) + "K", vendor: icon.label, createdAt: ts, iconKey: icon.label });
    onClose();
  };

  const inp: React.CSSProperties = { width: "100%", height: 36, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, outline: "none", boxSizing: "border-box" as const, color: "#1a1d23" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 520, maxHeight: "90vh", background: "#fff", borderRadius: 12, zIndex: 201, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>新建模型</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18 }}>×</button>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: "16px 20px" }}>
          {/* 2-col: 模型名称 + 图标 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>模型名称</div>
              <input value={name} onChange={e => { setName(e.target.value); setErrs(p => ({ ...p, name: false })); }}
                placeholder="如 Qwen3-8B" style={{ ...inp, borderColor: errs.name ? "#ef4444" : "#e0e3ed" }} />
              {errs.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 3 }}>请输入模型名称</div>}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>图标</div>
              <div ref={iconRef} style={{ position: "relative" }}>
                <button onClick={() => setIconOpen(o => !o)} className="flex items-center gap-2"
                  style={{ ...inp, cursor: "pointer", background: "#fff", justifyContent: "space-between", paddingRight: 8 }}>
                  <div className="flex items-center gap-2">
                    <span style={{ width: 22, height: 22, borderRadius: 5, background: icon.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{icon.letter}</span>
                    <span style={{ fontSize: 13 }}>{icon.label}</span>
                  </div>
                  <ChevronDown size={13} color="#9ca3af" />
                </button>
                {iconOpen && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 10, overflow: "hidden" }}>
                    {ICON_OPTS.map(opt => (
                      <div key={opt.label} onClick={() => { setIcon(opt); setIconOpen(false); }}
                        className="flex items-center gap-2"
                        style={{ padding: "9px 12px", cursor: "pointer", background: opt.label === icon.label ? "#f0f4ff" : "#fff" }}
                        onMouseEnter={e => { if (opt.label !== icon.label) (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = opt.label === icon.label ? "#f0f4ff" : "#fff"; }}>
                        <span style={{ width: 22, height: 22, borderRadius: 5, background: opt.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{opt.letter}</span>
                        <span style={{ fontSize: 13 }}>{opt.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 参数量 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>参数量（B）</div>
            <input type="number" value={params} onChange={e => { setParams(e.target.value); setErrs(p => ({ ...p, params: false })); }}
              placeholder="如 8.0" style={{ ...inp, borderColor: errs.params ? "#ef4444" : "#e0e3ed", width: "50%" }} />
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>保留 1 位小数</div>
            {errs.params && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 2 }}>请输入参数量</div>}
          </div>

          {/* 上下文长度 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>上下文长度（Tokens）</div>
            <input type="number" value={ctx} onChange={e => setCtx(e.target.value)}
              style={{ ...inp, width: "50%" }} />
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>默认 8192，最大 131072</div>
          </div>

          {/* 分类 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}><span style={{ color: "#ef4444", marginRight: 2 }}>*</span>分类</div>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map(c => (
                <label key={c} className="flex items-center gap-1.5" style={{ cursor: "pointer", fontSize: 13, color: "#374151" }}>
                  <input type="checkbox" checked={cats.includes(c)} onChange={() => toggleCat(c)} style={{ accentColor: "#4f6ef7", width: 14, height: 14 }} />
                  {c}
                </label>
              ))}
            </div>
            {errs.cats && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请至少选择一个分类</div>}
          </div>

          {/* 模型权重地址 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>模型权重地址</div>
            <input value={weights} onChange={e => setWeights(e.target.value)} placeholder="如 /models/Qwen3-8B" style={inp} />
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>NFS 共享盘权重文件路径，用户手动填写</div>
          </div>

          {/* 模型镜像地址 */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>模型镜像地址</div>
            <input value={image} onChange={e => setImage(e.target.value)} placeholder="Harbor 镜像地址" style={inp} />
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>用户手动填写或选择已有版本</div>
          </div>

          {/* 简介 */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>简介</div>
            <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 500))} placeholder="模型简介，最长 500 字"
              style={{ width: "100%", height: 88, padding: "8px 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" as const }} />
            <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "right", marginTop: 2 }}>{desc.length}/500</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "12px 20px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose} style={{ height: 34, padding: "0 20px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, background: "#fff", cursor: "pointer", color: "#374151" }}>取消</button>
          <button onClick={submit} style={{ height: 34, padding: "0 24px", fontSize: 13, border: "none", borderRadius: 7, background: "#4f6ef7", color: "#fff", cursor: "pointer", fontWeight: 500 }}>确认</button>
        </div>
      </div>
    </>
  );
}

export function ModelManagementPage({ onDeploy }: { onDeploy?: (card: ModelCard) => void } = {}) {
  const [showCreate, setShowCreate] = useState(false);
  const [showNewModel, setShowNewModel] = useState(false);
  const [filterType1, setFilterType1] = useState("");
  const [filterType2, setFilterType2] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [models, setModels] = useState<ModelCard[]>(ALL_MODELS);

  if (showCreate) return <CreateModelSeriesPage onBack={() => setShowCreate(false)} />;

  const filtered = models.filter(m => {
    if (filterType1 && m.type1 !== filterType1) return false;
    if (filterType2 && m.type2 !== filterType2) return false;
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const doSearch = () => setSearchQuery(searchInput);
  const doReset  = () => { setFilterType1(""); setFilterType2(""); setSearchInput(""); setSearchQuery(""); };

  const selSt: React.CSSProperties = {
    height: 32, padding: "0 28px 0 10px", fontSize: 13, border: "1px solid #e0e3ed",
    borderRadius: 6, outline: "none", background: "#fff", color: "#374151", appearance: "none", cursor: "pointer",
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex-1 flex flex-col min-h-0" style={{ margin: "16px 24px 24px" }}>
        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0" style={{ marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <select value={filterType1} onChange={e => { setFilterType1(e.target.value); }} style={selSt}>
              <option value="">一级分类</option>
              {TYPE1_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <div style={{ position: "relative" }}>
            <select value={filterType2} onChange={e => { setFilterType2(e.target.value); }} style={selSt}>
              <option value="">二级分类</option>
              {TYPE2_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 32, padding: "0 10px", background: "#fff" }}>
            <input type="text" placeholder="请输入模型名称" value={searchInput}
              onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()}
              style={{ fontSize: 13, border: "none", outline: "none", width: 150, background: "transparent" }} />
          </div>
          <button onClick={doSearch} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
            <Search size={13} /> 搜索
          </button>
          <button onClick={doReset} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
            <RotateCcw size={13} /> 重置
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowNewModel(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
            <Plus size={14} /> 新增模型
          </button>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl" style={{ background: "#fff", border: "1px solid #e8ebf2", height: 200, color: "#9ca3af", fontSize: 13 }}>暂无数据</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {filtered.map(m => (
                <ModelCardItem key={m.id} card={m}
                onDelete={() => setModels(prev => prev.filter(x => x.id !== m.id))}
                onDeploy={() => onDeploy?.(m)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewModel && (
        <NewModelModal onClose={() => setShowNewModel(false)} onDone={m => setModels(prev => [m, ...prev])} />
      )}
    </div>
  );
}
