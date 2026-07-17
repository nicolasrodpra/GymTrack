import '../main.js';

const storage = {
    getAll(key) {
        try {
            const records = JSON.parse(localStorage.getItem(`gymtrack_${key}`) || '[]');
            return Array.isArray(records) ? records : [];
        } catch {
            return [];
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await window.GymTrackProfile?.waitForProfileSync?.();

    // 1. CARGAR HISTORIAL DINÁMICO
    const historyContainer = document.getElementById('history-container');
    
    // Obtenemos los entrenamientos creados en el Dashboard (Index)
    let savedWorkouts = storage.getAll('workouts');

    // Si no hay datos almacenados, inyectamos unos de ejemplo
    if (!savedWorkouts || savedWorkouts.length === 0) {
        savedWorkouts = [
            { name: 'Push Day - Hypertrophy', createdAt: new Date().toISOString(), duration: '65', entries: [{}, {}, {}], icon: 'calendar_today', color: 'text-primary' },
            { name: 'Leg Day - Strength', createdAt: new Date(Date.now() - 86400000).toISOString(), duration: '72', entries: [{}, {}, {}], icon: 'fitness_center', color: 'text-secondary' }
        ];
    }
    const formatDate = (value) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value || Date.now()));

    // Renderizar las filas dinámicamente
    if (historyContainer) {
        historyContainer.innerHTML = ''; // Limpiamos el texto de "Cargando..."

        savedWorkouts.forEach(workout => {
            const row = document.createElement('div');
            // Clases para el diseño y la transición de hover
            row.className = "history-row flex items-center justify-between p-md border-b border-outline-variant transition-colors cursor-pointer hover:bg-surface-variant/50";
            
            row.innerHTML = `
                <div class="flex items-center gap-md pointer-events-none">
                    <div class="bg-primary-container/20 p-sm rounded-lg">
                        <span class="material-symbols-outlined ${workout.color || 'text-primary'}">${workout.icon || 'calendar_today'}</span>
                    </div>
                    <div>
                        <p class="font-label-md text-label-md text-on-surface">${formatDate(workout.createdAt || workout.updatedAt)}</p>
                        <p class="font-body-md text-body-md text-on-surface-variant">${workout.name}</p>
                    </div>
                </div>
                <div class="text-right flex items-center gap-lg pointer-events-none">
                    <div class="hidden md:block">
                        <p class="font-label-sm text-label-sm text-outline">EJERCICIOS</p>
                        <p class="font-label-md text-label-md text-on-surface">${workout.entries?.length || 0}</p>
                    </div>
                    <span class="material-symbols-outlined text-outline">chevron_right</span>
                </div>
            `;
            
            // Efecto "pulsar" al hacer click en la fila
            row.style.transition = 'transform 0.1s ease-out, background-color 0.2s ease';
            row.addEventListener('mousedown', () => { row.style.transform = 'scale(0.98)'; });
            row.addEventListener('mouseup', () => { row.style.transform = 'scale(1)'; });
            row.addEventListener('mouseleave', () => { row.style.transform = 'scale(1)'; });

            // Agregar al contenedor
            historyContainer.appendChild(row);
        });
    }

    // 2. ANIMACIÓN DE BARRAS DE PROGRESO MUSCULAR
    // Retrasamos un poco la ejecución para que la animación sea visible al cargar
    setTimeout(() => {
        const progressBars = document.querySelectorAll('.progress-bar-animate');
        
        progressBars.forEach(bar => {
            // Extraer el porcentaje definido en Tailwind (ej: w-[85%]) usando una expresión regular
            const targetWidthMatch = bar.className.match(/w-\[[0-9]+%\]/);
            
            if (targetWidthMatch) {
                const targetClass = targetWidthMatch[0]; // Ej: "w-[85%]"
                
                // Remover la clase estática de Tailwind para evitar conflictos
                bar.classList.remove(targetClass);
                
                // Preparar la animación por CSS en línea
                bar.style.width = '0%';
                bar.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
                
                // Extraer solo el número con el % (ej: "85%")
                const widthValue = targetClass.replace('w-[', '').replace(']', '');
                
                // Aplicar el ancho real después de un breve momento para detonar la transición
                setTimeout(() => {
                    bar.style.width = widthValue;
                }, 50);
            }
        });
    }, 150);

});
