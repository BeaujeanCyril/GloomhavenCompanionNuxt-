<!-- components/ElementMolecule.vue -->
<script setup lang="ts">
const props = defineProps<{
  imagePath: string
  name: string
  state: number
}>()

const emit = defineEmits<{
  useElement: []
  setElementStrong: []
}>()

const { isDarkMode } = useTheme()

const getStateColor = (state: number, dark: boolean): string => {
  if (dark) {
    switch (state) {
      case 0: return 'bg-gray-600'
      case 1: return 'bg-orange-500'
      case 2: return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  } else {
    switch (state) {
      case 0: return 'bg-gray-300'
      case 1: return 'bg-orange-400'
      case 2: return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }
}

const useElement = () => {
  emit('useElement')
}

const setElementStrong = () => {
  emit('setElementStrong')
}
</script>

<template>
  <div
      class="flex flex-col items-center justify-center rounded-lg p-3 transition-all duration-300 relative group min-h-[80px]"
      :class="getStateColor(state, isDarkMode)">

    <!-- Bouton + (en haut) -->
    <button
        v-if="state !== 2"
        @click="setElementStrong"
        class="text-white text-2xl font-bold w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform absolute top-1 right-1">
      +
    </button>

    <!-- Image de l'élément -->
    <img
        :src="imagePath"
        :alt="name"
        class="w-20 h-20 object-contain" />

    <!-- Bouton - (en bas) -->
    <button
        v-if="state !== 0"
        @click="useElement"
        class="text-white text-2xl font-bold w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform absolute bottom-1 left-1">
      -
    </button>
  </div>
</template>