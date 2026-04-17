import { playSlot } from "../api.js";

export function Slot() {
  return `
  <div id="slot-machine">
    <div class="reel-wrapper">
      <div class="reel" id="reel1"></div>
      <div class="reel" id="reel2"></div>
      <div class="reel" id="reel3"></div>
    </div>

    <button class="spin-btn" onclick="spin()">🎰 SPIN</button>

    <div id="balance">Balance: 0</div>
  </div>
  `;
}

const symbols = ["🍒","🍋","💎","7️⃣"];

function createStrip() {
  let strip = "";
  for (let i = 0; i < 20; i++) {
    const s = symbols[Math.floor(Math.random()*symbols.length)];
    strip += `<div class="symbol">${s}</div>`;
  }
  return strip;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3); // cubic ease-out
}

function animateReel(el, duration, delay, finalSymbol) {
  return new Promise(resolve => {
    const start = performance.now() + delay;
    const totalHeight = 20 * 80; // 20 symbols * 80px each

    function frame(now) {
      if (now < start) return requestAnimationFrame(frame);

      const t = Math.min((now - start) / duration, 1);
      const eased = easeOut(t);

      const y = -eased * totalHeight;
      el.style.transform = `translateY(${y}px)`;

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        // snap to final symbol (center position)
        el.innerHTML = `
          <div class="symbol">${finalSymbol}</div>
          <div class="symbol">${finalSymbol}</div>
          <div class="symbol">${finalSymbol}</div>
        `;
        el.style.transform = `translateY(-80px)`; // center
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

window.spin = async function () {
  // build strips
  ["reel1","reel2","reel3"].forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = createStrip();
    el.style.transform = "translateY(0px)";
  });

  new Audio("assets/sounds/spin.mp3").play();

  // call backend
  const data = await playSlot(); 
  const [r1, r2, r3] = data.reels;

  // animate reels (staggered)
  await Promise.all([
    animateReel(document.getElementById("reel1"), 1000, 0, r1),
    animateReel(document.getElementById("reel2"), 1200, 200, r2),
    animateReel(document.getElementById("reel3"), 1400, 400, r3),
  ]);

  // result effects
  if (data.win) {
    if (r1 === "7️⃣" && r2 === "7️⃣" && r3 === "7️⃣") {
      new Audio("assets/sounds/jackpot.mp3").play();
    } else {
      new Audio("assets/sounds/win.mp3").play();
    }
    document.getElementById("slot-machine").classList.add("win-flash");
  } else {
    new Audio("assets/sounds/lose.mp3").play();
    document.getElementById("slot-machine").classList.remove("win-flash");
  }

  document.getElementById("balance").innerText =
    "Balance: " + data.balance;
};
