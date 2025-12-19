<!-- components/PlayerPinsModal.vue -->
<script setup lang="ts">
import QRCode from 'qrcode'
import type { PlayerGame } from '~/types'

const props = defineProps<{
  show: boolean
  players: Array<{ id: number, name: string, pin?: string }>
  baseUrl: string
}>()

const emit = defineEmits<{
  close: []
  generatePins: []
}>()

const { isDarkMode } = useTheme()
const router = useRouter()

// QR codes générés (base64)
const qrCodes = ref<Record<string, string>>({})

// Pour rejoindre une partie
const joinPin = ref('')
const joinError = ref('')
const isJoining = ref(false)

const joinGame = async () => {
  if (joinPin.value.length !== 4) {
    joinError.value = 'Le code PIN doit contenir 4 chiffres'
    return
  }

  joinError.value = ''
  isJoining.value = true

  try {
    // Vérifier si le PIN est valide
    const response = await $fetch(`/api/player-sessions/${joinPin.value}`)
    if (response) {
      // Rediriger vers la page joueur
      emit('close')
      router.push(`/player/${joinPin.value}`)
    }
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string } }
    joinError.value = err.data?.statusMessage || 'Code PIN invalide ou expiré'
  } finally {
    isJoining.value = false
  }
}

const handlePinInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  // Ne garder que les chiffres
  input.value = input.value.replace(/\D/g, '').slice(0, 4)
  joinPin.value = input.value
  joinError.value = ''
}

// Générer les QR codes quand les PINs changent
watch(() => props.players, async (newPlayers) => {
  for (const player of newPlayers) {
    if (player.pin && !qrCodes.value[player.pin]) {
      const url = `${props.baseUrl}/player/${player.pin}`
      try {
        qrCodes.value[player.pin] = await QRCode.toDataURL(url, {
          width: 150,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })
      } catch (err) {
        console.error('Erreur QR code:', err)
      }
    }
  }
}, { immediate: true, deep: true })

const copyPin = async (pin: string) => {
  try {
    await navigator.clipboard.writeText(pin)
  } catch (err) {
    console.error('Erreur copie:', err)
  }
}

const copyUrl = async (pin: string) => {
  try {
    const url = `${props.baseUrl}/player/${pin}`
    await navigator.clipboard.writeText(url)
  } catch (err) {
    console.error('Erreur copie:', err)
  }
}
</script>

