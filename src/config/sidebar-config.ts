
/**
 * @fileOverview Bu dosya, uygulamanın kenar çubuğu (sidebar) bileşeni
 * için temel yapılandırma ayarlarını içerir. Bu ayarlar, kenar çubuğunun
 * durumunun tarayıcı çerezlerinde nasıl saklanacağını ve genel davranışını
 * kontrol eder.
 */

// Kenar çubuğunun açık veya kapalı durumunu saklayan çerezin adı.
export const SIDEBAR_COOKIE_NAME = "sidebar_state";

// Çerezin tarayıcıda ne kadar süreyle geçerli olacağı (saniye cinsinden).
// 60 saniye * 60 dakika * 24 saat * 7 gün = 1 hafta
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

// Kenar çubuğunun varsayılan genişliği (açık durumdayken).
export const SIDEBAR_WIDTH = "16rem";

// Kenar çubuğunun mobil cihazlardaki varsayılan genişliği.
export const SIDEBAR_WIDTH_MOBILE = "18rem";

// Kenar çubuğunun sadece ikonlar görünecek şekilde daraltıldığındaki genişliği.
export const SIDEBAR_WIDTH_ICON = "3rem";

// Kenar çubuğunu açıp kapatmak için kullanılacak klavye kısayolu (Ctrl/Cmd + b).
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";
