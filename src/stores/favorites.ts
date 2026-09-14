import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase'
import { ref as dbRef, get, set, remove } from 'firebase/database'
import { useAuthStore } from '@/stores/auth'
import type { Producto } from '@/api/inventory'

export const useFavoritesStore = defineStore('favorites', () => {
  const favoritos = ref<Producto[]>([])
  const authStore = useAuthStore()

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

  // Alternar favorito (guardar / eliminar en Firebase)
  const toggleFavorito = async (producto: Producto) => {
    if (!authStore.usuarioActual) return
    const uid = authStore.usuarioActual.uid
    const idClave = String(producto.id || producto.SKU || producto.Producto).replace(
      /[.#$/[\]]/g,
      '_',
    )

    const index = favoritos.value.findIndex(
      (item) =>
        String(item.id || item.SKU || item.Producto) ===
        String(producto.id || producto.SKU || producto.Producto),
    )

    if (index > -1) {
      // Eliminar de Firebase
      await remove(dbRef(db, `favoritos/${uid}/${idClave}`))
      favoritos.value.splice(index, 1)
    } else {
      // Guardar en Firebase
      await set(dbRef(db, `favoritos/${uid}/${idClave}`), producto)
      favoritos.value.push(producto)
    }
  }

  // Acepta tanto el objeto Producto como un string con el ID
  const esFavorito = (target: Producto | string) => {
    const targetId =
      typeof target === 'string' ? target : String(target.id || target.SKU || target.Producto)
    return favoritos.value.some((item) => String(item.id || item.SKU || item.Producto) === targetId)
  }

  return { favoritos, cargarFavoritos, toggleFavorito, esFavorito }
})
