const LABELS = ['매우 그렇다', '그렇다', '아니다', '매우 아니다'];

const AssessmentRadio = ({ questionId, value, onChange, disabled = false }) => {
  const options = [30, 20, 10, 0]; // top question → bottom question

  return (
    <div className="assessment-scale" role="radiogroup" aria-label={`문항 ${questionId} 선택`}>
      <div className={`assessment-options${disabled ? ' assessment-options-disabled' : ''}`}>
        {options.map((val, idx) => (
          <div className="assessment-option" key={val}>
            <input
              type="radio"
              id={`q${questionId}_${val}`}
              name={`point${questionId}`}
              value={val}
              checked={value === val}
              disabled={disabled}
              onChange={() => onChange(questionId, val)}
            />
            <label htmlFor={`q${questionId}_${val}`}>
              {LABELS[idx]}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssessmentRadio;
