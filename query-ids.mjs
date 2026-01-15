import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute("SELECT id, id_paciente, nome FROM pacientes WHERE id_paciente LIKE '2026-%' ORDER BY id DESC");
console.log(JSON.stringify(rows, null, 2));
await conn.end();
