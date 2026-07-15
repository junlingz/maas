import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.existsSync(new URL(path, import.meta.url))
  ? fs.readFileSync(new URL(path, import.meta.url), 'utf8')
  : '';

const html = read('../index.html');
const app = read('../src/app/App.tsx');
const types = read('../src/app/model-management/types.ts');
const catalog = read('../src/app/components/ModelManagement.tsx');
const plaza = read('../src/app/components/ModelPlaza.tsx');
const experience = read('../src/app/components/ModelExperience.tsx');
const evaluation = read('../src/app/components/ModelEvaluation.tsx');
const deployment = read('../src/app/components/ModelDeployment.tsx');
const instances = read('../src/app/components/DeployInstance.tsx');

test('模型管理菜单与本地三个页面一一对应', () => {
  assert.match(html, /<html lang="zh-CN" translate="no">/);
  assert.match(html, /<meta name="google" content="notranslate" \/>/);
  assert.match(app, /label: "模型广场", key: "model-plaza"/);
  assert.match(app, /useState\("model-plaza"\)/);
  assert.match(app, /label: "模型管理", key: "model-management"[\s\S]*label: "模型库", key: "model-list"[\s\S]*label: "模型部署", key: "model-deploy"[\s\S]*label: "模型实例", key: "deploy-instance"/);
  assert.match(app, /label: "模型库", key: "model-list"/);
  assert.match(app, /label: "模型部署", key: "model-deploy"/);
  assert.match(app, /label: "模型实例", key: "deploy-instance"/);
  assert.doesNotMatch(app, /搜索\.\.\./);
});

test('共享模型记录保留部署需要的完整数据', () => {
  ['developer', 'iconData', 'weightPath', 'imagePath'].forEach((field) => {
    assert.match(types, new RegExp(`${field}: string`));
  });
  assert.match(types, /category: ModelCategory/);
  assert.match(types, /capabilities: ModelCapability\[\]/);
  assert.match(app, /useState<ModelRecord\[]>/);
  assert.match(app, /models=\{models\}/);
});

test('模型库使用紧凑四列卡片与完整新建模型表单', () => {
  assert.match(catalog, /gridTemplateColumns: "repeat\(4, minmax\(0, 1fr\)\)"/);
  assert.match(catalog, /支持 PNG、JPG、SVG，最大 5 MB/);
  ['LLM', 'Embedding', 'Reranker', 'Image', 'Text-to-Speech', 'Speech-to-Text'].forEach((category) => {
    assert.match(types, new RegExp(`"${category}"`));
  });
  assert.match(catalog, /className="notranslate" translate="no"/);
  ['vision', 'tool', 'reasoning'].forEach((capability) => {
    assert.match(types, new RegExp(`"${capability}"`));
  });
  assert.match(catalog, /MODEL_CAPABILITIES\.map/);
  assert.match(catalog, /<span style=\{labelStyle\}>能力<\/span>/);
  assert.match(catalog, /模型权重地址/);
  assert.match(catalog, /模型镜像地址/);
  assert.match(catalog, /清空搜索词/);
  assert.match(catalog, /全部开发者/);
  assert.match(catalog, /aria-label="开发者筛选"/);
  assert.match(catalog, /model\.developer === developer/);
});

