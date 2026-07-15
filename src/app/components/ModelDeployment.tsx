import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Activity,
  ChevronRight,
  Copy,
  Edit3,
  Minus,
  MoreVertical,
  Play,
  Plus,
  RefreshCw,
  Search,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { MODEL_CATEGORIES } from "../model-management/types";
import { RESOURCE_CAPACITIES } from "../model-management/data";
import type { DeploymentRecord, ModelInstanceRecord, ModelRecord, PlacementStrategy } from "../model-management/types";

interface ModelDeploymentPageProps {
  models: ModelRecord[];
  deployments: DeploymentRecord[];
  onDeploymentsChange: (deployments: DeploymentRecord[]) => void;
  instances?: ModelInstanceRecord[];
  onInstancesChange?: (instances: ModelInstanceRecord[]) => void;
  prefillModelId?: string | null;
  onPrefillConsumed?: () => void;
}

type DeployModalMode = "add" | "edit" | "clone";
type DeploySortKey = "name" | "resourceGroup" | "source" | "replicas" | "createdAt";
type ReplicaEdit = { running: number; configured: number };

const DEPLOY_RESOURCE_GROUPS = ["推理组", "测试1", "GPU-Cluster-Prod"];

const SOURCE_BY_DEPLOYMENT: Record<string, string> = {
  "qwen3.6-27b": "Hugging Face/Qwen/Qwen3.6-27B",
  "demo-whisper-large-v3": "Hugging Face/openai/whisper-large-v3",
  "glm-4-flash-prod": "Hugging Face/THUDM/glm-4-flash",
};

const STATIC_DEPLOYMENT_CHILDREN: Record<string, Array<{ name: string; status: DeploymentRecord["status"]; createdAt: string }>> = {
  "qwen3.6-27b": [
    { name: "qwen3.6-27b-X1xEx", status: "pending", createdAt: "2026-07-02 10:05:00" },
    { name: "qwen3.6-27b-7DRSg", status: "pending", createdAt: "2026-06-30 16:39:02" },
    { name: "qwen3.6-27b-2ejux", status: "pending", createdAt: "2026-06-30 14:17:42" },
  ],
  "demo-whisper-large-v3": [
    { name: "demo-whisper-large-v3-r1", status: "pending", createdAt: "2026-06-30 14:10:36" },
    { name: "demo-whisper-large-v3-than4", status: "pending", createdAt: "2026-06-28 09:41:32" },
    { name: "demo-whisper-large-v3-PNYsA", status: "pending", createdAt: "2026-06-28 09:41:32" },
  ],
  "glm-4-flash-prod": [
    { name: "glm-4-flash-prod-a1b2c", status: "running", createdAt: "2026-06-24 10:05:00" },
    { name: "glm-4-flash-prod-d3e4f", status: "running", createdAt: "2026-06-24 10:05:00" },
  ],
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: "1px solid #d5ddea",
  borderRadius: 7,
  outline: "none",
  background: "#fff",
  color: "#20242d",
  fontSize: 14,
};

const labelStyle: CSSProperties = { display: "block", marginBottom: 5, color: "#344054", fontSize: 13, fontWeight: 700 };
const toolbarControl: CSSProperties = { height: 44, border: "1px solid #d5ddea", borderRadius: 8, background: "#fff", color: "#344054", fontSize: 15, fontWeight: 600, outline: "none" };
const primaryButton: CSSProperties = { height: 44, padding: "0 20px", border: 0, borderRadius: 9, display: "inline-flex", alignItems: "center", gap: 7, background: "linear-gradient(135deg,#4168f6,#5b63ed)", boxShadow: "0 5px 12px rgba(65,104,246,.18)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" };

function deploymentType(model?: ModelRecord) {
  return model?.category ?? "LLM";
}

function deploymentSource(deployment: DeploymentRecord, model?: ModelRecord) {
  return SOURCE_BY_DEPLOYMENT[deployment.name] ?? (model ? `Hugging Face/${model.name}` : deployment.modelName);
}

function statusLabel(status: DeploymentRecord["status"]) {
  if (status === "running") return "运行中";
  if (status === "stopped") return "已停用";
  return "待处理";
}

function statusClass(status: DeploymentRecord["status"]) {
  if (status === "running") return { bg: "#eaf8ef", color: "#0c9d42" };
  if (status === "stopped") return { bg: "#f3f4f6", color: "#667085" };
  return { bg: "#edf5ff", color: "#1769dd" };
}

