document.addEventListener('DOMContentLoaded', function() {
    const lobbyLoadingScreen = document.getElementById('lobby-loading-screen');
    const mainLobbyHeader = document.getElementById('main-lobby-header');
    const mainLobbyContent = document.getElementById('main-lobby-content');

    if (mainLobbyHeader) mainLobbyHeader.style.display = 'none';
    if (mainLobbyContent) mainLobbyContent.style.display = 'none';
    if (lobbyLoadingScreen) lobbyLoadingScreen.style.display = 'flex'; 

    setTimeout(() => {
        if (lobbyLoadingScreen) lobbyLoadingScreen.style.display = 'none';
        if (mainLobbyHeader) mainLobbyHeader.style.display = 'flex';
        if (mainLobbyContent) mainLobbyContent.style.display = 'block'; 
        initializeLobby(); 
    }, 2000); 

    const blackjackLink = document.getElementById('blackjack-link');
    if (blackjackLink) {
        blackjackLink.addEventListener('click', () => {
            
            localStorage.setItem('kruleAudioPermission', 'true');
        });
    }
    
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

    let loggedInUserUsername = null; 
    
    const defaultProfileIconSVG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2300f9a4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';

    
    async function initializeLobby() { 
        const jwtToken = localStorage.getItem('jwtToken');
        if (jwtToken) {
            try {
                
                const userData = await makeApiRequest('GET', '/user/profile');
                
                loggedInUserUsername = userData.username; 
                registerLink.style.display = 'none';
                profileSection.style.display = 'flex';

                profilePicImg.src = userData.profile_pic_base64 || defaultProfileIconSVG;
                headerUsername.textContent = userData.username;
                panelUsernameDisplay.textContent = userData.username;
                balanceAmount.textContent = userData.coins;
                
            } catch (error) {
                console.error('Error al cargar el perfil:', error);
                
                logout(); 
            }
        } else {
           
            registerLink.style.display = 'block';
            profileSection.style.display = 'none';
        }
    }

    async function handleProfilePicChange(event) { 
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { 
            alert('La imagen es demasiado grande. Por favor, elige una imagen menor de 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async function(e) { 
            try {
                
                await makeApiRequest('PUT', '/user/profile', { profilePic: e.target.result });
                profilePicImg.src = e.target.result; 
                alert("Foto de perfil actualizada con éxito.");
            } catch (error) {
                alert('Error al actualizar la foto de perfil: ' + (error.message || 'Error desconocido'));
            }
        };
        reader.readAsDataURL(file);
    }
    
    function showEditForm() {
        panelUsernameDisplay.style.display = 'none'; 
        editUsernameIcon.style.display = 'none';
        editUsernameForm.style.display = 'flex';
        newUsernameInput.value = loggedInUserUsername; 
        newUsernameInput.focus();
        editErrorMessage.textContent = '';
    }
    function hideEditForm() {
        panelUsernameDisplay.style.display = 'block'; 
        editUsernameIcon.style.display = 'block';
        editUsernameForm.style.display = 'none';
        editErrorMessage.textContent = '';
    }
    
    async function saveNewUsername() { 
        const newName = newUsernameInput.value.trim();
        if (newName === loggedInUserUsername) { 
            hideEditForm();
            return;
        }
        if (newName.length < 3) {
            editErrorMessage.textContent = 'El nombre debe tener al menos 3 caracteres.';
            return;
        }
        
        try {
            
            const response = await makeApiRequest('PUT', '/user/profile', { newUsername: newName });
           
            if (response.newToken) {
                localStorage.setItem('jwtToken', response.newToken);
            }
            localStorage.setItem('loggedInUserUsername', newName); 
            loggedInUserUsername = newName; 
            
            alert('¡Nombre de usuario actualizado!');
            hideEditForm();
            initializeLobby(); 
        } catch (error) {
            editErrorMessage.textContent = error.message || 'Error al actualizar el nombre de usuario.';
        }
    }
    
    function logout() {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('loggedInUserUsername'); 
        window.location.href = 'lobby.html';
    }

    settingsIcon.addEventListener('click', () => {
        const isPanelVisible = profilePanel.style.display === 'block';
        profilePanel.style.display = isPanelVisible ? 'none' : 'block';
        if (isPanelVisible) {
            hideEditForm();
        }
    });
    
    profilePicContainer.addEventListener('click', () => profilePicInput.click());
    profilePicInput.addEventListener('change', handleProfilePicChange);
    logoutButton.addEventListener('click', logout);
    
    editUsernameIcon.addEventListener('click', showEditForm);
    cancelEditButton.addEventListener('click', hideEditForm);
    saveUsernameButton.addEventListener('click', saveNewUsername);
    newUsernameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') saveNewUsername(); });

});
