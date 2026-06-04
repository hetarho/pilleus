# Pilleus — AI 워크플로우 UX (UX)

> 누구든, 자기가 원하는 LLM으로 기획할 수 있어야 한다.

## UX 철학 — LLM 자유 선택 (BYO-LLM)

Pilleus는 특정 AI 제공자에 사용자를 묶지 않는다. 어떤 사람은 회사가 승인한
모델만 써야 하고, 어떤 사람은 Claude를, 어떤 사람은 GPT를, 어떤 사람은
사내 폐쇄망 LLM만 쓸 수 있다. Pilleus는 **이 선택을 빼앗지 않는 것**을
UX의 1원칙으로 둔다.

그래서 AI를 쓰는 워크플로우를 **두 가지**로 제공한다. 둘은 같은 작업
(task)을 공유하며, 사용자가 처한 환경에 따라 둘 중 무엇이든 고를 수 있다.

## 두 가지 AI Agent 사용 UX

### 1. Pilleus 내장 AI 워크플로우 (자동)

Pilleus가 직접 LLM을 호출한다. 사용자는 버튼만 누르면 된다.

```
사용자 → [생성] 클릭 → Pilleus가 프롬프트 구성 → LLM 호출 → 응답 파싱 → DB 저장
                         └──────────── 전부 서버 안에서 ────────────┘
```

- 손이 가장 적게 가는 매끄러운 경험.
- 외부로 복사/붙여넣기가 필요 없다.
- 단, Pilleus(또는 사용자)가 설정한 API 키와 모델에 의존한다.

### 2. Copy-Paste 브릿지 워크플로우 (수동, BYO-LLM)

Pilleus는 **프롬프트만 만들어 준다.** 사용자는 그 프롬프트를 자기가 원하는
어떤 LLM에든 붙여넣고, 돌아온 응답을 다시 Pilleus에 붙여넣는다. Pilleus는
그 응답을 **파싱해서 DB에 넣는다.**

```
Pilleus → 프롬프트 생성 → [복사]
                            │
            사용자가 원하는 LLM (Claude / GPT / 사내 모델 / 무엇이든)
                            │
        LLM 응답 ──[복사]──► Pilleus → 파싱 → 검증 → DB 저장
```

- **API 키도, 통합도 필요 없다.** 붙여넣기만 되면 어떤 모델이든 동작한다.
- 폐쇄망·사내 전용 모델·구독형 웹 UI 등 API가 없는 환경에서도 쓸 수 있다.
- 사용자가 LLM과 주고받는 과정을 직접 본다 — 중간에 LLM이 되묻는
  질문(페이즈 질문)에 답하며 결과를 다듬을 수 있다.

## 두 워크플로우는 같은 코드를 공유한다

이 두 UX는 별개의 기능이 아니다. **하나의 LLM task**를 두 가지 방식으로
구동하는 것뿐이다. task는 두 개의 책임으로 쪼개져 있다:

| 책임 | 코드 | 자동 플로우에서 | 수동 플로우에서 |
|------|------|----------------|----------------|
| **프롬프트 구성** | `build-*-prompt` use case | 서버가 호출 후 LLM에 전달 | FE가 호출 후 클립보드에 복사 |
| **응답 파싱·저장** | `submit-*-response` use case | LLM 응답을 그대로 전달 | 사용자가 붙여넣은 텍스트를 전달 |

```ts
// llm-task의 형태 — 두 플로우가 공유하는 단일 정의
interface LlmTask<In, Parsed> {
  buildPrompt(input: In): LlmPrompt;        // system + user 프롬프트
  parseResponse(raw: string): Parsed;        // 원문 → 구조화된 결과
}
```

핵심 설계 포인트:

- **`buildPrompt`** 는 자동/수동 어디서 호출되든 동일한 프롬프트를 만든다.
  자동 플로우는 이걸 LLM에 바로 넘기고, 수동 플로우는 사용자에게 복사해
  준다. → 한쪽을 고쳐도 양쪽이 같이 개선된다.
- **`parseResponse`** 는 입력이 "API 응답"이든 "사용자가 붙여넣은 텍스트"든
  구분하지 않는다. 둘 다 그냥 원문 문자열이다. 저장 경로(write site)가
  하나뿐이라, 데이터 정합성 규칙도 한 곳에서만 관리된다.

> 코드 근거: [`prd-completion-task.ts`](../apps/web/src/server/product/application/llm-tasks/prd-completion-task.ts),
> [`build-prd-completion-prompt.ts`](../apps/web/src/server/product/application/use-cases/build-prd-completion-prompt.ts),
> [`submit-prd-completion-response.ts`](../apps/web/src/server/product/application/use-cases/submit-prd-completion-response.ts)

## 파싱은 관대하게, 거부는 분명하게

수동 플로우에서는 사용자가 LLM 응답을 통째로 붙여넣는다. LLM은 추론·예시·
되묻는 질문을 결과 앞뒤에 섞어 내놓기 마련이다. Pilleus의 파서는 이를 전제로
설계됐다:

- 응답에서 **실제 산출물에 해당하는 블록**만 골라낸다
  (예: PRD는 `## N.` 번호 heading을 가진 마지막 markdown 코드블록).
- 코드펜스를 빠뜨리는 흔한 실수는 전체 텍스트로 **fallback** 한다 —
  사용자가 이후에 편집할 수 있으므로.
- **빈 응답·본문 없음** 같은 진짜 실패만 `ValidationError`로 분명히 거부한다.

즉 "어떤 LLM을 쓰든 웬만하면 동작하되, 명백히 깨진 입력은 DB에 들어가지
못하게" 하는 것이 파싱의 목표다.

## 프롬프트는 방법론을 담는다

프롬프트는 단순한 질문이 아니라 **작업 방법론**을 인코딩한다. 예를 들어
PRD 완성 task는 "한 번에 끝내지 말고, 빈틈을 페이즈 단위 질문으로 메운 뒤,
모든 모호함이 사라졌을 때만 최종 markdown을 반환"하도록 LLM을 지시한다.

- **system** 프롬프트 = 방법론 + 출력 계약. PRD마다 고정이라 제공자 간
  재사용·캐싱이 가능하다.
- **user** 프롬프트 = 이번 실행의 실제 데이터(해당 PRD + product 컨텍스트).

이 분리 덕분에 **어떤 LLM에 붙여넣어도 같은 방법론으로 같은 형식의 결과**가
나오도록 유도할 수 있다. LLM 자유 선택 철학이 결과 품질의 일관성과 충돌하지
않는 이유다.

## 관련 문서

- [concept.md](./concept.md) — 기획 철학과 레이어/의존성 구조
