import { ProjectView } from "@/pages/project";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  return <ProjectView productId={productId} />;
}
