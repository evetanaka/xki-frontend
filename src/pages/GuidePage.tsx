import { useState, useEffect } from 'react';

/* ─── Guide content (EN/FR) as structured data ─── */

interface StepSection {
  number: string;
  title: string;
  intro?: string;
  steps: string[];
  callout?: { type: 'warning' | 'info' | 'success'; text: string };
  calloutAfter?: { type: 'warning' | 'info' | 'success'; text: string };
}

interface FaqItem { q: string; a: string }

interface GuideContent {
  subtitle: string;
  title: string;
  desc: string;
  warning: string;
  sections: StepSection[];
  faqTitle: string;
  faqs: FaqItem[];
}

const EN: GuideContent = {
  subtitle: 'Governance Guide',
  title: 'How to Vote on XKI Proposals',
  desc: 'A step-by-step guide for token holders — no technical knowledge required.',
  warning: '⚠️ Never share your 24 words with anyone. No team member will ever ask for them. You\'ll need a computer with Chrome, Firefox, or Edge. This process is completely free.',
  sections: [
    {
      number: '1',
      title: 'Install Keplr Wallet',
      intro: 'Keplr is a digital wallet that works as a browser extension — a small program that adds to Chrome. It\'s the standard wallet for Cosmos blockchains, including Ki Chain.',
      steps: [
        'Open <strong>Google Chrome</strong> on your computer',
        'Go to <a href="https://www.keplr.app/get" target="_blank">keplr.app/get</a>',
        'Click <strong>"Chrome"</strong> (or Firefox / Edge)',
        'Click <strong>"Add to Chrome"</strong> then <strong>"Add extension"</strong>',
        'A small Keplr icon ("K") will appear in the top right corner of your browser ✅',
      ],
      calloutAfter: { type: 'info', text: '🔗 Direct links: <a href="https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap" target="_blank" class="underline">Chrome</a> · <a href="https://addons.mozilla.org/en-US/firefox/addon/keplr/" target="_blank" class="underline">Firefox</a> · <a href="https://microsoftedge.microsoft.com/addons/detail/keplr/ocodgmmffbkkeecmadcijjhkmeohinei" target="_blank" class="underline">Edge</a>' },
    },
    {
      number: '2',
      title: 'Import Your Wallet',
      intro: 'Now add your existing Ki Chain wallet using your 24-word recovery phrase.',
      steps: [
        'Click the <strong>Keplr icon</strong> ("K") in the top right corner',
        'Choose <strong>"Import an existing wallet"</strong>',
        'Select <strong>"Use recovery phrase or private key"</strong>',
        'Enter your 24 words <strong>in the exact order</strong>, one word per field',
        'Click <strong>"Next"</strong>',
        'Choose a <strong>name</strong> for your wallet and create a <strong>password</strong> — this password protects Keplr on your computer',
        'Click <strong>"Save"</strong> ✅',
      ],
      calloutAfter: { type: 'warning', text: '⚠️ Do this in a quiet place, alone, with no one looking at your screen.' },
    },
    {
      number: '3',
      title: 'Connect to the Portal',
      steps: [
        'Go to <a href="https://claim.foundation.ki" target="_blank"><strong>claim.foundation.ki</strong></a>',
        'Click <strong>"Connect Keplr"</strong> in the top right corner',
        'Keplr will pop up — click <strong>"Approve"</strong>',
        'If asked to add "Ki Chain", click <strong>"Approve"</strong> again',
      ],
      calloutAfter: { type: 'success', text: '✅ The button turns green with your address — you\'re connected!' },
    },
    {
      number: '4',
      title: 'Cast Your Vote',
      steps: [
        'Scroll down to the <strong>"Governance"</strong> section',
        'Click on the proposal you want to vote on',
        '<strong>Read the description carefully</strong>',
        'You\'ll see your <strong>Voting Power</strong> (= your XKI balance)',
        'Choose: <strong>Yes</strong> / <strong>No</strong> / <strong>Abstain</strong>',
        'Click <strong>"Sign & Submit Vote"</strong>',
        'Keplr pops up — click <strong>"Approve"</strong> ✅',
      ],
      calloutAfter: { type: 'info', text: 'ℹ️ <strong>Signing ≠ Paying.</strong> It simply proves you own the wallet. No tokens are moved, no fees charged.' },
    },
  ],
  faqTitle: 'Frequently Asked Questions',
  faqs: [
    { q: 'Will my tokens move if I vote?', a: '<strong>No.</strong> Voting does not move your tokens.' },
    { q: 'Can I vote more than once?', a: '<strong>No.</strong> One vote per address per proposal.' },
    { q: 'I don\'t see Ki Chain in Keplr?', a: 'The website will automatically offer to add it when you click "Connect Keplr".' },
    { q: 'Keplr asks for a password — which one?', a: 'The one <strong>you chose</strong> in Step 2 when importing your wallet. Not your 24 words.' },
    { q: 'I lost my 24 words — what can I do?', a: 'Without your 24 words, it is <strong>not possible</strong> to recover your wallet. There is no workaround — this is a fundamental principle of blockchain.' },
    { q: 'Can I vote from my phone?', a: 'Keplr exists as a mobile app (iOS / Android), but desktop is recommended for the best experience.' },
  ],
};

