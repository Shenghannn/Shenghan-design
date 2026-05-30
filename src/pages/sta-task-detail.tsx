import { useState } from "react";
import { ChevronDown, Pencil, ScrollText } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { getStaWizardStepIndex, type StaWizardStepName } from "./create-sta-task";
import type { StaTaskRecord } from "./first-leg-prototypes";

const staWizardSteps = [
  "选择发货商品",
  "商品装箱",
  "配送服务",
  "箱子标签",
  "货件追踪",
] as const;

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";

function StaWizardStepBar({ currentStepIndex }: { currentStepIndex: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-6">
      {staWizardSteps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;

        return (
          <div key={label} className="flex min-w-0 items-center gap-2">
            {index > 0 ? <span className="mx-1 hidden h-px w-8 bg-border sm:block" aria-hidden="true" /> : null}
            <div
              className={`flex min-w-0 items-center gap-2 rounded-sm px-1 py-1 text-small ${
                isActive
                  ? "font-medium text-primary"
                  : isCompleted
                    ? "text-text-secondary"
                    : "text-text-muted"
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-caption ${
                  isActive
                    ? "border-primary bg-primary text-white"
                    : isCompleted
                      ? "border-border bg-bg-page text-text-secondary"
                      : "border-border bg-white text-text-muted"
                }`}
              >
                {stepNumber}
              </span>
              <span className="truncate">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailField({
  label,
  required,
  value,
  className,
}: {
  label: string;
  required?: boolean;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-small text-text-muted">
        {label}
        {required ? <span className="text-danger">*</span> : null}
      </div>
      <div className="mt-1.5 text-body text-text-primary">{value}</div>
    </div>
  );
}

function ProductImagePlaceholder() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-bg-page text-text-muted">
      <span className="text-caption">图</span>
    </div>
  );
}

function FeeSummary({ totalFee }: { totalFee: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="text-small text-text-muted">费用</div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-body text-text-primary">{totalFee}</span>
        <button
          type="button"
          className="inline-flex border-0 bg-transparent p-0 text-text-muted hover:text-primary"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {open ? (
        <div className="mt-2 rounded-md border border-border bg-bg-page/60 px-3 py-2 text-small text-text-secondary">
          <div className="flex justify-between gap-4">
            <span>入库配置费</span>
            <span>10.00</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SelectProductsDetailBody({
  record,
  onEdit,
}: {
  record: StaTaskRecord;
  onEdit: () => void;
}) {
  const isPlanCreated = record.planCreated === true;
  const displayName = record.taskName?.trim() || record.staNo;
  const products = record.products ?? [];
  const declaredTotal = products.reduce((sum, product) => sum + product.declaredQty, 0);

  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <DetailField label="店铺" required value={record.store} />
        {isPlanCreated ? (
          <>
            <DetailField label="STA任务名称" value={displayName} />
            <DetailField label="STA任务编号" value={record.inboundPlanId ?? "-"} />
          </>
        ) : (
          <DetailField label="STA名称" value={displayName} className="md:col-span-2" />
        )}

        <div className="md:col-span-3">
          <DetailField
            label="分仓方式"
            required
            value={
              <div className="flex flex-wrap items-center gap-6">
                <span className="text-text-muted">先装箱再分仓</span>
                <span className="font-medium text-text-primary">先分仓再装箱</span>
              </div>
            }
          />
        </div>

        {isPlanCreated ? (
          <>
            <DetailField label="创建人" value={record.creator ?? "-"} />
            <DetailField label="创建时间" value={record.createdAt ?? "-"} />
            <FeeSummary totalFee={record.placementFee ?? "USD0"} />
          </>
        ) : null}

        <DetailField
          label="发货地址"
          value={record.shippingAddress ?? "-"}
          className={isPlanCreated ? "md:col-span-3" : "md:col-span-2"}
        />

        {!isPlanCreated ? (
          <DetailField label="备注" value={record.remark?.trim() || "-"} />
        ) : (
          <div className="md:col-span-3">
            <div className="text-small text-text-muted">备注</div>
            <div className="mt-1.5 flex items-start gap-2 text-body text-text-primary">
              <span>{record.remark?.trim() || "-"}</span>
              <Pencil aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[1280px] border-collapse text-left text-small">
          <thead className="bg-bg-page text-text-muted">
            <tr>
              <th className={tableHeadCell}>序号</th>
              <th className={tableHeadCell}>图片</th>
              <th className={tableHeadCell}>MSKU</th>
              <th className={tableHeadCell}>FNSKU</th>
              <th className={tableHeadCell}>ASIN</th>
              <th className={tableHeadCell}>中文品名</th>
              <th className={tableHeadCell}>SKU</th>
              <th className={tableHeadCell}>计划发货量</th>
              <th className={tableHeadCell}>预处理提供方/标签类型</th>
              <th className={tableHeadCell}>申报量</th>
              <th className={tableHeadCell}>有效期</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {products.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-10 text-center text-text-muted">
                  暂无商品明细
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product.id}>
                  <td className="whitespace-nowrap px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3">
                    <ProductImagePlaceholder />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{product.msku}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.fnsku}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.asin}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.productName}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.sku}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.plannedQty}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{product.prepProvider}</div>
                    <div className="text-text-muted">{product.labelType}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{product.declaredQty}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.validityPeriod || "-"}</td>
                </tr>
              ))
            )}
            {products.length > 0 ? (
              <tr className="bg-bg-page/60 font-medium">
                <td className="px-3 py-3" colSpan={9}>
                  总计
                </td>
                <td className="whitespace-nowrap px-3 py-3">{declaredTotal}</td>
                <td className="px-3 py-3" />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6">
        <Button variant="primary" size="sm" onClick={onEdit}>
          编辑
        </Button>
      </div>
    </>
  );
}

type StaTaskDetailPageProps = {
  record: StaTaskRecord;
  onEdit: () => void;
};

export function StaTaskDetailPage({ record, onEdit }: StaTaskDetailPageProps) {
  const stepIndex = getStaWizardStepIndex(record.currentStep as StaWizardStepName);
  const displayTitle = record.taskName?.trim() || record.staNo;
  const isDraft = record.status === "草稿";
  const showSelectProductsDetail = record.currentStep === "选择发货商品";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">{displayTitle}</h1>
          {isDraft ? <Badge tone="draft">草稿</Badge> : null}
        </div>
        <Button variant="secondary" size="sm">
          <ScrollText aria-hidden="true" className="h-4 w-4" />
          操作日志
        </Button>
      </div>

      <Card>
        <StaWizardStepBar currentStepIndex={stepIndex} />

        {showSelectProductsDetail ? (
          <SelectProductsDetailBody record={record} onEdit={onEdit} />
        ) : (
          <div className="mt-6 rounded-md border border-dashed border-border bg-bg-page/60 px-6 py-10 text-center">
            <div className="text-body font-medium text-text-primary">{record.currentStep}</div>
            <p className="mx-auto mt-3 max-w-2xl text-small leading-relaxed text-text-muted">
              当前步骤详情页原型待后续补充，可先通过编辑进入对应步骤页面。
            </p>
            <div className="mt-6 flex justify-center">
              <Button variant="primary" size="sm" onClick={onEdit}>
                编辑
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
