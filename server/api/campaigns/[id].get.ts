// server/api/campaigns/[id].get.ts
import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
    const params = getRouterParams(event)
    const idParam = params.id
    console.log('idParam =', idParam)

    const id = Number(idParam)

    if (!idParam || Number.isNaN(id)) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Invalid or missing id',
        })
    }

    const campaign = await prisma.campaign.findUnique({
        where: { id },
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

    // Cas "rien en DB" pour cet id
    if (!campaign) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Campaign not found',
        })
    }

    return campaign
})
