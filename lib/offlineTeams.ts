// Day는 섹션 식별자로 사용: 금파트1 / 금파트2 / 일파트1 / 일파트2
// (이름은 day로 유지하지만 의미는 Section)
export type Day = "fri-p1" | "fri-p2" | "sun-p1" | "sun-p2";

export type OfflineMember = {
  id: string;
  name: string;
  isModerator?: boolean;
};

export type OfflineTeam = {
  id: string;
  day: Day;
  label: string; // 예: "1조"
  room: string; // 예: "804호"
  moderator: string;
  members: OfflineMember[];
};

const m = (name: string): OfflineMember => ({ id: name, name });

// 홈에서 그룹핑할 때 사용
export const SECTION_INFO: Record<
  Day,
  {
    dayKey: "friday" | "sunday";
    dayLabel: string;
    partLabel: string;
    timeRange: string;
    note?: string;
  }
> = {
  "fri-p1": {
    dayKey: "friday",
    dayLabel: "금요일 (6/5)",
    partLabel: "파트 1",
    timeRange: "19:30~20:50",
  },
  "fri-p2": {
    dayKey: "friday",
    dayLabel: "금요일 (6/5)",
    partLabel: "파트 2",
    timeRange: "21:00~22:20",
    note: "방·모더 고정, 사람만 이동",
  },
  "sun-p1": {
    dayKey: "sunday",
    dayLabel: "일요일 (6/7)",
    partLabel: "파트 1",
    timeRange: "10:00~11:20",
  },
  "sun-p2": {
    dayKey: "sunday",
    dayLabel: "일요일 (6/7)",
    partLabel: "파트 2",
    timeRange: "11:30~12:50",
    note: "방·모더 고정, 사람만 이동",
  },
};

// 호환용 DAY_LABEL — 기존 import 안 깨지게 유지
export const DAY_LABEL: Record<Day, string> = {
  "fri-p1": "금 · 파트 1 · 19:30~20:50",
  "fri-p2": "금 · 파트 2 · 21:00~22:20",
  "sun-p1": "일 · 파트 1 · 10:00~11:20",
  "sun-p2": "일 · 파트 2 · 11:30~12:50",
};

// 모임 메타
export const MEETINGS = [
  {
    dayKey: "friday" as const,
    dayLabel: "금요일 (6/5)",
    timeRange: "19:30 ~ 22:30",
    venue: "강남 트레바리",
    headcount: "조배정 41명 + 촬영 로밍 2명",
    parts: ["fri-p1", "fri-p2"] as const,
  },
  {
    dayKey: "sunday" as const,
    dayLabel: "일요일 (6/7)",
    timeRange: "10:00 ~ 13:00",
    venue: "",
    headcount: "총 28명 (4조 × 7명)",
    parts: ["sun-p1", "sun-p2"] as const,
  },
];

export const ROAMING_PHOTOGRAPHERS = ["슬로우퀵", "솔라"];

// 호환용 MEETING_INFO — 기존 import 안 깨지게 (현재는 금요일 정보)
export const MEETING_INFO = {
  date: "금요일 (6/5)",
  time: "19:30~22:30",
  venue: "강남 트레바리",
  assigned: "조배정 41명",
  roamingPhotographers: ROAMING_PHOTOGRAPHERS,
};

// ────────────────── 토픽 ──────────────────
export type Topic = {
  title: string;
  subtitle: string;
  totalMin: number;
  perPersonSec: number;
};

const TOPICS_PART1: Topic[] = [
  {
    title: "아이스 브레이킹",
    subtitle: "3개 키워드로 자기소개 (1분/인)",
    totalMin: 10,
    perPersonSec: 60,
  },
  {
    title: "AI × 커리어 (일)",
    subtitle: "AI를 활용해서 커리어에 적용 / 레버리지 (풍성) 어떻게?",
    totalMin: 20,
    perPersonSec: 120,
  },
  {
    title: "AI × 삶",
    subtitle: "AI를 활용해서 삶에 적용 / 레버리지 (풍성) 어떻게?",
    totalMin: 20,
    perPersonSec: 120,
  },
  {
    title: "나만의 차별점",
    subtitle: "AI와 별개로 반드시 가져가야 하는 나만의 차별점?",
    totalMin: 20,
    perPersonSec: 120,
  },
];

const TOPICS_PART2: Topic[] = [
  {
    title: "아이스 브레이킹",
    subtitle: "3개 키워드로 자기소개 (1분/인)",
    totalMin: 10,
    perPersonSec: 60,
  },
  {
    title: "이기적공유의 순간",
    subtitle: "이기적공유의 가치에 직접 경험으로 공감했던 순간",
    totalMin: 20,
    perPersonSec: 120,
  },
  {
    title: "함께 학습",
    subtitle: "함께 학습하는 것에 대해서",
    totalMin: 20,
    perPersonSec: 120,
  },
  {
    title: "내가 만들 유닛",
    subtitle: "스폰지클럽에서 유닛을 한다면? 이런 것 같이 해보고 싶다",
    totalMin: 20,
    perPersonSec: 120,
  },
];