<template>
  <Transition name="fade">
    <div
        v-if="show"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        @click.self="emit('close')">
      <div
          class="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl transition-colors duration-300"
          :class="isDarkMode
            ? 'bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10'
            : 'bg-gradient-to-br from-white to-blue-50 border border-gray-200'">

        <!-- Header -->
        <div class="flex justify-between items-center p-6 border-b"
             :class="isDarkMode ? 'border-white/10' : 'border-gray-200'">
          <div>
            <h3
                class="text-2xl font-bold"
                :class="isDarkMode ? 'text-white' : 'text-gray-800'">
              Connexion des joueurs
            </h3>
            <p
                class="text-sm mt-1"
                :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
              Chaque joueur peut scanner son QR code ou entrer son PIN
            </p>
          </div>
          <button
              @click="emit('close')"
              class="text-3xl w-10 h-10 flex items-center justify-center rounded-lg transition-colors"
              :class="isDarkMode
                ? 'text-white hover:bg-white/10'
                : 'text-gray-800 hover:bg-gray-200'">
            ×
          </button>
        </div>

        <!-- Corps -->
        <div class="p-6">
          <!-- Bouton générer si pas de PINs -->
          <div
              v-if="!players.some(p => p.pin)"
              class="text-center py-8">
            <p
                class="mb-4"
                :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
              Générez les codes PIN pour permettre aux joueurs de se connecter
            </p>
            <button
                @click="emit('generatePins')"
                class="px-6 py-3 rounded-xl font-semibold transition-all"
                :class="isDarkMode
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'">
              Générer les codes PIN
            </button>
          </div>

          <!-- Liste des joueurs avec leurs PINs -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
                v-for="player in players"
                :key="player.id"
                class="rounded-xl p-4 transition-colors"
                :class="isDarkMode ? 'bg-slate-900/50' : 'bg-gray-100'">

              <div class="flex items-start gap-4">
                <!-- QR Code -->
                <div
                    v-if="player.pin && qrCodes[player.pin]"
                    class="flex-shrink-0 bg-white p-2 rounded-lg">
                  <img
                      :src="qrCodes[player.pin]"
                      :alt="`QR code pour ${player.name}`"
                      class="w-[120px] h-[120px]" />
                </div>

                <!-- Infos -->
                <div class="flex-1 min-w-0">
                  <h4
                      class="font-bold text-lg truncate"
                      :class="isDarkMode ? 'text-white' : 'text-gray-800'">
                    {{ player.name }}
                  </h4>

                  <!-- PIN -->
                  <div class="mt-2">
                    <span
                        class="text-xs"
                        :class="isDarkMode ? 'text-gray-500' : 'text-gray-500'">
                      Code PIN
                    </span>
                    <div class="flex items-center gap-2 mt-1">
                      <span
                          class="text-2xl font-mono font-bold tracking-wider"
                          :class="isDarkMode ? 'text-amber-400' : 'text-indigo-600'">
                        {{ player.pin }}
                      </span>
                      <button
                          @click="copyPin(player.pin!)"
                          class="p-1 rounded transition-colors"
                          :class="isDarkMode
                            ? 'hover:bg-white/10 text-gray-400'
                            : 'hover:bg-gray-200 text-gray-500'"
                          title="Copier le PIN">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <!-- URL -->
                  <div class="mt-2">
                    <button
                        @click="copyUrl(player.pin!)"
                        class="text-xs flex items-center gap-1 transition-colors"
                        :class="isDarkMode
                          ? 'text-gray-500 hover:text-gray-300'
                          : 'text-gray-400 hover:text-gray-600'">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Copier le lien
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Régénérer les PINs -->
          <div
              v-if="players.some(p => p.pin)"
              class="mt-6 text-center">
            <button
                @click="emit('generatePins')"
                class="text-sm transition-colors"
                :class="isDarkMode
                  ? 'text-gray-500 hover:text-gray-300'
                  : 'text-gray-400 hover:text-gray-600'">
              Régénérer tous les codes PIN
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div
            class="p-4 border-t text-center"
            :class="isDarkMode ? 'border-white/10' : 'border-gray-200'">
          <p
              class="text-sm"
              :class="isDarkMode ? 'text-gray-500' : 'text-gray-400'">
            Les joueurs peuvent accéder à <span class="font-mono">{{ baseUrl }}/player</span> et entrer leur PIN
          </p>
        </div>

        <!-- Section Rejoindre une partie -->
        <div
            class="p-6 border-t"
            :class="isDarkMode ? 'border-white/10 bg-slate-900/30' : 'border-gray-200 bg-gray-50'">
          <h4
              class="text-lg font-bold mb-4 flex items-center gap-2"
              :class="isDarkMode ? 'text-white' : 'text-gray-800'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Rejoindre une partie
          </h4>
          <p
              class="text-sm mb-4"
              :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
            Entrez votre code PIN pour rejoindre en tant que joueur
          </p>

          <div class="flex gap-3 items-start">
            <div class="flex-1">
              <input
                  type="text"
                  inputmode="numeric"
                  :value="joinPin"
                  @input="handlePinInput"
                  placeholder="0000"
                  maxlength="4"
                  class="w-full px-4 py-3 text-2xl font-mono text-center tracking-[0.5em] rounded-xl border-2 transition-all focus:outline-none"
                  :class="[
                    isDarkMode
                      ? 'bg-slate-800 border-slate-600 text-white placeholder-gray-500 focus:border-amber-500'
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500',
                    joinError ? (isDarkMode ? 'border-red-500' : 'border-red-400') : ''
                  ]"
                  @keyup.enter="joinGame"
              />
              <p
                  v-if="joinError"
                  class="text-sm mt-2 text-red-500">
                {{ joinError }}
              </p>
            </div>
            <button
                @click="joinGame"
                :disabled="isJoining || joinPin.length !== 4"
                class="px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                :class="isDarkMode
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'">
              <span v-if="isJoining" class="flex items-center gap-2">
                <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion...
              </span>
              <span v-else>Rejoindre</span>
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
</style>
