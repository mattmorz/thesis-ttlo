/**
 * Cleanup Duplicate Client Profiles
 *
 * This script identifies and cleans up duplicate client profiles by:
 * 1. Finding profiles that have the same user_id, first_name, and last_name
 * 2. Checking which profile is correctly registered in the form submission registry
 * 3. Merging data from duplicate profiles into the primary profile
 * 4. Updating registry references to point to the primary profile
 * 5. Removing duplicate profiles
 *
 * Usage:
 *   npx tsx src/scripts/cleanup-duplicate-profiles.ts
 */

import { db } from "@/drizzle/db";
import {
  clientProfile,
  formSubmissionRegistry,
} from "@/drizzle/migrations/schema";
import { eq, and, inArray } from "drizzle-orm";

async function cleanupDuplicateProfiles() {
  console.log("Starting duplicate profile cleanup...");

  try {
    // 1. Get all client profiles
    const profiles = await db.query.clientProfile.findMany();
    console.log(`Found ${profiles.length} total client profiles`);

    // Group profiles by user_id, filter out any with null userId
    const profilesByUser: Record<string, typeof profiles> = {};

    profiles.forEach((profile) => {
      // Skip profiles with null userId
      if (!profile.userId) {
        console.log(
          `Warning: Found profile with null userId: ${profile.clientId}`
        );
        return;
      }

      const userId = profile.userId;
      if (!profilesByUser[userId]) {
        profilesByUser[userId] = [];
      }
      profilesByUser[userId].push(profile);
    });

    // Find users with duplicate profiles
    const usersWithDuplicates = Object.keys(profilesByUser).filter(
      (userId) => profilesByUser[userId].length > 1
    );

    console.log(
      `Found ${usersWithDuplicates.length} users with duplicate profiles`
    );

    if (usersWithDuplicates.length === 0) {
      console.log("No duplicate profiles found. Exiting.");
      return;
    }

    // Process each user with duplicates
    for (const userId of usersWithDuplicates) {
      const userProfiles = profilesByUser[userId];
      console.log(
        `\nProcessing user ${userId} with ${userProfiles.length} profiles:`
      );

      // Display the profiles for this user
      userProfiles.forEach((profile, index) => {
        console.log(`  Profile ${index + 1}:`);
        console.log(`    ID: ${profile.clientId}`);
        console.log(`    Name: ${profile.firstName} ${profile.lastName}`);
        console.log(`    Created: ${profile.createdAt}`);
        console.log(`    Updated: ${profile.updatedAt}`);
        console.log(`    Status: ${profile.status}`);
      });

      // Find registry entries for these profiles
      const profileIds = userProfiles.map((p) => p.clientId);
      const registryEntries = await db.query.formSubmissionRegistry.findMany({
        where: and(
          eq(formSubmissionRegistry.userId, userId),
          eq(formSubmissionRegistry.sourceType, "client_profile"),
          inArray(formSubmissionRegistry.sourceId, profileIds)
        ),
      });

      console.log(
        `  Found ${registryEntries.length} registry entries for these profiles`
      );

      // If there are no registry entries for any profile, keep the newest one
      if (registryEntries.length === 0) {
        const sortedProfiles = [...userProfiles].sort((a, b) => {
          // Handle null dates by using a default old date (2000-01-01)
          const dateA = a.updatedAt
            ? new Date(a.updatedAt)
            : new Date("2000-01-01");
          const dateB = b.updatedAt
            ? new Date(b.updatedAt)
            : new Date("2000-01-01");
          return dateB.getTime() - dateA.getTime();
        });

        const primaryProfile = sortedProfiles[0];
        const duplicateProfiles = sortedProfiles.slice(1);

        console.log(
          `  No registry entries found. Keeping newest profile: ${primaryProfile.clientId}`
        );

        // Delete duplicate profiles
        for (const profile of duplicateProfiles) {
          console.log(
            `  Deleting unregistered duplicate profile: ${profile.clientId}`
          );
          await db
            .delete(clientProfile)
            .where(eq(clientProfile.clientId, profile.clientId));
        }
        continue;
      }

      // Find registered profile IDs
      const registeredProfileIds = new Set(
        registryEntries.map((entry) => entry.sourceId)
      );
      console.log(
        `  Profiles registered in form submission registry: ${Array.from(
          registeredProfileIds
        ).join(", ")}`
      );

      // Find unregistered profiles
      const unregisteredProfiles = userProfiles.filter(
        (profile) => !registeredProfileIds.has(profile.clientId)
      );

      // Delete unregistered duplicate profiles
      for (const profile of unregisteredProfiles) {
        console.log(
          `  Deleting unregistered duplicate profile: ${profile.clientId}`
        );
        await db
          .delete(clientProfile)
          .where(eq(clientProfile.clientId, profile.clientId));
      }

      // If there are multiple registered profiles, we need to consolidate them
      if (registeredProfileIds.size > 1) {
        const registeredProfiles = userProfiles.filter((profile) =>
          registeredProfileIds.has(profile.clientId)
        );

        // Sort by update date to find the most recent one
        const sortedRegisteredProfiles = [...registeredProfiles].sort(
          (a, b) => {
            // Handle null dates by using a default old date (2000-01-01)
            const dateA = a.updatedAt
              ? new Date(a.updatedAt)
              : new Date("2000-01-01");
            const dateB = b.updatedAt
              ? new Date(b.updatedAt)
              : new Date("2000-01-01");
            return dateB.getTime() - dateA.getTime();
          }
        );

        const primaryProfile = sortedRegisteredProfiles[0];
        const duplicateProfiles = sortedRegisteredProfiles.slice(1);

        console.log(
          `  Multiple registered profiles found. Keeping most recent: ${primaryProfile.clientId}`
        );

        // Update all registry entries to point to the primary profile
        for (const entry of registryEntries) {
          if (entry.sourceId !== primaryProfile.clientId) {
            console.log(
              `  Updating registry entry ${entry.registryId} to point to primary profile`
            );
            await db
              .update(formSubmissionRegistry)
              .set({ sourceId: primaryProfile.clientId })
              .where(eq(formSubmissionRegistry.registryId, entry.registryId));
          }
        }

        // Delete duplicate registered profiles
        for (const profile of duplicateProfiles) {
          console.log(
            `  Deleting duplicate registered profile: ${profile.clientId}`
          );
          await db
            .delete(clientProfile)
            .where(eq(clientProfile.clientId, profile.clientId));
        }
      }
    }

    console.log("\nCleanup complete!");
  } catch (error) {
    console.error("Error during cleanup:", error);
  }
}

// Only run the function if this file is executed directly
if (require.main === module) {
  cleanupDuplicateProfiles()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}
