import { Chat } from './components/Chat';
import { WorkspacePreview } from './components/WorkspacePreview.tsx';

export default function App() {
  return (<>
<a className="skip" href="#main">Skip to content</a>
<Header />
<main id="main">
<Hero />
<section className="foundation"><div className="wrap foundation-inner"><p>ONE CONNECTED WORKFLOW.<br /><strong>Built on open technology.</strong></p><div className="tech"><span>fast<span className="serif">DRS</span></span><span>Gemma <small>4</small></span><span>Cloudflare</span><span>Adaption</span></div></div></section>
<Approach />
<section id="preview" className="preview-section"><div className="wrap preview-grid"><div className="preview-copy"><p className="eyebrow">02 / INSIDE IJWI</p><h2>A little context.<br /><em>A clearer next conversation.</em></h2><p>Explore how the planned workspace connects a case, a conversation, and a review summary.</p></div><WorkspacePreview /></div></section>
<Chat />
<Closing />
</main><Footer />
</>);
}

function Header() {
  return (<header className="header wrap"><a className="brand" href="#" aria-label="Ijwi home"><span className="brand-icon" aria-hidden="true">◉</span> ijwi<span className="brand-dot">.</span></a><nav aria-label="Main navigation"><a href="#approach">Our approach</a><a href="#preview">Explore Ijwi</a><a href="https://github.com/MichaelMukiibi/ijwi-hack-day" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="/screen">Screen an image</a></nav><a className="button button-small" href="#chat">Talk to Ijwi <span aria-hidden="true">↗</span></a></header>);
}

function Hero() {
  return (<section className="hero wrap"><div className="hero-copy"><p className="eyebrow"><span></span> BUILT FOR THE PEOPLE BEHIND THE CARE</p><h1>Every eye has<br />a story.<br /><em>Give it a voice.</em></h1><p className="intro">A screening result is just the beginning. Ijwi brings retinal screening, thoughtful conversation, and supporting evidence into one clearer picture.</p><div className="hero-actions"><a className="button" href="#chat">Start a conversation <span aria-hidden="true">↗</span></a><a className="text-link" href="#approach">How it comes together <span aria-hidden="true">↓</span></a></div><p className="prototype-note"><span aria-hidden="true">✳</span> A research prototype. Designed to support specialist review.</p></div>
<div className="hero-art" aria-label="Illustration of an eye surrounded by the three parts of Ijwi: screening, conversation, and evidence" role="img"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="art-cross cross-one">+</div><div className="art-cross cross-two">+</div><div className="art-label label-one"><i></i> A closer look</div><svg className="eye" viewBox="0 0 600 440" fill="none" aria-hidden="true"><defs><radialGradient id="iris"><stop stopColor="#d2e8bc"/><stop offset=".42" stopColor="#8db8a0"/><stop offset="1" stopColor="#286354"/></radialGradient><filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#1c4939" floodOpacity=".13"/></filter><clipPath id="eyeclip"><path d="M45 220Q300 -10 555 220Q300 450 45 220Z"/></clipPath></defs><path d="M45 220Q300 -10 555 220Q300 450 45 220Z" fill="#f7f8ed" stroke="#325f50" strokeWidth="2" filter="url(#shadow)"/><g clipPath="url(#eyeclip)"><circle cx="300" cy="220" r="118" fill="url(#iris)"/><circle cx="300" cy="220" r="96" stroke="#d8e6c7" strokeOpacity=".4" strokeWidth="28" strokeDasharray="1 7"/><circle cx="300" cy="220" r="56" fill="#153f36"/><circle cx="276" cy="192" r="16" fill="#fff" fillOpacity=".8"/><circle cx="323" cy="242" r="7" fill="#fff" fillOpacity=".35"/></g><path d="M70 184Q300 -30 530 184" stroke="#376554" strokeWidth="1.5"/><path d="M98 293Q300 452 502 293" stroke="#376554" strokeWidth="1.5"/><path d="M300 55V92M300 348V385M118 220H155M445 220H482" stroke="#376554" strokeOpacity=".4"/></svg><div className="art-label label-two"><span aria-hidden="true">↗</span> From a result to understanding</div><span className="art-caption">SCREENING · CONVERSATION · EVIDENCE</span><span className="figure-number">FIG. 01 / A CLEARER PICTURE</span></div></section>);
}

function Approach() {
  return (<section id="approach" className="approach wrap"><div className="section-top"><p className="eyebrow">01 / THE APPROACH</p><p className="side-note">For community health workers.<br />With specialist review in mind.</p></div><h2>More than a prediction.<br /><span>A conversation that connects.</span></h2><div className="steps"><article><span className="step-number">01</span><div className="step-icon" aria-hidden="true">◎</div><h3>Start with a closer look.</h3><p>A fundus photograph enters the FastDRS screening workflow, giving the conversation a concrete starting point.</p><span className="step-tag">RETINAL SCREENING</span></article><article><span className="step-number">02</span><div className="step-icon" aria-hidden="true">↔</div><h3>Make room for context.</h3><p>Gemma brings the case into conversation: asking follow-up questions and explaining the information available.</p><span className="step-tag">GEMMA-POWERED CONVERSATION</span></article><article><span className="step-number">03</span><div className="step-icon" aria-hidden="true">≋</div><h3>Keep the evidence close.</h3><p>Retrieved reference passages support a cited draft summary, ready for a specialist to inspect and review.</p><span className="step-tag">GROUNDED EXPLANATIONS</span></article></div></section>);
}

function Closing() {
  return (<section className="closing wrap"><p className="eyebrow">OPEN TECHNOLOGY. A HUMAN PURPOSE.</p><h2>Better understanding<br />starts with <em>a conversation.</em></h2><p>Follow Ijwi as we build a bridge from retinal screening to an informed specialist review.</p><a className="button" href="https://github.com/MichaelMukiibi/ijwi-hack-day" target="_blank" rel="noopener noreferrer">Explore the project on GitHub <span aria-hidden="true">↗</span></a></section>);
}

function Footer() {
  return (<footer className="footer wrap"><a className="brand" href="#">ijwi<span className="brand-dot">.</span></a><p>Built with FastDRS · Build54 Hacktoberfest 2026</p><span>Research prototype · Not a medical diagnosis</span></footer>);
}
