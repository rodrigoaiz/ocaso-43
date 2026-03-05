/**
 * Script para generar hashes bcrypt de las contraseñas
 * Ejecutar: npm run hash-passwords
 */

import bcrypt from 'bcryptjs';

const usuarios = [
  { username: 'rodrigo', password: 'R0dr1g0$Cv43!2026' },
  { username: 'arturo', password: 'Artur0*Cv43@2026' },
  { username: 'carlos', password: 'Carl0s#Cv43!2026' },
];

async function hashPasswords() {
  console.log('🔐 Generando hashes bcrypt...\n');
  
  for (const user of usuarios) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`Usuario: ${user.username}`);
    console.log(`Password: ${user.password}`);
    console.log(`Hash: ${hash}`);
    console.log('');
  }
  
  console.log('✅ Hashes generados');
  console.log('\n📝 Copia estos hashes en el script SQL de Supabase');
  console.log('   Reemplaza [HASH_REAL_AQUI] con los valores de arriba');
}

hashPasswords().catch(console.error);
