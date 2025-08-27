
/**
 * @fileOverview This file centralizes the entire XP system's configuration.
 * It defines the amount of XP awarded for various actions, provides descriptive
 * reasons for those actions, and contains the SVG data for all level badges.
 * This makes the XP system easy to manage and update from a single location.
 */

// 1. XP Point Values
// ------------------
// This object defines how much XP is awarded for each specific action.
// The awardXp flow reads these values to grant XP.
export const XP_VALUES = {
    NEW_POST: 25,
    LIKE_SENT: 1,
    LIKE_RECEIVED: 5,
    COMMENT_SENT: 2,
    COMMENT_RECEIVED: 10,
    RANDOM_MATCH_COMPLETE: 15,
};

// Helper function to get XP value for an action safely.
export const getXpForAction = (action: keyof typeof XP_VALUES): number => {
    return XP_VALUES[action] || 0;
};


// 2. XP Reason Descriptions
// -------------------------
// This object provides user-friendly descriptions for why XP was awarded.
// These are used in XP gain notifications.
export const XP_REASONS = {
    new_post: 'Yeni gönderi',
    like_sent: 'Gönderi beğenme',
    like_received: 'Beğeni alma',
    comment_sent: 'Yorum yapma',
    comment_received: 'Yorum alma',
    random_match_complete: 'Rastgele eşleşme tamamlama',
};


// 3. Level Badge SVG Data
// -----------------------
// This array holds the SVG definitions for each level badge.
// The LevelBadge component uses this data to render the correct badge.
// Note: For simplicity, we are using groups of levels to determine the badge design.
// A more complex system could have a unique SVG for each level.

// -- Level 1-9 Badge (Bronze Triangle) --
const bronzeTriangle = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-bronze" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#CD7F32;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B87333;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M50,2 L90,98 L10,98 Z" fill="url(#grad-bronze)" />
</svg>`;

// -- Level 10-19 Badge (Silver Triangle) --
const silverTriangle = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-silver" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#C0C0C0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#A9A9A9;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M50,2 L90,98 L10,98 Z" fill="url(#grad-silver)" />
  <path d="M50,15 L80,92 L20,92 Z" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.5" />
</svg>`;

// -- Level 20-49 Badge (Gold Triangle) --
const goldTriangle = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFC400;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M50,2 L90,98 L10,98 Z" fill="url(#grad-gold)" />
  <path d="M50,15 L80,92 L20,92 Z" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.5" />
</svg>`;

// -- Level 50-89 Badge (Ruby Diamond) --
const rubyDiamond = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-ruby" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E0115F;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B40C4A;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M50 2 L90 50 L50 98 L10 50 Z" fill="url(#grad-ruby)" />
  <path d="M50 12 L80 50 L50 88 L20 50 Z" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.5" />
</svg>`;

// -- Level 90-99 Badge (Diamond Hexagon) --
const diamondHexagon = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-diamond" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#B9F2FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#99EEFF;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M50 2 L98 25 L98 75 L50 98 L2 75 L2 25 Z" fill="url(#grad-diamond)" />
  <path d="M50 10 L89 30 L89 70 L50 90 L11 70 L11 30 Z" fill="none" stroke="#003366" stroke-width="1.5" opacity="0.5" />
</svg>`;

// -- Level 100 Badge (Legendary Hexagon) --
const legendaryHexagon = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad-legendary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#C9A12B;stop-opacity:1" />
        </linearGradient>
         <filter id="glow-legendary" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>
    <path d="M50 2 L98 25 L98 75 L50 98 L2 75 L2 25 Z" fill="url(#grad-legendary)" stroke="#FFC400" stroke-width="2" filter="url(#glow-legendary)" />
    <path d="M50 10 L89 30 L89 70 L50 90 L11 70 L11 30 Z" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.6" />
</svg>
`;


export const getBadgeSvgForLevel = (level: number) => {
    if (level >= 100) return legendaryHexagon;
    if (level >= 90) return diamondHexagon;
    if (level >= 50) return rubyDiamond;
    if (level >= 20) return goldTriangle;
    if (level >= 10) return silverTriangle;
    return bronzeTriangle;
};
