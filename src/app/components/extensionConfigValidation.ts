import { parseDocument } from "yaml";

export const EXTENSION_RULE_SET_VERSION = "extension-params/1.0.0";
export const MAX_YAML_BYTES = 64 * 1024;
export const MAX_YAML_DEPTH = 6;
export const MAX_YAML_NODES = 128;
export const MAX_SCALAR_LENGTH = 1024;
export const ALLOWED_TRAINING_MAPPING_PATHS = new Set([
  "training.method.lora.rank",
  "training.method.lora.alpha",
  "training.optimizer.name",
  "training.optimizer.learning_rate",
  "training.optimizer.weight_decay",
  "training.optimizer.scheduler",
  "training.data.max_turns",
  "training.data.deduplicate",
  "training.evaluation.threshold",
]);

export type ExtensionTypeCode =
  | "fine_tuning_algorithm"
  | "optimizer"
  | "data_processing"
  | "evaluation_method";

export type ConfigValidationKey = "syntax" | "compatibility" | "parameters" | "security" | "mapping";
export type ConfigValidationState = "passed" | "failed" | "running" | "pending";
export type FindingSeverity = "error" | "warning";

export type ConfigFinding = {
  ruleId: string;
  severity: FindingSeverity;
  message: string;
  path?: string;
  guidance: string;
};

export type ConfigCategoryResult = {
  key: ConfigValidationKey;
  state: ConfigValidationState;
  checks: number;
  durationMs: number;
  summary: string;
  findings: ConfigFinding[];
};

export type ParameterValidationRule = {
  key: string;
  label: string;
  valueType: "string" | "float" | "integer";
  defaultValue: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  recommendedMin?: number;
  recommendedMax?: number;
  mappingPath: string;
};

export type ExtensionTemplateRule = {
  id: string;
  configId: string;
  configVersion: string;
  typeCode: ExtensionTypeCode;
  parameters: ParameterValidationRule[];
};

export type ExtensionConfigInput = {
  source: string;
  fileName: string;
  fileSize: number;
  expectedTemplate: ExtensionTemplateRule;
};

export type ExtensionConfigReport = {
  passed: boolean;
  categories: ConfigCategoryResult[];
  errorCount: number;
  warningCount: number;
  totalDurationMs: number;
  normalizedParameters: Record<string, string | number>;
  mappingPreview: Record<string, unknown> | null;
  logs: string[];
};

const CATEGORY_ORDER: ConfigValidationKey[] = ["syntax", "compatibility", "parameters", "security", "mapping"];

export const CATEGORY_LABELS: Record<ConfigValidationKey, { short: string; name: string }> = {
  syntax: { short: "语法", name: "文件与语法检查" },
  compatibility: { short: "兼容", name: "模板兼容性检查" },
  parameters: { short: "参数", name: "参数合法性检查" },
  security: { short: "安全", name: "安全性检查" },
  mapping: { short: "映射", name: "训练参数映射检查" },
};

export function emptyConfigValidation(): ConfigCategoryResult[] {
  return CATEGORY_ORDER.map(key => ({ key, state: "pending", checks: 0, durationMs: 0, summary: "待调试", findings: [] }));
}

export function buildTemplateYaml(template: ExtensionTemplateRule, displayName: string): string {
  const lines = [
    `# ${displayName} · MaaS 参数配置模板`,
    `# 只修改 extension_name 和 parameters；不要增加代码、命令、密钥或未知字段。`,
    `schema_version: "maas.extension-params/v1"`,
    `template_id: "${template.configId}"`,
    `template_version: "${template.configVersion}"`,
    `extension_name: "${displayName}"`,
    `extension_type: "${template.typeCode}"`,
    `parameters:`,
  ];
  for (const parameter of template.parameters) {
    const rawValue = parameter.valueType === "string"
      ? JSON.stringify(parameter.defaultValue)
      : String(Number(parameter.defaultValue));
    lines.push(`  ${parameter.key}: ${rawValue} # ${parameter.label}`);
  }
  return `${lines.join("\n")}\n`;
}

