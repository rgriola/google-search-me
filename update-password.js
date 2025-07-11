const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

async function updatePassword() {
  const db = new sqlite3.Database('./locations.db');
  
  try {
    const password = 'Dakota1973$$';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [hash, 'rodczaro@gmail.com'],
        function(err) {
          if (err) {
            console.error('Error updating password:', err);
            reject(err);
          } else {
            console.log('Password updated successfully!');
            console.log('Rows affected:', this.changes);
            resolve();
          }
        }
      );
    });
  } finally {
    db.close();
  }
}

updatePassword().catch(console.error);
