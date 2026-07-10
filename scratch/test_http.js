async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/ai/voice-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'hello' })
    });
    
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Connection error:', err);
  }
}

test();
