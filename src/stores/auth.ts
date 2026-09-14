import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth, db } from '@/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  type User,
} from 'firebase/auth'
import { ref as dbRef, set, get } from 'firebase/database'

export interface PerfilUsuario {
  uid: string
  email: string
  nombre: string
  apellidos: string
}

export const useAuthStore = defineStore('auth', () => {
  const usuarioActual = ref<User | null>(null)
  const perfil = ref<PerfilUsuario | null>(null)

  // Escuchar estado de sesión y cargar perfil
  onAuthStateChanged(auth, async (user) => {
    usuarioActual.value = user
    if (user) {
      await cargarPerfil(user.uid)
    } else {
      perfil.value = null
    }
  })

  const cargarPerfil = async (uid: string) => {
    try {
      const snap = await get(dbRef(db, `usuarios/${uid}`))
      if (snap.exists()) {
        perfil.value = snap.val()
      }
    } catch (e) {
      console.error('Error cargando perfil:', e)
    }
  }

  // Registrar con Nombre y Apellidos
  const registrar = async (email: string, pass: string, nombre: string, apellidos: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass)
    const nombreCompleto = `${nombre} ${apellidos}`.trim()
    await updateProfile(res.user, { displayName: nombreCompleto })

    const datosPerfil: PerfilUsuario = {
      uid: res.user.uid,
      email,
      nombre,
      apellidos,
    }

    await set(dbRef(db, `usuarios/${res.user.uid}`), datosPerfil)
    perfil.value = datosPerfil
  }

  // Iniciar sesión con Correo y Contraseña
  const iniciarSesion = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass)
  }

  // Iniciar sesión / Registro con Google
  const iniciarConGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const res = await signInWithPopup(auth, provider)

    // Si el usuario no tiene registro en RTDB, guardamos sus datos
    const snap = await get(dbRef(db, `usuarios/${res.user.uid}`))
    if (!snap.exists()) {
      const partesNombre = (res.user.displayName || '').split(' ')
      const nombre = partesNombre[0] || 'Usuario'
      const apellidos = partesNombre.slice(1).join(' ') || ''

      const datosPerfil: PerfilUsuario = {
        uid: res.user.uid,
        email: res.user.email || '',
        nombre,
        apellidos,
      }
      await set(dbRef(db, `usuarios/${res.user.uid}`), datosPerfil)
      perfil.value = datosPerfil
    }
  }

  const cerrarSesion = async () => {
    await signOut(auth)
  }

  return {
    usuarioActual,
    perfil,
    registrar,
    iniciarSesion,
    iniciarConGoogle,
    cerrarSesion,
  }
})
