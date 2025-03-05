import { PayloadAction,createSlice } from '@reduxjs/toolkit';
import { PruebaVida } from '../../interfaces/validacion-identidad/informacion-identidad.interface';

const initialState: PruebaVida = {
  movimiento: "",
  idCarpetaEntidad: "",
  idCarpetaUsuario: "",
  videoHash: ""
}

export const pruebaVidaSlice = createSlice({
  name: "pruebaVida",
  initialState,
  reducers: {
    setIdCarpetas: (
      state,
      action: PayloadAction<PruebaVida>
    ) => {
      const { movimiento, idCarpetaEntidad, idCarpetaUsuario, videoHash } = action.payload
      state.movimiento = movimiento
      state.idCarpetaEntidad = idCarpetaEntidad
      state.idCarpetaUsuario = idCarpetaUsuario
      state.videoHash = videoHash
    }
  }
})

export const  {
  setIdCarpetas
} = pruebaVidaSlice.actions

export default pruebaVidaSlice.reducer