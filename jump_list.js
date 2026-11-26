/* ===== チェック場所ジャンプ一覧（このファイルだけ入れ替えれば、一覧が変わります） 1124g ===== */
/* 先生ページ（タブ3）の一番上に ならびます。ボタンを おすと じゅんびをして その場所へ いきます。 */
function fyJmpClear(idx, list) { list.forEach(function (k) { try { localStorage.removeItem(k + idx); } catch (e) {} }); }

/* 2026-11-24：安全装置。ジャンプと「はじめの状態にもどす」は、名前が「てすと」で はじまる プレイヤーか、
   教室用（見本）の ときだけ うごく（先生の指示）。それ以外のときは とめる。 */
function fyJmpAllowed(idx) {
  try {
    var nm = (typeof profiles !== "undefined" && profiles[idx]) || "";
    if (String(nm).indexOf("てすと") === 0) return true;
  } catch (e) {}
  try { if (window.fyDemoOn && window.fyDemoOn()) return true; } catch (e) {}
  return false;
}
function fyJmpSafe(fn) {
  return function (idx) {
    if (!fyJmpAllowed(idx)) { alert("テスト用の プレイヤーで つかってね"); return; }
    return fn(idx);
  };
}

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
/* 新しい おいわい（はじめてごうかく・れんぞくしょう・半期の きろく）を もういちど 出せるように、
   そのプレイヤーの カード・ポイントの きろくを まるごと リセットする（テスト用プレイヤーだけで つかう）。 */
function fyJmpFreshCel(idx) {
  localStorage.removeItem("fy_ach_" + idx);
  Storage.set("fy_ach_" + idx, []);
  Storage.set("fy_ptgiven_" + idx, {});
  localStorage.removeItem("onpu_award_auto_" + idx);
}
/* 半期の きろく（ふよみ メダル）の じゅんび：いまの 本当の 期に、いちばん下の ランク（銅メダル）の
   しきい値から delta を ひいた 回数を 入れる（delta=-1 で「あと1回」）。 */
function fyJmpHalfSetup(idx, rankIdx, delta) {
  if (!(window.fyJmpHalfRanks && window.fyJmpHalfId)) { alert("半期の きろくの しくみが みつかりません（app-extras.js を かくにんしてください）"); return; }
  var id = window.fyJmpHalfId(new Date());
  var ranks = window.fyJmpHalfRanks(id);
  Storage.set("fy_half_id_" + idx, id);
  Storage.set("fy_half_cnt_" + idx, Math.max(0, ranks[rankIdx] + (delta || 0)));
}

