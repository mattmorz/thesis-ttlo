import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as z from "zod";
import {
  personalInfoSchema,
  educationalBackgroundSchema,
  backgroundIPSchema,
  signatureSchema,
} from "@/lib/validations/client-profile";

type BackgroundIP = {
  publishedResearch: "no" | "yes" | "submitted";
  developedMaterials: "no" | "yes" | "ongoing";
  familiarWithIPRights: boolean;
  ipExperience: {
    hasExperience: boolean;
    types: {
      copyright: boolean;
      patent: boolean;
      utilityModel: boolean;
      industrialDesign: boolean;
      trademark: boolean;
      other: boolean;
    };
    otherSpecify?: string;
  };
};

type EducationalBackground = {
  highestDegree: "bachelor" | "master" | "doctorate" | "other";
  otherDegree?: string;
  degreeProgram: string;
  profession: string;
};

interface ClientProfileState {
  clientId: string | null;
  personalInfo: z.infer<typeof personalInfoSchema> | null;
  educationalBackground: z.infer<typeof educationalBackgroundSchema> | null;
  backgroundIP: z.infer<typeof backgroundIPSchema> | null;
  signatureConfirmation: z.infer<typeof signatureSchema> | null;
  setClientId: (id: string) => void;
  setPersonalInfo: (data: z.infer<typeof personalInfoSchema>) => void;
  setEducationalBackground: (
    data: z.infer<typeof educationalBackgroundSchema>
  ) => void;
  setBackgroundIP: (data: z.infer<typeof backgroundIPSchema>) => void;
  setSignatureConfirmation: (data: z.infer<typeof signatureSchema>) => void;
  validateForm: (
    section:
      | "personalInfo"
      | "educationalBackground"
      | "backgroundIP"
      | "signatureConfirmation"
  ) => boolean;
  resetStore: () => void;
  isFormValid: () => boolean;
}

export const useClientProfileStore = create<ClientProfileState>()(
  persist(
    (set, get) => ({
      clientId: null,
      personalInfo: null,
      educationalBackground: null,
      backgroundIP: null,
      signatureConfirmation: null,

      setClientId: (id) => set({ clientId: id }),

      setPersonalInfo: (data) => {
        console.log("Setting personal info:", data);
        set({ personalInfo: data });
      },

      setEducationalBackground: (data) => {
        console.log("Setting educational background:", data);
        set({ educationalBackground: data });
      },

      setBackgroundIP: (data) => {
        console.log("Setting background IP:", data);
        set({ backgroundIP: data });
      },

      setSignatureConfirmation: (data) => {
        console.log("Setting signature confirmation:", data);
        set({ signatureConfirmation: data });
      },

      validateForm: (section) => {
        const state = get();
        console.log(`Validating ${section}:`, state[section]);

        try {
          switch (section) {
            case "personalInfo":
              if (!state.personalInfo) return false;
              personalInfoSchema.parse(state.personalInfo);
              return true;

            case "educationalBackground":
              if (!state.educationalBackground) return false;
              educationalBackgroundSchema.parse(state.educationalBackground);
              return true;

            case "backgroundIP":
              if (!state.backgroundIP) return false;
              backgroundIPSchema.parse(state.backgroundIP);
              return true;

            case "signatureConfirmation":
              if (!state.signatureConfirmation) return false;
              signatureSchema.parse(state.signatureConfirmation);
              return true;

            default:
              return false;
          }
        } catch (error) {
          console.error(`Validation error for ${section}:`, error);
          return false;
        }
      },

      resetStore: () => {
        set({
          clientId: null,
          personalInfo: null,
          educationalBackground: null,
          backgroundIP: null,
          signatureConfirmation: null,
        });
      },

      isFormValid: () => {
        const state = get();
        return (
          state.validateForm("personalInfo") &&
          state.validateForm("educationalBackground") &&
          state.validateForm("backgroundIP") &&
          state.validateForm("signatureConfirmation")
        );
      },
    }),
    {
      name: "client-profile-storage",
      skipHydration: false,
    }
  )
);
