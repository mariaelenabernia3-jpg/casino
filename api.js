const BASE_API_URL = "https://casino-api-rose.vercel.app/api";

async function makeApiRequest(method, endpoint, data = null, needsAuth = true) {
    const url = `${BASE_API_URL}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (needsAuth) {
        const token = localStorage.getItem('jwtToken'); 
        if (!token) {
            console.error("No se encontró el token JWT. Redirigiendo a inicio de sesión.");
            
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('loggedInUserUsername');
            window.location.href = 'login.html';
            throw new Error("No autorizado: No hay token.");
        }
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();

        if (!response.ok) {
        
            if (response.status === 401) {
                console.error("Fallo de autenticación: el token podría haber expirado o ser inválido.");
                localStorage.removeItem('jwtToken');
                localStorage.removeItem('loggedInUserUsername');
                window.location.href = 'login.html';
            }
            throw new Error(responseData.message || `Error de API: ${response.status}`);
        }
        return responseData;
    } catch (error) {
        console.error(`Error en la solicitud a ${url}:`, error.message);
        throw error;
    }
}
