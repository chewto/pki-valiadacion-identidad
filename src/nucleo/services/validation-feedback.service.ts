import type {
  FieldIssue,
  MismatchField,
  MismatchSource,
  ValidationFeedback,
} from "../interfaces/validacion-identidad/informacion-identidad.interface";
import {
  getMismatchMessage,
  getUnreadableMessage,
  isUnreadableMessage,
  MISMATCH_FIELD_LABELS,
} from "../constants/mismatch-messages";

const FIELD_ORDER: MismatchField[] = ["name", "lastName", "ID"];

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isMismatchField = (value: unknown): value is MismatchField =>
  typeof value === "string" && FIELD_ORDER.includes(value as MismatchField);

const asNonEmptyString = (value: unknown): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : "";

const asFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const inferFieldFromText = (text: string): MismatchField | null => {
  const normalized = normalizeText(text);

  if (/\bapellidos?\b/.test(normalized)) return "lastName";
  if (/\bnombres?\b/.test(normalized)) return "name";
  if (
    /\b(?:numero|num|nro)\.?\s+de\s+documento\b/.test(normalized) ||
    /\bdocumento\s+de\s+identidad\b/.test(normalized) ||
    /\bdni\b/.test(normalized) ||
    /\bidentificacion\b/.test(normalized)
  ) {
    return "ID";
  }
  return null;
};

const inferSourceFromText = (text: string): MismatchSource =>
  /mrz|zona de lectura mecanica|lectura mecanica/i.test(text) ? "mrz" : "ocr";

const looksLikeMismatch = (text: string): boolean =>
  /no coincide|no concuerda|no corresponde|no es igual|no pertenece/i.test(text);

const getOcrValue = (
  response: Record<string, unknown>,
  field: MismatchField
): string => {
  const ocr = response.ocr;
  if (!isRecord(ocr) || !isRecord(ocr.data)) return "";
  return asNonEmptyString(ocr.data[field]);
};

const buildIssue = (
  field: MismatchField,
  source: MismatchSource,
  kind: FieldIssue["kind"],
  apiMessage?: string,
  percentage?: number,
  threshold?: number
): FieldIssue => ({
  field,
  label: MISMATCH_FIELD_LABELS[field],
  source,
  message:
    kind === "unreadable"
      ? getUnreadableMessage(field)
      : getMismatchMessage(field, source),
  ...(apiMessage ? { apiMessage } : {}),
  ...(percentage !== undefined ? { percentage } : {}),
  ...(threshold !== undefined ? { threshold } : {}),
  kind,
});

const isUnreadableMismatch = (
  response: Record<string, unknown>,
  field: MismatchField,
  source: MismatchSource,
  message: string,
  percentage?: number,
  threshold?: number
): boolean => {
  if (message && isUnreadableMessage(message)) return true;
  if (source !== "ocr") return false;
  return (
    percentage === 0 &&
    threshold !== undefined &&
    getOcrValue(response, field).length === 0
  );
};

/**
 * Convierte una respuesta de /ocr/anverso o /ocr/reverso en un modelo de
 * presentación estable. Acepta respuestas antiguas y valores malformados.
 */
export const normalizeValidationFeedback = (
  response: unknown
): ValidationFeedback => {
  const raw = isRecord(response) ? response : {};
  const validSide = raw.validSide === true;
  const rawMismatches = Array.isArray(raw.mismatches) ? raw.mismatches : [];
  const rawMessages = Array.isArray(raw.messages) ? raw.messages : [];

  const mismatchHasField = rawMismatches.some(
    (item) => isRecord(item) && isMismatchField(item.field)
  );
  const hasBackendMismatch = raw.hasMismatch === true || mismatchHasField;

  const issuesByField = new Map<MismatchField, FieldIssue>();
  const representedMessageKeys = new Set<string>();

  for (const item of rawMismatches) {
    if (!isRecord(item) || !isMismatchField(item.field)) continue;

    const field = item.field;
    const source: MismatchSource = item.source === "mrz" ? "mrz" : "ocr";
    const apiMessage = asNonEmptyString(item.message);
    const percentage = asFiniteNumber(item.percentage);
    const threshold = asFiniteNumber(item.threshold);
    const kind: FieldIssue["kind"] = isUnreadableMismatch(
      raw,
      field,
      source,
      apiMessage,
      percentage,
      threshold
    )
      ? "unreadable"
      : "mismatch";

    if (apiMessage) representedMessageKeys.add(normalizeText(apiMessage));

    const candidate = buildIssue(
      field,
      source,
      kind,
      apiMessage || undefined,
      percentage,
      threshold
    );
    const existing = issuesByField.get(field);

    // Un mismatch real tiene prioridad sobre una lectura ilegible del mismo campo.
    if (!existing || (existing.kind === "unreadable" && kind === "mismatch")) {
      issuesByField.set(field, candidate);
    }
  }

  const generalMessages: string[] = [];
  const generalMessageKeys = new Set<string>();

  const addGeneralMessage = (text: string) => {
    const key = normalizeText(text);
    if (!key || generalMessageKeys.has(key)) return;
    generalMessageKeys.add(key);
    generalMessages.push(text);
  };

  for (const rawMessage of rawMessages) {
    const text = asNonEmptyString(rawMessage);
    if (!text) continue;

    const key = normalizeText(text);
    if (representedMessageKeys.has(key)) continue;

    const field = inferFieldFromText(text);
    if (!field) {
      addGeneralMessage(text);
      continue;
    }

    // Un campo se muestra una sola vez, independientemente de si venía en
    // mismatches o en messages.
    if (issuesByField.has(field)) continue;

    if (isUnreadableMessage(text)) {
      const issue = buildIssue(
        field,
        inferSourceFromText(text),
        "unreadable",
        text
      );
      issuesByField.set(field, issue);
      representedMessageKeys.add(key);
      continue;
    }

    if (looksLikeMismatch(text)) {
      const issue = buildIssue(
        field,
        inferSourceFromText(text),
        "mismatch",
        text
      );
      issuesByField.set(field, issue);
      representedMessageKeys.add(key);
      continue;
    }

    addGeneralMessage(text);
  }

  const fieldIssues = FIELD_ORDER.flatMap((field) => {
    const issue = issuesByField.get(field);
    return issue ? [issue] : [];
  });

  const hasMismatch =
    hasBackendMismatch ||
    fieldIssues.some((issue) => issue.kind === "mismatch");

  const hasIssues =
    fieldIssues.length > 0 ||
    generalMessages.length > 0 ||
    hasMismatch ||
    !validSide;

  const tone: ValidationFeedback["tone"] = hasIssues
    ? validSide
      ? "warning"
      : "error"
    : "success";

  return {
    hasIssues,
    hasMismatch,
    tone,
    canContinue: validSide && !hasMismatch,
    fieldIssues,
    generalMessages,
  };
};

/**
 * Un feedback solo avanza si es efectivamente no bloqueante o si el intento
 * actual era el último disponible. Un mismatch siempre bloquea mientras
 * queden intentos, incluso si el backend reportó validSide: true.
 */
export const shouldAutoAdvanceAfterValidation = (
  feedback: ValidationFeedback,
  attemptsRemaining: number
): boolean => feedback.canContinue || attemptsRemaining <= 0;
