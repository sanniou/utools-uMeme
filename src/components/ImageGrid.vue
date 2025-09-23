<template>
  <div class="image-grid-wrapper">
    <!-- 状态处理已移至父组件，这里只负责渲染网格 -->
    <TransitionGroup name="image-fade" tag="div" class="image-grid">
      <div v-for="(image, index) in images" :key="image.id || image.url || index" class="image-item" @click="handleImageClick($event, image)">
        <el-image
          :src="image.thumb"
          :title="image.alt || '单击复制图片, Alt+点击预览, Ctrl+点击在浏览器中打开'"
          fit="cover"
          lazy
          referrerpolicy="no-referrer"
        />
      </div>
    </TransitionGroup>
    
    <!-- 图片预览组件 -->
    <ImagePreview
      v-model:visible="previewVisible"
      :image-url="previewImageUrl"
      :alt-text="previewImageAlt"
      :source="source"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { copyImageToClipboard } from '../utils/imageTools.js';
import ImagePreview from './ImagePreview.vue';

const props = defineProps({
  images: {
    type: Array,
    required: true,
  },
  source: {
    type: Object,
    required: true,
  },
});

// 预览相关状态
const previewVisible = ref(false);
const previewImageUrl = ref('');
const previewImageAlt = ref('');

const handleImageClick = (event, image) => {
  if (event.ctrlKey) {
    // Ctrl+点击：在浏览器中打开
    window.utools.shellOpenExternal(image.url);
  } else if (event.altKey) {
    // Alt+点击：预览图片
    previewImageUrl.value = image.url;
    previewImageAlt.value = image.alt || '';
    previewVisible.value = true;
  } else {
    // 普通点击：复制图片
    copyImageToClipboard(image.url, props.source);
  }
};
</script>

<style scoped>
.image-grid-wrapper {
  /* 计划 1.3: 移除水平内边距，因为它已由父组件的 .content-area 提供，保留垂直内边距 */
  padding: 1rem 0;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}
.image-item {
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  /* 计划 2.1 & 2.3: 使用白色背景和柔和阴影创建卡片式“浮起”效果 */
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  /* 计划 2.3 & 3.1: 为阴影和变换添加平滑过渡，提升交互体验 */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.image-item:hover {
  /* 计划 3.1: 悬停时放大并加深阴影，提供清晰的交互反馈 */
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
.el-image {
  width: 100%;
  height: 100%;
}

/* 计划 3.2: 为新加载的图片增加淡入和轻微上移动画 */
.image-fade-enter-active {
  transition: all 0.4s ease;
}
.image-fade-leave-active {
  /* 确保在列表项离开时，它们能平滑地消失，并脱离文档流以避免布局抖动 */
  transition: all 0.3s ease;
  position: absolute;
}
.image-fade-enter-from,
.image-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
