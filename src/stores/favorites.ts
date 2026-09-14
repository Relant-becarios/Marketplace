import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { db, auth } from '@/firebase'
import { ref as dbRef, set, remove, get } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'

export interface ProductoFavorito {
  id?: string
  ID?: string
  Producto?: string
  nombre?: string
  Precio?: number
  Imagen_URL?: string
  imagen?: string
  Categoria?: string
  [key: string]: unknown
}

const STORAGE_KEY = 'relant_favorites'

function limpiarClaveFirebase(clave: string): string {
  return clave.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function obtenerIdSeguro(p: ProductoFavorito | string | undefined): string {
  if (typeof p === 'string') return p
  if (!p) return ''
  const item = p as Record<string, unknown>
  const rawId =
    item.id ||
    item.ID ||
    item.sku ||
    item['no. De parte'] ||
    item['Producto '] ||
    item.Producto ||
    item.nombre ||
    ''
  return String(rawId).trim()
}

export const useFavoritesStore = defineStore('favorites', () => {
  const favoritos = ref<ProductoFavorito[]>(
    (() => {
      try {
        const data = localStorage.getItem(STORAGE_KEY)
        return data ? JSON.parse(data) : []
      } catch {
        return []
      }
    })(),
  )

  const guardarLocal = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos.value))
  }

  watch(favoritos, () => guardarLocal(), { deep: true })

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const snap = await get(dbRef(db, `favoritos/${user.uid}`))
        const mapa = new Map<string, ProductoFavorito>()

        favoritos.value.forEach((item) => {
          const id = obtenerIdSeguro(item)
          if (id) mapa.set(id, item)
        })

        if (snap.exists() && snap.val()) {
          const nubeItems = Object.values(snap.val()) as ProductoFavorito[]
          nubeItems.forEach((item) => {
            const id = obtenerIdSeguro(item)
            if (id) mapa.set(id, item)
          })
        }

        favoritos.value = Array.from(mapa.values())
        guardarLocal()

        if (favoritos.value.length > 0) {
          const mapaFirebase: Record<string, ProductoFavorito> = {}
          favoritos.value.forEach((item) => {
            const id = obtenerIdSeguro(item)
            if (id) mapaFirebase[limpiarClaveFirebase(id)] = item
          })
          await set(dbRef(db, `favoritos/${user.uid}`), mapaFirebase)
        }
      } catch (e) {
        console.error('Error sincronizando favoritos:', e)
      }
    }
  })

  function esFavorito(productoOId: ProductoFavorito | string | undefined): boolean {
    const idTarget = obtenerIdSeguro(productoOId)
    if (!idTarget) return false
    return favoritos.value.some((p) => obtenerIdSeguro(p) === idTarget)
  }

  async function toggleFavorito(producto: ProductoFavorito | undefined) {
    if (!producto) return
    const idStr = obtenerIdSeguro(producto)
    if (!idStr) return

    const index = favoritos.value.findIndex((p) => obtenerIdSeguro(p) === idStr)
    const user = auth.currentUser
    const prodRecord = producto as Record<string, unknown>

    if (index >= 0) {
      favoritos.value.splice(index, 1)
      guardarLocal()
      if (user) {
        try {
          await remove(dbRef(db, `favoritos/${user.uid}/${limpiarClaveFirebase(idStr)}`))
        } catch (e) {
          console.error('Error al remover de Firebase:', e)
        }
      }
    } else {
      const itemGuardar: ProductoFavorito = {
        ...producto,
        id: idStr,
        Producto:
          producto.Producto || (prodRecord['Producto '] as string) || producto.nombre || 'Producto',
        Precio: Number(producto.Precio || 0),
        Imagen_URL:
          producto.Imagen_URL ||
          (prodRecord['Imagen URL'] as string) ||
          producto.imagen ||
          'https://via.placeholder.com/150',
      }

      favoritos.value.push(itemGuardar)
      guardarLocal()

      if (user) {
        try {
          await set(dbRef(db, `favoritos/${user.uid}/${limpiarClaveFirebase(idStr)}`), itemGuardar)
        } catch (e) {
          console.error('Error al guardar en Firebase:', e)
        }
      }
    }
  }

  return { favoritos, esFavorito, toggleFavorito }
})
