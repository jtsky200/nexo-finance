// Live test script for weather function with different dates
const axios = require('axios');

const API_KEY = 'f3ecde5f7aec91cfd1a80aba811301e6';
const LOCATION = 'Zurich, CH';

// Simulate the fetchWeatherFromAPI function logic
async function fetchWeatherFromAPI(location, date, apiKey) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requestDate = new Date(date);
  requestDate.setHours(0, 0, 0, 0);
  
  const isFuture = requestDate > today;
  const isToday = requestDate.getTime() === today.getTime();
  const daysDiff = isFuture ? Math.ceil((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  console.log(`\n📅 Testing date: ${date.toISOString().split('T')[0]}`);
  console.log(`   isToday: ${isToday}, isFuture: ${isFuture}, daysDiff: ${daysDiff}`);

  if (isToday) {
    console.log('   → Using CURRENT weather API');
    const url = `https://api.openweathermap.org/data/2.5/weather`;
    const params = {
      q: location,
      appid: apiKey,
      units: 'metric',
      lang: 'de',
    };
    
    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;
    
    return {
      source: 'CURRENT',
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind?.speed * 3.6),
      time: new Date().toISOString(),
    };
  } else if (isFuture) {
    if (daysDiff > 5) {
      console.log(`   ❌ Date is more than 5 days in the future (${daysDiff} days)`);
      return null;
    }
    
    console.log(`   → Using FORECAST API (${daysDiff} days in future)`);
    const url = `https://api.openweathermap.org/data/2.5/forecast`;
    const params = {
      q: location,
      appid: apiKey,
      units: 'metric',
      lang: 'de',
    };
    
    const response = await axios.get(url, { params, timeout: 10000 });
    const data = response.data;
    
    // Find forecast for the target date (closest to noon)
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
      console.log(`   ⚠️  No forecast found for exact date, using closest`);
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
      distanceFromNoon: bestScore.toFixed(2),
    };
  } else {
    console.log('   ❌ Date is in the past');
    return null;
  }
}

async function testMultipleDates() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🌤️  LIVE WEATHER FUNCTION TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Location: ${LOCATION}`);
  console.log(`Current Date: ${new Date().toISOString().split('T')[0]}\n`);
  
  const testDates = [
    new Date(), // Today
    (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })(), // Tomorrow
    (() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; })(), // Day after tomorrow
    new Date('2025-12-17'), // 17. Dezember
    new Date('2025-12-18'), // 18. Dezember
    new Date('2025-12-19'), // 19. Dezember
    new Date('2025-12-20'), // 20. Dezember (should be > 5 days if today is 14.12)
  ];
  
  const results = [];
  
  for (const testDate of testDates) {
    try {
      const result = await fetchWeatherFromAPI(LOCATION, testDate, API_KEY);
      
      if (result) {
        console.log(`   ✅ Result:`);
        console.log(`      Source: ${result.source}`);
        console.log(`      Temperature: ${result.temperature}°C`);
        console.log(`      Condition: ${result.condition}`);
        console.log(`      Humidity: ${result.humidity}%`);
        console.log(`      Wind: ${result.windSpeed} km/h`);
        if (result.forecastTime) {
          console.log(`      Forecast Time: ${result.forecastTime}`);
          console.log(`      Distance from noon: ${result.distanceFromNoon} hours`);
        }
        
        results.push({
          date: testDate.toISOString().split('T')[0],
          ...result,
        });
      } else {
        console.log(`   ❌ No data available`);
        results.push({
          date: testDate.toISOString().split('T')[0],
          error: 'No data',
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        date: testDate.toISOString().split('T')[0],
        error: error.message,
      });
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  results.forEach(r => {
    if (r.error) {
      console.log(`❌ ${r.date}: ${r.error}`);
    } else {
      console.log(`✅ ${r.date}: ${r.temperature}°C (${r.source})`);
    }
  });
  
  // Verify that future dates use FORECAST, not CURRENT
  const today = new Date().toISOString().split('T')[0];
  const futureResults = results.filter(r => r.date !== today && !r.error);
  const usingForecast = futureResults.filter(r => r.source === 'FORECAST');
  const usingCurrent = futureResults.filter(r => r.source === 'CURRENT');
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔍 VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Future dates tested: ${futureResults.length}`);
  console.log(`Using FORECAST API: ${usingForecast.length} ✅`);
  console.log(`Using CURRENT API (WRONG!): ${usingCurrent.length} ${usingCurrent.length > 0 ? '❌' : '✅'}`);
  
  if (usingCurrent.length > 0) {
    console.log('\n⚠️  WARNING: Some future dates are using CURRENT API instead of FORECAST!');
    usingCurrent.forEach(r => {
      console.log(`   - ${r.date} is using CURRENT API (should use FORECAST)`);
    });
  } else {
    console.log('\n✅ All future dates correctly use FORECAST API!');
  }
}

testMultipleDates().catch(console.error);
