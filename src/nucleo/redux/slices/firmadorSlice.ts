import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Dato } from "../../interfaces/validacion-identidad/informacion-identidad.interface";

const initialState: Dato = {
  nombre: '',
  apellido: '',
  correo: '',
  documento: '',
  validacionVida: false
}

export const firmadorSlice = createSlice({
  name: 'firmador',
  initialState,
  reducers: {
    setFirmador: (state, action:PayloadAction<Dato>) => {
      const {nombre, apellido, correo, documento, validacionVida} = action.payload
      state.nombre = nombre
      state.apellido = apellido
      state.correo = correo
      state.documento = documento
      state.validacionVida = validacionVida
    },
    setDirecciones: (state, action:PayloadAction<Dato>) => {
      const {callback, redireccion, idValidacion, idUsuario, tipoValidacion} = action.payload

      state.callback = callback;
      state.redireccion = redireccion;
      state.idValidacion = idValidacion;
      state.idUsuario = idUsuario;
      state.tipoValidacion = tipoValidacion;
    }
  }
})

export const {setFirmador, setDirecciones} = firmadorSlice.actions

export default firmadorSlice.reducer;