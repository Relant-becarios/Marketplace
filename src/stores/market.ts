import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Producto } from '@/api/inventory'
import { db } from '@/firebase'
import { ref as dbRef, set } from 'firebase/database'
import { useAuthStore } from '@/stores/auth'

export const useMarketStore = defineStore('market', () => {
  const selectedCategory = ref<string>('Todas')
  const searchQuery = ref<string>('')
  const availableCategories = ref<string[]>(['Refacciones', 'Válvulas', 'Boquillas', 'Accesorios'])

  const selectedProduct = ref<Producto | null>(null)
  const isModalOpen = ref<boolean>(false)

  const setCategories = (categories: string[]) => {
    availableCategories.value = categories
  }

  // Guarda la interacción del usuario en la base de datos de Firebase
  const registrarHistorialFirebase = async (producto: Producto) => {
    const authStore = useAuthStore()
    if (!authStore.usuarioActual) return

    const uid = authStore.usuarioActual.uid
    const rawId = producto.id || producto.SKU || producto.Producto || 'item_sin_id'
    const idClave = String(rawId).replace(/[.#$/[\]]/g, '_')

    // Elimina valores 'undefined' antes de enviar a Firebase Realtime Database
    const productoLimpio = JSON.parse(JSON.stringify(producto))

    try {
      await set(dbRef(db, `historial/${uid}/${idClave}`), {
        ...productoLimpio,
        vistoEn: Date.now(),
      })
    } catch (e) {
      console.error('Error al registrar en historial de Firebase:', e)
    }
  }

  // Abre la ficha técnica y registra el producto en el historial del usuario
  const openModal = (producto: Producto) => {
    selectedProduct.value = producto
    isModalOpen.value = true
    registrarHistorialFirebase(producto)
  }

  const closeModal = () => {
    selectedProduct.value = null
    isModalOpen.value = false
  }

  return {
    selectedCategory,
    searchQuery,
    availableCategories,
    selectedProduct,
    isModalOpen,
    setCategories,
    openModal,
    closeModal,
    registrarHistorialFirebase,
  }
})
