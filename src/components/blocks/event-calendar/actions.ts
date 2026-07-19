"use server";

import type { Event, EventCreateInput, EventUpdateInput } from "./types";

/**
 * Fetches all events from the database
 */
export async function getEvents(): Promise<Event[]> {
  return [];
}

/**
 * Creates a new event in the database
 */
export async function createEvent(data: EventCreateInput): Promise<Event> {
  throw new Error("createEvent is not implemented in production actions.");
}

/**
 * Updates an existing event in the database
 */
export async function updateEvent(data: EventUpdateInput): Promise<Event> {
  throw new Error("updateEvent is not implemented in production actions.");
}

/**
 * Deletes an event from the database
 */
export async function deleteEvent(id: string): Promise<{ success: boolean }> {
  throw new Error("deleteEvent is not implemented in production actions.");
}
