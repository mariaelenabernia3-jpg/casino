document.addEventListener('DOMContentLoaded', () => {
  
    const HOUSE_EDGE = 1.00; 
    const ANIMATION_DURATION_MS = 2000;
    const ANIMATION_REVEAL_MS = 500;
    const MIN_BET = 1;
    const HISTORY_LENGTH = 10;document.addEventListener('DOMContentLoaded', () => {
    
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

            const playerScore = calculateScore(playerHand);
            if (playerScore === 21) {
                gameStatusEl.textContent = "¡BLACKJACK!";
              
                setTimeout(() => checkGameEndStatus(response), 1000);
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

        try {
            const response = await makeApiRequest('POST', '/games/blackjack/hit', { gameId: currentGameId });
            playerHand = response.playerHand;
            
            renderGame(false);
            playerScoreEl.textContent = calculateScore(playerHand);

            if (response.status === 'player_bust') {
                gameStatusEl.textContent = "¡Te pasaste! Pierdes.";
                playerCurrentBalance = response.newBalance;
                endGame(response); 
            } else if (response.status === 'game_over') { 
                endGame(response);
            } else {
                gameStatusEl.textContent = "¿Pedir o Plantarse?";
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
        renderGame(true); 

        gameStatusEl.textContent = apiResponse.message;
        playerCurrentBalance = apiResponse.newBalance;
        
        setTimeout(() => {
            updateBalanceDisplay();
            toggleControls(true);
            currentGameId = null; 
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
        playerBalanceEl.textContent = playerCurrentBalance;
    }
    
    initialize();
});

    const resultBall = document.getElementById('result-ball');
    const betAmountInput = document.getElementById('bet-amount');
    const profitOnWinDisplay = document.getElementById('profit-on-win');
    const chanceSlider = document.getElementById('chance-slider');
    const multiplierDisplay = document.getElementById('multiplier-display');
    const rollConditionLabel = document.getElementById('roll-condition-label');
    const rollValueDisplay = document.getElementById('roll-value-display');
    const winChanceDisplay = document.getElementById('win-chance-display');
    const rollUnderBtn = document.getElementById('roll-under-btn');
    const rollOverBtn = document.getElementById('roll-over-btn');
    const rollDiceBtn = document.getElementById('roll-dice-btn');
    const rollResultDisplay = document.getElementById('roll-result');
    const historyList = document.getElementById('history-list');

    
    let playerCurrentBalance = 0; 
    let betMode = 'under';

    function addToHistory(roll, isWin) {
        const item = document.createElement('div');
        item.className = `history-item ${isWin ? 'win' : 'loss'}`;
        item.textContent = roll.toFixed(2);
        historyList.prepend(item);
        if (historyList.children.length > HISTORY_LENGTH) {
            historyList.lastChild.remove();
        }
    }

    function updateUI() {
        const sliderValue = parseInt(chanceSlider.value, 10);
        let rollValue;

        if (betMode === 'under') {
            rollValue = sliderValue;
            rollConditionLabel.textContent = 'Sacar Menos De';
        } else {
            rollValue = 100 - sliderValue;
            rollConditionLabel.textContent = 'Sacar Más De';
        }

        const effectiveWinChance = (betMode === 'under') ? rollValue : (100 - rollValue);
        let multiplier = 0;
        if (effectiveWinChance > 0 && effectiveWinChance < 100) {
            multiplier = (100 / effectiveWinChance) * HOUSE_EDGE;
        }
        
        const betAmount = parseFloat(betAmountInput.value) || 0;
        
        const potentialProfit = betAmount * (multiplier - 1);
        const profit = Math.floor(Math.max(0, potentialProfit));

        rollValueDisplay.textContent = rollValue.toFixed(2);
        winChanceDisplay.textContent = `${effectiveWinChance.toFixed(2)}%`;
        multiplierDisplay.textContent = `${multiplier.toFixed(2)}x`;
        profitOnWinDisplay.textContent = profit.toFixed(0); 
    }

    async function rollDice() { 
        const betAmount = parseFloat(betAmountInput.value);
        if (isNaN(betAmount) || betAmount < MIN_BET) { alert(`La apuesta mínima es ${MIN_BET}.`); return; }
        if (betAmount > playerCurrentBalance) { alert('No tienes suficientes monedas para esa apuesta.'); return; }

        rollDiceBtn.disabled = true;
        chanceSlider.disabled = true;
        rollUnderBtn.disabled = true;
        rollOverBtn.disabled = true;
        resultBall.classList.remove('win', 'loss');
        rollResultDisplay.classList.remove('win', 'loss');
        rollResultDisplay.textContent = '...';
        
        resultBall.style.transition = 'none';
        resultBall.style.left = '50%'; 
        void resultBall.offsetWidth; 

        try {

            const target = parseInt(chanceSlider.value, 10);
            const response = await makeApiRequest('POST', '/games/dice/roll', {
                bet: betAmount,
                mode: betMode,
                target: target
            });

            const rollResult = response.rollResult;
            const isWin = response.isWin;
            playerCurrentBalance = response.newBalance; 

            const animationSpeed = (ANIMATION_DURATION_MS + ANIMATION_REVEAL_MS) / 1000;
            resultBall.style.transition = `left ${animationSpeed}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            resultBall.style.left = `${rollResult}%`;
            resultBall.classList.add(isWin ? 'win' : 'loss');

            rollResultDisplay.textContent = rollResult.toFixed(2);
            rollResultDisplay.classList.add(isWin ? 'win' : 'loss');
            
            addToHistory(rollResult, isWin);
            updateBalanceDisplay(); 

            setTimeout(() => {
                rollDiceBtn.disabled = false;
                chanceSlider.disabled = false;
                rollUnderBtn.disabled = false;
                rollOverBtn.disabled = false;
            }, ANIMATION_REVEAL_MS);

        } catch (error) {
            console.error('Error al lanzar dados:', error);
            alert(error.message || 'Error al lanzar dados. Inténtalo de nuevo.');
            rollDiceBtn.disabled = false;
            chanceSlider.disabled = false;
            rollUnderBtn.disabled = false;
            rollOverBtn.disabled = false;
            rollResultDisplay.textContent = '00.00'; 
        }
    }
    
    function setupEventListeners() {
        chanceSlider.addEventListener('input', updateUI);
        betAmountInput.addEventListener('input', updateUI);
        rollUnderBtn.addEventListener('click', () => { betMode = 'under'; rollUnderBtn.classList.add('active'); rollOverBtn.classList.remove('active'); updateUI(); });
        rollOverBtn.addEventListener('click', () => { betMode = 'over'; rollOverBtn.classList.add('active'); rollUnderBtn.classList.remove('active'); updateUI(); });
        rollDiceBtn.addEventListener('click', rollDice);
    }

    async function initialize() { 
        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) { alert('Debes iniciar sesión para jugar.'); window.location.href = 'login.html'; return; }
        
        try {
            const userData = await makeApiRequest('GET', '/user/profile');
            playerCurrentBalance = userData.coins;
            
            updateUI(); 
            setupEventListeners();
        } catch (error) {
            console.error('Error al cargar el perfil del usuario:', error);
            alert('Error al cargar los datos del usuario. Inicia sesión de nuevo.');
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('loggedInUserUsername');
            window.location.href = 'login.html';
        }
    }

    initialize();
});

