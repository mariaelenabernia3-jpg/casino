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

    
    let loggedInUser = null;
    let users = [];
    let currentUser = null;
    let countdownInterval;

    
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
            alert('Error al cargar datos. Inicia sesión de nuevo.');
            window.location.href = 'login.html';
            return;
        }

        buyButton.textContent = `Comprar Boleto (Precio: ${TICKET_PRICE})`;
        
        const today = getUTCDateString(new Date());
        const yesterday = getUTCDateString(new Date(Date.now() - 86400000));
        
        checkPreviousDraw(yesterday);
        updateCurrentDrawUI(today);
        startCountdown();
        setupEventListeners();
    }

    function generateWinningNumbers(dateString) {
        let seed = 0;
        for (let i = 0; i < dateString.length; i++) {
            seed += dateString.charCodeAt(i);
        }

        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        const numbers = new Set();
        while (numbers.size < 3) {
            numbers.add(Math.floor(random() * MAX_NUMBER) + 1);
        }
        return Array.from(numbers).sort((a, b) => a - b);
    }

    function checkPreviousDraw(yesterday) {
        const winningNumbers = generateWinningNumbers(yesterday);
        displayNumbers(previousWinningNumbersDiv, winningNumbers);

        const ticket = JSON.parse(localStorage.getItem(`lotteryTicket_${loggedInUser}`));
        if (ticket && ticket.forDate === yesterday) {
            const userNumbers = ticket.numbers.sort((a, b) => a - b);
            
            const isWinner = JSON.stringify(userNumbers) === JSON.stringify(winningNumbers);

            if (isWinner) {
                resultMessageP.textContent = `¡Felicidades! Acertaste los números y ganaste ${PRIZE_AMOUNT} monedas.`;
                resultMessageP.className = 'result-message win';
                currentUser.coins += PRIZE_AMOUNT;
                updateUserData();
            } else {
                resultMessageP.textContent = 'No hubo suerte esta vez. ¡Inténtalo de nuevo hoy!';
                resultMessageP.className = 'result-message loss';
            }
            localStorage.removeItem(`lotteryTicket_${loggedInUser}`);
        } else {
             resultMessageP.textContent = 'Aún no has participado. ¡Compra tu primer boleto!';
             resultMessageP.className = 'result-message';
        }
    }

    function updateCurrentDrawUI(today) {
        const ticket = JSON.parse(localStorage.getItem(`lotteryTicket_${loggedInUser}`));
        if (ticket && ticket.forDate === today) {
           
            buyTicketSection.style.display = 'none';
            awaitingDrawSection.style.display = 'block';
            displayNumbers(yourNumbersDiv, ticket.numbers);
        } else {
            
            buyTicketSection.style.display = 'block';
            awaitingDrawSection.style.display = 'none';
        }
    }

    function buyTicket() {
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

        if (currentUser.coins < TICKET_PRICE) {
            showError('No tienes suficientes monedas para comprar un boleto.');
            return;
        }

        currentUser.coins -= TICKET_PRICE;
        updateUserData();

        const today = getUTCDateString(new Date());
        const newTicket = { numbers, forDate: today };
        localStorage.setItem(`lotteryTicket_${loggedInUser}`, JSON.stringify(newTicket));

        alert('¡Boleto comprado con éxito! Vuelve mañana para ver los resultados.');
        updateCurrentDrawUI(today);
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

    function getUTCDateString(date) {
        return date.toISOString().split('T')[0];
    }
    
    function showError(message) {
        buyErrorMessage.textContent = message;
        buyErrorMessage.style.display = 'block';
        setTimeout(() => { buyErrorMessage.style.display = 'none'; }, 3000);
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