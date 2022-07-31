<template>
  <div v-if="!isAuth">
    <n-button @click="LoginToSpotify">Login</n-button>
  </div>
  <div v-if="isAuth">
    <n-space vertical>
    <n-button @click="logout" type="error">Logout</n-button>
    <n-space justify="center">
    <n-button type="primary" @click="grabUserTopItems('short_term')">Last 4 Weeks</n-button>
    <n-button type="primary" @click="grabUserTopItems('medium_term')">Last 6 Months</n-button>
    <n-button type="primary" @click="grabUserTopItems('long_term')">All Time</n-button>
    </n-space>
    </n-space>
    <n-modal :show="showLoadingModal">
          <n-card
      style="width: 500px"
      title="Loading Data"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
    <!-- <div v-if="currPercentage != 100" style="width: 500px"> -->
      <n-progress
        type="line"
        :percentage="currPercentage"
        :indicator-placement="'inside'"
        processing
      />

          </n-card>
    <!-- </div> -->
    </n-modal>
    <div v-if="TopItemsArray != null && currPercentage == 100">
      <n-grid x-gap="12" cols="1 s:1 m:2 l:2 xl:2 2xl:2" responsive="screen">
        <n-grid-item>
      <div>
      <GChart
        :settings="{ packages: ['geochart'] }"
        :createChart="(el, google) => new google.visualization.GeoChart(el)"
        type="GeoChart"
        :data="TopItemsArray"
        :events="geoChartEvents"
        @ready="onChartReady"
      />
      </div>
      </n-grid-item>
      <n-grid-item>
      <div v-if="artistsLookup != null && isCountryDataDone == true">
      <GChart
      :settings="{ packages: ['table'] }"
      type="Table"
      :data="artistsLookup"
      @ready="loadCountryPieChart"
      :options="tableOptions"/>
      </div>
      </n-grid-item>
      </n-grid>
    </div>
  </div>
</template>

