
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ElMessage } from 'element-plus';

async function search(query, page = 1) {
  let url;

  if (query) {
    // 有关键字时，搜索表情
    url = `https://www.doutuwang.com/page/${page}?s=${query}`;
  } else {
    // 没有关键字时，加载热门表情包
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
    ElMessage.error(`请求斗图王表情失败: ${error.message}`);
    return [];
  }
}

export const doutuwangSource = {
  name: '斗图王',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
