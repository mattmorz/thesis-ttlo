import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/drizzle/db";
import {
  ipDisclosure,
  formSubmissionRegistry,
  ipDisclosureApplicant,
  ipDisclosureInventor,
  disclosureConfirmation,
  copyrightBasicApplication,
  trademarkApplication,
  tradeSecretApplication,
  patentUtilityModelApplication,
} from "@/drizzle/migrations/schema";
import { and, eq } from "drizzle-orm";

// Type definitions for better type safety
interface SelectedIpTypes {
  copyright?: boolean;
  patent?: boolean;
  utilityModel?: boolean;
  industrialDesign?: boolean;
  trademark?: boolean;
  tradeSecret?: boolean;
  notSure?: boolean;
  other?: boolean;
}

interface BusinessType {
  company?: boolean;
  soleProprietor?: boolean;
}

export const dynamic = "force-dynamic";

/**
 * Dedicated endpoint for PDF generation that returns IP disclosure data
 * in a clean format directly consumable by the PDF generator
 */
export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ No user session found");
      return NextResponse.json(
        { error: "Unauthorized: No user session" },
        { status: 401 }
      );
    }

    // Get the applicationId from query params
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching IP disclosure for application: ${applicationId}`);

    // Find the IP disclosure record
    let disclosure = await db.query.ipDisclosure.findFirst({
      where: eq(ipDisclosure.applicationId, applicationId),
      with: {
        // Include related data needed for the PDF
        ipDisclosureApplicants: true,
        ipDisclosureInventors: true,
        disclosureConfirmations: true,
      },
    });

    // If not found directly, check via registry
    if (!disclosure) {
      console.log(
        `📋 No direct IP disclosure match for application ${applicationId}, checking via registry`
      );

      // Find the form registry entry for this application and IP disclosure
      const formRegistry = await db.query.formSubmissionRegistry.findFirst({
        where: and(
          eq(formSubmissionRegistry.ipApplicationId, applicationId),
          eq(formSubmissionRegistry.sourceType, "ip_disclosure")
        ),
      });

      if (formRegistry?.sourceId) {
        console.log(
          `📄 Found registry entry with sourceId: ${formRegistry.sourceId}`
        );
        disclosure = await db.query.ipDisclosure.findFirst({
          where: eq(ipDisclosure.disclosureId, formRegistry.sourceId),
          with: {
            ipDisclosureApplicants: true,
            ipDisclosureInventors: true,
            disclosureConfirmations: true,
          },
        });
      }
    }

    if (!disclosure) {
      console.log(`❌ No IP disclosure found for application ${applicationId}`);
      return NextResponse.json(
        { error: "No IP disclosure found for this application" },
        { status: 404 }
      );
    }

    // Process selected IP types from JSON string if needed
    let selectedIpTypes: SelectedIpTypes = {};
    try {
      if (
        disclosure.selectedIpTypes &&
        typeof disclosure.selectedIpTypes === "string"
      ) {
        selectedIpTypes = JSON.parse(
          disclosure.selectedIpTypes
        ) as SelectedIpTypes;
      } else if (
        disclosure.selectedIpTypes &&
        typeof disclosure.selectedIpTypes === "object"
      ) {
        selectedIpTypes =
          disclosure.selectedIpTypes as unknown as SelectedIpTypes;
      }
    } catch (error) {
      console.error("❌ Error parsing selectedIpTypes:", error);
      selectedIpTypes = {};
    }

    // Fetch specific IP application data based on selected IP type
    let copyrightApplicationData = null;
    let trademarkApplicationData = null;
    let tradeSecretApplicationData = null;
    let patentUtilityModelApplicationData = null;

    // If disclosure has a copyright selection, fetch copyright application
    if (selectedIpTypes.copyright) {
      console.log("📄 Fetching copyright application data");
      copyrightApplicationData =
        await db.query.copyrightBasicApplication.findFirst({
          where: eq(
            copyrightBasicApplication.disclosureId,
            disclosure.disclosureId
          ),
        });
    }

    // If disclosure has a trademark selection, fetch trademark application
    if (selectedIpTypes.trademark) {
      console.log("📄 Fetching trademark application data");
      trademarkApplicationData = await db.query.trademarkApplication.findFirst({
        where: eq(trademarkApplication.disclosureId, disclosure.disclosureId),
      });
    }

    // If disclosure has a trade secret selection, fetch trade secret application
    if (selectedIpTypes.tradeSecret) {
      console.log("📄 Fetching trade secret application data");
      tradeSecretApplicationData =
        await db.query.tradeSecretApplication.findFirst({
          where: eq(
            tradeSecretApplication.disclosureId,
            disclosure.disclosureId
          ),
        });
    }

    // If disclosure has a patent or utility model selection, fetch patent/utility model application
    if (selectedIpTypes.patent || selectedIpTypes.utilityModel) {
      console.log("📄 Fetching patent/utility model application data");
      patentUtilityModelApplicationData =
        await db.query.patentUtilityModelApplication.findFirst({
          where: eq(
            patentUtilityModelApplication.disclosureId,
            disclosure.disclosureId
          ),
        });
    }

    // Parse business type for trademark application
    let businessType = "";
    if (trademarkApplicationData && trademarkApplicationData.businessType) {
      try {
        let businessTypeObj: BusinessType;

        if (typeof trademarkApplicationData.businessType === "string") {
          businessTypeObj = JSON.parse(
            trademarkApplicationData.businessType as string
          ) as BusinessType;
        } else {
          businessTypeObj =
            trademarkApplicationData.businessType as unknown as BusinessType;
        }

        if (businessTypeObj && businessTypeObj.company) {
          businessType = "Company";
        } else if (businessTypeObj && businessTypeObj.soleProprietor) {
          businessType = "Sole Proprietor";
        }
      } catch (error) {
        console.error("❌ Error parsing businessType:", error);
      }
    }

    // Format the data for PDF consumption
    const formattedData = {
      disclosureId: disclosure.disclosureId,
      applicationId: disclosure.applicationId,
      clientId: disclosure.clientId,
      email: disclosure.email,
      authorizedRepresentative: disclosure.authorizedRepresentative,
      otherIpType: disclosure.otherIpType,
      isRightfulOwner: disclosure.isRightfulOwner,
      status: disclosure.status,
      createdAt: disclosure.createdAt,
      updatedAt: disclosure.updatedAt,

      // Format the applicants from the related table
      applicants:
        disclosure.ipDisclosureApplicants?.map((applicant) => ({
          firstName: applicant.firstName,
          middleInitial: applicant.middleInitial || "",
          lastName: applicant.lastName,
        })) || [],

      // Format the inventors from the related table
      inventors:
        disclosure.ipDisclosureInventors?.map((inventor) => ({
          firstName: inventor.firstName,
          middleInitial: inventor.middleInitial || "",
          lastName: inventor.lastName,
        })) || [],

      // Include disclosure confirmations
      confirmations:
        disclosure.disclosureConfirmations?.map((confirmation) => ({
          writtenDisclosures: confirmation.writtenDisclosures,
          oralDisclosures: confirmation.oralDisclosures,
          futureWork: confirmation.futureWork,
          confirmationDeclaration: confirmation.confirmationDeclaration,
        })) || [],

      // Include parsed IP type selections
      ...selectedIpTypes,

      // Include specific IP application data if available
      copyrightApplication: copyrightApplicationData
        ? {
            workTitle: copyrightApplicationData.workTitle || "",
            workDescription: copyrightApplicationData.workDescription || "",
            creationDate: copyrightApplicationData.creationDate || "",
          }
        : null,

      trademarkApplication: trademarkApplicationData
        ? {
            trademarkName: trademarkApplicationData.trademarkName || "",
            description: trademarkApplicationData.description || "",
            translation: trademarkApplicationData.translation || "",
            classifications: Array.isArray(
              trademarkApplicationData.niceClassifications
            )
              ? trademarkApplicationData.niceClassifications.join(", ")
              : trademarkApplicationData.niceClassifications || "",
            businessType: businessType,
            legalName: trademarkApplicationData.legalName || "",
          }
        : null,

      tradeSecretApplication: tradeSecretApplicationData
        ? {
            description: tradeSecretApplicationData.description || "",
            confidentialityMeasures:
              tradeSecretApplicationData.confidentialityMeasures || "",
          }
        : null,

      patentUtilityModelApplication: patentUtilityModelApplicationData
        ? {
            title: patentUtilityModelApplicationData.title || "",
            type: patentUtilityModelApplicationData.type || "",
            technologyType:
              patentUtilityModelApplicationData.technologyType || {},
            technologyField:
              patentUtilityModelApplicationData.technologyField || {},
            problem: patentUtilityModelApplicationData.problem || "",
            solution: patentUtilityModelApplicationData.solution || "",
            comparison: patentUtilityModelApplicationData.comparison || "",
            novelty: patentUtilityModelApplicationData.novelty || "",
            variations: patentUtilityModelApplicationData.variations || "",
            usage: patentUtilityModelApplicationData.usage || "",
            literatureReferences:
              patentUtilityModelApplicationData.literatureReferences || "",
            ownPublications:
              patentUtilityModelApplicationData.ownPublications || "",
          }
        : null,
    };

    console.log(
      `✅ IP disclosure retrieved successfully for application ${applicationId}`
    );

    // Return the formatted data
    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("❌ Error fetching IP disclosure for PDF:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch IP disclosure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
