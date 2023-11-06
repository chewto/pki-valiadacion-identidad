import { configureStore } from "@reduxjs/toolkit";
import informacionReducer  from "./slices/informacionSlice";
import firmadorReducer from './slices/firmadorSlice'
import validacionOCRReducer from "./slices/validacionOCRSlice";

export const store = configureStore({
  reducer: {
    informacion: informacionReducer,
    firmador: firmadorReducer,
    ocr: validacionOCRReducer
  }
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

