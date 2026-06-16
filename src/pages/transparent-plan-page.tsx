import type { CSSProperties, ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DateRangePicker, type DateRangeValue } from "../components/ui/date-range-picker";
import { ExclusiveFilterGroup, useExclusiveFilterPanel } from "../components/ui/exclusive-filter-group";
import { Input } from "../components/ui/input";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { SelectChevron } from "../components/ui/select-chevron";

type TransparencyStatus = "未使用" | "已使用";

type TransparentPlanRecord = {
  id: string;
  tCode: string;
  status: TransparencyStatus;
  asin: string;
  msku: string;
  fnsku: string;
  gtin: string;
  model: string;
  account: string;
  creator: string;
  createdAt: string;
  usedAt: string;
};

type TransparentPlanFilters = {
  status: string;
  accounts: string[];
  timeField: "createdAt" | "usedAt";
  dateRange: DateRangeValue;
  searchField: "tCode" | "msku" | "asin" | "creator";
  searchKeyword: string;
};

const defaultFilters: TransparentPlanFilters = {
  status: "",
  accounts: [],
  timeField: "createdAt",
  dateRange: { start: "", end: "" },
  searchField: "tCode",
  searchKeyword: "",
};

const pageSizeOptions = [10, 20, 30, 50, 100];
const tableHeadCell = "whitespace-nowrap px-3 py-3 text-left text-small font-medium";

const storeOptions = [
  "Amazon-US官方旗舰店",
  "Amazon-CA北美店",
  "Amazon-DE欧洲店",
  "Walmart家居店",
  "Shopify独立站",
  "TikTok Shop美区店",
];

const timeFieldOptions = [
  { label: "创建时间", value: "createdAt" },
  { label: "使用时间", value: "usedAt" },
];

const searchFieldOptions = [
  { label: "T-Code", value: "tCode" },
  { label: "MSKU", value: "msku" },
  { label: "ASIN", value: "asin" },
  { label: "创建人", value: "creator" },
];

const transparentPlanRecords: TransparentPlanRecord[] = [
  {
    id: "tp-001",
    tCode: "AZ:QX9Y-TC01-000001",
    status: "未使用",
    asin: "B0FRSLT3BF",
    msku: "MSKU-SP2113H-US",
    fnsku: "X004UGWNP7",
    gtin: "6974459100012",
    model: "SP2113H",
    account: "Amazon-US官方旗舰店",
    creator: "兰轩",
    createdAt: "2026-06-08 09:12:33",
    usedAt: "",
  },
  {
    id: "tp-002",
    tCode: "AZ:QX9Y-TC01-000002",
    status: "已使用",
    asin: "B0FRSLHZXS",
    msku: "MSKU-SP2113H-CA",
    fnsku: "X004UGWLN5",
    gtin: "6974459100029",
    model: "SP2113H",
    account: "Amazon-CA北美店",
    creator: "周婷婷",
    createdAt: "2026-06-07 14:28:10",
    usedAt: "2026-06-08 16:20:11",
  },
  {
    id: "tp-003",
    tCode: "AZ:QX9Y-TC01-000003",
    status: "未使用",
    asin: "B0FRSLTEST",
    msku: "MSKU-SP2115H-DE",
    fnsku: "X004UGWXYZ",
    gtin: "6974459100036",
    model: "SP2115H",
    account: "Amazon-DE欧洲店",
    creator: "李莎丽",
    createdAt: "2026-06-06 11:05:42",
    usedAt: "",
  },
  {
    id: "tp-004",
    tCode: "AZ:QX9Y-TC01-000004",
    status: "已使用",
    asin: "B0FRSLDEMO",
    msku: "WM-SP2118H-US",
    fnsku: "X004UGWABC",
    gtin: "6974459100043",
    model: "SP2118H",
    account: "Walmart家居店",
    creator: "张晓莹",
    createdAt: "2026-06-05 17:42:16",
    usedAt: "2026-06-06 09:35:20",
  },
  {
    id: "tp-005",
    tCode: "AZ:QX9Y-TC01-000005",
    status: "未使用",
    asin: "B0FRSLSAMP",
    msku: "SHOP-SP2120H-US",
    fnsku: "X004UGWDEF",
    gtin: "6974459100050",
    model: "SP2120H",
    account: "Shopify独立站",
    creator: "超级管理员",
    createdAt: "2026-06-04 10:18:09",
    usedAt: "",
  },
  {
    id: "tp-006",
    tCode: "AZ:QX9Y-TC01-000006",
    status: "已使用",
    asin: "B0FRSLTKUS",
    msku: "TK-SP2122H-US",
    fnsku: "X004UGWTK1",
    gtin: "6974459100067",
    model: "SP2122H",
    account: "TikTok Shop美区店",
    creator: "兰轩",
    createdAt: "2026-06-03 15:07:52",
    usedAt: "2026-06-04 13:26:40",
  },
];

function includesText(source: string, target: string) {
  if (!target.trim()) {
    return true;
  }
  return source.toLowerCase().includes(target.trim().toLowerCase());
}

function dateInRange(dateText: string, range: DateRangeValue) {
  if (!range.start && !range.end) {
    return true;
  }
  const date = dateText.slice(0, 10);
  if (!date) {
    return false;
  }
  if (range.start && date < range.start) {
    return false;
  }
  if (range.end && date > range.end) {
    return false;
  }
  return true;
}

