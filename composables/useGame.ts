// composables/useGame.ts
import type { Game, Round, Player, PlayerGame } from '~/types'

export const useGame = () => {
    const addNewRound = (game: Game) => {
        game.rounds.push({
            roundNumber: game.rounds.length + 1,
            dateTime: new Date().toISOString()
        })
    }

    const currentRound = (game: Game): Round => {
        if (game.rounds.length === 0) {
            game.rounds.push({
                roundNumber: 1,
                dateTime: new Date().toISOString()
            })
        }
        return game.rounds[game.rounds.length - 1]
    }

    const initializePlayersForGame = (globalPlayers: Player[]): PlayerGame[] => {
        return globalPlayers.map(p => ({
            ...p,
            healthPoints: p.healthPointsMax,
            scenarioXp: 0  // XP du scénario commence à 0
        }))
    }

    return {
        addNewRound,
        currentRound,
        initializePlayersForGame
    }
}