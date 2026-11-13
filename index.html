<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🎹ふよみチャレンジ</title>
<style>
* {
  box-sizing: border-box;
  touch-action: manipulation;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
html, body {
  margin: 0; padding: 0; width: 100%; height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: #fdf8ed; overflow: hidden;
  touch-action: pan-x pan-y;
}
body { display: flex; justify-content: center; align-items: center; }

.app-container {
  width: 100%; max-width: 420px; height: 100dvh; max-height: 100dvh;
  background: #fdf8ed; border-radius: 24px; overflow: hidden;
  box-shadow: 0 4px 18px rgba(0,0,0,0.08); position: relative;
  transition: background 0.3s;
}

.screen { width: 100%; height: 100%; padding: 16px; overflow-y: auto; }
.hidden { display: none !important; }

/* ヘッダー */
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.back-btn { border: none; background: transparent; color: #5b4636; font-size: 16px; cursor: pointer; font-weight: bold; }
.header-title { flex: 1; text-align: center; color: #5b4636; font-size: 20px; font-weight: 700; }
.header-spacer { width: 60px; }

/* メインタイトル */
.main-title { text-align: center; color: #5b4636; font-size: 26px; font-weight: 800; margin: 6px 0 2px; }
.main-subtitle { text-align: center; color: #806c5a; font-size: 13px; margin-bottom: 10px; }

/* じぶんの成績・プロフィールボックス */
.profile-box {
  background: white; border-radius: 16px; padding: 12px; margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center; border: 1px solid #f0e6d2;
}
.profile-label { font-size: 12px; font-weight: bold; color: #5b4636; margin-bottom: 6px; text-align: left; }

.profile-select-wrap {
  display: flex; gap: 6px; align-items: center; justify-content: center; margin-bottom: 8px;
}
.profile-select { flex: 1; padding: 10px 8px; border-radius: 10px; border: 2px solid #eadcc8; font-size: 16px; color: #5b4636; background: #fdf8ed; font-weight: bold; }
.profile-confirm-btn { background: #ff7043; color: white; border: none; border-radius: 10px; padding: 10px 14px; font-size: 14px; font-weight: 800; cursor: pointer; white-space: nowrap; }
.reg-open-btn { background: #fdf8ed; color: #806c5a; border: 1px dashed #eadcc8; border-radius: 10px; padding: 6px 10px; font-size: 12px; font-weight: 700; cursor: pointer; width: 100%; margin-bottom: 4px; }

.my-stats-summary {
  background: #fdf8ed; border-radius: 12px; padding: 6px 10px; margin: 8px 0;
  display: flex; justify-content: space-around; align-items: center; font-size: 12px; color: #5b4636;
}
.my-stat-item { text-align: center; }
.my-stat-val { font-weight: 800; color: #ff5722; font-size: 14px; }

.streak-badge {
  display: inline-block; background: #ff7043; color: white; font-size: 11px; font-weight: 800;
  padding: 2px 8px; border-radius: 20px; margin-bottom: 4px; box-shadow: 0 2px 4px rgba(255,112,67,0.3);
}
.legend-record {
  display: inline-block; margin: 0 0 4px 4px; font-size: 11px; font-weight: 800; color: #7a4f00;
  background: #fff3b0; border: 1px solid #ffd700; border-radius: 20px; padding: 2px 8px;
}
.stamp-mini-box {
  display: flex; justify-content: center; gap: 4px; margin-top: 4px; padding: 4px;
  background: #fff8e1; border-radius: 10px; border: 1px dashed #ffe082;
}
.stamp-dot { width: 20px; height: 20px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 10px; }
.stamp-dot.active { background: #ff5722; color: white; font-weight: bold; }

/* コース選択ボタン */
.select-button {
  width: 100%; border: none; border-radius: 16px; padding: 12px 10px; margin-bottom: 8px;
  background: white; color: #5b4636; font-size: 19px; font-weight: 700;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06); cursor: pointer; position: relative;
  transition: transform 0.15s, opacity 0.3s;
}
.select-button:active { transform: scale(0.98); }
.select-button.special { background: #8dbb8d; color: white; font-size: 20px; }
.select-button.ranking-btn { background: #ffd54f; color: #5b4636; border: 2px solid #ffb300; font-size: 18px; }
.select-button.accent { background: #ff7043; color: white; font-size: 20px; padding: 14px; }
.select-button.challenge { background: #b28bb9; color: white; font-size: 17px; }
.select-button:disabled { opacity: 0.25; filter: grayscale(60%); cursor: not-allowed; }

.select-button.locked {
  opacity: 0.35; filter: grayscale(40%); cursor: not-allowed; box-shadow: none;
}
.clef-row { display: flex; gap: 8px; margin-bottom: 8px; }
.clef-row .select-button { flex: 1 1 0; min-width: 0; width: auto; margin-bottom: 0; font-size: 16px; padding: 6px 4px; white-space: nowrap; min-height: 62px; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.35; }
.clef-row .lock-tag { position: static; transform: none; font-size: 12px; padding: 0 8px; margin-bottom: 2px; }
.lock-tag {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 11px; background: rgba(0,0,0,0.2); color: white; padding: 2px 6px; border-radius: 8px;
}

/* レベル画面 */
.level-list { display: flex; flex-direction: column; gap: 10px; }
.level-button {
  width: 100%; text-align: left; border: none; border-radius: 16px; background: white;
  padding: 14px; color: #5b4636; box-shadow: 0 2px 6px rgba(0,0,0,0.06); cursor: pointer; position: relative;
}
.level-button.locked { opacity: 0.4; cursor: not-allowed; }
.level-number { display: block; font-size: 16px; font-weight: 700; }
.locked-badge { position: absolute; top: 14px; right: 14px; background: #e99595; color: white; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; }

/* レベル表紙画面 */
.cover-screen {
  position: relative; width: 100%; height: 100%;
  background-color: #fdf8ed; display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.cover-img-container {
  position: relative; width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
}
.cover-screen { background-color: #fff; }
.cover-img { width: 100%; height: 100%; object-fit: contain; object-position: center bottom; position: absolute; top: 0; left: 0; }
.cover-head { position: absolute; top: 5%; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; z-index: 10; pointer-events: none; }
.cover-lv { font-size: min(9vw, 40px); font-weight: 900; color: #8a4b24; text-shadow: 3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff; line-height: 1.1; }
.cover-level-number {
  position: static; transform: none; display: flex; align-items: center; justify-content: center;
  width: min(26vw, 112px); height: min(26vw, 112px); border-radius: 50%;
  background: #ffe27a; border: 4px dashed #fff; box-shadow: 0 0 0 4px #ffd84a;
  font-size: min(16vw, 70px); font-weight: 900; color: #5b4636; text-shadow: none;
  line-height: 1; margin: 6px 0 8px;
}
.cover-chal { background: #7ec3f7; color: #fff; font-size: min(8vw, 34px); font-weight: 900; padding: 4px 26px; border-radius: 14px; border: 3px solid #fff; box-shadow: 0 0 0 3px #7ec3f7; text-shadow: 2px 2px 0 #3a8fd4; }

/* カード画面 */
.card-screen { padding: 8px; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 2px 4px 4px; gap: 6px; }
.card-back { border: none; background: transparent; color: #5b4636; font-size: 16px; cursor: pointer; font-weight: bold; }
.card-title { flex: 1; text-align: center; color: #5b4636; font-size: 18px; font-weight: 700; }
.level-badge { background: #eadcc8; color: #5b4636; border-radius: 20px; padding: 4px 8px; font-size: 12px; font-weight: 700; }
.training-btn { border: none; background: #8dbb8d; color: white; border-radius: 20px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }

/* カード表示エリア */
.card-area {
  flex: 1; background: white; border-radius: 18px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
  padding: 4px; margin-bottom: 6px; box-shadow: inset 0 0 10px rgba(0,0,0,0.02);
}
.note-card-wrap { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.note-card-img { max-width: 100%; max-height: 96%; width: auto; height: auto; object-fit: contain; }
.training-cover { position: absolute; width: 100%; height: 36%; left: 0; bottom: 0; background: white; transition: opacity 0.15s; }
.training-cover.reveal { opacity: 0; }

.q-count-badge {
  position: absolute; top: 8px; left: 8px; background: #ff7043; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 800; z-index: 10;
  box-shadow: 0 2px 6px rgba(255,112,67,0.3);
}

/* ⭕ まんまるの正円 */
.correct-circle {
  position: absolute; width: 220px; height: 220px; border: 16px solid #e99595; border-radius: 50%;
  left: 50%; top: 40%; transform: translate(-50%, -50%) scale(0.2); opacity: 0; pointer-events: none; z-index: 30;
}
.correct-circle.show { animation: correctCircle 0.3s ease-out forwards; }
@keyframes correctCircle {
  0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.incorrect-x {
  position: absolute; font-size: 140px; color: #e99595; font-weight: 900;
  left: 50%; top: 40%; transform: translate(-50%, -50%) scale(0.2); opacity: 0; pointer-events: none; z-index: 30;
}
.incorrect-x.show { animation: incorrectX 0.3s ease-out forwards; }
@keyframes incorrectX {
  0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

.arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 38px; height: 38px; border: none; border-radius: 50%; background: rgba(253,248,237,0.95); font-size: 24px; cursor: pointer; z-index: 5; }
.arrow-left { left: 4px; } .arrow-right { right: 4px; }

/* 🎹 ピアノ鍵盤 */
.keyboard {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;
  padding: 6px 4px 4px; background: #e0d0ba; border-radius: 14px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}
.fyPadBtn { padding:12px 0; font-size:20px; font-weight:900; color:#5d4037; background:#efe6d6; border:none; border-radius:10px; }
.fyPadBtn:active { transform:scale(.95); }
html, body { -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; -webkit-tap-highlight-color:transparent; }
input, textarea { -webkit-user-select:text; user-select:text; }
.key-btn {
  border: none; border-radius: 8px; min-height: 60px; color: #ffffff; font-size: 16px; font-weight: 900;
  cursor: pointer; position: relative;
  box-shadow: 0 4px 0 rgba(0,0,0,0.2), 0 5px 6px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding-bottom: 8px;
  transition: transform 0.05s ease, box-shadow 0.05s ease; text-shadow: 1px 1px 2px rgba(0,0,0,0.4);
}
.key-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 rgba(0,0,0,0.2), 0 2px 3px rgba(0,0,0,0.1); }
.key-do { background: #e8505b; } .key-re { background: #f28a1e; } .key-mi { background: #f5d90a; }
.key-fa { background: #43a047; } .key-so { background: #29b6f6; } .key-la { background: #3f51b5; } .key-si { background: #9c4dcc; }
.key-mi { color: #5a3b00; text-shadow: none; }

/* モーダル */
.modal-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 100; }
.modal-box { background: white; padding: 18px; border-radius: 20px; width: 92%; max-width: 380px; text-align: center; max-height: 85vh; overflow-y: auto; }
.modal-title { font-size: 18px; font-weight: 700; color: #5b4636; margin-bottom: 10px; }
.modal-input { width: 100%; padding: 8px; font-size: 15px; border: 2px solid #eadcc8; border-radius: 10px; margin-bottom: 8px; text-align: center; background: white; color: #5b4636; }
.modal-btn { background: #78a9c8; color: white; border: none; border-radius: 10px; padding: 10px; font-size: 14px; font-weight: 700; width: 100%; cursor: pointer; margin-top: 4px; }
.modal-btn.cancel { background: #ccc; }

.teacher-tabs { display: flex; justify-content: space-between; margin-bottom: 10px; gap: 4px; }
.teacher-tab-btn { flex: 1; padding: 7px 2px; font-size: 10.5px; font-weight: bold; border: 1px solid #eadcc8; background: #fdf8ed; border-radius: 6px; cursor: pointer; }
.teacher-tab-btn.active { background: #1976d2; color: white; border-color: #1976d2; }

/* リザルト画面 */
.result-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; position: relative; }
.result-title-big { font-size: 38px; font-weight: 900; color: #ff5722; margin-bottom: 10px; text-shadow: 2px 2px 0 #fff; }
.result-detail { font-size: 15px; color: #806c5a; margin-bottom: 4px; }

/* 🏆 表彰式モーダル */
.award-box { background: #fffdf0; border: 4px double #ffd700; border-radius: 20px; padding: 18px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
.award-box.theme-cat { background: #fff5f8; border-color: #ffb6c1; }
.award-box.theme-cool { background: #e3f2fd; border-color: #2196f3; }
.award-box.theme-game { background: #263238; color: #00e676; border-color: #00e676; }
.award-box.theme-pop { background: #fffde7; border-color: #ff4081; }

.award-trophy { font-size: 50px; margin-bottom: 6px; }
.award-title { font-size: 20px; font-weight: 900; color: #b28bb9; margin-bottom: 6px; }
.award-name { font-size: 18px; font-weight: 700; color: #5b4636; border-bottom: 2px solid #ffd700; display: inline-block; padding: 0 12px 2px; margin-bottom: 10px; }
.award-box.theme-game .award-name { color: #ffffff; border-color: #00e676; }
.award-desc { font-size: 12px; color: #806c5a; line-height: 1.4; margin-bottom: 12px; }
.award-box.theme-game .award-desc { color: #b0bec5; }

/* 👑 100回れんぞく ふよみレジェンド */
.legend-bg { background: rgba(30,20,0,0.65); }
.legend-box {
  background: linear-gradient(135deg, #fff8dc 0%, #ffd700 50%, #fff3b0 100%);
  border: 5px double #b8860b; border-radius: 22px; padding: 22px 16px; text-align: center;
  box-shadow: 0 0 30px rgba(255,215,0,0.85), 0 4px 15px rgba(0,0,0,0.3);
}
.legend-crown { font-size: 72px; line-height: 1; margin-bottom: 4px; animation: legendPop 0.6s ease-out; }
@keyframes legendPop {
  0% { transform: scale(0.2); opacity: 0; }
  60% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.legend-title { font-size: 26px; font-weight: 900; color: #7a4f00; margin-bottom: 6px; text-shadow: 1px 1px 0 #fff; }
.legend-name {
  font-size: 20px; font-weight: 800; color: #5b4636; border-bottom: 3px solid #b8860b;
  display: inline-block; padding: 0 14px 2px; margin-bottom: 10px;
}
.legend-count { font-size: 16px; font-weight: 800; color: #d84315; margin-bottom: 10px; }
.legend-comment {
  font-size: 13px; color: #5b4636; line-height: 1.6; margin-bottom: 14px;
  background: rgba(255,255,255,0.65); border-radius: 12px; padding: 10px;
}

.compare-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10.5px; }
.compare-table th, .compare-table td { border: 1px solid #eadcc8; padding: 4px 2px; text-align: center; color: #5b4636; }
.compare-table th { background: #fdf8ed; font-weight: 700; }

#confettiCanvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 50; }
</style>
</head>
<body>

<audio id="seikaiAudio" preload="auto" src="seikai.mp3"></audio>
<audio id="tfanAudio" preload="auto" src="tfan.mp3"></audio>
<audio id="hyoshoFanfare1Audio" preload="auto" src="表彰ファンファーレ1.mp3"></audio>
<audio id="hyoshoFanfareAudio" preload="auto" src="表彰ファンファーレ.mp3"></audio>
<audio id="osiAudio" preload="auto" src="osi.mp3"></audio>
<audio id="ganbatteAudio" preload="auto" src="ganbatte.mp3"></audio>
<audio id="audio6do" preload="auto" src="6do.mp3"></audio>
<audio id="audioToon1" preload="auto" src="toon1.mp3"></audio>
<audio id="audioToon2" preload="auto" src="toon2.mp3"></audio>
<audio id="audioHeon1" preload="auto" src="heon1.mp3"></audio>
<audio id="audioHeon2" preload="auto" src="heon2.mp3"></audio>
<audio id="audioKanpeki" preload="auto" src="kanpeki.mp3"></audio>
<audio id="tasseiFanfareAudio" preload="auto" src="Tassei-fanfare.mp3"></audio>
<audio id="sugoiAudio" preload="auto" src="sugoi.mp3"></audio>
<audio id="levelUp1Audio" preload="auto" src="zunda-levelup1.mp3"></audio>
<audio id="levelEncourageAudio" preload="auto" src="zunda-encourage.mp3"></audio>
<audio id="levelUp2Audio" preload="auto" src="zunda-levelup2.mp3"></audio>
<audio id="levelUp3Audio" preload="auto" src="zunda-levelup3.mp3"></audio>
<audio id="levelUp4Audio" preload="auto" src="zunda-levelup4.mp3"></audio>
<audio id="levelUp5Audio" preload="auto" src="zunda-levelup5.mp3"></audio>

<div class="app-container" id="appContainer">

  <!-- トップ画面 -->
  <section id="selectScreen" class="screen">
    <div id="fyVerBar" style="display:none;text-align:center;font-size:10px;color:#b0a090;margin:-4px 0 4px;"></div>
    <div class="main-title">ふよみチャレンジ</div>
    <div class="main-subtitle">おんぷを よんで みよう！</div>

    <!-- プレイヤー表示と選択 -->
    <div class="profile-box">
      <div class="profile-label">👤 プレイヤー選択</div>
      
      <div class="profile-select-wrap">
        <select id="profileSelect" class="profile-select">
          <!-- スクリプトで自動選択・表示 -->
        </select>
        <button class="profile-confirm-btn" onclick="confirmProfileSelect()">スタート</button>
      </div>

      <button class="reg-open-btn" onclick="openRegistration(false)">✏️ なまえを とうろく・かえる</button>

      <div class="my-stats-summary">
        <div class="my-stat-item">
          <div>ぜんかい</div>
          <div class="my-stat-val" id="myLastScore">-- %</div>
        </div>
        <div class="my-stat-item">
          <div>れんぞく</div>
          <div class="my-stat-val" id="myPerfStreak">0 回</div>
        </div>
      </div>

      <div id="streakBadge" class="streak-badge">🔥 0日れんぞく！</div>
      <div id="legendRecord" class="legend-record hidden"></div>
      <div id="stampMiniBox" class="stamp-mini-box"></div>
    </div>

    <!-- 🏆 ランキングボタン -->
    <button class="select-button ranking-btn" onclick="openRankingScreen()">🏆 みんなの成績・ランキング</button>

    <button class="select-button special" onclick="startDoLesson()">🎵 6つの「ド」をおぼえよう！</button>

    <div class="clef-row">
      <button id="btnTreble" class="select-button locked" onclick="selectClef('treble')">
        ト音記号 <span id="lockTreble" class="lock-tag">🔒</span>
      </button>
      <button id="btnBass" class="select-button locked" onclick="selectClef('bass')">
        ヘ音記号 <span id="lockBass" class="lock-tag">🔒</span>
      </button>
      <button id="btnAll" class="select-button locked" onclick="selectClef('all')">
        全カード <span id="lockAll" class="lock-tag">🔒</span>
      </button>
    </div>

    <button class="select-button challenge" style="margin-top:6px;" onclick="openManagementModal()">
      🔒 管理ページ（保護者・先生）
    </button>
  </section>

  <!-- 🏆 みんなの成績・ランキング画面 -->
  <section id="rankingScreen" class="screen hidden">
    <div class="header">
      <button class="back-btn" onclick="showSelectScreen()">＜ もどる</button>
      <div class="header-title">みんなのランキング</div>
      <div class="header-spacer"></div>
    </div>
    <div style="font-size:12px; color:#806c5a; text-align:center; margin-bottom:10px;">これまでの パーフェクト（100%）の記録！</div>
    
    <div style="font-weight:bold; color:#5b4636; font-size:14px; margin-bottom:4px;">🎼 ト音記号マスター</div>
    <div id="rankingTrebleList" style="margin-bottom:12px;"></div>

    <div style="font-weight:bold; color:#5b4636; font-size:14px; margin-bottom:4px;">𝄢 ヘ音記号マスター</div>
    <div id="rankingBassList" style="margin-bottom:12px;"></div>

    <div style="font-weight:bold; color:#5b4636; font-size:14px; margin-bottom:4px;">🃏 全カードマスター</div>
    <div id="rankingFullList" style="margin-bottom:12px;"></div>

    <div style="font-weight:bold; color:#5b4636; font-size:14px; margin-bottom:4px;">🔥 れんぞくの最高記録（どのコースでも）</div>
    <div id="rankingAllList"></div>
  </section>

  <!-- レベル選択画面 -->
  <section id="levelScreen" class="screen hidden">
    <div class="header">
      <button class="back-btn" onclick="showSelectScreen()">＜ もどる</button>
      <div class="header-title" id="levelTitle">レベル</div>
      <div class="header-spacer"></div>
    </div>
    <div id="levelList" class="level-list"></div>
  </section>

  <!-- レベル表紙画面 -->
  <section id="coverScreen" class="cover-screen hidden">
    <div class="cover-img-container">
      <img src="level_cover.jpg" class="cover-img" alt="">
      <div class="cover-head">
        <div class="cover-lv">レベル</div>
        <div id="coverLevelNumber" class="cover-level-number">1</div>
        <div class="cover-chal">チャレンジ</div>
      </div>
    </div>
  </section>

  <!-- カード画面 -->
  <section id="cardScreen" class="card-screen hidden">
    <div class="card-header">
      <button class="card-back" onclick="handleCardBack()">＜ もどる</button>
      <div class="level-badge" id="levelBadge">Lv.1</div>
      <div class="card-title" id="cardScreenTitle">おんぷカード</div>
      <button id="trainingButton" class="training-btn" onclick="startTrainingDirect(false)">トレーニング</button>
    </div>

    <div id="cardArea" class="card-area">
      <div id="qCountBadge" class="q-count-badge hidden">あと 10 問</div>
      <button id="arrowLeft" class="arrow arrow-left" onclick="previousCard()">‹</button>

      <div class="note-card-wrap">
        <img id="noteCardImg" class="note-card-img" src="" alt="音符カード">
        <div id="trainingCover" class="training-cover hidden"></div>
      </div>

      <!-- ⭕ まんまるの正円 -->
      <div id="correctCircle" class="correct-circle"></div>
      <div id="incorrectX" class="incorrect-x">×</div>
      <button id="arrowRight" class="arrow arrow-right" onclick="nextCard()">›</button>
    </div>

    <!-- 🎹 ピアノ鍵盤 (pointerdownでタッチ遅延解消) -->
    <div class="keyboard">
      <button class="key-btn key-do" onpointerdown="handleKeyPress('ド', event)">ド</button>
      <button class="key-btn key-re" onpointerdown="handleKeyPress('レ', event)">レ</button>
      <button class="key-btn key-mi" onpointerdown="handleKeyPress('ミ', event)">ミ</button>
      <button class="key-btn key-fa" onpointerdown="handleKeyPress('ファ', event)">ファ</button>
      <button class="key-btn key-so" onpointerdown="handleKeyPress('ソ', event)">ソ</button>
      <button class="key-btn key-la" onpointerdown="handleKeyPress('ラ', event)">ラ</button>
      <button class="key-btn key-si" onpointerdown="handleKeyPress('シ', event)">シ</button>
    </div>
  </section>

  <!-- リザルト画面 -->
  <section id="resultScreen" class="screen hidden">
    <canvas id="confettiCanvas"></canvas>
    <div class="result-container">
      <div class="result-title-big" id="resultTitleBig">おめでとう！</div>
      <div class="result-detail" id="resultScore">せいかい: 10/10問</div>
      <div class="result-detail" id="resultTime">タイム: 0秒</div>
      <div id="resultStreakMsg" style="font-size:14px; font-weight:800; color:#ff7043; margin-top:4px;"></div>
      
      <!-- 動的ボタン群 -->
      <div id="resultButtonsWrap" style="width:100%; margin-top:10px;"></div>
    </div>
  </section>

</div>

<!-- ✏️ 名前の登録モーダル（初回・追加・変更） -->
<div id="registerModal" class="modal-bg hidden">
  <div class="modal-box">
    <div class="modal-title">👤 なまえを とうろく</div>
    <div style="font-size:12.5px; color:#806c5a; margin-bottom:8px;">きょうしつネームを いれてね<br>（ひらがな・すうじ・8もじまで）</div>
    <div id="regSlotWrap" class="hidden">
      <div style="font-size:12px; color:#806c5a; margin-bottom:4px;">どの わくに とうろくする？</div>
      <select id="regSlotSelect" class="modal-input"></select>
    </div>
    <input type="text" id="regNameInput" class="modal-input" maxlength="8" placeholder="なまえ">
    <div style="font-size:12px; color:#806c5a; margin-bottom:4px;">がくねん・くぶん</div>
    <select id="regCategorySelect" class="modal-input"></select>
    <button class="modal-btn" style="background:#ff7043;" onclick="saveRegistration()">とうろく</button>
    <button id="regCancelBtn" class="modal-btn cancel" onclick="closeRegistration()">やめる</button>
  </div>
</div>

<!-- 生徒PIN入力モーダル -->
<div id="studentPinModal" class="modal-bg hidden">
  <div class="modal-box">
    <div class="modal-title" id="pinModalStudentName">ログイン</div>
    <div style="font-size:13px; color:#806c5a; margin-bottom:8px;">4けたの パスワード（PIN）を入れてね</div>
    <input type="password" id="studentPinInput" class="modal-input" maxlength="4" placeholder="****">
    <button class="modal-btn" onclick="verifyStudentPin()">ログイン</button>
    <button class="modal-btn cancel" onclick="toggleModal('studentPinModal', false); initProfiles();">やめる</button>
  </div>
</div>

<!-- 🏆 表彰式モーダル -->
<div id="awardModal" class="modal-bg hidden">
  <div class="modal-box award-box" id="awardBoxEl">
    <div class="award-trophy">🏆</div>
    <div class="award-title">ふよみ パーフェクトマスター</div>
    <div class="award-name" id="awardStudentName">〇〇 ちゃん</div>
    <div class="award-desc">あなたは すべての おんぷカードを かんぺきに マスターしました！ すばらしい！</div>
    <button class="modal-btn" onclick="closeAwardModal()">とじる</button>
  </div>
</div>

<!-- 👑 100回れんぞく ふよみレジェンド モーダル -->
<div id="legendModal" class="modal-bg legend-bg hidden">
  <div class="modal-box legend-box">
    <div class="legend-crown">👑</div>
    <div class="legend-title">ふよみ名人</div>
    <div class="legend-name" id="legendStudentName">〇〇 さん</div>
    <div class="legend-count">パーフェクト 100回 れんぞく！</div>
    <div class="legend-comment">
      すごい！ すごい！ 100回も れんぞくで パーフェクトなんて、まさに でんせつです！<br>
      せんせいも びっくりしました！<br>
      レッスンで せんせいに この がめんを みせてね。とくべつな ごほうびが あるよ！
    </div>
    <button class="modal-btn" style="background:#b8860b;" onclick="toggleModal('legendModal', false)">とじる</button>
  </div>
</div>

<!-- 🔒 管理モーダル（保護者・先生） -->
<div id="managementModal" class="modal-bg hidden">
  <div class="modal-box">
    <div class="modal-title">🔒 管理ページ</div>
    <div id="mgSelectSection">
      <div style="font-size:13px; color:#806c5a; margin-bottom:12px;">どちらのエリアに入りますか？</div>
      <button class="modal-btn" style="background:#8dbb8d; margin-bottom:8px;" onclick="showParentAuth()">👨👩‍‍👧 保護者専用ページ</button>
      <button class="modal-btn" style="background:#78a9c8;" onclick="showTeacherAuth()">🔑 先生専用ページ</button>
      <button class="modal-btn cancel" style="margin-top:12px;" onclick="toggleModal('managementModal', false)">閉じる</button>
    </div>

    <!-- 保護者エリア -->
    <div id="parentSection" class="hidden">
      <div id="parentAuthBox">
        <div style="font-size:12.5px; color:#806c5a; margin-bottom:8px;">保護者パスワード（初期: 0123）</div>
        <input type="password" id="parentPassInput" class="modal-input" placeholder="パスワード">
        <button class="modal-btn" onclick="verifyParentPass()">ログイン</button>
        <button class="modal-btn cancel" onclick="resetMgSection()">戻る</button>
      </div>
      <div id="parentContentBox" class="hidden">
        <div style="font-size:13px; font-weight:bold; color:#5b4636; margin-bottom:6px;">📊 学習成績</div>
        <div id="parentCompareTable"></div>
        <hr style="border:none; border-top:1px dashed #eadcc8; margin:12px 0;">
        <div style="font-size:13px; font-weight:bold; color:#5b4636; margin-bottom:6px;">🔑 パスワード変更</div>
        <input type="password" id="parentNewPassInput" class="modal-input" placeholder="新しいパスワード">
        <button class="modal-btn" onclick="changeParentPassword()">保存</button>
        <button class="modal-btn cancel" style="margin-top:8px;" onclick="toggleModal('managementModal', false)">閉じる</button>
      </div>
    </div>

    <!-- 先生エリア -->
    <div id="teacherSection" class="hidden">
      <div id="teacherAuthBox">
        <input type="password" id="teacherPassInput" class="modal-input" placeholder="先生パスワード">
        <button class="modal-btn" onclick="verifyTeacherPass()">認証</button>
        <button class="modal-btn cancel" onclick="resetMgSection()">戻る</button>
      </div>
      <div id="teacherContentBox" class="hidden">
        <div class="teacher-tabs">
          <button id="tTab1" class="teacher-tab-btn active" onclick="switchTeacherTab(1)">⚡生徒登録</button>
          <button id="tTab2" class="teacher-tab-btn" onclick="switchTeacherTab(2)">🎨表彰カード</button>
          <button id="tTab3" class="teacher-tab-btn" onclick="switchTeacherTab(3)">⚙管理・リセット</button>
        </div>

        <!-- タブ1: 生徒名前・区分・PIN登録 -->
        <div id="teacherTab1">
          <div style="font-size:12px; font-weight:bold; color:#5b4636; margin-bottom:4px; text-align:left;">生徒名・区分・4桁PIN設定</div>
          <div style="font-size:10.5px; color:#e99595; margin-bottom:6px; text-align:left;">※お名前は「ひらがな・数字」最大8字</div>
          <div id="teacherStudentConfigList"></div>
        </div>

        <!-- タブ2: 表彰カード設定＆プレビュー -->
        <div id="teacherTab2" class="hidden">
          <div style="font-size:12px; font-weight:bold; color:#5b4636; margin-bottom:6px; text-align:left;">表彰式デザイン事前設定・見本</div>
          <div id="teacherAwardThemeList"></div>
          <div style="font-size:12px; font-weight:bold; color:#5b4636; margin:12px 0 6px; text-align:left;">👑 100回れんぞく 画面の見本</div>
          <div id="teacherLegendPreviewList"></div>
        </div>

        <!-- タブ3: データリセット＆デバッグ機能 -->
        <div id="teacherTab3" class="hidden">
          <div style="font-size:12px; font-weight:bold; color:#5b4636; margin-bottom:6px; text-align:left;">✨ ふよみマスターのあとの「光るボタン」（いまのプレイヤー）</div>
          <button id="fyGlowLegendBtn" class="modal-btn" style="background:#7e57c2; font-size:12px; padding:8px; margin-bottom:6px;" onclick="fyToggleGlow('legend')">🟣 レジェンドの光</button>
          <button id="fyGlowMeijinBtn" class="modal-btn" style="background:#c9962b; font-size:12px; padding:8px; margin-bottom:12px;" onclick="fyToggleGlow('meijin')">🟡 名人の光</button>

          <div style="font-size:12px; font-weight:bold; color:#5b4636; margin-bottom:6px; text-align:left;">🧪 100回目のテスト（使っていない生徒枠で試してね）</div>
          <button class="modal-btn" style="background:#43a047; font-size:12px; padding:8px; margin-bottom:6px;" onclick="setStreak99ForTest()">🧪 いまのプレイヤーの連続を99回にする</button>
          <button class="modal-btn" style="background:#2e7d32; font-size:12px; padding:8px; margin-bottom:12px;" onclick="resetLegendForTest()">🧪 いまのプレイヤーの 👑と連続をリセット</button>

          <div style="font-size:12px; font-weight:bold; color:#5b4636; margin-bottom:6px; text-align:left;">🔓 テスト用：全鍵解除</div>
          <button class="modal-btn" style="background:#ff9800; font-size:12px; padding:8px; margin-bottom:8px;" onclick="unlockClefsToLevel5ForTest()">🔓 ト音記号・ヘ音記号を レベル5まで開く</button>
          <button class="modal-btn" style="background:#fb8c00; font-size:12px; padding:8px; margin-bottom:12px;" onclick="unlockAllCardsToLevel5ForTest()">🔓 全カードを レベル5まで開く</button>

          <div style="font-size:12px; font-weight:bold; color:#5b4636; margin-bottom:6px; text-align:left;">保護者パスワード初期化</div>
          <button class="modal-btn" style="background:#e99595; font-size:12px; padding:8px; margin-bottom:12px;" onclick="resetParentPasswordByTeacher()">保護者パスワードを [ 0123 ] にリセット</button>
          
          <div style="font-size:12px; font-weight:bold; color:#5b4636; margin-bottom:6px; text-align:left;">全データの完全初期化</div>
          <button class="modal-btn" style="background:#d32f2f; font-size:12px; padding:8px;" onclick="resetAllDataForTest()">⚠️ 全データを消去して初期状態に戻す</button>
        </div>

        <button class="modal-btn cancel" style="margin-top:12px;" onclick="toggleModal('managementModal', false)">閉じる</button>
      </div>
    </div>

  </div>
</div>

<script>
/* ストレージ管理 (一貫したJSONエンコード・デコード処理) */
const Storage = {
  get: (key, defaultValue = null) => {
    try {
      const data = localStorage.getItem(key);
      return data !== null ? JSON.parse(data) : defaultValue;
    } catch { return defaultValue; }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  },
  getNumber: (key, defaultValue = 0) => {
    const val = Storage.get(key, defaultValue);
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
};

/* 🏆 表彰式を自動で出すときの設定
   true  = 全カードを初めてパーフェクトにしたときだけ、自動で表彰式が出る
   false = 全カードでパーフェクトを取るたびに、自動で表彰式が出る */
const AUTO_AWARD_ONLY_FIRST = true;

/* 🔑 先生パスワード */
const TEACHER_PASSWORD = "hello.k2km";

/* 学年（区分）のリストおよび4月1日自動進級定義 */
const CATEGORIES = [
  "プレ", "年少", "年中", "年長",
  "小1", "小2", "小3", "小4", "小5", "小6",
  "中1", "中2", "中3", "高校生", "大学・一般"
];

const DEFAULT_PROFILES = ["せいと1", "せいと2", "せいと3"];

function getNextCategory(currentCat) {
  const idx = CATEGORIES.indexOf(currentCat);
  if (idx === -1 || idx >= CATEGORIES.length - 1) return currentCat;
  return CATEGORIES[idx + 1];
}

function checkAutoGradePromotion() {
  const lastPromotedYear = Storage.getNumber("onpu_last_promoted_year", 0);
  const now = new Date();
  const currentYear = now.getFullYear();
  const aprilFirst = new Date(currentYear, 3, 1);
  
  if (lastPromotedYear > 0 && now >= aprilFirst && lastPromotedYear < currentYear) {
    let profs = Storage.get("onpu_profiles", DEFAULT_PROFILES.slice());
    profs.forEach((_, idx) => {
      let curCat = Storage.get(`onpu_category_${idx}`, "年少");
      let nextCat = getNextCategory(curCat);
      Storage.set(`onpu_category_${idx}`, nextCat);
    });
    Storage.set("onpu_last_promoted_year", currentYear);
  } else if (lastPromotedYear === 0) {
    Storage.set("onpu_last_promoted_year", currentYear);
  }
}

function toggleModal(modalId, show = true) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.toggle("hidden", !show);
}

/* 👑 100回れんぞく達成の記録（回数）と称号（名前の前につく王冠） */
function getLegendCount(idx) {
  const n = Storage.getNumber(`onpu_legend_count_${idx}`, 0);
  if (n > 0) return n;
  return Storage.get(`onpu_legend_${idx}`, false) ? 1 : 0;
}

function legendMark(idx) {
  return getLegendCount(idx) > 0 ? "🏅 " : "";
}

/* ⏱ 残っているタイマーを管理（連打や画面移動でタイマーが重ならないようにする） */
let nextQuestionTimer = null;
let coverTimer = null;
let legendTimer = null;
let awardTimer = null;
let resultUnlockTimer = null;
let fanfareTimer = null;
let levelUpCoverMs = 0;
let confettiRafId = null;

/* 結果画面のボタンを、自動の表彰式が閉じられるまで薄くしておくための印 */
let resultButtonsLockedForAward = false;

function clearPendingTimers() {
  if (nextQuestionTimer !== null) { clearTimeout(nextQuestionTimer); nextQuestionTimer = null; }
  if (coverTimer !== null) { clearTimeout(coverTimer); coverTimer = null; }
  if (legendTimer !== null) { clearTimeout(legendTimer); legendTimer = null; }
  if (awardTimer !== null) { clearTimeout(awardTimer); awardTimer = null; }
  if (resultUnlockTimer !== null) { clearTimeout(resultUnlockTimer); resultUnlockTimer = null; }
  if (fanfareTimer !== null) { clearTimeout(fanfareTimer); fanfareTimer = null; }
}

function stopConfetti() {
  if (confettiRafId !== null) { cancelAnimationFrame(confettiRafId); confettiRafId = null; }
  const canvas = document.getElementById("confettiCanvas");
  if (canvas) {
    const cctx = canvas.getContext("2d");
    cctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function navigateTo(screenId) {
  clearPendingTimers();
  stopConfetti();
  resultButtonsLockedForAward = false;
  document.querySelectorAll(".screen, .card-screen, .cover-screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(screenId)?.classList.remove("hidden");
  try { fyClearNudges(); if (screenId === "selectScreen") setTimeout(fyWakabaTop, 600); } catch (e) {}
}

/* 🔊 高速サウンド処理 (Web Audio API) */
let audioCtx = null;
let masterGain = null;
let audioInitialized = false;
let lastRebuildTime = 0;

/* 音の機能を作る。止まっていたら再開を試す */
function getAudioContext() {
  if (audioCtx && audioCtx.state === 'closed') {
    audioCtx = null;
    masterGain = null;
  }
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = audioCtx.createDynamicsCompressor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(comp);
    comp.connect(audioCtx.destination);
  }
  if (audioCtx.state !== 'running') {
    try {
      const p = audioCtx.resume();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }
  return audioCtx;
}

/* 再開してもだめなときは、音の機能を作り直す */
function rebuildAudioContext() {
  const nowMs = Date.now();
  if (nowMs - lastRebuildTime < 1500) return;
  lastRebuildTime = nowMs;
  try { if (audioCtx) audioCtx.close(); } catch (e) {}
  audioCtx = null;
  masterGain = null;
  activeVoices.length = 0;
  Object.keys(activeSources).forEach(id => { activeSources[id] = null; });
  getAudioContext();
}

/* 音の機能が動き始めるのを待ってから、音を鳴らす */
function runWithAudio(fn) {
  let ctx;
  try { ctx = getAudioContext(); } catch (e) { fn(null); return; }
  if (ctx.state === 'running') { fn(ctx); return; }

  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    let c = audioCtx;
    if (!c || c.state !== 'running') {
      try { rebuildAudioContext(); c = audioCtx; } catch (e) {}
    }
    try { fn(c); } catch (e) {}
  };
  try {
    const p = ctx.resume();
    if (p && p.then) p.then(go).catch(go); else go();
  } catch (e) { go(); }
  setTimeout(go, 200);
}

function initAudioContext() {
  if (audioInitialized) return;
  audioInitialized = true;
  try { getAudioContext(); } catch (e) {}
  loadAllSounds();
}

document.addEventListener('touchstart', initAudioContext, {once:true});
document.addEventListener('mousedown', initAudioContext, {once:true});
document.addEventListener('pointerdown', initAudioContext, {once:true});

/* どこをタッチしても、止まっていた音の機能を再開する */
document.addEventListener('pointerdown', () => {
  if (audioInitialized && audioCtx && audioCtx.state !== 'running') {
    try { getAudioContext(); } catch (e) {}
  }
}, true);

/* 画面にもどってきたときも、音の機能を再開する */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && audioInitialized) {
    try { getAudioContext(); } catch (e) {}
  }
});

/* 効果音を最初に1回だけ読み込んで使い回す（連打しても重くならない） */
const soundIds = [
  "seikaiAudio", "tfanAudio", "hyoshoFanfare1Audio", "hyoshoFanfareAudio",
  "osiAudio", "ganbatteAudio", "audio6do", "audioToon1", "audioToon2",
  "audioHeon1", "audioHeon2", "audioKanpeki", "tasseiFanfareAudio", "sugoiAudio",
  "levelUp1Audio", "levelEncourageAudio", "levelUp2Audio", "levelUp3Audio", "levelUp4Audio", "levelUp5Audio"
];
const soundBuffers = {};
const activeSources = {};
let soundsLoading = false;

function loadAllSounds() {
  if (soundsLoading) return;
  soundsLoading = true;
  let ctx;
  try { ctx = getAudioContext(); } catch (e) { return; }
  soundIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const url = el.getAttribute("src");
    try {
      fetch(url)
        .then(r => { if (!r.ok) throw new Error("load error"); return r.arrayBuffer(); })
        .then(data => new Promise((resolve, reject) => { ctx.decodeAudioData(data, resolve, reject); }))
        .then(buf => { soundBuffers[id] = buf; })
        .catch(() => {});
    } catch (e) {}
  });
}

/* 音の長さ（ミリ秒）を調べる。分からないときは 0 を返す */
function getSoundDurationMs(audioId) {
  const buf = soundBuffers[audioId];
  if (buf && buf.duration) return buf.duration * 1000;
  const el = document.getElementById(audioId);
  if (el && isFinite(el.duration) && el.duration > 0) return el.duration * 1000;
  return 0;
}

/* 間違い音（連続で鳴りすぎないよう間隔を制限） */
let lastPokonTime = 0;
function playPokon() {
  const nowMs = Date.now();
  if (nowMs - lastPokonTime < 70) return;
  lastPokonTime = nowMs;

  runWithAudio(ctx => {
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain); gain.connect(masterGain);
      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch (e) {}
      };
      osc.start(now); osc.stop(now + 0.12);
    } catch (e) {}
  });
}

/* 音符周波数テーブル */
const noteFrequencies = {
  "h_cdo": 65.41,  "h_dre": 73.42,  "h_emi": 82.41,  "h_ffa": 87.31,  "h_gso": 98.00,  "h_ara": 110.00, "h_bsi": 123.47,
  "h_aRa1": 110.00, "h_bSi1": 123.47,
  "h_c00": 130.81, "h_d": 146.83,   "h_e": 164.81,   "h_f": 174.61,   "h_g": 196.00,   "h_a0": 220.00,  "h_b0": 246.94,
  "h_c1": 261.63,  "h_d1": 293.66,  "h_e1": 329.63,  "h_f1": 349.23,  "t_e": 164.81,   "t_f": 174.61,   "t_g": 196.00,
  "t_a": 220.00,   "t_b": 246.94,   "t_c1": 261.63,  "t_d1": 293.66,  "t_e1": 329.63,  "t_f1": 349.23,  "t_g1": 392.00,
  "t_a1": 440.00,  "t_b1": 493.88,  "t_c2": 523.25,  "t_d2": 587.33,  "t_e2": 659.25,  "t_f2": 698.46,  "t_g2": 783.99,
  "t_a2": 880.00,  "t_b2": 987.77,  "t_c3": 1046.50, "t_d3": 1174.66, "t_e3": 1318.51
};
const defaultKeyFreqs = { "ド": 261.63, "レ": 293.66, "ミ": 329.63, "ファ": 349.23, "ソ": 392.00, "ラ": 440.00, "シ": 493.88 };

/* ピアノ音：同時に鳴る音は最大4つまで（古い音は自動で消す） */
const activeVoices = [];
const MAX_VOICES = 4;

function playNoteSound(cardId, noteKey) {
  runWithAudio(ctx => {
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const freq = noteFrequencies[cardId] || defaultKeyFreqs[noteKey] || 440;

      while (activeVoices.length >= MAX_VOICES) {
        const old = activeVoices.shift();
        try {
          old.gain.gain.cancelScheduledValues(now);
          old.gain.gain.setTargetAtTime(0, now, 0.01);
          old.osc1.stop(now + 0.06);
          old.osc2.stop(now + 0.06);
        } catch (e) {}
      }

      const osc1 = ctx.createOscillator(), osc2 = ctx.createOscillator(), gain = ctx.createGain();

      osc1.type = 'triangle'; osc1.frequency.setValueAtTime(freq, now);
      osc2.type = 'sine'; osc2.frequency.setValueAtTime(freq * 2, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc1.connect(gain); osc2.connect(gain); gain.connect(masterGain);

      const voice = { osc1, osc2, gain };
      activeVoices.push(voice);
      osc1.onended = () => {
        const i = activeVoices.indexOf(voice);
        if (i !== -1) activeVoices.splice(i, 1);
        try { osc1.disconnect(); osc2.disconnect(); gain.disconnect(); } catch (e) {}
      };

      osc1.start(now); osc2.start(now);
      osc1.stop(now + 0.8); osc2.stop(now + 0.8);
    } catch (e) {}
  });
}

/* 予備：audioタグで鳴らす */
function playAudioElementFallback(audioId) {
  const el = document.getElementById(audioId);
  if (!el) return;
  try {
    el.currentTime = 0;
    el.volume = (audioId === "seikaiAudio") ? 0.55 : 1;
    const p = el.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
}

/* 効果音再生（読み込み済みの音を使い回し、同じ音は前の音を止めて最初から鳴らす） */
function playAudioCloned(audioId) {
  runWithAudio(ctx => {
    const buf = soundBuffers[audioId];
    if (ctx && buf && ctx.state === 'running') {
      try {
        const prev = activeSources[audioId];
        if (prev) {
          try { prev.stop(); } catch (e) {}
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        /* 正解の「ピンポン」は はやく つづくと みみに ひびくので、すこし ちいさく */
        if (audioId === "seikaiAudio") {
          const g = ctx.createGain(); g.gain.value = 0.55;
          src.connect(g); g.connect(masterGain);
        } else {
          src.connect(masterGain);
        }
        src.onended = () => {
          if (activeSources[audioId] === src) activeSources[audioId] = null;
          try { src.disconnect(); } catch (e) {}
        };
        activeSources[audioId] = src;
        src.start(0);
        return;
      } catch (e) {}
    }
    /* まだ読み込めていない・音の機能が動かないときは、予備のaudioタグで鳴らす */
    playAudioElementFallback(audioId);
  });
}

/* アニメーションを最初からやり直す */
function restartAnimation(el) {
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
}

/* カードデータ */
const doCards = [
  { id:"h_c1", key:"ド", img:"h_c1.png" }, { id:"t_c1", key:"ド", img:"t_c1.png" },
  { id:"h_c00", key:"ド", img:"h_c00.png" }, { id:"h_cdo", key:"ド", img:"h_cdo.png" },
  { id:"t_c2", key:"ド", img:"t_c2.png" }, { id:"t_c3", key:"ド", img:"t_c3.png" }
];

const trebleCards = {
  1: [ { id:"t_c1", key:"ド", img:"t_c1.png" }, { id:"t_d1", key:"レ", img:"t_d1.png" }, { id:"t_e1", key:"ミ", img:"t_e1.png" }, { id:"t_f1", key:"ファ", img:"t_f1.png" }, { id:"t_g1", key:"ソ", img:"t_g1.png" }, { id:"t_a1", key:"ラ", img:"t_a1.png" }, { id:"t_b1", key:"シ", img:"t_b1.png" }, { id:"t_c2", key:"ド", img:"t_c2.png" } ],
  2: [ { id:"t_c2", key:"ド", img:"t_c2.png" }, { id:"t_d2", key:"レ", img:"t_d2.png" }, { id:"t_e2", key:"ミ", img:"t_e2.png" }, { id:"t_f2", key:"ファ", img:"t_f2.png" }, { id:"t_g2", key:"ソ", img:"t_g2.png" }, { id:"t_a2", key:"ラ", img:"t_a2.png" }, { id:"t_b2", key:"シ", img:"t_b2.png" }, { id:"t_c3", key:"ド", img:"t_c3.png" } ],
  3: [ { id:"t_c3", key:"ド", img:"t_c3.png" }, { id:"t_d3", key:"レ", img:"t_d3.png" }, { id:"t_e3", key:"ミ", img:"t_e3.png" } ],
  4: [ { id:"t_e", key:"ミ", img:"t_e.png" }, { id:"t_f", key:"ファ", img:"t_f.png" }, { id:"t_g", key:"ソ", img:"t_g.png" }, { id:"t_a", key:"ラ", img:"t_a.png" }, { id:"t_b", key:"シ", img:"t_b.png" }, { id:"t_c1", key:"ド", img:"t_c1.png" }, { id:"t_d1", key:"レ", img:"t_d1.png" }, { id:"t_e1", key:"ミ", img:"t_e1.png" }, { id:"t_f1", key:"ファ", img:"t_f1.png" } ]
};
trebleCards[5] = [ ...trebleCards[1], ...trebleCards[2], ...trebleCards[3], ...trebleCards[4] ];

const bassCards = {
  1: [ { id:"h_c00", key:"ド", img:"h_c00.png" }, { id:"h_d", key:"レ", img:"h_d.png" }, { id:"h_e", key:"ミ", img:"h_e.png" }, { id:"h_f", key:"ファ", img:"h_f.png" }, { id:"h_g", key:"ソ", img:"h_g.png" }, { id:"h_a0", key:"ラ", img:"h_a0.png" }, { id:"h_b0", key:"シ", img:"h_b0.png" }, { id:"h_c1", key:"ド", img:"h_c1.png" } ],
  2: [ { id:"h_c00", key:"ド", img:"h_c00.png" }, { id:"h_bsi", key:"シ", img:"h_bsi.png" }, { id:"h_ara", key:"ラ", img:"h_ara.png" }, { id:"h_gso", key:"ソ", img:"h_gso.png" }, { id:"h_ffa", key:"ファ", img:"h_ffa.png" }, { id:"h_emi", key:"ミ", img:"h_emi.png" }, { id:"h_dre", key:"レ", img:"h_dre.png" }, { id:"h_cdo", key:"ド", img:"h_cdo.png" } ],
  3: [ { id:"h_cdo", key:"ド", img:"h_cdo.png" }, { id:"h_bSi1", key:"シ", img:"h_bSi1.png" }, { id:"h_aRa1", key:"ラ", img:"h_aRa1.png" } ],
  4: [ { id:"h_f1", key:"ファ", img:"h_f1.png" }, { id:"h_e1", key:"ミ", img:"h_e1.png" }, { id:"h_d1", key:"レ", img:"h_d1.png" }, { id:"h_c1", key:"ド", img:"h_c1.png" }, { id:"h_b0", key:"シ", img:"h_b0.png" }, { id:"h_a0", key:"ラ", img:"h_a0.png" }, { id:"h_g", key:"ソ", img:"h_g.png" }, { id:"h_f", key:"ファ", img:"h_f.png" }, { id:"h_e", key:"ミ", img:"h_e.png" } ]
};
bassCards[5] = [ ...bassCards[1], ...bassCards[2], ...bassCards[3], ...bassCards[4] ];

const allCards = { 1: [ ...trebleCards[1] ], 2: [ ...trebleCards[4] ], 3: [ ...bassCards[2] ], 4: [ ...trebleCards[5] ], 5: [ ...trebleCards[5], ...bassCards[5] ] };

/* 状態管理 */
let profiles = Storage.get("onpu_profiles", DEFAULT_PROFILES.slice());
let activeProfileIndex = Storage.getNumber("onpu_active_profile", 0);
let pendingSelectIndex = null;

let selectedClef = null, selectedLevel = null, currentCards = [];
let currentIndex = 0, trainingMode = false, trainingLocked = false, lastTrainingIndex = -1;
let targetValue = 10;
let trainingCorrectCount = 0, trainingMistakes = 0, trainingStartTime = 0;

/* 👤 名前が登録されている枠かどうか
   （登録した印がある、または、初期の名前から変わっている枠） */
function isRegistered(idx) {
  if (Storage.get(`onpu_registered_${idx}`, false)) return true;
  return !!(profiles[idx] && profiles[idx] !== DEFAULT_PROFILES[idx]);
}

function hasAnyRegistered() {
  for (let i = 0; i < 3; i++) { if (isRegistered(i)) return true; }
  return false;
}

function hasLevelCleared(profileIndex, clef, level) {
  if (Storage.get(`onpu_debug_unlocked_${profileIndex}`)) return true;
  const oldBest = Storage.get(`onpu_count_best_${profileIndex}_${clef}_${level}`);
  if (oldBest && oldBest.count >= 20 && oldBest.accuracy >= 90) return true;
  const best20 = Storage.get(`onpu_best_20_${profileIndex}_${clef}_${level}`);
  return !!(best20 && best20.accuracy >= 90);
}

function getDoTestBest(profileIndex) { return Storage.get(`onpu_do_test_best_${profileIndex}`); }

function calculateStreak(profileIndex) {
  const days = Storage.get(`onpu_days_${profileIndex}`, []);
  if (!Array.isArray(days) || !days.length) return 0;
  days.sort();
  let streak = 0, today = new Date();
  for (let i = 0; i < 30; i++) {
    let dStr = new Date(today.getTime() - i * 86400000).toISOString().split("T")[0];
    if (days.includes(dStr)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function renderStampMini(profileIndex) {
  const stamps = Storage.getNumber(`onpu_stamps_${profileIndex}`, 0);
  const container = document.getElementById("stampMiniBox");
  container.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const dot = document.createElement("div");
    dot.className = `stamp-dot ${i <= (stamps % 10 || (stamps > 0 ? 10 : 0)) ? 'active' : ''}`;
    dot.textContent = i <= (stamps % 10 || (stamps > 0 ? 10 : 0)) ? "💮" : i;
    container.appendChild(dot);
  }
}

function updateLockVisuals() {
  const isDebugUnlocked = Storage.get(`onpu_debug_unlocked_${activeProfileIndex}`);
  const doBest = getDoTestBest(activeProfileIndex);
  const clefUnlocked = isDebugUnlocked || !!(doBest && doBest.accuracy >= 90);
  const trebleCleared = isDebugUnlocked || hasLevelCleared(activeProfileIndex, "treble", 5);
  const bassCleared = isDebugUnlocked || hasLevelCleared(activeProfileIndex, "bass", 5);
  const allUnlocked = isDebugUnlocked || (clefUnlocked && trebleCleared && bassCleared);

  const btnT = document.getElementById("btnTreble");
  const btnB = document.getElementById("btnBass");
  const btnA = document.getElementById("btnAll");

  btnT.classList.toggle("locked", !clefUnlocked);
  document.getElementById("lockTreble").style.display = clefUnlocked ? "none" : "inline";

  btnB.classList.toggle("locked", !clefUnlocked);
  document.getElementById("lockBass").style.display = clefUnlocked ? "none" : "inline";

  btnA.classList.toggle("locked", !allUnlocked);
  document.getElementById("lockAll").style.display = allUnlocked ? "none" : "inline";
}

/* 初期化とプロフィールの読み込み */
function initProfiles() {
  checkAutoGradePromotion();
  profiles = Storage.get("onpu_profiles", DEFAULT_PROFILES.slice());

  /* 今のプレイヤーが未登録なら、登録済みの最初の枠に切り替える */
  if (!isRegistered(activeProfileIndex)) {
    for (let i = 0; i < 3; i++) {
      if (isRegistered(i)) { activeProfileIndex = i; Storage.set("onpu_active_profile", i); break; }
    }
  }

  const select = document.getElementById("profileSelect");
  select.innerHTML = '';
  profiles.forEach((name, idx) => {
    if (name && isRegistered(idx)) {
      const category = Storage.get(`onpu_category_${idx}`, "年少");
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = `${legendMark(idx)}${name} (${category})`;
      if (idx === activeProfileIndex) opt.selected = true;
      select.appendChild(opt);
    }
  });
  
  document.getElementById("streakBadge").textContent = `🔥 ${calculateStreak(activeProfileIndex)}日れんぞく！`;

  const legendBox = document.getElementById("legendRecord");
  const legendCount = getLegendCount(activeProfileIndex);
  if (legendCount > 0) {
    legendBox.textContent = `🏅 ふよみ名人（100回れんぞく） ×${legendCount}`;
    legendBox.classList.remove("hidden");
  } else {
    legendBox.textContent = "";
    legendBox.classList.add("hidden");
  }
  
  const lastAcc = Storage.get(`onpu_last_acc_${activeProfileIndex}`, null);
  document.getElementById("myLastScore").textContent = lastAcc !== null ? `${lastAcc}%` : "-- %";
  
  const perfStreak = Storage.getNumber(`onpu_perf_streak_${activeProfileIndex}`, 0);
  document.getElementById("myPerfStreak").textContent = `${perfStreak} 回`;

  renderStampMini(activeProfileIndex);
  updateLockVisuals();
}

/* ✏️ 名前の登録（初回・追加・変更。PINなし） */
let registerFirstTime = false;

function openRegistration(firstTime) {
  registerFirstTime = !!firstTime;
  profiles = Storage.get("onpu_profiles", DEFAULT_PROFILES.slice());

  const catSel = document.getElementById("regCategorySelect");
  catSel.innerHTML = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("");
  catSel.value = "年少";

  const slotWrap = document.getElementById("regSlotWrap");
  const slotSel = document.getElementById("regSlotSelect");
  if (registerFirstTime) {
    slotWrap.classList.add("hidden");
    document.getElementById("regCancelBtn").classList.add("hidden");
  } else {
    slotWrap.classList.remove("hidden");
    document.getElementById("regCancelBtn").classList.remove("hidden");
    let firstFree = -1;
    let html = "";
    for (let i = 0; i < 3; i++) {
      const reg = isRegistered(i);
      if (!reg && firstFree === -1) firstFree = i;
      html += `<option value="${i}">わく${i + 1}（${reg ? profiles[i] : "あき"}）</option>`;
    }
    slotSel.innerHTML = html;
    slotSel.value = String(firstFree === -1 ? activeProfileIndex : firstFree);
  }

  document.getElementById("regNameInput").value = "";
  toggleModal("registerModal", true);
}

function closeRegistration() {
  toggleModal("registerModal", false);
}

function saveRegistration() {
  const rawName = document.getElementById("regNameInput").value.trim();
  if (!rawName || !/^[\u3040-\u309Fー0-9a-zA-Z]+$/.test(rawName)) {
    alert("なまえは、ひらがな・すうじ・アルファベットで、いれてね！");
    return;
  }
  const category = document.getElementById("regCategorySelect").value;
  const slot = registerFirstTime ? 0 : parseInt(document.getElementById("regSlotSelect").value, 10);

  for (let i = 0; i < 3; i++) {
    if (i !== slot && isRegistered(i) && profiles[i] === rawName) {
      alert("おなじ なまえが あるよ。ちがう なまえに してね！");
      return;
    }
  }

  if (!registerFirstTime && isRegistered(slot) && profiles[slot] !== rawName) {
    if (!confirm(`わく${slot + 1} の「${profiles[slot]}」を「${rawName}」に かえますか？\n（きろくは そのまま のこります）`)) return;
  }

  const wasRegistered = isRegistered(slot);
  profiles[slot] = rawName;
  Storage.set("onpu_profiles", profiles);
  Storage.set(`onpu_category_${slot}`, category);
  if (!wasRegistered) Storage.set(`onpu_pin_${slot}`, "0000");
  Storage.set(`onpu_registered_${slot}`, true);

  activeProfileIndex = slot;
  Storage.set("onpu_active_profile", slot);

  toggleModal("registerModal", false);
  initProfiles();
}

/* 🎉 とうろくの あとの ごあいさつ（はじめて とうろくした ときだけ） */
function showWelcome(name) {
  var old = document.getElementById("fyWelcome"); if (old) old.remove();
  var d = document.createElement("div");
  d.id = "fyWelcome";
  d.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:10001;background:rgba(60,40,20,.55);display:flex;align-items:center;justify-content:center;padding:18px;";
  var safe = String(name).replace(/[&<>"]/g, "");
  d.innerHTML = '<div style="background:#fffaf0;border:3px solid #ffb74d;border-radius:20px;padding:22px 18px;max-width:340px;width:100%;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.3);">' +
    '<div style="font-size:44px;line-height:1.1;">🎉🎼</div>' +
    '<div style="font-size:21px;font-weight:900;color:#e65100;margin:8px 0;">ようこそ、' + safe + ' さん！</div>' +
    '<div style="font-size:15px;font-weight:700;color:#5d4037;line-height:1.8;">ふよみチャレンジへ ようこそ。<br>おんぷが すらすら よめるように なる<br>ぼうけんの はじまりだよ。<br><br>まちがえても だいじょうぶ！<br>1もん ずつ、たのしく いこうね。<br>せんせいも おうえんしてるよ 🌟</div>' +
    '<button id="fyWelcomeGo" style="margin-top:16px;width:100%;padding:14px;font-size:18px;font-weight:900;color:#fff;background:#ff7043;border:none;border-radius:14px;">はじめる ▶</button></div>';
  document.body.appendChild(d);
  /* 先生の こえ → ずんだもんの こえ（1つの audio で つづけて ならす。「はじめる」で すぐ とまる） */
  var au = null, stopped = false;
  try {
    var files = ["zunda-youkoso.mp3", "zunda-welcome.mp3"], k = 0;
    au = new Audio(files[0]);
    /* こえが おわったら「はじめる」を ひからせる（3さいは、ひかったら おす） */
    var glowGo = function () {
      if (stopped) return;
      var gb = document.getElementById("fyWelcomeGo");
      if (gb) { try { fyGlowCss(); } catch (e) {} gb.classList.add("fyNudge"); }
    };
    setTimeout(glowGo, 30000);   /* こえが ならなかった ときの ほけん */
    var adv = function () {
      k++;
      if (!stopped && k < files.length) { au.src = files[k]; var q = au.play(); if (q && q.catch) q.catch(function () {}); }
      else glowGo();
    };
    au.addEventListener("ended", adv);
    au.addEventListener("error", adv);
    var p0 = au.play(); if (p0 && p0.catch) p0.catch(function () {});
  } catch (e) {}
  document.getElementById("fyWelcomeGo").addEventListener("click", function () {
    stopped = true;
    try { if (au) { au.pause(); au.removeAttribute("src"); au.load(); } } catch (e) {}
    d.remove();
    try { showGuide(); } catch (e) {}
  });
}

/* ✨ ひかる あんない（3さいでも わかる：こえ ＋ ひかる わく ＋ ゆび） */
function fyGlowCss() {
  if (document.getElementById("fyGlowCss")) return;
  var st = document.createElement("style"); st.id = "fyGlowCss";
  st.textContent = "@keyframes fyPulse{0%{box-shadow:0 0 0 0 rgba(255,179,0,.85);transform:scale(1)}50%{transform:scale(1.05)}100%{box-shadow:0 0 0 18px rgba(255,179,0,0);transform:scale(1)}}" +
    "@keyframes fyBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}" +
    ".fyPulseRing{animation:fyPulse 1.1s ease-out infinite}" +
    "@keyframes fyBounce2{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}" +
    ".fyNudge.fyRel{position:relative;}" +
    "@keyframes fyPulseB{0%{box-shadow:0 0 0 0 rgba(255,179,0,.85)}100%{box-shadow:0 0 0 18px rgba(255,179,0,0)}}" +
    ".fyNudge.arrow{animation:fyPulseB 1.2s ease-out infinite;}" +
    ".fyNudge{outline:4px solid #ffb300;outline-offset:2px;animation:fyPulse 1.2s ease-out infinite;}" +
    ".fyNudge.fyUp::after{bottom:auto;top:-40px;content:\"👇\";}" +
    ".fyNudge::after{content:\"👆\";position:absolute;left:50%;bottom:-40px;font-size:32px;line-height:1;pointer-events:none;animation:fyBounce2 .7s ease-in-out infinite;z-index:5;}";
  document.head.appendChild(st);
}
/* ✨ マスターのあとの 光るボタン：生徒さんごとに、先生が 入／切 できる */
function fyGlowOn(idx, kind) { try { return Storage.get("fy_glow_" + kind + "_" + idx, "on") !== "off"; } catch (e) { return true; } }
function fyGlowLabels() {
  try {
    var l = document.getElementById("fyGlowLegendBtn"), m = document.getElementById("fyGlowMeijinBtn");
    if (l) l.textContent = "🟣 レジェンドの光：" + (fyGlowOn(activeProfileIndex, "legend") ? "入（光る）" : "切（光らない）");
    if (m) m.textContent = "🟡 名人の光：" + (fyGlowOn(activeProfileIndex, "meijin") ? "入（光る）" : "切（光らない）");
  } catch (e) {}
}
function fyToggleGlow(kind) {
  Storage.set("fy_glow_" + kind + "_" + activeProfileIndex, fyGlowOn(activeProfileIndex, kind) ? "off" : "on");
  fyGlowLabels();
  try { if (window.fyRefreshLegendBtn) window.fyRefreshLegendBtn(); } catch (e) {}
}
(function () {
  var o = window.renderTeacherView || renderTeacherView;
  window.renderTeacherView = function () { var r = o.apply(this, arguments); fyGlowLabels(); return r; };
})();
/* 🔢 版の ばんごう（テスト中だけ トップ画面の いちばん上に 出す。公開の まえに SHOW_VERSION を false に する） */
var SHOW_VERSION = true;
var FY_INDEX_VER = "1113v";
function fyShowVersion() {
  try {
    var el = document.getElementById("fyVerBar"); if (!el || !SHOW_VERSION) return;
    var ex = window.FY_EXTRAS_VER || "（app-extras なし）";
    var ok = (ex === FY_INDEX_VER);
    el.style.display = "block";
    el.style.color = ok ? "#b0a090" : "#d32f2f"; el.style.fontWeight = ok ? "400" : "800";
    el.textContent = ok ? ("版 " + FY_INDEX_VER) : ("⚠ ファイルが そろっていません　index " + FY_INDEX_VER + " / app-extras " + ex);
  } catch (e) {}
}
window.addEventListener("load", function () { setTimeout(fyShowVersion, 400); });
/* 🎨 いろおんぷ（ようじ むけ：レベル1だけ。くろおんぷは レベル1から べつに すすむ） */
var FY_HEADS = {"t_c1": [530.5, 591.8, 31.2, 22.0, 140.2], "t_d1": [535.3, 562.5, 32.8, 22.3, 132.1], "t_e1": [528.3, 546.1, 31.0, 21.7, 141.7], "t_f1": [525.0, 521.6, 33.9, 22.5, 126.4], "t_g1": [529.8, 497.6, 31.6, 22.1, 141.4], "t_a1": [527.0, 476.1, 34.4, 22.5, 125.7], "t_b1": [534.3, 452.5, 31.7, 22.1, 141.5], "t_c2": [527.8, 428.2, 33.9, 22.5, 126.7], "h_c1": [534.8, 813.4, 31.2, 22.1, 140.4], "h_b0": [523.9, 842.1, 32.4, 22.4, 133.2], "h_a0": [525.6, 858.9, 31.0, 21.7, 141.4], "h_g": [527.0, 885.3, 34.8, 22.6, 125.6], "h_f": [529.9, 903.0, 31.1, 21.7, 141.5], "h_e": [522.3, 929.0, 34.4, 22.8, 126.0], "h_d": [522.6, 951.9, 31.0, 21.8, 141.6], "h_c00": [528.6, 971.0, 34.5, 22.5, 126.4]};
var FY_KEYCOL = {"ド":"#e8505b","レ":"#f28a1e","ミ":"#f5d90a","ファ":"#43a047","ソ":"#29b6f6","ラ":"#3f51b5","シ":"#9c4dcc"};
var fyColCache = {}, fyColTok = 0;
/* 長押しで 範囲指定（文字や画像の選択）に ならないように する */
(function () {
  function isField(t) { return t && t.tagName && /^(INPUT|TEXTAREA)$/.test(t.tagName); }
  document.addEventListener("selectstart", function (e) { if (!isField(e.target)) e.preventDefault(); }, true);
  document.addEventListener("contextmenu", function (e) { if (!isField(e.target)) e.preventDefault(); }, true);
  document.addEventListener("dragstart", function (e) { e.preventDefault(); }, true);
  var st = document.createElement("style");
  st.textContent = "img{-webkit-user-drag:none;user-drag:none;-webkit-touch-callout:none;}";
  document.head.appendChild(st);
})();
function fyColorOn(idx, clef) {
  try {
    clef = clef || selectedClef;
    var v = Storage.get("fy_color_" + idx + "_" + clef, null);
    if (v === "on") return true;
    if (v === "off") return false;
    if (Storage.get("onpu_debug_unlocked_" + idx)) return false;
    return !hasLevelCleared(idx, clef, 1);
  } catch (e) { return false; }
}
function fyColorActive() { return fyColorOn(activeProfileIndex, selectedClef) && selectedLevel === 1 && (selectedClef === "treble" || selectedClef === "bass"); }
function fyColorSuffix() { return fyColorActive() ? "c" : ""; }
function fyColorLv1Cleared(idx, clef) {
  var b = Storage.get("onpu_best_20c_" + idx + "_" + clef + "_1");
  return !!(b && b.accuracy >= 90);
}
function fyColorize(card, cb) {
  var h = FY_HEADS[card.id];
  if (!h || !FY_KEYCOL[card.key]) { cb(card.img); return; }
  if (fyColCache[card.id]) { cb(fyColCache[card.id]); return; }
  var im = new Image();
  im.onload = function () {
    try {
      var c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
      var x = c.getContext("2d"); x.drawImage(im, 0, 0);
      x.fillStyle = FY_KEYCOL[card.key]; x.beginPath();
      x.ellipse(h[0], h[1], h[2] * 1.1, h[3] * 1.1, h[4] * Math.PI / 180, 0, Math.PI * 2); x.fill(); x.lineWidth = 3; x.strokeStyle = "#222"; x.stroke();
      fyColCache[card.id] = c.toDataURL("image/jpeg", 0.92);
    } catch (e) { fyColCache[card.id] = card.img; }
    cb(fyColCache[card.id]);
  };
  im.onerror = function () { cb(card.img); };
  im.src = card.img;
}
function fyPracQuiet() { try { return !!Storage.get("fy_noprac_" + activeProfileIndex, false); } catch (e) { return false; } }
function fyColorBackNow() {
  Storage.set("fy_color_" + activeProfileIndex + "_" + selectedClef, "on");
  selectedLevel = 1;
  proceedToCards();
}
function fyColorSwitch(toColor) {
  Storage.set("fy_color_" + activeProfileIndex + "_" + selectedClef, toColor ? "on" : "off");
  /* 色で つかいかたを おぼえているので、くろおんぷでは 説明を くりかえさない */
  if (!toColor) { Storage.set("fy_practice_guide_" + activeProfileIndex, true); Storage.set("fy_noprac_" + activeProfileIndex, true); }
  showLevelScreen();
}
function fyColorSwitchAsk(toColor) {
  var d = document.createElement("div");
  d.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:10003;background:rgba(60,40,20,.55);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;";
  var msg = toColor
    ? "いろおんぷに もどします。<br>いろおんぷは レベル1だけ です。<br>くろおんぷの きろくは のこります。"
    : "くろい おんぷに かえます。<br><b>レベル1から</b> はじまります。<br>いろおんぷの きろくは のこります。";
  var a, b, ans, typed = "";
  function newQ() { a = 6 + Math.floor(Math.random() * 4); b = 6 + Math.floor(Math.random() * 4); ans = a + b; typed = ""; }
  function pad() {
    var h = "";
    [1,2,3,4,5,6,7,8,9].forEach(function (n) { h += '<button class="fyPadBtn" data-n="' + n + '">' + n + '</button>'; });
    h += '<button class="fyPadBtn" data-n="c" style="font-size:14px;">けす</button><button class="fyPadBtn" data-n="0">0</button><button class="fyPadBtn" data-n="ok" style="background:#7bc67e;color:#fff;font-size:14px;">OK</button>';
    return h;
  }
  newQ();
  d.innerHTML = '<div style="background:#fffaf0;border-radius:18px;padding:16px;max-width:320px;width:100%;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.35);">' +
    '<div style="font-size:18px;font-weight:900;color:#b3541e;">ほごしゃの かたへ</div>' +
    '<div style="font-size:16px;font-weight:900;color:#5d4037;margin:6px 0;">' + (toColor ? "🎨 いろおんぷに もどしますか？" : "🎼 くろおんぷに しますか？") + '</div>' +
    '<div style="font-size:12px;color:#806c5a;line-height:1.6;margin-bottom:8px;">' + msg + '</div>' +
    '<div style="font-size:12px;color:#806c5a;">まちがいを ふせぐため、けいさんしてください</div>' +
    '<div id="fyQ" style="font-size:28px;font-weight:900;color:#5d4037;margin:6px 0 2px;"></div>' +
    '<div id="fyA" style="font-size:26px;font-weight:900;color:#3f51b5;min-height:36px;border-bottom:2px solid #d8c8b0;margin:0 40px 8px;"></div>' +
    '<div id="fyErr" style="font-size:12px;color:#d32f2f;min-height:16px;"></div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">' + pad() + '</div>' +
    '<button id="fyColNo" style="width:100%;margin-top:10px;padding:10px;font-size:14px;font-weight:800;color:#806c5a;background:#eee;border:none;border-radius:12px;">やめる</button></div>';
  document.body.appendChild(d);
  var qEl = d.querySelector("#fyQ"), aEl = d.querySelector("#fyA"), eEl = d.querySelector("#fyErr");
  function draw() { qEl.textContent = a + " + " + b + " = ?"; aEl.textContent = typed; }
  draw();
  d.querySelector("#fyColNo").addEventListener("click", function () { d.remove(); });
  Array.prototype.forEach.call(d.querySelectorAll(".fyPadBtn"), function (btn) {
    btn.addEventListener("click", function () {
      var n = btn.getAttribute("data-n");
      if (n === "c") { typed = ""; eEl.textContent = ""; }
      else if (n === "ok") {
        if (parseInt(typed, 10) === ans) { d.remove(); fyColorSwitch(toColor); }
        else { eEl.textContent = "ちがいます。もういちど どうぞ"; newQ(); }
      } else if (typed.length < 2) { typed += n; eEl.textContent = ""; }
      draw();
    });
  });
}
/* 🌱 わかばマーク（ぜんいんに さいしょは ついている。うるさく なったら けす） */
function fyWakabaOn() { try { return Storage.get("fy_wakaba_" + activeProfileIndex, "on") !== "off"; } catch (e) { return true; } }
function fyWakabaSet(on) {
  try { Storage.set("fy_wakaba_" + activeProfileIndex, on ? "on" : "off"); } catch (e) {}
  if (!on) fyClearNudges();
  try { fyWakabaChipRefresh(); } catch (e) {}
}
function fyWakabaChipRefresh() {
  var c = document.getElementById("fyWakabaChip"); if (!c) return;
  var on = fyWakabaOn();
  c.textContent = on ? "🌱 わかばマーク：つけている" : "🌱 わかばマーク：けしている";
  c.style.background = on ? "#e3f4dc" : "#eee";
  c.style.color = on ? "#2e7d32" : "#999";
  c.style.border = on ? "2px solid #7bc67e" : "2px solid #ddd";
}
function fyWakabaAsk() {
  if (!fyWakabaOn()) { fyWakabaSet(true); return; }
  var d = document.createElement("div");
  d.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:10003;background:rgba(60,40,20,.55);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;";
  d.innerHTML = '<div style="background:#fffaf0;border-radius:18px;padding:18px;max-width:320px;width:100%;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.35);">' +
    '<div style="font-size:34px;">🌱</div>' +
    '<div style="font-size:16px;font-weight:900;color:#5d4037;margin:6px 0;">わかばマークを けしますか？</div>' +
    '<div style="font-size:13px;color:#806c5a;line-height:1.7;margin-bottom:14px;">けすと、ひかる あんないと、<br>ずんだもんの こえの あんないが でなくなります。<br>（あとから また つけられます）</div>' +
    '<button id="fyWkKeep" style="width:100%;padding:12px;font-size:16px;font-weight:900;color:#fff;background:#7bc67e;border:none;border-radius:12px;">のこす</button>' +
    '<button id="fyWkOff" style="width:100%;margin-top:8px;padding:10px;font-size:14px;font-weight:800;color:#806c5a;background:#eee;border:none;border-radius:12px;">けす</button></div>';
  document.body.appendChild(d);
  document.getElementById("fyWkKeep").addEventListener("click", function () { d.remove(); });
  document.getElementById("fyWkOff").addEventListener("click", function () { d.remove(); fyWakabaSet(false); });
}
/* ひかる ボタン（つぎは ここ、が わかる） */
function fyClearNudges() {
  Array.prototype.forEach.call(document.querySelectorAll(".fyNudge"), function (n) { n.classList.remove("fyNudge"); n.classList.remove("fyUp"); n.classList.remove("fyRel"); });
}
function fyNudge(el) {
  if (!el || !fyWakabaOn()) return;
  fyGlowCss(); fyClearNudges();
  el.classList.add("fyNudge");
  try { if (getComputedStyle(el).position === "static") el.classList.add("fyRel"); } catch (e) {}
  var off = function () { el.classList.remove("fyNudge"); el.classList.remove("fyRel"); el.removeEventListener("pointerdown", off); };
  el.addEventListener("pointerdown", off);
}
/* わかばマークが ついている ときだけ、まいかい ならす こえ */
var fyVoiceNow = null, fyVoiceLast = {};
function fyWakabaVoice(file, delayMs, guard) {
  if (!fyWakabaOn()) return;
  var t0 = Date.now();
  /* おなじ こえが つづけて よばれたら、2かいめは ならさない（トレーニングを 2かい タップしたとき など） */
  if (fyVoiceLast[file] && t0 - fyVoiceLast[file] < 5000) return;
  fyVoiceLast[file] = t0;
  setTimeout(function () {
    try {
      if (!fyWakabaOn()) return; if (guard && !guard()) return;
      if (fyVoiceNow) { try { fyVoiceNow.pause(); } catch (e) {} }
      var a = new Audio(file); fyVoiceNow = a;
      var q = a.play(); if (q && q.catch) q.catch(function () {});
    } catch (e) {}
  }, delayMs || 0);
}
/* カード画面（れんしゅう）：ただしい けんばんを ひからせる → おしたら ›（つぎ）→ 3かいで トレーニング */
function fyCorrectKeyEl() {
  try {
    var card = currentCards[currentIndex], kb = document.querySelectorAll(".keyboard .key-btn");
    for (var i = 0; i < kb.length; i++) if (kb[i].textContent.trim() === card.key) return kb[i];
  } catch (e) {}
  return null;
}
function fyKeyNudge() {
  if (trainingMode || !fyWakabaOn() || (!fyColorActive() && (fyPracQuiet() || selectedLevel > 1))) return;
  var cs = document.getElementById("cardScreen");
  if (!cs || cs.classList.contains("hidden")) return;
  if (document.getElementById("fyPractice")) return;
  if ((window.__fyPracCount || 0) >= 3) { fyNudge(document.getElementById("trainingButton")); return; }
  var k = fyCorrectKeyEl();
  if (k) { fyNudge(k); k.classList.add("fyUp"); }
}
function fyAfterPracticePress() {
  if (!fyWakabaOn() || trainingMode || (!fyColorActive() && (fyPracQuiet() || selectedLevel > 1))) return;
  window.__fyPracCount = (window.__fyPracCount || 0) + 1;
  if (window.__fyPracCount === 3) {
    fyNudge(document.getElementById("trainingButton"));
    fyWakabaVoice("zunda-practice4.mp3", 700, function () { var cs = document.getElementById("cardScreen"); return cs && !cs.classList.contains("hidden") && !trainingMode; });
  } else if (window.__fyPracCount < 3) {
    fyNudge(document.getElementById("arrowRight"));
  }
}
/* トップ画面：つぎに おす ボタンを ひからせる */
function fyWakabaTop() {
  try {
    if (!fyWakabaOn()) return;
    if (typeof isRegistered === "function" && !isRegistered(activeProfileIndex)) return;   /* とうろく まえは ひからせない */
    var ss = document.getElementById("selectScreen");
    if (!ss || ss.classList.contains("hidden")) return;
    if (document.getElementById("fyGuide") || document.getElementById("fyWelcome") || document.getElementById("fyPractice")) return;
    var list = [["treble", "btnTreble"], ["bass", "btnBass"], ["all", "btnAll"]], pick = null;
    for (var i = 0; i < list.length; i++) {
      var b = document.getElementById(list[i][1]);
      if (!b || b.classList.contains("locked")) continue;
      if (hasLevelCleared(activeProfileIndex, list[i][0], 5)) continue;
      pick = b; break;
    }
    if (pick) fyNudge(pick);
    if (!window.__fyWkTopVoice && pick) { window.__fyWkTopVoice = true; fyWakabaVoice("zunda-guide2.mp3", 300); }
  } catch (e) {}
}

/* 1かいだけ ならす こえ */
function fyVoiceOnce(flagKey, file, delayMs, guard) {
  try {
    var k = flagKey + "_" + activeProfileIndex;
    if (Storage.get(k, false)) return;
    setTimeout(function () {
      try { if (Storage.get(k, false)) return; if (guard && !guard()) return; Storage.set(k, true); var a = new Audio(file); var q = a.play(); if (q && q.catch) q.catch(function () {}); } catch (e) {}
    }, delayMs || 0);
  } catch (e) {}
}
/* カード画面に はじめて はいったとき：1かいだけ、ひかる あんない */
function fyPracticeGuide() {
  try {
    var k = "fy_practice_guide_" + activeProfileIndex;
    if (Storage.get(k, false)) return;
    if (trainingMode) return;
    var cs = document.getElementById("cardScreen");
    if (!cs || cs.classList.contains("hidden")) return;
    Storage.set(k, true);
    fyGlowCss(); fyClearNudges();
    var steps = [
      { sel: [".note-card-wrap"], snd: "zunda-practice1.mp3" },
      { sel: ["#arrowLeft", "#arrowRight"], snd: "zunda-practice2.mp3" },
      { sel: ["@key"], snd: "zunda-practice3.mp3" },
      { sel: ["#trainingButton"], snd: "zunda-practice4.mp3" }
    ];
    var wrap = document.createElement("div");
    wrap.id = "fyPractice";
    wrap.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:10002;pointer-events:none;";
    document.body.appendChild(wrap);
    var skip = document.createElement("button");
    skip.textContent = "とじる ✕";
    skip.style.cssText = "position:fixed;bottom:112px;left:50%;transform:translateX(-50%);pointer-events:auto;border:none;background:rgba(255,255,255,.92);color:#806c5a;font-size:13px;font-weight:800;border-radius:12px;padding:8px 12px;box-shadow:0 2px 6px rgba(0,0,0,.25);";
    var i = 0, au = null, timer = null, closed = false;
    function clear() { if (timer) { clearTimeout(timer); timer = null; } try { if (au) { au.pause(); au.removeAttribute("src"); au.load(); } } catch (e) {} au = null; Array.prototype.slice.call(wrap.querySelectorAll(".fyItem")).forEach(function (n) { n.remove(); }); }
    function close() { if (closed) return; closed = true; clear(); wrap.remove(); try { fyKeyNudge(); } catch (e) {} }
    skip.addEventListener("click", close);
    function show() {
      clear();
      if (closed) return;
      if (i >= steps.length) { close(); return; }
      var st = steps[i], atTop = false;
      st.sel.forEach(function (sel) {
        var el = (sel === "@key") ? fyCorrectKeyEl() : document.querySelector(sel);
        if (!el || !el.getClientRects().length) return;
        var r = el.getBoundingClientRect();
        var ring = document.createElement("div");
        ring.className = "fyItem fyPulseRing";
        ring.style.cssText = "position:fixed;border:4px solid #ffb300;border-radius:14px;left:" + (r.left - 4) + "px;top:" + (r.top - 4) + "px;width:" + (r.width + 8) + "px;height:" + (r.height + 8) + "px;";
        wrap.appendChild(ring);
        var f = document.createElement("div");
        f.className = "fyItem";
        var below = (r.top + r.height / 2) < window.innerHeight * 0.55;
        f.textContent = below ? "👆" : "👇";
        f.style.cssText = "position:fixed;font-size:38px;animation:fyBounce .7s ease-in-out infinite;left:" + (r.left + r.width / 2 - 19) + "px;top:" + (below ? (r.bottom + 4) : Math.max(0, r.top - 50)) + "px;";
        wrap.appendChild(f);
      });
      var next = function () { if (closed) return; timer = setTimeout(function () { i++; show(); }, 500); };
      try {
        au = new Audio(st.snd);
        au.addEventListener("ended", next);
        au.addEventListener("error", function () { timer = setTimeout(next, 2500); });
        var q = au.play(); if (q && q.catch) q.catch(function () { timer = setTimeout(next, 2500); });
      } catch (e) { timer = setTimeout(next, 2500); }
    }
    show();
    return true;
  } catch (e) {}
  return false;
}

/* 🧭 はじめての ガイド（とうろくの あと 1回だけ。ずんだもんが トップ画面を あんない） */
function showGuide() {
  var old = document.getElementById("fyGuide"); if (old) old.remove();
  try { fyClearNudges(); } catch (e) {}   /* 案内の あいだは、ボタンの ひかりを けす */
  var steps = [
    { sel: "#fyHankoTop", txt: "まいにち トレーニングすると、ハンコが もらえるのだ！" },
    { sel: "#btnTreble", txt: "まずは ここから！ おんぷを よんでみるのだ！" },
    { sel: "#btnBass", txt: "かぎの マークは、がんばると だんだん あいていくのだ！" },
    { sel: "#fyCodeBtn", txt: "がんばった きろくは、LINEで せんせいに おくれるのだ！" },
    { sel: "", txt: "それじゃあ、スタートなのだ！" }
  ];
  var k = 0, au = null;
  var wrap = document.createElement("div");
  wrap.id = "fyGuide";
  wrap.style.cssText = "position:fixed;left:0;top:0;right:0;bottom:0;z-index:10002;";
  var spot = document.createElement("div");
  fyGlowCss();
  spot.style.cssText = "position:fixed;border:4px solid #ffb300;border-radius:14px;box-shadow:0 0 0 9999px rgba(60,40,20,.6);pointer-events:none;transition:all .25s;";
  spot.className = "fyPulseRing";
  var fing = document.createElement("div");
  fing.style.cssText = "position:fixed;font-size:38px;pointer-events:none;z-index:2;animation:fyBounce .7s ease-in-out infinite;display:none;";
  wrap.appendChild(fing);
  var bub = document.createElement("div");
  bub.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);";
  wrap.appendChild(spot); wrap.appendChild(bub);
  document.body.appendChild(wrap);
  function stopAu() { try { if (au) { au.pause(); au.removeAttribute("src"); au.load(); } } catch (e) {} au = null; }
  function close() { stopAu(); wrap.remove(); try { setTimeout(fyWakabaTop, 300); } catch (e) {} }
  function render() {
    stopAu();
    var st = steps[k], last = (k === steps.length - 1), el = st.sel ? document.querySelector(st.sel) : null;
    var r = null;
    if (el && el.getClientRects().length) {
      try { el.scrollIntoView({ block: "center" }); } catch (e) {}
      r = el.getBoundingClientRect();
    }
    if (r) {
      spot.style.display = "block";
      spot.style.left = (r.left - 5) + "px"; spot.style.top = (r.top - 5) + "px";
      spot.style.width = (r.width + 10) + "px"; spot.style.height = (r.height + 10) + "px";
      wrap.style.background = "transparent";
      var mid = r.top + r.height / 2;
      fing.style.display = "block"; fing.style.left = (r.left + r.width / 2 - 19) + "px";
      if (mid > window.innerHeight * 0.5) { fing.textContent = "👇"; fing.style.top = Math.max(0, r.top - 50) + "px"; } else { fing.textContent = "👆"; fing.style.top = (r.bottom + 4) + "px"; }
      if (mid > window.innerHeight * 0.5) { bub.style.top = "14px"; bub.style.bottom = "auto"; }
      else { bub.style.bottom = "18px"; bub.style.top = "auto"; }
    } else {
      spot.style.display = "none"; fing.style.display = "none";
      wrap.style.background = "rgba(60,40,20,.6)";
      bub.style.top = "auto"; bub.style.bottom = "18px";
    }
    /* もじは だしません（こえ ＋ ひかる わく ＋ ゆびだけ）。おうちの人 むけに、ちいさな「とじる」だけ */
    bub.innerHTML = "";
    var goNext = function () { if (done) return; done = true; if (last) close(); else { k++; render(); } };
    var done = false;
    wrap.onclick = goNext;   /* どこを さわっても つぎへ（3さいでも まよわない） */
    try {
      au = new Audio("zunda-guide" + (k + 1) + ".mp3");
      au.addEventListener("ended", function () { setTimeout(goNext, 600); });
      au.addEventListener("error", function () { setTimeout(goNext, 2500); });
      var q = au.play(); if (q && q.catch) q.catch(function () { setTimeout(goNext, 2500); });
    } catch (e) { setTimeout(goNext, 2500); }
  }
  render();
}

/* スタートボタン切替認証
   PINが初期の「0000」のままなら、PINなしで切り替える */
function switchProfile(idx) {
  activeProfileIndex = idx;
  Storage.set("onpu_active_profile", activeProfileIndex);
  initProfiles();
}

function confirmProfileSelect() {
  const val = document.getElementById("profileSelect").value;
  if (val === "") return;
  pendingSelectIndex = parseInt(val, 10);

  if (pendingSelectIndex === activeProfileIndex) {
    return;
  }

  const savedPin = String(Storage.get(`onpu_pin_${pendingSelectIndex}`, "0000"));
  if (savedPin === "0000") {
    switchProfile(pendingSelectIndex);
    return;
  }

  document.getElementById("pinModalStudentName").textContent = `${profiles[pendingSelectIndex]} の ログイン`;
  document.getElementById("studentPinInput").value = "";
  toggleModal("studentPinModal", true);
}

function verifyStudentPin() {
  const inputPin = document.getElementById("studentPinInput").value.trim();
  const savedPin = String(Storage.get(`onpu_pin_${pendingSelectIndex}`, "0000"));
  
  if (inputPin === savedPin) {
    toggleModal("studentPinModal", false);
    switchProfile(pendingSelectIndex);
  } else {
    alert("PINコード（パスワード）が違います");
    document.getElementById("studentPinInput").value = "";
  }
}

/* 🏆 ランキングの表を作る */
function buildRankTable(list, headerLabel) {
  let html = `<table class="compare-table"><thead><tr><th>順位</th><th>おなまえ</th><th>${headerLabel}</th></tr></thead><tbody>`;
  list.forEach((item, i) => {
    html += `<tr><td>${i+1}位</td><td><strong>${item.name}</strong></td><td>🔥 ${item.val}回</td></tr>`;
  });
  return html + '</tbody></table>';
}

function openRankingScreen() {
  navigateTo("rankingScreen");

  let listT = [], listB = [], listF = [], listA = [];
  profiles.forEach((name, idx) => {
    if (!isRegistered(idx)) return;
    const shownName = legendMark(idx) + name;
    listT.push({ name: shownName, val: Storage.getNumber(`onpu_perf_treble_${idx}`, 0) });
    listB.push({ name: shownName, val: Storage.getNumber(`onpu_perf_bass_${idx}`, 0) });
    listF.push({ name: shownName, val: Storage.getNumber(`onpu_perf_all_${idx}`, 0) });
    listA.push({ name: shownName, val: Storage.getNumber(`onpu_perf_max_${idx}`, 0) });
  });

  listT.sort((a,b) => b.val - a.val);
  listB.sort((a,b) => b.val - a.val);
  listF.sort((a,b) => b.val - a.val);
  listA.sort((a,b) => b.val - a.val);

  document.getElementById("rankingTrebleList").innerHTML = buildRankTable(listT, "100%の回数");
  document.getElementById("rankingBassList").innerHTML = buildRankTable(listB, "100%の回数");
  document.getElementById("rankingFullList").innerHTML = buildRankTable(listF, "100%の回数");
  document.getElementById("rankingAllList").innerHTML = buildRankTable(listA, "最高れんぞく");
}

function startDoLesson() {
  selectedClef = "do"; selectedLevel = 0; currentCards = doCards; currentIndex = 0; trainingMode = false;
  navigateTo("cardScreen");
  document.getElementById("levelBadge").textContent = "6つのド";
  document.getElementById("cardScreenTitle").textContent = "おんぷカード";
  document.getElementById("qCountBadge").classList.add("hidden");
  showCurrentCard();
}

function selectClef(clef) {
  const isDebugUnlocked = Storage.get(`onpu_debug_unlocked_${activeProfileIndex}`);
  const doBest = getDoTestBest(activeProfileIndex);
  const clefUnlocked = isDebugUnlocked || !!(doBest && doBest.accuracy >= 90);
  const trebleCleared = isDebugUnlocked || hasLevelCleared(activeProfileIndex, "treble", 5);
  const bassCleared = isDebugUnlocked || hasLevelCleared(activeProfileIndex, "bass", 5);
  const allUnlocked = isDebugUnlocked || (clefUnlocked && trebleCleared && bassCleared);

  if ((clef === 'treble' || clef === 'bass') && !clefUnlocked) return alert("まずは「6つの『ド』」でトレーニング（20問）をやろう！");
  if (clef === 'all' && !allUnlocked) return alert("ト音記号とヘ音記号をすべてクリアすると遊べるよ！");
  
  selectedClef = clef; showLevelScreen();
}

function createLevelButtons() {
  const isDebugUnlocked = Storage.get(`onpu_debug_unlocked_${activeProfileIndex}`);
  const list = document.getElementById("levelList");
  list.innerHTML = "";
  const colorMode = (selectedClef === "treble" || selectedClef === "bass") && fyColorOn(activeProfileIndex, selectedClef);
  for (let level = 1; level <= 5; level++) {
    const button = document.createElement("button");
    button.className = "level-button";
    let isLocked = false;
    const colorLock = level > 1 && colorMode;
    if (level > 1 && !isDebugUnlocked) {
      if (!hasLevelCleared(activeProfileIndex, selectedClef, level - 1)) isLocked = true;
    }
    if (colorLock) isLocked = true;
    if (isLocked) button.classList.add("locked");
    button.innerHTML = `<span class="level-number">レベル ${level}${(level === 1 && colorMode) ? " 🎨" : ""}</span>` + (isLocked ? `<span class="locked-badge">🔒 ロック</span>` : "");
    button.onclick = () => colorLock ? alert("いろおんぷは レベル1だけだよ。\nくろおんぷに すると、つぎの レベルに すすめるよ！\n（ほごしゃの かたが、したの ボタンを おしてね）") : (isLocked ? alert("前のレベルの20問トレーニングで90%以上をとると解放されるよ！") : showLevelCover(level));
    list.appendChild(button);
  }
  if (selectedClef === "treble" || selectedClef === "bass") {
    const sw = document.createElement("button");
    sw.id = "fyColorSwitchBtn";
    if (colorMode) {
      sw.style.cssText = "display:block;width:100%;margin-top:14px;padding:12px;font-size:14px;font-weight:900;color:#fff;background:#8a6bbf;border:none;border-radius:14px;";
      sw.textContent = "🎼 くろおんぷに する（ほごしゃの かたへ）";
    } else {
      sw.style.cssText = "display:block;margin:14px auto 0;padding:6px 12px;font-size:11px;font-weight:700;color:#a09080;background:#f0ebe3;border:none;border-radius:10px;";
      sw.textContent = "🎨 いろおんぷに もどす（ほごしゃの かたへ）";
    }
    sw.onclick = () => fyColorSwitchAsk(!colorMode);
    list.appendChild(sw);
  }
}

function showLevelCover(level) {
  selectedLevel = level;
  navigateTo("coverScreen");
  /* 🟢 ずんだもんの声：ふだんは「レベル○、スタートなのだ！」。同じレベルで 4回 つまずいたら（5回目から）はげましの声 */
  levelUpCoverMs = 0;
  try {
    const fails = Storage.getNumber(`fy_lvfail${fyColorSuffix()}_${activeProfileIndex}_${selectedClef}_${level}`, 0);
    const lvId = (fails >= 4) ? "levelEncourageAudio" : ("levelUp" + level + "Audio");
    playAudioCloned(lvId);
    levelUpCoverMs = (getSoundDurationMs(lvId) || 2400) + 300;
  } catch (e) {}
  document.getElementById("coverLevelNumber").textContent = level;
  /* 声が長いときは、タップで すぐ すすめる */
  document.getElementById("coverScreen").onclick = () => {
    if (coverTimer !== null) { clearTimeout(coverTimer); coverTimer = null; }
    document.getElementById("coverScreen").onclick = null;
    proceedToCards();
  };
  const coverMs = Math.max(1200, levelUpCoverMs);
  levelUpCoverMs = 0;
  coverTimer = setTimeout(() => {
    coverTimer = null;
    if (!document.getElementById("coverScreen").classList.contains("hidden")) proceedToCards();
  }, coverMs);
}

function proceedToCards() {
  currentCards = (selectedClef === "treble") ? trebleCards[selectedLevel] : (selectedClef === "bass") ? bassCards[selectedLevel] : allCards[selectedLevel];
  currentIndex = 0; trainingMode = false;
  navigateTo("cardScreen");
  document.getElementById("levelBadge").textContent = `Lv.${selectedLevel}` + (fyColorActive() ? " 🎨" : "");
  document.getElementById("cardScreenTitle").textContent = "おんぷカード";
  document.getElementById("qCountBadge").classList.add("hidden");
  showCurrentCard();
}

function showCurrentCard() {
  if (!currentCards || !currentCards.length) return;
  (function () {
    var _c = currentCards[currentIndex], _img = document.getElementById("noteCardImg");
    if (fyColorActive()) {
      var _t = ++fyColTok; _img.style.opacity = "0";
      fyColorize(_c, function (src) { if (_t !== fyColTok) return; _img.src = src; _img.style.opacity = "1"; });
    } else { fyColTok++; _img.style.opacity = "1"; _img.src = _c.img; }
  })();
  document.getElementById("trainingCover").classList.toggle("hidden", !trainingMode);
  document.getElementById("trainingCover").classList.remove("reveal");
  document.getElementById("correctCircle").classList.remove("show");
  document.getElementById("incorrectX").classList.remove("show");
  try { fyKeyNudge(); } catch (e) {}
}

function nextCard() { if (!trainingMode && currentCards.length) { currentIndex = (currentIndex + 1) % currentCards.length; showCurrentCard(); } }
function previousCard() { if (!trainingMode && currentCards.length) { currentIndex = (currentIndex - 1 + currentCards.length) % currentCards.length; showCurrentCard(); } }

function startTrainingDirect(force20 = false) {
  const isAllCleared = hasLevelCleared(activeProfileIndex, "all", 5);
  if (selectedClef === "do" || isAllCleared) targetValue = 20;
  else targetValue = force20 ? 20 : 10;
  startTrainingWithConfig();
}

function startTrainingWithConfig() {
  clearPendingTimers();
  /* トレーニングを始めるときに、止まっていた音の機能を再開する */
  try { getAudioContext(); } catch (e) {}
  trainingMode = true; trainingCorrectCount = 0; trainingMistakes = 0; trainingStartTime = Date.now(); lastTrainingIndex = -1;
  document.getElementById("qCountBadge").classList.remove("hidden");
  showRandomTrainingQuestion();
}

function restartTrainingDirect() { navigateTo("cardScreen"); startTrainingDirect(targetValue === 20); }
function start20QuestionTraining() { navigateTo("cardScreen"); startTrainingDirect(true); }
function start10QuestionTraining() { navigateTo("cardScreen"); startTrainingDirect(false); }

function showRandomTrainingQuestion() {
  if (trainingCorrectCount >= targetValue) { showResultScreen(); return; }
  const remaining = targetValue - trainingCorrectCount;
  document.getElementById("qCountBadge").textContent = `あと ${remaining} 問`;

  let nextIdx;
  if (currentCards.length > 1) {
    do { nextIdx = Math.floor(Math.random() * currentCards.length); } while (nextIdx === lastTrainingIndex);
  } else { nextIdx = 0; }
  lastTrainingIndex = nextIdx; currentIndex = nextIdx; trainingLocked = false;
  showCurrentCard();
}

/* 鍵盤タッチ遅延対策: pointerdown イベントハンドラ */
function handleKeyPress(key, event) {
  if (event) {
    event.preventDefault();
  }
  pressKey(key);
}

function pressKey(key) {
  if (!currentCards.length) return;
  const card = currentCards[currentIndex];

  if (trainingMode) {
    if (trainingLocked) return;
    if (key !== card.key) {
      trainingMistakes++;
      playPokon();
      restartAnimation(document.getElementById("incorrectX"));
      return;
    }
    trainingLocked = true; trainingCorrectCount++;
    document.getElementById("trainingCover").classList.add("reveal");
    playNoteSound(card.id, key);

    restartAnimation(document.getElementById("correctCircle"));
    playAudioCloned("seikaiAudio");

    if (nextQuestionTimer !== null) clearTimeout(nextQuestionTimer);
    nextQuestionTimer = setTimeout(() => {
      nextQuestionTimer = null;
      if (trainingMode) showRandomTrainingQuestion();
    }, 250);
    return;
  }
  if (key === card.key) { playNoteSound(card.id, key); try { fyAfterPracticePress(); } catch (e) {} }
}

function saveCountBest(profileIndex, clef, level, accuracy, duration) {
  const cs = fyColorSuffix();
  const key = targetValue === 20 ? `onpu_best_20${cs}_${profileIndex}_${clef}_${level}` : `onpu_best_10${cs}_${profileIndex}_${clef}_${level}`;
  const oldBest = Storage.get(key);
  
  if (!oldBest || accuracy > oldBest.accuracy || (accuracy === oldBest.accuracy && duration < (oldBest.time ?? Infinity))) {
    Storage.set(key, { accuracy, time: duration, count: targetValue });
  }
  if (targetValue === 20 && !cs) {
    Storage.set(`onpu_count_best_${profileIndex}_${clef}_${level}`, { accuracy, time: duration, count: 20 });
  }
}

function saveDoTestBest(accuracy, duration) {
  const key = `onpu_do_test_best_${activeProfileIndex}`;
  const oldBest = Storage.get(key);
  if (!oldBest || accuracy > oldBest.accuracy || (accuracy === oldBest.accuracy && duration < (oldBest.time ?? Infinity))) {
    Storage.set(key, { accuracy, time: duration, mode: "count", count: 20 });
  }
}

/* 結果画面のボタンを、薄くして押せなくする／色づけて押せるようにする */
function setResultButtonsDisabled(disabled) {
  const wrap = document.getElementById("resultButtonsWrap");
  if (!wrap) return;
  wrap.querySelectorAll("button").forEach(b => { b.disabled = disabled; });
}

function unlockResultButtons() {
  setResultButtonsDisabled(false);
  /* ボタンが色づいたタイミングで、止まっていた音の機能も再開しておく */
  try { getAudioContext(); } catch (e) {}
}

function showResultScreen() {
  trainingMode = false;
  document.getElementById("qCountBadge").classList.add("hidden");
  const duration = Math.round((Date.now() - trainingStartTime) / 1000);
  const totalAttempts = trainingCorrectCount + trainingMistakes;
  const accuracy = totalAttempts > 0 ? Math.round((trainingCorrectCount / totalAttempts) * 100) : 0;

  Storage.set(`onpu_last_acc_${activeProfileIndex}`, accuracy);

  /* 🟢 つまずき回数：同じレベルの20問を、全部正解できないまま 終えた回数（全部正解で 0に もどる） */
  if (targetValue >= 20 && selectedClef !== "do") {
    const kF = `fy_lvfail${fyColorSuffix()}_${activeProfileIndex}_${selectedClef}_${selectedLevel}`;
    Storage.set(kF, accuracy === 100 ? 0 : Storage.getNumber(kF, 0) + 1);
  }

  let currentStreak = Storage.getNumber(`onpu_perf_streak_${activeProfileIndex}`, 0);
  if (accuracy === 100) {
    currentStreak++;
    Storage.set(`onpu_perf_streak_${activeProfileIndex}`, currentStreak);
    if (selectedClef === "treble") {
      Storage.set(`onpu_perf_treble_${activeProfileIndex}`, Storage.getNumber(`onpu_perf_treble_${activeProfileIndex}`, 0) + 1);
    } else if (selectedClef === "bass") {
      Storage.set(`onpu_perf_bass_${activeProfileIndex}`, Storage.getNumber(`onpu_perf_bass_${activeProfileIndex}`, 0) + 1);
    } else if (selectedClef === "all") {
      Storage.set(`onpu_perf_all_${activeProfileIndex}`, Storage.getNumber(`onpu_perf_all_${activeProfileIndex}`, 0) + 1);
    }
    const maxVal = Storage.getNumber(`onpu_perf_max_${activeProfileIndex}`, 0);
    if (currentStreak > maxVal) Storage.set(`onpu_perf_max_${activeProfileIndex}`, currentStreak);
  } else {
    Storage.set(`onpu_perf_streak_${activeProfileIndex}`, 0);
  }

  if (accuracy >= 90) {
    const todayStr = new Date().toISOString().split("T")[0];
    const daysArr = Storage.get(`onpu_days_${activeProfileIndex}`, []);
    if (Array.isArray(daysArr) && !daysArr.includes(todayStr)) {
      daysArr.push(todayStr);
      Storage.set(`onpu_days_${activeProfileIndex}`, daysArr);
    }
    if (Storage.get(`onpu_last_stamp_date_${activeProfileIndex}`) !== todayStr) {
      Storage.set(`onpu_last_stamp_date_${activeProfileIndex}`, todayStr);
      Storage.set(`onpu_stamps_${activeProfileIndex}`, Storage.getNumber(`onpu_stamps_${activeProfileIndex}`, 0) + 1);
    }
  }

  const isDoTest = (selectedClef === "do" && targetValue === 20);
  if (isDoTest) saveDoTestBest(accuracy, duration);
  if (selectedClef !== "do") saveCountBest(activeProfileIndex, selectedClef, selectedLevel, accuracy, duration);

  navigateTo("resultScreen");

  document.getElementById("resultScore").textContent = `${targetValue}問中 ${trainingCorrectCount}問せいかい (${accuracy}%)`;
  document.getElementById("resultTime").textContent = `タイム: ${duration}秒`;
  
  const streakMsg = document.getElementById("resultStreakMsg");
  if (accuracy === 100) streakMsg.textContent = `🔥 パーフェクト ${currentStreak} 回れんぞく！`;
  else streakMsg.textContent = "";

  const btnWrap = document.getElementById("resultButtonsWrap");
  btnWrap.innerHTML = "";

  const isPerfect = (accuracy === 100);

  /* 音声切り替え指定: 100% -> sugoi.mp3 のあとに Tassei-fanfare.mp3, 90〜99% -> osi.mp3, 〜89% -> ganbatte.mp3 */
  /* resultSoundsEndMs = 結果の音がすべて鳴り終わるまでの時間（ボタンが色づく・場面を切り替えるタイミングの基準） */
  let resultSoundsEndMs = 0;
  if (accuracy === 100) {
    document.getElementById("resultTitleBig").textContent = "かんぺき！";

    /* 先に「すごい」を鳴らし、鳴り終わってからファンファーレを鳴らす */
    const sugoiMs = getSoundDurationMs("sugoiAudio") || 1500;
    const fanfareMs = getSoundDurationMs("tasseiFanfareAudio") || 3000;
    playAudioCloned("sugoiAudio");
    fanfareTimer = setTimeout(() => {
      fanfareTimer = null;
      playAudioCloned("tasseiFanfareAudio");
    }, sugoiMs + 200);
    resultSoundsEndMs = sugoiMs + 200 + fanfareMs + 600;
  } else if (accuracy >= 90) {
    document.getElementById("resultTitleBig").textContent = "もうすこし！";
    playAudioCloned("osiAudio");
  } else {
    document.getElementById("resultTitleBig").textContent = "がんばれ！";
    playAudioCloned("ganbatteAudio");
  }

  /* 👑 パーフェクト連続がちょうど100回になった瞬間 */
  const isLegendMoment = (accuracy === 100 && currentStreak === 100);

  /* 🏆 全カード レベル5 の20問パーフェクトのとき、表彰式を自動で出す */
  let autoAward = false;

  if (accuracy >= 90) {
    if (selectedClef === "do" && isDoTest) {
      updateLockVisuals();
      playAudioCloned("audio6do");
      btnWrap.innerHTML += `<button class="select-button accent" onclick="goToNextLevelClef('treble', 1)">🚀 ト音記号 レベル1へ！</button>`;
    } else if (targetValue === 10 && isPerfect) {
      btnWrap.innerHTML += `<button class="select-button accent" onclick="start20QuestionTraining()">🚀 レベル${selectedLevel} の20問トレーニングへ！</button>`;
      btnWrap.innerHTML += `<button class="select-button" style="margin-top:6px;" onclick="start10QuestionTraining()">もういちど 10問にチャレンジ</button>`;
    } else if (targetValue === 10 && !isPerfect) {
      btnWrap.innerHTML += `<button class="select-button accent" onclick="start10QuestionTraining()">もう一度 10問チャレンジ（100%をめざそう！）</button>`;
      btnWrap.innerHTML += `<button class="select-button" style="margin-top:6px;" onclick="start20QuestionTraining()">20問トレーニングにすすむ</button>`;
    } else if (targetValue >= 20 && isPerfect) {
      let isAllCase = false;
      if (fyColorActive()) {
        const pk = `fy_color_perfect_${activeProfileIndex}_${selectedClef}`;
        const pn = Storage.getNumber(pk, 0) + 1; Storage.set(pk, pn);
        if (pn >= 3) {
          btnWrap.innerHTML += `<div style="font-size:13px;color:#6a4fa0;font-weight:800;line-height:1.6;margin:4px 0 8px;">🎉 いろおんぷ、よく できたね！<br>ほごしゃの かたへ：そろそろ くろおんぷに すすんでも だいじょうぶです。</div>`;
          btnWrap.innerHTML += `<button class="select-button accent" style="background:#8a6bbf;" onclick="fyColorSwitchAsk(false)">🎼 くろおんぷに すすむ（ほごしゃの かたへ）</button>`;
          btnWrap.innerHTML += `<button class="select-button" style="margin-top:6px;" onclick="start20QuestionTraining()">もういちど 20問にチャレンジ</button>`;
        } else {
          btnWrap.innerHTML += `<div style="font-size:13px;color:#6a4fa0;font-weight:800;line-height:1.6;margin:4px 0 8px;">🎉 いろおんぷ ぜんぶ せいかい！<br>なんども あそぶと、くろおんぷに すすむ じゅんびが できるよ。</div>`;
          btnWrap.innerHTML += `<button class="select-button accent" onclick="start20QuestionTraining()">もういちど 20問にチャレンジ</button>`;
        }
      } else if (selectedLevel < 5) {
        btnWrap.innerHTML += `<button class="select-button accent" onclick="goToNextLevelClef('${selectedClef}', ${selectedLevel + 1})">🚀 つぎの レベルへ！</button>`;
      } else {
        const tCleared = hasLevelCleared(activeProfileIndex, "treble", 5);
        const bCleared = hasLevelCleared(activeProfileIndex, "bass", 5);

        if (selectedClef === "treble") {
          if (!bCleared) { playAudioCloned("audioToon1"); btnWrap.innerHTML += `<button class="select-button accent" onclick="goToNextLevelClef('bass', 1)">🚀 ヘ音記号 レベル1へ！</button>`; }
          else { playAudioCloned("audioToon2"); btnWrap.innerHTML += `<button class="select-button accent" onclick="goToNextLevelClef('all', 1)">🚀 全カード レベル1へ！</button>`; }
        } else if (selectedClef === "bass") {
          if (!tCleared) { playAudioCloned("audioHeon1"); btnWrap.innerHTML += `<button class="select-button accent" onclick="goToNextLevelClef('treble', 1)">🚀 ト音記号 レベル1へ！</button>`; }
          else { playAudioCloned("audioHeon2"); btnWrap.innerHTML += `<button class="select-button accent" onclick="goToNextLevelClef('all', 1)">🚀 全カード レベル1へ！</button>`; }
        } else if (selectedClef === "all") {
          isAllCase = true;
          autoAward = true;
        }
      }
      if (isAllCase) {
        /* 全カード：「もういちど20問」を一番目立たせ、表彰式ボタンは白で2番目 */
        btnWrap.innerHTML += `<button class="select-button accent" onclick="start20QuestionTraining()">もういちど 20問にチャレンジ</button>`;
        btnWrap.innerHTML += `<button class="select-button" onclick="openAwardModal()">🏆 ひょうしょうしきへ！</button>`;
      } else if (!fyColorActive()) {
        btnWrap.innerHTML += `<button class="select-button" style="margin-top:6px;" onclick="start20QuestionTraining()">もういちど 20問にチャレンジ</button>`;
      }
    } else if (targetValue >= 20 && !isPerfect) {
      btnWrap.innerHTML += `<button class="select-button accent" onclick="start20QuestionTraining()">もう一度 20問にチャレンジ（100%をめざそう！）</button>`;
    }
  } else {
    btnWrap.innerHTML += `<button class="select-button accent" onclick="restartTrainingDirect()">もう一度チャレンジ！</button>`;
  }

  /* 黒おんぷのレベル1で うまく いかなかったとき：いろおんぷに もどれる */
  if ((selectedClef === "treble" || selectedClef === "bass") && selectedLevel === 1 && !fyColorActive() && !fyColorOn(activeProfileIndex, selectedClef) && accuracy < 90) {
    btnWrap.innerHTML += `<button class="select-button" style="margin-top:10px;background:#8a6bbf;color:#fff;" onclick="fyColorBackNow()">🎨 もういちど いろおんぷで れんしゅう</button>`;
  }
  btnWrap.innerHTML += `<button class="select-button" style="margin-top:12px;" onclick="handleCardBack()">もどる</button>`;

  /* 🎉 紙吹雪は100%のときだけ（通常30個、100回目は150個） */
  if (isPerfect) startConfetti(isLegendMoment ? 150 : 30);

  /* 🔒 100%のときだけ、結果の音が鳴り終わるまで、すべてのボタンを薄くして押せなくする */
  if (isPerfect) setResultButtonsDisabled(true);

  /* 🎬 場面の切り替えは、鳴っている音が終わってから、順番に行う
     結果の音 → 表彰式（自動） → 表彰式の音 → 金色の画面（100回目） */
  let nextSceneMs = resultSoundsEndMs;
  let awardScheduled = false;

  if (autoAward) {
    const awardIdx = activeProfileIndex;
    const alreadySeen = Storage.get(`onpu_award_auto_${awardIdx}`, false);
    if (!AUTO_AWARD_ONLY_FIRST || !alreadySeen) {
      const awardSoundId = (currentStreak >= 10) ? "hyoshoFanfareAudio" : "hyoshoFanfare1Audio";
      const awardSoundMs = getSoundDurationMs(awardSoundId) || 4000;
      const awardStartMs = Math.max(1200, nextSceneMs);

      awardScheduled = true;
      resultButtonsLockedForAward = true;  /* 表彰式を閉じるまでボタンは薄いまま */

      awardTimer = setTimeout(() => {
        awardTimer = null;
        /* 表彰式が実際に出る瞬間に「見た」と記録する */
        Storage.set(`onpu_award_auto_${awardIdx}`, true);
        openAwardModal(awardIdx);
      }, awardStartMs);

      nextSceneMs = awardStartMs + awardSoundMs + 800;
    }
  }

  /* 🎨 自動の表彰式がないときは、結果の音が鳴り終わったらボタンを色づける */
  if (isPerfect && !awardScheduled) {
    resultUnlockTimer = setTimeout(() => {
      resultUnlockTimer = null;
      unlockResultButtons();
    }, Math.max(1200, resultSoundsEndMs));
  }

  /* 👑 100回れんぞく達成：称号と達成回数を保存して、前の音が終わってから金色の画面を出す */
  if (isLegendMoment) {
    Storage.set(`onpu_legend_${activeProfileIndex}`, true);
    Storage.set(`onpu_legend_count_${activeProfileIndex}`, getLegendCount(activeProfileIndex) + 1);
    const legendIdx = activeProfileIndex;
    const legendStartMs = Math.max(1800, nextSceneMs);

    legendTimer = setTimeout(() => {
      legendTimer = null;
      showLegendModal(legendIdx);
    }, legendStartMs);
  }
}

function goToNextLevelClef(clef, level) {
  selectedClef = clef; selectedLevel = level;
  showLevelCover(level);
}

/* 👑 ふよみレジェンド画面（100回れんぞく）
   前の音が終わってから呼ばれるので、音を止めずにそのままファンファーレを鳴らす */
function showLegendModal(idx) {
  document.getElementById("legendStudentName").textContent = `${profiles[idx] || ""} さん`;
  toggleModal("legendModal", true);
  playAudioCloned("hyoshoFanfareAudio");
}

/* 表彰ファンファーレ切り替え処理 (パーフェクト連続10回以上: 表彰ファンファーレ.mp3, それ以外: 表彰ファンファーレ1.mp3) */
function openAwardModal(idx = activeProfileIndex) {
  const theme = Storage.get(`onpu_award_theme_${idx}`, "cat");
  const box = document.getElementById("awardBoxEl");
  box.className = `modal-box award-box theme-${theme}`;
  document.getElementById("awardStudentName").textContent = `${profiles[idx]} さん`;

  const perfStreak = Storage.getNumber(`onpu_perf_streak_${idx}`, 0);

  if (perfStreak >= 10) {
    playAudioCloned("hyoshoFanfareAudio");
  } else {
    playAudioCloned("hyoshoFanfare1Audio");
  }

  toggleModal("awardModal", true);
}

/* 表彰式を閉じる。自動の表彰式だったときは、ここで結果画面のボタンが色づく */
function closeAwardModal() {
  toggleModal("awardModal", false);
  if (resultButtonsLockedForAward) {
    resultButtonsLockedForAward = false;
    unlockResultButtons();
  }
}

function openManagementModal() { resetMgSection(); toggleModal("managementModal", true); }
function resetMgSection() {
  document.getElementById("mgSelectSection").classList.remove("hidden");
  document.getElementById("parentSection").classList.add("hidden");
  document.getElementById("teacherSection").classList.add("hidden");
}
function showParentAuth() {
  document.getElementById("mgSelectSection").classList.add("hidden");
  document.getElementById("parentSection").classList.remove("hidden");
  document.getElementById("parentAuthBox").classList.remove("hidden");
  document.getElementById("parentContentBox").classList.add("hidden");
  document.getElementById("parentPassInput").value = "";
}
function verifyParentPass() {
  const currentPass = String(Storage.get("onpu_parent_pass", "0123"));
  if (document.getElementById("parentPassInput").value.trim() === currentPass) {
    document.getElementById("parentAuthBox").classList.add("hidden"); 
    document.getElementById("parentContentBox").classList.remove("hidden"); 
    renderParentCompareTable();
  } else { alert("パスワードが違います"); }
}
function changeParentPassword() {
  const newPass = document.getElementById("parentNewPassInput").value.trim();
  if (!newPass) return alert("パスワードを入力してください");
  Storage.set("onpu_parent_pass", newPass); alert("保護者パスワードを変更しました！");
}

function showTeacherAuth() {
  document.getElementById("mgSelectSection").classList.add("hidden"); document.getElementById("teacherSection").classList.remove("hidden");
  document.getElementById("teacherAuthBox").classList.remove("hidden"); document.getElementById("teacherContentBox").classList.add("hidden");
  document.getElementById("teacherPassInput").value = "";
  /* ★ 先生パスワードなしで ひらく（まだ だれも つかっていない あいだだけ）。もどすときは、下の true を false に する */
  const SKIP_TEACHER_PASS = true;
  if (SKIP_TEACHER_PASS) {
    document.getElementById("teacherAuthBox").classList.add("hidden"); document.getElementById("teacherContentBox").classList.remove("hidden"); renderTeacherView();
  }
}
function verifyTeacherPass() {
  if (document.getElementById("teacherPassInput").value.trim() === TEACHER_PASSWORD) {
    document.getElementById("teacherAuthBox").classList.add("hidden"); document.getElementById("teacherContentBox").classList.remove("hidden"); renderTeacherView();
  } else { alert("パスワードが違います"); }
}

function switchTeacherTab(tabNum) {
  [1, 2, 3].forEach(n => {
    document.getElementById(`teacherTab${n}`).classList.toggle("hidden", n !== tabNum);
    document.getElementById(`tTab${n}`).classList.toggle("active", n === tabNum);
  });
}

function renderTeacherView() {
  let listHtml = `<table class="compare-table"><thead><tr><th>枠</th><th>名前 (ひらがな)</th><th>区分</th><th>PIN</th><th>保存</th></tr></thead><tbody>`;
  for (let i = 0; i < 3; i++) {
    const category = Storage.get(`onpu_category_${i}`, "年少");
    
    let catOptions = CATEGORIES.map(cat => 
      `<option value="${cat}" ${category===cat?'selected':''}>${cat}</option>`
    ).join("");

    listHtml += `<tr>
      <td>${i+1}</td>
      <td><input type="text" id="tName_${i}" value="${profiles[i]||""}" maxlength="8" style="width:60px;text-align:center;"></td>
      <td>
        <select id="tCategory_${i}" style="font-size:10px;">
          ${catOptions}
        </select>
      </td>
      <td><input type="text" id="tPin_${i}" value="${Storage.get(`onpu_pin_${i}`, "0000")}" maxlength="4" style="width:36px;text-align:center;"></td>
      <td><button onclick="saveStudentByTeacher(${i})" style="font-size:10px;padding:2px 4px;">保存</button></td>
    </tr>`;
  }
  document.getElementById("teacherStudentConfigList").innerHTML = listHtml + `</tbody></table>`;
  
  let themeHtml = `<table class="compare-table"><thead><tr><th>名前</th><th>デザイン</th><th>見本</th></tr></thead><tbody>`;
  profiles.forEach((name, idx) => {
    const cT = Storage.get(`onpu_award_theme_${idx}`, "cat");
    themeHtml += `<tr>
      <td><strong>${name}</strong></td>
      <td>
        <select onchange="saveAwardTheme(${idx}, this.value)" style="font-size:10px;">
          <option value="cat" ${cT==='cat'?'selected':''}>🐱 ねこ</option><option value="cool" ${cT==='cool'?'selected':''}>⚡ クール</option>
          <option value="game" ${cT==='game'?'selected':''}>🎮 ゲーム</option><option value="pop" ${cT==='pop'?'selected':''}>🌈 ポップ</option>
        </select>
      </td>
      <td><button onclick="previewAwardModal(${idx})" style="font-size:10px;padding:2px 4px;">見本</button></td>
    </tr>`;
  });
  document.getElementById("teacherAwardThemeList").innerHTML = themeHtml + `</tbody></table>`;

  let legendHtml = `<table class="compare-table"><thead><tr><th>名前</th><th>称号</th><th>見本</th></tr></thead><tbody>`;
  profiles.forEach((name, idx) => {
    const cnt = getLegendCount(idx);
    legendHtml += `<tr>
      <td><strong>${name}</strong></td>
      <td>${cnt > 0 ? "👑 ×" + cnt : "なし"}</td>
      <td><button onclick="previewLegendModal(${idx})" style="font-size:10px;padding:2px 4px;">100回目の画面</button></td>
    </tr>`;
  });
  document.getElementById("teacherLegendPreviewList").innerHTML = legendHtml + `</tbody></table>`;
}

function saveStudentByTeacher(slot) {
  let rawName = document.getElementById(`tName_${slot}`).value.trim();
  if (!/^[\u3040-\u309Fー0-9a-zA-Z\s]+$/.test(rawName) || !rawName) return alert("正しいお名前を入力してください！");
  const category = document.getElementById(`tCategory_${slot}`).value;
  const newPin = document.getElementById(`tPin_${slot}`).value.trim() || "0000";
  
  profiles[slot] = rawName;
  Storage.set("onpu_profiles", profiles);
  Storage.set(`onpu_category_${slot}`, category);
  Storage.set(`onpu_pin_${slot}`, newPin);
  Storage.set(`onpu_registered_${slot}`, true);
  
  initProfiles();
  alert(`スロット${slot+1} を [${rawName}（${category}）] （PIN: ${newPin}）で保存しました！`);
}

function saveAwardTheme(slot, themeVal) { Storage.set(`onpu_award_theme_${slot}`, themeVal); }
function previewAwardModal(slot) { openAwardModal(slot); }
function previewLegendModal(slot) { showLegendModal(slot); }

/* 🧪 100回目のテスト用（確認が終わったら消します） */
function setStreak99ForTest() {
  Storage.set(`onpu_perf_streak_${activeProfileIndex}`, 99);
  alert(`${profiles[activeProfileIndex]} さんの連続を 99回 にしました。\nトップ画面にもどって、どのコースでも100%で終わると 100回目の画面が出ます。`);
  initProfiles();
}
function resetLegendForTest() {
  Storage.set(`onpu_legend_${activeProfileIndex}`, false);
  Storage.set(`onpu_legend_count_${activeProfileIndex}`, 0);
  Storage.set(`onpu_perf_streak_${activeProfileIndex}`, 0);
  Storage.set(`onpu_perf_max_${activeProfileIndex}`, 0);
  Storage.set(`onpu_award_auto_${activeProfileIndex}`, false);
  alert(`${profiles[activeProfileIndex]} さんの 👑・100回達成の記録・連続回数・自動表彰式の記録を リセットしました。`);
  initProfiles();
  renderTeacherView();
}

function fyTestPass(idx, clef, level) {
  const k = `onpu_best_20_${idx}_${clef}_${level}`;
  const old = Storage.get(k);
  if (!old || old.accuracy < 90) Storage.set(k, { accuracy: 100, time: 60000, count: 20 });
}
function fyTestBasics(idx) {
  const doBest = getDoTestBest(idx);
  if (!doBest || doBest.accuracy < 90) Storage.set(`onpu_do_test_best_${idx}`, { accuracy: 100, time: 60000, mode: "count", count: 20 });
  /* 色おんぷは レベル1だけ。テストでは 黒おんぷに して、レベル2いじょうを ひらく */
  Storage.set(`fy_color_${idx}_treble`, "off"); Storage.set(`fy_color_${idx}_bass`, "off");
}
/* ト音記号・ヘ音記号を レベル5まで開く（レベル4までに 合格を 書きこむ。全カードは まだ 閉じたまま） */
function unlockClefsToLevel5ForTest() {
  const idx = activeProfileIndex;
  fyTestBasics(idx);
  ["treble", "bass"].forEach(c => { for (let l = 1; l <= 4; l++) fyTestPass(idx, c, l); });
  alert("ト音記号・ヘ音記号を レベル5まで開きました！（テスト用）\n全カードは、ト音・ヘ音のレベル5に合格すると開きます。");
  initProfiles();
}
/* 全カードを レベル5まで開く（ト音・ヘ音は レベル5まで合格。全カードは レベル4まで合格） */
function unlockAllCardsToLevel5ForTest() {
  const idx = activeProfileIndex;
  fyTestBasics(idx);
  ["treble", "bass"].forEach(c => { for (let l = 1; l <= 5; l++) fyTestPass(idx, c, l); });
  for (let l = 1; l <= 4; l++) fyTestPass(idx, "all", l);
  Storage.set(`fy_test_master_${idx}`, true);   /* レジェンドへのみちを ひらく（テスト用） */
  Storage.set(`fy_legend_opened_${idx}`, false);
  alert("全カードを レベル5まで開きました！（テスト用）\nト音記号・ヘ音記号も レベル5まで 開いています。\nレジェンドへのみちも 開き、光ります。");
  initProfiles();
}
function resetParentPasswordByTeacher() { Storage.set("onpu_parent_pass", "0123"); alert("保護者パスワードを [ 0123 ] にリセットしました"); }
function resetAllDataForTest() { if (confirm("本当にすべてのデータを消去して初期状態に戻しますか？")) { localStorage.clear(); alert("全データを初期化しました！"); location.reload(); } }

function renderParentCompareTable() {
  let html = `<table class="compare-table"><thead><tr><th>名前</th><th>区分</th><th>連続</th><th>6つのド最高点</th><th>👑100回達成</th></tr></thead><tbody>`;
  profiles.forEach((n, idx) => {
    if (!isRegistered(idx)) return;
    const doB = getDoTestBest(idx);
    const cat = Storage.get(`onpu_category_${idx}`, "年少");
    const cnt = getLegendCount(idx);
    html += `<tr><td><strong>${legendMark(idx)}${n}</strong></td><td>${cat}</td><td>${calculateStreak(idx)}日</td><td>${doB ? doB.accuracy+'%' : '-'}</td><td>${cnt > 0 ? cnt + '回' : '-'}</td></tr>`;
  });
  document.getElementById("parentCompareTable").innerHTML = html + `</tbody></table>`;
}

function showSelectScreen() { navigateTo("selectScreen"); initProfiles(); }
function showLevelScreen() { navigateTo("levelScreen"); createLevelButtons(); }
function handleCardBack() {
  updateLockVisuals();
  selectedClef === "do" ? showSelectScreen() : showLevelScreen();
}

/* 🎉 紙吹雪（前のアニメーションを止めてから始める） */
function startConfetti(count = 30) {
  stopConfetti();
  const canvas = document.getElementById("confettiCanvas"); const ctx = canvas.getContext("2d");
  canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight;
  const colors = ["#e99595", "#e6b26a", "#78a9c8", "#b28bb9", "#ffd700"];
  const pieces = Array.from({length: count}, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * colors.length)], speed: Math.random() * 3 + 2
  }));
  const maxFrames = count > 50 ? 240 : 120;
  let timer = 0;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => { p.y += p.speed; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
    if (timer++ < maxFrames) {
      confettiRafId = requestAnimationFrame(update);
    } else {
      confettiRafId = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  confettiRafId = requestAnimationFrame(update);
}

/* 初期立ち上げ */
showSelectScreen();

/* 初めて開いたとき（名前が1人も登録されていないとき）は、名前の登録画面を出す */
if (!hasAnyRegistered()) {
  openRegistration(true);
}
</script>
<script src="app-extras.js?v=20261113v"></script>
</body>
</html>
