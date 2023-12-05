import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ValidacionOCR } from "../../interfaces/validacion-identidad/informacion-identidad.interface";


const initialState: ValidacionOCR = {
  ocr: {
    nombreOCR: '',
    apellidoOCR: '',
    documentoOCR: ''
  },
  porcentajes: {
    porcentajeNombreOCR: '',
    porcentajeApellidoOCR: '',
    porcentajeDocumentoOCR: ''
  },
  rostro: false
}

export const validacionOCRSlice = createSlice({
  name:'ocr',
  initialState,
  reducers:{
    setValidacionOCR: (state, action:PayloadAction<ValidacionOCR>) => {
      const {ocr, porcentajes, rostro} = action.payload
      state.ocr = {
        nombreOCR: ocr.nombreOCR,
        apellidoOCR: ocr.apellidoOCR,
        documentoOCR: ocr.documentoOCR
      }
      state.porcentajes = {
        porcentajeNombreOCR: `${porcentajes.porcentajeNombreOCR}`,
        porcentajeApellidoOCR: `${porcentajes.porcentajeApellidoOCR}`,
        porcentajeDocumentoOCR: `${porcentajes.porcentajeDocumentoOCR}`
      }
      state.rostro = rostro
    }
  }
})

export const {setValidacionOCR} = validacionOCRSlice.actions

export default validacionOCRSlice.reducer