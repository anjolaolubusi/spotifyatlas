<template>
  <div v-if="!isAuth">
    <n-button @click="LoginToSpotify">Login</n-button>
  </div>
  <div v-if="isAuth">
    <n-button @click="grabUserTopItems">Grab Items</n-button>
    <div v-if="currPercentage != 100" style="width: 500px">
      <n-progress
        type="line"
        :percentage="currPercentage"
        :indicator-placement="'inside'"
        processing
      />
    </div>
    <div v-if="TopItemsArray != null && currPercentage == 100">
      <!-- <GChart
  :data="userTopItems"
  :options="chartOptions"
  :createChart="(el, google) => new google.visualization.PieChart(el)"
  @ready="onChartReady"
  type="PieChart"
  /> -->

      <GChart
        :settings="{ packages: ['geochart'] }"
        :createChart="(el, google) => new google.visualization.GeoChart(el)"
        type="GeoChart"
        :data="TopItemsArray"
        :events="geoChartEvents"
        @ready="onChartReady"
      />
      <div v-if="artistsLookup != null && isCountryDataDone == true">
      <GChart
      :settings="{ packages: ['corechart'] }"
      type="BubbleChart"
      :data="artistsLookup"
      @ready="loadCountryPieChart" />
      </div>
    </div>
  </div>
  <!-- <GChart
    type="PieChart"
    :data="tempData"
    :options="chartOptions"
    ref="GoogleGraph"
  /> -->
  <n-button @click="goToTest">Go To Test</n-button>
</template>

<script>
import { NButton, NProgress } from 'naive-ui'
import axios from 'axios'
import qs from 'qs'
import { GChart } from 'vue-google-charts'
export default {
  name: 'SpotifyData',
  components: {
    NButton,
    NProgress,
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
          state: this.$cookies.get('vueState')
          // code_challenge_method: 'S256',
          // code_challenge: this.spotifySHA
        })
    },
    pause () {
      return new Promise((resolve) =>
        setTimeout(() => {
          resolve()
        }, 500)
      )
    },
    goToTest () {
      this.$router.push({
        name: 'CallbackView2',
        query: { code: 'Rewrvs', state: 'ejkerkjre' }
      })
    },
    loadCountryPieChart (chart, google) {
      const data = google.visualization.arrayToDataTable(this.artistsLookup)
      // const data = new google.visualization.DataTable()
      // google.charts.setOnLoadCallback(this.loadCountryPieChart)
      // data.addColumn('string', 'Genre')
      // data.addColumn('number', 'Amount')
      // data.addColumn({ type: 'string', role: 'tooltip' })
      // const tempCopy = this.artistsLookup
      // tempCopy.shift()
      // console.log(tempCopy)
      // data.addRows(tempCopy)
      // const options = { tooltip: { trigger: 'selection' } }
      // chart.setAction({
      //   id: 'artist',
      //   text: 'Test',
      //   action: function () {
      //     const selection = chart.getSelection()
      //     console.log(selection)
      //     console.log(tempCopy[selection[0].row + 1][2])
      //   }
      // })
      const options = {

      }
      if (this.geoPieChart) {
        this.geoPieChart.draw(data, options)
      } else {
        chart.draw(data, options)
        this.geoPieChart = chart
      }
      this.isCountryDataDone = true
    },
    getCountryPieChartData (countryName) {
      this.artistsLookup = null
      this.isCountryDataDone = false
      console.log(this.sourceData[countryName])
      const tempTally = []
      Object.entries(this.sourceData[countryName]).forEach(function ([key, value]) {
        console.log(key)
        tempTally.push([value.name, parseInt(key), value.popularity, value.genres.join(', ')])
        // for (let i = 0; i < value.genres.length; i++) {
        //   if (tempTally[value.genres[i]] == null) {
        //     tempTally[value.genres[i]] = value.name
        //   } else {
        //     tempTally[value.genres[i]] += ', ' + value.name
        //   }
        // }
      })
      const tempData = [['Artist', 'Number of Generes', 'Popularity', 'Generes']]
      // Object.entries(tempTally).forEach(function ([key, value]) {
      //   tempData.push([key, value.split(', ').length, `Genre: ${key} Artists: ${value}`])
      // })
      tempData.push(...tempTally)
      console.log(tempData)
      this.artistsLookup = tempData
      if (this.geoPieChart !== null) {
        this.loadCountryPieChart(this.geoPieChart, this.chartsLib)
      } else {
        this.isCountryDataDone = true
      }
    },
    async grabUserTopItems () {
      if (this.userTopItems == null) {
        this.currPercentage = 0
        this.userTopItems = {}
        this.sourceData = {}
        const res = await this.spotifyAxios.get('me/top/artists', {
          params: { limit: 50 }
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
      }
      const arr = [['Country', 'Count']]
      arr.push(...Object.entries(this.userTopItems))
      this.TopItemsArray = arr
      // console.log(this.sourceData)
      // for (let i = 1; i < arr.length; i++) {
      //   arr[i].push(this.sourceData[arr[i][0]].join(', '))
      // }
      // console.log(arr)
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
      await window.crypto.subtle.digest('SHA-256', data).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray
          .map((bytes) => bytes.toString(16).padStart(2, '0'))
          .join('')
        this.spotifySHA = hashHex
      })
    },
    async onChartReady (chart, google) {
      if (this.TopItemsArray) {
        const data = google.visualization.arrayToDataTable(this.TopItemsArray)
        this.chartsLib = google
        chart.draw(data, {})
        this.geoChart = chart
      }
    }
  },
  data () {
    return {
      userTopItems: null,
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
      currPercentage: 0,
      tempData: [
        ['Country', 'Data'],
        ['United States', 29],
        ['United Kingdom', 5],
        ['Japan', 5],
        ['Canada', 2],
        ['France', 2],
        ['Belgium', 1],
        ['Germany', 1]
      ],
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
        baseURL:
          'https://countriesnow.space/api/v0.1/countries/population/cities'
      })
      this.musicAxios = axios.create({
        baseURL: 'https://musicbrainz.org/ws/2/artist/'
      })
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
</style>
