export type TransportSchemeProvider = {
  provider: string;
  serviceLinks: string[];
  feeItems: string[];
  currency: string;
};

export const feeCurrencyOptions = ["CNY", "USD", "EUR", "CAD", "GBP"];
export const feeCurrencyToCnyRate: Record<string, number> = {
  CNY: 1,
  USD: 7.2,
  EUR: 7.8,
  CAD: 5.25,
  GBP: 9.1,
};

/** 币种选择器：触发区适度宽度，下拉层略宽以保证选项完整展示 */
export const feeCurrencySelectClassName = "w-[80px]";
export const feeCurrencySelectMenuMinWidth = 88;

export type ChannelTransportScheme = {
  id: string;
  schemeName: string;
  providers: TransportSchemeProvider[];
};

export const channelTransportSchemes: Record<string, ChannelTransportScheme[]> = {
  美南标快: [
    {
      id: "scheme-1",
      schemeName: "海运标快方案",
      providers: [
        {
          provider: "义乌市双捷国际货运代理有限公司",
          serviceLinks: ["国内揽收", "干线运输"],
          feeItems: ["提货费", "报关费", "海运费", "订舱费", "港杂费"],
          currency: "CNY",
        },
        {
          provider: "浙江融盛国际物流有限公司",
          serviceLinks: ["清关", "尾程派送"],
          feeItems: ["清关费", "税金", "派送费", "附加费"],
          currency: "USD",
        },
      ],
    },
    {
      id: "scheme-2",
      schemeName: "清派直达方案",
      providers: [
        {
          provider: "浙江融盛国际物流有限公司",
          serviceLinks: ["清关", "尾程派送"],
          feeItems: ["清关费", "税金", "派送费"],
          currency: "USD",
        },
      ],
    },
  ],
  美西海派: [
    {
      id: "scheme-1",
      schemeName: "海派标准方案",
      providers: [
        {
          provider: "义乌市双捷国际货运代理有限公司",
          serviceLinks: ["国内揽收", "干线运输"],
          feeItems: ["提货费", "海运费", "港杂费"],
          currency: "CNY",
        },
        {
          provider: "深圳市以达物流有限公司",
          serviceLinks: ["尾程派送"],
          feeItems: ["派送费", "附加费", "尾程处理费"],
          currency: "USD",
        },
      ],
    },
  ],
  欧洲快线: [
    {
      id: "scheme-1",
      schemeName: "欧洲快线方案",
      providers: [
        {
          provider: "浙江融盛国际物流有限公司",
          serviceLinks: ["国内揽收", "干线运输", "清关"],
          feeItems: ["清关费", "税金", "附加费"],
          currency: "EUR",
        },
      ],
    },
  ],
  加拿大卡派: [
    {
      id: "scheme-1",
      schemeName: "干线清关方案",
      providers: [
        {
          provider: "宁波赛蓝供应链服务有限公司",
          serviceLinks: ["干线运输", "清关"],
          feeItems: ["海运费", "订舱费", "清关费"],
          currency: "CAD",
        },
      ],
    },
    {
      id: "scheme-2",
      schemeName: "卡派组合方案",
      providers: [
        {
          provider: "宁波赛蓝供应链服务有限公司",
          serviceLinks: ["干线运输"],
          feeItems: ["海运费", "订舱费"],
          currency: "CAD",
        },
        {
          provider: "深圳市以达物流有限公司",
          serviceLinks: ["尾程派送"],
          feeItems: ["派送费", "附加费"],
          currency: "USD",
        },
      ],
    },
  ],
  美东快递: [
    {
      id: "scheme-1",
      schemeName: "美东快递方案",
      providers: [
        {
          provider: "深圳市以达物流有限公司",
          serviceLinks: ["国内揽收", "干线运输", "尾程派送"],
          feeItems: ["仓储操作费", "派送费", "尾程处理费"],
          currency: "USD",
        },
      ],
    },
  ],
};

export function getTransportSchemesByChannel(channel: string): ChannelTransportScheme[] {
  return channelTransportSchemes[channel] ?? [];
}

export function cloneTransportSchemes(schemes: ChannelTransportScheme[]): ChannelTransportScheme[] {
  return schemes.map((scheme) => ({
    ...scheme,
    providers: scheme.providers.map((provider) => ({
      ...provider,
      serviceLinks: [...provider.serviceLinks],
      feeItems: [...provider.feeItems],
    })),
  }));
}

