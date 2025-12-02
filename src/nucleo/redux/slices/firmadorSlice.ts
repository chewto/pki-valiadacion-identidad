import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Dato } from "../../interfaces/validacion-identidad/informacion-identidad.interface";

const initialState: Dato = {
  nombre: '',
  apellido: '',
  correo: '',
  documento: '',
  validacionVida: false
}

const cleanAccents = (text: string | undefined): string => {
  return text ? text
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, "") : '';
};

export const firmadorSlice = createSlice({
  name: 'firmador',
  initialState,
  reducers: {
    setFirmador: (state, action:PayloadAction<Dato>) => {
      const {nombre, apellido, correo, documento, validacionVida, tipoDocumento} = action.payload
      state.nombre = nombre
      state.apellido = apellido
      state.correo = correo
      state.documento = documento
      state.validacionVida = validacionVida

      
      state.tipoDocumento = cleanAccents(tipoDocumento) 
    },
    setLivenessTest: (state, action:PayloadAction<{data: boolean}>) => {
      const {data} = action.payload
      state.validacionVida = data
    },
    setDirecciones: (state, action:PayloadAction<Dato>) => {
      const {callback, redireccion, idValidacion, idUsuario, tipoValidacion} = action.payload

      state.callback = callback;
      state.redireccion = redireccion;
      state.idValidacion = idValidacion;
      state.idUsuario = idUsuario;
      state.tipoValidacion = tipoValidacion;
    },
    setCountry: (state, action:PayloadAction<{country: string}>) => {
      const {country} = action.payload
      state.pais = country
    }
  }
})

export const {setFirmador, setDirecciones, setLivenessTest, setCountry} = firmadorSlice.actions

export default firmadorSlice.reducer;