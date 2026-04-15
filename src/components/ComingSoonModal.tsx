import { Lock } from 'lucide-react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md m-4 p-8 border border-white/10 bg-white/5 backdrop-blur-xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-2xl font-serif text-white mb-3">Staking Coming Soon</h3>
        <p className="text-sm text-gray-400 font-light leading-relaxed mb-8">
          Staking will be available once the $XKI migration to Ethereum is complete. Stay tuned.
        </p>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-200 transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
