import { db } from "./db";
import { eq } from "drizzle-orm";
import { userAccount, userRole } from "./models/schema";

async function main() {
  try {
    // Create admin user
    const adminUser = {
      name: "Admin User",
      email: "admin@example.com",
      role: "admin" as const,
      isActive: true,
    };

    const result = await db.insert(userAccount).values(adminUser);
    console.log("Admin user created:", result);

    // Create TTLO staff user
    const staffUser = {
      name: "TTLO Staff",
      email: "staff@example.com",
      role: "ttlo_staff" as const,
      isActive: true,
    };

    await db.insert(userAccount).values(staffUser);
    console.log("Staff user created!");

    // Create client user
    const clientUser = {
      name: "Client User",
      email: "client@example.com",
      role: "client" as const,
      isActive: true,
    };

    await db.insert(userAccount).values(clientUser);
    console.log("Client user created!");

    // Get all users
    const users = await db.select().from(userAccount);
    console.log("All users in database:", users);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error running seed:", error);
    process.exit(1);
  });
