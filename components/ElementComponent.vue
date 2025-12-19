<!-- components/ElementComponent.vue -->
<script setup lang="ts">
const appStore = useAppStore()

const emit = defineEmits<{
  useElement: [id: number]
  setElementStrong: [id: number]
}>()

const handleUseElement = (id: number) => {
  emit('useElement', id)
}

const handleSetElementStrong = (id: number) => {
  emit('setElementStrong', id)
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <ElementMolecule
        v-for="element in appStore.elements"
        :key="element.id"
        :image-path="element.imagePath"
        :name="element.name"
        :state="element.state"
        @use-element="handleUseElement(element.id)"
        @set-element-strong="handleSetElementStrong(element.id)"
    />
  </div>
</template>