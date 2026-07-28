import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataSource = fs.readFileSync(path.join(root, "src/app/components/EvaluationData.tsx"), "utf8");
const dataStoreSource = fs.readFileSync(path.join(root, "src/app/components/evaluationDatasetStore.ts"), "utf8");
const uploadPermissionSource = dataSource.slice(
  dataSource.indexOf('<section id="dataset-permission"'),
  dataSource.indexOf('<div className="flex items-center justify-end gap-2"', dataSource.indexOf('<section id="dataset-permission"')),
);
const sharePermissionSource = dataSource.slice(
  dataSource.indexOf("function ShareDrawer"),
  dataSource.indexOf("export function EvaluationDataPage"),
);

test("我的数据集权限使用单一权限范围字段", () => {
  assert.match(dataSource, /useState<MyDatasetPermission>\("仅自己可见"\)/);
  for (const source of [uploadPermissionSource, sharePermissionSource]) {
    assert.match(source, /权限范围/);
    assert.match(source, /<option value="仅自己可见"/);
    assert.match(source, /<option value="团队可见">团队可见<\/option>/);
    assert.match(source, /<option value="团队可编辑">团队可编辑<\/option>/);
    assert.doesNotMatch(source, /团队成员权限|uploadSubPermission|subPermission/);
  }
});

test("团队权限保留不可逆提示并禁止已共享数据集改回私有", () => {
  assert.match(uploadPermissionSource, /uploadPermission !== "仅自己可见"/);
  assert.match(sharePermissionSource, /permission !== "仅自己可见"/);
  for (const source of [uploadPermissionSource, sharePermissionSource]) {
    assert.match(source, /共享至团队后，不可改回仅自己可见，请谨慎修改。/);
    assert.match(source, /role="alert"/);
  }
  assert.match(sharePermissionSource, /disabled=\{alreadyShared\}/);
});

test("已保存的旧权限文案会迁移到新的权限范围", () => {
  assert.match(dataStoreSource, /"团队成员可见（只读）"\) return "团队可见"/);
  assert.match(dataStoreSource, /"团队成员可见（编辑）"\) return "团队可编辑"/);
  assert.match(dataStoreSource, /permission: normalizeDatasetPermission\(item\.permission\)/);
});