<script>
import { NButton, NProgress, NModal, NCard, NGrid, NGridItem, NSpace } from 'naive-ui'
import axios from 'axios'
import qs from 'qs'
import { GChart } from 'vue-google-charts'
export default {
  name: 'SpotifyData',
  components: {
    NButton,
    NProgress,
    NModal,
    NCard,
    NGrid,
    NGridItem,
    NSpace,
    GChart
  },
  methods: {
    LoginToSpotify () {
      console.log('Logging in to Spotify')
      window.location.href =
        'https://accounts.spotify.com/authorize?' +
        qs.stringify({
          client_id: '203cf6804ed64da2accc7f84ede9118c',
          response_type: 'code',
          redirect_uri: this.$spotifyRedirectURL,
          scope: 'user-top-read playlist-read-private user-read-private',
          state: this.$cookies.get('vueState'),
          code_challenge_method: 'S256',
          code_challenge: this.spotifySHA
        })
    },
    pause () {
      return new Promise((resolve) =>
        setTimeout(() => {
          resolve()
        }, 500)
      )
    },
    loadCountryPieChart (chart, google) {
      const data = google.visualization.arrayToDataTable(this.artistsLookup)

      const options = {
        sortColumn: 2,
        sortAscending: false
      }
      console.log(options)
      if (this.geoPieChart) {
        this.geoPieChart.draw(data, options)
      } else {
        chart.draw(data, options)
        this.geoPieChart = chart
      }
      console.log(this.geoPieChart)
      this.isCountryDataDone = true
    },
    getCountryPieChartData (countryName) {
      this.artistsLookup = null
      this.isCountryDataDone = false
      console.log(this.sourceData[countryName])
      const tempTally = []
      Object.entries(this.sourceData[countryName]).forEach(function ([key, value]) {
        console.log(key)
        tempTally.push([value.name, value.genres.length, value.popularity, value.genres.join(', ')])
      })
      const tempData = [['Artist', 'Number of Generes', 'Popularity', 'Generes']]
      tempData.push(...tempTally)
      console.log(tempData)
      this.artistsLookup = tempData
      if (this.geoPieChart !== null) {
        this.loadCountryPieChart(this.geoPieChart, this.chartsLib)
      } else {
        this.isCountryDataDone = true
      }
    },
    async grabUserTopItems (timeRange) {
      let grabFromSource = false
      switch (timeRange) {
        case 'medium_range':
          grabFromSource = (this.sixMonthsData == null)
          break
        case 'short_term':
          grabFromSource = (this.fourWeeksData == null)
          break
        case 'long_term':
          grabFromSource = (this.allTImesData == null)
          break
        default:
          grabFromSource = (this.sixMonthsData == null)
          break
      }

      if (grabFromSource) {
        this.showLoadingModal = true
        this.currPercentage = 0
        this.userTopItems = {}
        this.sourceData = {}
        const res = await this.spotifyAxios.get('me/top/artists', {
          params: { limit: 50, time_range: `${timeRange}` }
        })
        let musicDBdata = null
        let countryName = ''
        for (let i = 0; i < res.data.items.length; i++) {
          musicDBdata = await this.musicAxios.get('', {
            params: { fmt: 'json', query: res.data.items[i].name }
          })
          // Check for HTTP ERROR 503
          if (
            musicDBdata.data.artists[0].area != null &&
            musicDBdata.data.artists[0].area.type === 'Country'
          ) {
            countryName = musicDBdata.data.artists[0].area.name

            if (this.sourceData[countryName] == null) {
              this.sourceData[countryName] = [{ name: res.data.items[i].name, genres: res.data.items[i].genres, popularity: res.data.items[i].popularity }]
            } else {
              this.sourceData[countryName].push({ name: res.data.items[i].name, genres: res.data.items[i].genres, popularity: res.data.items[i].popularity })
            }

            if (this.userTopItems[countryName] == null) {
              this.userTopItems[countryName] = 1
            } else {
              this.userTopItems[countryName] += 1
            }
          }
          this.currPercentage = (i / (res.data.items.length - 1)) * 100
          await this.pause()
        }
        const arr = [['Country', 'Count']]
        arr.push(...Object.entries(this.userTopItems))
        this.TopItemsArray = arr

        switch (timeRange) {
          case 'medium_range':
            this.sixMonthsData = {
              topItemsArray: this.TopItemsArray,
              sourceData: this.sourceData
            }
            break
          case 'short_term':
            this.fourWeeksData = {
              topItemsArray: this.TopItemsArray,
              sourceData: this.sourceData
            }
            break
          case 'long_term':
            this.allTImesData = {
              topItemsArray: this.TopItemsArray,
              sourceData: this.sourceData
            }
            break
          default:
            this.sixMonthsData = {
              topItemsArray: this.TopItemsArray,
              sourceData: this.sourceData
            }
            break
        }
      } else {
        switch (timeRange) {
          case 'medium_range':
            this.TopItemsArray = this.sixMonthsData.topItemsArray
            this.sourceData = this.sixMonthsData.sourceData
            break
          case 'short_term':
            this.TopItemsArray = this.fourWeeksData.topItemsArray
            this.sourceData = this.fourWeeksData.sourceData
            break
          case 'long_term':
            this.TopItemsArray = this.allTImesData.topItemsArray
            this.sourceData = this.allTImesData.sourceData
            break
          default:
            this.TopItemsArray = this.sixMonthsData.topItemsArray
            this.sourceData = this.sixMonthsData.sourceData
            break
        }
        this.artistsLookup = null
      }

      this.showLoadingModal = false
      this.isDone = true
    },
    generateRandomString (length) {
      let text = ''
      const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~'

      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
      }
      return text
    },
    async SHA256 (message) {
      const encoder = new TextEncoder()
      const data = encoder.encode(message)
      const digest = window.crypto.subtle.digest('SHA-256', data)
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
      // await window.crypto.subtle.digest('SHA-256', data).then((hashBuffer) => {
      //   const hashArray = Array.from(new Uint8Array(hashBuffer))
      //   const hashHex = hashArray
      //     .map((bytes) => bytes.toString(16).padStart(2, '0'))
      //     .join('')
      //   this.spotifySHA = hashHex
      // })
    },
    async onChartReady (chart, google) {
      if (this.TopItemsArray) {
        const data = google.visualization.arrayToDataTable(this.TopItemsArray)
        this.chartsLib = google
        chart.draw(data, {})
        this.geoChart = chart
      }
    },
    logout () {
      this.$cookies.remove('access_token')
      this.$cookies.remove('exprDate')
      this.$cookies.remove('shaVer')
      this.$cookies.remove('vueState')
      window.location.reload()
    }
  },
  data () {
    return {
      userTopItems: null,
      allTImesData: null,
      sixMonthsData: null,
      fourWeeksData: null,
      showLoadingModal: false,
      TopItemsArray: null,
      spotifySHA: null,
      spotifyAxios: null,
      musicAxios: null,
      cityLookupAxios: null,
      isDone: false,
      isCountryDataDone: false,
      chartsLib: null,
      chartTemp: null,
      sourceData: null,
      artistsLookup: null,
      tableOptions: {
        sortColumn: 2,
        sortAscending: false
      },
      currPercentage: 0,
      geoChart: null,
      geoPieChart: null,
      geoChartEvents: {
        select: () => {
          const userSelection = this.geoChart.getSelection()
          if (userSelection[0] !== undefined) {
            console.log(userSelection[0].row + 1)
            this.artistsLookup = null
            const newIndex = userSelection[0].row + 1
            const countryName = this.TopItemsArray[newIndex][0]
            console.log(this.TopItemsArray[newIndex][0])
            this.isCountryDataDone = false
            this.getCountryPieChartData(countryName)
          }
        }
      }
    }
  },
  mounted () {
    const state = this.generateRandomString(16)
    const codeVer = this.generateRandomString(
      Math.floor(Math.random() * (128 - 43) + 43)
    )
    console.log(codeVer)
    this.spotifySHA = this.SHA256(codeVer)
    console.log(this.spotifySHA)
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
        baseURL:
          'https://countriesnow.space/api/v0.1/countries/population/cities'
      })
      this.musicAxios = axios.create({
        baseURL: 'https://musicbrainz.org/ws/2/artist/'
      })
    } else {
      this.$cookies.remove('access_token')
      this.$cookies.remove('exprDate')
      this.$cookies.remove('shaVer')
      this.$cookies.remove('vueState')
    }
  },
  computed: {
    isAuth () {
      if (
        this.$cookies.get('access_token') != null &&
        this.$cookies.get('exprDate') != null &&
        new Date(this.$cookies.get('exprDate')) >= new Date()
      ) {
        return true
      }
      return false
    },
    chartOptions () {
      if (!this.chartsLib) return null
      return {
        title: 'Geograph Data',
        pieHole: 0.4,
        tooltip: { trigger: 'selection' },
        width: 800,
        height: 600
      }
    }
  }
}
</script>

<style>
.float-container {
  display: flex;
}

.float-child {
    flex: 1;
    border: 2px solid yellow;
}

</style>
