
import axios from 'axios';

async function search(query, page = 1, perPage = 20) {
  let url;
  let params;

  if (query) {
    url = 'https://api.doutub.com/api/bq/search';
    params = { curPage: page, pageSize: perPage, keyword: query };
  } else {
    url = 'https://api.doutub.com/api/bq/queryNewBq';
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
    throw error;
  }
}

export const doutubaSource = {
  name: '斗图吧',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
