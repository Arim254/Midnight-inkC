// ========================
// Global API Keys
// ========================
const WEATHER_API_KEY = "b465a0407b42474ebb9122658250808";
const ALPHA_VANTAGE_KEY = "TFCSH65XW97MHM1I";
const NEWSDATA_API_KEY = "pub_ce8f373eef8f4f14a1d6eb85d31bb44f"; 
const RAPIDAPI_KEY = "b79f32ab61msh9080ce27557388bp1e4426jsn7794fb51a6ca";
const ADSENSE_PUBLISHER_ID = "your_publisher_id_here";

// ========================
// WeatherAPI + Skycons (Day/Night Support + Temp + Color-Coding)
// ========================

// Map WeatherAPI conditions to Skycons icons with day/night
function mapConditionToSkycon(condition, isDay) {
  const cond = condition.toLowerCase();

  if (cond.includes("clear") || cond.includes("sunny"))
    return isDay ? "CLEAR_DAY" : "CLEAR_NIGHT";

  if (cond.includes("partly") || cond.includes("cloud"))
    return isDay ? "PARTLY_CLOUDY_DAY" : "PARTLY_CLOUDY_NIGHT";

  if (cond.includes("rain") || cond.includes("drizzle")) return "RAIN";
  if (cond.includes("thunder")) return "SLEET";
  if (cond.includes("snow") || cond.includes("flurries")) return "SNOW";
  if (cond.includes("fog") || cond.includes("mist") || cond.includes("haze")) return "FOG";

  return isDay ? "PARTLY_CLOUDY_DAY" : "PARTLY_CLOUDY_NIGHT";
}

// Get color based on temperature
function getTempColor(temp) {
  if (temp < 10) return "#4FC3F7"; // light blue
  if (temp < 20) return "#FFEB3B"; // yellow
  if (temp < 30) return "#FF9800"; // orange
  return "#F44336"; // red
}

function fetchWeather(lat, lon) {
  const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=5&aqi=no&alerts=no`;

  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      if (!data || !data.current) {
        console.error("Invalid weather data", data);
        return;
      }

      // === Current Weather ===
      document.getElementById("weather-city").textContent = data.location.name;
      document.getElementById("weather-status").textContent = data.current.condition.text;
      document.getElementById("weather-temp").textContent = `${data.current.temp_c}°C`;
      document.getElementById("weather-humidity").textContent = `${data.current.humidity}%`;
      document.getElementById("weather-wind").textContent = `${data.current.wind_kph} km/h`;
      document.getElementById("weather-rain").textContent = `${data.current.precip_mm}mm`;

      // Skycons for current condition (day/night aware)
      const icon = mapConditionToSkycon(data.current.condition.text, data.current.is_day === 1);
      const skycons = new Skycons({ color: "white" });
      skycons.add("weather-icon", Skycons[icon]);
      skycons.play();

      // === Forecast: next 4 days ===
      const forecastEl = document.getElementById("weather-forecast");
      const forecastSkycons = new Skycons({ color: "white" });
      let forecastHTML = "";

      data.forecast.forecastday.slice(1, 5).forEach((day, index) => {
        const dayName = new Date(day.date).toLocaleDateString("en-US", { weekday: "short" });
        const forecastId = `forecast-icon-${index}`;
        const tempC = Math.round(day.day.avgtemp_c);
        const tempColor = getTempColor(tempC);

        forecastHTML += `
          <div class="forecast-day">
            <div class="day-name">${dayName}</div>
            <canvas id="${forecastId}" width="48" height="48"></canvas>
            <div class="day-temp" style="color:${tempColor};">${tempC}°C</div>
          </div>
        `;
      });

      forecastEl.innerHTML = forecastHTML;

      // Add Skycons for each forecast day (daytime icons for forecast)
      data.forecast.forecastday.slice(1, 5).forEach((day, index) => {
        const forecastId = `forecast-icon-${index}`;
        const forecastIcon = mapConditionToSkycon(day.day.condition.text, true);
        forecastSkycons.add(forecastId, Skycons[forecastIcon]);
      });

      forecastSkycons.play();
    })
    .catch(err => console.error("Weather fetch error:", err));
}

function initWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(-1.2921, 36.8219), // fallback: Nairobi
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    fetchWeather(-1.2921, 36.8219);
  }
}

document.addEventListener("DOMContentLoaded", initWeather);
