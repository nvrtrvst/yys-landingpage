const bcrypt = require('bcrypt');
const fs = require('fs');
const h = bcrypt.hashSync('rahasia123', 10);
fs.writeFileSync('C:\Users\End\AppData\Local\Temp\\new_hash.txt', h);
console.log('HASH:', h);
console.log('VERIFY:', bcrypt.compareSync('rahasia123', h));
