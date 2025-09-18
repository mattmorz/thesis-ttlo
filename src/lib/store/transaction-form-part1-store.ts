import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";

const coAuthorSchema = z.object({
  firstName: z.string().optional(),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  civilStatus: z.string().optional(),
  sex: z.string().optional(),
  nationality: z.string().optional(),
  countryOfResidence: z.string().optional(),
  address: z.string().optional(),
  municipality: z.string().optional(),
  provinceState: z.string().optional(),
  zipCode: z.string().optional(),
  mobileNumber: z.string().optional(),
  emailAddress: z.string().optional(),
  isClaimingEntireWork: z.boolean().default(false),
  claimDetails: z.string().optional(),
});

const formSchema = z.object({
  transaction_data: z.object({
    coAuthors: z.array(coAuthorSchema),
  }),
  disclosureId: z.string().uuid().optional(),
  copyrightId: z.string().uuid().optional(),
});

// Create a store for transaction form part 1 data
export interface TransactionFormPart1State {
  data: z.infer<typeof formSchema> | null;
  setData: (data: z.infer<typeof formSchema>) => void;
}

export const useTransactionFormPart1Store = create<TransactionFormPart1State>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
    }),
    {
      name: "transaction-form-part1-storage",
    }
  )
);
