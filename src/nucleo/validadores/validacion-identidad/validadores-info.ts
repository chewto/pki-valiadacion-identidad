export const normalizeDocumento = (documento: string) => {
  const normalizacion = documento.toLowerCase();
  let documentoLimpio = "";

  const numeros: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  for (let index = 0; index < normalizacion.length; index++) {
    let numero = normalizacion[index];

    if (numeros.includes(numero)) {
      documentoLimpio += numero;
    }
  }

  return documentoLimpio;
};

export const validadorDocumento = (documento: string) => {
  if (documento.length <= 3) {
    return false;
  }

  if (documento.length >= 50) {
    return false;
  }

  return true;
};

export const normalizeNombre = (nombre: string) => {
  const nombreNormalizado = nombre.toLowerCase();
  const nombreEspacios = nombreNormalizado.trim();
  const nombreSeparado = nombreEspacios.split(" ");

  let nombreSinEspacios = "";

  nombreSeparado.forEach((elemento: string) => {
    if (elemento.length >= 1) {
      nombreSinEspacios += elemento + " ";
    }
  });

  nombreSinEspacios = nombreSinEspacios.slice(0, -1);

  // const nombreNormalizado = nombre.toLowerCase()

  // return nombreNormalizado

  return nombreSinEspacios;
};

export const ValidadorNombre = (nombre: string) => {
  if (nombre.length <= 2) {
    return false;
  }

  if (nombre.length >= 50) {
    return false;
  }

  return true;
};

