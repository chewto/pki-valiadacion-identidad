import { configureStore } from "@reduxjs/toolkit";
import informacionReducer  from "./slices/informacionSlice";
import firmadorReducer from './slices/firmadorSlice'
import validacionDocumentoReducer from "./slices/validacionDocumentoSlice";
import validacionCBReducer from "./slices/validacionCB";
import pruebaVidaReducer from "./slices/pruebaVidaSlice";
import timerReducer from "./slices/timerSlice";

export const store = configureStore({
  reducer: {
    informacion: informacionReducer,
    firmador: firmadorReducer,
    validacionDocumento: validacionDocumentoReducer,
    cb: validacionCBReducer,
    pruebaVida: pruebaVidaReducer,
    timer: timerReducer
  }
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

