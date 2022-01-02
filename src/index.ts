let canvas = document.getElementById("canvas") as HTMLCanvasElement;
let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

canvas.width = 600;
canvas.height = 600;

ctx.fillText("hello world", 200, 200);
