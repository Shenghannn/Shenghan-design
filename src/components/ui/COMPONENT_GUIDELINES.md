# 全局组件规范

本文档沉淀当前系统已验证可复用的组件风格。后续新增任何模块或页面时，优先复用 `src/components/ui/` 内的基础组件，并遵循本文规范，避免不同模块各自发明一套筛选区、表格、表单、详情页和下拉交互。

本文档是 `01-页面设计基线/` 在组件使用层面的落地补充；如与全局设计基线冲突，以 `01-页面设计基线/` 为准。

## 适用范围

- 所有业务模块：产品、物流、采购、库存、主数据、执行作业、后续新增模块等。
- 所有高频页面类型：列表页、筛选区、表格、创建/编辑表单、详情页、弹窗、底部操作区。
- 所有高频基础组件：按钮、输入框、单选下拉、多选下拉、日期范围、卡片、分页、状态标签、弹窗、详情展示。

## 基础依赖

- 全局设计基线：`01-页面设计基线/`
- 样式 Token：`src/ui-foundation.css`
- Tailwind 映射：`tailwind-preset.ts`
- 基础组件：`src/components/ui/`
- 设计系统展示页：`src/pages/design-system-page.tsx`

禁止在业务页面中重复实现已有基础组件。按钮、输入框、下拉、日期范围、卡片、分页、弹窗、状态标签等均应从 `src/components/ui/` 引入。

## 页面结构

列表页使用统一结构：

```tsx
<div className="space-y-4">
  <Card>{/* 筛选区 */}</Card>
  <Card>{/* 工具栏 + 表格 + 分页 */}</Card>
</div>
```

创建/编辑页使用统一结构：

```tsx
<div className="space-y-4 pb-16">
  <Card>{/* 基本信息 */}</Card>
  <Card>{/* 明细配置 */}</Card>
  <div className="fixed inset-x-0 bottom-0 z-30 ...">{/* 底部按钮 */}</div>
</div>
```

详情页使用 `Card + SectionTitle + InfoItem` 或统一详情组件。若创建/编辑页字段、枚举、展示规则发生变化，必须同步检查并调整详情页展示，避免表单和详情数据口径不一致。

## 筛选区

- 使用 `Card` 承载筛选条件。
- 筛选项容器使用 `flex flex-wrap items-end gap-3`。
- 单选下拉使用 `Select`。
- 日期范围使用 `DateRangePicker`。
- 文本搜索使用 `Input`。
- 操作按钮使用 `Button variant="primary"` 和 `Button variant="secondary"`。

组合筛选采用“左侧字段下拉 + 右侧输入/日期”的形式：

```tsx
<div className="grid grid-cols-[132px_1fr] gap-2">
  <Select value={field} options={fieldOptions} clearable={false} onValueChange={setField} />
  <Input value={keyword} placeholder="请输入搜索内容" onChange={...} />
</div>
```

时间筛选同理：

```tsx
<div className="grid grid-cols-[132px_1fr] gap-2">
  <Select value={timeField} options={timeFieldOptions} clearable={false} onValueChange={setTimeField} />
  <DateRangePicker value={dateRange} onChange={setDateRange} />
</div>
```

## 单选下拉

统一使用 `Select`：

- 默认支持清空。
- 鼠标移入控件时，右侧显示 `x` 清除按钮。
- 不在下拉菜单中放“取消选中”选项。
- 必填字段或字段类型选择器应设置 `clearable={false}`。
- 筛选类下拉如果包含 `value: "all"`，清空时回到 `all`。

## 多选下拉

多选组件使用统一样式：

- 输入框内展示第一个已选标签。
- 超出部分展示 `+ N`。
- 鼠标移入控件时右侧显示 `x`，点击清空全部选择。
- 下拉列表不使用 checkbox，选中项高亮，右侧显示对勾。
- 下拉面板使用 `createPortal` 渲染到 `document.body`，避免被表格或滚动容器裁剪。

多选展示示例：

```tsx
Amazon-US官方旗舰店  + 2
```

下拉选项示例：

```tsx
Amazon-US官方旗舰店        ✓
Amazon-CA北美店           ✓
Walmart家居店
```

## 表格

表格统一放在 `Card` 内：

```tsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[1200px] border-collapse text-left text-small">
    <thead className="bg-bg-page text-text-muted">...</thead>
    <tbody className="divide-y divide-border bg-white">...</tbody>
  </table>
</div>
```

