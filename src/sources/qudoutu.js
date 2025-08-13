
import axios from 'axios';
import * as cheerio from 'cheerio';

async function search(query, page = 1) {
  let url;
  let img_matcher;

  if (query) {
    url = `http://www.godoutu.com/search/type/face/keyword/${query}/page/${page}.html`;
    img_matcher = '.bqppsearch';
  } else {
    url = `http://www.godoutu.com`;
    img_matcher = '.bqppdiv img';
  }

  try {
    const config = { method: 'get', url };
    const response = await axios(config);
    const $ = cheerio.load(response.data);

    const imgLinks = $(img_matcher).map((_, img) => img.attribs['data-original']).get();

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '去斗图表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from QuDouTu:', error);
    throw error;
  }
}

export const qudoutuSource = {
  name: '去斗图',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
