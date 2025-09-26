document.addEventListener('DOMContentLoaded', function() {
    
    const registerLink = document.getElementById('register-link');
    const profileSection = document.getElementById('profile-section');
    const balanceAmount = document.getElementById('balance-amount');
    
    const profilePicContainer = document.getElementById('profile-pic-container');
    const profilePicImg = document.getElementById('profile-pic-img');
    const profilePicInput = document.getElementById('profile-pic-input');
    const headerUsername = document.getElementById('header-username');
    
    const settingsIcon = document.getElementById('settings-icon');
    const profilePanel = document.getElementById('profile-panel');
    const logoutButton = document.getElementById('logout-button');
    
    const panelUsernameDisplay = document.getElementById('panel-username-display');
    const editUsernameIcon = document.getElementById('edit-username-icon');
    const editUsernameForm = document.getElementById('edit-username-form');
    const newUsernameInput = document.getElementById('new-username-input');
    const saveUsernameButton = document.getElementById('save-username-button');
    const cancelEditButton = document.getElementById('cancel-edit-button');
    const editErrorMessage = document.getElementById('edit-error-message');

    let loggedInUser = null;
    const defaultProfileIconSVG = '...'; 

    
    function initializeLobby() {
        loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            registerLink.style.display = 'none';
            profileSection.style.display = 'flex';

            const users = JSON.parse(localStorage.getItem('kruleUsers')) || [];
            let currentUser = users.find(user => user.username === loggedInUser);
            if (currentUser) {
                if (typeof currentUser.coins === 'undefined') { }
                
               
                profilePicImg.src = currentUser.profilePic || defaultProfileIconSVG;


                headerUsername.textContent = currentUser.username;
                panelUsernameDisplay.textContent = currentUser.username;

            
                balanceAmount.textContent = currentUser.coins;
            } else { logout(); }
        } else {
            registerLink.style.display = 'block';
            profileSection.style.display = 'none';
        }
    }

    
    function handleProfilePicChange(event) {  }
    
    function showEditForm() {
        panelUsernameDisplay.style.display = 'none'; 
        editUsernameIcon.style.display = 'none';
        editUsernameForm.style.display = 'flex';
        newUsernameInput.value = loggedInUser;
        newUsernameInput.focus();
        editErrorMessage.textContent = '';
    }
    function hideEditForm() {
        panelUsernameDisplay.style.display = 'block'; 
        editUsernameIcon.style.display = 'block';
        editUsernameForm.style.display = 'none';
        editErrorMessage.textContent = '';
    }
    function saveNewUsername() {
        const oldName = loggedInUser;
        const newName = newUsernameInput.value.trim();
       
        alert('¡Nombre de usuario actualizado!');
        hideEditForm();
        initializeLobby();
    }
    
    function logout() { /* ... */ }

    settingsIcon.addEventListener('click', () => {
        profilePanel.style.display = (profilePanel.style.display === 'block') ? 'none' : 'block';
        hideEditForm();
    });
    
    profilePicContainer.addEventListener('click', () => profilePicInput.click());
    profilePicInput.addEventListener('change', handleProfilePicChange);
    logoutButton.addEventListener('click', logout);
    
    editUsernameIcon.addEventListener('click', showEditForm);
    cancelEditButton.addEventListener('click', hideEditForm);
    saveUsernameButton.addEventListener('click', saveNewUsername);
    newUsernameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') saveNewUsername(); });

    initializeLobby();
});