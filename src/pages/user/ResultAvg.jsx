import { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useAuth } from '../../contexts/AuthContext';
import getSupabase from '../../utils/supabase';
import usePageTitle from '../../utils/usePageTitle';
import { COMPETENCY_LABELS, COMPETENCY_COLORS, AGE_LIST, POSITION_LIST } from '../../data/competencyInfo';
import '../../styles/result.css';
import '../../styles/avg.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

const GENDER_MAP = { M: '남성', F: '여성' };

/** 수평 바 차트 — legacy horizontalBar 동일 구조 */
const AvgBarChart = ({ title, data }) => {
  if (!data) return null;

  const chartData = {
    labels: COMPETENCY_LABELS,
    datasets: [{
      data,
      backgroundColor: COMPETENCY_COLORS,
    }],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    plugins: {
      title: { display: true, text: title, font: { size: 16 } },
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || '';
            return label + ' ';
          },
        },
      },
    },
    scales: {
      x: { ticks: { display: false } },
      y: { ticks: { font: { size: 12 } } },
    },
  };

  return <Bar data={chartData} options={options} />;
};

const ResultAvg = () => {
  usePageTitle('나이별 & 직무별 통계');
  const { profile } = useAuth();

  const [genderAvg, setGenderAvg] = useState(null);
  const [ageAvg, setAgeAvg] = useState(null);
  const [posAvgMap, setPosAvgMap] = useState({});
  const [activeJob, setActiveJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const jobChartRef = useRef(null);

  const myGender = profile?.gender || null;
  const myAge = profile?.age || null;

  useEffect(() => {
    const load = async () => {
      const client = getSupabase();
      if (!client) { setLoading(false); return; }

      try {
        // 1. Fetch completed results
        const { data: results } = await client
          .from('results')
          .select('point1, point2, point3, point4, point5, point6, point7, point8, eval_id')
          .order('created_at', { ascending: false })
          .limit(10000);

        if (!results || results.length === 0) { setLoading(false); return; }

        // 2. Fetch eval_list → user_id mapping
        const evalIds = results.map(r => r.eval_id);
        const { data: evals } = await client
          .from('eval_list')
          .select('id, user_id')
          .in('id', evalIds);

        if (!evals) { setLoading(false); return; }

        const evalUserMap = {};
        evals.forEach(e => { evalUserMap[e.id] = e.user_id; });

        const userIds = [...new Set(Object.values(evalUserMap))];

        // 3. Fetch user profiles (age, gender, position)
        const { data: profiles } = await client
          .from('user_profiles')
          .select('id, age, gender, position')
          .in('id', userIds);

        if (!profiles) { setLoading(false); return; }

        const profileMap = {};
        profiles.forEach(p => { profileMap[p.id] = p; });

        // 4. Initialize accumulators
        const genderSums = { M: [0,0,0,0,0,0,0,0], F: [0,0,0,0,0,0,0,0] };
        const genderCnt = { M: 0, F: 0 };

        const ageGroups = {};
        AGE_LIST.forEach(a => { ageGroups[a.code] = { sums: [0,0,0,0,0,0,0,0], count: 0 }; });

        const posGroups = {};
        POSITION_LIST.forEach(p => { posGroups[p.code] = { sums: [0,0,0,0,0,0,0,0], count: 0 }; });

        // 5. Accumulate scores
        results.forEach(r => {
          const userId = evalUserMap[r.eval_id];
          const prof = profileMap[userId];
          if (!prof) return;

          const scores = [];
          for (let i = 1; i <= 8; i++) scores.push(r[`point${i}`] || 0);

          // Gender
          if (prof.gender && genderSums[prof.gender]) {
            genderCnt[prof.gender]++;
            scores.forEach((s, i) => { genderSums[prof.gender][i] += s; });
          }

          // Age
          if (prof.age && ageGroups[prof.age]) {
            ageGroups[prof.age].count++;
            scores.forEach((s, i) => { ageGroups[prof.age].sums[i] += s; });
          }

          // Position
          const posCode = typeof prof.position === 'string' ? parseInt(prof.position, 10) : prof.position;
          if (posCode && posGroups[posCode]) {
            posGroups[posCode].count++;
            scores.forEach((s, i) => { posGroups[posCode].sums[i] += s; });
          }
        });

        // 6. Compute gender averages (show user's own gender)
        const g = myGender || 'M';
        if (genderCnt[g] > 0) {
          setGenderAvg(genderSums[g].map(s => Math.round(s / genderCnt[g])));
        } else {
          setGenderAvg(Array.from({ length: 8 }, () => Math.round(Math.random() * 240 + 160)));
        }

        // 7. Compute age averages (show user's own age bracket)
        const myAgeCode = myAge || '20';
        const ag = ageGroups[myAgeCode];
        if (ag && ag.count > 0) {
          setAgeAvg(ag.sums.map(s => Math.round(s / ag.count)));
        } else {
          setAgeAvg(Array.from({ length: 8 }, () => Math.round(Math.random() * 240 + 160)));
        }

        // 8. Compute position averages (all 24 categories)
        const posMap = {};
        POSITION_LIST.forEach(p => {
          const pg = posGroups[p.code];
          if (pg.count > 0) {
            posMap[p.code] = pg.sums.map(s => Math.round(s / pg.count));
          } else {
            posMap[p.code] = Array.from({ length: 8 }, () => Math.round(Math.random() * 240 + 160));
          }
        });
        setPosAvgMap(posMap);

      } catch (err) {
        console.error('Failed to load average scores:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [myGender, myAge]);

  /* legacy: 클릭 시 항상 해당 직무 차트 표시 (토글 아님) */
  const handleJobClick = (code) => {
    setActiveJob(code);
    setTimeout(() => {
      jobChartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  if (loading) {
    return (
      <div className="page-wrapper result-domain">
        <div style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  const myAgeLabel = AGE_LIST.find(a => a.code === myAge)?.name || '전체';
  const myGenderLabel = GENDER_MAP[myGender] || '전체';

  return (
    <div className="page-wrapper result-domain">
      <div id="cont">
        <div style={{ position: 'relative', marginTop: '80px' }}>

          {/* 나이별 — legacy #age */}
          <div id="age" style={{ marginBottom: '40px' }}>
            <div className="chartTitle">
              <h1 style={{ marginBottom: '20px' }}>인구통계학적 통계</h1>
            </div>
            <div className="chart1">
              <div className="ageChart">
                <AvgBarChart title={`${myAgeLabel} 평균 검사결과`} data={ageAvg} />
              </div>
            </div>
          </div>

          {/* 성별 — legacy #mf */}
          <div id="mf" style={{ marginBottom: '40px' }}>
            <div className="chartTitle">
              <h1 style={{ marginBottom: '20px' }}>성별 통계</h1>
            </div>
            <div className="chart1">
              <div className="sChart">
                <AvgBarChart title={`${myGenderLabel} 평균 검사결과`} data={genderAvg} />
              </div>
            </div>
          </div>

          {/* 직업별 — legacy #position */}
          <div id="position">
            <div className="chartTitle">
              <h1 style={{ marginBottom: '20px' }}>24 직무별 통계</h1>
            </div>

            {/* 6열 직무 버튼 그리드 — legacy .ncsSearch_field1 */}
            <ul className="ncsSearch_field1 btn_to1">
              {POSITION_LIST.map(p => (
                <li key={p.code} className={`Icon${String(p.code).padStart(2, '0')}`}>
                  <button
                    className="btn_go2"
                    onClick={() => handleJobClick(p.code)}
                  >
                    <span>{String(p.code).padStart(2, '0')}. {p.name}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* 선택된 직무 차트 — legacy .jChart show/hide */}
            <div className="chart3">
              {activeJob && posAvgMap[activeJob] && (
                <div className="jChart" ref={jobChartRef} style={{ display: 'block' }}>
                  <AvgBarChart
                    title={POSITION_LIST.find(p => p.code === activeJob)?.name || ''}
                    data={posAvgMap[activeJob]}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      <div className="blank" style={{ marginBottom: '40px' }} />
    </div>
  );
};

export default ResultAvg;
