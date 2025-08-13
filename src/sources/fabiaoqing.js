
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ElMessage } from 'element-plus';

async function search(query, page = 1) {
  let url;

  if (query) {
    // 有关键字时，搜索表情
    url = `https://fabiaoqing.com/search/bqb/keyword/${query}/type/bq/page/${page}.html`;
  } else {
    // 没有关键字时，加载热门表情包
    if (page === 1) {
      url = `https://fabiaoqing.com/biaoqing`;
    } else {
      url = `https://fabiaoqing.com/biaoqing/lists/page/${page}.html`;
    }
  }

  try {
    const config = { method: 'get', url };
    const response = await axios(config);
    const $ = cheerio.load(response.data);

    const imgLinks = $('#bqb a img').map((_, img) => img.attribs['data-original']).get();

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '发表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from FaBiaoQing:', error);
    ElMessage.error(`请求发表情失败: ${error.message}`);
    return [];
  }
}

export const fabiaoqingSource = {
  name: '发表情',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
