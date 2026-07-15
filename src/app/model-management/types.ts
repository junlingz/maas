export const MODEL_CATEGORIES = [
  "LLM",
  "Embedding",
  "Reranker",
  "Image",
  "Text-to-Speech",
  "Speech-to-Text",
] as const;

export const MODEL_CAPABILITIES = [
  "vision",
  "tool",
  "reasoning",
] as const;

export type ModelCategory = typeof MODEL_CATEGORIES[number];
export type ModelCapability = typeof MODEL_CAPABILITIES[number];
export type PlacementStrategy = "free" | "balanced";
export type DeploymentStatus = "pending" | "running" | "stopped";
export type InstanceStatus = "Pending" | "Running" | "Error";

export interface ModelRecord {
  id: string;
  name: string;
  developer: string;
  iconData: string;
  paramSize: string;
  category: ModelCategory;
  capabilities: ModelCapability[];
  weightPath: string;
  imagePath: string;
  description: string;
  createdAt: string;
}

export interface DeploymentRecord {
  id: string;
  name: string;
  modelId: string;
  modelName: string;
  resourceGroup: string;
  replicas: number;
  status: DeploymentStatus;
  createdAt: string;
  placementStrategy: PlacementStrategy;
}

export interface ModelInstanceRecord {
  id: string;
  name: string;
  runtime: string;
  resourceGroup: string;
  node: string;
  memory: string;
  status: InstanceStatus;
  createdAt: string;
}
