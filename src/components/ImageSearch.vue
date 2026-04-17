<template>
  <div class="image-search-container">
    <!-- 头部区域：包含图源Tabs和设置按钮 -->
    <header class="search-header">
       <div class="source-tabs-container">
         <el-tabs
           v-model="activeSourceName"
           class="source-tabs"
           type="card"
         >
           <el-tab-pane
             v-for="source in visibleSources"
             :key="source.name"
             :name="source.name"
           >
             <template #label>
               <span class="tab-label">{{ source.name }}</span>
               <el-badge
                 v-if="props.failureCounts[source.name]"
                 :value="props.failureCounts[source.name]"
                 class="failure-badge"
                 type="danger"
                 :hidden="!props.failureCounts[source.name]"
               />
             </template>
           </el-tab-pane>
         </el-tabs>
         <!-- 更多图源下拉菜单 -->
         <el-dropdown
           v-if="availableSources.length > visibleSources.length"
           @command="(name) => activeSourceName = name"
           placement="bottom-end"
         >
           <el-button text class="more-sources-btn">
             更多 <el-icon><ArrowDown /></el-icon>
           </el-button>
           <template #dropdown>
             <el-dropdown-menu>
               <el-dropdown-item
                 v-for="source in hiddenSources"
                 :key="source.name"
                 :command="source.name"
                 :class="{ 'is-active': activeSourceName === source.name }"
               >
                 <span>{{ source.name }}</span>
                 <el-badge
                   v-if="props.failureCounts[source.name]"
                   :value="props.failureCounts[source.name]"
                   type="danger"
                   size="small"
                   style="margin-left: 8px"
                 />
               </el-dropdown-item>
             </el-dropdown-menu>
           </template>
         </el-dropdown>
       </div>
      <el-button
        @click="settingsVisible = true"
        :icon="Setting"
        circle
        class="settings-btn"
        aria-label="设置"
      />
    </header>
    <main
      ref="scrollContainer"
      class="content-area"
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="isInfiniteScrollDisabled"
      :infinite-scroll-distance="20"
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
        <ImageGrid :key="activeSourceName" :images="images" :source="activeSource" />
      </Transition>

      <!-- 4. 空状态：无搜索结果时显示 -->
      <div v-else class="state-container">
        <el-empty :description="emptyDescription" />
      </div>

      <!-- 5. 加载更多与末尾提示 -->
      <div v-if="images.length > 0" class="state-indicator">
        <div v-if="loading" class="loading-more">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        <el-divider v-if="noMoreData" class="no-more-data">没有更多了</el-divider>
      </div>
    </main>

    <!-- 设置抽屉 -->
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
import { ElMessage, ElResult, ElEmpty, ElIcon, ElDivider } from 'element-plus';
import { Setting, Loading, ArrowDown } from "@element-plus/icons-vue";
import { getSource } from "../sources/index.js";
import { getProxiedImageUrl } from "../utils/imageTools.js"; // Import the new function
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
// currentQuery 反映了输入框的实时内容
const currentQuery = ref("");
// committedQuery 代表用户确认搜索的关键词
const committedQuery = ref(null);

const isInitialized = ref(false);

const availableSources = computed(() =>
  props.allSources.filter((s) => !props.disabledSources.includes(s.name))
);

const activeSourceName = ref("");
const activeSource = computed(() => getSource(activeSourceName.value));

// 搜索取消控制器 - 解决竞态条件
const abortController = ref(null);

// Tabs 显示优化 - 智能控制可见标签数量
const MAX_VISIBLE_TABS = 6;
const visibleSources = computed(() => {
  const all = availableSources.value;
  if (all.length <= MAX_VISIBLE_TABS) return all;
  
  // 优先显示：激活项 + 最近使用 + 失败次数少的
  const activeIndex = all.findIndex(s => s.name === activeSourceName.value);
  const result = [];
  
  // 激活项始终可见
  if (activeIndex >= 0) {
    result.push(all[activeIndex]);
  }
  
  // 填充剩余位置
  for (const source of all) {
    if (result.length >= MAX_VISIBLE_TABS) break;
    if (result.find(s => s.name === source.name)) continue;
    result.push(source);
  }
  
  return result;
});

const hiddenSources = computed(() => {
  const visibleNames = new Set(visibleSources.value.map(s => s.name));
  return availableSources.value.filter(s => !visibleNames.has(s.name));
});

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

// 监听激活图源的变化，并将其持久化存储
watch(activeSourceName, (newName, oldName) => {
  if (newName === oldName || !newName) return;

  // Save the new source to the database
  const doc = utools.db.get('last_source');
  utools.db.put({
    _id: 'last_source',
    data: newName,
    ...(doc ? { _rev: doc._rev } : {})
  });
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

  // 使用 committedQuery 进行搜索
  if (!activeSource.value.supportsEmptyQuery && !committedQuery.value) {
    ElMessage({
      message: '当前图源不支持空关键词搜索',
      type: 'warning',
      showClose: true,
    });
    images.value = [];
    noMoreData.value = true;
    return;
  }

  // 取消上一个未完成的请求
  if (abortController.value) {
    abortController.value.abort();
  }

  // 创建新的取消控制器
  abortController.value = new AbortController();
  const signal = abortController.value.signal;

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
    // 使用 committedQuery 进行搜索
    if (activeSource.value.supportsPagination) {
      newImages = await activeSource.value.search(committedQuery.value, currentPage.value, signal);
    } else {
      if (isNewSearch) {
        newImages = await activeSource.value.search(committedQuery.value, signal);
      }
    }

    // 如果请求已被取消，直接返回不处理结果
    if (signal.aborted) return;

    if (newImages.length === 0) {
      noMoreData.value = true;
    } else {
      const proxiedImages = await Promise.all(
        newImages.map(async (img) => ({
          ...img,
          thumb: await getProxiedImageUrl(img.thumb, activeSource.value),
        }))
      );
      
      // 再次检查是否已被取消
      if (signal.aborted) return;
      
      images.value.push(...proxiedImages);

      if (activeSource.value.supportsPagination) {
        currentPage.value++;
      } else {
        noMoreData.value = true;
      }
    }
  } catch (error) {
    // 忽略主动取消的错误
    if (error.name === 'AbortError') {
      return;
    }
    
    console.error(`Failed to fetch from ${activeSourceName.value}:`, error);
    ElMessage({
      message: `图源 ${activeSourceName.value} 加载失败`,
      type: 'error',
      showClose: true,
    });
    emit('update-failure-count', { sourceName: activeSourceName.value });
    errorOccurred.value = true; // 标记发生了错误
    noMoreData.value = true; // Prevent further loading attempts for this source
  } finally {
    // 只有当前请求未被取消时才重置loading状态
    if (!signal.aborted) {
      loading.value = false;
    }
    abortController.value = null;
  }
};

