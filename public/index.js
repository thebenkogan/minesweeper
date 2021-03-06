"use strict";
const div = document.getElementById("minesweeper");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const bombImage = document.getElementById("bomb");
const flagImage = document.getElementById("flag");
const primaryColor = "#A9A9A9"; // revealed tiles
const secondaryColor = "#C0C0C0"; // unrevealed tiles and flag background
const bombBG = "#F50114"; // bomb background
const winColor = "#0EF11B";
const width = div.clientWidth;
const height = div.clientHeight;
canvas.width = width;
canvas.height = height;
// get grid and border dimensions
let cols = 25; // temp column count
let rows = 25; // temp row count
const Xstep = width / cols;
const Ystep = height / rows;
const step = (Xstep + Ystep) / 2;
const hb = (width % step) / 2; // horizontal border width
const vb = (height % step) / 2; // vertical border width
cols = Math.floor(width / step);
rows = Math.floor(height / step);
// draw border and fill blank color
ctx.fillStyle = "red";
ctx.fillRect(0, 0, hb, height);
ctx.fillRect(width - hb, 0, hb, height);
ctx.fillRect(0, 0, width, vb);
ctx.fillRect(0, height - vb, width, vb);
// const cols = 10;
// const step = width / cols;
// const rows = Math.floor(height / step);
// const gridWidth = cols * step;
// const gridHeight = rows * step;
const bombCount = Math.floor((cols * rows) / 6);
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
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    for (let i = 0; i < rows; i++) {
        ctx.beginPath();
        ctx.moveTo(hb, vb + i * step);
        ctx.lineTo(width - hb, vb + i * step);
        ctx.stroke();
    }
    for (let i = 0; i < cols; i++) {
        ctx.beginPath();
        ctx.moveTo(hb + i * step, vb);
        ctx.lineTo(hb + i * step, height - vb);
        ctx.stroke();
    }
}
function drawTempBG() {
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(hb, vb, width - 2 * hb, height - 2 * vb);
}
function randomSetup(bombs, [firstX, firstY]) {
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
    // Determine bombs and numbers
    for (let i = 0; i < bombs; i++) {
        let minePos = getRandomPos();
        while (setup.get(posToString(minePos)).bomb ||
            (Math.abs(minePos[0] - firstX) <= 1 && Math.abs(minePos[1] - firstY) <= 1)) {
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
    tiles = setup;
    revealFlood([firstX, firstY]);
}
// Initial Setup
let replay = false;
let firstClick = true;
let tiles;
drawTempBG();
drawGrid();
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
                    tile.flagged = false;
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
    if (replay) {
        replay = false;
        firstClick = true;
        ctx.clearRect(hb, vb, width - 2 * hb, height - 2 * vb);
        drawTempBG();
        drawGrid();
        return;
    }
    const rect = canvas.getBoundingClientRect(); // Measure relative to canvas bounds
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let pos = [(x - hb) / step, (y - vb) / step].map(Math.floor);
    if (x < hb || x > width - hb || y < vb || y > height - vb)
        return;
    if (firstClick) {
        randomSetup(bombCount, pos);
        drawGame(false);
        firstClick = false;
    }
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
function revealAll() {
    tiles.forEach((tile, _) => {
        tile.revealed = true;
    });
}
function checkWin() {
    let revealed = 0;
    tiles.forEach((tile, _) => {
        if (tile.revealed) {
            revealed++;
        }
    });
    if (cols * rows - revealed == bombCount) {
        return true;
    }
}
function drawGame(gameOver) {
    // Clear previous board
    ctx.clearRect(hb, vb, width - 2 * hb, height - 2 * vb);
    if (gameOver) {
        revealAll();
        replay = true;
    }
    if (checkWin()) {
        replay = true;
    }
    const gameWin = replay && !gameOver;
    tiles.forEach((tile, pos) => {
        const [x, y] = stringToPos(pos);
        if (tile.revealed || tile.flagged) {
            if (tile.flagged || tile.bomb) {
                ctx.fillStyle = tile.flagged ? secondaryColor : bombBG;
                if (gameWin && tile.flagged) {
                    ctx.fillStyle = winColor;
                }
                ctx.fillRect(hb + step * x, vb + step * y, step, step);
                ctx.drawImage(tile.flagged ? flagImage : bombImage, hb + step * x + 5, vb + step * y + 5, step - 10, step - 10);
            }
            else {
                ctx.fillStyle = primaryColor;
                ctx.fillRect(hb + step * x, vb + step * y, step, step);
                if (tile.num > 0) {
                    const num = `${tile.num}`;
                    ctx.fillStyle = numColorMap.get(tile.num) || primaryColor;
                    ctx.fillText(num, hb + step * x + step / 4, vb + step + step * y - step / 5);
                }
            }
        }
        else {
            ctx.fillStyle = secondaryColor;
            ctx.fillRect(hb + step * x, vb + step * y, step, step);
        }
    });
    drawGrid();
}
