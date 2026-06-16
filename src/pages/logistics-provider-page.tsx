import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DateRangePicker, type DateRangeValue } from "../components/ui/date-range-picker";
import { ExclusiveFilterGroup } from "../components/ui/exclusive-filter-group";
import { Input } from "../components/ui/input";
import { MultiSelectFilter } from "../components/ui/multi-select-filter";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

type ApprovalStatus = "待提交" | "待审批" | "审批完成";
type CooperationStatus = "开发中" | "合作中" | "暂停合作" | "终止合作";
type LogisticsProviderType =
  | "跨境物流商"
  | "货代物流商"
  | "海外仓物流商"
  | "国际报关行"
  | "国内托报行"
  | "船东物流商"
  | "国际拖车行";

type SettlementAccount = {
  id: string;
  customAccountName: string;
  accountName: string;
  bankName: string;
  swiftCode: string;
  accountNo: string;
  defaultAccount: boolean;
};

type ContractInfo = {
  id: string;
  contractNo: string;
  signDate: string;
  validity: string;
  deposit: string;
  paymentMethod: string;
  contractFile: string;
  contractStatus: string;
  signSubject: string;
};

type LogisticsProviderRecord = {
  id: string;
  providerId: string;
  name: string;
  type: LogisticsProviderType;
  address: string;
  legalRepresentative: string;
  establishedAt: string;
  registeredCapital: string;
  qualification: string;
  accountNo: string;
  bankName: string;
  taxRegistrationNo: string;
  approvalStatus: ApprovalStatus;
  cooperationStatus: CooperationStatus;
  creator: string;
  createdAt: string;
  updater: string;
  updatedAt: string;
  contactName: string;
  contactPhone: string;
  contactMethod: string;
  taxAddress: string;
  settlementAccounts: SettlementAccount[];
  contracts: ContractInfo[];
};

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";
const approvalStatuses: ApprovalStatus[] = ["待提交", "待审批", "审批完成"];
const cooperationStatuses: CooperationStatus[] = ["开发中", "合作中", "暂停合作", "终止合作"];
const providerTypes: LogisticsProviderType[] = [
  "跨境物流商",
  "货代物流商",
  "海外仓物流商",
  "国际报关行",
  "国内托报行",
  "船东物流商",
  "国际拖车行",
];
const qualificationOptions = ["NVOCC资质", "无船承运人备案", "国际货代备案", "报关单位备案", "海外仓服务资质"];

