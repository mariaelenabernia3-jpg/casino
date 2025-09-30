document.addEventListener('DOMContentLoaded', () => {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin-button');
    const timerContainer = document.getElementById('timer-container');
    const timerDisplay = document.getElementById('timer');

    
    const prizes = [
        { value: 10,   label: '10',  weight: 40 }, { value: 25,   label: '25',  weight: 25 },
        { value: 50,   label: '50',  weight: 15 }, { value: 100,  label: '100', weight: 8 },
        { value: 250,  label: '250', weight: 5 }, { value: 500,  label: '500', weight: 4 },
        { value: 1000, label: '1k',  weight: 2 }, { value: 5000, label: '5k',  weight: 1 }
    ];
    const totalWeight = prizes.reduce((acc, prize) => acc + prize.weight, 0);
    const segmentAngle = 360 / prizes.length;
    
    let playerCurrentBalance = 0; 

    async function initialize() { 
        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) {
            alert('Debes iniciar sesión para jugar.');
            window.location.href = 'login.html';
            return;
        }

        try {
            const userData = await makeApiRequest('GET', '/user/profile');
            playerCurrentBalance = userData.coins;
          
            drawWheel();
            checkCooldown();
        } catch (error) {
            console.error('Error al cargar el perfil del usuario:', error);
            alert('Error al cargar datos del usuario. Inicia sesión de nuevo.');
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('loggedInUserUsername');
            window.location.href = 'login.html';
        }
    }

    
    function drawWheel() { 
        prizes.forEach((prize, i) => {
            const segment = document.createElement('div');
            segment.className = 'prize';
            segment.style.transform = `rotate(${segmentAngle * i}deg)`;
            const prizeLabel = document.createElement('span');
            prizeLabel.textContent = prize.label;
            segment.appendChild(prizeLabel);
            wheel.appendChild(segment);
        });
    }

    
    async function checkCooldown() { 
        try {
            const status = await makeApiRequest('GET', '/rewards/daily-roulette/status');
            
            if (status.canSpin) {
                spinButton.style.display = 'block';
                spinButton.disabled = false;
                timerContainer.style.display = 'none';
            } else {
                spinButton.style.display = 'none'; 
                timerContainer.style.display = 'block'; 
                startCountdown(status.nextSpinTime);
            }
        } catch (error) {
            console.error('Error al verificar el cooldown de la ruleta diaria:', error);
            alert(error.message || 'Error al cargar el estado de la ruleta. Inténtalo de nuevo.');
            spinButton.disabled = true;
        }
    }
    
    let countdownInterval;
    function startCountdown(endTimeStr) { 
        clearInterval(countdownInterval);
        const endTime = new Date(endTimeStr).getTime(); 

        countdownInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;
            if (distance < 0) {
                clearInterval(countdownInterval);
                checkCooldown(); 
                return;
            }
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

   
    async function spinWheel() { 
        spinButton.disabled = true;

        try {
            const response = await makeApiRequest('POST', '/rewards/daily-roulette/spin');
            const winningPrizeValue = response.prizeWon;
            playerCurrentBalance = response.newBalance; 

            const winningPrize = prizes.find(p => p.value === winningPrizeValue);
            const winningIndex = prizes.indexOf(winningPrize);

            if (winningIndex === -1) {
                throw new Error("El premio ganado no se encontró en la lista de premios del frontend.");
            }

            const targetAngle = (360 - (segmentAngle * winningIndex)) - (segmentAngle / 2);
            const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8);
            const totalRotation = (360 * 5) + targetAngle + randomOffset;
            
            wheel.style.transform = `rotate(${totalRotation}deg)`;
            
            setTimeout(() => {
                alert(`¡Felicidades! ${response.message}`);
                checkCooldown(); 
            }, 6500);

        } catch (error) {
            console.error('Error al girar la ruleta diaria:', error);
            alert(error.message || 'Error al girar la ruleta. Inténtalo de nuevo más tarde.');
            spinButton.disabled = false; 
        }
    }

    
    spinButton.addEventListener('click', spinWheel);
    initialize();
});
