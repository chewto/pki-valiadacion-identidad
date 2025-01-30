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
  confidence: 1,
  mrz: {
    code: {
      raw: '',
      preprocessed:''
    },
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
  sideResult:{
    front:"",
    back: ''
  },
  sides:{
    front: {
      code:'',
      country: '',
      countryCheck: '',
      type: '',
      typeCheck: '',
      isExpired: true
    },
    back: {
      code:'',
      country: '',
      countryCheck: '',
      type: '',
      typeCheck: '',
      isExpired: true
    },
  }
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
      state.mrz.code = {
        raw: code.raw,
        preprocessed: code.preprocessed
      };
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
      const { face,confidence } = action.payload;
      state.confidence = confidence;
      state.face = face;
    },
    setBackResult:(
      state,
      action: PayloadAction<{sideResult: string}>
    ) => {
      const {sideResult} = action.payload
      state.sideResult.back = sideResult
    },
    setFrontResult:(
      state,
      action: PayloadAction<{sideResult: string}>
    ) => {
      const {sideResult} = action.payload
      state.sideResult.front = sideResult
    },
    setFrontSide: (state, action: PayloadAction<DocumentData>) => {
      const { code, country, countryCheck, type, typeCheck, isExpired } = action.payload;
      state.sides.front = {
        code: code,
        country: country,
        countryCheck: countryCheck,
        type: type,
        typeCheck: typeCheck,
        isExpired: isExpired
      }
    },
    setBackSide: (state, action: PayloadAction<DocumentData>) => {
      const { code, country, countryCheck, type, typeCheck, isExpired } = action.payload;
      state.sides.back = {
        code: code,
        country: country,
        countryCheck: countryCheck,
        type: type,
        typeCheck: typeCheck,
        isExpired: isExpired
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
  setBackSide,
  setFrontResult,
  setBackResult
} = validacionDocumentolice.actions;

export default validacionDocumentolice.reducer;
