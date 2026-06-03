/* The concept graph's vocabulary. A reference is a directed "import" edge from a
 * source artifact to a target concept. The hard rule mirrors Clean Architecture's
 * dependency rule: an artifact may only import concepts that sit in a MORE STABLE
 * (inner) ring than itself — outer imports inner, never the reverse. */

export const RINGS = ["intent", "principles", "spec", "surface"] as const;
export type Ring = (typeof RINGS)[number];

/** Concentric order: lower index = more stable (inner) ring. */
const RING_ORDER: Record<Ring, number> = {
  intent: 0,
  principles: 1,
  spec: 2,
  surface: 3,
};

export const REFERENCE_KINDS = [
  "benefit",
  "persona",
  "policy",
  "token",
  "prd",
  "wireframe",
  "user-story",
] as const;
export type ReferenceKind = (typeof REFERENCE_KINDS)[number];

const RING_OF_KIND: Record<ReferenceKind, Ring> = {
  benefit: "intent",
  persona: "intent",
  policy: "principles",
  token: "principles",
  prd: "spec",
  wireframe: "surface",
  "user-story": "surface",
};

export const REFERENCE_KIND_LABELS: Record<ReferenceKind, string> = {
  benefit: "Benefit",
  persona: "Persona",
  policy: "Principle",
  token: "Design token",
  prd: "PRD",
  wireframe: "Wireframe",
  "user-story": "User story",
};

export function isReferenceKind(v: string): v is ReferenceKind {
  return (REFERENCE_KINDS as readonly string[]).includes(v);
}

export function ringOfKind(kind: ReferenceKind): Ring {
  return RING_OF_KIND[kind];
}

/** True when `sourceKind` is allowed to import `targetKind` — i.e. the source
 * lives in a strictly outer (more volatile) ring than the target. */
export function canReference(sourceKind: ReferenceKind, targetKind: ReferenceKind): boolean {
  return RING_ORDER[RING_OF_KIND[sourceKind]] > RING_ORDER[RING_OF_KIND[targetKind]];
}
