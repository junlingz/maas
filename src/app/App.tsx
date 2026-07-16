import { useState, useEffect } from "react";
import { ModelPlazaPage } from "./components/ModelPlaza";
import { ModelManagementPage } from "./components/ModelManagement";
import { DeployInstancePage } from "./components/DeployInstance";
import { InferenceServicePage } from "./components/InferenceService";
import { UserAccountPage } from "./components/UserAccount";
import { UserRolePage } from "./components/UserRole";
import { MyModelsPage } from "./components/MyModels";
import { AuditEventsPage } from "./components/AuditEvents";
import { UsageStatsPage } from "./components/UsageStats";
import { LogMiningPage } from "./components/LogMining";
import { ModelRoutingPage } from "./components/ModelRouting";
import { ModelEvaluationPage } from "./components/ModelEvaluation";
import { EvaluationDataPage } from "./components/EvaluationData";
import { ResourcePermissionPage } from "./components/ResourcePermission";
import { ModelDeploymentPage } from "./components/ModelDeployment";
import { ClusterListPage } from "./components/ClusterList";
import { NodeListPage, ResourceGroupPage } from "./components/NodeResourceGroup";
import { ModelExperiencePage } from "./components/ModelExperience";
import { INITIAL_DEPLOYMENTS, INITIAL_INSTANCES, INITIAL_MODELS } from "./model-management/data";
import type { DeploymentRecord, ModelInstanceRecord, ModelRecord } from "./model-management/types";
import {
  Store, FlaskConical, BrainCircuit, ClipboardCheck, Layers,
  Users, Building2, BarChart3, Server, ChevronDown, ChevronRight,
  ChevronLeft, Cpu, UserCircle, Search, Plus, RefreshCw,
  Check, ChevronUp, Info, CheckCircle2, Circle, Upload,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

// ─── Menu ─────────────────────────────────────────────────────────────────────

interface SubMenuItem { label: string; key: string; highlight?: boolean; }
interface MenuItem { label: string; key: string; icon: React.ReactNode; children?: SubMenuItem[]; }

const menuData: MenuItem[] = [
  { label: "模型广场", key: "model-plaza", icon: <Store size={16} /> },
  { label: "模型体验", key: "model-experience", icon: <FlaskConical size={16} /> },
  {
    label: "模型训练", key: "model-training", icon: <BrainCircuit size={16} />,
    children: [
      { label: "模型训练", key: "training-task" },
      { label: "训练数据", key: "training-data" },
      { label: "我的模型", key: "my-model", highlight: true },
    ],
  },
  {
    label: "模型评测", key: "model-evaluation", icon: <ClipboardCheck size={16} />,
    children: [
      { label: "模型评测", key: "evaluation-task" },
      { label: "评测数据", key: "evaluation-data" },
    ],
  },
  {
    label: "模型管理", key: "model-management", icon: <Layers size={16} />,
    children: [
      { label: "模型库", key: "model-list" },
      { label: "模型部署", key: "model-deploy" },
      { label: "模型实例", key: "deploy-instance" },
    ],
  },
  {
    label: "用户管理", key: "user-management", icon: <Users size={16} />,
    children: [
      { label: "用户账号", key: "user-account" },
      { label: "用户角色", key: "user-role" },
    ],
  },
  {
    label: "空间管理", key: "space-management", icon: <Building2 size={16} />,
    children: [
      { label: "工作空间", key: "workspace" },
      { label: "空间成员", key: "space-member" },
      { label: "API Key", key: "api-key" },
      { label: "用量统计", key: "space-usage" },
    ],
  },
  {
    label: "统计监控", key: "stats-monitor", icon: <BarChart3 size={16} />,
    children: [
      { label: "操作审计事件", key: "audit-events" },
      { label: "用量统计", key: "usage-stats" },
      { label: "日志挖掘", key: "log-mining" },
    ],
  },
  {
    label: "资源管理", key: "resource-management", icon: <Server size={16} />,
    children: [
      { label: "集群", key: "cluster-list" },
      { label: "节点", key: "node-list" },
      { label: "资源组", key: "resource-group" },
    ],
  },
];

// ─── Training Task List ───────────────────────────────────────────────────────

type TrainingStatus = "训练成功" | "已完成" | "训练中" | "训练失败" | "";

interface TrainingRow {
  id: number; name: string; outputModel: string; type: string;
  status: TrainingStatus; taskId: string; baseModel: string; creator: string; actions: string[];
}

const trainingRows: TrainingRow[] = [
  { id: 1, name: "天文资料搜索", outputModel: "某某模型", type: "微调模型", status: "训练成功", taskId: "12345234543", baseModel: "ddfhpad-0321", creator: "张小明", actions: ["删除任务", "查看报告", "评估报告"] },
  { id: 2, name: "公文写作模型", outputModel: "某某模型", type: "微调模型", status: "", taskId: "76840646", baseModel: "ddfhpad-0321", creator: "张小明", actions: ["删除任务", "查看报告"] },
  { id: 3, name: "天气变化预报", outputModel: "某某模型", type: "微调模型", status: "已完成", taskId: "34536448457", baseModel: "ddfhpad-0321", creator: "张小明", actions: ["删除任务", "查看报告", "评估报告"] },
  { id: 4, name: "天文资料搜索", outputModel: "某某模型", type: "微调模型", status: "训练中", taskId: "346903543", baseModel: "ddfhpad-0321", creator: "张小明", actions: ["删除任务", "查看报告", "停止任务"] },
  { id: 5, name: "公文写作模型", outputModel: "某某模型", type: "微调模型", status: "", taskId: "3461458868", baseModel: "ddfhpad-0321", creator: "张小明", actions: ["删除任务", "查看报告"] },
  { id: 6, name: "天气变化预报", outputModel: "某某模型", type: "微调模型", status: "训练成功", taskId: "34634875987", baseModel: "ddfhpad-0321", creator: "张小明", actions: ["删除任务", "查看报告", "评估报告"] },
  { id: 7, name: "天文资料搜索", outputModel: "某某模型", type: "微调模型", status: "", taskId: "32750657145", baseModel: "ddfhpad-0321", creator: "张小明", actions: ["删除任务", "查看报告"] },
  { id: 8, name: "公文写作模型", outputModel: "某某模型", type: "微调模型", status: "训练失败", taskId: "096764453", baseModel: "ddfhpad-0321", creator: "张小明", actions: ["删除任务", "查看报告", "重新训练"] },
  { id: 9, name: "天气变化预报", outputModel: "某某模型", type: "微调模型", status: "训练成功", taskId: "406678753", baseModel: "ddfhpad-0321", creator: "张小明", actions: ["删除任务", "查看报告", "评估报告"] },
];

const statusCfg: Record<TrainingStatus, { bg: string; text: string; dot: string }> = {
  "训练成功": { bg: "#f0faf5", text: "#16a34a", dot: "#22c55e" },
  "已完成":   { bg: "#f0faf5", text: "#16a34a", dot: "#22c55e" },
  "训练中":   { bg: "#eff6ff", text: "#2563eb", dot: "#3b82f6" },
  "训练失败": { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
  "":         { bg: "transparent", text: "#9ca3af", dot: "transparent" },
};

function StatusBadge({ status }: { status: TrainingStatus }) {
  if (!status) return <span style={{ color: "#d1d5db" }}>—</span>;
  const s = statusCfg[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: s.bg, fontSize: 12 }}>
      {status === "训练中"
        ? <RefreshCw size={10} color={s.dot} style={{ animation: "spin 1.2s linear infinite" }} />
        : <span className="rounded-full" style={{ width: 6, height: 6, background: s.dot, display: "inline-block" }} />}
      <span style={{ color: s.text, fontWeight: 500 }}>{status}</span>
    </span>
  );
}

function actionStyle(a: string) {
  return (a === "删除任务" || a === "停止任务")
    ? { color: "#ef4444", hover: "#dc2626" }
    : { color: "#4f6ef7", hover: "#3b5de8" };
}

