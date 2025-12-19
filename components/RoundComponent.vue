<!-- components/RoundComponent.vue -->
<script setup lang="ts">
import type { Round } from '~/types'

const props = defineProps<{
  round: Round
}>()

const emit = defineEmits<{
  nextRound: []
}>()

const { isDarkMode } = useTheme()

const nextRound = () => {
  emit('nextRound')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-20">
    <h1
        class="text-2xl font-bold whitespace-nowrap mb-2 transition-colors duration-300"
        :class="isDarkMode ? 'text-white' : 'text-gray-800'">
      Round {{ round.roundNumber }}
    </h1>
    <button
        @click="nextRound"
        class="text-4xl min-w-[60px] h-[60px] bg-transparent border-none hover:scale-110 hover:text-green-400 transition-all duration-300 font-bold"
        :class="isDarkMode ? 'text-white' : 'text-gray-800'">
      +
    </button>
  </div>
</template>