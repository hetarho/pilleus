"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, KeyRound, Loader2, Trash2 } from "lucide-react";
import {
  useLlmCatalogQuery,
  useLlmCredentialListQuery,
} from "@/entities/llm";
import { useTRPC } from "@/shared/api/trpc/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

/**
 * 마이페이지 — BYOK API 키 연결.
 *
 * 철학: 우리가 구독을 강요하지 않는 대신, 사용자가 자기 API 키를 연결하면
 * "생성하기"가 서버에서 직접 모델을 호출한다. 키를 연결하지 않아도 각
 * 다이얼로그의 "프롬프트 복사" 방식은 항상 그대로 쓸 수 있다.
 *
 * 키는 연결 시 한 번만 전송되고 서버에서 암호화 저장된다. 이 화면은 절대
 * 키 원문을 되돌려주지 않고, 연결 여부와 끝 4자리만 보여준다.
 */
export function AccountView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const catalogQuery = useLlmCatalogQuery();
  const credentialsQuery = useLlmCredentialListQuery();

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: trpc.llm.credential.list.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.llm.catalog.queryKey() });
  };

  const connect = useMutation(
    trpc.llm.credential.connect.mutationOptions({ onSuccess: invalidate }),
  );
  const disconnect = useMutation(
    trpc.llm.credential.disconnect.mutationOptions({ onSuccess: invalidate }),
  );

  const providers = catalogQuery.data ?? [];
  const credentials = credentialsQuery.data ?? [];
  const hintOf = (providerId: string) =>
    credentials.find((c) => c.providerId === providerId)?.keyHint ?? null;

  const handleConnect = (providerId: string) => {
    const apiKey = (drafts[providerId] ?? "").trim();
    if (apiKey.length < 8) return;
    connect.mutate(
      { providerId, apiKey },
      { onSuccess: () => setDrafts((d) => ({ ...d, [providerId]: "" })) },
    );
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <header className="flex items-center gap-3">
        <KeyRound className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">API 키 연결</h1>
          <p className="text-sm text-muted-foreground">
            내 키를 연결하면 “생성하기”가 서버에서 바로 동작합니다. 연결하지 않아도
            프롬프트 복사 방식은 항상 쓸 수 있습니다.
          </p>
        </div>
      </header>

      {catalogQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {providers.map((p) => {
            const hint = hintOf(p.id);
            const connected = hint != null;
            const busy =
              (connect.isPending && connect.variables?.providerId === p.id) ||
              (disconnect.isPending && disconnect.variables?.providerId === p.id);

            return (
              <li
                key={p.id}
                className="flex flex-col gap-3 rounded-lg border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{p.label}</span>
                  {connected ? (
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <Check className="size-3.5" />
                      연결됨 · ····{hint}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">미연결</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    autoComplete="off"
                    placeholder={connected ? "새 키로 교체하려면 입력" : `${p.label} API 키`}
                    value={drafts[p.id] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [p.id]: e.target.value }))
                    }
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    type="button"
                    onClick={() => handleConnect(p.id)}
                    disabled={busy || (drafts[p.id] ?? "").trim().length < 8}
                  >
                    {busy && connect.variables?.providerId === p.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {connected ? "교체" : "연결"}
                  </Button>
                  {connected && (
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="연결 해제"
                      onClick={() => disconnect.mutate({ providerId: p.id })}
                      disabled={busy}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {(connect.error || disconnect.error) && (
        <p className="text-sm text-destructive">
          {connect.error?.message ?? disconnect.error?.message}
        </p>
      )}
    </main>
  );
}
