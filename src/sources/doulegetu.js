
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ElMessage } from 'element-plus';

async function search(query, page = 1) {
  let url;
  let params;

  if (query) {
    // 有关键字时，搜索表情
    url = 'https://www.dogetu.com/search.html';
    params = { page: page, keyword: query };
  } else {
    // 没有关键字时，加载最新表情包
    url = 'https://www.dogetu.com/biaoqing.html';
    params = { page: page };
  }

  try {
    const config = { method: 'get', url, params };
    const response = await axios(config);
    const $ = cheerio.load(response.data);

    const imgLinks = $('.item-pic>a>img').map((_, img) => `${img.attribs['src']}`).get();

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '斗了个图表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from DouLeGeTu:', error);
    ElMessage.error(`请求斗了个图表情失败: ${error.message}`);
    return [];
  }
}

export const doulegetuSource = {
  name: '斗了个图',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
