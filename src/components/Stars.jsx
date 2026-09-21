import { useMemo } from 'react';

// Статичное звёздное поле — считается один раз за сессию.
export default function Stars({ count = 60 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 3,
      })),
    [count],
  );

  return (
    <div className="stars" aria-hidden="true">
      {stars.map((s, i) => (
        <i
          key={i}
          className="star"
          style={{ top: `${s.top}%`, left: `${s.left}%`, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  );
}