function TrainingTaskList({ onCreate, onEvalReport }: { onCreate: () => void; onEvalReport: (name: string) => void }) {
  const [subTab, setSubTab] = useState<"task" | "data">("task");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const total = 200;
  const totalPages = Math.ceil(total / 10);
  const pages = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }}>模型训练</span>
        <ChevronRight size={13} />
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>训练任务</span>
      </div>
      <div className="flex items-center flex-shrink-0" style={{ padding: "12px 24px 0" }}>
        {(["task", "data"] as const).map((t, i) => (
          null
        ))}
      </div>
      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{
              fontSize: 13, color: typeFilter ? "#1a1d23" : "#9ca3af", padding: "5px 10px",
              border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", outline: "none", height: 32,
            }}>
              <option value="">请选择</option>
              <option value="微调模型">微调模型</option>
              <option value="预训练">预训练</option>
            </select>
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", padding: "0 10px", height: 32 }}>
              <input type="text" placeholder="请输入任务名搜索" value={search} onChange={e => setSearch(e.target.value)}
                style={{ fontSize: 13, border: "none", outline: "none", width: 160, background: "transparent" }} />
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer" }}>
              <Search size={13} /> 搜索
            </button>
          </div>
          <button onClick={onCreate} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer" }}>
            <Plus size={14} /> 创建训练任务
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f9fc" }}>
                {["任务名称", "输出模型名称", "任务类型", "任务状态", "任务ID", "基础模型", "创建人", "操作"].map(col => (
                  <th key={col} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: "#6b7280", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trainingRows.map(row => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f5f7fa" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "11px 14px", color: "#1a1d23", fontWeight: 500 }}>{row.name}</td>
                  <td style={{ padding: "11px 14px", color: "#374151" }}>{row.outputModel}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 12, padding: "2px 8px", background: "#eff4ff", color: "#4f6ef7", fontWeight: 500, borderRadius: 4 }}>{row.type}</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}><StatusBadge status={row.status} /></td>
                  <td style={{ padding: "11px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{row.taskId}</td>
                  <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12 }}>{row.baseModel}</td>
                  <td style={{ padding: "11px 14px", color: "#374151" }}>{row.creator}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <div className="flex items-center gap-3">
                      {row.actions.map(a => {
                        const s = actionStyle(a);
                        return (
                          <button key={a}
                            onClick={() => a === "评估报告" ? onEvalReport(row.name) : undefined}
                            style={{ fontSize: 12.5, color: s.color, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500, whiteSpace: "nowrap" }}
                            onMouseEnter={e => (e.currentTarget.style.color = s.hover)}
                            onMouseLeave={e => (e.currentTarget.style.color = s.color)}>{a}</button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {total} 条</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: "pointer" }}>
              <ChevronLeft size={13} />
            </button>
            {pages.map(n => (
              <button key={n} onClick={() => setPage(n)} style={{
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid", borderColor: page === n ? "#4f6ef7" : "#e0e3ed", borderRadius: 5,
                background: page === n ? "#4f6ef7" : "#fff", color: page === n ? "#fff" : "#374151",
                fontSize: 12.5, fontWeight: page === n ? 600 : 400, cursor: "pointer",
              }}>{n}</button>
            ))}
            <span style={{ padding: "0 4px", color: "#9ca3af", fontSize: 13 }}>...</span>
            <button onClick={() => setPage(20)} style={{
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid", borderColor: page === 20 ? "#4f6ef7" : "#e0e3ed", borderRadius: 5,
              background: page === 20 ? "#4f6ef7" : "#fff", color: page === 20 ? "#fff" : "#374151", fontSize: 12.5, cursor: "pointer",
            }}>20</button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: "pointer" }}>
              <ChevronRight size={13} />
            </button>
            <div className="flex items-center gap-1.5 ml-2">
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>10条/页</span>
              <ChevronDown size={12} color="#9ca3af" />
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Create Training Task Wizard ──────────────────────────────────────────────

const STEPS = [
  { id: 1, title: "选择任务类型" },
  { id: 2, title: "基本信息" },
  { id: 3, title: "训练参数" },
  { id: 4, title: "评估配置" },
  { id: 5, title: "确认提交" },
];

type Modality = "文生文" | "图生文" | "文生图";
type TaskType = "cpt" | "sft" | "rl";
type FineTuneMethod = "lora" | "qlora" | "ptuning" | "full";

const MODALITY_OPTIONS: { value: Modality; label: string; desc: string }[] = [
  { value: "文生文", label: "文生文", desc: "文本生成文本，适用于对话、写作等场景" },
  { value: "图生文", label: "图生文", desc: "图像理解生成文本，适用于图像描述、视觉问答" },
  { value: "文生图", label: "文生图", desc: "文本生成图像，适用于文生图创作场景" },
];

// Filter models by generation modality:
//   文生文 → LLM without vision capability
//   图生文 → LLM with vision capability
//   文生图 → Image category models
function filterModelsByModality(models: ModelRecord[], modality: Modality): ModelRecord[] {
  switch (modality) {
    case "文生文":
      return models.filter(m => m.category === "LLM" && !m.capabilities.includes("vision"));
    case "图生文":
      return models.filter(m => m.category === "LLM" && m.capabilities.includes("vision"));
    case "文生图":
      return models.filter(m => m.category === "Image");
  }
}

// Detect 预训练框架 + 模型架构 from the selected base model (read-only, PRD 1.4.0)
// Priority: Image → 文-图生成训练框架/扩散模型;
//   LLM name contains DeepSeek-V/Mixtral/Grok → 自回归/MoE;
//   T5/BART/Marian/mBART/UL2/Pegasus → 序列到序列/T5-style;
//   BERT/RoBERTa/ALBERT/DeBERTa → 自回归/BERT-style;
//   else → 自回归/Decoder-only
function detectArchitecture(model: ModelRecord | undefined): { framework: string; architecture: string } {
  if (!model) return { framework: "—", architecture: "—" };
  if (model.category === "Image") {
    return { framework: "文-图生成训练框架", architecture: "扩散模型" };
  }
  const name = model.name.toLowerCase();
  if (/deepseek-v|mixtral|grok/.test(name)) {
    return { framework: "自回归预训练框架", architecture: "混合专家（MoE）" };
  }
  if (/t5|bart|marian|mbart|ul2|pegasus/.test(name)) {
    return { framework: "序列到序列预训练框架", architecture: "T5-style（Encoder-Decoder）" };
  }
  if (/bert|roberta|albert|deberta/.test(name)) {
    return { framework: "自回归预训练框架", architecture: "BERT-style(Encoder-only)" };
  }
  return { framework: "自回归预训练框架", architecture: "Decoder-only" };
}

// SFT fine-tune methods available per modality (文生图: only LoRA/全量微调)
function getFineTuneMethods(modality: Modality): { value: FineTuneMethod; label: string }[] {
  if (modality === "文生图") {
    return [
      { value: "lora", label: "LoRA" },
      { value: "full", label: "全量微调" },
    ];
  }
  return [
    { value: "lora", label: "LoRA" },
    { value: "qlora", label: "QLoRA" },
    { value: "ptuning", label: "P-Tuning" },
    { value: "full", label: "全量微调" },
  ];
}

// Evaluation metrics dynamic by modality + taskType
// core = locked (cannot uncheck), defaultSelected = checked by default
interface EvalMetricDef { label: string; core?: boolean; defaultSelected?: boolean; }

function getEvalMetrics(modality: Modality, taskType: TaskType): EvalMetricDef[] {
  if (taskType === "cpt") {
    // 继续预训练评估指标
    if (modality === "文生图") return [
      { label: "训练损失/验证损失", core: true, defaultSelected: true },
      { label: "生成样例预览", core: true, defaultSelected: true },
    ];
    if (modality === "图生文") return [
      { label: "训练损失/验证损失", core: true, defaultSelected: true },
      { label: "困惑度(Perplexity)", core: true, defaultSelected: true },
      { label: "图文对齐损失", core: true, defaultSelected: true },
      { label: "生成样例对比", defaultSelected: false },
      { label: "BLEU/ROUGE", defaultSelected: false },
    ];
    // 文生文
    return [
      { label: "训练损失/验证损失", core: true, defaultSelected: true },
      { label: "困惑度(Perplexity)", core: true, defaultSelected: true },
      { label: "生成流畅度(n-gram)", defaultSelected: true },
      { label: "逻辑一致性(分类器)", defaultSelected: false },
    ];
  }
  // 监督微调评估指标
  if (modality === "文生图") return [
    { label: "验证损失", core: true, defaultSelected: true },
    { label: "生成样例预览", defaultSelected: true },
  ];
  if (modality === "图生文") return [
    { label: "验证损失", core: true, defaultSelected: true },
    { label: "准确率", defaultSelected: true },
    { label: "召回率", defaultSelected: true },
    { label: "BLEU/ROUGE", defaultSelected: true },
    { label: "生成样例对比", defaultSelected: true },
    { label: "困惑度", defaultSelected: false },
  ];
  // 文生文 SFT
  return [
    { label: "验证损失", core: true, defaultSelected: true },
    { label: "准确率", defaultSelected: true },
    { label: "召回率", defaultSelected: true },
    { label: "精确率", defaultSelected: true },
    { label: "F1", defaultSelected: true },
    { label: "BLEU", defaultSelected: false },
    { label: "ROUGE", defaultSelected: false },
    { label: "困惑度", defaultSelected: false },
    { label: "生成流畅度", defaultSelected: false },
    { label: "逻辑一致性", defaultSelected: false },
  ];
}

// Small reusable field label
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
      {required && <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>}
      {children}
    </div>
  );
}

// Tooltip icon
function Tip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center" style={{ marginLeft: 4 }}>
      <Info size={13} color="#9ca3af" style={{ cursor: "help" }}
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} />
      {show && (
        <span className="absolute z-10 rounded-lg shadow-lg" style={{
          bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: "#1a1d23", color: "#fff", fontSize: 12, padding: "6px 10px",
          whiteSpace: "nowrap", maxWidth: 220, lineHeight: 1.5,
        }}>{text}</span>
      )}
    </span>
  );
}

// Number input with optional step/min
function NumInput({ value, onChange, step = 1, min }: { value: number; onChange: (v: number) => void; step?: number; min?: number }) {
  const dec = () => {
    const next = value - step;
    onChange(min !== undefined ? Math.max(min, next) : next);
  };
  const inc = () => onChange(value + step);
  return (
    <div className="flex items-center rounded-md overflow-hidden" style={{ border: "1px solid #e0e3ed", height: 34 }}>
      <button onClick={dec} style={{ width: 28, background: "#f8f9fc", border: "none", cursor: "pointer", height: "100%", color: "#6b7280", fontSize: 16 }}>−</button>
      <input type="number" value={value} step={step} onChange={e => onChange(Number(e.target.value))} style={{ width: 60, textAlign: "center", border: "none", outline: "none", fontSize: 13, background: "transparent" }} />
      <button onClick={inc} style={{ width: 28, background: "#f8f9fc", border: "none", cursor: "pointer", height: "100%", color: "#6b7280", fontSize: 16 }}>+</button>
    </div>
  );
}

// Switch toggle
function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} type="button"
      className="flex items-center rounded-full flex-shrink-0"
      style={{ width: 36, height: 20, padding: 2, background: checked ? "#4f6ef7" : "#d1d5db", transition: "background 0.15s", border: "none", cursor: "pointer" }}>
      <span className="rounded-full" style={{ width: 16, height: 16, background: "#fff", transform: checked ? "translateX(16px)" : "translateX(0)", transition: "transform 0.15s" }} />
    </button>
  );
}

// Multi-select chips
function MultiSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const on = selected.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            style={{
              fontSize: 12.5, fontWeight: 500, padding: "4px 12px", borderRadius: 6,
              border: `1px solid ${on ? "#4f6ef7" : "#e0e3ed"}`,
              background: on ? "#eff4ff" : "#fff",
              color: on ? "#4f6ef7" : "#6b7280", cursor: "pointer", transition: "all 0.15s",
            }}>{opt}</button>
        );
      })}
    </div>
  );
}

// Switch + weight input (for loss-type params)
function SwitchWithWeight({ checked, onToggle, weight, onWeightChange }: { checked: boolean; onToggle: (v: boolean) => void; weight: string; onWeightChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <Switch checked={checked} onChange={onToggle} />
      {checked && (
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12.5, color: "#6b7280" }}>权重</span>
          <input type="text" value={weight} onChange={e => onWeightChange(e.target.value)} style={{ width: 70, height: 30, padding: "0 8px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }} />
        </div>
      )}
    </div>
  );
}

