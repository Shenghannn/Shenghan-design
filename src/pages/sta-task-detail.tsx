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
  canEdit,
  canGoNext,
  onNext,
}: {
  record: StaTaskRecord;
  onEdit: () => void;
  canEdit: boolean;
  canGoNext: boolean;
  onNext: () => void;
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

      {canEdit || canGoNext ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6">
          {canGoNext ? (
            <Button variant="primary" size="sm" onClick={onNext}>
              下一步
            </Button>
          ) : null}
          {canEdit ? (
            <Button variant={canGoNext ? "secondary" : "primary"} size="sm" onClick={onEdit}>
              编辑
            </Button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

type PackingRow = {
  boxNo: number;
  grossWeight: string;
  dimensions: string;
  volume: string;
  totalWeight: string;
  totalVolume: string;
  qtyPerBox: number;
};

const packingRows: PackingRow[] = [
  {
    boxNo: 1,
    grossWeight: "3.95",
    dimensions: "51.00*15.00*9.00",
    volume: "0.01",
    totalWeight: "11.85",
    totalVolume: "0.02",
    qtyPerBox: 1,
  },
  {
    boxNo: 2,
    grossWeight: "6.35",
    dimensions: "60.00*39.00*33.00",
    volume: "0.08",
    totalWeight: "6.35",
    totalVolume: "0.08",
    qtyPerBox: 1,
  },
  {
    boxNo: 3,
    grossWeight: "5.23",
    dimensions: "65.00*35.00*21.00",
    volume: "0.05",
    totalWeight: "5.23",
    totalVolume: "0.05",
    qtyPerBox: 1,
  },
];

function PackingDetailBody({
  record,
  completed,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: {
  record: StaTaskRecord;
  completed: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const shipments =
    record.confirmedShipments && record.confirmedShipments.length > 0
      ? record.confirmedShipments
      : [
          {
            shipmentId: record.shipmentNo,
            fcCode: record.destination,
            deliveryAddress: record.shippingAddress ?? "-",
            shipmentName: `FBA STA (${record.updatedAt})-${record.destination}`,
          },
        ];
  const [activeShipmentId, setActiveShipmentId] = useState(shipments[0]?.shipmentId ?? "");
  const activeShipment = shipments.find((shipment) => shipment.shipmentId === activeShipmentId) ?? shipments[0];
  const products = record.products && record.products.length > 0 ? record.products : [];
  const isCompleted = completed || record.packingStatus === "已完成";
  const totalQty = products.reduce((sum, product) => sum + product.declaredQty, 0);

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {shipments.map((shipment) => {
          const active = shipment.shipmentId === activeShipment?.shipmentId;
          return (
            <button
              key={shipment.shipmentId}
              type="button"
              className={`border-0 bg-transparent px-3 py-2 text-small ${
                active ? "border-b-2 border-primary font-medium text-primary" : "text-text-muted hover:text-text-primary"
              }`}
              onClick={() => setActiveShipmentId(shipment.shipmentId)}
            >
              {shipment.shipmentId}
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-md border border-border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-small">
            <span className="font-medium text-text-primary">{activeShipment?.shipmentId ?? "-"}</span>
            {isCompleted ? <Badge tone="success">已完成</Badge> : null}
            <span>{activeShipment?.shipmentName ?? `FBA STA (${record.updatedAt})-${activeShipment?.fcCode ?? "-"}`}</span>
            <span>含有效期：</span>
            <label className="inline-flex items-center gap-1 text-text-muted">
              <input type="radio" name="has-validity" disabled />
              是
            </label>
            <label className="inline-flex items-center gap-1 text-text-primary">
              <input type="radio" name="has-validity" checked readOnly />
              否
            </label>
          </div>
          <Button variant="secondary" size="sm">
            导出装箱清单
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1560px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>箱号</th>
                <th className={tableHeadCell}>箱子毛重(kg)</th>
                <th className={tableHeadCell}>箱子尺寸(cm)</th>
                <th className={tableHeadCell}>单箱体积(m³)</th>
                <th className={tableHeadCell}>总重量(kg)</th>
                <th className={tableHeadCell}>总体积(m³)</th>
                <th className={tableHeadCell}>图片</th>
                <th className={tableHeadCell}>MSKU</th>
                <th className={tableHeadCell}>FNSKU</th>
                <th className={tableHeadCell}>ASIN</th>
                {isCompleted ? <th className={tableHeadCell}>父ASIN</th> : null}
                <th className={tableHeadCell}>{isCompleted ? "品名/SKU" : "中文品名"}</th>
                <th className={tableHeadCell}>SKU</th>
                <th className={tableHeadCell}>预处理提供方/标签类型</th>
                <th className={tableHeadCell}>单箱数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {packingRows.map((row, index) => {
                const product = products[index % Math.max(products.length, 1)];

                return (
                  <tr key={row.boxNo}>
                    <td className="whitespace-nowrap px-3 py-3">{isCompleted ? row.qtyPerBox : row.boxNo}</td>
                    <td className="whitespace-nowrap px-3 py-3">{row.grossWeight}</td>
                    <td className="whitespace-nowrap px-3 py-3">{row.dimensions}</td>
                    <td className="whitespace-nowrap px-3 py-3">{row.volume}</td>
                    <td className="whitespace-nowrap px-3 py-3">{row.totalWeight}</td>
                    <td className="whitespace-nowrap px-3 py-3">{row.totalVolume}</td>
                    <td className="px-3 py-3">
                      {product ? <ProductImagePlaceholder /> : <span className="text-text-muted">-</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{product?.msku ?? "BD-05-07605-R"}</td>
                    <td className="whitespace-nowrap px-3 py-3">{product?.fnsku ?? "X004G3JUNU"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-primary">{product?.asin ?? "B0DLSW9SNX"}</td>
                    {isCompleted ? (
                      <td className="whitespace-nowrap px-3 py-3">{product?.asin ?? "B0DLSW9SNX"}</td>
                    ) : null}
                    <td className="whitespace-nowrap px-3 py-3">{product?.productName ?? "后视镜盖4345055+..."}</td>
                    <td className="whitespace-nowrap px-3 py-3">{product?.sku ?? "OS07605-R"}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div>{product?.prepProvider ?? "卖家"}</div>
                      <div className="text-text-muted">{product?.labelType ?? "卖家自己贴标签"}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{row.qtyPerBox}</td>
                  </tr>
                );
              })}
              <tr className="bg-bg-page/60 font-medium">
                <td className="px-3 py-3" colSpan={isCompleted ? 15 : 14}>
                  总计
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap justify-end gap-x-8 gap-y-2 border-t border-border px-4 py-3 text-small text-text-secondary">
          <span>
            申报量：<strong className="text-text-primary">{totalQty || 19}</strong>（0）
          </span>
          <span>
            总箱数：<strong className="text-text-primary">3箱</strong>
          </span>
          <span>
            总重量：<strong className="text-text-primary">23.43kg</strong>
          </span>
          <span>
            总体积：<strong className="text-text-primary">0.15CBM(m³)</strong>
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6">
        {canGoPrevious ? (
          <Button variant="secondary" size="sm" onClick={onPrevious}>
            上一步
          </Button>
        ) : null}
        {isCompleted ? (
          <Button variant="primary" size="sm" onClick={onNext} disabled={!canGoNext}>
            下一步
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="sm">
              重新开始
            </Button>
            <Button variant="primary" size="sm">
              提交装箱并继续
            </Button>
          </>
        )}
      </div>
    </>
  );
}

function DeliveryServiceDetailBody({
  record,
  completed,
  canEdit,
  canGoPrevious,
  canGoNext,
  onEdit,
  onPrevious,
  onNext,
}: {
  record: StaTaskRecord;
  completed: boolean;
  canEdit: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onEdit: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const shipments =
    record.confirmedShipments && record.confirmedShipments.length > 0
      ? record.confirmedShipments
      : [
          {
            shipmentId: "FBA19C34CPYD",
            fcCode: "YYZ7",
            deliveryAddress: "YYZ7-12724 Coleraine Drive, L7E 4L8, Bolton, ON, CA",
            shipmentName: "FBA STA (04/23/2026 08:24)-YYZ7",
          },
          {
            shipmentId: "FBA19C34CPYE",
            fcCode: "YYZ7",
            deliveryAddress: "YYZ7-12724 Coleraine Drive, L7E 4L8, Bolton, ON, CA",
            shipmentName: "FBA STA (04/23/2026 08:24)-YYZ7",
          },
        ];
  const isCompleted = completed || record.deliveryStatus === "已完成";

  return (
    <>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {shipments.map((shipment) => (
          <div key={shipment.shipmentId} className="rounded-md border border-border bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-section-title font-section-title text-text-primary">
                {shipment.shipmentName ?? `FBA STA (04/23/2026 08:24)-${shipment.fcCode}`}
              </div>
              <span className="rounded-sm border border-primary px-2 py-1 text-caption text-primary">SHIPPED</span>
            </div>

            <div className="grid gap-x-8 gap-y-3 text-small md:grid-cols-[92px_1fr]">
              <span className="text-text-muted">货件单号</span>
              <span>{shipment.shipmentId}</span>
              <span className="text-text-muted">Reference ID</span>
              <span>2D4WOETI</span>
              <span className="text-text-muted">物流中心编码</span>
              <span>{shipment.fcCode}</span>
              <span className="text-text-muted">发货地址</span>
              <span>Yi Wu Nan Sheng Dian Zi Shang Wu You Xian Gong Si, houzhai街道 tongtailu140hao, yiwuweilaikejiyuan2qi 1haolou702, jinhuashi, zhejiangsheng, 322000, CN, 17706790973</span>
              <span className="text-text-muted">配送地址</span>
              <span>{shipment.deliveryAddress}</span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_76px_76px_76px]">
              <div>
                <div className="mb-2 text-small text-text-secondary">SKU信息</div>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="relative">
                      <ProductImagePlaceholder />
                      <span className="absolute -right-1 -top-1 rounded-full bg-white px-1 text-caption text-text-primary shadow">5</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-small">
                  <span>共123个</span>
                  <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline">
                    查看更多&gt;&gt;
                  </button>
                </div>
              </div>
              <DetailValue label="MSKU" value="123" />
              <DetailValue label="申报量" value="1021" />
              <DetailValue label="箱数" value="119" />
            </div>

            <div className="mt-5 border-l-4 border-primary pl-3 font-medium text-text-primary">送达时段</div>
            <div className="mt-3 grid gap-y-2 text-small md:grid-cols-[92px_1fr]">
              <span className="text-text-muted">送达时段</span>
              <span>
                2026-06-07 ~ 2026-06-14
                <span className="ml-2 text-warning">（2026-06-07之前可在【货件追踪】步骤重新编辑）</span>
              </span>
            </div>

            <div className="mt-5 border-l-4 border-primary pl-3 font-medium text-text-primary">配送服务</div>
            <div className="mt-3 grid gap-x-8 gap-y-3 text-small md:grid-cols-[92px_1fr_92px_1fr]">
              <span className="text-text-muted">发货日期</span>
              <span>2026-04-29</span>
              <span className="text-text-muted">配送模式</span>
              <span>{isCompleted ? "亚马逊合作承运人(SEND)" : "--"}</span>
              <span className="text-text-muted">发货日期</span>
              <span>{isCompleted ? "小包裹快递(SPD)" : "--"}</span>
              <span className="text-text-muted">运输方式</span>
              <span>--</span>
              <span className="text-text-muted">承运人</span>
              <span>{isCompleted ? "UPS" : ""}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6">
        {canGoPrevious ? (
          <Button variant="secondary" size="sm" onClick={onPrevious}>
            上一步
          </Button>
        ) : null}
        {canGoNext ? (
          <Button variant="primary" size="sm" onClick={onNext}>
            下一步
          </Button>
        ) : null}
        {canEdit ? (
          <Button variant={canGoNext ? "secondary" : "primary"} size="sm" onClick={onEdit}>
            编辑
          </Button>
        ) : null}
      </div>
    </>
  );
}

function DetailValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-3 text-small text-text-secondary">{label}</div>
      <div className="text-body text-text-primary">{value}</div>
    </div>
  );
}

type StaTaskDetailPageProps = {
  record: StaTaskRecord;
  onEdit: () => void;
  detailStep?: StaWizardStepName;
  onPreviousStep: (record: StaTaskRecord, activeStep: StaWizardStepName) => void;
  onNextStep: (record: StaTaskRecord, activeStep: StaWizardStepName) => void;
};

export function StaTaskDetailPage({ record, onEdit, detailStep, onPreviousStep, onNextStep }: StaTaskDetailPageProps) {
  const activeDetailStep = detailStep ?? (record.currentStep as StaWizardStepName);
  const stepIndex = getStaWizardStepIndex(activeDetailStep);
  const currentStepIndex = getStaWizardStepIndex(record.currentStep as StaWizardStepName);
  const displayTitle = record.taskName?.trim() || record.staNo;
  const isDraft = record.status === "草稿";
  const canEditCurrentStep = activeDetailStep === record.currentStep;
  const canGoPreviousStep = stepIndex > 0;
  const forceCompletedDetail = stepIndex < currentStepIndex;
  const activeStepCompleted =
    forceCompletedDetail ||
    (activeDetailStep === "商品装箱" && record.packingStatus === "已完成") ||
    (activeDetailStep === "配送服务" && record.deliveryStatus === "已完成");
  const canGoNextStep = activeStepCompleted && stepIndex < staWizardSteps.length - 1;
  const showSelectProductsDetail = activeDetailStep === "选择发货商品";
  const showPackingDetail = activeDetailStep === "商品装箱";
  const showDeliveryDetail = activeDetailStep === "配送服务";

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
          <SelectProductsDetailBody
            record={record}
            onEdit={onEdit}
            canEdit={canEditCurrentStep}
            canGoNext={canGoNextStep}
            onNext={() => onNextStep(record, activeDetailStep)}
          />
        ) : showPackingDetail ? (
          <PackingDetailBody
            record={record}
            completed={forceCompletedDetail}
            canGoPrevious={canGoPreviousStep}
            canGoNext={canGoNextStep}
            onPrevious={() => onPreviousStep(record, activeDetailStep)}
            onNext={() => onNextStep(record, activeDetailStep)}
          />
        ) : showDeliveryDetail ? (
          <DeliveryServiceDetailBody
            record={record}
            completed={forceCompletedDetail}
            canEdit={canEditCurrentStep}
            canGoPrevious={canGoPreviousStep}
            canGoNext={canGoNextStep}
            onEdit={onEdit}
            onPrevious={() => onPreviousStep(record, activeDetailStep)}
            onNext={() => onNextStep(record, activeDetailStep)}
          />
        ) : (
          <div className="mt-6 rounded-md border border-dashed border-border bg-bg-page/60 px-6 py-10 text-center">
            <div className="text-body font-medium text-text-primary">{activeDetailStep}</div>
            <p className="mx-auto mt-3 max-w-2xl text-small leading-relaxed text-text-muted">
              当前步骤详情页原型待后续补充，可先通过编辑进入对应步骤页面。
            </p>
            {canEditCurrentStep || canGoNextStep ? (
              <div className="mt-6 flex justify-center gap-3">
                {canGoNextStep ? (
                  <Button variant="primary" size="sm" onClick={() => onNextStep(record, activeDetailStep)}>
                    下一步
                  </Button>
                ) : null}
                {canEditCurrentStep ? (
                <Button variant="primary" size="sm" onClick={onEdit}>
                  编辑
                </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