const FR: GuideContent = {
  subtitle: 'Guide de Gouvernance',
  title: 'Comment Voter sur les Propositions XKI',
  desc: 'Un guide pas à pas pour les détenteurs de tokens — aucune connaissance technique requise.',
  warning: '⚠️ Ne partagez JAMAIS vos 24 mots avec qui que ce soit. Aucun membre de l\'équipe ne vous les demandera. Vous aurez besoin d\'un ordinateur avec Chrome, Firefox ou Edge. Ce processus est entièrement gratuit.',
  sections: [
    {
      number: '1',
      title: 'Installer Keplr Wallet',
      intro: 'Keplr est un portefeuille numérique sous forme d\'extension de navigateur — un petit programme qui s\'ajoute à Chrome. C\'est le portefeuille standard pour les blockchains Cosmos, dont Ki Chain.',
      steps: [
        'Ouvrez <strong>Google Chrome</strong> sur votre ordinateur',
        'Allez sur <a href="https://www.keplr.app/get" target="_blank">keplr.app/get</a>',
        'Cliquez sur <strong>« Chrome »</strong> (ou Firefox / Edge)',
        'Cliquez <strong>« Ajouter à Chrome »</strong> puis <strong>« Ajouter l\'extension »</strong>',
        'Une icône Keplr (« K ») apparaîtra en haut à droite de votre navigateur ✅',
      ],
      calloutAfter: { type: 'info', text: '🔗 Liens directs : <a href="https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap" target="_blank" class="underline">Chrome</a> · <a href="https://addons.mozilla.org/en-US/firefox/addon/keplr/" target="_blank" class="underline">Firefox</a> · <a href="https://microsoftedge.microsoft.com/addons/detail/keplr/ocodgmmffbkkeecmadcijjhkmeohinei" target="_blank" class="underline">Edge</a>' },
    },
    {
      number: '2',
      title: 'Importer Votre Portefeuille',
      intro: 'Ajoutez votre portefeuille Ki Chain existant en utilisant vos 24 mots de récupération.',
      steps: [
        'Cliquez sur l\'<strong>icône Keplr</strong> (« K ») en haut à droite',
        'Choisissez <strong>« Import an existing wallet »</strong>',
        'Sélectionnez <strong>« Use recovery phrase or private key »</strong>',
        'Entrez vos 24 mots <strong>dans l\'ordre exact</strong>, un mot par case',
        'Cliquez <strong>« Next »</strong>',
        'Choisissez un <strong>nom</strong> pour votre portefeuille et créez un <strong>mot de passe</strong> — ce mot de passe protège Keplr sur votre ordinateur',
        'Cliquez <strong>« Save »</strong> ✅',
      ],
      calloutAfter: { type: 'warning', text: '⚠️ Faites ça dans un endroit calme, seul(e), sans personne qui regarde votre écran.' },
    },
    {
      number: '3',
      title: 'Se Connecter au Portail',
      steps: [
        'Allez sur <a href="https://claim.foundation.ki" target="_blank"><strong>claim.foundation.ki</strong></a>',
        'Cliquez sur <strong>« Connect Keplr »</strong> en haut à droite',
        'Keplr s\'ouvre — cliquez <strong>« Approve »</strong>',
        'Si on vous demande d\'ajouter « Ki Chain », cliquez <strong>« Approve »</strong> à nouveau',
      ],
      calloutAfter: { type: 'success', text: '✅ Le bouton devient vert avec votre adresse — vous êtes connecté(e) !' },
    },
    {
      number: '4',
      title: 'Voter',
      steps: [
        'Descendez jusqu\'à la section <strong>« Governance »</strong>',
        'Cliquez sur la proposition qui vous intéresse',
        '<strong>Lisez attentivement la description</strong>',
        'Vous verrez votre <strong>Voting Power</strong> (= vos XKI)',
        'Choisissez : <strong>Yes</strong> / <strong>No</strong> / <strong>Abstain</strong>',
        'Cliquez <strong>« Sign & Submit Vote »</strong>',
        'Keplr s\'ouvre — cliquez <strong>« Approve »</strong> ✅',
      ],
      calloutAfter: { type: 'info', text: 'ℹ️ <strong>Signer ≠ Payer.</strong> Cela prouve simplement que vous êtes le propriétaire. Aucun token ne bouge, aucun frais.' },
    },
  ],
  faqTitle: 'Questions Fréquentes',
  faqs: [
    { q: 'Mes tokens bougent si je vote ?', a: '<strong>Non.</strong> Voter ne déplace pas vos tokens.' },
    { q: 'Je peux voter plusieurs fois ?', a: '<strong>Non.</strong> Un vote par adresse par proposition.' },
    { q: 'Ki Chain n\'apparaît pas dans Keplr ?', a: 'Le site proposera automatiquement de l\'ajouter quand vous cliquerez « Connect Keplr ».' },
    { q: 'Keplr me demande un mot de passe — lequel ?', a: 'Celui que <strong>vous avez choisi</strong> à l\'étape 2. Ce n\'est PAS vos 24 mots.' },
    { q: 'J\'ai perdu mes 24 mots — que faire ?', a: 'Sans vos 24 mots, il n\'est <strong>pas possible</strong> de récupérer votre portefeuille. Il n\'existe aucune solution de contournement — c\'est le principe fondamental de la blockchain.' },
    { q: 'Puis-je voter depuis mon téléphone ?', a: 'Keplr existe en app mobile (iOS / Android), mais l\'ordinateur est recommandé pour la meilleure expérience.' },
  ],
};

