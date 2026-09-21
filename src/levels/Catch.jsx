import { useCallback, useEffect, useRef, useState } from 'react';
import config from '../config';
import sfx from '../sound';

const { catch: game } = config;

// Логический размер поля. Canvas рисуется в этих координатах и
// растягивается по CSS — так картинка остаётся пиксельной.
const W = 300;
const H = 400;
const BASKET_W = 52;
const BASKET_H = 14;
const ITEM = 16;          // размер падающего предмета
const SPAWN_MS = 620;

// Пиксельные спрайты 8x8: 1 — закрашенный пиксель.
const HEART = [
  [0,1,1,0,0,1,1,0],
  [1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,0,0],
  [0,0,0,1,1,0,0,0],
  [0,0,0,0,0,0,0,0],
];
const BOMB = [
  [0,0,0,0,0,1,0,0],
  [0,0,0,0,1,0,0,0],
  [0,0,1,1,1,0,0,0],
  [0,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,0,0],
  [0,0,1,1,1,0,0,0],
];

function drawSprite(ctx, sprite, x, y, size, color) {
  const px = size / 8;
  ctx.fillStyle = color;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (sprite[row][col]) ctx.fillRect(x + col * px, y + row * px, px, px);
    }
  }
}

export default function Catch({ onComplete }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const doneRef = useRef(false);

  const [caught, setCaught] = useState(0);
  const [lives, setLives] = useState(game.lives);
  const [timeLeft, setTimeLeft] = useState(game.duration);
  const [status, setStatus] = useState('play'); // play | lost
  const [round, setRound] = useState(0);        // смена = рестарт уровня

  // Всё изменчивое состояние игры живёт в ref, чтобы цикл не перезапускался.
  const world = useRef(null);

  const restart = useCallback(() => {
    doneRef.current = false;
    setCaught(0);
    setLives(game.lives);
    setTimeLeft(game.duration);
    setStatus('play');
    setRound((r) => r + 1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    world.current = {
      basketX: W / 2 - BASKET_W / 2,
      items: [],
      left: false,
      right: false,
      pointerX: null,
      caught: 0,
      lives: game.lives,
      elapsed: 0,
      lastSpawn: 0,
    };
    const w = world.current;

    // ---------- управление ----------
    const onKeyDown = (e) => {
      if (['ArrowLeft', 'a', 'A', 'ф', 'Ф'].includes(e.key)) w.left = true;
      if (['ArrowRight', 'd', 'D', 'в', 'В'].includes(e.key)) w.right = true;
      if (e.key.startsWith('Arrow')) e.preventDefault();
    };
    const onKeyUp = (e) => {
      if (['ArrowLeft', 'a', 'A', 'ф', 'Ф'].includes(e.key)) w.left = false;
      if (['ArrowRight', 'd', 'D', 'в', 'В'].includes(e.key)) w.right = false;
    };
    const onPointer = (e) => {
      const rect = canvas.getBoundingClientRect();
      w.pointerX = ((e.clientX - rect.left) / rect.width) * W;
    };
    const onPointerLeave = () => { w.pointerX = null; };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('pointerleave', onPointerLeave);

    // ---------- игровой цикл ----------
    let last = performance.now();

    const finish = (won) => {
      if (doneRef.current) return;
      doneRef.current = true;
      if (won) { sfx.levelUp(); onComplete(); }
      else { sfx.bad(); setStatus('lost'); }
    };

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); // защита от «прыжка» после сворачивания
      last = now;

      if (!doneRef.current) {
        w.elapsed += dt;
        setTimeLeft(Math.max(0, Math.ceil(game.duration - w.elapsed)));

        // движение корзины
        const speed = 260;
        if (w.pointerX !== null) {
          w.basketX = w.pointerX - BASKET_W / 2;
        } else {
          if (w.left) w.basketX -= speed * dt;
          if (w.right) w.basketX += speed * dt;
        }
        w.basketX = Math.max(0, Math.min(W - BASKET_W, w.basketX));

        // появление предметов — со временем чуть чаще и быстрее
        const progress = w.elapsed / game.duration;
        w.lastSpawn += dt * 1000;
        if (w.lastSpawn > SPAWN_MS - progress * 220) {
          w.lastSpawn = 0;
          w.items.push({
            x: Math.random() * (W - ITEM),
            y: -ITEM,
            vy: 90 + Math.random() * 45 + progress * 70,
            bomb: Math.random() < 0.26,
          });
        }

        // падение и столкновения
        const basketY = H - BASKET_H - 6;
        w.items = w.items.filter((item) => {
          item.y += item.vy * dt;

          const hit =
            item.y + ITEM >= basketY &&
            item.y + ITEM <= basketY + BASKET_H + 8 &&
            item.x + ITEM > w.basketX &&
            item.x < w.basketX + BASKET_W;

          if (hit) {
            if (item.bomb) {
              w.lives -= 1;
              setLives(w.lives);
              sfx.bad();
              if (w.lives <= 0) finish(false);
            } else {
              w.caught += 1;
              setCaught(w.caught);
              sfx.pick();
              if (w.caught >= game.goal) finish(true);
            }
            return false;
          }
          return item.y < H + ITEM;
        });

        if (w.elapsed >= game.duration && !doneRef.current) finish(false);
      }

      // ---------- отрисовка ----------
      ctx.fillStyle = '#0d0a1c';
      ctx.fillRect(0, 0, W, H);

      w.items.forEach((item) =>
        drawSprite(ctx, item.bomb ? BOMB : HEART, item.x, item.y, ITEM, item.bomb ? '#9b8fc7' : '#ff4d8d'),
      );

      // корзина
      const by = H - BASKET_H - 6;
      ctx.fillStyle = '#3ff0d4';
      ctx.fillRect(w.basketX, by, BASKET_W, BASKET_H);
      ctx.fillStyle = '#0d0a1c';
      ctx.fillRect(w.basketX + 4, by + 4, BASKET_W - 8, BASKET_H - 8);
      ctx.fillStyle = '#ffd93d';
      ctx.fillRect(w.basketX, by, BASKET_W, 4);

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerdown', onPointer);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [round, onComplete]);

  return (
    <div className="pixel-box">
      <h1 className="title small">{game.title}</h1>
      <p className="hint">{game.hint}</p>

      <div className="arcade-hud">
        <span>Поймано: <b>{caught} / {game.goal}</b></span>
        <span>Жизни: <b>{'♥'.repeat(Math.max(0, lives)) || '—'}</b></span>
        <span>Время: <b>{timeLeft}</b></span>
      </div>

      <canvas ref={canvasRef} className="arcade" width={W} height={H} />

      {status === 'lost' && (
        <button className="btn primary mt" onClick={restart}>
          ПОПРОБОВАТЬ СНОВА
        </button>
      )}
    </div>
  );
}
