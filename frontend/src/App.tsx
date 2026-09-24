import { Navigate, Route, Routes } from 'react-router-dom'
import DeviationsListPage from './pages/DeviationsListPage'
import LogDeviationPage from './pages/LogDeviationPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LogDeviationPage />} />
      <Route path="/deviations" element={<DeviationsListPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
