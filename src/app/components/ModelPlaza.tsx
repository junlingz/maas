import { useState, useMemo } from "react";
import { Search, RotateCcw, ArrowLeft, GitCompare, Copy, Check as CheckIcon } from "lucide-react";

// ─── Filter data ──────────────────────────────────────────────────────────────

const MODEL_TYPES = ["通用大模型", "预训练模型", "图像模型", "向量模型", "拟人模型", "代码模型", "推理模型"];
const MODEL_CAPS  = ["文生文", "文生图", "图生文", "文生视频", "文生音频", "向量模型", "音频生文", "语音生语音"];
const MODEL_VENDORS = ["智谱", "通义", "深度求索"];

// ─── Vendor logos ─────────────────────────────────────────────────────────────

const VENDOR_LOGO: Record<string, { bg: string; text: string; label: string }> = {
  "智谱":      { bg: "#1a1a1a", text: "#fff",    label: "Z"  },
  "通义":      { bg: "#7c3aed", text: "#fff",    label: "Q"  },
  "深度求索":  { bg: "#0ea5e9", text: "#fff",    label: "D"  },
  "百度":      { bg: "#2563eb", text: "#fff",    label: "文"  },
  "字节":      { bg: "#f97316", text: "#fff",    label: "B"  },
  "讯飞":      { bg: "#16a34a", text: "#fff",    label: "讯"  },
  "Anthropic": { bg: "#d97706", text: "#fff",    label: "A"  },
  "OpenAI":    { bg: "#111827", text: "#fff",    label: "O"  },
};

function VendorIcon({ vendor, size = 40 }: { vendor: string; size?: number }) {
  const cfg = VENDOR_LOGO[vendor] ?? { bg: "#6b7280", text: "#fff", label: vendor[0] };
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, background: cfg.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontWeight: 700, fontSize: size * 0.38, color: cfg.text,
      fontFamily: "system-ui, sans-serif", letterSpacing: -0.5,
    }}>
      {cfg.label}
    </div>
  );
}

// ─── Model card data ──────────────────────────────────────────────────────────

interface ModelCard {
  id: string;
  name: string;
  vendor: string;
  types: string[];     // 模型类型
  caps: string[];      // 模型能力
  paramSize: string;
  desc: string;
}

