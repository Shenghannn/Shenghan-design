export type PayStatus = "未付清" | "已付清";

export type LogisticsPaymentFeeDetail = {
  id: string;
  feeTypeName: string;
  feeAmount: number;
  payableAmount: number;
  paidAmount: number;
  applyingAmount: number;
  notApplyAmount: number;
  currentApplyAmount: string;
  currentDiscountAmount: string;
};

/** 费用分组行，其下挂费用类型明细 */
export type LogisticsPaymentServiceLink = {
  id: string;
  serviceLinkName: string;
  feeAmount: number;
  payableAmount: number;
  paidAmount: number;
  applyingAmount: number;
  notApplyAmount: number;
  feeDetails: LogisticsPaymentFeeDetail[];
};

/** 物流计划单下的物流商总费用（汇总行）及费用类型明细 */
export type LogisticsPaymentPlanGroup = {
  poolId: string;
  relatedOrderSn: string;
  logisticsOrderSn: string;
  logisticsChannel: string;
  feeAmount: number;
  payableAmount: number;
  paidAmount: number;
  applyingAmount: number;
  notApplyAmount: number;
  currencyIcon: string;
  serviceLinks: LogisticsPaymentServiceLink[];
};

/** @deprecated 兼容旧扁平结构，明细请使用 LogisticsPaymentFeeDetail */
export type LogisticsPaymentLineItem = LogisticsPaymentFeeDetail & {
  relatedOrderSn: string;
  logisticsOrderSn: string;
  currencyIcon: string;
};

export type PaymentPoolRecord = {
  id: string;
  logisticsProvider: string;
  logisticsPlanNo: string;
  fbaShipmentNo: string;
  logisticsBillNo: string;
  currency: string;
  status: PayStatus;
  shipTime: string;
  receiveWarehouse: string;
  sendWarehouse: string;
  logisticsChannel: string;
  feeAmount: number;
  payableAmount: number;
  discountAmount: number;
  amountPaid: number;
  amountNotPaid: number;
  applyingAmount: number;
  notApplyAmount: number;
  feeInputUser: string;
  entryTime: string;
  finishPayTime: string;
  operator: string;
  finishPayRemark: string;
  /** 2=继续请款，3=请款/结束请款 */
  operationActionType?: 2 | 3;
};

const providerAccountMap: Record<
  string,
  {
    supplierAccountName: string;
    accountHolderName: string;
    bankOfDeposit: string;
    bankAccount: string;
  }
> = {
  义乌风驰国际物流: {
    supplierAccountName: "义乌风驰基本户",
    accountHolderName: "义乌风驰国际物流有限公司",
    bankOfDeposit: "中国工商银行义乌支行",
    bankAccount: "6222020202200118",
  },
  宁波安达供应链: {
    supplierAccountName: "宁波安达收款户",
    accountHolderName: "宁波安达供应链有限公司",
    bankOfDeposit: "宁波银行股份有限公司",
    bankAccount: "021880088456",
  },
  深圳海翼物流: {
    supplierAccountName: "深圳海翼收款户",
    accountHolderName: "深圳海翼物流有限公司",
    bankOfDeposit: "招商银行深圳坂田支行",
    bankAccount: "75500012009888",
  },
  浙江融盛国际物流有限公司: {
    supplierAccountName: "融盛跨境账户",
    accountHolderName: "浙江融盛国际物流有限公司",
    bankOfDeposit: "宁波银行股份有限公司科技支行",
    bankAccount: "31010122000919200",
  },
};

const providerSchemeAliases: Record<string, string> = {
  义乌风驰国际物流: "义乌市双捷国际货运代理有限公司",
  宁波安达供应链: "宁波赛蓝供应链服务有限公司",
  深圳海翼物流: "浙江融盛国际物流有限公司",
};

const channelProviderServiceSchemes: Record<
  string,
  Record<string, { serviceLinks: string[]; feeItems: string[] }>
