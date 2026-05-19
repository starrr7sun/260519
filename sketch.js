let capture;

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏預設的影片元件，我們要在畫布上繪製
}

function draw() {
  background('#023e7d');

  let vWidth = width * 0.5;
  let vHeight = height * 0.5;

  push();
  // 將座標原點移到畫布中心
  translate(width / 2, height / 2);
  // 水平翻轉（左右顛倒）
  scale(-1, 1);
  // 繪製影像，由於已經移到中心點，繪製位置需偏移寬高的一半來達到正中心效果
  image(capture, -vWidth / 2, -vHeight / 2, vWidth, vHeight);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
