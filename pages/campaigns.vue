<!-- pages/campaigns.vue -->
<script setup lang="ts">
import type { Campaign } from '~/types'

const appStore = useAppStore()
const { isDarkMode } = useTheme()
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedCampaign = ref<Campaign | null>(null)
const campaignToDelete = ref<Campaign | null>(null)

// Charger les campagnes au montage
onMounted(async () => {
  await appStore.loadCampaigns()
})

const createNewCampaign = () => {
  navigateTo('/create-campaign')
}

const setCurrentTeamAndNavigate = (campaign: Campaign) => {
  appStore.resumeGame(campaign)
  navigateTo('/scenarios')
}

const openEditDialog = (campaign: Campaign) => {
  selectedCampaign.value = campaign
  showEditModal.value = true
}

const closeEditDialog = () => {
  showEditModal.value = false
  selectedCampaign.value = null
}

const handleSaveCampaign = async (updatedData: { companyName: string, players: any[] }) => {
  if (!selectedCampaign.value?.id) return

  try {
    await appStore.updateCampaign(selectedCampaign.value.id, updatedData)
    showEditModal.value = false
    selectedCampaign.value = null
    // Recharger les campagnes pour afficher les changements
    await appStore.loadCampaigns()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    alert('Erreur lors de la sauvegarde de la campagne')
  }
}

const openDeleteDialog = (campaign: Campaign) => {
  campaignToDelete.value = campaign
  showDeleteModal.value = true
}

const closeDeleteDialog = () => {
  showDeleteModal.value = false
  campaignToDelete.value = null
}

const confirmDelete = async () => {
  if (!campaignToDelete.value?.id) return

  try {
    await appStore.deleteCampaign(campaignToDelete.value.id)
    showDeleteModal.value = false
    campaignToDelete.value = null
    // Les campagnes sont déjà mises à jour dans le store
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    alert('Erreur lors de la suppression de la campagne')
  }
}
</script>

