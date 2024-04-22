export const ValidadorFormdata = (
  form: FormData,
  key: string,
  value: File | string 
) => {
  if (form.has(key)) {
    form.set(key, value);
  }

  if (!form.has(key)) {
    form.append(key, value);
  }
};

export const formdataKeys = {
  nombres: "nombres",
  apellidos: "apellidos",
  numero_documento: "numero_documento",
  email: "email",
  anverso_documento: "anverso",
  reverso_documento: "reverso",
  foto_persona: "foto_persona",
  tipoDocumento: "tipo_documento",
  dispositivo: "dispositivo",
  navegador: "navegador",
  ip: "ip",
  latitud: "latitud",
  longitud: "longitud",
  hora: "hora",
  fecha: "fecha",
  porcentajeNombreOCR: "porcentaje_nombre_ocr",
  porcentajeApellidoOCR: "porcentaje_apellido_ocr",
  porcentajeDocumentoOCR: "porcentaje_documento_ocr",
  nombreOCR: "nombre_ocr",
  apellidoOCR: "apellido_ocr",
  documentoOCR: "documento_ocr",
  reconocidoCB: "reconocido_CB",
  nombreCB: "nombre_CB",
  apellidoCB: "apellido_CB",
  documentoCB: "documento_CB"
};
