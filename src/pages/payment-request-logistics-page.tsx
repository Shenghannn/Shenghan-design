import { useMemo, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import {
  buildLogisticsPaymentCreateForm,
  getAddablePoolRecords,
  paymentPoolRecords,
  getPlanGroupFeeDetails,
  poolRecordToPlanGroup,
  sumFeeDetailField,
  sumPlanGroupField,
  sumServiceLinkField,
  type LogisticsPaymentFeeDetail,
  type LogisticsPaymentLineItem,
  type LogisticsPaymentPlanGroup,
  type LogisticsPaymentServiceLink,
} from "../data/payment-pool";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/modal";
import { Tabs } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { Timeline } from "../components/ui/timeline";
import type { PaymentRequestStatus } from "./payment-request-page";

export type { LogisticsPaymentFeeDetail, LogisticsPaymentLineItem, LogisticsPaymentPlanGroup, LogisticsPaymentServiceLink };

function buildPr001PlanGroups(): LogisticsPaymentPlanGroup[] {
  const poolRecord = paymentPoolRecords.find((record) => record.id === "pp-001");
  if (!poolRecord) {
    return [];
  }
  const group = poolRecordToPlanGroup(poolRecord);
  const applyAmounts = ["660.00", "660.00", "660.00", "660.00"];
  let applyIndex = 0;
  return [
    {
      ...group,
      serviceLinks: group.serviceLinks.map((link) => ({
        ...link,
        feeDetails: link.feeDetails.map((detail) => {
          const currentApplyAmount = applyAmounts[applyIndex] ?? "0";
          applyIndex += 1;
          return {
            ...detail,
            currentApplyAmount,
            currentDiscountAmount: "0",
          };
        }),
      })),
    },
  ];
}

function buildSingleFeePlanGroup(
  poolId: string,
  relatedOrderSn: string,
  logisticsOrderSn: string,
  logisticsChannel: string,
  detail: LogisticsPaymentFeeDetail,
  currencyIcon = "¥",
): LogisticsPaymentPlanGroup {
  return {
    poolId,
    relatedOrderSn,
    logisticsOrderSn,
    logisticsChannel,
    feeAmount: detail.feeAmount,
    payableAmount: detail.payableAmount,
    paidAmount: detail.paidAmount,
    applyingAmount: detail.applyingAmount,
    notApplyAmount: detail.notApplyAmount,
    currencyIcon,
    serviceLinks: [
      {
        id: `${poolId}-link-1`,
        serviceLinkName: "全程服务",
        feeAmount: detail.feeAmount,
        payableAmount: detail.payableAmount,
        paidAmount: detail.paidAmount,
        applyingAmount: detail.applyingAmount,
        notApplyAmount: detail.notApplyAmount,
        feeDetails: [detail],
      },
    ],
  };
}

function serviceLinkKey(poolId: string, linkId: string) {
  return `${poolId}:${linkId}`;
}

function PlanDimensionCells({
  show,
  planSerial,
  relatedOrderSn,
  logisticsChannel,
  relatedOrderLink,
}: {
  show: boolean;
  planSerial: number;
  relatedOrderSn: string;
  logisticsChannel: string;
  relatedOrderLink?: boolean;
}) {
  if (!show) {
    return (
      <>
        <td className="px-3 py-3" />
        <td className="px-3 py-3" />
        <td className="px-3 py-3" />
      </>
    );
  }

  return (
    <>
      <td className="whitespace-nowrap px-3 py-3 align-top">{planSerial}</td>
      <td className="whitespace-nowrap px-3 py-3 align-top">
        {relatedOrderLink ? (
          <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline">
            {relatedOrderSn}
          </button>
        ) : (
          relatedOrderSn
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-3 align-top">{logisticsChannel}</td>
    </>
  );
}

function ExpandToggle({
  expanded,
  onToggle,
  ariaLabel,
}: {
  expanded: boolean;
  onToggle: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      className="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-sm border-0 bg-transparent text-text-muted hover:bg-bg-hover hover:text-text-primary"
      aria-label={ariaLabel}
      aria-expanded={expanded}
      onClick={onToggle}
    >
      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
    </button>
  );
}

type LogisticsPaymentHeader = {
  reqFundsOrderSn: string;
  status: PaymentRequestStatus;
  logisticsProviderName: string;
  settlementDescription: string;
  expectedPayTime: string;
  prepaymentRatio?: number;
  paymentMethodName: string;
  supplierAccountName: string;
  accountHolderName: string;
  bankOfDeposit: string;
  bankAccount: string;
  currency: string;
  remark: string;
  attachments: string[];
};

type PaymentRecordItem = {
  id: string;
  updateTime: string;
  capitalAccountName: string;
  amountTotal: number;
  payUserName: string;
  realPayTime: string;
  remark: string;
  attachments: string[];
};

type OperationLogItem = {
  id: string;
  createTime: string;
  userName: string;
  actionType: string;
  content: string;
};

type LogisticsPaymentDetail = {
  header: LogisticsPaymentHeader;
  planGroups: LogisticsPaymentPlanGroup[];
  paymentRecords: PaymentRecordItem[];
  operationLogs: OperationLogItem[];
  steps: string[];
  currentStep: number;
};

const tableHeadCell = "whitespace-nowrap px-3 py-3 text-left text-small font-medium";
const paymentMethodOptions = ["账期支付", "网银转账", "网上支付", "跨境宝2.0"];

function toggleServiceLinkExpanded(
  expandedServiceLinks: Record<string, boolean>,
  poolId: string,
  linkId: string,
) {
  const key = serviceLinkKey(poolId, linkId);
  return { ...expandedServiceLinks, [key]: !(expandedServiceLinks[key] ?? true) };
}

function isServiceLinkExpanded(expandedServiceLinks: Record<string, boolean>, poolId: string, linkId: string) {
  return expandedServiceLinks[serviceLinkKey(poolId, linkId)] ?? true;
}

const planDetailAmountHead = (
  <>
    <th className={`${tableHeadCell} text-right`}>费用金额</th>
    <th className={`${tableHeadCell} text-right`}>应付金额</th>
    <th className={`${tableHeadCell} text-right`}>已付金额</th>
    <th className={`${tableHeadCell} text-right`}>申请中</th>
    <th className={`${tableHeadCell} text-right`}>未申请</th>
  </>
);

const planDetailTableHead = (
  <>
    <th className={tableHeadCell}>序号</th>
    <th className={tableHeadCell}>关联单号</th>
    <th className={tableHeadCell}>物流渠道</th>
    <th className={tableHeadCell}>服务环节</th>
    <th className={tableHeadCell}>费用类型</th>
    {planDetailAmountHead}
  </>
);
const detailTabs = [
  { label: "请款信息", value: "info" },
  { label: "付款记录", value: "payments" },
  { label: "操作记录", value: "logs" },
] as const;

const logisticsPaymentDetails: Record<string, LogisticsPaymentDetail> = {
  "pr-001": {
    header: {
      reqFundsOrderSn: "QK202604090001",
      status: "待审批",
      logisticsProviderName: "义乌风驰国际物流",
      settlementDescription: "4月头程月结",
      expectedPayTime: "2026-04-20",
      prepaymentRatio: 80,
      paymentMethodName: "账期支付",
      supplierAccountName: "义乌风驰基本户",
      accountHolderName: "义乌风驰国际物流有限公司",
      bankOfDeposit: "中国工商银行义乌支行",
      bankAccount: "6222020202200118",
      currency: "CNY",
      remark: "头程物流请款，含 LP260409000001 费用。",
      attachments: ["头程请款说明.pdf"],
    },
    planGroups: buildPr001PlanGroups(),
    paymentRecords: [],
    operationLogs: [
      { id: "log-001", createTime: "2026-04-09 10:20:00", userName: "兰轩", actionType: "提交", content: "提交请款单 QK202604090001" },
    ],
    steps: ["提交请款", "审批", "付款", "完成"],
    currentStep: 1,
  },
  "pr-003": {
    header: {
      reqFundsOrderSn: "QK202604120003",
      status: "待提交",
      logisticsProviderName: "深圳海翼物流",
      settlementDescription: "欧洲快线月结",
      expectedPayTime: "2026-04-28",
      paymentMethodName: "账期支付",
      supplierAccountName: "深圳海翼收款户",
      accountHolderName: "深圳海翼物流有限公司",
      bankOfDeposit: "招商银行深圳坂田支行",
      bankAccount: "75500012009888",
      currency: "CNY",
      remark: "欧洲快线头程",
      attachments: [],
    },
    planGroups: [
      buildSingleFeePlanGroup("pp-003", "LP260412000004", "SZHY26060004", "欧洲快线", {
        id: "line-003",
        feeTypeName: "清关费",
        feeAmount: 3266.67,
        payableAmount: 3166.67,
        paidAmount: 0,
        applyingAmount: 0,
        notApplyAmount: 3166.67,
        currentApplyAmount: "3166.67",
        currentDiscountAmount: "0",
      }),
    ],
    paymentRecords: [],
    operationLogs: [],
    steps: ["提交请款", "审批", "付款", "完成"],
    currentStep: 0,
  },
  "pr-004": {
    header: {
      reqFundsOrderSn: "QK202604200004",
      status: "已完成",
      logisticsProviderName: "深圳海翼物流",
      settlementDescription: "欧洲快线现结",
      expectedPayTime: "2026-04-20",
      paymentMethodName: "网上支付",
      supplierAccountName: "深圳海翼收款户",
      accountHolderName: "深圳海翼物流有限公司",
      bankOfDeposit: "招商银行深圳坂田支行",
      bankAccount: "75500012009888",
      currency: "CNY",
      remark: "头程现结",
      attachments: ["付款凭证-20260420.pdf"],
    },
    planGroups: [
      buildSingleFeePlanGroup("pp-003", "LP260412000004", "SZHY26060004", "欧洲快线", {
        id: "line-004",
        feeTypeName: "清关费",
        feeAmount: 3266.67,
        payableAmount: 3166.67,
        paidAmount: 3166.67,
        applyingAmount: 0,
        notApplyAmount: 0,
        currentApplyAmount: "3166.67",
        currentDiscountAmount: "0",
      }),
    ],
    paymentRecords: [
      {
        id: "pay-001",
        updateTime: "2026-04-20 15:30:00",
        capitalAccountName: "义乌运营主体-基本户",
        amountTotal: 9500,
        payUserName: "超级管理员",
        realPayTime: "2026-04-20 15:28:00",
        remark: "已网银转账",
        attachments: ["付款回单.pdf"],
      },
    ],
    operationLogs: [
      { id: "log-004-1", createTime: "2026-04-12 16:00:00", userName: "李莎丽", actionType: "提交", content: "提交请款单 QK202604200004" },
      { id: "log-004-2", createTime: "2026-04-13 09:15:00", userName: "超级管理员", actionType: "审批", content: "审批通过" },
      { id: "log-004-3", createTime: "2026-04-20 15:30:00", userName: "超级管理员", actionType: "付款", content: "付款完成，金额 ¥9,500.00" },
    ],
    steps: ["提交请款", "审批", "付款", "完成"],
    currentStep: 3,
  },
  "pr-005": {
    header: {
      reqFundsOrderSn: "QK202604150005",
      status: "已驳回",
      logisticsProviderName: "义乌市双捷国际货运代理有限公司",
      settlementDescription: "4月预付款",
      expectedPayTime: "2026-04-18",
      paymentMethodName: "支付宝",
      supplierAccountName: "双捷支付宝账户",
      accountHolderName: "义乌市双捷国际货运代理有限公司",
      bankOfDeposit: "支付宝",
      bankAccount: "13800001111",
      currency: "CNY",
      remark: "预付款申请，附件不完整，请补充合同后重新提交。",
      attachments: [],
    },
    planGroups: [
      buildSingleFeePlanGroup("pp-004", "LP260410000002", "RSWL26060002", "美西海派", {
        id: "line-005",
        feeTypeName: "清关费",
        feeAmount: 1866.93,
        payableAmount: 1800,
        paidAmount: 666.67,
        applyingAmount: 0,
        notApplyAmount: 1133.33,
        currentApplyAmount: "1133.33",
        currentDiscountAmount: "0",
      }),
    ],
    paymentRecords: [],
    operationLogs: [
      { id: "log-005-1", createTime: "2026-04-15 09:40:00", userName: "张晓莹", actionType: "提交", content: "提交请款单 QK202604150005" },
      { id: "log-005-2", createTime: "2026-04-16 11:05:00", userName: "超级管理员", actionType: "驳回", content: "附件不完整，请补充合同" },
    ],
    steps: ["提交请款", "审批", "付款", "完成"],
    currentStep: 0,
  },
  "pr-006": {
    header: {
      reqFundsOrderSn: "QK202604160006",
      status: "已作废",
      logisticsProviderName: "浙江融盛国际物流有限公司",
      settlementDescription: "现结重复单",
      expectedPayTime: "2026-04-16",
      paymentMethodName: "跨境宝2.0",
      supplierAccountName: "融盛跨境账户",
      accountHolderName: "浙江融盛国际物流有限公司",
      bankOfDeposit: "宁波银行股份有限公司科技支行",
      bankAccount: "31010122000919200",
      currency: "CNY",
      remark: "重复提交已作废",
      attachments: [],
    },
    planGroups: [
      buildSingleFeePlanGroup("pp-004", "LP260410000002", "RSWL26060002", "美西海派", {
        id: "line-006",
        feeTypeName: "清关费",
        feeAmount: 1866.93,
        payableAmount: 1800,
        paidAmount: 0,
        applyingAmount: 0,
        notApplyAmount: 1800,
        currentApplyAmount: "1800.00",
        currentDiscountAmount: "0",
      }),
    ],
    paymentRecords: [],
    operationLogs: [
      { id: "log-006-1", createTime: "2026-04-16 13:20:00", userName: "兰轩", actionType: "提交", content: "提交请款单 QK202604160006" },
      { id: "log-006-2", createTime: "2026-04-17 10:00:00", userName: "超级管理员", actionType: "作废", content: "重复提交，作废处理" },
    ],
    steps: ["提交请款", "审批", "付款", "完成"],
    currentStep: 0,
  },
};

function cloneDetail(recordId: string): LogisticsPaymentDetail | null {
  const source = logisticsPaymentDetails[recordId];
  if (!source) {
    return null;
  }
  return {
    ...source,
    header: { ...source.header },
    planGroups: source.planGroups.map((group) => ({
      ...group,
      serviceLinks: group.serviceLinks.map((link) => ({
        ...link,
        feeDetails: link.feeDetails.map((detail) => ({ ...detail })),
      })),
    })),
    paymentRecords: source.paymentRecords.map((item) => ({ ...item })),
    operationLogs: [...source.operationLogs],
    steps: [...source.steps],
    currentStep: source.currentStep,
  };
}

function toAmount(value: string | number) {
  const parsed = parseFloat(String(value || 0));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatAmountWithIcon(
  currencyIcon: string,
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined || value === "") {
    return currencyIcon || "-";
  }
  if (typeof value === "number") {
    return `${currencyIcon}${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currencyIcon}${value}`;
}

function sumPlanGroupsField(
  groups: LogisticsPaymentPlanGroup[],
  field: "currentApplyAmount" | "currentDiscountAmount",
) {
  return groups.reduce((sum, group) => sum + sumPlanGroupField(group, field), 0);
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

function SectionTitle({ children }: { children: string }) {
  return <div className="border-l-4 border-primary pl-3 font-medium text-text-primary">{children}</div>;
}

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-[118px] shrink-0 text-right text-small text-text-secondary">{label}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-small">
      <div className="text-text-secondary">{label}：</div>
      <div className="break-all text-text-primary">{value || "-"}</div>
    </div>
  );
}

function StepBar({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, index) => {
        const active = index === currentStep;
        const completed = index < currentStep;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 text-mini ${
                active ? "bg-primary text-white" : completed ? "bg-tag-success text-[var(--tag-success-text)]" : "bg-bg-page text-text-muted"
              }`}
            >
              {index + 1}
            </div>
            <span className={`text-small ${active ? "font-medium text-text-primary" : "text-text-muted"}`}>{step}</span>
            {index < steps.length - 1 ? <span className="mx-1 text-text-disabled">—</span> : null}
          </div>
        );
      })}
    </div>
  );
}

export function LogisticsPaymentRequestCreatePage({
  poolIds,
  onBack,
  onSubmit,
}: {
  poolIds: string[];
  onBack: () => void;
  onSubmit: () => void;
}) {
  return <LogisticsPaymentRequestFormPage mode="create" poolIds={poolIds} onBack={onBack} onSubmit={onSubmit} />;
}

export function LogisticsPaymentRequestEditPage({
  recordId,
  onBack,
  onSubmit,
}: {
  recordId: string;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return <LogisticsPaymentRequestFormPage mode="edit" recordId={recordId} onBack={onBack} onSubmit={onSubmit} />;
}

function LogisticsPaymentRequestFormPage({
  mode,
  recordId,
  poolIds = [],
  onBack,
  onSubmit,
}: {
  mode: "create" | "edit";
  recordId?: string;
  poolIds?: string[];
  onBack: () => void;
  onSubmit: () => void;
}) {
  const createForm = useMemo(
    () => (mode === "create" ? buildLogisticsPaymentCreateForm(poolIds) : null),
    [mode, poolIds],
  );
  const editDetail = useMemo(
    () => (mode === "edit" && recordId ? cloneDetail(recordId) : null),
    [mode, recordId],
  );

  const providerName =
    mode === "create" ? createForm?.logisticsProviderName ?? "" : editDetail?.header.logisticsProviderName ?? "";
  const accountInfo =
    mode === "create"
      ? {
          supplierAccountName: createForm?.supplierAccountName ?? "",
          accountHolderName: createForm?.accountHolderName ?? "",
          bankOfDeposit: createForm?.bankOfDeposit ?? "",
          bankAccount: createForm?.bankAccount ?? "",
          currency: createForm?.currency ?? "CNY",
        }
      : {
          supplierAccountName: editDetail?.header.supplierAccountName ?? "",
          accountHolderName: editDetail?.header.accountHolderName ?? "",
          bankOfDeposit: editDetail?.header.bankOfDeposit ?? "",
          bankAccount: editDetail?.header.bankAccount ?? "",
          currency: editDetail?.header.currency ?? "CNY",
        };

  const [settlementDescription, setSettlementDescription] = useState(
    mode === "create" ? "" : editDetail?.header.settlementDescription ?? "",
  );
  const [expectedPayTime, setExpectedPayTime] = useState(
    mode === "create" ? "" : editDetail?.header.expectedPayTime ?? "",
  );
  const [paymentMethodName, setPaymentMethodName] = useState(
    mode === "create" ? createForm?.paymentMethodName ?? "账期支付" : editDetail?.header.paymentMethodName ?? "",
  );
  const [prepaymentRatio, setPrepaymentRatio] = useState(
    mode === "edit" && editDetail?.header.prepaymentRatio != null ? String(editDetail.header.prepaymentRatio) : "",
  );
  const [remark, setRemark] = useState(mode === "create" ? "" : editDetail?.header.remark ?? "");
  const [planGroups, setPlanGroups] = useState<LogisticsPaymentPlanGroup[]>(
    mode === "create" ? createForm?.planGroups ?? [] : editDetail?.planGroups ?? [],
  );
  const [expandedServiceLinks, setExpandedServiceLinks] = useState<Record<string, boolean>>({});
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planSelection, setPlanSelection] = useState<string[]>([]);

  const addablePoolRecords = useMemo(
    () => getAddablePoolRecords(providerName, planGroups.map((group) => group.poolId)),
    [planGroups, providerName],
  );

  function toggleServiceLink(poolId: string, linkId: string) {
    setExpandedServiceLinks((current) => toggleServiceLinkExpanded(current, poolId, linkId));
  }

  if ((mode === "create" && !createForm) || (mode === "edit" && !editDetail)) {
    return (
      <Card>
        <div className="py-10 text-center text-text-muted">
          {mode === "create" ? "缺少请款池参数，无法创建请款单" : "未找到物流款请款单数据"}
        </div>
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={onBack}>返回</Button>
        </div>
      </Card>
    );
  }

  const pageTitle =
    mode === "create"
      ? "添加请款单 - 物流款"
      : `编辑请款单 - 物流款（${editDetail?.header.reqFundsOrderSn ?? ""}）`;

  const totalApply = sumPlanGroupsField(planGroups, "currentApplyAmount");
  const totalDiscount = sumPlanGroupsField(planGroups, "currentDiscountAmount");

  function updateFeeDetail(
    poolId: string,
    serviceLinkId: string,
    detailId: string,
    patch: Partial<LogisticsPaymentFeeDetail>,
  ) {
    setPlanGroups((current) =>
      current.map((group) =>
        group.poolId === poolId
          ? {
              ...group,
              serviceLinks: group.serviceLinks.map((link) =>
                link.id === serviceLinkId
                  ? {
                      ...link,
                      feeDetails: link.feeDetails.map((detail) =>
                        detail.id === detailId ? { ...detail, ...patch } : detail,
                      ),
                    }
                  : link,
              ),
            }
          : group,
      ),
    );
  }

  function applyPrepaymentRatioValue() {
    const ratio = toAmount(prepaymentRatio);
    if (!ratio) {
      return;
    }
    setPlanGroups((current) =>
      current.map((group) => ({
        ...group,
        serviceLinks: group.serviceLinks.map((link) => ({
          ...link,
          feeDetails: link.feeDetails.map((row) => {
            const base = Math.max(0, toAmount(row.notApplyAmount) - toAmount(row.currentDiscountAmount));
            let amount = (base * ratio) / 100;
            if (amount > 0 && amount < 0.01) {
              amount = 0.01;
            }
            return {
              ...row,
              currentApplyAmount: amount === 0 ? "0" : amount.toFixed(2),
            };
          }),
        })),
      })),
    );
  }

  function handleApplyAmountChange(
    poolId: string,
    serviceLinkId: string,
    row: LogisticsPaymentFeeDetail,
    value: string,
  ) {
    setPrepaymentRatio("");
    const maxAmount = Math.max(0, toAmount(row.notApplyAmount) - toAmount(row.currentDiscountAmount));
    const nextValue = Math.min(toAmount(value), maxAmount);
    updateFeeDetail(poolId, serviceLinkId, row.id, { currentApplyAmount: nextValue.toFixed(2) });
  }

  function handleDiscountAmountChange(
    poolId: string,
    serviceLinkId: string,
    row: LogisticsPaymentFeeDetail,
    value: string,
  ) {
    setPrepaymentRatio("");
    const maxDiscount = Math.max(0, toAmount(row.notApplyAmount) - toAmount(row.currentApplyAmount));
    const nextValue = Math.min(toAmount(value), maxDiscount);
    updateFeeDetail(poolId, serviceLinkId, row.id, { currentDiscountAmount: nextValue.toFixed(2) });
  }

  function handleFillAll() {
    setPrepaymentRatio("");
    setPlanGroups((current) =>
      current.map((group) => ({
        ...group,
        serviceLinks: group.serviceLinks.map((link) => ({
          ...link,
          feeDetails: link.feeDetails.map((row) => ({
            ...row,
            currentApplyAmount: Math.max(
              0,
              toAmount(row.notApplyAmount) - toAmount(row.currentDiscountAmount),
            ).toFixed(2),
          })),
        })),
      })),
    );
  }

  function handleRemovePlanGroup(index: number) {
    if (planGroups.length <= 1) {
      window.alert("至少保留一条数据，不允许移除");
      return;
    }
    setPlanGroups((current) => current.filter((_, groupIndex) => groupIndex !== index));
  }

  function handleSubmit() {
    if (planGroups.length === 0) {
      window.alert("请添加物流计划单");
      return;
    }
    const allDetails = planGroups.flatMap((group) => getPlanGroupFeeDetails(group));
    const hasEmptyApply = allDetails.some((row) => row.currentApplyAmount === "");
    if (hasEmptyApply) {
      window.alert("请填写本次申请金额");
      return;
    }
    const hasInvalid = allDetails.some(
      (row) => toAmount(row.currentApplyAmount) + toAmount(row.currentDiscountAmount) <= 0,
    );
    if (hasInvalid) {
      window.alert("本次申请+本次折扣不能小于等于0");
      return;
    }
    onSubmit();
  }

  function confirmAddPlans() {
    const nextGroups = addablePoolRecords
      .filter((record) => planSelection.includes(record.id))
      .map(poolRecordToPlanGroup);
    if (nextGroups.length === 0) {
      return;
    }
    setPrepaymentRatio("");
    setPlanGroups((current) => [...current, ...nextGroups]);
    setPlanSelection([]);
    setPlanModalOpen(false);
  }

  return (
    <div className="space-y-4 pb-16">
      <Card>
        <SectionTitle>{pageTitle}</SectionTitle>
        <div className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
          <FormRow label="物流商">
            <div className="min-h-input-md py-1.5 text-small text-text-primary">{providerName}</div>
          </FormRow>
          <FormRow label="结算描述">
            <Input value={settlementDescription} placeholder="结算描述" onChange={(event) => setSettlementDescription(event.target.value)} />
          </FormRow>
          <FormRow label="预计付款日期">
            <Input type="date" value={expectedPayTime} onChange={(event) => setExpectedPayTime(event.target.value)} />
          </FormRow>
          <FormRow label="支付方式">
            <select
              className="field-control w-full"
              value={paymentMethodName}
              onChange={(event) => setPaymentMethodName(event.target.value)}
            >
              {paymentMethodOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label="收款账户名称">
            <Input value={accountInfo.supplierAccountName} disabled className="bg-bg-page text-text-secondary" />
          </FormRow>
          <FormRow label="户名">
            <Input value={accountInfo.accountHolderName} disabled className="bg-bg-page text-text-secondary" />
          </FormRow>
          <FormRow label="开户行">
            <Input value={accountInfo.bankOfDeposit} disabled className="bg-bg-page text-text-secondary" />
          </FormRow>
          <FormRow label="账号">
            <Input value={accountInfo.bankAccount} disabled className="bg-bg-page text-text-secondary" />
          </FormRow>
          <FormRow label="付款币种">
            <Input value={accountInfo.currency} disabled className="bg-bg-page text-text-secondary" />
          </FormRow>
          <FormRow label="预付比例">
            <div className="flex items-center gap-2">
              <Input
                value={prepaymentRatio}
                placeholder="请输入"
                onChange={(event) => setPrepaymentRatio(event.target.value.replace(/[^\d.]/g, ""))}
                onBlur={applyPrepaymentRatioValue}
              />
              <span className="text-small text-text-muted">%</span>
            </div>
          </FormRow>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <FormRow label="备注">
            <Textarea className="min-h-[140px]" maxLength={500} value={remark} placeholder="请输入备注" onChange={(event) => setRemark(event.target.value)} />
          </FormRow>
          <FormRow label="附件">
            <div className="space-y-2">
              <Button variant="secondary" size="sm">上传附件</Button>
              <div className="text-mini text-text-muted">支持 pdf、doc、jpg、xls 等格式，最多 5 个文件</div>
            </div>
          </FormRow>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <SectionTitle>物流计划单明细</SectionTitle>
            <div className="mt-1 text-mini text-text-muted">
              按序号、关联单号、物流渠道、服务环节展示；一个序号对应一个关联单号，费用类型为子行
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setPlanModalOpen(true)}>添加物流计划单</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                {planDetailTableHead}
                <th className={tableHeadCell}>
                  <div className="flex items-center gap-2">
                    <span>本次申请</span>
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={handleFillAll}>全部</button>
                  </div>
                </th>
                <th className={tableHeadCell}>本次折扣</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {planGroups.flatMap((group, groupIndex) => {
                const planSerial = groupIndex + 1;
                return group.serviceLinks.flatMap((link, linkIndex) => {
                  const linkApply = sumServiceLinkField(link, "currentApplyAmount");
                  const linkDiscount = sumServiceLinkField(link, "currentDiscountAmount");
                  const linkExpanded = isServiceLinkExpanded(expandedServiceLinks, group.poolId, link.id);
                  const rows: ReactNode[] = [
                    <tr key={link.id} className="bg-[#fafbfd] font-medium">
                      <PlanDimensionCells
                        show={linkIndex === 0}
                        planSerial={planSerial}
                        relatedOrderSn={group.relatedOrderSn}
                        logisticsChannel={group.logisticsChannel}
                      />
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="flex items-center">
                          <ExpandToggle
                            expanded={linkExpanded}
                            onToggle={() => toggleServiceLink(group.poolId, link.id)}
                            ariaLabel={linkExpanded ? `收起${link.serviceLinkName}费用类型` : `展开${link.serviceLinkName}费用类型`}
                          />
                          {link.serviceLinkName}
                        </div>
                      </td>
                      <td className="px-3 py-3" />
                      <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, link.feeAmount)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, link.payableAmount)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, link.paidAmount)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, link.applyingAmount)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, link.notApplyAmount)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-text-secondary">
                        {linkApply > 0 || link.feeDetails.some((detail) => detail.currentApplyAmount !== "")
                          ? `${group.currencyIcon}${linkApply.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-text-secondary">
                        {linkDiscount > 0 || link.feeDetails.some((detail) => detail.currentDiscountAmount !== "")
                          ? `${group.currencyIcon}${linkDiscount.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {linkIndex === 0 ? (
                          <button
                            type="button"
                            className="border-0 bg-transparent p-0 text-danger hover:underline"
                            onClick={() => handleRemovePlanGroup(groupIndex)}
                          >
                            移除
                          </button>
                        ) : null}
                      </td>
                    </tr>,
                  ];

                  if (linkExpanded) {
                    link.feeDetails.forEach((detail) => {
                      rows.push(
                        <tr key={detail.id} className="bg-white">
                          <td className="px-3 py-3" colSpan={3} />
                          <td className="px-3 py-3" />
                          <td className="whitespace-nowrap px-3 py-3 pl-8 before:mr-2 before:text-text-disabled before:content-['└']">
                            {detail.feeTypeName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, detail.feeAmount)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, detail.payableAmount)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, detail.paidAmount)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, detail.applyingAmount)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, detail.notApplyAmount)}</td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <Input
                              className="w-[120px]"
                              value={detail.currentApplyAmount}
                              onChange={(event) =>
                                handleApplyAmountChange(group.poolId, link.id, detail, event.target.value)
                              }
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <Input
                              className="w-[120px]"
                              value={detail.currentDiscountAmount}
                              onChange={(event) =>
                                handleDiscountAmountChange(group.poolId, link.id, detail, event.target.value)
                              }
                            />
                          </td>
                          <td className="px-3 py-3" />
                        </tr>,
                      );
                    });
                  }

                  return rows;
                });
              })}
              <tr className="bg-bg-page font-medium">
                <td className="px-3 py-3" colSpan={10}>合计</td>
                <td className="whitespace-nowrap px-3 py-3 text-right">¥{totalApply.toFixed(2)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right">¥{totalDiscount.toFixed(2)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right">¥{(totalApply + totalDiscount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center gap-3 border-t border-border bg-white px-6 py-3 shadow-lg">
        <Button variant="secondary" size="sm" onClick={onBack}>取消</Button>
        <Button variant="primary" size="sm" onClick={handleSubmit}>提交</Button>
      </div>

      <Modal open={planModalOpen} title="添加物流计划单" widthClassName="w-[960px]" onClose={() => setPlanModalOpen(false)}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell} />
                <th className={tableHeadCell}>物流计划单号</th>
                <th className={tableHeadCell}>物流商单号</th>
                <th className={tableHeadCell}>发货仓库</th>
                <th className={tableHeadCell}>收货仓库</th>
                <th className={`${tableHeadCell} text-right`}>未申请</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {addablePoolRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-3 py-3">
                    <Checkbox
                      checked={planSelection.includes(record.id)}
                      onChange={(event) => {
                        setPlanSelection((current) =>
                          event.target.checked ? [...current, record.id] : current.filter((id) => id !== record.id),
                        );
                      }}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsPlanNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.logisticsBillNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.sendWarehouse}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.receiveWarehouse}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">¥{record.notApplyAmount.toFixed(2)}</td>
                </tr>
              ))}
              {addablePoolRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-text-muted">暂无可添加的物流计划单</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPlanModalOpen(false)}>取消</Button>
          <Button variant="primary" size="sm" disabled={planSelection.length === 0} onClick={confirmAddPlans}>确定</Button>
        </div>
      </Modal>
    </div>
  );
}

export function LogisticsPaymentRequestDetailPage({
  recordId,
  onBack,
  onEdit,
}: {
  recordId: string;
  onBack: () => void;
  onEdit?: () => void;
}) {
  const detail = logisticsPaymentDetails[recordId];
  const [activeTab, setActiveTab] = useState<(typeof detailTabs)[number]["value"]>("info");

  const [expandedServiceLinks, setExpandedServiceLinks] = useState<Record<string, boolean>>({});

  if (!detail) {
    return (
      <Card>
        <div className="py-10 text-center text-text-muted">未找到物流款请款单数据</div>
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={onBack}>返回列表</Button>
        </div>
      </Card>
    );
  }

  const { header, planGroups } = detail;
  const totalApply = sumPlanGroupsField(planGroups, "currentApplyAmount");
  const totalDiscount = sumPlanGroupsField(planGroups, "currentDiscountAmount");
  const currencyIcon = planGroups[0]?.currencyIcon ?? "¥";

  return (
    <div className="space-y-page-block">
      <section className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-hero-title-row">
            <h2 className="page-title">{header.reqFundsOrderSn}</h2>
            <Badge tone={statusTone(header.status)}>{header.status}</Badge>
          </div>
          <div className="detail-hero-meta">
            <span>物流商：{header.logisticsProviderName}</span>
            <span>应付费用类型：物流款</span>
            <span>预计付款日期：{header.expectedPayTime || "-"}</span>
            <span>付款币种：{header.currency}</span>
          </div>
        </div>
        <div className="detail-hero-actions">
          {header.status === "待审批" ? <Button variant="primary" size="sm">审批</Button> : null}
          {header.status !== "已完成" && header.status !== "已作废" ? (
            <Button variant="secondary" size="sm">作废</Button>
          ) : null}
          {header.status === "已驳回" && onEdit ? (
            <Button variant="secondary" size="sm" onClick={onEdit}>编辑</Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={onBack}>关闭</Button>
        </div>
      </section>

      <Card>
        <StepBar steps={detail.steps} currentStep={detail.currentStep} />
        <div className="mt-4 grid gap-x-10 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="物流商" value={header.logisticsProviderName} />
          <InfoItem label="结算描述" value={header.settlementDescription} />
          <InfoItem label="预计付款日期" value={header.expectedPayTime} />
          <InfoItem label="预付比例" value={header.prepaymentRatio != null ? `${header.prepaymentRatio}%` : "-"} />
          <InfoItem label="支付方式" value={header.paymentMethodName} />
          <InfoItem label="收款账户名称" value={header.supplierAccountName} />
          <InfoItem label="户名" value={header.accountHolderName} />
          <InfoItem label="账号" value={header.bankAccount} />
          <InfoItem label="付款币种" value={header.currency} />
          <InfoItem label="附件" value={header.attachments.length ? header.attachments.join("、") : "-"} />
          <div className="md:col-span-2 xl:col-span-4">
            <InfoItem label="备注" value={header.remark} />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="px-4 pt-3">
          <Tabs items={[...detailTabs]} value={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "info" ? (
          <div className="overflow-x-auto border-t border-border">
            <table className="w-full min-w-[1400px] border-collapse text-left text-small">
              <thead className="bg-bg-page text-text-muted">
                <tr>
                  {planDetailTableHead}
                  <th className={`${tableHeadCell} text-right`}>本次申请</th>
                  <th className={`${tableHeadCell} text-right`}>本次折扣</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {planGroups.flatMap((group, groupIndex) => {
                  const planSerial = groupIndex + 1;
                  return group.serviceLinks.flatMap((link, linkIndex) => {
                    const linkApply = sumServiceLinkField(link, "currentApplyAmount");
                    const linkDiscount = sumServiceLinkField(link, "currentDiscountAmount");
                    const linkExpanded = isServiceLinkExpanded(expandedServiceLinks, group.poolId, link.id);
                    const rows: ReactNode[] = [
                      <tr key={link.id} className="bg-[#fafbfd] font-medium">
                        <PlanDimensionCells
                          show={linkIndex === 0}
                          planSerial={planSerial}
                          relatedOrderSn={group.relatedOrderSn}
                          logisticsChannel={group.logisticsChannel}
                          relatedOrderLink
                        />
                        <td className="whitespace-nowrap px-3 py-3">
                          <div className="flex items-center">
                            <ExpandToggle
                              expanded={linkExpanded}
                              onToggle={() =>
                                setExpandedServiceLinks((current) =>
                                  toggleServiceLinkExpanded(current, group.poolId, link.id),
                                )
                              }
                              ariaLabel={linkExpanded ? `收起${link.serviceLinkName}费用类型` : `展开${link.serviceLinkName}费用类型`}
                            />
                            {link.serviceLinkName}
                          </div>
                        </td>
                        <td className="px-3 py-3" />
                        <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, link.feeAmount)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, link.payableAmount)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, link.paidAmount)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, link.applyingAmount)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, link.notApplyAmount)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, linkApply)}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, linkDiscount)}</td>
                      </tr>,
                    ];

                    if (linkExpanded) {
                      link.feeDetails.forEach((row) => {
                        rows.push(
                          <tr key={row.id}>
                            <td className="px-3 py-3" colSpan={3} />
                            <td className="px-3 py-3" />
                            <td className="whitespace-nowrap px-3 py-3 pl-8 before:mr-2 before:text-text-disabled before:content-['└']">
                              {row.feeTypeName}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, row.feeAmount)}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, row.payableAmount)}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, row.paidAmount)}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, row.applyingAmount)}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, row.notApplyAmount)}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, row.currentApplyAmount)}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-right">{formatAmountWithIcon(group.currencyIcon, row.currentDiscountAmount)}</td>
                          </tr>,
                        );
                      });
                    }

                    return rows;
                  });
                })}
                <tr className="bg-bg-page font-medium">
                  <td className="px-3 py-3" colSpan={10}>合计</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">{currencyIcon}{totalApply.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">{currencyIcon}{totalDiscount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}

        {activeTab === "payments" ? (
          <div className="overflow-x-auto border-t border-border">
            {detail.paymentRecords.length === 0 ? (
              <div className="px-4 py-10 text-center text-text-muted">暂无付款记录</div>
            ) : (
              <table className="w-full min-w-[980px] border-collapse text-left text-small">
                <thead className="bg-bg-page text-text-muted">
                  <tr>
                    <th className={tableHeadCell}>操作时间</th>
                    <th className={tableHeadCell}>资金账户</th>
                    <th className={`${tableHeadCell} text-right`}>付款金额</th>
                    <th className={tableHeadCell}>付款人</th>
                    <th className={tableHeadCell}>实际付款时间</th>
                    <th className={tableHeadCell}>附件</th>
                    <th className={tableHeadCell}>备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {detail.paymentRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap px-3 py-3">{record.updateTime}</td>
                      <td className="whitespace-nowrap px-3 py-3">{record.capitalAccountName}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">¥{record.amountTotal.toFixed(2)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{record.payUserName}</td>
                      <td className="whitespace-nowrap px-3 py-3">{record.realPayTime}</td>
                      <td className="whitespace-nowrap px-3 py-3">{record.attachments.join("、") || "-"}</td>
                      <td className="whitespace-nowrap px-3 py-3">{record.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : null}

        {activeTab === "logs" ? (
          <div className="border-t border-border px-4 py-4">
            <Timeline
              items={detail.operationLogs.map((log) => ({
                id: log.id,
                time: log.createTime,
                title: `${log.actionType} · ${log.userName}`,
                description: log.content,
              }))}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}