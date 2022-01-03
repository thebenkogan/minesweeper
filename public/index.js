"use strict";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const windowLength = 600;
canvas.width = windowLength;
canvas.height = windowLength;
const step = 40;
const rows = Math.floor(windowLength / step);
const cols = Math.floor(windowLength / step);
let bombCount = 50;
function getRandomPos() {
    return [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)];
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
function randomSetup(bombs) {
    const setup = new Map(); // top left coordinate to tile
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
        while (setup.get(minePos).bomb) {
            minePos = getRandomPos();
        }
        const tile = setup.get(minePos);
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x == 0 && y == 0) {
                    tile.bomb = true;
                }
                else {
                    const offsetPos = [minePos[0] + x, minePos[1] + y];
                    if (setup.has(offsetPos)) {
                        setup.get(offsetPos).num++;
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
let tiles = randomSetup(bombCount);
// Mouse Down Listener
canvas.addEventListener("mousedown", (e) => {
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
    const tile = tiles.get(pos);
    const alt = e.button == 2;
    handleClick(tile, alt);
});
function handleClick(tile, alt) {
    if (tile.revealed) {
        return;
    }
    let gameOver = false;
    if (tile.flagged) {
        tile.flagged = !tile.flagged;
    }
    else if (!alt) {
        if (tile.bomb) {
            gameOver = true;
        }
        else {
            tile.revealed = true;
        }
    }
    else {
        tile.flagged = true;
    }
}
