# 家庭管理页：房间管理 + 家庭筛选 设计文档

日期: 2026-05-19
状态: 已确认

---

## 背景

当前 `pages/family-manage/index.vue` 页面仅展示单个家庭（通过路由参数传入 familyId）的家人和操作记录，缺少以下能力：
1. 无法在页面内切换查看不同家庭
2. 无法管理房间（添加/删除）
3. `isAdmin` 判断有 bug（对比了错误的字段）

## 目标

- 顶部 Tab 栏切换家庭，切换后所有区域数据同步刷新
- 新增"房间管理"区域，支持添加和删除房间
- 修复 `isAdmin` 判断，使用 `family.role === 'admin'`
- 仅管理员可修改家庭名（通过弹窗编辑）

---

## 设计

### 1. 家庭 Tab 切换

- 页面顶部横向排列所有家庭名称作为 Tab
- 当前选中的家庭高亮（绿色文字 + 底部指示线）
- 点击切换 → 更新 `activeFamilyId` → 重新加载家人、房间、操作记录
- 默认选中：路由参数传入的 `familyId`，无则取 `familyStore.currentFamilyId`

### 2. 修复 isAdmin 判断

- 现有：`family.value.createdBy === familyStore.currentFamily?.createdBy`（错误）
- 改为：`family.value.role === 'admin'`
- 依据：`loadFamilies()` 返回的数据中 `role` 字段来自 `family_members` 表

### 3. 家庭名修改（仅管理员）

- 管理员可见"修改"链接
- 点击 → `uni.showModal({ editable: true })` → 输入新名称
- 调用 `family` 云函数新增 `action: 'rename'`（需新增云函数分支）
- 修改成功后刷新家庭列表

### 4. 房间管理区域

- 位置：家人列表和最近操作之间
- 展示当前选中家庭的所有房间，每行显示房间名
- 默认房间（`isDefault: true`）显示「默认」标签，不可删除
- 非默认房间右侧显示「删除」按钮 → 确认弹窗 → 调用 `room` 云函数 `delete`
- 底部「+ 添加房间」按钮 → 弹窗输入 → 调用 `room` 云函数 `create`
- 切换家庭时房间列表同步刷新

---

## 影响范围

| 文件 | 改动类型 |
|------|----------|
| `src/pages/family-manage/index.vue` | 重构脚本 + 模板 |
| `src/pages/family-manage/index.scss` | 新增 Tab 和房间列表样式 |
| `cloudfunctions/family/index.js` | 新增 `rename` action |

## 不涉及

- 不新增页面
- 不修改 room 云函数（已有 create/delete/list）
- 不影响其他页面的房间下拉数据源
