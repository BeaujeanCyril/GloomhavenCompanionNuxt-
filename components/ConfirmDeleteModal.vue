<!-- components/ConfirmDeleteModal.vue -->
<script setup lang="ts">
const props = defineProps<{
  show: boolean
  campaignName: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { isDarkMode } = useTheme()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <Transition name="fade">
    <div
        v-if="show"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        @click.self="handleCancel">
      <div
          class="rounded-2xl max-w-md w-full shadow-2xl border-2 animate-shake transition-colors duration-300"
          :class="isDarkMode
            ? 'bg-gradient-to-br from-red-900/90 to-red-800/80 border-red-500/30'
            : 'bg-gradient-to-br from-red-100 to-red-50 border-red-300'">

        <!-- Icône d'alerte -->
        <div class="p-6 text-center">
          <div class="text-6xl mb-4 animate-pulse">⚠️</div>
          <h3
              class="text-2xl font-bold mb-2"
              :class="isDarkMode ? 'text-white' : 'text-gray-800'">
            Confirmer la suppression
          </h3>
        </div>

        <!-- Message -->
        <div class="px-6 pb-6">
          <div
              class="rounded-xl p-4 mb-6 border transition-colors duration-300"
              :class="isDarkMode
                ? 'bg-black/30 border-red-500/20'
                : 'bg-white/50 border-red-300'">
            <p
                class="text-center mb-3"
                :class="isDarkMode ? 'text-white' : 'text-gray-800'">
              Êtes-vous sûr de vouloir supprimer la campagne :
            </p>
            <p
                class="text-xl font-bold text-center mb-3"
                :class="isDarkMode ? 'text-yellow-300' : 'text-orange-600'">
              {{ campaignName }}
            </p>
            <p
                class="text-sm text-center"
                :class="isDarkMode ? 'text-red-300' : 'text-red-600'">
              Cette action est irréversible et supprimera également tous les joueurs et scénarios associés.
            </p>
          </div>

          <!-- Boutons -->
          <div class="flex gap-3">
            <button
                @click="handleCancel"
                class="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-slate-700 hover:to-slate-800 transition-all hover:-translate-y-0.5">
              Annuler
            </button>
            <button
                @click="handleConfirm"
                class="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:from-red-700 hover:to-red-800 transition-all hover:-translate-y-0.5">
              Supprimer
            </button>
          </div>
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

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>
