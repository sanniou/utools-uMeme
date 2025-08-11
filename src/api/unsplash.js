import { ElMessage } from 'element-plus';
import utools_dev from "../js/utools_mock";

const utools = window.utools ? window.utools : utools_dev;
const API_BASE = 'https://api.unsplash.com';
const DB_KEY = 'unsplash_api_key';

function getApiKey() {
  const config = utools.db.get(DB_KEY);
  if (!config || !config.data) {
    ElMessage.error('请先在设置中填写 Unsplash Access Key');
    return null;
  }
  return config.data;
}

export async function searchUnsplash(query, page = 1, perPage = 30) {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const url = `${API_BASE}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&client_id=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.errors.join(', ')}`);
    }
    const data = await response.json();
    // 格式化数据以适配我们的组件
    return data.results.map(img => ({
      id: img.id,
      url: img.urls.regular, // 使用 regular 尺寸的图片
      thumb: img.urls.thumb, // 缩略图
      alt: img.alt_description,
      downloadUrl: img.links.download, // 用于触发下载的链接
    }));
  } catch (error) {
    console.error('Failed to fetch from Unsplash:', error);
    ElMessage.error(`请求 Unsplash 失败: ${error.message}`);
    return [];
  }
}
