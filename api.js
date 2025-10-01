Mira lo que es las cartas no pasarán de tener 7 de ataque o max 8 variarán entre 1 y 8 de ataque además de eso la vida por ende será de 10 o 15 o 12 Max 20 de vida  de vida solamente por supuesto invocar un bicho de los que quitan 8 te va a costar un huevo las cartas como no tienen ataques en concretos osea no un 1.5 ni 1.6 exetera hay otro apartado que se va a llamará Voluntad maldita que esa si se expresa en números pequeños ella se encarga que si dos moustros se atacan con 5 de Dano cada uno en vez de destruirse los dos gane el que tenga más voluntad maldita 

Hiciste bien las casillas solo te falta centrales justo en el medio una delante de la otra con una separación un poco tal vez no muy grande la separación pega meter algo un selo o algo que caracterize al juego en el medio entiendes ok además de eso te falta un último lugar en el deck un último hueco que se va a llamar convocaciónes por ahora que allí solo se van a poder poner unas 5 cartas es para invocar por especial 
Ya eso es todos más o menos en el aspecto visual y lo que te dije arriba es pa que te hagas una idea


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

