import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DateRangePicker, type DateRangeValue } from "../components/ui/date-range-picker";
import { ExclusiveFilterGroup } from "../components/ui/exclusive-filter-group";
import { Input } from "../components/ui/input";
import { MultiSelectFilter } from "../components/ui/multi-select-filter";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { Tabs } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { StockupFeeDetailSection } from "./stockup-fee-detail-page";

type StockupStatus = "待处理" | "已处理" | "待配货" | "已发货" | "已完成" | "已作废";
type RelationStatus = "已关联" | "未关联" | "无需关联";

type StockupOrderRecord = {
  id: string;
  stockupNo: string;
  platform: string;
  store: string;
  shipWarehouseType: "实体仓" | "虚拟仓";
  shipWarehouse: string;
  receiveWarehouseType: "三方仓" | "平台仓";
  receiveWarehouse: string;
  logisticsProvider: string;
  logisticsChannel: string;
  deliveryMode: string;
  transportMode: string;
  totalWeight: string;
  totalVolume: string;
  logisticsPlanNo: string;
  shippingPlanNo: string;
  shipmentNo: string;
  thirdInboundNo: string;
  shipmentRelationStatus: RelationStatus;
  thirdInboundRelationStatus: RelationStatus;
  logisticsPlanRelationStatus: RelationStatus;
  shippingOrderRelationStatus: RelationStatus;
  remark: string;
  estimatedShipTime: string;
  updater: string;
  updatedAt: string;
  creator: string;
  createdAt: string;
  status: StockupStatus;
  stockupQty: number;
  sku: string;
};

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";

type PlanWorkspaceTab = "stockupDetail" | "logisticsInfo";
type StockupPageSubView = "list" | "feeDetail";

const stockupPageMenuTabs: Array<{ label: string; value: StockupPageSubView }> = [
  { label: "备货单", value: "list" },
  { label: "费用明细", value: "feeDetail" },
];
const relationOptions: RelationStatus[] = ["已关联", "未关联", "无需关联"];
const statusTabs: Array<{ label: string; value: "全部" | StockupStatus }> = [
  { label: "全部", value: "全部" },
  { label: "待处理", value: "待处理" },
  { label: "已处理", value: "已处理" },
  { label: "待配货", value: "待配货" },
  { label: "已发货", value: "已发货" },
  { label: "已完成", value: "已完成" },
  { label: "已作废", value: "已作废" },
];

