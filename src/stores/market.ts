import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Producto } from '@/api/inventory'
import { db } from '@/firebase'
import { ref as dbRef, set } from 'firebase/database'
import { getAuth } from 'firebase/auth'

const INVALID_KEY_REGEX = new RegExp('[.#$\\[\\]/]', 'g')

// Sanitiza recursivamente y omite llaves vacías
const sanitizeForFirebase = (data: unknown): unknown => {
  if (data === null || data === undefined) return null
  if (typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map(sanitizeForFirebase)
  }

  const obj = data as Record<string, unknown>
  const sanitized: Record<string, unknown> = {}

  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (val !== undefined) {
      const cleanKey = key.replace(INVALID_KEY_REGEX, '_').trim()
      // Firebase NO permite llaves vacías. Si la llave está en blanco, se ignora.
      if (cleanKey !== '') {
        sanitized[cleanKey] = sanitizeForFirebase(val)
      }
    }
  }
  return sanitized
}

export const useMarketStore = defineStore('market', () => {
  const selectedCategory = ref<string>('Todas')
  const searchQuery = ref<string>('')
  const availableCategories = ref<string[]>(['Refacciones', 'Válvulas', 'Boquillas', 'Accesorios'])

  const selectedProduct = ref<Producto | null>(null)
  const isModalOpen = ref<boolean>(false)

  const setCategories = (categories: string[]) => {
    availableCategories.value = categories
  }

  const obtenerKeyValida = (producto: Producto): string => {
    const rawId = producto.id || producto.SKU || producto.Producto || 'item_sin_id'
    return String(rawId).replace(INVALID_KEY_REGEX, '_').trim()
  }

  const registrarHistorialFirebase = async (producto: Producto) => {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) return

    const idClave = obtenerKeyValida(producto)
    const productoLimpio = sanitizeForFirebase(producto)

    try {
      await set(dbRef(db, `historial/${user.uid}/${idClave}`), {
        ...(productoLimpio as Record<string, unknown>),
        vistoEn: Date.now(),
      })
    } catch (e) {
      console.error('[Firebase Error] No se pudo guardar en el historial:', e)
    }
  }

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
