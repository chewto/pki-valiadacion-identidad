
export const barcodes = {
  qr: {
    x: 0.15,
    y: 0.16,
    width: 0.70,
    height: 0.40,
  },
  pdf417: {
    x: 0.009,
    y: 0.25,
    width: 0.98,
    height: 0.20,
  },
  dataMatrix: {
    x: 0.15,
    y: 0.16,
    width: 0.70,
    height: 0.40,
  },
};

export const documentTypes = {
  col: [
    {
      id: 0,
      value: "Cédula de ciudadanía",
      label: "Cédula de ciudadanía",
      barcode: barcodes["pdf417"],
    },
    {
      id: 1,
      value: "Cédula de extranjería",
      label: "Cédula de extranjería",
      barcode: barcodes["pdf417"],
    },
    {
      id: 2,
      value: "Cédula digital",
      label: "Cédula digital",
      barcode: barcodes["dataMatrix"],
    },
    {
      id: 3,
      value: "Pasaporte",
      label: "Pasaporte",
      barcode: null,
    },
    // {
    //   id: 2,
    //   value: "Permiso por protección temporal",
    //   label: "Permiso por protección temporal",
    // },
    // {
    //   id: 3,
    //   value: "Tarjeta de identidad",
    //   label: "Tarjeta de identidad",
    // },
    // {
    //   id: 4,
    //   value: "Pasaporte",
    //   label: "Pasaporte",
    // }
  ],
  pty: [],
  hnd: [
    {
      id: 0,
      value: "DNI",
      label: "DNI",
      barcode: barcodes["qr"],
    },
    // {
    //   id: 1,
    //   value: "Carnet de residencia",
    //   label: "Carnet de residencia",
    // },
    {
      id: 2,
      value: "Pasaporte",
      label: "Pasaporte",
      barcode: barcodes["pdf417"],
    },
  ],
  hndLleida: [
    {
      id: 0,
      value: "PHOTO_ID",
      label: "DNI",
    },
    {
      id: 1,
      value: "PHOTO_ID",
      label: "Carnet de residencia",
    },
    {
      id: 2,
      value: "PASSPORT",
      label: "Pasaporte",
    },
  ],
};