function toInstanceStatus(status: ModelInstanceRecord["status"]): DeploymentRecord["status"] {
  if (status === "Running") return "running";
  if (status === "Error") return "stopped";
  return "pending";
}

function getConfiguredReplicas(deployment: DeploymentRecord) {
  return deployment.replicas || 0;
}

function getRunningReplicas(deployment: DeploymentRecord) {
  return deployment.status === "running" ? deployment.replicas : 0;
}

function uniqueDeploymentName(base: string, deployments: DeploymentRecord[]) {
  let name = base || "deployment";
  let counter = 1;
  while (deployments.some(item => item.name === name)) {
    counter += 1;
    name = `${base}-${counter}`;
  }
  return name;
}

function DeploymentModal({
  mode,
  sourceDeployment,
  models,
  deployments,
  initialModelId,
  onClose,
  onSubmit,
}: {
  mode: DeployModalMode;
  sourceDeployment?: DeploymentRecord | null;
  models: ModelRecord[];
  deployments: DeploymentRecord[];
  initialModelId?: string;
  onClose: () => void;
  onSubmit: (next: DeploymentRecord) => void;
}) {
  const sourceModelId = sourceDeployment?.modelId;
  const [modelId, setModelId] = useState(initialModelId || sourceModelId || "");
  const [modelSearch, setModelSearch] = useState(() => models.find(model => model.id === (initialModelId || sourceModelId))?.name ?? "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [resourceGroup, setResourceGroup] = useState(sourceDeployment?.resourceGroup || "");
  const [replicas, setReplicas] = useState(sourceDeployment?.replicas || 1);
  const [remark, setRemark] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [placement, setPlacement] = useState<PlacementStrategy>(sourceDeployment?.placementStrategy || "free");
  const selectedModel = models.find(model => model.id === modelId);

  useEffect(() => {
    if (!selectedModel) return;
    setModelSearch(selectedModel.name);
    setRemark(selectedModel.description);
  }, [selectedModel?.id]);

  const remaining = useMemo(() => {
    if (!resourceGroup) return 0;
    const currentId = sourceDeployment?.id;
    const used = deployments
      .filter(item => item.resourceGroup === resourceGroup && item.id !== currentId)
      .reduce((total, item) => total + getConfiguredReplicas(item), 0);
    return Math.max(0, (RESOURCE_CAPACITIES[resourceGroup] || 0) - used);
  }, [deployments, resourceGroup, sourceDeployment?.id]);

  useEffect(() => {
    setReplicas(current => remaining === 0 ? 0 : Math.min(Math.max(1, current), remaining));
  }, [remaining]);

  const filteredModels = models.filter(model => !modelSearch.trim() || model.name.toLowerCase().includes(modelSearch.trim().toLowerCase()));
  const title = mode === "add" ? "新建部署" : mode === "clone" ? "克隆部署" : "编辑部署";

  const selectModel = (model: ModelRecord) => {
    setModelId(model.id);
    setModelSearch(model.name);
    setRemark(model.description);
    setDropdownOpen(false);
  };

  const submit = () => {
    if (!selectedModel) return;
    if (!resourceGroup) return;
    if (remaining === 0 || replicas < 1) return;
    const createdAt = new Date().toISOString().replace("T", " ").slice(0, 19);
    const baseName = mode === "clone" ? `${selectedModel.name}-clone` : selectedModel.name;
    const name = mode === "edit" && sourceDeployment ? sourceDeployment.name : uniqueDeploymentName(baseName, deployments);
    onSubmit({
      id: mode === "edit" && sourceDeployment ? sourceDeployment.id : `deploy-${Date.now()}`,
      name,
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      resourceGroup,
      replicas,
      status: mode === "edit" && sourceDeployment ? sourceDeployment.status : "stopped",
      createdAt: mode === "edit" && sourceDeployment ? sourceDeployment.createdAt : createdAt,
      placementStrategy: placement,
    });
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={title} style={{ position: "fixed", inset: 0, zIndex: 100, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(31,38,49,.48)" }}>
      <div style={{ width: "min(640px, calc(100vw - 32px))", maxHeight: "calc(100vh - 40px)", overflow: "hidden", display: "flex", flexDirection: "column", borderRadius: 14, background: "#fff", boxShadow: "0 20px 60px rgba(15,23,42,.26)" }}>
        <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", borderBottom: "1px solid #edf0f4" }}>
          <h2 style={{ margin: 0, color: "#20242d", fontSize: 17, lineHeight: 1.3, fontWeight: 700 }}>{title}</h2>
          <button type="button" aria-label="关闭" onClick={onClose} style={{ width: 28, height: 28, marginLeft: "auto", border: 0, borderRadius: 6, background: "transparent", color: "#9aa4b3", cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px 20px" }}>
          <div style={{ marginBottom: 14, position: "relative" }}>
            <label style={labelStyle}><span style={{ color: "#e5484d", marginRight: 4 }}>*</span>名称（选择模型）</label>
            <input
              className="notranslate"
              translate="no"
              value={modelSearch}
              onFocus={() => setDropdownOpen(true)}
              onChange={event => { setModelSearch(event.target.value); setDropdownOpen(true); setModelId(""); }}
              placeholder="输入关键词搜索模型库中的模型..."
              style={{ ...inputStyle, paddingRight: 34 }}
            />
            <Search size={15} color="#99a4b5" style={{ position: "absolute", right: 10, top: 32 }} />
            {dropdownOpen && (
              <div style={{ position: "absolute", left: 0, right: 0, top: "100%", zIndex: 60, maxHeight: 220, overflowY: "auto", marginTop: 2, background: "#fff", border: "1px solid #d5ddea", borderRadius: 7, boxShadow: "0 8px 24px rgba(15,23,42,.14)" }}>
                {filteredModels.length ? filteredModels.map(model => (
                  <button key={model.id} type="button" onMouseDown={event => { event.preventDefault(); selectModel(model); }} className="notranslate" translate="no" style={{ width: "100%", padding: "9px 12px", border: 0, borderBottom: "1px solid #f0f2f6", display: "flex", flexDirection: "column", gap: 2, background: model.id === modelId ? "#f0f4ff" : "#fff", color: "#344054", textAlign: "left", cursor: "pointer" }}>
                    <span style={{ fontSize: 13, fontWeight: 650 }}>{model.name}</span>
                    <span style={{ color: "#99a4b5", fontSize: 12 }}>{model.paramSize}B ｜ {model.category} ｜ {model.developer}</span>
                  </button>
                )) : <div style={{ padding: "16px 12px", textAlign: "center", color: "#99a4b5", fontSize: 13 }}>无匹配模型</div>}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}><span style={{ color: "#e5484d", marginRight: 4 }}>*</span>模型路径（权重地址）</label>
            <input value={selectedModel?.weightPath || ""} readOnly placeholder="选择模型后自动带入" style={{ ...inputStyle, background: "#f6f8fb", color: "#667085", cursor: "not-allowed" }} />
            <span style={{ display: "block", marginTop: 4, color: "#99a4b5", fontSize: 12, lineHeight: 1.45 }}>来自模型库中的模型权重地址，不可修改</span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}><span style={{ color: "#e5484d", marginRight: 4 }}>*</span>模型镜像地址</label>
            <input value={selectedModel?.imagePath || ""} readOnly placeholder="选择模型后自动带入" style={{ ...inputStyle, background: "#f6f8fb", color: "#667085", cursor: "not-allowed" }} />
            <span style={{ display: "block", marginTop: 4, color: "#99a4b5", fontSize: 12, lineHeight: 1.45 }}>来自新建模型时选择的镜像地址，不可修改</span>
          </div>

          <div className="maas-deploy-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}><span style={{ color: "#e5484d", marginRight: 4 }}>*</span>资源组</label>
              <select value={resourceGroup} onChange={event => setResourceGroup(event.target.value)} style={inputStyle}>
                <option value="">-- 请选择资源组 --</option>
                {DEPLOY_RESOURCE_GROUPS.map(group => <option key={group}>{group}</option>)}
              </select>
              <span style={{ display: "block", marginTop: 4, color: "#99a4b5", fontSize: 12, lineHeight: 1.45 }}>选择目标资源组，后端 GPU 选项显示该组内可用 GPU</span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>实例数</label>
              <div style={{ height: 38, display: "grid", gridTemplateColumns: "44px 1fr 44px", overflow: "hidden", border: "1px solid #d5ddea", borderRadius: 7, background: "#fff" }}>
                <button type="button" aria-label="减少实例数" disabled={replicas <= 1} onClick={() => setReplicas(value => Math.max(1, value - 1))} style={{ border: 0, borderRight: "1px solid #d5ddea", background: "#f8fafc", color: replicas <= 1 ? "#c3cad5" : "#667085", cursor: replicas <= 1 ? "not-allowed" : "pointer", fontSize: 18, fontWeight: 700 }}><Minus size={16} /></button>
                <output style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#20242d", fontSize: 15 }}>{replicas}</output>
                <button type="button" aria-label="增加实例数" disabled={!resourceGroup || replicas >= remaining} onClick={() => setReplicas(value => Math.min(remaining, value + 1))} style={{ border: 0, borderLeft: "1px solid #d5ddea", background: "#f8fafc", color: !resourceGroup || replicas >= remaining ? "#c3cad5" : "#667085", cursor: !resourceGroup || replicas >= remaining ? "not-allowed" : "pointer", fontSize: 18, fontWeight: 700 }}><Plus size={16} /></button>
              </div>
              <span style={{ display: "block", marginTop: 5, color: "#e5484d", fontSize: 12, lineHeight: 1.45 }}>该资源组的剩余资源最多可部署{remaining} 个实例</span>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>备注</label>
            <textarea value={remark} onChange={event => setRemark(event.target.value)} aria-label="备注" style={{ ...inputStyle, height: 68, paddingTop: 10, resize: "none" }} />
          </div>

          <div style={{ marginTop: 20, overflow: "hidden", border: "1px solid #dce2ec", borderRadius: 8, background: "#fff" }}>
            <button type="button" aria-expanded={advanced} onClick={() => setAdvanced(open => !open)} style={{ width: "100%", minHeight: 40, padding: "0 16px", display: "flex", alignItems: "center", gap: 10, border: 0, background: "linear-gradient(180deg,#fafbfd,#f6f8fb)", color: "#344054", fontSize: 13, fontWeight: 700, textAlign: "left", cursor: "pointer" }}>
              <ChevronRight size={16} style={{ transform: advanced ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
              <span>高级配置</span>
            </button>
            {advanced && (
              <div style={{ padding: "14px 16px 12px" }}>
                <label style={labelStyle}>放置策略</label>
                <select value={placement} onChange={event => setPlacement(event.target.value as PlacementStrategy)} style={inputStyle}>
                  <option value="free">自由调度</option>
                  <option value="balanced">平均分配</option>
                </select>
                <span style={{ display: "block", marginTop: 4, color: "#99a4b5", fontSize: 12, lineHeight: 1.45 }}>自由调度：优先匹配可用资源，减少 GPU/节点上的资源碎片；平均分配：将实例分散到不同节点，可能会在单个节点上产生较多资源碎片。</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "14px 24px", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid #edf0f4", background: "rgba(255,255,255,.98)" }}>
          <button type="button" onClick={onClose} style={{ minWidth: 100, height: 38, border: "1px solid #dfe3eb", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>取消</button>
          <button type="button" onClick={submit} style={{ minWidth: 140, height: 38, border: 0, borderRadius: 7, background: "linear-gradient(135deg,#4168f6,#5668ed)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>确认部署</button>
        </div>
      </div>
      <style>{`@media (max-width: 900px) { .maas-deploy-form-row { grid-template-columns: 1fr !important; gap: 0 !important; } }`}</style>
    </div>
  );
}

export function ModelDeploymentPage({ models, deployments, onDeploymentsChange, instances = [], onInstancesChange, prefillModelId, onPrefillConsumed }: ModelDeploymentPageProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(deployments.map(item => item.id)));
  const [sortKey, setSortKey] = useState<DeploySortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [replicaEdits, setReplicaEdits] = useState<Record<string, ReplicaEdit>>({});
  const [modal, setModal] = useState<{ mode: DeployModalMode; deployment?: DeploymentRecord | null; modelId?: string } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (!prefillModelId) return;
    setModal({ mode: "add", modelId: prefillModelId });
    onPrefillConsumed?.();
  }, [prefillModelId]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const modelById = useMemo(() => new Map(models.map(model => [model.id, model])), [models]);

  const childrenFor = (deployment: DeploymentRecord) => {
    const staticChildren = STATIC_DEPLOYMENT_CHILDREN[deployment.name];
    if (staticChildren) return staticChildren;
    return instances
      .filter(instance => instance.name.startsWith(`${deployment.name}-`))
      .map(instance => ({ name: instance.name, status: toInstanceStatus(instance.status), createdAt: instance.createdAt }));
  };

  const getRemainingForEdit = (deployment: DeploymentRecord) => {
    const usedByOthers = deployments
      .filter(item => item.resourceGroup === deployment.resourceGroup && item.id !== deployment.id)
      .reduce((total, item) => total + (replicaEdits[item.id]?.configured ?? getConfiguredReplicas(item)), 0);
    return Math.max(0, (RESOURCE_CAPACITIES[deployment.resourceGroup] || 0) - usedByOthers);
  };

  const visibleRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    let rows = deployments.filter(deployment => {
      const model = modelById.get(deployment.modelId);
      if (keyword && !deployment.name.toLowerCase().includes(keyword)) return false;
      if (categoryFilter && deploymentType(model) !== categoryFilter) return false;
      if (statusFilter && deployment.status !== statusFilter) return false;
      if (resourceFilter && deployment.resourceGroup !== resourceFilter) return false;
      return true;
    });
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const modelA = modelById.get(a.modelId);
        const modelB = modelById.get(b.modelId);
        const valueA = sortKey === "source" ? deploymentSource(a, modelA) : sortKey === "replicas" ? getConfiguredReplicas(a) : a[sortKey];
        const valueB = sortKey === "source" ? deploymentSource(b, modelB) : sortKey === "replicas" ? getConfiguredReplicas(b) : b[sortKey];
        if (valueA < valueB) return sortDir === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [deployments, search, categoryFilter, statusFilter, resourceFilter, sortKey, sortDir, modelById]);

  const selectedVisible = visibleRows.filter(row => selected.has(row.id));
  const allVisibleSelected = visibleRows.length > 0 && selectedVisible.length === visibleRows.length;

  const showToast = (text: string, error = false) => setToast({ text, error });
  const resetFilters = () => { setSearch(""); setCategoryFilter(""); setStatusFilter(""); setResourceFilter(""); };

  const updateDeployment = (id: string, updater: (deployment: DeploymentRecord) => DeploymentRecord) => {
    onDeploymentsChange(deployments.map(item => item.id === id ? updater(item) : item));
  };

  const deleteDeployment = (id: string) => {
    onDeploymentsChange(deployments.filter(item => item.id !== id));
    setSelected(previous => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  };

  const batchSetStatus = (status: DeploymentRecord["status"]) => {
    if (!selected.size) return;
    onDeploymentsChange(deployments.map(item => selected.has(item.id) ? { ...item, status } : item));
    showToast(status === "running" ? `已启动 ${selected.size} 个部署` : `已停止 ${selected.size} 个部署`);
  };

  const batchDelete = () => {
    if (!selected.size) return;
    onDeploymentsChange(deployments.filter(item => !selected.has(item.id)));
    showToast(`已删除 ${selected.size} 个部署`);
    setSelected(new Set());
  };

  const toggleSort = (key: DeploySortKey) => {
    if (sortKey === key) setSortDir(dir => dir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortArrow = (key: DeploySortKey) => sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  const changeReplicasInline = (deployment: DeploymentRecord, delta: number) => {
    const current = replicaEdits[deployment.id] ?? { running: getRunningReplicas(deployment), configured: getConfiguredReplicas(deployment) };
    const maxForThis = getRemainingForEdit(deployment);
    if (delta > 0 && current.configured >= maxForThis) {
      showToast(`该资源组的剩余资源最多可部署 ${maxForThis} 个实例`, true);
      return;
    }
    const configured = delta > 0 ? current.configured + 1 : Math.max(0, current.configured - 1);
    setReplicaEdits(previous => ({
      ...previous,
      [deployment.id]: { running: Math.min(current.running, configured), configured },
    }));
  };

  const confirmReplicaEdit = (deployment: DeploymentRecord) => {
    const edit = replicaEdits[deployment.id];
    if (!edit) return;
    updateDeployment(deployment.id, item => ({ ...item, replicas: edit.configured, status: edit.configured === 0 ? "stopped" : item.status }));
    setReplicaEdits(previous => {
      const next = { ...previous };
      delete next[deployment.id];
      return next;
    });
  };

  const submitModal = (record: DeploymentRecord) => {
    if (modal?.mode === "edit") onDeploymentsChange(deployments.map(item => item.id === record.id ? record : item));
    else onDeploymentsChange([record, ...deployments]);
    setModal(null);
    showToast("部署已提交");
  };

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: "#f5f7fa" }}>
      <div style={{ padding: "14px 24px 0", color: "#6b7280", fontSize: 13 }}><span style={{ color: "#4f6ef7" }}>模型管理</span><span style={{ margin: "0 7px" }}>/</span><b style={{ color: "#1a1d23", fontWeight: 500 }}>模型部署</b></div>
      <div id="page-deploy" className="flex-1 min-h-0 overflow-auto" style={{ margin: "14px 24px 24px", border: "1px solid #e7ebf2", borderRadius: 16, background: "#fff", boxShadow: "0 2px 12px rgba(31,45,61,.05)" }}>
        <div style={{ minHeight: 84, padding: "20px 24px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #edf0f5" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索模型名称..." style={{ height: 44, width: 220, padding: "0 36px 0 14px", border: "1px solid #d5ddea", borderRadius: 8, fontSize: 14, color: "#20242d", background: "#fff", outline: "none" }} />
            {search && <button type="button" aria-label="清空" onClick={() => setSearch("")} style={{ position: "absolute", right: 6, width: 24, height: 24, border: 0, background: "transparent", color: "#99a4b5", fontSize: 18, cursor: "pointer", borderRadius: 4 }}>×</button>}
          </div>
          <select className="notranslate" translate="no" aria-label="模型分类筛选" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} style={{ ...toolbarControl, minWidth: 165, padding: "0 42px 0 16px" }}>
            <option value="">全部分类</option>
            {MODEL_CATEGORIES.map(category => <option key={category}>{category}</option>)}
          </select>
          <select aria-label="状态筛选" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} style={{ ...toolbarControl, minWidth: 165, padding: "0 42px 0 16px" }}>
            <option value="">全部状态</option>
            <option value="running">已启用</option>
            <option value="stopped">已停用</option>
            <option value="pending">未就绪</option>
          </select>
          <select aria-label="资源组筛选" value={resourceFilter} onChange={event => setResourceFilter(event.target.value)} style={{ ...toolbarControl, minWidth: 165, padding: "0 42px 0 16px" }}>
            <option value="">全部资源组</option>
            {DEPLOY_RESOURCE_GROUPS.filter(group => group !== "推理组").map(group => <option key={group}>{group}</option>)}
          </select>
          <button type="button" onClick={resetFilters} style={{ ...toolbarControl, padding: "0 18px", display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer" }}><RefreshCw size={17} /><span>重置</span></button>
          <span style={{ flex: 1 }} />
          <button type="button" onClick={() => setModal({ mode: "add" })} style={primaryButton}><Plus size={16} /><span>新建部署</span></button>
        </div>

        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 24px", background: "#f0f4ff", borderBottom: "1px solid #dce3f5" }}>
            <span style={{ color: "#344054", fontSize: 13, fontWeight: 650 }}>已选 {selected.size} 项</span>
            <button type="button" onClick={() => batchSetStatus("running")} style={{ height: 34, padding: "0 16px", border: "1px solid #9ecfff", borderRadius: 6, background: "#fff", color: "#0c7fcf", fontSize: 13, fontWeight: 650, cursor: "pointer" }}>▶ 一键启动</button>
            <button type="button" onClick={() => batchSetStatus("stopped")} style={{ height: 34, padding: "0 16px", border: "1px solid #ffc9c9", borderRadius: 6, background: "#fff", color: "#e5484d", fontSize: 13, fontWeight: 650, cursor: "pointer" }}>■ 批量停止</button>
            <button type="button" onClick={batchDelete} style={{ height: 34, padding: "0 16px", border: "1px solid #e0e0e0", borderRadius: 6, background: "#fff", color: "#666", fontSize: 13, fontWeight: 650, cursor: "pointer" }}>⌫ 批量删除</button>
          </div>
        )}

        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 1160, tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0, color: "#354052", fontSize: 15 }}>
            <colgroup><col style={{ width: 78 }} /><col style={{ width: "31%" }} /><col style={{ width: "15%" }} /><col style={{ width: "22%" }} /><col style={{ width: "11%" }} /><col style={{ width: "18%" }} /><col style={{ width: 92 }} /></colgroup>
            <thead>
              <tr>
                <th style={deployTh(true)}><input type="checkbox" aria-label="全选部署" checked={allVisibleSelected} onChange={event => setSelected(event.target.checked ? new Set(visibleRows.map(row => row.id)) : new Set())} style={{ width: 17, height: 17, margin: 0, accentColor: "#536df5", cursor: "pointer" }} /></th>
                <th style={deployTh(false)}><button type="button" onClick={() => setExpanded(expanded.size === visibleRows.length ? new Set() : new Set(visibleRows.map(row => row.id)))} title="展开/收起全部" style={{ width: 22, height: 22, padding: 0, marginRight: 4, border: "1px solid #d5ddea", borderRadius: 4, background: "#fff", color: "#667085", fontSize: 13, cursor: "pointer", verticalAlign: "middle", lineHeight: 1 }}>{expanded.size === visibleRows.length ? "⊟" : "⊞"}</button><button type="button" onClick={() => toggleSort("name")} style={sortButton}>名称 <span style={{ color: "#99a4b5", fontSize: 11 }}>{sortArrow("name")}</span></button></th>
                <th style={deployTh(false)}><button type="button" onClick={() => toggleSort("resourceGroup")} style={sortButton}>资源组 <span style={{ color: "#99a4b5", fontSize: 11 }}>{sortArrow("resourceGroup")}</span></button></th>
                <th style={deployTh(false)}><button type="button" onClick={() => toggleSort("source")} style={sortButton}>来源 <span style={{ color: "#99a4b5", fontSize: 11 }}>{sortArrow("source")}</span></button></th>
                <th style={deployTh(false)}><button type="button" onClick={() => toggleSort("replicas")} style={sortButton}>实例数 <span style={{ color: "#99a4b5", fontSize: 11 }}>{sortArrow("replicas")}</span></button></th>
                <th style={deployTh(false)}><button type="button" onClick={() => toggleSort("createdAt")} style={sortButton}>创建时间 <span style={{ color: "#99a4b5", fontSize: 11 }}>{sortArrow("createdAt")}</span></button></th>
                <th style={deployTh(false)}>操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length ? visibleRows.flatMap(deployment => {
                const model = modelById.get(deployment.modelId);
                const type = deploymentType(model);
                const edit = replicaEdits[deployment.id];
                const displayReplicas = edit ? `${edit.running}/${edit.configured}` : `${getRunningReplicas(deployment)}/${getConfiguredReplicas(deployment)}`;
                const maxForThis = getRemainingForEdit(deployment);
                const children = childrenFor(deployment);
                const rows = [
                  <tr key={deployment.id}>
                    <td style={deployTd(true)}><input type="checkbox" checked={selected.has(deployment.id)} onChange={event => setSelected(previous => { const next = new Set(previous); event.target.checked ? next.add(deployment.id) : next.delete(deployment.id); return next; })} aria-label={`选择 ${deployment.name}`} style={{ width: 17, height: 17, margin: 0, accentColor: "#536df5", cursor: "pointer" }} /></td>
                    <td style={deployTd(false)}>
                      <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
                        <button type="button" onClick={() => setExpanded(previous => { const next = new Set(previous); next.has(deployment.id) ? next.delete(deployment.id) : next.add(deployment.id); return next; })} style={{ width: 20, height: 24, padding: 0, border: 0, background: "transparent", color: "#687386", cursor: "pointer", transform: expanded.has(deployment.id) ? "none" : "rotate(-90deg)", transition: "transform .15s" }}>⌄</button>
                        <span title={deployment.name} style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#20242d", fontWeight: 750 }}>{deployment.name}</span>
                        <span className="notranslate" translate="no" style={{ display: "inline-flex", alignItems: "center", height: 28, padding: "0 10px", borderRadius: 6, background: type === "Speech-to-Text" ? "#ecf9ef" : "#eef3ff", color: type === "Speech-to-Text" ? "#12a04a" : "#4b6ff2", fontSize: 13, fontWeight: 650, whiteSpace: "nowrap" }}>{type}</span>
                      </div>
                    </td>
                    <td style={deployTd(false)}>{deployment.resourceGroup}</td>
                    <td style={deployTd(false)}><span title={deploymentSource(deployment, model)} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#657084", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: 14 }}>{deploymentSource(deployment, model)}</span></td>
                    <td style={deployTd(false)}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 0, border: "1px solid #dce2ec", borderRadius: 5, overflow: "hidden", background: "#fff", verticalAlign: "middle" }}>
                        <button type="button" onClick={() => changeReplicasInline(deployment, -1)} aria-label="减少实例数" style={replicaBtn}><Minus size={13} /></button>
                        <span style={{ minWidth: 42, textAlign: "center", color: "#20242d", fontSize: 12, fontWeight: 600, padding: "0 4px", whiteSpace: "nowrap" }}>{displayReplicas}</span>
                        <button type="button" onClick={() => changeReplicasInline(deployment, 1)} aria-label="增加实例数" style={{ ...replicaBtn, color: (edit?.configured ?? getConfiguredReplicas(deployment)) >= maxForThis ? "#c3cad5" : "#667085" }}><Plus size={13} /></button>
                        {edit && <>
                          <button type="button" onClick={() => confirmReplicaEdit(deployment)} title="确认" style={{ ...replicaBtn, background: "#eaf8ef", color: "#0c9d42" }}>✓</button>
                          <button type="button" onClick={() => setReplicaEdits(previous => { const next = { ...previous }; delete next[deployment.id]; return next; })} title="取消" style={{ ...replicaBtn, background: "#fff1f1", color: "#e5484d" }}>✗</button>
                        </>}
                      </div>
                    </td>
                    <td style={deployTd(false)}>{deployment.createdAt}</td>
                    <td style={deployTd(false)}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, position: "relative" }}>
                        <button type="button" title="编辑" onClick={() => setModal({ mode: "edit", deployment })} style={iconBtn}><Edit3 size={18} /></button>
                        <div style={{ position: "relative" }}>
                          <button type="button" title="更多" onClick={event => { event.stopPropagation(); setOpenMenuId(openMenuId === deployment.id ? null : deployment.id); }} style={iconBtn}><MoreVertical size={19} /></button>
                          {openMenuId === deployment.id && (
                            <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 50, minWidth: 120, padding: 4, background: "#fff", border: "1px solid #e3e8f1", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,.12)" }}>
                              {deployment.status === "running"
                                ? <MenuAction icon={<Square size={16} fill="currentColor" />} label="停止" onClick={() => updateDeployment(deployment.id, item => ({ ...item, status: "stopped" }))} />
                                : <MenuAction icon={<Play size={16} fill="currentColor" />} label="启动" onClick={() => updateDeployment(deployment.id, item => ({ ...item, status: "running" }))} />}
                              <MenuAction icon={<Copy size={16} />} label="克隆" onClick={() => setModal({ mode: "clone", deployment })} />
                              <MenuAction icon={<Activity size={16} />} label="监控" onClick={() => window.open(`https://grafana.example.com/d/model-monitor?deployment=${encodeURIComponent(deployment.name)}`, "_blank")} />
                              <MenuAction icon={<Trash2 size={16} />} label="删除" danger onClick={() => deleteDeployment(deployment.id)} />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>,
                ];
                if (expanded.has(deployment.id)) {
                  rows.push(...children.map(child => {
                    const tone = statusClass(child.status);
                    return (
                      <tr key={`${deployment.id}-${child.name}`}>
                        <td style={deployTd(true)} />
                        <td style={deployTd(false)}><div style={{ paddingLeft: 34, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#354052" }}>{child.name}</div></td>
                        <td style={deployTd(false)} />
                        <td style={deployTd(false)} />
                        <td style={deployTd(false)}><span style={{ display: "inline-flex", alignItems: "center", height: 30, padding: "0 12px", borderRadius: 16, background: tone.bg, color: tone.color, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>{statusLabel(child.status)}</span></td>
                        <td style={deployTd(false)}>{child.createdAt}</td>
                        <td style={deployTd(false)}><div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><button type="button" title="删除" onClick={() => onInstancesChange?.(instances.filter(instance => instance.name !== child.name))} style={{ ...iconBtn, color: "#ff3b41" }}><Trash2 size={18} /></button></div></td>
                      </tr>
                    );
                  }));
                }
                return rows;
              }) : (
                <tr><td colSpan={7} style={{ padding: 64, textAlign: "center", color: "#98a2b3", fontSize: 13 }}>暂无符合条件的部署</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <DeploymentModal mode={modal.mode} sourceDeployment={modal.deployment} models={models} deployments={deployments} initialModelId={modal.modelId} onClose={() => setModal(null)} onSubmit={submitModal} />}
      {toast && <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1000, padding: "10px 24px", borderRadius: 8, background: toast.error ? "#e5484d" : "#059669", color: "#fff", fontSize: 13, fontWeight: 500 }}>{toast.text}</div>}
    </div>
  );
}

function MenuAction({ icon, label, danger, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ width: "100%", padding: "8px 12px", border: 0, borderRadius: 5, display: "flex", alignItems: "center", gap: 8, background: "transparent", color: danger ? "#e5484d" : "#344054", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
      {icon}
      {label}
    </button>
  );
}

function deployTh(center: boolean): CSSProperties {
  return { height: 54, padding: "0 14px", background: "#fafbfc", borderBottom: "1px solid #e8ecf2", color: "#667085", fontSize: 14, fontWeight: 650, whiteSpace: "nowrap", textAlign: center ? "center" : "left" };
}

function deployTd(center: boolean): CSSProperties {
  return { height: 58, padding: "0 14px", borderBottom: "1px solid #edf0f4", background: "#fff", verticalAlign: "middle", textAlign: center ? "center" : "left" };
}

const sortButton: CSSProperties = { padding: 0, border: 0, background: "transparent", color: "inherit", font: "inherit", cursor: "pointer" };
const iconBtn: CSSProperties = { width: 28, height: 32, padding: 0, border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#98a3b3", cursor: "pointer", borderRadius: 6 };
const replicaBtn: CSSProperties = { width: 22, height: 24, padding: 0, border: 0, background: "#f8fafc", color: "#667085", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 };
