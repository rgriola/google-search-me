import bcrypt from 'bcrypt';

// run it like this:
// node hash-pass-Insert-user.js "your-password-here"

// this outputs the correct syntax in the terminal then paste
// into the sqlite3> 


const password = process.argv[2];
if (!password) {
    console.log('Usage: node hash-password.js <password>');
    process.exit(1);
}

bcrypt.hash(password, 12).then(hash => {
    console.log('Password hash:', hash);
    console.log('\nSQL Insert:');
    console.log(`INSERT INTO users(username, 
                                   email, 
                                   password_hash, 
                                   is_admin) 
                                   VALUES (
                                   'lvelocci', 
                                   'lvelocci@gmail.com', 
                                   '${hash}', 
                                    1
                                    );`);
}).catch(err => {
    console.error('Error:', err);
});