(function attachMnistPreprocess(root) {
  const IMAGE_SIZE = 28;
  const TARGET_SIZE = 20;
  const MEAN = 0.1307;
  const STD = 0.3081;
  const THRESHOLD = 20;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function grayAt(imageData, x, y) {
    const index = (y * imageData.width + x) * 4;
    const data = imageData.data;
    return Math.max(data[index], data[index + 1], data[index + 2]) / 255;
  }

  function findInkBox(imageData) {
    let minX = imageData.width;
    let minY = imageData.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < imageData.height; y += 1) {
      for (let x = 0; x < imageData.width; x += 1) {
        const index = (y * imageData.width + x) * 4;
        const value = Math.max(
          imageData.data[index],
          imageData.data[index + 1],
          imageData.data[index + 2],
        );

        if (value <= THRESHOLD) continue;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < 0 || maxY < 0) {
      return null;
    }

    return { minX, minY, maxX, maxY };
  }

  function centerByMass(pixels) {
    let sum = 0;
    let centerX = 0;
    let centerY = 0;

    for (let y = 0; y < IMAGE_SIZE; y += 1) {
      for (let x = 0; x < IMAGE_SIZE; x += 1) {
        const value = pixels[y * IMAGE_SIZE + x];
        if (value <= 0) continue;
        sum += value;
        centerX += x * value;
        centerY += y * value;
      }
    }

    if (sum <= 0) {
      return pixels;
    }

    centerX /= sum;
    centerY /= sum;

    const shiftX = Math.round((IMAGE_SIZE - 1) / 2 - centerX);
    const shiftY = Math.round((IMAGE_SIZE - 1) / 2 - centerY);
    const shifted = new Float32Array(IMAGE_SIZE * IMAGE_SIZE);

    for (let y = 0; y < IMAGE_SIZE; y += 1) {
      for (let x = 0; x < IMAGE_SIZE; x += 1) {
        const value = pixels[y * IMAGE_SIZE + x];
        if (value <= 0) continue;

        const nextX = x + shiftX;
        const nextY = y + shiftY;
        if (nextX < 0 || nextX >= IMAGE_SIZE || nextY < 0 || nextY >= IMAGE_SIZE) continue;

        shifted[nextY * IMAGE_SIZE + nextX] = Math.max(
          shifted[nextY * IMAGE_SIZE + nextX],
          value,
        );
      }
    }

    return shifted;
  }

  function normalizePixels(previewPixels) {
    const input = new Float32Array(IMAGE_SIZE * IMAGE_SIZE);

    for (let i = 0; i < previewPixels.length; i += 1) {
      input[i] = (previewPixels[i] - MEAN) / STD;
    }

    return input;
  }

  function preprocessImageData(imageData) {
    const box = findInkBox(imageData);
    if (!box) {
      return {
        empty: true,
        input: new Float32Array(IMAGE_SIZE * IMAGE_SIZE),
        previewPixels: new Float32Array(IMAGE_SIZE * IMAGE_SIZE),
      };
    }

    const boxWidth = box.maxX - box.minX + 1;
    const boxHeight = box.maxY - box.minY + 1;
    const scale = TARGET_SIZE / Math.max(boxWidth, boxHeight);
    const scaledWidth = clamp(Math.round(boxWidth * scale), 1, IMAGE_SIZE);
    const scaledHeight = clamp(Math.round(boxHeight * scale), 1, IMAGE_SIZE);
    const offsetX = Math.floor((IMAGE_SIZE - scaledWidth) / 2);
    const offsetY = Math.floor((IMAGE_SIZE - scaledHeight) / 2);
    const scaled = new Float32Array(IMAGE_SIZE * IMAGE_SIZE);

    for (let targetY = 0; targetY < scaledHeight; targetY += 1) {
      for (let targetX = 0; targetX < scaledWidth; targetX += 1) {
        const sourceX = clamp(
          box.minX + Math.floor((targetX + 0.5) / scale),
          box.minX,
          box.maxX,
        );
        const sourceY = clamp(
          box.minY + Math.floor((targetY + 0.5) / scale),
          box.minY,
          box.maxY,
        );
        const value = grayAt(imageData, sourceX, sourceY);
        scaled[(offsetY + targetY) * IMAGE_SIZE + offsetX + targetX] = value;
      }
    }

    const previewPixels = centerByMass(scaled);

    return {
      empty: false,
      input: normalizePixels(previewPixels),
      previewPixels,
    };
  }

  function preprocessCanvas(canvas) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return preprocessImageData(imageData);
  }

  function drawPreview(previewCanvas, previewPixels) {
    const context = previewCanvas.getContext("2d");
    const imageData = context.createImageData(IMAGE_SIZE, IMAGE_SIZE);

    for (let i = 0; i < previewPixels.length; i += 1) {
      const value = Math.round(clamp(previewPixels[i], 0, 1) * 255);
      imageData.data[i * 4] = value;
      imageData.data[i * 4 + 1] = value;
      imageData.data[i * 4 + 2] = value;
      imageData.data[i * 4 + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
  }

  const api = {
    IMAGE_SIZE,
    TARGET_SIZE,
    MEAN,
    STD,
    preprocessImageData,
    preprocessCanvas,
    drawPreview,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.MnistPreprocess = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
