export type Day = "part1" | "part2";

export type OfflineMember = {
  id: string;
  name: string;
  isModerator?: boolean;
};

export type OfflineTeam = {
  id: string;
  day: Day;
  label: string;
  moderator: string;
  members: OfflineMember[]; // 모더레이터 제외한 일반 조원 9명
};

const m = (name: string): OfflineMember => ({ id: name, name });

export const DAY_LABEL: Record<Day, string> = {
  part1: "파트 1 · 19:30~20:50",
  part2: "파트 2 · 21:00~22:20",
};

export const MEETING_INFO = {
  date: "금요일 (6/5)",
  time: "19:30~22:30",
  venue: "강남 트레바리",
  assigned: "4조 × 10명 = 40명",
  roamingPhotographers: ["슬로우퀵", "솔라"],
};

export type Topic = {
  title: string;
  subtitle: string;
  totalMin: number;
  perPersonSec: number;
};

export const PART_HEADLINE: Record<Day, { title: string; tag: string }> = {
  part1: { title: "AI와 커리어 · 삶", tag: "파트 1" },
  part2: { title: "스폰지클럽의 가치와 앞으로 · 이기적공유 / 함께", tag: "파트 2" },
};

export const PART_TOPICS: Record<Day, Topic[]> = {
  part1: [
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
  ],
  part2: [
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
  ],
};

export const SEED_OFFLINE_TEAMS: OfflineTeam[] = [
  // ─────────── 파트 1 · 19:30~20:50 ───────────
  {
    id: "p1-1",
    day: "part1",
    label: "파트1 · 1조",
    moderator: "먼지민(석지민)",
    members: [
      m("Nina"),
      m("다니"),
      m("포노미터"),
      m("이안"),
      m("찌니"),
      m("아가타"),
      m("이튿"),
      m("로이캉"),
      m("마라"),
    ],
  },
  {
    id: "p1-2",
    day: "part1",
    label: "파트1 · 2조",
    moderator: "오웬(이성현)",
    members: [
      m("비비안"),
      m("뿌까"),
      m("에이미"),
      m("그린"),
      m("Hook2"),
      m("달빛그린"),
      m("잭"),
      m("거북이의꿈(나병우)"),
      m("라엘"),
    ],
  },
  {
    id: "p1-3",
    day: "part1",
    label: "파트1 · 3조",
    moderator: "키노(강은주)",
    members: [
      m("yongs"),
      m("치코"),
      m("봄"),
      m("유스"),
      m("코니"),
      m("민트"),
      m("띵크"),
      m("애니"),
      m("J"),
    ],
  },
  {
    id: "p1-4",
    day: "part1",
    label: "파트1 · 4조",
    moderator: "개미(임종범)",
    members: [
      m("피노"),
      m("덕수"),
      m("Galia"),
      m("제제"),
      m("배짱"),
      m("솔"),
      m("리보"),
      m("율리아"),
      m("Amy"),
    ],
  },
  // ─────────── 파트 2 · 21:00~22:20 ───────────
  {
    id: "p2-1",
    day: "part2",
    label: "파트2 · 1조",
    moderator: "먼지민(석지민)",
    members: [
      m("덕수"),
      m("비비안"),
      m("Galia"),
      m("치코"),
      m("솔"),
      m("봄"),
      m("달빛그린"),
      m("애니"),
      m("라엘"),
    ],
  },
  {
    id: "p2-2",
    day: "part2",
    label: "파트2 · 2조",
    moderator: "오웬(이성현)",
    members: [
      m("제제"),
      m("배짱"),
      m("유스"),
      m("포노미터"),
      m("코니"),
      m("찌니"),
      m("율리아"),
      m("아가타"),
      m("J"),
    ],
  },
  {
    id: "p2-3",
    day: "part2",
    label: "파트2 · 3조",
    moderator: "키노(강은주)",
    members: [
      m("피노"),
      m("뿌까"),
      m("에이미"),
      m("Nina"),
      m("다니"),
      m("리보"),
      m("이튿"),
      m("거북이의꿈(나병우)"),
      m("Amy"),
    ],
  },
  {
    id: "p2-4",
    day: "part2",
    label: "파트2 · 4조",
    moderator: "개미(임종범)",
    members: [
      m("그린"),
      m("yongs"),
      m("Hook2"),
      m("민트"),
      m("띵크"),
      m("이안"),
      m("잭"),
      m("로이캉"),
      m("마라"),
    ],
  },
];
