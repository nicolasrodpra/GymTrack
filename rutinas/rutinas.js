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
    replaceAll(key, records) {
        localStorage.setItem(`gymtrack_${key}`, JSON.stringify(records));
        window.GymTrackProfile?.scheduleProfileSync();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await window.GymTrackProfile?.waitForProfileSync?.();

    const grid = document.getElementById('routines-grid');
    const modal = document.getElementById('routine-modal');
    const form = document.getElementById('routine-form');
    const btnTopAdd = document.getElementById('btn-top-add');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalTitle = document.getElementById('modal-title');
    const btnAddExercise = document.getElementById('btn-add-routine-exercise');
    const exerciseList = document.getElementById('routine-exercises-list');

    const inputId = document.getElementById('routine-id');
    const inputName = document.getElementById('routine-name');
    const inputTag = document.getElementById('routine-tag');
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);

    const initialData = [
        {
            id: '1',
            name: 'Push Day',
            tag: 'Hipertrofia',
            color: 'primary',
            icon: 'fitness_center',
            exerciseList: [
                { id: '1-1', name: 'Press banca', muscle: 'Pecho', sets: 4 },
                { id: '1-2', name: 'Press militar', muscle: 'Hombro', sets: 3 },
                { id: '1-3', name: 'Fondos', muscle: 'Tríceps', sets: 3 }
            ]
        },
        {
            id: '2',
            name: 'Pull Day',
            tag: 'Fuerza',
            color: 'secondary',
            icon: 'reorder',
            exerciseList: [
                { id: '2-1', name: 'Dominadas', muscle: 'Espalda', sets: 4 },
                { id: '2-2', name: 'Remo con barra', muscle: 'Espalda', sets: 4 },
                { id: '2-3', name: 'Curl bíceps', muscle: 'Bíceps', sets: 3 }
            ]
        }
    ];

    let routines = storage.getAll('routines');
    if (!routines.length) {
        routines = initialData;
        saveRoutines();
    }

    function saveRoutines() {
        storage.replaceAll('routines', routines);
    }

    function getExercisesFromForm() {
        return [...exerciseList.querySelectorAll('.routine-exercise-row')].map((row, index) => ({
            id: row.dataset.exerciseId || `${Date.now()}-${index}`,
            name: row.querySelector('[data-field="name"]').value.trim(),
            muscle: row.querySelector('[data-field="muscle"]').value.trim(),
            sets: Number(row.querySelector('[data-field="sets"]').value) || 1
        })).filter((exercise) => exercise.name && exercise.muscle);
    }

    function addExerciseRow(exercise = {}) {
        const row = document.createElement('div');
        row.className = 'routine-exercise-row grid gap-sm rounded-lg p-sm md:grid-cols-[1.4fr_1fr_100px_44px]';
        row.dataset.exerciseId = exercise.id || '';
        row.innerHTML = `
            <input data-field="name" class="form-field mt-0" type="text" placeholder="Ejercicio" required value="${escapeHtml(exercise.name)}">
            <input data-field="muscle" class="form-field mt-0" type="text" placeholder="Músculo objetivo" required value="${escapeHtml(exercise.muscle)}">
            <input data-field="sets" class="form-field mt-0" type="number" min="1" placeholder="Series" required value="${exercise.sets || 3}">
            <button type="button" class="btn-remove-exercise icon-action-button icon-action-delete" aria-label="Eliminar ejercicio" title="Eliminar ejercicio">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;
        row.querySelector('.btn-remove-exercise').addEventListener('click', () => {
            if (exerciseList.children.length > 1) row.remove();
        });
        exerciseList.append(row);
    }

    function resetExerciseRows(exercises = []) {
        exerciseList.replaceChildren();
        const rows = exercises.length ? exercises : [{}, {}, {}];
        rows.forEach(addExerciseRow);
    }

    function openModal(routine = null) {
        modalTitle.textContent = routine ? 'Editar Rutina' : 'Nueva Rutina';
        inputId.value = routine?.id || '';
        inputName.value = routine?.name || '';
        inputTag.value = routine?.tag || '';
        resetExerciseRows(routine?.exerciseList || []);
        modal.classList.remove('hidden');
    }

    function closeModal() {
        modal.classList.add('hidden');
        form.reset();
        inputId.value = '';
        resetExerciseRows();
    }

    function renderRoutines() {
        grid.replaceChildren();
        routines.forEach((routine) => {
            const exercises = Array.isArray(routine.exerciseList) ? routine.exerciseList : [];
            const card = document.createElement('div');
            card.className = 'routine-card rounded-xl p-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full group';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-md">
                    <div class="p-sm bg-primary/10 rounded-lg">
                        <span class="material-symbols-outlined text-primary">${escapeHtml(routine.icon || 'fitness_center')}</span>
                    </div>
                    <span class="bg-surface-container-highest px-sm py-1 rounded text-[10px] font-bold text-primary uppercase tracking-widest">${escapeHtml(routine.tag || 'Rutina')}</span>
                </div>
                <h3 class="font-headline-md text-headline-md text-on-surface mb-xs">${escapeHtml(routine.name)}</h3>
                <div class="mb-lg space-y-xs text-on-surface-variant">
                    ${exercises.slice(0, 3).map((exercise) => `<p class="text-label-sm">${escapeHtml(exercise.name)} · ${escapeHtml(exercise.muscle)} · ${Number(exercise.sets) || 0} series</p>`).join('')}
                    ${exercises.length > 3 ? `<p class="text-label-sm text-primary">+${exercises.length - 3} ejercicios más</p>` : ''}
                </div>
                <div class="mt-auto flex justify-end gap-sm">
                    <button class="btn-edit icon-action-button icon-action-edit" data-id="${escapeHtml(routine.id)}" aria-label="Editar ${escapeHtml(routine.name)}" title="Editar rutina">
                        <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                    </button>
                    <button class="btn-delete icon-action-button icon-action-delete" data-id="${escapeHtml(routine.id)}" aria-label="Eliminar ${escapeHtml(routine.name)}" title="Eliminar rutina">
                        <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                </div>
            `;
            grid.append(card);
        });

        const addPlaceholder = document.createElement('button');
        addPlaceholder.type = 'button';
        addPlaceholder.className = 'border-2 border-dashed border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center text-center opacity-70 hover:opacity-100 hover:border-primary transition-all cursor-pointer group min-h-[220px]';
        addPlaceholder.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center mb-md group-hover:bg-primary-container group-hover:text-on-primary-container transition-all">
                <span class="material-symbols-outlined">add</span>
            </div>
            <p class="font-label-md text-on-surface-variant">Nueva Rutina</p>
        `;
        addPlaceholder.addEventListener('click', () => openModal());
        grid.append(addPlaceholder);

        grid.querySelectorAll('.btn-delete').forEach((button) => button.addEventListener('click', handleDelete));
        grid.querySelectorAll('.btn-edit').forEach((button) => button.addEventListener('click', handleEdit));
    }

    function handleEdit(event) {
        const routine = routines.find((item) => item.id === event.currentTarget.dataset.id);
        if (routine) openModal(routine);
    }

    function handleDelete(event) {
        if (!confirm('¿Eliminar esta rutina?')) return;
        routines = routines.filter((item) => item.id !== event.currentTarget.dataset.id);
        saveRoutines();
        renderRoutines();
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const exerciseListData = getExercisesFromForm();
        if (!exerciseListData.length) {
            alert('Agrega al menos un ejercicio con músculo objetivo y series.');
            return;
        }
        const id = inputId.value || Date.now().toString();
        const routine = {
            id,
            name: inputName.value.trim(),
            tag: inputTag.value.trim(),
            color: 'primary',
            icon: 'fitness_center',
            exercises: String(exerciseListData.length),
            exerciseList: exerciseListData
        };
        const index = routines.findIndex((item) => item.id === id);
        if (index >= 0) routines[index] = routine;
        else routines.push(routine);
        saveRoutines();
        renderRoutines();
        closeModal();
    });

    btnTopAdd.addEventListener('click', () => openModal());
    btnAddExercise.addEventListener('click', () => addExerciseRow());
    btnCloseModal.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    window.addEventListener('gymtrack:profile-updated', () => {
        routines = storage.getAll('routines');
        renderRoutines();
    });

    renderRoutines();
});
