export type LiangcangSkuRecord = {
  id: string;
  productName: string;
  sku: string;
  liangcangName: string;
  liangcangProductCode: string;
  liangcangBarcode: string;
  liangcangAccount: string;
  matchRatio: string;
  creator: string;
  createdAt: string;
};

const productNames = [
  "排气管",
  "氧传感器",
  "刹车片",
  "点火线圈",
  "水泵",
  "节温器",
  "燃油泵",
  "正时皮带",
];

const skuPrefixes = ["PAW", "OS", "BP", "IC", "WP", "TS", "FP", "TB"];

function createLiangcangSkuRecords(): LiangcangSkuRecord[] {
  const account = "G15337";

  return Array.from({ length: 120 }, (_, index) => {
    const sequence = index + 1;
    const variant = index % productNames.length;
    const sku = `${skuPrefixes[variant]}${String(40100 + sequence)}-${(sequence % 9) + 1}`;
    const liangcangCode = `${account}-${String(100000 + sequence)}`;

    return {
      id: `lc-sku-${String(sequence).padStart(4, "0")}`,
      productName: productNames[variant],
      sku,
      liangcangName: productNames[variant],
      liangcangProductCode: liangcangCode,
      liangcangBarcode: `${account}-${String(100000000000 + sequence * 137)}`,
      liangcangAccount: account,
      matchRatio: "1 : 1",
      creator: sequence % 3 === 0 ? "李四" : "张三",
      createdAt: `2026-06-${String((sequence % 28) + 1).padStart(2, "0")} ${String(8 + (sequence % 12)).padStart(2, "0")}:${String((sequence * 7) % 60).padStart(2, "0")}:${String((sequence * 13) % 60).padStart(2, "0")}`,
    };
  });
}

export const liangcangSkuRecords = createLiangcangSkuRecords();

/** 原型展示用总条数，与真实系统规模接近 */
export const liangcangSkuDisplayTotalCount = 40275;

export const liangcangAccountOptions = [
  { label: "G15337", value: "G15337" },
  { label: "G15338", value: "G15338" },
  { label: "G15339", value: "G15339" },
];
