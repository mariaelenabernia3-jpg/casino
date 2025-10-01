document.addEventListener('DOMContentLoaded', () => {
    
    const COLORS = ['green', 'red', 'yellow', 'blue'];
    const BASE_FLASH_DURATION = 250;
    const MIN_FLASH_DURATION = 100;
    const SPEED_INCREMENT = 25;
    const PLAYER_TIME_LIMIT = 3000;
    const DELAY_BETWEEN_FLASHES = 50;

    let sequence = []; 
    let playerSequence = [];
    let level = 0;
    let gameActive = false;
    let playerTurn = false;
    let currentBet = 0;
    let playerTimerId = null;
    let currentGameId = null; 

    let playerCurrentBalance = 0; 

    const tiles = document.querySelectorAll('.memory-tile');
    const betAmountInput = document.getElementById('bet-amount');
    const startGameBtn = document.getElementById('start-game-btn');
    const cashoutBtn = document.getElementById('cashout-btn');
    const statusDisplay = document.getElementById('status-display');
    const levelDisplay = document.getElementById('level-display');
    const multiplierDisplay = document.getElementById('multiplier-display');
    const timerContainer = document.getElementById('timer-container');
    const timerBar = document.getElementById('timer-bar');

    async function initialize() { 
        const loadingScreen = document.getElementById('game-loading-screen');
        const gameContainer = document.getElementById('memory-game-main');

        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) {
            alert('Debes iniciar sesión para jugar.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const userData = await makeApiRequest('GET', '/user/profile');
            playerCurrentBalance = userData.coins; 
            
            setupEventListeners();
            updateInfoDisplays(); 

            loadingScreen.style.display = 'none';
            gameContainer.style.display = 'flex';

        } catch (error) {
            console.error('Error al cargar el perfil del usuario:', error);
            alert('Error al cargar datos del usuario. Inicia sesión de nuevo.');
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('loggedInUserUsername');
            window.location.href = 'login.html';
        }
    }

    function setupEventListeners() {
        startGameBtn.addEventListener('click', startGame);
        cashoutBtn.addEventListener('click', () => endGame(true)); 
        tiles.forEach(tile => {
            tile.addEventListener('click', () => handleTileClick(tile.dataset.color));
        });
    }

    async function startGame() { 
        currentBet = parseFloat(betAmountInput.value);
        if (isNaN(currentBet) || currentBet <= 0) {
            alert("Por favor, introduce una apuesta válida.");
            return;
        }
        if (currentBet > playerCurrentBalance) {
            alert("No tienes suficientes monedas para esa apuesta.");
            return;
        }

        try {
            const response = await makeApiRequest('POST', '/games/memory/start', { bet: currentBet });
            currentGameId = response.gameId;
            playerCurrentBalance = response.newBalance;
            sequence = response.nextSequence; 
            
            gameActive = true;
            level = 0; 
            toggleControls(false);
            setTimeout(nextLevel, 500); 

        } catch (error) {
            console.error('Error al iniciar la partida de Memoria:', error);
            alert(error.message || 'Error al iniciar la partida. Inténtalo de nuevo.');
        }
    }

    function nextLevel() { 
        stopPlayerTimer();
        playerSequence = [];
        playerTurn = false;
        level++;
        updateInfoDisplays();
        statusDisplay.textContent = 'Observa la secuencia...';
        tiles.forEach(tile => tile.classList.remove('clickable'));
        playSequence();
    }

    async function playSequence() {
        const currentSpeed = calculateSpeed();
        await new Promise(resolve => setTimeout(resolve, 300)); 

        for (const color of sequence) {
            await new Promise(resolve => {
                flashTile(color, currentSpeed);
                setTimeout(resolve, currentSpeed + DELAY_BETWEEN_FLASHES);
            });
        }
        
        playerTurn = true;
        statusDisplay.textContent = 'Tu turno...';
        tiles.forEach(tile => tile.classList.add('clickable'));
        startPlayerTimer();
    }

    // --- INICIO DE LA SECCIÓN CORREGIDA ---
    async function handleTileClick(color) { 
        if (!playerTurn || !gameActive) return;

        flashTile(color, 150);
        playerSequence.push(color);

        const lastIndex = playerSequence.length - 1;

        if (playerSequence[lastIndex] !== sequence[lastIndex]) {
            endGame(false); 
            return;
        }

        if (playerSequence.length === sequence.length) {
            playerTurn = false;
            stopPlayerTimer();
            statusDisplay.textContent = '¡Correcto! Cargando siguiente nivel...';
            tiles.forEach(tile => tile.classList.remove('clickable'));

            // Llama a la API para verificar la secuencia y obtener la siguiente
            try {
                const response = await makeApiRequest('POST', '/games/memory/guess', { 
                    gameId: currentGameId, 
                    playerSequence: playerSequence 
                });
                
                if (response.result === 'correct') {
                    sequence = response.nextSequence; 
                    setTimeout(nextLevel, 1000);
                } else {
                  
                    endGame(false); 
                }

            } catch (error) {
                console.error('Error al verificar la secuencia:', error);
                alert(error.message || 'Error al contactar con el servidor. Juego terminado.');
                endGame(false);
            }
        }
    }
 
    
    function startPlayerTimer() {
        timerBar.style.transition = 'none';
        timerBar.style.width = '100%';
        timerContainer.style.display = 'block';
        void timerBar.offsetWidth;
        timerBar.style.transition = `width ${PLAYER_TIME_LIMIT}ms linear`;
        timerBar.style.width = '0%';
        playerTimerId = setTimeout(() => {
            statusDisplay.textContent = '¡Se acabó el tiempo!';
            endGame(false);
        }, PLAYER_TIME_LIMIT);
    }

    function stopPlayerTimer() {
        clearTimeout(playerTimerId);
        timerContainer.style.display = 'none';
    }

    async function endGame(isCashout) { 
        if (!gameActive) return;
        gameActive = false;
        playerTurn = false;
        stopPlayerTimer();
        
        let message = '';
        if (isCashout && currentGameId && level > 1) {
            try {
                const response = await makeApiRequest('POST', '/games/memory/cashout', { gameId: currentGameId });
                playerCurrentBalance = response.newBalance;
                message = `¡Retirada exitosa! Ganaste ${response.payout.toFixed(0)} monedas.`;
            } catch (error) {
                console.error('Error al retirar ganancias:', error);
                message = error.message || 'Error al intentar retirar.';
            }
        } else if (isCashout) {
            message = "Debes completar al menos un nivel para retirar.";
        } else {
            message = `¡Incorrecto! Perdiste en el nivel ${level}.`;
        }
        
        statusDisplay.textContent = message;
        toggleControls(true);
        level = 0;
        currentGameId = null; 
        updateInfoDisplays();
    }
    
    function flashTile(color, duration) {
        const tile = document.querySelector(`.memory-tile[data-color="${color}"]`);
        tile.classList.add('active');
        setTimeout(() => {
            tile.classList.remove('active');
        }, duration);
    }

    function calculateSpeed() {
        return Math.max(MIN_FLASH_DURATION, BASE_FLASH_DURATION - (level * SPEED_INCREMENT));
    }

    function toggleControls(isBettingPhase) {
        betAmountInput.disabled = !isBettingPhase;
        startGameBtn.style.display = isBettingPhase ? 'block' : 'none';
        cashoutBtn.style.display = isBettingPhase ? 'none' : 'block';
        if (isBettingPhase) {
             statusDisplay.textContent = 'Coloca una apuesta para empezar';
        }
    }
    
    function updateInfoDisplays() {
        levelDisplay.textContent = level > 0 ? level : '-';
        const nextMultiplier = calculateMultiplier(level + 1);
        multiplierDisplay.textContent = gameActive ? `${nextMultiplier.toFixed(2)}x` : '-';

        if (gameActive && level > 0) {
            const currentMultiplier = calculateMultiplier(level);
            const currentProfit = currentBet * currentMultiplier;
            cashoutBtn.querySelector('span').textContent = (currentBet + currentProfit).toFixed(0);
        } else {
            cashoutBtn.querySelector('span').textContent = '0';
        }
    }
    
    function calculateMultiplier(currentLevel) {
        
        const completedLevels = currentLevel - 1;
        if (completedLevels <= 0) return 0;
        const multipliers = [0.10, 0.25, 0.50, 0.85, 1.25, 1.75, 2.5, 3.5, 5, 7.5];
        if(completedLevels <= multipliers.length){
            return multipliers[completedLevels-1];
        }
        return parseFloat((7.5 * Math.pow(1.35, completedLevels - 10)).toFixed(2));
    }

    initialize();
});

