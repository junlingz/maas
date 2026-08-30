import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const detailSource = await readFile(new URL("../src/app/components/TrainingTaskDetail.tsx", import.meta.url), "utf8");
const nodeSectionStart = detailSource.indexOf('title="节点 / Worker"');
const gpuSectionStart = detailSource.indexOf('>GPU 明细<', nodeSectionStart);
const nodeSectionSource = detailSource.slice(nodeSectionStart, gpuSectionStart);

test("节点性能表完整展示需规要求的五类指标", () => {
  assert.ok(nodeSectionStart >= 0, "缺少节点 / Worker 区域");
  assert.ok(gpuSectionStart > nodeSectionStart, "缺少 GPU 明细区域");
  for (const marker of [
    "GPU 利用率",
    "GPU 显存占用",
    "网络接收速率",
    "网络发送速率",
    "磁盘 I/O（读 / 写）",
  ]) {
    assert.match(nodeSectionSource, new RegExp(marker));
  }
  assert.match(nodeSectionSource, /aria-label="节点性能指标"/);
  assert.match(nodeSectionSource, /className="ttd-worker-table"/);
  assert.match(nodeSectionSource, /data-label="GPU 利用率"/);
  assert.match(nodeSectionSource, /data-label="网络发送速率"/);
});

test("节点演示数据分别提供 GPU、显存、网络收发及磁盘读写字段", () => {
  for (const field of [
    "gpuUtilization",
    "gpuMemoryUsed",
    "gpuMemoryTotal",
    "networkReceive",
    "networkSend",
    "diskRead",
    "diskWrite",
  ]) {
    assert.match(detailSource, new RegExp(field));
  }
});

test("五类节点性能字段均提供对应排序入口", () => {
  for (const option of [
    'value="gpuUtilization">GPU 利用率 ↓',
    'value="gpuMemory">GPU 显存占用 ↓',
    'value="networkReceive">网络接收速率 ↓',
    'value="networkSend">网络发送速率 ↓',
    'value="diskIO">磁盘 I/O ↓',
  ]) {
    assert.match(nodeSectionSource, new RegExp(option));
  }
});

test("GPU 明细卡片使用与需规一致的字段名称", () => {
  assert.match(detailSource.slice(gpuSectionStart), />GPU 利用率</);
  assert.match(detailSource.slice(gpuSectionStart), />GPU 显存占用</);
  assert.doesNotMatch(detailSource.slice(gpuSectionStart), />核心利用率</);
  assert.doesNotMatch(detailSource.slice(gpuSectionStart), />显存使用量\/总量</);
});