function filterRecords(records: TransparentPlanRecord[], filters: TransparentPlanFilters) {
  return records.filter((record) => {
    const matchesStatus = !filters.status || record.status === filters.status;
    const matchesAccount = filters.accounts.length === 0 || filters.accounts.includes(record.account);
    const timeValue = filters.timeField === "createdAt" ? record.createdAt : record.usedAt;
    const matchesTime = dateInRange(timeValue, filters.dateRange);
    const matchesKeyword = includesText(record[filters.searchField], filters.searchKeyword);

    return (
      matchesStatus &&
      matchesAccount &&
      matchesTime &&
      matchesKeyword
    );
  });
}

function isDefaultFilters(filters: TransparentPlanFilters) {
  return (
    !filters.status &&
    filters.accounts.length === 0 &&
    filters.timeField === defaultFilters.timeField &&
    !filters.dateRange.start &&
    !filters.dateRange.end &&
    filters.searchField === defaultFilters.searchField &&
    !filters.searchKeyword
  );
}

export function TransparentPlanPage() {
  const [draftFilters, setDraftFilters] = useState<TransparentPlanFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<TransparentPlanFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRecords = useMemo(
    () => filterRecords(transparentPlanRecords, appliedFilters),
    [appliedFilters],
  );
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  function updateDraftField<Key extends keyof TransparentPlanFilters>(
    key: Key,
    value: TransparentPlanFilters[Key],
  ) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function handleSearch() {
    setAppliedFilters({ ...draftFilters, accounts: [...draftFilters.accounts] });
    setPage(1);
  }

  function handleReset() {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <Card>
        <ExclusiveFilterGroup>
        <div className="flex flex-wrap items-end gap-3">
          <FilterItem label="使用状态" widthClass="w-[148px]">
            <Select
              value={draftFilters.status}
              placeholder="请选择使用状态"
              options={[
                { label: "未使用", value: "未使用" },
                { label: "已使用", value: "已使用" },
              ]}
              onValueChange={(value) => updateDraftField("status", value)}
            />
          </FilterItem>
          <FilterItem label="透明计划账号" widthClass="w-[220px]">
            <StoreMultiSelect
              value={draftFilters.accounts}
              options={storeOptions}
              placeholder="请选择店铺"
              onChange={(value) => updateDraftField("accounts", value)}
            />
          </FilterItem>
          <FilterItem label="日期范围" widthClass="w-[420px]">
            <div className="grid grid-cols-[132px_1fr] gap-2">
              <Select
                value={draftFilters.timeField}
                options={timeFieldOptions}
                clearable={false}
                onValueChange={(value) => updateDraftField("timeField", value as TransparentPlanFilters["timeField"])}
              />
              <DateRangePicker
                value={draftFilters.dateRange}
                onChange={(value) => updateDraftField("dateRange", value)}
              />
            </div>
          </FilterItem>
          <FilterItem label="精确搜索" widthClass="w-[380px]">
            <div className="grid grid-cols-[132px_1fr] gap-2">
              <Select
                value={draftFilters.searchField}
                options={searchFieldOptions}
                clearable={false}
                onValueChange={(value) => updateDraftField("searchField", value as TransparentPlanFilters["searchField"])}
              />
              <Input
                value={draftFilters.searchKeyword}
                placeholder="请输入搜索内容"
                onChange={(event) => updateDraftField("searchKeyword", event.target.value)}
              />
            </div>
          </FilterItem>
          <div className="flex shrink-0 items-center gap-2 pb-0.5">
            <Button variant="primary" size="sm" onClick={handleSearch}>
              <Search aria-hidden="true" className="h-4 w-4" />
              搜索
            </Button>
            <Button variant="secondary" size="sm" onClick={handleReset}>
              重置
            </Button>
          </div>
        </div>
        </ExclusiveFilterGroup>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>T-Code</th>
                <th className={tableHeadCell}>使用状态</th>
                <th className={tableHeadCell}>ASIN</th>
                <th className={tableHeadCell}>MSKU/FNSKU</th>
                <th className={tableHeadCell}>GTIN</th>
                <th className={tableHeadCell}>型号</th>
                <th className={tableHeadCell}>透明计划账号</th>
                <th className={tableHeadCell}>创建人</th>
                <th className={tableHeadCell}>创建时间</th>
                <th className={tableHeadCell}>使用时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedItems.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap px-3 py-3">{record.tCode}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className={record.status === "已使用" ? "text-success" : "text-warning"}>{record.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.asin}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.msku}</div>
                    <div className="text-text-muted">{record.fnsku}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.gtin}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.model}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.account}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.creator}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.createdAt}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.usedAt || "-"}</td>
                </tr>
              ))}
              {pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-text-muted">
                    暂无透明计划数据
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={isDefaultFilters(appliedFilters) ? transparentPlanRecords.length : filteredRecords.length}
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

function StoreMultiSelect({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string[];
  options: string[];
  placeholder: string;
  onChange: (value: string[]) => void;
}) {
  const panelId = useId();
  const { open, toggle, setOpen } = useExclusiveFilterPanel(panelId);
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
  const canClear = value.length > 0;
  const visibleTags = value.slice(0, 1);
  const hiddenCount = Math.max(value.length - visibleTags.length, 0);

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
      const estimatedHeight = Math.min(Math.max(options.length * 36 + 12, 96), 260);
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const placeBelow = spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove;
      const availableHeight = Math.max(96, (placeBelow ? spaceBelow : spaceAbove) - menuOffset);
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
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <div ref={rootRef} className="group relative">
      <button
        ref={triggerRef}
        type="button"
        className="field-control flex w-full items-center justify-between gap-2 pr-10 text-left"
        onClick={toggle}
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
          aria-label="清空透明计划账号"
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
                      <span className="inline-flex w-4 shrink-0 justify-center text-primary">
                        {checked ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
                      </span>
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
