import { useEffect, useState } from "react";
import { ModelPlazaPage } from "./components/ModelPlaza";
import { ModelManagementPage } from "./components/ModelManagement";
import { DeployInstancePage } from "./components/DeployInstance";
import { InferenceServicePage } from "./components/InferenceService";
import { UserAccountPage } from "./components/UserAccount";
import { UserRolePage } from "./components/UserRole";
import { TeamManagementPage } from "./components/TeamManagement";
import { MyModelsPage } from "./components/MyModels";
import { AuditEventsPage } from "./components/AuditEvents";
import { ModelRoutingPage } from "./components/ModelRouting";
import { EvaluationConfigPage, ModelComparePage, ModelEvaluationPage } from "./components/ModelEvaluation";
import { EvaluationDataPage } from "./components/EvaluationData";
import { ModelDeploymentPage } from "./components/ModelDeployment";
import { ClusterListPage } from "./components/ClusterList";
import { NodeListPage, ResourceGroupPage } from "./components/NodeResourceGroup";
import { ModelExperiencePage } from "./components/ModelExperience";
import {
  AdminUsageStatsPage,
  ApiKeyManagementPage,
  DocumentationCenterPage,
  ResourceRoleConfigPage,
  ResourceRoleQueuePage,
  SampleRepositoryPage,
  TaskLogPage,
} from "./components/SuperAdminPages";
import {
  TrainingAboutPage,
  TrainingDocsPage,
} from "./components/AutoregressiveTraining";
import { INITIAL_DEPLOYMENTS, INITIAL_INSTANCES, INITIAL_MODELS } from "./model-management/data";
import type { DeploymentRecord, ModelInstanceRecord, ModelRecord } from "./model-management/types";
import {
  Store, FlaskConical, BrainCircuit, ClipboardCheck, Layers,
  Users, BarChart3, Server, ChevronDown, ChevronRight,
  ChevronLeft, Cpu, UserCircle, Search, Plus, RefreshCw,
  Check, ChevronUp, Info, CheckCircle2, Circle, Upload, BookOpen, RotateCcw, FileText, ShieldCheck,
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
      { label: "角色权限", key: "user-role" },
      { label: "团队管理", key: "team-management" },
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
    label: "权限与调度", key: "permission-scheduling", icon: <ShieldCheck size={16} />,
    children: [
      { label: "角色配置", key: "resource-role-config" },
      { label: "角色队列", key: "resource-role-queue" },
    ],
  },
  {
    label: "统计监控", key: "stats-monitor", icon: <BarChart3 size={16} />,
    children: [
      { label: "API Key", key: "api-key-monitoring" },
      { label: "用量统计", key: "usage-stats" },
      { label: "任务日志", key: "log-mining" },
      { label: "操作审计事件", key: "audit-events" },
    ],
  },
  {
    label: "文档中心", key: "documentation-center", icon: <BookOpen size={16} />,
    children: [
      { label: "在线文档", key: "docs-center" },
      { label: "示例代码库", key: "sample-repository" },
    ],
  },
  {
    label: "技术支持", key: "technical-support", icon: <BookOpen size={16} />,
    children: [
      { label: "训练手册", key: "training-docs" },
      { label: "关于平台", key: "training-about" },
    ],
  },
];

// ─── Training Task List ───────────────────────────────────────────────────────

type TrainingStatus = "已完成" | "训练中" | "已失败" | "已停止" | "";

interface TrainingRow {
  id: number; name: string; outputModel: string; type: "继续预训练" | "监督微调";
  status: TrainingStatus; taskId: string; baseModel: string; creator: string; actions: string[];
  resources: string; submitTime: string; duration: string;
  outputModelDeleted?: boolean;
}

const trainingRows: TrainingRow[] = [
  { id: 1, name: "07061449", outputModel: "我的模型11", type: "继续预训练", status: "已完成", taskId: "12345234543", baseModel: "GLM-4-9B", creator: "张小明", resources: "8 × A100", submitTime: "2026-07-10 16:45:24", duration: "2小时15分", actions: ["删除任务", "查看报告", "评估报告"] },
  { id: 2, name: "公文写作模型", outputModel: "公文写作-v1", type: "监督微调", status: "训练中", taskId: "76840646", baseModel: "GLM-4-9B", creator: "张小明", resources: "4 × A100", submitTime: "2026-07-12 09:20:10", duration: "1小时32分", actions: ["删除任务", "查看报告", "停止任务"] },
  { id: 3, name: "天气变化预报", outputModel: "天气预报模型", type: "监督微调", status: "已完成", taskId: "34536448457", baseModel: "ChatGLM3-6B", creator: "张小明", resources: "2 × A100", submitTime: "2026-07-08 14:30:00", duration: "45分", actions: ["删除任务", "查看报告", "评估报告"] },
  { id: 4, name: "天文资料搜索", outputModel: "天文搜索模型", type: "继续预训练", status: "已失败", taskId: "346903543", baseModel: "GLM-4-9B", creator: "张小明", resources: "8 × A100", submitTime: "2026-07-11 10:15:33", duration: "12分", actions: ["删除任务", "查看报告", "重新训练"] },
  { id: 5, name: "公文写作模型", outputModel: "公文写作-v2", type: "监督微调", status: "已完成", taskId: "3461458868", baseModel: "GLM-4-9B", creator: "张小明", resources: "4 × A100", submitTime: "2026-07-09 18:00:00", duration: "3小时02分", actions: ["删除任务", "查看报告", "评估报告"], outputModelDeleted: true },
  { id: 6, name: "天气变化预报", outputModel: "天气预报模型", type: "监督微调", status: "训练中", taskId: "34634875987", baseModel: "ChatGLM3-6B", creator: "张小明", resources: "2 × A100", submitTime: "2026-07-12 11:45:00", duration: "22分", actions: ["删除任务", "查看报告", "停止任务"] },
  { id: 7, name: "天文资料搜索", outputModel: "天文搜索模型", type: "继续预训练", status: "已完成", taskId: "32750657145", baseModel: "GLM-4-9B", creator: "张小明", resources: "8 × A100", submitTime: "2026-07-06 08:20:00", duration: "5小时18分", actions: ["删除任务", "查看报告", "评估报告"] },
  { id: 8, name: "公文写作模型", outputModel: "公文写作-v3", type: "监督微调", status: "已停止", taskId: "096764453", baseModel: "GLM-4-9B", creator: "张小明", resources: "4 × A100", submitTime: "2026-07-05 16:00:00", duration: "8分", actions: ["删除任务", "查看报告", "重新训练"] },
  { id: 9, name: "天气变化预报", outputModel: "天气预报模型", type: "监督微调", status: "已完成", taskId: "406678753", baseModel: "ChatGLM3-6B", creator: "张小明", resources: "2 × A100", submitTime: "2026-07-07 13:10:00", duration: "1小时05分", actions: ["删除任务", "查看报告", "评估报告"] },
];

