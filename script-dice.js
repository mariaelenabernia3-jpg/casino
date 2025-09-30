document.addEventListener('DOMContentLoaded', () => {
  
    
    const HOUSE_EDGE = 0.99; 
    const ANIMATION_DURATION_MS = 1500;
    const MIN_BET = 1;
    const HISTORY_LENGTH = 10;

    
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
    const playerBalanceEl = document.getElementById('player-balance'); 

    
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
        let winChance;

        if (betMode === 'under') {
            rollValue = sliderValue;
            winChance = sliderValue;
            rollConditionLabel.textContent = 'Sacar Menos De';
        } else {
            rollValue = 100 - sliderValue;
            winChance = sliderValue;
            rollConditionLabel.textContent = 'Sacar Más De';
        }
        
        let multiplier = 0;
        if (winChance > 0 && winChance < 100) {
            multiplier = (100 / winChance) * HOUSE_EDGE;
        }
        
        const betAmount = parseFloat(betAmountInput.value) || 0;
        const potentialProfit = betAmount * multiplier - betAmount;
        
        rollValueDisplay.textContent = rollValue.toFixed(2);
        winChanceDisplay.textContent = `${winChance.toFixed(2)}%`;
        multiplierDisplay.textContent = `${multiplier.toFixed(2)}x`;
        profitOnWinDisplay.textContent = potentialProfit.toFixed(0);
    }
    
    
    function updateBalanceDisplay() {
        if (playerBalanceEl) {
            playerBalanceEl.textContent = playerCurrentBalance;
        }
    }

    async function rollDice() { 
        const betAmount = parseFloat(betAmountInput.value);
        if (isNaN(betAmount) || betAmount < MIN_BET) { alert(`La apuesta mínima es ${MIN_BET}.`); return; }
        if (betAmount > playerCurrentBalance) { alert('No tienes suficientes monedas para esa apuesta.'); return; }

        toggleControls(false);
        resultBall.classList.remove('win', 'loss');
        rollResultDisplay.classList.remove('win', 'loss');
        rollResultDisplay.textContent = '...';
        
        
        resultBall.style.transition = 'none';
        resultBall.style.left = '50%'; 
        void resultBall.offsetWidth; 

        try {
            const target = (betMode === 'under') ? parseInt(chanceSlider.value, 10) : 100 - parseInt(chanceSlider.value, 10);
            
            const response = await makeApiRequest('POST', '/games/dice/roll', {
                bet: betAmount,
                mode: betMode,
                target: target
            });

            const { rollResult, isWin, newBalance } = response;
            playerCurrentBalance = newBalance;

            const animationSpeed = ANIMATION_DURATION_MS / 1000;
            resultBall.style.transition = `left ${animationSpeed}s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.3s`;
            resultBall.style.left = `${rollResult}%`;
            
            setTimeout(() => {
                resultBall.classList.add(isWin ? 'win' : 'loss');
                rollResultDisplay.textContent = rollResult.toFixed(2);
                rollResultDisplay.classList.add(isWin ? 'win' : 'loss');
                
                addToHistory(rollResult, isWin);
                updateBalanceDisplay();
    
                toggleControls(true);
            }, ANIMATION_DURATION_MS);

        } catch (error) {
            console.error('Error al lanzar dados:', error);
            alert(error.message || 'Error al lanzar dados. Inténtalo de nuevo.');
            toggleControls(true);
            rollResultDisplay.textContent = 'Error'; 
        }
    }
    
    function toggleControls(enable) {
        rollDiceBtn.disabled = !enable;
        chanceSlider.disabled = !enable;
        rollUnderBtn.disabled = !enable;
        rollOverBtn.disabled = !enable;
        betAmountInput.disabled = !enable;
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
            
            updateBalanceDisplay(); 
            updateUI(); 
            setupEventListeners();
        } catch (error) {
            console.error('Error al cargar el perfil del usuario:', error);
            alert('Error al cargar los datos del usuario. Inicia sesión de nuevo.');
            localStorage.removeItem('jwtToken');
            window.location.href = 'login.html';
        }
    }

    initialize();
});
