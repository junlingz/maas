import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cpu,
  Database,
  Gauge,
  Network,
  Server,
  SlidersHorizontal,
  Square,
  Terminal,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrainingTaskDetailTask {
  name: string;
  outputModel: string;
  type: string;
  status: string;
  taskId: string;
  baseModel: string;
  resources: string;
  submitTime: string;
  duration: string;
}

export interface TrainingTaskDetailProps {
  task: TrainingTaskDetailTask;
  onBack: () => void;
  onOpenNodeResources?: () => void;
}

type TabKey = "overview" | "monitor" | "logs";
type LogSource = "all" | "scheduler" | "training";
type WorkerSort = "node" | "gpuUtilization" | "gpuMemory" | "networkReceive" | "networkSend" | "diskIO";

const C = {
  ink: "#20242d",
  text: "#344054",
  muted: "#667085",
  faint: "#98a2b3",
  line: "#e4e8ef",
  soft: "#f5f7fa",
  blue: "#4f6ef7",
  blueSoft: "#eef2ff",
  green: "#16a34a",
  greenSoft: "#ecfdf3",
  amber: "#c26a12",
  amberSoft: "#fff7e8",
  red: "#dc2626",
  redSoft: "#fef2f2",
};

const panel: CSSProperties = {
  minWidth: 0,
  background: "#fff",
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(31,41,55,.025)",
};

type TrainingMetricPoint = {
  step: number;
  trainLoss: number;
  validationLoss: number | null;
  validationAccuracy: number | null;
};

// 原型演示数据；生产环境应按当前 task_id 读取训练引擎上报的指标序列。
const prototypeTrainingMetricData: TrainingMetricPoint[] = [
  { step: 0, trainLoss: 2.42, validationLoss: null, validationAccuracy: null },
  { step: 400, trainLoss: 1.91, validationLoss: 2.06, validationAccuracy: 68.4 },
  { step: 800, trainLoss: 1.55, validationLoss: 1.72, validationAccuracy: 75.1 },
  { step: 1200, trainLoss: 1.31, validationLoss: 1.49, validationAccuracy: 80.3 },
  { step: 1600, trainLoss: 1.12, validationLoss: 1.31, validationAccuracy: 84.8 },
  { step: 2000, trainLoss: 0.99, validationLoss: 1.17, validationAccuracy: 88.2 },
  { step: 2400, trainLoss: 0.91, validationLoss: 1.07, validationAccuracy: 90.4 },
  { step: 2800, trainLoss: 0.86, validationLoss: 0.98, validationAccuracy: 91.7 },
];

const formatStep = (step: number) => step >= 1000 ? `${(step / 1000).toFixed(1)}k` : String(step);

const bandwidthData = [
  { time: "14:10", nvlink: 472, interNode: 322 },
  { time: "14:15", nvlink: 486, interNode: 336 },
  { time: "14:20", nvlink: 478, interNode: 329 },
  { time: "14:25", nvlink: 491, interNode: 341 },
  { time: "14:30", nvlink: 483, interNode: 318 },
  { time: "14:35", nvlink: 488, interNode: 334 },
  { time: "14:40", nvlink: 480, interNode: 326 },
];

const gpuRows = [
  { node: "worker-a100-07", gpu: "GPU 0", utilization: 96, memory: "72.8 / 80 GB", temperature: 68, power: 312, bandwidth: 482, topology: "NVLink · 4 路" },
  { node: "worker-a100-07", gpu: "GPU 1", utilization: 94, memory: "71.9 / 80 GB", temperature: 70, power: 318, bandwidth: 478, topology: "NVLink · 4 路" },
  { node: "worker-a100-07", gpu: "GPU 2", utilization: 97, memory: "72.4 / 80 GB", temperature: 69, power: 315, bandwidth: 489, topology: "NVLink · 4 路" },
  { node: "worker-a100-07", gpu: "GPU 3", utilization: 95, memory: "72.1 / 80 GB", temperature: 71, power: 321, bandwidth: 475, topology: "NVLink · 4 路" },
  { node: "worker-a100-12", gpu: "GPU 0", utilization: 93, memory: "71.6 / 80 GB", temperature: 72, power: 326, bandwidth: 471, topology: "NVLink · 4 路" },
  { node: "worker-a100-12", gpu: "GPU 1", utilization: 92, memory: "71.8 / 80 GB", temperature: 73, power: 330, bandwidth: 468, topology: "NVLink · 4 路" },
  { node: "worker-a100-12", gpu: "GPU 2", utilization: 71, memory: "69.8 / 80 GB", temperature: 84, power: 365, bandwidth: 431, topology: "NVLink · 4 路" },
  { node: "worker-a100-12", gpu: "GPU 3", utilization: 94, memory: "72.0 / 80 GB", temperature: 72, power: 323, bandwidth: 474, topology: "NVLink · 4 路" },
];

const workerRows = [
  { node: "worker-a100-07", worker: "4 / 4", gpu: "4 × A100 80GB", gpuUtilization: 95.5, gpuMemoryUsed: 289.2, gpuMemoryTotal: 320, networkReceive: 322, networkSend: 318, diskRead: 1.8, diskWrite: 0.9, status: "正常" },
  { node: "worker-a100-12", worker: "4 / 4", gpu: "4 × A100 80GB", gpuUtilization: 87.5, gpuMemoryUsed: 285.2, gpuMemoryTotal: 320, networkReceive: 326, networkSend: 321, diskRead: 1.5, diskWrite: 1.1, status: "正常" },
];

