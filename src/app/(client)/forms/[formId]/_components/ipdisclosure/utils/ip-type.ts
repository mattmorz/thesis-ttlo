import type { IpTypes } from "@/lib/store/ip-disclosure-store";

const emptyIpTypes: IpTypes = {
  copyright: false,
  patent: false,
  utilityModel: false,
  industrialDesign: false,
  trademark: false,
  tradeSecret: false,
  other: false,
  notSure: false,
};

type DerivedIpTypes = {
  ipTypes: IpTypes;
  otherIpType: string;
};

export const deriveIpTypesFromApplicationIpType = (
  ipType?: string | null
): DerivedIpTypes => {
  if (!ipType) {
    return { ipTypes: { ...emptyIpTypes }, otherIpType: "" };
  }

  const normalized = ipType.trim().toLowerCase();
  const nextIpTypes: IpTypes = { ...emptyIpTypes };
  let otherIpType = "";

  switch (normalized) {
    case "patent":
      nextIpTypes.patent = true;
      break;
    case "utility_model":
      nextIpTypes.utilityModel = true;
      break;
    case "industrial_design":
      nextIpTypes.industrialDesign = true;
      break;
    case "trade_secret":
      nextIpTypes.tradeSecret = true;
      break;
    case "trademark":
      nextIpTypes.trademark = true;
      break;
    case "copyright":
      nextIpTypes.copyright = true;
      break;
    case "not_sure":
      nextIpTypes.notSure = true;
      break;
    case "other":
      nextIpTypes.other = true;
      break;
    default:
      nextIpTypes.other = true;
      otherIpType = ipType;
      break;
  }

  return { ipTypes: nextIpTypes, otherIpType };
};
