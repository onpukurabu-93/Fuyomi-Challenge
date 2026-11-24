/* LINEで おくる ボタン（コードが でる がめん ぜんぶで つかう） */
(function () { try { var st = document.createElement("style"); st.textContent = "@keyframes fyLB{0%{box-shadow:0 0 0 0 rgba(6,199,85,.85)}100%{box-shadow:0 0 0 16px rgba(6,199,85,0)}}.fyLineBlink{animation:fyLB 1.1s ease-out infinite;outline:3px solid #b9f6ca}"; document.head.appendChild(st); } catch (e) {} })();
/* ★ 公式LINEの ID（せいとから せんせいへ おくる ボタンは、このトークを ちょくせつ ひらく） */
window.FY_OA = "@892rfjzh";
window.FY_EXTRAS_VER = "1124f";
/* 2026-11-22：以前の テストで「あと1もんへ（テスト）」が ONの ままに なっていた 端末が あったので、1回だけ 強制的に けす */
(function () { try { if (!localStorage.getItem("fy_cleared_test_skip_1124b")) { localStorage.removeItem("fy_test_skip"); localStorage.setItem("fy_cleared_test_skip_1124b", "1"); } } catch (e) {} })();
/* 公式LINEを ちょくせつ ひらく（iPadでは うごいた。iPhoneでは 一覧が出る＝まちがいは おきない）。つかわない ときは false */
window.FY_OA_DIRECT = true;
/* toOA が true → 公式LINEの トークを ちょくせつ ひらく（おくる あいてを えらばなくて よい）。false → ふつうの「あいてを えらぶ」 */
window.fyLineBtn = function (text, label, bg, toOA) {
  return '<a href="' + (toOA && window.FY_OA_DIRECT ? "https://line.me/R/oaMessage/" + window.FY_OA + "/?" : "https://line.me/R/msg/text/?") + encodeURIComponent(text) + '" target="_blank" rel="noopener" style="text-decoration:none;display:block;"><span class="' + (toOA ? "fyLineBlink" : "") + '" style="display:block;width:100%;box-sizing:border-box;border-radius:12px;padding:10px;font-size:15px;font-weight:800;text-align:center;background:' + (bg || "#06c755") + ';color:#fff;margin-top:6px;">' + (label || "LINEで せんせいに おくる") + '</span></a>' + (toOA && !window.fyNoBackNote ? '<div style="font-size:12px;font-weight:700;line-height:1.5;color:#806c5a;text-align:center;margin-top:5px;">おくったら、LINEの したの メニューを もういちど おしてね<br>（アプリに もどれるよ）</div>' : '');
};
/* アプリの リンク（タップすると じどうで しごとを する）。index.html の ある ところの アドレスを つかう */
window.fyAppLink = function (kind, value) {
  try { var u = new URL("index.html", location.href); u.search = ""; u.hash = ""; return u.href + "?" + kind + "=" + encodeURIComponent(value).replace(/\./g, "%2E"); }   /* LINEは リンクの「.」で きれて しまうので、「.」は %2E に する */ catch (e) { return ""; }
};
/* 生徒 → 先生：先生が リンクを タップすると、コードを じどうで かくにん */
window.fyLineCheck = function (text, label, bg) {
  return window.fyLineBtn(text + "\n\n（おくったら、LINEの したの メニューの『ふよみチャレンジ』から もどってね）", label, bg, true);
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
  /* 2026-11-24：カードが出るときは、おいわいを見せるまで結果画面のボタンを押せなくする（ボタン連打で
     おいわいが取り消される不具合の対策）。まだ見せていないおいわいは Storage にも控えておき、
     万一 取り消されても、つぎの画面に来たときに かならず 出す（念のための 保険） */
  window.__fyCelLock = false;
  var heldVoice = null;            /* マスターの声：おいわい画面が出たときに鳴らす */
  var suppressMasterVoice = false, omedetoPending = false;

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
  /* codes.txt の 1ぎょう：  あいことば            …ふつうの せいと
                              あいことば,イベント     …イベントだけの こ（イベントが おわって 7日まで）
                              あいことば,イベント,2027-02-10  …つかえる 日を じぶんで きめる */
  function dpad(n) { return (n < 10 ? "0" : "") + n; }
  function dstrG(d) { return d.getFullYear() + "-" + dpad(d.getMonth() + 1) + "-" + dpad(d.getDate()); }
  function addDaysG(ds, n) { var d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() + n); return dstrG(d); }
  function loadCodesInfo() {
    return fetch("codes.txt?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("load"); return r.text(); })
      .then(function (t) {
        var list = [], info = {};
        t.split(/\r?\n/).forEach(function (l) {
          l = l.trim();
          if (!l || l.charAt(0) === "#") return;
          var a = l.split(",").map(function (x) { return x.trim(); });
          var c = norm(a[0]);
          list.push(c);
          if (a[1] && /イベント|ｲﾍﾞﾝﾄ|event/i.test(a[1])) {
            info[c] = { ev: true, until: /^\d{4}-\d{2}-\d{2}$/.test(a[2] || "") ? a[2] : "" };
          }
        });
        list.info = info;
        return list;
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

  /* ===== あいことば・なまえの画面 =====
     2026-11-21：「📩 あいことば」ボタン（プレゼントコードの シート）と 見た目を そろえた。
     どちらも「下から出てくる、同じ 見た目の カード」に することで、
     「先生からの あいことばは いつも ここで入れる」と おぼえやすくする ため。 */
  var inputStyle = "width:100%;box-sizing:border-box;font-size:26px;font-weight:900;text-align:center;padding:12px;border:3px solid #ffcc9a;border-radius:16px;letter-spacing:4px;color:#5b4636;background:#fff;-webkit-user-select:text;user-select:text;";
  var nameInputStyle = "width:100%;padding:12px;font-size:18px;border:2px solid #ffcc9a;border-radius:12px;text-align:center;background:#fff;color:#5b4636;box-sizing:border-box;-webkit-user-select:text;user-select:text;";
  var btnStyle = "width:100%;margin-top:10px;padding:14px;font-size:19px;font-weight:900;border:none;border-radius:16px;color:#fff;";

  var box = document.createElement("div");
  box.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:10000;background:rgba(60,40,20,.45);display:flex;align-items:flex-end;justify-content:center;padding:0;box-sizing:border-box;";
  box.innerHTML =
    '<div style="background:#fffaf0;border-radius:22px 22px 0 0;padding:16px 16px 22px;width:100%;max-width:480px;max-height:86vh;overflow:auto;text-align:center;color:#5b4636;box-sizing:border-box;">' +
    '<div style="font-size:18px;font-weight:900;margin-bottom:4px;">📩 あいことば</div>' +
    '<div id="gateMsg" style="font-size:13px;color:#806c5a;min-height:30px;margin-bottom:8px;line-height:1.6;white-space:pre-line;">かくにん中…</div>' +
    '<div id="gateCodeForm" style="display:none;">' +
    '<div style="font-size:13px;color:#806c5a;margin:0 0 8px;">せんせいから もらった あいことばを いれてね</div>' +
    '<input id="gateInput" type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="あいことば" style="' + inputStyle + '">' +
    '<button id="gateBtn" style="' + btnStyle + 'background:#ff7043;">いれる</button>' +
    '<button id="gateCancel" style="' + btnStyle + 'background:#bdbdbd;font-size:15px;padding:10px;display:none;">やめる</button>' +
    '</div>' +
    '<div id="gateNickForm" style="display:none;">' +
    '<input id="gateNick" type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="8" placeholder="きょうしつネーム" style="' + nameInputStyle + '">' +
    '<div style="font-size:12px;color:#806c5a;margin:10px 0 4px;text-align:left;">がくねん・くぶん</div>' +
    '<select id="gateCategory" style="' + nameInputStyle + '"></select>' +
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
  var categorySelect = document.getElementById("gateCategory");
  var cancelBtn = document.getElementById("gateCancel");
  try {
    if (categorySelect && typeof CATEGORIES !== "undefined") {
      categorySelect.innerHTML = CATEGORIES.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join("");
      categorySelect.value = "年少";
    }
  } catch (e) {}

  function setMsg(text, isErr) {
    msgEl.textContent = text;
    msgEl.style.color = isErr ? "#d84315" : "#806c5a";
  }
  function updateGateNudge() {
    try {
      if (typeof window.fyNudge !== "function") return;
      var v = String(codeInput.value || "").trim();
      if (v.length >= 5) window.fyNudge(document.getElementById("gateBtn"));
      else window.fyNudge(codeInput);
    } catch (e) {}
  }
  function show(which) {
    codeForm.style.display = (which === "code") ? "block" : "none";
    nickForm.style.display = (which === "nick") ? "block" : "none";
    confirmForm.style.display = (which === "confirm") ? "block" : "none";
    box.style.display = "flex";
    if (which === "code") updateGateNudge();
    else { try { if (typeof window.fyClearNudges === "function") window.fyClearNudges(); } catch (e) {} }
  }
  function showCode(text, isErr) {
    setMsg(text, isErr);
    cancelBtn.style.display = cancelable ? "block" : "none";
    show("code");
  }
  function openApp() { cancelable = false; box.style.display = "none"; try { if (typeof window.fyClearNudges === "function") window.fyClearNudges(); } catch (e) {} }

  function switchTo(slot) {
    activeProfileIndex = slot;
    Storage.set("onpu_active_profile", slot);
    initProfiles();
  }

  function tryCode(code, fromUser) {
    var c = norm(code);
    setMsg("かくにん中…", false);
    show("none");
    loadCodesInfo().then(function (list) {
      if (list.indexOf(c) !== -1) {
        var map = getMap();
        var inf = list.info[c], ev = window.fyEventCfg, today = dstrG(new Date()), limited = false;
        if (inf && ev && today > ev.end) {
          var until = inf.until || addDaysG(ev.end, 7);
          if (today > until) {
            cancelable = false;
            showCode("あいことばが つかえなくなりました。せんせいに きいてね", true);
            return;
          }
          limited = true;
        }
        if (limited) {
          if (map[c] !== undefined && isRegistered(map[c]) && window.fyShowEventScreen) {
            switchTo(map[c]);
            openApp();
            window.fyShowEventScreen({ limited: true, until: inf.until || addDaysG(ev.end, 7) });
          } else {
            cancelable = false;
            showCode("イベントは おわりました。せんせいに きいてね", true);
          }
          return;
        }
        if (map[c] !== undefined && isRegistered(map[c])) {
          switchTo(map[c]);
          openApp();
        } else {
          pending = { code: c, name: "" };
          nickInput.value = "";
          try { if (categorySelect) categorySelect.value = "年少"; } catch (e) {}
          setMsg("せんせいと きめた「きょうしつネーム」を そのまま いれてね。\nあとで かえられないよ", false);
          show("nick");
        }
      } else {
        /* 2026-11-21：codes.txt に なければ、イベントの 賞カードを わたす コード（FYC1）かも しれないので
           さきに ためす。だいもじ・小文字が きちんと のこる よう、normせずの もとの 文字を つかう。 */
        var rawCode = String(code || "").trim();
        if (fromUser && /^FYC1\./.test(rawCode) && window.fyEvCardRedeem) {
          var cardRes = window.fyEvCardRedeem(activeProfileIndex, rawCode);
          if (cardRes) {
            if (cardRes.ok) { codeInput.value = ""; try { if (window.fyNewLookRender) window.fyNewLookRender(); } catch (eR2) {} }
            showCode(cardRes.msg, !cardRes.ok);
            return;
          }
        }
        /* 2026-11-21：codes.txt に なければ、せんせいから の プレゼントコード（FYAK）かも しれないので、
           つぎに それを ためす。「合言葉は ぜんぶ ここ」の ボタン 1つに まとめる ため。 */
        var F = window.FYAK;
        if (fromUser && F && F.isCode(c)) {
          var lk = F.locked(activeProfileIndex);
          if (lk) {
            showCode("なんども ちがったので、いまは いれられないよ\n（あと " + lk + "ふんくらい）", true);
            return;
          }
          var g = window.fyAkGift(c);
          if (g) {
            if (g.ok) { codeInput.value = ""; try { if (window.fyNewLookRender) window.fyNewLookRender(); } catch (eR) {} }
            showCode(g.msg, !g.ok);
            return;
          }
          var hasSongs = false; try { hasSongs = !!localStorage.getItem("fy_song_list"); } catch (eS) {}
          var chBtn = document.getElementById("fyChunkBtn");
          var chLocked = !chBtn || chBtn.classList.contains("locked");
          if (hasSongs && !chLocked) {
            try { localStorage.setItem("fy_ak_pending_" + activeProfileIndex, F.norm(c)); } catch (eP) {}
            location.href = "chunk_proto.html";
            return;
          }
          F.bad(activeProfileIndex);
        }
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
  codeInput.addEventListener("input", updateGateNudge);
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
    try { pending.category = categorySelect ? categorySelect.value : "年少"; } catch (e) { pending.category = "年少"; }
    document.getElementById("gateConfirmName").textContent = s + "（" + pending.category + "）";
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
    Storage.set("onpu_category_" + slot, pending.category || "年少");
    Storage.set("onpu_pin_" + slot, "0000");
    Storage.set("onpu_registered_" + slot, true);
    var map = getMap();
    map[pending.code] = slot;
    setMap(map);
    var newName = profiles[slot];
    pending = null;
    (window.fyVoice1Done = window.fyVoice1Done || {})[slot] = true;   /* はじめての ガイドの あいだは「ハンコを もらおう」の 声を 鳴らさない */
    switchTo(slot);
    openApp();
    try { if (typeof showWelcome === "function") showWelcome(newName); } catch (e) {}
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
  /* 2026-11-24：ほかの IIFE からも、おなじ「現地時間の日付」を使えるように。
     toISOString() は世界標準時なので、朝9時より前（日本時間）に使うと前日の日付になってしまうバグが、
     あちこちの「日づけ」記録で起きていた。 */
  window.fyLocalDateStr = localDateStr;
  window.fyCodeFor = codeFor;

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
  window.fyExchangeCode = function (name, amt, rest, dateStr, seq) {
    return codeFor(name, "exchange", (amt | 0) + "-" + (rest | 0) + (seq ? "-" + (seq | 0) : ""), dateStr);
  };

  var INFO = {
    stamp:  { icon: "🏅", label: "スタンプカード", bg: "#fffdf0", bd: "#ffb300", tx: "#5b4636", ac: "#ff5722", cbg: "#fff", ctx: "#5b4636" },
    treble: { icon: "🎼", label: "ト音記号マスター", bg: "#eaf6ff", bd: "#2a8fd6", tx: "#1a4a7a", ac: "#2a8fd6", cbg: "#fff", ctx: "#1a4a7a" },
    bass:   { icon: "🎼", label: "ヘ音記号マスター", bg: "#eafaf0", bd: "#2fa862", tx: "#1f5a3a", ac: "#2fa862", cbg: "#fff", ctx: "#1f5a3a" },
    master: { icon: "🎓", label: "ふよみマスター", bg: "#fff0f5", bd: "#e0527f", tx: "#7a2b4a", ac: "#e0527f", cbg: "#fff", ctx: "#7a2b4a" },
    legend: { icon: "🏅", label: "ふよみ名人", bg: "#16213f", bd: "#c9a23a", tx: "#f4e6b0", ac: "#f4d36b", cbg: "#fff8dc", ctx: "#16213f" },
    legend5: { icon: "👑", label: "ふよみレジェンド", bg: "#16213f", bd: "#c9a23a", tx: "#f4e6b0", ac: "#f4d36b", cbg: "#fff8dc", ctx: "#16213f" },
    maestro: { icon: "🎹", label: "ふよみマエストロ", bg: "#2b1b4a", bd: "#b79be0", tx: "#efe6ff", ac: "#d9c4ff", cbg: "#f4eeff", ctx: "#2b1b4a" },
    legend1000: { icon: "🏅", label: "ふよみ名人", bg: "#fff3b0", bd: "#b98a1e", tx: "#5a3a00", ac: "#8a5a00", cbg: "#fff", ctx: "#5a3a00" },
    mbest: { icon: "🌟", label: "月間ベスト賞", bg: "#fff8e1", bd: "#ffb300", tx: "#5a3a00", ac: "#ff6f00", cbg: "#fff", ctx: "#5a3a00" },
    trrun: { icon: "🎼", label: "ト音記号 れんぞくしょう", bg: "#eaf6ff", bd: "#2a8fd6", tx: "#1a4a7a", ac: "#2a8fd6", cbg: "#fff", ctx: "#1a4a7a" },
    bsrun: { icon: "🎼", label: "ヘ音記号 れんぞくしょう", bg: "#eafaf0", bd: "#2fa862", tx: "#1f5a3a", ac: "#2fa862", cbg: "#fff", ctx: "#1f5a3a" },
    half: { icon: "🏅", label: "ふよみ メダル", bg: "#16213f", bd: "#c9a23a", tx: "#f4e6b0", ac: "#f4d36b", cbg: "#fff8dc", ctx: "#16213f" },
    halfend: { icon: "📋", label: "ふよみ メダル（きろくカード）", bg: "#fff8e1", bd: "#ffb300", tx: "#5a3a00", ac: "#ff6f00", cbg: "#fff", ctx: "#5a3a00" },
    lvclear: { icon: "🎵", label: "はじめての ごうかく", bg: "#eafaf0", bd: "#2fa862", tx: "#1f5a3a", ac: "#2fa862", cbg: "#fff", ctx: "#1f5a3a" }
  };
  function infoOf(rec) {
    if (rec.type === "legend" && rec.n >= 1000) return INFO.legend1000;
    return INFO[rec.type] || INFO.stamp;
  }
  function titleOf(rec) {
    if (rec.type === "stamp") return "スタンプカード " + rec.n + " まいめ";
    if (rec.type === "legend") return "ふよみ名人";
    if (rec.type === "event") return rec.award || "イベントの 賞カード";
    /* 2026-11-24：half／halfend は award に 期（ev）を 入れていないので（印刷カードの絵に 文字が 入る想定）、
       LINEの文面や おいわい画面の タイトルには、期＋メダルを あわせて 出す */
    if (rec.type === "half" || rec.type === "halfend") return (rec.ev ? rec.ev + "　" : "") + (rec.award || INFO[rec.type].label);
    if (rec.type === "lvclear") return rec.award || INFO[rec.type].label;
    return INFO[rec.type].label;
  }
  function subOf(rec) {
    if (rec.type === "stamp") return "かんせい！";
    if (rec.type === "legend") return "パーフェクト " + rec.n + "回 れんぞく！";
    if (rec.type === "legend5") return "ぜんぶの きょくで ふよみごうかく！";
    if (rec.type === "maestro") return "ぜんぶの きょくで せんせいの ごうかく！";
    if (rec.type === "mbest") return (rec.award || "") + "の がんばりが、いちばん だったよ！";
    if (rec.type === "trrun" || rec.type === "bsrun") return "れんぞく " + (rec.n || 0) + "回 たっせい！";
    if (rec.type === "half") return "つうさん " + (rec.cnt || 0) + "回 たっせい！";
    /* 2026-11-24：先生が LINEの 文面だけで 照合できるよう、最終の 通算回数も ここに 入れる（印刷カードには 回数（丸い枠）と ランク（リボン）だけを のせ、日数は ここと カード帳だけに 出す） */
    if (rec.type === "halfend") return "つうさん " + (rec.cnt || 0) + "回　れんしゅうした 日：" + (rec.days || 0) + "日";
    if (rec.type === "lvclear") return "せいかいりつ 90%いじょうで ごうかく！";
    return "おめでとう！";
  }
  function ymLabel(ym) { var p = String(ym).split("-"); return p.length === 2 ? (+p[0]) + "年" + (+p[1]) + "月" : String(ym); }

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
  /* 🎁 ごほうびの ポイント（先生ページで かえられる）。おなじ ごほうびは 1かいだけ */
  var PT = { treble: 5, bass: 5, master: 10, legend: 20, event: 10, mbest: 3, trrun: { 10: 2 }, bsrun: { 10: 2 } };
  try { var ptc = Storage.get("fy_pt_cfg", {}) || {}; for (var pk in PT) if (typeof ptc[pk] === "number") PT[pk] = ptc[pk]; } catch (e) {}
  function givePt(idx, tag, n) {
    try {
      if (!n) return 0;
      var g = Storage.get("fy_ptgiven_" + idx, {}) || {};
      if (g[tag]) return 0;
      g[tag] = n; Storage.set("fy_ptgiven_" + idx, g);
      Storage.set("fy_tp_" + idx, Storage.getNumber("fy_tp_" + idx, 0) + n);
      return n;
    } catch (e) { return 0; }
  }
  window.fyGivePt = givePt;
  window.fyPtCfg = PT;
  /* 📨 まだ せんせいに おくっていない きろく（us＝あたらしく とった しるし、sentAt＝おくるボタンを おした とき） */
  function isUnsent(r) { return !!(r && r.us && !r.sentAt); }
  function unsentCount(idx) { return getAch(idx).filter(isUnsent).length; }
  function markSent(idx, code) {
    try { var a = getAch(idx), ch = false; a.forEach(function (r) { if (r && r.code === code && !r.sentAt) { r.sentAt = Date.now(); ch = true; } }); if (ch) { Storage.set("fy_ach_" + idx, a); try { window.fyUnsentDot(); } catch (e2) {} } } catch (e) {}
  }
  document.addEventListener("click", function (e) {
    try { var w = e.target.closest ? e.target.closest("[data-fysend]") : null; if (w && e.target.closest("a")) markSent(activeProfileIndex, w.getAttribute("data-fysend")); } catch (e3) {}
  }, true);
  window.fyUnsentCount = unsentCount;
  window.fyUnsentLines = function (idx) { return getAch(idx).filter(isUnsent).map(function (r) { return "🏅 " + titleOf(r) + "　" + subOf(r) + "　コード：" + r.code; }); };
  window.fyUnsentAchDates = function (idx) { return getAch(idx).filter(isUnsent).map(function (r) { return r.d; }); };
  window.fyMarkAchSent = function (idx) { try { var a = getAch(idx), ch = false; a.forEach(function (r) { if (isUnsent(r)) { r.sentAt = Date.now(); ch = true; } }); if (ch) Storage.set("fy_ach_" + idx, a); } catch (e) {} };
  window.fyUnsentDot = function () {
    try {
      var b = document.getElementById("fyCodeBtn"); if (!b) return;
      var n = unsentCount(activeProfileIndex), d = document.getElementById("fyCodeDot");
      b.style.position = "relative";
      if (n > 0) { b.classList.add("fyLineBlink"); if (!d) { d = document.createElement("span"); d.id = "fyCodeDot"; d.style.cssText = "position:absolute;right:-7px;top:-8px;background:#f44336;color:#fff;border:2px solid #fff;border-radius:12px;font-size:11px;padding:1px 6px;"; d.textContent = "📨"; b.appendChild(d); } }
      else { b.classList.remove("fyLineBlink"); if (d) d.remove(); }
    } catch (e) {}
  };
  var ACH_REPEAT = { legend: 1, mbest: 1, trrun: 1, bsrun: 1, half: 1, halfend: 1, lvclear: 1 };
  function addAch(idx, type, n, extra) {
    if (!ACH_REPEAT[type] && findAch(idx, type)) return null;
    var rec = makeRec(idx, type, n || 0);
    /* 2026-11-24：extra.ptAmt を わたせば、PT[type] の 設定より それを 優先する
       （半期の きろくのように、ランクごとに ポイントが ちがう ものに つかう） */
    var ptOverride = (extra && typeof extra.ptAmt === "number") ? extra.ptAmt : null;
    if (extra) { for (var ek in extra) rec[ek] = extra[ek]; delete rec.ptAmt; }
    rec.us = 1;
    var tag = ACH_REPEAT[type] ? (type + "_" + (n || 0)) : "award_" + type;
    var ptCfg = PT[type];
    var ptAmt = (ptOverride !== null) ? ptOverride : ((ptCfg && typeof ptCfg === "object") ? (ptCfg[n || 0] || 0) : (ptCfg || 0));
    rec.pt = givePt(idx, tag, ptAmt);
    if (rec.pt && window.fyTpEarnLog) window.fyTpEarnLog(idx, rec.pt, "🏅 " + titleOf(rec));
    var a = getAch(idx);
    a.push(rec);
    Storage.set("fy_ach_" + idx, a);
    return rec;
  }

  /* 2026-11-23：🌟 月間ベスト賞（20問ぜんぶ一発正解の月ごとの合計が、それまでの どの月よりも 多かったら もらえる）
     12/21〜12/31の れんしゅう期間は 対象に 入れない。1月（練習期間の 次の月）が 第1回目＝それまでの 最高が 0なので、
     1回でも とれば もらえる。月が かわった タイミングで、まえの月の 結果を かくていする（＝よく月に なって わかる）。 */
  function mbFirstYm() {
    try {
      var pe = (window.fyEventCfg && window.fyEventCfg.pEnd) || "2026-12-31";
      var d = new Date(pe + "T00:00:00"); d.setDate(d.getDate() + 1);
      var mm = d.getMonth() + 1;
      return d.getFullYear() + "-" + (mm < 10 ? "0" + mm : mm);
    } catch (e) { return "2027-01"; }
  }
  function mbUpdate(idx, isPerfect20) {
    try {
      var first = mbFirstYm();
      var ym = localDateStr(new Date()).slice(0, 7);
      if (ym < first) return null;
      var curYm = Storage.get("fy_mb_ym_" + idx, "");
      var awarded = null;
      if (!curYm) { Storage.set("fy_mb_ym_" + idx, ym); Storage.set("fy_mb_cnt_" + idx, 0); curYm = ym; }
      if (ym !== curYm) {
        var doneCnt = Storage.getNumber("fy_mb_cnt_" + idx, 0);
        var best = Storage.getNumber("fy_mb_best_" + idx, 0);
        if (doneCnt > best) {
          Storage.set("fy_mb_best_" + idx, doneCnt);
          awarded = addAch(idx, "mbest", curYm, { ev: "月間ベスト賞", award: ymLabel(curYm) });
        }
        Storage.set("fy_mb_ym_" + idx, ym);
        Storage.set("fy_mb_cnt_" + idx, 0);
      }
      if (isPerfect20) Storage.set("fy_mb_cnt_" + idx, Storage.getNumber("fy_mb_cnt_" + idx, 0) + 1);
      return awarded;
    } catch (e) { return null; }
  }

  /* 2026-11-24：🏅 半期の きろく（「ふよみ名人（れんぞく100回）」の 代わり）
     上期＝4〜9月、下期＝10〜3月（年度表記）。2026年度下期（2027年1〜3月を ふくむ）だけ、
     アプリが始まったばかりの「スタート記念」として ランクの基準を 低くしてある。
     数えるのは「全カード レベル5・20問 ぜんぶ いっぱつ せいかい」の 通算回数（連続でなくてよい）。 */
  var HALF_START_PERIOD = "2026-H2";
  var HALF_STARS = ["🥉", "🥈", "🥇"];
  /* 2026-11-24：シリーズ名「ふよみ メダル」。🥉＝銅メダル／🥈＝銀メダル／🥇＝金メダル（金メダルをとった子は「ふよみ名人」）。
     「年度」はやめて、月の はんいで 書く（先生の指示）。 */
  var HALF_SERIES_NAME = "ふよみ メダル";
  var HALF_MEDAL_NAMES = ["銅メダル", "銀メダル", "金メダル"];
  function halfId(d) {
    var y = d.getFullYear(), m = d.getMonth() + 1;
    if (m >= 4 && m <= 9) return y + "-H1";
    if (m >= 10) return y + "-H2";
    return (y - 1) + "-H2";
  }
  /* 2026-11-24：「2026年度 下期」のような 年度表記を やめて、月の はんいで 書く。
     スタート記念の期（HALF_START_PERIOD）だけは、アプリが はじまった あとの 1〜3月だけを 見せる（先生の指示・例示どおり）。 */
  function halfLabel(id) {
    var p = String(id).split("-"), y = +p[0];
    if (id === HALF_START_PERIOD) return (y + 1) + "年1月〜3月";
    if (p[1] === "H1") return y + "年4月〜9月";
    return y + "年10月〜" + ((y + 1) % 100) + "年3月";
  }
  function halfRanks(id) { return id === HALF_START_PERIOD ? [25, 50, 100] : [50, 100, 200]; }
  /* ri の メダルの 名前だけ（期は 入れない。例：「🥇 金メダル ふよみ名人」） */
  function halfMedalName(ri) { return ri < 0 ? "ランクなし" : (HALF_STARS[ri] + " " + HALF_MEDAL_NAMES[ri] + (ri === 2 ? " ふよみ名人" : "")); }
  function halfRankName(id, ri) { return halfMedalName(ri); }
  function halfPracticeDays(idx, periodId) {
    try {
      var p = String(periodId).split("-"), y = +p[0], from, to;
      if (p[1] === "H1") { from = y + "-04-01"; to = y + "-09-30"; }
      else { from = y + "-10-01"; to = (y + 1) + "-03-31"; }
      var stamps = Storage.get("fy_hanko_" + idx, []);
      if (!Array.isArray(stamps)) return 0;
      return stamps.filter(function (d2) { return d2 >= from && d2 <= to; }).length;
    } catch (e) { return 0; }
  }
  function finalizeHalf(idx, periodId) {
    try {
      /* 2026-11-24：もう その期の カードを 作っていないか（n ではなく half で みる。
         n は コードに 最終回数を たたみこむために「期のid_回数」に 変えたため） */
      if (getAch(idx).some(function (a) { return a && a.type === "halfend" && a.half === periodId; })) return null;
      var cnt = Storage.getNumber("fy_half_cnt_" + idx, 0);
      var ranks = halfRanks(periodId), rankReached = -1;
      for (var ri = ranks.length - 1; ri >= 0; ri--) if (cnt >= ranks[ri]) { rankReached = ri; break; }
      /* 2026-11-24：その期で メダル（いちばん下の 銅メダル）に とどかなかった 子には、
         「ランクなし」の カードは 作らない（先生の指示） */
      if (rankReached === -1) return null;
      var days = halfPracticeDays(idx, periodId);
      var rankTxt = halfMedalName(rankReached);
      /* 2026-11-24：コードの計算に 最終回数も たたみこむ（n＝「期のid_回数」）。
         LINEの文面の回数を 書きかえても コードが あわなくなるようにする（先生の指示）。
         ev＝期（印刷カードの絵じたいに「ふよみ メダル」の文字が 入る想定なので、ここでは 重ねない）、award＝とった メダル。 */
      return addAch(idx, "halfend", periodId + "_" + cnt, { ev: halfLabel(periodId), award: rankTxt, half: periodId, cnt: cnt, days: days, rank: rankReached });
    } catch (e) { return null; }
  }
  function halfUpdate(idx, isAll5Perfect) {
    try {
      var curId = halfId(new Date());
      var storedId = Storage.get("fy_half_id_" + idx, "");
      var endRec = null;
      if (!storedId) { Storage.set("fy_half_id_" + idx, curId); Storage.set("fy_half_cnt_" + idx, 0); storedId = curId; }
      if (storedId !== curId) {
        endRec = finalizeHalf(idx, storedId);
        Storage.set("fy_half_id_" + idx, curId);
        Storage.set("fy_half_cnt_" + idx, 0);
        storedId = curId;
      }
      var cnt = Storage.getNumber("fy_half_cnt_" + idx, 0);
      if (isAll5Perfect) {
        cnt = cnt + 1;
        Storage.set("fy_half_cnt_" + idx, cnt);
      }
      /* 2026-11-24：「ちょうど N回」ではなく「N回いじょうで、まだ そのランクの カードを 持っていない」で 出す。
         うつしコードなどで 回数が いちどに 大きく ふえても、もらい忘れた ランクを この回で まとめて 追いつかせる（ポイントの 二重払いは addAch の しくみで 防がれる）。 */
      var rankRecs = [];
      var ranks = halfRanks(curId);
      for (var ri = 0; ri < ranks.length; ri++) {
        if (cnt >= ranks[ri]) {
          var n = curId + "_r" + ri;
          if (!getAch(idx).some(function (a) { return a && a.type === "half" && a.n === n; })) {
            var rRec = addAch(idx, "half", n, { ev: HALF_SERIES_NAME, award: halfMedalName(ri), half: curId, rank: ri, cnt: cnt, ptAmt: [5, 10, 20][ri] });
            if (rRec) rankRecs.push(rRec);
          }
        }
      }
      return { rankRecs: rankRecs, endRec: endRec, cnt: cnt, id: curId };
    } catch (e) { return {}; }
  }

  /* 2026-11-23：🏵 ノーミス月間記録賞（その月の「いちばん長い れんぞく」が、今までの どの月よりも 長かったら ポイントが もらえる）
     🔥 ノーミスれんぞく賞（自己ベストを 更新する たびに もらえる カード）は やる気の ための もの、ポイントは つけない。
     ポイントは、こちらの「月間の 記録」が こうしん された ときだけ（月間ベスト賞と おなじ しくみ）。 */
  function dmd(rec) {
    var p = String(rec.d || "").split("-");
    if (p.length === 3) return parseInt(p[1], 10) + "/" + parseInt(p[2], 10);
    var d = new Date(rec.t);
    return (d.getMonth() + 1) + "/" + d.getDate();
  }

  function cardHtml(rec) {
    var f = infoOf(rec);
    /* おいわいの とき：コードも 送る ボタンも 出さない。「なれた こと」だけを 大きく */
    if (celebrating && window.fyNewLookOn && window.fyNewLookOn()) {
      return '<div style="position:relative;border:4px double ' + f.bd + ';border-radius:20px;background:' + f.bg + ';padding:18px 10px;margin-bottom:10px;text-align:center;color:' + f.tx + ';">' +
        (window.fyDemoBadgeHtml ? window.fyDemoBadgeHtml() : "") +
        '<div style="font-size:64px;line-height:1.15;">' + f.icon + '</div>' +
        '<div style="font-size:' + (String(titleOf(rec)).length > 9 ? 24 : 28) + 'px;font-weight:900;margin:6px 0 2px;line-height:1.3;">' + esc(titleOf(rec)) + '</div>' +
        '<div style="font-size:20px;font-weight:900;color:' + f.ac + ';">' + esc(subOf(rec)) + '</div>' +
        '<div style="font-size:24px;font-weight:900;margin:10px 0 2px;">' + esc(rec.name) + ' さん</div>' +
        '<div style="font-size:14px;">' + dmd(rec) + '</div>' +
        (rec.pt ? '<div style="font-size:22px;font-weight:900;margin-top:8px;">🎁 +' + rec.pt + ' ポイント</div>' : '') +
        (rec.promo ? '<div style="font-size:15px;font-weight:800;margin-top:8px;">👉 ' + esc(rec.promo) + '</div>' : '') +
        '</div>';
    }
    var sentG = !!(rec.us && rec.sentAt);
    return '<div style="position:relative;border:3px double ' + (sentG ? '#bbb' : f.bd) + ';border-radius:16px;background:' + (sentG ? '#eee' : f.bg) + ';padding:12px;margin-bottom:10px;text-align:center;color:' + (sentG ? '#888' : f.tx) + ';' + (sentG ? 'filter:grayscale(1);' : '') + '">' +
      (window.fyDemoBadgeHtml ? window.fyDemoBadgeHtml() : "") +
      '<div style="font-size:30px;line-height:1.2;">' + f.icon + '</div>' +
      '<div style="font-size:17px;font-weight:900;margin:2px 0;">' + esc(titleOf(rec)) + '</div>' +
      '<div style="font-size:15px;font-weight:800;color:' + f.ac + ';">' + esc(subOf(rec)) + '</div>' +
      '<div style="font-size:19px;font-weight:900;margin:4px 0;">' + esc(rec.name) + ' さん</div>' +
      '<div style="font-size:13px;margin:2px 0;">' + dmd(rec) + '</div>' +
      '<div style="font-size:34px;font-weight:900;letter-spacing:6px;color:' + f.ctx + ';background:' + f.cbg + ';border-radius:10px;padding:6px 0;margin-top:4px;">' + ((window.fyDemoOn && window.fyDemoOn()) ? "みほん" : esc(rec.code)) + '</div>' +
      (rec.pt ? '<div style="font-size:16px;font-weight:900;margin-top:4px;">🎁 +' + rec.pt + ' ポイント</div>' : '') +
      (rec.promo ? '<div style="font-size:13px;font-weight:800;margin-top:4px;">👉 ' + esc(rec.promo) + '</div>' : '') +
      '</div>' +
      ((rec.us && rec.sentAt) ? '<div style="font-size:13px;font-weight:900;color:#2e7d32;margin:2px 0;">✓ せんせいに おくったよ</div>' : '') +
      '<div data-fysend="' + esc(rec.code) + '"' + ((rec.us && rec.sentAt) ? ' style="opacity:.45;filter:grayscale(1);"' : '') + '>' + (function () { var h = window.fyLineCheck('【ふよみ】' + rec.name + ' さん　' + titleOf(rec) + '　' + subOf(rec) + '\nコード：' + rec.code); if (window.fyNewLookOn && window.fyNewLookOn()) return ""; return (isUnsent(rec) || !rec.us && celebrating) ? h : h.replace(/fyLineBlink/g, ""); })() + '</div>' +
      '<div style="height:8px"></div>';
  }

  /* 大きな画面 */
  var ov = document.createElement("div");
  ov.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:10001;background:rgba(0,0,0,0.5);display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;";
  ov.innerHTML = '<div style="width:100%;max-width:360px;max-height:88vh;overflow-y:auto;background:#fff;border-radius:20px;padding:16px;box-sizing:border-box;text-align:center;color:#5b4636;">' +
    '<div id="fyOvBody"></div>' +
    '<button id="fyOvClose" style="width:100%;margin-top:6px;padding:13px;font-size:17px;font-weight:900;border:none;border-radius:16px;background:#ff9800;color:#fff;position:sticky;bottom:-16px;z-index:5;box-shadow:0 -14px 14px -6px rgba(255,255,255,.95);">◀ もどる</button>' +
    '</div>';
  document.body.appendChild(ov);
  document.getElementById("fyOvClose").addEventListener("click", function () {
    ov.style.display = "none";
    if (celebrating) {
      celebrating = false;
      queueScheduled = false;
      celQueue = [];
      /* おいわいを ちゃんと 見せおわったので、結果画面のボタンの ロックを ここで ときはなつ */
      var wasLocked = window.__fyCelLock;
      window.__fyCelLock = false;
      try { Storage.set("fy_cel_pending_" + activeProfileIndex, []); } catch (eCPc) {}
      /* 結果画面のボタンが、まだ薄いままのときは、ここで色づける */
      try { unlockResultButtons(); } catch (eU) {}
      try { closeAwardModal(); } catch (e) {}
      /* ボタンの「光り」も、おいわいが すんでから（まだ出していなければ、ここで出す） */
      try {
        var rsOk2 = function () { var rs = document.getElementById("resultScreen"); return rs && !rs.classList.contains("hidden"); };
        if (wasLocked && rsOk2()) fyNudge(document.querySelector("#resultButtonsWrap .accent"));
      } catch (eN) {}
      /* おいわいの あとは「つぎに やる ところ」へ：ふよみマスター → トップ（レジェンドへの みちが ひかる）／ト音・ヘ音 → おんぷカード */
      try {
        var go = window.__fyCelGo; window.__fyCelGo = null;
        if (window.fyNewLookOn && window.fyNewLookOn()) {
          if (go === "top") showSelectScreen(); else if (go === "grid") showLevelScreen();
        }
      } catch (e9) {}
    }
  });

  function openOverlay(html) {
    try { if (!/id="fyCbBack"/.test(html)) document.getElementById("fyOvClose").style.display = ""; } catch (e) {}
    document.getElementById("fyOvBody").innerHTML = html;
    ov.style.display = "flex";
  }

  /* 📨 LINEで せんせいに おくる ボタン（スクショの かわりに、なまえ・きろく・コードを 文にして 公式LINEへ） */
  function lineSendHtml(recs) {
    if (!Array.isArray(recs)) recs = [recs];
    recs = recs.filter(function (r) { return r && r.code; });
    if (!recs.length) return "";
    var oa = window.FY_OA || "@892rfjzh";
    var text = "【ふよみ】" + recs[0].name + " さん\n" + recs.map(function (r) { return titleOf(r) + "　" + dmd(r) + "\nコード：" + r.code; }).join("\n");
    var href = "https://line.me/R/oaMessage/" + oa + "/?" + encodeURIComponent(text);
    return '<a href="' + href + '" target="_blank" rel="noopener" style="text-decoration:none;display:block;margin:6px 0 8px;">' +
      '<span class="fyLineBlink" style="display:block;width:100%;box-sizing:border-box;padding:13px;font-size:16px;font-weight:900;color:#fff;background:#06c755;border-radius:12px;text-align:center;">📨 LINEで せんせいに おくる</span></a>';
  }

  function sendText() {
    return '<div style="font-size:12.5px;line-height:1.6;color:#806c5a;margin-bottom:8px;">' + 'コードは、せんせいに おくってから ' + CODE_DAYS + '日で みえなくなるよ。<br>カードは せんせいから わたすよ！</div>';
  }

  /* おいわい画面：いくつ あっても、1つの がめんに ならべる（スクショが 1回で すむ） */
  function showCel(recs, viewOnly) {
    if (!Array.isArray(recs)) recs = [recs];
    celebrating = !viewOnly;
    try { window.__fyCelGo = viewOnly ? null : (recs.some(function (r) { return r.type === "master"; }) ? "top" : (recs.some(function (r) { return r.type === "treble" || r.type === "bass"; }) ? "grid" : null)); } catch (e8) {}
    var body =
      '<div style="font-size:40px;">🎉</div>' +
      '<div style="font-size:19px;font-weight:900;margin-bottom:8px;">' + (viewOnly ? "たっせいの きろく" : "おめでとう！") + '</div>';
    recs.forEach(function (r) { body += cardHtml(r); });
    if (!(celebrating && window.fyNewLookOn && window.fyNewLookOn())) body += sendText();
    openOverlay(body);
    if (!viewOnly) { try { window.__fyCelUntil = Date.now() + 12000; } catch (e) {} playCelSounds(recs); }
  }

  /* 画面が出た しゅんかんに、ファンファーレ → （おわってから）マスターの声 */
  function playCelSounds(recs) {
    var hasLegend = false, hasMaster = false;
    recs.forEach(function (r) {
      if (r.type === "legend") hasLegend = true;
      if (r.type === "master" || r.type === "treble" || r.type === "bass") hasMaster = true;
    });
    var voice = heldVoice;
    heldVoice = null;
    var fan = hasLegend ? "hyoshoFanfareAudio" : (hasMaster ? "hyoshoFanfare1Audio" : null);
    /* ファンファーレが先 → そのあとに、マスターの声 */
    var voiceDelay = 0;
    if (fan) {
      try { playAudioCloned(fan); } catch (e) {}
      voiceDelay = (getSoundDurationMs(fan) || 3500) + 200;
    }
    /* ふよみマスター（全カード）：声は「zunda-master.mp3」（ファイルが ないときは、ならさない） */
    var isFuyomiMaster = recs.some(function (r) { return r.type === "master"; });
    if (!voice && isFuyomiMaster) {
      setTimeout(function () { try { playAudioCloned("zundaMasterAudio"); } catch (e) {} }, voiceDelay);
    } else if (!voice && !hasLegend && !hasMaster) {
      /* 変音記号マスター／譜読みマスターなど：ファンファーレの あとに「おめでとう」 */
      setTimeout(function () { try { playAudioCloned("zundaOmedetoAudio"); } catch (e) {} }, voiceDelay + 100);
    }
    if (voice) {
      if (voiceDelay > 0) setTimeout(function () { try { playAudioCloned(voice); } catch (e) {} }, voiceDelay);
      else { try { playAudioCloned(voice); } catch (e) {} }
    }
  }

  function nextCel() {
    if (celQueue.length) {
      var recs = celQueue;
      celQueue = [];
      try { Storage.set("fy_cel_pending_" + activeProfileIndex, []); } catch (eCPn) {}
      showCel(recs, false);
    } else {
      celebrating = false;
      queueScheduled = false;
      window.__fyCelLock = false;
      try { unlockResultButtons(); } catch (eUn) {}
      try { closeAwardModal(); } catch (e) {}
    }
  }

  /* 念のための 保険：ボタンを ロックしていても、べつの 操作画面の 切りかえ（navigateTo）で
     けっか画面から はなれて しまい、まだ 見せていない おいわいが Storage に 残っているときは、
     つぎの画面に 来た ところで かならず 出す。 */
  var origNavigateToForCel = window.navigateTo;
  if (typeof origNavigateToForCel === "function") window.navigateTo = function (screenId) {
    var r = origNavigateToForCel.apply(this, arguments);
    try {
      if (screenId !== "resultScreen") {
        var idxN = activeProfileIndex;
        var pend = Storage.get("fy_cel_pending_" + idxN, []);
        if (Array.isArray(pend) && pend.length) {
          Storage.set("fy_cel_pending_" + idxN, []);
          window.__fyCelLock = false;
          celQueue = [];
          setTimeout(function () { showCel(pend, false); }, 50);
        }
      }
    } catch (eNav) {}
    return r;
  };

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
    /* 2026-11-22：カード（達成カード・イベントの 賞カード）も、きしゅへんの ときに うつせる ように（先生の 指示） */
    var achBk = getAch(idx);
    if (Array.isArray(achBk) && achBk.length) o.a = achBk;
    /* 2026-11-24：合格レベル・6つのドの合格・れんぞく回数・半期の回数・色おんぷの設定も うつせる ように（先生の 指示。ポイントは のぞく） */
    try {
      var dot0 = Storage.get("onpu_do_test_best_" + idx);
      if (dot0 && typeof dot0.accuracy === "number") o.dot = dot0;
    } catch (e) {}
    function maxClearedLevel(clef) {
      var mx = 0;
      for (var lv = 1; lv <= 5; lv++) {
        var ok = (typeof hasLevelCleared === "function") && hasLevelCleared(idx, clef, lv);
        if (!ok && lv === 1 && (clef === "treble" || clef === "bass") && typeof fyColorLv1Cleared === "function") ok = fyColorLv1Cleared(idx, clef);
        if (ok) mx = lv;
      }
      return mx;
    }
    o.lv = { t: maxClearedLevel("treble"), b: maxClearedLevel("bass"), a: maxClearedLevel("all") };
    o.tr = Storage.getNumber("fy_tr5run_" + idx, 0);
    o.bs = Storage.getNumber("fy_bs5run_" + idx, 0);
    o.hf = { id: Storage.get("fy_half_id_" + idx, ""), cnt: Storage.getNumber("fy_half_cnt_" + idx, 0) };
    var clT = Storage.get("fy_color_" + idx + "_treble"), clB = Storage.get("fy_color_" + idx + "_bass");
    if (clT || clB) o.cl = { t: clT || "", b: clB || "" };
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
    /* 2026-11-22：カードの 復元。おなじ カードが 2まいに ならない ように、カードの しゅるいで くらべる
       （名人は 100かい・200かい…ごとに べつの カード、イベントは イベントめいごとに べつの カード）。 */
    if (Array.isArray(o.a) && o.a.length) {
      var achKey = function (r) {
        if (!r) return null;
        if (r.type === "legend") return "legend:" + (r.n || 0);
        if (r.type === "event") return "event:" + (r.ev || "");
        /* 2026-11-24：halfend は n に 最終回数が 入っている（期のid_回数）ので、
           期（half）で くらべる（期が おなじなら、回数が ちがっても 同じ1まいの カード）。
           それ以外（lvclear・half・trrun・bsrun・mbest など）は type だけでは
           同じ しゅるいの カードが 2まい以上 あるとき 1まいしか もどらないので、
           n（ないものは type だけ）も あわせて みる。 */
        if (r.type === "halfend") return "halfend:" + (r.half !== undefined && r.half !== null ? r.half : (r.n || ""));
        return r.type + ":" + (r.n !== undefined && r.n !== null ? r.n : "");
      };
      var curA = getAch(idx), haveA = {};
      curA.forEach(function (r) { haveA[achKey(r)] = true; });
      var addedCards = 0;
      o.a.forEach(function (r) {
        var k = achKey(r);
        if (!k || haveA[k]) return;
        haveA[k] = true; curA.push(r); addedCards++;
      });
      if (addedCards) { Storage.set("fy_ach_" + idx, curA); done.push("カード " + addedCards + "まい"); }
    }
    /* 2026-11-24：合格レベル・6つのドの合格・れんぞく回数・半期の回数・色おんぷの設定（数字は 大きいほうを のこす） */
    if (o.dot && typeof o.dot.accuracy === "number") {
      var curDot = Storage.get("onpu_do_test_best_" + idx);
      if (!curDot || typeof curDot.accuracy !== "number" || o.dot.accuracy > curDot.accuracy) {
        Storage.set("onpu_do_test_best_" + idx, o.dot);
        if (o.dot.accuracy >= 90 && (!curDot || curDot.accuracy < 90)) done.push("6つの ド ごうかく");
      }
    }
    if (o.lv && typeof o.lv === "object") {
      [["t", "treble", "ト音記号"], ["b", "bass", "ヘ音記号"], ["a", "all", "全カード"]].forEach(function (pp) {
        var upTo = o.lv[pp[0]] | 0;
        if (upTo > 0 && ensureLevels(idx, pp[1], upTo)) done.push(pp[2] + " レベル" + upTo + "まで ごうかく");
      });
    }
    if ((o.tr | 0) > Storage.getNumber("fy_tr5run_" + idx, 0)) { Storage.set("fy_tr5run_" + idx, o.tr | 0); done.push("ト音記号 れんぞく " + (o.tr | 0) + "回"); }
    if ((o.bs | 0) > Storage.getNumber("fy_bs5run_" + idx, 0)) { Storage.set("fy_bs5run_" + idx, o.bs | 0); done.push("ヘ音記号 れんぞく " + (o.bs | 0) + "回"); }
    if (o.hf && o.hf.id) {
      var curHalfId = halfId(new Date());
      if (o.hf.id === curHalfId) {
        var curHalfCnt = Storage.getNumber("fy_half_cnt_" + idx, 0);
        if ((o.hf.cnt | 0) > curHalfCnt) {
          Storage.set("fy_half_id_" + idx, curHalfId);
          Storage.set("fy_half_cnt_" + idx, o.hf.cnt | 0);
          done.push("半期の きろく " + (o.hf.cnt | 0) + "回");
        }
      }
    }
    if (o.cl && typeof o.cl === "object") {
      if (o.cl.t && !Storage.get("fy_color_" + idx + "_treble")) { Storage.set("fy_color_" + idx + "_treble", o.cl.t); done.push("ト音記号の 色おんぷの せってい"); }
      if (o.cl.b && !Storage.get("fy_color_" + idx + "_bass")) { Storage.set("fy_color_" + idx + "_bass", o.cl.b); done.push("ヘ音記号の 色おんぷの せってい"); }
    }
    try { initProfiles(); } catch (e) {}
    if (!done.length) return { ok: true, msg: "この端末には、すでに同じか、それ以上の記録があります。新しく書き込む記録は、ありませんでした。" };
    var uniq = done.filter(function (x, i) { return done.indexOf(x) === i; });
    return { ok: true, msg: "復元しました。\n・" + uniq.join("\n・") };
  }
  window.fyShowBackup = function (forceIdx) {
    var idx = (typeof forceIdx === "number") ? forceIdx : activeProfileIndex, code = makeChunkBackup(idx);
    openOverlay(
      '<div style="font-size:18px;font-weight:900;margin-bottom:6px;">📤 きろくを うつす コード</div>' +
      '<div style="font-size:12.5px;line-height:1.7;color:#806c5a;margin-bottom:8px;text-align:left;">あたらしい たんまつに かえる ときに つかいます。<br>' +
      '✅ うつせる：れんしゅうの きろく（レジェンドへの みち）・きょくの きろく・イベントの きろく・ふよみテストと えんそうの ごうかく・ハンコの 日・<b>カード</b>・合格した レベル・6つの ドの ごうかく・れんぞく回数・半期の きろく・色おんぷの せってい<br>' +
      '❌ うつせない：ポイントや こうかんの きろく、こまかい れんしゅうの ログ（ポイントは せんせいの 復元コードで うつせます）<br>' +
      '<span style="color:#2b3a6a;">プレイヤー：<b>' + esc(profiles[idx] || "") + '</b> さん</span></div>' +
      '<textarea id="fyBkCode" readonly style="width:100%;height:110px;font-size:10px;padding:6px;border:2px solid #eadcc8;border-radius:10px;box-sizing:border-box;word-break:break-all;-webkit-user-select:text;user-select:text;">' + code + '</textarea>' +
      '<button id="fyBkCopy" style="width:100%;margin-top:6px;padding:10px;font-size:15px;font-weight:800;border:none;border-radius:10px;background:#5c6bc0;color:#fff;">コードを コピー</button>' +
      window.fyLineBtn(window.fyRestoreText('【ふよみ】' + (profiles[idx] || '') + ' さんの きろくの うつしコード\n' + code, code), '📨 せんせいに おくる') +
      '<div style="font-size:12px;color:#806c5a;line-height:1.6;margin-top:4px;">おすと LINEが ひらくよ。<b>ひこうきの マーク</b>を おして おくってね</div>' +
      '<div style="font-size:12px;line-height:1.6;color:#806c5a;margin:8px 0;">せんせいに おくって おくと、あたらしい たんまつで こまった ときに LINEの れきしを 見れば コードが 見つかるよ。あたらしい たんまつでは「🔁 記録の復元」に はってね。</div>'
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
    var visible = all.filter(function (r) { return isUnsent(r) || now - (r.sentAt || r.t) < limit; });
    visible.sort(function (a, b) { return (isUnsent(b) ? 1 : 0) - (isUnsent(a) ? 1 : 0) || b.t - a.t; });   /* まだ おくっていない ものを いちばん うえに */

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
      if (window.fyNewLookOn && window.fyNewLookOn()) {
        /* おくるのは「きょうは おわり」から。おくれなかった とき だけ、ここから もういちど */
        var demoCB = !!(window.fyDemoOn && window.fyDemoOn());
        var rl = visible.map(function (r) { return "🏅 " + titleOf(r) + "　" + subOf(r) + "　コード：" + (demoCB ? "みほん" : r.code); });
        try { rl = rl.concat(window.fyExAllLines(idx) || []); } catch (eR) {}
        if (demoCB) rl = rl.map(function (l) { return l.replace(/コード[：:]\s*[A-Za-z0-9\-]+/g, "コード：みほん"); });
        html += '<a href="https://line.me/R/oaMessage/' + (window.FY_OA || "@892rfjzh") + '/?' + encodeURIComponent((demoCB ? "【きょうしつ見本】" : "") + "【ふよみ】" + (profiles[idx] || "") + " さん\n" + rl.join("\n")) + '" target="_blank" rel="noopener" style="display:block;font-size:12px;color:#8a7a68;text-decoration:underline;margin:2px 0 8px;">おくれなかった ときは ここ</a>';
      }
      html += '<div style="font-size:12px;color:#806c5a;margin-bottom:8px;">コードは、せんせいに おくってから ' + CODE_DAYS + '日で みえなくなるよ。</div>';
    } else {
      html += '<div style="font-size:13px;line-height:1.6;margin-bottom:10px;color:#806c5a;">いま みえる コードは ないよ。<br>コードは、せんせいに おくってから ' + CODE_DAYS + '日で みえなくなるよ。</div>';
    }
    html += '<button id="fyRestoreBtn" style="width:100%;margin:2px 0 4px;padding:8px;font-size:12px;font-weight:700;border:1px dashed #b0a090;border-radius:10px;background:#fff;color:#806c5a;">🔁 記録の復元（先生から コードが 届いたとき）</button>';
    html += '<button id="fyBackupBtn" style="width:100%;margin:2px 0 4px;padding:8px;font-size:12px;font-weight:700;border:1px dashed #b0a090;border-radius:10px;background:#fff;color:#806c5a;">📤 きろくを うつす コードを つくる（きかい へんこう）</button>';
    openOverlay(html);
    var rbtn = document.getElementById("fyRestoreBtn");
    if (rbtn) rbtn.addEventListener("click", showRestoreForm);
    var bbtn = document.getElementById("fyBackupBtn");
    if (bbtn) bbtn.addEventListener("click", function () { window.fyShowBackup(); });
  };

  /* ===== 🎴 カードブック（もっている カードを みる） ===== */
  var CARDBOOK = [
    ["treble", "ト音記号マスター", "card_treble_front.png"],
    ["bass", "ヘ音記号マスター", "card_bass_front.png"],
    ["master", "ふよみマスター", "card_master_front.png"],
    ["half", "ふよみ メダル", "card_event_front.png"],
    ["halfend", "ふよみ メダル（きろくカード）", "card_medal_front.png", "card_meijin_front.png"],
    ["legend5", "ふよみレジェンド", "card_legend_front.png"],
    ["maestro", "ふよみマエストロ", "card_maestro_front.png"],
    ["event", "イベントの 賞カード", "card_event_front.png"],
    ["trrun", "ト音記号 れんぞくしょう", "card_event_front.png"],
    ["bsrun", "ヘ音記号 れんぞくしょう", "card_event_front.png"],
    ["lvclear", "はじめての ごうかくカード", "card_event_front.png"]
  ];
  /* 2026-11-24：カードの絵が まだ 置かれて いないとき（例：card_medal_front.png）、今までの 絵に もどす */
  function cbImgOnerr(c) { return c[3] ? ' onerror="this.onerror=null;this.src=\'' + c[3] + '?v=20261115l\'"' : ""; }
  /* 2026-11-23：まだ もらっていない カードを タップしたときの せつめい
     2026-11-24：「ふよみ名人」は 半期の きろくカードの ゴールドランクに なったので、legend は 廃止。 */
  var LOCK_TIP = {
    treble: "🎼 ト音記号の レベル5で、20問を ぜんぶ いっぱつで せいかいすると もらえるよ！",
    bass: "🎼 ヘ音記号の レベル5で、20問を ぜんぶ いっぱつで せいかいすると もらえるよ！",
    master: "🎓「ぜんぶ」コースの レベル5で、20問を ぜんぶ いっぱつで せいかいすると もらえるよ！",
    half: "🏅「ぜんぶ」コースの レベル5・20問を ぜんぶ いっぱつで せいかいした 通算かいすうが、期ごとの メダル（🥉銅メダル・🥈銀メダル・🥇金メダル）に とどくと もらえるよ！🥇が「ふよみ名人」だよ。",
    halfend: "📋 期（4〜9月・10〜3月）が おわると、その期の「ふよみ メダル」の きろくカードが できるよ。",
    legend5: "👑 ぜんぶの きょくで、ふよみの テストに ごうかくすると もらえるよ！（せんせいから もらう カードだよ）",
    maestro: "🎹 ぜんぶの きょくで、せんせいの えんそう チェックに ごうかくすると もらえるよ！（せんせいから もらう カードだよ）",
    event: "🏆 ふよみチャレンジの イベントに さんかして、しょうを とると もらえるよ！",
    trrun: "🎼 ト音記号の レベル5で、20問を ぜんぶ いっぱつで せいかいするのが 10回 れんぞくすると もらえるよ！",
    bsrun: "🎼 ヘ音記号の レベル5で、20問を ぜんぶ いっぱつで せいかいするのが 10回 れんぞくすると もらえるよ！",
    lvclear: "🎵 ト音記号・ヘ音記号・全カードの レベル1〜4で、はじめて ごうかく（せいかいりつ90%いじょう）すると、1まいずつ もらえるよ！（ポイントは つかないよ）"
  };
  function bestAch(idx, type) {
    if (type !== "legend") return findAch(idx, type);
    var best = null;
    getAch(idx).forEach(function (a) { if (a.type === "legend" && (!best || (a.n || 0) > (best.n || 0))) best = a; });
    return best;
  }
  /* カードの 絵の「なまえ」「ひづけ」の ところに 文字を のせる（印刷と おなじ 場所） */
  function cardOv(rec, idx) {
    if (!rec) return "";
    var nm = String(rec.name || profiles[idx] || ""), dt = "";
    try { var d0 = String(rec.date || rec.d || "").match(/(\d{4})-(\d{1,2})-(\d{1,2})/); if (d0) dt = (+d0[1]) + "年" + (+d0[2]) + "月" + (+d0[3]) + "日"; else if (rec.t || rec.at) { var dd = new Date(rec.t || rec.at); dt = dd.getFullYear() + "年" + (dd.getMonth() + 1) + "月" + dd.getDate() + "日"; } else dt = dmd(rec); } catch (e) { dt = dmd(rec); }
    var fs = Math.min(6, 46 / Math.max(nm.length, 1)), fs2 = Math.min(4, 46 / Math.max(dt.length, 1)), b = "position:absolute;left:57.1%;transform:translate(-50%,-100%);white-space:nowrap;font-weight:800;line-height:1;color:#2b3a6a;";
    var extra = "";
    if (rec.type === "event" || rec.type === "mbest" || rec.type === "trrun" || rec.type === "bsrun" || rec.type === "half" || rec.type === "halfend" || rec.type === "lvclear") {
      /* 2026-11-21：イベントカードは、絵の 赤い リボンに「〇〇賞」、その上に イベント名を のせる（印刷カードと おなじ 場所）。
         2026-11-23：ノーミスれんぞく賞も、おなじ カードの絵を つかって この場所に 文字を のせる。
         2026-11-24：半期の きろくカードも 同様（月間ベスト賞は 廃止）。 */
      if (rec.ev) extra += '<div style="position:absolute;left:50%;top:45.5%;transform:translate(-50%,-50%);white-space:nowrap;text-align:center;font-weight:800;line-height:1;color:#2b6b5e;font-size:' + Math.min(5, 40 / Math.max(String(rec.ev).length, 1)) + 'cqw;">' + esc(rec.ev) + '</div>';
      if (rec.award) extra += '<div style="position:absolute;left:50%;top:53.3%;transform:translate(-50%,-50%);white-space:nowrap;text-align:center;font-weight:900;line-height:1;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35);font-size:' + Math.min(7.5, 52 / Math.max(String(rec.award).length, 1)) + 'cqw;">' + esc(rec.award) + '</div>';
    }
    return '<div style="' + b + 'top:72%;font-size:' + fs + 'cqw;">' + esc(nm) + '</div><div style="' + b + 'top:81.3%;font-size:' + fs2 + 'cqw;">' + esc(dt) + '</div>' + extra;
  }
  window.showCardBook = function () {
    try { document.getElementById("fyOvClose").style.display = ""; } catch (e) {}
    var idx = activeProfileIndex, have = 0, list = [];
    CARDBOOK.forEach(function (c) {
      if (c[0] === "event" || c[0] === "trrun" || c[0] === "bsrun" || c[0] === "half" || c[0] === "halfend" || c[0] === "lvclear") {
        /* 2026-11-21：イベントの 賞カードは、年ごとに もらえるので、もらった ぶんだけ 1まいずつ。
           2026-11-23：ノーミスれんぞく賞も、おなじように もらった ぶんだけ 1まいずつ。
           2026-11-24：半期の きろくカード（half・halfend）も、ランク・期ごとに もらった ぶんだけ 1まいずつ（月間ベスト賞は 廃止）。 */
        var es = getAch(idx).filter(function (a) { return a && a.type === c[0]; }).sort(function (x, y) { return (x.t || 0) - (y.t || 0); });
        if (!es.length) list.push({ c: c, rec: null }); else es.forEach(function (m) { list.push({ c: c, rec: m }); });
        return;
      }
      list.push({ c: c, rec: findAch(idx, c[0]) });
    });
    /* 2026-11-24：「ふよみ名人（れんぞく100回）」「月間ベスト賞」は 廃止したので、CARDBOOK には もう のせない。
       ただし、もう もらって いる 子の カードは 消さず、もっている ぶんだけ ここに 足す（まだの 子には 出さない）。 */
    [["legend", "ふよみ名人", "card_meijin_front.png"], ["mbest", "月間ベスト賞", "card_event_front.png"]].forEach(function (cc) {
      var old = getAch(idx).filter(function (a) { return a && a.type === cc[0]; }).sort(function (x, y) { return (x.t || 0) - (y.t || 0); });
      old.forEach(function (m) { list.push({ c: cc, rec: m }); });
    });
    /* 2026-11-21：もっている カードを さきに（とった じゅんに）、まだの カードは あとに まとめる（先生の 指示）。 */
    list.sort(function (a, b) {
      var ao = !!a.rec, bo = !!b.rec;
      if (ao !== bo) return ao ? -1 : 1;
      if (ao && bo) return (b.rec.t || 0) - (a.rec.t || 0);
      return 0;
    });
    var cells = list.map(function (it, i) {
      var c = it.c, rec = it.rec, img = c[2], label = c[1], num = "";
      if (rec) have++;
      if (c[0] === "legend" && rec) { num = (rec.n || 100) + "かい"; if (rec.n >= 1000) img = "card_legend1000_front.png"; }
      if ((c[0] === "event" || c[0] === "mbest" || c[0] === "trrun" || c[0] === "bsrun" || c[0] === "half" || c[0] === "halfend" || c[0] === "lvclear") && rec && rec.award) label = rec.award;
      it.img = img;
      var st = rec ? "" : "filter:grayscale(1) brightness(.55);opacity:.55;";
      return '<div data-cb="' + i + '" style="text-align:center;cursor:pointer;">' +
        '<div style="position:relative;container-type:inline-size;font-size:0;">' + cardOv(rec, idx) + '<img src="' + img + '?v=20261115l" alt=""' + cbImgOnerr(c) + ' style="width:100%;display:block;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,.25);' + st + '">' +
        (num ? '<div style="position:absolute;right:3px;bottom:5px;background:#ffb300;color:#5a3a00;font-size:11px;font-weight:900;border-radius:10px;padding:1px 7px;border:2px solid #fff;">' + num + '</div>' : '') +
        (rec ? "" : '<div style="position:absolute;left:0;right:0;top:42%;font-size:13px;font-weight:900;color:#fff;text-shadow:0 1px 3px #000;">🔒 まだ</div>') + '</div>' +
        '<div style="font-size:10px;font-weight:800;margin-top:3px;color:#5b4636;">' + label + '</div>' +
        '<div style="font-size:11px;color:#806c5a;min-height:15px;">' + (rec ? dmd(rec) : "") + '</div></div>';
    }).join("");
    openOverlay('<div style="position:relative;font-size:19px;font-weight:900;margin-bottom:2px;">🎴 カード' + (window.fyDemoBadgeHtml ? window.fyDemoBadgeHtml() : "") + '</div>' +
      '<div style="font-size:12px;color:#806c5a;margin-bottom:10px;">' + (profiles[idx] || "") + ' さんの カード　' + have + ' まい</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:6px;">' + cells + '</div>');
    Array.prototype.forEach.call(document.querySelectorAll("#fyOvBody [data-cb]"), function (el) {
      el.addEventListener("click", function () {
        var it = list[+el.getAttribute("data-cb")], rec = it.rec;
        if (!rec) {
          /* 2026-11-23：まだの カードは、もらい方の せつめいを 出す */
          openOverlay('<div style="position:relative;container-type:inline-size;width:60%;max-width:200px;margin:0 auto;"><img src="' + it.img + '?v=20261115l" alt=""' + cbImgOnerr(it.c) + ' style="width:100%;display:block;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,.3);filter:grayscale(1) brightness(.55);opacity:.55;"></div>' +
            '<div style="font-size:17px;font-weight:900;margin-top:10px;">🔒 ' + esc(it.c[1]) + '</div>' +
            '<div style="font-size:14px;color:#5b4636;margin-top:8px;line-height:1.7;">' + esc(LOCK_TIP[it.c[0]] || "") + '</div>' +
            '<button id="fyCbBack" style="margin-top:12px;border:none;background:#ff9800;color:#fff;font-size:16px;font-weight:900;border-radius:16px;padding:9px 18px;">◀ もどる</button>');
          var bb0 = document.getElementById("fyCbBack"); if (bb0) bb0.addEventListener("click", window.showCardBook);
          return;
        }
        /* カードを おおきく みるだけ（LINEの ボタンは ださない。おくるのは「きろくと コード」から） */
        openOverlay('<div style="position:relative;container-type:inline-size;width:72%;max-width:250px;margin:0 auto;">' + cardOv(rec, activeProfileIndex) + '<img src="' + it.img + '?v=20261115l" alt=""' + cbImgOnerr(it.c) + ' style="width:100%;display:block;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,.3);">' + (window.fyDemoBadgeHtml ? window.fyDemoBadgeHtml() : "") + '</div>' +
          '<div style="font-size:17px;font-weight:900;margin-top:10px;">' + esc((it.c[0] === "event" || it.c[0] === "mbest" || it.c[0] === "trrun" || it.c[0] === "bsrun" || it.c[0] === "half" || it.c[0] === "halfend" || it.c[0] === "lvclear") && rec.award ? rec.award : it.c[1]) + (it.c[0] === "legend" ? "　" + (rec.n || 100) + "かい" : "") + '</div>' +
          '<div style="font-size:19px;font-weight:900;margin-top:6px;">' + esc(rec.name || profiles[activeProfileIndex] || "") + ' さん　' + dmd(rec) + '</div>' +
          '<div style="font-size:12px;color:#806c5a;margin-top:2px;">コード：' + ((window.fyDemoOn && window.fyDemoOn()) ? "みほん" : esc(rec.code)) + '</div>' +
          '<button id="fyCbBack" style="margin-top:12px;border:none;background:#ff9800;color:#fff;font-size:16px;font-weight:900;border-radius:16px;padding:9px 18px;">◀ もどる</button>');
        var bb = document.getElementById("fyCbBack"); if (bb) bb.addEventListener("click", window.showCardBook);
        try { document.getElementById("fyOvClose").style.display = "none"; } catch (e) {}
      });
    });
  };

  /* トップ画面：スタンプの表示は やめて、「きろくと コード」のボタンだけ */
  window.renderStampMini = function (idx) {
    var container = document.getElementById("stampMiniBox");
    if (!container) return;
    container.style.cssText = "display:flex;justify-content:center;margin-top:4px;padding:2px;background:transparent;border:none;";
    container.innerHTML = '<button id="fyCodeBtn" style="border:none;background:#ffb300;color:#5b4636;font-size:13px;font-weight:800;border-radius:10px;padding:8px 16px;cursor:pointer;">🎖 きろくと コード</button>' +
      '<button id="fyBookBtn" style="border:none;background:#7e57c2;color:#fff;font-size:13px;font-weight:800;border-radius:10px;padding:8px 16px;cursor:pointer;margin-left:8px;">🎴 カード</button>';
    var b = document.getElementById("fyCodeBtn");
    if (b) b.addEventListener("click", window.showCardCodes);
    try { window.fyUnsentDot(); } catch (e) {}
    var b2 = document.getElementById("fyBookBtn");
    if (b2) b2.addEventListener("click", window.showCardBook);
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
    var prevBest0 = runBest(idx);

    var run1 = run0;
    if (is20) {
      if (acc === 100) {
        run1 = run0 + 1;
        Storage.set(kTot, Storage.getNumber(kTot, 0) + 1);
        if (run1 > prevBest0) Storage.set(kBest, run1);
      } else {
        run1 = 0;
      }
      Storage.set(kRun, run1);
    }
    /* 2026-11-24：月間ベスト賞は 廃止（半期の きろくカードと 中身が 重なるため）。すでに 出た カードは カード帳に 残る。 */

    /* 🏅 半期の きろく（全カード レベル5・20問 ぜんぶ いっぱつの 通算回数）：
       期の くぎれ（4〜9月／10〜3月）は 毎回 チェックし、数えるのは 全カード レベル5の ときだけ。 */
    var isHalfRound = (is20 && selectedClef === "all" && selectedLevel === 5);
    var halfRes = halfUpdate(idx, isHalfRound && acc === 100);
    var halfRankRecs = (halfRes && halfRes.rankRecs) || [], halfEndRec = halfRes && halfRes.endRec;

    /* 2026-11-24：レベル1〜4の「はじめて ごうかく」カード（アプリ内だけ・ポイントなし）。
       この回で はじめて ごうかくに なったかを みるため、origShowResult で 記録が こうしん される 前の 状態を おぼえておく。
       レベル1は「色おんぷ」で ごうかくする ことも あるので、そちらも ごうかく あつかいに する（ほかの 場所と おなじ 判定）。 */
    function lvClearedEither(clef, lv) {
      var ok = (typeof hasLevelCleared === "function") && hasLevelCleared(idx, clef, lv);
      if (!ok && lv === 1 && (clef === "treble" || clef === "bass") && typeof fyColorLv1Cleared === "function") ok = fyColorLv1Cleared(idx, clef);
      return ok;
    }
    var lvlJustCleared = (selectedLevel >= 1 && selectedLevel <= 4 && !lvClearedEither(selectedClef, selectedLevel));

    /* 2026-11-24：🎼 ト音記号・ヘ音記号 それぞれの「レベル5」だけの れんぞく（節目：10回だけ。20回・50回は やめる）
       ほかの レベル（1〜4）や「ぜんぶ」コースは 数えない（まちがえたら 0に もどる）。
       10回に なった ときだけ、大きな おいわいカード＋ポイント。それ以外は、小さな「ただいま れんぞく」の表示だけ。 */
    var CLEF5_MS = [10];
    var isTr5 = (is20 && selectedClef === "treble" && selectedLevel === 5);
    var isBs5 = (is20 && selectedClef === "bass" && selectedLevel === 5);
    var trRun = Storage.getNumber("fy_tr5run_" + idx, 0), bsRun = Storage.getNumber("fy_bs5run_" + idx, 0);
    var trRec = null, bsRec = null;
    /* 2026-11-24：れんぞくが 切れて また 同じ回数に 届いても、同じ節目のカードを 2まい目 発行しない（getAch を直接見て判定。
       addAch 側の dedup は「ポイントの 二重払い」だけを 防いでいて、カードじたいは 何回でも 作られてしまっていたバグの修正） */
    function hasN(type, n) { var all = getAch(idx); for (var i = 0; i < all.length; i++) if (all[i] && all[i].type === type && all[i].n === n) return true; return false; }
    if (isTr5) {
      trRun = (acc === 100) ? trRun + 1 : 0;
      Storage.set("fy_tr5run_" + idx, trRun);
      if (acc === 100 && CLEF5_MS.indexOf(trRun) !== -1 && !hasN("trrun", trRun)) {
        var trExtra = { ev: "ト音記号 れんぞくしょう", award: "れんぞく " + trRun + "回" };
        trExtra.promo = hasN("bsrun", 10) ? "つぎは りょうて（ぜんぶ）の レベル5で、半期の きろくを ふやそう！" : "つぎは ヘ音記号の レベル5に ちょうせんしよう！";
        trRec = addAch(idx, "trrun", trRun, trExtra);
      }
    }
    if (isBs5) {
      bsRun = (acc === 100) ? bsRun + 1 : 0;
      Storage.set("fy_bs5run_" + idx, bsRun);
      if (acc === 100 && CLEF5_MS.indexOf(bsRun) !== -1 && !hasN("bsrun", bsRun)) {
        var bsExtra = { ev: "ヘ音記号 れんぞくしょう", award: "れんぞく " + bsRun + "回" };
        bsExtra.promo = hasN("trrun", 10) ? "つぎは りょうて（ぜんぶ）の レベル5で、半期の きろくを ふやそう！" : "つぎは ト音記号の レベル5に ちょうせんしよう！";
        bsRec = addAch(idx, "bsrun", bsRun, bsExtra);
      }
    }

    /* けっかを 日づけつきで きろく（保護者ページの「今週の頑張り」用） */
    try {
      var log = Storage.get("fy_log_" + idx, []);
      if (!Array.isArray(log)) log = [];
      var fyDuration = 0;
      try { fyDuration = Math.round((Date.now() - trainingStartTime) / 1000); } catch (e2) { fyDuration = 0; }
      log.push({ t: Date.now(), c: selectedClef, l: selectedLevel, n: N, a: acc, d: fyDuration });
      if (log.length > 300) log = log.slice(log.length - 300);
      Storage.set("fy_log_" + idx, log);
    } catch (e) {}

    /* マスターの声は、おいわい画面が出てから鳴らす（はじめて取るときだけ） */
    heldVoice = null;
    suppressMasterVoice = !!(acc === 100 && is20 && selectedLevel === 5 &&
      ((selectedClef === "treble" && !findAch(idx, "treble")) || (selectedClef === "bass" && !findAch(idx, "bass"))));
    /* はじめての マスターの けっか画面：すごい → ファンファーレ → 「おめでとう」 */
    omedetoPending = !!suppressMasterVoice;   /* ふよみマスターは、おいわい画面の こえに「おめでとう」が はいっているので ここでは ならさない */

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
      /* 🏅 名人に ちょうせん中の ひょうじ（マスターを とったあとから。マスターを とる 1かいめは、とった ときから） */
      var mj = document.getElementById("fyMeijinMsg");
      if (!mj && sm && sm.parentNode) {
        mj = document.createElement("div"); mj.id = "fyMeijinMsg";
        mj.style.cssText = "font-size:15px;font-weight:900;color:#8a5a00;margin:6px 0;";
        sm.parentNode.insertBefore(mj, sm.nextSibling);
      }
      if (mj) {
        var mt2 = "";
        if (isHalfRound && halfRes && (findAch(idx, "master") || acc === 100)) {
          var hRanks = halfRanks(halfRes.id), hCnt = halfRes.cnt || 0, hNext = -1;
          for (var hri = 0; hri < hRanks.length; hri++) if (hCnt < hRanks[hri]) { hNext = hri; break; }
          mt2 = (hNext === -1)
            ? "🏅 " + HALF_SERIES_NAME + "　" + halfLabel(halfRes.id) + "　ただいま " + hCnt + "回（🥇 金メダル たっせい ずみ！）"
            : "🏅 " + HALF_SERIES_NAME + "　" + halfLabel(halfRes.id) + "　ただいま " + hCnt + "回　つぎの ランクまで あと " + (hRanks[hNext] - hCnt) + "回";
        }
        mj.textContent = mt2;
        mj.style.display = mt2 ? "" : "none";
      }
      /* 2026-11-24：🎼 ト音記号・ヘ音記号 レベル5の「ただいま れんぞく」の、小さな ひょうじ（節目いがいは 大きな おいわいを 出さない） */
      var c5 = document.getElementById("fyClef5Msg");
      if (!c5 && mj && mj.parentNode) {
        c5 = document.createElement("div"); c5.id = "fyClef5Msg";
        c5.style.cssText = "font-size:13px;font-weight:700;color:#5a7a9a;margin:4px 0;";
        mj.parentNode.insertBefore(c5, mj.nextSibling);
      }
      if (c5) {
        var c5t = "";
        if (isTr5 && acc === 100) c5t = (trRun >= 10) ? "🎼 ト音記号 れんぞく 10回！（ここまで）" : "🎼 ト音記号 ただいま れんぞく " + trRun + "回";
        else if (isBs5 && acc === 100) c5t = (bsRun >= 10) ? "🎼 ヘ音記号 れんぞく 10回！（ここまで）" : "🎼 ヘ音記号 ただいま れんぞく " + bsRun + "回";
        c5.textContent = c5t;
        c5.style.display = c5t ? "" : "none";
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
    if (trRec) cel.push(trRec);
    if (bsRec) cel.push(bsRec);
    if (acc === 100 && is20 && selectedLevel === 5) {
      var mt = null;
      if (selectedClef === "treble") mt = addAch(idx, "treble", 0);
      else if (selectedClef === "bass") mt = addAch(idx, "bass", 0);
      else if (selectedClef === "all") mt = addAch(idx, "master", 0);
      if (mt) cel.push(mt);
    }

    /* 🏅 半期の きろく：ランクに とどいた とき（🥇＝ふよみ名人）、期が おわって きろくが かくてい した とき */
    halfRankRecs.forEach(function (r) { cel.push(r); });
    if (halfEndRec) cel.push(halfEndRec);

    /* 🎴 レベル1〜4「はじめて ごうかく」カード：この回で ごうかくに なった ときだけ、1まいきり（クレフごと・レベルごと） */
    if (lvlJustCleared && lvClearedEither(selectedClef, selectedLevel)) {
      var lvClefLabel = selectedClef === "treble" ? "ト音記号" : selectedClef === "bass" ? "ヘ音記号" : selectedClef === "all" ? "全カード" : null;
      if (lvClefLabel) {
        var lvN = selectedClef + "_" + selectedLevel;
        if (!hasN("lvclear", lvN)) {
          var lvRec = addAch(idx, "lvclear", lvN, { ev: lvClefLabel, award: lvClefLabel + " レベル" + selectedLevel + " はじめて ごうかく", clef: selectedClef, lv: selectedLevel });
          if (lvRec) cel.push(lvRec);
        }
      }
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
      window.__fyCelLock = true;
      /* 結果画面のボタンを、おいわいを見せるまで薄くして押せなくする（100%のときと同じあつかい） */
      try { setResultButtonsDisabled(true); } catch (eRBd) {}
      /* 万一、ボタン以外の操作などで おいわいが 取り消されても、つぎの画面で 出しなおせるように 控えておく */
      try { Storage.set("fy_cel_pending_" + idx, cel); } catch (eCPs) {}
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
    /* トレーニングボタンを 2かい つづけて さわっても、1かいだけ はじめる */
    var nowT = Date.now();
    if (window.__fyTrainAt && nowT - window.__fyTrainAt < 1500) return;
    window.__fyTrainAt = nowT;
    firstTry = 0;
    qMistake = false;
    thinkPlayed = false;
    var r0 = origStartTraining.apply(this, arguments);
    try { showMeijinBar(); } catch (e) {}
    try { fyClearNudges(); fyWakabaVoice("zunda-training.mp3", 900, function () { return trainingMode; }); } catch (e) {}
    return r0;
  };
  var origProceed = window.proceedToCards;
  if (typeof origProceed === "function") window.proceedToCards = function () {
    try { var mb0 = document.getElementById("fyMeijinBar"); if (mb0) mb0.style.display = "none"; } catch (e) {}
    window.__fyPracCount = 0;
    var rp0 = origProceed.apply(this, arguments);
    try { setTimeout(function () {
      var started = (typeof fyPracticeGuide === "function") ? fyPracticeGuide() : false;
      if (!started) { try { fyKeyNudge(); } catch (e) {} }
    }, 800); } catch (e) {}
    return rp0;
  };
  /* 🏅 名人に ちょうせん中：全カード レベル5の 20問を はじめる ときに、いまの れんぞくを 見せる（マスターを とったあとから） */
  function showMeijinBar() {
    var idx = activeProfileIndex;
    var bar = document.getElementById("fyMeijinBar");
    var ttl = document.getElementById("cardScreenTitle");
    if (!bar && ttl && ttl.parentNode) {
      bar = document.createElement("div"); bar.id = "fyMeijinBar";
      bar.style.cssText = "font-size:13px;font-weight:900;color:#8a5a00;background:#fff3cd;border-radius:12px;padding:3px 10px;margin:4px auto;display:none;text-align:center;";
      /* ヘッダーの 横ならびの 中に 入れると、タイトルが たてに つぶれる。ヘッダーの 下に おく */
      var hd = ttl.parentNode;
      if (hd.parentNode) hd.parentNode.insertBefore(bar, hd.nextSibling); else hd.appendChild(bar);
    }
    if (!bar) return;
    var show = (selectedClef === "all" && selectedLevel === 5 && targetValue >= 20 && findAch(idx, "master"));
    if (show) {
      /* 2026-11-24：「名人」が れんぞく100回 → 半期ごとの つうさん記録に かわったので、ここの ひょうじも 合わせる */
      var curId = halfId(new Date());
      var storedId = Storage.get("fy_half_id_" + idx, curId);
      var cnt = (storedId === curId) ? Storage.getNumber("fy_half_cnt_" + idx, 0) : 0;
      var ranks = halfRanks(curId), next = -1;
      for (var ri = 0; ri < ranks.length; ri++) if (cnt < ranks[ri]) { next = ri; break; }
      bar.textContent = "🏅 " + HALF_SERIES_NAME + "　" + halfLabel(curId) + "　ただいま " + cnt + "回" + (next === -1 ? "（🥇 金メダル たっせい ずみ！）" : "　つぎの ランクまで あと " + (ranks[next] - cnt) + "回");
      bar.style.display = "";
    }
    else bar.style.display = "none";
  }

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
    var trebleLv1 = dbg || hasLevelCleared(activeProfileIndex, "treble", 1) || fyColorLv1Cleared(activeProfileIndex, "treble");
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
    if (!window.fyRequireLogin()) return;
    var L = lockState();
    if (clef === "bass" && !L.bass) { fySay("まずは ト音記号の\nレベル1に ごうかくしよう！", "zunda-lock.mp3"); return; }
    if (clef === "all" && !L.all) { fySay("ト音記号と ヘ音記号に\nごうかくすると ひらくよ！", "zunda-lock.mp3"); return; }
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
      try {
        var chip = document.getElementById("fyWakabaChip");
        if (!chip && solo && solo.parentNode) {
          chip = document.createElement("button");
          chip.id = "fyWakabaChip";
          chip.style.cssText = "display:block;margin:0 auto 8px;font-size:12px;font-weight:800;border-radius:14px;padding:5px 12px;";
          chip.addEventListener("click", function () { fyWakabaAsk(); });
          solo.parentNode.insertBefore(chip, solo.nextSibling);
        }
        if (chip) { chip.style.display = (solo && solo.style.display !== "none") ? "block" : "none"; fyWakabaChipRefresh(); }
      } catch (e) {}

      var goBtn = document.querySelector(".profile-confirm-btn");
      if (goBtn) goBtn.style.display = "none";

      var regBtn = document.querySelector(".reg-open-btn");
      if (regBtn) {
        if (registeredCount() >= 3) {
          regBtn.style.display = "none";
        } else {
          regBtn.style.display = "";
          regBtn.textContent = (registeredCount() === 0) ? "🔑 合言葉を いれて はじめる" : "🔑 合言葉を いれて プレイヤーを ふやす";
          regBtn.style.cssText = "background:#ff7043;color:#fff;border:none;border-radius:14px;font-size:16px;font-weight:800;cursor:pointer;width:100%;margin-bottom:8px;padding:12px;";
          /* 2026-11-17 から：あたらしい プレイヤーを ふやすのは あいことばが 必要。
             もとの onclick="openRegistration(false)"（なまえの へんこう用）を 上書きして、あいことばの がめんを 出す。 */
          regBtn.onclick = null;
          if (!regBtn.dataset.fyGateBound) {
            regBtn.dataset.fyGateBound = "1";
            regBtn.addEventListener("click", function (e) {
              e.preventDefault();
              if (window.fyGateAddPlayerCode) window.fyGateAddPlayerCode();
            });
          }
        }
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

  /* ⚠️ これは index.html の openRegistration（なまえの とうろく）とは べつの もの。
     むかし ここで window.openRegistration を じょうずに 上書きして しまっていて、
     「✏️ なまえを とうろく・かえる」や「➕ プレイヤーを ふやす」が ぜんぶ こわれて いました。
     名前を かえて、ぶつからない ように しました。 */
  window.fyGateAddPlayerCode = function () {
    cancelable = true;
    codeInput.value = "";
    showCode("あいことばを いれてね", false);
  };

  /* 2026-11-17 から：トップ画面は だれでも 見られるけど、
     じっさいに「あそぶ」ボタン（6つのド・おんぷカード・レジェンドへの みち）を 押したときだけ、
     とうろく（あいことば）が 必要に なる。とうろく されていれば true、されていなければ
     あいことば がめんを 出して false を かえす（よびもとは、false の ときは なにも しない）。 */
  window.fyRequireLogin = function () {
    if (isRegistered(activeProfileIndex)) return true;
    window.fyGateAddPlayerCode();
    return false;
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
    if (id === "sugoiAudio") {
      lastSugoiAt = Date.now(); seqEndAt = 0;
      if (omedetoPending) {
        omedetoPending = false;
        var sM = getSoundDurationMs("sugoiAudio") || 1500, fM = getSoundDurationMs("tasseiFanfareAudio") || 3000, oM = getSoundDurationMs("zundaOmedetoAudio") || 1500;
        delayedTimers.push(setTimeout(function () { origPlay("zundaOmedetoAudio"); }, sM + 200 + fM + 100));
        seqEndAt = Date.now() + sM + 200 + fM + 100 + oM + 400;
      }
    }
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
    /* カードの おいわいが まだなら、ほかの どこからの 呼びだしでも ボタンを 色づけない
       （おいわいを ちゃんと 見せおわったとき だけ、nextCel／おいわい画面を 閉じたときに ときはなつ） */
    if (window.__fyCelLock) return;
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
    var colorTxt = "";
    try { if ((clef === "treble" || clef === "bass") && fyColorOn(idx, clef)) colorTxt = "（🎨いろおんぷ：レベル1 " + (fyColorLv1Cleared(idx, clef) ? "合格" : "挑戦中") + "）"; else if ((clef === "treble" || clef === "bass") && fyColorLv1Cleared(idx, clef)) colorTxt = "（🎨いろおんぷ レベル1：合格ずみ）"; } catch (e) {}
    if (clef === "bass" && !hasLevelCleared(idx, "treble", 1) && !fyColorLv1Cleared(idx, "treble") && c === 0) return label + "：まだ始めていません（ト音記号レベル1の合格後）";
    if (colorTxt && c === 0) return label + "：" + (fyColorOn(idx, clef) ? "" : "くろおんぷ レベル1に挑戦中 ") + colorTxt;
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
    var days = {}, cnt = 0, sum = 0, dsum = 0, dcnt = 0;
    log.forEach(function (e) {
      if (weekStart(new Date(e.t)) !== ws) return;
      days[localDateStr(new Date(e.t))] = 1;
      cnt++; sum += e.a;
      if (typeof e.d === "number" && e.d > 0) { dsum += e.d; dcnt++; }
    });
    return { days: Object.keys(days).length, cnt: cnt, avg: cnt ? Math.round(sum / cnt) : null, avgTime: dcnt ? Math.round(dsum / dcnt) : null };
  }

  /* 保護者向け：褒めポイントの自動ピックアップ（今あるデータだけから判定、最大2件） */
  function fyPraisePoints(idx, tw, lw) {
    var msgs = [];
    try {
      var log = Storage.get("fy_log_" + idx, []);
      if (Array.isArray(log)) {
        var ws = weekStart(new Date());
        var perfectThisWeek = log.some(function (e) { return weekStart(new Date(e.t)) === ws && e.a === 100 && e.n === 20; });
        if (perfectThisWeek) msgs.push("💯 今週、20問ぜんぶ一発正解しました！すごい！");
      }
    } catch (e) {}
    try {
      var streak = calculateStreak(idx);
      if (streak >= 5) msgs.push("🔥 " + streak + "日連続で練習しています！");
    } catch (e) {}
    try {
      if (runNow(idx) >= 2 && runNow(idx) === runBest(idx)) msgs.push("🏆 20問オール正解が" + runNow(idx) + "回連続中（自己ベスト）！");
    } catch (e) {}
    if (tw.days >= 5) msgs.push("📅 今週は" + tw.days + "日も練習しました！");
    if (tw.avg !== null && lw.avg !== null && tw.avg > lw.avg) msgs.push("📈 正答率が先週より上がっています！");
    if (tw.avgTime !== null && lw.avgTime !== null && tw.avgTime < lw.avgTime) msgs.push("⚡ 読むスピードが先週より速くなっています！");
    return msgs.slice(0, 2);
  }

  window.renderParentCompareTable = function () {
    var html = '<div style="font-size:11.5px;line-height:1.7;background:#f7f7f7;border-radius:10px;padding:8px;margin-bottom:10px;text-align:left;">' +
      '<span style="color:#1565c0;font-weight:800;">■ 青い項目</span>：先生の復元コードで、戻せます。<br>' +
      '<span style="color:#9a9a9a;font-weight:800;">■ グレーの項目</span>：復元できません（復元した日から、また記録されます）。</div>';
    var any = false;
    var cx = (function () {
      var d = new Date(), day = d.getDate(), mo = d.getMonth() + 1;
      if (day <= 25) return { when: mo + "月末で解約になります。" };
      return { when: "25日を過ぎているため、" + (mo === 12 ? 1 : mo + 1) + "月末で解約になります。" };
    })();
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
        if (tw.avgTime !== null) {
          var timeNote = "";
          if (lw.avgTime !== null) timeNote = tw.avgTime < lw.avgTime ? "（先週より速くなっています）" : (tw.avgTime > lw.avgTime ? "（先週より少しゆっくりめ）" : "（先週と同じくらい）");
          else timeNote = "（今週から記録開始）";
          twText += "<br>平均タイム " + tw.avgTime + "秒" + timeNote;
        }
      }
      var praise = fyPraisePoints(idx, tw, lw);

      html += '<div style="border:1px solid #eadcc8;border-radius:12px;padding:10px;margin-bottom:10px;background:#fff;text-align:left;">';
      html += '<div style="font-size:15px;font-weight:900;color:#5b4636;margin-bottom:6px;">' + esc(n) + ' さん</div>';
      if (praise.length) {
        html += '<div style="background:#fff3e0;border:1px solid #ffcc80;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:12.5px;font-weight:700;color:#8a5a00;">💬 ここ、褒めてあげてください<br>' + praise.join('<br>') + '</div>';
      }
      var BL = '<div style="color:#1565c0;margin-bottom:4px;">', GR = '<div style="color:#9a9a9a;margin-bottom:4px;">';
      html += '<div style="font-size:12px;line-height:1.8;">' +
        BL + '<b>📘 今の挑戦</b><br>' +
          esc(progressText(idx, "treble", "ト音記号")) + '<br>' +
          esc(progressText(idx, "bass", "ヘ音記号")) + '<br>' +
          esc(progressText(idx, "all", "全カード")) + '</div>' +
        GR + '<b>📈 最近の一発正解率</b><br>' + esc(lastText) + '</div>' +
        GR + '<b>🗓 今週の頑張り（月〜日）</b><br>' + twText + '</div>' +
        BL + '<b>💯 20問 全部一発正解</b> ' + perfTotal(idx) + '回（連続 現在' + runNow(idx) + '回／最高' + runBest(idx) + '回）</div>' +
        BL + '<b>🏅 トレーニングポイント</b> ' + ((typeof window.fyParentTP === "function") ? window.fyParentTP(idx) : "") + '</div>' +
        BL + '<b>🎖 マスター</b>：' + (achs || 'まだありません') + '</div>' +
        ((typeof window.fyParentChunk === "function") ? window.fyParentChunk(idx) : '') +
        GR + '<b>⭐ 今週のハンコ</b> ' + ((typeof window.fyParentStamps === "function") ? window.fyParentStamps(idx) : "") + '</div>' +
        GR + '<b>🔥 練習した日の連続</b> ' + calculateStreak(idx) + '日　<b>🎵 6つのド最高点</b> ' + (doB ? doB.accuracy + '%' : '-') + '</div>' +
        '</div>' +
        '<details style="margin-top:8px;padding-top:6px;border-top:1px dashed #eadcc8;font-size:11px;color:#806c5a;line-height:1.6;"><summary style="color:#a39686;font-size:11px;">解約について</summary>📌 解約のご連絡は、毎月<b>25日まで</b>にお願いします。26日以降のご連絡は、翌月の解約になります。<br>' +
        '<b style="color:#c62828;">いまボタンを押すと、' + cx.when + '</b>' +
        '<div style="margin-top:8px;background:#fff8e1;border:1px solid #ffe0b2;border-radius:10px;padding:8px 9px;text-align:left;">' +
        '<b style="color:#8a5a00;">解約する前に、かくにんしてください</b><br>' +
        '1. 解約すると、アプリの中に入れなくなります（今までの実績は見られなくなります）<br>' +
        '2. 月間ベスト賞など、解約後に決まるデジタルカードは見られません（現物のカードは先生からお渡しできます）<br>' +
        '3. <button id="fyCancelBk' + idx + '" style="margin:3px 0;padding:6px 10px;font-size:11px;font-weight:800;border:none;border-radius:8px;background:#5c6bc0;color:#fff;">📤 きろくを うつす コードを作る</button>を押して、先生に送ってください。先生が預かっておきます。将来また始めるときはその記録から戻しますが、戻せない記録もあります（くわしくはその画面に書いてあります）' +
        '</div>' +
        '<label style="display:flex;align-items:flex-start;gap:6px;margin-top:8px;cursor:pointer;">' +
        '<input type="checkbox" id="fyCancelChk' + idx + '" style="margin-top:2px;width:16px;height:16px;flex:none;">' +
        '<span>上の内容を読んで、理解しました</span></label>' +
        '<div id="fyCancelSend' + idx + '" style="display:none;margin-top:6px;">' +
        '<div style="margin-top:2px;">下のボタンを押すとLINEが開きます。送信ボタン（✈マーク）を押して送ってください。</div>' +
        (function () { window.fyNoBackNote = 1; var hh = window.fyLineBtn('【ふよみ】' + n + ' さん\n解約のお願いです。（' + cx.when.replace('になります。', '') + '）', '✉ 解約のご連絡（LINEを開く）', '#9e9e9e', true); window.fyNoBackNote = 0; return hh; })() +
        '<div style="margin-top:4px;">送信後、先生からの返信をもって解約完了となります。3日経っても返信がない場合は、お手数ですが再度ご連絡ください。</div>' +
        '</div>' +
        '</details>';
      html += '</div>';
    });
    if (!any) html = '<div style="font-size:12px;color:#806c5a;">まだ誰も登録されていません</div>';
    document.getElementById("parentCompareTable").innerHTML = html;
    profiles.forEach(function (n, idx) {
      if (!isRegistered(idx)) return;
      try {
        var chk = document.getElementById("fyCancelChk" + idx);
        var sendWrap = document.getElementById("fyCancelSend" + idx);
        if (chk && sendWrap) chk.addEventListener("change", function () { sendWrap.style.display = chk.checked ? "" : "none"; });
        var bkBtn = document.getElementById("fyCancelBk" + idx);
        if (bkBtn) bkBtn.addEventListener("click", function () { window.fyShowBackup(idx); });
      } catch (e) {}
    });
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
      /* 100回目の テスト用ボタンは、20問れんぞくで うごくように つくりなおして つかう */
      window.resetParentPasswordByTeacher = function () {};   /* 保護者パスワードの リセットは つかわない */
      var tab3b = document.getElementById("teacherTab3");
      if (tab3b) {
        Array.prototype.forEach.call(tab3b.querySelectorAll("button"), function (bt) {
          var oc = bt.getAttribute("onclick") || "";
          if (oc.indexOf("resetParentPasswordByTeacher") !== -1) bt.style.display = "none";
        });
        Array.prototype.forEach.call(tab3b.querySelectorAll("div"), function (dv) {
          /* 見出し「100回目のテスト」は のこす */
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
            '<option value="legend5">ふよみレジェンド（ふよみごうかく ぜんぶ）</option>' +
            '<option value="maestro">ふよみマエストロ（せんせいの ごうかく ぜんぶ）</option>' +
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
    /* 🏫 教室用（見本）メッセージは、どの コードでも 中みを 見ずに 「見本」の あんないだけ 出す（処理ずみ・印刷は 出さない／さいきんの れんらくには 入れない） */
    if (t.indexOf("【きょうしつ見本】") !== -1) return { kind: "text", html: '<div style="color:#546e7a;font-weight:800;font-size:14px;background:#eceff1;border-radius:10px;padding:10px;">🏫 教室用（見本）の メッセージです。本物の コードでは ありません</div>' };
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
    var repM = t.match(/📋[^\n]*しゅうの きろく[：:]\s*([^\n]+)/);
    if (nm) { try { var sn = JSON.parse(localStorage.getItem("fy_seen") || "{}") || {}; sn[cleanName(nm[1])] = { d: localDateStr(new Date()), r: repM ? repM[1] : ((sn[cleanName(nm[1])] || {}).r || "") }; localStorage.setItem("fy_seen", JSON.stringify(sn)); } catch (eS) {} }
    if (nm && !cd && repM) return { kind: "text", html: '<div style="color:#2e7d32;font-weight:800;font-size:14px;">📋 週の きろくを うけとりました　なまえ：' + esc3(cleanName(nm[1])) + '</div><div style="font-size:13px;text-align:left;line-height:1.7;">' + esc3(repM[1]) + '<br><span style="color:#806c5a;font-size:12px;">「さいきんの れんらく」に 入れました</span></div>' };
    if (!nm || !cd) {
      if (/\b\d{2}-[A-Z0-9]{6}\b/.test(t)) return { kind: "text", html: '<div style="font-size:14px;font-weight:800;">これは 先生が だした「ごうかくコード」です（ふよみテスト か えんそう）。生徒の アプリで つかう もの</div>' };
      return ng("コードの かたちが わかりません。LINEの メッセージを、ぜんぶ 貼ってね。");
    }
    var name = cleanName(nm[1]), ds = [];
    for (var i = 0; i < 15; i++) ds.push(localDateStr(new Date(Date.now() - i * 86400000)));
    function one(code, line) {
      var found = null, am = line.match(/ポイント\s*こうかん\s*(\d+)\s*p/), rm = line.match(/のこり\s*(\d+)\s*p/), sm = line.match(/[（(]\s*(\d+)\s*かいめ\s*[）)]/);
      var daysM = line.match(/れんしゅうした\s*日[：:]\s*(\d+)\s*日/);
      var cntM = line.match(/つうさん\s*(\d+)\s*回/);
      ds.forEach(function (d) {
        if (found) return;
        ["treble", "bass", "master", "legend5", "maestro"].forEach(function (ty) { if (!found && codeFor(name, ty, 0, d) === code) found = { label: INFO[ty].label, d: d, card: ty === "legend5" ? "legend" : ty }; });
        for (var n = 1; n <= 99 && !found; n++) if (codeFor(name, "stamp", n, d) === code) found = { label: "スタンプカード " + n + " まいめ", d: d };
        /* 2026-11-24：表示名を「ふよみレジェンド」→「ふよみ名人」に修正（内部名 legend＝名人、legend5＝レジェンドで紛らわしいだけ） */
        for (var n2 = 100; n2 <= 1000 && !found; n2 += 100) if (codeFor(name, "legend", n2, d) === code) found = { label: "ふよみ名人（" + n2 + "回）", d: d, card: "meijin", count: n2 };
        /* 2026-11-24：れんぞくしょう（ト音・ヘ音レベル5、10回）のコードも しらべられるように */
        [10].forEach(function (n3) {
          if (found) return;
          if (codeFor(name, "trrun", n3, d) === code) found = { label: "🎼ト音記号れんぞくしょう（" + n3 + "回）", d: d };
          else if (codeFor(name, "bsrun", n3, d) === code) found = { label: "🎼ヘ音記号れんぞくしょう（" + n3 + "回）", d: d };
        });
        /* 2026-11-24：月間ベスト賞は 廃止ずみだが、すでに 出た カードを あとから しらべられる ように のこす（さいきん24か月ぶん ためす） */
        if (!found) {
          var base = new Date(d + "T00:00:00");
          for (var mi = 0; mi < 24 && !found; mi++) {
            var ymD = new Date(base.getFullYear(), base.getMonth() - mi, 1);
            var ymStr = ymD.getFullYear() + "-" + (ymD.getMonth() + 1 < 10 ? "0" : "") + (ymD.getMonth() + 1);
            if (codeFor(name, "mbest", ymStr, d) === code) found = { label: "🌟月間ベスト賞（" + ymLabel(ymStr) + "）", d: d };
          }
        }
        /* 2026-11-24：半期の きろくカード（half・halfend）のコードも しらべられるように（いま・ひとつ前の 期で ためす） */
        if (!found) {
          var curHid = halfId(new Date(d + "T00:00:00"));
          var hidParts = curHid.split("-"), hidYear = parseInt(hidParts[0], 10);
          var hidCands = [curHid, hidParts[1] === "H1" ? (hidYear - 1) + "-H2" : hidYear + "-H1"];
          hidCands.forEach(function (pid) {
            if (found) return;
            var ranks = halfRanks(pid);
            for (var ri = 0; ri < ranks.length && !found; ri++) {
              var n4 = pid + "_r" + ri;
              /* 2026-11-24：ふよみ メダル（half）は アプリの中だけの カード。先生の照合画面にも 印刷ボタンは 出さない
                 （card を つけない＝ fyPrintRow が 出ない） */
              if (codeFor(name, "half", n4, d) === code) found = { label: "🏅" + halfLabel(pid) + "　" + halfMedalName(ri), d: d, award: halfMedalName(ri), ev: halfLabel(pid) };
            }
            /* 2026-11-24：halfend の n は「期のid_回数」。文面に書いてある回数（cntM）で コードを 計算しなおし、
               一致したときだけ 本物と みとめる（回数の 書きかえを ふせぐ・先生の指示） */
            if (!found && cntM) {
              var heCnt = parseInt(cntM[1], 10) || 0;
              if (codeFor(name, "halfend", pid + "_" + heCnt, d) === code) {
                var heRanks = halfRanks(pid), heRi = -1;
                for (var heR = heRanks.length - 1; heR >= 0; heR--) if (heCnt >= heRanks[heR]) { heRi = heR; break; }
                var heRankTxt = halfMedalName(heRi);
                /* ev＝期、award＝とった メダル（印刷カードの絵に「ふよみ メダル」の文字が 入る想定なので、ここでは 重ねない） */
                found = { label: "📋 ふよみ メダル（きろくカード）（" + halfLabel(pid) + "　" + heRankTxt + "　つうさん" + heCnt + "回）", d: d, card: "halfend", award: heRankTxt, ev: halfLabel(pid), count: cntM ? cntM[1] : "" };
              }
            }
          });
        }
        /* 2026-11-24：レベル1〜4「はじめて ごうかく」カードのコードも しらべられるように */
        if (!found) {
          ["treble", "bass", "all"].forEach(function (clefN) {
            if (found) return;
            var clefLabel2 = clefN === "treble" ? "ト音記号" : clefN === "bass" ? "ヘ音記号" : "全カード";
            for (var lv4 = 1; lv4 <= 4 && !found; lv4++) {
              if (codeFor(name, "lvclear", clefN + "_" + lv4, d) === code) found = { label: "🎵" + clefLabel2 + " レベル" + lv4 + " はじめて ごうかく", d: d };
            }
          });
        }
        /* 2026-11-24：イベント賞カードのコードも しらべられるように（いま設定中のイベント名で ためす） */
        if (!found) {
          try {
            var evT = window.fyEventCfg && window.fyEventCfg.title;
            if (evT && codeFor(name, "event", evT, d) === code) found = { label: "🏆" + evT, d: d };
          } catch (eEv) {}
        }
        if (!found && am && rm && window.fyExchangeCode(name, parseInt(am[1], 10), parseInt(rm[1], 10), d, sm ? parseInt(sm[1], 10) : 0) === code) found = { label: "ポイント こうかん " + am[1] + "p" + (sm ? "（" + sm[1] + "かいめ）" : "") + "（のこり " + rm[1] + "p）", d: d, ex: 1 };
      });
      return found;
    }
    var lines = t.split("\n"), items = [], seen = {};
    lines.forEach(function (ln, li) {
      var re = /コード[：:]\s*([A-Z0-9]{4})/g, mm;
      while ((mm = re.exec(ln))) { if (seen[mm[1]]) continue; seen[mm[1]] = 1; items.push({ code: mm[1], f: one(mm[1], ln) || one(mm[1], (lines[li - 1] || "") + " " + ln) }); }
    });
    var done = {}; try { done = JSON.parse(localStorage.getItem("fy_chk_done") || "{}") || {}; } catch (e5) {}
    var okN = items.filter(function (x) { return x.f; }).length;
    var html = (repM ? '<div style="font-size:13px;text-align:left;background:#e8f5e9;border-radius:10px;padding:6px 10px;margin-bottom:6px;">📋 週の きろく：' + esc3(repM[1]) + '</div>' : '') + '<div style="color:' + (okN === items.length ? "#2e7d32" : "#c62828") + ';font-weight:800;font-size:14px;">' + (okN === items.length ? "✅ 本物の コードです" : (okN ? "⚠ 本物 " + okN + "件 ／ ❌ あわない " + (items.length - okN) + "件" : "❌ あいません")) + '　なまえ：' + esc3(name) + '</div>';
    items.forEach(function (x) {
      var key = name + "|" + x.code, dn = done[key], bs = "border:none;border-radius:10px;padding:9px 12px;font-size:14px;font-weight:800;font-family:inherit;color:#fff;margin:4px 4px 0 0;";
      html += '<div style="text-align:left;font-size:13px;line-height:1.6;margin-top:8px;padding:8px 10px;border-radius:12px;background:' + (x.f ? (dn ? "#f0efec" : "#eef8ee") : "#fdecea") + ';">';
      if (!x.f) { html += '❌ <b>' + esc3(x.code) + '</b>　あいません（15日より 前なら「コード かくにん」で 日づけを 入れて しらべてね）</div>'; return; }
      html += '<b>' + esc3(x.f.label) + '</b>　<span style="color:#806c5a;">' + x.f.d + '　コード ' + esc3(x.code) + '</span><br>';
      if (dn) html += '<b style="color:#c62828;">⚠ この コードは ' + esc3(dn.d) + ' に 処理ずみです' + (x.f.ex ? "（もう わたして います）" : "") + '</b><br>';
      else html += '<button data-k="' + esc3(key) + '" data-l="' + esc3(x.f.label) + '" onclick="window.fyChkDone(this)" style="' + bs + 'background:#2e7d32;">' + (x.f.ex ? "🎁 わたした" : "✓ 処理ずみに する") + '</button>';
      if (x.f.card) html += window.fyPrintRow(name, 'type=' + x.f.card + '&date=' + x.f.d + (x.f.count ? '&count=' + x.f.count : '') + (x.f.award ? '&award=' + encodeURIComponent(x.f.award) : '') + (x.f.ev ? '&ev=' + encodeURIComponent(x.f.ev) : ''));
      html += '</div>';
    });
    return { kind: "text", html: html };
  };
  window.fyPrintRow = function (nick, q) {
    var cn = {}; try { cn = JSON.parse(localStorage.getItem("fy_cardnames") || "{}") || {}; } catch (e) {}
    var real = String(cn[nick] || "").replace(/[&<>"]/g, ""), nk = String(nick).replace(/[&<>"]/g, "");
    return '<div style="margin-top:6px;padding-top:6px;border-top:1px dashed #cfd8dc;"><span style="font-size:12px;color:#806c5a;">カードに のせる 名前（本名。先生の 機械の 中だけに 残ります）</span><br>' +
      '<input value="' + real + '" placeholder="空なら「' + nk + '」の まま" maxlength="10" style="width:150px;font-size:15px;padding:7px;border:2px solid #cfd8dc;border-radius:8px;font-family:inherit;box-sizing:border-box;vertical-align:middle;"> ' +
      '<button data-n="' + nk + '" data-q="' + q + '" onclick="window.fyPrintCard(this)" style="border:none;border-radius:10px;padding:9px 12px;font-size:14px;font-weight:800;font-family:inherit;color:#fff;background:#1565c0;vertical-align:middle;">🖨 カードを 印刷</button></div>';
  };
  window.fyPrintCard = function (btn) {
    var nick = btn.getAttribute("data-n"), inp = btn.parentNode.querySelector("input"), real = String(inp && inp.value || "").trim();
    try { var cn = JSON.parse(localStorage.getItem("fy_cardnames") || "{}") || {}; if (real) cn[nick] = real; else delete cn[nick]; localStorage.setItem("fy_cardnames", JSON.stringify(cn)); } catch (e) {}
    location.href = "cards_print.html?" + btn.getAttribute("data-q") + "&name=" + encodeURIComponent(real || nick);
  };
  /* 2026-11-21：印刷カードとは べつに、アプリの カード一覧に 賞カードを 追加する コード（FYC1）を 発行する。
     生徒が「あいことば」の 入力らんに これを 入れると、カードが 1まい ふえる。 */
  window.fyEvCardCodeRow = function (nick, award, evTitle) {
    if (!window.fyEvCardCode) return "";
    if (!award) award = "💮 れんしゅう がんばった賞";
    var code = window.fyEvCardCode(nick, award, evTitle);
    var lineTxt = "【ふよみイベント】" + nick + " さんへ\n" + award + "を とったよ！おめでとう🎉\n\nこのコードを「あいことば」の らんに いれてね\n" + code;
    return '<div style="margin-top:6px;padding-top:6px;border-top:1px dashed #cfd8dc;"><span style="font-size:12px;color:#806c5a;">🎴 アプリに 賞カードを ふやす コード（生徒の「あいことば」らんに 入れてもらう）</span><br>' +
      '<textarea readonly style="width:100%;height:46px;font-size:10px;word-break:break-all;border:2px solid #eadcc8;border-radius:10px;padding:6px;box-sizing:border-box;-webkit-user-select:text;user-select:text;">' + esc(code) + '</textarea>' +
      (window.fyLineCheck ? window.fyLineCheck(lineTxt) : '') + '</div>';
  };
  /* 先生ページを とじたら、貼った 文と 結果を 消す */
  setInterval(function () {
    try { var fi = document.getElementById("faIn"), fo = document.getElementById("faOut"); if (fi && fi.offsetParent === null && (fi.value || (fo && fo.innerHTML))) { fi.value = ""; if (fo) fo.innerHTML = ""; var fe = document.getElementById("feOut"); if (fe) fe.innerHTML = ""; } } catch (e) {}
  }, 1000);
  /* 📋 さいきんの れんらく：④に 貼った メッセージの 名前と 日づけを おぼえて、れんらくが 古い 順に ならべる */
  window.fySeenHtml = function () {
    var sn = {}; try { sn = JSON.parse(localStorage.getItem("fy_seen") || "{}") || {}; } catch (e) {}
    var today = new Date(localDateStr(new Date())).getTime();
    var rows = Object.keys(sn).map(function (k) { var v = sn[k] || {}; return { n: k, d: v.d || "", r: v.r || "", ago: v.d ? Math.round((today - new Date(v.d).getTime()) / 86400000) : 999 }; }).sort(function (a, b) { return b.ago - a.ago; });
    var late = rows.filter(function (r) { return r.ago >= 10; }).length, td = rows.filter(function (r) { return r.ago === 0; }).length;
    var h = '<style>@keyframes fySeenGlow{0%{box-shadow:0 0 0 0 rgba(255,152,0,.8)}100%{box-shadow:0 0 0 12px rgba(255,152,0,0)}}</style>' +
      '<details id="fySeenBox" style="margin:0 0 10px;text-align:left;"><summary style="font-size:15px;font-weight:900;color:#33691e;background:#f1f8e9;border:2px solid ' + (late ? "#ff9800" : "#c5e1a5") + ';border-radius:12px;padding:11px 10px;' + (late ? "animation:fySeenGlow 1.4s ease-out infinite;" : "") + '">📋 さいきんの れんらく（' + rows.length + '人）' +
      (td ? '　<span style="background:#43a047;color:#fff;border-radius:10px;padding:2px 8px;font-size:12px;">きょう ' + td + '人</span>' : '') +
      (late ? '　<span style="background:#ff9800;color:#fff;border-radius:10px;padding:2px 8px;font-size:12px;">⚠ ごぶさた ' + late + '人</span>' : '') + '</summary>';
    if (!rows.length) h += '<div style="font-size:12px;color:#806c5a;padding:6px;">まだ ありません。生徒の メッセージを ④に 貼ると、ここに 名前が 入ります。</div>';
    rows.forEach(function (r) {
      var e = function (x) { return String(x).replace(/[&<>"]/g, ""); };
      h += '<div style="font-size:13px;line-height:1.6;padding:5px 8px;border-bottom:1px solid #eee;' + (r.ago >= 10 ? "background:#fff3e0;" : "") + '"><b>' + e(r.n) + '</b>　' + (r.ago === 0 ? "きょう" : r.ago + "日まえ") + (r.ago >= 10 ? "　⚠ しばらく れんらくが ありません" : "") + (r.r ? '<br><span style="font-size:12px;color:#806c5a;">' + e(r.r) + '</span>' : '') + '</div>';
    });
    return h + '</details>';
  };
  window.fyChkDone = function (btn) {
    try {
      var key = btn.getAttribute("data-k"), lab = btn.getAttribute("data-l"), nm2 = key.split("|")[0], d = localDateStr(new Date());
      var done = JSON.parse(localStorage.getItem("fy_chk_done") || "{}") || {}; done[key] = { d: d, l: lab }; localStorage.setItem("fy_chk_done", JSON.stringify(done));
      var ik = "fy_issued_" + nm2, io = JSON.parse(localStorage.getItem(ik) || "{}") || {}; io.recv = io.recv || []; io.recv.push({ l: lab, d: d }); localStorage.setItem(ik, JSON.stringify(io));
      btn.outerHTML = '<b style="color:#2e7d32;">✓ ' + d + ' 処理ずみ（控えに 入れました）</b>　';
    } catch (e) {}
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
    Storage.set("fy_tr5run_" + i, 0);
    Storage.set("fy_bs5run_" + i, 0);
    Storage.set("fy_half_id_" + i, "");
    Storage.set("fy_half_cnt_" + i, 0);
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
    /* すすみぐあいの バー（もじを よめなくても わかる）。はんぶん と あと5もん で ⭐が ぴかっ */
    try { var rem = targetValue - trainingCorrectCount, fp = document.getElementById("fyProg"); fp.classList.remove("hidden"); document.getElementById("fyProgIn").style.width = Math.round(trainingCorrectCount / targetValue * 100) + "%"; var fs = document.getElementById("fyProgStar"); if (trainingCorrectCount > 0 && (rem === Math.floor(targetValue / 2) || rem === 5)) { fs.style.transition = "transform .25s"; fs.style.transform = "scale(1.8)"; setTimeout(function () { fs.style.transform = ""; }, 400); } } catch (e) {}

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
      new Image().src = "level_cover.jpg";
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

  /* 2026-11-17 から：トップ画面は だれでも（あいことば なしでも）見られるように する。
     あいことばが 必要なのは、じっさいに「あそぶ」ボタン（6つのド・おんぷカード・レジェンドへの みち、
     window.fyRequireLogin）を 押した ときだけ。ここ（きどう時）では、もう あいことばで ひもづけ
     されている プレイヤーだけ、しずかに ログインさせる。 まだの ときは 画面を 出さず、トップ画面を
     そのまま 見せる（おす まで、あいことばは 聞かない）。 */
  var startCode = isRegistered(activeProfileIndex) ? codeOfSlot(activeProfileIndex) : "";
  if (startCode) {
    tryCode(startCode, false);
  } else {
    openApp();
  }
})();

/* =====================================================================
   v13：トレーニングポイント（ハンコ と 週の ポイント）
   ・トレーニング（10問・20問）を さいごまで やりきると、その日の ハンコ。6つのドは かぞえない。
   ・1週間は 月〜日。週が かわって アプリを ひらくと、先週の ポイントが 入る。
   ・1日で 1p、3日で 2p、5日で 3p、6日で 4p、7日(パーフェクト)で 6p、0〜2日は 0p。（2026-11-24：実際の pointsFor() に合わせてコメントを修正）
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

  /* 🎁 ポイントが 入った りゆうの きろく（さいしん 30件。ポイント交換ページの「履歴」で みられる） */
  window.fyTpEarnLog = function (idx, pts, note) {
    try {
      if (!pts) return;
      var log = Storage.get("fy_tp_earn_" + idx, []); if (!Array.isArray(log)) log = [];
      log.push({ t: Date.now(), pts: pts, note: note || "" });
      if (log.length > 30) log = log.slice(log.length - 30);
      Storage.set("fy_tp_earn_" + idx, log);
    } catch (e) {}
  };
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dstr(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseD(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function weekStartOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }

  function pointsFor(days) { return days >= 7 ? 6 : days >= 6 ? 4 : days >= 5 ? 3 : days >= 3 ? 2 : days >= 1 ? 1 : 0; }

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
    if (total > 0) window.fyTpEarnLog(idx, total, "🔥 れんしゅうの ハンコ（週 " + lastDays + "日）");
    if (total > 0 || lastDays > 0) {
      var old = Storage.get(K.notice(idx), null);
      Storage.set(K.notice(idx), { days: lastDays, pts: total + (old && old.pts ? old.pts : 0) });
    }
  }

  function hintText(d) {
    var tiers = [[1, 2, 1], [3, 4, 2], [5, 5, 3], [6, 6, 4], [7, 7, 6]];
    return tiers.map(function (t) {
      var got = d >= t[0];
      var label = t[0] === t[1] ? ("⭐" + t[0] + "つ" + (t[0] === 7 ? "（ぜんぶ）" : "")) : ("⭐" + t[0] + "〜" + t[1] + "つ");
      return '<div style="' + (got ? "color:#2e7d32;" : "color:#5b4636;") + '">' + (got ? "✅ " : "　") + label + "で " + t[2] + "ポイント</div>";
    }).join("");
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
    if (kind === "on") return '<div style="' + base + 'font-size:38px;line-height:1;background:transparent;">⭐</div>';
    if (kind === "onNew") return '<div class="fy-glow" style="' + base + 'font-size:38px;line-height:1;background:transparent;">⭐</div>';
    if (kind === "tmp") return '<div id="fyTmpStamp" class="fy-nudge" style="' + base + 'font-size:13px;font-weight:800;background:#fff;border:2px dashed #ff7043;color:#ff7043;cursor:pointer;">きょう</div>';
    return '<div style="' + base + 'font-size:22px;background:#e6e6e6;color:#aaa;">・</div>';
  }

  /* ---- トップ画面の ハンコ ---- */
  var voice1Done = window.fyVoice1Done = (window.fyVoice1Done || {});   /* きょう この 起動で、声を 鳴らした 枠 */

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

    /* 2026-11-24：トップの「きょう」の 丸を タップしたときの 正解音は やめる（先生の 指示） */
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

  /* 2026-11-23：「ピンポーン」の チャイム音（音声ファイルは つかわず、その場で 鳴らす） */
  function playPinpon() {
    try {
      var ctx = getAudioContext();
      var t0 = ctx.currentTime;
      var dest = (typeof masterGain !== "undefined" && masterGain) ? masterGain : ctx.destination;
      function tone(freq, start, dur) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t0 + start);
        g.gain.linearRampToValueAtTime(0.35, t0 + start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);
        o.connect(g); g.connect(dest);
        o.start(t0 + start); o.stop(t0 + start + dur + 0.05);
      }
      tone(1318.5, 0, 0.32);
      tone(987.8, 0.28, 0.42);
    } catch (e) {}
  }

  /* ---- 結果画面：ハンコ ----
     2026-11-23：結果画面には 出さず、ファンファーレ・せりふが おわってから、ピンポーンと 鳴らして
     ふきだしで しらせる形に 変更。その日 はじめての トレーニングの ときだけ（2回目いこうは 出さない）。 */
  var prevResult = window.showResultScreen;
  window.showResultScreen = function () {
    var r = prevResult.apply(this, arguments);
    try {
      var rsOk = function () { var rs = document.getElementById("resultScreen"); return rs && !rs.classList.contains("hidden"); };
      if (targetValue === 10 && selectedClef !== "do") fyWakabaVoice("zunda-next20.mp3", 3800, rsOk);
      /* カードが出て ボタンが ロックされている あいだは、光らせない（おいわいを 閉じたときに 光らせる） */
      setTimeout(function () { if (rsOk() && !window.__fyCelLock) fyNudge(document.querySelector("#resultButtonsWrap .accent")); }, 1200);
    } catch (e) {}
    try {
      var old = document.getElementById("fyHankoResult"); if (old) old.remove();
      var oldB = document.getElementById("fyHankoBubble"); if (oldB) oldB.remove();
      if (selectedClef === "do") return r;           /* 6つのドは かぞえない */
      var idx = activeProfileIndex;
      var isNew = giveStamp(idx);
      if (!isNew) return r;   /* その日 2回目いこうの トレーニングでは、もう しらせない */
      var d = daysThisWeek(idx);
      var sMs = getSoundDurationMs("sugoiAudio") || 1500;
      var fMs = getSoundDurationMs("tasseiFanfareAudio") || 3000;
      var wait = sMs + 200 + fMs + 500;
      setTimeout(function () {
        try {
          if (!rsOk()) return;   /* もう けっか画面に いない ときは 出さない */
          playPinpon();
          var old2 = document.getElementById("fyHankoBubble"); if (old2) old2.remove();
          var bub = document.createElement("div");
          bub.id = "fyHankoBubble";
          bub.style.cssText = "position:fixed;left:12px;right:12px;bottom:18px;z-index:10020;background:#fff;color:#5b4636;border-radius:16px;padding:10px 14px 12px;box-shadow:0 4px 14px rgba(0,0,0,.3);text-align:center;";
          bub.innerHTML =
            '<div style="position:relative;height:72px;margin:0 auto;display:flex;align-items:center;justify-content:center;"><span class="fy-ring"></span><span class="fy-big-pon" style="font-size:56px;">⭐</span></div>' +
            '<div style="font-size:14px;font-weight:800;">きょうの ハンコ ゲット！</div>' +
            '<div style="font-size:13px;margin-top:4px;line-height:1.6;">今週は <b>' + d + '日め</b><br>' + hintText(d) + '</div>';
          bub.addEventListener("click", function () { bub.remove(); });
          document.body.appendChild(bub);
          setTimeout(function () { try { bub.remove(); } catch (e2) {} }, 9000);
        } catch (e3) {}
      }, wait);
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
    return '<div style="position:relative;border:3px double #ffb300;background:' + ((e.us && e.sentAt) ? '#eee' : '#fffdf0') + ';border-radius:14px;padding:10px;margin:8px 0;' + ((e.us && e.sentAt) ? 'color:#888;' : '') + '">' +
      (window.fyDemoBadgeHtml ? window.fyDemoBadgeHtml() : "") +
      '<div style="font-size:28px;">🎁</div>' +
      '<div style="font-weight:900;">ポイント こうかん　' + e.amt + 'p</div>' +
      '<div style="font-size:19px;font-weight:900;margin:4px 0;">' + esc2(e.name) + ' さん</div>' +
      '<div style="font-size:13px;">' + md(e.d) + '</div>' +
      '<div style="font-size:30px;font-weight:900;letter-spacing:6px;background:#fff;border-radius:10px;padding:6px 0;margin:4px 0;">' + ((window.fyDemoOn && window.fyDemoOn()) ? "みほん" : e.code) + '</div>' +
      '<div style="font-size:11px;color:#806c5a;line-height:1.6;">' + (window.fyNewLookOn && window.fyNewLookOn() ? '' : 'したの ボタンで せんせいに おくってね。<br>') + 'のこり <b>' + e.rest + ' p</b></div>' +
      ((e.us && e.sentAt) ? '<div style="font-size:13px;font-weight:900;color:#2e7d32;margin:2px 0;">✓ せんせいに おくったよ</div>' : '') +
      '<div data-fyexsend="' + e.code + '"' + ((e.us && e.sentAt) ? ' style="opacity:.45;filter:grayscale(1);"' : '') + '>' + (function () { var h = window.fyLineCheck('【ふよみ】' + e.name + ' さん　ポイント こうかん ' + e.amt + 'p\nコード：' + e.code + '（のこり ' + e.rest + 'p）'); if (window.fyNewLookOn && window.fyNewLookOn()) return ""; return (e.us && !e.sentAt) ? h : h.replace(/fyLineBlink/g, ""); })() + '</div>' +
      '</div>';
  }
  /* まだ せんせいに おくっていない こうかんの かず */
  window.fyExAllLines = function (idx) { try { return exLog(idx).filter(function (e) { return e && e.us; }).map(function (e) { return "🎁 ポイント こうかん " + e.amt + "p" + (e.seq ? "（" + e.seq + "かいめ）" : "") + "　コード：" + e.code + "（のこり " + e.rest + "p）"; }); } catch (e) { return []; } };
  window.fyExUnsentLines = function (idx) { try { return exLog(idx).filter(function (e) { return e.us && !e.sentAt; }).map(function (e) { return "🎁 ポイント こうかん " + e.amt + "p" + (e.seq ? "（" + e.seq + "かいめ）" : "") + "　コード：" + e.code + "（のこり " + e.rest + "p）"; }); } catch (e) { return []; } };
  window.fyMarkExSent = function (idx) { try { var log = exLog(idx), ch = false; log.forEach(function (e) { if (e.us && !e.sentAt) { e.sentAt = Date.now(); ch = true; } }); if (ch) Storage.set("fy_tp_log_" + idx, log); } catch (e) {} };
  window.fyExUnsent = function (idx) { try { return exLog(idx).filter(function (e) { return e.us && !e.sentAt; }).length; } catch (e) { return 0; } };
  window.fyExUnsentDates = function (idx) { try { return exLog(idx).filter(function (e) { return e.us && !e.sentAt; }).map(function (e) { return e.d; }); } catch (e) { return []; } };
  /* おくっていない もの（カード・こうかん）の、のべ日数（おなじ日は 1日と かぞえる） */
  window.fyUnsentDays = function (idx) {
    try {
      var ds = (window.fyUnsentAchDates ? window.fyUnsentAchDates(idx) : []).concat(window.fyExUnsentDates ? window.fyExUnsentDates(idx) : []);
      var u = {}; ds.forEach(function (d) { if (d) u[d] = 1; });
      return Object.keys(u).length;
    } catch (e) { return 0; }
  };
  document.addEventListener("click", function (ev) {
    try {
      var w = ev.target.closest ? ev.target.closest("[data-fyexsend]") : null; if (!w || !ev.target.closest("a")) return;
      var idx = activeProfileIndex, log = exLog(idx), code = w.getAttribute("data-fyexsend"), ch = false;
      log.forEach(function (e) { if (e.code === code && !e.sentAt) { e.sentAt = Date.now(); ch = true; } });
      if (ch) Storage.set("fy_tp_log_" + idx, log);
    } catch (e2) {}
  }, true);
  function esc2(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* 📜 ポイントの 履歴（入った ぶん＋つかった ぶんを、ひづけじゅんに ならべる） */
  function exHistory() {
    var idx = activeProfileIndex;
    var earn = Storage.get("fy_tp_earn_" + idx, []); if (!Array.isArray(earn)) earn = [];
    var spend = exLog(idx);
    var items = [];
    earn.forEach(function (e) { items.push({ t: e.t, pts: e.pts, note: e.note, kind: "+" }); });
    spend.forEach(function (e) { items.push({ t: e.sentAt || e.t, pts: e.amt, note: "🎁 ポイント こうかん" + (e.seq ? "（" + e.seq + "かいめ）" : ""), kind: "-" }); });
    items.sort(function (a, b) { return b.t - a.t; });
    var html = '<div style="font-size:18px;font-weight:900;">📜 ポイントの 履歴</div>';
    if (!items.length) {
      html += '<div style="font-size:13px;color:#806c5a;margin-top:10px;">まだ 履歴は ないよ。</div>';
    } else {
      html += '<div style="text-align:left;margin-top:8px;">';
      items.forEach(function (e) {
        var dt = new Date(e.t), ds = dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 2px;border-bottom:1px solid #eee2cc;">' +
          '<div><div style="font-size:13px;font-weight:800;">' + esc2(e.note) + '</div><div style="font-size:11px;color:#a89a86;">' + ds + '</div></div>' +
          '<div style="font-size:16px;font-weight:900;color:' + (e.kind === "+" ? "#2e7d32" : "#c62828") + ';white-space:nowrap;">' + e.kind + e.pts + 'p</div></div>';
      });
      html += '</div>';
    }
    html += '<button id="fyExHistBack" style="' + BTN + 'background:#ff9800;color:#fff;font-weight:900;margin-top:12px;">◀ もどる</button>';
    exShell(html);
    document.getElementById("fyExHistBack").addEventListener("click", function () { exMain(); });
  }

  function exMain(amt) {
    var idx = activeProfileIndex, tp = getTP(idx);
    var max = Math.floor(tp / EX_UNIT) * EX_UNIT;
    var html = '<div style="font-size:18px;font-weight:900;">🎁 ポイントを こうかん</div>' +
      '<div style="font-size:14px;margin-top:6px;">いま <span style="font-size:24px;font-weight:900;color:#e65100;">' + tp + ' p</span></div>' +
      '<button id="fyExHistBtn" style="margin-top:6px;border:1px dashed #b0a090;background:#fff;color:#806c5a;font-size:12px;font-weight:700;border-radius:10px;padding:6px 14px;">📜 ポイントの 履歴</button>';
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
    var now = Date.now(), recent = exLog(idx).filter(function (e) { return (e.us && !e.sentAt) || now - (e.sentAt || e.t) < EX_DAYS * 86400000; });
    if (recent.length) {
      html += '<div style="font-size:12px;font-weight:800;margin-top:14px;text-align:left;">さいきんの こうかん（せんせいに おくってから ' + EX_DAYS + '日で きえるよ）</div>';
      recent.slice().reverse().forEach(function (e) { html += receiptHtml(e); });
    }
    html += '<button id="fyExClose" style="' + BTN + 'background:#ff9800;color:#fff;font-weight:900;position:sticky;bottom:-16px;z-index:5;box-shadow:0 -14px 14px -6px rgba(253,248,237,.95);">◀ もどる</button>';
    exShell(html);

    var q = function (id) { return document.getElementById(id); };
    if (q("fyExMinus")) q("fyExMinus").addEventListener("click", function () { exMain(Math.max(EX_UNIT, amt - EX_UNIT)); });
    if (q("fyExPlus")) q("fyExPlus").addEventListener("click", function () { exMain(Math.min(max, amt + EX_UNIT)); });
    if (q("fyExGo")) q("fyExGo").addEventListener("click", function () { exConfirm(amt); });
    if (q("fyExHistBtn")) q("fyExHistBtn").addEventListener("click", function () { exHistory(); });
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
      var seq = (parseInt(localStorage.getItem("fy_tp_seq_" + idx), 10) || 0) + 1; try { localStorage.setItem("fy_tp_seq_" + idx, String(seq)); } catch (eS) {}
      var code = (typeof window.fyExchangeCode === "function") ? window.fyExchangeCode(name, amt, rest, d, seq) : "----";
      var e = { t: Date.now(), d: d, amt: amt, rest: rest, code: code, name: name, seq: seq };
      Storage.set(K.tp(idx), rest);
      e.us = 1;
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
        '<button id="fyTestReset" class="modal-btn" style="background:#2e7d32;font-size:12px;padding:8px;margin-bottom:6px;">🧪 いまのプレイヤーの ハンコと ポイントを リセット</button>';
      tb.id = "fyPtTest"; t3.insertBefore(tb, t3.firstChild);
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
      if (Storage.get("onpu_debug_unlocked_" + idx) || Storage.get("fy_test_master_" + idx)) return true;
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
      var anc = (all.parentNode.classList && all.parentNode.classList.contains("clef-row")) ? all.parentNode : all;
      anc.parentNode.insertBefore(b, anc.nextSibling);
      b.addEventListener("click", function () {
        if (!window.fyRequireLogin()) return;
        if (!isMaster(activeProfileIndex)) { fySay("ふよみマスターに なると\nひらくよ！", "zunda-lock.mp3"); return; }
        try { Storage.set("fy_legend_opened_" + activeProfileIndex, true); } catch (e) {}
        location.href = PAGE;
      });
    }
    var ok = isMaster(activeProfileIndex);
    /* ふよみマスターを とったら、レジェンドへのみちを ひらくまで、ずっと ひからせる */
    var glow = false;
    try { glow = ok && !Storage.get("fy_legend_opened_" + activeProfileIndex, false) && fyGlowOn(activeProfileIndex, "legend"); } catch (e) {}
    b.innerHTML = "🎼 レジェンドへの みち" + (ok ? "" : ' <span class="lock-tag">🔒 ロック</span>') + (glow ? '<div style="font-size:12px;font-weight:800;margin-top:2px;">👆 つぎは ここ！</div>' : "");
    b.className = "select-button" + (ok ? "" : " locked") + (glow ? " fyPulseRing" : "");
    if (glow) { try { fyGlowCss(); } catch (e) {} }
    /* 🏅 名人：全カードを ひからせる（ふよみマスターを とって、まだ 名人に なっていない あいだ） */
    try {
      /* 2026-11-24：「名人」の しくみを、れんぞく100回 → 半期ごとの つうさん記録（ゴールドランク）に かえたので、ここも 合わせる */
      var hasMeijin = false;
      var aa = Storage.get("fy_ach_" + activeProfileIndex, []);
      if (Array.isArray(aa)) aa.forEach(function (x) { if (x && x.type === "half" && x.rank === 2) hasMeijin = true; });
      var mg = ok && !hasMeijin && fyGlowOn(activeProfileIndex, "meijin");
      if (!document.getElementById("fyMeijinCss")) {
        var st = document.createElement("style"); st.id = "fyMeijinCss";
        st.textContent = "@keyframes fyGold{0%{box-shadow:0 0 0 0 rgba(212,160,23,.9);transform:scale(1)}50%{transform:scale(1.05)}100%{box-shadow:0 0 0 16px rgba(212,160,23,0);transform:scale(1)}}.fyGoldRing{animation:fyGold 1.1s ease-out infinite;outline:3px solid #d4a017}.fyMeijinTag{display:block;font-size:10px;font-weight:800;color:#8a5a00;margin-top:2px}";
        document.head.appendChild(st);
      }
      all.classList.toggle("fyGoldRing", !!mg);
      var tg = document.getElementById("fyMeijinTag");
      if (mg) {
        if (!tg) { tg = document.createElement("span"); tg.id = "fyMeijinTag"; tg.className = "fyMeijinTag"; all.appendChild(tg); }
        tg.textContent = "🏅 名人に ちょうせん";
      } else if (tg) { tg.remove(); }
    } catch (e) {}
  }
  window.fyRefreshLegendBtn = function () { try { renderBtn(); } catch (e) {} };
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
                pStart: "2026-12-21", pEnd: "2026-12-31",
                start: "2027-01-01", end: "2027-01-20" };
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
  /* ---- のびた きろく（一発正解率・20問ぜんぶ一発・合格レベル）と 賞 ---- */
  function evLogOf(idx) {
    try { var a = JSON.parse(localStorage.getItem("fy_log_" + idx) || "[]"); return Array.isArray(a) ? a.filter(function (e) { return e && typeof e.t === "number" && e.c !== "do"; }) : []; } catch (e) { return []; }
  }
  function evAvg(a) { return a.length ? Math.round(a.reduce(function (s, e) { return s + e.a; }, 0) / a.length) : -1; }
  function evAvgTime(a) {
    var v = a.filter(function (e) { return typeof e.d === "number" && e.d > 0; }).map(function (e) { return e.d; });
    return v.length ? Math.round(v.reduce(function (s, x) { return s + x; }, 0) / v.length) : -1;
  }
  function clearedCount(idx) {
    var n = 0;
    try { ["treble", "bass", "all"].forEach(function (c) { for (var l = 1; l <= 5; l++) if (hasLevelCleared(idx, c, l)) n++; }); } catch (e) {}
    return n;
  }
  function evSnapKey(idx) { return "fy_evbase_" + idx + "_" + EVENT.id; }
  /* イベントが はじまる前は、合格レベルの かずを まいにち 控えておく（はじまったら 止める） */
  function evSnap() {
    try {
      if (todayS() >= EVENT.start) return;
      profiles.forEach(function (n, idx) {
        if (!isRegistered(idx)) return;
        localStorage.setItem(evSnapKey(idx), JSON.stringify({ lv: clearedCount(idx), d: todayS() }));
      });
    } catch (e) {}
  }
  function evGrowth(idx) {
    var startMs = new Date(EVENT.start + "T00:00:00").getTime(), endMs = new Date(EVENT.end + "T23:59:59").getTime();
    var log = evLogOf(idx);
    var pS = new Date(EVENT.pStart + "T00:00:00").getTime(), pE = new Date(EVENT.pEnd + "T23:59:59").getTime();
    var before = log.filter(function (e) { return e.t >= pS && e.t <= pE; });          /* れんしゅう期間の きろく */
    if (!before.length) before = log.filter(function (e) { return e.t < startMs; }).slice(-10);   /* なければ、イベント前の 直近10回 */
    var during = log.filter(function (e) { return e.t >= startMs && e.t <= endMs; });
    var perf = during.filter(function (e) { return e.n === 20 && e.a === 100; }).length;
    var lv1 = clearedCount(idx), lv0 = -1;
    try { var sn = JSON.parse(localStorage.getItem(evSnapKey(idx)) || "null"); if (sn && typeof sn.lv === "number") lv0 = sn.lv; } catch (e) {}
    if (lv0 < 0) {   /* 控えが ないときは、ログから おおよそ もとめる */
      var seenBefore = {}, seenNew = {};
      log.forEach(function (e) {
        if (e.n === 20 && e.a >= 90) {
          var k = e.c + "|" + e.l;
          if (e.t < startMs) seenBefore[k] = 1; else if (e.t <= endMs) seenNew[k] = 1;
        }
      });
      var nw = Object.keys(seenNew).filter(function (k) { return !seenBefore[k]; }).length;
      lv0 = Math.max(0, lv1 - nw);
    }
    return { rb: evAvg(before), rd: evAvg(during), nd: during.length, perf: perf, lv0: lv0, lv1: lv1, tb: evAvgTime(before), ta: evAvgTime(during) };
  }
  window.fyEvAwardName = function (g) { try { return String(evAwardOf(g).name || "").replace(/^[^\u3040-\u30ff\u4e00-\u9faf]+/, ""); } catch (e) { return ""; } };
  function evAwardOf(g) {
    var c = [];
    var up = (g.lv0 >= 0) ? g.lv1 - g.lv0 : 0;
    if (up >= 1) c.push({ s: up, name: "🚀 レベルアップ賞", d: "ごうかくした レベル " + g.lv0 + " → " + g.lv1 });
    var ga = (g.rb >= 0 && g.rd >= 0) ? g.rd - g.rb : null;
    if (ga !== null && ga >= 5) c.push({ s: ga / 10, name: "🎯 せいかいりつ のびのび賞", d: "一発せいかいりつ " + g.rb + "% → " + g.rd + "%" });
    if (g.perf >= 1) c.push({ s: g.perf / 3, name: "💯 ぜんぶ せいかい賞", d: "20問 ぜんぶ 一発せいかい " + g.perf + "回" });
    var td = (g.tb >= 0 && g.ta >= 0) ? g.tb - g.ta : null;   /* プラスが はやくなった */
    if (td !== null && td >= 5) c.push({ s: td / 10, name: "⚡ タイムの のびのび賞", d: "1回の タイム " + g.tb + "秒 → " + g.ta + "秒" });
    var best = null;
    c.forEach(function (x) { if (!best || x.s > best.s) best = x; });
    return best || { name: "💮 れんしゅう がんばった賞", d: "さいごまで れんしゅう がんばったね" };
  }
  window.fyEvGrowthHtml = function (g, who, pre) {
    var aw = evAwardOf(g), up = g.lv0 >= 0 ? g.lv1 - g.lv0 : null;
    var ga = (g.rb >= 0 && g.rd >= 0) ? g.rd - g.rb : null;
    var td = (g.tb >= 0 && g.ta >= 0) ? g.tb - g.ta : null;
    /* 2026-11-21：どこを がんばれば いいか 生徒に すぐ わかるように、1つずつ 大きく・ゆったり 見せる形に。 */
    var box = "background:#fff;border:1px solid #f0e6d2;border-radius:14px;padding:4px 12px;margin-top:8px;text-align:left;";
    var row = function (icon, label, line, diffTxt, up2) {
      return '<div style="padding:10px 0;border-bottom:1px solid #f5ede0;">' +
        '<div style="font-size:14px;font-weight:800;color:#8a7360;margin-bottom:3px;">' + icon + ' ' + label + '</div>' +
        '<div style="font-size:21px;font-weight:900;color:#5b4636;">' + line +
        (diffTxt ? ' <span style="font-size:15px;font-weight:900;color:' + (up2 ? "#2e7d32" : "#999") + ';">(' + diffTxt + ')</span>' : '') +
        '</div></div>';
    };
    var lastRow = function (icon, label, line, diffTxt, up2) {
      return '<div style="padding:10px 0;">' +
        '<div style="font-size:14px;font-weight:800;color:#8a7360;margin-bottom:3px;">' + icon + ' ' + label + '</div>' +
        '<div style="font-size:21px;font-weight:900;color:#5b4636;">' + line +
        (diffTxt ? ' <span style="font-size:15px;font-weight:900;color:' + (up2 ? "#2e7d32" : "#999") + ';">(' + diffTxt + ')</span>' : '') +
        '</div></div>';
    };
    return '<div style="font-size:13px;font-weight:800;color:#ff7043;margin-top:10px;">💡 がんばる ポイントは この 4つ！</div>' +
      '<div style="' + box + '">' +
      row("🎯", "一発せいかいりつ", (g.rb >= 0 ? g.rb + "%" : "—") + " → " + (g.rd >= 0 ? g.rd + "%" : "—"), ga !== null ? ((ga >= 0 ? "+" : "") + ga) : "", ga !== null && ga > 0) +
      row("💯", "20問 ぜんぶ 一発せいかい", g.perf + " 回", "", g.perf > 0) +
      row("🚀", "ごうかくした レベル", g.lv0 + " → " + g.lv1, up !== null ? ("+" + up) : "", up !== null && up > 0) +
      lastRow("⚡", "1回の タイム", (g.tb >= 0 ? g.tb + "秒" : "—") + " → " + (g.ta >= 0 ? g.ta + "秒" : "—"), td !== null ? ((td >= 0 ? "-" : "+") + Math.abs(td)) : "", td !== null && td > 0) +
      '</div>' +
      (pre ? '<div style="background:#fff3c4;border:2px solid #ffb300;border-radius:12px;padding:8px;margin-top:6px;text-align:center;font-weight:900;font-size:14px;">🏅 賞は イベントが はじまってから 決まるよ！<br><span style="font-size:12px;font-weight:700;color:#806c5a;">' + md(EVENT.start) + 'から がんばろうね</span></div>' : '<div style="background:#fff3c4;border:2px solid #ffb300;border-radius:12px;padding:8px;margin-top:6px;text-align:center;font-weight:900;font-size:16px;">🏅 ' + (who ? who + "さんの 賞" : "賞は せんせいが きめて<br>おしらせするよ！") + (who ? '<br><span style="font-size:20px;">' + aw.name + '</span><br><span style="font-size:12px;font-weight:700;color:#806c5a;">' + aw.d + '</span>' : '') + '</div>');
  };
  evSnap();
  window.fyEventCfg = EVENT;
  window.fyEvAwardOf = evAwardOf;
  /* 2026-11-21：イベントの 賞カードを、先生が 発行した コードで 生徒の カード一覧に 追加する しくみ。
     FYE1（きろくコード）とは べつの、FYC1 という コード形式。 */
  function b64d2(b) { var t = String(b).replace(/-/g, "+").replace(/_/g, "/"); while (t.length % 4) t += "="; return decodeURIComponent(escape(atob(t))); }
  window.fyEvCardCode = function (name, award, evTitle, dateStr) {
    var f = ["FYC1", String(name || ""), String(award || ""), String(evTitle || ""), String(dateStr || todayS())];
    var payload = f.join("|");
    return "FYC1." + b64e(payload) + "." + sign2(payload);
  };
  window.fyEvCardRedeem = function (idx, code) {
    var parts = String(code).split(".");
    if (parts.length !== 3 || parts[0] !== "FYC1") return null;
    var payload;
    try { payload = b64d2(parts[1]); } catch (eD) { return { ok: false, msg: "あいことばが ちがうよ。もういちど いれてね" }; }
    if (sign2(payload) !== parts[2]) return { ok: false, msg: "あいことばが ちがうよ。もういちど いれてね" };
    var f = payload.split("|");
    if (f[0] !== "FYC1" || f.length < 5) return { ok: false, msg: "あいことばが ちがうよ。もういちど いれてね" };
    var a = Storage.get("fy_ach_" + idx, []); if (!Array.isArray(a)) a = [];
    /* おなじ イベントの カードは 2まい ふえない ように（コードを 作りなおしても）、コードでは なく イベント名で くらべる */
    if (a.some(function (r) { return r && r.type === "event" && r.ev === f[3]; })) return { ok: true, msg: "🎉 もう うけとって いるよ！カードを 見てみてね" };
    /* 2026-11-24：カードの .code は、あいことば（FYC1の長いコード）ではなく、先生の「コードを しらべる」で
       照合できる 短いコード（ほかの カードと同じ codeFor 方式）にする。長いコードのままだと、
       「うつしコード」の FYC1 とまぎらわしく、先生の照合ツールでも 調べられなかった。 */
    var evRec = { type: "event", t: Date.now(), d: todayS(), name: profiles[idx] || f[1], award: f[2], ev: f[3], code: window.fyCodeFor(profiles[idx] || f[1], "event", f[3], todayS()) };
    /* 2026-11-23：イベントの 賞カードにも、ほかの カードと おなじように ポイントを つける */
    try {
      var evPt = (window.fyGivePt && window.fyPtCfg) ? window.fyGivePt(idx, "event_" + f[3], window.fyPtCfg.event || 10) : 0;
      if (evPt) { evRec.pt = evPt; if (window.fyTpEarnLog) window.fyTpEarnLog(idx, evPt, "🏅 " + f[2]); }
    } catch (ePt) {}
    a.push(evRec);
    Storage.set("fy_ach_" + idx, a);
    return { ok: true, msg: "🎉「" + f[2] + "」の カードが ふえたよ！カードを 見てみてね" };
  };
  /* 2026-11-21：れんしゅう〜イベント期間（pStart〜end）の 外では、
     「イベントを やってる」と かんちがい しないように ラベルを かえる（先生の 指示）。 */
  function inEventWindow() { var t = todayS(); return t >= EVENT.pStart && t <= EVENT.end; }
  function resultsEnd() { return addDays2(EVENT.end, 11); }   /* イベント終了（1/20）の 11日後 ＝ 1/31まで「けっか しゅうけいちゅう」 */
  function inResultsWindow() { var t = todayS(); return t > EVENT.end && t <= resultsEnd(); }
  window.fyEvInWindow = inEventWindow;
  window.fyEvBtnLabel = function () {
    if (inEventWindow()) return remindOn() ? "🏆 イベントの きろく ⏰ おくってね" : "🏆 イベントの きろく";
    if (inResultsWindow()) return "🏆 1月のイベント（けっか しゅうけいちゅう）";
    return "🏆 " + EVENT.title + "（じゅんびちゅう）";
  };
  /* けっか しゅうけいちゅうは まだ「気にして見てね」状態、それ以外の 期間外は うすく（先生の 指示） */
  window.fyEvBtnDim = function () { return !inEventWindow() && !inResultsWindow(); };
  function addDays2(ds, n) { var d = new Date(ds + "T00:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  function daysLeft() { return Math.round((new Date(EVENT.end + "T00:00:00").getTime() - new Date(todayS() + "T00:00:00").getTime()) / 86400000); }
  function remindOn() { var n = daysLeft(); return n >= 0 && n <= 6; }
  function makeEventCode(idx) {
    var d = new Date(), stamp = todayS().replace(/-/g, "") + p2(d.getHours()) + p2(d.getMinutes());
    var f = ["FYE1", String(profiles[idx] || ""), EVENT.id, stamp, String(practiceDays(idx))];
    for (var l = 1; l <= 4; l++) { var r = getEv(idx, l); f.push((r.bestPerfect ? Math.round(r.bestPerfect) : 0) + "," + evRate(r)); }
    f.push(String(evPassCount(idx)));
    f.push(String(evPlayCount(idx)));
    var g = evGrowth(idx); f.push([g.rb, g.rd, g.nd, g.perf, g.lv0, g.lv1, g.tb, g.ta].join(","));
    var payload = f.join("|");
    return { code: "FYE1." + b64e(payload) + "." + sign2(payload), stamp: stamp };
  }
  function esc2(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function showEventScreen(opts) {
    var lim = !!(opts && opts.limited && opts.until);
    var idx = activeProfileIndex;
    /* 2026-11-21：ここに あった「レジェンドへの みち」の きろく表は けした。
       賞の 判定には つかって いないのに 出ていて、まぎらわしい ため（先生の 指示）。 */
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
    /* 2026-11-21：イベント終了（1/21）〜1/31は「けっか しゅうけいちゅう」。
       結果は せんせいが べつで れんらくするので、ここでは 待っててねの表示だけ（先生の 指示）。 */
    if (!lim && inResultsWindow()) {
      scr.innerHTML = '<div style="max-width:420px;margin:0 auto;padding:10px 12px 14px;">' +
        '<div style="position:sticky;top:0;z-index:5;background:#fdf8ed;padding:6px 0 6px;"><button id="fyEvClose" style="border:none;border-radius:16px;padding:8px 14px;font-size:15px;font-weight:900;background:#ff9800;color:#fff;font-family:inherit;box-shadow:0 2px 6px rgba(0,0,0,.2);">◀ もどる</button></div>' +
        '<div style="font-size:18px;font-weight:900;text-align:center;padding:0;">🏆 ' + EVENT.title + '</div>' +
        '<div style="text-align:center;margin:2px 0 6px;font-size:13px;">👤 ' + esc2(profiles[idx] || "") + ' さん</div>' +
        '<div style="background:#fff;border:2px solid #ffb300;border-radius:16px;padding:18px 14px;margin-top:10px;text-align:center;">' +
        '<div style="font-size:34px;">📊</div>' +
        '<div style="font-size:17px;font-weight:900;margin-top:6px;">けっか しゅうけいちゅう</div>' +
        '<div style="font-size:14px;line-height:1.8;margin-top:8px;color:#5b4636;">けっかが 出たら<br>せんせいから れんらくするよ。<br>たのしみに まっててね</div>' +
        '</div>' +
        '<div style="font-size:10px;color:#a39686;margin-top:12px;text-align:center;">保護者の方へ：解約については「⚙ おとな」のページをご覧ください</div>' +
        '</div>';
      scr.style.display = "block";
      scr.scrollTop = 0;
      var clo1 = document.getElementById("fyEvClose");
      if (clo1) clo1.addEventListener("click", function () { scr.style.display = "none"; });
      return;
    }
    /* 2026-11-21：れんしゅう〜イベント期間の 外は「じゅんびちゅう」だけ見せて、
       0や「—」だらけの きろく画面は 出さない（先生の 指示：かんちがいを ふせぐため）。 */
    if (!lim && !inEventWindow() && !inResultsWindow()) {
      scr.innerHTML = '<div style="max-width:420px;margin:0 auto;padding:10px 12px 14px;">' +
        '<div style="position:sticky;top:0;z-index:5;background:#fdf8ed;padding:6px 0 6px;"><button id="fyEvClose" style="border:none;border-radius:16px;padding:8px 14px;font-size:15px;font-weight:900;background:#ff9800;color:#fff;font-family:inherit;box-shadow:0 2px 6px rgba(0,0,0,.2);">◀ もどる</button></div>' +
        '<div style="font-size:18px;font-weight:900;text-align:center;padding:0;">🏆 ' + EVENT.title + '</div>' +
        '<div style="text-align:center;margin:2px 0 6px;font-size:13px;">👤 ' + esc2(profiles[idx] || "") + ' さん</div>' +
        '<div style="background:#fff;border:2px solid #ffcc9a;border-radius:16px;padding:18px 14px;margin-top:10px;text-align:center;">' +
        '<div style="font-size:34px;">🗓️</div>' +
        '<div style="font-size:17px;font-weight:900;margin-top:6px;">いま じゅんびちゅう</div>' +
        '<div style="font-size:14px;line-height:1.8;margin-top:8px;color:#5b4636;">' + md(EVENT.pStart) + 'から れんしゅう スタート！<br>たのしみに まっててね</div>' +
        '</div>' +
        '<div style="font-size:10px;color:#a39686;margin-top:12px;text-align:center;">保護者の方へ：解約については「⚙ おとな」のページをご覧ください</div>' +
        '</div>';
      scr.style.display = "block";
      scr.scrollTop = 0;
      var clo0 = document.getElementById("fyEvClose");
      if (clo0) clo0.addEventListener("click", function () { scr.style.display = "none"; });
      return;
    }
    scr.innerHTML = '<div style="max-width:420px;margin:0 auto;padding:10px 12px 14px;">' +
      (lim ? '' : '<div style="position:sticky;top:0;z-index:5;background:#fdf8ed;padding:6px 0 6px;"><button id="fyEvClose" style="border:none;border-radius:16px;padding:8px 14px;font-size:15px;font-weight:900;background:#ff9800;color:#fff;font-family:inherit;box-shadow:0 2px 6px rgba(0,0,0,.2);">◀ もどる</button></div>') +
      '<div style="font-size:18px;font-weight:900;text-align:center;padding:0;">🏆 ' + EVENT.title + '</div>' +
      '<div style="text-align:center;margin:2px 0 6px;font-size:13px;">👤 ' + esc2(profiles[idx] || "") + ' さん</div>' +
      (lim ? '<div style="background:#e8f5e9;border:2px solid #43a047;border-radius:12px;padding:8px;margin-bottom:6px;text-align:center;font-weight:900;font-size:14px;line-height:1.6;">🎉 イベント おつかれさま！<br>けっかを せんせいに おくってね<br><span style="font-size:12px;font-weight:700;color:#806c5a;">' + md(opts.until) + 'まで おくれるよ</span></div>' :
        (remindOn() ? '<div style="background:#ffebee;border:2px solid #e53935;border-radius:12px;padding:8px;margin-bottom:6px;text-align:center;font-weight:900;font-size:14px;line-height:1.6;">⏰ ' + (daysLeft() === 0 ? "きょうが さいごの 日！" : md(EVENT.end) + "までに（あと " + daysLeft() + "日）") + '<br>せんせいに コードを おくってね！</div>' : '')) +
      '<div style="background:#fff;border:1px solid #f0e6d2;border-radius:12px;padding:6px;text-align:center;font-size:14px;">💮 れんしゅう日数（' + md(EVENT.pStart) + '〜' + md(EVENT.pEnd) + '）<br><span style="font-size:24px;font-weight:900;color:#ff5722;">' + practiceDays(idx) + '</span> 日</div>' +
      window.fyEvGrowthHtml(evGrowth(idx), "", todayS() < EVENT.start) +
      '<div style="font-size:12px;color:#806c5a;margin-top:2px;">きろくした日：' + when + '</div>' +
      (window.fyNewLookOn && window.fyNewLookOn() ? '' : (
      '<div style="font-size:12px;font-weight:800;margin-top:6px;">せんせいに おくる コード</div>' +
      '<textarea id="fyEvCode" readonly style="width:100%;height:56px;font-size:10px;word-break:break-all;border:2px solid #eadcc8;border-radius:10px;padding:6px;box-sizing:border-box;-webkit-user-select:text;user-select:text;">' + c.code + '</textarea>' +
      window.fyLineCheck('【ふよみイベント】' + (profiles[idx] || '') + ' さんの きろくコード\n' + c.code) +
      '<div style="font-size:12px;color:#806c5a;line-height:1.6;margin-top:4px;">おすと LINEが ひらくよ。<b>ひこうきの マーク</b>を おして おくってね</div>'
      )) +
      '<div style="font-size:10px;color:#a39686;margin-top:8px;text-align:center;">保護者の方へ：解約については「⚙ おとな」のページをご覧ください</div>' +
      '</div>';
    scr.style.display = "block";
    scr.scrollTop = 0;
    var clo = document.getElementById("fyEvClose");
    if (clo) clo.addEventListener("click", function () { scr.style.display = "none"; });
  }
  window.fyShowEventScreen = showEventScreen;
  window.fyEvDailyLine = function (idx) {
    try {
      var t = todayS(); if (t < EVENT.start || t > EVENT.end) return "";
      if (localStorage.getItem("fy_ev_sent_" + idx) === t) return "";
      return "🏆 イベントの きろく：" + makeEventCode(idx).code;
    } catch (e) { return ""; }
  };
  window.fyEvDailySent = function (idx) { try { localStorage.setItem("fy_ev_sent_" + idx, todayS()); } catch (e) {} };

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
      b.addEventListener("click", function () { showEventScreen(); });
    }
    b.style.display = isRegistered(activeProfileIndex) ? "" : "none";
    b.textContent = window.fyEvBtnLabel();
    b.style.cssText = (window.fyEvBtnDim() ? "background:#e6dff0;color:#b0a3c8;" : "background:#ffb300;color:#5b4636;") + (b.style.display === "none" ? "display:none;" : "");
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
    if (f[0] !== "FYE1" || (f.length !== 9 && f.length !== 10 && f.length !== 11 && f.length !== 12)) return bad("コードの 中みが ちがいます");
    var st = f[3], when = st.slice(0, 4) + "/" + (+st.slice(4, 6)) + "/" + (+st.slice(6, 8)) + " " + st.slice(8, 10) + ":" + st.slice(10, 12);
    var rows = "";
    for (var l = 1; l <= 4; l++) {
      var a = f[4 + l].split(","), best = parseInt(a[0], 10) || 0, rate = parseInt(a[1], 10) || 0;
      rows += "<tr><td>レベル" + l + "</td><td>" + (best ? fmt(best) : "—") + "</td><td>" + (rate ? rate + "%" : "—") + "</td></tr>";
    }
    if (f.length >= 10) rows += "<tr><td>レベル5</td><td colspan='2'>✅ ふよみテスト合格 <b>" + (parseInt(f[9], 10) || 0) + "</b> 曲</td></tr>";
    if (f.length >= 11) rows += "<tr><td>レベル5</td><td colspan='2'>⭐ 演奏合格 <b>" + (parseInt(f[10], 10) || 0) + "</b> 曲</td></tr>";
    /* 2026-11-21：イベント名・賞の名前を さきに もとめて、印刷の リンクと デジタルカードの コードの りょうほうに つかう */
    var evTitleStr = (function () { try { if (typeof EVENT !== "undefined" && EVENT && EVENT.id === f[2] && EVENT.title) return EVENT.title; } catch (eT) {} var mm = String(f[2]).match(/^\d{4}-(\d{1,2})$/); return mm ? (+mm[1]) + "月の ふよみイベント" : f[2]; })();
    var awardName = f.length === 12 ? (function () { var q = f[11].split(",").map(function (x) { return parseInt(x, 10); }); return window.fyEvAwardName({ rb: q[0], rd: q[1], nd: q[2], perf: q[3], lv0: q[4], lv1: q[5], tb: isNaN(q[6]) ? -1 : q[6], ta: isNaN(q[7]) ? -1 : q[7] }); })() : "";
    out.innerHTML = '<div style="color:#2e7d32;font-weight:800;font-size:14px;">✅ 本物の コードです</div>' +
      '<div style="font-size:13px;line-height:1.7;text-align:left;">なまえ：<b>' + esc(f[1]) + '</b>　イベント：' + esc(f[2]) + '<br>きろくした日：' + when + '<br>れんしゅう日数：<b>' + (parseInt(f[4], 10) || 0) + '</b> 日</div>' +
      '<table class="compare-table"><thead><tr><th></th><th>ノーミスの ベスト</th><th>のびた</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (f.length === 12 ? (function () { var q = f[11].split(",").map(function (x) { return parseInt(x, 10); }); return window.fyEvGrowthHtml({ rb: q[0], rd: q[1], nd: q[2], perf: q[3], lv0: q[4], lv1: q[5], tb: isNaN(q[6]) ? -1 : q[6], ta: isNaN(q[7]) ? -1 : q[7] }, esc(f[1])); })() : "") +
      '<div style="text-align:left;font-size:13px;">' + window.fyPrintRow(f[1], 'type=event&date=' + window.fyLocalDateStr(new Date()) + '&ev=' + encodeURIComponent(evTitleStr) + (awardName ? '&award=' + encodeURIComponent(awardName) : '')) + '<span style="font-size:12px;color:#806c5a;">賞の 名前は 自動で 入ります（印刷の ページで 変えられます）</span></div>' +
      (window.fyEvCardCodeRow ? window.fyEvCardCodeRow(f[1], awardName, evTitleStr) : '');
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
      a.innerHTML = window.fySeenHtml() +
        '<div style="font-size:13px;font-weight:bold;color:#5b4636;margin-bottom:4px;text-align:left;">🔍 コードを 貼って かくにん（ぜんぶ ここで）</div>' +
        '<div style="text-align:left;font-size:11px;color:#806c5a;margin-bottom:4px;">LINEで 届いた メッセージを、そのまま 貼ってください。<br>イベント・達成・ポイント こうかん・うつしコードを じどうで みわけます。</div>' +
        '<textarea id="faIn" class="modal-input" style="height:80px;font-size:12px;" placeholder="ここに 貼る"></textarea>' +
        '<button class="modal-btn" style="background:#ef6c00;font-size:13px;padding:9px;" onclick="fyCheckAny()">かくにん する</button>' +
        '<div id="faOut" style="margin:6px 0 4px;"></div>' +
        '<a href="cards_print.html" style="display:block;text-decoration:none;text-align:center;border-radius:12px;padding:10px;font-size:14px;font-weight:800;background:#e3f2fd;color:#1565c0;margin:8px 0 4px;">🖨 カードの 印刷ページ（見本・テスト用）</a>';
      t3.insertBefore(a, t3.firstChild);
    }
  } catch (e) {}

  /* 先生の 台帳用 スプレッドシート（URLを かえたい ときは、ここだけ 書きなおす） */
  var FY_LEDGER_SHEET_URL = "https://docs.google.com/spreadsheets/d/1-hYFEfmWMxeJOYiORlS8a0pCl6NY1Pg9AICNiPoQuLw/edit?usp=drivesdk";

  /* ===== まとめて 集計（先生ページ）：LINEの メッセージを いっぱい 貼る → ひょう ＋ 賞の あん ＋ スプレッドシート用コピー ===== */
  window.fyBulkRun = function () {
    var out0 = document.getElementById("fbOut");
    if (out0) out0.innerHTML = '<div style="font-size:13px;font-weight:800;color:#2e7d32;">⏳ 集計しています…</div>';
    setTimeout(function () {
      try { fyBulkRun2(); try { out0.scrollIntoView({ block: "start" }); } catch (e2) {} }
      catch (err) { if (out0) out0.innerHTML = '<div style="color:#c62828;font-weight:800;font-size:13px;">❌ うまく 集計できませんでした<br><span style="font-size:11px;">' + esc(String(err && err.message || err)) + '</span></div>'; }
    }, 30);
  };
  function fyBulkRun2() {
    var out = document.getElementById("fbOut");
    var inEl = document.getElementById("fbIn");
    var raw = String(inEl.value || "").normalize("NFKC").replace(/%2E/gi, ".");
    inEl.value = "";   /* 集計したら、つぎに すぐ 貼れるように からにする */
    var toks = raw.match(/FYE1\.[A-Za-z0-9_\-]+\.[A-Z0-9]{6}/g) || [];
    var cfg = window.fyEventCfg || {}, bad = 0, other = 0, by = {};
    toks.forEach(function (tk) {
      var parts = tk.split("."), payload;
      try { payload = b64dec(parts[1]); } catch (e) { bad++; return; }
      if (signOf(payload) !== parts[2]) { bad++; return; }
      var f = payload.split("|");
      if (f[0] !== "FYE1" || f.length < 9) { bad++; return; }
      if (cfg.id && f[2] !== cfg.id) { other++; return; }
      var o = { name: f[1], stamp: f[3], days: parseInt(f[4], 10) || 0, pass: f.length >= 10 ? (parseInt(f[9], 10) || 0) : "", play: f.length >= 11 ? (parseInt(f[10], 10) || 0) : "", g: null };
      if (f.length === 12) { var q = f[11].split(",").map(function (x) { return parseInt(x, 10); }); o.g = { rb: q[0], rd: q[1], nd: q[2], perf: q[3], lv0: q[4], lv1: q[5], tb: isNaN(q[6]) ? -1 : q[6], ta: isNaN(q[7]) ? -1 : q[7] }; }
      if (!by[o.name] || by[o.name].stamp < o.stamp) by[o.name] = o;
    });
    var names = Object.keys(by).sort();
    if (!names.length) { out.innerHTML = '<div style="color:#c62828;font-weight:800;font-size:13px;">❌ 本物の コードが 見つかりません' + (bad ? '（しるしが あわない コード ' + bad + '件）' : '') + '</div>'; return; }
    var cell = "border:1px solid #eadcc8;padding:2px 3px;text-align:center;font-size:11px;white-space:nowrap;";
    var rows = [], tsv = ["なまえ\t正解率(前)\t正解率(後)\t正解率の伸び\t全部一発の回数\tレベル(前)\tレベル(後)\tレベルの伸び\tタイム(前)\tタイム(後)\tタイムの伸び\t練習日数\tふよみテスト合格\t演奏合格\t賞の案\t記録した日時"];
    var best = { up: [-1, []], ga: [4, []], perf: [0, []], days: [0, []], td: [4, []] };
    function chk(k, v, n) { if (v > best[k][0]) best[k] = [v, [n]]; else if (v === best[k][0] && v > 0) best[k][1].push(n); }
    names.forEach(function (n) {
      var o = by[n], g = o.g, aw = g && window.fyEvAwardOf ? window.fyEvAwardOf(g) : null;
      var ga = g && g.rb >= 0 && g.rd >= 0 ? g.rd - g.rb : "", up = g && g.lv0 >= 0 ? g.lv1 - g.lv0 : "";
      var td = g && g.tb >= 0 && g.ta >= 0 ? g.tb - g.ta : "";
      if (g) { if (up !== "") chk("up", up, n); if (ga !== "") chk("ga", ga, n); chk("perf", g.perf, n); if (td !== "") chk("td", td, n); }
      chk("days", o.days, n);
      var t = o.stamp, when = t.slice(0, 4) + "/" + (+t.slice(4, 6)) + "/" + (+t.slice(6, 8)) + " " + t.slice(8, 10) + ":" + t.slice(10, 12);
      var v = g ? [g.rb >= 0 ? g.rb : "", g.rd >= 0 ? g.rd : "", ga, g.perf, g.lv0 >= 0 ? g.lv0 : "", g.lv1, up, g.tb >= 0 ? g.tb : "", g.ta >= 0 ? g.ta : "", td] : ["", "", "", "", "", "", "", "", "", ""];
      rows.push('<tr><td style="' + cell + 'font-weight:800;">' + esc(n) + '</td>' + v.map(function (x, i) { return '<td style="' + cell + '">' + (x === "" ? "—" : (i < 2 ? x + "%" : x)) + '</td>'; }).join("") +
        '<td style="' + cell + '">' + o.days + '</td><td style="' + cell + 'text-align:left;">' + (aw ? esc(aw.name) : "（古いコード）") + '</td></tr>');
      tsv.push([n].concat(v, [o.days, o.pass, o.play, aw ? aw.name.replace(/^\S+\s/, "") : "", when]).join("\t"));
    });
    function top(label, k, unit) { var b = best[k]; return b[1].length && b[0] > 0 ? '<div style="font-size:12px;margin:2px 0;">' + label + '：<b>' + b[1].map(esc).join("、") + '</b>（' + b[0] + unit + '）</div>' : ''; }
    var th = cell + "background:#f6ecd8;";
    out.innerHTML = '<div style="color:#2e7d32;font-weight:800;font-size:13px;">✅ ' + names.length + '人ぶん（本物）' + (bad ? ' ／ ❌ しるしが あわない ' + bad + '件' : '') + (other ? ' ／ ちがうイベントの コード ' + other + '件は のぞきました' : '') + '</div>' +
      '<div style="font-size:11px;color:#806c5a;">おなじ なまえが 何回も あるときは、いちばん あたらしい ものを つかっています</div>' +
      '<div style="overflow-x:auto;margin:4px 0;"><table style="border-collapse:collapse;"><tr><th style="' + th + '">なまえ</th><th style="' + th + '">正解率 前</th><th style="' + th + '">正解率 後</th><th style="' + th + '">のび</th><th style="' + th + '">全部一発</th><th style="' + th + '">Lv 前</th><th style="' + th + '">Lv 後</th><th style="' + th + '">のび</th><th style="' + th + '">タイム前</th><th style="' + th + '">タイム後</th><th style="' + th + '">のび</th><th style="' + th + '">練習日</th><th style="' + th + '">賞の案</th></tr>' + rows.join("") + '</table></div>' +
      '<div style="font-weight:800;font-size:12px;margin-top:6px;">🏅 それぞれの 一番</div>' +
      top("🚀 レベルが いちばん のびた", "up", "つ") + top("🎯 正解率が いちばん のびた", "ga", "ポイント") + top("✅ 全部一発が いちばん おおい", "perf", "回") + top("⚡ タイムが いちばん 速くなった", "td", "秒") + top("💮 練習日数が いちばん おおい", "days", "日") +
      '<textarea id="fbTsv" readonly style="width:100%;height:60px;font-size:10px;box-sizing:border-box;margin-top:6px;-webkit-user-select:text;user-select:text;">' + esc(tsv.join("\n")) + '</textarea>' +
      '<button class="modal-btn" style="background:#2e7d32;font-size:13px;padding:9px;" onclick="fyBulkCopy(this)">📋 スプレッドシート用に コピー</button>' +
      '<a href="' + FY_LEDGER_SHEET_URL + '" target="_blank" rel="noopener" style="display:block;text-decoration:none;text-align:center;border-radius:10px;padding:9px;font-size:13px;font-weight:700;background:#1565c0;color:#fff;margin-top:4px;">📊 台帳の スプレッドシートを ひらく</a>' +
      '<div style="font-size:11px;color:#806c5a;">コピーしたあと、上のボタンでシートを開いて、A1に貼ると、1人 1行で 入ります。</div>';
  }
  window.fyBulkCopy = function (btn) {
    var ta = document.getElementById("fbTsv"), ok = false;
    try { ta.focus(); ta.select(); ta.setSelectionRange(0, 999999); ok = document.execCommand("copy"); } catch (e) {}
    btn.textContent = ok ? "✅ コピーしました" : "文字を ながおしして コピーしてね";
  };
  try {
    var t4 = document.getElementById("teacherTab3");
    if (t4 && !document.getElementById("fyBulk")) {
      var bk = document.createElement("div");
      bk.id = "fyBulk";
      bk.style.cssText = "background:#e8f5e9;border:2px solid #43a047;border-radius:12px;padding:8px;margin-bottom:14px;";
      bk.innerHTML =
        '<div style="font-size:13px;font-weight:bold;color:#5b4636;margin-bottom:4px;text-align:left;">📊 イベントの きろくを まとめて 集計</div>' +
        '<div style="text-align:left;font-size:11px;color:#806c5a;margin-bottom:4px;">LINEで 届いた メッセージを、いくつでも 続けて 貼ってください。</div>' +
        '<textarea id="fbIn" class="modal-input" style="height:100px;font-size:12px;" placeholder="ここに ぜんぶ 貼る"></textarea>' +
        '<div style="display:flex;gap:6px;">' +
        '<button class="modal-btn" style="background:#43a047;font-size:13px;padding:9px;flex:1;" onclick="fyBulkRun()">集計 する</button>' +
        '<button class="modal-btn" style="background:#bdbdbd;font-size:13px;padding:9px;flex:0 0 70px;" onclick="document.getElementById(\'fbIn\').value=\'\'">🗑 クリア</button>' +
        '</div>' +
        '<div id="fbOut" style="margin:6px 0 4px;"></div>';
      var anchor2 = document.getElementById("fyAnyCheck");
      if (anchor2 && anchor2.nextSibling) t4.insertBefore(bk, anchor2.nextSibling); else t4.insertBefore(bk, t4.firstChild);
    }
  } catch (e) {}
  function evPlus(raw, r) {
    var fi = document.getElementById("feIn"), fo = document.getElementById("feOut");
    if (!fi || !fo) return "いま かくにん できません";
    fi.value = r.token; window.fyCheckEventCode();
    var h = fo.innerHTML, rest = String(raw || "").replace(r.token, "").normalize("NFKC");
    if (/コード[：:]\s*[A-Z0-9]{4}|しゅうの きろく/.test(rest)) { var r2 = window.fyCheckAnyCore(rest); if (r2 && r2.html) h = r2.html + '<hr style="border:none;border-top:2px dashed #ffb300;margin:10px 0;">' + h; }
    else { try { var nm = rest.match(/【ふよみ[^】]*】\s*([^\n]+?)\s*さん/); if (nm) { var sn = JSON.parse(localStorage.getItem("fy_seen") || "{}") || {}, k = nm[1].replace(/\s+/g, ""); sn[k] = { d: window.fyLocalDateStr(new Date()), r: (sn[k] || {}).r || "" }; localStorage.setItem("fy_seen", JSON.stringify(sn)); } } catch (e) {} }
    return h;
  }
  window.fyCheckAnyHtml = function (raw) {
    var r = window.fyCheckAnyCore(raw);
    return r.kind === "event" ? evPlus(raw, r) : r.html;
  };
  window.fyCheckAny = function () {
    var out = document.getElementById("faOut"), raw = document.getElementById("faIn").value;
    var r = window.fyCheckAnyCore(raw);
    out.innerHTML = r.kind === "event" ? evPlus(raw, r) : r.html;
    try { var sb = document.getElementById("fySeenBox"); if (sb) sb.outerHTML = window.fySeenHtml(); } catch (e) {}
  };
})();

/* ===== 🏅 半期の きろく（全カード レベル5・20問 ぜんぶ いっぱつ せいかいの 通算回数）の テスト用ボタン
   2026-11-24：「ふよみ名人（連続100回）」→「半期ごとの つうさん回数」に変わったので、ここも 合わせる。 */
window.setStreak99ForTest = function () {
  var i = activeProfileIndex;
  Storage.set("fy_run_now_" + i, 0);
  Storage.set("fy_run_best_" + i, 0);
  alert((profiles[i] || "") + " さんの「全カード レベル5」テストは、半期の 回数を 直接 すすめてください（🧪いまのプレイヤーの たっせいの きろくと れんぞくを リセット の 下の テストボタン、または fy_half_cnt_ を 直接 さわる）。");
  try { initProfiles(); } catch (e) {}
};
window.resetLegendForTest = function () {
  var i = activeProfileIndex;
  Storage.set("fy_run_now_" + i, 0);
  Storage.set("fy_run_best_" + i, 0);
  Storage.set("fy_half_id_" + i, "");
  Storage.set("fy_half_cnt_" + i, 0);
  var a = Storage.get("fy_ach_" + i, []);
  if (Array.isArray(a)) Storage.set("fy_ach_" + i, a.filter(function (r) { return !(r && (r.type === "legend" || r.type === "half" || r.type === "halfend")); }));
  alert((profiles[i] || "") + " さんの 半期の きろくと 20問れんぞくを リセットしました。");
  try { initProfiles(); } catch (e) {}
};

/* ===== 古い「100回れんぞく」のレジェンドを、見えなくする（記録は のこす） ===== */
(function () {
  /* ★ もとに もどしたい ときは、下の 1行を false に する */
  var HIDE_OLD_LEGEND = false;
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
  var FALLBACK = [["01","アマリリス"],["02","おおきな くりの きの したで"],["03","はるの おがわ"],["04","はるが きた"],["05","あめ こんこん"],["06","いけの こい"],["07","ふじさん"],["08","ロンドンばし"],["09","きんこんしき"],["10","ゆうやけ こやけ"],["11","かえるの がっしょう"],["12","きらきらぼし"],["13","はと"],["14","ほたるの ひかり"],["15","むすんで ひらいて"],["16","うさぎと かめ"],["17","どんぐり ころころ"],["18","おしょうがつ"],["19","よろこびの うた"],["20","いふうどうどう"],["21","エリーゼの ために"],["22","凱旋行進曲"],["23","君が代"],["24","木星"],["25","待ちぼうけ"],["26","スキーの歌"],["27","バイエル77"],["28","楽しき農夫"],["29","白鳥"],["30","ます"],["31","情景"],["32","驚愕"],["33","主よ人の望みの喜びよ"],["34","トルコ行進曲"],["35","花の歌"],["36","ガボット"]];
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
        '<details id="fuPassBox" style="margin-top:10px;border-top:2px solid #c8e6c9;"><summary style="font-size:14px;font-weight:900;color:#5b4636;padding:10px 0;">② ごうかくコードを だす（レベル5）</summary>' +
        '<div style="font-size:11px;color:#806c5a;margin-bottom:2px;">どちらの ごうかく？</div>' +
        '<label style="display:block;font-size:14px;font-weight:800;padding:4px 0;"><input type="radio" name="fuKind" value="pass" checked style="width:18px;height:18px;"> ✅ ふよみテスト ごうかく</label>' +
        '<label style="display:block;font-size:14px;font-weight:800;padding:4px 0;"><input type="radio" name="fuKind" value="play" style="width:18px;height:18px;"> ⭐ えんそう ごうかく（先生が うたえる えんそう）</label>' +
        '<div style="font-size:11px;color:#806c5a;margin:6px 0 2px;">ごうかくした きょくに チェック</div>' +
        '<button class="modal-btn" style="background:#2e7d32;font-size:14px;padding:10px;margin-bottom:6px;position:sticky;top:0;z-index:4;box-shadow:0 2px 6px rgba(0,0,0,.12);" id="fuPassBtn">ごうかくコードを つくる</button>' +
        '<div id="fuSongs"></div>' +
        '<div id="fuPassOut"></div></details>' +
        '<details id="fuRestoreBox" style="margin-top:10px;border-top:2px solid #c8e6c9;"><summary style="font-size:14px;font-weight:900;color:#5b4636;padding:10px 0;">③ 復元コードを だす（機種変更の とき）</summary>' +
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
        '<details id="fuCheckBox" style="margin-top:10px;border-top:2px solid #c8e6c9;"><summary style="font-size:14px;font-weight:900;color:#5b4636;padding:10px 0;">④ コードを しらべる ・ カードの 印刷</summary><div id="fuCheckSlot"></div></details>' +
        '<details id="fuGiftBox" style="margin-top:10px;border-top:2px solid #c8e6c9;"><summary style="font-size:14px;font-weight:900;color:#5b4636;padding:10px 0;">⑤ 🎁 ポイントを プレゼント</summary>' +
        '<div style="font-size:12px;color:#806c5a;text-align:left;">いちばん上の「生徒の なまえ」の 子に おくります。おなじ コードは 1かいしか つかえません。</div>' +
        '<div id="fuGiftPick" style="margin:6px 0;"></div>' +
        '<input id="fuGiftN" class="modal-input" type="number" min="1" max="999" placeholder="ポイント（すうじ）" style="font-size:16px;">' +
        '<input id="fuGiftWhy" class="modal-input" type="text" placeholder="りゆう（例：レベルアップ賞）※なくても OK" style="font-size:14px;">' +
        '<button class="modal-btn" style="background:#ec407a;font-size:14px;padding:10px;" id="fuGiftBtn">プレゼントの コードを つくる</button>' +
        '<div id="fuGiftOut"></div></details>' +
        '<details id="fuMemoBox" style="margin-top:10px;border-top:2px solid #c8e6c9;"><summary style="font-size:14px;font-weight:900;color:#5b4636;padding:10px 0;">⑥ 💾 先生の メモ（台帳・バックアップ）</summary>' +
        '<div style="font-size:12px;color:#806c5a;text-align:left;line-height:1.6;">この たんまつで 出した 合格コードと プレゼントの きろくです。</div>' +
        '<button class="modal-btn" style="background:#00897b;font-size:14px;padding:10px;" id="fuLedgerBtn">📋 台帳用に コピー（スプレッドシートに 貼る）</button>' +
        '<button class="modal-btn" style="background:#5c6bc0;font-size:14px;padding:10px;" id="fuBkBtn">💾 バックアップを コピー</button>' +
        '<textarea id="fuBkIn" class="modal-input" rows="2" placeholder="📥 もどすとき：バックアップの 文を ここに 貼る" style="font-size:13px;"></textarea>' +
        '<button class="modal-btn" style="background:#8d6e63;font-size:14px;padding:10px;" id="fuBkRestore">📥 バックアップから もどす</button>' +
        '<div id="fuMemoOut" style="font-size:13px;font-weight:800;margin-top:4px;"></div></details>' +
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
      /* 生徒の ならび（やさしい→ふつう→むずかしい）で、グループごとに。この たんまつの 生徒なら「いま ひらいている」曲に 🔓 */
      function drawSongs() {
        sd.innerHTML = "";
        var groups = []; try { groups = JSON.parse(localStorage.getItem("fy_song_groups") || "[]") || []; } catch (e) {}
        var all = songs(), byC = {}; all.forEach(function (s) { byC[s[0]] = s; });
        var order = [], seen = {};
        groups.forEach(function (g) { (g.ids || []).forEach(function (c) { if (byC[c]) { order.push(c); seen[c] = 1; } }); });
        all.forEach(function (s) { if (!seen[s[0]]) order.push(s[0]); });
        var openN = -1;
        try {
          var nm = ($("fuName") ? $("fuName").value.trim().normalize("NFKC") : "");
          var pi = -1; if (nm && typeof profiles !== "undefined") profiles.forEach(function (p, i) { if (String(p || "").normalize("NFKC") === nm) pi = i; });
          if (pi >= 0) {
            var pa = JSON.parse(localStorage.getItem("fy_pass_" + pi) || "{}") || {};
            openN = Object.keys(pa).length + 2;
            if (localStorage.getItem("fy_lv5_openall_" + pi)) openN = 9999;
          }
        } catch (e) {}
        /* すでに ごうかくした きょく（黒の✓）＝先生が この たんまつで 出した コード ＋ この たんまつの 生徒の きろく。いま えらぶのは 赤 */
        var kindEl0 = document.querySelector('input[name="fuKind"]:checked'), kind0 = kindEl0 ? kindEl0.value : "pass", done = {};
        try {
          var nmx = $("fuName") ? $("fuName").value.trim().normalize("NFKC") : "";
          var iss = JSON.parse(localStorage.getItem("fy_issued_" + nmx) || "{}") || {};
          (iss[kind0] || []).forEach(function (c) { done[c] = 1; });
          if (nmx && typeof profiles !== "undefined") profiles.forEach(function (p, i) { if (String(p || "").normalize("NFKC") === nmx) { var rec = JSON.parse(localStorage.getItem((kind0 === "play" ? "fy_play_" : "fy_pass_") + i) || "{}") || {}; Object.keys(rec).forEach(function (c) { done[c] = 1; }); } });
        } catch (e) {}
        /* この たんまつに 生徒の きろくが なければ、先生が だした コードの かず から「いま ひらいている 曲」を けいさん */
        if (openN < 0) { try { var nm2 = $("fuName") ? $("fuName").value.trim().normalize("NFKC") : ""; if (nm2) { var is2 = JSON.parse(localStorage.getItem("fy_issued_" + nm2) || "{}") || {}; openN = ((is2.pass || []).length) + 2; } } catch (e) {} }
        var pos = 0, anyOpen = false, boxes = [];
        groups.concat([{ name: "そのほか", icon: "🎵", ids: all.filter(function (s) { return !seen[s[0]]; }).map(function (s) { return s[0]; }) }]).forEach(function (g) {
          if (!g.ids || !g.ids.length) return;
          var dt = document.createElement("details"); dt.style.cssText = "margin:6px 0;background:#f6f1e7;border-radius:10px;padding:2px 8px;";
          var nDone = 0, cur = false, tot = 0;
          var sm = document.createElement("summary"); sm.style.cssText = "font-size:14px;font-weight:900;color:#5b4636;padding:8px 0;";
          dt.appendChild(sm);
          g.ids.forEach(function (c, k) {
            if (!byC[c]) return;
            var s = byC[c], op = openN >= 0 && pos < openN; pos++; tot++;
            if (done[c]) nDone++;
            if (op && !done[c]) cur = true;
            var l = document.createElement("label");
            l.style.cssText = "display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;margin:3px 0;padding:6px;background:" + (op && !done[c] ? "#fff8e1" : "#fff") + ";border-radius:8px;";
            l.innerHTML = '<input type="checkbox" value="' + esc(s[0]) + '" style="width:20px;height:20px;accent-color:#d32f2f;"> ' + (done[c] ? '<span style="color:#000;font-weight:900;">✔</span> ' : '') + (k + 1) + '．' + esc(s[1]) + (op && !done[c] ? ' <span style="font-size:11px;color:#e65100;margin-left:auto;">🔓 いま</span>' : '');
            dt.appendChild(l);
          });
          sm.textContent = (g.icon || "") + " " + g.name + "　✔ " + nDone + " / " + tot;
          if (cur) { dt.open = true; anyOpen = true; }
          boxes.push(dt); sd.appendChild(dt);
        });
        if (!anyOpen && boxes.length) boxes[0].open = true;
      }
      drawSongs();
      try { Array.prototype.forEach.call(document.querySelectorAll('input[name="fuKind"]'), function (r) { r.addEventListener("change", function () { var ck = {}; Array.prototype.forEach.call(sd.querySelectorAll("input:checked"), function (x) { ck[x.value] = 1; }); drawSongs(); Array.prototype.forEach.call(sd.querySelectorAll("input"), function (x) { if (ck[x.value]) x.checked = true; }); }); }); } catch (e) {}
      try { $("fuName").addEventListener("input", function () { var ck = {}; Array.prototype.forEach.call(sd.querySelectorAll("input:checked"), function (x) { ck[x.value] = 1; }); drawSongs(); Array.prototype.forEach.call(sd.querySelectorAll("input"), function (x) { if (ck[x.value]) x.checked = true; }); }); } catch (e) {}
      var dt = $("fuDate"); if (dt) { var d0 = new Date(); dt.value = d0.getFullYear() + "-" + ("0" + (d0.getMonth() + 1)).slice(-2) + "-" + ("0" + d0.getDate()).slice(-2); }
      function nameVal() { return $("fuName").value.trim().normalize("NFKC"); }
      function needName(out) { var n = nameVal(); if (!n) { out.innerHTML = '<div style="padding:8px;">① の なまえを いれてね</div>'; return null; } return n; }
      fyTeacherExtras();
      $("fuPassBtn").addEventListener("click", function () {
        var out = $("fuPassOut"); out.innerHTML = "";
        var name = needName(out); if (!name) return;
        var picked = Array.prototype.slice.call(sd.querySelectorAll("input:checked")).map(function (x) { return x.value; });
        if (!picked.length) { out.innerHTML = '<div style="padding:8px;">きょくを えらんでね</div>'; return; }
        remember(name); showNames();
        var kindEl = document.querySelector('input[name="fuKind"]:checked'), kind = kindEl ? kindEl.value : "pass";
        try { var ik = "fy_issued_" + name, io = JSON.parse(localStorage.getItem(ik) || "{}") || {}; io[kind] = io[kind] || []; picked.forEach(function (c) { if (io[kind].indexOf(c) === -1) io[kind].push(c); }); localStorage.setItem(ik, JSON.stringify(io)); } catch (e) {}
        function titleOfSong(c) { var title = ""; songs().forEach(function (s) { if (s[0] === c) title = s[1]; }); return title; }
        var okLabel = (kind === "play" ? "えんそう ごうかく！⭐" : "ごうかく！🎉");
        /* 📩 あいことば（ひらがな5もじ）。1つの あいことばに 3きょく まで。だした日から 7日間 つかえる */
        var d0 = FYAK.day(0), chunks = [];
        for (var ci = 0; ci < picked.length; ci += 3) chunks.push(picked.slice(ci, ci + 3));
        var body = name + " さん、" + okLabel + "\n";
        chunks.forEach(function (ch) {
          body += ch.map(function (c) { return "・「" + titleOfSong(c) + "」"; }).join("\n") + "\n📩 あいことば：" + FYAK.songs(name, kind, ch, d0) + "\n";
        });
        body += "アプリの『📩 あいことば』に いれてね（" + FYAK.until() + " まで）";
        card(body, out);
        try { out.scrollIntoView({ block: "center" }); } catch (e) {}
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
        b.textContent = x; b.addEventListener("click", function () { $("fuName").value = x; try { $("fuName").dispatchEvent(new Event("input")); } catch (e) {} });
        nb.appendChild(b);
      });
    }
    showNames();
    /* しらべる はこを ひとつに（貼るだけ）。ほかの 古い はこは かくす */
    var any = $("fyAnyCheck"), slot = $("fuCheckSlot");
    if (any && slot && any.parentNode !== slot) { any.style.margin = "0"; slot.appendChild(any); }
    ["fyEventCheck", "fyStampTest", "fyPassMk"].forEach(function (id) { var e = $(id); if (e) e.style.display = "none"; });
    if (t3.firstChild !== ui) t3.insertBefore(ui, t3.firstChild);
    /* せいり：テスト用の どうぐは「🧪 テスト用」の ひきだしへ。イベントの 集計は おりたたむ */
    try {
      var dr = $("fyTestDrawer"), pt = $("fyPtTest"); if (dr && pt && pt.parentNode !== dr) dr.appendChild(pt);
      var bk = $("fyBulk");
      if (bk && bk.parentNode && bk.parentNode.tagName !== "DETAILS") {
        var dd = document.createElement("details"); dd.style.cssText = "margin:0 0 6px;border-top:2px solid #c8e6c9;text-align:left;";
        dd.innerHTML = '<summary style="font-size:14px;font-weight:900;color:#5b4636;padding:10px 0;">📊 イベントの きろくを まとめて 集計</summary>';
        bk.parentNode.insertBefore(dd, bk); dd.appendChild(bk);
      }
    } catch (e) {}
  }
  try { build(); } catch (e) {}
  var pr = window.renderTeacherView;
  if (typeof pr === "function") window.renderTeacherView = function () { var r = pr.apply(this, arguments); try { build(); } catch (e) {} return r; };
  window.__fyUni = { code: codeOf, build: build };

  /* ===== 先生ページ：⑤ ポイント プレゼント ／ ⑥ 先生の メモ ===== */
  function fyTeacherExtras() {
    try {
      function nmv() { return $("fuName") ? $("fuName").value.trim().normalize("NFKC") : ""; }
      function copyText(t, okMsg) {
        var out = $("fuMemoOut");
        function done(ok) { if (out) out.textContent = ok ? okMsg : "コピーできませんでした。下の 文を 長押しして コピーしてください。"; if (!ok && out) { var ta = document.createElement("textarea"); ta.className = "modal-input"; ta.rows = 4; ta.value = t; out.appendChild(ta); } }
        try { navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); }
      }
      function issuedAll() { var o = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf("fy_issued_") === 0) { try { o[k.slice(10)] = JSON.parse(localStorage.getItem(k)) || {}; } catch (e) {} } } return o; }
      /* ⑤ */
      var pick = $("fuGiftPick");
      if (pick && !pick.firstChild) [1, 2, 3, 5, 10].forEach(function (n) { var b = document.createElement("button"); b.textContent = n + " p"; b.style.cssText = "margin:2px;padding:8px 14px;border:none;border-radius:10px;background:#f8bbd0;font-size:15px;font-weight:900;"; b.addEventListener("click", function () { $("fuGiftN").value = n; }); pick.appendChild(b); });
      $("fuGiftBtn").addEventListener("click", function () {
        var name = nmv(), n = parseInt($("fuGiftN").value, 10), why = ($("fuGiftWhy").value || "").trim(), out = $("fuGiftOut");
        if (!name) { out.textContent = "いちばん上に、生徒の なまえを 入れてください。"; return; }
        if (!(n >= 1 && n <= 999)) { out.textContent = "ポイントの すうじを 入れてください。"; return; }
        if (n > 20 && !confirm(name + " さんに " + n + " ポイントを あげます。よいですか？")) return;
        var code = FYAK.gift(name, n, FYAK.day(0));
        try { var ik = "fy_issued_" + name, io = JSON.parse(localStorage.getItem(ik) || "{}") || {}; io.gift = io.gift || []; io.gift.push({ n: n, why: why, d: window.fyLocalDateStr(new Date()) }); localStorage.setItem(ik, JSON.stringify(io)); } catch (e) {}
        var text = "【ふよみ】" + name + " さんへ　🎁 " + n + "ポイント プレゼント！" + (why ? "（" + why + "）" : "") + "\n📩 あいことば：" + code + "\nアプリの『📩 あいことば』に いれてね（" + FYAK.until() + " まで）";
        out.innerHTML = '<div style="background:#fff;border-radius:10px;padding:8px;font-size:13px;white-space:pre-wrap;text-align:left;margin:6px 0;">' + esc(text) + '</div>' + window.fyLineBtn(text, "📨 LINEで おくる", "#06c755");
      });
      /* ⑥ 台帳：なまえ／ふよみテスト／えんそう／あげたポイント（タブくぎり → スプレッドシートに そのまま 貼れる） */
      $("fuLedgerBtn").addEventListener("click", function () {
        var all = issuedAll(), rows = ["なまえ\tふよみテスト合格（曲数）\tふよみテスト合格（曲番号）\tえんそう合格（曲数）\tえんそう合格（曲番号）\tあげたポイント（合計）\tポイントの うちわけ\t処理ずみの コード（カード・こうかん）"];
        Object.keys(all).sort().forEach(function (nm) {
          var o = all[nm], pa = (o.pass || []).slice().sort(), pl = (o.play || []).slice().sort(), g = o.gift || [], sum = 0;
          g.forEach(function (x) { sum += x.n || 0; });
          rows.push([nm, pa.length, pa.join("・"), pl.length, pl.join("・"), sum, g.map(function (x) { return x.d + " " + x.n + "p" + (x.why ? "(" + x.why + ")" : ""); }).join(" / "), (o.recv || []).map(function (x) { return x.d + " " + x.l; }).join(" / ")].join("\t"));
        });
        copyText(rows.join("\n"), "コピーしました（" + (rows.length - 1) + "人）。スプレッドシートの A1 を 長押し →「ペースト」。");
      });
      $("fuBkBtn").addEventListener("click", function () {
        var o = { v: 1, issued: issuedAll(), names: null }; try { o.names = JSON.parse(localStorage.getItem("sensei_names") || "null"); } catch (e) {}
        copyText("FYBK1:" + btoa(unescape(encodeURIComponent(JSON.stringify(o)))), "バックアップを コピーしました。LINEの Keepメモなどに 貼って のこしてください。");
      });
      $("fuBkRestore").addEventListener("click", function () {
        var out = $("fuMemoOut"), t = ($("fuBkIn").value || "").trim();
        try {
          if (t.indexOf("FYBK1:") !== 0) throw 0;
          var o = JSON.parse(decodeURIComponent(escape(atob(t.slice(6))))), cnt = 0;
          Object.keys(o.issued || {}).forEach(function (nm) {
            var cur = {}; try { cur = JSON.parse(localStorage.getItem("fy_issued_" + nm) || "{}") || {}; } catch (e) {}
            var inc = o.issued[nm] || {};
            ["pass", "play"].forEach(function (k) { cur[k] = cur[k] || []; (inc[k] || []).forEach(function (c) { if (cur[k].indexOf(c) === -1) cur[k].push(c); }); });
            if ((inc.gift || []).length > (cur.gift || []).length) cur.gift = inc.gift; if ((inc.recv || []).length > (cur.recv || []).length) cur.recv = inc.recv;
            localStorage.setItem("fy_issued_" + nm, JSON.stringify(cur)); cnt++;
          });
          if (o.names && !localStorage.getItem("sensei_names")) localStorage.setItem("sensei_names", JSON.stringify(o.names));
          out.textContent = "もどしました（" + cnt + "人ぶん）。";
        } catch (e) { out.textContent = "バックアップの 文が ちがうようです。"; }
      });
    } catch (e) {}
  }
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
    var m = location.search.match(/[?&](restore|check|gift)=([^&]+)/);
    if (!m) return;
    var val; try { val = decodeURIComponent(m[2]); } catch (e) { return; }
    try { history.replaceState(null, "", location.pathname); } catch (e2) {}
    try {
      if (m[1] === "gift") {
        var g = window.fyGiftApply(val);
        show(g.ok ? "🎁 ポイント プレゼント！" : "うけとれませんでした", esc(g.msg), g.ok);
        try { if (g.ok && typeof initProfiles === "function") initProfiles(); } catch (e4) {}
      } else if (m[1] === "restore") {
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


/* ===== 📩 あいことば（先生 → 生徒）：ひらがな5もじ。なまえ・なかみ・ひづけ から つくる。だしてから 7日間 つかえる ===== */
var FYAK = (function () {
  var H = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふほまみむめもやゆよらりるれろわ", SALT = "fuyomi-2026", DAYS = 7;
  function nm(x) { return String(x || "").normalize("NFKC").replace(/\s+/g, ""); }
  function norm(t) {
    t = String(t || "").normalize("NFKC").replace(/[\s　・、。,.\-_「」『』:：]/g, "");
    return t.replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); });   /* カタカナ → ひらがな */
  }
  function sign(payload) {
    var t = payload + "|" + SALT, h = 2166136261 >>> 0, g = 5381;
    for (var i = 0; i < t.length; i++) { var c = t.charCodeAt(i); h ^= c; h = Math.imul(h, 16777619) >>> 0; g = (Math.imul(g, 33) ^ c) >>> 0; }
    var v = (h ^ (g >>> 3)) >>> 0, o = "";
    for (var k = 0; k < 5; k++) { o += H.charAt(v % H.length); v = Math.floor(v / H.length) + (k === 2 ? (g % 9973) : 0); }
    return o;
  }
  function day(off) { var d = new Date(Date.now() - off * 86400000); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function until() { var d = new Date(Date.now() + DAYS * 86400000); return (d.getMonth() + 1) + "/" + d.getDate(); }
  return {
    DAYS: DAYS, norm: norm, day: day, until: until,
    isCode: function (t) { return /^[ぁ-ん]{5}$/.test(norm(t)); },
    songs: function (name, kind, list, d) { return sign("AK|" + kind + "|" + nm(name) + "|" + list.slice().sort().join(",") + "|" + d); },
    gift: function (name, pts, d) { return sign("AK|gift|" + nm(name) + "|" + pts + "|" + d); },
    /* まちがいが つづいたら 10ぷん ロック */
    locked: function (pid) { try { var b = JSON.parse(localStorage.getItem("fy_ak_bad_" + pid) || "{}"); return (b.n >= 5 && Date.now() - b.t < 600000) ? Math.ceil((600000 - (Date.now() - b.t)) / 60000) : 0; } catch (e) { return 0; } },
    bad: function (pid) { try { var b = JSON.parse(localStorage.getItem("fy_ak_bad_" + pid) || "{}"); if (!b.t || Date.now() - b.t > 600000) b = { n: 0 }; b.n = (b.n || 0) + 1; b.t = Date.now(); localStorage.setItem("fy_ak_bad_" + pid, JSON.stringify(b)); } catch (e) {} },
    good: function (pid) { try { localStorage.removeItem("fy_ak_bad_" + pid); } catch (e) {} },
    used: function (pid, code, d) { try { var u = JSON.parse(localStorage.getItem("fy_ak_used_" + pid) || "[]"); return u.indexOf(code + d) !== -1; } catch (e) { return false; } },
    use: function (pid, code, d) { try { var u = JSON.parse(localStorage.getItem("fy_ak_used_" + pid) || "[]"); u.push(code + d); localStorage.setItem("fy_ak_used_" + pid, JSON.stringify(u.slice(-200))); } catch (e) {} }
  };
})();
window.FYAK = FYAK;
/* ===== 🎁 ポイント プレゼント（先生 → 生徒）：なまえごと・1かいだけ つかえる コード ===== */
(function () {
  var SALT = "fuyomi-2026", CC = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function sg(payload) { var t = payload + "|" + SALT, h = 2166136261 >>> 0; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } var o = ""; for (var k = 0; k < 6; k++) { o += CC.charAt(h % CC.length); h = Math.floor(h / CC.length); } return o; }
  function nm(x) { return String(x || "").trim().normalize("NFKC"); }
  /* コードの かたち：  ポイント.ばんごう.しるし  （しるしは なまえ・ポイント・ばんごう から つくる） */
  window.fyGiftCode = function (name, pts) { var id = Date.now().toString(36).toUpperCase(); return pts + "." + id + "." + sg("gift|" + nm(name) + "|" + pts + "|" + id); };
  /* 📩 あいことば（ひらがな5もじ）の ポイント プレゼント。もどり：{ok,msg}。ちがう ときは null（ほかの しゅるいかも） */
  window.fyAkGift = function (raw) {
    var code = FYAK.norm(raw), idx = activeProfileIndex, name = profiles[idx];
    if (!name) return { ok: false, msg: "さきに なまえを えらんでね。" };
    for (var off = -1; off <= FYAK.DAYS + 21; off++) {
      var d = FYAK.day(off);
      for (var p = 1; p <= 300; p++) {
        if (FYAK.gift(name, p, d) !== code) continue;
        if (off > FYAK.DAYS) return { ok: false, msg: "きげんが きれたよ。\nせんせいに もういちど おねがいしてね。" };
        if (FYAK.used(idx, code, d)) return { ok: false, msg: "この あいことばは、もう つかったよ。" };
        FYAK.use(idx, code, d); FYAK.good(idx);
        Storage.set("fy_tp_" + idx, Storage.getNumber("fy_tp_" + idx, 0) + p);
        if (window.fyTpEarnLog) window.fyTpEarnLog(idx, p, "📩 せんせいからの あいことば");
        return { ok: true, msg: "🎁 " + name + " さんに\n+" + p + " ポイント！\n\nいまの ポイント：" + Storage.getNumber("fy_tp_" + idx, 0) + " p" };
      }
    }
    return null;
  };
  window.fyGiftApply = function (code) {
    var m = String(code || "").trim().match(/^(\d{1,3})\.([0-9A-Z]+)\.([A-Z0-9]{6})$/);
    if (!m) return { ok: false, msg: "コードが ちがうよ。" };
    var idx = activeProfileIndex, name = nm(profiles[idx]), pts = parseInt(m[1], 10);
    if (!name) return { ok: false, msg: "さきに なまえを えらんでね。" };
    if (sg("gift|" + name + "|" + pts + "|" + m[2]) !== m[3]) {
      /* この たんまつの ほかの きょうだい あてかも しれない */
      var hit = -1; profiles.forEach(function (p, i) { if (p && sg("gift|" + nm(p) + "|" + pts + "|" + m[2]) === m[3]) hit = i; });
      if (hit < 0) return { ok: false, msg: "この プレゼントは、" + profiles[idx] + " さんの ものでは ないよ。" };
      idx = hit; name = nm(profiles[idx]);
    }
    var used = Storage.get("fy_gift_used_" + idx, []) || [];
    if (used.indexOf(m[2]) !== -1) return { ok: false, msg: "この プレゼントは、もう うけとったよ。" };
    used.push(m[2]); Storage.set("fy_gift_used_" + idx, used);
    Storage.set("fy_tp_" + idx, Storage.getNumber("fy_tp_" + idx, 0) + pts);
    if (window.fyTpEarnLog) window.fyTpEarnLog(idx, pts, "🎁 せんせいからの プレゼントコード");
    return { ok: true, msg: profiles[idx] + " さんに\n+" + pts + " ポイント！\n\nいまの ポイント：" + Storage.getNumber("fy_tp_" + idx, 0) + " p" };
  };
})();

/* ===================================================================================
   🎨 あたらしい みため（1115a）：トップ画面 と「おんぷカード」（ト音・ヘ音・全カードを 1つに）
   ・もとの ボタンは 画面から かくすだけで、うごきは ぜんぶ もとの ボタンに まかせる（きろく・ポイントは かわらない）
   ・先生ページ →「⚙ そのほか」の スイッチで、もとの みために もどせる（localStorage "fy_newlook" = "off"）
   =================================================================================== */
(function () {
  function on() { try { return localStorage.getItem("fy_newlook") !== "off"; } catch (e) { return true; } }
  window.fyNewLookOn = on;
  window.fySheet = function (b) { sheet(b); }; window.fySheetClose = function () { closeSheet(); };
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var css = document.createElement("style");
  css.textContent =
    "#selectScreen.fyNL{padding:0 !important;background:#eaf6ff;background-image:radial-gradient(#cfe8fb 2.2px,transparent 2.6px);background-size:26px 26px;border-radius:0;min-height:100vh;min-height:100dvh;position:relative;overflow:hidden}" +
    "#selectScreen.fyNL > *:not(#fyTop):not(#fyVerBar){display:none !important}" +
    "#fyTop{display:flex;flex-direction:column;min-height:100vh;min-height:100dvh;color:#5a4636;position:relative}" +
    "#fyTop .sky{flex:none;height:140px;background:linear-gradient(180deg,#bfe9ff,#e4f6ff);position:relative;border-radius:0 0 50% 50%/0 0 26px 26px;overflow:hidden}" +
    "#fyTop .appTitle{position:absolute;left:8px;top:5px;z-index:2;font-size:11px;font-weight:900;color:#3a7a9a;background:rgba(255,255,255,.8);border-radius:10px;padding:2px 8px;font-family:inherit;}" +
    "#fyTop .cl{position:absolute;background:#fff;border-radius:40px;height:22px}#fyTop .cl::before{content:'';position:absolute;background:#fff;border-radius:50%;width:26px;height:26px;left:12px;top:-13px}" +
    "#fyTop .pal{position:absolute;left:18px;top:42px;width:58px;height:58px;border-radius:50%;background:#ffd45c;box-shadow:inset -5px -6px 0 #ffc02e,0 4px 0 rgba(0,0,0,.08)}" +
    "#fyTop .pal::before{content:'';position:absolute;right:3px;top:-22px;width:8px;height:50px;background:#ffc02e;border-radius:6px}" +
    "#fyTop .pal::after{content:'';position:absolute;right:-15px;top:-24px;width:24px;height:16px;background:#ffc02e;border-radius:4px 14px 14px 14px;transform:rotate(18deg)}" +
    "#fyTop .pal i{position:absolute;top:21px;width:7px;height:10px;background:#5a4636;border-radius:50%}#fyTop .pal i.a{left:15px}#fyTop .pal i.b{left:33px}" +
    "#fyTop .pal u{position:absolute;left:21px;top:34px;width:15px;height:8px;border:3px solid #5a4636;border-top:none;border-radius:0 0 12px 12px}" +
    "#fyTop .hello{position:absolute;left:92px;top:44px;max-width:190px;background:#fff;border:none;border-radius:20px;padding:7px 14px 8px;font-weight:900;font-size:20px;color:#5a4636;box-shadow:0 4px 0 rgba(90,70,54,.10);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:inherit}" +
    "#fyTop .hello small{font-size:12px}" +
    "#fyTop .wk{position:absolute;left:94px;top:92px;font-size:12px;font-weight:800;background:#e3f3dc;border:2px solid #86c57f;border-radius:14px;padding:3px 10px;color:#2e7d32;font-family:inherit;touch-action:manipulation}" +
    "#fyTop .pt{position:absolute;right:14px;top:58px;z-index:3;background:#ff8fab;color:#fff;border-radius:50%;width:64px;height:64px;text-align:center;font-weight:900;border:4px solid #fff;box-shadow:0 5px 0 rgba(160,60,90,.35);transform:rotate(8deg);font-family:inherit;padding:0;touch-action:manipulation}" +
    "@keyframes fyNLp{0%{box-shadow:0 5px 0 rgba(160,60,90,.35),0 0 0 0 rgba(255,143,171,.9)}100%{box-shadow:0 5px 0 rgba(160,60,90,.35),0 0 0 14px rgba(255,143,171,0)}}#fyTop .pt.can{animation:none}" +
    "#fyTop .pt b{font-size:21px;display:block;line-height:1;margin-top:11px}#fyTop .pt span{font-size:9px}" +
    "#fyTop .hk{flex:none;margin:6px 14px 0;background:#fff;border-radius:22px;padding:6px 12px 7px;border:3px dashed #a9d8f5;display:flex;justify-content:space-between;cursor:pointer}" +
    "#fyTop .hk div{width:38px;text-align:center;font-size:11px;font-weight:900;color:#9bb4c7}" +
    "#fyTop .hk i{display:block;width:38px;height:38px;border-radius:50%;background:#eef6fc;margin-top:2px;font-style:normal;font-size:24px;line-height:38px}" +
    "#fyTop .hk .t{color:#ff7043}#fyTop .hk .t i{background:#fff;box-shadow:inset 0 0 0 3px #ffab91;font-size:10px;font-weight:900;box-shadow:inset 0 0 0 2px #ffccbc}" +
    "#fyTop .road{flex:1 1 auto;display:flex;flex-direction:column;gap:9px;margin:9px 14px 0;min-height:0}" +
    "#fyTop .st{flex:1 1 0;min-height:50px;max-height:96px;display:flex;align-items:center;gap:14px;border-radius:26px;padding:0 16px;color:#fff;font-weight:900;font-size:20px;position:relative;border:4px solid #fff;box-shadow:0 6px 0 rgba(90,70,54,.14);text-align:left;font-family:inherit;touch-action:manipulation}" +
    "#fyTop .st .ic{width:46px;height:46px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;flex:none}" +
    "#fyTop .st small{display:block;font-size:12px;margin-top:2px;font-weight:800}" +
    "#fyTop .s1{background:#8ed99a}#fyTop .s2{background:#7cc4ff}#fyTop .s3{background:#b79be8}#fyTop .s4{background:#ffb300}" +
    "#fyTop .lk{background:#e6dff0;color:#b0a3c8}#fyTop .lk .ic{opacity:.6}#fyTop .st .r{margin-left:auto;font-size:46px}" +
    "@keyframes fyNLh{0%{box-shadow:0 0 0 6px #ffb300,0 0 0 6px rgba(255,179,0,.95);transform:scale(1)}50%{transform:scale(1.025)}100%{box-shadow:0 0 0 6px #ffb300,0 0 0 26px rgba(255,179,0,0);transform:scale(1)}}" +
    "#fyTop .here{animation:fyNLh 1.1s ease-out infinite;position:relative;z-index:2}" +
    "#fyTop .ow{flex:none;margin:9px 14px 0;height:44px;border-radius:22px;border:3px solid #fff;background:#5c6bc0;color:#fff;font-size:17px;font-weight:900;font-family:inherit;box-shadow:0 4px 0 rgba(40,50,120,.3);position:relative;touch-action:manipulation}" +
    "@keyframes fyNLo{0%{box-shadow:0 4px 0 rgba(40,50,120,.3),0 0 0 0 rgba(92,107,192,.9)}100%{box-shadow:0 4px 0 rgba(40,50,120,.3),0 0 0 14px rgba(92,107,192,0)}}#fyTop .ow.go{animation:fyNLo 1.3s ease-out infinite}" +
    "#fyTop .hk .p i{opacity:.4}" +
    "@keyframes fyOwd{0%,100%{transform:scale(1);filter:brightness(1)}50%{transform:scale(1.35);filter:brightness(1.25)}}#fyTop .ow .owd{font-size:17px;padding:3px 9px;animation:fyOwd .8s ease-in-out infinite}" +
    "@keyframes fyPon{0%{transform:scale(3.2) rotate(-18deg);opacity:0}55%{transform:scale(.85) rotate(-10deg);opacity:1}100%{transform:scale(1) rotate(-10deg);opacity:1}}" +
    "#fyTop .bar{flex:none;display:flex;justify-content:space-around;padding:8px 10px 4px}" +
    "#fyTop .bar button{width:68px;text-align:center;font-size:11px;font-weight:900;color:#3b7fb8;position:relative;background:none;border:none;font-family:inherit;touch-action:manipulation}" +
    "#fyTop .bar b{display:flex;align-items:center;justify-content:center;width:50px;height:50px;margin:0 auto 2px;border-radius:50%;font-size:24px;border:4px solid #fff;box-shadow:0 4px 0 rgba(0,0,0,.12)}" +
    "#fyTop .dot{position:absolute;top:-3px;right:6px;background:#f44336;color:#fff;border:2px solid #fff;border-radius:12px;font-size:11px;padding:0 5px}" +
    "#fyTop .gr{flex:none;height:34px;position:relative;overflow:hidden}#fyTop .gr::before{content:'';position:absolute;left:-30px;right:-30px;top:6px;height:110px;background:#c9ecb8;border-radius:50%}" +
    "#fyTop .cr{position:absolute;left:0;right:0;bottom:2px;text-align:center;font-size:9px;color:#7da06f}" +
    /* おんぷカード（レベルの がめん） */
    "#levelScreen.fyNL #levelList .level-button{display:none !important}" +
    "#fyGrid{display:flex;gap:10px;margin:4px 0 10px}" +
    "#fyGrid .c{flex:1;display:flex;flex-direction:column;gap:10px}" +
    "#fyGrid .h{text-align:center;font-weight:900;font-size:14px;height:44px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;color:#5b4636}" +
    "#fyGrid .h span{font-size:24px;line-height:1.1}" +
    "#fyGrid button{height:66px;border-radius:22px;background:#fff;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:900;font-size:30px;color:#3b7fb8;box-shadow:0 4px 0 rgba(90,70,54,.10);position:relative;border:4px solid #fff;font-family:inherit;touch-action:manipulation;padding:0}" +
    "#fyGrid button em{font-style:normal;font-size:20px}" +
    "#fyGrid .dn{background:#e9f8e8;color:#2e7d32}" +
    "#fyGrid .lk{background:#efe9df;color:#c5b8a4;box-shadow:none;border-color:#efe9df}" +
    "#fyGrid .he{box-shadow:0 0 0 4px #ffb300,0 5px 0 rgba(90,70,54,.12)}" +
    "#fyGrid .gd{box-shadow:0 0 0 4px #ffc400,0 0 14px 4px rgba(255,196,0,.7)}" +
    "#fyGrid .he small,#fyGrid .gd small{position:absolute;right:-4px;top:-13px;background:#ffb300;color:#fff;font-size:10px;padding:2px 7px;border-radius:10px;border:2px solid #fff;white-space:nowrap}" +
    /* シート */
    "#fySheet{position:fixed;left:0;top:0;right:0;bottom:0;z-index:9990;background:rgba(60,40,20,.45);display:flex;align-items:flex-end;justify-content:center}" +
    "#fySheet .in{background:#fffaf0;border-radius:22px 22px 0 0;padding:16px 16px 22px;width:100%;max-width:480px;max-height:86vh;overflow:auto;text-align:center}" +
    "#fySheet .bt{display:block;width:100%;margin:8px 0 0;padding:14px;font-size:17px;font-weight:900;border:none;border-radius:16px;background:#fff;color:#5a4636;box-shadow:0 3px 0 rgba(90,70,54,.12);font-family:inherit}" +
    "#fySheet .cls{background:#ff9800;color:#fff;margin-top:14px}";
  document.head.appendChild(css);

  function sheet(build) {
    var o = $("fySheet"); if (o) closeSheet();
    var d = document.createElement("div"); d.id = "fySheet";
    d.innerHTML = '<div class="in"></div>';
    var inn = d.firstChild; build(inn);
    var c = document.createElement("button"); c.className = "bt cls"; c.textContent = "◀ もどる"; c.style.cssText = "position:sticky;bottom:-22px;"; c.addEventListener("click", closeSheet); inn.appendChild(c);
    d.addEventListener("click", function (e) { if (e.target === d) closeSheet(); });
    document.body.appendChild(d);
  }
  function closeSheet() {
    var d = $("fySheet"); if (!d) return;
    /* ハンコの はこを もとの ばしょへ もどす */
    try { var hb = $("fyHankoTop"), home = $("stampMiniBox"); if (hb && d.contains(hb) && home && home.parentNode) home.parentNode.insertBefore(hb, home); } catch (e) {}
    d.remove(); schedule();
  }
  function clickOld(sel) { try { var e = typeof sel === "string" ? document.querySelector(sel) : sel; if (e) e.click(); } catch (e2) {} }

  function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  /* 「きょうは おわり」で たしかめた ハンコの ひづけ。はじめは、いま ある ハンコを ぜんぶ たしかめずみに する（きょうの ぶん だけ のこす） */
  function okList(idx) {
    var st = Storage.get("fy_hanko_" + idx, []); if (!Array.isArray(st)) st = [];
    var ok = Storage.get("fy_hanko_ok_" + idx, null);
    if (!Array.isArray(ok)) { var t = ymd(new Date()); ok = st.filter(function (d) { return d !== t; }); Storage.set("fy_hanko_ok_" + idx, ok); }
    return { st: st, ok: ok, pend: st.filter(function (d) { return ok.indexOf(d) === -1; }) };
  }
  function hankoCells() {
    var out = [], lab = ["月", "火", "水", "木", "金", "土", "日"];
    var okl = null; try { okl = okList(activeProfileIndex); } catch (e) {}
    var mon = new Date(); mon.setHours(12, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    try {
      var box = $("fyHankoTop"), row = box ? box.children[1] : null;
      for (var i = 0; i < 7; i++) {
        var c = row ? row.children[i] : null, k = "off";
        if (c) { if (c.querySelector("#fyTmpStamp")) k = "tmp"; else if (c.textContent.indexOf("⭐") !== -1) k = "on"; }
        if (k === "on" && okl) { var dd = new Date(mon.getTime()); dd.setDate(mon.getDate() + i); if (okl.pend.indexOf(ymd(dd)) !== -1) k = "pend"; }
        out.push([lab[i], k]);
      }
    } catch (e) { lab.forEach(function (l) { out.push([l, "off"]); }); }
    return out;
  }

  var timer = null, busy = false, lastHtml = "", quietUntil = 0;
  function schedule() { if (timer) clearTimeout(timer); timer = setTimeout(render, 120); }
  /* はじめから あたらしい みためで だす（ふるい がめんが ちらっと みえない ように） */
  try { if (on() && $("selectScreen")) $("selectScreen").classList.add("fyNL"); } catch (e) {}
  function render() {
    var s = $("selectScreen"); if (!s) return;
    if (!on()) { if (s.classList.contains("fyNL")) s.classList.remove("fyNL"); var o = $("fyTop"); if (o) o.remove(); return; }
    busy = true;
    try {
      if (!s.classList.contains("fyNL")) s.classList.add("fyNL");
      var t = $("fyTop"); if (!t) { t = document.createElement("div"); t.id = "fyTop"; s.insertBefore(t, s.firstChild); }
      var idx = activeProfileIndex, name = (profiles && profiles[idx]) || "", many = 0;
      try { for (var mi2 = 0; mi2 < 3; mi2++) { if (isRegistered(mi2)) many++; } } catch (e) {}
      var pts = Storage.getNumber("fy_tp_" + idx, 0);
      var wk = false; try { wk = fyWakabaOn(); } catch (e) {}
      var doBest = null; try { doBest = getDoTestBest(idx); } catch (e) {}
      var dbg = Storage.get("onpu_debug_unlocked_" + idx);
      var doOk = !!(dbg || (doBest && doBest.accuracy >= 90));
      function top(c) { var n = 0; for (var l = 1; l <= 5; l++) { if (hasLevelCleared(idx, c, l)) n = l; else break; } return n; }
      var tr = top("treble"), ba = top("bass");
      var ch = $("fyChunkBtn"), chLock = !ch || ch.classList.contains("locked"), chGlow = ch && /fyPulse|fyGold/.test(ch.className);
      var ev = $("fyEvBtn"), evOn = !!(ev && ev.style.display !== "none");
      var uns = 0; try { uns = window.fyUnsentCount ? window.fyUnsentCount(idx) : 0; } catch (e) {}
      var exUns = 0; try { exUns = window.fyExUnsent ? window.fyExUnsent(idx) : 0; } catch (e) {}
      var unsDays = 0; try { unsDays = window.fyUnsentDays ? window.fyUnsentDays(idx) : 0; } catch (e) {}
      var here = (!doOk ? 1 : (chGlow ? 3 : 2));   /* 送りわすれは 📨の チカチカで しらせる。金の ひかりは「つぎに やる ところ」 */
   /* 📨が あるときは、そちらを さきに しらせる */
      var hk = hankoCells().map(function (c) { return '<div class="' + (c[1] === "tmp" ? "t" : c[1] === "pend" ? "p" : "") + '">' + c[0] + '<i>' + (c[1] === "on" || c[1] === "pend" ? "⭐" : c[1] === "tmp" ? "きょう" : "") + '</i></div>'; }).join("");
      var pendN = 0; try { pendN = okList(idx).pend.length; } catch (e) {}
      /* 版の ばんごう（テストの あいだ だけ。もとの「版」の ひょうじを そのまま うつす） */
      var verTx = ""; try { var vb = $("fyVerBar"); if (vb && vb.style.display !== "none") verTx = vb.textContent || ""; } catch (e) {}
      var html =
        (verTx ? '<div style="position:absolute;left:0;right:0;top:1px;z-index:4;text-align:center;font-size:10px;font-weight:800;color:' + (/そろって/.test(verTx) ? '#d32f2f;background:#fff' : '#5b88a8') + ';">' + esc(verTx) + '</div>' : '') +
        '<div class="sky"><div class="cl" style="width:60px;left:250px;top:12px;"></div><div class="cl" style="width:50px;left:-10px;top:92px;transform:scale(.7)"></div>' +
          '<div class="appTitle">🎹 ふよみチャレンジ</div>' +
          '<div class="pal"><i class="a"></i><i class="b"></i><u></u></div>' +
          '<button class="hello" id="fyNLName">' + esc(name) + '<small> さん' + (many > 1 ? " ▼" : "") + '</small></button>' +
          (wk ? '<button class="wk" id="fyNLWk">🌱 わかば</button>' : '') + '</div>' +
        '<button class="pt' + (pts >= 10 ? " can" : "") + '" id="fyNLPt"><b>' + pts + '</b><span>ポイント</span>' + (exUns ? '<span class="dot" style="top:-8px;right:-6px;">📨</span>' : '') + '</button>' +
        '<div class="hk" id="fyNLHk">' + hk + '</div>' +
        '<div class="road">' +
          '<button class="st s1' + (here === 1 ? " here" : "") + '" id="fyNLDo"><div class="ic">🎵</div><div>6つの「ド」</div>' + (doOk ? '<span class="r">💮</span>' : '') + '</button>' +
          '<button class="st ' + (doOk ? "s2" : "lk") + (here === 2 ? " here" : "") + '" id="fyNLCard"><div class="ic">🎼</div><div>おんぷカード' + (doOk ? '<small>ト音 ' + (tr >= 5 ? "💮" : tr + 1) + ' ・ ヘ音 ' + (ba >= 5 ? "💮" : ba + 1) + '</small>' : '') + '</div>' + (doOk ? '' : '<span class="r">🔒</span>') + '</button>' +
          '<button class="st ' + (chLock ? "lk" : "s3") + (here === 3 ? " here" : "") + '" id="fyNLLeg"><div class="ic">👑</div><div>レジェンドへの みち</div>' + (chLock ? '<span class="r">🔒</span>' : '') + '</button>' +
          (evOn ? '<button class="st ' + (window.fyEvBtnDim && window.fyEvBtnDim() ? "lk" : "s4") + '" id="fyNLEv"><div class="ic">🏆</div><div>' + esc((window.fyEvBtnLabel ? window.fyEvBtnLabel() : "🏆 イベントの きろく").replace(/^🏆\s*/, "")) + '</div></button>' : '') +
        '</div>' +
        '<button class="ow" id="fyNLOw">🌙 きょうは おわり' + ((uns || exUns) ? '<span class="dot owd" style="top:-12px;right:6px;">📨' + (unsDays > 0 ? unsDays : '') + '</span>' : '') + '</button>' +
        '<div class="bar">' +
          '<button id="fyNLRec"><b style="background:#ffe08a' + (uns ? ';animation:fyNLp 1.3s ease-out infinite' : '') + '">📜</b>きろく' + (uns ? '<span class="dot">📨</span>' : '') + '</button>' +
          '<button id="fyNLBook"><b style="background:#d7c2ff">🎴</b>カード</button>' +
          '<button id="fyNLAk"><b style="background:#ffd3b0">📩</b>あいことば</button>' +
          '<button id="fyNLAd"><b style="background:#e3e3e3">⚙️</b>おとな</button>' +
        '</div><div class="gr"><div class="cr">音声：VOICEVOX:ずんだもん</div></div>';
      /* なかみが おなじなら、つくりなおさない（つくりなおしを くりかえすと、ボタンが おせなく なる） */
      if (html === lastHtml && t.firstChild) { busy = false; return; }
      lastHtml = html; quietUntil = Date.now() + 200;
      t.innerHTML = html;
      $("fyNLDo").addEventListener("click", function () { clickOld("#selectScreen > .select-button.special"); });
      $("fyNLCard").addEventListener("click", function () {
        var last = "treble"; try { last = localStorage.getItem("fy_nl_lastclef_" + idx) || "treble"; if (last === "all" || last === "bass") { if (!hasLevelCleared(idx, "treble", 1) && !dbg) last = "treble"; } } catch (e) {}
        selectClef(doOk ? last : "treble"); if (selectedClef !== last && doOk) selectClef("treble");
      });
      $("fyNLLeg").addEventListener("click", function () { clickOld("#fyChunkBtn"); });
      if ($("fyNLEv")) $("fyNLEv").addEventListener("click", function () { clickOld("#fyEvBtn"); });
      $("fyNLRec").addEventListener("click", function () { try { window.showCardCodes(); } catch (e) {} });
      $("fyNLBook").addEventListener("click", function () { try { window.showCardBook(); } catch (e) {} });
      $("fyNLPt").addEventListener("click", function () { clickOld("#fyExBtn"); });
      $("fyNLOw").addEventListener("click", function () {
        var o = okList(idx), pend = o.pend.slice(), today = ymd(new Date());
        var lines = []; try { lines = (window.fyUnsentLines(idx) || []).concat(window.fyExUnsentLines(idx) || []); } catch (e) {}
        var demo = !!(window.fyDemoOn && window.fyDemoOn());
        var repDue = false;
        try {
          var rl0 = parseInt(localStorage.getItem("fy_rep_last_" + idx), 10) || 0;
          if (o.st.length && Date.now() - rl0 >= 7 * 86400000) {
            var lim7 = ymd(new Date(Date.now() - 6 * 86400000)), n7 = o.st.filter(function (d) { return d >= lim7; }).length;
            lines.push("📋 しゅうの きろく：れんしゅう " + n7 + "日（この 7日間）／ポイント " + (parseInt(Storage.get("fy_tp_" + idx, 0), 10) || 0) + "p");
            repDue = true;
          }
        } catch (eR) {}
        var evDue = false;
        try { if (o.st.indexOf(today) !== -1) { var evl = window.fyEvDailyLine ? window.fyEvDailyLine(idx) : ""; if (evl) { lines.push(evl); evDue = true; } } } catch (eE) {}
        var unsDays2 = 0; try { unsDays2 = window.fyUnsentDays ? window.fyUnsentDays(idx) : 0; } catch (eD2) {}
        /* 2026-11-24：ハンコの お知らせは 結果画面の「ハンコ ゲット」の 1回だけにする（先生の 指示）。
           ここでは「きょうの ぶんの かくにん」の 記録だけ しずかに すませ、「ハンコ ポン」の 演出・音は 出さない。 */
        if (pend.length) { Storage.set("fy_hanko_ok_" + idx, o.ok.concat(pend).slice(-90)); }
        sheet(function (inn) {
          var h = "";
          if (pend.length) {
            h += '<div style="font-size:44px;">⭐</div><div style="font-size:17px;font-weight:900;margin:4px 0;">きょうも よく がんばったね！</div>' +
                 (pend.indexOf(today) === -1 || pend.length > 1 ? '<div style="font-size:13px;color:#806c5a;">このまえの ぶんも かくにんしたよ</div>' : '');
          } else if (o.st.indexOf(today) !== -1) {
            h += '<div style="font-size:44px;">⭐</div><div style="font-size:17px;font-weight:900;margin:4px 0;">きょうの ハンコは、もう おしたよ</div>';
          } else {
            h += '<div style="font-size:44px;">🎵</div><div style="font-size:17px;font-weight:900;margin:4px 0;line-height:1.6;">きょうは まだ<br>トレーニングを していないよ</div><div style="font-size:13px;color:#806c5a;">トレーニングを すると、ハンコが もらえるよ</div>';
          }
          if (lines.length) {
            var dispLines = demo ? lines.map(function (l) { return l.replace(/コード[：:]\s*[A-Za-z0-9\-]+/g, "コード：みほん"); }) : lines;
            var text = (demo ? "【きょうしつ見本】" : "") + "【ふよみ】" + name + " さん\n" + dispLines.join("\n");
            h += '<div style="margin:14px 0 4px;font-size:15px;font-weight:900;color:#2e7d32;">📨 せんせいに おくる ものが あるよ' + (unsDays2 > 0 ? '（' + unsDays2 + '日分）' : '') + '</div>' +
                 '<div style="font-size:12.5px;font-weight:800;color:#c62828;margin-bottom:6px;">おくらないと、せんせいに とどかないよ</div>' +
                 '<div id="fyOwSend">' + (function () { window.fyNoBackNote = 1; var hh = window.fyLineBtn(text, "📨 せんせいに おくる", null, true); window.fyNoBackNote = 0; return hh; })() + '</div>' +
                 '<div style="font-size:12px;color:#806c5a;line-height:1.6;margin-top:4px;">おすと LINEが ひらくよ。<b>ひこうきの マーク</b>を おして おくってね</div>';
          } else if (pend.length || o.st.indexOf(today) !== -1) {
            h += '<div style="font-size:18px;font-weight:900;margin-top:12px;">きょうも がんばったね！<br>また あしたね 👋</div>';
          }
          if (demo) h += '<div style="font-size:12px;color:#78909c;background:#eceff1;border-radius:10px;padding:8px;margin-top:10px;">🏫 きょうしつ用（見本）：コードは「みほん」に なって おくられます</div>';
          inn.innerHTML = h;
          var sd = inn.querySelector("#fyOwSend");
          if (sd) sd.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a")) { try { window.fyMarkAchSent(idx); window.fyMarkExSent(idx); if (repDue) localStorage.setItem("fy_rep_last_" + idx, String(Date.now())); if (evDue) window.fyEvDailySent(idx); } catch (e2) {} setTimeout(schedule, 500); } });
        });
        schedule();
      });
      $("fyNLAk").addEventListener("click", function () {
        /* 2026-11-21：合言葉を いれる ばしょは、これ 1つだけ。
           とうろく（1人目・2人目・3人目）も、せんせいからの プレゼントコードも、
           ぜんぶ この ボタン → 同じ がめんで うける。がめんの 中身（どちらの あいことばかの 判定）は
           tryCode（いちばん 上の 合言葉の しくみ）の 中で いっしょに やっている。 */
        try { if (window.fyGateAddPlayerCode) window.fyGateAddPlayerCode(); } catch (e) {}
      });
      /* 🌱 わかば：おすと たしざん → とけたら はずせる */
      if ($("fyNLWk")) $("fyNLWk").addEventListener("click", function () { try { fyParentGate(function () { fyWakabaSet(false); schedule(); }, "🌱 わかばマークを はずします"); } catch (e) { clickOld("#fyWakabaChip"); } });
      $("fyNLAd").addEventListener("click", function () {
        sheet(function (inn) {
          inn.innerHTML = '<div style="font-size:17px;font-weight:900;margin-bottom:4px;">⚙️ 大人の方へ</div>';
          function go(fn) { return function () { closeSheet(); try { toggleModal("managementModal", true); resetMgSection(); fn(); } catch (e) { clickOld([].filter.call(document.querySelectorAll("#selectScreen > .select-button.challenge"), function (b) { return b.textContent.indexOf("保護者") !== -1; })[0]); } }; }
          /* 「➕ プレイヤーを増やす」は、生徒が じぶんで 押すことも あるので、ここ（大人の方へ）からは なくしました。
             いまは トップ画面の「✏️ なまえを とうろく・かえる」と、「👤 だれが つかう？」の 中から すすめます。 */
          var items = [["👪 保護者ページ", go(function () { showParentAuth(); })],
           ["🎹 先生ページ", go(function () { showTeacherAuth(); })]];
          if (!wk) items.push(["🌱 わかばマークをつける（光と声の案内）", function () { closeSheet(); try { fyWakabaSet(true); } catch (e) {} schedule(); }]);
          items.forEach(function (x) { var b = document.createElement("button"); b.className = "bt"; b.textContent = x[0]; b.addEventListener("click", x[1]); inn.appendChild(b); });
          var cr = document.createElement("details"); cr.style.cssText = "margin-top:12px;font-size:12px;color:#806c5a;text-align:left;";
          cr.innerHTML = '<summary style="font-weight:800;padding:6px 2px;">クレジット</summary><div style="line-height:1.9;padding:2px 6px;">音声：VOICEVOX:ずんだもん<br>効果音：効果音ラボ</div>';
          inn.appendChild(cr);
        });
      });
      $("fyNLName").addEventListener("click", function () {
        sheet(function (inn) {
          inn.innerHTML = '<div style="font-size:17px;font-weight:900;margin-bottom:4px;">👤 だれが つかう？</div>';
          profiles.forEach(function (p, i) {
            /* 2026-11-21：まだ とうろく して いない 空き枠は、ここに 出さない。
               とうろく した 人数ぶんだけ、名前が ふえて いく ように する。 */
            if (!p || !isRegistered(i)) return;
            var b = document.createElement("button"); b.className = "bt"; b.textContent = (i === idx ? "✅ " : "") + p + " さん";
            if (i === idx) b.style.background = "#fff3cd";
            b.addEventListener("click", function () { closeSheet(); if (i === idx) return; try { var sel = $("profileSelect"); if (sel) { sel.value = String(i); confirmProfileSelect(); } } catch (e) {} schedule(); });
            inn.appendChild(b);
          });
          /* 2026-11-21：ここに あった「合言葉を いれて プレイヤーを ふやす」ボタンは けした。
             合言葉を いれる ばしょは、トップ画面の「📩あいことば」ボタン 1つだけに する ため。 */
        });
      });
      $("fyNLHk").addEventListener("click", function () {
        var hb = $("fyHankoTop"); if (!hb) return;
        sheet(function (inn) { inn.appendChild(hb); });   /* もとの ハンコの はこを、そのまま ここで みせる（「きょう」も ここで おせる） */
      });
    } catch (e) {
      /* はじめの 1かいめで しっぱい したときだけ、もとの みために もどす（とちゅうで もどすと がめんが ちらつく） */
      try { var o2 = $("fyTop"); if (!o2 || !o2.firstChild) { s.classList.remove("fyNL"); if (o2) o2.remove(); } } catch (e2) {}
    }
    busy = false;
  }

  /* ---- おんぷカード：レベルの がめんを 3れつに ---- */
  function cellState(idx, clef, lv) {
    var dbg = Storage.get("onpu_debug_unlocked_" + idx), doBest = null; try { doBest = getDoTestBest(idx); } catch (e) {}
    var sixOk = !!(dbg || (doBest && doBest.accuracy >= 90));
    var clefOk = sixOk;
    /* ヘ音記号は、ト音記号レベル1を 黒（色なし）で クリアしてから 開く */
    if (clef === "bass") clefOk = !!(dbg || (sixOk && hasLevelCleared(idx, "treble", 1)));
    if (clef === "all") clefOk = !!(dbg || (sixOk && hasLevelCleared(idx, "treble", 5) && hasLevelCleared(idx, "bass", 5)));
    var color = false; try { color = clef !== "all" && fyColorOn(idx, clef); } catch (e) {}
    var locked = !clefOk || (lv > 1 && !dbg && !hasLevelCleared(idx, clef, lv - 1)) || (lv > 1 && color);
    return { locked: locked, done: hasLevelCleared(idx, clef, lv), color: color && lv === 1, clefOk: clefOk };
  }
  function grid() {
    var ls = $("levelScreen"), list = $("levelList"); if (!ls || !list) return;
    var old = $("fyGrid"); if (old) old.remove(); try { var oh0 = $("fyGridHint"); if (oh0) oh0.remove(); } catch (e0) {}
    if (!on()) { ls.classList.remove("fyNL"); return; }
    ls.classList.add("fyNL");
    var ti = $("levelTitle"); if (ti) ti.textContent = "おんぷカード";
    var idx = activeProfileIndex;
    try { localStorage.setItem("fy_nl_lastclef_" + idx, selectedClef); } catch (e) {}
    var g = document.createElement("div"); g.id = "fyGrid";
    var cols = [["treble", "🎼", "ト音記号"], ["bass", "🎼", "ヘ音記号"], ["all", "🃏", "全カード"]], html = "";
    /* 「いまここ」は 1つだけに する（ト音記号とヘ音記号が どちらも 開いているときは、進みが 遅いほうを 光らせる。同じなら ト音記号） */
    var heLv = {};
    ["treble", "bass"].forEach(function (ck) {
      var hl = 0;
      for (var l = 1; l <= 5; l++) { var st0 = cellState(idx, ck, l); if (st0.locked) break; if (!st0.done) { hl = l; break; } }
      heLv[ck] = hl;
    });
    var glowClef = null;
    if (heLv.treble && heLv.bass) glowClef = heLv.treble <= heLv.bass ? "treble" : "bass";
    else if (heLv.treble) glowClef = "treble";
    else if (heLv.bass) glowClef = "bass";
    cols.forEach(function (c) {
      var hereLv = c[0] === "all" ? 0 : heLv[c[0]];
      if (c[0] === "all") { for (var l2 = 1; l2 <= 5; l2++) { var st2 = cellState(idx, c[0], l2); if (st2.locked) break; if (!st2.done) { hereLv = l2; break; } } }
      var showHere = c[0] === "all" ? true : (c[0] === glowClef);
      var gold = false; try { gold = c[0] === "all" && fyMeijinGlowNow(idx) && !cellState(idx, "all", 5).locked; } catch (e) {}
      html += '<div class="c"><div class="h"><span>' + c[1] + '</span>' + c[2] + '</div>';
      for (var lv = 1; lv <= 5; lv++) {
        var st = cellState(idx, c[0], lv), cls = st.locked ? "lk" : (st.done ? "dn" : "");
        var mark = st.locked ? "🔒" : (st.done ? "💮" : (st.color ? "🎨" : ""));
        var tag = "";
        if (gold && lv === 5) { cls += " gd"; tag = "<small>🏅 名人</small>"; }
        else if (showHere && lv === hereLv) { cls += " he"; tag = "<small>いまここ</small>"; }
        html += '<button class="' + cls + '" data-c="' + c[0] + '" data-l="' + lv + '">' + tag + lv + (mark ? '<em>' + mark + '</em>' : '') + '</button>';
      }
      html += '</div>';
    });
    g.innerHTML = html;
    list.parentNode.insertBefore(g, list);
    var lpT = 0, lpDone = false;
    function lpShow(b) {
      var c = b.getAttribute("data-c"), lv = +b.getAttribute("data-l");
      var set = (c === "treble" ? trebleCards : c === "bass" ? bassCards : allCards)[lv] || [], seen = {}, th = "";
      set.forEach(function (k) { if (seen[k.id]) return; seen[k.id] = 1; th += '<img src="' + k.img + '" alt="" style="width:23%;margin:1%;border-radius:8px;border:2px solid #eadcc8;background:#fff;box-sizing:border-box;">'; });
      sheet(function (inn) {
        inn.innerHTML = '<div style="font-size:18px;font-weight:900;margin-bottom:2px;">' + (c === "treble" ? "ト音記号" : c === "bass" ? "ヘ音記号" : "全カード") + '　レベル ' + lv + '</div>' +
          '<div style="font-size:13px;color:#806c5a;margin-bottom:8px;">この レベルに 出る 音（' + Object.keys(seen).length + ' まい）</div>' +
          '<div style="max-height:46vh;overflow:auto;-webkit-overflow-scrolling:touch;text-align:left;">' + th + '</div>';
      });
    }
    g.addEventListener("touchstart", function (e) { var b = e.target.closest ? e.target.closest("button[data-c]") : null; if (!b) return; lpDone = false; clearTimeout(lpT); lpT = setTimeout(function () { lpDone = true; lpShow(b); }, 600); }, { passive: true });
    ["touchend", "touchmove", "touchcancel"].forEach(function (ev) { g.addEventListener(ev, function () { clearTimeout(lpT); }, { passive: true }); });
    g.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    g.style.webkitTouchCallout = "none"; g.style.webkitUserSelect = "none"; g.style.userSelect = "none";
    var hint = document.createElement("div"); hint.id = "fyGridHint"; hint.textContent = "💡 数字を 長押しすると、音の範囲が 見られます"; hint.style.cssText = "font-size:11px;color:#a39686;text-align:center;margin:-4px 0 6px;";
    setTimeout(function () { try { var oh = $("fyGridHint"); if (oh && oh !== hint) oh.remove(); if (g.parentNode && !hint.parentNode) g.parentNode.insertBefore(hint, g.nextSibling); } catch (e) {} }, 0);
    g.addEventListener("click", function (e) {
      if (lpDone) { lpDone = false; e.preventDefault(); e.stopPropagation(); return; }
      var b = e.target.closest ? e.target.closest("button[data-c]") : null; if (!b) return;
      var c = b.getAttribute("data-c"), lv = +b.getAttribute("data-l");
      if (c !== selectedClef) { selectClef(c); if (selectedClef !== c) return; }   /* ひらいて いない ときは、もとの おしらせが でる */
      var bs = $("levelList").querySelectorAll(".level-button"); if (bs[lv - 1]) bs[lv - 1].click();
    });
  }

  function hook() {
    try {
      if (typeof createLevelButtons === "function" && !createLevelButtons.__nl) {
        var oc = createLevelButtons;
        window.createLevelButtons = function () { var r = oc.apply(this, arguments); try { grid(); } catch (e) {} return r; };
        window.createLevelButtons.__nl = true;
      }
    } catch (e) {}
    var s = $("selectScreen");
    if (s && !s.__nlObs) {
      s.__nlObs = true;
      try { new MutationObserver(function (ms) { if (busy || Date.now() < quietUntil) return; for (var i = 0; i < ms.length; i++) { var tg = ms[i].target; if (tg && tg.closest && tg.closest("#fyTop")) continue; schedule(); return; } }).observe(s, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style"], characterData: true }); } catch (e) {}
      try { new MutationObserver(function () { if (Date.now() < quietUntil) return; schedule(); }).observe(document.body, { childList: true }); } catch (e) {}
    }
    render();
  }
  document.addEventListener("click", function (e) {
    try {
      var b = e.target.closest ? e.target.closest("#gateCancel,#regCancelBtn") : null;
      if (b && window.__fyBackToAdult && Date.now() - window.__fyBackToAdult < 600000) { window.__fyBackToAdult = 0; setTimeout(function () { var a = $("fyNLAd"); if (a) a.click(); }, 350); }
    } catch (e2) {}
  });
  /* 先生ページ：タブは やめて「コード・管理」だけ／とじる ボタンは したに はりつける */
  try {
    var st2 = document.createElement("style");
    st2.textContent = "#tTab1,#tTab2{display:none !important}#managementModal .modal-box{max-height:92vh;overflow-y:auto}#managementModal .modal-btn.cancel{position:sticky;bottom:-2px;z-index:3;box-shadow:0 -10px 10px -4px rgba(255,255,255,.95)}";
    document.head.appendChild(st2);
    if (typeof showTeacherAuth === "function" && !showTeacherAuth.__nl) {
      var ota = showTeacherAuth;
      window.showTeacherAuth = function () { var r = ota.apply(this, arguments); [60, 400, 1200].forEach(function (ms) { setTimeout(function () { try { if (!$("teacherTab3") || $("teacherTab3").classList.contains("hidden")) switchTeacherTab(3); } catch (e) {} }, ms); }); return r; };
      window.showTeacherAuth.__nl = true;
    }
  } catch (e) {}
  window.fyNewLookRender = render;
  window.fyNewLookSet = function (v) { try { localStorage.setItem("fy_newlook", v ? "on" : "off"); } catch (e) {} location.reload(); };
  if (document.readyState === "complete") setTimeout(hook, 300); else window.addEventListener("load", function () { setTimeout(hook, 300); });
  setTimeout(hook, 1500);
  try { hook(); } catch (e) {}   /* まてずに すぐ だす（はいけいだけ さきに みえない ように） */
})();

/* 📨 「LINEで おくる」を おして、アプリに もどって きたとき：へんじを まってね の おしらせ */
(function () {
  var sentAt = 0;
  document.addEventListener("click", function (e) {
    try { var a = e.target.closest ? e.target.closest("a") : null; if (a && /line\.me\/R\/oaMessage/.test(a.href || "")) sentAt = Date.now(); } catch (e2) {}
  }, true);
  document.addEventListener("visibilitychange", function () {
    try {
      if (document.visibilityState !== "visible" || !sentAt || Date.now() - sentAt > 600000) return;
      sentAt = 0;
      var d = document.createElement("div");
      d.style.cssText = "position:fixed;left:12px;right:12px;bottom:18px;z-index:10020;background:#06c755;color:#fff;border-radius:16px;padding:12px 14px;font-size:15px;font-weight:900;line-height:1.6;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.3);";
      d.innerHTML = "📨 おくったら、せんせいの へんじを まってね。<br><span style='font-size:12px;font-weight:700;'>へんじが こなかったら、もういちど おくってね</span>";
      d.addEventListener("click", function () { d.remove(); });
      document.body.appendChild(d); setTimeout(function () { try { d.remove(); } catch (e) {} }, 7000);
    } catch (e3) {}
  });
})();

/* ===== テスト用（先生の チェック）：「⏩ あと1もんへ」と、ジャンプの つづき ===== */
(function () {
  /* 2026-11-22：ずっと残ってしまう localStorage ではなく、その場だけの sessionStorage に変更。
     これで、画面を閉じたり次に開いたりすると自動的に消えるので、設定を消し忘れても生徒に見えたままになることがない。 */
  function skipOn() { try { return sessionStorage.getItem("fy_test_skip") === "1"; } catch (e) { return false; } }
  window.fySkipSet = function (v) { try { if (v) sessionStorage.setItem("fy_test_skip", "1"); else sessionStorage.removeItem("fy_test_skip"); } catch (e) {} };
  var running = false;
  function runSkip() {
    if (running) return; running = true;
    var last = -1, stuck = 0;
    var tm = setInterval(function () {
      try {
        var scr = document.getElementById("cardScreen");
        if (!scr || scr.classList.contains("hidden") || !trainingMode || trainingCorrectCount >= targetValue - 1) { clearInterval(tm); running = false; return; }
        if (trainingCorrectCount === last) { if (++stuck > 12) { clearInterval(tm); running = false; return; } } else { stuck = 0; last = trainingCorrectCount; }
        pressKey(currentCards[currentIndex].key);
      } catch (e) { clearInterval(tm); running = false; }
    }, 420);
  }
  setInterval(function () {
    try {
      var b = document.getElementById("fySkipBtn"), scr = document.getElementById("cardScreen");
      var show = skipOn() && scr && !scr.classList.contains("hidden") && typeof trainingMode !== "undefined" && trainingMode && trainingCorrectCount < targetValue - 1 && !running;
      if (show && !b) {
        b = document.createElement("button"); b.id = "fySkipBtn"; b.textContent = "⏩ あと1もんへ（テスト）";
        b.style.cssText = "position:fixed;right:8px;top:8px;z-index:9500;border:none;border-radius:14px;padding:7px 10px;font-size:12px;font-weight:900;background:#37474f;color:#fff;font-family:inherit;opacity:.85;";
        b.addEventListener("click", function () { b.remove(); runSkip(); });
        document.body.appendChild(b);
      } else if (!show && b) b.remove();
    } catch (e) {}
  }, 700);
  /* ジャンプの あと（よみこみ なおした あと）に、見たい 画面を ひらく */
  setTimeout(function () {
    try {
      var j = sessionStorage.getItem("fy_jump_after"); if (!j) return; sessionStorage.removeItem("fy_jump_after");
      var p = j.split(":");
      if (p[0] === "train" || p[0] === "trainc") { selectedClef = p[1]; selectedLevel = parseInt(p[2], 10); try { Storage.set("fy_color_" + activeProfileIndex + "_" + p[1], p[0] === "trainc" ? "on" : "off"); } catch (e1) {} proceedToCards(); startTrainingDirect(true); }
      else if (p[0] === "grid") { var c = document.getElementById("fyNLCard"); if (c) c.click(); }
      else if (p[0] === "click") { var el = document.getElementById(p[1]); if (el) el.click(); }
      else if (p[0] === "guide") {
        /* iPhoneは、画面を おして からで ないと 声が 出ない。だから、ボタンを おして から はじめる */
        if (document.getElementById("fyGuideGo")) return;
        var gb = document.createElement("button"); gb.id = "fyGuideGo"; gb.textContent = "▶ あんないを はじめる（テスト）";
        gb.style.cssText = "position:fixed;left:50%;top:45%;transform:translate(-50%,-50%);z-index:10005;border:4px solid #fff;border-radius:20px;padding:16px 20px;font-size:18px;font-weight:900;background:#ff9800;color:#fff;font-family:inherit;box-shadow:0 6px 18px rgba(0,0,0,.35);";
        gb.addEventListener("click", function () { gb.remove(); showGuide(); });
        document.body.appendChild(gb);
      }
      else if (p[0] === "teacher") { var ad = document.getElementById("fyNLAd"); if (ad) ad.click(); }
    } catch (e) {}
  }, 1600);
})();

/* ===== 🔊 おとが きこえる？（この 機械で はじめて あそぶ とき 1かい だけ） ===== */
(function () {
  function ok() { try { return localStorage.getItem("fy_soundok") === "1"; } catch (e) { return true; } }
  function show(after) {
    if (!window.fySheet) { if (after) after(); return; }
    window.fySheet(function (inn) {
      inn.innerHTML = '<div style="font-size:54px;line-height:1.1;">🔊</div>' +
        '<div style="font-size:22px;font-weight:900;margin:4px 0 10px;">おとが きこえる？</div>' +
        '<button id="fySndPlay" class="bt" style="background:#42a5f5;font-size:19px;color:#fff;">▶ おとを ならす</button>' +
        '<div id="fySndAsk" style="display:none;margin-top:10px;">' +
          '<button id="fySndYes" class="bt" style="background:#43a047;font-size:19px;color:#fff;">⭕ きこえた！</button>' +
          '<button id="fySndNo" class="bt" style="background:#fff;color:#c62828;border:2px solid #ef9a9a;font-size:16px;margin-top:8px;">❌ きこえない</button>' +
        '</div>' +
        '<div id="fySndTip" style="display:none;text-align:left;font-size:14px;line-height:1.9;font-weight:800;background:#fff8e1;border-radius:12px;padding:10px 12px;margin-top:10px;">① スマホの よこの スイッチ（マナーモード）を たしかめてね<br>② おとの ボタンで、おとを おおきく してね<br>③ もういちど「▶ おとを ならす」を おしてね<br><span style="font-size:12px;color:#806c5a;font-weight:700;">わからない ときは、おうちの ひとに きいてね</span></div>';
      function q(id) { return inn.querySelector("#" + id); }
      q("fySndPlay").addEventListener("click", function () { try { playAudioCloned("seikaiAudio"); } catch (e) {} q("fySndAsk").style.display = "block"; });
      q("fySndYes").addEventListener("click", function () { try { localStorage.setItem("fy_soundok", "1"); } catch (e) {} window.fySheetClose(); if (after) setTimeout(after, 150); });
      q("fySndNo").addEventListener("click", function () { q("fySndTip").style.display = "block"; });
    });
  }
  window.fySoundCheck = function () { show(null); };
  document.addEventListener("click", function (e) {
    try {
      if (ok() || !(window.fyNewLookOn && window.fyNewLookOn())) return;
      var b = e.target.closest ? e.target.closest("#fyNLDo, #fyNLCard, #fyNLLeg") : null; if (!b) return;
      e.preventDefault(); e.stopPropagation();
      show(function () { try { b.click(); } catch (e2) {} });
    } catch (e3) {}
  }, true);
})();

/* ===== 🎵 色モード：せいかいの とき、ずんだもんが おとの なまえを いう（黒い カードでは いわない） ===== */
(function () {
  var MAP = { "ド": "do", "レ": "re", "ミ": "mi", "ファ": "fa", "ソ": "so", "ラ": "la", "シ": "si" }, cache = {};
  var ALT = { "la": "ra", "si": "shi" };   /* ファイル名が ちがう よびかたで 置かれていても 鳴るように（ら/la、し/shi） */
  var AV = String(window.FY_EXTRAS_VER || "x");   /* 古い（音の 出ない）ファイルを キャッシュから 読まないように、版ごとに 変える */
  function mk(name) { return new Audio("zunda-" + name + ".mp3?v=" + AV); }
  function play(a) { setTimeout(function () { try { a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }, 180); }
  window.fySayNote = function (key) {
    try {
      var n = MAP[String(key)]; if (!n) return;
      if (cache[n]) { play(cache[n]); return; }
      var a = mk(n), alt = ALT[n], usedAlt = false;
      a.addEventListener("error", function () {
        if (usedAlt || !alt) return;
        usedAlt = true;
        var b = mk(alt); cache[n] = b; play(b);
      });
      cache[n] = a;
      play(a);
    } catch (e) {}
  };
})();

/* ===== 🏫 きょうしつ用（見本）：ぜんぶ ひらいた 状態で 見せる。せんせいには 送らない ===== */
(function () {
  window.fyDemoOn = function () { try { return localStorage.getItem("fy_demo") === "1"; } catch (e) { return false; } };
  /* カード・記録ページにも のせる、きょうしつ用の「みほん」すかし文字 */
  window.fyDemoBadgeHtml = function () { try { if (!window.fyDemoOn()) return ""; return '<div style="position:absolute;top:4px;right:4px;background:#78909c;color:#fff;font-size:10px;font-weight:900;border-radius:8px;padding:2px 7px;pointer-events:none;opacity:.92;z-index:5;white-space:nowrap;">🏫 みほん</div>'; } catch (e) { return ""; } };
  function setup(idx) {
    try {
      if (typeof fyJmpBase === "function") { fyJmpBase(idx); ["treble", "bass", "all"].forEach(function (c) { fyJmpSet(idx, c, 5); }); }
      else { fyTestBasics(idx); [1, 2, 3, 4, 5].forEach(function (l) { fyTestPass(idx, "treble", l); fyTestPass(idx, "bass", l); }); }
      Storage.set("fy_test_master_" + idx, true);
      localStorage.setItem("fy_soundok", "1");
      /* レジェンドへの みちの きょくも、ぜんぶ ひらく（chunk_proto.html 側の キー） */
      localStorage.setItem("fy_chunk_max_" + idx, "5");
      localStorage.setItem("fy_lv5_openall_" + idx, "1");
    } catch (e) {}
  }
  /* 🏫 教室用に する あいだ、きょくの ごうかく きろく（✅／⭐）を いったん しまって、まっさらに する。
     教室用を やめたら、しまって おいた きろくを もとに もどす（なんかいリセットしても、ほんものの きろくは さいしょの 1回だけ しまう） */
  function demoSongWipe(idx) {
    try {
      if (localStorage.getItem("fy_demo_bak_pass_" + idx) === null) {
        localStorage.setItem("fy_demo_bak_pass_" + idx, localStorage.getItem("fy_pass_" + idx) || "{}");
        localStorage.setItem("fy_demo_bak_play_" + idx, localStorage.getItem("fy_play_" + idx) || "{}");
      }
      localStorage.setItem("fy_pass_" + idx, "{}");
      localStorage.setItem("fy_play_" + idx, "{}");
    } catch (e) {}
  }
  function demoSongRestore(idx) {
    try {
      var p = localStorage.getItem("fy_demo_bak_pass_" + idx), pl = localStorage.getItem("fy_demo_bak_play_" + idx);
      if (p !== null) localStorage.setItem("fy_pass_" + idx, p); else localStorage.removeItem("fy_pass_" + idx);
      if (pl !== null) localStorage.setItem("fy_play_" + idx, pl); else localStorage.removeItem("fy_play_" + idx);
      localStorage.removeItem("fy_demo_bak_pass_" + idx);
      localStorage.removeItem("fy_demo_bak_play_" + idx);
    } catch (e) {}
  }
  window.fyDemoSet = function (v) {
    if (v) {
      if (!confirm("この 機械を「きょうしつ用（見本）」に します。\nいまの プレイヤーの レベルを ぜんぶ ひらきます。\nきょくの ごうかく きろくは いったん しまって、まっさらに します（やめたら もとに もどります）。\n（生徒の スマホでは おさないで ください）")) return;
      try { localStorage.setItem("fy_demo", "1"); } catch (e) {}
      setup(activeProfileIndex);
      demoSongWipe(activeProfileIndex);
      /* ここで いっしょに ドレミの いろも きめる（あとで もう一回 せんせいページを ひらかなくて いいように） */
      try {
        var idx = activeProfileIndex;
        var toColor = confirm("ドレミを 色おんぷに しますか？\nOK＝色おんぷ　キャンセル＝くろおんぷ");
        Storage.set("fy_color_" + idx + "_treble", toColor ? "on" : "off");
        Storage.set("fy_color_" + idx + "_bass", toColor ? "on" : "off");
      } catch (e2) {}
    } else {
      try { localStorage.removeItem("fy_demo"); } catch (e) {}
      demoSongRestore(activeProfileIndex);
      alert("きょうしつ用を やめました。\n（ひらいた レベルは そのまま。きょくの ごうかく きろくは もとに もどりました）");
    }
    location.reload();
  };
  window.fyDemoReset = function () { if (!confirm("きょうしつ用の きろくを、ぜんぶ ひらいた はじめの 状態に もどします。\n（きょくの ごうかく きろくも、まっさらに なります）")) return; setup(activeProfileIndex); demoSongWipe(activeProfileIndex); location.reload(); };
  /* 🎨 教室用で 見せる ときの、ドレミ カードの いろ（小さい 生徒さん向けの 色おんぷ ⇄ ふだんの くろおんぷ） */
  window.fyDemoColorSet = function (on) {
    var idx = activeProfileIndex;
    try {
      Storage.set("fy_color_" + idx + "_treble", on ? "on" : "off");
      Storage.set("fy_color_" + idx + "_bass", on ? "on" : "off");
    } catch (e) {}
    alert(on ? "ドレミ カードを 色おんぷに しました。" : "ドレミ カードを くろおんぷに しました。");
    try { initProfiles(); } catch (e) {}
  };
  function tag() {
    try {
      var t = document.getElementById("fyDemoTag");
      var ov = document.getElementById("fyDemoDim");
      if (!window.fyDemoOn()) { if (t) t.remove(); if (ov) ov.remove(); return; }
      if (!t) { t = document.createElement("div"); t.id = "fyDemoTag"; t.textContent = "🏫 きょうしつ用（みほん）"; t.style.cssText = "position:fixed;left:50%;bottom:3px;transform:translateX(-50%);z-index:9400;background:#78909c;color:#fff;font-size:11px;font-weight:900;border-radius:10px;padding:2px 10px;pointer-events:none;opacity:.92;white-space:nowrap;"; document.body.appendChild(t); }
      /* 画面ぜんたいを すこし 暗くして、わくを つける（本物と まちがえない ため。おしても そのまま 送れる） */
      if (!ov) { ov = document.createElement("div"); ov.id = "fyDemoDim"; ov.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:9300;pointer-events:none;background:rgba(0,0,0,.10);box-shadow:inset 0 0 0 6px rgba(69,90,100,.88);"; document.body.appendChild(ov); }
    } catch (e) {}
  }
  setTimeout(tag, 800);
})();
