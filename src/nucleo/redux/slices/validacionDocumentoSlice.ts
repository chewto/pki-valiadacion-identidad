import { ValidacionDocumento } from "./../../interfaces/validacion-identidad/informacion-identidad.interface";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
const initialState: ValidacionDocumento = {
  ocr: {
    nombreOCR: "",
    apellidoOCR: "",
    documentoOCR: "",
  },
  porcentajesOCR: {
    porcentajeNombreOCR: "",
    porcentajeApellidoOCR: "",
    porcentajeDocumentoOCR: "",
  },
  rostro: false,
  mrz: "",
  codigoBarras: "",
  correspondingSide: {
    front: "",
    back: "",
  },
};

export const validacionDocumentolice = createSlice({
  name: "ocr",
  initialState,
  reducers: {
    setValidacionOCR: (state, action: PayloadAction<ValidacionDocumento>) => {
      const { ocr, porcentajesOCR } = action.payload;
      state.ocr = {
        nombreOCR: ocr.nombreOCR,
        apellidoOCR: ocr.apellidoOCR,
        documentoOCR: ocr.documentoOCR,
      };
      state.porcentajesOCR = {
        porcentajeNombreOCR: `${porcentajesOCR.porcentajeNombreOCR}`,
        porcentajeApellidoOCR: `${porcentajesOCR.porcentajeApellidoOCR}`,
        porcentajeDocumentoOCR: `${porcentajesOCR.porcentajeDocumentoOCR}`,
      };
    },
    setValidacionMRZ: (state, action: PayloadAction<ValidacionDocumento>) => {
      const { mrz } = action.payload;
      state.mrz = mrz;
    },
    setValidacionCodigoBarras: (
      state,
      action: PayloadAction<ValidacionDocumento>
    ) => {
      const { codigoBarras } = action.payload;
      state.codigoBarras = codigoBarras;
    },
    setValidacionRostro: (
      state,
      action: PayloadAction<ValidacionDocumento>
    ) => {
      const { rostro } = action.payload;
      state.rostro = rostro;
    },
    setFrontSide: (state, action: PayloadAction<{ front: string }>) => {
      const { front } = action.payload;
      state.correspondingSide.front = front;
    },
    setBackSide: (state, action: PayloadAction<{ back: string }>) => {
      const { back } = action.payload;
      state.correspondingSide.back = back;
    },
  },
});

export const {
  setValidacionOCR,
  setValidacionMRZ,
  setValidacionCodigoBarras,
  setValidacionRostro,
  setFrontSide,
  setBackSide
} = validacionDocumentolice.actions;

export default validacionDocumentolice.reducer;
