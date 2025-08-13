
import axios from 'axios';
import * as cheerio from 'cheerio';

async function search(query, page = 1) {
  let url;
  let params;

  if (query) {
    url = 'https://www.doutupk.com/search?type=photo&more=1';
    params = { page: page, keyword: query };
  } else {
    url = 'https://www.doutupk.com/article/list';
    params = { page: page };
  }

  try {
    const config = { method: 'get', url, params };
    const response = await axios(config);
    const $ = cheerio.load(response.data);

    const imgLinks = $('.image_dtb,.image_dta').map((_, img) => `${img.attribs['data-original']}`).get();

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '斗图啦表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from Doutula:', error);
    throw error;
  }
}

export const doutulaSource = {
  name: '斗图啦',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
