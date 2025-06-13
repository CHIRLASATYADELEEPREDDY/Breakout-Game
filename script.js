const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const explosionSound = document.getElementById("explosionSound");
const winMessage = document.getElementById("winMessage");
const gameOverMessage = document.getElementById("gameOverMessage");

let ballRadius = 10;
let x, y, dx, dy;
let paddleHeight = 10;
let paddleWidth = 75;
let paddleX;

let brickRowCount = 6;
let brickColumnCount = 5;
let brickWidth = 115;
let brickHeight = 20;
let brickPadding = 10;
let brickOffsetTop = 30;
let brickOffsetLeft = 80;

let score = 0;
let lives = 1;
let animationId;
let splash = false;
let splashRadius = 0;
let splashX = 0;
let splashY = 0;
let difficulty = 'easy';

const brickColors = ["#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c"];

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = {
      x: 0,
      y: 0,
      status: 1,
      color: brickColors[Math.floor(Math.random() * brickColors.length)]
    };
  }
}

document.addEventListener("mousemove", mouseMoveHandler);
document.addEventListener("touchmove", touchMoveHandler, { passive: false });

function mouseMoveHandler(e) {
  const relativeX = e.clientX - canvas.getBoundingClientRect().left;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}

function touchMoveHandler(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const relativeX = touch.clientX - rect.left;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        b.x = brickX;
        b.y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (
          x > b.x &&
          x < b.x + brickWidth &&
          y > b.y &&
          y < b.y + brickHeight
        ) {
          dy = -dy;
          b.status = 0;
          score++;
          updateInfo();

          if (score === brickRowCount * brickColumnCount) {
            stopGameLoop();
            winMessage.style.display = "block";
            setTimeout(() => {
              showStartMenu();
            }, 2000);
          }
        }
      }
    }
  }
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function stopGameLoop() {
  if (animationId) cancelAnimationFrame(animationId);
}

function drawSplash() {
  ctx.beginPath();
  ctx.arc(splashX, splashY, splashRadius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
  ctx.fill();
  ctx.closePath();
  splashRadius += 5;

  if (splashRadius > 60) {
    splash = false;
    lives--;
    updateInfo();
    stopGameLoop();

    if (lives > 0) {
      setTimeout(() => {
        resetBall();
        draw();
      }, 1000);
    } else {
      gameOverMessage.style.display = "block";
      setTimeout(() => {
        showStartMenu();
      }, 2000);
    }
  } else {
    animationId = requestAnimationFrame(drawSplash);
  }
}

function updateInfo() {
  document.getElementById("info").innerHTML = `
    <span id="scoreDisplay">⭐ Score: ${score}</span> 
    <span id="livesDisplay">💖 Lives: ${lives}</span>
  `;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();

  if (!splash) {
    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
    if (y + dy < ballRadius) dy = -dy;
    else if (y + dy > canvas.height - ballRadius) {
      if (x > paddleX && x < paddleX + paddleWidth) {
        dy = -dy;
      } else {
        explosionSound.currentTime = 0;
        explosionSound.play();
        splash = true;
        splashRadius = 0;
        splashX = x;
        splashY = y;
        stopGameLoop();
        drawSplash();
        return;
      }
    }

    x += dx;
    y += dy;
    animationId = requestAnimationFrame(draw);
  }
}

function resetBall() {
  x = canvas.width / 2;
  y = canvas.height - 30;
  paddleX = (canvas.width - paddleWidth) / 2;
}

function restartGame() {
  winMessage.style.display = "none";
  gameOverMessage.style.display = "none";
  score = 0;
  splash = false;
  splashRadius = 0;

  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r].status = 1;
      bricks[c][r].color = brickColors[Math.floor(Math.random() * brickColors.length)];
    }
  }

  lives = (difficulty === "hard") ? 2 : 1;

  updateInfo();
  resetBall();
  draw();
}

function startGame(level) {
  winMessage.style.display = "none";
  gameOverMessage.style.display = "none";
  difficulty = level;
  document.getElementById("startMenu").style.display = "none";
  document.getElementById("gameCanvas").style.display = "block";
  document.getElementById("info").style.display = "block";

  if (level === "easy") {
    dx = 1;
    dy = -1;
  } else if (level === "medium") {
    dx = 2;
    dy = -2;
  } else if (level === "hard") {
    dx = 3;
    dy = -3;
  }

  restartGame();
}

function showStartMenu() {
  stopGameLoop();
  document.getElementById("startMenu").style.display = "block";
  document.getElementById("gameCanvas").style.display = "none";
  document.getElementById("info").style.display = "none";

  // 🔁 Hide messages when returning to menu
  document.getElementById("winMessage").style.display = "none";
  document.getElementById("gameOverMessage").style.display = "none";
}