const ALL_MODELS: ModelCard[] = [
  {
    id: "pretrain-zh-en",
    name: "中英语言预训练模型",
    vendor: "智谱",
    types: ["预训练模型"],
    caps: ["文生文"],
    paramSize: "13B参数",
    desc: "融合中英双语语料深度预训练的语言模型，具备出色的中英文理解与生成能力，支持跨语言语义对齐、翻译、文本生成及情感分析等多种自然语言处理任务。",
  },
  {
    id: "pretrain-cognitive",
    name: "面向认知的预训练模型",
    vendor: "智谱",
    types: ["预训练模型"],
    caps: ["文生文"],
    paramSize: "7B参数",
    desc: "以认知科学为理论基础设计的预训练模型，强化了逻辑推理、知识关联与概念归纳能力，在因果分析、结构化输出和复杂问题求解场景中表现卓越。",
  },
  {
    id: "pretrain-multimodal",
    name: "多模态预训练模型",
    vendor: "智谱",
    types: ["预训练模型", "图像模型"],
    caps: ["文生文", "图生文"],
    paramSize: "9B参数",
    desc: "融合图像、文本、语音的统一多模态预训练模型，支持跨模态语义理解与生成，具备强大的图文匹配、视觉问答及多模态内容生成能力，可应用于智能客服、内容创作等场景。",
  },
  {
    id: "pretrain-tech-intel",
    name: "科技情报训练模型服务",
    vendor: "智谱",
    types: ["预训练模型"],
    caps: ["文生文"],
    paramSize: "7B参数",
    desc: "面向科技情报分析场景深度定制的预训练模型，支持专利解读、技术趋势预测、竞品分析与风险预警，广泛应用于研究机构、企业战略与政府科技管理部门。",
  },
  {
    id: "pretrain-education",
    name: "教育大模型预训练能力服务",
    vendor: "智谱",
    types: ["预训练模型"],
    caps: ["文生文"],
    paramSize: "7B参数",
    desc: "面向教育场景深度优化的预训练大模型，具备知识讲解、题目生成、学习规划、答疑辅导与个性化练习等核心能力，助力智能教学、自适应学习平台快速落地。",
  },
  {
    id: "glm-4.7",
    name: "GLM-4.7",
    vendor: "智谱",
    types: ["通用大模型"],
    caps: ["文生文"],
    paramSize: "7B参数",
    desc: "GLM-4.7 是智谱最新旗舰模型，更强的编程能力与更稳定的多步骤推理/执行能力。在执行复杂智能体任务提升明显，同时对话体验更流畅自然。",
  },
  {
    id: "glm-4-flash",
    name: "GLM-4-Flash",
    vendor: "智谱",
    types: ["通用大模型"],
    caps: ["文生文"],
    paramSize: "9B参数",
    desc: "GLM-4-Flash 是智谱面向高并发场景推出的轻量化模型，推理速度极快，在保持良好语言理解能力的同时大幅降低了推理成本。",
  },
  {
    id: "glm-4v",
    name: "GLM-4V",
    vendor: "智谱",
    types: ["图像模型"],
    caps: ["图生文"],
    paramSize: "9B参数",
    desc: "GLM-4V 是智谱多模态视觉语言模型，支持图像输入与理解，能够完成图像描述、视觉问答、图表分析等多种视觉推理任务。",
  },
  {
    id: "qwen3-0.6b",
    name: "Qwen3-0.6B",
    vendor: "通义",
    types: ["通用大模型"],
    caps: ["文生文"],
    paramSize: "0.6B参数",
    desc: "Qwen3 是 Qwen 系列大语言模型的最新一代。Qwen3 建立在海量训练数据之上，推理能力、指令遵循、智能体能力及多语言支持全面提升。",
  },
  {
    id: "qwen3-7b",
    name: "Qwen3-7B",
    vendor: "通义",
    types: ["通用大模型"],
    caps: ["文生文"],
    paramSize: "7B参数",
    desc: "Qwen3-7B 是通义千问第三代中型语言模型，具备出色的数学推理、代码生成和长文本理解能力，适合企业级多场景部署。",
  },
  {
    id: "qwen3-72b",
    name: "Qwen3-72B",
    vendor: "通义",
    types: ["通用大模型", "推理模型"],
    caps: ["文生文"],
    paramSize: "72B参数",
    desc: "Qwen3-72B 是通义千问系列旗舰大模型，在复杂推理、代码生成、数学及中英文理解等基准测试上达到业界领先水平。",
  },
  {
    id: "qwen-vl",
    name: "Qwen-VL-Max",
    vendor: "通义",
    types: ["图像模型"],
    caps: ["图生文", "文生文"],
    paramSize: "7B参数",
    desc: "Qwen-VL-Max 是通义千问多模态视觉模型，支持任意分辨率图像输入，具备强大的图像细节理解、OCR 及视觉推理能力。",
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek-R1",
    vendor: "深度求索",
    types: ["推理模型"],
    caps: ["文生文"],
    paramSize: "671B参数",
    desc: "DeepSeek-R1 是深度求索推出的强推理大模型，通过强化学习训练，在数学竞赛、代码挑战和科学推理任务上表现卓越。",
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek-V3",
    vendor: "深度求索",
    types: ["通用大模型"],
    caps: ["文生文"],
    paramSize: "671B参数",
    desc: "DeepSeek-V3 采用混合专家架构（MoE），以极低训练成本达到顶尖性能，在编程、数学和通用知识问答上全面超越同级模型。",
  },
  {
    id: "deepseek-coder",
    name: "DeepSeek-Coder-V2",
    vendor: "深度求索",
    types: ["代码模型"],
    caps: ["文生文"],
    paramSize: "236B参数",
    desc: "DeepSeek-Coder-V2 是专注代码生成与补全的大模型，支持 338 种编程语言，在 HumanEval 和 SWE-bench 等代码基准上达到行业最佳。",
  },
  {
    id: "cogvideox",
    name: "CogVideoX-5B",
    vendor: "智谱",
    types: ["图像模型"],
    caps: ["文生视频"],
    paramSize: "5B参数",
    desc: "CogVideoX 是智谱 AI 推出的视频生成大模型，支持高质量文本到视频合成，生成视频具有连贯的时序动态和丰富的视觉细节。",
  },
];