// handleSearch 的作用是“提交”一个新的搜索词
const handleSearch = (query) => {
  committedQuery.value = query;
};

// 核心搜索触发器：当提交的搜索词或图源变化时，执行搜索
watch([committedQuery, activeSourceName], () => {
  // 确保图源和初始查询都已就绪，再执行搜索
  if (!isInitialized.value || committedQuery.value === null) return;
  fetchData(true);
});

const searchOnEnter = (event) => {
  if (event.code === 'Enter') {
    handleSearch(currentQuery.value);
  }
};

onMounted(() => {
  utools.onPluginEnter(({ type, payload }) => {
    utools.setSubInput(({ text }) => {
      currentQuery.value = text;
    }, "回车搜索, 左击复制图片, Ctrl+左击打开链接");

    let initialQuery = '';
    if (type === 'over') {
      utools.setSubInputValue(payload);
      initialQuery = payload;
    }
    currentQuery.value = initialQuery;
    // 插件进入时，提交初始关键词以触发第一次搜索
    handleSearch(initialQuery);
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
  /* 改进UI: 使用更现代的渐变背景，增强视觉层次 */
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
}
.search-header {
  flex-shrink: 0; /* 防止头部在 flex 布局中被压缩 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 改进UI: 增加内边距，使用更现代的边框和阴影 */
  padding: 0.4rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  gap: 0.8rem; /* 在 tabs 和设置按钮之间添加间距 */
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}
.source-tabs-container {
  display: flex;
  align-items: center;
  flex-grow: 1;
  min-width: 0;
  gap: 8px;
}

.source-tabs {
  flex-grow: 1;
  min-width: 0;
}

.more-sources-btn {
  flex-shrink: 0;
  height: 36px;
  padding: 0 12px;
  font-size: 13px;
}

.tab-label {
  display: inline-block;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.settings-btn {
  /* margin-left 已被父容器的 gap 替代，不再需要 */
}
.content-area {
  flex-grow: 1;
  overflow-y: auto;
  /* 改进UI: 增加内边距，使用更现代的间距 */
  padding: 1.2rem;
}
.state-container {
  /* 改进UI: 优化状态容器样式，增加圆角和阴影 */
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}
.loading-more,
.no-more-data {
  text-align: center;
  /* 改进UI: 使用更现代的字体和颜色 */
  color: #718096; /* 使用更柔和的灰色 */
  font-size: 0.9rem; /* 适当缩小字号 */
  padding: 1rem;
  font-weight: 500;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  /* 改进UI: 增加动画效果 */
  animation: pulse 1.5s ease-in-out infinite;
}

.state-indicator {
  /* 改进UI: 优化底部提示信息容器样式 */
  padding: 1.2rem 0;
  margin-top: 0.5rem;
}

/* 改进UI: 优化网格整体的淡入淡出动画效果 */
.grid-fade-enter-active,
.grid-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.grid-fade-enter-from,
.grid-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
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
  height: 44px; /* 更紧凑的高度，适配 uTools 窗口 */
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 8px 8px 0 0;
}

:deep(.source-tabs .el-tabs__item:hover) {
  color: #303133; /* 使用更深邃的颜色作为悬停效果 */
  background-color: rgba(64, 158, 255, 0.05);
}

:deep(.source-tabs .el-tabs__item.is-active) {
  color: #409eff; /* Element Plus 品牌蓝 */
  background-color: rgba(64, 158, 255, 0.08);
}

:deep(.source-tabs .el-tabs__active-bar) {
  height: 3px;
  background-color: #409eff;
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Card 模式适配 */
:deep(.source-tabs.el-tabs--card .el-tabs__header) {
  border-bottom: none;
}

:deep(.source-tabs.el-tabs--card .el-tabs__item) {
  border: none;
  background: transparent;
}

:deep(.source-tabs.el-tabs--card .el-tabs__item.is-active) {
  background-color: rgba(64, 158, 255, 0.1);
  border-bottom: none;
}

/* 当标签页过多时，Element Plus 会自动添加滚动按钮，这里统一它们的高度 */
:deep(.source-tabs .el-tabs__nav-next),
:deep(.source-tabs .el-tabs__nav-prev) {
  line-height: 44px;
  color: #606266;
  transition: all 0.2s ease;
}

:deep(.source-tabs .el-tabs__nav-next:hover),
:deep(.source-tabs .el-tabs__nav-prev:hover) {
  color: #409eff;
}

/* Dropdown 样式优化 */
:deep(.el-dropdown-menu__item.is-active) {
  color: #409eff;
  font-weight: 500;
  background-color: rgba(64, 158, 255, 0.05);
}

/* 改进UI: 添加脉冲动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
