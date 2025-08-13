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
      <el-table :data="allSources" style="width: 100%">
        <el-table-column prop="name" label="图源名称" width="180" />
        <el-table-column label="失败次数" width="100">
          <template #default="{ row }">
            <span>{{ props.failureCounts[row.name] || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="启用">
          <template #default="{ row }">
            <el-switch
              v-model="enabledSources[row.name]"
              @change="() => handleSourceToggle(row.name)"
            />
          </template>
        </el-table-column>
      </el-table>
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

const emit = defineEmits(["clear-all-failures"]);

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
  const disabledList = Object.entries(enabledSources)
    .filter(([, isEnabled]) => !isEnabled)
    .map(([name]) => name);

  const existingDoc = utools.db.get(DISABLED_SOURCES_DB);
  utools.db.put({
    _id: DISABLED_SOURCES_DB,
    _rev: existingDoc ? existingDoc._rev : undefined,
    data: disabledList,
  });

  ElMessage.success(
    `图源 ${sourceName} 已${enabledSources[sourceName] ? "启用" : "禁用"}`
  );
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
</style>
