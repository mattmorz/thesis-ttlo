// Define a basic type for the response structure
interface ApiResponseData {
  author_info?: {
    isSameAsApplicant?: boolean;
    sameAsApplicant?: boolean;
    personalInfo?: Record<string, any>;
    authors?: any[];
    [key: string]: any;
  };
  applicant_info?: {
    personalInfo?: Record<string, any>;
    [key: string]: any;
  };
  [key: string]: any;
}

const handleApiResponse = async (
  response: ApiResponseData
): Promise<ApiResponseData> => {
  try {
    let processedData = { ...response };

    // Normalize the author_info field structure
    if (processedData.author_info) {
      // Extract the checkbox state - this is the source of truth
      // Check for checkbox value in UI (explicitly cast to boolean)
      const isSameAsApplicant = !!processedData.author_info.isSameAsApplicant;

      console.log(`Pre-save state: isSameAsApplicant=${isSameAsApplicant}`, {
        authorInfo: processedData.author_info,
        applicantInfo: processedData.applicant_info,
      });

      // Handle migration from sameAsApplicant to isSameAsApplicant
      if (processedData.author_info.sameAsApplicant !== undefined) {
        console.log("Migrating sameAsApplicant to isSameAsApplicant");
        processedData.author_info.isSameAsApplicant =
          !!processedData.author_info.sameAsApplicant;
        delete processedData.author_info.sameAsApplicant;
      }

      // Create a clean author_info object
      const authorInfo = {
        ...processedData.author_info,
        // Force the value to be an explicit boolean
        isSameAsApplicant: isSameAsApplicant,
      };

      // CRITICAL: If checkbox is checked (true), copy applicant data
      if (isSameAsApplicant && processedData.applicant_info?.personalInfo) {
        console.log(
          "Checkbox is checked! Copying applicant data to author info"
        );

        // Replace author personal info with applicant data
        authorInfo.personalInfo = {
          ...processedData.applicant_info.personalInfo,
        };

        // Log to confirm the override happened
        console.log("Updated author personalInfo:", authorInfo.personalInfo);
      }

      // Update the processed data
      processedData.author_info = authorInfo;
    }

    return processedData;
  } catch (error) {
    console.error("Error processing API response:", error);
    return response; // Return original data on error
  }
};
