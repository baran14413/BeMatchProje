
/**
 * @fileOverview Bu dosya, sohbet botlarının yapılandırmasını içerir.
 * Botlar için Türkçe kadın isimleri listesini ve sohbetlerde
 * kullanabilecekleri önceden tanımlanmış bir dizi yanıtı barındırır.
 */

export const botNames: string[] = [
    "Ayşe", "Fatma", "Zeynep", "Emine", "Hatice", "Meryem", "Elif", "Büşra",
    "Sultan", "Seda", "Aslı", "Ceren", "Derya", "Ebru", "Funda", "Gizem",
    "Hande", "İrem", "Kübra", "Leyla", "Melis", "Nazlı", "Özge", "Pınar",
    "Selin", "Tuğba", "Yasemin", "Burcu", "Canan", "Deniz"
];

// Messages the bot can send as the very first message
export const botOpenerMessages: string[] = [
    "Selam :)",
    "Merhaba!",
    "Naber?",
    "Slm",
    "Heyy",
];

// A large pool of random replies the bot can use during the conversation
export const botReplies: string[] = [
    // Basic Greetings & Conversation Starters
    "Merhaba!", "Selam, nasılsın?", "İyiyim teşekkürler, sen nasılsın?",
    "Ne yapıyorsun?", "Günün nasıl geçiyor?", "Naber?", "Hey!", "Slm",

    // Reactions & Fillers
    "Anladım.", "Haha, komikmiş.", "Hmm, ilginç.", "Buna sevindim.",
    "Üzüldüm bunu duyduğuma.", "Evet, haklısın.", "Gerçekten mi?", "Aynen.",
    "Olabilir.", "Tamamdır.", "Peki.", "Doğrudur.", "İnanmıyorum!", "Harika!",

    // Questions
    "Nerede yaşıyorsun?", "Ne iş yapıyorsun?", "Hobilerin neler?",
    "Burcun ne?", "En sevdiğin film ne?", "Müzik zevkin nasıl?", "Hafta sonu ne yapıyorsun?",

    // Slightly Flirty / Playful
    "Gözlerin çok güzelmiş.", "Gülüşün çok tatlı.", "Enerjin çok yüksek.",
    "Seninle konuşmak keyifli.", "Bir kahve içsek mi bir ara?", "Beni eklesene?",
    "Profiline baktım da, çok hoş.", "DM'den yürüyelim mi? ;)", "Bana bir şarkı önerir misin?",

    // Complaining / Boredom
    "Bugün canım biraz sıkkın.", "Of, çok sıkıldım.", "Yapacak bir şey bulamıyorum.",
    "Hava da bir garip.", "Keşke tatil olsa.",

    // Random Statements
    "Aklıma bir fikir geldi.", "Dur bi dakika...", "Ne diyeceğimi unuttum.",
    "Bu arada...", "Şey aslında...", "Bugün çok yoruldum.",
    
    // Direct Actions
    "Bana beğeni atar mısın?", "Profilimi takip etmelisin bence.", "Son gönderime bir yorum yaparsan sevinirim.",
    "Beni ekle, daha rahat konuşuruz.", "Seni favorilerime ekledim.",

    // Evasive / Ending Conversation
    "Daha sonra konuşalım mı?", "Biraz işim var da.", "Şimdi çıkmam lazım.",
    "Neyse, sonra görüşürüz.", "Ben kaçtım!", "Yatmam lazım, iyi geceler.",

    // More variety
    "Pizza mı, hamburger mi?", "Kedi insanı mısın köpek mi?", "En son okuduğun kitap neydi?",
    "Yaz mı, kış mı?", "Sabah insanı mısın, gece kuşu mu?", "Süper gücün olsa ne olurdu?",
    "Tatlı mı, tuzlu mu seversin?", "En sevdiğin renk ne?", "Hayalindeki tatil yeri neresi?",
    "Çay mı, kahve mi?", "Klasik.", "Beklenmedik bir cevap.", "Bunu sevdim.", "Fena değil.",
    "Daha iyi olabilir.", "Emin misin?", "Şaka yapıyorsun!", "Ciddi olamazsın.", "Vay canına.",
    "Bunu beklemiyordum.", "Anlat anlat, dinliyorum.", "Çok ilginç bir konu.",
    "Bu konu hakkında saatlerce konuşabilirim.", "Hiç bu açıdan düşünmemiştim.",
    "Bana yeni bir bakış açısı kazandırdın.", "Teşekkür ederim.", "Rica ederim.",
    "Lütfen.", "Afiyet olsun.", "Geçmiş olsun.", "Tebrikler!", "Bol şans!", "Kolay gelsin."
];
