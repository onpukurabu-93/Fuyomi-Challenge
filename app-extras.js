(function () {
  /* ★ マスター音声を、ファンファーレのはじまりから何ミリ秒後に鳴らすか（4000 = 4秒） */
  var MASTER_DELAY_MS = 4000;
  /* ★ コードが、一覧に見えている日数 */
  var CODE_DAYS = 3;
  /* ★ 1まいのスタンプの数 */
  var STAMPS_PER_CARD = 5;
  /* ★ 「よく考えて」の声：何問おわってから出すか、一発せいかいりつの下限（0.7 = 70%） */
  var THINK_AFTER = 5;
  var THINK_RATE = 0.7;
  /* ★ コードを計算するときの、ひみつの文字（かえると、むかしのコードは あわなくなります） */
  var SALT = "fuyomi-2026";

  var MAP_KEY = "onpu_code_slots";
  var cancelable = false;
  var pending = null;

  /* 一発せいかいの数えかた用 */
  var firstTry = 0;
  var qMistake = false;
  var thinkPlayed = false;

  /* おいわい画面の順番待ち */
  var celQueue = [];
  var celebrating = false;
  var queueScheduled = false;
  var heldVoice = null;            /* マスターの声：おいわい画面が出たときに鳴らす */
  var suppressMasterVoice = false;

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

  function cleanName(raw) { return String(raw || "").normalize("NFKC").trim(); }
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
  function openApp() { cancelable = false; box.style.display = "none"; }

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
  cancelBtn.addEventListener("click", function () { cancelable = false; box.style.display = "none"; });

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

  /* =========================================================
     きろくとコード（スタンプカード・ト音記号マスター・ヘ音記号マスター・ふよみマスター・レジェンド）
     どれも、同じ形：がめんを出す → スクショ → せんせいに おくる
     コードは「なまえ・しゅるい・かいすう・ひづけ」から計算します。
     先生ページの「コードかくにん」で、同じ計算ができます。
     ========================================================= */
  var CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

  function localDateStr(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (day < 10 ? "0" + day : day);
  }

  function codeFor(name, type, n, dateStr) {
    var s = [name, type, n, dateStr, SALT].join("|");
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    var out = "";
    for (var k = 0; k < 4; k++) {
      out += CODE_CHARS.charAt(h % CODE_CHARS.length);
      h = Math.floor(h / CODE_CHARS.length);
    }
    return out;
  }

  var INFO = {
    stamp:  { icon: "🏅", label: "スタンプカード", bg: "#fffdf0", bd: "#ffb300", tx: "#5b4636", ac: "#ff5722", cbg: "#fff", ctx: "#5b4636" },
    treble: { icon: "🎼", label: "ト音記号マスター", bg: "#eaf6ff", bd: "#2a8fd6", tx: "#1a4a7a", ac: "#2a8fd6", cbg: "#fff", ctx: "#1a4a7a" },
    bass:   { icon: "🎼", label: "ヘ音記号マスター", bg: "#eafaf0", bd: "#2fa862", tx: "#1f5a3a", ac: "#2fa862", cbg: "#fff", ctx: "#1f5a3a" },
    master: { icon: "🎓", label: "ふよみマスター", bg: "#fff0f5", bd: "#e0527f", tx: "#7a2b4a", ac: "#e0527f", cbg: "#fff", ctx: "#7a2b4a" },
    legend: { icon: "👑", label: "ふよみレジェンド", bg: "#16213f", bd: "#c9a23a", tx: "#f4e6b0", ac: "#f4d36b", cbg: "#fff8dc", ctx: "#16213f" },
    legend1000: { icon: "👑", label: "ふよみレジェンド", bg: "#fff3b0", bd: "#b98a1e", tx: "#5a3a00", ac: "#8a5a00", cbg: "#fff", ctx: "#5a3a00" }
  };
  function infoOf(rec) {
    if (rec.type === "legend" && rec.n >= 1000) return INFO.legend1000;
    return INFO[rec.type] || INFO.stamp;
  }
  function titleOf(rec) {
    if (rec.type === "stamp") return "スタンプカード " + rec.n + " まいめ";
    if (rec.type === "legend") return "ふよみレジェンド";
    return INFO[rec.type].label;
  }
  function subOf(rec) {
    if (rec.type === "stamp") return "かんせい！";
    if (rec.type === "legend") return "パーフェクト " + rec.n + "回 れんぞく！";
    return "おめでとう！";
  }

  function stampTotal(idx) { return Storage.getNumber("fy_stamps_" + idx, 0); }
  function stampState(idx) {
    var t = stampTotal(idx);
    return { total: t, cardNo: Math.floor(t / STAMPS_PER_CARD) + 1, inCard: t % STAMPS_PER_CARD };
  }
  function getCards(idx) {
    var a = Storage.get("fy_cards_" + idx, []);
    if (!Array.isArray(a)) return [];
    /* むかしの きろく（しゅるいが ないもの）は スタンプカードとして あつかう */
    return a.map(function (r) { if (!r.type) r.type = "stamp"; return r; });
  }
  function getAch(idx) {
    var a = Storage.get("fy_ach_" + idx, []);
    return Array.isArray(a) ? a : [];
  }
  function findAch(idx, type) {
    var a = getAch(idx);
    for (var i = 0; i < a.length; i++) { if (a[i].type === type) return a[i]; }
    return null;
  }
  function makeRec(idx, type, n) {
    var now = new Date();
    var d = localDateStr(now);
    var name = profiles[idx] || "";
    return { type: type, n: n, t: now.getTime(), d: d, name: name, code: codeFor(name, type, n, d) };
  }
  /* しゅうごうの きろくを つくる。マスターは1どだけ。れじぇんどは、まいかい */
  function addAch(idx, type, n) {
    if (type !== "legend" && findAch(idx, type)) return null;
    var rec = makeRec(idx, type, n || 0);
    var a = getAch(idx);
    a.push(rec);
    Storage.set("fy_ach_" + idx, a);
    return rec;
  }

  /* スタンプを1こ ふやす（1日1こまで）。しゅうりょう: "none"=もうもらった / "stamp" / "card" */
  function awardStamp(idx) {
    var today = localDateStr(new Date());
    if (Storage.get("fy_stamp_date_" + idx, "") === today) return { status: "none" };
    Storage.set("fy_stamp_date_" + idx, today);
    var total = stampTotal(idx) + 1;
    Storage.set("fy_stamps_" + idx, total);
    if (total % STAMPS_PER_CARD === 0) {
      var rec = makeRec(idx, "stamp", total / STAMPS_PER_CARD);
      var list = getCards(idx);
      list.push(rec);
      Storage.set("fy_cards_" + idx, list);
      return { status: "card", rec: rec };
    }
    return { status: "stamp" };
  }

  function dmd(rec) {
    var p = String(rec.d || "").split("-");
    if (p.length === 3) return parseInt(p[1], 10) + "/" + parseInt(p[2], 10);
    var d = new Date(rec.t);
    return (d.getMonth() + 1) + "/" + d.getDate();
  }

  function cardHtml(rec) {
    var f = infoOf(rec);
    return '<div style="border:3px double ' + f.bd + ';border-radius:16px;background:' + f.bg + ';padding:12px;margin-bottom:10px;text-align:center;color:' + f.tx + ';">' +
      '<div style="font-size:30px;line-height:1.2;">' + f.icon + '</div>' +
      '<div style="font-size:17px;font-weight:900;margin:2px 0;">' + esc(titleOf(rec)) + '</div>' +
      '<div style="font-size:15px;font-weight:800;color:' + f.ac + ';">' + esc(subOf(rec)) + '</div>' +
      '<div style="font-size:19px;font-weight:900;margin:4px 0;">' + esc(rec.name) + ' さん</div>' +
      '<div style="font-size:13px;margin:2px 0;">' + dmd(rec) + '</div>' +
      '<div style="font-size:34px;font-weight:900;letter-spacing:6px;color:' + f.ctx + ';background:' + f.cbg + ';border-radius:10px;padding:6px 0;margin-top:4px;">' + esc(rec.code) + '</div>' +
      '</div>';
  }

  /* 大きな画面 */
  var ov = document.createElement("div");
  ov.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:10001;background:rgba(0,0,0,0.5);display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";
  ov.innerHTML = '<div style="width:100%;max-width:360px;max-height:88vh;overflow-y:auto;background:#fff;border-radius:20px;padding:16px;box-sizing:border-box;text-align:center;color:#5b4636;">' +
    '<div id="fyOvBody"></div>' +
    '<button id="fyOvClose" style="width:100%;margin-top:6px;padding:12px;font-size:16px;font-weight:800;border:none;border-radius:12px;background:#78a9c8;color:#fff;">とじる</button>' +
    '</div>';
  document.body.appendChild(ov);
  document.getElementById("fyOvClose").addEventListener("click", function () {
    ov.style.display = "none";
    if (celebrating) {
      celebrating = false;
      queueScheduled = false;
      celQueue = [];
      /* 結果画面のボタンが、まだ薄いままのときは、ここで色づける */
      try { closeAwardModal(); } catch (e) {}
    }
  });

  function openOverlay(html) {
    document.getElementById("fyOvBody").innerHTML = html;
    ov.style.display = "flex";
  }

  function sendText() {
    return '<div style="font-size:12.5px;line-height:1.6;color:#806c5a;margin-bottom:8px;">' + CODE_DAYS + '日いないに、この がめんを スクショして<br>せんせいに おくってね。<br>コードは ' + CODE_DAYS + '日で みえなくなるよ。<br>カードは せんせいから わたすよ！</div>';
  }

  /* おいわい画面：いくつ あっても、1つの がめんに ならべる（スクショが 1回で すむ） */
  function showCel(recs, viewOnly) {
    if (!Array.isArray(recs)) recs = [recs];
    celebrating = !viewOnly;
    var body =
      '<div style="font-size:40px;">🎉</div>' +
      '<div style="font-size:19px;font-weight:900;margin-bottom:8px;">' + (viewOnly ? "たっせいの きろく" : "おめでとう！") + '</div>';
    recs.forEach(function (r) { body += cardHtml(r); });
    body += sendText();
    openOverlay(body);
    if (!viewOnly) playCelSounds(recs);
  }

  /* 画面が出た しゅんかんに、マスターの声 → （おわってから）ファンファーレ */
  function playCelSounds(recs) {
    var hasLegend = false, hasMaster = false;
    recs.forEach(function (r) {
      if (r.type === "legend") hasLegend = true;
      if (r.type === "master") hasMaster = true;
    });
    var voice = heldVoice;
    heldVoice = null;
    var delay = 0;
    if (voice) {
      try { playAudioCloned(voice); } catch (e) {}
      delay = (getSoundDurationMs(voice) || 2500) + 300;
    }
    var fan = hasLegend ? "hyoshoFanfareAudio" : (hasMaster ? "hyoshoFanfare1Audio" : null);
    if (fan) {
      if (delay > 0) setTimeout(function () { try { playAudioCloned(fan); } catch (e) {} }, delay);
      else { try { playAudioCloned(fan); } catch (e) {} }
    }
  }

  function nextCel() {
    if (celQueue.length) {
      var recs = celQueue;
      celQueue = [];
      showCel(recs, false);
    } else {
      celebrating = false;
      queueScheduled = false;
      try { closeAwardModal(); } catch (e) {}
    }
  }

  /* 自動の表彰式は使わない。ボタンから呼ばれたときだけ、マスターの きろくを見せる */
  window.openAwardModal = function (idx) {
    if (idx !== undefined) {
      if (!queueScheduled && !celebrating) { try { closeAwardModal(); } catch (e) {} }
      return;
    }
    var rec = findAch(activeProfileIndex, "master");
    if (rec) showCel([rec], true);
  };

  /* 「きろくと コード」の一覧 */
  var ACH_LINES = [["treble", "🎼 ト音記号マスター"], ["bass", "🎼 ヘ音記号マスター"], ["master", "🎓 ふよみマスター"]];

  window.showCardCodes = function () {
    var idx = activeProfileIndex;
    var st = stampState(idx);
    var now = Date.now();
    var limit = CODE_DAYS * 86400000;
    var all = getCards(idx).concat(getAch(idx));
    all.sort(function (a, b) { return b.t - a.t; });
    var visible = all.filter(function (r) { return now - r.t < limit; });

    var html = '<div style="font-size:18px;font-weight:900;margin-bottom:8px;">🎖 きろくと コード</div>';

    /* ずっと のこる たっせい */
    var lines = "";
    ACH_LINES.forEach(function (a) {
      var r = findAch(idx, a[0]);
      lines += '<div style="font-size:14px;margin:3px 0;' + (r ? 'font-weight:800;color:#5b4636;' : 'color:#bbb;') + '">' + a[1] + (r ? ' ✓ ' + dmd(r) : ' …まだ') + '</div>';
    });
    var lc = getLegendCount(idx);
    lines += '<div style="font-size:14px;margin:3px 0;' + (lc > 0 ? 'font-weight:800;color:#5b4636;' : 'color:#bbb;') + '">👑 ふよみレジェンド ' + (lc > 0 ? '✓ ' + lc + '回' : '…まだ') + '</div>';
    html += '<div style="background:#fdf8ed;border-radius:12px;padding:8px;margin-bottom:10px;">' + lines + '</div>';

    if (visible.length) {
      visible.forEach(function (r) { html += cardHtml(r); });
      html += '<div style="font-size:12px;color:#806c5a;margin-bottom:8px;">スクショして せんせいに おくってね。<br>コードは ' + CODE_DAYS + '日で みえなくなるよ。</div>';
    } else {
      html += '<div style="font-size:13px;line-height:1.6;margin-bottom:10px;color:#806c5a;">いま みえる コードは ないよ。<br>コードは ' + CODE_DAYS + '日で みえなくなるよ。</div>';
    }
    html += '<div style="font-size:13px;font-weight:800;color:#ff5722;margin-bottom:8px;">スタンプ いま ' + st.cardNo + 'まいめ（' + st.inCard + 'こ）</div>';
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
      '<button id="fyCodeBtn" style="border:none;background:#ffb300;color:#5b4636;font-size:12px;font-weight:800;border-radius:10px;padding:6px 12px;cursor:pointer;">🎖 きろくと コード</button>';
    var b = document.getElementById("fyCodeBtn");
    if (b) b.addEventListener("click", window.showCardCodes);
  };

  /* ===== ほし と 「ぜんぶ いっぱつ せいかい」の かず =====
     ・ほし（連続）：20問を ぜんぶ いっぱつで せいかい → 1日に 1こまで。
       ちがったとき（ほしを もらう前）は、いまの10この 中だけ 0に もどる。
     ・ぜんぶ いっぱつ せいかいの かず：へらない。1日に なんど とっても ふえる。 */
  function perfTotal(idx) { return Storage.getNumber("fy_perfect_total_" + idx, 0); }

  /* トップ画面：数字で見せる */
  function renderStars(idx) {
    var host = document.getElementById("stampMiniBox");
    if (!host) return;
    var el = document.getElementById("fyStars");
    if (!el) {
      el = document.createElement("div");
      el.id = "fyStars";
      el.style.cssText = "margin-top:6px;padding:6px 8px;background:#fffbea;border-radius:10px;border:1px dashed #ffe082;text-align:left;font-size:13px;color:#5b4636;line-height:1.8;";
      host.parentNode.insertBefore(el, host.nextSibling);
    }
    var s = Storage.getNumber("onpu_perf_streak_" + idx, 0);
    var small = s % 10, big = Math.floor((s % 100) / 10), hund = Math.floor(s / 100);
    el.innerHTML =
      '<div>⭐ ほし　おおきい <b style="color:#e65100;font-size:16px;">' + big + '</b> こ ・ ちいさい <b style="color:#e65100;font-size:16px;">' + small + '</b> こ</div>' +
      '<div>✅ ぜんぶ いっぱつ せいかい <b style="color:#e65100;font-size:16px;">' + perfTotal(idx) + '</b> かい</div>' +
      (hund > 0 ? '<div>👑 レジェンドまで すすんだ かいすう <b style="color:#7a4f00;font-size:16px;">' + hund + '</b></div>' : '');
  }

  /* 結果画面：ほしを ならべて、あたらしく ついた ほしを 目立たせる */
  (function () {
    try {
      var st = document.createElement("style");
      st.textContent =
        "@keyframes fyPop{0%{transform:scale(.2);opacity:0}55%{transform:scale(2.1);opacity:1}100%{transform:scale(1.5);opacity:1}}" +
        "@keyframes fyGlow{0%,100%{text-shadow:0 0 4px #ffd54f}50%{text-shadow:0 0 14px #ff9800,0 0 22px #ffd54f}}" +
        ".fy-new{display:inline-block;animation:fyPop .7s ease-out forwards, fyGlow 1.2s ease-in-out .7s infinite;}";
      document.head.appendChild(st);
    } catch (e) {}
  })();

  function starRowHtml(lit, hi, size, onColor) {
    var out = "";
    for (var i = 0; i < 10; i++) {
      var on = i < lit;
      var cls = (i === hi) ? ' class="fy-new"' : "";
      out += '<span' + cls + ' style="font-size:' + size + 'px;line-height:1;color:' + (on ? onColor : "#dcdcdc") + ';margin:0 1px;">★</span>';
    }
    return out;
  }

  function renderResultStars(visible, s1, newStar, note) {
    var el = document.getElementById("fyResStars");
    if (!el) {
      el = document.createElement("div");
      el.id = "fyResStars";
      el.style.cssText = "margin:6px 0 2px;padding:6px 8px;background:#fffbea;border-radius:12px;border:1px dashed #ffe082;text-align:center;";
      var wrap = document.getElementById("resultButtonsWrap");
      wrap.parentNode.insertBefore(el, wrap);
    }
    if (!visible) { el.style.display = "none"; return; }
    el.style.display = "block";

    var smallLit, bigLit, hiS = -1, hiB = -1;
    if (newStar && s1 % 10 === 0) {
      smallLit = 10;
      bigLit = (s1 % 100 === 0) ? 10 : Math.floor((s1 % 100) / 10);
      hiB = bigLit - 1;
    } else {
      smallLit = s1 % 10;
      bigLit = Math.floor((s1 % 100) / 10);
      if (newStar) hiS = smallLit - 1;
    }
    el.innerHTML =
      '<div style="font-size:14px;font-weight:900;color:#e65100;min-height:20px;">' + (newStar ? "⭐ いま この ほしが ついたよ！" : esc(note || "")) + '</div>' +
      '<div style="margin-top:4px;">' + starRowHtml(bigLit, hiB, 24, "#ffb300") + '</div>' +
      '<div style="margin-top:4px;">' + starRowHtml(smallLit, hiS, 16, "#ff9800") + '</div>';
  }

  /* ===== 結果画面 =====
     「一発せいかいりつ」＝ 最初のタップで当てた問題の数 ÷ 問題の数。
     10問は れんしゅう：連続・スタンプ・ほし・かず には 数えない。 */
  var origShowResult = window.showResultScreen;
  window.showResultScreen = function () {
    var idx = activeProfileIndex;
    var N = targetValue;
    var is20 = (N >= 20);
    var ft = Math.max(0, Math.min(firstTry, N));
    trainingCorrectCount = ft;
    trainingMistakes = N - ft;
    var acc = N > 0 ? Math.round((ft / N) * 100) : 0;

    var kS = "onpu_perf_streak_" + idx, kM = "onpu_perf_max_" + idx;
    var kT = "onpu_perf_treble_" + idx, kB = "onpu_perf_bass_" + idx, kA = "onpu_perf_all_" + idx;
    var kTot = "fy_perfect_total_" + idx, kSD = "fy_star_date_" + idx;
    var s0 = Storage.getNumber(kS, 0), m0 = Storage.getNumber(kM, 0);
    var cT = Storage.getNumber(kT, 0), cB = Storage.getNumber(kB, 0), cA = Storage.getNumber(kA, 0);
    var today = localDateStr(new Date());
    var starToday = (Storage.get(kSD, "") === today);

    var s1 = s0, legendNow = false, newStar = false, noteMsg = "";
    if (is20) {
      if (acc === 100) {
        Storage.set(kTot, Storage.getNumber(kTot, 0) + 1);
        if (starToday) { noteMsg = "きょうの ほしは もう ついてるよ。（ぜんぶ いっぱつは かぞえたよ）"; }
        else { s1 = s0 + 1; newStar = true; legendNow = (s1 % 100 === 0); Storage.set(kSD, today); }
      } else {
        if (!starToday) {
          s1 = Math.floor(s0 / 10) * 10;
          if (s0 % 10 > 0) noteMsg = "つぎは ぜんぶ いっぱつで せいかいを めざそう！";
        }
      }
    }

    /* マスターの声は、おいわい画面が出てから鳴らす（はじめて取るときだけ） */
    heldVoice = null;
    suppressMasterVoice = !!(acc === 100 && is20 && selectedLevel === 5 &&
      ((selectedClef === "treble" && !findAch(idx, "treble")) || (selectedClef === "bass" && !findAch(idx, "bass"))));

    /* もとの結果画面に、「100回目」の判定を させない */
    Storage.set(kS, 0);
    origShowResult.apply(this, arguments);
    suppressMasterVoice = false;
    Storage.set(kS, s1);
    Storage.set(kM, Math.max(m0, s1));
    if (!is20) { Storage.set(kT, cT); Storage.set(kB, cB); Storage.set(kA, cA); }

    /* 表示 */
    try {
      var rs = document.getElementById("resultScore");
      if (rs) rs.textContent = "いっぱつ せいかいりつ " + acc + "%";
      var sm = document.getElementById("resultStreakMsg");
      if (sm) sm.textContent = "";
    } catch (e) {}
    try { renderResultStars(is20, s1, newStar, noteMsg); } catch (e) {}

    var cel = [];
    var line = document.getElementById("fyStampMsg");
    if (!line) {
      line = document.createElement("div");
      line.id = "fyStampMsg";
      line.style.cssText = "font-size:14px;font-weight:800;color:#e65100;margin-top:4px;";
      var anchor = document.getElementById("resultStreakMsg");
      anchor.parentNode.insertBefore(line, anchor.nextSibling);
    }
    line.textContent = "";

    if (acc === 100 && !is20) {
      line.textContent = "20もんで ぜんぶ いっぱつで せいかいすると、ほしと スタンプが もらえるよ！";
    }

    if (acc === 100 && is20) {
      var r = awardStamp(idx);
      var st = stampState(idx);
      if (r.status === "none") {
        line.textContent = "🏅 きょうの スタンプは もう もらったよ";
      } else if (r.status === "stamp") {
        line.textContent = "🏅 スタンプ ゲット！ いま " + st.cardNo + "まいめ（" + st.inCard + "こ）";
      } else {
        line.textContent = "🏅 スタンプが " + STAMPS_PER_CARD + "こ そろったよ！";
        cel.push(r.rec);
      }

      /* マスター（レベル5を 20問 いっぱつで 100%） */
      if (selectedLevel === 5) {
        var mt = null;
        if (selectedClef === "treble") mt = addAch(idx, "treble", 0);
        else if (selectedClef === "bass") mt = addAch(idx, "bass", 0);
        else if (selectedClef === "all") mt = addAch(idx, "master", 0);
        if (mt) cel.push(mt);
      }

      /* レジェンド（100回ごと。ほしが ついた日だけ） */
      if (legendNow) {
        var lc0 = getLegendCount(idx);
        Storage.set("onpu_legend_count_" + idx, lc0 + 1);
        Storage.set("onpu_legend_" + idx, true);
        cel.push(addAch(idx, "legend", s1));
      }
    }

    try { initProfiles(); } catch (e) {}

    if (cel.length) {
      celQueue = cel;
      queueScheduled = true;
      var sMs = getSoundDurationMs("sugoiAudio") || 1500;
      var fMs = getSoundDurationMs("tasseiFanfareAudio") || 3000;
      var wait = sMs + 200 + fMs + 1200;
      var extra = seqEndAt - Date.now() + 400;
      if (extra > wait) wait = extra;
      delayedTimers.push(setTimeout(function () { nextCel(); }, wait));
    }
  };

  /* ===== 一発せいかいの数え方・「よく考えて」の声 ===== */
  try {
    var yk = document.createElement("audio");
    yk.id = "yokukangaeteAudio";
    yk.preload = "auto";
    yk.src = "yokukangaete.mp3";
    document.body.appendChild(yk);
    if (typeof soundIds !== "undefined" && soundIds.indexOf("yokukangaeteAudio") === -1) soundIds.push("yokukangaeteAudio");
  } catch (e) {}

  var origStartTraining = window.startTrainingWithConfig;
  window.startTrainingWithConfig = function () {
    firstTry = 0;
    qMistake = false;
    thinkPlayed = false;
    return origStartTraining.apply(this, arguments);
  };

  var origPressKey = window.pressKey;
  window.pressKey = function (key) {
    try {
      if (trainingMode && !trainingLocked && currentCards.length) {
        var card = currentCards[currentIndex];
        if (key === card.key) { if (!qMistake) firstTry++; }
        else { qMistake = true; }
      }
    } catch (e) {}
    return origPressKey.apply(this, arguments);
  };

  /* ===== 鍵：ト音記号は はじめから。ヘ音記号は ト音記号レベル1のクリアで ===== */
  function lockState() {
    var dbg = Storage.get("onpu_debug_unlocked_" + activeProfileIndex);
    var trebleLv1 = dbg || hasLevelCleared(activeProfileIndex, "treble", 1);
    var trebleAll = dbg || hasLevelCleared(activeProfileIndex, "treble", 5);
    var bassAll = dbg || hasLevelCleared(activeProfileIndex, "bass", 5);
    return { treble: true, bass: !!trebleLv1, all: !!(dbg || (trebleAll && bassAll)) };
  }

  window.updateLockVisuals = function () {
    var L = lockState();
    [["btnTreble", "lockTreble", L.treble], ["btnBass", "lockBass", L.bass], ["btnAll", "lockAll", L.all]].forEach(function (m) {
      var b = document.getElementById(m[0]);
      var t = document.getElementById(m[1]);
      if (b) b.classList.toggle("locked", !m[2]);
      if (t) t.style.display = m[2] ? "none" : "inline";
    });
  };

  window.selectClef = function (clef) {
    var L = lockState();
    if (clef === "bass" && !L.bass) { alert("まずは ト音記号の レベル1を クリアしよう！"); return; }
    if (clef === "all" && !L.all) { alert("ト音記号と ヘ音記号を すべてクリアすると あそべるよ！"); return; }
    selectedClef = clef;
    showLevelScreen();
  };

  /* ===== 画面まわりの書きかえ ===== */
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
    try { renderStars(activeProfileIndex); } catch (e) {}
  };

  window.openRegistration = function () {
    cancelable = true;
    codeInput.value = "";
    showCode("ふえる プレイヤーの あいことばを いれてね", false);
  };

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
      /* はじめて マスターを取るときは、声を とっておいて、おいわい画面が出たときに鳴らす */
      if (suppressMasterVoice && id !== "audio6do") {
        heldVoice = id;
        seqEndAt = Date.now() + sMs + 200 + fMs + 400;
        return;
      }
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
    if (!celebrating) { queueScheduled = false; celQueue = []; }
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

  /* ===== 保護者ページ：パスワードなし。1人ずつ、レベルごとの最高点（20問）を表示 ===== */
  function bestAcc(idx, clef, lv) {
    var b = Storage.get("onpu_best_20_" + idx + "_" + clef + "_" + lv);
    if (!b) {
      var ob = Storage.get("onpu_count_best_" + idx + "_" + clef + "_" + lv);
      if (ob && ob.count >= 20) b = ob;
    }
    return b && typeof b.accuracy === "number" ? b.accuracy + "%" : "-";
  }

  window.renderParentCompareTable = function () {
    var html = "";
    var any = false;
    profiles.forEach(function (n, idx) {
      if (!isRegistered(idx)) return;
      any = true;
      var st = stampState(idx);
      var doB = getDoTestBest(idx);
      var cnt = getLegendCount(idx);
      var sk = Storage.getNumber("onpu_perf_streak_" + idx, 0);
      var achs = ACH_LINES.map(function (a) { return findAch(idx, a[0]) ? a[1].replace(/^\S+\s/, "") + " ✓" : ""; }).filter(function (x) { return x; }).join("、");
      html += '<div style="border:1px solid #eadcc8;border-radius:12px;padding:8px;margin-bottom:10px;background:#fff;text-align:left;">';
      html += '<div style="font-size:15px;font-weight:900;color:#5b4636;margin-bottom:4px;">' + esc(legendMark(idx) + n) + '</div>';
      html += '<div style="font-size:11.5px;color:#5b4636;line-height:1.7;margin-bottom:4px;">' +
        '🔥 れんぞく ' + calculateStreak(idx) + '日<br>' +
        '🏅 スタンプ ' + st.cardNo + 'まいめ（' + st.inCard + 'こ）<br>' +
        '⭐ ほし れんぞく ' + sk + '回<br>' +
        '✅ ぜんぶ いっぱつ せいかい ' + perfTotal(idx) + '回<br>' +
        '🎵 6つのド 最高点 ' + (doB ? doB.accuracy + '%' : '-') + '<br>' +
        '🎖 ' + (achs || 'まだ マスターは なし') + '<br>' +
        '👑 レジェンド ' + (cnt > 0 ? cnt + '回' : '-') + '</div>';
      html += '<table class="compare-table"><thead><tr><th>レベル</th><th>ト音記号</th><th>ヘ音記号</th><th>全カード</th></tr></thead><tbody>';
      for (var lv = 1; lv <= 5; lv++) {
        html += '<tr><td>Lv.' + lv + '</td><td>' + bestAcc(idx, "treble", lv) + '</td><td>' + bestAcc(idx, "bass", lv) + '</td><td>' + bestAcc(idx, "all", lv) + '</td></tr>';
      }
      html += '</tbody></table>';
      html += '<div style="font-size:10px;color:#806c5a;margin-top:2px;">※20問テストの 一発せいかいりつの 最高です</div>';
      html += '</div>';
    });
    if (!any) html = '<div style="font-size:12px;color:#806c5a;">まだ だれも とうろくしていません</div>';
    document.getElementById("parentCompareTable").innerHTML = html;
  };

  window.showParentAuth = function () {
    document.getElementById("mgSelectSection").classList.add("hidden");
    document.getElementById("parentSection").classList.remove("hidden");
    document.getElementById("parentAuthBox").classList.add("hidden");
    document.getElementById("parentContentBox").classList.remove("hidden");
    renderParentCompareTable();
    try {
      var box2 = document.getElementById("parentContentBox");
      var hr = box2.querySelector("hr");
      var cutting = false;
      Array.prototype.slice.call(box2.children).forEach(function (el) {
        if (el === hr) cutting = true;
        if (cutting && !(el.tagName === "BUTTON" && el.className.indexOf("cancel") !== -1)) {
          el.style.display = "none";
        }
      });
    } catch (e) {}
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

    try {
      var t2 = document.getElementById("tTab2");
      if (t2) t2.style.display = "none";
    } catch (e) {}

    try {
      var tab3 = document.getElementById("teacherTab3");
      if (tab3 && !document.getElementById("fyStampTest")) {
        var d = document.createElement("div");
        d.id = "fyStampTest";
        d.innerHTML =
          '<div style="font-size:12px;font-weight:bold;color:#5b4636;margin-bottom:6px;text-align:left;">🔍 コード かくにん（スクショの コードが 正しいか）</div>' +
          '<div style="text-align:left;font-size:11px;color:#806c5a;margin-bottom:4px;">教室ネーム・しゅるい・かいすう・ひづけ を 入れると、正しい コードが 出ます。</div>' +
          '<input id="fcName" class="modal-input" placeholder="教室ネーム（スクショの なまえ）">' +
          '<select id="fcType" class="modal-input">' +
            '<option value="stamp">スタンプカード（まいすう）</option>' +
            '<option value="treble">ト音記号マスター</option>' +
            '<option value="bass">ヘ音記号マスター</option>' +
            '<option value="master">ふよみマスター</option>' +
            '<option value="legend">レジェンド（れんぞく かいすう）</option>' +
          '</select>' +
          '<input id="fcN" class="modal-input" type="number" placeholder="まいすう・かいすう（マスターは 空らん）">' +
          '<input id="fcDate" class="modal-input" type="date">' +
          '<button class="modal-btn" style="background:#5c6bc0;font-size:12px;padding:8px;" onclick="fyCheckCode()">コードを 出す</button>' +
          '<div id="fcOut" style="font-size:22px;font-weight:900;letter-spacing:4px;margin:6px 0 12px;color:#3949ab;"></div>' +
          '<div style="font-size:12px;font-weight:bold;color:#5b4636;margin-bottom:6px;text-align:left;">🧪 スタンプ・きろくの テスト</div>' +
          '<button class="modal-btn" style="background:#43a047;font-size:12px;padding:8px;margin-bottom:6px;" onclick="fyStampSetFour()">🧪 いまのプレイヤーを スタンプ4こ・きょうもらえる 状態にする</button>' +
          '<button class="modal-btn" style="background:#2e7d32;font-size:12px;padding:8px;margin-bottom:12px;" onclick="fyStampReset()">🧪 いまのプレイヤーの スタンプと たっせいの きろくを リセット</button>';
        tab3.insertBefore(d, tab3.firstChild);
        var dt = document.getElementById("fcDate");
        if (dt) dt.value = localDateStr(new Date());
      }
    } catch (e) {}
  };

  window.fyCheckCode = function () {
    var name = cleanName(document.getElementById("fcName").value);
    var type = document.getElementById("fcType").value;
    var n = parseInt(document.getElementById("fcN").value, 10);
    if (type === "treble" || type === "bass" || type === "master") n = 0;
    if (isNaN(n)) n = 0;
    var date = document.getElementById("fcDate").value;
    if (!name || !date) { document.getElementById("fcOut").textContent = "なまえと ひづけを いれてね"; return; }
    document.getElementById("fcOut").textContent = codeFor(name, type, n, date);
  };

  window.fyStampSetFour = function () {
    var i = activeProfileIndex;
    Storage.set("fy_stamps_" + i, STAMPS_PER_CARD - 1);
    Storage.set("fy_stamp_date_" + i, "");
    initProfiles();
    alert("スタンプを " + (STAMPS_PER_CARD - 1) + "こ にしました。20問で ぜんぶ いっぱつで せいかいすると、カードが かんせいします。");
  };
  window.fyStampReset = function () {
    var i = activeProfileIndex;
    Storage.set("fy_star_date_" + i, "");
    Storage.set("fy_perfect_total_" + i, 0);
    Storage.set("fy_stamps_" + i, 0);
    Storage.set("fy_stamp_date_" + i, "");
    Storage.set("fy_cards_" + i, []);
    Storage.set("fy_ach_" + i, []);
    initProfiles();
    alert("スタンプと たっせいの きろくを リセットしました。");
  };

  /* 先生ページの「連続を99回にする」「リセット」でも、ほしの日付を もどす（テストが できるように） */
  var o99 = window.setStreak99ForTest;
  window.setStreak99ForTest = function () {
    Storage.set("fy_star_date_" + activeProfileIndex, "");
    return o99.apply(this, arguments);
  };
  var oRL = window.resetLegendForTest;
  window.resetLegendForTest = function () {
    Storage.set("fy_star_date_" + activeProfileIndex, "");
    Storage.set("fy_perfect_total_" + activeProfileIndex, 0);
    return oRL.apply(this, arguments);
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

  /* ===== 問題を出す：同じカードが続けない／「よく考えて」は 次の問題が出たときに 1回だけ ===== */
  window.showRandomTrainingQuestion = function () {
    qMistake = false;
    if (trainingCorrectCount >= targetValue) { showResultScreen(); return; }
    document.getElementById("qCountBadge").textContent = "あと " + (targetValue - trainingCorrectCount) + " 問";

    var n = trainingCorrectCount;
    if (!thinkPlayed && n >= THINK_AFTER && (firstTry / n) < THINK_RATE) {
      thinkPlayed = true;
      try { playAudioCloned("yokukangaeteAudio"); } catch (e) {}
    }

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

  try {
    var rk = document.querySelector(".ranking-btn");
    if (rk) rk.style.display = "none";
  } catch (e) {}

  try {
    var mgBtn = document.querySelector(".select-button.challenge");
    if (mgBtn) mgBtn.textContent = "📊 保護者・先生ページ";
    var mgTitle = document.querySelector("#managementModal .modal-title");
    if (mgTitle) mgTitle.textContent = "📊 管理ページ";
  } catch (e) {}

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

  /* ===== 音が止まらないための対策 ===== */
  (function () {
    function makeSilentWav() {
      var rate = 8000, n = 800;
      var buf = new ArrayBuffer(44 + n);
      var v = new DataView(buf);
      function w(o, t) { for (var i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); }
      w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt ");
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, rate, true); v.setUint32(28, rate, true);
      v.setUint16(32, 1, true); v.setUint16(34, 8, true);
      w(36, "data"); v.setUint32(40, n, true);
      for (var i = 0; i < n; i++) v.setUint8(44 + i, 128);
      return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
    }
    var silent = null;
    try {
      silent = document.createElement("audio");
      silent.setAttribute("playsinline", "");
      silent.loop = true;
      silent.volume = 0.01;
      silent.src = makeSilentWav();
    } catch (e) { silent = null; }

    function wake() {
      try { if (silent && silent.paused) { var p = silent.play(); if (p && p.catch) p.catch(function () {}); } } catch (e) {}
      try {
        if (!audioInitialized) initAudioContext();
        var ctx = getAudioContext();
        if (ctx && ctx.state !== "running") {
          var r = ctx.resume();
          if (r && r.catch) r.catch(function () {});
        }
        if (ctx) {
          var b = ctx.createBuffer(1, 1, 22050);
          var s = ctx.createBufferSource();
          s.buffer = b; s.connect(ctx.destination); s.start(0);
        }
      } catch (e) {}
    }
    ["touchend", "click", "pointerup"].forEach(function (ev) { document.addEventListener(ev, wake, true); });

    var hint = document.createElement("div");
    hint.style.cssText = "position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:10002;background:rgba(60,40,20,0.88);color:#fff;font-size:13px;font-weight:700;padding:8px 14px;border-radius:14px;display:none;text-align:center;max-width:90%;";
    hint.textContent = "おとが でないときは、いちど とじて ひらいてね";
    document.body.appendChild(hint);
    var lastHint = 0;
    document.addEventListener("pointerup", function () {
      setTimeout(function () {
        try {
          if (audioInitialized && audioCtx && audioCtx.state !== "running" && Date.now() - lastHint > 60000) {
            lastHint = Date.now();
            hint.style.display = "block";
            setTimeout(function () { hint.style.display = "none"; }, 4000);
          }
        } catch (e) {}
      }, 800);
    }, true);
  })();

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
