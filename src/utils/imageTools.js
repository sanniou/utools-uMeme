import { ElMessage } from 'element-plus';

/**
 * 为浏览器开发环境创建的模拟 API。
 * 当 preload.js 不可用时，它会模拟 window.api 的行为。
 */
const mockApi = {
  /**
   * @param {string} imageUrl
   * @returns {Promise<{success: boolean, message: string}>}
   */
  copyImage: async (imageUrl) => {
    console.log(`[Mock API] 调用 copyImage，URL: "${imageUrl}"`);
    // 增加一个延迟来模拟网络请求，方便观察加载状态
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      // 在浏览器中，我们可以模拟将 URL 写入剪贴板来测试。
      await navigator.clipboard.writeText(`(已模拟复制图片: ${imageUrl})`);
      return { success: true, message: '图片已复制 (Mock)' };
    } catch (err) {
      console.error('Mock: 写入剪贴板失败。', err);
      return { success: false, message: '复制失败 (Mock)' };
    }
  },
  /**
   * @param {string} imageUrl
   * @returns {Promise<string>}
   */
  fetchImageAsBase64: async (imageUrl) => {
    console.log(`[Mock API] Calling fetchImageAsBase64 for "${imageUrl}"`);
    // In a browser, we can't actually bypass CORS/hotlinking,
    // so for the mock, we just return the original URL.
    // The browser will try to fetch it directly.
    return Promise.resolve(imageUrl);
  }
};

/**
 * 优先使用由 preload.js 注入的真实 API (window.api)。
 * 如果不存在（例如在浏览器中开发），则降级使用我们创建的 mockApi。
 */
const api = window.api || mockApi;

/**
 * 异步将图片复制到剪贴板。
 * 此函数作为 preload.js 所提供 API 的客户端，
 * 负责处理异步操作并通过 ElMessage 提供用户界面反馈。
 *
 * @param {string} imageUrl 要复制的图片的 URL。
 * @param {object} source 图源对象
 */
export async function copyImageToClipboard(imageUrl, source) {
  if (!imageUrl) {
    console.error('copyImageToClipboard: 必须提供图片 URL。');
    ElMessage({
      message: '图片链接无效',
      type: 'warning',
      showClose: true,
    });
    return;
  }

  const loadingMessage = ElMessage({
    message: '正在复制图片中...',
    type: 'info',
    duration: 0, // 持续显示，直到手动关闭
  });

  try {
    // 将所有复杂的逻辑（下载、复制）委托给 preload 脚本的 API。
    const result = await api.copyImage(imageUrl, source);

    // 向用户展示操作结果。
    if (result.success) {
      ElMessage({
        message: result.message || '复制成功',
        type: 'success',
        showClose: true,
      });
    } else {
      ElMessage({
        message: result.message || '复制失败',
        type: 'error',
        showClose: true,
      });
      // 在真实的 uTools 环境中，我们也可以为关键错误显示系统通知。
      if (window.utools) {
        window.utools.showNotification(result.message);
      }
    }
  } catch (error) {
    const errorMessage = `发生未知错误: ${error.message}`;
    console.error('copyImageToClipboard 失败:', error);
    ElMessage({
      message: errorMessage,
      type: 'error',
      showClose: true,
    });
    if (window.utools) {
      window.utools.showNotification(errorMessage);
    }
  } finally {
    // 无论成功或失败，都关闭加载提示
    loadingMessage.close();
  }
}

/**
 * Retrieves a proxied, base64-encoded version of an image URL.
 * This helps bypass hotlink protection (403 errors).
 * Falls back to the original URL if the proxy fails.
 * @param {string} imageUrl The original image URL.
 * @param {object} source The image source object.
 * @returns {Promise<string>} The base64 data URL or the original URL on failure.
 */
export async function getProxiedImageUrl(imageUrl, source) {
  // 如果图源定义了 fetchHostMap，则通过 preload 使用 base64 加载
  if (source && source.fetchHostMap && imageUrl && imageUrl.startsWith('http')) {
    try {
      const base64Url = await api.fetchImageAsBase64(imageUrl, source);
      return base64Url;
    } catch (e) {
      console.error(`Failed to proxy image, falling back to original URL: ${imageUrl}`, e);
      return imageUrl;
    }
  }
  // 否则，直接返回原始 URL
  return imageUrl;
}