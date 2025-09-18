import * as z from "zod";

const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  barangay: z.string().min(1, "Barangay is required"),
  cityMunicipality: z.string().min(1, "City/Municipality is required"),
  province: z.string().min(1, "Province is required"),
});

export const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  gender: z.enum(["male", "female", "prefer_not_to_say"]).nullable(),
  age: z.number().min(1, "Age is required"),
  citizenship: z.string().min(1, "Citizenship is required"),
  otherCitizenship: z.string().optional(),
  mailingAddress: z.string().min(1, "Mailing address is required"),
  contactNumber: z.string().min(1, "Contact number is required"),
  email: z.string().email("Invalid email address"),
  companyName: z.string().optional(),
  companyStreet: z.string().optional(),
  companyBarangay: z.string().optional(),
  companyCityMunicipality: z.string().optional(),
  companyProvince: z.string().optional(),
  companyEmail: z.string().email("Invalid email address").optional(),
  occupation: z.string().optional(),
});

export const educationalBackgroundSchema = z.object({
  highestDegree: z.enum(["bachelor", "master", "doctorate", "other"]),
  otherDegree: z.string().optional(),
  degreeProgram: z.string().min(1, "Degree program is required"),
  profession: z.string().min(1, "Profession is required"),
});

export const backgroundIPSchema = z.object({
  publishedResearch: z.enum(["no", "yes", "submitted"]),
  developedMaterials: z.enum(["no", "yes", "ongoing"]),
  familiarWithIPRights: z.boolean(),
  ipExperience: z.object({
    hasExperience: z.boolean(),
    types: z.object({
      copyright: z.boolean(),
      patent: z.boolean(),
      utilityModel: z.boolean(),
      industrialDesign: z.boolean(),
      trademark: z.boolean(),
      other: z.boolean(),
    }),
    otherSpecify: z.string().optional(),
  }),
});

export const signatureSchema = z.object({
  clientSignature: z.instanceof(File).nullable(),
  staffSignature: z.instanceof(File).nullable(),
});
