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
           @error="handleImageError($event, image)"
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

const handleImageError = (event, image) => {
  // 图片加载失败时，静默降级 - 不显示占位符以避免UI混乱
  // 图片依然可以点击复制，实际复制时会通过preload层下载
  const imgElement = event.target;
  imgElement.style.opacity = '0.4';
};
</script>

<style scoped>
.image-grid-wrapper {
  /* 计划 1.3: 移除水平内边距，因为它已由父组件的 .content-area 提供，保留垂直内边距 */
  padding: 1rem 0;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.2rem;
}
.image-item {
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  /* 改进UI: 使用更现代的卡片设计，增强层次感 */
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  /* 改进UI: 增强过渡效果，提升交互体验 */
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              border-radius 0.25s ease;
  /* 添加边框增强卡片感 */
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.image-item:hover {
  /* 改进UI: 优化悬停效果，增加弹性动画 */
  transform: scale(1.06);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-radius: 16px;
}
.el-image {
  width: 100%;
  height: 100%;
}

/* 计划 3.2: 为新加载的图片增加淡入和轻微上移动画 */
.image-fade-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.image-fade-leave-active {
  /* 确保在列表项离开时，它们能平滑地消失，并脱离文档流以避免布局抖动 */
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: absolute;
}
.image-fade-enter-from,
.image-fade-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}
</style>
