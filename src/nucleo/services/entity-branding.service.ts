import api from "@nucleo/api-urls/api";
import { URLS } from "@nucleo/api-urls/urls";
import { EntityBrandingResponse } from "@nucleo/interfaces/branding/branding.interface";

export const getEntityBranding = async (
  efirmaId: string | number
): Promise<EntityBrandingResponse> => {
  const { data } = await api.get(`${URLS.entityBranding}?efirmaId=${efirmaId}`);
  const logo =
    typeof data?.logo === "string" && data.logo.trim() !== ""
      ? data.logo.trim()
      : null;
  return { logo };
};