// ─── Tag button ───────────────────────────────────────────────────────────────

function TagBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12.5, fontWeight: active ? 500 : 400,
        padding: "3px 12px", borderRadius: 5,
        border: `1px solid ${active ? "#4f6ef7" : "#e0e3ed"}`,
        background: active ? "#4f6ef7" : "#fff",
        color: active ? "#fff" : "#374151",
        cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >{label}</button>
  );
}

// ─── Model card ───────────────────────────────────────────────────────────────

function ModelCardItem({ model, onCardClick, onApiClick, onExperience }: { model: ModelCard; onCardClick: () => void; onApiClick: () => void; onExperience: () => void }) {
  const tagColors: Record<string, { bg: string; text: string }> = {
    "通用大模型": { bg: "#eff4ff", text: "#4f6ef7" },
    "预训练模型": { bg: "#faf5ff", text: "#7c3aed" },
    "图像模型":   { bg: "#fff7ed", text: "#c2410c" },
    "向量模型":   { bg: "#f0fdf4", text: "#15803d" },
    "拟人模型":   { bg: "#fdf4ff", text: "#a21caf" },
    "代码模型":   { bg: "#f0f9ff", text: "#0369a1" },
    "推理模型":   { bg: "#fff1f2", text: "#be123c" },
    "文生文":     { bg: "#f8fafc", text: "#475569" },
    "文生图":     { bg: "#fdf2f8", text: "#9d174d" },
    "图生文":     { bg: "#f0fdfa", text: "#0f766e" },
    "文生视频":   { bg: "#fff7ed", text: "#c2410c" },
    "文生音频":   { bg: "#f5f3ff", text: "#6d28d9" },
    "向量模型能力": { bg: "#f0fdf4", text: "#15803d" },
    "音频生文":   { bg: "#fef9c3", text: "#854d0e" },
    "语音生语音": { bg: "#ecfeff", text: "#0e7490" },
  };

  const allTags = [...model.types, ...model.caps, model.paramSize];

  return (
    <div
      className="flex flex-col rounded-xl"
      style={{
        background: "#fff", border: "1px solid #e8ebf2",
        padding: "16px 18px 14px", transition: "box-shadow 0.2s, border-color 0.2s", cursor: "pointer",
      }}
      onClick={onCardClick}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(79,110,247,0.12)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "#c7d2fe";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = "#e8ebf2";
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <VendorIcon vendor={model.vendor} size={40} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1d23", lineHeight: 1.3 }}>{model.name}</div>
          <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 1 }}>{model.vendor}</div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {allTags.map((tag, i) => {
          const tc = tagColors[tag] ?? { bg: "#f3f4f6", text: "#6b7280" };
          return (
            <span key={`${tag}-${i}`} style={{
              fontSize: 11.5, fontWeight: 500, padding: "2px 8px", borderRadius: 4,
              background: tc.bg, color: tc.text,
            }}>{tag}</span>
          );
        })}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 12.5, color: "#6b7280", lineHeight: 1.7, flex: 1,
        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {model.desc}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: "1px solid #f0f2f7" }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onApiClick} style={{
          flex: 1, fontSize: 13, fontWeight: 500, color: "#4f6ef7",
          background: "#fff", border: "1px solid #4f6ef7",
          borderRadius: 7, padding: "7px 0", cursor: "pointer", transition: "background 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f5f8ff")}
          onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        >API说明</button>
        <button style={{
          flex: 1, fontSize: 13, fontWeight: 500, color: "#fff",
          background: "#4f6ef7", border: "none",
          borderRadius: 7, padding: "7px 0", cursor: "pointer", transition: "background 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
          onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}
          onClick={onExperience}
        >立即体验</button>
      </div>
    </div>
  );
}

// ─── Model detail page ────────────────────────────────────────────────────────

