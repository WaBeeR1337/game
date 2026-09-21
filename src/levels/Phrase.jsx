import { useMemo, useState } from 'react';
import config from '../config';
import sfx from '../sound';

const { phrase } = config;
const target = phrase.text.trim().split(/\s+/);

function shuffleWords(words) {
  const pool = words.map((text, id) => ({ id, text }));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  // Если случайно выпал исходный порядок — сдвигаем, чтобы задание не было пустым.
  const same = pool.every((w, i) => w.text === target[i]);
  return same && pool.length > 1 ? [...pool.slice(1), pool[0]] : pool;
}

export default function Phrase({ onComplete }) {
  const pool = useMemo(() => shuffleWords(target), []);
  const [placed, setPlaced] = useState([]); // элементы пула в выбранном порядке
  const [shake, setShake] = useState(false);

  function place(word) {
    if (placed.some((w) => w.id === word.id)) return;

    if (word.text !== target[placed.length]) {
      sfx.bad();
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPlaced([]);
      }, 350);
      return;
    }

    const next = [...placed, word];
    setPlaced(next);

    if (next.length === target.length) {
      sfx.good();
      setTimeout(onComplete, 500);
    } else {
      sfx.pick();
    }
  }

  function removeLast() {
    if (!placed.length) return;
    sfx.click();
    setPlaced(placed.slice(0, -1));
  }

  const complete = placed.length === target.length;

  return (
    <div className="pixel-box">
      <h1 className="title small">{phrase.title}</h1>
      <p className="hint">{phrase.hint}</p>

      <div className={'slot-area' + (shake ? ' shake' : '')}>
        {placed.length === 0 && <span className="hint">…собери фразу здесь…</span>}
        {placed.map((word, i) => (
          <span
            key={word.id}
            className="word chip"
            onClick={i === placed.length - 1 ? removeLast : undefined}
          >
            {word.text}
          </span>
        ))}
      </div>

      <div className="words">
        {pool.map((word) => {
          const used = placed.some((w) => w.id === word.id);
          return (
            <button
              key={word.id}
              className={'word' + (used ? ' used' : '')}
              onClick={() => place(word)}
              disabled={used || complete}
            >
              {word.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
