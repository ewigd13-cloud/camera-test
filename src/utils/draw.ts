// utils/draw.ts
export function drawWhiteboard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  texts: string[]
) {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'black';
  ctx.font = '16px sans-serif';

  const cellHeight = height / 5;
  const cellWidth = width / 2;

  texts.forEach((text, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = col * cellWidth + 10;
    const y = row * cellHeight + 24;
    ctx.fillText(text, x, y);
  });
}