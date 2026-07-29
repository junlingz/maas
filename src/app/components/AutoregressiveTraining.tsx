import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity, AlertTriangle, ArrowLeft, Bell, BookOpen, Box, Check, CheckCircle2,
  ChevronDown, CircleHelp, Clock3, Code2, Cpu, Database, Download, ExternalLink,
  FileCode2, FileText, Filter, Gauge, GitBranch, Layers3, ListChecks, LoaderCircle,
  Network, Pause, Play, Plus, RefreshCw, RotateCcw, Save, Search, Server, Settings2,
  ShieldCheck, SlidersHorizontal, SquareTerminal, Upload, X, Zap,
} from "lucide-react";
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const C = {
  ink: "#20242d", muted: "#667085", faint: "#98a2b3", line: "#e4e8ef",
  soft: "#f6f8fb", blue: "#4f6ef7", blueSoft: "#eef2ff", green: "#16a34a",
  greenSoft: "#ecfdf3", amber: "#c26a12", amberSoft: "#fff7e8", red: "#dc2626",
};

const panel: CSSProperties = {
  background: "#fff", border: `1px solid ${C.line}`, borderRadius: 10,
  boxShadow: "0 2px 8px rgba(31,41,55,.025)",
};

const input: CSSProperties = {
  width: "100%", height: 36, padding: "0 11px", border: "1px solid #d9dfe8",
  borderRadius: 7, background: "#fff", color: C.ink, fontSize: 13, outline: "none",
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
        .ar-wizard { grid-template-columns: 1fr !important; }
        .ar-steps { display: flex !important; overflow-x: auto; border-right: 0 !important; border-bottom: 1px solid ${C.line}; }
        .ar-step { min-width: 150px; }
        .ar-table-wrap { overflow-x: auto; }
        .ar-metric-grid { grid-template-columns: 1fr 1fr !important; }
      }
      @media (max-width: 560px) {
        .ar-page > div { padding: 16px 12px 28px !important; }
        .ar-metric-grid { grid-template-columns: 1fr !important; }
      }
    `}</style>
  </div>;
}

function Field({ label, value, suffix, hint }: { label: string; value: string; suffix?: string; hint?: string }) {
  return <label style={{ display: "block", minWidth: 0 }}>
    <span style={{ display: "block", marginBottom: 6, color: "#344054", fontSize: 12.5, fontWeight: 650 }}>{label}</span>
    <div style={{ position: "relative" }}><input value={value} readOnly style={{ ...input, paddingRight: suffix ? 62 : 11 }} />{suffix && <span style={{ position: "absolute", right: 10, top: 10, color: C.faint, fontSize: 11.5 }}>{suffix}</span>}</div>
    {hint && <span style={{ display: "block", marginTop: 5, color: C.faint, fontSize: 11.5 }}>{hint}</span>}
  </label>;
}

function ChoiceCard({ title, desc, selected, icon, tag }: { title: string; desc: string; selected?: boolean; icon: ReactNode; tag?: string }) {
  return <button type="button" style={{
    minHeight: 104, padding: 14, textAlign: "left", borderRadius: 9, cursor: "pointer",
    border: selected ? `1.5px solid ${C.blue}` : `1px solid ${C.line}`,
    background: selected ? "#f8faff" : "#fff", position: "relative",
  }}>
    {selected && <span style={{ position: "absolute", right: 10, top: 10, width: 18, height: 18, borderRadius: 99, display: "grid", placeItems: "center", background: C.blue, color: "#fff" }}><Check size={12} /></span>}
    <div style={{ color: selected ? C.blue : C.muted, marginBottom: 9 }}>{icon}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}><b style={{ color: C.ink, fontSize: 13 }}>{title}</b>{tag && <Tag tone="gray">{tag}</Tag>}</div>
    <p style={{ margin: "5px 0 0", color: C.muted, fontSize: 11.5, lineHeight: 1.55 }}>{desc}</p>
  </button>;
}

const wizardSteps = [
  { label: "模型与架构", hint: "来源与拓扑", icon: <Layers3 size={15} /> },
  { label: "数据集", hint: "上传与校验", icon: <Database size={15} /> },
  { label: "网络结构", hint: "层数与维度", icon: <Network size={15} /> },
  { label: "训练与资源参数", hint: "优化器与算力", icon: <SlidersHorizontal size={15} /> },
  { label: "评估设置", hint: "指标与频率", icon: <ListChecks size={15} /> },
  { label: "确认提交", hint: "检查与创建", icon: <ShieldCheck size={15} /> },
];

function ArchitectureStep() {
  return <div>
    <SectionTitle title="选择构建方式" desc="支持从零预训练，也可以基于已有模型继续训练。" />
    <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
      <ChoiceCard selected title="从零开始预训练" desc="创建新的词表、网络结构和随机初始化权重。" icon={<Zap size={20} />} tag="当前选择" />
      <ChoiceCard title="基于已有模型" desc="从模型库选择权重与配置，继续预训练或微调。" icon={<Box size={20} />} />
    </div>
    <SectionTitle title="模型架构" desc="三种主流 Transformer 拓扑均可直接配置。" />
    <div className="ar-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 22 }}>
      <ChoiceCard title="BERT" desc="Encoder-only，适合文本理解和表征学习。" icon={<GitBranch size={20} />} />
      <ChoiceCard title="T5" desc="Encoder-Decoder，适合文本到文本任务。" icon={<RefreshCw size={20} />} />
      <ChoiceCard selected title="Decoder-only" desc="自回归生成架构，适合大语言模型预训练。" icon={<Code2 size={20} />} tag="推荐" />
    </div>
    <div style={{ ...panel, padding: 15, display: "flex", gap: 14, alignItems: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: C.blueSoft, color: C.blue, display: "grid", placeItems: "center" }}><Network size={18} /></div>
      <div style={{ flex: 1 }}><b style={{ color: C.ink, fontSize: 13 }}>启用混合专家模型（MoE）</b><div style={{ marginTop: 3, color: C.muted, fontSize: 11.5 }}>按 Token 路由到 2 个专家，降低同等参数规模下的训练计算量。</div></div>
      <span style={{ width: 38, height: 22, borderRadius: 99, background: C.blue, padding: 3, display: "flex", justifyContent: "flex-end" }}><span style={{ width: 16, height: 16, borderRadius: 99, background: "#fff" }} /></span>
      <div style={{ width: 170 }}><Field label="专家数量" value="8" /></div>
      <div style={{ width: 170 }}><Field label="每 Token 激活专家" value="2" /></div>
    </div>
  </div>;
}

function DatasetStep() {
  return <div>
    <SectionTitle title="选择训练数据" desc="可从数据中心选择已有数据，也可上传 UTF-8 编码的 TXT 文件。" />
    <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(280px,.8fr)", gap: 14 }}>
      <div style={{ ...panel, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", borderBottom: `1px solid ${C.line}` }}><b style={{ color: C.ink, fontSize: 13 }}>已有数据集</b><div style={{ marginLeft: "auto", position: "relative", width: 210 }}><Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.faint }} /><input style={{ ...input, paddingLeft: 31 }} placeholder="搜索数据集" /></div></div>
        {["通用中文语料 v3", "代码语料精选集", "数学推理合成集"].map((name, i) => <div key={name} style={{ padding: "13px 14px", display: "grid", gridTemplateColumns: "32px 1fr auto", gap: 10, alignItems: "center", borderBottom: i < 2 ? `1px solid ${C.line}` : 0, background: i === 0 ? "#f8faff" : "#fff" }}>
          <span style={{ width: 18, height: 18, borderRadius: 99, border: i === 0 ? `5px solid ${C.blue}` : "1px solid #cbd2dc" }} />
          <div><b style={{ color: C.ink, fontSize: 12.5 }}>{name}</b><div style={{ color: C.faint, fontSize: 11.5, marginTop: 3 }}>{i === 0 ? "24.8 GB · 12,864,210 条 · TXT" : i === 1 ? "8.2 GB · 3,221,984 条 · TXT" : "5.6 GB · 1,840,300 条 · TXT"}</div></div>
          <Tag tone={i === 0 ? "green" : "gray"}>{i === 0 ? "校验通过" : "可用"}</Tag>
        </div>)}
      </div>
      <div style={{ ...panel, padding: 16 }}>
        <div style={{ minHeight: 128, border: "1px dashed #b9c3d2", borderRadius: 9, background: "#fbfcfe", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}><Upload size={23} color={C.blue} /><b style={{ marginTop: 9, color: C.ink, fontSize: 12.5 }}>拖拽 TXT 文件到此处</b><span style={{ marginTop: 4, color: C.faint, fontSize: 11.5 }}>UTF-8 编码，单文件最大 50 GB</span><Button variant="secondary" style={{ marginTop: 10, height: 30 }}>选择文件</Button></div>
        <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: C.greenSoft, border: "1px solid #c9efda" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={16} color={C.green} /><b style={{ color: C.green, fontSize: 12.5 }}>数据校验通过</b></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 11, color: C.muted, fontSize: 11.5 }}><span>编码：UTF-8</span><span>大小：24.8 GB</span><span>有效行：12,864,210</span><span>空行率：0.03%</span></div>
        </div>
      </div>
    </div>
    <div style={{ ...panel, marginTop: 14, padding: 15 }}><b style={{ color: C.ink, fontSize: 13 }}>数据统计</b><div className="ar-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 12 }}>{[["Token 总量","18.42B"],["平均序列长度","1,432"],["最长序列","8,192"],["去重率","96.8%"]].map(([k,v]) => <div key={k} style={{ padding: 12, borderRadius: 8, background: C.soft }}><span style={{ color: C.faint, fontSize: 11.5 }}>{k}</span><div style={{ color: C.ink, fontSize: 18, fontWeight: 720, marginTop: 4 }}>{v}</div></div>)}</div></div>
  </div>;
}

function NetworkStep() {
  const specs = [["Transformer 层数","32"],["隐藏层维度","4,096"],["注意力头数","32"],["KV 头数","8"],["词表大小","64,000"],["最大序列长度","8,192"],["FFN 中间维度","11,008"],["Dropout","0.0"]];
  return <div>
    <SectionTitle title="网络结构配置" desc="参数会实时校验并估算模型规模；未明确的结构参数采用推荐默认值。" />
    <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(290px,.75fr)", gap: 14 }}>
      <div style={{ ...panel, padding: 16 }}><div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{specs.map(([k,v]) => <Field key={k} label={k} value={v} hint={k === "最大序列长度" ? "必须不小于训练数据的截断长度" : undefined} />)}</div>
        <div style={{ marginTop: 16, paddingTop: 15, borderTop: `1px solid ${C.line}` }}><b style={{ color: C.ink, fontSize: 12.5 }}>位置编码</b><div style={{ display: "flex", gap: 9, marginTop: 9 }}>{["RoPE", "ALiBi", "绝对位置编码"].map((x,i) => <span key={x} style={{ padding: "7px 11px", borderRadius: 7, fontSize: 12, border: i===0 ? `1px solid ${C.blue}` : `1px solid ${C.line}`, background: i===0 ? C.blueSoft : "#fff", color: i===0 ? C.blue : C.muted }}>{x}</span>)}</div></div>
      </div>
      <div style={{ ...panel, overflow: "hidden" }}>
        <div style={{ padding: 15, color: "#fff", background: "linear-gradient(135deg,#3347a7,#4f6ef7)" }}><span style={{ opacity: .75, fontSize: 11.5 }}>预估模型规模</span><div style={{ fontSize: 29, fontWeight: 750, marginTop: 4 }}>7.18B</div><span style={{ fontSize: 11.5, opacity: .75 }}>参数 · BF16 约 14.4 GB</span></div>
        <div style={{ padding: 15 }}><b style={{ color: C.ink, fontSize: 12.5 }}>结构预览</b><div style={{ marginTop: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>{["LM Head · 64K","Decoder Block × 32","Grouped Query Attention","SwiGLU FFN","Token Embedding"].map((x,i) => <div key={x} style={{ width: `${92-i*5}%`, padding: "8px 10px", borderRadius: 7, textAlign: "center", background: i===1 ? C.blueSoft : C.soft, border: `1px solid ${i===1 ? "#cad3ff" : C.line}`, color: i===1 ? C.blue : C.muted, fontSize: 11.5, fontWeight: i===1 ? 650 : 500 }}>{x}</div>)}</div><div style={{ marginTop: 14, padding: 10, borderRadius: 7, background: C.greenSoft, color: C.green, fontSize: 11.5, display: "flex", gap: 7 }}><CheckCircle2 size={14} />所有维度均可整除，配置校验通过</div></div>
      </div>
    </div>
  </div>;
}

function ParametersStep() {
  return <div>
    <SectionTitle title="训练参数" desc="默认参数适配 7B Decoder-only 架构，可按实验需要调整。" />
    <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div style={{ ...panel, padding: 16 }}><b style={{ color: C.ink, fontSize: 13 }}>优化与调度</b><div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginTop: 14 }}><Field label="优化器" value="AdamW" /><Field label="基础学习率" value="0.0003" /><Field label="学习率调度" value="Cosine" /><Field label="Warmup 比例" value="0.03" /><Field label="权重衰减" value="0.1" /><Field label="梯度裁剪" value="1.0" /></div></div>
      <div style={{ ...panel, padding: 16 }}><b style={{ color: C.ink, fontSize: 13 }}>批次与精度</b><div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginTop: 14 }}><Field label="训练轮数" value="3" suffix="Epoch" /><Field label="Micro Batch" value="4" suffix="/ GPU" /><Field label="梯度累积步数" value="8" /><Field label="全局 Batch Size" value="256" /><Field label="混合精度" value="BF16" /><Field label="随机种子" value="42" /></div></div>
      <div style={{ ...panel, padding: 16 }}><b style={{ color: C.ink, fontSize: 13 }}>检查点</b><div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginTop: 14 }}><Field label="保存频率" value="1,000" suffix="步" /><Field label="最多保留" value="5" suffix="个" /><Field label="保存路径" value="/maas/checkpoints/ar-pretrain-7b" /><Field label="失败自动恢复" value="开启" /></div></div>
      <div style={{ ...panel, padding: 16 }}><b style={{ color: C.ink, fontSize: 13 }}>计算资源</b><div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginTop: 14 }}><Field label="资源池" value="A100 80G 训练池" /><Field label="节点数" value="2" /><Field label="每节点 GPU" value="8 × A100 80G" /><Field label="并行策略" value="TP 4 · PP 2 · DP 2" /></div><div style={{ marginTop: 13, display: "flex", alignItems: "center", gap: 8, color: C.green, fontSize: 11.5 }}><CheckCircle2 size={14} />资源可用，预计排队少于 2 分钟 · 训练约 46 小时</div></div>
    </div>
  </div>;
}

function EvaluationStep() {
  return <div>
    <SectionTitle title="训练评估设置" desc="评估与训练任务绑定，可按步数执行并在独立计算资源中运行。" />
    <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(300px,.85fr)", gap: 14 }}>
      <div style={{ ...panel, padding: 16 }}>
        <b style={{ color: C.ink, fontSize: 13 }}>评估指标</b><div style={{ color: C.faint, fontSize: 11.5, marginTop: 4 }}>原始需求指定的三个指标均为必选。</div>
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>{[["困惑度（PPL）","验证语言模型对样本序列的预测能力"],["生成流畅度","基于固定 Prompt 评估生成文本的连贯性"],["逻辑一致性","对生成结果与参考答案进行逻辑匹配"]].map(([k,d]) => <div key={k} style={{ padding: 12, border: `1px solid ${C.line}`, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 18, height: 18, borderRadius: 5, background: C.blue, color: "#fff", display: "grid", placeItems: "center" }}><Check size={12} /></span><div><b style={{ color: C.ink, fontSize: 12.5 }}>{k}</b><div style={{ color: C.faint, fontSize: 11.5, marginTop: 2 }}>{d}</div></div></div>)}</div>
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ ...panel, padding: 16 }}><b style={{ color: C.ink, fontSize: 13 }}>评估数据</b><div style={{ marginTop: 12, padding: 12, border: "1px dashed #b9c3d2", borderRadius: 8, background: "#fbfcfe", display: "flex", alignItems: "center", gap: 10 }}><FileText size={21} color={C.blue} /><div style={{ flex: 1 }}><b style={{ display: "block", color: C.ink, fontSize: 12 }}>validation_prompt_label.tsv</b><span style={{ color: C.faint, fontSize: 11 }}>TSV · prompt / label 两列 · 12,000 条</span></div><Tag tone="green">已校验</Tag></div></div>
        <div style={{ ...panel, padding: 16 }}><b style={{ color: C.ink, fontSize: 13 }}>执行策略</b><div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}><Field label="评估频率" value="每 1,000 步" /><Field label="任务结束评估" value="开启" /><Field label="评估 GPU" value="1 × A100" /><Field label="超时上限" value="60 分钟" /></div></div>
      </div>
    </div>
  </div>;
}

function ConfirmStep() {
  const groups = [
    ["模型与架构", "从零预训练 · Decoder-only · MoE 8 专家 / Top-2"],
    ["训练数据", "通用中文语料 v3 · 24.8 GB · 校验通过"],
    ["网络结构", "32 层 · 4096 隐藏维度 · 7.18B 参数"],
    ["训练参数", "AdamW · LR 3e-4 · BF16 · 3 Epoch"],
    ["计算资源", "2 节点 · 16 × A100 80G · TP4/PP2/DP2"],
    ["评估设置", "PPL / 生成流畅度 / 逻辑一致性 · 每 1,000 步"],
  ];
  return <div>
    <SectionTitle title="确认任务配置" desc="提交前执行数据、参数、资源和权限校验。" />
    <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(290px,.8fr)", gap: 14 }}>
      <div style={{ ...panel, overflow: "hidden" }}>{groups.map(([k,v],i) => <div key={k} style={{ display: "grid", gridTemplateColumns: "130px 1fr auto", gap: 12, alignItems: "center", padding: "13px 15px", borderBottom: i<groups.length-1 ? `1px solid ${C.line}` : 0 }}><b style={{ color: C.muted, fontSize: 12.5 }}>{k}</b><span style={{ color: C.ink, fontSize: 12.5 }}>{v}</span><Button variant="ghost" style={{ height: 28 }}>修改</Button></div>)}</div>
      <div style={{ ...panel, padding: 16 }}><b style={{ color: C.ink, fontSize: 13 }}>提交校验</b><div style={{ marginTop: 13, display: "grid", gap: 10 }}>{["数据格式与编码正确","网络结构参数合法","训练资源配额充足","输出路径无冲突","评估数据字段完整","当前用户具备创建权限"].map(x => <div key={x} style={{ display: "flex", gap: 8, alignItems: "center", color: C.muted, fontSize: 12 }}><CheckCircle2 size={15} color={C.green} />{x}</div>)}</div><div style={{ marginTop: 15, padding: 11, borderRadius: 8, background: C.greenSoft, color: C.green, fontSize: 12, fontWeight: 650 }}>全部检查通过，可以提交训练任务</div><Button icon={<Play size={14} />} style={{ width: "100%", marginTop: 12 }}>提交并进入监控</Button><div style={{ marginTop: 9, textAlign: "center", color: C.faint, fontSize: 11 }}>提交后将生成唯一任务 ID 并进入资源队列</div></div>
    </div>
  </div>;
}

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return <div style={{ marginBottom: 12 }}><h3 style={{ margin: 0, color: C.ink, fontSize: 14, fontWeight: 700 }}>{title}</h3>{desc && <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 11.5 }}>{desc}</p>}</div>;
}

function TrainingWizard({ initialStep, onBack }: { initialStep: number; onBack: () => void }) {
  const [step, setStep] = useState(initialStep);
  const contents = [<ArchitectureStep />, <DatasetStep />, <NetworkStep />, <ParametersStep />, <EvaluationStep />, <ConfirmStep />];
  return <Page title="创建自回归预训练任务" description="按六步完成模型架构、数据、网络、训练资源与评估配置。" actions={<Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={14} />}>返回任务列表</Button>}>
    <div className="ar-wizard" style={{ ...panel, display: "grid", gridTemplateColumns: "210px minmax(0,1fr)", minHeight: 640, overflow: "hidden" }}>
      <aside className="ar-steps" style={{ padding: 12, background: "#fbfcfe", borderRight: `1px solid ${C.line}` }}>{wizardSteps.map((x,i) => <button key={x.label} className="ar-step" type="button" onClick={() => setStep(i)} style={{ width: "100%", minHeight: 58, marginBottom: 4, padding: "9px 10px", display: "flex", gap: 9, alignItems: "center", textAlign: "left", cursor: "pointer", border: 0, borderRadius: 8, background: step===i ? C.blueSoft : "transparent" }}><span style={{ width: 27, height: 27, borderRadius: 99, display: "grid", placeItems: "center", background: step===i ? C.blue : i<step ? C.greenSoft : "#eef1f5", color: step===i ? "#fff" : i<step ? C.green : C.faint }}>{i<step ? <Check size={14} /> : x.icon}</span><span><b style={{ display: "block", color: step===i ? C.blue : C.ink, fontSize: 12 }}>{i+1}. {x.label}</b><span style={{ display: "block", color: C.faint, fontSize: 10.5, marginTop: 2 }}>{x.hint}</span></span></button>)}</aside>
      <section style={{ minWidth: 0, display: "flex", flexDirection: "column" }}><div style={{ flex: 1, padding: 20, minWidth: 0 }}>{contents[step]}</div><div style={{ padding: "12px 20px", borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", background: "#fff" }}><Button variant="secondary" disabled={step===0} onClick={() => setStep(v => Math.max(0,v-1))}>上一步</Button><div style={{ display: "flex", gap: 8 }}><Button variant="secondary" icon={<Save size={14} />}>保存草稿</Button>{step<5 ? <Button onClick={() => setStep(v => Math.min(5,v+1))}>下一步</Button> : <Button icon={<Play size={14} />}>提交并进入监控</Button>}</div></div></section>
    </div>
  </Page>;
}

const metricData = [
  { step: 0, loss: 6.8, val: 6.9, lr: 0.00, ppl: 98 }, { step: 1000, loss: 4.9, val: 5.1, lr: .30, ppl: 72 },
  { step: 2000, loss: 3.7, val: 3.9, lr: .28, ppl: 48 }, { step: 3000, loss: 2.9, val: 3.1, lr: .24, ppl: 33 },
  { step: 4000, loss: 2.4, val: 2.6, lr: .18, ppl: 24 }, { step: 5000, loss: 2.1, val: 2.3, lr: .12, ppl: 18 },
  { step: 6000, loss: 1.9, val: 2.1, lr: .07, ppl: 14 },
];

function MetricCard({ label, value, unit, trend, icon }: { label: string; value: string; unit?: string; trend?: string; icon: ReactNode }) {
  return <div style={{ ...panel, padding: 14, display: "flex", gap: 12, alignItems: "center" }}><span style={{ width: 34, height: 34, borderRadius: 8, background: C.blueSoft, color: C.blue, display: "grid", placeItems: "center" }}>{icon}</span><div><span style={{ color: C.faint, fontSize: 11.5 }}>{label}</span><div style={{ color: C.ink, fontSize: 19, fontWeight: 730, marginTop: 2 }}>{value}<small style={{ marginLeft: 3, fontSize: 11, color: C.muted }}>{unit}</small></div>{trend && <span style={{ color: C.green, fontSize: 10.5 }}>{trend}</span>}</div></div>;
}

function MetricsPanel() {
  return <div>
    <div className="ar-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}><MetricCard label="当前 Step" value="6,420" unit="/ 18,000" icon={<Activity size={17} />} /><MetricCard label="训练 Loss" value="1.86" trend="↓ 12.3% / 1k step" icon={<Gauge size={17} />} /><MetricCard label="验证 PPL" value="13.8" trend="最佳 13.6" icon={<ListChecks size={17} />} /><MetricCard label="吞吐率" value="2.41M" unit="tok/s" icon={<Zap size={17} />} /></div>
    <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(260px,.5fr)", gap: 12 }}>
      <div style={{ ...panel, padding: 15 }}><div style={{ display: "flex", alignItems: "center" }}><b style={{ color: C.ink, fontSize: 13 }}>损失曲线</b><Tag tone="green">实时 · 10 秒刷新</Tag></div><div style={{ width: "100%", height: 270, marginTop: 10 }}><ResponsiveContainer><LineChart data={metricData}><CartesianGrid stroke="#edf0f4" strokeDasharray="3 3" /><XAxis dataKey="step" tick={{ fontSize: 10, fill: C.faint }} /><YAxis tick={{ fontSize: 10, fill: C.faint }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /><Line isAnimationActive={false} type="monotone" dataKey="loss" name="训练 Loss" stroke={C.blue} strokeWidth={2} dot={false} /><Line isAnimationActive={false} type="monotone" dataKey="val" name="验证 Loss" stroke="#f59e0b" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div></div>
      <div style={{ display: "grid", gap: 12 }}><div style={{ ...panel, padding: 15 }}><b style={{ color: C.ink, fontSize: 13 }}>资源利用率</b>{[["GPU 利用率", "94%", C.blue],["显存占用", "72.4 / 80 GB", "#7c3aed"],["CPU 利用率", "68%", "#0f9f73"],["网络带宽", "318 Gbps", "#d97706"]].map(([k,v,c]) => <div key={k} style={{ marginTop: 13 }}><div style={{ display: "flex", justifyContent: "space-between", color: C.muted, fontSize: 11.5 }}><span>{k}</span><b style={{ color: C.ink }}>{v}</b></div><div style={{ marginTop: 5, height: 5, borderRadius: 99, background: "#edf0f4" }}><div style={{ height: "100%", width: k==="GPU 利用率" ? "94%" : k==="显存占用" ? "91%" : "68%", borderRadius: 99, background: c }} /></div></div>)}</div><div style={{ ...panel, padding: 14 }}><b style={{ color: C.ink, fontSize: 13 }}>自定义监控</b><div style={{ marginTop: 9, color: C.muted, fontSize: 11.5, lineHeight: 1.7 }}>已启用：梯度范数、Token 吞吐、MFU<br />刷新：10 秒 · 数据范围：最近 6 小时</div><Button variant="secondary" icon={<Settings2 size={13} />} style={{ marginTop: 10, width: "100%" }}>配置监控项</Button></div></div>
    </div>
  </div>;
}

function LogsPanel() {
  const lines = [
    "2026-07-19 14:32:10 [INFO] step=6418 loss=1.864 lr=7.2e-5 grad_norm=0.73 throughput=2.41M tok/s",
    "2026-07-19 14:32:18 [INFO] step=6419 loss=1.857 lr=7.2e-5 grad_norm=0.69 throughput=2.39M tok/s",
    "2026-07-19 14:32:26 [INFO] checkpoint validation started: ckpt-006400",
    "2026-07-19 14:32:34 [EVAL] ppl=13.8 fluency=4.42 consistency=91.6% samples=12000",
    "2026-07-19 14:32:42 [INFO] step=6420 loss=1.861 lr=7.1e-5 grad_norm=0.71 throughput=2.42M tok/s",
    "2026-07-19 14:32:50 [INFO] checkpoint saved to /maas/checkpoints/ar-pretrain-7b/ckpt-006400",
    "2026-07-19 14:32:58 [INFO] step=6421 loss=1.852 lr=7.1e-5 grad_norm=0.70 throughput=2.40M tok/s",
  ];
  return <div style={{ ...panel, overflow: "hidden" }}>
    <div style={{ padding: 12, borderBottom: `1px solid ${C.line}`, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}><div style={{ position: "relative", flex: 1, minWidth: 220 }}><Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.faint }} /><input style={{ ...input, paddingLeft: 31 }} placeholder="搜索日志内容、Step 或节点" /></div><Button variant="secondary" icon={<Filter size={13} />}>级别：全部</Button><Button variant="secondary" icon={<Download size={13} />}>导出完整日志</Button></div>
    <div style={{ padding: 14, background: "#121721", color: "#c6d0df", minHeight: 390, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 11.5, lineHeight: 2 }}>{lines.map((line,i) => <div key={line} style={{ color: line.includes("[EVAL]") ? "#7dd3fc" : line.includes("checkpoint") ? "#86efac" : "#c6d0df" }}><span style={{ display: "inline-block", width: 24, color: "#596579", userSelect: "none" }}>{i+1}</span>{line}</div>)}<span style={{ display: "inline-block", width: 7, height: 13, marginLeft: 25, background: "#8aa4ff", animation: "pulse 1s infinite" }} /></div>
    <div style={{ padding: "9px 12px", borderTop: "1px solid #263041", background: "#171e29", color: "#7f8ca0", fontSize: 10.5, display: "flex", gap: 15 }}><span>节点：worker-07</span><span>日志源：trainer.log</span><span style={{ marginLeft: "auto" }}>自动滚动：开启</span></div>
  </div>;
}

function EvaluationExecution() {
  const stages = [["加载检查点 ckpt-006400","完成","00:32"],["运行困惑度评估","完成","03:18"],["生成验证集结果","运行中","08:46"],["计算流畅度与逻辑一致性","等待","—"],["生成评估报告","等待","—"]];
  return <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 330px", gap: 12 }}>
    <div style={{ ...panel, overflow: "hidden" }}><div style={{ padding: 14, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center" }}><div><b style={{ color: C.ink, fontSize: 13 }}>自动评估 · Step 6,400</b><div style={{ color: C.faint, fontSize: 11, marginTop: 3 }}>任务 eval-train-20260719-06400</div></div><Tag tone="blue">运行中 58%</Tag></div>{stages.map(([name,status,time],i) => <div key={name} style={{ padding: "13px 15px", display: "grid", gridTemplateColumns: "28px 1fr auto auto", alignItems: "center", gap: 10, borderBottom: i<stages.length-1 ? `1px solid ${C.line}` : 0 }}><span style={{ width: 23, height: 23, borderRadius: 99, display: "grid", placeItems: "center", background: status==="完成" ? C.greenSoft : status==="运行中" ? C.blueSoft : "#f2f4f7", color: status==="完成" ? C.green : status==="运行中" ? C.blue : C.faint }}>{status==="完成" ? <Check size={13} /> : status==="运行中" ? <LoaderCircle size={13} style={{ animation: "spin 1.2s linear infinite" }} /> : i+1}</span><span style={{ color: C.ink, fontSize: 12.5 }}>{name}</span><span style={{ color: C.faint, fontSize: 11.5 }}>{time}</span><Tag tone={status==="完成" ? "green" : status==="运行中" ? "blue" : "gray"}>{status}</Tag></div>)}</div>
    <div style={{ display: "grid", gap: 12 }}><div style={{ ...panel, padding: 15 }}><b style={{ color: C.ink, fontSize: 13 }}>执行控制</b><div style={{ marginTop: 12, display: "flex", gap: 8 }}><Button variant="secondary" icon={<Pause size={13} />} style={{ flex: 1 }}>暂停评估</Button><Button variant="danger" icon={<X size={13} />} style={{ flex: 1 }}>终止</Button></div><div style={{ marginTop: 12, color: C.muted, fontSize: 11.5, lineHeight: 1.8 }}>训练任务继续运行，不会被独立评估阻塞。暂停后保留已完成的中间结果。</div></div><div style={{ ...panel, padding: 15 }}><b style={{ color: C.ink, fontSize: 13 }}>使用检查点</b><div style={{ marginTop: 10, padding: 11, borderRadius: 8, background: C.soft }}><b style={{ color: C.ink, fontSize: 12 }}>ckpt-006400</b><div style={{ color: C.faint, fontSize: 11, marginTop: 4 }}>14.4 GB · 2026-07-19 14:30</div></div><Button variant="ghost" icon={<RotateCcw size={13} />} style={{ marginTop: 8 }}>改用其他检查点重试</Button></div></div>
  </div>;
}

function EvaluationReport() {
  return <div>
    <div className="ar-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}><MetricCard label="困惑度 PPL" value="13.8" trend="较 Step 5,400 下降 8.4%" icon={<Gauge size={17} />} /><MetricCard label="生成流畅度" value="4.42" unit="/ 5" trend="达到通过阈值" icon={<Activity size={17} />} /><MetricCard label="逻辑一致性" value="91.6" unit="%" trend="较上一检查点 +2.1%" icon={<ListChecks size={17} />} /><MetricCard label="评估样本" value="12,000" unit="条" icon={<Database size={17} />} /></div>
    <div style={{ ...panel, marginTop: 12, overflow: "hidden" }}><div style={{ padding: 13, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center" }}><div><b style={{ color: C.ink, fontSize: 13 }}>样本结果</b><span style={{ marginLeft: 8, color: C.faint, fontSize: 11.5 }}>Prompt / 模型输出 / 参考答案</span></div><div style={{ marginLeft: "auto", display: "flex", gap: 8 }}><Button variant="secondary" icon={<Download size={13} />}>导出 CSV</Button><Button variant="secondary" icon={<FileText size={13} />}>下载 PDF 报告</Button></div></div><div className="ar-table-wrap"><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800, fontSize: 11.5 }}><thead><tr style={{ background: "#fafbfc", color: C.muted }}>{["Prompt","模型输出","参考答案","流畅度","逻辑一致性"].map(x => <th key={x} style={{ padding: "10px 12px", textAlign: "left", borderBottom: `1px solid ${C.line}` }}>{x}</th>)}</tr></thead><tbody>{[
      ["解释为什么天空呈蓝色。","太阳光进入大气后，短波长的蓝光更容易被空气分子散射……","瑞利散射使短波长蓝光在天空中更显著。","4.7","96%"],
      ["给出二分查找的时间复杂度。","每次将搜索区间减半，因此时间复杂度为 O(log n)。","O(log n)","4.9","100%"],
      ["概括《岳阳楼记》的核心思想。","文章借景抒情，表达先忧后乐的士大夫担当。","忧乐观与家国责任。","4.5","92%"],
    ].map((r,i) => <tr key={i}>{r.map((v,j) => <td key={j} style={{ padding: "11px 12px", borderBottom: i<2 ? `1px solid ${C.line}` : 0, color: j>2 ? C.green : C.ink, maxWidth: 280, lineHeight: 1.55 }}>{v}</td>)}</tr>)}</tbody></table></div></div>
  </div>;
}

function TaskDetail({ shot, onBack }: { shot: string; onBack: () => void }) {
  const initial = shot === "logs" ? "日志" : shot === "evaluation-run" ? "评估" : shot === "report" ? "评估报告" : "指标";
  const [tab, setTab] = useState(initial);
  const tabs = ["概览","指标","配置","评估","评估报告","操作记录","日志"];
  return <Page title="通用中文自回归预训练 7B" description="任务 ID：train-ar-20260719-001 · 创建人：张小明 · 创建于 2026-07-19 08:42" actions={<><Tag tone="blue">训练中 · 35.7%</Tag><Button variant="secondary" icon={<Pause size={13} />}>暂停训练</Button><Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={13} />}>返回</Button></>}>
    <div style={{ ...panel, marginBottom: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}><span style={{ color: C.muted, fontSize: 11.5 }}>Epoch 2 / 3</span><div style={{ flex: 1, minWidth: 180, height: 7, borderRadius: 99, background: "#edf0f4" }}><div style={{ width: "35.7%", height: "100%", borderRadius: 99, background: C.blue }} /></div><span style={{ color: C.ink, fontSize: 11.5, fontWeight: 650 }}>Step 6,420 / 18,000</span><span style={{ color: C.muted, fontSize: 11.5 }}>预计完成：07-21 06:55</span><Button variant="ghost" icon={<SquareTerminal size={13} />} onClick={() => setTab("日志")}>实时日志</Button></div>
    <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${C.line}`, marginBottom: 12, overflowX: "auto" }}>{tabs.map(x => <button key={x} type="button" onClick={() => setTab(x)} style={{ minWidth: 74, height: 38, padding: "0 12px", border: 0, borderBottom: tab===x ? `2px solid ${C.blue}` : "2px solid transparent", background: "transparent", color: tab===x ? C.blue : C.muted, fontSize: 12.5, fontWeight: tab===x ? 650 : 500, cursor: "pointer" }}>{x}</button>)}</div>
    {tab==="指标" ? <MetricsPanel /> : tab==="日志" ? <LogsPanel /> : tab==="评估" ? <EvaluationExecution /> : tab==="评估报告" ? <EvaluationReport /> : tab==="操作记录" ? <OperationsPanel /> : <TaskOverview tab={tab} />}
  </Page>;
}

