import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Activity, CheckCircle2, Cpu, Network, Plus, RefreshCw, ScanLine, Server, ShieldCheck, X } from "lucide-react";

const C = {
  ink: "#1a1d23",
  text: "#374151",
  muted: "#6b7280",
  faint: "#9ca3af",
  line: "#e8ebf2",
  softLine: "#f0f2f7",
  page: "#f5f7fa",
  blue: "#4f6ef7",
  blueSoft: "#eff4ff",
  green: "#16a34a",
  greenSoft: "#f0faf5",
  amber: "#b45309",
  amberSoft: "#fff8eb",
};

interface NodeResource {
  name: string;
  ip: string;
  cpu: number;
  cpuDetail: string;
  gpu: number;
  gpuDetail: string;
  memory: number;
  memoryDetail: string;
  networkIn: number;
  networkOut: number;
}

const nodes: NodeResource[] = [
  {
    name: "a100-node01",
    ip: "192.168.12.21",
    cpu: 62,
    cpuDetail: "60 / 96 核",
    gpu: 91,
    gpuDetail: "4 × A100 80GB",
    memory: 68,
    memoryDetail: "348 / 512 GB",
    networkIn: 118,
    networkOut: 96,
  },
  {
    name: "a100-node02",
    ip: "192.168.12.22",
    cpu: 55,
    cpuDetail: "53 / 96 核",
    gpu: 86,
    gpuDetail: "4 × A100 80GB",
    memory: 63,
    memoryDetail: "323 / 512 GB",
    networkIn: 110,
    networkOut: 102,
  },
  {
    name: "a100-node03",
    ip: "192.168.12.23",
    cpu: 39,
    cpuDetail: "37 / 96 核",
    gpu: 42,
    gpuDetail: "4 × A100 80GB",
    memory: 48,
    memoryDetail: "246 / 512 GB",
    networkIn: 36,
    networkOut: 28,
  },
];

const panel: CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  background: "#fff",
};

const thStyle: CSSProperties = {
  padding: "10px 14px",
  borderBottom: `1px solid ${C.softLine}`,
  color: C.muted,
  background: "#f8f9fc",
  fontSize: 12.5,
  fontWeight: 500,
  textAlign: "left",
};

const fieldStyle: CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 10px",
  border: `1px solid ${C.line}`,
  borderRadius: 6,
  outline: "none",
  color: C.text,
  background: "#fff",
  fontSize: 12,
};

