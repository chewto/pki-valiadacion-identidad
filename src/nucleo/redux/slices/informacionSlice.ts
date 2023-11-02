import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { InformacionIdentidad } from "../../interfaces/validacion-identidad/informacion-identidad.interface";

const initialState:InformacionIdentidad = {
  anverso: '',
  reverso: '',
  foto_persona: '',
  dispositivo: '',
  navegador: '',
  ip: '',
  latitud: '',
  longitud: '',
  hora: '',
  fecha: ''
}

export const informacionSlice = createSlice({
  name: 'informacion',
  initialState,
  reducers:{
    setIp: (state, action: PayloadAction<{ip: string}>) => {
      const {ip} = action.payload
      state.ip = ip
    },
    setCoordenadas: (state, action: PayloadAction<{latitud: string, longitud: string}>) => {
      const {latitud, longitud} = action.payload
      state.latitud = latitud
      state.longitud = longitud
    },
    setHoraFecha: (state, action: PayloadAction<{hora: string, fecha: string}>) => {
      const {hora, fecha} = action.payload
      state.hora = hora
      state.fecha = fecha
    },
    setDispostivoNavegador: (state, action: PayloadAction<{dispositivo: string, navegador: string}>) => {
      const {dispositivo, navegador} = action.payload
      state.dispositivo = dispositivo
      state.navegador = navegador
    },
    setFotos: (state, action: PayloadAction<{labelFoto: string, data: string}>) => {
      const {labelFoto, data} = action.payload
      state[labelFoto as keyof InformacionIdentidad] = data
    },
    setVaciarFoto: (state) => {
      state.foto_persona = ''
    }
  }
})

export const {setIp, setCoordenadas, setHoraFecha, setDispostivoNavegador, setFotos, setVaciarFoto} = informacionSlice.actions;

export default informacionSlice.reducer