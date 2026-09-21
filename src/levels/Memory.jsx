import { useEffect, useMemo, useState } from 'react';
import config from '../config';
import sfx from '../sound';

const { memory } = config;

function shuffled(icons) {
  const deck = icons.flatMap((icon, i) => [
    { id: `${i}a`, icon },
    { id: `${i}b`, icon },
  ]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function Memory({ onComplete }) {
  const deck = useMemo(() => shuffled(memory.icons), []);
  const [open, setOpen] = useState([]);   // индексы открытых сейчас карточек
  const [done, setDone] = useState([]);   // индексы угаданных
  const [moves, setMoves] = useState(0);

  // Сравниваем пару, когда открыты две карточки.
  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open;
    const match = deck[a].icon === deck[b].icon;
    match ? sfx.good() : sfx.bad();

    const timer = setTimeout(() => {
      if (match) setDone((prev) => [...prev, a, b]);
      setOpen([]);
    }, match ? 350 : 700);
    return () => clearTimeout(timer);
  }, [open, deck]);

  // Все пары найдены — уровень пройден.
  useEffect(() => {
    if (done.length && done.length === deck.length) {
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }
  }, [done, deck.length, onComplete]);

  function flip(i) {
    if (open.length === 2 || open.includes(i) || done.includes(i)) return;
    sfx.pick();
    setOpen((prev) => [...prev, i]);
    if (open.length === 1) setMoves((m) => m + 1);
  }

  return (
    <div className="pixel-box">
      <h1 className="title small">{memory.title}</h1>
      <p className="hint">{memory.hint}</p>

      <div className="arcade-hud">
        <span>Пар найдено: <b>{done.length / 2} / {memory.icons.length}</b></span>
        <span>Ходов: <b>{moves}</b></span>
      </div>

      <div className="grid-memory">
        {deck.map((card, i) => {
          const isDone = done.includes(i);
          const isOpen = open.includes(i);
          return (
            <button
              key={card.id}
              className={'card' + (isDone ? ' done' : isOpen ? ' open' : '')}
              onClick={() => flip(i)}
              disabled={isDone}
              aria-label={isDone || isOpen ? card.icon : 'закрытая карточка'}
            >
              {isDone || isOpen ? card.icon : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