function CreateTrainingTaskPage({ onCancel, initialModel, models }: { onCancel: () => void; initialModel?: ModelRecord | null; models: ModelRecord[] }) {
  const [currentStep, setCurrentStep] = useState(initialModel ? 2 : 1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set(initialModel ? [1] : []));
  const [submitted, setSubmitted] = useState(false);

  // Step 1 state — CPT / SFT / RL (RL disabled)
  const [taskType, setTaskType] = useState<TaskType>("sft");

  // Step 2 state — 基本信息
  const [taskName, setTaskName] = useState("");
  const [modality, setModality] = useState<Modality>("文生文");
  const [modelTab, setModelTab] = useState<"plaza" | "builtin">("plaza");
  const [selectedModel, setSelectedModel] = useState(initialModel?.id ?? "");
  const [resourceGroup, setResourceGroup] = useState("");
  const [outputModelName, setOutputModelName] = useState("");
  const [outputModelDesc, setOutputModelDesc] = useState("");
  const [outputModelVersion, setOutputModelVersion] = useState("");
  const [trainDataset, setTrainDataset] = useState("");

  // Step 3 state — 训练参数
  const [fineTuneMethod, setFineTuneMethod] = useState<FineTuneMethod>("lora");
  // 训练基础参数
  const [epoch, setEpoch] = useState(3);
  const [baseLr, setBaseLr] = useState("2e-4");
  const [batchSize, setBatchSize] = useState(8);
  const [maxSeq, setMaxSeq] = useState(4096);
  const [resolution, setResolution] = useState(512);
  // 微调专属参数 — LoRA/QLoRA
  const [loraRank, setLoraRank] = useState(8);
  const [loraAlpha, setLoraAlpha] = useState(16);
  const [loraTargetLayers, setLoraTargetLayers] = useState<string[]>(["q_proj", "v_proj"]);
  const [loraDropout, setLoraDropout] = useState("0.05");
  const [quantBits, setQuantBits] = useState("4bit");
  // 微调专属参数 — P-Tuning
  const [prefixLength, setPrefixLength] = useState(20);
  const [prefixDim, setPrefixDim] = useState(64);
  const [prefixPosition, setPrefixPosition] = useState("两者都加");
  // 高级参数
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [optimizer, setOptimizer] = useState("AdamW");
  const [weightDecay, setWeightDecay] = useState("0.01");
  const [gradClip, setGradClip] = useState("1.0");
  const [gradAccumSteps, setGradAccumSteps] = useState(4);
  const [lrSchedule, setLrSchedule] = useState("cosine decay");
  const [mixedPrecision, setMixedPrecision] = useState("BF16");
  const [gradCheckpoint, setGradCheckpoint] = useState(true);
  const [ckptInterval, setCkptInterval] = useState(500);
  const [ckptMaxKeep, setCkptMaxKeep] = useState(3);
  const [saveOptimizerState, setSaveOptimizerState] = useState(false);
  // 模态专属参数 (CPT)
  const [textImageContrastOn, setTextImageContrastOn] = useState(true);
  const [textImageContrastW, setTextImageContrastW] = useState("1.0");
  const [imageReconOn, setImageReconOn] = useState(true);
  const [imageReconW, setImageReconW] = useState("1.0");
  const [noiseSchedule, setNoiseSchedule] = useState("余弦");
  const [emaDecay, setEmaDecay] = useState("0.9999");
  // 视觉编码器 (SFT 图生文)
  const [visionEncoderTrainable, setVisionEncoderTrainable] = useState(false);

  // Derived: selected base model + architecture (CPT read-only)
  const selectedModelObj = models.find(m => m.id === selectedModel);
  const architecture = detectArchitecture(selectedModelObj);

  // Step 4 state — 评估配置
  const [validationMode, setValidationMode] = useState<"none" | "select">("none");
  const [splitRatio, setSplitRatio] = useState("1%");
  const [evalMetrics, setEvalMetrics] = useState<Set<string>>(new Set());
  const [evalFreqValue, setEvalFreqValue] = useState(1);
  const [splitOpen, setSplitOpen] = useState(false);

  // Derived: models filtered by selected modality + eval metrics by modality/taskType
  const filteredModels = filterModelsByModality(models, modality);
  const evalMetricOptions = getEvalMetrics(modality, taskType);
  // Eval frequency unit: epoch for 文生文/图生文, 步 for 文生图
  const evalFreqUnit = modality === "文生图" ? "步" : "epoch";

  // Reset evalMetrics defaults when modality or taskType changes
  useEffect(() => {
    const defs = getEvalMetrics(modality, taskType);
    setEvalMetrics(new Set(defs.filter(d => d.defaultSelected).map(d => d.label)));
  }, [modality, taskType]);

  // Reset evalFreqValue when modality changes
  useEffect(() => {
    setEvalFreqValue(modality === "文生图" ? 500 : 1);
  }, [modality]);

  // Reset training parameter defaults when taskType / modality / fineTuneMethod changes (PRD 1.4.0)
  useEffect(() => {
    if (taskType === "cpt") {
      // CPT 基础参数 defaults per modality
      if (modality === "文生文") {
        setEpoch(3); setBaseLr("2e-5"); setBatchSize(8); setMaxSeq(4096);
        setOptimizer("AdamW"); setWeightDecay("0.01"); setGradClip("1.0");
        setGradAccumSteps(4); setLrSchedule("cosine decay"); setMixedPrecision("BF16");
      } else if (modality === "图生文") {
        setEpoch(3); setBaseLr("2e-5"); setBatchSize(4); setMaxSeq(4096);
        setOptimizer("AdamW"); setWeightDecay("0.01"); setGradClip("1.0");
        setGradAccumSteps(4); setLrSchedule("cosine decay"); setMixedPrecision("BF16");
        setTextImageContrastOn(true); setTextImageContrastW("1.0");
      } else { // 文生图
        setEpoch(100); setBaseLr("1e-4"); setBatchSize(2); setResolution(512);
        setOptimizer("AdamW"); setWeightDecay("0.01"); setGradClip("1.0");
        setGradAccumSteps(4); setLrSchedule("cosine decay"); setMixedPrecision("FP16");
        setTextImageContrastOn(true); setTextImageContrastW("1.0");
        setImageReconOn(true); setImageReconW("1.0");
        setNoiseSchedule("余弦"); setEmaDecay("0.9999");
      }
      setGradCheckpoint(true); setCkptInterval(500); setCkptMaxKeep(3); setSaveOptimizerState(false);
    } else { // sft
      if (modality === "文生图") {
        setEpoch(100);
        setBaseLr(fineTuneMethod === "lora" ? "1e-4" : "1e-5");
        setBatchSize(2); setResolution(512);
        // 文生图 LoRA 专属默认值
        setLoraRank(32); setLoraAlpha(32); setLoraDropout("0.0");
        setLoraTargetLayers(["Cross-Attention"]);
        setOptimizer("AdamW"); setWeightDecay("0.01"); setGradClip("1.0");
        setGradAccumSteps(4); setLrSchedule("cosine decay"); setMixedPrecision("FP16");
      } else {
        // 文生文 / 图生文
        const epochMap: Record<FineTuneMethod, number> = { lora: 3, qlora: 3, ptuning: 5, full: 3 };
        const lrMap: Record<FineTuneMethod, string> = { lora: "2e-4", qlora: "2e-4", ptuning: "1e-3", full: "2e-5" };
        setEpoch(epochMap[fineTuneMethod]);
        setBaseLr(lrMap[fineTuneMethod]);
        setBatchSize(8); setMaxSeq(4096);
        setLoraRank(8); setLoraAlpha(16); setLoraDropout("0.05");
        setLoraTargetLayers(["q_proj", "v_proj"]);
        setOptimizer("AdamW"); setWeightDecay("0.01"); setGradClip("1.0");
        setGradAccumSteps(4); setLrSchedule("cosine decay"); setMixedPrecision("BF16");
      }
      setGradCheckpoint(true); setCkptInterval(500); setCkptMaxKeep(3); setSaveOptimizerState(false);
      setVisionEncoderTrainable(false);
    }
  }, [taskType, modality, fineTuneMethod]);

  // If current fineTuneMethod is not available for the new modality, reset to LoRA
  useEffect(() => {
    const methods = getFineTuneMethods(modality);
    if (!methods.find(m => m.value === fineTuneMethod)) {
      setFineTuneMethod("lora");
    }
  }, [modality]);

  const toggleMetric = (m: string) => {
    const def = evalMetricOptions.find(d => d.label === m);
    if (def?.core) return; // core metrics cannot be unchecked
    setEvalMetrics(prev => {
      const next = new Set(prev);
      next.has(m) ? next.delete(m) : next.add(m);
      return next;
    });
  };

  const goNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setCurrentStep(prev => prev + 1);
  };

  const goTo = (step: number) => {
    if (step < currentStep || completedSteps.has(step)) setCurrentStep(step);
  };

  const handleSubmit = () => {
    setCompletedSteps(prev => new Set([...prev, 4, 5]));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: "#f5f7fa" }}>
        <div className="flex flex-col items-center rounded-2xl" style={{ background: "#fff", border: "1px solid #e8ebf2", padding: "56px 80px" }}>
          <div className="rounded-full flex items-center justify-center" style={{ width: 64, height: 64, background: "#f0faf5", marginBottom: 20 }}>
            <CheckCircle2 size={36} color="#22c55e" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1d23", marginBottom: 8 }}>提交成功</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 28 }}>训练任务已创建，正在排队中...</div>
          <button onClick={onCancel} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 8, padding: "10px 32px", cursor: "pointer" }}>
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const stepDot = (step: number) => {
    const done = completedSteps.has(step);
    const active = currentStep === step;
    return (
      <div className="flex items-center gap-2" key={step}>
        <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{
          width: 22, height: 22,
          background: done ? "#22c55e" : active ? "#4f6ef7" : "#e0e3ed",
          transition: "background 0.2s",
        }}>
          {done
            ? <Check size={12} color="#fff" strokeWidth={3} />
            : <span style={{ fontSize: 11, fontWeight: 600, color: done || active ? "#fff" : "#9ca3af" }}>{step}</span>}
        </div>
        <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#1a1d23" : done ? "#374151" : "#9ca3af" }}>
          {STEPS[step - 1].title}
        </span>
        {step < 5 && <div style={{ width: 24, height: 1, background: "#e0e3ed", margin: "0 4px" }} />}
      </div>
    );
  };

  // Accordion section header
  const AccordionHeader = ({ step, label }: { step: number; label: string }) => {
    const done = completedSteps.has(step);
    const active = currentStep === step;
    const clickable = done || step < currentStep;
    return (
      <button
        onClick={() => clickable && goTo(step)}
        className="w-full flex items-center gap-3"
        style={{
          padding: "14px 20px",
          background: active ? "#fff" : done ? "#fafbfd" : "#f8f9fc",
          border: "none", cursor: clickable ? "pointer" : "default",
          borderBottom: active ? "1px solid #eef0f7" : "none",
        }}
      >
        <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{
          width: 22, height: 22,
          background: done && !active ? "#22c55e" : active ? "#4f6ef7" : "#e0e3ed",
        }}>
          {done && !active
            ? <Check size={11} color="#fff" strokeWidth={3} />
            : <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#fff" : "#9ca3af" }}>{step}</span>}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: active ? "#1a1d23" : done ? "#374151" : "#9ca3af" }}>{label}</span>
        {done && !active && <span style={{ marginLeft: "auto", fontSize: 12, color: "#22c55e" }}>已完成</span>}
        {!active && <div style={{ marginLeft: done ? 0 : "auto" }}>{active ? <ChevronUp size={15} color="#6b7280" /> : <ChevronRight size={15} color="#9ca3af" />}</div>}
      </button>
    );
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 34, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed",
    borderRadius: 6, outline: "none", color: "#1a1d23", background: "#fff",
  };

  const selectStyle: React.CSSProperties = {
    height: 34, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed",
    borderRadius: 6, outline: "none", color: "#1a1d23", background: "#fff", width: "100%",
  };

  const radioBtn = (checked: boolean, label: string, onChange: () => void) => (
    <label className="flex items-center gap-2" style={{ cursor: "pointer", fontSize: 13, color: "#374151" }}>
      <span className="flex items-center justify-center rounded-full flex-shrink-0" style={{
        width: 16, height: 16, border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`,
        background: checked ? "#4f6ef7" : "#fff", transition: "all 0.15s",
      }}>
        {checked && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
      </span>
      <input type="radio" checked={checked} onChange={onChange} style={{ display: "none" }} />
      {label}
    </label>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }} onClick={onCancel}>模型训练</span>
        <ChevronRight size={13} />
        <span style={{ cursor: "pointer", color: "#4f6ef7" }} onClick={onCancel}>训练任务</span>
        <ChevronRight size={13} />
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>创建训练任务</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center flex-shrink-0" style={{ padding: "14px 24px 0" }}>
        <div className="flex items-center gap-1 rounded-xl" style={{ background: "#fff", border: "1px solid #e8ebf2", padding: "10px 20px" }}>
          {STEPS.map(s => stepDot(s.id))}
        </div>
      </div>

      {/* Accordion content */}
      <div className="flex-1 overflow-auto" style={{ padding: "14px 24px 24px" }}>
        <div className="rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid #e8ebf2" }}>

          {/* ── STEP 1: 选择任务类型 ── */}
          <AccordionHeader step={1} label="选择任务类型" />
          {currentStep === 1 && (
            <div style={{ padding: "24px 24px 20px" }}>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>选择任务类型</div>
              <div className="grid grid-cols-3 gap-4" style={{ maxWidth: 720 }}>
                {/* CPT — 继续预训练 */}
                <div
                  onClick={() => setTaskType("cpt")}
                  style={{
                    border: `2px solid ${taskType === "cpt" ? "#4f6ef7" : "#e0e3ed"}`,
                    borderRadius: 10, padding: 16, cursor: "pointer",
                    background: taskType === "cpt" ? "#f5f8ff" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: taskType === "cpt" ? "#4f6ef7" : "#f0f2f7" }}>
                      <Server size={14} color={taskType === "cpt" ? "#fff" : "#9ca3af"} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>继续预训练</span>
                    {taskType === "cpt" && (
                      <span className="ml-auto flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: "#4f6ef7" }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                    在基础模型上使用领域数据进行继续预训练，增强模型在特定领域的语言理解能力。
                  </div>
                </div>

                {/* SFT — 监督微调 */}
                <div
                  onClick={() => setTaskType("sft")}
                  style={{
                    border: `2px solid ${taskType === "sft" ? "#4f6ef7" : "#e0e3ed"}`,
                    borderRadius: 10, padding: 16, cursor: "pointer",
                    background: taskType === "sft" ? "#f5f8ff" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: taskType === "sft" ? "#4f6ef7" : "#f0f2f7" }}>
                      <BrainCircuit size={14} color={taskType === "sft" ? "#fff" : "#9ca3af"} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>监督微调</span>
                    {taskType === "sft" && (
                      <span className="ml-auto flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: "#4f6ef7" }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                    使用标注数据对基础模型进行监督微调，使模型学习特定任务的指令遵循能力，推荐使用。
                  </div>
                </div>

                {/* RL — 强化学习 (disabled) */}
                <div
                  style={{
                    border: "2px solid #e0e3ed", borderRadius: 10, padding: 16,
                    cursor: "not-allowed", background: "#f8f9fc", opacity: 0.6,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: "#f0f2f7" }}>
                      <Cpu size={14} color="#9ca3af" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#9ca3af" }}>强化学习</span>
                    <span className="ml-auto" style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", background: "#f0f2f7", borderRadius: 4, padding: "2px 6px" }}>暂未开放</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
                    通过人类反馈强化学习（RLHF）优化模型输出质量，敬请期待。
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 20 }}>
                <button onClick={goNext} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "8px 24px", cursor: "pointer" }}>
                  下一步
                </button>
              </div>
            </div>
          )}

          <div style={{ height: 1, background: "#f0f2f7" }} />

          {/* ── STEP 2: 基本信息 ── */}
          <AccordionHeader step={2} label="基本信息" />
          {currentStep === 2 && (
            <div style={{ padding: "24px 24px 20px" }}>
              {/* 任务名称 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel required>任务名称</FieldLabel>
                <div className="flex items-center gap-2" style={{ maxWidth: 400 }}>
                  <input value={taskName} onChange={e => setTaskName(e.target.value.slice(0, 10))} placeholder="请输入任务名称"
                    maxLength={10} style={{ ...inputStyle, flex: 1 }} />
                  <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>{taskName.length} / 10</span>
                </div>
              </div>

              {/* 生成模态 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel required>生成模态</FieldLabel>
                <div className="flex items-center gap-4">
                  {MODALITY_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2" style={{ cursor: "pointer", fontSize: 13, color: "#374151" }}>
                      <span className="flex items-center justify-center rounded-full flex-shrink-0" style={{
                        width: 16, height: 16, border: `2px solid ${modality === opt.value ? "#4f6ef7" : "#d1d5db"}`,
                        background: modality === opt.value ? "#4f6ef7" : "#fff", transition: "all 0.15s",
                      }}>
                        {modality === opt.value && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
                      </span>
                      <input type="radio" checked={modality === opt.value} onChange={() => { setModality(opt.value); setSelectedModel(""); }} style={{ display: "none" }} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* 选择基础模型 with tabs */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel required>选择基础模型</FieldLabel>
                <div className="flex items-center gap-1 mb-3" style={{ borderBottom: "1px solid #e8ebf2" }}>
                  {(["plaza", "builtin"] as const).map(tab => (
                    <button key={tab} onClick={() => setModelTab(tab)}
                      style={{
                        fontSize: 13, fontWeight: 500, padding: "8px 16px", border: "none", cursor: "pointer",
                        borderBottom: modelTab === tab ? "2px solid #4f6ef7" : "2px solid transparent",
                        color: modelTab === tab ? "#4f6ef7" : "#6b7280", background: "transparent", marginBottom: -1,
                      }}>
                      {tab === "plaza" ? "模型库" : "我的模型"}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3" style={{ maxWidth: 560 }}>
                  {modelTab === "plaza" ? (
                    filteredModels.length === 0 ? (
                      <div style={{ gridColumn: "span 2", padding: "24px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>当前模态暂无可选模型</div>
                    ) : filteredModels.map(m => (
                      <div key={m.id} onClick={() => setSelectedModel(m.id)}
                        style={{
                          border: `2px solid ${selectedModel === m.id ? "#4f6ef7" : "#e0e3ed"}`,
                          borderRadius: 8, padding: 12, cursor: "pointer",
                          background: selectedModel === m.id ? "#f5f8ff" : "#fff",
                          transition: "all 0.15s", position: "relative",
                        }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23" }}>{m.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#4f6ef7", background: "#eff4ff", borderRadius: 4, padding: "1px 6px" }}>来自模型广场</span>
                          {selectedModel === m.id && (
                            <span className="absolute top-2 right-2 flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#4f6ef7" }}>
                              <Check size={10} color="#fff" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>参数量: {m.paramSize}B · {m.category} · {m.developer}</div>
                      </div>
                    ))
                  ) : (
                    [
                      { id: "my-qwen2-7b", name: "我的Qwen2-7B", info: "参数量: 7B · LLM", version: "v1.0", updatedAt: "2026-07-01 09:00" },
                      { id: "my-glm-4v", name: "我的GLM-4V", info: "参数量: 9B · LLM · vision", version: "v2.0", updatedAt: "2026-07-03 14:20" },
                      { id: "my-deepseek", name: "我的DeepSeek-V3", info: "参数量: 671B · LLM", version: "v1.5", updatedAt: "2026-07-05 10:30" },
                    ].filter(m => {
                      // Filter by modality for my models too
                      if (modality === "文生图") return m.info.includes("Image");
                      if (modality === "图生文") return m.info.includes("vision");
                      return !m.info.includes("vision") && !m.info.includes("Image");
                    }).length === 0 ? (
                      <div style={{ gridColumn: "span 2", padding: "24px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>当前模态暂无可选模型</div>
                    ) : [
                      { id: "my-qwen2-7b", name: "我的Qwen2-7B", info: "参数量: 7B · LLM", version: "v1.0", updatedAt: "2026-07-01 09:00" },
                      { id: "my-glm-4v", name: "我的GLM-4V", info: "参数量: 9B · LLM · vision", version: "v2.0", updatedAt: "2026-07-03 14:20" },
                      { id: "my-deepseek", name: "我的DeepSeek-V3", info: "参数量: 671B · LLM", version: "v1.5", updatedAt: "2026-07-05 10:30" },
                    ].filter(m => {
                      if (modality === "文生图") return m.info.includes("Image");
                      if (modality === "图生文") return m.info.includes("vision");
                      return !m.info.includes("vision") && !m.info.includes("Image");
                    }).map(m => (
                      <div key={m.id} onClick={() => setSelectedModel(m.id)}
                        style={{
                          border: `2px solid ${selectedModel === m.id ? "#4f6ef7" : "#e0e3ed"}`,
                          borderRadius: 8, padding: 12, cursor: "pointer",
                          background: selectedModel === m.id ? "#f5f8ff" : "#fff",
                          transition: "all 0.15s", position: "relative",
                        }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23" }}>{m.name}</span>
                          {/* Version number in top-right corner */}
                          <span className="ml-auto" style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", background: "#f0f2f7", borderRadius: 4, padding: "1px 6px" }}>{m.version}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{m.info} · {m.updatedAt}</div>
                      </div>
                    ))
                  )}
                </div>
                {selectedModel && (
                  <div className="flex items-center gap-3 rounded-lg mt-3" style={{ padding: "10px 14px", background: "#f0f4ff", border: "1px solid #d0dcff", maxWidth: 560 }}>
                    <Check size={14} color="#4f6ef7" />
                    <span style={{ fontSize: 13, color: "#4f6ef7", fontWeight: 500 }}>
                      {modelTab === "plaza" ? (filteredModels.find(m => m.id === selectedModel)?.name ?? selectedModel) : selectedModel}
                    </span>
                    <span style={{ fontSize: 12, color: "#6b7280", marginLeft: "auto" }}>已选择基础模型</span>
                  </div>
                )}
              </div>

              {/* 资源组 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>资源配置</div>
                <div style={{ maxWidth: 300 }}>
                  <FieldLabel required>资源组</FieldLabel>
                  <select value={resourceGroup} onChange={e => setResourceGroup(e.target.value)} style={selectStyle}>
                    <option value="">请选择资源组</option>
                    <option value="4090">4090</option>
                    <option value="aa">aa</option>
                  </select>
                </div>
              </div>

              {/* 模型输出 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>模型输出</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <FieldLabel required>新模型名称</FieldLabel>
                    <input value={outputModelName} onChange={e => setOutputModelName(e.target.value)}
                      placeholder="请输入新模型名称" style={inputStyle} />
                  </div>
                  <div>
                    <FieldLabel required>版本号</FieldLabel>
                    <input value={outputModelVersion} onChange={e => setOutputModelVersion(e.target.value)}
                      placeholder="如 v1.0" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <FieldLabel>新模型描述</FieldLabel>
                    <textarea value={outputModelDesc} onChange={e => setOutputModelDesc(e.target.value)}
                      placeholder="请输入新模型描述" style={{ ...inputStyle, height: 60, paddingTop: 8, resize: "vertical" }} />
                  </div>
                </div>
              </div>

              {/* 训练数据 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel required>训练数据</FieldLabel>
                <div className="flex items-center gap-3" style={{ maxWidth: 400 }}>
                  <select value={trainDataset} onChange={e => setTrainDataset(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                    <option value="">请选择训练数据集</option>
                    <option value="ds-sft-001">SFT通用对话数据集</option>
                    <option value="ds-cpt-001">CPT预训练语料</option>
                    <option value="ds-vision-001">视觉问答数据集</option>
                  </select>
                  <button style={{ fontSize: 12, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>+ 新建数据集</button>
                </div>
              </div>

              <button onClick={goNext} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "8px 24px", cursor: "pointer" }}>
                下一步
              </button>
            </div>
          )}

          <div style={{ height: 1, background: "#f0f2f7" }} />

          {/* ── STEP 3: 训练参数 ── */}
          <AccordionHeader step={3} label="训练参数" />
          {currentStep === 3 && (
            <div style={{ padding: "24px 24px 20px" }}>
              {/* CPT: 只读的预训练框架 + 模型架构 (由基础模型自动判定) */}
              {taskType === "cpt" && (
                <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 16 }}>预训练框架与模型架构</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>由基础模型自动判定，不可修改</div>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 500 }}>
                    <div>
                      <FieldLabel>预训练框架</FieldLabel>
                      <input value={architecture.framework} readOnly style={{ ...inputStyle, background: "#f0f2f7", color: "#6b7280", cursor: "not-allowed" }} />
                    </div>
                    <div>
                      <FieldLabel>模型架构</FieldLabel>
                      <input value={architecture.architecture} readOnly style={{ ...inputStyle, background: "#f0f2f7", color: "#6b7280", cursor: "not-allowed" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* SFT: 微调方法选择 (按模态过滤) */}
              {taskType === "sft" && (
                <div style={{ marginBottom: 20 }}>
                  <FieldLabel required>微调方法</FieldLabel>
                  <div className="flex items-center gap-3">
                    {getFineTuneMethods(modality).map(m => (
                      <button key={m.value} onClick={() => setFineTuneMethod(m.value)}
                        style={{
                          fontSize: 13, fontWeight: 500, padding: "6px 18px", borderRadius: 6,
                          border: `1px solid ${fineTuneMethod === m.value ? "#4f6ef7" : "#e0e3ed"}`,
                          background: fineTuneMethod === m.value ? "#eff4ff" : "#fff",
                          color: fineTuneMethod === m.value ? "#4f6ef7" : "#6b7280",
                          cursor: "pointer", transition: "all 0.15s",
                        }}>{m.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* SFT: 微调专属参数 — 文生图 LoRA (独立参数集) */}
              {taskType === "sft" && modality === "文生图" && fineTuneMethod === "lora" && (
                <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 16 }}>LoRA 专属参数</div>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 560 }}>
                    <div>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        LoRA 秩 (Rank) <Tip text="低秩矩阵维度，常见值：16/32/64/128" />
                      </div>
                      <NumInput value={loraRank} onChange={setLoraRank} />
                    </div>
                    <div>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        LoRA Alpha <Tip text="缩放系数" />
                      </div>
                      <NumInput value={loraAlpha} onChange={setLoraAlpha} />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        目标注入层 <Tip text="LoRA 注入到 UNet 的哪些模块，默认 Cross-Attention" />
                      </div>
                      <MultiSelect options={["Cross-Attention", "Self-Attention", "FFN"]} selected={loraTargetLayers} onChange={setLoraTargetLayers} />
                    </div>
                    <div>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        LoRA Dropout <Tip text="LoRA 层 dropout 率" />
                      </div>
                      <input type="text" value={loraDropout} onChange={e => setLoraDropout(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                </div>
              )}

              {/* SFT: 微调专属参数 — 文生文/图生文 LoRA & QLoRA */}
              {taskType === "sft" && modality !== "文生图" && (fineTuneMethod === "lora" || fineTuneMethod === "qlora") && (
                <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 16 }}>
                    {fineTuneMethod === "qlora" ? "QLoRA 专属参数" : "LoRA 专属参数"}
                  </div>
                  {fineTuneMethod === "qlora" && (
                    <div style={{ marginBottom: 16, maxWidth: 240 }}>
                      <FieldLabel>量化精度</FieldLabel>
                      <select value={quantBits} onChange={e => setQuantBits(e.target.value)} style={selectStyle}>
                        <option value="4bit">4bit</option>
                        <option value="8bit">8bit</option>
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 560 }}>
                    <div>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        LoRA 秩 (Rank) <Tip text="低秩矩阵维度，越大可学习能力越强但显存越多，常见值：4/8/16/32/64" />
                      </div>
                      <NumInput value={loraRank} onChange={setLoraRank} />
                    </div>
                    <div>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        LoRA Alpha <Tip text="缩放系数，控制 LoRA 更新的强度，通常设为 Rank 的 2 倍" />
                      </div>
                      <NumInput value={loraAlpha} onChange={setLoraAlpha} />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        目标注入层 <Tip text="LoRA 注入到哪些层，默认 q_proj, v_proj" />
                      </div>
                      <MultiSelect options={["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"]} selected={loraTargetLayers} onChange={setLoraTargetLayers} />
                    </div>
                    <div>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        LoRA Dropout <Tip text="LoRA 层的 dropout 率" />
                      </div>
                      <input type="text" value={loraDropout} onChange={e => setLoraDropout(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                </div>
              )}

              {/* SFT: 微调专属参数 — P-Tuning (仅文生文/图生文) */}
              {taskType === "sft" && modality !== "文生图" && fineTuneMethod === "ptuning" && (
                <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 16 }}>P-Tuning 专属参数</div>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 560 }}>
                    <div>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        前缀长度 (Prefix Length) <Tip text="虚拟前缀 token 的数量" />
                      </div>
                      <NumInput value={prefixLength} onChange={setPrefixLength} />
                    </div>
                    <div>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        前缀维度 <Tip text="前缀向量的隐藏维度" />
                      </div>
                      <NumInput value={prefixDim} onChange={setPrefixDim} />
                    </div>
                    <div style={{ gridColumn: "span 2", maxWidth: 280 }}>
                      <FieldLabel>前缀注入位置</FieldLabel>
                      <select value={prefixPosition} onChange={e => setPrefixPosition(e.target.value)} style={selectStyle}>
                        <option value="编码器">编码器</option>
                        <option value="解码器">解码器</option>
                        <option value="两者都加">两者都加</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SFT 全量微调: 无专属参数提示 */}
              {taskType === "sft" && fineTuneMethod === "full" && (
                <div style={{ marginBottom: 20, padding: 14, background: "#f8f9fc", borderRadius: 8, fontSize: 12.5, color: "#6b7280" }}>
                  全量微调：无专属参数，直接训练模型所有参数。
                </div>
              )}

              {/* 训练基础参数 (CPT/SFT 通用，按模态动态展示) */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 16 }}>训练基础参数</div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 560 }}>
                  <div>
                    <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                      训练轮数 (Epoch) <Tip text={taskType === "cpt" ? "整个数据集重复训练的次数" : "数据集重复训练次数"} />
                    </div>
                    <NumInput value={epoch} onChange={setEpoch} />
                  </div>
                  <div>
                    <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                      {taskType === "cpt" ? "基础学习率" : "学习率"} <Tip text="控制参数更新步长，支持科学计数法" />
                    </div>
                    <input type="text" value={baseLr} onChange={e => setBaseLr(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                      批次大小 (Batch Size) <Tip text="每次更新使用的样本数" />
                    </div>
                    <NumInput value={batchSize} onChange={setBatchSize} />
                  </div>
                  {/* 最大序列长度: 文生文/图生文 显示，文生图隐藏 */}
                  {modality !== "文生图" && (
                    <div>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        最大序列长度 <Tip text="单条样本最大 token 数" />
                      </div>
                      <select value={maxSeq} onChange={e => setMaxSeq(Number(e.target.value))} style={selectStyle}>
                        {[1024, 2048, 4096, 8192, 16384, 32768].map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {/* 训练分辨率: 仅文生图显示 */}
                  {modality === "文生图" && (
                    <div>
                      <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                        训练分辨率 (Resolution) <Tip text="训练时图像统一缩放的目标尺寸" />
                      </div>
                      <select value={resolution} onChange={e => setResolution(Number(e.target.value))} style={selectStyle}>
                        <option value={512}>512</option>
                        <option value={768}>768</option>
                        <option value={1024}>1024</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* 训练超参 - 高级 (折叠区，按模态动态展示) */}
              <div style={{ marginBottom: 20, border: "1px solid #e0e3ed", borderRadius: 8, overflow: "hidden" }}>
                <button onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="w-full flex items-center justify-between"
                  style={{ padding: "11px 16px", background: "#f8f9fc", border: "none", cursor: "pointer" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>训练超参 - 高级</span>
                  {advancedOpen ? <ChevronUp size={15} color="#6b7280" /> : <ChevronDown size={15} color="#6b7280" />}
                </button>
                {advancedOpen && (
                  <div style={{ padding: 16 }}>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 560 }}>
                      <div>
                        <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          优化器 <Tip text="AdamW / Adam / SGD / Adafactor" />
                        </div>
                        <select value={optimizer} onChange={e => setOptimizer(e.target.value)} style={selectStyle}>
                          {taskType === "cpt"
                            ? ["AdamW", "Adam", "SGD", "Adafactor"].map(o => <option key={o} value={o}>{o}</option>)
                            : ["AdamW", "Adam", "SGD"].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          权重衰减 (Weight Decay) <Tip text="L2 正则化防止过拟合" />
                        </div>
                        <input type="text" value={weightDecay} onChange={e => setWeightDecay(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          梯度裁剪 (Gradient Clipping) <Tip text="防止梯度爆炸" />
                        </div>
                        <input type="text" value={gradClip} onChange={e => setGradClip(e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          梯度累计步数 <Tip text="梯度累积的步数，等效增大 batch size" />
                        </div>
                        <NumInput value={gradAccumSteps} onChange={setGradAccumSteps} />
                      </div>
                      <div>
                        <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          学习率调度策略 <Tip text="warmup / cosine decay / polynomial decay" />
                        </div>
                        <select value={lrSchedule} onChange={e => setLrSchedule(e.target.value)} style={selectStyle}>
                          <option value="warmup">warmup</option>
                          <option value="cosine decay">cosine decay</option>
                          <option value="polynomial decay">polynomial decay</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          混合精度训练 <Tip text="BF16 / FP16 / 关闭" />
                        </div>
                        <select value={mixedPrecision} onChange={e => setMixedPrecision(e.target.value)} style={selectStyle}>
                          <option value="BF16">BF16</option>
                          <option value="FP16">FP16</option>
                          <option value="关闭">关闭</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          梯度检查点 <Tip text="用计算换显存" />
                        </div>
                        <Switch checked={gradCheckpoint} onChange={setGradCheckpoint} />
                      </div>
                      <div>
                        <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          Checkpoint 保存间隔 <Tip text="按步数保存，步进 100" />
                        </div>
                        <NumInput value={ckptInterval} onChange={setCkptInterval} step={100} min={100} />
                      </div>
                      <div>
                        <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          Checkpoint 最大保留数 <Tip text="保留多少个 checkpoint" />
                        </div>
                        <NumInput value={ckptMaxKeep} onChange={setCkptMaxKeep} />
                      </div>
                      <div>
                        <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          是否保存优化器状态 <Tip text="关闭节省存储，开启后可从断点恢复训练" />
                        </div>
                        <Switch checked={saveOptimizerState} onChange={setSaveOptimizerState} />
                      </div>

                      {/* 模态专属参数 — 文本-图像对比损失 (图生文/文生图) */}
                      {(modality === "图生文" || modality === "文生图") && (
                        <div style={{ gridColumn: "span 2" }}>
                          <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                            文本-图像对比损失 <Tip text="开关 + 权重，控制文本与图像的对齐" />
                          </div>
                          <SwitchWithWeight checked={textImageContrastOn} onToggle={setTextImageContrastOn} weight={textImageContrastW} onWeightChange={setTextImageContrastW} />
                        </div>
                      )}

                      {/* 模态专属参数 — 图像重建损失 (仅文生图) */}
                      {modality === "文生图" && (
                        <div style={{ gridColumn: "span 2" }}>
                          <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                            图像重建损失 <Tip text="控制图像生成质量，开关 + 权重" />
                          </div>
                          <SwitchWithWeight checked={imageReconOn} onToggle={setImageReconOn} weight={imageReconW} onWeightChange={setImageReconW} />
                        </div>
                      )}

                      {/* 模态专属参数 — 噪声调度策略 (仅文生图) */}
                      {modality === "文生图" && (
                        <div>
                          <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                            噪声调度策略 <Tip text="线性 / 余弦 / 平方根加噪曲线" />
                          </div>
                          <select value={noiseSchedule} onChange={e => setNoiseSchedule(e.target.value)} style={selectStyle}>
                            <option value="线性">线性</option>
                            <option value="余弦">余弦</option>
                            <option value="平方根">平方根</option>
                          </select>
                        </div>
                      )}

                      {/* 模态专属参数 — EMA 衰减率 (仅文生图) */}
                      {modality === "文生图" && (
                        <div>
                          <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                            EMA 衰减率 <Tip text="指数移动平均稳定生成，范围 0.9990-0.9999" />
                          </div>
                          <input type="text" value={emaDecay} onChange={e => setEmaDecay(e.target.value)} style={inputStyle} />
                        </div>
                      )}

                      {/* SFT 图生文: 视觉编码器开关 */}
                      {taskType === "sft" && modality === "图生文" && (
                        <div style={{ gridColumn: "span 2" }}>
                          <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                            视觉编码器 <Tip text="仅图-文模型。开=可训练，关=冻结（默认冻结）" />
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch checked={visionEncoderTrainable} onChange={setVisionEncoderTrainable} />
                            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>{visionEncoderTrainable ? "可训练" : "冻结"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={goNext} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "8px 24px", cursor: "pointer" }}>
                下一步
              </button>
            </div>
          )}

          <div style={{ height: 1, background: "#f0f2f7" }} />

          {/* ── STEP 4: 评估配置 ── */}
          <AccordionHeader step={4} label="评估配置" />
          {currentStep === 4 && (
            <div style={{ padding: "24px 24px 20px" }}>
              {/* 验证数据 */}
              <div style={{ marginBottom: 24 }}>
                <FieldLabel>验证数据</FieldLabel>
                <div className="flex items-center gap-6 mb-3">
                  {radioBtn(validationMode === "none", "无", () => setValidationMode("none"))}
                  {radioBtn(validationMode === "select", "选择数据集", () => setValidationMode("select"))}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.7, marginBottom: 12, maxWidth: 560 }}>
                  模型训练过程中，用于固定网络结构以及调整模型参数的数据集，未上传时取部分训练数据作为验证数据。
                </div>
                {/* When "无" selected: show split ratio dropdown */}
                {validationMode === "none" && (
                  <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>切分训练集比例：</span>
                    <div className="relative" style={{ width: 120 }}>
                      <button
                        onClick={() => setSplitOpen(!splitOpen)}
                        className="w-full flex items-center justify-between"
                        style={{ height: 32, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#1a1d23" }}
                      >
                        {splitRatio}
                        <ChevronDown size={13} color="#6b7280" />
                      </button>
                      {splitOpen && (
                        <div className="absolute w-full rounded-lg shadow-lg z-10 overflow-hidden" style={{ top: "calc(100% + 4px)", border: "1px solid #e0e3ed", background: "#fff" }}>
                          {["1%", "5%", "10%"].map(r => (
                            <button key={r} onClick={() => { setSplitRatio(r); setSplitOpen(false); }}
                              className="w-full flex items-center"
                              style={{
                                padding: "8px 12px", fontSize: 13, border: "none", cursor: "pointer", textAlign: "left",
                                background: splitRatio === r ? "#f0f4ff" : "#fff", color: splitRatio === r ? "#4f6ef7" : "#374151",
                                fontWeight: splitRatio === r ? 500 : 400,
                              }}>
                              {splitRatio === r && <Check size={12} color="#4f6ef7" style={{ marginRight: 6 }} />}
                              {splitRatio !== r && <span style={{ width: 18 }} />}
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* When "选择数据集" selected: show dataset select */}
                {validationMode === "select" && (
                  <div className="flex items-center gap-3" style={{ maxWidth: 400 }}>
                    <select style={{ ...selectStyle, flex: 1 }}>
                      <option>请选择校验数据集</option>
                      <option>Eval-文本验证集-A</option>
                      <option>Eval-图文验证集-B</option>
                    </select>
                    <button style={{ fontSize: 12, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>
                      + 新建数据集
                    </button>
                  </div>
                )}
              </div>

              {/* 评估指标 */}
              <div style={{ marginBottom: 24 }}>
                <FieldLabel>评估指标（可多选）</FieldLabel>
                <div className="flex flex-wrap items-center gap-3">
                  {evalMetricOptions.map(m => {
                    const checked = evalMetrics.has(m.label);
                    return (
                      <label key={m.label} className="flex items-center gap-2" style={{ cursor: m.core ? "not-allowed" : "pointer", fontSize: 13, color: m.core ? "#9ca3af" : "#374151" }}>
                        <span className="flex items-center justify-center rounded flex-shrink-0" style={{
                          width: 16, height: 16, border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`,
                          background: checked ? "#4f6ef7" : "#fff", transition: "all 0.15s",
                        }}>
                          {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                        </span>
                        <input type="checkbox" checked={checked} onChange={() => toggleMetric(m.label)} disabled={m.core} style={{ display: "none" }} />
                        {m.label}
                        {m.core && <span style={{ fontSize: 10, color: "#4f6ef7", background: "#eff4ff", borderRadius: 3, padding: "1px 5px", marginLeft: 2 }}>核心</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 评估频率 — by modality */}
              <div style={{ marginBottom: 24 }}>
                <FieldLabel>评估频率</FieldLabel>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 13, color: "#374151" }}>每</span>
                  <input
                    type="number"
                    value={evalFreqValue}
                    onChange={e => setEvalFreqValue(Number(e.target.value))}
                    style={{ width: 80, height: 32, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, outline: "none", textAlign: "center" }}
                  />
                  <span style={{ fontSize: 13, color: "#374151" }}>{evalFreqUnit} 一次</span>
                </div>
              </div>

              <button onClick={goNext} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "8px 24px", cursor: "pointer" }}>
                下一步
              </button>
            </div>
          )}

          <div style={{ height: 1, background: "#f0f2f7" }} />

          {/* ── STEP 5: 确认提交 ── */}
          <AccordionHeader step={5} label="确认提交" />
          {currentStep === 5 && (
            <div style={{ padding: "24px 24px 20px" }}>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>请确认以下配置信息后提交</div>
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e8ebf2", maxWidth: 600 }}>
                {[
                  { label: "任务类型", value: taskType === "cpt" ? "继续预训练" : taskType === "sft" ? "监督微调" : "强化学习" },
                  { label: "任务名称", value: taskName || "（未填写）" },
                  { label: "生成模态", value: modality },
                  { label: "基础模型", value: (modelTab === "plaza" ? (filteredModels.find(m => m.id === selectedModel)?.name ?? selectedModel) : selectedModel) || "—" },
                  { label: "资源组", value: resourceGroup || "—" },
                  { label: "模型输出名称", value: outputModelName || "—" },
                  { label: "训练数据", value: trainDataset || "—" },
                  ...(taskType === "cpt" ? [{ label: "预训练框架", value: architecture.framework }, { label: "模型架构", value: architecture.architecture }] : []),
                  ...(taskType === "sft" ? [{ label: "微调方法", value: fineTuneMethod === "lora" ? "LoRA" : fineTuneMethod === "qlora" ? "QLoRA" : fineTuneMethod === "ptuning" ? "P-Tuning" : "全量微调" }] : []),
                  { label: "训练轮数 (Epoch)", value: String(epoch) },
                  { label: taskType === "cpt" ? "基础学习率" : "学习率", value: baseLr },
                  { label: "批次大小 (Batch Size)", value: String(batchSize) },
                  ...(modality !== "文生图" ? [{ label: "最大序列长度", value: String(maxSeq) }] : []),
                  ...(modality === "文生图" ? [{ label: "训练分辨率", value: String(resolution) }] : []),
                  { label: "验证数据", value: validationMode === "none" ? `无（切分${splitRatio}训练数据）` : "已选择数据集" },
                  { label: "评估指标", value: [...evalMetrics].join("、") || "—" },
                  { label: "评估频率", value: `每 ${evalFreqValue} ${evalFreqUnit} 一次` },
                ].map((row, i, arr) => (
                  <div key={row.label} className="flex" style={{ borderBottom: i < arr.length - 1 ? "1px solid #f0f2f7" : "none" }}>
                    <div style={{ width: 180, padding: "10px 16px", fontSize: 13, color: "#6b7280", background: "#f8f9fc", flexShrink: 0 }}>{row.label}</div>
                    <div style={{ padding: "10px 16px", fontSize: 13, color: "#1a1d23", flex: 1 }}>{row.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24 }}>
                <button onClick={handleSubmit} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "8px 28px", cursor: "pointer" }}>
                  确认提交
                </button>
                <button onClick={onCancel} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "8px 20px", cursor: "pointer", marginLeft: 10 }}>
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      {currentStep < 5 && (
        <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "12px 24px", background: "#fff", borderTop: "1px solid #e8ebf2", gap: 10 }}>
          <button onClick={onCancel} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}>
            取消
          </button>
          <button
            onClick={() => { setCompletedSteps(new Set([1, 2, 3, 4])); setCurrentStep(5); }}
            style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "8px 24px", cursor: "pointer" }}
          >
            确认提交
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Evaluation Report Page ───────────────────────────────────────────────────

