import { Fragment, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronsDown, Ellipsis, ImageIcon, Search } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DateRangePicker } from "../components/ui/date-range-picker";
import type { FloatingAlertInput } from "../components/ui/floating-alert";
import { Modal } from "../components/ui/modal";
import { Select, type SelectOption } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

type StaTaskStatus = "草稿" | "进行中" | "已发货" | "已取消" | "异常";
export type StaWizardStep = "选择发货商品" | "商品装箱" | "配送服务" | "箱子标签" | "货件追踪";
type StaCurrentStep = StaWizardStep;
export type StaPackingStatus = "进行中" | "已完成";
export type StaDeliveryStatus = "进行中" | "已完成";

export type StaTaskProductLine = {
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

export type StaConfirmedShipment = {
  shipmentId: string;
  fcCode: string;
  deliveryAddress: string;
  shipmentName?: string;
};

export type StaTaskRecord = {
  id: string;
  planId?: string;
  planNo?: string;
  staNo: string;
  shipmentNo: string;
  skuCount: number;
  totalQty: number;
  marketplace: string;
  store: string;
  sourceWarehouse: string;
  destination: string;
  status: StaTaskStatus;
  currentStep: StaCurrentStep;
  updatedAt: string;
  taskName?: string;
  inboundPlanId?: string;
  shippingAddress?: string;
  remark?: string;
  creator?: string;
  createdAt?: string;
  placementFee?: string;
  planCreated?: boolean;
  packingStatus?: StaPackingStatus;
  deliveryStatus?: StaDeliveryStatus;
  products?: StaTaskProductLine[];
  confirmedShipments?: StaConfirmedShipment[];
};

type FbaShipmentStatusCode =
  | "UNCONFIRMED"
  | "WORKING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CHECKED_IN"
  | "RECEIVING"
  | "CLOSED"
  | "DELETED"
  | "CANCELLED"
  | "ABANDONED";

export type FbaShipmentProductLine = {
  id: string;
  msku: string;
  fnsku: string;
  asin: string;
  productName: string;
  sku: string;
  prepProvider: string;
  labelType: string;
  declaredQty: number;
  shippedQty: number;
  receivedQty: number;
};

export type FbaShipmentRecord = {
  id: string;
  shipmentId: string;
  staNo: string;
  store: string;
  planId?: string;
  planNo: string;
  mskuCount: number;
  totalQty: number;
  destinationFc: string;
  boxMode: string;
  shipmentStatus: FbaShipmentStatusCode;
  completionStatus: "进行中" | "已完成";
  currentStep: StaWizardStep;
  hasStaTask: boolean;
  updatedAt: string;
  referenceId?: string;
  marketplace?: string;
  shipmentName?: string;
  creator?: string;
  createdAt?: string;
  labelType?: string;
  shippingAddress?: string;
  remark?: string;
  transportType?: string;
  storeCode?: string;
  products?: FbaShipmentProductLine[];
};

const fbaShipmentStatusLabels: Record<FbaShipmentStatusCode, string> = {
  UNCONFIRMED: "未确认",
  WORKING: "待发货-已创建",
  READY_TO_SHIP: "待发货-已装箱",
  SHIPPED: "运输中-已取件",
  IN_TRANSIT: "运输中-已通知",
  DELIVERED: "已到达-待登记",
  CHECKED_IN: "已到达-待入库",
  RECEIVING: "入库中",
  CLOSED: "已完成",
  DELETED: "已删除",
  CANCELLED: "已取消",
  ABANDONED: "已放弃",
};

const fbaShipmentStatusDescriptions: Partial<Record<FbaShipmentStatusCode, string>> = {
  WORKING: "已创建货件，但未发货。",
  READY_TO_SHIP: "货件已装箱并打印箱子标签，准备发货",
  SHIPPED: "承运人已取件",
  IN_TRANSIT: "承运人已通知亚马逊配送中心其已知晓货件的存在",
  DELIVERED: "承运人已将货件配送至亚马逊配送中心。",
  CHECKED_IN: "货件已在亚马逊配送中心的收货装卸地点登记",
  RECEIVING: "货件已到达亚马逊配送中心，但有部分商品尚未标记为已收到",
  CLOSED: "货件已到达亚马逊配送中心，且所有商品已标记为已收到。",
  DELETED: "卖家在将货件发送到亚马逊配送中心之前取消了货件",
  CANCELLED: "卖家在货件发送至亚马逊配送中心后取消了货件",
};

const fbaShipmentStatusOrder: FbaShipmentStatusCode[] = [
  "UNCONFIRMED",
  "WORKING",
  "READY_TO_SHIP",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "CHECKED_IN",
  "RECEIVING",
  "CLOSED",
  "DELETED",
  "CANCELLED",
  "ABANDONED",
];

function getFbaShipmentStatusTooltip(status: FbaShipmentStatusCode) {
  const label = fbaShipmentStatusLabels[status];
  const description = fbaShipmentStatusDescriptions[status];
  return description ? `${label}：${description}` : label;
}

function FbaShipmentStatusBadge({ status }: { status: FbaShipmentStatusCode }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setCoords({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  }

  function handleEnter() {
    updatePosition();
    setOpen(true);
  }

  function handleLeave() {
    setOpen(false);
  }

  const tooltip = getFbaShipmentStatusTooltip(status);

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <Badge tone={fbaShipmentStatusTone(status)} className="shrink-0">
          {status}
        </Badge>
      </span>
      {open && coords
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[9999] max-w-[320px] -translate-x-1/2 -translate-y-full rounded-sm border border-border bg-white px-3 py-2 text-small leading-relaxed text-text-primary shadow-md"
              style={{ top: coords.top, left: coords.left }}
            >
              {tooltip}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

const tableHeadCell =
  "sticky top-0 z-10 whitespace-nowrap border-b border-border bg-bg-page px-3 py-3 font-medium";

const countryFilterOptions: SelectOption[] = [
  { label: "美国", value: "us" },
  { label: "加拿大", value: "ca" },
  { label: "英国", value: "uk" },
  { label: "德国", value: "de" },
  { label: "日本", value: "jp" },
];

const storeFilterOptions: SelectOption[] = [
  { label: "Shenghan美国店", value: "us-store" },
  { label: "Shenghan加拿大店", value: "ca-store" },
];

const staStatusFilterOptions: SelectOption[] = [
  { label: "草稿", value: "draft" },
  { label: "进行中", value: "active" },
  { label: "已发货", value: "shipped" },
  { label: "已取消", value: "voided" },
  { label: "异常", value: "error" },
];

const currentStepFilterOptions: SelectOption[] = [
  { label: "选择发货商品", value: "select-products" },
  { label: "商品装箱", value: "packing" },
  { label: "配送服务", value: "delivery" },
  { label: "箱子标签", value: "box-label" },
  { label: "货件追踪", value: "tracking" },
];

const fbaCurrentStepFilterOptions: SelectOption[] = currentStepFilterOptions.filter(
  (option) => option.value !== "select-products",
);

const warehouseSplitFilterOptions: SelectOption[] = [
  { label: "先装箱再分仓", value: "pack-first" },
  { label: "先分仓再装箱", value: "split-first" },
];

const staTimeTypeOptions: SelectOption[] = [
  { label: "创建时间", value: "created-at" },
  { label: "最近更新时间", value: "updated-at" },
];

const fbaShipmentTypeOptions: SelectOption[] = [
  { label: "STA", value: "sta" },
  { label: "旧版货件", value: "legacy" },
];

const fbaDeclareReceiveDiffOptions: SelectOption[] = [
  { label: "有差异", value: "has-diff" },
  { label: "无差异", value: "no-diff" },
];

const fbaDiffFilterOptions: SelectOption[] = [
  { label: "有差异", value: "has-diff" },
  { label: "无差异", value: "no-diff" },
];

const creatorFilterOptions: SelectOption[] = [
  { label: "张三", value: "zhangsan" },
  { label: "李四", value: "lisi" },
  { label: "王五", value: "wangwu" },
];

const fbaTimeTypeOptions: SelectOption[] = [
  { label: "创建时间", value: "created-at" },
  { label: "发货时间", value: "shipped-at" },
  { label: "送达时间", value: "delivered-at" },
  { label: "签收时间", value: "received-at" },
  { label: "货件完成时间", value: "completed-at" },
];

const packingStatusFilterOptions: SelectOption[] = [
  { label: "是", value: "yes" },
  { label: "否", value: "no" },
];

const trackingNumberFilterOptions: SelectOption[] = [
  { label: "已填写", value: "filled" },
  { label: "未填写", value: "empty" },
];

const fbaCompletionStatusFilterOptions: SelectOption[] = [
  { label: "进行中", value: "in-progress" },
  { label: "已完成", value: "completed" },
];

const staKeywordFieldOptions: SelectOption[] = [
  { label: "任务名称", value: "task-name" },
  { label: "货件单号", value: "shipment-id" },
  { label: "货件名称", value: "shipment-name" },
  { label: "物流中心编码", value: "fc-code" },
  { label: "MSKU", value: "msku" },
  { label: "FNSKU", value: "fnsku" },
  { label: "ASIN", value: "asin" },
  { label: "父 ASIN", value: "parent-asin" },
  { label: "SKU", value: "sku" },
];

const fbaKeywordFieldOptions: SelectOption[] = [
  { label: "STA任务名称", value: "sta-name" },
  { label: "STA任务编号", value: "sta-no" },
  { label: "货件单号", value: "shipment-id" },
  { label: "物流中心编码", value: "fc-code" },
  { label: "Reference ID", value: "reference-id" },
  { label: "货件名称", value: "shipment-name" },
  { label: "SKU", value: "sku" },
  { label: "MSKU", value: "msku" },
  { label: "FNSKU", value: "fnsku" },
  { label: "ASIN", value: "asin" },
  { label: "父 ASIN", value: "parent-asin" },
];

const bulkKeywordMaxLines = 200;

function formatFilterDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultThreeMonthRange() {
  const end = new Date();
  const start = new Date(end);
  const targetDay = end.getDate();
  start.setMonth(start.getMonth() - 3);
  if (start.getDate() !== targetDay) {
    start.setDate(0);
  }

  return {
    start: formatFilterDate(start),
    end: formatFilterDate(end),
  };
}

const defaultThreeMonthRange = getDefaultThreeMonthRange();

const mockStaDetailProducts: StaTaskProductLine[] = [
  {
    id: "line-1",
    msku: "BD-05-OS40171-4",
    fnsku: "X004H77XVH",
    asin: "B0DNTH2SF2",
    productName: "氧传感器234-5038+2...",
    sku: "OS40171-4",
    plannedQty: 10,
    declaredQty: 10,
    prepProvider: "卖家",
    labelType: "卖家自己贴标签",
    validityPeriod: "2031-04-05",
  },
  {
    id: "line-2",
    msku: "BD-05-OS40171-4",
    fnsku: "X004H77XVH",
    asin: "B0DNTH2SF2",
    productName: "氧传感器234-5038+2...",
    sku: "OS40171-4",
    plannedQty: 10,
    declaredQty: 10,
    prepProvider: "卖家",
    labelType: "卖家自己贴标签",
    validityPeriod: "2031-04-05",
  },
  {
    id: "line-3",
    msku: "BD-05-OS40171-4",
    fnsku: "X004H77XVH",
    asin: "B0DNTH2SF2",
    productName: "氧传感器234-5038+2...",
    sku: "OS40171-4",
    plannedQty: 10,
    declaredQty: 10,
    prepProvider: "卖家",
    labelType: "卖家自己贴标签",
    validityPeriod: "2031-04-05",
  },
];

export const initialStaTaskRecords: StaTaskRecord[] = [
  {
    id: "sta-001",
    staNo: "STA-20260322-001",
    taskName: "STA (03/22/2026 10:42 AM)",
    shipmentNo: "FBA18T6Q4V2",
    skuCount: 3,
    totalQty: 30,
    marketplace: "US",
    store: "AMZ-CA-05店",
    sourceWarehouse: "上海集货仓",
    destination: "ONT8",
    status: "草稿",
    currentStep: "选择发货商品",
    updatedAt: "2026-03-22 10:42",
    shippingAddress:
      "Speed Winner, 301 Room, No.374, huangyuan road, jiangdong street, yiwu, Zhejiang, yiwu, Zhejiang, 322000, CN, 19906576321",
    remark: "XXX备注内容XXX",
    products: mockStaDetailProducts,
  },
  {
    id: "sta-002",
    planId: "sp-023",
    planNo: "SP202603230023",
    staNo: "STA-20260322-002",
    shipmentNo: "FBA18T6Q4W9",
    skuCount: 5,
    totalQty: 420,
    marketplace: "CA",
    store: "AMZ-CA-001",
    sourceWarehouse: "宁波前置仓",
    destination: "YYZ4",
    status: "进行中",
    currentStep: "商品装箱",
    updatedAt: "2026-03-22 09:18",
    taskName: "STA (03/22/2026 09:18 AM)",
    packingStatus: "进行中",
    products: mockStaDetailProducts,
    confirmedShipments: [
      {
        shipmentId: "FBA19CHTHLKB",
        fcCode: "YYZ4",
        deliveryAddress: "配送地址1XXXXX",
        shipmentName: "FBA STA (22/03/2026 09:18)-YYZ4",
      },
      {
        shipmentId: "FBA18T6Q4W9",
        fcCode: "LAN2",
        deliveryAddress: "配送地址2XXXXX",
        shipmentName: "FBA STA (22/03/2026 09:18)-LAN2",
      },
    ],
  },
  {
    id: "sta-005",
    staNo: "STA-20260428-001",
    taskName: "STA (04/28/2026 02:56 PM)",
    shipmentNo: "FBA15LQGJ5LF",
    skuCount: 31,
    totalQty: 960,
    marketplace: "CA",
    store: "AMZ-CA-05店",
    sourceWarehouse: "义乌发货仓",
    destination: "LBE1",
    status: "进行中",
    currentStep: "商品装箱",
    updatedAt: "2026-04-28 14:56",
    planCreated: true,
    packingStatus: "已完成",
    products: mockStaDetailProducts,
    confirmedShipments: [
      {
        shipmentId: "FBA15LQGJ5LF",
        fcCode: "LBE1",
        deliveryAddress: "配送地址1XXXXX",
        shipmentName: "FBA STA (28/04/2026 05:56)-HAJ1",
      },
      {
        shipmentId: "FBA15LQGJ6LF",
        fcCode: "LB1",
        deliveryAddress: "配送地址2XXXXX",
        shipmentName: "FBA STA (28/04/2026 05:56)-LB1",
      },
      {
        shipmentId: "FBA15LQGJ7LF",
        fcCode: "TMBB",
        deliveryAddress: "配送地址3XXXXX",
        shipmentName: "FBA STA (28/04/2026 05:56)-TMBB",
      },
      {
        shipmentId: "FBA15LQGJ8LF",
        fcCode: "LAN2",
        deliveryAddress: "配送地址4XXXXX",
        shipmentName: "FBA STA (28/04/2026 05:56)-LAN2",
      },
    ],
  },
  {
    id: "sta-004",
    staNo: "STA-20260425-007",
    taskName: "STA (04/25/2026 04:07 PM)",
    inboundPlanId: "wfcd1bb199-2108-44f7-8b11-ae27f925b530",
    shipmentNo: "-",
    skuCount: 3,
    totalQty: 30,
    marketplace: "CA",
    store: "AMZ-CA-05店",
    sourceWarehouse: "义乌发货仓",
    destination: "-",
    status: "进行中",
    currentStep: "选择发货商品",
    updatedAt: "2026-04-25 16:07",
    planCreated: true,
    placementFee: "USD10",
    creator: "张三",
    createdAt: "2026-04-25 16:07",
    shippingAddress:
      "Speed Winner, 301 Room, No.374, huangyuan road, jiangdong street, yiwu, Zhejiang, yiwu, Zhejiang, 322000, CN, 19906576321",
    remark: "XXX备注内容XXX",
    products: mockStaDetailProducts,
  },
  {
    id: "sta-003",
    staNo: "STA-20260321-018",
    shipmentNo: "FBA18T6Q3A7",
    skuCount: 12,
    totalQty: 960,
    marketplace: "US",
    store: "AMZ-US-028",
    sourceWarehouse: "深圳保税仓",
    destination: "LGB8",
    status: "异常",
    currentStep: "配送服务",
    updatedAt: "2026-03-21 18:36",
    taskName: "STA (03/21/2026 06:36 PM)",
    packingStatus: "已完成",
    deliveryStatus: "进行中",
    products: mockStaDetailProducts,
    confirmedShipments: [
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
    ],
  },
  {
    id: "sta-006",
    staNo: "STA-20260428-002",
    taskName: "STA (04/28/2026 02:56 PM)",
    shipmentNo: "FBA19C34CPYD",
    skuCount: 6,
    totalQty: 60,
    marketplace: "CA",
    store: "AMZ-CA-05店",
    sourceWarehouse: "义乌发货仓",
    destination: "YYZ7",
    status: "进行中",
    currentStep: "箱子标签",
    updatedAt: "2026-04-28 15:20",
    planCreated: true,
    packingStatus: "已完成",
    deliveryStatus: "已完成",
    products: mockStaDetailProducts,
    confirmedShipments: [
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
    ],
  },
];

const mockLegacyFbaProducts: FbaShipmentProductLine[] = [
  {
    id: "legacy-line-1",
    msku: "BD-05-OS40171-4",
    fnsku: "X004H77XVH",
    asin: "B0DNTH2SF2",
    productName: "氧传感器234-5038+2...",
    sku: "OS40171-4",
    prepProvider: "卖家",
    labelType: "卖家自己贴标签",
    declaredQty: 10,
    shippedQty: 10,
    receivedQty: 10,
  },
  {
    id: "legacy-line-2",
    msku: "BD-05-OS40171-4",
    fnsku: "X004H77XVH",
    asin: "B0DNTH2SF2",
    productName: "氧传感器234-5038+2...",
    sku: "OS40171-4",
    prepProvider: "卖家",
    labelType: "卖家自己贴标签",
    declaredQty: 10,
    shippedQty: 10,
    receivedQty: 10,
  },
  {
    id: "legacy-line-3",
    msku: "BD-05-OS40171-4",
    fnsku: "X004H77XVH",
    asin: "B0DNTH2SF2",
    productName: "氧传感器234-5038+2...",
    sku: "OS40171-4",
    prepProvider: "卖家",
    labelType: "卖家自己贴标签",
    declaredQty: 10,
    shippedQty: 10,
    receivedQty: 10,
  },
];

export const initialFbaShipmentRecords: FbaShipmentRecord[] = [
  {
    id: "fba-001",
    shipmentId: "FBA19CHTHLKB",
    staNo: "STA-20260322-002",
    store: "AMZ-CA-001",
    planId: "sp-023",
    planNo: "SP202603230023",
    mskuCount: 5,
    totalQty: 420,
    destinationFc: "YYZ4",
    boxMode: "先分仓再装箱",
    shipmentStatus: "WORKING",
    completionStatus: "进行中",
    currentStep: "商品装箱",
    hasStaTask: true,
    updatedAt: "2026-03-22 09:18",
  },
  {
    id: "fba-002",
    shipmentId: "FBA18T6Q4W9",
    staNo: "STA-20260322-002",
    store: "AMZ-CA-001",
    planId: "sp-023",
    planNo: "SP202603230023",
    mskuCount: 5,
    totalQty: 420,
    destinationFc: "LAN2",
    boxMode: "先分仓再装箱",
    shipmentStatus: "WORKING",
    completionStatus: "进行中",
    currentStep: "商品装箱",
    hasStaTask: true,
    updatedAt: "2026-03-22 09:18",
  },
  {
    id: "fba-003",
    shipmentId: "FBA18T6Q3A7",
    staNo: "STA-20260321-018",
    store: "AMZ-US-028",
    planNo: "PLN-20260321-018",
    mskuCount: 12,
    totalQty: 960,
    destinationFc: "LGB8",
    boxMode: "先分仓再装箱",
    shipmentStatus: "SHIPPED",
    completionStatus: "进行中",
    currentStep: "配送服务",
    hasStaTask: true,
    updatedAt: "2026-03-21 18:36",
  },
  {
    id: "fba-004",
    shipmentId: "FBA195K13S7G",
    staNo: "-",
    store: "AMZ-CA-05店",
    planNo: "-",
    mskuCount: 3,
    totalQty: 30,
    destinationFc: "XLX7",
    boxMode: "先分仓再装箱",
    shipmentStatus: "RECEIVING",
    completionStatus: "进行中",
    currentStep: "商品装箱",
    hasStaTask: false,
    updatedAt: "2026-04-25 16:07",
    referenceId: "6KHVPYPS",
    marketplace: "CA",
    shipmentName: "FBA (04/24/2026 01:58)-XLX7",
    creator: "张三",
    createdAt: "2026-04-25 16:07",
    labelType: "卖家自己贴标签",
    shippingAddress:
      "Speed Winner, 301 Room, No.374, huangyuan road, jiangdong street, yiwu, Zhejiang, yiwu, Zhejiang, 322000, CN, 19906576321",
    remark: "XXX备注内容XXX",
    transportType: "海运",
    storeCode: "Shenghan店铺编码XXX",
    products: mockLegacyFbaProducts,
  },
  {
    id: "fba-005",
    shipmentId: "FBA18T6Q8K2",
    staNo: "-",
    store: "AMZ-US-028",
    planNo: "-",
    mskuCount: 2,
    totalQty: 180,
    destinationFc: "ONT8",
    boxMode: "先装箱再分仓",
    shipmentStatus: "CLOSED",
    completionStatus: "已完成",
    currentStep: "商品装箱",
    hasStaTask: false,
    updatedAt: "2026-03-15 11:20",
    referenceId: "8PLM2QRT",
    marketplace: "US",
    shipmentName: "FBA (03/14/2026 09:15)-ONT8",
    creator: "李四",
    createdAt: "2026-03-14 09:15",
    labelType: "亚马逊贴标签",
    shippingAddress: "Yi Wu Nan Sheng Dian Zi Shang Wu You Xian Gong Si, yiwu, Zhejiang, 322000, CN",
    remark: "-",
    transportType: "空运",
    storeCode: "Shenghan-US-028",
    products: mockLegacyFbaProducts.slice(0, 2),
  },
  {
    id: "fba-006",
    shipmentId: "FBA17K9M2P1X",
    staNo: "-",
    store: "AMZ-CA-001",
    planNo: "-",
    mskuCount: 1,
    totalQty: 96,
    destinationFc: "YYZ4",
    boxMode: "先分仓再装箱",
    shipmentStatus: "SHIPPED",
    completionStatus: "进行中",
    currentStep: "商品装箱",
    hasStaTask: false,
    updatedAt: "2026-02-28 08:42",
    referenceId: "3WNH9KLP",
    marketplace: "CA",
    shipmentName: "FBA (02/27/2026 04:30)-YYZ4",
    creator: "王五",
    createdAt: "2026-02-27 16:30",
    labelType: "卖家自己贴标签",
    shippingAddress: "Speed Winner, 301 Room, No.374, huangyuan road, jiangdong street, yiwu, Zhejiang, 322000, CN",
    remark: "旧版货件同步数据",
    transportType: "海运",
    storeCode: "Shenghan-CA-001",
    products: [mockLegacyFbaProducts[0]],
  },
];

function staStatusTone(status: StaTaskStatus) {
  switch (status) {
    case "已发货":
      return "success";
    case "已取消":
      return "closed";
    case "异常":
      return "error";
    case "草稿":
      return "draft";
    default:
      return "processing";
  }
}

function fbaShipmentStatusTone(status: FbaShipmentStatusCode) {
  if (status === "CLOSED") {
    return "success";
  }

  if (status === "DELETED" || status === "CANCELLED" || status === "ABANDONED") {
    return "error";
  }

  if (
    status === "SHIPPED" ||
    status === "IN_TRANSIT" ||
    status === "DELIVERED" ||
    status === "CHECKED_IN" ||
    status === "RECEIVING"
  ) {
    return "processing";
  }

  return "pending";
}

function fbaCompletionStatusTone(status: FbaShipmentRecord["completionStatus"]) {
  return status === "已完成" ? "success" : "processing";
}

function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-4">{children}</div>;
}

function FilterField({
  children,
  className,
  widthClass = "w-[160px]",
}: {
  children: ReactNode;
  className?: string;
  widthClass?: string;
}) {
  return <div className={`shrink-0 ${widthClass} ${className ?? ""}`}>{children}</div>;
}

function FbaShipmentStatusMultiSelect({
  placeholder = "请选择货件状态",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<FbaShipmentStatusCode[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const displayLabel =
    selectedValues.length === 0
      ? placeholder
      : selectedValues.length === 1
        ? selectedValues[0]
        : `已选 ${selectedValues.length} 项`;

  function toggleValue(value: FbaShipmentStatusCode) {
    setSelectedValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`field-control flex min-w-0 items-center justify-between gap-2 pr-10 text-left ${className ?? ""}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={`block min-w-0 flex-1 whitespace-nowrap ${
            selectedValues.length > 0 ? "truncate text-text-primary" : "text-text-placeholder"
          }`}
          title={displayLabel}
        >
          {displayLabel}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-72 w-[320px] overflow-auto rounded-sm border border-border bg-white p-1 shadow-md">
          {fbaShipmentStatusOrder.map((status) => {
            const active = selectedValues.includes(status);
            return (
              <button
                key={status}
                type="button"
                className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-body transition hover:bg-bg-hover ${
                  active ? "bg-primary-subtle" : ""
                }`}
                onClick={() => toggleValue(status)}
              >
                <input type="checkbox" checked={active} readOnly className="pointer-events-none shrink-0" />
                <span className="min-w-0 flex-1 truncate whitespace-nowrap">
                  <span className="font-medium text-text-primary">{status}</span>
                  <span className="ml-2 text-text-muted">{fbaShipmentStatusLabels[status]}</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MultiSelect({
  options,
  placeholder = "请选择",
  className,
}: {
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const displayLabel =
    selectedValues.length === 0
      ? placeholder
      : selectedValues.length === 1
        ? options.find((option) => option.value === selectedValues[0])?.label ?? placeholder
        : `已选 ${selectedValues.length} 项`;

  function toggleValue(value: string) {
    setSelectedValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`field-control flex min-w-0 items-center justify-between gap-2 pr-10 text-left ${className ?? ""}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={`block min-w-0 flex-1 whitespace-nowrap ${
            selectedValues.length > 0 ? "truncate text-text-primary" : "text-text-placeholder"
          }`}
          title={displayLabel}
        >
          {displayLabel}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+4px)] z-50 max-h-60 w-full overflow-auto rounded-sm border border-border bg-white p-1 shadow-md">
          {options.map((option) => {
            const active = selectedValues.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-body transition hover:bg-bg-hover ${
                  active ? "bg-primary-subtle text-primary" : "text-text-primary"
                }`}
                onClick={() => toggleValue(option.value)}
              >
                <span className="inline-flex w-4 items-center justify-center text-small">
                  {active ? "✓" : ""}
                </span>
                <span className="min-w-0 flex-1 truncate whitespace-nowrap">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FilterTimeRangeField({
  timeTypeOptions,
  defaultTimeType,
  widthClass = "w-auto",
}: {
  timeTypeOptions: SelectOption[];
  defaultTimeType: string;
  widthClass?: string;
}) {
  const [dateRange, setDateRange] = useState(defaultThreeMonthRange);

  return (
    <FilterField widthClass={widthClass}>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          defaultValue={defaultTimeType}
          options={timeTypeOptions}
          className="w-[152px] shrink-0"
        />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>
    </FilterField>
  );
}

function FilterQueryActions({ className }: { className?: string }) {
  return (
    <div className={`flex shrink-0 items-center gap-actions ${className ?? ""}`}>
      <Button variant="primary" size="sm">
        <Search aria-hidden="true" className="h-4 w-4" />
        查询
      </Button>
      <Button variant="secondary" size="sm">
        重置
      </Button>
    </div>
  );
}

function KeywordSearchField({
  fieldOptions,
  defaultField,
  inputWidthClass = "w-[200px]",
}: {
  fieldOptions: SelectOption[];
  defaultField: string;
  inputWidthClass?: string;
}) {
  const [field, setField] = useState(defaultField);
  const [fieldMenuOpen, setFieldMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState("");
  const [bulkApplied, setBulkApplied] = useState("");
  const [fieldSelectorWidth, setFieldSelectorWidth] = useState(0);
  const [fieldMenuStyle, setFieldMenuStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldTriggerRef = useRef<HTMLButtonElement>(null);
  const bulkPanelRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const selectedField =
    fieldOptions.find((option) => option.value === field) ?? fieldOptions[0];

  const bulkLineCount = bulkApplied
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;

  useLayoutEffect(() => {
    const measureEl = measureRef.current;
    if (!measureEl) {
      return;
    }

    let maxTextWidth = 0;
    for (const option of fieldOptions) {
      measureEl.textContent = option.label;
      maxTextWidth = Math.max(maxTextWidth, measureEl.offsetWidth);
    }

    setFieldSelectorWidth(maxTextWidth + 40);
  }, [fieldOptions]);

  useLayoutEffect(() => {
    if (!fieldMenuOpen) {
      return;
    }

    function updateMenuPosition() {
      const trigger = fieldTriggerRef.current;
      if (!trigger) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      setFieldMenuStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: fieldSelectorWidth,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [fieldMenuOpen, fieldSelectorWidth]);

  useEffect(() => {
    if (!fieldMenuOpen && !bulkOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        bulkPanelRef.current?.contains(target) ||
        (target instanceof Element && target.closest("[data-keyword-field-menu='true']"))
      ) {
        return;
      }
      setFieldMenuOpen(false);
      setBulkOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [bulkOpen, fieldMenuOpen]);

  function handleBulkDraftChange(value: string) {
    const lines = value.split("\n");
    if (lines.length <= bulkKeywordMaxLines) {
      setBulkDraft(value);
      return;
    }

    setBulkDraft(lines.slice(0, bulkKeywordMaxLines).join("\n"));
  }

  function openBulkPanel() {
    setBulkDraft(bulkApplied);
    setBulkOpen(true);
    setFieldMenuOpen(false);
  }

  function applyBulkSearch() {
    setBulkApplied(bulkDraft.trim());
    setKeyword("");
    setBulkOpen(false);
  }

  function clearBulkDraft() {
    setBulkDraft("");
  }

  return (
    <div ref={rootRef} className="relative inline-flex w-auto">
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute whitespace-nowrap text-body"
      />
      <div className="flex h-input-md w-auto rounded-sm border border-border bg-white focus-within:border-border-focus focus-within:ring-2 focus-within:ring-primary-subtle">
        <div className="relative shrink-0 border-r border-border">
          <button
            ref={fieldTriggerRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={fieldMenuOpen}
            style={{ width: fieldSelectorWidth || undefined }}
            className="flex h-full items-center justify-between gap-2 px-3 text-body text-text-primary transition hover:bg-bg-hover"
            onClick={() => {
              setFieldMenuOpen((current) => !current);
              setBulkOpen(false);
            }}
          >
            <span className="whitespace-nowrap">{selectedField.label}</span>
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${
                fieldMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {fieldMenuOpen && typeof document !== "undefined"
            ? createPortal(
                <div
                  data-keyword-field-menu="true"
                  style={{
                    position: "fixed",
                    top: fieldMenuStyle.top,
                    left: fieldMenuStyle.left,
                    width: fieldMenuStyle.width,
                    zIndex: 80,
                  }}
                  className="max-h-60 overflow-auto rounded-sm border border-border bg-white p-1 shadow-md"
                >
                  {fieldOptions.map((option) => {
                    const active = option.value === field;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`flex w-full items-center whitespace-nowrap rounded-sm px-3 py-2 text-left text-body transition hover:bg-bg-hover ${
                          active ? "bg-primary-subtle text-primary" : "text-text-primary"
                        }`}
                        onClick={() => {
                          setField(option.value);
                          setFieldMenuOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>,
                document.body,
              )
            : null}
        </div>
        <input
          type="text"
          value={bulkApplied ? "" : keyword}
          placeholder={bulkApplied ? `已填写 ${bulkLineCount} 项` : "..."}
          readOnly={Boolean(bulkApplied)}
          className={`${inputWidthClass} shrink-0 border-0 bg-transparent px-3 text-body text-text-primary outline-none placeholder:text-text-placeholder read-only:cursor-default`}
          onChange={(event) => {
            setKeyword(event.target.value);
            if (bulkApplied) {
              setBulkApplied("");
            }
          }}
        />
        <button
          type="button"
          aria-label="批量精确搜索"
          className="inline-flex shrink-0 items-center justify-center border-l border-border px-3 text-text-muted transition hover:bg-bg-hover hover:text-text-primary"
          onClick={openBulkPanel}
        >
          <Ellipsis aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      {bulkOpen ? (
        <div
          ref={bulkPanelRef}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[360px] rounded-md border border-border bg-white p-4 shadow-md"
        >
          <Textarea
            value={bulkDraft}
            onChange={(event) => handleBulkDraftChange(event.target.value)}
            placeholder="精确搜索，一项一行，最多支持200行"
            rows={8}
            className="min-h-[200px] resize-none"
          />
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={clearBulkDraft}
              className="text-small text-text-muted transition hover:text-text-primary"
            >
              清空
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setBulkOpen(false)}>
                关闭
              </Button>
              <Button variant="primary" size="sm" onClick={applyBulkSearch}>
                搜索
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** 列表内嵌商品行：更紧凑的行高，便于单屏展示更多数据 */
const listProductRowCell = "whitespace-nowrap px-3 py-1.5 align-middle text-small leading-snug";
const listProductRowNameCell =
  "max-w-[220px] truncate px-3 py-1.5 align-middle text-small leading-snug";

function ListProductImagePlaceholder() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-dashed border-border bg-bg-page text-text-muted">
      <ImageIcon aria-hidden="true" className="h-3.5 w-3.5" />
    </div>
  );
}

const LIST_PRODUCTS_INITIAL_VISIBLE = 5;

type StaListProductRow = {
  id: string;
  msku: string;
  fnsku: string;
  asin: string;
  productName: string;
  sku: string;
  declaredQty: number;
};

type FbaListProductRow = StaListProductRow & {
  shippedQty: number;
  receivedQty: number;
  declareShipDiff: number;
  shipReceiveDiff: number;
  declareReceiveDiff: number;
};

function StaListProductTableRow({ product }: { product: StaListProductRow }) {
  return (
    <tr className="bg-white">
      <td className={listProductRowCell} />
      <td className={listProductRowCell}>
        <ListProductImagePlaceholder />
      </td>
      <td className={listProductRowCell}>{product.msku}</td>
      <td className={listProductRowCell}>{product.fnsku}</td>
      <td className={listProductRowCell}>{product.asin}</td>
      <td className={listProductRowNameCell} title={product.productName}>
        {product.productName}
      </td>
      <td className={listProductRowCell}>{product.sku}</td>
      <td className={listProductRowCell}>{product.declaredQty}</td>
    </tr>
  );
}

function FbaListProductTableRow({ product }: { product: FbaListProductRow }) {
  return (
    <tr className="bg-white">
      <td className={listProductRowCell} />
      <td className={listProductRowCell}>
        <ListProductImagePlaceholder />
      </td>
      <td className={listProductRowCell}>{product.msku}</td>
      <td className={listProductRowCell}>{product.fnsku}</td>
      <td className={listProductRowCell}>{product.asin}</td>
      <td className={listProductRowNameCell} title={product.productName}>
        {product.productName}
      </td>
      <td className={listProductRowCell}>{product.sku}</td>
      <td className={listProductRowCell}>{product.declaredQty}</td>
      <td className={listProductRowCell}>{product.shippedQty}</td>
      <td className={listProductRowCell}>{product.receivedQty}</td>
      <td className={listProductRowCell}>{product.declareShipDiff}</td>
      <td className={listProductRowCell}>{product.shipReceiveDiff}</td>
      <td className={listProductRowCell}>{product.declareReceiveDiff}</td>
    </tr>
  );
}

function buildStaListProducts(record: StaTaskRecord): StaListProductRow[] {
  const count = Math.max(record.skuCount, record.products?.length ?? 0, 1);
  const template = record.products?.[0] ?? mockStaDetailProducts[0];

  if (record.products && record.products.length >= count) {
    return record.products.slice(0, count).map((product) => ({
      id: product.id,
      msku: product.msku,
      fnsku: product.fnsku,
      asin: product.asin,
      productName: product.productName,
      sku: product.sku,
      declaredQty: product.declaredQty,
    }));
  }

  return Array.from({ length: count }, (_, index) => ({
    id: `${record.id}-list-product-${index}`,
    msku: template.msku,
    fnsku: template.fnsku,
    asin: template.asin,
    productName: index === 0 ? "燃油宝成品 SP2113H" : `${template.productName} ${index + 1}`,
    sku: template.sku,
    declaredQty: Math.max(1, Math.round(record.totalQty / count)),
  }));
}

function buildFbaListProducts(record: FbaShipmentRecord): FbaListProductRow[] {
  const count = Math.max(record.mskuCount, record.products?.length ?? 0, 1);
  const template = record.products?.[0];

  if (record.products && record.products.length >= count) {
    return record.products.slice(0, count).map((product, index) => ({
      id: product.id,
      msku: product.msku,
      fnsku: product.fnsku,
      asin: product.asin,
      productName: product.productName,
      sku: product.sku,
      declaredQty: product.declaredQty,
      shippedQty: product.shippedQty,
      receivedQty: product.receivedQty,
      declareShipDiff: index === 0 ? 2 : 0,
      shipReceiveDiff: index === 0 ? 1 : 0,
      declareReceiveDiff: index === 0 ? 1 : 0,
    }));
  }

  return Array.from({ length: count }, (_, index) => ({
    id: `${record.id}-list-product-${index}`,
    msku: "SYJN-FS23-00074042-002",
    fnsku: "X004UGWLN5",
    asin: "B0FRSLHZXS",
    productName: index === 0 ? "燃油宝成品 SP2113H" : `燃油宝成品 SP2113H ${index + 1}`,
    sku: "JN-FS23-00074042",
    declaredQty: Math.max(1, Math.round(record.totalQty / count)),
    shippedQty: index === 0 ? 8 : 0,
    receivedQty: index === 0 ? 8 : 0,
    declareShipDiff: index === 0 ? 2 : 0,
    shipReceiveDiff: index === 0 ? 1 : 0,
    declareReceiveDiff: index === 0 ? 1 : 0,
  }));
}

function useProductExpandState() {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  function isExpanded(id: string) {
    return expandedIds.includes(id);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return { isExpanded, toggleExpanded };
}

function ExpandProductsRow({
  remainingCount,
  expanded,
  onToggle,
  colSpan,
}: {
  remainingCount: number;
  expanded: boolean;
  onToggle: () => void;
  colSpan: number;
}) {
  if (remainingCount <= 0) {
    return null;
  }

  return (
    <tr>
      <td colSpan={colSpan} className="border-t border-border bg-white px-3 py-1.5 text-center text-small">
        <button
          type="button"
          className="border-0 bg-transparent text-small text-primary hover:underline"
          onClick={onToggle}
        >
          {expanded ? (
            "收起"
          ) : (
            <span className="inline-flex items-center justify-center gap-1">
              展开剩余{remainingCount}个商品
              <ChevronsDown aria-hidden="true" className="h-4 w-4" />
            </span>
          )}
        </button>
      </td>
    </tr>
  );
}

function StaTaskBadge() {
  return (
    <span className="inline-flex h-5 items-center rounded-sm bg-[#FFF7E6] px-1.5 text-[11px] font-medium text-[#D48806]">
      STA
    </span>
  );
}

function ActionLinkButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center border-0 bg-transparent px-0 text-small text-primary hover:underline focus-visible:outline-none"
    >
      {children}
    </button>
  );
}

function ActionDropdown({
  options,
  onSelect,
}: {
  options: Array<{ label: string; value: string }>;
  onSelect?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <ActionLinkButton onClick={() => setOpen((current) => !current)}>
        <span className="inline-flex items-center gap-0.5">
          操作
          <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />
        </span>
      </ActionLinkButton>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-sm border border-border bg-white py-1 shadow-md">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect?.(option.value);
              }}
              className="flex w-full border-0 bg-transparent px-3 py-2 text-left text-small text-primary hover:underline focus-visible:outline-none"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getShippingPlanActionOptions(status: ShippingPlanStatus, hasStaTask = false): SelectOption[] {
  switch (status) {
    case "待提交":
      return [
        { label: "作废", value: "void" },
        { label: "提交", value: "submit" },
        { label: "编辑", value: "edit" },
      ];
    case "待审批":
      return [
        { label: "作废", value: "void" },
        { label: "审批", value: "approve" },
      ];
    case "待处理":
      return [
        { label: "作废", value: "void" },
        { label: "整单已处理", value: "order-processed" },
        { label: "产品已处理", value: "product-processed" },
        ...(hasStaTask ? [] : [{ label: "创建STA任务", value: "create-sta" }]),
      ];
    case "已驳回":
      return [
        { label: "作废", value: "void" },
        { label: "提交", value: "submit" },
        { label: "编辑", value: "edit" },
      ];
    case "已完成":
    case "已作废":
    default:
      return [];
  }
}

function ShippingPlanOperationCell({
  record,
  onAction,
  onViewStaTask,
}: {
  record: ShippingPlanRecord;
  onAction?: (action: string, record: ShippingPlanRecord) => void;
  onViewStaTask?: (record: ShippingPlanRecord) => void;
}) {
  const options = getShippingPlanActionOptions(record.documentStatus, record.hasStaTask);

  return (
    <td className="whitespace-nowrap px-3 py-3">
      <div className="flex flex-nowrap items-center justify-end gap-3">
        <ActionLinkButton>详情</ActionLinkButton>
        {record.hasStaTask && record.staNo ? (
          <ActionLinkButton onClick={() => onViewStaTask?.(record)}>查看STA</ActionLinkButton>
        ) : null}
        {options.length > 0 ? (
          <ActionDropdown options={options} onSelect={(value) => onAction?.(value, record)} />
        ) : null}
      </div>
    </td>
  );
}

const actionSelectOptions = [
  { label: "编辑", value: "edit" },
  { label: "生成备货单", value: "create-stockup" },
  { label: "取消", value: "cancel" },
];

function StaTaskGroupHeaderActions({
  record,
  onAction,
  onView,
}: {
  record: StaTaskRecord;
  onAction?: (action: string, record: StaTaskRecord) => void;
  onView?: (record: StaTaskRecord) => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <Badge tone={staStatusTone(record.status)} className="shrink-0">
        {record.status}
      </Badge>
      <Badge tone="processing" className="shrink-0">
        {record.currentStep}
      </Badge>
      <ActionLinkButton onClick={() => onView?.(record)}>详情</ActionLinkButton>
      <ActionDropdown options={actionSelectOptions} onSelect={(value) => onAction?.(value, record)} />
    </div>
  );
}

function FbaShipmentGroupHeaderActions({
  record,
  onAction,
  onView,
}: {
  record: FbaShipmentRecord;
  onAction?: (action: string, record: FbaShipmentRecord) => void;
  onView?: (record: FbaShipmentRecord) => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <FbaShipmentStatusBadge status={record.shipmentStatus} />
      <Badge tone={fbaCompletionStatusTone(record.completionStatus)} className="shrink-0">
        {record.completionStatus}
      </Badge>
      {record.hasStaTask && record.currentStep !== "选择发货商品" ? (
        <Badge tone="processing" className="shrink-0">
          {record.currentStep}
        </Badge>
      ) : null}
      <ActionLinkButton onClick={() => onView?.(record)}>详情</ActionLinkButton>
      {record.hasStaTask ? (
        <ActionDropdown options={actionSelectOptions} onSelect={(value) => onAction?.(value, record)} />
      ) : null}
    </div>
  );
}

function useListSelection(rowIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = rowIds.filter((id) => selectedIds.includes(id)).length;
  const allSelected = rowIds.length > 0 && selectedCount === rowIds.length;
  const partiallySelected = selectedCount > 0 && selectedCount < rowIds.length;

  function isSelected(id: string) {
    return selectedIds.includes(id);
  }

  function toggleRow(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !rowIds.includes(id)));
      return;
    }

    setSelectedIds((current) => Array.from(new Set([...current, ...rowIds])));
  }

  return {
    isSelected,
    toggleRow,
    toggleAll,
    allSelected,
    partiallySelected,
  };
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

function TableRowCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return <input type="checkbox" checked={checked} onChange={onChange} />;
}

function ListToolbar({
  primaryActions,
  importExportActions,
}: {
  primaryActions?: ReactNode;
  importExportActions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-actions">
      <div className="flex flex-wrap items-center gap-actions">{primaryActions}</div>
      <div className="flex flex-wrap items-center gap-actions">{importExportActions}</div>
    </div>
  );
}

const prototypePageSizeOptions = [10, 20, 30, 50, 100];

function buildPrototypePageItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];

  if (currentPage > 3) {
    items.push("ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (currentPage < totalPages - 2) {
    items.push("ellipsis");
  }

  items.push(totalPages);
  return items;
}

function usePrototypePagination<T>(items: T[], resetKey?: string | number) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(prototypePageSizeOptions[0]);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  function handlePageSizeChange(nextPageSize: number) {
    setPageSize(nextPageSize);
  }

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    pagedItems,
    setPage,
    setPageSize: handlePageSizeChange,
  };
}

type PrototypePaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

function PrototypePagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PrototypePaginationProps) {
  const pageItems = buildPrototypePageItems(currentPage, totalPages);

  return (
    <div className="flex items-center justify-end gap-3 border-t border-border bg-white px-4 py-3 text-small text-text-muted">
      <span>共 {totalCount} 条</span>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        >
          上一页
        </Button>
        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <Button key={`ellipsis-${index}`} variant="secondary" size="sm" disabled>
              ...
            </Button>
          ) : (
            <Button
              key={item}
              variant={item === currentPage ? "primary" : "secondary"}
              size="sm"
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        >
          下一页
        </Button>
      </div>
      <Select
        value={String(pageSize)}
        menuPlacement="top"
        className="w-[96px]"
        onValueChange={(value) => onPageSizeChange(Number(value))}
        options={prototypePageSizeOptions.map((size) => ({
          label: `${size}条/页`,
          value: String(size),
        }))}
      />
    </div>
  );
}

function ScrollableTablePanel({
  children,
  tableFooter,
  pagination,
}: {
  children: ReactNode;
  tableFooter?: ReactNode;
  pagination: PrototypePaginationProps;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="max-h-[calc(100dvh-15.5rem)] overflow-auto overscroll-contain">{children}</div>
      {tableFooter}
      <PrototypePagination {...pagination} />
    </div>
  );
}

const shippingPlanKeywordFieldOptions: SelectOption[] = [
  { label: "备货单号", value: "stock-order-no" },
  { label: "发货计划号", value: "plan-no" },
  { label: "SKU", value: "sku" },
];

const platformFilterOptions: SelectOption[] = [
  { label: "Amazon", value: "amazon" },
  { label: "Walmart", value: "walmart" },
  { label: "Shopify", value: "shopify" },
  { label: "ebay", value: "ebay" },
  { label: "TikTok", value: "tiktok" },
  { label: "Temu", value: "temu" },
  { label: "AliExpress", value: "aliexpress" },
];

const shipWarehouseFilterOptions: SelectOption[] = [
  { label: "测试仓库101", value: "wh-101" },
  { label: "AMZ-US-028仓", value: "amz-us-028" },
  { label: "ebay测试仓", value: "ebay-test" },
];

const shipWarehouseTypeOptions: SelectOption[] = [
  { label: "虚拟仓", value: "virtual" },
  { label: "实体仓", value: "physical" },
];

const receiveWarehouseTypeOptions: SelectOption[] = [
  { label: "三方仓", value: "third-party" },
  { label: "实体仓", value: "physical" },
];

const receiveWarehouseFilterOptions: SelectOption[] = [
  { label: "FBA-ONT8", value: "ont8" },
  { label: "FBA-YYZ4", value: "yyz4" },
  { label: "Walmart仓", value: "walmart-wh" },
];

const logisticsChannelOptions: SelectOption[] = [
  { label: "普快", value: "standard" },
  { label: "特快", value: "express" },
  { label: "海运", value: "sea" },
  { label: "海运散货", value: "sea-lcl" },
  { label: "测试", value: "test" },
];

const transportModeOptions: SelectOption[] = [
  { label: "海运", value: "sea" },
  { label: "快递", value: "express" },
];

const shippingPlanTimeTypeOptions: SelectOption[] = [
  { label: "创建时间", value: "created-at" },
  { label: "更新时间", value: "updated-at" },
];

type ShippingPlanStatus = "待提交" | "待审批" | "待处理" | "已完成" | "已驳回" | "已作废";

export type ShippingPlanFlowStatus = "none" | "sta_draft" | "sta_in_progress" | "fba_created";

export type ShippingPlanRecord = {
  id: string;
  planNo: string;
  hasStaTask?: boolean;
  staId?: string;
  staNo?: string;
  fbaShipmentCount?: number;
  flowStatus?: ShippingPlanFlowStatus;
  platform: string;
  store: string;
  shipWarehouseType: string;
  shipWarehouse: string;
  receiveWarehouseType: string;
  receiveWarehouse: string;
  logisticsCycle: string;
  deliveryMode: string;
  logisticsChannel: string;
  transportMode: string;
  totalWeight: number;
  totalVolume: number;
  relatedStockOrderNo: string;
  remark: string;
  estimatedShipTime: string;
  creator: string;
  createdAt: string;
  updater: string;
  updatedAt: string;
  documentStatus: ShippingPlanStatus;
  plannedQty: number;
};

type StockupGenerationSuccessItem = {
  id: string;
  planNo: string;
  stockOrderNo: string;
  store: string;
  receiveWarehouse: string;
  qty: number;
};

type StockupGenerationFailureItem = {
  id: string;
  planNo: string;
  store: string;
  receiveWarehouse: string;
  qty: number;
  reason: string;
};

type StockupGenerationResult = {
  selectedCount: number;
  successItems: StockupGenerationSuccessItem[];
  failureItems: StockupGenerationFailureItem[];
};

const shippingPlanStatusTabDefinitions: Array<{
  label: string;
  value: string;
  status: ShippingPlanStatus | null;
}> = [
  { label: "全部", value: "all", status: null },
  { label: "待提交", value: "pending-submit", status: "待提交" },
  { label: "待审批", value: "pending-approval", status: "待审批" },
  { label: "待处理", value: "pending-process", status: "待处理" },
  { label: "已完成", value: "completed", status: "已完成" },
  { label: "已驳回", value: "rejected", status: "已驳回" },
  { label: "已作废", value: "voided", status: "已作废" },
];

function buildShippingPlanStatusTabs(records: ShippingPlanRecord[]) {
  return shippingPlanStatusTabDefinitions.map((tab) => ({
    label: tab.label,
    value: tab.value,
    count: tab.status === null
      ? records.length
      : records.filter((record) => record.documentStatus === tab.status).length,
  }));
}

function filterShippingPlanRecordsByStatusTab(
  records: ShippingPlanRecord[],
  activeTab: string,
) {
  if (activeTab === "all") {
    return records;
  }

  const matchedTab = shippingPlanStatusTabDefinitions.find((tab) => tab.value === activeTab);
  if (!matchedTab?.status) {
    return records;
  }

  return records.filter((record) => record.documentStatus === matchedTab.status);
}

const shippingPlanMockPlatforms = ["Amazon", "ebay", "Shopify", "Walmart", "TikTok", "Temu"] as const;
const shippingPlanMockStores = [
  "AMZ-US-028",
  "ebay测试店",
  "Shopify独立站",
  "Walmart-US店",
  "TikTok-US店",
  "Temu-EU店",
] as const;
const shippingPlanMockCreators = ["张三", "李四", "王五", "赵六", "陈七"] as const;
const shippingPlanMockRemarks = ["优先处理", "加急", "驳回后修改", "常规发货", "-"] as const;

const shippingPlanRecordOverrides: Record<string, Partial<ShippingPlanRecord>> = {
  "sp-023": {
    hasStaTask: true,
    staId: "sta-002",
    staNo: "STA-20260322-002",
    fbaShipmentCount: 2,
    flowStatus: "fba_created",
    deliveryMode: "FBA",
    documentStatus: "待处理",
  },
};

function createShippingPlanMockRecords(): ShippingPlanRecord[] {
  const statuses: ShippingPlanStatus[] = ["待提交", "待审批", "待处理", "已完成", "已驳回", "已作废"];

  return statuses.flatMap((documentStatus, statusIndex) =>
    Array.from({ length: 10 }, (_, itemIndex) => {
      const sequence = statusIndex * 10 + itemIndex + 1;
      const variant = sequence % 6;
      const day = String((sequence % 28) + 1).padStart(2, "0");
      const id = `sp-${String(sequence).padStart(3, "0")}`;

      return {
        id,
        planNo: `SP202603${day}${String(sequence).padStart(4, "0")}`,
        hasStaTask: false,
        fbaShipmentCount: 0,
        flowStatus: "none" as const,
        platform: shippingPlanMockPlatforms[variant],
        store: shippingPlanMockStores[variant],
        shipWarehouseType: variant % 2 === 0 ? "实体仓" : "虚拟仓",
        shipWarehouse: variant % 3 === 0 ? "AMZ-US-028仓" : "测试仓库101",
        receiveWarehouseType: variant % 2 === 0 ? "三方仓" : "实体仓",
        receiveWarehouse: ["FBA-ONT8", "FBA-YYZ4", "Walmart仓"][variant % 3],
        logisticsCycle: `2026-03-${day} ~ 2026-04-${String((variant % 9) + 1).padStart(2, "0")}`,
        deliveryMode: variant % 2 === 0 ? "FBA" : "海外仓",
        logisticsChannel: ["普快", "特快", "海运"][variant % 3],
        transportMode: variant % 2 === 0 ? "快递" : "海运",
        totalWeight: Number((45 + sequence * 13.5).toFixed(1)),
        totalVolume: Number((0.8 + sequence * 0.42).toFixed(2)),
        relatedStockOrderNo: `STO202603${day}${String(sequence).padStart(3, "0")}`,
        remark: shippingPlanMockRemarks[variant % shippingPlanMockRemarks.length],
        estimatedShipTime: `2026-03-${day}`,
        creator: shippingPlanMockCreators[variant % shippingPlanMockCreators.length],
        createdAt: `2026-03-${day} ${String(8 + (variant % 10)).padStart(2, "0")}:${String(variant * 7 % 60).padStart(2, "0")}`,
        updater: shippingPlanMockCreators[(variant + 1) % shippingPlanMockCreators.length],
        updatedAt: `2026-03-${day} ${String(10 + (variant % 8)).padStart(2, "0")}:${String((variant + 3) * 5 % 60).padStart(2, "0")}`,
        documentStatus,
        plannedQty: 120 * (sequence % 20 + 1),
        ...shippingPlanRecordOverrides[id],
      };
    }),
  );
}

export const initialShippingPlanRecords = createShippingPlanMockRecords();

function shippingPlanStatusTone(status: ShippingPlanStatus) {
  switch (status) {
    case "已完成":
      return "success";
    case "已驳回":
      return "error";
    case "已作废":
      return "closed";
    case "待审批":
      return "processing";
    case "待处理":
      return "pending";
    default:
      return "draft";
  }
}

function buildStockupGenerationResult(records: ShippingPlanRecord[]): StockupGenerationResult {
  const successItems: StockupGenerationSuccessItem[] = [];
  const failureItems: StockupGenerationFailureItem[] = [];

  records.forEach((record, index) => {
    if (index % 2 === 1) {
      failureItems.push({
        id: `${record.id}-failure`,
        planNo: record.planNo,
        store: record.store,
        receiveWarehouse: record.receiveWarehouse,
        qty: record.plannedQty,
        reason: index % 4 === 1
          ? "SKU 未维护第三方仓映射，无法生成备货单"
          : "收货仓库三方仓编码缺失，请维护仓库资料后重试",
      });
      return;
    }

    successItems.push({
      id: `${record.id}-success`,
      planNo: record.planNo,
      stockOrderNo: record.relatedStockOrderNo === "-" ? `STO-${record.id.toUpperCase()}` : record.relatedStockOrderNo,
      store: record.store,
      receiveWarehouse: record.receiveWarehouse,
      qty: record.plannedQty,
    });
  });

  return {
    selectedCount: records.length,
    successItems,
    failureItems,
  };
}

function StockupGenerationResultModal({
  result,
  onClose,
}: {
  result: StockupGenerationResult | null;
  onClose: () => void;
}) {
  if (!result) {
    return null;
  }

  const successCount = result.successItems.length;
  const failureCount = result.failureItems.length;
  const resultBadgeTone = failureCount === 0 ? "success" : successCount === 0 ? "error" : "pending";
  const resultBadgeLabel = failureCount === 0 ? "全部成功" : successCount === 0 ? "全部失败" : "部分成功";

  return (
    <Modal
      open={Boolean(result)}
      title="备货单生成结果"
      widthClassName="max-w-[min(100%,920px)] w-full"
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="rounded-md border border-warning/30 bg-warning/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-body font-medium text-text-primary">批量生成备货单已处理完成</div>
              <div className="mt-1 text-small text-text-secondary">
                本次选择 {result.selectedCount} 个待处理发货计划，按 1 个发货计划生成 1 个备货单执行。请根据失败原因处理后重试。
              </div>
            </div>
            <Badge tone={resultBadgeTone}>{resultBadgeLabel}</Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-success/30 bg-success/5 p-4">
            <div className="flex items-center gap-2 text-body font-medium text-success">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              成功 {successCount} 个
            </div>
            <div className="mt-1 text-small text-text-secondary">已生成备货单，可在列表中查看关联备货单号。</div>
          </div>
          <div className="rounded-md border border-error/30 bg-error/5 p-4">
            <div className="flex items-center gap-2 text-body font-medium text-error">
              <AlertTriangle aria-hidden="true" className="h-4 w-4" />
              失败 {failureCount} 个
            </div>
            <div className="mt-1 text-small text-text-secondary">以下明细未生成备货单，需要修复后重新发起。</div>
          </div>
        </div>

        <section className="space-y-2">
          <h3 className="text-body font-medium text-text-primary">成功明细</h3>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[620px] border-collapse text-left text-small">
              <thead className="bg-bg-page text-text-muted">
                <tr>
                  <th className={tableHeadCell}>发货计划单号</th>
                  <th className={tableHeadCell}>生成备货单号</th>
                  <th className={tableHeadCell}>店铺</th>
                  <th className={tableHeadCell}>收货仓库</th>
                  <th className={tableHeadCell}>数量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {result.successItems.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-text-primary">{item.planNo}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-primary">{item.stockOrderNo}</td>
                    <td className="whitespace-nowrap px-3 py-3">{item.store}</td>
                    <td className="whitespace-nowrap px-3 py-3">{item.receiveWarehouse}</td>
                    <td className="whitespace-nowrap px-3 py-3">{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-body font-medium text-text-primary">失败明细</h3>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[720px] border-collapse text-left text-small">
              <thead className="bg-bg-page text-text-muted">
                <tr>
                  <th className={tableHeadCell}>发货计划单号</th>
                  <th className={tableHeadCell}>店铺</th>
                  <th className={tableHeadCell}>收货仓库</th>
                  <th className={tableHeadCell}>数量</th>
                  <th className={tableHeadCell}>失败原因</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {result.failureItems.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-text-primary">{item.planNo}</td>
                    <td className="whitespace-nowrap px-3 py-3">{item.store}</td>
                    <td className="whitespace-nowrap px-3 py-3">{item.receiveWarehouse}</td>
                    <td className="whitespace-nowrap px-3 py-3">{item.qty}</td>
                    <td className="px-3 py-3 text-error">{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex justify-end gap-actions border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose}>关闭</Button>
          <Button variant="primary" onClick={onClose}>知道了</Button>
        </div>
      </div>
    </Modal>
  );
}

function StatusTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ label: string; value: string; count: number }>;
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-6 border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`-mb-px border-b-2 pb-3 text-body transition ${
              isActive
                ? "border-primary font-medium text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}({tab.count})
          </button>
        );
      })}
    </div>
  );
}

function EstimatedShipTimeField() {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  return (
    <FilterField widthClass="w-auto">
      <DateRangePicker value={dateRange} onChange={setDateRange} />
    </FilterField>
  );
}

export function ShippingPlanPage({
  records,
  onCreateStaTask,
  onViewStaTask,
  onShowAlert,
}: {
  records: ShippingPlanRecord[];
  onCreateStaTask?: (record: ShippingPlanRecord) => void;
  onViewStaTask?: (record: ShippingPlanRecord) => void;
  onShowAlert?: (notice: FloatingAlertInput) => void;
}) {
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [stockupGenerationResult, setStockupGenerationResult] = useState<StockupGenerationResult | null>(null);
  const statusTabs = useMemo(() => buildShippingPlanStatusTabs(records), [records]);
  const filteredRecords = useMemo(
    () => filterShippingPlanRecordsByStatusTab(records, activeStatusTab),
    [records, activeStatusTab],
  );
  const {
    page,
    pageSize,
    totalCount,
    totalPages,
    pagedItems,
    setPage,
    setPageSize,
  } = usePrototypePagination(filteredRecords, activeStatusTab);
  const rowIds = useMemo(() => pagedItems.map((record) => record.id), [pagedItems]);
  const selection = useListSelection(rowIds);
  const paginationProps: PrototypePaginationProps = {
    currentPage: page,
    totalPages,
    totalCount,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  };

  const selectedRecords = useMemo(
    () => pagedItems.filter((record) => selection.isSelected(record.id)),
    [pagedItems, selection],
  );
  const selectedCount = selectedRecords.length;
  const hasUnsupportedSelection = selectedRecords.some((record) => record.documentStatus !== "待处理");
  const canBatchCreateStockup = selectedCount > 0 && !hasUnsupportedSelection;

  function handleShippingPlanAction(action: string, record: ShippingPlanRecord) {
    if (action === "create-sta") {
      onCreateStaTask?.(record);
    }
  }

  function handleBatchCreateStockup() {
    if (selectedCount === 0) {
      onShowAlert?.({
        tone: "warning",
        title: "请先勾选发货计划。",
      });
      return;
    }

    if (!canBatchCreateStockup) {
      return;
    }

    setStockupGenerationResult(buildStockupGenerationResult(selectedRecords));
  }

  return (
    <div className="space-y-4">
      <Card>
        <StatusTabs tabs={statusTabs} active={activeStatusTab} onChange={setActiveStatusTab} />
        <div className="mt-4">
          <FilterBar>
            <FilterField widthClass="w-[148px]">
              <MultiSelect options={platformFilterOptions} placeholder="请选择平台" />
            </FilterField>
            <FilterField widthClass="w-[148px]">
              <MultiSelect options={storeFilterOptions} placeholder="请选择店铺" />
            </FilterField>
            <FilterField widthClass="w-[164px]">
              <MultiSelect options={shipWarehouseFilterOptions} placeholder="请选择发货仓库" />
            </FilterField>
            <FilterField widthClass="w-[180px]">
              <MultiSelect options={shipWarehouseTypeOptions} placeholder="请选择发货仓库类型" />
            </FilterField>
            <FilterField widthClass="w-[180px]">
              <MultiSelect options={receiveWarehouseTypeOptions} placeholder="请选择收货仓库类型" />
            </FilterField>
            <FilterField widthClass="w-[164px]">
              <MultiSelect options={receiveWarehouseFilterOptions} placeholder="请选择收货仓库" />
            </FilterField>
            <FilterField widthClass="w-[180px]">
              <MultiSelect options={logisticsChannelOptions} placeholder="请选择物流渠道" />
            </FilterField>
            <FilterField widthClass="w-[148px]">
              <MultiSelect options={transportModeOptions} placeholder="请选择运输方式" />
            </FilterField>
            <EstimatedShipTimeField />
            <FilterTimeRangeField
              timeTypeOptions={shippingPlanTimeTypeOptions}
              defaultTimeType="created-at"
              widthClass="min-w-[360px]"
            />
            <FilterField widthClass="w-auto">
              <KeywordSearchField
                fieldOptions={shippingPlanKeywordFieldOptions}
                defaultField="stock-order-no"
              />
            </FilterField>
            <FilterQueryActions />
          </FilterBar>
        </div>
      </Card>

      <Card>
        <ListToolbar
          primaryActions={
            <>
              <Button variant="primary" size="sm">创建发货计划</Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={hasUnsupportedSelection}
                title={
                  hasUnsupportedSelection
                      ? "仅支持状态=待处理的发货计划"
                      : undefined
                }
                onClick={handleBatchCreateStockup}
              >
                生成备货单
              </Button>
              <Button variant="secondary" size="sm">审批</Button>
              <Button variant="secondary" size="sm">作废</Button>
              <Button variant="secondary" size="sm">提交</Button>
            </>
          }
          importExportActions={
            <>
              <Button variant="secondary" size="sm">导入发货计划</Button>
              <Button variant="secondary" size="sm">导出</Button>
            </>
          }
        />
        <ScrollableTablePanel pagination={paginationProps}>
          <table className="w-full min-w-[3200px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={`w-10 ${tableHeadCell}`}>
                  <TableSelectAllCheckbox
                    checked={selection.allSelected}
                    indeterminate={selection.partiallySelected}
                    onChange={selection.toggleAll}
                  />
                </th>
                <th className={tableHeadCell}>发货计划单号</th>
                <th className={tableHeadCell}>平台</th>
                <th className={tableHeadCell}>店铺</th>
                <th className={tableHeadCell}>发货仓库类型</th>
                <th className={tableHeadCell}>发货仓库</th>
                <th className={tableHeadCell}>收货仓库类型</th>
                <th className={tableHeadCell}>收货仓库</th>
                <th className={tableHeadCell}>物流计划周期</th>
                <th className={tableHeadCell}>发货方式</th>
                <th className={tableHeadCell}>物流渠道</th>
                <th className={tableHeadCell}>运输方式</th>
                <th className={tableHeadCell}>总毛重(kg)</th>
                <th className={tableHeadCell}>总体积(m³)</th>
                <th className={tableHeadCell}>关联备货单号</th>
                <th className={tableHeadCell}>备注</th>
                <th className={tableHeadCell}>预计发货时间</th>
                <th className={tableHeadCell}>创建人/创建时间</th>
                <th className={tableHeadCell}>更新人/更新时间</th>
                <th className={tableHeadCell}>单据状态</th>
                <th className={tableHeadCell}>计划发货数量</th>
                <th className={tableHeadCell}>关联STA/FBA</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedItems.map((record) => (
                <tr key={record.id}>
                  <td className="px-3 py-3">
                    <TableRowCheckbox
                      checked={selection.isSelected(record.id)}
                      onChange={() => selection.toggleRow(record.id)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-primary">{record.planNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.platform}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.store}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.shipWarehouseType}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.shipWarehouse}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.receiveWarehouseType}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.receiveWarehouse}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsCycle}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.deliveryMode}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsChannel}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.transportMode}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.totalWeight}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.totalVolume}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.relatedStockOrderNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.remark}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.estimatedShipTime}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.creator}</div>
                    <div className="text-text-muted">{record.createdAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.updater}</div>
                    <div className="text-text-muted">{record.updatedAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <Badge tone={shippingPlanStatusTone(record.documentStatus)} className="shrink-0">
                      {record.documentStatus}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.plannedQty}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {record.hasStaTask ? (
                      <div className="space-y-1">
                        <div>
                          STA：
                          <ActionLinkButton onClick={() => onViewStaTask?.(record)}>
                            {record.staNo}
                          </ActionLinkButton>
                        </div>
                        {(record.fbaShipmentCount ?? 0) > 0 ? (
                          <div className="text-text-muted">FBA货件：{record.fbaShipmentCount} 个</div>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <ShippingPlanOperationCell
                    record={record}
                    onViewStaTask={onViewStaTask}
                    onAction={handleShippingPlanAction}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTablePanel>
      </Card>
      <StockupGenerationResultModal
        result={stockupGenerationResult}
        onClose={() => setStockupGenerationResult(null)}
      />
    </div>
  );
}

export function StaTaskPage({
  records,
  onEditStaTask,
  onViewStaTask,
}: {
  records: StaTaskRecord[];
  onEditStaTask?: (record: StaTaskRecord) => void;
  onViewStaTask?: (record: StaTaskRecord) => void;
}) {
  const {
    page,
    pageSize,
    totalCount,
    totalPages,
    pagedItems,
    setPage,
    setPageSize,
  } = usePrototypePagination(records);
  const rowIds = useMemo(() => pagedItems.map((record) => record.id), [pagedItems]);
  const selection = useListSelection(rowIds);
  const { isExpanded, toggleExpanded } = useProductExpandState();
  const paginationProps: PrototypePaginationProps = {
    currentPage: page,
    totalPages,
    totalCount,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  };

  return (
    <div className="space-y-4">
      <Card>
        <FilterBar>
          <FilterField widthClass="w-[148px]">
            <MultiSelect options={countryFilterOptions} placeholder="请选择国家" />
          </FilterField>
          <FilterField widthClass="w-[148px]">
            <MultiSelect options={storeFilterOptions} placeholder="请选择店铺" />
          </FilterField>
          <FilterField widthClass="w-[148px]">
            <MultiSelect options={staStatusFilterOptions} placeholder="请选择状态" />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <MultiSelect options={currentStepFilterOptions} placeholder="请选择当前步骤" />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <Select
              defaultValue=""
              placeholder="请选择分仓方式"
              options={warehouseSplitFilterOptions}
            />
          </FilterField>
          <FilterTimeRangeField
            timeTypeOptions={staTimeTypeOptions}
            defaultTimeType="created-at"
            widthClass="min-w-[360px]"
          />
          <FilterField widthClass="w-auto">
            <KeywordSearchField
              fieldOptions={staKeywordFieldOptions}
              defaultField="task-name"
            />
          </FilterField>
          <FilterQueryActions />
        </FilterBar>
      </Card>

      <Card>
        <ListToolbar
          importExportActions={<Button variant="secondary" size="sm">导出装箱清单</Button>}
        />
        <ScrollableTablePanel pagination={paginationProps}>
          <table className="w-full min-w-[1180px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={`w-10 ${tableHeadCell}`}>
                  <TableSelectAllCheckbox
                    checked={selection.allSelected}
                    indeterminate={selection.partiallySelected}
                    onChange={selection.toggleAll}
                  />
                </th>
                <th className={tableHeadCell}>图片</th>
                <th className={tableHeadCell}>MSKU</th>
                <th className={tableHeadCell}>FNSKU</th>
                <th className={tableHeadCell}>ASIN</th>
                <th className={tableHeadCell}>中文品名</th>
                <th className={tableHeadCell}>SKU</th>
                <th className={tableHeadCell}>申报量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedItems.map((record, index) => {
                const products = buildStaListProducts(record);
                const expanded = isExpanded(record.id);
                const visibleProducts = expanded
                  ? products
                  : products.slice(0, LIST_PRODUCTS_INITIAL_VISIBLE);
                const remainingCount = products.length - LIST_PRODUCTS_INITIAL_VISIBLE;

                return (
                <Fragment key={record.id}>
                  <tr className={index === 0 ? "bg-primary-subtle/40" : "bg-bg-page/70"}>
                    <td className="px-3 py-3">
                      <TableRowCheckbox
                        checked={selection.isSelected(record.id)}
                        onChange={() => selection.toggleRow(record.id)}
                      />
                    </td>
                    <td colSpan={7} className="px-3 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                            <ActionLinkButton onClick={() => onViewStaTask?.(record)}>
                              <span className="font-medium">
                                {record.taskName?.trim() || record.staNo}
                              </span>
                            </ActionLinkButton>
                            <span>店铺：{record.store}</span>
                            {record.planNo ? <span>发货计划：{record.planNo}</span> : null}
                            <span>物流中心编号：SCK1/CHO1</span>
                          </div>
                          <div className="mt-1 text-text-muted">
                            最近更新时间：XXX更新XXX　创建人：XXX创建人名称XXX　创建时间：XXX创建人名称XXX
                          </div>
                        </div>
                        <StaTaskGroupHeaderActions
                          record={record}
                          onView={onViewStaTask}
                          onAction={(action, item) => {
                            if (action === "edit") {
                              onEditStaTask?.(item);
                            }
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                  {visibleProducts.map((product) => (
                    <StaListProductTableRow key={product.id} product={product} />
                  ))}
                  <ExpandProductsRow
                    remainingCount={remainingCount}
                    expanded={expanded}
                    onToggle={() => toggleExpanded(record.id)}
                    colSpan={8}
                  />
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </ScrollableTablePanel>
      </Card>
    </div>
  );
}

export function FbaShipmentPage({
  records,
  onEditFbaShipment,
  onViewFbaShipment,
}: {
  records: FbaShipmentRecord[];
  onEditFbaShipment?: (record: FbaShipmentRecord) => void;
  onViewFbaShipment?: (record: FbaShipmentRecord) => void;
}) {
  const {
    page,
    pageSize,
    totalCount,
    totalPages,
    pagedItems,
    setPage,
    setPageSize,
  } = usePrototypePagination(records);
  const rowIds = useMemo(() => pagedItems.map((record) => record.id), [pagedItems]);
  const selection = useListSelection(rowIds);
  const { isExpanded, toggleExpanded } = useProductExpandState();
  const paginationProps: PrototypePaginationProps = {
    currentPage: page,
    totalPages,
    totalCount,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
  };

  return (
    <div className="space-y-4">
      <Card>
        <FilterBar>
          <FilterField widthClass="w-[148px]">
            <MultiSelect options={countryFilterOptions} placeholder="请选择国家" />
          </FilterField>
          <FilterField widthClass="w-[148px]">
            <MultiSelect options={storeFilterOptions} placeholder="请选择店铺" />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <Select
              defaultValue=""
              placeholder="请选择货件类型"
              options={fbaShipmentTypeOptions}
            />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <FbaShipmentStatusMultiSelect />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <Select
              defaultValue=""
              placeholder="请选择申收差异"
              options={fbaDeclareReceiveDiffOptions}
            />
          </FilterField>
          <FilterField widthClass="w-[164px]">
            <Select
              defaultValue=""
              placeholder="请选择创建人"
              options={creatorFilterOptions}
            />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <MultiSelect options={trackingNumberFilterOptions} placeholder="请选择跟踪编号" />
          </FilterField>
          <FilterTimeRangeField
            timeTypeOptions={fbaTimeTypeOptions}
            defaultTimeType="created-at"
          />
          <FilterField widthClass="w-auto">
            <KeywordSearchField
              fieldOptions={fbaKeywordFieldOptions}
              defaultField="sta-name"
            />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <MultiSelect options={fbaCurrentStepFilterOptions} placeholder="请选择当前步骤" />
          </FilterField>
          <FilterField widthClass="w-[212px]">
            <MultiSelect
              options={fbaCompletionStatusFilterOptions}
              placeholder="请选择货件完成状态"
            />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <MultiSelect options={packingStatusFilterOptions} placeholder="请选择装箱情况" />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <MultiSelect options={fbaDiffFilterOptions} placeholder="请选择申发差异" />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <MultiSelect options={fbaDiffFilterOptions} placeholder="请选择收发差异" />
          </FilterField>
          <FilterQueryActions />
        </FilterBar>
      </Card>

      <Card>
        <ListToolbar
          primaryActions={<Button variant="secondary" size="sm">同步货件</Button>}
          importExportActions={<Button variant="secondary" size="sm">导出装箱清单</Button>}
        />
        <ScrollableTablePanel pagination={paginationProps}>
            <table className="w-full min-w-[1280px] border-collapse text-left text-small">
              <thead className="bg-bg-page text-text-muted">
                <tr>
                  <th className={`w-10 ${tableHeadCell}`}>
                    <TableSelectAllCheckbox
                      checked={selection.allSelected}
                      indeterminate={selection.partiallySelected}
                      onChange={selection.toggleAll}
                    />
                  </th>
                  <th className={tableHeadCell}>图片</th>
                  <th className={tableHeadCell}>MSKU</th>
                  <th className={tableHeadCell}>FNSKU</th>
                  <th className={tableHeadCell}>ASIN</th>
                  <th className={tableHeadCell}>中文品名</th>
                  <th className={tableHeadCell}>SKU</th>
                  <th className={tableHeadCell}>申报量</th>
                  <th className={tableHeadCell}>已发货</th>
                  <th className={tableHeadCell}>签收量</th>
                  <th className={tableHeadCell}>申发差异</th>
                  <th className={tableHeadCell}>收发差异</th>
                  <th className={tableHeadCell}>申收差异</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {pagedItems.map((record, index) => {
                  const products = buildFbaListProducts(record);
                  const expanded = isExpanded(record.id);
                  const visibleProducts = expanded
                    ? products
                    : products.slice(0, LIST_PRODUCTS_INITIAL_VISIBLE);
                  const remainingCount = products.length - LIST_PRODUCTS_INITIAL_VISIBLE;

                  return (
                    <Fragment key={record.id}>
                      <tr className={index === 0 ? "bg-primary-subtle/40" : "bg-bg-page/70"}>
                        <td className="px-3 py-3">
                          <TableRowCheckbox
                            checked={selection.isSelected(record.id)}
                            onChange={() => selection.toggleRow(record.id)}
                          />
                        </td>
                        <td colSpan={12} className="px-3 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                <span className="inline-flex items-center gap-2 font-medium text-primary">
                                  {record.shipmentId}
                                  {record.hasStaTask ? <StaTaskBadge /> : null}
                                </span>
                                <span>STA任务：{record.hasStaTask ? record.staNo : "-"}</span>
                                <span>物流中心编号：{record.destinationFc}</span>
                                <span>店铺：{record.store}</span>
                                <span>Reference Id：{record.referenceId ?? "6KHVPYPS"}</span>
                              </div>
                              <div className="mt-1 text-text-muted">
                                店铺：{record.storeCode ?? "Shenghan店铺编码XXX"}　创建人：{record.creator ?? "XXX"}　创建时间：
                                {record.createdAt ?? "2026-04-29 17:11"}　运输类型：{record.transportType ?? "XXX"}
                              </div>
                            </div>
                            <FbaShipmentGroupHeaderActions
                              record={record}
                              onView={onViewFbaShipment}
                              onAction={(action, item) => {
                                if (action === "edit") {
                                  onEditFbaShipment?.(item);
                                }
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                      {visibleProducts.map((product) => (
                        <FbaListProductTableRow key={product.id} product={product} />
                      ))}
                      <ExpandProductsRow
                        remainingCount={remainingCount}
                        expanded={expanded}
                        onToggle={() => toggleExpanded(record.id)}
                        colSpan={13}
                      />
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
        </ScrollableTablePanel>
      </Card>
    </div>
  );
}
