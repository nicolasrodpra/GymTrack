import '../main.js';

const storage = {
    getAll(key) {
        try {
            const records = JSON.parse(localStorage.getItem(`gymtrack_${key}`) || '[]');
            return Array.isArray(records) ? records : [];
        } catch {
            return [];
        }
    },
    save(key, record) {
        const records = storage.getAll(key);
        const data = {
            ...record,
            id: record.id || crypto.randomUUID(),
            createdAt: record.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const index = records.findIndex((item) => item.id === data.id);
        if (index >= 0) records[index] = { ...records[index], ...data };
        else records.push(data);
        localStorage.setItem(`gymtrack_${key}`, JSON.stringify(records));
        window.GymTrackProfile?.scheduleProfileSync();
        return data;
    },
    remove(key, id) {
        localStorage.setItem(`gymtrack_${key}`, JSON.stringify(storage.getAll(key).filter((item) => item.id !== id)));
        window.GymTrackProfile?.scheduleProfileSync();
    },
    clear(key) {
        localStorage.removeItem(`gymtrack_${key}`);
        window.GymTrackProfile?.scheduleProfileSync();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('workout-list');
    const modal = document.getElementById('crud-modal');
    const form = document.getElementById('crud-form');
    const idInput = document.getElementById('workout-id');
    const routineSelect = document.getElementById('workout-routine');
    const routineSummary = document.getElementById('selected-routine-summary');
    const weightFields = document.getElementById('workout-weight-fields');
    const openButton = document.getElementById('btn-add-workout');
    const closeButton = document.getElementById('btn-close-modal');
    const clearButton = document.getElementById('btn-clear-all');
    const heroButton = document.getElementById('btn-hero-add');
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);

    const closeModal = () => {
        modal.classList.add('hidden');
        form.reset();
        idInput.value = '';
        routineSummary.classList.add('hidden');
        weightFields.innerHTML = '<p class="rounded-lg border border-dashed border-outline-variant p-md text-center text-label-sm text-on-surface-variant">Elige una rutina para registrar los pesos por ejercicio.</p>';
    };
    const getRoutines = () => storage.getAll('routines');
    const getRoutineExercises = (routine) => {
        if (Array.isArray(routine?.exerciseList)) return routine.exerciseList;
        return Array.from({ length: Number(routine?.exercises) || 0 }, (_, index) => ({
            id: `${routine.id}-${index}`,
            name: `Ejercicio ${index + 1}`,
            muscle: routine.tag || 'General',
            sets: 3
        }));
    };
    const populateRoutineSelect = (selectedId = '') => {
        const routines = getRoutines();
        routineSelect.innerHTML = '<option value="">Selecciona una rutina</option>';
        routines.forEach((routine) => {
            const option = document.createElement('option');
            option.value = routine.id;
            option.textContent = routine.name;
            option.selected = routine.id === selectedId;
            routineSelect.append(option);
        });
        if (!routines.length) routineSelect.innerHTML = '<option value="">Primero crea una rutina</option>';
    };
    const renderWeightFields = (routineId, existingEntries = []) => {
        const routine = getRoutines().find((item) => item.id === routineId);
        if (!routine) {
            routineSummary.classList.add('hidden');
            weightFields.innerHTML = '<p class="rounded-lg border border-dashed border-outline-variant p-md text-center text-label-sm text-on-surface-variant">Selecciona una rutina válida.</p>';
            return;
        }
        const exercises = getRoutineExercises(routine);
        routineSummary.classList.remove('hidden');
        routineSummary.textContent = `${routine.name} · ${exercises.length} ejercicios · Solo registra el peso usado en cada uno.`;
        weightFields.replaceChildren();
        exercises.forEach((exercise, index) => {
            const previous = existingEntries.find((entry) => entry.exerciseId === exercise.id);
            const row = document.createElement('label');
            row.className = 'block rounded-lg border border-outline-variant bg-surface-container-low p-md';
            row.innerHTML = `
                <span class="flex items-center justify-between gap-sm">
                    <span>
                        <span class="block font-label-md text-on-surface">${escapeHtml(exercise.name)}</span>
                        <span class="text-label-sm text-on-surface-variant">${escapeHtml(exercise.muscle)} · ${Number(exercise.sets) || 0} series</span>
                    </span>
                    <input class="form-field max-w-[130px]" type="number" min="0" step="0.5" placeholder="kg" required data-exercise-index="${index}" value="${escapeHtml(previous?.weight || '')}">
                </span>
            `;
            weightFields.append(row);
        });
    };
    const openModal = (workout = null) => {
        populateRoutineSelect(workout?.routineId);
        modal.classList.remove('hidden');
        if (workout) {
            idInput.value = workout.id;
            renderWeightFields(workout.routineId, workout.entries || []);
        }
    };
    const formatDate = (value) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value));
    const render = async () => {
        const workouts = storage.getAll('workouts');
        workouts.sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt));
        document.getElementById('metric-workouts').textContent = workouts.length;
        document.getElementById('metric-minutes').textContent = workouts.reduce((total, workout) => total + (Number(workout.duration) || 0), 0).toLocaleString('es-CO');
        document.getElementById('metric-calories').textContent = workouts.reduce((total, workout) => {
            const sessionWeight = (workout.entries || []).reduce((entryTotal, entry) => entryTotal + (Number(entry.weight) || 0), 0);
            return total + sessionWeight;
        }, 0).toLocaleString('es-CO');
        list.replaceChildren();
        if (!workouts.length) {
            list.innerHTML = '<div class="empty-state rounded-xl p-xl text-center"><span class="material-symbols-outlined text-primary text-4xl">fitness_center</span><p class="mt-sm text-on-surface">Tu historial está listo para comenzar.</p><p class="mt-xs text-label-md text-on-surface-variant">Registra tu primera sesión desde el botón +.</p></div>';
            return;
        }
        workouts.forEach((workout) => {
            const item = document.createElement('article');
            item.className = 'surface-card p-md rounded-xl flex items-center justify-between gap-md transition-colors';
            const details = document.createElement('div');
            details.innerHTML = `<p class="font-label-md text-on-surface"></p><p class="text-label-sm text-on-surface-variant"></p>`;
            details.children[0].textContent = workout.name;
            details.children[1].textContent = `${workout.entries?.length || 0} ejercicios · ${formatDate(workout.createdAt || workout.updatedAt)}`;
            const actions = document.createElement('div');
            actions.className = 'flex gap-sm';
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'icon-action-button icon-action-edit';
            edit.setAttribute('aria-label', `Editar ${workout.name}`);
            edit.title = 'Editar entrenamiento';
            edit.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">edit</span>';
            edit.addEventListener('click', () => {
                openModal(workout);
            });
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'icon-action-button icon-action-delete';
            del.setAttribute('aria-label', `Eliminar ${workout.name}`);
            del.title = 'Eliminar entrenamiento';
            del.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">delete</span>';
            del.addEventListener('click', async () => { if (confirm('¿Eliminar este entrenamiento?')) { storage.remove('workouts', workout.id); await render(); } });
            actions.append(edit, del); item.append(details, actions); list.append(item);
        });
    };

    try {
        await render();
    } catch (error) {
        console.error(error);
        list.innerHTML = '<p class="text-error text-center py-8">No se pudo abrir la base de datos del navegador.</p>';
    }
    window.addEventListener('gymtrack:profile-updated', () => { render(); });
    openButton.addEventListener('click', () => openModal());
    heroButton.addEventListener('click', () => openModal());
    closeButton.addEventListener('click', closeModal);
    routineSelect.addEventListener('change', () => renderWeightFields(routineSelect.value));
    modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const routine = getRoutines().find((item) => item.id === routineSelect.value);
        if (!routine) return;
        const exercises = getRoutineExercises(routine);
        const entries = exercises.map((exercise, index) => {
            const input = weightFields.querySelector(`[data-exercise-index="${index}"]`);
            return {
                exerciseId: exercise.id,
                name: exercise.name,
                muscle: exercise.muscle,
                sets: Number(exercise.sets) || 0,
                weight: Number(input?.value) || 0
            };
        });
        storage.save('workouts', {
            id: idInput.value || undefined,
            routineId: routine.id,
            name: routine.name,
            duration: entries.reduce((total, entry) => total + entry.sets, 0) * 4,
            calories: 0,
            entries,
            createdAt: idInput.value ? undefined : new Date().toISOString()
        });
        closeModal(); await render();
    });
    clearButton.addEventListener('click', async () => { if (confirm('¿Borrar todo el historial?')) { storage.clear('workouts'); await render(); } });
});
