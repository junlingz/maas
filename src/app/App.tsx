import { useState } from "react";
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
import { PromptTemplatePage } from "./components/PromptTemplate";
import { ModelDeploymentPage } from "./components/ModelDeployment";
import { ClusterListPage } from "./components/ClusterList";
import { NodeListPage, ResourceGroupPage } from "./components/NodeResourceGroup";
import { PromptTuningPage, TplInfo } from "./components/PromptTuning";
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
  {
    label: "体验中心", key: "experience-center", icon: <FlaskConical size={16} />,
    children: [
      { label: "模型体验", key: "model-experience" },
    ],
  },
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

type TrainingModelOption = {
  id: string;
  name: string;
  tag: string;
  info: string;
  detail: string;
};

const DEFAULT_TRAINING_MODEL_ID = "qwen2-32b";

const MODEL_CARDS: TrainingModelOption[] = [
  { id: "qwen2-72b", name: "Qwen2-72B", tag: "推荐", info: "参数量: 72B", detail: "最高精度" },
  { id: "qwen2-32b", name: "Qwen2-32B", tag: "最新推荐", info: "参数量: 32B", detail: "均衡性能" },
  { id: "qwen2-7b-a", name: "Qwen2-7B", tag: "推荐", info: "参数量: 7B", detail: "轻量高效" },
  { id: "qwen2-7b-b", name: "Qwen2-7B", tag: "", info: "参数量: 7B", detail: "轻量部署" },
];

function toTrainingModelOption(model: ModelRecord): TrainingModelOption {
  return {
    id: model.id,
    name: model.name,
    tag: "来自模型广场",
    info: `参数量: ${model.paramSize}B`,
    detail: `${model.category} · ${model.developer}`,
  };
}

function getTrainingModelOptions(initialModel?: ModelRecord | null): TrainingModelOption[] {
  if (!initialModel) return MODEL_CARDS;
  const option = toTrainingModelOption(initialModel);
  const exists = MODEL_CARDS.some(model => model.id === initialModel.id);
  return exists
    ? MODEL_CARDS.map(model => model.id === initialModel.id ? { ...model, tag: model.tag || option.tag } : model)
    : [option, ...MODEL_CARDS];
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

// Number input
function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center rounded-md overflow-hidden" style={{ border: "1px solid #e0e3ed", height: 34 }}>
      <button onClick={() => onChange(Math.max(1, value - 1))} style={{ width: 28, background: "#f8f9fc", border: "none", cursor: "pointer", height: "100%", color: "#6b7280", fontSize: 16 }}>−</button>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: 60, textAlign: "center", border: "none", outline: "none", fontSize: 13, background: "transparent" }} />
      <button onClick={() => onChange(value + 1)} style={{ width: 28, background: "#f8f9fc", border: "none", cursor: "pointer", height: "100%", color: "#6b7280", fontSize: 16 }}>+</button>
    </div>
  );
}

