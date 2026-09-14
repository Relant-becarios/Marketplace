import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { db } from '@/firebase'
import { ref as dbRef, get, set, remove } from 'firebase/database'
import { useAuthStore } from '@/stores/auth'
import type { Producto } from '@/api/inventory'

export const useFavoritesStore = defineStore('favorites', () => {
  const favoritos = ref<Producto[]>([])
  const authStore = useAuthStore()

  const obtenerKeyValida = (producto: Producto) => {
    const rawId = producto.id || producto.SKU || producto.Producto || 'item_sin_id'
    return String(rawId).replace(/[.#$/[\]]/g, '_')
  }

  // Cargar favoritos del usuario desde Firebase
  const cargarFavoritos = async () => {
    if (!authStore.usuarioActual) {
      favoritos.value = []
      return
    }
    const uid = authStore.usuarioActual.uid
    try {
      const snap = await get(dbRef(db, `favoritos/${uid}`))
      if (snap.exists()) {
        favoritos.value = Object.values(snap.val()) as Producto[]
      } else {
        favoritos.value = []
      }
    } catch (e) {
      console.error('Error cargando favoritos desde Firebase:', e)
    }
  }

  // Carga automáticamente los favoritos cuando se confirma la sesión del usuario
  watch(
    () => authStore.usuarioActual,
    (user) => {
      if (user) {
        cargarFavoritos()
      } else {
        favoritos.value = []
      }
    },
    { immediate: true },
  )

  // Alternar favorito (guardar / eliminar en Firebase)
  const toggleFavorito = async (producto: Producto) => {
    if (!authStore.usuarioActual) return
    const uid = authStore.usuarioActual.uid
    const idClave = obtenerKeyValida(producto)

    // Elimina valores 'undefined' para no romper la escritura en Firebase
    const productoLimpio = JSON.parse(JSON.stringify(producto))

    const index = favoritos.value.findIndex((item) => obtenerKeyValida(item) === idClave)

    if (index > -1) {
      // Eliminar de Firebase
      await remove(dbRef(db, `favoritos/${uid}/${idClave}`))
      favoritos.value.splice(index, 1)
    } else {
      // Guardar en Firebase
      await set(dbRef(db, `favoritos/${uid}/${idClave}`), productoLimpio)
      favoritos.value.push(producto)
    }
  }

  const esFavorito = (target: Producto | string) => {
    const targetId =
      typeof target === 'string' ? target.replace(/[.#$/[\]]/g, '_') : obtenerKeyValida(target)

    return favoritos.value.some((item) => obtenerKeyValida(item) === targetId)
  }

  return { favoritos, cargarFavoritos, toggleFavorito, esFavorito }
})
