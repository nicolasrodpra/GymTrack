import { getFirebaseUser, initializeProfileSync } from './profile-sync.js';

export const GYMTRACK_CONFIG = Object.freeze({
    firebaseConfig: {
        apiKey: 'AIzaSyDnxkdcHLHbEM5bTEY9v_nY-9m2dtXT2l4',
        authDomain: 'gymtrack-db.firebaseapp.com',
        projectId: 'gymtrack-db',
        storageBucket: 'gymtrack-db.firebasestorage.app',
        messagingSenderId: '333014308540',
        appId: '1:333014308540:web:0afcc2fefaa22d696b62b9',
        measurementId: 'G-VKJWT2LCJE'
    }
});

window.GYMTRACK_CONFIG = GYMTRACK_CONFIG;

document.addEventListener('DOMContentLoaded', async () => {
    const isLoginView = window.location.pathname.includes('/login/');
    try {
        const firebaseUser = await getFirebaseUser(GYMTRACK_CONFIG.firebaseConfig);
        if (isLoginView) {
            if (firebaseUser) window.location.assign('/dashboard/dashboard.html');
            return;
        }
        if (!firebaseUser) {
            window.location.assign('/login/login.html');
            return;
        }
        initializeProfileSync(GYMTRACK_CONFIG.firebaseConfig, firebaseUser);
    } catch {
        if (!isLoginView) window.location.assign('/login/login.html');
    }
});
