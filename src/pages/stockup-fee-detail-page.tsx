import { useEffect, useMemo, useState } from "react";
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
  feeCurrencyToCnyRate,
  getProviderCurrency,
  getProviderFeeTypes,
  getProviderServiceLinks,
  getTransportSchemesByChannel,
  type ChannelTransportScheme,
  type FeeDetailRow,
} from "../data/logistics-transport-schemes";

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";
const feeCurrencySelectOptions = feeCurrencyOptions.map((value) => ({ label: value, value }));

function parseFeeAmount(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatFeeCnyTotal(
  rows: FeeDetailRow[],
  amountField: "estimatedAmount" | "actualAmount",
  currencyField: "estimatedCurrency" | "actualCurrency",
) {
  const total = rows.reduce((sum, row) => {
    const currency = row[currencyField] || "CNY";
    return sum + parseFeeAmount(row[amountField]) * (feeCurrencyToCnyRate[currency] ?? 1);
  }, 0);

  return `${total.toFixed(2)} CNY`;
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

  function copyEstimatedToActual() {
    setFeeRows((current) =>
      current.map((row) => ({
        ...row,
        actualAmount: row.estimatedAmount,
        actualCurrency: row.estimatedCurrency,
      })),
    );
  }

  return (
    <Card>
      <div className="flex justify-end">
        <Button variant="primary" size="sm" onClick={addFeeRow} disabled={!activeScheme}>
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
          <table className="w-full min-w-[960px] table-fixed border-collapse text-left text-small">
            <colgroup>
              <col className="w-14" />
              <col className="w-[24%]" />
              <col className="w-[18%]" />
              <col className="w-[24%]" />
              <col className="w-[24%]" />
              <col className="w-16" />
            </colgroup>
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>序号</th>
                <th className={tableHeadCell}>物流商</th>
                <th className={tableHeadCell}>费用类型</th>
                <th className={tableHeadCell}>预估费用</th>
                <th className={tableHeadCell}>
                  <div className="flex items-center gap-2">
                    <span>实际费用</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 shrink-0 px-2 text-mini"
                      disabled={feeRows.length === 0}
                      onClick={copyEstimatedToActual}
                    >
                      引用预估
                    </Button>
                  </div>
                </th>
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
                <td className="px-3 py-3 text-right" colSpan={3}>
                  费用总计（折合人民币）
                </td>
                <td className="px-3 py-3 tabular-nums text-text-primary">
                  {formatFeeCnyTotal(feeRows, "estimatedAmount", "estimatedCurrency")}
                </td>
                <td className="px-3 py-3 tabular-nums text-text-primary">
                  {formatFeeCnyTotal(feeRows, "actualAmount", "actualCurrency")}
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
