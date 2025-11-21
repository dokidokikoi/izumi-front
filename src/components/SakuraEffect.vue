<script setup lang="ts">
const props = withDefaults(defineProps<{
  count?: number // 花瓣数量
  speed?: number // 下落速度倍率
}>(), {
  count: 30, // Header 区域不大，30-50 片足够了
  speed: 1,
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationId: number
let width = 0
let height = 0

// 定义花瓣类
class Petal {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  rotation: number
  rotationSpeed: number
  color: string

  constructor() {
    this.x = Math.random() * width
    this.y = Math.random() * height - height // 初始位置在上方随机
    this.size = Math.random() * 10 + 8 // 花瓣大小
    this.speedX = Math.random() * 1 - 0.5 // 水平漂移速度
    this.speedY = Math.random() * 1 + 1 + (Math.random() * props.speed) // 下落速度
    this.rotation = Math.random() * 360
    this.rotationSpeed = Math.random() * 0.02 - 0.01
    // 随机粉色系
    const colors = ['#FFC0CB', '#FFB7C5', '#FF69B4', '#FFE4E1']
    this.color = colors[Math.floor(Math.random() * colors.length)]
  }

  update() {
    this.y += this.speedY
    this.x += Math.sin(this.y * 0.01) + this.speedX // 模拟随风飘动
    this.rotation += this.rotationSpeed

    // 如果掉出屏幕底部，重置到顶部
    if (this.y > height + this.size) {
      this.y = -this.size
      this.x = Math.random() * width
    }
    // 如果飘出左右边界，重置
    if (this.x > width + this.size)
      this.x = -this.size
    else if (this.x < -this.size)
      this.x = width + this.size
  }

  draw() {
    if (!ctx)
      return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)
    ctx.beginPath()
    // 绘制一个简单的花瓣形状
    ctx.moveTo(0, 0)
    // 贝塞尔曲线画花瓣
    ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, 0, 0, this.size)
    ctx.bezierCurveTo(-this.size, 0, -this.size / 2, -this.size / 2, 0, 0)
    ctx.fillStyle = this.color
    // 设置一点透明度
    ctx.globalAlpha = 0.7
    ctx.fill()
    ctx.restore()
  }
}

const petals: Petal[] = []

function init() {
  if (!canvasRef.value)
    return
  const canvas = canvasRef.value
  // 获取父容器宽高
  width = canvas.offsetWidth
  height = canvas.offsetHeight

  // 处理高清屏模糊问题
  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr
  ctx = canvas.getContext('2d')
  if (ctx)
    ctx.scale(dpr, dpr)

  // 初始化花瓣
  petals.length = 0
  for (let i = 0; i < props.count; i++) {
    petals.push(new Petal())
  }
}

function animate() {
  if (!ctx)
    return
  ctx.clearRect(0, 0, width, height)

  petals.forEach((petal) => {
    petal.update()
    petal.draw()
  })

  animationId = requestAnimationFrame(animate)
}

// 监听窗口大小变化
function handleResize() {
  init()
}

onMounted(() => {
  init()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <!-- pointer-events-none 确保花瓣不会挡住 Header 里的按钮点击 -->
  <canvas
    ref="canvasRef"
    class="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-80"
  />
</template>
