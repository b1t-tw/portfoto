<script setup>
import { register } from 'swiper/element/bundle'
import images from '@/public/images.json'

defineProps(['info', 'navContents'])
const route = useRoute()
const popup = ref(false)
const initialSlide = ref(0)
const thumbsSwiper = ref(null)
const setThumbsSwiper = (swiper) => {
  thumbsSwiper.value = swiper
}
const parseImageList = async (gallery) => {
  const promises = gallery.map((item) => {
    if (item.endsWith('/')) {
      return images.filter(img => img.startsWith(item))
    }
    return item
  })

  return (await Promise.all(promises)).flat() || []
}

watch(popup, (isPopup) => {
  if (isPopup) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
    setThumbsSwiper(null)
  }
})

// Make useAsyncData reactive to route changes
const { data: page } = await useAsyncData(
  () => `page-${route.path}`, 
  () => queryCollection('content').path(route.path).first(),
  { watch: [route] }
)

const { data: galleryImages } = await useAsyncData(
  () => `galleryImages-${route.path}`,
  () => page.value?.gallery ? parseImageList(page.value.gallery) : [],
  { watch: [route, page] }
)

const { data: bannerImages } = await useAsyncData(
  () => `bannerImages-${route.path}`,
  () => page.value?.banner ? parseImageList(page.value.banner) : [],
  { watch: [route, page] }
)

const { data: currentNav } = await useAsyncData(
  () => `currentNav-${route.path}`,
  () => {
    return queryCollection('content').where('path', 'LIKE', `${route.path}%`).select('title', 'banner', 'path', 'gallery').all()
  },
  { watch: [route] }
)

onMounted(() => {
  register()
})
</script>

<template>

  <Head>
    <Title v-if="page?.title">{{ page.title }} - {{ info.title }}</Title>
    <Title v-else>{{ info.title }}</Title>
  </Head>
  <div :class="popup ? 'show' : ''" class="popup-container">
    <div @click="popup = false" class="absolute top-2 right-2 cursor-pointer z-10">
      <i class="text-gray-800 text-[2.5rem] bi bi-x"></i>
    </div>
    <div class="min-w-0 min-h-0 h-full w-full flex flex-col bg-white p-2">
      <template v-if="popup">
        <swiper-container thumbs-swiper=".gallery-thumbs" navigation="true" slides-per-view="1"
          space-between="30" loop="true" :initial-slide="initialSlide" effect="fade"
          class="gallery-swiper w-full h-[80%] my-auto">
          <swiper-slide v-for="image in galleryImages" :key="image" class="bg-white">
            <div class="flex justify-center items-center h-full w-full">
              <ResizedImg :src="image" size="large" class="h-full w-full object-contain m-auto" loading="lazy" />
            </div>
          </swiper-slide>
        </swiper-container>
      </template>
      <template v-if="popup">
        <swiper-container slides-per-view="auto" space-between="10" watch-slides-progress="true"
          class="gallery-thumbs w-full h-[10%]">
          <swiper-slide v-for="image in galleryImages" :key="image" class="bg-white" style="width: auto;">
            <div class="flex justify-center items-center h-full aspect-square cursor-pointer">
              <ResizedImg :src="image" size="small" class="h-full w-full object-cover m-auto" loading="lazy" />
            </div>
          </swiper-slide>
        </swiper-container>
      </template>
    </div>
  </div>
  <div v-if="page" class="min-w-0 min-h-0 fade-in-on-open my-auto">
    <h3 v-if="page.showTitle && page.title" class="mb-6 text-right text-gray-600">{{ page.title }}</h3>
    <div v-if="bannerImages?.length" class="min-w-0 min-h-0 mb-8">
      <template v-if="bannerImages?.length">
        <swiper-container loop="true" effect="fade" autoplay-delay="2500"
          autoplay-disable-on-interaction="false">
          <swiper-slide v-for="image in bannerImages" :key="page.path + image" class="bg-white">
            <div class="aspect-[3/2] rounded overflow-hidden">
              <ResizedImg :src="image" size="large" class="w-full h-full object-cover m-auto" loading="lazy" />
            </div>
          </swiper-slide>
        </swiper-container>
      </template>
    </div>
    <div v-if="galleryImages?.length" class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <div v-for="(image, index) in galleryImages" :key="image" class="aspect-square hover-opacity">
        <ResizedImg @click="() => { initialSlide = index; popup = true }" :src="image" size="small"
          class="rounded w-full h-full object-cover cursor-pointer" loading="lazy" />
      </div>
    </div>
    <ContentRenderer :value="page" />
  </div>
  <div v-else-if="currentNav?.length" class="fade-in-on-open">
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <template v-for="nav in currentNav">
        <NuxtLink :to="nav.path">
          <div class="aspect-square relative hover-opacity">
            <ResizedImg v-if="nav.banner" :src="nav.banner[0]" size="small"
              class="w-full h-full object-cover rounded mb-6" loading="lazy" />
            <ResizedImg v-else-if="nav.gallery" :src="nav.gallery[0]" size="small"
              class="w-full h-full object-cover rounded mb-6" loading="lazy" />
            <div v-else class="w-full h-full bg-gray-200 rounded mb-6"></div>
            <div
              class="opacity-0 hover-opacity bg-white flex justify-center items-center absolute top-0 left-0 w-full h-full">
              <span class="text-center p-4 font-semibold">{{ nav.title }}</span>
            </div>
          </div>
        </NuxtLink>
      </template>
    </div>
  </div>
  <div v-else>
    <h1>Oh no! 找不到此頁面 :(</h1>
  </div>
</template>
