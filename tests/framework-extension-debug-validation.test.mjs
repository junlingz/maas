import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { build } from "esbuild";

const component = await readFile(new URL("../src/app/components/UnifiedExtensionManagement.tsx", import.meta.url), "utf8");
const helperSource = await readFile(new URL("../src/app/components/extensionConfigValidation.ts", import.meta.url), "utf8");
const requirement = await readFile(new URL("../框架扩展管理-需求描述.md", import.meta.url), "utf8");
const contract = await readFile(new URL("../docs/framework-extension-v1/contract.md", import.meta.url), "utf8");
const schema = JSON.parse(await readFile(new URL("../docs/framework-extension-v1/manifest.schema.json", import.meta.url), "utf8"));

const built = await build({
  entryPoints: [fileURLToPath(new URL("../src/app/components/extensionConfigValidation.ts", import.meta.url))],
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "es2022",
  write: false,
});
const temporaryDirectory = await mkdtemp(join(tmpdir(), "maas-extension-validation-"));
const temporaryModule = join(temporaryDirectory, "extension-validation.cjs");
await writeFile(temporaryModule, built.outputFiles[0].text, "utf8");
const validation = createRequire(import.meta.url)(temporaryModule);
await rm(temporaryDirectory, { recursive: true, force: true });

const optimizerTemplate = {
  id: "a2",
  configId: "optimizer",
  configVersion: "1.0.0",
  typeCode: "optimizer",
  parameters: [
    { key: "optimizer", label: "优化器", valueType: "string", defaultValue: "AdamW", options: ["AdamW", "Adam", "SGD", "Adafactor"], mappingPath: "training.optimizer.name" },
    { key: "learning_rate", label: "微调学习率", valueType: "float", defaultValue: "2e-5", min: 0.000001, max: 1, step: 0.000001, mappingPath: "training.optimizer.learning_rate" },
    { key: "weight_decay", label: "权重衰减", valueType: "float", defaultValue: "0.01", min: 0, max: 1, step: 0.001, mappingPath: "training.optimizer.weight_decay" },
    { key: "lr_scheduler_type", label: "学习率调度策略", valueType: "string", defaultValue: "cosine", options: ["cosine", "polynomial", "constant_with_warmup"], mappingPath: "training.optimizer.scheduler" },
  ],
};

function validate(source, fileName = "optimizer.yaml") {
  return validation.validateExtensionConfig({
    source,
    fileName,
    fileSize: Buffer.byteLength(source, "utf8"),
    expectedTemplate: optimizerTemplate,
  });
}

function findingIds(report) {
  return report.categories.flatMap(category => category.findings.map(finding => finding.ruleId));
}

test("合法模板真实解析并生成确定的训练参数映射", () => {
  const source = validation.buildTemplateYaml(optimizerTemplate, "自适应优化器");
  const report = validate(source);

  assert.equal(report.passed, true);
  assert.equal(report.errorCount, 0);
  assert.equal(report.categories.length, 5);
  assert.deepEqual(report.categories.map(category => category.state), ["passed", "passed", "passed", "passed", "passed"]);
  assert.equal(report.mappingPreview.mapped_parameters["training.optimizer.learning_rate"], 0.00002);
});

test("旧模板、未知参数、错误类型和越界值均为阻断项", () => {
  const source = validation.buildTemplateYaml(optimizerTemplate, "异常优化器")
    .replace('template_version: "1.0.0"', 'template_version: "0.9.0"')
    .replace("  learning_rate: 0.00002", '  learning_rate: "0.00002"')
    .replace("  weight_decay: 0.01", "  weight_decay: 2\n  beta1: 0.9");
  const report = validate(source);
  const ids = findingIds(report);

  assert.equal(report.passed, false);
  for (const id of ["CMP-003", "PAR-002", "PAR-004", "PAR-005", "MAP-003"]) assert.ok(ids.includes(id), id);
});

test("重复键、YAML 别名和疑似凭证不能通过安全检查", () => {
  const source = validation.buildTemplateYaml(optimizerTemplate, "不安全配置")
    .replace('extension_name: "不安全配置"', 'extension_name: "不安全配置"\nextension_name: "重复名称"')
    .replace("  optimizer: \"AdamW\"", '  optimizer: &shared "AdamW"\n  token: *shared')
    .concat('private_key: "-----BEGIN PRIVATE KEY-----"\n');
  const report = validate(source);
  const ids = findingIds(report);

  assert.equal(report.passed, false);
  for (const id of ["FMT-004", "SEC-003", "SEC-006"]) assert.ok(ids.includes(id), id);
});

test("训练字段不在平台注册白名单时阻断映射", () => {
  const source = validation.buildTemplateYaml(optimizerTemplate, "非法映射配置");
  const templateWithUnknownMapping = {
    ...optimizerTemplate,
    parameters: optimizerTemplate.parameters.map((parameter, index) => index === 0
      ? { ...parameter, mappingPath: "training.unregistered.path" }
      : parameter),
  };
  const report = validation.validateExtensionConfig({
    source,
    fileName: "optimizer.yaml",
    fileSize: Buffer.byteLength(source, "utf8"),
    expectedTemplate: templateWithUnknownMapping,
  });

  assert.equal(report.passed, false);
  assert.ok(findingIds(report).includes("MAP-001"));
});

test("上传只生成待调试版本，必须显式开始调试后才能启用", () => {
  assert.match(component, /validations: emptyConfigValidation\(\)/);
  assert.match(component, /当前为“待调试”/);
  assert.match(component, /onClick=\{\(\) => runDebug\(debugExt\.id\)\}/);
  assert.match(component, /getState\(target\.validations\) !== "passed"/);
  assert.doesNotMatch(component, /上传扩展包|sft_dialog_100|PyTorch|吞吐|内存峰值|性能验证/);
});

test("规则、需求和机器可读信封使用同一版本与五类口径", () => {
  for (const prefix of ["FMT-", "CMP-", "PAR-", "SEC-", "MAP-"]) {
    assert.ok(helperSource.includes(prefix));
    assert.ok(requirement.includes(prefix));
  }
  for (const marker of ["文件与语法", "模板兼容性", "参数合法性", "安全性", "训练参数映射", "`ERROR`", "64 KB"]) {
    assert.ok(requirement.includes(marker), marker);
    assert.ok(contract.includes(marker) || marker === "64 KB", marker);
  }
  assert.equal(schema.properties.schema_version.const, "maas.extension-params/v1");
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, ["schema_version", "template_id", "template_version", "extension_name", "extension_type", "parameters"]);
});
