const axios = require("axios");
const env = require('dotenv');

const WeatherAPI = {
  getWeather: async function(longitude, latitude) {
    const lon = longitude;
    const lat = latitude;
    const apiKey = process.env.api_key
    try {
      console.log(`Weather API Key = ${apiKey}`);
      const weatherRequest = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
      let weather = {};
      const response = await axios.get(weatherRequest);
      if (response.status == 200) {
        weather = response.data
        console.log("Weather:" + weather.weather[0].description);
      } else {
        console.log("Could not find Weather at these coordinates")
      };

      return weather;
    } catch (err) {
      console.log(err);
      let weather = {};
      return weather;
    }
  }
};

module.exports = WeatherAPI;
