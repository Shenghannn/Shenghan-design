import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DateRangePicker, type DateRangeValue } from "../components/ui/date-range-picker";
import { ExclusiveFilterGroup, useExclusiveFilterPanel } from "../components/ui/exclusive-filter-group";
import { Input } from "../components/ui/input";
import { MultiSelectFilter } from "../components/ui/multi-select-filter";
import { Modal } from "../components/ui/modal";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

type ShippingMode = "整柜" | "散货";
type FirstLegOrderStatus = "待提交" | "已驳回" | "已提交" | "已完成";

type FirstLegOrderRecord = {
  id: string;
  firstLegNo: string;
  logisticsPlanNo: string;
  shippingMode: ShippingMode;
  transportMode: string;
  logisticsChannel: string;
  boxCount: number;
  totalQty: number;
  totalGrossWeight: number;
  totalVolume: number;
  updater: string;
  updatedAt: string;
  creator: string;
  insertedAt: string;
  remark: string;
  status: FirstLegOrderStatus;
};

type LogisticsPlanOption = {
  planNo: string;
  shippingMode: ShippingMode;
  logisticsProvider: string;
  transportMode: string;
  logisticsChannel: string;
  providerOrderNo: string;
  skuTypeCount: number;
  totalPlannedQty: number;
  relatedStockupNos: string[];
  totalGrossWeight: number;
  totalVolume: number;
  remark: string;
  overseasInboundNos: string[];
  pickupMethod: string;
  addressType: string;
  warehouseName: string;
  country: string;
  province: string;
  city: string;
  zipCode: string;
  address1: string;
  address2: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
};

type StockupOption = {
  stockupNo: string;
  overseasInboundNo: string;
  disabled?: boolean;
};

type PackingLine = {
  id: string;
  stockupNo: string;
  boxNo: string;
  referenceId: string;
  sku: string;
  cnName: string;
  enName: string;
  hsCode: string;
  qtyPerBox: number;
  declarePrice: string;
  material: string;
  usage: string;
  asinLink: string;
  length: number;
  width: number;
  height: number;
  volume: number;
  netWeight: number | "";
  grossWeight: number;
  image: string;
  remark: string;
  hasBattery?: boolean;
  hasMagnet?: boolean;
  isLiquid?: boolean;
  isPowder?: boolean;
  isPaste?: boolean;
  isTextile?: boolean;
};

const tableHeadCell = "whitespace-nowrap px-3 py-3 text-left text-small font-medium";
const pageSizeOptions = [10, 20, 30, 50, 100];
const currentUser = "兰轩";

const transportModeOptions = ["海运", "空运", "快递", "卡派"];
const logisticsChannelOptions = ["美南标快", "美西海派", "欧洲快线", "加拿大卡派", "美东快递"];
const operatorOptions = ["兰轩", "周婷婷", "李莎丽", "张晓莹", "超级管理员"];
const pickupMethodOptions = ["上门提货", "自送到厂", "工厂装货（柜）"];
const addressTypeOptions = ["FBA仓", "第三方海外仓", "私人地址"];
const warehouseOptions = [
  { type: "FBA仓", name: "FBA-ONT8" },
  { type: "FBA仓", name: "FBA-YYZ4" },
  { type: "第三方海外仓", name: "Walmart仓" },
  { type: "第三方海外仓", name: "测试仓库101" },
  { type: "私人地址", name: "私人地址-洛杉矶" },
];
const countryOptions = ["US", "CA", "DE", "GB"];
const customsMethodOptions = ["包换退税", "买单报关", "买单+报关退税"];
const taxMethodOptions = ["报税", "不包税", "自税递延", "自税不递延"];
const currencyOptions = ["USD", "CNY", "EUR", "CAD"];
const batchEditableFieldLabels = {
  hsCode: "海关编码",
  declarePrice: "申报价格",
  material: "材质",
  usage: "用途",
  asinLink: "ASIN/销售链接",
  netWeight: "净重",
  remark: "备注",
} as const;
const defaultPlanRecipient = {
  pickupMethod: "上门提货",
  addressType: "FBA仓",
  warehouseName: "FBA-ONT8",
  country: "US",
  province: "CA",
  city: "Los Angeles",
  zipCode: "90001",
  address1: "123 Demo Warehouse Rd",
  address2: "",
  company: "Demo Logistics LLC",
  contact: "Linda",
  phone: "13800000000",
  email: "ops@example.com",
};
const defaultPlanSummary = {
  logisticsProvider: "义乌风驰国际物流",
  providerOrderNo: "YWFH26060001",
  skuTypeCount: 2,
  totalPlannedQty: 40,
  relatedStockupNos: ["SO2606040001", "SO2606040002"],
  totalGrossWeight: 58.4,
  totalVolume: 0.13,
  remark: "用于头程物流订单演示",
};

