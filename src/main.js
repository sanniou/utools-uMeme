import { createApp } from "vue";
import App from "./App.vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

import utools_dev from "./js/utools_mock";

// 保留 utools 实例的初始化，方便后续使用
let utools = window.utools ? window.utools : utools_dev;
window.utools = utools;

// 插件进入时的逻辑，后续将用于处理搜索等功能
utools.onPluginEnter(function ({ code, type, payload, optional }) {
  try {
    console.log(`[uMeme] plugin enter: code=${code}, type=${type}, payload=${payload}`);
    // 可以在这里根据 code 执行不同的初始化操作
  } catch (e) {
    console.error(e);
  }
});

const app = createApp(App);

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount("#app");