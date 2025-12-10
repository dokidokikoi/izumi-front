import { ElNotification } from 'element-plus'
// src/composables/useWebSocket.ts
import { onUnmounted, ref } from 'vue'

let heartbeatInterval: number | null = null

export function useWebSocket(path: string, autoReconnect = true) {
  let prefix = import.meta.env.VITE_API_BASE || window.location.origin.concat('/ws')
  prefix = prefix.replace('http://', 'ws://')
  const url = prefix.concat(path)
  const connection = ref<WebSocket | null>(null)

  function connect() {
    console.warn(`[WebSocket] Connecting to ${url} ...`)
    connection.value = new WebSocket(url)

    connection.value.onopen = (event) => {
      console.warn('[WebSocket] Connected:', event)
      startHeartbeat(connection.value)
    }

    connection.value.onclose = (event) => {
      console.warn('[WebSocket] Closed:', event)
      stopHeartbeat()
      if (autoReconnect) {
        console.warn('[WebSocket] Reconnecting in 3s...')
        setTimeout(connect, 3000)
      }
    }

    connection.value.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
      ElNotification({
        title: 'WebSocket',
        message: '连接发生错误',
        type: 'error',
        duration: 5000,
        position: 'bottom-right',
      })
    }
  }

  connect()

  onUnmounted(() => {
    console.warn('[WebSocket] Disconnected by component unmount')
    connection.value?.close()
  })

  return {
    connection,
    send: (msg: string) => connection.value?.send(msg),
  }

  function startHeartbeat(connection: WebSocket | null) {
    if (heartbeatInterval)
      return
    heartbeatInterval = window.setInterval(() => {
      connection?.send(JSON.stringify({ type: 'ping' }))
    }, 20000)
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }
}
