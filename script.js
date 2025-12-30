// IMPORTANTE: Asegúrate que las rutas de las librerías coincidan con tu versión de firebase-config.js
import { auth, db, storage } from './firebaseconfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, deleteDoc, onSnapshot, collection } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const TOTAL_NUMEROS = 800;
const grid = document.getElementById('grid-container');
let numeroSeleccionado = null;
let modoAdmin = false;

// --- FUNCIONES DE INTERFAZ ---

const generarCuadros = () => {
    grid.innerHTML = '';
    for (let i = 1; i <= TOTAL_NUMEROS; i++) {
        const card = document.createElement('div');
        card.className = 'number-card';
        card.id = `num-${i}`;
        card.innerHTML = `<span>${i}</span>`;
        card.onclick = () => window.manejarClic(i);
        grid.appendChild(card);
    }
};

const escucharFirebase = () => {
    onSnapshot(collection(db, "rifa"), (snapshot) => {
        snapshot.forEach((doc) => {
            const num = doc.id;
            const data = doc.data();
            const card = document.getElementById(`num-${num}`);
            if (card) {
                card.classList.add('occupied');
                card.style.backgroundImage = `url('${data.imageUrl}')`;
                card.innerHTML = `<div class="overlay">${num}</div>`;
            }
        });
    });
};

// --- EXPOSICIÓN GLOBAL (Para que los botones funcionen) ---

window.manejarClic = (num) => {
    numeroSeleccionado = num;
    const card = document.getElementById(`num-${num}`);
    const ocupado = card.classList.contains('occupied');

    if (modoAdmin) {
        document.getElementById('admin-modal-title').innerText = `Gestionar #${num}`;
        document.getElementById('admin-upload-modal').classList.remove('hidden');
    } else if (ocupado) {
        const url = card.style.backgroundImage.slice(5, -2);
        window.openZoom(url);
    } else {
        alert("Número disponible. ¡Escríbenos por WhatsApp o Instagram para comprarlo!");
    }
};

window.openHelpModal = () => document.getElementById('help-modal').classList.remove('hidden');
window.closeHelpModal = () => document.getElementById('help-modal').classList.add('hidden');
window.openZoom = (url) => {
    document.getElementById('zoom-img').src = url;
    document.getElementById('zoom-modal').classList.remove('hidden');
};
window.closeZoom = () => document.getElementById('zoom-modal').classList.add('hidden');
window.closeAdminModal = () => document.getElementById('admin-upload-modal').classList.add('hidden');

// --- LÓGICA DE ADMINISTRADOR ---

window.intentarLoginAdmin = async () => {
    const user = document.getElementById('admin-user').value;
    const pass = document.getElementById('admin-pass').value;
    try {
        await signInWithEmailAndPassword(auth, user, pass);
        modoAdmin = true;
        document.body.style.border = "8px solid #9429298a";
        document.getElementById('admin-login-modal').classList.add('hidden');
        document.getElementById('admin-controls').classList.remove('hidden');
        alert("Modo Maestro Activado");
    } catch (e) { alert("Acceso denegado."); }
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'F9' && e.getModifierState('CapsLock')) {
        document.getElementById('admin-login-modal').classList.remove('hidden');
    }
});

window.salirModoAdmin = () => {
    modoAdmin = false;
    document.body.style.border = "none";
    document.getElementById('admin-controls').classList.add('hidden');
    alert("Has salido del modo administrador.");
};

// Herramienta de eliminación random para el sorteo
window.eliminarVariosRandom = () => {
    const cant = parseInt(document.getElementById('cantidad-eliminar').value);
    // Buscamos cuadros que no estén ocupados por fotos y que no hayan sido eliminados ya
    const disponibles = Array.from(document.querySelectorAll('.number-card:not(.occupied):not(.eliminated)'));

    if (!cant || cant > disponibles.length) {
        return alert("Cantidad no válida o no hay suficientes cuadros libres.");
    }

    for (let i = 0; i < cant; i++) {
        setTimeout(() => {
            const actuales = Array.from(document.querySelectorAll('.number-card:not(.occupied):not(.eliminated)'));
            const elegido = actuales[Math.floor(Math.random() * actuales.length)];
            
            if (elegido) {
                elegido.classList.add('eliminated');
                // Efecto visual de desvanecimiento
                elegido.style.opacity = "0";
                elegido.style.transform = "scale(0)";
                setTimeout(() => elegido.style.display = "none", 500);
            }
        }, i * 150); // El 150 le da un efecto de "cascada" al eliminar
    }
};

window.subirFotoAdmin = async () => {
    const file = document.getElementById('admin-file-input').files[0];
    if (!file) return alert("Selecciona una foto");

    // --- PROCESO DE COMPRESIÓN ---
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Forzamos un tamaño pequeño (ej: 400px) porque el cuadro en la web es chiquito
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    // Dibujamos la imagen centrada y recortada
    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, size, size);

    // Convertimos a Blob (formato comprimido)
    canvas.toBlob(async (blob) => {
        const storageRef = ref(storage, `rifa/n-${numeroSeleccionado}`);
        const snap = await uploadBytes(storageRef, blob); // Subimos el blob comprimido
        const url = await getDownloadURL(snap.ref);
        
        await setDoc(doc(db, "rifa", numeroSeleccionado.toString()), { imageUrl: url });
        window.closeAdminModal();
        alert("Número actualizado y foto optimizada");
    }, 'image/jpeg', 0.6); // 0.6 es el nivel de calidad (60%)
};

window.eliminarFotoAdmin = async () => {
    if (!confirm("¿Liberar número?")) return;
    await deleteDoc(doc(db, "rifa", numeroSeleccionado.toString()));
    const card = document.getElementById(`num-${numeroSeleccionado}`);
    card.classList.remove('occupied');
    card.style.backgroundImage = 'none';
    card.innerHTML = `<span>${numeroSeleccionado}</span>`;
    window.closeAdminModal();
};

window.aplicarFiltroDisponibles = () => {
    const check = document.getElementById('filter-check').checked;
    document.querySelectorAll('.number-card').forEach(c => {
        c.style.display = (check && c.classList.contains('occupied')) ? 'none' : 'flex';
    });
};

// --- ARRANQUE ---
generarCuadros();
escucharFirebase();