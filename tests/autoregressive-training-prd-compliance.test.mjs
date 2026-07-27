import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/app/App.tsx", import.meta.url), "utf8");
const workbench = readFileSync(new URL("../src/app/components/AutoregressiveTraining.tsx", import.meta.url), "utf8");
const prd = readFileSync(new URL("../../PRD-自回归预训练框架.md", import.meta.url), "utf8");

test("自回归预训练六步向导覆盖架构、数据、网络、训练、评估和提交", () => {
  for (const label of ["模型与架构", "数据集", "网络结构", "训练与资源参数", "评估设置", "确认提交"]) {
    assert.match(workbench, new RegExp(label));
  }
  for (const capability of ["BERT", "T5", "Decoder-only", "混合专家模型（MoE）", "UTF-8", "AdamW", "检查点", "困惑度（PPL）", "生成流畅度", "逻辑一致性"]) {
    assert.match(workbench, new RegExp(capability.replace(/[()]/g, "\\$&")));
  }
});

test("训练任务详情提供监控、日志、评估、报告与操作记录闭环", () => {
  for (const capability of ["实时日志", "自定义监控", "自动评估", "暂停评估", "导出 CSV", "下载 PDF 报告", "操作记录", "导出完整日志"]) {
    assert.match(workbench, new RegExp(capability));
  }
});

test("模型、任务、告警和技术支持页面均接入 MaaS 导航", () => {
  for (const route of ["training-model-library", "task-management", "training-alerts", "training-docs", "training-about"]) {
    assert.match(app, new RegExp(route));
  }
  for (const capability of ["模型权重", "模型配置", "词表文件", "兼容性检查通过", "版本记录", "告警中心", "REST API v1", "示例 Notebook", "下载 PDF 白皮书"]) {
    assert.match(workbench, new RegExp(capability));
  }
});

test("PRD 的 25 个详细功能均包含调整说明和前后页面截图", () => {
  assert.equal((prd.match(/^### 2\./gm) ?? []).length, 25);
  assert.equal((prd.match(/^- \*\*调整说明\*\*：/gm) ?? []).length, 25);
  assert.equal((prd.match(/^- \*\*调整前页面\*\*：/gm) ?? []).length, 25);
  assert.equal((prd.match(/^- \*\*调整后页面\*\*：/gm) ?? []).length, 25);
  assert.equal((prd.match(/docs\/screenshots\/autoregressive-training-before\//g) ?? []).length, 25);
  assert.equal((prd.match(/docs\/screenshots\/autoregressive-training\//g) ?? []).length, 25);
});

test("需求类型按 MaaS 现状区分改造和新增", () => {
  const overview = prd.split("## 二、详细功能需求")[0];
  assert.equal((overview.match(/\| 改造 \| P0 \|/g) ?? []).length, 19);
  assert.equal((overview.match(/\| 新增 \| P0 \|/g) ?? []).length, 6);
  assert.match(overview, /「改造」表示现有 MaaS 已有对应页面或部分能力/);
});
