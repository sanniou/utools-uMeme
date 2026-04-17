
import axios from 'axios';
import * as cheerio from 'cheerio';

async function search(query, page = 1, signal) {
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
    const config = { method: 'get', url, params, signal };
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
    if (error.name === 'CanceledError' || error.name === 'AbortError') {
      // 请求被主动取消，静默处理
      return [];
    }
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
