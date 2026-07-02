import { useState, useRef } from "react";
import { Search, RotateCcw, Plus, Upload, ChevronDown, ChevronLeft, ChevronRight, X, AlertCircle, FileText } from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────

type FileStatus = "待校验" | "已就绪" | "失败";
type DataUsage  = "文本生成" | "代码生成" | "问答" | "翻译";

interface CustomDataset {
  id: number; name: string; type: string; usage: DataUsage;
  count: number; fileStatus: FileStatus; creator: string; space: string;
}

interface PresetDataset {
  id: number; name: string; usage: DataUsage; updatedAt: string;
}

const USAGE_OPTS: DataUsage[] = ["文本生成", "代码生成", "问答", "翻译"];

const PRESET_OPTIONS: Record<string, { usage: DataUsage; dims: string }> = {
  "C-Eval": {
    usage: "文本生成",
    dims: `人文学科 涵盖文学、历史、哲学、艺术等人文领域\n社会科学 涵盖经济、政治、社会学、心理学等社会研究领域\n理工科 涵盖数学、物理、工程、计算机等科技领域\n其他 其他未分类的领域及综合性知识`,
  },
  "MMLU": {
    usage: "文本生成",
    dims: `理工科 包括线性代数、抽象代数、物理 包括电磁学、热力学、量子力学及相关高等物理内容 生物学 包括基础生物学、解剖学、遗传学、临床医学等 计算机科学 涵盖算法、数据结构、计算机安全、人工智能 社会科学 包括心理学、经济学、社会学、人文学等 历史 包括世界史、美国史、欧洲史、亚洲史等 商业 包括管理学、市场营销、会计学、金融等 法律 涵盖法律体系和原理 人文 包括哲学、逻辑、伦理学、文学等 综合 包括跨学科及不易归类的专业领域内容`,
  },
  "GSM8k": {
    usage: "文本生成",
    dims: `数学推理 包含小学到初中水平的数学应用题\n算术运算 加减乘除及混合运算\n多步推理 需要多个步骤才能解决的文字题\n实际应用 结合日常生活场景的数学问题`,
  },
  "C-Eval-lite": {
    usage: "文本生成",
    dims: `人文学科 涵盖文学、历史、哲学、艺术等人文领域\n社会科学 涵盖经济、政治、社会学、心理学等社会研究领域\n理工科 涵盖数学、物理、工程、计算机等科技领域\n其他 其他未分类的领域及综合性知识`,
  },
  "MMLU-lite": {
    usage: "文本生成",
    dims: `理工科 包括线性代数、抽象代数、物理 包括电磁学、热力学、量子力学及相关高等物理内容 生物学 包括基础生物学、解剖学、遗传学、临床医学等 计算机科学 涵盖算法、数据结构、计算机安全、人工智能 社会科学 包括心理学、经济学、社会学、人文学等 历史 包括世界史、美国史、欧洲史、亚洲史等 商业 包括管理学、市场营销、会计学、金融等 法律 涵盖法律体系和原理 人文 包括哲学、逻辑、伦理学、文学等 综合 包括跨学科及不易归类的专业领域内容`,
  },
  "QCRBench_x1": {
    usage: "问答",
    dims: `阅读理解 基于文章内容的理解和推理\n事实问答 基于知识库的事实性问题\n开放域问答 不限定领域的通用问题回答\n多跳推理 需要多步推理的复杂问题`,
  },
};

const PRESET_NAMES = Object.keys(PRESET_OPTIONS);

const EVAL_DIMS = PRESET_OPTIONS["C-Eval"].dims;

const CUSTOM_INIT: CustomDataset[] = [
  { id: 1, name: "test", type: "EVAL", usage: "文本生成", count: 0, fileStatus: "待校验", creator: "admin", space: "admin空间" },
];

const PRESET_INIT: PresetDataset[] = [
  { id: 1, name: "C-Eval",      usage: "文本生成", updatedAt: "2026-03-20 16:47:30" },
  { id: 2, name: "C-Eval-lite", usage: "文本生成", updatedAt: "2026-03-20 18:09:53" },
  { id: 3, name: "GSM8k-lite",  usage: "文本生成", updatedAt: "2026-03-20 18:10:03" },
  { id: 4, name: "MMLU-lite",   usage: "文本生成", updatedAt: "2026-03-20 18:10:11" },
];

