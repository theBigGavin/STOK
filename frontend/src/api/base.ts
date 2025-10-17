import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// API 配置
const API_CONFIG = {
  baseURL: 'http://localhost:8099',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
}

// 创建 axios 实例
const api: AxiosInstance = axios.create(API_CONFIG)

// 请求拦截器
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加时间戳防止缓存
    if (config.method?.toLowerCase() === 'get' && config.params) {
      config.params._t = Date.now()
    }
    
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // 对响应数据做点什么
    const { data } = response
    
    // 检查响应格式是否符合标准
    if (data && typeof data === 'object') {
      if (data.status === 'error') {
        console.error('API Error:', data.message || '请求失败')
        return Promise.reject(new Error(data.message || '请求失败'))
      }
      
      // 返回标准格式的数据
      return data.data !== undefined ? data.data : data
    }
    
    return data
  },
  (error) => {
    // 对响应错误做点什么
    let message = '网络错误，请稍后重试'
    
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          message = data?.message || '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 清除 token 并跳转到登录页
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 422:
          message = data?.message || '数据验证失败'
          break
        case 429:
          message = '请求过于频繁，请稍后重试'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = data?.message || `网络错误 (${status})`
      }
    } else if (error.request) {
      // 请求发送失败
      message = '网络连接失败，请检查网络设置'
    } else {
      // 其他错误
      message = error.message || '未知错误'
    }
    
    console.error('API Request Failed:', message, error)
    return Promise.reject(new Error(message))
  }
)

// API 响应类型定义
export interface ApiResponse<T = any> {
  data: T
  message: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  skip: number
  limit: number
  has_more?: boolean
}

// 导出常用的 HTTP 方法
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    api.get(url, config),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.post(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.put(url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    api.delete(url, config),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    api.patch(url, data, config),
}

// 导出 axios 实例
export default api