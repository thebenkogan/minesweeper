const div = document.getElementById("minesweeper") as HTMLDivElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const bombImage = document.getElementById("bomb") as HTMLImageElement;
const flagImage = document.getElementById("flag") as HTMLImageElement;
const primaryColor = "#DCDCDC"; // revealed tiles
const secondaryColor = "#FFFFFF"; // unrevealed tiles and flag background
const bombBG = "#F50114"; // bomb background
const winColor = "#0EF11B";

const width = div.clientWidth;
const height = div.clientHeight;

canvas.width = width;
canvas.height = height;

const cols = 25;
const step = width / cols;
const rows = Math.floor(height / step);

const bombCount: number = Math.floor((cols * rows) / 6);

ctx.font = `${step - 5}px sans-serif`;
const numColorMap = new Map<number, string>([
  [1, "#334FFF"],
  [2, "#129E16"],
  [3, "#CA2D17"],
  [4, "#B217CA"],
  [5, "#DC9117"],
  [6, "#17DCD9"],
  [7, "#020707"],
  [8, "#919191"],
]);

function stringToPos(pos: string): number[] {
  return pos.split("_").map((s) => parseInt(s));
}

function posToString([x, y]: number[]): string {
  return `${x}_${y}`;
}

function getRandomPos(): number[] {
  return [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)];
}

interface Tile {
  revealed: boolean;
  bomb: boolean;
  flagged: boolean;
  num: number; // disregarded if bomb
}

function drawGrid() {
  ctx.lineWidth = 0.5;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      ctx.strokeRect(j * step, i * step, step, step);
    }
  }
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, width, height);
}

function randomSetup(bombs: number, [firstX, firstY]: number[]): void {
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
  // Determine bombs and numbers
  for (let i = 0; i < bombs; i++) {
    let minePos = getRandomPos();
    while (
      (setup.get(posToString(minePos)) as Tile).bomb ||
      (Math.abs(minePos[0] - firstX) <= 1 && Math.abs(minePos[1] - firstY) <= 1)
    ) {
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

  tiles = setup;

  revealFlood([firstX, firstY]);
}

// Initial Setup
let replay = false;
let firstClick: boolean = true;
let tiles: Map<string, Tile>;
drawGrid();

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
          tile.flagged = false;
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
  if (replay) {
    replay = false;
    firstClick = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    return;
  }
  const rect = canvas.getBoundingClientRect(); // Measure relative to canvas bounds
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const pos = [x / step, y / step].map(Math.floor);
  if (firstClick) {
    randomSetup(bombCount, pos);
    drawGame(false);
    firstClick = false;
  }
  if (!tiles.has(posToString(pos))) {
    return;
  }
  const tile = tiles.get(posToString(pos)) as Tile;
  const alt = e.button == 2;
  handleClick(tile, pos, alt);
});

function handleClick(tile: Tile, pos: number[], alt: boolean): void {
  //if (firstClick && !alt) {
  //  handleFirstClick(pos);
  //  return;
  //}

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

function revealAll() {
  tiles.forEach((tile: Tile, _) => {
    tile.revealed = true;
  });
}

function checkWin() {
  let revealed = 0;
  tiles.forEach((tile: Tile, _) => {
    if (tile.revealed) {
      revealed++;
    }
  });
  if (cols * rows - revealed == bombCount) {
    return true;
  }
}

function drawGame(gameOver: boolean) {
  // Clear previous board
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    revealAll();
    replay = true;
  }

  if (checkWin()) {
    replay = true;
  }

  const gameWin = replay && !gameOver;
  tiles.forEach((tile: Tile, pos: string) => {
    const [x, y] = stringToPos(pos);
    if (tile.revealed || tile.flagged) {
      if (tile.flagged || tile.bomb) {
        ctx.fillStyle = tile.flagged ? secondaryColor : bombBG;
        if (gameWin && tile.flagged) {
          ctx.fillStyle = winColor;
        }
        ctx.fillRect(step * x, step * y, step, step);
        ctx.drawImage(
          tile.flagged ? flagImage : bombImage,
          step * x + 5,
          step * y + 5,
          step - 10,
          step - 10
        );
      } else {
        ctx.fillStyle = primaryColor;
        ctx.fillRect(step * x, step * y, step, step);
        if (tile.num > 0) {
          const num = `${tile.num}`;
          ctx.fillStyle = numColorMap.get(tile.num) || primaryColor;
          ctx.fillText(num, step * x + step / 4, step + step * y - step / 5);
        }
      }
    } else {
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(step * x, step * y, step, step);
    }
  });

  drawGrid();
}