const statusCfg: Record<TrainingStatus, { bg: string; text: string; dot: string }> = {
  "已完成": { bg: "#f0faf5", text: "#16a34a", dot: "#22c55e" },
  "训练中": { bg: "#eff6ff", text: "#2563eb", dot: "#3b82f6" },
  "已失败": { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
  "已停止": { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
  "":       { bg: "transparent", text: "#9ca3af", dot: "transparent" },
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

function TrainingTaskList({ onCreate, onEvalReport, onJumpToMyModel }: { onCreate: () => void; onEvalReport: (name: string) => void; onJumpToMyModel: (outputModel: string, deleted: boolean) => void }) {
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
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>模型训练</span>
      </div>
      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{
              fontSize: 13, color: typeFilter ? "#1a1d23" : "#9ca3af", padding: "5px 10px",
              border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", outline: "none", height: 32,
            }}>
              <option value="">任务类型</option>
              <option value="继续预训练">继续预训练</option>
              <option value="监督微调">监督微调</option>
            </select>
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", padding: "0 10px", height: 32 }}>
              <input type="text" placeholder="请输入任务名搜索" value={search} onChange={e => setSearch(e.target.value)}
                style={{ fontSize: 13, border: "none", outline: "none", width: 160, background: "transparent" }} />
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer" }}>
              <Search size={13} /> 查询
            </button>
            <button onClick={() => { setSearch(""); setTypeFilter(""); }} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#4f6ef7", background: "#fff", border: "1px solid #4f6ef7", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer" }}>
              <RotateCcw size={13} /> 重置
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
                {["任务名称", "输出模型名称", "任务类型", "任务状态", "任务ID", "基础模型", "创建人", "占用资源", "提交时间", "运行时长", "操作"].map(col => (
                  <th key={col} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: "#6b7280", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trainingRows.map(row => {
                const jumpable = row.status === "已完成" && !!row.outputModel;
                return (
                <tr key={row.id} style={{ borderBottom: "1px solid #f5f7fa" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "11px 14px", color: "#1a1d23", fontWeight: 500 }}>{row.name}</td>
                  <td style={{ padding: "11px 14px" }}>
                    {jumpable ? (
                      <span style={{ color: "#4f6ef7", cursor: "pointer", fontWeight: 500 }}
                        onClick={() => onJumpToMyModel(row.outputModel, !!row.outputModelDeleted)}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>{row.outputModel}</span>
                    ) : (
                      <span style={{ color: "#374151" }}>{row.outputModel}</span>
                    )}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 12, padding: "2px 8px", background: "#eff4ff", color: "#4f6ef7", fontWeight: 500, borderRadius: 4 }}>{row.type}</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}><StatusBadge status={row.status} /></td>
                  <td style={{ padding: "11px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{row.taskId}</td>
                  <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12 }}>{row.baseModel}</td>
                  <td style={{ padding: "11px 14px", color: "#374151" }}>{row.creator}</td>
                  <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12 }}>{row.resources}</td>
                  <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>{row.submitTime}</td>
                  <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>{row.duration}</td>
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
                );
              })}
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
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  // Step 1: task type
  const [taskType, setTaskType] = useState<"cpt" | "sft">("sft");

  // Step 2: basic info
  const [taskName, setTaskName] = useState("");
  const [modality, setModality] = useState<"文生文" | "图生文" | "文生图">("文生文");
  const [modelTab, setModelTab] = useState<"plaza" | "mymodel">("plaza");
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModel?.id ?? "");

  // Step 3: model output
  const [resourceGroup, setResourceGroup] = useState("4090");
  const [outputModelName, setOutputModelName] = useState("");
  const [outputModelDesc, setOutputModelDesc] = useState("");
  const [outputModelVersion, setOutputModelVersion] = useState("v1.0");

  // Step 4: training params
  const [trainMethod, setTrainMethod] = useState<"full" | "lora" | "freeze">("lora");
  const [batchSize, setBatchSize] = useState(8);
  const [learningRate, setLearningRate] = useState("2e-5");
  const [maxSeqLen, setMaxSeqLen] = useState(4096);
  const [epoch, setEpoch] = useState(3);

  // Advanced params
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

  // Datasets & eval
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([]);
  const [evalMetrics, setEvalMetrics] = useState<Set<string>>(new Set());

  // Filter models by modality (preserved business logic)
  const filteredModels = models.filter(m => {
    if (modality === "文生文") return m.category === "LLM" && !m.capabilities.includes("vision");
    if (modality === "图生文") return m.category === "LLM" && m.capabilities.includes("vision");
    if (modality === "文生图") return m.category === "Image";
    return false;
  });

  const selectedModel: ModelRecord | null =
    models.find(m => m.id === selectedModelId)
    ?? (initialModel && initialModel.id === selectedModelId ? initialModel : null)
    ?? null;

  const detectPretrainFramework = (model?: ModelRecord | null): string => {
    if (!model) return "自回归预训练框架";
    if (model.category === "Image") return "文-图生成训练框架";
    const n = model.name;
    if (/T5|BART|Marian|mBART|UL2|Pegasus/i.test(n)) return "序列到序列预训练框架";
    return "自回归预训练框架";
  };

  const detectModelArch = (model?: ModelRecord | null): string => {
    if (!model) return "Decoder-only";
    if (model.category === "Image") return "扩散模型";
    const n = model.name;
    if (/DeepSeek-V|Mixtral|Grok/i.test(n)) return "混合专家（MoE）";
    if (/T5|BART|Marian|mBART|UL2|Pegasus/i.test(n)) return "T5-style";
    if (/BERT|RoBERTa|ALBERT|DeBERTa/i.test(n)) return "BERT-style";
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

  // Default-select first dataset when the available list changes
  useEffect(() => {
    if (availableDatasets.length > 0) {
      setSelectedDatasetIds([availableDatasets[0].id]);
    } else {
      setSelectedDatasetIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskType, modality]);

  const changeModality = (m: "文生文" | "图生文" | "文生图") => {
    if (m !== modality) {
      setModality(m);
      setSelectedModelId("");
    }
  };

  const toggleMetric = (m: string, core?: boolean) => {
    if (core) return;
    setEvalMetrics(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  };

  const goNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setCurrentStep(prev => prev + 1);
  };

  const goPrev = () => setCurrentStep(prev => Math.max(1, prev - 1));

  const handleSubmit = () => {
    setCompletedSteps(prev => new Set([...prev, 4]));
    setSubmitted(true);
  };

  // "我的模型" mock data
  const myMockModels: ModelRecord[] = [
    { id: "my-qwen-7b", name: "my_qwen2_5_v11", developer: "自研", iconData: "", paramSize: "7", category: "LLM", capabilities: [], weightPath: "", imagePath: "", description: "自研文生文微调模型", createdAt: "2026-07-01" },
    { id: "my-vlm-13b", name: "my_vlm_demo", developer: "自研", iconData: "", paramSize: "13", category: "LLM", capabilities: ["vision"], weightPath: "", imagePath: "", description: "视觉语言模型", createdAt: "2026-07-10" },
    { id: "my-sdxl-6b", name: "my_sdxl", developer: "自研", iconData: "", paramSize: "6", category: "Image", capabilities: [], weightPath: "", imagePath: "", description: "文生图模型", createdAt: "2026-07-15" },
  ];

  const modelList = modelTab === "plaza" ? filteredModels : myMockModels.filter(m => {
    if (modality === "文生文") return m.category === "LLM" && !m.capabilities.includes("vision");
    if (modality === "图生文") return m.category === "LLM" && m.capabilities.includes("vision");
    if (modality === "文生图") return m.category === "Image";
    return false;
  });

  const currentMetrics = getEvalMetrics(modality, taskType);
  const coreMetrics = currentMetrics.filter(m => m.core);
  const optionalMetrics = currentMetrics.filter(m => !m.core);

  if (submitted) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: "#f5f7fa" }}>
        <div className="flex flex-col items-center rounded-2xl" style={{ background: "#fff", border: "1px solid #e8ebf2", padding: "56px 80px" }}>
          <div className="rounded-full flex items-center justify-center" style={{ width: 64, height: 64, background: "#f0faf5", marginBottom: 20 }}>
            <CheckCircle2 size={36} color="#16a34a" />
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

  const steps = [
    { id: 1, title: "选择任务类型" },
    { id: 2, title: "基本信息" },
    { id: 3, title: "模型输出" },
    { id: 4, title: "训练参数" },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 34, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed",
    borderRadius: 6, outline: "none", color: "#1a1d23", background: "#fff",
  };
  const selectStyle: React.CSSProperties = {
    height: 34, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed",
    borderRadius: 6, outline: "none", color: "#1a1d23", background: "#fff", width: "100%",
  };
  const readonlyInput: React.CSSProperties = { ...inputStyle, background: "#f5f7fa", color: "#6b7280", cursor: "default" };

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

  const stepCircle = (step: { id: number; title: string }) => {
    const done = completedSteps.has(step.id) && currentStep !== step.id;
    const active = currentStep === step.id;
    return (
      <div className="flex items-center" key={step.id}>
        <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{
          width: 28, height: 28,
          background: (done || active) ? "#4f6ef7" : "#fff",
          border: `2px solid ${done || active ? "#4f6ef7" : "#e0e3ed"}`,
          transition: "all 0.2s",
        }}>
          {done
            ? <Check size={14} color="#fff" strokeWidth={3} />
            : <span style={{ fontSize: 13, fontWeight: 600, color: active ? "#fff" : "#9ca3af" }}>{step.id}</span>}
        </div>
        <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#1a1d23" : done ? "#374151" : "#9ca3af", marginLeft: 8, whiteSpace: "nowrap" }}>
          {step.title}
        </span>
      </div>
    );
  };

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
          </div>
        </div>
      )}
    </div>
  );

  const canNext =
    currentStep === 1 ? true
    : currentStep === 2 ? (!!taskName.trim() && !!selectedModelId)
    : currentStep === 3 ? !!outputModelName.trim()
    : true;

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

      {/* Step navigation */}
      <div className="flex items-center flex-shrink-0" style={{ padding: "16px 24px 0" }}>
        <div className="flex items-center rounded-xl" style={{ background: "#fff", border: "1px solid #e8ebf2", padding: "14px 24px" }}>
          {steps.map((s, i) => (
            <div className="flex items-center" key={s.id}>
              {stepCircle(s)}
              {i < steps.length - 1 && (
                <div style={{ width: 50, height: 2, background: completedSteps.has(s.id) ? "#4f6ef7" : "#e0e3ed", margin: "0 16px", transition: "background 0.2s" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-auto" style={{ padding: "16px 24px" }}>
        <div className="rounded-xl" style={{ background: "#fff", border: "1px solid #e8ebf2", padding: 24, maxWidth: 1000 }}>

          {/* ── STEP 1: 选择任务类型 ── */}
          {currentStep === 1 && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23", marginBottom: 6 }}>选择任务类型</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 18 }}>请选择本次训练的任务类型</div>
              <div className="grid grid-cols-3 gap-4" style={{ maxWidth: 820 }}>
                {/* 继续预训练 CPT */}
                <div onClick={() => setTaskType("cpt")} style={{
                  border: `2px solid ${taskType === "cpt" ? "#4f6ef7" : "#e0e3ed"}`,
                  borderRadius: 10, padding: 18, cursor: "pointer",
                  background: taskType === "cpt" ? "#f5f8ff" : "#fff",
                  transition: "all 0.15s", position: "relative",
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30, background: taskType === "cpt" ? "#4f6ef7" : "#f0f2f7" }}>
                      <BrainCircuit size={15} color={taskType === "cpt" ? "#fff" : "#9ca3af"} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>继续预训练（CPT）</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>使用大量无标注文本继续训练基础模型</div>
                  {taskType === "cpt" && (
                    <span className="absolute flex items-center justify-center rounded-full" style={{ bottom: 8, right: 8, width: 18, height: 18, background: "#4f6ef7" }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </span>
                  )}
                </div>

                {/* 监督微调 SFT */}
                <div onClick={() => setTaskType("sft")} style={{
                  border: `2px solid ${taskType === "sft" ? "#4f6ef7" : "#e0e3ed"}`,
                  borderRadius: 10, padding: 18, cursor: "pointer",
                  background: taskType === "sft" ? "#f5f8ff" : "#fff",
                  transition: "all 0.15s", position: "relative",
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30, background: taskType === "sft" ? "#4f6ef7" : "#f0f2f7" }}>
                      <Layers size={15} color={taskType === "sft" ? "#fff" : "#9ca3af"} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>监督微调（SFT）</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>使用标注数据微调模型以适应特定任务</div>
                  {taskType === "sft" && (
                    <span className="absolute flex items-center justify-center rounded-full" style={{ bottom: 8, right: 8, width: 18, height: 18, background: "#4f6ef7" }}>
                      <Check size={11} color="#fff" strokeWidth={3} />
                    </span>
                  )}
                </div>

                {/* 强化学习 RL - disabled */}
                <div title="敬请期待" style={{
                  border: "2px solid #e0e3ed", borderRadius: 10, padding: 18,
                  cursor: "not-allowed", opacity: 0.55, background: "#fff", position: "relative",
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30, background: "#f0f2f7" }}>
                      <Server size={15} color="#9ca3af" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>强化学习（RL）</span>
                    <span className="ml-auto" style={{ fontSize: 11, color: "#9ca3af", background: "#f0f2f7", padding: "2px 8px", borderRadius: 4 }}>敬请期待</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>通过人类反馈强化学习优化模型</div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: 基本信息 ── */}
          {currentStep === 2 && (
            <div>
              {/* 任务名称 */}
              <div style={{ marginBottom: 20, maxWidth: 420 }}>
                <FieldLabel required>任务名称</FieldLabel>
                <div className="flex items-center gap-2">
                  <input value={taskName} onChange={e => setTaskName(e.target.value.slice(0, 30))} placeholder="请输入任务名称" maxLength={30} style={inputStyle} />
                  <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>{taskName.length} / 30</span>
                </div>
              </div>

              {/* 生成模态 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel required>生成模态</FieldLabel>
                <div className="flex items-center gap-3">
                  {(["文生文", "图生文", "文生图"] as const).map(mo => {
                    const checked = modality === mo;
                    return (
                      <button key={mo} onClick={() => changeModality(mo)} style={{
                        fontSize: 13, fontWeight: 500, padding: "6px 18px", borderRadius: 6,
                        border: `1px solid ${checked ? "#4f6ef7" : "#e0e3ed"}`,
                        background: checked ? "#4f6ef7" : "#fff",
                        color: checked ? "#fff" : "#6b7280",
                        cursor: "pointer", transition: "all 0.15s",
                      }}>{mo}</button>
                    );
                  })}
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
                {modelList.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#9ca3af", padding: "20px 0" }}>该模态下暂无可用模型</div>
                ) : (
                  <div className="grid grid-cols-3 gap-3" style={{ maxWidth: 820 }}>
                    {modelList.map(m => {
                      const checked = selectedModelId === m.id;
                      return (
                        <div key={m.id} onClick={() => setSelectedModelId(m.id)}
                          style={{
                            border: `2px solid ${checked ? "#4f6ef7" : "#e0e3ed"}`,
                            borderRadius: 8, padding: 12, cursor: "pointer",
                            background: checked ? "#f5f8ff" : "#fff",
                            transition: "all 0.15s", position: "relative",
                          }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 6 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>参数量: {m.paramSize}B</div>
                          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>类型: {m.category}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>更新: {m.createdAt}</div>
                          {checked && (
                            <span className="absolute flex items-center justify-center rounded-full" style={{ bottom: 8, right: 8, width: 16, height: 16, background: "#4f6ef7" }}>
                              <Check size={10} color="#fff" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedModel && (
                  <div className="flex items-center gap-2 rounded-lg mt-3" style={{ padding: "8px 14px", background: "#f0f4ff", border: "1px solid #d0dcff", maxWidth: 820 }}>
                    <Check size={14} color="#4f6ef7" />
                    <span style={{ fontSize: 13, color: "#4f6ef7", fontWeight: 500 }}>{selectedModel.name}</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>| {selectedModel.category}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: 模型输出 ── */}
          {currentStep === 3 && (
            <div>
              {/* 已选基础模型标签 */}
              {selectedModel && (
                <div className="flex items-center gap-2 rounded-lg" style={{ padding: "8px 14px", background: "#f0f4ff", border: "1px solid #d0dcff", maxWidth: 500, marginBottom: 20 }}>
                  <Check size={14} color="#4f6ef7" />
                  <span style={{ fontSize: 13, color: "#4f6ef7", fontWeight: 500 }}>{selectedModel.name}</span>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>| {selectedModel.category}</span>
                </div>
              )}

              {/* 资源组 */}
              <div style={{ marginBottom: 20 }}>
                <FieldLabel required>资源组</FieldLabel>
                <div className="flex items-center gap-3">
                  {["4090", "A100", "H800"].map(rg => {
                    const checked = resourceGroup === rg;
                    return (
                      <button key={rg} onClick={() => setResourceGroup(rg)} style={{
                        fontSize: 13, fontWeight: 500, padding: "6px 18px", borderRadius: 6,
                        border: `1px solid ${checked ? "#4f6ef7" : "#e0e3ed"}`,
                        background: checked ? "#4f6ef7" : "#fff",
                        color: checked ? "#fff" : "#6b7280",
                        cursor: "pointer", transition: "all 0.15s",
                      }}>{rg}</button>
                    );
                  })}
                </div>
              </div>

              {/* 新模型名称 */}
              <div style={{ marginBottom: 20, maxWidth: 420 }}>
                <FieldLabel required>新模型名称</FieldLabel>
                <div className="flex items-center gap-2">
                  <input value={outputModelName} onChange={e => setOutputModelName(e.target.value.slice(0, 50))} placeholder="请输入新模型名称" maxLength={50} style={inputStyle} />
                  <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>{outputModelName.length} / 50</span>
                </div>
              </div>

              {/* 新模型描述 */}
              <div style={{ marginBottom: 20, maxWidth: 600 }}>
                <FieldLabel>新模型描述</FieldLabel>
                <div className="flex items-start gap-2">
                  <textarea value={outputModelDesc} onChange={e => setOutputModelDesc(e.target.value.slice(0, 100))} placeholder="请输入新模型描述（选填）" maxLength={100} style={{ ...inputStyle, height: 70, paddingTop: 8, resize: "vertical" }} />
                  <span style={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap", marginTop: 8 }}>{outputModelDesc.length} / 100</span>
                </div>
              </div>

              {/* 版本号 */}
              <div style={{ marginBottom: 20, maxWidth: 240 }}>
                <FieldLabel>版本号</FieldLabel>
                <input value={outputModelVersion} onChange={e => setOutputModelVersion(e.target.value)} placeholder="如 v1.0" style={inputStyle} />
              </div>
            </div>
          )}

          {/* ── STEP 4: 训练参数 ── */}
          {currentStep === 4 && (
            <div>
              {/* 训练参数区块 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 14 }}>训练参数</div>

                {/* 训练方式 */}
                <div style={{ marginBottom: 16 }}>
                  <FieldLabel>训练方式</FieldLabel>
                  {taskType === "cpt" ? (
                    <input value="全量" readOnly style={{ ...readonlyInput, maxWidth: 200 }} />
                  ) : (
                    <div className="flex items-center gap-3">
                      {(["full", "lora", "freeze"] as const).map(tm => {
                        const checked = trainMethod === tm;
                        const label = tm === "full" ? "全量" : tm === "lora" ? "LoRA" : "Freeze";
                        return (
                          <button key={tm} onClick={() => setTrainMethod(tm)} style={{
                            fontSize: 13, fontWeight: 500, padding: "6px 18px", borderRadius: 6,
                            border: `1px solid ${checked ? "#4f6ef7" : "#e0e3ed"}`,
                            background: checked ? "#4f6ef7" : "#fff",
                            color: checked ? "#fff" : "#6b7280",
                            cursor: "pointer", transition: "all 0.15s",
                          }}>{label}</button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 预训练框架 */}
                <div style={{ marginBottom: 16, maxWidth: 400 }}>
                  <FieldLabel>预训练框架</FieldLabel>
                  <select value={detectPretrainFramework(selectedModel)} style={selectStyle}>
                    {["自回归预训练框架", "序列到序列预训练框架", "文-图生成训练框架"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {/* 模型架构 */}
                <div style={{ marginBottom: 16, maxWidth: 400 }}>
                  <FieldLabel>模型架构</FieldLabel>
                  <select value={detectModelArch(selectedModel)} style={selectStyle}>
                    {["Decoder-only", "T5-style", "BERT-style", "混合专家（MoE）", "扩散模型"].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {/* 基础数值参数 */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-4" style={{ maxWidth: 600 }}>
                  <div>
                    <FieldLabel>Batch size</FieldLabel>
                    <NumInput value={batchSize} onChange={setBatchSize} />
                  </div>
                  <div>
                    <FieldLabel>Learning rate</FieldLabel>
                    <input value={learningRate} onChange={e => setLearningRate(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
                  </div>
                  <div>
                    <FieldLabel>Max sequence length</FieldLabel>
                    <NumInput value={maxSeqLen} onChange={setMaxSeqLen} />
                  </div>
                  <div>
                    <FieldLabel>Epoch</FieldLabel>
                    <NumInput value={epoch} onChange={setEpoch} />
                  </div>
                </div>
              </div>

              {/* 训练超参-高级 */}
              {advancedSection}

              {/* 数据集区块 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>数据集</div>
                {availableDatasets.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#9ca3af", padding: "12px 0" }}>暂无匹配的数据集</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {availableDatasets.map(d => {
                      const checked = selectedDatasetIds.includes(d.id);
                      return (
                        <label key={d.id} className="flex items-center justify-between rounded-lg" style={{ padding: "10px 12px", background: "#fff", border: `1px solid ${checked ? "#4f6ef7" : "#e8ebf7"}`, cursor: "pointer" }}>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center rounded flex-shrink-0" style={{
                              width: 16, height: 16, border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`,
                              background: checked ? "#4f6ef7" : "#fff", transition: "all 0.15s",
                            }}>
                              {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1d23" }}>{d.name}</span>
                            <span style={{ fontSize: 11, color: "#6b7280", background: "#eef0f7", padding: "1px 8px", borderRadius: 4 }}>{d.type}</span>
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>{d.modality}</span>
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>{d.count}</span>
                          </div>
                          <input type="checkbox" checked={checked} onChange={() => setSelectedDatasetIds(prev => checked ? prev.filter(id => id !== d.id) : [...prev, d.id])} style={{ display: "none" }} />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 评估配置区块 */}
              <div style={{ marginBottom: 20, padding: 16, background: "#f8f9fc", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>评估配置</div>
                {/* 核心指标 */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>核心指标（必选）</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {coreMetrics.map(m => (
                      <span key={m.label} className="flex items-center gap-1 rounded" style={{ fontSize: 12, color: "#4f6ef7", background: "#eff4ff", border: "1px solid #d0dcff", padding: "4px 10px" }}>
                        <Check size={11} color="#4f6ef7" strokeWidth={3} />
                        {m.label}
                      </span>
                    ))}
                  </div>
                </div>
                {/* 可选指标 */}
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>可选指标</div>
                  <div className="flex flex-wrap items-center gap-4">
                    {optionalMetrics.map(m => {
                      const checked = evalMetrics.has(m.label);
                      return (
                        <label key={m.label} className="flex items-center gap-1.5" style={{ cursor: "pointer", fontSize: 13, color: "#374151" }}>
                          <span className="flex items-center justify-center rounded flex-shrink-0" style={{
                            width: 16, height: 16, border: `2px solid ${checked ? "#4f6ef7" : "#d1d5db"}`,
                            background: checked ? "#4f6ef7" : "#fff", transition: "all 0.15s",
                          }}>
                            {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                          </span>
                          <input type="checkbox" checked={checked} onChange={() => toggleMetric(m.label, m.core)} style={{ display: "none" }} />
                          {m.label}
                        </label>
                      );
                    })}
                    {optionalMetrics.length === 0 && (
                      <span style={{ fontSize: 13, color: "#9ca3af" }}>无可选指标</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "12px 24px", background: "#fff", borderTop: "1px solid #e8ebf2" }}>
        <div>
          {currentStep > 1 && (
            <button onClick={goPrev} style={{ fontSize: 13, fontWeight: 500, color: "#4f6ef7", background: "#fff", border: "1px solid #4f6ef7", borderRadius: 6, padding: "8px 20px", cursor: "pointer" }}>
              上一步
            </button>
          )}
        </div>
        <div>
          {currentStep < 4 ? (
            <button onClick={goNext} disabled={!canNext} style={{
              fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "8px 24px",
              cursor: canNext ? "pointer" : "not-allowed", opacity: canNext ? 1 : 0.5,
            }}>
              下一步
            </button>
          ) : (
            <button onClick={handleSubmit} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#16a34a", border: "none", borderRadius: 6, padding: "8px 24px", cursor: "pointer" }}>
              确认创建
            </button>
          )}
        </div>
      </div>
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

type Visibility = "仅自己" | "团队成员可见" | "团队成员可编辑" | "全平台可见";

interface DatasetRow {
  id: number; name: string; type: "CPT" | "SFT" | "RL" | "Eval"; modality: "-" | "文本" | "图文对"; count: string;
  status: "已校验" | "校验失败" | "待校验"; creator: string; team: string; updatedAt: string;
  visibility: Visibility;
  scope: "public" | "mine" | "platform";
  desc?: string;
  failDetail?: { errorType: string; summary: string; details: string; logid: string; timestamp: string };
}

const defaultDatasets: DatasetRow[] = [
  { id: 1, name: "科技情报语料库", type: "CPT", modality: "文本", count: "500万行", status: "校验失败", creator: "张小明", team: "智谱1", updatedAt: "2026-07-10 16:45:24", visibility: "全平台可见", scope: "public", failDetail: { errorType: "images_missed", summary: "训练数据集校验未通过，请检查数据格式与内容", details: "errorMessage: images_missed at rows [1, 2, 3, 4, 5]", logid: "3107607c-a2e8-4d77-881d-beee42e40f80", timestamp: "2026-07-10T16:45:24.846730" } },
  { id: 2, name: "医学图文数据集", type: "SFT", modality: "图文对", count: "10万行", status: "校验失败", creator: "张小明", team: "智谱1", updatedAt: "2026-07-09 14:20:10", visibility: "仅自己", scope: "mine", failDetail: { errorType: "format_invalid", summary: "训练数据集校验未通过，请检查数据格式与内容", details: "errorMessage: instruction field is empty at rows [12, 34]", logid: "5b2c9f10-d73a-4e1c-b6f8-2a1e09c44d71", timestamp: "2026-07-09T14:20:10.502118" } },
  { id: 3, name: "jsonl_demo", type: "SFT", modality: "文本", count: "1200行", status: "已校验", creator: "张小明", team: "智谱1", updatedAt: "2026-07-08 10:30:00", visibility: "仅自己", scope: "mine" },
  { id: 4, name: "dpo_6_15", type: "RL", modality: "文本", count: "800行", status: "已校验", creator: "张小明", team: "智谱1", updatedAt: "2026-06-15 09:15:30", visibility: "团队成员可见", scope: "mine" },
  { id: 5, name: "eval_test_set", type: "Eval", modality: "文本", count: "300行", status: "待校验", creator: "张小明", team: "智谱1", updatedAt: "2026-07-11 11:00:00", visibility: "仅自己", scope: "mine" },
  { id: 6, name: "公开问答数据集", type: "SFT", modality: "文本", count: "200万行", status: "已校验", creator: "系统", team: "系统", updatedAt: "2026-06-01 08:00:00", visibility: "全平台可见", scope: "public" },
  { id: 7, name: "通用语料库", type: "CPT", modality: "文本", count: "1000万行", status: "已校验", creator: "系统", team: "系统", updatedAt: "2026-05-20 10:00:00", visibility: "全平台可见", scope: "public" },
  { id: 8, name: "企业2-客服数据", type: "SFT", modality: "图文对", count: "5万行", status: "已校验", creator: "李娜", team: "企业2", updatedAt: "2026-07-05 14:00:00", visibility: "团队成员可编辑", scope: "platform" },
  { id: 9, name: "机构3-金融数据", type: "CPT", modality: "文本", count: "300万行", status: "已校验", creator: "王芳", team: "机构3", updatedAt: "2026-07-03 09:30:00", visibility: "团队成员可见", scope: "platform" },
  { id: 10, name: "企业4-法律数据", type: "SFT", modality: "文本", count: "2万行", status: "待校验", creator: "刘强", team: "企业4", updatedAt: "2026-07-12 16:00:00", visibility: "仅自己", scope: "platform" },
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

const visCfg: Record<Visibility, { bg: string; text: string }> = {
  "仅自己":       { bg: "#f3f4f6", text: "#6b7280" },
  "团队成员可见":   { bg: "#eff4ff", text: "#4f6ef7" },
  "团队成员可编辑": { bg: "#f5f3ff", text: "#7c3aed" },
  "全平台可见":     { bg: "#f0faf5", text: "#16a34a" },
};

function TrainingDataPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [datasets, setDatasets] = useState<DatasetRow[]>(defaultDatasets);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [goPage, setGoPage] = useState("");
  const [failDetailId, setFailDetailId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"public" | "mine" | "platform">("public");
  const [teamFilter, setTeamFilter] = useState("");
  const [permEditId, setPermEditId] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const filtered = datasets.filter(d => {
    if (d.scope !== activeTab) return false;
    if (search && !d.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (activeTab === "platform" && teamFilter && d.team !== teamFilter) return false;
    return true;
  });

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
      team: "智谱1",
      updatedAt: dateStr,
      visibility: activeTab === "public" ? "全平台可见" : "仅自己",
      scope: activeTab === "public" ? "public" : "mine",
    }]);
  };

  const handleDelete = (id: number) => {
    setDatasets(prev => prev.filter(d => d.id !== id));
  };

  const handleEdit = (id: number, form: CreateDatasetForm) => {
    setDatasets(prev => prev.map(d => d.id === id ? { ...d, name: form.name, desc: form.desc, type: form.type } : d));
    setEditId(null);
  };


  const handlePermUpdate = (id: number, vis: Visibility) => {
    setDatasets(prev => prev.map(d => d.id === id ? { ...d, visibility: vis } : d));
    setPermEditId(null);
  };

  const tabLabels: { key: "public" | "mine" | "platform"; label: string; uploadLabel: string }[] = [
    { key: "public", label: "公开数据集", uploadLabel: "上传公开数据集" },
    { key: "mine", label: "我的数据集", uploadLabel: "上传我的数据集" },
    { key: "platform", label: "平台用户数据集", uploadLabel: "" },
  ];
  const currentTab = tabLabels.find(t => t.key === activeTab)!;
  const cols = activeTab === "platform"
    ? ["数据集名称", "类型", "模态", "数据量", "文件状态", "所属团队", "创建人", "权限状态", "更新时间", "操作"]
    : ["数据集名称", "类型", "模态", "数据量", "文件状态", "所属团队", "创建人", "权限状态", "更新时间", "操作"];

  return (
    <>
      <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
          <span style={{ color: "#4f6ef7" }}>模型训练</span>
          <ChevronRight size={13} />
          <span style={{ color: "#1a1d23", fontWeight: 500 }}>训练数据</span>
        </div>

        {/* Card */}
        <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
          {/* Tabs */}
          <div className="flex items-center flex-shrink-0" style={{ borderBottom: "1px solid #f0f2f7" }}>
            {tabLabels.map(tab => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); setTeamFilter(""); }}
                style={{
                  padding: "12px 20px", fontSize: 13.5, fontWeight: 500, background: "none", border: "none",
                  cursor: "pointer", color: activeTab === tab.key ? "#4f6ef7" : "#6b7280",
                  borderBottom: activeTab === tab.key ? "2px solid #4f6ef7" : "2px solid transparent",
                  transition: "color 0.15s, border-color 0.15s",
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
            <div className="flex items-center gap-2">
              {activeTab === "platform" && (
                <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} style={{
                  fontSize: 13, color: teamFilter ? "#1a1d23" : "#9ca3af", padding: "5px 10px",
                  border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", outline: "none", height: 32,
                }}>
                  <option value="">团队 全部</option>
                  <option value="智谱1">智谱1</option>
                  <option value="企业2">企业2</option>
                  <option value="机构3">机构3</option>
                  <option value="企业4">企业4</option>
                </select>
              )}
              <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 32, padding: "0 10px" }}>
                <input
                  type="text" placeholder="请输入数据集名称搜索" value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && setQuery(search)}
                  style={{ fontSize: 13, border: "none", outline: "none", width: 180, background: "transparent" }}
                />
              </div>
              <button onClick={() => setQuery(search)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer" }}>
                <Search size={13} /> 查询
              </button>
              <button onClick={() => { setSearch(""); setQuery(""); setTeamFilter(""); }}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#4f6ef7", background: "#fff", border: "1px solid #4f6ef7", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer" }}>
                <RotateCcw size={13} /> 重置
              </button>
            </div>
            {currentTab.uploadLabel && (
              <button
                onClick={() => setShowModal(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "0 14px", height: 32, cursor: "pointer" }}
              >
                <Plus size={14} /> {currentTab.uploadLabel}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8f9fc" }}>
                  {cols.map(col => (
                    <th key={col} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: "#6b7280", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={cols.length} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td>
                  </tr>
                ) : filtered.map(row => {
                  const sc = datasetStatusCfg[row.status];
                  const vc = visCfg[row.visibility];
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
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: sc.bg, fontSize: 12 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block", flexShrink: 0 }} />
                            <span style={{ color: sc.text, fontWeight: 500 }}>{row.status}</span>
                          </span>
                          {row.status === "校验失败" && row.failDetail && (
                            <span style={{ position: "relative" }}>
                              <button
                                onClick={() => setFailDetailId(failDetailId === row.id ? null : row.id)}
                                style={{ width: 16, height: 16, borderRadius: "50%", border: "none", background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1 }}
                                title="查看校验失败详情">!</button>
                              {failDetailId === row.id && (
                                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", width: 340, background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden" }}>
                                  <div style={{ padding: "10px 14px", background: "#fef2f2", borderBottom: "1px solid #fee2e2" }}>
                                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "#dc2626" }}>{row.failDetail.summary}</div>
                                  </div>
                                  <div style={{ padding: "12px 14px", fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
                                    <div className="flex items-start gap-2"><span style={{ color: "#9ca3af", width: 56, flexShrink: 0 }}>errorType</span><span style={{ fontFamily: "monospace" }}>{row.failDetail.errorType}</span></div>
                                    <div className="flex items-start gap-2"><span style={{ color: "#9ca3af", width: 56, flexShrink: 0 }}>details</span><span style={{ fontFamily: "monospace" }}>{row.failDetail.details}</span></div>
                                    <div className="flex items-start gap-2"><span style={{ color: "#9ca3af", width: 56, flexShrink: 0 }}>logid</span><span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{row.failDetail.logid}</span></div>
                                    <div className="flex items-start gap-2"><span style={{ color: "#9ca3af", width: 56, flexShrink: 0 }}>timestamp</span><span style={{ fontFamily: "monospace" }}>{row.failDetail.timestamp}</span></div>
                                  </div>
                                </div>
                              )}
                            </span>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{row.team}</td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12 }}>{row.creator}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 12, padding: "2px 8px", background: vc.bg, color: vc.text, fontWeight: 500, borderRadius: 4, whiteSpace: "nowrap" }}>{row.visibility}</span>
                          {activeTab !== "public" && (
                            <button onClick={() => setPermEditId(row.id)}
                              style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                              onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")}
                              onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>修改</button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#6b7280", fontSize: 12, whiteSpace: "nowrap" }}>{row.updatedAt}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setEditId(row.id)} style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
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
        {activeTab === "platform" && (
          <div style={{ padding: "0 24px 16px", fontSize: 12, color: "#9ca3af" }}>超管可以在本分页看到平台所有用户的数据集，可以按团队过滤</div>
        )}
      </div>

      {showModal && (
        <CreateDatasetModal onClose={() => setShowModal(false)} onConfirm={handleCreate} />
      )}

      {editId !== null && (() => {
        const row = datasets.find(d => d.id === editId);
        if (!row) return null;
        return (
          <EditDatasetDrawer
            row={row}
            onClose={() => setEditId(null)}
            onConfirm={(form) => handleEdit(row.id, form)}
          />
        );
      })()}

      {permEditId !== null && (() => {
        const row = datasets.find(d => d.id === permEditId);
        if (!row) return null;
        const options: Visibility[] = row.team === "系统" || row.team === "无团队"
          ? ["仅自己", "全平台可见"]
          : ["仅自己", "团队成员可见", "团队成员可编辑"];
        return (
          <PermEditModal
            datasetName={row.name}
            current={row.visibility}
            options={options}
            onClose={() => setPermEditId(null)}
            onConfirm={(vis) => handlePermUpdate(row.id, vis)}
          />
        );
      })()}
    </>
  );
}

function PermEditModal({ datasetName, current, options, onClose, onConfirm }: {
  datasetName: string; current: Visibility; options: Visibility[];
  onClose: () => void; onConfirm: (vis: Visibility) => void;
}) {
  const [selected, setSelected] = useState<Visibility>(current);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 400, background: "#fff", borderRadius: 12, zIndex: 201,
        boxShadow: "0 12px 40px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>修改权限状态</div>
          <div style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 4 }}>数据集「{datasetName}」</div>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {options.map(opt => {
            const vc = visCfg[opt];
            return (
              <button key={opt} onClick={() => setSelected(opt)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  border: `1px solid ${selected === opt ? "#4f6ef7" : "#e0e3ed"}`, borderRadius: 8,
                  background: selected === opt ? "#eff4ff" : "#fff", cursor: "pointer", textAlign: "left",
                }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${selected === opt ? "#4f6ef7" : "#d1d5db"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {selected === opt && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4f6ef7" }} />}
                </span>
                <span style={{ fontSize: 13, padding: "2px 8px", background: vc.bg, color: vc.text, fontWeight: 500, borderRadius: 4 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "12px 24px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "7px 20px", cursor: "pointer" }}>取消</button>
          <button onClick={() => onConfirm(selected)} style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "7px 20px", cursor: "pointer" }}>确定</button>
        </div>
      </div>
    </>
  );
}

const typeHint: Record<string, string> = {
  CPT: "用于继续预训练",
  SFT: "用于问答任务",
  RL: "用于强化学习",
  Eval: "用于模型评估",
};

function EditDatasetDrawer({ row, onClose, onConfirm }: {
  row: DatasetRow; onClose: () => void; onConfirm: (data: CreateDatasetForm) => void;
}) {
  const [form, setForm] = useState<CreateDatasetForm>({ name: row.name, desc: row.desc ?? "", type: row.type });
  const setField = (k: keyof CreateDatasetForm, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const inputCls: React.CSSProperties = {
    width: "100%", height: 34, padding: "0 10px", fontSize: 13,
    border: "1px solid #e0e3ed", borderRadius: 6, outline: "none",
    color: "#1a1d23", background: "#fff", boxSizing: "border-box",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100 }} />
      <div style={{
        position: "fixed", top: "50%", right: 0, transform: "translateY(-50%)",
        width: 400, background: "#fff", zIndex: 101,
        borderRadius: "12px 0 0 12px", boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column", maxHeight: "90vh",
      }}>
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23" }}>编辑数据集</span>
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
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>数据集名称
              </span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{form.name.length}/32</span>
            </div>
            <input
              value={form.name} onChange={e => setField("name", e.target.value.slice(0, 32))}
              placeholder="请输入数据集名称"
              style={inputCls}
            />
          </div>

          {/* 数据集简介 */}
          <div style={{ marginBottom: 16 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>数据集简介</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{form.desc.length}/1024</span>
            </div>
            <textarea
              value={form.desc} onChange={e => setField("desc", e.target.value.slice(0, 1024))}
              placeholder="请输入数据集简介（选填）"
              style={{ ...inputCls, height: 70, padding: "8px 10px", resize: "none", lineHeight: 1.5 }}
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
            {typeHint[form.type] && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{typeHint[form.type]}</div>}
          </div>

          {/* 数据文件 (readonly) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>数据文件</div>
            <div className="flex items-center gap-2" style={{ ...inputCls, background: "#f5f7fa", cursor: "default" }}>
              <FileText size={14} color="#4f6ef7" />
              <span style={{ fontSize: 13, color: "#374151" }}>{row.name}.jsonl</span>
              <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>{row.count}</span>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>数据文件不可修改，如需更换请新建数据集</div>
          </div>

          {/* 模态 (readonly) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>模态</div>
            <input value={row.modality} readOnly style={{ ...inputCls, background: "#f5f7fa", color: "#9ca3af", cursor: "default" }} />
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>由系统根据上传的数据集自动判定校验模态类型</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "14px 20px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose} style={{ fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "7px 20px", cursor: "pointer" }}>
            取消
          </button>
          <button
            onClick={() => { if (form.name.trim()) { onConfirm(form); } }}
            style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "7px 20px", cursor: "pointer" }}
          >
            保存
          </button>
        </div>
      </div>
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
  const [myModelFilter, setMyModelFilter] = useState<string | null>(null);
  const [deletedModelAlert, setDeletedModelAlert] = useState<string | null>(null);

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
            trainingView === "create"
              ? <CreateTrainingTaskPage models={models} onCancel={() => setTrainingView("list")} />
              : trainingView === "evaluation"
                ? <EvaluationReportPage taskName={evalTaskName || "电商客服大模型预训练"} onBack={() => undefined} />
                : trainingPrefillModel
              ? <CreateTrainingTaskPage key={trainingPrefillModelId ?? "manual"} models={models} initialModel={trainingPrefillModel} onCancel={() => { setTrainingPrefillModelId(null); setTrainingView("list"); }} />
              : <TrainingTaskList
                  onCreate={() => setTrainingView("create")}
                  onEvalReport={setEvalTaskName}
                  onJumpToMyModel={(outputModel, deleted) => {
                    if (deleted) { setDeletedModelAlert(outputModel); }
                    else { setMyModelFilter(outputModel); setActiveMenu("my-model"); }
                  }}
                />
          ) : activeMenu === "training-data" ? (
            <TrainingDataPage />
          ) : activeMenu === "model-list" ? (
            <ModelManagementPage models={models} onModelsChange={setModels} onDeploy={model => {
              setDeployPrefillModelId(model.id);
              handleMenuSelect("model-deploy");
            }} />
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
          ) : activeMenu === "resource-role-config" ? (
            <ResourceRoleConfigPage />
          ) : activeMenu === "resource-role-queue" ? (
            <ResourceRoleQueuePage />
          ) : activeMenu === "user-account" ? (
            <UserAccountPage />
          ) : activeMenu === "my-model" ? (
            <MyModelsPage initialFilter={myModelFilter} />
          ) : activeMenu === "audit-events" ? (
            <AuditEventsPage />
          ) : activeMenu === "api-key-monitoring" ? (
            <ApiKeyManagementPage />
          ) : activeMenu === "usage-stats" ? (
            <AdminUsageStatsPage />
          ) : activeMenu === "log-mining" ? (
            <TaskLogPage />
          ) : activeMenu === "docs-center" ? (
            <DocumentationCenterPage />
          ) : activeMenu === "sample-repository" ? (
            <SampleRepositoryPage />
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
          ) : activeMenu === "user-role" ? (
            <UserRolePage />
          ) : activeMenu === "team-management" ? (
            <TeamManagementPage />
          ) : activeMenu === "model-experience" ? (
            <ModelExperiencePage deployments={deployments} models={models} initialModel={experiencePrefillModel} />
          ) : (
            <PlaceholderPage label={activeLabel} />
          )}
        </div>
      </main>

      {deletedModelAlert && (
        <>
          <div onClick={() => setDeletedModelAlert(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 360, background: "#fff", borderRadius: 12, zIndex: 201,
            boxShadow: "0 12px 40px rgba(0,0,0,0.16)", display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div className="flex items-center gap-3" style={{ padding: "20px 20px 16px" }}>
              <div className="flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, borderRadius: "50%", background: "#fef2f2" }}>
                <Info size={18} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23" }}>模型已删除！</div>
                <div style={{ fontSize: 12.5, color: "#9ca3af", marginTop: 2 }}>模型「{deletedModelAlert}」已被删除，无法查看。</div>
              </div>
            </div>
            <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "12px 20px", borderTop: "1px solid #f0f2f7" }}>
              <button onClick={() => setDeletedModelAlert(null)}
                style={{ fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, padding: "7px 22px", cursor: "pointer" }}>
                我知道了
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
