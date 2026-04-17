<template>
  <teleport to="body">
    <transition name="preview-fade">
      <div v-if="visible" class="image-preview-overlay" @click.self="closePreview">
        <div class="preview-container">
          <div class="preview-header">
            <span class="image-info">{{ imageInfo }}</span>
            <div class="preview-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="copyImage"
                :loading="copying"
              >
                复制图片
              </el-button>
              <el-button 
                type="info" 
                size="small" 
                @click="openInBrowser"
              >
                浏览器打开
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                circle
                :icon="Close"
                @click="closePreview"
              />
            </div>
          </div>
          <div class="preview-content">
            <img 
              :src="previewUrl" 
              :alt="altText" 
              @load="onImageLoad"
              @error="onImageError"
              :class="{ 'loading-image': !imageLoaded }"
            />
            <div v-if="!imageLoaded" class="loading-placeholder">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>加载中...</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Close, Loading } from '@element-plus/icons-vue';
import { copyImageToClipboard } from '../utils/imageTools.js';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    default: ''
  },
  altText: {
    type: String,
    default: ''
  },
  source: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:visible', 'close']);

const imageLoaded = ref(false);
const copying = ref(false);
const previewUrl = ref('');

// 计算属性：图片信息
const imageInfo = computed(() => {
  if (!props.imageUrl) return '';
  try {
    const url = new URL(props.imageUrl);
    return url.hostname + url.pathname;
  } catch (e) {
    return props.imageUrl;
  }
});

// 监听visible变化，重置加载状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    imageLoaded.value = false;
    previewUrl.value = props.imageUrl;
  }
});

// 监听imageUrl变化，更新预览URL
watch(() => props.imageUrl, (newUrl) => {
  if (newUrl && props.visible) {
    imageLoaded.value = false;
    previewUrl.value = newUrl;
  }
});

// 图片加载完成
const onImageLoad = () => {
  imageLoaded.value = true;
};

// 图片加载失败
const onImageError = () => {
  imageLoaded.value = true;
  ElMessage({
    message: '图片加载失败',
    type: 'error',
    showClose: true,
  });
};

// 复制图片
const copyImage = async () => {
  if (!props.imageUrl) return;
  
  copying.value = true;
  try {
    await copyImageToClipboard(props.imageUrl, props.source);
  } finally {
    copying.value = false;
  }
};

// 在浏览器中打开
const openInBrowser = () => {
  if (!props.imageUrl) return;
  
  if (window.utools) {
    window.utools.shellOpenExternal(props.imageUrl);
  } else {
    window.open(props.imageUrl, '_blank');
  }
};

// 关闭预览
const closePreview = () => {
  emit('update:visible', false);
  emit('close');
};
</script>

<style scoped>
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* 改进UI: 使用更现代的渐变背景，增强视觉层次 */
  background: radial-gradient(circle at center, rgba(20, 20, 30, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  backdrop-filter: blur(8px);
}

.preview-container {
  width: 90%;
  max-width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  /* 改进UI: 使用更现代的背景和边框 */
  background-color: rgba(26, 26, 32, 0.95);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  /* 改进UI: 使用更现代的背景和边框 */
  background-color: rgba(32, 32, 40, 0.9);
  color: #fff;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.image-info {
  font-size: 0.9rem;
  color: #c0c0c0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 50%;
  font-weight: 500;
}

.preview-actions {
  display: flex;
  gap: 0.8rem;
}

.preview-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
  /* 改进UI: 使用更现代的背景 */
  background: radial-gradient(circle at center, rgba(20, 20, 30, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%);
}

.preview-content img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 4px;
}

.loading-image {
  opacity: 0;
}

.loading-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 1.5rem;
  border-radius: 12px;
  backdrop-filter: blur(5px);
}

.loading-icon {
  font-size: 2.5rem;
  animation: spin 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 改进UI: 优化过渡动画 */
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>