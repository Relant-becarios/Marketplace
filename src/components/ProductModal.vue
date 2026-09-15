<template>
  <div v-if="marketStore.isModalOpen" class="modal-overlay" @click.self="marketStore.closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 style="color: var(--accent); margin: 0; letter-spacing: 1px;">FICHA TÉCNICA</h2>
        <span @click="marketStore.closeModal" class="close-btn">✕</span>
      </div>

      <div class="modal-body" v-if="producto">
        <!-- SECCIÓN DE GALERÍA DE IMÁGENES INTERACTIVA CON ZOOM -->
        <div class="modal-gallery">
          <!-- 1. VISTA PRINCIPAL GRANDE CON LUPA/ZOOM TIPO AMAZON -->
          <div
            class="main-img-box"
            @mousemove="handleMouseMove"
            @mouseleave="handleMouseLeave"
          >
            <img
              :src="imagenSeleccionada || 'https://via.placeholder.com/300'"
              class="modal-img-main"
              :style="zoomStyle"
            />
          </div>

          <!-- 2, 3, 4. MINIATURAS INTERACTIVAS -->
          <div v-if="galeria.length > 1" class="thumbnails-row">
            <div
              v-for="(img, idx) in galeria"
              :key="idx"
              :class="['thumb-card', { active: imagenSeleccionada === img.url }]"
              @click="imagenSeleccionada = img.url"
            >
              <img :src="img.url" :alt="img.label" />
              <span class="thumb-label">{{ img.label }}</span>
            </div>
          </div>
        </div>

        <!-- INFORMACIÓN Y DETALLES DEL PRODUCTO -->
        <div class="modal-info">
          <h3 class="producto-titulo">{{ producto.Producto || (producto as Record<string, unknown>)['Producto '] }}</h3>

          <p class="desc-text">
            {{ (producto as Record<string, unknown>).Descripción || (producto as Record<string, unknown>).Descripcion || (producto as Record<string, unknown>).Detalle || 'Sin descripción técnica registrada en la base de datos.' }}
          </p>

          <div class="specs-grid">
            <div class="spec-item">
              <strong>CATEGORÍA:</strong> <span>{{ producto.Categoria || 'N/A' }}</span>
            </div>
            <div class="spec-item">
              <strong>SKU / ID:</strong> <span>{{ producto.id || producto.ID || 'N/A' }}</span>
            </div>
            <div class="spec-item">
              <strong>NO. DE PARTE:</strong> <span>{{ (producto as Record<string, unknown>)['no. De parte'] || producto.id || 'N/A' }}</span>
            </div>
            <div class="spec-item">
              <strong>STOCK:</strong> <span>{{ producto.Stock ?? 0 }}</span>
            </div>
            <div class="spec-item">
              <strong>PRECIO:</strong> <span class="price-text">${{ Number(producto.Precio || 0).toFixed(2) }} USD</span>
            </div>

            <div class="spec-item" v-for="spec in especificacionesTecnicas" :key="spec.etiqueta">
              <strong>{{ spec.etiqueta.toUpperCase() }}:</strong> <span>{{ spec.valor }}</span>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-primary" @click="añadirAlCarrito">AÑADIR AL CARRITO DE COTIZACIÓN</button>

            <button class="btn-refacciones" @click="irARefacciones">
               VER KITS Y REFACCIONES (VISTA EXPLOSIONADA)
            </button>

            <button class="btn-secondary" @click="marketStore.closeModal">CERRAR FICHA TÉCNICA</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMarketStore } from '@/stores/market'
import { useCartStore } from '@/stores/cart'

const marketStore = useMarketStore()
const cartStore = useCartStore()
const router = useRouter()

// AQUÍ ESTABA EL ERROR: Cambiado a productoSeleccionado para coincidir con el store
const producto = computed(() => marketStore.productoSeleccionado)

// LÓGICA DE ZOOM INTERACTIVO TIPO AMAZON
const isZoomed = ref(false)
const transformOrigin = ref('center center')

