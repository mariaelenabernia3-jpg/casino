document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const balanceAmountEl = document.getElementById('balance-amount');
    const coin = document.getElementById('coin');
    const headsButton = document.getElementById('heads-button');
    const tailsButton = document.getElementById('tails-button');
    const flipButton = document.getElementById('flip-button');
    const betInput = document.getElementById('bet-input');
    const decreaseBetBtn = document.getElementById('decrease-bet');
    const increaseBetBtn = document.getElementById('increase-bet');
    const resultMessageEl = document.getElementById('result-message');

    // --- Estado del Juego ---
    let balance = 0;
    let playerChoice = null;
    let isFlipping = false;
    const betStep = 10;

    function initializeGame() {
        const savedBalance = localStorage.getItem('kruleUserBalance');
        balance = savedBalance ? parseInt(savedBalance, 10) : 1000;
        updateBalanceDisplay();
        betInput.value = betStep;
    }

    function updateBalanceDisplay() {
        balanceAmountEl.textContent = balance;
        localStorage.setItem('kruleUserBalance', balance);
    }

    function handleChoice(choice) {
        if (isFlipping) return;
        playerChoice = choice;
        headsButton.classList.toggle('selected', choice === 'heads');
        tailsButton.classList.toggle('selected', choice === 'tails');
        resultMessageEl.textContent = `Has elegido ${choice === 'heads' ? 'Cara' : 'Cruz'}`;
    }

    function handleFlip() {
        const betAmount = parseInt(betInput.value, 10);

        // --- Validaciones ---
        if (isFlipping) return;
        if (!playerChoice) {
            resultMessageEl.textContent = "¡Debes elegir un lado!";
            return;
        }
        if (isNaN(betAmount) || betAmount <= 0) {
            resultMessageEl.textContent = "Apuesta inválida";
            return;
        }
        if (betAmount > balance) {
            resultMessageEl.textContent = "Saldo insuficiente";
            return;
        }

        isFlipping = true;
        flipButton.disabled = true;
        
        balance -= betAmount;
        updateBalanceDisplay();
        resultMessageEl.textContent = "Lanzando...";

        // --- Lógica de Animación Fiable ---
        
        // Determina el resultado aleatorio
        const randomOutcome = Math.random() < 0.5 ? 'heads' : 'tails';
        
        // Elimina cualquier clase de animación anterior para poder lanzarla de nuevo
        coin.className = 'coin'; 

        // Fuerza un "reflow" del navegador para asegurar que la animación se reinicie
        void coin.offsetWidth;

        // Añade la clase de animación correcta
        if (randomOutcome === 'heads') {
            coin.classList.add('is-flipping-heads');
        } else {
            coin.classList.add('is-flipping-tails');
        }
        
        // Escucha el evento 'animationend' para saber cuándo ha terminado
        coin.addEventListener('animationend', () => {
            // Fija la posición final de la moneda
            coin.style.transform = (randomOutcome === 'tails') ? 'rotateY(180deg)' : 'rotateY(0deg)';
            
            // Comprueba el resultado y paga si es necesario
            if (playerChoice === randomOutcome) {
                const winnings = betAmount * 2;
                balance += winnings;
                resultMessageEl.textContent = `¡SALIÓ ${randomOutcome === 'heads' ? 'CARA' : 'CRUZ'}! ¡GANASTE ${winnings}!`;
            } else {
                resultMessageEl.textContent = `¡SALIÓ ${randomOutcome === 'heads' ? 'CARA' : 'CRUZ'}! PERDISTE.`;
            }
            
            updateBalanceDisplay();
            isFlipping = false;
            flipButton.disabled = false;
        }, { once: true }); // { once: true } asegura que el evento solo se escuche una vez por cada flip
    }
    
    function adjustBet(amount) {
        let currentBet = parseInt(betInput.value, 10);
        if (isNaN(currentBet)) currentBet = 0;
        
        let newBet = currentBet + amount;
        if (newBet < betStep) newBet = betStep;
        
        betInput.value = newBet;
    }

    // --- Event Listeners ---
    headsButton.addEventListener('click', () => handleChoice('heads'));
    tailsButton.addEventListener('click', () => handleChoice('tails'));
    flipButton.addEventListener('click', handleFlip);
    decreaseBetBtn.addEventListener('click', () => adjustBet(-betStep));
    increaseBetBtn.addEventListener('click', () => adjustBet(betStep));

    // --- Iniciar el Juego ---
    initializeGame();
});