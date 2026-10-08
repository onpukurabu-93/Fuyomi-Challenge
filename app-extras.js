(function () {
  var KEY = "onpu_member_code";

  function norm(s) {
    return String(s || "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, "");
  }
  function getSaved() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
  function setSaved(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function clearSaved() { try { localStorage.removeItem(KEY); } catch (e) {} }

  function loadCodes() {
    return fetch("codes.txt?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("load"); return r.text(); })
      .then(function (t) {
        return t.split(/\r?\n/)
          .map(function (l) { return l.trim(); })
          .filter(function (l) { return l && l.charAt(0) !== "#"; })
          .map(norm);
      });
  }

  /* あいことばの画面 */
  var box = document.createElement("div");
  box.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;background:#fdf8ed;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;";
  box.innerHTML =
    '<div style="width:100%;max-width:340px;text-align:center;color:#5b4636;">' +
    '<div style="font-size:26px;font-weight:800;margin-bottom:8px;">🎹 ふよみチャレンジ</div>' +
    '<div id="gateMsg" style="font-size:14px;color:#806c5a;min-height:42px;margin-bottom:10px;">かくにん中…</div>' +
    '<div id="gateForm" style="display:none;">' +
    '<input id="gateInput" type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="あいことば" style="width:100%;padding:12px;font-size:18px;border:2px solid #eadcc8;border-radius:12px;text-align:center;background:#fff;color:#5b4636;box-sizing:border-box;-webkit-user-select:text;user-select:text;">' +
    '<button id="gateBtn" style="width:100%;margin-top:10px;padding:14px;font-size:18px;font-weight:800;border:none;border-radius:14px;background:#ff7043;color:#fff;">はじめる</button>' +
    '</div></div>';
  document.body.appendChild(box);

  var msgEl = document.getElementById("gateMsg");
  var formEl = document.getElementById("gateForm");
  var inputEl = document.getElementById("gateInput");
  var btnEl = document.getElementById("gateBtn");

  function showForm(msg) {
    msgEl.textContent = msg;
    formEl.style.display = "block";
    box.style.display = "flex";
  }
  function openApp() { box.style.display = "none"; }

  function tryCode(code, fromUser) {
    msgEl.textContent = "かくにん中…";
    loadCodes().then(function (list) {
      if (list.indexOf(norm(code)) !== -1) {
        setSaved(norm(code));
        openApp();
      } else {
        clearSaved();
        showForm(fromUser
          ? "あいことばが ちがうよ。もういちど いれてね"
          : "あいことばが つかえなくなりました。せんせいに きいてね");
      }
    }).catch(function () {
      /* ネットが不安定でも、前に入れた人は使える */
      if (getSaved() && !fromUser) { openApp(); }
      else { showForm("ネットに つながって いないよ。つないでから もういちど ためしてね"); }
    });
  }

  btnEl.addEventListener("click", function () {
    if (!norm(inputEl.value)) return;
    tryCode(inputEl.value, true);
  });
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") btnEl.click();
  });

  var saved = getSaved();
  if (saved) { tryCode(saved, false); } else { showForm("あいことばを いれてね"); }

  /* 同じカードが続けて出ないようにする */
  window.showRandomTrainingQuestion = function () {
    if (trainingCorrectCount >= targetValue) { showResultScreen(); return; }
    document.getElementById("qCountBadge").textContent = "あと " + (targetValue - trainingCorrectCount) + " 問";

    var prev = (lastTrainingIndex >= 0 && currentCards[lastTrainingIndex]) ? currentCards[lastTrainingIndex].id : null;
    var pool = [];
    currentCards.forEach(function (c, i) { if (c.id !== prev) pool.push(i); });
    if (!pool.length) { currentCards.forEach(function (c, i) { pool.push(i); }); }

    var nextIdx = pool[Math.floor(Math.random() * pool.length)];
    lastTrainingIndex = nextIdx;
    currentIndex = nextIdx;
    trainingLocked = false;
    showCurrentCard();
  };

  /* 画像を先に読み込んでおく */
  setTimeout(function () {
    var seen = {};
    function add(list) {
      (list || []).forEach(function (c) {
        if (c && c.img && !seen[c.img]) { seen[c.img] = 1; new Image().src = c.img; }
      });
    }
    try {
      add(doCards);
      [1, 2, 3, 4, 5].forEach(function (n) { add(trebleCards[n]); add(bassCards[n]); add(allCards[n]); });
      new Image().src = "level_start.png";
    } catch (e) {}
  }, 800);
})();