function TaskOverview({ tab }: { tab: string }) {
  return <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{[tab==="配置" ? "模型与网络配置" : "任务摘要", "资源与输出"].map((title,i) => <div key={title} style={{ ...panel, padding: 16 }}><b style={{ color: C.ink, fontSize: 13 }}>{title}</b><div style={{ display: "grid", gridTemplateColumns: "135px 1fr", gap: "11px 14px", marginTop: 14, color: C.muted, fontSize: 12 }}>{(i===0 ? [["构建方式","从零预训练"],["模型架构","Decoder-only + MoE"],["参数规模","7.18B"],["训练数据","通用中文语料 v3"],["优化器","AdamW / Cosine"]] : [["资源池","A100 80G 训练池"],["计算资源","16 × A100 80G"],["并行策略","TP4 / PP2 / DP2"],["检查点","每 1,000 步"],["输出路径","/maas/models/ar-7b"]]).map(([k,v]) => <><span key={`${k}k`} style={{ color: C.faint }}>{k}</span><b key={`${k}v`} style={{ color: C.ink, fontWeight: 600 }}>{v}</b></>)}</div></div>)}</div>;
}

function OperationsPanel() {
  const ops = [["14:33:02","系统","自动评估","创建 Step 6,400 评估任务","成功"],["14:32:50","训练服务","保存检查点","ckpt-006400","成功"],["12:02:18","张小明","修改监控项","新增梯度范数与 MFU","成功"],["08:44:10","调度器","分配资源","2 节点 / 16 GPU","成功"],["08:42:31","张小明","创建任务","提交训练配置","成功"]];
  return <div style={{ ...panel, overflow: "hidden" }}><div style={{ padding: 13, borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center" }}><b style={{ color: C.ink, fontSize: 13 }}>操作记录</b><Button variant="secondary" icon={<Download size={13} />} style={{ marginLeft: "auto" }}>导出记录</Button></div><div className="ar-table-wrap"><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720, fontSize: 12 }}><thead><tr style={{ background: "#fafbfc", color: C.muted }}>{["时间","操作者","动作","详情","结果"].map(x => <th key={x} style={{ textAlign: "left", padding: "10px 13px", borderBottom: `1px solid ${C.line}` }}>{x}</th>)}</tr></thead><tbody>{ops.map((r,i) => <tr key={i}>{r.map((x,j) => <td key={j} style={{ padding: "11px 13px", color: j===4 ? C.green : C.ink, borderBottom: i<ops.length-1 ? `1px solid ${C.line}` : 0 }}>{x}</td>)}</tr>)}</tbody></table></div></div>;
}

function TaskList({ onCreate, onOpen }: { onCreate: () => void; onOpen: () => void }) {
  const tasks = [["通用中文自回归预训练 7B","train-ar-20260719-001","训练中","35.7%","16 × A100","张小明"],["代码能力继续预训练","train-ar-20260718-006","排队中","—","8 × A100","李娜"],["行业语料小模型实验","train-ar-20260717-014","已完成","100%","8 × H800","王强"],["长文本 13B 预训练","train-ar-20260716-009","已暂停","62.4%","32 × A100","张小明"]];
  return <Page title="自回归预训练" description="统一创建、查看与管理预训练任务；训练监控、评估和日志均在任务详情中闭环。" actions={<Button icon={<Plus size={14} />} onClick={onCreate}>创建预训练任务</Button>}>
    <div style={{ ...panel, overflow: "hidden" }}><div style={{ padding: 12, borderBottom: `1px solid ${C.line}`, display: "flex", gap: 8, flexWrap: "wrap" }}><div style={{ position: "relative", width: 290 }}><Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.faint }} /><input style={{ ...input, paddingLeft: 31 }} placeholder="搜索任务名称或任务 ID" /></div><Button variant="secondary" icon={<Filter size={13} />}>状态：全部</Button><Button variant="secondary" icon={<RefreshCw size={13} />}>刷新</Button></div><div className="ar-table-wrap"><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920, fontSize: 12 }}><thead><tr style={{ background: "#fafbfc", color: C.muted }}>{["任务名称","任务 ID","状态","进度","资源","创建人","操作"].map(x => <th key={x} style={{ textAlign: "left", padding: "10px 13px", borderBottom: `1px solid ${C.line}` }}>{x}</th>)}</tr></thead><tbody>{tasks.map((r,i) => <tr key={r[1]} style={{ background: i===0 ? "#fcfdff" : "#fff" }}>{r.map((x,j) => <td key={j} style={{ padding: "12px 13px", borderBottom: i<tasks.length-1 ? `1px solid ${C.line}` : 0, color: j===0 ? C.ink : C.muted, fontWeight: j===0 ? 650 : 400 }}>{j===2 ? <Tag tone={x==="训练中" ? "blue" : x==="已完成" ? "green" : x==="排队中" ? "amber" : "gray"}>{x}</Tag> : x}</td>)}<td style={{ padding: "12px 13px", borderBottom: i<tasks.length-1 ? `1px solid ${C.line}` : 0 }}><Button variant="ghost" onClick={onOpen}>查看详情</Button></td></tr>)}</tbody></table></div><div style={{ padding: 12, color: C.faint, fontSize: 11.5, textAlign: "right", borderTop: `1px solid ${C.line}` }}>共 4 项 · 第 1 / 1 页</div></div>
  </Page>;
}

