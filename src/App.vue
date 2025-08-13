<template>
  <div id="app">
    <ImageSearch
      :disabled-sources="disabledSources"
      :failure-counts="failureCounts"
      @update-failure-count="updateFailureCount"
      @settings-changed="loadSettings"
      @clear-all-failures="handleClearAllFailures"
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
  console.log("loadSettings called");
  // Load disabled sources
  const disabledDoc = utools.db.get(DISABLED_SOURCES_DB);
  disabledSources.value = disabledDoc ? disabledDoc.data : [];
  console.log("Loaded disabled sources:", disabledSources.value);

  // Load failure counts
  const failuresDoc = utools.db.get(FAILURE_COUNTS_DB);
  console.log("Retrieved failuresDoc from DB:", failuresDoc);

  // Clear existing reactive object before assigning new values
  Object.keys(failureCounts).forEach(key => delete failureCounts[key]);
  if (failuresDoc && failuresDoc.data) {
    Object.assign(failureCounts, failuresDoc.data);
  }
  console.log("Current failureCounts state:", failureCounts);
};

const updateFailureCount = ({ sourceName }) => {
  const currentCount = failureCounts[sourceName] || 0;
  failureCounts[sourceName] = currentCount + 1;

  const existingDoc = utools.db.get(FAILURE_COUNTS_DB);
  const putResult = utools.db.put({
    _id: FAILURE_COUNTS_DB,
    _rev: existingDoc ? existingDoc._rev : undefined,
    data: { ...failureCounts }, // Corrected: save a plain object
  });
  console.log(`utools.db.put result for ${sourceName}:`, putResult);
  console.log(`Updated failure count for ${sourceName}:`, failureCounts[sourceName]);
};

const handleClearAllFailures = () => {
  const existingDoc = utools.db.get(FAILURE_COUNTS_DB);
  if (existingDoc) {
    utools.db.remove(FAILURE_COUNTS_DB);
  }
  Object.keys(failureCounts).forEach((key) => {
    delete failureCounts[key];
  });
  console.log("Cleared all failure counts.", failureCounts);
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