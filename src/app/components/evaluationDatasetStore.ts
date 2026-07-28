export type VersionDetail = {
  count: number;
  sample: string;
  schema: string;
  citation?: string;
  updatedAt?: string;
  releaseNote?: string;
};

export type DatasetPermission = "公开" | "仅自己可见" | "团队可见" | "团队可编辑";

export type StoredEvaluationDataset = {
  id: number;
  name: string;
  description: string;
  source: "public" | "mine" | "shared";
  modelType: "语言模型" | "多模态模型";
  tasks: string[];
  format: "内置" | "JSONL" | "CSV" | "压缩包";
  count: number;
  domain: string;
  version: string;
  versions: string[];
  recommendedVersion: string;
  status: "校验中" | "校验通过" | "校验失败";
  permission: DatasetPermission;
  creator: string;
  team: string;
  updatedAt: string;
  metrics: string[];
  schema: string;
  sample: string;
  citation: string;
  validationError?: string;
  versionDetails?: Record<string, VersionDetail>;
};

const STORAGE_KEY = "maas-evaluation-custom-datasets";

function normalizeDatasetPermission(permission: unknown): DatasetPermission {
  if (permission === "公开" || permission === "仅自己可见" || permission === "团队可见" || permission === "团队可编辑") return permission;
  if (permission === "团队成员可见（只读）") return "团队可见";
  if (permission === "团队成员可见（编辑）") return "团队可编辑";
  return "仅自己可见";
}

export function loadStoredEvaluationDatasets(): StoredEvaluationDataset[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    const retiredMetricName = ["Reasoning", "Score"].join(" ");
    return Array.isArray(value)
      ? value
        .filter(item => item && typeof item.name === "string")
        .map(item => ({
          ...item,
          permission: normalizeDatasetPermission(item.permission),
          metrics: Array.isArray(item.metrics) ? item.metrics.filter((metric: string) => metric !== retiredMetricName) : [],
        }))
      : [];
  } catch {
    return [];
  }
}

export function saveStoredEvaluationDataset(dataset: StoredEvaluationDataset) {
  if (typeof window === "undefined" || (dataset.source !== "mine" && dataset.source !== "public")) return;
  const current = loadStoredEvaluationDatasets();
  const next = [dataset, ...current.filter(item => item.id !== dataset.id && item.name !== dataset.name)];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function removeStoredEvaluationDataset(id: number) {
  if (typeof window === "undefined") return;
  const next = loadStoredEvaluationDatasets().filter(item => item.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
