<template>
  <div class="skeleton-wrapper">
    <div class="skeleton-grid">
      <!-- 通常显示12个占位符以填充初始视口 -->
      <div v-for="n in 12" :key="n" class="skeleton-item">
        <div class="shimmer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-wrapper {
  padding: 1rem 0;
}
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}
.skeleton-item {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background-color: #e5e7eb; /* 占位符的浅灰色背景 */
  overflow: hidden;
}
.shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: translateX(-100%);
  animation: shimmer-animation 1.5s infinite;
}
@keyframes shimmer-animation {
  100% {
    transform: translateX(100%);
  }
}
</style>