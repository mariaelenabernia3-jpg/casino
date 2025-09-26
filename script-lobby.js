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
    const defaultProfileIconSVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2300f9a4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';

   
    function initializeLobby() {
        loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
         
            registerLink.style.display = 'none';
            profileSection.style.display = 'flex';

            const users = JSON.parse(localStorage.getItem('kruleUsers')) || [];
            let currentUser = users.find(user => user.username === loggedInUser);

            if (currentUser) {
               
                if (typeof currentUser.coins === 'undefined') {
                    currentUser.coins = 0;
                    const userIndex = users.findIndex(user => user.username === loggedInUser);
                    users[userIndex] = currentUser;
                    localStorage.setItem('kruleUsers', JSON.stringify(users));
                }
                
               
                profilePicImg.src = currentUser.profilePic || defaultProfileIconSVG;

               
                headerUsername.textContent = currentUser.username;
                panelUsernameDisplay.textContent = currentUser.username;

               
                balanceAmount.textContent = Math.floor(currentUser.coins); 
            } else {
                
                logout();
            }
        } else {
            
            registerLink.style.display = 'block';
            profileSection.style.display = 'none';
        }
    }

    function handleProfilePicChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        const MAX_SIZE_KB = 500;
        if (file.size > MAX_SIZE_KB * 1024) {
            alert(`¡La imagen es demasiado grande! (Máx. ${MAX_SIZE_KB} KB)`);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const dataURL = e.target.result;
            
            let users = JSON.parse(localStorage.getItem('kruleUsers')) || [];
            const userIndex = users.findIndex(user => user.username === loggedInUser);
            if (userIndex !== -1) {
                users[userIndex].profilePic = dataURL;
                localStorage.setItem('kruleUsers', JSON.stringify(users));
                
                profilePicImg.src = dataURL;
                alert('Foto de perfil actualizada.');
            }
        };
        reader.readAsDataURL(file);
    }
    
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
        const users = JSON.parse(localStorage.getItem('kruleUsers')) || [];

        if (newName === '') {
            editErrorMessage.textContent = 'El nombre no puede estar vacío.';
            return;
        }
        if (newName === oldName) {
            hideEditForm();
            return;
        }
        const nameExists = users.some(user => user.username.toLowerCase() === newName.toLowerCase());
        if (nameExists) {
            editErrorMessage.textContent = 'Ese nombre ya está en uso.';
            return;
        }

        const userIndex = users.findIndex(user => user.username === oldName);
        if (userIndex !== -1) {
            users[userIndex].username = newName;
            localStorage.setItem('loggedInUser', newName);

            const lastSpinData = localStorage.getItem(`lastSpin_${oldName}`);
            if (lastSpinData) {
                localStorage.setItem(`lastSpin_${newName}`, lastSpinData);
                localStorage.removeItem(`lastSpin_${oldName}`);
            }
            
            localStorage.setItem('kruleUsers', JSON.stringify(users));
            
            alert('¡Nombre de usuario actualizado con éxito!');
            hideEditForm();
            initializeLobby(); 
        }
    }
    
    function logout() {
        localStorage.removeItem('loggedInUser');
        alert('Has cerrado sesión.');
        window.location.href = 'lobby.html';
    }

    
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
    newUsernameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            saveNewUsername();
        }
    });

    initializeLobby();
});
