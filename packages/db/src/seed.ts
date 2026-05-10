/**
 * Dev-only seed script. Runs at the start of every `pnpm dev`.
 *
 * Wipes ONLY the app tables (product, prd) and reinserts a deterministic
 * fixture so every dev session starts from the same state. Auth tables
 * (user, session, account, verification) are preserved so we don't have
 * to re-sign-in every time.
 *
 * Behavior when no users exist yet: sign in once via Google OAuth, then
 * `pnpm dev` again — seed will populate products under your user.
 *
 * The script bypasses ./index.ts (which constructs `db` at module load
 * time, before dotenv has loaded) and builds its own drizzle client
 * AFTER reading the env file.
 *
 * PRD content is built from the canonical PRD_BOILERPLATE (imported by
 * relative path from apps/web) so the form view round-trips cleanly on
 * seeded fixtures — same parser, same composer logic as production.
 */

import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { prd, prdVersion, product, user } from "./schema";

config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../apps/web/.env"),
});

/* Read the canonical boilerplate string out of apps/web at runtime.
 *
 * Direct cross-package import doesn't work here because apps/web is CJS
 * (no "type": "module") while packages/db is ESM, so tsx fails to resolve
 * named exports across the boundary. We sidestep that by reading the file
 * as text and extracting the markers + the template literal contents via
 * regex — narrow but stable since we control both files. */
