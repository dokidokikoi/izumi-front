export function imageUrl(url: string | undefined) {
  if (!url) {
    return
  }
  if (url.length > 4 && url.substring(0, 4) !== 'http') {
    const arr = url.split('/')
    return `${import.meta.env.VITE_API_BASE || window.location.origin.concat('/api')}/file/${arr[arr.length - 1]}`
  }
  return url
}
