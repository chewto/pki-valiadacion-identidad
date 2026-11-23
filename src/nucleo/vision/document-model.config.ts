export type DocumentCountry = "COL" | "HND";

export type GuideSide = "anverso" | "reverso";

export interface GuideSideProfile {
  containers: readonly string[];
  required: readonly string[];
  recommended: readonly string[];
}

export type GuideDocumentProfile = Partial<
  Record<GuideSide, GuideSideProfile>
>;

export type GuideProfiles = Record<string, GuideDocumentProfile>;

export interface GuideThresholds {
  confidence: number;
  iou: number;
  minAreaRatio: number;
  maxAreaRatio: number;
  maxCenterOffset: number;
  minLuminance: number;
  maxLuminance: number;
  maxGlareRatio: number;
  minSharpness: number;
  stableMs: number;
  inferenceIntervalMs: number;
}

const envBaseUrl = import.meta.env.VITE_DOCUMENT_MODEL_BASE_URL;

export const DEFAULT_DOCUMENT_MODEL_BASE_URL =
  "https://huggingface.co/chuito1503/noaexport-modelos/resolve/main";

const normalizeModelBase = (rawBase: string): string => {
  const resolved = toModelResolveUrl(rawBase);
  const withoutFile = /\.onnx$/i.test(resolved)
    ? resolved.replace(/\/[^/]+$/, "")
    : resolved;
  return withoutFile.replace(/\/+$/, "");
};

export const DOCUMENT_MODEL_BASE_URL = normalizeModelBase(
  envBaseUrl && envBaseUrl.trim().length > 0
    ? envBaseUrl.trim()
    : DEFAULT_DOCUMENT_MODEL_BASE_URL
);

export const COUNTRY_MODEL_FILE: Record<DocumentCountry, string> = {
  COL: "colombia-v0.1.onnx",
  HND: "honduras-v0.1.onnx",
};

/**
 * URL del manifiesto opcional. Si la URL base es el repositorio por defecto
 * en Hugging Face (que no cuenta con metadata.json), se define como null
 * para evitar llamadas de red innecesarias y errores 404 en la consola.
 */
export const DOCUMENT_MODEL_MANIFEST_URL: string | null =
  DOCUMENT_MODEL_BASE_URL === DEFAULT_DOCUMENT_MODEL_BASE_URL
    ? null
    : `${DOCUMENT_MODEL_BASE_URL}/metadata.json`;

export const COLOMBIA_LABELS: readonly string[] = [
  "CEDULA_CIUDADANIA_FRONTAL",
  "NUMERO_DOCUMENTO",
  "APELLIDOS",
  "NOMBRES",
  "FIRMA",
  "FOTO",
  "ENCABEZADO",
  "CEDULA_CIUDADANIA_REVERSO",
  "CODIGO_BARRAS",
  "HUELLA",
  "FECHA_NACIMIENTO",
  "LUGAR_NACIMIENTO",
  "ESTATURA",
  "GRUPO_SANGUINEO",
  "SEXO",
  "FECHA_EXPEDICION",
  "CODIGO",
  "CEDULA_EXTRANJERIA_FRONTAL",
  "NACIONALIDAD",
  "FECHA_EXPIRACION",
  "GHOST",
  "CEDULA_EXTRANJERIA_REVERSO",
  "MRZ",
  "CEDULA_DIGITAL_FRONTAL",
  "CEDULA_DIGITAL_REVERSO",
  "PASAPORTE",
  "NUMERO_PERSONAL",
  "AUTORIDAD",
  "CODIGO_PAIS",
  "TIPO",
  "CODIG_BARRAS_LATERAL",
  "NUMERO_LATERAL",
  "NUMERO_PASAPORTE",
];

export const HONDURAS_LABELS: readonly string[] = [
  "dni_anverso",
  "nombre",
  "apellido",
  "numero_documento",
  "fecha_nacimiento",
  "fecha_expiracion",
  "tipo_documento",
  "foto_persona",
  "firma",
  "nacionalidad",
  "lugar_nacimiento",
  "ghost",
  "dni_reverso",
  "codigo_datamatrix",
  "codigo_barras",
  "codigo_qr",
  "domicilio",
  "mrz",
];

