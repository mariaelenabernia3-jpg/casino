document.addEventListener('DOMContentLoaded', () => {
    
    const blackjackMusic = document.getElementById('blackjack-music');

    // Lógica para reproducir música con el consentimiento del usuario
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

    // Variables del juego
    let playerHand = [];
    let dealerHand = [];
    let playerCurrentBalance = 0; 
    let currentGameId = null; 

    // Elementos del DOM
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
    
    // CORRECCIÓN: Se asegura de que si el 'rank' no es un número, devuelva 0 para evitar NaN.
    function getCardValue(rank) {
        if (['J', 'Q', 'K'].includes(rank)) return 10;
        if (rank === 'A') return 11;
        return parseInt(rank, 10) || 0; // Si parseInt devuelve NaN, se convierte en 0
    }

    function calculateScore(hand) {
        let score = 0;
        let aceCount = 0;
        // Se añade una comprobación para asegurar que 'hand' es un array
        (hand || []).forEach(card => {
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

            // CORRECCIÓN: Se elimina la llamada a la función inexistente 'checkGameEndStatus'.
            // La lógica de Blackjack (21 a la primera) debe manejarse en el 'stand'.
            // Si el jugador tiene 21, puede plantarse para ganar.
            if (response.status === 'game_over' || calculateScore(playerHand) === 21) {
                stand(); // Si el backend ya lo considera terminado o es Blackjack, se planta automáticamente.
            } else {
                gameStatusEl.textContent = "¿Pedir o Plantarse?";
            }

        } catch (error) {
            console.error('Error al iniciar la partida de Blackjack:', error);
            alert(error.message || 'Error al iniciar la partida. Inténtalo de nuevo.');
            toggleControls(true); 
            gameStatusEl.textContent = 'Coloca tu apuesta';
        }
    }

    async function hit() { 
        if (!currentGameId) return;
        hitBtn.disabled = true; // Prevenir doble clic

        try {
            const response = await makeApiRequest('POST', '/games/blackjack/hit', { gameId: currentGameId });
            playerHand = response.playerHand;
            
            renderGame(false);
            
            // La API de 'hit' no finaliza el juego, solo la de 'stand'.
            // Si el jugador se pasa, el 'stand' confirmará la pérdida.
            if (calculateScore(playerHand) > 21) {
                stand(); // Se planta automáticamente para que el servidor confirme la derrota.
            } else {
                gameStatusEl.textContent = "¿Pedir o Plantarse?";
                hitBtn.disabled = false; // Habilitar de nuevo si el juego continúa
            }
        } catch (error) {
            console.error('Error al pedir carta:', error);
            alert(error.message || 'Error al pedir carta. Inténtalo de nuevo.');
            toggleControls(true);
            gameStatusEl.textContent = 'Coloca tu apuesta';
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
            playerCurrentBalance = response.newBalance;
            endGame(response); 
        } catch (error) {
            console.error('Error al plantarse:', error);
            alert(error.message || 'Error al plantarse. Inténtalo de nuevo.');
            toggleControls(true);
            gameStatusEl.textContent = 'Coloca tu apuesta';
        }
    }
        
    function endGame(apiResponse) {
        renderGame(true); // Muestra todas las cartas

        gameStatusEl.textContent = apiResponse.message;
        playerCurrentBalance = apiResponse.newBalance;
        
        setTimeout(() => {
            updateBalanceDisplay();
            toggleControls(true);
            gameStatusEl.textContent = 'Coloca tu apuesta';
            currentGameId = null; 
        }, 3000); // Aumentado para dar tiempo a leer el resultado
    }
    
    // CORRECCIÓN: Lógica mejorada para renderizar y calcular puntajes sin errores.
    function renderGame(revealDealerCard) {
        dealerCardsEl.innerHTML = '';
        playerCardsEl.innerHTML = '';

        (playerHand || []).forEach(card => renderCard(card, playerCardsEl, false));
        (dealerHand || []).forEach((card, index) => {
            renderCard(card, dealerCardsEl, index === 0 && !revealDealerCard);
        });
        
        playerScoreEl.textContent = calculateScore(playerHand);

        if(revealDealerCard) {
            dealerScoreEl.textContent = calculateScore(dealerHand);
        } else {
            // Calcula el valor solo de la carta visible del dealer (la segunda)
            if (dealerHand && dealerHand.length > 1 && dealerHand[1]) {
                dealerScoreEl.textContent = getCardValue(dealerHand[1].rank);
            } else {
                dealerScoreEl.textContent = 0; // Si no hay datos, muestra 0
            }
        }
    }

    // CORRECCIÓN: Renderiza la carta de forma más segura.
    function renderCard(card, element, isHidden) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        if (isHidden) {
            cardDiv.classList.add('hidden');
        } else {
            // Si la carta no tiene un rango válido (como '?'), muestra '??'
            const rank = card && card.rank ? card.rank : '??';
            const suit = card && card.suit ? card.suit : '';
            
            cardDiv.textContent = `${rank}${suit}`;

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

// MEJORA: Detiene la música si el usuario sale de la página
window.addEventListener('beforeunload', () => {
    const music = document.getElementById('blackjack-music');
    if (music) {
        music.pause();
        music.currentTime = 0; 
    }
});
