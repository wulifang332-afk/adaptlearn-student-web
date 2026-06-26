export function PlantMiniScene() {
  return (
    <svg className="plant-mini-scene" viewBox="0 0 180 150" role="img" aria-label="Plant illustration">
      <rect x="28" y="112" width="124" height="18" rx="9" fill="#d8b15f" opacity="0.42" />
      <path d="M92 116 C88 92 88 72 94 46" fill="none" stroke="#16845f" strokeWidth="8" strokeLinecap="round" />
      <path d="M94 72 C72 62 58 48 52 30 C75 28 91 42 98 62 Z" fill="#7ec46c" />
      <path d="M98 82 C122 72 137 58 143 38 C119 36 103 51 96 72 Z" fill="#4aa96c" />
      <circle cx="94" cy="36" r="14" fill="#f2c14e" />
      <circle cx="82" cy="36" r="12" fill="#f3d06d" />
      <circle cx="107" cy="37" r="12" fill="#f3d06d" />
      <path d="M70 119 C68 105 56 98 42 98" fill="none" stroke="#8d6230" strokeWidth="5" strokeLinecap="round" />
      <path d="M108 119 C113 103 126 96 140 96" fill="none" stroke="#8d6230" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function PlantCardArt() {
  return (
    <div className="plant-card-art" aria-hidden="true">
      <PlantMiniScene />
    </div>
  );
}