window.FY_JUMPS = [
  /* ---------- 見たい 場面へ ---------- */
  { label: "🎼 ト音記号マスターの 直前", note: "ト音 レベル5が すぐ始まる。『⏩ あと1もんへ』で さいごの1問だけ",
    run: fyJmpSafe(function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 4); fyJmpDropAch(idx, ["treble", "master"]); fyJmpUnPt(idx, ["award_treble"]); fySkipSet(true); fyJmpGo("train:treble:5"); }) },
  { label: "🎼 ヘ音記号マスターの 直前", note: "ヘ音 レベル5が すぐ始まる（ト音は 全部 合格）",
    run: fyJmpSafe(function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 4); fyJmpSet(idx, "all", 0); fyJmpDropAch(idx, ["bass", "master"]); fyJmpUnPt(idx, ["award_bass"]); fySkipSet(true); fyJmpGo("train:bass:5"); }) },
  { label: "🎓 ふよみマスターの 直前", note: "全カード レベル5が すぐ始まる（ト音・ヘ音は 全部 合格）",
    run: fyJmpSafe(function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); fyJmpSet(idx, "all", 4); fyJmpDropAch(idx, ["master"]); fyJmpUnPt(idx, ["award_master"]); Storage.set("fy_legend_opened_" + idx, false); localStorage.removeItem("fy_legend_intro_" + idx); fySkipSet(true); fyJmpGo("train:all:5"); }) },
  { label: "👑 レジェンドへの みちが 開いた 直後（トップ画面）", note: "ふよみマスターに なった すぐあとの トップ。『レジェンドへの みち』が 光る",
    run: fyJmpSafe(function (idx) { Storage.set("fy_test_master_" + idx, true); Storage.set("fy_legend_opened_" + idx, false); location.reload(); }) },
  { label: "🃏 おんぷカードを ぜんぶ 開く", note: "ト音・ヘ音・全カードを レベル5まで 合格に して、おんぷカードの 画面を ひらく",
    run: fyJmpSafe(function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); fyJmpSet(idx, "all", 5); fyJmpGo("grid"); }) },
  { label: "🎁 ポイントが たまった 状態（こうかんを ためす）", note: "60ポイントに して、こうかんの 画面を ひらく",
    run: fyJmpSafe(function (idx) { Storage.set("fy_tp_" + idx, 60); fyJmpGo("click:fyNLPt"); }) },
  { label: "🎵 はじめて ごうかくカードの 直前", note: "ト音記号 レベル2の 直前（レベル1だけ 合格ずみ）。『⏩ あと1もんへ』で さいごの1問だけ",
    run: fyJmpSafe(function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 1); fyJmpDropAch(idx, ["lvclear"]); Storage.set("fy_ptgiven_" + idx, {}); fySkipSet(true); fyJmpGo("train:treble:2"); }) },
  { label: "🎼 ト音記号 れんぞくしょうの 直前", note: "ト音 レベル5の20問が すぐ始まる。パーフェクトで れんぞく10回に なり、カードが 出る",
    run: fyJmpSafe(function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); fyJmpSet(idx, "all", 0); Storage.set("fy_tr5run_" + idx, 9); fyJmpDropAch(idx, ["trrun"]); Storage.set("fy_ptgiven_" + idx, {}); fySkipSet(true); fyJmpGo("train:treble:5"); }) },
  { label: "🥉 銅メダルの 直前", note: "いまの期の 回数を「銅メダルの しきい値 − 1」に して、全カード レベル5の20問へ。パーフェクトで 銅メダルの カードが 出る",
    run: fyJmpSafe(function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); fyJmpSet(idx, "all", 4); fyJmpHalfSetup(idx, 0, -1); fyJmpDropAch(idx, ["half"]); Storage.set("fy_ptgiven_" + idx, {}); fySkipSet(true); fyJmpGo("train:all:5"); }) },
  { label: "🥇 金メダルの 直前", note: "いまの期の 回数を「金メダル（ふよみ名人）の しきい値 − 1」に して、全カード レベル5の20問へ",
    run: fyJmpSafe(function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); fyJmpSet(idx, "all", 4); fyJmpHalfSetup(idx, 2, -1); fyJmpDropAch(idx, ["half"]); Storage.set("fy_ptgiven_" + idx, {}); fySkipSet(true); fyJmpGo("train:all:5"); }) },
  { label: "📋 期が 終わった 直後", note: "ひとつ前の期を「まだ しめていない」状態に して、つぎの トレーニングの 結果で『期の終わりの カード』が 出る",
    run: fyJmpSafe(function (idx) {
      fyJmpBase(idx);
      if (!(window.fyJmpHalfRanks && window.fyJmpHalfId && window.fyJmpPrevHalfId)) { alert("半期の きろくの しくみが みつかりません（app-extras.js を かくにんしてください）"); return; }
      var cur = window.fyJmpHalfId(new Date()), prev = window.fyJmpPrevHalfId(cur), ranks = window.fyJmpHalfRanks(prev);
      Storage.set("fy_half_id_" + idx, prev);
      Storage.set("fy_half_cnt_" + idx, ranks[0]);
      fyJmpDropAch(idx, ["halfend"]);
      Storage.set("fy_ptgiven_" + idx, {});
      fySkipSet(true);
      fyJmpGo("train:treble:1");
    }) },
  { label: "🗓 先週 4日ぶんの ハンコを つくる", note: "先週（月〜日）に 4日ぶんの ハンコを 入れる。トップに もどると「先週は…」の おしらせが 出る",
    run: fyJmpSafe(function (idx) {
      if (!window.fyJmpMakeLastWeekStamps) { alert("ハンコの しくみが みつかりません（app-extras.js を かくにんしてください）"); return; }
      window.fyJmpMakeLastWeekStamps(idx);
      alert("先週に 4日ぶんの ハンコを つくりました。\n「閉じる」で トップに もどると、おしらせが 出ます。");
      location.reload();
    }) },
  { label: "🧪 ハンコと ポイントを リセット", note: "いまのプレイヤーの ハンコ・トレーニングポイントの きろくを まっさらに もどす",
    run: fyJmpSafe(function (idx) {
      if (!window.fyJmpResetHankoPoints) { alert("ハンコの しくみが みつかりません（app-extras.js を かくにんしてください）"); return; }
      window.fyJmpResetHankoPoints(idx);
      alert("ハンコと ポイントを リセットしました。");
      location.reload();
    }) },
  { label: "📤 機種変更の うつしコードの 画面を 開く", note: "いまのプレイヤーの「きろくを うつす コード」の 画面を ひらく",
    run: fyJmpSafe(function (idx) {
      if (!window.fyShowBackup) { alert("うつしコードの しくみが みつかりません（app-extras.js を かくにんしてください）"); return; }
      window.fyShowBackup(idx);
    }) },
  { label: "⏩『あと1もんへ』ボタンを 出す", note: "トレーニング中の 右上に テスト用の ボタンが 出る（20問を 19問目まで じどうで すすめる。10びょう ほど）",
    run: fyJmpSafe(function (idx) { fySkipSet(true); alert("出るように しました。トレーニングを はじめると、右上に 出ます。"); }) },
  { label: "⏩『あと1もんへ』ボタンを けす", note: "生徒に 見せる ときは けして おく",
    run: fyJmpSafe(function (idx) { fySkipSet(false); alert("けしました。"); }) },
  { label: "♻ この生徒を はじめの状態に もどす", note: "記録・光り・テスト用の印を消す（名前は残る）", confirm: true,
    run: fyJmpSafe(function (idx) {
      /* 2026-11-24：キーの「どこに プレイヤー番号が 入るか」は キーの かたちで ちがう。
         「番号の すぐ あとに clef（treble/bass/all/do）が つづく」キーは、その位置だけを 見る。
         それ以外は「番号が いちばん うしろ」の かたちなので、うしろだけを 見る
         （前は (^|_)idx(_|$) で ぜんぶ 判定していたため、例えば 枠1を もどすと
         枠0の「onpu_best_20_0_treble_1」（うしろの「_1」は レベル番号）まで 消えて しまっていた）。 */
      var CLEF_THEN = /^(onpu_best_20c?_|onpu_best_10c?_|onpu_count_best_|fy_lvfailc?_|fy_color_perfect_|fy_color_)/;
      function matchesIdx(k) {
        if (CLEF_THEN.test(k)) {
          var rest = k.replace(CLEF_THEN, "");
          var m = rest.match(/^(\d+)_(treble|bass|all|do)(_|$)/);
          return !!(m && +m[1] === idx);
        }
        return new RegExp("_" + idx + "$").test(k);
      }
      var kill = /ptgiven|gift_used|demoseen|tempo_|songguide|countvoice|best|lvfail|color|ach|test_master|legend|glow|noprac|chunk_rec|chunk_max|do_test|debug_unlocked|allkeys|gatelock|practice_guide|lv5_openall|pass_|play_|half_id_|half_cnt_|tr5run_|bs5run_|run_now_|run_best_|perfect_total_|hanko_|tp_|cel_pending_|log_|rep_last_/;
      var del = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if ((k.indexOf("onpu_") === 0 || k.indexOf("fy_") === 0) && kill.test(k) && matchesIdx(k)) del.push(k);
      }
      del.forEach(function (k) { localStorage.removeItem(k); });
      location.reload();
    }) }
];
