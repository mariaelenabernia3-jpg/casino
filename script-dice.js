// script-dice.js (FINAL CORRECTED VERSION)

document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTS ---
    const HOUSE_EDGE = 0.99;
    const ANIMATION_DURATION_MS = 2000;
    const ANIMATION_REVEAL_MS = 500;
    const ANIMATION_INTERVAL_MS = 100;
    const MIN_BET = 1;
    const HISTORY_LENGTH = 10;

    // --- DOM REFERENCES ---
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

    // --- GAME STATE ---
    let loggedInUser = null;
    let users = [];
    let currentUser = null;
    let betMode = 'under';

    // --- FUNCTIONS ---

    function updateUserData() {
        const userIndex = users.findIndex(user => user.username === loggedInUser);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('kruleUsers', JSON.stringify(users));
        }
    }

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

        const effectiveWinChance = (betMode === 'under') ? rollValue : 100 - rollValue;
        let multiplier = 0;
        if (effectiveWinChance > 0 && effectiveWinChance < 100) {
            multiplier = (100 / effectiveWinChance) * HOUSE_EDGE;
        }
        
        const betAmount = parseFloat(betAmountInput.value) || 0;
        const profit = betAmount * (multiplier - 1);

        rollValueDisplay.textContent = rollValue.toFixed(2);
        winChanceDisplay.textContent = `${effectiveWinChance.toFixed(2)}%`;
        multiplierDisplay.textContent = `${multiplier.toFixed(2)}x`;
        profitOnWinDisplay.textContent = profit.toFixed(2);
    }

    function rollDice() {
        if (!currentUser) {
            alert('Error: No se encontró el usuario. Por favor, inicia sesión de nuevo.');
            return;
        }
        
        const betAmount = parseFloat(betAmountInput.value);
        if (isNaN(betAmount) || betAmount < MIN_BET) {
            alert(`La apuesta mínima es de ${MIN_BET} moneda.`);
            return;
        }
        if (betAmount > currentUser.coins) {
            alert('No tienes suficientes monedas para esta apuesta.');
            return;
        }

        rollDiceBtn.disabled = true;
        chanceSlider.disabled = true;
        rollUnderBtn.disabled = true;
        rollOverBtn.disabled = true;
        resultBall.classList.remove('win', 'loss');
        rollResultDisplay.classList.remove('win', 'loss');
        rollResultDisplay.textContent = '...';

        const animationInterval = setInterval(() => {
            const randomPosition = Math.random() * 100;
            resultBall.style.transition = `left ${ANIMATION_INTERVAL_MS / 1000}s linear`;
            resultBall.style.left = `${randomPosition}%`;
        }, ANIMATION_INTERVAL_MS);

        setTimeout(() => {
            clearInterval(animationInterval);

            currentUser.coins -= betAmount;
            const rollResult = parseFloat((Math.random() * 100).toFixed(2));
            const sliderValue = parseInt(chanceSlider.value, 10);
            
            const isWin = (betMode === 'under')
                ? rollResult < sliderValue
                : rollResult > (100 - sliderValue);

            resultBall.style.transition = `left ${ANIMATION_REVEAL_MS / 1000}s cubic-bezier(0.65, 0, 0.35, 1)`;
            resultBall.style.left = `${rollResult}%`;
            resultBall.classList.add(isWin ? 'win' : 'loss');

            rollResultDisplay.textContent = rollResult.toFixed(2);
            rollResultDisplay.classList.add(isWin ? 'win' : 'loss');
            
            if (isWin) {
                const effectiveWinChance = (betMode === 'under') ? sliderValue : 100 - (100 - sliderValue);
                const multiplier = (100 / effectiveWinChance) * HOUSE_EDGE;
                const winnings = betAmount * multiplier;
                currentUser.coins += winnings;
            }

            updateUserData();
            addToHistory(rollResult, isWin);

            setTimeout(() => {
                rollDiceBtn.disabled = false;
                chanceSlider.disabled = false;
                rollUnderBtn.disabled = false;
                rollOverBtn.disabled = false;
            }, ANIMATION_REVEAL_MS);

        }, ANIMATION_DURATION_MS);
    }
    
    function setupEventListeners() {
        chanceSlider.addEventListener('input', updateUI);
        betAmountInput.addEventListener('input', updateUI);
        
        rollUnderBtn.addEventListener('click', () => {
            betMode = 'under';
            rollUnderBtn.classList.add('active');
            rollOverBtn.classList.remove('active');
            updateUI();
        });
        
        rollOverBtn.addEventListener('click', () => {
            betMode = 'over';
            rollOverBtn.classList.add('active');
            rollUnderBtn.classList.remove('active');
            updateUI();
        });

        rollDiceBtn.addEventListener('click', rollDice);
    }

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
            alert('Error al cargar los datos del usuario. Inicia sesión de nuevo.');
            localStorage.removeItem('loggedInUser');
            window.location.href = 'login.html';
            return;
        }

        updateUI();
        setupEventListeners();
    }

    // --- START ---
    initialize();
});