const MODEL_DETAIL: Record<string, { intro: string; bullets: string[]; apiEndpoint: string; apiDesc: string; params: { name: string; type: string; required: boolean; desc: string }[] }> = {
  "glm-4.7": {
    intro: "GLM-4.7 是智谱 AI 推出的最新旗舰语言大模型，采用全新架构与训练策略，在编程能力、多步骤推理和智能体执行能力上实现重大突破。模型在保持流畅对话体验的同时，大幅提升了复杂任务的完成质量，广泛适用于智能客服、内容创作、代码辅助、数据分析等企业级场景。",
    bullets: [
      "支持 128K 超长上下文窗口，单轮处理整本书级别文本",
      "编程能力显著提升，HumanEval 评分达到 87.3%",
      "多步骤推理执行准确率提升 40%，复杂智能体任务表现优异",
      "中英文双语理解和生成能力均衡，支持 26 种语言",
      "Function Calling 精准度提高，支持并行工具调用",
    ],
    apiEndpoint: "POST https://open.bigmodel.cn/api/paas/v4/chat/completions",
    apiDesc: "调用 GLM-4.7 模型进行对话补全。兼容 OpenAI Chat Completions API 格式，可使用标准 SDK 直接接入。",
    params: [
      { name: "model", type: "string", required: true, desc: '模型 ID，固定填写 "glm-4"' },
      { name: "messages", type: "array", required: true, desc: "对话消息列表，每条消息包含 role 和 content 字段" },
      { name: "temperature", type: "number", required: false, desc: "采样温度，范围 0~1，值越高输出越随机，默认 0.95" },
      { name: "max_tokens", type: "integer", required: false, desc: "生成的最大 token 数，默认 1024，最大 128000" },
      { name: "stream", type: "boolean", required: false, desc: "是否启用流式输出，默认 false" },
      { name: "top_p", type: "number", required: false, desc: "核采样参数，范围 0~1，与 temperature 二选一使用" },
    ],
  },
};

const DEFAULT_DETAIL = MODEL_DETAIL["glm-4.7"];


// ─── API Tab ─────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1.5"
      style={{ fontSize: 12.5, fontWeight: 500, color: copied ? "#16a34a" : "#6b7280", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, padding: "5px 12px", cursor: "pointer", flexShrink: 0, transition: "all 0.15s" }}>
      {copied ? <CheckIcon size={12} color="#16a34a" /> : <Copy size={12} />}
      {copied ? "已复制" : "复制"}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1d23", marginBottom: 16 }}>{children}</div>;
}

function InfoRow({ label, children, copyText }: { label: string; children: React.ReactNode; copyText?: string }) {
  return (
    <div className="flex items-start gap-0" style={{ padding: "12px 0", borderBottom: "1px solid #f5f7fa" }}>
      <div style={{ width: 100, fontSize: 13, color: "#9ca3af", flexShrink: 0, paddingTop: 1 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, color: "#1a1d23" }}>{children}</div>
      {copyText && (
        <div style={{ marginLeft: 16, flexShrink: 0 }}>
          <CopyButton text={copyText} />
        </div>
      )}
    </div>
  );
}