export function AutoregressiveTrainingPage() {
  const shot = queryValue("shot");
  const stepMap: Record<string, number> = { architecture: 0, dataset: 1, network: 2, parameters: 3, evaluation: 4, confirm: 5 };
  const initialMode = shot in stepMap ? "create" : ["metrics","logs","evaluation-run","report"].includes(shot) ? "detail" : "list";
  const [mode, setMode] = useState(initialMode);
  if (mode === "create") return <TrainingWizard initialStep={stepMap[shot] ?? 0} onBack={() => setMode("list")} />;
  if (mode === "detail") return <TaskDetail shot={shot} onBack={() => setMode("list")} />;
  return <TaskList onCreate={() => setMode("create")} onOpen={() => setMode("detail")} />;
}

export function TrainingDataWorkbenchPage() {
  return <Page title="训练数据" description="管理预训练 TXT 语料，完成上传、UTF-8 编码校验、质量检查与统计分析。" actions={<Button icon={<Upload size={14} />}>上传 TXT 数据</Button>}><DatasetStep /></Page>;
}

export function TrainingTaskManagementPage() {
  const rows = [["通用中文自回归预训练 7B","运行中","P1","16 / 16","2.41M tok/s","无告警"],["代码能力继续预训练","排队中","P2","0 / 8","等待 01:42","配额等待"],["长文本 13B 预训练","已暂停","P1","0 / 32","—","用户暂停"],["行业语料小模型实验","已完成","P3","0 / 8","100%","无告警"]];
  return <Page title="任务管理" description="跨任务查看队列、资源、运行状态、操作记录与服务端日志。" actions={<><Button variant="secondary" icon={<Download size={13} />}>导出任务</Button><Button icon={<RefreshCw size={13} />}>刷新状态</Button></>}>
    <div className="ar-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}><MetricCard label="运行中" value="6" unit="项" icon={<Activity size={17} />} /><MetricCard label="排队中" value="3" unit="项" icon={<Clock3 size={17} />} /><MetricCard label="GPU 使用" value="64" unit="/ 96" icon={<Cpu size={17} />} /><MetricCard label="今日告警" value="2" unit="条" icon={<AlertTriangle size={17} />} /></div>
    <div style={{ ...panel, overflow: "hidden" }}><div style={{ padding: 12, borderBottom: `1px solid ${C.line}`, display: "flex", gap: 8, flexWrap: "wrap" }}><div style={{ position: "relative", flex: 1, minWidth: 240 }}><Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.faint }} /><input style={{ ...input, paddingLeft: 31 }} placeholder="搜索任务、ID、创建人或节点" /></div><Button variant="secondary">队列：全部 <ChevronDown size={12} /></Button><Button variant="secondary">资源池：全部 <ChevronDown size={12} /></Button></div><div className="ar-table-wrap"><table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", fontSize: 12 }}><thead><tr style={{ background: "#fafbfc", color: C.muted }}>{["任务","状态","优先级","GPU 分配","运行信息","告警","操作"].map(x => <th key={x} style={{ textAlign: "left", padding: "10px 13px", borderBottom: `1px solid ${C.line}` }}>{x}</th>)}</tr></thead><tbody>{rows.map((r,i) => <tr key={r[0]}>{r.map((x,j) => <td key={j} style={{ padding: "12px 13px", borderBottom: i<rows.length-1 ? `1px solid ${C.line}` : 0, color: j===0 ? C.ink : C.muted, fontWeight: j===0 ? 650 : 400 }}>{j===1 ? <Tag tone={x==="运行中" ? "blue" : x==="已完成" ? "green" : x==="排队中" ? "amber" : "gray"}>{x}</Tag> : j===5 && x!=="无告警" ? <Tag tone="amber">{x}</Tag> : x}</td>)}<td style={{ padding: "12px 13px", borderBottom: i<rows.length-1 ? `1px solid ${C.line}` : 0, whiteSpace: "nowrap" }}><Button variant="ghost">详情</Button><Button variant="ghost">日志</Button></td></tr>)}</tbody></table></div></div>
    <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}><OperationsPanel /><LogsPanel /></div>
  </Page>;
}

