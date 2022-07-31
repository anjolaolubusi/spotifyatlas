import { createRouter, createWebHistory } from 'vue-router'
import SpotifyData from '../components/SpotifyData'
import CallbackView from '../components/CallbackView'

const routes = [
  {
    path: '/',
    alias: ['/spotifyatlas/'],
    name: 'Home',
    component: SpotifyData
  },
  {
    path: '/callback/:queryParams(.*)',
    alias: ['/spotifyatlas/callback/:queryParams(.*)'],
    name: 'CallbackView',
    component: CallbackView
  }
]

const router = createRouter({
  mode: 'history',
  history: createWebHistory(),
  routes
})

export default router
