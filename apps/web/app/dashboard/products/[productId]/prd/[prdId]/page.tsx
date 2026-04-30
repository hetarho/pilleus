import { PrdDetailView } from "@/pages/prd-detail";

export default async function PrdDetailPage({
  params,
}: {
  params: Promise<{ productId: string; prdId: string }>;
}) {
  const { productId, prdId } = await params;
  return <PrdDetailView productId={productId} prdId={prdId} />;
}