const handleMouseMove = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement
  if (!target) return
  const { left, top, width, height } = target.getBoundingClientRect()
  const x = ((e.clientX - left) / width) * 100
  const y = ((e.clientY - top) / height) * 100
  transformOrigin.value = `${x.toFixed(2)}% ${y.toFixed(2)}%`
  isZoomed.value = true
}

const handleMouseLeave = () => {
  isZoomed.value = false
}

const zoomStyle = computed(() => {
  if (!isZoomed.value) {
    return {
      transform: 'scale(1)',
      transformOrigin: 'center center',
      transition: 'transform 0.2s ease, transform-origin 0.1s ease'
    }
  }
  return {
    transform: 'scale(2.5)',
    transformOrigin: transformOrigin.value,
    transition: 'transform 0.05s ease-out, transform-origin 0.05s ease-out'
  }
})

// CONSTRUCCIÓN DINÁMICA DE LA GALERÍA DE IMÁGENES
const galeria = computed(() => {
  if (!producto.value) return []
  const prod = producto.value as Record<string, unknown>
  const items: { label: string; url: string }[] = []

  const front = prod.Imagen_Front_URL || prod.Photo_front_url || prod.Photo_front || prod.Imagen_Front
  const back = prod.Imagen_Back_URL || prod.Photo_back_url || prod.Photo_back || prod.Imagen_Back
  const explosion = prod.Imagen_Explosionada_URL || prod.imagen_explosionada || prod.Diagrama
  const general = prod['Imagen URL'] || prod.Imagen_URL || prod.imagen

  if (front && typeof front === 'string' && front.startsWith('http')) {
    items.push({ label: 'Front', url: front })
  }
  if (back && typeof back === 'string' && back.startsWith('http')) {
    items.push({ label: 'Back', url: back })
  }
  if (explosion && typeof explosion === 'string' && explosion.startsWith('http')) {
    items.push({ label: 'Diagrama', url: explosion })
  }

  if (items.length === 0 && general && typeof general === 'string') {
    items.push({ label: 'Vista', url: general })
  }

  return items
})

const imagenSeleccionada = ref<string>('')

watch(
  () => producto.value,
  () => {
    isZoomed.value = false
    if (galeria.value.length > 0 && galeria.value[0]) {
      imagenSeleccionada.value = galeria.value[0].url
    } else {
      imagenSeleccionada.value = 'https://via.placeholder.com/300'
    }
  },
  { immediate: true }
)

const especificacionesTecnicas = computed(() => {
  if (!producto.value) return []

  const camposIgnorados = [
    'ID', 'id', 'Producto', 'Producto ', 'Descripción', 'Descripcion', 'Detalle',
    'Imagen_URL', 'Imagen URL', 'imagen', 'Precio', 'precio', 'Categoria', 'categoria',
    'Stock', 'stock', 'no. De parte', 'no. de parte', 'no_de_parte',
    'Kits', 'kits', 'Imagen_Explosionada_URL', 'imagen_explosionada',
    'Manual_URL', 'Plano_URL', 'Imagen_Front_URL', 'Imagen_Back_URL',
    'Photo_front', 'Photo_back', 'Photo_front_url', 'Photo_back_url',
    'Imagen_Front', 'Imagen_Back'
  ]

  const specs = []

  for (const [key, value] of Object.entries(producto.value)) {
    if (!camposIgnorados.includes(key) && value !== '' && value !== null && value !== undefined) {
      let etiquetaFormateada = key.replace(/_/g, ' ')
      etiquetaFormateada = etiquetaFormateada.charAt(0).toUpperCase() + etiquetaFormateada.slice(1)
      specs.push({ etiqueta: etiquetaFormateada, valor: value })
    }
  }

  return specs
})

const añadirAlCarrito = () => {
  if (producto.value) {
    const prodStrict = producto.value as Record<string, unknown>
    const id = prodStrict.id || prodStrict.ID || prodStrict.Producto || prodStrict['Producto ']
    cartStore.agregarProducto(String(id))
    alert('Producto añadido al carrito de cotización')
    marketStore.closeModal()
  }
}

