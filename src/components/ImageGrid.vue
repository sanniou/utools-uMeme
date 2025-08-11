<template>
  <div class="image-grid-wrapper">
    <div v-if="!images || images.length === 0" class="empty-state">
      <el-empty description="暂无结果，换个关键词试试？" />
    </div>
    <div v-else class="image-grid">
      <div v-for="image in images" :key="image.id" class="image-item" @click="copyImage(image.url)">
        <el-tooltip :content="image.alt || '点击复制图片'" placement="top">
          <el-image :src="image.thumb" fit="cover" lazy />
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus';
const utools = window.utools;

defineProps({
  images: {
    type: Array,
    required: true,
  },
});

const copyImage = (url) => {
  utools.copyImage(url);
  ElMessage.success('图片已复制到剪贴板！');
};
</script>

<style scoped>
.image-grid-wrapper {
  padding: 1rem;
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
  background-color: #f0f2f5;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.image-item:hover {
  transform: scale(1.05);
}
.el-image {
  width: 100%;
  height: 100%;
}
</style>
