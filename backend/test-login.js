const bcrypt = require('bcryptjs');

const password = 'Password123!';
const testHash = '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNO'; // example

bcrypt.hash(password, 10).then(hash => {
  console.log('Generated hash:', hash);
  
  bcrypt.compare(password, hash).then(result => {
    console.log('Password matches:', result);
  });
});

// Test with the actual seed password
const seedPassword = 'Password123!';
console.log('Testing password:', seedPassword);
