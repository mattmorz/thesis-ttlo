import React, { useEffect } from "react";
import { useIpDisclosure } from "./hooks/use-ip-disclosure";
import { useHydratedIpDisclosureStore } from "@/lib/store/ip-disclosure-store";

const IpDisclosureComponent = () => {
  const { isHydrated } = useHydratedIpDisclosureStore();
  const { disclosureId } = useHydratedIpDisclosureStore();
  const ipDisclosure = useIpDisclosure();

  useEffect(() => {
    const checkExistingData = async () => {
      if (isHydrated && !disclosureId) {
        console.log("Checking for existing disclosures on page mount");
        try {
          await ipDisclosure.checkExistingDisclosureAndFetch();
        } catch (error) {
          console.error("Error checking for existing disclosures:", error);
        }
      }
    };

    checkExistingData();
  }, [isHydrated, disclosureId, ipDisclosure]);

  return <div>{/* Render your component content here */}</div>;
};

export default IpDisclosureComponent;
