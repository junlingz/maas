import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/app/components/UnifiedExtensionManagement.tsx", import.meta.url), "utf8");
const validation = await readFile(new URL("../src/app/components/extensionConfigValidation.ts", import.meta.url), "utf8");
const spec = await readFile(new URL("../框架扩展管理-需求描述.md", import.meta.url), "utf8");

const optimizerTemplate = source.slice(
  source.indexOf('id: "a2"'),
  source.indexOf('id: "a3"'),
);

test("自定义优化器模板使用开发确认的四项参数", () => {
  for (const parameter of ["optimizer", "learning_rate", "weight_decay", "lr_scheduler_type"]) {
    assert.match(optimizerTemplate, new RegExp(`key: "${parameter}"`));
    assert.ok(spec.includes("`" + parameter + "`"));
  }

  assert.doesNotMatch(optimizerTemplate, /key: "beta1"|key: "beta2"/);
});

test("优化器参数默认值、调度策略和训练字段映射一致", () => {
  assert.match(optimizerTemplate, /defaultValue: "AdamW"/);
  assert.match(optimizerTemplate, /defaultValue: "2e-5"/);
  assert.match(optimizerTemplate, /defaultValue: "0\.01"/);
  assert.match(optimizerTemplate, /defaultValue: "cosine"/);
  assert.match(optimizerTemplate, /key: "optimizer"[\s\S]*?valueType: "string"/);
  assert.match(optimizerTemplate, /key: "learning_rate"[\s\S]*?valueType: "float"/);
  assert.match(optimizerTemplate, /key: "weight_decay"[\s\S]*?valueType: "float"/);
  assert.match(optimizerTemplate, /key: "lr_scheduler_type"[\s\S]*?valueType: "string"/);
  assert.match(optimizerTemplate, /options: \["cosine", "polynomial", "constant_with_warmup"\]/);
  for (const mapping of [
    "training.optimizer.name",
    "training.optimizer.learning_rate",
    "training.optimizer.weight_decay",
    "training.optimizer.scheduler",
  ]) {
    assert.ok(optimizerTemplate.includes(mapping));
    assert.ok(spec.includes("`" + mapping + "`"));
  }
});

test("参数类型、映射同时进入弹窗和单文件 YAML 下载", () => {
  assert.match(source, />类型<\/th>/);
  assert.match(source, />训练字段<\/th>/);
  assert.match(source, /parameter\.mappingPath/);
  assert.match(source, /buildTemplateYaml\(template, template\.name\)/);
  assert.match(source, /application\/yaml;charset=utf-8/);
  assert.match(source, />下载 YAML<\/button>/);
  assert.match(validation, /parameter\.valueType === "string"/);
  assert.match(validation, /parameters:/);
});
