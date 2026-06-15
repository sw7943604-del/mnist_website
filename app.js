const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const clearBtn = document.getElementById("clearBtn");
const predictBtn = document.getElementById("predictBtn");
const resultText = document.getElementById("result");
const previewCanvas = document.getElementById("previewCanvas");
const modelStatus = document.getElementById("modelStatus");
const predictionDigit = document.getElementById("predictionDigit");
const predictionConfidence = document.getElementById("predictionConfidence");
const confidenceBars = document.getElementById("confidenceBars");

let session = null;

// ======================
// 初始化 canvas
// ======================

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.strokeStyle = "white";
ctx.lineWidth = 20;
ctx.lineCap = "round";

MnistPreprocess.drawPreview(previewCanvas, new Float32Array(28 * 28));
MnistUi.renderConfidenceBars(
  confidenceBars,
  Array.from({ length: 10 }, (_, digit) => ({ digit, probability: 0 })),
);

function setStatus(text, state) {
  modelStatus.innerText = text;
  modelStatus.className = `status status-${state}`;
}

function resetPrediction(message) {
  predictionDigit.innerText = "-";
  predictionConfidence.innerText = "-";
  resultText.innerText = message;
  MnistUi.renderConfidenceBars(
    confidenceBars,
    Array.from({ length: 10 }, (_, digit) => ({ digit, probability: 0 })),
  );
}

// ======================
// 加载 ONNX 模型
// ======================

async function loadModel() {
  try {
    setStatus("模型加载中", "loading");
    predictBtn.disabled = true;
    session = await ort.InferenceSession.create("./white.onnx");
    console.log("模型加载成功");
    setStatus("模型已加载", "ready");
    predictBtn.disabled = false;
    resetPrediction("请写一个数字");
  } catch (error) {
    console.error("模型加载失败", error);
    setStatus("模型加载失败", "error");
    predictBtn.disabled = true;
    resetPrediction("请确认 white.onnx 和 index.html 在同一文件夹");
  }
}

loadModel();

// ======================
// 绘图
// ======================

let drawing = false;

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if (e.touches) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  }

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function startDraw(e) {
  drawing = true;

  const pos = getPos(e);

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!drawing) return;

  e.preventDefault();

  const pos = getPos(e);

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function endDraw() {
  drawing = false;
}

// 鼠标
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseleave", endDraw);

// 触摸
canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", endDraw);

// ======================
// 清空
// ======================

clearBtn.addEventListener("click", () => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  MnistPreprocess.drawPreview(previewCanvas, new Float32Array(28 * 28));
  resetPrediction(session ? "请写一个数字" : "等待模型加载");
});

// ======================
// 识别
// ======================

predictBtn.addEventListener("click", async () => {

  if (!session) {
    resultText.innerText = "模型还没加载完成";
    return;
  }

  predictBtn.disabled = true;
  resultText.innerText = "识别中";

  const preprocessed = MnistPreprocess.preprocessCanvas(canvas);

  if (preprocessed.empty) {
    resetPrediction("请先写一个数字");
    predictBtn.disabled = false;
    return;
  }

  MnistPreprocess.drawPreview(previewCanvas, preprocessed.previewPixels);

  const tensor = new ort.Tensor(
    "float32",
    preprocessed.input,
    [1, 1, 28, 28]
  );

  try {
    // 推理
    const results = await session.run({
      input: tensor
    });

    const outputTensor = results.output || results[session.outputNames[0]];
    const prediction = MnistUi.getPrediction(outputTensor.data);

    predictionDigit.innerText = prediction.digit;
    predictionConfidence.innerText = MnistUi.toPercent(prediction.probability);
    resultText.innerText = `结果：${prediction.digit}`;
    MnistUi.renderConfidenceBars(confidenceBars, prediction.confidences);

    console.log(outputTensor.data);
  } catch (error) {
    console.error("识别失败", error);
    resetPrediction("识别失败，请刷新页面后重试");
  } finally {
    predictBtn.disabled = false;
  }
});
