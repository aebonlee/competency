# 세션 11 개발일지 — 결과 페이지 레거시 디자인 완전 재현

**날짜**: 2026-02-22
**배포**: https://competency.dreamitbiz.com

---

## 작업 배경

결과 페이지(`/result/:evalId`)가 기존 competency.or.kr의 디자인과 다른 문제 보고.
레거시 `result.jsp` (672줄) + `prevResult.css` (912줄) + `circle.css` (873줄) + `ability.css` (172줄) 분석 후 React로 완전 재현.

---

## 레거시 vs React 변경 전후 비교

### 변경 전 (React 구현)
- 단순 PolarArea 차트 1개
- Top 3 카드 (숫자 아이콘, 점수 표시)
- 점수 테이블 (프로그레스 바)
- 인포그래픽 요약 (평균/최고/최저/총점)

### 변경 후 (레거시 재현)
- **Speech Bubble 안내문** — 원본 텍스트 완전 재현
- **성별 프로필 카드** — man2.png/woman3.png + 역량별 색상 그라디언트 오버레이
- **My Top 3 Competencies** — 100px 원형 SVG 아이콘 (main-row)
- **My Other 5 Competencies** — 80px (first-row 3개) + 60px (second-row 2개) 계층적 배치
- **8개 역량 SVG 아이콘** — idea, plan, agreement, team, wheel, brain, brain2, business-and-finance
- **역량별 컬러 원형** — border + ::after pseudo-element 배경색 (circle.css 재현)
- **3개 차트 탭** — 8대핵심역량(Polar), 2015교육과정역량(더블도넛), NCS직업기초능력(더블도넛)
- **NCS 계산 알고리즘** — legacy result.jsp 299~320행 완전 이식 (10개 NCS 역량 점수)
- **범례 인라인 표시** — 2015/NCS 차트별 ■■■ 형식 색상 범례
- **클릭 시 모달** — 역량 아이콘 클릭 → 상세 설명 모달 팝업
- **bounce 애니메이션** — 아이콘 hover 시 통통 튀는 효과

---

## 변경 파일 상세

### 1. `src/pages/user/Result.jsx` — 전면 재작성

**Before**: 139줄 (간소한 차트 + 테이블 구현)
**After**: ~320줄 (레거시 디자인 완전 재현)

주요 추가 로직:
- `calcNCS(point)` — NCS 10개 직업기초능력 점수 계산 (result.jsp 동일)
- `getRanked(scores)` — 점수 기준 내림차순 정렬 (legacy getMost 동일)
- `buildGradient(ranked, scores)` — 역량별 비율 기반 CSS gradient 생성 (legacy printGradient 동일)
- 3개 차트 탭 UI (useState로 activeChart 관리)
- 8개 역량 카드 렌더링 (main-row 3 + first-row 3 + second-row 2)
- useAuth()로 사용자 성별 가져와 프로필 이미지 결정

### 2. `src/styles/result.css` — 전면 재작성

**Before**: 276줄 (간소한 스타일)
**After**: ~310줄 (레거시 CSS 3개 파일 통합)

재현된 레거시 CSS 요소:
- `.speech-bubble` — prevResult.css 말풍선 스타일
- `.result-card-media` — 성별 이미지 + 그라디언트 오버레이 (500px / 모바일 350px)
- `.trd-ability` — 역량 섹션 레이아웃
- `.comp-circle` — circle.css 원형 아이콘 (3단계 크기: 100/80/60px)
- `.comp-circle::after` — 색상 배경 pseudo-element
- 역량별 CSS 클래스 8개 — critical, creative, communiccation, collaboration, digital, emotional, solving, mind
- `.chart-tabs` / `.chart-tab-btn` — 차트 탭 버튼 (prevResult.css .cBtns)
- `.chart-title h1` — 그라디언트 배경 제목
- `@keyframes bounce` — prevResult.css 바운스 애니메이션
- 반응형 (768px, 500px 브레이크포인트)

### 3. `src/components/CompetencyChart.jsx` — PolarArea 차트 수정 + DoughnutChart 확장

**PolarArea 차트 수정** (8대핵심역량 그래프):

