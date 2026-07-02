import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Copy, Check, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TplInfo { title: string; version: string; }

const TEMPLATE_OPTS = [
  { title: "写作助手",       versions: ["V1", "V2"] },
  { title: "自动化运维助手", versions: ["V1", "V2"] },
];

const MODEL_OPTS = [
  "glm-5:1:17725344382...",
  "glm-4:1:17781452061...",
  "chatglm4-32b-20260507...",
];

const OPTIMIZED: Record<string, string> = {
  "": "你是一位专业的 AI 助手，擅长根据用户需求提供高质量的文字内容。请根据以下要求完成任务：\n\n{{任务描述}}\n\n请确保输出内容：\n1. 结构清晰，逻辑严谨\n2. 语言流畅，符合目标场景\n3. 字数约 {{字数}} 字",
};

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function Dropdown({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 13, color: "#6b7280", flexShrink: 0 }}>{label}</span>
      <div ref={ref} style={{ position: "relative" }}>
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1.5"
          style={{ height: 34, padding: "0 12px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 8, background: "#fff", cursor: "pointer", color: "#1a1d23", minWidth: 130 }}>
          <span style={{ flex: 1, textAlign: "left" }}>{value}</span>
          <ChevronDown size={13} color="#9ca3af" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
        </button>
        {open && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: "100%", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden" }}>
            {options.map(opt => (
              <div key={opt} onClick={() => { onChange(opt); setOpen(false); }}
                style={{ padding: "10px 14px", fontSize: 13, cursor: "pointer", color: opt === value ? "#4f6ef7" : "#374151", fontWeight: opt === value ? 500 : 400, background: opt === value ? "#f0f4ff" : "#fff" }}
                onMouseEnter={e => { if (opt !== value) (e.currentTarget as HTMLDivElement).style.background = "#f8f9fc"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = opt === value ? "#f0f4ff" : "#fff"; }}>
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Fill Variables Modal ──────────────────────────────────────────────────────

function FillVarsModal({ vars, onClose, onDone }: {
  vars: string[]; onClose: () => void; onDone: (vals: Record<string, string>) => void;
}) {
  const [vals, setVals] = useState<Record<string, string>>(Object.fromEntries(vars.map(v => [v, ""])));
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 440, background: "#fff", borderRadius: 12, zIndex: 201, boxShadow: "0 24px 64px rgba(0,0,0,0.15)", overflow: "hidden" }}>
        <div className="flex items-center justify-between" style={{ padding: "18px 20px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>填写变量</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px" }}>
          {vars.map(v => (
            <div key={v} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>
                <span style={{ background: "#f0f4ff", color: "#4f6ef7", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>{`{{${v}}}`}</span>
              </label>
              <input value={vals[v]} onChange={e => setVals(p => ({ ...p, [v]: e.target.value }))}
                placeholder={`请输入 ${v} 的值`}
                style={{ width: "100%", height: 36, padding: "0 10px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, outline: "none", boxSizing: "border-box" as const }} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2" style={{ padding: "14px 20px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={onClose} style={{ height: 34, padding: "0 18px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 7, background: "#fff", cursor: "pointer", color: "#374151" }}>取消</button>
          <button onClick={() => { onDone(vals); onClose(); }} style={{ height: 34, padding: "0 20px", fontSize: 13, border: "none", borderRadius: 7, background: "#4f6ef7", color: "#fff", cursor: "pointer", fontWeight: 500 }}>确定</button>
        </div>
      </div>
    </>
  );
}

// ─── Tooltip wrapper ───────────────────────────────────────────────────────────

function TooltipBtn({ tip, onClick, children, style }: { tip: string; onClick: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button onClick={onClick} style={style}>{children}</button>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#1a1d23", color: "#fff", fontSize: 12, padding: "5px 10px", borderRadius: 6, whiteSpace: "nowrap", pointerEvents: "none", zIndex: 100 }}>
          {tip}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1a1d23" }} />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function PromptTuningPage({ initialTemplate }: { initialTemplate?: TplInfo | null }) {
  const [tplName, setTplName]     = useState(initialTemplate?.title ?? "写作助手");
  const [version, setVersion]     = useState(initialTemplate?.version ?? "V2");
  const [prompt, setPrompt]       = useState("");
  const [model, setModel]         = useState(MODEL_OPTS[0]);
  const [loading, setLoading]     = useState(false);
  const [response, setResponse]   = useState("");
  const [showFillVars, setShowFillVars] = useState(false);
  const [copied, setCopied]       = useState(false);
  const stopRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTpl  = TEMPLATE_OPTS.find(t => t.title === tplName) ?? TEMPLATE_OPTS[0];
  const versionOpts = currentTpl.versions;

  // Extract {{variable}} placeholders
  const vars = [...new Set((prompt.match(/\{\{([^}]+)\}\}/g) ?? []).map(m => m.slice(2, -2)))];

  const generate = () => {
    if (!prompt.trim() || loading) return;
    setResponse("");
    setLoading(true);
    const mockResponse = `以下是根据您的 Prompt 生成的内容：\n\n**${tplName}**\n\n${prompt.trim()}\n\n---\n\nLadies and gentlemen,\n\nToday, I stand before you to speak about the transformative power of artificial intelligence in modern society. AI is no longer a concept confined to science fiction; it has become an integral part of our daily lives, revolutionizing the way we work, communicate, and solve complex problems.\n\nFrom healthcare diagnostics to climate modeling, from personalized education to autonomous transportation, artificial intelligence is reshaping every industry and every corner of human endeavor. The algorithms that once seemed impossibly complex are now helping doctors detect cancer earlier, helping scientists discover new materials, and helping teachers personalize learning for every student.\n\nHowever, with this great power comes great responsibility. We must ensure that AI development remains transparent, equitable, and aligned with human values. We must bridge the digital divide so that the benefits of AI reach every community, not just the privileged few.\n\nLet us embrace this technological revolution with both enthusiasm and wisdom, building a future where humans and machines work together in harmony to create a better world for all.\n\nThank you.`;

    let i = 0;
    const chunk = 4;
    const tick = () => {
      if (i < mockResponse.length) {
        setResponse(mockResponse.slice(0, i + chunk));
        i += chunk;
        stopRef.current = setTimeout(tick, 18);
      } else {
        setLoading(false);
        stopRef.current = null;
      }
    };
    stopRef.current = setTimeout(tick, 18);
  };

  const stop = () => {
    if (stopRef.current) { clearTimeout(stopRef.current); stopRef.current = null; }
    setLoading(false);
  };

  const optimize = () => {
    const optimized = OPTIMIZED[""] || `请作为专业 ${tplName}，根据以下要求完成任务：\n\n${prompt || "{{任务描述}}"}\n\n要求：语言清晰、结构合理、内容准确。`;
    setPrompt(optimized);
  };

  const fillVars = (vals: Record<string, string>) => {
    let filled = prompt;
    Object.entries(vals).forEach(([k, v]) => { filled = filled.replaceAll(`{{${k}}}`, v); });
    setPrompt(filled);
  };

  const copyResponse = () => {
    navigator.clipboard?.writeText(response).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const btnBase: React.CSSProperties = {
    height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, border: "1px solid #e0e3ed", background: "#fff", color: "#374151", transition: "all .15s",
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#fff" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 10px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #f0f2f7" }}>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7", cursor: "pointer" }}>模型体验</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>Prompt调优</span>
      </div>

      {/* Top selectors */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "12px 24px", borderBottom: "1px solid #f0f2f7" }}>
        <div className="flex items-center gap-6">
          <Dropdown label="选择模板" value={tplName}
            options={TEMPLATE_OPTS.map(t => t.title)}
            onChange={v => { setTplName(v); setVersion(TEMPLATE_OPTS.find(t => t.title === v)?.versions.slice(-1)[0] ?? "V1"); setResponse(""); }} />
          <Dropdown label="选择版本" value={version} options={versionOpts}
            onChange={v => { setVersion(v); setResponse(""); }} />
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{tplName}</span>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 6, background: "#4f6ef7", color: "#fff" }}>{version}</span>
        </div>
      </div>

      {/* Split main area */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Prompt editor */}
        <div className="flex flex-col min-h-0" style={{ flex: 1, borderRight: "1px solid #f0f2f7" }}>
          {/* Panel header */}
          <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "14px 20px 12px", borderBottom: "1px solid #f5f7fa" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1d23" }}>Prompt编辑</span>
            <div className="flex items-center gap-2">
              <TooltipBtn tip="一键优化Prompt" onClick={optimize}
                style={{ ...btnBase, padding: "0 10px", border: "1px solid #e0e3ed" }}>
                <Sparkles size={15} color="#6b7280" />
              </TooltipBtn>
              <button
                onClick={() => vars.length > 0 ? setShowFillVars(true) : undefined}
                style={{ ...btnBase, opacity: vars.length === 0 ? 0.5 : 1 }}
                onMouseEnter={e => vars.length > 0 && (e.currentTarget.style.borderColor = "#4f6ef7", e.currentTarget.style.color = "#4f6ef7")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#e0e3ed", e.currentTarget.style.color = "#374151")}>
                填写变量
              </button>
              <button
                onClick={loading ? stop : generate}
                style={{ ...btnBase, background: "#4f6ef7", color: "#fff", border: "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
                onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
                {loading ? <><RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> 停止生成</> : "生成模型回答"}
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1 overflow-auto" style={{ padding: "16px 20px" }}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="请输入prompt"
              style={{ width: "100%", height: "100%", minHeight: 300, border: "1px solid #e0e3ed", borderRadius: 8, padding: "14px", fontSize: 14, lineHeight: 1.8, color: "#1a1d23", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" as const }}
              onFocus={e => (e.target.style.borderColor = "#4f6ef7")}
              onBlur={e => (e.target.style.borderColor = "#e0e3ed")}
            />
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "12px 20px", borderTop: "1px solid #f5f7fa" }}>
            <div style={{ position: "relative", minWidth: 200 }}>
              <select value={model} onChange={e => setModel(e.target.value)}
                style={{ height: 34, padding: "0 28px 0 10px", fontSize: 12.5, border: "1px solid #e0e3ed", borderRadius: 7, outline: "none", background: "#fff", appearance: "none", color: "#374151", cursor: "pointer", fontFamily: "monospace" }}>
                {MODEL_OPTS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={12} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>
            <button style={{ height: 34, padding: "0 24px", fontSize: 13, fontWeight: 500, background: "#4f6ef7", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
              onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
              保存
            </button>
          </div>
        </div>

        {/* Right: AI response */}
        <div className="flex flex-col min-h-0" style={{ flex: 1 }}>
          <div className="flex-1 overflow-auto" style={{ padding: "20px" }}>
            {!response && !loading ? (
              /* Empty state */
              <div className="flex items-center justify-center h-full">
                <span style={{ fontSize: 13.5, color: "#c9cdd4" }}>点击左侧「生成模型回答」后，大模型的回答将显示在这里</span>
              </div>
            ) : (
              <div>
                {/* AI header */}
                <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4f6ef7,#7c5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 13, color: "#fff", fontWeight: 700 }}>AI</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>AI</span>
                </div>

                {loading && !response ? (
                  /* Generating indicator */
                  <div className="flex items-center gap-2" style={{ color: "#4f6ef7", fontSize: 13.5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid #4f6ef7", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                    正在推理中...
                  </div>
                ) : (
                  /* Response text */
                  <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
                    {response}
                    {loading && <span style={{ display: "inline-block", width: 2, height: 16, background: "#4f6ef7", marginLeft: 2, animation: "blink 1s step-end infinite", verticalAlign: "text-bottom" }} />}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Copy button */}
          <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "10px 20px", borderTop: "1px solid #f5f7fa" }}>
            <button onClick={copyResponse} disabled={!response}
              className="flex items-center gap-1.5"
              style={{ fontSize: 13, color: response ? "#4f6ef7" : "#c9cdd4", background: "none", border: "none", cursor: response ? "pointer" : "not-allowed", fontWeight: 500 }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "已复制" : "复制"}
            </button>
          </div>
        </div>
      </div>

      {showFillVars && <FillVarsModal vars={vars} onClose={() => setShowFillVars(false)} onDone={fillVars} />}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
