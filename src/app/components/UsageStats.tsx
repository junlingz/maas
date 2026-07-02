import { useState } from "react";
import { Download, Search, RotateCcw, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── Mock chart data ───────────────────────────────────────────────────────────

const generateData = () => {
  const times = [
    "06:05","07:05","08:05","09:05","10:05","11:05","12:05",
    "13:05","14:05","15:05","16:05","17:05","18:05","19:05",
  ];
  return times.map((t, i) => ({
    time: t,
    inputTokens:  [0, 0, 120, 340, 580, 920, 1100, 870, 640, 410, 280, 180, 60, 0][i],
    outputTokens: [0, 0, 80,  210, 380, 610, 740,  590, 430, 270, 190, 120, 40, 0][i],
    total:        [0, 0, 200, 550, 960, 1530,1840, 1460,1070, 680, 470, 300, 100,0][i],
  }));
};

const CHART_DATA = generateData();

const totalTokens  = CHART_DATA.reduce((s, d) => s + d.total, 0);
const inputTokens  = CHART_DATA.reduce((s, d) => s + d.inputTokens, 0);
const outputTokens = CHART_DATA.reduce((s, d) => s + d.outputTokens, 0);
const callCount    = 47;

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, unit, icon, gradient }: {
  label: string; value: number; unit: string;
  icon: React.ReactNode; gradient: string;
}) {
  return (
    <div style={{
      flex: 1, borderRadius: 12, padding: "18px 20px", position: "relative", overflow: "hidden",
      background: "#fff", border: "1px solid #e8ebf2", minWidth: 0,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    }}>
      {/* Decorative gradient blob */}
      <div style={{
        position: "absolute", right: -20, top: -20, width: 100, height: 100,
        borderRadius: "50%", background: gradient, opacity: 0.12,
      }} />
      <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 10 }}>{label}</div>
      <div className="flex items-end gap-2">
        <span style={{ fontSize: 28, fontWeight: 700, color: "#1a1d23", lineHeight: 1 }}>
          {value.toLocaleString()}
        </span>
        <span style={{ fontSize: 13, color: "#6b7280", marginBottom: 2 }}>{unit}</span>
      </div>
      {/* Icon */}
      <div style={{
        position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
        width: 36, height: 36, borderRadius: 10, background: gradient,
        display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.9,
      }}>
        {icon}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function UsageStatsPage() {
  const [startTime, setStartTime] = useState("2026-06-23T19:05");
  const [endTime, setEndTime]     = useState("2026-06-24T19:05");
  const [granularity, setGranularity] = useState<"小时" | "天" | "周">("小时");
  const [searched, setSearched]   = useState(true);

  const formatTs = (v: string) => v.replace("T", " ") + ":00";

  const inputSt: React.CSSProperties = {
    height: 32, padding: "0 10px", fontSize: 12.5, border: "1px solid #e0e3ed",
    borderRadius: 6, outline: "none", background: "#fff", color: "#374151",
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>统计监控</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>用量统计</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-auto" style={{ padding: "14px 24px 24px" }}>
        {/* Filter bar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ marginBottom: 16 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputSt} />
            <span style={{ fontSize: 13, color: "#9ca3af" }}>—</span>
            <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputSt} />
            <button onClick={() => setSearched(true)} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <Search size={13} /> 搜索
            </button>
            <button onClick={() => { setStartTime("2026-06-23T19:05"); setEndTime("2026-06-24T19:05"); }} style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")}
              onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <RotateCcw size={13} /> 重置
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Granularity toggle */}
            <div className="flex items-center" style={{ border: "1px solid #e0e3ed", borderRadius: 6, overflow: "hidden" }}>
              {(["小时", "天", "周"] as const).map((g, i) => (
                <button key={g} onClick={() => setGranularity(g)}
                  style={{
                    height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, border: "none",
                    borderRight: i < 2 ? "1px solid #e0e3ed" : "none", cursor: "pointer",
                    background: granularity === g ? "#4f6ef7" : "#fff",
                    color: granularity === g ? "#fff" : "#374151",
                    transition: "all 0.15s",
                  }}>{g}</button>
              ))}
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
              onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
              <Download size={13} /> 导出报告
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="flex gap-4 flex-shrink-0" style={{ marginBottom: 20 }}>
          <StatCard label="Tokens 总量"     value={totalTokens}  unit="Tokens" gradient="linear-gradient(135deg,#4f6ef7,#06b6d4)"
            icon={<TrendingUp size={18} color="#fff" />} />
          <StatCard label="输入 Tokens 总量" value={inputTokens}  unit="Tokens" gradient="linear-gradient(135deg,#3b82f6,#60a5fa)"
            icon={<ArrowUpRight size={18} color="#fff" />} />
          <StatCard label="输出 Tokens 总量" value={outputTokens} unit="Tokens" gradient="linear-gradient(135deg,#8b5cf6,#a78bfa)"
            icon={<ArrowDownRight size={18} color="#fff" />} />
          <StatCard label="模型调用次数"    value={callCount}    unit="次"     gradient="linear-gradient(135deg,#f59e0b,#fbbf24)"
            icon={<Activity size={18} color="#fff" />} />
        </div>

        {/* Chart */}
        <div style={{ background: "#fff", border: "1px solid #e8ebf2", borderRadius: 12, padding: "20px 20px 12px", flex: 1, display: "flex", flexDirection: "column", minHeight: 320 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>Tokens 状态图</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div style={{ width: 28, height: 2, background: "#4f6ef7", borderRadius: 1 }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>输入 Tokens</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 28, height: 2, background: "#8b5cf6", borderRadius: 1 }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>输出 Tokens</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div style={{ width: 28, height: 2, background: "#10b981", borderRadius: 1 }} />
                <span style={{ fontSize: 12, color: "#6b7280" }}>Tokens</span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={CHART_DATA} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f7" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#e8ebf2" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderWidth: 1, borderStyle: "solid", borderColor: "#e0e3ed", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  labelStyle={{ color: "#374151", fontWeight: 500, marginBottom: 4 }}
                  formatter={(v: number, name: string) => [
                    v.toLocaleString(),
                    name === "inputTokens" ? "输入 Tokens" : name === "outputTokens" ? "输出 Tokens" : "Tokens 总量"
                  ]}
                />
                <Line type="monotone" dataKey="inputTokens"  stroke="#4f6ef7" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#4f6ef7" }} />
                <Line type="monotone" dataKey="outputTokens" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#8b5cf6" }} />
                <Line type="monotone" dataKey="total"        stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#10b981" }} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
