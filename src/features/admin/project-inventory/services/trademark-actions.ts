import {
  TrademarkInventoryType,
  TrademarkFilterType,
} from "../schemas/trademark";

/**
 * Fetch the trademark inventory data with optional filters and pagination
 * @param filters Filter parameters
 * @param pagination Pagination parameters
 * @returns Trademark inventory data with total count
 */
export async function fetchTrademarkInventory(
  filters: TrademarkFilterType = { status: "all", search: "" },
  pagination = {
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortDirection: "desc" as "asc" | "desc",
  }
): Promise<{ data: TrademarkInventoryType[]; total: number; error?: string }> {
  try {
    // Create query parameters
    const queryParams = new URLSearchParams();
    if (filters.status && filters.status !== "all") {
      queryParams.append("status", filters.status);
    }
    if (filters.search) {
      queryParams.append("search", filters.search);
    }

    queryParams.append("page", pagination.page.toString());
    queryParams.append("limit", pagination.limit.toString());
    queryParams.append("sortBy", pagination.sortBy);
    queryParams.append("sortDirection", pagination.sortDirection);

    // Make API request
    const response = await fetch(
      `/api/admin/trademark-inventory?${queryParams.toString()}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to fetch trademark inventory"
      );
    }

    const result = await response.json();
    return { data: result.data, total: result.total };
  } catch (error) {
    console.error("Error fetching trademark inventory:", error);
    return {
      data: [],
      total: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a specific trademark record by ID
 * @param id Trademark ID
 * @returns Trademark record
 */
export async function getTrademarkById(
  id: string
): Promise<TrademarkInventoryType | null> {
  try {
    const response = await fetch(`/api/admin/trademark/${id}`);

    if (!response.ok) {
      throw new Error("Failed to fetch trademark record");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching trademark record:", error);
    return null;
  }
}

/**
 * Update a trademark record
 * @param id Trademark ID
 * @param data Updated trademark data
 * @returns Success status
 */
export async function updateTrademark(
  id: string,
  data: Partial<TrademarkInventoryType>
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/admin/trademark/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update trademark");
    }

    return { success: true, message: "Trademark updated successfully" };
  } catch (error) {
    console.error("Error updating trademark:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Delete a trademark record
 * @param id Trademark ID
 * @returns Success status
 */
export async function deleteTrademark(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/admin/trademark/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete trademark");
    }

    return { success: true, message: "Trademark deleted successfully" };
  } catch (error) {
    console.error("Error deleting trademark:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
