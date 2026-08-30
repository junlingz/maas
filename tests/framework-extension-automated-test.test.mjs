import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const management = await readFile(new URL("../src/app/components/UnifiedExtensionManagement.tsx", import.meta.url), "utf8");
const workbench = await readFile(new URL("../src/app/components/ExtensionTestWorkbench.tsx", import.meta.url), "utf8");
const requirement = await readFile(new URL("../docs/框架扩展-需求文档.md", import.meta.url), "utf8");

test("调试与测试保留为两个独立入口", () => {
  assert.match(management, /<Bug size=\{11\}/);
  assert.match(management, /<TestTube2 size=\{11\} \/>测试/);
  assert.match(management, /setDebugExtId\(latest\.id\)/);
  assert.match(management, /setTestExtId\(latest\.id\)/);
  assert.match(management, /调试与测试是两个独立弹窗/);
  assert.match(workbench, /role="dialog"/);
});

test("测试工作台以最小闭环覆盖三类工具并自动执行", () => {
  for (const marker of [
    "单元测试",
    "集成测试",
    "性能测试",
    "单元测试运行器",
    "集成测试运行器",
    "性能基准测试工具",
    "开始测试",
    "测试工具与用例",
    "测试结果与性能指标报告",
  ]) assert.match(workbench, new RegExp(marker), marker);

  assert.match(workbench, /for \(const stage of TEST_STAGES\)/);
  assert.match(workbench, /for \(const testCase of stage\.cases\)/);
});

test("用例仅在弹窗查看且报告仅在弹窗展示", () => {
  for (const caseId of ["UT-001", "UT-003", "IT-001", "IT-003", "PT-001", "PT-003"]) {
    assert.match(workbench, new RegExp(caseId), caseId);
  }
  for (const marker of [
    "测试用例",
    "测试结果与性能指标报告",
    "启动耗时",
    "处理吞吐",
    "P95 延迟",
    "内存峰值",
  ]) assert.match(workbench, new RegExp(marker), marker);
  assert.match(workbench, /查看 \{cases\.length\} 条用例/);
  assert.doesNotMatch(workbench, /下载用例|下载 PDF 报告|生成 PDF 报告|application\/json|text\/markdown|html2canvas|new jsPDF|pdf\.save/);
});

test("精简页不再展示兼容安全卡片、实时日志和多页签", () => {
  for (const marker of ["兼容性测试", "安全性测试", "自动执行流程", "测试日志", "role=\"tablist\""]) {
    assert.doesNotMatch(workbench, new RegExp(marker), marker);
  }
});

test("启用必须同时满足调试通过和自动化测试通过", () => {
  assert.match(management, /getState\(target\.validations\) !== "passed"/);
  assert.match(management, /testReports\[extensionId\]\?\.status !== "passed"/);
  assert.match(workbench, /extension\.debugState === "passed" && !running/);
  assert.match(requirement, /调试通过.*自动化测试通过|调试和自动化测试均通过/s);
});
