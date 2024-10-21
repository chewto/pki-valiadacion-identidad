import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Dato } from "../../interfaces/validacion-identidad/informacion-identidad.interface";

const initialState: Dato = {
  nombre: '',
  apellido: '',
  correo: '',
  documento: ''
}

export const firmadorSlice = createSlice({
  name: 'firmador',
  initialState,
  reducers: {
    setFirmador: (state, action:PayloadAction<Dato>) => {
      const {nombre, apellido, correo, documento} = action.payload
      state.nombre = nombre
      state.apellido = apellido
      state.correo = correo
      state.documento = documento
    }
  }
})

export const {setFirmador} = firmadorSlice.actions

export default firmadorSlice.reducer;