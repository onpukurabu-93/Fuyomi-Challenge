(function () {
  /* ★ マスター音声を、ファンファーレのはじまりから何ミリ秒後に鳴らすか（4000 = 4秒） */
  var MASTER_DELAY_MS = 4000;

  var MAP_KEY = "onpu_code_slots";
  var cancelable = false;
  var pending = null;

  function norm(s) {
    return String(s || "").normalize("NFKC").trim().toLowerCase().replace(/\s+/g, "");
  }
  function getMap() {
    try { return JSON.parse(localStorage.getItem(MAP_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function setMap(m) {
    try { localStorage.setItem(MAP_KEY, JSON.stringify(m)); } catch (e) {}
  }
  function codeOfSlot(slot) {
    var m = getMap();
    for (var c in m) { if (m[c] === slot) return c; }
    return "";
  }

  function loadCodes() {
    return fetch("codes.txt?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("load"); return r.text(); })
      .then(function (t) {
        return t.split(/\r?\n/)
          .map(function (l) { return l.trim(); })
          .filter(function (l) { return l && l.charAt(0) !== "#"; })
          .map(function (l) { return norm(l.split(",")[0]); });
      });
  }

  /* 名前のチェック（ひらがな・すうじ・ー、8もじまで） */
  function cleanName(raw) {
    return String(raw || "").normalize("NFKC").trim();
  }
  function nameError(s) {
    if (!s || !/^[\u3040-\u309F\u30FC0-9]+$/.test(s)) return "なまえは、ひらがなと すうじだけで いれてね";
    if (s.length > 8) return "なまえは、8もじまでだよ";
    return "";
  }

  function registeredCount() {
    var n = 0;
    for (var i = 0; i < profiles.length; i++) { if (isRegistered(i)) n++; }
    return n;
  }

  /* ===== あいことば・なまえの画面 ===== */
  var inputStyle = "width:100%;padding:12px;font-size:18px;border:2px solid #eadcc8;border-radius:12px;text-align:center;background:#fff;color:#5b4636;box-sizing:border-box;-webkit-user-select:text;user-select:text;";
  var btnStyle = "width:100%;margin-top:10px;padding:14px;font-size:18px;font-weight:800;border:none;border-radius:14px;color:#fff;";

  var box = document.createElement("div");
  box.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:10000;background:#fdf8ed;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;";
  box.innerHTML =
    '<div style="width:100%;max-width:340px;text-align:center;color:#5b4636;">' +
    '<div style="font-size:26px;font-weight:800;margin-bottom:8px;">🎹 ふよみチャレンジ</div>' +
    '<div id="gateMsg" style="font-size:14px;color:#806c5a;min-height:42px;margin-bottom:10px;line-height:1.5;white-space:pre-line;">かくにん中…</div>' +

    '<div id="gateCodeForm" style="display:none;">' +
    '<input id="gateInput" type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="あいことば" style="' + inputStyle + '">' +
    '<button id="gateBtn" style="' + btnStyle + 'background:#ff7043;">はじめる</button>' +
    '<button id="gateCancel" style="' + btnStyle + 'background:#bdbdbd;font-size:15px;padding:10px;display:none;">やめる</button>' +
    '</div>' +

    '<div id="gateNickForm" style="display:none;">' +
    '<input id="gateNick" type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="8" placeholder="きょうしつネーム" style="' + inputStyle + '">' +
    '<button id="gateNickBtn" style="' + btnStyle + 'background:#ff7043;">つぎへ</button>' +
    '</div>' +

    '<div id="gateConfirmForm" style="display:none;">' +
    '<div id="gateConfirmName" style="font-size:28px;font-weight:900;color:#5b4636;margin:6px 0 4px;word-break:break-all;"></div>' +
    '<button id="gateOk" style="' + btnStyle + 'background:#ff7043;">これで OK！</button>' +
    '<button id="gateBack" style="' + btnStyle + 'background:#bdbdbd;font-size:15px;padding:10px;">なおす</button>' +
    '</div>' +
    '</div>';
  document.body.appendChild(box);

  var msgEl = document.getElementById("gateMsg");
  var codeForm = document.getElementById("gateCodeForm");
  var nickForm = document.getElementById("gateNickForm");
  var confirmForm = document.getElementById("gateConfirmForm");
  var codeInput = document.getElementById("gateInput");
  var nickInput = document.getElementById("gateNick");
  var cancelBtn = document.getElementById("gateCancel");

  function setMsg(text, isErr) {
    msgEl.textContent = text;
    msgEl.style.color = isErr ? "#d84315" : "#806c5a";
  }
  function show(which) {
    codeForm.style.display = (which === "code") ? "block" : "none";
    nickForm.style.display = (which === "nick") ? "block" : "none";
    confirmForm.style.display = (which === "confirm") ? "block" : "none";
    box.style.display = "flex";
  }
  function showCode(text, isErr) {
    setMsg(text, isErr);
    cancelBtn.style.display = cancelable ? "block" : "none";
    show("code");
  }
  function openApp() {
    cancelable = false;
    box.style.display = "none";
  }

  /* 今のプレイヤーを切り替える */
  function switchTo(slot) {
    activeProfileIndex = slot;
    Storage.set("onpu_active_profile", slot);
    initProfiles();
  }

  function tryCode(code, fromUser) {
    var c = norm(code);
    setMsg("かくにん中…", false);
    show("none");
    loadCodes().then(function (list) {
      if (list.indexOf(c) !== -1) {
        var map = getMap();
        if (map[c] !== undefined && isRegistered(map[c])) {
          switchTo(map[c]);
          openApp();
        } else {
          pending = { code: c, name: "" };
          nickInput.value = "";
          setMsg("せんせいと きめた「きょうしつネーム」を そのまま いれてね。\nあとで かえられないよ", false);
          show("nick");
        }
      } else {
        if (fromUser) {
          showCode("あいことばが ちがうよ。もういちど いれてね", true);
        } else {
          cancelable = false;
          showCode("あいことばが つかえなくなりました。せんせいに きいてね", true);
        }
      }
    }).catch(function () {
      var m = getMap();
      if (!fromUser && m[c] !== undefined && isRegistered(m[c])) {
        openApp();
      } else {
        showCode("ネットに つながって いないよ。つないでから もういちど ためしてね", true);
      }
    });
  }

  document.getElementById("gateBtn").addEventListener("click", function () {
    if (!norm(codeInput.value)) return;
    tryCode(codeInput.value, true);
  });
  codeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.isComposing) document.getElementById("gateBtn").click();
  });
  cancelBtn.addEventListener("click", function () {
    cancelable = false;
    box.style.display = "none";
  });

  /* 教室ネームを入れる → 確認 */
  document.getElementById("gateNickBtn").addEventListener("click", function () {
    var s = cleanName(nickInput.value);
    var err = nameError(s);
    if (err) { setMsg(err, true); return; }
    for (var i = 0; i < profiles.length; i++) {
      if (isRegistered(i) && profiles[i] === s) {
        setMsg("おなじ なまえが この たんまつに あるよ。せんせいに きいてね", true);
        return;
      }
    }
    pending.name = s;
    document.getElementById("gateConfirmName").textContent = s;
    setMsg("この なまえで いい？\nあとで かえられないよ", false);
    show("confirm");
  });
  nickInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.isComposing) document.getElementById("gateNickBtn").click();
  });
  document.getElementById("gateBack").addEventListener("click", function () {
    setMsg("きょうしつネームを いれなおしてね", false);
    show("nick");
  });

  /* 確認OK → とうろく（枠は3つまで） */
  document.getElementById("gateOk").addEventListener("click", function () {
    if (!pending || !pending.name) return;
    var slot = 0;
    while (slot < 3 && isRegistered(slot)) slot++;
    if (slot >= 3) {
      pending = null;
      cancelable = false;
      showCode("この たんまつは、3人まで とうろくできるよ。せんせいに きいてね", true);
      return;
    }
    while (profiles.length <= slot) profiles.push("");
    profiles[slot] = pending.name;
    Storage.set("onpu_profiles", profiles);
    Storage.set("onpu_category_" + slot, "年少");
    Storage.set("onpu_pin_" + slot, "0000");
    Storage.set("onpu_registered_" + slot, true);
    var map = getMap();
    map[pending.code] = slot;
    setMap(map);
    pending = null;
    switchTo(slot);
    openApp();
  });

  /* ===== 画面まわりの書きかえ ===== */

  /* 2人以上のときだけ、プレイヤー選択とスタートを出す */
  function updateSwitcherVisibility() {
    try {
      var wrap = document.querySelector(".profile-select-wrap");
      var label = document.querySelector(".profile-label");
      var multi = registeredCount() >= 2;
      if (wrap) wrap.style.display = multi ? "flex" : "none";
      if (label) label.style.display = multi ? "block" : "none";
      var regBtn = document.querySelector(".reg-open-btn");
      if (regBtn) {
        regBtn.textContent = "➕ プレイヤーを ふやす";
        regBtn.style.cssText = "background:transparent;border:none;color:#b0a090;font-size:11px;font-weight:600;cursor:pointer;width:100%;margin-bottom:4px;padding:2px;text-decoration:underline;";
      }
    } catch (e) {}
  }

  /* 名前の横の学年を出さない */
  var origInit = window.initProfiles;
  window.initProfiles = function () {
    origInit.apply(this, arguments);
    try {
      var sel = document.getElementById("profileSelect");
      Array.prototype.forEach.call(sel.options, function (o) {
        var i = parseInt(o.value, 10);
        if (!isNaN(i) && profiles[i]) o.textContent = legendMark(i) + profiles[i];
      });
    } catch (e) {}
    updateSwitcherVisibility();
  };

  /* 「プレイヤーを ふやす」 → あいことばの画面 */
  window.openRegistration = function () {
    cancelable = true;
    codeInput.value = "";
    showCode("ふえる プレイヤーの あいことばを いれてね", false);
  };

  /* プレイヤーを切りかえたとき、そのあいことばが まだ使えるか確かめる */
  var origSwitch = window.switchProfile;
  window.switchProfile = function (idx) {
    origSwitch(idx);
    var c = codeOfSlot(idx);
    if (c) tryCode(c, false);
  };

  /* ===== 音の順番：すごい！ → ファンファーレ → （4秒後に）toon / heon / 6do ===== */
  var origPlay = window.playAudioCloned;
  var lastSugoiAt = 0;
  var seqEndAt = 0;
  var delayedTimers = [];
  var unlockTimer = null;
  var DELAYED = { audioToon1: 1, audioToon2: 1, audioHeon1: 1, audioHeon2: 1, audio6do: 1 };

  window.playAudioCloned = function (id) {
    if (id === "sugoiAudio") { lastSugoiAt = Date.now(); seqEndAt = 0; }
    if (DELAYED[id] && Date.now() - lastSugoiAt < 800) {
      var sMs = getSoundDurationMs("sugoiAudio") || 1500;
      var fMs = getSoundDurationMs("tasseiFanfareAudio") || 3000;
      /* ファンファーレの開始 = sugoiの長さ + 200ms。そこから MASTER_DELAY_MS 後に鳴らす */
      var delay = sMs + 200 + MASTER_DELAY_MS;
      var dur = getSoundDurationMs(id) || 2500;
      var fanfareEnd = sMs + 200 + fMs;
      var masterEnd = delay + dur;
      seqEndAt = Date.now() + Math.max(fanfareEnd, masterEnd) + 400;
      delayedTimers.push(setTimeout(function () { origPlay(id); }, delay));
      return;
    }
    return origPlay(id);
  };

  var origClear = window.clearPendingTimers;
  window.clearPendingTimers = function () {
    origClear();
    delayedTimers.forEach(function (t) { clearTimeout(t); });
    delayedTimers = [];
    if (unlockTimer !== null) { clearTimeout(unlockTimer); unlockTimer = null; }
    seqEndAt = 0;
  };

  var origUnlock = window.unlockResultButtons;
  window.unlockResultButtons = function () {
    var wait = seqEndAt - Date.now();
    if (wait > 0) {
      if (unlockTimer !== null) clearTimeout(unlockTimer);
      unlockTimer = setTimeout(function () { unlockTimer = null; origUnlock(); }, wait);
      return;
    }
    origUnlock();
  };

  var origLegend = window.showLegendModal;
  window.showLegendModal = function (idx) {
    var wait = seqEndAt - Date.now();
    if (wait > 0) {
      delayedTimers.push(setTimeout(function () { origLegend(idx); }, wait));
    } else {
      origLegend(idx);
    }
  };

  /* ===== 先生ページ：教室ネームの直し ===== */
  var origRenderTeacher = window.renderTeacherView;
  window.renderTeacherView = function () {
    origRenderTeacher();
    try {
      var html = '<table class="compare-table"><thead><tr><th>枠</th><th>あいことば</th><th>教室ネーム</th><th>保存</th></tr></thead><tbody>';
      var any = false;
      profiles.forEach(function (n, i) {
        if (!isRegistered(i)) return;
        any = true;
        html += '<tr><td>' + (i + 1) + '</td><td>' + (codeOfSlot(i) || "-") + '</td>' +
          '<td><input type="text" id="tName_' + i + '" value="' + String(n || "").replace(/"/g, "&quot;") + '" maxlength="8" style="width:80px;text-align:center;"></td>' +
          '<td><button onclick="saveStudentByTeacher(' + i + ')" style="font-size:10px;padding:2px 4px;">保存</button></td></tr>';
      });
      if (!any) html += '<tr><td colspan="4">まだ だれも とうろくしていません</td></tr>';
      document.getElementById("teacherStudentConfigList").innerHTML = html + '</tbody></table>';
    } catch (e) {}
  };

  window.saveStudentByTeacher = function (slot) {
    var s = cleanName(document.getElementById("tName_" + slot).value);
    var err = nameError(s);
    if (err) { alert(err); return; }
    for (var i = 0; i < profiles.length; i++) {
      if (i !== slot && isRegistered(i) && profiles[i] === s) {
        alert("おなじ なまえが あります");
        return;
      }
    }
    profiles[slot] = s;
    Storage.set("onpu_profiles", profiles);
    initProfiles();
    alert("枠" + (slot + 1) + " を「" + s + "」にしました");
  };

  /* ===== 同じカードが続けて出ないようにする ===== */
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

  /* ===== 画像を先に読み込んでおく ===== */
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

  /* ===== はじまり ===== */
  toggleModal("registerModal", false);
  initProfiles();

  var startCode = isRegistered(activeProfileIndex) ? codeOfSlot(activeProfileIndex) : "";
  if (startCode) {
    tryCode(startCode, false);
  } else {
    showCode("あいことばを いれてね", false);
  }
})();