export const FALLBACK_LABELS: Record<DocumentCountry, readonly string[]> = {
  COL: COLOMBIA_LABELS,
  HND: HONDURAS_LABELS,
};

/**
 * Metadatos de respaldo: el repo de Hugging Face puede no incluir
 * `metadata.json`, pero estos valores corresponden a los ONNX publicados.
 * Se usan para validar tamaño/hash cuando el manifiesto no está disponible.
 */
export const FALLBACK_MODEL_SHA256: Record<DocumentCountry, string> = {
  COL: "d3b3e7d01e384e7b558f936b22148303cff722a53c4d670e24fbadd04a3333f3",
  HND: "66bab653b1dcc0dff828fe8b02da9adb9641a5a7c4e7d5797e206206460f3d70",
};

export const FALLBACK_MODEL_BYTES: Record<DocumentCountry, number> = {
  COL: 80838806,
  HND: 101510750,
};

export const GUIDE_THRESHOLDS: GuideThresholds = {
  confidence: 0.25,
  iou: 0.45,
  minAreaRatio: 0.18,
  maxAreaRatio: 0.92,
  maxCenterOffset: 0.18,
  minLuminance: 45,
  maxLuminance: 215,
  maxGlareRatio: 0.04,
  minSharpness: 40,
  stableMs: 1200,
  inferenceIntervalMs: 850,
};

const CEDULA_COLOMBIA_ANVERSO: GuideSideProfile = {
  containers: ["CEDULA_CIUDADANIA_FRONTAL", "CEDULA_DIGITAL_FRONTAL"],
  required: ["NOMBRES", "APELLIDOS", "NUMERO_DOCUMENTO"],
  recommended: ["FOTO", "FIRMA", "FECHA_NACIMIENTO"],
};

const CEDULA_COLOMBIA_REVERSO: GuideSideProfile = {
  containers: ["CEDULA_CIUDADANIA_REVERSO", "CEDULA_DIGITAL_REVERSO"],
  required: [],
  recommended: ["MRZ", "CODIGO_BARRAS", "HUELLA"],
};

const COLOMBIA_PROFILES: GuideProfiles = {
  "CEDULA DE CIUDADANIA": {
    anverso: CEDULA_COLOMBIA_ANVERSO,
    reverso: CEDULA_COLOMBIA_REVERSO,
  },
  "CEDULA DIGITAL": {
    anverso: CEDULA_COLOMBIA_ANVERSO,
    reverso: CEDULA_COLOMBIA_REVERSO,
  },
  "CEDULA DE EXTRANJERIA": {
    anverso: {
      containers: ["CEDULA_EXTRANJERIA_FRONTAL"],
      required: ["NOMBRES", "APELLIDOS", "NUMERO_DOCUMENTO"],
      recommended: ["FOTO", "FECHA_NACIMIENTO", "FECHA_EXPIRACION"],
    },
    reverso: {
      containers: ["CEDULA_EXTRANJERIA_REVERSO"],
      required: [],
      recommended: ["MRZ", "FECHA_EXPIRACION", "NACIONALIDAD"],
    },
  },
  PASAPORTE: {
    anverso: {
      containers: ["PASAPORTE"],
      required: ["NUMERO_PASAPORTE", "NOMBRES", "APELLIDOS"],
      recommended: ["FECHA_NACIMIENTO", "FECHA_EXPIRACION", "MRZ"],
    },
  },
};

const HONDURAS_PROFILES: GuideProfiles = {
  DNI: {
    anverso: {
      containers: ["dni_anverso"],
      required: ["nombre", "apellido", "numero_documento"],
      recommended: ["fecha_nacimiento", "fecha_expiracion", "foto_persona"],
    },
    reverso: {
      containers: ["dni_reverso"],
      required: [],
      recommended: ["mrz", "codigo_qr", "codigo_barras", "codigo_datamatrix"],
    },
  },
};