> = {
  美南标快: {
    义乌市双捷国际货运代理有限公司: {
      serviceLinks: ["国内揽收", "干线运输"],
      feeItems: ["提货费", "报关费", "海运费", "港杂费"],
    },
    义乌风驰国际物流: {
      serviceLinks: ["国内揽收", "干线运输"],
      feeItems: ["提货费", "报关费", "海运费", "港杂费"],
    },
  },
  美西海派: {
    浙江融盛国际物流有限公司: {
      serviceLinks: ["清关", "尾程派送"],
      feeItems: ["清关费", "税金", "派送费", "附加费"],
    },
  },
  欧洲快线: {
    浙江融盛国际物流有限公司: {
      serviceLinks: ["国内揽收", "干线运输", "清关"],
      feeItems: ["清关费", "税金", "附加费"],
    },
    深圳海翼物流: {
      serviceLinks: ["国内揽收", "清关"],
      feeItems: ["清关费", "税金", "附加费"],
    },
  },
  加拿大卡派: {
    宁波赛蓝供应链服务有限公司: {
      serviceLinks: ["干线运输", "清关"],
      feeItems: ["海运费", "订舱费", "清关费", "港杂费"],
    },
    宁波安达供应链: {
      serviceLinks: ["干线运输", "清关"],
      feeItems: ["海运费", "订舱费", "清关费", "港杂费"],
    },
  },
};

const defaultProviderServiceSchemes: Record<string, { serviceLinks: string[]; feeItems: string[] }> = {
  义乌风驰国际物流: { serviceLinks: ["国内揽收", "干线运输"], feeItems: ["提货费", "报关费", "海运费", "港杂费"] },
  宁波安达供应链: { serviceLinks: ["干线运输", "清关"], feeItems: ["海运费", "订舱费", "清关费", "港杂费"] },
  深圳海翼物流: { serviceLinks: ["国内揽收", "清关"], feeItems: ["清关费", "税金", "附加费"] },
  浙江融盛国际物流有限公司: { serviceLinks: ["清关", "尾程派送"], feeItems: ["清关费", "税金", "派送费", "附加费"] },
};

function roundAmount(value: number) {
  return Math.round(value * 100) / 100;
}

export function getCurrencyIcon(currency: string) {
  if (currency === "USD") {
    return "$";
  }
  if (currency === "EUR") {
    return "€";
  }
  if (currency === "CAD") {
    return "C$";
  }
  return "¥";
}

function distributeAmount(total: number, count: number) {
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [roundAmount(total)];
  }
  const base = roundAmount(total / count);
  const amounts = Array.from({ length: count - 1 }, () => base);
  const allocated = amounts.reduce((sum, item) => sum + item, 0);
  amounts.push(roundAmount(total - allocated));
  return amounts;
}

function getProviderServiceScheme(record: PaymentPoolRecord) {
  const alias = providerSchemeAliases[record.logisticsProvider] ?? record.logisticsProvider;
  const byChannel = channelProviderServiceSchemes[record.logisticsChannel];
  const scheme =
    byChannel?.[record.logisticsProvider] ??
    byChannel?.[alias] ??
    defaultProviderServiceSchemes[record.logisticsProvider] ??
    defaultProviderServiceSchemes[alias] ?? {
      serviceLinks: ["全程服务"],
      feeItems: ["头程运费"],
    };
  return scheme;
}

function splitFeeItemsAcrossServiceLinks(serviceLinks: string[], feeItems: string[]) {
  if (serviceLinks.length === 0) {
    return [];
  }
  const itemsPerLink = Math.max(1, Math.ceil(feeItems.length / serviceLinks.length));
  return serviceLinks.map((serviceLinkName, index) => ({
    serviceLinkName,
    feeTypeNames: feeItems.slice(index * itemsPerLink, (index + 1) * itemsPerLink),
  }));
}

function buildFeeDetailsForTypes(
  poolId: string,
  linkIndex: number,
  feeTypeNames: string[],
  totals: {
    feeAmount: number;
    payableAmount: number;
    paidAmount: number;
    applyingAmount: number;
    notApplyAmount: number;
  },
): LogisticsPaymentFeeDetail[] {
  const feeAmounts = distributeAmount(totals.feeAmount, feeTypeNames.length);
  const payableAmounts = distributeAmount(totals.payableAmount, feeTypeNames.length);
  const paidAmounts = distributeAmount(totals.paidAmount, feeTypeNames.length);
  const applyingAmounts = distributeAmount(totals.applyingAmount, feeTypeNames.length);
  const notApplyAmounts = distributeAmount(totals.notApplyAmount, feeTypeNames.length);

  return feeTypeNames.map((feeTypeName, index) => ({
    id: `${poolId}-link-${linkIndex + 1}-fee-${index + 1}`,
    feeTypeName,
    feeAmount: feeAmounts[index] ?? 0,
    payableAmount: payableAmounts[index] ?? 0,
    paidAmount: paidAmounts[index] ?? 0,
    applyingAmount: applyingAmounts[index] ?? 0,
    notApplyAmount: notApplyAmounts[index] ?? 0,
    currentApplyAmount: "",
    currentDiscountAmount: "",
  }));
}