const logisticsProviderRecords: LogisticsProviderRecord[] = [
  {
    id: "lp-001",
    providerId: "WL016",
    name: "浙江融盛国际物流有限公司",
    type: "跨境物流商",
    address: "浙江省宁波市鄞州区国际航运大厦1-2202A",
    legalRepresentative: "陈君",
    establishedAt: "2020-12-11",
    registeredCapital: "10000000",
    qualification: "NVOCC资质",
    accountNo: "31010122000919200",
    bankName: "宁波银行股份有限公司科技支行",
    taxRegistrationNo: "91330200MA2J3UA42K",
    approvalStatus: "审批完成",
    cooperationStatus: "开发中",
    creator: "东方强",
    createdAt: "2025-06-02 17:03:43",
    updater: "东方强",
    updatedAt: "2026-06-03 09:51:25",
    contactName: "陈君",
    contactPhone: "182383770304",
    contactMethod: "182383770304",
    taxAddress: "浙江省宁波市鄞州区国际航运大厦1-2202A",
    settlementAccounts: [
      {
        id: "sa-001",
        customAccountName: "中国涉税费",
        accountName: "浙江融盛国际物流有限公司",
        bankName: "宁波银行股份有限公司科技支行",
        swiftCode: "-",
        accountNo: "31010122000919200",
        defaultAccount: true,
      },
    ],
    contracts: [],
  },
  {
    id: "lp-002",
    providerId: "WL001",
    name: "义乌市双捷国际货运代理有限公司",
    type: "货代物流商",
    address: "浙江省义乌市福田街道银海一区",
    legalRepresentative: "王建明",
    establishedAt: "2018-04-16",
    registeredCapital: "5000000",
    qualification: "国际货代备案",
    accountNo: "6222020202200118",
    bankName: "中国工商银行义乌支行",
    taxRegistrationNo: "91330782MA29L8F10Q",
    approvalStatus: "待审批",
    cooperationStatus: "合作中",
    creator: "兰轩",
    createdAt: "2026-05-06 14:37:38",
    updater: "兰轩",
    updatedAt: "2026-06-05 15:01:34",
    contactName: "王建明",
    contactPhone: "13800001111",
    contactMethod: "13800001111",
    taxAddress: "浙江省义乌市福田街道银海一区",
    settlementAccounts: [
      {
        id: "sa-002",
        customAccountName: "人民币基本户",
        accountName: "义乌市双捷国际货运代理有限公司",
        bankName: "中国工商银行义乌支行",
        swiftCode: "ICBKCNBJZJP",
        accountNo: "6222020202200118",
        defaultAccount: true,
      },
    ],
    contracts: [
      {
        id: "ct-001",
        contractNo: "HT20260506001",
        signDate: "2026-05-06",
        validity: "2026-05-06 ~ 2027-05-05",
        deposit: "10000",
        paymentMethod: "月结",
        contractFile: "双捷物流服务合同.pdf",
        contractStatus: "生效中",
        signSubject: "义乌运营主体",
      },
    ],
  },
  {
    id: "lp-003",
    providerId: "WL011",
    name: "深圳市以达物流有限公司",
    type: "海外仓物流商",
    address: "深圳市龙岗区坂田街道跨境电商园",
    legalRepresentative: "李倩",
    establishedAt: "2019-09-02",
    registeredCapital: "8000000",
    qualification: "海外仓服务资质",
    accountNo: "75500012009888",
    bankName: "招商银行深圳坂田支行",
    taxRegistrationNo: "91440300MA5FL9M23P",
    approvalStatus: "待提交",
    cooperationStatus: "暂停合作",
    creator: "张晓莹",
    createdAt: "2026-04-13 15:47:29",
    updater: "超级管理员",
    updatedAt: "2026-04-29 20:33:36",
    contactName: "李倩",
    contactPhone: "13900002222",
    contactMethod: "service@yida.example",
    taxAddress: "深圳市龙岗区坂田街道跨境电商园",
    settlementAccounts: [],
    contracts: [],
  },
  {
    id: "lp-004",
    providerId: "WL021",
    name: "上海港联国际报关有限公司",
    type: "国际报关行",
    address: "上海市浦东新区外高桥保税区",
    legalRepresentative: "周涛",
    establishedAt: "2017-06-20",
    registeredCapital: "3000000",
    qualification: "报关单位备案",
    accountNo: "021880088123",
    bankName: "上海银行浦东支行",
    taxRegistrationNo: "91310115MA1K3G6E7X",
    approvalStatus: "审批完成",
    cooperationStatus: "终止合作",
    creator: "周婷婷",
    createdAt: "2026-03-30 15:35:17",
    updater: "超级管理员",
    updatedAt: "2026-05-19 09:54:13",
    contactName: "周涛",
    contactPhone: "13700003333",
    contactMethod: "13700003333",
    taxAddress: "上海市浦东新区外高桥保税区",
    settlementAccounts: [],
    contracts: [],
  },
];

function emptyRange(): DateRangeValue {
  return { start: "", end: "" };
}

function uniqueOptions(values: string[]) {
  return Array.from(new Set(values)).map((value) => ({ label: value, value }));
}

