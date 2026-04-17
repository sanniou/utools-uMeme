/**
 * 图源仓库 - 仓储模式
 * 负责图源的注册、查找与生命周期管理
 */
export class SourceRepository {
  constructor() {
    this._sources = new Map();
  }

  /**
   * 注册图源
   * @param {Object} source - 图源实例
   */
  register(source) {
    if (!source || !source.name) {
      throw new Error('Source must have a name property');
    }
    this._sources.set(source.name, Object.freeze(source));
  }

  /**
   * 批量注册图源
   * @param {Array<Object>} sources - 图源数组
   */
  registerAll(sources) {
    sources.forEach(source => this.register(source));
  }

  /**
   * 根据名称查找图源
   * @param {string} name - 图源名称
   * @returns {Source|null}
   */
  get(name) {
    return this._sources.get(name) || null;
  }

  /**
   * 获取所有图源
   * @returns {Array<Source>}
   */
  getAll() {
    return Array.from(this._sources.values());
  }

  /**
   * 获取图源名称列表
   * @returns {Array<string>}
   */
  getNames() {
    return Array.from(this._sources.keys());
  }

  /**
   * 检查图源是否存在
   * @param {string} name - 图源名称
   * @returns {boolean}
   */
  has(name) {
    return this._sources.has(name);
  }

  /**
   * 获取图源数量
   * @returns {number}
   */
  size() {
    return this._sources.size;
  }

  /**
   * 清空所有图源
   */
  clear() {
    this._sources.clear();
  }
}

// 单例实例
export const sourceRepository = new SourceRepository();
