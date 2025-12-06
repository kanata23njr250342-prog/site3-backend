import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import CategoryPage from './pages/CategoryPage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/category/:name',
    name: 'Category',
    component: CategoryPage,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
