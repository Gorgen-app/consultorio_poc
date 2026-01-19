import { getPooledDb } from "../server/_core/database";
import { users, userCredentials, userProfiles } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function createAndreUser() {
  const db = await getPooledDb();
  
  const email = "andre@gorgen.com.br";
  const username = "andre.gorgen";
  const password = "Gorgen@CEO2026!";
  
  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  let userId: string;
  
  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    console.log("Usuário já existe, atualizando credenciais...");
  } else {
    // Create user
    const newUserId = crypto.randomUUID();
    await db.insert(users).values({
      id: newUserId,
      openId: `local_${newUserId}`,
      email: email,
      name: "Dr. André Gorgen",
      role: "admin",
      loginMethod: "local",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    userId = newUserId;
    console.log("Usuário criado com ID:", userId);
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Check if credentials exist
  const existingCreds = await db.select().from(userCredentials).where(eq(userCredentials.userId, userId)).limit(1);
  
  if (existingCreds.length > 0) {
    // Update credentials
    await db.update(userCredentials)
      .set({ 
        passwordHash: passwordHash,
        updatedAt: new Date().toISOString()
      })
      .where(eq(userCredentials.userId, userId));
    console.log("Credenciais atualizadas!");
  } else {
    // Create credentials
    await db.insert(userCredentials).values({
      id: crypto.randomUUID(),
      userId: userId,
      username: username,
      passwordHash: passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log("Credenciais criadas!");
  }
  
  // Check if profile exists
  const existingProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  
  if (existingProfile.length === 0) {
    await db.insert(userProfiles).values({
      id: crypto.randomUUID(),
      odataId: `local_${userId}`,
      odataEtag: "local",
      userId: userId,
      nome: "Dr. André Gorgen",
      email: email,
      isAdminMaster: 1,
      isMedico: 1,
      isSecretaria: 0,
      isPaciente: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log("Perfil criado!");
  }
  
  console.log("\n========================================");
  console.log("CREDENCIAIS DO DR. ANDRÉ GORGEN:");
  console.log("========================================");
  console.log("Username: andre.gorgen");
  console.log("Senha: Gorgen@CEO2026!");
  console.log("========================================");
  console.log("\nAcesse: /login e use essas credenciais");
  
  process.exit(0);
}

createAndreUser().catch(console.error);
