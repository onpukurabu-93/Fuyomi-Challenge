/* ===== チェック場所ジャンプ一覧（このファイルだけ入れ替えれば、一覧が変わります） ===== */
/* 先生ページ（タブ3）の一番上に ならびます。ボタンを おすと じゅんびをして その場所へ いきます。 */
window.FY_JUMPS = [
  { label: "🎼 レジェンドへのみち（はじめての状態で）", note: "intro → start の声、🎹 piano の声、スタートのロックを確認",
    run: function (idx) {
      Storage.set("fy_test_master_" + idx, true);
      ["fy_legend_intro_", "fy_legend_pianohint_", "fy_legend_pianoset_", "fy_legend_lv5voice_", "fy_lv5_openall_"].forEach(function (k) { localStorage.removeItem(k + idx); });
      Storage.set("fy_legend_opened_" + idx, true);
      location.href = "chunk_proto.html";
    } },
  { label: "🏅 ふよみマスターに なった直後（トップ画面）", note: "光るボタンが ここから光り始める",
    run: function (idx) {
      Storage.set("fy_test_master_" + idx, true);
      Storage.set("fy_legend_opened_" + idx, false);
      location.reload();
    } },
  { label: "🎨 ト音記号の えらぶ画面（色音符）", note: "色音符 ON にして レベル画面へ",
    run: function (idx) {
      Storage.set("fy_color_" + idx + "_treble", "on");
      toggleModal("managementModal", false);
      selectClef("treble");
    } },
  { label: "🎨 ヘ音記号の えらぶ画面（色音符）", note: "色音符 ON にして レベル画面へ",
    run: function (idx) {
      Storage.set("fy_color_" + idx + "_bass", "on");
      toggleModal("managementModal", false);
      selectClef("bass");
    } },
  { label: "🔓 ト音・ヘ音を レベル5まで開く", note: "黒音符・レベル2以上を すぐ確認",
    run: function () { unlockClefsToLevel5ForTest(); } },
  { label: "🔓 全カードを レベル5まで開く", note: "名人・レジェンドまわりを確認",
    run: function () { unlockAllCardsToLevel5ForTest(); } },
  { label: "♻ この生徒を はじめの状態に もどす", note: "記録・光り・テスト用の印を消す（名前は残る）", confirm: true,
    run: function (idx) {
      var re = new RegExp("(^|_)" + idx + "(_|$)");
      var kill = /best|lvfail|color|ach|test_master|legend|glow|noprac|chunk_rec|do_test|debug_unlocked/;
      var del = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if ((k.indexOf("onpu_") === 0 || k.indexOf("fy_") === 0) && re.test(k) && kill.test(k)) del.push(k);
      }
      del.forEach(function (k) { localStorage.removeItem(k); });
      location.reload();
    } }
];
