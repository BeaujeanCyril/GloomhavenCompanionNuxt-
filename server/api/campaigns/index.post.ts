// server/api/campaigns/index.post.ts
import prisma from '~/server/utils/db'
import type { CreateCampaignInput } from '~/types'

export default defineEventHandler(async (event) => {
    const body = await readBody<CreateCampaignInput>(event)

    // Validation des données
    if (!body.companyName || body.companyName.trim() === '') {
        throw createError({
            statusCode: 400,
            statusMessage: 'Le nom de la compagnie est requis'
        })
    }

    // Validation des joueurs si fournis
    if (body.players && body.players.length > 0) {
        for (const player of body.players) {
            if (!player.name || player.name.trim() === '') {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Le nom du joueur est requis'
                })
            }
            if (!player.healthPointsMax || player.healthPointsMax <= 0) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Les points de vie maximum doivent être supérieurs à 0'
                })
            }
        }
    }

    // Création de la campagne avec les joueurs
    const campaign = await prisma.campaign.create({
        data: {
            companyName: body.companyName,
            players: body.players && body.players.length > 0 ? {
                create: body.players.map(player => ({
                    name: player.name,
                    healthPointsMax: player.healthPointsMax,
                    coins: player.coins ?? 0,
                    xp: player.xp ?? 0
                }))
            } : undefined
        },
        include: {
            players: true,
            campaignScenarios: {
                include: {
                    scenario: true
                }
            }
        }
    })

    return campaign
})
