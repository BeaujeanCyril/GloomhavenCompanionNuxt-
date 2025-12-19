// plugins/toast.client.ts
import Toast from 'vue-toastification'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(Toast, {
        position: 'bottom-right',
        timeout: 3000
    })
})
