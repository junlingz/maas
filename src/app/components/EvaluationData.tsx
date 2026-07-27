import { useRef, useState } from "react";
import {
  AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, Info,
  RefreshCw, RotateCcw, Search, Upload, X,
} from "lucide-react";
import {
  loadStoredEvaluationDatasets, removeStoredEvaluationDataset, saveStoredEvaluationDataset,
  type StoredEvaluationDataset, type VersionDetail,
} from "./evaluationDatasetStore";

type DatasetStatus = "校验中" | "校验通过" | "校验失败";
type DatasetTab = "public" | "mine" | "shared" | "all-users";

type DatasetRow = StoredEvaluationDataset;

const STATUS_CFG: Record<DatasetStatus, { bg: string; text: string; border: string }> = {
  "校验中": { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
  "校验通过": { bg: "#f0faf5", text: "#16a34a", border: "#bbf7d0" },
  "校验失败": { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
};

const INITIAL_DATASETS: DatasetRow[] = [
  { id: 1, name: "C-Eval", description: "中文基础模型综合能力评测集。", source: "public", modelType: "语言模型", tasks: ["文本理解", "逻辑推理"], format: "内置", count: 13948, domain: "人文、社科、理工", version: "v1.0", versions: ["v1.0", "v0.9"], recommendedVersion: "v1.0", status: "校验通过", permission: "公开", creator: "system", team: "系统", updatedAt: "2026-03-20 16:47:30", metrics: ["Accuracy", "F1"], schema: "id,input,answer,category", sample: "{请判断下列说法是否正确…}", citation: "Huang et al., C-Eval: A Multi-Level Multi-Discipline Chinese Evaluation Suite", versionDetails: { "v1.0": { count: 13948, sample: "{\"请判断下列说法是否正确…\"}", schema: "id,input,answer,category", citation: "Huang et al., C-Eval: A Multi-Level Multi-Discipline Chinese Evaluation Suite, 2023", updatedAt: "2026-03-20", releaseNote: "修复部分类别标签错误；新增 1200 道逻辑推理题。" }, "v0.9": { count: 12748, sample: "{\"以下说法哪个正确？…\"}", schema: "id,input,answer,category", citation: "Huang et al., C-Eval: A Multi-Level Multi-Discipline Chinese Evaluation Suite, 2023", updatedAt: "2025-08-15", releaseNote: "C-Eval 数据集初始版本。" } } },
  { id: 2, name: "MMLU", description: "覆盖 57 个学科的多任务语言理解基准。", source: "public", modelType: "语言模型", tasks: ["文本理解", "问答"], format: "内置", count: 14042, domain: "57 个学科", version: "v2.0", versions: ["v2.0", "v1.0"], recommendedVersion: "v2.0", status: "校验通过", permission: "公开", creator: "system", team: "系统", updatedAt: "2026-03-20 18:09:53", metrics: ["Accuracy"], schema: "id,question,choices,answer,subject", sample: "{Which of the following...}", citation: "Hendrycks et al., Measuring Massive Multitask Language Understanding", versionDetails: { "v2.0": { count: 14042, sample: "{\"Which of the following best describes...\"}", schema: "id,question,choices,answer,subject", citation: "Hendrycks et al., MMLU, ICLR 2021", updatedAt: "2026-03-20", releaseNote: "新增 6 个学科领域；修正部分多选答案标注错误。" }, "v1.0": { count: 12000, sample: "{\"Select the best answer...\"}", schema: "id,question,answer,subject", citation: "Hendrycks et al., MMLU, ICLR 2021", updatedAt: "2025-06-10", releaseNote: "MMLU 数据集初始版本。" } } },
  { id: 3, name: "GSM8K", description: "小学数学应用题的多步推理评测集。", source: "public", modelType: "语言模型", tasks: ["逻辑推理", "问答"], format: "内置", count: 8792, domain: "数学推理", version: "v1.1", versions: ["v1.1", "v1.0"], recommendedVersion: "v1.1", status: "校验通过", permission: "公开", creator: "system", team: "系统", updatedAt: "2026-03-20 18:10:03", metrics: ["Accuracy", "Exact Match"], schema: "id,input,answer,rationale", sample: "{A shop sells 12 apples...}", citation: "Cobbe et al., Training Verifiers to Solve Math Word Problems", versionDetails: { "v1.1": { count: 8792, sample: "{\"A shop sells 12 apples...\"}", schema: "id,input,answer,rationale", citation: "Cobbe et al., Training Verifiers to Solve Math Word Problems, 2021", updatedAt: "2026-03-20", releaseNote: "补充 1300+ 道多步推理题；增加解题步骤标注。" }, "v1.0": { count: 7473, sample: "{\"If John has 5 apples...\"}", schema: "id,input,answer", citation: "Cobbe et al., Training Verifiers to Solve Math Word Problems, 2021", updatedAt: "2025-05-12", releaseNote: "GSM8K 数据集初始版本。" } } },
  { id: 4, name: "HumanEval", description: "使用单元测试验证代码生成正确性。", source: "public", modelType: "语言模型", tasks: ["代码生成"], format: "内置", count: 164, domain: "Python 代码", version: "v1.0", versions: ["v1.0"], recommendedVersion: "v1.0", status: "校验通过", permission: "公开", creator: "system", team: "系统", updatedAt: "2026-03-20 18:10:11", metrics: ["Pass@1"], schema: "task_id,prompt,canonical_solution,test", sample: "{def add(a,b):}", citation: "Chen et al., Evaluating Large Language Models Trained on Code" },
  { id: 5, name: "MMMU", description: "面向图像与文本联合理解的多学科多模态基准。", source: "public", modelType: "多模态模型", tasks: ["视觉问答", "文档解析"], format: "内置", count: 11550, domain: "图表、图像、文档", version: "v1.0", versions: ["v1.0"], recommendedVersion: "v1.0", status: "校验通过", permission: "公开", creator: "system", team: "系统", updatedAt: "2026-03-22 09:18:00", metrics: ["VQA Score", "Accuracy"], schema: "id,image_url,question,answer", sample: "{图表中最高的数值是多少？}", citation: "Yue et al., MMMU: A Massive Multi-discipline Multimodal Understanding Benchmark" },
  { id: 6, name: "合同问答自定义集", description: "用于合同要素抽取与问答的内部数据集。", source: "mine", modelType: "语言模型", tasks: ["问答", "文本理解"], format: "JSONL", count: 2400, domain: "合同", version: "v3", versions: ["v3", "v2", "v1"], recommendedVersion: "v3", status: "校验通过", permission: "仅自己可见", creator: "admin", team: "公共", updatedAt: "2026-07-18 10:20:00", metrics: ["Accuracy", "F1"], schema: "id,input,answer,source", sample: "{合同中的付款周期是什么？}", citation: "内部数据集，无公开引用", versionDetails: { "v3": { count: 2400, sample: "{\"合同中的付款周期是什么？\"}", schema: "id,input,answer,source", updatedAt: "2026-07-18", releaseNote: "新增 600 条采购合同问答数据；增加 source 字段标注合同来源。" }, "v2": { count: 1800, sample: "{\"合同中的违约责任？\"}", schema: "id,input,answer", updatedAt: "2026-06-10", releaseNote: "补充 600 条劳动合同数据；修正部分答案标注。" }, "v1": { count: 1200, sample: "{\"合同有效期多久？\"}", schema: "input,answer", updatedAt: "2026-05-20", releaseNote: "初始版本，涵盖基础合同类型。" } } },
  { id: 7, name: "视觉问答业务集", description: "视觉问答回归测试数据。", source: "mine", modelType: "多模态模型", tasks: ["视觉问答"], format: "JSONL", count: 0, domain: "图像", version: "v1", versions: ["v1"], recommendedVersion: "v1", status: "校验失败", permission: "团队成员可见（只读）", creator: "admin", team: "公共", updatedAt: "2026-07-18 10:33:00", metrics: ["VQA Score"], schema: "id,image_url,question,answer", sample: "{图片中有几个人？}", citation: "内部数据集，无公开引用", validationError: "第 18 行缺少 image_url 字段；第 42 行 JSON 格式错误。" },
  { id: 10, name: "问答测试数据", description: "正在执行格式校验的自定义问答数据。", source: "mine", modelType: "语言模型", tasks: ["问答"], format: "CSV", count: 0, domain: "自定义", version: "v1", versions: ["v1"], recommendedVersion: "v1", status: "校验中", permission: "仅自己可见", creator: "admin", team: "公共", updatedAt: "2026-07-18 10:40:00", metrics: ["Accuracy"], schema: "input,answer", sample: "校验完成后展示样例", citation: "内部数据集，无公开引用" },
  { id: 8, name: "政务问答共享集", description: "共享的政务服务问答数据集。", source: "shared", modelType: "语言模型", tasks: ["问答"], format: "CSV", count: 5200, domain: "政务", version: "v2", versions: ["v2", "v1"], recommendedVersion: "v2", status: "校验通过", permission: "团队成员可见（只读）", creator: "张小明", team: "AI研发团队", updatedAt: "2026-07-16 15:18:00", metrics: ["Accuracy", "F1"], schema: "id,input,answer", sample: "{如何办理业务材料？}", citation: "内部数据集，无公开引用", versionDetails: { "v2": { count: 5200, sample: "{\"如何办理业务材料？\"}", schema: "id,input,answer", updatedAt: "2026-07-16", releaseNote: "新增 1400 条社保与户籍业务数据；统一问答格式。" }, "v1": { count: 3800, sample: "{\"业务办理需要什么？\"}", schema: "input,answer", updatedAt: "2026-06-05", releaseNote: "初始版本。" } } },
  { id: 9, name: "多模态业务回归集", description: "校验通过的多模态业务回归数据。", source: "mine", modelType: "多模态模型", tasks: ["图文描述", "视觉问答", "文档解析"], format: "JSONL", count: 860, domain: "图像、文档", version: "v1", versions: ["v1"], recommendedVersion: "v1", status: "校验通过", permission: "仅自己可见", creator: "admin", team: "公共", updatedAt: "2026-07-18 10:45:00", metrics: ["VQA Score", "Accuracy"], schema: "image_url,question,answer", sample: "{\"image_url\":\"https://example.test/1.png\",\"question\":\"图中是什么？\",\"answer\":\"设备面板\"}", citation: "内部数据集，无公开引用" },
];

const thSt: React.CSSProperties = { padding: "9px 12px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12.5, borderBottom: "1px solid #e8ebf2", whiteSpace: "nowrap", background: "#f8f9fc" };
const tdSt: React.CSSProperties = { padding: "10px 12px", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", verticalAlign: "middle" };
const inputSt: React.CSSProperties = { width: "100%", height: 34, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", color: "#1a1d23", boxSizing: "border-box" };

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { current += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += character;
  }
  values.push(current.trim());
  return values;
}

function downloadDatasetTemplate(modelType: "语言模型" | "多模态模型", task: string, format: "JSONL" | "CSV") {
  let content: string;
  let filename: string;
  if (format === "JSONL") {
    content = modelType === "多模态模型"
      ? '{"image_url":"https://example.test/image.png","question":"图中是什么？","answer":"设备面板"}\n'
      : task === "代码生成"
        ? '{"prompt":"def add(a, b):","test":"assert add(1, 2) == 3"}\n'
        : '{"input":"请回答问题","answer":"标准答案"}\n';
    filename = "evaluation-dataset-template.jsonl";
  } else {
    content = modelType === "多模态模型"
      ? 'image_url,question,answer\n"https://example.test/image.png","图中是什么？","设备面板"\n'
      : task === "代码生成"
        ? 'prompt,test\n"def add(a, b):","assert add(1, 2) == 3"\n'
        : 'input,answer\n"请回答问题","标准答案"\n';
    filename = "evaluation-dataset-template.csv";
  }
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: DatasetStatus }) {
  const style = STATUS_CFG[status];
  return <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px", borderRadius: 5, border: `1px solid ${style.border}`, background: style.bg, color: style.text, fontSize: 12.5, fontWeight: 500 }}>{status}</span>;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 7 }}>{required && <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>}{children}</div>;
}

function TextButton({ children, onClick, danger, disabled }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{ border: "none", background: "none", padding: 0, cursor: disabled ? "not-allowed" : "pointer", color: disabled ? "#9ca3af" : danger ? "#ef4444" : "#4f6ef7", fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap" }}>{children}</button>;
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 6, border: "none", background: disabled ? "#aeb9f8" : "#4f6ef7", color: "#fff", fontSize: 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer" }}>{children}</button>;
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 6, border: "1px solid #e0e3ed", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{children}</button>;
}

function versionData(row: DatasetRow, version: string): VersionDetail {
  return row.versionDetails?.[version] ?? { count: row.count, sample: row.sample, schema: row.schema, citation: row.citation, updatedAt: row.updatedAt };
}

function DatasetDetailPage({ row, onBack, onSetRecommended }: { row: DatasetRow; onBack: () => void; onSetRecommended: (version: string) => void }) {
  const [selectedVersion, setSelectedVersion] = useState(row.version);

  const vd = versionData(row, selectedVersion);
  const currentCount = vd.count;
  const currentSample = vd.sample;
  const currentSchema = vd.schema;
  const currentCitation = vd.citation || row.citation;

  return <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
    <div className="flex items-center gap-1.5" style={{ padding: "10px 18px 0", fontSize: 12.5, color: "#6b7280" }}><span style={{ color: "#4f6ef7" }}>首页</span><span>/</span><span style={{ color: "#4f6ef7" }}>模型评测</span><span>/</span><button onClick={onBack} style={{ border: "none", background: "none", color: "#4f6ef7", padding: 0, cursor: "pointer" }}>评测数据</button><span>/</span><span>数据集详情</span></div>
    <div style={{ margin: "10px 18px 18px", background: "#fff", border: "1px solid #e8ebf2", borderRadius: 8, overflow: "auto" }}>
      <div className="flex items-start justify-between" style={{ padding: "14px 18px 12px", borderBottom: "1px solid #f0f2f7" }}>
        <div>
          <div className="flex items-center gap-2"><h2 style={{ margin: 0, fontSize: 17 }}>{row.name}</h2><StatusBadge status={row.status} /></div>
          <p style={{ margin: "5px 0 0", color: "#6b7280", fontSize: 13 }}>{row.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)} style={{ ...inputSt, width: 150, height: 32 }}>
            {row.versions.map(v => <option key={v}>{v}{v === row.recommendedVersion ? "（推荐）" : ""}</option>)}
          </select>
          <SecondaryButton onClick={onBack}><ChevronLeft size={14} />返回列表</SecondaryButton>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {row.validationError && <div style={{ marginBottom: 12, padding: 10, border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 7, color: "#dc2626", fontSize: 12.5 }}>校验错误：{row.validationError}</div>}
        <h3 style={{ fontSize: 14, margin: "0 0 10px" }}>数据概览</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", borderTop: "1px solid #e8ebf2", borderLeft: "1px solid #e8ebf2" }}>
          {[["数据规模", `${currentCount.toLocaleString()}行`], ["领域分类", row.domain], ["模型类型", row.modelType], ["适用任务", row.tasks.join("、")], ["文件格式", row.format], ["推荐指标", row.metrics.join("、")], ["当前版本", selectedVersion === row.recommendedVersion ? `${selectedVersion} · 推荐` : selectedVersion], ["创建人", row.creator], ["所属团队", row.team], ["权限状态", row.permission]].map(([label, value]) => <div key={label} style={{ padding: "9px 11px", borderRight: "1px solid #e8ebf2", borderBottom: "1px solid #e8ebf2", fontSize: 12.5 }}><div style={{ color: "#9ca3af", fontSize: 11.5 }}>{label}</div><div style={{ marginTop: 3, color: "#1a1d23", fontWeight: 500 }}>{value}</div></div>)}
        </div>
        <h3 style={{ fontSize: 14, margin: "16px 0 6px" }}>引用信息</h3>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "#374151" }}>{currentCitation}</p>

        <h3 style={{ fontSize: 14, margin: "18px 0 8px", paddingTop: 14, borderTop: "1px solid #eef1f6" }}>数据样例</h3>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}><span style={{ fontSize: 12, color: "#6b7280" }}>展示所选版本的样例数据</span><button onClick={() => downloadDatasetTemplate(row.modelType, row.tasks[0], "JSONL")} style={{ display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "none", color: "#4f6ef7", cursor: "pointer", fontSize: 12.5 }}><Download size={13} />下载样例文件</button></div>
        <pre style={{ background: "#111827", color: "#d1d5db", padding: 14, borderRadius: 8, whiteSpace: "pre-wrap", fontSize: 12.5 }}>{currentSample}</pre>
        <h4 style={{ fontSize: 13, margin: "14px 0 6px" }}>Schema</h4>
        <div style={{ padding: "11px 13px", border: "1px solid #e8ebf2", borderRadius: 7 }}><code style={{ fontSize: 13 }}>{currentSchema}</code></div>

        <h3 style={{ fontSize: 14, margin: "18px 0 8px", paddingTop: 14, borderTop: "1px solid #eef1f6" }}>版本管理</h3>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 9 }}>创建评测任务时默认选择推荐版本；切换上方版本下拉可对比不同版本的数据。</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
          <thead><tr>{["版本", "是否推荐", "更新说明", "更新时间", "操作"].map(c => <th key={c} style={thSt}>{c}</th>)}</tr></thead>
          <tbody>
            {row.versions.map(v => {
              const d = versionData(row, v);
              const note = d.releaseNote || "—";
              const isRec = v === row.recommendedVersion;
              return <tr key={v} style={{ background: v === selectedVersion ? "#f7f9ff" : undefined }}>
                <td style={{ ...tdSt, fontWeight: 600 }}>{v}{v === selectedVersion ? <span style={{ color: "#4f6ef7", marginLeft: 5, fontSize: 11 }}>当前查看</span> : null}</td>
                <td style={tdSt}>{isRec ? <span style={{ color: "#16a34a", fontWeight: 500 }}>推荐</span> : <span style={{ color: "#9ca3af" }}>否</span>}</td>
                <td style={{ ...tdSt, color: "#6b7280", fontSize: 12, minWidth: 180 }}>{note}</td>
                <td style={{ ...tdSt, whiteSpace: "nowrap", color: "#6b7280" }}>{d.updatedAt || row.updatedAt}</td>
                <td style={tdSt}>{isRec ? <span style={{ color: "#9ca3af", fontSize: 12 }}>已是推荐</span> : <TextButton onClick={() => onSetRecommended(v)}>设为推荐</TextButton>}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}

function nextVersion(versions: string[]): string {
  const sorted = [...versions].sort();
  const last = sorted[sorted.length - 1];
  const match = last.match(/^v(\d+)(?:\.(\d+))?$/);
  if (match) {
    const major = parseInt(match[1], 10);
    if (match[2] !== undefined) return `v${major + 1}.0`;
    return `v${major + 1}`;
  }
  return `v${versions.length + 1}`;
}

function EditDatasetPage({ row, onBack, onSave }: { row: DatasetRow; onBack: () => void; onSave: (updated: DatasetRow) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description);
  const [modelType, setModelType] = useState<"语言模型" | "多模态模型" | "">(row.modelType);
  const [task, setTask] = useState(row.tasks[0] || "");
  const [recommendedVersion, setRecommendedVersion] = useState(row.recommendedVersion);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState("");
  const [versionValidating, setVersionValidating] = useState(false);
  const [versionError, setVersionError] = useState("");
  const [versionCount, setVersionCount] = useState(0);
  const [versionSample, setVersionSample] = useState("");
  const [error, setError] = useState("");

  const newVer = nextVersion(row.versions);

  const validateVersionFile = async (file: File) => {
    setVersionFile(file);
    setVersionValidating(true);
    setVersionError("");
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "jsonl" && ext !== "csv") { setVersionError("仅支持 JSONL 或 CSV 文件"); setVersionValidating(false); return; }
    const requiredFields = row.modelType === "多模态模型" ? ["image_url", "question", "answer"] : row.tasks[0] === "代码生成" ? ["prompt", "test"] : ["input", "answer"];
    try {
      const content = await file.text();
      const lines = content.split(/\r?\n/).filter(l => l.trim());
      const errors: string[] = [];
      if (!lines.length) errors.push("文件为空");
      if (ext === "jsonl") {
        lines.forEach((line, i) => { if (errors.length >= 3) return; try { const v = JSON.parse(line) as Record<string, unknown>; if (!v || Array.isArray(v) || typeof v !== "object") errors.push(`第 ${i + 1} 行不是 JSON 对象`); else { const missing = requiredFields.filter(f => !(f in v) || v[f] === "" || v[f] == null); if (missing.length) errors.push(`第 ${i + 1} 行缺少：${missing.join("、")}`); } } catch { errors.push(`第 ${i + 1} 行 JSON 语法错误`); } });
      } else if (lines.length) {
        const headers = parseCsvLine(lines[0]).map(f => f.replace(/^﻿/, ""));
        const missingHeaders = requiredFields.filter(f => !headers.includes(f));
        if (missingHeaders.length) errors.push(`表头缺少：${missingHeaders.join("、")}`);
        lines.slice(1).forEach((line, i) => { if (errors.length >= 3) return; const vals = parseCsvLine(line); if (vals.length !== headers.length) errors.push(`第 ${i + 2} 行列数 ${vals.length}，应为 ${headers.length}`); else { const missing = requiredFields.filter(f => !vals[headers.indexOf(f)]?.trim()); if (missing.length) errors.push(`第 ${i + 2} 行缺少：${missing.join("、")}`); } });
      }
      setVersionCount(ext === "jsonl" ? lines.length : Math.max(0, lines.length - 1));
      const firstLine = ext === "jsonl" ? lines[0] : lines.length > 1 ? `${lines[0]}\n${lines[1]}` : lines[0] || "";
      setVersionSample(firstLine.length > 200 ? firstLine.substring(0, 200) + "..." : firstLine);
      if (errors.length) setVersionError(errors.join("；"));
      setVersionValidating(false);
    } catch (e) { setVersionError(e instanceof Error ? e.message : "读取失败"); setVersionValidating(false); }
  };

  const submit = () => {
    if (!name.trim() || !description.trim() || !modelType || !task) { setError("请完整填写数据集名称、描述、模型类型和适用任务。"); return; }
    let updated: DatasetRow = { ...row, name: name.trim(), description: description.trim(), modelType, tasks: [task], recommendedVersion };
    if (versionFile && !versionError && versionCount > 0) {
      updated = { ...updated, count: versionCount, version: newVer, versions: [...updated.versions.filter(v => v !== newVer), newVer], recommendedVersion: newVer, updatedAt: new Date().toISOString().slice(0, 10), sample: versionSample, versionDetails: { ...updated.versionDetails, [newVer]: { count: versionCount, sample: versionSample, schema: updated.schema, updatedAt: new Date().toISOString().slice(0, 10), releaseNote: versionNote.trim() || undefined } } };
    }
    onSave(updated);
  };

  const taskOptions = modelType === "语言模型" ? ["文本理解", "代码生成", "逻辑推理", "问答"] : modelType === "多模态模型" ? ["图文描述", "视觉问答", "文档解析"] : [];
  return <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
    <div className="flex items-center gap-1.5" style={{ padding: "10px 18px 0", fontSize: 12.5, color: "#6b7280" }}><span style={{ color: "#4f6ef7" }}>首页</span><span>/</span><span style={{ color: "#4f6ef7" }}>模型评测</span><span>/</span><button onClick={onBack} style={{ border: "none", background: "none", color: "#4f6ef7", padding: 0, cursor: "pointer" }}>评测数据</button><span>/</span><span>编辑数据集</span></div>
    <div className="flex-1 min-h-0" style={{ margin: "10px 18px 18px", background: "#fff", border: "1px solid #e8ebf2", borderRadius: 8, overflow: "auto" }}>
      <div className="flex items-center justify-between" style={{ padding: "13px 18px", borderBottom: "1px solid #f0f2f7", position: "sticky", top: 0, zIndex: 4, background: "#fff" }}><div><div style={{ fontSize: 16, fontWeight: 600 }}>编辑数据集</div><div style={{ marginTop: 3, color: "#6b7280", fontSize: 12 }}>修改数据集元数据，可选上传新版本数据文件。</div></div><SecondaryButton onClick={onBack}><ChevronLeft size={14} />返回列表</SecondaryButton></div>
      <div style={{ padding: "0 20px 18px" }}>
        <main>
          {error && <div style={{ marginTop: 18, padding: 10, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", borderRadius: 7, fontSize: 13 }}>{error}</div>}
          <section style={{ padding: "18px 0", borderBottom: "1px solid #eef1f6" }}><h3 style={{ margin: "0 0 13px", fontSize: 14 }}>基础信息</h3><div style={{ marginBottom: 11 }}><FieldLabel required>数据集名称</FieldLabel><input value={name} onChange={e => setName(e.target.value)} style={inputSt} /></div><div><FieldLabel required>数据集描述</FieldLabel><textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputSt, height: 72, padding: 9, fontFamily: "inherit", resize: "vertical" }} /></div></section>
          <section style={{ padding: "18px 0", borderBottom: "1px solid #eef1f6" }}><h3 style={{ margin: "0 0 13px", fontSize: 14 }}>类型与格式</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}><div><FieldLabel required>模型类型</FieldLabel><select value={modelType} onChange={e => { setModelType(e.target.value as typeof modelType); setTask(""); }} style={inputSt}><option value="">请选择模型类型</option><option>语言模型</option><option>多模态模型</option></select></div><div><FieldLabel required>适用任务</FieldLabel><select value={task} onChange={e => setTask(e.target.value)} style={inputSt}><option value="">请选择适用任务</option>{taskOptions.map(o => <option key={o}>{o}</option>)}</select></div></div></section>
          <section style={{ padding: "18px 0", borderBottom: "1px solid #eef1f6" }}><h3 style={{ margin: "0 0 8px", fontSize: 14 }}>上传新版本</h3><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>可选，不上传则仅更新元数据。上传后版本号自动递增并设为推荐。</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><FieldLabel>版本号（自动）</FieldLabel><div style={{ ...inputSt, display: "flex", alignItems: "center", background: "#f5f7fa", color: "#6b7280" }}>{newVer}</div></div>
              <div><FieldLabel>更新说明</FieldLabel><input value={versionNote} onChange={e => setVersionNote(e.target.value)} placeholder="版本变更内容" style={inputSt} /></div>
            </div>
            <FieldLabel required>数据文件</FieldLabel>
            <input ref={fileInputRef} type="file" accept=".jsonl,.csv" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) validateVersionFile(f); }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ width: "100%", border: "1.5px dashed #93c5fd", borderRadius: 8, padding: 14, background: "#f8faff", cursor: "pointer", fontSize: 12 }}>{versionFile ? <span className="flex items-center gap-2"><FileText size={14} color="#4f6ef7" />{versionFile.name}</span> : <span>点击上传 JSONL 或 CSV 文件</span>}</button>
            {versionValidating && <div style={{ marginTop: 5, fontSize: 12, color: "#2563eb" }}>校验中…</div>}
            {!versionValidating && versionFile && !versionError && versionCount > 0 && <div style={{ marginTop: 5, fontSize: 12, color: "#16a34a" }}>校验通过 · {versionCount.toLocaleString()}行</div>}
            {versionError && <div style={{ marginTop: 5, fontSize: 12, color: "#dc2626" }}>校验失败：{versionError}</div>}
          </section>
          <section style={{ padding: "18px 0", borderBottom: "1px solid #eef1f6" }}><h3 style={{ margin: "0 0 8px", fontSize: 14 }}>版本管理</h3><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 9 }}>选择推荐版本；创建评测任务时默认使用推荐版本。</div>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}><thead><tr>{["版本", "是否推荐", "更新说明", "更新时间", "操作"].map(c => <th key={c} style={thSt}>{c}</th>)}</tr></thead>
              <tbody>{row.versions.map(v => { const d = versionData(row, v); return <tr key={v} style={{ background: v === recommendedVersion ? "#f0faf5" : undefined }}><td style={{ ...tdSt, fontWeight: 600 }}>{v}</td><td style={tdSt}>{v === recommendedVersion ? <span style={{ color: "#16a34a", fontWeight: 500 }}>推荐</span> : <span style={{ color: "#9ca3af" }}>否</span>}</td><td style={{ ...tdSt, color: "#6b7280", fontSize: 12, minWidth: 180 }}>{d.releaseNote || "—"}</td><td style={{ ...tdSt, whiteSpace: "nowrap", color: "#6b7280" }}>{d.updatedAt || row.updatedAt}</td><td style={tdSt}>{v === recommendedVersion ? <span style={{ color: "#9ca3af", fontSize: 12 }}>已是推荐</span> : <TextButton onClick={() => setRecommendedVersion(v)}>设为推荐</TextButton>}</td></tr>; })}</tbody></table></section>
          <div className="flex items-center justify-end gap-2" style={{ position: "sticky", bottom: 0, padding: "11px 0", borderTop: "1px solid #f0f2f7", background: "#fff", zIndex: 3 }}><SecondaryButton onClick={onBack}>取消</SecondaryButton><PrimaryButton onClick={submit}>保存</PrimaryButton></div>
        </main>
      </div>
    </div>
  </div>;
}

