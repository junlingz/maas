import { useState, type CSSProperties, type ReactNode } from "react";
import {
  BookOpen, CircleHelp, Download, ExternalLink, FileCode2,
  ListChecks, Network, Play, Server,
} from "lucide-react";

const C = {
  ink: "#20242d", muted: "#667085", faint: "#98a2b3", line: "#e4e8ef",
  soft: "#f6f8fb", blue: "#4f6ef7", blueSoft: "#eef2ff", green: "#16a34a",
  greenSoft: "#ecfdf3", amber: "#c26a12", amberSoft: "#fff7e8", red: "#dc2626",
};

const panel: CSSProperties = {
  background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10,
  boxShadow: "0 2px 8px rgba(31,41,55,.025)",
};

function queryValue(key: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(key) ?? "";
}

function Button({ children, variant = "primary", onClick, icon, disabled, style }: {
  children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger";
  onClick?: () => void; icon?: ReactNode; disabled?: boolean; style?: CSSProperties;
}) {
  const styles: Record<string, CSSProperties> = {
    primary: { background: C.blue, border: `1px solid ${C.blue}`, color: "#fff" },
    secondary: { background: "#fff", border: "1px solid #d5dbe5", color: "#344054" },
    ghost: { background: "transparent", border: "1px solid transparent", color: C.blue },
    danger: { background: "#fff", border: "1px solid #fecaca", color: C.red },
  };
  return <button type="button" disabled={disabled} onClick={onClick} style={{
    height: 34, padding: "0 13px", borderRadius: 7, fontSize: 12.5, fontWeight: 650,
    cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center",
    justifyContent: "center", gap: 6, opacity: disabled ? .55 : 1, ...styles[variant], ...style,
  }}>{icon}{children}</button>;
}

function Tag({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "gray" | "red" }) {
  const tones = {
    blue: { bg: C.blueSoft, fg: C.blue }, green: { bg: C.greenSoft, fg: C.green },
    amber: { bg: C.amberSoft, fg: C.amber }, gray: { bg: "#f2f4f7", fg: C.muted },
    red: { bg: "#fef2f2", fg: C.red },
  }[tone];
  return <span style={{ display: "inline-flex", alignItems: "center", minHeight: 22, padding: "2px 8px", borderRadius: 999, background: tones.bg, color: tones.fg, fontSize: 11.5, fontWeight: 650 }}>{children}</span>;
}

function Page({ title, description, actions, children }: { title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return <div className="ar-page" style={{ height: "100%", overflow: "auto", background: C.soft }}>
    <div style={{ width: "100%", maxWidth: 1480, margin: "0 auto", padding: "22px 24px 36px" }}>
      <div className="ar-page-head" style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, color: C.ink, fontSize: 21, lineHeight: 1.35, fontWeight: 720 }}>{title}</h1>
          <p style={{ margin: "5px 0 0", color: C.muted, fontSize: 12.5, lineHeight: 1.6 }}>{description}</p>
        </div>
        {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>{actions}</div>}
      </div>
      {children}
    </div>
    <style>{`
      @media (max-width: 900px) {
        .ar-page-head { flex-direction: column; }
        .ar-grid-2, .ar-grid-3, .ar-grid-4 { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 560px) {
        .ar-page > div { padding: 16px 12px 28px !important; }
      }
    `}</style>
  </div>;
}

export function TrainingDocsPage() {
  const shot = queryValue("shot");
  const [tab, setTab] = useState(shot === "api" ? "API 参考" : shot === "notebook" ? "示例 Notebook" : "快速开始");
  const tabs = ["快速开始","功能指南","API 参考","示例 Notebook","常见问题"];
  return <Page title="技术支持" description="自回归预训练的在线文档、API 参考和可运行 Notebook 示例。" actions={<Button variant="secondary" icon={<ExternalLink size={13} />}>在新窗口打开</Button>}>
    <div className="ar-grid-2" style={{ ...panel, display: "grid", gridTemplateColumns: "210px minmax(0,1fr)", minHeight: 610, overflow: "hidden" }}><aside style={{ padding: 12, borderRight: `1px solid ${C.line}`, background: "#fbfcfe" }}>{tabs.map(x => <button key={x} type="button" onClick={() => setTab(x)} style={{ width: "100%", padding: "10px 11px", border: 0, borderRadius: 7, background: tab===x ? C.blueSoft : "transparent", color: tab===x ? C.blue : C.muted, textAlign: "left", fontSize: 12.5, fontWeight: tab===x ? 650 : 500, cursor: "pointer" }}>{x}</button>)}</aside><article style={{ padding: 22, minWidth: 0 }}>{tab==="API 参考" ? <ApiDocs /> : tab==="示例 Notebook" ? <NotebookDocs /> : <QuickDocs tab={tab} />}</article></div>
  </Page>;
}

