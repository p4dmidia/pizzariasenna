import { ShoppingCart } from 'lucide-react';

export default function AppLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-background shadow-lg glow-primary flex-shrink-0">
        <ShoppingCart className="w-5 h-5 text-background" />
      </div>
      <span className="font-display font-black text-xl italic tracking-wider text-text-main">
        APP <span className="text-primary">Delivery</span>
      </span>
    </div>
  );
}
