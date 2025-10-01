document.addEventListener('DOMContentLoaded', () => {

    const NUMBERS_IN_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const PAYOUTS = { 'straight': 35, 'dozen': 2, 'column': 2, 'simple': 1 };
    
    const CHIP_VALUES = [10, 50, 100, 500, 1000];
    const HISTORY_MAX_LENGTH = 10;

    const bettingTable = document.getElementById('betting-table');
    const tickerTape = document.getElementById('ticker-tape');
    const historyNumbersEl = document.getElementById('history-numbers');
    const statusDisplay = document.getElementById('status-display');
    const playerBalanceEl = document.getElementById('player-balance');
    const totalBetEl = document.getElementById('total-bet');
    const chipValueEl = document.getElementById('chip-value');
    const chipDisplayEl = document.getElementById('chip-display');
    const chipIncreaseBtn = document.getElementById('chip-increase');
    const chipDecreaseBtn = document.getElementById('chip-decrease');
    const spinBtn = document.getElementById('spin-btn');
    const clearBtn = document.getElementById('clear-btn');

    let playerCurrentBalance = 0; 
    let currentChipIndex = 1; 
    let totalBet = 0;
    let bets = {}; 
    let isSpinning = false;
    
    async function initialize() { 
        const loadingScreen = document.getElementById('game-loading-screen');
        const gameContainer = document.getElementById('ruleta-game-main');

        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) { alert('Debes iniciar sesión para jugar.'); window.location.href = 'login.html'; return; }
        
        try {
            const userData = await makeApiRequest('GET', '/user/profile');
            playerCurrentBalance = userData.coins;
            
            buildBettingTable();
            createTickerTape();
            setupEventListeners();
            updateBalanceDisplay();
            updateChipDisplay();
            await loadGameHistory(); 
            
            loadingScreen.style.display = 'none';
            gameContainer.style.display = 'flex';

        } catch (error) {
            console.error('Error al cargar el perfil del usuario o historial:', error);
            alert('Error al cargar datos del usuario. Inicia sesión de nuevo.');
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('loggedInUserUsername');
            window.location.href = 'login.html';
        }
    }

    async function loadGameHistory() { 
        try {
            const history = await makeApiRequest('GET', '/games/roulette/history');
            historyNumbersEl.innerHTML = ''; 
            history.reverse().forEach(entry => { 
                const color = (entry.winningNumber === 0) ? 'green' : RED_NUMBERS.includes(entry.winningNumber) ? 'red' : 'black';
                const ball = `<div class="history-ball ${color}">${entry.winningNumber}</div>`;
                historyNumbersEl.innerHTML = ball + historyNumbersEl.innerHTML;
            });
           
            while (historyNumbersEl.children.length > HISTORY_MAX_LENGTH) {
                historyNumbersEl.lastChild.remove();
            }
        } catch (error) {
            console.error('Error al cargar el historial de la ruleta:', error);
        }
    }

    function buildBettingTable() {
        bettingTable.innerHTML += `<div class="bet-option zero" data-bet="0">0</div>`;
      
        for (let i = 1; i <= 36; i++) {
            const color = RED_NUMBERS.includes(i) ? 'red' : 'black';
            const col = Math.ceil(i / 3) + 1;
            const row = (i % 3 === 1) ? 3 : (i % 3 === 2) ? 2 : 1;
            bettingTable.innerHTML += `<div class="bet-option number ${color}" data-bet="${i}" style="grid-column: ${col}; grid-row: ${row};">${i}</div>`;
        }
      
        for (let i = 1; i <= 3; i++) {
            bettingTable.innerHTML += `<div class="bet-option column" data-bet="col${i}" style="grid-row: ${i};">2:1</div>`;
        }
        bettingTable.innerHTML += `<div class="bet-option dozen" data-bet="dozen1" style="grid-column: 2 / 6;">1st 12</div>`;
        bettingTable.innerHTML += `<div class="bet-option dozen" data-bet="dozen2" style="grid-column: 6 / 10;">2nd 12</div>`;
        bettingTable.innerHTML += `<div class="bet-option dozen" data-bet="dozen3" style="grid-column: 10 / 14;">3rd 12</div>`;
        
        bettingTable.innerHTML += `<div class="bet-option outside" data-bet="low" style="grid-column: 2 / 4;">1-18</div>`;
        bettingTable.innerHTML += `<div class="bet-option outside" data-bet="even" style="grid-column: 4 / 6;">PAR</div>`;
        bettingTable.innerHTML += `<div class="bet-option outside red" data-bet="red" style="grid-column: 6 / 8;"></div>`;
        bettingTable.innerHTML += `<div class="bet-option outside black" data-bet="black" style="grid-column: 8 / 10;"></div>`;
        bettingTable.innerHTML += `<div class="bet-option outside" data-bet="odd" style="grid-column: 10 / 12;">IMPAR</div>`;
        bettingTable.innerHTML += `<div class="bet-option outside" data-bet="high" style="grid-column: 12 / 14;">19-36</div>`;
    }
    
    function createTickerTape() {
        const tapeContent = [...NUMBERS_IN_ORDER, ...NUMBERS_IN_ORDER, ...NUMBERS_IN_ORDER, ...NUMBERS_IN_ORDER, ...NUMBERS_IN_ORDER];
        tapeContent.forEach(num => {
            const color = (num === 0) ? 'green' : RED_NUMBERS.includes(num) ? 'red' : 'black';
            tickerTape.innerHTML += `<div class="ticker-number ${color}">${num}</div>`;
        });
    }

    function setupEventListeners() {
        chipIncreaseBtn.addEventListener('click', () => changeChip(1));
        chipDecreaseBtn.addEventListener('click', () => changeChip(-1));
        bettingTable.addEventListener('click', e => {
            if (isSpinning || !e.target.dataset.bet) return;
            placeBet(e.target.dataset.bet, CHIP_VALUES[currentChipIndex], e.target);
        });
        clearBtn.addEventListener('click', clearBets);
        spinBtn.addEventListener('click', spin);
    }
    
    function changeChip(direction) {
        currentChipIndex = (currentChipIndex + direction + CHIP_VALUES.length) % CHIP_VALUES.length;
        updateChipDisplay();
    }
    
    function updateChipDisplay() {
        const value = CHIP_VALUES[currentChipIndex];
        chipValueEl.textContent = value >= 1000 ? `${value/1000}k` : value;
    }

    function placeBet(betType, amount, targetElement) {
        if (playerCurrentBalance < amount) {
             updateStatus('Fondos insuficientes para esta apuesta', true); 
             return;
        }
        totalBet += amount;
        bets[betType] = (bets[betType] || 0) + amount;
        playerCurrentBalance -= amount;
        updateBalanceDisplay();
        
        let chip = targetElement.querySelector('.chip-on-table');
        if (!chip) {
            chip = document.createElement('div');
            chip.className = 'chip-on-table';
            targetElement.appendChild(chip);
        }
        const betValue = bets[betType];
        chip.textContent = betValue >= 1000 ? `${(betValue/1000).toFixed(0)}k` : betValue;
        chip.style.backgroundColor = `hsl(${200 + betValue % 160}, 70%, 50%)`; 
    }

    function clearBets() {
        if (isSpinning) return;
        playerCurrentBalance += totalBet; 
        totalBet = 0;
        bets = {};
        updateBalanceDisplay();
        document.querySelectorAll('.chip-on-table').forEach(c => c.remove());
        updateStatus('Apuestas limpiadas');
    }

    async function spin() { 
        if (isSpinning || totalBet === 0) return;
        isSpinning = true;
        toggleControls(true);
        updateStatus('Girando...');
        
        try {
            const response = await makeApiRequest('POST', '/games/casino-roulette/spin', { bets: bets });

            const winningNumber = response.winningNumber;
            const newBalance = response.newBalance; 
            const payout = response.payout;

            playerCurrentBalance = newBalance;

            tickerTape.style.transition = 'none';
            tickerTape.style.transform = 'translateX(0)';
            void tickerTape.offsetWidth;

            const targetIndex = NUMBERS_IN_ORDER.length * 3 + NUMBERS_IN_ORDER.indexOf(winningNumber);
            const numberWidth = 50;
            const randomOffset = (Math.random() - 0.5) * numberWidth * 0.8;
            const targetPosition = - (targetIndex * numberWidth) + (document.querySelector('.ticker-wrapper').offsetWidth / 2) - (numberWidth / 2) + randomOffset;
            
            tickerTape.style.transition = 'transform 5.5s cubic-bezier(0.25, 1, 0.4, 1)';
            tickerTape.style.transform = `translateX(${targetPosition}px)`;

            setTimeout(() => finishRound(winningNumber, payout), 5800); 
            
        } catch (error) {
            console.error('Error al girar la ruleta:', error);
            updateStatus(error.message || 'Error al girar la ruleta. Inténtalo de nuevo.', true);
            playerCurrentBalance += totalBet; 
            totalBet = 0; bets = {};
            document.querySelectorAll('.chip-on-table').forEach(c => c.remove());
            updateBalanceDisplay();
            isSpinning = false;
            toggleControls(false);
        }
    }
   
    function finishRound(winningNumber, payout) {
        const info = {
            value: winningNumber, color: (winningNumber === 0) ? 'green' : RED_NUMBERS.includes(winningNumber) ? 'red' : 'black'
        };

        if (payout > totalBet) {
            updateStatus(`¡Gana el ${info.value}! Ganaste ${payout - totalBet} monedas.`);
        } else {
            updateStatus(`Gana el ${info.value}. Mejor suerte la próxima vez.`);
        }
        updateHistory(info);
        
        totalBet = 0; 
        bets = {};
        document.querySelectorAll('.chip-on-table').forEach(c => c.remove());
        updateBalanceDisplay();
        isSpinning = false;
        toggleControls(false);
    }

    function updateBalanceDisplay() {
        playerBalanceEl.textContent = Math.round(playerCurrentBalance);
        totalBetEl.textContent = totalBet;
    }
    function updateStatus(message, isError = false) {
        statusDisplay.textContent = message;
        statusDisplay.style.color = isError ? 'var(--red-color)' : 'var(--gold-color)';
    }
    function toggleControls(spinning) {
        spinBtn.disabled = spinning; clearBtn.disabled = spinning;
        chipIncreaseBtn.disabled = spinning; chipDecreaseBtn.disabled = spinning;
    }
    function updateHistory(info) {
        const ball = `<div class="history-ball ${info.color}">${info.value}</div>`;
        historyNumbersEl.innerHTML = ball + historyNumbersEl.innerHTML;
        if (historyNumbersEl.children.length > HISTORY_MAX_LENGTH) {
            historyNumbersEl.lastChild.remove();
        }
    }
   
    initialize();
});
