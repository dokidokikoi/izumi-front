<script setup lang="ts">
defineOptions({
  name: 'IndexPage',
})

const { t } = useI18n()
useHead({
  title: () => t('button.home'),
})
</script>

<template>
  <div />
  <div class="grid grid-cols-1 gap-6 p-6 lg:grid-cols-4 sm:grid-cols-2">
    <Card title="库游戏数" hoverable>
      <p class="text-3xl font-bold">
        500
      </p>
      <p class="text-sm text-gray-500">
        刮削游戏数
      </p>
    </Card>

    <Card title="本地游戏数" hoverable>
      <p class="text-3xl font-bold">
        128
      </p>
      <p class="text-sm text-gray-500">
        保存的游戏数
      </p>
    </Card>

    <Card title="标签数" hoverable>
      <p class="text-3xl font-bold">
        98
      </p>
      <p class="text-sm text-gray-500">
        标签总数
      </p>
    </Card>

    <Card title="使用的标签数" hoverable>
      <p class="text-3xl font-bold">
        88
      </p>
      <p class="text-sm text-gray-500">
        关联游戏的标签数
      </p>
    </Card>
  </div>

  <hr un-border="b-2 gray-100 dark:gray-700">

  <div class="grid grid-cols-1 gap-6 p-6 lg:grid-cols-4 sm:grid-cols-2">
    <Card title="游戏系列" hoverable>
      <ul>
        <li>1</li>
        <li>1</li>
        <li>1</li>
        <li>1</li>
      </ul>
    </Card>

    <Card title="游玩列表" hoverable>
      <ul>
        <li>1</li>
        <li>1</li>
        <li>1</li>
        <li>1</li>
      </ul>
    </Card>
  </div>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
