-- ============================================================================
-- MyCoreCompetency - 문항 데이터 시드 (112개 문항)
-- ============================================================================
-- competency.or.kr 레거시 시스템에서 추출한 문항 데이터를 Supabase questions 테이블에 삽입합니다.
--
-- 사전 조건:
--   1. 20260221210000_add_question_section_qno.sql 마이그레이션이 적용된 상태
--   2. questions 테이블에 section, q_no 컬럼이 존재해야 함
--
-- 구조: 8개 역량 영역 x 14개 문항 = 112개 문항
--   section 1: 비판적/분석적 사고
--   section 2: 창의력
--   section 3: 복합적 의사소통
--   section 4: 협업능력
--   section 5: 디지털 리터러시
--   section 6: 감성지능(공감능력)
--   section 7: 복합문제 해결능력
--   section 8: 마음의 습관
-- ============================================================================

-- 기존 데이터 정리 (필요 시 주석 해제)
-- DELETE FROM questions WHERE section IS NOT NULL;

-- ============================================================================
-- Section 1: 비판적/분석적 사고 (14문항)
-- ============================================================================
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 주어진 문제를 편견이나 선입견없이 분석한다', '비판적/분석적 사고', 1, 1);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 신뢰할 수 있는 정보와 불확실한 정보를 잘 구별해 낸다', '비판적/분석적 사고', 1, 2);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 비판적인 관점으로 문제를 분석한다', '비판적/분석적 사고', 1, 3);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 의미있는 질문을 도출하는데 익숙하다', '비판적/분석적 사고', 1, 4);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 여러 정보를 하나로 합치거나 새로운 방식으로 활용하는 것을 잘 한다', '비판적/분석적 사고', 1, 5);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 합리적이고 논리적인 분석과정을 즐긴다', '비판적/분석적 사고', 1, 6);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 어떤 주장을 하기 전에 내 주장이 맞는지 여러방면으로 확인한다', '비판적/분석적 사고', 1, 7);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 복잡한 문제를 단순화해서 풀어가는데 익숙하다', '비판적/분석적 사고', 1, 8);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 문제 해결에 꼭 필요한 핵심내용을 잘 파악한다', '비판적/분석적 사고', 1, 9);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 주어진 정보를 믿거나 받아들이기 전에 비판적인 관점으로 분석한다', '비판적/분석적 사고', 1, 10);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 문제 해결에 꼭 필요한 핵심내용을 잘 파악한다', '비판적/분석적 사고', 1, 11);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 여러 정보속에서 양질의 정보를 찾아내는 것을 잘 한다', '비판적/분석적 사고', 1, 12);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 문제 해결에 꼭 필요한 핵심내용을 잘 파악한다', '비판적/분석적 사고', 1, 13);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('비판적 사고는 문제해결과정에서 중요한 역할을 수행한다', '비판적/분석적 사고', 1, 14);

-- ============================================================================
-- Section 2: 창의력 (14문항)
-- ============================================================================
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 기존의 시각이나 관점과는 달리 새로운 시각과 관점으로 사물과 현상을 바라본다', '창의력', 2, 1);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 문제를 해결하는데 기발한 방법을 제안한다', '창의력', 2, 2);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 새로운 지식이나 아이디어를 착안하는 걸 좋아한다', '창의력', 2, 3);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 문제 해결과정에서 다양한 대체 방법을 모색하는 것을 잘한다', '창의력', 2, 4);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 정해진 룰이나 규칙으로는 해결할 수 없는 문제를 푸는 것을 즐긴다', '창의력', 2, 5);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 새로운 아이디어나 역할, 또는 전략을 모색하는 것을 좋아한다', '창의력', 2, 6);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 다른 사람들이 전혀 생각하지 못하는 기발한 아이디어를 자주 떠올린다', '창의력', 2, 7);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 이미 해결된 문제에 대해서도 보다 새로운 시각으로 효과적이거나 효율적인 방법을 모색하는 것을 좋아한다', '창의력', 2, 8);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 정해진 답이 없는 문제를 풀어가는 과정을 좋아한다', '창의력', 2, 9);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('지구상에 현재 존재하지 않는 새로운 동물을 상상을 통해 만드는 프로젝트는 내게 흥미로울 것 같다', '창의력', 2, 10);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 고정관념을 벗어나야만 풀리는 문제를 해결하는 과정을 좋아한다', '창의력', 2, 11);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 아이디어가 기발하다는 말을 자주 듣는 편이다', '창의력', 2, 12);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 글이나 그림, 영상이나 음악 등 다양한 방식 중 하나로 내 아이디어를 표현하는 것을 좋아한다', '창의력', 2, 13);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 주변에서 진행되는 일들을 보면서 어떻게 하면 보다 효과적이고 효율적으로 할 수 있을 지 자주 생각한다', '창의력', 2, 14);