const logisticsPlanOptions: LogisticsPlanOption[] = [
  { ...defaultPlanRecipient, ...defaultPlanSummary, planNo: "LP260409000001", shippingMode: "整柜", transportMode: "海运", logisticsChannel: "美南标快", overseasInboundNos: ["OWS2606040001", "OWS2606040002"] },
  { ...defaultPlanRecipient, ...defaultPlanSummary, planNo: "LP260410000002", shippingMode: "散货", transportMode: "海运", logisticsChannel: "美西海派", providerOrderNo: "YWFH26060002", skuTypeCount: 1, totalPlannedQty: 12, relatedStockupNos: ["SO2606050001"], totalGrossWeight: 12.4, totalVolume: 0.03, overseasInboundNos: ["OWS2606050001"], warehouseName: "Walmart仓" },
  { ...defaultPlanRecipient, ...defaultPlanSummary, planNo: "LP260411000003", shippingMode: "整柜", transportMode: "海运", logisticsChannel: "加拿大卡派", logisticsProvider: "宁波安达供应链", providerOrderNo: "NBAD26060003", skuTypeCount: 3, totalPlannedQty: 120, relatedStockupNos: ["SO2606060001"], totalGrossWeight: 210, totalVolume: 8.6, overseasInboundNos: [], country: "CA", province: "ON", city: "Toronto", zipCode: "M9W 5L7" },
  { ...defaultPlanRecipient, ...defaultPlanSummary, planNo: "LP260412000004", shippingMode: "散货", transportMode: "空运", logisticsChannel: "欧洲快线", logisticsProvider: "深圳海翼物流", providerOrderNo: "SZHY26060004", skuTypeCount: 2, totalPlannedQty: 35, relatedStockupNos: ["SO2606050001"], totalGrossWeight: 152.7, totalVolume: 4.8, overseasInboundNos: ["OWS2606050001"], country: "DE", province: "HE", city: "Frankfurt", zipCode: "60549", warehouseName: "测试仓库101" },
  { ...defaultPlanRecipient, ...defaultPlanSummary, planNo: "LP2606040004", shippingMode: "整柜", transportMode: "海运", logisticsChannel: "美南标快", overseasInboundNos: ["OWS2606040001", "OWS2606040002"] },
  { ...defaultPlanRecipient, ...defaultPlanSummary, planNo: "LP2606050001", shippingMode: "散货", transportMode: "空运", logisticsChannel: "欧洲快线", logisticsProvider: "深圳海翼物流", providerOrderNo: "SZHY26060005", skuTypeCount: 1, totalPlannedQty: 10, relatedStockupNos: ["SO2606050001"], totalGrossWeight: 12.4, totalVolume: 0.03, overseasInboundNos: ["OWS2606050001"], country: "DE", province: "HE", city: "Frankfurt", zipCode: "60549", warehouseName: "测试仓库101" },
  { ...defaultPlanRecipient, ...defaultPlanSummary, planNo: "LP2606060002", shippingMode: "整柜", transportMode: "海运", logisticsChannel: "加拿大卡派", logisticsProvider: "宁波安达供应链", providerOrderNo: "NBAD26060006", skuTypeCount: 3, totalPlannedQty: 120, relatedStockupNos: ["SO2606060001"], totalGrossWeight: 210, totalVolume: 8.6, overseasInboundNos: [], country: "CA", province: "ON", city: "Toronto", zipCode: "M9W 5L7" },
];

const stockupOptionsByPlan: Record<string, StockupOption[]> = {
  LP260409000001: [
    { stockupNo: "SO2606040001", overseasInboundNo: "OWS2606040001" },
    { stockupNo: "SO2606040002", overseasInboundNo: "OWS2606040002" },
  ],
  LP260410000002: [{ stockupNo: "SO2606050001", overseasInboundNo: "OWS2606050001" }],
  LP260411000003: [{ stockupNo: "SO2606060001", overseasInboundNo: "" }],
  LP260412000004: [{ stockupNo: "SO2606050001", overseasInboundNo: "OWS2606050001" }],
  LP2606040004: [
    { stockupNo: "SO2606040001", overseasInboundNo: "OWS2606040001" },
    { stockupNo: "SO2606040002", overseasInboundNo: "OWS2606040002" },
    { stockupNo: "SO2606040003", overseasInboundNo: "OWS2606040003", disabled: true },
  ],
  LP2606050001: [{ stockupNo: "SO2606050001", overseasInboundNo: "OWS2606050001" }],
  LP2606060002: [{ stockupNo: "SO2606060001", overseasInboundNo: "" }],
};

const packingLinesByStockup: Record<string, PackingLine[]> = {
  SO2606040001: [
    {
      id: "pk-001",
      stockupNo: "SO2606040001",
      boxNo: "0001",
      referenceId: "OWS2606040001_0001",
      sku: "JN-CI04-00000028",
      cnName: "车载充气泵",
      enName: "Portable Air Pump",
      hsCode: "8414809090",
      qtyPerBox: 10,
      declarePrice: "8.50",
      material: "ABS+电子元件",
      usage: "汽车应急充气",
      asinLink: "B0TEST0001",
      length: 45,
      width: 36,
      height: 28,
      volume: 0.05,
      netWeight: 8.2,
      grossWeight: 9.6,
      image: "",
      remark: "",
      hasBattery: true,
    },
    {
      id: "pk-002",
      stockupNo: "SO2606040001",
      boxNo: "0001",
      referenceId: "OWS2606040001_0001",
      sku: "JN-CI04-00000025",
      cnName: "补胎工具套装",
      enName: "Tire Repair Kit",
      hsCode: "8206000000",
      qtyPerBox: 20,
      declarePrice: "3.20",
      material: "金属+橡胶",
      usage: "轮胎维修",
      asinLink: "B0TEST0002",
      length: 45,
      width: 36,
      height: 28,
      volume: 0.05,
      netWeight: 6.4,
      grossWeight: 7.8,
      image: "",
      remark: "",
      hasMagnet: true,
    },
  ],
  SO2606040002: [
    {
      id: "pk-003",
      stockupNo: "SO2606040002",
      boxNo: "0002",
      referenceId: "OWS2606040002_0002",
      sku: "JN-CI04-00000031",
      cnName: "汽车清洁剂",
      enName: "Car Cleaner",
      hsCode: "3402900090",
      qtyPerBox: 12,
      declarePrice: "4.10",
      material: "液体清洁剂",
      usage: "汽车清洁",
      asinLink: "B0TEST0003",
      length: 40,
      width: 30,
      height: 26,
      volume: 0.03,
      netWeight: "",
      grossWeight: 12.4,
      image: "",
      remark: "",
      isLiquid: true,
    },
  ],
};

