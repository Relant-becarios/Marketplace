<template>
  <div class="product-card" @click="openModal">
    <!-- BOTÓN DE FAVORITOS -->
    <button
      class="btn-fav"
      :class="{ active: isFav }"
      @click.stop="handleToggleFav"
      title="Añadir a Favoritos"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        :fill="isFav ? '#ff0000' : 'none'"
        :stroke="isFav ? '#ff0000' : 'currentColor'"
        stroke-width="2"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        ></path>
      </svg>
    </button>

    <div class="img-wrapper">
      <img
        :src="producto.Imagen_URL || 'https://via.placeholder.com/200'"
        :alt="producto.Producto"
      />
    </div>

    <div class="card-body">
      <span class="category-badge">{{ producto.Categoría || 'General' }}</span>
      <h3 class="product-title">{{ producto.Producto }}</h3>
      <p class="sku-text">SKU: {{ producto.SKU || 'N/A' }}</p>

      <div class="card-footer">
        <span class="price">${{ Number(producto.Precio || 0).toFixed(2) }} USD</span>
        <button class="btn-cart-add" @click.stop="agregarAlCarrito">Añadir</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Producto } from '@/api/inventory'
import { useMarketStore } from '@/stores/market'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{
  producto: Producto
}>()

const marketStore = useMarketStore()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const isFav = computed(() => favoritesStore.esFavorito(props.producto))

const handleToggleFav = () => {
  if (!authStore.usuarioActual) {
    uiStore.toggleAuthModal()
    return
  }
  favoritesStore.toggleFavorito(props.producto)
}

const openModal = () => {
  marketStore.openModal(props.producto)
}

const agregarAlCarrito = () => {
  const idProducto = String(props.producto.id || props.producto.SKU || props.producto.Producto)
  cartStore.agregarProducto(idProducto)
  uiStore.toggleCart()
}
</script>

<style scoped>
.product-card {
  background: var(--bg-panel, #ffffff);
  border: 1px solid var(--border, #d1d5da);
  border-radius: 12px;
  padding: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.btn-fav {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 2;
  color: var(--text-muted, #6a737d);
  transition: transform 0.2s ease;
}

.btn-fav:hover {
  transform: scale(1.15);
}

.img-wrapper {
  width: 100%;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.img-wrapper img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.category-badge {
  font-size: 11px;
  font-weight: 800;
  color: #ff0000;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-title {
  font-size: 14px;
  font-weight: 700;
  margin: 6px 0 4px 0;
  line-height: 1.3;
  color: var(--text-main);
}

.sku-text {
  font-size: 11px;
  color: var(--text-muted, #6a737d);
  margin-bottom: 12px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.price {
  font-size: 16px;
  font-weight: 900;
  color: #ff0000;
}

.btn-cart-add {
  background: var(--bg-input, #eef2f5);
  color: var(--text-main);
  border: 1px solid var(--border, #d1d5da);
  padding: 6px 14px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cart-add:hover {
  background: #ff0000;
  color: #ffffff;
  border-color: #ff0000;
}
</style>