const irARefacciones = () => {
  if (producto.value) {
    const prodStrict = producto.value as Record<string, unknown>
    const id = prodStrict.id || prodStrict.ID || prodStrict.Producto || prodStrict['Producto ']
    marketStore.closeModal()
    router.push(`/refacciones/${id}`)
  }
}
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
.modal-content { background: var(--bg-panel); width: 100%; max-width: 850px; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; color: var(--text-main); box-shadow: 0 20px 50px rgba(0,0,0,0.6); max-height: 90vh; overflow-y: auto; }
.modal-header { padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg-input); }
.close-btn { font-size: 24px; cursor: pointer; color: var(--text-muted); transition: 0.2s; }
.close-btn:hover { color: var(--accent); }
.modal-body { display: flex; flex-wrap: wrap; padding: 25px; gap: 25px; }

/* GALERÍA DE IMÁGENES CON ZOOM */
.modal-gallery { flex: 1; min-width: 280px; max-width: 350px; display: flex; flex-direction: column; gap: 12px; align-self: flex-start; }
.main-img-box {
  width: 100%;
  height: 320px;
  background: white;
  border-radius: 8px;
  padding: 10px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
  cursor: zoom-in;
  position: relative;
}
.modal-img-main {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  pointer-events: none;
  will-change: transform, transform-origin;
}

.thumbnails-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.thumb-card { width: 65px; height: 65px; background: white; border-radius: 6px; border: 2px solid var(--border); cursor: pointer; position: relative; flex-shrink: 0; overflow: hidden; padding: 4px; box-sizing: border-box; transition: all 0.2s ease; }
.thumb-card:hover { border-color: var(--text-muted); }
.thumb-card.active { border-color: var(--accent); box-shadow: 0 0 8px rgba(255, 0, 0, 0.4); }
.thumb-card img { width: 100%; height: 100%; object-fit: contain; }
.thumb-label { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0, 0, 0, 0.75); color: #fff; font-size: 8px; text-align: center; padding: 1px 0; font-weight: bold; }

/* INFORMACIÓN Y DETALLES */
.modal-info { flex: 1.5; min-width: 300px; display: flex; flex-direction: column; gap: 15px; }
.producto-titulo { font-size: 24px; font-weight: 800; margin: 0; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.5px; }
.desc-text { color: var(--text-muted); font-size: 14px; line-height: 1.6; margin: 0; background: var(--bg-input); padding: 12px; border-radius: 6px; border: 1px solid var(--border); }

/* CUADRÍCULA DE ESPECIFICACIONES */
.specs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; background: var(--bg-input); padding: 15px; border-radius: 6px; border: 1px solid var(--border); max-height: 250px; overflow-y: auto; }
.spec-item { font-size: 13px; line-height: 1.4; border-bottom: 1px dashed var(--border); padding-bottom: 5px; }
.spec-item:last-child { border-bottom: none; }

/* ETIQUETAS EN ROJO */
.spec-item strong {
  color: var(--accent, #d32f2f);
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  margin-bottom: 2px;
  font-weight: 800;
}

.price-text {
  font-weight: bold;
  color: var(--text-main);
}

.modal-actions { margin-top: 15px; display: flex; flex-direction: column; gap: 10px; }

/* BOTÓN PRINCIPAL CON HOVER PROTEGIDO */
.btn-primary {
  background: var(--accent, #d32f2f);
  color: #ffffff !important;
  border: none;
  padding: 14px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  font-size: 13px;
  letter-spacing: 0.5px;
}
.btn-primary:hover {
  background: var(--accent-hover, #b71c1c) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.4);
}

.btn-secondary { background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border); padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 13px; }
.btn-secondary:hover { background: var(--border); }
.btn-refacciones { background: #e0a800; color: #000; border: none; padding: 14px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 13px; letter-spacing: 0.5px; }
.btn-refacciones:hover { background: #c69500; box-shadow: 0 4px 12px rgba(224,168,0,0.3); }
</style>
