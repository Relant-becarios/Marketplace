<template>
  <div class="product-card" @click="marketStore.openModal(producto)">
    <div class="card-img-wrapper">
      <!-- BOTÓN DE FAVORITOS (CORAZÓN EN LA ESQUINA) -->
      <button
        class="btn-favorite"
        :class="{ active: favoritesStore.esFavorito(producto) }"
        @click.stop="favoritesStore.toggleFavorito(producto)"
        title="Guardar en favoritos"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          stroke="currentColor"
          stroke-width="2"
          :fill="favoritesStore.esFavorito(producto) ? '#ff0000' : 'none'"
        >
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </button>

      <img
        :src="producto.Imagen_URL || producto.imagen || 'https://via.placeholder.com/200'"
        :alt="producto.Producto"
      />
    </div>

    <div class="card-body">
      <span class="category-badge">{{ producto.Categoria || 'General' }}</span>
      <h3 class="product-title">{{ producto.Producto }}</h3>
      <p class="product-sku">SKU: {{ producto.id || producto.ID || 'N/A' }}</p>

      <div class="price-row">
        <span class="price-usd">${{ Number(producto.Precio || 0).toFixed(2) }} USD</span>
        <span class="price-mxn"> ~ ${{ (Number(producto.Precio || 0) * 20).toFixed(2) }} MXN </span>
      </div>

      <button class="btn-add-cart" @click.stop="agregarAlCarrito">AÑADIR AL CARRITO</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Producto } from '@/api/inventory'
import { useMarketStore } from '@/stores/market'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'

const props = defineProps<{
  producto: Producto
}>()

const marketStore = useMarketStore()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()

const agregarAlCarrito = () => {
  const prodId = String(props.producto.id || props.producto.ID || props.producto.Producto || '')
  if (prodId) {
    cartStore.agregarProducto(prodId)
  }
}
</script>

<style scoped>
.product-card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.card-img-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  box-sizing: border-box;
}

.card-img-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.btn-favorite {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border, #d1d5da);
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-favorite:hover {
  transform: scale(1.15);
  background: #ffffff;
}

.btn-favorite svg {
  stroke: #ff0000;
  transition: fill 0.2s ease;
}

.btn-favorite.active {
  border-color: #ff0000;
  background: #ffffff;
}

.card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.category-badge {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-title {
  font-size: 1rem;
  font-weight: 800;
  margin: 6px 0;
  line-height: 1.3;
}

.product-sku {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.price-row {
  margin-top: auto;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
}

.price-usd {
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--accent);
}

.price-mxn {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.btn-add-cart {
  background: var(--accent);
  color: #ffffff;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-add-cart:hover {
  background: var(--accent-hover, #b71c1c);
}
</style>
