<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const paragraphs = [
  '①FBページに自分の作品を貼る',
  '②FB付箋をもらうことができる',
  '③投稿作品から様々な作品を見る',
  '④他の作品にFB付箋を送ってみる',
]

const categories = ['背景', 'キャラクター', '小物', 'アニメーション']

const navigateToCategory = (category) => {
  router.push({ name: 'Category', params: { name: category } })
}
</script>

<template>
  <main class="page">
    <header class="hero">
      <h1>
        <span>3D DESIGNER</span>
        <span>ROUTE</span>
      </h1>
    </header>

    <section class="card">
      <div class="section section--about">
        <h2 class="section__title">FB</h2>
        <hr />
        <div class="steps">
          <p v-for="text in paragraphs" :key="text">
            {{ text }}
          </p>
        </div>
        <hr />
      </div>

      <div class="actions">
        <button
          v-for="category in categories"
          :key="category"
          class="pill"
          @click="navigateToCategory(category)"
        >
          {{ category }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 4.5rem 1.5rem 5rem;
  background: #c1d0e8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
}

.hero {
  text-align: center;
  color: #545454;
}

.hero h1 {
  font-size: 28px;
  letter-spacing: 0.08em;
  font-weight: 800;
  font-stretch: condensed;
  line-height: 1.1;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card {
  width: min(840px, 100%);
  background: #ffffff;
  border-radius: 32px;
  padding: clamp(2rem, 4vw, 3rem);
  box-shadow: 0 25px 70px rgba(84, 84, 84, 0.2);
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
}

.section {
  text-align: center;
  color: #545454;
}

.section__title {
  font-size: 1.2rem;
  letter-spacing: 0.3em;
  margin: 0;
  font-weight: 700;
}

.section hr {
  border: none;
  border-top: 1px solid rgba(84, 84, 84, 0.2);
  margin: 1.25rem auto;
  max-width: 520px;
}

.steps {
  max-width: 520px;
  margin: 0 auto;
  text-align: left;
}

.steps p {
  margin: 0.4rem 0;
  line-height: 1.9;
  font-size: 1.05rem;
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, auto);
  column-gap: 1.5rem;
  row-gap: 0.8rem;
  justify-content: center;
}

.pill {
  border: 2px solid #545454;
  border-radius: 999px;
  width: 180px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  background: transparent;
  color: #545454;
  transition: transform 200ms ease, background 200ms ease, color 200ms ease, box-shadow 200ms ease;
  cursor: pointer;
}

.pill:hover {
  background: #545454;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(84, 84, 84, 0.2);
}

@media (max-width: 600px) {
  .card {
    border-radius: 24px;
  }

  .section__title {
    letter-spacing: 0.2em;
  }

  .actions {
    grid-template-columns: repeat(2, auto);
  }
}
</style>