-- ============================================================================
-- Section 3: 복합적 의사소통 (14문항)
-- ============================================================================
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 말하고자 하는 내용을 다양한 청중이나 독자들에게 명확하게 전달할 수 있다', '복합적 의사소통', 3, 1);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 다양한 청중이나 독자가 의미하는 바를 명확하게 이해할 수 있다', '복합적 의사소통', 3, 2);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 상대방의 의견이나 이야기를 집중해서 경청한다', '복합적 의사소통', 3, 3);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 효과적으로 조리있게 말을 잘 한다', '복합적 의사소통', 3, 4);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 두가지 이상의 언어로 의사소통이 가능하다', '복합적 의사소통', 3, 5);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 주변 사람들로부터 언어감각이 뛰어나다는 얘길 자주 듣는다', '복합적 의사소통', 3, 6);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 읽는 사람들의 다양성을 고려해서 간결하면서도 명확하게 글을 쓴다', '복합적 의사소통', 3, 7);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('내가 이야기하면 사람들이 몰입해서 흥미롭게 듣는다', '복합적 의사소통', 3, 8);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 다른 언어권의 사람들과 이야기를 나누는 것에 익숙하다', '복합적 의사소통', 3, 9);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 다른 언어나 문화권에 대해 개방적인 사고를 갖고 있다', '복합적 의사소통', 3, 10);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 내 입장이나 생각만 일방적으로 주장하기 보다는 상대방에 대한 열린 마음과 이해를 바탕으로 소통하는 편이다', '복합적 의사소통', 3, 11);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 여러가지 내용을 동시에 전달해야 하는 경우에도 체계적이고 효과적으로 청중이나 독자의 이해를 향상시킬 수 있다', '복합적 의사소통', 3, 12);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 남의 이야기를 듣는 동안 내용 이해를 돕기 위한 적절한 질문을 던져 중간중간 내용정리도 하고 보다 쉽게 이해할 수 있게 돕는 것을 잘한다', '복합적 의사소통', 3, 13);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 짧고 간결하게 말하면서도 중요한 내용을 명확하게 전달하는 것을 잘한다', '복합적 의사소통', 3, 14);

-- ============================================================================
-- Section 4: 협업능력 (14문항)
-- ============================================================================
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 같은 목표를 이루기 위해 다른 사람들과 협력하는데 익숙하다', '협업능력', 4, 1);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 맡은 일을 위해 협력하고 그룹을 관리하는 능력이 있다', '협업능력', 4, 2);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 특정 업무에 가장 잘 맞는 적임자를 정해서 책임을 위임한다', '협업능력', 4, 3);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 함께 일하는 사람들과 신뢰를 쌓고 관계를 형성하는 것을 좋아한다', '협업능력', 4, 4);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('그룹 내에서 갈등 발생 시 나는 갈등을 중재하는 역할을 수행한다', '협업능력', 4, 5);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 그룹 토론을 촉진하고 의견 일치를 이끌어내는 것을 잘한다', '협업능력', 4, 6);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 상대방이 모르는 부분에 대해 설명하고 이해시키는 것을 좋아하다', '협업능력', 4, 7);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 팀원들이 주어진 일만 수동적으로 하는 것 보다 책임감을 갖고 주도적으로 일할 수 있도록 분위기를 형성한다', '협업능력', 4, 8);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('함께 수고한 팀 구성원들과 성과에 대한 공로를 다같이 나눈다', '협업능력', 4, 9);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 일을 잘 수행하기 위해 남의 협력을 얻거나 도움을 구하는 것을 잘한다', '협업능력', 4, 10);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 나와 전혀 다른 분야의 사람들하고도 의견을 조율하고 협력하는 것을 잘한다', '협업능력', 4, 11);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 지시나 명령, 권위가 아니라 사람들에게 영향을 미쳐 스스로 협업하도록 만드는 편이다', '협업능력', 4, 12);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 신뢰를 쌓고 갈등을 해소하며 다른 사람들을 위해 힘을 보태는 능력이 있다', '협업능력', 4, 13);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 나 자신만을 생각하기 보다는 팀을 먼저 생각하는 공동체 의식이 높은 편이다', '협업능력', 4, 14);

