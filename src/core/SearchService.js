import { requestScheduler } from './RequestScheduler.js';
import { sourceRepository } from './SourceRepository.js';
import { getProxiedImageUrl } from '../utils/imageTools.js';

/**
 * 搜索服务 - 业务门面
 * 封装所有搜索相关的业务逻辑，与UI完全解耦
 */
export class SearchService {
  constructor() {
    this._state = {
      sourceName: '',
      query: '',
      page: 1,
      images: [],
      loading: false,
      error: null,
      noMore: false,
    };
    
    this._listeners = new Set();
  }

  /**
   * 获取当前状态
   * @returns {Object} 只读状态副本
   */
  getState() {
    return { ...this._state };
  }

  /**
   * 订阅状态变化
   * @param {Function} listener - 状态变化回调
   * @returns {Function} 取消订阅函数
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * 发布状态变化
   */
  _notify() {
    const state = this.getState();
    this._listeners.forEach(listener => listener(state));
  }

  /**
   * 更新状态并通知
   * @param {Object} updates - 状态更新
   */
  _setState(updates) {
    this._state = { ...this._state, ...updates };
    this._notify();
  }

  /**
   * 切换图源
   * @param {string} sourceName - 图源名称
   */
  setSource(sourceName) {
    if (this._state.sourceName === sourceName) return;
    
    this._setState({
      sourceName,
      images: [],
      page: 1,
      noMore: false,
      error: null,
    });

    // 自动执行搜索
    if (this._state.query || sourceRepository.get(sourceName)?.supportsEmptyQuery) {
      this.search(this._state.query, true);
    }
  }

  /**
   * 执行搜索
   * @param {string} query - 搜索关键词
   * @param {boolean} isNewSearch - 是否是新搜索(重置分页)
   */
  async search(query, isNewSearch = false) {
    const source = sourceRepository.get(this._state.sourceName);
    
    if (!source) {
      this._setState({ error: new Error('Source not found'), loading: false });
      return;
    }

    if (!source.supportsEmptyQuery && !query) {
      this._setState({ images: [], noMore: true, loading: false });
      return;
    }

    const page = isNewSearch ? 1 : this._state.page;
    
    this._setState({
      query,
      loading: true,
      error: null,
      ...(isNewSearch ? { images: [], page: 1, noMore: false } : {}),
    });

    try {
      const images = await requestScheduler.request(
        `search:${source.name}`,
        async (signal) => {
          const rawImages = await source.search(query, page, signal);
          
          // 批量处理图片代理
          return Promise.all(
            rawImages.map(async img => ({
              ...img,
              thumb: await getProxiedImageUrl(img.thumb, source),
            }))
          );
        }
      );

      if (images.length === 0) {
        this._setState({ noMore: true, loading: false });
      } else {
        const newImages = isNewSearch 
          ? images 
          : [...this._state.images, ...images];

        this._setState({
          images: newImages,
          page: source.supportsPagination ? page + 1 : page,
          noMore: !source.supportsPagination,
          loading: false,
        });
      }
    } catch (error) {
      // 忽略取消错误
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return;
      }
      
      this._setState({
        error,
        loading: false,
        noMore: true,
      });

      throw error;
    }
  }

  /**
   * 加载更多
   */
  async loadMore() {
    const source = sourceRepository.get(this._state.sourceName);
    
    if (this._state.loading || this._state.noMore || !source?.supportsPagination) {
      return;
    }

    await this.search(this._state.query, false);
  }

  /**
   * 取消当前搜索
   */
  cancel() {
    requestScheduler.cancel(`search:${this._state.sourceName}`);
    this._setState({ loading: false });
  }

  /**
   * 重置状态
   */
  reset() {
    requestScheduler.cancelAll();
    this._state = {
      sourceName: '',
      query: '',
      page: 1,
      images: [],
      loading: false,
      error: null,
      noMore: false,
    };
    this._notify();
  }
}

// 单例实例
export const searchService = new SearchService();