// Chart data generators
const timeLabels = ["00:01", "00:04", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "00:00"];

const lossData = [
  { time: "00:01", train: 248, val: 232 },
  { time: "00:04", train: 220, val: 218 },
  { time: "03:00", train: 190, val: 200 },
  { time: "06:00", train: 162, val: 175 },
  { time: "09:00", train: 135, val: 152 },
  { time: "12:00", train: 108, val: 128 },
  { time: "15:00", train: 84,  val: 105 },
  { time: "18:00", train: 64,  val: 88  },
  { time: "21:00", train: 52,  val: 74  },
  { time: "00:00", train: 44,  val: 62  },
];

const lrData = [
  { time: "00:01", lr: 280 },
  { time: "00:04", lr: 240 },
  { time: "03:00", lr: 195 },
  { time: "06:00", lr: 165 },
  { time: "09:00", lr: 140 },
  { time: "12:00", lr: 110 },
  { time: "15:00", lr: 88  },
  { time: "18:00", lr: 70  },
  { time: "21:00", lr: 55  },
  { time: "00:00", lr: 44  },
];

const cpuData = [
  { time: "00:01", cpu: 42 },
  { time: "00:04", cpu: 68 },
  { time: "03:00", cpu: 55 },
  { time: "06:00", cpu: 72 },
  { time: "09:00", cpu: 60 },
  { time: "12:00", cpu: 78 },
  { time: "15:00", cpu: 65 },
  { time: "18:00", cpu: 50 },
  { time: "21:00", cpu: 74 },
  { time: "00:00", cpu: 58 },
];