function SectionHeader({ icon, title, description, meta }: {
  icon: ReactNode;
  title: string;
  description: string;
  meta?: ReactNode;
}) {
  return (
    <div className="dcm-section-header" style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.softLine}` }}>
      <span style={{ width: 30, height: 30, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: 7, color: C.blue, background: C.blueSoft }}>
        {icon}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h2 style={{ margin: 0, color: C.ink, fontSize: 13.5, lineHeight: 1.4, fontWeight: 650 }}>{title}</h2>
        <p style={{ margin: "3px 0 0", color: C.muted, fontSize: 11.5, lineHeight: 1.45 }}>{description}</p>
      </div>
      {meta}
    </div>
  );
}

function ResourceMeter({ value, detail }: { value: number; detail: string }) {
  return (
    <div className="dcm-meter" style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <b style={{ color: C.text, fontSize: 12.5, fontWeight: 600 }}>{value}%</b>
        <span style={{ color: C.faint, fontSize: 10.5, whiteSpace: "nowrap" }}>{detail}</span>
      </div>
      <div aria-hidden="true" style={{ marginTop: 6, height: 5, overflow: "hidden", borderRadius: 99, background: "#edf0f4" }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 99, background: C.blue }} />
      </div>
    </div>
  );
}

function NodeTable({ clusterNodes }: { clusterNodes: NodeResource[] }) {
  return (
    <div className="dcm-node-table-wrap">
      <table className="dcm-node-table" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: "22%" }}>节点</th>
            <th style={{ ...thStyle, width: "18%" }}>CPU</th>
            <th style={{ ...thStyle, width: "22%" }}>GPU</th>
            <th style={{ ...thStyle, width: "20%" }}>内存</th>
            <th style={{ ...thStyle, width: "18%" }}>网络带宽</th>
          </tr>
        </thead>
        <tbody>
          {clusterNodes.map((node, index) => (
            <tr key={node.name}>
              <td data-label="节点" style={{ padding: "12px 14px", borderBottom: index < clusterNodes.length - 1 ? `1px solid ${C.softLine}` : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 28, height: 28, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: 6, color: C.muted, background: C.page }}>
                    <Server size={14} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <b style={{ display: "block", color: C.ink, fontSize: 12.5, fontWeight: 600, overflowWrap: "anywhere" }}>{node.name}</b>
                    <code style={{ display: "block", marginTop: 2, color: C.faint, fontSize: 10.5 }}>{node.ip}</code>
                  </div>
                </div>
              </td>
              <td data-label="CPU" style={{ padding: "12px 14px", borderBottom: index < clusterNodes.length - 1 ? `1px solid ${C.softLine}` : 0 }}>
                <ResourceMeter value={node.cpu} detail={node.cpuDetail} />
              </td>
              <td data-label="GPU" style={{ padding: "12px 14px", borderBottom: index < clusterNodes.length - 1 ? `1px solid ${C.softLine}` : 0 }}>
                <ResourceMeter value={node.gpu} detail={node.gpuDetail} />
              </td>
              <td data-label="内存" style={{ padding: "12px 14px", borderBottom: index < clusterNodes.length - 1 ? `1px solid ${C.softLine}` : 0 }}>
                <ResourceMeter value={node.memory} detail={node.memoryDetail} />
              </td>
              <td data-label="网络带宽" style={{ padding: "12px 14px", borderBottom: index < clusterNodes.length - 1 ? `1px solid ${C.softLine}` : 0 }}>
                <div style={{ display: "grid", gap: 4, color: C.text, fontSize: 11.5, whiteSpace: "nowrap" }}>
                  <span><span style={{ color: C.faint }}>入</span> {node.networkIn} / <span style={{ color: C.faint }}>出</span> {node.networkOut} Gbps</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GpuMesh() {
  return (
    <div className="dcm-gpu-mesh" aria-label="4 块 A100 GPU 通过 NVLink 互联">
      {[0, 1, 2, 3].map(index => (
        <div key={index} className="dcm-gpu" style={{ minHeight: 40, padding: "7px 5px", position: "relative", zIndex: 1, display: "grid", placeItems: "center", border: "1px solid #cbd5ff", borderRadius: 6, color: C.blue, background: "#f7f9ff", textAlign: "center" }}>
          <b style={{ fontSize: 10.5, fontWeight: 650 }}>GPU {index}</b>
          <span style={{ color: C.muted, fontSize: 9.5 }}>A100 80GB</span>
        </div>
      ))}
    </div>
  );
}

function TopologyNode({ node }: { node: NodeResource }) {
  return (
    <article className="dcm-topology-node" style={{ minWidth: 0, padding: 12, position: "relative", border: `1px solid ${C.line}`, borderRadius: 8, background: "#fff" }}>
      <div style={{ marginBottom: 11, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <b style={{ display: "block", color: C.ink, fontSize: 11.5, fontWeight: 650, overflowWrap: "anywhere" }}>{node.name}</b>
          <code style={{ display: "block", marginTop: 2, color: C.faint, fontSize: 9.5 }}>{node.ip}</code>
        </div>
        <span style={{ flex: "0 0 auto", color: C.blue, fontSize: 9.5, fontWeight: 600 }}>IB 400 Gbps</span>
      </div>
      <div className="dcm-pcie-root" style={{ width: "fit-content", margin: "0 auto 16px", padding: "4px 8px", position: "relative", zIndex: 1, border: "1px solid #dfe3eb", borderRadius: 5, color: C.muted, background: C.page, fontSize: 9.5, fontWeight: 600 }}>
        PCIe Gen4 Root
      </div>
      <GpuMesh />
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: C.muted, fontSize: 9.5 }}>
        <span style={{ width: 18, height: 3, borderRadius: 99, background: "#8ea2fa" }} />
        NVLink 600 GB/s
      </div>
    </article>
  );
}

function TopologyView({ clusterNodes }: { clusterNodes: NodeResource[] }) {
  return (
    <figure style={{ margin: 0, padding: "18px 16px 16px", background: "#fcfdff" }} aria-label="集群节点网络与 GPU 互联拓扑">
      <div className="dcm-fabric" style={{ width: "fit-content", maxWidth: "100%", margin: "0 auto", padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, border: "1px solid #b9c6ff", borderRadius: 7, color: C.blue, background: C.blueSoft }}>
        <Network size={15} />
        <div style={{ minWidth: 0 }}>
          <b style={{ display: "block", fontSize: 11.5, fontWeight: 650 }}>InfiniBand Fabric · leaf-02</b>
          <span style={{ display: "block", marginTop: 1, color: C.muted, fontSize: 9.5 }}>节点网络 · 400 Gbps</span>
        </div>
      </div>

      <div className="dcm-network-bus" aria-hidden="true" />

      <div className="dcm-topology-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        {clusterNodes.map(node => <TopologyNode key={node.name} node={node} />)}
      </div>

      <figcaption style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap", color: C.faint, fontSize: 10.5 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 22, height: 3, borderRadius: 99, background: C.blue }} />节点间 InfiniBand</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 22, height: 3, borderRadius: 99, background: "#8ea2fa" }} />GPU 间 NVLink</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 22, height: 1, background: "#c7cdd8" }} />GPU 与 PCIe Root</span>
      </figcaption>
    </figure>
  );
}

interface ScanNodeDialogProps {
  onClose: () => void;
  onConfirm: (node: NodeResource) => void;
}

function ScanNodeDialog({ onClose, onConfirm }: ScanNodeDialogProps) {
  const [ip, setIp] = useState("192.168.12.24");
  const [port, setPort] = useState("22");
  const [sshUser, setSshUser] = useState("cluster-admin");
  const [credentialMode, setCredentialMode] = useState("SSH 密钥（凭据中心）");
  const [scanReady, setScanReady] = useState(false);

  const scannedNode = useMemo<NodeResource>(() => {
    const suffix = ip.split(".").at(-1) || "04";
    return {
      name: `a100-node${suffix.padStart(2, "0")}`,
      ip,
      cpu: 12,
      cpuDetail: "12 / 96 核",
      gpu: 0,
      gpuDetail: "4 × A100 80GB",
      memory: 9,
      memoryDetail: "44 / 512 GB",
      networkIn: 0,
      networkOut: 0,
    };
  }, [ip]);

  const resetScan = () => setScanReady(false);

  return (
    <div className="dcm-modal-layer" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="dcm-modal" role="dialog" aria-modal="true" aria-labelledby="scan-node-title">
        <header style={{ padding: "15px 18px", display: "flex", alignItems: "flex-start", gap: 12, borderBottom: `1px solid ${C.softLine}` }}>
          <span style={{ width: 32, height: 32, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: 7, color: C.blue, background: C.blueSoft }}>
            <ScanLine size={16} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 id="scan-node-title" style={{ margin: 0, color: C.ink, fontSize: 15, fontWeight: 650 }}>接入并扫描节点</h2>
            <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 11.5, lineHeight: 1.5 }}>连接计算节点，读取硬件与网络信息后再确认接入集群。</p>
          </div>
          <button type="button" aria-label="关闭" onClick={onClose} style={{ width: 28, height: 28, padding: 0, display: "grid", placeItems: "center", border: 0, borderRadius: 6, color: C.muted, background: "transparent", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </header>

        <div className="dcm-modal-body" style={{ padding: 18, overflowY: "auto" }}>
          <div className="dcm-scan-fields" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.45fr) 88px minmax(0,1fr)", gap: 12 }}>
            <label style={{ minWidth: 0, color: C.text, fontSize: 11.5, fontWeight: 550 }}>
              <span style={{ display: "block", marginBottom: 6 }}>节点 IP</span>
              <input aria-label="节点 IP" value={ip} onChange={event => { setIp(event.target.value); resetScan(); }} style={fieldStyle} />
            </label>
            <label style={{ minWidth: 0, color: C.text, fontSize: 11.5, fontWeight: 550 }}>
              <span style={{ display: "block", marginBottom: 6 }}>SSH 端口</span>
              <input aria-label="SSH 端口" value={port} inputMode="numeric" onChange={event => { setPort(event.target.value); resetScan(); }} style={fieldStyle} />
            </label>
            <label style={{ minWidth: 0, color: C.text, fontSize: 11.5, fontWeight: 550 }}>
              <span style={{ display: "block", marginBottom: 6 }}>SSH 用户</span>
              <input aria-label="SSH 用户" value={sshUser} onChange={event => { setSshUser(event.target.value); resetScan(); }} style={fieldStyle} />
            </label>
          </div>

          <label style={{ marginTop: 13, display: "block", color: C.text, fontSize: 11.5, fontWeight: 550 }}>
            <span style={{ display: "block", marginBottom: 6 }}>凭证方式</span>
            <select aria-label="凭证方式" value={credentialMode} onChange={event => { setCredentialMode(event.target.value); resetScan(); }} style={fieldStyle}>
              <option>SSH 密钥（凭据中心）</option>
              <option>用户名密码（凭据中心）</option>
            </select>
          </label>

          <div style={{ marginTop: 10, padding: "8px 10px", display: "flex", alignItems: "flex-start", gap: 7, borderRadius: 6, color: C.muted, background: C.page, fontSize: 10.5, lineHeight: 1.5 }}>
            <ShieldCheck size={13} color={C.green} style={{ marginTop: 1, flex: "0 0 auto" }} />
            <span>仅引用平台凭据中心中的记录，页面不回显 SSH 密钥或密码。</span>
          </div>

          <button type="button" onClick={() => setScanReady(true)} disabled={!ip.trim() || !port.trim() || !sshUser.trim()} style={{ marginTop: 13, height: 34, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 7, border: 0, borderRadius: 6, color: "#fff", background: C.blue, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
            <ScanLine size={14} />扫描资源
          </button>

          {scanReady && (
            <section aria-label="扫描结果" style={{ marginTop: 15, overflow: "hidden", border: `1px solid #cfe8d8`, borderRadius: 7, background: "#fff" }}>
              <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #dcefe3", color: C.green, background: C.greenSoft }}>
                <CheckCircle2 size={15} />
                <b style={{ fontSize: 11.5, fontWeight: 650 }}>扫描完成</b>
                <span style={{ marginLeft: "auto", color: C.muted, fontSize: 10.5 }}>{scannedNode.name} · {ip}:{port}</span>
              </div>
              <div className="dcm-scan-result" style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8 }}>
                {[
                  ["GPU", "NVIDIA A100 · 4 块 · 单卡 80GB"],
                  ["内存", "512GB · 当前可用 468GB"],
                  ["网络接口", "mlx5_0（InfiniBand 400Gbps）"],
                  ["网卡", "bond0（25GbE）· 状态正常"],
                ].map(([label, value]) => (
                  <div key={label} style={{ minWidth: 0, padding: "9px 10px", border: `1px solid ${C.softLine}`, borderRadius: 6, background: "#fbfcfe" }}>
                    <span style={{ display: "block", color: C.faint, fontSize: 9.5 }}>{label}</span>
                    <b style={{ marginTop: 4, display: "block", color: C.text, fontSize: 10.5, lineHeight: 1.45, fontWeight: 600 }}>{value}</b>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, padding: "0 12px 12px", color: C.amber, fontSize: 10.5, lineHeight: 1.5 }}>请确认资源信息；接入后节点将出现在下方资源列表和物理拓扑中。</p>
            </section>
          )}
        </div>

        <footer style={{ padding: "11px 18px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, borderTop: `1px solid ${C.softLine}`, background: "#fbfcfe" }}>
          <button type="button" onClick={onClose} style={{ height: 32, padding: "0 13px", border: `1px solid ${C.line}`, borderRadius: 6, color: C.text, background: "#fff", fontSize: 11.5, cursor: "pointer" }}>取消</button>
          <button type="button" disabled={!scanReady} onClick={() => onConfirm(scannedNode)} style={{ height: 32, padding: "0 13px", border: 0, borderRadius: 6, color: scanReady ? "#fff" : C.faint, background: scanReady ? C.blue : "#e5e7eb", fontSize: 11.5, fontWeight: 600, cursor: scanReady ? "pointer" : "not-allowed" }}>确认接入</button>
        </footer>
      </section>
    </div>
  );
}

