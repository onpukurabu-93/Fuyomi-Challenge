(function () {
  /* ★ マスター音声を、ファンファーレのはじまりから何ミリ秒後に鳴らすか（4000 = 4秒） */
  var MASTER_DELAY_MS = 4000;
  /* ★ コードが、一覧に見えている日数 */
  var CODE_DAYS = 3;
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
    var payload = ["FY1", o.name,
      [ymd(o.dt), ymd(o.db), ymd(o.dm)].join(","),
      [o.tot | 0, o.rb | 0, o.rn | 0].join(","),
      [o.lt | 0, o.lb | 0, o.la | 0].join(",")].join("|");
    return "FY1." + b64enc(payload) + "." + signOf(payload);
  }
  function parseRestoreCode(raw) {
    var code = String(raw || "").normalize("NFKC").replace(/\s+/g, "");
    var parts = code.split(".");
    if (parts.length !== 3 || parts[0] !== "FY1") return { err: "コードの形が正しくありません。先生から届いたコードを、そのまま貼ってください。" };
    var payload;
    try { payload = b64dec(parts[1]); } catch (e) { return { err: "コードを読めませんでした。最後まで、全部コピーしましたか？" }; }
    if (signOf(payload) !== parts[2]) return { err: "コードが正しくありません。途中で切れていないか、確かめてください。" };
    var f = payload.split("|");
    if (f.length !== 5 || f[0] !== "FY1") return { err: "コードの形が正しくありません。" };
    var d = f[2].split(","), n = f[3].split(","), l = f[4].split(",");
    return { name: f[1], dt: d[0], db: d[1], dm: d[2],
             tot: parseInt(n[0], 10) || 0, rb: parseInt(n[1], 10) || 0, rn: parseInt(n[2], 10) || 0,
             lt: parseInt(l[0], 10) || 0, lb: parseInt(l[1], 10) || 0, la: parseInt(l[2], 10) || 0 };
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
  function applyRestore(raw, idx) {
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
    if (p.lt > 0 && ensureLevels(idx, "treble", p.lt)) done.push("ト音記号 レベル" + p.lt + "まで合格");
    if (p.lb > 0 && ensureLevels(idx, "bass", p.lb)) done.push("ヘ音記号 レベル" + p.lb + "まで合格");
    if (p.la > 0 && ensureLevels(idx, "all", p.la)) done.push("全カード レベル" + p.la + "まで合格");
    try { initProfiles(); } catch (e) {}
    if (!done.length) return { ok: true, msg: "この端末には、すでに同じか、それ以上の記録があります。新しく書き込む記録は、ありませんでした。" };
    return { ok: true, msg: "復元しました。\n・" + done.join("\n・") };
  }

  /* 復元の入力画面（「きろくと コード」のページから） */
  function showRestoreForm() {
    var idx = activeProfileIndex;
    openOverlay(
      '<div style="font-size:18px;font-weight:900;margin-bottom:6px;">🔁 記録の復元</div>' +
      '<div style="font-size:12.5px;line-height:1.6;color:#806c5a;margin-bottom:8px;">先生から届いた「復元コード」を、貼ってください。<br>いまのプレイヤー：<b>' + esc(profiles[idx] || "") + '</b> さん</div>' +
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
    openOverlay(html);
    var rbtn = document.getElementById("fyRestoreBtn");
    if (rbtn) rbtn.addEventListener("click", showRestoreForm);
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
        BL + '<b>🎖 マスター</b>：' + (achs || 'まだありません') + '</div>' +
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
      var tab3b = document.getElementById("teacherTab3");
      if (tab3b) {
        Array.prototype.forEach.call(tab3b.querySelectorAll("button"), function (bt) {
          var oc = bt.getAttribute("onclick") || "";
          if (oc.indexOf("setStreak99ForTest") !== -1 || oc.indexOf("resetLegendForTest") !== -1) bt.style.display = "none";
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
            '<option value="treble">ト音記号マスター</option>' +
            '<option value="bass">ヘ音記号マスター</option>' +
            '<option value="master">ふよみマスター</option>' +
          '</select>' +
          '<input id="fcDate" class="modal-input" type="date">' +
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

  window.fyCheckCode = function () {
    var name = cleanName(document.getElementById("fcName").value);
    var type = document.getElementById("fcType").value;
    var date = document.getElementById("fcDate").value;
    if (!name || !date) { document.getElementById("fcOut").textContent = "なまえと ひづけを いれてね"; return; }
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
      lt: parseInt(v("frLt"), 10) || 0, lb: parseInt(v("frLb"), 10) || 0, la: parseInt(v("frLa"), 10) || 0
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
