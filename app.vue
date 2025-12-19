<!-- app.vue -->
<script setup lang="ts">
const appStore = useAppStore()

// Initialiser l'application au démarrage
onMounted(async () => {
  console.log('🚀 Initialisation de l\'application...')
  await appStore.initialize()
  console.log('✅ Application initialisée')
  console.log('📊 Éléments chargés:', appStore.elements.length)
  console.log('📊 Scénarios chargés:', appStore.scenarios.length)
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>