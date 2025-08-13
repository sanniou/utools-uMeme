
import axios from 'axios';
import { ElMessage } from 'element-plus';

async function search(query, page = 1, perPage = 47) {
  let url;
  let params;
  let imgExtractor;

  // 搜狗图片搜索每页返回的图片数量
  const len = perPage;
  const start = (page - 1) * len;

  if (query) {
    // 有关键字时，搜索表情
    url = `https://pic.sogou.com/napi/wap/pic`;
    params = { reqFrom: 'wap_result', start, query: `${query} 表情` };
    imgExtractor = (response) => {
      const { items } = response.data.data;
      return items.map(img => img['locImageLink']);
    };
  } else {
    // 没有关键字时，加载热门表情包
    url = `https://pic.sogou.com/napi/wap/emoji/moreEmo`;
    params = { start, len };
    imgExtractor = (response) => {
      const data = response.data.data;
      return data.map(img => img['cover']);
    };
  }

  try {
    const config = { method: 'get', url, params };
    const response = await axios(config);
    const imgLinks = imgExtractor(response);

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '搜狗表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from Sogou:', error);
    ElMessage.error(`请求搜狗表情失败: ${error.message}`);
    return [];
  }
}

export const sogouSource = {
  name: '搜狗',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
