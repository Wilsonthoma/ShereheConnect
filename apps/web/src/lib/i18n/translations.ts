export const LOCALES = ['en', 'sw'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

const en = {
  'nav.menu': 'Menu', 'nav.events': 'Events', 'nav.language': 'Language',
  'nav.notifications': 'Notifications', 'nav.login': 'Login', 'nav.logout': 'Logout',
  'nav.account': 'Account', 'nav.myEvents': 'My Events', 'nav.dashboard': 'Dashboard',
  'nav.profile': 'Profile', 'nav.settings': 'Settings', 'nav.tickets': 'My Tickets',
  
  'org.new.title': 'Create Event', 'org.new.subtitle': 'Provide all details. Attendees will see this before booking.',
  'org.edit.title': 'Edit Event', 'org.edit.subtitle': 'Update details for your event.',
  'org.step1': 'Basic Info', 'org.step2': 'Venue & Time', 'org.step3': 'Tickets & Extras',
  'org.field.title': 'Event Title', 'org.field.category': 'Category', 'org.field.image': 'Cover Image', 'org.field.desc': 'Event Description',
  'org.field.venue': 'Venue Name', 'org.field.address': 'Street Address', 'org.field.county': 'County',
  'org.field.lat': 'Latitude', 'org.field.lng': 'Longitude', 'org.field.starts': 'Starts At', 'org.field.ends': 'Ends At',
  'org.field.maxAttendees': 'Max Attendees (Optional)',
  'org.featured.title': 'Featured Event', 'org.featured.desc': 'Highlight this event to make it stand out.',
  'org.features.title': 'Event Features', 'org.features.subtitle': 'Select the amenities available at this event.',
  'org.tickets.title': 'Ticket Tiers', 'org.tickets.add': 'Add Tier', 'org.tickets.tier': 'Tier', 'org.tickets.name': 'Tier Name', 'org.tickets.price': 'Price (KES)', 'org.tickets.qty': 'Quantity',
  'org.btn.back': 'Back', 'org.btn.continue': 'Continue', 'org.btn.save': 'Save Event', 'org.btn.saving': 'Saving...',
  
  'evt.about': 'About This Event', 'evt.features': 'Event Features', 'evt.tab.details': 'Details', 'evt.tab.venue': 'Venue', 'evt.tab.organizer': 'Organizer', 'evt.tab.reviews': 'Reviews',
  'evt.reviews.count': '{count} reviews', 'evt.reviews.empty': 'No reviews yet. Be the first to review this event!',
  'evt.tickets': 'Tickets', 'evt.tickets.left': '{count} tickets left', 'evt.tickets.starting': 'Starting from', 'evt.tickets.book': 'Book Ticket Now', 'evt.tickets.secure': 'Secure booking guaranteed', 'evt.tickets.email': 'E-tickets sent to your email', 'evt.tickets.mobile': 'Mobile tickets available',
  'evt.notFound': 'Event not found', 'evt.notFoundDesc': 'This event does not exist or is not live.', 'evt.browse': 'Browse All Events', 'evt.back': 'Back to Events',

  'feature.general': 'General Admission', 'feature.standard': 'Standard Entry', 'feature.vip': 'VIP Access', 'feature.wifi': 'Free Wi-Fi', 'feature.parking': 'Parking Available', 'feature.drinks': 'Drinks Included', 'feature.food': 'Food Available',
} as const;

const sw: Record<keyof typeof en, string> = {
  'nav.menu': 'Menyu', 'nav.events': 'Matukio', 'nav.language': 'Lugha',
  'nav.notifications': 'Taarifa', 'nav.login': 'Ingia', 'nav.logout': 'Toka',
  'nav.account': 'Akaunti', 'nav.myEvents': 'Matukio Yangu', 'nav.dashboard': 'Dashibodi',
  'nav.profile': 'Wasifu', 'nav.settings': 'Mipangilio', 'nav.tickets': 'Tiketi Zangu',
  
  'org.new.title': 'Unda Tukio', 'org.new.subtitle': 'Toa maelezo yote. Wahudhuriaji wataona hii kabla ya kuhifadhi.',
  'org.edit.title': 'Hariri Tukio', 'org.edit.subtitle': 'Sasisha maelezo ya tukio lako.',
  'org.step1': 'Taarifa za Msingi', 'org.step2': 'Ukumbi na Muda', 'org.step3': 'Tiketi na Zaidi',
  'org.field.title': 'Jina la Tukio', 'org.field.category': 'Kategoria', 'org.field.image': 'Picha ya Jalada', 'org.field.desc': 'Maelezo ya Tukio',
  'org.field.venue': 'Jina la Ukumbi', 'org.field.address': 'Anwani ya Mtaa', 'org.field.county': 'Kaunti',
  'org.field.lat': 'Latitudo', 'org.field.lng': 'Longitudo', 'org.field.starts': 'Inaanza', 'org.field.ends': 'Inaisha',
  'org.field.maxAttendees': 'Idadi ya Juu ya Wahudhuriaji (Hiari)',
  'org.featured.title': 'Tukio Maalum', 'org.featured.desc': 'Angazia tukio hili ili liweze kuonekana zaidi.',
  'org.features.title': 'Vipengele vya Tukio', 'org.features.subtitle': 'Chagua huduma zinazopatikana kwenye tukio hili.',
  'org.tickets.title': 'Ngazi za Tiketi', 'org.tickets.add': 'Ongeza Ngazi', 'org.tickets.tier': 'Ngazi', 'org.tickets.name': 'Jina la Ngazi', 'org.tickets.price': 'Bei (KES)', 'org.tickets.qty': 'Idadi',
  'org.btn.back': 'Rudi', 'org.btn.continue': 'Endelea', 'org.btn.save': 'Hifadhi Tukio', 'org.btn.saving': 'Inahifadhi...',
  
  'evt.about': 'Kuhusu Tukio Hili', 'evt.features': 'Vipengele vya Tukio', 'evt.tab.details': 'Maelezo', 'evt.tab.venue': 'Ukumbi', 'evt.tab.organizer': 'Mwandaji', 'evt.tab.reviews': 'Maoni',
  'evt.reviews.count': 'Maoni {count}', 'evt.reviews.empty': 'Hakuna maoni bado. Kuwa wa kwanza kutoa maoni!',
  'evt.tickets': 'Tiketi', 'evt.tickets.left': 'Tiketi {count} zimebaki', 'evt.tickets.starting': 'Kuanzia', 'evt.tickets.book': 'Hifadhi Tiketi Sasa', 'evt.tickets.secure': 'Uhifadhi salama umehakikishwa', 'evt.tickets.email': 'Tiketi za e-mail zinatumwa', 'evt.tickets.mobile': 'Tiketi za simu zinapatikana',
  'evt.notFound': 'Tukio halijapatikana', 'evt.notFoundDesc': 'Tukio hili halipo au halifanyiki kwa sasa.', 'evt.browse': 'Vinjari Matukio Yote', 'evt.back': 'Rudi kwenye Matukio',

  'feature.general': 'Kiingilio cha Jumla', 'feature.standard': 'Kiingilio cha Kawaida', 'feature.vip': 'Ufikiaji wa VIP', 'feature.wifi': 'Wi-Fi Bure', 'feature.parking': 'Maegesho Yanapatikana', 'feature.drinks': 'Vinywaji Vimejumuishwa', 'feature.food': 'Chakula Kinapatikana',
};

export const dictionaries: Record<Locale, Record<string, string>> = { en, sw };
export type TranslationKey = keyof typeof en;
export const translations = dictionaries;
