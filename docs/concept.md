# Pilleus — 기획 철학 (Concept)

> 기획도 개발처럼 한다. 스펙을 코드와 같은 위상으로 끌어올리고,
> 코드를 관리하듯 스펙을 관리한다.

## 한 줄 요약

Pilleus는 **SDD(Spec-Driven Development)** 를 제품 그 자체로 만든 도구다.
"기획 → 개발"의 일방향 단계가 아니라, **스펙(기획 문서)을 코드와 동등한
1급 자산(first-class artifact)으로 격상**시키고, 소프트웨어 아키텍처의 원리를
그대로 기획에 적용한다.

## 왜 이런 철학인가

대부분의 조직에서 기획 문서는 코드보다 한 단계 낮은 위상에 머문다.

- 한 번 쓰이고 나면 코드와 따로 논다 (drift).
- 의존 관계가 암묵적이다. "이 정책을 바꾸면 어느 PRD가 영향을 받는가?"에
  답할 수 없다.
- 관심사가 한 문서에 뒤섞인다. 미션·원칙·기능 명세·화면이 한 페이지에
  엉켜 있어, 무엇이 무엇을 근거로 하는지 추적이 불가능하다.

코드에서는 이미 이 문제들을 푸는 방법을 안다 — **관심사 분리(separation of
concerns)** 와 **단방향 의존성(unidirectional dependency)**. Pilleus는 이
원리를 기획에 그대로 가져온다.

## 핵심 원리 1 — 스펙은 코드와 같은 위상이다

스펙은 "개발 전에 한 번 쓰고 버리는 것"이 아니라, 코드처럼 **계속 관리되는
살아있는 자산**이다.

- **버전이 있다.** PRD는 발행될 때마다 버전 행이 쌓인다
  (`prd-version`). 어떤 시점에 무엇이 정의돼 있었는지 되짚을 수 있다.
- **검증된다.** PRD가 참조하는 benefit은 product에 실제로 존재하는
  benefit이어야 한다 (`benefitId` FK 검증). 깨진 참조는 코드의 타입 에러처럼
  거부된다.
- **추적된다.** 모든 기획 산출물 사이의 관계가 명시적인 그래프로
  기록된다 (아래 *Reference 그래프* 참고).

## 핵심 원리 2 — 관심사를 레이어로 분리한다 (4개의 Ring)

기획을 한 덩어리로 다루지 않는다. **안정성(stability)** 을 축으로 동심원
4개의 ring으로 나눈다. 안쪽일수록 더 안정적(변하지 않는 것)이고, 바깥쪽일수록
더 휘발적(자주 바뀌는 것)이다.

```
  ┌─────────────────────────────────────────┐
  │  surface   — 화면·사용자 스토리           │  가장 휘발적 (바깥)
  │  ┌───────────────────────────────────┐   │
  │  │  spec    — PRD (기능 명세)          │   │
  │  │  ┌─────────────────────────────┐   │   │
  │  │  │ principles — 원칙·정책·토큰   │   │   │
  │  │  │  ┌───────────────────────┐   │   │   │
  │  │  │  │ intent — 미션·혜택·    │   │   │   │
  │  │  │  │          페르소나       │   │   │   │  가장 안정적 (안)
  │  │  │  └───────────────────────┘   │   │   │
  │  │  └─────────────────────────────┘   │   │
  │  └───────────────────────────────────┘   │
  └─────────────────────────────────────────┘
```

| Ring | 책임 | 구성 요소 |
|------|------|-----------|
| **intent** (0) | 이 제품이 *왜* 존재하는가 | mission, benefit, persona |
| **principles** (1) | *어떻게* 만들 것인가의 규칙 | policy(product/design/ux/etc), design token |
| **spec** (2) | *무엇을* 만드는가 | PRD |
| **surface** (3) | 사용자가 *실제로 보는 것* | wireframe, user story |

> 정의의 단일 출처(single source of truth)는 코드다 —
> [`apps/web/src/kernel/reference.ts`](../apps/web/src/kernel/reference.ts).
> 이 문서가 흔들리면 그 파일을 따른다.

## 핵심 원리 3 — 의존성은 한 방향으로만 흐른다

Clean Architecture의 **의존성 규칙(dependency rule)** 을 그대로 적용한다.

> **바깥 ring은 안쪽 ring만 참조할 수 있다. 그 반대는 절대 금지.**

- surface는 spec·principles·intent를 근거로 삼을 수 있다.
- spec(PRD)은 principles·intent를 참조할 수 있다.
- intent(미션·혜택)는 어떤 것도 참조하지 않는다 — 가장 안정적이므로.

왜 한 방향인가? **변경의 파급을 예측 가능하게 만들기 위해서다.** 안쪽
(미션)이 바뀌면 바깥쪽 전부가 흔들릴 수 있다 — 당연하다, 근본이 바뀐 거니까.
하지만 바깥쪽(화면 하나)이 바뀌어도 미션은 절대 영향받지 않는다. 의존성이
양방향이면 이 보장이 사라지고, 무엇을 바꿔도 전부를 다시 검토해야 한다.

이 규칙은 도메인에서 강제된다:

```ts
// kernel/reference.ts
export function canReference(source: ReferenceKind, target: ReferenceKind): boolean {
  // source가 target보다 "더 바깥(더 휘발적)" 일 때만 참조 허용
  return RING_ORDER[ringOf(source)] > RING_ORDER[ringOf(target)];
}
```

## Reference 그래프 — 스펙의 의존성 그래프

기획 산출물 사이의 모든 참조는 **방향이 있는 import 엣지**로 기록된다.
코드의 import 그래프와 같은 개념이다.

- **forward(imports)** — 이 산출물이 근거로 삼는 안쪽 개념들.
- **reverse(backlinks)** — 이 산출물을 근거로 삼는 바깥쪽 산출물들.
  (예: "이 페르소나를 바꾸면 어떤 PRD가 영향받는가?")

엣지를 만들 때 ring 순서 규칙이 도메인에서 검증되므로, **잘못된 방향의 의존성은
애초에 그래프에 들어올 수 없다.** PRD 상세 화면의 *Imports* 패널이 이 그래프를
사용자에게 노출한다.

## 코드 구조와의 대응

이 기획 철학은 백엔드 구조에 1:1로 반영돼 있다.

| 기획 개념 | 코드 위치 |
|-----------|-----------|
| ring / reference 어휘 | [`src/kernel/reference.ts`](../apps/web/src/kernel/reference.ts) |
| policy 분류(SUBJECT 축) | [`src/kernel/policy.ts`](../apps/web/src/kernel/policy.ts) |
| intent / spec 도메인 | `src/server/product/` (bounded context) |
| principles(token) 도메인 | `src/server/design/` |
| reference 그래프 도메인 | `src/server/` reference bounded context |

각 bounded context는 다시 `domain → application → infrastructure / interface`
4개 레이어로 같은 의존성 규칙을 따른다. 즉 **기획의 레이어 분리와 코드의 레이어
분리가 같은 사고방식의 두 표현**이다. 자세한 코드 규칙은
[README](../README.md)와 `.claude/skills/architecture`를 참고.

## 관련 문서

- [ux.md](./ux.md) — AI를 활용한 기획 워크플로우 UX
