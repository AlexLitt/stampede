export type ClusterBrief = {
  because: string;
  doNot: string;
  tip: string;
};

/** Skip vs steal copy. Human. Same voice as oneLine. */
export const BRIEFS: Record<string, ClusterBrief> = {
  "chatgpt-wrapper": {
    because:
      "The demo is a chat box. System prompt plus an API key. Every weekend starts here.",
    doNot: "This is not a support inbox bolted to a real ticket queue.",
    tip: "If the product is the prompt, the price is a race to zero.",
  },
  "ai-resume": {
    because:
      "Paste LinkedIn, get a PDF. The ATS myth is the whole pitch. Crowd never leaves.",
    doNot: "This is not a dating-profile photo mill. Different buyer, different ads.",
    tip: "ATS wrappers race to $0. The PDF is not the product.",
  },
  "chat-with-pdf": {
    because:
      "Upload a file, ask it questions. Same RAG demo, new domain name every week.",
    doNot: "This is not a farm SOP wiki. Plants do not want a chat box.",
    tip: "If the file is the product, Dropbox already won.",
  },
  "meeting-notes": {
    because:
      "A bot joins Zoom and dumps a recap. Every team already has three of these.",
    doNot: "This is not HVAC dispatch. The shop line books a tech, not a summary.",
    tip: "Otter and Granola already sit in the calendar. You are the fourth bot.",
  },
  "linkedin-ghostwriter": {
    because:
      "Hook, story, lesson, CTA. The template is public. The feed is the whole market.",
    doNot: "This is not a church bulletin. Different room, different week.",
    tip: "If the output is a post, the buyer is already posting.",
  },
  "ai-thumbnails": {
    because: "Face, big text, arrow. YouTube already taught the look. Commodity render.",
    doNot: "This is not a dating headshot mill. Creators are not that buyer.",
    tip: "Canva ships the same face tomorrow. Do not rent GPUs for this.",
  },
  "ai-email-writer": {
    because: "Rewrite this colder. Now warmer. Every CRM already has the button.",
    doNot: "This is not dental recall SMS. Hygiene reminders are a different job.",
    tip: "If the editor is Gmail, you are a sidebar they will ignore.",
  },
  "instagram-carousel-ai": {
    because: "Slide 1 is a hot take. The rest is padding. Same pack as LinkedIn.",
    doNot: "This is not a funeral obituary page. Families do not want carousels.",
    tip: "Canva and CapCut already sit on the phone.",
  },
  "client-portal": {
    because:
      "Files, comments, invoices. Every agency rebuilds this on a Saturday.",
    doNot: "This is not a white-label portal for accountants. CPAs invoice 40 clients.",
    tip: "Notion plus Stripe already does the job. The portal is not the firm.",
  },
  "landing-page-ai": {
    because: "Hero, social proof, fake waitlist. The prompt is the builder.",
    doNot: "This is not a room visualizer. Drapes are a photo of a window.",
    tip: "Framer and Carrd already sit in the bookmark bar.",
  },
  "support-inbox-agent": {
    because:
      "It tags tickets and drafts replies. Then it pages a human. The demo is the product.",
    doNot: "This is not a solo-shop SMS recall. Bays and chairs are not Zendesk.",
    tip: "Intercom already drafts. You are the skin.",
  },
  "sheets-copilot": {
    because: "A sidebar that writes VLOOKUP you will not audit. Spreadsheet theater.",
    doNot: "This is not a TikTok-only MRR tracker. One channel, ugly, paid.",
    tip: "Excel Copilot is already in the ribbon.",
  },
  "proposal-deck-ai": {
    because: "Case study, timeline, a number they made up. The deck is the agency.",
    doNot: "This is not a freelance contract. Scope and kill fee are legal, not slides.",
    tip: "Gamma already fills the 12-page slot.",
  },
  "freelance-contract-ai": {
    because: "Scope, kill fee, a signature box. Every freelancer generates one once.",
    doNot: "This is not an invoice PDF from chat. Collecting money is the other job.",
    tip: "HelloSign and Bonsai already sit in the tab.",
  },
  "ai-headshot": {
    because: "LinkedIn face, four outfits, same lighting. The mill is the weekend.",
    doNot: "This is not dating-profile photo AI. Tinder ads are a different spend.",
    tip: "Upload 12 selfies. The model is rented. So is the margin.",
  },
  "photo-colorize": {
    because: "Grandma in color. $8. They will share it. Then the feed is done.",
    doNot: "This is not a lost-pet poster. Neighborhood Facebook is the channel.",
    tip: "MyHeritage already sold this to the family group chat.",
  },
  "qr-menu": {
    because: "PDF on a stick. They still laminate a backup. Every food-tech weekend.",
    doNot: "This is not auto-shop SMS. Oil change is due. The bay is booked.",
    tip: "Square and Toast already print the code.",
  },
  "salon-booking-sms": {
    because: "Confirm, remind, no-show fee. Every barber already has a tool.",
    doNot: "This is not dental recall. Six-month hygiene is a different cadence.",
    tip: "Vagaro and Square Appointments sit on the front desk.",
  },
  "invoice-pdf-ai": {
    because: "Type the job. Get a PDF. Chase it yourself. The chat is not collections.",
    doNot: "This is not an Etsy fee calculator. One marketplace, one ugly form.",
    tip: "Stripe Invoicing already emails the PDF.",
  },
  "ynab-wrapper": {
    because: "YNAB with gradients. Same guilt. Envelope math is not a startup.",
    doNot: "This is not a TikTok-only MRR tracker. Creators already pay for ugly.",
    tip: "YNAB and Monarch sit in the App Store. You are a skin.",
  },
  "room-curtain-visualizer": {
    because:
      "Upload a window photo. Swap fabric on the rod. Drapery shops already take the card.",
    doNot: "Do not build another landing-page generator. That is the herd.",
    tip: "Sold next to the sample book, not on Product Hunt.",
  },
  "dating-profile-photo-ai": {
    because:
      "AI photos for Tinder and Hinge. Paid ads off. People still pay to look dateable.",
    doNot: "Do not build the LinkedIn headshot mill. That crowd is already here.",
    tip: "Distribution is the hole. Lifetime revenue exists. Paid UA is off.",
  },
  "tiktok-mrr-tracker": {
    because:
      "One channel. Ugly dashboard. Someone already bills for counting TikTok dollars.",
    doNot: "Do not wrap YNAB. Envelope guilt is the stampede.",
    tip: "TikTok only. The buyer already lives in that app.",
  },
  "dental-recall-sms": {
    because:
      "Six-month hygiene reminder. Solo chairs pay so the book stays full.",
    doNot: "Do not build salon booking SMS. Confirm-and-remind is already crowded.",
    tip: "Sold in dental Facebook groups, not Twitter.",
  },
  "funeral-obituary-cms": {
    because:
      "Service times, flowers, a page families actually open. Homes already pay.",
    doNot: "Do not build Instagram carousel AI. Families are not a hot-take slide.",
    tip: "Sold at funeral-director conferences.",
  },
  "hvac-voice-agent": {
    because: "Answers the shop line. Books a tech. Ugly. Dispatch already pays.",
    doNot: "Do not build a meeting-notes bot. Zoom recaps are the herd.",
    tip: "Sold in HVAC Facebook groups.",
  },
  "farm-sop-wiki": {
    because:
      "Paste the binder. Get a searchable mess. Plants already pay for the ugly version.",
    doNot: "Do not build chat-with-PDF. A plant is not a demo file.",
    tip: "Sold at Ag trade shows.",
  },
  "church-bulletin-ai": {
    because: "Hymns, times, a potluck. Parishes already pay for Sunday.",
    doNot: "Do not build a LinkedIn ghostwriter. The parish is not a hook.",
    tip: "Church admin Facebook, not Product Hunt.",
  },
  "accountant-white-label": {
    because:
      "Their logo. Your code. They invoice 40 clients. The CPA is the channel.",
    doNot: "Do not build another agency client portal. Files and comments are the herd.",
    tip: "CPA Facebook groups.",
  },
  "pet-lost-poster": {
    because:
      "Photo, last seen, a QR. Neighborhood Facebook does the rest. People pay in a panic.",
    doNot: "Do not build old-photo colorize. Grandma in color is the stampede.",
    tip: "Nextdoor ads, not Twitter.",
  },
  "etsy-fee-calc": {
    because:
      "One marketplace. One ugly form. Sellers pay yearly to know the take.",
    doNot: "Do not build an invoice PDF from chat. That crowd is already shipping.",
    tip: "Etsy seller forums.",
  },
  "vet-recall-sms": {
    because: "Rabies due. Text the owner. Solo clinics already pay for this.",
    doNot: "Do not build dental recall. Teeth are not shots. Different board, different group.",
    tip: "Sold in vet Facebook groups, not Twitter.",
  },
  "auto-shop-sms": {
    because: "Oil change is due. The bay is booked. Shops pay to fill the lift.",
    doNot: "Do not build a QR menu. Laminated backups are the herd.",
    tip: "Shop owners, not Product Hunt.",
  },
  "property-manager-solo": {
    because:
      "Rent due. Toilet photo. Twelve doors, not AppFolio. The solo landlord already pays.",
    doNot: "Do not build a 200-unit PMS. That is AppFolio. This is twelve doors.",
    tip: "Landlord forums, not Twitter.",
  },
};
