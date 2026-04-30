import { ProductSectionView } from "@/pages/product-section";

export default async function ProductSectionPage({
  params,
}: {
  params: Promise<{ productId: string; section: string }>;
}) {
  const { productId, section } = await params;
  return <ProductSectionView productId={productId} sectionId={section} />;
}