function CreateTrainingTaskPage({ onCancel, initialModel }: { onCancel: () => void; initialModel?: ModelRecord | null }) {
  const [currentStep, setCurrentStep] = useState(initialModel ? 2 : 1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set(initialModel ? [1] : []));
  const [submitted, setSubmitted] = useState(false);
  const trainingModelOptions = getTrainingModelOptions(initialModel);

  // Step 1 state
  const [taskType, setTaskType] = useState<"finetune" | "pretrain">("finetune");

  // Step 2 state
  const [taskName, setTaskName] = useState("");
  const [framework, setFramework] = useState("wenxin");
  const [selectedModel, setSelectedModel] = useState(initialModel?.id ?? DEFAULT_TRAINING_MODEL_ID);
  const [uploadMode, setUploadMode] = useState("local");
  const [datasetName, setDatasetName] = useState("");
  const [trainRatio, setTrainRatio] = useState(80);

  // Step 3 state
  const [trainMode, setTrainMode] = useState("normal");
  const [pretrainFramework, setPretrainFramework] = useState("seq2seq");
  const [epoch, setEpoch] = useState(1);
  const [lrMul, setLrMul] = useState(1);
  const [batchSize, setBatchSize] = useState(1);
  const [maxSeq, setMaxSeq] = useState(1);
  const [resourceType, setResourceType] = useState("builtin");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Step 4 state
  const [validationMode, setValidationMode] = useState<"none" | "select">("none");
  const [evalMetrics, setEvalMetrics] = useState<Set<string>>(new Set(["困惑度"]));
  const [evalFreq, setEvalFreq] = useState("10min/次");
  const [freqOpen, setFreqOpen] = useState(false);

  const toggleMetric = (m: string) => {
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
              <div className="grid grid-cols-2 gap-4" style={{ maxWidth: 600 }}>
                {/* 微调训练 */}
                <div
                  onClick={() => setTaskType("finetune")}
                  style={{
                    border: `2px solid ${taskType === "finetune" ? "#4f6ef7" : "#e0e3ed"}`,
                    borderRadius: 10, padding: 16, cursor: "pointer",
                    background: taskType === "finetune" ? "#f5f8ff" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: taskType === "finetune" ? "#4f6ef7" : "#f0f2f7" }}>
                      <BrainCircuit size={14} color={taskType === "finetune" ? "#fff" : "#9ca3af"} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>微调训练</span>
                    {taskType === "finetune" && (
                      <span className="ml-auto flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: "#4f6ef7" }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                    在已有基础模型上进行微调，专注于特定领域，适合下游任务场景使用，成本低，收敛快，推荐使用。
                  </div>
                </div>

                {/* 预调任务 */}
                <div
                  onClick={() => setTaskType("pretrain")}
                  style={{
                    border: `2px solid ${taskType === "pretrain" ? "#4f6ef7" : "#e0e3ed"}`,
                    borderRadius: 10, padding: 16, cursor: "pointer",
                    background: taskType === "pretrain" ? "#f5f8ff" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: taskType === "pretrain" ? "#4f6ef7" : "#f0f2f7" }}>
                      <Server size={14} color={taskType === "pretrain" ? "#fff" : "#9ca3af"} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>预调任务</span>
                    {taskType === "pretrain" && (
                      <span className="ml-auto flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: "#4f6ef7" }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                    从零开始或基于海量数据进行预训练，构建基础能力模型，适用于特定行业领域，以此获得领域专属模型能力。
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
                <input value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="请输入任务名称"
                  style={{ ...inputStyle, maxWidth: 400 }} />
              </div>

              {/* 关联资源 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>关联资源</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-12">
                  <div>
                    <FieldLabel>框架类型</FieldLabel>
                    <div className="flex items-center gap-4">
                      {radioBtn(framework === "wenxin", "文心大文", () => setFramework("wenxin"))}
                      {radioBtn(framework === "offline", "离线方式", () => setFramework("offline"))}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>资源队列</FieldLabel>
                    <select style={{ ...selectStyle, maxWidth: 200 }}>
                      <option>已选择</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 选择基础模型 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel required>选择基础模型</FieldLabel>
                <div className="grid grid-cols-2 gap-3" style={{ maxWidth: 560 }}>
                  {trainingModelOptions.map(m => (
                    <div key={m.id} onClick={() => setSelectedModel(m.id)}
                      style={{
                        border: `2px solid ${selectedModel === m.id ? "#4f6ef7" : "#e0e3ed"}`,
                        borderRadius: 8, padding: 12, cursor: "pointer",
                        background: selectedModel === m.id ? "#f5f8ff" : "#fff",
                        transition: "all 0.15s", position: "relative",
                      }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23" }}>{m.name}</span>
                        {m.tag && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#4f6ef7", background: "#eff4ff", borderRadius: 4, padding: "1px 6px" }}>{m.tag}</span>
                        )}
                        {selectedModel === m.id && (
                          <span className="absolute top-2 right-2 flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#4f6ef7" }}>
                            <Check size={10} color="#fff" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{m.info} · {m.detail}</div>
                    </div>
                  ))}
                </div>
                {/* Selected summary */}
                <div className="flex items-center gap-3 rounded-lg mt-3" style={{ padding: "10px 14px", background: "#f0f4ff", border: "1px solid #d0dcff", maxWidth: 560 }}>
                  <Check size={14} color="#4f6ef7" />
                  <span style={{ fontSize: 13, color: "#4f6ef7", fontWeight: 500 }}>
                    {trainingModelOptions.find(m => m.id === selectedModel)?.name}
                  </span>
                  <span style={{ fontSize: 12, color: "#6b7280", marginLeft: "auto" }}>已选择推理服务</span>
                </div>
              </div>

              {/* 训练数据 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>训练数据</div>
                <div style={{ marginBottom: 12 }}>
                  <FieldLabel>上传方式</FieldLabel>
                  <div className="flex items-center gap-4">
                    {radioBtn(uploadMode === "local", "从本地传", () => setUploadMode("local"))}
                    {radioBtn(uploadMode === "obs", "OBS 上传", () => setUploadMode("obs"))}
                    {radioBtn(uploadMode === "dataset", "数据集", () => setUploadMode("dataset"))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <FieldLabel>数据集名称</FieldLabel>
                    <input value={datasetName} onChange={e => setDatasetName(e.target.value)}
                      placeholder="请输入数据集名称" style={inputStyle} />
                  </div>
                  <div>
                    <FieldLabel>增量训练描述</FieldLabel>
                    <input placeholder="请输入描述" style={inputStyle} />
                  </div>
                  <div>
                    <FieldLabel>训练集比例</FieldLabel>
                    <div className="flex items-center gap-3">
                      <input type="range" min={10} max={100} value={trainRatio} onChange={e => setTrainRatio(Number(e.target.value))} style={{ flex: 1, accentColor: "#4f6ef7" }} />
                      <span style={{ fontSize: 13, color: "#374151", width: 36 }}>{trainRatio}%</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>基本信息</FieldLabel>
                    <input placeholder="请输入" style={inputStyle} />
                  </div>
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
              {/* 训练方式 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel>训练方式</FieldLabel>
                <div className="flex items-center gap-6">
                  {radioBtn(trainMode === "normal", "常规训练", () => setTrainMode("normal"))}
                  {radioBtn(trainMode === "distributed", "分布式训练", () => setTrainMode("distributed"))}
                </div>
              </div>

              {/* 预训练框架 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel>预训练框架</FieldLabel>
                <div className="flex items-center gap-6">
                  {radioBtn(pretrainFramework === "custom", "自定训练框架", () => setPretrainFramework("custom"))}
                  {radioBtn(pretrainFramework === "seq2seq", "序列到序列训练框架", () => setPretrainFramework("seq2seq"))}
                  {radioBtn(pretrainFramework === "text-gen", "文本生成训练框架", () => setPretrainFramework("text-gen"))}
                </div>
              </div>

              {/* 框架版本选择 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel>框架版本选择</FieldLabel>
                <select style={{ ...selectStyle, maxWidth: 200 }}>
                  <option>Owen</option>
                  <option>Qwen</option>
                </select>
              </div>

              {/* 网络结构参数配置 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 16 }}>网络结构参数配置</div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 500 }}>
                  <div>
                    <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                      Epoch <Tip text="训练的轮次数，每轮遍历一次完整数据集" />
                    </div>
                    <NumInput value={epoch} onChange={setEpoch} />
                  </div>
                  <div>
                    <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                      Learning rate multiplier <Tip text="学习率倍数，用于控制每次参数更新的步长。较大的值可能导致训练不稳定，较小的值收敛慢，建议从 1 开始调整" />
                    </div>
                    <NumInput value={lrMul} onChange={setLrMul} />
                  </div>
                  <div>
                    <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                      Batch size <Tip text="每次更新参数所用的样本数量" />
                    </div>
                    <NumInput value={batchSize} onChange={setBatchSize} />
                  </div>
                  <div>
                    <div className="flex items-center mb-2" style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                      Max sequence length <Tip text="单条样本最大 token 长度" />
                    </div>
                    <NumInput value={maxSeq} onChange={setMaxSeq} />
                  </div>
                </div>
              </div>

              {/* 训练数据 高级 */}
              <div style={{ marginBottom: 20, border: "1px solid #e0e3ed", borderRadius: 8, overflow: "hidden" }}>
                <button onClick={() => setAdvancedOpen(!advancedOpen)}
                  className="w-full flex items-center justify-between"
                  style={{ padding: "11px 16px", background: "#f8f9fc", border: "none", cursor: "pointer" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>训练数据（高级）</span>
                  {advancedOpen ? <ChevronUp size={15} color="#6b7280" /> : <ChevronDown size={15} color="#6b7280" />}
                </button>
                {advancedOpen && (
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>高级训练数据配置项...</div>
                  </div>
                )}
              </div>

              {/* 训练资源 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel>训练资源</FieldLabel>
                <div className="flex flex-col gap-2">
                  {radioBtn(resourceType === "builtin", "本机内置数据集", () => setResourceType("builtin"))}
                  {radioBtn(resourceType === "custom", "自定义资源", () => setResourceType("custom"))}
                </div>
                {resourceType === "builtin" && (
                  <select style={{ ...selectStyle, maxWidth: 300, marginTop: 10 }}>
                    <option>请选择内置数据集</option>
                    <option>通用对话数据集</option>
                    <option>代码生成数据集</option>
                  </select>
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
              {/* 验证数据集 */}
              <div style={{ marginBottom: 24 }}>
                <FieldLabel>验证数据集</FieldLabel>
                <div className="flex items-center gap-6 mb-3">
                  {radioBtn(validationMode === "none", "无", () => setValidationMode("none"))}
                  {radioBtn(validationMode === "select", "选择数据集", () => setValidationMode("select"))}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.7, marginBottom: 12, maxWidth: 560 }}>
                  模型训练过程中，用于固定网络结构以及调整模型参数的数据集，末上传时取 1% 训练数据作为验证数据。
                </div>
                <div className="flex items-center gap-3" style={{ maxWidth: 400 }}>
                  <select disabled={validationMode === "none"} style={{ ...selectStyle, flex: 1, opacity: validationMode === "none" ? 0.5 : 1 }}>
                    <option>请选择</option>
                    <option>验证集-A</option>
                    <option>验证集-B</option>
                  </select>
                  <button style={{ fontSize: 12, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 500 }}>
                    + 新建数据集
                  </button>
                </div>
              </div>

              {/* 评估指标 */}
              <div style={{ marginBottom: 24 }}>
                <FieldLabel>评估指标（可多选）</FieldLabel>
                <div className="flex items-center gap-4">
                  {["困惑度", "生成流畅度", "逻辑一致性"].map(m => {
                    const checked = evalMetrics.has(m);
                    return (
                      <label key={m} className="flex items-center gap-2" style={{ cursor: "pointer", fontSize: 13, color: "#374151" }}>
                        <span className="flex items-center justify-center rounded flex-shrink-0" style={{
                          width: 16, height: 16, border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`,
                          background: checked ? "#4f6ef7" : "#fff", transition: "all 0.15s",
                        }}>
                          {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                        </span>
                        <input type="checkbox" checked={checked} onChange={() => toggleMetric(m)} style={{ display: "none" }} />
                        {m}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 评估频率 */}
              <div style={{ marginBottom: 24 }}>
                <FieldLabel>评估频率</FieldLabel>
                <div className="relative" style={{ maxWidth: 180 }}>
                  <button
                    onClick={() => setFreqOpen(!freqOpen)}
                    className="w-full flex items-center justify-between"
                    style={{ height: 34, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#1a1d23" }}
                  >
                    {evalFreq}
                    <ChevronDown size={13} color="#6b7280" />
                  </button>
                  {freqOpen && (
                    <div className="absolute w-full rounded-lg shadow-lg z-10 overflow-hidden" style={{ top: "calc(100% + 4px)", border: "1px solid #e0e3ed", background: "#fff" }}>
                      {["5min/次", "10min/次", "15min/次"].map(f => (
                        <button key={f} onClick={() => { setEvalFreq(f); setFreqOpen(false); }}
                          className="w-full flex items-center"
                          style={{
                            padding: "9px 12px", fontSize: 13, border: "none", cursor: "pointer", textAlign: "left",
                            background: evalFreq === f ? "#f0f4ff" : "#fff", color: evalFreq === f ? "#4f6ef7" : "#374151",
                            fontWeight: evalFreq === f ? 500 : 400,
                          }}>
                          {evalFreq === f && <Check size={12} color="#4f6ef7" style={{ marginRight: 6 }} />}
                          {evalFreq !== f && <span style={{ width: 18 }} />}
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
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
                  { label: "任务类型", value: taskType === "finetune" ? "微调训练" : "预调训练" },
                  { label: "任务名称", value: taskName || "（未填写）" },
                  { label: "基础模型", value: trainingModelOptions.find(m => m.id === selectedModel)?.name || "—" },
                  { label: "框架类型", value: framework === "wenxin" ? "文心大文" : "离线方式" },
                  { label: "训练方式", value: trainMode === "normal" ? "常规训练" : "分布式训练" },
                  { label: "Epoch", value: String(epoch) },
                  { label: "Batch size", value: String(batchSize) },
                  { label: "Max sequence length", value: String(maxSeq) },
                  { label: "验证数据集", value: validationMode === "none" ? "无（使用1%训练数据）" : "已选择" },
                  { label: "评估指标", value: [...evalMetrics].join("、") || "—" },
                  { label: "评估频率", value: evalFreq },
                ].map((row, i) => (
                  <div key={row.label} className="flex" style={{ borderBottom: i < 10 ? "1px solid #f0f2f7" : "none" }}>
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
  id: number; name: string; type: string; source: string; count: string;
  status: "已就绪" | "处理中" | "失败"; creator: string; space: string; updatedAt: string;
}

const defaultDatasets: DatasetRow[] = [
  { id: 1, name: "test", type: "SFT", source: "文本生成", count: "100条", status: "已就绪", creator: "djminghua@partner.c...um", space: "建名企业uc001", updatedAt: "2020-03-24 11:03:10" },
];

const datasetStatusCfg: Record<DatasetRow["status"], { bg: string; text: string; dot: string }> = {
  "已就绪": { bg: "#f0faf5", text: "#16a34a", dot: "#22c55e" },
  "处理中": { bg: "#eff6ff", text: "#2563eb", dot: "#3b82f6" },
  "失败":   { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
};

interface CreateDatasetForm {
  name: string; rows: string; type: string; desc: string;
}

function CreateDatasetModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (data: CreateDatasetForm) => void }) {
  const [form, setForm] = useState<CreateDatasetForm>({ name: "", rows: "", type: "SFT", desc: "" });

  const setField = (k: keyof CreateDatasetForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const inputCls: React.CSSProperties = {
    width: "100%", height: 34, padding: "0 10px", fontSize: 13,
    border: "1px solid #e0e3ed", borderRadius: 6, outline: "none",
    color: "#1a1d23", background: "#fff", boxSizing: "border-box",
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
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>数据集行数</div>
            <input
              type="number" value={form.rows} onChange={e => setField("rows", e.target.value)}
              placeholder="请输入行数"
              style={inputCls}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>类型</div>
            <div className="flex items-center gap-2">
              {["SFT", "预训练", "DPO"].map(t => (
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
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>数据集描述</div>
            <input
              value={form.desc} onChange={e => setField("desc", e.target.value)}
              placeholder="请输入数据集描述"
              style={inputCls}
            />
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
      source: "文本生成",
      count: form.rows ? `${form.rows}条` : "0条",
      status: "已就绪",
      creator: "管理员",
      space: "建名企业uc001",
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
                  type="text" placeholder="数...请输入..." value={search}
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
                  {["数据集名称", "类型", "数据集来源", "数据量", "文件状态", "创建人", "所属空间", "更新时间", "操作"].map(col => (
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
                      <td style={{ padding: "12px 14px", color: "#374151" }}>{row.source}</td>
                      <td style={{ padding: "12px 14px", color: "#374151" }}>{row.count}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: sc.bg, fontSize: 12 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block", flexShrink: 0 }} />
                          <span style={{ color: sc.text, fontWeight: 500 }}>{row.status}</span>
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{row.creator}</td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{row.space}</td>
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
  const [tuningTpl, setTuningTpl]       = useState<TplInfo | null>(null);
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
              ? <CreateTrainingTaskPage key={trainingPrefillModelId ?? "manual"} initialModel={trainingPrefillModel} onCancel={() => { setTrainingPrefillModelId(null); setTrainingView("list"); }} />
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
            <ModelExperiencePage initialModel={experiencePrefillModel} />
          ) : activeMenu === "prompt-template" ? (
            <PromptTemplatePage onOpenTuning={(title, version) => { setTuningTpl({ title, version }); handleMenuSelect("prompt-tuning"); }} />
          ) : activeMenu === "prompt-tuning" ? (
            <PromptTuningPage initialTemplate={tuningTpl} />
          ) : (
            <PlaceholderPage label={activeLabel} />
          )}
        </div>
      </main>
    </div>
  );
}
