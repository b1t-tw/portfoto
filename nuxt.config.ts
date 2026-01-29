// https://nuxt.com/docs/api/configuration/nuxt-config
import { readdirSync, statSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join, relative, resolve, dirname, extname } from 'path'
import yaml from 'yaml'
import sharp from 'sharp'

export const contentDir = () => {
  const contentPath = resolve(__dirname, 'content')
  const examplePath = resolve(__dirname, 'content.example')
  return existsSync(contentPath) ? contentPath : examplePath
}

export default defineNuxtConfig({
  content: {
    build: {
      pathMeta: {},
      markdown: {
        remarkPlugins: {
          'remark-breaks': {}
        }
      }
    }
  },

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('swiper-')
    }
  },

  app: {
    pageTransition: { name: 'fade-down', mode: 'out-in' },
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  postcss: {
    plugins: {
      "@tailwindcss/postcss": {},
      'postcss-nested': {},
    }
  },
  modules: ['@nuxt/content'],
  css: ['~/assets/css/tailwind.css'],
  hooks: {
    'build:before': async () => {
      const publicImgPath = join(process.cwd(), 'public')
      const resizedImagesDir = join(publicImgPath, 'resized')

      // Create resized images directory if it doesn't exist
      if (!existsSync(resizedImagesDir)) {
        mkdirSync(resizedImagesDir, { recursive: true })
      }

      // Define image sizes
      const imageSizes = {
        small: 480,
        large: 1920
      }

      // Modified getAllFiles function to process images
      async function getAllFiles(dir: string): Promise<string[]> {
        const files = readdirSync(dir)
        const allFiles: string[] = []
        const resizePromises: Promise<any>[] = []
        for (const file of files) {
          const fullPath = join(dir, file)

          if (statSync(fullPath).isDirectory()) {
            if (file !== 'resized') { // Skip resized directory
              allFiles.push(...await getAllFiles(fullPath))
            }
          } else {
            const ext = extname(file)
            if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase())) {
              const relativePath = '/' + relative(publicImgPath, fullPath).replace(/\\/g, '/')
              allFiles.push(relativePath)

              // Create resized images with same relative path structure
              const relativeDir = relative(publicImgPath, dir)

              // Process each size
              for (const [size, width] of Object.entries(imageSizes)) {
                const resizedDir = join(resizedImagesDir, size, relativeDir)
                const resizedPath = join(resizedDir, file)

                // Create directory structure if it doesn't exist
                if (!existsSync(resizedDir)) {
                  mkdirSync(resizedDir, { recursive: true })
                }

                try {
                  if (!existsSync(resizedPath + '.webp')) {
                    const _sharpPromise = sharp(fullPath)
                      .resize(width, null, {
                        fit: 'inside',
                        withoutEnlargement: true
                      })
                      .webp()
                      .toFile(resizedPath + '.webp')
                    resizePromises.push(_sharpPromise)
                  }
                } catch (error) {
                  console.error(`Error creating ${size} size image for ${file}:`, error)
                }
              }
            }
          }
        }
        await Promise.all(resizePromises)
        return allFiles
      }

      console.log("Generating resized images...")
      const imageList = await getAllFiles(publicImgPath)

      // Write images to JSON file
      const jsonPath = join(publicImgPath, 'images.json')
      writeFileSync(jsonPath, JSON.stringify(imageList, null, 2))

      // Handle info.yml to info.json conversion
      const infoPath = join(contentDir(), 'info.yml')
      const infoJsonPath = join(publicImgPath, 'info.json')
      const infoYaml = readFileSync(infoPath, 'utf8')
      const infoData = yaml.parse(infoYaml)
      writeFileSync(infoJsonPath, JSON.stringify(infoData, null, 2))
    }
  }
})