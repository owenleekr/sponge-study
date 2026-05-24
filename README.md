# 🧽 Sponge Club 1기 · 스터디 운영 사이트

조 선택 → 발표 순서 랜덤 → 8분 타이머 → 피드백 담당 자동 배정 → **모든 디바이스에서 실시간 MVP 투표**.

## 기능

- **조 선택**: 6개 조 카드, 조원·테마 미리보기
- **멤버 관리**: 출석 체크(체크박스), 멤버 추가/삭제, 역할(조장/부조장/셀피쉬크루/크루) 지정
- **발표 진행**:
  - 참여자 기반 발표 순서 랜덤 생성 (Fisher–Yates)
  - 8분 카운트다운(시작/일시정지/리셋), 0초가 되면 비프음 3회
  - 피드백 담당자 자동 배정 (derangement — 본인 제외)
  - 현재/다음 발표자 + 전체 순서판
- **MVP 투표 (멀티 디바이스 실시간)**:
  - Vercel KV에 저장 → 조원 모두 각자 폰으로 동시 투표
  - 1인 1표(닉네임 기반), 디바이스에도 투표 기록 캐시
  - 2초 폴링으로 결과 실시간 갱신
  - 투표 마감 / 전체 리셋 (모든 디바이스 동기화)

## 로컬 실행

```bash
cd sponge-study
npm install
npm run dev
# http://localhost:3000 (이미 점유 중이면 PORT=3030 npm run dev)
```

로컬에서는 KV 환경변수가 없으면 **메모리 fallback**으로 동작합니다 (싱글 머신 안에서만 동기화). 다른 디바이스에서 같이 투표하려면 Vercel 배포 후 KV를 연결해야 합니다.

## Vercel 배포 (멀티 디바이스 투표까지)

### 1) Vercel에 import

1. https://vercel.com/new → "Import Git Repository"
2. `owenleekr/sponge-study` 선택 → 프레임워크 자동 인식(Next.js)
3. 환경변수 비워둔 채 그대로 **Deploy** 클릭
4. `https://sponge-study-<해시>.vercel.app` 생성됨 (이 시점엔 투표가 메모리 fallback이라 서버리스 인스턴스 간 동기화 안 됨)

### 2) KV 데이터베이스 연결

1. 프로젝트 페이지 → **Storage** 탭 → **Create Database**
2. **KV** (Vercel KV by Upstash) 선택 → 이름 아무거나 (예: `sponge-votes`) → **Create**
3. "Connect to Project" → 환경(Production/Preview/Development 모두) 체크 → **Connect**
   - `KV_REST_API_URL`, `KV_REST_API_TOKEN` 등이 자동으로 환경변수에 추가됨
4. **Deployments** 탭 → 최신 배포 우측 ⋯ → **Redeploy** → "Use existing Build Cache" 체크 해제

이게 끝. 이제 https://sponge-study-<해시>.vercel.app 에서 조원들이 각자 폰으로 투표 가능.

### 3) (선택) 도메인 연결

프로젝트 Settings → Domains에서 커스텀 도메인 추가.

## API

- `GET  /api/votes/[teamId]` — 현재 스냅샷 `{ votes, voters, closed }`
- `POST /api/votes/[teamId]` — `{ voter, candidate }` 투표. 중복 시 409, 마감 시 423
- `POST /api/votes/[teamId]/close` — 투표 마감
- `POST /api/votes/[teamId]/reset` — 전체 리셋

## 데이터 영속화

| 무엇 | 어디에 | 동기화 |
|---|---|---|
| 조 명단 (추가/삭제) | 브라우저 localStorage | ❌ 디바이스별 |
| 출석 체크 | React state | ❌ 페이지 새로고침 시 리셋 |
| 발표 세션(순서/타이머) | 브라우저 localStorage | ❌ 진행자 디바이스 한정 |
| **MVP 투표** | **Vercel KV** | **✅ 모든 디바이스** |

→ 발표 진행은 조장 노트북 한 곳에서, 투표는 조원 모두 각자 폰에서가 추천 운영 방식.

## 파일 구조

```
sponge-study/
├── app/
│   ├── layout.tsx                    # 글로벌 레이아웃 (다크 네이비 + 골드)
│   ├── page.tsx                      # 홈 · 6개 조 그리드
│   ├── team/[id]/
│   │   ├── page.tsx                  # 조 상세 · 멤버 관리 + 출석
│   │   ├── present/page.tsx          # 발표 진행 · 8분 타이머
│   │   └── vote/page.tsx             # MVP 투표 + 결과 (KV + 2초 폴링)
│   └── api/votes/[teamId]/
│       ├── route.ts                  # GET 스냅샷 / POST 투표
│       ├── close/route.ts            # POST 마감
│       └── reset/route.ts            # POST 리셋
├── lib/
│   ├── teams.ts                      # 6개 조 77명 시드
│   ├── store.ts                      # 조/세션 localStorage 훅
│   └── voteStore.ts                  # 서버 사이드 KV (+ 메모리 폴백)
├── tailwind.config.ts
└── package.json
```
