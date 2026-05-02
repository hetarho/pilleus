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
import { drizzle } from "drizzle-orm/neon-http";
import { prd, product, user } from "./schema";

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

const db = drizzle(process.env.DATABASE_URL);

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
  hyperlocal: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  severeAlerts: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
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
  await db.insert(prd).values([
    {
      id: PRD_IDS.specLinking,
      productId: PRODUCT_IDS.pilleus,
      title: "스펙 링크와 상호 참조",
      benefitIndex: 0,
      content: buildPrdContent(ANSWERS_SPEC_LINKING),
      status: "draft",
    },
    {
      id: PRD_IDS.aiDrafting,
      productId: PRODUCT_IDS.pilleus,
      title: "AI 보조 PRD 초안 작성",
      benefitIndex: 1,
      content: buildPrdContent(ANSWERS_AI_DRAFTING),
      status: "draft",
    },
    {
      id: PRD_IDS.consistency,
      productId: PRODUCT_IDS.pilleus,
      title: "일관성 검사기",
      benefitIndex: 2,
      content: buildPrdContent(ANSWERS_CONSISTENCY),
      status: "published",
    },
    {
      id: PRD_IDS.hyperlocal,
      productId: PRODUCT_IDS.weather,
      title: "초정밀 지역 예보 위젯",
      benefitIndex: 0,
      content: buildPrdContent(ANSWERS_HYPERLOCAL),
      status: "draft",
    },
    {
      id: PRD_IDS.severeAlerts,
      productId: PRODUCT_IDS.weather,
      title: "기상 특보 알림",
      benefitIndex: 1,
      content: buildPrdContent(ANSWERS_SEVERE_ALERTS),
      status: "published",
    },
  ]);

  console.log("[seed] done — 2 products, 5 prds");
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
