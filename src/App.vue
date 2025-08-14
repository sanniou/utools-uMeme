<template>
  <div id="app">
    <ImageSearch
      :disabled-sources="disabledSources"
      :failure-counts="failureCounts"
      @update-failure-count="updateFailureCount"
      @settings-changed="loadSettings"
      @clear-all-failures="handleClearAllFailures"
      @clear-failure="handleClearFailure"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import ImageSearch from './components/ImageSearch.vue';

const DISABLED_SOURCES_DB = "disabled_sources";
const FAILURE_COUNTS_DB = "source_failure_counts";

const disabledSources = ref([]);
const failureCounts = reactive({});

const loadSettings = () => {
  // Load disabled sources
  const disabledDoc = utools.db.get(DISABLED_SOURCES_DB);
  disabledSources.value = disabledDoc ? disabledDoc.data : [];

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
    ElMessage.success(`图源 ${sourceName} 的失败记录已清空`);
  }
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
