
import axios from 'axios';
import { ElMessage } from 'element-plus';

async function search(query, page = 1, perPage = 20) {
  let url;
  let params;

  if (query) {
    // 有关键字时，搜索表情
    url = 'https://doutu.lccyy.com/doutu/items';
    params = { type: 1, pageNum: page, pageSize: perPage, keyword: query };
  } else {
    // 没有关键字时，加载热门表情包
    url = 'https://doutu.lccyy.com/doutu/all';
    // 原始代码中这里limit是固定的30，这里也保持一致
    params = { ac: 'home', start: 0, limit: 30, keyword: '' };
  }

  try {
    const config = {
      method: 'get',
      url,
      params,
      headers: {
        "User-Agent": "Nice"
      }
    };
    const response = await axios(config);
    const { items } = response.data;

    const imgLinks = items ? items.map(item => item['url']) : [];

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '斗图表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from DouTu:', error);
    ElMessage.error(`请求斗图表情失败: ${error.message}`);
    return [];
  }
}

export const doutuSource = {
  name: '斗图',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
