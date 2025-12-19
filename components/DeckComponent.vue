<!-- components/DeckComponent.vue -->
<script setup lang="ts">

const props = defineProps<{
  deckName: string
}>()

const appStore = useAppStore()
const { isDarkMode } = useTheme()
const showHistoryPopup = ref(false)
const showingBackCard = ref(true)
const backCardImagePath = '/img/DeckModifier/Monsters/gh-am-m-back.png'

const toggleHistoryPopup = () => {
  showHistoryPopup.value = !showHistoryPopup.value
}

// Récupérer le deck depuis le store
const deck = computed(() => {
  return appStore.currentGame?.monsterDeck
})

const currentCard = computed(() => {
  if (!deck.value || showingBackCard.value) {
    return {
      imagePath: backCardImagePath,
      value: '',
      id: 0,
      needShuffle: false
    }
  }
  return deck.value.cardsList[0]
})

const showNextCard = async () => {
  if (!deck.value) return

  const { showAndMoveFirstCardToEnd, shuffleDeck } = useDeck()

  if (showingBackCard.value) {
    showingBackCard.value = false
  } else {
    showingBackCard.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    showingBackCard.value = false
  }

  showAndMoveFirstCardToEnd(deck.value)

  if (currentCard.value.needShuffle) {
    shuffleDeck(deck.value)
  }
}

const addAnnulCard = () => {
  if (!deck.value) return

  const { addAnnulCard } = useDeck()
  addAnnulCard(deck.value)
  appStore.cursedDeckCounter++
}

const removeAnnulCard = () => {
  if (!deck.value) return

  const { removeAnnulCard } = useDeck()
  const removed = removeAnnulCard(deck.value)
  if (removed && appStore.cursedDeckCounter > 0) {
    appStore.cursedDeckCounter--
  }
}

const addBenedictionCard = () => {
  if (!deck.value) return

  const { addX2Card } = useDeck()
  addX2Card(deck.value)
}

// Réinitialiser la carte au changement de round
watch(() => appStore.currentGame?.rounds.length, () => {
  showingBackCard.value = true
})
</script>

<template>
  <div
      v-if="deck"
      class="flex justify-center items-center relative">

    <div
        class="relative rounded-xl p-4 shadow-xl w-full transition-colors duration-300"
        :class="isDarkMode
          ? 'bg-gradient-to-br from-slate-700 to-slate-600'
          : 'bg-gradient-to-br from-white to-blue-100'">

      <!-- Titre du deck avec bouton info -->
      <div class="flex items-center justify-center gap-2 mb-3">
        <button
            v-if="deck.cardsHistoric.length > 0"
            @click="toggleHistoryPopup"
            class="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-all"
            title="Voir l'historique">
          i
        </button>
      </div>

      <!-- Carte centrale -->
      <div class="flex justify-center mb-3">
        <img
            :src="currentCard.imagePath"
            :alt="currentCard.value"
            class="max-w-[250px] h-auto rounded-lg shadow-xl" />
      </div>

      <!-- Boutons d'action -->
      <div class="flex flex-col gap-2">
        <!-- Bouton Suivant -->
        <button
            @click="showNextCard"
            class="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg py-2 px-6 rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all hover:-translate-y-0.5">
          Suivant
        </button>

        <!-- Boutons d'ajout de cartes -->
        <div class="flex gap-2 justify-center">
          <button
              v-if="deckName !== 'MonsterDeck'"
              @click="addBenedictionCard"
              class="bg-gradient-to-r from-green-600 to-green-700 p-2 rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all hover:-translate-y-0.5">
            <img
                src="/img/DeckModifier/Monsters/BenedictionCard.png"
                alt="Ajout bénédiction"
                class="w-16 h-12 object-contain" />
          </button>

          <div class="flex items-center gap-2">
            <button
                @click="removeAnnulCard"
                class="bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold text-2xl w-10 h-10 rounded-lg shadow-lg hover:from-orange-700 hover:to-orange-800 transition-all hover:-translate-y-0.5 flex items-center justify-center"
                title="Retirer une malédiction">
              −
            </button>
            <div class="bg-gradient-to-r from-red-600 to-red-700 p-2 rounded-lg shadow-lg">
              <img
                  src="/img/DeckModifier/Monsters/gh-am-mm-01.png"
                  alt="Malédiction"
                  class="w-16 h-12 object-contain" />
            </div>
            <button
                @click="addAnnulCard"
                class="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-2xl w-10 h-10 rounded-lg shadow-lg hover:from-red-700 hover:to-red-800 transition-all hover:-translate-y-0.5 flex items-center justify-center"
                title="Ajouter une malédiction">
              +
            </button>
          </div>
        </div>
      </div>

      <!-- Badge compteur de malédictions -->
      <div
          v-if="appStore.cursedDeckCounter > 0"
          class="absolute top-2 right-2 bg-red-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg text-lg">
        {{ appStore.cursedDeckCounter }}
      </div>
    </div>

    <!-- Popup historique des cartes (modal central) -->
    <Transition name="fade">
      <div
          v-if="showHistoryPopup"
          class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
        <div
            class="p-6 rounded-2xl max-w-2xl w-11/12 shadow-2xl transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10'
              : 'bg-gradient-to-br from-white to-blue-50 border border-gray-200'">
          <div class="flex justify-between items-center mb-6">
            <h3
                class="text-2xl font-bold"
                :class="isDarkMode ? 'text-white' : 'text-gray-800'">
              Historique des cartes
            </h3>
            <button
                @click="toggleHistoryPopup"
                class="text-3xl w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                :class="isDarkMode
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-800 hover:bg-gray-200'">
              ×
            </button>
          </div>
          <div class="flex flex-col gap-3 max-h-96 overflow-y-auto">
            <div
                v-for="(card, index) in deck.cardsHistoric.slice().reverse()"
                :key="card.id"
                class="flex items-center gap-4 rounded-lg p-3 transition-colors duration-300"
                :class="isDarkMode
                  ? 'bg-slate-900/50 border border-white/10'
                  : 'bg-gray-100 border border-gray-200'">
              <div class="flex-shrink-0 bg-blue-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center">
                {{ deck.cardsHistoric.length - index }}
              </div>
              <img
                  :src="card.imagePath"
                  alt="Card"
                  class="w-32 h-24 object-contain" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>