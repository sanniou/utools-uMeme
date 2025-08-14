<template>
  <div class="image-search-container">
    <header class="search-header">
      <el-tabs
        v-model="activeSourceName"
        class="source-tabs"
      >
        <el-tab-pane
          v-for="source in availableSources"
          :key="source.name"
          :name="source.name"
        >
          <template #label>
            <span>{{ source.name }}</span>
            <el-badge
              v-if="props.failureCounts[source.name]"
              :value="props.failureCounts[source.name]"
              class="failure-badge"
              type="danger"
            />
          </template>
        </el-tab-pane>
      </el-tabs>
      <el-button
        @click="settingsVisible = true"
        :icon="Setting"
        circle
        class="settings-btn"
      />
    </header>
    <main
      ref="scrollContainer"
      class="content-area"
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="isInfiniteScrollDisabled"
    >
      <!-- 1. 骨架屏：用于首次加载 -->
      <ImageGridSkeleton v-if="loading && images.length === 0" />

      <!-- 2. 错误状态：当加载失败时显示 -->
      <div v-else-if="errorOccurred" class="state-container">
        <el-result
          icon="error"
          :title="`图源 '${activeSourceName}' 加载失败`"
          sub-title="请检查网络连接或图源设置，然后重试。"
        >
          <template #extra>
            <el-button type="primary" @click="handleSearch(currentQuery)">重试</el-button>
          </template>
        </el-result>
      </div>

      <!-- 3. 内容展示：当有图片时，通过过渡动画展示网格 -->
      <Transition v-else-if="images.length > 0" name="grid-fade" mode="out-in">
        <ImageGrid :key="activeSourceName" :images="images" />
      </Transition>

      <!-- 4. 空状态：无搜索结果时显示 -->
      <div v-else class="state-container">
        <el-empty :description="emptyDescription" />
      </div>

      <p v-if="loading && images.length > 0" class="loading-more">加载中...</p>
      <p v-if="noMoreData && images.length > 0" class="no-more-data">
        没有更多了
      </p>
    </main>

    <el-drawer
      v-model="settingsVisible"
      title="设置"
      direction="rtl"
      size="50%"
      destroy-on-close
      @closed="emit('settingsChanged')"
    >
      <Settings
        :all-sources="props.allSources"
        :failure-counts="props.failureCounts"
        @clear-all-failures="emit('clear-all-failures')"
        @clear-failure="(sourceName) => emit('clear-failure', sourceName)"
        @update-source-order="(newOrder) => emit('update-source-order', newOrder)"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { ElMessage, ElResult, ElEmpty } from 'element-plus';
import { Setting } from "@element-plus/icons-vue";
import { getSource } from "../sources/index.js";
import ImageGrid from "./ImageGrid.vue";
import ImageGridSkeleton from "./ImageGridSkeleton.vue";
import Settings from "./Settings.vue";
import utoolsMock from "../js/utools_mock.js";

// 在开发环境（浏览器）中，window.utools 不存在，此时使用 mock 对象
// 在 uTools 环境中，window.utools 由 uTools 注入，直接使用即可
const utools = window.utools || utoolsMock;