function UploadDatasetPage({ onBack, onDone, uploadMode = "mine" }: { onBack: () => void; onDone: (row: DatasetRow) => void; uploadMode?: "mine" | "public" }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const fileValidationRun = useRef(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [modelType, setModelType] = useState<"语言模型" | "多模态模型" | "">("");
  const [task, setTask] = useState("");
  const [fileName, setFileName] = useState("");
  const [format, setFormat] = useState<"JSONL" | "CSV" | "压缩包">("JSONL");
  const [validation, setValidation] = useState<DatasetStatus | "">("");
  const [error, setError] = useState("");
  const [recordCount, setRecordCount] = useState(0);
  const [validationSummary, setValidationSummary] = useState("");
  const [uploadScope, setUploadScope] = useState<"private" | "team">("private");
  const [uploadSubPermission, setUploadSubPermission] = useState<"只读" | "编辑">("只读");
  const [sample, setSample] = useState("");
  const [domain, setDomain] = useState("自定义");
  const [citation, setCitation] = useState("内部数据集，无公开引用");
  const uploadPermission: DatasetRow["permission"] = uploadMode === "public" ? "公开" : uploadScope === "private" ? "仅自己可见" : `团队成员可见（${uploadSubPermission}）`;

  const resetFile = () => {
    fileValidationRun.current += 1;
    setFileName("");
    setFormat("JSONL");
    setValidation("");
    setError("");
    setRecordCount(0);
    setValidationSummary("");
    setSample("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const selectFile = async (file?: File) => {
    if (!file) return;
    if (!modelType || !task) {
      setError("请先选择模型类型和适用任务，再上传数据文件。");
      return;
    }
    const validationRun = fileValidationRun.current + 1;
    fileValidationRun.current = validationRun;
    const extension = file.name.split(".").pop()?.toLowerCase();
    setFileName(file.name);
    setValidation("校验中");
    setError("");
    setValidationSummary("正在读取文件并校验 Schema…");
    setRecordCount(0);
    if (extension !== "jsonl" && extension !== "csv" && extension !== "zip") {
      setValidation("校验失败");
      setError("文件格式不支持，请上传 JSONL、CSV 或 ZIP 压缩包文件。");
      setValidationSummary("未执行内容校验");
      return;
    }
    if (extension === "zip") {
      setFormat("压缩包");
      setRecordCount(0);
      setValidationSummary("压缩包已上传，将在后台解压并校验 Schema；适用于多模态模型评测数据集（含图片等素材）。");
      return;
    }
    const nextFormat = extension === "jsonl" ? "JSONL" : "CSV";
    setFormat(nextFormat);
    const requiredFields = modelType === "多模态模型"
      ? ["image_url", "question", "answer"]
      : task === "代码生成" ? ["prompt", "test"] : ["input", "answer"];
    try {
      const content = await file.text();
      if (validationRun !== fileValidationRun.current) return;
      const lines = content.split(/\r?\n/).filter(line => line.trim());
      const errors: string[] = [];
      if (!lines.length) errors.push("文件为空");
      if (nextFormat === "JSONL") {
        lines.forEach((line, index) => {
          if (errors.length >= 5) return;
          try {
            const value = JSON.parse(line) as Record<string, unknown>;
            if (!value || Array.isArray(value) || typeof value !== "object") errors.push(`第 ${index + 1} 行不是 JSON 对象`);
            else {
              const missing = requiredFields.filter(field => !(field in value) || value[field] === "" || value[field] == null);
              if (missing.length) errors.push(`第 ${index + 1} 行缺少必填字段：${missing.join("、")}`);
            }
          } catch {
            errors.push(`第 ${index + 1} 行 JSON 语法错误`);
          }
        });
      } else if (lines.length) {
        const headers = parseCsvLine(lines[0]).map(field => field.replace(/^\uFEFF/, ""));
        const missingHeaders = requiredFields.filter(field => !headers.includes(field));
        if (missingHeaders.length) errors.push(`表头缺少必填字段：${missingHeaders.join("、")}`);
        lines.slice(1).forEach((line, index) => {
          if (errors.length >= 5) return;
          const values = parseCsvLine(line);
          if (values.length !== headers.length) errors.push(`第 ${index + 2} 行列数为 ${values.length}，应为 ${headers.length}`);
          else {
            const missing = requiredFields.filter(field => !values[headers.indexOf(field)]?.trim());
            if (missing.length) errors.push(`第 ${index + 2} 行缺少必填值：${missing.join("、")}`);
          }
        });
      }
      const count = nextFormat === "JSONL" ? lines.length : Math.max(0, lines.length - 1);
      setRecordCount(count);
      const firstLine = nextFormat === "JSONL" ? lines[0] : lines.length > 1 ? `${lines[0]}\n${lines[1]}` : lines[0] || "";
      setSample(firstLine.length > 200 ? firstLine.substring(0, 200) + "…" : firstLine);
      if (errors.length) {
        setValidation("校验失败");
        setError(errors.join("；"));
        setValidationSummary(`已检查 ${count.toLocaleString()} 条记录，展示前 ${errors.length} 个错误`);
      } else {
        setValidation("校验通过");
        setError("");
        setValidationSummary(`已检查 ${count.toLocaleString()} 条记录；必填字段 ${requiredFields.join("、")} 均有效`);
      }
    } catch (reason) {
      if (validationRun !== fileValidationRun.current) return;
      setValidation("校验失败");
      setError(reason instanceof Error ? `文件读取失败：${reason.message}` : "文件读取失败");
      setValidationSummary("无法完成内容校验");
    }
  };

  const submit = () => {
    if (!name.trim() || !description.trim() || !modelType || !task || !fileName) { setError("请完整填写数据集名称、描述、模型类型、适用任务并上传数据文件。"); return; }
    onDone({ id: Date.now(), name: name.trim(), description: description.trim(), source: uploadMode, modelType, tasks: [task], format, count: recordCount, domain: domain.trim() || "自定义", version: "v1", versions: ["v1"], recommendedVersion: "v1", status: validation || "校验中", permission: uploadPermission, creator: "admin", team: uploadMode === "public" ? "系统" : "公共", updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }), metrics: task === "代码生成" ? ["Pass@1"] : modelType === "多模态模型" ? ["VQA Score", "Accuracy"] : ["Accuracy", "F1"], schema: modelType === "多模态模型" ? "image_url,question,answer" : task === "代码生成" ? "prompt,test" : "input,answer", sample: sample || fileName, citation: citation.trim() || "内部数据集，无公开引用", validationError: validation === "校验失败" ? error : undefined });
    onBack();
  };

  const taskOptions = modelType === "语言模型" ? ["文本理解", "代码生成", "逻辑推理", "问答"] : modelType === "多模态模型" ? ["图文描述", "视觉问答", "文档解析"] : [];
  return <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
    <div className="flex items-center gap-1.5" style={{ padding: "10px 18px 0", fontSize: 12.5, color: "#6b7280" }}><span style={{ color: "#4f6ef7" }}>首页</span><span>/</span><span style={{ color: "#4f6ef7" }}>模型评测</span><span>/</span><button onClick={onBack} style={{ border: "none", background: "none", color: "#4f6ef7", padding: 0, cursor: "pointer" }}>评测数据</button><span>/</span><span>上传数据集</span></div>
    <div className="flex-1 min-h-0" style={{ margin: "10px 18px 18px", background: "#fff", border: "1px solid #e8ebf2", borderRadius: 8, overflow: "auto" }}>
      <div className="flex items-center justify-between" style={{ padding: "13px 18px", borderBottom: "1px solid #f0f2f7", position: "sticky", top: 0, zIndex: 4, background: "#fff" }}><div><div style={{ fontSize: 16, fontWeight: 600 }}>上传数据集</div><div style={{ marginTop: 3, color: "#6b7280", fontSize: 12 }}>上传后系统自动校验文件格式和必填字段。</div></div><SecondaryButton onClick={onBack}><ChevronLeft size={14} />返回列表</SecondaryButton></div>
      <div style={{ padding: "0 20px 18px" }}>
        <main>
          {error && <div style={{ marginTop: 18, padding: 10, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", borderRadius: 7, fontSize: 13 }}>{error}</div>}
          <section id="dataset-basic" style={{ padding: "18px 0", borderBottom: "1px solid #eef1f6" }}><h3 style={{ margin: "0 0 13px", fontSize: 14 }}>基础信息</h3><div style={{ marginBottom: 11 }}><FieldLabel required>数据集名称</FieldLabel><input value={name} onChange={event => setName(event.target.value)} placeholder="请输入数据集名称" style={inputSt} /></div><div><FieldLabel required>数据集描述</FieldLabel><textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="请说明数据来源、用途和适用范围" style={{ ...inputSt, height: 72, padding: 9, fontFamily: "inherit", resize: "vertical" }} /></div></section>
          <section id="dataset-format" style={{ padding: "18px 0", borderBottom: "1px solid #eef1f6" }}><h3 style={{ margin: "0 0 13px", fontSize: 14 }}>类型与格式</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}><div><FieldLabel required>模型类型</FieldLabel><select value={modelType} onChange={event => { setModelType(event.target.value as typeof modelType); setTask(""); resetFile(); }} style={inputSt}><option value="">请选择模型类型</option><option>语言模型</option><option>多模态模型</option></select></div><div><FieldLabel required>适用任务</FieldLabel><select value={task} onChange={event => { setTask(event.target.value); resetFile(); }} style={inputSt}><option value="">请选择适用任务</option>{taskOptions.map(option => <option key={option}>{option}</option>)}</select></div></div><div style={{ marginTop: 12, padding: "10px 12px", background: "#f7f9ff", border: "1px solid #dbe5ff", borderRadius: 7, fontSize: 12, lineHeight: 1.7 }}><div className="flex items-center gap-2" style={{ fontWeight: 600, color: "#374151" }}><Info size={14} color="#4f6ef7" />格式说明</div><div style={{ color: "#6b7280", marginTop: 3 }}>{!modelType || !task ? "选择模型类型和适用任务后显示必填字段。" : `${modelType === "多模态模型" ? "必填字段：image_url、question、answer" : task === "代码生成" ? "必填字段：prompt、test" : "必填字段：input、answer"}。JSONL 每行一个 JSON 对象；CSV 第一行为表头。多模态模型评测数据集（含图片等素材）请打包为 ZIP 压缩包上传。样例文件内容由开发提供。`}</div><div className="flex items-center gap-2" style={{ marginTop: 8 }}><button onClick={() => downloadDatasetTemplate(modelType || "语言模型", task || "文本理解", "JSONL")} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid #dbe5ff", borderRadius: 5, background: "#fff", color: "#4f6ef7", fontSize: 12, cursor: "pointer" }}><Download size={12} />下载 JSONL 样例</button><button onClick={() => downloadDatasetTemplate(modelType || "语言模型", task || "文本理解", "CSV")} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid #dbe5ff", borderRadius: 5, background: "#fff", color: "#4f6ef7", fontSize: 12, cursor: "pointer" }}><Download size={12} />下载 CSV 样例</button></div></div></section>
          <section id="dataset-upload" style={{ padding: "18px 0", borderBottom: "1px solid #eef1f6" }}>
            <h3 style={{ margin: "0 0 13px", fontSize: 14 }}>数据上传</h3>
            <FieldLabel required>数据文件</FieldLabel>
            <input ref={fileInput} type="file" accept=".jsonl,.csv,.zip" style={{ display: "none" }} onChange={event => selectFile(event.target.files?.[0])} />
            {fileName ? (
              <div className="flex items-center justify-between" style={{ minHeight: 52, padding: "8px 12px", border: "1px solid #dbe5ff", borderRadius: 8, background: "#f8faff" }}>
                <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                  <FileText size={18} color="#4f6ef7" style={{ flexShrink: 0 }} />
                  <span title={fileName} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "#374151" }}>{fileName}</span>
                </div>
                <button type="button" aria-label="删除已上传文件" title="删除文件" onClick={resetFile} style={{ width: 30, height: 30, marginLeft: 12, border: "none", borderRadius: 5, background: "transparent", color: "#6b7280", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInput.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]); }} style={{ width: "100%", border: "1.5px dashed #93c5fd", borderRadius: 8, padding: 24, background: "#f8faff", cursor: "pointer" }}>
                <span><Upload size={22} color="#93c5fd" style={{ margin: "0 auto 6px" }} />点击或拖拽上传 JSONL、CSV、ZIP 文件</span>
              </button>
            )}
            {validation && <div className="flex items-start gap-2" style={{ marginTop: 9, fontSize: 12.5, color: validation === "校验通过" ? "#16a34a" : validation === "校验失败" ? "#dc2626" : "#2563eb" }}>{validation === "校验通过" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}<span><b>{validation}</b>：{validationSummary}</span></div>}
          </section>
          {uploadMode === "public" && <section id="dataset-meta" style={{ padding: "18px 0", borderBottom: "1px solid #eef1f6" }}><h3 style={{ margin: "0 0 13px", fontSize: 14 }}>元数据信息</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}><div><FieldLabel required>领域分类</FieldLabel><input value={domain} onChange={e => setDomain(e.target.value)} placeholder="请输入领域，如自然语言处理、医疗、金融等" style={inputSt} /></div></div><div style={{ marginTop: 12 }}><FieldLabel required>引用信息</FieldLabel><input value={citation} onChange={e => setCitation(e.target.value)} placeholder="请填写数据来源、论文或报告引用" style={inputSt} /></div></section>}
          {uploadMode === "mine" && <section id="dataset-permission" style={{ padding: "18px 0", borderBottom: "1px solid #eef1f6" }}><h3 style={{ margin: "0 0 13px", fontSize: 14 }}>权限设置</h3><div style={{ marginBottom: 11 }}><FieldLabel>可见范围</FieldLabel><select value={uploadScope} onChange={e => setUploadScope(e.target.value as typeof uploadScope)} style={inputSt}><option value="private">仅自己可见</option><option value="team">团队成员可见</option></select></div>{uploadScope === "team" && <div><FieldLabel>团队成员权限</FieldLabel><select value={uploadSubPermission} onChange={e => setUploadSubPermission(e.target.value as typeof uploadSubPermission)} style={inputSt}><option value="只读">只读</option><option value="编辑">编辑</option></select></div>}</section>}
          <div className="flex items-center justify-end gap-2" style={{ position: "sticky", bottom: 0, padding: "11px 0", borderTop: "1px solid #f0f2f7", background: "#fff", zIndex: 3 }}><SecondaryButton onClick={onBack}>取消</SecondaryButton><PrimaryButton disabled={!validation || validation === "校验中"} onClick={submit}>上传</PrimaryButton></div>
        </main>      </div>
    </div>
  </div>;
}

