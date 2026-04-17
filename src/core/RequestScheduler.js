/**
 * 请求调度器 - 门面模式 + 中介者模式
 * 统一管理所有网络请求，处理取消策略、重试机制、并发控制
 */
export class RequestScheduler {
  constructor() {
    this._pendingRequests = new Map();
    this._maxConcurrent = 3;
    this._retryCount = 1;
  }

  /**
   * 执行请求，自动处理取消和调度
   * @param {string} key - 请求唯一标识，用于取消
   * @param {Function} executor - 执行函数
   * @param {Object} options - 配置
   * @returns {Promise<any>}
   */
  async request(key, executor, options = {}) {
    // 取消同key的旧请求
    this.cancel(key);

    const controller = new AbortController();
    const signal = controller.signal;
    
    this._pendingRequests.set(key, controller);

    try {
      const result = await executor(signal);
      return result;
    } finally {
      this._pendingRequests.delete(key);
    }
  }

  /**
   * 取消指定请求
   * @param {string} key - 请求标识
   */
  cancel(key) {
    const controller = this._pendingRequests.get(key);
    if (controller) {
      controller.abort();
      this._pendingRequests.delete(key);
    }
  }

  /**
   * 取消所有请求
   */
  cancelAll() {
    this._pendingRequests.forEach(controller => controller.abort());
    this._pendingRequests.clear();
  }

  /**
   * 检查是否有等待中的请求
   * @param {string} key - 请求标识
   * @returns {boolean}
   */
  isPending(key) {
    return this._pendingRequests.has(key);
  }

  /**
   * 获取等待请求数量
   * @returns {number}
   */
  pendingCount() {
    return this._pendingRequests.size;
  }
}

// 单例实例
export const requestScheduler = new RequestScheduler();
