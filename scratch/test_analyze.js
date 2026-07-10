async function test() {
  try {
    // Smallest 1x1 pixel base64 GIF
    const dummyImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    
    console.log('Sending analyze-image request...');
    const res = await fetch('http://localhost:5000/api/ai/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dummyImage, description: 'Test image' })
    });
    
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Response JSON:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Connection error:', err);
  }
}

test();
