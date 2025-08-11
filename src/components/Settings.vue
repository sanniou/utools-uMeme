<template>
  <div class="settings-page">
    <el-form label-width="120px">
      <el-form-item label="Unsplash Key">
        <el-input v-model="apiKey" placeholder="请输入 Unsplash Access Key" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const utools = window.utools;
const apiKey = ref('');

const DB_KEY = 'unsplash_api_key';

onMounted(() => {
  const savedKey = utools.db.get(DB_KEY);
  if (savedKey) {
    apiKey.value = savedKey.data;
  }
});

const saveSettings = () => {
  if (!apiKey.value) {
    ElMessage.error('Access Key 不能为空');
    return;
  }
  const existingDoc = utools.db.get(DB_KEY);
  utools.db.put({
    _id: DB_KEY,
    _rev: existingDoc ? existingDoc._rev : undefined,
    data: apiKey.value,
  });
  ElMessage.success('保存成功！');
};
</script>

<style scoped>
.settings-page {
  padding: 2rem;
}
</style>
