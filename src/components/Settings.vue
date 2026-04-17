<template>
  <div class="settings-page">
    <!-- Unsplash API Key Setting -->
    <el-form label-width="120px" class="settings-form">
      <el-form-item label="Unsplash Key">
        <el-input v-model="apiKey" placeholder="请输入 Unsplash Access Key" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveApiKey">保存Key</el-button>
      </el-form-item>
    </el-form>

    <el-divider />

    <!-- Source Management -->
    <div class="source-management">
      <div class="header">
        <h3>图源管理</h3>
        <el-button type="danger" @click="handleClearAllFailures" plain>
          清空所有失败记录
        </el-button>
      </div>
      <!-- 使用 draggable 组件实现拖拽排序 -->
      <draggable
        v-model="localSources"
        item-key="name"
        class="source-list"
        handle=".drag-handle"
        @end="onDragEnd"
      >
        <template #item="{ element: source }">
          <div class="source-item">
            <div class="source-info">
              <el-icon class="drag-handle"><Rank /></el-icon>
              <span class="source-name">{{ source.name }}</span>
              <el-tag
                v-if="props.failureCounts[source.name]"
                type="danger"
                size="small"
                effect="light"
                round
              >
                失败 {{ props.failureCounts[source.name] }} 次
              </el-tag>
            </div>
            <div class="source-actions">
              <el-button
                v-if="props.failureCounts[source.name]"
                @click="handleClearFailure(source.name)"
                type="primary"
                link
                size="small"
              >
                清空记录
              </el-button>
              <el-switch
                v-model="enabledSources[source.name]"
                @change="() => handleSourceToggle(source.name)"
              />
            </div>
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import draggable from "vuedraggable";
import { Rank } from "@element-plus/icons-vue";

const props = defineProps({
  allSources: {
    type: Array,
    required: true,
  },
  failureCounts: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["clear-all-failures", "clear-failure", "update-source-order"]);

const utools = window.utools;
const apiKey = ref("");

// Store keys
const API_KEY_DB = "unsplash_api_key";
const DISABLED_SOURCES_DB = "disabled_sources";

// Reactive states
const enabledSources = reactive({});
const localSources = ref([...props.allSources]);

// 监听父组件传递的图源列表变化，同步到本地
watch(() => props.allSources, (newSources) => {
  localSources.value = [...newSources];
});

// Fetch all data on mount
onMounted(() => {
  // Load API key
  const savedKey = utools.db.get(API_KEY_DB);
  if (savedKey) {
    apiKey.value = savedKey.data;
  }

  // Load disabled sources
  const disabledDoc = utools.db.get(DISABLED_SOURCES_DB);
  const disabledList = disabledDoc ? disabledDoc.data : [];
  props.allSources.forEach((source) => {
    enabledSources[source.name] = !disabledList.includes(source.name);
  });
});

// Save Unsplash API Key
const saveApiKey = () => {
  if (!apiKey.value) {
    ElMessage({
      message: "Access Key 不能为空",
      type: "error",
      showClose: true,
    });
    return;
  }
  const existingDoc = utools.db.get(API_KEY_DB);
  utools.db.put({
    _id: API_KEY_DB,
    _rev: existingDoc ? existingDoc._rev : undefined,
    data: apiKey.value,
  });
  ElMessage({
    message: "API Key 保存成功！",
    type: "success",
    showClose: true,
  });
};

// Handle source enable/disable toggle
const handleSourceToggle = (sourceName) => {
  // 使用 Set 优化，逻辑更清晰，性能更好
  const disabledDoc = utools.db.get(DISABLED_SOURCES_DB);
  const disabledSet = new Set(disabledDoc?.data || []);

  if (enabledSources[sourceName]) {
    // 如果图源被启用，从禁用列表中移除
    disabledSet.delete(sourceName);
  } else {
    // 如果图源被禁用，添加到禁用列表
    disabledSet.add(sourceName);
  }

  utools.db.put({
    _id: DISABLED_SOURCES_DB,
    _rev: disabledDoc?._rev,
    data: Array.from(disabledSet), // 转回数组进行存储
  });

  ElMessage({
    message: `图源 ${sourceName} 已${enabledSources[sourceName] ? "启用" : "禁用"}`,
    type: "success",
    showClose: true,
  });
};
const handleClearFailure = (sourceName) => {
  emit("clear-failure", sourceName);
};

const onDragEnd = () => {
  const newOrder = localSources.value.map(s => s.name);
  emit('update-source-order', newOrder);
};

// Clear all failure records
const handleClearAllFailures = () => {
  ElMessageBox.confirm("确定要清空所有图源的失败记录吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      emit("clear-all-failures");
      ElMessage({
        message: "所有失败记录已清空！",
        type: "success",
        showClose: true,
      });
    })
    .catch(() => {
      // User cancelled
    });
};
</script>

<style scoped>
.settings-page {
  padding: 1.5rem 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  /* 改进UI: 添加更现代的背景 */
  background-color: #f8fafc;
}
.settings-form {
  flex-shrink: 0;
  /* 改进UI: 增加卡片效果 */
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.source-management {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  /* 改进UI: 增加卡片效果 */
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
h3 {
  margin: 0;
  font-size: 1.2rem;
  /* 改进UI: 使用更现代的字体 */
  font-weight: 600;
  color: #1e293b;
}
.source-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem; /* 改进UI: 增加列表项之间的间距 */
}
.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.2rem;
  border-radius: 10px;
  /* 改进UI: 使用更现代的背景和边框 */
  background-color: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.source-item:hover {
  /* 改进UI: 优化悬停效果 */
  background-color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.source-info, .source-actions {
  display: flex;
  align-items: center;
  gap: 1rem; /* 内部元素间距 */
}
.drag-handle {
  cursor: grab;
  color: #94a3b8;
  /* 改进UI: 增加悬停效果 */
  transition: color 0.2s ease;
}
.source-name {
  font-weight: 500;
  /* 改进UI: 使用更现代的字体颜色 */
  color: #334155;
}
</style>