const FILE_STATUS_CFG: Record<FileStatus, { bg: string; text: string; border: string }> = {
  "待校验": { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  "已就绪": { bg: "#f0faf5", text: "#16a34a", border: "#bbf7d0" },
  "失败":   { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
};

// ─── Shared UI ────────────────────────────────────────────────────────────────

const thSt: React.CSSProperties = { padding: "11px 16px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 13, borderBottom: "1px solid #f0f2f7", background: "#f8f9fc", whiteSpace: "nowrap" };
const tdSt: React.CSSProperties = { padding: "13px 16px", fontSize: 13, borderBottom: "1px solid #f5f7fa" };
const inputSt = (err = false): React.CSSProperties => ({
  width: "100%", height: 36, padding: "0 10px", fontSize: 13,
  border: `1px solid ${err ? "#ef4444" : "#e0e3ed"}`, borderRadius: 7, outline: "none",
  boxSizing: "border-box" as const, color: "#1a1d23",
});
const FL = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 7 }}>
    {required && <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>}{children}
  </div>
);

function ActionBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  const [hov, setHov] = useState(false);
  const c = danger ? (hov ? "#dc2626" : "#ef4444") : (hov ? "#3b5de8" : "#4f6ef7");
  return (
    <button onClick={onClick} style={{ fontSize: 12.5, color: c, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>{label}</button>
  );
}

function Drawer({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 460, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-auto" style={{ padding: "20px" }}>{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "14px 20px", borderTop: "1px solid #f0f2f7" }}>{footer}</div>}
      </div>
    </>
  );
}

function CancelOk({ onCancel, onOk }: { onCancel: () => void; onOk: () => void }) {
  return (
    <>
      <button onClick={onCancel} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>取消</button>
      <button onClick={onOk} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>确定</button>
    </>
  );
}

// File upload area
function FileUploadArea({ fileName, onFile }: { fileName: string; onFile: (name: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div onClick={() => ref.current?.click()}
      style={{ border: "1.5px dashed #93c5fd", borderRadius: 10, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: "#f8faff", transition: "background 0.15s" }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = "#eff6ff")}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "#f8faff")}>
      <input ref={ref} type="file" accept=".json,.jsonl" style={{ display: "none" }}
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0].name); }} />
      {fileName ? (
        <div className="flex items-center justify-center gap-2">
          <FileText size={18} color="#4f6ef7" />
          <span style={{ fontSize: 13, color: "#4f6ef7", fontWeight: 500 }}>{fileName}</span>
        </div>
      ) : (
        <>
          <Upload size={24} color="#93c5fd" style={{ margin: "0 auto 8px" }} />
          <div style={{ fontSize: 13, color: "#4f6ef7" }}>点击上传，或拖拽文件到此处</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>目前支持上传 .json 文件，单次上传不超过 20GB</div>
        </>
      )}
    </div>
  );
}

// ─── Create Dataset Modal ─────────────────────────────────────────────────────

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: (ds: CustomDataset) => void }) {
  const [name, setName]   = useState("");
  const [intro, setIntro] = useState("");
  const [usage, setUsage] = useState<DataUsage | "">("");
  const [errs, setErrs]   = useState<Record<string, boolean>>({});

  const submit = () => {
    const e: Record<string, boolean> = {};
    if (!name.trim()) e.name = true;
    if (!usage)       e.usage = true;
    if (Object.keys(e).length) { setErrs(e); return; }
    onDone({ id: Date.now(), name: name.trim(), type: "EVAL", usage: usage as DataUsage, count: 0, fileStatus: "待校验", creator: "admin", space: "admin空间" });
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 480, background: "#fff", borderRadius: 14, zIndex: 201, boxShadow: "0 24px 64px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>创建数据集</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <FL required>数据集名称</FL>
            <input value={name} onChange={e => { setName(e.target.value.slice(0, 20)); setErrs(p => ({ ...p, name: false })); }}
              placeholder="请输入数据集名称，最大不超过20字符" style={inputSt(errs.name)} />
            {errs.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入数据集名称</div>}
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, textAlign: "right" }}>{name.length}/20</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <FL>数据集简介</FL>
            <textarea value={intro} onChange={e => setIntro(e.target.value.slice(0, 50))} placeholder="请输入数据集简介，最大不超过50字符"
              style={{ width: "100%", height: 76, padding: "8px 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "right" }}>{intro.length}/50</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <FL>类型</FL>
            <input value="EVAL" readOnly style={{ ...inputSt(), background: "#f8f9fc", color: "#9ca3af" }} />
          </div>
          <div>
            <FL required>数据集用途</FL>
            <div style={{ position: "relative" }}>
              <select value={usage} onChange={e => { setUsage(e.target.value as DataUsage); setErrs(p => ({ ...p, usage: false })); }}
                style={{ ...inputSt(errs.usage), appearance: "none", paddingRight: 28, color: usage ? "#1a1d23" : "#9ca3af" }}>
                <option value="">请选择数据集使用用途</option>
                {USAGE_OPTS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            {errs.usage && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请选择数据集用途</div>}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "14px 24px", borderTop: "1px solid #f0f2f7" }}>
          <CancelOk onCancel={onClose} onOk={submit} />
        </div>
      </div>
    </>
  );
}