function buildServiceLinksForPoolRecord(record: PaymentPoolRecord): LogisticsPaymentServiceLink[] {
  const scheme = getProviderServiceScheme(record);
  const linkDefinitions = splitFeeItemsAcrossServiceLinks(scheme.serviceLinks, scheme.feeItems);
  const linkCount = linkDefinitions.length;

  const feeAmounts = distributeAmount(record.feeAmount, linkCount);
  const payableAmounts = distributeAmount(record.payableAmount, linkCount);
  const paidAmounts = distributeAmount(record.amountPaid, linkCount);
  const applyingAmounts = distributeAmount(record.applyingAmount, linkCount);
  const notApplyAmounts = distributeAmount(record.notApplyAmount, linkCount);

  return linkDefinitions.map((definition, index) => {
    const linkTotals = {
      feeAmount: feeAmounts[index] ?? 0,
      payableAmount: payableAmounts[index] ?? 0,
      paidAmount: paidAmounts[index] ?? 0,
      applyingAmount: applyingAmounts[index] ?? 0,
      notApplyAmount: notApplyAmounts[index] ?? 0,
    };
    return {
      id: `${record.id}-link-${index + 1}`,
      serviceLinkName: definition.serviceLinkName,
      ...linkTotals,
      feeDetails: buildFeeDetailsForTypes(record.id, index, definition.feeTypeNames, linkTotals),
    };
  });
}

export function getPlanGroupFeeDetails(group: LogisticsPaymentPlanGroup) {
  return group.serviceLinks.flatMap((link) => link.feeDetails);
}

export function poolRecordToPlanGroup(record: PaymentPoolRecord): LogisticsPaymentPlanGroup {
  const serviceLinks = buildServiceLinksForPoolRecord(record);
  return {
    poolId: record.id,
    relatedOrderSn: record.logisticsPlanNo,
    logisticsOrderSn: record.logisticsBillNo,
    logisticsChannel: record.logisticsChannel,
    feeAmount: record.feeAmount,
    payableAmount: record.payableAmount,
    paidAmount: record.amountPaid,
    applyingAmount: record.applyingAmount,
    notApplyAmount: record.notApplyAmount,
    currencyIcon: getCurrencyIcon(record.currency),
    serviceLinks,
  };
}

export function sumFeeDetailField(
  details: LogisticsPaymentFeeDetail[],
  field: "currentApplyAmount" | "currentDiscountAmount",
) {
  return details.reduce((sum, item) => {
    const parsed = parseFloat(String(item[field] || 0));
    return sum + (Number.isNaN(parsed) ? 0 : parsed);
  }, 0);
}

export function sumPlanGroupField(
  group: LogisticsPaymentPlanGroup,
  field: "currentApplyAmount" | "currentDiscountAmount",
) {
  return sumFeeDetailField(getPlanGroupFeeDetails(group), field);
}

export function sumServiceLinkField(
  link: LogisticsPaymentServiceLink,
  field: "currentApplyAmount" | "currentDiscountAmount",
) {
  return sumFeeDetailField(link.feeDetails, field);
}

export function flattenPlanGroups(planGroups: LogisticsPaymentPlanGroup[]): LogisticsPaymentLineItem[] {
  return planGroups.flatMap((group) =>
    getPlanGroupFeeDetails(group).map((detail) => ({
      ...detail,
      relatedOrderSn: group.relatedOrderSn,
      logisticsOrderSn: group.logisticsOrderSn,
      currencyIcon: group.currencyIcon,
    })),
  );
}

