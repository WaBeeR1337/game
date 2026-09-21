import { useEffect, useMemo, useRef, useState } from 'react';
import config from '../config';
import sfx from '../sound';

const { prize, playerName, playerNameDative, authorName } = config;

// На сертификате «ВЫДАН Кристине» — нужен дательный падеж.
// Если в config его не задали, берём обычное имя.
const certificateName = playerNameDative || playerName;

// Сертификат рисуется на canvas, поэтому его можно скачать картинкой.
// Высота подстраивается под количество строк-условий из config.
const CW = 1000;
const TERMS_STEP = 32;
const CH = 760 + Math.max(0, prize.terms.length - 3) * TERMS_STEP;

const FILE_NAME = 'sertifikat-na-zhelanie.png';

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

const display = (size) => `${size}px "Press Start 2P", "Courier New", monospace`;
const body = (size) => `${size}px "Tiny5", "Courier New", monospace`;

// Строка рисуется по центру и ужимается, если не влезает по ширине:
// имя и формулировки берутся из config, длину заранее не угадать.
function fitted(ctx, text, y, maxWidth, size, family) {
  let current = size;
  ctx.font = family(current);
  while (current > 10 && ctx.measureText(text).width > maxWidth) {
    current -= 2;
    ctx.font = family(current);
  }
  ctx.fillText(text, CW / 2, y);
}

function drawCertificate(ctx) {
  const inner = CW - 240; // рамка минус угловые сердечки

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
  fitted(ctx, prize.certificateTitle, 210, inner, 58, display);

  // основной текст
  ctx.fillStyle = '#f4eefc';
  fitted(ctx, prize.certificateBody, 272, inner, 36, body);

  // разделитель
  ctx.fillStyle = '#3ff0d4';
  ctx.fillRect(CW / 2 - 180, 300, 360, 6);

  // кому
  ctx.fillStyle = '#9b8fc7';
  fitted(ctx, 'ВЫДАН', 352, inner, 26, body);
  ctx.fillStyle = '#ff4d8d';
  fitted(ctx, certificateName, 412, inner, 42, display);

  // условия
  ctx.fillStyle = '#c3b6e8';
  const termsTop = 466;
  prize.terms.forEach((line, i) =>
    fitted(ctx, line, termsTop + i * TERMS_STEP, inner, 24, body),
  );

  // подпись и дата
  const signY = termsTop + prize.terms.length * TERMS_STEP + 24;
  ctx.fillStyle = '#3ff0d4';
  ctx.fillRect(CW / 2 - 200, signY, 400, 4);
  ctx.fillStyle = '#f4eefc';
  fitted(ctx, authorName, signY + 42, inner, 26, body);
  ctx.fillStyle = '#9b8fc7';
  fitted(ctx, new Date().toLocaleDateString('ru-RU'), signY + 76, inner, 22, body);
}

export default function Prize({ onReplay }) {
  const canvasRef = useRef(null);
  const fileRef = useRef(null);          // готовый PNG для системного «Поделиться»
  const [imageUrl, setImageUrl] = useState(null);
  const [canShare, setCanShare] = useState(false);

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
    // Рисуем в canvas, который на странице не показываем: на экран идёт <img>.
    // Картинку на iPhone можно сохранить долгим нажатием, canvas — нельзя.
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    let cancelled = false;

    const render = () => {
      if (cancelled) return;
      drawCertificate(ctx);
      setImageUrl(canvas.toDataURL('image/png'));

      // Файл готовим заранее: Safari разрешает navigator.share только
      // внутри обработчика нажатия, без единого await перед вызовом.
      canvas.toBlob((blob) => {
        if (cancelled || !blob) return;
        try {
          const file = new File([blob], FILE_NAME, { type: 'image/png' });
          fileRef.current = file;
          setCanShare(Boolean(navigator.canShare?.({ files: [file] })));
        } catch {
          fileRef.current = null; // File может быть недоступен в старых браузерах
        }
      }, 'image/png');
    };

    render();                                        // сразу — на запасном шрифте
    if (document.fonts?.ready) document.fonts.ready.then(render); // и с пиксельным

    return () => { cancelled = true; };
  }, []);

  function save() {
    sfx.click();
    const file = fileRef.current;

    // iOS: системное меню, в нём есть «Сохранить в Фото».
    // Вызываем синхронно, иначе Safari сочтёт это не пользовательским действием.
    if (file && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: prize.certificateTitle }).catch(() => {
        // отмена или отказ — просто ничего не делаем
      });
      return;
    }

    // Обычные браузеры: честное скачивание файла.
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = FILE_NAME;
    link.href = imageUrl || canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
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

        {imageUrl && (
          <img className="cert-preview" src={imageUrl} alt={prize.certificateTitle} />
        )}

        <p className="prize-msg">{prize.message}</p>

        <div className="stack mt">
          <button className="btn primary" onClick={save}>
            {canShare ? prize.shareButton || prize.downloadButton : prize.downloadButton}
          </button>
          <p className="save-hint">
            {prize.saveHint ||
              'Не сохранилось? Задержи палец на сертификате и выбери «Сохранить в Фото».'}
          </p>
          <button className="btn ghost" onClick={onReplay}>{prize.replayButton}</button>
        </div>
      </div>
    </>
  );
}
