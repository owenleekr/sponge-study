export type Day = "fri" | "sun";

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
  members: OfflineMember[]; // 모더레이터 제외한 일반 조원
};

const m = (name: string): OfflineMember => ({ id: name, name });

export const DAY_LABEL: Record<Day, string> = {
  fri: "금요일 (6/5)",
  sun: "일요일 (6/7)",
};

export const SEED_OFFLINE_TEAMS: OfflineTeam[] = [
  {
    id: "fri-1",
    day: "fri",
    label: "금 1조",
    moderator: "먼지민(석지민)",
    members: [
      m("피노"),
      m("덕수"),
      m("비비안"),
      m("뿌까"),
      m("에이미"),
      m("Galia"),
      m("Nina"),
    ],
  },
  {
    id: "fri-2",
    day: "fri",
    label: "금 2조",
    moderator: "오웬(이성현)",
    members: [
      m("그린"),
      m("제제"),
      m("yongs"),
      m("치코"),
      m("배짱"),
      m("솔"),
      m("다니*"),
    ],
  },
  {
    id: "fri-3",
    day: "fri",
    label: "금 3조",
    moderator: "키노(강은주)",
    members: [
      m("Hook2"),
      m("봄"),
      m("유스"),
      m("포노미터"),
      m("코니"),
      m("리보"),
      m("민트"),
    ],
  },
  {
    id: "fri-4",
    day: "fri",
    label: "금 4조",
    moderator: "개미(임종범)",
    members: [
      m("띵크"),
      m("이안"),
      m("찌니"),
      m("율리아"),
      m("아가타"),
      m("달빛그린"),
    ],
  },
  {
    id: "sun-1",
    day: "sun",
    label: "일 1조",
    moderator: "다다",
    members: [
      m("마라"),
      m("초보자"),
      m("나무"),
      m("애니"),
      m("지니"),
      m("잭"),
      m("J"),
    ],
  },
  {
    id: "sun-2",
    day: "sun",
    label: "일 2조",
    moderator: "흐민",
    members: [
      m("슬로우퀵"),
      m("에이스"),
      m("하늘"),
      m("보미"),
      m("artree"),
      m("히얌"),
      m("이튼"),
    ],
  },
  {
    id: "sun-3",
    day: "sun",
    label: "일 3조",
    moderator: "라라(오현라)",
    members: [
      m("라엘"),
      m("이니"),
      m("석영"),
      m("거북이의꿈(임정선)"),
      m("헤이즐"),
      m("솔라"),
      m("Amy"),
    ],
  },
  {
    id: "sun-4",
    day: "sun",
    label: "일 4조",
    moderator: "에밀리(문주희)†",
    members: [
      m("나로"),
      m("레이"),
      m("아이리스"),
      m("거북이의꿈(나병우)"),
      m("모닥"),
      m("린디"),
      m("신연수"),
    ],
  },
];