const props = defineProps({
  allSources: {
    type: Array,
    required: true,
  },
  disabledSources: {
    type: Array,
    required: true,
  },
  failureCounts: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits([
  "update-failure-count",
  "settingsChanged",
  "clear-all-failures",
  "clear-failure",
  "update-source-order",
]);

const images = ref([]);
const settingsVisible = ref(false);
const loading = ref(false);
const noMoreData = ref(false);
const errorOccurred = ref(false); // 新增：用于追踪错误状态
const scrollContainer = ref(null);
const currentPage = ref(1);
const currentQuery = ref("");

const isInitialized = ref(false);

const availableSources = computed(() =>
  props.allSources.filter((s) => !props.disabledSources.includes(s.name))
);

const activeSourceName = ref("");
const activeSource = computed(() => getSource(activeSourceName.value));

// 新增：动态生成空状态的描述文本
const emptyDescription = computed(() => {
  if (currentQuery.value) {
    return `未找到与 “${currentQuery.value}” 相关的结果`;
  }
  return '输入关键词后回车，开始探索表情包世界';
});

// According to the current source, determine whether to disable infinite scrolling
const isInfiniteScrollDisabled = computed(() => {
  if (loading.value || noMoreData.value) return true;
  if (!activeSource.value) return true;
  return !activeSource.value.supportsPagination;
});

// Watch for the active source name changing
watch(activeSourceName, (newName, oldName) => {
  if (newName === oldName || !newName) return;

  // Save the new source to the database
  const doc = utools.db.get('last_source');
  utools.db.put({
    _id: 'last_source',
    data: newName,
    ...(doc ? { _rev: doc._rev } : {})
  });
  // When the source changes, trigger a new search with the current query
  handleSearch(currentQuery.value);
});

// 监听可用图源列表的变化，以响应式地初始化和重置激活的图源
watch(availableSources, (newSources) => {
  // 如果列表为空，则不执行任何操作
  if (newSources.length === 0) return;

  // 初始化逻辑：仅在图源列表首次加载完成时执行一次
  if (!isInitialized.value) {
    const storedSourceDoc = utools.db.get('last_source');
    const lastSourceName = storedSourceDoc ? storedSourceDoc.data : null;

    // 如果找到了上次使用的图源且它依然可用，则恢复它
    if (lastSourceName && newSources.some(s => s.name === lastSourceName)) {
      activeSourceName.value = lastSourceName;
    } else {
      // 否则，默认选中列表中的第一个
      activeSourceName.value = newSources[0].name;
    }
    isInitialized.value = true;
  } else { // 状态重置逻辑：在后续的更新中，如果当前激活的图源被禁用，则自动切换
    const activeSourceStillExists = newSources.some(s => s.name === activeSourceName.value);
    if (!activeSourceStillExists) {
      activeSourceName.value = newSources.length > 0 ? newSources[0].name : '';
    }
  }
});

const fetchData = async (isNewSearch = false) => {
  if (loading.value) return;

  if (!activeSource.value) {
    images.value = [];
    return;
  }

  if (!activeSource.value.supportsEmptyQuery && !currentQuery.value) {
    ElMessage.warning('当前图源不支持空关键词搜索');
    images.value = [];
    noMoreData.value = true;
    return;
  }

  loading.value = true;
  errorOccurred.value = false; // 开始新的请求前，重置错误状态

  if (isNewSearch) {
    currentPage.value = 1;
    images.value = [];
    noMoreData.value = false;
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0;
    }
  }

  try {
    let newImages = [];
    if (activeSource.value.supportsPagination) {
      newImages = await activeSource.value.search(currentQuery.value, currentPage.value);
    } else {
      if (isNewSearch) {
        newImages = await activeSource.value.search(currentQuery.value);
      }
    }

    if (newImages.length === 0) {
      noMoreData.value = true;
    } else {
      images.value.push(...newImages);
      if (activeSource.value.supportsPagination) {
        currentPage.value++;
      } else {
        noMoreData.value = true;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch from ${activeSourceName.value}:`, error);
    ElMessage.error(`图源 ${activeSourceName.value} 加载失败`);
    emit('update-failure-count', { sourceName: activeSourceName.value });
    errorOccurred.value = true; // 标记发生了错误
    noMoreData.value = true; // Prevent further loading attempts for this source
  } finally {
    loading.value = false;
  }
};

const handleSearch = (query) => {
  currentQuery.value = query;
  fetchData(true);
};

const searchOnEnter = (event) => {
  if (event.code === 'Enter') {
    handleSearch(currentQuery.value);
  }
};

onMounted(() => {
  utools.onPluginEnter(({ type, payload }) => {
    utools.setSubInput(({ text }) => {
      currentQuery.value = text;
    }, "鼠标操作:回车搜索,左击复制图片,中击查看大图,右击加入收藏～");

    if (type === 'over') {
      utools.setSubInputValue(payload);
      currentQuery.value = payload;
      // 搜索将由 activeSourceName 的监听器在图源初始化后自动触发
    }
  });

  addEventListener('keydown', searchOnEnter);
});

onUnmounted(() => {
  removeEventListener('keydown', searchOnEnter);
});

const loadMore = () => {
  if (activeSource.value && activeSource.value.supportsPagination) {
    fetchData(false);
  }
};
</script>

<style scoped>
.image-search-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  /* 计划 2.1: 将主背景色改为一个非常浅的灰色，增加层次感 */
  background-color: #f7f8fa;
}
.search-header {
  flex-shrink: 0; /* 防止头部在 flex 布局中被压缩 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 移除内边距，让 el-tabs 控制其高度和内边距，看起来更整体 */
  padding: 0 1rem;
  border-bottom: 1px solid #e5e7eb;
  gap: 1rem; /* 在 tabs 和设置按钮之间添加间距 */
}
.source-tabs {
  flex-grow: 1; /* 让 tabs 占据尽可能多的空间 */
  min-width: 0; /* Flex 布局关键点: 允许 tabs 容器收缩，从而触发其内部的滚动机制 */
}
.settings-btn {
  /* margin-left 已被父容器的 gap 替代，不再需要 */
}
.content-area {
  flex-grow: 1;
  overflow-y: auto;
  /* 计划 1.2: 增加左右内边距，创造呼吸感 */
  padding: 0 1rem;
}
.state-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
.loading-more,
.no-more-data {
  text-align: center;
  /* 计划 2.2: 优化提示文字的视觉效果，使其不那么突兀 */
  color: #a0aec0; /* 使用更柔和的灰色 */
  font-size: 0.9rem; /* 适当缩小字号 */
  padding: 1rem;
}

/* 计划 3.2: 定义网格整体的淡入淡出动画效果 */
.grid-fade-enter-active,
.grid-fade-leave-active {
  transition: opacity 0.2s ease;
}
.grid-fade-enter-from,
.grid-fade-leave-to {
  opacity: 0;
}

/* 深度选择器，用于定制化 el-tabs 样式 */
:deep(.source-tabs .el-tabs__header) {
  margin: 0;
  border-bottom: none; /* 移除 header 自身的边框，因为父元素已经有了 */
}

:deep(.source-tabs .el-tabs__nav-wrap::after) {
  display: none; /* 移除 tab 导航条默认的下边框线 */
}

:deep(.source-tabs .el-tabs__item) {
  height: 56px; /* 增加头部高度，使其更大气 */
  padding: 0 20px;
  font-size: 15px;
  font-weight: 500;
  color: #606266;
  transition: color 0.2s ease-in-out;
}

:deep(.source-tabs .el-tabs__item:hover) {
  color: #303133; /* 使用更深邃的颜色作为悬停效果 */
}

:deep(.source-tabs .el-tabs__item.is-active) {
  color: #409eff; /* Element Plus 品牌蓝 */
}

:deep(.source-tabs .el-tabs__active-bar) {
  height: 3px;
  background-color: #409eff;
  border-radius: 2px;
}

/* 当标签页过多时，Element Plus 会自动添加滚动按钮，这里统一它们的高度 */
:deep(.source-tabs .el-tabs__nav-next),
:deep(.source-tabs .el-tabs__nav-prev) {
  line-height: 56px;
}
</style>
