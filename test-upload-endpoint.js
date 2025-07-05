const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test the upload endpoint with authentication
async function testUploadWithAuth() {
  try {
    console.log('🔐 Testing upload functionality...');
    
    // Step 1: Login to get a token
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, token received');
    
    // Step 2: Get albums
    console.log('2. Getting albums...');
    const albumsResponse = await fetch('http://localhost:5000/api/albums', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!albumsResponse.ok) {
      throw new Error(`Failed to get albums: ${albumsResponse.status}`);
    }
    
    const albumsData = await albumsResponse.json();
    const albums = albumsData.albums;
    console.log(`✅ Found ${albums.length} albums`);
    
    if (albums.length === 0) {
      console.log('❌ No albums found. Creating a test album...');
      
      const createAlbumResponse = await fetch('http://localhost:5000/api/albums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'Test Album',
          description: 'Test album for upload testing'
        })
      });
      
      if (!createAlbumResponse.ok) {
        throw new Error(`Failed to create album: ${createAlbumResponse.status}`);
      }
      
      const albumData = await createAlbumResponse.json();
      const albumId = albumData.album._id;
      console.log(`✅ Created test album with ID: ${albumId}`);
      albums.push(albumData.album);
    }
    
    const albumId = albums[0]._id;
    console.log(`3. Using album: ${albums[0].name} (ID: ${albumId})`);
    
    // Step 3: Create a test image file
    console.log('4. Creating test image...');
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a simple 1x1 pixel PNG
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log('✅ Test image created');
    
    // Step 4: Test upload
    console.log('5. Testing upload...');
    const formData = new FormData();
    formData.append('albumId', albumId);
    formData.append('images', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    formData.append('captions[0]', 'Test caption');
    
    const uploadResponse = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    const uploadData = await uploadResponse.json();
    console.log('✅ Upload successful!');
    console.log('Response:', JSON.stringify(uploadData, null, 2));
    
    // Step 5: Verify the album was updated
    console.log('6. Verifying album update...');
    const verifyResponse = await fetch(`http://localhost:5000/api/albums/${albumId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!verifyResponse.ok) {
      throw new Error(`Failed to verify album: ${verifyResponse.status}`);
    }
    
    const verifyData = await verifyResponse.json();
    console.log(`✅ Album now has ${verifyData.album.images.length} images`);
    
    // Clean up
    fs.unlinkSync(testImagePath);
    console.log('🧹 Cleaned up test file');
    
    console.log('🎉 All tests passed! Upload functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testUploadWithAuth(); 