// ─── Edit Dataset Drawer ──────────────────────────────────────────────────────

function EditDrawer({ ds, onClose, onDone }: { ds: CustomDataset; onClose: () => void; onDone: (d: CustomDataset) => void }) {
  const [name, setName]   = useState(ds.name);
  const [intro, setIntro] = useState("");
  const [file, setFile]   = useState(ds.count > 0 ? "论文批量导入模板.jsonl" : "");
  const [errs, setErrs]   = useState<Record<string, boolean>>({});

  const submit = () => {
    if (!name.trim()) { setErrs({ name: true }); return; }
    onDone({ ...ds, name: name.trim() });
    onClose();
  };

  return (
    <Drawer title="编辑数据集" onClose={onClose} footer={<CancelOk onCancel={onClose} onOk={submit} />}>
      <div style={{ marginBottom: 16 }}>
        <FL required>数据集名称</FL>
        <input value={name} onChange={e => { setName(e.target.value); setErrs({}); }} style={inputSt(errs.name)} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <FL>数据集简介</FL>
        <textarea value={intro} onChange={e => setIntro(e.target.value.slice(0, 50))} placeholder="请输入数据集简介，最大不超过50字符"
          style={{ width: "100%", height: 76, padding: "8px 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
        <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "right" }}>{intro.length}/50</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <FL>类型</FL>
        <input value={ds.type} readOnly style={{ ...inputSt(), background: "#f8f9fc", color: "#9ca3af" }} />
      </div>
      <div>
        <FL required>上传数据集</FL>
        <FileUploadArea fileName={file} onFile={setFile} />
      </div>
    </Drawer>
  );
}

// ─── Import Preset Drawer ─────────────────────────────────────────────────────

