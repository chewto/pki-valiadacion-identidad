import { useEffect, useState } from "react";
import type { CamposDocumento } from "../../nucleo/interfaces/validacion-identidad/informacion-identidad.interface";
import { isCamposCompleto } from "../../nucleo/vision/document-fields";

interface Props {
  campos: CamposDocumento;
  onConfirm: (campos: CamposDocumento) => void;
  onRecapture: () => void;
}

interface FieldConfig {
  key: keyof Pick<
    CamposDocumento,
    | "nombre"
    | "apellido"
    | "documento"
    | "fechaNacimiento"
    | "fechaExpiracion"
  >;
  label: string;
  placeholder: string;
  required: boolean;
}

const FIELDS: FieldConfig[] = [
  {
    key: "nombre",
    label: "Nombres",
    placeholder: "Nombres del documento",
    required: true,
  },
  {
    key: "apellido",
    label: "Apellidos",
    placeholder: "Apellidos del documento",
    required: true,
  },
  {
    key: "documento",
    label: "N.º de documento",
    placeholder: "Número de documento",
    required: true,
  },
  {
    key: "fechaNacimiento",
    label: "Fecha de nacimiento",
    placeholder: "DD/MM/AAAA",
    required: false,
  },
  {
    key: "fechaExpiracion",
    label: "Fecha de expiración",
    placeholder: "DD/MM/AAAA",
    required: false,
  },
];

export const CamposDocumentoPanel: React.FC<Props> = ({
  campos,
  onConfirm,
  onRecapture,
}) => {
  const [draft, setDraft] = useState<CamposDocumento>(campos);

  useEffect(() => {
    setDraft(campos);
  }, [campos]);

  const updateField = (key: FieldConfig["key"], value: string) => {
    setDraft((previous) => {
      const next: CamposDocumento = {
        ...previous,
        [key]: value,
        origen: "manual",
        completado: false,
      };
      next.completado = isCamposCompleto(next);
      return next;
    });
  };

  const complete = isCamposCompleto(draft);

  return (
    <section
      className="document-fields-panel"
      aria-labelledby="document-fields-title"
    >
      <div className="document-fields-header">
        <div>
          <h3 id="document-fields-title">Datos leídos del documento</h3>
          <p>
            {complete
              ? "Revisa que coincidan con tu documento antes de continuar."
              : "Completa los datos que no pudimos leer del documento."}
          </p>
        </div>
        <span className={`document-fields-badge${complete ? " is-ok" : ""}`}>
          {complete ? "Completos" : "Faltan datos"}
        </span>
      </div>

      <div className="document-fields-grid">
        {FIELDS.map((field) => (
          <label key={field.key} className="document-fields-field">
            <span>
              {field.label}
              {field.required ? " *" : ""}
            </span>
            <input
              type="text"
              value={draft[field.key] ?? ""}
              placeholder={field.placeholder}
              onChange={(event) => updateField(field.key, event.target.value)}
              autoComplete="off"
            />
          </label>
        ))}
      </div>

      <div className="document-fields-actions">
        <button
          type="button"
          className="document-guide-primary"
          onClick={() => onConfirm(draft)}
        >
          Confirmar datos
        </button>
        <button
          type="button"
          className="document-guide-secondary"
          onClick={onRecapture}
        >
          Volver a capturar
        </button>
      </div>
    </section>
  );
};
