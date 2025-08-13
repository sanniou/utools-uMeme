
import axios from 'axios';
import * as cheerio from 'cheerio';

async function search(query, page = 1) {
  let url;

  if (query) {
    url = `https://www.doutuwang.com/page/${page}?s=${query}`;
  } else {
    url = `https://www.doutuwang.com/category/dashijian/page/${page}`;
  }

  try {
    const config = { method: 'get', url };
    const response = await axios(config);
    const $ = cheerio.load(response.data);

    const imgLinks = $('.post img').map((_, img) => img.attribs['src']).get();

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '斗图王表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from DouTuWang:', error);
    throw error;
  }
}

export const doutuwangSource = {
  name: '斗图王',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
