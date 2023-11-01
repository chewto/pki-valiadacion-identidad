import { configureStore } from "@reduxjs/toolkit";
import informacionReducer  from "./slices/informacionSlice";


export const store = configureStore({
  reducer: {
    informacion: informacionReducer
  }
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

