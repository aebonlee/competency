# 세션 9 개발일지 — 검사 문항 생성 로직 구현 (eval_questions 56쌍 자동 생성)

**날짜**: 2026-02-21
**배포**: https://competency.dreamitbiz.com

---

## 배경 및 문제

쿠폰 적용 후 검사 페이지(`/evaluation/:evalId`)에 진입하면 **문항이 0건**으로 표시되는 치명적 버그.

### 근본 원인

`createEvaluation()` 함수(supabase.js)가 `eval_list` 레코드만 생성하고, **56개 `eval_questions` 레코드를 생성하지 않음**.

레거시 시스템(`addEvalList.jsp`)은 `eval_list` 생성 직후 `extractQ()` Java 메서드를 호출하여 56개 문항 쌍을 랜덤 생성 후 `eval_question` 테이블에 삽입하는 로직이 있었으나, React 전환 시 이 핵심 로직이 누락됨.

### 레거시 `extractQ()` 알고리즘 분석 (addEvalList.jsp 46~196행)

```
8개 역량 영역 × 14개 문항 = 112개 총 문항
  ↓
영역별 14개 중 7개를 기준문항(standard)으로 랜덤 추출
나머지 7개를 비교문항(compared) 풀로 사용
  ↓
56쌍 생성: section i의 기준문항 n과 section j(j≠i)의 비교문항을 짝지음
비교문항 중복은 최대 2회까지 허용
```

---

## 작업 내역 (4건)

### 작업 1: DB 마이그레이션 — questions 테이블에 section, q_no 컬럼 추가

**파일**: `supabase/migrations/20260221210000_add_question_section_qno.sql` (신규)

레거시 MySQL `question` 테이블에는 `section`(int 1-8), `q_no`(int 1-14) 컬럼이 있었으나, Supabase `questions` 테이블에는 `category`(text)만 존재. `generateQuestionPairs()` 알고리즘이 section/q_no 기반으로 동작하므로 컬럼 추가 필수.

```sql
ALTER TABLE questions ADD COLUMN IF NOT EXISTS section int;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS q_no    int;
CREATE UNIQUE INDEX IF NOT EXISTS idx_questions_section_qno
  ON questions (section, q_no)
  WHERE section IS NOT NULL AND q_no IS NOT NULL;
```

### 작업 2: 112개 문항 데이터 추출 및 시드 SQL 작성

**파일**: `supabase/seed/seed_questions.sql` (신규)

레거시 MySQL DB가 로컬에 존재하지 않아, **운영 사이트(competency.or.kr)에서 직접 스크래핑**하여 112개 문항 텍스트를 추출.

**추출 과정**:
1. `loginPro.jsp` 소스 분석 → 로그인 파라미터가 `passwd`(password가 아님) 확인
2. Node.js 스크래핑 스크립트 작성 (http 모듈 기반)
3. `http://competency.or.kr/loginPro.jsp`에 `id=admin&passwd=...`로 POST 로그인
4. `questionList.jsp?section=1~8` 순차 요청, HTML 파싱으로 문항 추출
5. 8개 영역 × 14개 = 112개 문항 전량 추출 성공

**추출 결과**:

| section | 영역명 | 문항 수 |
|---------|--------|---------|
| 1 | 비판적/분석적 사고 | 14 |
| 2 | 창의력 | 14 |
| 3 | 복합적 의사소통 | 14 |
| 4 | 협업능력 | 14 |
| 5 | 디지털 리터러시 | 14 |
| 6 | 감성지능(공감능력) | 14 |
| 7 | 복합문제 해결능력 | 14 |
| 8 | 마음의 습관 | 14 |
| **합계** | | **112** |

### 작업 3: createEvaluation 함수 수정 — 56개 문항 쌍 자동 생성

**파일**: `src/utils/supabase.js` (수정, +100줄)

레거시 Java `extractQ()` 알고리즘을 JavaScript로 완전 이식:

```javascript
function generateQuestionPairs(questionsBySection) {
  // 1. 영역별 14개 중 7개 기준문항(standard) 랜덤 추출
  // 2. 나머지 7개로 비교문항(remain) 풀 구성
  // 3. 비교문항 배정 (중복 최대 2회)
  // 4. 56쌍 (stdq_id, cmpq_id) 생성
  return pairs; // 56개
}
```

