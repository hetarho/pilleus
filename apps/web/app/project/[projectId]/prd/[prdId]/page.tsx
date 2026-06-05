import { PrdDetailView } from "@/pages/prd-detail";

export default async function ProjectPrdDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; prdId: string }>;
}) {
  const { projectId, prdId } = await params;
  return <PrdDetailView productId={projectId} prdId={prdId} />;
}
