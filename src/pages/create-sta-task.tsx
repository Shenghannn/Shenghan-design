import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, ImageIcon, Pencil, ScrollText } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ImportLoadingState } from "../components/ui/import-dialog-section";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { Select, type SelectOption } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

const loadingMessageMap = {
  createInboundPlan: {
    title: "正在创建发货任务并提交到亚马逊，请稍候…",
    description: "系统正在调用 createInboundPlan 创建入库计划。",
  },
  generatePlacementOptions: {
    title: "正在向亚马逊申请分仓方案，请稍候…",
    description: "系统正在调用 generatePlacementOptions 生成分仓候选。",
  },
  confirmPlacementOption: {
    title: "正在确认您选中的分仓方案，请稍候…",
    description: "系统正在调用 confirmPlacementOption 提交申报。",
  },
  getInboundOperationStatus: {
    title: "正在查询亚马逊处理结果，请稍候…",
    description: "系统正在轮询 getInboundOperationStatus，请等待操作完成。",
  },
  listPlacementOptions: {
    title: "正在加载分仓方案与货件明细，请稍候…",
    description: "系统正在拉取 listPlacementOptions、getShipment、listShipmentItems。",
  },
  setPackingInformation: {
    title: "正在保存并提交装箱信息，请稍候…",
    description: "系统正在调用 setPackingInformation 提交装箱明细。",
  },
  getShipment: {
    title: "正在同步货件信息，请稍候…",
    description: "系统正在调用 getShipment 获取货件基础信息。",
  },
  listShipmentBoxes: {
    title: "正在同步箱规信息，请稍候…",
    description: "系统正在调用 listShipmentBoxes 获取箱子明细。",
  },
  getLabels: {
    title: "正在生成箱子标签，请稍候…",
    description: "系统正在调用 getLabels 获取箱子标签文件。",
  },
  cancelStaTask: {
    title: "正在取消当前 STA 任务，请稍候…",
    description: "系统正在调用取消 STA 任务接口，释放当前装箱流程。",
  },
  recreateStaTask: {
    title: "正在重新生成 STA 任务，请稍候…",
    description: "系统正在使用原发货计划重新生成 STA 任务。",
  },
  generateTransportationOptions: {
    title: "正在获取承运方式与费用选项，请稍候…",
    description: "系统正在调用 generateTransportationOptions 生成运输方案。",
  },
  confirmDeliveryWindowOptions: {
    title: "正在确认送达时间，请稍候…",
    description: "系统正在调用 confirmDeliveryWindowOptions 锁定送达时段。",
  },
  confirmTransportationOptions: {
    title: "正在确认承运人与配送方式，请稍候…",
    description: "系统正在调用 confirmTransportationOptions 提交配送服务。",
  },
} as const;

type LoadingMessageKey = keyof typeof loadingMessageMap;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function runPrototypeAsyncFlow(steps: LoadingMessageKey[], onStep: (step: LoadingMessageKey) => void) {
  for (const step of steps) {
    onStep(step);
    await delay(step === "getInboundOperationStatus" ? 900 : 1200);
  }
}

function formatStaTaskDefaultName(date = new Date()) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  hours %= 12;
  if (hours === 0) {
    hours = 12;
  }

  return `STA (${month}/${day}/${year} ${`${hours}`.padStart(2, "0")}:${minutes} ${period})`;
}

function resolveStaTaskName(taskName: string, _planNo: string) {
  const trimmed = taskName.trim();
  if (trimmed) {
    return trimmed;
  }

  return formatStaTaskDefaultName();
}

export type CreateStaTaskSource = {
  planId: string;
  planNo: string;
  store: string;
};

type CreateStaProductRow = {
  id: string;
  msku: string;
  fnsku: string;
  asin: string;
  productName: string;
  sku: string;
  plannedQty: number;
  declaredQty: number;
  prepProvider: string;
  labelType: string;
  validityPeriod: string;
};

type AddProductCandidate = Omit<CreateStaProductRow, "declaredQty" | "prepProvider" | "labelType" | "validityPeriod">;

type ShippingAddressOption = {
  id: string;
  name: string;
  detail: string;
};

const staWizardSteps = [
  "选择发货商品",
  "商品装箱",
  "配送服务",
  "箱子标签",
  "货件追踪",
] as const;

export type StaWizardStepName = (typeof staWizardSteps)[number];

export function getStaWizardStepIndex(step: StaWizardStepName) {
  const index = staWizardSteps.indexOf(step);
  return index >= 0 ? index : 0;
}

const staWizardStepDescriptions: Record<StaWizardStepName, string> = {
  选择发货商品: "维护 STA 基础信息、发货地址与申报商品，并完成分仓方案确认。",
  商品装箱: "按货件维护箱规、箱内商品与预处理信息，支持 WMS 回传装箱数据。",
  配送服务: "查看由其他单据回传的送达时段、发货日期与承运服务信息。",
  箱子标签: "查看箱子标签、卡板标签与装箱明细，不在当前步骤编辑。",
  货件追踪: "维护跟踪编号并查看货件在途、签收与异常状态。",
};

export type ConfirmedShipment = {
  shipmentId: string;
  fcCode: string;
  deliveryAddress: string;
  shipmentName?: string;
};

export type EditStaTaskContext = {
  staNo: string;
  planId?: string;
  planNo?: string;
  store: string;
  status: "草稿" | "进行中" | "已发货" | "已取消" | "异常";
  currentStep: StaWizardStepName;
  deliveryStatus?: "进行中" | "已完成";
  confirmedShipments?: ConfirmedShipment[];
  activeShipmentId?: string;
  planCreated?: boolean;
  taskName?: string;
  shippingAddress?: string;
  remark?: string;
  products?: Array<{
    id: string;
    msku: string;
    fnsku: string;
    asin: string;
    productName: string;
    sku: string;
    plannedQty: number;
    declaredQty: number;
    prepProvider: string;
    labelType: string;
    validityPeriod: string;
  }>;
};

export type StaDraftPayload = {
  staNo: string;
  store: string;
  taskName: string;
  shippingAddress: string;
  remark: string;
  skuCount: number;
  totalQty: number;
  products: EditStaTaskContext["products"];
  sourcePlanId?: string;
  sourcePlanNo?: string;
};

export type StaPlanCreatedPayload = StaDraftPayload & {
  inboundPlanId: string;
  placementFee?: string;
  creator?: string;
  createdAt?: string;
};

export type StaPlacementConfirmPayload = {
  staNo: string;
  store: string;
  taskName: string;
  shipments: ConfirmedShipment[];
  skuCount: number;
  totalQty: number;
  sourcePlanId?: string;
  sourcePlanNo?: string;
};

function validateStepOneForm(params: {
  shippingAddress: string;
  products: CreateStaProductRow[];
}) {
  if (!params.shippingAddress.trim()) {
    return "请选择发货地址";
  }

  for (const product of params.products) {
    if (!Number.isInteger(product.declaredQty) || product.declaredQty <= 0) {
      return `请填写 ${product.msku} 的申报量（正整数）`;
    }

    if (!product.prepProvider.trim() || !product.labelType.trim()) {
      return `请完善 ${product.msku} 的预处理提供方/标签类型`;
    }
  }

  return null;
}

