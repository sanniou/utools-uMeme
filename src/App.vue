<template>
  <div id="app">
    <ImageSearch
      :all-sources="orderedSources"
      :disabled-sources="disabledSources"
      :failure-counts="failureCounts"
      @update-failure-count="updateFailureCount"
      @settings-changed="loadSettings"
      @clear-all-failures="handleClearAllFailures"
      @clear-failure="handleClearFailure"
      @update-source-order="handleUpdateSourceOrder"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import ImageSearch from './components/ImageSearch.vue';
import { sources as defaultSources } from './sources';
import { ElMessage } from 'element-plus';

const DISABLED_SOURCES_DB = "disabled_sources";
const FAILURE_COUNTS_DB = "source_failure_counts";
const SOURCE_ORDER_DB = "source_order";

const disabledSources = ref([]);
const failureCounts = reactive({});
const orderedSources = ref([]);

const loadSettings = () => {
  // Load disabled sources
  const disabledDoc = utools.db.get(DISABLED_SOURCES_DB);
  disabledSources.value = disabledDoc ? disabledDoc.data : [];

  // Load and apply source order
  const orderDoc = utools.db.get(SOURCE_ORDER_DB);
  const savedOrder = orderDoc ? orderDoc.data : [];
  const defaultOrder = defaultSources.map(s => s.name);
  const defaultSourceNames = new Set(defaultOrder);

  // 1. 过滤已保存的顺序，移除已不存在的图源
  let finalOrder = savedOrder.filter(name => defaultSourceNames.has(name));

  // 2. 将新增的图源（存在于默认列表但不存在于已保存列表）追加到末尾
  defaultOrder.forEach(name => {
    if (!finalOrder.includes(name)) {
      finalOrder.push(name);
    }
  });

  // 3. 根据最终的顺序数组，对原始图源数组进行排序
  const sourceMap = new Map(defaultSources.map(s => [s.name, s]));
  orderedSources.value = finalOrder.map(name => sourceMap.get(name));

  // Load failure counts
  const failuresDoc = utools.db.get(FAILURE_COUNTS_DB);

  // Clear existing reactive object before assigning new values
  Object.keys(failureCounts).forEach(key => delete failureCounts[key]);
  if (failuresDoc && failuresDoc.data) {
    Object.assign(failureCounts, failuresDoc.data);
  }
};

const updateFailureCount = ({ sourceName }) => {
  const currentCount = failureCounts[sourceName] || 0;
  failureCounts[sourceName] = currentCount + 1;

  const existingDoc = utools.db.get(FAILURE_COUNTS_DB);
  utools.db.put({
    _id: FAILURE_COUNTS_DB,
    _rev: existingDoc ? existingDoc._rev : undefined,
    data: { ...failureCounts }, // Corrected: save a plain object
  });
};

const handleClearAllFailures = () => {
  const existingDoc = utools.db.get(FAILURE_COUNTS_DB);
  if (existingDoc) {
    utools.db.remove(FAILURE_COUNTS_DB);
  }
  Object.keys(failureCounts).forEach((key) => {
    delete failureCounts[key];
  });
};

const handleClearFailure = (sourceName) => {
  if (failureCounts.hasOwnProperty(sourceName)) {
    delete failureCounts[sourceName];

    const existingDoc = utools.db.get(FAILURE_COUNTS_DB);
    if (existingDoc) {
      utools.db.put({
        _id: FAILURE_COUNTS_DB,
        _rev: existingDoc._rev,
        data: { ...failureCounts },
      });
    }
    ElMessage({
      message: `图源 ${sourceName} 的失败记录已清空`,
      type: 'success',
      showClose: true,
    });
  }
};

const handleUpdateSourceOrder = (newOrder) => {
  // newOrder 是一个包含图源名称的数组
  const sourceMap = new Map(orderedSources.value.map(s => [s.name, s]));
  orderedSources.value = newOrder.map(name => sourceMap.get(name));

  const doc = utools.db.get(SOURCE_ORDER_DB);
  utools.db.put({
    _id: SOURCE_ORDER_DB,
    _rev: doc?._rev,
    data: newOrder,
  });
  ElMessage({
    message: '图源顺序已保存',
    type: 'success',
    showClose: true,
  });
};

onMounted(() => {
  loadSettings();
});

</script>

<style>
/* Global styles */
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
