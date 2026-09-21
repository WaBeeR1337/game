import { useCallback, useEffect, useState } from 'react';
import config from './config';
import sfx from './sound';
import Stars from './components/Stars';
import Hud from './components/Hud';
import Flash from './components/Flash';
import Intro from './screens/Intro';
import Prize from './screens/Prize';
import Quiz from './levels/Quiz';
import Memory from './levels/Memory';
import Phrase from './levels/Phrase';
import Catch from './levels/Catch';
import Riddle from './levels/Riddle';

const LEVELS = [
  { key: 'quiz', label: 'Уровень 1', Component: Quiz },
  { key: 'memory', label: 'Уровень 2', Component: Memory },
  { key: 'phrase', label: 'Уровень 3', Component: Phrase },
  { key: 'catch', label: 'Уровень 4', Component: Catch },
  { key: 'riddle', label: 'Уровень 5', Component: Riddle },
];

const SAVE_KEY = 'love-quest-progress';

// Прогресс сохраняется, чтобы можно было закрыть вкладку и вернуться.
function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw === null) return 'intro';
    const saved = JSON.parse(raw);
    if (saved === 'prize') return 'prize';
    if (Number.isInteger(saved) && saved >= 0 && saved < LEVELS.length) return saved;
  } catch {
    // localStorage может быть недоступен — просто начинаем сначала
  }
  return 'intro';
}

function saveProgress(step) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(step));
  } catch {
    // не критично
  }
}

export default function App() {
  const [step, setStep] = useState(loadProgress);   // 'intro' | 0..4 | 'prize'
  const [flash, setFlash] = useState(null);
  const [soundOn, setSoundOn] = useState(sfx.isEnabled());

  useEffect(() => {
    if (step !== 'intro') saveProgress(step);
  }, [step]);

  // Плашка «уровень пройден» гаснет сама.
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 1100);
    return () => clearTimeout(timer);
  }, [flash]);

  const completeLevel = useCallback(() => {
    if (typeof step !== 'number') return;

    const next = step + 1;
    if (next >= LEVELS.length) {
      setStep('prize');
      return;
    }
    sfx.levelUp();
    setFlash(`УРОВЕНЬ ${step + 1} ПРОЙДЕН`);
    setStep(next);
  }, [step]);

  const replay = useCallback(() => {
    sfx.click();
    saveProgress('intro');
    try { localStorage.removeItem(SAVE_KEY); } catch { /* не критично */ }
    setStep('intro');
  }, []);

  const toggleSound = useCallback(() => setSoundOn(sfx.toggle()), []);

  const Level = typeof step === 'number' ? LEVELS[step].Component : null;

  return (
    <div className="stage">
      <Stars />
      <div className="scanlines" aria-hidden="true" />

      <button
        className="sound-toggle"
        onClick={toggleSound}
        aria-label={soundOn ? 'Выключить звук' : 'Включить звук'}
        title={soundOn ? 'Выключить звук' : 'Включить звук'}
      >
        {soundOn ? '♪' : '✕'}
      </button>

      <div className="wrap">
        {typeof step === 'number' && (
          <Hud current={step} total={LEVELS.length} label={LEVELS[step].label} />
        )}

        {step === 'intro' && <Intro onStart={() => setStep(0)} />}
        {Level && <Level key={LEVELS[step].key} onComplete={completeLevel} />}
        {step === 'prize' && <Prize onReplay={replay} />}
      </div>

      {flash && <Flash text={flash} />}
    </div>
  );
}
