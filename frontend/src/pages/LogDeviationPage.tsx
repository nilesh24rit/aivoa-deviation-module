import AIAssistantPanel from '../components/AIAssistantPanel'
import DeviationForm from '../components/DeviationForm'
import TopNav from '../components/TopNav'

export default function LogDeviationPage() {
  return (
    <div className="app-shell">
      <TopNav />
      <main className="page-layout">
        <DeviationForm />
        <AIAssistantPanel />
      </main>
    </div>
  )
}