| 항목 | Before (문제) | After (수정) |
|------|---------------|--------------|
| `max` | `100` (점수가 ~210까지 가능 → 잘림) | 제거 (자동 스케일) |
| `beginAtZero` | 제거됨 → 최솟값 기준 스케일 → 모든 쐐기 가득 참 | `true` 복원 (0 기준 스케일) |
| `backgroundColor` | `COMPETENCY_COLORS + '99'` (반투명) | 솔리드 색상 |
| `borderColor/Width` | 있음 | 제거 (레거시 동일) |
| `ticks` | 표시됨 | `display: false` (레거시 동일) |
| `grid` | 표시됨 | `display: false` (레거시 동일) |

**핵심 이슈**: Chart.js 2.x (레거시)에서는 PolarArea의 `beginAtZero`가 기본 `true`이나, Chart.js 4.x (React)에서는 기본 `false`. 이 옵션 없이는 스케일이 최솟값 근처에서 시작되어 모든 쐐기가 캔버스를 가득 채움.

**DoughnutChart 확장**:
- `outerColors` / `innerColors` props 추가 (커스텀 색상 지원)
- dataset `labels` 배열 추가 (도넛 내/외부 개별 라벨)
- dataset `weight` 추가 (내/외부 비율 조절)
- tooltip callback — dataset별 개별 라벨 표시 (legacy 방식 재현)
- 기존 `COMPETENCY_COLORS` 고정 색상 → 옵셔널 커스텀 색상 fallback

### 4. 이미지 복사

| 파일 | 출처 | 용도 |
|------|------|------|
| `public/images/man2.png` | `tomcat/webapps/ROOT/img/man2.png` | 남성 프로필 이미지 |
| `public/images/woman3.png` | `tomcat/webapps/ROOT/img/woman3.png` | 여성 프로필 이미지 |

---

## NCS 점수 계산 알고리즘 (legacy result.jsp 동일)

```javascript
ncs[0] = (point[2] + point[3] + point[4] + point[5] + point[6]) / 5  // 의사소통능력
ncs[1] = (point[0] + point[4] + point[6] + point[7]) / 4             // 수리능력
ncs[2] = (point[0]+...+point[7]) / 8                                  // 문제해결능력
ncs[3] = point[7]                                                      // 자기개발능력
ncs[4] = (point[0] + point[1] + point[4] + point[7]) / 4             // 자원관리능력
ncs[5] = (point[2] + point[3] + point[5]) / 3                        // 대인관계능력
ncs[6] = (point[2] + point[4] + point[6]) / 3                        // 정보능력
ncs[7] = (point[0] + point[1]) / 2                                    // 기술능력
ncs[8] = (point[0] + point[2] + point[3] + point[5] + point[6]) / 3  // 조직이해능력
ncs[9] = (point[5] + point[7]) / 2                                    // 직업윤리
```

---

## 변경 파일 요약

| # | 파일 | 변경 내용 |
|---|------|-----------|
| 1 | `src/pages/user/Result.jsx` | 전면 재작성 — 레거시 디자인 구조 재현 |
| 2 | `src/styles/result.css` | 전면 재작성 — prevResult + circle + ability CSS 통합 |
| 3 | `src/components/CompetencyChart.jsx` | DoughnutChart 커스텀 색상/라벨/tooltip 지원 |
| 4 | `public/images/man2.png` | 신규: 남성 프로필 이미지 |
| 5 | `public/images/woman3.png` | 신규: 여성 프로필 이미지 |

---

## 커밋 이력

| # | 해시 | 메시지 |
|---|------|--------|
| 1 | `fd24d09` | feat: 결과 페이지 레거시 디자인 완전 재현 (result.jsp → React) |
| 2 | `39617fe` | fix: PolarArea 차트 레거시 원본 일치 수정 |
| 3 | `3ef20d9` | fix: PolarArea 차트 beginAtZero 복원 — 쐐기가 전체 채움 현상 수정 |

---

## 빌드 & 배포

- Vite 빌드: 151 modules, 10.28s
- JS 598KB / CSS 41KB (gzip: 170KB / 8KB)
- GitHub Pages: 커밋 & 푸시 → GitHub Actions 자동 배포
