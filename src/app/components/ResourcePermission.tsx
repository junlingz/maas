import { useState } from "react";
import { X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Design tokens (matching the HTML spec) ────────────────────────────────────
const C = {
  primary:       "#165DFF",
  primaryHover:  "#0E42D2",
  primaryLight:  "#E8F3FF",
  primaryLighter:"#F0F7FF",
  bg:            "#F5F7FA",
  border:        "#E5E6EB",
  borderLight:   "#F2F3F5",
  ink:           "#1D2129",
  ink2:          "#4E5969",
  ink3:          "#86909C",
  ink4:          "#C9CDD4",
  success:       "#00B42A",
  successLight:  "#E8FFEA",
  warning:       "#FF7D00",
  warningLight:  "#FFF7E8",
  danger:        "#F53F3F",
  dangerLight:   "#FFECE8",
  purple:        "#722ED1",
  purpleLight:   "#F7EFFF",
};

// ─── Status tag ───────────────────────────────────────────────────────────────
const STATUS_CFG = {
  running: { bg: C.successLight, color: C.success, dot: C.success,   label: "运行中" },
  warning: { bg: C.warningLight, color: C.warning, dot: C.warning,   label: "告警"  },
  error:   { bg: C.dangerLight,  color: C.danger,  dot: C.danger,    label: "异常"  },
  info:    { bg: C.primaryLight, color: C.primary, dot: C.primary,   label: "待分配"},
  gray:    { bg: "#F2F3F5",      color: C.ink2,    dot: C.ink3,      label: "已停用"},
};

function StatusTag({ type }: { type: keyof typeof STATUS_CFG }) {
  const s = STATUS_CFG[type];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 2, background: s.bg, color: s.color, fontSize: 12, fontWeight: 500 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function TypeTag({ children, variant = "blue" }: { children: React.ReactNode; variant?: "blue" | "gray" | "purple" | "green" | "orange" }) {
  const cfg = {
    blue:   { bg: C.primaryLight, color: C.primary },
    gray:   { bg: "#F2F3F5",      color: C.ink2    },
    purple: { bg: C.purpleLight,  color: C.purple  },
    green:  { bg: C.successLight, color: C.success },
    orange: { bg: C.warningLight, color: C.warning },
  }[variant];
  return <span style={{ display: "inline-block", padding: "2px 8px", marginRight: 4, background: cfg.bg, color: cfg.color, borderRadius: 2, fontSize: 12, fontWeight: 500, lineHeight: "20px" }}>{children}</span>;
}

// ─── Quota bar ────────────────────────────────────────────────────────────────
function QuotaBar({ used, total, color = "blue" }: { used: number; total: number; color?: "green" | "orange" | "blue" }) {
  const pct = Math.min(100, Math.round((used / total) * 100));
  const fillColor = { green: C.success, orange: C.warning, blue: C.primary }[color];
  return (
    <>
      <div style={{ height: 6, background: C.borderLight, borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: fillColor, borderRadius: 3, transition: "width .3s" }} />
      </div>
      <div style={{ fontSize: 12, color: C.ink3, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
        <span>已用 {used}</span><span>共 {total}</span>
      </div>
    </>
  );
}

// ─── Permission Assignment Modal ───────────────────────────────────────────────
function AssignModal({ onClose }: { onClose: () => void }) {
  const [space, setSpace]   = useState("");
  const [group, setGroup]   = useState("");
  const [quota, setQuota]   = useState("");
  const [tags, setTags]     = useState<string[]>([]);
  const MODEL_TAGS = ["文本生成", "代码生成", "图像生成", "向量检索", "语音识别"];
  const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const inp: React.CSSProperties = { width: "100%", height: 32, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, outline: "none", fontFamily: "inherit", color: C.ink };
  const sel: React.CSSProperties = { ...inp, cursor: "pointer", appearance: "none" as const, backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='%2386909C' d='M5 6L0 0h10z'/></svg>\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 28 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000 }} />
      <div style={{ position: "fixed", top: "8vh", left: "50%", transform: "translateX(-50%)", width: 720, maxWidth: "90vw", background: "#fff", borderRadius: 6, zIndex: 1001, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>分配资源权限</span>
          <button onClick={onClose} style={{ cursor: "pointer", color: C.ink3, fontSize: 20, background: "none", border: "none", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}>×</button>
        </div>
        <div style={{ padding: "20px 24px", maxHeight: "65vh", overflowY: "auto" }}>
          {/* 2-col rows */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: C.ink2, marginBottom: 6 }}>目标工作空间<span style={{ color: C.danger, marginLeft: 2 }}>*</span></label>
              <select value={space} onChange={e => setSpace(e.target.value)} style={sel}>
                <option value="">请选择工作空间</option>
                <option>admin空间</option><option>演示工作空间70</option><option>研发测试空间</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: C.ink2, marginBottom: 6 }}>资源组<span style={{ color: C.danger, marginLeft: 2 }}>*</span></label>
              <select value={group} onChange={e => setGroup(e.target.value)} style={sel}>
                <option value="">请选择资源组</option>
                <option>公共组</option><option>test</option><option>高性能组</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: C.ink2, marginBottom: 6 }}>GPU 配额上限<span style={{ color: C.danger, marginLeft: 2 }}>*</span></label>
              <input value={quota} onChange={e => setQuota(e.target.value)} type="number" placeholder="填 0 表示不限制" style={inp} />
              <div style={{ fontSize: 12, color: C.ink3, marginTop: 4 }}>当前资源组可用卡数：56 卡</div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, color: C.ink2, marginBottom: 6 }}>有效期</label>
              <select style={sel}><option>永久有效</option><option>30天</option><option>90天</option><option>180天</option><option>1年</option></select>
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, color: C.ink2, marginBottom: 8 }}>允许使用的模型类型</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MODEL_TAGS.map(t => (
                <span key={t} onClick={() => toggleTag(t)}
                  style={{ padding: "4px 12px", border: `1px solid ${tags.includes(t) ? C.primary : C.border}`, borderRadius: 4, fontSize: 12, color: tags.includes(t) ? C.primary : C.ink2, background: tags.includes(t) ? C.primaryLight : "#fff", cursor: "pointer", transition: "all .15s" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: "block", fontSize: 13, color: C.ink2, marginBottom: 6 }}>备注说明</label>
            <textarea placeholder="填写分配说明，方便后续审计…" style={{ width: "100%", padding: "6px 12px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, fontFamily: "inherit", color: C.ink, outline: "none", resize: "vertical", minHeight: 72, lineHeight: "1.6" }} />
          </div>
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#F0F7FF", border: "1px solid #BEDAFF", borderRadius: 4, display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#0E42D2" }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
            <span>分配后，空间管理员可在<b>「空间管理 → 资源分配」</b>中查看并进一步分配给成员使用，超出配额的任务将自动进入等待队列。</span>
          </div>
        </div>
        <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.borderLight}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ height: 32, padding: "0 16px", border: `1px solid ${C.border}`, borderRadius: 4, background: "#fff", fontSize: 13, color: C.ink2, cursor: "pointer" }}>取消</button>
          <button onClick={onClose} style={{ height: 32, padding: "0 16px", border: `1px solid ${C.primary}`, borderRadius: 4, background: C.primary, fontSize: 13, color: "#fff", cursor: "pointer" }}>确认分配</button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface PermRow { id: number; space: string; group: string; gpuType: string; assigned: number; quota: number; models: string[]; status: keyof typeof STATUS_CFG; }

const ROWS_INIT: PermRow[] = [
  { id: 1, space: "admin空间",        group: "公共组",  gpuType: "910B",  assigned: 24, quota: 32,  models: ["文本生成","代码生成"],      status: "running" },
  { id: 2, space: "演示工作空间70",   group: "test",    gpuType: "910B",  assigned: 8,  quota: 16,  models: ["文本生成"],                 status: "running" },
  { id: 3, space: "研发测试空间",     group: "公共组",  gpuType: "H20",   assigned: 4,  quota: 8,   models: ["图像生成","向量检索"],       status: "warning" },
  { id: 4, space: "产品演示空间",     group: "高性能组",gpuType: "A100",  assigned: 0,  quota: 16,  models: ["文本生成","代码生成","图像生成"], status: "info"  },
  { id: 5, space: "旧版测试空间",     group: "公共组",  gpuType: "V100",  assigned: 0,  quota: 4,   models: ["文本生成"],                 status: "gray"  },
];

export function ResourcePermissionPage() {
  const [rows, setRows]         = useState<PermRow[]>(ROWS_INIT);
  const [showModal, setShowModal] = useState(false);
  const [spaceFilter, setSpaceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery]       = useState("");

  const filtered = rows.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (query && !r.space.includes(query) && !r.group.includes(query)) return false;
    return true;
  });

  const totalGpu = 224; const availGpu = 104; const usedGpu = totalGpu - availGpu;

  const thSt: React.CSSProperties = { padding: "12px 16px", textAlign: "left", fontSize: 13, borderBottom: `1px solid ${C.borderLight}`, background: "#F7F8FA", color: C.ink2, fontWeight: 500 };
  const tdSt: React.CSSProperties = { padding: "12px 16px", fontSize: 13, borderBottom: `1px solid ${C.borderLight}`, verticalAlign: "middle" };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.bg, minWidth: 0 }}>
      {/* Breadcrumb */}
      <div style={{ height: 48, padding: "0 24px", display: "flex", alignItems: "center", fontSize: 13, color: C.ink3, flexShrink: 0 }}>
        <span style={{ cursor: "pointer" }}>首页</span>
        <span style={{ margin: "0 8px", color: C.ink4 }}>/</span>
        <span style={{ cursor: "pointer" }}>空间管理</span>
        <span style={{ margin: "0 8px", color: C.ink4 }}>/</span>
        <span style={{ color: C.ink, fontWeight: 500 }}>资源管理与权限分配</span>
      </div>

      {/* Page title */}
      <div style={{ padding: "0 24px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>资源管理与权限分配</h1>
          <div style={{ fontSize: 13, color: C.ink3, marginTop: 4 }}>统一管理集群、资源池、工作空间的 GPU 资源与访问权限</div>
        </div>
        <button onClick={() => setShowModal(true)} style={{ height: 32, padding: "0 16px", background: C.primary, color: "#fff", border: `1px solid ${C.primary}`, borderRadius: 4, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          ＋ 分配资源权限
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px", minHeight: 0 }}>

        {/* Space banner */}
        <div style={{ background: "linear-gradient(135deg,#E8F3FF,#F0F7FF)", border: "1px solid #BEDAFF", borderRadius: 6, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>🏢</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>admin空间</div>
              <div style={{ fontSize: 12, color: C.primary, marginTop: 2 }}>平台超级管理员 · 全局资源管理权限</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 12, color: C.ink2 }}>
            {[{ l: "GPU总量", v: `${totalGpu} 卡` }, { l: "已分配", v: `${usedGpu} 卡` }, { l: "可用", v: `${availGpu} 卡` }, { l: "资源池", v: "3 个" }, { l: "工作空间", v: "5 个" }].map(i => (
              <div key={i.l} style={{ textAlign: "right" }}>
                <b style={{ display: "block", fontSize: 14, color: C.ink, fontWeight: 600 }}>{i.v}</b>
                {i.l}
              </div>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 16 }}>
          {[
            { label: "GPU 总卡数", value: totalGpu, unit: "卡", footer: "较上月 +32 卡", color: C.primary },
            { label: "可用卡数",   value: availGpu, unit: "卡", footer: `使用率 ${Math.round(usedGpu/totalGpu*100)}%`, color: C.success },
            { label: "已分配卡数", value: usedGpu,  unit: "卡", footer: "分布于 5 个工作空间", color: C.warning },
            { label: "资源池数量", value: 3,         unit: "个", footer: "3 个集群在线", color: C.purple },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ fontSize: 13, color: C.ink2, marginBottom: 10 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: c.color, lineHeight: 1.2 }}>
                {c.value}<small style={{ fontSize: 13, color: C.ink3, fontWeight: 400, marginLeft: 4 }}>{c.unit}</small>
              </div>
              <div style={{ fontSize: 12, color: C.ink3, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.borderLight}` }}>{c.footer}</div>
            </div>
          ))}
        </div>

        {/* Permission flow diagram */}
        <div style={{ background: "#fff", border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "stretch", gap: 0, overflow: "hidden" }}>
          {[
            { bg: "#EFF6FF", icon: "🛡️", role: "平台超管",   duty: "管理全局资源与权限策略", br: "6px 0 0 6px" },
            { bg: "#F0F7FF", icon: "👷", role: "资源管理员", duty: "管理集群资源池与分配策略",  br: "0" },
            { bg: "#F7EFFF", icon: "🏢", role: "空间管理员", duty: "管理工作空间内部资源分配",  br: "0" },
            { bg: "#FFF7E8", icon: "👤", role: "空间成员",   duty: "使用分配到的 GPU 资源",    br: "0 6px 6px 0" },
          ].map((s, i) => (
            <div key={s.role} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: s.bg, borderRadius: s.br, position: "relative" }}>
              {i > 0 && <span style={{ position: "absolute", left: -10, fontSize: 18, color: C.ink4, zIndex: 1 }}>▶</span>}
              <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, whiteSpace: "nowrap" }}>{s.role}</div>
                <div style={{ fontSize: 11, color: C.ink3, marginTop: 4, whiteSpace: "nowrap" }}>{s.duty}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Cluster overview */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
          {[
            { name: "910B-山东机房", type: "Huawei", total: 128, avail: 56, groups: 3, pct: 56 },
            { name: "H20-湖北机房",  type: "Nvidia", total: 64,  avail: 16, groups: 1, pct: 75 },
            { name: "A100-内蒙机房", type: "Nvidia", total: 32,  avail: 32, groups: 2, pct: 0  },
          ].map(cl => (
            <div key={cl.name} style={{ background: "#fff", border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: 16, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.primary; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(22,93,255,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.borderLight; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{cl.name}</span>
                <TypeTag variant={cl.type === "Huawei" ? "purple" : "blue"}>{cl.type}</TypeTag>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[{ l: "总卡数", v: cl.total }, { l: "可用卡", v: cl.avail }, { l: "资源组", v: cl.groups }].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: 11, color: C.ink3 }}>{s.l}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <QuotaBar used={cl.total - cl.avail} total={cl.total} color={cl.pct > 70 ? "orange" : "blue"} />
            </div>
          ))}
        </div>

        {/* Filter + table */}
        <div style={{ background: "#fff", border: `1px solid ${C.borderLight}`, borderRadius: 6, padding: 20 }}>
          {/* Filter bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 13, color: C.ink2, whiteSpace: "nowrap" }}>状态</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ height: 32, padding: "0 28px 0 12px", border: `1px solid ${C.border}`, borderRadius: 4, background: "#fff", fontSize: 13, color: C.ink, outline: "none", minWidth: 120, appearance: "none", cursor: "pointer" }}>
                <option value="">全部状态</option>
                <option value="running">运行中</option>
                <option value="warning">告警</option>
                <option value="info">待分配</option>
                <option value="gray">已停用</option>
              </select>
            </div>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === "Enter" && setQuery(searchInput)}
              placeholder="搜索空间名称、资源组…"
              style={{ height: 32, padding: "0 12px", border: `1px solid ${C.border}`, borderRadius: 4, background: "#fff", fontSize: 13, color: C.ink, outline: "none", minWidth: 220 }} />
            <button onClick={() => { setQuery(searchInput); }} style={{ height: 32, padding: "0 16px", border: `1px solid ${C.border}`, borderRadius: 4, background: "#fff", fontSize: 13, color: C.ink2, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>🔍 搜索</button>
            <button onClick={() => { setSearchInput(""); setQuery(""); setStatusFilter(""); }} style={{ height: 32, padding: "0 16px", border: `1px solid ${C.border}`, borderRadius: 4, background: "#fff", fontSize: 13, color: C.ink2, cursor: "pointer" }}>↺ 重置</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowModal(true)} style={{ height: 32, padding: "0 16px", background: C.primary, color: "#fff", border: `1px solid ${C.primary}`, borderRadius: 4, fontSize: 13, cursor: "pointer" }}>＋ 新增分配</button>
          </div>

          {/* Table */}
          <div style={{ border: `1px solid ${C.borderLight}`, borderRadius: 6, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["工作空间","资源组","GPU 类型","已分配卡数","配额上限","使用率","允许模型类型","状态","操作"].map(c => <th key={c} style={thSt}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: "56px 0", color: C.ink3, fontSize: 13 }}>暂无数据</td></tr>
                ) : filtered.map((r, i) => {
                  const pct = r.quota > 0 ? Math.round((r.assigned / r.quota) * 100) : 0;
                  const barColor: "green" | "orange" | "blue" = pct > 80 ? "orange" : pct > 0 ? "blue" : "green";
                  const isLast = i === filtered.length - 1;
                  return (
                    <tr key={r.id} style={{ transition: "background .15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F7F8FA")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ ...tdSt, fontWeight: 500, color: C.ink, borderBottom: isLast ? "none" : `1px solid ${C.borderLight}` }}>{r.space}</td>
                      <td style={{ ...tdSt, borderBottom: isLast ? "none" : `1px solid ${C.borderLight}` }}>{r.group}</td>
                      <td style={{ ...tdSt, borderBottom: isLast ? "none" : `1px solid ${C.borderLight}` }}>
                        <TypeTag variant={r.gpuType === "910B" ? "purple" : r.gpuType === "H20" ? "blue" : "gray"}>{r.gpuType}</TypeTag>
                      </td>
                      <td style={{ ...tdSt, fontWeight: 600, color: C.ink, borderBottom: isLast ? "none" : `1px solid ${C.borderLight}` }}>{r.assigned} 卡</td>
                      <td style={{ ...tdSt, borderBottom: isLast ? "none" : `1px solid ${C.borderLight}` }}>{r.quota === 0 ? "不限" : `${r.quota} 卡`}</td>
                      <td style={{ ...tdSt, minWidth: 120, borderBottom: isLast ? "none" : `1px solid ${C.borderLight}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: C.borderLight, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: { green: C.success, orange: C.warning, blue: C.primary }[barColor], borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: C.ink3, flexShrink: 0, minWidth: 32 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ ...tdSt, borderBottom: isLast ? "none" : `1px solid ${C.borderLight}` }}>
                        {r.models.map(m => <TypeTag key={m} variant="gray">{m}</TypeTag>)}
                      </td>
                      <td style={{ ...tdSt, borderBottom: isLast ? "none" : `1px solid ${C.borderLight}` }}><StatusTag type={r.status} /></td>
                      <td style={{ ...tdSt, borderBottom: isLast ? "none" : `1px solid ${C.borderLight}` }}>
                        <span style={{ color: C.primary, cursor: "pointer", fontSize: 13, marginRight: 16 }}
                          onMouseEnter={e => (e.currentTarget.style.color = C.primaryHover)} onMouseLeave={e => (e.currentTarget.style.color = C.primary)}>编辑</span>
                        <span style={{ color: C.danger, cursor: "pointer", fontSize: 13 }}
                          onClick={() => setRows(prev => prev.filter(x => x.id !== r.id))}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>撤销</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingTop: 16, fontSize: 13, color: C.ink2 }}>
            <span>共 {filtered.length} 条</span>
            <select style={{ height: 32, padding: "0 24px 0 12px", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, background: "#fff", cursor: "pointer", appearance: "none", fontFamily: "inherit", color: C.ink2 }}>
              <option>10条/页</option><option>20条/页</option>
            </select>
            <button disabled style={{ minWidth: 32, height: 32, border: `1px solid ${C.border}`, borderRadius: 4, background: "#fff", color: C.ink4, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={13} /></button>
            <button style={{ minWidth: 32, height: 32, border: `1px solid ${C.primary}`, borderRadius: 4, background: C.primary, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>1</button>
            <button disabled style={{ minWidth: 32, height: 32, border: `1px solid ${C.border}`, borderRadius: 4, background: "#fff", color: C.ink4, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={13} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
              <span>前往</span>
              <input type="number" defaultValue={1} style={{ width: 48, height: 32, padding: "0 8px", textAlign: "center", border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 13, fontFamily: "inherit", color: C.ink }} />
              <span>页</span>
            </div>
          </div>
        </div>
      </div>

      {showModal && <AssignModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
