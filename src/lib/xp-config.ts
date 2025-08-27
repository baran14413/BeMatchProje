
/**
 * @fileOverview Bu dosya, XP sisteminin tüm yapılandırmasını merkezileştirir.
 * Çeşitli eylemler için verilen XP miktarını tanımlar, bu eylemler için
 * açıklayıcı nedenler sunar ve tüm seviye rozetleri için SVG verilerini içerir.
 * Bu, XP sisteminin tek bir yerden yönetilmesini ve güncellenmesini kolaylaştırır.
 */

// 1. XP Puan Değerleri
// ------------------
// Bu nesne, her bir özel eylem için ne kadar XP verileceğini tanımlar.
// awardXp akışı, XP vermek için bu değerleri okur.
export const XP_VALUES = {
    NEW_POST: 25,
    LIKE_SENT: 1,
    LIKE_RECEIVED: 5,
    COMMENT_SENT: 2,
    COMMENT_RECEIVED: 10,
    RANDOM_MATCH_COMPLETE: 15,
};

// Bir eylem için XP değerini güvenli bir şekilde alma yardımcı fonksiyonu.
export const getXpForAction = (action: keyof typeof XP_VALUES): number => {
    return XP_VALUES[action] || 0;
};


// 2. XP Kazanma Nedenleri
// -------------------------
// Bu nesne, XP'nin neden verildiğine dair kullanıcı dostu açıklamalar sunar.
// Bunlar, XP kazanım bildirimlerinde kullanılır.
export const XP_REASONS = {
    new_post: 'Yeni gönderi',
    like_sent: 'Gönderi beğenme',
    like_received: 'Beğeni alma',
    comment_sent: 'Yorum yapma',
    comment_received: 'Yorum alma',
    random_match_complete: 'Rastgele eşleşme tamamlama',
};


// 3. Seviye Rozeti SVG Verileri
// -----------------------
// Bu bölümde, her seviye grubu için SVG tanımları bulunur.
// LevelBadge bileşeni, doğru rozeti oluşturmak için bu verileri kullanır.

// -- Seviye 1-9 Rozeti (Bronz Bar) --
const bronzeBar = `
<svg viewBox="0 0 100 35" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-bronze" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#CD7F32;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B87333;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="100" height="35" rx="17.5" fill="url(#grad-bronze)" />
</svg>`;

// -- Seviye 10-19 Rozeti (Gümüş Bar) --
const silverBar = `
<svg viewBox="0 0 110 35" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-silver" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#C0C0C0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#A9A9A9;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="110" height="35" rx="17.5" fill="url(#grad-silver)" />
  <path d="M88 17.5 L84 21 L80 17.5 L84 14 Z" fill="#FFF" opacity="0.7"/>
</svg>`;

// -- Seviye 20-49 Rozeti (Altın Bar) --
const goldBar = `
<svg viewBox="0 0 120 35" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FFC400;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="120" height="35" rx="17.5" fill="url(#grad-gold)" />
  <path d="M98 17.5 L94 21 L90 17.5 L94 14 Z" fill="#FFF5B2" opacity="0.8"/>
</svg>`;

// -- Seviye 50-89 Rozeti (Yakut Bar) --
const rubyBar = `
<svg viewBox="0 0 130 35" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-ruby" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E0115F;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B40C4A;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="130" height="35" rx="17.5" fill="url(#grad-ruby)" />
  <path d="M100 17.5 L105 22 L110 17.5 L105 13 Z" fill="#FFFFFF" />
</svg>`;

// -- Seviye 90-99 Rozeti (Elmas Bar) --
const diamondBar = `
<svg viewBox="0 0 140 35" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-diamond" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#B9F2FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E0FFFF;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="140" height="35" rx="17.5" fill="url(#grad-diamond)" />
  <path d="M105 17.5 L112 24 L119 17.5 L112 11 Z" fill="#FFFFFF" stroke="#005A9C" stroke-width="0.5"/>
</svg>`;

// -- Seviye 100 Rozeti (Efsanevi) --
const legendaryBadge = `
<svg viewBox="0 0 150 55" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad-legendary-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#4A4E69;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#22223B;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad-legendary-star" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FFA500;stop-opacity:1" />
        </linearGradient>
         <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    <rect x="0" y="20" width="150" height="35" rx="17.5" fill="url(#grad-legendary-bg)" />
    <g filter="url(#glow)">
        <path d="M65 15 L68 22 L75 22 L70 26 L72 33 L65 29 L58 33 L60 26 L55 22 L62 22 Z" fill="url(#grad-legendary-star)"/>
        <path d="M40 10 L43 17 L50 17 L45 21 L47 28 L40 24 L33 28 L35 21 L30 17 L37 17 Z" fill="url(#grad-legendary-star)"/>
        <path d="M90 10 L93 17 L100 17 L95 21 L97 28 L90 24 L83 28 L85 21 L80 17 L87 17 Z" fill="url(#grad-legendary-star)"/>
    </g>
</svg>
`;

export const getBadgeSvgForLevel = (level: number): { svg: string, textY: string, textFontSize: string, textColor: string } => {
    if (level >= 100) return {
        svg: legendaryBadge,
        textY: '42',
        textFontSize: '16px',
        textColor: '#FFD700'
    };
    if (level >= 90) return {
        svg: diamondBar,
        textY: '23',
        textFontSize: '20px',
        textColor: '#003366'
    };
    if (level >= 50) return {
        svg: rubyBar,
        textY: '23',
        textFontSize: '20px',
        textColor: '#FFFFFF'
    };
    if (level >= 20) return {
        svg: goldBar,
        textY: '23',
        textFontSize: '20px',
        textColor: '#4C3B00'
    };
    if (level >= 10) return {
        svg: silverBar,
        textY: '23',
        textFontSize: '20px',
        textColor: '#363636'
    };
    return {
        svg: bronzeBar,
        textY: '23',
        textFontSize: '20px',
        textColor: '#FFFFFF'
    };
};
