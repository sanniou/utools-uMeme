
// DuckDuckGo 的图片搜索 URL
const BASE_URL = 'https://duckduckgo.com/';

// 用于从 HTML 中提取图片链接的正则表达式
// 这个表达式寻找 'vqd' 参数，这是后续请求需要的
const VQD_REGEX = /vqd=([\d-]+)&/;

async function search(query) {
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&iax=images&ia=images`;

  try {
    // 1. 获取初始页面以获得 vqd token
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error fetching initial page: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    const vqdMatch = html.match(VQD_REGEX);

    if (!vqdMatch || !vqdMatch[1]) {
      throw new Error('无法获取 vqd token，DuckDuckGo 可能已更新页面结构。');
    }
    const vqd = vqdMatch[1];

    // 2. 使用 vqd token 请求包含图片数据的 URL
    const imageUrl = `${BASE_URL}i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=-1`;
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`HTTP Error fetching image data: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    const imageJs = await imageResponse.text();
    
    let resultsJson;
    try {
        const data = JSON.parse(imageJs);
        if (!data || !data.results) {
            throw new Error('解析图片 JSON 数据失败，"results" 字段不存在。');
        }
        resultsJson = data.results;
    } catch (e) {
        console.error("Failed to parse DuckDuckGo JSON response:", e);
        console.error("Original response string:", imageJs);
        throw new Error('解析图片 JSON 数据失败，响应可能不是有效的 JSON。');
    }

    // 3. 格式化数据以适配我们的组件
    return resultsJson.map(img => ({
      id: img.image,
      url: img.image, // DuckDuckGo 直接提供完整尺寸的链接
      thumb: img.thumbnail, // 缩略图
      alt: img.title,
    }));

  } catch (error) {
    console.error('Failed to fetch from DuckDuckGo:', error);
    throw error;
  }
}

export const duckduckgoSource = {
    name: 'DuckDuckGo',
    supportsPagination: false,
    supportsEmptyQuery: false,
    search,
};
