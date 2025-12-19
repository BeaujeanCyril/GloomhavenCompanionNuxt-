// server/api/campaigns.get.ts
import prisma from '~/server/utils/db'

export default defineEventHandler(async () => {
    const campaigns = await prisma.campaign.findMany({
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
        },
    })

    return campaigns
})
