
import axios from 'axios';

async function search(query, page = 1, perPage = 50) {
  if (!query) {
    throw new Error('表情2333网不支持空关键字搜索');
  }

  const url = `https://biaoqing233.com/app/search/${query}?page=${page}&limit=${perPage}`;

  try {
    const config = { method: 'get', url };
    const response = await axios(config);
    const imgLinks = response.data.docs.map(d => `https://lz.sinaimg.cn/large/${d.key}`);

    return imgLinks.map(link => ({
      id: link,
      url: link,
      thumb: link,
      alt: query || '表情2333网',
    }));
  } catch (error) {
    console.error('Failed to fetch from BiaoQing2333:', error);
    throw error;
  }
}

export const biaoqing2333Source = {
  name: '表情2333网',
  supportsPagination: true,
  supportsEmptyQuery: false,
  search,
};