const firstLegOrderRecords: FirstLegOrderRecord[] = [
  {
    id: "flo-001",
    firstLegNo: "FL260410123456",
    logisticsPlanNo: "LP260409000001",
    shippingMode: "整柜",
    transportMode: "海运",
    logisticsChannel: "美南标快",
    boxCount: 128,
    totalQty: 12800,
    totalGrossWeight: 16800,
    totalVolume: 62.4,
    updater: "兰轩",
    updatedAt: "2026-04-10 15:28",
    creator: "兰轩",
    insertedAt: "2026-04-10 09:12",
    remark: "美南整柜头程，关联多张备货单，优先走测试仓库装柜。",
    status: "待提交",
  },
  {
    id: "flo-002",
    firstLegNo: "FL260411123457",
    logisticsPlanNo: "LP260410000002",
    shippingMode: "散货",
    transportMode: "海运",
    logisticsChannel: "美西海派",
    boxCount: 46,
    totalQty: 4200,
    totalGrossWeight: 5200,
    totalVolume: 28.6,
    updater: "周婷婷",
    updatedAt: "2026-04-11 11:08",
    creator: "张晓莹",
    insertedAt: "2026-04-11 10:20",
    remark: "散货渠道，备注较长时列表最多展示两行，鼠标移入后展示完整内容，避免表格高度被撑开。",
    status: "已提交",
  },
  {
    id: "flo-003",
    firstLegNo: "FL260412123458",
    logisticsPlanNo: "LP260411000003",
    shippingMode: "整柜",
    transportMode: "海运",
    logisticsChannel: "加拿大卡派",
    boxCount: 0,
    totalQty: 0,
    totalGrossWeight: 0,
    totalVolume: 0,
    updater: "李莎丽",
    updatedAt: "2026-04-12 16:32",
    creator: "李莎丽",
    insertedAt: "2026-04-12 14:06",
    remark: "未关联备货单，暂无装箱信息。",
    status: "已驳回",
  },
  {
    id: "flo-004",
    firstLegNo: "FL260413123459",
    logisticsPlanNo: "LP260412000004",
    shippingMode: "散货",
    transportMode: "空运",
    logisticsChannel: "欧洲快线",
    boxCount: 72,
    totalQty: 3600,
    totalGrossWeight: 4100,
    totalVolume: 18.2,
    updater: "超级管理员",
    updatedAt: "2026-04-13 18:45",
    creator: "兰轩",
    insertedAt: "2026-04-13 09:40",
    remark: "欧洲空运散货订单，时效优先。",
    status: "已完成",
  },
];

function emptyRange(): DateRangeValue {
  return { start: "", end: "" };
}

function optionList(values: string[]) {
  return values.map((value) => ({ label: value, value }));
}

