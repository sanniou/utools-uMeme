
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ElMessage } from 'element-plus';

async function search(query, page = 1) {
  let url;
  let params;

  if (query) {
    // 有关键字时，搜索表情
    url = 'https://www.doutupk.com/search?type=photo&more=1';
    params = { page: page, keyword: query };
  } else {
    // 没有关键字时，加载最新表情包
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
    ElMessage.error(`请求斗图啦表情失败: ${error.message}`);
    return [];
  }
}

export const doutulaSource = {
  name: '斗图啦',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
