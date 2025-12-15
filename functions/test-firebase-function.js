// Test the actual Firebase Function logic by simulating the getWeather function
const axios = require('axios');

const API_KEY = 'f3ecde5f7aec91cfd1a80aba811301e6';
const LOCATION = 'Zurich, CH';

// Simulate the exact logic from trpc.ts getWeather case
async function testGetWeatherFunction(dateInput) {
  console.log(`\n🧪 Testing getWeather with input: "${dateInput}"`);
  
  // Parse date (same logic as in trpc.ts)
  let weatherDate = new Date();
  if (dateInput === 'heute' || dateInput === 'today') {
    weatherDate = new Date();
  } else if (dateInput === 'morgen' || dateInput === 'tomorrow') {
    weatherDate = new Date();
    weatherDate.setDate(weatherDate.getDate() + 1);
  } else if (dateInput === 'übermorgen' || dateInput === 'day after tomorrow') {
    weatherDate = new Date();
    weatherDate.setDate(weatherDate.getDate() + 2);
  } else {
    try {
      weatherDate = new Date(dateInput);
      if (isNaN(weatherDate.getTime())) {
        // Try parsing German date format
        const dateMatch = dateInput.match(/(\d{1,2})\.?\s*(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*(\d{4})/i);
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const year = parseInt(dateMatch[2]);
          const monthNames = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
          const month = monthNames.findIndex(m => dateInput.toLowerCase().includes(m));
          if (month >= 0) {
            weatherDate = new Date(year, month, day);
          }
        }
      }
    } catch (e) {
      console.log(`   ❌ Error parsing date: ${e.message}`);
      return null;
    }
  }
  
  weatherDate.setHours(0, 0, 0, 0);
  
  console.log(`   Parsed date: ${weatherDate.toISOString().split('T')[0]}`);
  
  // Check if date is within 5 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysDiff = Math.ceil((weatherDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  console.log(`   Days difference: ${daysDiff}`);
  
  if (daysDiff > 5) {
    console.log(`   ❌ Date is more than 5 days in the future`);
    return { error: 'forecast_limit', daysDiff };
  }
  
  // Now call fetchWeatherFromAPI (simulated)
  const result = await fetchWeatherFromAPI(LOCATION, weatherDate, API_KEY);
  return result;
}

// Simulate fetchWeatherFromAPI
async function fetchWeatherFromAPI(location, date, apiKey) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requestDate = new Date(date);
  requestDate.setHours(0, 0, 0, 0);
  
  const isFuture = requestDate > today;
  const isToday = requestDate.getTime() === today.getTime();
  const daysDiff = isFuture ? Math.ceil((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  if (isToday) {
    const url = `https://api.openweathermap.org/data/2.5/weather`;
    const params = { q: location, appid: apiKey, units: 'metric', lang: 'de' };
    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;
    return {
      source: 'CURRENT',
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind?.speed * 3.6),
    };
  } else if (isFuture) {
    const url = `https://api.openweathermap.org/data/2.5/forecast`;
    const params = { q: location, appid: apiKey, units: 'metric', lang: 'de' };
    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;
    
    const targetDateStr = requestDate.toISOString().split('T')[0];
    let bestForecast = null;
    let bestScore = Infinity;
    
    for (const forecast of data.list) {
      const forecastTime = new Date(forecast.dt * 1000);
      const forecastDateStr = forecastTime.toISOString().split('T')[0];
      
      if (forecastDateStr === targetDateStr) {
        const hours = forecastTime.getHours();
        const minutes = forecastTime.getMinutes();
        const timeOfDay = hours + minutes / 60;
        const distanceFromNoon = Math.abs(timeOfDay - 12);
        
        if (distanceFromNoon < bestScore) {
          bestForecast = forecast;
          bestScore = distanceFromNoon;
        }
      }
    }
    
    if (!bestForecast) {
      const targetTime = requestDate.getTime();
      let closestForecast = data.list[0];
      let minTimeDiff = Math.abs(new Date(closestForecast.dt * 1000).getTime() - targetTime);
      
      for (const forecast of data.list) {
        const forecastTime = new Date(forecast.dt * 1000).getTime();
        const timeDiff = Math.abs(forecastTime - targetTime);
        if (timeDiff < minTimeDiff) {
          closestForecast = forecast;
          minTimeDiff = timeDiff;
        }
      }
      bestForecast = closestForecast;
    }
    
    const selectedTime = new Date(bestForecast.dt * 1000);
    return {
      source: 'FORECAST',
      temperature: Math.round(bestForecast.main.temp),
      condition: bestForecast.weather[0].description,
      humidity: bestForecast.main.humidity,
      windSpeed: Math.round(bestForecast.wind?.speed * 3.6),
      forecastTime: selectedTime.toISOString(),
    };
  }
  
  return null;
}

async function testVariousInputs() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTING FIREBASE FUNCTION LOGIC');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Current Date: ${new Date().toISOString().split('T')[0]}\n`);
  
  const testInputs = [
    'heute',
    'morgen',
    'übermorgen',
    '2025-12-17',
    '2025-12-18',
    '17. Dezember 2025',
    '18. Dezember 2025',
    '2025-12-21', // > 5 days
  ];
  
  for (const input of testInputs) {
    try {
      const result = await testGetWeatherFunction(input);
      
      if (result && result.error) {
        console.log(`   ❌ Error: ${result.error} (daysDiff: ${result.daysDiff})`);
      } else if (result) {
        console.log(`   ✅ Result: ${result.temperature}°C (${result.source})`);
        console.log(`      Condition: ${result.condition}`);
        if (result.forecastTime) {
          console.log(`      Forecast Time: ${result.forecastTime}`);
        }
      } else {
        console.log(`   ❌ No data`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ All tests completed!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

testVariousInputs().catch(console.error);
