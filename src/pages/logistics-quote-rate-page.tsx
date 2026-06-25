import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DateRangePicker, type DateRangeValue } from "../components/ui/date-range-picker";
import { ExclusiveFilterGroup } from "../components/ui/exclusive-filter-group";
import { Input } from "../components/ui/input";
import { MultiSelectFilter } from "../components/ui/multi-select-filter";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { cn } from "../lib/cn";
import {
  feeCurrencyOptions,
  feeCurrencySelectClassName,
  feeCurrencySelectMenuMinWidth,
} from "../data/logistics-transport-schemes";

type ShippingMode = "整柜" | "散货";
type ServiceScope = "全程运输" | "分段运输";
type ServiceTypeQuoteConfig = {
  serviceType: string;
  feeItems: string[];
};

type QuoteRateRecord = {
  id: string;
  quoteId: string;
  quoteName: string;
  shippingMode: ShippingMode;
  logisticsProvider: string;
  logisticsChannel: string;
  serviceScope: ServiceScope;
  origin: string;
  destination: string;
  currency: string;
  taxIncluded: "是" | "否";
  validFrom: string;
  validTo: string;
  creator: string;
  createdAt: string;
  updater: string;
  updatedAt: string;
  carrier: string;
  pricingMode: string;
  totalPrice: string;
};

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";
const logisticsProviderOptions = ["义乌市双捷国际货运代理有限公司", "浙江融盛国际物流有限公司", "深圳市以达物流有限公司", "宁波赛蓝供应链服务有限公司"];
const serviceScopeOptions = [
  { label: "全程运输", value: "全程运输" },
  { label: "分段运输", value: "分段运输" },
];
const serviceScopeFilterOptions = serviceScopeOptions;

const originWarehouseOptions = [
  "亚马逊二部仓",
  "亚马逊一部仓",
  "独立站仓",
  "eBay仓",
  "亚马逊-独立站-eBay-样品仓",
  "Tiktok仓",
  "TEMU仓",
  "沃尔玛仓",
  "虚拟仓-SU01184-工厂直发",
  "虚拟仓-SU01043-委外加工",
  "虚拟仓-SU01178-工厂直发",
  "虚拟仓-SU01105-亚马逊一部仓工厂直发",
  "虚拟仓-SU01068-独立站工厂直发",
  "虚拟仓-SU01033-独立站工厂直发",
  "虚拟仓-SU00395-委外加工",
  "虚拟仓-SU00002-委外加工",
  "虚拟仓-SU01089-独立站海外工厂直发",
  "虚拟仓-SU01161-亚马逊一部仓委外加工",
  "虚拟仓-SU01105-亚马逊一部工厂直发",
  "虚拟仓-工厂直发-eBay仓",
  "虚拟仓-工厂直发-亚马逊二部仓",
  "虚拟仓-工厂直发-亚马逊一部仓",
  "虚拟仓-工厂直发-独立站仓",
  "虚拟仓-工厂直发-Tiktok仓",
  "虚拟仓-工厂直发-TEMU仓",
  "虚拟仓-工厂直发-沃尔玛仓",
  "速卖通仓",
  "虚拟仓-中基云仓",
];
const destinationWarehouseOptions = [
  "谷仓 美东仓库",
  "谷仓 美西仓库",
  "谷仓 美南仓库",
  "谷仓[2]-G14667 美东仓库",
  "谷仓[2]-G14667 美南仓库",
  "谷仓[2]-G14667 美西仓库",
  "谷仓[3]-G15337 美东仓库",
  "谷仓[3]-G15337 美南仓库",
  "谷仓[3]-G15337 美西仓库",
  "谷仓[4]-G16059 加州区",
  "谷仓-G9492 德国区",
  "谷仓-G9492 英国区",
  "谷仓-G9492 达拉斯区",
  "谷仓[3]-G15337 达拉斯区",
  "良仓 美西01",
  "良仓 美南06",
  "良仓 新泽西6号仓",
  "良仓 美西10",
];
const originWarehouseFilterOptions = originWarehouseOptions.map((warehouse) => ({
  label: warehouse,
  value: warehouse,
}));
const destinationWarehouseFilterOptions = destinationWarehouseOptions.map((warehouse) => ({
  label: warehouse,
  value: warehouse,
}));
const timeTypeFilterOptions = [
  { label: "创建时间", value: "created" },
  { label: "更新时间", value: "updated" },
];

const providerCurrencyMap: Record<string, string> = {
  "义乌市双捷国际货运代理有限公司": "CNY",
  "浙江融盛国际物流有限公司": "USD",
  "深圳市以达物流有限公司": "USD",
  "宁波赛蓝供应链服务有限公司": "CAD",
};

const fullContainerFeeItems = [
  "海运费",
  "订舱费",
  "拖车费",
  "报关费",
  "关税",
  "清关费",
  "派送费",
  "附加费",
];

const fullTransportFeeItemsByShippingMode: Record<ShippingMode, string[]> = {
  整柜: fullContainerFeeItems,
  散货: ["全程运输费", "入仓操作费", "报关费", "清关费", "派送费"],
};

const segmentedServiceTypeQuoteConfigs: ServiceTypeQuoteConfig[] = [
  {
    serviceType: "国内揽收",
    feeItems: ["提货费", "入仓操作费", "装卸费"],
  },
  {
    serviceType: "干线运输",
    feeItems: ["干线运输费", "订舱费", "港杂费"],
  },
  {
    serviceType: "清关服务",
    feeItems: ["清关费", "税金", "查验服务费"],
  },
  {
    serviceType: "尾程派送",
    feeItems: ["派送费", "住宅附加费", "偏远地区附加费"],
  },
];

function getQuoteFeeItems(serviceScope: ServiceScope, shippingMode: ShippingMode) {
  return serviceScope === "全程运输" ? fullTransportFeeItemsByShippingMode[shippingMode] : [];
}

