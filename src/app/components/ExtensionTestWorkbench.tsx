import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  Play,
  RotateCcw,
  TestTube2,
  X,
  XCircle,
} from "lucide-react";

export type ExtensionTestCategory = "unit" | "integration" | "performance";
export type ExtensionTestState = "pending" | "running" | "passed" | "failed" | "blocked";

export type ExtensionTestCaseResult = {
  id: string;
  category: ExtensionTestCategory;
  name: string;
  objective: string;
  expected: string;
  actual: string;
  state: ExtensionTestState;
  durationMs: number;
};

export type ExtensionTestStageResult = {
  key: ExtensionTestCategory;
  name: string;
  tool: string;
  description: string;
  state: ExtensionTestState;
  caseCount: number;
  passedCount: number;
  durationMs: number;
};

export type ExtensionPerformanceMetric = {
  key: string;
  label: string;
  value: string;
  scope: string;
  state: ExtensionTestState;
};

export type ExtensionTestReport = {
  extensionId: string;
  runId: string | null;
  status: ExtensionTestState;
  startedAt: string | null;
  completedAt: string | null;
  stages: ExtensionTestStageResult[];
  cases: ExtensionTestCaseResult[];
  metrics: ExtensionPerformanceMetric[];
  logs: string[];
};

export type ExtensionTestSubject = {
  id: string;
  name: string;
  type: string;
  version: string;
  fileName: string;
  debugState: "passed" | "failed" | "validating" | "pending";
};

type ExtensionTestWorkbenchProps = {
  extension: ExtensionTestSubject;
  initialReport?: ExtensionTestReport | null;
  onBack: () => void;
  onReportChange: (report: ExtensionTestReport) => void;
};

type TestCaseDefinition = Omit<ExtensionTestCaseResult, "state" | "durationMs" | "actual"> & {
  demoActual: string;
  demoDurationMs: number;
};

type TestStageDefinition = {
  key: ExtensionTestCategory;
  name: string;
  tool: string;
  description: string;
  cases: TestCaseDefinition[];
};

const C = {
  primary: "#4f6ef7",
  primarySoft: "#f3f6ff",
  ink: "#1a1d23",
  text: "#374151",
  muted: "#6b7280",
  faint: "#9ca3af",
  line: "#e0e3ed",
  lineSoft: "#eef0f5",
  panel: "#f8f9fc",
  green: "#16a34a",
  greenSoft: "#f0faf5",
  amber: "#d97706",
  amberSoft: "#fffbeb",
  red: "#dc2626",
  redSoft: "#fef2f2",
};

const surface: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: "#fff",
};

