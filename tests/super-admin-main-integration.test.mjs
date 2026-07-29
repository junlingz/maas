import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/app/App.tsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../src/app/components/SuperAdminPages.tsx", import.meta.url), "utf8");

test("超级管理员模块作为原主站导航分组接入", () => {
  for (const label of ["资源管理", "权限与调度", "统计监控", "文档中心"]) {
    assert.match(appSource, new RegExp(`label: "${label}"`));
  }
  assert.doesNotMatch(appSource, /href="\/super-admin\.html"/);
  assert.equal(existsSync(new URL("../public/super-admin.html", import.meta.url)), false);
});

test("缺失页面均接入主站路由", () => {
  for (const component of [
    "ResourceRoleConfigPage",
    "ResourceRoleQueuePage",
    "ApiKeyManagementPage",
    "AdminUsageStatsPage",
    "TaskLogPage",
    "DocumentationCenterPage",
    "SampleRepositoryPage",
  ]) {
    assert.match(appSource, new RegExp(`<${component} \\/>`));
    assert.match(pageSource, new RegExp(`export function ${component}`));
  }
});

test("原资源管理页面继续复用并更新", () => {
  assert.match(appSource, /<ClusterListPage \/>/);
  assert.match(appSource, /<NodeListPage \/>/);
  assert.match(appSource, /<ResourceGroupPage \/>/);
});
