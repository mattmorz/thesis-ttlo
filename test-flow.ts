import "dotenv/config";
import { db } from "./src/drizzle/db";
import { ipApplication, formSubmissionRegistry } from "./src/drizzle/schema";
import { v4 as uuid } from "uuid";

async function test() {
  const newAppId = uuid();
  const userId = "b8452331-eb79-4505-829d-476798083812"; 

  try {
    console.log("Inserting IP Application:", newAppId);
    await db.insert(ipApplication).values({
      id: newAppId,
      userId: userId,
      title: "Test Flow",
      status: "draft",
      progress: 0,
      ipType: "patent",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    console.log("Inserting Registry with IP Application ID:", newAppId);
    await db.insert(formSubmissionRegistry).values({
      userId: userId,
      sourceType: "client_profile",
      sourceId: newAppId, 
      ipApplicationId: newAppId,
      status: "submitted",
    });
    
    console.log("Success!");
  } catch (err) {
    console.error("Failed:", err);
  }
}
test();
