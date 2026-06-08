import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DateRangePicker, type DateRangeValue } from "../components/ui/date-range-picker";
import { Input } from "../components/ui/input";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";

type ShippingMode = "整柜" | "散货";

type QuoteRateRecord = {
  id: string;
  quoteId: string;
  shippingMode: ShippingMode;
  logisticsProvider: string;
  logisticsChannel: string;
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
const logisticsChannelOptions = ["美南标快", "美西海派", "欧洲快线", "加拿大卡派", "美东快递"];
const currencyOptions = ["USD", "CNY", "EUR", "CAD", "GBP"];
const carrierOptions = ["美森快船", "以星快船", "长荣海运", "达飞轮船"];
const channelQuoteProviderSchemes: Record<string, Array<{ provider: string; serviceLinks: string[] }>> = {
  "美南标快": [
    { provider: "义乌市双捷国际货运代理有限公司", serviceLinks: ["国内揽收", "干线运输"] },
    { provider: "浙江融盛国际物流有限公司", serviceLinks: ["清关", "尾程派送"] },
  ],
  "美西海派": [
    { provider: "义乌市双捷国际货运代理有限公司", serviceLinks: ["国内揽收", "干线运输"] },
    { provider: "深圳市以达物流有限公司", serviceLinks: ["尾程派送"] },
  ],
  "欧洲快线": [
    { provider: "浙江融盛国际物流有限公司", serviceLinks: ["国内揽收", "干线运输", "清关"] },
  ],
  "加拿大卡派": [
    { provider: "宁波赛蓝供应链服务有限公司", serviceLinks: ["干线运输", "清关"] },
    { provider: "深圳市以达物流有限公司", serviceLinks: ["尾程派送"] },
  ],
  "美东快递": [
    { provider: "深圳市以达物流有限公司", serviceLinks: ["国内揽收", "干线运输", "尾程派送"] },
  ],
};
const feeLabelsByServiceLink: Record<string, string[]> = {
  "国内揽收": ["提货费", "报关费"],
  "干线运输": ["海运费", "订舱费", "港杂费", "单证操作费"],
  "清关": ["清关费", "税金"],
  "尾程派送": ["派送费", "附加费"],
};
const addressTree = [
  { country: "中国", provinces: [{ name: "浙江省", cities: ["义乌", "宁波"] }, { name: "广东省", cities: ["深圳", "广州"] }] },
  { country: "美国", provinces: [{ name: "加利福尼亚州", cities: ["洛杉矶", "希尔顿"] }, { name: "纽约州", cities: ["纽约市"] }] },
  { country: "加拿大", provinces: [{ name: "不列颠哥伦比亚省", cities: ["温哥华"] }, { name: "安大略省", cities: ["多伦多"] }] },
  { country: "德国", provinces: [{ name: "北威州", cities: ["科隆"] }, { name: "巴伐利亚州", cities: ["慕尼黑"] }] },
];

const quoteRateRecords: QuoteRateRecord[] = [
  {
    id: "qr-001",
    quoteId: "BJ202606080001",
    shippingMode: "整柜",
    logisticsProvider: "义乌市双捷国际货运代理有限公司、浙江融盛国际物流有限公司",
    logisticsChannel: "美南标快",
    origin: "中国-浙江省-义乌",
    destination: "美国-加利福尼亚州-洛杉矶",
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
    shippingMode: "散货",
    logisticsProvider: "浙江融盛国际物流有限公司",
    logisticsChannel: "欧洲快线",
    origin: "中国-广东省-深圳",
    destination: "德国-北威州-科隆",
    currency: "EUR",
    taxIncluded: "否",
    validFrom: "2026-06-10",
    validTo: "2026-09-10",
    creator: "周婷婷",
    createdAt: "2026-06-07 16:28:10",
    updater: "超级管理员",
    updatedAt: "2026-06-08 10:32:41",
    carrier: "达飞轮船",
    pricingMode: "按重量区间报价",
    totalPrice: "3.80/KG",
  },
  {
    id: "qr-003",
    quoteId: "BJ202606070018",
    shippingMode: "整柜",
    logisticsProvider: "宁波赛蓝供应链服务有限公司",
    logisticsChannel: "加拿大卡派",
    origin: "中国-浙江省-宁波",
    destination: "加拿大-安大略省-多伦多",
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

function MultiSelectFilter({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: Array<{ label: string; value: string }>;
  value: string[];
  onChange: (nextValue: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = value.length === 0 ? placeholder : `${placeholder}(${value.length})`;

  return (
    <div className="relative">
      <button
        type="button"
        className="field-control flex w-[190px] items-center justify-between gap-2 text-left"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value.length ? "truncate text-text-primary" : "truncate text-text-placeholder"}>{label}</span>
        <span className="text-text-muted">⌄</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 max-h-[260px] w-[240px] overflow-auto rounded-sm border border-border bg-white p-2 shadow-md">
          {options.map((option) => {
            const checked = value.includes(option.value);
            return (
              <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-small hover:bg-bg-hover">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onChange(checked ? value.filter((item) => item !== option.value) : [...value, option.value])}
                />
                <span className="truncate">{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function AddressCascade({
  placeholder,
  value,
  onChange,
  className,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [countryName, setCountryName] = useState(addressTree[0].country);
  const country = addressTree.find((item) => item.country === countryName) ?? addressTree[0];
  const [provinceName, setProvinceName] = useState(country.provinces[0].name);
  const province = country.provinces.find((item) => item.name === provinceName) ?? country.provinces[0];

  return (
    <div className={`relative ${className ?? ""}`}>
      <button type="button" className="field-control flex w-full items-center justify-between text-left" onClick={() => setOpen((current) => !current)}>
        <span className={value ? "truncate text-text-primary" : "truncate text-text-placeholder"}>{value || placeholder}</span>
        <span className="text-text-muted">{open ? "⌃" : "⌄"}</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 grid w-[600px] grid-cols-3 rounded-md border border-border bg-white shadow-lg">
          <div className="max-h-[240px] overflow-auto border-r border-border py-2">
            {addressTree.map((item) => (
              <button
                key={item.country}
                type="button"
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-small hover:bg-bg-hover ${item.country === countryName ? "font-medium text-primary" : "text-text-primary"}`}
                onClick={() => {
                  setCountryName(item.country);
                  setProvinceName(item.provinces[0].name);
                }}
              >
                {item.country}<span>›</span>
              </button>
            ))}
          </div>
          <div className="max-h-[240px] overflow-auto border-r border-border py-2">
            {country.provinces.map((item) => (
              <button
                key={item.name}
                type="button"
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-small hover:bg-bg-hover ${item.name === provinceName ? "font-medium text-primary" : "text-text-primary"}`}
                onClick={() => setProvinceName(item.name)}
              >
                {item.name}<span>›</span>
              </button>
            ))}
          </div>
          <div className="max-h-[240px] overflow-auto py-2">
            {province.cities.map((city) => (
              <button
                key={city}
                type="button"
                className="block w-full px-4 py-2 text-left text-small hover:bg-bg-hover"
                onClick={() => {
                  onChange(`${countryName}-${provinceName}-${city}`);
                  setOpen(false);
                }}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <div className="border-l-4 border-primary pl-3 font-medium text-text-primary">{children}</div>;
}

function FormRow({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-[112px] shrink-0 text-right text-small text-text-secondary">
        {required ? <span className="mr-1 text-danger">*</span> : null}
        {label}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 text-small">
      <div className="text-text-secondary">{label}</div>
      <div className="text-text-primary">{value || "-"}</div>
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

function AmountInput({
  value,
  onChange,
  placeholder = "0.00",
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  function update(nextValue: number) {
    onChange(Math.max(nextValue, 0));
  }

  return (
    <div className="flex">
      <button
        type="button"
        className="h-input-md w-8 border border-border bg-bg-page text-text-secondary"
        disabled={disabled}
        onClick={() => update(value - 1)}
      >
        -
      </button>
      <Input
        className="rounded-none text-center"
        placeholder={placeholder}
        value={formatAmount(value)}
        disabled={disabled}
        onChange={(event) => update(Number.parseFloat(event.target.value) || 0)}
      />
      <button
        type="button"
        className="h-input-md w-8 border border-l-0 border-border bg-bg-page text-text-secondary"
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
  onBack,
  onSubmit,
}: {
  mode: "create-fcl" | "edit-fcl" | "create-lcl" | "edit-lcl";
  record?: QuoteRateRecord;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const shippingMode: ShippingMode = mode.includes("fcl") ? "整柜" : "散货";
  const [logisticsChannel, setLogisticsChannel] = useState(record?.logisticsChannel ?? "");
  const [origin, setOrigin] = useState(record?.origin ?? "");
  const [destination, setDestination] = useState(record?.destination ?? "");
  const [carrier, setCarrier] = useState(record?.carrier ?? "");
  const [currency, setCurrency] = useState(record?.currency ?? "");
  const [taxIncluded, setTaxIncluded] = useState(record?.taxIncluded ?? "是");
  const [pricingMode, setPricingMode] = useState(record?.pricingMode ?? (shippingMode === "整柜" ? "整柜报价" : "按重量区间报价"));
  const [providerSchemes, setProviderSchemes] = useState<Array<{ id: string; provider: string; serviceLinks: string[] }>>(() => {
    const schemes = record?.logisticsChannel ? channelQuoteProviderSchemes[record.logisticsChannel] : [];
    if (schemes?.length) {
      return schemes.map((scheme, index) => ({ id: `scheme-${index + 1}`, ...scheme }));
    }
    const providers = record?.logisticsProvider ? record.logisticsProvider.split("、") : [];
    return providers.map((provider, index) => ({ id: `scheme-${index + 1}`, provider, serviceLinks: [] }));
  });

  useEffect(() => {
    const schemes = channelQuoteProviderSchemes[logisticsChannel] ?? [];
    setProviderSchemes(schemes.map((scheme, index) => ({ id: `scheme-${index + 1}`, ...scheme })));
  }, [logisticsChannel]);

  return (
    <div className="space-y-4 pb-16">
      <Card>
        <SectionTitle>基本信息</SectionTitle>
        <div className="mt-4 grid gap-x-10 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <FormRow label="物流渠道" required>
            <Select value={logisticsChannel} placeholder="请选择物流渠道" options={optionList(logisticsChannelOptions)} onValueChange={setLogisticsChannel} />
          </FormRow>
          <FormRow label="发货地" required>
            <AddressCascade value={origin} placeholder="请选择发货地" onChange={setOrigin} />
          </FormRow>
          <FormRow label="目的地" required>
            <AddressCascade value={destination} placeholder="请选择目的地" onChange={setDestination} />
          </FormRow>
          <FormRow label="舱司">
            <Select value={carrier} placeholder="请选择舱司" options={optionList(carrierOptions)} onValueChange={setCarrier} />
          </FormRow>
          <FormRow label="币种" required>
            <Select value={currency} placeholder="请选择币种" options={optionList(currencyOptions)} onValueChange={setCurrency} />
          </FormRow>
          {shippingMode === "散货" ? (
            <FormRow label="计价方式" required>
              <Select value={pricingMode} options={optionList(["按重量区间报价", "按方数报价"])} onValueChange={setPricingMode} />
            </FormRow>
          ) : null}
          <FormRow label="是否含税" required>
            <Select value={taxIncluded} options={optionList(["是", "否"])} onValueChange={(value) => setTaxIncluded(value as "是" | "否")} />
          </FormRow>
          <FormRow label="价格有效期" required>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <Input type="date" defaultValue={record?.validFrom} />
              <span className="text-text-secondary">-</span>
              <Input type="date" defaultValue={record?.validTo} />
            </div>
          </FormRow>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <SectionTitle>物流商报价方案</SectionTitle>
        </div>
        {!logisticsChannel ? (
          <div className="mt-3 rounded-sm border border-warning bg-warning/10 px-3 py-2 text-small text-warning">
            请先选择物流渠道，系统会根据物流渠道自动带出对应物流商报价方案。
          </div>
        ) : null}
        {logisticsChannel && providerSchemes.length === 0 ? (
          <div className="mt-3 rounded-sm border border-warning bg-warning/10 px-3 py-2 text-small text-warning">
            当前物流渠道暂未配置服务商，请先在物流渠道页面维护服务商配置。
          </div>
        ) : null}
        <div className="mt-4 space-y-4">
          {providerSchemes.map((scheme, index) => (
            <div key={scheme.id} className="rounded-sm border border-border p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="font-medium text-text-primary">报价方案 {index + 1}</div>
                <div className="text-small text-text-muted">由物流渠道服务商配置带出</div>
              </div>
              <div className="mb-4 grid gap-x-10 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                <FormRow label="物流商" required>
                  <Input value={scheme.provider} disabled />
                </FormRow>
                <FormRow label="服务环节" required>
                  <Input value={scheme.serviceLinks.join("、") || "-"} disabled />
                </FormRow>
              </div>
              {shippingMode === "整柜" ? (
                <FullContainerFeeSection serviceLinks={scheme.serviceLinks} />
              ) : (
                <LooseCargoFeeSection serviceLinks={scheme.serviceLinks} />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center gap-3 border-t border-border bg-white px-6 py-3 shadow-lg">
        <Button variant="secondary" size="sm" onClick={onBack}>取消</Button>
        <Button variant="primary" size="sm" onClick={onSubmit}>确定</Button>
      </div>
    </div>
  );
}

function getFeeLabels(serviceLinks: string[], fallback: string[]) {
  const labels = serviceLinks.flatMap((link) => feeLabelsByServiceLink[link] ?? []);
  return labels.length ? Array.from(new Set(labels)) : fallback;
}

function FullContainerFeeSection({ serviceLinks }: { serviceLinks: string[] }) {
  const feeLabels = getFeeLabels(serviceLinks, ["港杂费", "订舱费", "报关费", "派送费", "附加费"]);
  const [fees, setFees] = useState<Record<string, number>>(
    Object.fromEntries(feeLabels.map((label) => [label, 0])),
  );
  const [discountType, setDiscountType] = useState<"折扣" | "减免">("折扣");
  const [discountValue, setDiscountValue] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(0);
  const subtotal = sumValues(fees);
  const total = applyDiscount(subtotal, discountType, discountValue);

  return (
    <div>
      <SectionTitle>费用明细</SectionTitle>
      <div className="mt-4 grid gap-x-16 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
        {feeLabels.map((label) => (
          <FormRow key={label} label={label}>
            <AmountInput
              value={fees[label] ?? 0}
              onChange={(value) => setFees((current) => ({ ...current, [label]: value }))}
            />
          </FormRow>
        ))}
        <FormRow label="优惠方式" required>
          <div className="flex gap-4 text-small">
            <label>
              <input
                type="radio"
                className="mr-1"
                checked={discountType === "折扣"}
                onChange={() => {
                  setDiscountType("折扣");
                  setDiscountValue(0);
                }}
              />
              折扣
            </label>
            <label>
              <input
                type="radio"
                className="mr-1"
                checked={discountType === "减免"}
                onChange={() => {
                  setDiscountType("减免");
                  setDiscountValue(0);
                }}
              />
              减免
            </label>
          </div>
        </FormRow>
        <FormRow label={discountType === "折扣" ? "折扣率(%)" : "减免金额"} required>
          <AmountInput
            value={discountValue}
            placeholder={discountType === "折扣" ? "1-100之间" : "0.00"}
            onChange={(value) => setDiscountValue(discountType === "折扣" ? Math.min(value, 100) : value)}
          />
        </FormRow>
        <FormRow label="汇率">
          <AmountInput value={exchangeRate} placeholder="保留两位小数" onChange={setExchangeRate} />
        </FormRow>
        <FormRow label="总价格">
          <Input disabled value={formatAmount(total)} />
        </FormRow>
      </div>
    </div>
  );
}

function LooseCargoFeeSection({ serviceLinks }: { serviceLinks: string[] }) {
  const extraFeeLabels = getFeeLabels(serviceLinks, ["附加费"]).filter((label) => label !== "海运费");
  const [rows, setRows] = useState([{ id: "r1", price: 0 }]);
  const [extraFees, setExtraFees] = useState<Record<string, number>>(
    Object.fromEntries([...extraFeeLabels, "汇率", "燃油费(%)"].map((label) => [label, 0])),
  );
  const [discountType, setDiscountType] = useState<"折扣" | "减免">("折扣");
  const [discountValue, setDiscountValue] = useState(0);
  const feeSubtotal =
    rows.reduce((sum, row) => sum + row.price, 0) +
    extraFeeLabels.reduce((sum, label) => sum + (extraFees[label] ?? 0), 0) +
    (extraFees["燃油费(%)"] ?? 0);
  const total = applyDiscount(feeSubtotal, discountType, discountValue);

  return (
    <div>
      <SectionTitle>按重量区间价格</SectionTitle>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-small">
          <thead className="bg-bg-page text-text-muted">
            <tr>
              <th className={tableHeadCell}>重量范围</th>
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
                    <span>KG ~</span>
                    <Input className="w-[120px]" />
                    <span>KG</span>
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
                    <span>/KG</span>
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
      <div className="mt-4 grid gap-x-16 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
        <FormRow label="优惠方式" required>
          <div className="flex gap-4 text-small">
            <label>
              <input
                type="radio"
                className="mr-1"
                checked={discountType === "折扣"}
                onChange={() => {
                  setDiscountType("折扣");
                  setDiscountValue(0);
                }}
              />
              折扣
            </label>
            <label>
              <input
                type="radio"
                className="mr-1"
                checked={discountType === "减免"}
                onChange={() => {
                  setDiscountType("减免");
                  setDiscountValue(0);
                }}
              />
              减免
            </label>
          </div>
        </FormRow>
        <FormRow label={discountType === "折扣" ? "折扣率(%)" : "减免金额"}>
          <AmountInput
            value={discountValue}
            placeholder={discountType === "折扣" ? "1-100之间" : "0.00"}
            onChange={(value) => setDiscountValue(discountType === "折扣" ? Math.min(value, 100) : value)}
          />
        </FormRow>
        {extraFeeLabels.map((label) => (
          <FormRow key={label} label={label}>
            <AmountInput value={extraFees[label] ?? 0} onChange={(value) => setExtraFees((current) => ({ ...current, [label]: value }))} />
          </FormRow>
        ))}
        <FormRow label="汇率">
          <AmountInput value={extraFees["汇率"]} placeholder="保留两位小数" onChange={(value) => setExtraFees((current) => ({ ...current, "汇率": value }))} />
        </FormRow>
        <FormRow label="燃油费(%)">
          <AmountInput value={extraFees["燃油费(%)"]} onChange={(value) => setExtraFees((current) => ({ ...current, "燃油费(%)": value }))} />
        </FormRow>
        <FormRow label="总价格">
          <Input disabled value={formatAmount(total)} />
        </FormRow>
      </div>
    </div>
  );
}

function QuoteRateDetail({
  record,
  onBack,
  onEdit,
}: {
  record: QuoteRateRecord;
  onBack: () => void;
  onEdit: () => void;
}) {
  const providerSchemes =
    channelQuoteProviderSchemes[record.logisticsChannel] ??
    record.logisticsProvider.split("、").map((provider) => ({ provider, serviceLinks: [] }));

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <span className="text-title font-semibold">{record.quoteId}</span>
            <Badge tone={record.shippingMode === "整柜" ? "processing" : "success"}>{record.shippingMode}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onBack}>关闭</Button>
            <Button variant="primary" size="sm" onClick={onEdit}>编辑</Button>
          </div>
        </div>
        <div className="mt-4">
          <SectionTitle>基本信息</SectionTitle>
          <div className="mt-4 grid gap-x-10 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
            <InfoItem label="报价ID" value={record.quoteId} />
            <InfoItem label="发货方式" value={record.shippingMode} />
            <InfoItem label="物流商" value={record.logisticsProvider} />
            <InfoItem label="物流渠道" value={record.logisticsChannel} />
            <InfoItem label="发货地" value={record.origin} />
            <InfoItem label="目的地" value={record.destination} />
            <InfoItem label="舱司" value={record.carrier} />
            <InfoItem label="币种" value={record.currency} />
            <InfoItem label="是否含税" value={record.taxIncluded} />
            <InfoItem label="价格有效期" value={`${record.validFrom} ~ ${record.validTo}`} />
            <InfoItem label="计价方式" value={record.pricingMode} />
            <InfoItem label="报价" value={record.totalPrice} />
          </div>
        </div>
      </Card>
      <Card>
        <SectionTitle>物流商报价方案</SectionTitle>
        <div className="mt-4 space-y-4">
          {providerSchemes.map((scheme, schemeIndex) => {
            const feeLabels =
              record.shippingMode === "整柜"
                ? getFeeLabels(scheme.serviceLinks, ["港杂费", "订舱费", "报关费", "派送费", "附加费"])
                : getFeeLabels(scheme.serviceLinks, ["附加费"]);
            const displayRows =
              record.shippingMode === "整柜"
                ? feeLabels
                : ["0-20KG", "20-100KG", "100KG以上", ...feeLabels.filter((label) => label !== "海运费")];

            return (
              <div key={`${scheme.provider}-${schemeIndex}`} className="rounded-sm border border-border p-4">
                <div className="mb-4 grid gap-x-10 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                  <InfoItem label="物流商" value={scheme.provider} />
                  <InfoItem label="服务环节" value={scheme.serviceLinks.join("、") || "-"} />
                  <InfoItem label="计价方式" value={record.pricingMode} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left text-small">
                    <thead className="bg-bg-page text-text-muted">
                      <tr>
                        <th className={tableHeadCell}>{record.shippingMode === "整柜" ? "费用项" : "报价项"}</th>
                        <th className={tableHeadCell}>价格</th>
                        <th className={tableHeadCell}>优惠方式</th>
                        <th className={tableHeadCell}>折扣率/减免金额</th>
                        <th className={tableHeadCell}>汇率</th>
                        <th className={tableHeadCell}>备注</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {displayRows.map((item, index) => (
                        <tr key={item}>
                          <td className="px-3 py-3">{item}</td>
                          <td className="px-3 py-3">{index === 0 ? record.totalPrice : "0.00"}</td>
                          <td className="px-3 py-3">折扣</td>
                          <td className="px-3 py-3">0%</td>
                          <td className="px-3 py-3">7.12</td>
                          <td className="px-3 py-3">-</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
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

export function LogisticsQuoteRatePage({
  resetKey = 0,
  activeWorkspaceTab = "logistics-quote-rate",
  onOpenWorkspaceTab,
}: {
  resetKey?: number;
  activeWorkspaceTab?: string;
  onOpenWorkspaceTab?: (tab: LogisticsQuoteRateWorkspaceTab) => void;
}) {
  const [view, setView] = useState<"list" | "create-fcl" | "edit-fcl" | "create-lcl" | "edit-lcl" | "detail">("list");
  const [activeRecordId, setActiveRecordId] = useState(quoteRateRecords[0]?.id ?? "");
  const [providers, setProviders] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [timeType, setTimeType] = useState("created");
  const [timeRange, setTimeRange] = useState<DateRangeValue>(emptyRange());
  const [quoteId, setQuoteId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const providerFilterOptions = useMemo(
    () => uniqueOptions(quoteRateRecords.flatMap((record) => record.logisticsProvider.split("、"))),
    [],
  );
  const channelFilterOptions = useMemo(() => uniqueOptions(quoteRateRecords.map((record) => record.logisticsChannel)), []);
  const currencyFilterOptions = useMemo(() => uniqueOptions(quoteRateRecords.map((record) => record.currency)), []);

  const filteredRecords = useMemo(() => {
    return quoteRateRecords.filter((record) => {
      const recordProviders = record.logisticsProvider.split("、");
      const matchesProvider = providers.length === 0 || providers.some((provider) => recordProviders.includes(provider));
      const matchesChannel = channels.length === 0 || channels.includes(record.logisticsChannel);
      const matchesOrigin = !origin || record.origin === origin;
      const matchesDestination = !destination || record.destination === destination;
      const matchesCurrency = currencies.length === 0 || currencies.includes(record.currency);
      const timeValue = timeType === "updated" ? record.updatedAt : record.createdAt;
      const matchesTime = inDateRange(timeValue, timeRange);
      const matchesQuoteId = !quoteId.trim() || record.quoteId === quoteId.trim();
      return matchesProvider && matchesChannel && matchesOrigin && matchesDestination && matchesCurrency && matchesTime && matchesQuoteId;
    });
  }, [channels, currencies, destination, origin, providers, quoteId, timeRange, timeType]);

  const totalPages = Math.max(Math.ceil(filteredRecords.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageIds = pagedRecords.map((record) => record.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const activeRecord = quoteRateRecords.find((record) => record.id === activeRecordId) ?? quoteRateRecords[0];

  useEffect(() => {
    setView("list");
  }, [resetKey]);

  useEffect(() => {
    if (activeWorkspaceTab === "logistics-quote-rate") {
      setView("list");
    }
    if (activeWorkspaceTab === "logistics-quote-rate-create-fcl") {
      setView("create-fcl");
    }
    if (activeWorkspaceTab === "logistics-quote-rate-edit-fcl") {
      setView("edit-fcl");
    }
    if (activeWorkspaceTab === "logistics-quote-rate-create-lcl") {
      setView("create-lcl");
    }
    if (activeWorkspaceTab === "logistics-quote-rate-edit-lcl") {
      setView("edit-lcl");
    }
    if (activeWorkspaceTab === "logistics-quote-rate-detail") {
      setView("detail");
    }
  }, [activeWorkspaceTab]);

  function resetFilters() {
    setProviders([]);
    setChannels([]);
    setOrigin("");
    setDestination("");
    setCurrencies([]);
    setTimeType("created");
    setTimeRange(emptyRange());
    setQuoteId("");
    setPage(1);
  }

  function toggleAll() {
    setSelectedIds((current) => (allSelected ? current.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...current, ...pageIds]))));
  }

  function toggleRow(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function openEdit(record: QuoteRateRecord) {
    setActiveRecordId(record.id);
    setView(record.shippingMode === "整柜" ? "edit-fcl" : "edit-lcl");
    onOpenWorkspaceTab?.(record.shippingMode === "整柜" ? "logistics-quote-rate-edit-fcl" : "logistics-quote-rate-edit-lcl");
  }

  function openDetail(record: QuoteRateRecord) {
    setActiveRecordId(record.id);
    setView("detail");
    onOpenWorkspaceTab?.("logistics-quote-rate-detail");
  }

  if (view === "create-fcl" || view === "create-lcl" || view === "edit-fcl" || view === "edit-lcl") {
    const isEdit = view === "edit-fcl" || view === "edit-lcl";
    return (
      <QuoteRateForm
        mode={view}
        record={isEdit ? activeRecord : undefined}
        onBack={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-quote-rate");
        }}
        onSubmit={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-quote-rate");
        }}
      />
    );
  }

  if (view === "detail" && activeRecord) {
    return (
      <QuoteRateDetail
        record={activeRecord}
        onBack={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-quote-rate");
        }}
        onEdit={() => openEdit(activeRecord)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <MultiSelectFilter placeholder="物流商" options={providerFilterOptions} value={providers} onChange={setProviders} />
          <MultiSelectFilter placeholder="物流渠道" options={channelFilterOptions} value={channels} onChange={setChannels} />
          <AddressCascade className="w-[220px]" placeholder="发货地" value={origin} onChange={setOrigin} />
          <AddressCascade className="w-[220px]" placeholder="目的地" value={destination} onChange={setDestination} />
          <MultiSelectFilter placeholder="币种" options={currencyFilterOptions} value={currencies} onChange={setCurrencies} />
          <Select
            className="w-[128px]"
            value={timeType}
            onValueChange={setTimeType}
            options={[
              { label: "创建时间", value: "created" },
              { label: "更新时间", value: "updated" },
            ]}
          />
          <DateRangePicker value={timeRange} onChange={setTimeRange} />
          <Input className="w-[180px]" placeholder="报价ID" value={quoteId} onChange={(event) => setQuoteId(event.target.value)} />
          <Button variant="primary" size="sm">查询</Button>
          <Button variant="secondary" size="sm" onClick={resetFilters}>重置</Button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setView("create-fcl");
                onOpenWorkspaceTab?.("logistics-quote-rate-create-fcl");
              }}
            >
              添加整柜报价
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setView("create-lcl");
                onOpenWorkspaceTab?.("logistics-quote-rate-create-lcl");
              }}
            >
              添加散货报价
            </Button>
            <Button variant="secondary" size="sm">导入整柜报价</Button>
            <Button variant="secondary" size="sm">导入散柜报价</Button>
          </div>
          <Button variant="secondary" size="sm">导出</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1900px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={`w-10 ${tableHeadCell}`}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className={tableHeadCell}>报价ID</th>
                <th className={tableHeadCell}>发货方式</th>
                <th className={tableHeadCell}>物流商</th>
                <th className={tableHeadCell}>物流渠道</th>
                <th className={tableHeadCell}>发货地</th>
                <th className={tableHeadCell}>目的地</th>
                <th className={tableHeadCell}>币种</th>
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
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-primary">{record.quoteId}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <Badge tone={record.shippingMode === "整柜" ? "processing" : "success"}>{record.shippingMode}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsProvider}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsChannel}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.origin}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.destination}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.currency}</td>
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
