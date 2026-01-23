import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { PruebaVida } from "../../interfaces/validacion-identidad/informacion-identidad.interface";

const initialState: PruebaVida = {
  movimiento: "",
  videoHash: "",
  x: 0,
  y: 0,
  rx: 0,
  ry: 0,
};

export const pruebaVidaSlice = createSlice({
  name: "pruebaVida",
  initialState,
  reducers: {
    setIdCarpetas: (state, action: PayloadAction<PruebaVida>) => {
      const { movimiento, videoHash } = action.payload;

      // 1. ALWAYS update the videoHash
      state.videoHash = videoHash;

      // 2. ONLY update movimiento if it is not already "OK" or "true"
      if (state.movimiento !== "OK" && state.movimiento !== "true") {
        state.movimiento = movimiento;
        console.log("Movimiento updated to:", movimiento);
      } else {
        console.log("Movimiento update skipped, but videoHash was updated.");
      }
    },
    setFaceIndicator: (state, action: PayloadAction<any>) => {
      const { x, y, rx, ry } = action.payload;

      console.log("SET FACE INDICATOR:", { x, y, rx, ry });
      state.x = x;
      state.y = y;
      state.rx = rx;
      state.ry = ry;
    },
    setMovement: (state, action: PayloadAction<string>) => {
      state.movimiento = action.payload;
    },
  },
});

export const { setIdCarpetas, setFaceIndicator,setMovement } = pruebaVidaSlice.actions;

export default pruebaVidaSlice.reducer;
