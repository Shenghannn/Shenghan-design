import { Fragment, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Ellipsis, ImageIcon, Search } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DateRangePicker } from "../components/ui/date-range-picker";
import { PageHeader } from "../components/ui/page-header";
import { Select, type SelectOption } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

type StaTaskStatus = "草稿" | "进行中" | "已发货" | "已取消" | "异常";
type StaCurrentStep = "选择发货商品" | "商品装箱" | "配送服务" | "箱子标签" | "货件追踪";

type StaTaskRecord = {
  id: string;
  staNo: string;
  shipmentNo: string;
  skuCount: number;
  totalQty: number;
  marketplace: string;
  sourceWarehouse: string;
  destination: string;
  status: StaTaskStatus;
  currentStep: StaCurrentStep;
  updatedAt: string;
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

type FbaShipmentRecord = {
  id: string;
  shipmentId: string;
  planNo: string;
  mskuCount: number;
  totalQty: number;
  destinationFc: string;
  boxMode: string;
  shipmentStatus: FbaShipmentStatusCode;
  completionStatus: "进行中" | "已完成";
  hasStaTask: boolean;
  updatedAt: string;
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

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";

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

const fbaShipmentStatusFilterOptions: SelectOption[] = Object.entries(fbaShipmentStatusLabels).map(
  ([value, label]) => ({ label, value }),
);

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

const threeMonthPresets = [
  {
    label: "近三个月",
    start: defaultThreeMonthRange.start,
    end: defaultThreeMonthRange.end,
  },
];

const staTaskRecords: StaTaskRecord[] = [
  {
    id: "sta-001",
    staNo: "STA-20260322-001",
    shipmentNo: "FBA18T6Q4V2",
    skuCount: 8,
    totalQty: 640,
    marketplace: "US",
    sourceWarehouse: "上海集货仓",
    destination: "ONT8",
    status: "草稿",
    currentStep: "选择发货商品",
    updatedAt: "2026-03-22 10:42",
  },
  {
    id: "sta-002",
    staNo: "STA-20260322-002",
    shipmentNo: "FBA18T6Q4W9",
    skuCount: 5,
    totalQty: 420,
    marketplace: "CA",
    sourceWarehouse: "宁波前置仓",
    destination: "YYZ4",
    status: "进行中",
    currentStep: "商品装箱",
    updatedAt: "2026-03-22 09:18",
  },
  {
    id: "sta-003",
    staNo: "STA-20260321-018",
    shipmentNo: "FBA18T6Q3A7",
    skuCount: 12,
    totalQty: 960,
    marketplace: "US",
    sourceWarehouse: "深圳保税仓",
    destination: "LGB8",
    status: "异常",
    currentStep: "配送服务",
    updatedAt: "2026-03-21 18:36",
  },
];

const fbaShipmentRecords: FbaShipmentRecord[] = [
  {
    id: "fba-001",
    shipmentId: "FBA19CHTHLKB",
    planNo: "PLN-20260322-001",
    mskuCount: 14,
    totalQty: 1280,
    destinationFc: "ONT8",
    boxMode: "先分仓再装箱",
    shipmentStatus: "WORKING",
    completionStatus: "进行中",
    hasStaTask: true,
    updatedAt: "2026-03-22 11:08",
  },
  {
    id: "fba-002",
    shipmentId: "FBA18T6Q4W9",
    planNo: "PLN-20260322-002",
    mskuCount: 7,
    totalQty: 520,
    destinationFc: "YYZ4",
    boxMode: "先装箱再分仓",
    shipmentStatus: "READY_TO_SHIP",
    completionStatus: "进行中",
    hasStaTask: true,
    updatedAt: "2026-03-22 10:26",
  },
  {
    id: "fba-003",
    shipmentId: "FBA18T6Q3A7",
    planNo: "PLN-20260321-018",
    mskuCount: 18,
    totalQty: 1540,
    destinationFc: "LGB8",
    boxMode: "先分仓再装箱",
    shipmentStatus: "CLOSED",
    completionStatus: "已完成",
    hasStaTask: false,
    updatedAt: "2026-03-21 19:12",
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
  widthClass = "min-w-[360px]",
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
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          presets={threeMonthPresets}
        />
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
}: {
  fieldOptions: SelectOption[];
  defaultField: string;
}) {
  const [field, setField] = useState(defaultField);
  const [fieldMenuOpen, setFieldMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState("");
  const [bulkApplied, setBulkApplied] = useState("");
  const [fieldMenuStyle, setFieldMenuStyle] = useState<{ top: number; left: number; minWidth: number }>({
    top: 0,
    left: 0,
    minWidth: 0,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldTriggerRef = useRef<HTMLButtonElement>(null);
  const bulkPanelRef = useRef<HTMLDivElement>(null);

  const selectedField =
    fieldOptions.find((option) => option.value === field) ?? fieldOptions[0];

  const fieldMenuMinWidth = Math.max(
    ...fieldOptions.map((option) => option.label.length * 14 + 32),
    selectedField.label.length * 14 + 40,
    148,
  );

  const bulkLineCount = bulkApplied
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;

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
        minWidth: Math.max(rect.width, fieldMenuMinWidth),
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [fieldMenuMinWidth, fieldMenuOpen]);

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
    <div ref={rootRef} className="relative w-full min-w-[280px]">
      <div className="flex h-input-md w-full min-w-0 rounded-sm border border-border bg-white focus-within:border-border-focus focus-within:ring-2 focus-within:ring-primary-subtle">
        <div className="relative shrink-0 border-r border-border">
          <button
            ref={fieldTriggerRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={fieldMenuOpen}
            style={{ minWidth: fieldMenuMinWidth }}
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
                    minWidth: fieldMenuStyle.minWidth,
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
          className="min-w-0 flex-1 border-0 bg-transparent px-3 text-body text-text-primary outline-none placeholder:text-text-placeholder read-only:cursor-default"
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

function ProductImagePlaceholder() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-dashed border-border bg-bg-page text-text-muted">
      <ImageIcon aria-hidden="true" className="h-4 w-4" />
    </div>
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
}: {
  options: Array<{ label: string; value: string }>;
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
              onClick={() => setOpen(false)}
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

const actionSelectOptions = [
  { label: "编辑", value: "edit" },
  { label: "生成备货单", value: "create-stockup" },
  { label: "取消", value: "cancel" },
];

function TableOperationCell() {
  return (
    <td className="whitespace-nowrap px-3 py-3">
      <div className="flex flex-nowrap items-center justify-end gap-3">
        <ActionLinkButton>详情</ActionLinkButton>
        <ActionDropdown options={actionSelectOptions} />
      </div>
    </td>
  );
}

function TableStatusCell({ children }: { children: ReactNode }) {
  return (
    <td className="min-w-[240px] whitespace-nowrap px-3 py-3">
      <div className="flex flex-nowrap items-center justify-end gap-2">{children}</div>
    </td>
  );
}

function PrototypePagination() {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-border px-4 py-3 text-small text-text-muted">
      <span>共 1000 条</span>
      <div className="flex items-center gap-1">
        <Button variant="secondary" size="sm" disabled>
          上一页
        </Button>
        <Button variant="primary" size="sm">
          1
        </Button>
        <Button variant="secondary" size="sm">
          2
        </Button>
        <Button variant="secondary" size="sm">
          3
        </Button>
        <Button variant="secondary" size="sm">
          ...
        </Button>
        <Button variant="secondary" size="sm">
          下一页
        </Button>
      </div>
      <Select
        defaultValue="10"
        menuPlacement="top"
        className="w-[96px]"
        options={[
          { label: "10条/页", value: "10" },
          { label: "20条/页", value: "20" },
          { label: "50条/页", value: "50" },
          { label: "100条/页", value: "100" },
        ]}
      />
    </div>
  );
}

export function StaTaskPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="STA任务"
        description="用于预览STA任务查询、分仓生成和异常说明，当前页面仅展示原型交互。"
        actions={
          <>
            <Button variant="secondary" size="sm">导入</Button>
            <Button variant="secondary" size="sm">导出</Button>
            <Button variant="primary" size="sm">生成STA任务</Button>
          </>
        }
      />

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
          <FilterField widthClass="min-w-[320px] flex-1">
            <KeywordSearchField
              fieldOptions={staKeywordFieldOptions}
              defaultField="task-name"
            />
          </FilterField>
          <FilterQueryActions />
        </FilterBar>
      </Card>

      <Card
        title="STA任务列表"
        extra={<Button variant="secondary" size="sm">导出装箱清单</Button>}
      >
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[1180px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={`w-10 ${tableHeadCell}`}><input type="checkbox" /></th>
                <th className={tableHeadCell}>图片</th>
                <th className={tableHeadCell}>MSKU</th>
                <th className={tableHeadCell}>FNSKU</th>
                <th className={tableHeadCell}>ASIN</th>
                <th className={tableHeadCell}>中文品名</th>
                <th className={tableHeadCell}>SKU</th>
                <th className={tableHeadCell}>申报量</th>
                <th className={`min-w-[240px] ${tableHeadCell}`}>状态</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {staTaskRecords.map((record, index) => (
                <Fragment key={record.id}>
                  <tr className={index === 0 ? "bg-primary-subtle/40" : "bg-bg-page/70"}>
                    <td className="px-3 py-3"><input type="checkbox" /></td>
                    <td colSpan={7} className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span className="font-medium text-primary">{record.staNo}（{record.updatedAt}）</span>
                        <span>店铺：Shenghan店铺编码XXX</span>
                        <span>物流中心编号：SCK1/CHO1</span>
                      </div>
                      <div className="mt-1 text-text-muted">
                        最近更新时间：XXX更新XXX　创建人：XXX创建人名称XXX　创建时间：XXX创建人名称XXX
                      </div>
                    </td>
                    <TableStatusCell>
                      <Badge tone={staStatusTone(record.status)} className="shrink-0">
                        {record.status}
                      </Badge>
                      <Badge tone="processing" className="shrink-0">
                        {record.currentStep}
                      </Badge>
                    </TableStatusCell>
                    <TableOperationCell />
                  </tr>
                  <tr>
                    <td className="px-3 py-3" />
                    <td className="px-3 py-3">
                      <ProductImagePlaceholder />
                    </td>
                    <td className="px-3 py-3">SYJN-FS23-00074042-002</td>
                    <td className="px-3 py-3">X004UGWLN5</td>
                    <td className="px-3 py-3">B0FRSLHZXS</td>
                    <td className="px-3 py-3">燃油宝成品SP2113H</td>
                    <td className="px-3 py-3">JN-FS23-00074042</td>
                    <td className="px-3 py-3">{record.totalQty / 64}</td>
                    <td className="px-3 py-3 text-text-muted">-</td>
                    <td className="px-3 py-3 text-text-muted">-</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border py-2 text-center text-small text-primary">展开剩余30个商品</div>
          <PrototypePagination />
        </div>
      </Card>
    </div>
  );
}

export function FbaShipmentPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="FBA货件"
        description="用于预览FBA货件查询、分仓装箱、货件状态和异常说明，当前页面仅展示原型交互。"
        actions={
          <>
            <Button variant="secondary" size="sm">同步货件</Button>
            <Button variant="secondary" size="sm">导出</Button>
            <Button variant="primary" size="sm">创建货件</Button>
          </>
        }
      />

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
            <MultiSelect options={fbaShipmentStatusFilterOptions} placeholder="请选择货件状态" />
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
            widthClass="min-w-[400px]"
          />
          <FilterField widthClass="min-w-[300px] flex-1">
            <KeywordSearchField
              fieldOptions={fbaKeywordFieldOptions}
              defaultField="sta-name"
            />
          </FilterField>
          <FilterField widthClass="w-[180px]">
            <MultiSelect options={currentStepFilterOptions} placeholder="请选择当前步骤" />
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

      <Card
        title="FBA货件列表"
        extra={<Button variant="secondary" size="sm">导出箱唛清单</Button>}
      >
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[1480px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={`w-10 ${tableHeadCell}`}><input type="checkbox" /></th>
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
                <th className={`min-w-[240px] ${tableHeadCell}`}>状态</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {fbaShipmentRecords.map((record, index) => (
                <Fragment key={record.id}>
                  <tr className={index === 0 ? "bg-primary-subtle/40" : "bg-bg-page/70"}>
                    <td className="px-3 py-3"><input type="checkbox" /></td>
                    <td colSpan={12} className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <span className="inline-flex items-center gap-2 font-medium text-primary">
                          {record.shipmentId}
                          {record.hasStaTask ? <StaTaskBadge /> : null}
                        </span>
                        <span>STA任务：{record.hasStaTask ? `STA（${record.updatedAt}）` : "-"}</span>
                        <span>物流中心编号：XLX7</span>
                        <span>店铺：AMZ-US-028</span>
                        <span>Reference Id：6KHVPYPS</span>
                      </div>
                      <div className="mt-1 text-text-muted">
                        店铺：Shenghan店铺编码XXX　创建人：XXX　创建时间：2026-04-29 17:11　运输类型：XXX
                      </div>
                    </td>
                    <TableStatusCell>
                      <Badge tone={fbaShipmentStatusTone(record.shipmentStatus)} className="shrink-0">
                        {fbaShipmentStatusLabels[record.shipmentStatus]}
                      </Badge>
                      <Badge tone={fbaCompletionStatusTone(record.completionStatus)} className="shrink-0">
                        {record.completionStatus}
                      </Badge>
                    </TableStatusCell>
                    <TableOperationCell />
                  </tr>
                  <tr>
                    <td className="px-3 py-3" />
                    <td className="px-3 py-3">
                      <ProductImagePlaceholder />
                    </td>
                    <td className="px-3 py-3">SYJN-FS23-00074042-002</td>
                    <td className="px-3 py-3">X004UGWLN5</td>
                    <td className="px-3 py-3">B0FRSLHZXS</td>
                    <td className="px-3 py-3">燃油宝成品SP2113H</td>
                    <td className="px-3 py-3">JN-FS23-00074042</td>
                    <td className="px-3 py-3">10</td>
                    <td className="px-3 py-3">{index === 0 ? 8 : 0}</td>
                    <td className="px-3 py-3">{index === 0 ? 8 : 0}</td>
                    <td className="px-3 py-3">{index === 0 ? 2 : 0}</td>
                    <td className="px-3 py-3">{index === 0 ? 1 : 0}</td>
                    <td className="px-3 py-3">{index === 0 ? 1 : 0}</td>
                    <td className="px-3 py-3 text-text-muted">-</td>
                    <td className="px-3 py-3 text-text-muted">-</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border py-2 text-center text-small text-primary">展开剩余10个商品</div>
          <PrototypePagination />
        </div>
      </Card>
    </div>
  );
}
