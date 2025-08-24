<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  hoverable?: boolean
}>()
</script>

<template>
  <div
    class="border border-gray-200 rounded-2xl bg-white shadow-sm transition-all duration-300 dark:border-gray-700 dark:bg-gray-800"
    :class="hoverable ? 'hover:shadow-md hover:-translate-y-1' : ''"
  >
    <!-- Header -->
    <div v-if="title || subtitle" class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <h3 v-if="title" class="text-lg text-gray-900 font-semibold dark:text-gray-100">
        {{ title }}
      </h3>
      <p v-if="subtitle" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {{ subtitle }}
      </p>
    </div>

    <!-- Content -->
    <div class="px-4 py-3">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="border-t border-gray-200 px-4 py-3 text-right dark:border-gray-700">
      <slot name="footer" />
    </div>
  </div>
</template>
