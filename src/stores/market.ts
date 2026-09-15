import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProductos, type Producto } from '@/api/inventory'

export const useMarketStore = defineStore('market', () => {
  const productos = ref<Producto[]>([])
  const cargando = ref(false)
  const productoSeleccionado = ref<Producto | null>(null)
  const isModalOpen = ref(false)

  // Registro para neutralizar la caché de Google Sheets sin romper referencias
  const descuentosAcumulados = ref<Record<string, number>>({})

  const cargarProductos = async () => {
    cargando.value = true
    try {
      const data = await fetchProductos()

      // Mutamos directamente el objeto para NO perder la referencia del modal
      data.forEach((prod) => {
        const key = String(prod.id || prod.SKU || prod['no. De parte'] || prod.NO_DE_PARTE || '')
          .trim()
          .toLowerCase()
        const descontado = descuentosAcumulados.value[key] || 0
        if (descontado > 0 && prod.Stock !== undefined) {
          const stockActual = Number(prod.Stock) || 0
          prod.Stock = Math.max(0, stockActual - descontado)
        }
      })

      productos.value = data
    } catch (error) {
      console.error('Error al cargar productos en el store:', error)
    } finally {
      cargando.value = false
    }
  }

  // DESCUENTO INSTANTÁNEO EN MEMORIA LOCAL
  const descontarStockLocal = (itemsComprados: { id: string; cant: number }[]) => {
    if (!itemsComprados || !Array.isArray(itemsComprados)) return

    itemsComprados.forEach((item) => {
      const idBuscado = String(item.id).trim().toLowerCase()

      descuentosAcumulados.value[idBuscado] =
        (descuentosAcumulados.value[idBuscado] || 0) + item.cant

      const prod = productos.value.find((p) => {
        const pId = String(p.id || '')
          .trim()
          .toLowerCase()
        const pSKU = String(p.SKU || '')
          .trim()
          .toLowerCase()
        const pParte = String(p['no. De parte'] || p.NO_DE_PARTE || '')
          .trim()
          .toLowerCase()
        return pId === idBuscado || pSKU === idBuscado || pParte === idBuscado
      })

      if (prod && prod.Stock !== undefined) {
        const stockActual = Number(prod.Stock) || 0
        prod.Stock = Math.max(0, stockActual - item.cant)
      }

      if (productoSeleccionado.value) {
        const selKey = String(
          productoSeleccionado.value.id ||
            productoSeleccionado.value.SKU ||
            productoSeleccionado.value['no. De parte'] ||
            productoSeleccionado.value.NO_DE_PARTE ||
            '',
        )
          .trim()
          .toLowerCase()

        if (selKey === idBuscado && productoSeleccionado.value.Stock !== undefined) {
          const selStock = Number(productoSeleccionado.value.Stock) || 0
          productoSeleccionado.value.Stock = Math.max(0, selStock - item.cant)
        }
      }
    })
  }

  const openModal = (prod: Producto) => {
    productoSeleccionado.value = prod
    isModalOpen.value = true
  }

  const closeModal = () => {
    isModalOpen.value = false
    productoSeleccionado.value = null
  }

  return {
    productos,
    cargando,
    productoSeleccionado,
    isModalOpen,
    cargarProductos,
    descontarStockLocal,
    openModal,
    closeModal,
  }
})
