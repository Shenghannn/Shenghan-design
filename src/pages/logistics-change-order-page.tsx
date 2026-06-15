import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
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

function parseSkuFilters(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function LogisticsChangeOrderPage() {
  const [changeType, setChangeType] = useState("stockup-change");
  const [remark, setRemark] = useState("");
  const [skuFilterOpen, setSkuFilterOpen] = useState(false);
  const [skuFilterDraft, setSkuFilterDraft] = useState("");
  const [skuFilters, setSkuFilters] = useState<string[]>([]);
  const skuFilterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const skuFilterPanelRef = useRef<HTMLDivElement | null>(null);
  const [skuFilterPanelStyle, setSkuFilterPanelStyle] = useState<CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    opacity: 0,
    pointerEvents: "none",
  });

  const filteredLines = useMemo(() => {
    if (skuFilters.length === 0) {
      return changeOrderLines;
    }
    const normalizedFilters = new Set(skuFilters.map((item) => item.toLowerCase()));
    return changeOrderLines.filter((line) => normalizedFilters.has(line.sku.toLowerCase()));
  }, [skuFilters]);

  const totalQty = filteredLines.reduce((sum, line) => sum + line.qty, 0);
  const draftSkuFilters = useMemo(() => parseSkuFilters(skuFilterDraft), [skuFilterDraft]);

  function applySkuFilter() {
    if (draftSkuFilters.length === 0) {
      return;
    }
    setSkuFilters(draftSkuFilters);
  }

  function cancelSkuFilter() {
    setSkuFilterDraft("");
    setSkuFilters([]);
    setSkuFilterOpen(false);
  }

  function clearSkuFilter() {
    setSkuFilterDraft("");
    setSkuFilters([]);
    setSkuFilterOpen(false);
  }

  useLayoutEffect(() => {
    if (!skuFilterOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!skuFilterTriggerRef.current?.contains(target) && !skuFilterPanelRef.current?.contains(target)) {
        cancelSkuFilter();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [skuFilterOpen, skuFilterDraft]);

  useEffect(() => {
    if (!skuFilterOpen) {
      return;
    }

    function updatePanelPosition() {
      const trigger = skuFilterTriggerRef.current;
      if (!trigger) {
        return;
      }
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 8;
      const panelOffset = 6;
      const panelWidth = 280;
      const estimatedHeight = skuFilterPanelRef.current?.offsetHeight ?? 212;
      const maxLeft = Math.max(viewportPadding, window.innerWidth - viewportPadding - panelWidth);
      const left = Math.min(Math.max(rect.left, viewportPadding), maxLeft);
      const top = Math.max(viewportPadding, rect.top - panelOffset - estimatedHeight);

      setSkuFilterPanelStyle({
        position: "fixed",
        top,
        left,
        width: panelWidth,
        zIndex: 90,
        opacity: 1,
        pointerEvents: "auto",
      });
    }

    updatePanelPosition();
    const frameId = window.requestAnimationFrame(updatePanelPosition);
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [skuFilterOpen]);

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>变更明细</SectionTitle>
          {skuFilters.length > 0 ? (
            <div className="flex items-center gap-2 text-small text-text-muted">
              <span>
                当前筛选：已选择 <span className="font-medium text-primary">{skuFilters.length}</span> 个 SKU
              </span>
              <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={clearSkuFilter}>
                取消筛选
              </button>
            </div>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>备货单号</th>
                <th className={tableHeadCell}>
                  <div className="relative inline-flex items-center gap-1">
                    <span>SKU</span>
                    <button
                      ref={skuFilterTriggerRef}
                      type="button"
                      aria-label="筛选 SKU"
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-sm border-0 bg-transparent p-0 hover:bg-bg-hover ${
                        skuFilters.length > 0 ? "text-primary" : "text-text-muted"
                      }`}
                      onClick={() => {
                        if (skuFilterOpen) {
                          cancelSkuFilter();
                          return;
                        }
                        setSkuFilterDraft(skuFilters.join("\n"));
                        setSkuFilterOpen(true);
                      }}
                    >
                      <Search aria-hidden="true" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
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
        {skuFilterOpen && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={skuFilterPanelRef}
                style={skuFilterPanelStyle}
                className="rounded-sm border border-border bg-white p-2 shadow-md"
              >
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
                  <div className="font-medium text-text-primary">批量筛选 SKU</div>
                  <button
                    type="button"
                    aria-label="关闭 SKU 筛选"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-text-muted hover:border-primary hover:text-primary"
                            onClick={cancelSkuFilter}
                  >
                    <X aria-hidden="true" className="h-3 w-3" />
                  </button>
                </div>
                <div>
                  <Textarea
                    autoFocus
                    className="min-h-[120px]"
                    value={skuFilterDraft}
                            placeholder="一行一个SKU"
                    onChange={(event) => setSkuFilterDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") {
                                cancelSkuFilter();
                      }
                    }}
                  />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button className="min-w-[64px]" variant="secondary" size="sm" onClick={cancelSkuFilter}>取消</Button>
                  <Button className="min-w-[64px]" variant="primary" size="sm" disabled={draftSkuFilters.length === 0} onClick={applySkuFilter}>确认</Button>
                </div>
              </div>,
              document.body,
            )
          : null}
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center gap-3 border-t border-border bg-white px-6 py-3 shadow-lg">
        <Button variant="secondary" size="sm">取消</Button>
        <Button variant="secondary" size="sm">保存</Button>
        <Button variant="primary" size="sm">提交</Button>
      </div>
    </div>
  );
}