function optionList(values: string[]) {
  return values.map((value) => ({ label: value, value }));
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

function statusTone(status: ApprovalStatus | CooperationStatus) {
  if (status === "审批完成" || status === "合作中") {
    return "success";
  }
  if (status === "待审批" || status === "开发中") {
    return "processing";
  }
  if (status === "暂停合作" || status === "待提交") {
    return "pending";
  }
  return "closed";
}

function SectionTitle({ children }: { children: string }) {
  return <div className="border-l-4 border-primary pl-3 font-medium text-text-primary">{children}</div>;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-small">
      <div className="text-text-secondary">{label}：</div>
      <div className="text-text-primary">{value || "-"}</div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-[112px] shrink-0 text-right text-small text-text-secondary">{label}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function LogisticsProviderForm({
  mode,
  record,
  onBack,
  onSubmit,
}: {
  mode: "create" | "edit";
  record?: LogisticsProviderRecord;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [providerName, setProviderName] = useState(record?.name ?? "");
  const [providerType, setProviderType] = useState(record?.type ?? "");
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(record?.approvalStatus ?? "待提交");
  const [cooperationStatus, setCooperationStatus] = useState<CooperationStatus>(record?.cooperationStatus ?? "开发中");
  const [settlementAccounts, setSettlementAccounts] = useState<SettlementAccount[]>(
    record?.settlementAccounts.length
      ? record.settlementAccounts
      : [
          {
            id: "new-sa-001",
            customAccountName: "",
            accountName: "",
            bankName: "",
            swiftCode: "",
            accountNo: "",
            defaultAccount: true,
          },
        ],
  );
  const [contracts, setContracts] = useState<ContractInfo[]>(
    record?.contracts.length
      ? record.contracts
      : [
          {
            id: "new-ct-001",
            contractNo: "",
            signDate: "",
            validity: "",
            deposit: "0",
            paymentMethod: "",
            contractFile: "",
            contractStatus: "生效中",
            signSubject: "",
          },
        ],
  );

  function removeSettlementAccount(id: string) {
    setSettlementAccounts((current) => current.filter((item) => item.id !== id));
  }

  function removeContract(id: string) {
    setContracts((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-4 pb-16">
      <Card>
        <SectionTitle>基本信息</SectionTitle>
        <div className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
          <FormRow label="物流商">
            <Input value={providerName} placeholder="请输入物流商" maxLength={50} onChange={(event) => setProviderName(event.target.value)} />
          </FormRow>
          <FormRow label="物流商类型">
            <Select
              value={providerType}
              placeholder="请选择物流商类型"
              options={optionList(providerTypes)}
              onValueChange={(value) => setProviderType(value as LogisticsProviderType)}
            />
          </FormRow>
          <FormRow label="资质证书">
            <Select
              value={record?.qualification ?? ""}
              placeholder="请选择资质证书"
              options={optionList(qualificationOptions)}
              onValueChange={() => undefined}
            />
          </FormRow>
          <FormRow label="法人代表">
            <Input defaultValue={record?.legalRepresentative} placeholder="请输入法人代表" maxLength={50} />
          </FormRow>
          <FormRow label="注册资本">
            <Input defaultValue={record?.registeredCapital} placeholder="请输入注册资本" maxLength={20} />
          </FormRow>
          <FormRow label="税务登记号">
            <Input defaultValue={record?.taxRegistrationNo} placeholder="请输入税务登记号" maxLength={50} />
          </FormRow>
          <FormRow label="成立时间">
            <Input type="date" defaultValue={record?.establishedAt} />
          </FormRow>
          <FormRow label="合作状态">
            <Select
              value={cooperationStatus}
              options={optionList(cooperationStatuses)}
              onValueChange={(value) => setCooperationStatus(value as CooperationStatus)}
            />
          </FormRow>
          <FormRow label="联系人">
            <Input defaultValue={record?.contactName} placeholder="请输入联系人" maxLength={50} />
          </FormRow>
          <FormRow label="联系方式">
            <Input defaultValue={record?.contactMethod} placeholder="请输入联系方式" maxLength={50} />
          </FormRow>
          <FormRow label="物流商地址">
            <Input defaultValue={record?.address} placeholder="请输入物流商地址" maxLength={200} />
          </FormRow>
          <FormRow label="审批状态">
            <Select
              value={approvalStatus}
              options={optionList(approvalStatuses)}
              onValueChange={(value) => setApprovalStatus(value as ApprovalStatus)}
            />
          </FormRow>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <SectionTitle>结算信息</SectionTitle>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              setSettlementAccounts((current) => [
                ...current,
                {
                  id: `new-sa-${current.length + 1}`,
                  customAccountName: "",
                  accountName: "",
                  bankName: "",
                  swiftCode: "",
                  accountNo: "",
                  defaultAccount: false,
                },
              ])
            }
          >
            添加收款信息
          </Button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>序号</th>
                <th className={tableHeadCell}>自定义收款账户名称</th>
                <th className={tableHeadCell}>户名</th>
                <th className={tableHeadCell}>开户行</th>
                <th className={tableHeadCell}>swift code</th>
                <th className={tableHeadCell}>账号</th>
                <th className={tableHeadCell}>默认账号</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {settlementAccounts.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3"><Input defaultValue={item.customAccountName} placeholder="请输入自定义收款账户名称" /></td>
                  <td className="px-3 py-3"><Input defaultValue={item.accountName} placeholder="请输入户名" /></td>
                  <td className="px-3 py-3"><Input defaultValue={item.bankName} placeholder="请输入开户行" /></td>
                  <td className="px-3 py-3"><Input defaultValue={item.swiftCode} placeholder="请输入swift" /></td>
                  <td className="px-3 py-3"><Input defaultValue={item.accountNo} placeholder="请输入账号" /></td>
                  <td className="px-3 py-3 text-center"><input type="radio" checked={item.defaultAccount} readOnly /></td>
                  <td className="px-3 py-3">
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => removeSettlementAccount(item.id)}>
                      移除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <SectionTitle>合同信息</SectionTitle>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              setContracts((current) => [
                ...current,
                {
                  id: `new-ct-${current.length + 1}`,
                  contractNo: "",
                  signDate: "",
                  validity: "",
                  deposit: "0",
                  paymentMethod: "",
                  contractFile: "",
                  contractStatus: "生效中",
                  signSubject: "",
                },
              ])
            }
          >
            添加合同
          </Button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>序号</th>
                <th className={tableHeadCell}>签订日期</th>
                <th className={tableHeadCell}>合同有效期</th>
                <th className={tableHeadCell}>违约金</th>
                <th className={tableHeadCell}>付款方式</th>
                <th className={tableHeadCell}>合同文件</th>
                <th className={tableHeadCell}>签约主体</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {contracts.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3"><Input type="date" defaultValue={item.signDate} /></td>
                  <td className="px-3 py-3"><Input defaultValue={item.validity} placeholder="开始日期 ~ 结束日期" /></td>
                  <td className="px-3 py-3"><Input defaultValue={item.deposit} /></td>
                  <td className="px-3 py-3"><Select value={item.paymentMethod} placeholder="请选择付款方式" options={optionList(["预付", "月结", "票结"])} onValueChange={() => undefined} /></td>
                  <td className="px-3 py-3"><Button variant="secondary" size="sm">上传文件</Button></td>
                  <td className="px-3 py-3"><Select value={item.signSubject} placeholder="请选择签约主体" options={optionList(["义乌运营主体", "深圳运营主体", "宁波运营主体"])} onValueChange={() => undefined} /></td>
                  <td className="px-3 py-3">
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => removeContract(item.id)}>
                      移除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center gap-3 border-t border-border bg-white px-6 py-3 shadow-lg">
        <Button variant="secondary" size="sm" onClick={onBack}>取消</Button>
        <Button variant="secondary" size="sm" onClick={onSubmit}>{mode === "create" ? "保存" : "保存修改"}</Button>
        <Button variant="primary" size="sm" onClick={onSubmit}>提交</Button>
      </div>
    </div>
  );
}

function LogisticsProviderDetail({
  record,
  onBack,
  onEdit,
  onSubmit,
}: {
  record: LogisticsProviderRecord;
  onBack: () => void;
  onEdit: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <span className="text-title font-semibold">{record.providerId}</span>
            <Badge tone={statusTone(record.cooperationStatus)}>{record.cooperationStatus}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onBack}>关闭</Button>
            <Button variant="secondary" size="sm" onClick={onEdit}>编辑</Button>
            <Button variant="primary" size="sm" onClick={onSubmit}>提交</Button>
          </div>
        </div>
        <div className="mt-4">
          <SectionTitle>基本信息</SectionTitle>
          <div className="mt-4 grid gap-x-10 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
            <InfoItem label="物流商ID" value={record.providerId} />
            <InfoItem label="物流商" value={record.name} />
            <InfoItem label="物流商类型" value={record.type} />
            <InfoItem label="联系人" value={record.contactName} />
            <InfoItem label="法人代表" value={record.legalRepresentative} />
            <InfoItem label="联系方式" value={record.contactMethod} />
            <InfoItem label="成立时间" value={record.establishedAt} />
            <InfoItem label="税务登记号" value={record.taxRegistrationNo} />
            <InfoItem label="注册资本" value={record.registeredCapital} />
            <InfoItem label="资质证书" value={record.qualification} />
            <InfoItem label="合作状态" value={record.cooperationStatus} />
            <InfoItem label="审批状态" value={record.approvalStatus} />
            <InfoItem label="物流商地址" value={record.address} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>结算信息</SectionTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>序号</th>
                <th className={tableHeadCell}>自定义收款账户名称</th>
                <th className={tableHeadCell}>户名</th>
                <th className={tableHeadCell}>开户行</th>
                <th className={tableHeadCell}>swift code</th>
                <th className={tableHeadCell}>账号</th>
                <th className={tableHeadCell}>默认账号</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {record.settlementAccounts.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3">{item.customAccountName}</td>
                  <td className="px-3 py-3">{item.accountName}</td>
                  <td className="px-3 py-3">{item.bankName}</td>
                  <td className="px-3 py-3">{item.swiftCode}</td>
                  <td className="px-3 py-3">{item.accountNo}</td>
                  <td className="px-3 py-3">{item.defaultAccount ? "是" : "否"}</td>
                </tr>
              ))}
              {record.settlementAccounts.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-text-muted" colSpan={7}>暂无数据</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle>合同信息</SectionTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>序号</th>
                <th className={tableHeadCell}>合同编号</th>
                <th className={tableHeadCell}>签订日期</th>
                <th className={tableHeadCell}>合同有效期</th>
                <th className={tableHeadCell}>违约金</th>
                <th className={tableHeadCell}>付款方式</th>
                <th className={tableHeadCell}>合同文件</th>
                <th className={tableHeadCell}>合同状态</th>
                <th className={tableHeadCell}>签约主体</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {record.contracts.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3">{item.contractNo}</td>
                  <td className="px-3 py-3">{item.signDate}</td>
                  <td className="px-3 py-3">{item.validity}</td>
                  <td className="px-3 py-3">{item.deposit}</td>
                  <td className="px-3 py-3">{item.paymentMethod}</td>
                  <td className="px-3 py-3">{item.contractFile}</td>
                  <td className="px-3 py-3">{item.contractStatus}</td>
                  <td className="px-3 py-3">{item.signSubject}</td>
                </tr>
              ))}
              {record.contracts.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-text-muted" colSpan={9}>暂无数据</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

type LogisticsProviderWorkspaceTab =
  | "logistics-provider"
  | "logistics-provider-create"
  | "logistics-provider-edit"
  | "logistics-provider-detail";

export function LogisticsProviderPage({
  resetKey = 0,
  activeWorkspaceTab = "logistics-provider",
  onOpenWorkspaceTab,
}: {
  resetKey?: number;
  activeWorkspaceTab?: string;
  onOpenWorkspaceTab?: (tab: LogisticsProviderWorkspaceTab) => void;
}) {
  const [view, setView] = useState<"list" | "create" | "edit" | "detail">("list");
  const [activeRecordId, setActiveRecordId] = useState(logisticsProviderRecords[0]?.id ?? "");
  const [approvalFilter, setApprovalFilter] = useState<string[]>([]);
  const [cooperationFilter, setCooperationFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [qualification, setQualification] = useState("");
  const [timeType, setTimeType] = useState("created");
  const [timeRange, setTimeRange] = useState<DateRangeValue>(emptyRange());
  const [providerIdKeyword, setProviderIdKeyword] = useState("");
  const [providerKeyword, setProviderKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const qualificationSelectOptions = useMemo(
    () => [{ label: "全部资质证书", value: "" }, ...uniqueOptions(logisticsProviderRecords.map((record) => record.qualification))],
    [],
  );

  const filteredRecords = useMemo(() => {
    return logisticsProviderRecords.filter((record) => {
      const matchesApproval = approvalFilter.length === 0 || approvalFilter.includes(record.approvalStatus);
      const matchesCooperation = cooperationFilter.length === 0 || cooperationFilter.includes(record.cooperationStatus);
      const matchesType = typeFilter.length === 0 || typeFilter.includes(record.type);
      const matchesQualification = !qualification || record.qualification === qualification;
      const timeValue = timeType === "updated" ? record.updatedAt : record.createdAt;
      const matchesTime = inDateRange(timeValue, timeRange);
      const matchesProviderId = !providerIdKeyword.trim() || record.providerId === providerIdKeyword.trim();
      const matchesProvider = !providerKeyword.trim() || record.name === providerKeyword.trim();
      return (
        matchesApproval &&
        matchesCooperation &&
        matchesType &&
        matchesQualification &&
        matchesTime &&
        matchesProviderId &&
        matchesProvider
      );
    });
  }, [approvalFilter, cooperationFilter, providerIdKeyword, providerKeyword, qualification, timeRange, timeType, typeFilter]);

  const totalPages = Math.max(Math.ceil(filteredRecords.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeRecord = logisticsProviderRecords.find((record) => record.id === activeRecordId) ?? logisticsProviderRecords[0];

  useEffect(() => {
    setView("list");
  }, [resetKey]);

  useEffect(() => {
    if (activeWorkspaceTab === "logistics-provider") {
      setView("list");
    }
    if (activeWorkspaceTab === "logistics-provider-create") {
      setView("create");
    }
    if (activeWorkspaceTab === "logistics-provider-edit") {
      setView("edit");
    }
    if (activeWorkspaceTab === "logistics-provider-detail") {
      setView("detail");
    }
  }, [activeWorkspaceTab]);

  function resetFilters() {
    setApprovalFilter([]);
    setCooperationFilter([]);
    setTypeFilter([]);
    setQualification("");
    setTimeType("created");
    setTimeRange(emptyRange());
    setProviderIdKeyword("");
    setProviderKeyword("");
    setPage(1);
  }

  function openDetail(record: LogisticsProviderRecord) {
    setActiveRecordId(record.id);
    setView("detail");
    onOpenWorkspaceTab?.("logistics-provider-detail");
  }

  function openEdit(record: LogisticsProviderRecord) {
    setActiveRecordId(record.id);
    setView("edit");
    onOpenWorkspaceTab?.("logistics-provider-edit");
  }

  if (view === "create") {
    return (
      <LogisticsProviderForm
        mode="create"
        onBack={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-provider");
        }}
        onSubmit={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-provider");
        }}
      />
    );
  }

  if (view === "edit" && activeRecord) {
    return (
      <LogisticsProviderForm
        mode="edit"
        record={activeRecord}
        onBack={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-provider");
        }}
        onSubmit={() => {
          setView("detail");
          onOpenWorkspaceTab?.("logistics-provider-detail");
        }}
      />
    );
  }

  if (view === "detail" && activeRecord) {
    return (
      <LogisticsProviderDetail
        record={activeRecord}
          onBack={() => {
            setView("list");
            onOpenWorkspaceTab?.("logistics-provider");
          }}
        onEdit={() => {
          setView("edit");
          onOpenWorkspaceTab?.("logistics-provider-edit");
        }}
          onSubmit={() => {
            setView("list");
            onOpenWorkspaceTab?.("logistics-provider");
          }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <ExclusiveFilterGroup>
        <div className="flex flex-wrap items-center gap-3">
          <MultiSelectFilter
            placeholder="审批状态"
            options={optionList(approvalStatuses)}
            value={approvalFilter}
            onChange={(value) => {
              setApprovalFilter(value);
              setPage(1);
            }}
          />
          <MultiSelectFilter
            placeholder="合作状态"
            options={optionList(cooperationStatuses)}
            value={cooperationFilter}
            onChange={(value) => {
              setCooperationFilter(value);
              setPage(1);
            }}
          />
          <MultiSelectFilter
            placeholder="物流商类型"
            options={optionList(providerTypes)}
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
          />
          <Select className="w-[180px]" options={qualificationSelectOptions} value={qualification} placeholder="资质证书" onValueChange={(value) => {
            setQualification(value);
            setPage(1);
          }} />
          <Select
            className="w-[128px]"
            value={timeType}
            onValueChange={setTimeType}
            options={[
              { label: "创建时间", value: "created" },
              { label: "更新时间", value: "updated" },
            ]}
          />
          <DateRangePicker value={timeRange} onChange={(value) => {
            setTimeRange(value);
            setPage(1);
          }} />
          <Input className="w-[160px]" placeholder="物流商ID" value={providerIdKeyword} onChange={(event) => setProviderIdKeyword(event.target.value)} />
          <Input className="w-[220px]" placeholder="物流商" value={providerKeyword} onChange={(event) => setProviderKeyword(event.target.value)} />
          <Button variant="primary" size="sm">查询</Button>
          <Button variant="secondary" size="sm" onClick={resetFilters}>重置</Button>
        </div>
        </ExclusiveFilterGroup>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setView("create");
              onOpenWorkspaceTab?.("logistics-provider-create");
            }}
          >
            添加物流商
          </Button>
          <Button variant="secondary" size="sm">导出</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[2300px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>物流商ID</th>
                <th className={tableHeadCell}>物流商</th>
                <th className={tableHeadCell}>物流商类型</th>
                <th className={tableHeadCell}>物流商地址</th>
                <th className={tableHeadCell}>法人代表</th>
                <th className={tableHeadCell}>成立时间</th>
                <th className={tableHeadCell}>注册资本</th>
                <th className={tableHeadCell}>资质证书</th>
                <th className={tableHeadCell}>账号</th>
                <th className={tableHeadCell}>开户行</th>
                <th className={tableHeadCell}>税务登记号</th>
                <th className={tableHeadCell}>合作状态</th>
                <th className={tableHeadCell}>创建人/创建时间</th>
                <th className={tableHeadCell}>更新人/更新时间</th>
                <th className={tableHeadCell}>审批状态</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-primary">{record.providerId}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.name}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.type}</td>
                  <td className="max-w-[260px] truncate px-3 py-3" title={record.address}>{record.address}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.legalRepresentative}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.establishedAt}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.registeredCapital}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.qualification}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.accountNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.bankName}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.taxRegistrationNo}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <Badge tone={statusTone(record.cooperationStatus)}>{record.cooperationStatus}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.creator}</div>
                    <div className="text-text-muted">{record.createdAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.updater}</div>
                    <div className="text-text-muted">{record.updatedAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <Badge tone={statusTone(record.approvalStatus)}>{record.approvalStatus}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button type="button" className="mr-3 border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openDetail(record)}>
                      详情
                    </button>
                    <button type="button" className="mr-3 border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openEdit(record)}>
                      编辑
                    </button>
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openDetail(record)}>
                      提交
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalCount={filteredRecords.length}
          pageSize={pageSize}
          showTopBorder
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(1);
          }}
        />
      </Card>
    </div>
  );
}
