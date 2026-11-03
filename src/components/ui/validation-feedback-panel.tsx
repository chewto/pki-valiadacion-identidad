import { useId } from "react";
import type { ValidationFeedback } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import {
  CAPTURE_ADVICE,
  isUnreadableMessage,
} from "../../nucleo/constants/mismatch-messages";

interface Props {
  feedback: ValidationFeedback;
  id?: string;
}

const MRZ_MISMATCH_HEADING =
  "Un dato no coincide con la zona de lectura mecánica (MRZ). Vuelve a capturar el documento o revisa tus datos.";

const getHeading = (feedback: ValidationFeedback): string => {
  const { fieldIssues, generalMessages, tone, canContinue } = feedback;
  const allUnreadable =
    fieldIssues.length > 0 &&
    fieldIssues.every((issue) => issue.kind === "unreadable");

  if (allUnreadable && fieldIssues.length > 0) {
    return "No pudimos leer algunos datos del documento.";
  }

  if (generalMessages.some((message) => isUnreadableMessage(message))) {
    return "No pudimos leer toda la información del documento.";
  }

  const mrzMismatches = fieldIssues.filter(
    (issue) => issue.kind === "mismatch"
  );
  if (
    mrzMismatches.length > 0 &&
    mrzMismatches.every((issue) => issue.source === "mrz")
  ) {
    return MRZ_MISMATCH_HEADING;
  }

  if (tone === "error") {
    if (fieldIssues.some((issue) => issue.kind === "mismatch")) {
      return "Algunos datos no coinciden con el documento.";
    }
    return "No pudimos validar el documento.";
  }

  if (tone === "warning") {
    return canContinue
      ? "Algunos datos requieren tu revisión. Puedes continuar, pero revisa la información."
      : "Algunos datos requieren tu revisión. Vuelve a capturar el documento.";
  }

  return "Revisa la siguiente información.";
};

export const ValidationFeedbackPanel: React.FC<Props> = ({
  feedback,
  id,
}) => {
  const generatedId = useId();
  const panelId = id ?? `validation-feedback-${generatedId}`;
  const headingId = `${panelId}-heading`;

  if (!feedback.hasIssues) return null;

  const heading = getHeading(feedback);
  const showGeneralCaptureAdvice =
    feedback.generalMessages.some((message) => isUnreadableMessage(message)) &&
    !feedback.generalMessages.some((message) =>
      /foto más nítida|sin reflejos|bien enfocada/i.test(message)
    );
  const showErrorIcon = feedback.tone === "error";

  return (
    <section
      id={panelId}
      role="alert"
      aria-live={feedback.tone === "error" ? "assertive" : "polite"}
      aria-labelledby={headingId}
      className={`w-full rounded-xl border p-1 sm:p-1 my-0.5 text-left ${
        feedback.tone === "error"
          ? "border-red-200 bg-red-50 text-red-950"
          : feedback.tone === "warning"
            ? "border-amber-200 bg-amber-50 text-amber-950"
            : "border-blue-200 bg-blue-50 text-blue-950"
      }`}
    >
      <div className="flex items-start gap-1.5">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border ${
            feedback.tone === "error"
              ? "border-red-200 bg-red-100 text-red-700"
              : feedback.tone === "warning"
                ? "border-amber-200 bg-amber-100 text-amber-700"
                : "border-blue-200 bg-blue-100 text-blue-700"
          }`}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            {showErrorIcon ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            )}
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <h3
            id={headingId}
            className={`m-0 text-sm font-bold leading-snug sm:text-base ${
              feedback.tone === "error"
                ? "text-red-900"
                : feedback.tone === "warning"
                  ? "text-amber-900"
                  : "text-blue-900"
            }`}
          >
            {heading}
          </h3>

          {feedback.fieldIssues.length > 0 && (
            <ul
              aria-label="Datos que requieren revisión"
              className="mt-1 list-none space-y-1 p-0"
            >
              {feedback.fieldIssues.map((issue) => (
                <li
                  key={issue.field}
                  id={`${panelId}-${issue.field}`}
                  className="rounded-lg border border-black/5 bg-white/70 px-1 py-1"
                >
                  <p className="m-0 text-xs leading-relaxed sm:text-sm">
                    <span className="font-bold">{issue.label}:</span>{" "}
                    <span>{issue.message}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}

          {feedback.generalMessages.length > 0 && (
            <div className="mt-2 rounded-lg border border-black/5 bg-white/60 px-2.5 py-1">
              <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Otros mensajes de la validación
              </p>
              <ul className="m-0 list-disc pl-4 text-xs leading-relaxed sm:text-sm">
                {feedback.generalMessages.map((message, index) => (
                  <li key={`${normalizeMessageKey(message)}-${index}`}>
                    {message}
                  </li>
                ))}
              </ul>
              {showGeneralCaptureAdvice && (
                <p className="m-0 mt-0.5 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                  {CAPTURE_ADVICE}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const normalizeMessageKey = (message: string): string =>
  message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
