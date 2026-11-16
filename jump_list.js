/* ===== チェック場所ジャンプ一覧（このファイルだけ入れ替えれば、一覧が変わります） 1116d ===== */
/* 先生ページ（タブ3）の一番上に ならびます。ボタンを おすと じゅんびをして その場所へ いきます。 */
function fyJmpClear(idx, list) { list.forEach(function (k) { try { localStorage.removeItem(k + idx); } catch (e) {} }); }
/* --- じゅんびの どうぐ --- */
/* clef を レベル n まで ごうかくに する（n より うえは けす） */
function fyJmpSet(idx, clef, n) {
  for (var l = 1; l <= 5; l++) {
    if (l <= n) fyTestPass(idx, clef, l);
    else { ["onpu_best_20_", "onpu_count_best_", "onpu_best_10_"].forEach(function (k) { localStorage.removeItem(k + idx + "_" + clef + "_" + l); }); }
  }
}
function fyJmpPassed(idx, clef) { var n = 0; for (var l = 1; l <= 5; l++) { if (Storage.get("onpu_best_20_" + idx + "_" + clef + "_" + l) || Storage.get("onpu_count_best_" + idx + "_" + clef + "_" + l)) n = l; else break; } return n; }
/* おいわいの きろくを けす（もういちど おいわい画面が でるように） */
function fyJmpDropAch(idx, types) {
  try { var a = JSON.parse(localStorage.getItem("fy_ach_" + idx) || "[]"); if (Array.isArray(a)) localStorage.setItem("fy_ach_" + idx, JSON.stringify(a.filter(function (r) { return !r || types.indexOf(r.type) === -1; }))); } catch (e) {}
  localStorage.removeItem("onpu_award_auto_" + idx);
}
function fyJmpBase(idx) { localStorage.removeItem("onpu_debug_unlocked_" + idx); fyTestBasics(idx); Storage.set("fy_test_master_" + idx, false); }
function fyJmpLegendLv(idx, d) {
  var v = parseInt(localStorage.getItem("fy_chunk_max_" + idx), 10) || 1; v = Math.max(1, Math.min(5, v + d));
  localStorage.setItem("fy_chunk_max_" + idx, String(v));
  Storage.set("fy_test_master_" + idx, true); Storage.set("fy_legend_opened_" + idx, true);
  ["fy_legend_intro_", "fy_legend_pianoset_", "fy_legend_pianohint_"].forEach(function (k) { if (!localStorage.getItem(k + idx)) localStorage.setItem(k + idx, "1"); });
  location.href = "chunk_proto.html";
}
function fyJmpStep(idx, clef, name) {
  fyJmpBase(idx);
  var n = Math.min(5, fyJmpPassed(idx, clef) + 1);
  if (clef === "all") { fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); }
  fyJmpSet(idx, clef, n);
  alert(name + "：レベル" + n + " まで ごうかくに しました" + (n < 5 ? "（レベル" + (n + 1) + " が ひらきます）" : ""));
  location.reload();
}
function fyJmpGo(after) { try { sessionStorage.setItem("fy_jump_after", after); } catch (e) {} location.reload(); }
function fyJmpUnPt(idx, keys) { try { var g = Storage.get("fy_ptgiven_" + idx, {}) || {}; keys.forEach(function (k) { delete g[k]; }); Storage.set("fy_ptgiven_" + idx, g); } catch (e) {} }
window.FY_JUMPS = [
  /* ---------- 🆕 こんかい チェックして ほしい ところ（版が かわるたびに 入れかえます） ---------- */
  { label: "🆕 1116d ①：ヘ音記号は まだ ロック", note: "『6つのド』は 合格に して、ト音・ヘ音は まだ どっちも 1回も クリアしていない 状態で おんぷカードを ひらく。ト音レベル1は ひらいて『いまここ』が 光るが、ヘ音レベル1は 🔒（まだ ロック）に なっているか",
    run: function (idx) { localStorage.setItem("fy_soundok", "1"); fyJmpBase(idx); fyJmpSet(idx, "treble", 0); fyJmpSet(idx, "bass", 0); fyJmpSet(idx, "all", 0); fyJmpGo("grid"); } },
  { label: "🆕 1116d ②：ト音1を クリアすると ヘ音が ひらく", note: "ト音レベル1だけ クリア ずみに して おんぷカードを ひらく。ヘ音レベル1の 🔒が 外れて、こんどは ヘ音の ほうに『いまここ』の 光が 移っているか（ト音と ヘ音、両方 同時には 光らない）",
    run: function (idx) { localStorage.setItem("fy_soundok", "1"); fyJmpBase(idx); fyJmpSet(idx, "treble", 1); fyJmpSet(idx, "bass", 0); fyJmpSet(idx, "all", 0); fyJmpGo("grid"); } },
  { label: "🆕 1116d ③：🏫 教室用で 本当に 送れるか", note: "教室用を オンに して、全レベル 合格に した うえで『きょうは おわり』の 画面を ひらく。送る ボタンが 出て、中の コードが『みほん』に なっているか。おした あと、④の『コードを 貼って かくにん』に その文を 貼ると、グレーの『教室用（見本）』の あんないだけ 出て、確認ずみ／印刷の ボタンが 出ない。さいきんの れんらくにも 増えない",
    run: function (idx) {
      localStorage.setItem("fy_demo", "1");
      fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); fyJmpSet(idx, "all", 5);
      fyJmpDropAch(idx, ["treble", "bass", "master"]); fyJmpUnPt(idx, ["award_treble", "award_bass", "award_master"]);
      Storage.set("fy_test_master_" + idx, true);
      /* 送る ものが 見えるように、テスト用の きろくを 1件だけ 入れる */
      try {
        var a = Storage.get("fy_ach_" + idx, []); if (!Array.isArray(a)) a = [];
        var now = new Date(), nm = (typeof profiles !== "undefined" && profiles[idx]) || "";
        a.push({ type: "treble", n: 0, t: now.getTime(), d: now.toISOString().slice(0, 10), name: nm, code: "TEST1", us: 1 });
        Storage.set("fy_ach_" + idx, a);
      } catch (e) {}
      fyJmpGo("click:fyNLOw");
    } },
  { label: "🆕 1116d ④：週の きろくが 2回 出ないか", note: "きょうの ハンコは もう おした ことに して、週の きろくも たった今 送った ことに する → この 状態で『きょうは おわり』を もう一度 おしても、週の きろくの 行が また 出ないか（出ないのが せいかい）",
    run: function (idx) {
      try { var st = Storage.get("fy_hanko_" + idx, []); if (!Array.isArray(st)) st = []; var t = new Date().toISOString().slice(0, 10); if (st.indexOf(t) === -1) st.push(t); Storage.set("fy_hanko_" + idx, st); Storage.set("fy_hanko_ok_" + idx, st.slice()); } catch (e) {}
      localStorage.setItem("fy_rep_last_" + idx, String(Date.now()));
      fyJmpGo("click:fyNLOw");
    } },
  { label: "🧹 見本の 3人（みほんA・B・C）を けす", note: "『さいきんの れんらく』から 見本だけ 消す。本物の 生徒は 残る",
    run: function (idx) { var sn = {}; try { sn = JSON.parse(localStorage.getItem("fy_seen") || "{}") || {}; } catch (e) {} delete sn["みほんA"]; delete sn["みほんB"]; delete sn["みほんC"]; localStorage.setItem("fy_seen", JSON.stringify(sn)); alert("見本を 消しました。"); } },
  /* ---------- 見たい 場面へ ---------- */
  { label: "🎼 ト音記号マスターの 直前", note: "ト音 レベル5が すぐ始まる。『⏩ あと1もんへ』で さいごの1問だけ",
    run: function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 4); fyJmpDropAch(idx, ["treble", "master"]); fyJmpUnPt(idx, ["award_treble"]); fySkipSet(true); fyJmpGo("train:treble:5"); } },
  { label: "🎼 ヘ音記号マスターの 直前", note: "ヘ音 レベル5が すぐ始まる（ト音は 全部 合格）",
    run: function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 4); fyJmpSet(idx, "all", 0); fyJmpDropAch(idx, ["bass", "master"]); fyJmpUnPt(idx, ["award_bass"]); fySkipSet(true); fyJmpGo("train:bass:5"); } },
  { label: "🎓 ふよみマスターの 直前", note: "全カード レベル5が すぐ始まる（ト音・ヘ音は 全部 合格）",
    run: function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); fyJmpSet(idx, "all", 4); fyJmpDropAch(idx, ["master"]); fyJmpUnPt(idx, ["award_master"]); Storage.set("fy_legend_opened_" + idx, false); localStorage.removeItem("fy_legend_intro_" + idx); fySkipSet(true); fyJmpGo("train:all:5"); } },
  { label: "👑 レジェンドへの みちが 開いた 直後（トップ画面）", note: "ふよみマスターに なった すぐあとの トップ。『レジェンドへの みち』が 光る",
    run: function (idx) { Storage.set("fy_test_master_" + idx, true); Storage.set("fy_legend_opened_" + idx, false); location.reload(); } },
  { label: "🃏 おんぷカードを ぜんぶ 開く", note: "ト音・ヘ音・全カードを レベル5まで 合格に して、おんぷカードの 画面を ひらく",
    run: function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); fyJmpSet(idx, "all", 5); fyJmpGo("grid"); } },
  { label: "🎁 ポイントが たまった 状態（こうかんを ためす）", note: "60ポイントに して、こうかんの 画面を ひらく",
    run: function (idx) { Storage.set("fy_tp_" + idx, 60); fyJmpGo("click:fyNLEx"); } },
  { label: "⏩『あと1もんへ』ボタンを 出す", note: "トレーニング中の 右上に テスト用の ボタンが 出る（20問を 19問目まで じどうで すすめる。10びょう ほど）",
    run: function (idx) { fySkipSet(true); alert("出るように しました。トレーニングを はじめると、右上に 出ます。"); } },
  { label: "⏩『あと1もんへ』ボタンを けす", note: "生徒に 見せる ときは けして おく",
    run: function (idx) { fySkipSet(false); alert("けしました。"); } },
  { label: "♻ この生徒を はじめの状態に もどす", note: "記録・光り・テスト用の印を消す（名前は残る）", confirm: true,
    run: function (idx) {
      var re = new RegExp("(^|_)" + idx + "(_|$)");
      var kill = /ptgiven|gift_used|demoseen|tempo_|songguide|countvoice|best|lvfail|color|ach|test_master|legend|glow|noprac|chunk_rec|chunk_max|do_test|debug_unlocked|allkeys|gatelock|practice_guide|lv5_openall|pass_|play_/;
      var del = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if ((k.indexOf("onpu_") === 0 || k.indexOf("fy_") === 0) && re.test(k) && kill.test(k)) del.push(k);
      }
      del.forEach(function (k) { localStorage.removeItem(k); });
      location.reload();
    } }
];
