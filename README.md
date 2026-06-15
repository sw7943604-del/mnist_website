# MNIST 手写数字识别网站

这是一个纯前端 MNIST 手写数字识别 Demo。网页使用 `onnxruntime-web` 加载 `white.onnx`，在浏览器中直接完成推理，不需要 Python 后端。

## 文件清单

- `index.html`：页面结构
- `style.css`：页面样式
- `app.js`：画布交互、模型加载、推理流程
- `preprocess.js`：MNIST 风格图像预处理
- `ui.js`：置信度计算和结果渲染
- `modelLoader.js`：ONNX Runtime Web 配置和模型加载超时处理
- `white.onnx`：ONNX 模型文件

## 本地运行

不要直接双击 `index.html`。双击会使用 `file://` 协议，浏览器可能拦截 ONNX/WASM 等本地资源。

推荐使用 VS Code 的 Live Server：

1. 安装 VS Code 插件 Live Server。
2. 右键 `index.html`。
3. 选择 `Open with Live Server`。
4. 打开 `http://127.0.0.1:5500`。

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 上传 `index.html`、`style.css`、`app.js`、`preprocess.js`、`ui.js`、`modelLoader.js`、`white.onnx`。
3. 进入仓库 `Settings` -> `Pages`。
4. `Source` 选择 `Deploy from a branch`。
5. `Branch` 选择 `main`，目录选择 `/root`。
6. 保存后等待 GitHub 生成访问地址。

## 测试

安装 Node.js 后，在项目目录运行：

```powershell
node preprocess.test.js
node ui.test.js
node --check preprocess.js
node --check ui.js
node --check modelLoader.js
node --check app.js
```

## 模型输入

模型输入名是 `input`，形状为 `[1, 1, 28, 28]`。预处理流程包括裁剪笔迹、缩放到 `20x20`、放入 `28x28`、按重心居中，并执行 MNIST 标准归一化：

```text
(pixel - 0.1307) / 0.3081
```