/* ─── Callout component ─── */

function Callout({ type, text }: { type: 'warning' | 'info' | 'success'; text: string }) {
  const styles = {
    warning: 'bg-yellow-500/[0.08] border-yellow-500/20 text-yellow-400/80',
    info: 'bg-white/[0.03] border-white/10 text-gray-400',
    success: 'bg-green-500/[0.08] border-green-500/20 text-green-400/80',
  };
  return (
    <div className={`border p-4 my-4 ${styles[type]}`}>
      <p className="text-sm m-0" dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

/* ─── Guide renderer ─── */

function GuideRenderer({ content }: { content: GuideContent }) {
  return (
    <div className="guide-content">
      <div className="text-center mb-16">
        <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 mb-4">{content.subtitle}</p>
        <h1 className="text-3xl md:text-4xl font-serif text-white mb-4">{content.title}</h1>
        <p className="text-sm text-gray-500">{content.desc}</p>
      </div>

      <Callout type="warning" text={content.warning} />

      {content.sections.map((s) => (
        <div key={s.number}>
          <h2 className="text-[1.35rem] font-semibold text-white mt-10 mb-4 font-serif border-b border-white/10 pb-3 flex items-center">
            <span className="inline-flex items-center justify-center w-8 h-8 border border-white/20 font-serif text-sm text-white mr-3 shrink-0">
              {s.number}
            </span>
            {s.title}
          </h2>
          {s.intro && <p className="my-3 leading-[1.8] text-white/60" dangerouslySetInnerHTML={{ __html: s.intro }} />}
          {s.callout && <Callout type={s.callout.type} text={s.callout.text} />}
          <ol className="my-3 ml-6 text-white/60">
            {s.steps.map((step, i) => (
              <li key={i} className="my-2 leading-[1.7] list-decimal" dangerouslySetInnerHTML={{ __html: step }} />
            ))}
          </ol>
          {s.calloutAfter && <Callout type={s.calloutAfter.type} text={s.calloutAfter.text} />}
        </div>
      ))}

      <h2 className="text-[1.35rem] font-semibold text-white mt-10 mb-4 font-serif border-b border-white/10 pb-3">
        {content.faqTitle}
      </h2>
      {content.faqs.map((f, i) => (
        <div key={i} className="mb-4">
          <h3 className="text-[1.05rem] font-semibold text-white/90 mt-6 mb-2">{f.q}</h3>
          <p className="my-3 leading-[1.8] text-white/60" dangerouslySetInnerHTML={{ __html: f.a }} />
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   GUIDE PAGE
   ══════════════════════════════════════ */

export default function GuidePage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'fr') setLang('fr');
    else if (!urlLang && navigator.language.startsWith('fr')) setLang('fr');
  }, []);

  const handleSetLang = (l: 'en' | 'fr') => {
    setLang(l);
    history.replaceState(null, '', `?lang=${l}`);
  };

  return (
    <>
      {/* Background grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
        }}
      />

      {/* Language toggle in nav area — handled by shared Nav, but we add a local toggle */}
      <div className="fixed top-4 right-36 md:right-44 z-50 flex items-center border border-white/20">
        <button
          onClick={() => handleSetLang('en')}
          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all ${
            lang === 'en' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => handleSetLang('fr')}
          className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all ${
            lang === 'fr' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          FR
        </button>
      </div>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-16 pt-24">
        <GuideRenderer content={lang === 'fr' ? FR : EN} />
      </main>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">
          © 2026 Ki Chain Foundation — Architecture of Value
        </p>
      </footer>
    </>
  );
}
