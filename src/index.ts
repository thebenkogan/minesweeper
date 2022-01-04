const div = document.getElementById("minesweeper") as HTMLDivElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const width = div.clientWidth;
const height = div.clientHeight;

canvas.width = width;
canvas.height = height;

ctx.font = "20px sans-serif";

const cols = 30;
const step = width / cols;
const rows = Math.floor(height / step);
//const rows = Math.floor(windowLength / step);
//const cols = Math.floor(windowLength / step);

function stringToPos(pos: string): number[] {
  return pos.split("_").map((s) => parseInt(s));
}

function posToString([x, y]: number[]): string {
  return `${x}_${y}`;
}

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
  ctx.lineWidth = 2;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      ctx.strokeRect(j * step, i * step, step, step);
    }
  }
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, width, height);
}

function randomSetup(bombs: number): Map<string, Tile> {
  const setup = new Map<string, Tile>(); // top left coordinate to tile
  // Register tiles
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      setup.set(`${j}_${i}`, {
        revealed: false,
        bomb: false,
        flagged: false,
        num: 0,
      });
    }
  }
  console.log(setup);
  // Determine bombs and numbers
  for (let i = 0; i < bombs; i++) {
    let minePos = getRandomPos();
    while ((setup.get(posToString(minePos)) as Tile).bomb) {
      minePos = getRandomPos();
    }
    const tile = setup.get(posToString(minePos)) as Tile;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        if (x == 0 && y == 0) {
          tile.bomb = true;
        } else {
          const offsetPos = posToString([minePos[0] + x, minePos[1] + y]);
          if (setup.has(offsetPos)) {
            (setup.get(offsetPos) as Tile).num++;
          }
        }
      }
    }
  }

  return setup;
}

let firstClick: boolean = true;
let bombCount: number = Math.floor((cols * rows) / 5);
let tiles: Map<string, Tile> = randomSetup(bombCount);
tiles.forEach((tile: Tile, _) => {
  tile.revealed = true;
});
drawGame(false);

// Reveals the tile at 'pos' and all of its neighbors. Repeats for all
// neighbors that are also empty. Optionally pass in 'revealed' map for
// all empty tiles that have already been revealed in this flood.
function revealFlood(
  [tileX, tileY]: number[],
  revealed: Map<string, boolean> = new Map<string, boolean>()
) {
  revealed.set(posToString([tileX, tileY]), true);
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      const pos = [tileX + x, tileY + y];
      if (tiles.has(posToString(pos))) {
        const tile = tiles.get(posToString(pos)) as Tile;
        if (tile.num == 0 && !revealed.has(posToString(pos))) {
          revealFlood(pos, (revealed = revealed));
        } else {
          tile.revealed = true;
        }
      }
    }
  }
}

// Mouse Down Listener
canvas.addEventListener("mousedown", (e: MouseEvent) => {
  if (e.button != 0 && e.button != 2) {
    return;
  }
  const rect = canvas.getBoundingClientRect(); // Measure relative to canvas bounds
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const pos = [x / step, y / step].map(Math.floor);
  if (!tiles.has(posToString(pos))) {
    return;
  }
  const tile = tiles.get(posToString(pos)) as Tile;
  const alt = e.button == 2;
  handleClick(tile, pos, alt);
});

function handleClick(tile: Tile, pos: number[], alt: boolean): void {
  if (tile.revealed) {
    return;
  }

  let gameOver = false;
  if (tile.flagged) {
    tile.flagged = !tile.flagged;
  } // handle hidden and unflagged tiles:
  else if (!alt) {
    if (tile.bomb) {
      gameOver = true;
      tile.revealed = true;
    } else {
      if (tile.num == 0) {
        revealFlood(pos);
      } else {
        tile.revealed = true;
      }
    }
  } else {
    tile.flagged = true;
  }

  drawGame(gameOver);
}

function handleFirstClick() {}

function drawGame(gameOver: boolean) {
  // Clear previous board and redraw grid
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  if (gameOver) {
    console.log("game over");
  }

  tiles.forEach((tile: Tile, pos: string) => {
    const [x, y] = stringToPos(pos);
    if (tile.revealed || tile.flagged) {
      if (tile.flagged) {
        ctx.fillText("F", step * x, step + step * y);
      } else if (tile.bomb) {
        ctx.fillText("B", step * x, step + step * y);
      } else if (tile.num) {
        const num = tile.num == 0 ? "" : `${tile.num}`;
        ctx.fillText(num, step * x, step + step * y);
      }
    }
  });
}