export function buildLegacyTransportSchemes(providers: string[]): ChannelTransportScheme[] {
  if (providers.length === 0) {
    return [];
  }
  return [
    {
      id: "scheme-1",
      schemeName: "方案1",
      providers: providers.map((provider) => ({
        provider,
        serviceLinks: [],
        feeItems: [],
        currency: "CNY",
      })),
    },
  ];
}

export const serviceLinkOptions = ["国内揽收", "干线运输", "清关", "尾程派送"];

export function getSchemeServiceLinkOptions(scheme: ChannelTransportScheme | undefined) {
  const fromScheme = scheme?.providers.flatMap((provider) => provider.serviceLinks) ?? [];
  return Array.from(new Set([...serviceLinkOptions, ...fromScheme]));
}

export function flattenSchemeFeeItems(scheme: ChannelTransportScheme) {
  return scheme.providers.flatMap((provider) =>
    provider.feeItems.map((feeType) => ({
      provider: provider.provider,
      serviceLinks: provider.serviceLinks,
      feeType,
    })),
  );
}

export type FeeDetailRow = {
  id: string;
  provider: string;
  serviceLinks: string[];
  feeType: string;
  estimatedAmount: string;
  estimatedCurrency: string;
  actualAmount: string;
  actualCurrency: string;
  isCustom: boolean;
};

type QuoteSchemeFeeRate = {
  channel: string;
  schemeId: string;
  provider: string;
  feeType: string;
  estimatedAmount: string;
  currency: string;
};

const quoteSchemeFeeRates: QuoteSchemeFeeRate[] = [
  { channel: "美南标快", schemeId: "scheme-1", provider: "义乌市双捷国际货运代理有限公司", feeType: "海运费", estimatedAmount: "21211.00", currency: "CNY" },
  { channel: "美南标快", schemeId: "scheme-1", provider: "义乌市双捷国际货运代理有限公司", feeType: "订舱费", estimatedAmount: "111.00", currency: "CNY" },
  { channel: "美南标快", schemeId: "scheme-1", provider: "义乌市双捷国际货运代理有限公司", feeType: "报关费", estimatedAmount: "111.00", currency: "CNY" },
  { channel: "美南标快", schemeId: "scheme-1", provider: "义乌市双捷国际货运代理有限公司", feeType: "提货费", estimatedAmount: "111.00", currency: "CNY" },
  { channel: "美南标快", schemeId: "scheme-1", provider: "义乌市双捷国际货运代理有限公司", feeType: "港杂费", estimatedAmount: "111.00", currency: "CNY" },
  { channel: "美南标快", schemeId: "scheme-1", provider: "浙江融盛国际物流有限公司", feeType: "清关费", estimatedAmount: "111.00", currency: "USD" },
  { channel: "美南标快", schemeId: "scheme-1", provider: "浙江融盛国际物流有限公司", feeType: "税金", estimatedAmount: "111.00", currency: "USD" },
  { channel: "美南标快", schemeId: "scheme-1", provider: "浙江融盛国际物流有限公司", feeType: "派送费", estimatedAmount: "222.00", currency: "USD" },
  { channel: "美南标快", schemeId: "scheme-1", provider: "浙江融盛国际物流有限公司", feeType: "附加费", estimatedAmount: "112.00", currency: "USD" },
  { channel: "美南标快", schemeId: "scheme-2", provider: "浙江融盛国际物流有限公司", feeType: "清关费", estimatedAmount: "980.00", currency: "USD" },
  { channel: "美南标快", schemeId: "scheme-2", provider: "浙江融盛国际物流有限公司", feeType: "税金", estimatedAmount: "860.00", currency: "USD" },
  { channel: "美南标快", schemeId: "scheme-2", provider: "浙江融盛国际物流有限公司", feeType: "派送费", estimatedAmount: "1260.00", currency: "USD" },
  { channel: "加拿大卡派", schemeId: "scheme-1", provider: "宁波赛蓝供应链服务有限公司", feeType: "海运费", estimatedAmount: "2680.00", currency: "CAD" },
  { channel: "加拿大卡派", schemeId: "scheme-1", provider: "宁波赛蓝供应链服务有限公司", feeType: "订舱费", estimatedAmount: "320.00", currency: "CAD" },
  { channel: "加拿大卡派", schemeId: "scheme-1", provider: "宁波赛蓝供应链服务有限公司", feeType: "清关费", estimatedAmount: "450.00", currency: "CAD" },
  { channel: "欧洲快线", schemeId: "scheme-1", provider: "浙江融盛国际物流有限公司", feeType: "清关费", estimatedAmount: "3.80", currency: "EUR" },
  { channel: "欧洲快线", schemeId: "scheme-1", provider: "浙江融盛国际物流有限公司", feeType: "税金", estimatedAmount: "1.20", currency: "EUR" },
  { channel: "欧洲快线", schemeId: "scheme-1", provider: "浙江融盛国际物流有限公司", feeType: "附加费", estimatedAmount: "0.60", currency: "EUR" },
];

