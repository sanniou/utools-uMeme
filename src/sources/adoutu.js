
import axios from 'axios';
import * as cheerio from 'cheerio';

async function search(query, page = 1) {
  let url;
  let params;

  if (query) {
    url = 'http://www.adoutu.com/search';
    params = { type: 1, page: page, keyword: query };
  } else {
    url = `http://www.adoutu.com/picture/list/${page}`;
    params = {};
  }

  try {
    const config = { method: 'get', url, params };
    const response = await axios(config);
    const $ = cheerio.load(response.data);

    const imgLinks = $('.picture-list img').map((_, img) => img.attribs['src']).get();

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '爱斗图表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from AiDouTu:', error);
    throw error;
  }
}

export const adoutuSource = {
  name: '爱斗图',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
