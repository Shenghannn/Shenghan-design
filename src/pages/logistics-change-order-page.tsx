import { useMemo, useState, type ReactNode } from "react";
import { ExactBatchSearch } from "../components/ui/batch-exact-search";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ExclusiveFilterGroup } from "../components/ui/exclusive-filter-group";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

type ChangeOrderLine = {
  id: string;
  stockupNo: string;
  sku: string;
  qty: number;
  remark: string;
};

const tableHeadCell = "whitespace-nowrap px-3 py-3 text-left text-small font-medium";

const changeTypeOptions = [
  { label: "备货单变更", value: "stockup-change" },
  { label: "发货计划变更", value: "shipping-plan-change" },
  { label: "物流信息变更", value: "logistics-info-change" },
];

const changeOrderLines: ChangeOrderLine[] = [
  {
    id: "line-001",
    stockupNo: "PL2606040004",
    sku: "JN-CI04-00000028",
    qty: 10000,
    remark: "111",
  },
  {
    id: "line-002",
    stockupNo: "PL2606040004",
    sku: "JN-CI04-00000025",
    qty: 10000,
    remark: "112",
  },
];

function FormRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
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

function SectionTitle({ children }: { children: string }) {
  return <div className="border-l-4 border-primary pl-3 font-medium text-text-primary">{children}</div>;
}

function filterLines(lines: ChangeOrderLine[], keyword: string, batchValues: string[]) {
  if (batchValues.length > 0) {
    const normalizedFilters = new Set(batchValues.map((item) => item.toLowerCase()));
    return lines.filter((line) => normalizedFilters.has(line.sku.toLowerCase()));
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return lines;
  }

  return lines.filter((line) => line.sku.toLowerCase() === normalizedKeyword);
}

export function LogisticsChangeOrderPage() {
  const [changeType, setChangeType] = useState("stockup-change");
  const [remark, setRemark] = useState("");
  const [draftSkuKeyword, setDraftSkuKeyword] = useState("");
  const [draftSkuBatch, setDraftSkuBatch] = useState<string[]>([]);
  const [appliedSkuKeyword, setAppliedSkuKeyword] = useState("");
  const [appliedSkuBatch, setAppliedSkuBatch] = useState<string[]>([]);

  const filteredLines = useMemo(
    () => filterLines(changeOrderLines, appliedSkuKeyword, appliedSkuBatch),
    [appliedSkuBatch, appliedSkuKeyword],
  );

  const totalQty = filteredLines.reduce((sum, line) => sum + line.qty, 0);

  function handleSearch() {
    setAppliedSkuKeyword(draftSkuKeyword.trim());
    setAppliedSkuBatch(draftSkuBatch);
  }

  function handleReset() {
    setDraftSkuKeyword("");
    setDraftSkuBatch([]);
    setAppliedSkuKeyword("");
    setAppliedSkuBatch([]);
  }

  return (
    <div className="space-y-4 pb-16">
      <Card>
        <SectionTitle>创建物流变更单</SectionTitle>
        <div className="mt-4 grid gap-x-10 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <FormRow label="变更类型" required>
            <Select
              value={changeType}
              options={changeTypeOptions}
              clearable={false}
              onValueChange={setChangeType}
            />
          </FormRow>
          <FormRow label="选择备货单" required>
            <div className="flex items-center gap-3">
              <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline">
                PL2606040004
              </button>
              <Button variant="secondary" size="sm">选择备货单</Button>
            </div>
          </FormRow>
          <div className="md:col-span-2 xl:col-span-3">
            <FormRow label="备注">
              <div>
                <Textarea
                  className="min-h-[72px]"
                  maxLength={500}
                  value={remark}
                  placeholder="请输入备注"
                  onChange={(event) => setRemark(event.target.value)}
                />
                <div className="mt-1 text-right text-mini text-text-muted">{remark.length} / 500</div>
              </div>
            </FormRow>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>变更明细</SectionTitle>
        <ExclusiveFilterGroup>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-small text-text-muted">SKU</span>
              <div className="w-[220px]">
                <ExactBatchSearch
                  title="批量搜索 SKU"
                  placeholder="请输入SKU"
                  batchPlaceholder="批量搜索"
                  value={draftSkuKeyword}
                  batchValues={draftSkuBatch}
                  onValueChange={setDraftSkuKeyword}
                  onBatchChange={setDraftSkuBatch}
                  validateValues={(values) => (values.length > 200 ? "最多支持 200 行" : null)}
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleSearch}>
                查询
              </Button>
              <Button variant="secondary" size="sm" onClick={handleReset}>
                重置
              </Button>
            </div>
          </div>
        </ExclusiveFilterGroup>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>备货单号</th>
                <th className={tableHeadCell}>SKU</th>
                <th className={tableHeadCell}>备货数量</th>
                <th className={tableHeadCell}>备注</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {filteredLines.map((line) => (
                <tr key={line.id}>
                  <td className="whitespace-nowrap px-3 py-3">{line.stockupNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{line.sku}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <Input className="w-[180px]" value={line.qty} readOnly />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{line.remark}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button type="button" className="mr-3 border-0 bg-transparent p-0 text-primary hover:underline">
                      移除
                    </button>
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline">
                      复制
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-text-muted">
                    暂无匹配的 SKU 明细
                  </td>
                </tr>
              ) : null}
              <tr className="bg-bg-page font-medium">
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-text-secondary">合计</td>
                <td className="px-3 py-3">{totalQty}</td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center gap-3 border-t border-border bg-white px-6 py-3 shadow-lg">
        <Button variant="secondary" size="sm">取消</Button>
        <Button variant="secondary" size="sm">保存</Button>
        <Button variant="primary" size="sm">提交</Button>
      </div>
    </div>
  );
}
