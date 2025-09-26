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
    let loggedInUser = null;
    let users = [];

    function initialize() { 
        loggedInUser = localStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            alert('Debes iniciar sesión para jugar.');
            window.location.href = 'login.html';
            return;
        }
        users = JSON.parse(localStorage.getItem('kruleUsers')) || [];
        drawWheel();
        checkCooldown();
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

    
    function checkCooldown() {
        const lastSpin = localStorage.getItem(`lastSpin_${loggedInUser}`);
        if (!lastSpin) {
            
            spinButton.style.display = 'block';
            spinButton.disabled = false;
            timerContainer.style.display = 'none';
            return;
        }

        const cooldownEnd = parseInt(lastSpin) + (24 * 60 * 60 * 1000);
        const now = new Date().getTime();

        if (now < cooldownEnd) {
           
            spinButton.style.display = 'none'; 
            timerContainer.style.display = 'block'; 
            startCountdown(cooldownEnd);
        } else {
            
            spinButton.style.display = 'block';
            spinButton.disabled = false;
            timerContainer.style.display = 'none';
            localStorage.removeItem(`lastSpin_${loggedInUser}`);
        }
    }
    
    let countdownInterval;
    function startCountdown(endTime) { 
        clearInterval(countdownInterval);
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

   
    function spinWheel() { 
        spinButton.disabled = true;
        const random = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        let winningPrize = prizes[0];
        let winningIndex = 0;
        for (let i = 0; i < prizes.length; i++) {
            cumulativeWeight += prizes[i].weight;
            if (random < cumulativeWeight) {
                winningPrize = prizes[i];
                winningIndex = i;
                break;
            }
        }
        const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8);
        const targetAngle = (360 - (segmentAngle * winningIndex)) - (segmentAngle / 2) + randomOffset;
        const totalRotation = 360 * 5 + targetAngle;
        wheel.style.transform = `rotate(${totalRotation}deg)`;
        setTimeout(() => {
            alert(`¡Felicidades! ¡Has ganado ${winningPrize.value} monedas!`);
            const userIndex = users.findIndex(user => user.username === loggedInUser);
            if (userIndex !== -1) {
                users[userIndex].coins += winningPrize.value;
                localStorage.setItem('kruleUsers', JSON.stringify(users));
            }
            localStorage.setItem(`lastSpin_${loggedInUser}`, new Date().getTime());
            checkCooldown(); 
        }, 6500);
    }

    
    spinButton.addEventListener('click', spinWheel);
    initialize();
});