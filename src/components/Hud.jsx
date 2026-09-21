export default function Hud({ current, total, label }) {
  return (
    <div className="hud">
      <span>{label}</span>
      <span className="hearts" aria-label={`Уровень ${current + 1} из ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <i
            key={i}
            className={'heart' + (i < current ? ' on' : i === current ? ' now' : '')}
          />
        ))}
      </span>
    </div>
  );
}