function Button({ children, icon, variant = "secondary", onClick, disabled, title }: {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const variants: Record<string, CSSProperties> = {
    primary: { color: "#fff", background: C.blue, borderColor: C.blue },
    secondary: { color: C.text, background: "#fff", borderColor: "#d5dbe5" },
    danger: { color: C.red, background: "#fff", borderColor: "#fecaca" },
    ghost: { color: C.blue, background: "transparent", borderColor: "transparent" },
  };

  return (
    <button
      className="ttd-button"
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        minHeight: 34,
        padding: "0 12px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        border: "1px solid",
        borderRadius: 7,
        fontSize: 12.5,
        fontWeight: 650,
        fontFamily: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? .52 : 1,
        ...variants[variant],
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function StatusTag({ status, stopRequested }: { status: string; stopRequested: boolean }) {
  const normalized = stopRequested ? "停止中" : status;
  const isDone = normalized.includes("完成") || normalized.includes("成功");
  const isError = normalized.includes("失败");
  const isStopped = normalized.includes("停止");
  const isQueued = normalized.includes("排队") || normalized.includes("等待");
  const tone = isDone
    ? { fg: C.green, bg: C.greenSoft, dot: C.green }
    : isError
      ? { fg: C.red, bg: C.redSoft, dot: C.red }
      : isStopped
        ? { fg: C.muted, bg: "#f2f4f7", dot: C.faint }
        : isQueued
          ? { fg: C.amber, bg: C.amberSoft, dot: C.amber }
          : { fg: C.blue, bg: C.blueSoft, dot: C.blue };

  return (
    <span style={{ minHeight: 24, padding: "3px 9px", display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, color: tone.fg, background: tone.bg, fontSize: 11.5, fontWeight: 650 }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: tone.dot }} />
      {normalized}
    </span>
  );
}

function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div style={{ marginBottom: 12, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ margin: 0, color: C.ink, fontSize: 14, lineHeight: 1.45, fontWeight: 700 }}>{title}</h2>
        {description && <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 11.5, lineHeight: 1.55 }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function DefinitionList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="ttd-definition-list" style={{ margin: 0, display: "grid", gridTemplateColumns: "132px minmax(0,1fr)", gap: "11px 16px", fontSize: 12 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "contents" }}>
          <dt style={{ color: C.faint }}>{label}</dt>
          <dd style={{ minWidth: 0, margin: 0, color: C.ink, fontWeight: 600, overflowWrap: "anywhere" }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PolicyItem({ icon, title, value, description }: { icon: ReactNode; title: string; value: string; description: string }) {
  return (
    <div style={{ padding: 12, minWidth: 0, display: "flex", gap: 10, border: `1px solid ${C.line}`, borderRadius: 7, background: "#fbfcfe" }}>
      <span style={{ width: 30, height: 30, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: 7, color: C.blue, background: C.blueSoft }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <b style={{ color: C.ink, fontSize: 12 }}>{title}</b>
          <span style={{ color: C.green, fontSize: 10.5, fontWeight: 650 }}>{value}</span>
        </div>
        <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 11, lineHeight: 1.55 }}>{description}</p>
      </div>
    </div>
  );
}

function OverviewTab({ task, onOpenNodeResources }: { task: TrainingTaskDetailTask; onOpenNodeResources?: () => void }) {
  const isQueued = task.status.includes("排队") || task.status.includes("等待");

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="ttd-overview-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
        <section style={{ ...panel, padding: 16 }}>
          <SectionTitle title="任务配置快照" description="提交后只读，确保重试与问题定位使用同一份配置。" />
          <DefinitionList rows={[
            ["任务 ID", <code style={{ color: C.text, fontSize: 11.5 }}>{task.taskId}</code>],
            ["任务类型", task.type],
            ["基础模型", task.baseModel],
            ["输出模型", task.outputModel || "训练完成后生成"],
            ["资源申请", task.resources],
            ["训练方式", "SFT · 全参数微调"],
            ["通信后端", "NCCL · 自动选择"],
          ]} />
        </section>

        <section style={{ ...panel, padding: 16 }}>
          <SectionTitle title="排队与运行" description="队列和训练进程状态来自同一任务 ID。" />
          <DefinitionList rows={[
            ["提交时间", task.submitTime],
            ["队列", "maas-sft · normal"],
            ["排队耗时", isQueued ? "仍在等待 8 张 GPU 同时可用" : "1 分 42 秒"],
            ["已运行", isQueued ? "—" : task.duration],
            ["Worker 状态", isQueued ? "0 / 8 · 等待同步调度" : "8 / 8 · 心跳正常"],
            ["最近检查点", isQueued ? "尚未生成" : "checkpoint-002800 · 14:41:08"],
          ]} />
          <div style={{ marginTop: 14, padding: "10px 11px", display: "flex", gap: 8, alignItems: "flex-start", borderRadius: 7, color: isQueued ? C.amber : C.green, background: isQueued ? C.amberSoft : C.greenSoft, fontSize: 11.5, lineHeight: 1.55 }}>
            {isQueued ? <Clock3 size={14} style={{ marginTop: 1, flex: "0 0 auto" }} /> : <CheckCircle2 size={14} style={{ marginTop: 1, flex: "0 0 auto" }} />}
            {isQueued ? "Gang 资源尚未同时满足，任务保持排队且不会占用部分 GPU。" : "Gang 资源校验通过，8 个训练进程已同步启动。"}
          </div>
        </section>
      </div>

      <section style={{ ...panel, padding: 16 }}>
        <SectionTitle
          title="资源分配"
          description="推荐方案用于提交前说明调度意图，实际分配以运行时结果为准。"
          action={onOpenNodeResources ? <Button variant="ghost" onClick={onOpenNodeResources} icon={<Server size={13} />}>查看节点资源</Button> : undefined}
        />
        <div className="ttd-allocation-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 36px minmax(0,1fr)", gap: 10, alignItems: "stretch" }}>
          <div style={{ padding: 14, border: `1px solid ${C.line}`, borderRadius: 7, background: "#fbfcfe" }}>
            <span style={{ color: C.faint, fontSize: 11 }}>推荐分配</span>
            <div style={{ marginTop: 6, color: C.ink, fontSize: 15, fontWeight: 720 }}>2 节点 × 4 A100 80GB</div>
            <p style={{ margin: "7px 0 0", color: C.muted, fontSize: 11.5, lineHeight: 1.65 }}>节点内 NVLink，节点间 400 Gbps IB；优先同交换域，减少跨域通信。</p>
          </div>
          <div className="ttd-allocation-arrow" aria-hidden="true" style={{ display: "grid", placeItems: "center", color: C.faint, fontSize: 17 }}>→</div>
          <div style={{ padding: 14, border: "1px solid #bbf0d0", borderRadius: 7, background: "#f8fffb" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <span style={{ color: C.faint, fontSize: 11 }}>实际分配</span>
              <span style={{ color: C.green, fontSize: 10.5, fontWeight: 650 }}>匹配推荐拓扑</span>
            </div>
            <div style={{ marginTop: 6, color: C.ink, fontSize: 15, fontWeight: 720 }}>worker-a100-07 / 12</div>
            <p style={{ margin: "7px 0 0", color: C.muted, fontSize: 11.5, lineHeight: 1.65 }}>各 4 × A100 80GB · NVLink；跨节点走 IB fabric-02。</p>
          </div>
        </div>

        <div className="ttd-policy-grid" style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
          <PolicyItem icon={<Network size={15} />} title="Gang Scheduling" value="已启用" description="minimumAvailable 8，全部进程同步启动。" />
          <PolicyItem icon={<Server size={15} />} title="Volcano" value="已接管" description="队列 maas-sft，优先级 normal。" />
          <PolicyItem icon={<Cpu size={15} />} title="HAMi" value="拓扑感知" description="优先 NVLink 与相同 IB 交换域。" />
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, suffix, icon, hint }: { label: string; value: string; suffix?: string; icon: ReactNode; hint: string }) {
  return (
    <div style={{ ...panel, padding: 13, display: "flex", gap: 10, alignItems: "center" }}>
      <span style={{ width: 32, height: 32, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: 7, color: C.blue, background: C.blueSoft }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: C.faint, fontSize: 10.5 }}>{label}</div>
        <div style={{ marginTop: 2, color: C.ink, fontSize: 18, lineHeight: 1.25, fontWeight: 730, whiteSpace: "nowrap" }}>{value}<small style={{ marginLeft: 3, color: C.muted, fontSize: 10.5, fontWeight: 500 }}>{suffix}</small></div>
        <div style={{ marginTop: 2, color: C.muted, fontSize: 10.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hint}</div>
      </div>
    </div>
  );
}

function ChartPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section style={{ ...panel, padding: 14 }}>
      <SectionTitle title={title} description={description} />
      <div style={{ width: "100%", height: 246, minWidth: 0 }}>{children}</div>
    </section>
  );
}

