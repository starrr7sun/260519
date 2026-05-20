// 手勢偵測變數
let handPose;
let hands = [];
let capture;
let detectedNumber = 0; // 存儲偵測到的數字

// 遊戲狀態變數
let gameState = "START"; // START, PLAYING, RESULT
let userFinalNumber = 0;
let computerNumber = 0;
let gameResultMessage = "";
let stateTimer = 0; // 用於簡單的延遲判定
let isThumbsUp = false;
let isThumbsDown = false;
let countdownStartTime = 0; // 倒數計時開始時間
let startButton; // 遊戲開始按鈕
let gestureTimer = 0; // 用於手勢穩定判定

function preload() {
  // 初始化 HandPose 模型，設定 flipped: true 讓它跟著你的翻轉邏輯
  handPose = ml5.handPose({ flipped: false }); // 讓模型處理原始影片，翻轉由 draw 函數處理
}

function mousePressed() {
  console.log(hands);
}

// 接收手勢偵測結果
function gotHands(results) {
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 建立影片擷取
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏預設的影片元件

  // 開始偵測手勢
  handPose.detectStart(capture, gotHands);

  // 建立遊戲開始按鈕
  startButton = createButton('開始遊戲');
  startButton.style('font-size', '20px');
  startButton.style('padding', '12px 24px');
  startButton.style('background-color', '#ffbe0b');
  startButton.style('border', 'none');
  startButton.style('border-radius', '8px');
  startButton.style('cursor', 'pointer');
  startButton.style('font-weight', 'bold');
  startButton.style('z-index', '100'); // 確保按鈕在畫布最上層
  startButton.mousePressed(startGameAction);
  startButton.hide();
}