function ImportDrawer({ onClose, onDone }: { onClose: () => void; onDone: (ds: PresetDataset) => void }) {
  const [name, setName]     = useState("C-Eval");
  const [dropOpen, setDropOpen] = useState(false);
  const [file, setFile]     = useState("");

  const selected = PRESET_OPTIONS[name] ?? PRESET_OPTIONS["C-Eval"];

  const submit = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    onDone({ id: Date.now(), name, usage: selected.usage, updatedAt: ts });
    onClose();
  };

  return (
    <Drawer title="导入预置数据集" onClose={onClose} footer={<CancelOk onCancel={onClose} onOk={submit} />}>
      {/* 数据集名称 — custom dropdown */}
      <div style={{ marginBottom: 16 }}>
        <FL required>数据集名称</FL>
        <div style={{ position: "relative" }}>
          <button onClick={() => setDropOpen(o => !o)}
            className="flex items-center justify-between w-full"
            style={{ height: 36, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, background: "#fff", cursor: "pointer", color: "#1a1d23" }}>
            <span>{name}</span>
            <ChevronDown size={13} color="#9ca3af" style={{ transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          {dropOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 10, overflow: "hidden", maxHeight: 240, overflowY: "auto" }}>
              {PRESET_NAMES.map(n => (
                <div key={n} onClick={() => { setName(n); setDropOpen(false); }}
                  style={{
                    padding: "10px 14px", fontSize: 13, cursor: "pointer",
                    color: n === name ? "#4f6ef7" : "#374151",
                    fontWeight: n === name ? 600 : 400,
                    background: n === name ? "#f0f4ff" : "#fff",
                  }}
                  onMouseEnter={e => { if (n !== name) (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n === name ? "#f0f4ff" : "#fff"; }}>
                  {n}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 数据集用途 */}
      <div style={{ marginBottom: 16 }}>
        <FL>数据集用途</FL>
        <div style={{ position: "relative" }}>
          <input value={selected.usage} readOnly
            style={{ ...inputSt(), background: "#f8f9fc", color: "#374151", paddingRight: 28 }} />
          <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }} />
        </div>
      </div>

      {/* 上传数据集 */}
      <div style={{ marginBottom: 16 }}>
        <FL required>上传数据集</FL>
        <FileUploadArea fileName={file} onFile={setFile} />
      </div>

      {/* 评测维度 */}
      <div>
        <FL>评测维度</FL>
        <div style={{ background: "#f8f9fc", border: "1px solid #e8ebf2", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#374151", lineHeight: 1.9, maxHeight: 160, overflowY: "auto" }}>
          {selected.dims.split("\n").map((line, i) => {
            const spIdx = line.indexOf(" ");
            const bold = spIdx > -1 ? line.slice(0, spIdx) : line;
            const rest = spIdx > -1 ? line.slice(spIdx + 1) : "";
            return <div key={i}><strong>{bold}</strong>{rest ? ` ${rest}` : ""}</div>;
          })}
        </div>
      </div>
    </Drawer>
  );
}

// ─── View Preset Drawer ───────────────────────────────────────────────────────

function ViewPresetDrawer({ ds, onClose }: { ds: PresetDataset; onClose: () => void }) {
  return (
    <Drawer title="查看预置数据集" onClose={onClose}>
      <div style={{ marginBottom: 16 }}>
        <FL required>数据集名称</FL>
        <div style={{ position: "relative" }}>
          <input value={ds.name} readOnly style={{ ...inputSt(), background: "#f8f9fc", color: "#374151", paddingRight: 28 }} />
          <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <FL>数据集用途</FL>
        <div style={{ position: "relative" }}>
          <input value={ds.usage} readOnly style={{ ...inputSt(), background: "#f8f9fc", color: "#374151", paddingRight: 28 }} />
          <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }} />
        </div>
      </div>
      <div>
        <FL>评测维度</FL>
        <div style={{ background: "#f8f9fc", border: "1px solid #e8ebf2", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "#374151", lineHeight: 2 }}>
          {EVAL_DIMS.split("\n").map((line, i) => {
            const [bold, ...rest] = line.split(" ");
            return <div key={i}><strong>{bold}</strong> {rest.join(" ")}</div>;
          })}
        </div>
      </div>
    </Drawer>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 400, background: "#fff", borderRadius: 14, zIndex: 201, boxShadow: "0 24px 64px rgba(0,0,0,0.16)", padding: "28px 28px 24px" }}>
        <div className="flex flex-col items-center text-center">
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <AlertCircle size={28} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23", marginBottom: 8 }}>确认删除</div>
          <div style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.7, marginBottom: 24 }}>
            确定确认删除该数据集？删除后不可恢复
          </div>
          <div className="flex items-center gap-3">
            <CancelOk onCancel={onClose} onOk={() => { onConfirm(); onClose(); }} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function EvaluationDataPage() {
  const [tab, setTab]               = useState<"custom" | "preset">("custom");
  const [search, setSearch]         = useState("");
  const [query, setQuery]           = useState("");
  const [custom, setCustom]         = useState<CustomDataset[]>(CUSTOM_INIT);
  const [preset, setPreset]         = useState<PresetDataset[]>(PRESET_INIT);
  const [page, setPage]             = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [editDs, setEditDs]         = useState<CustomDataset | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [viewPreset, setViewPreset] = useState<PresetDataset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ name: string; type: "custom" | "preset"; id: number } | null>(null);

  const filteredCustom = custom.filter(d => !query || d.name.toLowerCase().includes(query.toLowerCase()));
  const filteredPreset = preset.filter(d => !query || d.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>模型评测</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>评测数据</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "14px 16px 0", borderBottom: "1px solid #f0f2f7", paddingBottom: 0 }}>
          <div className="flex items-center gap-2" style={{ paddingBottom: 14 }}>
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 10px" }}>
              <input type="text" placeholder="请输入数据集名称" value={search}
                onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && setQuery(search)}
                style={{ fontSize: 13, border: "none", outline: "none", width: 160, background: "transparent" }} />
            </div>
            <button onClick={() => { setQuery(search); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <Search size={13} /> 搜索
            </button>
            <button onClick={() => { setSearch(""); setQuery(""); setPage(1); }} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <RotateCcw size={13} /> 重置
            </button>
          </div>
          <div className="flex items-center gap-2" style={{ paddingBottom: 14 }}>
            <button onClick={() => setShowImport(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#4f6ef7", background: "#fff", border: "1px solid #4f6ef7", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f5f8ff")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <Upload size={13} /> 导入预置数据集
            </button>
            <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
              <Plus size={14} /> 创建数据集
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-shrink-0" style={{ borderBottom: "1px solid #f0f2f7", padding: "0 16px" }}>
          {[{ key: "custom", label: "自定义数据集" }, { key: "preset", label: "预置数据集" }].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key as "custom" | "preset"); setPage(1); }}
              style={{ padding: "11px 16px", fontSize: 14, fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? "#4f6ef7" : "#6b7280", background: "none", border: "none", cursor: "pointer", borderBottom: tab === t.key ? "2px solid #4f6ef7" : "2px solid transparent", marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {tab === "custom" ? (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>{["数据集名称","类型","数据集用途","数据量","文件状态","创建人","所属空间","操作"].map(c => <th key={c} style={thSt}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {filteredCustom.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>暂无数据</td></tr>
                ) : filteredCustom.map(d => {
                  const sc = FILE_STATUS_CFG[d.fileStatus];
                  return (
                    <tr key={d.id} onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23" }}>{d.name}</td>
                      <td style={tdSt}><span style={{ fontSize: 12.5, padding: "2px 8px", borderRadius: 4, background: "#eff4ff", color: "#4f6ef7" }}>{d.type}</span></td>
                      <td style={tdSt}>{d.usage}</td>
                      <td style={tdSt}>{d.count}条</td>
                      <td style={tdSt}><span style={{ fontSize: 12.5, fontWeight: 500, padding: "3px 10px", borderRadius: 5, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{d.fileStatus}</span></td>
                      <td style={tdSt}>{d.creator}</td>
                      <td style={tdSt}>{d.space}</td>
                      <td style={tdSt}>
                        <div className="flex items-center gap-3">
                          <ActionBtn label="编辑" onClick={() => setEditDs(d)} />
                          <ActionBtn label="删除" danger onClick={() => setDeleteTarget({ name: d.name, type: "custom", id: d.id })} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>{["数据集名称","数据集用途","更新时间","操作"].map(c => <th key={c} style={thSt}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {filteredPreset.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af" }}>暂无数据</td></tr>
                ) : filteredPreset.map(d => (
                  <tr key={d.id} onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23" }}>{d.name}</td>
                    <td style={tdSt}>{d.usage}</td>
                    <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5 }}>{d.updatedAt}</td>
                    <td style={tdSt}>
                      <div className="flex items-center gap-3">
                        <ActionBtn label="查看" onClick={() => setViewPreset(d)} />
                        <ActionBtn label="删除" danger onClick={() => setDeleteTarget({ name: d.name, type: "preset", id: d.id })} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {tab === "custom" ? filteredCustom.length : filteredPreset.length} 条</span>
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

      {/* Modals & Drawers */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onDone={d => setCustom(prev => [...prev, d])} />}
      {editDs && <EditDrawer ds={editDs} onClose={() => setEditDs(null)} onDone={d => setCustom(prev => prev.map(x => x.id === d.id ? d : x))} />}
      {showImport && <ImportDrawer onClose={() => setShowImport(false)} onDone={d => setPreset(prev => [d, ...prev])} />}
      {viewPreset && <ViewPresetDrawer ds={viewPreset} onClose={() => setViewPreset(null)} />}
      {deleteTarget && (
        <DeleteModal name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={() => {
          if (deleteTarget.type === "custom") setCustom(prev => prev.filter(d => d.id !== deleteTarget.id));
          else setPreset(prev => prev.filter(d => d.id !== deleteTarget.id));
        }} />
      )}
    </div>
  );
}
