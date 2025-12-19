<!-- pages/create-campaign.vue -->
<script setup lang="ts">
import type { Campaign, Player } from '~/types'

const appStore = useAppStore()
const { isDarkMode } = useTheme()
import { useToast } from 'vue-toastification'

const toast = useToast()

// Formulaire
const companyName = ref('')
const players = ref([
  { name: '', healthPointsMax: 10 }
])

// Validation
const errors = ref({
  companyName: '',
  players: ''
})

const validateForm = (): boolean => {
  errors.value = { companyName: '', players: '' }

  if (!companyName.value.trim()) {
    errors.value.companyName = 'Le nom de la compagnie est requis'
    return false
  }

  const validPlayers = players.value.filter(p => p.name.trim() !== '')
  if (validPlayers.length === 0) {
    errors.value.players = 'Veuillez renseigner au moins un joueur'
    return false
  }

  // Vérifier que tous les joueurs avec un nom ont des PV > 0
  for (const player of validPlayers) {
    if (!player.healthPointsMax || player.healthPointsMax <= 0) {
      errors.value.players = 'Tous les joueurs doivent avoir des points de vie supérieurs à 0'
      return false
    }
  }

  return true
}

const addPlayer = () => {
  if (players.value.length < 4) {
    players.value.push({ name: '', healthPointsMax: 10 })
  }
}

const removePlayer = (index: number) => {
  if (players.value.length > 1) {
    players.value.splice(index, 1)
  }
}

const navigateToList = () => {
  navigateTo('/campaigns')
}

const handleFormSubmit = async () => {
  if (!validateForm()) {
    return
  }

  // Créer la liste des joueurs valides
  const validPlayers: Player[] = players.value
      .filter(p => p.name.trim() !== '')
      .map(p => ({
        name: p.name.trim(),
        healthPointsMax: p.healthPointsMax || 10,
        coins: 0,
        xp: 0,
        deck: {
          name: `Deck de ${p.name}`,
          cardsList: [],
          cardsHistoric: [],
          isShowingBackCard: true,
          isShuffled: false
        },
        effects: []
      }))

  const newCampaign: Campaign = {
    companyName: companyName.value.trim(),
    players: validPlayers
  }

  try {
    await appStore.addCampaign(newCampaign)

    // Notification de succès
    toast.success(`Campagne créée : ${newCampaign.companyName} avec ${newCampaign.players.length} joueur${newCampaign.players.length > 1 ? 's' : ''}`)

    navigateTo('/campaigns')
  } catch (error) {
    console.error('Erreur lors de la création de la campagne', error)
    toast.error('Erreur lors de la création de la campagne')
  }
}
</script>

<template>
  <div
      class="min-h-screen p-6 transition-colors duration-300"
      :class="isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'">
    <div class="max-w-5xl mx-auto">

      <!-- En-tête -->
      <div class="mb-8">
        <h1
            class="text-4xl font-bold mb-2"
            :class="isDarkMode ? 'text-white' : 'text-gray-800'">
          Créer une Campagne
        </h1>
        <p
            class="text-lg"
            :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">
          Formez votre équipe d'aventuriers
        </p>
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="handleFormSubmit">

        <!-- Nom de la compagnie -->
        <div
            class="backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6 transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80 border border-white/10'
              : 'bg-gradient-to-r from-white/90 to-blue-100/80 border border-gray-200'">
          <h2
              class="text-xl font-bold mb-4 flex items-center gap-2"
              :class="isDarkMode ? 'text-white' : 'text-gray-800'">
            <span class="text-2xl">🏰</span>
            Nom de la compagnie
          </h2>
          <input
              v-model="companyName"
              type="text"
              placeholder="Nom de la compagnie"
              class="w-full border rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
              :class="[
                errors.companyName ? 'border-red-500' : '',
                isDarkMode
                  ? 'bg-slate-900/50 border-white/20 text-white placeholder-white/40'
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
              ]"
          />
          <p v-if="errors.companyName" class="text-red-400 text-sm mt-2">{{ errors.companyName }}</p>
        </div>

        <!-- Joueurs -->
        <div
            class="backdrop-blur-sm rounded-2xl p-6 shadow-2xl mb-6 transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80 border border-white/10'
              : 'bg-gradient-to-r from-white/90 to-blue-100/80 border border-gray-200'">
          <div class="flex items-center justify-between mb-6">
            <h2
                class="text-xl font-bold flex items-center gap-2"
                :class="isDarkMode ? 'text-white' : 'text-gray-800'">
              <span class="text-2xl">👥</span>
              Aventuriers ({{ players.length }} / 4)
            </h2>
            <button
                v-if="players.length < 4"
                type="button"
                @click="addPlayer"
                class="bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all hover:-translate-y-0.5 flex items-center gap-2">
              <span class="text-lg">+</span>
              Ajouter un joueur
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
                v-for="(player, index) in players"
                :key="index"
                class="rounded-xl p-5 transition-all duration-300"
                :class="isDarkMode
                  ? 'bg-slate-800/50 border border-white/10 hover:border-white/30'
                  : 'bg-blue-50 border border-gray-200 hover:border-blue-300'">

              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                  <span class="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    {{ index + 1 }}
                  </span>
                  <h3
                      class="font-semibold"
                      :class="isDarkMode ? 'text-white' : 'text-gray-800'">
                    Joueur {{ index + 1 }}
                  </h3>
                  <span
                      v-if="index >= 1"
                      class="text-xs"
                      :class="isDarkMode ? 'text-white/40' : 'text-gray-400'">
                    (optionnel)
                  </span>
                </div>
                <button
                    v-if="players.length > 1"
                    type="button"
                    @click="removePlayer(index)"
                    class="text-red-400 hover:text-red-300 transition-colors text-sm">
                  Supprimer
                </button>
              </div>

              <div class="space-y-3">
                <div>
                  <label
                      class="block text-sm mb-1"
                      :class="isDarkMode ? 'text-white/70' : 'text-gray-600'">
                    Nom
                  </label>
                  <input
                      v-model="player.name"
                      type="text"
                      placeholder="Nom du joueur"
                      class="w-full border rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                      :class="isDarkMode
                        ? 'bg-slate-900/50 border-white/20 text-white placeholder-white/40'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'"
                  />
                </div>

                <div>
                  <label
                      class="block text-sm mb-1"
                      :class="isDarkMode ? 'text-white/70' : 'text-gray-600'">
                    Points de vie max
                  </label>
                  <input
                      v-model.number="player.healthPointsMax"
                      type="number"
                      min="1"
                      placeholder="Points de vie maximum"
                      class="w-full border rounded-lg px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors"
                      :class="isDarkMode
                        ? 'bg-slate-900/50 border-white/20 text-white placeholder-white/40'
                        : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'"
                  />
                </div>
              </div>
            </div>
          </div>

          <p v-if="errors.players" class="text-red-400 text-sm mt-4">{{ errors.players }}</p>
        </div>

        <!-- Boutons -->
        <div class="flex gap-4 justify-end">
          <button
              type="button"
              @click="navigateToList"
              class="bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all hover:-translate-y-0.5">
            Annuler
          </button>
          <button
              type="submit"
              class="bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:from-green-700 hover:to-green-800 transition-all hover:-translate-y-0.5 flex items-center gap-2">
            <span class="text-xl">✓</span>
            Créer la campagne
          </button>
        </div>
      </form>

    </div>
  </div>
</template>