const stockupOrderRecords: StockupOrderRecord[] = [
  {
    id: "so-heavy-001",
    stockupNo: "SU202606090901",
    platform: "Amazon",
    store: "AMZ-US-BULK",
    shipWarehouseType: "实体仓",
    shipWarehouse: "义乌发货仓",
    receiveWarehouseType: "平台仓",
    receiveWarehouse: "Amazon LAX9",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    logisticsChannel: "美南标快",
    deliveryMode: "整柜",
    transportMode: "海运",
    totalWeight: "9200.00",
    totalVolume: "34.50",
    logisticsPlanNo: "-",
    shippingPlanNo: "-",
    shipmentNo: "-",
    thirdInboundNo: "-",
    shipmentRelationStatus: "未关联",
    thirdInboundRelationStatus: "未关联",
    logisticsPlanRelationStatus: "未关联",
    shippingOrderRelationStatus: "未关联",
    remark: "超限演示备货单-家具体积件",
    estimatedShipTime: "2026-06-22",
    updater: "兰轩",
    updatedAt: "2026-06-09 13:42:11",
    creator: "兰轩",
    createdAt: "2026-06-09 13:30:00",
    status: "待处理",
    stockupQty: 1200,
    sku: "SKU-BULK-9001",
  },
  {
    id: "so-heavy-002",
    stockupNo: "SU202606090902",
    platform: "Amazon",
    store: "AMZ-US-BULK",
    shipWarehouseType: "实体仓",
    shipWarehouse: "义乌发货仓",
    receiveWarehouseType: "平台仓",
    receiveWarehouse: "Amazon LAX9",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    logisticsChannel: "美南标快",
    deliveryMode: "整柜",
    transportMode: "海运",
    totalWeight: "8800.00",
    totalVolume: "32.20",
    logisticsPlanNo: "-",
    shippingPlanNo: "-",
    shipmentNo: "-",
    thirdInboundNo: "-",
    shipmentRelationStatus: "未关联",
    thirdInboundRelationStatus: "未关联",
    logisticsPlanRelationStatus: "未关联",
    shippingOrderRelationStatus: "未关联",
    remark: "超限演示备货单-大件家电",
    estimatedShipTime: "2026-06-22",
    updater: "兰轩",
    updatedAt: "2026-06-09 13:43:21",
    creator: "兰轩",
    createdAt: "2026-06-09 13:31:00",
    status: "待处理",
    stockupQty: 980,
    sku: "SKU-BULK-9002",
  },
  {
    id: "so-heavy-003",
    stockupNo: "SU202606090903",
    platform: "Amazon",
    store: "AMZ-US-BULK",
    shipWarehouseType: "实体仓",
    shipWarehouse: "义乌发货仓",
    receiveWarehouseType: "平台仓",
    receiveWarehouse: "Amazon LAX9",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    logisticsChannel: "美南标快",
    deliveryMode: "整柜",
    transportMode: "海运",
    totalWeight: "6400.00",
    totalVolume: "25.80",
    logisticsPlanNo: "-",
    shippingPlanNo: "-",
    shipmentNo: "-",
    thirdInboundNo: "-",
    shipmentRelationStatus: "未关联",
    thirdInboundRelationStatus: "未关联",
    logisticsPlanRelationStatus: "未关联",
    shippingOrderRelationStatus: "未关联",
    remark: "超限演示备货单-补充批次",
    estimatedShipTime: "2026-06-23",
    updater: "兰轩",
    updatedAt: "2026-06-09 13:44:06",
    creator: "兰轩",
    createdAt: "2026-06-09 13:32:00",
    status: "待处理",
    stockupQty: 760,
    sku: "SKU-BULK-9003",
  },
  {
    id: "so-001",
    stockupNo: "SU202606080001",
    platform: "Amazon",
    store: "AMZ-US-001",
    shipWarehouseType: "实体仓",
    shipWarehouse: "义乌发货仓",
    receiveWarehouseType: "平台仓",
    receiveWarehouse: "Amazon LAX9",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    logisticsChannel: "美南标快",
    deliveryMode: "散货",
    transportMode: "海运",
    totalWeight: "128.50",
    totalVolume: "4.20",
    logisticsPlanNo: "-",
    shippingPlanNo: "-",
    shipmentNo: "-",
    thirdInboundNo: "-",
    shipmentRelationStatus: "未关联",
    thirdInboundRelationStatus: "未关联",
    logisticsPlanRelationStatus: "未关联",
    shippingOrderRelationStatus: "未关联",
    remark: "新品首批备货",
    estimatedShipTime: "2026-06-18",
    updater: "兰轩",
    updatedAt: "2026-06-08 10:28:11",
    creator: "兰轩",
    createdAt: "2026-06-08 09:12:33",
    status: "待处理",
    stockupQty: 860,
    sku: "SKU-US-1001",
  },
  {
    id: "so-002",
    stockupNo: "SU202606080002",
    platform: "Walmart",
    store: "WM-US-002",
    shipWarehouseType: "实体仓",
    shipWarehouse: "深圳保税仓",
    receiveWarehouseType: "三方仓",
    receiveWarehouse: "谷仓美西仓",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    logisticsChannel: "美西海派",
    deliveryMode: "整柜",
    transportMode: "海运",
    totalWeight: "92.00",
    totalVolume: "3.10",
    logisticsPlanNo: "LP202606080015",
    shippingPlanNo: "SP202606080021",
    shipmentNo: "-",
    thirdInboundNo: "3IN202606080002",
    shipmentRelationStatus: "无需关联",
    thirdInboundRelationStatus: "已关联",
    logisticsPlanRelationStatus: "已关联",
    shippingOrderRelationStatus: "已关联",
    remark: "三方仓补货",
    estimatedShipTime: "2026-06-20",
    updater: "张三",
    updatedAt: "2026-06-08 10:32:41",
    creator: "张三",
    createdAt: "2026-06-07 16:28:10",
    status: "已处理",
    stockupQty: 520,
    sku: "SKU-WM-2002",
  },
  {
    id: "so-003",
    stockupNo: "SU202606070018",
    platform: "Shopify",
    store: "SHOP-CA-01",
    shipWarehouseType: "虚拟仓",
    shipWarehouse: "华东虚拟仓",
    receiveWarehouseType: "三方仓",
    receiveWarehouse: "多伦多三方仓",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    logisticsChannel: "加拿大卡派",
    deliveryMode: "散货",
    transportMode: "海运",
    totalWeight: "54.35",
    totalVolume: "1.82",
    logisticsPlanNo: "LP202606070022",
    shippingPlanNo: "SP202606070033",
    shipmentNo: "-",
    thirdInboundNo: "3IN202606070008",
    shipmentRelationStatus: "无需关联",
    thirdInboundRelationStatus: "已关联",
    logisticsPlanRelationStatus: "已关联",
    shippingOrderRelationStatus: "已关联",
    remark: "-",
    estimatedShipTime: "2026-06-17",
    updater: "李四",
    updatedAt: "2026-06-08 09:54:01",
    creator: "李四",
    createdAt: "2026-06-07 11:20:08",
    status: "待配货",
    stockupQty: 300,
    sku: "SKU-CA-3003",
  },
  {
    id: "so-004",
    stockupNo: "SU202606060009",
    platform: "TikTok",
    store: "TT-US-01",
    shipWarehouseType: "实体仓",
    shipWarehouse: "广州中心仓",
    receiveWarehouseType: "平台仓",
    receiveWarehouse: "TikTok US FC",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    logisticsChannel: "美南标快",
    deliveryMode: "散货",
    transportMode: "海运",
    totalWeight: "76.80",
    totalVolume: "2.44",
    logisticsPlanNo: "LP202606060011",
    shippingPlanNo: "SP202606060018",
    shipmentNo: "FBA19C34CPYD",
    thirdInboundNo: "-",
    shipmentRelationStatus: "已关联",
    thirdInboundRelationStatus: "无需关联",
    logisticsPlanRelationStatus: "已关联",
    shippingOrderRelationStatus: "已关联",
    remark: "急单",
    estimatedShipTime: "2026-06-15",
    updater: "王五",
    updatedAt: "2026-06-08 08:47:22",
    creator: "王五",
    createdAt: "2026-06-06 14:18:55",
    status: "已发货",
    stockupQty: 410,
    sku: "SKU-TT-4004",
  },
  {
    id: "so-005",
    stockupNo: "SU202606050012",
    platform: "Temu",
    store: "TM-EU-01",
    shipWarehouseType: "实体仓",
    shipWarehouse: "宁波港前仓",
    receiveWarehouseType: "平台仓",
    receiveWarehouse: "Temu EU FC",
    logisticsProvider: "浙江融盛国际物流有限公司",
    logisticsChannel: "欧洲快线",
    deliveryMode: "整柜",
    transportMode: "空运",
    totalWeight: "33.20",
    totalVolume: "0.92",
    logisticsPlanNo: "LP202606050018",
    shippingPlanNo: "SP202606050019",
    shipmentNo: "FBA18T6Q3A7",
    thirdInboundNo: "-",
    shipmentRelationStatus: "已关联",
    thirdInboundRelationStatus: "无需关联",
    logisticsPlanRelationStatus: "已关联",
    shippingOrderRelationStatus: "已关联",
    remark: "-",
    estimatedShipTime: "2026-06-12",
    updater: "赵六",
    updatedAt: "2026-06-07 18:20:02",
    creator: "赵六",
    createdAt: "2026-06-05 10:36:09",
    status: "已完成",
    stockupQty: 180,
    sku: "SKU-TM-5005",
  },
  {
    id: "so-006",
    stockupNo: "SU202606040006",
    platform: "AliExpress",
    store: "AE-US-01",
    shipWarehouseType: "虚拟仓",
    shipWarehouse: "华南虚拟仓",
    receiveWarehouseType: "三方仓",
    receiveWarehouse: "美东三方仓",
    logisticsProvider: "深圳市以达物流有限公司",
    logisticsChannel: "美东快递",
    deliveryMode: "散货",
    transportMode: "快递",
    totalWeight: "18.60",
    totalVolume: "0.45",
    logisticsPlanNo: "-",
    shippingPlanNo: "-",
    shipmentNo: "-",
    thirdInboundNo: "-",
    shipmentRelationStatus: "未关联",
    thirdInboundRelationStatus: "未关联",
    logisticsPlanRelationStatus: "未关联",
    shippingOrderRelationStatus: "未关联",
    remark: "客户取消",
    estimatedShipTime: "2026-06-10",
    updater: "超级管理员",
    updatedAt: "2026-06-06 09:10:28",
    creator: "钱七",
    createdAt: "2026-06-04 09:20:01",
    status: "已作废",
    stockupQty: 96,
    sku: "SKU-AE-6006",
  },
  {
    id: "so-007",
    stockupNo: "SU202606030010",
    platform: "ebay",
    store: "EB-US-01",
    shipWarehouseType: "实体仓",
    shipWarehouse: "义乌发货仓",
    receiveWarehouseType: "三方仓",
    receiveWarehouse: "洛杉矶海外仓",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    logisticsChannel: "美西海派",
    deliveryMode: "整柜",
    transportMode: "海运",
    totalWeight: "101.40",
    totalVolume: "3.88",
    logisticsPlanNo: "LP202606030012",
    shippingPlanNo: "SP202606030014",
    shipmentNo: "-",
    thirdInboundNo: "3IN202606030004",
    shipmentRelationStatus: "无需关联",
    thirdInboundRelationStatus: "已关联",
    logisticsPlanRelationStatus: "已关联",
    shippingOrderRelationStatus: "已关联",
    remark: "待仓库配货",
    estimatedShipTime: "2026-06-16",
    updater: "兰轩",
    updatedAt: "2026-06-06 13:01:44",
    creator: "兰轩",
    createdAt: "2026-06-03 15:42:19",
    status: "待配货",
    stockupQty: 640,
    sku: "SKU-EB-7007",
  },
];

