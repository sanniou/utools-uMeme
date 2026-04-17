
import axios from 'axios';

async function search(query, page = 1, signal) {
  let url;
  let params;
  let imgExtractor;

  const len = 47;
  const start = (page - 1) * len;

  if (query) {
    url = `https://pic.sogou.com/napi/wap/pic`;
    params = { reqFrom: 'wap_result', start, query: `${query} 表情` };
    imgExtractor = (response) => {
      const items = response.data?.data?.items;
      if (!items) throw new Error('Sogou API returned invalid data structure');
      return items.map(img => img['locImageLink']);
    };
  } else {
    url = `https://pic.sogou.com/napi/wap/emoji/moreEmo`;
    params = { start, len };
    imgExtractor = (response) => {
      const data = response.data?.data;
      if (!data) throw new Error('Sogou API returned invalid data structure');
      return data.map(img => img['cover']);
    };
  }

  try {
    const config = { method: 'get', url, params, signal };
    const response = await axios(config);
    const imgLinks = imgExtractor(response);

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '搜狗表情',
    }));
  } catch (error) {
    // 忽略主动取消的请求
    if (error.name === 'CanceledError' || error.name === 'AbortError') {
      return [];
    }
    console.error('Failed to fetch from Sogou:', error);
    // 失败时返回空数组而不是抛出，避免破坏整个搜索流程
    return [];
  }
}

export const sogouSource = {
  name: '搜狗',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
