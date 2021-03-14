const axios = require("axios");


const WeatherAPI = {
  getWeather: async function(longitude, latitude) {
    const lon = longitude;
    const lat = latitude;
    const apiKey = "901eebeb4f4a5848523d3c1bd3682264";
    console.log(`Weather API Key = ${apiKey}`);
    const weatherRequest = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    let weather = {};
    const response = await axios.get(weatherRequest)
    if (response.status == 200) {
      weather = response.data;
      const report = {
        clouds : weather.weather[0].description,
        windSpeed: weather.wind.speed,
        windDirection: weather.wind.deg,
        visibility: weather.visibility/1000,
        humidity : weather.main.humidity
      };
      console.log("Weather:" + report);
    } else {
      console.log("Could not find Weather at these coordinates")
    };

  }
};

module.exports = WeatherAPI;
