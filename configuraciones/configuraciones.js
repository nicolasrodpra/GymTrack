import '../main.js';
import { signOutFromFirebase } from '../profile-sync.js';

const storage = {
    get(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(`gymtrack_${key}`) || 'null') || fallback;
        } catch {
            return fallback;
        }
    },
    save(key, record) {
        localStorage.setItem(`gymtrack_${key}`, JSON.stringify(record));
        window.GymTrackProfile?.scheduleProfileSync();
    },
    clearAll() {
        ['workouts', 'routines', 'exercises', 'settings', 'profile'].forEach((key) => localStorage.removeItem(`gymtrack_${key}`));
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await window.GymTrackProfile?.waitForProfileSync?.();

    // --- Referencias UI Preferencias ---
    const btnKg = document.getElementById('btn-unit-kg');
    const btnLb = document.getElementById('btn-unit-lb');
    const selectRest = document.getElementById('select-rest');
    const toggleSound = document.getElementById('toggle-sound');
    const togglePublic = document.getElementById('toggle-public');
    const btnLogout = document.getElementById('btn-logout');

    // --- Referencias UI Perfil ---
    const btnEditProfile = document.getElementById('btn-edit-profile');
    const modalProfile = document.getElementById('profile-modal');
    const formProfile = document.getElementById('profile-form');
    const btnCloseProfile = document.getElementById('btn-close-profile');
    
    const inputName = document.getElementById('input-profile-name');
    const inputEmail = document.getElementById('input-profile-email');
    const inputTitle = document.getElementById('input-profile-title');

    // Elementos donde se muestra el perfil en la pantalla
    const displayName = document.getElementById('display-name');
    const displayEmail = document.getElementById('display-email');
    const logoutEmailText = document.getElementById('logout-email-text');
    
    // --- ESTADO BASE ---
    let settings = storage.get('settings', {
        unit: 'kg', restTime: '90s', sound: true, public: false
    });

    let userProfile = storage.get('profile', {
        name: 'Alex Rivera', 
        email: 'alex.rivera_performance@gymtrack.com', 
        title: 'Pro Member'
    });

    window.addEventListener('gymtrack:profile-updated', ({ detail }) => {
        if (!detail?.profile || !detail?.settings) return;
        userProfile = detail.profile;
        settings = detail.settings;
        applyProfileToUI();
        applySettingsToUI();
    });

    // --- FUNCIONES DE GUARDADO Y ACTUALIZACIÓN ---
    async function saveSettings() {
        storage.save('settings', settings);
    }

    async function saveProfile() {
        storage.save('profile', userProfile);
    }

    function applyProfileToUI() {
        // Actualizar Textos
        displayName.textContent = userProfile.name;
        displayEmail.textContent = userProfile.email;
        logoutEmailText.textContent = `Logueado como ${userProfile.email.split('@')[0]}`;
    }

    function applySettingsToUI() {
        // Unidades
        if (settings.unit === 'kg') {
            btnKg.className = "px-md py-1 rounded-md font-label-md transition-colors bg-primary text-on-primary";
            btnLb.className = "px-md py-1 rounded-md font-label-md transition-colors text-on-surface-variant hover:text-on-surface";
        } else {
            btnLb.className = "px-md py-1 rounded-md font-label-md transition-colors bg-primary text-on-primary";
            btnKg.className = "px-md py-1 rounded-md font-label-md transition-colors text-on-surface-variant hover:text-on-surface";
        }

        // Toggles y Select
        selectRest.value = settings.restTime;
        toggleSound.checked = settings.sound;
        togglePublic.checked = settings.public;
    }

    // --- EVENTOS DEL MODAL DE PERFIL ---
    function openProfileModal() {
        inputName.value = userProfile.name;
        inputEmail.value = userProfile.email;
        inputTitle.value = userProfile.title;
        modalProfile.classList.remove('hidden');
    }

    btnEditProfile.addEventListener('click', openProfileModal);

    btnCloseProfile.addEventListener('click', () => {
        modalProfile.classList.add('hidden');
    });

    formProfile.addEventListener('submit', (e) => {
        e.preventDefault();
        
        userProfile.name = inputName.value;
        userProfile.email = inputEmail.value;
        userProfile.title = inputTitle.value;

        saveProfile();
        applyProfileToUI();
        modalProfile.classList.add('hidden');
    });

    // --- EVENTOS DE CONFIGURACIÓN ---
    btnKg.addEventListener('click', () => { settings.unit = 'kg'; saveSettings(); applySettingsToUI(); });
    btnLb.addEventListener('click', () => { settings.unit = 'lb'; saveSettings(); applySettingsToUI(); });
    selectRest.addEventListener('change', (e) => { settings.restTime = e.target.value; saveSettings(); });
    toggleSound.addEventListener('change', (e) => { settings.sound = e.target.checked; saveSettings(); });
    togglePublic.addEventListener('change', (e) => { settings.public = e.target.checked; saveSettings(); });
    // Cerrar sesión
    btnLogout.addEventListener('click', async () => {
        if (confirm('¿Cerrar sesión? Esto reiniciará la configuración visual.')) {
            try {
                await signOutFromFirebase(window.GYMTRACK_CONFIG.firebaseConfig);
            } catch {
                alert('No se pudo cerrar la sesión de Firebase. Inténtalo de nuevo.');
                return;
            }
            storage.clearAll();
            window.location.assign('../login/login.html');
        }
    });

    // INICIALIZACIÓN
    applyProfileToUI();
    applySettingsToUI();
});
