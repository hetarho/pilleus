export const POLICY_CATEGORIES = ["design", "ux", "etc"] as const;
export type PolicyCategory = (typeof POLICY_CATEGORIES)[number];

export interface PolicySection {
  id: string;
  label: string;
  hint: string;
}

export const POLICY_CATEGORY_LABELS: Record<PolicyCategory, string> = {
  design: "Design",
  ux: "UX",
  etc: "Etc",
};

/* Token으로 표현되는 것(color/typography/spacing/radius/shadow)은 Design
 * System 섹션이 책임지므로 여기서 제외. 디자인 시스템으로는 옮길 수 없는
 * 상위 정책만 남김. */
export const DESIGN_POLICY_SECTIONS: readonly PolicySection[] = [
  {
    id: "visual-theme",
    label: "Visual Theme",
    hint: "mood, density, 디자인 철학 — 이 product가 어떤 느낌이어야 하는지",
  },
  {
    id: "component",
    label: "Component",
    hint: "버튼·입력·카드 등 컴포넌트의 상태와 일관성 규칙",
  },
  {
    id: "dos-donts",
    label: "Do's & Don'ts",
    hint: "디자인 가드레일 — 절대 하지 말아야 할 안티패턴 정리",
  },
  {
    id: "responsive",
    label: "Responsive",
    hint: "breakpoint·터치 타겟·레이아웃 collapse 전략",
  },
] as const;

export const UX_POLICY_SECTIONS: readonly PolicySection[] = [
  {
    id: "navigation",
    label: "Navigation",
    hint: "정보 구조·라벨링·breadcrumb·메뉴 일관성",
  },
  {
    id: "forms",
    label: "Forms",
    hint: "라벨·검증·에러 표시·기본값·자동 포커스 등 폼 규칙",
  },
  {
    id: "feedback",
    label: "Feedback",
    hint: "로딩·성공·에러·empty state 표시 정책",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    hint: "WCAG·키보드 조작·스크린리더·대비·포커스 가시성",
  },
  {
    id: "motion",
    label: "Motion",
    hint: "전환·애니메이션·reduced-motion 대응",
  },
  {
    id: "content",
    label: "Content / Voice",
    hint: "마이크로카피·tone·error 메시지 작성 톤",
  },
] as const;

export function getSectionsFor(category: PolicyCategory): readonly PolicySection[] {
  switch (category) {
    case "design":
      return DESIGN_POLICY_SECTIONS;
    case "ux":
      return UX_POLICY_SECTIONS;
    case "etc":
      return [];
  }
}

export function isPolicyCategory(v: string): v is PolicyCategory {
  return (POLICY_CATEGORIES as readonly string[]).includes(v);
}

export function isValidSectionFor(category: PolicyCategory, section: string | null): boolean {
  if (category === "etc") return section === null;
  if (section === null) return false;
  return getSectionsFor(category).some((s) => s.id === section);
}

export function getSectionLabel(category: PolicyCategory, section: string | null): string {
  if (section === null) return "";
  const found = getSectionsFor(category).find((s) => s.id === section);
  return found?.label ?? section;
}
