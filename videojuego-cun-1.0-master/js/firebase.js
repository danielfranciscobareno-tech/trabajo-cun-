import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCoy4WjLnYucLeaAuE1tueGXPASgxL5R8A",
  authDomain: "programacion-avanzda.firebaseapp.com",
  projectId: "programacion-avanzda",
  storageBucket: "programacion-avanzda.firebasestorage.app",
  messagingSenderId: "925253342304",
  appId: "1:925253342304:web:3a6f28a343638f70a49f05",
  measurementId: "G-DH27HPTBL8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let isLoginMode = true;

const authModalEl = document.getElementById('authModal');
const authModal = authModalEl ? new bootstrap.Modal(authModalEl) : null;

const authForm = document.getElementById('authForm');
const authModalTitle = document.getElementById('authModalTitle');
const usernameGroup = document.getElementById('usernameGroup');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleText = document.getElementById('authToggleText');
const authError = document.getElementById('authError');

const logoutBtn = document.getElementById('logoutBtn');
const profileContainer = document.getElementById('profileContainer');
const userNameEl = document.getElementById('userName');
const userLevelEl = document.getElementById('userLevel');
const userAvatarEl = document.getElementById('userAvatar');

// Función para cambiar de diseño entre Login y Registro
function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  if (authError) authError.classList.add('d-none');

  if (isLoginMode) {
    if (authModalTitle) authModalTitle.textContent = "Iniciar Sesión";
    if (usernameGroup) usernameGroup.classList.add('d-none');
    if (authSubmitBtn) authSubmitBtn.textContent = "Ingresar";
    if (authToggleText) {
      authToggleText.innerHTML = '¿No tienes una cuenta? <a href="#" id="authToggleBtn" class="text-purple fw-bold">Regístrate aquí</a>';
    }
  } else {
    if (authModalTitle) authModalTitle.textContent = "Registrar Cuenta";
    if (usernameGroup) usernameGroup.classList.remove('d-none');
    if (authSubmitBtn) authSubmitBtn.textContent = "Crear Cuenta";
    if (authToggleText) {
      authToggleText.innerHTML = '¿Ya tienes cuenta? <a href="#" id="authToggleBtn" class="text-purple fw-bold">Inicia sesión aquí</a>';
    }
  }
}

// Escuchar clics en el enlace de alternar (delegación de eventos global)
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'authToggleBtn') {
    e.preventDefault();
    toggleAuthMode();
  }
});

// Enviar formulario (Login / Registro)
if (authForm) {
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (authError) authError.classList.add('d-none');

    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const usernameEl = document.getElementById('authUsername');
    const username = usernameEl ? usernameEl.value.trim() : '';

    try {
      if (isLoginMode) {
        // Iniciar Sesión en Firebase
        await signInWithEmailAndPassword(auth, email, password);
        if (authModal) authModal.hide();
        if (typeof showToast === 'function') showToast('¡Sesión iniciada correctamente!');
      } else {
        // Registrar Usuario en Firebase
        if (!username) {
          throw new Error("Por favor, ingresa un nombre de usuario.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Asignar el Gamertag / Nombre visible
        await updateProfile(user, { displayName: username });

        // Crear documento del usuario en Firestore
        await setDoc(doc(db, "users", user.uid), {
          username: username,
          email: email,
          level: "Nivel 1",
          createdAt: new Date().toISOString()
        });

        if (authModal) authModal.hide();
        if (typeof showToast === 'function') showToast('¡Cuenta registrada exitosamente!');
      }
    } catch (error) {
      if (authError) {
        let errorMsg = error.message;
        if (error.code === 'auth/email-already-in-use') errorMsg = "Este correo ya está registrado en Firebase.";
        if (error.code === 'auth/weak-password') errorMsg = "La contraseña debe tener al menos 6 caracteres.";
        if (error.code === 'auth/invalid-email') errorMsg = "Ingresa un correo electrónico válido.";
        if (error.code === 'auth/invalid-credential') errorMsg = "Correo o contraseña incorrectos.";

        authError.textContent = errorMsg;
        authError.classList.remove('d-none');
      }
    }
  });
}

// Observador de estado de autenticación (Actualiza interfaz)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const name = user.displayName || user.email.split('@')[0];
    if (userNameEl) userNameEl.textContent = name;
    if (userAvatarEl) userAvatarEl.textContent = name.charAt(0).toUpperCase();

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userLevelEl) {
        userLevelEl.textContent = userDoc.data().level || "Nivel 1";
      } else if (userLevelEl) {
        userLevelEl.textContent = "Nivel 1";
      }
    } catch (e) {
      if (userLevelEl) userLevelEl.textContent = "Nivel 1";
    }

    if (logoutBtn) logoutBtn.innerHTML = '<i class="fa-solid fa-arrow-right-from-bracket me-2"></i><span>Cerrar sesión</span>';
  } else {
    if (userNameEl) userNameEl.textContent = "Invitado";
    if (userLevelEl) userLevelEl.textContent = "Sin sesión";
    if (userAvatarEl) userAvatarEl.textContent = "G";
    if (logoutBtn) logoutBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket me-2"></i><span>Iniciar sesión</span>';
  }
});

// Botón de Cerrar Sesión / Abrir Modal
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (auth.currentUser) {
      signOut(auth);
      if (typeof showToast === 'function') showToast('Has cerrado sesión.');
    } else {
      if (authModal) authModal.show();
    }
  });
}

if (profileContainer) {
  profileContainer.addEventListener('click', () => {
    if (!auth.currentUser) {
      if (authModal) authModal.show();
    }
  });
}

export { auth, db };