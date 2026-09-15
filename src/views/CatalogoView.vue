<template>
  <div class="home-view">
    <NavBar @toggle-cart="$emit('toggle-cart')" @buscar="cargarProductosDesdeAPI" />

    <header class="hero">
      <h1 class="hero-title-main">Fluid Dosing</h1>
      <p class="hero-subtitle">The Simplicity of an innovative solution</p>
    </header>

    <!-- CARRUSEL SIEMPRE MUESTRA TODOS LOS PRODUCTOS SIN FILTRAR -->
    <div class="marquee-section" v-if="productosCarrusel.length">
      <div class="marquee-track">
        <div
          v-for="(p, index) in productosCarrusel.slice(0, 15)"
          :key="getProductoKey(p, index)"
          class="m-item"
          @click="marketStore.openModal(p)"
        >
          <img :src="getImagenUrl(p)" :alt="getNombreProducto(p)" />
          <span>{{ getNombreProducto(p) }}</span>
        </div>
      </div>
    </div>

    <main class="grid-container">
      <div v-if="cargando" class="loading-msg">Realizando consulta al servidor...</div>

      <div v-else class="grid">
        <ProductCard
          v-for="(producto, index) in productos"
          :key="getProductoKey(producto, index)"
          :producto="normalizarProducto(producto)"
        />
        <div v-if="productos.length === 0" style="grid-column: 1 / -1; text-align: center">
          No se encontraron productos en la categoría o búsqueda seleccionada.
        </div>
      </div>
    </main>

    <ProductModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Producto } from '@/api/inventory'
import { useMarketStore, type ProductoExtendido } from '@/stores/market'
import ProductCard from '@/components/ProductCard.vue'
import ProductModal from '@/components/ProductModal.vue'
import NavBar from '@/components/NavBar.vue'

const marketStore = useMarketStore()

defineEmits(['toggle-cart'])

const cargando = computed(() => marketStore.cargando)

// Colección global e inmutable para el carrusel
const productosCarrusel = computed(() => marketStore.productos)

// Extrae de forma segura la URL de la imagen sin importar el nombre de la columna en Sheets
const getImagenUrl = (p: Producto): string => {
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

// Asegura que ProductCard reciba todas las variantes posibles de propiedades de imagen
const normalizarProducto = (p: Producto): Producto => {
  const imgUrl = getImagenUrl(p)
  return {
    ...p,
    Imagen_URL: imgUrl,
    Imagen: imgUrl,
    imagen: imgUrl,
  } as Producto
}

// Cuadrícula filtrada reactiva
const productos = computed(() => {
  return marketStore.productos.filter((p) => {
    const pExt = p as ProductoExtendido
    const busqueda = (marketStore.searchQuery || '').toLowerCase().trim()
    const categoria = marketStore.selectedCategory || ''

    const nombre = String(pExt.Producto || pExt.Descripcion || pExt.descripcion || '').toLowerCase()
    const sku = String(
      pExt.id || pExt.ID || pExt.SKU || pExt['no. De parte'] || pExt.NO_DE_PARTE || '',
    ).toLowerCase()
    const catProducto = String(pExt.Categoria || pExt.CATEGORIA || '')

    const coincideBusqueda = !busqueda || nombre.includes(busqueda) || sku.includes(busqueda)
    const coincideCategoria = !categoria || categoria === 'Todas' || catProducto === categoria

    return coincideBusqueda && coincideCategoria
  })
})

const getProductoKey = (p: Producto, index: number): string | number => {
  const pExt = p as ProductoExtendido
  return pExt.id || pExt.ID || pExt.SKU || index
}

const getNombreProducto = (p: Producto): string => {
  const pExt = p as ProductoExtendido
  return String(pExt.Producto || pExt.Descripcion || pExt.descripcion || 'Producto')
}

const cargarProductosDesdeAPI = () => {
  // La lista filtrada se recalcula automáticamente por la propiedad computada
}

onMounted(async () => {
  await marketStore.cargarProductos()
})
</script>

<style scoped>
.home-view {
  background: var(--bg-main);
  min-height: 100vh;
  color: var(--text-main);
}
.hero {
  height: 300px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background:
    linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
    url('https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200');
  background-size: cover;
  background-position: center;
}
.hero-title-main {
  font-size: 60px;
  font-weight: 900;
  color: white;
  margin: 0;
  letter-spacing: 5px;
  filter: drop-shadow(0 0 10px var(--accent));
  text-transform: uppercase;
}
.hero-subtitle {
  color: white;
  letter-spacing: 3px;
  font-weight: bold;
}
.grid-container {
  padding: 30px 5%;
  min-height: 50vh;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
.loading-msg {
  text-align: center;
  font-size: 1.5rem;
  color: var(--text-muted);
  margin-top: 50px;
}

.marquee-section {
  background: var(--bg-panel);
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  overflow: hidden;
  white-space: nowrap;
}
.marquee-track {
  display: flex;
  width: max-content;
  gap: 40px;
  animation: scroll 40s linear infinite;
}
.m-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  color: var(--text-main);
}
.m-item img {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  object-fit: cover;
  background: white;
}
@keyframes scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
</style>
