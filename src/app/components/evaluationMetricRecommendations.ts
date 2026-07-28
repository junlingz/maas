export const EVALUATION_METRIC_RECOMMENDATIONS: Record<string, readonly string[]> = {
  "文本理解": ["Accuracy", "F1"],
  "问答": ["Accuracy", "F1"],
  "逻辑推理": ["Accuracy"],
  "代码生成": ["Pass@1"],
  "图文描述": ["BLEU", "ROUGE", "METEOR"],
  "视觉问答": ["Accuracy"],
  "文档解析": ["Accuracy", "F1"],
};

export function getSuggestedMetrics(tasks: string[]): string[] {
  return Array.from(new Set(tasks.flatMap(task => EVALUATION_METRIC_RECOMMENDATIONS[task] || [])));
}
