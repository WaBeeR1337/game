import config from '../config';
import sfx from '../sound';

const { intro, playerName } = config;

export default function Intro({ onStart }) {
  return (
    <div className="pixel-box center">
      <h1 className="title">{intro.title}</h1>
      <p className="subtitle">{intro.subtitle}</p>

      <div style={{ textAlign: 'left', margin: '20px 0' }}>
        <p style={{ color: 'var(--cyan)', marginTop: 0 }}>{playerName}, привет!</p>
        {intro.lines.map((line, i) => (
          <p key={i} className="hint" style={{ margin: '0 0 8px' }}>{line}</p>
        ))}
      </div>

      <button
        className="btn primary"
        onClick={() => { sfx.click(); onStart(); }}
      >
        {intro.startButton}
      </button>
    </div>
  );
}
