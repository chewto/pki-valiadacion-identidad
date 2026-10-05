import api from "@nucleo/api-urls/api";
import { URLS } from "@nucleo/api-urls/urls";
import {
  DocumentConfigResponse,
} from "@nucleo/interfaces/firma/location.interface";

/**
 * Defaults seguros si el endpoint no responde:
 * la UI no exige GPS ni anticipa bloqueo; el backend sigue siendo
 * la autoridad (podrá rechazar con LOCATION_REQUIRED / VPN_DETECTED).
 */
export const DEFAULT_DOCUMENT_CONFIG: DocumentConfigResponse = {
  require_location_validation: false,
  block_on_vpn: false,
};

interface DocumentConfigParams {
  hash?: string;
  efirmaId?: string;
}

/**
 * Consulta la configuración del documento (ubicación obligatoria / política VPN).
 * TODO: endpoint placeholder — ruta pendiente de definir por backend.
 */
export const getDocumentConfig = async (
  params: DocumentConfigParams
): Promise<DocumentConfigResponse> => {
  const query = params.hash
    ? `hash=${params.hash}`
    : `efirmaId=${params.efirmaId ?? ""}`;
  const { data } = await api.get(`${URLS.documentConfig}?${query}`);
  return {
    require_location_validation: Boolean(data?.require_location_validation),
    block_on_vpn: Boolean(data?.block_on_vpn),
    ...(typeof data?.location_radius_meters === "number"
      ? { location_radius_meters: data.location_radius_meters }
      : {}),
  };
};
