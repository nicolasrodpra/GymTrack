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
    
    // UI Elements
    const tbody = document.getElementById('exercises-list');
    const modal = document.getElementById('exercise-modal');
    const form = document.getElementById('exercise-form');
    const btnAdd = document.getElementById('btn-add-exercise');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalTitle = document.getElementById('modal-title');
    const exerciseCount = document.getElementById('exercise-count');
    const totalVolumeEl = document.getElementById('total-volume');

    // Inputs
    const inputId = document.getElementById('exercise-id');
    const inputName = document.getElementById('exercise-name');
    const inputTarget = document.getElementById('exercise-target');
    const inputSets = document.getElementById('exercise-sets');
    const inputReps = document.getElementById('exercise-reps');
    const inputWeight = document.getElementById('exercise-weight');
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);

    // Estado inicial de ejemplo (Si el localStorage está vacío)
    const initialData = [
        { id: '1', name: 'Press de Banca', target: 'Pecho / Barra', sets: 4, reps: 8, weight: '80kg', icon: 'line_weight' },
        { id: '2', name: 'Press Militar', target: 'Hombros / Barra', sets: 3, reps: 10, weight: '40kg', icon: 'fitness_center' },
        { id: '3', name: 'Fondos en Paralelas', target: 'Tríceps / Corporal', sets: 3, reps: 12, weight: 'BW', icon: 'exercise' }
    ];

    // Cargar datos
    let exercises = storage.getAll('exercises');
    if (!exercises.length) {
        exercises = initialData;
        saveToLocalStorage();
    }

    function saveToLocalStorage() {
        storage.replaceAll('exercises', exercises);
    }

    // Calcular volumen total (Ignorando 'BW' o letras, sumando solo números reales)
    function calculateVolume() {
        let volume = 0;
        exercises.forEach(ex => {
            const weightNum = parseFloat(ex.weight.replace(/[^\d.-]/g, '')) || 0;
            const sets = parseInt(ex.sets) || 0;
            const reps = parseInt(ex.reps) || 0;
            volume += (sets * reps * weightNum);
        });
        // Formatear número con comas
        totalVolumeEl.textContent = volume.toLocaleString('en-US');
    }

    // Renderizar Tabla
    function renderExercises() {
        tbody.innerHTML = ''; 

        if (exercises.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-on-surface-variant">No hay ejercicios agregados.</td></tr>`;
        }

        exercises.forEach(ex => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-surface-variant/30 transition-colors group";
            
            // Decidir color de fondo del peso dependiendo de si es "BW" (Bodyweight) o kg
            const weightStyle = ex.weight.toUpperCase() === 'BW' 
                ? 'bg-surface-variant text-on-surface-variant' 
                : 'bg-primary-container/20 text-primary-fixed border border-primary/30';

            tr.innerHTML = `
                <td class="px-lg py-lg">
                    <div class="flex items-center gap-md">
                        <div class="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary">${escapeHtml(ex.icon || 'fitness_center')}</span>
                        </div>
                        <div>
                            <p class="font-headline-sm text-on-surface">${escapeHtml(ex.name)}</p>
                            <p class="text-on-surface-variant text-label-sm">${escapeHtml(ex.target)}</p>
                        </div>
                    </div>
                </td>
                <td class="px-lg py-lg text-center font-headline-sm text-on-surface">${Number(ex.sets) || 0}</td>
                <td class="px-lg py-lg text-center font-headline-sm text-on-surface">${Number(ex.reps) || 0}</td>
                <td class="px-lg py-lg text-center">
                    <span class="inline-block px-md py-xs rounded-full font-bold ${weightStyle}">${escapeHtml(ex.weight)}</span>
                </td>
                <td class="px-lg py-lg text-right">
                    <div class="flex justify-end gap-sm">
                        <button class="btn-edit icon-action-button icon-action-edit" data-id="${escapeHtml(ex.id)}" aria-label="Editar ${escapeHtml(ex.name)}" title="Editar ejercicio">
                            <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                        </button>
                        <button class="btn-delete icon-action-button icon-action-delete" data-id="${escapeHtml(ex.id)}" aria-label="Eliminar ${escapeHtml(ex.name)}" title="Eliminar ejercicio">
                            <span class="material-symbols-outlined" aria-hidden="true">delete</span>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Actualizar textos y métricas
        exerciseCount.textContent = `Mostrando ${exercises.length} ejercicios`;
        calculateVolume();

        // Asignar Eventos a botones
        document.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', handleDelete));
        document.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', handleEdit));
    }

    // Control del Modal
    function openModal(isEdit = false) {
        modal.classList.remove('hidden');
        modalTitle.textContent = isEdit ? 'Editar Ejercicio' : 'Agregar Ejercicio';
    }
    
    function closeModal() {
        modal.classList.add('hidden');
        form.reset();
        inputId.value = '';
    }

    // CREATE & UPDATE (Guardar Formulario)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = inputId.value;
        const name = inputName.value;
        const target = inputTarget.value;
        const sets = inputSets.value;
        const reps = inputReps.value;
        const weight = inputWeight.value;

        if (id) {
            // Actualizar
            const index = exercises.findIndex(e => e.id === id);
            if(index > -1) {
                exercises[index] = { ...exercises[index], name, target, sets, reps, weight };
            }
        } else {
            // Crear
            exercises.push({
                id: Date.now().toString(),
                name, target, sets, reps, weight,
                icon: 'fitness_center' // Ícono por defecto
            }); 
        }

        saveToLocalStorage();
        renderExercises();
        closeModal();
    });

    // UPDATE (Pre-cargar datos al editar)
    function handleEdit(e) {
        const id = e.currentTarget.getAttribute('data-id');
        const ex = exercises.find(e => e.id === id);
        
        if(ex) {
            inputId.value = ex.id;
            inputName.value = ex.name;
            inputTarget.value = ex.target;
            inputSets.value = ex.sets;
            inputReps.value = ex.reps;
            inputWeight.value = ex.weight;
            openModal(true);
        }
    }

    // DELETE (Borrar registro)
    async function handleDelete(e) {
        const id = e.currentTarget.getAttribute('data-id');
        if(confirm('¿Seguro que deseas eliminar este ejercicio de la rutina?')) {
            exercises = exercises.filter(e => e.id !== id);
            saveToLocalStorage();
            renderExercises();
        }
    }

    // Eventos Globales
    btnAdd.addEventListener('click', () => openModal(false));
    btnCloseModal.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        // Cerrar si se hace click fuera del formulario
        if(e.target === modal) closeModal();
    });

    window.addEventListener('gymtrack:profile-updated', () => {
        exercises = storage.getAll('exercises');
        renderExercises();
    });

    // Inicializar la tabla al cargar la página
    renderExercises();
});
