export type NormalizedIpTypes = {
  copyright: boolean;
  patent: boolean;
  utilityModel: boolean;
  industrialDesign: boolean;
  trademark: boolean;
  tradeSecret: boolean;
  other: boolean;
  notSure: boolean;
};

export type ApplicationIpTypeValue =
  | "patent"
  | "trademark"
  | "copyright"
  | "industrial_design"
  | "utility_model"
  | "trade_secret"
  | "other"
  | "not_sure";

export const emptyIpTypes: NormalizedIpTypes = {
  copyright: false,
  patent: false,
  utilityModel: false,
  industrialDesign: false,
  trademark: false,
  tradeSecret: false,
  other: false,
  notSure: false,
};

export const normalizeIpTypes = (
  ipTypes?: Partial<NormalizedIpTypes> | null
): NormalizedIpTypes => ({
  copyright: Boolean(ipTypes?.copyright),
  patent: Boolean(ipTypes?.patent),
  utilityModel: Boolean(ipTypes?.utilityModel),
  industrialDesign: Boolean(ipTypes?.industrialDesign),
  trademark: Boolean(ipTypes?.trademark),
  tradeSecret: Boolean(ipTypes?.tradeSecret),
  other: Boolean(ipTypes?.other),
  notSure: Boolean(ipTypes?.notSure),
});

export const hasSelectedIpTypes = (
  ipTypes?: Partial<NormalizedIpTypes> | null
) => Boolean(ipTypes) && Object.values(ipTypes).some((value) => value === true);

export const areIpTypesEqual = (
  left?: Partial<NormalizedIpTypes> | null,
  right?: Partial<NormalizedIpTypes> | null
) => {
  const normalizedLeft = normalizeIpTypes(left);
  const normalizedRight = normalizeIpTypes(right);

  return (
    normalizedLeft.copyright === normalizedRight.copyright &&
    normalizedLeft.patent === normalizedRight.patent &&
    normalizedLeft.utilityModel === normalizedRight.utilityModel &&
    normalizedLeft.industrialDesign === normalizedRight.industrialDesign &&
    normalizedLeft.trademark === normalizedRight.trademark &&
    normalizedLeft.tradeSecret === normalizedRight.tradeSecret &&
    normalizedLeft.other === normalizedRight.other &&
    normalizedLeft.notSure === normalizedRight.notSure
  );
};

export const deriveIpTypesFromApplicationIpType = (
  ipType?: string | null
): { ipTypes: NormalizedIpTypes; otherIpType: string } => {
  if (!ipType) {
    return { ipTypes: { ...emptyIpTypes }, otherIpType: "" };
  }

  const normalized = ipType.trim().toLowerCase();
  const nextIpTypes: NormalizedIpTypes = { ...emptyIpTypes };
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

export const mapApplicationTypeToSelectionKey = (
  value: ApplicationIpTypeValue
): keyof NormalizedIpTypes => {
  switch (value) {
    case "industrial_design":
      return "industrialDesign";
    case "utility_model":
      return "utilityModel";
    case "trade_secret":
      return "tradeSecret";
    case "not_sure":
      return "notSure";
    default:
      return value;
  }
};

export const mapSelectionKeyToApplicationType = (
  key: keyof NormalizedIpTypes
): ApplicationIpTypeValue => {
  switch (key) {
    case "industrialDesign":
      return "industrial_design";
    case "utilityModel":
      return "utility_model";
    case "tradeSecret":
      return "trade_secret";
    case "notSure":
      return "not_sure";
    default:
      return key;
  }
};

export const buildIpTypesFromApplicationValues = (
  values: readonly ApplicationIpTypeValue[]
) => {
  const nextIpTypes = { ...emptyIpTypes };

  values.forEach((value) => {
    nextIpTypes[mapApplicationTypeToSelectionKey(value)] = true;
  });

  return nextIpTypes;
};

export const getPrimaryApplicationIpType = (
  ipTypes?: Partial<NormalizedIpTypes> | null
): ApplicationIpTypeValue => {
  const normalized = normalizeIpTypes(ipTypes);

  const orderedKeys: (keyof NormalizedIpTypes)[] = [
    "patent",
    "trademark",
    "copyright",
    "industrialDesign",
    "utilityModel",
    "tradeSecret",
    "other",
    "notSure",
  ];

  const selectedKey =
    orderedKeys.find((key) => normalized[key]) ?? ("other" as const);

  return mapSelectionKeyToApplicationType(selectedKey);
};

export const getSelectedApplicationIpTypes = (
  ipTypes?: Partial<NormalizedIpTypes> | null
): ApplicationIpTypeValue[] =>
  (Object.entries(normalizeIpTypes(ipTypes)) as [keyof NormalizedIpTypes, boolean][])
    .filter(([, value]) => value)
    .map(([key]) => mapSelectionKeyToApplicationType(key));
