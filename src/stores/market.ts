import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProductos, type Producto } from '@/api/inventory'
import { db } from '@/firebase'
import { ref as dbRef, onValue, update } from 'firebase/database'

// Interfaz estricta para que TS conozca las columnas de Sheets
type ProductoExtendido = Producto & {
  SKU?: string | number
  ID?: string | number
  'no. De parte'?: string | number
  NO_DE_PARTE?: string | number
  Stock?: string | number
}

export const useMarketStore = defineStore('market', () => {
  const productos = ref<Producto[]>([])
  const cargando = ref(false)
  const productoSeleccionado = ref<Producto | null>(null)
  const isModalOpen = ref(false)

  const cargarProductos = async () => {
    cargando.value = true
    try {
      const dataSheets = await fetchProductos()

      onValue(dbRef(db, 'inventario'), (snapshot) => {
        const inventarioFb = snapshot.val() || {}
        const actualizacionesNuevas: Record<string, number> = {}

        const dataMezclada = dataSheets.map((prod) => {
          const pExt = prod as ProductoExtendido
          const key = String(pExt.id || pExt.SKU || pExt['no. De parte'] || pExt.NO_DE_PARTE || '')
            .trim()
            .toLowerCase()

          if (inventarioFb[key] !== undefined) {
            return { ...prod, Stock: inventarioFb[key] }
          } else {
            const stockInicial = Number(pExt.Stock) || 0
            actualizacionesNuevas[key] = stockInicial
            return { ...prod, Stock: stockInicial }
          }
        })

        if (Object.keys(actualizacionesNuevas).length > 0) {
          update(dbRef(db, 'inventario'), actualizacionesNuevas)
        }

        productos.value = dataMezclada

        if (productoSeleccionado.value) {
          const selExt = productoSeleccionado.value as ProductoExtendido
          const selKey = String(
            selExt.id || selExt.SKU || selExt['no. De parte'] || selExt.NO_DE_PARTE || '',
          )
            .trim()
            .toLowerCase()

          const prodEnVivo = dataMezclada.find((p) => {
            const pExt2 = p as ProductoExtendido
            const pKey = String(
              pExt2.id || pExt2.SKU || pExt2['no. De parte'] || pExt2.NO_DE_PARTE || '',
            )
              .trim()
              .toLowerCase()
            return pKey === selKey
          })

          if (prodEnVivo && selExt.Stock !== undefined) {
            productoSeleccionado.value.Stock = prodEnVivo.Stock
          }
        }
      })
    } catch (error: unknown) {
      console.error('Error al cargar productos en el store:', error)
    } finally {
      cargando.value = false
    }
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
    openModal,
    closeModal,
  }
})
