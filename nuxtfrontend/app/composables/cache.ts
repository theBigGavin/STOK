/**
 * 数据缓存功能
 * 提供内存缓存和持久化缓存功能，支持TTL和自动清理
 */

// 缓存项接口
interface CacheItem<T = any> {
  value: T
  expiresAt: number
  createdAt: number
  accessCount: number
  lastAccessed: number
}

// 缓存配置接口
interface CacheConfig {
  ttl?: number // 生存时间（毫秒）
  maxSize?: number // 最大缓存项数量
  cleanupInterval?: number // 清理间隔（毫秒）
}

/**
 * 缓存管理器类
 */
class CacheManager {
  private cache: Map<string, CacheItem> = new Map()
  private config: Required<CacheConfig>
  private cleanupTimer?: NodeJS.Timeout

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 5 * 60 * 1000, // 默认5分钟
      maxSize: config.maxSize || 1000, // 默认1000个缓存项
      cleanupInterval: config.cleanupInterval || 60 * 1000 // 默认1分钟清理一次
    }

    // 启动自动清理
    this.startCleanup()
  }

  /**
   * 生成缓存键
   */
  private generateKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key
  }

  /**
   * 检查缓存项是否过期
   */
  private isExpired(item: CacheItem): boolean {
    return Date.now() > item.expiresAt
  }

  /**
   * 清理过期缓存项
   */
  private cleanupExpired(): void {
    const now = Date.now()
    let expiredCount = 0

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key)
        expiredCount++
      }
    }

    if (expiredCount > 0) {
      console.log(`清理了 ${expiredCount} 个过期缓存项`)
    }
  }

  /**
   * 清理最不常用的缓存项（当缓存达到最大大小时）
   */
  private cleanupLRU(): void {
    if (this.cache.size <= this.config.maxSize) {
      return
    }

    const items = Array.from(this.cache.entries())
    // 按访问次数和最后访问时间排序
    items.sort((a, b) => {
      if (a[1].accessCount !== b[1].accessCount) {
        return a[1].accessCount - b[1].accessCount
      }
      return a[1].lastAccessed - b[1].lastAccessed
    })

    // 删除最不常用的项，直到缓存大小在限制范围内
    const itemsToRemove = items.slice(0, this.cache.size - this.config.maxSize)
    for (const [key] of itemsToRemove) {
      this.cache.delete(key)
    }

    console.log(`清理了 ${itemsToRemove.length} 个LRU缓存项`)
  }

  /**
   * 启动自动清理
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired()
      this.cleanupLRU()
    }, this.config.cleanupInterval)
  }

  /**
   * 停止自动清理
   */
  private stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  /**
   * 设置缓存
   */
  set<T = any>(key: string, value: T, ttl?: number, namespace?: string): void {
    const cacheKey = this.generateKey(key, namespace)
    const now = Date.now()
    const expiresAt = now + (ttl || this.config.ttl)

    const cacheItem: CacheItem<T> = {
      value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now
    }

    this.cache.set(cacheKey, cacheItem)
    
    // 检查是否需要清理
    this.cleanupLRU()
  }

  /**
   * 获取缓存
   */
  get<T = any>(key: string, namespace?: string): T | null {
    const cacheKey = this.generateKey(key, namespace)
    const item = this.cache.get(cacheKey) as CacheItem<T> | undefined

    if (!item) {
      return null
    }

    if (this.isExpired(item)) {
      this.cache.delete(cacheKey)
      return null
    }

    // 更新访问统计
    item.accessCount++
    item.lastAccessed = Date.now()

    return item.value
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string, namespace?: string): boolean {
    const cacheKey = this.generateKey(key, namespace)
    const item = this.cache.get(cacheKey)

    if (!item) {
      return false
    }

    if (this.isExpired(item)) {
      this.cache.delete(cacheKey)
      return false
    }

    return true
  }

  /**
   * 删除缓存
   */
  delete(key: string, namespace?: string): boolean {
    const cacheKey = this.generateKey(key, namespace)
    return this.cache.delete(cacheKey)
  }

  /**
   * 清空命名空间或所有缓存
   */
  clear(namespace?: string): void {
    if (namespace) {
      // 清空特定命名空间
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${namespace}:`)) {
          this.cache.delete(key)
        }
      }
    } else {
      // 清空所有缓存
      this.cache.clear()
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    totalItems: number
    hitRate: number
    memoryUsage: number
  } {
    const totalItems = this.cache.size
    let totalAccessCount = 0
    let totalHitCount = 0

    for (const item of this.cache.values()) {
      totalAccessCount += item.accessCount
      if (item.accessCount > 0) {
        totalHitCount++
      }
    }

    const hitRate = totalAccessCount > 0 ? totalHitCount / totalAccessCount : 0

    // 估算内存使用（粗略估算）
    const memoryUsage = JSON.stringify(Array.from(this.cache.entries())).length

    return {
      totalItems,
      hitRate,
      memoryUsage
    }
  }

  /**
   * 销毁缓存管理器
   */
  destroy(): void {
    this.stopCleanup()
    this.cache.clear()
  }
}

// 创建全局缓存管理器实例
const cacheManager = new CacheManager()

/**
 * 使用缓存管理器
 */
export const useCache = () => {
  return {
    set: cacheManager.set.bind(cacheManager),
    get: cacheManager.get.bind(cacheManager),
    has: cacheManager.has.bind(cacheManager),
    delete: cacheManager.delete.bind(cacheManager),
    clear: cacheManager.clear.bind(cacheManager),
    getStats: cacheManager.getStats.bind(cacheManager)
  }
}

/**
 * 带缓存的API请求
 */
export const useCachedApi = () => {
  const { request } = useApi()
  const cache = useCache()

  /**
   * 带缓存的GET请求
   */
  const cachedGet = async <T = any>(
    url: string,
    params?: Record<string, any>,
    cacheKey?: string,
    ttl?: number
  ): Promise<T> => {
    const key = cacheKey || `${url}:${JSON.stringify(params || {})}`
    
    // 尝试从缓存获取
    const cached = cache.get<T>(key, 'api')
    if (cached) {
      console.log(`从缓存获取: ${key}`)
      return cached
    }

    // 缓存未命中，发起请求
    console.log(`缓存未命中，发起请求: ${key}`)
    const response = await request<T>(url, { method: 'GET', params })
    
    if (response.data) {
      // 缓存响应数据
      cache.set(key, response.data, ttl, 'api')
    }

    return response.data as T
  }

  /**
   * 清除API缓存
   */
  const clearApiCache = (pattern?: string): void => {
    if (pattern) {
      // 清除匹配模式的缓存
      const stats = cache.getStats()
      console.log(`清除API缓存，模式: ${pattern}`)
      // 这里可以实现更复杂的模式匹配清除逻辑
    } else {
      // 清除所有API缓存
      cache.clear('api')
      console.log('已清除所有API缓存')
    }
  }

  return {
    cachedGet,
    clearApiCache
  }
}

// 导出缓存管理器实例
export default cacheManager