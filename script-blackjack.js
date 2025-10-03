document.addEventListener('DOMContentLoaded', () => {

    const API_BASE_URL = 'https://casino-api-rose.vercel.app';

    async function makeApiRequest(method, endpoint, body = null) {
        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) {
            alert('Sesión no encontrada. Por favor, inicia sesión.');
            window.location.href = 'login.html';
            throw new Error('No se encontró el token de autenticación.');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
        };

        const config = { method, headers };
        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.message || `Error HTTP: ${response.status}`);
        }
        return responseData;
    }

    // --- Variables de estado del juego ---
    let playerBalance = 0;
    let currentGame = null; // Almacenará el estado del juego actual (ID, manos, etc.)

    // --- Referencias a elementos del DOM ---
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
        try {
            const userData = await makeApiRequest('GET', '/api/user/profile');
            playerBalance = userData.coins;
            updateBalanceDisplay();
            setupEventListeners();
        } catch (error) {
            console.error('Error al inicializar Blackjack:', error);
            alert(error.message || 'Error al cargar el juego. Serás redirigido al login.');
            window.location.href = 'login.html';
        }
    }

    function setupEventListeners() {
        dealBtn.addEventListener('click', startNewGame);
        hitBtn.addEventListener('click', hit);
        standBtn.addEventListener('click', stand);
    }

    async function startNewGame() {
        const bet = parseInt(betAmountInput.value);
        if (isNaN(bet) || bet <= 0) {
            gameStatusEl.textContent = "Introduce una apuesta válida.";
            return;
        }
        if (bet > playerBalance) {
            gameStatusEl.textContent = "No tienes suficientes monedas.";
            return;
        }

        dealBtn.disabled = true;
        gameStatusEl.textContent = 'Repartiendo...';

        try {
            const response = await makeApiRequest('POST', '/api/games/blackjack/deal', { bet });
            
            currentGame = response; // Guardamos todo el estado del juego
            playerBalance = response.newBalance;

            updateBalanceDisplay();
            renderHands(response.playerHand, response.dealerHand, response.playerScore, '?', false);
            
            toggleControls(false); // Mostrar botones de hit/stand

            // Comprobar si hay Blackjack inicial
            if (response.playerScore === 21) {
                gameStatusEl.textContent = "¡BLACKJACK!";
                await stand(); // Si el jugador tiene blackjack, se planta automáticamente
            } else {
                gameStatusEl.textContent = "¿Pedir o Plantarse?";
            }

        } catch (error) {
            gameStatusEl.textContent = error.message || "Error al iniciar la partida.";
            dealBtn.disabled = false;
        }
    }

    async function hit() {
        if (!currentGame) return;

        hitBtn.disabled = true;
        standBtn.disabled = true;

        try {
            const response = await makeApiRequest('POST', '/api/games/blackjack/hit', { gameId: currentGame.gameId });
            
            currentGame.playerHand = response.playerHand;
            currentGame.playerScore = response.playerScore;
            
            renderHands(currentGame.playerHand, currentGame.dealerHand, currentGame.playerScore, '?', false);
            
            if (response.gameState === 'game_over') {
                // El jugador se pasó (bust)
                gameStatusEl.textContent = response.message;
                endGame();
            } else {
                // El juego continúa
                hitBtn.disabled = false;
                standBtn.disabled = false;
            }
        } catch (error) {
            gameStatusEl.textContent = error.message || "Error al pedir carta.";
            hitBtn.disabled = false;
            standBtn.disabled = false;
        }
    }

    async function stand() {
        if (!currentGame) return;
        
        hitBtn.disabled = true;
        standBtn.disabled = true;
        gameStatusEl.textContent = 'El Dealer está jugando...';

        try {
            const response = await makeApiRequest('POST', '/api/games/blackjack/stand', { gameId: currentGame.gameId });
            
            playerBalance = response.newBalance;
            gameStatusEl.textContent = response.message;
            
            renderHands(response.playerHand, response.dealerHand, response.playerScore, response.dealerScore, true);
            endGame();

        } catch (error) {
            gameStatusEl.textContent = error.message || "Error al plantarse.";
            // Si hay un error, volvemos a la pantalla de apuesta
            endGame();
        }
    }

    function endGame() {
        currentGame = null; // Limpiamos el estado del juego
        setTimeout(() => {
            updateBalanceDisplay();
            toggleControls(true); // Mostrar controles de apuesta
            dealBtn.disabled = false;
            gameStatusEl.textContent = 'Coloca tu apuesta para la siguiente ronda.';
        }, 2500); // Espera para que el jugador vea el resultado
    }

    function renderHands(pHand, dHand, pScore, dScore, revealDealerCard) {
        playerCardsEl.innerHTML = '';
        dealerCardsEl.innerHTML = '';
        
        pHand.forEach(card => renderCard(card, playerCardsEl));
        dHand.forEach((card, index) => {
            const isHidden = index === 1 && !revealDealerCard;
            renderCard(card, dealerCardsEl, isHidden);
        });

        playerScoreEl.textContent = pScore;
        dealerScoreEl.textContent = dScore;
    }

    function renderCard(card, element, isHidden = false) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        if (isHidden) {
            cardDiv.classList.add('hidden');
        } else {
            cardDiv.textContent = `${card.rank}${card.suit}`;
            if (['♥', '♦'].includes(card.suit)) {
                cardDiv.classList.add('red');
            }
        }
        element.appendChild(cardDiv);
    }
    
    function toggleControls(showBetting) {
        bettingControlsEl.style.display = showBetting ? 'flex' : 'none';
        gameControlsEl.style.display = showBetting ? 'none' : 'flex';
        if (!showBetting) {
            hitBtn.disabled = false;
            standBtn.disabled = false;
        }
    }

    function updateBalanceDisplay() {
        playerBalanceEl.textContent = playerBalance;
    }

    initialize();
});
