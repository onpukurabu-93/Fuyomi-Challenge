/* LINEで おくる ボタン（コードが でる がめん ぜんぶで つかう） */
window.fyLineBtn = function (text, label, bg) {
  return '<a href="https://line.me/R/msg/text/?' + encodeURIComponent(text) + '" target="_blank" rel="noopener" style="text-decoration:none;display:block;"><span style="display:block;width:100%;box-sizing:border-box;border-radius:12px;padding:10px;font-size:15px;font-weight:800;text-align:center;background:' + (bg || "#06c755") + ';color:#fff;margin-top:6px;">' + (label || "LINEで せんせいに おくる") + '</span></a>';
};
/* アプリの リンク（タップすると じどうで しごとを する）。index.html の ある ところの アドレスを つかう */
window.fyAppLink = function (kind, value) {
  try { var u = new URL("index.html", location.href); u.search = ""; u.hash = ""; return u.href + "?" + kind + "=" + encodeURIComponent(value).replace(/\./g, "%2E"); }   /* LINEは リンクの「.」で きれて しまうので、「.」は %2E に する */ catch (e) { return ""; }
};
/* 生徒 → 先生：先生が リンクを タップすると、コードを じどうで かくにん */
window.fyLineCheck = function (text, label, bg) {
  return window.fyLineBtn(text + "\n\n▼ せんせいは ここを タップ（コードを じどうで かくにん）\n" + window.fyAppLink("check", text), label, bg);
};
/* コード → 記録を もどす リンク */
window.fyRestoreText = function (text, code) { return text + "\n\n▼ ここを タップすると、きろくが もどるよ\n" + window.fyAppLink("restore", code); };
(function () {
  /* ★ マスター音声を、ファンファーレのはじまりから何ミリ秒後に鳴らすか（4000 = 4秒） */
  var MASTER_DELAY_MS = 4000;
  /* ★ コードが、一覧に見えている日数 */
  var CODE_DAYS = 7;
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

  /* ポイントこうかんの コード（生徒の画面と、先生の コードかくにん で、同じ 計算を つかう） */
  window.fyExchangeCode = function (name, amt, rest, dateStr) {
    return codeFor(name, "exchange", (amt | 0) + "-" + (rest | 0), dateStr);
  };

  var INFO = {
    stamp:  { icon: "🏅", label: "スタンプカード", bg: "#fffdf0", bd: "#ffb300", tx: "#5b4636", ac: "#ff5722", cbg: "#fff", ctx: "#5b4636" },
    treble: { icon: "🎼", label: "ト音記号マスター", bg: "#eaf6ff", bd: "#2a8fd6", tx: "#1a4a7a", ac: "#2a8fd6", cbg: "#fff", ctx: "#1a4a7a" },
    bass:   { icon: "🎼", label: "ヘ音記号マスター", bg: "#eafaf0", bd: "#2fa862", tx: "#1f5a3a", ac: "#2fa862", cbg: "#fff", ctx: "#1f5a3a" },
    master: { icon: "🎓", label: "ふよみマスター", bg: "#fff0f5", bd: "#e0527f", tx: "#7a2b4a", ac: "#e0527f", cbg: "#fff", ctx: "#7a2b4a" },
    legend: { icon: "👑", label: "ふよみレジェンド", bg: "#16213f", bd: "#c9a23a", tx: "#f4e6b0", ac: "#f4d36b", cbg: "#fff8dc", ctx: "#16213f" },
    legend5: { icon: "👑", label: "ふよみレジェンド", bg: "#16213f", bd: "#c9a23a", tx: "#f4e6b0", ac: "#f4d36b", cbg: "#fff8dc", ctx: "#16213f" },
    maestro: { icon: "🎹", label: "ふよみマエストロ", bg: "#2b1b4a", bd: "#b79be0", tx: "#efe6ff", ac: "#d9c4ff", cbg: "#f4eeff", ctx: "#2b1b4a" },
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
    if (rec.type === "legend5") return "ノーミス 100曲 たっせい！";
    if (rec.type === "maestro") return "ながい曲 100曲 たっせい！";
    return "おめでとう！";
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
      '</div>' +
      window.fyLineCheck('【ふよみ】' + rec.name + ' さん　' + titleOf(rec) + '　' + subOf(rec) + '\nコード：' + rec.code) +
      '<div style="height:8px"></div>';
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
  var ACH_LINES = [["treble", "🎼 ト音記号マスター"], ["bass", "🎼 ヘ音記号マスター"], ["master", "🎓 ふよみマスター"], ["legend5", "👑 ふよみレジェンド"], ["maestro", "🎹 ふよみマエストロ"]];

  /* =========================================================
     記録の復元（先生が作った「復元コード」を、端末に貼ると、記録がもどる）
     コードの形：FY1.（名前と記録を文字にしたもの）.（しるし）
     ・コードの なまえと、この端末の プレイヤーの なまえが ちがうと、もどせない
     ・端末の きろくより 小さい数字は、書きこまない（もどる方向には 変えない）
     ========================================================= */
  function b64enc(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64dec(b) {
    var t = String(b).replace(/-/g, "+").replace(/_/g, "/");
    while (t.length % 4) t += "=";
    return decodeURIComponent(escape(atob(t)));
  }
  function signOf(payload) {
    var s = payload + "|" + SALT;
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var out = "";
    for (var k = 0; k < 6; k++) { out += CODE_CHARS.charAt(h % CODE_CHARS.length); h = Math.floor(h / CODE_CHARS.length); }
    return out;
  }
  function ymd(str) {                      /* "2026-10-01" → "20261001"（空なら "0"） */
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || ""));
    return m ? m[1] + m[2] + m[3] : "0";
  }
  function makeRestoreCode(o) {
    /* FY2：FY1 の おわりに、トレーニングポイントを 足した形（FY1 の古いコードも、そのまま読める） */
    var payload = ["FY2", o.name,
      [ymd(o.dt), ymd(o.db), ymd(o.dm)].join(","),
      [o.tot | 0, o.rb | 0, o.rn | 0].join(","),
      [o.lt | 0, o.lb | 0, o.la | 0].join(","),
      String(o.tp | 0)].join("|");
    return "FY2." + b64enc(payload) + "." + signOf(payload);
  }
  /* LINEの メッセージを ぜんぶ 貼っても、コードの ところだけ ひろう（前後の 文字や 改行は むし） */
  function pickCode(raw) {
    var t = String(raw || "").normalize("NFKC"), i = t.search(/FY(?:C1|1|2)\./);
    if (i < 0) return t.replace(/\s+/g, "");
    var u = t.slice(i).replace(/\s+/g, ""), m = u.match(/^FY(?:C1|1|2)\.[A-Za-z0-9_\-]+\.[A-Z0-9]{6}/);
    return m ? m[0] : u;
  }
  function parseRestoreCode(raw) {
    var code = pickCode(raw);
    var parts = code.split(".");
    if (parts.length !== 3 || (parts[0] !== "FY1" && parts[0] !== "FY2")) return { err: "コードの形が正しくありません。先生から届いたコードを、そのまま貼ってください。" };
    var payload;
    try { payload = b64dec(parts[1]); } catch (e) { return { err: "コードを読めませんでした。最後まで、全部コピーしましたか？" }; }
    if (signOf(payload) !== parts[2]) return { err: "コードが正しくありません。途中で切れていないか、確かめてください。" };
    var f = payload.split("|");
    var isV2 = (f[0] === "FY2");
    if (f[0] !== parts[0] || f.length !== (isV2 ? 6 : 5)) return { err: "コードの形が正しくありません。" };
    var d = f[2].split(","), n = f[3].split(","), l = f[4].split(",");
    return { name: f[1], dt: d[0], db: d[1], dm: d[2],
             tot: parseInt(n[0], 10) || 0, rb: parseInt(n[1], 10) || 0, rn: parseInt(n[2], 10) || 0,
             lt: parseInt(l[0], 10) || 0, lb: parseInt(l[1], 10) || 0, la: parseInt(l[2], 10) || 0,
             tp: isV2 ? (parseInt(f[5], 10) || 0) : 0, v: isV2 ? 2 : 1 };
  }
  function ensureLevels(idx, clef, upTo) {
    var changed = false;
    for (var lv = 1; lv <= Math.min(5, upTo); lv++) {
      var key = "onpu_best_20_" + idx + "_" + clef + "_" + lv;
      var b = Storage.get(key);
      if (!b || typeof b.accuracy !== "number" || b.accuracy < 90) {
        Storage.set(key, { accuracy: 90, time: (b && b.time) || 999, count: 20 });
        changed = true;
      }
    }
    return changed;
  }
  function restoreMaster(idx, type, ds, name) {
    if (ds === "0" || ds.length !== 8 || findAch(idx, type)) return false;
    var y = parseInt(ds.slice(0, 4), 10), m = parseInt(ds.slice(4, 6), 10), d = parseInt(ds.slice(6, 8), 10);
    var dateStr = y + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d);
    var a = getAch(idx);
    a.push({ type: type, n: 0, t: new Date(y, m - 1, d, 12).getTime(), d: dateStr, name: name, code: codeFor(name, type, 0, dateStr), r: 1 });
    Storage.set("fy_ach_" + idx, a);
    return true;
  }
  /* ---- レジェンドへの みち ＋ ハンコ の「うつしコード」（生徒が 古い端末で つくる） ---- */
  function chunkKeys(idx) {
    var keys = [], pre = ["fy_chunk_rec_" + idx + "_", "fy_chunk_ev_" + idx + "_", "fy_chunk_song_" + idx + "_"];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k) continue;
      for (var j = 0; j < pre.length; j++) if (k.indexOf(pre[j]) === 0) keys.push([k, pre[j]]);
    }
    return keys;
  }
  function makeChunkBackup(idx) {
    var o = { n: profiles[idx] || "", r: {}, m: 0, h: [] };
    chunkKeys(idx).forEach(function (kp) {
      try {
        var v = JSON.parse(localStorage.getItem(kp[0]) || "null");
        if (v) o.r[kp[1].slice("fy_chunk_".length, kp[1].indexOf("_" + idx + "_")) + "_" + kp[0].slice(kp[1].length)] = v;
      } catch (e) {}
    });
    o.m = Storage.getNumber("fy_chunk_max_" + idx, 0);
    o.s = {};
    var pbk = Storage.get("fy_pass_" + idx, {});
    if (pbk && typeof pbk === "object" && Object.keys(pbk).length) o.p = pbk;
    var qbk = Storage.get("fy_play_" + idx, {});
    if (qbk && typeof qbk === "object" && Object.keys(qbk).length) o.q = qbk;
    ["legend", "maestro", "seen"].forEach(function (kd) {
      var l = Storage.get("fy_chunk_songs_" + kd + "_" + idx, []);
      if (Array.isArray(l) && l.length) o.s[kd] = l;
    });
    o.h = getHankoList(idx).map(function (d) { return d.replace(/-/g, ""); });
    var payload = "FYC1|" + JSON.stringify(o);
    return "FYC1." + b64enc(payload) + "." + signOf(payload);
  }
  function getHankoList(idx) {
    var a = Storage.get("fy_hanko_" + idx, []);
    return Array.isArray(a) ? a : [];
  }
  function mergeRec(cur, add) {
    cur = cur || {};
    var out = {};
    ["first", "bestClear", "bestPerfect"].forEach(function (f) {
      var x = cur[f], y = add[f];
      if (x && y) out[f] = (f === "first") ? x : Math.min(x, y);
      else if (x || y) out[f] = x || y;
    });
    out.n = Math.max(cur.n || 0, add.n || 0);
    return out;
  }
  function applyChunkRestore(raw, idx) {
    var code = pickCode(raw);
    var parts = code.split(".");
    if (parts.length !== 3 || parts[0] !== "FYC1") return { ok: false, msg: "コードの形が正しくありません。" };
    var payload;
    try { payload = b64dec(parts[1]); } catch (e) { return { ok: false, msg: "コードを読めませんでした。最後まで、全部コピーしましたか？" }; }
    if (signOf(payload) !== parts[2]) return { ok: false, msg: "コードが正しくありません。途中で切れていないか、確かめてください。" };
    var o;
    try { o = JSON.parse(payload.slice(5)); } catch (e) { return { ok: false, msg: "コードの中みが正しくありません。" }; }
    var cur = profiles[idx] || "";
    if (cleanName(o.n) !== cleanName(cur)) {
      return { ok: false, msg: "このコードは「" + o.n + "」さん用です。いまのプレイヤーは「" + cur + "」さんです。プレイヤーを選びなおしてください。" };
    }
    var done = [];
    Object.keys(o.r || {}).forEach(function (k) {
      var tag = k.slice(0, k.indexOf("_")), rest = k.slice(k.indexOf("_") + 1);
      var key = "fy_chunk_" + tag + "_" + idx + "_" + rest;
      var before = localStorage.getItem(key), cur0 = null;
      try { cur0 = JSON.parse(before || "null"); } catch (e) {}
      var merged = mergeRec(cur0, o.r[k]);
      if (JSON.stringify(merged) !== JSON.stringify(cur0 || {})) { try { localStorage.setItem(key, JSON.stringify(merged)); } catch (e) {} done.push(tag === "rec" ? "レジェンドへの みち（レベル" + rest + "）" : (tag === "song" ? "きょくの きろく" : "イベントの きろく")); }
    });
    Object.keys(o.s || {}).forEach(function (kd) {
      if (kd !== "legend" && kd !== "maestro" && kd !== "seen") return;
      var sk = "fy_chunk_songs_" + kd + "_" + idx, cur1 = Storage.get(sk, []);
      if (!Array.isArray(cur1)) cur1 = [];
      var added1 = 0;
      (o.s[kd] || []).forEach(function (id) { if (typeof id === "string" && cur1.indexOf(id) === -1) { cur1.push(id); added1++; } });
      if (added1) { Storage.set(sk, cur1); done.push(kd === "seen" ? "いままでの きょく " + cur1.length + "きょく" : "ノーミスの きょく " + cur1.length + "きょく"); }
    });
    if (o.p && typeof o.p === "object") {
      var pk = "fy_pass_" + idx, curP = Storage.get(pk, {}), addP = 0;
      if (!curP || typeof curP !== "object") curP = {};
      Object.keys(o.p).forEach(function (c) { if (/^\d{2}$/.test(c) && !curP[c]) { curP[c] = String(o.p[c]); addP++; } });
      if (addP) { Storage.set(pk, curP); done.push("ふよみテスト ごうかく " + Object.keys(curP).length + "きょく"); }
    }
    if (o.q && typeof o.q === "object") {
      var qk = "fy_play_" + idx, curQ = Storage.get(qk, {}), addQ = 0;
      if (!curQ || typeof curQ !== "object") curQ = {};
      Object.keys(o.q).forEach(function (c) { if (/^\d{2}$/.test(c) && !curQ[c]) { curQ[c] = String(o.q[c]); addQ++; } });
      if (addQ) { Storage.set(qk, curQ); done.push("えんそう ごうかく " + Object.keys(curQ).length + "きょく"); }
    }
    var mk = "fy_chunk_max_" + idx;
    if ((o.m | 0) > Storage.getNumber(mk, 0)) { Storage.set(mk, o.m | 0); done.push("ひらいている レベル"); }
    var list = getHankoList(idx), have = {};
    list.forEach(function (d) { have[d] = 1; });
    var added = 0;
    (o.h || []).forEach(function (d) {
      if (!/^\d{8}$/.test(d)) return;
      var ds = d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6, 8);
      if (!have[ds]) { list.push(ds); have[ds] = 1; added++; }
    });
    if (added) { list.sort(); if (list.length > 60) list = list.slice(list.length - 60); Storage.set("fy_hanko_" + idx, list); done.push("ハンコ " + added + "日ぶん"); }
    try { initProfiles(); } catch (e) {}
    if (!done.length) return { ok: true, msg: "この端末には、すでに同じか、それ以上の記録があります。新しく書き込む記録は、ありませんでした。" };
    var uniq = done.filter(function (x, i) { return done.indexOf(x) === i; });
    return { ok: true, msg: "復元しました。\n・" + uniq.join("\n・") };
  }
  window.fyShowBackup = function () {
    var idx = activeProfileIndex, code = makeChunkBackup(idx);
    openOverlay(
      '<div style="font-size:18px;font-weight:900;margin-bottom:6px;">📤 きろくを うつす コード</div>' +
      '<div style="font-size:12.5px;line-height:1.6;color:#806c5a;margin-bottom:8px;">あたらしい たんまつに かえる ときに つかいます。<br>「レジェンドへの みち」の きろくと、ハンコの 日を うつせます。<br>プレイヤー：<b>' + esc(profiles[idx] || "") + '</b> さん</div>' +
      '<textarea id="fyBkCode" readonly style="width:100%;height:110px;font-size:10px;padding:6px;border:2px solid #eadcc8;border-radius:10px;box-sizing:border-box;word-break:break-all;-webkit-user-select:text;user-select:text;">' + code + '</textarea>' +
      '<button id="fyBkCopy" style="width:100%;margin-top:6px;padding:10px;font-size:15px;font-weight:800;border:none;border-radius:10px;background:#5c6bc0;color:#fff;">コードを コピー</button>' +
      window.fyLineBtn(window.fyRestoreText('【ふよみ】' + (profiles[idx] || '') + ' さんの きろくの うつしコード\n' + code, code), 'LINEで じぶんに おくる') +
      '<div style="font-size:12px;line-height:1.6;color:#806c5a;margin:8px 0;">コピーして、じぶんに LINE などで おくっておくと、あたらしい たんまつで「🔁 記録の復元」に はれます。</div>'
    );
    document.getElementById("fyBkCopy").addEventListener("click", function () {
      var ta = document.getElementById("fyBkCode"), ok = false;
      try { ta.focus(); ta.select(); ta.setSelectionRange(0, 99999); ok = document.execCommand("copy"); } catch (e) {}
      this.textContent = ok ? "コピーしました" : "コードを ながおしして コピーしてね";
    });
  };

  window.__fyRestoreTest = { pick: function (r) { return pickCode(r); }, chunk: function (i) { return makeChunkBackup(i); }, apply: function (r, i) { return applyRestore(r, i); } };
  function applyRestore(raw, idx) {
    if (/^FYC1\./.test(pickCode(raw))) return applyChunkRestore(raw, idx);
    var p = parseRestoreCode(raw);
    if (p.err) return { ok: false, msg: p.err };
    var cur = profiles[idx] || "";
    if (cleanName(p.name) !== cleanName(cur)) {
      return { ok: false, msg: "このコードは「" + p.name + "」さん用です。いまのプレイヤーは「" + cur + "」さんです。プレイヤーを選びなおしてください。" };
    }
    var done = [];
    if (restoreMaster(idx, "treble", p.dt, p.name)) done.push("ト音記号マスター");
    if (restoreMaster(idx, "bass", p.db, p.name)) done.push("ヘ音記号マスター");
    if (restoreMaster(idx, "master", p.dm, p.name)) done.push("ふよみマスター");
    if (p.tot > perfTotal(idx)) { Storage.set("fy_perfect_total_" + idx, p.tot); done.push("20問 全部一発正解 " + p.tot + "回"); }
    if (p.rb > runBest(idx)) { Storage.set("fy_run_best_" + idx, p.rb); done.push("連続の最高 " + p.rb + "回"); }
    if (p.rn > runNow(idx)) { Storage.set("fy_run_now_" + idx, p.rn); done.push("連続 現在 " + p.rn + "回"); }
    if (p.tp > Storage.getNumber("fy_tp_" + idx, 0)) { Storage.set("fy_tp_" + idx, p.tp); done.push("トレーニングポイント " + p.tp + " p"); }
    if (p.lt > 0 && ensureLevels(idx, "treble", p.lt)) done.push("ト音記号 レベル" + p.lt + "まで合格");
    if (p.lb > 0 && ensureLevels(idx, "bass", p.lb)) done.push("ヘ音記号 レベル" + p.lb + "まで合格");
    if (p.la > 0 && ensureLevels(idx, "all", p.la)) done.push("全カード レベル" + p.la + "まで合格");
    try { initProfiles(); } catch (e) {}
    if (!done.length) return { ok: true, msg: "この端末には、すでに同じか、それ以上の記録があります。新しく書き込む記録は、ありませんでした。" };
    return { ok: true, msg: "復元しました。\n・" + done.join("\n・") };
  }

  /* リンクを タップして 復元：コードの なまえと おなじ プレイヤーに じどうで いれる */
  window.fyLinkRestore = function (raw) {
    var code = pickCode(raw), name = "";
    try {
      var parts = code.split("."), payload = b64dec(parts[1]);
      if (parts.length !== 3 || signOf(payload) !== parts[2]) return { ok: false, msg: "コードが 正しくありません。リンクが 途中で 切れていないか、たしかめてください。" };
      if (parts[0] === "FYC1") name = JSON.parse(payload.slice(5)).n;
      else name = payload.split("|")[1];
    } catch (e) { return { ok: false, msg: "コードを 読めませんでした。" }; }
    var idx = -1;
    for (var i = 0; i < profiles.length; i++) { if (isRegistered(i) && cleanName(profiles[i]) === cleanName(name)) idx = i; }
    if (idx < 0) return { ok: false, msg: "「" + name + "」さんの プレイヤーが、この端末に ありません。先に、この なまえで プレイヤーを つくってから、もういちど リンクを タップしてください。" };
    var r = applyRestore(code, idx); r.name = name; return r;
  };

  /* 復元の入力画面（「きろくと コード」のページから） */
  function showRestoreForm() {
    var idx = activeProfileIndex;
    openOverlay(
      '<div style="font-size:18px;font-weight:900;margin-bottom:6px;">🔁 記録の復元</div>' +
      '<div style="font-size:12.5px;line-height:1.6;color:#806c5a;margin-bottom:8px;">先生から届いた「復元コード」、または 前の たんまつで つくった「うつすコード」を、貼ってください。<br>いまのプレイヤー：<b>' + esc(profiles[idx] || "") + '</b> さん</div>' +
      '<textarea id="fyRestoreIn" style="width:100%;height:90px;font-size:13px;padding:8px;border:2px solid #eadcc8;border-radius:10px;box-sizing:border-box;-webkit-user-select:text;user-select:text;" placeholder="FY1.…"></textarea>' +
      '<button id="fyRestoreGo" style="width:100%;margin-top:6px;padding:10px;font-size:15px;font-weight:800;border:none;border-radius:10px;background:#ff7043;color:#fff;">復元する</button>' +
      '<div id="fyRestoreMsg" style="font-size:13px;line-height:1.6;margin:8px 0;white-space:pre-line;text-align:left;"></div>'
    );
    document.getElementById("fyRestoreGo").addEventListener("click", function () {
      var r = applyRestore(document.getElementById("fyRestoreIn").value, activeProfileIndex);
      var m = document.getElementById("fyRestoreMsg");
      m.textContent = r.msg;
      m.style.color = r.ok ? "#2e7d32" : "#d84315";
    });
  }

  function runNow(idx) { return Storage.getNumber("fy_run_now_" + idx, 0); }
  function runBest(idx) { return Storage.getNumber("fy_run_best_" + idx, 0); }
  function perfTotal(idx) { return Storage.getNumber("fy_perfect_total_" + idx, 0); }

  window.showCardCodes = function () {
    var idx = activeProfileIndex;
    var now = Date.now();
    var limit = CODE_DAYS * 86400000;
    var all = getAch(idx).slice().sort(function (a, b) { return b.t - a.t; });
    var visible = all.filter(function (r) { return now - r.t < limit; });

    var html = '<div style="font-size:18px;font-weight:900;margin-bottom:8px;">🎖 きろくと コード</div>';

    /* ずっと のこる たっせい */
    var lines = "";
    ACH_LINES.forEach(function (a) {
      var r = findAch(idx, a[0]);
      lines += '<div style="font-size:14px;margin:3px 0;' + (r ? 'font-weight:800;color:#5b4636;' : 'color:#bbb;') + '">' + a[1] + (r ? ' ✓ ' + dmd(r) : ' …まだ') + '</div>';
    });
    html += '<div style="background:#fdf8ed;border-radius:12px;padding:8px;margin-bottom:10px;">' + lines + '</div>';

    /* いっぱつ せいかい の きろく（20もん） */
    html += '<div style="background:#fffbea;border:1px dashed #ffe082;border-radius:12px;padding:8px;margin-bottom:10px;text-align:left;font-size:13px;line-height:1.8;color:#5b4636;">' +
      '<div style="font-weight:800;">✅ 20もん ぜんぶ いっぱつ せいかい</div>' +
      '<div>れんぞく　いま <b style="color:#e65100;font-size:16px;">' + runNow(idx) + '</b> かい ／ さいこう <b style="color:#e65100;font-size:16px;">' + runBest(idx) + '</b> かい</div>' +
      '<div>ぜんぶで <b style="color:#e65100;font-size:16px;">' + perfTotal(idx) + '</b> かい</div>' +
      '</div>';

    if (visible.length) {
      visible.forEach(function (r) { html += cardHtml(r); });
      html += '<div style="font-size:12px;color:#806c5a;margin-bottom:8px;">スクショして せんせいに おくってね。<br>コードは ' + CODE_DAYS + '日で みえなくなるよ。</div>';
    } else {
      html += '<div style="font-size:13px;line-height:1.6;margin-bottom:10px;color:#806c5a;">いま みえる コードは ないよ。<br>コードは ' + CODE_DAYS + '日で みえなくなるよ。</div>';
    }
    html += '<button id="fyRestoreBtn" style="width:100%;margin:2px 0 4px;padding:8px;font-size:12px;font-weight:700;border:1px dashed #b0a090;border-radius:10px;background:#fff;color:#806c5a;">🔁 記録の復元（先生から コードが 届いたとき）</button>';
    html += '<button id="fyBackupBtn" style="width:100%;margin:2px 0 4px;padding:8px;font-size:12px;font-weight:700;border:1px dashed #b0a090;border-radius:10px;background:#fff;color:#806c5a;">📤 きろくを うつす コードを つくる（きかい へんこう）</button>';
    openOverlay(html);
    var rbtn = document.getElementById("fyRestoreBtn");
    if (rbtn) rbtn.addEventListener("click", showRestoreForm);
    var bbtn = document.getElementById("fyBackupBtn");
    if (bbtn) bbtn.addEventListener("click", function () { window.fyShowBackup(); });
  };

  /* トップ画面：スタンプの表示は やめて、「きろくと コード」のボタンだけ */
  window.renderStampMini = function (idx) {
    var container = document.getElementById("stampMiniBox");
    if (!container) return;
    container.style.cssText = "display:flex;justify-content:center;margin-top:4px;padding:2px;background:transparent;border:none;";
    container.innerHTML = '<button id="fyCodeBtn" style="border:none;background:#ffb300;color:#5b4636;font-size:13px;font-weight:800;border-radius:10px;padding:8px 16px;cursor:pointer;">🎖 きろくと コード</button>';
    var b = document.getElementById("fyCodeBtn");
    if (b) b.addEventListener("click", window.showCardCodes);
  };

  /* ===== 結果画面 =====
     「一発せいかいりつ」＝ 最初のタップで当てた問題の数 ÷ 問題の数。
     10問は れんしゅう（れんぞくには 数えない）。
     20問を ぜんぶ いっぱつで せいかい → れんぞくが ふえる。ちがったら 0に もどる（さいこうは のこる）。 */
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
    var kRun = "fy_run_now_" + idx, kBest = "fy_run_best_" + idx, kTot = "fy_perfect_total_" + idx;
    var m0 = Storage.getNumber(kM, 0);
    var cT = Storage.getNumber(kT, 0), cB = Storage.getNumber(kB, 0), cA = Storage.getNumber(kA, 0);
    var run0 = Storage.getNumber(kRun, 0);

    var run1 = run0;
    if (is20) {
      if (acc === 100) {
        run1 = run0 + 1;
        Storage.set(kTot, Storage.getNumber(kTot, 0) + 1);
        if (run1 > runBest(idx)) Storage.set(kBest, run1);
      } else {
        run1 = 0;
      }
      Storage.set(kRun, run1);
    }

    /* けっかを 日づけつきで きろく（保護者ページの「今週の頑張り」用） */
    try {
      var log = Storage.get("fy_log_" + idx, []);
      if (!Array.isArray(log)) log = [];
      log.push({ t: Date.now(), c: selectedClef, l: selectedLevel, n: N, a: acc });
      if (log.length > 300) log = log.slice(log.length - 300);
      Storage.set("fy_log_" + idx, log);
    } catch (e) {}

    /* マスターの声は、おいわい画面が出てから鳴らす（はじめて取るときだけ） */
    heldVoice = null;
    suppressMasterVoice = !!(acc === 100 && is20 && selectedLevel === 5 &&
      ((selectedClef === "treble" && !findAch(idx, "treble")) || (selectedClef === "bass" && !findAch(idx, "bass"))));

    /* もとの結果画面の「れんぞく」「100回目」の判定は つかわない */
    Storage.set(kS, 0);
    origShowResult.apply(this, arguments);
    suppressMasterVoice = false;
    Storage.set(kS, 0);
    Storage.set(kM, m0);
    Storage.set(kT, cT); Storage.set(kB, cB); Storage.set(kA, cA);

    /* 表示 */
    try {
      var rs = document.getElementById("resultScore");
      if (rs) rs.textContent = "いっぱつ せいかいりつ " + acc + "%";
      var sm = document.getElementById("resultStreakMsg");
      if (sm) {
        if (is20 && acc === 100) sm.textContent = "🔥 20もん ぜんぶ いっぱつ せいかい！ " + perfTotal(idx) + " かい";
        else if (is20 && run0 > 0) sm.textContent = "つぎは ぜんぶ いっぱつで せいかいを めざそう！";
        else if (!is20 && acc === 100) sm.textContent = "20もんにも ちょうせんしてみよう！";
        else sm.textContent = "";
      }
    } catch (e) {}

    /* 10問は「れんしゅう」、20問は「きろくに なる」：色で ちがいを 見せる */
    try {
      var mb = document.getElementById("fyModeBanner");
      if (!mb) {
        mb = document.createElement("div");
        mb.id = "fyModeBanner";
        var ttl = document.getElementById("resultTitleBig");
        ttl.parentNode.insertBefore(mb, ttl);
      }
      if (is20) {
        mb.textContent = "⭐ 20もん チャレンジ（きろくに なるよ）";
        mb.style.cssText = "font-size:13px;font-weight:800;padding:5px 14px;border-radius:20px;margin-bottom:8px;background:#fff3cd;color:#8a5a00;border:2px solid #f5a300;";
      } else {
        mb.textContent = "れんしゅう 10もん";
        mb.style.cssText = "font-size:13px;font-weight:800;padding:5px 14px;border-radius:20px;margin-bottom:8px;background:#e3f2fd;color:#1565c0;border:2px solid #64b5f6;";
      }
    } catch (e) {}

    /* おいわい：マスター（レベル5を 20問 いっぱつで 100%）。はじめての 1かいだけ */
    var cel = [];
    if (acc === 100 && is20 && selectedLevel === 5) {
      var mt = null;
      if (selectedClef === "treble") mt = addAch(idx, "treble", 0);
      else if (selectedClef === "bass") mt = addAch(idx, "bass", 0);
      else if (selectedClef === "all") mt = addAch(idx, "master", 0);
      if (mt) cel.push(mt);
    }

    try { initProfiles(); } catch (e) {}

    /* 10問かんぺき → 「つぎは きろくに のこる 20問に チャレンジ！」の声（ファンファーレが おわってから） */
    if (acc === 100 && !is20) {
      var s2 = getSoundDurationMs("sugoiAudio") || 1500;
      var f2 = getSoundDurationMs("tasseiFanfareAudio") || 3000;
      delayedTimers.push(setTimeout(function () { try { playAudioCloned("challenge20Audio"); } catch (e) {} }, s2 + 200 + f2 + 500));
    }

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

  try {
    var c20 = document.createElement("audio");
    c20.id = "challenge20Audio";
    c20.preload = "auto";
    c20.src = "20challenge.mp3";
    document.body.appendChild(c20);
    if (typeof soundIds !== "undefined" && soundIds.indexOf("challenge20Audio") === -1) soundIds.push("challenge20Audio");
  } catch (e) {}

  var origStartTraining = window.startTrainingWithConfig;
  window.startTrainingWithConfig = function () {
    firstTry = 0;
    qMistake = false;
    thinkPlayed = false;
    return origStartTraining.apply(this, arguments);
  };

  /* ===== 答えを 見る じかんは、子どもの ペースで =====
     せいかいの キーに ゆびを のせて いる あいだは、答えが のこる。ゆびを はなすと、つぎの問題へ。
     ちょんと おすと、これまでどおり すぐ つぎへ。 */
  var HOLD_MAX_MS = 6000;      /* ゆびが はなれた あいずが こなかったときの ほけん */
  var NEXT_AFTER_RELEASE_MS = 250;
  var fingerDown = false;
  var holdWait = false;
  var holdTimer = null;

  function scheduleNext(ms) {
    holdWait = false;
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    try { if (nextQuestionTimer !== null) { clearTimeout(nextQuestionTimer); nextQuestionTimer = null; } } catch (e) {}
    nextQuestionTimer = setTimeout(function () {
      nextQuestionTimer = null;
      if (trainingMode) showRandomTrainingQuestion();
    }, ms);
  }

  document.addEventListener("pointerdown", function () { fingerDown = true; }, true);
  ["pointerup", "pointercancel"].forEach(function (ev) {
    document.addEventListener(ev, function () {
      fingerDown = false;
      if (holdWait) scheduleNext(NEXT_AFTER_RELEASE_MS);
    }, true);
  });

  var origPressKey = window.pressKey;
  window.pressKey = function (key) {
    var wasLocked = trainingLocked;
    try {
      if (trainingMode && !trainingLocked && currentCards.length) {
        var card = currentCards[currentIndex];
        if (key === card.key) { if (!qMistake) firstTry++; }
        else { qMistake = true; }
      }
    } catch (e) {}
    var ret = origPressKey.apply(this, arguments);
    try {
      /* せいかいで つぎへ すすむ じゅんびが できたとき：ゆびが のっていれば、はなすまで まつ */
      if (trainingMode && !wasLocked && trainingLocked) {
        if (fingerDown) {
          holdWait = true;
          try { if (nextQuestionTimer !== null) { clearTimeout(nextQuestionTimer); nextQuestionTimer = null; } } catch (e) {}
          if (holdTimer) clearTimeout(holdTimer);
          holdTimer = setTimeout(function () { if (holdWait) scheduleNext(0); }, HOLD_MAX_MS);
        } else {
          scheduleNext(NEXT_AFTER_RELEASE_MS);
        }
      }
    } catch (e) {}
    return ret;
  };

  /* つぎの問題に かわる とき、答えを かくす 板が ゆっくり もどって、一しゅん 答えが 見えるのを ふせぐ */
  var origShowCurrentCard = window.showCurrentCard;
  window.showCurrentCard = function () {
    var cv = document.getElementById("trainingCover");
    if (cv) cv.style.transition = "none";
    var r = origShowCurrentCard.apply(this, arguments);
    if (cv) { void cv.offsetWidth; cv.style.transition = ""; }
    return r;
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

      var goBtn = document.querySelector(".profile-confirm-btn");
      if (goBtn) goBtn.style.display = "none";

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
    try {
      /* トップ画面の「れんぞく」は かくす（きろくは「きろくと コード」で見る） */
      var items = document.querySelectorAll(".my-stats-summary .my-stat-item");
      if (items[1]) items[1].style.display = "none";
      var fs = document.getElementById("fyStars");
      if (fs) fs.style.display = "none";
    } catch (e) {}
  };

  /* プレイヤーを えらんだ しゅんかんに きりかえる（スタートを おし わすれても、えらんだ人で あそべるように） */
  try {
    var psel = document.getElementById("profileSelect");
    if (psel) psel.addEventListener("change", function () { try { confirmProfileSelect(); } catch (e) {} });
  } catch (e) {}

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
    holdWait = false;
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
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
  /* いま どこまで 合格したか */
  function clefProgress(idx, clef) {
    var cleared = 0;
    for (var lv = 1; lv <= 5; lv++) {
      if (hasLevelCleared(idx, clef, lv)) cleared = lv; else break;
    }
    return cleared;
  }
  function progressText(idx, clef, label) {
    var c = clefProgress(idx, clef);
    if (clef === "bass" && !hasLevelCleared(idx, "treble", 1) && c === 0) return label + "：まだ始めていません（ト音記号レベル1の合格後）";
    if (clef === "all" && !(hasLevelCleared(idx, "treble", 5) && hasLevelCleared(idx, "bass", 5)) && c === 0) return label + "：まだ解放されていません";
    if (c >= 5) return label + "：全レベル合格";
    if (c === 0) return label + "：レベル1に挑戦中";
    return label + "：レベル" + (c + 1) + "に挑戦中（レベル" + c + "まで合格）";
  }

  /* 月曜はじまりの 1週間 */
  function weekStart(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var day = x.getDay();                 /* 0=日 */
    x.setDate(x.getDate() - ((day + 6) % 7));
    return x.getTime();
  }
  function weekStats(log, ws) {
    var days = {}, cnt = 0, sum = 0;
    log.forEach(function (e) {
      if (weekStart(new Date(e.t)) !== ws) return;
      days[localDateStr(new Date(e.t))] = 1;
      cnt++; sum += e.a;
    });
    return { days: Object.keys(days).length, cnt: cnt, avg: cnt ? Math.round(sum / cnt) : null };
  }

  window.renderParentCompareTable = function () {
    var html = '<div style="font-size:11.5px;line-height:1.7;background:#f7f7f7;border-radius:10px;padding:8px;margin-bottom:10px;text-align:left;">' +
      '<span style="color:#1565c0;font-weight:800;">■ 青い項目</span>：先生の復元コードで、戻せます。<br>' +
      '<span style="color:#9a9a9a;font-weight:800;">■ グレーの項目</span>：復元できません（復元した日から、また記録されます）。</div>';
    var any = false;
    profiles.forEach(function (n, idx) {
      if (!isRegistered(idx)) return;
      any = true;
      var doB = getDoTestBest(idx);
      var achs = ACH_LINES.map(function (a) { return findAch(idx, a[0]) ? a[1].replace(/^\S+\s/, "") + " ✓" : ""; }).filter(function (x) { return x; }).join("、");

      var log = Storage.get("fy_log_" + idx, []);
      if (!Array.isArray(log)) log = [];
      var last = log.length ? log[log.length - 1] : null;
      var recent = log.slice(-5);
      var recentAvg = recent.length ? Math.round(recent.reduce(function (s, e) { return s + e.a; }, 0) / recent.length) : null;
      var thisWs = weekStart(new Date());
      var tw = weekStats(log, thisWs), lw = weekStats(log, thisWs - 7 * 86400000);
      var clefName = { treble: "ト音記号", bass: "ヘ音記号", all: "全カード", "do": "6つのド" };
      var lastText = last
        ? "前回 " + last.a + "%（" + (clefName[last.c] || "") + (last.l ? " レベル" + last.l : "") + "・" + last.n + "問）／直近" + recent.length + "回の平均 " + recentAvg + "%"
        : "まだ記録がありません";
      var twText;
      if (tw.cnt === 0) twText = "今週はまだ練習していません";
      else {
        var arrow = "";
        if (lw.avg !== null) arrow = tw.avg > lw.avg ? " ↑" : (tw.avg < lw.avg ? " ↓" : " →");
        twText = "練習した日 " + tw.days + "日／トレーニング " + tw.cnt + "回／平均 " + tw.avg + "%" + (lw.avg !== null ? "（先週 " + lw.avg + "%" + arrow + "）" : "（先週は記録なし）");
      }

      html += '<div style="border:1px solid #eadcc8;border-radius:12px;padding:10px;margin-bottom:10px;background:#fff;text-align:left;">';
      html += '<div style="font-size:15px;font-weight:900;color:#5b4636;margin-bottom:6px;">' + esc(n) + ' さん</div>';
      var BL = '<div style="color:#1565c0;margin-bottom:4px;">', GR = '<div style="color:#9a9a9a;margin-bottom:4px;">';
      html += '<div style="font-size:12px;line-height:1.8;">' +
        BL + '<b>📘 今の挑戦</b><br>' +
          esc(progressText(idx, "treble", "ト音記号")) + '<br>' +
          esc(progressText(idx, "bass", "ヘ音記号")) + '<br>' +
          esc(progressText(idx, "all", "全カード")) + '</div>' +
        GR + '<b>📈 最近の一発正解率</b><br>' + esc(lastText) + '</div>' +
        GR + '<b>🗓 今週の頑張り（月〜日）</b><br>' + esc(twText) + '</div>' +
        BL + '<b>✅ 20問 全部一発正解</b> ' + perfTotal(idx) + '回（連続 現在' + runNow(idx) + '回／最高' + runBest(idx) + '回）</div>' +
        BL + '<b>🏅 トレーニングポイント</b> ' + ((typeof window.fyParentTP === "function") ? window.fyParentTP(idx) : "") + '</div>' +
        BL + '<b>🎖 マスター</b>：' + (achs || 'まだありません') + '</div>' +
        ((typeof window.fyParentChunk === "function") ? window.fyParentChunk(idx) : '') +
        GR + '<b>💮 今週のハンコ</b> ' + ((typeof window.fyParentStamps === "function") ? window.fyParentStamps(idx) : "") + '</div>' +
        GR + '<b>🔥 練習した日の連続</b> ' + calculateStreak(idx) + '日　<b>🎵 6つのド最高点</b> ' + (doB ? doB.accuracy + '%' : '-') + '</div>' +
        '</div>';
      html += '</div>';
    });
    if (!any) html = '<div style="font-size:12px;color:#806c5a;">まだ誰も登録されていません</div>';
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
      /* むかしの 100回目の テスト用ボタンは つかわない */
      window.resetParentPasswordByTeacher = function () {};   /* 保護者パスワードの リセットは つかわない */
      var tab3b = document.getElementById("teacherTab3");
      if (tab3b) {
        Array.prototype.forEach.call(tab3b.querySelectorAll("button"), function (bt) {
          var oc = bt.getAttribute("onclick") || "";
          if (oc.indexOf("setStreak99ForTest") !== -1 || oc.indexOf("resetLegendForTest") !== -1 || oc.indexOf("resetParentPasswordByTeacher") !== -1) bt.style.display = "none";
        });
        Array.prototype.forEach.call(tab3b.querySelectorAll("div"), function (dv) {
          if (dv.children.length === 0 && dv.textContent.indexOf("100回目のテスト") !== -1) dv.style.display = "none";
        });
      }
    } catch (e) {}

    try {
      var tab3 = document.getElementById("teacherTab3");
      if (tab3 && !document.getElementById("fyStampTest")) {
        var d = document.createElement("div");
        d.id = "fyStampTest";
        d.innerHTML =
          '<div style="font-size:12px;font-weight:bold;color:#5b4636;margin-bottom:6px;text-align:left;">🔍 コード かくにん（スクショの コードが 正しいか）</div>' +
          '<div style="text-align:left;font-size:11px;color:#806c5a;margin-bottom:4px;">教室ネーム・しゅるい・ひづけ を 入れると、正しい コードが 出ます。</div>' +
          '<input id="fcName" class="modal-input" placeholder="教室ネーム（スクショの なまえ）">' +
          '<select id="fcType" class="modal-input">' +
            '<option value="">▼ しゅるいを えらんでね</option>' +
            '<option value="treble">ト音記号マスター</option>' +
            '<option value="bass">ヘ音記号マスター</option>' +
            '<option value="master">ふよみマスター</option>' +
            '<option value="legend5">ふよみレジェンド（100曲）</option>' +
            '<option value="maestro">ふよみマエストロ（100曲）</option>' +
            '<option value="exchange">ポイント こうかん</option>' +
          '</select>' +
          '<input id="fcDate" class="modal-input" type="date">' +
          '<div style="text-align:left;font-size:11px;color:#806c5a;">「ポイント こうかん」のときだけ、スクショの 数字を 入れてね</div>' +
          '<div style="display:flex;gap:4px;"><input id="fcAmt" class="modal-input" type="number" min="0" placeholder="こうかんした p"><input id="fcRest" class="modal-input" type="number" min="0" placeholder="のこり p"></div>' +
          '<button class="modal-btn" style="background:#5c6bc0;font-size:12px;padding:8px;" onclick="fyCheckCode()">コードを 出す</button>' +
          '<div id="fcOut" style="font-size:22px;font-weight:900;letter-spacing:4px;margin:6px 0 12px;color:#3949ab;"></div>' +
          '<div style="font-size:12px;font-weight:bold;color:#5b4636;margin:4px 0 6px;text-align:left;">🔁 復元コードを つくる（名簿の きろくから）</div>' +
          '<div style="text-align:left;font-size:11px;color:#806c5a;margin-bottom:4px;">LINEで 保護者に 送ると、生徒さんの 端末の「きろくと コード」で 復元できます。</div>' +
          '<input id="frName" class="modal-input" placeholder="教室ネーム（ひらがな・すうじ）">' +
          '<div style="text-align:left;font-size:11px;color:#806c5a;">マスターの たっせい日（とっていなければ 空らん）</div>' +
          '<div style="text-align:left;font-size:11px;">ト音記号マスター<input id="frDt" class="modal-input" type="date"></div>' +
          '<div style="text-align:left;font-size:11px;">ヘ音記号マスター<input id="frDb" class="modal-input" type="date"></div>' +
          '<div style="text-align:left;font-size:11px;">ふよみマスター<input id="frDm" class="modal-input" type="date"></div>' +
          '<input id="frTot" class="modal-input" type="number" min="0" placeholder="20問 全部一発正解の 回数">' +
          '<input id="frRb" class="modal-input" type="number" min="0" placeholder="連続の 最高（回）">' +
          '<input id="frRn" class="modal-input" type="number" min="0" placeholder="連続の いま（回）">' +
          '<input id="frTp" class="modal-input" type="number" min="0" placeholder="トレーニングポイント（いま 何p）">' +
          '<div style="text-align:left;font-size:11px;color:#806c5a;">合格した レベル（0〜5）</div>' +
          '<div style="display:flex;gap:4px;margin-bottom:6px;">' +
            '<select id="frLt" class="modal-input" style="margin:0;"><option value="0">ト音 0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>' +
            '<select id="frLb" class="modal-input" style="margin:0;"><option value="0">ヘ音 0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>' +
            '<select id="frLa" class="modal-input" style="margin:0;"><option value="0">全カード 0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>' +
          '</div>' +
          '<button class="modal-btn" style="background:#5c6bc0;font-size:12px;padding:8px;" onclick="fyMakeRestore()">復元コードを 出す</button>' +
          '<textarea id="frOut" readonly style="width:100%;height:70px;font-size:11px;margin:6px 0 12px;box-sizing:border-box;-webkit-user-select:text;user-select:text;" placeholder="ここに コードが 出ます"></textarea>' +
          '<div style="font-size:12px;font-weight:bold;color:#5b4636;margin-bottom:6px;text-align:left;">🧪 たっせいの きろくの テスト</div>' +
          '<button class="modal-btn" style="background:#2e7d32;font-size:12px;padding:8px;margin-bottom:12px;" onclick="fyAchReset()">🧪 いまのプレイヤーの たっせいの きろくと れんぞくを リセット</button>';
        tab3.insertBefore(d, tab3.firstChild);
        var dt = document.getElementById("fcDate");
        if (dt) dt.value = localDateStr(new Date());
      }
    } catch (e) {}
  };

  /* ===== ぜんぶの コードを、1つの はこで かくにん（LINEの メッセージを そのまま 貼る） ===== */
  window.fyCheckAnyCore = function (raw) {
    var t = String(raw || "").normalize("NFKC"), m;
    function esc3(x) { return String(x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function ng(msg) { return { kind: "text", html: '<div style="color:#c62828;font-weight:800;font-size:14px;">❌ ' + msg + '</div>' }; }
    if ((m = t.match(/FYE1\.[A-Za-z0-9_\-]+\.[A-Z0-9]{6}/))) return { kind: "event", token: m[0] };
    if ((m = t.match(/FYC1\.[A-Za-z0-9_\-]+\.[A-Z0-9]{6}/))) {
      var parts = m[0].split("."), payload;
      try { payload = b64dec(parts[1]); } catch (e) { return ng("コードを 読めません（切れていませんか？）"); }
      if (signOf(payload) !== parts[2]) return ng("しるしが あいません（書きかえられたか、途中で 切れています）");
      var o; try { o = JSON.parse(payload.slice(5)); } catch (e2) { return ng("コードの 中みが ちがいます"); }
      var recs = Object.keys(o.r || {}).filter(function (k) { return k.indexOf("rec_") === 0; }).length;
      var pc = o.p ? Object.keys(o.p).length : 0, qc = o.q ? Object.keys(o.q).length : 0;
      return { kind: "text", html: '<div style="color:#2e7d32;font-weight:800;font-size:14px;">✅ 本物の「うつしコード」です（生徒が 機種変更で つかうコード）</div>' +
        '<div style="font-size:13px;line-height:1.7;text-align:left;">なまえ：<b>' + esc3(o.n) + '</b><br>ひらいている レベル：' + (o.m | 0) + '<br>レベルの きろく：' + recs + ' こ　／　ふよみテスト ごうかく：' + pc + ' 曲　／　えんそう ごうかく：' + qc + ' 曲　／　ハンコ：' + ((o.h || []).length) + ' 日<br><span style="color:#806c5a;">先生が することは ありません。生徒が あたらしい 端末で「きろくの 復元」に はります。</span></div>' };
    }
    if (/FY[12]\.[A-Za-z0-9_\-]+\.[A-Z0-9]{6}/.test(t)) return { kind: "text", html: '<div style="font-size:14px;font-weight:800;">これは 先生が つくった「復元コード」です。（保護者に おくる もの）</div>' };
    var nm = t.match(/【ふよみ】\s*([^\n]+?)\s*さん/), cd = t.match(/コード[：:]\s*([A-Z0-9]{4})/);
    if (!nm || !cd) {
      if (/\b\d{2}-[A-Z0-9]{6}\b/.test(t)) return { kind: "text", html: '<div style="font-size:14px;font-weight:800;">これは 先生が だした「ごうかくコード」です（ふよみテスト か えんそう）。生徒の アプリで つかう もの</div>' };
      return ng("コードの かたちが わかりません。LINEの メッセージを、ぜんぶ 貼ってね。");
    }
    var name = cleanName(nm[1]), code = cd[1], found = null, ds = [];
    for (var i = 0; i < 15; i++) ds.push(localDateStr(new Date(Date.now() - i * 86400000)));
    var am = t.match(/ポイント\s*こうかん\s*(\d+)\s*p/), rm = t.match(/のこり\s*(\d+)\s*p/);
    ds.forEach(function (d) {
      if (found) return;
      ["treble", "bass", "master", "legend5", "maestro"].forEach(function (ty) { if (!found && codeFor(name, ty, 0, d) === code) found = { label: INFO[ty].label, d: d }; });
      for (var n = 1; n <= 99 && !found; n++) if (codeFor(name, "stamp", n, d) === code) found = { label: "スタンプカード " + n + " まいめ", d: d };
      for (var n2 = 100; n2 <= 1000 && !found; n2 += 100) if (codeFor(name, "legend", n2, d) === code) found = { label: "ふよみレジェンド（" + n2 + "回）", d: d };
      if (!found && am && rm && window.fyExchangeCode(name, parseInt(am[1], 10), parseInt(rm[1], 10), d) === code) found = { label: "ポイント こうかん " + am[1] + "p（のこり " + rm[1] + "p）", d: d };
    });
    if (found) return { kind: "text", html: '<div style="color:#2e7d32;font-weight:800;font-size:14px;">✅ 本物の コードです</div><div style="font-size:13px;line-height:1.7;text-align:left;">なまえ：<b>' + esc3(name) + '</b><br>しゅるい：<b>' + esc3(found.label) + '</b><br>日づけ：' + found.d + '</div>' };
    return ng("あいません。なまえ「" + esc3(name) + "」、コード「" + esc3(code) + "」。（15日より 前の コードは、「コード かくにん」で 日づけを 入れて しらべてね）");
  };

  window.fyCheckCode = function () {
    var name = cleanName(document.getElementById("fcName").value);
    var type = document.getElementById("fcType").value;
    var date = document.getElementById("fcDate").value;
    if (!name || !date) { document.getElementById("fcOut").textContent = "なまえと ひづけを いれてね"; return; }
    if (!type) {
      /* しゅるいを えらび わすれたとき：ポイントの 数字が 入っていれば ポイントこうかん */
      var a0 = document.getElementById("fcAmt").value, r0 = document.getElementById("fcRest").value;
      if (a0 !== "" && r0 !== "") { type = "exchange"; document.getElementById("fcType").value = "exchange"; }
      else { document.getElementById("fcOut").textContent = "しゅるいを えらんでね"; return; }
    }
    if (type === "exchange") {
      var amt = document.getElementById("fcAmt").value, rest = document.getElementById("fcRest").value;
      if (amt === "" || rest === "") { document.getElementById("fcOut").textContent = "こうかんした p と のこり p を いれてね"; return; }
      document.getElementById("fcOut").textContent = window.fyExchangeCode(name, parseInt(amt, 10) || 0, parseInt(rest, 10) || 0, date);
      return;
    }
    document.getElementById("fcOut").textContent = codeFor(name, type, 0, date);
  };

  window.fyMakeRestore = function () {
    var name = cleanName(document.getElementById("frName").value);
    var err = nameError(name);
    if (err) { document.getElementById("frOut").value = "教室ネームを 入れてください（" + err + "）"; return; }
    var v = function (id) { return document.getElementById(id).value; };
    var code = makeRestoreCode({
      name: name, dt: v("frDt"), db: v("frDb"), dm: v("frDm"),
      tot: parseInt(v("frTot"), 10) || 0, rb: parseInt(v("frRb"), 10) || 0, rn: parseInt(v("frRn"), 10) || 0,
      lt: parseInt(v("frLt"), 10) || 0, lb: parseInt(v("frLb"), 10) || 0, la: parseInt(v("frLa"), 10) || 0,
      tp: parseInt(v("frTp"), 10) || 0
    });
    var out = document.getElementById("frOut");
    out.value = code;
    try { out.focus(); out.select(); } catch (e) {}
  };

  window.fyAchReset = function () {
    var i = activeProfileIndex;
    Storage.set("fy_ach_" + i, []);
    Storage.set("fy_run_now_" + i, 0);
    Storage.set("fy_run_best_" + i, 0);
    Storage.set("fy_perfect_total_" + i, 0);
    initProfiles();
    alert("たっせいの きろくと れんぞくを リセットしました。");
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
    var badge = document.getElementById("qCountBadge");
    badge.textContent = "あと " + (targetValue - trainingCorrectCount) + " 問";
    badge.style.background = (targetValue >= 20) ? "#f5a300" : "#42a5f5";

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

/* =====================================================================
   v13：トレーニングポイント（ハンコ と 週の ポイント）
   ・トレーニング（10問・20問）を さいごまで やりきると、その日の ハンコ。6つのドは かぞえない。
   ・1週間は 月〜日。週が かわって アプリを ひらくと、先週の ポイントが 入る。
   ・1〜2日で 1p、3〜4日で 2p、5〜6日で 3p、7日(パーフェクト)で 5p、0日は 0p。
   ・10ポイントずつ こうかん。こうかんの きろくと コードが 画面に 出る
   ===================================================================== */
(function () {
  var VOICE1_FILE = "hanko-motte.mp3";   /* トレーニングして ハンコを もらおう */
  var VOICE2_FILE = "point-kokan.mp3";   /* トレーニングポイントは きょうしつで… */

  var K = {
    stamps: function (i) { return "fy_hanko_" + i; },        /* ハンコの 日づけ（"2026-11-02" の 一覧） */
    tp:     function (i) { return "fy_tp_" + i; },           /* トレーニングポイント */
    paid:   function (i) { return "fy_tp_paid_" + i; },      /* まだ ポイントに していない いちばん 古い 週の はじまり日 */
    notice: function (i) { return "fy_tp_notice_" + i; }     /* 「先週は…」の おしらせ（見せるまで のこる） */
  };

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dstr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseD(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function weekStartOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }

  function pointsFor(days) { return days >= 7 ? 5 : days >= 5 ? 3 : days >= 3 ? 2 : days >= 1 ? 1 : 0; }

  function getStamps(idx) {
    var s = Storage.get(K.stamps(idx), []);
    return Array.isArray(s) ? s : [];
  }
  function daysIn(stamps, startDate) {
    var n = 0;
    for (var i = 0; i < 7; i++) { if (stamps.indexOf(dstr(addDays(startDate, i))) !== -1) n++; }
    return n;
  }
  function daysThisWeek(idx) { return daysIn(getStamps(idx), weekStartOf(new Date())); }
  function getTP(idx) { return Storage.getNumber(K.tp(idx), 0); }

  /* ハンコを おす（その日 はじめてなら true） */
  var justStamped = {};   /* いま ハンコを おした プレイヤー（トップで 光らせる） */
  function giveStamp(idx) {
    var t = dstr(new Date());
    var s = getStamps(idx);
    if (s.indexOf(t) !== -1) return false;
    justStamped[idx] = { t: 0 };
    s.push(t);
    s.sort();
    if (s.length > 60) s = s.slice(s.length - 60);
    Storage.set(K.stamps(idx), s);
    return true;
  }

  /* 先週までの ぶんを ポイントに する（週が かわって はじめて ひらいたとき） */
  function settle(idx) {
    var cur = dstr(weekStartOf(new Date()));
    var paid = Storage.get(K.paid(idx), null);
    if (!paid || typeof paid !== "string") { Storage.set(K.paid(idx), cur); return; }
    if (paid >= cur) return;
    var stamps = getStamps(idx), total = 0, lastDays = 0;
    var w = parseD(paid), curD = parseD(cur);
    var guard = 0;
    while (w < curD && guard++ < 400) {
      lastDays = daysIn(stamps, w);
      total += pointsFor(lastDays);
      w = addDays(w, 7);
    }
    Storage.set(K.tp(idx), getTP(idx) + total);
    Storage.set(K.paid(idx), cur);
    if (total > 0 || lastDays > 0) {
      var old = Storage.get(K.notice(idx), null);
      Storage.set(K.notice(idx), { days: lastDays, pts: total + (old && old.pts ? old.pts : 0) });
    }
  }

  function hintText(d) {
    if (d >= 7) return "ぜんぶ そろったよ！ 5ポイント ゲット！";
    var need, pts;
    if (d < 1) { need = 1 - d; pts = 1; }
    else if (d < 3) { need = 3 - d; pts = 2; }
    else if (d < 5) { need = 5 - d; pts = 3; }
    else { need = 7 - d; pts = 5; }
    return "あと " + need + "日で " + pts + "ポイント！";
  }

  /* ---- 声 ---- */
  function addAudio(id, src) {
    try {
      var a = document.createElement("audio");
      a.id = id; a.preload = "auto"; a.src = src;
      document.body.appendChild(a);
      if (typeof soundIds !== "undefined" && soundIds.indexOf(id) === -1) soundIds.push(id);
    } catch (e) {}
  }
  addAudio("hankoMotteAudio", VOICE1_FILE);
  addAudio("pointKokanAudio", VOICE2_FILE);

  /* 画面に はじめて さわるまでは 音が 出せないので、さわった あとに 鳴らす */
  function speakWhenReady(id, stillWanted) {
    function go() { try { if (!stillWanted || stillWanted()) playAudioCloned(id); } catch (e) {} }
    if (typeof audioInitialized !== "undefined" && audioInitialized) { go(); return; }
    document.addEventListener("pointerdown", function once() {
      document.removeEventListener("pointerdown", once, true);
      setTimeout(go, 120);
    }, true);
  }

  /* ---- 見た目の もと ---- */
  try {
    var st = document.createElement("style");
    st.textContent =
      "@keyframes fyPon{0%{transform:scale(2.2) rotate(-12deg);opacity:0}60%{transform:scale(.9) rotate(-12deg);opacity:1}100%{transform:scale(1) rotate(-12deg);opacity:1}}" +
      ".fy-stamp-pon{animation:fyPon .45s ease-out both}" +
      "@keyframes fyBig{0%{transform:scale(3.2) rotate(-18deg);opacity:0}55%{transform:scale(.82) rotate(-12deg);opacity:1}75%{transform:scale(1.12) rotate(-12deg)}100%{transform:scale(1) rotate(-12deg);opacity:1}}" +
      "@keyframes fyRing{0%{transform:scale(.5);opacity:.9}100%{transform:scale(2.4);opacity:0}}" +
      ".fy-big-pon{display:inline-block;font-size:76px;line-height:1;animation:fyBig .6s cubic-bezier(.2,.8,.3,1) both}" +
      ".fy-ring{position:absolute;left:50%;top:50%;width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:50%;border:4px solid #ff8a65;opacity:0;animation:fyRing .7s ease-out .25s both;pointer-events:none}" +
      "@keyframes fyGlow{0%{transform:scale(1);filter:drop-shadow(0 0 0 rgba(255,160,0,0))}30%{transform:scale(1.45);filter:drop-shadow(0 0 10px rgba(255,160,0,1))}60%{transform:scale(1);filter:drop-shadow(0 0 4px rgba(255,160,0,.6))}100%{transform:scale(1);filter:drop-shadow(0 0 0 rgba(255,160,0,0))}}" +
      ".fy-glow{animation:fyGlow 1s ease-in-out .3s 3 both}" +
      "@keyframes fyNudge{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,112,67,.5)}50%{transform:scale(1.1);box-shadow:0 0 0 8px rgba(255,112,67,0)}}" +
      ".fy-nudge{animation:fyNudge 1.6s ease-in-out infinite}";
    document.head.appendChild(st);
  } catch (e) {}

  var DAY_LABEL = ["月", "火", "水", "木", "金", "土", "日"];

  function dotHtml(kind) {
    var base = "width:42px;height:42px;border-radius:50%;margin:4px auto 0;display:flex;align-items:center;justify-content:center;";
    if (kind === "on") return '<div style="' + base + 'font-size:38px;line-height:1;background:transparent;">💮</div>';
    if (kind === "onNew") return '<div class="fy-glow" style="' + base + 'font-size:38px;line-height:1;background:transparent;">💮</div>';
    if (kind === "tmp") return '<div id="fyTmpStamp" class="fy-nudge" style="' + base + 'font-size:13px;font-weight:800;background:#fff;border:2px dashed #ff7043;color:#ff7043;cursor:pointer;">きょう</div>';
    return '<div style="' + base + 'font-size:22px;background:#e6e6e6;color:#aaa;">・</div>';
  }

  /* ---- トップ画面の ハンコ ---- */
  var voice1Done = {};   /* きょう この 起動で、声を 鳴らした 枠 */

  var glowWait = null;
  function renderTop() {
    var anchor = document.getElementById("stampMiniBox");
    if (!anchor || !anchor.parentNode) return;
    var box = document.getElementById("fyHankoTop");
    if (!box) {
      box = document.createElement("div");
      box.id = "fyHankoTop";
      box.style.cssText = "background:#fdf8ed;border-radius:12px;padding:12px 8px;margin:8px 0 4px;text-align:center;";
      anchor.parentNode.insertBefore(box, anchor);
    }
    var idx = activeProfileIndex;
    if (!isRegistered(idx)) { box.style.display = "none"; return; }
    box.style.display = "block";

    var stamps = getStamps(idx);
    var ws = weekStartOf(new Date());
    var todayS = dstr(new Date());
    var d = daysIn(stamps, ws);

    var glowToday = false;
    /* かたまり読み（別ページ）で ハンコを おしたあと、トップに もどったとき 1回だけ 光らせる */
    /* トップが ほんとうに 見えている ときだけ 光らせる（合言葉の 画面や おしらせの うらで 光り終わらないように） */
    var topVisible = false;
    try {
      var selE = document.getElementById("selectScreen");
      topVisible = !!(selE && !selE.classList.contains("hidden") && !gateVisible() && !noticeOpen);
    } catch (e) {}
    try {
      var fk = "fy_hanko_new_" + idx, fv = parseInt(localStorage.getItem(fk), 10);
      if (fv) {
        if (Date.now() - fv >= 600000) localStorage.removeItem(fk);
        else if (topVisible) { localStorage.removeItem(fk); justStamped[idx] = { t: 0 }; }
        else if (!glowWait) {   /* まだ 見えていないので、見えるまで まつ */
          glowWait = setInterval(function () {
            var s2 = document.getElementById("selectScreen");
            if (s2 && !s2.classList.contains("hidden") && !gateVisible() && !noticeOpen) { clearInterval(glowWait); glowWait = null; try { renderTop(); } catch (e) {} }
          }, 400);
          setTimeout(function () { if (glowWait) { clearInterval(glowWait); glowWait = null; } }, 30000);
        }
      }
    } catch (e) {}
    var js = justStamped[idx];
    if (js && (topVisible || js.t)) {
      if (!js.t) js.t = Date.now();
      if (Date.now() - js.t < 5000) glowToday = true; else delete justStamped[idx];
    }
    var row = "";
    for (var i = 0; i < 7; i++) {
      var ds = dstr(addDays(ws, i));
      var kind = stamps.indexOf(ds) !== -1 ? ((glowToday && ds === todayS) ? "onNew" : "on") : (ds === todayS ? "tmp" : "off");
      row += '<div style="flex:1;text-align:center;font-size:14px;font-weight:800;color:#5b4636;">' + DAY_LABEL[i] + dotHtml(kind) + '</div>';
    }
    box.innerHTML =
      '<div style="font-size:16px;font-weight:900;color:#5b4636;">今週の ハンコ（月〜日）</div>' +
      '<div style="display:flex;gap:2px;margin:8px 0;">' + row + '</div>' +
      '<div style="font-size:17px;font-weight:900;color:#5b4636;">' + hintText(d) + '</div>' +
      '<div style="font-size:14px;color:#5b4636;margin-top:6px;">トレーニングポイント <span style="font-size:26px;font-weight:900;color:#e65100;">' + getTP(idx) + ' p</span></div>';

    var tmp = document.getElementById("fyTmpStamp");
    if (tmp) tmp.addEventListener("click", function () { try { playAudioCloned("seikaiAudio"); } catch (e) {} });
  }

  /* ---- 「先週は…」の おしらせ ---- */
  var noticeOpen = false;

  function gateVisible() {
    var g = document.getElementById("gateMsg");
    return !!(g && g.getClientRects().length > 0);
  }

  function maybeNotice() {
    if (noticeOpen) return;
    var idx = activeProfileIndex;
    if (!isRegistered(idx)) return;
    var sel = document.getElementById("selectScreen");
    if (!sel || sel.classList.contains("hidden")) return;
    if (gateVisible()) return;
    var n = Storage.get(K.notice(idx), null);
    if (!n) return;

    noticeOpen = true;
    voice1Done[idx] = true;     /* おしらせの 声を 優先する */
    var ov = document.createElement("div");
    ov.id = "fyNotice";
    ov.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";
    var msg = n.pts > 0 ? '<div style="font-size:34px;font-weight:900;color:#ff5722;">+ ' + n.pts + ' ポイント</div>'
                        : '<div style="font-size:16px;font-weight:800;color:#806c5a;">こんしゅうは もっと がんばろう！</div>';
    ov.innerHTML =
      '<div style="background:#fff;border-radius:18px;padding:18px;width:100%;max-width:340px;text-align:center;color:#5b4636;box-shadow:0 4px 18px rgba(0,0,0,.2);">' +
      '<div style="font-size:36px;">🎉</div>' +
      '<div style="font-size:16px;font-weight:900;margin:4px 0 6px;">先週は ' + n.days + '日 がんばったよ！</div>' + msg +
      '<div style="font-size:13px;margin:8px 0;">いま ぜんぶで <span style="font-size:20px;font-weight:900;color:#e65100;">' + getTP(idx) + ' p</span></div>' +
      '<div style="word-break:keep-all;line-height:1.6;background:#fff3cd;border:2px solid #f5a300;border-radius:14px;padding:8px 10px;font-size:12px;font-weight:800;color:#8a5a00;margin:8px 0;">🔊「トレーニングポイントは<br>きょうしつで ごほうびと<br>こうかんできるよ！」</div>' +
      '<button id="fyNoticeClose" style="width:100%;border:none;border-radius:12px;padding:11px;font-size:15px;font-weight:800;background:#ffb300;color:#5b4636;cursor:pointer;">とじる</button>' +
      '</div>';
    document.body.appendChild(ov);
    document.getElementById("fyNoticeClose").addEventListener("click", function () {
      Storage.set(K.notice(idx), null);
      try { ov.remove(); } catch (e) {}
      noticeOpen = false;
    });
    speakWhenReady("pointKokanAudio");
  }

  /* ---- 起動・トップ画面に もどるたび ---- */
  var prevInit = window.initProfiles;
  window.initProfiles = function () {
    var r = prevInit.apply(this, arguments);
    try {
      if (isRegistered(activeProfileIndex)) settle(activeProfileIndex);
      renderTop();
      renderExBtn();
      maybeNotice();
      /* きょう まだ ハンコが ないとき、起動ごとに 1回だけ 声 */
      var idx = activeProfileIndex;
      var sel = document.getElementById("selectScreen");
      if (isRegistered(idx) && !voice1Done[idx] && sel && !sel.classList.contains("hidden") &&
          getStamps(idx).indexOf(dstr(new Date())) === -1) {
        voice1Done[idx] = true;
        speakWhenReady("hankoMotteAudio", function () {
          var s = document.getElementById("selectScreen");
          return !noticeOpen && s && !s.classList.contains("hidden") && !gateVisible();
        });
      }
    } catch (e) {}
    return r;
  };

  /* ---- 結果画面：ハンコ ---- */
  var prevResult = window.showResultScreen;
  window.showResultScreen = function () {
    var r = prevResult.apply(this, arguments);
    try {
      var old = document.getElementById("fyHankoResult");
      if (old) old.remove();
      if (selectedClef === "do") return r;           /* 6つのドは かぞえない */
      var idx = activeProfileIndex;
      var isNew = giveStamp(idx);
      var d = daysThisWeek(idx);
      var wrap = document.getElementById("resultButtonsWrap");
      if (!wrap) return r;
      var box = document.createElement("div");
      box.id = "fyHankoResult";
      box.style.cssText = "background:#fff;border:1px solid #f0e6d2;border-radius:14px;padding:8px 10px;margin:8px auto 0;width:92%;text-align:center;color:#5b4636;";
      var stampPart = isNew
        ? '<div style="position:relative;height:92px;margin:2px auto 0;display:flex;align-items:center;justify-content:center;"><span class="fy-ring"></span><span class="fy-big-pon">💮</span></div>' +
          '<div style="font-size:14px;font-weight:800;">きょうの ハンコ ゲット！</div>'
        : '<div style="font-size:13px;font-weight:800;">きょうの ハンコは もう もらったよ！</div>';
      box.innerHTML = stampPart +
        '<div style="font-size:13px;margin-top:4px;line-height:1.6;">今週は <b>' + d + '日め</b><br>' + hintText(d) + '</div>';
      wrap.parentNode.insertBefore(box, wrap);
    } catch (e) {}
    return r;
  };

  /* =====================================================================
     ポイントの こうかん（10ポイントずつ）
     ・こうかんすると、ポイントが へる（もどせない）
     ・「教室ネーム・日づけ・こうかんした p・のこり p」から コードを 計算して 画面に出す
     ・生徒は スクショを 先生に 送る → 先生は 先生ページの「コードかくにん」で たしかめる
     ===================================================================== */
  var EX_UNIT = 10;
  var EX_DAYS = 7;                         /* こうかんの きろくが 画面に のこる 日数 */
  var exOv = null;
  var exBusy = false;

  function exLog(idx) { var a = Storage.get("fy_tp_log_" + idx, []); return Array.isArray(a) ? a : []; }
  function md(ds) { var p = String(ds).split("-"); return parseInt(p[1], 10) + "/" + parseInt(p[2], 10); }
  function exClose() { if (exOv) { try { exOv.remove(); } catch (e) {} exOv = null; } }

  function exShell(inner) {
    if (!exOv) {
      exOv = document.createElement("div");
      exOv.id = "fyExchange";
      exOv.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;";
      document.body.appendChild(exOv);
    }
    exOv.innerHTML = '<div style="background:#fdf8ed;border-radius:18px;padding:16px;width:100%;max-width:340px;max-height:94%;overflow-y:auto;text-align:center;color:#5b4636;box-shadow:0 4px 18px rgba(0,0,0,.25);">' + inner + '</div>';
  }

  var BTN = "width:100%;border:none;border-radius:12px;padding:12px;font-size:16px;font-weight:800;cursor:pointer;margin-top:8px;";

  function receiptHtml(e) {
    return '<div style="border:3px double #ffb300;background:#fffdf0;border-radius:14px;padding:10px;margin:8px 0;">' +
      '<div style="font-size:28px;">🎁</div>' +
      '<div style="font-weight:900;">ポイント こうかん　' + e.amt + 'p</div>' +
      '<div style="font-size:19px;font-weight:900;margin:4px 0;">' + esc2(e.name) + ' さん</div>' +
      '<div style="font-size:13px;">' + md(e.d) + '</div>' +
      '<div style="font-size:30px;font-weight:900;letter-spacing:6px;background:#fff;border-radius:10px;padding:6px 0;margin:4px 0;">' + e.code + '</div>' +
      '<div style="font-size:11px;color:#806c5a;line-height:1.6;">この がめんを スクショして<br>せんせいに おくってね。<br>のこり <b>' + e.rest + ' p</b></div>' +
      window.fyLineCheck('【ふよみ】' + e.name + ' さん　ポイント こうかん ' + e.amt + 'p\nコード：' + e.code + '（のこり ' + e.rest + 'p）') +
      '</div>';
  }
  function esc2(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  function exMain(amt) {
    var idx = activeProfileIndex, tp = getTP(idx);
    var max = Math.floor(tp / EX_UNIT) * EX_UNIT;
    var html = '<div style="font-size:18px;font-weight:900;">🎁 ポイントを こうかん</div>' +
      '<div style="font-size:14px;margin-top:6px;">いま <span style="font-size:24px;font-weight:900;color:#e65100;">' + tp + ' p</span></div>';
    if (max < EX_UNIT) {
      html += '<div style="font-size:14px;font-weight:800;line-height:1.7;margin:12px 0;">' + EX_UNIT + 'ポイントから こうかん できるよ！<br>あと <b>' + (EX_UNIT - tp) + '</b> ポイント！</div>';
    } else {
      if (!amt || amt > max || amt < EX_UNIT) amt = EX_UNIT;
      var cs = "width:44px;height:44px;border-radius:50%;border:none;background:#78a9c8;color:#fff;font-size:26px;font-weight:900;cursor:pointer;";
      html += '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0;">' +
        '<button id="fyExMinus" style="' + cs + (amt <= EX_UNIT ? 'opacity:.3;' : '') + '">−</button>' +
        '<b id="fyExAmt" style="font-size:38px;min-width:80px;">' + amt + '</b>' +
        '<button id="fyExPlus" style="' + cs + (amt >= max ? 'opacity:.3;' : '') + '">＋</button></div>' +
        '<button id="fyExGo" style="' + BTN + 'background:#ff7043;color:#fff;">' + amt + 'ポイント こうかんする</button>' +
        '<div style="font-size:12px;color:#806c5a;line-height:1.7;margin-top:8px;">こうかんすると、ポイントが へります。<br>もどせません。</div>';
    }
    /* さいきんの こうかん（スクショを とりわすれたとき） */
    var now = Date.now(), recent = exLog(idx).filter(function (e) { return now - e.t < EX_DAYS * 86400000; });
    if (recent.length) {
      html += '<div style="font-size:12px;font-weight:800;margin-top:14px;text-align:left;">さいきんの こうかん（' + EX_DAYS + '日で きえるよ）</div>';
      recent.slice().reverse().forEach(function (e) { html += receiptHtml(e); });
    }
    html += '<button id="fyExClose" style="' + BTN + 'background:#ccc;color:#5b4636;">とじる</button>';
    exShell(html);

    var q = function (id) { return document.getElementById(id); };
    if (q("fyExMinus")) q("fyExMinus").addEventListener("click", function () { exMain(Math.max(EX_UNIT, amt - EX_UNIT)); });
    if (q("fyExPlus")) q("fyExPlus").addEventListener("click", function () { exMain(Math.min(max, amt + EX_UNIT)); });
    if (q("fyExGo")) q("fyExGo").addEventListener("click", function () { exConfirm(amt); });
    q("fyExClose").addEventListener("click", function () { exClose(); try { initProfiles(); } catch (e) {} });
  }

  function exConfirm(amt) {
    exShell('<div style="font-size:30px;">🎁</div>' +
      '<div style="font-size:20px;font-weight:900;margin:6px 0;">' + amt + 'ポイント こうかん する？</div>' +
      '<div style="font-size:13px;color:#806c5a;line-height:1.7;">ポイントが へります。<br>もどせません。</div>' +
      '<button id="fyExYes" style="' + BTN + 'background:#ff7043;color:#fff;">する</button>' +
      '<button id="fyExNo" style="' + BTN + 'background:#ccc;color:#5b4636;">やめる</button>');
    document.getElementById("fyExYes").addEventListener("click", function () { exDo(amt); });
    document.getElementById("fyExNo").addEventListener("click", function () { exMain(amt); });
  }

  function exDo(amt) {
    if (exBusy) return;
    exBusy = true;
    try {
      var idx = activeProfileIndex, tp = getTP(idx);
      if (amt < EX_UNIT || amt % EX_UNIT !== 0 || tp < amt) { exMain(EX_UNIT); return; }
      var rest = tp - amt;
      var d = dstr(new Date());
      var name = (typeof profiles !== "undefined" && profiles[idx]) || "";
      var code = (typeof window.fyExchangeCode === "function") ? window.fyExchangeCode(name, amt, rest, d) : "----";
      var e = { t: Date.now(), d: d, amt: amt, rest: rest, code: code, name: name };
      Storage.set(K.tp(idx), rest);
      var log = exLog(idx); log.push(e);
      if (log.length > 20) log = log.slice(log.length - 20);
      Storage.set("fy_tp_log_" + idx, log);
      exShell('<div style="font-size:16px;font-weight:900;">こうかん できたよ！</div>' + receiptHtml(e) +
        '<button id="fyExDone" style="' + BTN + 'background:#ffb300;color:#5b4636;">とじる</button>');
      document.getElementById("fyExDone").addEventListener("click", function () { exClose(); try { initProfiles(); } catch (er) {} });
    } finally {
      exBusy = false;
    }
  }

  /* トップ画面の「ポイントを こうかん」ボタン */
  function renderExBtn() {
    var anchor = document.getElementById("stampMiniBox");
    if (!anchor || !anchor.parentNode) return;
    var w = document.getElementById("fyExBtnWrap");
    if (!w) {
      w = document.createElement("div");
      w.id = "fyExBtnWrap";
      w.style.cssText = "display:flex;justify-content:center;margin-top:6px;";
      w.innerHTML = '<button id="fyExBtn" style="border:none;background:#8dbb8d;color:#fff;font-size:13px;font-weight:800;border-radius:10px;padding:8px 16px;cursor:pointer;">🎁 ポイントを こうかん</button>';
      anchor.parentNode.insertBefore(w, anchor.nextSibling);
      document.getElementById("fyExBtn").addEventListener("click", function () { exMain(EX_UNIT); });
    }
    w.style.display = isRegistered(activeProfileIndex) ? "flex" : "none";
  }

  /* 保護者ページ用 */
  window.fyParentTP = function (idx) { return getTP(idx) + " p"; };
  window.fyParentStamps = function (idx) { return daysThisWeek(idx) + "日（月〜日）"; };

  /* ---- 先生ページ：ためすための ボタン（1週間 まてないので） ---- */
  try {
    var t3 = document.getElementById("teacherTab3");
    if (t3) {
      var tb = document.createElement("div");
      tb.innerHTML =
        '<div style="font-size:12px;font-weight:bold;color:#5b4636;margin:12px 0 6px;text-align:left;">🧪 トレーニングポイントの テスト</div>' +
        '<button id="fyTestWeek" class="modal-btn" style="background:#43a047;font-size:12px;padding:8px;margin-bottom:6px;">🧪 先週 4日ぶんの ハンコを つくる（つぎに トップを ひらくと おしらせ）</button>' +
        '<button id="fyTestPlus" class="modal-btn" style="background:#43a047;font-size:12px;padding:8px;margin-bottom:6px;">🧪 ポイントを 10 ふやす</button>' +
        '<button id="fyTestReset" class="modal-btn" style="background:#2e7d32;font-size:12px;padding:8px;margin-bottom:6px;">🧪 いまのプレイヤーの ハンコと ポイントを リセット</button>';
      t3.insertBefore(tb, t3.firstChild);
      document.getElementById("fyTestWeek").addEventListener("click", function () {
        var idx = activeProfileIndex;
        var lastWs = addDays(weekStartOf(new Date()), -7);
        var s = getStamps(idx);
        [0, 1, 3, 4].forEach(function (k) { var ds = dstr(addDays(lastWs, k)); if (s.indexOf(ds) === -1) s.push(ds); });
        s.sort();
        Storage.set(K.stamps(idx), s);
        Storage.set(K.paid(idx), dstr(lastWs));
        Storage.set(K.notice(idx), null);
        alert("先週に 4日ぶんの ハンコを つくりました。\n「閉じる」で トップに もどると、おしらせが 出ます。");
      });
      document.getElementById("fyTestPlus").addEventListener("click", function () {
        var idx = activeProfileIndex;
        Storage.set(K.tp(idx), getTP(idx) + 10);
        try { initProfiles(); } catch (e) {}
        alert("ポイントを 10 ふやしました。（いま " + getTP(idx) + " p）");
      });
      document.getElementById("fyTestReset").addEventListener("click", function () {
        var idx = activeProfileIndex;
        [K.stamps(idx), K.tp(idx), K.paid(idx), K.notice(idx), "fy_tp_log_" + idx].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
        voice1Done = {};
        try { initProfiles(); } catch (e) {}
        alert("ハンコと ポイントを リセットしました。");
      });
    }
  } catch (e) {}

  /* はじめの 表示 */
  try { initProfiles(); } catch (e) {}
})();


/* ===== ふよみマスター以降（かたまり読み）とのドッキング ===== */
(function () {
  var PAGE = "chunk_proto.html";
  var LV = [16, 32, 64, 96];

  function isMaster(idx) {
    try {
      if (Storage.get("onpu_debug_unlocked_" + idx)) return true;
      var a = Storage.get("fy_ach_" + idx, []);
      if (!Array.isArray(a)) return false;
      for (var i = 0; i < a.length; i++) { if (a[i] && a[i].type === "master") return true; }
    } catch (e) {}
    return false;
  }
  function fmt(ms) { var sec = ms / 1000; if (sec >= 60) { var m = Math.floor(sec / 60), r = sec - m * 60; return m + "分" + (r < 10 ? "0" : "") + r.toFixed(1) + "秒"; } return sec.toFixed(1) + "秒"; }
  function getRec(idx, l) { try { return JSON.parse(localStorage.getItem("fy_chunk_rec_" + idx + "_" + l) || "null") || {}; } catch (e) { return {}; } }

  /* トップ画面のボタン */
  function renderBtn() {
    var all = document.getElementById("btnAll");
    if (!all || !all.parentNode) return;
    var b = document.getElementById("fyChunkBtn");
    if (!b) {
      b = document.createElement("button");
      b.id = "fyChunkBtn";
      b.className = "select-button";
      b.style.cssText = "background:#7e57c2;color:#fff;position:relative;";
      all.parentNode.insertBefore(b, all.nextSibling);
      b.addEventListener("click", function () {
        if (!isMaster(activeProfileIndex)) { alert("ふよみマスターに なると ひらくよ！"); return; }
        location.href = PAGE;
      });
    }
    var ok = isMaster(activeProfileIndex);
    b.innerHTML = "🎼 レジェンドへの みち" + (ok ? "" : ' <span class="lock-tag">🔒 ロック</span>');
    b.className = "select-button" + (ok ? "" : " locked");
  }
  var prev = window.initProfiles;
  window.initProfiles = function () {
    var r = prev.apply(this, arguments);
    try { renderBtn(); } catch (e) {}
    return r;
  };

  /* 保護者ページ */
  window.fyParentChunk = function (idx) {
    var G = '<div style="color:#1565c0;margin-bottom:4px;">';
    var lines = [], any = false;
    for (var l = 1; l <= 4; l++) {
      var r = getRec(idx, l);
      if (!r.first) continue;
      any = true;
      var t = "レベル" + l + "（" + LV[l - 1] + "音）クリア済み　ノーミスのベスト：" + (r.bestPerfect ? fmt(r.bestPerfect) : "まだ");
      if (r.n >= 2 && r.first > 0 && r.bestClear < r.first) t += "　伸び：" + Math.round((r.first - r.bestClear) / r.first * 100) + "%";
      lines.push(t);
    }
    try {
      var pp = JSON.parse(localStorage.getItem("fy_pass_" + idx) || "{}") || {};
      var list = JSON.parse(localStorage.getItem("fy_song_list") || "[]") || [];
      var names = [], tot = Array.isArray(list) ? list.length : 0;
      if (tot) list.forEach(function (x) { if (pp[x.c]) names.push(x.kt || x.title); });
      else Object.keys(pp).forEach(function (c) { names.push(c); });
      if (names.length > 0) { any = true; lines.push("レベル5（曲）：ふよみテスト合格 " + names.length + (tot ? " / " + tot : "") + " 曲<br><span style='font-size:12px;color:#806c5a;'>" + names.join("、") + "</span>"); }
      var qq = JSON.parse(localStorage.getItem("fy_play_" + idx) || "{}") || {}, qn = [];
      if (tot) list.forEach(function (x) { if (qq[x.c]) qn.push(x.kt || x.title); });
      else Object.keys(qq).forEach(function (c) { qn.push(c); });
      if (qn.length > 0) { any = true; lines.push("⭐ 演奏合格 " + qn.length + (tot ? " / " + tot : "") + " 曲<br><span style='font-size:12px;color:#806c5a;'>" + qn.join("、") + "</span>"); }
    } catch (e) {}
    return G + "<b>🎼 レジェンドへの道</b><br>" + (any ? lines.join("<br>") : (isMaster(idx) ? "まだ始めていません" : "ふよみマスターになると開きます")) + "</div>";
  };

  /* ---- イベントの きろく（トップ画面。だれでも見られる） ---- */
  var EVENT = { id: "2027-01", title: "1月の ふよみイベント",
                pStart: "2026-12-20", pEnd: "2026-12-31",
                start: "2027-01-01", end: "2027-01-31" };
  /* event_config.js（せんせいが かえる ファイル）があれば、そちらの 日づけを つかう（chunk_proto.html と おなじ ファイル） */
  try {
    var xh = new XMLHttpRequest();
    xh.open("GET", "event_config.js?v=" + Math.floor(Date.now() / 60000), false);
    xh.send();
    if (xh.status === 200) {
      var cfg = (new Function(xh.responseText + ";return window.FY_EVENT;"))();
      if (cfg && cfg.id && cfg.start && cfg.end && cfg.pStart && cfg.pEnd) EVENT = cfg;
    }
  } catch (e) {}
  var SALT2 = "fuyomi-2026", CC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  function todayS() { var d = new Date(); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function md(ds) { var q = ds.split("-"); return (+q[1]) + "月" + (+q[2]) + "日"; }
  function b64e(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
  function sign2(payload) {
    var t = payload + "|" + SALT2, h = 2166136261 >>> 0;
    for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var out = "";
    for (var k = 0; k < 6; k++) { out += CC.charAt(h % CC.length); h = Math.floor(h / CC.length); }
    return out;
  }
  function getEv(idx, l) { try { return JSON.parse(localStorage.getItem("fy_chunk_ev_" + idx + "_" + EVENT.id + "_" + l) || "null") || {}; } catch (e) { return {}; } }
  function evRate(r) { return (r.n >= 2 && r.first > 0 && r.bestClear < r.first) ? Math.round((r.first - r.bestClear) / r.first * 100) : 0; }
  function practiceDays(idx) {
    try {
      var a = JSON.parse(localStorage.getItem("fy_hanko_" + idx) || "[]"), n = 0;
      if (!Array.isArray(a)) return 0;
      a.forEach(function (d) { if (d >= EVENT.pStart && d <= EVENT.pEnd) n++; });
      return n;
    } catch (e) { return 0; }
  }
  function evPassCount(idx) {
    try {
      var p = JSON.parse(localStorage.getItem("fy_pass_" + idx) || "{}") || {}, n = 0;
      Object.keys(p).forEach(function (c) { var d = String(p[c]); if (d >= EVENT.start && d <= EVENT.end) n++; });
      return n;
    } catch (e) { return 0; }
  }
  function evPlayCount(idx) {
    try {
      var p = JSON.parse(localStorage.getItem("fy_play_" + idx) || "{}") || {}, n = 0;
      Object.keys(p).forEach(function (c) { var d = String(p[c]); if (d >= EVENT.start && d <= EVENT.end) n++; });
      return n;
    } catch (e) { return 0; }
  }
  function makeEventCode(idx) {
    var d = new Date(), stamp = todayS().replace(/-/g, "") + p2(d.getHours()) + p2(d.getMinutes());
    var f = ["FYE1", String(profiles[idx] || ""), EVENT.id, stamp, String(practiceDays(idx))];
    for (var l = 1; l <= 4; l++) { var r = getEv(idx, l); f.push((r.bestPerfect ? Math.round(r.bestPerfect) : 0) + "," + evRate(r)); }
    f.push(String(evPassCount(idx)));
    f.push(String(evPlayCount(idx)));
    var payload = f.join("|");
    return { code: "FYE1." + b64e(payload) + "." + sign2(payload), stamp: stamp };
  }
  function esc2(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function showEventScreen() {
    var idx = activeProfileIndex, rows = "", anyT = false;
    var cell = "border:1px solid #eadcc8;padding:3px 4px;text-align:center;";
    for (var l = 1; l <= 4; l++) {
      var r = getEv(idx, l), rate = evRate(r);
      if (r.bestPerfect || rate) anyT = true;
      rows += '<tr><td style="' + cell + '">レベル' + l + " <span style='font-size:11px'>(" + LV[l - 1] + '音)</span></td><td style="' + cell + '">' + (r.bestPerfect ? "<b>" + fmt(r.bestPerfect) + "</b>" : "—") + '</td><td style="' + cell + '">' + (rate > 0 ? "<b>" + rate + "%</b>" : "—") + "</td></tr>";
    }
    rows += '<tr><td style="' + cell + '">レベル5 <span style=\'font-size:11px\'>(きょく)</span></td><td colspan="2" style="' + cell + '">ふよみテスト ごうかく <b>' + evPassCount(idx) + '</b> きょく</td></tr>' +
      '<tr><td style="' + cell + '">レベル5 <span style=\'font-size:11px\'>(きょく)</span></td><td colspan="2" style="' + cell + '">⭐ えんそう ごうかく <b>' + evPlayCount(idx) + '</b> きょく</td></tr>';
    var c = makeEventCode(idx), t = c.stamp;
    var when = t.slice(0, 4) + "/" + (+t.slice(4, 6)) + "/" + (+t.slice(6, 8)) + " " + t.slice(8, 10) + ":" + t.slice(10, 12);
    var scr = document.getElementById("fyEvScr");
    if (!scr) {
      scr = document.createElement("div");
      scr.id = "fyEvScr";
      scr.style.cssText = "display:none;position:fixed;left:0;top:0;right:0;bottom:0;background:#fdf8ed;z-index:9000;overflow:auto;-webkit-overflow-scrolling:touch;color:#5b4636;";
      document.body.appendChild(scr);
    }
    var th = "border:1px solid #eadcc8;padding:3px 4px;text-align:center;background:#f6ecd8;";
    scr.innerHTML = '<div style="max-width:420px;margin:0 auto;padding:10px 12px 14px;">' +
      '<div style="font-size:18px;font-weight:900;text-align:center;">🏆 ' + EVENT.title + '</div>' +
      '<div style="text-align:center;margin:2px 0 6px;font-size:13px;">👤 ' + esc2(profiles[idx] || "") + ' さん</div>' +
      '<div style="background:#fff;border:1px solid #f0e6d2;border-radius:12px;padding:6px;text-align:center;font-size:14px;">💮 れんしゅう日数（' + md(EVENT.pStart) + '〜' + md(EVENT.pEnd) + '）<br><span style="font-size:24px;font-weight:900;color:#ff5722;">' + practiceDays(idx) + '</span> 日</div>' +
      '<div style="margin-top:8px;font-size:13px;font-weight:800;">⏱ ' + md(EVENT.start) + '〜' + md(EVENT.end) + ' の きろく（レジェンドへの みち）</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px;margin:4px 0;"><tr><th style="' + th + '"></th><th style="' + th + '">ノーミスの ベスト</th><th style="' + th + '">のびた</th></tr>' + rows + '</table>' +
      (!isMaster(idx) && !anyT ? '<div style="font-size:12px;color:#806c5a;">ふよみマスターに なると、レジェンドへの みちの タイムも のせられるよ！</div>' : '') +
      '<div style="font-size:12px;color:#806c5a;margin-top:2px;">きろくした日：' + when + '</div>' +
      '<div style="font-size:12px;font-weight:800;margin-top:6px;">せんせいに おくる コード</div>' +
      '<textarea id="fyEvCode" readonly style="width:100%;height:56px;font-size:10px;word-break:break-all;border:2px solid #eadcc8;border-radius:10px;padding:6px;box-sizing:border-box;-webkit-user-select:text;user-select:text;">' + c.code + '</textarea>' +
      '<button id="fyEvCopy" style="display:block;width:100%;border:none;border-radius:14px;padding:10px;font-size:15px;font-weight:800;background:#5c6bc0;color:#fff;margin-top:6px;">コードを コピー</button>' +
      window.fyLineCheck('【ふよみイベント】' + (profiles[idx] || '') + ' さんの きろくコード\n' + c.code) +
      '<div style="font-size:12px;line-height:1.5;margin-top:6px;text-align:center;">この画面を <b>スクリーンショット</b> して、<br>せんせいに おくってね。</div>' +
      '<button id="fyEvClose" style="display:block;width:100%;border:none;border-radius:14px;padding:10px;font-size:15px;font-weight:800;background:#f0efec;color:#3b2f27;margin-top:6px;">もどる</button>' +
      '</div>';
    scr.style.display = "block";
    scr.scrollTop = 0;
    document.getElementById("fyEvClose").addEventListener("click", function () { scr.style.display = "none"; });
    document.getElementById("fyEvCopy").addEventListener("click", function () {
      var ta = document.getElementById("fyEvCode"), ok = false;
      try { ta.focus(); ta.select(); ta.setSelectionRange(0, 99999); ok = document.execCommand("copy"); } catch (e) {}
      this.textContent = ok ? "コピーしました" : "コードを ながおしして コピーしてね";
    });
  }
  window.fyShowEventScreen = showEventScreen;

  function renderEvBtn() {
    var anchor = document.getElementById("fyChunkBtn");
    if (!anchor || !anchor.parentNode) return;
    var b = document.getElementById("fyEvBtn");
    if (!b) {
      b = document.createElement("button");
      b.id = "fyEvBtn";
      b.className = "select-button";
      b.style.cssText = "background:#ffb300;color:#5b4636;";
      b.textContent = "🏆 イベントの きろく";
      anchor.parentNode.insertBefore(b, anchor.nextSibling);
      b.addEventListener("click", showEventScreen);
    }
    b.style.display = isRegistered(activeProfileIndex) ? "" : "none";
  }
  var prev2 = window.initProfiles;
  window.initProfiles = function () {
    var r = prev2.apply(this, arguments);
    try { renderEvBtn(); } catch (e) {}
    return r;
  };
  try { renderEvBtn(); } catch (e) {}
  try { renderBtn(); renderEvBtn(); } catch (e) {}
})();


/* ===== イベントの きろくコード かくにん（先生ページ） ===== */
(function () {
  var SALT = "fuyomi-2026", CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function b64dec(b) {
    var t = String(b).replace(/-/g, "+").replace(/_/g, "/");
    while (t.length % 4) t += "=";
    return decodeURIComponent(escape(atob(t)));
  }
  function signOf(payload) {
    var s = payload + "|" + SALT, h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var out = "";
    for (var k = 0; k < 6; k++) { out += CODE_CHARS.charAt(h % CODE_CHARS.length); h = Math.floor(h / CODE_CHARS.length); }
    return out;
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(ms) { var sec = ms / 1000; if (sec >= 60) { var m = Math.floor(sec / 60), r = sec - m * 60; return m + "分" + (r < 10 ? "0" : "") + r.toFixed(1) + "秒"; } return sec.toFixed(1) + "秒"; }

  window.fyCheckEventCode = function () {
    var out = document.getElementById("feOut");
    var raw = String(document.getElementById("feIn").value || "").normalize("NFKC").replace(/\s+/g, "");
    var parts = raw.split(".");
    function bad(m) { out.innerHTML = '<div style="color:#c62828;font-weight:800;font-size:14px;">❌ ' + m + '</div>'; }
    if (parts.length !== 3 || parts[0] !== "FYE1") return bad("コードの形が ちがいます");
    var payload;
    try { payload = b64dec(parts[1]); } catch (e) { return bad("コードを 読めません（切れていませんか？）"); }
    if (signOf(payload) !== parts[2]) return bad("しるしが あいません（書きかえられたか、途中で 切れています）");
    var f = payload.split("|");
    if (f[0] !== "FYE1" || (f.length !== 9 && f.length !== 10 && f.length !== 11)) return bad("コードの 中みが ちがいます");
    var st = f[3], when = st.slice(0, 4) + "/" + (+st.slice(4, 6)) + "/" + (+st.slice(6, 8)) + " " + st.slice(8, 10) + ":" + st.slice(10, 12);
    var rows = "";
    for (var l = 1; l <= 4; l++) {
      var a = f[4 + l].split(","), best = parseInt(a[0], 10) || 0, rate = parseInt(a[1], 10) || 0;
      rows += "<tr><td>レベル" + l + "</td><td>" + (best ? fmt(best) : "—") + "</td><td>" + (rate ? rate + "%" : "—") + "</td></tr>";
    }
    if (f.length >= 10) rows += "<tr><td>レベル5</td><td colspan='2'>ふよみテスト合格 <b>" + (parseInt(f[9], 10) || 0) + "</b> 曲</td></tr>";
    if (f.length === 11) rows += "<tr><td>レベル5</td><td colspan='2'>⭐ 演奏合格 <b>" + (parseInt(f[10], 10) || 0) + "</b> 曲</td></tr>";
    out.innerHTML = '<div style="color:#2e7d32;font-weight:800;font-size:14px;">✅ 本物の コードです</div>' +
      '<div style="font-size:13px;line-height:1.7;text-align:left;">なまえ：<b>' + esc(f[1]) + '</b>　イベント：' + esc(f[2]) + '<br>きろくした日：' + when + '<br>れんしゅう日数：<b>' + (parseInt(f[4], 10) || 0) + '</b> 日</div>' +
      '<table class="compare-table"><thead><tr><th></th><th>ノーミスの ベスト</th><th>のびた</th></tr></thead><tbody>' + rows + '</tbody></table>';
  };

  try {
    var t3 = document.getElementById("teacherTab3");
    if (t3 && !document.getElementById("fyEventCheck")) {
      var d = document.createElement("div");
      d.id = "fyEventCheck";
      d.innerHTML =
        '<div style="font-size:12px;font-weight:bold;color:#5b4636;margin-bottom:6px;text-align:left;">🏆 イベントの きろくコード かくにん</div>' +
        '<div style="text-align:left;font-size:11px;color:#806c5a;margin-bottom:4px;">生徒の スクショの コードを、貼ってください。（スクショの 文字を ながおしして コピーできます）</div>' +
        '<textarea id="feIn" class="modal-input" style="height:70px;font-size:12px;" placeholder="FYE1.…"></textarea>' +
        '<button class="modal-btn" style="background:#5c6bc0;font-size:12px;padding:8px;" onclick="fyCheckEventCode()">かくにん する</button>' +
        '<div id="feOut" style="margin:6px 0 14px;"></div>';
      t3.insertBefore(d, t3.firstChild);
    }
    if (t3 && !document.getElementById("fyAnyCheck")) {
      var a = document.createElement("div");
      a.id = "fyAnyCheck";
      a.style.cssText = "background:#fff8e1;border:2px solid #ffb300;border-radius:12px;padding:8px;margin-bottom:14px;";
      a.innerHTML =
        '<div style="font-size:13px;font-weight:bold;color:#5b4636;margin-bottom:4px;text-align:left;">🔍 コードを 貼って かくにん（ぜんぶ ここで）</div>' +
        '<div style="text-align:left;font-size:11px;color:#806c5a;margin-bottom:4px;">LINEで 届いた メッセージを、そのまま 貼ってください。<br>イベント・達成・ポイント こうかん・うつしコードを じどうで みわけます。</div>' +
        '<textarea id="faIn" class="modal-input" style="height:80px;font-size:12px;" placeholder="ここに 貼る"></textarea>' +
        '<button class="modal-btn" style="background:#ef6c00;font-size:13px;padding:9px;" onclick="fyCheckAny()">かくにん する</button>' +
        '<div id="faOut" style="margin:6px 0 4px;"></div>';
      t3.insertBefore(a, t3.firstChild);
    }
  } catch (e) {}
  window.fyCheckAnyHtml = function (raw) {
    var r = window.fyCheckAnyCore(raw);
    if (r.kind === "event") {
      var fi = document.getElementById("feIn"), fo = document.getElementById("feOut");
      if (!fi || !fo) return "いま かくにん できません";
      fi.value = r.token; window.fyCheckEventCode();
      return fo.innerHTML;
    }
    return r.html;
  };
  window.fyCheckAny = function () {
    var out = document.getElementById("faOut"), raw = document.getElementById("faIn").value;
    var r = window.fyCheckAnyCore(raw);
    if (r.kind === "event") {
      document.getElementById("feIn").value = r.token;
      window.fyCheckEventCode();
      out.innerHTML = document.getElementById("feOut").innerHTML;
    } else out.innerHTML = r.html;
  };
})();

/* ===== 古い「100回れんぞく」のレジェンドを、見えなくする（記録は のこす） ===== */
(function () {
  /* ★ もとに もどしたい ときは、下の 1行を false に する */
  var HIDE_OLD_LEGEND = true;
  if (!HIDE_OLD_LEGEND) return;

  /* 名前の前の 👑、トップの「100回達成」の行、金色の おいわい画面 */
  window.legendMark = function () { return ""; };
  window.showLegendModal = function () {};
  try {
    var st = document.createElement("style");
    st.textContent = "#legendRecord{display:none !important;}";
    document.head.appendChild(st);
  } catch (e) {}

  /* 先生ページ：100回れんぞく の 見本と、テスト用ボタン */
  function hideTeacherLegend() {
    try {
      var all = document.querySelectorAll("#teacherSection div, #teacherSection button");
      Array.prototype.forEach.call(all, function (el) {
        var oc = el.getAttribute && (el.getAttribute("onclick") || "");
        var own = "";
        for (var i = 0; i < el.childNodes.length; i++) { if (el.childNodes[i].nodeType === 3) own += el.childNodes[i].nodeValue; }
        if (oc.indexOf("setStreak99ForTest") >= 0 || oc.indexOf("resetLegendForTest") >= 0 ||
            own.indexOf("100回目のテスト") >= 0 || own.indexOf("100回れんぞく 画面の見本") >= 0) {
          el.style.display = "none";
        }
      });
      var pv = document.getElementById("teacherLegendPreviewList");
      if (pv) pv.style.display = "none";
    } catch (e) {}
  }
  hideTeacherLegend();
  var prevRender = window.renderTeacherView;
  if (typeof prevRender === "function") {
    window.renderTeacherView = function () { var r = prevRender.apply(this, arguments); hideTeacherLegend(); return r; };
  }
  try { initProfiles(); } catch (e) {}
})();

/* ===== 先生用：コードの ひとつの はこ（なまえは 1か所。だす／しらべる） ===== */
(function () {
  var SALT = "fuyomi-2026", CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  var FALLBACK = [["01","アマリリス"],["02","おおきな くりの きの したで"],["03","はるの おがわ"],["04","はるが きた"],["05","あめ こんこん"],["06","いけの こい"],["07","ふじさん"],["08","ロンドンばし"],["09","きんこんしき"],["10","ゆうやけ こやけ"],["11","かえるの がっしょう"]];
  function signOf(payload) {
    var s = payload + "|" + SALT, h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var out = "";
    for (var k = 0; k < 6; k++) { out += CODE_CHARS.charAt(h % CODE_CHARS.length); h = Math.floor(h / CODE_CHARS.length); }
    return out;
  }
  function normName(s) { return String(s || "").normalize("NFKC").replace(/\s+/g, ""); }
  function codeOf(name, c, kind) { return c + "-" + signOf((kind === "play" ? "PLAY|" : "PASS|") + normName(name) + "|" + c); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function songs() {
    try {
      var l = JSON.parse(localStorage.getItem("fy_song_list") || "[]");
      if (Array.isArray(l) && l.length) return l.map(function (x) { return [x.c, x.title]; });
    } catch (e) {}
    return FALLBACK;
  }
  function savedNames() {
    var n = [];
    try { n = JSON.parse(localStorage.getItem("sensei_names") || "[]") || []; } catch (e) {}
    try { if (typeof profiles !== "undefined") profiles.forEach(function (p) { if (p && !/^せいと[0-9]+$/.test(p) && n.indexOf(p) === -1) n.push(p); }); } catch (e) {}
    return n;
  }
  function remember(name) {
    try { var n = JSON.parse(localStorage.getItem("sensei_names") || "[]") || []; if (n.indexOf(name) === -1) { n.push(name); localStorage.setItem("sensei_names", JSON.stringify(n)); } } catch (e) {}
  }
  function appUrl() { try { return new URL("chunk_proto.html", location.href).href; } catch (e) { return "https://onpukurabu-93.github.io/Fuyomi-Challenge/chunk_proto.html"; } }
  function copyBtn(text) {
    var cp = document.createElement("button"); cp.className = "modal-btn"; cp.style.cssText = "background:#5c6bc0;font-size:13px;padding:8px;"; cp.textContent = "📋 コピー";
    cp.addEventListener("click", function () {
      var done = function () { cp.textContent = "✅ コピーした！"; };
      function fb() { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} t.remove(); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fb); else fb();
    });
    return cp;
  }
  function card(text, parent) {
    var wrap = document.createElement("div"); wrap.style.cssText = "background:#fff;border-radius:10px;padding:8px;margin:8px 0;";
    var tx = document.createElement("div"); tx.style.cssText = "font-size:12px;white-space:pre-wrap;word-break:break-all;"; tx.textContent = text; wrap.appendChild(tx);
    if (window.fyLineBtn) { var h = document.createElement("div"); h.innerHTML = window.fyLineBtn(text, "LINEで おくる"); wrap.appendChild(h); }
    wrap.appendChild(copyBtn(text));
    parent.appendChild(wrap);
  }
  function hr(t) { return '<div style="font-size:13px;font-weight:bold;color:#5b4636;margin:14px 0 4px;border-top:2px solid #c8e6c9;padding-top:10px;">' + t + '</div>'; }

  function build() {
    var t3 = $("teacherTab3");
    if (!t3) return;
    var ui = $("fyUni");
    if (!ui) {
      ui = document.createElement("div");
      ui.id = "fyUni";
      ui.style.cssText = "background:#e8f5e9;border:2px solid #43a047;border-radius:12px;padding:8px;margin-bottom:14px;text-align:left;";
      ui.innerHTML =
        '<div style="font-size:15px;font-weight:900;color:#2e7d32;">🔑 コード（ここに ぜんぶ あります）</div>' +
        '<div style="font-size:11px;color:#806c5a;margin:6px 0 2px;">① 生徒の なまえ（ひらがな・すうじ。アプリと おなじに）</div>' +
        '<input type="text" id="fuName" class="modal-input" style="font-size:16px;" placeholder="例：たろう">' +
        '<div id="fuNames" style="margin:4px 0;"></div>' +
        hr('② ごうかくコードを だす（レベル5）') +
        '<div style="font-size:11px;color:#806c5a;margin-bottom:2px;">どちらの ごうかく？</div>' +
        '<label style="display:block;font-size:14px;font-weight:800;padding:4px 0;"><input type="radio" name="fuKind" value="pass" checked style="width:18px;height:18px;"> ✅ ふよみテスト ごうかく</label>' +
        '<label style="display:block;font-size:14px;font-weight:800;padding:4px 0;"><input type="radio" name="fuKind" value="play" style="width:18px;height:18px;"> ⭐ えんそう ごうかく（先生が うたえる えんそう）</label>' +
        '<div style="font-size:11px;color:#806c5a;margin:6px 0 2px;">ごうかくした きょくに チェック</div>' +
        '<div id="fuSongs"></div>' +
        '<button class="modal-btn" style="background:#2e7d32;font-size:14px;padding:10px;" id="fuPassBtn">ごうかくコードを つくる</button>' +
        '<div id="fuPassOut"></div>' +
        hr('③ 復元コードを だす（機種変更の とき）') +
        '<details id="fuRestoreBox"><summary style="font-size:13px;font-weight:800;color:#3949ab;padding:6px 0;">ひらく</summary>' +
        '<div style="text-align:left;font-size:11px;color:#806c5a;">マスターの たっせい日（とっていなければ 空らん）</div>' +
        '<div style="font-size:11px;">ト音記号マスター<input id="fuDt" class="modal-input" type="date"></div>' +
        '<div style="font-size:11px;">ヘ音記号マスター<input id="fuDb" class="modal-input" type="date"></div>' +
        '<div style="font-size:11px;">ふよみマスター<input id="fuDm" class="modal-input" type="date"></div>' +
        '<input id="fuTot" class="modal-input" type="number" min="0" placeholder="20問 全部一発正解の 回数">' +
        '<input id="fuRb" class="modal-input" type="number" min="0" placeholder="連続の 最高（回）">' +
        '<input id="fuRn" class="modal-input" type="number" min="0" placeholder="連続の いま（回）">' +
        '<input id="fuTp" class="modal-input" type="number" min="0" placeholder="トレーニングポイント（いま 何p）">' +
        '<div style="font-size:11px;color:#806c5a;">合格した レベル（0〜5）</div>' +
        '<div style="display:flex;gap:4px;margin-bottom:6px;">' +
          '<select id="fuLt" class="modal-input" style="margin:0;"><option value="0">ト音 0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>' +
          '<select id="fuLb" class="modal-input" style="margin:0;"><option value="0">ヘ音 0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>' +
          '<select id="fuLa" class="modal-input" style="margin:0;"><option value="0">全カード 0</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>' +
        '</div>' +
        '<button class="modal-btn" style="background:#5c6bc0;font-size:13px;padding:9px;" id="fuRestBtn">復元コードを つくる</button>' +
        '<div id="fuRestOut"></div></details>' +
        hr('④ コードを しらべる') +
        '<div id="fuCheckSlot"></div>' +
        '<details id="fuOldBox" style="margin-top:8px;"><summary style="font-size:12px;font-weight:800;color:#806c5a;padding:6px 0;">15日より 前の コードを しらべる（ふだんは つかいません）</summary>' +
        '<div style="font-size:11px;color:#806c5a;margin-bottom:4px;">なまえは ① を つかいます。しゅるい・ひづけ を えらんで、正しい コードを 出して くらべます。</div>' +
        '<select id="fuType" class="modal-input"><option value="">▼ しゅるいを えらんでね</option><option value="treble">ト音記号マスター</option><option value="bass">ヘ音記号マスター</option><option value="master">ふよみマスター</option><option value="legend5">ふよみレジェンド（100曲）</option><option value="maestro">ふよみマエストロ（100曲）</option><option value="exchange">ポイント こうかん</option></select>' +
        '<input id="fuDate" class="modal-input" type="date">' +
        '<div style="font-size:11px;color:#806c5a;">「ポイント こうかん」のときだけ、スクショの 数字を 入れてね</div>' +
        '<div style="display:flex;gap:4px;"><input id="fuAmt" class="modal-input" type="number" min="0" placeholder="こうかんした p"><input id="fuRest" class="modal-input" type="number" min="0" placeholder="のこり p"></div>' +
        '<button class="modal-btn" style="background:#5c6bc0;font-size:13px;padding:9px;" id="fuOldBtn">正しい コードを 出す</button>' +
        '<div id="fuOldOut" style="font-size:22px;font-weight:900;letter-spacing:4px;margin:6px 0;color:#3949ab;word-break:break-all;"></div></details>';
      t3.insertBefore(ui, t3.firstChild);
      var sd = $("fuSongs");
      songs().forEach(function (s) {
        var l = document.createElement("label");
        l.style.cssText = "display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;margin:3px 0;padding:6px;background:#fff;border-radius:8px;";
        l.innerHTML = '<input type="checkbox" value="' + esc(s[0]) + '" style="width:20px;height:20px;"> ' + Number(s[0]) + '．' + esc(s[1]);
        sd.appendChild(l);
      });
      var dt = $("fuDate"); if (dt) { var d0 = new Date(); dt.value = d0.getFullYear() + "-" + ("0" + (d0.getMonth() + 1)).slice(-2) + "-" + ("0" + d0.getDate()).slice(-2); }
      function nameVal() { return $("fuName").value.trim().normalize("NFKC"); }
      function needName(out) { var n = nameVal(); if (!n) { out.innerHTML = '<div style="padding:8px;">① の なまえを いれてね</div>'; return null; } return n; }
      $("fuPassBtn").addEventListener("click", function () {
        var out = $("fuPassOut"); out.innerHTML = "";
        var name = needName(out); if (!name) return;
        var picked = Array.prototype.slice.call(sd.querySelectorAll("input:checked")).map(function (x) { return x.value; });
        if (!picked.length) { out.innerHTML = '<div style="padding:8px;">きょくを えらんでね</div>'; return; }
        remember(name); showNames();
        picked.forEach(function (c) {
          var title = ""; songs().forEach(function (s) { if (s[0] === c) title = s[1]; });
          var kindEl = document.querySelector('input[name="fuKind"]:checked'), kind = kindEl ? kindEl.value : "pass";
          var code = codeOf(name, c, kind), url = appUrl() + "?pass=" + code;
          card(name + " さん、「" + title + "」 " + (kind === "play" ? "えんそう ごうかく！⭐" : "ごうかく！🎉") + "\nつぎの リンクを タップしてね\n" + url + "\n（リンクが ひらかない ときは、アプリの がくふの がめんで コード「" + code + "」を いれてね）", out);
        });
      });
      $("fuRestBtn").addEventListener("click", function () {
        var out = $("fuRestOut"); out.innerHTML = "";
        var name = needName(out); if (!name) return;
        var map = { frName: name, frDt: $("fuDt").value, frDb: $("fuDb").value, frDm: $("fuDm").value, frTot: $("fuTot").value, frRb: $("fuRb").value, frRn: $("fuRn").value, frTp: $("fuTp").value, frLt: $("fuLt").value, frLb: $("fuLb").value, frLa: $("fuLa").value };
        Object.keys(map).forEach(function (k) { var e = $(k); if (e) e.value = map[k]; });
        if (typeof window.fyMakeRestore !== "function" || !$("frOut")) { out.innerHTML = '<div style="padding:8px;">いま つかえません</div>'; return; }
        window.fyMakeRestore();
        var code = $("frOut").value;
        if (!/^FY2\./.test(code)) { out.innerHTML = '<div style="padding:8px;color:#c62828;">' + esc(code) + '</div>'; return; }
        remember(name); showNames();
        card(window.fyRestoreText(name + " さんの 復元コードです。\n" + code, code), out);
      });
      $("fuOldBtn").addEventListener("click", function () {
        var out = $("fuOldOut"); out.textContent = "";
        var name = nameVal(); if (!name) { out.textContent = "① の なまえを いれてね"; return; }
        var map = { fcName: name, fcType: $("fuType").value, fcDate: $("fuDate").value, fcAmt: $("fuAmt").value, fcRest: $("fuRest").value };
        Object.keys(map).forEach(function (k) { var e = $(k); if (e) e.value = map[k]; });
        if (typeof window.fyCheckCode !== "function" || !$("fcOut")) { out.textContent = "いま つかえません"; return; }
        window.fyCheckCode();
        out.textContent = $("fcOut").textContent;
      });
    }
    function showNames() {
      var nb = $("fuNames"); if (!nb) return; nb.innerHTML = "";
      savedNames().forEach(function (x) {
        var b = document.createElement("button");
        b.style.cssText = "display:inline-block;border:none;border-radius:8px;background:#7e8aa0;color:#fff;font-size:13px;padding:6px 10px;margin:2px;";
        b.textContent = x; b.addEventListener("click", function () { $("fuName").value = x; });
        nb.appendChild(b);
      });
    }
    showNames();
    /* しらべる はこを ひとつに（貼るだけ）。ほかの 古い はこは かくす */
    var any = $("fyAnyCheck"), slot = $("fuCheckSlot");
    if (any && slot && any.parentNode !== slot) { any.style.margin = "0"; slot.appendChild(any); }
    ["fyEventCheck", "fyStampTest", "fyPassMk"].forEach(function (id) { var e = $(id); if (e) e.style.display = "none"; });
    if (t3.firstChild !== ui) t3.insertBefore(ui, t3.firstChild);
  }
  try { build(); } catch (e) {}
  var pr = window.renderTeacherView;
  if (typeof pr === "function") window.renderTeacherView = function () { var r = pr.apply(this, arguments); try { build(); } catch (e) {} return r; };
  window.__fyUni = { code: codeOf, build: build };
})();


/* ===== LINEの リンクを タップして ひらいたとき（?restore=… ／ ?check=…） ===== */
(function () {
  function show(title, body, ok) {
    var d = document.createElement("div");
    d.style.cssText = "position:fixed;left:0;right:0;top:0;bottom:0;z-index:99999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:16px;";
    d.innerHTML = '<div style="background:#fffdf5;border-radius:16px;padding:16px;max-width:360px;width:100%;max-height:85vh;overflow:auto;box-shadow:0 4px 16px rgba(0,0,0,.3);">' +
      '<div style="font-size:17px;font-weight:900;margin-bottom:8px;">' + title + '</div>' +
      '<div style="font-size:14px;line-height:1.7;color:' + (ok === false ? "#c62828" : "#5b4636") + ';white-space:pre-line;text-align:left;">' + body + '</div>' +
      '<button id="fyLkClose" style="display:block;width:100%;margin-top:12px;border:none;border-radius:12px;padding:12px;font-size:16px;font-weight:800;background:#ff7043;color:#fff;">とじる</button></div>';
    document.body.appendChild(d);
    document.getElementById("fyLkClose").addEventListener("click", function () { d.remove(); });
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function run() {
    var m = location.search.match(/[?&](restore|check)=([^&]+)/);
    if (!m) return;
    var val; try { val = decodeURIComponent(m[2]); } catch (e) { return; }
    try { history.replaceState(null, "", location.pathname); } catch (e2) {}
    try {
      if (m[1] === "restore") {
        var r = window.fyLinkRestore(val);
        show(r.ok ? "🔁 きろくが もどりました" : "もどせませんでした", (r.ok ? "「" + esc(r.name) + "」さん\n" : "") + esc(r.msg), r.ok);
      } else {
        show("🔍 コードの かくにん", '<div style="white-space:normal;">' + window.fyCheckAnyHtml(val) + '</div>', true);
      }
    } catch (e3) { show("エラー", "リンクを ひらけませんでした。", false); }
  }
  setTimeout(run, 500);
  window.__fyLinkRun = run;
})();
