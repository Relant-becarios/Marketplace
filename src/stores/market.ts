import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProductos, type Producto } from '@/api/inventory'
import { db, auth } from '@/firebase'
import { ref as dbRef, onValue, update, set, get } from 'firebase/database'

export type ProductoExtendido = Producto & {
  ID?: string | number
  SKU?: string | number
  'no. De parte'?: string | number
  NO_DE_PARTE?: string | number
  Stock?: string | number
  Categoria?: string
  CATEGORIA?: string
  Imagen?: string
  imagen?: string
  IMAGEN?: string
  Imagen_URL?: string
  Foto?: string
  URL?: string
  url?: string
  Producto?: string
  Descripcion?: string
  descripcion?: string
  vistoEn?: number
}

export type ItemCarrito = ProductoExtendido & {
  cantidad: number
}

const HISTORIAL_KEY = 'relant_historial_navegacion'

export const useMarketStore = defineStore('market', () => {
  const productos = ref<Producto[]>([])
  const cargando = ref(false)
  const productoSeleccionado = ref<Producto | null>(null)
  const isModalOpen = ref(false)

  // Historial con persistencia local inmediata
  const historial = ref<ProductoExtendido[]>(
    (() => {
      try {
        const guardado = localStorage.getItem(HISTORIAL_KEY)
        return guardado ? JSON.parse(guardado) : []
      } catch {
        return []
      }
    })(),
  )

  const carrito = ref<ItemCarrito[]>([])
  const searchQuery = ref<string>('')
  const selectedCategory = ref<string>('')
  const categorias = ref<string[]>([])

  const resolverImagen = (p: Producto): string => {
    const pExt = p as ProductoExtendido
    const img =
      pExt.Imagen_URL ||
      pExt.Imagen ||
      pExt.imagen ||
      pExt.IMAGEN ||
      pExt.Foto ||
      pExt.URL ||
      pExt.url
    if (typeof img === 'string' && img.trim() !== '') {
      return img.trim()
    }
    return 'https://via.placeholder.com/150'
  }

  const registrarVisita = async (prod: Producto) => {
    const pExt = prod as ProductoExtendido
    const rawKey = String(
      pExt.id ||
        pExt.ID ||
        pExt.SKU ||
        pExt['no. De parte'] ||
        pExt.NO_DE_PARTE ||
        pExt.Producto ||
        '',
    ).trim()
    const key = rawKey
      .toLowerCase()
      .replace(/[.#$[\]]/g, '')
      .replaceAll('/', '')

    if (!key) return

    const itemConFecha: ProductoExtendido = {
      ...pExt,
      vistoEn: Date.now(),
    }

    // Actualiza el estado reactivo e impide duplicados (último visto primero)
    const filtrados = historial.value.filter((item) => {
      const itemKey = String(
        item.id ||
          item.ID ||
          item.SKU ||
          item['no. De parte'] ||
          item.NO_DE_PARTE ||
          item.Producto ||
          '',
      )
        .trim()
        .toLowerCase()
        .replace(/[.#$[\]]/g, '')
        .replaceAll('/', '')
      return itemKey !== key
    })

    historial.value = [itemConFecha, ...filtrados].slice(0, 20)
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial.value))

    // Guarda en Firebase si hay un usuario autenticado
    if (auth.currentUser) {
      try {
        await set(dbRef(db, `historial/${auth.currentUser.uid}/${key}`), itemConFecha)
      } catch (err: unknown) {
        console.error('Error al guardar historial en Firebase:', err)
      }
    }
  }

  const cargarHistorialFirebase = async () => {
    if (!auth.currentUser) return
    try {
      const snap = await get(dbRef(db, `historial/${auth.currentUser.uid}`))
      if (snap.exists()) {
        const itemsNube = Object.values(snap.val()) as ProductoExtendido[]

        // Fusión local y nube
        const mapa = new Map<string, ProductoExtendido>()
        itemsNube.concat(historial.value).forEach((item) => {
          const k = String(
            item.id ||
              item.ID ||
              item.SKU ||
              item['no. De parte'] ||
              item.NO_DE_PARTE ||
              item.Producto ||
              '',
          )
            .trim()
            .toLowerCase()
          if (!mapa.has(k) || (item.vistoEn || 0) > (mapa.get(k)?.vistoEn || 0)) {
            mapa.set(k, item)
          }
        })

        const ordenados = Array.from(mapa.values()).sort(
          (a, b) => (b.vistoEn || 0) - (a.vistoEn || 0),
        )
        historial.value = ordenados.slice(0, 20)
        localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial.value))
      }
    } catch (e: unknown) {
      console.error('Error cargando historial de la nube:', e)
    }
  }

  const openModal = (prod: Producto) => {
    productoSeleccionado.value = prod
    isModalOpen.value = true
    registrarVisita(prod)
  }

  const closeModal = () => {
    isModalOpen.value = false
    productoSeleccionado.value = null
  }

  const agregarAlCarrito = (prod: Producto, cantidadAgregar = 1) => {
    const pExt = prod as ProductoExtendido
    const idKey = String(
      pExt.id || pExt.ID || pExt.SKU || pExt['no. De parte'] || pExt.NO_DE_PARTE || '',
    )
    const stockMax = Number(pExt.Stock) || 0

    if (stockMax <= 0) return

    const itemExistente = carrito.value.find((item) => {
      const itemId = String(
        item.id || item.ID || item.SKU || item['no. De parte'] || item.NO_DE_PARTE || '',
      )
      return itemId === idKey
    })

    const imgUrl = resolverImagen(prod)

    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + cantidadAgregar
      itemExistente.cantidad = Math.min(nuevaCantidad, stockMax)
      itemExistente.Imagen_URL = imgUrl
    } else {
      carrito.value.push({
        ...pExt,
        cantidad: Math.min(cantidadAgregar, stockMax),
        Imagen_URL: imgUrl,
      })
    }
  }

  const actualizarCantidadCarrito = (idKey: string | number, nuevaCantidad: number) => {
    const targetKey = String(idKey)
    const item = carrito.value.find((i) => {
      const itemId = String(i.id || i.ID || i.SKU || i['no. De parte'] || i.NO_DE_PARTE || '')
      return itemId === targetKey
    })

    if (item) {
      const stockMax = Number(item.Stock) || 0
      item.cantidad = Math.max(1, Math.min(nuevaCantidad, stockMax))
    }
  }

  const eliminarDelCarrito = (idKey: string | number) => {
    const targetKey = String(idKey)
    carrito.value = carrito.value.filter((i) => {
      const itemId = String(i.id || i.ID || i.SKU || i['no. De parte'] || i.NO_DE_PARTE || '')
      return itemId !== targetKey
    })
  }

  const setCategories = (cats?: string[]) => {
    if (cats && Array.isArray(cats)) {
      categorias.value = cats
    } else {
      const catsSet = new Set(
        productos.value.map((p) => {
          const pExt = p as ProductoExtendido
          return String(pExt.Categoria || pExt.CATEGORIA || 'General')
        }),
      )
      categorias.value = Array.from(catsSet)
    }
  }

  const cargarProductos = async () => {
    cargando.value = true
    try {
      const dataSheets = await fetchProductos()

      onValue(dbRef(db, 'inventario'), (snapshot) => {
        const inventarioFb = snapshot.val() || {}
        const actualizacionesNuevas: Record<string, number> = {}

        const dataMezclada = dataSheets.map((prod) => {
          const pExt = prod as ProductoExtendido
          const rawKey = String(
            pExt.id || pExt.ID || pExt.SKU || pExt['no. De parte'] || pExt.NO_DE_PARTE || '',
          )
            .trim()
            .toLowerCase()
          const key = rawKey.replace(/[.#$[\]]/g, '').replaceAll('/', '')

          if (!key) return prod

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
        setCategories()
      })
    } catch (error: unknown) {
      console.error('Error al cargar productos en el store:', error)
    } finally {
      cargando.value = false
    }
  }

  return {
    productos,
    cargando,
    productoSeleccionado,
    isModalOpen,
    historial,
    carrito,
    searchQuery,
    selectedCategory,
    categorias,
    setCategories,
    cargarProductos,
    cargarHistorialFirebase,
    agregarAlCarrito,
    actualizarCantidadCarrito,
    eliminarDelCarrito,
    openModal,
    closeModal,
  }
})
