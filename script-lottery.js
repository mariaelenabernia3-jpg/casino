document.addEventListener('DOMContentLoaded', () => {
   
    const TICKET_PRICE = 100;
    const PRIZE_AMOUNT = 5000; 
    const MAX_NUMBER = 99;


    const previousWinningNumbersDiv = document.getElementById('previous-winning-numbers');
    const resultMessageP = document.getElementById('result-message');
    const buyTicketSection = document.getElementById('buy-ticket-section');
    const numberInputs = document.querySelectorAll('.number-input');
    const buyButton = document.getElementById('buy-button');
    const buyErrorMessage = document.getElementById('buy-error-message');
    const awaitingDrawSection = document.getElementById('awaiting-draw-section');
    const yourNumbersDiv = document.getElementById('your-numbers');
    const timerDisplay = document.getElementById('timer');

    
    let playerCurrentBalance = 0; 
    let countdownInterval;

    
    async function initialize() { 
        const loadingScreen = document.getElementById('game-loading-screen');
        const gameContainer = document.getElementById('lottery-container-main');

        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) {
            alert('Debes iniciar sesión para jugar.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const userData = await makeApiRequest('GET', '/user/profile');
            playerCurrentBalance = userData.coins;

            buyButton.textContent = `Comprar Boleto (Precio: ${TICKET_PRICE})`;
            
            const lotteryInfo = await makeApiRequest('GET', '/games/lottery/info');

            if (lotteryInfo.yesterdaysDraw && lotteryInfo.yesterdaysDraw.length === 3) {
                displayNumbers(previousWinningNumbersDiv, lotteryInfo.yesterdaysDraw);
                if (lotteryInfo.previousTicketResult) { 
                    if (lotteryInfo.previousTicketResult.isWin) {
                        resultMessageP.textContent = `¡Felicidades! Acertaste los números y ganaste ${lotteryInfo.previousTicketResult.prize || PRIZE_AMOUNT} monedas.`;
                        resultMessageP.className = 'result-message win';
                    } else {
                        resultMessageP.textContent = 'No hubo suerte esta vez. ¡Inténtalo de nuevo hoy!';
                        resultMessageP.className = 'result-message loss';
                    }
                } else {
                     resultMessageP.textContent = 'No participaste en el sorteo anterior.';
                     resultMessageP.className = 'result-message';
                }
            } else {
                previousWinningNumbersDiv.innerHTML = '<span class="number-ball">?</span><span class="number-ball">?</span><span class="number-ball">?</span>';
                resultMessageP.textContent = 'Aún no se ha realizado el sorteo anterior o no hay datos.';
            }

            if (lotteryInfo.userTicketForToday && lotteryInfo.userTicketForToday.length === 3) {
                buyTicketSection.style.display = 'none';
                awaitingDrawSection.style.display = 'block';
                displayNumbers(yourNumbersDiv, lotteryInfo.userTicketForToday);
            } else {
                buyTicketSection.style.display = 'block';
                awaitingDrawSection.style.display = 'none';
            }

            startCountdown();
            setupEventListeners();
            
            loadingScreen.style.display = 'none';
            gameContainer.style.display = 'block';

        } catch (error) {
            console.error('Error al inicializar la lotería:', error);
            alert('Error al cargar la lotería. Inicia sesión de nuevo.');
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('loggedInUserUsername');
            window.location.href = 'login.html';
        }
    }

   
    async function buyTicket() { 
        const numbers = [];
        let isValid = true;
        const seenNumbers = new Set();

        numberInputs.forEach(input => {
            const num = parseInt(input.value, 10);
            if (isNaN(num) || num < 1 || num > MAX_NUMBER) {
                isValid = false;
            }
            if (seenNumbers.has(num)) { 
                isValid = false;
            }
            numbers.push(num);
            seenNumbers.add(num);
        });

        if (!isValid) {
            showError('Por favor, introduce 3 números únicos entre 1 y 99.');
            return;
        }

        if (playerCurrentBalance < TICKET_PRICE) {
            showError('No tienes suficientes monedas para comprar un boleto.');
            return;
        }

        try {
            
            const response = await makeApiRequest('POST', '/games/lottery/buy', { numbers });
            
            playerCurrentBalance = response.newBalance
