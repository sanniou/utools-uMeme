import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

import ElementPlus from "unplugin-element-plus/vite";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  server: {
    host: "0.0.0.0", // 允许局域网访问
    port: 3000,
  },
  plugins: [
    vue(),
    ElementPlus({
      // 引入的样式的类型，可以是css、sass、less等，
      importStyle: "css",
      useSource: true,
    }),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  // 移除 define: { "process.env": {} }，Vite 会自动处理环境变量
  build: {
    // 生产环境启用代码压缩
    minify: false,
  },
});
