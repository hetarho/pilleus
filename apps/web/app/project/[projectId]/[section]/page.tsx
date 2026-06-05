import { ProductSectionView } from "@/pages/product-section";

export default async function ProjectSectionPage({
  params,
}: {
  params: Promise<{ projectId: string; section: string }>;
}) {
  const { projectId, section } = await params;
  return <ProductSectionView productId={projectId} sectionId={section} />;
}
