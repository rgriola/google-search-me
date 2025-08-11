import bcrypt from 'bcrypt';

// this updates a user password via terminal.

// run it like this:
// node hash-user-pass-update.js "Test1234$$"

const password = process.argv[2];
if (!password) {
    console.log('Usage: node hash-user-pass-update.js <password>');
    process.exit(1);
}

bcrypt.hash(password, 12).then(hash => {
    console.log('Password hash:', hash);
    console.log('\nSQL UPDATE:');
    /*
    console.log(`UPDATE users SET 
                                   email = 'lvelocci@gmail.com', 
                                   password_hash = '${hash}', 
                                   is_admin = 1
                                   WHERE username = 'lvelocci';`);
                                   */
    // allows a password reset w/o email verification - trusted user
    console.log(`UPDATE users SET   password_hash = '${hash}',
                                    email_verified = 1
                                    WHERE username = 'lvelocci';`);
                                    
}).catch(err => {
    console.error('Error:', err);
});