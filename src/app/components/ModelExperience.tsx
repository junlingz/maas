import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, ArrowUp, BookOpen, X, Copy, Check as CheckIcon, Square, Cpu } from "lucide-react";
import type { DeploymentRecord, ModelRecord } from "../model-management/types";

// ─── Mock responses ───────────────────────────────────────────────────────────

function getMockResponse(model: string, text: string): string {
  return `您好！我是**${model}**，很高兴为您服务。\n\n您的问题已收到，正在为您深度分析：\n\n> ${text}\n\n这是一个很好的问题。基于我的训练数据和专业能力，我为您提供以下分析与解答...\n\n如需更详细的说明，请继续追问。`;
}

// ─── API Drawer ───────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="flex items-center gap-1"
      style={{ fontSize: 12, color: copied ? "#16a34a" : "#6b7280", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 5, padding: "4px 10px", cursor: "pointer", flexShrink: 0 }}>
      {copied ? <CheckIcon size={11} color="#16a34a" /> : <Copy size={11} />}
      {copied ? "已复制" : "复制"}
    </button>
  );
}

function ApiDrawer({ model, onClose }: { model: string; onClose: () => void }) {
  const modelKey = `${model.toLowerCase().replace(/\s+/g, "-")}:10042:1781192133306`;
  const endpoint = "http://maas-front-prod.zhipuaidemo.cn/v1/chat/completions";

  const row = (label: string, content: React.ReactNode, copyText?: string) => (
    <div className="flex items-start" style={{ padding: "12px 0", borderBottom: "1px solid #f5f7fa" }}>
      <div style={{ width: 88, fontSize: 12.5, color: "#9ca3af", flexShrink: 0, paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13 }}>{content}</div>
      {copyText && <CopyBtn text={copyText} />}
    </div>
  );

  const tag = (t: string) => (
    <span style={{ fontSize: 12.5, fontWeight: 500, padding: "2px 10px", borderRadius: 5, background: "#eff4ff", color: "#4f6ef7", border: "1px solid #c7d9ff", marginRight: 6 }}>{t}</span>
  );

  const PARAMS = [
    { name: "model",       type: "string",  req: true,  desc: `模型标识，固定值 "${modelKey}"` },
    { name: "messages",    type: "array",   req: true,  desc: "对话历史，每项含 role（system/user/assistant）与 content" },
    { name: "temperature", type: "float",   req: false, desc: "生成随机性，范围 0–1，默认 0.7" },
    { name: "stream",      type: "boolean", req: false, desc: "是否启用 SSE 流式返回，默认 true" },
    { name: "max_tokens",  type: "integer", req: false, desc: "最大生成 token 数，不填使用模型默认上限" },
  ];

  const curlCode = `curl ${endpoint} \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -d '{\n    "model": "${modelKey}",\n    "messages": [{"role": "user", "content": "你好"}],\n    "stream": true\n  }'`;

  const thSt: React.CSSProperties = { padding: "9px 12px", textAlign: "left", fontSize: 12, fontWeight: 500, color: "#9ca3af", borderBottom: "1px solid #f0f2f7", whiteSpace: "nowrap" };
  const tdSt: React.CSSProperties = { padding: "10px 12px", fontSize: 12.5, borderBottom: "1px solid #f5f7fa", verticalAlign: "top" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 520, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "16px 20px", borderBottom: "1px solid #f0f2f7" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23" }}>API 说明</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{model}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: "16px 20px" }}>
          {/* 基础信息 */}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d23", marginBottom: 12 }}>接口基础信息</div>
          <div style={{ border: "1px solid #e8ebf2", borderRadius: 10, padding: "0 14px", marginBottom: 24 }}>
            {row("请求地址", <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>{endpoint}</span>, endpoint)}
            {row("请求方式", <span style={{ fontSize: 12.5, fontWeight: 600, background: "#eff4ff", color: "#4f6ef7", padding: "2px 8px", borderRadius: 4 }}>POST</span>)}
            {row("请求Header",
              <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.9 }}>
                <div>Authorization: Bearer YOUR_API_KEY</div>
                <div>Content-Type: application/json</div>
              </div>,
              "Authorization: Bearer YOUR_API_KEY\nContent-Type: application/json"
            )}
            {row("Model Key", <span style={{ fontFamily: "monospace", fontSize: 12, background: "#f0f4ff", color: "#4f6ef7", padding: "3px 8px", borderRadius: 4, border: "1px solid #c7d9ff" }}>{modelKey}</span>, modelKey)}
            {row("调用方式", tag("SSE流式调用"))}
            {row("支持特性", <>{tag("多轮对话")}{tag("工具调用")}</>)}
          </div>

          {/* CURL 示例 */}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d23", marginBottom: 12 }}>CURL 调用示例</div>
          <div style={{ background: "#1a1d2e", borderRadius: 10, marginBottom: 24, overflow: "hidden" }}>
            <div className="flex items-center justify-between" style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>bash</span>
              <CopyBtn text={curlCode} />
            </div>
            <pre style={{ margin: 0, padding: "14px 16px", fontSize: 12, color: "#e2e8f0", fontFamily: "monospace", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{curlCode}</pre>
          </div>

          {/* 参数说明 */}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1d23", marginBottom: 12 }}>核心请求参数</div>
          <div style={{ border: "1px solid #e8ebf2", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: "#f8f9fc" }}>
                {["参数名","类型","必填","说明"].map(h => <th key={h} style={thSt}>{h}</th>)}
              </tr></thead>
              <tbody>
                {PARAMS.map(p => (
                  <tr key={p.name}>
                    <td style={tdSt}><code style={{ fontFamily: "monospace", color: "#4f6ef7", fontWeight: 600 }}>{p.name}</code></td>
                    <td style={tdSt}><span style={{ fontFamily: "monospace", fontSize: 11.5, background: "#f3f4f6", color: "#6b7280", borderRadius: 3, padding: "1px 6px" }}>{p.type}</span></td>
                    <td style={{ ...tdSt, fontWeight: 600, color: p.req ? "#dc2626" : "#9ca3af" }}>{p.req ? "是" : "否"}</td>
                    <td style={{ ...tdSt, color: "#374151" }}>{p.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ModelExperiencePageProps {
  deployments: DeploymentRecord[];
  models: ModelRecord[];
  initialModel?: string | null;
}

interface Message { id: number; role: "user" | "assistant"; content: string; }

export function ModelExperiencePage({ deployments, models, initialModel }: ModelExperiencePageProps) {
  // Available running LLM model names (deduped, preserves first-seen order)
  const availableModels = Array.from(new Set(
    deployments
      .filter(d => d.status === "running" && models.find(m => m.id === d.modelId)?.category === "LLM")
      .map(d => d.modelName)
  ));

  const [model, setModel]               = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [query, setQuery]               = useState("");
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [showApi, setShowApi]           = useState(false);

  const bottomRef     = useRef<HTMLDivElement>(null);
  const selectorRef   = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const stopRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Pre-select model from initialModel when it matches a running LLM deployment
  useEffect(() => {
    if (!initialModel) return;
    if (availableModels.includes(initialModel)) {
      setModel(initialModel);
      setMessages([]);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialModel]);

  // Close selector on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) setSelectorOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = query.trim()
    ? availableModels.filter(m => m.toLowerCase().includes(query.trim().toLowerCase()))
    : availableModels;

  const selectModel = (m: string) => {
    setModel(m);
    setSelectorOpen(false);
    setQuery("");
    setMessages([]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const stop = () => {
    if (stopRef.current) { clearTimeout(stopRef.current); stopRef.current = null; }
    setLoading(false);
  };

  const send = (text = input.trim()) => {
    if (!text || loading || !model) return;
    setMessages(m => [...m, { id: Date.now(), role: "user", content: text }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    stopRef.current = setTimeout(() => {
      setMessages(m => [...m, { id: Date.now() + 1, role: "assistant", content: getMockResponse(model, text) }]);
      setLoading(false);
      stopRef.current = null;
    }, 900);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const sendDisabled = !model || !input.trim();

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-shrink-0" style={{ padding: "12px 24px 0", fontSize: 13, color: "#9ca3af" }}>
        <span style={{ color: "#4f6ef7" }}>体验中心</span>
        <span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>模型体验</span>
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "10px 24px 0" }}>
        {/* Left: model selector with search dropdown */}
        <div ref={selectorRef} style={{ position: "relative" }}>
          <button onClick={() => setSelectorOpen(o => !o)} className="flex items-center gap-2"
            style={{ height: 32, padding: "0 12px", fontSize: 13, fontWeight: 500, color: model ? "#1a1d23" : "#9ca3af", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 7, cursor: "pointer", minWidth: 240, justifyContent: "space-between" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
            onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
            <span className="flex items-center gap-2">
              <Search size={14} color="#9ca3af" />
              {model ?? "请选择模型"}
            </span>
            {selectorOpen ? <ChevronUp size={13} color="#9ca3af" /> : <ChevronDown size={13} color="#9ca3af" />}
          </button>

          {selectorOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", border: "1px solid #e0e3ed", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 200, minWidth: 260, maxHeight: "60vh", overflowY: "auto" }}>
              {/* Search input */}
              <div style={{ padding: 10, borderBottom: "1px solid #f0f2f7", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                <div className="flex items-center gap-2" style={{ height: 30, padding: "0 10px", background: "#f5f7fa", borderRadius: 7 }}>
                  <Search size={13} color="#9ca3af" />
                  <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="搜索模型"
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#1a1d23" }} />
                </div>
              </div>

              {/* Model list */}
              {filtered.length === 0 ? (
                <div style={{ padding: "20px 16px", fontSize: 13, color: "#9ca3af", textAlign: "center" }}>暂无匹配模型</div>
              ) : (
                filtered.map(m => {
                  const selected = m === model;
                  return (
                    <div key={m} onClick={() => selectModel(m)}
                      style={{ padding: "10px 16px", fontSize: 13, cursor: "pointer", color: selected ? "#4f6ef7" : "#374151", fontWeight: selected ? 600 : 400, background: selected ? "#f5f8ff" : "#fff" }}
                      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = selected ? "#f5f8ff" : "#fff"; }}>
                      {m}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right: API button */}
        <button onClick={() => model && setShowApi(true)} disabled={!model} className="flex items-center gap-1.5"
          style={{ height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: model ? "#374151" : "#9ca3af", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 7, cursor: model ? "pointer" : "not-allowed" }}
          onMouseEnter={e => { if (model) e.currentTarget.style.background = "#f8f9fc"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
          <BookOpen size={13} /> API说明
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0" style={{ margin: "12px 24px 0" }}>
        <div className="flex-1 overflow-auto">
          {!model ? (
            /* No model selected */
            <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: 200, color: "#9ca3af", fontSize: 14 }}>
              <Cpu size={36} color="#c7d5ff" />
              <div style={{ marginTop: 12 }}>请先选择模型</div>
            </div>
          ) : messages.length === 0 ? (
            /* Welcome card */
            <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: 200, paddingBottom: 16 }}>
              <div className="flex items-center justify-center rounded-2xl mb-4 flex-shrink-0"
                style={{ width: 56, height: 56, background: "linear-gradient(135deg,#4f6ef7,#06b6d4)" }}>
                <Cpu size={20} color="#fff" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1d23", textAlign: "center" }}>
                欢迎使用 <span style={{ color: "#4f6ef7" }}>{model}</span>
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>请在下方输入问题，帮你深度解答</div>
            </div>
          ) : (
            /* Messages */
            <div style={{ padding: "16px 0 8px", display: "flex", flexDirection: "column", gap: 0 }}>
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    /* User: dark bubble, right-aligned */
                    <div className="flex justify-end" style={{ marginBottom: 16 }}>
                      <div style={{
                        maxWidth: "72%", padding: "11px 16px", fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap",
                        borderRadius: "16px 4px 16px 16px",
                        background: "#1a1d23", color: "#f0f2ff",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}>{msg.content}</div>
                    </div>
                  ) : (
                    /* Assistant: plain text, no bubble */
                    <div className="flex items-start gap-3" style={{ marginBottom: 24 }}>
                      <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 28, height: 28, background: "linear-gradient(135deg,#4f6ef7,#06b6d4)", marginTop: 2 }}>
                        <div style={{ transform: "scale(0.8)" }}><Cpu size={20} color="#fff" /></div>
                      </div>
                      <div style={{ flex: 1, fontSize: 14, lineHeight: 1.85, color: "#1a1d23", whiteSpace: "pre-wrap", paddingTop: 4 }}>
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-3" style={{ marginBottom: 16 }}>
                  <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 28, height: 28, background: "linear-gradient(135deg,#4f6ef7,#06b6d4)", marginTop: 2 }}>
                    <div style={{ transform: "scale(0.8)" }}><Cpu size={20} color="#fff" /></div>
                  </div>
                  <div style={{ paddingTop: 10 }} className="flex gap-1.5">
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#9ca3af", animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ flexShrink: 0, paddingBottom: 4 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e0e3ed", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: "12px 14px 10px" }}>
            <textarea ref={textareaRef} value={input} onChange={autoResize} onKeyDown={onKeyDown}
              placeholder={model ? "输入问题，帮你深度解答（Enter 发送，Shift+Enter 换行）" : "请先选择模型"}
              rows={1}
              style={{ width: "100%", border: "none", outline: "none", fontSize: 14, color: "#1a1d23", lineHeight: 1.7, resize: "none", background: "transparent", fontFamily: "inherit", maxHeight: 160, overflow: "auto" }} />
            <div className="flex items-center justify-end" style={{ marginTop: 6 }}>
              {loading ? (
                /* Stop button */
                <button onClick={stop}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #6b7280", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a1d23"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#6b7280"; }}>
                  <Square size={13} color="#374151" fill="#374151" />
                </button>
              ) : (
                /* Send button — disabled (greyed out) when no model is selected */
                <button onClick={() => send()} disabled={sendDisabled}
                  style={{
                    width: 32, height: 32, borderRadius: "50%", border: "none",
                    cursor: sendDisabled ? "not-allowed" : "pointer",
                    background: sendDisabled ? "#e8ebf2" : "#1a1d23",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s",
                  }}>
                  <ArrowUp size={15} color={sendDisabled ? "#9ca3af" : "#fff"} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showApi && model && <ApiDrawer model={model} onClose={() => setShowApi(false)} />}

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-6px);opacity:1} }`}</style>
    </div>
  );
}
