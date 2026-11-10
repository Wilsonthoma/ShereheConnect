// src/lib/i18n/translations.ts

export const LOCALES = ['en', 'sw'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

// ============================================
// ENGLISH — source of truth
// ============================================
const en = {
  // ---------- Navbar ----------
  'nav.menu': 'Menu',
  'nav.events': 'Events',
  'nav.language': 'Language',
  'nav.notifications': 'Notifications',
  'nav.login': 'Login',
  'nav.logout': 'Logout',
  'nav.account': 'Account',
  'nav.myEvents': 'My Events',
  'nav.company': 'Company',
  'nav.help': 'Help',
  'nav.forOrganizers': 'For Organizers',
  'nav.myTickets': 'My Tickets',
  'nav.myBookings': 'My Bookings',
  'nav.pastEvents': 'Past Events',
  'nav.dashboard': 'Dashboard',
  'nav.myProfile': 'My Profile',
  'nav.settings': 'Settings',
  'nav.aboutUs': 'About Us',
  'nav.contactUs': 'Contact Us',
  'nav.blog': 'Blog',
  'nav.careers': 'Careers',
  'nav.helpCenter': 'Help Center',
  'nav.faqs': 'FAQs',
  'nav.privacy': 'Privacy Policy',
  'nav.terms': 'Terms of Service',
  'nav.whySherehe': 'Why ShereheConnect',
  'nav.pricing': 'Pricing',
  'nav.features': 'Features',
  'nav.getStarted': 'Get Started',
  'nav.chooseLanguage': 'Choose Language',
  'nav.noNotifications': 'No notifications yet',
  'nav.markAllRead': 'Mark all read',
  'nav.welcome': 'Welcome to ShereheConnect',
  'nav.loginPrompt': 'Log in to access your tickets, bookings, and more.',

  // ---------- Hero ----------
  'hero.title.line1': 'Discover Events',
  'hero.title.line2': 'Across Kenya',
  'hero.tagline.prefix': 'Find, book, and attend',
  'hero.tagline.words': 'festivals.,conferences.,concerts.,workshops.,experiences.',
  'hero.subtitle': "Kenya's modern platform for discovering and booking unforgettable experiences.",
  'hero.search.placeholder': 'Search events, venues...',
  'hero.search.nearMe': 'Near me',
  'hero.search.button': 'Search',
  'hero.cta.browse': 'Browse Events',
  'hero.cta.organizer': 'Become an Organizer',

  // ---------- Featured Events ----------
  'featured.heading': 'Featured Events',
  'featured.subtitle': 'Handpicked experiences happening across the country',
  'featured.viewAll': 'View All Events',
  'featured.viewEvent': 'View Event',

  // ---------- How It Works ----------
  'how.heading': 'How It Works',
  'how.step1.title': 'Discover',
  'how.step1.desc': 'Browse events by category, location, or date.',
  'how.step2.title': 'Book',
  'how.step2.desc': 'Select your tickets and pay securely.',
  'how.step3.title': 'Attend',
  'how.step3.desc': 'Show your QR code at the gate.',

  // ---------- Why ShereheConnect ----------
  'why.heading': 'Why ShereheConnect?',
  'why.subtitle': 'What sets us apart',
  'why.reason1.title': 'Secure Payments',
  'why.reason1.desc': 'M-Pesa direct to organizer',
  'why.reason2.title': 'M-Pesa Native',
  'why.reason2.desc': 'Built for Kenya',
  'why.reason3.title': 'Verified Events',
  'why.reason3.desc': 'Every event reviewed',

  // ---------- For Organizers ----------
  'org.heading.line1': 'Host Events,',
  'org.heading.line2': 'Grow Your Audience',
  'org.subtitle': 'Join hundreds of organizers.',
  'org.benefit1': 'Create events',
  'org.benefit2': 'Accept M-Pesa',
  'org.benefit3': 'Track sales',
  'org.benefit4': 'Scan tickets',
  'org.cta': 'Start Organizing',

  // ---------- CTA Band ----------
  'cta.heading.line1': 'Ready to discover your',
  'cta.heading.line2a': 'next',
  'cta.heading.line2b': 'experience',
  'cta.subtitle': 'Join thousands of Kenyans.',
  'cta.getStarted': 'Get Started Free',
  'cta.browse': 'Browse Events',

  // ---------- Footer ----------
  'footer.rights': 'All rights reserved.',
  'footer.tagline': "Kenya's modern platform.",
  'footer.taglineShort': 'Discover Events',
  'footer.company': 'Company',
  'footer.about': 'About',
  'footer.contact': 'Contact',
  'footer.customerStories': 'Customer Stories',
  'footer.careers': 'Careers',
  'footer.events': 'Events',
  'footer.browseEvents': 'Browse Events',
  'footer.myTickets': 'My Tickets',
  'footer.forOrganizers': 'For Organizers',
  'footer.wishlist': 'Wishlist',
  'footer.getInTouch': 'Get in Touch',
  'footer.location': 'Nairobi, Kenya',
  'footer.terms': 'Terms',
  'footer.privacy': 'Privacy',
  'footer.cookies': 'Cookies',

  // ---------- Flipbook ----------
  'flipbook.viewEvent': 'View Event',
  'flipbook.hint': 'Scroll or drag',
  'flipbook.pricePrefix': 'KES',

  // ---------- OTP ----------
  'otp.digit': 'Digit {number}',

  // ---------- Public Events ----------
  'events.hero.title': 'Discover Events',
  'events.hero.subtitle': 'Find festivals, conferences, concerts, and more.',
  'events.search.placeholder': 'Search events...',
  'events.filter.all': 'All',
  'events.filter.county': 'Filter by county...',
  'events.loading': 'Loading events...',
  'events.empty.title': 'No events found',
  'events.empty.subtitle': 'Try adjusting your search.',
  'events.result.singular': 'event',
  'events.result.plural': 'events',
  'events.result.found': 'found',
  'events.card.view': 'View',
  'events.cat.festival': 'Festivals',
  'events.cat.conference': 'Conferences',
  'events.cat.entertainment': 'Entertainment',
  'events.cat.sports': 'Sports',
  'events.cat.arts': 'Arts & Culture',
  'events.cat.community': 'Community',
  'events.cat.education': 'Workshops',
  'events.cat.business': 'Business',

  // ---------- Public Event Detail ----------
  'evt.notFound': 'Event not found',
  'evt.notFoundDesc': 'This event does not exist or is not live.',
  'evt.browse': 'Browse All Events',
  'evt.about': 'About This Event',
  'evt.features': 'Event Features',
  'evt.tab.details': 'Details',
  'evt.tab.venue': 'Venue',
  'evt.tab.organizer': 'Organizer',
  'evt.tab.reviews': 'Reviews',
  'evt.tickets.left': '{count} tickets left',
  'evt.tickets.starting': 'Starting from',
  'evt.tickets.book': 'Book Ticket Now',
  'evt.reviews.empty': 'No reviews yet.',

  // ---------- Features ----------
  'feature.general': 'General Admission',
  'feature.standard': 'Standard Entry',
  'feature.vip': 'VIP Access',
  'feature.wifi': 'Free Wi-Fi',
  'feature.parking': 'Parking Available',
  'feature.drinks': 'Drinks Included',
  'feature.food': 'Food Available',

  // ---------- Interpolation ----------
  'welcome.user': 'Welcome back, {name}',
  'event.attendees': '{count} people are attending',
  'search.results': 'Found {count} events near {city}',
} as const;

// ============================================
// SWAHILI — must mirror the same keys
// ============================================
const sw: Record<keyof typeof en, string> = {
  // ---------- Navbar ----------
  'nav.menu': 'Menyu',
  'nav.events': 'Matukio',
  'nav.language': 'Lugha',
  'nav.notifications': 'Taarifa',
  'nav.login': 'Ingia',
  'nav.logout': 'Toka',
  'nav.account': 'Akaunti',
  'nav.myEvents': 'Matukio Yangu',
  'nav.company': 'Kampuni',
  'nav.help': 'Msaada',
  'nav.forOrganizers': 'Kwa Waandaaji',
  'nav.myTickets': 'Tiketi Zangu',
  'nav.myBookings': 'Uhifadhi Wangu',
  'nav.pastEvents': 'Matukio ya Nyuma',
  'nav.dashboard': 'Dashibodi',
  'nav.myProfile': 'Wasifu Wangu',
  'nav.settings': 'Mipangilio',
  'nav.aboutUs': 'Kutuhusu',
  'nav.contactUs': 'Wasiliana Nasi',
  'nav.blog': 'Blogu',
  'nav.careers': 'Ajira',
  'nav.helpCenter': 'Kituo cha Msaada',
  'nav.faqs': 'Maswali',
  'nav.privacy': 'Sera ya Faragha',
  'nav.terms': 'Masharti ya Matumizi',
  'nav.whySherehe': 'Kwa Nini ShereheConnect',
  'nav.pricing': 'Bei',
  'nav.features': 'Vipengele',
  'nav.getStarted': 'Anza Sasa',
  'nav.chooseLanguage': 'Chagua Lugha',
  'nav.noNotifications': 'Hakuna taarifa bado',
  'nav.markAllRead': 'Weka zote kama zimesomwa',
  'nav.welcome': 'Karibu ShereheConnect',
  'nav.loginPrompt': 'Ingia ili kupata tiketi zako.',

  // ---------- Hero ----------
  'hero.title.line1': 'Gundua Matukio',
  'hero.title.line2': 'Kote Kenya',
  'hero.tagline.prefix': 'Tafuta, hifadhi, na hudhuria',
  'hero.tagline.words': 'sherehe.,makongamano.,matamasha.,warsha.,uzoefu.',
  'hero.subtitle': 'Jukwaa la kisasa la Kenya.',
  'hero.search.placeholder': 'Tafuta matukio...',
  'hero.search.nearMe': 'Karibu nami',
  'hero.search.button': 'Tafuta',
  'hero.cta.browse': 'Vinjari Matukio',
  'hero.cta.organizer': 'Kuwa Mwandaaji',

  // ---------- Featured Events ----------
  'featured.heading': 'Matukio Maalum',
  'featured.subtitle': 'Matukio yaliyochaguliwa',
  'featured.viewAll': 'Ona Matukio Yote',
  'featured.viewEvent': 'Ona Tukio',

  // ---------- How It Works ----------
  'how.heading': 'Inavyofanya Kazi',
  'how.step1.title': 'Gundua',
  'how.step1.desc': 'Vinjari matukio...',
  'how.step2.title': 'Hifadhi',
  'how.step2.desc': 'Chagua tiketi zako...',
  'how.step3.title': 'Hudhuria',
  'how.step3.desc': 'Onyesha msimbo wako...',

  // ---------- Why ShereheConnect ----------
  'why.heading': 'Kwa Nini ShereheConnect?',
  'why.subtitle': 'Kinachotutofautisha',
  'why.reason1.title': 'Malipo Salama',
  'why.reason1.desc': 'M-Pesa moja kwa moja',
  'why.reason2.title': 'M-Pesa Asili',
  'why.reason2.desc': 'Imeundwa kwa Kenya',
  'why.reason3.title': 'Matukio Yaliyothibitishwa',
  'why.reason3.desc': 'Kila tukio linakaguliwa',

  // ---------- For Organizers ----------
  'org.heading.line1': 'Andaa Matukio,',
  'org.heading.line2': 'Kuza Hadhira Yako',
  'org.subtitle': 'Jiunge na mamia ya waandaaji...',
  'org.benefit1': 'Unda matukio',
  'org.benefit2': 'Pokea malipo',
  'org.benefit3': 'Fuatilia mauzo',
  'org.benefit4': 'Changanua tiketi',
  'org.cta': 'Anza Kuandaa',

  // ---------- CTA Band ----------
  'cta.heading.line1': 'Uko tayari kugundua',
  'cta.heading.line2a': 'uzoefu wako',
  'cta.heading.line2b': 'unaofuata',
  'cta.subtitle': 'Jiunge na maelfu ya Wakenya...',
  'cta.getStarted': 'Anza Bure',
  'cta.browse': 'Vinjari Matukio',

  // ---------- Footer ----------
  'footer.rights': 'Haki zote zimehifadhiwa.',
  'footer.tagline': 'Jukwaa la kisasa la Kenya.',
  'footer.taglineShort': 'Gundua Matukio',
  'footer.company': 'Kampuni',
  'footer.about': 'Kutuhusu',
  'footer.contact': 'Wasiliana',
  'footer.customerStories': 'Hadithi za Wateja',
  'footer.careers': 'Ajira',
  'footer.events': 'Matukio',
  'footer.browseEvents': 'Vinjari Matukio',
  'footer.myTickets': 'Tiketi Zangu',
  'footer.forOrganizers': 'Kwa Waandaaji',
  'footer.wishlist': 'Orodha ya Matamanio',
  'footer.getInTouch': 'Wasiliana Nasi',
  'footer.location': 'Nairobi, Kenya',
  'footer.terms': 'Masharti',
  'footer.privacy': 'Faragha',
  'footer.cookies': 'Vidakuzi',

  // ---------- Flipbook ----------
  'flipbook.viewEvent': 'Ona Tukio',
  'flipbook.hint': 'Sogeza au buruta',
  'flipbook.pricePrefix': 'Ksh',

  // ---------- OTP ----------
  'otp.digit': 'Namba {number}',

  // ---------- Public Events ----------
  'events.hero.title': 'Gundua Matukio',
  'events.hero.subtitle': 'Pata sherehe, makongamano...',
  'events.search.placeholder': 'Tafuta matukio...',
  'events.filter.all': 'Zote',
  'events.filter.county': 'Chuja kwa kaunti...',
  'events.loading': 'Inapakia matukio...',
  'events.empty.title': 'Hakuna matukio',
  'events.empty.subtitle': 'Jaribu kurekebisha...',
  'events.result.singular': 'tukio',
  'events.result.plural': 'matukio',
  'events.result.found': 'yamepatikana',
  'events.card.view': 'Tazama',
  'events.cat.festival': 'Sherehe',
  'events.cat.conference': 'Makongamano',
  'events.cat.entertainment': 'Burudani',
  'events.cat.sports': 'Michezo',
  'events.cat.arts': 'Sanaa',
  'events.cat.community': 'Jamii',
  'events.cat.education': 'Warsha',
  'events.cat.business': 'Biashara',

  // ---------- Public Event Detail ----------
  'evt.notFound': 'Tukio halijapatikana',
  'evt.notFoundDesc': 'Tukio hili halipo...',
  'evt.browse': 'Tazama Matukio Yote',
  'evt.about': 'Kuhusu Tukio Hili',
  'evt.features': 'Vipengele vya Tukio',
  'evt.tab.details': 'Maelezo',
  'evt.tab.venue': 'Ukumbi',
  'evt.tab.organizer': 'Mwandaji',
  'evt.tab.reviews': 'Maoni',
  'evt.tickets.left': 'Tiketi {count} zimebaki',
  'evt.tickets.starting': 'Kuanzia',
  'evt.tickets.book': 'Hifadhi Tiketi Sasa',
  'evt.reviews.empty': 'Hakuna maoni bado.',

  // ---------- Features ----------
  'feature.general': 'Kiingilio cha Jumla',
  'feature.standard': 'Kiingilio cha Kawaida',
  'feature.vip': 'Ufikiaji wa VIP',
  'feature.wifi': 'Wi-Fi Bure',
  'feature.parking': 'Maegesho',
  'feature.drinks': 'Vinywaji',
  'feature.food': 'Chakula',

  // ---------- Interpolation ----------
  'welcome.user': 'Karibu tena, {name}',
  'event.attendees': 'Watu {count} wanahudhuria',
  'search.results': 'Tumepata matukio {count} karibu na {city}',
};

// ============================================
// Registry + types
// ============================================
export const dictionaries: Record<Locale, Record<string, string>> = {
  en,
  sw,
};

export type TranslationKey = keyof typeof en;

// Optional: keep the old named export for any
// component that still imports `translations`.
export const translations = dictionaries;