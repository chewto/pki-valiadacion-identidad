import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ValidacionOCR } from "../../interfaces/validacion-identidad/informacion-identidad.interface";


const initialState: ValidacionOCR = {
  ocrNombre: '',
  ocrApellido: '',
  ocrDocumento: ''
}

export const validacionOCRSlice = createSlice({
  name:'ocr',
  initialState,
  reducers:{
    setValidacionOCR: (state, action:PayloadAction<ValidacionOCR>) => {
      const {ocrNombre, ocrApellido, ocrDocumento} = action.payload
      state.ocrNombre = `${ocrNombre}`
      state.ocrApellido = `${ocrApellido}`
      state.ocrDocumento = `${ocrDocumento}`
    }
  }
})

export const {setValidacionOCR} = validacionOCRSlice.actions

export default validacionOCRSlice.reducer