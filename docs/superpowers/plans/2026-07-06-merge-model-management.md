# Model Management Prototype Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the repository's three model-management child pages with the approved local model catalog, deployment, and instance workflows.

**Architecture:** Keep the repository shell and menu keys, but move model records and deployment records into shared React state in `App.tsx`. Replace the three existing page components with focused React implementations that consume typed props, so a newly created model and its weight/image addresses remain available when navigating to deployment.

**Tech Stack:** React 18, TypeScript, Vite 6, Tailwind utility classes, lucide-react, Node.js built-in test runner.

---

### Task 1: Shared contracts and regression tests

**Files:**
- Create: `src/app/model-management/types.ts`
- Create: `src/app/model-management/data.ts`
- Create: `tests/model-management-merge.test.mjs`

- [x] Add source-level regression tests asserting menu labels, shared model fields, four-column cards, required icon upload, readonly deployment paths, capacity copy, advanced placement copy, and instance filters.
- [x] Run `node --test tests/model-management-merge.test.mjs` and confirm failure before production files are changed.
- [x] Define `ModelRecord`, `DeploymentRecord`, `ModelInstanceRecord`, `PlacementStrategy`, and initial records with `developer`, `iconData`, `weightPath`, and `imagePath`.

### Task 2: Model catalog

**Files:**
- Replace: `src/app/components/ModelManagement.tsx`

- [x] Render compact four-column model cards with developer, parameter size, one primary category, created date, search clear control, and category filtering.
- [x] Implement a compact modal with required local PNG/JPG/SVG icon upload (5 MB maximum), developer text input, six model types, required weight path, and searchable image address.
- [x] Support add, view, edit, and deploy actions through typed callbacks.

### Task 3: Model deployment

**Files:**
- Replace: `src/app/components/ModelDeployment.tsx`

- [x] Render deployment grouping, resource-group filtering, reset, and new-deployment action.
- [x] Select from shared models and show `weightPath` and `imagePath` as readonly fields; omit model category.
- [x] Limit replicas to resource-group remaining capacity and show the exact maximum warning.
- [x] Keep `高级配置` collapsed by default with free/balanced placement strategies and the approved resource-fragmentation explanation.

### Task 4: Model instances and application wiring

**Files:**
- Replace: `src/app/components/DeployInstance.tsx`
- Modify: `src/app/App.tsx`

- [x] Render searchable/filterable model instances with selection, refresh, batch delete, status, logs, and pagination.
- [x] Rename the three menu children to `模型库`, `模型部署`, and `模型实例` while preserving keys `model-list`, `model-deploy`, and `deploy-instance`.
- [x] Store models and deployments in `App.tsx`; pass them to pages and navigate from a catalog card to a prefilled deployment modal.

### Task 5: Verification

**Files:**
- Verify: all modified source files

- [x] Run `node --test tests/model-management-merge.test.mjs` and expect all assertions to pass.
- [x] Run `npm run build` and expect Vite to exit with status 0.
- [x] Start `npm run dev -- --host 127.0.0.1`, verify all three pages in the browser at desktop and mobile widths, verify create-to-deploy data transfer, and check that the console has no errors.
