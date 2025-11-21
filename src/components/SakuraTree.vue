<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

// 定义 Props
const props = withDefaults(defineProps<{
  /** 花瓣数量 */
  count?: number
  /** 树的位置: 'left' | 'right' */
  treePosition?: 'left' | 'right'
}>(), {
  count: 40,
  treePosition: 'left',
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationId: number
let width = 0
let height = 0

// 花瓣类
class Petal {
  x: number
  y: number
  size: number
  vx: number // 水平速度 (风速)
  vy: number // 垂直速度 (重力)
  rotation: number
  rotationSpeed: number
  color: string
  swayOffset: number // 摇摆偏移量

  constructor() {
    // 初始化属性，具体数值在 reset() 中设定
    this.x = 0
    this.y = 0
    this.size = 0
    this.vx = 0
    this.vy = 0
    this.rotation = 0
    this.rotationSpeed = 0
    this.color = ''
    this.swayOffset = Math.random() * 100
    this.reset(true) // true 代表初始化，随机分布在路径上
  }

  // 重置花瓣位置（核心逻辑：让花瓣回到树枝附近）
  reset(initial = false) {
    // 1. 确定生成区域 (树枝所在的角落)
    // 我们假设树枝占据宽度的 1/3，高度的 1/2
    const spawnWidth = width * 0.35
    const spawnHeight = height * 0.5

    if (props.treePosition === 'left') {
      this.x = Math.random() * spawnWidth - (initial ? 0 : 50) // 从左上角生成
    }
    else {
      this.x = width - (Math.random() * spawnWidth) + (initial ? 0 : 50) // 从右上角生成
    }

    // Y轴位置：初始时随机分布在屏幕上，重置时回到顶部
    if (initial) {
      this.y = Math.random() * height
      // 如果初始就在下面，X轴可以放宽一点
      if (props.treePosition === 'left')
        this.x += Math.random() * (this.y * 0.5)
      else this.x -= Math.random() * (this.y * 0.5)
    }
    else {
      this.y = Math.random() * spawnHeight - spawnHeight - 20 // 隐藏在屏幕上方一点
    }

    // 2. 物理属性
    this.size = Math.random() * 8 + 6

    // 3. 风向逻辑
    // 左边的树 -> 风向右吹 (正数)
    // 右边的树 -> 风向左吹 (负数)
    const windDir = props.treePosition === 'left' ? 1 : -1

    // 水平速度 = 基础风速 + 随机扰动
    this.vx = (Math.random() * 0.5 + 0.5) * windDir

    // 垂直速度 = 重力
    this.vy = Math.random() * 1 + 0.8

    this.rotation = Math.random() * 360
    this.rotationSpeed = (Math.random() - 0.5) * 0.05

    // 随机颜色
    const colors = ['#FFC0CB', '#FFB7C5', '#FF69B4', '#FFE4E1']
    this.color = colors[Math.floor(Math.random() * colors.length)]
  }

  update() {
    // 应用速度
    this.y += this.vy
    this.x += this.vx

    // 添加正弦波摇摆效果 (模拟飘落时的空气阻力)
    this.x += Math.sin(this.y * 0.02 + this.swayOffset) * 0.3

    this.rotation += this.rotationSpeed

    // 边界检查：掉出底部 或 飘出对面边界
    const isOutBottom = this.y > height + this.size
    const isOutSide = props.treePosition === 'left'
      ? this.x > width + this.size
      : this.x < -this.size

    if (isOutBottom || isOutSide) {
      this.reset()
    }
  }

  draw() {
    if (!ctx)
      return
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rotation)

    // 绘制花瓣
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, 0, 0, this.size)
    ctx.bezierCurveTo(-this.size, 0, -this.size / 2, -this.size / 2, 0, 0)

    ctx.fillStyle = this.color
    ctx.globalAlpha = 0.8
    ctx.fill()
    ctx.restore()
  }
}

const petals: Petal[] = []

function init() {
  if (!canvasRef.value)
    return
  const canvas = canvasRef.value
  width = canvas.offsetWidth
  height = canvas.offsetHeight

  const dpr = window.devicePixelRatio || 1
  canvas.width = width * dpr
  canvas.height = height * dpr

  ctx = canvas.getContext('2d')
  if (ctx)
    ctx.scale(dpr, dpr)

  // 重置花瓣数组
  petals.length = 0
  for (let i = 0; i < props.count; i++) {
    petals.push(new Petal())
  }
}

function animate() {
  if (!ctx)
    return
  ctx.clearRect(0, 0, width, height)
  petals.forEach((p) => {
    p.update()
    p.draw()
  })
  animationId = requestAnimationFrame(animate)
}

const handleResize = () => init()

onMounted(() => {
  init()
  animate()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
})

// 监听 props 变化，动态重置
watch(() => props.treePosition, init)
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <!-- 1. 树枝 SVG 剪影 (装饰背景) -->
    <!-- 使用 scale-x-[-1] 来水平翻转右边的树 -->
    <svg
      class="absolute top-0 h-[300px] w-[300px] text-gray-400/20 transition-all duration-500 dark:text-gray-600/20"
      :class="treePosition === 'left' ? '-left-10' : '-right-10 scale-x-[-1]'"
      viewBox="0 0 200 200"
      fill="currentColor"
    >
      <!-- 这是一个艺术化的抽象树枝形状 -->
      <path d="M0,0 C50,10 80,40 100,80 C110,100 105,120 90,140 C85,145 95,150 110,130 C130,100 140,60 120,20 C110,0 180,20 200,40 L0,0 Z" />
      <path d="M60,40 C90,60 110,90 100,120 L90,110 C100,80 80,50 50,30 Z" opacity="0.6" />
    </svg>

    <!-- 2. 粒子画布 -->
    <canvas ref="canvasRef" class="absolute inset-0 h-full w-full" />
  </div>
</template>
