import type { ReactNode } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import type { Product } from "../model/types";

interface ProductCardProps {
  product: Product;
  action?: ReactNode;
}

export function ProductCard({ product, action }: ProductCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="font-medium">{product.name}</p>
          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
