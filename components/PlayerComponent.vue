<!-- components/PlayerComponent.vue -->
<script setup lang="ts">
import type { PlayerGame } from '~/types'

const props = defineProps<{
  player: PlayerGame
}>()

const appStore = useAppStore()

const increaseHP = () => {
  if (props.player.healthPoints < props.player.healthPointsMax) {
    props.player.healthPoints++
  }
}

const decreaseHP = () => {
  if (props.player.healthPoints > 0) {
    props.player.healthPoints--
  }
}

const increaseXP = () => {
  props.player.scenarioXp++
}

const decreaseXP = () => {
  if (props.player.scenarioXp > 0) {
    props.player.scenarioXp--
  }
}

const increaseCoin = () => {
  props.player.coins++
}

const decreaseCoin = () => {
  if (props.player.coins > 0) {
    props.player.coins--
  }
}
</script>

<template>
  <div class="relative inline-block w-full">

    <!-- Boutons HP + et - -->
    <div class="absolute top-[23%] left-[11%] flex flex-col gap-14 z-10">
      <button
          @click="increaseHP"
          class="w-12 h-10 text-4xl text-white bg-transparent hover:bg-white/20 rounded transition-all">
        +
      </button>
      <button
          @click="decreaseHP"
          class="w-12 h-10 text-4xl text-white bg-transparent hover:bg-white/20 rounded transition-all">
        -
      </button>
    </div>

    <!-- Nom du joueur -->
    <div class="absolute top-[18%] left-0 right-0 text-center text-white font-bold text-2xl pointer-events-none">
      {{ player.name }}: {{ player.healthPointsMax }} HP Max
    </div>

    <!-- Image de fond -->
    <img src="/img/General/Dials.png" alt="Player Dial" class="w-full" />

    <!-- HP actuel -->
    <div class="absolute top-[40%] left-[37%] w-[50px] h-[50px] flex items-center justify-center bg-black text-white font-bold text-4xl rounded-xl">
      {{ player.healthPoints }}
    </div>

    <!-- XP -->
    <div class="absolute top-[40%] left-[53%] w-[50px] h-[50px] flex items-center justify-center bg-black text-white font-bold text-4xl rounded-xl">
      {{ player.scenarioXp }}
    </div>

    <!-- Icône pièce -->
    <div class="absolute top-[71%] left-[45%] w-[49px] h-[5px] flex items-center justify-center">
      <img src="/img/General/gh-coin-1.png" alt="Coin" />
    </div>

    <!-- Boutons Coin + et - -->
    <div class="absolute top-[65%] left-[36%] flex flex-row gap-14 z-10">
      <button
          @click="decreaseCoin"
          class="w-12 h-10 text-4xl text-white bg-transparent hover:bg-white/20 rounded transition-all">
        -
      </button>
      <button
          @click="increaseCoin"
          class="w-12 h-10 text-4xl text-white bg-transparent hover:bg-white/20 rounded transition-all">
        +
      </button>
    </div>

    <!-- Coins actuel -->
    <div class="absolute top-[71%] left-[45%] w-[49px] h-[5px] flex items-center justify-center  text-white font-bold text-2xl ">
      {{ player.coins }}
    </div>

    <!-- Boutons XP + et - -->
    <div class="absolute top-[23%] left-[80%] flex flex-col gap-14 z-10">
      <button
          @click="increaseXP"
          class="w-12 h-10 text-4xl text-white bg-transparent hover:bg-white/20 rounded transition-all">
        +
      </button>
      <button
          @click="decreaseXP"
          class="w-12 h-10 text-4xl text-white bg-transparent hover:bg-white/20 rounded transition-all">
        -
      </button>
    </div>
  </div>
</template>