export const paymentPoolRecords: PaymentPoolRecord[] = [
  {
    id: "pp-001",
    logisticsProvider: "义乌风驰国际物流",
    logisticsPlanNo: "LP260409000001",
    fbaShipmentNo: "FBA18X2K9PQR",
    logisticsBillNo: "YWFH26060001",
    currency: "CNY",
    status: "未付清",
    shipTime: "2026-04-08 14:20:00",
    receiveWarehouse: "FBA-ONT8",
    sendWarehouse: "测试仓库101",
    logisticsChannel: "美南标快",
    feeAmount: 12800.5,
    payableAmount: 12500,
    discountAmount: 300.5,
    amountPaid: 8000,
    amountNotPaid: 4500,
    applyingAmount: 1200,
    notApplyAmount: 3300,
    feeInputUser: "兰轩",
    entryTime: "2026-04-09 09:15:00",
    finishPayTime: "",
    operator: "",
    finishPayRemark: "",
    operationActionType: 3,
  },
  {
    id: "pp-002",
    logisticsProvider: "宁波安达供应链",
    logisticsPlanNo: "LP260411000003",
    fbaShipmentNo: "FBA18Y3M2ABC",
    logisticsBillNo: "NBAD26060003",
    currency: "CAD",
    status: "未付清",
    shipTime: "2026-04-11 10:05:00",
    receiveWarehouse: "FBA-YYZ4",
    sendWarehouse: "宁波保税仓",
    logisticsChannel: "加拿大卡派",
    feeAmount: 28600,
    payableAmount: 28000,
    discountAmount: 600,
    amountPaid: 15000,
    amountNotPaid: 13000,
    applyingAmount: 5000,
    notApplyAmount: 8000,
    feeInputUser: "周婷婷",
    entryTime: "2026-04-11 16:40:00",
    finishPayTime: "",
    operator: "",
    finishPayRemark: "",
    operationActionType: 3,
  },
  {
    id: "pp-003",
    logisticsProvider: "深圳海翼物流",
    logisticsPlanNo: "LP260412000004",
    fbaShipmentNo: "FBA18Z4N5DEF",
    logisticsBillNo: "SZHY26060004",
    currency: "EUR",
    status: "已付清",
    shipTime: "2026-04-12 08:30:00",
    receiveWarehouse: "测试仓库101",
    sendWarehouse: "测试仓库101",
    logisticsChannel: "欧洲快线",
    feeAmount: 9800,
    payableAmount: 9500,
    discountAmount: 300,
    amountPaid: 9500,
    amountNotPaid: 0,
    applyingAmount: 0,
    notApplyAmount: 0,
    feeInputUser: "李莎丽",
    entryTime: "2026-04-12 11:20:00",
    finishPayTime: "2026-04-20 15:00:00",
    operator: "超级管理员",
    finishPayRemark: "头程费用已全部付清",
  },
  {
    id: "pp-004",
    logisticsProvider: "浙江融盛国际物流有限公司",
    logisticsPlanNo: "LP260410000002",
    fbaShipmentNo: "FBA18W1J8GHI",
    logisticsBillNo: "RSWL26060002",
    currency: "USD",
    status: "未付清",
    shipTime: "2026-04-10 18:45:00",
    receiveWarehouse: "Walmart仓",
    sendWarehouse: "测试仓库101",
    logisticsChannel: "美西海派",
    feeAmount: 5600.8,
    payableAmount: 5400,
    discountAmount: 200.8,
    amountPaid: 2000,
    amountNotPaid: 3400,
    applyingAmount: 0,
    notApplyAmount: 3400,
    feeInputUser: "张晓莹",
    entryTime: "2026-04-10 19:10:00",
    finishPayTime: "",
    operator: "",
    finishPayRemark: "",
    operationActionType: 3,
  },
  {
    id: "pp-005",
    logisticsProvider: "义乌风驰国际物流",
    logisticsPlanNo: "LP2606040004",
    fbaShipmentNo: "FBA19A5B6JKL",
    logisticsBillNo: "YWFH26060005",
    currency: "CNY",
    status: "已付清",
    shipTime: "2026-06-04 09:00:00",
    receiveWarehouse: "FBA-ONT8",
    sendWarehouse: "测试仓库101",
    logisticsChannel: "美南标快",
    feeAmount: 7200,
    payableAmount: 7000,
    discountAmount: 200,
    amountPaid: 7000,
    amountNotPaid: 0,
    applyingAmount: 0,
    notApplyAmount: 0,
    feeInputUser: "兰轩",
    entryTime: "2026-06-04 10:30:00",
    finishPayTime: "2026-06-10 11:20:00",
    operator: "兰轩",
    finishPayRemark: "月结头程款结清",
  },
  {
    id: "pp-006",
    logisticsProvider: "义乌风驰国际物流",
    logisticsPlanNo: "LP2606050001",
    fbaShipmentNo: "FBA19C7D8MNO",
    logisticsBillNo: "YWFH26060006",
    currency: "CNY",
    status: "未付清",
    shipTime: "2026-05-06 11:00:00",
    receiveWarehouse: "FBA-ONT8",
    sendWarehouse: "测试仓库101",
    logisticsChannel: "美南标快",
    feeAmount: 4200,
    payableAmount: 4100,
    discountAmount: 100,
    amountPaid: 4100,
    amountNotPaid: 0,
    applyingAmount: 0,
    notApplyAmount: 0,
    feeInputUser: "兰轩",
    entryTime: "2026-05-06 12:00:00",
    finishPayTime: "2026-05-15 10:00:00",
    operator: "兰轩",
    finishPayRemark: "已结束请款，待继续请款",
    operationActionType: 2,
  },
];

