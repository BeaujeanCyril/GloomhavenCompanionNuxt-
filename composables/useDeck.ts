// composables/useDeck.ts
import type { Deck, Card } from '~/types'

export const useDeck = () => {
    const initializeDeckCards = (deck: Deck) => {
        for (let number = 1; number <= 20; number++) {
            const needShuffle = number === 19 || number === 20
            const imagePath = `/img/DeckModifier/Monsters/gh-am-m-${number.toString().padStart(2, '0')}.png`

            deck.cardsList.push({
                id: number,
                value: `Card ${number}`,
                imagePath,
                needShuffle,
                isTemporary: false
            })
        }
        shuffleDeck(deck)
    }

    const shuffleDeck = (deck: Deck) => {
        for (let i = deck.cardsList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck.cardsList[i], deck.cardsList[j]] = [deck.cardsList[j], deck.cardsList[i]]
        }
    }

    const generateUniqueId = (deck: Deck): number => {
        return deck.cardsList.length > 0
            ? Math.max(...deck.cardsList.map(c => c.id)) + 1
            : 1
    }

    const addAnnulCard = (deck: Deck) => {
        const annulCard: Card = {
            id: generateUniqueId(deck),
            value: 'Annulé',
            needShuffle: false,
            imagePath: '/img/DeckModifier/Monsters/gh-am-mm-01.png',
            isTemporary: true
        }

        deck.cardsList.push(annulCard)
        shuffleDeck(deck)
    }

    const addX2Card = (deck: Deck) => {
        const x2Card: Card = {
            id: generateUniqueId(deck),
            value: 'x2',
            needShuffle: false,
            imagePath: '/img/DeckModifier/Monsters/BenedictionCard.png',
            isTemporary: true
        }

        deck.cardsList.push(x2Card)
        shuffleDeck(deck)
    }

    const removeAnnulCard = (deck: Deck) => {
        // Chercher la première carte "Annulé" temporaire dans le deck
        const annulCardIndex = deck.cardsList.findIndex(card =>
            card.imagePath === '/img/DeckModifier/Monsters/gh-am-mm-01.png' && card.isTemporary
        )

        if (annulCardIndex !== -1) {
            deck.cardsList.splice(annulCardIndex, 1)
            shuffleDeck(deck)
            return true
        }
        return false
    }

    const showAndMoveFirstCardToEnd = (deck: Deck): string => {
        if (deck.cardsList.length === 0) {
            return 'Le deck est vide.'
        }

        const firstCard = deck.cardsList[0]
        deck.cardsHistoric.push(firstCard)
        deck.cardsList.shift()

        if (!firstCard.isTemporary) {
            deck.cardsList.push(firstCard)
        }

        return firstCard.value
    }

    return {
        initializeDeckCards,
        shuffleDeck,
        addAnnulCard,
        removeAnnulCard,
        addX2Card,
        showAndMoveFirstCardToEnd
    }
}