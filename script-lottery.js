document.addEventListener('DOMContentLoaded', () => {
    // URL de la API desplegada (según tu documentación)
    const API_BASE_URL = 'https://casino-api-rose.vercel.app'; 

    /**
     * Realiza peticiones a la API del backend.
     * @param {string} method - Método HTTP (GET, POST, etc.).
     * @param {string} endpoint - El endpoint de la API (ej. '/api/user/profile').
     * @param {object} body - El cuerpo de la petición para métodos como POST.
     * @returns {Promise<any>} - La respuesta de la API en formato JSON.
     */
    async function makeApiRequest(method, endpoint, body = null) {
        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) {
            // Redirige si no hay token, ya que es necesario para todas las llamadas.
            alert('Sesión no encontrada. Por favor, inicia sesión.');
            window.location.href = 'login.html';
            throw new Error('No se encontró el token de autenticación.');
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
        };

        const config = { method, headers };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.message || `Error HTTP: ${response.status}`);
        }
        return responseData;
    }

    // Constantes del juego
    const TICKET_PRICE = 100;
    const MAX_NUMBER = 99;

    // Referencias a elementos del DOM
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
        try {
            // Carga los datos del perfil para obtener el saldo inicial
            const userData = await makeApiRequest('GET', '/api/user/profile');
            playerCurrentBalance = userData.coins;
            buyButton.textContent = `Comprar Boleto (Precio: ${TICKET_PRICE})`;

            // Pide la información específica de la lotería
            const lotteryInfo = await makeApiRequest('GET', '/api/games/lottery/info');

            // Muestra los resultados del sorteo de ayer
            if (lotteryInfo.yesterdaysDraw && lotteryInfo.yesterdaysDraw.length === 3) {
                displayNumbers(previousWinningNumbersDiv, lotteryInfo.yesterdaysDraw);
                
                // NOTA: Tu backend no envía 'previousTicketResult', pero el frontend está preparado para manejarlo.
                if (lotteryInfo.previousTicketResult) { 
                    if (lotteryInfo.previousTicketResult.isWin) {
                        resultMessageP.textContent = `¡Felicidades! Ganaste ${lotteryInfo.previousTicketResult.prize} monedas.`;
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
                resultMessageP.textContent = 'Aún no hay datos del sorteo anterior.';
            }

            // Comprueba si el usuario ya tiene un boleto para hoy
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

        } catch (error) {
            console.error('Error al inicializar la lotería:', error);
            alert(error.message || 'Error al cargar la lotería. Intenta iniciar sesión de nuevo.');
            window.location.href = 'login.html';
        }
    }

    async function buyTicket() {
        const numbers = Array.from(numberInputs).map(input => parseInt(input.value, 10));
        const seenNumbers = new Set(numbers);

        if (numbers.length !== 3 || seenNumbers.size !== 3 || numbers.some(n => isNaN(n) || n < 1 || n > MAX_NUMBER)) {
            showError('Por favor, introduce 3 números únicos entre 1 y 99.');
            return;
        }

        if (playerCurrentBalance < TICKET_PRICE) {
            showError('No tienes suficientes monedas para comprar un boleto.');
            return;
        }

        buyButton.disabled = true;
        try {
            const response = await makeApiRequest('POST', '/api/games/lottery/buy', { numbers });
            playerCurrentBalance = response.newBalance; 
            
            showError(response.message || '¡Boleto comprado con éxito!', true);
            
            setTimeout(() => {
                buyTicketSection.style.display = 'none';
                awaitingDrawSection.style.display = 'block';
                displayNumbers(yourNumbersDiv, numbers); 
            }, 1500);

        } catch (error) {
            console.error('Error al comprar el boleto:', error);
            showError(error.message || 'Error al comprar el boleto.');
            buyButton.disabled = false;
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
            
            if (distance < 1000) { 
                clearInterval(countdownInterval);
                timerDisplay.textContent = "00:00:00";
                setTimeout(() => location.reload(), 2000); 
                return;
            }

            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }
    
    function displayNumbers(container, numbers) {
        container.innerHTML = '';
        (numbers || []).forEach(num => {
            const ball = document.createElement('span');
            ball.className = 'number-ball';
            ball.textContent = num;
            container.appendChild(ball);
        });
    }

    function showError(message, isSuccess = false) {
        buyErrorMessage.textContent = message;
        buyErrorMessage.style.color = isSuccess ? 'var(--primary-green)' : 'var(--error-color)';
        buyErrorMessage.style.display = 'block';
        setTimeout(() => { buyErrorMessage.style.display = 'none'; }, 3000);
    }
    
    initialize();
});
