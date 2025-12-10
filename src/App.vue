<script setup lang="ts">
import { useWsNotify } from '~/composables/useWsNotify'
// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: 'Izumi',
  meta: [
    {
      name: 'description',
      content: 'Opinionated Vite Starter Template',
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: () => 'favicon-32x32.png',
    },
  ],
})

onMounted(() => {
  useWsNotify().connect('')
})
</script>

<template>
  <RouterView />
</template>
