<!-- components/EditCampaignModal.vue -->
<script setup lang="ts">
import type { Campaign, Player } from '~/types'

const props = defineProps<{
  campaign: Campaign
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [campaign: { companyName: string, players: Player[] }]
}>()

const appStore = useAppStore()
const { isDarkMode } = useTheme()

// État local du formulaire
const formData = ref({
  companyName: '',
  players: [] as Player[]
})

// Initialiser le formulaire quand la campagne change
watch(() => props.campaign, (newCampaign) => {
  if (newCampaign) {
    formData.value = {
      companyName: newCampaign.companyName,
      players: JSON.parse(JSON.stringify(newCampaign.players)) // Deep copy
    }
  }
}, { immediate: true })

const addPlayer = () => {
  formData.value.players.push({
    name: '',
    healthPointsMax: 10,
    coins: 0,
    xp: 0,
    deck: { id: 0, name: '', cardsList: [], cardsHistoric: [], isShowingBackCard: true, isShuffled: false },
    effects: []
  })
}

const removePlayer = (index: number) => {
  formData.value.players.splice(index, 1)
}

const handleSave = async () => {
  // Validation
  if (!formData.value.companyName.trim()) {
    alert('Le nom de la campagne est requis')
    return
  }

  if (formData.value.players.length === 0) {
    alert('Au moins un joueur est requis')
    return
  }

  for (const player of formData.value.players) {
    if (!player.name.trim()) {
      alert('Le nom de chaque joueur est requis')
      return
    }
    if (player.healthPointsMax <= 0) {
      alert('Les points de vie doivent être supérieurs à 0')
      return
    }
  }

  emit('save', formData.value)
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Transition name="fade">
    <div
        v-if="show"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        @click.self="handleClose">
      <div
          class="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transition-colors duration-300"
          :class="isDarkMode
            ? 'bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10'
            : 'bg-gradient-to-br from-white to-blue-50 border border-gray-200'">

        <!-- En-tête -->
        <div
            class="sticky top-0 p-6 flex justify-between items-center transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-b border-white/10'
              : 'bg-gradient-to-r from-white to-blue-50 border-b border-gray-200'">
          <h3
              class="text-2xl font-bold"
              :class="isDarkMode ? 'text-white' : 'text-gray-800'">
            Modifier la campagne
          </h3>
          <button
              @click="handleClose"
              class="text-3xl w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              :class="isDarkMode
                ? 'text-white hover:bg-white/10'
                : 'text-gray-800 hover:bg-gray-200'">
            ×
          </button>
        </div>

        <!-- Contenu -->
        <div class="p-6 space-y-6">

          <!-- Nom de la campagne -->
          <div>
            <label
                class="block font-semibold mb-2"
                :class="isDarkMode ? 'text-white' : 'text-gray-800'">
              Nom de la campagne
            </label>
            <input
                v-model="formData.companyName"
                type="text"
                class="w-full px-4 py-2 rounded-lg border focus:border-blue-500 focus:outline-none transition-colors"
                :class="isDarkMode
                  ? 'bg-slate-900/50 text-white border-white/10'
                  : 'bg-white text-gray-800 border-gray-300'"
                placeholder="Entrez le nom de la campagne" />
          </div>

          <!-- Liste des joueurs -->
          <div>
            <div class="flex justify-between items-center mb-3">
              <label
                  class="font-semibold"
                  :class="isDarkMode ? 'text-white' : 'text-gray-800'">
                Joueurs
              </label>
              <button
                  @click="addPlayer"
                  class="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg hover:from-green-700 hover:to-green-800 transition-all hover:-translate-y-0.5">
                + Ajouter un joueur
              </button>
            </div>

            <div class="space-y-3">
              <div
                  v-for="(player, index) in formData.players"
                  :key="index"
                  class="p-4 rounded-lg border space-y-3 transition-colors duration-300"
                  :class="isDarkMode
                    ? 'bg-slate-900/50 border-white/10'
                    : 'bg-blue-50 border-gray-200'">

                <div class="flex justify-between items-center mb-2">
                  <span
                      class="font-semibold"
                      :class="isDarkMode ? 'text-white' : 'text-gray-800'">
                    Joueur {{ index + 1 }}
                  </span>
                  <button
                      @click="removePlayer(index)"
                      class="text-red-400 hover:text-red-300 transition-colors">
                    Supprimer
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- Nom -->
                  <div>
                    <label
                        class="block text-sm mb-1"
                        :class="isDarkMode ? 'text-white/70' : 'text-gray-600'">
                      Nom
                    </label>
                    <input
                        v-model="player.name"
                        type="text"
                        class="w-full px-3 py-2 rounded-lg border focus:border-blue-500 focus:outline-none transition-colors"
                        :class="isDarkMode
                          ? 'bg-slate-800/50 text-white border-white/10'
                          : 'bg-white text-gray-800 border-gray-300'"
                        placeholder="Nom du joueur" />
                  </div>

                  <!-- Points de vie max -->
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
                        class="w-full px-3 py-2 rounded-lg border focus:border-blue-500 focus:outline-none transition-colors"
                        :class="isDarkMode
                          ? 'bg-slate-800/50 text-white border-white/10'
                          : 'bg-white text-gray-800 border-gray-300'"
                        placeholder="PV max" />
                  </div>

                  <!-- Or -->
                  <div>
                    <label
                        class="block text-sm mb-1"
                        :class="isDarkMode ? 'text-white/70' : 'text-gray-600'">
                      Or
                    </label>
                    <input
                        v-model.number="player.coins"
                        type="number"
                        min="0"
                        class="w-full px-3 py-2 rounded-lg border focus:border-blue-500 focus:outline-none transition-colors"
                        :class="isDarkMode
                          ? 'bg-slate-800/50 text-white border-white/10'
                          : 'bg-white text-gray-800 border-gray-300'"
                        placeholder="0" />
                  </div>

                  <!-- XP -->
                  <div>
                    <label
                        class="block text-sm mb-1"
                        :class="isDarkMode ? 'text-white/70' : 'text-gray-600'">
                      XP
                    </label>
                    <input
                        v-model.number="player.xp"
                        type="number"
                        min="0"
                        class="w-full px-3 py-2 rounded-lg border focus:border-blue-500 focus:outline-none transition-colors"
                        :class="isDarkMode
                          ? 'bg-slate-800/50 text-white border-white/10'
                          : 'bg-white text-gray-800 border-gray-300'"
                        placeholder="0" />
                  </div>
                </div>
              </div>

              <div
                  v-if="formData.players.length === 0"
                  class="text-center py-8"
                  :class="isDarkMode ? 'text-white/50' : 'text-gray-500'">
                Aucun joueur. Cliquez sur "Ajouter un joueur" pour commencer.
              </div>
            </div>
          </div>
        </div>

        <!-- Footer avec boutons -->
        <div
            class="sticky bottom-0 p-6 flex justify-end gap-3 transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-r from-slate-800 to-slate-700 border-t border-white/10'
              : 'bg-gradient-to-r from-white to-blue-50 border-t border-gray-200'">
          <button
              @click="handleClose"
              class="px-6 py-2 rounded-lg font-semibold shadow-lg transition-all"
              :class="isDarkMode
                ? 'bg-slate-600 text-white hover:bg-slate-700'
                : 'bg-gray-300 text-gray-800 hover:bg-gray-400'">
            Annuler
          </button>
          <button
              @click="handleSave"
              class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all hover:-translate-y-0.5">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </Transition>
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
