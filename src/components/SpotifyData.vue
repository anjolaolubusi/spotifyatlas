<template>
  <div v-if="!isAuth">
    <n-button  @click="LoginToSpotify">Login</n-button>
  </div>
  <div v-if="isAuth">
    <n-button @click="grabUserTopItems">Grab Items</n-button>
    <div v-if="isDone">
    <pie-chart :data="userTopItems"></pie-chart>
    </div>
  </div>
</template>

<script>
import { NButton } from 'naive-ui'
import axios from 'axios'
import qs from 'qs'

export default {
  name: 'SpotifyData',
  components: {
    NButton
  },
  methods: {
    LoginToSpotify () {
      console.log('Logging in to Spotify')
      window.location.href = 'https://accounts.spotify.com/authorize?' + qs.stringify(
        {
          client_id: '203cf6804ed64da2accc7f84ede9118c',
          response_type: 'code',
          redirect_uri: 'http://localhost:8080/callback/',
          scope: 'user-top-read playlist-read-private user-read-private',
          state: this.$cookies.get('vueState')
          // code_challenge_method: 'S256',
          // code_challenge: this.spotifySHA
        }
      )
    },
    pause () {
      return new Promise(resolve => setTimeout(() => {
        resolve()
      }, 1000))
    },
    async grabUserTopItems () {
      if (this.userTopItems == null) {
        this.userTopItems = {}
        const res = await this.spotifyAxios.get('me/top/artists', { params: { limit: 50 } })
        let musicDBdata = null
        let countryName = ''
        for (let i = 0; i < res.data.items.length; i++) {
          musicDBdata = await this.musicAxios.get('', { params: { fmt: 'json', query: res.data.items[i].name } })
          // Check for HTTP ERROR 503
          if (musicDBdata.data.artists[0].area != null && musicDBdata.data.artists[0].area.type === 'Country') {
            countryName = musicDBdata.data.artists[0].area.name
            if (this.userTopItems[countryName] == null) {
              this.userTopItems[countryName] = 1
            } else {
              this.userTopItems[countryName] += 1
            }
          }
          await this.pause()
        }
      }
      console.log(this.userTopItems)
      this.isDone = true
    },
    generateRandomString (length) {
      let text = ''
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~'

      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
      }
      return text
    },
    async SHA256 (message) {
      const encoder = new TextEncoder()
      const data = encoder.encode(message)
      await window.crypto.subtle.digest('SHA-256', data).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray
          .map((bytes) => bytes.toString(16).padStart(2, '0'))
          .join('')
        this.spotifySHA = hashHex
      })
    }
  },
  data () {
    return {
      userTopItems: null,
      spotifySHA: null,
      spotifyAxios: null,
      musicAxios: null,
      cityLookupAxios: null,
      isDone: false
    }
  },
  mounted () {
    const state = this.generateRandomString(16)
    const codeVer = this.generateRandomString(Math.floor(Math.random() * (128 - 43) + 43))
    console.log(codeVer)
    this.SHA256('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    this.$cookies.set('shaVer', codeVer)
    this.$cookies.set('vueState', state)

    if (this.isAuth) {
      this.spotifyAxios = axios.create({
        baseURL: 'https://api.spotify.com/v1/',
        headers: {
          Authorization: `Bearer ${this.$cookies.get('access_token')}`
        }
      })
      this.cityLookupAxios = axios.create({
        baseURL: 'https://countriesnow.space/api/v0.1/countries/population/cities'
      })
      this.musicAxios = axios.create({
        baseURL: 'https://musicbrainz.org/ws/2/artist/'
      })
    }
  },
  computed: {
    isAuth () {
      if ((this.$cookies.get('access_token') != null && this.$cookies.get('exprDate') != null) && new Date(this.$cookies.get('exprDate')) >= new Date()) {
        return true
      }
      return false
    }
  }
}
</script>

<style>

</style>
