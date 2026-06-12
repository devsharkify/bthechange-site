// =====================================================================
// B The Change, static site generator
// Run: node generate.js
// Produces:
//   ./out/index.html
//   ./out/assets/style.css
//   ./out/programs/<slug>.html             × 11
//   ./out/programs/<slug>/support.html     × 11
// =====================================================================

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');

// ============= PROGRAM DATA (from PDF + logo grid) =============
const PROGRAMS = [
  {
    slug: 'coding-on-wheels',
    name: 'Coding on Wheels',
    tagline: "Bridging India's digital divide through code, AI &amp; robotics.",
    color: '#1E3A6F',
    logoBg: 'linear-gradient(135deg, #DCE8F5 0%, #A4BEDC 100%)',
    icon: 'monitor',
    stats: [
      { num: '200,000+', label: 'CHILDREN REACHED' },
      { num: '1,000+', label: 'SCHOOLS PARTNERED' },
      { num: '6', label: 'LAPTOPS · YEAR ONE' },
    ],
    objective: "Bridge the digital divide by delivering coding, AI, and robotics education to underserved children.",
    context: "India's push for a digital economy highlights a significant skills gap, with millions in rural and low-income areas lacking access to technological education. This program directly addresses this disparity by bringing fully equipped mobile classrooms to government schools and slums, creating a pipeline of future-ready talent from marginalized communities.",
    activities: [
      "Deployment of mobile classrooms with laptops, robotics kits, and internet connectivity.",
      "Provision of free, structured training in Scratch, Python, AI basics, and robotics.",
      "Strategic partnerships with over 1,000 schools for wide-scale, grassroots outreach.",
    ],
    impact: "What began with 6 laptops and 10 schools has grown into a movement that has empowered <strong>over 2,00,000 children</strong> with foundational digital skills.",
    quote: "I am the first person in my village to write a Python program. My amma still doesn't quite understand what I do, but she knows I'll never be a daily-wage labourer.",
    quoteBy: "ARJUN · CLASS 9 · ADILABAD",
    logoImg: 'assets/logo-coding-on-wheels.jpg',
    gallery: [
      { src: 'assets/hero-kids-coding.jpg', caption: 'Students writing their first Python programs inside a Coding on Wheels mobile classroom in Telangana.', meta: 'MOBILE CLASSROOM · TELANGANA' },
      { src: 'assets/coding-bus-students.jpg', caption: 'A live coding session with secondary-school students. Each bus carries 8 laptops, projectors, and offline-first learning material.', meta: 'IN-SESSION · 8 LAPTOPS' },
      { src: 'assets/coding-bus-clean.jpg', caption: 'The Coding on Wheels bus is built around concentration: long bench, natural light, code editor open from minute one.', meta: 'INSIDE THE BUS' },
    ],
  },
  {
    slug: 'changemakers',
    name: 'Changemakers',
    tagline: "Be the spark. Lead the change.",
    color: '#1E3A6F',
    logoBg: 'linear-gradient(135deg, #E5EDF8 0%, #A8C0DC 100%)',
    icon: 'spark',
    stats: [
      { num: 'Hundreds', label: 'GRASSROOTS LEADERS' },
      { num: '7-80+', label: 'AGE RANGE' },
      { num: '∞', label: 'COMMUNITIES' },
    ],
    objective: "Unite individuals and empower them to become active drivers of social change.",
    context: "Real, lasting change requires community-led action. This project focuses on building an inclusive network of active citizens, bringing together men, women, transgender persons, and children (ages 7-80+) to identify and solve local problems. It champions the idea that everyone has the power to contribute.",
    activities: [
      "Identifying and mobilizing solutions for community-specific needs.",
      "Engaging in advocacy with government departments to secure citizen rights.",
      "Innovating with digital tools like WhatsApp to efficiently deliver essential goods and information.",
    ],
    impact: "Hundreds of individuals have been transformed into <strong>effective grassroots leaders</strong>, demonstrating that age and background are no barrier to making a difference.",
    quote: "I was 67 when I started organising my colony's water-supply complaint. Now I run the WhatsApp group for three wards.",
    quoteBy: "KAMALA · 71 · WARD 13, SECUNDERABAD",
    logoImg: 'assets/logo-changemakers.jpg',
  },
  {
    slug: 'organ-donation-on-wheels',
    name: 'Organ Donation Campaign on Wheels',
    tagline: "Wheels that carry the message of life.",
    color: '#1E3A6F',
    logoBg: 'linear-gradient(135deg, #FFE0E0 0%, #FFB0B0 100%)',
    icon: 'heart',
    stats: [
      { num: 'Thousands', label: 'CITIZENS SENSITIZED' },
      { num: 'South India', label: 'COVERAGE' },
      { num: 'Jeevandan', label: 'OFFICIAL PARTNER' },
    ],
    objective: "Raise public awareness on the life-saving importance of organ, eye, and body donation.",
    context: "India has one of the lowest organ donation rates in the world, often due to a lack of awareness and deep-rooted social stigma. This initiative tackles these barriers head-on by using a mobile campaign strategy to reach a broad audience and promote a compassionate culture of donation.",
    activities: [
      "Partnership with Jeevandan and other key NGOs to maximize outreach.",
      "Conducting targeted awareness sessions in schools, colleges, and local communities.",
      "Campaigning inspired by the founder's personal experience, adding a powerful, authentic voice to the cause.",
    ],
    impact: "Thousands of citizens across South India have been sensitized, leading to a <strong>steadily growing network</strong> of registered organ donors.",
    quote: "I signed the donor card after their session at my college. Two years later, my father's eyes saved someone else's vision. The circle closed.",
    quoteBy: "FATHIMA · 24 · MEDICAL STUDENT",
    logoImg: 'assets/od-logo.jpg',
    gallery: [
      { src: 'assets/od-vehicle-rear.jpg', caption: '"Become a donor today", the campaign vehicle that has been touring South India.', meta: 'CAMPAIGN VEHICLE' },
      { src: 'assets/od-vehicle-side.jpg', caption: 'MP Konda Vishweshwar Reddy launching the poster.', meta: 'POSTER LAUNCH · MP KVR' },
      { src: 'assets/ktr-inauguration.jpg', caption: 'Ex-IT Minister of Telangana, Shri K. T. Rama Rao, inaugurating the Organ Donation vehicle.', meta: 'INAUGURATION · KTR' },
    ],
  },
  {
    slug: 'eko-warriors',
    name: 'EKO Warriors',
    tagline: "Defenders of nature. Protectors of place.",
    color: '#2D7A3E',
    logoBg: 'linear-gradient(135deg, #E0F4E5 0%, #A8D5B5 100%)',
    icon: 'leaf',
    stats: [
      { num: '9 yrs', label: 'SUSTAINED CAMPAIGN' },
      { num: 'Damagundam', label: 'RESERVE PROTECTED' },
      { num: '40+', label: 'STUDENT ECO-CLUBS' },
    ],
    objective: "Protect India's environment and preserve its natural heritage.",
    context: "Rapid urbanization and industrialization have placed immense pressure on India's ecosystems. This project actively combats pollution, deforestation, and ecosystem destruction through both community action and legal advocacy.",
    activities: [
      "Sustained campaigns to protect vital ecological zones like the Damagundam Reserve Forest.",
      "Promoting environmentally conscious cultural practices, such as eco-friendly Ganesha idols made from cow dung.",
      "Forming student eco-clubs and conducting awareness drives in educational institutions.",
    ],
    impact: "Over <strong>9 years of sustained campaigns</strong> and successful legal interventions have prevented large-scale ecological destruction and set a precedent for environmental protection.",
    quote: "When the forest department came with bulldozers, our PIL was already in court. The trees are still standing. That's not nothing.",
    quoteBy: "PRADEEP · ENVIRONMENTAL ADVOCATE",
    logoImg: 'assets/logo-eko-warriors.jpg',
  },
  {
    slug: 'pawtection-force',
    name: 'PAWtection Force',
    tagline: "Guardians of the speechless.",
    color: '#5A5A55',
    logoBg: 'linear-gradient(135deg, #F0EBE0 0%, #C8B898 100%)',
    icon: 'paw',
    stats: [
      { num: 'Hundreds', label: 'ANIMALS RESCUED' },
      { num: 'Multiple', label: 'PILS FILED &amp; WON' },
      { num: 'Friends of Snakes · Blue Cross', label: 'ALLIED NETWORKS' },
    ],
    objective: "Safeguard the welfare of wild and stray animals.",
    context: "Animal welfare is a significant concern in India, with large stray populations and frequent cruelty cases. This project provides a compassionate and legal framework for animal protection, focusing on systematic rescue, rehabilitation, and advocacy.",
    activities: [
      "Collaboration with established animal welfare groups like Friends of Snakes and Blue Cross.",
      "Implementing humane vaccination, sterilization, and relocation programs for strays.",
      "Filing Public Interest Litigations (PILs) to combat illegal activities like cow slaughter.",
    ],
    impact: "Hundreds of animals have been rescued and rehabilitated, while <strong>legal victories have significantly strengthened</strong> the animal welfare landscape in India.",
    quote: "The puppy was hit by a car on the highway. Six months later she's lying on my office sofa pretending she owns the place. She kind of does.",
    quoteBy: "VOLUNTEER · BLUE CROSS HYD",
    logoImg: 'assets/logo-pawtection.jpg',
  },
  {
    slug: 'we-women-empowerment',
    name: 'WE: Women Empowerment',
    tagline: "Economic dignity. Health awareness. Real autonomy.",
    color: '#C42882',
    logoBg: 'linear-gradient(135deg, #FCE4F0 0%, #F5A8C8 100%)',
    icon: 'woman',
    stats: [
      { num: 'Dual-impact', label: 'LUNCHBOX PROGRAM' },
      { num: 'Multiple', label: 'OIL EXTRACTION UNITS' },
      { num: 'Rural', label: 'MENSTRUAL HYGIENE OUTREACH' },
    ],
    objective: "Empower women through economic opportunities and health education.",
    context: "Economic disparity and lack of health awareness continue to disproportionately affect women below the poverty line. This initiative provides them with the tools for financial independence and addresses critical health issues that are often overlooked.",
    activities: [
      "Raising awareness about menstrual hygiene in rural areas and schools to reduce health risks and school absenteeism.",
      "Establishing income-generating projects, such as oil extraction units, for women.",
      "Operating a dual-impact Lunch Box program that creates jobs for women while providing nutrition for children.",
    ],
    impact: "The project creates <strong>a virtuous cycle of empowerment</strong>, women gain financial autonomy and their children benefit from improved nutrition.",
    quote: "I was the woman who was not supposed to leave the house. Now I run a tailoring shop with three girls who work for me. <em>Three.</em>",
    quoteBy: "MANJULA · 34 · ENTREPRENEUR",
    logoImg: 'assets/logo-we.jpg',
  },
  {
    slug: 'global-human-rights-front',
    name: 'Global Human Rights Front',
    tagline: "Defending rights. Defying silence.",
    color: '#2563A8',
    logoBg: 'linear-gradient(135deg, #E0EBF8 0%, #A8C4E0 100%)',
    icon: 'shield',
    stats: [
      { num: 'Dozens', label: 'LANDMARK CASES' },
      { num: 'Pro bono', label: 'ALWAYS' },
      { num: 'Volunteer', label: 'ADVOCATE NETWORK' },
    ],
    objective: "Provide pro bono legal support to victims of human rights violations.",
    context: "Access to justice is often a privilege, not a right, for the marginalized. This project ensures that the vulnerable have legal representation by leveraging a network of volunteer advocates, giving a voice to those who have been silenced.",
    activities: [
      "Offering free legal services through a network of committed advocates.",
      "Taking on sensitive cases involving student suicides, custodial torture, and child abuse.",
    ],
    impact: "<strong>Dozens of landmark cases</strong> have been successfully resolved, ensuring that justice and dignity are upheld for the oppressed.",
    quote: "They didn't tell me to stop crying. They told me to write down everything I remembered. That's the difference.",
    quoteBy: "SURVIVOR · CASE 117",
    logoImg: 'assets/logo-ghr.jpg',
  },
  {
    slug: 'cross-connect-legal-aid',
    name: 'Cross Connect Legal Aid',
    tagline: "From immigration to reconciliation, we stand with you.",
    color: '#2A2A2A',
    logoBg: 'linear-gradient(135deg, #ECEAE3 0%, #B8B4AE 100%)',
    icon: 'globe',
    stats: [
      { num: 'Since 2014', label: 'ACTIVE' },
      { num: 'India · UK', label: 'CORRIDORS' },
      { num: 'Dozens', label: 'FAMILIES SUPPORTED' },
    ],
    objective: "Provide legal and humanitarian support to the Indian diaspora.",
    context: "The large Indian diaspora, particularly students and NRIs, often faces unique challenges abroad related to immigration, family, and legal matters. This project acts as a vital support system, providing guidance and emergency assistance to those far from home.",
    activities: [
      "Offering guidance on family, immigration, and legal issues in the UK.",
      "Providing emergency support through crowdfunding, repatriation, and medical aid.",
      "Assisting students with finding part-time jobs and suitable accommodation abroad.",
    ],
    impact: "Active since 2014, the project has supported <strong>dozens of families and students</strong>, fostering a sense of security and community for Indians abroad.",
    quote: "When my visa was rejected at Heathrow, I had three numbers on me. Theirs was the only one that picked up. By the next morning I had a lawyer.",
    quoteBy: "STUDENT · MANCHESTER",
    logoImg: 'assets/logo-cross-connect.jpg',
  },
  {
    slug: 'dreamcatchers',
    name: 'DreamCatchers',
    tagline: "From dreams to reality.",
    color: '#1E3A6F',
    logoBg: 'linear-gradient(135deg, #FFE8E0 0%, #FFB8A0 100%)',
    icon: 'star',
    stats: [
      { num: 'Hundreds', label: 'CHILDREN INSPIRED' },
      { num: 'Multiple', label: 'ACTING ROLES SECURED' },
      { num: 'Higher Ed', label: 'PIPELINE BUILT' },
    ],
    objective: "Support orphaned and underprivileged children in fulfilling their dreams.",
    context: "The lack of opportunities for many children living in poverty can perpetuate a cycle of hardship. This project goes beyond basic needs, providing mentorship and unique opportunities that inspire and guide children toward brighter futures.",
    activities: [
      "Organizing festival celebrations, trips, and distributing essentials.",
      "Creating unique opportunities, such as acting roles in movies, to boost confidence and open new doors.",
      "Providing support for higher education and career development, including assistance with applications, overseas accommodation, and opportunities in sports advancement.",
    ],
    impact: "Hundreds of children have been inspired and nurtured, receiving the <strong>guidance needed to pursue their dreams</strong>.",
    quote: "The first time I saw my face on a movie poster, I called the home and asked them to print one. It's still on the wall.",
    quoteBy: "RAVI · 17 · DREAMCATCHER ALUM",
    logoImg: 'assets/logo-dreamcatchers.jpg',
  },
  {
    slug: 'launchpad',
    name: 'Launchpad',
    tagline: "First job. First salary. First step.",
    color: '#1E3A6F',
    logoBg: 'linear-gradient(135deg, #E0EAF7 0%, #A0BCD8 100%)',
    icon: 'rocket',
    stats: [
      { num: '500+', label: 'YOUTH PLACED' },
      { num: '40+', label: 'HIRING PARTNERS' },
      { num: 'Pan-India', label: 'PLACEMENT REACH' },
    ],
    objective: "Bridge the gap between underprivileged youth and their first meaningful job.",
    context: "India produces millions of degree-holding graduates every year, but a vast number from low-income families are locked out of professional careers because they lack networks, interview skills, soft-skills training, and access to hiring managers. Launchpad closes that gap with a structured pipeline: skill mapping, mock interviews, employer matchmaking, and post-placement support during the critical first 90 days on the job.",
    activities: [
      "Career counselling and skill assessments for first-generation working professionals.",
      "Mock interviews, resume reviews, and soft-skills bootcamps run by industry volunteers.",
      "Direct hiring partnerships with 40+ companies across IT services, healthcare, retail, and manufacturing.",
      "Post-placement mentorship and grievance support for the first 90 days of employment.",
    ],
    impact: "Over <strong>500 first-generation professionals</strong> have moved from uncertain underemployment into salaried roles, breaking generational poverty cycles in their families.",
    quote: "I am the first in my family to earn a salary that does not come from a daily-wage book. Launchpad mocked my interview seven times before I cracked TCS.",
    quoteBy: "PRIYA · 22 · TCS HYDERABAD",
    logoImg: 'assets/bthechange-logo.png',
  },
  {
    slug: 'lawgic',
    name: 'L.A.W.G.I.C.',
    tagline: "Free legal aid for those the system forgets.",
    color: '#1E3A6F',
    logoBg: 'linear-gradient(135deg, #F0EDE5 0%, #D9D2BE 100%)',
    icon: 'scales',
    stats: [
      { num: '1,200+', label: 'CASES SUPPORTED' },
      { num: '60+', label: 'PRO-BONO LAWYERS' },
      { num: '0', label: 'FEE TO BENEFICIARY' },
    ],
    objective: "Provide free legal aid and rights awareness to people who cannot afford a lawyer.",
    context: "In India, thousands of citizens — especially women, daily-wage workers, and rural communities — never approach the legal system because they cannot afford a lawyer or do not know their rights. L.A.W.G.I.C. operates a network of pro-bono advocates who take on civil, family, labour, and rights matters at no cost to the beneficiary, while running awareness clinics in slums, schools, and panchayats to demystify the law itself.",
    activities: [
      "Pro-bono representation in civil, family, labour, and constitutional matters across Telangana courts.",
      "Weekly legal-aid clinics in underserved neighbourhoods with walk-in case intake.",
      "Rights-awareness workshops for women, students, daily-wage workers, and senior citizens.",
      "Document drafting assistance: wills, affidavits, complaints, RTI applications, all free of charge.",
    ],
    impact: "Over <strong>1,200 cases supported</strong> with full legal representation at zero cost. Most clients had never previously approached a court because they assumed the system was not for people like them.",
    quote: "I had been threatened by my landlord for two years before someone told me about L.A.W.G.I.C. Within a month I had a stay order. I still don't know how to thank them.",
    quoteBy: "MEENA · 38 · DAILY-WAGE WORKER, KARMANGHAT",
    logoImg: 'assets/bthechange-logo.png',
  },
];

