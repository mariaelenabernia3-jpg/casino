document.addEventListener('DOMContentLoaded', () => {
    
    const blackjackMusic = document.getElementById('blackjack-music');

    if (localStorage.getItem('kruleAudioPermission') === 'true') {
        if (blackjackMusic) {
            blackjackMusic.play().catch(e => {
                console.warn("Autoplay bloqueado, se activará con el primer clic.", e);
                addFallbackClickListener();
            });
        }
        localStorage.removeItem('kruleAudioPermission');
    } else {
        addFallbackClickListener();
    }

    function addFallbackClickListener() {
        function playMusicOnFirstInteraction() {
            if (blackjackMusic && blackjackMusic.paused) {
                blackjackMusic.play().catch(e => console.error("Error al intentar reproducir música con clic.", e));
            }
        }
        document.addEventListener('click', playMusicOnFirstInteraction, { once: true });
    }

    let deck = [];
    let dealerHand = [];
    let playerHand = [];
    
    let loggedInUser = null;
    let users = [];
    let currentUser = null;

    const dealerScoreEl = document.getElementById('dealer-score');
    const playerScoreEl = document.getElementById('player-score');
    const dealerCardsEl = document.getElementById('dealer-cards');
    const playerCardsEl = document.getElementById('player-cards');
    const gameStatusEl = document.getElementById('game-status');
    const playerBalanceEl = document.getElementById('player-balance');
    
    const bettingControlsEl = document.getElementById('betting-controls');
    const gameControlsEl = document.getElementById('game-controls');
    
    const betAmountInput = document.getElementById('bet-amount');
    const dealBtn = document.getElementById('deal-btn');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');
    
    function initialize() {
        loggedInUser = localStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            alert('Debes iniciar sesión para jugar.');
            window.location.href = 'login.html';
            return;
        }
        users = JSON.parse(localStorage.getItem('kruleUsers')) || [];
        currentUser = users.find(user => user.username === loggedInUser);

        if (!currentUser) {
            alert('Error al cargar datos del usuario. Inicia sesión de nuevo.');
            window.location.href = 'login.html';
            return;
        }
        updateBalanceDisplay();
        setupEventListeners();
    }

    function setupEventListeners() {
        dealBtn.addEventListener('click', startNewGame);
        hitBtn.addEventListener('click', hit);
        standBtn.addEventListener('click', stand);
    }

    function createDeck() {
        const suits = ['♥', '♦', '♣', '♠'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push({ suit, rank });
            }
        }
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    function getCardValue(rank) {
        if (['J', 'Q', 'K'].includes(rank)) return 10;
        if (rank === 'A') return 11;
        return parseInt(rank);
    }

    function calculateScore(hand) {
        let score = 0;
        let aceCount = 0;
        hand.forEach(card => {
            score += getCardValue(card.rank);
            if (card.rank === 'A') {
                aceCount++;
            }
        });
        while (score > 21 && aceCount > 0) {
            score -= 10;
            aceCount--;
        }
        return score;
    }

    function startNewGame() {
        const currentBet = parseInt(betAmountInput.value);
        if (isNaN(currentBet) || currentBet <= 0) {
            alert("Por favor, introduce una apuesta válida.");
            return;
        }
        if (currentBet > currentUser.coins) {
            alert("No tienes suficientes monedas para esa apuesta.");
            return;
        }

        toggleControls(false);
        dealerHand = [];
        playerHand = [];
        dealerCardsEl.innerHTML = '';
        playerCardsEl.innerHTML = '';
        gameStatusEl.textContent = 'Repartiendo...';
        
        currentUser.coins -= currentBet;
        updateUserData();
        updateBalanceDisplay();

        createDeck();
        shuffleDeck();
        
        playerHand.push(deck.pop());
        dealerHand.push(deck.pop());
        playerHand.push(deck.pop());
        dealerHand.push(deck.pop());

        renderGame(false);

        
        const playerScore = calculateScore(playerHand);
        if (playerScore === 21) {
            gameStatusEl.textContent = "¡BLACKJACK!";
            
            setTimeout(() => endGame(currentBet, true), 1000); 
        } else {
            gameStatusEl.textContent = "¿Pedir o Plantarse?";
        }
    }

    function hit() {
        playerHand.push(deck.pop());
        renderGame(false);

        if (calculateScore(playerHand) > 21) {
           
            hitBtn.disabled = true;
            standBtn.disabled = true;
            // ---------------------------
            const currentBet = parseInt(betAmountInput.value);
            endGame(currentBet);
        }
    }

    function stand() {
        const currentBet = parseInt(betAmountInput.value);
        hitBtn.disabled = true;
        standBtn.disabled = true;
        dealerTurn(currentBet);
    }
    
    function dealerTurn(currentBet) {
        renderGame(true);

        const dealerInterval = setInterval(() => {
            if (calculateScore(dealerHand) < 17) {
                dealerHand.push(deck.pop());
                renderGame(true);
            } else {
                clearInterval(dealerInterval);
                endGame(currentBet);
            }
        }, 1000);
    }

    function endGame(bet, playerHasBlackjack = false) {
        renderGame(true); 

        const playerScore = calculateScore(playerHand);
        const dealerScore = calculateScore(dealerHand);
        
        let message = "";
        let payout = 0;

        if (playerHasBlackjack && dealerScore !== 21) {
            message = "¡BLACKJACK! ¡Ganas!";
            payout = bet * 2.5; 
        } else if (playerScore > 21) {
            message = "¡Te pasaste! Pierdes.";
            payout = 0;
        } else if (dealerScore > 21) {
            message = "¡El Dealer se pasó! ¡Ganas!";
            payout = bet * 2;
        } else if (playerHasBlackjack && dealerScore === 21) {
             message = "¡Empate! Ambos tienen Blackjack.";
             payout = bet;
        } else if (playerScore > dealerScore) {
            message = "¡Ganas!";
            payout = bet * 2;
        } else if (playerScore < dealerScore) {
            message = "El Dealer gana.";
            payout = 0;
        } else {
            message = "¡Empate!";
            payout = bet;
        }
        
        gameStatusEl.textContent = message;
        if(payout > 0) {
            currentUser.coins += payout;
            updateUserData();
        }
        
        setTimeout(() => {
            updateBalanceDisplay();
            toggleControls(true);
        }, 1500);
    }
    
    function renderGame(revealDealerCard) {
        dealerCardsEl.innerHTML = '';
        playerCardsEl.innerHTML = '';

        playerHand.forEach(card => renderCard(card, playerCardsEl, false));
        dealerHand.forEach((card, index) => {
            renderCard(card, dealerCardsEl, index === 0 && !revealDealerCard);
        });
        
        playerScoreEl.textContent = calculateScore(playerHand);
        if(revealDealerCard) {
            dealerScoreEl.textContent = calculateScore(dealerHand);
        } else {
            dealerScoreEl.textContent = getCardValue(dealerHand[1].rank);
        }
    }

    function renderCard(card, element, isHidden) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        if (isHidden) {
            cardDiv.classList.add('hidden');
        } else {
            cardDiv.textContent = `${card.rank}${card.suit}`;
            if (['♥', '♦'].includes(card.suit)) {
                cardDiv.classList.add('red');
            } else {
                cardDiv.classList.add('black');
            }
        }
        element.appendChild(cardDiv);
    }
    
    function toggleControls(showBetting) {
        if (showBetting) {
            bettingControlsEl.style.display = 'flex';
            gameControlsEl.style.display = 'none';
        } else {
            bettingControlsEl.style.display = 'none';
            gameControlsEl.style.display = 'flex';
            hitBtn.disabled = false;
            standBtn.disabled = false;
        }
    }

    function updateBalanceDisplay() {
        playerBalanceEl.textContent = currentUser.coins;
    }
    
    function updateUserData() {
        const userIndex = users.findIndex(user => user.username === loggedInUser);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('kruleUsers', JSON.stringify(users));
        }
    }

    initialize();
});
