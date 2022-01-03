"use strict";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const windowLength = 600;
canvas.width = windowLength;
canvas.height = windowLength;
const step = 40;
const rows = Math.floor(windowLength / step);
const cols = Math.floor(windowLength / step);
function getRandomPos() {
    return [Math.floor(Math.random() * cols), Math.floor(Math.random() * rows)];
}
// Mouse Down Listener
canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect(); // Measure relative to canvas bounds
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    //const tile: Tile = tiles.get([x / step, y / step].map(Math.floor));
});
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
    const tiles = new Map(); // top left coordinate to tile
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            tiles.set([i, j], {
                revealed: false,
                bomb: false,
                flagged: false,
                num: 0,
            });
        }
    }
    for (let i = 0; i < bombs; i++) {
        let minePos = getRandomPos();
        while (tiles.get(minePos).bomb) {
            minePos = getRandomPos();
        }
        const tile = tiles.get(minePos);
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x == 0 && y == 0) {
                    tile.bomb = true;
                }
                else {
                    const offsetPos = [minePos[0] + x, minePos[1] + y];
                    if (tiles.has(offsetPos)) {
                        tiles.get(offsetPos).num++;
                    }
                }
            }
        }
    }
    return tiles;
}
