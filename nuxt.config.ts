// nuxt.config.ts
import {process} from "std-env";

export default defineNuxtConfig({
    modules: [
        '@nuxtjs/tailwindcss',
        '@pinia/nuxt'
    ],

    devtools: { enabled: true },

    typescript: {
        shim: false,
        strict: true
    },

    runtimeConfig: {
        public: {
            apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:5000'
        }
    },

    css: [
        '~/assets/css/toast.css',
    ],

    tailwindcss: {
        cssPath: '~/assets/css/tailwind.css',
    },

    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    },

    compatibilityDate: '2024-11-15'
})