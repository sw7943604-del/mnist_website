(function attachModelLoader(root) {
  const WASM_CDN = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
  const MODEL_TIMEOUT_MS = 90000;

  function configureOrt(ort) {
    if (!ort.env) {
      ort.env = {};
    }

    if (!ort.env.wasm) {
      ort.env.wasm = {};
    }

    ort.env.wasm.wasmPaths = WASM_CDN;
  }

  function withTimeout(promise, timeoutMs, message) {
    let timer = null;

    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(message));
      }, timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => {
      clearTimeout(timer);
    });
  }

  async function createSession(ort, modelPath) {
    configureOrt(ort);
    return withTimeout(
      ort.InferenceSession.create(modelPath),
      MODEL_TIMEOUT_MS,
      "模型加载超时，请确认 white.onnx 已上传到 GitHub 仓库根目录，并刷新页面重试",
    );
  }

  const api = {
    WASM_CDN,
    MODEL_TIMEOUT_MS,
    configureOrt,
    withTimeout,
    createSession,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.MnistModelLoader = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
