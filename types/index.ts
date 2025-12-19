// types/index.ts

export interface CampaignScenario {
    id?: number
    campaignId: number
    scenarioId: number
    isFinished: boolean
    gameId?: number | null
    scenario?: Scenario
    game?: Game | null
}

export interface Campaign {
    id?: number
    companyName: string
    players: Player[]
    campaignScenarios?: CampaignScenario[]
    // Propriété helper pour compatibilité (calculée côté client)
    scenarios?: Scenario[]
}

export interface Player {
    id?: number
    name: string
    healthPointsMax: number
    coins: number
    xp: number
    deck: Deck
    effects: Effect[]
}

export interface PlayerGame extends Player {
    healthPoints: number
    scenarioXp: number  // XP gagné uniquement dans ce scénario (démarre à 0)
}

export interface Scenario {
    id: number
    name: string
    isFinished: boolean
    imagePath: string
    game?: Game | null
}

export interface Game {
    id?: number
    dateTimeStarted?: string
    players: PlayerGame[]
    rounds: Round[]
    monsterDeck: Deck
    gameState?: string
}

export interface Round {
    roundNumber: number
    dateTime: string
}

export interface Deck {
    id?: number
    name: string
    cardsList: Card[]
    cardsHistoric: Card[]
    isShowingBackCard: boolean
    isShuffled: boolean
}

export interface Card {
    id: number
    value: string
    imagePath: string
    needShuffle: boolean
    isTemporary?: boolean
}

export interface Element {
    id: number
    name: string
    state: number
    imagePath: string
}

export interface Effect {
    id?: number
    name: string
    description?: string
    duration?: number
}

// Types pour la création via API
export interface CreatePlayerInput {
    name: string
    healthPointsMax: number
    coins?: number
    xp?: number
}

export interface CreateCampaignInput {
    companyName: string
    players?: CreatePlayerInput[]
}