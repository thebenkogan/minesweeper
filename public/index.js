"use strict";
const div = document.getElementById("minesweeper");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const bombImage = document.getElementById("bomb");
const flagImage = document.getElementById("flag");
const width = div.clientWidth;
const height = div.clientHeight;
canvas.width = width;
canvas.height = height;
const cols = 30;
const step = width / cols;
const rows = Math.floor(height / step);
ctx.font = `${step - 5}px sans-serif`;
const numColorMap = new Map([
    [1, "#334FFF"],
    [2, "#129E16"],
    [3, "#CA2D17"],
    [4, "#B217CA"],
    [5, "#DC9117"],
    [6, "#17DCD9"],
    [7, "#020707"],
    [8, "#919191"],
]);
function stringToPos(pos) {
    return pos.split("_").map((s) => parseInt(s));
}
function posToString([x, y]) {
    return `${x}_${y}`;
}
function getRandomPos() {
    return [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)];
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
function randomSetup(bombs) {
    const setup = new Map(); // top left coordinate to tile
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
        while (setup.get(posToString(minePos)).bomb) {
            minePos = getRandomPos();
        }
        const tile = setup.get(posToString(minePos));
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x == 0 && y == 0) {
                    tile.bomb = true;
                }
                else {
                    const offsetPos = posToString([minePos[0] + x, minePos[1] + y]);
                    if (setup.has(offsetPos)) {
                        setup.get(offsetPos).num++;
                    }
                }
            }
        }
    }
    return setup;
}
let firstClick = true;
let bombCount = Math.floor((cols * rows) / 5);
let tiles = randomSetup(bombCount);
//tiles.forEach((tile: Tile, _) => {
//  tile.revealed = true;
//});
drawGame(false);
// Reveals the tile at 'pos' and all of its neighbors. Repeats for all
// neighbors that are also empty. Optionally pass in 'revealed' map for
// all empty tiles that have already been revealed in this flood.
function revealFlood([tileX, tileY], revealed = new Map()) {
    revealed.set(posToString([tileX, tileY]), true);
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            const pos = [tileX + x, tileY + y];
            if (tiles.has(posToString(pos))) {
                const tile = tiles.get(posToString(pos));
                if (tile.num == 0 && !revealed.has(posToString(pos))) {
                    revealFlood(pos, (revealed = revealed));
                }
                else {
                    tile.revealed = true;
                }
            }
        }
    }
}
// Mouse Down Listener
canvas.addEventListener("mousedown", (e) => {
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
    const tile = tiles.get(posToString(pos));
    const alt = e.button == 2;
    handleClick(tile, pos, alt);
});
function handleClick(tile, pos, alt) {
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
        }
        else {
            if (tile.num == 0) {
                revealFlood(pos);
            }
            else {
                tile.revealed = true;
            }
        }
    }
    else {
        tile.flagged = true;
    }
    drawGame(gameOver);
}
function handleFirstClick() { }
function drawGame(gameOver) {
    // Clear previous board and redraw grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    if (gameOver) {
        console.log("game over");
    }
    tiles.forEach((tile, pos) => {
        const [x, y] = stringToPos(pos);
        if (tile.revealed || tile.flagged) {
            if (tile.flagged) {
                ctx.drawImage(flagImage, step * x + 5, step * y + 5, step - 10, step - 10);
            }
            else if (tile.bomb) {
                ctx.drawImage(bombImage, step * x + 5, step * y + 5, step - 10, step - 10);
            }
            else if (tile.num) {
                const num = tile.num == 0 ? "" : `${tile.num}`;
                ctx.fillStyle = numColorMap.get(tile.num) || "#FFFFFF";
                ctx.fillText(num, step * x + step / 4, step + step * y - step / 5);
            }
        }
    });
}
