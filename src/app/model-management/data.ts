import type { DeploymentRecord, ModelInstanceRecord, ModelRecord } from "./types";

export const INITIAL_MODELS: ModelRecord[] = [
  { id: "deepseek-v3", name: "deepseek-v3", developer: "DeepSeek", iconData: "", paramSize: "671", category: "LLM", capabilities: ["tool", "reasoning"], weightPath: "/models/deepseek-v3", imagePath: "harbor.xxx.com/lm/vllm:deepseek-v3", description: "DeepSeek V3 通用大语言模型。", createdAt: "2026-06-24" },
  { id: "embedding-v3", name: "embedding-v3", developer: "智谱", iconData: "", paramSize: "0.3", category: "Embedding", capabilities: [], weightPath: "/models/embedding-v3", imagePath: "harbor.xxx.com/lm/embedding:v3", description: "文本向量化模型。", createdAt: "2026-04-08" },
  { id: "cogvlm-9b", name: "cogvlm-9b", developer: "智谱", iconData: "", paramSize: "9", category: "Image", capabilities: ["vision"], weightPath: "/models/cogvlm-9b", imagePath: "harbor.xxx.com/lm/vllm:cogvlm-9b", description: "视觉语言理解模型。", createdAt: "2026-03-03" },
  { id: "chatglm4-32b", name: "chatglm4-32b", developer: "智谱", iconData: "", paramSize: "32", category: "LLM", capabilities: ["tool"], weightPath: "/models/chatglm4-32b", imagePath: "harbor.xxx.com/lm/vllm:chatglm4-32b", description: "面向对话与生成任务的通用模型。", createdAt: "2026-03-03" },
  { id: "llama-3-1", name: "LLaMA 3.1", developer: "Meta", iconData: "", paramSize: "70", category: "LLM", capabilities: ["reasoning"], weightPath: "/models/llama-3.1", imagePath: "harbor.xxx.com/lm/vllm:llama-3.1", description: "LLaMA 3.1 通用语言模型。", createdAt: "2025-11-24" },
  { id: "baichuan-m2-plus", name: "Baichuan-M2 Plus", developer: "百川", iconData: "", paramSize: "13", category: "LLM", capabilities: [], weightPath: "/models/baichuan-m2-plus", imagePath: "harbor.xxx.com/lm/vllm:baichuan-m2-plus", description: "百川通用大语言模型。", createdAt: "2025-11-24" },
  { id: "qwen3-7b", name: "Qwen3-7B", developer: "通义千问", iconData: "", paramSize: "7", category: "LLM", capabilities: ["tool", "reasoning"], weightPath: "/models/Qwen3-7B", imagePath: "harbor.xxx.com/lm/vllm:qwen3-7b", description: "通义千问 Qwen3 7B 模型。", createdAt: "2025-10-28" },
  { id: "whisper-large-v3", name: "whisper-large-v3", developer: "OpenAI", iconData: "", paramSize: "1.5", category: "Speech-to-Text", capabilities: [], weightPath: "/models/whisper-large-v3", imagePath: "harbor.xxx.com/asr/whisper:large-v3", description: "OpenAI Whisper Large V3 语音识别模型。", createdAt: "2025-10-28" },
  { id: "t1-100", name: "T1-100", developer: "T1", iconData: "", paramSize: "100", category: "Reranker", capabilities: ["reasoning"], weightPath: "/models/T1-100", imagePath: "harbor.xxx.com/lm/vllm:t1-100", description: "面向复杂任务的重排模型。", createdAt: "2025-12-12" },
];

export const INITIAL_DEPLOYMENTS: DeploymentRecord[] = [
  { id: "deploy-qwen", name: "qwen3.6-27b", modelId: "qwen3-7b", modelName: "Qwen3-7B", resourceGroup: "测试1", replicas: 3, status: "stopped", createdAt: "2026-06-30 14:17:42", placementStrategy: "free" },
  { id: "deploy-whisper", name: "demo-whisper-large-v3", modelId: "whisper-large-v3", modelName: "whisper-large-v3", resourceGroup: "测试1", replicas: 3, status: "stopped", createdAt: "2026-06-30 14:10:36", placementStrategy: "balanced" },
  { id: "deploy-glm", name: "glm-4-flash-prod", modelId: "chatglm4-32b", modelName: "chatglm4-32b", resourceGroup: "GPU-Cluster-Prod", replicas: 2, status: "running", createdAt: "2026-06-24 10:00:00", placementStrategy: "free" },
];

export const INITIAL_INSTANCES: ModelInstanceRecord[] = [
  { id: "mi-01", name: "qwen3.6-27b-X1xEx", runtime: "vLLM", resourceGroup: "测试1", node: "—", memory: "0", status: "Pending", createdAt: "2026-07-02 16:36:21" },
  { id: "mi-02", name: "qwen3.6-27b-ZDRSg", runtime: "vLLM", resourceGroup: "测试1", node: "—", memory: "0", status: "Pending", createdAt: "2026-06-30 16:39:02" },
  { id: "mi-03", name: "qwen3.6-27b-2ejux", runtime: "vLLM", resourceGroup: "测试1", node: "—", memory: "0", status: "Pending", createdAt: "2026-06-30 14:17:42" },
  { id: "mi-04", name: "demo-whisper-large-v3-r1", runtime: "AceBound:1.0", resourceGroup: "测试1", node: "—", memory: "0", status: "Pending", createdAt: "2026-06-30 14:10:36" },
  { id: "mi-05", name: "mimo-v2.5-jG5kP", runtime: "vLLM", resourceGroup: "测试1", node: "—", memory: "0", status: "Pending", createdAt: "2026-06-30 13:10:54" },
  { id: "mi-06", name: "mimo-v2.5-mYXMr", runtime: "vLLM", resourceGroup: "测试1", node: "—", memory: "0", status: "Pending", createdAt: "2026-06-30 13:10:54" },
  { id: "mi-07", name: "demo-deepseek-r1-70b-r2", runtime: "SGLang:0.4.0", resourceGroup: "测试1", node: "—", memory: "144 GiB", status: "Error", createdAt: "2026-06-30 12:22:36" },
  { id: "mi-08", name: "mimo-v2.5-ZvuDW", runtime: "vLLM", resourceGroup: "测试1", node: "—", memory: "0", status: "Pending", createdAt: "2026-06-30 13:10:55" },
  { id: "mi-09", name: "glm-4-flash-prod-a1b2c", runtime: "vLLM", resourceGroup: "公共组", node: "node-a100-01", memory: "80 GiB", status: "Running", createdAt: "2026-06-24 10:05:00" },
  { id: "mi-10", name: "qwen3.6-27b-Q8pLm", runtime: "vLLM", resourceGroup: "测试1", node: "—", memory: "0", status: "Pending", createdAt: "2026-06-23 18:42:17" },
];

export const RESOURCE_CAPACITIES: Record<string, number> = {
  "推理组": 4,
  "测试1": 10,
  "GPU-Cluster-Prod": 6,
  "公共组": 6,
};
