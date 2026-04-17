import { playSlot } from "../api.js";

let bet = 50;
let auto = false;
let turbo = false;
let spinning = false;

export function Slot() {
  return `
  <div id="slot-machine">

    <div id="controls">
      <button onclick="changeBet(-10)">➖</button>
      <span id="bet">Bet: ${bet}</span>
      <button onclick="changeBet(10)">➕</button>
    </div>

    <div class="reel-wrapper">
      <div class="reel" id="reel1"></div>
      <div class="reel" id="reel2"></div>
      <div class="reel" id="reel3"></div>
    </div>

    <button class="spin-btn" onclick="spin()">🎰 SPIN</button>
    <button onclick="toggleAuto()">🔁 AUTO</button>
    <button onclick="toggleTurbo()">⚡ TURBO</button>

    <div id="balance">Balance: 0</div>

    <canvas id="coins"></canvas>
  </div>
  `;
}

const symbols = ["🍒","🍋","💎","7️⃣"];

function createStrip() {
  let strip = "";
  for (let i = 0; i < 25; i++) {
    const s = symbols[Math.floor(Math.random()*symbols.length)];
    strip += `<div class="symbol">${s}</div>`;
  }
  return strip;
}

function animateReel(el, duration, delay, finalSymbol) {
  return new Promise(resolve => {
    el.classList.add("blur");

    setTimeout(() => {
      el.classList.remove("blur");

      el.innerHTML = `
        <div class="symbol">${finalSymbol}</div>
        <div class="symbol">${finalSymbol}</div>
        <div class="symbol">${finalSymbol}</div>
      `;

      el.style.transform = "translateY(-80px)";
      el.classList.add("bounce");

      setTimeout(() => {
        el.classList.remove("bounce");
        resolve();
      }, 300);

    }, duration + delay);
  });
}

// 🎮 CONTROLS
window.toggleTurbo = () => {
  turbo = !turbo;
  alert("Turbo: " + (turbo ? "ON ⚡" : "OFF"));
};

window.toggleAuto = () => {
  auto = !auto;
  alert("Auto Spin: " + (auto ? "ON 🔁" : "OFF"));
};

window.changeBet = (val) => {
  bet = Math.max(10, bet + val);
  document.getElementById("bet").innerText = "Bet: " + bet;
};

// 🎰 MAIN SPIN
window.spin = async function () {

  if (spinning) return; // 🔒 prevent spam
  spinning = true;

  const reel1 = document.getElementById("reel1");
  const reel2 = document.getElementById("reel2");
  const reel3 = document.getElementById("reel3");

  [reel1, reel2, reel3].forEach(el => {
    el.innerHTML = createStrip();
  });

  new Audio("assets/sounds/spin.mp3").play();

  try {
    const data = await playSlot();

    const speed = turbo ? 500 : 1200;

    await Promise.all([
      animateReel(reel1, speed, 0, data.reels[0]),
      animateReel(reel2, speed, 200, data.reels[1]),
      animateReel(reel3, speed, 400, data.reels[2]),
    ]);

    if (data.win) {
      coinRain();

      if (data.reels.every(r => r === "7️⃣")) {
        new Audio("assets/sounds/jackpot.mp3").play();
      } else {
        new Audio("assets/sounds/win.mp3").play();
      }
    } else {
      new Audio("assets/sounds/lose.mp3").play();
    }

    document.getElementById("balance").innerText =
      "Balance: " + data.balance;

  } catch (err) {
    console.error(err);
    alert("Server error ⚠️");
  }

  spinning = false;

  if (auto) setTimeout(spin, turbo ? 500 : 1200);
};

// 💰 COIN RAIN
function coinRain() {
  const canvas = document.getElementById("coins");
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let coins = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: Math.random() * 5 + 2
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    coins.forEach(c => {
      ctx.fillText("💰", c.x, c.y);
      c.y += c.speed;
      if (c.y > canvas.height) c.y = 0;
    });

    requestAnimationFrame(draw);
  }

  draw();

  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 2000);
    }
