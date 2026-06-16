import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  paymentPoolRecords as initialPaymentPoolRecords,
  poolRecordToPlanGroup,
  type PaymentPoolRecord,
  validateFirstTripPaymentRequest,
} from "../data/payment-pool";
import { ListPageMainCard, ListPageToolbar } from "../components/ui/list-page-layout";
import { DateRangePicker, type DateRangeValue } from "../components/ui/date-range-picker";
import { ExclusiveFilterGroup, useExclusiveFilterPanel } from "../components/ui/exclusive-filter-group";
import { Modal } from "../components/ui/modal";
import { MultiSelectFilter } from "../components/ui/multi-select-filter";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { Tabs } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";

const tableHeadCell = "whitespace-nowrap px-3 py-3 text-left text-small font-medium";
const pageSizeOptions = [10, 20, 30, 50, 100];
const statusTabs = [
  { label: "全部", value: "" },
  { label: "未付清", value: "未付清" },
  { label: "已付清", value: "已付清" },
] as const;

const providerOptions = ["义乌风驰国际物流", "宁波安达供应链", "深圳海翼物流", "浙江融盛国际物流有限公司"];
const warehouseOptions = ["测试仓库101", "FBA-ONT8", "FBA-YYZ4", "Walmart仓", "宁波保税仓"];
const channelOptions = ["美南标快", "美西海派", "欧洲快线", "加拿大卡派", "美东快递"];

const amountFields: Array<keyof PaymentPoolRecord> = [
  "feeAmount",
  "payableAmount",
  "discountAmount",
  "amountPaid",
  "amountNotPaid",
  "applyingAmount",
  "notApplyAmount",
];

