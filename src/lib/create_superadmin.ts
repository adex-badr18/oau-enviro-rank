import "dotenv/config";
import { prisma } from "./db";
import { hashPassword } from "../lib/auth-crypto";
import crypto from "crypto";

async function main() {
    const email = "superadmin@oau.edu.ng";
    const password = "password123";

    console.log("Seeding superadmin into PostgreSQL...");

    // Check if profile already exists
    const existingProfile = await prisma.profile.findFirst({
        where: { email }
    });

    const hashedPassword = hashPassword(password);

    if (existingProfile) {
        console.log("Superadmin profile already exists in DB:", existingProfile.email);
        console.log("Updating password and role...");
        await prisma.profile.update({
            where: { id: existingProfile.id },
            data: {
                role: "superadmin",
                passwordHash: hashedPassword
            }
        });
        console.log("Successfully updated existing superadmin profile.");
        return;
    }

    console.log("Creating new superadmin profile in PostgreSQL...");
    const newProfile = await prisma.profile.create({
        data: {
            id: crypto.randomUUID(),
            email,
            passwordHash: hashedPassword,
            role: "superadmin",
        }
    });

    console.log("✓ Superadmin account created successfully in PostgreSQL!");
    console.log(`ID: ${newProfile.id}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("Fatal error:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