function getServiceTypeQuoteConfigs(serviceScope: ServiceScope, shippingMode: ShippingMode): ServiceTypeQuoteConfig[] {
  if (serviceScope === "全程运输") {
    return [{ serviceType: "全程运输", feeItems: getQuoteFeeItems(serviceScope, shippingMode) }];
  }
  return segmentedServiceTypeQuoteConfigs;
}

function getServiceTypeFeeItems(config: ServiceTypeQuoteConfig, shippingMode: ShippingMode) {
  return shippingMode === "整柜" ? fullContainerFeeItems : config.feeItems;
}

function getProviderCurrency(provider: string) {
  return providerCurrencyMap[provider] ?? "CNY";
}

const quoteRateRecords: QuoteRateRecord[] = [
  {
    id: "qr-001",
    quoteId: "BJ202606080001",
    quoteName: "美南标快-义乌双捷分段运输报价",
    shippingMode: "整柜",
    logisticsProvider: "义乌市双捷国际货运代理有限公司、浙江融盛国际物流有限公司",
    logisticsChannel: "美南标快",
    serviceScope: "分段运输",
    origin: "亚马逊二部仓",
    destination: "谷仓 美西仓库",
    currency: "USD",
    taxIncluded: "是",
    validFrom: "2026-06-01",
    validTo: "2026-08-31",
    creator: "兰轩",
    createdAt: "2026-06-08 09:12:33",
    updater: "兰轩",
    updatedAt: "2026-06-08 10:28:11",
    carrier: "美森快船",
    pricingMode: "整柜报价",
    totalPrice: "1980.00",
  },
  {
    id: "qr-002",
    quoteId: "BJ202606080002",
    quoteName: "欧洲快线-浙江融盛全程散货报价",
    shippingMode: "散货",
    logisticsProvider: "浙江融盛国际物流有限公司",
    logisticsChannel: "欧洲快线",
    serviceScope: "全程运输",
    origin: "独立站仓",
    destination: "谷仓-G9492 德国区",
    currency: "EUR",
    taxIncluded: "否",
    validFrom: "2026-06-10",
    validTo: "2026-09-10",
    creator: "周婷婷",
    createdAt: "2026-06-07 16:28:10",
    updater: "超级管理员",
    updatedAt: "2026-06-08 10:32:41",
    carrier: "达飞轮船",
    pricingMode: "按重量段报价",
    totalPrice: "3.80/KG",
  },
  {
    id: "qr-003",
    quoteId: "BJ202606070018",
    quoteName: "加拿大卡派-宁波赛蓝整柜报价",
    shippingMode: "整柜",
    logisticsProvider: "宁波赛蓝供应链服务有限公司",
    logisticsChannel: "加拿大卡派",
    serviceScope: "全程运输",
    origin: "Tiktok仓",
    destination: "良仓 美西01",
    currency: "CAD",
    taxIncluded: "是",
    validFrom: "2026-06-15",
    validTo: "2026-10-15",
    creator: "李莎丽",
    createdAt: "2026-06-07 11:20:08",
    updater: "李莎丽",
    updatedAt: "2026-06-08 09:54:01",
    carrier: "以星快船",
    pricingMode: "整柜报价",
    totalPrice: "2680.00",
  },
];

function emptyRange(): DateRangeValue {
  return { start: "", end: "" };
}

function optionList(values: string[]) {
  return values.map((value) => ({ label: value, value }));
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values)).map((value) => ({ label: value, value }));
}

function getPrimaryLogisticsProvider(providerText: string) {
  return providerText.split("、")[0] ?? "";
}

function getPrimaryWarehouse(warehouseText: string) {
  return warehouseText.split("、").map((item) => item.trim()).filter(Boolean)[0] ?? "";
}