const gpuData = [
  { time: "00:01", gpu: 55 },
  { time: "00:04", gpu: 82 },
  { time: "03:00", gpu: 78 },
  { time: "06:00", gpu: 90 },
  { time: "09:00", gpu: 75 },
  { time: "12:00", gpu: 88 },
  { time: "15:00", gpu: 72 },
  { time: "18:00", gpu: 85 },
  { time: "21:00", gpu: 80 },
  { time: "00:00", gpu: 70 },
];

const miniChartStyle: React.CSSProperties = {
  background: "#fff", border: "1px solid #e8ebf2", borderRadius: 10, padding: "14px 16px", flex: 1,
};

function SmallLineChart({ data, dataKey, color, label }: {
  data: any[]; dataKey: string; color: string; label: string;
}) {
  return (
    <div style={miniChartStyle}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Info size={13} color="#9ca3af" />
          {label}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderWidth: 1, borderStyle: "solid", borderColor: "#e0e3ed", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
            labelStyle={{ color: "#6b7280" }}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function EvaluationReportPage({ taskName, onBack }: { taskName: string; onBack: () => void }) {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "14px 24px 0" }}>
        <div className="flex items-center gap-1.5" style={{ fontSize: 13, color: "#6b7280" }}>
          <span style={{ color: "#4f6ef7", cursor: "pointer" }} onClick={onBack}>训练任务名称</span>
          <ChevronRight size={13} />
          <span style={{ color: "#1a1d23", fontWeight: 500 }}>{taskName}（任务名称）</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            style={{
              fontSize: 13, fontWeight: 500, color: "#4f6ef7",
              background: "#fff", border: "1px solid #4f6ef7",
              borderRadius: 6, padding: "6px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Upload size={13} /> 训练主义
          </button>
          <button
            onClick={() => { setPublishing(true); setTimeout(() => { setPublishing(false); setPublished(true); }, 800); }}
            style={{
              fontSize: 13, fontWeight: 500, color: "#fff",
              background: published ? "#22c55e" : "#4f6ef7",
              border: "none", borderRadius: 6, padding: "6px 20px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, transition: "background 0.3s",
            }}
          >
            {publishing ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : published ? <Check size={13} /> : null}
            {published ? "已发布" : "发布"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: "14px 24px 24px" }}>
        {/* Main loss chart */}
        <div style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-3">
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23", display: "flex", alignItems: "center", gap: 6 }}>
              <Info size={14} color="#9ca3af" />
              训练及验证损失
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div style={{ width: 24, height: 2, background: "#4f6ef7", borderRadius: 1 }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>Training Loss</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 20, height: 0, border: "none", borderTop: "2px dashed #f59e42", borderRadius: 1 }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>Validation Loss</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lossData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#e8ebf2" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} domain={[0, 280]} ticks={[0, 50, 100, 150, 200, 250]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderWidth: 1, borderStyle: "solid", borderColor: "#e0e3ed", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                labelStyle={{ color: "#374151", fontWeight: 500, marginBottom: 4 }}
                formatter={(v: any, name: string) => [v, name === "train" ? "Training Loss" : "Validation Loss"]}
              />
              <Line
                type="monotone" dataKey="train" stroke="#4f6ef7" strokeWidth={2.5}
                dot={false} activeDot={{ r: 4, fill: "#4f6ef7" }}
              />
              <Line
                type="monotone" dataKey="val" stroke="#f59e42" strokeWidth={2}
                strokeDasharray="5 4" dot={false} activeDot={{ r: 4, fill: "#f59e42" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Three small charts */}
        <div className="flex gap-4">
          <SmallLineChart data={lrData} dataKey="lr" color="#4f6ef7" label="学习率" />
          <SmallLineChart data={cpuData} dataKey="cpu" color="#10b981" label="CPU 利用率" />
          <SmallLineChart data={gpuData} dataKey="gpu" color="#8b5cf6" label="GPU 利用率" />
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Training Data Page ───────────────────────────────────────────────────────

interface DatasetRow {
  id: number; name: string; type: string; desc: string; modality: string;
  count: string; status: "已校验" | "校验失败" | "待校验"; creator: string; updatedAt: string;
}

const defaultDatasets: DatasetRow[] = [
  { id: 1, name: "sft-chat-dataset", type: "SFT", desc: "对话微调数据集", modality: "文生文", count: "12000条", status: "已校验", creator: "张小明", updatedAt: "2026-07-10 14:22:31" },
  { id: 2, name: "cpt-corpus-v2", type: "CPT", desc: "通用预训练语料库", modality: "文生文", count: "85000条", status: "已校验", creator: "李华", updatedAt: "2026-07-08 09:15:42" },
  { id: 3, name: "vlm-sft-images", type: "SFT", desc: "图文理解多模态数据集", modality: "图生文", count: "5600条", status: "待校验", creator: "王芳", updatedAt: "2026-07-12 18:03:09" },
  { id: 4, name: "t2i-eval-set", type: "Eval", desc: "文生图评测基准集", modality: "文生图", count: "800条", status: "已校验", creator: "陈伟", updatedAt: "2026-07-05 11:48:53" },
  { id: 5, name: "rl-preference-pairs", type: "RL", desc: "偏好对齐训练数据", modality: "文生文", count: "3200条", status: "校验失败", creator: "刘洋", updatedAt: "2026-07-11 16:30:18" },
  { id: 6, name: "image-gen-sft", type: "SFT", desc: "文生图微调数据集", modality: "文生图", count: "2400条", status: "待校验", creator: "赵敏", updatedAt: "2026-07-13 10:12:45" },
];

const datasetStatusCfg: Record<DatasetRow["status"], { bg: string; text: string; dot: string }> = {
  "已校验":   { bg: "#f0faf5", text: "#16a34a", dot: "#22c55e" },
  "校验失败": { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
  "待校验":   { bg: "#fffbeb", text: "#d97706", dot: "#f59e0b" },
};

interface CreateDatasetForm {
  name: string; desc: string; type: string; file: string; modality: string;
}

function CreateDatasetModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (data: CreateDatasetForm) => void }) {
  const [form, setForm] = useState<CreateDatasetForm>({ name: "", desc: "", type: "SFT", file: "", modality: "文生文" });

  const setField = (k: keyof CreateDatasetForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const inputCls: React.CSSProperties = {
    width: "100%", height: 34, padding: "0 10px", fontSize: 13,
    border: "1px solid #e0e3ed", borderRadius: 6, outline: "none",
    color: "#1a1d23", background: "#fff", boxSizing: "border-box",
  };

  const lockedInputCls: React.CSSProperties = {
    ...inputCls, background: "#f5f7fa", color: "#9ca3af", cursor: "not-allowed",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100 }}
      />
      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", right: 0, transform: "translateY(-50%)",
        width: 400, background: "#fff", zIndex: 101,
        borderRadius: "12px 0 0 12px", boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column", maxHeight: "90vh",
      }}>
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23" }}>创建数据集</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2, lineHeight: 1 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto" style={{ padding: "20px 20px" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>数据集名称
            </div>
            <input
              value={form.name} onChange={e => setField("name", e.target.value)}
              placeholder="请输入数据集名称(只支持英文和数字)"
              style={inputCls}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>数据集简介</div>
            <input
              value={form.desc} onChange={e => setField("desc", e.target.value)}
              placeholder="请输入数据集简介"
              style={inputCls}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>类型</div>
            <div className="flex items-center gap-2">
              {["CPT", "SFT", "RL", "Eval"].map(t => (
                <button
                  key={t}
                  onClick={() => setField("type", t)}
                  style={{
                    fontSize: 13, fontWeight: 500,
                    padding: "5px 16px", borderRadius: 6,
                    border: `1px solid ${form.type === t ? "#4f6ef7" : "#e0e3ed"}`,
                    background: form.type === t ? "#eff4ff" : "#fff",
                    color: form.type === t ? "#4f6ef7" : "#6b7280",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >{t}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>上传数据集</div>
            <div className="flex items-center gap-2">
              <input
                value={form.file} onChange={e => setField("file", e.target.value)}
                placeholder="请选择数据集文件"
                style={{ ...inputCls, flex: 1 }}
              />
              <button
                style={{
                  display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 500,
                  color: "#4f6ef7", background: "#eff4ff", border: "1px solid #4f6ef7", borderRadius: 6,
                  padding: "0 12px", height: 34, cursor: "pointer", flexShrink: 0,
                }}
              >
                <Upload size={13} /> 选择文件
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>模态</div>
            <input
              value={form.modality} readOnly
              placeholder="文生文"
              style={lockedInputCls}
            />
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>模态默认与训练任务保持一致，不可修改</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "14px 20px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "7px 20px", cursor: "pointer" }}>
            取消
          </button>
          <button
            onClick={() => { if (form.name.trim()) { onConfirm(form); onClose(); } }}
            style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "7px 20px", cursor: "pointer" }}
          >
            确定
          </button>
        </div>
      </div>
    </>
  );
}

function TrainingDataPage() {
  const [search, setSearch] = useState("");
  const [datasets, setDatasets] = useState<DatasetRow[]>(defaultDatasets);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [goPage, setGoPage] = useState("");

  const filtered = datasets.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (form: CreateDatasetForm) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setDatasets(prev => [...prev, {
      id: prev.length + 1,
      name: form.name,
      type: form.type,
      desc: form.desc,
      modality: form.modality,
      count: "0条",
      status: "待校验",
      creator: "管理员",
      updatedAt: dateStr,
    }]);
  };

  const handleDelete = (id: number) => {
    setDatasets(prev => prev.filter(d => d.id !== id));
  };

  return (
    <>
      <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
          <span style={{ color: "#4f6ef7" }}>首页</span>
          <ChevronRight size={13} />
          <span style={{ color: "#4f6ef7" }}>模型训练</span>
          <ChevronRight size={13} />
          <span style={{ color: "#1a1d23", fontWeight: 500 }}>训练数据</span>
        </div>

        {/* Card */}
        <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 32, padding: "0 10px" }}>
                <input
                  type="text" placeholder="数据集名称搜索" value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ fontSize: 13, border: "none", outline: "none", width: 150, background: "transparent" }}
                />
              </div>
              <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer" }}>
                <Search size={13} /> 搜索
              </button>
              <button
                onClick={() => setSearch("")}
                style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer" }}
              >
                重置
              </button>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer" }}
            >
              <Plus size={14} /> 创建数据集
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8f9fc" }}>
                  {["数据集名称", "类型", "模态", "数据集简介", "数据量", "文件状态", "创建人", "更新时间", "操作"].map(col => (
                    <th key={col} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: "#6b7280", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td>
                  </tr>
                ) : filtered.map(row => {
                  const sc = datasetStatusCfg[row.status];
                  return (
                    <tr key={row.id} style={{ borderBottom: "1px solid #f5f7fa" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "12px 14px", color: "#1a1d23", fontWeight: 500 }}>{row.name}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 12, padding: "2px 8px", background: "#eff4ff", color: "#4f6ef7", fontWeight: 500, borderRadius: 4 }}>{row.type}</span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#374151" }}>{row.modality}</td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{row.desc}</td>
                      <td style={{ padding: "12px 14px", color: "#374151" }}>{row.count}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: sc.bg, fontSize: 12 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block", flexShrink: 0 }} />
                          <span style={{ color: sc.text, fontWeight: 500 }}>{row.status}</span>
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{row.creator}</td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>{row.updatedAt}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div className="flex items-center gap-3">
                          <button style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>编辑</button>
                          <button onClick={() => handleDelete(row.id)} style={{ fontSize: 12.5, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}>删除</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
            <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {filtered.length} 条</span>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 12.5, color: "#9ca3af" }}>10条/页</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: "pointer" }}>
                  <ChevronLeft size={13} />
                </button>
                <button style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #4f6ef7", borderRadius: 5, background: "#4f6ef7", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  {page}
                </button>
                <button onClick={() => setPage(page + 1)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e0e3ed", borderRadius: 5, background: "#fff", cursor: "pointer" }}>
                  <ChevronRight size={13} />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 12.5, color: "#9ca3af" }}>前往</span>
                <input
                  type="number" value={goPage} onChange={e => setGoPage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && goPage) { setPage(Number(goPage)); setGoPage(""); } }}
                  style={{ width: 44, height: 28, textAlign: "center", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 5, outline: "none" }}
                />
                <span style={{ fontSize: 12.5, color: "#9ca3af" }}>页</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateDatasetModal onClose={() => setShowModal(false)} onConfirm={handleCreate} />
      )}
    </>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────

