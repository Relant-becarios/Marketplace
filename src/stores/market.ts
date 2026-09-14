import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Producto } from '@/api/inventory'

function obtenerIdSeguro(p: unknown): string {
  if (!p) return ''
  if (typeof p === 'string') return p
  const item = p as Record<string, unknown>
  const raw =
    item.id ||
    item.ID ||
    item.sku ||
    item['no. De parte'] ||
    item['Producto '] ||
    item.Producto ||
    item.nombre ||
    ''
  return String(raw).trim()
}

function registrarEnHistorial(prod: Producto) {
  if (!prod) return
  const idProd = obtenerIdSeguro(prod)
  if (!idProd) return

  try {
    const raw = localStorage.getItem('relant_recent_items')
    const items: Record<string, unknown>[] = raw ? JSON.parse(raw) : []
    const filtrados = items.filter((item) => obtenerIdSeguro(item) !== idProd)

    const prodRecord = prod as Record<string, unknown>
    const itemGuardar = {
      id: idProd,
      Producto:
        prod.Producto || prodRecord['Producto '] || prodRecord.nombre || 'Producto sin título',
      Precio: Number(prod.Precio || 0),
      Imagen_URL:
        prod.Imagen_URL ||
        prodRecord['Imagen URL'] ||
        prodRecord.imagen ||
        'https://via.placeholder.com/150',
      Categoria: prod.Categoria || 'General',
    }

    filtrados.unshift(itemGuardar)
    localStorage.setItem('relant_recent_items', JSON.stringify(filtrados.slice(0, 20)))
  } catch (e) {
    console.error('Error guardando en historial:', e)
  }
}

export const useMarketStore = defineStore('market', () => {
  const searchQuery = ref('')
  const selectedCategory = ref('Todas')
  const availableCategories = ref<string[]>([])

  const isModalOpen = ref(false)
  const selectedProduct = ref<Producto | null>(null)

  function setCategories(cats: string[]) {
    availableCategories.value = cats
  }

  function openModal(producto: Producto) {
    selectedProduct.value = producto
    isModalOpen.value = true
    registrarEnHistorial(producto)
  }

  function closeModal() {
    isModalOpen.value = false
    setTimeout(() => {
      selectedProduct.value = null
    }, 300)
  }

  return {
    searchQuery,
    selectedCategory,
    availableCategories,
    isModalOpen,
    selectedProduct,
    setCategories,
    openModal,
    closeModal,
  }
})
