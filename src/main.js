import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueCookies from 'vue3-cookies'
import VueChartkick from 'vue-chartkick'
import 'chartkick/chart.js'

const app = createApp(App)
app.config.globalProperties.$spotifyRedirectURL = process.env.VUE_APP_SPOTIFY_URI
app
  .use(router)
  .use(VueCookies)
  .use(VueChartkick)
  .mount('#app')
