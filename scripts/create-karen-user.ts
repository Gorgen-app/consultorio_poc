import { getPooledDb } from "../server/_core/database";
import { users, userProfiles, userCredentials } from "../drizzle/schema";
import { vinculoSecretariaMedico } from "../drizzle/schema";
import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;

async function createKarenUser() {
  const db = await getPooledDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    // Dados da Karen
    const karenData = {
      name: "Karen Trindade",
      email: "karen.trindade@andregorgen.com.br",
      username: "karen.trindade",
      password: "Gorgen@2026!", // Senha temporária - deve ser alterada no primeiro login
    };

    // Verificar se já existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, karenData.email));

    if (existingUser) {
      console.log("Usuário Karen já existe com ID:", existingUser.id);
      process.exit(0);
    }

    // Gerar openId único
    const openId = `local_${crypto.randomUUID()}`;

    // 1. Criar usuário na tabela users
    const [userResult] = await db.insert(users).values({
      openId,
      name: karenData.name,
      email: karenData.email,
      loginMethod: "local",
      role: "user",
      tenantId: 1,
    });

    const userId = userResult.insertId;
    console.log("Usuário criado com ID:", userId);

    // 2. Criar credenciais de login
    const passwordHash = await bcrypt.hash(karenData.password, SALT_ROUNDS);
    await db.insert(userCredentials).values({
      userId,
      username: karenData.username,
      passwordHash,
    });
    console.log("Credenciais criadas para username:", karenData.username);

    // 3. Criar perfil de secretária
    await db.insert(userProfiles).values({
      userId,
      nomeCompleto: karenData.name,
      email: karenData.email,
      perfilAtivo: "secretaria",
      isAdminMaster: 0,
      isMedico: 0,
      isSecretaria: 1,
      isAuditor: 0,
      isPaciente: 0,
      tenantId: 1,
    });
    console.log("Perfil de secretária criado");

    // 4. Buscar ID do Dr. André Gorgen (admin master)
    const [adminUser] = await db
      .select()
      .from(users)
      .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(userProfiles.isAdminMaster, 1));

    if (adminUser) {
      // 5. Criar vínculo secretária-médico
      const dataInicio = new Date();
      const dataValidade = new Date();
      dataValidade.setFullYear(dataValidade.getFullYear() + 1);

      await db.insert(vinculoSecretariaMedico).values({
        secretariaUserId: String(userId),
        medicoUserId: String(adminUser.users.id),
        dataInicio: dataInicio.toISOString().slice(0, 19).replace("T", " "),
        dataValidade: dataValidade.toISOString().slice(0, 19).replace("T", " "),
        status: "ativo",
        tenantId: 1,
      });
      console.log("Vínculo criado com Dr. André Gorgen (ID:", adminUser.users.id, ")");
    } else {
      console.log("AVISO: Não foi possível encontrar o admin master para criar vínculo");
    }

    console.log("\n✅ Usuário Karen Trindade criado com sucesso!");
    console.log("📧 Email:", karenData.email);
    console.log("👤 Username:", karenData.username);
    console.log("🔑 Senha temporária:", karenData.password);
    console.log("\n⚠️  A senha deve ser alterada no primeiro login!");

  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    process.exit(1);
  }

  process.exit(0);
}

import { eq } from "drizzle-orm";
createKarenUser();