function emptyRange(): DateRangeValue {
  return { start: "", end: "" };
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

function parseBatchValues(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function isAlphaNumericList(values: string[]) {
  return values.every((item) => /^[A-Za-z0-9]+$/.test(item));
}

function formatAmount(value: number) {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sumAmount(records: PaymentPoolRecord[], field: keyof PaymentPoolRecord) {
  return records.reduce((sum, record) => sum + Number(record[field] ?? 0), 0);
}

function statusTone(status: PaymentPoolRecord["status"]) {
  return status === "已付清" ? "success" : "processing";
}

function BatchExactSearch({
  title,
  placeholder,
  values,
  onChange,
}: {
  title: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { open, setOpen } = useExclusiveFilterPanel(panelId);
  const [draft, setDraft] = useState(values.join("\n"));
  const parsedValues = parseBatchValues(draft);
  const invalid = parsedValues.length > 0 && !isAlphaNumericList(parsedValues);
  const overLimit = parsedValues.length > 200;
  const canConfirm = parsedValues.length > 0 && !invalid && !overLimit;

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeAndResetDraft();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function closeAndResetDraft() {
    setDraft(values.join("\n"));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="field-control flex w-[190px] items-center justify-between gap-2 text-left"
        onClick={() => {
          setDraft(values.join("\n"));
          setOpen(true);
        }}
      >
        <span className={values.length ? "truncate text-text-primary" : "truncate text-text-placeholder"}>
          {values.length ? `已选择 ${values.length} 项` : placeholder}
        </span>
        <Search aria-hidden="true" className={values.length ? "h-4 w-4 text-primary" : "h-4 w-4 text-text-muted"} />
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[300px] rounded-sm border border-border bg-white p-2 shadow-md">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
            <div className="font-medium text-text-primary">{title}</div>
            <button
              type="button"
              aria-label="关闭批量搜索"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-text-muted hover:border-primary hover:text-primary"
              onClick={closeAndResetDraft}
            >
              ×
            </button>
          </div>
          <Textarea
            className="min-h-[140px]"
            value={draft}
            placeholder="一项一行"
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="mt-1 text-mini text-text-muted">最多支持 200 行，精确匹配英文+数字。</div>
          {invalid ? <div className="mt-1 text-mini text-danger">仅支持英文和数字。</div> : null}
          {overLimit ? <div className="mt-1 text-mini text-danger">最多支持 200 行。</div> : null}
          <div className="mt-3 flex justify-end gap-2">
            <Button className="min-w-[64px]" variant="secondary" size="sm" onClick={closeAndResetDraft}>取消</Button>
            {values.length > 0 ? (
              <Button
                className="min-w-[64px]"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setDraft("");
                  onChange([]);
                  setOpen(false);
                }}
              >
                清空
              </Button>
            ) : null}
            <Button className="min-w-[64px]" variant="primary" size="sm" disabled={!canConfirm} onClick={() => {
              if (!canConfirm) {
                return;
              }
              onChange(parsedValues);
              setOpen(false);
            }}>确认</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AmountCell({ value }: { value: number }) {
  return <span className="font-tabular-nums">¥{formatAmount(value)}</span>;
}

function PaymentPoolFeeDetailModal({
  record,
  onClose,
}: {
  record: PaymentPoolRecord | null;
  onClose: () => void;
}) {
  const planGroup = useMemo(() => (record ? poolRecordToPlanGroup(record) : null), [record]);

  if (!record || !planGroup) {
    return null;
  }

  return (
    <Modal open title={`费用明细 - ${record.logisticsPlanNo}`} widthClassName="w-[980px]" onClose={onClose}>
      <div className="mb-4 grid gap-x-8 gap-y-2 rounded-sm border border-border bg-bg-page px-4 py-3 text-small md:grid-cols-2">
        <div><span className="text-text-secondary">物流商：</span>{record.logisticsProvider}</div>
        <div><span className="text-text-secondary">物流渠道：</span>{record.logisticsChannel}</div>
        <div><span className="text-text-secondary">物流商单号：</span>{record.logisticsBillNo}</div>
        <div><span className="text-text-secondary">费用金额：</span><AmountCell value={record.feeAmount} /></div>
        <div><span className="text-text-secondary">应付金额：</span><AmountCell value={record.payableAmount} /></div>
        <div><span className="text-text-secondary">折扣金额：</span><AmountCell value={record.discountAmount} /></div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-small">
          <thead className="bg-bg-page text-text-muted">
            <tr>
              <th className={tableHeadCell}>序号</th>
              <th className={tableHeadCell}>服务环节</th>
              <th className={tableHeadCell}>费用类型</th>
              <th className={`${tableHeadCell} text-right`}>费用金额</th>
              <th className={`${tableHeadCell} text-right`}>应付金额</th>
              <th className={`${tableHeadCell} text-right`}>已付金额</th>
              <th className={`${tableHeadCell} text-right`}>申请中</th>
              <th className={`${tableHeadCell} text-right`}>未申请</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white">
            {planGroup.serviceLinks.flatMap((link, linkIndex) => {
              const linkSerial = linkIndex + 1;
              return [
                <tr key={link.id} className="bg-[#fafbfd] font-medium">
                  <td className="px-3 py-3">{linkSerial}</td>
                  <td className="whitespace-nowrap px-3 py-3">{link.serviceLinkName}</td>
                  <td className="px-3 py-3" />
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={link.feeAmount} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={link.payableAmount} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={link.paidAmount} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={link.applyingAmount} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={link.notApplyAmount} /></td>
                </tr>,
                ...link.feeDetails.map((detail) => (
                  <tr key={detail.id}>
                    <td className="px-3 py-3" />
                    <td className="px-3 py-3" />
                    <td className="whitespace-nowrap px-3 py-3 pl-6 before:mr-2 before:text-text-disabled before:content-['└']">
                      {detail.feeTypeName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={detail.feeAmount} /></td>
                    <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={detail.payableAmount} /></td>
                    <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={detail.paidAmount} /></td>
                    <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={detail.applyingAmount} /></td>
                    <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={detail.notApplyAmount} /></td>
                  </tr>
                )),
              ];
            })}
            <tr className="bg-bg-page font-medium">
              <td className="px-3 py-3" colSpan={3}>合计</td>
              <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.feeAmount} /></td>
              <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.payableAmount} /></td>
              <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.amountPaid} /></td>
              <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.applyingAmount} /></td>
              <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.notApplyAmount} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>关闭</Button>
      </div>
    </Modal>
  );
}

