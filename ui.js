(function attachMnistUi(root) {
  function softmax(logits) {
    const values = Array.from(logits);
    const max = Math.max(...values);
    const exps = values.map((value) => Math.exp(value - max));
    const total = exps.reduce((sum, value) => sum + value, 0);
    return exps.map((value) => value / total);
  }

  function getPrediction(logits) {
    const probabilities = softmax(logits);
    let digit = 0;
    let probability = probabilities[0];

    for (let i = 1; i < probabilities.length; i += 1) {
      if (probabilities[i] > probability) {
        digit = i;
        probability = probabilities[i];
      }
    }

    return {
      digit,
      probability,
      confidences: probabilities.map((item, index) => ({
        digit: index,
        probability: item,
      })),
    };
  }

  function toPercent(value) {
    return `${(value * 100).toFixed(1)}%`;
  }

  function renderConfidenceBars(container, confidences) {
    container.innerHTML = "";

    for (const item of confidences) {
      const row = document.createElement("div");
      row.className = "confidence-row";

      const digit = document.createElement("span");
      digit.className = "confidence-digit";
      digit.textContent = item.digit;

      const track = document.createElement("div");
      track.className = "confidence-track";

      const fill = document.createElement("div");
      fill.className = "confidence-fill";
      fill.style.width = toPercent(item.probability);

      const value = document.createElement("span");
      value.className = "confidence-value";
      value.textContent = toPercent(item.probability);

      track.appendChild(fill);
      row.appendChild(digit);
      row.appendChild(track);
      row.appendChild(value);
      container.appendChild(row);
    }
  }

  const api = {
    softmax,
    getPrediction,
    toPercent,
    renderConfidenceBars,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.MnistUi = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