表头单元格使用：

```tsx
const tableHeadCell = "whitespace-nowrap px-3 py-3 text-left text-small font-medium";
```

表格内容：

- 单行文本使用 `whitespace-nowrap px-3 py-3`。
- 主次信息上下展示，主信息默认色，次信息使用 `text-text-muted`。
- 状态使用 `Badge` 或语义颜色，不直接写硬编码颜色。
- 空数据行使用居中灰色文案，并设置正确 `colSpan`。
- 分页统一使用 `Pagination`，放在表格后方，必要时 `showTopBorder`。
- 明细表中如果某个字段支持整列批量编辑，入口放在该字段表头内，例如“申报价格 批量编辑”；点击后弹出弹窗，只修改当前字段整列数据。不要把这类字段级批量编辑放到表格上方的全局功能区。

列表工具栏使用左右分区：

- 左侧放业务全局功能，例如新增、作废、生成单据、下推、批量处理等。
- 右侧只放导入、导出类功能，例如导入、导出 Excel、导出 PDF。
- 不要把新增、生成、下推等业务动作放到右侧导入/导出区域。
- 多个导出格式应拆成独立按钮，例如 `导出Excel`、`导出PDF`。

## 表单

表单字段使用横向布局，标签在左、控件在右。局部页面可定义 `FormRow`：

```tsx
<div className="flex items-center gap-2">
  <div className="w-[112px] shrink-0 text-right text-small text-text-secondary">
    <span className="mr-1 text-danger">*</span>
    字段名
  </div>
  <div className="min-w-0 flex-1">{children}</div>
</div>
```

表单区域建议使用：

```tsx
<div className="mt-4 grid gap-x-10 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
  ...
</div>
```

仅展示字段不要使用禁用输入框，优先使用纯文本展示。

## 详情页

详情页与创建/编辑页必须保持字段口径一致：

- 创建/编辑页改字段名，详情页同步改。
- 创建/编辑页由单选改多选，详情页同步改为多值展示。
- 创建/编辑页数据来源变化，详情页同步按同一来源展示。
- 创建/编辑页移除字段，详情页同步移除。
- 详情页只展示数据，不使用禁用态输入框、禁用下拉框或可编辑表单控件；除非业务明确要求保留控件形态，否则使用纯文本或 `InfoItem`。
- 明细表详情也只展示文本数据，不在单元格内放禁用输入框。

常用详情展示：

```tsx
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 text-small">
      <div className="text-text-secondary">{label}</div>
      <div className="text-text-primary">{value || "-"}</div>
    </div>
  );
}
```

## 操作按钮

- 主操作：`Button variant="primary" size="sm"`。
- 次操作：`Button variant="secondary" size="sm"`。
- 危险操作：`Button variant="danger" size="sm"`。
- 表格行内操作使用文本按钮：`border-0 bg-transparent p-0 text-primary hover:underline`。
- 底部固定操作区按“取消/上一步”在左，“保存/提交/确定”在右的业务顺序排列。

## 状态与标签

状态优先使用 `Badge`：

- 草稿/默认：`draft`
- 待处理/待审批：`pending`
- 处理中：`processing`
- 成功/启用/已完成：`success`
- 关闭/禁用/作废：`closed`
- 错误：`error`

不要在业务页面中硬编码状态背景色。

## 弹窗与下拉层级

- 弹窗使用 `Modal`。
- 下拉、级联、多选等浮层如位于表格或滚动容器内，应使用 `createPortal` 固定定位，避免被 `overflow` 裁剪。
- 下拉面板层级建议 `zIndex: 70` 或更高，局部复杂多选可使用 `zIndex: 80`。

## 新增页面检查清单

新增或调整任意业务页面前，检查：

- 是否复用 `Card / Button / Input / Select / DateRangePicker / Pagination / Badge / Modal`。
- 筛选区是否为统一卡片、统一间距、统一按钮。
- 单选是否支持 hover 清除，必填字段是否禁用清除。
- 多选是否为标签 `+N`、右侧对勾、hover 清空样式。
- 表格是否使用统一表头、行高、分页和空数据样式。
- 创建/编辑页变化是否同步到详情页。
- 是否避免硬编码颜色、字号、边框、圆角。
