export default function SnapShopLogo({ className = "h-10 w-10", textClassName = "text-2xl", showText = true }) {
  return (
    <div className="flex items-center gap-3">
      {/* Logo Icon - Professional Shopping Cart Design */}
      <div className="relative">
        <svg 
          className={className} 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gradient Definitions - Orange Only */}
          <defs>
            <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#FF8C42', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#F16623', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#D94E15', stopOpacity: 1 }} />
            </linearGradient>
            <radialGradient id="whiteGlow">
              <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.3 }} />
            </radialGradient>
          </defs>
          
          {/* Outer Circle - White Background */}
          <circle 
            cx="60" 
            cy="60" 
            r="55" 
            fill="white"
            stroke="url(#orangeGradient)"
            strokeWidth="3"
          />
          
          {/* Shopping Cart Body */}
          <path 
            d="M 35 45 L 40 45 L 48 75 L 80 75 L 85 55 L 45 55" 
            fill="none"
            stroke="url(#orangeGradient)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Cart Handle */}
          <path 
            d="M 35 45 L 32 38 L 25 38" 
            stroke="url(#orangeGradient)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Cart Wheel - Left */}
          <circle 
            cx="52" 
            cy="85" 
            r="5" 
            fill="url(#orangeGradient)"
          />
          
          {/* Cart Wheel - Right */}
          <circle 
            cx="75" 
            cy="85" 
            r="5" 
            fill="url(#orangeGradient)"
          />
          
          {/* Lightning Bolt - Speed/Quick Shopping */}
          <path 
            d="M 68 35 L 60 55 L 67 55 L 58 75 L 72 50 L 65 50 Z" 
            fill="#F16623"
            stroke="#FF8C42"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          
          {/* Accent Sparkle - Top Right */}
          <path 
            d="M 88 32 L 85 35 L 88 38 L 91 35 Z M 88 28 L 88 42" 
            stroke="#FF8C42"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      
      {/* Brand Name - Orange Gradient Only */}
      {showText && (
        <span className={`font-bold ${textClassName}`}>
          <span className="bg-gradient-to-r from-orange-500 to-etsy-orange bg-clip-text text-transparent">Snap</span>
          <span className="bg-gradient-to-r from-etsy-orange to-orange-700 bg-clip-text text-transparent">Shop</span>
        </span>
      )}
    </div>
  );
}
