const fs = require('fs');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const path = require('path');

/**
 * 根据 URL 和配置生成一个本地文件路径
 * @param {string} url 图片链接
 * @param {object} config 配置项
 * @returns {string} 本地文件绝对路径
 */
function composeFilePath(url, config = {}) {
  const fileName = crypto.createHash('md5').update(url).digest('hex');
  // 遵循旧逻辑，统一使用 .gif 后缀以最大程度保留动图
  const fileSuffix = config.fileSuffix || '.gif';
  const downloadPath = config.downloadPath || utools.getPath('temp');
  // 使用 path.join 保证跨平台路径的正确性
  return path.join(downloadPath, `${fileName}${fileSuffix}`);
}

/**
 * 针对特定图源域名返回正确的 Referer
 * @param {string} host 域名
 * @returns {string} Referer 值
 */
const fetchHostMap = (host) => {
  if (host === 'img.soutula.com') return 'https://fabiaoqing.com/';
  if (host === 'img.adoutu.com') return 'https://www.adoutu.com/';
  return host;
};

/**
 * 从远程 URL 下载文件到本地
 * @param {string} url 远程文件链接
 * @param {string} filePath 本地保存路径
 * @param {object} config 请求配置
 * @returns {Promise<string>}
 */
function downloadRemoteFile(url, filePath, config) {
  return new Promise((resolve, reject) => {
    const { host, pathname, search } = new URL(url);
    const requestPath = `${pathname}${search}`;
    const requestModule = url.startsWith('https') ? https : http;

    const req = requestModule.get(
      { host, path: requestPath, method: 'get', headers: config.headers || {} },
      (res) => {
        // 处理重定向
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadRemoteFile(res.headers.location, filePath, config).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filePath);
        });
        fileStream.on('error', (err) => {
          fs.unlink(filePath, () => {}); // 出错时清理不完整的文件
          reject(err);
        });
      }
    );

    req.on('error', (err) => reject(err));
  });
}

/**
 * 下载图片，并进行缓存和有效性检查
 * @param {string} url 图片链接
 * @returns {Promise<string|null>} 返回本地文件的 URI，失败则返回 null
 */
async function downloadImage(url) {
  const { host } = new URL(url);
  const config = { headers: { Referer: fetchHostMap(host) } };

  const filePath = composeFilePath(url, config);
  // 为了兼容旧版缓存，检查是否存在 .jpg 结尾的旧文件
  const oldJpgPath = composeFilePath(url, { ...config, fileSuffix: '.jpg' });

  // 如果新路径文件不存在，但旧版缓存存在，则复用旧缓存
  if (!fs.existsSync(filePath) && fs.existsSync(oldJpgPath)) {
    fs.copyFileSync(oldJpgPath, filePath);
    return `file://${filePath}`;
  }

  // 如果文件不存在，则下载
  if (!fs.existsSync(filePath)) {
    await downloadRemoteFile(url, filePath, config);
  }

  // 下载后校验文件，防止复制的是错误页面
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    // 小于 1KB 的文件很可能是无效图片或错误提示，直接删除
    if (stats.size < 1024) {
      fs.unlinkSync(filePath);
      return null;
    }
  } else {
    return null; // 下载失败
  }

  return `file://${filePath}`;
}

/**
 * 尝试用最优策略复制文件
 * @param {string} destFile 本地文件路径
 * @returns {boolean} 是否成功
 */
function tryCopy(destFile) {
  // 对于 GIF，必须用 copyFile 才能保留动画
  if (destFile.toLowerCase().endsWith('.gif')) {
    return utools.copyFile(destFile);
  }

  // 对于其他图片，优先用 copyImage，因为它在聊天软件中兼容性更好
  // 如果失败，再用 copyFile 作为备用方案
  let copyResult = utools.copyImage(destFile);
  if (!copyResult) {
    copyResult = utools.copyFile(destFile);
  }
  return copyResult;
}

/**
 * 这是暴露给渲染器进程的唯一 API 对象。
 * 它封装了所有 Node.js 相关的功能。
 */
window.api = {
  /**
   * 异步复制图片。
   * @param {string} imageUrl
   * @returns {Promise<{success: boolean, message: string}>}
   */
  copyImage: async (imageUrl) => {
    if (!imageUrl) {
      return { success: false, message: '必须提供图片 URL。' };
    }
    try {
      const localFileUri = await downloadImage(imageUrl);
      if (!localFileUri) {
        return { success: false, message: '图片下载失败' };
      }
      const localFilePath = localFileUri.replace('file://', '');
      const result = tryCopy(localFilePath);
      if (result) {
        utools.hideMainWindow();
        return { success: true, message: '已复制到剪贴板' };
      } else {
        return { success: false, message: '复制失败，请重试' };
      }
    } catch (error) {
      console.error('复制过程中发生错误:', error);
      return { success: false, message: `复制失败: ${error.message}` };
    }
  }
};
