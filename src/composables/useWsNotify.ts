import { useEventBus } from '@vueuse/core'
import { ElNotification } from 'element-plus'
import { ref } from 'vue'

let heartbeatInterval: number | null = null
let ws: WebSocket | null = null
const wsState = ref<WebSocket['readyState']>(3)

// 全局 EventBus（key 为事件名）
const bus = useEventBus<{ event: string, data: any }>('ws-notify')

export function useWsNotify() {
  function connect(topic: string, autoReconnect = true) {
    if (ws)
      return

    // 获取前缀（支持 VITE_API_BASE，不然用当前域名 + /ws）
    let prefix = import.meta.env.VITE_API_BASE || `${window.location.origin}/ws`
    prefix = prefix.replace(/^http/, 'ws')

    const url = `${prefix}/notify?topic=${topic}&uid=izumi`
    console.warn(`[WebSocket] Connecting to ${url} ...`)

    wsState.value = WebSocket.CONNECTING
    ws = new WebSocket(url)

    ws.onopen = () => {
      console.warn('[WebSocket] Connected')
      wsState.value = WebSocket.OPEN
      startHeartbeat()
    }

    ws.onclose = () => {
      console.warn('[WebSocket] Closed')
      wsState.value = WebSocket.CLOSED
      stopHeartbeat()
      ws = null
      if (autoReconnect) {
        console.warn('[WebSocket] Reconnecting in 3s...')
        setTimeout(() => connect(topic, autoReconnect), 3000)
      }
    }

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
      wsState.value = WebSocket.CLOSED
      ElNotification({
        title: 'WebSocket',
        message: '连接发生错误',
        type: 'error',
        duration: 5000,
        position: 'bottom-right',
      })
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        // 统一格式：{ event: 'xxx', data: {...} }
        if (msg.event) {
          bus.emit({ event: msg.event, data: msg })
        }
      }
      catch (e) {
        console.error('WS Message Parse Error:', e)
      }
    }
  }

  function startHeartbeat() {
    if (heartbeatInterval)
      return
    heartbeatInterval = window.setInterval(() => {
      ws?.send(JSON.stringify({ type: 'ping' }))
    }, 20000)
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }

  // 按事件类型订阅
  function onEvent(eventName: string, callback: (payload: any) => void) {
    return bus.on(({ event, data }) => {
      if (event === eventName)
        callback(data)
    })
  }

  return {
    connect,
    onEvent,
    on: bus.on,
    off: bus.off,
    wsState,
  }
}