const BOILERPLATE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../apps/web/src/server/product/domain/prd-boilerplate.ts",
);
const PRD_HUMAN_MARKER = "✏️";
const PRD_AI_MARKER = "🤖";
const PRD_BOILERPLATE: string = (() => {
  const src = readFileSync(BOILERPLATE_PATH, "utf-8");
  // Greedy match anchored at end-of-file so internal escaped backticks
  // (e.g., \`PENDING\` in section 5) don't terminate the capture early.
  const m = src.match(/export const PRD_BOILERPLATE = `([\s\S]*)`;\s*$/);
  if (!m) throw new Error("[seed] could not extract PRD_BOILERPLATE from " + BOILERPLATE_PATH);
  return m[1]
    .replace(/\$\{GAP\}|\$\{SECTION_GAP\}/g, "\u00a0")
    .replace(/\$\{PRD_HUMAN_MARKER\}/g, PRD_HUMAN_MARKER)
    .replace(/\$\{PRD_AI_MARKER\}/g, PRD_AI_MARKER)
    .replace(/\\`/g, "`"); // unescape source-level \` to runtime `
})();

if (!process.env.DATABASE_URL) {
  console.error("[seed] DATABASE_URL not set in apps/web/.env — skipping");
  process.exit(0);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const NBSP = "\u00a0";
const HEADING_RE = /^## (\d+)\./;

interface ParsedSection {
  headingLine: string;
  humanInstruction: string;
  aiInstruction: string | null;
}

/* Parse the canonical boilerplate once into per-section structure so we can
 * re-compose with seeded answers slotted between ✏️ and 🤖 (mirroring
 * composeContent in apps/web/src/client/entities/prd/lib/sections.ts). */
const SECTIONS: ParsedSection[] = (() => {
  const out: ParsedSection[] = [];
  const lines = PRD_BOILERPLATE.split("\n");
  let current: { headingLine: string; lines: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const paras = current.lines
      .join("\n")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    out.push({
      headingLine: current.headingLine,
      humanInstruction: paras.find((p) => p.startsWith(PRD_HUMAN_MARKER)) ?? "",
      aiInstruction: paras.find((p) => p.startsWith(PRD_AI_MARKER)) ?? null,
    });
  };
  for (const line of lines) {
    if (HEADING_RE.test(line)) {
      flush();
      current = { headingLine: line, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();
  return out;
})();

/** answers[i] is the user's input for section i+1 (or "" for unfilled). */
function buildPrdContent(answers: readonly string[]): string {
  const out: string[] = ["# PRD 제목", ""];
  SECTIONS.forEach((sec, i) => {
    out.push(sec.headingLine, "");
    out.push(sec.humanInstruction, "");
    out.push(NBSP, "");
    const answer = answers[i]?.trim() ?? "";
    if (answer.length > 0) {
      out.push(answer, "");
      out.push(NBSP, "");
    }
    if (sec.aiInstruction) {
      out.push(sec.aiInstruction, "");
    }
    if (i < SECTIONS.length - 1) {
      out.push(NBSP, "");
    }
  });
  return out.join("\n");
}

/* Hand-crafted valid v4 UUIDs (3rd group starts with 4, 4th with 8) so that
 * zod .uuid() accepts them on the API side. Stay deterministic so dev data
 * is stable across reseeds. */
const PRODUCT_IDS = {
  pilleus: "11111111-1111-4111-8111-111111111111",
  weather: "22222222-2222-4222-8222-222222222222",
} as const;

const PRD_IDS = {
  specLinking: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  aiDrafting: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
  consistency: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
  search: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
  versionHistory: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
  hyperlocal: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  severeAlerts: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
  alertThrottle: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3",
} as const;

/* ── PRD 답변 시드 ─────────────────────────────────────────────
 * 각 배열은 boilerplate 4개 섹션 순서:
 *   0: 개요  1: 배경  2: 목표  3: 동작 흐름
 * 빈 문자열은 "form 미입력 상태".
 */

const ANSWERS_AI_DRAFTING: string[] = [
  // 1. 개요
  "PM이 한 줄짜리 목표만 입력하면 LLM이 PRD 초안 골격을 자동 생성해주는 기능. 빈 페이지 공포증을 없애고 작성 시간을 절반 이하로 줄이는 것이 목적이다.",
  // 2. 배경
  "현재 PM은 매번 PRD를 처음부터 작성한다. 평균 작성 시간이 4-6시간이며, 그중 절반 이상이 \"무엇부터 써야 할지\" 고민하는 시간이다. 이 진입 장벽이 PRD 작성을 미루게 만들고, 결과적으로 엔지니어링이 모호한 요구사항으로 시작하는 일이 잦다.",
  // 3. 목표
  "PRD 초안 작성 시간을 절반으로 줄이고, 초안에서 최종본까지 가는 수정 횟수도 줄이는 게 목표. 신규 PM의 첫 PRD 작성 onboarding이 빨라지는 부수 효과도 노린다.",
  // 4. 동작 흐름
  "PM이 product 화면에서 \"PRD 추가\" 버튼을 클릭하면 모달이 열리고 한 줄짜리 목표를 입력할 수 있다. 입력 후 \"초안 생성\" 버튼을 누르면 LLM이 product 컨텍스트(미션·혜택·원칙·actor 목록)와 입력된 목표를 토대로 PRD 초안을 생성한다. 생성 중에는 진행 상태가 표시되고, 완료되면 자동으로 PRD 상세 화면으로 이동해 form 형태로 모든 섹션이 채워진 상태를 보여준다. PM은 form에서 각 섹션을 자유롭게 수정·보완하고 마지막에 \"저장\" 버튼으로 확정한다. 만약 product에 actor가 정의되어 있지 않으면 모달 단계에서 경고가 표시되고, PM은 actor를 먼저 정의하거나 actor 없이 진행할지 선택할 수 있다.",
];

const ANSWERS_SPEC_LINKING: string[] = [
  "PRD·정책·데이터 entity·UI element 등 product 내 문서가 서로를 안정적인 ID로 참조해, 한쪽에서 이름이 바뀌어도 다른 쪽 링크가 깨지지 않게 한다.",
  "현재는 문서 간 참조를 자유 텍스트로 한다. \"신청서 entity의 status 필드\" 같은 표현이 PRD에 흩어져 있는데, 누군가가 entity 이름을 \"신청\"으로 바꾸면 어떤 PRD가 영향받는지 알 길이 없다.",
  "문서 간 참조를 모두 ID 기반으로 전환하고, 이름·필드 변경 시 영향받는 PRD가 자동으로 알림된다. 끊긴 링크(broken reference)는 항상 0에 가깝게 유지한다.",
  "PM이 PRD 본문에서 \"@\"를 입력하면 같은 product 안의 entity·정책·UI element·user story가 자동완성 후보로 뜬다. 후보 중 하나를 선택하면 본문에 칩 형태로 삽입되고, 내부적으로는 ID 참조로 저장된다. 참조 대상 entity의 이름이 바뀌면 칩의 표시 텍스트가 자동으로 갱신되고, 참조 대상이 삭제되면 칩이 빨갛게 표시되며 hover 시 \"삭제됨\" 안내가 뜬다. PM이 \"끊긴 참조 보기\" 메뉴를 열면 product 내 모든 끊긴 참조가 PRD별로 묶여 보여, 한꺼번에 수정할 수 있다.",
];

const ANSWERS_CONSISTENCY: string[] = [
  "같은 product에 속한 PRD·정책·entity 사이의 모순을 자동으로 찾아 PM에게 알려준다. 예: PRD에는 \"사용자가 편집 가능\"이라 적혀 있는데 정책에는 \"읽기 전용\"이라 적혀 있는 경우.",
  "현재 product 내 문서가 5개를 넘어가면 사람이 일관성을 추적하기 어렵다. 모순은 보통 QA나 출시 직후 사용자 리포트로 발견되며, 그 시점엔 이미 비용이 크다.",
  "product 내 문서 간 모순 검출 정확도가 충분히 높아 PM이 PRD 저장 시점에 즉시 피드백을 받을 수 있어야 한다. 배치성 검사가 아닌 인라인 알림이 핵심.",
  "PM이 PRD를 저장하면 백그라운드에서 일관성 검사가 자동으로 시작된다. LLM이 같은 product에 속한 다른 PRD·정책·entity를 컨텍스트로 받아 모순 가능성을 평가한다. 모순이 의심되는 항목이 있으면 PRD 상단에 노란색 배너가 뜨고, 클릭하면 \"이 PRD의 X 진술이 정책 Y의 Z 항목과 어긋날 가능성이 있습니다\" 형태로 구체적인 지점이 표시된다. PM은 \"무시\" / \"수정\" / \"정책을 업데이트\" 중 하나를 선택할 수 있고, 무시한 항목은 다음 검사부터 제외된다.",
];

const ANSWERS_HYPERLOCAL: string[] = [
  "1km 격자 단위의 초정밀 지역 예보를 사용자에게 보여주는 위젯. 사용자의 현재 위치를 기반으로 10분 단위로 갱신된다.",
  "기존 날씨 앱은 행정구역 단위(시·구) 예보만 제공해, 같은 시 안에서도 비가 오는 곳과 안 오는 곳이 나뉘는 도시형 폭우에 대응하지 못한다.",
  "위젯의 일일 활성 사용자가 충분히 높고 위치 권한 허용률도 일정 수준 이상으로 유지되는 게 목표.",
  "일반 사용자가 앱을 열면 위젯이 자동으로 위치 권한을 요청한다. 권한이 허용되면 현재 위치의 GPS 좌표를 1km 격자로 매핑해 해당 격자의 예보를 기상 데이터 제공자로부터 받아 표시한다. 위젯은 현재 시각, 1시간 후, 3시간 후의 예보를 한 화면에 보여주고, 10분마다 백그라운드에서 자동 갱신된다. 권한이 거부되면 \"위치 없이 보기\" 모드로 전환되어 사용자가 직접 도시명을 검색해 입력할 수 있다.",
];

const ANSWERS_SEVERE_ALERTS: string[] = [
  "폭우·홍수·폭염 등 기상 특보 발효 시 사용자에게 푸시 알림을 보내는 기능.",
  "특보는 정부 기관에서 발표되지만 사용자가 별도 채널로 확인해야 한다. 외출 중이거나 야외 작업 중일 때 모르고 지나치는 경우가 많다.",
  "특보 발효 후 짧은 시간 안에 사용자에게 알림이 도달하고, 알림 옵트인율도 일정 수준 이상으로 유지되는 게 목표.",
  "알림 스케줄러가 기상 데이터 제공자로부터 특보를 실시간으로 받아, 사용자의 현재 위치(또는 등록한 관심 지역)에 해당하는 특보만 필터링해 푸시한다. 알림은 \"폭우 특보 발효 - 강남구\" 형태로 핵심만 짧게 보여주고, 탭하면 앱이 열리며 특보 상세 화면으로 이동한다. 사용자는 알림 설정에서 특보 종류별(폭우 / 홍수 / 폭염 / 강풍 등)로 on/off 할 수 있다.",
];

/* ── 발행본(LLM이 다듬은 markdown) ──────────────────────────
 * status === "published" 인 PRD는 form 보일러플레이트(✏️/🤖 지시문)가 아니라
 * 실제 LLM이 답변을 풀어 완성한 깔끔한 markdown 문서를 본문으로 갖는다.
 * Detail 페이지는 status==="published"일 때 MarkdownRenderer로 prose 렌더하므로,
 * 여기서는 헤딩·문단·리스트만 사용해 portable markdown으로 유지한다.
 */

const PUBLISHED_CONSISTENCY = `# 일관성 검사기

## 1. 개요

같은 product에 속한 PRD·정책·entity·element 사이의 모순을 자동으로 찾아 PM에게 인라인으로 알려주는 기능. PRD 저장 시점에 같은 product의 다른 문서들을 컨텍스트로 LLM이 비교해 모순 가능성을 평가하고, 의심 지점이 있으면 즉시 PRD 상단에 노란 배너로 노출한다.

이 기능은 Pilleus의 미션 "PM과 엔지니어가 첫 시도에 올바른 것을 만들 수 있도록 돕는다"를 직접 구현한다. "AI 보조 PRD 초안 작성"이 빈 페이지의 진입 장벽을 낮추는 역할이라면, 일관성 검사기는 product가 커지면서 늘어나는 문서 사이의 정합성 문제를 PM이 의식하기 전에 표면화한다.

## 2. 배경

**사용자 관점.** PM이 product의 문서가 5개를 넘기면서 머릿속에서 정합성을 추적하기 어려워진다. 누가 어디에 무엇을 적었는지 검색으로는 찾기 어렵고, 정책 한 줄을 바꿨을 때 영향받는 PRD를 일일이 리뷰하는 비용이 PRD 작성 자체보다 커진다.

**비즈니스 관점.** 모순은 보통 QA 단계나 출시 직후 사용자 리포트로 발견된다. 이 시점이면 이미 엔지니어링 시간이 잘못된 사양 위에서 소비된 뒤이고, 핫픽스·정책 재정의·사용자 공지가 동시에 필요해진다. 사양 단계에서 발견하는 비용 대비 출시 후 발견하는 비용은 한 자릿수 배수가 아니라 두 자릿수 배수다.

**기술 관점.** 모든 문서를 매번 정독해 비교하기엔 토큰 비용이 폭발하고, 모든 변경에 일괄 검사를 돌리기엔 PM의 작업 흐름을 끊는다. 따라서 (a) "저장 시점" 같은 자연스러운 트리거에서 (b) 같은 product 안의 관련 문서만 컨텍스트로 묶어 (c) 백그라운드로 평가하는 형태가 필요하다.

## 3. 목표

- **검출 정확도.** 모순 의심 알림의 false positive 비율이 충분히 낮아 PM이 알림 자체를 신뢰하게 만드는 것이 가장 중요하다. 측정은 PM의 명시적 피드백("무시" / "수정" / "정책 업데이트") 분포로 추적하며, "무시" 비율이 합의된 임계 이하로 유지돼야 한다.
- **인라인 피드백.** 검사 결과는 저장 후 짧은 시간 안에 PRD 상단에 도달해야 한다. 배치성·일간 리포트가 아닌, PM이 PRD 화면을 떠나기 전에 보이는 형태가 핵심이다.
- **점진적 학습.** PM이 "무시" 처리한 항목은 다음 검사부터 제외돼 같은 모순이 반복 알림으로 뜨지 않게 한다. 무시 목록은 PRD별로 보관되며 product 단위로 모아 볼 수 있어야 한다.

## 4. 동작 흐름

**정상 흐름.** PM이 PRD 상세 페이지에서 Save를 누르면 서버는 (a) PRD 본문을 저장하고 (b) 백그라운드 잡으로 일관성 검사를 enqueue한다. 검사는 같은 product에 속한 다른 published PRD·정책·entity 정의를 컨텍스트로 묶어 LLM에 전달하고, 본 PRD의 진술이 그 컨텍스트와 모순될 가능성이 있는지 평가받는다.

모순 의심 항목이 있으면 PRD 상단에 노란 배너가 뜨고, 클릭하면 "이 PRD의 X 진술이 정책 Y의 Z 항목과 어긋날 가능성이 있습니다 — Y의 Z는 '...', X는 '...'입니다" 형태로 구체 지점을 보여준다. PM은 항목별로 "무시" / "수정" / "정책을 업데이트" 중 하나를 선택할 수 있다.

\`\`\`mermaid
sequenceDiagram
    actor PM
    participant FE as PRD 상세 페이지
    participant API as 서버 API
    participant Q as 검사 잡 큐
    participant LLM
    participant DB

    PM->>FE: Save 클릭
    FE->>API: PRD 본문 저장 요청
    API->>DB: PRD 저장
    API->>Q: 일관성 검사 잡 enqueue
    API-->>FE: 저장 성공 (즉시 응답)
    Q->>DB: 같은 product의 PRD/정책/entity 조회
    Q->>LLM: 본 PRD + 컨텍스트 전달
    LLM-->>Q: 모순 의심 항목 목록
    alt 의심 항목 있음
        Q->>DB: 검사 결과 저장
        Q-->>FE: 노란 배너 노출
    else 의심 없음
        Q->>DB: clean 결과 저장
    end
\`\`\`

**분기.** "수정"은 본 PRD의 해당 단락 위치로 스크롤·하이라이트한다. "정책을 업데이트"는 모순의 상대편 문서(여기서는 정책 Y) 페이지로 이동하며, 이동 후에도 의심 지점이 그대로 표시되어 한 번에 처리할 수 있다. "무시"는 항목 ID와 사유(선택)를 기록하고 다음 검사부터 제외한다.

\`\`\`mermaid
flowchart TD
    A["배너에서 의심 항목 클릭"] --> B{"PM 선택"}
    B -->|"수정"| C["본 PRD 해당 단락으로 스크롤·하이라이트"]
    B -->|"정책을 업데이트"| D["상대편 정책 문서로 이동<br/>(의심 지점 그대로 표시)"]
    B -->|"무시"| E["항목 ID + 사유 기록"]
    E --> F["다음 검사부터 제외"]
\`\`\`

**예외.** product에 다른 문서가 하나도 없는 상태에서 PRD를 저장하면 비교 대상이 없어 검사를 스킵하고 배너를 노출하지 않는다. LLM 호출이 실패하거나 타임아웃이 나면 PRD 저장 자체에는 영향이 없으며, 배너 자리에 "검사를 일시적으로 수행하지 못했습니다 — 재시도" 링크를 노출한다.

**엣지 케이스.** PRD가 저장 직후 다시 빠르게 수정되면 직전 검사 잡이 stale해진다. 같은 PRD에 대한 검사 잡은 항상 가장 최근 잡 1개만 유효하도록 디바운스하고, 이전 잡 결과는 폐기한다.

\`\`\`mermaid
stateDiagram-v2
    [*] --> Pending: 잡 enqueue
    Pending --> Running: 워커가 pickup
    Running --> Completed: LLM 응답 수신
    Pending --> Superseded: 같은 PRD 새 저장 발생
    Running --> Superseded: 같은 PRD 새 저장 발생
    Superseded --> [*]: 결과 폐기
    Completed --> [*]: 배너 노출 또는 clean
\`\`\`

또한 검사 비용을 제한하기 위해 컨텍스트로 묶이는 문서 수에는 product 단위 상한을 두고, 이를 초과하는 product에서는 "유사도 상위 N개"만 후보로 추린다 — 후보 선정 로직은 별도 PRD에서 다룬다.
`;

const PUBLISHED_SEVERE_ALERTS = `# 기상 특보 알림

## 1. 개요

폭우·홍수·폭염·강풍 등 기상 특보 발효 시, 사용자의 현재 위치 또는 등록한 관심 지역에 해당하는 특보만 골라 즉시 푸시 알림으로 전달하는 기능. 사용자가 정부 채널을 따로 확인할 필요 없이, 외출 중·이동 중에도 자기 지역 특보를 놓치지 않도록 한다.

이 기능은 "사람들에게 우산을 챙겨야 할지 알려준다"는 product 미션의 임계 상황 버전이다. 평상시 예보가 일상의 의사결정을 돕는 거라면, 특보 알림은 안전과 직결된 의사결정(외출 취소·야외 작업 중단·대피 경로 확인)을 시간 안에 가능하게 한다.

## 2. 배경

**사용자 관점.** 기상 특보는 정부 기관에서 즉시 발표되지만 사용자가 별도 채널(웹·TV·재난 문자)에서 확인해야 한다. 외출 중이거나 야외 작업 중일 때 이 채널들을 능동적으로 확인하기 어렵고, 모르고 지나치는 사례가 사용자 인터뷰에서 반복적으로 나왔다.

**비즈니스 관점.** 특보 알림은 retention 동기 중에서도 가장 강한 종류다 — "이 앱이 나를 위험에서 보호해준 적이 있다"는 경험은 일반 예보 정확도보다 훨씬 강하게 사용자를 묶어둔다. 동시에 알림 옵트아웃은 retention의 가장 큰 적이라, "꼭 필요한 알림만 온다"는 인상을 유지하는 게 critical이다.

**기술 관점.** 정부 발표 채널의 폴링 주기, 사용자 위치 정확도, 푸시 전달 지연 — 이 셋이 합쳐져 "특보 발효 → 사용자 알림 도달"까지의 전체 latency를 결정한다. 각 단계의 상한을 명시하지 않으면 어디서 시간이 새는지 추적이 안 된다.

## 3. 목표

- **도달 시간.** 특보 발효 시점부터 사용자 단말에 푸시가 도달하기까지의 95p latency가 합의된 임계 이내. 측정은 발효 timestamp(공식 데이터)와 클라이언트 ack timestamp의 차이로 한다.
- **옵트인율.** 첫 실행 시 알림 권한을 허용하는 비율을 일정 수준 이상으로 유지. 거부 사용자에게는 차후 "특보가 있었지만 알림을 못 보냈습니다" 인앱 안내로 재요청 기회를 만든다.
- **신호 대 잡음비.** 알림당 사용자 인터랙션(탭·닫기·옵트아웃) 분포에서 옵트아웃 비율을 일정 수준 이하로 억제. 이 목표는 "특보 알림 빈도 제한" PRD와 합쳐 추적한다.

## 4. 동작 흐름

**정상 흐름.** 알림 스케줄러가 기상 데이터 제공자의 특보 피드를 짧은 주기로 폴링한다. 새 특보가 감지되면 (a) 특보 영역(시·구 또는 격자)을 추출하고 (b) 그 영역에 현재 위치가 있거나 관심 지역으로 등록한 사용자를 조회해 (c) 푸시 페이로드를 생성한다. 페이로드는 "폭우 특보 발효 — 강남구" 같은 짧은 헤드라인과 특보 등급 색상, 상세 화면으로의 deep link로 구성된다.

사용자가 알림을 탭하면 앱이 열리며 해당 특보의 상세 화면으로 직진한다. 상세 화면에는 특보 종류·등급·영역·발효 시각·해제 예상 시각·정부 발표 원문 링크·관련 행동 가이드(외출 자제·저지대 이동 등)가 표시된다.

\`\`\`mermaid
sequenceDiagram
    participant 기상청 as 기상 데이터 제공자
    participant 스케줄러 as 알림 스케줄러
    participant DB
    participant 푸시 as 푸시 게이트웨이
    actor 사용자

    loop 짧은 주기 폴링
        스케줄러->>기상청: 특보 피드 조회
        기상청-->>스케줄러: 특보 목록
    end
    Note over 스케줄러: 새 특보 감지
    스케줄러->>스케줄러: 특보 영역 추출
    스케줄러->>DB: 영역에 해당하는 대상자 조회
    DB-->>스케줄러: 사용자 목록 (위치/관심지역)
    스케줄러->>푸시: 페이로드 전송
    푸시-->>사용자: "폭우 특보 발효 — 강남구"
    사용자->>사용자: 알림 탭
    사용자->>DB: 특보 상세 조회 (deep link)
\`\`\`

**분기.** 사용자가 알림 설정에서 종류별(폭우·홍수·폭염·강풍) on/off를 미리 끈 경우, 해당 종류 특보는 발생해도 푸시되지 않는다. 단 종류별 토글은 독립적이라, "폭우 OFF"여도 같은 영역에 "홍수 특보"가 동시 발효되면 홍수 쪽으로는 푸시된다.

관심 지역이 다수인 사용자가 여러 지역의 특보를 받게 되면, 같은 종류의 특보라도 영역별로 별도 푸시로 분리해 사용자가 어느 지역 일인지 헤드라인만 보고도 즉시 알 수 있게 한다.

\`\`\`mermaid
flowchart TD
    A["새 특보 감지"] --> B{"위치 권한?"}
    B -->|"있음"| C["현재 위치 격자 매칭"]
    B -->|"없음 + 관심 지역 있음"| D["관심 지역만 매칭"]
    B -->|"없음 + 관심 지역 없음"| E["알림 대상 제외<br/>(다음 인앱 진입 시 안내)"]
    C --> F{"종류별 알림 토글 ON?"}
    D --> F
    F -->|"OFF"| G["해당 종류 푸시 스킵"]
    F -->|"ON"| H{"throttle 규칙 통과?"}
    H -->|"실패"| I["묶거나 무시<br/>(빈도 제한 PRD)"]
    H -->|"통과"| J["영역별로 분리해 푸시"]
\`\`\`

**예외.** 위치 권한이 없는 사용자에게는 "현재 위치 기반 특보"를 보낼 수 없다. 이 경우 관심 지역이 등록돼 있으면 그 지역만 처리하고, 관심 지역도 없으면 알림 대상에서 제외된다. 다음 인앱 진입 시 "위치 또는 관심 지역을 등록하면 특보를 받을 수 있어요" 안내를 한 번 보여준다.

기상 데이터 제공자 API가 다운되면 폴링 잡은 backoff로 재시도하며, 일정 시간 이상 연속 실패하면 운영 채널로 알람을 발생시킨다 — 사용자에게는 어떤 메시지도 보내지 않는다(잘못된 알림과 누락 알림 모두 신뢰 손상이지만, "안 보내는 쪽"이 사용자 입장에서 덜 해롭다).

**엣지 케이스.** 같은 종류·같은 영역·짧은 시간 안에 갱신되는 특보는 "특보 알림 빈도 제한" PRD의 throttle 규칙에 따라 묶이거나 무시된다. 발효 후 즉시 해제되는 false-positive 특보는 "방금 발효된 특보가 해제되었습니다" 후속 알림으로 정정 — 단, 이 후속 알림 자체도 throttle 대상에 포함된다.

\`\`\`mermaid
stateDiagram-v2
    [*] --> 발효: 기상청 특보 발표
    발효 --> 알림발송: 매칭 사용자 푸시
    알림발송 --> 갱신대기: 짧은 시간 내 갱신
    갱신대기 --> Throttled: 같은 종류·영역 반복
    갱신대기 --> 알림발송: 새 종류 또는 영역 변경
    발효 --> FalsePositive: 발효 직후 해제
    FalsePositive --> 정정알림: "해제되었습니다" 후속 푸시
    알림발송 --> 해제: 정상 해제 시각 도달
    정정알림 --> [*]
    해제 --> [*]
    Throttled --> [*]
\`\`\`
`;

/* 아직 작성 초기 단계인 PRD들 — 일부 섹션은 비워서 form 미입력 상태도 시연. */

const ANSWERS_SEARCH: string[] = [
  "product 안의 모든 PRD·정책·entity·element·user story를 한 번에 검색할 수 있는 시맨틱 서치 기능. 키워드 매칭이 아니라 의미 기반.",
  "product에 문서가 쌓이면 PM이 \"비슷한 기능을 전에 어디에 적었더라\"를 찾기 어려워진다. 키워드 검색은 동의어·재정의된 용어를 못 잡는다.",
  "",
  "",
];

const ANSWERS_VERSION_HISTORY: string[] = [
  "PRD가 발행된 시점마다 스냅샷을 저장해, 이후에 \"언제 어떻게 바뀌었는지\" 시간순으로 볼 수 있게 한다.",
  "",
  "",
  "",
];

const ANSWERS_ALERT_THROTTLE: string[] = [
  "기상 특보 알림이 너무 자주 와서 사용자가 옵트아웃하지 않도록, 같은 종류의 특보는 시간 단위로 묶어 한 번만 알리는 throttle 기능.",
  "장마철에 폭우 특보가 30분 단위로 갱신되면서 알림이 분 단위로 쏟아지는 일이 있었다. 사용자 리포트로 옵트아웃이 늘었다는 신호.",
  "특보 종류별로 합리적인 throttle 간격을 정해, 알림 전체 빈도를 일정 수준 이하로 억제한다. 동시에 진짜 새로운 특보(다른 종류 / 지역 변경)는 즉시 도달하도록.",
  "",
];

async function main() {
  console.log("[seed] wiping product + prd ...");
  // prd has FK to product with onDelete cascade; explicit delete first
  // to keep the order obvious regardless of driver behavior.
  await db.delete(prd);
  await db.delete(product);

  const users = await db.select().from(user).limit(1);
  if (users.length === 0) {
    console.log(
      "[seed] no users in DB yet. Sign in via /sign-in then rerun `pnpm dev` to populate seed data.",
    );
    return;
  }
  const u = users[0];
  console.log(`[seed] seeding for ${u.email} (${u.id})`);

  await db.insert(product).values([
    {
      id: PRODUCT_IDS.pilleus,
      name: "Pilleus",
      description: "PM과 엔지니어를 위한 AI 기반 PRD 작성 도구",
      mission: "PM과 엔지니어가 첫 시도에 올바른 것을 만들 수 있도록 돕는다",
      benefits: [
        "PRD를 위한 단일 진실 공급원",
        "AI 보조 PRD 초안 작성",
        "문서 간 일관성 실시간 점검",
      ],
      principles: [
        "스펙은 코드처럼 버전 관리한다",
        "AI 제안은 인라인으로만, 자동 편집은 절대 금지",
        "모든 export는 portable Markdown 유지",
      ],
      actors: ["PM", "엔지니어", "AI 어시스턴트"],
      userId: u.id,
    },
    {
      id: PRODUCT_IDS.weather,
      name: "샘플 날씨 앱",
      description: "섹션 뷰를 시험해볼 수 있는 데모 product",
      mission: "사람들에게 우산을 챙겨야 할지 알려준다",
      benefits: [
        "초정밀 지역 예보",
        "기상 특보 알림",
        "프라이버시 우선 텔레메트리",
      ],
      principles: ["위치 데이터를 절대 판매하지 않는다", "오프라인 우선 — 마지막 예보 캐시"],
      actors: ["일반 사용자", "기상 데이터 제공자", "알림 스케줄러"],
      userId: u.id,
    },
  ]);

  /* Mix of draft and published so both views are reachable in dev. */
  const prdRows = [
    {
      id: PRD_IDS.specLinking,
      productId: PRODUCT_IDS.pilleus,
      title: "스펙 링크와 상호 참조",
      benefitIndex: 0,
      content: buildPrdContent(ANSWERS_SPEC_LINKING),
      status: "draft" as const,
    },
    {
      id: PRD_IDS.aiDrafting,
      productId: PRODUCT_IDS.pilleus,
      title: "AI 보조 PRD 초안 작성",
      benefitIndex: 1,
      content: buildPrdContent(ANSWERS_AI_DRAFTING),
      status: "draft" as const,
    },
    {
      id: PRD_IDS.consistency,
      productId: PRODUCT_IDS.pilleus,
      title: "일관성 검사기",
      benefitIndex: 2,
      content: PUBLISHED_CONSISTENCY,
      status: "published" as const,
    },
    {
      id: PRD_IDS.search,
      productId: PRODUCT_IDS.pilleus,
      title: "시맨틱 검색",
      benefitIndex: 0,
      content: buildPrdContent(ANSWERS_SEARCH),
      status: "draft" as const,
    },
    {
      id: PRD_IDS.versionHistory,
      productId: PRODUCT_IDS.pilleus,
      title: "버전 히스토리",
      benefitIndex: null,
      content: buildPrdContent(ANSWERS_VERSION_HISTORY),
      status: "draft" as const,
    },
    {
      id: PRD_IDS.hyperlocal,
      productId: PRODUCT_IDS.weather,
      title: "초정밀 지역 예보 위젯",
      benefitIndex: 0,
      content: buildPrdContent(ANSWERS_HYPERLOCAL),
      status: "draft" as const,
    },
    {
      id: PRD_IDS.severeAlerts,
      productId: PRODUCT_IDS.weather,
      title: "기상 특보 알림",
      benefitIndex: 1,
      content: PUBLISHED_SEVERE_ALERTS,
      status: "published" as const,
    },
    {
      id: PRD_IDS.alertThrottle,
      productId: PRODUCT_IDS.weather,
      title: "특보 알림 빈도 제한",
      benefitIndex: 1,
      content: buildPrdContent(ANSWERS_ALERT_THROTTLE),
      status: "draft" as const,
    },
  ];
  await db.insert(prd).values(prdRows);

  /* Auto-seed v1 for PRDs that don't have an explicit version arc below.
   * aiDrafting / consistency / severeAlerts get hand-rolled snapshots to
   * show the typical drafting → publish progression. The rest just need
   * a v1 so the list view's "Version" column isn't "—". */
  const PRDS_WITH_EXPLICIT_VERSIONS = new Set<string>([
    PRD_IDS.aiDrafting,
    PRD_IDS.consistency,
    PRD_IDS.severeAlerts,
  ]);
  const autoVersionRows = prdRows
    .filter((p) => !PRDS_WITH_EXPLICIT_VERSIONS.has(p.id))
    .map((p) => ({
      id: crypto.randomUUID(),
      prdId: p.id,
      version: 1,
      title: p.title,
      benefitIndex: p.benefitIndex,
      content: p.content,
      status: p.status,
      aiReviewedContent: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    }));
  await db.insert(prdVersion).values(autoVersionRows);

  /* Seed a few version snapshots on `aiDrafting` so the history panel has
   * something to show out of the box. Three versions show the typical
   * arc: pristine boilerplate → first form input → published markdown. */
  const aiDraftingV1Content = buildPrdContent(["", "", "", ""]);
  const aiDraftingV2Content = buildPrdContent([
    "PM이 한 줄 목표만 입력하면 LLM이 PRD 초안을 만들어주는 기능.",
    "",
    "",
    "",
  ]);
  const aiDraftingV3Content = buildPrdContent(ANSWERS_AI_DRAFTING);

  /* For published PRDs, show v1 (form-shape draft) → v2 (LLM-completed
   * markdown). This mirrors the real publish flow: author drafts in the
   * form view, then publishes a polished markdown body. */
  const explicitVersionRows = [
    {
      id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
      prdId: PRD_IDS.aiDrafting,
      version: 1,
      title: "AI 보조 PRD 초안 작성",
      benefitIndex: 1,
      content: aiDraftingV1Content,
      status: "draft" as const,
      aiReviewedContent: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
      prdId: PRD_IDS.aiDrafting,
      version: 2,
      title: "AI 보조 PRD 초안 작성",
      benefitIndex: 1,
      content: aiDraftingV2Content,
      status: "draft" as const,
      aiReviewedContent: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
      prdId: PRD_IDS.aiDrafting,
      version: 3,
      title: "AI 보조 PRD 초안 작성",
      benefitIndex: 1,
      content: aiDraftingV3Content,
      status: "draft" as const,
      aiReviewedContent: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd1",
      prdId: PRD_IDS.consistency,
      version: 1,
      title: "일관성 검사기",
      benefitIndex: 2,
      content: buildPrdContent(ANSWERS_CONSISTENCY),
      status: "draft" as const,
      aiReviewedContent: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd2",
      prdId: PRD_IDS.consistency,
      version: 2,
      title: "일관성 검사기",
      benefitIndex: 2,
      content: PUBLISHED_CONSISTENCY,
      status: "published" as const,
      aiReviewedContent: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1",
      prdId: PRD_IDS.severeAlerts,
      version: 1,
      title: "기상 특보 알림",
      benefitIndex: 1,
      content: buildPrdContent(ANSWERS_SEVERE_ALERTS),
      status: "draft" as const,
      aiReviewedContent: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
    {
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2",
      prdId: PRD_IDS.severeAlerts,
      version: 2,
      title: "기상 특보 알림",
      benefitIndex: 1,
      content: PUBLISHED_SEVERE_ALERTS,
      status: "published" as const,
      aiReviewedContent: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  ];
  await db.insert(prdVersion).values(explicitVersionRows);

  console.log(
    `[seed] done — 2 products, ${prdRows.length} prds, ${autoVersionRows.length + explicitVersionRows.length} versions`,
  );
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