function matchesWarehouseFilter(recordValue: string, selected: string[]) {
  if (selected.length === 0) {
    return true;
  }
  return selected.includes(getPrimaryWarehouse(recordValue));
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

function SectionTitle({ children }: { children: string }) {
  return <div className="border-l-4 border-primary pl-3 font-medium text-text-primary">{children}</div>;
}

function FormRow({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
      <div className="w-full shrink-0 text-left text-small text-text-secondary sm:w-[112px] sm:text-right">
        {required ? <span className="mr-1 text-danger">*</span> : null}
        {label}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const feeFieldGridClass = "grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 lg:grid-cols-4";
const inlineFieldLabelClass = "w-[80px] shrink-0 text-right text-mini leading-none text-text-secondary";
const inlineFieldGapClass = "gap-1.5";

function DiscountTypeRadios({
  value,
  onChange,
}: {
  value: "折扣" | "减免";
  onChange: (value: "折扣" | "减免") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex cursor-pointer items-center gap-1 text-mini text-text-primary">
        <input
          type="radio"
          className="h-3 w-3 shrink-0"
          checked={value === "折扣"}
          onChange={() => onChange("折扣")}
        />
        折扣
      </label>
      <label className="flex cursor-pointer items-center gap-1 text-mini text-text-primary">
        <input
          type="radio"
          className="h-3 w-3 shrink-0"
          checked={value === "减免"}
          onChange={() => onChange("减免")}
        />
        减免
      </label>
    </div>
  );
}

function FeeSummaryToolbar({
  discountType,
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  exchangeRate,
  onExchangeRateChange,
  insuranceRate,
  onInsuranceRateChange,
  currency,
  onCurrencyChange,
  total,
  errors,
  showErrors,
}: {
  discountType: "折扣" | "减免";
  onDiscountTypeChange: (value: "折扣" | "减免") => void;
  discountValue: number;
  onDiscountValueChange: (value: number) => void;
  exchangeRate: number;
  onExchangeRateChange: (value: number) => void;
  insuranceRate: number;
  onInsuranceRateChange: (value: number) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  total: number;
  errors?: FeeSummaryErrors;
  showErrors?: boolean;
}) {
  const discountLabel = discountType === "折扣" ? "折扣率(%)" : "减免金额";
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-3 gap-y-2 lg:flex-nowrap lg:justify-end">
      <SummaryField label="优惠方式" required error={showErrors ? errors?.discountType : undefined}>
        <DiscountTypeRadios
          value={discountType}
          onChange={(value) => {
            onDiscountTypeChange(value);
            onDiscountValueChange(0);
          }}
        />
      </SummaryField>
      <SummaryField label={discountLabel} required error={showErrors ? errors?.discountValue : undefined}>
        <AmountInput
          compact
          value={discountValue}
          placeholder={discountType === "折扣" ? "1-100" : "0.00"}
          onChange={(value) => onDiscountValueChange(discountType === "折扣" ? Math.min(value, 100) : value)}
        />
      </SummaryField>
      <SummaryField label="汇率" required error={showErrors ? errors?.exchangeRate : undefined}>
        <AmountInput compact value={exchangeRate} placeholder="0.00" onChange={onExchangeRateChange} />
      </SummaryField>
      <SummaryField label="保险费率(%)">
        <AmountInput compact value={insuranceRate} placeholder="0.00" onChange={onInsuranceRateChange} />
      </SummaryField>
      <SummaryField label="币种" required error={showErrors ? errors?.currency : undefined}>
        <Select
          className={feeCurrencySelectClassName}
          menuMinWidth={feeCurrencySelectMenuMinWidth}
          menuDensity="compact"
          value={currency}
          options={optionList(feeCurrencyOptions)}
          clearable={false}
          onValueChange={onCurrencyChange}
        />
      </SummaryField>
      <SummaryField label="总价格">
        <span className="inline-flex h-7 min-w-[88px] items-center rounded-sm bg-bg-page px-2 text-mini font-medium tabular-nums text-text-primary">
          {formatAmount(total)}
        </span>
      </SummaryField>
    </div>
  );
}

function SummaryField({
  label,
  children,
  showColon = false,
  required = false,
  error,
}: {
  label: string;
  children: ReactNode;
  showColon?: boolean;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className={cn("flex min-w-0 items-center", inlineFieldGapClass)}>
        <span className={inlineFieldLabelClass}>
          {required ? <span className="mr-0.5 text-danger">*</span> : null}
          {label}
          {showColon ? "：" : ""}
        </span>
        <div className="min-w-0 shrink-0">{children}</div>
      </div>
      {error ? <span className="pl-[86px] text-mini leading-none text-danger">{error}</span> : null}
    </div>
  );
}

function FeeSectionHeader({ title, summary }: { title: string; summary: ReactNode }) {
  return (
    <div className="mb-3 border-b border-border pb-3">
      <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        <div className="shrink-0">
          <SectionTitle>{title}</SectionTitle>
        </div>
        <div className="min-w-0 flex-1">{summary}</div>
      </div>
    </div>
  );
}

function ServiceTypeQuoteTitle({ serviceType }: { serviceType: string }) {
  return (
    <div className="mb-4 border-b border-border pb-3">
      <span className="border-l-4 border-primary pl-3 text-body font-semibold text-text-primary">
        {serviceType}
      </span>
    </div>
  );
}

function FeeField({
  label,
  children,
  showColon = false,
  required = false,
  error,
}: {
  label: string;
  children: ReactNode;
  showColon?: boolean;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className={cn("flex min-w-0 items-center text-small", inlineFieldGapClass)}>
        <span className={inlineFieldLabelClass}>
          {required ? <span className="mr-0.5 text-danger">*</span> : null}
          {label}
          {showColon ? "：" : ""}
        </span>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {error ? <span className="pl-[86px] text-mini leading-none text-danger">{error}</span> : null}
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

function FeeDetailField({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-x-3 text-small">
      <div className="text-right text-text-secondary">{label}：</div>
      <div className={cn("min-w-0 tabular-nums text-text-primary", valueClassName)}>{value || "-"}</div>
    </div>
  );
}

function FeeDetailSummary({
  totalPrice,
  currency,
  shippingMode,
}: {
  totalPrice: string;
  currency: string;
  shippingMode?: ShippingMode;
}) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <FeeDetailField label="优惠方式" value="折扣" />
      <FeeDetailField label="折扣率(%)" value="0%" />
      <FeeDetailField label="汇率" value="7.12" />
      {shippingMode === "整柜" ? <FeeDetailField label="保险费率(%)" value="0.00" /> : null}
      <FeeDetailField label="币种" value={currency} />
      <FeeDetailField label="总价格" value={totalPrice} valueClassName="font-medium" />
    </div>
  );
}

function formatAmount(value: number) {
  return value.toFixed(2);
}

function sumValues(values: Record<string, number>) {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function applyDiscount(subtotal: number, discountType: "折扣" | "减免", discountValue: number) {
  if (discountType === "折扣") {
    return subtotal * Math.max(Math.min(discountValue, 100), 0) / 100;
  }
  return Math.max(subtotal - discountValue, 0);
}

type FeeSummaryErrors = Partial<Record<"currency" | "discountType" | "discountValue" | "exchangeRate", string>>;

function validateFeeSummaryFields(input: {
  currency: string;
  discountType: "折扣" | "减免";
  discountValue: number;
  exchangeRate: number;
}): FeeSummaryErrors {
  const errors: FeeSummaryErrors = {};
  if (!input.currency) {
    errors.currency = "请选择币种";
  }
  if (!input.discountType) {
    errors.discountType = "请选择优惠方式";
  }
  if (input.discountType === "折扣") {
    if (input.discountValue < 1 || input.discountValue > 100) {
      errors.discountValue = "折扣率需为1-100";
    }
  } else if (input.discountValue <= 0) {
    errors.discountValue = "减免金额必须大于0";
  }
  if (input.exchangeRate <= 0) {
    errors.exchangeRate = "汇率必须大于0";
  } else if (input.exchangeRate > 999.99) {
    errors.exchangeRate = "汇率不能超过999.99";
  }
  return errors;
}

export type FeeSectionHandle = {
  validate: () => boolean;
};

function AmountInput({
  value,
  onChange,
  placeholder = "0.00",
  disabled = false,
  compact = false,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  function update(nextValue: number) {
    onChange(Math.max(nextValue, 0));
  }

  return (
    <div className={cn("flex w-full min-w-0 max-w-full", className)}>
      <button
        type="button"
        className={cn(
          "shrink-0 border border-border bg-bg-page text-text-secondary",
          compact ? "h-7 w-7 text-mini" : "h-input-md w-9",
        )}
        disabled={disabled}
        onClick={() => update(value - 1)}
      >
        -
      </button>
      <Input
        className={cn(
          "min-w-0 flex-1 rounded-none px-2 text-left",
          compact ? "h-7 text-mini" : "min-w-[88px] px-3",
        )}
        placeholder={placeholder}
        value={formatAmount(value)}
        disabled={disabled}
        onChange={(event) => update(Number.parseFloat(event.target.value) || 0)}
      />
      <button
        type="button"
        className={cn(
          "shrink-0 border border-l-0 border-border bg-bg-page text-text-secondary",
          compact ? "h-7 w-7 text-mini" : "h-input-md w-9",
        )}
        disabled={disabled}
        onClick={() => update(value + 1)}
      >
        +
      </button>
    </div>
  );
}

function QuoteRateForm({
  mode,
  record,
  isCopy = false,
  onBack,
  onSubmit,
}: {
  mode: "create-fcl" | "edit-fcl" | "create-lcl" | "edit-lcl";
  record?: QuoteRateRecord;
  isCopy?: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const shippingMode: ShippingMode = mode.includes("fcl") ? "整柜" : "散货";
  const initialPricingMode =
    record?.pricingMode === "按重量区间报价" ? "按重量段报价" : record?.pricingMode;
  const [quoteName, setQuoteName] = useState(isCopy ? "" : (record?.quoteName ?? ""));
  const [logisticsProvider, setLogisticsProvider] = useState(record?.logisticsProvider?.split("、")[0] ?? "");
  const [serviceScope, setServiceScope] = useState<ServiceScope>(record?.serviceScope ?? "全程运输");
  const [origin, setOrigin] = useState(() => getPrimaryWarehouse(record?.origin ?? ""));
  const [destination, setDestination] = useState(() => getPrimaryWarehouse(record?.destination ?? ""));
  const [shippingCompany, setShippingCompany] = useState(record?.carrier ?? "");
  const [taxIncluded, setTaxIncluded] = useState(record?.taxIncluded ?? "是");
  const [validRange, setValidRange] = useState<DateRangeValue>({ start: record?.validFrom ?? "", end: record?.validTo ?? "" });
  const [pricingMode, setPricingMode] = useState(initialPricingMode ?? (shippingMode === "整柜" ? "整柜报价" : "按重量段报价"));
  const serviceTypeQuoteConfigs = useMemo(
    () => getServiceTypeQuoteConfigs(serviceScope, shippingMode),
    [serviceScope, shippingMode],
  );
  const providerCurrency = getProviderCurrency(logisticsProvider);
  const feeSectionRefs = useRef<Array<FeeSectionHandle | null>>([]);

  function handleSubmit() {
    if (logisticsProvider) {
      const feeSectionsValid = serviceTypeQuoteConfigs.every(
        (_, index) => feeSectionRefs.current[index]?.validate() ?? false,
      );
      if (!feeSectionsValid) {
        return;
      }
    }
    onSubmit();
  }

  return (
    <div className="min-w-0 space-y-4 pb-16">
      <ExclusiveFilterGroup>
      <Card>
        <SectionTitle>基本信息</SectionTitle>
        <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <FormRow label="报价名称" required>
            <Input
              value={quoteName}
              placeholder="请输入报价名称"
              maxLength={200}
              onChange={(event) => setQuoteName(event.target.value)}
            />
          </FormRow>
          {record && !isCopy ? (
            <FormRow label="报价ID">
              <Input value={record.quoteId} readOnly />
            </FormRow>
          ) : null}
          <FormRow label="物流商" required>
            <Select
              value={logisticsProvider}
              placeholder="请选择物流商"
              options={optionList(logisticsProviderOptions)}
              clearable={false}
              onValueChange={setLogisticsProvider}
            />
          </FormRow>
          <FormRow label="服务范围" required>
            <Select
              value={serviceScope}
              options={serviceScopeOptions}
              clearable={false}
              onValueChange={(value) => setServiceScope(value as ServiceScope)}
            />
          </FormRow>
          <FormRow label="发货仓" required>
            <Select value={origin} placeholder="请选择发货仓" options={originWarehouseFilterOptions} onValueChange={setOrigin} />
          </FormRow>
          <FormRow label="目的仓" required>
            <Select value={destination} placeholder="请选择目的仓" options={destinationWarehouseFilterOptions} onValueChange={setDestination} />
          </FormRow>
          <FormRow label="船司" required>
            <Input value={shippingCompany} placeholder="请输入船司" maxLength={255} onChange={(event) => setShippingCompany(event.target.value)} />
          </FormRow>
          {shippingMode === "散货" ? (
            <FormRow label="计价方式" required>
              <div className="flex gap-4 text-small">
                <label>
                  <input
                    type="radio"
                    className="mr-1"
                    checked={pricingMode === "按重量段报价"}
                    onChange={() => setPricingMode("按重量段报价")}
                  />
                  按重量段报价
                </label>
                <label>
                  <input
                    type="radio"
                    className="mr-1"
                    checked={pricingMode === "按方数报价"}
                    onChange={() => setPricingMode("按方数报价")}
                  />
                  按方数报价
                </label>
              </div>
            </FormRow>
          ) : null}
          <FormRow label="是否含税" required>
            <div className="flex gap-4 text-small">
              <label>
                <input type="radio" className="mr-1" checked={taxIncluded === "是"} onChange={() => setTaxIncluded("是")} />
                是
              </label>
              <label>
                <input type="radio" className="mr-1" checked={taxIncluded === "否"} onChange={() => setTaxIncluded("否")} />
                否
              </label>
            </div>
          </FormRow>
          <FormRow label="价格有效期" required>
            <DateRangePicker value={validRange} onChange={setValidRange} />
          </FormRow>
        </div>
      </Card>

      <Card className="min-h-[280px]">
        <SectionTitle>{serviceScope === "全程运输" ? "全程运输报价" : "服务类型报价"}</SectionTitle>
        {!logisticsProvider ? (
          <div className="mt-3 rounded-sm border border-warning bg-warning/10 px-3 py-2 text-small text-warning">
            请先选择物流商，系统会根据服务范围和服务类型展示对应费用项。
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {serviceTypeQuoteConfigs.map((config, index) => (
              <div
                key={config.serviceType}
                className="min-w-0 overflow-hidden rounded-sm border border-border p-3 sm:p-4"
              >
                <ServiceTypeQuoteTitle serviceType={config.serviceType} />
                {shippingMode === "整柜" ? (
                  <FullContainerFeeSection
                    ref={(instance) => {
                      feeSectionRefs.current[index] = instance;
                    }}
                    scope={`${serviceScope}-${config.serviceType}`}
                    provider={logisticsProvider}
                    feeItems={getServiceTypeFeeItems(config, shippingMode)}
                    defaultCurrency={providerCurrency}
                  />
                ) : (
                  <LooseCargoFeeSection
                    ref={(instance) => {
                      feeSectionRefs.current[index] = instance;
                    }}
                    scope={`${serviceScope}-${config.serviceType}`}
                    provider={logisticsProvider}
                    pricingMode={pricingMode}
                    defaultCurrency={providerCurrency}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
      </ExclusiveFilterGroup>

      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap justify-center gap-3 border-t border-border bg-white px-4 py-3 shadow-lg sm:px-6">
        <Button variant="secondary" size="sm" onClick={onBack}>取消</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>确定</Button>
      </div>
    </div>
  );
}

function getFeeLabels(feeItems: string[]) {
  return Array.from(new Set(feeItems));
}

type FullContainerFeeSectionProps = {
  scope: string;
  provider: string;
  feeItems: string[];
  defaultCurrency: string;
};

const FullContainerFeeSection = forwardRef<FeeSectionHandle, FullContainerFeeSectionProps>(function FullContainerFeeSection(
  { scope, provider, feeItems, defaultCurrency },
  ref,
) {
  const [feeLabels, setFeeLabels] = useState(getFeeLabels(feeItems));
  const [fees, setFees] = useState<Record<string, number>>(
    Object.fromEntries(feeLabels.map((label) => [label, 0])),
  );
  const [currency, setCurrency] = useState(defaultCurrency);
  const [discountType, setDiscountType] = useState<"折扣" | "减免">("折扣");
  const [discountValue, setDiscountValue] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [insuranceRate, setInsuranceRate] = useState(0);
  const [errors, setErrors] = useState<FeeSummaryErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const subtotal = sumValues(fees);
  const total = applyDiscount(subtotal, discountType, discountValue);

  useEffect(() => {
    const nextLabels = getFeeLabels(feeItems);
    setFeeLabels(nextLabels);
    setFees((current) => Object.fromEntries(nextLabels.map((label) => [label, current[label] ?? 0])));
    setCurrency(defaultCurrency);
  }, [defaultCurrency, feeItems, provider, scope]);

  useImperativeHandle(ref, () => ({
    validate() {
      const nextErrors = validateFeeSummaryFields({ currency, discountType, discountValue, exchangeRate });
      setErrors(nextErrors);
      setShowErrors(true);
      return Object.keys(nextErrors).length === 0;
    },
  }));

  function updateCurrency(value: string) {
    setCurrency(value);
    if (showErrors) {
      setErrors((current) => ({ ...current, currency: undefined }));
    }
  }

  function updateDiscountType(value: "折扣" | "减免") {
    setDiscountType(value);
    setDiscountValue(0);
    if (showErrors) {
      setErrors((current) => ({ ...current, discountType: undefined, discountValue: undefined }));
    }
  }

  function updateDiscountValue(value: number) {
    setDiscountValue(value);
    if (showErrors) {
      setErrors((current) => ({ ...current, discountValue: undefined }));
    }
  }

  function updateExchangeRate(value: number) {
    setExchangeRate(value);
    if (showErrors) {
      setErrors((current) => ({ ...current, exchangeRate: undefined }));
    }
  }

  return (
    <div>
      <FeeSectionHeader
        title="费用明细"
        summary={
          <FeeSummaryToolbar
            discountType={discountType}
            onDiscountTypeChange={updateDiscountType}
            discountValue={discountValue}
            onDiscountValueChange={updateDiscountValue}
            exchangeRate={exchangeRate}
            onExchangeRateChange={updateExchangeRate}
            insuranceRate={insuranceRate}
            onInsuranceRateChange={setInsuranceRate}
            currency={currency}
            onCurrencyChange={updateCurrency}
            total={total}
            errors={errors}
            showErrors={showErrors}
          />
        }
      />
      <div className={feeFieldGridClass}>
        {feeLabels.map((label) => (
          <FeeField key={label} label={label}>
            <AmountInput
              value={fees[label] ?? 0}
              onChange={(value) => setFees((current) => ({ ...current, [label]: value }))}
            />
          </FeeField>
        ))}
      </div>
    </div>
  );
});

type LooseCargoFeeSectionProps = {
  scope: string;
  provider: string;
  pricingMode: string;
  defaultCurrency: string;
};

const LooseCargoFeeSection = forwardRef<FeeSectionHandle, LooseCargoFeeSectionProps>(function LooseCargoFeeSection(
  { scope, provider, pricingMode, defaultCurrency },
  ref,
) {
  const [rows, setRows] = useState([{ id: "r1", price: 0 }]);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [discountType, setDiscountType] = useState<"折扣" | "减免">("折扣");
  const [discountValue, setDiscountValue] = useState(0);
  const [surcharge, setSurcharge] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [insuranceRate, setInsuranceRate] = useState(0);
  const [errors, setErrors] = useState<FeeSummaryErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const isVolumePricing = pricingMode === "按方数报价";
  const rangeLabel = isVolumePricing ? "方数范围" : "重量范围";
  const rangeUnit = isVolumePricing ? "m³" : "KG";
  const priceUnit = isVolumePricing ? "/m³" : "/KG";
  const discountLabel = discountType === "折扣" ? "折扣(%)" : "减免";

  useEffect(() => {
    setCurrency(defaultCurrency);
  }, [defaultCurrency, provider, scope]);

  useImperativeHandle(ref, () => ({
    validate() {
      const nextErrors = validateFeeSummaryFields({ currency, discountType, discountValue, exchangeRate });
      setErrors(nextErrors);
      setShowErrors(true);
      return Object.keys(nextErrors).length === 0;
    },
  }));

  function updateCurrency(value: string) {
    setCurrency(value);
    if (showErrors) {
      setErrors((current) => ({ ...current, currency: undefined }));
    }
  }

  function updateDiscountType(value: "折扣" | "减免") {
    setDiscountType(value);
    setDiscountValue(0);
    if (showErrors) {
      setErrors((current) => ({ ...current, discountType: undefined, discountValue: undefined }));
    }
  }

  function updateDiscountValue(value: number) {
    setDiscountValue(value);
    if (showErrors) {
      setErrors((current) => ({ ...current, discountValue: undefined }));
    }
  }

  function updateExchangeRate(value: number) {
    setExchangeRate(value);
    if (showErrors) {
      setErrors((current) => ({ ...current, exchangeRate: undefined }));
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-3">
          <SectionTitle>{isVolumePricing ? "按方数报价" : "按重量段报价"}</SectionTitle>
        </div>
        <div className="overflow-x-auto rounded-sm border border-border">
          <table className="w-full min-w-[900px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>{rangeLabel}</th>
                <th className={tableHeadCell}>价格</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Input className="w-[120px]" defaultValue="0.00" />
                      <span>{rangeUnit} ~</span>
                      <Input className="w-[120px]" />
                      <span>{rangeUnit}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-[160px]"
                        value={formatAmount(row.price)}
                        onChange={(event) =>
                          setRows((current) =>
                            current.map((item) =>
                              item.id === row.id ? { ...item, price: Number.parseFloat(event.target.value) || 0 } : item,
                            ),
                          )
                        }
                      />
                      <span>{priceUnit}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <button type="button" className="mr-3 border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => setRows((current) => [...current, { id: `r${current.length + 1}`, price: 0 }])}>
                      增加一行
                    </button>
                    <button
                      type="button"
                      className="border-0 bg-transparent p-0 text-danger hover:underline disabled:text-text-placeholder disabled:no-underline"
                      disabled={rows.length === 1}
                      onClick={() => setRows((current) => (current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index)))}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div className="mb-3 border-b border-border pb-3">
          <SectionTitle>费用明细</SectionTitle>
        </div>
        <div className={feeFieldGridClass}>
          <FeeField label="币种" required error={showErrors ? errors.currency : undefined}>
            <Select
              className={feeCurrencySelectClassName}
              menuMinWidth={feeCurrencySelectMenuMinWidth}
              menuDensity="compact"
              value={currency}
              options={optionList(feeCurrencyOptions)}
              clearable={false}
              onValueChange={updateCurrency}
            />
          </FeeField>
          <FeeField label="优惠方式" required error={showErrors ? errors.discountType : undefined}>
            <DiscountTypeRadios value={discountType} onChange={updateDiscountType} />
          </FeeField>
          <FeeField label={discountLabel} required error={showErrors ? errors.discountValue : undefined}>
            <AmountInput
              value={discountValue}
              placeholder={discountType === "折扣" ? "1-100" : "0.00"}
              onChange={(value) => updateDiscountValue(discountType === "折扣" ? Math.min(value, 100) : value)}
            />
          </FeeField>
          <FeeField label="附加费">
            <AmountInput value={surcharge} placeholder="0.00" onChange={setSurcharge} />
          </FeeField>
          <FeeField label="汇率" required error={showErrors ? errors.exchangeRate : undefined}>
            <AmountInput value={exchangeRate} placeholder="0.00" onChange={updateExchangeRate} />
          </FeeField>
          <FeeField label="保险费率(%)">
            <AmountInput value={insuranceRate} placeholder="0.00" onChange={setInsuranceRate} />
          </FeeField>
        </div>
      </div>
    </div>
  );
});

function QuoteRateDetail({
  record,
  onBack,
  onEdit,
}: {
  record: QuoteRateRecord;
  onBack: () => void;
  onEdit: () => void;
}) {
  const provider = record.logisticsProvider.split("、")[0] ?? record.logisticsProvider;
  const serviceTypeQuoteConfigs = getServiceTypeQuoteConfigs(record.serviceScope, record.shippingMode);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-title font-semibold">{record.quoteId}</span>
            <Badge tone={record.shippingMode === "整柜" ? "processing" : "success"}>{record.shippingMode}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onBack}>关闭</Button>
            <Button variant="primary" size="sm" onClick={onEdit}>编辑</Button>
          </div>
        </div>
        <div className="mt-4">
          <SectionTitle>基本信息</SectionTitle>
          <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <InfoItem label="报价名称" value={record.quoteName} />
            <InfoItem label="报价ID" value={record.quoteId} />
            <InfoItem label="发货方式" value={record.shippingMode} />
            <InfoItem label="物流商" value={provider} />
            <InfoItem label="服务范围" value={record.serviceScope} />
            <InfoItem label="发货仓" value={getPrimaryWarehouse(record.origin)} />
            <InfoItem label="目的仓" value={getPrimaryWarehouse(record.destination)} />
            <InfoItem label="船司" value={record.carrier} />
            <InfoItem label="是否含税" value={record.taxIncluded} />
            <InfoItem label="价格有效期" value={`${record.validFrom} ~ ${record.validTo}`} />
            <InfoItem label="计价方式" value={record.pricingMode} />
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle>{record.serviceScope === "全程运输" ? "全程运输报价" : "服务类型报价"}</SectionTitle>
        <div className="mt-4 space-y-4">
          {serviceTypeQuoteConfigs.map((config) => (
            <div
              key={config.serviceType}
              className="min-w-0 overflow-hidden rounded-sm border border-border p-3 sm:p-4"
            >
              <ServiceTypeQuoteTitle serviceType={config.serviceType} />
              <div className="mb-3 border-b border-border pb-3">
                <SectionTitle>费用明细</SectionTitle>
              </div>
              <FeeDetailSummary
                totalPrice={record.totalPrice}
                currency={record.currency}
                shippingMode={record.shippingMode}
              />
              <div className={feeFieldGridClass}>
                {getServiceTypeFeeItems(config, record.shippingMode).map((label, feeIndex) => (
                  <FeeDetailField
                    key={label}
                    label={label}
                    value={feeIndex === 0 ? record.totalPrice : "0.00"}
                  />
                ))}
              </div>
            </div>
          ))}
          </div>
      </Card>
    </div>
  );
}

type LogisticsQuoteRateWorkspaceTab =
  | "logistics-quote-rate"
  | "logistics-quote-rate-create-fcl"
  | "logistics-quote-rate-edit-fcl"
  | "logistics-quote-rate-create-lcl"
  | "logistics-quote-rate-edit-lcl"
  | "logistics-quote-rate-detail";

type QuoteRateView = "list" | "create-fcl" | "edit-fcl" | "create-lcl" | "edit-lcl" | "detail";

function resolveQuoteRateView(tab: string): QuoteRateView {
  switch (tab) {
    case "logistics-quote-rate-create-fcl":
      return "create-fcl";
    case "logistics-quote-rate-edit-fcl":
      return "edit-fcl";
    case "logistics-quote-rate-create-lcl":
      return "create-lcl";
    case "logistics-quote-rate-edit-lcl":
      return "edit-lcl";
    case "logistics-quote-rate-detail":
      return "detail";
    default:
      return "list";
  }
}

export function LogisticsQuoteRatePage({
  resetKey = 0,
  activeWorkspaceTab = "logistics-quote-rate",
  onOpenWorkspaceTab,
}: {
  resetKey?: number;
  activeWorkspaceTab?: string;
  onOpenWorkspaceTab?: (tab: LogisticsQuoteRateWorkspaceTab) => void;
}) {
  const view = resolveQuoteRateView(activeWorkspaceTab);
  const [activeRecordId, setActiveRecordId] = useState(quoteRateRecords[0]?.id ?? "");
  const [copySourceRecord, setCopySourceRecord] = useState<QuoteRateRecord | undefined>();
  const [quoteNameFilter, setQuoteNameFilter] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [logisticsChannels, setLogisticsChannels] = useState<string[]>([]);
  const [serviceScopeFilter, setServiceScopeFilter] = useState("");
  const [originFilters, setOriginFilters] = useState<string[]>([]);
  const [destinationFilters, setDestinationFilters] = useState<string[]>([]);
  const [timeType, setTimeType] = useState("created");
  const [timeRange, setTimeRange] = useState<DateRangeValue>(emptyRange());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const providerFilterOptions = useMemo(
    () => uniqueOptions(quoteRateRecords.map((record) => getPrimaryLogisticsProvider(record.logisticsProvider))),
    [],
  );
  const logisticsChannelFilterOptions = useMemo(
    () => uniqueOptions(quoteRateRecords.map((record) => record.logisticsChannel)),
    [],
  );

  const filteredRecords = useMemo(() => {
    return quoteRateRecords.filter((record) => {
      const recordProvider = getPrimaryLogisticsProvider(record.logisticsProvider);
      const matchesQuoteName = !quoteNameFilter.trim() || record.quoteName.includes(quoteNameFilter.trim());
      const matchesQuoteId = !quoteId.trim() || record.quoteId === quoteId.trim();
      const matchesProvider = providers.length === 0 || providers.includes(recordProvider);
      const matchesLogisticsChannel = logisticsChannels.length === 0 || logisticsChannels.includes(record.logisticsChannel);
      const matchesServiceScope = !serviceScopeFilter || record.serviceScope === serviceScopeFilter;
      const matchesOrigin = matchesWarehouseFilter(record.origin, originFilters);
      const matchesDestination = matchesWarehouseFilter(record.destination, destinationFilters);
      const timeValue = timeType === "updated" ? record.updatedAt : record.createdAt;
      const matchesTime = inDateRange(timeValue, timeRange);
      return matchesQuoteName && matchesQuoteId && matchesProvider && matchesLogisticsChannel && matchesServiceScope && matchesOrigin && matchesDestination && matchesTime;
    });
  }, [destinationFilters, logisticsChannels, originFilters, providers, quoteId, quoteNameFilter, serviceScopeFilter, timeRange, timeType]);

  const totalPages = Math.max(Math.ceil(filteredRecords.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageIds = pagedRecords.map((record) => record.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const activeRecord = quoteRateRecords.find((record) => record.id === activeRecordId) ?? quoteRateRecords[0];

  useEffect(() => {
    if (resetKey === 0) {
      return;
    }
    resetFilters();
    onOpenWorkspaceTab?.("logistics-quote-rate");
  }, [resetKey]);

  function resetFilters() {
    setQuoteNameFilter("");
    setQuoteId("");
    setProviders([]);
    setLogisticsChannels([]);
    setServiceScopeFilter("");
    setOriginFilters([]);
    setDestinationFilters([]);
    setTimeType("created");
    setTimeRange(emptyRange());
    setPage(1);
  }

  function toggleAll() {
    setSelectedIds((current) => (allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds]))));
  }

  function toggleRow(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function openEdit(record: QuoteRateRecord) {
    setCopySourceRecord(undefined);
    setActiveRecordId(record.id);
    onOpenWorkspaceTab?.(record.shippingMode === "整柜" ? "logistics-quote-rate-edit-fcl" : "logistics-quote-rate-edit-lcl");
  }

  function openDetail(record: QuoteRateRecord) {
    setCopySourceRecord(undefined);
    setActiveRecordId(record.id);
    onOpenWorkspaceTab?.("logistics-quote-rate-detail");
  }

  function openCopy(record: QuoteRateRecord) {
    setActiveRecordId(record.id);
    setCopySourceRecord(record);
    onOpenWorkspaceTab?.(record.shippingMode === "整柜" ? "logistics-quote-rate-create-fcl" : "logistics-quote-rate-create-lcl");
  }

  if (view === "create-fcl" || view === "create-lcl" || view === "edit-fcl" || view === "edit-lcl") {
    const isEdit = view === "edit-fcl" || view === "edit-lcl";
    const isCopy = !isEdit && copySourceRecord?.shippingMode === (view === "create-fcl" ? "整柜" : "散货");
    const formRecord = isEdit ? activeRecord : (isCopy ? copySourceRecord : undefined);
    return (
      <QuoteRateForm
        key={`${activeWorkspaceTab}-${isCopy ? copySourceRecord?.id : "blank"}`}
        mode={view}
        record={formRecord}
        isCopy={isCopy}
        onBack={() => {
          setCopySourceRecord(undefined);
          onOpenWorkspaceTab?.("logistics-quote-rate");
        }}
        onSubmit={() => {
          setCopySourceRecord(undefined);
          onOpenWorkspaceTab?.("logistics-quote-rate");
        }}
      />
    );
  }

  if (view === "detail" && activeRecord) {
    return (
      <QuoteRateDetail
        record={activeRecord}
        onBack={() => onOpenWorkspaceTab?.("logistics-quote-rate")}
        onEdit={() => openEdit(activeRecord)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <ExclusiveFilterGroup>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            className="w-[200px]"
            placeholder="请输入报价名称"
            value={quoteNameFilter}
            onChange={(event) => {
              setQuoteNameFilter(event.target.value);
              setPage(1);
            }}
          />
          <Input className="w-[180px]" placeholder="报价ID" value={quoteId} onChange={(event) => {
            setQuoteId(event.target.value);
            setPage(1);
          }} />
          <MultiSelectFilter
            placeholder="物流商"
            options={providerFilterOptions}
            value={providers}
            onChange={(value) => {
              setProviders(value);
              setPage(1);
            }}
          />
          <MultiSelectFilter
            placeholder="物流渠道"
            options={logisticsChannelFilterOptions}
            value={logisticsChannels}
            onChange={(value) => {
              setLogisticsChannels(value);
              setPage(1);
            }}
          />
          <Select className="w-[150px]" placeholder="服务范围" options={serviceScopeFilterOptions} value={serviceScopeFilter} onValueChange={(value) => {
            setServiceScopeFilter(value);
            setPage(1);
          }} />
          <MultiSelectFilter
            placeholder="发货仓"
            options={originWarehouseFilterOptions}
            value={originFilters}
            onChange={(value) => {
              setOriginFilters(value);
              setPage(1);
            }}
          />
          <MultiSelectFilter
            placeholder="目的仓"
            options={destinationWarehouseFilterOptions}
            value={destinationFilters}
            onChange={(value) => {
              setDestinationFilters(value);
              setPage(1);
            }}
          />
          <Select
            className="w-[128px]"
            value={timeType}
            clearable={false}
            onValueChange={(value) => {
              setTimeType(value);
              setPage(1);
            }}
            options={timeTypeFilterOptions}
          />
          <DateRangePicker value={timeRange} onChange={(value) => {
            setTimeRange(value);
            setPage(1);
          }} />
          <div className="flex shrink-0 items-center gap-3">
            <Button variant="primary" size="sm">查询</Button>
            <Button variant="secondary" size="sm" onClick={resetFilters}>重置</Button>
          </div>
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
                setCopySourceRecord(undefined);
                onOpenWorkspaceTab?.("logistics-quote-rate-create-fcl");
              }}
            >
              添加整柜报价
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setCopySourceRecord(undefined);
                onOpenWorkspaceTab?.("logistics-quote-rate-create-lcl");
              }}
            >
              添加散货报价
            </Button>
          </div>
          <Button variant="secondary" size="sm">导出</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1720px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={`w-10 ${tableHeadCell}`}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className={tableHeadCell}>报价名称</th>
                <th className={tableHeadCell}>报价ID</th>
                <th className={tableHeadCell}>发货方式</th>
                <th className={tableHeadCell}>物流商</th>
                <th className={tableHeadCell}>服务范围</th>
                <th className={tableHeadCell}>发货仓</th>
                <th className={tableHeadCell}>目的仓</th>
                <th className={tableHeadCell}>是否含税</th>
                <th className={tableHeadCell}>价格有效期</th>
                <th className={tableHeadCell}>创建人/创建时间</th>
                <th className={tableHeadCell}>更新人/更新时间</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selectedIds.includes(record.id)} onChange={() => toggleRow(record.id)} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-primary">{record.quoteName}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.quoteId}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <Badge tone={record.shippingMode === "整柜" ? "processing" : "success"}>{record.shippingMode}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{getPrimaryLogisticsProvider(record.logisticsProvider)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.serviceScope}</td>
                  <td className="whitespace-nowrap px-3 py-3">{getPrimaryWarehouse(record.origin)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{getPrimaryWarehouse(record.destination)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.taxIncluded}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.validFrom} ~ {record.validTo}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.creator}</div>
                    <div className="text-text-muted">{record.createdAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.updater}</div>
                    <div className="text-text-muted">{record.updatedAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button type="button" className="mr-3 border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openDetail(record)}>
                      详情
                    </button>
                    <button type="button" className="mr-3 border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openEdit(record)}>
                      编辑
                    </button>
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openCopy(record)}>
                      复制
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
