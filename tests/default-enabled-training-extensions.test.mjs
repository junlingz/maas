import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/app/App.tsx", import.meta.url), "utf8");
const training = readFileSync(new URL("../src/app/components/SupervisedFineTuningConfig.tsx", import.meta.url), "utf8");
const management = readFileSync(new URL("../src/app/components/UnifiedExtensionManagement.tsx", import.meta.url), "utf8");

test("框架扩展页默认启用 LoRA 与自适应优化器", () => {
  assert.match(management, /DEFAULT_ENABLED_FINE_TUNING_EXTENSIONS[\s\S]*LoRA\+ 训练器[\s\S]*自适应优化器/);
  assert.match(management, /id: "e1v3"[\s\S]*enabled: true/);
  assert.match(management, /id: "e4"[\s\S]*enabled: true/);
});

test("训练页初始化两项默认扩展并允许逐项开关", () => {
  assert.match(app, /useState<EnabledFineTuningExtension\[\]>\(\(\) =>[\s\S]*DEFAULT_ENABLED_FINE_TUNING_EXTENSIONS\.map/);
  assert.match(training, /enabledExtensions\?\.length \? enabledExtensions : DEFAULT_ENABLED_FINE_TUNING_EXTENSIONS/);
  assert.match(training, /已启用扩展（\{orderedExtensions\.length\}）/);
  assert.match(training, /默认用于本次训练，可按任务逐项关闭/);
  assert.match(training, /orderedExtensions\.map[\s\S]*<Toggle checked=\{on\}/);
  assert.match(training, /本次任务启用[\s\S]*本次任务关闭/);
});

test("启用同名新版本时替换训练页中的旧版本", () => {
  assert.match(app, /prev\.filter\(item => item\.name !== ext\.name \|\| item\.type !== ext\.type\)/);
});

test("扩展版本分组使用稳定 key", () => {
  assert.match(management, /<Fragment key=\{g\.key\}>/);
});