// ============= ICON SVGs =============
const ICONS = {
  monitor: '<path d="M2 6h20v12H2z"/><path d="M8 22h8M12 18v4"/><circle cx="7" cy="11" r="0.5" fill="currentColor"/>',
  spark:   '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3"/>',
  heart:   '<path d="M19 14c1.5-3 3-4 3-7 0-3-3-5-5-5s-3 1-5 3c-2-2-3-3-5-3S2 4 2 7c0 3 1.5 4 3 7l7 8z"/>',
  leaf:    '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.5c1.4 9.4-1.4 14.5-8.2 17.5z"/><path d="M2 21c4-2 8-4 14-12"/>',
  paw:     '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><circle cx="7" cy="9" r="2"/><path d="M11 12c-2 0-4 1-4 3s1 4 4 5 7-1 7-4-1-4-7-4z"/>',
  woman:   '<circle cx="12" cy="6" r="3"/><path d="M9 9l-2 8h3l-1 5h4l-1-5h3l-2-8"/>',
  shield:  '<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"/><path d="M9 12l2 2 4-4"/>',
  globe:   '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
  star:    '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77 5.82 21l1.18-6.88L2 9.27l6.91-1.01L12 2z"/>',
  rocket:  '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  scales:  '<path d="M16 16h6l-3-7z"/><path d="M2 16h6l-3-7z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M12 7H5l3-3 4 3"/><path d="M19 9 16 7l3-3"/>',
};

