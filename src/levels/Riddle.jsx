import { useState } from 'react';
import config from '../config';
import sfx from '../sound';

const { riddle } = config;

// Сравниваем «мягко»: без регистра, лишних пробелов, точек и ё/е.
function normalize(value) {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function Riddle({ onComplete }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  function submit(e) {
    e.preventDefault();
    const answer = normalize(value);
    if (!answer) return;

    if (riddle.answers.some((a) => normalize(a) === answer)) {
      sfx.good();
      setError('');
      onComplete();
      return;
    }

    sfx.bad();
    setAttempts((a) => a + 1);
    setError('Не то. Попробуй ещё раз.');
  }

  return (
    <div className="pixel-box">
      <h1 className="title small">{riddle.title}</h1>
      <p className="hint">{riddle.hint}</p>

      <p className="q-text">{riddle.question}</p>

      <form onSubmit={submit}>
        <input
          className="input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          placeholder="твой ответ"
          autoComplete="off"
          autoFocus
        />
        <p className="error">{error}</p>
        <button className="btn primary" type="submit" disabled={!value.trim()}>
          ОТВЕТИТЬ
        </button>
      </form>

      {attempts >= 3 && riddle.tip && <p className="tip">Подсказка: {riddle.tip}</p>}
    </div>
  );
}
