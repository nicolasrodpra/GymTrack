import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { doc, getFirestore, onSnapshot, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const LOCAL_KEYS = ['profile', 'settings', 'routines', 'exercises', 'workouts'];
let syncState = null;
let queuedWrite = null;
let applyingRemoteData = false;
let profileReadyResolved = false;
let resolveProfileReady;
const profileReady = new Promise((resolve) => {
    resolveProfileReady = resolve;
});

function getFirebaseApp(firebaseConfig) {
    if (!firebaseConfig?.apiKey) throw new Error('Falta la configuración de Firebase.');
    return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export async function authenticateWithFirebase(firebaseConfig, email, password, mode) {
    const auth = getAuth(getFirebaseApp(firebaseConfig));
    const credential = mode === 'register'
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
}

export function getFirebaseUser(firebaseConfig) {
    const auth = getAuth(getFirebaseApp(firebaseConfig));
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

export async function signOutFromFirebase(firebaseConfig) {
    await signOut(getAuth(getFirebaseApp(firebaseConfig)));
}

function readLocal(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(`gymtrack_${key}`) || 'null') ?? fallback;
    } catch {
        return fallback;
    }
}

function writeLocal(key, value) {
    localStorage.setItem(`gymtrack_${key}`, JSON.stringify(value));
}

function readArray(key) {
    const value = readLocal(key, []);
    return Array.isArray(value) ? value : [];
}

function cleanText(value, fallback = '') {
    const text = String(value ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
    return text || fallback;
}

function cleanEmail(value, fallback = '') {
    const email = cleanText(value, fallback).toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : fallback;
}

function cleanNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? Number(number.toFixed(2)) : fallback;
}

function cleanInteger(value, fallback = 0) {
    const number = Math.round(Number(value));
    return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function initials(name) {
    return cleanText(name, 'Usuario').split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function normalizeRoutine(routine, index) {
    const exercises = Array.isArray(routine?.exerciseList) ? routine.exerciseList : [];
    return {
        id: cleanText(routine?.id, `routine-${index + 1}`),
        name: cleanText(routine?.name, 'Rutina sin nombre'),
        tag: cleanText(routine?.tag, 'General'),
        icon: cleanText(routine?.icon, 'fitness_center'),
        exerciseList: exercises.map((exercise, exerciseIndex) => ({
            id: cleanText(exercise?.id, `exercise-${exerciseIndex + 1}`),
            name: cleanText(exercise?.name, 'Ejercicio'),
            muscle: cleanText(exercise?.muscle, 'General'),
            sets: cleanInteger(exercise?.sets, 1)
        }))
    };
}

function normalizeExercise(exercise, index) {
    return {
        id: cleanText(exercise?.id, `exercise-${index + 1}`),
        name: cleanText(exercise?.name, 'Ejercicio'),
        target: cleanText(exercise?.target, 'General'),
        sets: cleanInteger(exercise?.sets, 1),
        reps: cleanInteger(exercise?.reps, 1),
        weight: cleanText(exercise?.weight, '0kg'),
        icon: cleanText(exercise?.icon, 'fitness_center')
    };
}

function normalizeWorkout(workout, index) {
    const entries = Array.isArray(workout?.entries) ? workout.entries : [];
    return {
        id: cleanText(workout?.id, `workout-${index + 1}`),
        routineId: cleanText(workout?.routineId),
        name: cleanText(workout?.name, 'Entrenamiento'),
        duration: cleanInteger(workout?.duration, 0),
        calories: cleanInteger(workout?.calories, 0),
        createdAt: cleanText(workout?.createdAt, new Date().toISOString()),
        updatedAt: cleanText(workout?.updatedAt, new Date().toISOString()),
        entries: entries.map((entry, entryIndex) => ({
            exerciseId: cleanText(entry?.exerciseId, `entry-${entryIndex + 1}`),
            name: cleanText(entry?.name, 'Ejercicio'),
            muscle: cleanText(entry?.muscle, 'General'),
            sets: cleanInteger(entry?.sets, 0),
            weight: cleanNumber(entry?.weight, 0)
        }))
    };
}

export function formatUserData(user) {
    const localProfile = readLocal('profile', {});
    const settings = readLocal('settings', {});
    const name = cleanText(localProfile.name, cleanText(user?.email?.split('@')[0], 'Usuario'));
    const email = cleanEmail(localProfile.email, cleanEmail(user?.email));
    const unit = settings.unit === 'lb' ? 'lb' : 'kg';

    return {
        schemaVersion: 1,
        profile: {
            name,
            email,
            title: cleanText(localProfile.title, 'Atleta Pro'),
            initials: initials(name)
        },
        settings: {
            unit,
            restTime: ['60s', '90s', '120s'].includes(settings.restTime) ? settings.restTime : '90s',
            sound: Boolean(settings.sound ?? true),
            public: Boolean(settings.public ?? false)
        },
        routines: readArray('routines').map(normalizeRoutine),
        exercises: readArray('exercises').map(normalizeExercise),
        workouts: readArray('workouts').map(normalizeWorkout)
    };
}

function normalizeRemoteData(data, user) {
    const sourceProfile = data?.profile || {};
    const sourceSettings = data?.settings || {};
    const name = cleanText(sourceProfile.name, cleanText(user?.email?.split('@')[0], 'Usuario'));
    return {
        schemaVersion: 1,
        profile: {
            name,
            email: cleanEmail(sourceProfile.email, cleanEmail(user?.email)),
            title: cleanText(sourceProfile.title, 'Atleta Pro'),
            initials: initials(name)
        },
        settings: {
            unit: sourceSettings.unit === 'lb' ? 'lb' : 'kg',
            restTime: ['60s', '90s', '120s'].includes(sourceSettings.restTime) ? sourceSettings.restTime : '90s',
            sound: Boolean(sourceSettings.sound ?? true),
            public: Boolean(sourceSettings.public ?? false)
        },
        routines: Array.isArray(data?.routines) ? data.routines.map(normalizeRoutine) : [],
        exercises: Array.isArray(data?.exercises) ? data.exercises.map(normalizeExercise) : [],
        workouts: Array.isArray(data?.workouts) ? data.workouts.map(normalizeWorkout) : []
    };
}

function updateProfileUi(profile) {
    document.querySelectorAll('[data-profile-name]').forEach((element) => { element.textContent = profile.name; });
    document.querySelectorAll('[data-profile-title]').forEach((element) => { element.textContent = profile.title; });
    document.querySelectorAll('[data-profile-email]').forEach((element) => { element.textContent = profile.email; });
    document.querySelectorAll('[data-profile-avatar]').forEach((element) => { element.textContent = profile.initials; });
    document.querySelectorAll('.app-sidebar p.font-label-md').forEach((element) => { element.textContent = profile.name; });
    document.querySelectorAll('.app-sidebar p.font-label-sm').forEach((element) => { element.textContent = profile.title; });
    document.querySelectorAll('.static-avatar').forEach((element) => { element.textContent = profile.initials; });
    document.querySelectorAll('#display-name').forEach((element) => { element.textContent = profile.name; });
    document.querySelectorAll('#display-email').forEach((element) => { element.textContent = profile.email; });
}

function emitProfileUpdate(data) {
    updateProfileUi(data.profile);
    window.dispatchEvent(new CustomEvent('gymtrack:profile-updated', { detail: data }));
}

function markProfileReady(data = null) {
    if (profileReadyResolved) return;
    profileReadyResolved = true;
    resolveProfileReady(data);
}

function applyRemoteData(data) {
    applyingRemoteData = true;
    LOCAL_KEYS.forEach((key) => writeLocal(key, data[key]));
    applyingRemoteData = false;
    emitProfileUpdate(data);
}

async function writeCurrentData() {
    if (!syncState || applyingRemoteData) return;
    const data = formatUserData(syncState.user);
    applyRemoteData(data);
    await setDoc(syncState.reference, { ...data, updatedAt: serverTimestamp() });
    markProfileReady(data);
}

export function scheduleProfileSync() {
    if (!syncState || applyingRemoteData) return;
    clearTimeout(queuedWrite);
    queuedWrite = window.setTimeout(() => {
        writeCurrentData().catch((error) => window.dispatchEvent(new CustomEvent('gymtrack:sync-error', { detail: error })));
    }, 250);
}

export function waitForProfileSync() {
    return profileReady;
}

export function initializeProfileSync(firebaseConfig, user) {
    if (!firebaseConfig?.apiKey || !user?.uid) return;
    const profileUser = { id: user.uid, email: user.email || '' };
    if (syncState?.user.id === profileUser.id) return;
    const app = getFirebaseApp(firebaseConfig);
    const database = getFirestore(app);
    const reference = doc(database, 'profiles', profileUser.id);
    syncState?.unsubscribe?.();
    syncState = { user: profileUser, reference, unsubscribe: null };
    syncState.unsubscribe = onSnapshot(reference, (snapshot) => {
        if (snapshot.exists()) {
            const remoteData = snapshot.data();
            const data = normalizeRemoteData(remoteData, profileUser);
            applyRemoteData(data);
            markProfileReady(data);
            return;
        }
        writeCurrentData().catch((error) => window.dispatchEvent(new CustomEvent('gymtrack:sync-error', { detail: error })));
    }, (error) => {
        markProfileReady(formatUserData(profileUser));
        window.dispatchEvent(new CustomEvent('gymtrack:sync-error', { detail: error }));
    });
}

window.GymTrackProfile = { formatUserData, scheduleProfileSync, waitForProfileSync };
