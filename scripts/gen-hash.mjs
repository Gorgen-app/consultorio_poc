import bcrypt from 'bcryptjs';

const password = 'Gorgen@CEO2026!';
const hash = await bcrypt.hash(password, 12);
console.log(hash);
