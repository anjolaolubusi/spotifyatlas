import { createRouter, createWebHistory } from 'vue-router'
import SpotifyData from '../components/SpotifyData'

const routes = [
  {
    path: '/',
    redirect: { name: 'Home' }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