function parseBatchValues(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function isAlphaNumericList(values: string[]) {
  return values.every((value) => /^[A-Za-z0-9]+$/.test(value));
}

function inDateRange(dateText: string, range: DateRangeValue) {
  const date = dateText.slice(0, 10);
  if (range.start && date < range.start) {
    return false;
  }
  if (range.end && date > range.end) {
    return false;
  }
  return true;
}

function FormRow({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-[118px] shrink-0 text-right text-small text-text-secondary">
        {required ? <span className="mr-1 text-danger">*</span> : null}
        {label}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <div className="border-l-4 border-primary pl-3 font-medium text-text-primary">{children}</div>;
}

function ReadonlyValue({ value }: { value: string | number }) {
  return <div className="min-h-input-md px-0 py-1.5 text-small text-text-primary">{value || "-"}</div>;
}

function DisabledFieldValue({ value, placeholder = "-" }: { value: string | number; placeholder?: string }) {
  return <Input value={value} placeholder={placeholder} disabled className="bg-bg-page text-text-secondary" />;
}

function EditableTableHead({
  title,
  field,
  readonly,
  disabled,
  onEdit,
}: {
  title: string;
  field: keyof typeof batchEditableFieldLabels;
  readonly: boolean;
  disabled: boolean;
  onEdit: (field: keyof typeof batchEditableFieldLabels) => void;
}) {
  return (
    <th className={tableHeadCell}>
      <div className="flex items-center gap-2">
        <span>{title}</span>
        {!readonly ? (
          <button
            type="button"
            className="border-0 bg-transparent p-0 text-mini text-primary hover:underline disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:no-underline"
            disabled={disabled}
            onClick={() => onEdit(field)}
          >
            批量编辑
          </button>
        ) : null}
      </div>
    </th>
  );
}

type FirstLegWorkspaceTab =
  | "first-leg-logistics-order"
  | "first-leg-logistics-order-create"
  | "first-leg-logistics-order-edit"
  | "first-leg-logistics-order-detail";

function uniqueBoxCount(lines: PackingLine[]) {
  return new Set(lines.map((line) => `${line.stockupNo}-${line.boxNo}`)).size;
}

function yesNo(value: boolean | undefined, hasPacking: boolean) {
  if (!hasPacking) {
    return "-";
  }
  return value ? "是" : "否";
}

function buildOrderNo() {
  return "FL260410123456";
}

export function FirstLegLogisticsOrderPage({
  activeWorkspaceTab = "first-leg-logistics-order",
  onOpenWorkspaceTab,
}: {
  activeWorkspaceTab?: string;
  onOpenWorkspaceTab?: (tab: FirstLegWorkspaceTab) => void;
}) {
  const [view, setView] = useState<"list" | "create" | "edit" | "detail">("list");
  const [activeRecordId, setActiveRecordId] = useState(firstLegOrderRecords[0]?.id ?? "");
  const [logisticsPlanNos, setLogisticsPlanNos] = useState<string[]>([]);
  const [firstLegNos, setFirstLegNos] = useState<string[]>([]);
  const [shippingMode, setShippingMode] = useState("");
  const [transportModes, setTransportModes] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [createdRange, setCreatedRange] = useState<DateRangeValue>(emptyRange());
  const [updatedRange, setUpdatedRange] = useState<DateRangeValue>(emptyRange());
  const [creators, setCreators] = useState<string[]>([]);
  const [updaters, setUpdaters] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRecords = useMemo(() => {
    return firstLegOrderRecords.filter((record) => {
      const matchesPlanNo = logisticsPlanNos.length === 0 || logisticsPlanNos.includes(record.logisticsPlanNo);
      const matchesFirstLegNo = firstLegNos.length === 0 || firstLegNos.includes(record.firstLegNo);
      const matchesShippingMode = !shippingMode || record.shippingMode === shippingMode;
      const matchesTransport = transportModes.length === 0 || transportModes.includes(record.transportMode);
      const matchesChannel = channels.length === 0 || channels.includes(record.logisticsChannel);
      const matchesCreated = inDateRange(record.insertedAt, createdRange);
      const matchesUpdated = inDateRange(record.updatedAt, updatedRange);
      const matchesCreator = creators.length === 0 || creators.includes(record.creator);
      const matchesUpdater = updaters.length === 0 || updaters.includes(record.updater);

      return (
        matchesPlanNo &&
        matchesFirstLegNo &&
        matchesShippingMode &&
        matchesTransport &&
        matchesChannel &&
        matchesCreated &&
        matchesUpdated &&
        matchesCreator &&
        matchesUpdater
      );
    });
  }, [channels, createdRange, creators, firstLegNos, logisticsPlanNos, shippingMode, transportModes, updatedRange, updaters]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeRecord = firstLegOrderRecords.find((record) => record.id === activeRecordId) ?? firstLegOrderRecords[0];

  useEffect(() => {
    if (activeWorkspaceTab === "first-leg-logistics-order") {
      setView("list");
    }
    if (activeWorkspaceTab === "first-leg-logistics-order-create") {
      setView("create");
    }
    if (activeWorkspaceTab === "first-leg-logistics-order-edit") {
      setView("edit");
    }
    if (activeWorkspaceTab === "first-leg-logistics-order-detail") {
      setView("detail");
    }
  }, [activeWorkspaceTab]);

  function resetFilters() {
    setLogisticsPlanNos([]);
    setFirstLegNos([]);
    setShippingMode("");
    setTransportModes([]);
    setChannels([]);
    setCreatedRange(emptyRange());
    setUpdatedRange(emptyRange());
    setCreators([]);
    setUpdaters([]);
    setPage(1);
  }

  function openCreate() {
    setView("create");
    onOpenWorkspaceTab?.("first-leg-logistics-order-create");
  }

  function openEdit(record: FirstLegOrderRecord) {
    setActiveRecordId(record.id);
    setView("edit");
    onOpenWorkspaceTab?.("first-leg-logistics-order-edit");
  }

  function openDetail(record: FirstLegOrderRecord) {
    setActiveRecordId(record.id);
    setView("detail");
    onOpenWorkspaceTab?.("first-leg-logistics-order-detail");
  }

  function backToList() {
    setView("list");
    onOpenWorkspaceTab?.("first-leg-logistics-order");
  }

  if (view === "create") {
    return <FirstLegLogisticsOrderForm mode="create" onBack={backToList} onSubmit={backToList} />;
  }

  if (view === "edit" && activeRecord) {
    return <FirstLegLogisticsOrderForm mode="edit" record={activeRecord} onBack={backToList} onSubmit={backToList} />;
  }

  if (view === "detail" && activeRecord) {
    return <FirstLegLogisticsOrderForm mode="detail" record={activeRecord} onBack={backToList} onSubmit={backToList} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <ExclusiveFilterGroup>
        <div className="flex flex-wrap items-end gap-3">
          <FilterItem label="物流计划单" widthClass="w-[200px]">
            <BatchExactSearch
              title="批量搜索物流计划单"
              placeholder="一项一行"
              values={logisticsPlanNos}
              onChange={(values) => {
                setLogisticsPlanNos(values);
                setPage(1);
              }}
            />
          </FilterItem>
          <FilterItem label="头程物流单" widthClass="w-[200px]">
            <BatchExactSearch
              title="批量搜索头程物流单"
              placeholder="一项一行"
              values={firstLegNos}
              onChange={(values) => {
                setFirstLegNos(values);
                setPage(1);
              }}
            />
          </FilterItem>
          <FilterItem label="发货方式" widthClass="w-[148px]">
            <Select
              value={shippingMode}
              placeholder="全部发货方式"
              options={[
                { label: "整柜", value: "整柜" },
                { label: "散货", value: "散货" },
              ]}
              onValueChange={(value) => {
                setShippingMode(value);
                setPage(1);
              }}
            />
          </FilterItem>
          <FilterItem label="运输方式" widthClass="w-[180px]">
            <MultiSelectFilter display="tags" clearable placeholder="全部运输方式" options={transportModeOptions} value={transportModes} onChange={setTransportModes} />
          </FilterItem>
          <FilterItem label="物流渠道" widthClass="w-[180px]">
            <MultiSelectFilter display="tags" clearable placeholder="全部物流渠道" options={logisticsChannelOptions} value={channels} onChange={setChannels} />
          </FilterItem>
          <FilterItem label="创建时间" widthClass="w-[280px]">
            <DateRangePicker value={createdRange} onChange={setCreatedRange} />
          </FilterItem>
          <FilterItem label="更新时间" widthClass="w-[280px]">
            <DateRangePicker value={updatedRange} onChange={setUpdatedRange} />
          </FilterItem>
          <FilterItem label="创建人" widthClass="w-[180px]">
            <MultiSelectFilter display="tags" clearable placeholder="全部创建人" options={operatorOptions} value={creators} onChange={setCreators} />
          </FilterItem>
          <FilterItem label="更新人" widthClass="w-[180px]">
            <MultiSelectFilter display="tags" clearable placeholder="全部更新人" options={operatorOptions} value={updaters} onChange={setUpdaters} />
          </FilterItem>
          <div className="flex shrink-0 items-center gap-2 pb-0.5">
            <Button variant="primary" size="sm">查询</Button>
            <Button variant="secondary" size="sm" onClick={resetFilters}>重置</Button>
          </div>
        </div>
        </ExclusiveFilterGroup>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm" onClick={openCreate}>创建头程物流订单</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm">导出Excel</Button>
            <Button variant="secondary" size="sm">导出PDF</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1900px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>头程物流单号</th>
                <th className={tableHeadCell}>物流计划单号</th>
                <th className={tableHeadCell}>发货方式</th>
                <th className={tableHeadCell}>运输方式</th>
                <th className={tableHeadCell}>物流渠道</th>
                <th className={tableHeadCell}>箱数</th>
                <th className={tableHeadCell}>总发货数量</th>
                <th className={tableHeadCell}>总毛重</th>
                <th className={tableHeadCell}>总体积</th>
                <th className={tableHeadCell}>更新人</th>
                <th className={tableHeadCell}>更新时间</th>
                <th className={tableHeadCell}>创建人</th>
                <th className={tableHeadCell}>插入时间</th>
                <th className={tableHeadCell}>备注</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-primary">{record.firstLegNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsPlanNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.shippingMode}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.transportMode}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsChannel}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.boxCount}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.totalQty}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.totalGrossWeight}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.totalVolume}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.updater}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.updatedAt}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.creator}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.insertedAt}</td>
                  <td className="max-w-[220px] px-3 py-3">
                    <div className="line-clamp-2 text-text-secondary" title={record.remark}>{record.remark || "-"}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button type="button" className="mr-3 border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openEdit(record)}>
                      编辑
                    </button>
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openDetail(record)}>详情</button>
                  </td>
                </tr>
              ))}
              {pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-3 py-10 text-center text-text-muted">暂无头程物流单数据</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalCount={filteredRecords.length}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          showTopBorder
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </Card>
    </div>
  );
}

