
import axios from 'axios';

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
    let responseData = response.data;
    if (typeof responseData === 'string') {
      // 关键判断：百度接口返回的 Content-Type 是 text/html，axios 不会自动解析 JSON。
      // 此外，其返回的字符串中包含非标准的转义字符 \'，这会导致 JSON.parse 失败。
      // 同时，其返回内容可能包含 U+0000-U+001F 范围内的非法控制字符（如 ），也需要移除。
      const cleanedData = responseData.replace(/\\'/g, "'")
                                      .replace(/[\u0000-\u001F]/g, '');
      responseData = JSON.parse(cleanedData);
    }

    // 确保 responseData.data 存在且是一个数组，避免后续的 .map 出错
    const data = responseData?.data || [];
    const imgLinks = data.map(d => d['middleURL']);

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '百度表情',
    }));
  } catch (error) {
    console.error('Failed to fetch from Baidu:', error);
    throw error;
  }
}

export const baiduSource = {
  name: '百度',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
