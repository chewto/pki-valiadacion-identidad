import { ValidacionCB } from './../../interfaces/validacion-identidad/informacion-identidad.interface';
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

const initialState: ValidacionCB = {
  reconocido: 'false',
  nombre: 'false',
  apellido: 'false',
  documento: 'false'
}

export const validacionCBSlice = createSlice({
  name:'codigoBarras',
  initialState,
  reducers:{
    setValidacionCB: (state, action:PayloadAction<ValidacionCB>) => {
      const {reconocido, nombre, apellido, documento} = action.payload;

      state.reconocido = reconocido;
      state.nombre = nombre;
      state.apellido = apellido;
      state.documento = documento
    }
  }
})

export const {setValidacionCB} = validacionCBSlice.actions

export default validacionCBSlice.reducer