function FirstLegLogisticsOrderForm({
  mode,
  record,
  onBack,
  onSubmit,
}: {
  mode: "create" | "edit" | "detail";
  record?: FirstLegOrderRecord;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const initialPlan = logisticsPlanOptions.find((item) => item.planNo === record?.logisticsPlanNo) ?? null;
  const isReadonly = mode === "detail";
  const [selectedPlan, setSelectedPlan] = useState<LogisticsPlanOption | null>(initialPlan);
  const [selectedStockups, setSelectedStockups] = useState<string[]>(initialPlan ? stockupOptionsByPlan[initialPlan.planNo]?.slice(0, 2).map((item) => item.stockupNo) ?? [] : []);
  const [packingLines, setPackingLines] = useState<PackingLine[]>(() =>
    initialPlan
      ? selectedStockupLines(stockupOptionsByPlan[initialPlan.planNo]?.slice(0, 2).map((item) => item.stockupNo) ?? [])
      : [],
  );
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [stockupModalOpen, setStockupModalOpen] = useState(false);
  const [planKeyword, setPlanKeyword] = useState("");
  const [draftPlanNo, setDraftPlanNo] = useState(initialPlan?.planNo ?? "");
  const [draftStockups, setDraftStockups] = useState<string[]>(selectedStockups);
  const [shippingModeValue, setShippingModeValue] = useState(initialPlan?.shippingMode ?? "");
  const [transportModeValue, setTransportModeValue] = useState(initialPlan?.transportMode ?? "");
  const [logisticsChannelValue, setLogisticsChannelValue] = useState(initialPlan?.logisticsChannel ?? "");
  const [overseasInboundNoValue, setOverseasInboundNoValue] = useState(initialPlan?.overseasInboundNos.join("、") ?? "");
  const [pickupMethod, setPickupMethod] = useState(initialPlan?.pickupMethod ?? "");
  const [addressType, setAddressType] = useState(initialPlan?.addressType ?? "");
  const [warehouseName, setWarehouseName] = useState(initialPlan?.warehouseName ?? "");
  const [country, setCountry] = useState(initialPlan?.country ?? "");
  const [province, setProvince] = useState(initialPlan?.province ?? "");
  const [city, setCity] = useState(initialPlan?.city ?? "");
  const [zipCode, setZipCode] = useState(initialPlan?.zipCode ?? "");
  const [address1, setAddress1] = useState(initialPlan?.address1 ?? "");
  const [address2, setAddress2] = useState(initialPlan?.address2 ?? "");
  const [company, setCompany] = useState(initialPlan?.company ?? "");
  const [contact, setContact] = useState(initialPlan?.contact ?? "");
  const [phone, setPhone] = useState(initialPlan?.phone ?? "");
  const [email, setEmail] = useState(initialPlan?.email ?? "");
  const [remark, setRemark] = useState(record?.remark ?? "");
  const [customsMethod, setCustomsMethod] = useState("");
  const [taxMethod, setTaxMethod] = useState("");
  const [vatEori, setVatEori] = useState("");
  const [currency, setCurrency] = useState("");
  const [batchField, setBatchField] = useState<keyof typeof batchEditableFieldLabels>("hsCode");
  const [batchValue, setBatchValue] = useState("");
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const stockupOptions = selectedPlan ? stockupOptionsByPlan[selectedPlan.planNo] ?? [] : [];
  const planOptions = logisticsPlanOptions.filter((item) => item.planNo.toLowerCase().includes(planKeyword.trim().toLowerCase()));
  const boxCount = uniqueBoxCount(packingLines);
  const battery = packingLines.some((line) => line.hasBattery);
  const magnet = packingLines.some((line) => line.hasMagnet);
  const liquid = packingLines.some((line) => line.isLiquid);
  const powder = packingLines.some((line) => line.isPowder);
  const paste = packingLines.some((line) => line.isPaste);
  const textile = packingLines.some((line) => line.isTextile);

  useEffect(() => {
    if (batchModalOpen) {
      setBatchValue("");
    }
  }, [batchField, batchModalOpen]);

  function confirmPlan() {
    const nextPlan = logisticsPlanOptions.find((item) => item.planNo === draftPlanNo);
    if (!nextPlan) {
      return;
    }
    setSelectedPlan(nextPlan);
    setShippingModeValue(nextPlan.shippingMode);
    setTransportModeValue(nextPlan.transportMode);
    setLogisticsChannelValue(nextPlan.logisticsChannel);
    setOverseasInboundNoValue(nextPlan.overseasInboundNos.join("、"));
    setPickupMethod(nextPlan.pickupMethod);
    setAddressType(nextPlan.addressType);
    setWarehouseName(nextPlan.warehouseName);
    setCountry(nextPlan.country);
    setProvince(nextPlan.province);
    setCity(nextPlan.city);
    setZipCode(nextPlan.zipCode);
    setAddress1(nextPlan.address1);
    setAddress2(nextPlan.address2);
    setCompany(nextPlan.company);
    setContact(nextPlan.contact);
    setPhone(nextPlan.phone);
    setEmail(nextPlan.email);
    setSelectedStockups([]);
    setDraftStockups([]);
    setPackingLines([]);
    setPlanModalOpen(false);
  }

  function confirmStockups() {
    setSelectedStockups(draftStockups);
    setPackingLines(selectedStockupLines(draftStockups));
    setStockupModalOpen(false);
  }

  function updateLine(id: string, field: keyof PackingLine, value: string | number) {
    setPackingLines((lines) => lines.map((line) => (line.id === id ? { ...line, [field]: value } : line)));
  }

  function applyBatchEdit() {
    if (!batchValue.trim()) {
      return;
    }
    setPackingLines((lines) => lines.map((line) => ({ ...line, [batchField]: batchValue.trim() })));
    setBatchValue("");
    setBatchModalOpen(false);
  }

  return (
    <div className="space-y-4 pb-8">
      <Card className="space-y-4">
        <SectionTitle>基础信息</SectionTitle>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          {mode !== "create" ? (
            <FormRow label="头程物流单号">
              <ReadonlyValue value={record?.firstLegNo ?? buildOrderNo()} />
            </FormRow>
          ) : null}
          <FormRow label="物流计划单号" required>
            {mode === "create" ? (
              <div className="flex gap-2">
                <ReadonlyValue value={selectedPlan?.planNo ?? ""} />
                <Button variant="secondary" size="sm" onClick={() => {
                  setDraftPlanNo(selectedPlan?.planNo ?? "");
                  setPlanModalOpen(true);
                }}>
                  选择物流计划单
                </Button>
              </div>
            ) : (
              <ReadonlyValue value={selectedPlan?.planNo ?? ""} />
            )}
          </FormRow>
          <FormRow label="发货方式">
            {isReadonly ? <ReadonlyValue value={shippingModeValue} /> : <DisabledFieldValue value={shippingModeValue} placeholder="选择物流计划单后自动带出" />}
          </FormRow>
          <FormRow label="运输方式">
            {isReadonly ? <ReadonlyValue value={transportModeValue} /> : <DisabledFieldValue value={transportModeValue} placeholder="选择物流计划单后自动带出" />}
          </FormRow>
          <FormRow label="物流渠道">
            {isReadonly ? <ReadonlyValue value={logisticsChannelValue} /> : <DisabledFieldValue value={logisticsChannelValue} placeholder="选择物流计划单后自动带出" />}
          </FormRow>
          <FormRow label="提货方式">
            {isReadonly ? <ReadonlyValue value={pickupMethod} /> : <Select value={pickupMethod} options={optionList(pickupMethodOptions)} placeholder="请选择" onValueChange={setPickupMethod} />}
          </FormRow>
          <FormRow label="海外仓入库单号">
            {isReadonly ? <ReadonlyValue value={overseasInboundNoValue} /> : <DisabledFieldValue value={overseasInboundNoValue} placeholder="选择物流计划单后自动带出" />}
          </FormRow>
          <FormRow label="箱数"><ReadonlyValue value={packingLines.length ? boxCount : ""} /></FormRow>
          <FormRow label="备注">
            {isReadonly ? <ReadonlyValue value={remark} /> : <Input value={remark} maxLength={1000} placeholder="请输入备注，最多1000字符" onChange={(event) => setRemark(event.target.value)} />}
          </FormRow>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>收件信息</SectionTitle>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <FormRow label="收货地址类型" required>
            {isReadonly ? <ReadonlyValue value={addressType} /> : <Select value={addressType} options={optionList(addressTypeOptions)} placeholder="请选择" onValueChange={setAddressType} />}
          </FormRow>
          <FormRow label="收货仓库" required>
            {isReadonly ? (
              <ReadonlyValue value={warehouseName} />
            ) : (
              <Select
                value={warehouseName}
                options={warehouseOptions.filter((item) => !addressType || item.type === addressType).map((item) => ({ label: item.name, value: item.name }))}
                placeholder="请选择"
                onValueChange={setWarehouseName}
              />
            )}
          </FormRow>
          <FormRow label="国家" required>
            {isReadonly ? <ReadonlyValue value={country} /> : <Select value={country} options={optionList(countryOptions)} placeholder="请选择" onValueChange={setCountry} />}
          </FormRow>
          <FormRow label="省/州">{isReadonly ? <ReadonlyValue value={province} /> : <Input value={province} placeholder="请输入省/州" onChange={(event) => setProvince(event.target.value)} />}</FormRow>
          <FormRow label="城市">{isReadonly ? <ReadonlyValue value={city} /> : <Input value={city} placeholder="请输入城市" onChange={(event) => setCity(event.target.value)} />}</FormRow>
          <FormRow label="邮编">{isReadonly ? <ReadonlyValue value={zipCode} /> : <Input value={zipCode} placeholder="请输入邮编" onChange={(event) => setZipCode(event.target.value)} />}</FormRow>
          <FormRow label="地址1">{isReadonly ? <ReadonlyValue value={address1} /> : <Input value={address1} placeholder="请输入地址1" onChange={(event) => setAddress1(event.target.value)} />}</FormRow>
          <FormRow label="地址2">{isReadonly ? <ReadonlyValue value={address2} /> : <Input value={address2} placeholder="请输入地址2" onChange={(event) => setAddress2(event.target.value)} />}</FormRow>
          <FormRow label="公司">{isReadonly ? <ReadonlyValue value={company} /> : <Input value={company} placeholder="请输入公司" onChange={(event) => setCompany(event.target.value)} />}</FormRow>
          <FormRow label="联系人">{isReadonly ? <ReadonlyValue value={contact} /> : <Input value={contact} placeholder="请输入联系人" onChange={(event) => setContact(event.target.value)} />}</FormRow>
          <FormRow label="电话">{isReadonly ? <ReadonlyValue value={phone} /> : <Input value={phone} placeholder="请输入电话" onChange={(event) => setPhone(event.target.value)} />}</FormRow>
          <FormRow label="邮箱">{isReadonly ? <ReadonlyValue value={email} /> : <Input value={email} placeholder="请输入邮箱" onChange={(event) => setEmail(event.target.value)} />}</FormRow>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>限制信息</SectionTitle>
        <div className="grid grid-cols-6 gap-3 text-small">
          {[
            ["是否带电", battery],
            ["是否带磁", magnet],
            ["是否液体", liquid],
            ["是否粉末", powder],
            ["是否膏体", paste],
            ["是否纺织品", textile],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-sm border border-border bg-bg-page p-3">
              <div className="text-text-muted">{label}</div>
              <div className="mt-1 font-medium text-text-primary">{yesNo(Boolean(value), packingLines.length > 0)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>申报信息</SectionTitle>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3">
          <FormRow label="报关方式">{isReadonly ? <ReadonlyValue value={customsMethod} /> : <Select value={customsMethod} options={optionList(customsMethodOptions)} placeholder="请选择" onValueChange={setCustomsMethod} />}</FormRow>
          <FormRow label="税务方式">{isReadonly ? <ReadonlyValue value={taxMethod} /> : <Select value={taxMethod} options={optionList(taxMethodOptions)} placeholder="请选择" onValueChange={setTaxMethod} />}</FormRow>
          <FormRow label="VAT/EORI">{isReadonly ? <ReadonlyValue value={vatEori} /> : <Input value={vatEori} placeholder="请输入VAT/EORI" onChange={(event) => setVatEori(event.target.value)} />}</FormRow>
          <FormRow label="币种">{isReadonly ? <ReadonlyValue value={currency} /> : <Select value={currency} options={optionList(currencyOptions)} placeholder="请选择" onValueChange={setCurrency} />}</FormRow>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>装箱明细</SectionTitle>
          {!isReadonly ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" disabled={!selectedPlan} onClick={() => {
                setDraftStockups(selectedStockups);
                setStockupModalOpen(true);
              }}>
                关联备货单
              </Button>
            </div>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2300px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>箱号</th>
                <th className={tableHeadCell}>引用ID</th>
                <th className={tableHeadCell}>SKU</th>
                <th className={tableHeadCell}>中文名</th>
                <th className={tableHeadCell}>英文名</th>
                <EditableTableHead title="海关编码" field="hsCode" readonly={isReadonly} disabled={packingLines.length === 0} onEdit={(field) => {
                  setBatchField(field);
                  setBatchModalOpen(true);
                }} />
                <th className={tableHeadCell}>单箱数</th>
                <EditableTableHead title="申报价格" field="declarePrice" readonly={isReadonly} disabled={packingLines.length === 0} onEdit={(field) => {
                  setBatchField(field);
                  setBatchModalOpen(true);
                }} />
                <EditableTableHead title="材质" field="material" readonly={isReadonly} disabled={packingLines.length === 0} onEdit={(field) => {
                  setBatchField(field);
                  setBatchModalOpen(true);
                }} />
                <EditableTableHead title="用途" field="usage" readonly={isReadonly} disabled={packingLines.length === 0} onEdit={(field) => {
                  setBatchField(field);
                  setBatchModalOpen(true);
                }} />
                <EditableTableHead title="ASIN/销售链接" field="asinLink" readonly={isReadonly} disabled={packingLines.length === 0} onEdit={(field) => {
                  setBatchField(field);
                  setBatchModalOpen(true);
                }} />
                <th className={tableHeadCell}>长</th>
                <th className={tableHeadCell}>宽</th>
                <th className={tableHeadCell}>高</th>
                <th className={tableHeadCell}>体积</th>
                <EditableTableHead title="净重" field="netWeight" readonly={isReadonly} disabled={packingLines.length === 0} onEdit={(field) => {
                  setBatchField(field);
                  setBatchModalOpen(true);
                }} />
                <th className={tableHeadCell}>毛重</th>
                <th className={tableHeadCell}>图片</th>
                <EditableTableHead title="备注" field="remark" readonly={isReadonly} disabled={packingLines.length === 0} onEdit={(field) => {
                  setBatchField(field);
                  setBatchModalOpen(true);
                }} />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {packingLines.map((line) => (
                <tr key={line.id}>
                  <td className="whitespace-nowrap px-3 py-3">{line.boxNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.referenceId}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.sku}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.cnName}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.enName}</td>
                  <td className="px-3 py-3">{isReadonly ? line.hsCode : <Input className="w-[140px]" value={line.hsCode} onChange={(event) => updateLine(line.id, "hsCode", event.target.value)} />}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.qtyPerBox}</td>
                  <td className="px-3 py-3">{isReadonly ? line.declarePrice : <Input className="w-[110px]" value={line.declarePrice} onChange={(event) => updateLine(line.id, "declarePrice", event.target.value)} />}</td>
                  <td className="px-3 py-3">{isReadonly ? line.material : <Input className="w-[140px]" value={line.material} onChange={(event) => updateLine(line.id, "material", event.target.value)} />}</td>
                  <td className="px-3 py-3">{isReadonly ? line.usage : <Input className="w-[140px]" value={line.usage} onChange={(event) => updateLine(line.id, "usage", event.target.value)} />}</td>
                  <td className="px-3 py-3">{isReadonly ? line.asinLink : <Input className="w-[150px]" value={line.asinLink} onChange={(event) => updateLine(line.id, "asinLink", event.target.value)} />}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.length}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.width}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.height}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.volume}</td>
                  <td className="px-3 py-3">{isReadonly ? line.netWeight || "-" : <Input className="w-[100px]" value={line.netWeight} onChange={(event) => updateLine(line.id, "netWeight", event.target.value)} />}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.grossWeight}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-text-muted">{line.image || "-"}</td>
                  <td className="px-3 py-3">{isReadonly ? line.remark || "-" : <Input className="w-[160px]" value={line.remark} onChange={(event) => updateLine(line.id, "remark", event.target.value)} />}</td>
                </tr>
              ))}
              {packingLines.length === 0 ? (
                <tr>
                  <td colSpan={19} className="px-3 py-10 text-center text-text-muted">请选择物流计划单并关联备货单后生成装箱明细</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-bg-container px-4 py-3 shadow-sm">
        <Button variant="secondary" size="sm" onClick={onBack}>{isReadonly ? "返回" : "取消"}</Button>
        {!isReadonly ? <Button variant="primary" size="sm" onClick={onSubmit}>保存</Button> : null}
      </div>

      <Modal open={planModalOpen} title="选择物流计划单" widthClassName="w-[min(1180px,96vw)]" onClose={() => setPlanModalOpen(false)}>
        <div className="space-y-3">
          <Input value={planKeyword} placeholder="搜索物流计划单号" onChange={(event) => setPlanKeyword(event.target.value)} />
          <div className="max-h-[360px] overflow-auto rounded-sm border border-border">
            <table className="w-full min-w-[1500px] border-collapse text-small">
              <thead className="bg-bg-page text-text-muted">
                <tr>
                  <th className={tableHeadCell}>选择</th>
                  <th className={tableHeadCell}>物流计划单</th>
                  <th className={tableHeadCell}>发货方式</th>
                  <th className={tableHeadCell}>物流商</th>
                  <th className={tableHeadCell}>物流渠道</th>
                  <th className={tableHeadCell}>运输方式</th>
                  <th className={tableHeadCell}>物流商单号</th>
                  <th className={tableHeadCell}>SKU种类数</th>
                  <th className={tableHeadCell}>总计划发货量</th>
                  <th className={tableHeadCell}>关联备货单号</th>
                  <th className={tableHeadCell}>总毛重（kg）</th>
                  <th className={tableHeadCell}>总体积（m³）</th>
                  <th className={tableHeadCell}>备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {planOptions.map((plan) => (
                  <tr key={plan.planNo} className="hover:bg-bg-hover">
                    <td className="px-3 py-3"><input type="radio" checked={draftPlanNo === plan.planNo} onChange={() => setDraftPlanNo(plan.planNo)} /></td>
                    <td className="px-3 py-3 font-medium text-primary">{plan.planNo}</td>
                    <td className="px-3 py-3">{plan.shippingMode}</td>
                    <td className="max-w-[160px] truncate px-3 py-3" title={plan.logisticsProvider}>{plan.logisticsProvider}</td>
                    <td className="px-3 py-3">{plan.logisticsChannel}</td>
                    <td className="px-3 py-3">{plan.transportMode}</td>
                    <td className="px-3 py-3">{plan.providerOrderNo}</td>
                    <td className="px-3 py-3">{plan.skuTypeCount}</td>
                    <td className="px-3 py-3">{plan.totalPlannedQty}</td>
                    <td className="max-w-[180px] truncate px-3 py-3" title={plan.relatedStockupNos.join("、")}>{plan.relatedStockupNos.join("、") || "-"}</td>
                    <td className="px-3 py-3">{plan.totalGrossWeight}</td>
                    <td className="px-3 py-3">{plan.totalVolume}</td>
                    <td className="max-w-[180px] truncate px-3 py-3" title={plan.remark}>{plan.remark || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPlanModalOpen(false)}>取消</Button>
            <Button variant="primary" size="sm" disabled={!draftPlanNo} onClick={confirmPlan}>确认</Button>
          </div>
        </div>
      </Modal>

      <Modal open={stockupModalOpen} title="关联备货单" widthClassName="w-[720px]" onClose={() => setStockupModalOpen(false)}>
        <div className="space-y-3">
          <div className="rounded-sm bg-bg-page px-3 py-2 text-small text-text-muted">
            仅展示与当前物流计划单匹配的备货单，已关联其他单据的备货单不可选择。
          </div>
          <div className="max-h-[360px] overflow-auto rounded-sm border border-border">
            <table className="w-full border-collapse text-small">
              <thead className="bg-bg-page text-text-muted">
                <tr>
                  <th className={tableHeadCell}>选择</th>
                  <th className={tableHeadCell}>备货单号</th>
                  <th className={tableHeadCell}>海外仓入库单号</th>
                  <th className={tableHeadCell}>状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockupOptions.map((item) => {
                  const checked = draftStockups.includes(item.stockupNo);
                  return (
                    <tr key={item.stockupNo} className={item.disabled ? "bg-bg-page text-text-muted" : "hover:bg-bg-hover"}>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          disabled={item.disabled}
                          checked={checked}
                          onChange={() => {
                            setDraftStockups((current) => checked ? current.filter((value) => value !== item.stockupNo) : [...current, item.stockupNo]);
                          }}
                        />
                      </td>
                      <td className="px-3 py-3 font-medium text-primary">{item.stockupNo}</td>
                      <td className="px-3 py-3">{item.overseasInboundNo || "-"}</td>
                      <td className="px-3 py-3">{item.disabled ? "已关联其他头程单" : "可关联"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setStockupModalOpen(false)}>取消</Button>
            <Button variant="primary" size="sm" onClick={confirmStockups}>确认</Button>
          </div>
        </div>
      </Modal>

      <Modal open={batchModalOpen} title={`批量编辑${batchEditableFieldLabels[batchField]}`} widthClassName="w-[520px]" onClose={() => setBatchModalOpen(false)}>
        <div className="space-y-3">
          <FormRow label="批量值">
            <Input value={batchValue} placeholder={`请输入${batchEditableFieldLabels[batchField]}`} onChange={(event) => setBatchValue(event.target.value)} />
          </FormRow>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBatchModalOpen(false)}>取消</Button>
            <Button variant="primary" size="sm" disabled={!batchValue.trim()} onClick={applyBatchEdit}>确认</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function selectedStockupLines(stockupNos: string[]) {
  return stockupNos.flatMap((stockupNo) => packingLinesByStockup[stockupNo] ?? []);
}

function FilterItem({
  label,
  widthClass,
  children,
}: {
  label: string;
  widthClass: string;
  children: ReactNode;
}) {
  return (
    <div className={widthClass}>
      <div className="mb-1.5 text-small text-text-muted">{label}</div>
      {children}
    </div>
  );
}

function BatchExactSearch({
  title,
  placeholder,
  values,
  onChange,
}: {
  title: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { open, setOpen } = useExclusiveFilterPanel(panelId);
  const [draft, setDraft] = useState(values.join("\n"));
  const parsedValues = parseBatchValues(draft);
  const invalid = parsedValues.length > 0 && !isAlphaNumericList(parsedValues);
  const overLimit = parsedValues.length > 200;
  const canConfirm = parsedValues.length > 0 && !invalid && !overLimit;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeAndResetDraft();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function closeAndResetDraft() {
    setDraft(values.join("\n"));
    setOpen(false);
  }

  function confirm() {
    if (!canConfirm) {
      return;
    }
    onChange(parsedValues);
    setOpen(false);
  }

  function clear() {
    setDraft("");
    onChange([]);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="field-control flex w-full items-center justify-between gap-2 text-left"
        onClick={() => {
          setDraft(values.join("\n"));
          setOpen(true);
        }}
      >
        <span className={values.length ? "truncate text-text-primary" : "truncate text-text-placeholder"}>
          {values.length ? `已选择 ${values.length} 项` : placeholder}
        </span>
        <Search aria-hidden="true" className={values.length ? "h-4 w-4 text-primary" : "h-4 w-4 text-text-muted"} />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[300px] rounded-sm border border-border bg-white p-2 shadow-md">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
            <div className="font-medium text-text-primary">{title}</div>
            <button
              type="button"
              aria-label="关闭批量搜索"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-text-muted hover:border-primary hover:text-primary"
              onClick={closeAndResetDraft}
            >
              ×
            </button>
          </div>
          <Textarea
            className="min-h-[140px]"
            value={draft}
            placeholder="一项一行"
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="mt-1 text-mini text-text-muted">最多支持 200 行，精确匹配英文+数字。</div>
          {invalid ? <div className="mt-1 text-mini text-danger">仅支持英文和数字。</div> : null}
          {overLimit ? <div className="mt-1 text-mini text-danger">最多支持 200 行。</div> : null}
          <div className="mt-3 flex justify-end gap-2">
            <Button className="min-w-[64px]" variant="secondary" size="sm" onClick={closeAndResetDraft}>取消</Button>
            {values.length > 0 ? <Button className="min-w-[64px]" variant="secondary" size="sm" onClick={clear}>清空</Button> : null}
            <Button className="min-w-[64px]" variant="primary" size="sm" disabled={!canConfirm} onClick={confirm}>确认</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
