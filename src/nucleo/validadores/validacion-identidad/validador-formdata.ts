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

  console.log(form.get(key));
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
  fecha: "fecha"
};
