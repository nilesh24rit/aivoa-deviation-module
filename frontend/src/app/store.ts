import { configureStore } from '@reduxjs/toolkit'
import aiReducer from '../features/ai/aiSlice'
import deviationReducer from '../features/deviation/deviationSlice'

export const store = configureStore({
  reducer: {
    deviation: deviationReducer,
    ai: aiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