<template>
  <div
      class="min-h-screen p-4 sm:p-6 transition-colors duration-300"
      :class="isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'">
    <div class="max-w-7xl mx-auto">

      <!-- En-tête -->
      <div class="mb-6 sm:mb-8">
        <h1
            class="text-2xl sm:text-4xl font-bold mb-2"
            :class="isDarkMode ? 'text-white' : 'text-gray-800'">
          Campagnes
        </h1>
        <p
            class="text-base sm:text-lg"
            :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">
          Gérez vos équipes d'aventuriers
        </p>
      </div>

      <!-- État vide -->
      <div
          v-if="!appStore.campaigns || appStore.campaigns.length === 0"
          class="flex flex-col items-center justify-center py-20">
        <div
            class="backdrop-blur-sm rounded-2xl p-12 shadow-2xl text-center max-w-md transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80 border border-white/10'
              : 'bg-gradient-to-r from-white/90 to-blue-100/80 border border-gray-200'">
          <span class="text-6xl mb-6 block">⚔️</span>
          <h2
              class="text-2xl font-bold mb-4"
              :class="isDarkMode ? 'text-white' : 'text-gray-800'">
            Aucune équipe
          </h2>
          <p
              class="mb-6"
              :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">
            Aucun groupe de héros n'a encore répondu à l'appel…
          </p>
          <button
              @click="createNewCampaign"
              class="bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:from-green-700 hover:to-green-800 transition-all hover:-translate-y-1">
            <span class="flex items-center gap-2">
              <span class="text-xl">🎮</span>
              Soyez les premiers!
            </span>
          </button>
        </div>
      </div>

      <!-- Liste des campagnes -->
      <div
          v-else
          class="space-y-4">
        <div
            v-for="campaign in appStore.campaigns"
            :key="campaign.id"
            class="backdrop-blur-sm rounded-2xl p-6 shadow-2xl transition-all duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80 border border-white/10 hover:border-white/30'
              : 'bg-gradient-to-r from-white/90 to-blue-100/80 border border-gray-200 hover:border-blue-300'">

          <!-- En-tête de la campagne -->
          <div class="flex flex-wrap items-center justify-between mb-6 gap-4">
            <div>
              <h2
                  class="text-2xl font-bold mb-1"
                  :class="isDarkMode ? 'text-white' : 'text-gray-800'">
                {{ campaign.companyName }}
              </h2>
              <p
                  class="text-sm"
                  :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">
                {{ campaign.players?.length || 0 }} aventurier{{ campaign.players?.length > 1 ? 's' : '' }}
              </p>
            </div>

            <!-- Boutons d'action -->
            <div class="flex gap-1.5 sm:gap-2">
              <button
                  @click="openEditDialog(campaign)"
                  class="flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-2 px-2.5 sm:px-4 rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all hover:-translate-y-0.5"
                  title="Éditer">
                <span class="text-base sm:text-lg">✏️</span>
                <span class="hidden sm:inline text-sm">Éditer</span>
              </button>
              <button
                  @click="openDeleteDialog(campaign)"
                  class="flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-2 px-2.5 sm:px-4 rounded-lg shadow-lg hover:from-red-700 hover:to-red-800 transition-all hover:-translate-y-0.5"
                  title="Supprimer">
                <span class="text-base sm:text-lg">🗑️</span>
                <span class="hidden sm:inline text-sm">Supprimer</span>
              </button>
              <button
                  @click="setCurrentTeamAndNavigate(campaign)"
                  class="flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-2 px-2.5 sm:px-4 rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all hover:-translate-y-0.5"
                  title="Jouer">
                <span class="text-base sm:text-lg">▶️</span>
                <span class="hidden sm:inline text-sm">Jouer</span>
              </button>
            </div>
          </div>

          <!-- Liste des joueurs -->
          <div
              v-if="campaign.players && campaign.players.length > 0"
              class="rounded-xl p-3 sm:p-4 transition-colors duration-300"
              :class="isDarkMode
                ? 'bg-slate-800/50 border border-white/10'
                : 'bg-blue-50/50 border border-gray-200'">
            <h3
                class="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base"
                :class="isDarkMode ? 'text-white' : 'text-gray-800'">
              <span class="text-lg sm:text-xl">👥</span>
              Aventuriers
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              <div
                  v-for="player in campaign.players"
                  :key="player.id"
                  class="rounded-lg p-2.5 sm:p-4 transition-all duration-300"
                  :class="isDarkMode
                    ? 'bg-gradient-to-br from-slate-700/60 to-slate-600/40 border border-white/10 hover:border-white/30'
                    : 'bg-gradient-to-br from-white to-blue-100 border border-gray-200 hover:border-blue-300'">
                <p
                    class="font-bold text-sm sm:text-lg mb-2 sm:mb-3 truncate"
                    :class="isDarkMode ? 'text-white' : 'text-gray-800'">
                  {{ player.name }}
                </p>
                <div class="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                  <div class="flex justify-between items-center">
                    <span :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">XP</span>
                    <span class="text-blue-400 font-semibold">{{ player.xp }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">Or</span>
                    <span class="text-yellow-400 font-semibold">{{ player.coins }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">HP</span>
                    <span class="text-red-400 font-semibold">{{ player.healthPointsMax }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Aucun aventurier -->
          <div
              v-else
              class="rounded-xl p-6 text-center transition-colors duration-300"
              :class="isDarkMode
                ? 'bg-slate-800/30 border border-white/10'
                : 'bg-blue-50/30 border border-gray-200'">
            <p :class="isDarkMode ? 'text-white/60' : 'text-gray-600'">
              Aucun aventurier dans cette compagnie
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Modal d'édition -->
  <EditCampaignModal
      v-if="selectedCampaign"
      :campaign="selectedCampaign"
      :show="showEditModal"
      @close="closeEditDialog"
      @save="handleSaveCampaign"
  />

  <!-- Modal de confirmation de suppression -->
  <ConfirmDeleteModal
      :show="showDeleteModal"
      :campaign-name="campaignToDelete?.companyName || ''"
      @confirm="confirmDelete"
      @cancel="closeDeleteDialog"
  />
</template>