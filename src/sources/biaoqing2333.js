
import axios from 'axios';
import { ElMessage } from 'element-plus';

async function search(query, page = 1, perPage = 50) {
  if (!query) {
    // 表情2333网不支持空关键字搜索
    return [];
  }

  const url = `https://biaoqing233.com/app/search/${query}?page=${page}&limit=${perPage}`;

  try {
    const config = { method: 'get', url };
    const response = await axios(config);
    const imgLinks = response.data.docs.map(d => `https://lz.sinaimg.cn/large/${d.key}`);

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '表情2333网',
    }));
  } catch (error) {
    console.error('Failed to fetch from BiaoQing2333:', error);
    ElMessage.error(`请求表情2333网失败: ${error.message}`);
    return [];
  }
}

export const biaoqing2333Source = {
  name: '表情2333网',
  supportsPagination: true,
  supportsEmptyQuery: false,
  search,
};