export function TrainingAlertCenterPage() {
  const alerts = [["严重","GPU 节点 worker-12 失联","长文本 13B 预训练","训练已自动暂停并保留 ckpt-011000","2 分钟前"],["警告","验证 Loss 连续 3 次未下降","通用中文自回归预训练 7B","建议检查学习率或提前停止","18 分钟前"],["提示","任务排队超过 30 分钟","代码能力继续预训练","A100 资源池当前繁忙","42 分钟前"]];
  return <Page title="告警中心" description="接收训练状态、资源异常、指标阈值和评估失败通知。" actions={<><Button variant="secondary" icon={<Settings2 size={13} />}>告警规则</Button><Button icon={<Check size={13} />}>全部标为已读</Button></>}>
    <div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 12 }}><div style={{ ...panel, overflow: "hidden" }}>{alerts.map((r,i) => <div key={r[1]} style={{ padding: 15, display: "grid", gridTemplateColumns: "30px 1fr auto", gap: 11, borderBottom: i<alerts.length-1 ? `1px solid ${C.line}` : 0, background: i===0 ? "#fffafb" : "#fff" }}><span style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: i===0 ? "#fef2f2" : i===1 ? C.amberSoft : C.blueSoft, color: i===0 ? C.red : i===1 ? C.amber : C.blue }}><AlertTriangle size={15} /></span><div><div style={{ display: "flex", gap: 7, alignItems: "center" }}><b style={{ color: C.ink, fontSize: 12.5 }}>{r[1]}</b><Tag tone={i===0 ? "red" : i===1 ? "amber" : "blue"}>{r[0]}</Tag></div><div style={{ marginTop: 5, color: C.muted, fontSize: 11.5 }}>任务：{r[2]}</div><div style={{ marginTop: 4, color: C.faint, fontSize: 11.5 }}>{r[3]}</div></div><span style={{ color: C.faint, fontSize: 11 }}>{r[4]}</span></div>)}</div><div style={{ ...panel, padding: 15 }}><b style={{ color: C.ink, fontSize: 13 }}>通知渠道</b>{[["站内通知","开启"],["邮件通知","开启"],["Webhook","未配置"]].map(([k,v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${C.line}`, color: C.muted, fontSize: 12 }}><span>{k}</span><Tag tone={v==="开启" ? "green" : "gray"}>{v}</Tag></div>)}<Button variant="secondary" style={{ width: "100%", marginTop: 13 }}>配置通知渠道</Button></div></div>
  </Page>;
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

export function TrainingModelLibraryPage() {
  const shot = queryValue("shot");
  const [modal, setModal] = useState(shot === "import" ? "import" : shot === "versions" ? "versions" : "");
  const models = useMemo(() => [["Qwen2.5-7B","v2.5.3","Decoder-only","7.6B","Alibaba Cloud","BF16 · Safetensors"],["DeepSeek-LLM-7B","v1.1.0","Decoder-only","7.0B","DeepSeek","BF16 · Safetensors"],["T5-Base-Chinese","v3.2.1","Encoder-Decoder","0.22B","MaaS Lab","FP32 · PyTorch"],["BERT-Base-Chinese","v1.4.2","Encoder-only","0.11B","MaaS Lab","FP32 · PyTorch"]], []);
  return <Page title="模型库" description="管理训练可用的模型权重、配置、词表、架构与版本。" actions={<Button icon={<Upload size={14} />} onClick={() => setModal("import")}>导入模型</Button>}>
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={{ position: "relative", width: 320 }}><Search size={14} style={{ position: "absolute", left: 10, top: 10, color: C.faint }} /><input style={{ ...input, paddingLeft: 31 }} placeholder="搜索模型名称、架构或开发者" /></div><Button variant="secondary">架构：全部 <ChevronDown size={12} /></Button><Button variant="secondary">格式：全部 <ChevronDown size={12} /></Button></div>
    <div className="ar-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>{models.map((m,i) => <article key={m[0]} style={{ ...panel, padding: 15, minHeight: 250, display: "flex", flexDirection: "column" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 42, height: 42, borderRadius: 9, display: "grid", placeItems: "center", color: "#fff", background: i===0 ? "linear-gradient(145deg,#ff5537,#ff7135)" : i===1 ? "linear-gradient(145deg,#079bd2,#18b7e8)" : "linear-gradient(145deg,#4267ef,#5668ff)" }}><Layers3 size={20} /></span><div style={{ minWidth: 0 }}><b style={{ display: "block", color: C.ink, fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m[0]}</b><span style={{ color: C.faint, fontSize: 11.5 }}>{m[4]}</span></div></div><div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "82px 1fr", gap: "9px 8px", color: C.faint, fontSize: 11.5 }}><span>当前版本</span><b style={{ color: C.ink }}>{m[1]}</b><span>模型架构</span><b style={{ color: C.ink }}>{m[2]}</b><span>参数量</span><b style={{ color: C.ink }}>{m[3]}</b><span>权重格式</span><b style={{ color: C.ink }}>{m[5]}</b></div><div style={{ marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${C.line}`, display: "flex" }}><Button variant="ghost" onClick={() => setModal("versions")}>版本记录</Button><Button variant="ghost">查看配置</Button><Button style={{ marginLeft: "auto" }}>用于训练</Button></div></article>)}</div>
    {modal && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 120, display: "grid", placeItems: "center", background: "rgba(25,32,44,.48)", padding: 16 }}><div style={{ width: modal==="import" ? "min(760px,calc(100vw - 32px))" : "min(640px,calc(100vw - 32px))", maxHeight: "calc(100vh - 32px)", overflow: "auto", borderRadius: 12, background: "#fff", boxShadow: "0 28px 80px rgba(15,23,42,.24)" }}><div style={{ padding: "15px 18px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center" }}><div><b style={{ color: C.ink, fontSize: 15 }}>{modal==="import" ? "导入训练模型" : "Qwen2.5-7B · 版本记录"}</b><div style={{ marginTop: 3, color: C.faint, fontSize: 11.5 }}>{modal==="import" ? "同时校验权重、配置和词表文件的完整性与兼容性" : "查看、选择或回滚历史模型版本"}</div></div><button type="button" onClick={() => setModal("")} style={{ marginLeft: "auto", border: 0, background: "transparent", color: C.faint, cursor: "pointer" }}><X size={18} /></button></div>{modal==="import" ? <ImportModel /> : <VersionHistory />}</div></div>}
  </Page>;
}

