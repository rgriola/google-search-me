import bcrypt from 'bcrypt';

// run it like this:
// node hash-pass-Insert-user.js "your-password-here"

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
                                   'jono', 
                                   'shanachie@gmail.com', 
                                   '${hash}', 
                                    1
                                    );`);
}).catch(err => {
    console.error('Error:', err);
});