function Tag({ children, variant = "blue" }: { children: React.ReactNode; variant?: "blue" | "green" | "gray" }) {
  const cfg = {
    blue:  { bg: "#eff4ff", color: "#4f6ef7", border: "#c7d9ff" },
    green: { bg: "#f0faf5", color: "#16a34a", border: "#bbf7d0" },
    gray:  { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  }[variant];
  return (
    <span style={{ fontSize: 12.5, fontWeight: 500, padding: "3px 10px", borderRadius: 5, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, display: "inline-block" }}>
      {children}
    </span>
  );
}

const CURL_TEMPLATE = (modelKey: string) => `curl http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer xxxxx" \\
  -d '{
    "model": "${modelKey}",
    "messages": [
      {"role": "system", "content": "你是一个智能助手"},
      {"role": "user", "content": "你好，请介绍一下你自己"}
    ],
    "temperature": 0.7,
    "stream": true,
    "max_tokens": 2048
  }'`;

const REQUEST_PARAMS = [
  { name: "model",       type: "string",  required: true,  desc: (key: string) => <>模型标识，固定值"<span style={{ color: "#4f6ef7", fontFamily: "monospace" }}>{key}</span>"</> },
  { name: "messages",    type: "array",   required: true,  desc: () => <>对话历史，每项包含 role（system/user/assistant）与 content</> },
  { name: "temperature", type: "float",   required: false, desc: () => <>生成随机性，取值范围 0–1，默认 0.7；值越高输出越发散，越低越精准稳定</> },
  { name: "stream",      type: "boolean", required: false, desc: () => <>是否开启 SSE 流式返回，默认 true；开启后以数据流形式分段返回结果</> },
  { name: "max_tokens",  type: "integer", required: false, desc: () => <>模型最大生成 token 数，不填则使用模型默认上限</> },
];

const RETURN_FIELDS = [
  { name: "id",                      type: "string",  desc: "本次请求的唯一标识符" },
  { name: "object",                   type: "string",  desc: '对象类型，固定值 "chat.completion"' },
  { name: "created",                  type: "integer", desc: "请求创建时间（Unix 时间戳）" },
  { name: "model",                    type: "string",  desc: "本次使用的模型标识" },
  { name: "choices",                  type: "array",   desc: "模型生成的内容列表" },
  { name: "choices[].message",        type: "object",  desc: "生成消息，包含 role 与 content 字段" },
  { name: "choices[].finish_reason",  type: "string",  desc: '结束原因，stop / length / tool_calls' },
  { name: "usage",                    type: "object",  desc: "Token 用量统计" },
  { name: "usage.prompt_tokens",      type: "integer", desc: "输入 token 数" },
  { name: "usage.completion_tokens",  type: "integer", desc: "输出 token 数" },
  { name: "usage.total_tokens",       type: "integer", desc: "总 token 数" },
];

function ApiTabContent({ model }: { model: ModelCard }) {
  const modelKey = `${model.id}:10042:1781192133306`;
  const endpoint = "http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions";
  const headerText = "Authorization: Bearer xxxxx\nContent-Type: application/json";
  const curlCode = CURL_TEMPLATE(modelKey);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const copyCurl = () => {
    navigator.clipboard?.writeText(curlCode).catch(() => {});
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1800);
  };

  const thSt: React.CSSProperties = { padding: "10px 16px", textAlign: "left", fontSize: 12.5, fontWeight: 500, color: "#9ca3af", borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap" };
  const tdSt: React.CSSProperties = { padding: "12px 16px", fontSize: 13, borderBottom: "1px solid #f5f7fa", verticalAlign: "top" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ① 接口基础信息区 */}
      <div>
        <SectionTitle>接口基础信息</SectionTitle>
        <div style={{ border: "1px solid #e8ebf2", borderRadius: 10, overflow: "hidden", padding: "0 16px" }}>
          <InfoRow label="请求地址" copyText={endpoint}>
            <span style={{ fontFamily: "monospace", fontSize: 13, color: "#1a1d23" }}>{endpoint}</span>
          </InfoRow>
          <InfoRow label="请求方式">
            <Tag variant="blue">POST</Tag>
          </InfoRow>
          <InfoRow label="请求Header" copyText={headerText}>
            <div style={{ fontFamily: "monospace", fontSize: 12.5, color: "#374151", lineHeight: 1.8 }}>
              <div>Authorization: Bearer xxxxx</div>
              <div>Content-Type: application/json</div>
            </div>
          </InfoRow>
          <InfoRow label="Model Key" copyText={modelKey}>
            <span style={{ fontFamily: "monospace", fontSize: 12.5, background: "#f0f4ff", color: "#4f6ef7", padding: "3px 10px", borderRadius: 5, border: "1px solid #c7d9ff", display: "inline-block" }}>{modelKey}</span>
          </InfoRow>
          <InfoRow label="调用方式">
            <Tag variant="blue">SSE流式调用</Tag>
          </InfoRow>
          <InfoRow label="支持特性">
            <div className="flex items-center gap-2">
              <Tag variant="blue">多轮对话</Tag>
              <Tag variant="blue">工具调用</Tag>
            </div>
          </InfoRow>
        </div>
      </div>

      {/* ② CURL调用示例 */}
      <div>
        <SectionTitle>CURL 调用示例</SectionTitle>
        <div style={{ background: "#1a1d2e", borderRadius: 10, overflow: "hidden" }}>
          <div className="flex items-center justify-between" style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>bash</span>
            <button onClick={copyCurl} className="flex items-center gap-1.5"
              style={{ fontSize: 12, color: copiedCurl ? "#4ade80" : "rgba(255,255,255,0.45)", background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 5, padding: "3px 10px", cursor: "pointer" }}>
              {copiedCurl ? <CheckIcon size={11} /> : <Copy size={11} />}
              {copiedCurl ? "已复制" : "复制"}
            </button>
          </div>
          <pre style={{ margin: 0, padding: "16px 20px", fontSize: 12.5, color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 1.9, whiteSpace: "pre-wrap", overflowX: "auto" }}>
            <span style={{ color: "#94a3b8" }}># 发起对话请求</span>{"\n"}
            {curlCode.split("\n").map((line, i) => {
              // Color-highlight parts of the curl command
              if (line.includes("-H")) return <span key={i}><span style={{ color: "#f472b6" }}>  -H </span><span style={{ color: "#86efac" }}>{line.replace("  -H ", "")}</span>{"\n"}</span>;
              if (line.includes("-d")) return <span key={i}><span style={{ color: "#f472b6" }}>  -d </span><span style={{ color: "#fde68a" }}>'{"\n"}</span></span>;
              if (line.startsWith("curl")) return <span key={i}><span style={{ color: "#f472b6" }}>curl </span><span style={{ color: "#7dd3fc" }}>{line.replace("curl ", "")}</span>{"\n"}</span>;
              return <span key={i}>{line}{"\n"}</span>;
            })}
          </pre>
        </div>
      </div>

      {/* ③ 核心请求参数说明 */}
      <div>
        <SectionTitle>核心请求参数说明</SectionTitle>
        <div style={{ border: "1px solid #e8ebf2", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fc" }}>
                <th style={thSt}>参数名</th>
                <th style={thSt}>类型</th>
                <th style={thSt}>必填</th>
                <th style={{ ...thSt, width: "100%" }}>说明</th>
              </tr>
            </thead>
            <tbody>
              {REQUEST_PARAMS.map((p, i) => (
                <tr key={p.name} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfd" }}>
                  <td style={tdSt}><code style={{ fontFamily: "monospace", color: "#4f6ef7", fontWeight: 600, fontSize: 13 }}>{p.name}</code></td>
                  <td style={tdSt}><span style={{ fontSize: 12, fontFamily: "monospace", color: "#6b7280", background: "#f3f4f6", borderRadius: 4, padding: "2px 7px" }}>{p.type}</span></td>
                  <td style={{ ...tdSt, fontWeight: 600, color: p.required ? "#dc2626" : "#9ca3af", fontSize: 13 }}>{p.required ? "是" : "否"}</td>
                  <td style={{ ...tdSt, color: "#374151", lineHeight: 1.7 }}>{p.desc(modelKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ④ 返回结果与字段说明 */}
      <div>
        <SectionTitle>返回结果与字段说明</SectionTitle>
        <div style={{ border: "1px solid #e8ebf2", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fc" }}>
                <th style={thSt}>字段名</th>
                <th style={thSt}>类型</th>
                <th style={{ ...thSt, width: "100%" }}>说明</th>
              </tr>
            </thead>
            <tbody>
              {RETURN_FIELDS.map((f, i) => (
                <tr key={f.name} style={{ background: i % 2 === 0 ? "#fff" : "#fafbfd" }}>
                  <td style={tdSt}><code style={{ fontFamily: "monospace", color: "#4f6ef7", fontWeight: 600, fontSize: 13 }}>{f.name}</code></td>
                  <td style={tdSt}><span style={{ fontSize: 12, fontFamily: "monospace", color: "#6b7280", background: "#f3f4f6", borderRadius: 4, padding: "2px 7px" }}>{f.type}</span></td>
                  <td style={{ ...tdSt, color: "#374151", lineHeight: 1.7 }}>{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function ModelDetailPage({ model, onBack, initialTab = "intro", onExperience }: { model: ModelCard; onBack: () => void; initialTab?: "intro" | "api"; onExperience?: () => void }) {
  const [tab, setTab] = useState<"intro" | "api">(initialTab);
  const detail = MODEL_DETAIL[model.id] ?? DEFAULT_DETAIL;

  const tagColors: Record<string, { bg: string; text: string }> = {
    "通用大模型": { bg: "#eff4ff", text: "#4f6ef7" },
    "预训练模型": { bg: "#faf5ff", text: "#7c3aed" },
    "图像模型":   { bg: "#fff7ed", text: "#c2410c" },
    "向量模型":   { bg: "#f0fdf4", text: "#15803d" },
    "拟人模型":   { bg: "#fdf4ff", text: "#a21caf" },
    "代码模型":   { bg: "#f0f9ff", text: "#0369a1" },
    "推理模型":   { bg: "#fff1f2", text: "#be123c" },
    "文生文":     { bg: "#f8fafc", text: "#475569" },
    "文生图":     { bg: "#fdf2f8", text: "#9d174d" },
    "图生文":     { bg: "#f0fdfa", text: "#0f766e" },
    "文生视频":   { bg: "#fff7ed", text: "#c2410c" },
    "向量模型能力": { bg: "#f0fdf4", text: "#15803d" },
    "语音生语音": { bg: "#ecfeff", text: "#0e7490" },
  };

  const allTags = [...model.types, ...model.caps, model.paramSize];

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: "#f5f7fa", padding: "20px 24px 32px" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ marginBottom: 16, fontSize: 13, color: "#6b7280" }}>
        <button onClick={onBack} className="flex items-center gap-1.5"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#4f6ef7", fontSize: 13, padding: 0 }}>
          <ArrowLeft size={14} /> 模型广场
        </button>
        <span style={{ color: "#d1d5db" }}>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>{model.name}</span>
      </div>

      {/* Header card */}
      <div style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
        <div className="flex items-start justify-between gap-4">
          {/* Left: logo + name + tags + desc */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <VendorIcon vendor={model.vendor} size={44} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1d23" }}>{model.name}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{model.vendor}</div>
              </div>
            </div>
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {allTags.map((tag, i) => {
                const tc = tagColors[tag] ?? { bg: "#f3f4f6", text: "#6b7280" };
                return (
                  <span key={`${tag}-${i}`} style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 5, background: tc.bg, color: tc.text }}>
                    {tag}
                  </span>
                );
              })}
            </div>
            {/* Description */}
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8 }}>{model.desc}</div>
          </div>

          {/* Right: buttons */}
          <div className="flex items-center gap-2 flex-shrink-0" style={{ paddingTop: 4 }}>
            <button style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
              color: "#374151", background: "#fff", border: "1px solid #e0e3ed",
              borderRadius: 8, padding: "8px 16px", cursor: "pointer",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
            >
              <GitCompare size={14} /> 模型对比
            </button>
            <button style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500,
              color: "#fff", background: "#4f6ef7", border: "none",
              borderRadius: 8, padding: "8px 20px", cursor: "pointer",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
              onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}
              onClick={onExperience}
            >
              立即体验
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 12, overflow: "hidden" }}>
        <div className="flex" style={{ borderBottom: "1px solid #f0f2f7" }}>
          {(["intro", "api"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "13px 24px", fontSize: 14, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "#4f6ef7" : "#6b7280",
              background: "none", border: "none", cursor: "pointer",
              borderBottom: tab === t ? "2px solid #4f6ef7" : "2px solid transparent",
              marginBottom: -1, transition: "all 0.15s",
            }}>
              {t === "intro" ? "模型介绍" : "API说明"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "24px" }}>
          {tab === "intro" ? (
            <div>
              <p style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.9, marginBottom: 20 }}>
                {detail.intro}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {detail.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4f6ef7", flexShrink: 0, marginTop: 7 }} />
                    <span style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.8 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ApiTabContent model={model} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ModelPlazaPage({ onExperience }: { onExperience?: () => void }) {
  const [selTypes, setSelTypes]   = useState<Set<string>>(new Set());
  const [selCaps, setSelCaps]     = useState<Set<string>>(new Set());
  const [selVendors, setSelVendors] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModel, setDetailModel] = useState<ModelCard | null>(null);
  const [detailTab, setDetailTab] = useState<"intro" | "api">("intro");

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, val: string) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setFn(next);
  };

  const resetAll = () => {
    setSelTypes(new Set());
    setSelCaps(new Set());
    setSelVendors(new Set());
    setSearchText("");
    setSearchQuery("");
  };

  const filtered = useMemo(() => {
    return ALL_MODELS.filter(m => {
      if (selTypes.size > 0 && !m.types.some(t => selTypes.has(t))) return false;
      if (selCaps.size > 0 && !m.caps.some(c => selCaps.has(c))) return false;
      if (selVendors.size > 0 && !selVendors.has(m.vendor)) return false;
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [selTypes, selCaps, selVendors, searchQuery]);

  const hasFilter = selTypes.size > 0 || selCaps.size > 0 || selVendors.size > 0 || searchQuery;

  if (detailModel) {
    return <ModelDetailPage model={detailModel} initialTab={detailTab} onBack={() => { setDetailModel(null); setDetailTab("intro"); }} onExperience={onExperience} />;
  }

  return (
    <div className="flex flex-col h-full overflow-auto" style={{ background: "#f5f7fa", padding: "20px 24px 32px" }}>
      {/* Page title */}
      <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1d23", marginBottom: 16, letterSpacing: -0.3 }}>
        模型广场
      </div>

      {/* Filter box */}
      <div style={{
        background: "#fff", border: "1px solid #d0d7f5", borderRadius: 10,
        padding: "14px 16px", marginBottom: 14, position: "relative",
      }}>
        {/* Reset */}
        <button
          onClick={resetAll}
          title="重置筛选"
          style={{
            position: "absolute", top: 12, right: 12,
            background: hasFilter ? "#fff7ed" : "#f8f9fc",
            border: `1px solid ${hasFilter ? "#fed7aa" : "#e0e3ed"}`,
            borderRadius: 6, padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center",
          }}
        >
          <RotateCcw size={14} color={hasFilter ? "#f97316" : "#9ca3af"} />
        </button>

        {/* 模型类型 */}
        <div className="flex items-center gap-2 mb-2.5">
          <span style={{ fontSize: 13, fontWeight: 500, color: "#374151", width: 56, flexShrink: 0 }}>模型类型</span>
          <div className="flex flex-wrap gap-1.5">
            {MODEL_TYPES.map(t => (
              <TagBtn key={t} label={t} active={selTypes.has(t)} onClick={() => toggle(selTypes, setSelTypes, t)} />
            ))}
          </div>
        </div>

        {/* 模型能力 */}
        <div className="flex items-center gap-2 mb-2.5">
          <span style={{ fontSize: 13, fontWeight: 500, color: "#374151", width: 56, flexShrink: 0 }}>模型能力</span>
          <div className="flex flex-wrap gap-1.5">
            {MODEL_CAPS.map(c => (
              <TagBtn key={c} label={c} active={selCaps.has(c)} onClick={() => toggle(selCaps, setSelCaps, c)} />
            ))}
          </div>
        </div>

        {/* 模型厂商 */}
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 13, fontWeight: 500, color: "#374151", width: 56, flexShrink: 0 }}>模型厂商</span>
          <div className="flex flex-wrap gap-1.5">
            {MODEL_VENDORS.map(v => (
              <TagBtn key={v} label={v} active={selVendors.has(v)} onClick={() => toggle(selVendors, setSelVendors, v)} />
            ))}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center rounded-lg" style={{ background: "#fff", border: "1px solid #e0e3ed", height: 36, padding: "0 12px", flex: "0 0 260px" }}>
          <Search size={14} color="#9ca3af" style={{ marginRight: 8, flexShrink: 0 }} />
          <input
            type="text"
            placeholder="请输入模型名称"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && setSearchQuery(searchText)}
            style={{ fontSize: 13, border: "none", outline: "none", background: "transparent", width: "100%", color: "#1a1d23" }}
          />
        </div>
        <button
          onClick={() => setSearchQuery(searchText)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 500, color: "#fff",
            background: "#4f6ef7", border: "none", borderRadius: 7,
            padding: "0 20px", height: 36, cursor: "pointer",
          }}
        >
          <Search size={13} /> 查询
        </button>
      </div>

      {/* Results count */}
      {hasFilter && (
        <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 12 }}>
          共找到 <span style={{ color: "#4f6ef7", fontWeight: 600 }}>{filtered.length}</span> 个模型
        </div>
      )}

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl" style={{ background: "#fff", border: "1px solid #e8ebf2", padding: "64px 0", color: "#9ca3af" }}>
          <Search size={32} color="#d1d5db" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 500, color: "#6b7280" }}>未找到匹配的模型</div>
          <div style={{ fontSize: 12.5, marginTop: 4 }}>请调整筛选条件或搜索关键词</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {filtered.map(m => (
            <ModelCardItem
              key={m.id}
              model={m}
              onCardClick={() => { setDetailTab("intro"); setDetailModel(m); }}
              onApiClick={() => { setDetailTab("api"); setDetailModel(m); }}
              onExperience={onExperience}
            />
          ))}
        </div>
      )}
    </div>
  );
}
