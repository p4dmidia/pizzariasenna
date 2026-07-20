import logoImg from '../assets/logo.jpg';

export default function AppLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img 
        src={logoImg} 
        alt="Pizza Senna Logo" 
        className="w-10 h-10 rounded-xl object-cover shadow-md flex-shrink-0 border border-primary/20 hover:scale-105 transition-transform" 
      />
      <span className="font-display font-black text-xl italic tracking-wider text-text-main">
        PIZZARIA <span className="text-primary">Senna</span>
      </span>
    </div>
  );
}
