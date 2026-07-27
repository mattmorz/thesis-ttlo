import "dotenv/config";
import { db } from "./src/drizzle/db";
import { formSubmissionRegistry } from "./src/drizzle/schema";

async function testInsert() {
  try {
    const result = await db.insert(formSubmissionRegistry).values({
      userId: "b8452331-eb79-4505-829d-476798083812", // UUID format
      sourceType: "client_profile",
      sourceId: "b8452331-eb79-4505-829d-476798083812",
      ipApplicationId: "b8452331-eb79-4505-829d-476798083812",
      status: "submitted",
      title: "Test",
      description: "Test description",
      inventorsCreators: JSON.stringify([{ name: "Test", role: "Applicant" }]),
      applicants: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }).returning();
    console.log("Success:", result);
  } catch (error) {
    console.error("Error inserting:", error);
  }
}

testInsert();
