// Test script to directly test the weather function logic
const admin = require('firebase-admin');

// Initialize Firebase Admin (this will use default credentials from environment)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function testWeatherFunction() {
  console.log('=== Testing Weather Function Logic ===\n');
  
  // Test dates
  const testDates = [
    { input: '2025-12-14', label: 'Heute' },
    { input: '2025-12-15', label: 'Morgen' },
    { input: '2025-12-16', label: 'Übermorgen' },
    { input: '2025-12-17', label: '17. Dezember' },
  ];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const test of testDates) {
    const requestDate = new Date(test.input);
    requestDate.setHours(0, 0, 0, 0);
    
    const isToday = requestDate.getTime() === today.getTime();
    const isFuture = requestDate > today;
    const isPast = requestDate < today;
    const daysDiff = Math.ceil((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`${test.label} (${test.input}):`);
    console.log(`  isToday: ${isToday}`);
    console.log(`  isFuture: ${isFuture}`);
    console.log(`  isPast: ${isPast}`);
    console.log(`  daysDiff: ${daysDiff}`);
    console.log(`  Would use: ${isToday ? 'CURRENT API' : isFuture ? 'FORECAST API' : 'HISTORICAL (null)'}`);
    
    // Check cache
    const dateStr = requestDate.toISOString().split('T')[0];
    const location = 'Zurich, CH';
    const weatherQuery = db.collection('weatherData')
      .where('date', '==', dateStr)
      .where('location', '==', location);
    
    const snapshot = await weatherQuery.limit(1).get();
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      const cachedDate = data.fetchedAt?.toDate?.() || data.fetchedAt;
      console.log(`  CACHED DATA FOUND:`);
      console.log(`    Temperature: ${data.temperature}°C`);
      console.log(`    Condition: ${data.condition}`);
      console.log(`    Cached at: ${cachedDate?.toISOString() || 'unknown'}`);
      console.log(`    ⚠️  This cached data might be from TODAY, not the future date!`);
    } else {
      console.log(`  No cache found - would fetch from API`);
    }
    console.log('');
  }
  
  // Check if there are any cached entries that might be wrong
  console.log('=== Checking for potentially incorrect cached entries ===\n');
  const allWeather = await db.collection('weatherData')
    .where('location', '==', 'Zurich, CH')
    .orderBy('date', 'desc')
    .limit(10)
    .get();
  
  console.log(`Found ${allWeather.size} cached weather entries:\n`);
  allWeather.forEach(doc => {
    const data = doc.data();
    const cachedDate = data.fetchedAt?.toDate?.() || data.fetchedAt;
    console.log(`Date: ${data.date} | Temp: ${data.temperature}°C | Condition: ${data.condition} | Cached: ${cachedDate?.toISOString() || 'unknown'}`);
  });
  
  process.exit(0);
}

testWeatherFunction().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