`createEvaluation` 함수 변경:

```
기존: eval_list INSERT → return
변경: eval_list INSERT
      → questions 테이블에서 section별 문항 조회
      → generateQuestionPairs() 호출
      → eval_questions에 56개 레코드 bulk INSERT
      → return
```

**RLS 호환성 확인**: `eval_questions` INSERT 정책은 `eval_list.user_id = auth.uid()` 체크 → 본인의 eval에 대해 삽입 가능.

### 작업 4: Evaluation.jsx 기존 답변 복원 조건 수정

**파일**: `src/pages/user/Evaluation.jsx` (수정, 1줄)

```javascript
// Before: 0점 답변이 복원되지 않는 버그
if (q.std_point > 0) existing[q.id] = q.std_point;

// After: 0점도 유효한 답변으로 복원
if (q.std_point !== null && q.std_point >= 0) existing[q.id] = q.std_point;
```

4점 척도(30, 20, 10, 0)에서 0점도 유효한 선택이므로, `> 0` 조건은 0점 답변을 누락시키는 버그.

---

## 변경 파일 요약

| # | 파일 | 작업 | 변경량 |
|---|------|------|--------|
| 1 | `supabase/migrations/20260221210000_add_question_section_qno.sql` | 신규 | section, q_no 컬럼 + 유니크 인덱스 |
| 2 | `supabase/seed/seed_questions.sql` | 신규 | 112개 문항 INSERT문 |
| 3 | `src/utils/supabase.js` | 수정 | +100줄 (generateQuestionPairs + createEvaluation 확장) |
| 4 | `src/pages/user/Evaluation.jsx` | 수정 | 1줄 (답변 복원 조건) |

---

## 사용자 수동 작업 (Supabase SQL Editor)

1. **마이그레이션 실행**: `20260221210000_add_question_section_qno.sql` 내용을 SQL Editor에서 실행
2. **시드 데이터 실행**: `seed_questions.sql` 내용을 SQL Editor에서 실행 (112개 문항 INSERT)

---

## 검증

- `npm run build` 성공 (152 modules, 7.15s)
- JS 586KB / CSS 39KB (gzip: 166KB / 8KB)

---

## 기술적 세부사항

### generateQuestionPairs 알고리즘 상세

```
입력: questionsBySection = { 1: [{id, q_no}, ...], ..., 8: [...] }
      각 영역 14개 문항 필수

처리:
  1. qLookup[section][q_no] = question.id 맵 구축
  2. standard[8][7]: 영역별 7개 기준 q_no 랜덤 추출 (중복 없음)
  3. remainQ[8][7]: 영역별 나머지 7개 q_no (비교문항 풀)
  4. dupCnt[8][7]: 비교문항별 사용 횟수 (최대 2)
  5. compared[8][8]: compared[std_sctn][cmp_sctn] = cmp_sctn의 비교 q_no
  6. 56쌍 구성: section i × (section j, j≠i) = 8×7 = 56

출력: [{stdq_id, cmpq_id}, ...] (56개)
```

### 스키마 매핑

| 레거시 MySQL | Supabase | 비고 |
|-------------|----------|------|
| `question.q_id` | `questions.id` | PK |
| `question.section` (int) | `questions.section` (int) | 신규 추가 |
| `question.q_no` (int) | `questions.q_no` (int) | 신규 추가 |
| `question.q_text` | `questions.q_text` | 기존 |
| - | `questions.category` (text) | 영역명 텍스트 |

### 발견된 주요 사실

- 레거시 로그인 폼의 비밀번호 파라미터명은 `passwd` (password가 아님) — `loginPro.jsp` 22행에서 확인
- 레거시 사이트 SSL 인증서 만료 → HTTP로 접속 필요
- `questionList.jsp`는 Referer 헤더 검증 수행 → 적절한 Referer 설정 필요

---

## 빌드 & 배포

- Vite 빌드: 152 modules, 7.15s
- GitHub Pages 배포: 커밋 & 푸시 후 GitHub Actions 자동 실행
