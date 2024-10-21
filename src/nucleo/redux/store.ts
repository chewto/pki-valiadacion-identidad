import { configureStore } from "@reduxjs/toolkit";
import informacionReducer  from "./slices/informacionSlice";
import firmadorReducer from './slices/firmadorSlice'
import validacionDocumentoReducer from "./slices/validacionDocumentoSlice";
import validacionCBReducer from "./slices/validacionCB";
import pruebaVidaReducer from "./slices/pruebaVidaSlice";

export const store = configureStore({
  reducer: {
    informacion: informacionReducer,
    firmador: firmadorReducer,
    validacionDocumento: validacionDocumentoReducer,
    cb: validacionCBReducer,
    pruebaVida: pruebaVidaReducer
  }
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

