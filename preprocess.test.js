const assert = require("node:assert/strict");
const { preprocessImageData } = require("./preprocess.js");

function makeImageData(width, height, pixels = []) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4 + 3] = 255;
  }

  for (const pixel of pixels) {
    for (let y = pixel.y; y < pixel.y + pixel.h; y += 1) {
      for (let x = pixel.x; x < pixel.x + pixel.w; x += 1) {
        const index = (y * width + x) * 4;
        data[index] = pixel.value;
        data[index + 1] = pixel.value;
        data[index + 2] = pixel.value;
      }
    }
  }

  return { width, height, data };
}

function previewStats(previewPixels) {
  let sum = 0;
  let cx = 0;
  let cy = 0;
  let minX = 28;
  let minY = 28;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < 28; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      const value = previewPixels[y * 28 + x];
      if (value <= 0.01) continue;
      sum += value;
      cx += x * value;
      cy += y * value;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    sum,
    cx: cx / sum,
    cy: cy / sum,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function approx(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, got ${actual}`,
  );
}

{
  const result = preprocessImageData(makeImageData(100, 100));
  assert.equal(result.empty, true);
}

{
  const result = preprocessImageData(
    makeImageData(100, 100, [{ x: 7, y: 12, w: 12, h: 46, value: 255 }]),
  );

  assert.equal(result.empty, false);
  assert.equal(result.input.length, 28 * 28);
  assert.equal(result.previewPixels.length, 28 * 28);

  const stats = previewStats(result.previewPixels);
  assert.ok(stats.height <= 20, `height should fit MNIST box, got ${stats.height}`);
  assert.ok(stats.width <= 20, `width should fit MNIST box, got ${stats.width}`);
  approx(stats.cx, 13.5, 1.5, "center of mass x");
  approx(stats.cy, 13.5, 1.5, "center of mass y");

  const background = result.input[0];
  const foreground = Math.max(...result.input);
  approx(background, (0 - 0.1307) / 0.3081, 0.0001, "background normalization");
  approx(foreground, (1 - 0.1307) / 0.3081, 0.0001, "foreground normalization");
}

console.log("preprocess tests passed");
