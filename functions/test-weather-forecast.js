// Test script to check weather forecast API
const axios = require('axios');

const API_KEY = 'f3ecde5f7aec91cfd1a80aba811301e6';
const LOCATION = 'Zurich, CH';

async function testWeatherForecast() {
  console.log('=== Testing Weather Forecast API ===\n');
  
  // Test 1: Current weather (today)
  console.log('1. Testing CURRENT weather (today):');
  try {
    const currentResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: LOCATION,
        appid: API_KEY,
        units: 'metric',
        lang: 'de',
      },
      timeout: 10000,
    });
    
    const currentData = currentResponse.data;
    console.log(`   Temperature: ${Math.round(currentData.main.temp)}°C`);
    console.log(`   Condition: ${currentData.weather[0].description}`);
    console.log(`   Humidity: ${currentData.main.humidity}%`);
    console.log(`   Wind: ${Math.round(currentData.wind?.speed * 3.6)} km/h`);
    console.log(`   Time: ${new Date().toISOString()}\n`);
  } catch (error) {
    console.error('   Error:', error.message);
  }
  
  // Test 2: Forecast (5 days)
  console.log('2. Testing FORECAST API (5 days):');
  try {
    const forecastResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        q: LOCATION,
        appid: API_KEY,
        units: 'metric',
        lang: 'de',
      },
      timeout: 10000,
    });
    
    const forecastData = forecastResponse.data;
    console.log(`   Total forecast entries: ${forecastData.list.length}\n`);
    
    // Show forecasts for next 5 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let dayOffset = 0; dayOffset <= 5; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      // Find forecasts for this date
      const forecastsForDate = forecastData.list.filter(item => {
        const itemDate = new Date(item.dt * 1000);
        const itemDateStr = itemDate.toISOString().split('T')[0];
        return itemDateStr === targetDateStr;
      });
      
      if (forecastsForDate.length > 0) {
        // Find closest to noon (12:00)
        let bestForecast = forecastsForDate[0];
        let bestScore = Infinity;
        
        for (const forecast of forecastsForDate) {
          const forecastTime = new Date(forecast.dt * 1000);
          const hours = forecastTime.getHours();
          const minutes = forecastTime.getMinutes();
          const timeOfDay = hours + minutes / 60;
          const distanceFromNoon = Math.abs(timeOfDay - 12);
          
          if (distanceFromNoon < bestScore) {
            bestForecast = forecast;
            bestScore = distanceFromNoon;
          }
        }
        
        const forecastTime = new Date(bestForecast.dt * 1000);
        const dayName = dayOffset === 0 ? 'Heute' : dayOffset === 1 ? 'Morgen' : `In ${dayOffset} Tagen`;
        
        console.log(`   ${dayName} (${targetDateStr}):`);
        console.log(`     Time: ${forecastTime.toISOString()}`);
        console.log(`     Temperature: ${Math.round(bestForecast.main.temp)}°C`);
        console.log(`     Condition: ${bestForecast.weather[0].description}`);
        console.log(`     Humidity: ${bestForecast.main.humidity}%`);
        console.log(`     Wind: ${Math.round(bestForecast.wind?.speed * 3.6)} km/h`);
        console.log(`     Distance from noon: ${bestScore.toFixed(2)} hours\n`);
      } else {
        const dayName = dayOffset === 0 ? 'Heute' : dayOffset === 1 ? 'Morgen' : `In ${dayOffset} Tagen`;
        console.log(`   ${dayName} (${targetDateStr}): NO FORECAST AVAILABLE\n`);
      }
    }
    
    // Show all forecast times for debugging
    console.log('3. All forecast times in response:');
    forecastData.list.forEach((item, index) => {
      const itemTime = new Date(item.dt * 1000);
      console.log(`   [${index}] ${itemTime.toISOString()} - ${Math.round(item.main.temp)}°C`);
    });
    
  } catch (error) {
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testWeatherForecast().catch(console.error);
