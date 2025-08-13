
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ElMessage } from 'element-plus';

async function search(query, page = 1) {
  let url;
  let params;

  if (query) {
    // 有关键字时，搜索表情
    url = 'http://www.adoutu.com/search';
    params = { type: 1, page: page, keyword: query };
  } else {
    // 没有关键字时，加载热门表情包
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
    ElMessage.error(`请求爱斗图表情失败: ${error.message}`);
    return [];
  }
}

export const adoutuSource = {
  name: '爱斗图',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
