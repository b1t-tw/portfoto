<script setup>
import '@/assets/css/custom.css'
import info from '@/public/info.json'
import { Icon } from "@iconify/vue"

const { data: navContents } = await useAsyncData('navContents', () => {
  return queryCollectionNavigation('content')
})

const isMenuOpen = ref(false)
const openMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
const route = useRoute()

watch(() => route.path, () => {
  isMenuOpen.value = false
  document.body.style.overflow = 'auto'
  window.scrollTo(0, 0)
})
</script>

<template>

  <Head>
    <Title>{{ info.title }}</Title>
    <Meta name="description" :content="info.description" />
  </Head>
  <div class="container mx-auto max-w-full-lg">
    <div class="sticky md:hidden top-0 left-0 w-full z-50 flex p-4 bg-white">
      <a href="/">
        <img :src="info.avatar" class="rounded w-40" />
      </a>
      <div @click="openMenu()" class="ms-auto text-[2rem] bg-white">
        <Icon icon="mdi:menu" width="36" height="36" />
      </div>
      <div v-if="isMenuOpen" class="fixed top-0 left-0 w-full bg-white p-4 shadow-md fade-in-on-open">
        <div @click="isMenuOpen = false" class="ms-auto bg-white text-right text-gray-600">
          <Icon icon="mdi:window-close" width="36" height="36" />
        </div>
        <div class="flex flex-col items-center text-center">
          <h1 class="mb-2">{{ info.name }}</h1>
          <div class="mb-2">{{ info.slogan }}</div>
          <div class="mb-2"><a :href="`mailto:${info.email}`">{{ info.email }}</a></div>
          <div class="mb-3"><a :href="`tel:${info.phone}`">{{ info.phone }}</a></div>
          <div class="flex flex-wrap gap-2 text-2xl">
            <a v-if="info.instagram" :href="info.instagram" target="_blank" class="text-gray-600 font-semibold">
              <Icon icon="mdi:instagram" />
            </a>
            <a v-if="info.facebook" :href="info.facebook" target="_blank" class="text-gray-600 font-semibold">
              <Icon icon="mdi:facebook" />
            </a>
            <a v-if="info.twitter" :href="info.twitter" target="_blank" class="text-gray-600 font-semibold">
              <Icon icon="mdi:twitter-x" />
            </a>
            <a v-if="info.linkedin" :href="info.linkedin" target="_blank" class="text-gray-600 font-semibold">
              <Icon icon="mdi:linkedin" />
            </a>
            <a v-if="info.github" :href="info.github" target="_blank" class="text-gray-600 font-semibold">
              <Icon icon="mdi:github" />
            </a>
          </div>
        </div>
        <hr>
        <div class="flex flex-col gap-1 text-lg">
          <NavChild v-for="nav in navContents" :key="nav.path" :nav="nav" />
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-[30%_1fr] gap-12 py-8 px-5">
      <div class="sticky max-md:hidden top-10">
        <div class="flex flex-col gap-4">
          <a href="/">
            <img :src="info.avatar" class="rounded w-48" />
          </a>
          <div>
            <h1 class="mb-1">{{ info.name }}</h1>
            <div class="mb-1 text-sm">{{ info.slogan }}</div>
            <div class="mb-1"><a :href="`mailto:${info.email}`">{{ info.email }}</a></div>
            <div class="mb-3"><a :href="`tel:${info.phone}`">{{ info.phone }}</a></div>
            <div class="flex flex-wrap gap-2 text-2xl">
              <a v-if="info.instagram" :href="info.instagram" target="_blank" class="text-gray-600 font-semibold">
                <Icon icon="mdi:instagram" />
              </a>
              <a v-if="info.facebook" :href="info.facebook" target="_blank" class="text-gray-600 font-semibold">
                <Icon icon="mdi:facebook" />
              </a>
              <a v-if="info.twitter" :href="info.twitter" target="_blank" class="text-gray-600 font-semibold">
                <Icon icon="mdi:twitter-x" />
              </a>
              <a v-if="info.linkedin" :href="info.linkedin" target="_blank" class="text-gray-600 font-semibold">
                <Icon icon="mdi:linkedin" />
              </a>
              <a v-if="info.github" :href="info.github" target="_blank" class="text-gray-600 font-semibold">
                <Icon icon="mdi:github" />
              </a>
            </div>
          </div>
        </div>
        <hr>
        <div class="flex flex-col gap-1">
          <NavChild v-for="nav in navContents" :key="nav.path" :nav="nav" />
        </div>
      </div>
      <div class="min-w-0 min-h-[70vh] max-md:flex">
        <NuxtPage :info="info" />
      </div>
    </div>
  </div>
</template>
