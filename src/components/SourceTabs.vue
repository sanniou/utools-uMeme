<template>
  <div class="source-tabs-wrapper">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane v-for="source in sources" :key="source" :label="source" :name="source" />
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'; // Import watch

const props = defineProps({
  modelValue: String // Define modelValue prop
});

const sources = ref(['Unsplash', 'DuckDuckGo']);
const emit = defineEmits(['sourceChange', 'update:modelValue']); // Add update:modelValue

const activeTab = ref(props.modelValue || sources.value[0]); // Initialize activeTab with prop or first source

watch(() => props.modelValue, (newValue) => {
  activeTab.value = newValue;
});

const handleTabChange = (sourceName) => {
  emit('sourceChange', sourceName);
  emit('update:modelValue', sourceName);
};
</script>

<style scoped>
.source-tabs-wrapper {
  display: flex;
  width: 100%;
}

/* Override Element Plus default styles for a cleaner look */
.el-tabs {
  flex-grow: 1;
  --el-tabs-header-height: 40px; /* Adjust height if needed */
}

/* Style for the tab header itself */
:deep(.el-tabs__header) {
  border-bottom: none; /* Remove the main border below the tabs */
  margin-bottom: 0; /* Remove default margin */
}

/* Style for individual tab items */
:deep(.el-tabs__item) {
  padding: 0 15px; /* Adjust padding for a more compact look */
  height: var(--el-tabs-header-height);
  line-height: var(--el-tabs-header-height);
  font-size: 14px; /* Adjust font size */
  color: #606266; /* Default text color */
  transition: all 0.3s ease; /* Smooth transitions */
  border: none !important; /* Remove individual tab borders */
}

/* Hover state for tabs */
:deep(.el-tabs__item:hover) {
  color: #409eff; /* Element Plus primary color */
}

/* Active tab state */
:deep(.el-tabs__item.is-active) {
  color: #409eff; /* Active text color */
  font-weight: 500; /* Slightly bolder */
}

/* Active tab indicator (the blue line below the active tab) */
:deep(.el-tabs__active-bar) {
  height: 3px; /* Thicker indicator */
  background-color: #409eff; /* Element Plus primary color */
  border-radius: 2px; /* Slightly rounded corners */
}

/* Remove the content area border if type="line" */
:deep(.el-tabs__content) {
  padding: 0; /* Remove default padding if content is directly below */
}
</style>
