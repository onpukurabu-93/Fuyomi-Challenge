/* ===== チェック場所ジャンプ一覧（このファイルだけ入れ替えれば、一覧が変わります） 1115s ===== */
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
  { label: "🆕 1115q ①：🔊 おとが きこえる？（はじめて あそぶ とき）", note: "トップに もどる →『6つの「ド」』か『おんぷカード』を おす → おとの かくにんが 出る →『▶ おとを ならす』→『⭕ きこえた！』で そのまま 先へ すすむ。『❌ きこえない』で たしかめ方が 出る。2かいめからは 出ない",
    run: function (idx) { localStorage.removeItem("fy_soundok"); location.reload(); } },
  { label: "🆕 1115q ②：おんぷカードの 数字を 長押し", note: "おんぷカードの 画面が ひらく → 数字を 長押し → その レベルに 出る 音の カードが ならぶ。ふつうに おすと、今まで どおり レベルが ひらく。下に 小さい 字で 説明",
    run: function (idx) { localStorage.setItem("fy_soundok", "1"); fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); fyJmpSet(idx, "all", 5); fyJmpGo("grid"); } },
  { label: "🆕 1115s：はじめての 案内（ずんだもんの 声つき）", note: "おすと、先生ページが とじて、すぐに 案内が はじまる（声つき）。光る わくが ①今週の ハンコ ②6つの「ド」③レジェンドへの みち ④きょうは おわり の 順に うごく",
    run: function (idx) {
      localStorage.setItem("fy_soundok", "1");
      /* 読みなおさずに、おした その場で はじめる（iPhoneは おした すぐあと で ないと 声が 出ない） */
      try { [].forEach.call(document.querySelectorAll("body > div"), function (d) { var c = getComputedStyle(d); if (c.position === "fixed" && d.offsetHeight > 300 && d.id !== "fyTop") d.style.display = "none"; }); } catch (e) {}
      try { showSelectScreen(); } catch (e) {}
      try { showGuide(); } catch (e) { alert("案内を はじめられませんでした：" + e.message); }
    } },
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
