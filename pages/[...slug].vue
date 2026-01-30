<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue';
import { EffectFade, Autoplay, Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css/bundle';

import { Icon } from "@iconify/vue"
import images from '@/public/images.json'

defineProps(['info'])
const route = useRoute()
const popup = ref(false)
const initialSlide = ref(0)
const thumbsSwiper = ref(null)

const { data: contentBrief } = await useAsyncData('contentBrief', () => {
  return queryCollection('content').select('title', 'path', 'banner', 'gallery').all()
})

const setThumbsSwiper = (swiper) => {
  thumbsSwiper.value = swiper
}

// Optimized image processing with memoization
const imageCache = new Map()
const imageLookup = new Map()

// Pre-build lookup map for faster filtering
if (images && Array.isArray(images)) {
  images.forEach(img => {
    const prefix = img.split('/').slice(0, -1).join('/') + '/'
    if (!imageLookup.has(prefix)) {
      imageLookup.set(prefix, [])
    }
    imageLookup.get(prefix).push(img)
  })
}

const onGalleryClick = (index) => {
  initialSlide.value = index
  popup.value = true
  history.pushState({}, '', '?')
  history.pushState({}, '', `?show=${index}`)
}

const onPopClose = () => {
  popup.value = false
  history.replaceState({}, '', '?')
}

const onSlideChange = (swiper) => {
  console.log('slide changed', swiper.realIndex)
  if (popup.value) {
    history.replaceState({}, '', `?show=${swiper.realIndex}`)
  }
}

const parseImageList = (gallery) => {
  if (!gallery || !Array.isArray(gallery)) return []

  const cacheKey = JSON.stringify(gallery)
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)
  }

  const result = gallery.flatMap((item) => {
    if (item.endsWith('/')) {
      return imageLookup.get(item) || []
    }
    return item
  })

  imageCache.set(cacheKey, result)
  return result
}

function handleQueryShow() {
  let index = Number(route.query.show)
  if (!isNaN(index) && galleryImages.value.length) {
    popup.value = true
    initialSlide.value = index
  } else {
    popup.value = false
  }
}

watch(popup, (isPopup) => {
  if (isPopup) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = 'auto'
    setThumbsSwiper(null)
  }
})

watch(route, () => {
  handleQueryShow()
})

onMounted(() => {
  nextTick(() => {
    handleQueryShow()
  })
})

// Combined data fetching for better performance
const { data: pageData, pending } = await useAsyncData(
  () => `pageData-${route.path}`,
  async () => {
    const page = await queryCollection('content').path(route.path).first()
    if (!page) return null

    // Process images in parallel
    const [galleryImages, bannerImages] = await Promise.all([
      page.gallery ? parseImageList(page.gallery) : [],
      page.banner ? parseImageList(page.banner) : []
    ])

    return {
      page,
      galleryImages,
      bannerImages
    }
  },
  {
    watch: [() => route.path],
    default: () => null
  }
)

// Computed properties for reactive data
const page = computed(() => pageData.value?.page)
const galleryImages = computed(() => pageData.value?.galleryImages || [])
const bannerImages = computed(() => pageData.value?.bannerImages || [])
const currentNav = computed(() => contentBrief.value?.filter(item => {
  return item.path.startsWith(route.path)
}).sort((a, b) => {
  const aLast = a.path.split('/').pop()
  const bLast = b.path.split('/').pop()
  const aNum = Number(aLast)
  const bNum = Number(bLast)

  if (!isNaN(aNum) && !isNaN(bNum)) {
    return bNum - aNum
  }
  return String(bLast).localeCompare(String(aLast))
}))

</script>

<template>
  <div class="min-w-0 min-h-0">

    <Head>
      <Title v-if="page?.title">{{ page.title }} - {{ info.title }}</Title>
      <Title v-else>{{ info.title }}</Title>
    </Head>
    <!-- Popup Gallery -->
    <ClientOnly>
      <Transition name="fade" mode="out-in">
        <div v-if="popup && galleryImages.length" class="popup-container">
          <div @click="onPopClose" class="absolute top-3 right-3 cursor-pointer z-10 text-gray-600">
            <Icon icon="mdi:window-close" width="30" height="30" />
          </div>
          <div class="min-w-0 min-h-0 h-full w-full flex flex-col bg-white p-2">
            <swiper :modules="[Navigation, Thumbs]" :thumbs="{ swiper: thumbsSwiper }" :navigation="true"
              @slideChange="onSlideChange" :slides-per-view="1" :space-between="30" :loop="true"
              :initial-slide="initialSlide" :lazy="true" class="gallery-swiper w-full h-[80%] my-auto">
              <SwiperSlide v-for="(image, index) in galleryImages" :key="image" class="bg-white">
                <div class="flex justify-center items-center h-full w-full">
                  <ResizedImg :src="image" size="large" class="h-full w-full object-contain m-auto"
                    :loading="index === initialSlide ? 'eager' : 'lazy'" />
                </div>
                <div class="swiper-lazy-preloader"></div>
              </SwiperSlide>
            </swiper>
            <swiper slides-per-view="auto" :space-between="10" :watch-slides-progress="true" :modules="[Thumbs]"
              @swiper="setThumbsSwiper" class="gallery-thumbs w-full h-[10%]">
              <SwiperSlide v-for="image in galleryImages" :key="image" class="bg-white" style="width: auto;">
                <div class="flex justify-center items-center h-full aspect-square cursor-pointer">
                  <ResizedImg :src="image" size="small" class="h-full w-full object-cover m-auto" loading="lazy" />
                </div>
              </SwiperSlide>
            </swiper>
          </div>
        </div>
      </Transition>
    </ClientOnly>
    <!-- Main Content -->
    <div v-if="page" class="min-w-0 min-h-0 my-auto">
      <h3 v-if="page.showTitle && page.title" class="mb-6 text-right text-gray-600">{{ page.title }}</h3>

      <!-- Banner Images -->
      <div v-if="bannerImages.length" class="min-w-0 min-h-0 mb-8">
        <swiper :loop="true" :modules="[EffectFade, Autoplay]" effect="fade" :autoplay="{
          delay: 2500,
          disableOnInteraction: false,
        }">
          <SwiperSlide v-for="image in bannerImages" :key="page.path + image" class="bg-white">
            <div class="aspect-[3/2] rounded overflow-hidden">
              <ResizedImg :src="image" size="large" class="w-full h-full object-cover m-auto" loading="lazy" />
            </div>
          </SwiperSlide>
        </swiper>
      </div>

      <!-- Gallery Grid -->
      <div v-if="galleryImages.length" class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div v-for="(image, index) in galleryImages" :key="image" class="aspect-square hover-opacity">
          <ResizedImg @click="() => onGalleryClick(index)" :src="image" size="small"
            class="rounded w-full h-full object-cover cursor-pointer" loading="lazy" />
        </div>
      </div>
      <ContentRenderer :value="page" />
    </div>

    <!-- Navigation Grid -->
    <div v-else-if="currentNav?.length" class="">
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
  </div>
</template>
