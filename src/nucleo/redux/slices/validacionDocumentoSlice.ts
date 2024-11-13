import { DocumentData, MRZ, ValidacionDocumento } from "./../../interfaces/validacion-identidad/informacion-identidad.interface";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
const initialState: ValidacionDocumento = {
  ocr: {
    data:{
      name: "",
      lastName: "",
      ID: "",
    },
    percentage: {
      name: "",
      lastName: "",
      ID:""
    }
  },
  face: false,
  mrz: {
    code: '',
    data: {
      name: '',
      lastName: ''
    },
    percentages: {
      name: '',
      lastName: ''
    }
  },
  barcode: "",
  validSide: "",
  sides:{
    front: {
      correspond: '',
      code:'',
      country: '',
      countryCheck: '',
      type: '',
      typeCheck: ''
    },
    back: {
      correspond: '',
      code:'',
      country: '',
      countryCheck: '',
      type: '',
      typeCheck: ''
    },
  },
};

export const validacionDocumentolice = createSlice({
  name: "ocr",
  initialState,
  reducers: {
    setValidacionOCR: (state, action: PayloadAction<ValidacionDocumento>) => {
      const { ocr } = action.payload;
      state.ocr = {
        data: {
          name: ocr.data.name,
          lastName: ocr.data.lastName,
          ID: ocr.data.ID
        },
        percentage: {
          name: `${ocr.percentage.name}`,
          lastName: `${ocr.percentage.lastName}`,
          ID: `${ocr.percentage.ID}`
        }
      }
    },
    setValidacionMRZ: (state, action: PayloadAction<MRZ>) => {
      const { code, data, percentages } = action.payload;
      state.mrz.code = code;
      state.mrz.data = {
        name: data.name,
        lastName: data.lastName
      }
      state.mrz.percentages = {
        name: `${percentages.name}`,
        lastName: `${percentages.lastName}`
      }
    },
    setValidacionCodigoBarras: (
      state,
      action: PayloadAction<ValidacionDocumento>
    ) => {
      const { barcode } = action.payload;
      state.barcode = barcode;
    },
    setValidacionRostro: (
      state,
      action: PayloadAction<ValidacionDocumento>
    ) => {
      const { face } = action.payload;
      state.face = face;
    },
    setFrontSide: (state, action: PayloadAction<DocumentData>) => {
      const { correspond, code, country, countryCheck, type, typeCheck } = action.payload;
      state.sides.front = {
        correspond: correspond,
        code: code,
        country: country,
        countryCheck: countryCheck,
        type: type,
        typeCheck: typeCheck
      }
    },
    setBackSide: (state, action: PayloadAction<DocumentData>) => {
      const { correspond, code, country, countryCheck, type, typeCheck } = action.payload;
      state.sides.back = {
        correspond: correspond,
        code: code,
        country: country,
        countryCheck: countryCheck,
        type: type,
        typeCheck: typeCheck
      }
    }
  },
});

export const {
  setValidacionOCR,
  setValidacionMRZ,
  setValidacionCodigoBarras,
  setValidacionRostro,
  setFrontSide,
  setBackSide
} = validacionDocumentolice.actions;

export default validacionDocumentolice.reducer;
