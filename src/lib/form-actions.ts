import { toast } from "@/components/ui/use-toast";

export async function submitFormData(type: string, data: any) {
  console.log(`Submitting ${type} form data:`, data);
  try {
    const response = await fetch(`/api/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log(`${type} form submission response:`, responseData);

    if (!response.ok) {
      console.error(`${type} form submission failed:`, responseData);
      throw new Error(responseData.error || `Failed to submit ${type} form`);
    }

    return responseData;
  } catch (error) {
    console.error(`${type} form submission error:`, error);
    throw error;
  }
}

export async function updateFormData(type: string, data: any) {
  console.log(`Updating ${type} form data:`, data);
  try {
    const response = await fetch(`/api/${type}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log(`${type} form update response:`, responseData);

    if (!response.ok) {
      console.error(`${type} form update failed:`, responseData);
      throw new Error(responseData.error || `Failed to update ${type} form`);
    }

    return responseData;
  } catch (error) {
    console.error(`${type} form update error:`, error);
    throw error;
  }
}

export async function getFormData(type: string) {
  console.log(`Fetching ${type} form data`);
  try {
    const response = await fetch(`/api/${type}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseData = await response.json();
    console.log(`${type} form fetch response:`, responseData);

    if (!response.ok) {
      console.error(`${type} form fetch failed:`, responseData);
      throw new Error(
        responseData.error || `Failed to fetch ${type} form data`
      );
    }

    return responseData;
  } catch (error) {
    console.error(`${type} form fetch error:`, error);
    throw error;
  }
}
