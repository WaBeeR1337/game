// Простые 8-битные звуки через WebAudio — без единого mp3-файла.
let ctx = null;
let enabled = true;

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, duration, type = 'square', volume = 0.08) {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

function melody(notes) {
  if (!enabled) return;
  notes.forEach(([freq, at, dur]) => {
    setTimeout(() => blip(freq, dur), at);
  });
}

export const sfx = {
  isEnabled: () => enabled,
  toggle() {
    enabled = !enabled;
    if (enabled) blip(660, 0.08);
    return enabled;
  },
  click: () => blip(440, 0.06),
  good: () => melody([[660, 0, 0.09], [880, 80, 0.14]]),
  bad: () => melody([[200, 0, 0.12], [140, 90, 0.18]]),
  pick: () => blip(880, 0.05, 'square', 0.05),
  levelUp: () => melody([[523, 0, 0.1], [659, 90, 0.1], [784, 180, 0.1], [1046, 270, 0.25]]),
  win: () =>
    melody([
      [523, 0, 0.12], [659, 110, 0.12], [784, 220, 0.12], [1046, 330, 0.16],
      [784, 470, 0.12], [1046, 580, 0.4],
    ]),
};

export default sfx;
