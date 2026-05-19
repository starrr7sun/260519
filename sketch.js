// 手勢偵測變數
let handPose;
let hands = [];
let capture;

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
}

function draw() {
  background('#023e7d');

  let vWidth = width * 0.5;
  let vHeight = height * 0.5;

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
      if (hand.confidence > 0.1) {
        
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

            // 修正映射方向：x=0 映射到 vWidth/2 (左), x=max 映射到 -vWidth/2 (右)
            let x1 = map(p1.x, 0, capture.width, vWidth / 2, -vWidth / 2); 
            let y1 = map(p1.y, 0, capture.height, -vHeight / 2, vHeight / 2);
            let x2 = map(p2.x, 0, capture.width, vWidth / 2, -vWidth / 2);
            let y2 = map(p2.y, 0, capture.height, -vHeight / 2, vHeight / 2);

            line(x1, y1, x2, y2);
          }
        }

        // 繪製手勢的關鍵點（圓圈）
        noStroke(); // 畫圓點時不想要邊框
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          let mappedX = map(keypoint.x, 0, capture.width, vWidth / 2, -vWidth / 2);
          let mappedY = map(keypoint.y, 0, capture.height, -vHeight / 2, vHeight / 2);

          circle(mappedX, mappedY, 12);
        }
      }
    }
  }
  pop(); // 恢復原有的座標系統，避免影響其他繪圖
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}