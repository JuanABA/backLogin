const bcrypt = require("bcryptjs");

async function hashPassword(password) {
  const salt = await bcrypt.genSaltSync(8);
  const hashedPassword = await bcrypt.hashSync(password, salt);
  console.log(`La contraseña hasheada es: ${hashedPassword}`);
}

// Uso
const passwordToHash = "password";
hashPassword(passwordToHash);
