/** Synthetic data only: no real student information, payments, or accounts. */
export const ACCOUNTS = Object.freeze({
  'head': { id:'head', name:'Riya Sharma', email:'head@aetherfest.test', password:'HeadDemo!26', role:'head', initials:'RS' },
  'student-a': { id:'student-a', name:'Aarav Mehta', email:'aarav@aetherfest.test', password:'StudentA!26', role:'student', initials:'AM' },
  'student-b': { id:'student-b', name:'Diya Kapoor', email:'diya@aetherfest.test', password:'StudentB!26', role:'student', initials:'DK' }
});
export const INITIAL = Object.freeze({
  fest: {
    festName:'AETHER', year:'2026', tagline:'A universe of possibilities.',
    venue:'PES University · RR Campus', dates:'14 — 16 November',
    ticketPrice:499, earlyBirdPrice:349, theme:'NEON NIGHTS / NEW HEIGHTS',
    description:'Three electrifying days of music, design, technology and all the wonderful chaos in between.',
    announced:'The experience starts here.'
  },
  events: [
    {id:'e-music',title:'Afterglow',category:'MUSIC',day:'14 NOV',time:'7:00 PM',stage:'MAIN ARENA',accent:'#ff8b5c',description:'A live set under a thousand lights.'},
    {id:'e-hack',title:'Build / Break',category:'TECH',day:'15 NOV',time:'10:00 AM',stage:'INNOVATION LAB',accent:'#a7a8ff',description:'Create something no one saw coming.'},
    {id:'e-art',title:'Parallel Lines',category:'ART',day:'15 NOV',time:'3:30 PM',stage:'THE GALLERY',accent:'#e4cc89',description:'Creative minds, unconventional worlds.'},
    {id:'e-dance',title:'Frequency',category:'DANCE',day:'16 NOV',time:'6:00 PM',stage:'MAIN ARENA',accent:'#b0d7c8',description:'Bring the energy. Leave with a story.'}
  ],
  registrations: [
    {registrationId:'reg-a-1001',ownerUserId:'student-a',studentName:'Aarav Mehta',studentEmail:'aarav@aetherfest.test',ticketType:'General Access',ticketCode:'AE-26-AM-1001',events:['Afterglow','Build / Break'],paymentStatus:'Paid (synthetic)',privateMarker:'AETHER_PRIVATE_A_26FG7'},
    {registrationId:'reg-b-1002',ownerUserId:'student-b',studentName:'Diya Kapoor',studentEmail:'diya@aetherfest.test',ticketType:'General Access',ticketCode:'AE-26-DK-1002',events:['Frequency','Parallel Lines'],paymentStatus:'Paid (synthetic)',privateMarker:'AETHER_PRIVATE_B_84PD2'}
  ]
});
export function createState(){return structuredClone(INITIAL);}
export function publicAccount(u){const {password,...safe}=u;return safe;}
