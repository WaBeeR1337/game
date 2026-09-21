import { useEffect, useMemo, useRef } from 'react';
import config from '../config';
import sfx from '../sound';

const { prize, playerName, authorName } = config;

// Сертификат рисуется на canvas, поэтому его можно скачать картинкой.
// Высота подстраивается под количество строк-условий из config.
const CW = 1000;
const TERMS_STEP = 32;
const CH = 760 + Math.max(0, prize.terms.length - 3) * TERMS_STEP;

const COLORS = ['#ff4d8d', '#3ff0d4', '#ffd93d', '#5ddf6a', '#f4eefc'];

function pixelHeart(ctx, x, y, size, color) {
  const rows = [
    [0,1,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,0,0,0,0,0],
  ];
  const px = size / 8;
  ctx.fillStyle = color;
  rows.forEach((row, r) =>
    row.forEach((on, c) => {
      if (on) ctx.fillRect(x + c * px, y + r * px, px, px);
    }),
  );
}

function drawCertificate(ctx) {
  const font = (size, weight = 400) => `${weight} ${size}px "Pixelify Sans", "Courier New", monospace`;

  // фон
  ctx.fillStyle = '#16122a';
  ctx.fillRect(0, 0, CW, CH);

  // пиксельная двойная рамка
  ctx.fillStyle = '#ff4d8d';
  ctx.fillRect(24, 24, CW - 48, CH - 48);
  ctx.fillStyle = '#16122a';
  ctx.fillRect(40, 40, CW - 80, CH - 80);
  ctx.fillStyle = '#3ff0d4';
  ctx.fillRect(52, 52, CW - 104, CH - 104);
  ctx.fillStyle = '#241d44';
  ctx.fillRect(60, 60, CW - 120, CH - 120);

  // сердечки по углам
  pixelHeart(ctx, 84, 84, 40, '#ff4d8d');
  pixelHeart(ctx, CW - 124, 84, 40, '#ff4d8d');
  pixelHeart(ctx, 84, CH - 124, 40, '#ff4d8d');
  pixelHeart(ctx, CW - 124, CH - 124, 40, '#ff4d8d');

  ctx.textAlign = 'center';

  // заголовок
  ctx.fillStyle = '#ffd93d';
  ctx.font = font(78, 700);
  ctx.fillText(prize.certificateTitle, CW / 2, 196);

  // основной текст
  ctx.fillStyle = '#f4eefc';
  ctx.font = font(34);
  ctx.fillText(prize.certificateBody, CW / 2, 258);

  // разделитель
  ctx.fillStyle = '#3ff0d4';
  ctx.fillRect(CW / 2 - 180, 288, 360, 6);

  // кому
  ctx.fillStyle = '#9b8fc7';
  ctx.font = font(26);
  ctx.fillText('ВЫДАН', CW / 2, 344);
  ctx.fillStyle = '#ff4d8d';
  ctx.font = font(52, 700);
  ctx.fillText(playerName, CW / 2, 400);

  // условия
  ctx.fillStyle = '#9b8fc7';
  ctx.font = font(22);
  const termsTop = 452;
  prize.terms.forEach((line, i) => ctx.fillText(line, CW / 2, termsTop + i * TERMS_STEP));

  // подпись и дата
  const signY = termsTop + prize.terms.length * TERMS_STEP + 24;
  ctx.fillStyle = '#3ff0d4';
  ctx.fillRect(CW / 2 - 200, signY, 400, 4);
  ctx.fillStyle = '#f4eefc';
  ctx.font = font(24);
  ctx.fillText(authorName, CW / 2, signY + 40);
  ctx.fillStyle = '#9b8fc7';
  ctx.font = font(20);
  ctx.fillText(new Date().toLocaleDateString('ru-RU'), CW / 2, signY + 72);
}

export default function Prize({ onReplay }) {
  const canvasRef = useRef(null);

  const confetti = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 2.5 + Math.random() * 2.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })),
    [],
  );

  useEffect(() => {
    sfx.win();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let cancelled = false;
    const render = () => { if (!cancelled) drawCertificate(ctx); };

    render(); // сразу — на запасном шрифте
    // и ещё раз, когда подгрузится пиксельный шрифт
    if (document.fonts?.ready) document.fonts.ready.then(render);

    return () => { cancelled = true; };
  }, []);

  function download() {
    sfx.click();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'sertifikat-na-zhelanie.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <>
      <div className="confetti" aria-hidden="true">
        {confetti.map((bit, i) => (
          <i
            key={i}
            className="conf-bit"
            style={{
              left: `${bit.left}%`,
              background: bit.color,
              animationDelay: `${bit.delay}s`,
              animationDuration: `${bit.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="pixel-box center">
        <h1 className="title">{prize.title}</h1>
        <p className="subtitle">{prize.subtitle}</p>

        <canvas ref={canvasRef} className="cert-preview" width={CW} height={CH} />

        <p className="prize-msg">{prize.message}</p>

        <div className="stack mt">
          <button className="btn primary" onClick={download}>{prize.downloadButton}</button>
          <button className="btn ghost" onClick={onReplay}>{prize.replayButton}</button>
        </div>
      </div>
    </>
  );
}