-- ============================================================================
-- Section 5: 디지털 리터러시 (14문항)
-- ============================================================================
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 디지털 테크놀로지를 잘 이해하고 활용한다', '디지털 리터러시', 5, 1);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 새로운 콘텐츠를 만들어서 온라인 상에 올리는 것에 익숙하다', '디지털 리터러시', 5, 2);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 디지털 환경 내에서 지식이나 정보를 새롭게 만들어낼 수 있다', '디지털 리터러시', 5, 3);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 다양한 형식으로 나의 아이디어를 효과적으로 전달하기 위해 멀티미디어를 활용한다', '디지털 리터러시', 5, 4);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('특정 정보가 필요한 경우 나는 온라인 상에서 양질의 정보를 찾아낼 수 있다', '디지털 리터러시', 5, 5);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 스마트폰에서 문서를 작성하는데 익숙하다', '디지털 리터러시', 5, 6);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 정보를 검색하고 평가하고 창출하고 전달하기 위해 정보통신기술을 활용한다', '디지털 리터러시', 5, 7);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 디지털화된 정보를 읽고 쓰는데 익숙하다', '디지털 리터러시', 5, 8);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 사람들과 소통하기 위해 디지털 테크놀로지를 활용한다', '디지털 리터러시', 5, 9);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 디지털 콘텐츠에 대한 이해와 활용능력이 뛰어나다', '디지털 리터러시', 5, 10);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 디지털화된 정보를 만들고 온라인을 통해 사람들과 공유하는 것에 익숙하다', '디지털 리터러시', 5, 11);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 컴퓨터나 스마트 기기와 같은 디지털 매체를 통해 뉴스나 정보를 얻는데 익숙하다', '디지털 리터러시', 5, 12);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 온라인 상의 수많은 정보 중 거짓 정보를 가려낼 수 있다', '디지털 리터러시', 5, 13);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 디지털 기술과 미디어에 대해 비판적 시각을 갖고 이해하고 활용하는 편이다', '디지털 리터러시', 5, 14);

-- ============================================================================
-- Section 6: 감성지능(공감능력) (14문항)
-- ============================================================================
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 다른 사람의 전통이나 가치에 대해 열린 사고를 갖고 있다', '감성지능(공감능력)', 6, 1);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 상호 존중과 열린 대화를 좋아한다', '감성지능(공감능력)', 6, 2);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 상대방이 왜 그런 행동을 했는지 이해하고자 한다', '감성지능(공감능력)', 6, 3);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 결정을 내릴때 다른 사람의 감정을 고려한다', '감성지능(공감능력)', 6, 4);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 다른 사람의 감정이나 행동을 이해하려고 노력한다', '감성지능(공감능력)', 6, 5);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 상대방의 감정이나 행동에 따라 내 감정이나 행동을 조절한다', '감성지능(공감능력)', 6, 6);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 다른 사람의 감정을 공감하고 그들의 말을 귀를 기울여 듣는다', '감성지능(공감능력)', 6, 7);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 타인의 아픔을 내 아픔처럼 느낀다', '감성지능(공감능력)', 6, 8);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 공감하고 이해하는 관점을 지속할 수 있다', '감성지능(공감능력)', 6, 9);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 보다 큰 공동체의 이익과 행복을 위해 책임감 있게 행동하는 편이다', '감성지능(공감능력)', 6, 10);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 누군가가 부당한 상황에 마주쳤을때 도덕적 용기를 표출할 수 있다', '감성지능(공감능력)', 6, 11);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 다른 사람의 감정과 입장을 이해하고 공감대를 형성할 수 있는 능력이 있다', '감성지능(공감능력)', 6, 12);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 내가 하는 말이 상대방에게 미칠 영향을 생각하고 말을 할때 주의를 기울인다', '감성지능(공감능력)', 6, 13);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 말이나 행동을 하기 전에 다른 사람의 입장에 대해 먼저 생각하는 편이다', '감성지능(공감능력)', 6, 14);

