import { useState } from 'react';
import config from '../config';
import sfx from '../sound';

const { quiz } = config;

export default function Quiz({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null); // индекс выбранного варианта
  const [locked, setLocked] = useState(false);

  const question = quiz.questions[index];

  function choose(i) {
    if (locked) return;
    setLocked(true);
    setPicked(i);

    const right = i === question.correct;
    right ? sfx.good() : sfx.bad();

    setTimeout(() => {
      setPicked(null);
      setLocked(false);
      if (!right) return; // тот же вопрос ещё раз
      if (index + 1 < quiz.questions.length) setIndex(index + 1);
      else onComplete();
    }, 750);
  }

  function optionClass(i) {
    if (picked === null) return 'btn opt';
    if (i === question.correct) return 'btn opt correct';
    if (i === picked) return 'btn opt wrong';
    return 'btn opt';
  }

  return (
    <div className="pixel-box">
      <h1 className="title small">{quiz.title}</h1>
      <p className="hint">{quiz.hint}</p>

      <p className="q-num">
        Вопрос {index + 1} / {quiz.questions.length}
      </p>
      <p className="q-text">{question.q}</p>

      <div className="stack">
        {question.options.map((option, i) => (
          <button key={i} className={optionClass(i)} onClick={() => choose(i)} disabled={locked}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