export const PART_TOPICS: Record<Day, Topic[]> = {
  "fri-p1": TOPICS_PART1,
  "fri-p2": TOPICS_PART2,
  "sun-p1": TOPICS_PART1,
  "sun-p2": TOPICS_PART2,
};

export const PART_HEADLINE: Record<Day, { tag: string; title: string }> = {
  "fri-p1": { tag: "금 · 파트 1", title: "AI와 커리어 · 삶" },
  "fri-p2": { tag: "금 · 파트 2", title: "스폰지클럽의 가치와 앞으로" },
  "sun-p1": { tag: "일 · 파트 1", title: "AI와 커리어 · 삶" },
  "sun-p2": { tag: "일 · 파트 2", title: "스폰지클럽의 가치와 앞으로" },
};

// ────────────────── 시드 ──────────────────
const team = (
  id: string,
  day: Day,
  num: number,
  room: string,
  moderator: string,
  members: string[],
): OfflineTeam => ({
  id,
  day,
  label: `${num}조`,
  room,
  moderator,
  members: members.map(m),
});

export const SEED_OFFLINE_TEAMS: OfflineTeam[] = [
  // ════════ 금요일 · 파트 1 ════════
  team("fri-p1-1", "fri-p1", 1, "804호", "먼지민(석지민)", [
    "비비안",
    "그린",
    "다니",
    "포노미터",
    "코니",
    "민트",
    "띵크",
    "이안",
    "애니",
  ]),
  team("fri-p1-2", "fri-p1", 2, "803호", "오웬(이성현)", [
    "뿌까",
    "에이미",
    "유스",
    "찌니",
    "달빛그린",
    "잭",
    "J",
    "로이캉",
    "마라",
    "린디",
  ]),
  team("fri-p1-3", "fri-p1", 3, "603호", "키노(강은주)", [
    "Nina",
    "yongs",
    "치코",
    "Hook2",
    "봄",
    "아가타",
    "이든",
    "거북이의꿈(나병우)",
    "라엘",
  ]),
  team("fri-p1-4", "fri-p1", 4, "801호", "개미(임종범)", [
    "피노",
    "덕수",
    "Galia",
    "제제",
    "배짱",
    "솔",
    "리보",
    "율리아",
    "Amy",
  ]),

  // ════════ 금요일 · 파트 2 (방·모더 고정) ════════
  team("fri-p2-1", "fri-p2", 1, "804호", "먼지민(석지민)", [
    "피노",
    "뿌까",
    "제제",
    "치코",
    "솔",
    "Hook2",
    "유스",
    "잭",
    "거북이의꿈(나병우)",
  ]),
  team("fri-p2-2", "fri-p2", 2, "803호", "오웬(이성현)", [
    "Galia",
    "그린",
    "yongs",
    "봄",
    "포노미터",
    "코니",
    "리보",
    "이안",
    "이든",
    "Amy",
  ]),
  team("fri-p2-3", "fri-p2", 3, "603호", "키노(강은주)", [
    "덕수",
    "비비안",
    "에이미",
    "배짱",
    "다니",
    "율리아",
    "달빛그린",
    "마라",
    "린디",
  ]),
  team("fri-p2-4", "fri-p2", 4, "801호", "개미(임종범)", [
    "Nina",
    "민트",
    "띵크",
    "찌니",
    "아가타",
    "애니",
    "J",
    "라엘",
    "로이캉",
  ]),

  // ════════ 일요일 · 파트 1 ════════
  team("sun-p1-1", "sun-p1", 1, "603호", "다다", [
    "artree",
    "이니",
    "석영",
    "거위의꿈(임정선)",
    "Amy",
    "신연수",
  ]),
  team("sun-p1-2", "sun-p1", 2, "804호", "흐민", [
    "잭",
    "슬로우퀵",
    "보미",
    "레이",
    "아이리스",
    "yongs",
  ]),
  team("sun-p1-3", "sun-p1", 3, "801호", "라라(오현라)", [
    "마라",
    "나무",
    "하늘",
    "헤이즐",
    "솔라",
    "나로",
  ]),
  team("sun-p1-4", "sun-p1", 4, "803호", "에밀리(문주희)", [
    "초보자",
    "지니",
    "에이스",
    "히얌",
    "이든",
    "모닥",
  ]),

  // ════════ 일요일 · 파트 2 (방·모더 고정) ════════
  team("sun-p2-1", "sun-p2", 1, "603호", "다다", [
    "지니",
    "잭",
    "슬로우퀵",
    "하늘",
    "히얌",
    "헤이즐",
  ]),
  team("sun-p2-2", "sun-p2", 2, "804호", "흐민", [
    "마라",
    "초보자",
    "이든",
    "석영",
    "거위의꿈(임정선)",
    "나로",
  ]),
  team("sun-p2-3", "sun-p2", 3, "801호", "라라(오현라)", [
    "에이스",
    "보미",
    "이니",
    "아이리스",
    "모닥",
    "신연수",
  ]),
  team("sun-p2-4", "sun-p2", 4, "803호", "에밀리(문주희)", [
    "나무",
    "artree",
    "솔라",
    "Amy",
    "레이",
    "yongs",
  ]),
];
