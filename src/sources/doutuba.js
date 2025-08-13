
import axios from 'axios';
import { ElMessage } from 'element-plus';

async function search(query, page = 1, perPage = 20) {
  let url;
  let params;

  if (query) {
    // 有关键字时，搜索表情
    url = 'https://api.doutub.com/api/bq/search';
    params = { curPage: page, pageSize: perPage, keyword: query };
  } else {
    // 没有关键字时，加载热门表情包
    url = 'https://api.doutub.com/api/bq/queryNewBq';
    // 原始代码中这里pageSize是固定的50，这里也保持一致
    params = { curPage: page, typeId: 1, isShowIndex: false, pageSize: 50 };
  }

  try {
    const config = { method: 'get', url, params };
    const response = await axios(config);
    const { rows } = response.data.data;

    const imgLinks = rows.map(row => row['path'].replace('https', 'http'));

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '斗图吧表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from DouTuBa:', error);
    ElMessage.error(`请求斗图吧表情失败: ${error.message}`);
    return [];
  }
}

export const doutubaSource = {
  name: '斗图吧',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