const prepProviderOptions: SelectOption[] = [
  { label: "卖家", value: "seller" },
  { label: "亚马逊", value: "amazon" },
];

const labelTypeOptions: SelectOption[] = [
  { label: "卖家自己贴标签", value: "seller-label" },
  { label: "亚马逊贴标签", value: "amazon-label" },
];

const defaultProducts: CreateStaProductRow[] = [];

const addProductCandidates: AddProductCandidate[] = [
  {
    id: "cand-1",
    msku: "SYJN-FS23-00074046-003",
    fnsku: "X004UGWNP7",
    asin: "B0FRSLT3BF",
    productName: "燃油宝成品SP2113H",
    sku: "JN-FS23-00074046",
    plannedQty: 5,
  },
  {
    id: "cand-2",
    msku: "SYJN-FS23-00074042-002",
    fnsku: "X004UGWLN5",
    asin: "B0FRSLHZXS",
    productName: "燃油宝成品SP2113H",
    sku: "JN-FS23-00074042",
    plannedQty: 10,
  },
  {
    id: "cand-3",
    msku: "SYJN-FS23-00074050-001",
    fnsku: "X004UGWXYZ",
    asin: "B0FRSLTEST",
    productName: "燃油宝成品SP2115H",
    sku: "JN-FS23-00074050",
    plannedQty: 8,
  },
  {
    id: "cand-4",
    msku: "SYJN-FS23-00074055-004",
    fnsku: "X004UGWABC",
    asin: "B0FRSLDEMO",
    productName: "燃油宝成品SP2118H",
    sku: "JN-FS23-00074055",
    plannedQty: 12,
  },
  {
    id: "cand-5",
    msku: "SYJN-FS23-00074060-005",
    fnsku: "X004UGWDEF",
    asin: "B0FRSLSAMP",
    productName: "燃油宝成品SP2120H",
    sku: "JN-FS23-00074060",
    plannedQty: 6,
  },
];

const shippingAddressOptions: ShippingAddressOption[] = [
  {
    id: "addr-1",
    name: "深圳龙华发货仓",
    detail: "广东省深圳市龙华区民治街道民治大道168号 Shenghan 物流园 A 栋 1 层",
  },
  {
    id: "addr-2",
    name: "宁波前置仓",
    detail: "浙江省宁波市北仑区保税南区港城路88号 Shenghan 跨境仓",
  },
  {
    id: "addr-3",
    name: "上海集货仓",
    detail: "上海市浦东新区航头镇航都路33号 Shenghan 华东集货中心",
  },
];

type PlacementFeeDetail = {
  label: string;
  amount: string;
};

type PlacementShipmentRow = {
  id: string;
  shipmentNo: string;
  fcCode: string;
  deliveryAddress: string;
};

type PlacementOption = {
  id: string;
  label: string;
  totalFee: string;
  feeDetails: PlacementFeeDetail[];
  shipments: PlacementShipmentRow[];
};

const placementPreviewOptions: PlacementOption[] = [
  {
    id: "plan-a",
    label: "5个货件",
    totalFee: "$0",
    feeDetails: [
      { label: "入库配置费", amount: "0" },
      { label: "入库配置费", amount: "-" },
      { label: "履约折扣费", amount: "-" },
    ],
    shipments: [
      { id: "ship-a-1", shipmentNo: "FBA15LQGJ5LF", fcCode: "LBE1", deliveryAddress: "配送地址1XXXXX" },
      { id: "ship-a-2", shipmentNo: "FBA18T6Q4V2", fcCode: "LB1", deliveryAddress: "配送地址2XXXXX" },
      { id: "ship-a-3", shipmentNo: "FBA18T6Q4W9", fcCode: "TMBB", deliveryAddress: "配送地址3XXXXX" },
      { id: "ship-a-4", shipmentNo: "FBA18T6Q4X1", fcCode: "LAN2", deliveryAddress: "配送地址4XXXXX" },
      { id: "ship-a-5", shipmentNo: "FBA18T6Q4Y2", fcCode: "LAX9", deliveryAddress: "配送地址5XXXXX" },
    ],
  },
  {
    id: "plan-b",
    label: "3个货件",
    totalFee: "$0",
    feeDetails: [
      { label: "入库配置费", amount: "0" },
      { label: "入库配置费", amount: "-" },
      { label: "履约折扣费", amount: "-" },
    ],
    shipments: [
      { id: "ship-b-1", shipmentNo: "FBA19CHTHLKB", fcCode: "TMBB", deliveryAddress: "配送地址1XXXXX" },
      { id: "ship-b-2", shipmentNo: "FBA18T6Q4W9", fcCode: "LAN2", deliveryAddress: "配送地址2XXXXX" },
      { id: "ship-b-3", shipmentNo: "FBA18T6Q4X1", fcCode: "LBE1", deliveryAddress: "配送地址3XXXXX" },
    ],
  },
];

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";
const modalTableHeadCell = "whitespace-nowrap px-3 py-2.5 font-medium";

function StaWizardStepPlaceholder({ stepName }: { stepName: StaWizardStepName }) {
  return (
    <div className="mt-6 rounded-md border border-dashed border-border bg-bg-page/60 px-6 py-10 text-center">
      <div className="text-body font-medium text-text-primary">{stepName}</div>
      <p className="mx-auto mt-3 max-w-2xl text-small leading-relaxed text-text-muted">
        {staWizardStepDescriptions[stepName]}
      </p>
      <p className="mt-4 text-small text-text-muted">该步骤详细原型页面待后续补充，当前已定位到 PRD 定义的当前步骤。</p>
    </div>
  );
}

