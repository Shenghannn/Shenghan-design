import type {
  FbaShipmentRecord,
  ShippingPlanRecord,
  StaConfirmedShipment,
  StaTaskRecord,
} from "../pages/first-leg-prototypes";
import type { StaPlacementConfirmPayload } from "../pages/create-sta-task";

/** 发货计划 → STA任务 → FBA货件 = 1 : 1 : N */

export function findStaByPlanId(staRecords: StaTaskRecord[], planId: string) {
  return staRecords.find((record) => record.planId === planId) ?? null;
}

export function findStaByPlanNo(staRecords: StaTaskRecord[], planNo: string) {
  return staRecords.find((record) => record.planNo === planNo) ?? null;
}

export function findShipmentsByStaNo(fbaRecords: FbaShipmentRecord[], staNo: string) {
  return fbaRecords.filter((record) => record.staNo === staNo);
}

export function findShipmentsByPlanId(fbaRecords: FbaShipmentRecord[], planId: string) {
  return fbaRecords.filter((record) => record.planId === planId);
}

export function canCreateStaFromPlan(plan: ShippingPlanRecord, staRecords: StaTaskRecord[]) {
  if (plan.documentStatus !== "待处理") {
    return { allowed: false, reason: "仅「待处理」状态的发货计划可创建 STA 任务。" };
  }

  if (plan.deliveryMode !== "FBA") {
    return { allowed: false, reason: "仅 FBA 发货方式的发货计划可创建 STA 任务。" };
  }

  if (plan.hasStaTask || findStaByPlanId(staRecords, plan.id)) {
    return { allowed: false, reason: `发货计划 ${plan.planNo} 已关联 STA 任务，不可重复创建（1:1）。` };
  }

  return { allowed: true, reason: "" };
}

export function linkPlanToSta(
  plan: ShippingPlanRecord,
  sta: Pick<StaTaskRecord, "id" | "staNo">,
  flowStatus: ShippingPlanRecord["flowStatus"] = "sta_draft",
): ShippingPlanRecord {
  return {
    ...plan,
    hasStaTask: true,
    staId: sta.id,
    staNo: sta.staNo,
    flowStatus,
  };
}

export function buildFbaRecordsFromPlacement(
  payload: StaPlacementConfirmPayload & { sourcePlanId?: string },
  updatedAt: string,
): FbaShipmentRecord[] {
  return payload.shipments.map((shipment: StaConfirmedShipment, index) => ({
    id: `fba-${Date.now()}-${index}`,
    shipmentId: shipment.shipmentId,
    staNo: payload.staNo,
    store: payload.store,
    planId: payload.sourcePlanId ?? "",
    planNo: payload.sourcePlanNo ?? "-",
    mskuCount: payload.skuCount,
    totalQty: payload.totalQty,
    destinationFc: shipment.fcCode,
    boxMode: "先分仓再装箱",
    shipmentStatus: "WORKING",
    completionStatus: "进行中",
    currentStep: "商品装箱",
    hasStaTask: true,
    updatedAt,
    shipmentName: shipment.shipmentName,
    shippingAddress: shipment.deliveryAddress,
  }));
}

export function syncPlanFlowStatus(
  plan: ShippingPlanRecord,
  sta: StaTaskRecord | null,
  fbaShipments: FbaShipmentRecord[],
): ShippingPlanRecord {
  if (!sta) {
    return {
      ...plan,
      hasStaTask: false,
      staId: undefined,
      staNo: undefined,
      fbaShipmentCount: 0,
      flowStatus: "none",
    };
  }

  const relatedShipments = findShipmentsByStaNo(fbaShipments, sta.staNo);

  return {
    ...plan,
    hasStaTask: true,
    staId: sta.id,
    staNo: sta.staNo,
    fbaShipmentCount: relatedShipments.length,
    flowStatus:
      relatedShipments.length > 0
        ? "fba_created"
        : sta.status === "草稿"
          ? "sta_draft"
          : "sta_in_progress",
  };
}
