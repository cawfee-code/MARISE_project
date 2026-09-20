import { useContext, useEffect } from 'react'

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from 'react-router-dom'

import {
  InvestigationContext,
  InvestigationProvider
} from './contexts/InvestigationContext'

import Stage1 from './pages/Stage1'
import Stage2 from './pages/Stage2'
import Stage3 from './pages/Stage3'
import Stage4 from './pages/Stage4'
import Stage5 from './pages/Stage5'
import Stage6 from './pages/Stage6'

const stages = [
  { path: '/stage1', label: 'Detection' },
  { path: '/stage2', label: 'Characterization' },
  { path: '/stage3', label: 'Source Trace' },
  { path: '/stage4', label: 'AIS Analysis' },
  { path: '/stage5', label: 'Attribution' },
  { path: '/stage6', label: 'Forecast' }
]

const nextStage = {
  '/stage1': '/stage2',
  '/stage2': '/stage3',
  '/stage3': '/stage4',
  '/stage4': '/stage5',
  '/stage5': '/stage6'
}

function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

  const {
    isAutoRun,
    setIsAutoRun
  } = useContext(InvestigationContext)

  const currentPath = location.pathname

  const currentIndex = stages.findIndex(
    stage => stage.path === currentPath
  )

  useEffect(() => {
    if (!isAutoRun) return

    const nextPath = nextStage[currentPath]

    if (!nextPath) {
      setIsAutoRun(false)
      return
    }

    const timer = setTimeout(() => {
      navigate(nextPath)
    }, 5000)

    return () => clearTimeout(timer)
  }, [
    currentPath,
    isAutoRun,
    navigate,
    setIsAutoRun
  ])

  return (
    <div className="app-shell">

      <header className="topbar">

        <div className="brand">
          <h1>MARISE</h1>

          <p>
            Maritime Spill Intelligence and Source Attribution
          </p>

          <div className="team-signature">
            <span>BWU Techade</span>

            <span className="team-divider">
              ·
            </span>

            <span>
              Smart India Hackathon 2026
            </span>
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          System Ready
        </div>

      </header>

      <div className="app-body">

        <aside className="sidebar">

          <p className="sidebar-title">
            INVESTIGATION
          </p>

          <div className="stage-list">

            {stages.map((stage, index) => {
              const active =
                currentPath === stage.path

              const done =
                currentIndex > index

              return (
                <button
                  key={stage.path}
                  className={
                    `stage-item
                    ${active ? 'active' : ''}
                    ${done ? 'done' : ''}`
                  }
                  onClick={() =>
                    navigate(stage.path)
                  }
                >
                  <span className="stage-number">
                    {done
                      ? '✓'
                      : String(index + 1)
                          .padStart(2, '0')}
                  </span>

                  <span>
                    {stage.label}
                  </span>

                </button>
              )
            })}

          </div>

        </aside>

        <main className="workspace">

          <div className="workspace-header">

            <div>
              <p>
                MARINE INCIDENT ANALYSIS
              </p>

              <h2>
                Oil Spill Investigation
              </h2>
            </div>

            <span className="case-id">
              CASE / MAR-26-014
            </span>

          </div>

          {children}

        </main>

      </div>

    </div>
  )
}

function App() {
  return (
    <InvestigationProvider>

      <BrowserRouter>

        <Layout>

          <Routes>

            <Route
              path="/"
              element={
                <Navigate
                  to="/stage1"
                  replace
                />
              }
            />

            <Route
              path="/stage1"
              element={<Stage1 />}
            />

            <Route
              path="/stage2"
              element={<Stage2 />}
            />

            <Route
              path="/stage3"
              element={<Stage3 />}
            />

            <Route
              path="/stage4"
              element={<Stage4 />}
            />

            <Route
              path="/stage5"
              element={<Stage5 />}
            />

            <Route
              path="/stage6"
              element={<Stage6 />}
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/stage1"
                  replace
                />
              }
            />

          </Routes>

        </Layout>

      </BrowserRouter>

    </InvestigationProvider>
  )
}

export default App