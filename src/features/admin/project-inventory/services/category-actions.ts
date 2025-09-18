"use server";

import { CategoryAdapter } from "./category-adapter";

/**
 * Get Patent/UM disclosures and applications
 */
export async function getPatentUMData(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<{ data: any[]; total: number }> {
  return CategoryAdapter.getPatentUMData(options);
}

/**
 * Update Patent/UM application data
 */
export async function updatePatentUMData(params: {
  patentId: string;
  title?: string;
  problem?: string;
  solution?: string;
  comparison?: string;
  novelty?: string;
  variations?: string;
  usage?: string;
  literatureReferences?: string;
  ownPublications?: string;
}): Promise<{ success: boolean; message: string }> {
  return CategoryAdapter.updatePatentUMData(params);
}

/**
 * Get Copyright disclosures and applications
 */
export async function getCopyrightData(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  search?: string;
}): Promise<{ data: any[]; total: number }> {
  return CategoryAdapter.getCopyrightData(options);
}

/**
 * Get Trademark disclosures and applications
 */
export async function getTrademarkData(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<{ data: any[]; total: number }> {
  return CategoryAdapter.getTrademarkData(options);
}

/**
 * Get Trade Secret disclosures and applications
 */
export async function getTradeSecretData(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<{ data: any[]; total: number }> {
  return CategoryAdapter.getTradeSecretData(options);
}

/**
 * Get Industrial Design / Other disclosures
 */
export async function getIndustrialDesignData(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<{ data: any[]; total: number }> {
  return CategoryAdapter.getIndustrialDesignData(options);
}

/**
 * Get Client Profile data
 */
export async function getClientProfileData(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<{ data: any[]; total: number }> {
  return CategoryAdapter.getClientProfileData(options);
}

/**
 * Update Copyright Transaction Part 2 data
 */
export async function updateCopyrightTransaction(
  transactionId: string,
  data: any
): Promise<{ success: boolean; message: string }> {
  return CategoryAdapter.updateCopyrightTransaction(transactionId, data);
}

/**
 * Delete Copyright Transaction Part 2
 */
export async function deleteCopyrightTransaction(
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  return CategoryAdapter.deleteCopyrightTransaction(transactionId);
}

/**
 * Get Substantial Use data
 */
export async function getSubstantialUseData(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<{ data: any[]; total: number }> {
  return CategoryAdapter.getSubstantialUseData(options);
}

/**
 * Get Deed of Assignment data
 */
export async function getDeedOfAssignmentData(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<{ data: any[]; total: number }> {
  return CategoryAdapter.getDeedOfAssignmentData(options);
}