function SummaryRow({
  records,
  selectedIds,
  colSpanBeforeAmounts,
}: {
  records: PaymentPoolRecord[];
  selectedIds: string[];
  colSpanBeforeAmounts: number;
}) {
  const summaryRecords =
    selectedIds.length > 0 ? records.filter((record) => selectedIds.includes(record.id)) : records;
  const label = selectedIds.length > 0 ? "已勾选" : "合计";

  return (
    <tr className="bg-bg-page font-medium">
      <td className="px-3 py-3" colSpan={colSpanBeforeAmounts}>
        {label}
      </td>
      {amountFields.map((field) => (
        <td key={field} className="whitespace-nowrap px-3 py-3 text-right">
          <AmountCell value={sumAmount(summaryRecords, field)} />
        </td>
      ))}
      <td className="px-3 py-3" colSpan={6} />
    </tr>
  );
}

function PaymentPoolListPage({
  records,
  onCreatePaymentRequest,
  onContinuePay,
  onEndPay,
}: {
  records: PaymentPoolRecord[];
  onCreatePaymentRequest: (poolIds: string[]) => void;
  onContinuePay: (record: PaymentPoolRecord) => void;
  onEndPay: (records: PaymentPoolRecord[]) => void;
}) {
  const [statusTab, setStatusTab] = useState<(typeof statusTabs)[number]["value"]>("");
  const [providers, setProviders] = useState<string[]>([]);
  const [sendWarehouses, setSendWarehouses] = useState<string[]>([]);
  const [receiveWarehouses, setReceiveWarehouses] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [timeType, setTimeType] = useState<"entryTime" | "shipTime">("entryTime");
  const [timeRange, setTimeRange] = useState<DateRangeValue>(emptyRange());
  const [logisticsBillNos, setLogisticsBillNos] = useState<string[]>([]);
  const [logisticsPlanNos, setLogisticsPlanNos] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailRecord, setDetailRecord] = useState<PaymentPoolRecord | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesStatus = !statusTab || record.status === statusTab;
      const matchesProvider = providers.length === 0 || providers.includes(record.logisticsProvider);
      const matchesSend = sendWarehouses.length === 0 || sendWarehouses.includes(record.sendWarehouse);
      const matchesReceive = receiveWarehouses.length === 0 || receiveWarehouses.includes(record.receiveWarehouse);
      const matchesChannel = channels.length === 0 || channels.includes(record.logisticsChannel);
      const timeValue = timeType === "shipTime" ? record.shipTime : record.entryTime;
      const matchesTime = inDateRange(timeValue, timeRange);
      const matchesBillNo = logisticsBillNos.length === 0 || logisticsBillNos.includes(record.logisticsBillNo);
      const matchesPlanNo = logisticsPlanNos.length === 0 || logisticsPlanNos.includes(record.logisticsPlanNo);
      return (
        matchesStatus &&
        matchesProvider &&
        matchesSend &&
        matchesReceive &&
        matchesChannel &&
        matchesTime &&
        matchesBillNo &&
        matchesPlanNo
      );
    });
  }, [channels, logisticsBillNos, logisticsPlanNos, providers, receiveWarehouses, records, sendWarehouses, statusTab, timeRange, timeType]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allPageSelected = pagedRecords.length > 0 && pagedRecords.every((record) => selectedIds.includes(record.id));

  function resetFilters() {
    setProviders([]);
    setSendWarehouses([]);
    setReceiveWarehouses([]);
    setChannels([]);
    setTimeType("entryTime");
    setTimeRange(emptyRange());
    setLogisticsBillNos([]);
    setLogisticsPlanNos([]);
    setPage(1);
  }

  function toggleAllCurrentPage(checked: boolean) {
    if (!checked) {
      setSelectedIds((current) => current.filter((id) => !pagedRecords.some((record) => record.id === id)));
      return;
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...pagedRecords.map((record) => record.id)])));
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  }

  function handleBatchPay() {
    const validation = validateFirstTripPaymentRequest(selectedIds);
    if (!validation.ok) {
      window.alert(validation.message);
      return;
    }
    onCreatePaymentRequest(selectedIds);
  }

  function handlePay(record: PaymentPoolRecord) {
    const validation = validateFirstTripPaymentRequest([record.id]);
    if (!validation.ok) {
      window.alert(validation.message);
      return;
    }
    onCreatePaymentRequest([record.id]);
  }

  function handleBatchEndPay() {
    if (selectedIds.length === 0) {
      window.alert("请先勾选单据！");
      return;
    }
    const selectedRecords = records.filter((record) => selectedIds.includes(record.id));
    const invalidRows = selectedRecords.filter((record) => record.operationActionType !== 3);
    if (invalidRows.length > 0) {
      window.alert("请选择可结束请款的单据！");
      return;
    }
    if (!window.confirm("确定要结束请款吗？")) {
      return;
    }
    onEndPay(selectedRecords);
    setSelectedIds([]);
  }

  function handleEndPay(record: PaymentPoolRecord) {
    if (!window.confirm("确定要结束请款吗？")) {
      return;
    }
    onEndPay([record]);
  }

  function handleContinuePay(record: PaymentPoolRecord) {
    if (!window.confirm("确认后，单据将回退为待申请状态，您可以继续进行请款")) {
      return;
    }
    onContinuePay(record);
  }

  return (
    <ListPageMainCard>
      <div className="px-4 pt-3">
        <Tabs
          items={[...statusTabs]}
          value={statusTab}
          onChange={(value) => {
            setStatusTab(value);
            setPage(1);
          }}
        />
      </div>

      <div className="border-t border-border px-4 py-3">
        <ExclusiveFilterGroup>
        <div className="flex flex-wrap items-center gap-3">
          <MultiSelectFilter placeholder="物流商" options={providerOptions} value={providers} onChange={(value) => { setProviders(value); setPage(1); }} />
          <MultiSelectFilter placeholder="发货仓库" options={warehouseOptions} value={sendWarehouses} onChange={(value) => { setSendWarehouses(value); setPage(1); }} />
          <MultiSelectFilter placeholder="收货仓库" options={warehouseOptions} value={receiveWarehouses} onChange={(value) => { setReceiveWarehouses(value); setPage(1); }} />
          <MultiSelectFilter placeholder="物流渠道" options={channelOptions} value={channels} onChange={(value) => { setChannels(value); setPage(1); }} />
          <Select
            className="w-[128px]"
            value={timeType}
            clearable={false}
            onValueChange={(value) => setTimeType(value as "entryTime" | "shipTime")}
            options={[
              { label: "录入时间", value: "entryTime" },
              { label: "发货时间", value: "shipTime" },
            ]}
          />
          <DateRangePicker value={timeRange} onChange={(value) => { setTimeRange(value); setPage(1); }} />
          <BatchExactSearch title="批量搜索物流商单号" placeholder="物流商单号" values={logisticsBillNos} onChange={(value) => { setLogisticsBillNos(value); setPage(1); }} />
          <BatchExactSearch title="批量搜索物流计划单号" placeholder="物流计划单号" values={logisticsPlanNos} onChange={(value) => { setLogisticsPlanNos(value); setPage(1); }} />
          <Button variant="primary" size="sm">查询</Button>
          <Button variant="secondary" size="sm" onClick={resetFilters}>重置</Button>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="secondary" size="sm">导出</Button>
          </div>
        </div>
        </ExclusiveFilterGroup>
      </div>

      <ListPageToolbar>
        <div className="list-toolbar-group">
          <Button variant="primary" size="sm" onClick={handleBatchPay}>请款</Button>
          <Button variant="secondary" size="sm" onClick={handleBatchEndPay}>结束请款</Button>
        </div>
      </ListPageToolbar>

      <div className="overflow-x-auto">
          <table className="w-full min-w-[3200px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>
                  <Checkbox checked={allPageSelected} onChange={(event) => toggleAllCurrentPage(event.target.checked)} />
                </th>
                <th className={tableHeadCell}>状态</th>
                <th className={tableHeadCell}>物流商</th>
                <th className={tableHeadCell}>物流计划单号</th>
                <th className={tableHeadCell}>FBA货件号</th>
                <th className={tableHeadCell}>物流商单号</th>
                <th className={tableHeadCell}>发货时间</th>
                <th className={tableHeadCell}>收货仓库</th>
                <th className={tableHeadCell}>发货仓库</th>
                <th className={tableHeadCell}>物流渠道</th>
                <th className={`${tableHeadCell} text-right`}>费用金额</th>
                <th className={`${tableHeadCell} text-right`}>应付金额</th>
                <th className={`${tableHeadCell} text-right`}>折扣金额</th>
                <th className={`${tableHeadCell} text-right`}>已付金额</th>
                <th className={`${tableHeadCell} text-right`}>未付金额</th>
                <th className={`${tableHeadCell} text-right`}>申请中</th>
                <th className={`${tableHeadCell} text-right`}>未申请</th>
                <th className={tableHeadCell}>费用录入人</th>
                <th className={tableHeadCell}>录入时间</th>
                <th className={tableHeadCell}>付清时间</th>
                <th className={tableHeadCell}>操作人</th>
                <th className={tableHeadCell}>付清说明</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-3 py-3">
                    <Checkbox checked={selectedIds.includes(record.id)} onChange={(event) => toggleRow(record.id, event.target.checked)} />
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={statusTone(record.status)}>{record.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsProvider}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline">{record.logisticsPlanNo}</button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.fbaShipmentNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsBillNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.shipTime}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.receiveWarehouse}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.sendWarehouse}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsChannel}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <AmountCell value={record.feeAmount} />
                      <button
                        type="button"
                        className="border-0 bg-transparent p-0 text-primary hover:underline"
                        onClick={() => setDetailRecord(record)}
                      >
                        明细
                      </button>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.payableAmount} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.discountAmount} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.amountPaid} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.amountNotPaid} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.applyingAmount} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.notApplyAmount} /></td>
                  <td className="whitespace-nowrap px-3 py-3">{record.feeInputUser}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.entryTime}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.finishPayTime || "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.operator || "-"}</td>
                  <td className="max-w-[160px] truncate px-3 py-3" title={record.finishPayRemark}>{record.finishPayRemark || "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {record.operationActionType === 2 ? (
                      <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => handleContinuePay(record)}>
                        继续请款
                      </button>
                    ) : record.operationActionType === 3 ? (
                      <>
                        <button type="button" className="mr-3 border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => handlePay(record)}>
                          请款
                        </button>
                        <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => handleEndPay(record)}>
                          结束请款
                        </button>
                      </>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={23} className="px-3 py-10 text-center text-text-muted">暂无数据</td>
                </tr>
              ) : (
                <SummaryRow records={pagedRecords} selectedIds={selectedIds} colSpanBeforeAmounts={10} />
              )}
            </tbody>
          </table>
        </div>

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalCount={filteredRecords.length}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        showTopBorder
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <PaymentPoolFeeDetailModal record={detailRecord} onClose={() => setDetailRecord(null)} />
    </ListPageMainCard>
  );
}

