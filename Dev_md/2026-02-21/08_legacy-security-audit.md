# 레거시 JSP/Java 보안 감사 — 2026-02-21

**대상**: D:/competency/tomcat/webapps/ROOT/
**기술 스택**: Tomcat 8.0.50, JSP, Java Bean, MySQL 5.x
**파일 규모**: Java 172개, JSP 150+개, CSS 30+개

---

## 심각도 요약

| 심각도 | 건수 | 카테고리 |
|--------|------|----------|
| CRITICAL | 6 | SQL 인젝션, 자격증명 노출, 평문 비밀번호, XSS |
| HIGH | 8 | HTTPS 미설정, CSRF 없음, 세션 고정, Tomcat EOL |
| MEDIUM | 6 | 커넥션 풀링 없음, 빈 catch, 리소스 누수 |
| LOW | 8 | 코드 중복, 폐기 드라이버, TODO 미완성 |

---

## CRITICAL-1: SQL 인젝션

사용자 입력을 PreparedStatement에 문자열 연결로 삽입하는 패턴이 30+개 메서드에 존재합니다.

**대표 사례:**
```java
// Register/LogonDBBean.java:820
pstmt = conn.prepareStatement(
  "select * from user where name like '%" + name + "%' and state = 0");
// 파라미터 바인딩이 주석 처리됨: // pstmt.setString(1, name);
```

**영향 범위:** LogonDBBean, InvDBBean, FavoriteDBBean + 4개 기관 복사본 (khu, kdi, gunpoe, mjc)

---

## CRITICAL-2: 하드코딩된 DB 자격증명

80개 Java 파일, 690회 출현:
```java
String dbURL = "jdbc:mysql://localhost:3306/competency?useSSL=false...";
Connection conn = DriverManager.getConnection(dbURL, "competency", "competency@");
```

---

## CRITICAL-3: 하드코딩된 Gmail SMTP 자격증명

```java
// sendMailPro.jsp:73-76
return new PasswordAuthentication("kocomedu","Kocom2020!");
```

> **즉시 조치 필요**: 이 비밀번호가 소스코드에 노출되어 있으므로 즉시 변경해야 합니다.

---

## CRITICAL-4: 평문 비밀번호 저장

SHA256Util.java가 존재하나 **미사용**. 모든 비밀번호가 평문 저장 및 비교:
```java
if (dbpasswd.equals(password))  // 60+개 위치
```

---

## CRITICAL-5: XSS 취약점 (278건)

76개 JSP 파일에서 이스케이프 없는 출력:
```jsp
<%=board.getContent() %>                     <!-- 저장형 XSS -->
<%=request.getParameter("eval_id")%>         <!-- 반사형 XSS -->
```

비밀번호까지 HTML에 노출:
```html
<!-- modifyForm.jsp:163 -->
<input type="password" value="<%=c.getPasswd()%>">
```

---

## CRITICAL-6: FullPage.js 라이센스 키 노출

```javascript
// evaluation.jsp:371
licenseKey : 'C9E6CE5C-7B4B41E5-9F1FA690-5EBD05E6',
```

---

## HIGH 이슈 목록

| # | 이슈 | 위치 |
|---|------|------|
| 1 | HTTPS 미설정 (HTTP 8115만 사용) | `server.xml` |
| 2 | CSRF 보호 없음 (필터/토큰 없음) | 전체 애플리케이션 |
| 3 | 세션 고정 (로그인 후 세션 미갱신) | `loginPro.jsp:28` |
| 4 | Referer 기반 접근제어 (쉽게 우회) | `loginPro.jsp:7`, `signupPro.jsp:14` |
| 5 | 에러 페이지 미설정 (스택 트레이스 노출) | `web.xml` |
| 6 | 서버 경로 노출 | `findabofolder.jsp` |
| 7 | 디버그 페이지 잔존 | `extract.jsp` |
| 8 | Tomcat 8.0.50 EOL (2018년 지원 종료) | 전체 |

---

## MEDIUM 이슈 목록

| # | 이슈 | 규모 |
|---|------|------|
| 1 | 커넥션 풀링 없음 (raw DriverManager) | 695회 호출 |
| 2 | 빈 catch 블록 | 500+건 |
| 3 | PreparedStatement 재할당 시 미종료 | 다수 |
| 4 | ConnectionContext 싱글톤 미사용 | 1개 클래스 |
| 5 | DB SSL 비활성화 (useSSL=false) | 전체 |
| 6 | SHA256Util에 java.util.Random 사용 | 1개 파일 |

---

## 레거시 시스템 권장 조치

React+Supabase로의 전환이 진행 중이므로, **레거시 시스템의 추가 개발보다는 전환 완료에 집중**하는 것을 권장합니다.

단, 현재 운영 중이라면:
1. Gmail 비밀번호 즉시 변경 (`Kocom2020!`)
2. `findabofolder.jsp`, `extract.jsp` 접근 차단/삭제
3. 에러 페이지 설정 (스택 트레이스 노출 방지)
4. 최소한의 XSS 방어 (JSTL `<c:out>` 태그 적용)
