<!-- pages/player/index.vue -->
<script setup lang="ts">
const router = useRouter()
const pinInput = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const { isDarkMode, initTheme } = useTheme()

onMounted(() => {
  initTheme()
})

const submitPin = async () => {
  if (pinInput.value.length !== 4) {
    error.value = 'Le PIN doit contenir 4 chiffres'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    // Vérifier si le PIN existe
    const response = await $fetch(`/api/player-sessions/${pinInput.value}`)

    if (response.success) {
      // Rediriger vers la page du joueur
      router.push(`/player/${pinInput.value}`)
    }
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'PIN invalide ou expiré'
  } finally {
    isLoading.value = false
  }
}

const handleInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  // Garder uniquement les chiffres
  input.value = input.value.replace(/\D/g, '').slice(0, 4)
  pinInput.value = input.value
}
</script>

<template>
  <div
      class="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
      :class="isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'">

    <div
        class="w-full max-w-md p-8 rounded-3xl shadow-2xl transition-colors duration-300"
        :class="isDarkMode
          ? 'bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10'
          : 'bg-white border border-gray-200'">

      <!-- Logo -->
      <div class="flex flex-col items-center mb-8">
        <img
            src="/img/General/gh.png"
            alt="Gloomhaven Logo"
            class="h-20 w-auto object-contain mb-4" />
        <h1
            class="text-2xl font-bold"
            :class="isDarkMode ? 'text-white' : 'text-gray-800'">
          Rejoindre la partie
        </h1>
        <p
            class="text-sm mt-2"
            :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
          Entrez votre code PIN à 4 chiffres
        </p>
      </div>

      <!-- Formulaire PIN -->
      <form @submit.prevent="submitPin" class="space-y-6">
        <div>
          <input
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="4"
              :value="pinInput"
              @input="handleInput"
              placeholder="0000"
              class="w-full text-center text-4xl font-mono tracking-[0.5em] p-4 rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2"
              :class="isDarkMode
                ? 'bg-slate-900/50 border-slate-600 text-white placeholder-slate-500 focus:border-amber-500 focus:ring-amber-500/20'
                : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20'"
          />
        </div>

        <!-- Erreur -->
        <div v-if="error" class="text-red-500 text-center text-sm">
          {{ error }}
        </div>

        <!-- Bouton -->
        <button
            type="submit"
            :disabled="isLoading || pinInput.length !== 4"
            class="w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="isDarkMode
              ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-lg shadow-amber-500/25'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25'">
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connexion...
          </span>
          <span v-else>Rejoindre</span>
        </button>
      </form>

      <!-- Instructions -->
      <div
          class="mt-8 text-center text-sm"
          :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
        <p>Demandez votre code PIN au Game Master</p>
        <p class="mt-1">ou scannez le QR code affiché sur son écran</p>
      </div>
    </div>
  </div>
</template>
