import { PolarArea, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { COMPETENCY_COLORS, COMPETENCY_LABELS_SHORT } from '../data/competencyInfo';

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

/**
 * 8대 핵심역량 PolarArea 차트
 */
export const CompetencyPolarChart = ({ scores }) => {
  const data = {
    labels: COMPETENCY_LABELS_SHORT,
    datasets: [{
      data: scores,
      backgroundColor: COMPETENCY_COLORS.map(c => c + '99'),
      borderColor: COMPETENCY_COLORS,
      borderWidth: 2,
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 12, family: 'Noto Sans KR' }, padding: 16 }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20, font: { size: 10 } }
      }
    }
  };

  return <PolarArea data={data} options={options} />;
};

/**
 * 더블 도넛 차트 (2015 교육과정 / NCS 비교용)
 */
export const CompetencyDoughnutChart = ({ outerData, innerData, outerLabels, innerLabels }) => {
  const data = {
    labels: [...outerLabels, ...innerLabels],
    datasets: [
      {
        label: '외부',
        data: outerData,
        backgroundColor: outerData.map((_, i) => COMPETENCY_COLORS[i % COMPETENCY_COLORS.length] + '99'),
        borderColor: outerData.map((_, i) => COMPETENCY_COLORS[i % COMPETENCY_COLORS.length]),
        borderWidth: 2,
      },
      {
        label: '내부',
        data: innerData,
        backgroundColor: innerData.map((_, i) => COMPETENCY_COLORS[i % COMPETENCY_COLORS.length] + '55'),
        borderColor: innerData.map((_, i) => COMPETENCY_COLORS[i % COMPETENCY_COLORS.length]),
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 11, family: 'Noto Sans KR' }, padding: 12 }
      }
    },
    cutout: '30%',
  };

  return <Doughnut data={data} options={options} />;
};
