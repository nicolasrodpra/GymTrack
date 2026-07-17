import { GYMTRACK_CONFIG } from '../main.js';
import { authenticateWithFirebase, getFirebaseUser, signOutFromFirebase } from '../profile-sync.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const message = document.getElementById('auth-message');
const submitButton = document.getElementById('submit-auth');
const modeButton = document.getElementById('toggle-mode');
const title = document.getElementById('login-title');
const intro = document.querySelector('.login-intro');
const activeSession = document.getElementById('active-session');
const activeSessionEmail = document.getElementById('active-session-email');
const continueSession = document.getElementById('continue-session');
const logoutSession = document.getElementById('logout-session');
let mode = 'login';

function setMessage(text = '', success = false) {
    message.textContent = text;
    message.classList.toggle('is-success', success);
}

function updateMode() {
    const registering = mode === 'register';
    title.textContent = registering ? 'Crea tu cuenta' : 'Bienvenido de nuevo';
    intro.textContent = registering ? 'Regístrate para guardar y seguir tus entrenamientos.' : 'Ingresa para continuar con tus entrenamientos.';
    submitButton.lastElementChild.textContent = registering ? 'Crear cuenta' : 'Iniciar sesión';
    submitButton.firstElementChild.textContent = registering ? 'person_add' : 'login';
    modeButton.textContent = registering ? 'Inicia sesión' : 'Regístrate';
    passwordInput.autocomplete = registering ? 'new-password' : 'current-password';
    setMessage();
}

function getAuthError(error) {
    const messages = {
        'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
        'auth/invalid-credential': 'Correo o contraseña incorrectos.',
        'auth/invalid-email': 'Ingresa un correo válido.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/operation-not-allowed': 'Habilita Email/Password en Firebase Authentication.',
        'auth/network-request-failed': 'No se pudo conectar con Firebase. Revisa tu conexión.'
    };
    return messages[error.code] || 'No se pudo completar la solicitud con Firebase.';
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!emailPattern.test(email)) return setMessage('Ingresa un correo válido.');
    if (!password) return setMessage('Ingresa tu contraseña.');
    if (mode === 'register' && password.length < 6) return setMessage('La contraseña debe tener al menos 6 caracteres.');

    submitButton.disabled = true;
    setMessage(mode === 'register' ? 'Creando cuenta...' : 'Verificando acceso...', true);
    try {
        await authenticateWithFirebase(GYMTRACK_CONFIG.firebaseConfig, email, password, mode);
        window.location.assign('../dashboard/dashboard.html');
    } catch (error) {
        setMessage(getAuthError(error));
    } finally {
        submitButton.disabled = false;
    }
});

modeButton.addEventListener('click', () => {
    mode = mode === 'login' ? 'register' : 'login';
    updateMode();
});

continueSession.addEventListener('click', () => {
    window.location.assign('../dashboard/dashboard.html');
});

logoutSession.addEventListener('click', async () => {
    logoutSession.disabled = true;
    try {
        await signOutFromFirebase(GYMTRACK_CONFIG.firebaseConfig);
        activeSession.classList.add('hidden');
        emailInput.focus();
        setMessage('Ahora puedes iniciar sesiÃ³n con otro correo.', true);
    } catch {
        setMessage('No se pudo cerrar la sesiÃ³n actual.');
    } finally {
        logoutSession.disabled = false;
    }
});

getFirebaseUser(GYMTRACK_CONFIG.firebaseConfig).then((user) => {
    if (!user) return;
    activeSessionEmail.textContent = user.email || 'tu cuenta actual';
    activeSession.classList.remove('hidden');
}).catch(() => {});
