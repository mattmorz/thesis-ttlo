import "dotenv/config";
import { db } from "./src/drizzle/db";
import { userAccount, ipApplication } from "./src/drizzle/schema";

async function test() {
  const user = await db.query.userAccount.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  console.log("User ID:", user.id);
  
  const app = await db.query.ipApplication.findFirst({
    where: (apps, { eq }) => eq(apps.userId, user.id)
  });
  if (!app) {
    console.log("No application found for user");
    return;
  }
  console.log("App ID:", app.id);
  console.log("App title:", app.title);
  process.exit(0);
}
test();