export function extractTemplateId(source: string): string | null {
  const match = source.match(/^\s*template_id\s*:\s*["']?([a-z][a-z0-9-]{1,63})["']?\s*(?:#.*)?$/m);
  return match?.[1] ?? null;
}

export function extractExtensionName(source: string): string | null {
  const match = source.match(/^\s*extension_name\s*:\s*(.+?)\s*(?:#.*)?$/m);
  if (!match) return null;
  return match[1].trim().replace(/^["']|["']$/g, "").slice(0, 64) || null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function addFinding(target: ConfigFinding[], finding: ConfigFinding) {
  target.push(finding);
}

function inspectStructure(value: unknown, depth = 1): { depth: number; nodes: number; longestScalar: number } {
  if (value === null || typeof value !== "object") {
    return { depth, nodes: 1, longestScalar: typeof value === "string" ? value.length : 0 };
  }
  const children = Array.isArray(value) ? value : Object.entries(value).flatMap(([key, child]) => [key, child]);
  let maxDepth = depth;
  let nodes = 1;
  let longestScalar = 0;
  for (const child of children) {
    const result = inspectStructure(child, depth + 1);
    maxDepth = Math.max(maxDepth, result.depth);
    nodes += result.nodes;
    longestScalar = Math.max(longestScalar, result.longestScalar);
  }
  return { depth: maxDepth, nodes, longestScalar };
}

function isTypeValid(value: unknown, rule: ParameterValidationRule): boolean {
  if (rule.valueType === "string") return typeof value === "string";
  if (rule.valueType === "integer") return typeof value === "number" && Number.isInteger(value);
  return typeof value === "number" && Number.isFinite(value);
}

function isStepAligned(value: number, rule: ParameterValidationRule): boolean {
  if (!rule.step) return true;
  const base = rule.min ?? 0;
  const quotient = (value - base) / rule.step;
  return Math.abs(quotient - Math.round(quotient)) < 1e-8;
}

function formatLogTime(index: number): string {
  return `00:00:${String(index).padStart(2, "0")}`;
}

function runCategory(
  key: ConfigValidationKey,
  execute: (findings: ConfigFinding[]) => number,
): ConfigCategoryResult {
  const startedAt = performance.now();
  const findings: ConfigFinding[] = [];
  const checks = execute(findings);
  const durationMs = Math.max(1, Math.round((performance.now() - startedAt) * 10) / 10);
  const errors = findings.filter(item => item.severity === "error");
  const warnings = findings.filter(item => item.severity === "warning");
  return {
    key,
    state: errors.length ? "failed" : "passed",
    checks,
    durationMs,
    summary: errors.length
      ? `${errors.length} 个阻断项`
      : warnings.length
        ? `通过，${warnings.length} 个提示`
        : `${checks} 项通过`,
    findings,
  };
}

export function validateExtensionConfig(input: ExtensionConfigInput): ExtensionConfigReport {
  const totalStartedAt = performance.now();
  let parsed: Record<string, unknown> | null = null;
  let parserError = "";

  const syntax = runCategory("syntax", findings => {
    let checks = 0;
    checks += 1;
    if (!/\.ya?ml$/i.test(input.fileName)) {
      addFinding(findings, { ruleId: "FMT-001", severity: "error", message: "文件扩展名不是 .yaml 或 .yml", path: "file", guidance: "请下载平台 YAML 模板后修改并重新上传。" });
    }
    checks += 1;
    if (input.fileSize <= 0 || input.fileSize > MAX_YAML_BYTES) {
      addFinding(findings, { ruleId: "FMT-002", severity: "error", message: `文件大小必须为 1 B～${MAX_YAML_BYTES / 1024} KB`, path: "file", guidance: "删除无关内容；参数模板不得携带代码、模型或二进制数据。" });
    }
    checks += 1;
    if (!input.source.trim() || input.source.includes("\0")) {
      addFinding(findings, { ruleId: "FMT-003", severity: "error", message: "文件为空或包含 NUL 控制字符", path: "file", guidance: "使用 UTF-8 文本格式保存 YAML。" });
    }

    if (!findings.some(item => item.ruleId === "FMT-002" || item.ruleId === "FMT-003")) {
      try {
        const document = parseDocument(input.source, {
          version: "1.2",
          schema: "core",
          strict: true,
          stringKeys: true,
          uniqueKeys: true,
          merge: false,
          customTags: [],
        });
        checks += 1;
        if (document.errors.length) {
          parserError = document.errors.map(error => error.message.split("\n")[0]).join("；");
          addFinding(findings, { ruleId: "FMT-004", severity: "error", message: parserError, path: "yaml", guidance: "修复缩进、重复键或多文档等 YAML 语法问题。" });
        } else {
          const value = document.toJS({ maxAliasCount: 0 });
          if (!isPlainRecord(value)) {
            addFinding(findings, { ruleId: "FMT-005", severity: "error", message: "YAML 根节点必须是对象", path: "<root>", guidance: "请保留平台模板的键值结构。" });
          } else {
            parsed = value;
            const structure = inspectStructure(value);
            checks += 3;
            if (structure.depth > MAX_YAML_DEPTH) {
              addFinding(findings, { ruleId: "FMT-006", severity: "error", message: `嵌套层级 ${structure.depth} 超过上限 ${MAX_YAML_DEPTH}`, path: "<root>", guidance: "参数模板只允许平台定义的浅层结构。" });
            }
            if (structure.nodes > MAX_YAML_NODES) {
              addFinding(findings, { ruleId: "FMT-007", severity: "error", message: `节点数 ${structure.nodes} 超过上限 ${MAX_YAML_NODES}`, path: "<root>", guidance: "删除重复或未定义字段。" });
            }
            if (structure.longestScalar > MAX_SCALAR_LENGTH) {
              addFinding(findings, { ruleId: "FMT-008", severity: "error", message: `单个文本值超过 ${MAX_SCALAR_LENGTH} 字符`, path: "<root>", guidance: "参数值不得承载脚本、密钥或大段文本。" });
            }
          }
        }
      } catch (error) {
        parserError = error instanceof Error ? error.message : "YAML 解析失败";
        addFinding(findings, { ruleId: "FMT-004", severity: "error", message: parserError, path: "yaml", guidance: "请使用平台模板并检查文件深度、缩进和特殊语法。" });
      }
    }
    return checks;
  });

  const compatibility = runCategory("compatibility", findings => {
    const checks = 5;
    if (!parsed) {
      addFinding(findings, { ruleId: "CMP-000", severity: "error", message: "文件与语法检查未通过，无法判断兼容性", guidance: "先修复文件与语法阻断项。" });
      return checks;
    }
    if (parsed.schema_version !== "maas.extension-params/v1") {
      addFinding(findings, { ruleId: "CMP-001", severity: "error", message: "schema_version 不受支持", path: "schema_version", guidance: "使用当前模板固定值 maas.extension-params/v1。" });
    }
    if (parsed.template_id !== input.expectedTemplate.configId) {
      addFinding(findings, { ruleId: "CMP-002", severity: "error", message: `template_id 应为 ${input.expectedTemplate.configId}`, path: "template_id", guidance: "从对应模板卡片重新下载 YAML。" });
    }
    if (parsed.template_version !== input.expectedTemplate.configVersion) {
      addFinding(findings, { ruleId: "CMP-003", severity: "error", message: `模板版本应为 ${input.expectedTemplate.configVersion}`, path: "template_version", guidance: "旧模板不自动迁移，请下载当前版本后重新填写参数。" });
    }
    if (parsed.extension_type !== input.expectedTemplate.typeCode) {
      addFinding(findings, { ruleId: "CMP-004", severity: "error", message: `扩展类型应为 ${input.expectedTemplate.typeCode}`, path: "extension_type", guidance: "扩展类型由模板固定，不允许手工修改。" });
    }
    if (typeof parsed.extension_name !== "string" || !parsed.extension_name.trim() || parsed.extension_name.length > 64) {
      addFinding(findings, { ruleId: "CMP-005", severity: "error", message: "extension_name 必须为 1～64 个字符", path: "extension_name", guidance: "填写可识别的扩展配置名称。" });
    }
    return checks;
  });

  const normalizedParameters: Record<string, string | number> = {};
  const parameters = runCategory("parameters", findings => {
    const expected = input.expectedTemplate.parameters;
    let checks = Math.max(1, expected.length * 3);
    if (!parsed || !isPlainRecord(parsed.parameters)) {
      addFinding(findings, { ruleId: "PAR-001", severity: "error", message: "parameters 必须是对象", path: "parameters", guidance: "保留模板中的 parameters 键及其缩进。" });
      return checks;
    }
    const values = parsed.parameters;
    const allowedKeys = new Set(expected.map(item => item.key));
    for (const key of Object.keys(values)) {
      if (!allowedKeys.has(key)) {
        addFinding(findings, { ruleId: "PAR-002", severity: "error", message: `存在未知参数 ${key}`, path: `parameters.${key}`, guidance: "只允许修改平台模板已经声明的参数。" });
      }
    }
    for (const rule of expected) {
      const value = values[rule.key];
      if (value === undefined || value === null) {
        addFinding(findings, { ruleId: "PAR-003", severity: "error", message: `缺少必填参数 ${rule.key}`, path: `parameters.${rule.key}`, guidance: "恢复模板中的必填参数及默认值。" });
        continue;
      }
      if (!isTypeValid(value, rule)) {
        addFinding(findings, { ruleId: "PAR-004", severity: "error", message: `${rule.key} 类型应为 ${rule.valueType}`, path: `parameters.${rule.key}`, guidance: "不要将数字写成带引号的字符串，也不要依赖隐式类型转换。" });
        continue;
      }
      if (typeof value === "number") {
        if ((rule.min !== undefined && value < rule.min) || (rule.max !== undefined && value > rule.max)) {
          addFinding(findings, { ruleId: "PAR-005", severity: "error", message: `${rule.key}=${value} 超出范围 ${rule.min ?? "-∞"}～${rule.max ?? "+∞"}`, path: `parameters.${rule.key}`, guidance: "将参数调整到模板声明的闭区间内。" });
        } else if (!isStepAligned(value, rule)) {
          addFinding(findings, { ruleId: "PAR-006", severity: "error", message: `${rule.key}=${value} 不符合步长 ${rule.step}`, path: `parameters.${rule.key}`, guidance: "按模板步长设置参数值。" });
        }
        if ((rule.recommendedMin !== undefined && value < rule.recommendedMin) || (rule.recommendedMax !== undefined && value > rule.recommendedMax)) {
          addFinding(findings, { ruleId: "PAR-W01", severity: "warning", message: `${rule.key}=${value} 超出建议区间 ${rule.recommendedMin}～${rule.recommendedMax}`, path: `parameters.${rule.key}`, guidance: "该值仍可启用，但建议确认训练成本与效果。" });
        }
      }
      if (typeof value === "string" && rule.options && !rule.options.includes(value)) {
        addFinding(findings, { ruleId: "PAR-007", severity: "error", message: `${rule.key} 不在允许选项内`, path: `parameters.${rule.key}`, guidance: `可选值：${rule.options.join("、")}。` });
      }
      normalizedParameters[rule.key] = value as string | number;
    }
    checks += 1;
    return checks;
  });

  const security = runCategory("security", findings => {
    const checks = 6;
    const forbiddenSyntax = [
      { id: "SEC-001", pattern: /^\s*%(?:TAG|YAML)\b/m, message: "禁止 YAML 指令" },
      { id: "SEC-002", pattern: /(^|[\s:[{,])![A-Za-z!]/m, message: "禁止自定义或显式标签" },
      { id: "SEC-003", pattern: /(^|[\s:[{,])[&*][A-Za-z0-9_-]+/m, message: "禁止锚点和别名" },
      { id: "SEC-004", pattern: /^\s*<<\s*:/m, message: "禁止合并键" },
    ];
    for (const rule of forbiddenSyntax) {
      if (rule.pattern.test(input.source)) {
        addFinding(findings, { ruleId: rule.id, severity: "error", message: rule.message, path: "yaml", guidance: "参数模板不需要 YAML 高级构造，请改为普通键值。" });
      }
    }
    if (parsed) {
      const allowedTopLevel = new Set(["schema_version", "template_id", "template_version", "extension_name", "extension_type", "parameters"]);
      for (const key of Object.keys(parsed)) {
        if (!allowedTopLevel.has(key)) {
          addFinding(findings, { ruleId: "SEC-005", severity: "error", message: `禁止未知顶层字段 ${key}`, path: key, guidance: "未知字段不会传入后端；请删除后重新调试。" });
        }
      }
    }
    const serialized = parsed ? JSON.stringify(parsed) : "";
    const secretPatterns = [
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      /\bAKIA[0-9A-Z]{16}\b/,
      /\bsk-[A-Za-z0-9_-]{20,}\b/,
      /\b(?:password|passwd|secret|access[_-]?token|private[_-]?key)\b\s*[:=]/i,
    ];
    if (secretPatterns.some(pattern => pattern.test(serialized) || pattern.test(input.source))) {
      addFinding(findings, { ruleId: "SEC-006", severity: "error", message: "检测到疑似密钥、令牌或凭证", path: "yaml", guidance: "删除敏感信息；扩展参数模板不得承载认证凭证。" });
    }
    return checks;
  });

  let mappingPreview: Record<string, unknown> | null = null;
  const mapping = runCategory("mapping", findings => {
    const checks = Math.max(2, input.expectedTemplate.parameters.length + 2);
    const paths = input.expectedTemplate.parameters.map(item => item.mappingPath);
    if (paths.some(path => !ALLOWED_TRAINING_MAPPING_PATHS.has(path))) {
      addFinding(findings, { ruleId: "MAP-001", severity: "error", message: "存在未注册的训练参数映射路径", guidance: "由平台维护模板参数到训练请求字段的映射，不允许用户自定义路径。" });
    }
    if (new Set(paths).size !== paths.length) {
      addFinding(findings, { ruleId: "MAP-002", severity: "error", message: "多个参数映射到同一训练字段", guidance: "修复模板映射表后再开放上传。" });
    }
    if (parameters.state === "failed" || compatibility.state === "failed") {
      addFinding(findings, { ruleId: "MAP-003", severity: "error", message: "兼容性或参数检查未通过，无法生成训练请求预览", guidance: "先修复前序阻断项。" });
    } else {
      mappingPreview = {
        template_id: input.expectedTemplate.configId,
        extension_type: input.expectedTemplate.typeCode,
        rule_set_version: EXTENSION_RULE_SET_VERSION,
        mapped_parameters: Object.fromEntries(input.expectedTemplate.parameters.map(rule => [rule.mappingPath, normalizedParameters[rule.key]])),
      };
      try {
        JSON.stringify(mappingPreview);
      } catch {
        addFinding(findings, { ruleId: "MAP-004", severity: "error", message: "训练请求预览无法序列化", guidance: "检查参数值是否为平台允许的基础数据类型。" });
      }
    }
    return checks;
  });

  const categories = [syntax, compatibility, parameters, security, mapping];
  const allFindings = categories.flatMap(item => item.findings);
  const errorCount = allFindings.filter(item => item.severity === "error").length;
  const warningCount = allFindings.filter(item => item.severity === "warning").length;
  const logs: string[] = [
    `[${formatLogTime(0)}] 开始调试 · 规则集 ${EXTENSION_RULE_SET_VERSION}`,
    `[${formatLogTime(1)}] 文件 ${input.fileName} · ${input.fileSize} B · 仅做 YAML 配置校验`,
  ];
  categories.forEach((category, index) => {
    const label = CATEGORY_LABELS[category.key].name;
    logs.push(`[${formatLogTime(index + 2)}] ${category.state === "passed" ? "PASS" : "FAIL"} ${label} · ${category.summary}`);
    for (const finding of category.findings) {
      logs.push(`  ${finding.severity === "error" ? "ERROR" : "WARN"} ${finding.ruleId}${finding.path ? ` [${finding.path}]` : ""} ${finding.message}`);
    }
  });
  logs.push(`[${formatLogTime(8)}] 调试${errorCount ? "未通过" : "通过"} · 阻断项 ${errorCount} · 提示 ${warningCount}`);
  logs.push(`[${formatLogTime(9)}] ${errorCount ? "已禁止启用，请修复后重新调试" : "已生成版本级报告，可以启用"}`);

  return {
    passed: errorCount === 0,
    categories,
    errorCount,
    warningCount,
    totalDurationMs: Math.max(1, Math.round((performance.now() - totalStartedAt) * 10) / 10),
    normalizedParameters,
    mappingPreview,
    logs,
  };
}