function ImportModel() {
  return <div style={{ padding: 18 }}><div className="ar-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}><Field label="模型名称" value="My-Decoder-7B" /><Field label="版本号" value="v1.0.0" /><Field label="模型架构" value="Decoder-only" /><Field label="权重精度" value="BF16" /></div><div className="ar-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 15 }}>{[["模型权重","model-00001.safetensors","14.4 GB"],["模型配置","config.json","2.6 KB"],["词表文件","tokenizer.json","6.8 MB"]].map(([t,n,s]) => <div key={t} style={{ padding: 13, border: "1px dashed #b9c3d2", borderRadius: 8, background: "#fbfcfe", textAlign: "center" }}><Upload size={18} color={C.blue} /><b style={{ display: "block", color: C.ink, fontSize: 12, marginTop: 7 }}>{t}</b><span style={{ display: "block", color: C.muted, fontSize: 10.5, marginTop: 5 }}>{n}</span><Tag tone="green">{s} · 已校验</Tag></div>)}</div><div style={{ marginTop: 14, padding: 13, borderRadius: 8, background: C.greenSoft, border: "1px solid #c9efda" }}><b style={{ color: C.green, fontSize: 12.5 }}>兼容性检查通过</b><div style={{ marginTop: 7, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, color: C.muted, fontSize: 11.5 }}><span>✓ 张量形状与 config 一致</span><span>✓ 词表大小 64,000</span><span>✓ 权重文件完整</span><span>✓ 支持继续预训练</span></div></div><div style={{ marginTop: 15, display: "flex", justifyContent: "flex-end", gap: 8 }}><Button variant="secondary">取消</Button><Button>确认导入</Button></div></div>;
}

function VersionHistory() {
  const versions = [["v2.5.3","当前版本","2026-07-12","优化长文本 RoPE，支持 128K"],["v2.5.2","稳定版","2026-06-20","修复 tokenizer 特殊 Token"],["v2.4.0","历史版本","2026-04-08","新增中文扩展词表"]];
  return <div style={{ padding: 18 }}>{versions.map((v,i) => <div key={v[0]} style={{ padding: 13, display: "grid", gridTemplateColumns: "86px 1fr auto", gap: 10, border: `1px solid ${i===0 ? "#cbd4ff" : C.line}`, borderRadius: 8, marginBottom: 9, background: i===0 ? "#f8faff" : "#fff" }}><div><b style={{ color: C.ink, fontSize: 13 }}>{v[0]}</b><div style={{ color: C.faint, fontSize: 10.5, marginTop: 4 }}>{v[2]}</div></div><div><Tag tone={i===0 ? "blue" : i===1 ? "green" : "gray"}>{v[1]}</Tag><div style={{ color: C.muted, fontSize: 11.5, marginTop: 6 }}>{v[3]}</div></div><Button variant={i===0 ? "secondary" : "ghost"}>{i===0 ? "查看配置" : "用于训练"}</Button></div>)}</div>;
}
