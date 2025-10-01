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

            // --- INICIO DE LA SECCIÓN CRÍTICA CORREGIDA ---
            if (lotteryInfo.yesterdaysDraw && lotteryInfo.yesterdaysDraw.length === 3) {
                displayNumbers(previousWinningNumbersDiv, lotteryInfo.yesterdaysDraw);
                
                // Comprobación robusta: nos aseguramos de que el objeto exista antes de usarlo
                if (lotteryInfo.previousTicketResult) { 
                    if (lotteryInfo.previousTicketResult.isWin) {
                        resultMessageP.textContent = `¡Felicidades! Acertaste los números y ganaste ${lotteryInfo.previousTicketResult.prize || PRIZE_AMOUNT} monedas.`;
                        resultMessageP.className = 'result-message win';
                    } else {
                        resultMessageP.textContent = 'No hubo suerte esta vez. ¡Inténtalo de nuevo hoy!';
                        resultMessageP.className = 'result-message loss';
                    }
                } else {
                     // Esto se mostrará si el usuario no jugó ayer
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
            // --- FIN DE LA SECCIÓN CORREGIDA ---

            startCountdown();
            setupEventListeners();
            
            // Esta línea ahora debería ejecutarse sin problemas
            loadingScreen.style.display = 'none';
            gameContainer.style.display = 'block';

        } catch (error) {
            console.error('Error al inicializar la lotería:', error);
            // Si hay un error, el usuario verá una alerta y será redirigido.
            alert('Error al cargar la lotería. Intenta iniciar sesión de nuevo.');
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
            playerCurrentBalance = response.newBalance; 
            
            alert(response.message || '¡Boleto comprado con éxito! Vuelve mañana para ver los resultados.');
            
            buyTicketSection.style.display = 'none';
            awaitingDrawSection.style.display = 'block';
            displayNumbers(yourNumbersDiv, numbers); 

        } catch (error) {
            console.error('Error al comprar el boleto:', error);
            showError(error.message || 'Error al comprar el boleto. Inténtalo de nuevo.');
        }
    }

    function setupEventListeners() {
        buyButton.addEventListener('click', buyTicket);
    }
    
    function startCountdown() {
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            const now = new Date();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0); 
            const distance = endOfDay.getTime() - now.getTime();
            
            if (distance < 0) { 
                clearInterval(countdownInterval);
                initialize(); 
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }
    
    function displayNumbers(container, numbers) {
        container.innerHTML = '';
        numbers.forEach(num => {
            const ball = document.createElement('span');
            ball.className = 'number-ball';
            ball.textContent = num;
            container.appendChild(ball);
        });
    }

    function showError(message) {
        buyErrorMessage.textContent = message;
        buyErrorMessage.style.display = 'block';
        setTimeout(() => { buyErrorMessage.style.display = 'none'; }, 3000);
    }
    
    initialize();
});
