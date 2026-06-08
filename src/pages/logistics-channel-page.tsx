import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Pagination } from "../components/ui/pagination";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

type LogisticsChannelStatus = "启用" | "禁用";

type LogisticsChannelRecord = {
  id: string;
  channelId: string;
  logisticsProvider: string;
  providerChannelId: string;
  providerChannelName: string;
  transportMode: string;
  routeLine: string;
  agingDays: number;
  volumeFactor: string;
  remark: string;
  carrierPartners: string[];
  feeSegments: string[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  status: LogisticsChannelStatus;
};

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";

const logisticsChannelRecords: LogisticsChannelRecord[] = [
  {
    id: "lc-001",
    channelId: "WL011",
    logisticsProvider: "深圳市以达物流有限公司(谷仓海外仓)",
    providerChannelId: "EPP-USA-001",
    providerChannelName: "易可达标准",
    transportMode: "海运",
    routeLine: "美国-加州洛杉矶-希尔顿",
    agingDays: 66,
    volumeFactor: "6000",
    remark: "谷仓海外仓标准渠道",
    carrierPartners: ["深圳以达", "美西卡车派送", "USPS尾程"],
    feeSegments: ["国内揽收费-深圳以达", "美西卡派费-美西卡车派送", "尾程派送费-USPS尾程"],
    createdBy: "张晓莹",
    createdAt: "2026-04-13 15:47:29",
    updatedBy: "兰轩",
    updatedAt: "2026-06-05 15:01:26",
    status: "启用",
  },
  {
    id: "lc-002",
    channelId: "WL001",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    providerChannelId: "EPP-USA-002",
    providerChannelName: "双捷海运",
    transportMode: "海运",
    routeLine: "美国-加州洛杉矶-希尔顿、美国-休斯顿",
    agingDays: 21,
    volumeFactor: "6000",
    remark: "美南海运标快",
    carrierPartners: ["义乌双捷", "美森快船", "FedEx尾程"],
    feeSegments: ["国内操作费-义乌双捷", "干线海运费-美森快船", "尾程派送费-FedEx尾程"],
    createdBy: "兰轩",
    createdAt: "2026-05-06 14:37:38",
    updatedBy: "兰轩",
    updatedAt: "2026-06-05 15:01:34",
    status: "启用",
  },
  {
    id: "lc-003",
    channelId: "WL002",
    logisticsProvider: "宁波赛蓝供应链服务有限公司",
    providerChannelId: "EPP-USA-004",
    providerChannelName: "宁波赛蓝",
    transportMode: "海运",
    routeLine: "美国-加州洛杉矶-希尔顿、美国-纽约",
    agingDays: 222,
    volumeFactor: "5000",
    remark: "宁波赛蓝海运渠道",
    carrierPartners: ["宁波赛蓝", "Matson", "海外仓卡派"],
    feeSegments: ["起运港操作费-宁波赛蓝", "干线运费-Matson", "海外仓卡派费-海外仓卡派"],
    createdBy: "兰轩",
    createdAt: "2026-05-07 17:27:13",
    updatedBy: "兰轩",
    updatedAt: "2026-06-05 15:00:50",
    status: "启用",
  },
  {
    id: "lc-004",
    channelId: "WL001",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    providerChannelId: "EPP-USA-003",
    providerChannelName: "海运联运",
    transportMode: "海运",
    routeLine: "美国-加州洛杉矶-希尔顿、美国-纽约",
    agingDays: 21,
    volumeFactor: "6000",
    remark: "多段联运渠道",
    carrierPartners: ["义乌双捷", "美西港口服务商", "UPS尾程"],
    feeSegments: ["国内集货费-义乌双捷", "港口处理费-美西港口服务商", "尾程派送费-UPS尾程"],
    createdBy: "兰轩",
    createdAt: "2026-05-07 14:50:46",
    updatedBy: "兰轩",
    updatedAt: "2026-05-28 11:20:42",
    status: "启用",
  },
  {
    id: "lc-005",
    channelId: "WL001",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    providerChannelId: "EPP-CAN-001",
    providerChannelName: "紫式",
    transportMode: "海运",
    routeLine: "加拿大-大多伦多配送线路、温哥华线路",
    agingDays: 1,
    volumeFactor: "5000",
    remark: "加拿大本地配送",
    carrierPartners: ["义乌双捷", "加拿大清关行", "本地卡派"],
    feeSegments: ["国内操作费-义乌双捷", "清关服务费-加拿大清关行", "本地配送费-本地卡派"],
    createdBy: "超级管理员",
    createdAt: "2026-05-19 09:54:13",
    updatedBy: "超级管理员",
    updatedAt: "2026-05-19 09:54:13",
    status: "启用",
  },
  {
    id: "lc-006",
    channelId: "WL001",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    providerChannelId: "EXP-USA-001",
    providerChannelName: "单快",
    transportMode: "快递",
    routeLine: "美国-纽约州-纽约市",
    agingDays: 7,
    volumeFactor: "6000",
    remark: "DHL快递渠道",
    carrierPartners: ["义乌双捷", "DHL Express"],
    feeSegments: ["国内揽收费-义乌双捷", "国际快递费-DHL Express"],
    createdBy: "李莎丽",
    createdAt: "2026-03-30 13:14:16",
    updatedBy: "超级管理员",
    updatedAt: "2026-04-29 20:33:36",
    status: "启用",
  },
  {
    id: "lc-007",
    channelId: "WL013",
    logisticsProvider: "浙江融盛国际物流有限公司",
    providerChannelId: "EXP-USA-003",
    providerChannelName: "特快",
    transportMode: "快递",
    routeLine: "美国-加州洛杉矶-希尔顿",
    agingDays: 8,
    volumeFactor: "6000",
    remark: "UPS特快渠道",
    carrierPartners: ["浙江融盛", "UPS Express"],
    feeSegments: ["国内操作费-浙江融盛", "国际快递费-UPS Express"],
    createdBy: "周婷婷",
    createdAt: "2026-03-30 15:35:17",
    updatedBy: "超级管理员",
    updatedAt: "2026-04-29 17:43:50",
    status: "启用",
  },
  {
    id: "lc-008",
    channelId: "WL001",
    logisticsProvider: "义乌市双捷国际货运代理有限公司",
    providerChannelId: "EXP-USA-002",
    providerChannelName: "绿卡",
    transportMode: "快递",
    routeLine: "美国-加州洛杉矶-希尔顿",
    agingDays: 8,
    volumeFactor: "6000",
    remark: "快递禁用渠道",
    carrierPartners: ["义乌双捷", "FedEx", "USPS尾程"],
    feeSegments: ["国内集货费-义乌双捷", "干线快递费-FedEx", "尾程派送费-USPS尾程"],
    createdBy: "周婷婷",
    createdAt: "2026-03-30 15:35:17",
    updatedBy: "超级管理员",
    updatedAt: "2026-04-13 16:10:03",
    status: "禁用",
  },
];

const transportModeOptions = [
  { label: "全部运输方式", value: "all" },
  { label: "海运", value: "海运" },
  { label: "快递", value: "快递" },
  { label: "空运", value: "空运" },
];

const statusOptions = [
  { label: "全部状态", value: "all" },
  { label: "启用", value: "启用" },
  { label: "禁用", value: "禁用" },
];

const channelStatusOptions = [
  { label: "启用", value: "启用" },
  { label: "禁用", value: "禁用" },
];

const providerOptions = [
  { label: "义乌市双捷国际货运代理有限公司", value: "义乌市双捷国际货运代理有限公司" },
  { label: "浙江融盛国际物流有限公司", value: "浙江融盛国际物流有限公司" },
  { label: "深圳市以达物流有限公司(谷仓海外仓)", value: "深圳市以达物流有限公司(谷仓海外仓)" },
  { label: "宁波赛蓝供应链服务有限公司", value: "宁波赛蓝供应链服务有限公司" },
];

const routeTree = [
  {
    country: "加拿大（CAN）",
    provinces: [
      { name: "不列颠哥伦比亚省（BC）", cities: ["温哥华", "本拿比", "列治文"] },
      { name: "安大略省（ON）", cities: ["多伦多", "渥太华"] },
      { name: "魁北克省（QC）", cities: ["蒙特利尔"] },
    ],
  },
  {
    country: "德国（DEU）",
    provinces: [
      { name: "北莱茵-威斯特法伦州", cities: ["科隆", "杜塞尔多夫"] },
      { name: "巴伐利亚州", cities: ["慕尼黑", "纽伦堡"] },
    ],
  },
  {
    country: "英国（GBR）",
    provinces: [
      { name: "英格兰", cities: ["伦敦", "曼彻斯特"] },
      { name: "苏格兰", cities: ["爱丁堡"] },
    ],
  },
  {
    country: "美国（USA）",
    provinces: [
      { name: "加利福尼亚州（CA）", cities: ["洛杉矶", "希尔顿", "旧金山"] },
      { name: "纽约州（NY）", cities: ["纽约市", "布法罗"] },
      { name: "德克萨斯州（TX）", cities: ["休斯顿", "达拉斯"] },
    ],
  },
];

function buildOptions(values: string[], allLabel: string) {
  return [
    { label: allLabel, value: "all" },
    ...Array.from(new Set(values)).map((value) => ({ label: value, value })),
  ];
}

function optionList(values: string[]) {
  return values.map((value) => ({ label: value, value }));
}

function statusTone(status: LogisticsChannelStatus) {
  return status === "启用" ? "success" : "closed";
}

function SectionTitle({ children }: { children: string }) {
  return <div className="border-l-4 border-primary pl-3 font-medium text-text-primary">{children}</div>;
}

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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 text-small">
      <div className="text-text-secondary">{label}</div>
      <div className="text-text-primary">{value || "-"}</div>
    </div>
  );
}

function RouteSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeCountry, setActiveCountry] = useState(routeTree[0].country);
  const country = routeTree.find((item) => item.country === activeCountry) ?? routeTree[0];
  const [activeProvince, setActiveProvince] = useState(country.provinces[0].name);
  const province = country.provinces.find((item) => item.name === activeProvince) ?? country.provinces[0];
  const selectedRoutes = value ? value.split("、").filter(Boolean) : [];

  function toggleRoute(route: string) {
    const next = selectedRoutes.includes(route)
      ? selectedRoutes.filter((item) => item !== route)
      : [...selectedRoutes, route];
    onChange(next.join("、"));
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="field-control flex w-full items-center justify-between text-left"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={value ? "truncate text-text-primary" : "truncate text-text-placeholder"}>
          {value || "请选择区域路线"}
        </span>
        <span className="text-text-muted">{open ? "⌃" : "⌄"}</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-50 grid w-[720px] grid-cols-3 rounded-md border border-border bg-white shadow-lg">
          <div className="max-h-[260px] overflow-auto border-r border-border py-2">
            {routeTree.map((item) => (
              <button
                key={item.country}
                type="button"
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-small hover:bg-bg-hover ${
                  item.country === activeCountry ? "font-medium text-primary" : "text-text-primary"
                }`}
                onClick={() => {
                  setActiveCountry(item.country);
                  setActiveProvince(item.provinces[0].name);
                }}
              >
                <span><input type="checkbox" className="mr-2" readOnly />{item.country}</span>
                <span>›</span>
              </button>
            ))}
          </div>
          <div className="max-h-[260px] overflow-auto border-r border-border py-2">
            {country.provinces.map((item) => (
              <button
                key={item.name}
                type="button"
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-small hover:bg-bg-hover ${
                  item.name === activeProvince ? "font-medium text-primary" : "text-text-primary"
                }`}
                onClick={() => setActiveProvince(item.name)}
              >
                <span><input type="checkbox" className="mr-2" readOnly />{item.name}</span>
                <span>›</span>
              </button>
            ))}
          </div>
          <div className="max-h-[260px] overflow-auto py-2">
            {province.cities.map((city) => {
              const route = `${activeCountry.replace(/（.*）/, "")}-${province.name.replace(/（.*）/, "")}-${city}`;
              return (
                <label key={city} className="flex cursor-pointer items-center px-4 py-2 text-small hover:bg-bg-hover">
                  <input type="checkbox" className="mr-2" checked={selectedRoutes.includes(route)} onChange={() => toggleRoute(route)} />
                  {city}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LogisticsChannelForm({
  mode,
  record,
  onBack,
  onSubmit,
}: {
  mode: "create" | "edit";
  record?: LogisticsChannelRecord;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [logisticsProvider, setLogisticsProvider] = useState(record?.logisticsProvider ?? "");
  const [channelName, setChannelName] = useState(record?.providerChannelName ?? "");
  const [transportMode, setTransportMode] = useState(record?.transportMode ?? "");
  const [routeLine, setRouteLine] = useState(record?.routeLine ?? "");
  const [status, setStatus] = useState<LogisticsChannelStatus>(record?.status ?? "启用");
  const [remark, setRemark] = useState(record?.remark ?? "");
  const [serviceRows, setServiceRows] = useState(() => {
    const partners = record?.carrierPartners.length ? record.carrierPartners : [""];
    return partners.map((partner, index) => ({
      id: `service-${index + 1}`,
      partner,
      serviceLink: ["国内揽收", "干线运输", "清关", "尾程派送"][index] ?? "",
      feeSegment: record?.feeSegments[index] ?? "",
      remark: "",
    }));
  });

  return (
    <div className="space-y-4 pb-16">
      <Card>
        <SectionTitle>基本信息</SectionTitle>
        <div className="mt-4 grid gap-x-10 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <FormRow label="物流商" required>
            <Select value={logisticsProvider} placeholder="请选择物流商" options={providerOptions} onValueChange={setLogisticsProvider} />
          </FormRow>
          <FormRow label="物流渠道" required>
            <Input value={channelName} placeholder="请输入物流渠道" maxLength={50} onChange={(event) => setChannelName(event.target.value)} />
          </FormRow>
          <FormRow label="物流周期" required>
            <div className="flex">
              <Input defaultValue={record?.agingDays ? String(record.agingDays) : ""} placeholder="请输入物流周期" />
              <span className="inline-flex h-input-md items-center border border-l-0 border-border bg-bg-page px-3 text-text-secondary">天</span>
            </div>
          </FormRow>
          <FormRow label="运输方式" required>
            <Select value={transportMode} placeholder="请选择运输方式" options={transportModeOptions.filter((item) => item.value !== "all")} onValueChange={setTransportMode} />
          </FormRow>
          <FormRow label="区域路线" required>
            <RouteSelector value={routeLine} onChange={setRouteLine} />
          </FormRow>
          <FormRow label="状态" required>
            <Select value={status} options={channelStatusOptions} onValueChange={(value) => setStatus(value as LogisticsChannelStatus)} />
          </FormRow>
          <FormRow label="材积参数" required>
            <Input defaultValue={record?.volumeFactor} placeholder="请输入材积参数" />
          </FormRow>
          <FormRow label="备注">
            <Textarea className="min-h-[72px]" maxLength={1000} value={remark} placeholder="请输入备注" onChange={(event) => setRemark(event.target.value)} />
          </FormRow>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <SectionTitle>服务商配置</SectionTitle>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              setServiceRows((current) => [
                ...current,
                { id: `service-${current.length + 1}`, partner: "", serviceLink: "", feeSegment: "", remark: "" },
              ])
            }
          >
            添加服务商
          </Button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>序号</th>
                <th className={tableHeadCell}>服务商</th>
                <th className={tableHeadCell}>服务环节</th>
                <th className={tableHeadCell}>计费分段</th>
                <th className={tableHeadCell}>备注</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {serviceRows.map((row, index) => (
                <tr key={row.id}>
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3">
                    <Input value={row.partner} placeholder="请输入服务商" onChange={(event) => setServiceRows((current) => current.map((item) => item.id === row.id ? { ...item, partner: event.target.value } : item))} />
                  </td>
                  <td className="px-3 py-3">
                    <Select value={row.serviceLink} placeholder="请选择服务环节" options={optionList(["国内揽收", "干线运输", "清关", "尾程派送"])} onValueChange={(value) => setServiceRows((current) => current.map((item) => item.id === row.id ? { ...item, serviceLink: value } : item))} />
                  </td>
                  <td className="px-3 py-3">
                    <Input value={row.feeSegment} placeholder="请输入计费分段" onChange={(event) => setServiceRows((current) => current.map((item) => item.id === row.id ? { ...item, feeSegment: event.target.value } : item))} />
                  </td>
                  <td className="px-3 py-3">
                    <Input value={row.remark} placeholder="请输入备注" onChange={(event) => setServiceRows((current) => current.map((item) => item.id === row.id ? { ...item, remark: event.target.value } : item))} />
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      className="border-0 bg-transparent p-0 text-primary hover:underline disabled:text-text-placeholder disabled:no-underline"
                      disabled={serviceRows.length === 1}
                      onClick={() => setServiceRows((current) => current.length === 1 ? current : current.filter((item) => item.id !== row.id))}
                    >
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
        <Button variant="primary" size="sm" onClick={onSubmit}>{mode === "create" ? "确定" : "保存"}</Button>
      </div>
    </div>
  );
}

function LogisticsChannelDetail({
  record,
  onBack,
  onEdit,
}: {
  record: LogisticsChannelRecord;
  onBack: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <span className="text-title font-semibold">{record.providerChannelName}</span>
            <Badge tone={statusTone(record.status)}>{record.status}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onBack}>关闭</Button>
            <Button variant="primary" size="sm" onClick={onEdit}>编辑</Button>
          </div>
        </div>
        <div className="mt-4">
          <SectionTitle>基本信息</SectionTitle>
          <div className="mt-4 grid gap-x-10 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
            <InfoItem label="物流渠道ID" value={record.channelId} />
            <InfoItem label="物流商" value={record.logisticsProvider} />
            <InfoItem label="物流渠道" value={record.providerChannelName} />
            <InfoItem label="运输方式" value={record.transportMode} />
            <InfoItem label="区域路线" value={record.routeLine} />
            <InfoItem label="物流周期" value={`${record.agingDays}天`} />
            <InfoItem label="材积参数" value={record.volumeFactor} />
            <InfoItem label="状态" value={record.status} />
            <InfoItem label="备注" value={record.remark} />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>服务商配置</SectionTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>序号</th>
                <th className={tableHeadCell}>服务商</th>
                <th className={tableHeadCell}>服务环节</th>
                <th className={tableHeadCell}>计费分段</th>
                <th className={tableHeadCell}>备注</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {record.carrierPartners.map((partner, index) => (
                <tr key={`${partner}-${index}`}>
                  <td className="px-3 py-3">{index + 1}</td>
                  <td className="px-3 py-3">{partner}</td>
                  <td className="px-3 py-3">{["国内揽收", "干线运输", "清关", "尾程派送"][index] ?? "尾程派送"}</td>
                  <td className="px-3 py-3">{record.feeSegments[index] ?? "-"}</td>
                  <td className="px-3 py-3">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

type LogisticsChannelWorkspaceTab =
  | "logistics-channel"
  | "logistics-channel-create"
  | "logistics-channel-edit"
  | "logistics-channel-detail";

export function LogisticsChannelPage({
  resetKey = 0,
  activeWorkspaceTab = "logistics-channel",
  onOpenWorkspaceTab,
}: {
  resetKey?: number;
  activeWorkspaceTab?: string;
  onOpenWorkspaceTab?: (tab: LogisticsChannelWorkspaceTab) => void;
}) {
  const [view, setView] = useState<"list" | "create" | "edit" | "detail">("list");
  const [activeRecordId, setActiveRecordId] = useState(logisticsChannelRecords[0]?.id ?? "");
  const [channelName, setChannelName] = useState("all");
  const [channelId, setChannelId] = useState("all");
  const [transportMode, setTransportMode] = useState("all");
  const [routeLine, setRouteLine] = useState("all");
  const [logisticsCycle, setLogisticsCycle] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const channelNameOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => record.providerChannelName), "全部物流渠道"),
    [],
  );
  const channelIdOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => record.channelId), "全部物流渠道ID"),
    [],
  );
  const routeLineOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => record.routeLine), "全部区域路线"),
    [],
  );
  const logisticsCycleOptions = useMemo(
    () => buildOptions(logisticsChannelRecords.map((record) => `${record.agingDays}天`), "全部物流周期"),
    [],
  );

  const filteredRecords = useMemo(() => {
    return logisticsChannelRecords.filter((record) => {
      const matchesChannelName = channelName === "all" || record.providerChannelName === channelName;
      const matchesChannelId = channelId === "all" || record.channelId === channelId;
      const matchesTransport = transportMode === "all" || record.transportMode === transportMode;
      const matchesRouteLine = routeLine === "all" || record.routeLine === routeLine;
      const matchesLogisticsCycle = logisticsCycle === "all" || `${record.agingDays}天` === logisticsCycle;
      const matchesStatus = status === "all" || record.status === status;

      return (
        matchesChannelName &&
        matchesChannelId &&
        matchesTransport &&
        matchesRouteLine &&
        matchesLogisticsCycle &&
        matchesStatus
      );
    });
  }, [channelId, channelName, logisticsCycle, routeLine, status, transportMode]);

  const totalPages = Math.max(Math.ceil(filteredRecords.length / pageSize), 1);
  const safePage = Math.min(page, totalPages);
  const pagedRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize);
  const activeRecord = logisticsChannelRecords.find((record) => record.id === activeRecordId) ?? logisticsChannelRecords[0];

  useEffect(() => {
    setView("list");
  }, [resetKey]);

  useEffect(() => {
    if (activeWorkspaceTab === "logistics-channel") {
      setView("list");
    }
    if (activeWorkspaceTab === "logistics-channel-create") {
      setView("create");
    }
    if (activeWorkspaceTab === "logistics-channel-edit") {
      setView("edit");
    }
    if (activeWorkspaceTab === "logistics-channel-detail") {
      setView("detail");
    }
  }, [activeWorkspaceTab]);

  function resetFilters() {
    setChannelName("all");
    setChannelId("all");
    setTransportMode("all");
    setRouteLine("all");
    setLogisticsCycle("all");
    setStatus("all");
    setPage(1);
  }

  function openDetail(record: LogisticsChannelRecord) {
    setActiveRecordId(record.id);
    setView("detail");
    onOpenWorkspaceTab?.("logistics-channel-detail");
  }

  function openEdit(record: LogisticsChannelRecord) {
    setActiveRecordId(record.id);
    setView("edit");
    onOpenWorkspaceTab?.("logistics-channel-edit");
  }

  if (view === "create") {
    return (
      <LogisticsChannelForm
        mode="create"
        onBack={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-channel");
        }}
        onSubmit={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-channel");
        }}
      />
    );
  }

  if (view === "edit" && activeRecord) {
    return (
      <LogisticsChannelForm
        mode="edit"
        record={activeRecord}
        onBack={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-channel");
        }}
        onSubmit={() => {
          setView("detail");
          onOpenWorkspaceTab?.("logistics-channel-detail");
        }}
      />
    );
  }

  if (view === "detail" && activeRecord) {
    return (
      <LogisticsChannelDetail
        record={activeRecord}
        onBack={() => {
          setView("list");
          onOpenWorkspaceTab?.("logistics-channel");
        }}
        onEdit={() => {
          setView("edit");
          onOpenWorkspaceTab?.("logistics-channel-edit");
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Select className="w-[180px]" options={channelNameOptions} value={channelName} onValueChange={(value) => {
            setChannelName(value);
            setPage(1);
          }} />
          <Select className="w-[180px]" options={channelIdOptions} value={channelId} onValueChange={(value) => {
            setChannelId(value);
            setPage(1);
          }} />
          <Select className="w-[160px]" options={statusOptions} value={status} onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }} />
          <Select className="w-[160px]" options={transportModeOptions} value={transportMode} onValueChange={(value) => {
            setTransportMode(value);
            setPage(1);
          }} />
          <Select className="w-[220px]" options={routeLineOptions} value={routeLine} onValueChange={(value) => {
            setRouteLine(value);
            setPage(1);
          }} />
          <Select className="w-[180px]" options={logisticsCycleOptions} value={logisticsCycle} onValueChange={(value) => {
            setLogisticsCycle(value);
            setPage(1);
          }} />
          <Button variant="primary" size="sm">查询</Button>
          <Button variant="secondary" size="sm" onClick={resetFilters}>重置</Button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setView("create");
                onOpenWorkspaceTab?.("logistics-channel-create");
              }}
            >
              添加物流渠道
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm">导出</Button>
            <Button variant="secondary" size="sm">列设置</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left text-small">
            <thead className="bg-bg-page text-text-muted">
              <tr>
                <th className={tableHeadCell}>物流渠道</th>
                <th className={tableHeadCell}>物流渠道ID</th>
                <th className={tableHeadCell}>运输方式</th>
                <th className={tableHeadCell}>区域路线</th>
                <th className={tableHeadCell}>物流周期</th>
                <th className={tableHeadCell}>创建人/创建时间</th>
                <th className={tableHeadCell}>更新人/更新时间</th>
                <th className={tableHeadCell}>状态</th>
                <th className={tableHeadCell}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {pagedRecords.map((record) => (
                <tr key={record.id}>
                  <td className="whitespace-nowrap px-3 py-3">{record.providerChannelName}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.channelId}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.transportMode}</td>
                  <td className="max-w-[260px] truncate px-3 py-3" title={record.routeLine}>{record.routeLine}</td>
                  <td className="whitespace-nowrap px-3 py-3">{record.agingDays}天</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.createdBy}</div>
                    <div className="text-text-muted">{record.createdAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div>{record.updatedBy}</div>
                    <div className="text-text-muted">{record.updatedAt}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{record.status}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <button type="button" className="mr-2 border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openDetail(record)}>
                      详情
                    </button>
                    <button type="button" className="border-0 bg-transparent p-0 text-primary hover:underline" onClick={() => openEdit(record)}>
                      编辑
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
