/* ===== チェック場所ジャンプ一覧（このファイルだけ入れ替えれば、一覧が変わります） 1114d-2 ===== */
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
window.FY_JUMPS = [
  { label: "🎼 ト音記号マスターの 寸前", note: "ト音をLv4まで合格に。あとは ト音Lv5を 20問ぜんぶ正解するだけ",
    run: function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 4); fyJmpDropAch(idx, ["treble", "master"]); location.reload(); } },
  { label: "🎼 ヘ音記号マスターの 寸前", note: "ヘ音をLv4まで合格に（ト音は全部合格）。あとは ヘ音Lv5を ぜんぶ正解するだけ",
    run: function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 4); fyJmpSet(idx, "all", 0); fyJmpDropAch(idx, ["bass", "master"]); location.reload(); } },
  { label: "🎓 ふよみマスターの 寸前", note: "ト音・ヘ音は全部合格、全カードはLv4まで。あとは 全カードLv5を ぜんぶ正解するだけ",
    run: function (idx) { fyJmpBase(idx); fyJmpSet(idx, "treble", 5); fyJmpSet(idx, "bass", 5); fyJmpSet(idx, "all", 4); fyJmpDropAch(idx, ["master"]); Storage.set("fy_legend_opened_" + idx, false); localStorage.removeItem("fy_legend_intro_" + idx); location.reload(); } },
  { label: "👑 レジェンド レベル5の 寸前", note: "レジェンドをLv4まで開く。あとは Lv4に合格するだけ（Lv5の説明の声も はじめから）",
    run: function (idx) { localStorage.setItem("fy_chunk_max_" + idx, "3"); localStorage.removeItem("fy_legend_lv5voice_" + idx); fyJmpLegendLv(idx, 1); } },
  { label: "➕ レジェンドの レベルを 1つ すすめる", note: "おすたびに 1だん。レジェンドの画面へ いきます",
    run: function (idx) { fyJmpLegendLv(idx, 1); } },
  { label: "➖ レジェンドの レベルを 1つ もどす", note: "おすたびに 1だん もどる",
    run: function (idx) { fyJmpLegendLv(idx, -1); } },
  { label: "➕ ト音記号を 1レベル すすめる", note: "おすたびに 1つ合格を ふやす",
    run: function (idx) { fyJmpStep(idx, "treble", "ト音記号"); } },
  { label: "➕ ヘ音記号を 1レベル すすめる", note: "おすたびに 1つ合格を ふやす",
    run: function (idx) { fyJmpStep(idx, "bass", "ヘ音記号"); } },
  { label: "➕ 全カードを 1レベル すすめる", note: "ト音・ヘ音は 全部合格にして、全カードを 1つ すすめる",
    run: function (idx) { fyJmpStep(idx, "all", "全カード"); } },
  { label: "1️⃣ レジェンドへのみち（はじめて入る）", note: "ようこそ(声1つ)→レベル画面で声→大きい🎹だけ光る→押すか「つかわない」→スタートが光る＋声",
    run: function (idx) {
      Storage.set("fy_test_master_" + idx, true);
      fyJmpClear(idx, ["fy_legend_intro_", "fy_legend_pianohint_", "fy_legend_pianoset_", "fy_legend_lv5voice_", "fy_lv5_openall_", "fy_chunk_max_"]);
      Storage.set("fy_legend_opened_" + idx, true);
      location.href = "chunk_proto.html";
    } },
  { label: "2️⃣ レジェンド レベル5（曲のロック・✅⭐の声）", note: "Lv5を開く。曲は2つだけ開く／🔒を押すとメッセージ／✅の曲を押すと声",
    run: function (idx) {
      Storage.set("fy_test_master_" + idx, true);
      localStorage.setItem("fy_chunk_max_" + idx, "5");
      fyJmpClear(idx, ["fy_lv5_openall_", "fy_legend_lv5voice_", "fy_legend_playvoice_"]);
      Storage.set("fy_legend_opened_" + idx, true);
      location.href = "chunk_proto.html";
    } },
  { label: "3️⃣ 色音符 はじめの練習（ト音）", note: "光る案内→全部の鍵を押す→トレーニングが光る＋声",
    run: function (idx) {
      Storage.set("fy_color_" + idx + "_treble", "on");
      fyJmpClear(idx, ["fy_practice_guide_", "fy_allkeys_", "fy_noprac_"]);
      toggleModal("managementModal", false);
      selectClef("treble");
    } },
  { label: "4️⃣ 色音符 Lv1の結果（点が低い／上がった）", note: "20問で わざと半分以上まちがえる→はげまし。もう一度で10点以上上げる→ほめる",
    run: function (idx) {
      Storage.set("fy_color_" + idx + "_treble", "on");
      Storage.set("fy_allkeys_" + idx, true);
      toggleModal("managementModal", false);
      selectClef("treble");
    } },
  { label: "5️⃣ 黒音符 Lv1（うまくいかない→色にもどる）", note: "黒に切替→20問で90%未満→はげまし＋大きい『いろおんぷに もどる』",
    run: function (idx) {
      Storage.set("fy_color_" + idx + "_treble", "off");
      toggleModal("managementModal", false);
      selectClef("treble");
    } },
  { label: "6️⃣ 保護者ロック（3回まちがい→10分）", note: "色画面の『くろおんぷにする』→わざと3回まちがえる→閉じて10分ロック",
    run: function (idx) {
      Storage.set("fy_color_" + idx + "_treble", "on");
      Storage.set("fy_gatelock_" + idx, 0);
      toggleModal("managementModal", false);
      selectClef("treble");
    } },
  { label: "7️⃣ レベル画面の『いまここ』光", note: "ト音・ヘ音を開く→レベル5が光る（ふつうは、合格していない一番下のレベル）",
    run: function () { unlockClefsToLevel5ForTest(); } },
  { label: "8️⃣ マスター結果画面（すごい→ファンファーレ→おめでとう）", note: "全カードをLv5まで開く→Lv5を全問一発正解→おめでとう→お祝い画面（LINEボタン点滅）",
    run: function (idx) {
      ["fy_ach_"].forEach(function (k) { try { localStorage.removeItem(k + idx); } catch (e) {} });
      Storage.set("fy_test_master_" + idx, false);
      unlockAllCardsToLevel5ForTest();
    } },
  { label: "🔓 ト音・ヘ音を レベル5まで開く", note: "黒音符・レベル2以上を すぐ確認",
    run: function () { unlockClefsToLevel5ForTest(); } },
  { label: "🔓 全カードを レベル5まで開く", note: "名人・レジェンドまわりを確認",
    run: function () { unlockAllCardsToLevel5ForTest(); } },
  { label: "🏅 ふよみマスターに なった直後（トップ画面）", note: "光るボタンが ここから光り始める",
    run: function (idx) {
      Storage.set("fy_test_master_" + idx, true);
      Storage.set("fy_legend_opened_" + idx, false);
      location.reload();
    } },
  { label: "♻ この生徒を はじめの状態に もどす", note: "記録・光り・テスト用の印を消す（名前は残る）", confirm: true,
    run: function (idx) {
      var re = new RegExp("(^|_)" + idx + "(_|$)");
      var kill = /best|lvfail|color|ach|test_master|legend|glow|noprac|chunk_rec|chunk_max|do_test|debug_unlocked|allkeys|gatelock|practice_guide|lv5_openall|pass_|play_/;
      var del = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if ((k.indexOf("onpu_") === 0 || k.indexOf("fy_") === 0) && re.test(k) && kill.test(k)) del.push(k);
      }
      del.forEach(function (k) { localStorage.removeItem(k); });
      location.reload();
    } }
];
