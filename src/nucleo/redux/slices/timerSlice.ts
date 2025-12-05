import { createSlice, PayloadAction } from "@reduxjs/toolkit";
// recuerda que mas alla de totalTime, los de mas son los tiempos de cada accion al servidor (http)

interface selfieTime {
  saveVideoTime: number;
  selfieTime: number;
}

interface documentTime {
  ocrTime: number;
  recognizeTime: number;
  innerTimes: any;
}

interface TimerState {
  totalTime: number;
  selfieTime: selfieTime[];
  frontTime: documentTime[];
  backTime: documentTime[];
}

const initialState: TimerState = {
  totalTime: 0,
  selfieTime: [],
  frontTime: [],
  backTime: [],
};

const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    setTotalTime(state, action: PayloadAction<number>) {
      state.totalTime = action.payload;
    },
    setSelfieTime(state, action: PayloadAction<selfieTime>) {
      state.selfieTime.push(action.payload);
    },
    setFrontTime(state, action: PayloadAction<documentTime>) {
      state.frontTime.push(action.payload);
    },
    setBackTime(state, action: PayloadAction<documentTime>) {
      state.backTime.push(action.payload);
    },
  },
});

export const { setTotalTime, setSelfieTime, setFrontTime, setBackTime } =
  timerSlice.actions;

export default timerSlice.reducer;