import { ArrowRight, ArrowUpRight, Waves, ScanLine, Route, Fingerprint } from 'lucide-react';
import { siteConfig } from '../config/siteConfig';

export default function Home() {
  return <div className="home page-enter">
    <section className="hero">
      <div className="hero-copy">
        <h1>MARISE</h1>
        <p className="hero-description">From a satellite observation to a possible source. MARISE brings the pieces together for a more informed marine response.</p>
        <div className="hero-actions">
          <a className="liquid-button" href="#investigation">Explore the investigation <ArrowRight size={17}/></a>
          <a className="secondary-button" href="#team">Our Team <ArrowUpRight size={16}/></a>
        </div>
        <div className="hero-index">
          <span className="mini-waves"><Waves size={26}/></span>
          <p>One observation. Six connected stages.<br/><strong>A complete view of the investigation.</strong></p>
        </div>
      </div>
      <div className="hero-visual">
        <div className="visual-image" style={{backgroundImage:`url(${siteConfig.heroPoster})`}}>{siteConfig.heroVideo && <video autoPlay muted loop playsInline poster={siteConfig.heroPoster} src={siteConfig.heroVideo}/>}</div>
        <div className="ocean-caption"><h2>A changing surface.<br/>A deeper understanding.</h2><div><span>Satellite vision meets ocean science</span><ArrowUpRight size={20}/></div></div>
        <div className="visual-label"><ScanLine size={17}/><span>Observe. Understand. Respond.</span></div>
      </div>
    </section>
    <section className="home-process" aria-label="MARISE approach">
      <div className="process-intro"><span className="eyebrow">FROM SIGNAL TO SOURCE</span><p>Follow the evidence.<br/><em>See the whole picture.</em></p></div>
      {[[ScanLine,'01 — 02','Observe the surface','Detect a potential spill and measure its signature.'],[Route,'03 — 04','Follow the movement','Trace ocean drift and correlate vessel activity.'],[Fingerprint,'05 — 06','Inform the response','Review source evidence and forecast what comes next.']].map(([Icon,n,title,copy]) => <a href="#investigation" className="process-item" key={n}><div><Icon size={23} strokeWidth={1.4}/><span>{n}</span></div><h3>{title}</h3><p>{copy}</p></a>)}
    </section>
    <section className="purpose"><span className="eyebrow">BUILT FOR OUR BLUE PLANET</span><p>{siteConfig.aboutText}</p><a href="#investigation" className="text-link">Open an investigation <ArrowRight size={16}/></a></section>
  </div>;
}
