<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  hoverable?: boolean
}>()
</script>

<template>
  <div
    class="border border-base rounded-2xl bg-card shadow-sm transition-all duration-300"
    :class="hoverable ? 'hover:shadow-md hover:-translate-y-1' : ''"
  >
    <!-- Header -->
    <div v-if="title || subtitle" class="border-b border-base px-4 py-3">
      <h3 v-if="title" class="text-lg font-semibold">
        {{ title }}
      </h3>
      <p v-if="subtitle" class="mt-1 text-sm text-muted">
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
