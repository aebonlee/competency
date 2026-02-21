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
 * 8대 핵심역량 PolarArea 차트 (legacy result.jsp 동일)
 */
export const CompetencyPolarChart = ({ scores }) => {
  const data = {
    labels: COMPETENCY_LABELS_SHORT,
    datasets: [{
      data: scores,
      backgroundColor: COMPETENCY_COLORS,
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
        ticks: { display: false },
        grid: { display: false },
      }
    }
  };

  return <PolarArea data={data} options={options} />;
};

/**
 * 더블 도넛 차트 (2015 교육과정 / NCS 비교용)
 * outerColors / innerColors: 커스텀 색상 배열 (legacy 원본 색상)
 */
export const CompetencyDoughnutChart = ({
  outerData, innerData,
  outerLabels, innerLabels,
  outerColors, innerColors
}) => {
  const oColors = outerColors || COMPETENCY_COLORS;
  const iColors = innerColors || COMPETENCY_COLORS;

  const data = {
    labels: outerLabels,
    datasets: [
      {
        data: outerData,
        backgroundColor: oColors,
        borderColor: oColors,
        borderWidth: 2,
        label: '1',
        labels: outerLabels,
        weight: 1,
      },
      {
        data: innerData,
        backgroundColor: iColors,
        borderColor: iColors,
        borderWidth: 1,
        label: '2',
        labels: innerLabels,
        weight: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { font: { size: 11, family: 'Noto Sans KR' }, padding: 12 }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const dataset = context.dataset;
            const index = context.dataIndex;
            const labels = dataset.labels || [];
            return labels[index] || '';
          }
        }
      }
    },
    cutout: '30%',
  };

  return <Doughnut data={data} options={options} />;
};
