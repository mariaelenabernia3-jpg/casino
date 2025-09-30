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

    
    let dealerHand = [];
    let playerHand = [];
    let playerCurrentBalance = 0; 
    let currentGameId = null; 

    
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
    
    async function initialize() { 
        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) {
            alert('Debes iniciar sesión para jugar.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const userData = await makeApiRequest('GET', '/user/profile');
            playerCurrentBalance = userData.coins;
            updateBalanceDisplay();
            setupEventListeners();
        } catch (error) {
            console.error('Error al cargar el perfil del usuario:', error);
            alert('Error al cargar datos del usuario. Inicia sesión de nuevo.');
            window.location.href = 'login.html';
        }
    }

    function setupEventListeners() {
        dealBtn.addEventListener('click', startNewGame);
        hitBtn.addEventListener('click', hit);
        standBtn.addEventListener('click', stand);
    }
    
    function getCardValue(rank) {
        if (typeof rank !== 'string' && typeof rank !== 'number') return 0;
        const rankStr = String(rank);
        if (['J', 'Q', 'K'].includes(rankStr)) return 10;
        if (rankStr === 'A') return 11;
        const num = parseInt(rankStr);
        return isNaN(num) ? 0 : num;
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

    async function startNewGame() { 
        const currentBet = parseInt(betAmountInput.value);
        if (isNaN(currentBet) || currentBet <= 0) {
            alert("Por favor, introduce una apuesta válida.");
            return;
        }
        if (currentBet > playerCurrentBalance) {
            alert("No tienes suficientes monedas para esa apuesta.");
            return;
        }

        toggleControls(false);
        gameStatusEl.textContent = 'Repartiendo...';
        
        try {
            const response = await makeApiRequest('POST', '/games/blackjack/deal', { bet: currentBet });
            
            currentGameId = response.gameId;
            playerHand = response.playerHand;
            dealerHand = response.dealerHand;
            playerCurrentBalance = response.newBalance; 
            updateBalanceDisplay();
            renderGame(false); 

            if (response.status === 'game_over') {
                gameStatusEl.textContent = "¡BLACKJACK!";
                setTimeout(() => endGame(response), 1500);
            } else {
                gameStatusEl.textContent = "¿Pedir o Plantarse?";
            }

        } catch (error) {
            console.error('Error al iniciar la partida:', error);
            alert(error.message || 'Error al iniciar la partida.');
            toggleControls(true); 
            gameStatusEl.textContent = 'Coloca tu apuesta';
        }
    }

    async function hit() { 
        if (!currentGameId) return;
        hitBtn.disabled = true;

        try {
            const response = await makeApiRequest('POST', '/games/blackjack/hit', { gameId: currentGameId });
            playerHand = response.playerHand;
            renderGame(false);

            if (response.status === 'player_bust' || response.status === 'game_over') {
                endGame(response); 
            } else {
                gameStatusEl.textContent = "¿Pedir o Plantarse?";
                hitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Error al pedir carta:', error);
            alert(error.message || 'Error al pedir carta.');
            toggleControls(true);
        }
    }

    async function stand() { 
        if (!currentGameId) return;
        hitBtn.disabled = true;
        standBtn.disabled = true;
        gameStatusEl.textContent = 'El Dealer está jugando...';

        try {
            const response = await makeApiRequest('POST', '/games/blackjack/stand', { gameId: currentGameId });
            dealerHand = response.dealerHand; 
            endGame(response); 
        } catch (error) {
            console.error('Error al plantarse:', error);
            alert(error.message || 'Error al plantarse.');
            toggleControls(true);
        }
    }
        
    function endGame(apiResponse) {
        playerCurrentBalance = apiResponse.newBalance;
        renderGame(true);
        gameStatusEl.textContent = apiResponse.message;
        
        setTimeout(() => {
            updateBalanceDisplay();
            toggleControls(true);
            gameStatusEl.textContent = 'Coloca tu apuesta';
            currentGameId = null; 
        }, 2500);
    }
    
    
    function renderGame(revealDealerCard) {
        dealerCardsEl.innerHTML = '';
        playerCardsEl.innerHTML = '';

        playerHand.forEach(card => renderCard(card, playerCardsEl, false));
        dealerHand.forEach((card, index) => {
            
            renderCard(card, dealerCardsEl, index === 0 && !revealDealerCard);
        });
        
        playerScoreEl.textContent = calculateScore(playerHand);

        if (revealDealerCard) {
            dealerScoreEl.textContent = calculateScore(dealerHand);
        } else {
            
            if (dealerHand && dealerHand.length > 1 && dealerHand[1]) {
                dealerScoreEl.textContent = getCardValue(dealerHand[1].rank);
            } else {
                dealerScoreEl.textContent = 0; 
            }
        }
    }

    function renderCard(card, element, isHidden) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        if (isHidden) {
            cardDiv.classList.add('hidden');
        } else if (!card || !card.rank || card.rank === '??') {
            
            cardDiv.textContent = '??';
        } else {
            
            const suit = card.suit;
            cardDiv.innerHTML = `<span class="rank">${card.rank}</span><span class="suit">${suit}</span>`;
            if (['♥', '♦'].includes(suit)) {
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
        playerBalanceEl.textContent = playerCurrentBalance;
    }
    
    initialize();
});
