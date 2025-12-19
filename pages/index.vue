<!-- pages/index.vue -->
<script setup lang="ts">
import {useAppStore} from "../stores/app";

const appStore = useAppStore()
const { isDarkMode } = useTheme()

const openPdf = (path: string) => {
  window.open(path, '_blank')
}
</script>

<template>
  <div
      class="min-h-screen p-6 transition-colors duration-300"
      :class="isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'">
    <div class="max-w-4xl mx-auto">

      <!-- En-tête avec logo/titre -->
      <div class="text-center mb-12">
        <h1
            class="text-5xl font-bold mb-4 tracking-wide"
            :class="isDarkMode ? 'text-white' : 'text-gray-800'">
          Gloomhaven Companion
        </h1>
      </div>

      <!-- Section Ressources -->
      <div
          class="backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6 transition-colors duration-300"
          :class="isDarkMode
            ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80 border border-white/10'
            : 'bg-gradient-to-r from-white/90 to-blue-100/80 border border-gray-200'">
        <h2
            class="text-2xl font-bold mb-4 flex items-center gap-2"
            :class="isDarkMode ? 'text-white' : 'text-gray-800'">
          <span class="text-3xl">📚</span>
          Ressources
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
              @click="openPdf('/img/Books/ca-gloomhaven-regle.pdf')"
              class="flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all hover:-translate-y-1">
            <span class="text-2xl">📖</span>
            <span class="text-lg">Règles</span>
          </button>
          <button
              @click="openPdf('/img/Books/Gloomhaven (VF) - Campagne Principale v1.2.pdf')"
              class="flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all hover:-translate-y-1">
            <span class="text-2xl">📜</span>
            <span class="text-lg">Scénarios</span>
          </button>
        </div>
      </div>

      <!-- Section Campagne -->
      <div
          class="backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6 transition-colors duration-300"
          :class="isDarkMode
            ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80 border border-white/10'
            : 'bg-gradient-to-r from-white/90 to-blue-100/80 border border-gray-200'">
        <h2
            class="text-2xl font-bold mb-4 flex items-center gap-2"
            :class="isDarkMode ? 'text-white' : 'text-gray-800'">
          <span class="text-3xl">🎮</span>
          Campagne
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
              @click="navigateTo('/create-campaign')"
              class="flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:from-green-700 hover:to-green-800 transition-all hover:-translate-y-1">
            <span class="text-2xl">➕</span>
            <span class="text-lg">Nouvelle campagne</span>
          </button>

          <button
              @click="navigateTo('/campaigns')"
              class="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all hover:-translate-y-1">
            <span class="text-2xl">📁</span>
            <span class="text-lg">Charger une campagne</span>
          </button>
        </div>
      </div>

      <!-- Section Jeu en cours (conditionnelle) -->
      <div
          v-if="appStore.currentCampaign"
          class="backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6 animate-pulse transition-colors duration-300"
          :class="isDarkMode
            ? 'bg-gradient-to-r from-amber-600/90 to-orange-600/80 border border-amber-400/20'
            : 'bg-gradient-to-r from-amber-100/90 to-orange-100/80 border border-amber-300'">
        <h2
            class="text-2xl font-bold mb-4 flex items-center gap-2"
            :class="isDarkMode ? 'text-white' : 'text-gray-800'">
          <span class="text-3xl">⚔️</span>
          Partie en cours
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
              @click="navigateTo('/game')"
              class="flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-5 px-6 rounded-xl shadow-lg hover:from-red-700 hover:to-red-800 transition-all hover:-translate-y-1 hover:scale-105">
            <span class="text-3xl">▶️</span>
            <span class="text-xl">Reprendre le scénario</span>
          </button>

          <button
              @click="navigateTo('/scenarios')"
              class="flex items-center justify-center gap-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all hover:-translate-y-1">
            <span class="text-2xl">📋</span>
            <span class="text-lg">Liste des scénarios</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>