function StaProductPackingStep({
  staNo,
  shipments,
  products,
  activeShipmentId,
  onActiveShipmentChange,
}: {
  staNo: string;
  shipments: ConfirmedShipment[];
  products: CreateStaProductRow[];
  activeShipmentId: string;
  onActiveShipmentChange: (shipmentId: string) => void;
}) {
  const activeShipment =
    shipments.find((shipment) => shipment.shipmentId === activeShipmentId) ?? shipments[0];
  const packingRows = [
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
      dimensions: "51.00*15.00*9.00",
      volume: "0.08",
      totalWeight: "6.35",
      totalVolume: "0.08",
      qtyPerBox: 1,
    },
    {
      boxNo: 3,
      grossWeight: "5.23",
      dimensions: "51.00*15.00*9.00",
      volume: "0.05",
      totalWeight: "5.23",
      totalVolume: "0.05",
      qtyPerBox: 1,
    },
  ];
  const displayProducts = products.length > 0 ? products : [];
  const declaredTotal = displayProducts.reduce((sum, product) => sum + product.declaredQty, 0);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {shipments.map((shipment) => {
          const isActive = shipment.shipmentId === activeShipment?.shipmentId;
          return (
            <button
              key={shipment.shipmentId}
              type="button"
              className={`border-0 bg-transparent px-3 py-2 text-small ${
                isActive
                  ? "border-b-2 border-primary font-medium text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
              onClick={() => onActiveShipmentChange(shipment.shipmentId)}
            >
              {shipment.shipmentId}
            </button>
          );
        })}
      </div>

      {activeShipment ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-body font-medium text-text-primary">{activeShipment.shipmentId}</div>
            <div className="mt-1 text-small text-text-muted">
              {activeShipment.shipmentName ?? `FBA STA (${staNo})-${activeShipment.fcCode}`}
            </div>
          </div>
          <Button variant="secondary" size="sm">
            导出装箱清单
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-6">
        <span className="text-small text-text-secondary">是否混装</span>
        <label className="inline-flex items-center gap-2 text-body text-text-muted">
          <input type="radio" name="mixed-packing" disabled />
          <span>是</span>
        </label>
        <label className="inline-flex items-center gap-2 text-body text-text-primary">
          <input type="radio" name="mixed-packing" checked readOnly />
          <span>否</span>
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[1480px] border-collapse text-left text-small">
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
              <th className={tableHeadCell}>中文品名</th>
              <th className={tableHeadCell}>SKU</th>
              <th className={tableHeadCell}>预处理提供方/标签类型</th>
              <th className={tableHeadCell}>单箱数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {packingRows.map((row, index) => {
              const product = displayProducts[index % Math.max(displayProducts.length, 1)];
              return (
                <tr key={row.boxNo}>
                  <td className="whitespace-nowrap px-3 py-3">{row.boxNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{row.grossWeight}</td>
                  <td className="whitespace-nowrap px-3 py-3">{row.dimensions}</td>
                  <td className="whitespace-nowrap px-3 py-3">{row.volume}</td>
                  <td className="whitespace-nowrap px-3 py-3">{row.totalWeight}</td>
                  <td className="whitespace-nowrap px-3 py-3">{row.totalVolume}</td>
                  <td className="px-3 py-3">
                    {product ? <ProductImagePlaceholder /> : <span className="text-text-muted">-</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{product?.msku ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product?.fnsku ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product?.asin ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product?.productName ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product?.sku ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {product ? (
                      <>
                        <div>{product.prepProvider}</div>
                        <div className="text-text-muted">{product.labelType}</div>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{row.qtyPerBox}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap justify-end gap-x-8 gap-y-2 text-small text-text-secondary">
        <span>
          申报量：<strong className="text-text-primary">{declaredTotal}</strong>（0）
        </span>
        <span>
          总箱数：<strong className="text-text-primary">{packingRows.length}箱</strong>
        </span>
        <span>
          总重量：<strong className="text-text-primary">23.43kg</strong>
        </span>
        <span>
          总体积：<strong className="text-text-primary">0.15CBM(m³)</strong>
        </span>
      </div>
    </div>
  );
}

function StaDeliveryServiceStep({
  shipments,
  completed,
}: {
  shipments: ConfirmedShipment[];
  completed: boolean;
}) {
  const displayShipments =
    shipments.length > 0
      ? shipments
      : [
          {
            shipmentId: "FBA19C34CPYD",
            fcCode: "YYZ7",
            deliveryAddress: "YYZ7-12724 Coleraine Drive, L7E 4L8, Bolton, ON, CA",
            shipmentName: "FBA STA (04/23/2026 08:24)-YYZ7",
          },
        ];

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      {displayShipments.map((shipment) => (
        <div key={shipment.shipmentId} className="rounded-md border border-border bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="text-section-title font-section-title text-text-primary">
              {shipment.shipmentName ?? `FBA STA (04/23/2026 08:24)-${shipment.fcCode}`}
            </div>
            <div className="flex items-center gap-5">
              <span className="rounded-sm border border-primary px-2 py-1 text-caption text-primary">SHIPPED</span>
              <button type="button" className="border-0 bg-transparent text-small text-primary hover:underline">
                查看装箱明细&gt;&gt;
              </button>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-4 text-small md:grid-cols-[92px_1fr]">
            <span className="text-text-muted">货件单号</span>
            <span>{shipment.shipmentId}</span>
            <span className="text-text-muted">Reference ID</span>
            <span>2D4WOETI</span>
            <span className="text-text-muted">物流中心编码</span>
            <span>{shipment.fcCode}</span>
            <span className="text-text-muted">发货地址</span>
            <span className="flex items-start justify-between gap-3">
              <span>
                Yi Wu Nan Sheng Dian Zi Shang Wu You Xian Gong Si, houzhai街道 tongtailu140hao,
                yiwuweilaikejiyuan2qi 1haolou702, jinhuashi, zhejiangsheng, 322000, CN, 17706790973
              </span>
              <Pencil aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
            </span>
            <span className="text-text-muted">配送地址</span>
            <span>{shipment.deliveryAddress}</span>
          </div>

          <div className="mt-5 grid max-w-[280px] grid-cols-3 gap-8 text-small">
            <DetailMini label="MSKU" value="123" />
            <DetailMini label="申报量" value="1021" />
            <DetailMini label="箱数" value="119" />
          </div>

          <div className="mt-6 flex items-center border-l-4 border-primary pl-3 font-medium text-text-primary">送达时段</div>
          <div className="mt-4 grid gap-y-2 text-small md:grid-cols-[92px_1fr]">
            <span className="text-text-muted">
              <span className="text-danger">*</span>
              送达时段
            </span>
            <span>
              {completed ? "2026-06-07 ~ 2026-06-14" : ""}
              {completed ? (
                <span className="ml-2 text-warning">（2026-06-07之前可在【货件追踪】步骤重新编辑）</span>
              ) : null}
            </span>
          </div>

          <div className="mt-6 flex items-center border-l-4 border-primary pl-3 font-medium text-text-primary">配送服务</div>
          <div className="mt-4 grid gap-x-8 gap-y-5 text-small md:grid-cols-[92px_1fr_92px_1fr]">
            <span className="text-text-muted">
              <span className="text-danger">*</span>
              发货日期
            </span>
            <span>{completed ? "2026-04-29" : ""}</span>
            <span className="text-text-muted">
              <span className="text-danger">*</span>
              配送模式
            </span>
            <span>{completed ? "其他承运人" : ""}</span>
            <span className="text-text-muted">
              <span className="text-danger">*</span>
              承运人类型
            </span>
            <span>{completed ? "小包裹快递(SPD)" : ""}</span>
            <span className="text-text-muted">运输方式</span>
            <span>{completed ? "海运" : ""}</span>
            <span className="text-text-muted">
              <span className="text-danger">*</span>
              承运人
            </span>
            <span>{completed ? "其他" : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StaBoxLabelDetailStep({ shipments }: { shipments: ConfirmedShipment[] }) {
  const displayShipments =
    shipments.length > 0
      ? shipments
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

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      {displayShipments.map((shipment) => (
        <div key={shipment.shipmentId} className="rounded-md border border-border bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="text-section-title font-section-title text-text-primary">
              {shipment.shipmentName ?? `FBA STA (04/23/2026 08:24)-${shipment.fcCode}`}
            </div>
            <div className="flex items-center gap-5">
              <span className="rounded-sm border border-primary px-2 py-1 text-caption text-primary">SHIPPED</span>
              <button type="button" className="border-0 bg-transparent text-small text-primary hover:underline">
                查看装箱明细&gt;&gt;
              </button>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-3 text-small md:grid-cols-[92px_1fr]">
            <span className="text-text-muted">货件单号</span>
            <span>{shipment.shipmentId}</span>
            <span className="text-text-muted">Reference ID</span>
            <span>2D4WOETI</span>
            <span className="text-text-muted">物流中心编码</span>
            <span>{shipment.fcCode}</span>
            <span className="text-text-muted">配送地址</span>
            <span>{shipment.deliveryAddress}</span>
          </div>

          <div className="mt-5 border-l-4 border-primary pl-3 font-medium text-text-primary">配送服务</div>
          <div className="mt-3 grid gap-x-8 gap-y-3 text-small md:grid-cols-[92px_1fr_92px_1fr]">
            <span className="text-text-muted">
              <span className="text-danger">*</span>
              发货日期
            </span>
            <span>2026-04-29</span>
            <span className="text-text-muted">
              <span className="text-danger">*</span>
              配送模式
            </span>
            <span>其他承运人</span>
            <span className="text-text-muted">承运人类型</span>
            <span>汽运零担(LTL)</span>
            <span className="text-text-muted">运输方式</span>
            <span>海运</span>
            <span className="text-text-muted">
              <span className="text-danger">*</span>
              承运人
            </span>
            <span>其他</span>
          </div>

          <div className="mt-5 border-l-4 border-primary pl-3 font-medium text-text-primary">打印标签</div>
          <div className="mt-3 space-y-4 text-small">
            <div className="grid items-center gap-3 md:grid-cols-[92px_1fr]">
              <span className="text-text-muted">箱子标签</span>
              <span>热敏纸(100 x 100 mm)</span>
            </div>
            <label className="ml-[104px] flex items-start gap-2 text-text-primary">
              <input type="checkbox" readOnly className="mt-0.5" />
              <span>
                隐藏SHIP
                <br />
                FROM公司名
              </span>
            </label>
            <div className="grid items-center gap-3 md:grid-cols-[92px_1fr]">
              <span className="text-text-muted">卡板标签</span>
              <span>热敏纸(100 x 100 mm)</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailMini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-3 text-small text-text-secondary">{label}</div>
      <div className="text-body text-text-primary">{value}</div>
    </div>
  );
}

function StaWizardStepBar({
  currentStepIndex,
  onStepClick,
}: {
  currentStepIndex: number;
  onStepClick?: (step: StaWizardStepName, index: number) => void;
}) {
  return (
    <div className="flex overflow-hidden border-b border-border pb-6">
      {staWizardSteps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        const isUnreached = index > currentStepIndex;
        const isClickable = Boolean(onStepClick) && !isUnreached;
        const iconText = isCompleted ? "✓" : stepNumber;

        return (
          <button
            key={label}
            type="button"
            disabled={!isClickable}
            onClick={() => onStepClick?.(label, index)}
            className={`relative -ml-4 flex h-9 min-w-0 flex-1 items-center justify-center gap-2 border-0 px-5 pl-8 text-small first:ml-0 first:pl-5 ${
              isClickable ? "cursor-pointer hover:brightness-[0.98]" : "cursor-not-allowed"
            } ${
                isActive
                  ? "bg-primary font-medium text-white"
                  : isCompleted
                    ? "bg-primary-subtle text-primary"
                    : "bg-[#F3F4F6] text-[#9CA3AF]"
            }`}
            style={{ clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%, 18px 50%)" }}
          >
            <span
              className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none ${
                isActive
                  ? "bg-white text-primary"
                  : isCompleted
                    ? "bg-primary text-white"
                    : "border border-[#9CA3AF] bg-white text-[#9CA3AF]"
              }`}
            >
              {iconText}
            </span>
            <span className="truncate whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ProductImagePlaceholder() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-bg-subtle text-text-muted">
      <ImageIcon aria-hidden="true" className="h-4 w-4" />
    </div>
  );
}

function FormFieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="field-label block">
      {children}
      {required ? <span className="text-danger">*</span> : null}
    </label>
  );
}

