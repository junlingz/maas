import { useState, useRef, useEffect } from "react";
import { Search, RotateCcw, Plus, ChevronDown, ChevronRight, ChevronUp, X, Eye, EyeOff, Minus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Cluster {
  id: number; name: string; gpuCount: number; services: number;
  nodeCount: number; nodeVersion: string; resourceGroups: number;
  status: "Ready" | "NotReady" | "Unknown"; clusterBase: string;
  isDefault: boolean; createdAt: string;
}

const CLUSTERS_INIT: Cluster[] = [
  { id: 1, name: "h20-node-cluster",  gpuCount: 8,  services: 1, nodeCount: 2, nodeVersion: "1/1", resourceGroups: 1, status: "Ready", clusterBase: "Kubernetes", isDefault: true,  createdAt: "2026-06-24 10:00" },
  { id: 2, name: "a100-prod-cluster", gpuCount: 16, services: 3, nodeCount: 4, nodeVersion: "1/2", resourceGroups: 3, status: "Ready", clusterBase: "Kubernetes", isDefault: false, createdAt: "2026-05-10 09:30" },
];

// ─── Shared form primitives ────────────────────────────────────────────────────

const inpSt: React.CSSProperties = {
  width: "100%", padding: "8px 10px", fontSize: 13, border: "1px solid #e0e3ed",
  borderRadius: 7, outline: "none", color: "#1a1d23", background: "#fff",
  boxSizing: "border-box" as const, fontFamily: "inherit",
};

function FL({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
    {required && <span style={{ color: "#ef4444", marginRight: 2 }}>*</span>}{children}
  </div>;
}

function Sel({ value, onChange, opts, placeholder }: { value: string; onChange: (v: string) => void; opts: string[]; placeholder?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...inpSt, appearance: "none", paddingRight: 28, cursor: "pointer", color: value ? "#1a1d23" : "#9ca3af" }}>
        {placeholder && <option value="">{placeholder}</option>}
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} color="#9ca3af" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

// ─── Volume Mount ─────────────────────────────────────────────────────────────

interface VolMount { id: number; name: string; containerPath: string; readOnly: boolean; storageSource: string; hostPath: string; pathType: string; isDefault?: boolean; }

const DEFAULT_VOLS: VolMount[] = [
  { id: 1, name: "gpustack-data-dir", containerPath: "/var/lib/gpustack", readOnly: false, storageSource: "主机路径", hostPath: "/var/lib/gpustack", pathType: "目录（不存在则创建）", isDefault: true },
];

function VolumeSection({ vols, setVols }: { vols: VolMount[]; setVols: (v: VolMount[]) => void }) {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set([1]));
  const toggle = (id: number) => setOpenIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const upd = (id: number, patch: Partial<VolMount>) => setVols(vols.map(v => v.id === id ? { ...v, ...patch } : v));

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23" }}>卷挂载</span>
        <button onClick={() => setVols([...vols, { id: Date.now(), name: "", containerPath: "", readOnly: false, storageSource: "主机路径", hostPath: "", pathType: "目录（不存在则创建）" }])}
          style={{ fontSize: 13, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
          + 添加卷挂载
        </button>
      </div>
      {vols.map(vol => {
        const isOpen = openIds.has(vol.id);
        return (
          <div key={vol.id} style={{ border: "1px solid #e8ebf2", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
            <div className="flex items-center justify-between" style={{ padding: "10px 14px", background: "#f8f9fc", cursor: "pointer" }}
              onClick={() => toggle(vol.id)}>
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
                <span style={{ fontSize: 13, color: "#374151" }}>
                  卷名称: <span style={{ fontWeight: 500, color: vol.name ? "#1a1d23" : "#9ca3af" }}>{vol.name || "(未命名)"}</span>
                </span>
              </div>
              {!vol.isDefault && (
                <button onClick={e => { e.stopPropagation(); setVols(vols.filter(v => v.id !== vol.id)); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: "#9ca3af", borderRadius: 4, display: "flex" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
                  <Minus size={14} />
                </button>
              )}
            </div>
            {isOpen && (
              <div style={{ padding: "14px", background: "#fafbfd", display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <FL required>卷名称</FL>
                  <input value={vol.name} onChange={e => upd(vol.id, { name: e.target.value })}
                    placeholder={vol.isDefault ? vol.name : ""}
                    readOnly={vol.isDefault}
                    style={{ ...inpSt, background: vol.isDefault ? "#f3f4f6" : "#fff", color: vol.isDefault ? "#9ca3af" : "#1a1d23" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
                  <div>
                    <FL required>容器内路径</FL>
                    <input value={vol.containerPath} onChange={e => upd(vol.id, { containerPath: e.target.value })}
                      placeholder="/var/lib/gpustack" readOnly={vol.isDefault}
                      style={{ ...inpSt, background: vol.isDefault ? "#f3f4f6" : "#fff", color: vol.isDefault ? "#9ca3af" : "#1a1d23" }} />
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <span style={{ fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>只读</span>
                    <div onClick={() => !vol.isDefault && upd(vol.id, { readOnly: !vol.readOnly })}
                      style={{ width: 36, height: 20, borderRadius: 10, background: vol.readOnly ? "#4f6ef7" : "#d1d5db", position: "relative", cursor: vol.isDefault ? "not-allowed" : "pointer", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 2, left: vol.readOnly ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
                    </div>
                  </div>
                </div>
                <div>
                  <FL required>存储来源</FL>
                  <Sel value={vol.storageSource} onChange={v => upd(vol.id, { storageSource: v })} opts={["主机路径", "ConfigMap", "Secret", "EmptyDir"]} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <FL required>主机路径</FL>
                    <input value={vol.hostPath} onChange={e => upd(vol.id, { hostPath: e.target.value })}
                      placeholder="/var/lib/gpustack" readOnly={vol.isDefault}
                      style={{ ...inpSt, background: vol.isDefault ? "#f3f4f6" : "#fff", color: vol.isDefault ? "#9ca3af" : "#1a1d23" }} />
                  </div>
                  <div>
                    <FL required>路径类型</FL>
                    <Sel value={vol.pathType} onChange={v => upd(vol.id, { pathType: v })}
                      opts={["目录（不存在则创建）", "目录（必须存在）", "文件（不存在则创建）", "文件（必须存在）"]} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Image Registry Credentials ────────────────────────────────────────────────

interface RegistryCred { id: number; url: string; username: string; password: string; showPwd: boolean; }

function CredentialsSection({ creds, setCreds }: { creds: RegistryCred[]; setCreds: (c: RegistryCred[]) => void }) {
  const upd = (id: number, patch: Partial<RegistryCred>) => setCreds(creds.map(c => c.id === id ? { ...c, ...patch } : c));
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1d23", marginBottom: 12 }}>镜像仓库凭证</div>
      {creds.map((cred, i) => (
        <div key={cred.id} style={{ border: "1px solid #e8ebf2", borderRadius: 8, padding: "12px", marginBottom: 10, position: "relative" }}>
          <button onClick={() => setCreds(creds.filter(c => c.id !== cred.id))}
            style={{ position: "absolute", right: 12, top: 12, background: "none", border: "none", cursor: "pointer", color: "#9ca3af", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
            <Minus size={14} />
          </button>
          <div style={{ marginBottom: 10, paddingRight: 32 }}>
            <FL required>镜像仓库地址</FL>
            <input value={cred.url} onChange={e => upd(cred.id, { url: e.target.value })} placeholder="镜像仓库地址" style={inpSt} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <FL>用户名</FL>
              <input value={cred.username} onChange={e => upd(cred.id, { username: e.target.value })} placeholder="用户名" style={inpSt} />
            </div>
            <div>
              <FL>密码</FL>
              <div style={{ position: "relative" }}>
                <input type={cred.showPwd ? "text" : "password"} value={cred.password} onChange={e => upd(cred.id, { password: e.target.value })}
                  placeholder="密码" style={{ ...inpSt, paddingRight: 32 }} />
                <button onClick={() => upd(cred.id, { showPwd: !cred.showPwd })}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                  {cred.showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          {i < creds.length - 1 && <div style={{ height: 1, background: "#f0f2f7", marginTop: 12 }} />}
        </div>
      ))}
      <button onClick={() => setCreds([...creds, { id: Date.now(), url: "", username: "", password: "", showPwd: false }])}
        style={{ width: "100%", padding: "10px", fontSize: 13, border: "1px solid #e8ebf2", borderRadius: 7, background: "#f8f9fc", cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Plus size={13} /> 添加凭证
      </button>
    </div>
  );
}

// ─── Create Cluster Drawer ────────────────────────────────────────────────────

function CreateClusterDrawer({ onClose, onDone, initial }: {
  onClose: () => void;
  onDone: (c: Cluster) => void;
  initial?: Cluster | null;  // if set → edit mode
}) {
  const isEdit = !!initial;
  const [name, setName]         = useState(initial?.name ?? "");
  const [desc, setDesc]         = useState("");
  const [clusterKind, setKind]  = useState<"gpu" | "model">(
    initial?.clusterBase === "模型服务" ? "model" : "gpu"
  );
  const [errs, setErrs]         = useState<Record<string, boolean>>({});

  const submit = () => {
    if (!name.trim()) { setErrs({ name: true }); return; }
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    if (isEdit && initial) {
      onDone({ ...initial, name: name.trim() });
    } else {
      onDone({ id: Date.now(), name: name.trim(), gpuCount: 0, services: 0, nodeCount: 0, nodeVersion: "0/0", resourceGroups: 0, status: "Unknown", clusterBase: clusterKind === "gpu" ? "GPU服务" : "模型服务", isDefault: false, createdAt: ts });
    }
    onClose();
  };

  // Card style — disabled (grayed) when editing
  const cardStyle = (selected: boolean, disabled = false): React.CSSProperties => ({
    flex: 1, padding: "14px 16px", borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .15s",
    border: `1.5px solid ${selected ? "#4f6ef7" : "#e0e3ed"}`,
    background: disabled ? "#f8f9fc" : selected ? "#f5f8ff" : "#fff",
    opacity: disabled && !selected ? 0.5 : 1,
  });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 460, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.14)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>
            {isEdit ? `编辑集群：${initial!.name}` : "创建集群"}
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto" style={{ padding: "20px 20px 0" }}>

          {/* 当前环境 */}
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
            当前环境：<span style={{ color: "#1a1d23", fontWeight: 500 }}>Kubernetes</span>
          </div>

          {/* 名称 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              名称 <span style={{ color: "#ef4444" }}>*</span>
            </div>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setErrs({}); }}
              style={{
                ...inpSt,
                borderColor: errs.name ? "#ef4444" : name ? "#4f6ef7" : "#e0e3ed",
                boxShadow: name && !errs.name ? "0 0 0 2px rgba(79,110,247,0.1)" : "none",
              }}
            />
            {errs.name && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>请输入集群名称</div>}
          </div>

          {/* 描述 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>描述</div>
            <input value={desc} onChange={e => setDesc(e.target.value)} style={inpSt} />
          </div>

          {/* 集群底座 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 10 }}>
              集群底座 <span style={{ color: "#ef4444" }}>*</span>
            </div>
            <div className="flex gap-3">
              {/* GPU 服务 */}
              <div style={cardStyle(clusterKind === "gpu", isEdit)} onClick={() => !isEdit && setKind("gpu")}>
                <div className="flex items-center gap-2 mb-2">
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${clusterKind === "gpu" ? "#4f6ef7" : "#d1d5db"}`,
                    background: clusterKind === "gpu" ? "#4f6ef7" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {clusterKind === "gpu" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1a1d23" }}>GPU 服务</span>
                </div>
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7, margin: 0 }}>
                  适用于按需分配 GPU 计算资源的场景，例如交互式开发、训练任务或自定义运行环境。
                </p>
              </div>

              {/* 模型服务 */}
              <div style={cardStyle(clusterKind === "model", isEdit)} onClick={() => !isEdit && setKind("model")}>
                <div className="flex items-center gap-2 mb-2">
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${clusterKind === "model" ? "#4f6ef7" : "#d1d5db"}`,
                    background: clusterKind === "model" ? "#4f6ef7" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {clusterKind === "model" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1a1d23" }}>模型服务</span>
                </div>
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7, margin: 0 }}>
                  适用于大模型推理与 API 服务化场景，例如对外提供模型 API 与 Token 服务能力。
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end flex-shrink-0" style={{ padding: "14px 20px", borderTop: "1px solid #f0f2f7" }}>
          <button onClick={submit}
            style={{ height: 36, padding: "0 32px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 7, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")}
            onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>保存</button>
        </div>
      </div>
    </>
  );
}

// ─── Register Cluster Modal ────────────────────────────────────────────────────

const CMD_CHECK_NVIDIA = `kubectl get containers -n kube-system -o yaml | grep -i "nvidia.runtime.class" | awk -F: '{print $2}' | head -n 2 &
nodes_without_nvidia=$(kubectl get nodes -o json | jq -r '.items[] | select(.status.allocatable["nvidia.com/gpu"] == null) | .metadata.name'); echo "$nodes_without_nvidia"`;

const CMD_RUN = `curl -L "http://10.96.166.121:1234/api/v1/Clusters/tokens" -H "Authorization: Bearer <...>" -d '{"kubernetes_cluster_id":"..."}' | kubectl apply -f -
gpustack_20271727847476_7c3 XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`;

function RegisterClusterModal({ clusterName, onClose }: { clusterName: string; onClose: () => void }) {
  const [step, setStep]         = useState(1);
  const [vendor, setVendor]     = useState<"NVIDIA" | "晟腾" | null>(null);

  const stepOpen = (s: number) => step === s;

  const StepHeader = ({ n, title, subtitle }: { n: number; title: string; subtitle?: string }) => (
    <button
      onClick={() => { if (n < step) setStep(n); }}
      className="flex items-center justify-between w-full"
      style={{ padding: "14px 16px", background: "#fff", border: "none", cursor: n < step ? "pointer" : "default", textAlign: "left" }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: stepOpen(n) ? "#1a1d23" : "#374151" }}>
          {n}. {title}
        </div>
        {subtitle && !stepOpen(n) && (
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {!stepOpen(n) && <ChevronDown size={14} color="#9ca3af" />}
      {stepOpen(n) && <ChevronUp size={14} color="#6b7280" />}
    </button>
  );

  const RadioCard = ({ label }: { label: "NVIDIA" | "晟腾" }) => (
    <label className="flex items-center gap-2" style={{ cursor: "pointer", fontSize: 13.5, color: "#374151" }}>
      <span style={{
        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${vendor === label ? "#4f6ef7" : "#d1d5db"}`,
        background: vendor === label ? "#4f6ef7" : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {vendor === label && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "block" }} />}
      </span>
      <input type="radio" name="vendor" checked={vendor === label} onChange={() => setVendor(label)} style={{ display: "none" }} />
      {label}
    </label>
  );

  const CodeBlock = ({ code }: { code: string }) => (
    <div style={{ background: "#1a1d2e", borderRadius: 8, padding: "14px 16px", marginTop: 10, marginBottom: 14 }}>
      <pre style={{ margin: 0, fontSize: 12, color: "#e2e8f0", fontFamily: "monospace", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{code}</pre>
    </div>
  );

  const NavBtns = ({ onPrev, onNext, nextLabel = "下一步" }: { onPrev?: () => void; onNext: () => void; nextLabel?: string }) => (
    <div className="flex items-center justify-end gap-2" style={{ marginTop: 14 }}>
      {onPrev && (
        <button onClick={onPrev} style={{ height: 32, padding: "0 18px", fontSize: 13, border: "1px solid #e0e3ed", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#374151" }}>上一步</button>
      )}
      <button onClick={onNext} style={{ height: 32, padding: "0 20px", fontSize: 13, fontWeight: 500, border: "none", borderRadius: 6, background: "#4f6ef7", color: "#fff", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
        {nextLabel}
      </button>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 100 }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "#fff", zIndex: 101, boxShadow: "-8px 0 32px rgba(0,0,0,0.14)", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#1a1d23" }}>注册集群</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4 }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">

          {/* Step 1 */}
          <div style={{ borderBottom: "1px solid #f0f2f7" }}>
            <StepHeader n={1} title="选择GPU厂商"
              subtitle={vendor ? `已选择：${vendor}` : "适于选择以用于该 GPU 的集群"} />
            {stepOpen(1) && (
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 14 }}>适于选择以用于该 GPU 的集群</div>
                <div className="flex items-center gap-8" style={{ marginBottom: 4 }}>
                  <RadioCard label="NVIDIA" />
                  <RadioCard label="晟腾" />
                </div>
                <NavBtns onNext={() => setStep(2)} />
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div style={{ borderBottom: "1px solid #f0f2f7" }}>
            <StepHeader n={2} title="检查环境" />
            {stepOpen(2) && (
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 4 }}>在继续之前，请先确认当前环境已满足运行条件</div>
                <CodeBlock code={CMD_CHECK_NVIDIA} />
                <NavBtns onPrev={() => setStep(1)} onNext={() => setStep(3)} />
              </div>
            )}
          </div>

          {/* Step 3 */}
          <div>
            <StepHeader n={3} title="运行指令" />
            {stepOpen(3) && (
              <div style={{ padding: "0 16px 16px" }}>
                <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.7, marginBottom: 4 }}>
                  在完成安装之前，请先完成以下步骤。在 Kubernetes 上运行，然后，选择 Kubernetes 设置，然后将以下指令粘贴到终端执行：
                </div>
                <CodeBlock code={CMD_RUN} />
                <NavBtns onPrev={() => setStep(2)} onNext={onClose} nextLabel="完成" />
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function ClusterListPage() {
  const [clusters, setClusters] = useState<Cluster[]>(CLUSTERS_INIT);
  const [search, setSearch]     = useState("");
  const [query, setQuery]       = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editCluster, setEditCluster]         = useState<Cluster | null>(null);
  const [registerCluster, setRegisterCluster] = useState<Cluster | null>(null);

  const filtered = clusters.filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()));

  const thSt: React.CSSProperties = { padding: "11px 14px", textAlign: "left", fontWeight: 500, color: "#6b7280", fontSize: 12.5, borderBottom: "1px solid #f0f2f7", background: "#f8f9fc", whiteSpace: "nowrap" };
  const tdSt: React.CSSProperties = { padding: "12px 14px", fontSize: 13, borderBottom: "1px solid #f5f7fa", color: "#374151" };

  const statusCfg = {
    "Ready":    { bg: "#f0faf5", text: "#16a34a", dot: "#22c55e" },
    "NotReady": { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
    "Unknown":  { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "#f5f7fa" }}>
      <div className="flex items-center gap-1.5 flex-shrink-0" style={{ padding: "14px 24px 0", fontSize: 13, color: "#6b7280" }}>
        <span style={{ color: "#4f6ef7" }}>首页</span><span>/</span>
        <span style={{ color: "#4f6ef7" }}>资源管理</span><span>/</span>
        <span style={{ color: "#1a1d23", fontWeight: 500 }}>集群</span>
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded-xl" style={{ margin: "14px 24px 24px", background: "#fff", border: "1px solid #e8ebf2" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid #f0f2f7" }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md" style={{ border: "1px solid #e0e3ed", height: 34, padding: "0 10px", background: "#fff" }}>
              <Search size={13} color="#9ca3af" style={{ marginRight: 6 }} />
              <input type="text" placeholder="搜索集群名称" value={search}
                onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && setQuery(search)}
                style={{ fontSize: 13, border: "none", outline: "none", width: 160, background: "transparent" }} />
            </div>
            <button onClick={() => setQuery(search)} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <Search size={13} /> 搜索
            </button>
            <button onClick={() => { setSearch(""); setQuery(""); }} style={{ display: "flex", alignItems: "center", gap: 5, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "#fff", border: "1px solid #e0e3ed", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fc")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
              <RotateCcw size={13} /> 重置
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", fontSize: 13, fontWeight: 500, color: "#fff", background: "#4f6ef7", border: "none", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.background = "#4f6ef7")}>
              <Plus size={14} /> 添加集群
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["集群名称", "GPU卡数", "已部署服务", "节点数", "已划分资源组", "集群状态", "集群底座", "创建时间", "操作"].map(c => (
                  <th key={c} style={thSt}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "56px 0", color: "#9ca3af", fontSize: 13 }}>暂无数据</td></tr>
              ) : filtered.map(cl => {
                const sc = statusCfg[cl.status];
                return (
                  <tr key={cl.id}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafbfd")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ ...tdSt, fontWeight: 500, color: "#1a1d23" }}>
                      <div className="flex items-center gap-2">
                        {cl.name}
                        {cl.isDefault && <span style={{ fontSize: 11, fontWeight: 500, padding: "1px 6px", borderRadius: 4, background: "#eff4ff", color: "#4f6ef7" }}>默认</span>}
                      </div>
                    </td>
                    <td style={tdSt}>{cl.gpuCount}</td>
                    <td style={tdSt}>{cl.services}</td>
                    <td style={tdSt}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "monospace", fontSize: 12.5 }}>{cl.nodeVersion}</span>
                        <button style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}>管理</button>
                      </div>
                    </td>
                    <td style={tdSt}>
                      <div className="flex items-center gap-2">
                        <span>{cl.resourceGroups}</span>
                        <button style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>管理</button>
                      </div>
                    </td>
                    <td style={tdSt}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 500, padding: "2px 8px", borderRadius: 5, background: sc.bg, color: sc.text }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "block" }} />
                        {cl.status}
                      </span>
                    </td>
                    <td style={tdSt}>{cl.clusterBase}</td>
                    <td style={{ ...tdSt, color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{cl.createdAt}</td>
                    <td style={tdSt}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setEditCluster(cl)} style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>编辑</button>
                        <button onClick={() => setRegisterCluster(cl)} style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>注册集群</button>
                        <button onClick={() => setClusters(prev => prev.map(c => c.id === cl.id ? { ...c, isDefault: true } : { ...c, isDefault: false }))}
                          style={{ fontSize: 12.5, color: "#4f6ef7", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#3b5de8")} onMouseLeave={e => (e.currentTarget.style.color = "#4f6ef7")}>设为默认</button>
                        <button onClick={() => setClusters(prev => prev.filter(c => c.id !== cl.id))}
                          style={{ fontSize: 12.5, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 500 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")} onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}>删除</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0" style={{ padding: "12px 16px", borderTop: "1px solid #f0f2f7" }}>
          <span style={{ fontSize: 12.5, color: "#9ca3af" }}>共 {filtered.length} 条</span>
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #4f6ef7", borderRadius: 5, background: "#4f6ef7", color: "#fff", fontSize: 12.5, fontWeight: 600 }}>1</div>
        </div>
      </div>

      {registerCluster && (
        <RegisterClusterModal
          clusterName={registerCluster.name}
          onClose={() => setRegisterCluster(null)} />
      )}
      {editCluster && (
        <CreateClusterDrawer
          initial={editCluster}
          onClose={() => setEditCluster(null)}
          onDone={c => { setClusters(prev => prev.map(x => x.id === c.id ? c : x)); setEditCluster(null); }}
        />
      )}
      {showCreate && (
        <CreateClusterDrawer
          onClose={() => setShowCreate(false)}
          onDone={c => { setClusters(prev => [...prev, c]); setShowCreate(false); }}
        />
      )}
    </div>
  );
}
