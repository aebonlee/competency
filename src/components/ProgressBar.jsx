const ProgressBar = ({ current, total }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="assessment-progress">
      <div className="progress-info">
        <span>검사진행 현황 ( {current}/{total} )</span>
        <span>{percentage}%</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