function ShareDrawer({ row, onClose, onSave }: { row: DatasetRow; onClose: () => void; onSave: (permission: "仅自己可见" | "团队成员可见（只读）" | "团队成员可见（编辑）") => void }) {
  const alreadyShared = row.permission !== "仅自己可见";
  const permToScope = (p: string) => p === "仅自己可见" ? "private" : "team";
  const permToSub = (p: string) => p === "团队成员可见（编辑）" ? "edit" : "readonly";
  const [scope, setScope] = useState<"private" | "team">(permToScope(row.permission));
  const [subPermission, setSubPermission] = useState<"只读" | "编辑">(permToSub(row.permission));
  const assembled: "仅自己可见" | "团队成员可见（只读）" | "团队成员可见（编辑）" = scope === "private" ? "仅自己可见" : `团队成员可见（${subPermission}）`;
  const showShareWarning = !alreadyShared && scope === "team";
  return <><div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 120 }} /><div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 440, background: "#fff", zIndex: 121, padding: 22 }}><div className="flex items-center justify-between"><b>数据集共享设置</b><button onClick={onClose} style={{ border: "none", background: "none" }}><X size={18} /></button></div><p style={{ color: "#6b7280", fontSize: 13 }}>{row.name}</p><FieldLabel>可见范围</FieldLabel><select value={scope} onChange={e => setScope(e.target.value as typeof scope)} style={{ ...inputSt, marginBottom: 14 }}><option value="private" disabled={alreadyShared}>仅自己可见</option><option value="team">团队成员可见</option></select>{alreadyShared && <div style={{ marginBottom: 14, color: "#f59e0b", fontSize: 12 }}>数据集已共享至团队，不可改回仅自己可见。</div>}{showShareWarning && <div style={{ marginBottom: 14, color: "#dc2626", fontSize: 12, fontWeight: 600 }}>共享至团队后，不可改回仅自己可见，请谨慎修改。</div>}{scope === "team" && <><FieldLabel>团队成员权限</FieldLabel><select value={subPermission} onChange={e => setSubPermission(e.target.value as typeof subPermission)} style={inputSt}><option value="只读">只读</option><option value="编辑">编辑</option></select></>}<div className="flex items-center justify-end gap-2" style={{ marginTop: 20 }}><SecondaryButton onClick={onClose}>取消</SecondaryButton><PrimaryButton onClick={() => onSave(assembled)}>保存</PrimaryButton></div></div></>;
}

