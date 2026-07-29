import { useEffect, useState } from "react";
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
import { EvaluationConfigPage, ModelComparePage, ModelEvaluationPage } from "./components/ModelEvaluation";
import { EvaluationDataPage } from "./components/EvaluationData";
import { ResourcePermissionPage } from "./components/ResourcePermission";
import { ModelDeploymentPage } from "./components/ModelDeployment";
import { ClusterListPage } from "./components/ClusterList";
import { NodeListPage, ResourceGroupPage } from "./components/NodeResourceGroup";
import { ModelExperiencePage } from "./components/ModelExperience";
import {
  AutoregressiveTrainingPage,
  TrainingAboutPage,
  TrainingAlertCenterPage,
  TrainingDataWorkbenchPage,
  TrainingDocsPage,
  TrainingModelLibraryPage,
  TrainingTaskManagementPage,
} from "./components/AutoregressiveTraining";
import { INITIAL_DEPLOYMENTS, INITIAL_INSTANCES, INITIAL_MODELS } from "./model-management/data";
import type { DeploymentRecord, ModelInstanceRecord, ModelRecord } from "./model-management/types";
import {
  Store, FlaskConical, BrainCircuit, ClipboardCheck, Layers,
  Users, Building2, BarChart3, Server, ChevronDown, ChevronRight,
  ChevronLeft, Cpu, UserCircle, Search, Plus, RefreshCw,
  Check, ChevronUp, Info, CheckCircle2, Circle, Upload, Bell, BookOpen, ListTodo,
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
      { label: "预训练任务", key: "training-task" },
      { label: "训练数据", key: "training-data" },
      { label: "训练模型库", key: "training-model-library" },
      { label: "我的模型", key: "my-model", highlight: true },
    ],
  },
  {
    label: "任务管理", key: "training-operations", icon: <ListTodo size={16} />,
    children: [
      { label: "训练任务", key: "task-management" },
      { label: "告警中心", key: "training-alerts" },
    ],
  },
  {
    label: "模型评测", key: "model-evaluation", icon: <ClipboardCheck size={16} />,
    children: [
      { label: "评测任务", key: "evaluation-task" },
      { label: "评测数据", key: "evaluation-data" },
      { label: "模型对比", key: "evaluation-compare" },
      { label: "配置方案", key: "evaluation-config" },
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
  {
    label: "技术支持", key: "technical-support", icon: <BookOpen size={16} />,
    children: [
      { label: "在线文档", key: "training-docs" },
      { label: "关于平台", key: "training-about" },
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

function CreateTrainingTaskPage({ onCancel, initialModel, models }: { onCancel: () => void; initialModel?: ModelRecord | null; models: ModelRecord[] }) {
  const [currentStep, setCurrentStep] = useState(initialModel ? 2 : 1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set(initialModel ? [1] : []));
  const [submitted, setSubmitted] = useState(false);

  // Step 1 state
  const [taskType, setTaskType] = useState<"cpt" | "sft">("sft");

  // Step 2 state
  const [taskName, setTaskName] = useState("");
  const [modality, setModality] = useState<"文生文" | "图生文" | "文生图">("文生文");
  const [modelTab, setModelTab] = useState<"plaza" | "mymodel">("plaza");
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModel?.id ?? "");
  const [resourceGroup, setResourceGroup] = useState("4090");
  const [outputModelName, setOutputModelName] = useState("");
  const [outputModelVersion, setOutputModelVersion] = useState("");
  const [outputModelDesc, setOutputModelDesc] = useState("");
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([]);

  // Step 3 state
  const [trainMode, setTrainMode] = useState<"normal" | "distributed">("normal");
  const [fineTuneMethod, setFineTuneMethod] = useState<"lora" | "qlora" | "ptuning" | "full">("lora");

  const [epoch, setEpoch] = useState(3);
  const [learningRate, setLearningRate] = useState("2e-5");
  const [batchSize, setBatchSize] = useState(8);
  const [maxSeqLen, setMaxSeqLen] = useState("4096");
  const [resolution, setResolution] = useState("512");

  // LoRA / QLoRA params
  const [loraRank, setLoraRank] = useState(16);
  const [loraAlpha, setLoraAlpha] = useState(32);
  const [loraTargetLayers, setLoraTargetLayers] = useState<string[]>(["q_proj", "v_proj"]);
  const [loraDropout, setLoraDropout] = useState("0.05");
  const [quantPrecision, setQuantPrecision] = useState("4bit");

  // P-Tuning params
  const [prefixLen, setPrefixLen] = useState(16);
  const [prefixDim, setPrefixDim] = useState(64);
  const [ptuningInjectPos, setPtuningInjectPos] = useState<string[]>(["embedding"]);

  // Advanced params
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [optimizer, setOptimizer] = useState("AdamW");
  const [weightDecay, setWeightDecay] = useState("0.01");
  const [gradClip, setGradClip] = useState("1.0");
  const [gradAccumSteps, setGradAccumSteps] = useState(4);
  const [lrSchedule, setLrSchedule] = useState("cosine decay");
  const [textImageLossEnabled, setTextImageLossEnabled] = useState(true);
  const [textImageLossWeight, setTextImageLossWeight] = useState("1.0");
  const [imageReconLossEnabled, setImageReconLossEnabled] = useState(true);
  const [imageReconLossWeight, setImageReconLossWeight] = useState("1.0");
  const [noiseSchedule, setNoiseSchedule] = useState("余弦");
  const [emaDecay, setEmaDecay] = useState("0.9999");
  const [mixedPrecision, setMixedPrecision] = useState("BF16");
  const [gradCheckpoint, setGradCheckpoint] = useState(true);
  const [ckptInterval, setCkptInterval] = useState(500);
  const [ckptMaxKeep, setCkptMaxKeep] = useState(3);
  const [saveOptimizerState, setSaveOptimizerState] = useState(false);
  const [visionEncoderEnabled, setVisionEncoderEnabled] = useState(false);

  // Step 4 state
  const [validationMode, setValidationMode] = useState<"none" | "select">("none");
  const [validationDataset, setValidationDataset] = useState("");
  const [splitRatio, setSplitRatio] = useState("1%");
  const [evalMetrics, setEvalMetrics] = useState<Set<string>>(new Set());
  const [evalFreqValue, setEvalFreqValue] = useState(1);

  const [showDatasetModal, setShowDatasetModal] = useState(false);

  // Filter models by modality
  const filteredModels = models.filter(m => {
    if (modality === "文生文") return m.category === "LLM" && !m.capabilities.includes("vision");
    if (modality === "图生文") return m.category === "LLM" && m.capabilities.includes("vision");
    if (modality === "文生图") return m.category === "Image";
    return false;
  });

  const selectedModel = models.find(m => m.id === selectedModelId) || (initialModel && models.find(m => m.id === initialModel.id));

  const detectPretrainFramework = (model?: ModelRecord): string => {
    if (!model) return "自回归预训练框架";
    if (model.category === "Image") return "文-图生成训练框架";
    const n = model.name;
    if (/DeepSeek-V|Mixtral|Grok/i.test(n)) return "自回归预训练框架";
    if (/T5|BART|Marian|mBART|UL2|Pegasus/i.test(n)) return "序列到序列预训练框架";
    if (/BERT|RoBERTa|ALBERT|DeBERTa/i.test(n)) return "自回归预训练框架";
    return "自回归预训练框架";
  };

  const detectModelArch = (model?: ModelRecord): string => {
    if (!model) return "Decoder-only";
    if (model.category === "Image") return "扩散模型";
    const n = model.name;
    if (/DeepSeek-V|Mixtral|Grok/i.test(n)) return "混合专家（MoE）";
    if (/T5|BART|Marian|mBART|UL2|Pegasus/i.test(n)) return "T5-style（Encoder-Decoder）";
    if (/BERT|RoBERTa|ALBERT|DeBERTa/i.test(n)) return "BERT-style（Encoder-only）";
    return "Decoder-only";
  };

  const getEvalMetrics = (mod: "文生文" | "图生文" | "文生图", tt: "cpt" | "sft"): { label: string; core?: boolean; defaultSelected?: boolean }[] => {
    if (tt === "cpt") {
      if (mod === "文生文") return [
        { label: "训练损失/验证损失", core: true },
        { label: "困惑度" },
        { label: "生成流畅度" },
        { label: "逻辑一致性" },
      ];
      if (mod === "图生文") return [
        { label: "训练损失/验证损失", core: true },
        { label: "生成样例对比", core: true },
        { label: "困惑度" },
      ];
      return [
        { label: "训练损失/验证损失", core: true },
        { label: "生成样例预览", core: true },
      ];
    }
    if (mod === "文生文") return [
      { label: "验证损失", core: true },
      { label: "准确率", core: true, defaultSelected: true },
      { label: "召回率", core: true, defaultSelected: true },
      { label: "精确率", core: true, defaultSelected: true },
      { label: "F1", core: true, defaultSelected: true },
      { label: "BLEU" },
      { label: "ROUGE" },
      { label: "困惑度" },
      { label: "生成流畅度" },
      { label: "逻辑一致性" },
    ];
    if (mod === "图生文") return [
      { label: "验证损失", core: true },
      { label: "准确率", core: true },
      { label: "召回率", core: true },
      { label: "BLEU/ROUGE", core: true },
      { label: "生成样例对比", core: true },
      { label: "困惑度" },
    ];
    return [
      { label: "验证损失", core: true },
      { label: "生成样例预览", core: true },
    ];
  };

  const mockDatasetChoices: { id: number; name: string; type: "CPT" | "SFT" | "RL" | "Eval"; modality: "-" | "文本" | "图文对"; count: string }[] = [
    { id: 1, name: "科技情报语料库", type: "CPT", modality: "文本", count: "500万行" },
    { id: 2, name: "医学图文数据集", type: "SFT", modality: "图文对", count: "10万行" },
    { id: 3, name: "jsonl_demo", type: "SFT", modality: "文本", count: "1200行" },
    { id: 4, name: "通用文本语料", type: "CPT", modality: "文本", count: "200万行" },
    { id: 5, name: "图文对话数据", type: "SFT", modality: "图文对", count: "5万行" },
  ];

  const availableDatasets = mockDatasetChoices.filter(d => {
    if (taskType === "cpt" && d.type !== "CPT") return false;
    if (taskType === "sft" && d.type !== "SFT") return false;
    const needImage = modality === "图生文" || modality === "文生图";
    if (needImage && d.modality !== "图文对") return false;
    if (!needImage && d.modality !== "文本") return false;
    return true;
  });

  const selectedDatasets = mockDatasetChoices.filter(d => selectedDatasetIds.includes(d.id));

  // Reset defaults when taskType/modality/fineTuneMethod changes
  useEffect(() => {
    if (modality === "文生图") {
      setEpoch(100);
      setLearningRate(taskType === "cpt" ? "1e-4" : (fineTuneMethod === "lora" ? "1e-4" : "1e-5"));
      setBatchSize(2);
      setResolution("512");
      setMixedPrecision("FP16");
      if (fineTuneMethod === "lora") {
        setLoraRank(32);
        setLoraAlpha(32);
        setLoraTargetLayers(["Cross-Attention"]);
        setLoraDropout("0.0");
      }
    } else {
      setEpoch(3);
      if (taskType === "sft") {
        if (fineTuneMethod === "lora" || fineTuneMethod === "qlora") setLearningRate("2e-4");
        else if (fineTuneMethod === "ptuning") setLearningRate("1e-3");
        else setLearningRate("2e-5");
      } else {
        setLearningRate("2e-5");
      }
      setBatchSize(modality === "文生文" ? 8 : 4);
      setMaxSeqLen("4096");
      setMixedPrecision("BF16");
      if (fineTuneMethod === "lora" || fineTuneMethod === "qlora") {
        setLoraRank(16);
        setLoraAlpha(32);
        setLoraTargetLayers(["q_proj", "v_proj"]);
        setLoraDropout("0.05");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskType, modality, fineTuneMethod]);

  // Reset eval metrics when taskType/modality changes
  useEffect(() => {
    const metrics = getEvalMetrics(modality, taskType);
    const next = new Set<string>();
    metrics.forEach(m => {
      if (m.core || m.defaultSelected) next.add(m.label);
    });
    setEvalMetrics(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskType, modality]);

  // Reset fineTuneMethod when modality changes (文生图 only supports lora/full)
  useEffect(() => {
    if (modality === "文生图" && (fineTuneMethod === "qlora" || fineTuneMethod === "ptuning")) {
      setFineTuneMethod("lora");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modality]);

  const toggleMetric = (m: string, core?: boolean) => {
    if (core) return;
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

  const toggleSwitch = (checked: boolean, onChange: (v: boolean) => void) => (
    <span onClick={() => onChange(!checked)} style={{
      width: 32, height: 18, borderRadius: 9, background: checked ? "#4f6ef7" : "#d1d5db",
      cursor: "pointer", position: "relative", transition: "background 0.2s", display: "inline-block", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 2, left: checked ? 16 : 2, width: 14, height: 14, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </span>
  );

  const multiCheckbox = (options: string[], selected: string[], onChange: (v: string[]) => void) => (
    <div className="flex flex-wrap items-center gap-3">
      {options.map(opt => {
        const checked = selected.includes(opt);
        return (
          <label key={opt} className="flex items-center gap-1.5" style={{ cursor: "pointer", fontSize: 13, color: "#374151" }}>
            <span className="flex items-center justify-center rounded flex-shrink-0" style={{
              width: 16, height: 16, border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`,
              background: checked ? "#4f6ef7" : "#fff", transition: "all 0.15s",
            }}>
              {checked && <Check size={10} color="#fff" strokeWidth={3} />}
            </span>
            <input type="checkbox" checked={checked} onChange={() => {
              onChange(checked ? selected.filter(x => x !== opt) : [...selected, opt]);
            }} style={{ display: "none" }} />
            {opt}
          </label>
        );
      })}
    </div>
  );

  const readonlyInput: React.CSSProperties = { ...inputStyle, background: "#f5f7fa", color: "#6b7280", cursor: "default" };

  const advancedSection = (
    <div style={{ marginBottom: 20, border: "1px solid #e0e3ed", borderRadius: 8, overflow: "hidden" }}>
      <button onClick={() => setAdvancedOpen(!advancedOpen)}
        className="w-full flex items-center justify-between"
        style={{ padding: "11px 16px", background: "#f8f9fc", border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>训练超参-高级</span>
        {advancedOpen ? <ChevronUp size={15} color="#6b7280" /> : <ChevronDown size={15} color="#6b7280" />}
      </button>
      {advancedOpen && (
        <div style={{ padding: 16 }}>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 700 }}>
            <div>
              <FieldLabel>优化器</FieldLabel>
              <select value={optimizer} onChange={e => setOptimizer(e.target.value)} style={{ ...selectStyle, maxWidth: 200 }}>
                {["AdamW", "Adam", "SGD", "Adafactor"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>权重衰减</FieldLabel>
              <input value={weightDecay} onChange={e => setWeightDecay(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
            </div>
            <div>
              <FieldLabel>梯度裁剪</FieldLabel>
              <input value={gradClip} onChange={e => setGradClip(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
            </div>
            <div>
              <FieldLabel>梯度累计步数</FieldLabel>
              <NumInput value={gradAccumSteps} onChange={setGradAccumSteps} />
            </div>
            <div>
              <FieldLabel>学习率调度策略</FieldLabel>
              <select value={lrSchedule} onChange={e => setLrSchedule(e.target.value)} style={{ ...selectStyle, maxWidth: 200 }}>
                {["warmup", "cosine decay", "polynomial decay"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            {(modality === "图生文" || modality === "文生图") && (
              <div>
                <FieldLabel>文本-图像对比损失</FieldLabel>
                <div className="flex items-center gap-3">
                  {toggleSwitch(textImageLossEnabled, setTextImageLossEnabled)}
                  <input value={textImageLossWeight} onChange={e => setTextImageLossWeight(e.target.value)} disabled={!textImageLossEnabled} style={{ ...inputStyle, maxWidth: 100, opacity: textImageLossEnabled ? 1 : 0.5 }} />
                </div>
              </div>
            )}
            {modality === "文生图" && (
              <>
                <div>
                  <FieldLabel>图像重建损失</FieldLabel>
                  <div className="flex items-center gap-3">
                    {toggleSwitch(imageReconLossEnabled, setImageReconLossEnabled)}
                    <input value={imageReconLossWeight} onChange={e => setImageReconLossWeight(e.target.value)} disabled={!imageReconLossEnabled} style={{ ...inputStyle, maxWidth: 100, opacity: imageReconLossEnabled ? 1 : 0.5 }} />
                  </div>
                </div>
                <div>
                  <FieldLabel>噪声调度策略</FieldLabel>
                  <select value={noiseSchedule} onChange={e => setNoiseSchedule(e.target.value)} style={{ ...selectStyle, maxWidth: 200 }}>
                    {["线性", "余弦", "平方根"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>EMA衰减率</FieldLabel>
                  <input value={emaDecay} onChange={e => setEmaDecay(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
                </div>
              </>
            )}
            <div>
              <FieldLabel>混合精度训练</FieldLabel>
              <select value={mixedPrecision} onChange={e => setMixedPrecision(e.target.value)} style={{ ...selectStyle, maxWidth: 200 }}>
                {["BF16", "FP16", "关闭"].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>梯度检查点</FieldLabel>
              <div className="flex items-center" style={{ height: 34 }}>
                {toggleSwitch(gradCheckpoint, setGradCheckpoint)}
              </div>
            </div>
            <div>
              <FieldLabel>Checkpoint保存间隔</FieldLabel>
              <NumInput value={ckptInterval} onChange={setCkptInterval} />
            </div>
            <div>
              <FieldLabel>Checkpoint最大保留数</FieldLabel>
              <NumInput value={ckptMaxKeep} onChange={setCkptMaxKeep} />
            </div>
            <div>
              <FieldLabel>是否保存优化器状态</FieldLabel>
              <div className="flex items-center" style={{ height: 34 }}>
                {toggleSwitch(saveOptimizerState, setSaveOptimizerState)}
              </div>
            </div>
            {taskType === "sft" && modality === "图生文" && (
              <div>
                <FieldLabel>视觉编码器（仅图-文模型）</FieldLabel>
                <div className="flex items-center" style={{ height: 34 }}>
                  {toggleSwitch(visionEncoderEnabled, setVisionEncoderEnabled)}
                  <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{visionEncoderEnabled ? "解冻" : "冻结"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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
              <div className="grid grid-cols-3 gap-4" style={{ maxWidth: 800 }}>
                {/* 继续预训练 CPT */}
                <div onClick={() => setTaskType("cpt")} style={{
                  border: `2px solid ${taskType === "cpt" ? "#4f6ef7" : "#e0e3ed"}`,
                  borderRadius: 10, padding: 16, cursor: "pointer",
                  background: taskType === "cpt" ? "#f5f8ff" : "#fff", transition: "all 0.15s",
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: taskType === "cpt" ? "#4f6ef7" : "#f0f2f7" }}>
                      <BrainCircuit size={14} color={taskType === "cpt" ? "#fff" : "#9ca3af"} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>继续预训练</span>
                    {taskType === "cpt" && (
                      <span className="ml-auto flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: "#4f6ef7" }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                    在已有基础模型上进行继续预训练，注入领域知识，适合扩充模型在特定领域的能力。
                  </div>
                </div>

                {/* 监督微调 SFT */}
                <div onClick={() => setTaskType("sft")} style={{
                  border: `2px solid ${taskType === "sft" ? "#4f6ef7" : "#e0e3ed"}`,
                  borderRadius: 10, padding: 16, cursor: "pointer",
                  background: taskType === "sft" ? "#f5f8ff" : "#fff", transition: "all 0.15s",
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: taskType === "sft" ? "#4f6ef7" : "#f0f2f7" }}>
                      <Layers size={14} color={taskType === "sft" ? "#fff" : "#9ca3af"} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>监督微调</span>
                    {taskType === "sft" && (
                      <span className="ml-auto flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: "#4f6ef7" }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                    使用标注数据对模型进行监督微调，专注于特定任务，成本低，收敛快，推荐使用。
                  </div>
                </div>

                {/* 强化学习 - disabled */}
                <div style={{
                  border: "2px solid #e0e3ed", borderRadius: 10, padding: 16,
                  cursor: "not-allowed", opacity: 0.5, background: "#fff",
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: "#f0f2f7" }}>
                      <Server size={14} color="#9ca3af" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>强化学习</span>
                    <span className="ml-auto" style={{ fontSize: 11, color: "#9ca3af", background: "#f0f2f7", padding: "2px 8px", borderRadius: 4 }}>暂未开放</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>
                    通过强化学习优化模型输出，提升模型质量与对齐能力。
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
              <div style={{ marginBottom: 20, maxWidth: 400 }}>
                <FieldLabel required>任务名称</FieldLabel>
                <div className="flex items-center gap-2">
                  <input value={taskName} onChange={e => setTaskName(e.target.value.slice(0, 10))} placeholder="请输入任务名称" maxLength={10} style={inputStyle} />
                  <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>{taskName.length} / 10</span>
                </div>
              </div>

              {/* 生成模态 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel>生成模态</FieldLabel>
                <div className="flex items-center gap-6">
                  {radioBtn(modality === "文生文", "文生文", () => setModality("文生文"))}
                  {radioBtn(modality === "图生文", "图生文", () => setModality("图生文"))}
                  {radioBtn(modality === "文生图", "文生图", () => setModality("文生图"))}
                </div>
              </div>

              {/* 基础模型 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel required>基础模型</FieldLabel>
                <div className="flex items-center gap-2 mb-3">
                  {(["plaza", "mymodel"] as const).map(tab => (
                    <button key={tab} onClick={() => setModelTab(tab)}
                      style={{
                        fontSize: 13, fontWeight: 500, padding: "6px 16px", borderRadius: 6,
                        border: `1px solid ${modelTab === tab ? "#4f6ef7" : "#e0e3ed"}`,
                        background: modelTab === tab ? "#eff4ff" : "#fff",
                        color: modelTab === tab ? "#4f6ef7" : "#6b7280",
                        cursor: "pointer", transition: "all 0.15s",
                      }}>
                      {tab === "plaza" ? "模型库" : "我的模型"}
                    </button>
                  ))}
                </div>
                {filteredModels.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#9ca3af", padding: "20px 0" }}>该模态下暂无可用模型</div>
                ) : (
                  <div className="grid grid-cols-3 gap-3" style={{ maxWidth: 800 }}>
                    {filteredModels.map(m => (
                      <div key={m.id} onClick={() => setSelectedModelId(m.id)}
                        style={{
                          border: `2px solid ${selectedModelId === m.id ? "#4f6ef7" : "#e0e3ed"}`,
                          borderRadius: 8, padding: 12, cursor: "pointer",
                          background: selectedModelId === m.id ? "#f5f8ff" : "#fff",
                          transition: "all 0.15s", position: "relative",
                        }}>
                        {modelTab === "mymodel" && (
                          <span className="absolute top-2 right-2" style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: "#4f6ef7", borderRadius: 4, padding: "1px 6px" }}>v1.0</span>
                        )}
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 4, paddingRight: modelTab === "mymodel" ? 30 : 0 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>参数量: {m.paramSize}B</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>模型类型: {m.category}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>更新时间: {m.createdAt}</div>
                        {selectedModelId === m.id && (
                          <span className="absolute bottom-2 right-2 flex items-center justify-center rounded-full" style={{ width: 16, height: 16, background: "#4f6ef7" }}>
                            <Check size={10} color="#fff" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {selectedModel && (
                  <div className="flex items-center gap-3 rounded-lg mt-3" style={{ padding: "10px 14px", background: "#f0f4ff", border: "1px solid #d0dcff", maxWidth: 800 }}>
                    <Check size={14} color="#4f6ef7" />
                    <span style={{ fontSize: 13, color: "#4f6ef7", fontWeight: 500 }}>{selectedModel.name}</span>
                    <span style={{ fontSize: 12, color: "#6b7280", marginLeft: "auto" }}>已选择基础模型</span>
                  </div>
                )}
              </div>

              {/* 资源组 */}
              <div style={{ marginBottom: 20, maxWidth: 200 }}>
                <FieldLabel>资源组</FieldLabel>
                <select value={resourceGroup} onChange={e => setResourceGroup(e.target.value)} style={selectStyle}>
                  <option value="4090">4090</option>
                  <option value="aa">aa</option>
                </select>
              </div>

              {/* 模型输出 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>模型输出</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <FieldLabel required>新模型名称</FieldLabel>
                    <input value={outputModelName} onChange={e => setOutputModelName(e.target.value)} placeholder="请输入新模型名称" style={inputStyle} />
                  </div>
                  <div>
                    <FieldLabel required>版本号</FieldLabel>
                    <input value={outputModelVersion} onChange={e => setOutputModelVersion(e.target.value)} placeholder="如 v1.0" style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <FieldLabel>新模型描述</FieldLabel>
                    <textarea value={outputModelDesc} onChange={e => setOutputModelDesc(e.target.value)} placeholder="请输入新模型描述（选填）" style={{ ...inputStyle, height: 70, paddingTop: 8, resize: "vertical" }} />
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

              {taskType === "cpt" ? (
                <>
                  {/* 预训练框架 (readonly) */}
                  <div style={{ marginBottom: 20, maxWidth: 400 }}>
                    <FieldLabel>预训练框架</FieldLabel>
                    <input value={detectPretrainFramework(selectedModel)} readOnly style={readonlyInput} />
                  </div>

                  {/* 模型架构 (readonly) */}
                  <div style={{ marginBottom: 20, maxWidth: 400 }}>
                    <FieldLabel>模型架构</FieldLabel>
                    <input value={detectModelArch(selectedModel)} readOnly style={readonlyInput} />
                  </div>

                  {/* 训练基础参数 */}
                  <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 16 }}>训练基础参数</div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 600 }}>
                      <div>
                        <FieldLabel>Epoch</FieldLabel>
                        <NumInput value={epoch} onChange={setEpoch} />
                      </div>
                      <div>
                        <FieldLabel>学习率</FieldLabel>
                        <input value={learningRate} onChange={e => setLearningRate(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
                      </div>
                      <div>
                        <FieldLabel>Batch size</FieldLabel>
                        <NumInput value={batchSize} onChange={setBatchSize} />
                      </div>
                      {modality !== "文生图" ? (
                        <div>
                          <FieldLabel>最大序列长度</FieldLabel>
                          <select value={maxSeqLen} onChange={e => setMaxSeqLen(e.target.value)} style={{ ...selectStyle, maxWidth: 200 }}>
                            {["1024", "2048", "4096", "8192", "16384", "32768"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <FieldLabel>训练分辨率</FieldLabel>
                          <select value={resolution} onChange={e => setResolution(e.target.value)} style={{ ...selectStyle, maxWidth: 200 }}>
                            {["512", "768"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 高级参数 */}
                  {advancedSection}
                </>
              ) : (
                <>
                  {/* 微调方法 */}
                  <div style={{ marginBottom: 20 }}>
                    <FieldLabel>微调方法</FieldLabel>
                    <div className="flex items-center gap-4 flex-wrap">
                      {modality !== "文生图" ? (
                        <>
                          {radioBtn(fineTuneMethod === "lora", "LoRA", () => setFineTuneMethod("lora"))}
                          {radioBtn(fineTuneMethod === "qlora", "QLoRA", () => setFineTuneMethod("qlora"))}
                          {radioBtn(fineTuneMethod === "ptuning", "P-Tuning", () => setFineTuneMethod("ptuning"))}
                          {radioBtn(fineTuneMethod === "full", "全量微调", () => setFineTuneMethod("full"))}
                        </>
                      ) : (
                        <>
                          {radioBtn(fineTuneMethod === "lora", "LoRA", () => setFineTuneMethod("lora"))}
                          {radioBtn(fineTuneMethod === "full", "全量微调", () => setFineTuneMethod("full"))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* 微调专属参数 */}
                  {(fineTuneMethod === "lora" || fineTuneMethod === "qlora") && (
                    <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 16 }}>微调专属参数{fineTuneMethod === "qlora" ? "（QLoRA）" : "（LoRA）"}</div>
                      {fineTuneMethod === "qlora" && (
                        <div style={{ marginBottom: 12, maxWidth: 200 }}>
                          <FieldLabel>量化精度</FieldLabel>
                          <select value={quantPrecision} onChange={e => setQuantPrecision(e.target.value)} style={selectStyle}>
                            <option value="4bit">4bit</option>
                            <option value="8bit">8bit</option>
                          </select>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 700 }}>
                        <div>
                          <FieldLabel>LoRA秩 Rank</FieldLabel>
                          <NumInput value={loraRank} onChange={setLoraRank} />
                        </div>
                        <div>
                          <FieldLabel>LoRA Alpha</FieldLabel>
                          <NumInput value={loraAlpha} onChange={setLoraAlpha} />
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <FieldLabel>目标注入层</FieldLabel>
                          {modality !== "文生图"
                            ? multiCheckbox(["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"], loraTargetLayers, setLoraTargetLayers)
                            : multiCheckbox(["Cross-Attention", "Self-Attention", "FFN"], loraTargetLayers, setLoraTargetLayers)}
                        </div>
                        <div>
                          <FieldLabel>LoRA Dropout</FieldLabel>
                          <input value={loraDropout} onChange={e => setLoraDropout(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {fineTuneMethod === "ptuning" && (
                    <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 16 }}>微调专属参数（P-Tuning）</div>
                      <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 700 }}>
                        <div>
                          <FieldLabel>前缀长度</FieldLabel>
                          <NumInput value={prefixLen} onChange={setPrefixLen} />
                        </div>
                        <div>
                          <FieldLabel>前缀维度</FieldLabel>
                          <NumInput value={prefixDim} onChange={setPrefixDim} />
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <FieldLabel>注入位置</FieldLabel>
                          {multiCheckbox(["embedding", "layer"], ptuningInjectPos, setPtuningInjectPos)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 训练基础参数 */}
                  <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 16 }}>训练基础参数</div>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 600 }}>
                      <div>
                        <FieldLabel>Epoch</FieldLabel>
                        <NumInput value={epoch} onChange={setEpoch} />
                      </div>
                      <div>
                        <FieldLabel>学习率</FieldLabel>
                        <input value={learningRate} onChange={e => setLearningRate(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
                      </div>
                      <div>
                        <FieldLabel>Batch size</FieldLabel>
                        <NumInput value={batchSize} onChange={setBatchSize} />
                      </div>
                      {modality !== "文生图" ? (
                        <div>
                          <FieldLabel>最大序列长度</FieldLabel>
                          <select value={maxSeqLen} onChange={e => setMaxSeqLen(e.target.value)} style={{ ...selectStyle, maxWidth: 200 }}>
                            {["1024", "2048", "4096", "8192", "16384", "32768"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <FieldLabel>Resolution</FieldLabel>
                          <select value={resolution} onChange={e => setResolution(e.target.value)} style={{ ...selectStyle, maxWidth: 200 }}>
                            {["512", "768", "1024"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 高级参数 */}
                  {advancedSection}

                  {/* 训练数据 */}
                  <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23" }}>训练数据</div>
                      <button onClick={() => setShowDatasetModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer" }}>
                        <Plus size={13} /> 选择数据集
                      </button>
                    </div>
                    {selectedDatasets.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#9ca3af", padding: "12px 0" }}>暂未选择数据集</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {selectedDatasets.map(d => (
                          <div key={d.id} className="flex items-center justify-between rounded-lg" style={{ padding: "8px 12px", background: "#fff", border: "1px solid #e8ebf2" }}>
                            <div className="flex items-center gap-3">
                              <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1d23" }}>{d.name}</span>
                              <span style={{ fontSize: 11, color: "#9ca3af" }}>{d.type} · {d.modality} · {d.count}</span>
                            </div>
                            <button onClick={() => setSelectedDatasetIds(prev => prev.filter(id => id !== d.id))} style={{ fontSize: 12.5, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>删除</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

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
                {validationMode === "select" && (
                  <div className="flex items-center gap-3" style={{ maxWidth: 500 }}>
                    <select value={validationDataset} onChange={e => setValidationDataset(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                      <option value="">请选择</option>
                      <option value="验证集-A">验证集-A</option>
                      <option value="验证集-B">验证集-B</option>
                    </select>
                    <select value={splitRatio} onChange={e => setSplitRatio(e.target.value)} style={{ ...selectStyle, width: 120, flexShrink: 0 }}>
                      {["1%", "5%", "10%"].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* 评估指标 */}
              <div style={{ marginBottom: 24 }}>
                <FieldLabel>评估指标（可多选）</FieldLabel>
                <div className="flex flex-wrap items-center gap-4">
                  {getEvalMetrics(modality, taskType).map(m => {
                    const checked = evalMetrics.has(m.label);
                    return (
                      <label key={m.label} className="flex items-center gap-2" style={{ cursor: m.core ? "not-allowed" : "pointer", fontSize: 13, color: m.core ? "#9ca3af" : "#374151" }}>
                        <span className="flex items-center justify-center rounded flex-shrink-0" style={{
                          width: 16, height: 16, border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`,
                          background: checked ? "#4f6ef7" : "#fff", transition: "all 0.15s",
                        }}>
                          {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                        </span>
                        <input type="checkbox" checked={checked} onChange={() => toggleMetric(m.label, m.core)} disabled={m.core} style={{ display: "none" }} />
                        {m.label}
                        {m.core && <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 2 }}>(核心)</span>}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 评估频率 */}
              <div style={{ marginBottom: 24 }}>
                <FieldLabel>评估频率</FieldLabel>
                <div className="flex items-center gap-2">
                  <NumInput value={evalFreqValue} onChange={setEvalFreqValue} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{modality === "文生图" ? "步" : "epoch"}</span>
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
              <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #e8ebf2", maxWidth: 700 }}>
                {[
                  { label: "任务类型", value: taskType === "cpt" ? "继续预训练" : "监督微调" },
                  { label: "任务名称", value: taskName || "（未填写）" },
                  { label: "生成模态", value: modality },
                  { label: "基础模型", value: selectedModel?.name || "—" },
                  { label: "资源组", value: resourceGroup },
                  { label: "新模型名称", value: outputModelName || "—" },
                  { label: "版本号", value: outputModelVersion || "—" },
                  { label: "训练方式", value: trainMode === "normal" ? "常规训练" : "分布式训练" },
                  ...(taskType === "cpt" ? [
                    { label: "预训练框架", value: detectPretrainFramework(selectedModel) },
                    { label: "模型架构", value: detectModelArch(selectedModel) },
                  ] : [
                    { label: "微调方法", value: { lora: "LoRA", qlora: "QLoRA", ptuning: "P-Tuning", full: "全量微调" }[fineTuneMethod] },
                  ]),
                  { label: "学习率", value: learningRate },
                  { label: "Epoch", value: String(epoch) },
                  { label: "Batch size", value: String(batchSize) },
                  ...(modality !== "文生图" ? [{ label: "最大序列长度", value: maxSeqLen }] : [{ label: "分辨率", value: resolution }]),
                  { label: "验证数据集", value: validationMode === "none" ? "无" : (validationDataset || "已选择") },
                  { label: "评估指标", value: [...evalMetrics].join("、") || "—" },
                  { label: "评估频率", value: `${evalFreqValue} ${modality === "文生图" ? "步" : "epoch"}` },
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

      {/* Dataset selection modal */}
      {showDatasetModal && (
        <>
          <div onClick={() => setShowDatasetModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 480, background: "#fff", zIndex: 101, borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            display: "flex", flexDirection: "column", maxHeight: "80vh",
          }}>
            <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f2f7" }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23" }}>选择数据集</span>
              <button onClick={() => setShowDatasetModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 2, lineHeight: 1 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto" style={{ padding: "12px 20px" }}>
              {availableDatasets.length === 0 ? (
                <div style={{ fontSize: 13, color: "#9ca3af", padding: "20px 0", textAlign: "center" }}>暂无匹配的数据集</div>
              ) : availableDatasets.map(d => {
                const isSelected = selectedDatasetIds.includes(d.id);
                return (
                  <div key={d.id} onClick={() => setSelectedDatasetIds(prev => isSelected ? prev.filter(id => id !== d.id) : [...prev, d.id])}
                    className="flex items-center justify-between rounded-lg" style={{ padding: "10px 12px", marginBottom: 8, cursor: "pointer", border: `1px solid ${isSelected ? "#4f6ef7" : "#e8ebf2"}`, background: isSelected ? "#f5f8ff" : "#fff" }}>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1d23" }}>{d.name}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{d.type} · {d.modality} · {d.count}</span>
                    </div>
                    {isSelected && <Check size={14} color="#4f6ef7" />}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "14px 20px", borderTop: "1px solid #f0f2f7" }}>
              <button onClick={() => setShowDatasetModal(false)} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "7px 20px", cursor: "pointer" }}>确定</button>
            </div>
          </div>
        </>
      )}

      {/* Bottom action bar */}
      {currentStep < 5 && (
        <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "12px 24px", background: "#fff", borderTop: "1px solid #e8ebf2", gap: 10 }}>
          <button onClick={onCancel} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}>
            取消
          </button>
          {currentStep > 1 && (
            <button onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}>
              上一步
            </button>
          )}
          <button onClick={goNext} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "8px 24px", cursor: "pointer" }}>
            下一步
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
  id: number; name: string; type: "CPT" | "SFT" | "RL" | "Eval"; modality: "-" | "文本" | "图文对"; count: string;
  status: "已校验" | "校验失败" | "待校验"; creator: string; space: string; updatedAt: string;
}

const defaultDatasets: DatasetRow[] = [
  { id: 1, name: "科技情报语料库", type: "CPT", modality: "文本", count: "500万行", status: "校验失败", creator: "张小明", space: "建名企业uc001", updatedAt: "2026-07-10 16:45:24" },
  { id: 2, name: "医学图文数据集", type: "SFT", modality: "图文对", count: "10万行", status: "校验失败", creator: "张小明", space: "建名企业uc001", updatedAt: "2026-07-09 14:20:10" },
  { id: 3, name: "jsonl_demo", type: "SFT", modality: "文本", count: "1200行", status: "已校验", creator: "张小明", space: "建名企业uc001", updatedAt: "2026-07-08 10:30:00" },
  { id: 4, name: "dpo_6_15", type: "RL", modality: "文本", count: "800行", status: "已校验", creator: "张小明", space: "建名企业uc001", updatedAt: "2026-06-15 09:15:30" },
  { id: 5, name: "eval_test_set", type: "Eval", modality: "文本", count: "300行", status: "待校验", creator: "张小明", space: "建名企业uc001", updatedAt: "2026-07-11 11:00:00" },
];

const datasetStatusCfg: Record<DatasetRow["status"], { bg: string; text: string; dot: string }> = {
  "已校验": { bg: "#f0faf5", text: "#16a34a", dot: "#22c55e" },
  "校验失败": { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
  "待校验": { bg: "#eff6ff", text: "#2563eb", dot: "#3b82f6" },
};

interface CreateDatasetForm {
  name: string; desc: string; type: "CPT" | "SFT" | "RL" | "Eval";
}

function CreateDatasetModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (data: CreateDatasetForm) => void }) {
  const [form, setForm] = useState<CreateDatasetForm>({ name: "", desc: "", type: "SFT" });
  const [fileName, setFileName] = useState("");

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
          {/* 数据集名称 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>数据集名称
            </div>
            <input
              value={form.name} onChange={e => setField("name", e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
              placeholder="请输入数据集名称(只支持英文和数字)"
              style={inputCls}
            />
          </div>

          {/* 数据集简介 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>数据集简介</div>
            <input
              value={form.desc} onChange={e => setField("desc", e.target.value.slice(0, 50))}
              placeholder="请输入数据集简介（选填）"
              maxLength={50}
              style={inputCls}
            />
          </div>

          {/* 类型 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>类型</div>
            <div className="flex items-center gap-2 flex-wrap">
              {(["CPT", "SFT", "RL", "Eval"] as const).map(t => (
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

          {/* 上传数据集 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>上传数据集</div>
            <label
              className="flex flex-col items-center justify-center"
              style={{
                border: "2px dashed #d1d5db", borderRadius: 8, padding: "24px 12px",
                cursor: "pointer", background: "#fafbfd", transition: "border-color 0.15s",
              }}
            >
              <Upload size={24} color="#9ca3af" />
              <span style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>点击上传或拖放文件</span>
              <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>支持 JSONL/TXT/zip，单文件最大 20GB</span>
              <input
                type="file" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) setFileName(f.name); }}
              />
            </label>
            {fileName && (
              <div className="flex items-center gap-2 mt-2" style={{ fontSize: 12, color: "#4f6ef7" }}>
                <Check size={12} /> {fileName}
              </div>
            )}
          </div>

          {/* 模态 (readonly) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>模态</div>
            <input value="-" readOnly style={{ ...inputCls, background: "#f5f7fa", color: "#9ca3af", cursor: "default" }} />
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>由系统根据上传的数据集自动判定校验模态类型</div>
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
      modality: "-",
      count: "0行",
      status: "待校验",
      creator: "张小明",
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
                  type="text" placeholder="请输入数据集名称搜索" value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ fontSize: 13, border: "none", outline: "none", width: 180, background: "transparent" }}
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
                  {["数据集名称", "类型", "模态", "数据量", "文件状态", "创建人", "所属空间", "更新时间", "操作"].map(col => (
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
    <aside className="maas-sidebar flex flex-col h-full flex-shrink-0" style={{ width: 220, background: "#181c2e", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
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
  const legacyView = new URLSearchParams(window.location.search).get("legacy");

  useEffect(() => {
    const requestedPage = new URLSearchParams(window.location.search).get("page");
    if (requestedPage) setActiveMenu(requestedPage);
  }, []);

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
      <style>{`@media (max-width: 760px) { .maas-sidebar { display: none !important; } }`}</style>
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
          <div className="flex items-center gap-3">
            {!legacyView && <button type="button" aria-label="打开训练告警" onClick={() => handleMenuSelect("training-alerts")} style={{ position: "relative", width: 32, height: 32, display: "grid", placeItems: "center", border: "1px solid #e4e8ef", borderRadius: 8, background: "#fff", color: "#667085", cursor: "pointer" }}>
              <Bell size={16} />
              <span style={{ position: "absolute", right: 5, top: 5, width: 7, height: 7, borderRadius: 99, background: "#ef4444", boxShadow: "0 0 0 2px #fff" }} />
            </button>}
            <span style={{ color: "#98a2b3", fontSize: 12 }}>MaaS 3.6</span>
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
            legacyView === "list"
              ? <TrainingTaskList onCreate={() => undefined} onEvalReport={setEvalTaskName} />
              : legacyView === "create"
                ? <CreateTrainingTaskPage models={models} onCancel={() => undefined} />
                : legacyView === "report"
                  ? <EvaluationReportPage taskName={evalTaskName || "电商客服大模型预训练"} onBack={() => undefined} />
                  : trainingPrefillModel
              ? <CreateTrainingTaskPage key={trainingPrefillModelId ?? "manual"} models={models} initialModel={trainingPrefillModel} onCancel={() => { setTrainingPrefillModelId(null); setTrainingView("list"); }} />
              : <AutoregressiveTrainingPage />
          ) : activeMenu === "training-data" ? (
            legacyView ? <TrainingDataPage /> : <TrainingDataWorkbenchPage />
          ) : activeMenu === "training-model-library" ? (
            <TrainingModelLibraryPage />
          ) : activeMenu === "model-list" ? (
            <ModelManagementPage models={models} onModelsChange={setModels} onDeploy={model => {
              setDeployPrefillModelId(model.id);
              handleMenuSelect("model-deploy");
            }} />
          ) : activeMenu === "task-management" ? (
            <TrainingTaskManagementPage />
          ) : activeMenu === "training-alerts" ? (
            <TrainingAlertCenterPage />
          ) : activeMenu === "training-docs" ? (
            <TrainingDocsPage />
          ) : activeMenu === "training-about" ? (
            <TrainingAboutPage />
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
          ) : activeMenu === "evaluation-compare" ? (
            <ModelComparePage />
          ) : activeMenu === "evaluation-config" ? (
            <EvaluationConfigPage />
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
