/**
 * weather.js — Widget meteo Open-Meteo
 */

export function initWeather() {
  const weatherWidget = document.getElementById("weatherWidget");
  if (!weatherWidget) return;

  const lat = 40.305595082113115;
  const lon = 17.67639558647628;

  const getWeatherIcon = (code) => {
    if (code === 0) return "☀️";
    if (code >= 1 && code <= 3) return "⛅";
    if (code >= 45 && code <= 48) return "🌫️";
    if (code >= 51 && code <= 67) return "🌧️";
    if (code >= 71 && code <= 77) return "❄️";
    if (code >= 80 && code <= 82) return "🌦️";
    if (code >= 95) return "⛈️";
    return "🌡️";
  };

  fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
  )
    .then((res) => res.json())
    .then((data) => {
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;
      document.getElementById("weatherTemp").textContent = `${temp}°C`;
      document.getElementById("weatherIcon").textContent = getWeatherIcon(code);
      weatherWidget.classList.remove("hidden");
    })
    .catch((err) => console.error("Meteo Err:", err));
}
