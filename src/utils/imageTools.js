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
 */
export async function copyImageToClipboard(imageUrl) {
  if (!imageUrl) {
    console.error('copyImageToClipboard: 必须提供图片 URL。');
    ElMessage.warning('图片链接无效');
    return;
  }

  const loadingMessage = ElMessage({
    message: '正在复制图片中...',
    type: 'info',
    duration: 0, // 持续显示，直到手动关闭
  });

  try {
    // 将所有复杂的逻辑（下载、复制）委托给 preload 脚本的 API。
    const result = await api.copyImage(imageUrl);

    // 向用户展示操作结果。
    if (result.success) {
      ElMessage.success(result.message || '复制成功');
    } else {
      ElMessage.error(result.message || '复制失败');
      // 在真实的 uTools 环境中，我们也可以为关键错误显示系统通知。
      if (window.utools) {
        window.utools.showNotification(result.message);
      }
    }
  } catch (error) {
    const errorMessage = `发生未知错误: ${error.message}`;
    console.error('copyImageToClipboard 失败:', error);
    ElMessage.error(errorMessage);
    if (window.utools) {
      window.utools.showNotification(errorMessage);
    }
  } finally {
    // 无论成功或失败，都关闭加载提示
    loadingMessage.close();
  }
}
