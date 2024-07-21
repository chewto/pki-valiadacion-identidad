import { configureStore } from "@reduxjs/toolkit";
import informacionReducer  from "./slices/informacionSlice";
import firmadorReducer from './slices/firmadorSlice'
import validacionOCRReducer from "./slices/validacionOCRSlice";
import validacionCBReducer from "./slices/validacionCB";
import pruebaVidaReducer from "./slices/pruebaVidaSlice";

export const store = configureStore({
  reducer: {
    informacion: informacionReducer,
    firmador: firmadorReducer,
    ocr: validacionOCRReducer,
    cb: validacionCBReducer,
    pruebaVida: pruebaVidaReducer
  }
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

