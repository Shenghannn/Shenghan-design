import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ExclusiveFilterGroup } from "../components/ui/exclusive-filter-group";
import { Input } from "../components/ui/input";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/cn";

type LogisticsChannelStatus = "启用" | "禁用";

type SchemeProviderRow = {
  id: string;
  partner: string;
  serviceLinks: string[];
  feeItems: string[];
  remark: string;
};

type TransportScheme = {
  id: string;
  schemeName: string;
  providers: SchemeProviderRow[];
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
  transportSchemes: TransportScheme[];
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
    serviceLinks: [],
    feeItems: [],
    remark: "",
  };
}

function createTransportScheme(index: number, id?: string): TransportScheme {
  return {
    id: id ?? `scheme-${Date.now()}-${index}`,
    schemeName: `方案${index}`,
    providers: [createProviderRow(`${id ?? "scheme"}-provider-1`)],
  };
}

function cloneTransportSchemes(schemes: TransportScheme[]): TransportScheme[] {
  return schemes.map((scheme) => ({
    ...scheme,
    providers: scheme.providers.map((provider) => ({
      ...provider,
      serviceLinks: [...provider.serviceLinks],
      feeItems: [...provider.feeItems],
    })),
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

const providerOptions = [
  { label: "义乌市双捷国际货运代理有限公司", value: "义乌市双捷国际货运代理有限公司" },
  { label: "浙江融盛国际物流有限公司", value: "浙江融盛国际物流有限公司" },
  { label: "深圳市以达物流有限公司(谷仓海外仓)", value: "深圳市以达物流有限公司(谷仓海外仓)" },
  { label: "宁波赛蓝供应链服务有限公司", value: "宁波赛蓝供应链服务有限公司" },
];

const providerFeeItemOptions: Record<string, string[]> = {
  "义乌市双捷国际货运代理有限公司": ["提货费", "报关费", "海运费", "订舱费", "港杂费", "单证操作费"],
  "浙江融盛国际物流有限公司": ["清关费", "税金", "派送费", "附加费"],
  "深圳市以达物流有限公司(谷仓海外仓)": ["派送费", "附加费", "仓储操作费", "尾程处理费"],
  "宁波赛蓝供应链服务有限公司": ["海运费", "订舱费", "港杂费", "清关费"],
};

function normalizeProviderName(value: string) {
  if (providerFeeItemOptions[value]) {
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

const serviceLinkOptions = ["国内揽收", "干线运输", "清关", "尾程派送"];

function parseFeeItemsFromSegment(segment?: string) {
  return segment?.split("、").map((item) => item.split("-")[0]).filter(Boolean) ?? [];
}

function buildSchemesFromLegacy(
  partners: string[],
  feeSegments: string[],
  schemeCount = 1,
): TransportScheme[] {
  const normalizedPartners = partners.map((partner) => normalizeProviderName(partner));
  if (schemeCount <= 1) {
    return [
      {
        id: "scheme-1",
        schemeName: "方案1",
        providers: normalizedPartners.map((partner, index) => ({
          id: `scheme-1-provider-${index + 1}`,
          partner,
          serviceLinks: serviceLinkOptions[index]
            ? [serviceLinkOptions[index]]
            : [serviceLinkOptions[serviceLinkOptions.length - 1]],
          feeItems: parseFeeItemsFromSegment(feeSegments[index]),
          remark: "",
        })),
      },
    ];
  }

  return [
    {
      id: "scheme-1",
      schemeName: "方案1",
      providers: normalizedPartners.slice(0, 2).map((partner, index) => ({
        id: `scheme-1-provider-${index + 1}`,
        partner,
        serviceLinks: serviceLinkOptions[index] ? [serviceLinkOptions[index]] : [],
        feeItems: parseFeeItemsFromSegment(feeSegments[index]),
        remark: "",
      })),
    },
    {
      id: "scheme-2",
      schemeName: "方案2",
      providers: [normalizedPartners[1], normalizedPartners[2] ?? normalizedPartners[0]]
        .filter(Boolean)
        .map((partner, index) => ({
          id: `scheme-2-provider-${index + 1}`,
          partner,
          serviceLinks: serviceLinkOptions[index + 1] ? [serviceLinkOptions[index + 1]] : [],
          feeItems: parseFeeItemsFromSegment(feeSegments[index + 1]),
          remark: "",
        })),
    },
  ];
}

function getProviderFeeItems(partner: string) {
  const normalized = normalizeProviderName(partner);
  return providerFeeItemOptions[normalized] ?? ["操作费", "运输费", "附加费"];
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
    transportSchemes: buildSchemesFromLegacy(
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
    transportSchemes: buildSchemesFromLegacy(
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
    transportSchemes: buildSchemesFromLegacy(
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
    remark: "多段联运渠道，含两套运输方案",
    transportSchemes: buildSchemesFromLegacy(
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
    transportSchemes: buildSchemesFromLegacy(
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
    transportSchemes: buildSchemesFromLegacy(
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
    transportSchemes: buildSchemesFromLegacy(
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
    transportSchemes: buildSchemesFromLegacy(
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
  const [open, setOpen] = useState(false);
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

  return (
    <div className="group relative">
      <button
        type="button"
        className="field-control flex w-full items-center justify-between gap-2 pr-10 text-left"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value ? "min-w-0 flex-1 truncate text-text-primary" : "min-w-0 flex-1 truncate text-text-placeholder"}>
          {value || "请选择区域路线"}
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
  const [open, setOpen] = useState(false);
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
            setOpen((current) => !current);
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
  const [transportSchemes, setTransportSchemes] = useState<TransportScheme[]>(() =>
    record?.transportSchemes?.length
      ? cloneTransportSchemes(record.transportSchemes)
      : [createTransportScheme(1)],
  );
  const [invalidSchemeIds, setInvalidSchemeIds] = useState<Set<string>>(() => new Set());

  function updateSchemes(updater: (current: TransportScheme[]) => TransportScheme[]) {
    setTransportSchemes((current) => {
      const next = updater(current);
      return next.length > 0 ? next : current;
    });
  }

  function addScheme() {
    updateSchemes((current) => [...current, createTransportScheme(current.length + 1)]);
  }

  function removeScheme(schemeId: string) {
    updateSchemes((current) => (current.length <= 1 ? current : current.filter((scheme) => scheme.id !== schemeId)));
  }

  function addProvider(schemeId: string) {
    updateSchemes((current) =>
      current.map((scheme) =>
        scheme.id === schemeId
          ? { ...scheme, providers: [...scheme.providers, createProviderRow()] }
          : scheme,
      ),
    );
  }

  function removeProvider(schemeId: string, providerId: string) {
    updateSchemes((current) =>
      current.map((scheme) => {
        if (scheme.id !== schemeId || scheme.providers.length <= 1) {
          return scheme;
        }
        return { ...scheme, providers: scheme.providers.filter((provider) => provider.id !== providerId) };
      }),
    );
  }

  function updateSchemeName(schemeId: string, schemeName: string) {
    updateSchemes((current) =>
      current.map((scheme) => (scheme.id === schemeId ? { ...scheme, schemeName } : scheme)),
    );
    if (schemeName.trim()) {
      setInvalidSchemeIds((current) => {
        if (!current.has(schemeId)) {
          return current;
        }
        const next = new Set(current);
        next.delete(schemeId);
        return next;
      });
    }
  }

  function handleSubmit() {
    const emptySchemes = transportSchemes.filter((scheme) => !scheme.schemeName.trim());
    if (emptySchemes.length > 0) {
      setInvalidSchemeIds(new Set(emptySchemes.map((scheme) => scheme.id)));
      window.alert("请填写方案名称");
      return;
    }
    setInvalidSchemeIds(new Set());
    onSubmit();
  }

  return (
    <div className="space-y-4 pb-16">
      <Card>
        <SectionTitle>基本信息</SectionTitle>
        <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <FormRow label="物流渠道" required>
            <Input value={channelName} placeholder="请输入物流渠道" maxLength={50} onChange={(event) => setChannelName(event.target.value)} />
          </FormRow>
          <FormRow label="物流周期" required>
            <div className="flex">
              <Input defaultValue={record?.agingDays ? String(record.agingDays) : ""} placeholder="请输入物流周期" />
              <span className="inline-flex h-input-md items-center border border-l-0 border-border bg-bg-page px-3 text-text-secondary">天</span>
            </div>
          </FormRow>
          <FormRow label="运输方式" required>
            <Select value={transportMode} placeholder="请选择运输方式" options={transportModeOptions.filter((item) => item.value !== "all")} onValueChange={setTransportMode} />
          </FormRow>
          <FormRow label="区域路线" required>
            <RouteSelector value={routeLine} onChange={setRouteLine} />
          </FormRow>
          <FormRow label="状态" required>
            <Select value={status} options={channelStatusOptions} onValueChange={(value) => setStatus(value as LogisticsChannelStatus)} />
          </FormRow>
          <FormRow label="材积参数" required>
            <Input defaultValue={record?.volumeFactor} placeholder="请输入材积参数" />
          </FormRow>
          <FormRow label="备注" className="xl:col-span-2 items-start">
            <Textarea className="min-h-[72px]" maxLength={1000} value={remark} placeholder="请输入备注" onChange={(event) => setRemark(event.target.value)} />
          </FormRow>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionTitle>运输方案</SectionTitle>
          <Button variant="primary" size="sm" className="self-start sm:self-auto" onClick={addScheme}>
            添加方案
          </Button>
        </div>
        <div className="mt-4 space-y-6">
          {transportSchemes.map((scheme) => (
            <div key={scheme.id} className="rounded-lg border border-border">
              <div className="flex flex-col gap-3 border-b border-border bg-bg-page px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <span className="shrink-0 text-small text-text-secondary sm:w-[72px] sm:text-right">
                    <span className="mr-1 text-danger">*</span>
                    方案名称
                  </span>
                  <div className="min-w-0 flex-1 sm:max-w-[280px]">
                    <Input
                      className={cn(
                        invalidSchemeIds.has(scheme.id) && "border-danger focus:border-danger focus:ring-danger-subtle",
                      )}
                      value={scheme.schemeName}
                      placeholder="请输入方案名称"
                      maxLength={50}
                      onChange={(event) => updateSchemeName(scheme.id, event.target.value)}
                    />
                    {invalidSchemeIds.has(scheme.id) ? (
                      <div className="mt-1 text-mini text-danger">请填写方案名称</div>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <Button variant="secondary" size="sm" onClick={() => addProvider(scheme.id)}>
                    添加物流商
                  </Button>
                  <button
                    type="button"
                    className="border-0 bg-transparent p-0 text-small text-primary hover:underline disabled:text-text-placeholder disabled:no-underline"
                    disabled={transportSchemes.length <= 1}
                    onClick={() => removeScheme(scheme.id)}
                  >
                    移除方案
                  </button>
                </div>
              </div>
              <div className="-mx-px overflow-x-auto">
                <table className="w-full min-w-[920px] table-fixed border-collapse text-left text-small">
                  <colgroup>
                    <col className="w-14" />
                    <col className="w-[22%]" />
                    <col className="w-[18%]" />
                    <col className="w-[22%]" />
                    <col className="w-[24%]" />
                    <col className="w-16" />
                  </colgroup>
                  <thead className="bg-bg-page text-text-muted">
                    <tr>
                      <th className={schemeTableHeadCell}>序号</th>
                      <th className={schemeTableHeadCell}>物流商</th>
                      <th className={schemeTableHeadCell}>服务环节</th>
                      <th className={schemeTableHeadCell}>费用项</th>
                      <th className={schemeTableHeadCell}>备注</th>
                      <th className={schemeTableHeadCell}>操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {scheme.providers.map((row, index) => (
                      <tr key={row.id}>
                        <td className={schemeTableCell}>{index + 1}</td>
                        <td className={schemeTableCell}>
                          <Select
                            value={row.partner}
                            placeholder="请选择物流商"
                            options={providerOptions}
                            onValueChange={(value) =>
                              updateSchemes((current) =>
                                current.map((item) =>
                                  item.id === scheme.id
                                    ? {
                                        ...item,
                                        providers: item.providers.map((provider) =>
                                          provider.id === row.id
                                            ? { ...provider, partner: value, feeItems: [] }
                                            : provider,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className={schemeTableCell}>
                          <OptionMultiSelect
                            value={row.serviceLinks}
                            placeholder="请选择服务环节"
                            clearAriaLabel="清空服务环节"
                            options={serviceLinkOptions}
                            onChange={(value) =>
                              updateSchemes((current) =>
                                current.map((item) =>
                                  item.id === scheme.id
                                    ? {
                                        ...item,
                                        providers: item.providers.map((provider) =>
                                          provider.id === row.id ? { ...provider, serviceLinks: value } : provider,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className={schemeTableCell}>
                          <OptionMultiSelect
                            value={row.feeItems}
                            disabled={!row.partner}
                            placeholder="请选择费用项"
                            clearAriaLabel="清空费用项"
                            options={getProviderFeeItems(row.partner)}
                            onChange={(value) =>
                              updateSchemes((current) =>
                                current.map((item) =>
                                  item.id === scheme.id
                                    ? {
                                        ...item,
                                        providers: item.providers.map((provider) =>
                                          provider.id === row.id ? { ...provider, feeItems: value } : provider,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className={schemeTableCell}>
                          <Input
                            value={row.remark}
                            placeholder="请输入备注"
                            onChange={(event) =>
                              updateSchemes((current) =>
                                current.map((item) =>
                                  item.id === scheme.id
                                    ? {
                                        ...item,
                                        providers: item.providers.map((provider) =>
                                          provider.id === row.id ? { ...provider, remark: event.target.value } : provider,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className={schemeTableCell}>
                          <button
                            type="button"
                            className="border-0 bg-transparent p-0 text-primary hover:underline disabled:text-text-placeholder disabled:no-underline"
                            disabled={scheme.providers.length <= 1}
                            onClick={() => removeProvider(scheme.id, row.id)}
                          >
                            移除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>

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
            <InfoItem label="物流渠道ID" value={record.channelId} />
            <InfoItem label="物流渠道" value={record.providerChannelName} />
            <InfoItem label="运输方式" value={record.transportMode} />
            <InfoItem label="区域路线" value={record.routeLine} />
            <InfoItem label="物流周期" value={`${record.agingDays}天`} />
            <InfoItem label="材积参数" value={record.volumeFactor} />
            <InfoItem label="状态" value={record.status} />
            <InfoItem label="备注" value={record.remark} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>运输方案</SectionTitle>
        <div className="mt-4 space-y-6">
          {record.transportSchemes.map((scheme) => (
            <div key={scheme.id} className="rounded-lg border border-border">
              <div className="border-b border-border bg-bg-page px-3 py-3 font-medium text-text-primary sm:px-4">
                {scheme.schemeName || "-"}
              </div>
              <div className="-mx-px overflow-x-auto">
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
                      <th className={schemeTableHeadCell}>服务环节</th>
                      <th className={schemeTableHeadCell}>费用项</th>
                      <th className={schemeTableHeadCell}>备注</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-white">
                    {scheme.providers.map((provider, index) => (
                      <tr key={provider.id}>
                        <td className={schemeTableCell}>{index + 1}</td>
                        <td className={cn(schemeTableCell, "break-words")}>{provider.partner || "-"}</td>
                        <td className={cn(schemeTableCell, "break-words")}>
                          {provider.serviceLinks.length ? provider.serviceLinks.join("、") : "-"}
                        </td>
                        <td className={cn(schemeTableCell, "break-words")}>
                          {provider.feeItems.length ? provider.feeItems.join("、") : "-"}
                        </td>
                        <td className={cn(schemeTableCell, "break-words")}>{provider.remark || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>

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
  const [transportMode, setTransportMode] = useState("all");
  const [routeLine, setRouteLine] = useState("all");
  const [logisticsCycle, setLogisticsCycle] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const channelNameOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => record.providerChannelName), "全部物流渠道"),
    [],
  );
  const channelIdOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => record.channelId), "全部物流渠道ID"),
    [],
  );
  const routeLineOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => record.routeLine), "全部区域路线"),
    [],
  );
  const logisticsCycleOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => `${record.agingDays}天`), "全部物流周期"),
    [],
  );

  const filteredRecords = useMemo(() => {
    return logisticsChannelRecords.filter((record) => {
      const matchesChannelName = channelName === "all" || record.providerChannelName === channelName;
      const matchesChannelId = channelId === "all" || record.channelId === channelId;
      const matchesTransport = transportMode === "all" || record.transportMode === transportMode;
      const matchesRouteLine = routeLine === "all" || record.routeLine === routeLine;
      const matchesLogisticsCycle = logisticsCycle === "all" || `${record.agingDays}天` === logisticsCycle;
      const matchesStatus = status === "all" || record.status === status;

      return (
        matchesChannelName &&
        matchesChannelId &&
        matchesTransport &&
        matchesRouteLine &&
        matchesLogisticsCycle &&
        matchesStatus
      );
    });
  }, [channelId, channelName, logisticsCycle, routeLine, status, transportMode]);

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
    setTransportMode("all");
    setRouteLine("all");
    setLogisticsCycle("all");
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
          <Select className="w-[160px]" options={statusOptions} value={status} onValueChange={(value) => {
            setStatus(value);
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
          <Select className="w-[180px]" options={logisticsCycleOptions} value={logisticsCycle} onValueChange={(value) => {
            setLogisticsCycle(value);
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
          <table className="w-full min-w-[1280px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>物流渠道</th>
                <th className={tableHeadCell}>物流渠道ID</th>
                <th className={tableHeadCell}>运输方式</th>
                <th className={tableHeadCell}>区域路线</th>
                <th className={tableHeadCell}>物流周期</th>
                <th className={tableHeadCell}>创建人/创建时间</th>
                <th className={tableHeadCell}>更新人/更新时间</th>
                <th className={tableHeadCell}>状态</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap px-3 py-3">{record.providerChannelName}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.channelId}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.transportMode}</td>
                  <td className="max-w-[260px] truncate px-3 py-3" title={record.routeLine}>{record.routeLine}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.agingDays}天</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.createdBy}</div>
                    <div className="text-text-muted">{record.createdAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.updatedBy}</div>
                    <div className="text-text-muted">{record.updatedAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.status}</td>
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
