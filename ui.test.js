const assert = require("node:assert/strict");
const { getPrediction, softmax, toPercent } = require("./ui.js");

{
  const values = softmax([1, 2, 3]);
  const total = values.reduce((sum, value) => sum + value, 0);
  assert.equal(values.length, 3);
  assert.ok(values[2] > values[1]);
  assert.ok(values[1] > values[0]);
  assert.ok(Math.abs(total - 1) < 0.000001);
}

{
  const prediction = getPrediction([-2, 0.5, 4, 1]);
  assert.equal(prediction.digit, 2);
  assert.equal(prediction.confidences.length, 4);
  assert.equal(prediction.confidences[0].digit, 0);
  assert.equal(prediction.confidences[2].digit, 2);
  assert.ok(prediction.confidences[2].probability > prediction.confidences[1].probability);
}

{
  assert.equal(toPercent(0), "0.0%");
  assert.equal(toPercent(0.8732), "87.3%");
  assert.equal(toPercent(1), "100.0%");
}

console.log("ui tests passed");
