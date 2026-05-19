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
  
  // 4. 確保有偵測到手勢，且在相同的座標系統下繪製關鍵點
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        
        // 根據左右手設定顏色
        if (hand.handedness == "Left") {
          fill(255, 0, 255);
        } else {
          fill(255, 255, 0);
        }
        noStroke();

        // 尋找手勢的關鍵點
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // 【關鍵等比例換算】
          // ml5.js 偵測到的 x, y 是對應到「原始影片解析度」的座標
          // 我們需要將它對照對應到你縮放後的 vWidth 和 vHeight 上
          // 並且因為圖片渲染起點是 -vWidth/2，所以要加上偏移量
          let mappedX = map(keypoint.x, 0, capture.width, -vWidth / 2, vWidth / 2);
          let mappedY = map(keypoint.y, 0, capture.height, -vHeight / 2, vHeight / 2);

          // 畫出關鍵點圓圈
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