import { useId, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { ListPageMainCard, ListPageToolbar } from "../components/ui/list-page-layout";
import { DateRangePicker, type DateRangeValue } from "../components/ui/date-range-picker";
import { ExclusiveFilterGroup, useExclusiveFilterPanel } from "../components/ui/exclusive-filter-group";
import { Input } from "../components/ui/input";
import { MultiSelectFilter } from "../components/ui/multi-select-filter";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { Tabs } from "../components/ui/tabs";
import {
  LogisticsPaymentRequestDetailPage,
  LogisticsPaymentRequestEditPage,
} from "./payment-request-logistics-page";

export type PaymentRequestStatus = "待审批" | "待付款" | "待提交" | "已完成" | "已驳回" | "已作废";

export type PaymentRequestRecord = {
  id: string;
  reqFundsOrderSn: string;
  relatedOrderSn: string;
  payer: string;
  status: PaymentRequestStatus;
  expenseType: string;
  objectType: string;
  objectName: string;
  settlementMethod: string;
  settlementPeriodDays: number;
  tradeMethod: string;
  paymentType: string;
  amountTotal: number;
  amountPaid: number;
  amountUnpaid: number;
  prepayTime: string;
  applicant: string;
  remark: string;
  applyTime: string;
  realPayTime: string;
  payUserName: string;
  payRemark: string;
  accountHolderName: string;
};

const tableHeadCell = "whitespace-nowrap px-3 py-3 text-left text-small font-medium";
const pageSizeOptions = [10, 20, 30, 50, 100];

const statusTabs = [
  { label: "全部", value: "" },
  { label: "待审批", value: "待审批" },
  { label: "待付款", value: "待付款" },
  { label: "待提交", value: "待提交" },
  { label: "已完成", value: "已完成" },
  { label: "已驳回", value: "已驳回" },
  { label: "已作废", value: "已作废" },
] as const;

const expenseTypeOptions = ["采购货款", "物流款", "采购预付款", "其他应付款"];
const settlementMethodOptions = ["月结货款", "月结预付款", "现结货款"];
const paymentTypeOptions = ["跨境宝2.0", "账期支付", "支付宝", "诚e赊", "网上支付", "网银转账"];
const supplierOptions = ["义乌市双捷国际货运代理有限公司", "浙江融盛国际物流有限公司", "深圳市以达物流有限公司", "宁波安达供应链"];
const approverOptions = ["超级管理员", "兰轩", "周婷婷", "李莎丽"];
const applicantOptions = ["兰轩", "周婷婷", "张晓莹", "李莎丽"];

const paymentRequestRecords: PaymentRequestRecord[] = [
  {
    id: "pr-001",
    reqFundsOrderSn: "QK202604090001",
    relatedOrderSn: "LP260409000001",
    payer: "义乌运营主体",
    status: "待审批",
    expenseType: "物流款",
    objectType: "物流商",
    objectName: "义乌风驰国际物流",
    settlementMethod: "月结货款",
    settlementPeriodDays: 30,
    tradeMethod: "账期支付",
    paymentType: "账期支付",
    amountTotal: 12500,
    amountPaid: 0,
    amountUnpaid: 12500,
    prepayTime: "2026-04-20",
    applicant: "兰轩",
    remark: "头程物流请款",
    applyTime: "2026-04-09 10:20:00",
    realPayTime: "",
    payUserName: "",
    payRemark: "",
    accountHolderName: "义乌风驰国际物流有限公司",
  },
  {
    id: "pr-002",
    reqFundsOrderSn: "QK202604110002",
    relatedOrderSn: "PO20260411001",
    payer: "宁波运营主体",
    status: "待付款",
    expenseType: "采购货款",
    objectType: "供应商",
    objectName: "宁波安达供应链",
    settlementMethod: "月结货款",
    settlementPeriodDays: 45,
    tradeMethod: "网银转账",
    paymentType: "网银转账",
    amountTotal: 86000,
    amountPaid: 0,
    amountUnpaid: 86000,
    prepayTime: "2026-04-25",
    applicant: "周婷婷",
    remark: "4月采购货款",
    applyTime: "2026-04-11 14:05:00",
    realPayTime: "",
    payUserName: "",
    payRemark: "",
    accountHolderName: "宁波安达供应链有限公司",
  },
  {
    id: "pr-003",
    reqFundsOrderSn: "QK202604120003",
    relatedOrderSn: "LP260412000004",
    payer: "深圳运营主体",
    status: "待提交",
    expenseType: "物流款",
    objectType: "物流商",
    objectName: "深圳海翼物流",
    settlementMethod: "月结货款",
    settlementPeriodDays: 30,
    tradeMethod: "账期支付",
    paymentType: "账期支付",
    amountTotal: 9500,
    amountPaid: 0,
    amountUnpaid: 9500,
    prepayTime: "2026-04-28",
    applicant: "李莎丽",
    remark: "欧洲快线头程",
    applyTime: "2026-04-12 11:30:00",
    realPayTime: "",
    payUserName: "",
    payRemark: "",
    accountHolderName: "深圳海翼物流有限公司",
  },
  {
    id: "pr-004",
    reqFundsOrderSn: "QK202604200004",
    relatedOrderSn: "LP260412000004",
    payer: "深圳运营主体",
    status: "已完成",
    expenseType: "物流款",
    objectType: "物流商",
    objectName: "深圳海翼物流",
    settlementMethod: "现结货款",
    settlementPeriodDays: 0,
    tradeMethod: "网上支付",
    paymentType: "网上支付",
    amountTotal: 9500,
    amountPaid: 9500,
    amountUnpaid: 0,
    prepayTime: "2026-04-20",
    applicant: "李莎丽",
    remark: "头程现结",
    applyTime: "2026-04-12 16:00:00",
    realPayTime: "2026-04-20",
    payUserName: "超级管理员",
    payRemark: "已网银转账",
    accountHolderName: "深圳海翼物流有限公司",
  },
  {
    id: "pr-005",
    reqFundsOrderSn: "QK202604150005",
    relatedOrderSn: "LP260410000002",
    payer: "义乌运营主体",
    status: "已驳回",
    expenseType: "物流款",
    objectType: "物流商",
    objectName: "义乌市双捷国际货运代理有限公司",
    settlementMethod: "月结货款",
    settlementPeriodDays: 30,
    tradeMethod: "支付宝",
    paymentType: "支付宝",
    amountTotal: 3400,
    amountPaid: 0,
    amountUnpaid: 3400,
    prepayTime: "2026-04-18",
    applicant: "张晓莹",
    remark: "头程请款被驳回，请补充合同后重新提交",
    applyTime: "2026-04-15 09:40:00",
    realPayTime: "",
    payUserName: "",
    payRemark: "",
    accountHolderName: "义乌市双捷国际货运代理有限公司",
  },
  {
    id: "pr-006",
    reqFundsOrderSn: "QK202604160006",
    relatedOrderSn: "LP260410000002",
    payer: "义乌运营主体",
    status: "已作废",
    expenseType: "物流款",
    objectType: "物流商",
    objectName: "浙江融盛国际物流有限公司",
    settlementMethod: "现结货款",
    settlementPeriodDays: 0,
    tradeMethod: "跨境宝2.0",
    paymentType: "跨境宝2.0",
    amountTotal: 5400,
    amountPaid: 0,
    amountUnpaid: 5400,
    prepayTime: "2026-04-16",
    applicant: "兰轩",
    remark: "重复提交已作废",
    applyTime: "2026-04-16 13:20:00",
    realPayTime: "",
    payUserName: "",
    payRemark: "",
    accountHolderName: "浙江融盛国际物流有限公司",
  },
  {
    id: "pr-007",
    reqFundsOrderSn: "QK202606040007",
    relatedOrderSn: "PO20260604001",
    payer: "义乌运营主体",
    status: "待付款",
    expenseType: "其他应付款",
    objectType: "供应商",
    objectName: "深圳市以达物流有限公司",
    settlementMethod: "现结货款",
    settlementPeriodDays: 0,
    tradeMethod: "诚e赊",
    paymentType: "诚e赊",
    amountTotal: 12800,
    amountPaid: 3000,
    amountUnpaid: 9800,
    prepayTime: "2026-06-10",
    applicant: "张晓莹",
    remark: "仓储杂费",
    applyTime: "2026-06-04 15:10:00",
    realPayTime: "",
    payUserName: "",
    payRemark: "",
    accountHolderName: "深圳市以达物流有限公司",
  },
];

const amountFields: Array<keyof PaymentRequestRecord> = ["amountTotal", "amountPaid", "amountUnpaid"];

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

function formatAmount(value: number) {
  return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sumAmount(records: PaymentRequestRecord[], field: keyof PaymentRequestRecord) {
  return records.reduce((sum, record) => sum + Number(record[field] ?? 0), 0);
}

function statusTone(status: PaymentRequestStatus) {
  if (status === "已完成") {
    return "success";
  }
  if (status === "待审批" || status === "待付款") {
    return "processing";
  }
  if (status === "待提交") {
    return "pending";
  }
  if (status === "已驳回") {
    return "error";
  }
  return "closed";
}

function AmountCell({ value }: { value: number }) {
  return <span className="font-tabular-nums">¥{formatAmount(value)}</span>;
}

function getRowActions(status: PaymentRequestStatus) {
  switch (status) {
    case "待审批":
      return ["详情", "审批"];
    case "待付款":
      return ["详情", "付款", "作废"];
    case "待提交":
      return ["详情", "提交", "作废"];
    case "已完成":
      return ["详情", "作废"];
    case "已驳回":
      return ["详情", "编辑", "作废"];
    case "已作废":
      return ["详情"];
    default:
      return ["详情"];
  }
}

type PaymentRequestWorkspaceTab =
  | "payment-request"
  | "payment-request-logistics-detail"
  | "payment-request-logistics-edit";

function PaymentRequestListPage({
  onOpenDetail,
  onOpenEdit,
}: {
  onOpenDetail: (record: PaymentRequestRecord) => void;
  onOpenEdit: (record: PaymentRequestRecord) => void;
}) {
  const [statusTab, setStatusTab] = useState<(typeof statusTabs)[number]["value"]>("");
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [approvers, setApprovers] = useState<string[]>([]);
  const [applicants, setApplicants] = useState<string[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<string[]>([]);
  const [settlementMethods, setSettlementMethods] = useState<string[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<string[]>([]);
  const [timeType, setTimeType] = useState<"applyTime" | "prepayTime" | "realPayTime">("applyTime");
  const [timeRange, setTimeRange] = useState<DateRangeValue>(emptyRange());
  const [searchField, setSearchField] = useState<"reqFundsOrderSn" | "remark" | "relatedOrderSn" | "accountHolderName" | "payer">("reqFundsOrderSn");
  const [searchKeyword, setSearchKeyword] = useState("");
  const advancedPanelId = useId();
  const { open: advancedOpen, toggle: toggleAdvanced } = useExclusiveFilterPanel(advancedPanelId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const filteredRecords = useMemo(() => {
    return paymentRequestRecords.filter((record) => {
      const matchesStatus = !statusTab || record.status === statusTab;
      const matchesSupplier = suppliers.length === 0 || suppliers.includes(record.objectName);
      const matchesApprover = approvers.length === 0;
      const matchesApplicant = applicants.length === 0 || applicants.includes(record.applicant);
      const matchesExpenseType = expenseTypes.length === 0 || expenseTypes.includes(record.expenseType);
      const matchesSettlement = settlementMethods.length === 0 || settlementMethods.includes(record.settlementMethod);
      const matchesPaymentType = paymentTypes.length === 0 || paymentTypes.includes(record.paymentType);
      const timeValue =
        timeType === "prepayTime" ? record.prepayTime : timeType === "realPayTime" ? record.realPayTime : record.applyTime;
      const matchesTime = inDateRange(timeValue, timeRange);
      const keyword = searchKeyword.trim();
      const matchesKeyword =
        !keyword ||
        (searchField === "reqFundsOrderSn" && record.reqFundsOrderSn === keyword) ||
        (searchField === "remark" && record.remark === keyword) ||
        (searchField === "relatedOrderSn" && record.relatedOrderSn === keyword) ||
        (searchField === "accountHolderName" && record.accountHolderName === keyword) ||
        (searchField === "payer" && record.payer === keyword);
      return (
        matchesStatus &&
        matchesSupplier &&
        matchesApprover &&
        matchesApplicant &&
        matchesExpenseType &&
        matchesSettlement &&
        matchesPaymentType &&
        matchesTime &&
        matchesKeyword
      );
    });
  }, [applicants, approvers, expenseTypes, paymentTypes, searchField, searchKeyword, settlementMethods, statusTab, suppliers, timeRange, timeType]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const allPageSelected = pagedRecords.length > 0 && pagedRecords.every((record) => selectedIds.includes(record.id));
  const summaryRecords =
    selectedIds.length > 0 ? pagedRecords.filter((record) => selectedIds.includes(record.id)) : pagedRecords;
  const summaryLabel = selectedIds.length > 0 ? "已勾选" : "合计";

  function resetFilters() {
    setSuppliers([]);
    setApprovers([]);
    setApplicants([]);
    setExpenseTypes([]);
    setSettlementMethods([]);
    setPaymentTypes([]);
    setTimeType("applyTime");
    setTimeRange(emptyRange());
    setSearchField("reqFundsOrderSn");
    setSearchKeyword("");
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
          <MultiSelectFilter placeholder="供应商" options={supplierOptions} value={suppliers} onChange={(value) => { setSuppliers(value); setPage(1); }} />
          <MultiSelectFilter placeholder="审批人" options={approverOptions} value={approvers} onChange={(value) => { setApprovers(value); setPage(1); }} />
          <Select
            className="w-[128px]"
            value={timeType}
            clearable={false}
            onValueChange={(value) => setTimeType(value as typeof timeType)}
            options={[
              { label: "申请时间", value: "applyTime" },
              { label: "预计付款日期", value: "prepayTime" },
              { label: "实际付款日期", value: "realPayTime" },
            ]}
          />
          <DateRangePicker value={timeRange} onChange={(value) => { setTimeRange(value); setPage(1); }} />
          <Select
            className="w-[128px]"
            value={searchField}
            clearable={false}
            onValueChange={(value) => setSearchField(value as typeof searchField)}
            options={[
              { label: "请款单号", value: "reqFundsOrderSn" },
              { label: "申请备注", value: "remark" },
              { label: "关联单号", value: "relatedOrderSn" },
              { label: "户名", value: "accountHolderName" },
              { label: "付款方", value: "payer" },
            ]}
          />
          <Input
            className="w-[220px]"
            placeholder="精确搜索"
            value={searchKeyword}
            onChange={(event) => {
              setSearchKeyword(event.target.value);
              setPage(1);
            }}
          />
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={toggleAdvanced}>
              <Filter aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
              高级筛选
            </Button>
            {advancedOpen ? (
              <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-[360px] rounded-sm border border-border bg-white p-3 shadow-md">
                <div className="grid grid-cols-2 gap-3">
                  <MultiSelectFilter placeholder="应付费用类型" options={expenseTypeOptions} value={expenseTypes} onChange={(value) => { setExpenseTypes(value); setPage(1); }} />
                  <MultiSelectFilter placeholder="结算方式" options={settlementMethodOptions} value={settlementMethods} onChange={(value) => { setSettlementMethods(value); setPage(1); }} />
                  <MultiSelectFilter placeholder="支付类型" options={paymentTypeOptions} value={paymentTypes} onChange={(value) => { setPaymentTypes(value); setPage(1); }} />
                  <MultiSelectFilter placeholder="申请人" options={applicantOptions} value={applicants} onChange={(value) => { setApplicants(value); setPage(1); }} />
                </div>
              </div>
            ) : null}
          </div>
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
          <Button variant="secondary" size="sm">审批</Button>
        </div>
      </ListPageToolbar>

      <div className="overflow-x-auto">
          <table className="w-full min-w-[3400px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>
                  <Checkbox checked={allPageSelected} onChange={(event) => toggleAllCurrentPage(event.target.checked)} />
                </th>
                <th className={tableHeadCell}>请款单号</th>
                <th className={tableHeadCell}>关联单号</th>
                <th className={tableHeadCell}>付款方</th>
                <th className={tableHeadCell}>状态</th>
                <th className={tableHeadCell}>应付费用类型</th>
                <th className={tableHeadCell}>应付对象类型</th>
                <th className={tableHeadCell}>应付对象名称</th>
                <th className={tableHeadCell}>结算方式</th>
                <th className={tableHeadCell}>结算周期（天）</th>
                <th className={tableHeadCell}>交易方式</th>
                <th className={tableHeadCell}>支付类型</th>
                <th className={`${tableHeadCell} text-right`}>付款金额</th>
                <th className={`${tableHeadCell} text-right`}>已付</th>
                <th className={`${tableHeadCell} text-right`}>未付</th>
                <th className={tableHeadCell}>预计付款日期</th>
                <th className={tableHeadCell}>申请人</th>
                <th className={tableHeadCell}>申请备注</th>
                <th className={tableHeadCell}>申请时间</th>
                <th className={tableHeadCell}>实际付款日期</th>
                <th className={tableHeadCell}>付款人</th>
                <th className={tableHeadCell}>付款备注</th>
                <th className={tableHeadCell}>户名</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-3 py-3">
                    <Checkbox checked={selectedIds.includes(record.id)} onChange={(event) => toggleRow(record.id, event.target.checked)} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button
                      type="button"
                      className="border-0 bg-transparent p-0 text-primary hover:underline"
                      onClick={() => onOpenDetail(record)}
                    >
                      {record.reqFundsOrderSn}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline">{record.relatedOrderSn}</button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.payer}</td>
                  <td className="px-3 py-3">
                    <Badge tone={statusTone(record.status)}>{record.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.expenseType}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.objectType}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.objectName}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.settlementMethod}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.settlementPeriodDays}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.tradeMethod}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.paymentType}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.amountTotal} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.amountPaid} /></td>
                  <td className="whitespace-nowrap px-3 py-3 text-right"><AmountCell value={record.amountUnpaid} /></td>
                  <td className="whitespace-nowrap px-3 py-3">{record.prepayTime || "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.applicant}</td>
                  <td className="max-w-[160px] truncate px-3 py-3" title={record.remark}>{record.remark}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.applyTime}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.realPayTime || "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.payUserName || "-"}</td>
                  <td className="max-w-[160px] truncate px-3 py-3" title={record.payRemark}>{record.payRemark || "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.accountHolderName}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {getRowActions(record.status).map((action, index) => (
                      <button
                        key={action}
                        type="button"
                        className={`border-0 bg-transparent p-0 text-primary hover:underline ${index > 0 ? "ml-3" : ""}`}
                        onClick={() => {
                          if (action === "详情") {
                            onOpenDetail(record);
                            return;
                          }
                          if (action === "编辑") {
                            onOpenEdit(record);
                          }
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
              {pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={24} className="px-3 py-10 text-center text-text-muted">暂无数据</td>
                </tr>
              ) : (
                <tr className="bg-bg-page font-medium">
                  <td className="px-3 py-3" colSpan={12}>
                    {summaryLabel}
                  </td>
                  {amountFields.map((field) => (
                    <td key={field} className="whitespace-nowrap px-3 py-3 text-right">
                      <AmountCell value={sumAmount(summaryRecords, field)} />
                    </td>
                  ))}
                  <td className="px-3 py-3" colSpan={9} />
                </tr>
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
    </ListPageMainCard>
  );
}

export function PaymentRequestPage({
  activeWorkspaceTab = "payment-request",
  onOpenWorkspaceTab,
}: {
  activeWorkspaceTab?: string;
  onOpenWorkspaceTab?: (tab: PaymentRequestWorkspaceTab) => void;
}) {
  const [activeRecordId, setActiveRecordId] = useState(paymentRequestRecords[0]?.id ?? "");

  function openDetail(record: PaymentRequestRecord) {
    if (record.expenseType !== "物流款") {
      window.alert("当前原型仅支持物流款请款单详情");
      return;
    }
    setActiveRecordId(record.id);
    onOpenWorkspaceTab?.("payment-request-logistics-detail");
  }

  function openEdit(record: PaymentRequestRecord) {
    if (record.expenseType !== "物流款") {
      window.alert("当前原型仅支持物流款请款单编辑");
      return;
    }
    setActiveRecordId(record.id);
    onOpenWorkspaceTab?.("payment-request-logistics-edit");
  }

  if (activeWorkspaceTab === "payment-request-logistics-edit") {
    return (
      <LogisticsPaymentRequestEditPage
        recordId={activeRecordId}
        onBack={() => onOpenWorkspaceTab?.("payment-request")}
        onSubmit={() => onOpenWorkspaceTab?.("payment-request")}
      />
    );
  }

  if (activeWorkspaceTab === "payment-request-logistics-detail") {
    return (
      <LogisticsPaymentRequestDetailPage
        recordId={activeRecordId}
        onBack={() => onOpenWorkspaceTab?.("payment-request")}
        onEdit={() => onOpenWorkspaceTab?.("payment-request-logistics-edit")}
      />
    );
  }

  return <PaymentRequestListPage onOpenDetail={openDetail} onOpenEdit={openEdit} />;
}
