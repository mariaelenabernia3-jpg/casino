document.addEventListener('DOMContentLoaded', () => {
    // --- Constantes y Estado del Juego ---
    const COLORS = ['green', 'red', 'yellow', 'blue'];
    // --- NUEVO: Constantes de Dificultad ---
    const BASE_FLASH_DURATION = 400; // Velocidad inicial
    const MIN_FLASH_DURATION = 150;  // Velocidad máxima
    const SPEED_INCREMENT = 15;      // Cuánto más rápido por nivel (en ms)
    const PLAYER_TIME_LIMIT = 5000;  // 5 segundos para responder

    let sequence = [];
    let playerSequence = [];
    let level = 0;
    let gameActive = false;
    let playerTurn = false;
    let currentBet = 0;
    let playerTimerId = null; // Para el temporizador

    // --- Datos de Usuario (sin cambios) ---
    let loggedInUser = null;
    let users = [];
    let currentUser = null;

    // --- Elementos del DOM ---
    const tiles = document.querySelectorAll('.memory-tile');
    const betAmountInput = document.getElementById('bet-amount');
    const startGameBtn = document.getElementById('start-game-btn');
    const cashoutBtn = document.getElementById('cashout-btn');
    const statusDisplay = document.getElementById('status-display');
    const levelDisplay = document.getElementById('level-display');
    const multiplierDisplay = document.getElementById('multiplier-display');
    // --- NUEVO: Elementos del Temporizador ---
    const timerContainer = document.getElementById('timer-container');
    const timerBar = document.getElementById('timer-bar');

    // --- Inicialización (sin cambios) ---
    function initialize() {
        loggedInUser = localStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            alert('Debes iniciar sesión para jugar.');
            window.location.href = 'login.html';
            return;
        }
        users = JSON.parse(localStorage.getItem('kruleUsers')) || [];
        currentUser = users.find(user => user.username === loggedInUser);
        if (!currentUser) { alert('Error al cargar datos del usuario.'); window.location.href = 'login.html'; return; }
        
        setupEventListeners();
        updateInfoDisplays();
    }

    function setupEventListeners() {
        startGameBtn.addEventListener('click', startGame);
        cashoutBtn.addEventListener('click', () => endGame(true));
        tiles.forEach(tile => {
            tile.addEventListener('click', () => handleTileClick(tile.dataset.color));
        });
    }

    // --- Flujo del Juego ---
    function startGame() {
        currentBet = parseFloat(betAmountInput.value);
        if (isNaN(currentBet) || currentBet <= 0 || currentBet > currentUser.coins) {
            alert("Apuesta inválida o fondos insuficientes.");
            return;
        }
        currentUser.coins -= currentBet;
        updateUserData();
        gameActive = true;
        level = 0;
        sequence = [];
        toggleControls(false);
        setTimeout(nextLevel, 500);
    }

    function nextLevel() {
        stopPlayerTimer(); // Detener cualquier temporizador anterior
        playerSequence = [];
        playerTurn = false;
        level++;
        updateInfoDisplays();
        statusDisplay.textContent = 'Observa la secuencia...';
        tiles.forEach(tile => tile.classList.remove('clickable'));
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        sequence.push(randomColor);
        playSequence();
    }

    function playSequence() {
        const currentSpeed = calculateSpeed();
        let i = 0;
        const intervalId = setInterval(() => {
            if (i >= sequence.length) {
                clearInterval(intervalId);
                playerTurn = true;
                statusDisplay.textContent = 'Tu turno...';
                tiles.forEach(tile => tile.classList.add('clickable'));
                startPlayerTimer(); // Iniciar temporizador del jugador
                return;
            }
            flashTile(sequence[i], currentSpeed);
            i++;
        }, currentSpeed + 100); // El delay entre flashes también depende de la velocidad
    }

    function handleTileClick(color) {
        if (!playerTurn) return;

        flashTile(color, 150); // Flash rápido al hacer clic
        playerSequence.push(color);

        const lastIndex = playerSequence.length - 1;
        if (playerSequence[lastIndex] !== sequence[lastIndex]) {
            endGame(false); // Error
            return;
        }

        if (playerSequence.length === sequence.length) {
            playerTurn = false;
            stopPlayerTimer();
            setTimeout(nextLevel, 1000);
        }
    }
    
    // --- NUEVO: Lógica del Temporizador ---
    function startPlayerTimer() {
        timerBar.style.transition = 'none';
        timerBar.style.width = '100%';
        timerContainer.style.display = 'block';

        // Forzar un reflujo para que la transición se aplique
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

    function endGame(isWin) {
        gameActive = false;
        playerTurn = false;
        stopPlayerTimer();
        let profit = 0;

        if (isWin && level > 1) {
            const multiplier = calculateMultiplier(level - 1);
            profit = currentBet * multiplier;
            currentUser.coins += profit;
            statusDisplay.textContent = `¡Ganaste ${profit.toFixed(2)} monedas!`;
        } else if (isWin && level === 1) {
            statusDisplay.textContent = 'Retirada. Apuesta devuelta.';
            currentUser.coins += currentBet; 
        } else {
            statusDisplay.textContent = '¡Incorrecto! Perdiste tu apuesta.';
        }
        
        updateUserData();
        toggleControls(true);
        level = 0;
        updateInfoDisplays();
    }
    
    // --- Funciones de UI y Lógica ---
    function flashTile(color, duration) {
        const tile = document.querySelector(`.memory-tile[data-color="${color}"]`);
        tile.classList.add('active');
        setTimeout(() => {
            tile.classList.remove('active');
        }, duration);
    }

    // --- NUEVO: Cálculo de Velocidad Dinámica ---
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
        const nextMultiplier = calculateMultiplier(level);
        multiplierDisplay.textContent = gameActive ? `${nextMultiplier.toFixed(2)}x` : '-';
        if (gameActive && level > 0) {
            const currentMultiplier = calculateMultiplier(level - 1);
            const currentProfit = currentBet * currentMultiplier;
            cashoutBtn.querySelector('span').textContent = currentProfit.toFixed(2);
        }
    }
    
    function calculateMultiplier(completedLevels) {
        if (completedLevels <= 0) return 0;
        return parseFloat(Math.pow(1.35, completedLevels).toFixed(2));
    }

    function updateUserData() {
        const userIndex = users.findIndex(u => u.username === loggedInUser);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('kruleUsers', JSON.stringify(users));
        }
    }

    initialize();
});