export const DOCUMENT_GUIDE_PROFILES: Record<
  DocumentCountry,
  GuideProfiles
> = {
  COL: COLOMBIA_PROFILES,
  HND: HONDURAS_PROFILES,
};

export const DOCUMENT_CONTAINERS: Record<DocumentCountry, readonly string[]> = {
  COL: [
    "CEDULA_CIUDADANIA_FRONTAL",
    "CEDULA_CIUDADANIA_REVERSO",
    "CEDULA_DIGITAL_FRONTAL",
    "CEDULA_DIGITAL_REVERSO",
    "CEDULA_EXTRANJERIA_FRONTAL",
    "CEDULA_EXTRANJERIA_REVERSO",
    "PASAPORTE",
  ],
  HND: ["dni_anverso", "dni_reverso"],
};

export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  NOMBRES: "Nombres",
  APELLIDOS: "Apellidos",
  NUMERO_DOCUMENTO: "N.º de documento",
  NUMERO_PASAPORTE: "N.º de pasaporte",
  FECHA_NACIMIENTO: "Fecha de nacimiento",
  FECHA_EXPIRACION: "Fecha de expiración",
  FECHA_EXPEDICION: "Fecha de expedición",
  NACIONALIDAD: "Nacionalidad",
  FOTO: "Fotografía",
  FIRMA: "Firma",
  MRZ: "Zona MRZ",
  CODIGO_BARRAS: "Código de barras",
  CODIG_BARRAS_LATERAL: "Código de barras lateral",
  HUELLA: "Huella",
  nombre: "Nombres",
  apellido: "Apellidos",
  numero_documento: "N.º de documento",
  fecha_nacimiento: "Fecha de nacimiento",
  fecha_expiracion: "Fecha de expiración",
  foto_persona: "Fotografía",
  firma: "Firma",
  mrz: "Zona MRZ",
  codigo_qr: "Código QR",
  codigo_barras: "Código de barras",
  codigo_datamatrix: "DataMatrix",
};

export const normalizeDocumentType = (value?: string): string =>
  value
    ? value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";

export const isDocumentCountry = (value: string): value is DocumentCountry =>
  value === "COL" || value === "HND";

export const getCountryModelFile = (
  country: string
): { country: DocumentCountry; fileName: string } | null => {
  if (!isDocumentCountry(country)) return null;
  return { country, fileName: COUNTRY_MODEL_FILE[country] };
};

export const getModelUrl = (country: string): string | null => {
  const config = getCountryModelFile(country);
  if (!config) return null;
  return `${DOCUMENT_MODEL_BASE_URL}/${config.fileName}`;
};

export const getGuideProfile = (
  country: string,
  tipoDocumento: string,
  lado: GuideSide
): GuideSideProfile | null => {
  if (!isDocumentCountry(country)) return null;
  const documentKey = normalizeDocumentType(tipoDocumento);
  const profiles = DOCUMENT_GUIDE_PROFILES[country];
  return profiles[documentKey]?.[lado] ?? null;
};

export const getExpectedContainers = (
  country: string,
  tipoDocumento: string,
  lado: GuideSide
): readonly string[] => {
  const profile = getGuideProfile(country, tipoDocumento, lado);
  return profile?.containers ?? [];
};

/**
 * Convierte los enlaces `/blob/` de Hugging Face (que devuelven HTML) en
 * enlaces `/resolve/`, que sí entregan el archivo binario.
 */
export function toModelResolveUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  if (!value) return value;
  try {
    const parsed = new URL(value);
    if (parsed.hostname.endsWith("huggingface.co")) {
      parsed.pathname = parsed.pathname.replace("/blob/", "/resolve/");
    }
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return value;
  }
}

export const isDocumentGuideEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  const query = new URLSearchParams(window.location.search).get("guia");
  if (query === "1") return true;
  if (query === "0") return false;
  return import.meta.env.VITE_DOCUMENT_GUIDE_ENABLED === "true";
};
