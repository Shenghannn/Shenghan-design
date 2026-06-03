import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import {
  liangcangAccountOptions,
  liangcangSkuDisplayTotalCount,
  liangcangSkuRecords,
  type LiangcangSkuRecord,
} from "../data/liangcang-sku-data";

type LiangcangSkuFilters = {
  liangcangAccount: string;
  liangcangName: string;
  liangcangProductCode: string;
  liangcangBarcode: string;
  sku: string;
  productName: string;
};

const defaultFilters: LiangcangSkuFilters = {
  liangcangAccount: "",
  liangcangName: "",
  liangcangProductCode: "",
  liangcangBarcode: "",
  sku: "",
  productName: "",
};

const pageSizeOptions = [10, 20, 30, 50, 100];

const tableHeadCell = "whitespace-nowrap px-3 py-3 text-left text-small font-medium";

function includesText(source: string, target: string) {
  if (!target.trim()) {
    return true;
  }

  return source.toLowerCase().includes(target.trim().toLowerCase());
}

function isDefaultFilters(filters: LiangcangSkuFilters) {
  return (
    filters.liangcangAccount === defaultFilters.liangcangAccount &&
    filters.liangcangName === defaultFilters.liangcangName &&
    filters.liangcangProductCode === defaultFilters.liangcangProductCode &&
    filters.liangcangBarcode === defaultFilters.liangcangBarcode &&
    filters.sku === defaultFilters.sku &&
    filters.productName === defaultFilters.productName
  );
}

function filterRecords(records: LiangcangSkuRecord[], filters: LiangcangSkuFilters) {
  return records.filter(
    (record) =>
      (!filters.liangcangAccount || record.liangcangAccount === filters.liangcangAccount) &&
      includesText(record.liangcangName, filters.liangcangName) &&
      includesText(record.liangcangProductCode, filters.liangcangProductCode) &&
      includesText(record.liangcangBarcode, filters.liangcangBarcode) &&
      includesText(record.sku, filters.sku) &&
      includesText(record.productName, filters.productName),
  );
}

export function LiangcangSkuPage() {
  const [draftFilters, setDraftFilters] = useState<LiangcangSkuFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<LiangcangSkuFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRecords = useMemo(
    () => filterRecords(liangcangSkuRecords, appliedFilters),
    [appliedFilters],
  );

  const totalCount = isDefaultFilters(appliedFilters) ? liangcangSkuDisplayTotalCount : filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  function updateDraftField<Key extends keyof LiangcangSkuFilters>(key: Key, value: LiangcangSkuFilters[Key]) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function handleSearch() {
    setAppliedFilters({ ...draftFilters });
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
        <div className="flex flex-wrap items-end gap-3">
          <FilterItem label="良仓账号" widthClass="w-[148px]">
            <Select
              value={draftFilters.liangcangAccount}
              placeholder="请选择良仓账号"
              options={[{ label: "全部", value: "" }, ...liangcangAccountOptions]}
              onValueChange={(value) => updateDraftField("liangcangAccount", value)}
            />
          </FilterItem>
          <FilterItem label="良仓中文名称" widthClass="w-[160px]">
            <Input
              value={draftFilters.liangcangName}
              placeholder="请输入良仓中文名称"
              onChange={(event) => updateDraftField("liangcangName", event.target.value)}
            />
          </FilterItem>
          <FilterItem label="良仓商品编码" widthClass="w-[160px]">
            <Input
              value={draftFilters.liangcangProductCode}
              placeholder="请输入良仓商品编码"
              onChange={(event) => updateDraftField("liangcangProductCode", event.target.value)}
            />
          </FilterItem>
          <FilterItem label="良仓商品条码" widthClass="w-[180px]">
            <Input
              value={draftFilters.liangcangBarcode}
              placeholder="请输入良仓商品条码"
              onChange={(event) => updateDraftField("liangcangBarcode", event.target.value)}
            />
          </FilterItem>
          <FilterItem label="SKU" widthClass="w-[148px]">
            <Input
              value={draftFilters.sku}
              placeholder="请输入SKU"
              onChange={(event) => updateDraftField("sku", event.target.value)}
            />
          </FilterItem>
          <FilterItem label="中文品名" widthClass="w-[148px]">
            <Input
              value={draftFilters.productName}
              placeholder="请输入中文品名"
              onChange={(event) => updateDraftField("productName", event.target.value)}
            />
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
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>中文品名/SKU</th>
                <th className={tableHeadCell}>良仓中文名称/良仓商品编码</th>
                <th className={tableHeadCell}>良仓商品条码</th>
                <th className={tableHeadCell}>良仓账号</th>
                <th className={tableHeadCell}>配对比</th>
                <th className={tableHeadCell}>创建人/创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedItems.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.productName}</div>
                    <div className="text-text-muted">{record.sku}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.liangcangName}</div>
                    <div className="text-text-muted">{record.liangcangProductCode}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.liangcangBarcode}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.liangcangAccount}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.matchRatio}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.creator}</div>
                    <div className="text-text-muted">{record.createdAt}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
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
