const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const windowLength = 600;
canvas.width = windowLength;
canvas.height = windowLength;

const step = 40;
const rows = Math.floor(windowLength / step);
const cols = Math.floor(windowLength / step);

let bombCount: number = 50;

function getRandomPos(): number[] {
  return [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)];
}

/* 
Plan:
1.) Generate seed (map of pos to number), where negative number is a bomb,
positive number is the number of neighboring bombs. Link:
https://stackoverflow.com/a/3578497

2.) Initialize the tiles with these properties, all hidden and with given number.
All unflagged too. Store tiles in map of pos to tile. Accessed on each click.

3.) On click, get tile from map:

Right click:
If hidden, set flagged 
If revealed, do nothing
If flagged, unflag

Left click:
If hidden bomb, game over (reveal everything?)
If hidden number, reveal
If revealed, do nothing
If flagged, unflag

First click?:
Expose random area area click, changing those tiles to zero number

All numbers revealed?:
Game over, do something cool

Re-render board:
hidden = blank square
revealed number = colored number? (don't show zero)
revealed bomb = some bomb thing
flag = some flag thing 

*/

interface Tile {
  revealed: boolean;
  bomb: boolean;
  flagged: boolean;
  num: number; // disregarded if bomb
}

function drawGrid() {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      ctx.strokeRect(i * step, j * step, step, step);
    }
  }
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, windowLength, windowLength);
}

function randomSetup(bombs: number): Map<number[], Tile> {
  const setup = new Map<number[], Tile>(); // top left coordinate to tile
  // Register tiles
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      setup.set([i, j], {
        revealed: false,
        bomb: false,
        flagged: false,
        num: 0,
      });
    }
  }
  // Determine bombs and numbers
  for (let i = 0; i < bombs; i++) {
    let minePos = getRandomPos();
    while ((setup.get(minePos) as Tile).bomb) {
      minePos = getRandomPos();
    }
    const tile = setup.get(minePos) as Tile;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        if (x == 0 && y == 0) {
          tile.bomb = true;
        } else {
          const offsetPos = [minePos[0] + x, minePos[1] + y];
          if (setup.has(offsetPos)) {
            (setup.get(offsetPos) as Tile).num++;
          }
        }
      }
    }
  }

  // Reveal zero tiles
  setup.forEach((tile, _) => {
    if (!tile.bomb && tile.num == 0) {
      tile.revealed = true;
    }
  });

  return setup;
}

let tiles: Map<number[], Tile> = randomSetup(bombCount);

// Mouse Down Listener
canvas.addEventListener("mousedown", (e: MouseEvent) => {
  if (e.button != 0 && e.button != 2) {
    return;
  }
  const rect = canvas.getBoundingClientRect(); // Measure relative to canvas bounds
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const pos = [x / step, y / step].map(Math.floor);
  if (!tiles.has(pos)) {
    return;
  }
  const tile = tiles.get(pos) as Tile;
  const alt = e.button == 2;
  handleClick(tile, alt);
});

function handleClick(tile: Tile, alt: boolean): void {
  if (tile.revealed) {
    return;
  }

  let gameOver = false;
  if (tile.flagged) {
    tile.flagged = !tile.flagged;
  } else if (!alt) {
    if (tile.bomb) {
      gameOver = true;
    } else {
      tile.revealed = true;
    }
  } else {
    tile.flagged = true;
  }
}
