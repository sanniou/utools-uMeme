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
      <!-- 重构为更现代化的列表布局 -->
      <div class="source-list">
        <div v-for="source in allSources" :key="source.name" class="source-item">
          <div class="source-info">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { sources as allSources } from "../sources";

const props = defineProps({
  failureCounts: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["clear-all-failures", "clear-failure"]);

const utools = window.utools;
const apiKey = ref("");

// Store keys
const API_KEY_DB = "unsplash_api_key";
const DISABLED_SOURCES_DB = "disabled_sources";

// Reactive states
const enabledSources = reactive({});

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
  allSources.forEach((source) => {
    enabledSources[source.name] = !disabledList.includes(source.name);
  });
});

// Save Unsplash API Key
const saveApiKey = () => {
  if (!apiKey.value) {
    ElMessage.error("Access Key 不能为空");
    return;
  }
  const existingDoc = utools.db.get(API_KEY_DB);
  utools.db.put({
    _id: API_KEY_DB,
    _rev: existingDoc ? existingDoc._rev : undefined,
    data: apiKey.value,
  });
  ElMessage.success("API Key 保存成功！");
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

  ElMessage.success(
    `图源 ${sourceName} 已${enabledSources[sourceName] ? "启用" : "禁用"}`
  );
};
const handleClearFailure = (sourceName) => {
  emit("clear-failure", sourceName);
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
      ElMessage.success("所有失败记录已清空！");
    })
    .catch(() => {
      // User cancelled
    });
};
</script>

<style scoped>
.settings-page {
  padding: 1rem 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.settings-form {
  flex-shrink: 0;
}
.source-management {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
h3 {
  margin: 0;
  font-size: 1.2rem;
}
.source-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* 列表项之间的间距 */
}
.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}
.source-item:hover {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
.source-info, .source-actions {
  display: flex;
  align-items: center;
  gap: 1rem; /* 内部元素间距 */
}
.source-name {
  font-weight: 500;
}
</style>