const logisticsProviderOptions = [
  {
    label: "义乌市双捷国际货运代理有限公司",
    value: "义乌市双捷国际货运代理有限公司",
    channels: [
      { label: "美南标快", value: "美南标快", transportModes: ["海运"], volumeFactor: "6000" },
      { label: "美西海派", value: "美西海派", transportModes: ["海运"], volumeFactor: "6000" },
      { label: "加拿大卡派", value: "加拿大卡派", transportModes: ["海运"], volumeFactor: "5000" },
    ],
  },
  {
    label: "浙江融盛国际物流有限公司",
    value: "浙江融盛国际物流有限公司",
    channels: [{ label: "欧洲快线", value: "欧洲快线", transportModes: ["空运"], volumeFactor: "6000" }],
  },
  {
    label: "深圳市以达物流有限公司",
    value: "深圳市以达物流有限公司",
    channels: [{ label: "美东快递", value: "美东快递", transportModes: ["快递"], volumeFactor: "5000" }],
  },
];

const logisticsPlanChannelOptions = Array.from(
  new Map(
    logisticsProviderOptions
      .flatMap((provider) => provider.channels)
      .map((channel) => [channel.value, channel]),
  ).values(),
);

function getPrimaryProviderByChannel(channel: string) {
  return logisticsProviderOptions.find((provider) => provider.channels.some((item) => item.value === channel));
}

function uniqueOptions(records: StockupOrderRecord[], getter: (record: StockupOrderRecord) => string) {
  return Array.from(new Set(records.map(getter))).map((value) => ({ label: value, value }));
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

function displayAggregate(values: string[]) {
  const unique = uniqueValues(values);
  if (unique.length === 0) {
    return "-";
  }
  return unique.length === 1 ? unique[0] : `多种（${unique.length}）`;
}

function sumNumber(values: string[]) {
  return values.reduce((sum, value) => sum + Number.parseFloat(value || "0"), 0);
}

function validateSameLogistics(records: StockupOrderRecord[]) {
  if (records.length === 0) {
    return "请先选择需要生成物流计划单的备货单。";
  }

  const providers = uniqueValues(records.map((record) => record.logisticsProvider));
  const channels = uniqueValues(records.map((record) => record.logisticsChannel));
  const transportModes = uniqueValues(records.map((record) => record.transportMode));

  if (providers.length > 1 || channels.length > 1 || transportModes.length > 1) {
    return "仅可选择物流商、物流渠道、运输方式相同的备货单生成物流计划单。";
  }

  return "";
}

function statusTone(status: StockupStatus) {
  if (status === "已完成") {
    return "success";
  }
  if (status === "已作废") {
    return "closed";
  }
  if (status === "已发货") {
    return "processing";
  }
  return "pending";
}

function getRowActions(status: StockupStatus) {
  if (status === "待处理") {
    return ["作废", "生成物流计划单", "打印第三方SKU标签", "下推WMS发运单", "下推第三方入库单", "生成物流变更单"];
  }
  if (status === "已处理" || status === "待配货") {
    return ["打印第三方SKU标签", "生成物流变更单"];
  }
  if (status === "已发货") {
    return ["打印第三方SKU标签", "打印箱唛标签"];
  }
  if (status === "已完成" || status === "已作废") {
    return [];
  }
  return ["打印第三方SKU标签", "打印箱唛标签", "生成物流变更单"];
}

function RowOperationCell({
  record,
  open,
  onToggle,
  onAction,
}: {
  record: StockupOrderRecord;
  open: boolean;
  onToggle: () => void;
  onAction: (action: string, record: StockupOrderRecord) => void;
}) {
  const actions = getRowActions(record.status);

  return (
    <td className="relative whitespace-nowrap px-3 py-3">
      <button type="button" className="mr-3 border-0 bg-transparent p-0 text-primary hover:underline">
        详情
      </button>
      {actions.length > 0 ? (
        <span className="relative inline-block">
          <button
            type="button"
            className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-primary hover:underline"
            onClick={onToggle}
          >
            操作
            <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open ? (
            <div className="absolute right-0 top-[calc(100%+6px)] z-40 min-w-[168px] rounded-md border border-border bg-white py-2 shadow-lg">
              {actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="block w-full whitespace-nowrap border-0 bg-transparent px-4 py-2 text-left text-small text-primary hover:bg-bg-hover"
                  onClick={() => onAction(action, record)}
                >
                  {action}
                </button>
              ))}
            </div>
          ) : null}
        </span>
      ) : null}
    </td>
  );
}