-- ============================================================================
-- Section 7: 복합문제 해결능력 (14문항)
-- ============================================================================
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 복합적인 문제를 보면 그 문제의 핵심을 먼저 파악하고자 한다', '복합문제 해결능력', 7, 1);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 시행착오를 겪으면서도 문제에 대한 해결책을 고안하는 걸 좋아한다', '복합문제 해결능력', 7, 2);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 한 분야에 국한되지 않고 여러 분야에 걸쳐 지식과 시각을 발전시키는 것을 좋아한다', '복합문제 해결능력', 7, 3);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 지속적으로 추론해 나가는 것을 즐긴다', '복합문제 해결능력', 7, 4);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('혼자 문제를 풀기 어려운 경우에 나는 다른 사람들의 협력이나 도움을 구한다', '복합문제 해결능력', 7, 5);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 익숙하지 않은 상황이나 문제에 도전하는 것을 즐긴다', '복합문제 해결능력', 7, 6);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 주어진 문제를 해결하기 위해 탐구하고 실험하는 것을 좋아한다', '복합문제 해결능력', 7, 7);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 복합문제를 파악하고 관리하고 처리하는 능력이 있다', '복합문제 해결능력', 7, 8);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 문제의 적합한 해결책을 찾아내기 위해서 알맞은 정보를 모으고 분석하며 처리하는 능력이 있다', '복합문제 해결능력', 7, 9);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('다른 사람들이 해결하지 못한 문제를 보면 도전의식이 생긴다', '복합문제 해결능력', 7, 10);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 복합적인 현실 세계 문제들을 해결하기 위해 지식이나 정보, 창의력을 이용하는 능력이 있다', '복합문제 해결능력', 7, 11);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 아이디어나 지식을 분석하고 창조하는 능력이 있다', '복합문제 해결능력', 7, 12);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 복합문제를 해결하기 위해 해당 문제에 대한 의미있는 질문을 도출하는 것이 중요하다고 생각한다', '복합문제 해결능력', 7, 13);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 주어진 문제를 종합적으로 분석하고 파악하는 능력이 있다', '복합문제 해결능력', 7, 14);

-- ============================================================================
-- Section 8: 마음의 습관 (14문항)
-- ============================================================================
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 어떤 일을 하더라도 정성스럽고 진실하게 하려고 한다', '마음의 습관', 8, 1);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 배움과 호기심을 즐긴다', '마음의 습관', 8, 2);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 실패하더라도 멈추거나 좌절하지 않고 다시 일어선다', '마음의 습관', 8, 3);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 끈기와 인내심이 많다', '마음의 습관', 8, 4);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 내가 어떤 일이든 성공적으로 수행할 수 있는 능력이 있다고 믿는다', '마음의 습관', 8, 5);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 부당한 상황에 마주쳤을 때 도덕적 용기를 표출할 수 있다', '마음의 습관', 8, 6);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 항상 책임감 있게 행동한다', '마음의 습관', 8, 7);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 시간관리를 잘한다', '마음의 습관', 8, 8);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 매사에 긍정적으로 생각한다', '마음의 습관', 8, 9);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 스트레스를 바로 풀어서 스트레스가 내 말이나 행동에 영향을 못 미치게 하는 편이다', '마음의 습관', 8, 10);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 한번 시작한 일은 끝가지 해낸다', '마음의 습관', 8, 11);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 항상 마감 시간보다 여유있게 맡은 일을 처리한다', '마음의 습관', 8, 12);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 "실패는 성공의 어머니"라는 생각으로 실패를 두려워 하지 않고 잘 극복하는 편이다', '마음의 습관', 8, 13);
INSERT INTO questions (q_text, category, section, q_no) VALUES ('나는 자존감이 높은 편이다', '마음의 습관', 8, 14);
