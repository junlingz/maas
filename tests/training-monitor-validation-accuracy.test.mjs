import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const detailSource = await readFile(new URL("../src/app/components/TrainingTaskDetail.tsx", import.meta.url), "utf8");
const requirementSource = await readFile(new URL("../训练任务监控与调优-需求说明.md", import.meta.url), "utf8");

const lossChartStart = detailSource.indexOf('title="全局损失函数曲线"');
const accuracyChartStart = detailSource.indexOf('title="验证集准确率曲线"');
const bandwidthChartStart = detailSource.indexOf('title="通信带宽"', accuracyChartStart);
const accuracyChartSource = detailSource.slice(accuracyChartStart, bandwidthChartStart);

test("训练监控面板独立展示全局损失和验证集准确率曲线", () => {
  assert.ok(lossChartStart >= 0, "缺少全局损失函数曲线");
  assert.ok(accuracyChartStart > lossChartStart, "验证集准确率曲线应与损失曲线独立并列");
  assert.ok(bandwidthChartStart > accuracyChartStart, "验证集准确率曲线应位于监控趋势图区");
  assert.match(detailSource, /prototypeTrainingMetricData/);
  assert.match(detailSource, /validationLoss/);
  assert.match(accuracyChartSource, /dataKey="validationAccuracy"/);
  assert.doesNotMatch(accuracyChartSource, /dataKey="validationLoss"/);
});

test("验证集准确率曲线遵循百分比、实际检查点和缺失值规则", () => {
  assert.match(accuracyChartSource, /eval_accuracy/);
  assert.match(accuracyChartSource, /data=\{visibleMetricData\}/);
  assert.match(accuracyChartSource, /domain=\{\[0, 100\]\}/);
  assert.match(accuracyChartSource, /connectNulls=\{false\}/);
  assert.match(accuracyChartSource, /type="linear"/);
  assert.match(accuracyChartSource, /toFixed\(1\).*%/);
  assert.match(accuracyChartSource, /尚未产生验证集准确率数据/);
  assert.match(detailSource, /aria-label="监控时间范围"/);
  assert.match(detailSource, /aria-label="图表缩放"/);
});

test("需求说明覆盖核心需求、数据来源、计算口径和绘制规则", () => {
  for (const marker of [
    "验证集准确率曲线",
    "数据来源与口径",
    "metric_name=eval_accuracy",
    "valid_correct / valid_total × 100%",
    "不允许前端对各 Worker 百分比做简单平均",
    "前端不猜测单位",
    "图表绘制规则",
    "固定范围 0%–100%",
    "不进行前端插值",
    "只有 1 个有效点时仅显示该点",
    "静态演示数据",
    "需以后端联调记录和实际任务数据验证为准",
  ]) {
    assert.match(requirementSource, new RegExp(marker));
  }
});
