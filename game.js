// Neon Snake — built by an AI agent from one prompt.
// Controls: Arrow keys or WASD. P pauses. Enter/Space restarts.
// ?demo=1 runs a deterministic self-playing AI (seeded RNG) for capture.
(function () {
  'use strict';

  var COLS = 24, ROWS = 24;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var CELL = canvas.width / COLS;

  var scoreEl = document.getElementById('score');
  var speedEl = document.getElementById('speed');
  var bestEl = document.getElementById('best');
  var startScreen = document.getElementById('startScreen');
  var overScreen = document.getElementById('overScreen');
  var finalScore = document.getElementById('finalScore');
  var finalBest = document.getElementById('finalBest');
  var finalLen = document.getElementById('finalLen');
  var demoTag = document.getElementById('demoTag');

  var params = new URLSearchParams(location.search);
  var DEMO = params.get('demo') === '1';

  // --- deterministic RNG (mulberry32) so demo captures are reproducible ---
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rng = DEMO ? mulberry32(20261123) : Math.random;

  var snake, dir, dirQueue, food, score, best, speed, alive, paused, lastTick, acc;
  var foods = 0;       // foods eaten — drives the speed ramp
  var BASE_MS = 130;   // ms per step at start
  var MIN_MS = 55;     // fastest step
  var STEP_MS = 5;     // ms faster per food eaten

  try { best = parseInt(localStorage.getItem('neonSnakeBest') || '0', 10) || 0; }
  catch (e) { best = 0; }

  function cellKey(x, y) { return x + ',' + y; }

  function reset() {
    var cx = Math.floor(COLS / 2), cy = Math.floor(ROWS / 2);
    snake = [
      { x: cx, y: cy },
      { x: cx - 1, y: cy },
      { x: cx - 2, y: cy }
    ];
    dir = { x: 1, y: 0 };
    dirQueue = [];
    score = 0;
    foods = 0;
    speed = 1;
    alive = true;
    paused = false;
    acc = 0;
    lastTick = performance.now();
    placeFood();
    updateHud();
  }

  function stepMs() {
    return Math.max(MIN_MS, BASE_MS - foods * STEP_MS);
  }

  function placeFood() {
    var occupied = {};
    for (var i = 0; i < snake.length; i++) occupied[cellKey(snake[i].x, snake[i].y)] = true;
    var free = [];
    for (var x = 0; x < COLS; x++)
      for (var y = 0; y < ROWS; y++)
        if (!occupied[cellKey(x, y)]) free.push({ x: x, y: y });
    if (!free.length) { gameOver(true); return; }
    food = free[Math.floor(rng() * free.length)];
  }

  function updateHud() {
    scoreEl.textContent = score;
    speedEl.textContent = (BASE_MS / stepMs()).toFixed(1) + '×';
    bestEl.textContent = Math.max(best, score);
  }

  function setDir(x, y) {
    var last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
    if (last.x === -x && last.y === -y) return; // no reversing
    if (last.x === x && last.y === y) return;
    if (dirQueue.length < 3) dirQueue.push({ x: x, y: y });
  }

  function tick() {
    if (!alive || paused) return;
    if (DEMO) dir = aiDir();
    else if (dirQueue.length) dir = dirQueue.shift();

    var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // walls
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) { gameOver(false); return; }
    // self (tail cell frees up unless we are about to eat)
    var eating = food && head.x === food.x && head.y === food.y;
    for (var i = 0; i < snake.length - (eating ? 0 : 1); i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) { gameOver(false); return; }
    }

    snake.unshift(head);
    if (eating) {
      score += 10;
      foods += 1;
      speed = BASE_MS / stepMs();
      if (score > best) {
        best = score;
        try { localStorage.setItem('neonSnakeBest', String(best)); } catch (e) {}
      }
      placeFood();
      updateHud();
    } else {
      snake.pop();
    }
  }

  // --- demo AI: chase food, never step into a wall or the body ---
  function aiDir() {
    var head = snake[0];
    var cands = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
    ];
    var safe = [];
    for (var i = 0; i < cands.length; i++) {
      var d = cands[i];
      if (d.x === -dir.x && d.y === -dir.y) continue;
      var nx = head.x + d.x, ny = head.y + d.y;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      var hit = false;
      for (var j = 0; j < snake.length - 1; j++) {
        if (snake[j].x === nx && snake[j].y === ny) { hit = true; break; }
      }
      if (!hit) safe.push(d);
    }
    if (!safe.length) return dir; // doomed; keep going
    var bestD = safe[0], bestScore = Infinity;
    for (var k = 0; k < safe.length; k++) {
      var d2 = safe[k];
      var dist = Math.abs(head.x + d2.x - food.x) + Math.abs(head.y + d2.y - food.y);
      // prefer moves that keep the most open space around the new head
      var room = 0;
      var nn = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var m = 0; m < nn.length; m++) {
        var ax = head.x + d2.x + nn[m][0], ay = head.y + d2.y + nn[m][1];
        if (ax < 0 || ay < 0 || ax >= COLS || ay >= ROWS) continue;
        var blocked = false;
        for (var n = 0; n < snake.length - 1; n++) {
          if (snake[n].x === ax && snake[n].y === ay) { blocked = true; break; }
        }
        if (!blocked) room++;
      }
      var s = dist * 10 - room;
      if (s < bestScore) { bestScore = s; bestD = d2; }
    }
    return bestD;
  }

  function gameOver(won) {
    alive = false;
    finalScore.textContent = score;
    finalBest.textContent = Math.max(best, score);
    finalLen.textContent = snake.length;
    overScreen.style.display = 'flex';
    if (DEMO) {
      // demo mode: auto-restart after a beat so capture keeps running
      setTimeout(function () {
        overScreen.style.display = 'none';
        reset();
      }, 1200);
    }
  }

  function start() {
    startScreen.style.display = 'none';
    overScreen.style.display = 'none';
    reset();
  }

  // --- rendering ---
  function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 1; i < COLS; i++) {
      ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height);
      ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL);
    }
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    // food: pulsing magenta orb
    if (food) {
      var pulse = 0.75 + 0.25 * Math.sin(performance.now() / 130);
      var fx = food.x * CELL + CELL / 2, fy = food.y * CELL + CELL / 2;
      var r = CELL * 0.32 * pulse;
      var g = ctx.createRadialGradient(fx, fy, 1, fx, fy, r * 2.2);
      g.addColorStop(0, 'rgba(255, 93, 242, 0.9)');
      g.addColorStop(0.45, 'rgba(255, 46, 99, 0.55)');
      g.addColorStop(1, 'rgba(255, 46, 99, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(fx, fy, r * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff5df2';
      ctx.shadowColor = '#ff2e63'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // snake: head bright green, body fading cyan with glow
    for (var i = snake.length - 1; i >= 0; i--) {
      var s = snake[i];
      var t = i / Math.max(1, snake.length - 1);
      var hue = 150 - t * 55; // green -> cyan
      var px = s.x * CELL, py = s.y * CELL, pad = 1.5;
      ctx.fillStyle = i === 0 ? '#baffce' : 'hsl(' + hue + ', 100%, ' + (58 - t * 14) + '%)';
      ctx.shadowColor = i === 0 ? '#39ff88' : '#00e5ff';
      ctx.shadowBlur = i === 0 ? 22 : 12;
      roundRect(px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, 7);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // eyes on the head
    var h = snake[0];
    var hx = h.x * CELL + CELL / 2, hy = h.y * CELL + CELL / 2;
    var ex = dir.x * CELL * 0.16, ey = dir.y * CELL * 0.16;
    var perpX = -dir.y * CELL * 0.16, perpY = dir.x * CELL * 0.16;
    ctx.fillStyle = '#04140b';
    ctx.beginPath(); ctx.arc(hx + ex + perpX, hy + ey + perpY, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + ex - perpX, hy + ey - perpY, 3.4, 0, Math.PI * 2); ctx.fill();

    if (paused && alive) {
      ctx.fillStyle = 'rgba(5,5,16,0.65)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffe14d';
      ctx.font = 'bold 44px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function loop(now) {
    var dt = now - lastTick;
    lastTick = now;
    if (alive && !paused) {
      acc += dt;
      var ms = stepMs();
      while (acc >= ms) { acc -= ms; tick(); if (!alive) { acc = 0; break; } }
    }
    draw();
    requestAnimationFrame(loop);
  }

  // --- input ---
  var KEYS = {
    ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 }
  };
  document.addEventListener('keydown', function (e) {
    if (KEYS[e.code]) {
      e.preventDefault();
      if (alive && !paused) setDir(KEYS[e.code].x, KEYS[e.code].y);
      return;
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (!alive || startScreen.style.display !== 'none') start();
    }
    if (e.code === 'KeyP' && alive) paused = !paused;
  });
  document.getElementById('startBtn').addEventListener('click', start);
  document.getElementById('againBtn').addEventListener('click', start);

  // --- boot ---
  reset();
  if (DEMO) {
    demoTag.style.display = 'block';
    startScreen.style.display = 'none';
  }
  requestAnimationFrame(loop);
})();