export function EvaluationDataPage() {
  const [tab, setTab] = useState<DatasetTab>("public");
  const [rows, setRows] = useState<DatasetRow[]>(() => {
    const stored = loadStoredEvaluationDatasets();
    return [...stored, ...INITIAL_DATASETS.filter(row => !stored.some(item => item.id === row.id || item.name === row.name))];
  });
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [modelType, setModelType] = useState("");
  const [creatorFilter, setCreatorFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [detailRow, setDetailRow] = useState<DatasetRow | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<"mine" | "public">("mine");
  const [shareRow, setShareRow] = useState<DatasetRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<DatasetRow | null>(null);
  const [editRow, setEditRow] = useState<DatasetRow | null>(null);
  const [message, setMessage] = useState("");
  const [isAdmin] = useState(true);

  if (detailRow) {
    const liveRow = rows.find(r => r.id === detailRow.id) || detailRow;
    return <DatasetDetailPage row={liveRow} onBack={() => setDetailRow(null)}
      onSetRecommended={version => {
        const updated = { ...liveRow, recommendedVersion: version };
        setRows(prev => prev.map(r => r.id === liveRow.id ? updated : r));
        setDetailRow(updated);
        saveStoredEvaluationDataset(updated);
        setMessage(`已将 ${version} 设为推荐版本`);
      }}
    />;
  }
  if (uploadOpen) return <UploadDatasetPage uploadMode={uploadMode} onBack={() => setUploadOpen(false)} onDone={row => { saveStoredEvaluationDataset(row); setRows(prev => [row, ...prev.filter(item => item.id !== row.id && item.name !== row.name)]); setMessage(row.status === "校验通过" ? "数据集已上传并校验通过，可用于评测" : "数据集已上传，但校验失败；请根据错误修正后重新上传"); }} />;
  if (editRow) return <EditDatasetPage row={editRow} onBack={() => setEditRow(null)} onSave={(updated) => { saveStoredEvaluationDataset(updated); setRows(prev => prev.map(r => r.id === updated.id ? updated : r)); setEditRow(null); setMessage(updated.version !== editRow.version ? `数据集已更新并上传新版本 ${updated.version}` : "数据集已更新"); }} />;
  const filtered = rows.filter(row => tab === "all-users" ? (row.source === "mine" || row.source === "shared") : row.source === tab).filter(row => !query || `${row.name} ${row.description}`.toLowerCase().includes(query.toLowerCase())).filter(row => !modelType || row.modelType === modelType).filter(row => !creatorFilter || row.creator === creatorFilter).filter(row => !teamFilter || row.team === teamFilter);

  return <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
    <div className="flex items-center justify-between" style={{ padding: "10px 18px 0" }}><div className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: "#6b7280" }}><span style={{ color: "#4f6ef7" }}>首页</span><span>/</span><span style={{ color: "#4f6ef7" }}>模型评测</span><span>/</span><span>评测数据</span></div>{message && <span style={{ color: "#16a34a", fontSize: 12.5 }}>{message}</span>}</div>
    <div className="flex-1 flex flex-col min-h-0" style={{ margin: "10px 18px 18px", background: "#fff", border: "1px solid #e8ebf2", borderRadius: 8, overflow: "hidden" }}>
      <div className="flex items-center justify-between" style={{ borderBottom: "1px solid #f0f2f7", padding: "0 12px" }}><div className="flex">{[{ key: "public", label: "公开数据集" }, { key: "mine", label: "我的数据集" }, { key: "shared", label: "团队共享" }, ...(isAdmin ? [{ key: "all-users", label: "平台用户数据集" }] : [])].map(item => <button key={item.key} onClick={() => { setTab(item.key as DatasetTab); setCreatorFilter(""); setTeamFilter(""); }} style={{ padding: "11px 13px", border: "none", borderBottom: tab === item.key ? "2px solid #4f6ef7" : "2px solid transparent", background: "none", color: tab === item.key ? "#4f6ef7" : "#6b7280", fontSize: 12.5, fontWeight: tab === item.key ? 600 : 400, cursor: "pointer" }}>{item.label}</button>)}</div>{tab === "mine" && <PrimaryButton onClick={() => { setUploadMode("mine"); setUploadOpen(true); }}><Upload size={14} />上传我的数据集</PrimaryButton>}{tab === "public" && isAdmin && <PrimaryButton onClick={() => { setUploadMode("public"); setUploadOpen(true); }}><Upload size={14} />上传公开数据集</PrimaryButton>}</div>
      <div className="flex items-center justify-between flex-wrap gap-2" style={{ padding: "9px 12px", borderBottom: "1px solid #f0f2f7" }}><div className="flex items-center gap-2"><div className="flex items-center" style={{ width: 230, height: 34, border: "1px solid #e0e3ed", borderRadius: 6, padding: "0 8px" }}><Search size={13} color="#9ca3af" /><input value={keyword} onChange={event => { setKeyword(event.target.value); setQuery(event.target.value); }} placeholder="数据集名称或简介" style={{ minWidth: 0, flex: 1, border: "none", outline: "none", paddingLeft: 7, fontSize: 13 }} />{keyword && <button title="清除搜索词" onClick={() => { setKeyword(""); setQuery(""); }} style={{ display: "inline-flex", border: "none", background: "none", padding: 2, color: "#9ca3af", cursor: "pointer" }}><X size={13} /></button>}</div><select value={modelType} onChange={event => setModelType(event.target.value)} style={{ ...inputSt, width: 120, height: 34 }}><option value="">全部模型</option><option>语言模型</option><option>多模态模型</option></select>{tab === "all-users" && <><select value={creatorFilter} onChange={e => setCreatorFilter(e.target.value)} style={{ ...inputSt, width: 120, height: 34 }}><option value="">全部创建人</option>{[...new Set(rows.filter(r => r.source === "mine" || r.source === "shared").map(r => r.creator))].map(c => <option key={c}>{c}</option>)}</select><select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} style={{ ...inputSt, width: 130, height: 34 }}><option value="">全部团队</option>{[...new Set(rows.filter(r => r.source === "mine" || r.source === "shared").map(r => r.team))].map(t => <option key={t}>{t}</option>)}</select></>}<SecondaryButton onClick={() => { setKeyword(""); setQuery(""); setModelType(""); setCreatorFilter(""); setTeamFilter(""); }}><RotateCcw size={13} />重置</SecondaryButton></div><button title="刷新数据集列表" onClick={() => setMessage("数据集列表已刷新")} style={{ width: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", background: "#fff", borderRadius: 6, color: "#6b7280", cursor: "pointer" }}><RefreshCw size={14} /></button></div>
      <div className="flex-1 overflow-auto"><table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 1300 }}><thead><tr>{["数据集", "简介", "模型类型", "适用任务", "版本号", "数据量", "引用信息", "创建人", "所属团队", "状态", "权限状态", "更新时间", "操作"].map((column, index) => <th key={column} style={{ ...thSt, position: "sticky", top: 0, right: index === 12 ? 0 : undefined, zIndex: index === 12 ? 3 : 2, boxShadow: index === 12 ? "-1px 0 #eef1f6" : undefined }}>{column}</th>)}</tr></thead><tbody>{filtered.length ? filtered.map(row => <tr key={row.id}><td style={{ ...tdSt, minWidth: 180 }}><button onClick={() => setDetailRow(row)} style={{ border: "none", background: "none", color: "#4f6ef7", padding: 0, cursor: "pointer", fontSize: 12.5, fontWeight: 600 }}>{row.name}</button></td><td style={{ ...tdSt, minWidth: 200, color: "#6b7280", fontSize: 12 }}>{row.description}</td><td style={{ ...tdSt, whiteSpace: "nowrap", color: "#374151", fontSize: 12 }}>{row.modelType}</td><td style={tdSt}>{row.tasks.join("、")}</td><td style={tdSt}><div>{row.version}{row.version === row.recommendedVersion && <span style={{ color: "#16a34a", marginLeft: 5, fontSize: 11 }}>推荐</span>}</div></td><td style={{ ...tdSt, whiteSpace: "nowrap", fontSize: 12 }}>{row.count.toLocaleString()}行</td><td style={{ ...tdSt, minWidth: 220, color: "#6b7280", fontSize: 12 }}>{row.citation}</td><td style={{ ...tdSt, whiteSpace: "nowrap", color: "#374151", fontSize: 12 }}>{row.creator}</td><td style={{ ...tdSt, whiteSpace: "nowrap", color: "#374151", fontSize: 12 }}>{row.team}</td><td style={tdSt}><StatusBadge status={row.status} /></td><td style={tdSt}><span style={{ fontSize: 12.5, color: "#374151" }}>{row.permission}</span>{row.source === "mine" && <span style={{ marginLeft: 6 }}><TextButton onClick={() => setShareRow(row)}>修改</TextButton></span>}</td><td style={{ ...tdSt, whiteSpace: "nowrap", color: "#6b7280" }}>{row.updatedAt}</td><td style={{ ...tdSt, position: "sticky", right: 0, background: "#fff", boxShadow: "-1px 0 #f0f2f7" }}><div className="flex items-center gap-3"><TextButton onClick={() => setDetailRow(row)}>查看详情</TextButton>{(row.source === "mine" || (row.source === "public" && isAdmin)) && <TextButton onClick={() => setEditRow(row)}>编辑</TextButton>}{row.source === "mine" && <TextButton danger onClick={() => setDeleteRow(row)}>删除</TextButton>}{row.source === "public" && isAdmin && <TextButton danger onClick={() => setDeleteRow(row)}>删除</TextButton>}</div></td></tr>) : <tr><td colSpan={13} style={{ padding: 56, textAlign: "center", color: "#9ca3af" }}>暂无符合条件的数据集</td></tr>}</tbody></table></div>
      <div className="flex items-center justify-between" style={{ padding: "11px 16px", borderTop: "1px solid #f0f2f7" }}><span style={{ fontSize: 12.5, color: "#6b7280" }}>共 {filtered.length} 行</span><div className="flex items-center gap-2"><button disabled style={{ width: 28, height: 28, border: "1px solid #e0e3ed", background: "#fff", opacity: .4 }}><ChevronLeft size={13} /></button><span style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#4f6ef7", color: "#fff", borderRadius: 5, fontSize: 12 }}>1</span><button disabled style={{ width: 28, height: 28, border: "1px solid #e0e3ed", background: "#fff", opacity: .4 }}><ChevronRight size={13} /></button></div></div>
    </div>
    {shareRow && <ShareDrawer row={shareRow} onClose={() => setShareRow(null)} onSave={permission => { const updated = { ...shareRow, permission }; saveStoredEvaluationDataset(updated); setRows(prev => prev.map(row => row.id === shareRow.id ? updated : row)); setShareRow(null); setMessage("共享权限已更新"); }} />}
    {deleteRow && <><div onClick={() => setDeleteRow(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", zIndex: 150 }} /><div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 390, background: "#fff", borderRadius: 8, zIndex: 151, padding: 24 }}><div className="flex items-center gap-2" style={{ marginBottom: 12 }}><AlertCircle size={20} color="#f59e0b" /><b>删除数据集</b></div><p style={{ fontSize: 13.5 }}>确定删除 <b>{deleteRow.name}</b> 吗？</p><div className="flex items-center justify-end gap-2"><SecondaryButton onClick={() => setDeleteRow(null)}>取消</SecondaryButton><PrimaryButton onClick={() => { if (deleteRow.source === "mine" || deleteRow.source === "public") removeStoredEvaluationDataset(deleteRow.id); setRows(prev => prev.filter(row => row.id !== deleteRow.id)); setDeleteRow(null); setMessage("数据集已删除"); }}>确定</PrimaryButton></div></div></>}
  </div>;
}
