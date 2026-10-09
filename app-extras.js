(function () {
  /* ★ マスター音声を、ファンファーレのはじまりから何ミリ秒後に鳴らすか（4000 = 4秒） */
  var MASTER_DELAY_MS = 4000;
  /* ★ 完成コードが、一覧に見えている日数 */
  var CODE_DAYS = 3;
  /* ★ 1まいのスタンプの数 */
  var STAMPS_PER_CARD = 5;

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

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

  /* ===== スタンプとカード ===== */
  var CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

  function localDateStr(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }
  function stampTotal(idx) { return Storage.getNumber("fy_stamps_" + idx, 0); }
  function stampState(idx) {
    var t = stampTotal(idx);
    return { total: t, cardNo: Math.floor(t / STAMPS_PER_CARD) + 1, inCard: t % STAMPS_PER_CARD };
  }
  function getCards(idx) {
    var a = Storage.get("fy_cards_" + idx, []);
    return Array.isArray(a) ? a : [];
  }
  function makeCode() {
    var s = "";
    for (var i = 0; i < 4; i++) s += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
    return s;
  }

  /* スタンプを1こ ふやす（1日1こまで）。しゅうりょう: "none"=もうもらった / "stamp" / "card" */
  function awardStamp(idx) {
    var today = localDateStr(new Date());
    if (Storage.get("fy_stamp_date_" + idx, "") === today) return { status: "none" };
    Storage.set("fy_stamp_date_" + idx, today);
    var total = stampTotal(idx) + 1;
    Storage.set("fy_stamps_" + idx, total);
    if (total % STAMPS_PER_CARD === 0) {
      var rec = { n: total / STAMPS_PER_CARD, t: Date.now(), name: profiles[idx] || "", code: makeCode() };
      var list = getCards(idx);
      list.push(rec);
      Storage.set("fy_cards_" + idx, list);
      return { status: "card", rec: rec };
    }
    return { status: "stamp" };
  }

  function cardHtml(rec) {
    var d = new Date(rec.t);
    return '<div style="border:3px double #ffb300;border-radius:16px;background:#fffdf0;padding:12px;margin-bottom:10px;text-align:center;">' +
      '<div style="font-size:13px;color:#806c5a;">ふよみチャレンジ スタンプカード</div>' +
      '<div style="font-size:20px;font-weight:900;color:#5b4636;margin:2px 0;">' + esc(rec.name) + ' さん</div>' +
      '<div style="font-size:16px;font-weight:800;color:#ff5722;">' + rec.n + ' まいめ かんせい！</div>' +
      '<div style="font-size:13px;color:#5b4636;margin:2px 0;">' + (d.getMonth() + 1) + '/' + d.getDate() + '</div>' +
      '<div style="font-size:34px;font-weight:900;letter-spacing:6px;color:#5b4636;background:#fff;border-radius:10px;padding:6px 0;margin-top:4px;">' + esc(rec.code) + '</div>' +
      '</div>';
  }

  /* 大きな画面（かんせい画面・コード一覧） */
  var ov = document.createElement("div");
  ov.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:10001;background:rgba(0,0,0,0.5);display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";
  ov.innerHTML = '<div style="width:100%;max-width:360px;max-height:88vh;overflow-y:auto;background:#fff;border-radius:20px;padding:16px;box-sizing:border-box;text-align:center;color:#5b4636;">' +
    '<div id="fyOvBody"></div>' +
    '<button id="fyOvClose" style="width:100%;margin-top:6px;padding:12px;font-size:16px;font-weight:800;border:none;border-radius:12px;background:#78a9c8;color:#fff;">とじる</button>' +
    '</div>';
  document.body.appendChild(ov);
  document.getElementById("fyOvClose").addEventListener("click", function () { ov.style.display = "none"; });

  function openOverlay(html) {
    document.getElementById("fyOvBody").innerHTML = html;
    ov.style.display = "flex";
  }

  function showCompleteModal(rec) {
    openOverlay(
      '<div style="font-size:44px;">🎉</div>' +
      '<div style="font-size:20px;font-weight:900;margin-bottom:8px;">カードが できたよ！</div>' +
      cardHtml(rec) +
      '<div style="font-size:12.5px;line-height:1.6;color:#806c5a;margin-bottom:8px;">' + CODE_DAYS + '日いないに、この がめんを スクショして<br>せんせいに おくってね。<br>コードは ' + CODE_DAYS + '日で みえなくなるよ。</div>'
    );
  }

  window.showCardCodes = function () {
    var idx = activeProfileIndex;
    var st = stampState(idx);
    var now = Date.now();
    var limit = CODE_DAYS * 86400000;
    var all = getCards(idx);
    var visible = all.filter(function (r) { return now - r.t < limit; });
    var html = '<div style="font-size:18px;font-weight:900;margin-bottom:8px;">📮 カードの コード</div>';
    if (visible.length) {
      visible.slice().reverse().forEach(function (r) { html += cardHtml(r); });
      html += '<div style="font-size:12px;color:#806c5a;margin-bottom:8px;">スクショして せんせいに おくってね。<br>コードは ' + CODE_DAYS + '日で みえなくなるよ。</div>';
    } else if (all.length) {
      html += '<div style="font-size:14px;line-height:1.6;margin-bottom:10px;">いま みえる コードは ないよ。<br>コードは ' + CODE_DAYS + '日で みえなくなるよ。</div>';
    } else {
      html += '<div style="font-size:14px;line-height:1.6;margin-bottom:10px;">まだ カードは できていないよ。<br>あと ' + (STAMPS_PER_CARD - st.inCard) + 'こ！</div>';
    }
    html += '<div style="font-size:13px;font-weight:800;color:#ff5722;margin-bottom:8px;">いま ' + st.cardNo + 'まいめ（' + st.inCard + 'こ）</div>';
    openOverlay(html);
  };

  /* トップ画面のスタンプ表示 */
  window.renderStampMini = function (idx) {
    var container = document.getElementById("stampMiniBox");
    if (!container) return;
    var st = stampState(idx);
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    var dots = "";
    for (var i = 1; i <= STAMPS_PER_CARD; i++) {
      var on = i <= st.inCard;
      dots += '<div class="stamp-dot' + (on ? ' active' : '') + '" style="width:26px;height:26px;font-size:13px;">' + (on ? "💮" : i) + '</div>';
    }
    container.innerHTML =
      '<div style="font-size:13px;font-weight:800;color:#5b4636;margin-bottom:4px;">🏅 いま ' + st.cardNo + 'まいめ（' + st.inCard + 'こ）</div>' +
      '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:6px;">' + dots + '</div>' +
      '<button id="fyCodeBtn" style="border:none;background:#ffb300;color:#5b4636;font-size:12px;font-weight:800;border-radius:10px;padding:6px 12px;cursor:pointer;">📮 カードの コードを みる</button>';
    var b = document.getElementById("fyCodeBtn");
    if (b) b.addEventListener("click", window.showCardCodes);
  };

  /* 結果画面：100%（20問いじょう）のとき、スタンプを ふやす */
  var origShowResult = window.showResultScreen;
  var cardTimer = null;
  window.showResultScreen = function () {
    var correct = trainingCorrectCount, mistakes = trainingMistakes;
    var total = correct + mistakes;
    var acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    var idx = activeProfileIndex;
    var is20 = (targetValue >= 20);

    if (cardTimer !== null) { clearTimeout(cardTimer); cardTimer = null; }
    origShowResult.apply(this, arguments);

    try {
      var line = document.getElementById("fyStampMsg");
      if (!line) {
        line = document.createElement("div");
        line.id = "fyStampMsg";
        line.style.cssText = "font-size:14px;font-weight:800;color:#e65100;margin-top:4px;";
        var anchor = document.getElementById("resultStreakMsg");
        anchor.parentNode.insertBefore(line, anchor.nextSibling);
      }
      line.textContent = "";

      if (acc === 100 && is20) {
        var r = awardStamp(idx);
        var st = stampState(idx);
        if (r.status === "none") {
          line.textContent = "🏅 きょうの スタンプは もう もらったよ";
        } else if (r.status === "stamp") {
          line.textContent = "🏅 スタンプ ゲット！ いま " + st.cardNo + "まいめ（" + st.inCard + "こ）";
        } else {
          line.textContent = "🏅 スタンプが " + STAMPS_PER_CARD + "こ そろったよ！";
          var rec = r.rec;
          var sMs = getSoundDurationMs("sugoiAudio") || 1500;
          var fMs = getSoundDurationMs("tasseiFanfareAudio") || 3000;
          var wait = sMs + 200 + fMs + 1200;
          cardTimer = setTimeout(function () { cardTimer = null; showCompleteModal(rec); }, wait);
        }
      }
    } catch (e) {}
  };

  /* ===== 画面まわりの書きかえ ===== */

  /* 1人のときは名前を表示、2人以上のときだけ プレイヤー選択とスタートを出す */
  function updateSwitcherVisibility() {
    try {
      var wrap = document.querySelector(".profile-select-wrap");
      var label = document.querySelector(".profile-label");
      var multi = registeredCount() >= 2;
      if (wrap) wrap.style.display = multi ? "flex" : "none";
      if (label) label.style.display = multi ? "block" : "none";

      var solo = document.getElementById("fySoloName");
      if (!solo && wrap) {
        solo = document.createElement("div");
        solo.id = "fySoloName";
        solo.style.cssText = "font-size:20px;font-weight:900;color:#5b4636;margin:2px 0 8px;word-break:break-all;";
        wrap.parentNode.insertBefore(solo, wrap);
      }
      if (solo) {
        if (multi || !isRegistered(activeProfileIndex)) {
          solo.style.display = "none";
        } else {
          solo.style.display = "block";
          solo.textContent = "👤 " + legendMark(activeProfileIndex) + profiles[activeProfileIndex] + " さん";
        }
      }

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

  /* ===== 先生ページ ===== */
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
          '<td><input type="text" id="tName_' + i + '" value="' + esc(n) + '" maxlength="8" style="width:80px;text-align:center;"></td>' +
          '<td><button onclick="saveStudentByTeacher(' + i + ')" style="font-size:10px;padding:2px 4px;">保存</button></td></tr>';
      });
      if (!any) html += '<tr><td colspan="4">まだ だれも とうろくしていません</td></tr>';
      document.getElementById("teacherStudentConfigList").innerHTML = html + '</tbody></table>';
    } catch (e) {}

    /* スタンプのテスト用ボタン（先生ページの「管理・リセット」） */
    try {
      var tab3 = document.getElementById("teacherTab3");
      if (tab3 && !document.getElementById("fyStampTest")) {
        var d = document.createElement("div");
        d.id = "fyStampTest";
        d.innerHTML =
          '<div style="font-size:12px;font-weight:bold;color:#5b4636;margin-bottom:6px;text-align:left;">🧪 スタンプのテスト</div>' +
          '<button class="modal-btn" style="background:#43a047;font-size:12px;padding:8px;margin-bottom:6px;" onclick="fyStampSetFour()">🧪 いまのプレイヤーを スタンプ4こ・きょうもらえる 状態にする</button>' +
          '<button class="modal-btn" style="background:#2e7d32;font-size:12px;padding:8px;margin-bottom:12px;" onclick="fyStampReset()">🧪 いまのプレイヤーの スタンプとコードを リセット</button>';
        tab3.insertBefore(d, tab3.firstChild);
      }
    } catch (e) {}
  };

  window.fyStampSetFour = function () {
    var i = activeProfileIndex;
    Storage.set("fy_stamps_" + i, STAMPS_PER_CARD - 1);
    Storage.set("fy_stamp_date_" + i, "");
    initProfiles();
    alert("スタンプを " + (STAMPS_PER_CARD - 1) + "こ にしました。20問で100%をとると、カードが かんせいします。");
  };
  window.fyStampReset = function () {
    var i = activeProfileIndex;
    Storage.set("fy_stamps_" + i, 0);
    Storage.set("fy_stamp_date_" + i, "");
    Storage.set("fy_cards_" + i, []);
    initProfiles();
    alert("スタンプとコードを リセットしました。");
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

  /* ===== 音声のクレジット表記（トップ画面の一番下） ===== */
  try {
    var sel0 = document.getElementById("selectScreen");
    if (sel0 && !document.getElementById("fyCredit")) {
      var cr = document.createElement("div");
      cr.id = "fyCredit";
      cr.style.cssText = "text-align:center;font-size:10px;color:#b0a090;margin:12px 0 8px;line-height:1.5;";
      cr.textContent = "音声：VOICEVOX:ずんだもん";
      sel0.appendChild(cr);
    }
  } catch (e) {}

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
