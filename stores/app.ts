// stores/app.ts
import { defineStore } from 'pinia'
import type {
    Campaign,
    Scenario,
    Player,
    Element,
    Game,
    Deck,
    PlayerGame,
    CreateCampaignInput
} from '~/types'

export const useAppStore = defineStore('app', {
    state: () => ({
        elements: [] as Element[],
        campaigns: [] as Campaign[],
        currentCampaign: null as Campaign | null,
        campaignSummaries: [] as Array<{ id: number, name: string }>,
        scenarios: [] as Scenario[],
        currentScenario: null as Scenario | null,
        currentGame: null as Game | null,
        currentPlayer: null as Player | null,
        cursedDeckCounter: 0,
    }),

    actions: {
        async initialize() {
            await this.loadElements()
            await this.generateScenarios()
        },

        async loadElements() {
            console.log('🔍 Chargement des éléments depuis /api/elements...')

            try {
                const data = await $fetch<Element[]>('/api/elements')

                console.log('📦 Réponse brute de l\'API:', data)

                if (data && Array.isArray(data)) {
                    console.log('✅ Éléments reçus de l\'API:', data.length)
                    // Ajouter l'état (state) à chaque élément (propriété client-side uniquement)
                    this.elements = data.map(element => ({
                        ...element,
                        state: 0
                    }))
                    console.log('✅ Éléments ajoutés au store:', this.elements.length)
                    console.log('📋 Premier élément:', this.elements[0])
                } else {
                    console.warn('⚠️ Aucune donnée reçue de /api/elements ou format incorrect')
                    console.log('Type de data:', typeof data)
                    console.log('Contenu de data:', data)
                }
            } catch (err) {
                console.error('💥 Exception lors du chargement des éléments:', err)
            }
        },

        resetElements() {
            this.elements.forEach(element => {
                element.state = 0
            })
        },

        nextRound() {
            if (!this.currentGame) return

            this.currentGame.rounds.push({
                roundNumber: this.currentGame.rounds.length + 1,
                dateTime: new Date().toISOString()
            })
        },

        async addCampaign(newCampaign: Campaign | CreateCampaignInput) {
            const { data, error } = await useFetch<Campaign>('/api/campaigns', {
                method: 'POST',
                body: newCampaign
            })

            if (error.value) {
                throw new Error(error.value.statusMessage || 'Erreur lors de la création de la campagne')
            }

            if (data.value) {
                const normalizedCampaign = this.normalizeCampaign(data.value)
                this.campaigns.push(normalizedCampaign)
                this.currentCampaign = normalizedCampaign
                return normalizedCampaign
            }
        },

        async loadCampaigns() {
            const { data } = await useFetch<Campaign[]>('/api/campaigns')
            if (data.value) {
                this.campaigns = data.value.map(c => this.normalizeCampaign(c))
            }
        },

        async loadCampaignSummaries() {
            const { data } = await useFetch<Array<{ id: number, name: string }>>('/api/campaigns/summaries')
            if (data.value) {
                this.campaignSummaries = data.value
            }
        },

        async loadCampaignById(campaignId: number) {
            const { data } = await useFetch<Campaign>(`/api/campaigns/${campaignId}`)
            if (data.value) {
                this.currentCampaign = this.normalizeCampaign(data.value)
            }
        },

        // Fonction helper pour normaliser une campagne
        normalizeCampaign(campaign: Campaign): Campaign {
            // Extraire les scénarios depuis campaignScenarios pour compatibilité
            if (campaign.campaignScenarios && campaign.campaignScenarios.length > 0) {
                campaign.scenarios = campaign.campaignScenarios.map(cs => {
                    let normalizedGame = cs.game

                    // Normaliser le game si présent
                    if (normalizedGame && normalizedGame.monsterDeck) {
                        // Transformer les cartes de la DB vers le format client
                        const cards = (normalizedGame.monsterDeck as any).cards || []
                        normalizedGame.monsterDeck.cardsList = cards
                            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                            .map((card: any) => ({
                                id: card.id,
                                value: card.value,
                                imagePath: card.imagePath,
                                needShuffle: card.needShuffle,
                                isTemporary: card.isTemporary || false
                            }))

                        // Initialiser cardsHistoric comme vide (ou depuis inHistoric si nécessaire)
                        normalizedGame.monsterDeck.cardsHistoric = cards
                            .filter((card: any) => card.inHistoric)
                            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                            .map((card: any) => ({
                                id: card.id,
                                value: card.value,
                                imagePath: card.imagePath,
                                needShuffle: card.needShuffle,
                                isTemporary: card.isTemporary || false
                            }))

                        // Transformer playerGames en players pour le jeu
                        if (normalizedGame.playerGames && Array.isArray(normalizedGame.playerGames)) {
                            normalizedGame.players = normalizedGame.playerGames.map((pg: any) => {
                                const campaignPlayer = campaign.players.find(p => p.id === pg.playerId)
                                if (campaignPlayer) {
                                    return {
                                        ...campaignPlayer,
                                        healthPoints: pg.healthPoints,
                                        scenarioXp: pg.scenarioXp || 0
                                    }
                                }
                                return null
                            }).filter(p => p !== null)
                        }
                    }

                    return {
                        id: cs.scenario!.id,
                        name: cs.scenario!.name,
                        imagePath: cs.scenario!.imagePath,
                        isFinished: cs.isFinished,
                        game: normalizedGame
                    }
                })

                // Calculer l'XP total pour chaque joueur (somme de tous les scenarioXp)
                campaign.players.forEach(player => {
                    let totalXp = 0
                    campaign.scenarios?.forEach(scenario => {
                        if (scenario.game && scenario.game.players) {
                            const playerInGame = scenario.game.players.find((p: any) => p.id === player.id)
                            if (playerInGame && playerInGame.scenarioXp) {
                                totalXp += playerInGame.scenarioXp
                            }
                        }
                    })
                    player.xp = totalXp
                    console.log(`XP total calculé pour ${player.name}: ${totalXp}`)
                })
            } else {
                campaign.scenarios = []
            }
            return campaign
        },

        async updateCampaign(campaignId: number, updatedData: { companyName: string, players: Player[] }) {
            try {
                const { data, error } = await useFetch<Campaign>(`/api/campaigns/${campaignId}`, {
                    method: 'PUT',
                    body: updatedData
                })

                if (error.value) {
                    throw new Error(error.value.statusMessage || 'Erreur lors de la mise à jour de la campagne')
                }

                if (data.value) {
                    const normalizedCampaign = this.normalizeCampaign(data.value)

                    // Mettre à jour dans la liste des campagnes
                    const index = this.campaigns.findIndex(c => c.id === campaignId)
                    if (index > -1) {
                        this.campaigns[index] = normalizedCampaign
                    }

                    // Mettre à jour la campagne courante si c'est celle-ci
                    if (this.currentCampaign?.id === campaignId) {
                        this.currentCampaign = normalizedCampaign
                    }

                    return normalizedCampaign
                }
            } catch (error: any) {
                console.error('Erreur lors de la mise à jour:', error)
                throw error
            }
        },

        async deleteCampaign(campaignId: number) {
            try {
                const { data, error } = await useFetch(`/api/campaigns/${campaignId}`, {
                    method: 'DELETE'
                })

                if (error.value) {
                    throw new Error(error.value.statusMessage || 'Erreur lors de la suppression de la campagne')
                }

                // Retirer la campagne de la liste locale
                const index = this.campaigns.findIndex(c => c.id === campaignId)
                if (index > -1) {
                    this.campaigns.splice(index, 1)
                }

                // Si c'est la campagne courante, la réinitialiser
                if (this.currentCampaign?.id === campaignId) {
                    this.currentCampaign = null
                    this.currentScenario = null
                    this.currentGame = null
                }

                return data.value
            } catch (error: any) {
                console.error('Erreur lors de la suppression:', error)
                throw error
            }
        },

        resumeGame(campaign: Campaign) {
            this.currentCampaign = campaign
        },

        addPlayer(player: Player) {
            if (!this.currentCampaign) return
            this.currentCampaign.players.push(player)
        },

        removePlayer(player: Player) {
            if (!this.currentCampaign) return
            const index = this.currentCampaign.players.findIndex(p => p.name === player.name)
            if (index > -1) {
                this.currentCampaign.players.splice(index, 1)
            }
        },


        createDeck(name: string): Deck {
            const deck: Deck = {
                id: (this.currentCampaign?.players.length || 0) + 1,
                name,
                cardsList: [],
                cardsHistoric: [],
                isShuffled: false,
                isShowingBackCard: true
            }

            const { initializeDeckCards } = useDeck()
            initializeDeckCards(deck)
            deck.isShuffled = true

            return deck
        },

        async generateScenarios() {
            const { data } = await useFetch<Scenario[]>('/api/scenarios')
            if (data.value) {
                this.scenarios = data.value
            }
        },

        async loadScenario(scenarioId: number) {
            if (!this.currentCampaign) {
                console.error('Aucune campagne chargée')
                return
            }

            // Chercher le scénario dans la liste normalisée
            let scenario = this.currentCampaign.scenarios?.find(s => s.id === scenarioId)

            // Si le scénario n'est pas dans la campagne, chercher dans la liste globale
            if (!scenario) {
                console.log(`Scénario ${scenarioId} non trouvé dans la campagne, recherche dans la liste globale...`)
                const globalScenario = this.scenarios.find(s => s.id === scenarioId)

                if (!globalScenario) {
                    console.error(`Scénario ${scenarioId} introuvable`)
                    return
                }

                // Créer un nouveau scénario pour cette campagne
                scenario = {
                    id: globalScenario.id,
                    name: globalScenario.name,
                    imagePath: globalScenario.imagePath,
                    isFinished: false,
                    game: null
                }

                if (!this.currentCampaign.scenarios) {
                    this.currentCampaign.scenarios = []
                }
                this.currentCampaign.scenarios.push(scenario)
            }

            this.currentScenario = scenario

            if (scenario.game) {
                console.log('Chargement du jeu existant')
                this.currentGame = scenario.game

                // Restaurer les éléments sauvegardés depuis gameState
                if (scenario.game.gameState) {
                    try {
                        const gameState = JSON.parse(scenario.game.gameState)
                        if (gameState.elements && Array.isArray(gameState.elements)) {
                            gameState.elements.forEach((savedElement: { id: number, state: number }) => {
                                const element = this.elements.find(e => e.id === savedElement.id)
                                if (element) {
                                    element.state = savedElement.state
                                }
                            })
                            console.log('✅ Éléments restaurés depuis la sauvegarde')
                        }
                    } catch (error) {
                        console.error('Erreur lors de la restauration des éléments:', error)
                        this.resetElements()
                    }
                } else {
                    this.resetElements()
                }
            } else {
                console.log('Initialisation d\'un nouveau jeu')
                this.resetElements()

                const { initializePlayersForGame } = useGame()

                this.currentGame = {
                    monsterDeck: this.createDeck('MonsterDeck'),
                    players: initializePlayersForGame(this.currentCampaign.players),
                    rounds: []
                }

                scenario.game = this.currentGame
            }

            console.log('Scénario chargé:', this.currentScenario)
            console.log('Jeu initialisé:', this.currentGame)
        },

        async resetScenario() {
            if (!this.currentCampaign || !this.currentScenario) return

            console.log('Réinitialisation du scénario')
            this.resetElements()

            const { initializePlayersForGame } = useGame()

            // Réinitialiser le jeu
            this.currentScenario.game = {
                monsterDeck: this.createDeck('MonsterDeck'),
                players: initializePlayersForGame(this.currentCampaign.players),
                rounds: []
            }

            this.currentGame = this.currentScenario.game

            console.log('Scénario réinitialisé')
        },

        async saveCampaign() {
            if (!this.currentCampaign || !this.currentScenario || !this.currentGame) {
                console.error('Impossible de sauvegarder: campagne, scénario ou jeu manquant')
                return
            }

            try {
                console.log('Sauvegarde de la campagne...')

                const { data, error } = await useFetch(`/api/campaigns/${this.currentCampaign.id}/save-game`, {
                    method: 'POST',
                    body: {
                        scenarioId: this.currentScenario.id,
                        game: this.currentGame,
                        elements: this.elements.map(e => ({ id: e.id, state: e.state }))
                    }
                })

                if (error.value) {
                    throw new Error(error.value.statusMessage || 'Erreur lors de la sauvegarde')
                }

                if (data.value) {
                    // Mettre à jour la campagne avec les données sauvegardées
                    this.currentCampaign = this.normalizeCampaign(data.value)
                    console.log('✅ Campagne sauvegardée avec succès')
                }
            } catch (error: any) {
                console.error('❌ Erreur lors de la sauvegarde de la campagne:', error)
                throw error
            }
        }
    }
})