function QuickDocs({ tab }: { tab: string }) {
  return <div><Tag tone="blue">{tab}</Tag><h2 style={{ margin: "12px 0 6px", color: C.ink, fontSize: 20 }}>创建第一个自回归预训练任务</h2><p style={{ color: C.muted, fontSize: 12.5, lineHeight: 1.8 }}>完成数据准备、网络配置、训练提交和评估报告查看，最快只需六个步骤。</p>{["1. 准备 UTF-8 TXT 语料","2. 选择 Decoder-only 架构","3. 配置网络结构与优化器","4. 选择资源并设置检查点","5. 上传 TSV 评估数据","6. 提交并进入任务监控"].map((x,i) => <div key={x} style={{ marginTop: 9, padding: 12, borderRadius: 8, border: `1px solid ${C.line}`, display: "flex", gap: 10, alignItems: "center" }}><span style={{ width: 24, height: 24, borderRadius: 99, background: i===0 ? C.blue : "#eef1f5", color: i===0 ? "#fff" : C.muted, display: "grid", placeItems: "center", fontSize: 11 }}>{i+1}</span><b style={{ color: C.ink, fontSize: 12.5 }}>{x.slice(3)}</b></div>)}<div style={{ marginTop: 16, padding: 13, borderRadius: 8, background: C.blueSoft, color: "#4052a8", fontSize: 12, lineHeight: 1.7 }}><CircleHelp size={15} style={{ verticalAlign: "middle", marginRight: 7 }} />默认值已经过 7B 模型验证；原始需求未限定的高级选项保持最简单的推荐配置。</div></div>;
}

function ApiDocs() {
  return <div><Tag tone="green">REST API v1</Tag><h2 style={{ margin: "12px 0 6px", color: C.ink, fontSize: 20 }}>训练任务 API</h2><p style={{ color: C.muted, fontSize: 12.5 }}>创建、查询、控制训练任务，以及获取指标、日志和评估报告。</p>{[["POST","/v1/training/jobs","创建训练任务"],["GET","/v1/training/jobs/{job_id}","查询任务详情"],["POST","/v1/training/jobs/{job_id}:pause","暂停任务"],["POST","/v1/training/jobs/{job_id}:resume","恢复任务"],["GET","/v1/training/jobs/{job_id}/metrics","获取训练指标"],["GET","/v1/training/jobs/{job_id}/logs","搜索服务端日志"],["GET","/v1/training/jobs/{job_id}/evaluations","获取评估结果"]].map(([m,p,d]) => <div key={p} style={{ display: "grid", gridTemplateColumns: "58px minmax(0,1fr) 150px", gap: 9, padding: "11px 0", borderBottom: `1px solid ${C.line}`, alignItems: "center" }}><Tag tone={m==="GET" ? "blue" : "green"}>{m}</Tag><code style={{ color: C.ink, fontSize: 11.5 }}>{p}</code><span style={{ color: C.muted, fontSize: 11.5 }}>{d}</span></div>)}<div style={{ marginTop: 16, borderRadius: 8, overflow: "hidden" }}><div style={{ padding: "8px 11px", background: "#202938", color: "#8ea2c0", fontSize: 11 }}>Python SDK</div><pre style={{ margin: 0, padding: 14, background: "#121721", color: "#c6d0df", fontSize: 11.5, lineHeight: 1.8, overflowX: "auto" }}>{`from maas import Client\nclient = Client(api_key=\"$MAAS_API_KEY\")\njob = client.training.create(config=\"ar-7b.yaml\")\nprint(job.id, job.status)`}</pre></div></div>;
}

