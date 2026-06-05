"use client";

import { useEffect } from "react";
import { cn } from "@/shared/lib";
import { useLlmCatalogQuery } from "../api/queries";
import type { LlmModelSelection } from "../model/types";

interface ModelPickerProps {
  value: LlmModelSelection | null;
  onChange: (next: LlmModelSelection) => void;
  className?: string;
}

/**
 * Provider+model picker backed by the server catalog. Providers without a
 * connected credential are shown but disabled — server-run is unavailable
 * for them, so the user knows to connect a key (or use the copy-prompt flow).
 *
 * On first load it defaults to the first available provider's default model.
 * If none are available, `value` stays null and the caller disables run.
 */
export function ModelPicker({ value, onChange, className }: ModelPickerProps) {
  const { data, isLoading } = useLlmCatalogQuery();
  const providers = data ?? [];

  useEffect(() => {
    if (value || providers.length === 0) return;
    const firstAvailable = providers.find((p) => p.available);
    if (firstAvailable) {
      onChange({
        providerId: firstAvailable.id,
        modelId: firstAvailable.defaultModelId,
      });
    }
  }, [providers, value, onChange]);

  if (isLoading) {
    return <div className={cn("h-9 animate-pulse rounded-md bg-muted", className)} />;
  }

  const encoded = value ? `${value.providerId}:${value.modelId}` : "";

  return (
    <select
      value={encoded}
      onChange={(e) => {
        const [providerId, modelId] = e.target.value.split(":");
        if (providerId && modelId) onChange({ providerId, modelId });
      }}
      className={cn(
        "h-9 rounded-md bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30",
        className,
      )}
    >
      {value == null && (
        <option value="" disabled>
          사용 가능한 모델 없음
        </option>
      )}
      {providers.map((p) => (
        <optgroup key={p.id} label={p.available ? p.label : `${p.label} (키 미연결)`}>
          {p.models.map((m) => (
            <option key={m.id} value={`${p.id}:${m.id}`} disabled={!p.available}>
              {m.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