export const logisticsChannelOptions = Object.keys(channelTransportSchemes).map((channel) => ({
  label: channel,
  value: channel,
}));

function getQuoteFeeRate(channel: string, schemeId: string, provider: string, feeType: string) {
  return quoteSchemeFeeRates.find(
    (item) =>
      item.channel === channel &&
      item.schemeId === schemeId &&
      item.provider === provider &&
      item.feeType === feeType,
  );
}

export function getQuoteFeeCurrency(
  channel: string,
  schemeId: string,
  provider: string,
  feeType: string,
  fallback = "CNY",
) {
  return getQuoteFeeRate(channel, schemeId, provider, feeType)?.currency ?? fallback;
}

export function buildFeeDetailRowsFromScheme(channel: string, scheme: ChannelTransportScheme): FeeDetailRow[] {
  const rowsByKey = new Map<
    string,
    {
      provider: string;
      serviceLinks: string[];
      feeType: string;
      estimatedAmount: number;
      currency: string;
    }
  >();

  flattenSchemeFeeItems(scheme).forEach((item) => {
    const quote = getQuoteFeeRate(channel, scheme.id, item.provider, item.feeType);
    const currency = getProviderCurrency(scheme, item.provider);
    const key = `${item.provider}::${item.feeType}::${currency}`;
    const current = rowsByKey.get(key);
    if (current) {
      current.estimatedAmount += parseFeeAmount(quote?.estimatedAmount ?? "0.00");
      current.serviceLinks = Array.from(new Set([...current.serviceLinks, ...item.serviceLinks]));
      return;
    }
    rowsByKey.set(key, {
      provider: item.provider,
      serviceLinks: [...item.serviceLinks],
      feeType: item.feeType,
      estimatedAmount: parseFeeAmount(quote?.estimatedAmount ?? "0.00"),
      currency,
    });
  });

  return Array.from(rowsByKey.values()).map((item, index) => {
    return {
      id: `fee-system-${scheme.id}-${index + 1}`,
      provider: item.provider,
      serviceLinks: [...item.serviceLinks],
      feeType: item.feeType,
      estimatedAmount: formatFeeAmount(item.estimatedAmount),
      estimatedCurrency: item.currency,
      actualAmount: "0.00",
      actualCurrency: item.currency,
      isCustom: false,
    };
  });
}

export function getProviderCurrency(scheme: ChannelTransportScheme | undefined, provider: string) {
  return scheme?.providers.find((item) => item.provider === provider)?.currency ?? "CNY";
}

export function getChannelProviderCurrencies(channel: string) {
  return Array.from(
    new Set([
      ...getTransportSchemesByChannel(channel).flatMap((scheme) => scheme.providers.map((provider) => provider.currency)),
      ...quoteSchemeFeeRates.filter((item) => item.channel === channel).map((item) => item.currency),
    ]),
  );
}

export function getProviderFeeTypes(scheme: ChannelTransportScheme | undefined, provider: string) {
  return scheme?.providers.find((item) => item.provider === provider)?.feeItems ?? [];
}

export function getProviderServiceLinks(scheme: ChannelTransportScheme | undefined, provider: string) {
  return scheme?.providers.find((item) => item.provider === provider)?.serviceLinks ?? [];
}

export function parseFeeAmount(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatFeeAmount(value: number) {
  return value.toFixed(2);
}

export function formatFeeCurrencyTotals(
  rows: FeeDetailRow[],
  amountField: "estimatedAmount" | "actualAmount",
  currencyField: "estimatedCurrency" | "actualCurrency",
) {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const currency = row[currencyField] || "CNY";
    totals.set(currency, (totals.get(currency) ?? 0) + parseFeeAmount(row[amountField]));
  });
  if (totals.size === 0) {
    return "0.00";
  }
  return Array.from(totals.entries())
    .map(([currency, amount]) => `${formatFeeAmount(amount)} ${currency}`)
    .join(" / ");
}
