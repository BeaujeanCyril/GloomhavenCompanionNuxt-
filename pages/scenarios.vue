<!-- pages/scenarios.vue -->
<script setup lang="ts">
const appStore = useAppStore()
const { isDarkMode } = useTheme()

// Charger les scénarios au montage du composant
onMounted(async () => {
  if (!appStore.scenarios.length) {
    await appStore.generateScenarios()
  }
})

const navigateToGame = async (scenarioId: number) => {
  await appStore.loadScenario(scenarioId)
  navigateTo('/game')
}

// Scénarios triés par ID
const sortedScenarios = computed(() => {
  return [...appStore.scenarios].sort((a, b) => a.id - b.id)
})
</script>

<template>
  <div
      class="min-h-screen p-6 transition-colors duration-300"
      :class="isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'">
    <div class="max-w-7xl mx-auto">

      <!-- En-tête -->
      <div class="mb-8">
        <h1
            class="text-4xl font-bold mb-2"
            :class="isDarkMode ? 'text-white' : 'text-gray-800'">
          Liste des scénarios
        </h1>
        <p
            class="text-lg"
            :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">
          Sélectionnez un scénario pour commencer
        </p>
      </div>

      <!-- Grille de scénarios -->
      <div
          v-if="appStore.scenarios && appStore.scenarios.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6">

        <button
            v-for="scenario in sortedScenarios"
            :key="scenario.id"
            @click="navigateToGame(scenario.id)"
            class="group backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl transition-all hover:scale-105 duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-br from-slate-700/90 to-slate-600/80 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]'
              : 'bg-gradient-to-br from-white to-blue-100 hover:shadow-[0_20px_60px_rgba(99,102,241,0.3)]'">

          <!-- Image du scénario -->
          <div class="relative aspect-square overflow-hidden">
            <img
                :src="scenario.imagePath"
                :alt="scenario.name"
                class="w-full h-full object-cover transition-transform group-hover:scale-110" />

            <!-- Overlay au hover -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span class="text-white text-base font-semibold">{{ scenario.name }}</span>
            </div>
          </div>

          <!-- Badge numéro de scénario -->
          <div
              class="p-4 backdrop-blur-sm"
              :class="isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100/50'">
            <div class="flex items-center justify-center gap-2">
              <span
                  class="text-sm font-medium"
                  :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">
                Scénario
              </span>
              <span class="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold px-4 py-1.5 rounded-full text-base">
                {{ scenario.id }}
              </span>
            </div>
          </div>
        </button>
      </div>

      <!-- Message si aucun scénario -->
      <div
          v-else
          class="flex flex-col items-center justify-center py-20">
        <div
            class="backdrop-blur-sm rounded-2xl p-12 shadow-2xl text-center max-w-md transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80'
              : 'bg-gradient-to-r from-white/90 to-blue-100/80'">
          <span class="text-6xl mb-4 block">📜</span>
          <h2
              class="text-2xl font-bold mb-2"
              :class="isDarkMode ? 'text-white' : 'text-gray-800'">
            Aucun scénario trouvé
          </h2>
          <p :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">
            Aucun scénario n'est disponible pour la campagne actuelle.
          </p>
        </div>
      </div>

    </div>
  </div>
</template>