const iconSvg = (name, size = 28) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.spark}</svg>`;

// ============= TEAM DATA =============
const TEAM = [
  {
    slug: 'ram-challa',
    name: 'Sri Ram Kalyan Challa',
    shortName: 'Ram Challa',
    role: 'Founder & President',
    image: 'assets/founder.jpg',
    kicker: "FOUNDER'S NOTE · RAM CHALLA",
    headline: 'It started with <em>one</em> question.',
    bioShort: [
      `<strong>Ram Challa</strong>, founder of B The Change Welfare Society, has spent two decades doing one thing extraordinarily well: showing up. A practising <strong>lawyer and UK Solicitor</strong>, he has filed PILs that protected forests, built classrooms that taught a generation Python, and stood with families across India and the UK. <a href="about.html" class="inline-link">Know work →</a>`,
    ],
    bio: [
      `"What if we just started?" In 2006, that question, and a single laptop, became the seed of what is now nine programs across India and the UK. No grand launch. No press. Just one classroom, then ten, then a thousand.`,
      `<strong>Ram Challa</strong>, founder of B The Change Welfare Society, has spent the past two decades doing one thing extraordinarily well: showing up. Twenty years of consecutive grassroots work, 9 programs, 200,000+ lives touched, two countries.`,
      `A practising <strong>lawyer and UK Solicitor</strong> by profession, Ram brings a rare double discipline: the rigour of advocacy and the patience of community work. He has filed PILs that protected entire forests, built classrooms that taught a generation Python, and quietly stood with families across India and the UK who had nowhere else to turn.`,
    ],
    quote: '"We were never going to be the loudest. We just decided we\'d be the ones still here in twenty years. Most things change when you simply don\'t leave."',
    quoteBy: 'RAM CHALLA · FOUNDER & PRESIDENT',
    pills: [
      '20 YEARS · UNBROKEN GROUNDWORK',
      'LAWYER · UK SOLICITOR',
      '9 PROGRAMS · 2 COUNTRIES',
    ],
  },
  {
    slug: 'rohan-rajkulkarni',
    name: 'Rohan Rajkulkarni',
    shortName: 'Rohan',
    role: 'Working President',
    image: 'assets/rohan.jpg',
    kicker: 'WORKING PRESIDENT',
    headline: 'Every program runs through <em>young people</em>.',
    bioShort: [
      `Rohan leads the Youth &amp; Education portfolio across all nine programs. An <strong>MBA from IIM Kozhikode</strong> and a <strong>law graduate from NALSAR Hyderabad</strong>, he has spent the last decade in public service, mostly inside classrooms, panchayat halls, and the back rooms of state-level education reform. <a href="about.html" class="inline-link">Know work →</a>`,
    ],
    bio: [
      `Rohan leads the Youth &amp; Education portfolio across all nine programs. An <strong>MBA from IIM Kozhikode</strong> and a <strong>law graduate from NALSAR Hyderabad</strong>, he has spent the last decade in public service, most of it inside classrooms, panchayat halls, and the back rooms of state-level education reform.`,
      `His conviction is simple: every program at B The Change either flows through young people, or it fails. Coding on Wheels reaches the children. Changemakers trains the next generation of grassroots leaders. Cross Connect Legal Aid pairs law students with the cases that build advocates. He sees the threads. He pulls them tight.`,
      `Before stepping into the Working President role, Rohan worked on policy frameworks for school dropout prevention in three Indian states, advised CSR teams on the difference between activity and outcome, and spent eighteen months in a small panchayat in northern Andhra to understand what "last-mile education" actually means when the road runs out two villages before the school.`,
    ],
    quote: '"You don\'t build a country by waiting for the next election. You build it one classroom, one panchayat, one Saturday at a time."',
    quoteBy: 'ROHAN RAJKULKARNI · WORKING PRESIDENT',
    pills: [
      'IIM KOZHIKODE · MBA',
      'NALSAR HYDERABAD · LAW',
      '10 YEARS · PUBLIC SERVICE',
    ],
  },
];

// ============= ORG DATA =============
const ORG = {
  founded: 2006,
  regNo: '1538/2015',
  darpanId: 'TS/2023/0380583',
  bank: { name: 'Axis Bank', branch: 'Champapet, Hyderabad', acc: '916010023113616', ifsc: 'UTIB0001305' },
  email: 'support@bthechange.in',
  phone: '+91 90009 35898',
  whatsapp: '919000935898',
  whatsappDisplay: '+91 90009 35898',
  whatsapp2: '917386917770',
  whatsapp2Display: '+91 73869 17770',
  address: 'Rd Number 2, Visaka Nagar, Almasguda, Hyderabad, Telangana 500112',
  addressShort: 'Almasguda, Hyderabad · Telangana 500112',
  mapUrl: 'https://share.google/wMmcZ4BGYnMA3Ulfx',
  techPartner: 'Microsoft',
};

// WhatsApp deep-link helper, takes optional number override (for the second admin)
const waLink = (msg = '', number = ORG.whatsapp) => msg
  ? `https://wa.me/${number}?text=${encodeURIComponent(msg)}`
  : `https://wa.me/${number}`;

const TIERS = [
  { name: 'Legacy Patron',     amt: '5,00,000', tagline: 'Leadership. Ownership. Maximum visibility.', icon: 'crown' },
  { name: 'Premier Partner',   amt: '3,50,000', tagline: 'Strategic presence. High visibility.',        icon: 'star'  },
  { name: 'Impact Partner',    amt: '2,00,000', tagline: 'Focused impact. Credible visibility.',        icon: 'target'},
  { name: 'Community Partner', amt: '1,00,000', tagline: 'Grassroots connection. Meaningful support.',  icon: 'hands' },
];

const TIER_ICONS = {
  crown:  '<path d="M2 18h20l-2-12-5 4-5-7-5 7-5-4z"/>',
  star:   ICONS.star,
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
  hands:  '<path d="M3 11l3 3 6-6 6 6 3-3M3 17l3 3 6-6 6 6 3-3"/>',
};

console.log('Generating site to', OUT);
console.log('Programs:', PROGRAMS.length);

// Stash data + helpers globally for templates
module.exports = { PROGRAMS, ORG, TIERS, TEAM, ICONS, TIER_ICONS, iconSvg, waLink, OUT };
