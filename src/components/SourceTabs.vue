<template>
  <div ref="scrollContainer" class="source-tabs-wrapper">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane
        v-for="source in sources"
        :key="source.name"
        :name="source.name"
      >
        <template #label>
          <span>{{ source.name }}</span>
          <el-badge
            v-if="failureCounts[source.name]"
            :value="failureCounts[source.name]"
            class="failure-badge"
            type="danger"
          />
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: String,
  sources: {
    type: Array,
    required: true,
  },
  failureCounts: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const activeTab = ref(props.modelValue);
const scrollContainer = ref(null);

const handleWheel = (event) => {
  const container = scrollContainer.value;
  if (container && container.scrollWidth > container.clientWidth) {
    event.preventDefault();
    container.scrollLeft += event.deltaY;
  }
};

onMounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('wheel', handleWheel, { passive: false });
  }
});

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('wheel', handleWheel);
  }
});

watch(() => props.modelValue, (newValue) => {
  activeTab.value = newValue;
});

const handleTabChange = (sourceName) => {
  emit('update:modelValue', sourceName);
};
</script>

<style scoped>
.source-tabs-wrapper {
  flex-grow: 1;
  overflow-x: auto; /* Enable horizontal scrolling */
  white-space: nowrap; /* Prevent tabs from wrapping */
  /* Hide scrollbar for a cleaner look */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
}

.source-tabs-wrapper::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
}

.el-tabs {
  --el-tabs-header-height: 40px;
}

:deep(.el-tabs__header) {
  border-bottom: none;
  margin-bottom: 0;
}

:deep(.el-tabs__nav) {
  display: inline-flex; /* Allow the nav to grow with tabs */
}

:deep(.el-tabs__item) {
  padding: 0 15px;
  height: var(--el-tabs-header-height);
  line-height: var(--el-tabs-header-height);
  font-size: 14px;
  color: #606266;
  transition: all 0.3s ease;
  border: none !important;
}

:deep(.el-tabs__item:hover) {
  color: #409eff;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 500;
}

:deep(.el-tabs__active-bar) {
  height: 3px;
  background-color: #409eff;
  border-radius: 2px;
}

.failure-badge {
  margin-left: 8px;
  transform: translateY(-2px); /* Adjust position slightly */
}
</style>
