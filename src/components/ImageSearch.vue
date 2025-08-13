<template>
  <div class="image-search-container">
    <header class="search-header">
      <SourceTabs v-model="activeSourceName" />
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
    >
      <Settings />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { ElMessage } from 'element-plus';
import { Setting } from "@element-plus/icons-vue";
import { sources, getSource } from "../sources";
import SourceTabs from "./SourceTabs.vue";
import ImageGrid from "./ImageGrid.vue";
import Settings from "./Settings.vue";

const images = ref([]);
const settingsVisible = ref(false);
const loading = ref(false);
const noMoreData = ref(false);
const scrollContainer = ref(null);

const activeSourceName = ref(sources[0].name);
const activeSource = computed(() => getSource(activeSourceName.value));

const currentPage = ref(1);
const currentQuery = ref("");

// Watch for the active source name changing
watch(activeSourceName, (newName) => {
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


// According to the current source, determine whether to disable infinite scrolling
const isInfiniteScrollDisabled = computed(() => {
  if (loading.value || noMoreData.value) return true;
  // Add a guard clause to prevent errors when activeSource is temporarily unavailable during updates
  if (!activeSource.value) return true;
  return !activeSource.value.supportsPagination;
});

const fetchData = async (isNewSearch = false) => {
  if (loading.value) return;

  // Add a guard clause to prevent errors when activeSource is temporarily unavailable during updates
  if (!activeSource.value) {
    console.warn("fetchData called before activeSource is ready.");
    return;
  }

  // Handle empty keyword for sources that don't support it
  if (!activeSource.value.supportsEmptyQuery && !currentQuery.value) {
    ElMessage.warning('当前图源不支持空关键词搜索');
    images.value = []; // Clear images if query is empty and not supported
    noMoreData.value = true; // No more data for empty query
    loading.value = false;
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
      // For sources that don't support pagination, only fetch on new search
      if (isNewSearch) {
        newImages = await activeSource.value.search(currentQuery.value);
      }
    }

    if (newImages.length === 0) {
      noMoreData.value = true;
    } else {
      images.value.push(...newImages);
      if (activeSource.value.supportsPagination) { // Only increment page if pagination is supported
        currentPage.value++;
      } else {
        // For non-paginated sources, if we got data, it's all we're getting
        noMoreData.value = true;
      }
    }
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
    console.log('Enter key pressed', currentQuery.value);
    handleSearch(currentQuery.value);
  }
};

onMounted(() => {
  // Load last used source
  const storedSourceDoc = utools.db.get('last_source');
  if (storedSourceDoc) {
    activeSourceName.value = storedSourceDoc.data;
  } else {
    // If there is no saved source, manually trigger a search for the default source
    handleSearch(currentQuery.value);
  }

  utools.onPluginEnter(({ type, payload }) => {
    utools.setSubInput(({ text }) => {
      currentQuery.value = text;
    }, "鼠标操作:回车搜索,左击复制图片,中击查看大图,右击加入收藏～");

    if (type === 'over') {
      utools.setSubInputValue(payload);
      currentQuery.value = payload;
      handleSearch(payload);
    }
  });

  addEventListener('keydown', searchOnEnter);
});

onUnmounted(() => {
  removeEventListener('keydown', searchOnEnter);
});


const loadMore = () => {
  // Use source settings to determine if pagination is supported
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
.search-bar-container {
  padding: 1rem;
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