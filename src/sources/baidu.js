
import axios from 'axios';
import { ElMessage } from 'element-plus';

async function search(query, page = 1, perPage = 20) {
  const url = `https://image.baidu.com/search/acjson`;
  const params = {
    tn: "resultjson_com",
    word: query || '表情包', // 百度在无关键字时默认搜索'表情包'
    pn: page * perPage,
    rn: perPage
  };

  try {
    const config = { method: 'get', url, params };
    const response = await axios(config);
    const data = response.data.data;
    const imgLinks = data.map(d => d['middleURL']);

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '百度表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from Baidu:', error);
    ElMessage.error(`请求百度表情失败: ${error.message}`);
    return [];
  }
}

export const baiduSource = {
  name: '百度',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