export function PaymentPoolPage({
  onCreatePaymentRequest,
}: {
  onCreatePaymentRequest?: (poolIds: string[]) => void;
}) {
  const [records, setRecords] = useState<PaymentPoolRecord[]>(() =>
    initialPaymentPoolRecords.map((record) => ({ ...record })),
  );

  function handleContinuePay(record: PaymentPoolRecord) {
    setRecords((current) =>
      current.map((item) =>
        item.id === record.id
          ? {
              ...item,
              operationActionType: 3,
              notApplyAmount: Math.max(item.payableAmount - item.amountPaid - item.applyingAmount, 800),
              finishPayRemark: "",
              operator: "",
            }
          : item,
      ),
    );
    window.alert("操作成功");
  }

  function handleEndPay(targetRecords: PaymentPoolRecord[]) {
    const targetIds = new Set(targetRecords.map((record) => record.id));
    setRecords((current) =>
      current.map((item) =>
        targetIds.has(item.id)
          ? {
              ...item,
              operationActionType: 2 as const,
              finishPayRemark: item.finishPayRemark || "已结束请款",
              operator: item.operator || "超级管理员",
              finishPayTime: item.finishPayTime || new Date().toISOString().slice(0, 19).replace("T", " "),
            }
          : item,
      ),
    );
    window.alert("结束请款成功");
  }

  return (
    <PaymentPoolListPage
      records={records}
      onCreatePaymentRequest={(poolIds) => onCreatePaymentRequest?.(poolIds)}
      onContinuePay={handleContinuePay}
      onEndPay={handleEndPay}
    />
  );
}
