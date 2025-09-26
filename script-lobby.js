


document.addEventListener('DOMContentLoaded', function() {

    
    const registerLink = document.getElementById('register-link');
    const profileSection = document.getElementById('profile-section');
    const profileIcon = document.getElementById('profile-icon');
    const profilePanel = document.getElementById('profile-panel');
    const profileUsername = document.getElementById('profile-username');
    const logoutButton = document.getElementById('logout-button');
    const balanceAmount = document.getElementById('balance-amount');

    
    const loggedInUser = localStorage.getItem('loggedInUser');

    if (loggedInUser) {
        
        registerLink.style.display = 'none';
        profileSection.style.display = 'flex';

        
        let users = JSON.parse(localStorage.getItem('kruleUsers')) || [];
        
        let currentUser = users.find(user => user.username === loggedInUser);

        if (currentUser) {
            
            if (typeof currentUser.coins === 'undefined') {
                
                currentUser.coins = 0;
                
                
                const userIndex = users.findIndex(user => user.username === loggedInUser);
                users[userIndex] = currentUser;
                
               
                localStorage.setItem('kruleUsers', JSON.stringify(users));
            }
           
            profileUsername.textContent = currentUser.username;
            balanceAmount.textContent = currentUser.coins;
        }

    } else {
        
        registerLink.style.display = 'block';
        profileSection.style.display = 'none';
    }

    
    profileIcon.addEventListener('click', function() {
        profilePanel.style.display = (profilePanel.style.display === 'block') ? 'none' : 'block';
    });

    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('loggedInUser');
        alert('Has cerrado sesión.');
        window.location.href = 'lobby.html';
    });
});