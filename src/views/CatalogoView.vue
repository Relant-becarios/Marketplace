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
          :key="p?.id || p?.ID || index"
          class="m-item"
          @click="marketStore.openModal(p)"
        >
          <img :src="p.Imagen_URL || p.imagen || 'https://via.placeholder.com/150'" />
          <span>{{ p.Producto || 'Producto' }}</span>
        </div>
      </div>
    </div>

    <main class="grid-container">
      <div v-if="cargando" class="loading-msg">Realizando consulta al servidor...</div>

      <div v-else class="grid">
        <ProductCard
          v-for="(producto, index) in productos"
          :key="producto?.id || producto?.ID || index"
          :producto="producto"
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
import { ref, onMounted } from 'vue'
import { fetchProductos, type Producto } from '@/api/inventory'
import { useMarketStore } from '@/stores/market'
import ProductCard from '@/components/ProductCard.vue'
import ProductModal from '@/components/ProductModal.vue'
import NavBar from '@/components/NavBar.vue'

const productos = ref<Producto[]>([]) // Para la cuadrícula filtrada
const productosCarrusel = ref<Producto[]>([]) // Colección global e inmutable para el carrusel
const cargando = ref(true)
const marketStore = useMarketStore()

defineEmits(['toggle-cart'])

const cargarProductosDesdeAPI = async () => {
  cargando.value = true
  try {
    const data = await fetchProductos(marketStore.searchQuery, marketStore.selectedCategory)
    productos.value = data // Solo actualiza la cuadrícula de productos
  } catch (error) {
    console.error(error)
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  cargando.value = true
  try {
    const todosLosProductos = await fetchProductos()
    productosCarrusel.value = todosLosProductos // Conserva el catálogo completo para el carrusel
    productos.value = todosLosProductos

    const cats = [...new Set(todosLosProductos.map((p) => p.Categoria).filter(Boolean))] as string[]
    marketStore.setCategories(cats)
  } catch (error) {
    console.error(error)
  } finally {
    cargando.value = false
  }
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
