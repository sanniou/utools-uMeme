# uMeme

一个用于聚合搜索图片和表情包的 uTools 插件。

## ✨ 功能

- 聚合多个图源（例如 DuckDuckGo, Unsplash）进行搜索。
- 在 uTools 中方便快捷地启动和使用。
- 简洁的图片展示和浏览界面。

## 🚀 如何使用

1. 进入 uTools 主输入框。
2. 输入关键词 `meme`, `表情包` 或 `图片搜索` 来启动插件。
3. 在插件界面中输入你想要搜索的内容，回车即可查看结果。

## 🛠️ 开发

```bash
# 克隆项目
git clone https://github.com/jichang/utools-jenkins-three.git
cd utools-uMeme

# 安装依赖
npm install

# 启动开发服务
npm run dev
```
之后在 uTools 的开发者工具中指向 `http://127.0.0.1:3000` 即可进行开发。

## 📦 构建

```bash
npm run build
```
构建产物将生成在 `dist` 目录下，可用于最终的 `upx` 打包。