function draw() {
  background('#023e7d');

  let vWidth = width * 0.5;
  let vHeight = height * 0.5;
  detectedNumber = 0; // 每幀重置數字
  isThumbsUp = false;
  isThumbsDown = false;

  push();
  // 1. 將座標原點移到畫布中心
  translate(width / 2, height / 2);
  
  // 2. 水平翻轉（左右顛倒）
  scale(-1, 1);
  
  // 3. 繪製影像，由於已經移到中心點，繪製位置需偏移寬高的一半來達到正中心效果
  image(capture, -vWidth / 2, -vHeight / 2, vWidth, vHeight);
  
  // 4. 確保有偵測到手勢，且攝影機已讀取到寬高資訊
  if (hands.length > 0 && capture.width > 0) {
    for (let hand of hands) {
      // 提高信心值門檻，減少誤判
      if (hand.confidence > 0.7) {
        
        // --- 辨識手指數量 ---
        let otherFingersCount = 0;
        let wrist = hand.keypoints[0]; // 以手腕作為參考點

        // 食指(8)、中指(12)、無名指(16)、小指(20)
        // 比較尖端與手腕的距離是否大於第二關節與手腕的距離，這對手部旋轉更具魯棒性
        if (dist(hand.keypoints[8].x, hand.keypoints[8].y, wrist.x, wrist.y) > dist(hand.keypoints[7].x, hand.keypoints[7].y, wrist.x, wrist.y)) otherFingersCount++;
        if (dist(hand.keypoints[12].x, hand.keypoints[12].y, wrist.x, wrist.y) > dist(hand.keypoints[11].x, hand.keypoints[11].y, wrist.x, wrist.y)) otherFingersCount++;
        if (dist(hand.keypoints[16].x, hand.keypoints[16].y, wrist.x, wrist.y) > dist(hand.keypoints[15].x, hand.keypoints[15].y, wrist.x, wrist.y)) otherFingersCount++;
        if (dist(hand.keypoints[20].x, hand.keypoints[20].y, wrist.x, wrist.y) > dist(hand.keypoints[19].x, hand.keypoints[19].y, wrist.x, wrist.y)) otherFingersCount++;
        
        // 大拇指(4)：判斷尖端與小指基部(17)的距離是否顯著大於大拇指第一關節(3)與小指基部的距離
        let dThumbTip = dist(hand.keypoints[4].x, hand.keypoints[4].y, hand.keypoints[17].x, hand.keypoints[17].y);
        let dThumbKnuckle = dist(hand.keypoints[3].x, hand.keypoints[3].y, hand.keypoints[17].x, hand.keypoints[17].y);
        let thumbExtended = dThumbTip > dThumbKnuckle * 1.1; // 增加 10% 的緩衝空間確保是伸直的

        // 特殊手勢判斷：大拇指伸出，且其他手指必須完全收起
        if (thumbExtended && otherFingersCount === 0) {
          // 比較大拇指尖端(4)與關節(2)的 Y 座標
          // 注意：座標系中 Y 越小越高
          if (hand.keypoints[4].y < hand.keypoints[3].y && hand.keypoints[4].y < hand.keypoints[2].y) {
            isThumbsUp = true;
          } else if (hand.keypoints[4].y > hand.keypoints[3].y && hand.keypoints[4].y > hand.keypoints[2].y) {
            isThumbsDown = true;
          }
        }

        // 計算總指頭數 (用於遊戲出拳)
        let totalCount = otherFingersCount + (thumbExtended ? 1 : 0);
        detectedNumber = min(detectedNumber + totalCount, 5);
        
        // 預先計算映射後的關鍵點座標，避免在迴圈中重複 map
        let points = hand.keypoints;

        // 根據左右手設定顏色
        if (hand.handedness == "Left") {
          fill(255, 0, 255);
          stroke(255, 0, 255); // 線條顏色與手部顏色一致
        } else {
          fill(255, 255, 0);
          stroke(255, 255, 0);
        }

        // --- 繪製骨架連線 ---
        strokeWeight(2);
        // 定義每一根手指的連線路徑 (索引值)
        let fingers = [
          [0, 1, 2, 3, 4],     // 大拇指
          [0, 5, 6, 7, 8],     // 食指
          [0, 9, 10, 11, 12],  // 中指
          [0, 13, 14, 15, 16], // 無名指
          [0, 17, 18, 19, 20], // 小指
          [5, 9, 13, 17]       // 手掌基部連線
        ];

        for (let path of fingers) {
          for (let i = 0; i < path.length - 1; i++) {
            let p1 = hand.keypoints[path[i]];
            let p2 = hand.keypoints[path[i + 1]];

            // 修正旋轉與位移跟隨：使用動態計算的 vWidth/vHeight
            // Y 軸映射：影片頂端 (0) 對應畫布上方 (-vHeight / 2)，影片底端對應畫布下方 (vHeight / 2)
            let x1 = map(p1.x, 0, capture.width, -vWidth / 2, vWidth / 2);
            let y1 = map(p1.y, 0, capture.height, -vHeight / 2, vHeight / 2);
            let x2 = map(p2.x, 0, capture.width, -vWidth / 2, vWidth / 2);
            let y2 = map(p2.y, 0, capture.height, -vHeight / 2, vHeight / 2);

            line(x1, y1, x2, y2);
          }
        }

        // 繪製手勢的關鍵點（圓圈）
        noStroke(); // 畫圓點時不想要邊框
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          let mappedX = map(keypoint.x, 0, capture.width, -vWidth / 2, vWidth / 2);
          // 同步修正圓點的 Y 軸映射
          let mappedY = map(keypoint.y, 0, capture.height, -vHeight / 2, vHeight / 2);

          circle(mappedX, mappedY, 12);
        }
      }
    }
  }
  pop(); // 恢復原有的座標系統，避免影響其他繪圖

  // --- 遊戲邏輯與 UI 顯示 ---
  push();
  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  if (gameState === "START") {
    // --- 待機畫面 ---
    fill(255);
    textSize(40);
    text("比出 👍 或點擊按鈕開始", width / 2, height * 0.70);
    
    // 顯示按鈕並定位
    startButton.show();
    startButton.html("開始遊戲");
    startButton.position(width / 2 - startButton.width / 2, height * 0.80);

    // 偵測到比讚且維持一段時間才開始
    if (isThumbsUp) {
      gestureTimer++;
      if (gestureTimer > 20) { // 持續約 0.3-0.5 秒
        startGameAction();
        gestureTimer = 0;
      }
    } else {
      gestureTimer = 0;
    }

  } else if (gameState === "COUNTDOWN") {
    // --- 倒數計時畫面 ---
    let elapsed = millis() - countdownStartTime;
    let currentCD = 3 - floor(elapsed / 1000);
    
    fill('#ffbe0b');
    textSize(150);
    text(currentCD > 0 ? currentCD : "GO!", width / 2, height / 2);
    
    textSize(40);
    fill(255);
    text("準備出拳...", width / 2, height * 0.2);

    if (elapsed > 3500) { // 3秒倒數 + 0.5秒顯示 GO
      gameState = "PLAYING";
      gameResultMessage = "請出拳！";
      stateTimer = 0;
    }

  } else if (gameState === "PLAYING") {
    // --- 遊戲進行中 ---
    fill('#ffbe0b');
    textSize(40);
    text(gameResultMessage, width / 2, height * 0.15);
    
    // 顯示目前偵測到的數字
    textSize(100);
    text(detectedNumber, width / 2, height * 0.85);

    // 當玩家比出數字後（假設數字穩定且不為 0，或停留一小段時間）
    // 這裡為了流暢性，我們偵測到數字變化就讓電腦出拳
    if (detectedNumber > 0) {
      stateTimer++;
      if (stateTimer > 30) { // 持續偵測約 0.5 秒
        userFinalNumber = detectedNumber;
        computerNumber = floor(random(0, 6)); // 電腦隨機 0~5
        determineWinner();
        gameState = "RESULT";
        stateTimer = 0;
      }
    } else {
      stateTimer = 0;
    }

  } else if (gameState === "RESULT") {
    // --- 顯示結果 ---
    textSize(50);
    fill(255);
    text(`你出: ${userFinalNumber}  VS  電腦出: ${computerNumber}`, width / 2, height * 0.15);
    
    textSize(80);
    if (gameResultMessage === "你贏了！") fill('#00ff00');
    else if (gameResultMessage === "你輸了...") fill('#ff595e');
    else fill(255);
    text(gameResultMessage, width / 2, height * 0.70);

    textSize(25);
    fill(200);
    text("👍 重新開始  |  👎 結束遊戲", width / 2, height * 0.92);

    // 邏輯處理：先歸零（收回手）以確保手勢判定準確
    if (detectedNumber === 0) stateTimer = 1; 
    
    if (stateTimer === 1) {
      // 在結果畫面也可以用按鈕重新開始
      startButton.show();
      startButton.html("重新開始");
      startButton.position(width / 2 - startButton.width / 2, height * 0.80);

      // 加入穩定度判定的重新開始與結束邏輯
      if (isThumbsUp || isThumbsDown) {
        gestureTimer++;
        if (gestureTimer > 20) {
          if (isThumbsUp) {
            startGameAction();
          } else {
            gameState = "START";
            startButton.hide();
          }
          gestureTimer = 0;
        }
      } else {
        // 移除 stateTimer = 0，避免在收手後還沒比出手勢前就重置狀態
        gestureTimer = 0;
      }
    }
  }
  pop();
}

// 勝負判斷邏輯
function determineWinner() {
  if (userFinalNumber > computerNumber) {
    gameResultMessage = "你贏了！";
  } else if (userFinalNumber < computerNumber) {
    gameResultMessage = "你輸了...";
  } else {
    gameResultMessage = "平手！";
  }
}

// 統一的開始遊戲觸發函式
function startGameAction() {
  gameState = "COUNTDOWN";
  countdownStartTime = millis();
  stateTimer = 0;
  gestureTimer = 0;
  startButton.hide(); // 開始後隱藏按鈕
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}