/**
 * 图源抽象基类 - 适配器模式
 * 所有图源必须实现此接口，保证一致性
 */
export class Source {
  /**
   * 创建图源实例
   * @param {Object} config - 图源配置
   * @param {string} config.name - 图源唯一标识名称
   * @param {boolean} config.supportsPagination - 是否支持分页
   * @param {boolean} config.supportsEmptyQuery - 是否支持空搜索
   * @param {Object} config.fetchHostMap - 防盗链域名映射
   */
  constructor(config) {
    this.name = config.name;
    this.supportsPagination = config.supportsPagination ?? true;
    this.supportsEmptyQuery = config.supportsEmptyQuery ?? false;
    this.fetchHostMap = config.fetchHostMap ?? null;
    
    // 冻结实例，防止意外修改
    Object.freeze(this);
  }

  /**
   * 搜索方法 - 子类必须实现
   * @abstract
   * @param {string} query - 搜索关键词
   * @param {number} page - 页码
   * @param {AbortSignal} signal - 取消信号
   * @returns {Promise<Array<ImageItem>>}
   */
  async search(query, page = 1, signal) {
    throw new Error(`Source ${this.name} must implement search() method`);
  }

  /**
   * 转换为纯对象，用于序列化
   * @returns {Object}
   */
  toJSON() {
    return {
      name: this.name,
      supportsPagination: this.supportsPagination,
      supportsEmptyQuery: this.supportsEmptyQuery,
    };
  }
}

/**
 * 图片项类型定义
 * @typedef {Object} ImageItem
 * @property {string} id - 唯一标识
 * @property {string} url - 原图URL
 * @property {string} thumb - 缩略图URL
 * @property {string} alt - 图片描述
 * @property {number} [width] - 宽度
 * @property {number} [height] - 高度
 */