const compactButton: CSSProperties = {
  height: 32,
  padding: "0 12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  border: `1px solid ${C.line}`,
  borderRadius: 6,
  background: "#fff",
  color: C.text,
  fontSize: 11,
  fontWeight: 650,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const TEST_STAGES: TestStageDefinition[] = [
  {
    key: "unit",
    name: "单元测试",
    tool: "单元测试运行器",
    description: "验证扩展最小功能单元的输入、输出和异常处理。",
    cases: [
      { id: "UT-001", category: "unit", name: "标准输入输出", objective: "验证标准参数输入下的功能结果", expected: "输出结构与预期一致", demoActual: "输出字段及类型一致", demoDurationMs: 96 },
      { id: "UT-002", category: "unit", name: "边界参数处理", objective: "验证最小值、最大值和空值边界", expected: "边界值被正确处理", demoActual: "6 组边界数据全部通过", demoDurationMs: 104 },
      { id: "UT-003", category: "unit", name: "异常返回处理", objective: "验证非法输入时的错误返回", expected: "返回明确错误且不影响主流程", demoActual: "错误码和提示符合约定", demoDurationMs: 88 },
    ],
  },
  {
    key: "integration",
    name: "集成测试",
    tool: "集成测试运行器",
    description: "验证扩展加载、流程调用和结果回传的完整链路。",
    cases: [
      { id: "IT-001", category: "integration", name: "扩展加载与注册", objective: "验证框架能够发现并加载当前扩展", expected: "扩展注册成功且可被任务选择", demoActual: "扩展加载与注册成功", demoDurationMs: 168 },
      { id: "IT-002", category: "integration", name: "最小微调流程调用", objective: "验证扩展可接入标准最小流程", expected: "调用顺序和数据传递正确", demoActual: "4 个流程节点调用成功", demoDurationMs: 286 },
      { id: "IT-003", category: "integration", name: "结果回传与保存", objective: "验证执行结果和状态可回传", expected: "结果可查询且格式完整", demoActual: "结果摘要和状态已回传", demoDurationMs: 142 },
    ],
  },
  {
    key: "performance",
    name: "性能测试",
    tool: "性能基准测试工具",
    description: "生成启动耗时、吞吐、延迟和资源峰值指标。",
    cases: [
      { id: "PT-001", category: "performance", name: "扩展启动耗时", objective: "记录扩展初始化至可调用的耗时", expected: "生成启动耗时指标", demoActual: "已生成启动耗时指标", demoDurationMs: 324 },
      { id: "PT-002", category: "performance", name: "吞吐与 P95 延迟", objective: "执行固定用例集并统计处理效率", expected: "生成吞吐和 P95 延迟指标", demoActual: "固定用例集执行完成", demoDurationMs: 438 },
      { id: "PT-003", category: "performance", name: "资源峰值采集", objective: "采集测试期间的资源峰值", expected: "生成资源峰值指标", demoActual: "内存峰值已记录", demoDurationMs: 256 },
    ],
  },
];

const PERFORMANCE_METRICS: ExtensionPerformanceMetric[] = [
  { key: "startup", label: "启动耗时", value: "324 ms", scope: "原型示例值", state: "passed" },
  { key: "throughput", label: "处理吞吐", value: "128 条/秒", scope: "原型示例值", state: "passed" },
  { key: "latency", label: "P95 延迟", value: "46 ms", scope: "原型示例值", state: "passed" },
  { key: "memory", label: "内存峰值", value: "386 MB", scope: "原型示例值", state: "passed" },
];

const STATE_LABELS: Record<ExtensionTestState, string> = {
  pending: "待测试",
  running: "测试中",
  passed: "通过",
  failed: "未通过",
  blocked: "未执行",
};

function formatNow() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

function statusColor(state: ExtensionTestState) {
  if (state === "passed") return C.green;
  if (state === "failed") return C.red;
  if (state === "running") return C.amber;
  return C.muted;
}

function StatusIcon({ state, size = 14 }: { state: ExtensionTestState; size?: number }) {
  if (state === "passed") return <CheckCircle2 size={size} color={C.green} />;
  if (state === "failed") return <XCircle size={size} color={C.red} />;
  if (state === "running") return <Clock3 size={size} color={C.amber} />;
  return <Circle size={size} color={C.faint} />;
}

export function buildPendingExtensionTestReport(extensionId: string): ExtensionTestReport {
  return {
    extensionId,
    runId: null,
    status: "pending",
    startedAt: null,
    completedAt: null,
    stages: TEST_STAGES.map(stage => ({
      key: stage.key,
      name: stage.name,
      tool: stage.tool,
      description: stage.description,
      state: "pending",
      caseCount: stage.cases.length,
      passedCount: 0,
      durationMs: 0,
    })),
    cases: TEST_STAGES.flatMap(stage => stage.cases.map(testCase => ({
      id: testCase.id,
      category: testCase.category,
      name: testCase.name,
      objective: testCase.objective,
      expected: testCase.expected,
      actual: "—",
      state: "pending" as const,
      durationMs: 0,
    }))),
    metrics: PERFORMANCE_METRICS.map(metric => ({ ...metric, value: "—", state: "pending" })),
    logs: ["尚未开始测试。"],
  };
}

export function buildPassedExtensionTestReport(extensionId: string, completedAt = "2026-08-05 14:18:36"): ExtensionTestReport {
  const report = buildPendingExtensionTestReport(extensionId);
  return {
    ...report,
    runId: `TST-${extensionId.toUpperCase()}-001`,
    status: "passed",
    startedAt: completedAt,
    completedAt,
    stages: TEST_STAGES.map(stage => ({
      key: stage.key,
      name: stage.name,
      tool: stage.tool,
      description: stage.description,
      state: "passed",
      caseCount: stage.cases.length,
      passedCount: stage.cases.length,
      durationMs: stage.cases.reduce((sum, item) => sum + item.demoDurationMs, 0),
    })),
    cases: TEST_STAGES.flatMap(stage => stage.cases.map(testCase => ({
      id: testCase.id,
      category: testCase.category,
      name: testCase.name,
      objective: testCase.objective,
      expected: testCase.expected,
      actual: testCase.demoActual,
      state: "passed" as const,
      durationMs: testCase.demoDurationMs,
    }))),
    metrics: PERFORMANCE_METRICS,
    logs: ["自动化测试已完成，测试报告已生成。"],
  };
}

export function ExtensionTestWorkbench({ extension, initialReport, onBack, onReportChange }: ExtensionTestWorkbenchProps) {
  const [report, setReport] = useState<ExtensionTestReport>(() => initialReport ?? buildPendingExtensionTestReport(extension.id));
  const runToken = useRef(0);

  useEffect(() => () => {
    runToken.current += 1;
  }, []);

  const running = report.status === "running";
  const canStart = extension.debugState === "passed" && !running;
  const completedCases = report.cases.filter(item => item.state === "passed" || item.state === "failed").length;
  const progress = report.cases.length ? Math.round((completedCases / report.cases.length) * 100) : 0;
  const totalDuration = report.stages.reduce((sum, stage) => sum + stage.durationMs, 0);
  const currentStage = report.stages.find(stage => stage.state === "running");

  const commit = (next: ExtensionTestReport) => {
    setReport(next);
    onReportChange(next);
  };

  const startTest = async () => {
    if (!canStart) return;
    const token = ++runToken.current;
    let next: ExtensionTestReport = {
      ...buildPendingExtensionTestReport(extension.id),
      runId: `TST-${Date.now().toString().slice(-8)}`,
      status: "running",
      startedAt: formatNow(),
      logs: ["正在自动执行单元测试、集成测试和性能测试。"],
    };
    commit(next);

    for (const stage of TEST_STAGES) {
      if (runToken.current !== token) return;
      next = {
        ...next,
        stages: next.stages.map(item => item.key === stage.key ? { ...item, state: "running" } : item),
      };
      commit(next);
      await new Promise(resolve => setTimeout(resolve, 120));

      for (const testCase of stage.cases) {
        if (runToken.current !== token) return;
        next = {
          ...next,
          cases: next.cases.map(item => item.id === testCase.id ? { ...item, state: "running" } : item),
        };
        commit(next);
        await new Promise(resolve => setTimeout(resolve, 90));
        next = {
          ...next,
          cases: next.cases.map(item => item.id === testCase.id ? {
            ...item,
            state: "passed",
            actual: testCase.demoActual,
            durationMs: testCase.demoDurationMs,
          } : item),
        };
        commit(next);
      }

      next = {
        ...next,
        stages: next.stages.map(item => item.key === stage.key ? {
          ...item,
          state: "passed",
          passedCount: item.caseCount,
          durationMs: stage.cases.reduce((sum, item) => sum + item.demoDurationMs, 0),
        } : item),
      };
      commit(next);
    }

    if (runToken.current !== token) return;
    next = {
      ...next,
      status: "passed",
      completedAt: formatNow(),
      metrics: PERFORMANCE_METRICS,
      logs: ["自动化测试已完成，测试结果与性能指标报告已生成。"],
    };
    commit(next);
  };

  return (
    <>
      <div role="dialog" aria-modal="true" aria-label={`扩展测试 - ${extension.name} ${extension.version}`} onClick={() => !running && onBack()} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, color: C.ink, background: "rgba(17,24,39,.45)" }}>
        <main onClick={event => event.stopPropagation()} style={{ width: "min(920px,100%)", maxHeight: "88vh", overflowY: "auto", borderRadius: 10, background: "#fff", boxShadow: "0 24px 64px rgba(17,24,39,.25)" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 2, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: `1px solid ${C.lineSoft}`, background: "#fff" }}>
          <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 8, color: C.primary, background: C.primarySoft }}><TestTube2 size={17} /></span>
          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 720 }}>扩展测试 - {extension.name} {extension.version}</h2>
            <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 10.5 }}>{extension.type} · {extension.fileName}</p>
          </div>
          <button disabled={!canStart} onClick={startTest} style={{ ...compactButton, minWidth: 94, border: 0, background: canStart ? C.primary : "#d8dce8", color: "#fff", cursor: canStart ? "pointer" : "not-allowed" }}>
            {report.status === "passed" || report.status === "failed" ? <RotateCcw size={12} /> : <Play size={12} />}
            {running ? "测试中…" : report.status === "passed" || report.status === "failed" ? "重新测试" : "开始测试"}
          </button>
          <button aria-label="关闭测试弹窗" disabled={running} onClick={onBack} style={{ ...compactButton, width: 32, padding: 0, color: C.muted, cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.5 : 1 }}><X size={14} /></button>
        </div>

        <div style={{ padding: "12px 16px 16px" }}>

        {extension.debugState !== "passed" && <div style={{ marginBottom: 12, padding: "9px 11px", borderRadius: 7, color: extension.debugState === "failed" ? C.red : C.amber, background: extension.debugState === "failed" ? C.redSoft : C.amberSoft, fontSize: 11 }}>
          当前版本尚未调试通过，可查看测试工具和用例；调试通过后才能开始测试。
        </div>}

        <section style={{ ...surface, marginBottom: 12 }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.lineSoft}` }}><b style={{ fontSize: 12 }}>测试工具与用例</b><span style={{ marginLeft: 8, color: C.faint, fontSize: 10 }}>3 类工具 · {report.cases.length} 条用例</span></div>
          <div role="table" aria-label="测试工具与用例">
            {report.stages.map(stage => {
              const cases = report.cases.filter(item => item.category === stage.key);
              return <div role="row" key={stage.key} style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, borderBottom: `1px solid ${C.lineSoft}`, fontSize: 10.5 }}>
                <div role="cell"><span style={{ display: "block", marginBottom: 4, color: C.faint, fontSize: 9 }}>测试类型</span><b style={{ color: C.ink }}>{stage.name}</b></div>
                <div role="cell"><span style={{ display: "block", marginBottom: 4, color: C.faint, fontSize: 9 }}>测试工具</span><span style={{ color: C.text }}>{stage.tool}</span></div>
                <div role="cell"><span style={{ display: "block", marginBottom: 4, color: C.faint, fontSize: 9 }}>测试用例</span><details><summary style={{ color: C.primary, fontWeight: 650, cursor: "pointer" }}>查看 {cases.length} 条用例</summary><div style={{ marginTop: 6, color: C.muted, lineHeight: 1.55 }}>{cases.map(item => <div key={item.id}>{item.id} · {item.name}</div>)}</div></details></div>
                <div role="cell"><span style={{ display: "block", marginBottom: 4, color: C.faint, fontSize: 9 }}>结果</span><span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: statusColor(stage.state), fontWeight: 650 }}><StatusIcon state={stage.state} />{STATE_LABELS[stage.state]}{stage.state === "passed" ? ` ${stage.passedCount}/${stage.caseCount}` : ""}</span></div>
              </div>;
            })}
          </div>
        </section>

        <section style={surface}>
          <div style={{ padding: "11px 13px", display: "flex", alignItems: "center", gap: 7, borderBottom: `1px solid ${C.lineSoft}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}><FileText size={14} color={C.primary} /><b style={{ fontSize: 12.5 }}>测试结果与性能指标报告</b></div>
          </div>

          {report.status === "pending" && <div style={{ padding: "14px", color: C.faint, fontSize: 10.5 }}>完成测试后展示测试结果与性能指标报告。</div>}

          {running && <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><span style={{ color: C.amber, fontSize: 11.5, fontWeight: 700 }}>{currentStage ? `正在执行：${currentStage.name}` : "正在准备测试"}</span><span style={{ color: C.muted, fontSize: 10.5 }}>{completedCases}/{report.cases.length} 条用例</span></div>
            <div style={{ marginTop: 10, height: 7, overflow: "hidden", borderRadius: 99, background: C.lineSoft }}><div style={{ width: `${progress}%`, height: "100%", borderRadius: 99, background: C.primary, transition: "width .2s ease" }} /></div>
          </div>}

          {(report.status === "passed" || report.status === "failed") && <div style={{ padding: "14px" }}>
            <div style={{ marginBottom: 12, padding: "9px 11px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", borderRadius: 7, background: report.status === "passed" ? C.greenSoft : C.redSoft }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: report.status === "passed" ? C.green : C.red, fontSize: 11.5, fontWeight: 750 }}><StatusIcon state={report.status} />{report.status === "passed" ? "测试通过" : "测试未通过"}</span>
              <span style={{ color: C.muted, fontSize: 10.5 }}>{completedCases}/{report.cases.length} 条用例 · {totalDuration} ms · {report.completedAt}</span>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 11.5 }}>性能指标</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8 }}>
              {report.metrics.map(metric => <div key={metric.key} style={{ padding: "10px 11px", border: `1px solid ${C.lineSoft}`, borderRadius: 7, background: "#fbfcfe" }}><span style={{ display: "block", color: C.muted, fontSize: 9.5 }}>{metric.label}</span><b style={{ display: "block", marginTop: 4, color: C.ink, fontSize: 15 }}>{metric.value}</b><span style={{ display: "block", marginTop: 3, color: C.faint, fontSize: 9 }}>{metric.scope}</span></div>)}
            </div>
          </div>}
        </section>
        </div>
        </main>
      </div>

    </>
  );
}
