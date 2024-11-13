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
  documentoCB: "documento_CB",
  movimiento: "movement_test",
  idCarpetaEntidad: "carpeta_entidad_prueba_vida",
  idCarpetaUsuario: "carpeta_usuario_prueba_vida",
  mrz: "mrz",
  mrzName: "mrz_name",
  mrzLastname: "mrz_lastname",
  mrzNamePercent: "mrz_name_percent",
  mrzLastnamePercent: "mrz_lastname_percent",
  codigoBarras: "codigo_barras",
  frontCorrespondingSide: "front_corresponding",
  frontCode: 'front_code',
  frontCountry: 'front_country',
  frontCountryCheck: 'front_country_check',
  frontType: 'front_type',
  frontTypeCheck:'front_type_check',
  backCorrespondingSide: "back_corresponding",
  backCode: 'back_code',
  backCountry: 'back_country',
  backCountryCheck: 'back_country_check',
  backType: 'back_type',
  backTypeCheck:'back_type_check',
  validationAttendance: "validation_attendance",
  validationPercent: "validation_percent"
};
