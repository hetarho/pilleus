"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { buildDesignMd, type PaletteForMd } from "../lib/build-design-md";

interface CopyDesignMdButtonProps {
  productName: string;
  palettes: PaletteForMd[];
}

export function CopyDesignMdButton({ productName, palettes }: CopyDesignMdButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    const md = buildDesignMd({ productName, palettes });
    await navigator.clipboard.writeText(md);
    setCopied(true);
  };

  return (
    <Button type="button" variant="outline" onClick={handleCopy}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "복사됨" : "design.md 복사"}
    </Button>
  );
}
