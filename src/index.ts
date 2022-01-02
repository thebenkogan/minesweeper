const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const windowLength = 600;
canvas.width = windowLength;
canvas.height = windowLength;

const step = 40;
const rows = windowLength / step;
const cols = windowLength / step;

// Mouse Down Listener
canvas.addEventListener("mousedown", (e: MouseEvent) => {
  const rect = canvas.getBoundingClientRect(); // Measure relative to canvas bounds
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  console.log("x: " + x + " y: " + y);
});

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

// Draw Grid and Register Tiles
const tiles = new Map<string, number>();
for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    ctx.strokeRect(i * step, j * step, step, step);
    //const tile = new Tile();
  }
}
ctx.lineWidth = 5;
ctx.strokeRect(0, 0, windowLength, windowLength);