function MonitorTab() {
  const [timeRange, setTimeRange] = useState<"15m" | "1h" | "all">("1h");
  const [zoom, setZoom] = useState(100);
  const [workerSort, setWorkerSort] = useState<WorkerSort>("diskIO");
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [aggregationFrequency, setAggregationFrequency] = useState(1);
  const [draftFrequency, setDraftFrequency] = useState(1);
  const [appliedAt, setAppliedAt] = useState<string | null>(null);

  const visibleMetricData = useMemo(() => {
    const baseCount = timeRange === "15m" ? 4 : timeRange === "1h" ? 6 : prototypeTrainingMetricData.length;
    const visibleCount = Math.max(3, Math.ceil(baseCount / (zoom / 100)));
    return prototypeTrainingMetricData.slice(-visibleCount);
  }, [timeRange, zoom]);

  const hasVisibleAccuracy = useMemo(
    () => visibleMetricData.some(row => row.validationAccuracy !== null),
    [visibleMetricData],
  );

  const visibleBandwidthData = useMemo(() => {
    const baseCount = timeRange === "15m" ? 4 : timeRange === "1h" ? 6 : bandwidthData.length;
    const visibleCount = Math.max(3, Math.ceil(baseCount / (zoom / 100)));
    return bandwidthData.slice(-visibleCount);
  }, [timeRange, zoom]);

  const sortedWorkers = useMemo(() => [...workerRows].sort((a, b) => {
    if (workerSort === "node") return a.node.localeCompare(b.node);
    if (workerSort === "gpuUtilization") return b.gpuUtilization - a.gpuUtilization;
    if (workerSort === "gpuMemory") return b.gpuMemoryUsed - a.gpuMemoryUsed;
    if (workerSort === "networkReceive") return b.networkReceive - a.networkReceive;
    if (workerSort === "networkSend") return b.networkSend - a.networkSend;
    return (b.diskRead + b.diskWrite) - (a.diskRead + a.diskWrite);
  }), [workerSort]);

  const openStrategyDialog = () => {
    setDraftFrequency(aggregationFrequency);
    setStrategyOpen(true);
  };

  const applyAggregationStrategy = () => {
    const nextFrequency = Math.min(100, Math.max(1, Number.isFinite(draftFrequency) ? Math.round(draftFrequency) : 1));
    setAggregationFrequency(nextFrequency);
    setDraftFrequency(nextFrequency);
    setAppliedAt("Step 2,841");
    setStrategyOpen(false);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <section className="ttd-monitor-toolbar" style={{ ...panel, padding: "9px 12px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 220px", display: "flex", alignItems: "center", gap: 8 }}>
          <Clock3 size={14} color={C.blue} />
          <div>
            <b style={{ display: "block", color: C.ink, fontSize: 12 }}>全局监控范围</b>
            <span style={{ display: "block", marginTop: 1, color: C.faint, fontSize: 10.5 }}>同时作用于全部趋势图 · 10 秒刷新</span>
          </div>
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, color: C.muted, fontSize: 11 }}>
          时间范围
          <select aria-label="监控时间范围" value={timeRange} onChange={event => setTimeRange(event.target.value as "15m" | "1h" | "all")} style={{ height: 30, padding: "0 28px 0 9px", border: `1px solid ${C.line}`, borderRadius: 6, color: C.text, background: "#fff", fontSize: 11.5, fontFamily: "inherit", cursor: "pointer" }}>
            <option value="15m">近 15 分钟</option>
            <option value="1h">近 1 小时</option>
            <option value="all">全部训练过程</option>
          </select>
        </label>
        <div role="group" aria-label="图表缩放" style={{ height: 30, display: "inline-flex", alignItems: "center", border: `1px solid ${C.line}`, borderRadius: 6, overflow: "hidden", background: "#fff" }}>
          <button className="ttd-icon-button" type="button" aria-label="缩小图表" title="缩小图表" disabled={zoom === 100} onClick={() => setZoom(current => Math.max(100, current - 50))} style={{ width: 30, height: 28, display: "grid", placeItems: "center", border: 0, color: C.muted, background: "transparent", cursor: zoom === 100 ? "not-allowed" : "pointer", opacity: zoom === 100 ? .42 : 1 }}><ZoomOut size={13} /></button>
          <span style={{ width: 48, textAlign: "center", color: C.text, fontSize: 10.5, borderLeft: `1px solid ${C.line}`, borderRight: `1px solid ${C.line}` }}>{zoom}%</span>
          <button className="ttd-icon-button" type="button" aria-label="放大图表" title="放大图表" disabled={zoom === 200} onClick={() => setZoom(current => Math.min(200, current + 50))} style={{ width: 30, height: 28, display: "grid", placeItems: "center", border: 0, color: C.muted, background: "transparent", cursor: zoom === 200 ? "not-allowed" : "pointer", opacity: zoom === 200 ? .42 : 1 }}><ZoomIn size={13} /></button>
        </div>
      </section>

      <div className="ttd-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 8 }}>
        <Kpi label="当前轮次" value="2 / 3" icon={<Activity size={15} />} hint="Step 2,840 / 4,200" />
        <Kpi label="已处理样本" value="81,920" suffix="/ 120k" icon={<Database size={15} />} hint="本轮 27,306 条" />
        <Kpi label="训练 Loss" value="0.86" icon={<Gauge size={15} />} hint="较上轮下降 18.1%" />
        <Kpi label="验证准确率" value="91.7" suffix="%" icon={<CheckCircle2 size={15} />} hint="每 400 Step 验证" />
        <Kpi label="训练速度" value="182k" suffix="tok/s" icon={<Zap size={15} />} hint="8 个 Worker 合计" />
      </div>

      <section style={{ ...panel, padding: "12px 14px" }}>
        <SectionTitle
          title="当前通信与聚合策略"
          description={appliedAt ? `聚合频率已更新，将从 ${appliedAt} 起应用于后续训练步骤。` : "运行中仅开放聚合频率微调，其他通信配置保持任务提交时的快照。"}
          action={<Button variant="secondary" icon={<SlidersHorizontal size={13} />} onClick={openStrategyDialog}>聚合策略动态调整</Button>}
        />
        <div className="ttd-strategy-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8 }}>
          {[
            ["通信后端", "NCCL", "8 个 Worker"],
            ["传输协议", "RDMA / IB", "fabric-02"],
            ["带宽与压缩", "梯度优先 · 不压缩", "当前策略"],
            ["梯度聚合", `每 ${aggregationFrequency} Step`, appliedAt ? "已更新" : "任务默认"],
          ].map(([label, value, hint]) => (
            <div key={label} style={{ padding: "9px 10px", minWidth: 0, border: `1px solid ${C.line}`, borderRadius: 7, background: "#fbfcfe" }}>
              <span style={{ display: "block", color: C.faint, fontSize: 10.5 }}>{label}</span>
              <b style={{ marginTop: 4, display: "block", color: C.ink, fontSize: 12, overflowWrap: "anywhere" }}>{value}</b>
              <span style={{ marginTop: 3, display: "block", color: hint === "已更新" ? C.green : C.muted, fontSize: 10.5 }}>{hint}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="ttd-chart-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        <ChartPanel title="全局损失函数曲线" description={`当前任务全体 Worker 加权聚合 · ${timeRange === "all" ? "全部训练过程" : timeRange === "15m" ? "近 15 分钟" : "近 1 小时"} · 缩放 ${zoom}%`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visibleMetricData} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" />
              <XAxis dataKey="step" tickFormatter={formatStep} tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 2.8]} tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={(value) => `Step ${Number(value).toLocaleString()}`} contentStyle={{ border: `1px solid ${C.line}`, borderRadius: 7, boxShadow: "0 6px 20px rgba(31,41,55,.08)", fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line isAnimationActive={false} connectNulls={false} type="monotone" dataKey="trainLoss" name="训练 Loss" stroke={C.blue} strokeWidth={2} dot={false} />
              <Line isAnimationActive={false} connectNulls={false} type="monotone" dataKey="validationLoss" name="验证 Loss" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="验证集准确率曲线" description={`验证阶段 eval_accuracy · 每 400 Step 上报 · ${timeRange === "all" ? "全部训练过程" : timeRange === "15m" ? "近 15 分钟" : "近 1 小时"} · 缩放 ${zoom}%`}>
          {hasVisibleAccuracy ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibleMetricData} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" />
                <XAxis dataKey="step" tickFormatter={formatStep} tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(value) => `Step ${Number(value).toLocaleString()}`} formatter={(value) => [`${Number(value).toFixed(1)}%`, "验证集准确率"]} contentStyle={{ border: `1px solid ${C.line}`, borderRadius: 7, boxShadow: "0 6px 20px rgba(31,41,55,.08)", fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line isAnimationActive={false} connectNulls={false} type="linear" dataKey="validationAccuracy" name="验证集准确率" stroke={C.green} strokeWidth={2.2} dot={{ r: 2.5, fill: "#fff", strokeWidth: 2 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div role="status" style={{ height: "100%", display: "grid", placeItems: "center", color: C.faint, fontSize: 11.5 }}>尚未产生验证集准确率数据</div>
          )}
        </ChartPanel>

        <ChartPanel title="通信带宽" description={`节点内 NVLink 与跨节点 IB · Gbps · 缩放 ${zoom}%`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visibleBandwidthData} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 550]} tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: `1px solid ${C.line}`, borderRadius: 7, boxShadow: "0 6px 20px rgba(31,41,55,.08)", fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line isAnimationActive={false} type="monotone" dataKey="nvlink" name="节点内 NVLink" stroke={C.blue} strokeWidth={2} dot={false} />
              <Line isAnimationActive={false} type="monotone" dataKey="interNode" name="跨节点 IB" stroke="#d97706" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <section style={{ ...panel, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px 0" }}>
          <SectionTitle
            title="节点 / Worker"
            description="按节点汇总 GPU 利用率、GPU 显存占用、网络接收/发送速率与磁盘 I/O。"
            action={(
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 10.5 }}>
                <span className="ttd-sort-label">排序</span>
                <span style={{ position: "relative", display: "inline-flex" }}>
                  <select aria-label="节点排序方式" value={workerSort} onChange={event => setWorkerSort(event.target.value as WorkerSort)} style={{ height: 30, padding: "0 28px 0 9px", appearance: "none", border: `1px solid ${C.line}`, borderRadius: 6, color: C.text, background: "#fff", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>
                    <option value="diskIO">磁盘 I/O ↓</option>
                    <option value="gpuUtilization">GPU 利用率 ↓</option>
                    <option value="gpuMemory">GPU 显存占用 ↓</option>
                    <option value="networkReceive">网络接收速率 ↓</option>
                    <option value="networkSend">网络发送速率 ↓</option>
                    <option value="node">节点名称 ↑</option>
                  </select>
                  <ChevronDown size={12} aria-hidden="true" style={{ position: "absolute", right: 8, top: 9, color: C.faint, pointerEvents: "none" }} />
                </span>
              </label>
            )}
          />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="ttd-worker-table" aria-label="节点性能指标" style={{ width: "100%", minWidth: 1120, borderCollapse: "collapse", fontSize: 11.5 }}>
            <thead><tr style={{ color: C.muted, background: "#fafbfc" }}>{["节点", "Worker / GPU", "GPU 利用率", "GPU 显存占用", "网络接收速率", "网络发送速率", "磁盘 I/O（读 / 写）", "状态"].map(label => <th key={label} style={{ padding: "9px 12px", textAlign: "left", borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</th>)}</tr></thead>
            <tbody>
              {sortedWorkers.map((row, index) => (
                <tr key={row.node}>
                  <td data-label="节点" style={{ padding: "10px 12px", color: C.ink, fontWeight: 600, borderBottom: index < sortedWorkers.length - 1 ? `1px solid ${C.line}` : 0 }}>{row.node}</td>
                  <td data-label="Worker / GPU" style={{ padding: "10px 12px", color: C.text, borderBottom: index < sortedWorkers.length - 1 ? `1px solid ${C.line}` : 0 }}>
                    <div style={{ minWidth: 0, textAlign: "right" }}>
                      <b style={{ display: "block", color: C.text, fontSize: 11.5 }}>{row.worker}</b>
                      <span style={{ marginTop: 2, display: "block", color: C.faint, fontSize: 10.5 }}>{row.gpu}</span>
                    </div>
                  </td>
                  <td data-label="GPU 利用率" style={{ padding: "10px 12px", color: C.text, fontWeight: 600, whiteSpace: "nowrap", borderBottom: index < sortedWorkers.length - 1 ? `1px solid ${C.line}` : 0 }}>{row.gpuUtilization.toFixed(1)}%</td>
                  <td data-label="GPU 显存占用" style={{ padding: "10px 12px", color: C.text, whiteSpace: "nowrap", borderBottom: index < sortedWorkers.length - 1 ? `1px solid ${C.line}` : 0 }}>{row.gpuMemoryUsed.toFixed(1)} / {row.gpuMemoryTotal} GB</td>
                  <td data-label="网络接收速率" style={{ padding: "10px 12px", color: C.text, whiteSpace: "nowrap", borderBottom: index < sortedWorkers.length - 1 ? `1px solid ${C.line}` : 0 }}>{row.networkReceive} Gbps</td>
                  <td data-label="网络发送速率" style={{ padding: "10px 12px", color: C.text, whiteSpace: "nowrap", borderBottom: index < sortedWorkers.length - 1 ? `1px solid ${C.line}` : 0 }}>{row.networkSend} Gbps</td>
                  <td data-label="磁盘 I/O（读 / 写）" style={{ padding: "10px 12px", color: C.text, whiteSpace: "nowrap", borderBottom: index < sortedWorkers.length - 1 ? `1px solid ${C.line}` : 0 }}>{row.diskRead} / {row.diskWrite} GB/s</td>
                  <td data-label="状态" style={{ padding: "10px 12px", color: C.green, fontWeight: 600, borderBottom: index < sortedWorkers.length - 1 ? `1px solid ${C.line}` : 0 }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...panel, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <b style={{ display: "block", color: C.ink, fontSize: 13 }}>GPU 明细</b>
            <span style={{ display: "block", marginTop: 2, color: C.faint, fontSize: 10.5 }}>8 张卡 · 卡片式展示</span>
          </div>
        </div>
        <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(196px, 1fr))", gap: 10 }}>
          {gpuRows.map((row) => {
            const tempWarn = row.temperature >= 80;
            const utilLow = row.utilization < 80;
            return (
              <div
                key={`${row.node}-${row.gpu}`}
                style={{
                  background: "#fafbfc",
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
                  padding: "12px 13px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                }}
              >
                {/* 卡片头 — 节点 / GPU */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: tempWarn ? C.amber : utilLow ? C.amber : C.green, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: C.ink, fontSize: 12, fontWeight: 700, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.node}</div>
                    <div style={{ color: C.faint, fontSize: 10.5, lineHeight: 1.3 }}>{row.gpu}</div>
                  </div>
                </div>

                {/* 指标区 */}
                <div style={{ display: "grid", gap: 6 }}>
                  {/* GPU 利用率 */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                      <span style={{ color: C.faint, fontSize: 10 }}>GPU 利用率</span>
                      <span style={{ color: C.ink, fontSize: 13, fontWeight: 700 }}>{row.utilization}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "#e5e9f0", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${row.utilization}%`, borderRadius: 2, background: row.utilization >= 90 ? C.green : row.utilization >= 70 ? C.amber : C.red, transition: "width 0.3s" }} />
                    </div>
                  </div>

                  {/* GPU 显存占用 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ color: C.faint, fontSize: 10 }}>GPU 显存占用</span>
                    <span style={{ color: C.ink, fontSize: 12.5, fontWeight: 600 }}>{row.memory}</span>
                  </div>

                  {/* 温度 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ color: C.faint, fontSize: 10 }}>温度</span>
                    <span style={{ color: tempWarn ? C.amber : C.ink, fontSize: 12.5, fontWeight: 600 }}>
                      {row.temperature}°C
                      {tempWarn && <span style={{ marginLeft: 3, fontSize: 10 }}>⚠</span>}
                    </span>
                  </div>

                  {/* 功耗 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ color: C.faint, fontSize: 10 }}>功耗</span>
                    <span style={{ color: C.ink, fontSize: 12.5, fontWeight: 600 }}>{row.power} W</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {strategyOpen && (
        <div className="ttd-modal-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) setStrategyOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 1000, padding: 20, display: "grid", placeItems: "center", background: "rgba(17,24,39,.42)" }}>
          <section role="dialog" aria-modal="true" aria-labelledby="aggregation-strategy-title" style={{ width: "min(460px,100%)", maxHeight: "calc(100vh - 40px)", overflowY: "auto", borderRadius: 8, background: "#fff", boxShadow: "0 20px 50px rgba(17,24,39,.18)" }}>
            <header style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, borderBottom: `1px solid ${C.line}` }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h2 id="aggregation-strategy-title" style={{ margin: 0, color: C.ink, fontSize: 15, fontWeight: 700 }}>聚合策略动态调整</h2>
                <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 11.5, lineHeight: 1.55 }}>仅修改梯度聚合频率，不重启当前训练任务。</p>
              </div>
              <button className="ttd-icon-button" type="button" aria-label="关闭聚合策略动态调整" onClick={() => setStrategyOpen(false)} style={{ width: 30, height: 30, display: "grid", placeItems: "center", border: `1px solid ${C.line}`, borderRadius: 6, color: C.muted, background: "#fff", cursor: "pointer" }}><X size={14} /></button>
            </header>
            <div style={{ padding: 16, display: "grid", gap: 14 }}>
              <div style={{ padding: "10px 11px", display: "grid", gridTemplateColumns: "1fr auto", gap: 8, border: `1px solid ${C.line}`, borderRadius: 7, background: "#fbfcfe", fontSize: 11.5 }}>
                <span style={{ color: C.muted }}>当前策略</span>
                <b style={{ color: C.ink }}>每 {aggregationFrequency} Step 聚合一次</b>
                <span style={{ color: C.muted }}>通信后端</span>
                <b style={{ color: C.ink }}>NCCL · RDMA / IB</b>
              </div>
              <label style={{ display: "grid", gap: 6, color: C.ink, fontSize: 12, fontWeight: 650 }}>
                梯度聚合频率
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="number" min={1} max={100} step={1} value={draftFrequency} onChange={event => setDraftFrequency(event.target.valueAsNumber)} style={{ width: 112, height: 34, padding: "0 10px", border: `1px solid ${C.line}`, borderRadius: 6, color: C.ink, background: "#fff", fontSize: 12, fontFamily: "inherit" }} />
                  <span style={{ color: C.muted, fontSize: 11.5, fontWeight: 400 }}>Step / 次</span>
                </div>
                <span style={{ color: C.faint, fontSize: 10.5, lineHeight: 1.55, fontWeight: 400 }}>范围 1–100。频率降低可减少通信次数，但会改变后续梯度更新节奏。</span>
              </label>
              <div style={{ padding: "10px 11px", display: "flex", alignItems: "flex-start", gap: 8, borderRadius: 7, color: C.amber, background: C.amberSoft, fontSize: 11, lineHeight: 1.55 }}>
                <AlertTriangle size={13} style={{ marginTop: 1, flex: "0 0 auto" }} />
                保存后从下一训练步（Step 2,841）起生效；已完成步骤与历史指标不变。
              </div>
            </div>
            <footer style={{ padding: "11px 16px", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: `1px solid ${C.line}` }}>
              <Button variant="secondary" onClick={() => setStrategyOpen(false)}>取消</Button>
              <Button variant="primary" onClick={applyAggregationStrategy}>应用到后续训练步骤</Button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: Exclude<LogSource, "all"> }) {
  const scheduler = source === "scheduler";
  return (
    <span style={{ padding: "2px 7px", borderRadius: 5, color: scheduler ? C.blue : C.green, background: scheduler ? C.blueSoft : C.greenSoft, fontSize: 10.5, fontWeight: 650 }}>
      {scheduler ? "调度" : "训练"}
    </span>
  );
}

function LogsTab({ task, stopRequested }: { task: TrainingTaskDetailTask; stopRequested: boolean }) {
  const [source, setSource] = useState<LogSource>("all");

  const events = useMemo(() => {
    const base: Array<{ time: string; source: Exclude<LogSource, "all">; title: string; line: string; tone?: "warning" }> = [
      { time: "14:41:08", source: "training", title: "检查点保存完成", line: `[INFO] task_id=${task.taskId} checkpoint-002800 saved; loss=0.86 accuracy=91.7%` },
      { time: "14:40:56", source: "training", title: "完成第 2,800 步", line: `[TRAIN] step=2800 workers=8 throughput=182104 tok/s` },
      { time: "14:38:21", source: "training", title: "GPU 温度提示", line: "[WARN] worker-a100-12/gpu2 temperature=84C; throttling=false", tone: "warning" },
      { time: "09:24:18", source: "training", title: "训练进程组就绪", line: `[NCCL] task_id=${task.taskId} world_size=8 topology=NVLink+IB all workers joined` },
      { time: "09:24:06", source: "scheduler", title: "HAMi 完成拓扑感知分配", line: "[HAMi] worker-a100-07[0-3], worker-a100-12[0-3], fabric=IB-02" },
      { time: "09:23:54", source: "scheduler", title: "Volcano 准入任务", line: "[Volcano] queue=maas-sft priority=normal minimumAvailable=8 admitted=true" },
      { time: "09:22:28", source: "scheduler", title: "任务进入资源队列", line: `[QUEUE] task_id=${task.taskId} requested=2nodes*4gpu gang=true` },
      { time: "09:22:12", source: "scheduler", title: "训练任务已提交", line: `[SUBMIT] task_id=${task.taskId} base_model=${task.baseModel} status=queued` },
    ];
    if (stopRequested) {
      base.unshift({ time: "刚刚", source: "scheduler", title: "已提交停止请求", line: `[CONTROL] task_id=${task.taskId} action=stop status=accepted` });
    }
    return base;
  }, [stopRequested, task.baseModel, task.taskId]);

  const visibleEvents = source === "all" ? events : events.filter(event => event.source === source);

  return (
    <section style={{ ...panel, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <b style={{ display: "block", color: C.ink, fontSize: 13 }}>调度事件与训练日志</b>
          <span style={{ display: "block", marginTop: 2, color: C.faint, fontSize: 10.5 }}>按时间统一展示，避免在多个日志源之间切换定位问题。</span>
        </div>
        <div role="group" aria-label="日志来源" style={{ padding: 2, display: "inline-flex", gap: 2, border: `1px solid ${C.line}`, borderRadius: 7, background: C.soft }}>
          {([['all', '全部'], ['scheduler', '调度'], ['training', '训练']] as Array<[LogSource, string]>).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setSource(key)} aria-pressed={source === key} style={{ height: 26, padding: "0 9px", border: 0, borderRadius: 5, color: source === key ? C.blue : C.muted, background: source === key ? "#fff" : "transparent", boxShadow: source === key ? "0 1px 3px rgba(31,41,55,.08)" : "none", fontSize: 11, fontWeight: source === key ? 650 : 500, cursor: "pointer" }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fcfdff" }}>
        {visibleEvents.map((event, index) => (
          <div className="ttd-log-row" key={`${event.time}-${event.title}`} style={{ padding: "13px 15px", display: "grid", gridTemplateColumns: "76px 24px minmax(0,1fr)", gap: 10, borderBottom: index < visibleEvents.length - 1 ? `1px solid ${C.line}` : 0 }}>
            <time style={{ paddingTop: 2, color: C.faint, fontSize: 10.5, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" }}>{event.time}</time>
            <span aria-hidden="true" style={{ width: 24, height: 24, display: "grid", placeItems: "center", borderRadius: 99, color: event.tone === "warning" ? C.amber : event.source === "scheduler" ? C.blue : C.green, background: event.tone === "warning" ? C.amberSoft : event.source === "scheduler" ? C.blueSoft : C.greenSoft }}>
              {event.tone === "warning" ? <AlertTriangle size={12} /> : event.source === "scheduler" ? <Server size={12} /> : <Terminal size={12} />}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <b style={{ color: C.ink, fontSize: 12 }}>{event.title}</b>
                <SourceBadge source={event.source} />
              </div>
              <code style={{ marginTop: 7, padding: "7px 9px", display: "block", border: "1px solid #e7eaf0", borderRadius: 6, color: event.tone === "warning" ? "#9a5a0a" : "#4b5565", background: event.tone === "warning" ? "#fffaf0" : "#f6f8fb", fontSize: 10.5, lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{event.line}</code>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TrainingTaskDetail({ task, onBack, onOpenNodeResources }: TrainingTaskDetailProps) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [stopRequested, setStopRequested] = useState(false);

  useEffect(() => {
    setTab("overview");
    setStopRequested(false);
  }, [task.taskId]);

  const terminal = task.status.includes("完成") || task.status.includes("成功") || task.status.includes("失败") || task.status.includes("停止");
  const queued = task.status.includes("排队") || task.status.includes("等待");
  const progress = task.status.includes("完成") || task.status.includes("成功") ? 100 : queued ? 0 : terminal ? 42 : 68;
  const progressLabel = queued ? "等待资源" : progress === 100 ? "训练完成" : `Epoch 2 / 3 · Step 2,840 / 4,200`;
  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "overview", label: "概览" },
    { key: "monitor", label: "监控" },
    { key: "logs", label: "日志" },
  ];

  return (
    <div className="ttd-root" style={{ width: "100%", height: "100%", overflowX: "hidden", overflowY: "auto", color: C.ink, background: C.soft }}>
      <main style={{ width: "100%", maxWidth: 1480, margin: "0 auto", padding: "20px 24px 36px" }}>
        <header className="ttd-page-head" style={{ marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <button className="ttd-back" type="button" onClick={onBack} aria-label="返回训练任务列表" style={{ width: 34, height: 34, flex: "0 0 auto", display: "grid", placeItems: "center", border: `1px solid ${C.line}`, borderRadius: 7, color: C.text, background: "#fff", cursor: "pointer" }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, color: C.ink, fontSize: 20, lineHeight: 1.4, fontWeight: 720, overflowWrap: "anywhere" }}>{task.name}</h1>
              <StatusTag status={task.status} stopRequested={stopRequested} />
            </div>
            <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", color: C.muted, fontSize: 11.5 }}>
              <span>{task.type}</span>
              <span aria-hidden="true">·</span>
              <code style={{ color: C.muted }}>{task.taskId}</code>
              <span aria-hidden="true">·</span>
              <span>{task.baseModel} → {task.outputModel || "待生成模型"}</span>
            </div>
          </div>
          <div className="ttd-head-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Button
              variant="danger"
              icon={<Square size={12} fill="currentColor" />}
              disabled={terminal || stopRequested}
              onClick={() => setStopRequested(true)}
              title={terminal ? "任务已结束，无法停止" : "停止训练任务"}
            >
              {stopRequested ? "停止请求已提交" : "停止训练"}
            </Button>
          </div>
        </header>

        <section style={{ ...panel, marginBottom: 12, padding: "11px 13px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }} aria-label="任务进度">
          <span style={{ color: C.muted, fontSize: 11.5, whiteSpace: "nowrap" }}>{progressLabel}</span>
          <div style={{ height: 7, minWidth: 160, flex: "1 1 260px", overflow: "hidden", borderRadius: 99, background: "#edf0f4" }}>
            <div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: stopRequested ? C.amber : progress === 100 ? C.green : C.blue, transition: "width .25s ease" }} />
          </div>
          <b style={{ color: C.ink, fontSize: 11.5 }}>{progress}%</b>
          <span style={{ color: C.faint, fontSize: 11 }}>已运行 {task.duration}</span>
          {stopRequested && <span role="status" style={{ color: C.amber, fontSize: 11, fontWeight: 650 }}>等待当前训练步安全结束</span>}
        </section>

        <nav role="tablist" aria-label="任务详情" style={{ marginBottom: 12, display: "flex", borderBottom: `1px solid ${C.line}` }}>
          {tabs.map(item => (
            <button
              key={item.key}
              id={`ttd-tab-${item.key}`}
              role="tab"
              type="button"
              aria-selected={tab === item.key}
              aria-controls={`ttd-panel-${item.key}`}
              onClick={() => setTab(item.key)}
              style={{ minWidth: 82, height: 38, padding: "0 14px", border: 0, borderBottom: tab === item.key ? `2px solid ${C.blue}` : "2px solid transparent", color: tab === item.key ? C.blue : C.muted, background: "transparent", fontSize: 12.5, fontWeight: tab === item.key ? 650 : 500, cursor: "pointer" }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div role="tabpanel" id={`ttd-panel-${tab}`} aria-labelledby={`ttd-tab-${tab}`}>
          {tab === "overview" && <OverviewTab task={task} onOpenNodeResources={onOpenNodeResources} />}
          {tab === "monitor" && <MonitorTab />}
          {tab === "logs" && <LogsTab task={task} stopRequested={stopRequested} />}
        </div>
      </main>

      <style>{`
        .ttd-root, .ttd-root * { box-sizing: border-box; }
        .ttd-button, .ttd-back { transition: border-color .15s ease, background .15s ease, color .15s ease; }
        .ttd-button:not(:disabled):hover, .ttd-back:hover { border-color: #aeb8ca !important; background: #f9fafb !important; }
        .ttd-button:focus-visible, .ttd-back:focus-visible, .ttd-icon-button:focus-visible, .ttd-root select:focus-visible, .ttd-root input:focus-visible, .ttd-root [role="tab"]:focus-visible { outline: 2px solid #9fb0ff; outline-offset: 2px; }

        @media (max-width: 1080px) {
          .ttd-overview-grid, .ttd-chart-grid { grid-template-columns: 1fr !important; }
          .ttd-kpi-grid { grid-template-columns: repeat(3,minmax(0,1fr)) !important; }
          .ttd-strategy-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
        }

        @media (max-width: 820px) {
          .ttd-policy-grid { grid-template-columns: 1fr !important; }
          .ttd-allocation-grid { grid-template-columns: 1fr !important; }
          .ttd-allocation-arrow { height: 14px; transform: rotate(90deg); }
          .ttd-worker-table thead { display: none; }
          .ttd-worker-table, .ttd-worker-table tbody { min-width: 0 !important; display: block; width: 100%; }
          .ttd-worker-table tbody { padding: 10px; display: grid; gap: 8px; }
          .ttd-worker-table tr { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid ${C.line}; border-radius: 7px; overflow: hidden; }
          .ttd-worker-table td { min-width: 0; padding: 9px 10px !important; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid ${C.line} !important; overflow-wrap: anywhere; }
          .ttd-worker-table td::before { content: attr(data-label); flex: 0 0 auto; color: ${C.faint}; font-size: 10.5px; font-weight: 500; }
          .ttd-worker-table td:first-child { grid-column: 1 / -1; }
          .ttd-worker-table td:last-child { border-bottom: 0 !important; }
        }

        @media (max-width: 680px) {
          .ttd-root main { padding: 16px 12px 28px !important; }
          .ttd-page-head { flex-wrap: wrap; }
          .ttd-head-actions { width: 100%; padding-left: 46px; justify-content: flex-start !important; }
          .ttd-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .ttd-strategy-grid { grid-template-columns: 1fr !important; }
          .ttd-definition-list { grid-template-columns: 104px minmax(0,1fr) !important; }
          .ttd-log-row { grid-template-columns: 60px minmax(0,1fr) !important; }
          .ttd-log-row > span { display: none !important; }
        }

        @media (max-width: 480px) {
          .ttd-kpi-grid { grid-template-columns: 1fr !important; }
          .ttd-monitor-toolbar > label, .ttd-monitor-toolbar > label select { width: 100%; }
          .ttd-monitor-toolbar > label select { flex: 1; }
          .ttd-head-actions { padding-left: 0; }
          .ttd-head-actions .ttd-button { width: 100%; }
          .ttd-sort-label { display: none; }
          .ttd-table-toolbar > label { width: 100%; justify-content: space-between; }
          .ttd-worker-table tr { grid-template-columns: 1fr; }
          .ttd-worker-table td:first-child { grid-column: auto; }
          .ttd-definition-list { grid-template-columns: 1fr !important; gap: 4px !important; }
          .ttd-definition-list dd { margin-bottom: 8px !important; }
          .ttd-log-row { grid-template-columns: 1fr !important; }
          .ttd-log-row time { margin-bottom: -4px; }
        }
      `}</style>
    </div>
  );
}