function NotebookDocs() {
  return <div><div style={{ display: "flex", alignItems: "center" }}><div><Tag tone="amber">可运行示例</Tag><h2 style={{ margin: "12px 0 4px", color: C.ink, fontSize: 20 }}>自回归预训练 Notebook</h2><p style={{ margin: 0, color: C.muted, fontSize: 12.5 }}>环境已连接到演示工作区，可逐单元运行。</p></div><Button icon={<Play size={13} />} style={{ marginLeft: "auto" }}>全部运行</Button></div>{[["[1]","安装并初始化 SDK",`from maas import Client\nclient = Client()`],["[2]","上传训练数据",`dataset = client.datasets.upload(\n  \"./corpus.txt\", encoding=\"utf-8\"\n)`],["[3]","提交预训练任务",`job = client.training.create(\n  architecture=\"decoder-only\", dataset=dataset.id\n)`]].map(([n,t,c],i) => <div key={n} style={{ ...panel, marginTop: 13, overflow: "hidden" }}><div style={{ padding: "9px 11px", display: "flex", alignItems: "center", borderBottom: `1px solid ${C.line}` }}><span style={{ color: C.faint, fontSize: 11 }}>{n}</span><b style={{ marginLeft: 8, color: C.ink, fontSize: 12 }}>{t}</b><button type="button" style={{ marginLeft: "auto", width: 25, height: 25, border: 0, borderRadius: 6, background: C.blueSoft, color: C.blue, display: "grid", placeItems: "center" }}><Play size={12} /></button></div><pre style={{ margin: 0, padding: 13, background: "#121721", color: "#c6d0df", fontSize: 11.5, lineHeight: 1.7, overflowX: "auto" }}>{c}</pre>{i===0 && <div style={{ padding: 10, background: "#f8fafc", color: C.green, fontSize: 11 }}>✓ Connected to workspace: pretrain-demo</div>}</div>)}</div>;
}

export function TrainingAboutPage() {
  return <Page title="关于平台" description="平台技术白皮书、能力边界、版本信息与支持渠道。">
    <div style={{ ...panel, overflow: "hidden" }}><div style={{ padding: 24, color: "#fff", background: "linear-gradient(135deg,#27346d,#4f6ef7)", display: "flex", alignItems: "center", gap: 18 }}><span style={{ width: 58, height: 58, borderRadius: 14, background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center" }}><BookOpen size={28} /></span><div style={{ flex: 1 }}><span style={{ fontSize: 11.5, opacity: .75 }}>MaaS 技术白皮书 · 2026</span><h2 style={{ margin: "4px 0", fontSize: 20 }}>超大规模自回归预训练平台</h2><p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, opacity: .8 }}>覆盖模型架构、数据、分布式训练、自动评估、监控告警和任务治理。</p></div><Button variant="secondary" icon={<Download size={14} />}>下载 PDF 白皮书</Button></div><div className="ar-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, padding: 18 }}>{[["架构能力","BERT、T5、Decoder-only 与 MoE，可从零或基于已有模型训练。",<Network size={20} />],["训练治理","分布式资源、检查点、队列、监控、日志与告警统一管理。",<Server size={20} />],["评估闭环","训练中自动评估，报告支持样本对比与 PDF、CSV 导出。",<ListChecks size={20} />]].map(([t,d,ic]) => <div key={String(t)} style={{ padding: 16, border: `1px solid ${C.line}`, borderRadius: 9 }}><span style={{ color: C.blue }}>{ic}</span><b style={{ display: "block", marginTop: 11, color: C.ink, fontSize: 13 }}>{t}</b><p style={{ margin: "6px 0 0", color: C.muted, fontSize: 11.5, lineHeight: 1.7 }}>{d}</p></div>)}</div></div>
    <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}><div style={{ ...panel, padding: 16 }}><b style={{ color: C.ink, fontSize: 13 }}>平台信息</b><div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, color: C.muted, fontSize: 12 }}><span>平台版本</span><b style={{ color: C.ink }}>MaaS 3.6.0</b><span>训练引擎</span><b style={{ color: C.ink }}>Pretrain Engine 2.4</b><span>API 版本</span><b style={{ color: C.ink }}>v1</b></div></div><div style={{ ...panel, padding: 16 }}><b style={{ color: C.ink, fontSize: 13 }}>获取支持</b><p style={{ color: C.muted, fontSize: 11.5, lineHeight: 1.7 }}>工作日 09:00–18:00 提供平台技术支持；严重训练故障支持 7×24 小时响应。</p><div style={{ display: "flex", gap: 8 }}><Button variant="secondary" icon={<FileCode2 size={13} />}>提交工单</Button><Button variant="secondary" icon={<CircleHelp size={13} />}>查看常见问题</Button></div></div></div>
  </Page>;
}
