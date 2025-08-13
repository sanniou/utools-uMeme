
import axios from 'axios';

async function search(query, page = 1, perPage = 20) {
  let params;

  if (query) {
    params = {
      start: (page - 1) * perPage,
      w: query
    };
  } else {
    params = { size: perPage };
  }

  try {
    const config = {
      method: 'get',
      headers: { "Web-Agent": "web" },
      url: `https://www.dbbqb.com/api/search/json`,
      params
    };
    const response = await axios(config);
    const imgLinks = response.data.map(img => `https://image.dbbqb.com/${img.path}`);

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '逗比表情包',
    }));
  } catch (error) {
    console.error('Failed to fetch from Dbbqb:', error);
    throw error;
  }
}

export const dbbqbSource = {
  name: '逗比表情包',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
