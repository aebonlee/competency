# 세션 7 개발일지 — NCS 페이지 클릭 인터랙션 원본 완전 재현

**날짜**: 2026-02-21
**커밋**: `1b9f7d1`
**배포**: https://competency.dreamitbiz.com

---

## 작업 요약

`/competency/ncs` 페이지에서 역량 동그라미 클릭 시 비선택 항목의 원 테두리가 진회색으로 변하는 문제를 수정하였다. 원본 JSP(`competency-NCS.jsp`)를 재분석하여 클릭 핸들러 로직을 완전히 재구현하였다.

---

## 문제 분석

### 증상
동그라미 버튼 클릭 시 선택된 항목은 컬러가 변경되지만, 선택되지 않은 나머지 항목의 동그라미 테두리에 진회색이 표시됨.

### 원인
`st31-st39` CSS 클래스를 역량 텍스트 라벨로 잘못 사용하고 있었음. 실제로 `st31-st39`는 SVG 내에서 원형 테두리/배경 요소에도 적용되는 클래스로, `fill: #434343`을 설정하면 비선택 원의 테두리까지 진회색으로 변경됨.

### 원본 JSP 방식
원본 JSP는 `.st50` 클래스(역량명 텍스트 전용)와 `.t1-.t8` 컨테이너(각 역량별 텍스트 그룹)를 사용하여 텍스트만 정확히 제어함.

---

## 변경 내역

### 1. 텍스트 라벨 셀렉터 교체

```jsx
// Before (잘못된 방식): st31-st39 클래스 직접 조작 → 원 테두리까지 변경됨
ALL_LABELS.forEach(cls => {
  container.querySelectorAll('.' + cls).forEach(el => {
    el.style.fill = '#434343';  // 원 테두리까지 진회색!
  });
});

// After (원본 JSP 방식): .st50 텍스트 클래스 + .t1-.t8 컨테이너
container.querySelectorAll('.st50').forEach(el => {
  el.style.fill = '#434343';  // 텍스트만 변경
});
const textGroup = container.querySelector('.' + mapping.textGroup);
if (textGroup) {
  textGroup.querySelectorAll('.st50').forEach(el => {
    el.style.fill = '#FFFFFF';  // 선택된 역량 텍스트만 흰색
  });
}
```

### 2. CIRCLE_NCS_MAP 구조 변경

```jsx
// Before
{ color: '#00AEEF', label: 'st31', inner: 'st41', ... }

// After
{ color: '#00AEEF', textGroup: 't1', inner: 'st41', ..., wedgeFill: 'url(#SVGID_19_)' }
```

- `label` → `textGroup`: `.t1-.t8` 컨테이너 클래스로 변경
- `wedgeFill` 추가: 원본 JSP에서 사용하는 NCS 쐐기 색상 (그래디언트 URL 또는 단색)

### 3. NCS 쐐기 색상 — 그래디언트/단색 구분

원본 JSP는 역량에 따라 NCS 쐐기에 SVG 그래디언트 URL 또는 단색을 적용함:

| 역량 | 쐐기 색상 방식 |
|------|---------------|
| Circle_75_ (마음습관) | `url(#SVGID_19_)` 그래디언트 |
| Circle_74_ (문제해결) | `#38B549` 단색 |
| Circle_73_ (감성지능) | `url(#SVGID_17_)` 그래디언트 |
| Circle_72_ (디지털) | `url(#SVGID_11_)` 그래디언트 |
| Circle_63_ (협업능력) | `#EC008C` 단색 |
| Circle_60_ (의사소통) | `url(#SVGID_12_)` 그래디언트 |
| Circle_58_ (창의력) | `url(#SVGID_16_)` 그래디언트 |
| Circle_53_ (비판적사고) | `#ED1B23` 단색 |

### 4. 리셋 — 원본 그래디언트 복원

```jsx
// Before: 인라인 스타일 제거 (그래디언트 복원 불확실)
el.style.fill = '';

// After: 각 쐐기별 원본 그래디언트 URL 명시적 복원
const NCS_WEDGE_GRADIENTS = {
  'st20': 'url(#SVGID_11_)', 'st21': 'url(#SVGID_12_)', ...
};
Object.entries(NCS_WEDGE_GRADIENTS).forEach(([cls, gradient]) => {
  container.querySelectorAll('.' + cls).forEach(el => {
    el.style.fill = gradient;
  });
});
```

### 5. 중앙 원 리셋 클릭 추가

원본 JSP에서 `Center_x5F_Circle_11_`과 `#reset` 텍스트 모두 리셋 기능이 바인딩되어 있었으나, React 코드에는 `#reset`만 바인딩되어 있었음.

```jsx
const centerCircle = container.querySelector('[id*="Center_x5F_Circle"]');
if (centerCircle) {
  centerCircle.style.cursor = 'pointer';
  centerCircle.addEventListener('click', resetColors);
}
```

### 6. ALL_LABELS 상수 제거

더 이상 사용하지 않는 `ALL_LABELS` 상수를 제거함.

---

## 원본 JSP ↔ React 클릭 동작 비교 (수정 후)

| 단계 | 원본 JSP | React (수정 후) |
|------|---------|----------------|
| 텍스트 리셋 | `$(".st50").css({fill:"#434343"})` | `querySelectorAll('.st50')` fill=#434343 |
| 선택 텍스트 | `$('.t1').find(".st50").css({fill:"#fff"})` | `querySelector('.t1').querySelectorAll('.st50')` fill=#FFF |
| 내부 원 리셋 | `$(".st41,...st48").css({fill:"#fff"})` | ALL_INNER_CIRCLES → fill=#FFF |
| 선택 내부 원 | `$(".st41").css({fill:"#00AEEF"})` | mapping.inner → mapping.color |
| 쐐기 리셋 | `$('.st20,...st29').css({fill:"#fff"})` | ALL_NCS_WEDGES → fill=#FFF |
| 선택 쐐기 | `$('.st27,...').css({fill:'url(#SVGID_19_)'})` | mapping.wedges → mapping.wedgeFill |
| NCS 텍스트 리셋 | `$('.textfill20,...').css({fill:"#444"})` | ALL_TEXTFILLS → fill=#444 |
| 선택 NCS 텍스트 | `$('.textfill27,...').css({fill:"#fff"})` | mapping.fills → fill=#FFF |

---

## 변경 파일 요약

| 파일 | 변경 내용 | 줄수 |
|------|-----------|------|
| `src/pages/public/CompetencyNCS.jsx` | 클릭/리셋 로직 전면 재구현 | +47 -36 |

---

## 빌드 & 배포

- Vite 빌드: 152 modules, 15.29s
- JS 584KB / CSS 38KB (gzip: 166KB / 8KB)
- GitHub Actions 배포: 성공 (Run #24)