function ModalFooter({
  onCancel,
  onConfirm,
  confirmLabel = "确定",
  confirmDisabled = false,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
      <Button variant="secondary" size="sm" onClick={onCancel}>
        取消
      </Button>
      <Button variant="primary" size="sm" onClick={onConfirm} disabled={confirmDisabled}>
        {confirmLabel}
      </Button>
    </div>
  );
}

function FeeBreakdownCell({
  totalFee,
  feeDetails,
  open,
  onToggle,
}: {
  totalFee: string;
  feeDetails: PlacementFeeDetail[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 border-0 bg-transparent text-body text-text-primary"
        onClick={onToggle}
      >
        <span>{totalFee}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-20 min-w-[220px] rounded-sm border border-border bg-white shadow-md">
          <table className="w-full border-collapse text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">费用项</th>
                <th className="px-3 py-2 text-left font-medium">金额</th>
              </tr>
            </thead>
            <tbody>
              {feeDetails.map((item, index) => (
                <tr key={`${item.label}-${index}`} className="border-t border-border">
                  <td className="px-3 py-2 text-text-primary">{item.label}</td>
                  <td className="px-3 py-2 text-text-primary">{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function TableSelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate, checked]);

  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} />;
}

function getOptionLabel(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? "";
}

type CreateStaTaskPageProps = {
  source?: CreateStaTaskSource;
  editContext?: EditStaTaskContext;
  onCancel: () => void;
  onSaveDraft?: (payload: StaDraftPayload) => void;
  onPlanCreated?: (payload: StaPlanCreatedPayload) => void;
  onConfirmPlacement?: (payload: StaPlacementConfirmPayload) => void;
  onSubmitPacking?: (staNo: string) => void;
  onRestartStaTask?: (source: CreateStaTaskSource) => void;
  onCompleteDelivery?: (staNo: string) => void;
  onOpenPreviousStepDetail?: (staNo: string, previousStep: StaWizardStepName) => void;
  onValidationError?: (message: string) => void;
};

export function CreateStaTaskPage({
  source,
  editContext,
  onCancel,
  onSaveDraft,
  onPlanCreated,
  onConfirmPlacement,
  onSubmitPacking,
  onRestartStaTask,
  onCompleteDelivery,
  onOpenPreviousStepDetail,
  onValidationError,
}: CreateStaTaskPageProps) {
  const isEditMode = Boolean(editContext);
  const initialStepIndex = isEditMode
    ? getStaWizardStepIndex(editContext!.currentStep)
    : 0;
  const storeValue = isEditMode ? editContext!.store : source?.store ?? "";

  const [wizardStepIndex, setWizardStepIndex] = useState(initialStepIndex);
  const [confirmedShipments, setConfirmedShipments] = useState<ConfirmedShipment[]>(
    editContext?.confirmedShipments ?? [],
  );
  const [activeShipmentId, setActiveShipmentId] = useState(
    editContext?.activeShipmentId ?? editContext?.confirmedShipments?.[0]?.shipmentId ?? "",
  );

  const [taskName, setTaskName] = useState(editContext?.taskName ?? "");
  const [shippingAddress, setShippingAddress] = useState(editContext?.shippingAddress ?? "");
  const [remark, setRemark] = useState(editContext?.remark ?? "");
  const [products, setProducts] = useState<CreateStaProductRow[]>(
    editContext?.products?.map((product) => ({ ...product })) ?? defaultProducts,
  );
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [prepEditOpen, setPrepEditOpen] = useState(false);
  const [prepEditTargetIds, setPrepEditTargetIds] = useState<string[]>([]);
  const [prepDraftProvider, setPrepDraftProvider] = useState("");
  const [prepDraftLabelType, setPrepDraftLabelType] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [placementPreviewOpen, setPlacementPreviewOpen] = useState(false);
  const [selectedPlacementId, setSelectedPlacementId] = useState("");
  const [openFeePlanId, setOpenFeePlanId] = useState<string | null>(null);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [skuDetailOpen, setSkuDetailOpen] = useState(false);
  const [skuDetailShipmentNo, setSkuDetailShipmentNo] = useState("");
  const [staCreated, setStaCreated] = useState(editContext?.planCreated ?? false);
  const [resolvedStaTaskName, setResolvedStaTaskName] = useState(editContext?.staNo ?? "");
  const [loadingStep, setLoadingStep] = useState<LoadingMessageKey | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isStepOnePlanCreated =
    wizardStepIndex === 0 && (staCreated || (isEditMode && editContext?.planCreated === true));
  const showPostCreateActions = isStepOnePlanCreated;
  const stepOneReadOnly = showPostCreateActions;

  function buildStaNo() {
    return resolveStaTaskName(taskName, source?.planNo ?? editContext?.staNo ?? "STA-DRAFT");
  }

  function buildDraftPayload(): StaDraftPayload {
    return {
      staNo: buildStaNo(),
      store: storeValue,
      taskName: taskName.trim(),
      shippingAddress,
      remark,
      skuCount: products.length,
      totalQty: products.reduce((sum, product) => sum + product.declaredQty, 0),
      products: products.map((product) => ({ ...product })),
      sourcePlanId: source?.planId ?? editContext?.planId,
      sourcePlanNo: source?.planNo ?? editContext?.planNo,
    };
  }

  function runStepOneValidation() {
    const message = validateStepOneForm({ shippingAddress, products });
    if (message) {
      onValidationError?.(message);
      return false;
    }

    return true;
  }

  function handleSaveDraft() {
    if (actionLoading || !runStepOneValidation()) {
      return;
    }

    onSaveDraft?.(buildDraftPayload());
  }

  function openPreviousStepDetail() {
    const previousStep = staWizardSteps[wizardStepIndex - 1];
    if (!previousStep) {
      return;
    }

    onOpenPreviousStepDetail?.(editContext?.staNo ?? (resolvedStaTaskName || buildStaNo()), previousStep);
  }

  function handleStepBarClick(step: StaWizardStepName, index: number) {
    if (index === wizardStepIndex) {
      return;
    }

    if (index < wizardStepIndex) {
      onOpenPreviousStepDetail?.(editContext?.staNo ?? (resolvedStaTaskName || buildStaNo()), step);
    }
  }

  async function handleSubmitPacking() {
    if (actionLoading) {
      return;
    }

    setActionLoading(true);
    try {
      await runPrototypeAsyncFlow(
        ["setPackingInformation", "getInboundOperationStatus", "getShipment", "listShipmentBoxes", "getLabels"],
        setLoadingStep,
      );
      const staNo = editContext?.staNo ?? (resolvedStaTaskName || buildStaNo());
      onSubmitPacking?.(staNo);
      setWizardStepIndex(2);
    } finally {
      setLoadingStep(null);
      setActionLoading(false);
    }
  }

  async function confirmRestartStaTask() {
    if (actionLoading) {
      return;
    }

    setRestartConfirmOpen(false);
    setActionLoading(true);
    try {
      await runPrototypeAsyncFlow(["cancelStaTask", "getInboundOperationStatus", "recreateStaTask"], setLoadingStep);
      const restartSource: CreateStaTaskSource = {
        planId: source?.planId ?? editContext?.planId ?? "",
        planNo: source?.planNo ?? editContext?.planNo ?? editContext?.staNo ?? "STA-RESTART",
        store: storeValue,
      };
      if (onRestartStaTask && restartSource.planId) {
        onRestartStaTask(restartSource);
        return;
      }

      setWizardStepIndex(0);
      setConfirmedShipments([]);
      setActiveShipmentId("");
      setStaCreated(false);
      setResolvedStaTaskName("");
      setPlacementPreviewOpen(false);
    } finally {
      setLoadingStep(null);
      setActionLoading(false);
    }
  }

  async function handleCompleteDeliveryForDemo() {
    if (actionLoading) {
      return;
    }

    setActionLoading(true);
    try {
      await runPrototypeAsyncFlow(
        ["generateTransportationOptions", "getInboundOperationStatus", "confirmDeliveryWindowOptions", "getInboundOperationStatus", "confirmTransportationOptions", "getInboundOperationStatus"],
        setLoadingStep,
      );
      const staNo = editContext?.staNo ?? (resolvedStaTaskName || buildStaNo());
      onCompleteDelivery?.(staNo);
      setWizardStepIndex(3);
    } finally {
      setLoadingStep(null);
      setActionLoading(false);
    }
  }

  const existingMskus = useMemo(() => new Set(products.map((product) => product.msku)), [products]);
  const availableCandidates = useMemo(
    () => addProductCandidates.filter((candidate) => !existingMskus.has(candidate.msku)),
    [existingMskus],
  );
  const allCandidatesSelected =
    availableCandidates.length > 0 &&
    availableCandidates.every((candidate) => selectedCandidateIds.includes(candidate.id));
  const partiallyCandidatesSelected =
    selectedCandidateIds.length > 0 && !allCandidatesSelected;

  function updateDeclaredQty(id: string, value: string) {
    const nextValue = value === "" ? 0 : Number.parseInt(value, 10);
    setProducts((current) =>
      current.map((item) =>
        item.id === id ? { ...item, declaredQty: Number.isNaN(nextValue) ? 0 : nextValue } : item,
      ),
    );
  }

  function updateValidityPeriod(id: string, value: string) {
    setProducts((current) =>
      current.map((item) => (item.id === id ? { ...item, validityPeriod: value } : item)),
    );
  }

  function removeProduct(id: string) {
    setProducts((current) => current.filter((item) => item.id !== id));
  }

  function openAddProductModal() {
    setSelectedCandidateIds([]);
    setAddProductOpen(true);
  }

  function toggleCandidateSelection(id: string) {
    setSelectedCandidateIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAllCandidates() {
    if (allCandidatesSelected) {
      setSelectedCandidateIds([]);
      return;
    }

    setSelectedCandidateIds(availableCandidates.map((candidate) => candidate.id));
  }

  function confirmAddProducts() {
    const selectedCandidates = addProductCandidates.filter((candidate) =>
      selectedCandidateIds.includes(candidate.id),
    );

    setProducts((current) => [
      ...current,
      ...selectedCandidates.map((candidate) => ({
        ...candidate,
        id: `line-${Date.now()}-${candidate.id}`,
        declaredQty: candidate.plannedQty,
        prepProvider: "卖家",
        labelType: "卖家自己贴标签",
        validityPeriod: "",
      })),
    ]);
    setAddProductOpen(false);
    setSelectedCandidateIds([]);
  }

  function openPrepEditModal(targetIds: string[]) {
    const firstTarget = products.find((product) => targetIds.includes(product.id));
    setPrepEditTargetIds(targetIds);
    setPrepDraftProvider(
      prepProviderOptions.find((option) => option.label === firstTarget?.prepProvider)?.value ?? "",
    );
    setPrepDraftLabelType(
      labelTypeOptions.find((option) => option.label === firstTarget?.labelType)?.value ?? "",
    );
    setPrepEditOpen(true);
  }

  function confirmPrepEdit() {
    const providerLabel = getOptionLabel(prepProviderOptions, prepDraftProvider);
    const labelTypeLabel = getOptionLabel(labelTypeOptions, prepDraftLabelType);

    setProducts((current) =>
      current.map((product) =>
        prepEditTargetIds.includes(product.id)
          ? {
              ...product,
              prepProvider: providerLabel || product.prepProvider,
              labelType: labelTypeLabel || product.labelType,
            }
          : product,
      ),
    );
    setPrepEditOpen(false);
    setPrepEditTargetIds([]);
  }

  function selectShippingAddress(address: ShippingAddressOption) {
    setShippingAddress(`${address.name}｜${address.detail}`);
    setAddressOpen(false);
  }

  function openPlacementPreviewModal() {
    setSelectedPlacementId("");
    setOpenFeePlanId(null);
    setPlacementPreviewOpen(true);
  }

  async function loadPlacementPreview() {
    if (actionLoading) {
      return;
    }

    setActionLoading(true);
    try {
      await runPrototypeAsyncFlow(["listPlacementOptions"], setLoadingStep);
      openPlacementPreviewModal();
    } finally {
      setLoadingStep(null);
      setActionLoading(false);
    }
  }

  async function regeneratePlacementOptions() {
    if (actionLoading) {
      return;
    }

    setActionLoading(true);
    try {
      await runPrototypeAsyncFlow(
        ["generatePlacementOptions", "getInboundOperationStatus", "listPlacementOptions"],
        setLoadingStep,
      );
      openPlacementPreviewModal();
    } finally {
      setLoadingStep(null);
      setActionLoading(false);
    }
  }

  async function handleCreateStaTask() {
    if (actionLoading || !runStepOneValidation()) {
      return;
    }

    setActionLoading(true);
    try {
      await runPrototypeAsyncFlow(
        ["createInboundPlan", "getInboundOperationStatus", "generatePlacementOptions", "getInboundOperationStatus"],
        setLoadingStep,
      );
      const staNo = buildStaNo();
      setResolvedStaTaskName(staNo);
      setStaCreated(true);
      onPlanCreated?.({
        ...buildDraftPayload(),
        staNo,
        inboundPlanId: `wfcd${Date.now().toString(36)}-2108-44f7-8b11-ae27f925b530`,
        placementFee: "USD10",
        creator: "张三",
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      });
      await runPrototypeAsyncFlow(["listPlacementOptions"], setLoadingStep);
      openPlacementPreviewModal();
    } finally {
      setLoadingStep(null);
      setActionLoading(false);
    }
  }

  async function handleConfirmPlacement() {
    if (!selectedPlacementId || actionLoading) {
      return;
    }

    const selectedOption = placementPreviewOptions.find((option) => option.id === selectedPlacementId);
    if (!selectedOption) {
      return;
    }

    setActionLoading(true);
    try {
      await runPrototypeAsyncFlow(
        ["confirmPlacementOption", "getInboundOperationStatus"],
        setLoadingStep,
      );

      const nextShipments: ConfirmedShipment[] = selectedOption.shipments.map((shipment) => ({
        shipmentId: shipment.shipmentNo,
        fcCode: shipment.fcCode,
        deliveryAddress: shipment.deliveryAddress,
        shipmentName: `FBA STA (${buildStaNo()})-${shipment.fcCode}`,
      }));

      const staNo = resolvedStaTaskName || buildStaNo();
      onConfirmPlacement?.({
        staNo,
        store: storeValue,
        taskName: taskName.trim(),
        shipments: nextShipments,
        skuCount: products.length,
        totalQty: products.reduce((sum, product) => sum + product.declaredQty, 0),
        sourcePlanId: source?.planId ?? editContext?.planId,
        sourcePlanNo: source?.planNo ?? editContext?.planNo,
      });

      setConfirmedShipments(nextShipments);
      setActiveShipmentId(nextShipments[0]?.shipmentId ?? "");
      setWizardStepIndex(1);
      setPlacementPreviewOpen(false);
      setOpenFeePlanId(null);
    } finally {
      setLoadingStep(null);
      setActionLoading(false);
    }
  }

  function openSkuDetail(shipmentNo: string) {
    setSkuDetailShipmentNo(shipmentNo);
    setSkuDetailOpen(true);
  }

  const skuDetailTotalQty = useMemo(
    () => products.reduce((sum, product) => sum + product.declaredQty, 0),
    [products],
  );

  const prepEditTitle =
    prepEditTargetIds.length > 1 ? "批量编辑预处理提供方/标签类型" : "编辑预处理提供方/标签类型";
  const deliveryStepCompleted = editContext?.deliveryStatus === "已完成";

  const wizardFooter = (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6">
      {wizardStepIndex > 0 ? (
        <Button variant="secondary" size="sm" onClick={openPreviousStepDetail} disabled={actionLoading}>
          上一步
        </Button>
      ) : null}
      {wizardStepIndex === 1 ? (
        <>
          <Button variant="secondary" size="sm" onClick={() => setRestartConfirmOpen(true)} disabled={actionLoading}>
            重新开始
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmitPacking} disabled={actionLoading}>
            提交装箱并继续
          </Button>
        </>
      ) : wizardStepIndex === 2 ? (
        deliveryStepCompleted ? (
          <Button variant="primary" size="sm" onClick={() => setWizardStepIndex(3)} disabled={actionLoading}>
            下一步
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={handleCompleteDeliveryForDemo} disabled={actionLoading}>
            手动完成配送服务
          </Button>
        )
      ) : wizardStepIndex === 3 ? (
        <Button variant="primary" size="sm" onClick={() => setWizardStepIndex(4)} disabled={actionLoading}>
          下一步
        </Button>
      ) : wizardStepIndex === 0 ? (
        <>
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={actionLoading}>
          取消
        </Button>
        {showPostCreateActions ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={actionLoading}
              onClick={regeneratePlacementOptions}
            >
              重新分仓
            </Button>
            <Button variant="primary" size="sm" disabled={actionLoading} onClick={loadPlacementPreview}>
              分仓预览
            </Button>
          </>
        ) : wizardStepIndex === 0 ? (
          <>
            <Button variant="secondary" size="sm" disabled={actionLoading} onClick={handleSaveDraft}>
              保存草稿
            </Button>
            <Button variant="primary" size="sm" disabled={actionLoading} onClick={handleCreateStaTask}>
              创建
            </Button>
          </>
        ) : null}
        </>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-end gap-4">
        <Button variant="secondary" size="sm">
          <ScrollText aria-hidden="true" className="h-4 w-4" />
          操作日志
        </Button>
      </div>

      <Card>
        <StaWizardStepBar currentStepIndex={wizardStepIndex} onStepClick={handleStepBarClick} />

        {wizardStepIndex === 0 ? (
          <>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <FormFieldLabel required>店铺</FormFieldLabel>
            <Input
              value={storeValue}
              disabled
              className="cursor-not-allowed bg-bg-subtle text-text-secondary"
            />
          </div>
          <div>
            <FormFieldLabel>STA任务名称</FormFieldLabel>
            <Input
              value={taskName}
              placeholder="请输入STA任务名称"
              disabled={stepOneReadOnly}
              readOnly={stepOneReadOnly}
              onChange={(event) => setTaskName(event.target.value)}
              className={stepOneReadOnly ? "cursor-not-allowed bg-bg-subtle text-text-secondary" : undefined}
            />
          </div>
          <div className="hidden md:block" aria-hidden="true" />
          <div className="md:col-span-3">
            <FormFieldLabel required>分仓方式</FormFieldLabel>
            <div className="flex flex-wrap items-center gap-6">
              <label className="inline-flex cursor-not-allowed items-center gap-2 text-body text-text-muted opacity-60">
                <input type="radio" name="warehouse-split-mode" disabled />
                <span>先装箱再分仓</span>
              </label>
              <label className="inline-flex items-center gap-2 text-body text-text-primary">
                <input type="radio" name="warehouse-split-mode" checked readOnly />
                <span>先分仓再装箱</span>
              </label>
            </div>
          </div>
          <div className="md:col-span-2">
            <FormFieldLabel required>发货地址</FormFieldLabel>
            <div className="flex items-center gap-3">
              <Input
                value={shippingAddress}
                placeholder="请选择发货地址"
                readOnly
                className={`min-w-0 flex-1 ${stepOneReadOnly ? "cursor-not-allowed bg-bg-subtle text-text-secondary" : "bg-white"}`}
              />
              {stepOneReadOnly ? null : (
              <button
                type="button"
                className="shrink-0 border-0 bg-transparent text-small text-primary hover:underline"
                onClick={() => setAddressOpen(true)}
              >
                选择发货地址
              </button>
              )}
            </div>
          </div>
          <div className="md:col-span-3">
            <FormFieldLabel>备注</FormFieldLabel>
            <Textarea
              value={remark}
              placeholder="请输入内容"
              rows={3}
              disabled={stepOneReadOnly}
              readOnly={stepOneReadOnly}
              onChange={(event) => setRemark(event.target.value)}
              className={stepOneReadOnly ? "cursor-not-allowed bg-bg-subtle text-text-secondary" : undefined}
            />
          </div>
        </div>

        {stepOneReadOnly ? null : (
        <div className="mt-6">
          <Button variant="secondary" size="sm" onClick={openAddProductModal}>
            添加商品
          </Button>
        </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-md border border-border">
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
                <th className={tableHeadCell}>
                  <div className="flex items-center gap-2">
                    <span>预处理提供方/标签类型</span>
                    {stepOneReadOnly ? null : (
                    <button
                      type="button"
                      className="border-0 bg-transparent text-primary hover:underline"
                      onClick={() => openPrepEditModal(products.map((product) => product.id))}
                    >
                      批量
                    </button>
                    )}
                  </div>
                </th>
                <th className={tableHeadCell}>
                  <span className="text-danger">*</span>
                  申报量
                </th>
                <th className={tableHeadCell}>有效期</th>
                {stepOneReadOnly ? null : <th className={tableHeadCell}>操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={stepOneReadOnly ? 11 : 12} className="px-3 py-10 text-center text-text-muted">
                    {stepOneReadOnly ? "暂无商品明细" : "暂无商品，可点击「添加商品」维护申报明细"}
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
                    <div className="flex items-center gap-2">
                      <div>
                        <div>{product.prepProvider}</div>
                        <div className="text-text-muted">{product.labelType}</div>
                      </div>
                      {stepOneReadOnly ? null : (
                      <button
                        type="button"
                        aria-label="编辑预处理提供方/标签类型"
                        className="inline-flex border-0 bg-transparent p-0 text-text-muted hover:text-primary"
                        onClick={() => openPrepEditModal([product.id])}
                      >
                        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {stepOneReadOnly ? (
                      product.declaredQty
                    ) : (
                    <Input
                      type="number"
                      min={0}
                      value={product.declaredQty}
                      className="w-[88px]"
                      onChange={(event) => updateDeclaredQty(product.id, event.target.value)}
                    />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {stepOneReadOnly ? (
                      product.validityPeriod || "-"
                    ) : (
                    <Input
                      type="date"
                      value={product.validityPeriod}
                      className="w-[148px]"
                      onChange={(event) => updateValidityPeriod(product.id, event.target.value)}
                    />
                    )}
                  </td>
                  {stepOneReadOnly ? null : (
                  <td className="whitespace-nowrap px-3 py-3">
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="border-0 bg-transparent text-small text-primary hover:underline"
                    >
                      移除
                    </button>
                  </td>
                  )}
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

            {wizardFooter}
          </>
        ) : wizardStepIndex === 1 && confirmedShipments.length > 0 ? (
          <>
            <StaProductPackingStep
              staNo={resolvedStaTaskName || editContext?.staNo || buildStaNo()}
              shipments={confirmedShipments}
              products={products}
              activeShipmentId={activeShipmentId || confirmedShipments[0].shipmentId}
              onActiveShipmentChange={setActiveShipmentId}
            />
            {wizardFooter}
          </>
        ) : wizardStepIndex === 2 ? (
          <>
            <StaDeliveryServiceStep shipments={confirmedShipments} completed={deliveryStepCompleted} />
            {wizardFooter}
          </>
        ) : wizardStepIndex === 3 ? (
          <>
            <StaBoxLabelDetailStep shipments={confirmedShipments} />
            {wizardFooter}
          </>
        ) : (
          <>
            <StaWizardStepPlaceholder stepName={staWizardSteps[wizardStepIndex]} />
            {wizardFooter}
          </>
        )}
      </Card>

      <Modal open={addProductOpen} title="添加商品" widthClassName="max-w-[min(100%,960px)] w-full" onClose={() => setAddProductOpen(false)}>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[760px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={`w-10 ${modalTableHeadCell}`}>
                  <TableSelectAllCheckbox
                    checked={allCandidatesSelected}
                    indeterminate={partiallyCandidatesSelected}
                    onChange={toggleAllCandidates}
                  />
                </th>
                <th className={modalTableHeadCell}>图片</th>
                <th className={modalTableHeadCell}>MSKU</th>
                <th className={modalTableHeadCell}>FNSKU</th>
                <th className={modalTableHeadCell}>ASIN</th>
                <th className={modalTableHeadCell}>中文品名</th>
                <th className={modalTableHeadCell}>SKU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {availableCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-text-muted">
                    当前店铺下暂无可添加商品
                  </td>
                </tr>
              ) : (
                availableCandidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCandidateIds.includes(candidate.id)}
                        onChange={() => toggleCandidateSelection(candidate.id)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <ProductImagePlaceholder />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{candidate.msku}</td>
                    <td className="whitespace-nowrap px-3 py-3">{candidate.fnsku}</td>
                    <td className="whitespace-nowrap px-3 py-3">{candidate.asin}</td>
                    <td className="whitespace-nowrap px-3 py-3">{candidate.productName}</td>
                    <td className="whitespace-nowrap px-3 py-3">{candidate.sku}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ModalFooter
          onCancel={() => setAddProductOpen(false)}
          onConfirm={confirmAddProducts}
        />
      </Modal>

      <Modal
        open={prepEditOpen}
        title={prepEditTitle}
        widthClassName="max-w-[min(100%,520px)] w-full"
        onClose={() => setPrepEditOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <FormFieldLabel required>预处理提供方</FormFieldLabel>
            <Select
              value={prepDraftProvider}
              placeholder="请选择"
              options={prepProviderOptions}
              onValueChange={setPrepDraftProvider}
            />
          </div>
          <div>
            <FormFieldLabel required>标签类型</FormFieldLabel>
            <Select
              value={prepDraftLabelType}
              placeholder="请选择"
              options={labelTypeOptions}
              onValueChange={setPrepDraftLabelType}
            />
          </div>
        </div>
        <ModalFooter
          onCancel={() => setPrepEditOpen(false)}
          onConfirm={confirmPrepEdit}
        />
      </Modal>

      <Modal
        open={addressOpen}
        title="选择发货地址"
        widthClassName="max-w-[min(100%,760px)] w-full"
        onClose={() => setAddressOpen(false)}
      >
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={modalTableHeadCell}>操作</th>
                <th className={modalTableHeadCell}>地址名称</th>
                <th className={modalTableHeadCell}>详细发货地址</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {shippingAddressOptions.map((address) => (
                <tr key={address.id}>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button
                      type="button"
                      className="border-0 bg-transparent text-primary hover:underline"
                      onClick={() => selectShippingAddress(address)}
                    >
                      选择
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{address.name}</td>
                  <td className="px-3 py-3">{address.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal
        open={placementPreviewOpen}
        title="分仓预览"
        widthClassName="max-w-[min(100%,980px)] w-full"
        onClose={() => {
          if (actionLoading) {
            return;
          }
          setPlacementPreviewOpen(false);
          setOpenFeePlanId(null);
        }}
      >
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[860px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={`w-10 ${modalTableHeadCell}`} />
                <th className={modalTableHeadCell}>货件方案</th>
                <th className={modalTableHeadCell}>费用</th>
                <th className={modalTableHeadCell}>货件编号</th>
                <th className={modalTableHeadCell}>物流中心编码</th>
                <th className={modalTableHeadCell}>配送地址</th>
                <th className={modalTableHeadCell}>商品</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {placementPreviewOptions.map((option) =>
                option.shipments.map((shipment, shipmentIndex) => (
                  <tr key={shipment.id}>
                    {shipmentIndex === 0 ? (
                      <>
                        <td rowSpan={option.shipments.length} className="px-3 py-3 align-middle">
                          <input
                            type="radio"
                            name="placement-option"
                            checked={selectedPlacementId === option.id}
                            onChange={() => setSelectedPlacementId(option.id)}
                          />
                        </td>
                        <td rowSpan={option.shipments.length} className="whitespace-nowrap px-3 py-3 align-middle">
                          {option.label}
                        </td>
                        <td rowSpan={option.shipments.length} className="whitespace-nowrap px-3 py-3 align-middle">
                          <FeeBreakdownCell
                            totalFee={option.totalFee}
                            feeDetails={option.feeDetails}
                            open={openFeePlanId === option.id}
                            onToggle={() =>
                              setOpenFeePlanId((current) => (current === option.id ? null : option.id))
                            }
                          />
                        </td>
                      </>
                    ) : null}
                    <td className="whitespace-nowrap px-3 py-3">{shipment.shipmentNo}</td>
                    <td className="whitespace-nowrap px-3 py-3">{shipment.fcCode}</td>
                    <td className="whitespace-nowrap px-3 py-3">{shipment.deliveryAddress}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <button
                        type="button"
                        className="border-0 bg-transparent text-primary hover:underline"
                        onClick={() => openSkuDetail(shipment.shipmentNo)}
                      >
                        查看明细 &gt;&gt;
                      </button>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        <ModalFooter
          confirmLabel="申报"
          confirmDisabled={!selectedPlacementId || actionLoading}
          onCancel={() => {
            if (actionLoading) {
              return;
            }
            setPlacementPreviewOpen(false);
            setOpenFeePlanId(null);
          }}
          onConfirm={handleConfirmPlacement}
        />
      </Modal>

      <Modal
        open={loadingStep !== null}
        title="处理中"
        widthClassName="max-w-[min(100%,520px)] w-full"
        onClose={() => undefined}
      >
        {loadingStep ? (
          <ImportLoadingState
            title={loadingMessageMap[loadingStep].title}
            description={loadingMessageMap[loadingStep].description}
          />
        ) : null}
      </Modal>

      {restartConfirmOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/30">
          <div className="flex min-h-full items-center justify-center p-section">
            <div className="w-full max-w-[560px] rounded-md border border-border bg-white px-8 py-7 shadow-lg">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning text-white">
                  <AlertTriangle aria-hidden="true" className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[22px] font-semibold leading-tight text-text-primary">确定重新开始?</div>
                  <p className="mt-5 text-body leading-relaxed text-text-secondary">
                    确定后会取消当前任务，重新生成STA任务。
                  </p>
                  <div className="mt-10 flex justify-end gap-4">
                    <div className="min-w-[88px]">
                      <Button variant="secondary" size="sm" onClick={() => setRestartConfirmOpen(false)}>
                        取消
                      </Button>
                    </div>
                    <div className="min-w-[88px]">
                      <Button variant="primary" size="sm" onClick={confirmRestartStaTask}>
                        确定
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={skuDetailOpen}
        title="SKU明细"
        widthClassName="max-w-[min(100%,920px)] w-full"
        onClose={() => setSkuDetailOpen(false)}
      >
        {skuDetailShipmentNo ? (
          <p className="mb-4 text-small text-text-muted">货件编号：{skuDetailShipmentNo}</p>
        ) : null}
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[760px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={modalTableHeadCell}>图片</th>
                <th className={modalTableHeadCell}>MSKU</th>
                <th className={modalTableHeadCell}>FNSKU</th>
                <th className={modalTableHeadCell}>ASIN</th>
                <th className={modalTableHeadCell}>中文品名</th>
                <th className={modalTableHeadCell}>SKU</th>
                <th className={modalTableHeadCell}>申报量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-3 py-3">
                    <ProductImagePlaceholder />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{product.msku}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.fnsku}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.asin}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.productName}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.sku}</td>
                  <td className="whitespace-nowrap px-3 py-3">{product.declaredQty}</td>
                </tr>
              ))}
              <tr className="bg-bg-page/60 font-medium">
                <td className="px-3 py-3" colSpan={6}>
                  合计
                </td>
                <td className="whitespace-nowrap px-3 py-3">{skuDetailTotalQty}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
