import type { ReactNode } from "react";
import { ScrollText } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import type { FbaShipmentRecord } from "./first-leg-prototypes";

const tableHeadCell = "whitespace-nowrap px-3 py-3 font-medium";

function ProductImagePlaceholder() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-dashed border-border bg-bg-page text-text-muted">
      <span className="text-caption">图</span>
    </div>
  );
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-small text-text-muted">{label}</div>
      <div className="mt-1.5 text-body text-text-primary">{value}</div>
    </div>
  );
}

type FbaLegacyShipmentDetailPageProps = {
  record: FbaShipmentRecord;
};

export function FbaLegacyShipmentDetailPage({ record }: FbaLegacyShipmentDetailPageProps) {
  const products = record.products ?? [];
  const declaredTotal = products.reduce((sum, product) => sum + product.declaredQty, 0);
  const shippedTotal = products.reduce((sum, product) => sum + product.shippedQty, 0);
  const receivedTotal = products.reduce((sum, product) => sum + product.receivedQty, 0);
  const marketplaceLabel = record.marketplace === "CA" ? "加拿大" : record.marketplace === "US" ? "美国" : record.marketplace ?? "-";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="text-section-title font-section-title text-text-primary">{record.shipmentId}</div>
        <Button variant="secondary" size="sm">
          <ScrollText aria-hidden="true" className="h-4 w-4" />
          操作日志
        </Button>
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailField label="店铺" value={`${record.store} ${marketplaceLabel}`} />
          <DetailField label="创建人" value={record.creator ?? "-"} />
          <DetailField label="创建时间" value={record.createdAt ?? "-"} />
          <DetailField label="货件名称" value={record.shipmentName ?? "-"} />
          <DetailField label="标签类型" value={record.labelType ?? "-"} />
          <DetailField label="物流中心编码" value={record.destinationFc} />
          <DetailField
            label="发货地址"
            value={record.shippingAddress ?? "-"}
            className="md:col-span-2 xl:col-span-4"
          />
          <DetailField label="备注" value={record.remark ?? "-"} className="md:col-span-2 xl:col-span-4" />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-small">
            <thead className="border-b border-border bg-bg-page/70 text-text-secondary">
              <tr>
                <th className={tableHeadCell}>图片</th>
                <th className={tableHeadCell}>MSKU/FNSKU</th>
                <th className={tableHeadCell}>ASIN/父ASIN</th>
                <th className={tableHeadCell}>标题</th>
                <th className={tableHeadCell}>品名/SKU</th>
                <th className={tableHeadCell}>预处理提供方/标签类型</th>
                <th className={tableHeadCell}>申报量</th>
                <th className={tableHeadCell}>已发货</th>
                <th className={tableHeadCell}>签收量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-3 py-3">
                    <ProductImagePlaceholder />
                  </td>
                  <td className="px-3 py-3">
                    <div>{product.msku}</div>
                    <div className="text-text-muted">{product.fnsku}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{product.asin}</div>
                    <div className="text-text-muted">{product.asin}</div>
                  </td>
                  <td className="max-w-[220px] px-3 py-3">BDFHYK Oxygen Sensor Upstream &amp; Downstre...</td>
                  <td className="px-3 py-3">
                    <div>{product.productName}</div>
                    <div className="text-text-muted">{product.sku}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{product.prepProvider}</div>
                    <div className="text-text-muted">{product.labelType}</div>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{product.declaredQty}</td>
                  <td className="px-3 py-3 tabular-nums">{product.shippedQty}</td>
                  <td className="px-3 py-3 tabular-nums">{product.receivedQty}</td>
                </tr>
              ))}
              <tr className="bg-bg-page/60 font-medium">
                <td className="px-3 py-3" colSpan={6}>
                  总计
                </td>
                <td className="px-3 py-3 tabular-nums">{declaredTotal}</td>
                <td className="px-3 py-3 tabular-nums">{shippedTotal}</td>
                <td className="px-3 py-3 tabular-nums">{receivedTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
