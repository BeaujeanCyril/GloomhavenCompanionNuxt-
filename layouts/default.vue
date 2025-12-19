<!-- layouts/default.vue -->
<script setup lang="ts">
const appStore = useAppStore()
const showPopup = ref(false)
const { isFullscreen, handleFullscreenChange } = useFullscreen()
const { isDarkMode, toggleTheme, initTheme } = useTheme()

const navigateToHome = () => {
  navigateTo('/')
}

const togglePopup = () => {
  showPopup.value = !showPopup.value
}

// Écouter les changements de fullscreen et initialiser le thème
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  initTheme()
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<template>
  <div
      class="min-h-screen transition-colors duration-300"
      :class="isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'">
    <!-- AppBar (masquée en fullscreen) -->
    <nav
        v-if="!isFullscreen"
        class="shadow-2xl transition-colors duration-300"
        :class="isDarkMode
          ? 'bg-gradient-to-r from-gray-900 to-gray-800 border-b border-white/10'
          : 'bg-gradient-to-r from-white to-blue-50 border-b border-gray-200'">
      <div class="flex items-center justify-between px-4 py-2">
        <!-- Menu et Logo -->
        <div class="flex items-center gap-4">
          <button
              @click="navigateToHome"
              class="p-2 rounded-lg transition-colors"
              :class="isDarkMode
                ? 'text-white hover:bg-white/10'
                : 'text-gray-800 hover:bg-gray-200'">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div class="flex items-center gap-2">
            <img
                src="/img/General/gh.png"
                alt="Gloomhaven Logo"
                class="h-12 w-auto object-contain" />
            <span
                class="text-lg font-semibold"
                :class="isDarkMode ? 'text-white' : 'text-gray-800'">
              Companion
            </span>
          </div>
        </div>

        <!-- Actions à droite -->
        <div class="flex items-center gap-2">
          <!-- Toggle Dark Mode -->
          <button
              @click="toggleTheme"
              class="p-2 rounded-lg transition-all"
              :class="isDarkMode
                ? 'text-white hover:bg-white/10'
                : 'text-gray-800 hover:bg-gray-200'">
            <svg v-if="isDarkMode" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <!-- Bouton More (popup cartes) -->
          <button
              @click="togglePopup"
              class="p-2 rounded-lg transition-colors"
              :class="isDarkMode
                ? 'text-white hover:bg-white/10'
                : 'text-gray-800 hover:bg-gray-200'">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
    </nav>

    <!-- Popup cartes du deck -->
    <Transition name="fade">
      <div
          v-if="showPopup && appStore.currentGame?.monsterDeck"
          class="fixed top-16 right-4 p-4 rounded-2xl shadow-2xl z-50 max-w-md transition-colors duration-300"
          :class="isDarkMode
            ? 'bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10'
            : 'bg-gradient-to-br from-white to-blue-50 border border-gray-200'">
        <h3
            class="font-semibold mb-3"
            :class="isDarkMode ? 'text-white' : 'text-gray-800'">
          Cartes du deck
        </h3>
        <div class="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
          <div
              v-for="card in appStore.currentGame.monsterDeck.cardsList"
              :key="card.id"
              class="rounded p-1"
              :class="isDarkMode ? 'bg-slate-900/50' : 'bg-gray-100'">
            <img
                :src="card.imagePath"
                alt="Card"
                class="w-full h-auto object-contain" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Contenu principal -->
    <main>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>