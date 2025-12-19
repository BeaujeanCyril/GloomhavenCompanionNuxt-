// server/api/campaigns/[id]/save-game.post.ts
import prisma from '~/server/utils/db'
import type { Game, PlayerGame, Deck, Card } from '~/types'

export default defineEventHandler(async (event) => {
  const campaignId = parseInt(event.context.params?.id || '0')

  if (!campaignId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de campagne invalide'
    })
  }

  const body = await readBody<{
    scenarioId: number
    game: Game
    elements: Array<{ id: number, state: number }>
  }>(event)

  if (!body.scenarioId || !body.game) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Données de jeu manquantes'
    })
  }

  try {
    // Utiliser une transaction pour garantir la cohérence
    const result = await prisma.$transaction(async (tx) => {
      // 1. Vérifier que la campagne existe
      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
        include: { players: true }
      })

      if (!campaign) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Campagne non trouvée'
        })
      }

      // 2. Chercher ou créer la relation CampaignScenario
      let campaignScenario = await tx.campaignScenario.findFirst({
        where: {
          campaignId,
          scenarioId: body.scenarioId
        },
        include: {
          game: {
            include: {
              monsterDeck: true,
              playerGames: true,
              rounds: true
            }
          }
        }
      })

      let gameId: number

      if (campaignScenario?.game) {
        // 3a. Mettre à jour le jeu existant
        gameId = campaignScenario.game.id!

        // Mettre à jour le deck monstre
        await tx.deck.update({
          where: { id: campaignScenario.game.monsterDeck.id },
          data: {
            isShuffled: body.game.monsterDeck.isShuffled,
            isShowingBackCard: body.game.monsterDeck.isShowingBackCard
          }
        })

        // Supprimer les anciennes cartes et en créer de nouvelles
        await tx.card.deleteMany({
          where: { deckId: campaignScenario.game.monsterDeck.id }
        })

        if (body.game.monsterDeck.cardsList.length > 0) {
          await tx.card.createMany({
            data: body.game.monsterDeck.cardsList.map((card, index) => ({
              value: card.value,
              imagePath: card.imagePath,
              needShuffle: card.needShuffle,
              isTemporary: card.isTemporary || false,
              deckId: campaignScenario.game.monsterDeck.id,
              position: index
            }))
          })
        }

        // Mettre à jour les joueurs
        for (const player of body.game.players) {
          const campaignPlayer = campaign.players.find(p => p.name === player.name)
          if (campaignPlayer) {
            // Mettre à jour uniquement les coins et healthPointsMax (pas XP total)
            await tx.player.update({
              where: { id: campaignPlayer.id },
              data: {
                coins: player.coins,
                healthPointsMax: player.healthPointsMax
              }
            })

            // Vérifier si le playerGame existe déjà
            const existingPlayerGame = await tx.playerGame.findFirst({
              where: {
                gameId,
                playerId: campaignPlayer.id
              }
            })

            if (existingPlayerGame) {
              // Mettre à jour le playerGame existant avec HP et scenarioXp
              await tx.playerGame.update({
                where: { id: existingPlayerGame.id },
                data: {
                  healthPoints: player.healthPoints,
                  scenarioXp: player.scenarioXp || 0
                }
              })
            } else {
              // Créer un nouveau playerGame
              await tx.playerGame.create({
                data: {
                  healthPoints: player.healthPoints,
                  scenarioXp: player.scenarioXp || 0,
                  gameId,
                  playerId: campaignPlayer.id!
                }
              })
            }
          }
        }

        // Supprimer les anciens rounds et en créer de nouveaux
        await tx.round.deleteMany({
          where: { gameId }
        })

        if (body.game.rounds.length > 0) {
          await tx.round.createMany({
            data: body.game.rounds.map(round => ({
              roundNumber: round.roundNumber,
              dateTime: new Date(round.dateTime),
              gameId
            }))
          })
        }

        // Mettre à jour le gameState avec les éléments
        await tx.game.update({
          where: { id: gameId },
          data: {
            gameState: JSON.stringify({ elements: body.elements })
          }
        })

      } else {
        // 3b. Créer un nouveau jeu

        // Créer le deck monstre
        const monsterDeck = await tx.deck.create({
          data: {
            name: body.game.monsterDeck.name,
            isShuffled: body.game.monsterDeck.isShuffled,
            isShowingBackCard: body.game.monsterDeck.isShowingBackCard
          }
        })

        // Créer les cartes du deck monstre
        if (body.game.monsterDeck.cardsList.length > 0) {
          await tx.card.createMany({
            data: body.game.monsterDeck.cardsList.map((card, index) => ({
              value: card.value,
              imagePath: card.imagePath,
              needShuffle: card.needShuffle,
              isTemporary: card.isTemporary || false,
              deckId: monsterDeck.id!,
              position: index
            }))
          })
        }

        // Créer le jeu
        const game = await tx.game.create({
          data: {
            dateTimeStarted: new Date(),
            monsterDeckId: monsterDeck.id!,
            gameState: JSON.stringify({ elements: body.elements })
          }
        })

        gameId = game.id!

        // Créer les playerGames
        for (const player of body.game.players) {
          const campaignPlayer = campaign.players.find(p => p.name === player.name)
          if (campaignPlayer) {
            // Mettre à jour uniquement les coins et healthPointsMax (pas XP total)
            await tx.player.update({
              where: { id: campaignPlayer.id },
              data: {
                coins: player.coins,
                healthPointsMax: player.healthPointsMax
              }
            })

            // Créer le playerGame avec scenarioXp
            await tx.playerGame.create({
              data: {
                healthPoints: player.healthPoints,
                scenarioXp: player.scenarioXp || 0,
                gameId,
                playerId: campaignPlayer.id!
              }
            })
          }
        }

        // Créer les rounds
        if (body.game.rounds.length > 0) {
          await tx.round.createMany({
            data: body.game.rounds.map(round => ({
              roundNumber: round.roundNumber,
              dateTime: new Date(round.dateTime),
              gameId
            }))
          })
        }

        // Créer ou mettre à jour la relation CampaignScenario
        if (campaignScenario) {
          await tx.campaignScenario.update({
            where: { id: campaignScenario.id },
            data: { gameId }
          })
        } else {
          await tx.campaignScenario.create({
            data: {
              campaignId,
              scenarioId: body.scenarioId,
              isFinished: false,
              gameId
            }
          })
        }
      }

      // 4. Retourner la campagne mise à jour
      return await tx.campaign.findUnique({
        where: { id: campaignId },
        include: {
          players: true,
          campaignScenarios: {
            include: {
              scenario: true,
              game: {
                include: {
                  monsterDeck: {
                    include: {
                      cards: true
                    }
                  },
                  playerGames: true,
                  rounds: true
                }
              }
            }
          }
        }
      })
    })

    return result
  } catch (error: any) {
    console.error('Erreur lors de la sauvegarde du jeu:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erreur lors de la sauvegarde du jeu'
    })
  }
})