export function getPaymentPoolByIds(ids: string[]) {
  return paymentPoolRecords.filter((record) => ids.includes(record.id));
}

export function validateFirstTripPaymentRequest(ids: string[]): { ok: boolean; message?: string } {
  if (ids.length === 0) {
    return { ok: false, message: "请先勾选单据！" };
  }

  const rows = getPaymentPoolByIds(ids);
  if (rows.length !== ids.length) {
    return { ok: false, message: "校验不通过，无法请款" };
  }

  const providers = new Set(rows.map((row) => row.logisticsProvider));
  if (providers.size > 1) {
    return { ok: false, message: "请选择同一物流商的单据请款" };
  }

  const invalidRow = rows.find((row) => row.status === "已付清" || row.notApplyAmount <= 0 || row.operationActionType === 2);
  if (invalidRow) {
    return { ok: false, message: "校验不通过，无法请款" };
  }

  return { ok: true };
}

export function poolRecordToLineItem(record: PaymentPoolRecord): LogisticsPaymentLineItem {
  const group = poolRecordToPlanGroup(record);
  const detail = getPlanGroupFeeDetails(group)[0];
  return {
    ...detail,
    relatedOrderSn: group.relatedOrderSn,
    logisticsOrderSn: group.logisticsOrderSn,
    currencyIcon: group.currencyIcon,
  };
}

export type LogisticsPaymentCreateForm = {
  logisticsProviderName: string;
  settlementDescription: string;
  expectedPayTime: string;
  paymentMethodName: string;
  supplierAccountName: string;
  accountHolderName: string;
  bankOfDeposit: string;
  bankAccount: string;
  currency: string;
  remark: string;
  planGroups: LogisticsPaymentPlanGroup[];
};

export function buildLogisticsPaymentCreateForm(poolIds: string[]): LogisticsPaymentCreateForm | null {
  const rows = getPaymentPoolByIds(poolIds);
  if (rows.length === 0) {
    return null;
  }

  const provider = rows[0].logisticsProvider;
  const account = providerAccountMap[provider] ?? {
    supplierAccountName: `${provider}收款户`,
    accountHolderName: provider,
    bankOfDeposit: "-",
    bankAccount: "-",
  };

  return {
    logisticsProviderName: provider,
    settlementDescription: "",
    expectedPayTime: "",
    paymentMethodName: "账期支付",
    supplierAccountName: account.supplierAccountName,
    accountHolderName: account.accountHolderName,
    bankOfDeposit: account.bankOfDeposit,
    bankAccount: account.bankAccount,
    currency: rows[0].currency,
    remark: "",
    planGroups: rows.map(poolRecordToPlanGroup),
  };
}

export function getAddablePoolRecords(
  providerName: string,
  existingPoolIds: string[],
  logisticsBillNo?: string,
  currency?: string,
) {
  return paymentPoolRecords.filter(
    (record) =>
      record.logisticsProvider === providerName &&
      (!logisticsBillNo || record.logisticsBillNo === logisticsBillNo) &&
      (!currency || record.currency === currency) &&
      !existingPoolIds.includes(record.id) &&
      record.status === "未付清" &&
      record.notApplyAmount > 0 &&
      record.operationActionType === 3,
  );
}
