<template>
  <div class="image-search-container">
    <header class="search-header">
      <SourceTabs
        v-model="activeSourceName"
        :sources="availableSources"
        :failure-counts="props.failureCounts"
      />
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
      <ImageGrid :images="images" v-loading="loading && images.length === 0" />
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
        :failure-counts="props.failureCounts"
        @clear-all-failures="emit('clear-all-failures')"
      />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { ElMessage } from 'element-plus';
import { Setting } from "@element-plus/icons-vue";
import { sources as allSources, getSource } from "../sources";
import SourceTabs from "./SourceTabs.vue";
import ImageGrid from "./ImageGrid.vue";
import Settings from "./Settings.vue";

const props = defineProps({
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
]);

const images = ref([]);
const settingsVisible = ref(false);
const loading = ref(false);
const noMoreData = ref(false);
const scrollContainer = ref(null);
const currentPage = ref(1);
const currentQuery = ref("");

const availableSources = computed(() =>
  allSources.filter((s) => !props.disabledSources.includes(s.name))
);

const activeSourceName = ref("");
const activeSource = computed(() => getSource(activeSourceName.value));

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

// Watch for changes in available sources and reset active source if needed
watch(availableSources, (newSources) => {
  const activeSourceStillExists = newSources.some(s => s.name === activeSourceName.value);
  if (!activeSourceStillExists) {
    activeSourceName.value = newSources.length > 0 ? newSources[0].name : '';
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
  // Determine initial source
  const storedSourceDoc = utools.db.get('last_source');
  const lastSourceName = storedSourceDoc ? storedSourceDoc.data : null;
  if (lastSourceName && availableSources.value.some(s => s.name === lastSourceName)) {
    activeSourceName.value = lastSourceName;
  } else if (availableSources.value.length > 0) {
    activeSourceName.value = availableSources.value[0].name;
  } else {
    activeSourceName.value = '';
  }

  utools.onPluginEnter(({ type, payload }) => {
    utools.setSubInput(({ text }) => {
      currentQuery.value = text;
    }, "鼠标操作:回车搜索,左击复制图片,中击查看大图,右击加入收藏～");

    if (type === 'over') {
      utools.setSubInputValue(payload);
      currentQuery.value = payload;
      // The watcher will trigger the search
      if (activeSourceName.value) { 
          handleSearch(payload);
      }
    }
  });

  // Initial search if a source is selected
  if (activeSourceName.value) {
      handleSearch("");
  }

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
  background-color: #fff;
}
.search-header {
  display: flex;
  align-items: center;
  padding: 1rem 1rem 0 1rem;
}
.settings-btn {
  margin-left: 1rem;
}
.content-area {
  flex-grow: 1;
  overflow-y: auto;
}
.loading-more,
.no-more-data {
  text-align: center;
  color: #999;
  padding: 1rem;
}
</style>
