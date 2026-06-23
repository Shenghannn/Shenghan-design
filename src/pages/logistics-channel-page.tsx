import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DateRangePicker, type DateRangeValue } from "../components/ui/date-range-picker";
import { ExclusiveFilterGroup, useExclusiveFilterPanel } from "../components/ui/exclusive-filter-group";
import { Input } from "../components/ui/input";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/cn";

type LogisticsChannelStatus = "启用" | "禁用";
type FirstLegProviderMode = "single" | "multi";
type QuoteServiceScope = "全程运输" | "分段运输";

type SchemeProviderRow = {
  id: string;
  partner: string;
  serviceTypes: string[];
  relatedQuoteName: string;
  remark: string;
};

type LogisticsChannelRecord = {
  id: string;
  channelId: string;
  providerChannelId: string;
  providerChannelName: string;
  transportMode: string;
  routeLine: string;
  agingDays: number;
  volumeFactor: string;
  remark: string;
  firstLegProviderMode: FirstLegProviderMode;
  providers: SchemeProviderRow[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  status: LogisticsChannelStatus;
};

function createProviderRow(id?: string): SchemeProviderRow {
  return {
    id: id ?? `provider-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    partner: "",
    serviceTypes: [],
    relatedQuoteName: "",
    remark: "",
  };
}

function cloneProviderRows(providers: SchemeProviderRow[]): SchemeProviderRow[] {
  return providers.map((provider) => ({
    ...provider,
    serviceTypes: [...provider.serviceTypes],
  }));
}

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";
const schemeTableHeadCell = `${tableHeadCell} align-top`;
const schemeTableCell = "px-3 py-3 align-top";

const transportModeOptions = [
  { label: "全部运输方式", value: "all" },
  { label: "海运", value: "海运" },
  { label: "快递", value: "快递" },
  { label: "空运", value: "空运" },
];

const statusOptions = [
  { label: "全部状态", value: "all" },
  { label: "启用", value: "启用" },
  { label: "禁用", value: "禁用" },
];

const channelStatusOptions = [
  { label: "启用", value: "启用" },
  { label: "禁用", value: "禁用" },
];

const firstLegProviderModeOptions = [
  { label: "单一物流商", value: "single" },
  { label: "多物流商联运", value: "multi" },
];

const firstLegProviderModeFilterOptions = [
  { label: "全部头程物流商模式", value: "all" },
  ...firstLegProviderModeOptions,
];

const logisticsQuoteRecords = [
  {
    quoteName: "美南标快-义乌双捷分段运输报价",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    destination: "美国-加利福尼亚州-洛杉矶",
    serviceScope: "分段运输" as QuoteServiceScope,
  },
  {
    quoteName: "欧洲快线-浙江融盛全程散货报价",
    logisticsProvider: "浙江融盛国际物流有限公司",
    destination: "德国-北威州-科隆",
    serviceScope: "全程运输" as QuoteServiceScope,
  },
  {
    quoteName: "加拿大卡派-宁波赛蓝整柜报价",
    logisticsProvider: "宁波赛蓝供应链服务有限公司",
    destination: "加拿大-安大略省-多伦多",
    serviceScope: "全程运输" as QuoteServiceScope,
  },
];

const quoteNameOptions = logisticsQuoteRecords.map((record) => ({ label: record.quoteName, value: record.quoteName }));

const providerOptions = [
  { label: "义乌市双捷国际货运代理有限公司", value: "义乌市双捷国际货运代理有限公司" },
  { label: "浙江融盛国际物流有限公司", value: "浙江融盛国际物流有限公司" },
  { label: "深圳市以达物流有限公司(谷仓海外仓)", value: "深圳市以达物流有限公司(谷仓海外仓)" },
  { label: "宁波赛蓝供应链服务有限公司", value: "宁波赛蓝供应链服务有限公司" },
];

const providerServiceTypeOptions: Record<string, string[]> = {
  "义乌市双捷国际货运代理有限公司": ["国内揽收", "国内操作", "报关服务", "干线运输"],
  "浙江融盛国际物流有限公司": ["清关服务", "税务处理", "尾程派送", "异常处理"],
  "深圳市以达物流有限公司(谷仓海外仓)": ["海外仓操作", "尾程派送", "本地配送", "仓储服务"],
  "宁波赛蓝供应链服务有限公司": ["起运港操作", "订舱服务", "干线海运", "清关服务"],
};

function normalizeProviderName(value: string) {
  if (providerServiceTypeOptions[value]) {
    return value;
  }
  if (value.includes("义乌") || value.includes("双捷")) {
    return "义乌市双捷国际货运代理有限公司";
  }
  if (value.includes("浙江融盛")) {
    return "浙江融盛国际物流有限公司";
  }
  if (value.includes("深圳") || value.includes("以达") || value.includes("USPS") || value.includes("FedEx")) {
    return "深圳市以达物流有限公司(谷仓海外仓)";
  }
  if (value.includes("宁波") || value.includes("赛蓝")) {
    return "宁波赛蓝供应链服务有限公司";
  }
  return value;
}

const defaultServiceTypeOptions = ["国内揽收", "干线运输", "清关服务", "尾程派送"];

function buildProvidersFromLegacy(
  partners: string[],
  _feeSegments: string[],
  legacySchemeCount = 1,
): SchemeProviderRow[] {
  const normalizedPartners = partners.map((partner) => normalizeProviderName(partner));
  const providers = legacySchemeCount > 1 ? normalizedPartners : normalizedPartners.slice(0, 1);
  return providers.map((partner, index) => ({
    id: `provider-${index + 1}`,
    partner,
    serviceTypes: [getProviderServiceTypes(partner)[index] ?? getProviderServiceTypes(partner)[0] ?? defaultServiceTypeOptions[0]],
    relatedQuoteName: quoteNameOptions[index % quoteNameOptions.length]?.value ?? "",
    remark: "",
  }));
}

function getProviderServiceTypes(partner: string) {
  const normalized = normalizeProviderName(partner);
  return providerServiceTypeOptions[normalized] ?? defaultServiceTypeOptions;
}

function getProviderModeLabel(mode: FirstLegProviderMode) {
  return mode === "multi" ? "多物流商联运" : "单一物流商";
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

function matchesQuoteDestination(quoteDestination: string, routeLine: string) {
  if (!routeLine) {
    return true;
  }
  const routeCountry = routeLine.split("-")[0];
  return quoteDestination.includes(routeCountry) || routeLine.includes(quoteDestination);
}

function getQuoteOptionsByProviderAndScope(provider: string, routeLine: string, serviceScope: QuoteServiceScope) {
  const normalizedProvider = normalizeProviderName(provider);
  const matchedQuotes = logisticsQuoteRecords.filter(
    (record) =>
      record.serviceScope === serviceScope &&
      normalizeProviderName(record.logisticsProvider) === normalizedProvider &&
      matchesQuoteDestination(record.destination, routeLine),
  );
  const fallbackQuotes = logisticsQuoteRecords.filter(
    (record) => record.serviceScope === serviceScope && normalizeProviderName(record.logisticsProvider) === normalizedProvider,
  );
  const quotes = matchedQuotes.length ? matchedQuotes : fallbackQuotes;
  return quotes.map((record) => ({ label: record.quoteName, value: record.quoteName }));
}

const logisticsChannelRecords: LogisticsChannelRecord[] = [
  {
    id: "lc-001",
    channelId: "WL011",
    providerChannelId: "EPP-USA-001",
    providerChannelName: "易可达标准",
    transportMode: "海运",
    routeLine: "美国-加州洛杉矶-希尔顿",
    agingDays: 66,
    volumeFactor: "6000",
    remark: "谷仓海外仓标准渠道",
    firstLegProviderMode: "single",
    providers: buildProvidersFromLegacy(
      ["深圳以达", "美西卡车派送", "USPS尾程"],
      ["国内揽收费-深圳以达", "美西卡派费-美西卡车派送", "尾程派送费-USPS尾程"],
    ),
    createdBy: "张晓莹",
    createdAt: "2026-04-13 15:47:29",
    updatedBy: "兰轩",
    updatedAt: "2026-06-05 15:01:26",
    status: "启用",
  },
  {
    id: "lc-002",
    channelId: "WL001",
    providerChannelId: "EPP-USA-002",
    providerChannelName: "双捷海运",
    transportMode: "海运",
    routeLine: "美国-加州洛杉矶-希尔顿、美国-休斯顿",
    agingDays: 21,
    volumeFactor: "6000",
    remark: "美南海运标快",
    firstLegProviderMode: "single",
    providers: buildProvidersFromLegacy(
      ["义乌双捷", "美森快船", "FedEx尾程"],
      ["国内操作费-义乌双捷", "干线海运费-美森快船", "尾程派送费-FedEx尾程"],
    ),
    createdBy: "兰轩",
    createdAt: "2026-05-06 14:37:38",
    updatedBy: "兰轩",
    updatedAt: "2026-06-05 15:01:34",
    status: "启用",
  },
  {
    id: "lc-003",
    channelId: "WL002",
    providerChannelId: "EPP-USA-004",
    providerChannelName: "宁波赛蓝",
    transportMode: "海运",
    routeLine: "美国-加州洛杉矶-希尔顿、美国-纽约",
    agingDays: 222,
    volumeFactor: "5000",
    remark: "宁波赛蓝海运渠道",
    firstLegProviderMode: "single",
    providers: buildProvidersFromLegacy(
      ["宁波赛蓝", "Matson", "海外仓卡派"],
      ["起运港操作费-宁波赛蓝", "干线运费-Matson", "海外仓卡派费-海外仓卡派"],
    ),
    createdBy: "兰轩",
    createdAt: "2026-05-07 17:27:13",
    updatedBy: "兰轩",
    updatedAt: "2026-06-05 15:00:50",
    status: "启用",
  },
  {
    id: "lc-004",
    channelId: "WL001",
    providerChannelId: "EPP-USA-003",
    providerChannelName: "海运联运",
    transportMode: "海运",
    routeLine: "美国-加州洛杉矶-希尔顿、美国-纽约",
    agingDays: 21,
    volumeFactor: "6000",
    remark: "多段联运渠道，含多物流商联运",
    firstLegProviderMode: "multi",
    providers: buildProvidersFromLegacy(
      ["义乌双捷", "美西港口服务商", "UPS尾程"],
      ["国内集货费-义乌双捷", "港口处理费-美西港口服务商", "尾程派送费-UPS尾程"],
      2,
    ),
    createdBy: "兰轩",
    createdAt: "2026-05-07 14:50:46",
    updatedBy: "兰轩",
    updatedAt: "2026-05-28 11:20:42",
    status: "启用",
  },
  {
    id: "lc-005",
    channelId: "WL001",
    providerChannelId: "EPP-CAN-001",
    providerChannelName: "紫式",
    transportMode: "海运",
    routeLine: "加拿大-大多伦多配送线路、温哥华线路",
    agingDays: 1,
    volumeFactor: "5000",
    remark: "加拿大本地配送",
    firstLegProviderMode: "single",
    providers: buildProvidersFromLegacy(
      ["义乌双捷", "加拿大清关行", "本地卡派"],
      ["国内操作费-义乌双捷", "清关服务费-加拿大清关行", "本地配送费-本地卡派"],
    ),
    createdBy: "超级管理员",
    createdAt: "2026-05-19 09:54:13",
    updatedBy: "超级管理员",
    updatedAt: "2026-05-19 09:54:13",
    status: "启用",
  },
  {
    id: "lc-006",
    channelId: "WL001",
    providerChannelId: "EXP-USA-001",
    providerChannelName: "单快",
    transportMode: "快递",
    routeLine: "美国-纽约州-纽约市",
    agingDays: 7,
    volumeFactor: "6000",
    remark: "DHL快递渠道",
    firstLegProviderMode: "single",
    providers: buildProvidersFromLegacy(
      ["义乌双捷", "DHL Express"],
      ["国内揽收费-义乌双捷", "国际快递费-DHL Express"],
    ),
    createdBy: "李莎丽",
    createdAt: "2026-03-30 13:14:16",
    updatedBy: "超级管理员",
    updatedAt: "2026-04-29 20:33:36",
    status: "启用",
  },
  {
    id: "lc-007",
    channelId: "WL013",
    providerChannelId: "EXP-USA-003",
    providerChannelName: "特快",
    transportMode: "快递",
    routeLine: "美国-加州洛杉矶-希尔顿",
    agingDays: 8,
    volumeFactor: "6000",
    remark: "UPS特快渠道",
    firstLegProviderMode: "single",
    providers: buildProvidersFromLegacy(
      ["浙江融盛", "UPS Express"],
      ["国内操作费-浙江融盛", "国际快递费-UPS Express"],
    ),
    createdBy: "周婷婷",
    createdAt: "2026-03-30 15:35:17",
    updatedBy: "超级管理员",
    updatedAt: "2026-04-29 17:43:50",
    status: "启用",
  },
  {
    id: "lc-008",
    channelId: "WL001",
    providerChannelId: "EXP-USA-002",
    providerChannelName: "绿卡",
    transportMode: "快递",
    routeLine: "美国-加州洛杉矶-希尔顿",
    agingDays: 8,
    volumeFactor: "6000",
    remark: "快递禁用渠道",
    firstLegProviderMode: "single",
    providers: buildProvidersFromLegacy(
      ["义乌双捷", "FedEx", "USPS尾程"],
      ["国内集货费-义乌双捷", "干线快递费-FedEx", "尾程派送费-USPS尾程"],
    ),
    createdBy: "周婷婷",
    createdAt: "2026-03-30 15:35:17",
    updatedBy: "超级管理员",
    updatedAt: "2026-04-13 16:10:03",
    status: "禁用",
  },
];

const routeTree = [
  {
    country: "加拿大（CAN）",
    provinces: [
      { name: "不列颠哥伦比亚省（BC）", cities: ["温哥华", "本拿比", "列治文"] },
      { name: "安大略省（ON）", cities: ["多伦多", "渥太华"] },
      { name: "魁北克省（QC）", cities: ["蒙特利尔"] },
    ],
  },
  {
    country: "德国（DEU）",
    provinces: [
      { name: "北莱茵-威斯特法伦州", cities: ["科隆", "杜塞尔多夫"] },
      { name: "巴伐利亚州", cities: ["慕尼黑", "纽伦堡"] },
    ],
  },
  {
    country: "英国（GBR）",
    provinces: [
      { name: "英格兰", cities: ["伦敦", "曼彻斯特"] },
      { name: "苏格兰", cities: ["爱丁堡"] },
    ],
  },
  {
    country: "美国（USA）",
    provinces: [
      { name: "加利福尼亚州（CA）", cities: ["洛杉矶", "希尔顿", "旧金山"] },
      { name: "纽约州（NY）", cities: ["纽约市", "布法罗"] },
      { name: "德克萨斯州（TX）", cities: ["休斯顿", "达拉斯"] },
    ],
  },
];

function buildOptions(values: string[], allLabel: string) {
  return [
    { label: allLabel, value: "all" },
    ...Array.from(new Set(values)).map((value) => ({ label: value, value })),
  ];
}

function statusTone(status: LogisticsChannelStatus) {
  return status === "启用" ? "success" : "closed";
}

function SectionTitle({ children }: { children: string }) {
  return <div className="border-l-4 border-primary pl-3 font-medium text-text-primary">{children}</div>;
}

function SelectChevron({ open, hideOnHover }: { open: boolean; hideOnHover?: boolean }) {
  return (
    <ChevronDown
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-transform",
        hideOnHover && "group-hover:opacity-0",
        open && "rotate-180",
      )}
    />
  );
}

function FormRow({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2", className)}>
      <div className="w-full shrink-0 text-left text-small text-text-secondary sm:w-[112px] sm:text-right">
        {required ? <span className="mr-1 text-danger">*</span> : null}
        {label}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 text-small sm:grid-cols-[112px_1fr] sm:gap-3">
      <div className="text-text-secondary">{label}：</div>
      <div className="min-w-0 break-words text-text-primary">{value || "-"}</div>
    </div>
  );
}

function RouteSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const panelId = useId();
  const { open, setOpen, toggle } = useExclusiveFilterPanel(panelId);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [activeCountry, setActiveCountry] = useState(routeTree[0].country);
  const country = routeTree.find((item) => item.country === activeCountry) ?? routeTree[0];
  const [activeProvince, setActiveProvince] = useState(country.provinces[0].name);
  const province = country.provinces.find((item) => item.name === activeProvince) ?? country.provinces[0];
  const selectedRoutes = value ? value.split("、").filter(Boolean) : [];

  function toggleRoute(route: string) {
    const next = selectedRoutes.includes(route)
      ? selectedRoutes.filter((item) => item !== route)
      : [...selectedRoutes, route];
    onChange(next.join("、"));
  }

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, setOpen]);

  return (
    <div ref={rootRef} className="group relative">
      <button
        type="button"
        className="field-control flex w-full items-center justify-between gap-2 pr-10 text-left"
        onClick={toggle}
      >
        <span className={value ? "min-w-0 flex-1 truncate text-text-primary" : "min-w-0 flex-1 truncate text-text-placeholder"}>
          {value || "请选择目的地"}
        </span>
        <SelectChevron open={open} />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 grid w-[720px] grid-cols-3 rounded-md border border-border bg-white shadow-lg">
          <div className="max-h-[260px] overflow-auto border-r border-border py-2">
            {routeTree.map((item) => (
              <button
                key={item.country}
                type="button"
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-small hover:bg-bg-hover ${
                  item.country === activeCountry ? "font-medium text-primary" : "text-text-primary"
                }`}
                onClick={() => {
                  setActiveCountry(item.country);
                  setActiveProvince(item.provinces[0].name);
                }}
              >
                <span><input type="checkbox" className="mr-2" readOnly />{item.country}</span>
                <span>›</span>
              </button>
            ))}
          </div>
          <div className="max-h-[260px] overflow-auto border-r border-border py-2">
            {country.provinces.map((item) => (
              <button
                key={item.name}
                type="button"
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-small hover:bg-bg-hover ${
                  item.name === activeProvince ? "font-medium text-primary" : "text-text-primary"
                }`}
                onClick={() => setActiveProvince(item.name)}
              >
                <span><input type="checkbox" className="mr-2" readOnly />{item.name}</span>
                <span>›</span>
              </button>
            ))}
          </div>
          <div className="max-h-[260px] overflow-auto py-2">
            {province.cities.map((city) => {
              const route = `${activeCountry.replace(/（.*）/, "")}-${province.name.replace(/（.*）/, "")}-${city}`;
              return (
                <label key={city} className="flex cursor-pointer items-center px-4 py-2 text-small hover:bg-bg-hover">
                  <input type="checkbox" className="mr-2" checked={selectedRoutes.includes(route)} onChange={() => toggleRoute(route)} />
                  {city}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OptionMultiSelect({
  value,
  options,
  disabled,
  placeholder = "请选择",
  clearAriaLabel = "清空选项",
  onChange,
}: {
  value: string[];
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  clearAriaLabel?: string;
  onChange: (value: string[]) => void;
}) {
  const panelId = useId();
  const { open, setOpen, toggle } = useExclusiveFilterPanel(panelId);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    opacity: 0,
    pointerEvents: "none",
  });
  const [menuMaxHeight, setMenuMaxHeight] = useState(240);
  const canClear = !disabled && value.length > 0;

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updateMenuPosition() {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 8;
      const menuOffset = 4;
      const estimatedHeight = Math.min(Math.max(options.length * 34 + 16, 80), 240);
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const placeBelow = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove;
      const availableHeight = Math.max(80, (placeBelow ? spaceBelow : spaceAbove) - menuOffset);
      const menuHeight = Math.min(estimatedHeight, availableHeight);
      const width = Math.max(rect.width, 220);
      const maxLeft = Math.max(viewportPadding, window.innerWidth - viewportPadding - width);
      const left = Math.min(Math.max(rect.left, viewportPadding), maxLeft);
      const top = placeBelow ? rect.bottom + menuOffset : rect.top - menuOffset - menuHeight;

      setMenuMaxHeight(availableHeight);
      setMenuStyle({
        position: "fixed",
        top: Math.max(viewportPadding, top),
        left,
        width,
        zIndex: 80,
        opacity: 1,
        pointerEvents: "auto",
      });
    }

    updateMenuPosition();
    const frameId = window.requestAnimationFrame(updateMenuPosition);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, options.length]);

  function toggleOption(option: string) {
    const nextValue = value.includes(option) ? value.filter((item) => item !== option) : [...value, option];
    onChange(nextValue);
  }

  const visibleTags = value.slice(0, 1);
  const hiddenCount = Math.max(value.length - visibleTags.length, 0);

  return (
    <div ref={rootRef} className="group relative min-w-[140px]">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        className={`field-control flex w-full items-center justify-between gap-2 pr-10 text-left ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onClick={() => {
          if (!disabled) {
            toggle();
          }
        }}
      >
        {value.length ? (
          <span className="flex min-w-0 items-center gap-1">
            {visibleTags.map((item) => (
              <span key={item} className="inline-flex max-w-[120px] items-center rounded-sm bg-bg-page px-2 py-0.5 text-small text-text-primary">
                <span className="truncate">{item}</span>
              </span>
            ))}
            {hiddenCount > 0 ? (
              <span className="inline-flex shrink-0 items-center rounded-sm bg-bg-page px-2 py-0.5 text-small text-text-primary">
                + {hiddenCount}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="truncate text-text-placeholder">{placeholder}</span>
        )}
        <SelectChevron open={open} hideOnHover={canClear} />
      </button>
      {canClear ? (
        <button
          type="button"
          aria-label={clearAriaLabel}
          className="absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-text-muted hover:border-primary hover:text-primary group-hover:flex"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onChange([]);
            setOpen(false);
          }}
        >
          <X aria-hidden="true" className="h-3 w-3" />
        </button>
      ) : null}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div ref={menuRef} style={menuStyle} className="rounded-sm border border-border bg-white p-1 shadow-md">
              <div className="overflow-auto py-1" style={{ maxHeight: menuMaxHeight }}>
                {options.map((option) => {
                  const checked = value.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-sm px-3 text-left text-small transition hover:bg-bg-hover ${
                        checked ? "font-medium text-primary" : "text-text-primary"
                      }`}
                      onClick={() => toggleOption(option)}
                    >
                      <span className="truncate">{option}</span>
                      <span className="w-4 shrink-0 text-primary">{checked ? "✓" : ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function LogisticsChannelForm({
  mode,
  record,
  onBack,
  onSubmit,
}: {
  mode: "create" | "edit";
  record?: LogisticsChannelRecord;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [channelName, setChannelName] = useState(record?.providerChannelName ?? "");
  const [transportMode, setTransportMode] = useState(record?.transportMode ?? "");
  const [routeLine, setRouteLine] = useState(record?.routeLine ?? "");
  const [status, setStatus] = useState<LogisticsChannelStatus>(record?.status ?? "启用");
  const [remark, setRemark] = useState(record?.remark ?? "");
  const [firstLegProviderMode, setFirstLegProviderMode] = useState<FirstLegProviderMode>(() =>
    record?.firstLegProviderMode ?? ((record?.providers?.length ?? 0) > 1 ? "multi" : "single"),
  );
  const [providers, setProviders] = useState<SchemeProviderRow[]>(() =>
    record?.providers?.length ? cloneProviderRows(record.providers) : [createProviderRow("provider-1")],
  );
  const primaryProvider = providers[0] ?? createProviderRow("provider-1");

  function updateProviders(updater: (current: SchemeProviderRow[]) => SchemeProviderRow[]) {
    setProviders((current) => {
      const next = updater(current);
      return next.length > 0 ? next : current;
    });
  }

  function handleProviderModeChange(value: string) {
    const nextMode = value as FirstLegProviderMode;
    setFirstLegProviderMode(nextMode);
    setProviders((current) => {
      const safeProviders = current.length > 0 ? current : [createProviderRow("provider-1")];
      return nextMode === "single" ? [safeProviders[0]] : safeProviders;
    });
  }

  function addProvider() {
    updateProviders((current) => [...current, createProviderRow()]);
  }

  function removeProvider(providerId: string) {
    updateProviders((current) => (current.length <= 1 ? current : current.filter((provider) => provider.id !== providerId)));
  }

  function updateProvider(providerId: string, updater: (provider: SchemeProviderRow) => SchemeProviderRow) {
    updateProviders((current) => current.map((provider) => (provider.id === providerId ? updater(provider) : provider)));
  }

  const singleQuoteOptions = getQuoteOptionsByProviderAndScope(primaryProvider.partner, routeLine, "全程运输");

  function getAvailableProviderOptions(rowId: string) {
    const selectedPartners = new Set(
      providers.filter((provider) => provider.id !== rowId).map((provider) => provider.partner).filter(Boolean),
    );
    return providerOptions.filter((option) => !selectedPartners.has(option.value));
  }

  function handleSubmit() {
    onSubmit();
  }

  return (
    <div className="space-y-4 pb-16">
      <ExclusiveFilterGroup>
      <Card>
        <SectionTitle>基本信息</SectionTitle>
        <div className="mt-4 grid items-start gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <FormRow label="物流渠道" required>
            <Input value={channelName} placeholder="请输入物流渠道" maxLength={50} onChange={(event) => setChannelName(event.target.value)} />
          </FormRow>
          <FormRow label="头程物流商模式" required>
            <Select
              value={firstLegProviderMode}
              options={firstLegProviderModeOptions}
              clearable={false}
              onValueChange={handleProviderModeChange}
            />
          </FormRow>
          {firstLegProviderMode === "single" ? (
            <FormRow label="物流商" required>
              <Select
                value={primaryProvider.partner}
                placeholder="请选择物流商"
                options={providerOptions}
                onValueChange={(value) =>
                  updateProviders((current) => {
                    const [firstProvider] = current.length > 0 ? current : [createProviderRow("provider-1")];
                    return [{ ...firstProvider, partner: value, serviceTypes: [] }];
                  })
                }
              />
            </FormRow>
          ) : null}
          <FormRow label="目的地" required>
            <RouteSelector value={routeLine} onChange={setRouteLine} />
          </FormRow>
          <FormRow label="运输方式" required>
            <Select value={transportMode} placeholder="请选择运输方式" options={transportModeOptions.filter((item) => item.value !== "all")} onValueChange={setTransportMode} />
          </FormRow>
          <FormRow label="物流周期" required>
            <div className="flex">
              <Input defaultValue={record?.agingDays ? String(record.agingDays) : ""} placeholder="请输入物流周期" />
              <span className="inline-flex h-input-md items-center border border-l-0 border-border bg-bg-page px-3 text-text-secondary">天</span>
            </div>
          </FormRow>
          {firstLegProviderMode === "single" ? (
            <FormRow label="关联报价" required>
              <Select
                value={primaryProvider.relatedQuoteName}
                placeholder={singleQuoteOptions.length ? "请选择关联报价" : "暂无匹配全程运输报价"}
                options={singleQuoteOptions}
                onValueChange={(value) =>
                  updateProviders((current) => {
                    const [firstProvider] = current.length > 0 ? current : [createProviderRow("provider-1")];
                    return [{ ...firstProvider, relatedQuoteName: value }];
                  })
                }
              />
            </FormRow>
          ) : null}
          <FormRow label="状态" required>
            <Select value={status} options={channelStatusOptions} onValueChange={(value) => setStatus(value as LogisticsChannelStatus)} />
          </FormRow>
          <FormRow label="积材参数" required>
            <Input defaultValue={record?.volumeFactor} placeholder="请输入积材参数" />
          </FormRow>
          <FormRow label="备注" className="sm:col-span-2 sm:col-start-1 xl:col-span-2 2xl:col-span-2 !items-start sm:!items-start">
            <Textarea className="min-h-[72px]" maxLength={1000} value={remark} placeholder="请输入备注" onChange={(event) => setRemark(event.target.value)} />
          </FormRow>
        </div>
      </Card>

      {firstLegProviderMode === "multi" ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SectionTitle>联运物流商</SectionTitle>
            <Button variant="primary" size="sm" className="self-start sm:self-auto" onClick={addProvider}>
              添加物流商
            </Button>
          </div>
          <div className="mt-4 -mx-px overflow-x-auto">
            <table className="w-full min-w-[920px] table-fixed border-collapse text-left text-small">
              <colgroup>
                <col className="w-14" />
                <col className="w-[24%]" />
                <col className="w-[22%]" />
                <col className="w-[24%]" />
                <col className="w-[24%]" />
                <col className="w-16" />
              </colgroup>
              <thead className="bg-bg-page text-text-muted">
                <tr>
                  <th className={schemeTableHeadCell}>序号</th>
                  <th className={schemeTableHeadCell}>物流商</th>
                  <th className={schemeTableHeadCell}>服务类型</th>
                  <th className={schemeTableHeadCell}>关联报价</th>
                  <th className={schemeTableHeadCell}>备注</th>
                  <th className={schemeTableHeadCell}>操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {providers.map((row, index) => (
                  <tr key={row.id}>
                    <td className={schemeTableCell}>{index + 1}</td>
                    <td className={schemeTableCell}>
                      <Select
                        value={row.partner}
                        placeholder="请选择物流商"
                        options={getAvailableProviderOptions(row.id)}
                        onValueChange={(value) =>
                          updateProvider(row.id, (provider) => ({ ...provider, partner: value, serviceTypes: [] }))
                        }
                      />
                    </td>
                    <td className={schemeTableCell}>
                      <OptionMultiSelect
                        value={row.serviceTypes}
                        disabled={!row.partner}
                        placeholder="请选择服务类型"
                        clearAriaLabel="清空服务类型"
                        options={getProviderServiceTypes(row.partner)}
                        onChange={(value) => updateProvider(row.id, (provider) => ({ ...provider, serviceTypes: value }))}
                      />
                    </td>
                    <td className={schemeTableCell}>
                      <Select
                        value={row.relatedQuoteName}
                        placeholder={row.partner ? "请选择关联报价" : "请先选择物流商"}
                        options={getQuoteOptionsByProviderAndScope(row.partner, routeLine, "分段运输")}
                        onValueChange={(value) => updateProvider(row.id, (provider) => ({ ...provider, relatedQuoteName: value }))}
                      />
                    </td>
                    <td className={schemeTableCell}>
                      <Input
                        value={row.remark}
                        placeholder="请输入备注"
                        maxLength={500}
                        onChange={(event) => updateProvider(row.id, (provider) => ({ ...provider, remark: event.target.value }))}
                      />
                    </td>
                    <td className={schemeTableCell}>
                      <button
                        type="button"
                        className="border-0 bg-transparent p-0 text-primary hover:underline disabled:text-text-placeholder disabled:no-underline"
                        disabled={providers.length <= 1}
                        onClick={() => removeProvider(row.id)}
                      >
                        移除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
      </ExclusiveFilterGroup>

      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap justify-center gap-3 border-t border-border bg-white px-4 py-3 shadow-lg sm:px-6">
        <Button variant="secondary" size="sm" onClick={onBack}>取消</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>{mode === "create" ? "确定" : "保存"}</Button>
      </div>
    </div>
  );
}

function LogisticsChannelDetail({
  record,
  onBack,
  onEdit,
}: {
  record: LogisticsChannelRecord;
  onBack: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-title font-semibold">{record.providerChannelName}</span>
            <Badge tone={statusTone(record.status)}>{record.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onBack}>关闭</Button>
            <Button variant="primary" size="sm" onClick={onEdit}>编辑</Button>
          </div>
        </div>
        <div className="mt-4">
          <SectionTitle>基本信息</SectionTitle>
          <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <InfoItem label="物流渠道" value={record.providerChannelName} />
            <InfoItem label="渠道ID" value={record.channelId} />
            <InfoItem
              label="头程物流商模式"
              value={getProviderModeLabel(record.firstLegProviderMode)}
            />
            {record.firstLegProviderMode === "single" ? (
              <InfoItem label="物流商" value={record.providers[0]?.partner ?? ""} />
            ) : null}
            <InfoItem label="目的地" value={record.routeLine} />
            <InfoItem label="运输方式" value={record.transportMode} />
            <InfoItem label="物流周期" value={`${record.agingDays}天`} />
            {record.firstLegProviderMode === "single" ? (
              <InfoItem label="关联报价" value={record.providers[0]?.relatedQuoteName ?? ""} />
            ) : null}
            <InfoItem label="状态" value={record.status} />
            <InfoItem label="积材参数" value={record.volumeFactor} />
            <InfoItem label="备注" value={record.remark} />
          </div>
        </div>
      </Card>

      {record.firstLegProviderMode === "multi" ? (
        <Card>
          <SectionTitle>联运物流商</SectionTitle>
          <div className="mt-4 -mx-px overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-small">
              <colgroup>
                <col className="w-14" />
                <col className="w-[26%]" />
                <col className="w-[22%]" />
                <col className="w-[26%]" />
                <col className="w-[26%]" />
              </colgroup>
              <thead className="bg-bg-page text-text-muted">
                <tr>
                  <th className={schemeTableHeadCell}>序号</th>
                  <th className={schemeTableHeadCell}>物流商</th>
                  <th className={schemeTableHeadCell}>服务类型</th>
                  <th className={schemeTableHeadCell}>关联报价</th>
                  <th className={schemeTableHeadCell}>备注</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {record.providers.map((provider, index) => (
                  <tr key={provider.id}>
                    <td className={schemeTableCell}>{index + 1}</td>
                    <td className={cn(schemeTableCell, "break-words")}>{provider.partner || "-"}</td>
                    <td className={cn(schemeTableCell, "break-words")}>
                      {provider.serviceTypes.length ? provider.serviceTypes.join("、") : "-"}
                    </td>
                    <td className={cn(schemeTableCell, "break-words")}>{provider.relatedQuoteName || "-"}</td>
                    <td className={cn(schemeTableCell, "break-words")}>{provider.remark || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

    </div>
  );
}

type LogisticsChannelWorkspaceTab =
  | "logistics-channel"
  | "logistics-channel-create"
  | "logistics-channel-edit"
  | "logistics-channel-detail";

export function LogisticsChannelPage({
  resetKey = 0,
  activeWorkspaceTab = "logistics-channel",
  onOpenWorkspaceTab,
}: {
  resetKey?: number;
  activeWorkspaceTab?: string;
  onOpenWorkspaceTab?: (tab: LogisticsChannelWorkspaceTab) => void;
}) {
  const [view, setView] = useState<"list" | "create" | "edit" | "detail">("list");
  const [activeRecordId, setActiveRecordId] = useState(logisticsChannelRecords[0]?.id ?? "");
  const [channelName, setChannelName] = useState("all");
  const [channelId, setChannelId] = useState("all");
  const [providerModeFilter, setProviderModeFilter] = useState("all");
  const [transportMode, setTransportMode] = useState("all");
  const [routeLine, setRouteLine] = useState("all");
  const [timeType, setTimeType] = useState("created");
  const [timeRange, setTimeRange] = useState<DateRangeValue>(emptyRange());
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const channelNameOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => record.providerChannelName), "全部物流渠道"),
    [],
  );
  const channelIdOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => record.channelId), "全部渠道ID"),
    [],
  );
  const routeLineOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => record.routeLine), "全部目的地"),
    [],
  );
  const filteredRecords = useMemo(() => {
    return logisticsChannelRecords.filter((record) => {
      const matchesChannelName = channelName === "all" || record.providerChannelName === channelName;
      const matchesChannelId = channelId === "all" || record.channelId === channelId;
      const matchesProviderMode = providerModeFilter === "all" || record.firstLegProviderMode === providerModeFilter;
      const matchesTransport = transportMode === "all" || record.transportMode === transportMode;
      const matchesRouteLine = routeLine === "all" || record.routeLine === routeLine;
      const timeValue = timeType === "updated" ? record.updatedAt : record.createdAt;
      const matchesTime = inDateRange(timeValue, timeRange);
      const matchesStatus = status === "all" || record.status === status;

      return (
        matchesChannelName &&
        matchesChannelId &&
        matchesProviderMode &&
        matchesTransport &&
        matchesRouteLine &&
        matchesTime &&
        matchesStatus
      );
    });
  }, [channelId, channelName, providerModeFilter, routeLine, status, timeRange, timeType, transportMode]);

  const totalPages = Math.max(Math.ceil(filteredRecords.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeRecord = logisticsChannelRecords.find((record) => record.id === activeRecordId) ?? logisticsChannelRecords[0];

  useEffect(() => {
    setView("list");
  }, [resetKey]);

  useEffect(() => {
    if (activeWorkspaceTab === "logistics-channel") {
      setView("list");
    }
    if (activeWorkspaceTab === "logistics-channel-create") {
      setView("create");
    }
    if (activeWorkspaceTab === "logistics-channel-edit") {
      setView("edit");
    }
    if (activeWorkspaceTab === "logistics-channel-detail") {
      setView("detail");
    }
  }, [activeWorkspaceTab]);

  function resetFilters() {
    setChannelName("all");
    setChannelId("all");
    setProviderModeFilter("all");
    setTransportMode("all");
    setRouteLine("all");
    setTimeType("created");
    setTimeRange(emptyRange());
    setStatus("all");
    setPage(1);
  }

  function openDetail(record: LogisticsChannelRecord) {
    setActiveRecordId(record.id);
    setView("detail");
    onOpenWorkspaceTab?.("logistics-channel-detail");
  }

  function openEdit(record: LogisticsChannelRecord) {
    setActiveRecordId(record.id);
    setView("edit");
    onOpenWorkspaceTab?.("logistics-channel-edit");
  }

  if (view === "create") {
    return (
      <LogisticsChannelForm
        mode="create"
        onBack={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-channel");
        }}
        onSubmit={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-channel");
        }}
      />
    );
  }

  if (view === "edit" && activeRecord) {
    return (
      <LogisticsChannelForm
        mode="edit"
        record={activeRecord}
        onBack={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-channel");
        }}
        onSubmit={() => {
          setView("detail");
          onOpenWorkspaceTab?.("logistics-channel-detail");
        }}
      />
    );
  }

  if (view === "detail" && activeRecord) {
    return (
      <LogisticsChannelDetail
        record={activeRecord}
        onBack={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-channel");
        }}
        onEdit={() => {
          setView("edit");
          onOpenWorkspaceTab?.("logistics-channel-edit");
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <ExclusiveFilterGroup>
        <div className="flex flex-wrap items-center gap-3">
          <Select className="w-[180px]" options={channelNameOptions} value={channelName} onValueChange={(value) => {
            setChannelName(value);
            setPage(1);
          }} />
          <Select className="w-[180px]" options={channelIdOptions} value={channelId} onValueChange={(value) => {
            setChannelId(value);
            setPage(1);
          }} />
          <Select className="w-[180px]" options={firstLegProviderModeFilterOptions} value={providerModeFilter} onValueChange={(value) => {
            setProviderModeFilter(value);
            setPage(1);
          }} />
          <Select className="w-[160px]" options={transportModeOptions} value={transportMode} onValueChange={(value) => {
            setTransportMode(value);
            setPage(1);
          }} />
          <Select className="w-[220px]" options={routeLineOptions} value={routeLine} onValueChange={(value) => {
            setRouteLine(value);
            setPage(1);
          }} />
          <Select
            className="w-[128px]"
            value={timeType}
            onValueChange={setTimeType}
            options={[
              { label: "创建时间", value: "created" },
              { label: "更新时间", value: "updated" },
            ]}
          />
          <DateRangePicker value={timeRange} onChange={(value) => {
            setTimeRange(value);
            setPage(1);
          }} />
          <Select className="w-[160px]" options={statusOptions} value={status} onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }} />
          <Button variant="primary" size="sm">查询</Button>
          <Button variant="secondary" size="sm" onClick={resetFilters}>重置</Button>
        </div>
        </ExclusiveFilterGroup>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setView("create");
                onOpenWorkspaceTab?.("logistics-channel-create");
              }}
            >
              添加物流渠道
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm">导出</Button>
            <Button variant="secondary" size="sm">列设置</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1360px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>物流渠道</th>
                <th className={tableHeadCell}>渠道ID</th>
                <th className={tableHeadCell}>头程物流商模式</th>
                <th className={tableHeadCell}>运输方式</th>
                <th className={tableHeadCell}>目的地</th>
                <th className={tableHeadCell}>物流周期</th>
                <th className={tableHeadCell}>状态</th>
                <th className={tableHeadCell}>创建人/创建时间</th>
                <th className={tableHeadCell}>更新人/更新时间</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap px-3 py-3">{record.providerChannelName}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.channelId}</td>
                  <td className="whitespace-nowrap px-3 py-3">{getProviderModeLabel(record.firstLegProviderMode)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.transportMode}</td>
                  <td className="max-w-[260px] truncate px-3 py-3" title={record.routeLine}>{record.routeLine}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.agingDays}天</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.status}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.createdBy}</div>
                    <div className="text-text-muted">{record.createdAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.updatedBy}</div>
                    <div className="text-text-muted">{record.updatedAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button type="button" className="mr-2 border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openDetail(record)}>
                      详情
                    </button>
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openEdit(record)}>
                      编辑
                    </button>
                  </td>
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
    </div>
  );
}
