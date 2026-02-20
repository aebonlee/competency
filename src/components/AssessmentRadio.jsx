const AssessmentRadio = ({ questionId, value, onChange }) => {
  const options = [30, 20, 10, 0]; // top question → bottom question

  return (
    <div className="assessment-scale">
      <div className="assessment-options">
        {options.map((val) => (
          <div className="assessment-option" key={val}>
            <input
              type="radio"
              id={`q${questionId}_${val}`}
              name={`point${questionId}`}
              value={val}
              checked={value === val}
              onChange={() => onChange(questionId, val)}
            />
            <label htmlFor={`q${questionId}_${val}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssessmentRadio;
