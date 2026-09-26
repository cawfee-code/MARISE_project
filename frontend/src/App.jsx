import { lazy, Suspense, useEffect, useState } from 'react';
import { Waves, ArrowUpRight } from 'lucide-react';
import Home from './pages/Home';
import useInvestigation from './components/investigation/useInvestigation';
const Investigation = lazy(() => import('./pages/Investigation'));
const Workflow = lazy(() => import('./pages/Workflow'));
const Team = lazy(() => import('./pages/Team'));
export default function App() {
  const [page, setPage] = useState(location.hash.slice(1) || 'home');
  const session = useInvestigation();
  const stageMatch = /^stage([1-6])$/.exec(page);
  const investigationPage = page === 'investigation' || !!stageMatch;
  useEffect(() => {
    const change = () => { setPage(location.hash.slice(1) || 'home'); window.scrollTo(0, 0); };
    addEventListener('hashchange', change); return () => removeEventListener('hashchange', change);
  }, []);
  useEffect(() => { document.title = `MARISE — ${stageMatch ? `Stage ${stageMatch[1]}` : page === 'investigation' ? 'Investigation' : page === 'team' ? 'Our team' : 'Marine intelligence'}`; document.getElementById('main')?.focus(); }, [page]);
  const navigateStage = index => { session.setStage(index); location.hash = `stage${index + 1}`; };
  return <><a className="skip" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main').focus(); }}>Skip to content</a>
    <header className="header"><a className="brand" href="#home" aria-label="MARISE home"><span className="brand-icon"><Waves size={23}/></span>MARISE</a><nav aria-label="Main navigation"><a href="#home" aria-current={page === 'home' ? 'page' : undefined}>Home</a><a href="#investigation" aria-current={investigationPage ? 'page' : undefined}>Investigation</a><a href="#team" aria-current={page === 'team' ? 'page' : undefined}>Our team</a></nav><a className="header-note" href="#investigation">Explore MARISE <ArrowUpRight size={15}/></a></header>
    <main id="main" tabIndex={-1}><Suspense fallback={<div className="loading">Opening workspace…</div>}>{stageMatch ? <Investigation session={{...session, stage: Number(stageMatch[1]) - 1, setStage: navigateStage}}/> : page === 'investigation' ? <Workflow session={session}/> : page === 'team' ? <Team/> : <Home/>}</Suspense></main>
    <footer><a className="brand" href="#home"><Waves size={18}/>MARISE</a><span>Maritime Atrribution, Reconstruction, Investigation & Spill Enforcement</span></footer></>;
}
