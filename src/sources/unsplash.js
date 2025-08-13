
import { ElMessage } from 'element-plus';
import utools_dev from "../js/utools_mock";

const utools = window.utools ? window.utools : utools_dev;
const API_BASE = 'https://api.unsplash.com';
const DB_KEY = 'unsplash_api_key';

function getApiKey() {
  const config = utools.db.get(DB_KEY);
  if (!config || !config.data) {
    throw new Error('请先在设置中填写 Unsplash Access Key');
  }
  return config.data;
}

async function search(query, page = 1, perPage = 30) {
  const apiKey = getApiKey(); // This will throw if key is missing

  const url = `${API_BASE}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&client_id=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Try to parse error from Unsplash API response
      try {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.errors.join(', ')}`);
      } catch (e) {
        // If parsing fails, throw a generic error
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
    }
    const data = await response.json();
    // Format data to fit our component
    return data.results.map(img => ({
      id: img.id,
      url: img.urls.regular,
      thumb: img.urls.thumb,
      alt: img.alt_description,
      downloadUrl: img.links.download,
    }));
  } catch (error) {
    console.error('Failed to fetch from Unsplash:', error);
    // Re-throw the error to be caught by the central handler
    throw error;
  }
}

export const unsplashSource = {
  name: 'Unsplash',
  supportsPagination: true,
  supportsEmptyQuery: true,
  search,
};
