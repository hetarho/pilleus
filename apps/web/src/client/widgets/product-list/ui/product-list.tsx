"use client";

import { ProductCard, useProductListQuery } from "@/entities/product";
import { useSession } from "@/entities/session";
import { DeleteProductButton } from "@/features/product-delete";

export function ProductList() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const productsQuery = useProductListQuery({ enabled: isAuthenticated });

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Products</h2>
      {productsQuery.isLoading && <p>Loading products...</p>}
      {productsQuery.data?.length === 0 && (
        <p className="text-muted-foreground">No products yet.</p>
      )}
      <div className="flex flex-col gap-3">
        {productsQuery.data?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            action={<DeleteProductButton productId={product.id} />}
          />
        ))}
      </div>
    </section>
  );
}
