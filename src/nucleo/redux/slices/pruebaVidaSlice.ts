import { PayloadAction,createSlice } from '@reduxjs/toolkit';
import { PruebaVida } from '../../interfaces/validacion-identidad/informacion-identidad.interface';

const initialState: PruebaVida = {
  movimiento: "",
  videoHash: "",
  x: 0,
  y: 0,
  rx: 0,
  ry: 0
}

export const pruebaVidaSlice = createSlice({
  name: "pruebaVida",
  initialState,
  reducers: {
    setIdCarpetas: (
      state,
      action: PayloadAction<PruebaVida>
    ) => {
      const { movimiento, videoHash} = action.payload
      state.movimiento = movimiento
      state.videoHash = videoHash
    },
    setFaceIndicator: (
      state,
      action: PayloadAction<any>
    ) => {
      const { x, y, rx, ry} = action.payload
      state.x = x
      state.y = y
      state.rx = rx
      state.ry = ry
    }
  }
})

export const  {
  setIdCarpetas,
  setFaceIndicator
} = pruebaVidaSlice.actions

export default pruebaVidaSlice.reducer