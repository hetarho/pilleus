"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { productHref, useProductListQuery } from "@/entities/product";
import { useSession } from "@/entities/session";

/* Landing for /project (no id). If the user has projects, send them straight
 * to the most recent one's Overview; otherwise prompt them to create one via
 * the switcher in the top bar. */
export function ProjectHomeView() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const productsQuery = useProductListQuery({ enabled: isAuthenticated });

  const firstProductId = productsQuery.data?.[0]?.id ?? null;

  useEffect(() => {
    if (firstProductId) router.replace(productHref(firstProductId));
  }, [firstProductId, router]);

  if (productsQuery.isLoading || firstProductId) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-bold">아직 프로젝트가 없습니다</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        상단 가운데의 <span className="font-medium">프로젝트 선택</span> 메뉴에서
        “새 프로젝트”를 눌러 첫 프로젝트를 만들어 보세요.
      </p>
    </main>
  );
}
