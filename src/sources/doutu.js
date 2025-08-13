
import axios from 'axios';

async function search(query, page = 1, perPage = 20) {
  let url;
  let params;

  if (query) {
    url = 'https://doutu.lccyy.com/doutu/items';
    params = { type: 1, pageNum: page, pageSize: perPage, keyword: query };
  } else {
    url = 'https://doutu.lccyy.com/doutu/all';
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
    throw error;
  }
}

export const doutuSource = {
  name: '斗图',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
