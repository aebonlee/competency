import { useEffect } from 'react';

const BASE_TITLE = 'MyCoreCompetency';

/**
 * 페이지별 document.title 설정 훅
 * @param {string} title - 페이지 제목 (예: "검사하기")
 */
const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} - 4차 산업혁명 8대 핵심역량 검사`;
    return () => {
      document.title = `${BASE_TITLE} - 4차 산업혁명 8대 핵심역량 검사`;
    };
  }, [title]);
};

export default usePageTitle;
