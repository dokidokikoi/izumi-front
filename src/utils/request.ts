import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

// 创建 axios 实例
const service: AxiosInstance = axios.create({
  baseURL: '/api', // 统一的请求前缀，可以改成后端地址
  timeout: 10000, // 超时时间
})

// 请求拦截器
service.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 这里可以加上 token
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 一般后端返回 { code, message, data }
    const res = response.data
    if (res.code !== 0) {
      // 可以用全局 toast 提示错误
      console.error(res.message || '请求错误')
      return Promise.reject(res)
    }
    return res.data
  },
  (error) => {
    console.error('网络错误:', error.message)
    return Promise.reject(error)
  },
)

export default service