test('模型广场聚合模型库与部署状态并连接关键跳转', () => {
  const plazaRender = app.match(/<ModelPlazaPage[\s\S]*?\/>/)?.[0] ?? '';
  assert.match(plaza, /models: ModelRecord\[\]/);
  assert.match(plaza, /deployments: DeploymentRecord\[\]/);
  assert.match(plaza, /MODEL_STATUS = \["未部署", "已部署"\]/);
  assert.match(plaza, /MODEL_STATUS\.map/);
  assert.match(plaza, /className="notranslate"[\s\S]*translate="no"/);
  assert.match(plaza, /deployedCards = deployments\.flatMap/);
  assert.match(plaza, /undeployedCards = models/);
  assert.match(plaza, /gridTemplateColumns: "repeat\(3, minmax\(0, 1fr\)\)"/);
  assert.match(plaza, /width: "100%", minWidth: 0/);
  assert.match(plaza, /aria-label="清空搜索词"/);
  assert.match(plaza, /setSearchText\(""\); setSearchQuery\(""\);/);
  assert.doesNotMatch(plaza, /lineHeight: 1\.8 \}\}>\{model\.desc\}/);
  assert.match(plaza, /\{model\.status === "已部署" && \(/);
  assert.match(plaza, /model\.status === "已部署"[\s\S]*立即体验/);
  assert.match(plaza, /model\.status === "未部署"[\s\S]*去部署/);
  assert.match(plaza, /const canUseApi = model\.status === "已部署"/);
  assert.match(plaza, /const detailTabs = canUseApi \? \(\["intro", "api"\] as const\) : \(\["intro"\] as const\)/);
  assert.doesNotMatch(plaza, /部署名称：/);
  assert.doesNotMatch(plaza, /资源组：/);
  assert.doesNotMatch(plaza, /模型对比/);
  assert.match(plaza, /去部署/);
  assert.match(plaza, /去体验/);
  assert.match(plaza, /去训练/);
  assert.match(plaza, /API接入/);
  assert.match(plaza, /请求地址来自平台推理网关/);
  assert.match(plaza, /Model Key 绑定当前部署服务/);
  assert.match(plaza, /"model": "\$\{modelKey\}"/);
  assert.match(plaza, /name: "model"/);
  assert.match(plaza, /Header \/ 鉴权/);
  assert.match(plaza, /API_SECTION_LINKS/);
  assert.match(plaza, /position: "sticky", top: -24/);
  assert.match(plaza, /margin: "-24px -24px 0"/);
  assert.match(plaza, /borderBottom: "1px solid #e8ebf2", background: "#fff"/);
  assert.match(plaza, /scrollMarginTop: 56/);
  assert.match(plaza, /overflowY: "auto", overscrollBehavior: "contain"/);
  assert.match(plaza, /flex: 1, minHeight: 0, display: "flex", flexDirection: "column"/);
  assert.match(plaza, /api-curl-example/);
  assert.match(plaza, /CURL 调用示例/);
  assert.match(plaza, /核心请求参数说明/);
  assert.match(plaza, /返回结果与字段说明/);
  assert.match(plaza, /response\.json/);
  assert.match(plaza, /choices\[\]\.message\.content/);
  assert.doesNotMatch(plaza, />评测<\/button>/);
  assert.match(plazaRender, /onDeploy=\{model =>/);
  assert.match(plazaRender, /onTrain=\{model =>/);
  assert.doesNotMatch(plazaRender, /onEvaluate=/);
  assert.match(app, /onExperience=\{modelName =>/);
  assert.match(app, /trainingPrefillModelId/);
  assert.match(app, /initialModel=\{trainingPrefillModel\}/);
  assert.match(app, /getTrainingModelOptions/);
  assert.match(app, /useState\(initialModel \? 2 : 1\)/);
  assert.match(experience, /initialModel/);
});

test('模型部署回显只读权重和镜像并限制资源容量', () => {
  assert.match(deployment, /模型路径（权重地址）/);
  assert.match(deployment, /模型镜像地址/);
  assert.match(deployment, /className="notranslate" translate="no"/);
  assert.match(deployment, /readOnly/);
  assert.match(deployment, /模型分类筛选/);
  assert.match(deployment, /批量停止/);
  assert.match(deployment, /一键启动/);
  assert.match(deployment, /toggleSort/);
  assert.match(deployment, /STATIC_DEPLOYMENT_CHILDREN/);
  assert.match(deployment, /changeReplicasInline/);
  assert.match(deployment, /该资源组的剩余资源最多可部署/);
  assert.match(deployment, /高级配置/);
  assert.match(deployment, /自由调度：优先匹配可用资源，减少 GPU\/节点上的资源碎片/);
});

test('模型实例支持筛选、刷新与批量删除', () => {
  assert.match(instances, /名称搜索/);
  assert.match(instances, /全部资源组/);
  assert.match(instances, /全部节点/);
  assert.match(instances, /全部状态/);
  assert.match(instances, /deleteSelected/);
  assert.match(instances, /查看日志/);
  assert.match(instances, /下载日志/);
  assert.match(instances, /buildLogPdf/);
});
