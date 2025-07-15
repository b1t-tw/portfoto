<template>
  <img 
    :src="`/resized/${props.size}${props.src}.webp`"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  src: string
  size: 'small' | 'large'
}>()

defineOptions({
  inheritAttrs: false
})
</script>