import { Link } from 'react-router-dom'
import { BellIcon, BuildingIcon, ChevronDownIcon, LogoMark } from './Icons'

const TABS = [
  'QMS',
  'Dashboard',
  'Deviations',
  'CAPAs',
  'Change Control',
  'Audits',
  'Documents',
  'Reports',
]

export default function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-left">
        <Link to="/" className="brand" aria-label="AIVOA.AI home">
          <LogoMark size={26} />
          <span className="brand-text">
            AIVOA<span className="brand-dot">.AI</span>
            <small>AI POWERED QMS</small>
          </span>
        </Link>

        <nav className="tabs" aria-label="Modules">
          {TABS.map((tab) => {
            const active = tab === 'Deviations'
            if (active) {
              return (
                <Link key={tab} to="/" className="tab active">
                  {tab}
                </Link>
              )
            }
            return (
              <button key={tab} type="button" className="tab inert" title="Not part of this demo">
                {tab}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="topnav-right">
        <button type="button" className="org-pill">
          <BuildingIcon />
          <span>Vasuha Pharma Chem Limited</span>
          <ChevronDownIcon />
        </button>
        <button type="button" className="icon-btn" aria-label="Notifications">
          <BellIcon />
          <span className="notif-dot" />
        </button>
        <div className="avatar" title="MK">
          MK
        </div>
      </div>
    </header>
  )
}
