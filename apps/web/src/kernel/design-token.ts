/** The five token groups we support. Single source of truth — used by
 * the server for invariant checks, the client for section rendering, and
 * the design.md builder for ordering. */
export const TOKEN_GROUPS = [
  "color",
  "typography",
  "spacing",
  "radius",
  "shadow",
] as const;

export type TokenGroup = (typeof TOKEN_GROUPS)[number];

export const TOKEN_GROUP_LABELS: Record<TokenGroup, string> = {
  color: "Color Tokens",
  typography: "Typography",
  spacing: "Spacing",
  radius: "Radius",
  shadow: "Shadow",
};

/** Hint shown under each group's header — keeps the UI self-documenting
 * without writing a separate help page. */
export const TOKEN_GROUP_HINTS: Record<TokenGroup, string> = {
  color: "팔레트의 step에 의미별 별칭을 붙입니다. 자유 입력 대신 팔레트 참조만 가능.",
  typography: "글꼴, 글자 크기, 두께 등을 자유 입력으로 정의합니다.",
  spacing: "간격 스케일을 자유 입력으로 정의합니다 (예: 8px, 1rem).",
  radius: "모서리 반경 토큰 (예: 4px, 9999px).",
  shadow: "그림자 토큰 — CSS box-shadow 문자열 그대로 입력합니다.",
};

export function isTokenGroup(value: string): value is TokenGroup {
  return (TOKEN_GROUPS as readonly string[]).includes(value);
}