function emptyRange(): DateRangeValue {
  return { start: "", end: "" };
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

function ReadonlyText({ value }: { value: string }) {
  return <div className="min-h-8 py-2 text-body text-text-primary">{value || "-"}</div>;
}

function FormFieldRow({
  label,
  children,
  className = "",
  alignStart = false,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  alignStart?: boolean;
}) {
  return (
    <div className={`flex min-w-0 gap-2 ${alignStart ? "items-start" : "items-center"} ${className}`}>
      <div className={`w-[88px] shrink-0 text-right text-small text-text-secondary ${alignStart ? "pt-2" : ""}`}>
        {label}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function CreateLogisticsPlanPage({
  records,
  onBack,
}: {
  records: StockupOrderRecord[];
  onBack: () => void;
}) {
  const [planRecords, setPlanRecords] = useState(records);
  const [provider, setProvider] = useState("");
  const [channel, setChannel] = useState("");
  const [transportMode, setTransportMode] = useState("");
  const [customNo, setCustomNo] = useState("");
  const [providerOrderNo, setProviderOrderNo] = useState("");
  const [chargeRule, setChargeRule] = useState("");
  const [tradeDeclaration, setTradeDeclaration] = useState("");
  const [taxIncluded, setTaxIncluded] = useState("");
  const [insurance, setInsurance] = useState("");
  const [receiveMethod, setReceiveMethod] = useState("");
  const [remark, setRemark] = useState("");
  const [customRemark, setCustomRemark] = useState("");
  const [activePlanTab, setActivePlanTab] = useState<PlanWorkspaceTab>("stockupDetail");
  const [overLimitPromptOpen, setOverLimitPromptOpen] = useState(false);
  const selectedChannel = logisticsPlanChannelOptions.find((item) => item.value === channel);
  const transportModeOptions = selectedChannel?.transportModes.map((value) => ({ label: value, value })) ?? [];
  const totalWeightValue = sumNumber(planRecords.map((record) => record.totalWeight));
  const totalVolumeValue = sumNumber(planRecords.map((record) => record.totalVolume));
  const totalWeight = totalWeightValue.toFixed(2);
  const totalVolume = totalVolumeValue.toFixed(2);
  const exceedsContainerLimit = totalWeightValue >= 17500 && totalVolumeValue >= 65;
  const yesNoOptions = [
    { label: "请选择", value: "" },
    { label: "是", value: "是" },
    { label: "否", value: "否" },
  ];

  useEffect(() => {
    const baseRecord = records[0];
    if (!baseRecord) {
      return;
    }
    const matchedProvider = logisticsProviderOptions.find((item) =>
      item.channels.some((itemChannel) => itemChannel.value === baseRecord.logisticsChannel),
    );
    if (matchedProvider) {
      setProvider(matchedProvider.value);
    }
    setChannel(baseRecord.logisticsChannel);
    setTransportMode(baseRecord.transportMode);
  }, [records]);

  const planTabs: Array<{ label: string; value: PlanWorkspaceTab }> = [
    { label: "备货明细", value: "stockupDetail" },
    { label: "物流信息", value: "logisticsInfo" },
  ];

  function handleAddStockupOrder() {
    const baseRecord = planRecords[0] ?? records[0];
    if (!baseRecord) {
      return;
    }

    const nextRecord = stockupOrderRecords.find(
      (record) =>
        !planRecords.some((item) => item.id === record.id) &&
        record.logisticsProvider === baseRecord.logisticsProvider &&
        record.logisticsChannel === baseRecord.logisticsChannel &&
        record.transportMode === baseRecord.transportMode,
    );

    if (nextRecord) {
      setPlanRecords((current) => [...current, nextRecord]);
    }
  }

  function handleRemoveStockupOrder(recordId: string) {
    setPlanRecords((current) => current.filter((record) => record.id !== recordId));
  }

  function handleChannelChange(value: string) {
    setChannel(value);
    setProvider(getPrimaryProviderByChannel(value)?.value ?? "");
    setTransportMode("");
  }

  function handleFinishLogisticsPlan() {
    if (exceedsContainerLimit) {
      setOverLimitPromptOpen(true);
      return;
    }
    onBack();
  }

  return (
    <div className="space-y-4 pb-16">
      <Card>
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
          <FormFieldRow label="发货方式">
            <ReadonlyText value={displayAggregate(planRecords.map((record) => record.deliveryMode))} />
          </FormFieldRow>
          <FormFieldRow label="装柜时间">
            <Input type="date" />
          </FormFieldRow>
          <FormFieldRow label="截单时间">
            <Input type="date" />
          </FormFieldRow>
          <FormFieldRow label="总毛重(kg)">
            <ReadonlyText value={totalWeight} />
          </FormFieldRow>
          <FormFieldRow label="总体积(m³)">
            <ReadonlyText value={totalVolume} />
          </FormFieldRow>
          <FormFieldRow label="发货仓库">
            <ReadonlyText value={displayAggregate(planRecords.map((record) => record.shipWarehouse))} />
          </FormFieldRow>
          <FormFieldRow label="收货仓库">
            <ReadonlyText value={displayAggregate(planRecords.map((record) => record.receiveWarehouse))} />
          </FormFieldRow>
          <FormFieldRow label="备注" className="md:col-span-2 xl:col-span-4" alignStart>
            <Textarea maxLength={1000} placeholder="请输入备注" value={remark} onChange={(event) => setRemark(event.target.value)} />
            <div className="mt-1 text-right text-caption text-text-muted">{remark.length} / 1000</div>
          </FormFieldRow>
        </div>
      </Card>

      <Card>
        <div className="border-b border-border">
          <Tabs items={planTabs} value={activePlanTab} onChange={setActivePlanTab} />
        </div>
        {activePlanTab === "stockupDetail" ? (
          <div className="mt-4">
            <Button variant="primary" size="sm" onClick={handleAddStockupOrder}>
              添加备货单
            </Button>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[1280px] border-collapse text-left text-small">
                <thead className="bg-bg-page text-text-muted">
                  <tr>
                    <th className={tableHeadCell}>备货单号</th>
                    <th className={tableHeadCell}>中文品名/SKU</th>
                    <th className={tableHeadCell}>第三方仓SKU</th>
                    <th className={tableHeadCell}>MSKU</th>
                    <th className={tableHeadCell}>ASIN</th>
                    <th className={tableHeadCell}>FNSKU</th>
                    <th className={tableHeadCell}>GTIN</th>
                    <th className={tableHeadCell}>备货数量</th>
                    <th className={tableHeadCell}>收货数量</th>
                    <th className={tableHeadCell}>收货状态</th>
                    <th className={tableHeadCell}>备注</th>
                    <th className={tableHeadCell}>操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {planRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap px-3 py-3">{record.stockupNo}</td>
                      <td className="px-3 py-3">示例商品 / {record.sku}</td>
                      <td className="whitespace-nowrap px-3 py-3">3SKU-{record.id.toUpperCase()}</td>
                      <td className="whitespace-nowrap px-3 py-3">{record.sku}</td>
                      <td className="whitespace-nowrap px-3 py-3">-</td>
                      <td className="whitespace-nowrap px-3 py-3">-</td>
                      <td className="whitespace-nowrap px-3 py-3">-</td>
                      <td className="whitespace-nowrap px-3 py-3">{record.stockupQty}</td>
                      <td className="whitespace-nowrap px-3 py-3">0</td>
                      <td className="whitespace-nowrap px-3 py-3">待收货</td>
                      <td className="whitespace-nowrap px-3 py-3">{record.remark}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => handleRemoveStockupOrder(record.id)}>
                          移除
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-bg-page/60 font-medium">
                    <td className="px-3 py-3" colSpan={7}>
                      总计SKU种类：{planRecords.length}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{planRecords.reduce((sum, record) => sum + record.stockupQty, 0)}</td>
                    <td className="whitespace-nowrap px-3 py-3">0</td>
                    <td className="px-3 py-3" colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : activePlanTab === "logisticsInfo" ? (
          <div className="mt-4">
            <div className="border-l-4 border-primary pl-3 font-medium text-text-primary">基础信息</div>
            <div className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
              <FormFieldRow label="物流渠道">
                <Select options={logisticsPlanChannelOptions} value={channel} placeholder="请选择" onValueChange={handleChannelChange} />
              </FormFieldRow>
              <FormFieldRow label="物流商">
                <Input value={provider} placeholder="选择物流渠道后自动带出" disabled className="bg-bg-page text-text-secondary" />
              </FormFieldRow>
              <FormFieldRow label="运输方式">
                <Select options={transportModeOptions} value={transportMode} placeholder="请选择" onValueChange={setTransportMode} disabled={!channel} />
              </FormFieldRow>
              <FormFieldRow label="物流商单号">
                <Input maxLength={100} value={providerOrderNo} placeholder="请输入" onChange={(event) => setProviderOrderNo(event.target.value.replace(/[^a-zA-Z0-9]/g, ""))} />
              </FormFieldRow>
              <FormFieldRow label="计费规则">
                <Select
                  value={chargeRule}
                  placeholder="请选择"
                  onValueChange={setChargeRule}
                  options={[
                    { label: "计费重", value: "计费重" },
                    { label: "实重", value: "实重" },
                    { label: "体积重", value: "体积重" },
                  ]}
                />
              </FormFieldRow>
              <FormFieldRow label="材积参数">
                <ReadonlyText value={selectedChannel?.volumeFactor ?? ""} />
              </FormFieldRow>
            </div>

            <div className="mt-6 border-l-4 border-primary pl-3 font-medium text-text-primary">申报信息</div>
            <div className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
              <FormFieldRow label="一般贸易报关">
                <Select options={yesNoOptions} value={tradeDeclaration} placeholder="请选择" onValueChange={setTradeDeclaration} />
              </FormFieldRow>
              <FormFieldRow label="包税">
                <Select options={yesNoOptions} value={taxIncluded} placeholder="请选择" onValueChange={setTaxIncluded} />
              </FormFieldRow>
              <FormFieldRow label="保险">
                <Select options={yesNoOptions} value={insurance} placeholder="请选择" onValueChange={setInsurance} />
              </FormFieldRow>
              <FormFieldRow label="收件方式">
                <Select
                  value={receiveMethod}
                  placeholder="请选择"
                  onValueChange={setReceiveMethod}
                  options={[
                    { label: "请选择", value: "" },
                    { label: "送货到仓", value: "送货到仓" },
                    { label: "上门揽收", value: "上门揽收" },
                  ]}
                />
              </FormFieldRow>
              <FormFieldRow label="揽收时间">
                <Input type="date" />
              </FormFieldRow>
              <FormFieldRow label="自定义单号">
                <Input maxLength={100} value={customNo} placeholder="请输入" onChange={(event) => setCustomNo(event.target.value.replace(/[^a-zA-Z0-9]/g, ""))} />
              </FormFieldRow>
              <FormFieldRow label="备注" className="md:col-span-2" alignStart>
                <Input maxLength={1000} value={customRemark} placeholder="请输入" onChange={(event) => setCustomRemark(event.target.value)} />
              </FormFieldRow>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center gap-3 border-t border-border bg-white px-6 py-3 shadow-lg">
        <Button variant="secondary" size="sm" onClick={onBack}>取消</Button>
        <Button variant="secondary" size="sm" onClick={handleFinishLogisticsPlan}>保存</Button>
        <Button variant="primary" size="sm" onClick={handleFinishLogisticsPlan}>提交</Button>
      </div>
      {overLimitPromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-[420px] rounded-md bg-white p-5 shadow-xl">
            <div className="text-title font-semibold text-text-primary">提示</div>
            <div className="mt-3 text-body leading-6 text-text-secondary">
              当前物流计划单总毛重{totalWeight}kg＞17.5吨，总体积{totalVolume}m³＞65m³。
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setOverLimitPromptOpen(false);
                  onBack();
                }}
              >
                确定
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function StockupOrderPage({
  activeSubView = "list",
  onSubViewChange,
}: {
  activeSubView?: StockupPageSubView;
  onSubViewChange?: (view: StockupPageSubView) => void;
}) {
  const [creatingRecords, setCreatingRecords] = useState<StockupOrderRecord[] | null>(null);
  const [validationMessage, setValidationMessage] = useState("");
  const [activeStatus, setActiveStatus] = useState<"全部" | StockupStatus>("全部");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [shipWarehouses, setShipWarehouses] = useState<string[]>([]);
  const [shipWarehouseType, setShipWarehouseType] = useState("");
  const [receiveWarehouseType, setReceiveWarehouseType] = useState("");
  const [receiveWarehouses, setReceiveWarehouses] = useState<string[]>([]);
  const [logisticsChannels, setLogisticsChannels] = useState<string[]>([]);
  const [transportModes, setTransportModes] = useState<string[]>([]);
  const [shipmentStatuses, setShipmentStatuses] = useState<string[]>([]);
  const [shippingOrderStatuses, setShippingOrderStatuses] = useState<string[]>([]);
  const [thirdInboundStatuses, setThirdInboundStatuses] = useState<string[]>([]);
  const [logisticsPlanStatuses, setLogisticsPlanStatuses] = useState<string[]>([]);
  const [estimatedShipRange, setEstimatedShipRange] = useState<DateRangeValue>(emptyRange());
  const [timeType, setTimeType] = useState("created");
  const [timeRange, setTimeRange] = useState<DateRangeValue>(emptyRange());
  const [stockupNo, setStockupNo] = useState("");
  const [logisticsPlanNo, setLogisticsPlanNo] = useState("");
  const [shippingPlanNo, setShippingPlanNo] = useState("");
  const [sku, setSku] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openOperationId, setOpenOperationId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const optionSource = stockupOrderRecords;
  const platformOptions = useMemo(() => uniqueOptions(optionSource, (record) => record.platform), []);
  const storeOptions = useMemo(() => uniqueOptions(optionSource, (record) => record.store), []);
  const shipWarehouseOptions = useMemo(() => uniqueOptions(optionSource, (record) => record.shipWarehouse), []);
  const receiveWarehouseOptions = useMemo(() => uniqueOptions(optionSource, (record) => record.receiveWarehouse), []);
  const logisticsChannelOptions = useMemo(() => uniqueOptions(optionSource, (record) => record.logisticsChannel), []);
  const transportModeOptions = useMemo(() => uniqueOptions(optionSource, (record) => record.transportMode), []);
  const relationStatusOptions = relationOptions.map((value) => ({ label: value, value }));
  const statusCounts = useMemo(
    () =>
      statusTabs.map((tab) => ({
        ...tab,
        count:
          tab.value === "全部"
            ? stockupOrderRecords.length
            : stockupOrderRecords.filter((record) => record.status === tab.value).length,
      })),
    [],
  );

  function openCreateLogisticsPlan(records: StockupOrderRecord[]) {
    const message = validateSameLogistics(records);
    if (message) {
      setValidationMessage(message);
      return;
    }

    setValidationMessage("");
    setCreatingRecords(records);
  }

  const filteredRecords = useMemo(() => {
    return stockupOrderRecords.filter((record) => {
      const matchesStatus = activeStatus === "全部" || record.status === activeStatus;
      const matchesPlatform = platforms.length === 0 || platforms.includes(record.platform);
      const matchesStore = stores.length === 0 || stores.includes(record.store);
      const matchesShipWarehouse = shipWarehouses.length === 0 || shipWarehouses.includes(record.shipWarehouse);
      const matchesShipWarehouseType = !shipWarehouseType || record.shipWarehouseType === shipWarehouseType;
      const matchesReceiveWarehouseType = !receiveWarehouseType || record.receiveWarehouseType === receiveWarehouseType;
      const matchesReceiveWarehouse = receiveWarehouses.length === 0 || receiveWarehouses.includes(record.receiveWarehouse);
      const matchesLogisticsChannel = logisticsChannels.length === 0 || logisticsChannels.includes(record.logisticsChannel);
      const matchesTransportMode = transportModes.length === 0 || transportModes.includes(record.transportMode);
      const matchesShipmentStatus = shipmentStatuses.length === 0 || shipmentStatuses.includes(record.shipmentRelationStatus);
      const matchesShippingOrderStatus =
        shippingOrderStatuses.length === 0 || shippingOrderStatuses.includes(record.shippingOrderRelationStatus);
      const matchesThirdInboundStatus =
        thirdInboundStatuses.length === 0 || thirdInboundStatuses.includes(record.thirdInboundRelationStatus);
      const matchesLogisticsPlanStatus =
        logisticsPlanStatuses.length === 0 || logisticsPlanStatuses.includes(record.logisticsPlanRelationStatus);
      const matchesEstimatedShipTime = inDateRange(record.estimatedShipTime, estimatedShipRange);
      const timeValue = timeType === "updated" ? record.updatedAt : record.createdAt;
      const matchesTime = inDateRange(timeValue, timeRange);
      const matchesStockupNo = !stockupNo.trim() || record.stockupNo === stockupNo.trim();
      const matchesLogisticsPlanNo = !logisticsPlanNo.trim() || record.logisticsPlanNo === logisticsPlanNo.trim();
      const matchesShippingPlanNo = !shippingPlanNo.trim() || record.shippingPlanNo === shippingPlanNo.trim();
      const matchesSku = !sku.trim() || record.sku === sku.trim();

      return (
        matchesStatus &&
        matchesPlatform &&
        matchesStore &&
        matchesShipWarehouse &&
        matchesShipWarehouseType &&
        matchesReceiveWarehouseType &&
        matchesReceiveWarehouse &&
        matchesLogisticsChannel &&
        matchesTransportMode &&
        matchesShipmentStatus &&
        matchesShippingOrderStatus &&
        matchesThirdInboundStatus &&
        matchesLogisticsPlanStatus &&
        matchesEstimatedShipTime &&
        matchesTime &&
        matchesStockupNo &&
        matchesLogisticsPlanNo &&
        matchesShippingPlanNo &&
        matchesSku
      );
    });
  }, [
    activeStatus,
    estimatedShipRange,
    logisticsChannels,
    logisticsPlanNo,
    logisticsPlanStatuses,
    platforms,
    receiveWarehouseType,
    receiveWarehouses,
    shipWarehouseType,
    shipWarehouses,
    shipmentStatuses,
    shippingOrderStatuses,
    shippingPlanNo,
    sku,
    stockupNo,
    stores,
    thirdInboundStatuses,
    timeRange,
    timeType,
    transportModes,
  ]);

  useEffect(() => {
    setPage(1);
  }, [filteredRecords.length]);

  const totalPages = Math.max(Math.ceil(filteredRecords.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageIds = pagedRecords.map((record) => record.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const partiallySelected = pageIds.some((id) => selectedIds.includes(id)) && !allSelected;

  function toggleAll() {
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...current, ...pageIds])),
    );
  }

  function toggleRow(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function resetFilters() {
    setActiveStatus("全部");
    setPlatforms([]);
    setStores([]);
    setShipWarehouses([]);
    setShipWarehouseType("");
    setReceiveWarehouseType("");
    setReceiveWarehouses([]);
    setLogisticsChannels([]);
    setTransportModes([]);
    setShipmentStatuses([]);
    setShippingOrderStatuses([]);
    setThirdInboundStatuses([]);
    setLogisticsPlanStatuses([]);
    setEstimatedShipRange(emptyRange());
    setTimeType("created");
    setTimeRange(emptyRange());
    setStockupNo("");
    setLogisticsPlanNo("");
    setShippingPlanNo("");
    setSku("");
    setPage(1);
  }

  function handleRowAction(action: string, record: StockupOrderRecord) {
    setOpenOperationId(null);
    if (action === "生成物流计划单") {
      openCreateLogisticsPlan([record]);
    }
  }

  if (creatingRecords) {
    return <CreateLogisticsPlanPage records={creatingRecords} onBack={() => setCreatingRecords(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-border bg-white px-1">
        <Tabs items={stockupPageMenuTabs} value={activeSubView} onChange={(value) => onSubViewChange?.(value)} />
      </div>

      {activeSubView === "feeDetail" ? (
        <StockupFeeDetailSection />
      ) : (
        <>
        <Card>
        <div className="flex flex-wrap items-center gap-6 border-b border-border">
          {statusCounts.map((tab) => {
            const active = tab.value === activeStatus;
            return (
              <button
                key={tab.value}
                type="button"
                className={`-mb-px border-b-2 pb-3 text-body transition ${
                  active ? "border-primary font-medium text-primary" : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
                onClick={() => setActiveStatus(tab.value)}
              >
                {tab.label}({tab.count})
              </button>
            );
          })}
        </div>
        <ExclusiveFilterGroup>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <MultiSelectFilter className="w-[180px]" placeholder="平台" options={platformOptions} value={platforms} onChange={setPlatforms} />
          <MultiSelectFilter className="w-[180px]" placeholder="店铺" options={storeOptions} value={stores} onChange={setStores} />
          <MultiSelectFilter className="w-[180px]" placeholder="发货仓库" options={shipWarehouseOptions} value={shipWarehouses} onChange={setShipWarehouses} />
          <Select
            className="w-[160px]"
            placeholder="发货仓库类型"
            value={shipWarehouseType}
            onValueChange={setShipWarehouseType}
            options={[
              { label: "全部发货仓库类型", value: "" },
              { label: "实体仓", value: "实体仓" },
              { label: "虚拟仓", value: "虚拟仓" },
            ]}
          />
          <Select
            className="w-[160px]"
            placeholder="收货仓库类型"
            value={receiveWarehouseType}
            onValueChange={setReceiveWarehouseType}
            options={[
              { label: "全部收货仓库类型", value: "" },
              { label: "三方仓", value: "三方仓" },
              { label: "平台仓", value: "平台仓" },
            ]}
          />
          <MultiSelectFilter className="w-[180px]" placeholder="收货仓库" options={receiveWarehouseOptions} value={receiveWarehouses} onChange={setReceiveWarehouses} />
          <MultiSelectFilter className="w-[180px]" placeholder="物流渠道" options={logisticsChannelOptions} value={logisticsChannels} onChange={setLogisticsChannels} />
          <MultiSelectFilter className="w-[180px]" placeholder="运输方式" options={transportModeOptions} value={transportModes} onChange={setTransportModes} />
          <MultiSelectFilter className="w-[180px]" placeholder="关联货件状态" options={relationStatusOptions} value={shipmentStatuses} onChange={setShipmentStatuses} />
          <MultiSelectFilter className="w-[180px]" placeholder="关联发运单状态" options={relationStatusOptions} value={shippingOrderStatuses} onChange={setShippingOrderStatuses} />
          <MultiSelectFilter className="w-[180px]" placeholder="关联第三方入库单状态" options={relationStatusOptions} value={thirdInboundStatuses} onChange={setThirdInboundStatuses} />
          <MultiSelectFilter className="w-[180px]" placeholder="关联物流计划单状态" options={relationStatusOptions} value={logisticsPlanStatuses} onChange={setLogisticsPlanStatuses} />
          <div className="w-[280px]">
            <DateRangePicker value={estimatedShipRange} onChange={setEstimatedShipRange} />
          </div>
          <Select
            className="w-[128px]"
            value={timeType}
            onValueChange={setTimeType}
            options={[
              { label: "创建时间", value: "created" },
              { label: "更新时间", value: "updated" },
            ]}
          />
          <div className="w-[280px]">
            <DateRangePicker value={timeRange} onChange={setTimeRange} />
          </div>
          <Input className="w-[180px]" placeholder="备货单号" value={stockupNo} onChange={(event) => setStockupNo(event.target.value)} />
          <Input className="w-[180px]" placeholder="物流计划单号" value={logisticsPlanNo} onChange={(event) => setLogisticsPlanNo(event.target.value)} />
          <Input className="w-[180px]" placeholder="发货计划号" value={shippingPlanNo} onChange={(event) => setShippingPlanNo(event.target.value)} />
          <Input className="w-[160px]" placeholder="SKU" value={sku} onChange={(event) => setSku(event.target.value)} />
          <Button variant="primary" size="sm">查询</Button>
          <Button variant="secondary" size="sm" onClick={resetFilters}>重置</Button>
        </div>
        </ExclusiveFilterGroup>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm">作废</Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openCreateLogisticsPlan(stockupOrderRecords.filter((record) => selectedIds.includes(record.id)))}
            >
              生成物流计划单
            </Button>
            <Button variant="secondary" size="sm">打印第三方SKU标签</Button>
            <Button variant="secondary" size="sm">打印箱唛标签</Button>
            <Button variant="secondary" size="sm">下推生成WMS发运单</Button>
            <Button variant="secondary" size="sm">下推第三方入库单</Button>
          </div>
          <Button variant="secondary" size="sm">导出</Button>
        </div>
        {validationMessage ? (
          <div className="border-b border-warning bg-warning/10 px-4 py-2 text-small text-warning">
            {validationMessage}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[3400px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={`w-10 ${tableHeadCell}`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = partiallySelected;
                      }
                    }}
                    onChange={toggleAll}
                  />
                </th>
                <th className={tableHeadCell}>备货单号</th>
                <th className={tableHeadCell}>平台</th>
                <th className={tableHeadCell}>店铺</th>
                <th className={tableHeadCell}>发货仓库类型</th>
                <th className={tableHeadCell}>发货仓库</th>
                <th className={tableHeadCell}>收货仓库类型</th>
                <th className={tableHeadCell}>收货仓库</th>
                <th className={tableHeadCell}>物流渠道</th>
                <th className={tableHeadCell}>发货方式</th>
                <th className={tableHeadCell}>运输方式</th>
                <th className={tableHeadCell}>总毛重(kg)</th>
                <th className={tableHeadCell}>总体积(m³)</th>
                <th className={tableHeadCell}>关联物流计划单号</th>
                <th className={tableHeadCell}>关联发货计划号</th>
                <th className={tableHeadCell}>关联货件号</th>
                <th className={tableHeadCell}>关联第三方库单号</th>
                <th className={tableHeadCell}>关联货件状态</th>
                <th className={tableHeadCell}>关联第三方入库单状态</th>
                <th className={tableHeadCell}>关联物流计划状态</th>
                <th className={tableHeadCell}>备注</th>
                <th className={tableHeadCell}>预计发货时间</th>
                <th className={tableHeadCell}>更新人/更新时间</th>
                <th className={tableHeadCell}>创建人/创建时间</th>
                <th className={tableHeadCell}>单据状态</th>
                <th className={tableHeadCell}>备货数量</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleRow(record.id)} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-primary">{record.stockupNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.platform}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.store}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.shipWarehouseType}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.shipWarehouse}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.receiveWarehouseType}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.receiveWarehouse}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsChannel}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.deliveryMode}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.transportMode}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.totalWeight}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.totalVolume}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsPlanNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.shippingPlanNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.shipmentNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.thirdInboundNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.shipmentRelationStatus}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.thirdInboundRelationStatus}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsPlanRelationStatus}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.remark}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.estimatedShipTime}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.updater}</div>
                    <div className="text-text-muted">{record.updatedAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.creator}</div>
                    <div className="text-text-muted">{record.createdAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <Badge tone={statusTone(record.status)}>{record.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.stockupQty}</td>
                  <RowOperationCell
                    record={record}
                    open={openOperationId === record.id}
                    onToggle={() => setOpenOperationId((current) => (current === record.id ? null : record.id))}
                    onAction={handleRowAction}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalCount={filteredRecords.length}
          pageSize={pageSize}
          showTopBorder
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(1);
          }}
        />
      </Card>
        </>
      )}
    </div>
  );
}