export function DistributedClusterMonitor() {
  const [clusterNodes, setClusterNodes] = useState(nodes);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);

  const addScannedNode = (node: NodeResource) => {
    setClusterNodes(current => current.some(item => item.ip === node.ip) ? current : [...current, node]);
    setScanDialogOpen(false);
  };

  return (
    <div className="dcm-page" style={{ width: "100%", height: "100%", overflowX: "hidden", overflowY: "auto", background: C.page }}>
      <main style={{ width: "100%", maxWidth: 1480, margin: "0 auto", padding: "14px 24px 28px" }}>
        <nav aria-label="面包屑" style={{ display: "flex", alignItems: "center", gap: 6, color: C.muted, fontSize: 13 }}>
          <span style={{ color: C.blue }}>首页</span><span>/</span>
          <span style={{ color: C.blue }}>资源管理</span><span>/</span>
          <span style={{ color: C.ink, fontWeight: 500 }}>集群资源监控</span>
        </nav>

        <header className="dcm-page-header" style={{ padding: "12px 0", display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ margin: 0, color: C.ink, fontSize: 18, lineHeight: 1.4, fontWeight: 700 }}>集群资源监控</h1>
            <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 12, lineHeight: 1.5 }}>a100-prod-cluster · {clusterNodes.length} 个节点 · {clusterNodes.length * 4} 块 GPU</p>
          </div>
          <div className="dcm-header-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setScanDialogOpen(true)} style={{ height: 34, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 7, border: 0, borderRadius: 7, color: "#fff", background: C.blue, fontSize: 11.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Plus size={14} />接入并扫描节点
            </button>
            <div className="dcm-refresh-status" role="status" aria-label="数据自动刷新状态" style={{ padding: "7px 10px", display: "flex", alignItems: "center", gap: 7, border: `1px solid ${C.line}`, borderRadius: 7, color: C.muted, background: "#fff", fontSize: 11.5, whiteSpace: "nowrap" }}>
              <RefreshCw size={12} color={C.green} />
              <span><b style={{ color: C.green, fontWeight: 600 }}>自动刷新</b> · 每 10 秒</span>
              <span style={{ color: C.faint }}>最近更新：刚刚</span>
            </div>
          </div>
        </header>

        <div style={{ display: "grid", gap: 12 }}>
          <section style={panel}>
            <SectionHeader
              icon={<Activity size={15} />}
              title="节点资源"
              description="CPU、GPU、内存及节点网络带宽的当前使用情况"
              meta={<span style={{ color: C.faint, fontSize: 11 }}>只读</span>}
            />
            <NodeTable clusterNodes={clusterNodes} />
          </section>

          <section style={panel}>
            <SectionHeader
              icon={<Cpu size={15} />}
              title="节点网络与 GPU 互联拓扑"
              description="节点间 InfiniBand 网络，以及节点内 PCIe 和 NVLink 连接"
              meta={<span style={{ color: C.faint, fontSize: 11 }}>只读</span>}
            />
            <TopologyView clusterNodes={clusterNodes} />
          </section>
        </div>
      </main>

      {scanDialogOpen && <ScanNodeDialog onClose={() => setScanDialogOpen(false)} onConfirm={addScannedNode} />}

      <style>{`
        .dcm-page, .dcm-page * { box-sizing: border-box; }
        .dcm-node-table tbody tr { transition: background .15s ease; }
        .dcm-node-table tbody tr:hover { background: #fafbfd; }

        .dcm-modal-layer {
          padding: 24px;
          position: fixed;
          z-index: 100;
          inset: 0;
          display: grid;
          place-items: center;
          background: rgba(18, 24, 38, .42);
          backdrop-filter: blur(2px);
        }
        .dcm-modal {
          width: min(620px, 100%);
          max-height: min(700px, calc(100vh - 48px));
          overflow: hidden;
          display: flex;
          flex-direction: column;
          border: 1px solid ${C.line};
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 20px 60px rgba(20, 28, 48, .18);
        }

        .dcm-network-bus {
          width: 100%;
          height: 34px;
          position: relative;
        }
        .dcm-network-bus::before {
          content: "";
          width: 3px;
          position: absolute;
          top: 0;
          bottom: 14px;
          left: 50%;
          border-radius: 99px;
          background: ${C.blue};
          transform: translateX(-50%);
        }
        .dcm-network-bus::after {
          content: "";
          height: 3px;
          position: absolute;
          right: 16.66%;
          bottom: 12px;
          left: 16.66%;
          border-radius: 99px;
          background: ${C.blue};
        }
        .dcm-topology-node::before {
          content: "";
          width: 3px;
          height: 15px;
          position: absolute;
          top: -15px;
          left: 50%;
          border-radius: 99px;
          background: ${C.blue};
          transform: translateX(-50%);
        }
        .dcm-pcie-root::after {
          content: "";
          width: 1px;
          height: 13px;
          position: absolute;
          top: 100%;
          left: 50%;
          background: #c7cdd8;
        }
        .dcm-gpu-mesh {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 10px 12px;
          position: relative;
        }
        .dcm-gpu-mesh::before {
          content: "";
          height: 3px;
          position: absolute;
          top: 50%;
          right: 22%;
          left: 22%;
          border-radius: 99px;
          background: #8ea2fa;
          transform: translateY(-50%);
        }
        .dcm-gpu-mesh::after {
          content: "";
          width: 3px;
          position: absolute;
          top: 22%;
          bottom: 22%;
          left: 50%;
          border-radius: 99px;
          background: #8ea2fa;
          transform: translateX(-50%);
        }

        @media (max-width: 900px) {
          .dcm-node-table thead { display: none; }
          .dcm-node-table, .dcm-node-table tbody { display: block; width: 100%; }
          .dcm-node-table tbody { padding: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: ${C.page}; }
          .dcm-node-table tr { min-width: 0; display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; border: 1px solid ${C.line}; border-radius: 7px; background: #fff; }
          .dcm-node-table td { min-width: 0; padding: 10px !important; border-bottom: 1px solid ${C.softLine} !important; }
          .dcm-node-table td::before { content: attr(data-label); margin-bottom: 6px; display: block; color: ${C.faint}; font-size: 10.5px; font-weight: 500; }
          .dcm-node-table td:first-child { grid-column: 1 / -1; }
          .dcm-node-table td:last-child { border-bottom: 0 !important; }
          .dcm-topology-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .dcm-network-bus { height: 24px; }
          .dcm-network-bus::after { display: none; }
          .dcm-network-bus::before { bottom: 0; }
          .dcm-topology-node::before { display: none; }
          .dcm-topology-node:not(:first-child)::before { display: block; height: 24px; top: -25px; }
        }

        @media (max-width: 640px) {
          .dcm-page main { padding: 12px 12px 24px !important; }
          .dcm-page-header { flex-direction: column; gap: 10px !important; }
          .dcm-header-actions { width: 100%; justify-content: flex-start !important; }
          .dcm-refresh-status { width: 100%; flex-wrap: wrap; white-space: normal !important; }
          .dcm-section-header { align-items: flex-start !important; flex-wrap: wrap; }
          .dcm-section-header > :last-child { margin-left: 40px; }
          .dcm-node-table tbody { grid-template-columns: 1fr; }
          .dcm-meter > div:first-child { flex-wrap: wrap; }
          .dcm-modal-layer { padding: 10px; place-items: end center; }
          .dcm-modal { max-height: calc(100vh - 20px); border-radius: 10px 10px 0 0; }
          .dcm-scan-fields { grid-template-columns: 1fr 88px !important; }
          .dcm-scan-fields > :last-child { grid-column: 1 / -1; }
          .dcm-scan-result { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 420px) {
          .dcm-node-table tr { grid-template-columns: 1fr; }
          .dcm-node-table td:first-child { grid-column: auto; }
          .dcm-topology-grid { gap: 20px !important; }
          .dcm-topology-node:not(:first-child)::before { height: 20px; top: -21px; }
        }
      `}</style>
    </div>
  );
}
