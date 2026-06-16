import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { cn } from "../lib/cn";
import {
  buildFeeDetailRowsFromScheme,
  feeCurrencyOptions,
  feeCurrencySelectClassName,
  feeCurrencySelectMenuMinWidth,
  formatFeeCurrencyTotals,
  getProviderCurrency,
  getProviderFeeTypes,
  getProviderServiceLinks,
  getSchemeServiceLinkOptions,
  getTransportSchemesByChannel,
  logisticsChannelOptions,
  type ChannelTransportScheme,
  type FeeDetailRow,
} from "../data/logistics-transport-schemes";

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";
const feeCurrencySelectOptions = feeCurrencyOptions.map((value) => ({ label: value, value }));

function ServiceLinkMultiSelect({
  value,
  options,
  disabled,
  onChange,
}: {
  value: string[];
  options: string[];
  disabled?: boolean;
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = value.length === 0 ? "请选择服务环节" : value.join("、");

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        className="field-control flex w-full min-w-0 items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:text-text-disabled"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`min-w-0 flex-1 truncate ${value.length ? "text-text-primary" : "text-text-placeholder"}`}>
          {label}
        </span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-text-muted ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-20 cursor-default border-0 bg-transparent p-0" aria-label="关闭服务环节选择" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+4px)] z-30 max-h-[220px] w-full min-w-[200px] overflow-auto rounded-sm border border-border bg-white p-2 shadow-md">
            {options.map((option) => {
              const checked = value.includes(option);
              return (
                <label key={option} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-small hover:bg-bg-hover">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange(checked ? value.filter((item) => item !== option) : [...value, option])
                    }
                  />
                  <span className="truncate">{option}</span>
                </label>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

function ReadonlyCell({ value }: { value: string }) {
  return (
    <div className="min-h-8 rounded-sm border border-transparent px-2 py-1.5 text-small leading-5 text-text-primary">
      {value || "-"}
    </div>
  );
}

function ReadonlyCurrency({ value }: { value: string }) {
  return (
    <div className={cn("field-control flex shrink-0 items-center justify-center bg-bg-subtle px-2 text-small text-text-primary", feeCurrencySelectClassName)}>
      {value || "-"}
    </div>
  );
}

export function StockupFeeDetailSection() {
  const [channel, setChannel] = useState("美南标快");
  const [schemeId, setSchemeId] = useState("");
  const [feeRows, setFeeRows] = useState<FeeDetailRow[]>([]);

  const transportSchemes = useMemo(() => getTransportSchemesByChannel(channel), [channel]);
  const activeScheme = transportSchemes.find((scheme) => scheme.id === schemeId) ?? transportSchemes[0];
  const schemeOptions = transportSchemes.map((scheme) => ({ label: scheme.schemeName, value: scheme.id }));
  const providerOptions = useMemo(
    () => (activeScheme?.providers ?? []).map((item) => ({ label: item.provider, value: item.provider })),
    [activeScheme],
  );
  const serviceLinkSelectOptions = useMemo(() => getSchemeServiceLinkOptions(activeScheme), [activeScheme]);

  useEffect(() => {
    const firstScheme = transportSchemes[0];
    setSchemeId(firstScheme?.id ?? "");
    setFeeRows(firstScheme ? buildFeeDetailRowsFromScheme(channel, firstScheme) : []);
  }, [channel, transportSchemes]);

  function applyScheme(scheme: ChannelTransportScheme | undefined) {
    setFeeRows(scheme ? buildFeeDetailRowsFromScheme(channel, scheme) : []);
  }

  function handleSchemeChange(nextSchemeId: string) {
    setSchemeId(nextSchemeId);
    applyScheme(transportSchemes.find((item) => item.id === nextSchemeId));
  }

  function updateRow(rowId: string, patch: Partial<FeeDetailRow>) {
    setFeeRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  function addFeeRow() {
    const defaultProvider = activeScheme?.providers[0]?.provider ?? "";
    const defaultCurrency = getProviderCurrency(activeScheme, defaultProvider);
    setFeeRows((current) => [
      ...current,
      {
        id: `fee-custom-${Date.now()}`,
        provider: defaultProvider,
        serviceLinks: [...getProviderServiceLinks(activeScheme, defaultProvider)],
        feeType: getProviderFeeTypes(activeScheme, defaultProvider)[0] ?? "",
        estimatedAmount: "0.00",
        estimatedCurrency: defaultCurrency,
        actualAmount: "0.00",
        actualCurrency: defaultCurrency,
        isCustom: true,
      },
    ]);
  }

  function removeFeeRow(rowId: string) {
    setFeeRows((current) => current.filter((row) => row.id !== rowId || !row.isCustom));
  }

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0 space-y-1.5">
            <div className="text-small text-text-secondary">
              <span className="mr-1 text-danger">*</span>
              物流渠道
            </div>
            <Select value={channel} options={logisticsChannelOptions} clearable={false} onValueChange={setChannel} />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="text-small text-text-secondary">
              <span className="mr-1 text-danger">*</span>
              运输方案
            </div>
            <Select
              value={schemeId || activeScheme?.id || ""}
              placeholder={transportSchemes.length ? "请选择运输方案" : "当前渠道暂无运输方案"}
              options={schemeOptions}
              clearable={false}
              disabled={transportSchemes.length === 0}
              onValueChange={handleSchemeChange}
            />
          </div>
          <div className="flex min-w-0 items-end sm:col-span-2 xl:col-span-1">
            <p className="text-small leading-6 text-text-muted">
              选定方案后自动带出物流商、服务环节与费用类型；系统行币种随报价方案中的物流商带出且不可修改，仅可维护费用金额。
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" className="shrink-0" onClick={addFeeRow} disabled={!activeScheme}>
          新增
        </Button>
      </div>

      {!channel ? (
        <div className="mt-4 rounded-sm border border-warning bg-warning/10 px-3 py-2 text-small text-warning">
          请选择物流渠道。
        </div>
      ) : transportSchemes.length === 0 ? (
        <div className="mt-4 rounded-sm border border-warning bg-warning/10 px-3 py-2 text-small text-warning">
          当前物流渠道暂未配置运输方案，请先在物流渠道页面维护运输方案。
        </div>
      ) : (
        <div className="mt-4 -mx-px overflow-x-auto">
          <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-small">
            <colgroup>
              <col className="w-14" />
              <col className="w-[20%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-16" />
            </colgroup>
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>序号</th>
                <th className={tableHeadCell}>物流商</th>
                <th className={tableHeadCell}>服务环节</th>
                <th className={tableHeadCell}>费用类型</th>
                <th className={tableHeadCell}>预估费用</th>
                <th className={tableHeadCell}>实际费用</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {feeRows.map((row, index) => {
                const feeTypeOptions = getProviderFeeTypes(activeScheme, row.provider).map((feeType) => ({
                  label: feeType,
                  value: feeType,
                }));

                return (
                  <tr key={row.id}>
                    <td className="px-3 py-3 align-top">{index + 1}</td>
                    <td className="px-3 py-3 align-top">
                      {row.isCustom ? (
                        <Select
                          value={row.provider}
                          placeholder="请选择物流商"
                          options={providerOptions}
                          clearable={false}
                          onValueChange={(value) =>
                            updateRow(row.id, {
                              provider: value,
                              serviceLinks: [...getProviderServiceLinks(activeScheme, value)],
                              feeType: getProviderFeeTypes(activeScheme, value)[0] ?? "",
                              estimatedCurrency: getProviderCurrency(activeScheme, value),
                              actualCurrency: getProviderCurrency(activeScheme, value),
                            })
                          }
                        />
                      ) : (
                        <ReadonlyCell value={row.provider} />
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {row.isCustom ? (
                        <ServiceLinkMultiSelect
                          value={row.serviceLinks}
                          options={serviceLinkSelectOptions}
                          onChange={(value) => updateRow(row.id, { serviceLinks: value })}
                        />
                      ) : (
                        <ReadonlyCell value={row.serviceLinks.join("、")} />
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {row.isCustom ? (
                        <Select
                          value={row.feeType}
                          placeholder="请选择费用类型"
                          options={feeTypeOptions}
                          clearable={false}
                          onValueChange={(value) => updateRow(row.id, { feeType: value })}
                        />
                      ) : (
                        <ReadonlyCell value={row.feeType} />
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex min-w-0 items-center gap-2">
                        <Input
                          className="min-w-0 flex-1"
                          value={row.estimatedAmount}
                          onChange={(event) => updateRow(row.id, { estimatedAmount: event.target.value })}
                        />
                        {row.isCustom ? (
                          <Select
                            className={cn(feeCurrencySelectClassName, "shrink-0")}
                            menuMinWidth={feeCurrencySelectMenuMinWidth}
                            value={row.estimatedCurrency}
                            options={feeCurrencySelectOptions}
                            clearable={false}
                            onValueChange={(value) => updateRow(row.id, { estimatedCurrency: value })}
                          />
                        ) : (
                          <ReadonlyCurrency value={row.estimatedCurrency} />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex min-w-0 items-center gap-2">
                        <Input
                          className="min-w-0 flex-1"
                          value={row.actualAmount}
                          onChange={(event) => updateRow(row.id, { actualAmount: event.target.value })}
                        />
                        {row.isCustom ? (
                          <Select
                            className={cn(feeCurrencySelectClassName, "shrink-0")}
                            menuMinWidth={feeCurrencySelectMenuMinWidth}
                            value={row.actualCurrency}
                            options={feeCurrencySelectOptions}
                            clearable={false}
                            onValueChange={(value) => updateRow(row.id, { actualCurrency: value })}
                          />
                        ) : (
                          <ReadonlyCurrency value={row.actualCurrency} />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      {row.isCustom ? (
                        <button
                          type="button"
                          className="border-0 bg-transparent p-0 text-primary hover:underline"
                          onClick={() => removeFeeRow(row.id)}
                        >
                          删除
                        </button>
                      ) : (
                        <span className="text-text-placeholder">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-bg-page/60 font-medium">
                <td className="px-3 py-3 text-right" colSpan={4}>
                  费用总计
                </td>
                <td className="px-3 py-3 tabular-nums text-text-primary">
                  {formatFeeCurrencyTotals(feeRows, "estimatedAmount", "estimatedCurrency")}
                </td>
                <td className="px-3 py-3 tabular-nums text-text-primary">
                  {formatFeeCurrencyTotals(feeRows, "actualAmount", "actualCurrency")}
                </td>
                <td className="px-3 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