function PlaceholderPage({ label }: { label: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center" style={{ background: "#f5f7fa" }}>
      <div className="rounded-xl flex flex-col items-center justify-center" style={{ background: "#fff", border: "1px solid #e8ebf2", padding: "48px 64px" }}>
        <Layers size={36} color="#d1d5db" />
        <div style={{ fontSize: 14, fontWeight: 500, color: "#6b7280", marginTop: 12 }}>{label}</div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>内容区域</div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, onSelect }: { active: string; onSelect: (key: string) => void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["model-management"]));

  const toggle = (key: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const activeParentKey = menuData.find(m => m.children?.some(c => c.key === active))?.key;

  return (
    <aside className="flex flex-col h-full flex-shrink-0" style={{ width: 220, background: "#181c2e", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2.5 flex-shrink-0" style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 32, height: 32, background: "linear-gradient(135deg, #4f6ef7 0%, #7c5cf6 100%)" }}>
          <Cpu size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f0f2ff", letterSpacing: 0.3 }}>MaaS</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5 }}>MODEL AS A SERVICE</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto" style={{ padding: "10px 0 16px" }}>
        {menuData.map(item => {
          const isExp = expanded.has(item.key);
          const isParentActive = activeParentKey === item.key;
          const isLeafActive = active === item.key;
          return (
            <div key={item.key}>
              <button className="w-full flex items-center justify-between"
                style={{ padding: "8px 16px", background: (isParentActive || isLeafActive) && !isExp ? "rgba(79,110,247,0.15)" : "transparent", borderLeft: (isParentActive || isLeafActive) && !isExp ? "2px solid #4f6ef7" : "2px solid transparent" }}
                onClick={() => item.children ? toggle(item.key) : onSelect(item.key)}>
                <div className="flex items-center gap-2.5">
                  <span style={{ color: isParentActive || isLeafActive ? "#7c9bfa" : "rgba(255,255,255,0.45)" }}>{item.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: isParentActive || isLeafActive ? "#e8edff" : "rgba(255,255,255,0.65)" }}>{item.label}</span>
                </div>
                {item.children && <span style={{ color: "rgba(255,255,255,0.3)" }}>{isExp ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>}
              </button>
              {item.children && isExp && (
                <div style={{ background: "rgba(0,0,0,0.15)" }}>
                  {item.children.map(child => {
                    const isActive = active === child.key;
                    return (
                      <button key={child.key} className="w-full flex items-center"
                        style={{ padding: "7px 16px 7px 44px", background: isActive ? "rgba(79,110,247,0.18)" : "transparent", borderLeft: isActive ? "2px solid #4f6ef7" : "2px solid transparent" }}
                        onClick={() => onSelect(child.key)}>
                        <span style={{ fontSize: 12.5, fontWeight: isActive ? 500 : 400, color: isActive ? "#7c9bfa" : child.highlight ? "#f59e42" : "rgba(255,255,255,0.5)" }}>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="flex items-center gap-2 flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: 26, height: 26, background: "rgba(79,110,247,0.25)" }}>
          <UserCircle size={14} color="#7c9bfa" />
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>管理员</div>
      </div>
    </aside>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeMenu, setActiveMenu] = useState("model-plaza");
  const [trainingView, setTrainingView] = useState<"list" | "create" | "evaluation">("list");
  const [models, setModels] = useState<ModelRecord[]>(INITIAL_MODELS);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>(INITIAL_DEPLOYMENTS);
  const [instances, setInstances] = useState<ModelInstanceRecord[]>(INITIAL_INSTANCES);
  const [deployPrefillModelId, setDeployPrefillModelId] = useState<string | null>(null);
  const [experiencePrefillModel, setExperiencePrefillModel] = useState<string | null>(null);
  const [trainingPrefillModelId, setTrainingPrefillModelId] = useState<string | null>(null);
  const [evalTaskName, setEvalTaskName] = useState("");

  const handleMenuSelect = (key: string) => {
    setActiveMenu(key);
    if (key === "training-task") {
      setTrainingPrefillModelId(null);
      setTrainingView("list");
    }
  };

  const trainingPrefillModel = trainingPrefillModelId
    ? models.find(model => model.id === trainingPrefillModelId) ?? null
    : null;

  const activeParent = menuData.find(m => m.children?.some(c => c.key === activeMenu));
  const activeLabel =
    menuData.find(m => m.key === activeMenu)?.label ??
    menuData.flatMap(m => m.children ?? []).find(c => c.key === activeMenu)?.label ?? "";

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar active={activeMenu} onSelect={handleMenuSelect} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between flex-shrink-0" style={{ height: 52, padding: "0 24px", background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-2" style={{ fontSize: 13, color: "#6b7280" }}>
            {activeParent && <><span>{activeParent.label}</span><ChevronRight size={12} /></>}
            <span style={{ color: "#1a1d23", fontWeight: 500 }}>{activeLabel}</span>
            {activeMenu === "training-task" && trainingView === "create" && (
              <><ChevronRight size={12} /><span style={{ color: "#1a1d23", fontWeight: 500 }}>创建训练任务</span></>
            )}
            {activeMenu === "training-task" && trainingView === "evaluation" && (
              <><ChevronRight size={12} /><span style={{ color: "#1a1d23", fontWeight: 500 }}>评估报告</span></>
            )}
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          {activeMenu === "model-plaza" ? (
            <ModelPlazaPage
              models={models}
              deployments={deployments}
              onDeploy={model => {
                setDeployPrefillModelId(model.id);
                handleMenuSelect("model-deploy");
              }}
              onExperience={modelName => {
                setExperiencePrefillModel(modelName);
                handleMenuSelect("model-experience");
              }}
              onTrain={model => {
                setTrainingPrefillModelId(model.id);
                setActiveMenu("training-task");
                setTrainingView("create");
              }}
            />
          ) : activeMenu === "training-task" ? (
            trainingView === "list"
              ? <TrainingTaskList
                  onCreate={() => { setTrainingPrefillModelId(null); setTrainingView("create"); }}
                  onEvalReport={(name) => { setEvalTaskName(name); setTrainingView("evaluation"); }}
                />
              : trainingView === "create"
              ? <CreateTrainingTaskPage key={trainingPrefillModelId ?? "manual"} initialModel={trainingPrefillModel} models={models} onCancel={() => { setTrainingPrefillModelId(null); setTrainingView("list"); }} />
              : <EvaluationReportPage taskName={evalTaskName} onBack={() => setTrainingView("list")} />
          ) : activeMenu === "training-data" ? (
            <TrainingDataPage />
          ) : activeMenu === "model-list" ? (
            <ModelManagementPage models={models} onModelsChange={setModels} onDeploy={model => {
              setDeployPrefillModelId(model.id);
              handleMenuSelect("model-deploy");
            }} />
          ) : activeMenu === "model-deploy" ? (
            <ModelDeploymentPage models={models} deployments={deployments} onDeploymentsChange={setDeployments} instances={instances} onInstancesChange={setInstances} prefillModelId={deployPrefillModelId} onPrefillConsumed={() => setDeployPrefillModelId(null)} />
          ) : activeMenu === "deploy-instance" ? (
            <DeployInstancePage instances={instances} onInstancesChange={setInstances} />
          ) : activeMenu === "inference-service" ? (
            <InferenceServicePage />
          ) : activeMenu === "cluster-list" ? (
            <ClusterListPage />
          ) : activeMenu === "node-list" ? (
            <NodeListPage />
          ) : activeMenu === "resource-group" ? (
            <ResourceGroupPage />
          ) : activeMenu === "user-account" ? (
            <UserAccountPage />
          ) : activeMenu === "my-model" ? (
            <MyModelsPage />
          ) : activeMenu === "audit-events" ? (
            <AuditEventsPage />
          ) : activeMenu === "usage-stats" ? (
            <UsageStatsPage />
          ) : activeMenu === "log-mining" ? (
            <LogMiningPage />
          ) : activeMenu === "model-router" ? (
            <ModelRoutingPage />
          ) : activeMenu === "evaluation-task" ? (
            <ModelEvaluationPage />
          ) : activeMenu === "evaluation-data" ? (
            <EvaluationDataPage />
          ) : activeMenu === "workspace" ? (
            <ResourcePermissionPage />
          ) : activeMenu === "user-role" ? (
            <UserRolePage />
          ) : activeMenu === "model-experience" ? (
            <ModelExperiencePage deployments={deployments} models={models} initialModel={experiencePrefillModel} />
          ) : (
            <PlaceholderPage label={activeLabel} />
          )}
        </div>
      </main>
    </div>
  );
}
