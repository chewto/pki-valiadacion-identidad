import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ValidacionDocumento } from "../../interfaces/validacion-identidad/informacion-identidad.interface";


const initialState: ValidacionDocumento = {
  ocr: {
    nombreOCR: '',
    apellidoOCR: '',
    documentoOCR: ''
  },
  porcentajesOCR: {
    porcentajeNombreOCR: '',
    porcentajeApellidoOCR: '',
    porcentajeDocumentoOCR: ''
  },
  rostro: false,
  mrz: '',
  codigoBarras: ''
}

export const validacionDocumentolice = createSlice({
  name:'ocr',
  initialState,
  reducers:{
    setValidacionOCR: (state, action:PayloadAction<ValidacionDocumento>) => {
      const {ocr, porcentajesOCR} = action.payload
      state.ocr = {
        nombreOCR: ocr.nombreOCR,
        apellidoOCR: ocr.apellidoOCR,
        documentoOCR: ocr.documentoOCR
      }
      state.porcentajesOCR = {
        porcentajeNombreOCR: `${porcentajesOCR.porcentajeNombreOCR}`,
        porcentajeApellidoOCR: `${porcentajesOCR.porcentajeApellidoOCR}`,
        porcentajeDocumentoOCR: `${porcentajesOCR.porcentajeDocumentoOCR}`
      }

    },
    setValidacionMRZ: (state, action:PayloadAction<ValidacionDocumento>) => {
      const {mrz} = action.payload
      state.mrz = mrz
    },
    setValidacionCodigoBarras: (state, action:PayloadAction<ValidacionDocumento>) => {
      const {codigoBarras} = action.payload
      state.codigoBarras = codigoBarras
    },
    setValidacionRostro: (state, action:PayloadAction<ValidacionDocumento>) => {
      const {rostro} = action.payload
      state.rostro = rostro
    }
  }
})

export const {setValidacionOCR, setValidacionMRZ, setValidacionCodigoBarras, setValidacionRostro} = validacionDocumentolice.actions

export default validacionDocumentolice.reducer