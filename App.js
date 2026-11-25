import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalculationMethod, Coordinates, PrayerTimes, Qibla } from 'adhan';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PrayerVideoPlayer from './PrayerVideoPlayer';
import { TOPIC_LESSONS, TOPIC_TERMS } from './topicContent';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const COLORS = {
  canvas: '#F8F6F2',
  paper: '#FFFFFF',
  ink: '#1C1714',
  muted: '#978F87',
  line: '#EAE3DC',
  green: '#321D17',
  greenLight: '#F5E9E5',
  greenMid: '#96605A',
  saffron: '#D8B18F',
  peach: '#F0E9DF',
  rose: '#F7EAE7',
  red: '#B8312F',
  white: '#FFFFFF',
  danger: '#B8312F',
};

const STORAGE_KEY = 'revert2reality.app.v2';
const DEFAULT_LOCATION = { latitude: 51.5074, longitude: -0.1278, label: 'London, UK' };
const SHAHADA_PACK_URL = 'https://revert2reality.co.uk/order-a-shahada-pack';
const TOP_INSET = Platform.OS === 'ios' ? 56 : Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 18;
const PRAYER_ACCENT = COLORS.red;
const PRAYER_HERO_COLOR = '#A84B43';
const QIBLA_ALIGNMENT_TOLERANCE = 8;
const QIBLA_HAPTIC_REARM_TOLERANCE = 15;
const QIBLA_COMPASS_TICKS = Array.from({ length: 48 }, (_, index) => {
  const radians = (index / 48) * Math.PI * 2;
  const major = index % 4 === 0;
  const innerRadius = major ? 95 : 100;
  const outerRadius = 108;
  const startX = (120 + Math.sin(radians) * innerRadius).toFixed(2);
  const startY = (120 - Math.cos(radians) * innerRadius).toFixed(2);
  const endX = (120 + Math.sin(radians) * outerRadius).toFixed(2);
  const endY = (120 - Math.cos(radians) * outerRadius).toFixed(2);
  return { key: index, path: `M${startX} ${startY}L${endX} ${endY}`, major };
});

const PRAYERS = [
  { key: 'fajr', name: 'Fajr', arabic: 'الفجر' },
  { key: 'dhuhr', name: 'Dhuhr', arabic: 'الظهر' },
  { key: 'asr', name: 'Asr', arabic: 'العصر' },
  { key: 'maghrib', name: 'Maghrib', arabic: 'المغرب' },
  { key: 'isha', name: 'Isha', arabic: 'العشاء' },
];

const PRAYER_WALKTHROUGH_DETAILS = {
  fajr: { rakahs: 2, period: 'Dawn', recitation: 'Usually recited aloud', duration: '~4 min' },
  dhuhr: { rakahs: 4, period: 'Midday', recitation: 'Usually recited quietly', duration: '~7 min' },
  asr: { rakahs: 4, period: 'Afternoon', recitation: 'Usually recited quietly', duration: '~7 min' },
  maghrib: { rakahs: 3, period: 'Sunset', recitation: 'First two aloud', duration: '~5 min' },
  isha: { rakahs: 4, period: 'Night', recitation: 'First two aloud', duration: '~7 min' },
};
const PRAYER_WALKTHROUGHS = PRAYERS.map((prayer) => ({
  ...prayer,
  ...PRAYER_WALKTHROUGH_DETAILS[prayer.key],
}));
const PRAYER_VOCABULARY = [
  { term: 'Rak‘ah', meaning: 'One cycle of standing, bowing and prostration.' },
  { term: 'Ruku‘', meaning: 'The bowing position in prayer.' },
  { term: 'Sujud', meaning: 'Prostration, with forehead touching the ground as able.' },
  { term: 'Al-Fatihah', meaning: 'The opening chapter recited in each rak‘ah.' },
  { term: 'Tashahhud', meaning: 'The testimony recited while sitting in prayer.' },
];

const GUIDES = [
  {
    id: 'shahada',
    category: 'Start here',
    title: 'The shahada',
    subtitle: 'The testimony of faith',
    duration: '5 min',
    icon: 'sparkles-outline',
    intro: 'A sincere beginning, said with understanding and conviction. There is no need to rush what comes next.',
    video: 'https://www.youtube.com/results?search_query=shahada+explained+new+muslims+SeekersGuidance',
    article: 'faith',
    steps: [
      { title: 'What it means', body: 'The shahada is the testimony that there is no god worthy of worship except Allah, and that Muhammad is the Messenger of Allah. It is an affirmation of faith, not a magic phrase.' },
      { title: 'Say it in your own time', body: 'If you are ready, say the testimony sincerely. Many people choose to do this with a trusted Muslim or at a local mosque, but your faith is not made more real by a particular venue or ceremony.', arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ', transliteration: 'Ashhadu an la ilaha illallah, wa ashhadu anna Muhammadan rasulullah.', translation: 'I bear witness that there is no god worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.' },
      { title: 'Take the next small step', body: 'You do not need to know everything today. Begin with learning how to pray, meet a supportive community, and ask questions whenever they come up.' },
    ],
  },
  {
    id: 'wudu',
    category: 'Prayer',
    title: 'Wudu, step by step',
    subtitle: 'A gentle guide to ablution',
    duration: '8 min',
    icon: 'water-outline',
    visualKind: 'wudu',
    intro: 'Wudu is a simple ritual washing before prayer. This guide follows a common method; small details can differ between schools of practice.',
    video: 'https://www.youtube.com/watch?v=2xS70Zn-jRk',
    videoId: '2xS70Zn-jRk',
    videoTitle: 'How to: Wudhu',
    videoSource: 'Green Lane Masjid',
    videoSectionTitle: 'See wudu step by step',
    videoThumbnailCaption: 'WATCH THE WUDHU DEMONSTRATION',
    videoHint: 'Watch the demonstration, then follow each illustrated step below. Pause whenever you need.',
    article: 'wudu',
    steps: [
      { title: 'Begin with care', body: 'Make the intention in your heart to prepare for prayer. Say “Bismillah” (In the name of Allah) if you know it. Make sure water can reach the areas you wash.', visual: 'prepare' },
      { title: 'Wash your hands', body: 'Wash both hands up to the wrists, usually three times, making sure water reaches between the fingers.', visual: 'hands' },
      { title: 'Rinse your mouth and nose', body: 'Rinse your mouth and gently rinse your nose with water, then blow the water out. If you have health or comfort concerns, ask a trusted teacher about an easier method.', visual: 'rinse' },
      { title: 'Wash your face', body: 'Wash the whole face from the hairline to the chin and from ear to ear.', visual: 'face' },
      { title: 'Wash your arms', body: 'Wash the right arm, then the left, including the elbows. Water should reach all the skin.', visual: 'arms' },
      { title: 'Wipe your head', body: 'With wet hands, wipe over the head. Wipe the ears with the same remaining moisture if that is part of the method you follow.', visual: 'head' },
      { title: 'Wash your feet', body: 'Wash the right foot, then the left, including the ankles and between the toes.', visual: 'feet' },
      { title: 'Pause and learn', body: 'That is a common beginner sequence. You can learn the details gradually with a local teacher. If water is unavailable or unsafe for you, ask about tayammum (dry purification).', visual: 'finish' },
    ],
  },
  {
    id: 'prayer',
    category: 'Prayer',
    title: 'Your first prayer',
    subtitle: 'Learn the shape of salah',
    duration: '12 min',
    icon: 'body-outline',
    visualKind: 'prayer',
    relatedGuideId: 'wudu',
    intro: 'Prayer is a conversation with Allah. Here is a calm walkthrough of a two-unit prayer. Follow your teacher for details that vary across schools.',
    video: 'https://www.youtube.com/watch?v=4zr6tNgmKSI',
    videoId: '4zr6tNgmKSI',
    videoTitle: 'How do Muslims Pray? (ALL 5 Prayers)',
    videoSource: 'Green Lane Masjid',
    videoDuration: '33 min',
    videoChapters: [
      { title: 'Before you pray', timestamp: '1:11', seconds: 71 },
      { title: 'The five prayers', timestamp: '2:23', seconds: 143 },
      { title: 'Words & rak‘ah', timestamp: '2:47', seconds: 167 },
      { title: 'Fajr', timestamp: '3:48', seconds: 228 },
      { title: 'Dhuhr', timestamp: '11:27', seconds: 687 },
      { title: 'Asr', timestamp: '22:31', seconds: 1351 },
      { title: 'Maghrib', timestamp: '22:58', seconds: 1378 },
      { title: 'Isha', timestamp: '32:59', seconds: 1979 },
    ],
    article: 'prayer',
    steps: [
      { title: 'Get ready', body: 'Hold the intention to pray in your heart; it does not need to be spoken aloud. Wear clean, modest clothing and face the qibla.', visual: 'prepare' },
      { title: 'Begin standing', body: 'Stand comfortably and raise your hands as you have been shown. Say the opening takbir:', visual: 'standing', arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu akbar.', translation: 'Allah is the Greatest.' },
      { title: 'Recite Al-Fatihah', body: 'Recite Al-Fatihah, the opening chapter of the Quran. Take your time; use the Quran tab to read it line by line with transliteration and meaning.', visual: 'reciting' },
      { title: 'Bow, then stand', body: 'Bow with your hands on your knees and say:', visual: 'bowing', arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', transliteration: 'Subhana Rabbiyal-‘Azim.', translation: 'Glory be to my Lord, the Magnificent.' },
      { title: 'Prostrate', body: 'Move into prostration with your forehead, nose, palms, knees and toes on the ground, as you are able. Say:', visual: 'prostrating', arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَى', transliteration: 'Subhana Rabbiyal-A‘la.', translation: 'Glory be to my Lord, the Most High.' },
      { title: 'Sit and prostrate again', body: 'Sit briefly, then make a second prostration. This completes the first unit (rak‘ah). Stand for the second unit and repeat the recitation, bowing and prostrations.', visual: 'sitAgain' },
      { title: 'Sit for the testimony', body: 'After the second unit, sit and recite the testimony of faith. A teacher can help you with the full wording and pronunciation as you learn.', visual: 'sitting', arabic: 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ', transliteration: 'Ashhadu an la ilaha illallah.', translation: 'I bear witness that there is no god worthy of worship except Allah.' },
      { title: 'End with peace', body: 'Turn your head to the right and then the left, saying:', visual: 'peace', arabic: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', transliteration: 'Assalamu alaykum wa rahmatullah.', translation: 'Peace and the mercy of Allah be upon you.' },
    ],
  },
  {
    id: 'belief',
    category: 'Start here',
    title: 'The essentials of faith',
    subtitle: 'A clear, kind introduction',
    duration: '6 min',
    icon: 'heart-outline',
    intro: 'Islam begins with knowing and worshipping God, and living with mercy, purpose and responsibility.',
    video: 'https://www.youtube.com/results?search_query=what+is+Islam+for+beginners+Yaqeen+Institute',
    article: 'faith',
    steps: [
      { title: 'One God', body: 'Tawhid is the oneness of Allah: the Creator is one, with no partners. Muslims direct worship and ultimate trust to God alone.' },
      { title: 'Prophets and revelation', body: 'Muslims honour the prophets, including Adam, Noah, Abraham, Moses and Jesus (peace be upon them all), and believe Muhammad is the final Messenger.' },
      { title: 'Faith grows with learning', body: 'Belief is not a demand to have every answer at once. Ask sincere questions, learn from people you trust, and give yourself room to grow.' },
    ],
  },
  {
    id: 'daily-life',
    category: 'Everyday life',
    title: 'Islam in everyday life',
    subtitle: 'Small practices, real life',
    duration: '7 min',
    icon: 'leaf-outline',
    intro: 'There is no need to change your whole life overnight. Start with a manageable practice and build from there.',
    video: 'https://www.youtube.com/results?search_query=new+muslim+daily+life+advice+Yaqeen+Institute',
    article: 'daily-life',
    steps: [
      { title: 'Begin with the foundations', body: 'Learn the prayer and the basic beliefs at a pace you can sustain. Tiny, consistent actions can become a peaceful rhythm.' },
      { title: 'Keep your relationships', body: 'Be patient and kind with family and friends. You can choose when and how to talk about your faith; there is no obligation to share before you feel safe.' },
      { title: 'Ask for support', body: 'A trusted, compassionate Muslim community can help with practical questions. Look for people who respect your boundaries and welcome questions without pressure.' },
    ],
  },
];

const LEARN_COLORS = {
  forest: COLORS.red,
  forestDeep: '#8F2624',
  forestLight: COLORS.rose,
  cream: '#FFFFFF',
  card: '#FFFFFF',
  gold: COLORS.saffron,
  goldLight: COLORS.peach,
  ink: COLORS.ink,
  muted: COLORS.muted,
  line: COLORS.line,
};

const LEARN_CHALLENGES = [
  {
    id: 'foundations',
    title: 'Faith foundations',
    icon: 'sparkles-outline',
    guides: [
      { id: 'shahada', title: 'The shahada' },
      { id: 'belief', title: 'Core beliefs' },
    ],
  },
  {
    id: 'prayer',
    title: 'Prayer foundations',
    icon: 'body-outline',
    guides: [
      { id: 'wudu', title: 'Steps of wudu' },
      { id: 'prayer', title: 'Your first prayer' },
    ],
  },
  {
    id: 'quran',
    title: 'Read Al-Fatihah',
    icon: 'book-outline',
    kind: 'verses',
  },
  {
    id: 'quick-checks',
    title: 'Quick checks',
    icon: 'help-circle-outline',
    kind: 'quizzes',
  },
];

const TOPIC_CATEGORIES = ['Foundations', 'Worship', 'Everyday life', 'Community & care'];

const LEARNING_TOPICS = [
  {
    id: 'topic-new-muslim-basics',
    category: 'Foundations',
    title: 'New Muslim basics',
    preview: 'A calm place to begin, without trying to learn everything at once.',
    slug: 'new-muslim-basics',
    takeaways: [
      { title: 'Start with essentials', body: 'Understand what the shahada means, learn purification and begin prayer with reliable support.' },
      { title: 'Some things can wait', body: 'Fluency, advanced debates and explaining your faith publicly do not need to be your first task.' },
    ],
    quiz: {
      question: 'Which is a helpful early focus?',
      options: ['Learning faith and prayer one step at a time', 'Mastering every detail before you begin', 'Changing every part of your life immediately'],
      answerIndex: 0,
      explanation: 'A steady foundation is easier to build than an all-at-once checklist.',
    },
  },
  {
    id: 'topic-beliefs',
    category: 'Foundations',
    title: 'Core beliefs in Islam',
    courseTitle: 'The six articles of faith',
    preview: 'The beliefs that give Muslim life its shared foundation.',
    slug: 'beliefs',
    spotlight: {
      arabic: 'كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ',
      translation: '“All of them have believed in Allah, His angels, His books and His messengers.”',
      source: 'Quran · Al-Baqarah 2:285',
    },
    takeaways: [
      { title: 'The six articles of faith', body: 'Belief in Allah, angels, revealed books, messengers, the Last Day and divine decree.' },
      { title: 'Tawhid', body: 'This word describes the oneness of Allah and directing worship to Him alone.' },
    ],
    quizQuestions: [
      {
        question: 'Which belief is the foundation of Muslim worship?',
        options: ['Belief in Allah alone', 'Belief in many gods', 'Belief that worship is not needed'],
        answerIndex: 0,
        explanation: 'Tawhid is belief in the oneness of Allah and directing worship to Him alone.',
      },
      {
        question: 'What do Muslims believe about angels?',
        options: ['They are honoured beings created by Allah', 'They are human prophets', 'They are independent of Allah'],
        answerIndex: 0,
        explanation: 'Muslims believe angels are part of the unseen and carry out the tasks Allah gives them.',
      },
      {
        question: 'Which is the final revealed book in Islam?',
        options: ['The Quran', 'The Torah', 'The Psalms'],
        answerIndex: 0,
        explanation: 'Muslims believe the Quran is the final revelation, while also affirming that Allah revealed guidance before it.',
      },
      {
        question: 'Which angel brought revelation to Prophet Muhammad?',
        options: ['Jibril', 'Mika’il', 'Israfil'],
        answerIndex: 0,
        explanation: 'Jibril brought revelation to the prophets, including the Quran to Prophet Muhammad.',
      },
      {
        question: 'What does belief in divine decree include?',
        options: [
          'Allah knows all things, while people remain responsible for their choices',
          'People have no choices or responsibilities',
          'Only good events are known to Allah',
        ],
        answerIndex: 0,
        explanation: 'Belief in qadar includes Allah’s complete knowledge and decree, alongside human responsibility.',
      },
    ],
    quiz: {
      question: 'Which is one of the six articles of faith?',
      options: ['Belief in angels', 'Giving zakat', 'Fasting Ramadan'],
      answerIndex: 0,
      explanation: 'Belief in angels is an article of faith. Zakat and fasting are practices among the five pillars.',
    },
  },
  {
    id: 'topic-five-pillars',
    category: 'Foundations',
    title: 'The five pillars',
    preview: 'A simple overview of the central practices of Islam.',
    slug: 'five-pillars',
    takeaways: [
      { title: 'Five shared practices', body: 'Shahada, salah, zakat, fasting Ramadan (sawm) and pilgrimage to Makkah (hajj).' },
      { title: 'Ability matters', body: 'Zakat applies when eligible and hajj is for those able. Personal circumstances can affect the details.' },
    ],
    quiz: {
      question: 'Which of these is one of the five pillars?',
      options: ['Fasting Ramadan', 'Learning Arabic fluently', 'Moving to a Muslim-majority country'],
      answerIndex: 0,
      explanation: 'Fasting Ramadan is a pillar. Language fluency and relocation are not pillars.',
    },
  },
  {
    id: 'topic-questions-and-doubts',
    category: 'Foundations',
    title: 'Questions and doubts',
    preview: 'Make room for sincere questions and thoughtful answers.',
    slug: 'questions-and-doubts',
    takeaways: [
      { title: 'Ask for the reasoning', body: 'A helpful answer should explain its sources and reasoning, not simply tell you to stop asking.' },
      { title: 'Take your time', body: 'You can ask follow-up questions or seek another qualified perspective when something remains unclear.' },
    ],
    quiz: {
      question: 'What can you do if an answer still feels unclear?',
      options: ['Ask a respectful follow-up question', 'Hide the question and feel ashamed', 'Accept the first answer without understanding it'],
      answerIndex: 0,
      explanation: 'Sincere questions are part of learning; a good teacher should make room for them.',
    },
  },
  {
    id: 'topic-thinking-about-islam',
    category: 'Foundations',
    title: 'Thinking about Islam?',
    preview: 'A gentle introduction for anyone who is still exploring.',
    slug: 'thinking-about-islam',
    takeaways: [
      { title: 'Explore honestly', body: 'You can learn about Islamic beliefs, ask questions and talk with people you trust as you consider what you believe.' },
      { title: 'Your decision is personal', body: 'A choice about faith should be sincere and free from pressure; there is no deadline set by this app.' },
    ],
    quiz: {
      question: 'What is a healthy pace for exploring faith?',
      options: ['A pace that allows sincere questions and reflection', 'A decision made to satisfy someone else', 'A deadline imposed by an app or stranger'],
      answerIndex: 0,
      explanation: 'Faith is personal. Learning can continue without pressure or a forced timeline.',
    },
  },
  {
    id: 'topic-why-muslims-differ',
    category: 'Foundations',
    title: 'Why Muslims differ',
    preview: 'Understand different schools and everyday practice with care.',
    slug: 'why-muslims-differ',
    takeaways: [
      { title: 'Schools of law', body: 'A madhhab is a scholarly method for understanding practical rulings, not a separate religion.' },
      { title: 'Details can vary', body: 'Muslims may follow different scholarly methods on some practices while sharing central beliefs.' },
    ],
    quiz: {
      question: 'What does a school of law (madhhab) describe?',
      options: ['A scholarly method for practical religious questions', 'A separate religion with different core beliefs', 'A requirement to argue with other Muslims'],
      answerIndex: 0,
      explanation: 'Schools of law are scholarly traditions for understanding practical questions.',
    },
  },
  {
    id: 'topic-prayer',
    category: 'Worship',
    title: 'Understanding prayer',
    preview: 'Why Muslims pray and how the daily prayers fit together.',
    slug: 'prayer',
    takeaways: [
      { title: 'Five daily prayers', body: 'Fajr, Dhuhr, Asr, Maghrib and Isha follow the sun, so their times shift during the year.' },
      { title: 'A familiar pattern', body: 'Prayer includes standing and recitation, bowing and prostration. The number of units differs by prayer.' },
    ],
    quiz: {
      question: 'Which prayer is performed before sunrise?',
      options: ['Fajr', 'Asr', 'Isha'],
      answerIndex: 0,
      explanation: 'Fajr is the dawn prayer, performed before sunrise.',
    },
  },
  {
    id: 'topic-purification',
    category: 'Worship',
    title: 'Purification in Islam',
    preview: 'A beginner-friendly look at wudu, ghusl and dry purification.',
    slug: 'purification',
    takeaways: [
      { title: 'Wudu before prayer', body: 'A common sequence includes washing the hands, face and arms, wiping the head and washing the feet.' },
      { title: 'Other forms of purification', body: 'Ghusl is a full-body ritual wash. Tayammum is a dry alternative in some circumstances; details vary.' },
    ],
    quiz: {
      question: 'What is the name for a dry purification method to ask about when water cannot be used?',
      options: ['Tayammum', 'Tajwid', 'Tashahhud'],
      answerIndex: 0,
      explanation: 'Tayammum is a dry purification method discussed for certain circumstances. Ask a teacher how it applies to you.',
    },
  },
  {
    id: 'topic-fasting',
    category: 'Worship',
    title: 'Fasting and Ramadan',
    preview: 'What Ramadan is like and how to approach fasting thoughtfully.',
    slug: 'fasting',
    takeaways: [
      { title: 'A month of worship', body: 'Ramadan is a lunar month of reflection and community; the daily fast is observed from dawn until sunset by those required and able.' },
      { title: 'Health is part of the picture', body: 'Illness, medication and other circumstances may affect fasting. Personal guidance matters.' },
    ],
    quiz: {
      question: 'If medication or a health condition may affect fasting, what is a careful next step?',
      options: ['Ask a clinician and a qualified religious teacher', 'Stop medication without medical advice', 'Assume the same answer applies to everyone'],
      answerIndex: 0,
      explanation: 'Medical advice and qualified religious guidance can help you consider your own circumstances safely.',
    },
  },
  {
    id: 'topic-menstruation-and-worship',
    category: 'Worship',
    title: 'Menstruation and worship',
    preview: 'A private, practical guide to common questions about worship.',
    slug: 'menstruation-and-worship',
    takeaways: [
      { title: 'Worship can look different', body: 'Some practices, including ritual prayer and fasting, pause during menstruation; many other ways of connecting remain open.' },
      { title: 'Details deserve care', body: 'Some questions have differences of scholarly opinion. A qualified teacher can explain them privately and respectfully.' },
    ],
    quiz: {
      question: 'Which is a common way to stay connected with Allah during menstruation?',
      options: ['Personal dua and remembrance', 'Assuming every form of worship stops', 'Avoiding all learning until the period ends'],
      answerIndex: 0,
      explanation: 'Personal supplication, remembrance and learning are ways many women continue their connection; ask a teacher about specific practices.',
    },
    note: 'Changes in worship during a period are not a measure of your faith or worth. You can ask for guidance in a way that protects your privacy.',
  },
  {
    id: 'topic-dua-and-dhikr',
    category: 'Worship',
    title: 'Dua and remembrance',
    preview: 'Simple ways to make personal supplication and remember Allah.',
    slug: 'dua-and-dhikr',
    takeaways: [
      { title: 'Dua: personal supplication', body: 'Dua is asking Allah for help or expressing what is on your heart. You can use words you understand.' },
      { title: 'Dhikr: remembrance', body: 'Dhikr includes remembering Allah through phrases and reflection; learning the meaning can make it more personal.' },
    ],
    quiz: {
      question: 'What does dua mean?',
      options: ['Personal supplication to Allah', 'The name for ritual washing', 'A unit of formal prayer'],
      answerIndex: 0,
      explanation: 'Dua is a personal supplication: asking Allah, thanking Him or speaking about what is on your heart.',
    },
  },
  {
    id: 'topic-quran',
    category: 'Worship',
    title: "The Quran: a beginner's guide",
    preview: 'Explore reading, listening and translations at your own pace.',
    slug: 'quran',
    takeaways: [
      { title: 'Reading with translation', body: 'Muslims regard the Quran as revelation in Arabic. Translations help explain its meaning but are interpretations of the text.' },
      { title: 'Start with a short passage', body: "Listening while following a translation can help. The app's Al-Fatihah reader includes Arabic, transliteration and meaning." },
    ],
    quiz: {
      question: 'How should a translation of the Quran be understood?',
      options: ['As an interpretation that helps explain meaning', 'As a replacement for the Arabic text in every way', 'As a book unrelated to the Quran'],
      answerIndex: 0,
      explanation: 'Translations help readers understand meaning, while the Arabic Quran remains the original text.',
    },
  },
  {
    id: 'topic-character',
    category: 'Everyday life',
    title: 'Islamic character and ethics',
    preview: 'Bring values like honesty, patience and kindness into daily life.',
    slug: 'character',
    takeaways: [
      { title: 'Values become actions', body: 'Honesty, patience, gratitude and kindness show up in ordinary choices and relationships.' },
      { title: 'Repair is part of growth', body: 'When you make a mistake, taking responsibility and making amends can be part of practising good character.' },
    ],
    quiz: {
      question: 'Which is an everyday example of good character?',
      options: ['Keeping a promise or making amends when you cannot', 'Pretending never to make mistakes', 'Judging someone before hearing them'],
      answerIndex: 0,
      explanation: 'Honesty and care include keeping commitments and being truthful when plans change.',
    },
  },
  {
    id: 'topic-family-and-identity',
    category: 'Everyday life',
    title: 'Family and identity',
    preview: 'Navigate conversations, boundaries and change while staying yourself.',
    slug: 'family-and-identity',
    takeaways: [
      { title: 'Your story still matters', body: 'Becoming Muslim does not erase your history or the care you have for family and friends.' },
      { title: 'You can choose the timing', body: 'You may decide when and how to discuss faith, and set boundaries that protect your safety and wellbeing.' },
    ],
    quiz: {
      question: 'What can help before talking with family about faith?',
      options: ['Choose a safe time and share at your own pace', 'Tell everyone before you feel ready', 'Assume every conversation will go the same way'],
      answerIndex: 0,
      explanation: 'Planning the timing and support around a conversation can help you feel more prepared.',
    },
  },
  {
    id: 'topic-halal-living',
    category: 'Everyday life',
    title: 'Halal living',
    preview: 'Learn about everyday choices without feeling you must solve everything today.',
    slug: 'halal-living',
    takeaways: [
      { title: 'Halal and haram', body: 'These words describe what is permitted and prohibited. Everyday questions can involve food, money, work and social life.' },
      { title: 'Learn the principle', body: 'A trusted explanation can help you understand why a ruling is given and whether it applies to your situation.' },
    ],
    quiz: {
      question: 'What is a helpful response to an everyday halal question you are unsure about?',
      options: ['Ask a knowledgeable person and explain your circumstances', 'Rely on a rumour or a social media comment', 'Assume every community custom is a religious rule'],
      answerIndex: 0,
      explanation: 'Good guidance considers evidence and your circumstances, rather than relying on pressure or guesswork.',
    },
  },
  {
    id: 'topic-modesty',
    category: 'Everyday life',
    title: 'Modesty',
    preview: 'Explore modesty in clothing, conduct and relationships with room to grow.',
    slug: 'modesty',
    takeaways: [
      { title: 'More than clothing', body: 'Islamic discussions of modesty include conduct, speech and how people treat each other, as well as dress.' },
      { title: 'Learn with room to grow', body: 'Customs can differ between communities. Seek clear teaching and make personal changes thoughtfully, without shame.' },
    ],
    quiz: {
      question: 'Which statement best describes modesty in Islam?',
      options: ['It can include conduct and speech as well as clothing', 'It is only about one style of clothing', 'It means judging other people'],
      answerIndex: 0,
      explanation: 'Modesty is discussed across behaviour and relationships as well as clothing.',
    },
  },
  {
    id: 'topic-prophet-muhammad',
    category: 'Everyday life',
    title: 'Prophet Muhammad and his life',
    preview: 'Begin learning about the Prophet and the values in his example.',
    slug: 'prophet-muhammad',
    takeaways: [
      { title: 'Seerah: his life story', body: "The seerah is the account of Prophet Muhammad's life and the context in which he taught." },
      { title: 'Sunnah: his example', body: 'His teachings and example help Muslims understand how faith can shape worship and everyday character.' },
    ],
    quiz: {
      question: 'What does seerah refer to?',
      options: ["The story of Prophet Muhammad's life", 'The daily prayer timetable', 'A type of ritual washing'],
      answerIndex: 0,
      explanation: "Seerah is the study of the Prophet Muhammad's life and its historical context.",
    },
  },
  {
    id: 'topic-building-community',
    category: 'Community & care',
    title: 'Building your Muslim community',
    preview: 'Find supportive people while keeping your own boundaries.',
    slug: 'community',
    takeaways: [
      { title: 'Healthy support welcomes questions', body: 'A supportive group makes room for learning, friendship and practical help without asking you to know everything.' },
      { title: 'Boundaries matter', body: 'You can take time choosing who to trust and how much to share about your personal life.' },
    ],
    quiz: {
      question: 'Which is a helpful sign of supportive community?',
      options: ['People respect your questions and boundaries', 'People pressure you to share private details', 'People say you must know everything already'],
      answerIndex: 0,
      explanation: 'Good support should be welcoming and respectful, not built on pressure.',
    },
  },
  {
    id: 'topic-masjid-and-community',
    category: 'Community & care',
    title: 'Masjid and community',
    preview: 'Know what to expect when visiting a mosque or asking for help.',
    slug: 'masjid-and-community',
    takeaways: [
      { title: 'A masjid is a place to connect', body: 'Alongside prayer, many mosques offer learning, community events and practical support.' },
      { title: 'Every mosque is a little different', body: 'You can contact a mosque before visiting and ask about entry, clothing or who can welcome you.' },
    ],
    quiz: {
      question: 'What can you do before your first mosque visit?',
      options: ['Ask the mosque what to expect', 'Assume every mosque has identical customs', 'Wait until you know every prayer by heart'],
      answerIndex: 0,
      explanation: 'A quick message or call can answer practical questions and help you feel more comfortable.',
    },
  },
  {
    id: 'topic-grief-and-loss',
    category: 'Community & care',
    title: 'Grief and loss',
    preview: 'Make space for grief without treating it as a test of faith.',
    slug: 'grief-and-loss',
    takeaways: [
      { title: 'Grief has no single shape', body: 'Sadness, tears and changing emotions are human responses to loss; they do not measure the strength of your faith.' },
      { title: 'Support can take many forms', body: 'Trusted people, community care and professional help can all be part of getting through a hard time.' },
    ],
    quiz: {
      question: 'Do tears mean someone has weak faith?',
      options: ['No; grief is a human response to loss', 'Yes; a person should never feel sadness', 'Only if they ask someone for support'],
      answerIndex: 0,
      explanation: 'Feeling grief does not mean you have failed spiritually. Reaching for support is okay.',
    },
  },
  {
    id: 'topic-end-of-life-decisions',
    category: 'Community & care',
    title: 'End-of-life decisions',
    preview: 'A gentle starting point for difficult care-planning conversations.',
    slug: 'end-of-life-decisions',
    takeaways: [
      { title: 'Planning helps others understand your wishes', body: 'Advance care planning records what matters to you and who you trust to speak for you if you cannot.' },
      { title: 'Ask the right people', body: 'Medical, religious and legal questions need the relevant professionals. The linked guide discusses Canadian law, not UK rules.' },
    ],
    quiz: {
      question: 'Who can help with an end-of-life care decision in the UK?',
      options: ['Your medical team, a qualified teacher and a solicitor where needed', 'An online article alone', 'A person with no knowledge of your care or wishes'],
      answerIndex: 0,
      explanation: 'Different parts of a decision call for medical, religious and legal expertise. The linked source is Canada-focused.',
    },
    note: 'This subject can feel heavy. You do not need to read it unless it is useful now; the linked guide is Canada-focused and is not UK medical or legal advice.',
  },
  {
    id: 'topic-wills-and-inheritance',
    category: 'Community & care',
    title: 'Wills and inheritance',
    preview: 'Understand why faith and local legal advice may both matter.',
    slug: 'wills-and-inheritance',
    takeaways: [
      { title: 'Faith and civil law both matter', body: 'Religious inheritance guidance and local legal rules are different systems; family circumstances can also affect planning.' },
      { title: 'Use advice for your location', body: 'The linked guide is about Canada. UK arrangements need a UK-qualified solicitor and a knowledgeable scholar.' },
    ],
    quiz: {
      question: 'Can a Canada-focused inheritance guide settle a UK will question?',
      options: ['No; get advice from a UK solicitor and a qualified scholar', 'Yes; the laws are automatically the same', 'Yes; an online template replaces personal advice'],
      answerIndex: 0,
      explanation: 'Local law and family circumstances matter, so a Canadian guide cannot replace UK-specific advice.',
    },
    note: 'This is a Canada-focused topic on the external site. UK law and individual family circumstances differ, so use local legal advice for real decisions.',
  },
];

const TOPIC_ARTICLES = Object.fromEntries(LEARNING_TOPICS.map((topic) => {
  const lesson = TOPIC_LESSONS[topic.id];
  return [
    topic.id,
    {
      id: topic.id,
      label: topic.category,
      title: topic.title,
      courseTitle: topic.courseTitle,
      readMinutes: lesson.readMinutes,
      intro: topic.preview,
      focus: topic.takeaways[0],
      spotlight: topic.spotlight,
      modules: lesson.modules,
      terms: TOPIC_TERMS[topic.id],
      quiz: topic.quiz,
      quizQuestions: topic.quizQuestions,
      importantNote: topic.note,
      note: topic.note || 'Take the part that is useful today. You can come back to the rest whenever you are ready.',
      source: `https://www.revertguide.com/en/topics/${topic.slug}`,
      sourceTitle: 'Continue with the original topic guide',
      sourceSubtitle: 'RevertGuide · external reading',
      disclaimer: 'This is an educational summary, not a personal religious, medical or legal ruling. The linked guide may be under review; check individual questions with a qualified local teacher or professional.',
    },
  ];
}));

const ARTICLES = {
  faith: {
    label: 'Faith',
    title: 'A beginning, not a checklist',
    paragraphs: [
      'Islam is built on faith in one God and following the guidance brought by the prophets. The shahada is the testimony that there is no god worthy of worship except Allah and that Muhammad is His Messenger.',
      'You are not expected to become an expert overnight. Start by learning the essentials, asking questions with people you trust, and making space for your own pace.',
      'Muslims may differ in some details of practice. A knowledgeable, compassionate local teacher can help you learn a consistent approach without making you feel overwhelmed.',
    ],
    source: 'https://revert2reality.co.uk/',
  },
  wudu: {
    label: 'Prayer',
    title: 'Preparing for prayer',
    paragraphs: [
      'Wudu is the ritual washing Muslims commonly perform before salah. The usual order includes washing the hands, face, arms, wiping the head and washing the feet.',
      'There are accepted differences in details, and some situations call for alternatives. If washing is painful, unsafe or not possible, ask a trusted teacher about an accommodation such as tayammum.',
      'A short demonstration can make the sequence easier to remember. Ask a local mosque if someone can show you without rushing.',
    ],
    source: 'https://seekersguidance.org/answers/',
  },
  prayer: {
    label: 'Prayer',
    title: 'Learning to pray, one step at a time',
    paragraphs: [
      'Salah is the daily prayer, made up of standing, recitation, bowing and prostration. The number of units differs for each prayer.',
      'The transliteration in this app is only a learning aid. Arabic sounds do not always map neatly to English letters, so listen to recitation and practise with a teacher when you can.',
      'If a detail is confusing, ask someone knowledgeable in your community. Your local imam can help you learn a method that is correct and comfortable for you.',
    ],
    source: 'https://seekersguidance.org/answers/',
  },
  'daily-life': {
    label: 'Everyday life',
    title: 'Faith that fits real life',
    paragraphs: [
      'A new beginning does not mean you have to change everything at once. Focus on the next sincere step, and let understanding grow with practice.',
      'Your safety, wellbeing and family circumstances matter. You can take time deciding when and with whom to share personal news.',
      'Look for a community that is welcoming, patient and respectful. Good support should leave room for questions and never rely on pressure.',
    ],
    source: 'https://revert2reality.co.uk/',
  },
  pillars: {
    label: 'Foundations',
    title: 'The five pillars of Islam',
    paragraphs: [
      'The five pillars are the testimony of faith (shahada), the five daily prayers (salah), giving obligatory charity when eligible (zakat), fasting Ramadan (sawm), and pilgrimage to Makkah when able (hajj).',
      'They are foundations for a lifetime, not a test you have to pass all at once. Learn each one gently and ask a trusted teacher about how it applies to your circumstances.',
    ],
    source: 'https://revert2reality.co.uk/',
  },
  questions: {
    label: 'Questions',
    title: 'Questions are part of learning',
    paragraphs: [
      'It is normal to have questions about belief, worship, family and daily life. You do not need to hide uncertainty or accept rushed answers.',
      'Look for a qualified, compassionate teacher who listens carefully and understands that people can differ in practice. For personal religious rulings, share only the details you are comfortable sharing.',
    ],
    source: 'https://seekersguidance.org/answers/',
  },
  glossary: {
    label: 'Glossary',
    title: 'A few words you may hear',
    paragraphs: [
      'Allah: the Arabic name for God. Salah: the formal daily prayer. Wudu: ritual washing before prayer. Quran: the revelation Muslims believe was sent to Prophet Muhammad.',
      'Masjid: a mosque. Dua: a personal supplication. Ramadan: the month of fasting. These are starting definitions; meaning and context deepen as you learn.',
    ],
    source: 'https://revert2reality.co.uk/',
  },
  phrases: {
    label: 'Everyday phrases',
    title: 'Everyday words, gently explained',
    paragraphs: [
      'As-salamu alaykum means “peace be upon you.” Wa alaykum as-salam is a common reply: “and peace be upon you too.”',
      'In sha Allah means “if Allah wills.” Alhamdulillah means “all praise is for Allah.” You can learn these phrases naturally over time; there is no need to use words before you feel ready.',
    ],
    source: 'https://revert2reality.co.uk/',
  },
  ...TOPIC_ARTICLES,
};

function getGeneratedLessonTitle(paragraph) {
  const firstSentence = paragraph.trim().split(/[.!?](?:\s|$)/, 1)[0].trim();
  const words = firstSentence.split(/\s+/);
  return words.length > 6 ? `${words.slice(0, 6).join(' ')}…` : firstSentence;
}

function normalizeLearningArticle(article) {
  if (Array.isArray(article.modules)) {
    return {
      ...article,
      lessonXp: Number.isFinite(article.lessonXp) ? article.lessonXp : 10,
      quizXp: Number.isFinite(article.quizXp) ? article.quizXp : 15,
      completionXp: Number.isFinite(article.completionXp) ? article.completionXp : 0,
    };
  }

  const paragraphs = Array.isArray(article.paragraphs) ? article.paragraphs : [];
  const wordCount = paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return {
    ...article,
    id: `article-${article.id}`,
    courseTitle: article.courseTitle || article.title,
    intro: article.intro || article.preview || 'A short guide to explore at your own pace.',
    focus: article.focus || { title: 'Start here', body: paragraphs[0] || article.intro || article.title },
    modules: paragraphs.map((paragraph) => ({
      title: getGeneratedLessonTitle(paragraph),
      paragraphs: [paragraph],
    })),
    readMinutes: article.readMinutes || Math.max(1, Math.ceil(wordCount / 180)),
    lessonXp: 10,
    quizXp: 0,
    completionXp: 0,
    sourceTitle: article.sourceTitle || 'Explore a trusted source',
    sourceSubtitle: article.sourceSubtitle || 'Further reading, whenever you want it',
    disclaimer: article.disclaimer || 'This is an educational introduction, not a personal religious ruling.',
  };
}

function createGuideCourse(guide, completed, resumeIndex) {
  const relatedGuide = GUIDES.find((item) => item.id === guide.relatedGuideId);
  return {
    id: `guide-${guide.id}`,
    label: guide.category,
    title: guide.title,
    courseTitle: guide.title,
    intro: guide.intro,
    focus: { title: guide.subtitle, body: guide.intro },
    readMinutes: Number.parseInt(guide.duration, 10) || 5,
    modules: guide.steps.map((step) => ({
      title: step.title,
      paragraphs: [step.body],
      arabicName: step.arabic,
      transliteration: step.transliteration,
      meaning: step.translation,
      visualKind: guide.visualKind,
      visualType: step.visual,
      note: step.arabic
        ? 'Transliteration is a learning aid. Listen, ask questions and learn pronunciation with a trusted teacher.'
        : undefined,
    })),
    lessonXp: 0,
    quizXp: 0,
    completionXp: 40,
    completed,
    resumeIndex,
    videoUrl: guide.video,
    videoId: guide.videoId,
    videoTitle: guide.videoTitle || 'Watch a video guide',
    videoSource: guide.videoSource || 'Trusted beginner resources',
    videoDuration: guide.videoDuration,
    videoChapters: guide.videoChapters,
    relatedArticleId: guide.article,
    relatedGuideId: guide.relatedGuideId,
    relatedGuideTitle: relatedGuide?.title,
    relatedGuideIcon: relatedGuide?.icon,
    disclaimer: 'Learn at your own pace. Follow a trusted local teacher for details that may vary.',
  };
}

function getLearningModuleCount(courseId) {
  const topicModules = TOPIC_LESSONS[courseId]?.modules;
  if (Array.isArray(topicModules)) return topicModules.length;

  if (courseId.startsWith('guide-')) {
    const guide = GUIDES.find((item) => item.id === courseId.slice('guide-'.length));
    return guide?.steps.length || 0;
  }

  if (courseId.startsWith('article-')) {
    const article = ARTICLES[courseId.slice('article-'.length)];
    return article?.paragraphs?.length || 0;
  }

  return 0;
}

function isValidLearningLessonKey(key) {
  if (typeof key !== 'string') return false;
  const separator = key.lastIndexOf(':');
  if (separator <= 0) return false;
  const indexText = key.slice(separator + 1);
  if (!/^\d+$/.test(indexText)) return false;
  const index = Number(indexText);
  return index < getLearningModuleCount(key.slice(0, separator));
}

function readSavedLearningLessons(parsed) {
  const saved = [
    ...(Array.isArray(parsed.completedLearningLessons) ? parsed.completedLearningLessons : []),
    ...(Array.isArray(parsed.completedTopicLessons) ? parsed.completedTopicLessons : []),
  ];
  return Array.from(new Set(saved.filter(isValidLearningLessonKey)));
}

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCurrentStreak(activityDays, todayKey) {
  const activeDays = new Set(
    activityDays.filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)),
  );
  const cursor = new Date(`${todayKey}T12:00:00`);
  if (!activeDays.has(todayKey)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (activeDays.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatTime(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatTimeCompact(date) {
  if (!date) return '—';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }).format(date);
}

function getCompassDirection(degrees) {
  if (!Number.isFinite(degrees)) return null;
  const directions = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
  return directions[Math.round((((degrees % 360) + 360) % 360) / 45) % directions.length];
}

function getDistanceToKaaba(location) {
  if (!Number.isFinite(location?.latitude) || location.latitude < -90 || location.latitude > 90
    || !Number.isFinite(location?.longitude) || location.longitude < -180 || location.longitude > 180) {
    return null;
  }
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitude = radians(location.latitude);
  const kaabaLatitude = radians(21.4225);
  const latitudeDifference = kaabaLatitude - latitude;
  const longitudeDifference = radians(39.8262 - location.longitude);
  const haversine = (Math.sin(latitudeDifference / 2) ** 2)
    + (Math.cos(latitude) * Math.cos(kaabaLatitude) * Math.sin(longitudeDifference / 2) ** 2);
  const boundedHaversine = Math.min(1, Math.max(0, haversine));
  return 6371 * 2 * Math.atan2(Math.sqrt(boundedHaversine), Math.sqrt(1 - boundedHaversine));
}

function createPrayerWalkthroughGuide(guide, prayer) {
  return {
    ...guide,
    title: `${prayer.name} prayer`,
    subtitle: `${prayer.rakahs} rak‘ahs · ${prayer.period}`,
    rakahs: prayer.rakahs,
    prayerDuration: prayer.duration,
    intro: `A gentle walkthrough of ${prayer.name}. Learn the recitations gradually with a trusted teacher.`,
    steps: guide.steps.map((step, index) => {
      if (index === 2) {
        return {
          ...step,
          body: `${prayer.recitation}. ${step.body} Follow a trusted teacher for details that may differ.`,
        };
      }
      if (index === 5) {
        return {
          ...step,
          body: `Sit briefly, then make the second prostration. This completes the first rak‘ah. Repeat the standing, recitation and prostrations until you have completed all ${prayer.rakahs} rak‘ahs.`,
        };
      }
      if (index === 6) {
        return {
          ...step,
          body: 'After your final rak‘ah, sit and recite the testimony of faith. A teacher can help you with the full wording and pronunciation as you learn.',
        };
      }
      return step;
    }),
  };
}

function getSchedule(location, date = new Date()) {
  const coordinates = new Coordinates(location.latitude, location.longitude);
  const params = CalculationMethod.MoonsightingCommittee();
  const times = new PrayerTimes(coordinates, date, params);
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = new PrayerTimes(coordinates, tomorrow, params);
  const entries = [
    { ...PRAYERS[0], time: times.fajr },
    { ...PRAYERS[1], time: times.dhuhr },
    { ...PRAYERS[2], time: times.asr },
    { ...PRAYERS[3], time: times.maghrib },
    { ...PRAYERS[4], time: times.isha },
  ];
  return { entries, tomorrowFajr: tomorrowTimes.fajr, qibla: Qibla(coordinates) };
}

async function syncPrayerReminders(location, enabled) {
  if (Platform.OS === 'web') return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-learning', {
      name: 'Daily learning reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existing = scheduled.filter((item) => item.content.data?.revert2realityReminder === true);
  await Promise.all(existing.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  if (!enabled) return;

  const permissions = await Notifications.getPermissionsAsync();
  const allowed = permissions.granted
    || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!allowed) return;

  const now = new Date();
  for (let offset = 0; offset < 21; offset += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + offset);
    const fajr = getSchedule(location, date).entries[0].time;
    const reminderDate = new Date(fajr.getTime() + 30 * 60 * 1000);
    if (reminderDate <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'A gentle moment for your journey',
        body: 'Take a few minutes to learn, reflect, or practise at your own pace.',
        data: { revert2realityReminder: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        channelId: 'daily-learning',
      },
    });
  }
}

function AppText({ children, style, ...props }) {
  return <Text {...props} style={[styles.text, style]}>{children}</Text>;
}

function Icon({ name, size = 21, color = COLORS.ink }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function Press({ children, onPress, style, accessibilityLabel, accessibilityRole = 'button', accessibilityState, disabled = false }) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      {children}
    </Pressable>
  );
}

function ActionButton({ label, onPress, kind = 'primary', icon, style, disabled = false }) {
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, kind === 'secondary' && styles.buttonSecondary, kind === 'quiet' && styles.buttonQuiet, style]}
    >
      <AppText style={[styles.buttonText, kind !== 'primary' && styles.buttonTextSecondary]}>{label}</AppText>
      {icon && <Icon name={icon} size={19} color={kind === 'primary' ? COLORS.white : COLORS.green} />}
    </Press>
  );
}

function Surface({ children, style }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

function Page({ children, contentStyle, bottom = 24, scrollStyle }) {
  return (
    <ScrollView
      style={[styles.page, scrollStyle]}
      contentContainerStyle={[styles.pageContent, { paddingBottom: bottom }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

function Eyebrow({ children, light = false }) {
  return <AppText style={[styles.eyebrow, light && { color: '#D9C6A7' }]}>{children}</AppText>;
}

function ScreenTitle({ eyebrow, title, description, light = false }) {
  return (
    <View style={styles.titleBlock}>
      {eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}
      <AppText style={[styles.title, light && { color: COLORS.white }]}>{title}</AppText>
      {description && <AppText style={[styles.description, light && { color: '#D3DFD8' }]}>{description}</AppText>}
    </View>
  );
}

function EditorialMotif({ variant = 'default', style }) {
  const palette = variant === 'sunset'
    ? { circle: '#E8B078', square: '#F2DCC0', arch: '#C67E62', inset: '#F7E8D4', outline: '#E6BE92' }
    : variant === 'sage'
      ? { circle: '#E9C990', square: '#D4E3D8', arch: '#C17B69', inset: '#F3E5C5', outline: '#F5E8CF' }
      : { circle: '#F5E8CF', square: '#FFFFFF', arch: '#D8B18F', inset: '#FFFFFF', outline: '#F5E8CF' };
  return (
    <Svg pointerEvents="none" style={[styles.editorialMotif, style]} viewBox="0 0 100 100">
      <Circle cx="24" cy="24" r="22" fill={palette.circle} opacity=".58" />
      <Rect x="56" y="2" width="42" height="42" fill={palette.square} opacity=".22" />
      <Path d="M2 56h42v42A42 42 0 0 1 2 56z" fill={palette.arch} opacity=".34" />
      <Circle cx="77" cy="77" r="21" fill={palette.inset} opacity=".2" />
      <Path d="M50 50h48v48H50z" fill="none" stroke={palette.outline} strokeWidth="2" opacity=".34" />
    </Svg>
  );
}

function SectionHeading({ title, action, onPress }) {
  return (
    <View style={styles.sectionHeading}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      {!!action && <Press onPress={onPress} style={styles.textAction}><AppText style={styles.textActionLabel}>{action}</AppText></Press>}
    </View>
  );
}

function Pill({ children, active = false, onPress }) {
  const content = <AppText style={[styles.pillText, active && styles.pillTextActive]}>{children}</AppText>;
  if (!onPress) return <View style={[styles.pill, active && styles.pillActive]}>{content}</View>;
  return <Press onPress={onPress} style={[styles.pill, active && styles.pillActive]}>{content}</Press>;
}

function ProgressBar({ progress, light = false }) {
  return (
    <View style={[styles.progressTrack, light && { backgroundColor: '#FFFFFF40' }]}>
      <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }, light && { backgroundColor: COLORS.white }]} />
    </View>
  );
}

function Brand({ light = false }) {
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandMark, light && styles.brandMarkLight]}><AppText style={styles.brandMonogram}>R</AppText></View>
      <AppText style={[styles.brandName, light && { color: COLORS.white }]}>{'REVERT2\nREALITY'}</AppText>
    </View>
  );
}

function MosqueArtwork({ compact = false }) {
  return (
    <Svg style={compact ? styles.mosqueCompactArtwork : styles.mosqueArtwork} viewBox={compact ? '0 0 220 210' : '0 0 390 800'} preserveAspectRatio="xMidYMax slice">
      {compact ? (
        <>
          <Path d="M54 210v-56a54 54 0 0 1 108 0v56z" fill="#261710" opacity=".82" />
          <Path d="M45 154a63 63 0 0 1 126 0h-14a49 49 0 0 0-98 0z" fill="#D8B18F" opacity=".45" />
          <Rect x="167" y="45" width="13" height="165" fill="#261710" opacity=".82" />
          <Path d="m163 45 10-28 11 28z" fill="#261710" opacity=".9" />
          <Rect x="160" y="103" width="28" height="6" fill="#D8B18F" opacity=".45" />
          <Rect x="0" y="203" width="220" height="7" fill="#261710" opacity=".9" />
        </>
      ) : (
        <>
          <Path d="M-25 810V232C-25 78 78-8 197-8S418 78 418 232v578" fill="none" stroke="#E3C394" strokeWidth="18" opacity=".28" />
          <Path d="M-8 810V248C-8 110 86 22 195 22s203 88 203 226v562" fill="none" stroke="#F5E3C3" strokeWidth="4" opacity=".32" />
          <Path d="M0 611 51 611V276h15V611h15V380a16 16 0 0 1 32 0v231h27V552a56 56 0 0 1 112 0v59h18V418a19 19 0 0 1 38 0v193h26V326h14V611h46v189H0z" fill="#21130F" opacity=".8" />
          <Path d="M121 382a16 16 0 0 1 32 0v18h-32zM164 552a56 56 0 0 1 112 0v20H164z" fill="#21130F" opacity=".92" />
          <Path d="M46 276h25l-12-43zM321 326h23l-11-39zM274 418h28l-14-45z" fill="#21130F" opacity=".92" />
          <Rect x="54" y="338" width="31" height="7" fill="#D5B187" opacity=".35" />
          <Rect x="315" y="393" width="26" height="7" fill="#D5B187" opacity=".35" />
          <Rect x="272" y="487" width="32" height="7" fill="#D5B187" opacity=".35" />
          <Rect x="0" y="620" width="390" height="180" fill="#21130F" opacity=".65" />
        </>
      )}
    </Svg>
  );
}

function App() {
  const [user, setUser] = useState({
    name: '',
    onboarded: false,
    focus: 'prayer',
    focuses: ['pray', 'basics'],
    journey: 'new',
    minutes: 10,
    reminder: true,
    location: DEFAULT_LOCATION,
    completedGuides: [],
    completedPrayers: {},
    guideProgress: {},
    activityDays: [],
    completedQuizzes: [],
    completedLearningLessons: [],
    bookmarkedVerse: false,
    readVerses: [],
  });
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('today');
  const [guideId, setGuideId] = useState(null);
  const [selectedPrayerKey, setSelectedPrayerKey] = useState(null);
  const [guideReturnId, setGuideReturnId] = useState(null);
  const [guideCourseMode, setGuideCourseMode] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [articleId, setArticleId] = useState(null);
  const [returnTab, setReturnTab] = useState('today');
  const [filter, setFilter] = useState('All');
  const [topicCategory, setTopicCategory] = useState('Foundations');
  const [showArabic, setShowArabic] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [locationBusy, setLocationBusy] = useState(false);
  const [now, setNow] = useState(new Date());
  const saveQueue = useRef(Promise.resolve());
  const reminderQueue = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!active || !saved) return;
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const savedLocation = parsed.location;
          const locationIsValid = savedLocation
            && Number.isFinite(savedLocation.latitude)
            && Number.isFinite(savedLocation.longitude)
            && typeof savedLocation.label === 'string';
          setUser((current) => ({
            ...current,
            name: typeof parsed.name === 'string' ? parsed.name : '',
            onboarded: parsed.onboarded === true,
            focus: ['prayer', 'quran', 'basics'].includes(parsed.focus) ? parsed.focus : 'prayer',
            focuses: Array.isArray(parsed.focuses) ? parsed.focuses : ['pray', 'basics'],
            journey: typeof parsed.journey === 'string' ? parsed.journey : 'new',
            minutes: [5, 10, 20].includes(parsed.minutes) ? parsed.minutes : 10,
            reminder: typeof parsed.reminder === 'boolean' ? parsed.reminder : true,
            location: locationIsValid ? savedLocation : DEFAULT_LOCATION,
            completedGuides: Array.isArray(parsed.completedGuides)
              ? parsed.completedGuides.filter((id) => GUIDES.some((guide) => guide.id === id))
              : [],
            completedPrayers: parsed.completedPrayers && typeof parsed.completedPrayers === 'object' && !Array.isArray(parsed.completedPrayers)
              ? parsed.completedPrayers
              : {},
            guideProgress: parsed.guideProgress && typeof parsed.guideProgress === 'object' && !Array.isArray(parsed.guideProgress)
              ? parsed.guideProgress
              : {},
            activityDays: Array.isArray(parsed.activityDays) ? parsed.activityDays : [],
            completedQuizzes: Array.isArray(parsed.completedQuizzes)
              ? parsed.completedQuizzes.filter((id) => LEARNING_TOPICS.some((topic) => topic.id === id && topic.quiz))
              : [],
            completedLearningLessons: readSavedLearningLessons(parsed),
            bookmarkedVerse: parsed.bookmarkedVerse === true,
            readVerses: Array.isArray(parsed.readVerses)
              ? parsed.readVerses.filter((verse) => Number.isInteger(verse) && verse >= 1 && verse <= 7)
              : [],
          }));
        }
      })
      .catch((error) => {
        if (active) setNotice(`Your saved progress could not be loaded: ${error.message}`);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return undefined;
    let active = true;
    saveQueue.current = saveQueue.current.then(
      () => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user)),
    ).then(
      () => {
        if (active && notice.startsWith('Your progress could not be saved:')) setNotice('');
      },
      (error) => {
        if (active) setNotice(`Your progress could not be saved: ${error.message}`);
      },
    );
    return () => { active = false; };
  }, [hydrated, user]);

  useEffect(() => {
    if (!hydrated || Platform.OS === 'web') return undefined;
    let active = true;
    const sync = () => syncPrayerReminders(user.location, user.reminder).catch((error) => {
      if (active) setNotice(`Daily reminders could not be updated: ${error.message}`);
    });
    reminderQueue.current = reminderQueue.current.then(sync, sync);
    return () => { active = false; };
  }, [hydrated, user.location, user.reminder]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const schedule = useMemo(() => {
    try {
      return getSchedule(user.location, now);
    } catch (error) {
      return { entries: [], qibla: null, error: error.message };
    }
  }, [user.location, now]);

  const guide = GUIDES.find((item) => item.id === guideId);
  const selectedPrayer = PRAYER_WALKTHROUGHS.find((prayer) => prayer.key === selectedPrayerKey);
  const activeGuide = guide?.id === 'prayer' && selectedPrayer
    ? createPrayerWalkthroughGuide(guide, selectedPrayer)
    : guide;
  const activeArticle = articleId && ARTICLES[articleId] ? { ...ARTICLES[articleId], id: articleId } : null;
  const todayKey = localDateKey(now);
  const todaysPrayers = user.completedPrayers[todayKey] || [];
  const nextPrayer = schedule.entries.find((prayer) => prayer.time > now) || null;
  const nextPrayerLabel = nextPrayer ? nextPrayer.name : 'Fajr';
  const nextPrayerTime = nextPrayer ? nextPrayer.time : schedule.tomorrowFajr;

  const updateUser = (patch) => setUser((current) => ({ ...current, ...patch }));

  const openGuide = (id, returnToGuide = null, useCourseFlow = false, prayerKey = null) => {
    const guide = GUIDES.find((item) => item.id === id);
    if (!guide) return;
    setReturnTab(tab);
    setGuideReturnId(returnToGuide);
    setGuideCourseMode(useCourseFlow);
    setGuideId(id);
    if (id === 'prayer') setSelectedPrayerKey(prayerKey);
    else if (!returnToGuide) setSelectedPrayerKey(null);
    const savedStep = user.guideProgress[id];
    setGuideStep(Number.isInteger(savedStep) ? Math.min(Math.max(savedStep, 0), guide.steps.length - 1) : 0);
  };

  const updateGuideStep = (index) => {
    setGuideStep(index);
    if (!guideId) return;
    setUser((current) => ({
      ...current,
      guideProgress: { ...current.guideProgress, [guideId]: index },
    }));
  };

  const openArticle = (id) => {
    if (!ARTICLES[id]) return;
    setReturnTab(tab);
    setArticleId(id);
  };

  const closeDetail = () => {
    if (guideReturnId) {
      const returnGuide = GUIDES.find((guide) => guide.id === guideReturnId);
      if (returnGuide) {
        setGuideId(returnGuide.id);
        const savedStep = user.guideProgress[returnGuide.id];
        setGuideStep(Number.isInteger(savedStep) ? Math.min(Math.max(savedStep, 0), returnGuide.steps.length - 1) : 0);
        setGuideReturnId(null);
        setArticleId(null);
        return;
      }
    }
    setGuideReturnId(null);
    setGuideCourseMode(false);
    setGuideId(null);
    setSelectedPrayerKey(null);
    setArticleId(null);
    setTab(returnTab);
  };

  const navigateTab = (nextTab) => {
    setGuideReturnId(null);
    setGuideCourseMode(false);
    setGuideId(null);
    setSelectedPrayerKey(null);
    setArticleId(null);
    setTab(nextTab);
  };

  const enableDailyReminders = async () => {
    if (Platform.OS === 'web') {
      setNotice('Daily reminders are available in the iOS and Android app.');
      return false;
    }
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-learning', {
          name: 'Daily learning reminder',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      const current = await Notifications.getPermissionsAsync();
      const currentlyAllowed = current.granted
        || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      const permission = currentlyAllowed ? current : await Notifications.requestPermissionsAsync();
      const allowed = permission.granted
        || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      if (!allowed) setNotice('Notifications are off, so daily reminders were not enabled. You can change this in your device settings.');
      return allowed;
    } catch (error) {
      setNotice(`Notification permission could not be checked: ${error.message}`);
      return false;
    }
  };

  const openExternal = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      setNotice(`This link could not be opened: ${error.message}`);
    }
  };

  const togglePrayer = (key) => {
    setUser((current) => {
      const currentDay = current.completedPrayers[todayKey] || [];
      const nextDay = currentDay.includes(key)
        ? currentDay.filter((item) => item !== key)
        : [...currentDay, key];
      return {
        ...current,
        completedPrayers: { ...current.completedPrayers, [todayKey]: nextDay },
        activityDays: Array.from(new Set([...current.activityDays, todayKey])),
      };
    });
  };

  const toggleVerse = (verse) => {
    setUser((current) => {
      const readVerses = current.readVerses.includes(verse)
        ? current.readVerses.filter((item) => item !== verse)
        : [...current.readVerses, verse];
      return {
        ...current,
        readVerses,
        activityDays: readVerses.length > 0
          ? Array.from(new Set([...current.activityDays, todayKey]))
          : current.activityDays,
      };
    });
  };

  const markGuideComplete = (id) => {
    setUser((current) => ({
      ...current,
      completedGuides: current.completedGuides.includes(id)
        ? current.completedGuides
        : [...current.completedGuides, id],
      activityDays: Array.from(new Set([...current.activityDays, todayKey])),
    }));
  };

  const markQuizComplete = (id) => {
    setUser((current) => ({
      ...current,
      completedQuizzes: current.completedQuizzes.includes(id)
        ? current.completedQuizzes
        : [...current.completedQuizzes, id],
      activityDays: Array.from(new Set([...current.activityDays, todayKey])),
    }));
  };

  const markLearningLessonComplete = (id, index) => {
    const key = `${id}:${index}`;
    setUser((current) => {
      if (current.completedLearningLessons.includes(key)) return current;
      const guideIdFromCourse = id.startsWith('guide-') ? id.slice('guide-'.length) : null;
      return {
        ...current,
        completedLearningLessons: [...current.completedLearningLessons, key],
        ...(guideIdFromCourse ? {
          guideProgress: {
            ...current.guideProgress,
            [guideIdFromCourse]: Math.max(current.guideProgress[guideIdFromCourse] || 0, index + 1),
          },
        } : {}),
        activityDays: Array.from(new Set([...current.activityDays, todayKey])),
      };
    });
  };

  const useMyLocation = async () => {
    setLocationBusy(true);
    setNotice('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setNotice('Location permission was not granted. Prayer times are still shown for London; you can change this whenever you like.');
        return null;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let label = 'Your location';
      try {
        const places = await Location.reverseGeocodeAsync(position.coords);
        if (places.length > 0) {
          const place = places[0];
          label = [place.city || place.subregion, place.country].filter(Boolean).join(', ') || label;
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Please try again.';
        setNotice(`Location found, but its place name could not be loaded. ${detail}`);
      }
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label,
      };
      updateUser({ location });
      return location;
    } catch (error) {
      setNotice(`Your location could not be determined: ${error.message}`);
      return null;
    } finally {
      setLocationBusy(false);
    }
  };

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#321D17', '#5A3B2A']} style={StyleSheet.absoluteFill} />
        <EditorialMotif variant="sunset" />
        <View style={styles.loadingContent}>
          <View style={styles.loadingMark}><AppText style={styles.brandMonogram}>R</AppText></View>
          <AppText style={styles.loadingBrand}>REVERT2 REALITY</AppText>
          <View style={styles.loadingRule} />
          <AppText style={styles.loadingTagline}>A quiet place to begin</AppText>
          <ActivityIndicator color={COLORS.saffron} style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  if (!user.onboarded) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <Onboarding
          user={user}
          updateUser={updateUser}
          notice={notice}
          onEnableReminder={enableDailyReminders}
          onContinue={() => updateUser({ onboarded: true })}
        />
      </View>
    );
  }

  let content;
  if (activeArticle) {
    const article = normalizeLearningArticle(activeArticle);
    content = (
      <ArticleScreen
        article={article}
        completedQuizzes={user.completedQuizzes}
        completedLearningLessons={user.completedLearningLessons}
        onQuizComplete={markQuizComplete}
        onLearningLessonComplete={markLearningLessonComplete}
        onBack={() => activeGuide ? setArticleId(null) : closeDetail()}
        onSource={() => openExternal(article.source)}
        onVideo={() => openExternal(article.videoUrl)}
        onRelatedArticle={() => openArticle(article.relatedArticleId)}
        onRelatedGuide={() => openGuide(article.relatedGuideId, activeGuide?.id || null, true)}
        onCourseComplete={() => activeGuide && markGuideComplete(activeGuide.id)}
      />
    );
  } else if (activeGuide) {
    content = guideCourseMode ? (
      <TopicCourseScreen
        article={createGuideCourse(
          activeGuide,
          user.completedGuides.includes(activeGuide.id),
          Math.max(
            user.guideProgress[activeGuide.id] || 0,
            user.completedLearningLessons.filter((key) => key.startsWith(`guide-${activeGuide.id}:`)).length,
          ),
        )}
        completedQuizzes={user.completedQuizzes}
        completedLearningLessons={user.completedLearningLessons}
        onLearningLessonComplete={markLearningLessonComplete}
        onCourseComplete={() => markGuideComplete(activeGuide.id)}
        onBack={closeDetail}
        onVideo={() => openExternal(activeGuide.video)}
        onRelatedArticle={() => openArticle(activeGuide.article)}
        onRelatedGuide={() => activeGuide.relatedGuideId && openGuide(activeGuide.relatedGuideId, activeGuide.id, true)}
      />
    ) : (
      <GuideScreen
        guide={activeGuide}
        stepIndex={guideStep}
        setStepIndex={updateGuideStep}
        completed={user.completedGuides.includes(activeGuide.id)}
        onComplete={() => markGuideComplete(activeGuide.id)}
        onBack={closeDetail}
        onArticle={() => openArticle(activeGuide.article)}
        onVideo={() => openExternal(activeGuide.video)}
        onGuide={(id) => openGuide(id, activeGuide.id)}
      />
    );
  } else {
    content = (
      <>
        {tab === 'today' && (
          <HomeScreen
            user={user}
            schedule={schedule}
            nextPrayer={nextPrayerLabel}
            nextPrayerTime={nextPrayerTime}
            now={now}
            onGuide={openGuide}
            onTab={setTab}
            onExternal={openExternal}
          />
        )}
        {tab === 'road' && (
          <RoadmapScreen
            user={user}
            onGuide={openGuide}
            onTab={setTab}
          />
        )}
        {tab === 'learn' && (
          <LearnScreen
            user={user}
            filter={filter}
            setFilter={setFilter}
            topicCategory={topicCategory}
            setTopicCategory={setTopicCategory}
            onGuide={(id) => openGuide(id, null, true)}
            onArticle={openArticle}
            onQuran={() => setTab('quran')}
          />
        )}
        {tab === 'quran' && (
          <QuranScreen
            showArabic={showArabic}
            showTransliteration={showTransliteration}
            showMeaning={showMeaning}
            setShowArabic={setShowArabic}
            setShowTransliteration={setShowTransliteration}
            setShowMeaning={setShowMeaning}
            onExternal={openExternal}
            readVerses={user.readVerses}
            onToggleVerse={toggleVerse}
          />
        )}
        {tab === 'prayer' && (
          <PrayerScreen
            user={user}
            schedule={schedule}
            now={now}
            todaysPrayers={todaysPrayers}
            onTogglePrayer={togglePrayer}
            onLocation={useMyLocation}
            locationBusy={locationBusy}
            onGuide={openGuide}
            onPrayerGuide={(prayerKey) => openGuide('prayer', null, false, prayerKey)}
            onNotice={setNotice}
          />
        )}
        {tab === 'community' && (
          <SupportScreen
            user={user}
            onExternal={openExternal}
          />
        )}
      </>
    );
  }

  return (
    <View style={[styles.root, (tab === 'today' || tab === 'prayer') && !activeArticle && !activeGuide && styles.lightPageRoot]}>
      <StatusBar barStyle="dark-content" />
      {notice ? (
        <Press onPress={() => setNotice('')} style={styles.notice} accessibilityRole="alert">
          <Icon name="information-circle-outline" color={COLORS.danger} size={19} />
          <AppText style={styles.noticeText}>{notice}</AppText>
          <Icon name="close" color={COLORS.danger} size={18} />
        </Press>
      ) : null}
      <View style={styles.mainContent}>{content}</View>
      {!(activeArticle || (activeGuide && guideCourseMode)) ? (
        <TabBar active={tab} onChange={navigateTab} />
      ) : null}
    </View>
  );
}

function Onboarding({ user, updateUser, onContinue, notice, onEnableReminder }) {
  const [step, setStep] = useState(0);
  const [focuses, setFocuses] = useState(user.focuses || ['pray', 'basics']);
  const [journey, setJourney] = useState(user.journey || 'new');
  const [minutes, setMinutes] = useState(user.minutes || 10);
  const [reminder, setReminder] = useState(user.reminder !== false);
  const focusChoices = [
    { id: 'pray', title: 'Learning to pray', icon: 'body-outline' },
    { id: 'quran', title: 'Reading the Quran', icon: 'book-outline' },
    { id: 'basics', title: 'Understanding the basics', icon: 'leaf-outline' },
    { id: 'community', title: 'Finding community', icon: 'people-outline' },
    { id: 'family', title: 'Telling family', icon: 'heart-outline' },
    { id: 'ramadan', title: 'Ramadan & fasting', icon: 'moon-outline' },
  ];
  const journeyChoices = [
    { id: 'new', title: 'Just took my shahada', subtitle: 'Welcome — new beginnings', icon: 'sparkles-outline' },
    { id: 'year', title: 'Within my first year', subtitle: 'Building the foundations', icon: 'moon-outline' },
    { id: 'growing', title: 'A few years in', subtitle: 'Deepening my practice', icon: 'leaf-outline' },
    { id: 'exploring', title: 'Still exploring Islam', subtitle: 'Curious and learning', icon: 'compass-outline' },
  ];
  const rhythms = [
    { minutes: 5, name: 'Gentle', note: 'A bite-sized daily lesson' },
    { minutes: 10, name: 'Steady', note: 'Lesson plus reflection' },
    { minutes: 20, name: 'Focused', note: 'Deeper study & Quran time' },
  ];

  const finish = async () => {
    const focus = focuses.includes('quran') ? 'quran' : focuses.includes('basics') ? 'basics' : 'prayer';
    const reminderEnabled = reminder && step >= 3 ? await onEnableReminder() : false;
    updateUser({ focuses, focus, journey, minutes, reminder: reminderEnabled });
    onContinue();
  };

  if (step === 0 || step === 4) {
    const ready = step === 4;
    return (
      <View style={styles.welcomeScreen}>
        <LinearGradient colors={ready ? ['#5C3A27', '#D39A5B', '#291711'] : ['#22140F', '#72513B', '#20130F']} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={styles.welcomeGlow} />
        <View pointerEvents="none" style={styles.welcomeArchRing} />
        <MosqueArtwork compact />
        {!ready ? (
          <View style={styles.welcomeOverlay}>
            <View style={styles.welcomeTop}>
              <Brand light />
              <Press onPress={finish} style={styles.skipButton} accessibilityLabel="Skip onboarding">
                <AppText style={styles.skipText}>Skip <Icon name="arrow-forward" size={15} color={COLORS.white} /></AppText>
              </Press>
            </View>
            <View style={styles.welcomeArtworkSlot}>
              <EditorialMotif variant="sunset" style={styles.welcomeMotif} />
            </View>
            <AppText style={styles.welcomeKicker}>A QUIET PLACE TO BEGIN</AppText>
            <AppText style={styles.welcomeHeadlineLight}>Welcome to</AppText>
            <AppText style={styles.welcomeHeadlineBrand}>Revert2 <AppText style={{ color: COLORS.red }}>Reality</AppText></AppText>
            <View style={styles.welcomeAccent} />
            <AppText style={styles.welcomeMessage}>Your journey back to Islam,{'\n'}with support every step of the way.</AppText>
            <View style={styles.welcomeFeatures}>
              {[
                ['book-outline', 'Learn Islam'],
                ['people-outline', 'Find community'],
                ['home-outline', 'Grow in faith'],
              ].map(([icon, label]) => (
                <View key={label} style={styles.welcomeFeature}>
                  <View style={styles.welcomeFeatureIcon}><Icon name={icon} size={21} color={COLORS.white} /></View>
                  <AppText style={styles.welcomeFeatureText}>{label}</AppText>
                </View>
              ))}
            </View>
            <ActionButton label="Get started" icon="arrow-forward" onPress={() => setStep(1)} style={styles.welcomeButton} />
          </View>
        ) : (
          <View style={styles.readyOverlay}>
            <View style={styles.welcomeTop}>
              <Press onPress={() => setStep(3)} style={styles.backButtonLight}><Icon name="arrow-back" size={21} color={COLORS.white} /></Press>
              <Press onPress={() => setStep(3)} style={styles.skipButton}><AppText style={styles.skipText}>Edit plan</AppText></Press>
            </View>
            <View style={styles.welcomeArtworkSlot}>
              <EditorialMotif variant="sage" style={styles.welcomeMotif} />
            </View>
            <View style={styles.readyCheck}><Icon name="checkmark" size={31} color={COLORS.white} /></View>
            <Eyebrow light>YOUR PLAN IS READY</Eyebrow>
            <AppText style={styles.readyTitle}>You’re all set,{'\n'}friend.</AppText>
            <View style={styles.welcomeAccent} />
            <AppText style={styles.readyDescription}>{minutes} minutes a day, at your own pace.{'\n'}{reminder ? 'A gentle reminder after Fajr.' : 'No reminders — your pace.'}</AppText>
            <Press onPress={finish} style={styles.readyPreview}>
              <View style={styles.readyPreviewIcon}><Icon name={focuses.includes('quran') ? 'book-outline' : focuses.includes('basics') ? 'leaf-outline' : 'body-outline'} size={23} color={COLORS.white} /></View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.readyPreviewMeta}>TODAY · DAY 1 · {minutes} MIN</AppText>
                <AppText style={styles.readyPreviewTitle}>{focuses.includes('quran') ? 'Read Al-Fatihah' : focuses.includes('basics') ? 'Explore the essentials' : 'Learn your first prayer'}</AppText>
              </View>
              <Icon name="chevron-forward" size={20} color={COLORS.white} />
            </Press>
            <ActionButton label="Start my journey" icon="arrow-forward" onPress={finish} style={styles.welcomeButton} />
          </View>
        )}
        {notice ? <AppText style={styles.onboardingNotice}>{notice}</AppText> : null}
      </View>
    );
  }

  return (
    <View style={styles.setupScreen}>
      <View style={styles.setupHeader}>
        <Press onPress={() => setStep(step - 1)} style={styles.setupBackButton} accessibilityLabel="Back to previous step">
          <Icon name="arrow-back" size={20} color={COLORS.ink} />
        </Press>
        <View style={styles.setupHeaderCenter}>
          <AppText style={styles.setupHeaderEyebrow}>YOUR JOURNEY</AppText>
          <AppText style={styles.setupStepText}>STEP 0{step} OF 03</AppText>
        </View>
        <Press onPress={finish} style={styles.setupSkip} accessibilityLabel="Skip onboarding">
          <AppText style={styles.setupSkipText}>Skip</AppText>
        </Press>
      </View>
      <View style={styles.setupProgress}>
        {[1, 2, 3].map((item) => <View key={item} style={[styles.setupProgressSegment, step >= item && styles.setupProgressSegmentActive]} />)}
      </View>
      <ScrollView style={styles.setupScroll} contentContainerStyle={styles.setupContent} showsVerticalScrollIndicator={false}>
        {step === 1 ? (
          <>
            <View style={styles.setupIntro}>
              <View style={styles.setupIntroTop}>
                <AppText style={[styles.setupEyebrow, styles.setupEyebrowInline]}>01 · YOUR FOCUS</AppText>
                <EditorialMotif variant="sunset" style={styles.setupMotif} />
              </View>
              <AppText style={styles.onboardingStepTitle}>What would you like help with first?</AppText>
              <AppText style={styles.setupDescription}>Choose what matters to you right now. You can explore everything else later.</AppText>
            </View>
            <View style={styles.focusGrid}>
              {focusChoices.map((choice) => {
                const selected = focuses.includes(choice.id);
                return (
                  <Press
                    key={choice.id}
                    onPress={() => setFocuses(selected ? focuses.filter((item) => item !== choice.id) : [...focuses, choice.id])}
                    style={[styles.focusTile, selected && styles.focusTileSelected]}
                    accessibilityLabel={choice.title}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <View style={[styles.focusIcon, selected && styles.focusIconSelected]}><Icon name={choice.icon} size={21} color={selected ? COLORS.red : COLORS.greenMid} /></View>
                    <AppText style={[styles.focusTileTitle, selected && styles.focusTileTitleSelected]}>{choice.title}</AppText>
                    <View style={[styles.focusCheck, selected && styles.focusCheckSelected]}>{selected && <Icon name="checkmark" size={13} color={COLORS.white} />}</View>
                  </Press>
                );
              })}
            </View>
            <AppText style={styles.setupHint}>{focuses.length} selected <AppText style={styles.setupHintDivider}>·</AppText> you can change this anytime</AppText>
          </>
        ) : step === 2 ? (
          <>
            <View style={styles.setupIntro}>
              <View style={styles.setupIntroTop}>
                <AppText style={[styles.setupEyebrow, styles.setupEyebrowInline]}>02 · YOUR JOURNEY</AppText>
                <EditorialMotif variant="sage" style={styles.setupMotif} />
              </View>
              <AppText style={styles.onboardingStepTitle}>Where are you in your journey?</AppText>
              <AppText style={styles.setupDescription}>There’s no wrong answer. We’ll meet you where you are.</AppText>
            </View>
            <View style={styles.journeyList}>
              {journeyChoices.map((choice) => {
                const selected = journey === choice.id;
                return (
                  <Press
                    key={choice.id}
                    onPress={() => setJourney(choice.id)}
                    style={[styles.journeyChoice, selected && styles.journeyChoiceSelected]}
                    accessibilityLabel={choice.title}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.journeyIcon, selected && styles.journeyIconSelected]}><Icon name={choice.icon} size={22} color={selected ? COLORS.red : COLORS.ink} /></View>
                    <View style={{ flex: 1 }}>
                      <AppText style={[styles.journeyChoiceTitle, selected && styles.journeyChoiceTitleSelected]}>{choice.title}</AppText>
                      <AppText style={[styles.journeyChoiceSubtitle, selected && styles.journeyChoiceSubtitleSelected]}>{choice.subtitle}</AppText>
                    </View>
                    <View style={[styles.journeyRadio, selected && styles.journeyRadioSelected]}>{selected && <View style={styles.journeyRadioDot} />}</View>
                  </Press>
                );
              })}
            </View>
            <View style={styles.privacyNote}>
              <Icon name="lock-closed-outline" size={15} color={COLORS.greenMid} />
              <AppText style={styles.privacyNoteText}>Private to you <AppText style={styles.setupHintDivider}>·</AppText> only used to shape your plan</AppText>
            </View>
          </>
        ) : (
          <>
            <View style={styles.setupIntro}>
              <View style={styles.setupIntroTop}>
                <AppText style={[styles.setupEyebrow, styles.setupEyebrowInline]}>03 · YOUR RHYTHM</AppText>
                <EditorialMotif variant="sunset" style={styles.setupMotif} />
              </View>
              <AppText style={styles.onboardingStepTitle}>How much time feels right each day?</AppText>
              <AppText style={styles.setupDescription}>A gentle rhythm is better than a perfect plan. Start with what feels doable.</AppText>
            </View>
            <View style={styles.rhythmList}>
              {rhythms.map((rhythm) => {
                const selected = minutes === rhythm.minutes;
                return (
                  <Press
                    key={rhythm.minutes}
                    onPress={() => setMinutes(rhythm.minutes)}
                    style={[styles.rhythmOption, selected && styles.rhythmOptionSelected]}
                    accessibilityLabel={`${rhythm.name}, ${rhythm.minutes} minutes a day`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.rhythmNumber, selected && styles.rhythmNumberSelected]}>
                      <AppText style={[styles.rhythmMinutes, selected && styles.rhythmMinutesSelected]}>{rhythm.minutes}</AppText>
                      <AppText style={[styles.rhythmMinLabel, selected && styles.rhythmMinLabelSelected]}>MIN</AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={[styles.rhythmName, selected && styles.rhythmNameSelected]}>{rhythm.name}</AppText>
                      <AppText style={styles.rhythmNote}>{rhythm.note}</AppText>
                    </View>
                    <View style={[styles.rhythmCheck, selected && styles.rhythmCheckSelected]}>
                      {selected && <Icon name="checkmark" size={14} color={COLORS.white} />}
                    </View>
                  </Press>
                );
              })}
            </View>
            <View style={styles.weeklySummary}>
              <Icon name="leaf-outline" size={18} color={COLORS.greenMid} />
              <AppText style={styles.weeklyMinutes}>That’s about {minutes * 7} minutes a week</AppText>
            </View>
            <View style={styles.reminderCard}>
              <View style={styles.reminderIcon}><Icon name="notifications-outline" size={21} color={COLORS.red} /></View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.reminderTitle}>Daily reminder</AppText>
                <AppText style={styles.reminderSubtitle}>Gently, after Fajr</AppText>
              </View>
              <Switch
                value={reminder}
                onValueChange={setReminder}
                trackColor={{ false: COLORS.line, true: COLORS.red }}
                thumbColor={COLORS.white}
                accessibilityLabel="Daily reminder"
              />
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.setupFooter}>
        <ActionButton
          label={step === 3 ? 'Create my plan' : 'Continue'}
          icon="arrow-forward"
          onPress={() => step === 3 ? setStep(4) : setStep(step + 1)}
        />
      </View>
    </View>
  );
}

function HomeScreen({ user, schedule, nextPrayer, nextPrayerTime, now, onGuide, onTab, onExternal }) {
  const [packImageWidth, setPackImageWidth] = useState(0);
  const packImageHeight = packImageWidth ? packImageWidth / 1.76 : 156;
  const countdownSeconds = nextPrayerTime ? Math.max(0, Math.floor((nextPrayerTime.getTime() - now.getTime()) / 1000)) : 0;
  const countdown = `${Math.floor(countdownSeconds / 3600)}h ${String(Math.floor((countdownSeconds % 3600) / 60)).padStart(2, '0')}m`;

  return (
    <Page scrollStyle={styles.homeScroll} contentStyle={styles.homePage}>
      <View style={styles.homeWelcome}>
        <AppText style={styles.homeSalutation}>As-salamu alaykum{user.name ? `, ${user.name}` : ''}.</AppText>
        <AppText style={styles.homeHeadline}>Welcome home.</AppText>
        <AppText style={styles.homeIntro}>No rush. One gentle step at a time.</AppText>
      </View>

      <Press
        onPress={() => onTab('prayer')}
        style={styles.homePrayer}
        accessibilityRole="button"
        accessibilityLabel={`Open prayer times and Qibla. Next prayer: ${schedule.error ? 'Prayer' : nextPrayer}`}
      >
        <View style={styles.homePrayerIcon}><Icon name="moon-outline" size={18} color="#C92F25" /></View>
        <View style={styles.homePrayerCopy}>
          <AppText style={styles.homePrayerEyebrow}>NEXT PRAYER</AppText>
          <View style={styles.homePrayerDetail}>
            <AppText style={styles.homePrayerName}>{schedule.error ? 'Prayer' : nextPrayer}</AppText>
            <AppText style={styles.homePrayerTime}>{nextPrayerTime ? formatTime(nextPrayerTime) : '—'}</AppText>
            <AppText style={styles.homePrayerCountdown}>· in {countdown}</AppText>
          </View>
        </View>
        <Icon name="arrow-forward" size={17} color="#8B7D73" />
      </Press>

      <View style={styles.homePackCard}>
        <View
          style={styles.homePackImageFrame}
          onLayout={({ nativeEvent }) => setPackImageWidth(nativeEvent.layout.width)}
        >
          <Image
            source={require('./assets/shahada-pack.jpg')}
            style={[styles.homePackImage, { height: packImageHeight }]}
            resizeMode="cover"
            accessible
            accessibilityLabel="A Shahada pack with a Quran, prayer mat, booklets and a red gift bag"
          />
        </View>
        <View style={styles.homePackContent}>
          <AppText style={styles.homePackEyebrow}>Our gift to you.</AppText>
          <AppText style={styles.homePackTitle}>Your Shahada Pack</AppText>
          <View style={styles.homePackDetails}>
            <View style={styles.homePackBadgePrimary}>
              <AppText style={styles.homePackBadgePrimaryText}>Free for reverts</AppText>
            </View>
            <View style={styles.homePackBadge}>
              <AppText style={styles.homePackBadgeText}>£4.95 postage</AppText>
            </View>
            <View style={styles.homePackBadge}>
              <AppText style={styles.homePackBadgeText}>3–5 working days</AppText>
            </View>
          </View>
          <Press
            onPress={() => onExternal(SHAHADA_PACK_URL)}
            style={styles.homePackButton}
            accessibilityRole="link"
            accessibilityLabel="Order your free Shahada pack. Postage is £4.95."
          >
            <AppText style={styles.homePackButtonText}>Order my pack</AppText>
            <Icon name="arrow-forward" size={18} color={COLORS.white} />
          </Press>
        </View>
      </View>

      <View style={styles.homePackQuote}>
        <Icon name="leaf" size={20} color="#CF655E" />
        <AppText style={styles.homePackQuoteText}>
          “Allah does not burden a soul beyond that it can bear.”
        </AppText>
        <AppText style={styles.homePackQuoteSource}>Qur’an 2:286</AppText>
      </View>

      <Press
        onPress={() => onGuide('shahada')}
        style={styles.homeShahadaCard}
        accessibilityRole="button"
        accessibilityLabel="Explore the Shahadah, the testimony of faith"
      >
        <View style={styles.homeShahadaHeader}>
          <View style={styles.homeShahadaIcon}>
            <Icon name="sparkles-outline" size={18} color="#B8312F" />
          </View>
          <View style={styles.homeShahadaHeading}>
            <AppText style={styles.homeShahadaEyebrow}>THE HEART OF FAITH</AppText>
            <AppText style={styles.homeShahadaTitle}>The Shahadah</AppText>
          </View>
        </View>
        <View style={styles.homeShahadaArabicBlock}>
          <AppText style={styles.homeShahadaArabic}>أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ</AppText>
          <AppText style={styles.homeShahadaArabic}>وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ</AppText>
        </View>
        <View style={styles.homeShahadaFooter}>
          <View style={styles.homeShahadaFooterCopy}>
            <AppText style={styles.homeShahadaMeaning}>A sincere beginning, at your own pace.</AppText>
            <AppText style={styles.homeShahadaLink}>Learn what it means</AppText>
          </View>
          <View style={styles.homeShahadaArrow}>
            <Icon name="arrow-forward" size={15} color="#B8312F" />
          </View>
        </View>
      </Press>

      <View style={styles.homeExploreSection}>
        <AppText style={styles.homeExploreHeading}>EXPLORE AT YOUR OWN PACE</AppText>
        <Press
          onPress={() => onTab('learn')}
          style={styles.homeExploreRow}
          accessibilityRole="button"
          accessibilityLabel="Explore your learning path"
        >
          <Icon name="map-outline" size={19} color="#B8312F" />
          <AppText style={styles.homeExploreTitle}>Explore your learning path</AppText>
          <Icon name="arrow-forward" size={15} color="#9B8F85" />
        </Press>
        <View style={styles.homeExploreDivider} />
        <Press
          onPress={() => onTab('quran')}
          style={styles.homeExploreRow}
          accessibilityRole="button"
          accessibilityLabel="Read Al-Fatihah"
        >
          <Icon name="book-outline" size={19} color="#B8312F" />
          <AppText style={styles.homeExploreTitle}>Read Al-Fatihah</AppText>
          <Icon name="arrow-forward" size={15} color="#9B8F85" />
        </Press>
      </View>

      <Press
        onPress={() => onTab('community')}
        style={styles.homeSupportLink}
        accessibilityRole="button"
        accessibilityLabel="Find a supportive community"
      >
        <AppText style={styles.homeSupportPrompt}>Need support?</AppText>
        <AppText style={styles.homeSupportAction}>Find community</AppText>
        <Icon name="arrow-forward" size={14} color="#B8312F" />
      </Press>
    </Page>
  );
}

function RoadmapScreen({ user, onGuide, onTab }) {
  const stages = [
    { key: 'first', label: 'DAY 0–1', title: 'Your first day', subtitle: 'The shahada and the start of your journey.', guides: ['shahada'], icon: 'sparkles-outline' },
    { key: 'prayer', label: 'WEEK 1', title: 'Learn the shape of prayer', subtitle: 'Prepare for prayer, then practise one step at a time.', guides: ['wudu', 'prayer'], icon: 'body-outline' },
    { key: 'quran', label: 'WHEN YOU’RE READY', title: 'Read and reflect', subtitle: 'Meet Al-Fatihah line by line, with transliteration.', reader: true, icon: 'book-outline' },
    { key: 'living', label: 'YOUR OWN PACE', title: 'Grow into daily life', subtitle: 'Build a rhythm and find people you trust.', guides: ['belief', 'daily-life'], icon: 'leaf-outline' },
  ];
  const completeGuides = user.completedGuides.length;
  const progress = (completeGuides + user.readVerses.length / 7) / (GUIDES.length + 1);
  const progressPercent = Math.round(progress * 100);
  const firstActive = stages.findIndex((stage) => stage.reader
    ? user.readVerses.length < 7
    : !stage.guides.every((id) => user.completedGuides.includes(id)));

  return (
    <Page contentStyle={styles.roadmapPage} bottom={112}>
      <View style={styles.roadmapHeader}>
        <View style={styles.roadmapHeaderTop}>
          <AppText style={styles.roadmapEyebrow}>YOUR ROADMAP</AppText>
          <View style={styles.roadmapHeaderBadge}>
            <Icon name="checkmark-circle-outline" size={14} color={COLORS.green} />
            <AppText style={styles.roadmapHeaderBadgeText}>{completeGuides}/{GUIDES.length}</AppText>
          </View>
        </View>
        <AppText style={styles.roadmapTitle}>Your path forward</AppText>
        <AppText style={styles.roadmapDescription}>A gentle guide through the foundations, at a pace that feels right for you.</AppText>
      </View>

      <View style={styles.roadmapProgress}>
        <View style={styles.roadmapProgressContent}>
          <View style={styles.roadmapProgressTop}>
            <View style={styles.roadmapProgressCopy}>
              <AppText style={styles.roadmapProgressLabel}>YOUR JOURNEY</AppText>
              <AppText style={styles.roadmapProgressTitle}>Every small step counts</AppText>
            </View>
            <AppText style={styles.roadmapPercent}>{progressPercent}%</AppText>
          </View>
          <ProgressBar progress={progress} light />
          <View style={styles.roadmapProgressFooter}>
            <AppText style={styles.roadmapProgressNote}>{completeGuides} of {GUIDES.length} guides</AppText>
            <AppText style={styles.roadmapProgressNote}>{user.readVerses.length} of 7 lines practiced</AppText>
          </View>
        </View>
      </View>

      <View style={styles.roadmapJourneyIntro}>
        <AppText style={styles.roadmapJourneyTitle}>Take it one step at a time</AppText>
        <AppText style={styles.roadmapJourneySubtitle}>Choose any stage. Nothing here is a deadline.</AppText>
      </View>

      <View style={styles.roadmapTimeline}>
        {stages.map((stage, index) => {
          const complete = stage.reader
            ? user.readVerses.length === 7
            : stage.guides.every((id) => user.completedGuides.includes(id));
          const active = !complete && index === firstActive;
          const onPress = stage.reader
            ? () => onTab('quran')
            : () => onGuide(stage.guides.find((id) => !user.completedGuides.includes(id)) || stage.guides[0]);
          return (
            <View key={stage.key} style={styles.roadmapStage}>
              <View style={styles.roadmapMarkerColumn}>
                <View style={[
                  styles.roadmapMarker,
                  complete && styles.roadmapMarkerDone,
                  active && styles.roadmapMarkerCurrent,
                ]}>
                  {complete
                    ? <Icon name="checkmark" size={14} color={COLORS.white} />
                    : active
                      ? <View style={styles.roadmapMarkerDot} />
                      : <Icon name={stage.icon} size={14} color={COLORS.muted} />}
                </View>
                {index < stages.length - 1 && <View style={[styles.roadmapConnector, complete && styles.roadmapConnectorDone]} />}
              </View>
              <Press
                onPress={onPress}
                style={[
                  styles.roadmapStageContent,
                  active && styles.roadmapStageContentActive,
                ]}
                accessibilityLabel={`${complete ? 'Review completed' : active ? 'Continue' : 'Explore'} ${stage.title}`}
              >
                <View style={styles.roadmapStageTop}>
                  <AppText style={[styles.roadmapStageLabel, active && styles.roadmapStageLabelActive]}>{stage.label}</AppText>
                  <AppText style={[styles.roadmapStageStatus, complete && styles.roadmapStageStatusDone, active && styles.roadmapStageStatusActive]}>
                    {complete ? 'COMPLETE' : active ? 'UP NEXT' : 'AVAILABLE ANYTIME'}
                  </AppText>
                </View>
                <AppText style={styles.roadmapStageTitle}>{stage.title}</AppText>
                <AppText style={styles.roadmapStageSubtitle}>{stage.subtitle}</AppText>
                {stage.guides ? (
                  <View style={styles.roadmapGuideNames}>
                    {stage.guides.map((id) => {
                      const guide = GUIDES.find((item) => item.id === id);
                      const done = user.completedGuides.includes(id);
                      return (
                        <View key={id} style={styles.roadmapGuideRow}>
                          <Icon name={done ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={done ? COLORS.green : COLORS.muted} />
                          <AppText style={[styles.roadmapGuideText, done && styles.roadmapGuideTextDone]}>{guide.title}</AppText>
                          <AppText style={styles.roadmapGuideDuration}>{guide.duration}</AppText>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
                {stage.reader ? (
                  <View style={styles.roadmapReaderProgress}>
                    <View style={styles.roadmapReaderTrack}>
                      <View style={[styles.roadmapReaderFill, { width: `${(user.readVerses.length / 7) * 100}%` }]} />
                    </View>
                    <AppText style={styles.roadmapReaderCount}>{user.readVerses.length}/7 lines</AppText>
                  </View>
                ) : null}
                <View style={styles.roadmapStageFooter}>
                  <AppText style={[styles.roadmapOpen, active && styles.roadmapOpenActive]}>
                    {complete ? 'Revisit this stage' : active ? 'Continue this stage' : 'Explore this stage'}
                  </AppText>
                  <Icon name="arrow-forward" size={15} color={active ? COLORS.green : COLORS.muted} />
                </View>
              </Press>
            </View>
          );
        })}
      </View>
      <AppText style={styles.disclaimer}>Progress is private and stays on this device. There’s no deadline and no perfect pace.</AppText>
    </Page>
  );
}

const LEARN_GAME_TABS = [
  { id: 'path', label: 'Path', icon: 'map-outline' },
  { id: 'progress', label: 'Stats', icon: 'stats-chart-outline' },
  { id: 'explore', label: 'Explore', icon: 'compass-outline' },
  { id: 'awards', label: 'Awards', icon: 'ribbon-outline' },
  { id: 'profile', label: 'Profile', icon: 'person-circle-outline' },
];

function LearnGameNavigation({ active, onChange }) {
  return (
    <View style={styles.learnGameNav}>
      {LEARN_GAME_TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <Press
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.learnGameNavItem, selected && styles.learnGameNavItemSelected]}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
          >
            <View style={styles.learnGameNavIcon}>
              <Icon name={tab.icon} size={15} color={selected ? '#FFFFFF' : LEARN_COLORS.muted} />
            </View>
            <AppText style={[styles.learnGameNavLabel, selected && styles.learnGameNavLabelSelected]}>{tab.label}</AppText>
          </Press>
        );
      })}
    </View>
  );
}

function LearnPathMap({ nodes, activeIndex }) {
  const positions = [
    { centerX: '71.7%', top: 16 },
    { centerX: '30.6%', top: 131 },
    { centerX: '71.7%', top: 246 },
    { centerX: '30.6%', top: 361 },
    { centerX: '71.7%', top: 476 },
    { centerX: '30.6%', top: 591 },
    { centerX: '71.7%', top: 706 },
  ];
  const paths = [
    'M 230 70 C 205 80 175 125 138 149',
    'M 138 185 C 170 202 196 245 230 264',
    'M 230 300 C 195 310 170 355 138 379',
    'M 138 415 C 170 432 196 475 230 494',
    'M 230 530 C 195 540 170 585 138 609',
    'M 138 645 C 170 662 196 705 230 724',
  ];

  return (
    <View style={styles.learnMap}>
      <Svg pointerEvents="none" style={styles.learnMapDrawing} viewBox="0 0 360 850" preserveAspectRatio="none">
        {paths.map((path, index) => (
          <Path
            key={path}
            d={path}
            fill="none"
            stroke={nodes[index]?.complete ? LEARN_COLORS.forest : COLORS.line}
            strokeWidth="5"
            strokeDasharray="7 11"
            strokeLinecap="round"
          />
        ))}
        <Path d="M37 180l5 8 8 1-6 6 1 8-8-4-7 4 1-8-6-6 8-1z" fill={COLORS.saffron} />
        <Path d="M314 432l4 6 7 1-5 5 1 7-7-3-6 3 1-7-5-5 7-1z" fill={COLORS.rose} />
        <Circle cx="45" cy="520" r="3" fill={LEARN_COLORS.gold} />
      </Svg>
      {nodes.map((node, index) => {
        const activeNode = index === activeIndex;
        const isReward = node.kind === 'reward';
        const badgeFill = isReward
          ? (node.complete ? LEARN_COLORS.goldLight : COLORS.canvas)
          : node.complete ? LEARN_COLORS.forestLight : activeNode ? LEARN_COLORS.forest : COLORS.canvas;
        const badgeStroke = isReward
          ? LEARN_COLORS.gold
          : node.complete || activeNode ? LEARN_COLORS.forest : COLORS.line;
        return (
          <Press
            key={node.id}
            onPress={node.onPress}
            style={[
              styles.learnMapNode,
              {
                left: positions[index].centerX,
                top: positions[index].top - 14,
                transform: [{ translateX: -48 }],
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${node.title}. ${node.complete ? 'Complete' : activeNode ? 'Next on your path' : 'Explore anytime'}. ${node.progressText}`}
          >
            <View style={styles.learnMapStars}>
              {[0, 1, 2].map((star) => (
                <Icon
                  key={star}
                  name={activeNode || node.complete || isReward && node.complete ? 'star' : 'star-outline'}
                  size={10}
                  color={node.complete || activeNode ? LEARN_COLORS.gold : COLORS.line}
                />
              ))}
            </View>
            <View style={styles.learnMapBadge}>
              <Svg width="72" height="72" viewBox="0 0 72 72">
                <Path
                  d="M36 3 64 19v34L36 69 8 53V19z"
                  fill={badgeFill}
                  stroke={badgeStroke}
                  strokeWidth={activeNode || node.complete || isReward ? 3 : 2}
                />
              </Svg>
              <View style={styles.learnMapBadgeIcon}>
                <Icon
                  name={node.complete ? 'checkmark' : node.icon}
                  size={24}
                  color={isReward ? LEARN_COLORS.gold : node.complete ? LEARN_COLORS.forest : activeNode ? '#FFFFFF' : COLORS.muted}
                />
              </View>
            </View>
            <AppText style={[styles.learnMapStep, activeNode && styles.learnMapStepActive]}>
              {node.stepLabel}
            </AppText>
            <AppText style={styles.learnMapNodeTitle} numberOfLines={2}>{node.title}</AppText>
            <AppText style={styles.learnMapNodeMeta} numberOfLines={1}>{node.progressText}</AppText>
          </Press>
        );
      })}
    </View>
  );
}

function LearnScreen({
  user,
  filter,
  setFilter,
  topicCategory,
  setTopicCategory,
  onGuide,
  onArticle,
  onQuran,
}) {
  const [activeView, setActiveView] = useState('path');
  const [exploreKind, setExploreKind] = useState('guides');
  const [progressPeriod, setProgressPeriod] = useState('week');
  const guideCategories = ['All', 'Start here', 'Prayer', 'Everyday life'];
  const completedGuides = new Set(user.completedGuides);
  const completedQuizzes = new Set(user.completedQuizzes);
  const completedQuizCount = completedQuizzes.size;
  const quizTopics = LEARNING_TOPICS.filter((topic) => topic.quiz);
  const earnedLearningLessonCount = user.completedLearningLessons.filter((key) => !key.startsWith('guide-')).length;
  const totalXp = completedGuides.size * 40
    + completedQuizCount * 15
    + user.readVerses.length * 5
    + earnedLearningLessonCount * 10;
  const level = Math.floor(totalXp / 100) + 1;
  const levelProgress = totalXp % 100;
  const streak = getCurrentStreak(user.activityDays, localDateKey());
  const activityDaySet = new Set(user.activityDays);
  const today = new Date();
  const todayKey = localDateKey(today);
  const shortWeekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  const fullWeekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    return {
      key,
      label: shortWeekdayFormatter.format(date).slice(0, 2),
      fullLabel: fullWeekdayFormatter.format(date),
      active: activityDaySet.has(key),
      isToday: key === todayKey,
    };
  });
  const weeklyActiveCount = weeklyActivity.filter((day) => day.active).length;
  const fajrDays = Object.values(user.completedPrayers).filter(
    (prayers) => Array.isArray(prayers) && prayers.includes('fajr'),
  ).length;
  const badges = [
    {
      id: 'consistency',
      title: 'Consistency',
      fullTitle: 'Consistency champion',
      icon: 'trophy-outline',
      earned: streak >= 7,
      progress: `${Math.min(streak, 7)} of 7 active days`,
    },
    {
      id: 'fajr',
      title: 'Fajr',
      fullTitle: 'Fajr Achiever',
      icon: 'sunny-outline',
      earned: fajrDays >= 5,
      progress: `${Math.min(fajrDays, 5)} of 5 check-ins`,
    },
    {
      id: 'wudu',
      title: 'Wudu',
      fullTitle: 'Wudu Master',
      icon: 'water-outline',
      earned: completedGuides.has('wudu'),
      progress: 'Complete the wudu guide',
    },
    {
      id: 'quran',
      title: 'Quran',
      fullTitle: 'Quran Reader',
      icon: 'book-outline',
      earned: user.readVerses.length >= 7,
      progress: `${Math.min(user.readVerses.length, 7)} of 7 verses`,
    },
    {
      id: 'shahada',
      title: 'Faith',
      fullTitle: 'Shahada Scholar',
      icon: 'sparkles-outline',
      earned: completedGuides.has('shahada'),
      progress: 'Complete the shahada guide',
    },
  ];
  const earnedBadgeCount = badges.filter((badge) => badge.earned).length;
  const nextQuiz = quizTopics.find((topic) => !completedQuizzes.has(topic.id)) || quizTopics[0];
  const guideNodes = LEARN_CHALLENGES
    .filter((challenge) => challenge.guides)
    .flatMap((challenge) => challenge.guides)
    .map((item, index) => {
      const guide = GUIDES.find((entry) => entry.id === item.id);
      const complete = completedGuides.has(item.id);
      return {
        id: item.id,
        title: item.title,
        subtitle: guide?.subtitle || 'A gentle introduction',
        icon: guide?.icon || 'book-outline',
        stepLabel: `LESSON ${String(index + 1).padStart(2, '0')}`,
        progressText: complete ? 'Complete' : guide?.duration || '5 min',
        rewardText: '+40 XP',
        complete,
        onPress: () => onGuide(item.id),
      };
    });
  const lessonNodes = [
    ...guideNodes,
    {
      id: 'quran',
      title: 'Al-Fatihah',
      subtitle: 'Read one verse at a time',
      icon: 'book-outline',
      stepLabel: 'LESSON 05',
      progressText: `${Math.min(user.readVerses.length, 7)} of 7 verses`,
      rewardText: '+35 XP',
      complete: user.readVerses.length >= 7,
      onPress: onQuran,
    },
    {
      id: 'quick-checks',
      title: 'Quick check',
      subtitle: 'A few gentle questions · no grades',
      icon: 'help-circle-outline',
      stepLabel: 'LESSON 06',
      progressText: `${completedQuizCount} of ${quizTopics.length} checks`,
      rewardText: `+${quizTopics.length * 15} XP`,
      complete: completedQuizCount >= quizTopics.length,
      onPress: () => nextQuiz ? onArticle(nextQuiz.id) : setActiveView('awards'),
    },
  ];
  const currentLessonIndex = lessonNodes.findIndex((node) => !node.complete);
  const activeIndex = currentLessonIndex === -1 ? lessonNodes.length : currentLessonIndex;
  const rewardNode = {
    id: 'reward',
    title: 'Your reward',
    subtitle: activeIndex === lessonNodes.length ? 'A path well travelled' : 'Your next milestone is waiting',
    icon: 'gift-outline',
    stepLabel: 'MILESTONE',
    progressText: activeIndex === lessonNodes.length ? 'Unlocked' : 'Keep exploring',
    rewardText: '',
    complete: activeIndex === lessonNodes.length,
    kind: 'reward',
    onPress: () => setActiveView('awards'),
  };
  const mapNodes = [...lessonNodes, rewardNode];
  const guideProgressCount = guideNodes.filter((node) => node.complete).length;
  const progressValue = guideProgressCount
    + Math.min(user.readVerses.length / 7, 1)
    + Math.min(quizTopics.length ? completedQuizCount / quizTopics.length : 0, 1);
  const journeyPercent = Math.round((progressValue / lessonNodes.length) * 100);
  const currentNode = mapNodes[activeIndex];
  const guideGroups = guideCategories
    .slice(1)
    .map((category) => ({
      category,
      guides: GUIDES.filter((guide) => guide.category === category && (filter === 'All' || filter === category)),
    }))
    .filter((group) => group.guides.length > 0);
  const visibleTopics = LEARNING_TOPICS.filter((topic) => topic.category === topicCategory);
  const header = (eyebrow, title, subtitle) => (
    <>
      <View style={styles.learnGameHeading}>
        <AppText style={styles.learnGameEyebrow}>{eyebrow}</AppText>
        <AppText style={styles.learnGameTitle}>{title}</AppText>
        <AppText style={styles.learnGameSubtitle}>{subtitle}</AppText>
      </View>
      <LearnGameNavigation active={activeView} onChange={setActiveView} />
    </>
  );

  const renderPath = () => (
    <>
      {header('YOUR JOURNEY', 'Learning path', 'Every small step moves you forward.')}
      <View style={styles.learnStatsCard}>
        <View style={styles.learnStatsMetricRow}>
          {[
            { icon: 'flame', value: `${streak}`, label: 'STREAK', color: '#D17A36' },
            { icon: 'star', value: `Lvl ${level}`, label: 'LEVEL', color: '#B99659' },
            { icon: 'diamond', value: totalXp.toLocaleString(), label: 'POINTS', color: LEARN_COLORS.forestDeep },
            { icon: 'ribbon', value: `${earnedBadgeCount}/${badges.length}`, label: 'AWARDS', color: LEARN_COLORS.forestDeep },
          ].map((item, index, metrics) => (
            <View key={item.label} style={styles.learnStatsMetric}>
              <Icon name={item.icon} size={17} color={item.color} />
              <AppText style={styles.learnStatsMetricValue} numberOfLines={1} adjustsFontSizeToFit>
                {item.value}
              </AppText>
              <AppText style={styles.learnStatsMetricLabel}>{item.label}</AppText>
              {index < metrics.length - 1 ? <View style={styles.learnStatsMetricDivider} /> : null}
            </View>
          ))}
        </View>
        <View style={styles.learnStatsDashedDivider} />
        <View style={styles.learnStatsWeek}>
          {weeklyActivity.map((day) => {
            const streakOpportunity = day.isToday && !day.active;
            return (
              <View
                key={day.key}
                style={styles.learnStatsDay}
                accessible
                accessibilityLabel={`${day.fullLabel}: ${day.active ? 'activity recorded' : streakOpportunity ? 'complete an activity to start or extend your streak' : 'no activity recorded'}`}
              >
                <View
                  style={[
                    styles.learnStatsDayMark,
                    day.active && styles.learnStatsDayMarkActive,
                    streakOpportunity && styles.learnStatsDayMarkOpportunity,
                  ]}
                >
                  {day.active ? (
                    <Icon name="flame" size={16} color="#D17A36" />
                  ) : streakOpportunity ? (
                    <AppText style={styles.learnStatsDayOpportunity}>+1</AppText>
                  ) : (
                    <View style={styles.learnStatsDayDot} />
                  )}
                </View>
                <AppText style={[styles.learnStatsDayLabel, day.isToday && styles.learnStatsDayLabelToday]}>
                  {day.label}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>

      <Press
        onPress={currentNode.onPress}
        style={styles.learnCurrentCard}
        accessibilityRole="button"
        accessibilityLabel={`${activeIndex === lessonNodes.length ? 'View' : 'Continue'} ${currentNode.title}. ${currentNode.subtitle}. Reward ${currentNode.rewardText || 'your achievements'}`}
      >
        <View style={styles.learnCurrentTop}>
          <View style={styles.learnCurrentHeading}>
            <View style={styles.learnCurrentMeta}>
              <View style={styles.learnCurrentDot} />
              <AppText style={styles.learnCurrentEyebrow}>{activeIndex === lessonNodes.length ? 'PATH COMPLETE' : 'UP NEXT'}</AppText>
              <AppText style={styles.learnCurrentStep}>{currentNode.stepLabel}</AppText>
            </View>
            <AppText style={styles.learnCurrentTitle}>{currentNode.title}</AppText>
            <AppText style={styles.learnCurrentSubtitle}>{currentNode.subtitle}</AppText>
          </View>
          {currentNode.rewardText ? (
            <View style={styles.learnRewardPill}>
              <Icon name="star" size={11} color={LEARN_COLORS.gold} />
              <AppText style={styles.learnRewardPillText}>{currentNode.rewardText}</AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.learnCurrentProgressRow}>
          <View style={styles.learnCurrentTrack}>
            <View style={[styles.learnCurrentFill, { width: `${journeyPercent}%` }]} />
          </View>
          <AppText style={styles.learnCurrentPercent}>{journeyPercent}%</AppText>
          <View style={styles.learnCurrentArrow}><Icon name="arrow-forward" size={16} color="#FFFFFF" /></View>
        </View>
      </Press>

      <View style={styles.learnMapHeading}>
        <View>
          <AppText style={styles.learnMapTitle}>Your trail</AppText>
          <AppText style={styles.learnMapSubtitle}>Tap any lesson to begin or revisit it.</AppText>
        </View>
        <AppText style={styles.learnMapCount}>{lessonNodes.filter((node) => node.complete).length}/{lessonNodes.length}</AppText>
      </View>
      <LearnPathMap nodes={mapNodes} activeIndex={activeIndex} />
    </>
  );

  const renderProgress = () => (
    <>
      {header('YOUR PERSONAL SCOREBOARD', 'Your progress', 'Just for you. No comparisons or pressure.')}
      <LinearGradient colors={[LEARN_COLORS.forest, LEARN_COLORS.forestDeep]} style={styles.learnScoreCard}>
        <View style={styles.learnScoreCopy}>
          <AppText style={styles.learnScoreEyebrow}>LEVEL {level}</AppText>
          <AppText style={styles.learnScoreValue}>{totalXp.toLocaleString()}</AppText>
          <AppText style={styles.learnScoreLabel}>learning points</AppText>
        </View>
        <View style={styles.learnScoreIcon}><Icon name="trophy" size={27} color={LEARN_COLORS.gold} /></View>
        <View style={styles.learnScoreBottom}>
          <View style={styles.learnScoreTrack}><View style={[styles.learnScoreFill, { width: `${levelProgress}%` }]} /></View>
          <AppText style={styles.learnScoreNext}>{levelProgress}/100 to level {level + 1}</AppText>
        </View>
      </LinearGradient>

      <View style={styles.learnPeriodSwitch}>
        {[
          { id: 'week', label: 'This week' },
          { id: 'all', label: 'All time' },
        ].map((period) => {
          const selected = progressPeriod === period.id;
          return (
            <Press
              key={period.id}
              onPress={() => setProgressPeriod(period.id)}
              style={[styles.learnPeriodButton, selected && styles.learnPeriodButtonSelected]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <AppText style={[styles.learnPeriodText, selected && styles.learnPeriodTextSelected]}>{period.label}</AppText>
            </Press>
          );
        })}
      </View>
      {progressPeriod === 'week' ? (
        <View style={styles.learnActivityCard}>
          <View style={styles.learnActivityHeading}>
            <View>
              <AppText style={styles.learnCardTitle}>Weekly activity</AppText>
              <AppText style={styles.learnCardSubtitle}>A little learning adds up.</AppText>
            </View>
            <AppText style={styles.learnActivityCount}>{weeklyActiveCount}/7 days</AppText>
          </View>
          <View style={styles.learnActivityBars}>
            {weeklyActivity.map((day) => (
              <View key={day.key} style={styles.learnActivityDay}>
                <View style={styles.learnActivityBarTrack}>
                  <View style={[styles.learnActivityBar, day.active && styles.learnActivityBarActive]} />
                </View>
                <AppText style={styles.learnActivityLabel}>{day.label}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.learnStatsGrid}>
        {[
          { icon: 'book-outline', value: `${completedGuides.size}`, label: 'Guides finished' },
          { icon: 'reader-outline', value: `${user.readVerses.length}/7`, label: 'Verses read' },
          { icon: 'help-circle-outline', value: `${completedQuizCount}/${quizTopics.length}`, label: 'Quick checks' },
          { icon: 'flame-outline', value: `${streak}`, label: 'Day streak' },
        ].map((item) => (
          <View key={item.label} style={styles.learnStatCard}>
            <View style={styles.learnStatIcon}><Icon name={item.icon} size={17} color={LEARN_COLORS.forest} /></View>
            <AppText style={styles.learnStatValue}>{item.value}</AppText>
            <AppText style={styles.learnStatLabel}>{item.label}</AppText>
          </View>
        ))}
      </View>
    </>
  );

  const renderExplore = () => (
    <>
      {header('FIND YOUR NEXT STEP', 'Explore', 'Choose a guide or a short read.')}
      <View style={styles.learnExploreSwitch}>
        {[
          { id: 'guides', label: 'Lessons' },
          { id: 'reads', label: 'Short reads' },
        ].map((kind) => {
          const selected = exploreKind === kind.id;
          return (
            <Press
              key={kind.id}
              onPress={() => setExploreKind(kind.id)}
              style={[styles.learnExploreTab, selected && styles.learnExploreTabSelected]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <AppText style={[styles.learnExploreTabText, selected && styles.learnExploreTabTextSelected]}>{kind.label}</AppText>
            </Press>
          );
        })}
      </View>
      {exploreKind === 'guides' ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.learnFilterRow}>
            {guideCategories.map((category) => (
              <Press
                key={category}
                onPress={() => setFilter(category)}
                style={[styles.learnFilterChip, filter === category && styles.learnFilterChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`Filter lessons by ${category}`}
                accessibilityState={{ selected: filter === category }}
              >
                <AppText style={[styles.learnFilterText, filter === category && styles.learnFilterTextActive]}>{category}</AppText>
              </Press>
            ))}
          </ScrollView>
          {guideGroups.map((group) => (
            <View key={group.category} style={styles.learnExploreGroup}>
              <AppText style={styles.learnGroupTitle}>{group.category}</AppText>
              <View style={styles.learnExploreList}>
                {group.guides.map((guide, index) => {
                  const complete = completedGuides.has(guide.id);
                  return (
                    <Press
                      key={guide.id}
                      onPress={() => onGuide(guide.id)}
                      style={[styles.learnGuideRow, index === group.guides.length - 1 && styles.topicRowLast]}
                      accessibilityRole="button"
                      accessibilityLabel={`${complete ? 'Revisit' : 'Start'} ${guide.title}, ${guide.duration}`}
                    >
                      <View style={[styles.learnGuideIcon, complete && styles.learnGuideIconComplete]}>
                        <Icon name={complete ? 'checkmark' : guide.icon} size={19} color={LEARN_COLORS.forest} />
                      </View>
                      <View style={styles.learnGuideCopy}>
                        <AppText style={styles.learnGuideTitle}>{guide.title}</AppText>
                        <AppText style={styles.learnGuideSubtitle}>{guide.subtitle}</AppText>
                      </View>
                      <AppText style={styles.learnGuideDuration}>{guide.duration}</AppText>
                      <Icon name="chevron-forward" size={16} color={LEARN_COLORS.muted} />
                    </Press>
                  );
                })}
              </View>
            </View>
          ))}
        </>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicCategoryRow}>
            {TOPIC_CATEGORIES.map((category) => (
              <Press
                key={category}
                onPress={() => setTopicCategory(category)}
                style={[styles.topicCategoryChip, topicCategory === category && styles.topicCategoryChipActive]}
                accessibilityRole="button"
                accessibilityLabel={`Show ${category} topic guides`}
                accessibilityState={{ selected: topicCategory === category }}
              >
                <AppText style={[styles.topicCategoryText, topicCategory === category && styles.topicCategoryTextActive]}>{category}</AppText>
              </Press>
            ))}
          </ScrollView>
          <View style={styles.topicList}>
            {visibleTopics.map((topic, index) => (
              <Press
                key={topic.id}
                onPress={() => onArticle(topic.id)}
                style={[styles.topicRow, index === visibleTopics.length - 1 && styles.topicRowLast]}
                accessibilityRole="button"
                accessibilityLabel={`Read ${topic.title}. ${topic.preview}`}
              >
                <View style={styles.topicRowIcon}><Icon name="book-outline" size={18} color={LEARN_COLORS.forest} /></View>
                <View style={styles.topicRowCopy}>
                  <AppText style={styles.topicRowTitle}>{topic.title}</AppText>
                  <AppText style={styles.topicRowPreview}>{topic.preview}</AppText>
                </View>
                <Icon name="chevron-forward" size={17} color={LEARN_COLORS.muted} />
              </Press>
            ))}
          </View>
        </>
      )}
    </>
  );

  const renderAwards = () => (
    <>
      {header('SMALL WINS', 'Achievements', `${earnedBadgeCount} of ${badges.length} earned`)}
      <View style={styles.learnAwardsGrid}>
        {badges.map((badge) => (
          <View key={badge.id} style={[styles.learnAwardCard, badge.earned && styles.learnAwardCardEarned]}>
            <View style={[styles.learnAwardMedal, badge.earned && styles.learnAwardMedalEarned]}>
              <Svg width="60" height="60" viewBox="0 0 60 60">
                <Path d="M30 3 52 16v27L30 57 8 43V16z" fill={badge.earned ? LEARN_COLORS.forestLight : COLORS.canvas} stroke={badge.earned ? LEARN_COLORS.forest : COLORS.line} strokeWidth="2" />
              </Svg>
              <View style={styles.learnAwardIcon}>
                <Icon name={badge.earned ? badge.icon : 'lock-closed-outline'} size={20} color={badge.earned ? LEARN_COLORS.forest : COLORS.muted} />
              </View>
            </View>
            <AppText style={styles.learnAwardTitle}>{badge.title}</AppText>
            <AppText style={styles.learnAwardStatus}>{badge.earned ? 'Earned' : badge.progress}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.learnEncouragement}>
        <Icon name="sparkles-outline" size={18} color={LEARN_COLORS.gold} />
        <AppText style={styles.learnEncouragementText}>Every badge comes from real steps you take. There is no rush.</AppText>
      </View>
    </>
  );

  const renderProfile = () => (
    <>
      {header('YOUR JOURNEY', 'Your profile', 'A little record of how far you have come.')}
      <View style={styles.learnProfileCard}>
        <View style={styles.learnAvatar}>
          {user.name ? (
            <AppText style={styles.learnAvatarInitial}>{user.name.trim().charAt(0).toUpperCase()}</AppText>
          ) : (
            <Icon name="person-outline" size={28} color={LEARN_COLORS.forest} />
          )}
        </View>
        <AppText style={styles.learnProfileName}>{user.name || 'Your learning journey'}</AppText>
        <AppText style={styles.learnProfileLevel}>LEVEL {level} · {totalXp.toLocaleString()} XP</AppText>
      </View>
      <View style={styles.learnProfileStats}>
        {[
          { value: `${streak}`, label: 'Day streak', icon: 'flame-outline' },
          { value: `${completedGuides.size}`, label: 'Guides', icon: 'book-outline' },
          { value: `${user.readVerses.length}`, label: 'Verses', icon: 'reader-outline' },
          { value: `${earnedBadgeCount}`, label: 'Awards', icon: 'ribbon-outline' },
        ].map((item) => (
          <View key={item.label} style={styles.learnProfileStat}>
            <Icon name={item.icon} size={17} color={LEARN_COLORS.forest} />
            <AppText style={styles.learnProfileStatValue}>{item.value}</AppText>
            <AppText style={styles.learnProfileStatLabel}>{item.label}</AppText>
          </View>
        ))}
      </View>
      <View style={styles.learnProfileSectionHeading}>
        <AppText style={styles.learnMapTitle}>Recent achievements</AppText>
        <Press onPress={() => setActiveView('awards')} accessibilityRole="button">
          <AppText style={styles.learnTextLink}>See all</AppText>
        </Press>
      </View>
      <View style={styles.learnProfileBadges}>
        {badges.slice(0, 4).map((badge) => (
          <View key={badge.id} style={styles.learnProfileBadge}>
            <View style={[styles.learnProfileBadgeIcon, badge.earned && styles.learnProfileBadgeIconEarned]}>
              <Icon name={badge.earned ? badge.icon : 'lock-closed-outline'} size={17} color={badge.earned ? LEARN_COLORS.forest : COLORS.muted} />
            </View>
            <AppText style={styles.learnProfileBadgeLabel} numberOfLines={1}>{badge.title}</AppText>
          </View>
        ))}
      </View>
      <Press onPress={() => setActiveView('progress')} style={styles.learnProfileAction} accessibilityRole="button">
        <Icon name="stats-chart-outline" size={17} color={LEARN_COLORS.forest} />
        <AppText style={styles.learnProfileActionText}>View your progress</AppText>
        <Icon name="chevron-forward" size={16} color={LEARN_COLORS.muted} />
      </Press>
    </>
  );

  return (
    <View style={styles.learnGameRoot}>
      <ScrollView style={styles.learnGameScroll} contentContainerStyle={styles.learnGameContent} showsVerticalScrollIndicator={false}>
        {activeView === 'path' ? renderPath() : null}
        {activeView === 'progress' ? renderProgress() : null}
        {activeView === 'explore' ? renderExplore() : null}
        {activeView === 'awards' ? renderAwards() : null}
        {activeView === 'profile' ? renderProfile() : null}
        <AppText style={styles.learnGameDisclaimer}>Your progress stays on this device. No deadlines, no comparisons.</AppText>
      </ScrollView>
    </View>
  );
}

function PrayerStepIllustration({ type }) {
  const captions = {
    prepare: ['Get ready', 'Wudu · clean clothes · face the qibla'],
    standing: ['Stand facing the qibla', 'Begin upright and comfortable'],
    reciting: ['Recite while standing', 'Take the words at your own pace'],
    bowing: ['Bow, then rise upright', 'Rest your hands on your knees'],
    prostrating: ['Prostrate as you are able', 'Move within your comfort'],
    sitAgain: ['Sit, then prostrate again', 'This completes the first rak‘ah'],
    sitting: ['Sit for the testimony', 'Follow the transliteration below'],
    peace: ['Turn right, then left', 'Finish with the greeting of peace'],
  };
  const caption = captions[type];
  if (!caption) return null;

  return (
    <View style={styles.prayerStepVisual} accessibilityRole="image" accessibilityLabel={`${caption[0]}. ${caption[1]}`}>
      <View style={styles.prayerStepArtwork}>
        <Svg width="84" height="70" viewBox="0 0 120 80">
          <Path d="M9 67h102" stroke="#E9DAD6" strokeWidth="2" strokeLinecap="round" />
          {type === 'prepare' ? (
            <>
              <Path d="M35 17c-3 5-7 9-7 13a7 7 0 0 0 14 0c0-4-4-8-7-13zM60 10c-3 5-7 9-7 13a7 7 0 0 0 14 0c0-4-4-8-7-13zM85 17c-3 5-7 9-7 13a7 7 0 0 0 14 0c0-4-4-8-7-13z" fill="#E9B8AF" />
              <Path d="M26 48h68l-6 15H32z" fill="#F6E7E1" stroke={PRAYER_HERO_COLOR} strokeWidth="2.5" strokeLinejoin="round" />
            </>
          ) : null}
          {type === 'standing' || type === 'reciting' ? (
            <>
              <Circle cx="60" cy="14" r="7" fill="#C8917E" />
              <Path d="M60 23v24M60 29L46 41M60 29L74 41M60 47L50 65M60 47L70 65" fill="none" stroke={PRAYER_HERO_COLOR} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              {type === 'reciting' ? <Path d="M49 35l11 5 11-5" fill="none" stroke="#D18A7E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}
            </>
          ) : null}
          {type === 'bowing' ? (
            <>
              <Circle cx="39" cy="29" r="7" fill="#C8917E" />
              <Path d="M46 31l19 11 13 3M53 35l10 15 13-5M65 42l-12 23M65 42l15 23" fill="none" stroke={PRAYER_HERO_COLOR} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : null}
          {type === 'prostrating' ? (
            <>
              <Circle cx="30" cy="49" r="6" fill="#C8917E" />
              <Path d="M36 49l26 3 16 1M42 50l-9 13M62 52l-2 13M77 53l13 12" fill="none" stroke={PRAYER_HERO_COLOR} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : null}
          {type === 'sitting' || type === 'sitAgain' || type === 'peace' ? (
            <>
              <Circle cx="43" cy="20" r="7" fill="#C8917E" />
              <Path d="M44 28l5 18-11 10 26 1 11 7M48 38l-15 9M49 40l16 8" fill="none" stroke={PRAYER_HERO_COLOR} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              {type === 'sitAgain' ? <Path d="M84 33a11 11 0 0 1 0 17m0-17-4 5m4-5 4 5" fill="none" stroke="#D18A7E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
              {type === 'peace' ? <Path d="M20 32h10m-10 0 4-4m-4 4 4 4m72-4H86m10 0-4-4m4 4-4 4" fill="none" stroke="#D18A7E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
            </>
          ) : null}
        </Svg>
      </View>
      <View style={styles.prayerStepVisualCopy}>
        <AppText style={styles.prayerStepVisualTitle}>{caption[0]}</AppText>
        <AppText style={styles.prayerStepVisualHint}>{caption[1]}</AppText>
      </View>
    </View>
  );
}

function WuduStepIllustration({ type }) {
  const captions = {
    prepare: ['Get ready', 'Set your intention and prepare clean water'],
    hands: ['Hands up to the wrists', 'Wash between your fingers'],
    rinse: ['Mouth and nose', 'Rinse gently and comfortably'],
    face: ['Wash the whole face', 'Hairline to chin · ear to ear'],
    arms: ['Right, then left', 'Include each elbow'],
    head: ['Wipe over the head', 'Use wet hands'],
    feet: ['Right, then left', 'Include ankles and between toes'],
    finish: ['Pause and reflect', 'Learn the details at your own pace'],
  };
  const caption = captions[type];
  if (!caption) return null;

  return (
    <View style={styles.prayerStepVisual} accessibilityRole="image" accessibilityLabel={`${caption[0]}. ${caption[1]}`}>
      <View style={styles.prayerStepArtwork}>
        <Svg width="84" height="70" viewBox="0 0 120 80">
          <Path d="M9 67h102" stroke="#D7DCD4" strokeWidth="2" strokeLinecap="round" />
          {type === 'prepare' ? (
            <>
              <Circle cx="60" cy="38" r="26" fill="#F5E9E5" />
              <Path d="M37 47h46l-5 14H42z" fill="#AEC4B6" stroke="#476957" strokeWidth="2.5" strokeLinejoin="round" />
              <Path d="M47 22c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8zm13-6c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8zm13 6c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8z" fill="#6F9A83" />
            </>
          ) : null}
          {type === 'hands' ? (
            <>
              <Path d="M44 58V43c0-4 6-4 6 0v5V33c0-4 6-4 6 0v15V29c0-4 6-4 6 0v19V32c0-4 6-4 6 0v20l5-3c4-2 7 2 4 5l-9 10c-4 4-11 4-15 0z" fill="#E8D9C6" stroke="#476957" strokeWidth="2.5" strokeLinejoin="round" />
              <Path d="M36 29c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8zm46-5c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8z" fill="#6F9A83" />
            </>
          ) : null}
          {type === 'rinse' || type === 'face' ? (
            <>
              <Circle cx="60" cy="39" r="21" fill="#F2E7DA" stroke="#476957" strokeWidth="2.5" />
              <Path d="M51 36h3m12 0h3m-10 6h2m-6 7q5 4 10 0" fill="none" stroke="#476957" strokeWidth="2" strokeLinecap="round" />
              {type === 'rinse' ? (
                <Path d="M34 30c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8zm52 0c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8z" fill="#6F9A83" />
              ) : (
                <Path d="M37 43a24 24 0 0 1 4-20m42 20a24 24 0 0 0-4-20m-38 4 1-7 7 2m30 0 7-2 1 7" fill="none" stroke="#B96955" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </>
          ) : null}
          {type === 'arms' ? (
            <>
              <Path d="M43 22v29q0 9 8 9t8-9V22M62 22v29q0 9 8 9t8-9V22" fill="none" stroke="#476957" strokeWidth="3" strokeLinecap="round" />
              <Path d="M41 43h19m0 0h20" fill="none" stroke="#B96955" strokeWidth="2.5" strokeLinecap="round" />
              <Path d="M37 30c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8zm46 0c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8z" fill="#6F9A83" />
            </>
          ) : null}
          {type === 'head' ? (
            <>
              <Circle cx="60" cy="43" r="21" fill="#F2E7DA" stroke="#476957" strokeWidth="2.5" />
              <Path d="M43 29c8-10 26-10 34 0m-3-1-1-6m1 6 6-2" fill="none" stroke="#B96955" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M51 42h3m12 0h3m-10 7q2 2 4 0" fill="none" stroke="#476957" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : null}
          {type === 'feet' ? (
            <>
              <Path d="M43 26v22c0 11 7 16 14 13 4-2 3-6 0-9l-5-5V26c0-5-9-5-9 0zm27 0v22c0 11 7 16 14 13 4-2 3-6 0-9l-5-5V26c0-5-9-5-9 0z" fill="#E8D9C6" stroke="#476957" strokeWidth="2.5" strokeLinejoin="round" />
              <Path d="M59 23c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8zm10 1c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8z" fill="#6F9A83" />
            </>
          ) : null}
          {type === 'finish' ? (
            <>
              <Circle cx="60" cy="40" r="25" fill="#EEF2EA" />
              <Path d="m46 40 9 9 19-21" fill="none" stroke="#476957" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M29 30c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8zm62 0c-2 3-4 5-4 8a4 4 0 0 0 8 0c0-3-2-5-4-8z" fill="#6F9A83" />
            </>
          ) : null}
        </Svg>
      </View>
      <View style={styles.prayerStepVisualCopy}>
        <AppText style={styles.prayerStepVisualTitle}>{caption[0]}</AppText>
        <AppText style={styles.prayerStepVisualHint}>{caption[1]}</AppText>
      </View>
    </View>
  );
}

function GuideScreen({ guide, stepIndex, setStepIndex, completed, onComplete, onBack, onArticle, onVideo, onGuide }) {
  const step = guide.steps[stepIndex];
  const first = stepIndex === 0;
  const last = stepIndex === guide.steps.length - 1;
  const [videoStart, setVideoStart] = useState(0);
  const [activeVideoChapter, setActiveVideoChapter] = useState(null);
  const [videoAutoplay, setVideoAutoplay] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [prayerRecitationMode, setPrayerRecitationMode] = useState('say-it');
  const prayerRecitations = [
    { key: 'arabic', label: 'Arabic', value: step.arabic, style: styles.arabicLine },
    { key: 'say-it', label: 'Say it', value: step.transliteration, style: styles.transliteration },
    { key: 'meaning', label: 'Meaning', value: step.translation, style: styles.translation },
  ].filter((item) => item.value);
  const activePrayerRecitation = prayerRecitations.find((item) => item.key === prayerRecitationMode)
    || prayerRecitations[0];

  useEffect(() => {
    setVideoStart(0);
    setActiveVideoChapter(null);
    setVideoAutoplay(false);
    setVideoStarted(false);
    setPrayerRecitationMode('say-it');
  }, [guide.id, guide.title]);

  return (
    <View style={[styles.detailRoot, guide.id === 'prayer' && styles.prayerGuideRoot]}>
      <View style={styles.detailHeader}>
        <Press onPress={onBack} style={styles.backButton} accessibilityLabel="Back to guides">
          <Icon name="arrow-back" size={21} color={COLORS.ink} />
        </Press>
        <View style={{ flex: 1 }}>
          <AppText style={styles.detailHeaderTitle}>{guide.title}</AppText>
          <AppText style={styles.detailHeaderStep}>STEP {stepIndex + 1} OF {guide.steps.length}</AppText>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.detailProgress}><ProgressBar progress={(stepIndex + 1) / guide.steps.length} /></View>
      <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        {guide.id === 'prayer' ? (
          <>
            <View style={styles.prayerGuideIntro}>
              <AppText style={styles.prayerGuideEyebrow}>LEARN TO PRAY</AppText>
              <AppText style={styles.prayerGuideIntroTitle}>One calm step at a time.</AppText>
              <View style={styles.prayerGuideBadges}>
                <View style={styles.prayerGuideBadge}>
                  <AppText style={styles.prayerGuideBadgeText}>
                    {guide.rakahs ? `${guide.rakahs} rak‘ahs · ${guide.title.replace(' prayer', '')}` : guide.subtitle}
                  </AppText>
                </View>
                <View style={styles.prayerGuideBadge}>
                  <AppText style={styles.prayerGuideBadgeText}>No rush</AppText>
                </View>
              </View>
              <AppText style={styles.prayerGuideDescription} numberOfLines={2}>{guide.intro}</AppText>
            </View>
            <View style={styles.prayerBeforeBegin}>
              <AppText style={styles.prayerBeforeBeginTitle}>Before you begin</AppText>
              <View style={styles.prayerBeforeBeginItems}>
                <Press onPress={() => onGuide('wudu')} style={styles.prayerBeforeBeginItem} accessibilityLabel="Make wudu before prayer">
                  <View style={styles.prayerBeforeBeginIcon}><Icon name="water-outline" size={17} color={PRAYER_ACCENT} /></View>
                  <AppText style={styles.prayerBeforeBeginText}>Make wudu</AppText>
                </Press>
                <View style={styles.prayerBeforeBeginItem}>
                  <View style={styles.prayerBeforeBeginIcon}><Icon name="navigate-outline" size={17} color={PRAYER_ACCENT} /></View>
                  <AppText style={styles.prayerBeforeBeginText}>Face Qibla</AppText>
                </View>
                <View style={styles.prayerBeforeBeginItem}>
                  <View style={styles.prayerBeforeBeginIcon}><Icon name="heart-outline" size={17} color={PRAYER_ACCENT} /></View>
                  <AppText style={styles.prayerBeforeBeginText}>Set intention</AppText>
                </View>
              </View>
            </View>
            <View style={styles.prayerRakahOverview}>
              <View style={styles.prayerRakahOverviewIcon}><Icon name="body-outline" size={18} color={PRAYER_HERO_COLOR} /></View>
              <View style={styles.prayerRakahOverviewCopy}>
                <AppText style={styles.prayerRakahOverviewTitle}>One rak‘ah at a glance</AppText>
                <AppText style={styles.prayerRakahOverviewText}>
                  {PRAYER_VOCABULARY.find((item) => item.term === 'Rak‘ah').meaning}
                </AppText>
              </View>
            </View>
          </>
        ) : guide.id === 'wudu' ? (
          <View style={styles.wuduGuideIntro}>
            <View style={styles.wuduGuideIcon}><Icon name="water-outline" size={22} color={COLORS.green} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Eyebrow>BEFORE YOU PRAY · 8 STEPS</Eyebrow>
              <AppText style={styles.prayerGuideDescription}>{guide.intro}</AppText>
            </View>
          </View>
        ) : (
          <View style={styles.detailHero}>
            <EditorialMotif />
            <View style={styles.detailHeroIcon}><Icon name={guide.icon} size={25} color={COLORS.green} /></View>
            <Eyebrow>{guide.category.toUpperCase()} · {guide.duration}</Eyebrow>
            <AppText style={styles.detailHeroTitle}>{guide.title}</AppText>
            <AppText style={styles.detailHeroIntro}>{guide.intro}</AppText>
          </View>
        )}
        {guide.id === 'prayer' && guide.videoId && !videoStarted ? (
          <Press
            onPress={() => {
              setVideoStarted(true);
              setVideoAutoplay(true);
            }}
            style={styles.prayerGuideVideo}
            accessibilityLabel="Watch a prayer walkthrough"
          >
            <View style={styles.prayerGuideVideoIcon}><Icon name="play" size={15} color={PRAYER_ACCENT} /></View>
            <View style={styles.prayerGuideVideoCopy}>
              <AppText style={styles.prayerGuideVideoTitle}>Watch a prayer walkthrough</AppText>
              <AppText style={styles.prayerGuideVideoMeta}>Optional video · Green Lane Masjid</AppText>
            </View>
            <Icon name="chevron-forward" size={16} color={COLORS.muted} />
          </Press>
        ) : guide.videoId ? (
          <View style={styles.followAlongSection}>
            <View style={styles.followAlongHeading}>
              <View style={{ flex: 1 }}>
                <Eyebrow>WATCH & FOLLOW ALONG</Eyebrow>
                <AppText style={styles.followAlongTitle}>{guide.videoSectionTitle || 'See each prayer in motion'}</AppText>
              </View>
              {guide.videoDuration ? (
                <View style={styles.videoDuration}><AppText style={styles.videoDurationText}>{guide.videoDuration}</AppText></View>
              ) : null}
            </View>
            <View style={styles.followAlongPlayer}>
              {videoStarted ? (
                <PrayerVideoPlayer
                  videoId={guide.videoId}
                  startSeconds={videoStart}
                  autoPlay={videoAutoplay}
                  title={guide.videoTitle}
                />
              ) : (
                <View style={styles.videoThumbnail}>
                  <Image
                    source={{ uri: `https://i.ytimg.com/vi/${encodeURIComponent(guide.videoId)}/hqdefault.jpg` }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    accessibilityLabel={`${guide.videoTitle} video thumbnail`}
                  />
                  <LinearGradient
                    pointerEvents="none"
                    colors={['#111A1740', '#111A17A8']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Press
                    onPress={() => {
                      setVideoStarted(true);
                      setVideoAutoplay(true);
                    }}
                    style={styles.videoPlayButton}
                    accessibilityLabel={`Play the ${guide.title} video`}
                  >
                    <Icon name="play" size={25} color={COLORS.white} />
                  </Press>
                  <AppText style={styles.videoThumbnailCaption}>
                    {guide.videoThumbnailCaption || 'WATCH THE FULL PRAYER WALKTHROUGH'}
                  </AppText>
                </View>
              )}
            </View>
            <View style={styles.videoAttribution}>
              <Icon name="logo-youtube" size={17} color={COLORS.danger} />
              <View style={{ flex: 1 }}>
                <AppText style={styles.videoTitle}>{guide.videoTitle}</AppText>
                <AppText style={styles.videoSource}>{guide.videoSource} · YouTube</AppText>
              </View>
            </View>
            <Press onPress={onVideo} style={styles.videoOpenLink} accessibilityLabel={`Open the full ${guide.title} video on YouTube`}>
              <AppText style={styles.videoOpenLinkText}>Open on YouTube</AppText>
              <Icon name="open-outline" size={15} color={COLORS.green} />
            </Press>
            <AppText style={styles.followAlongHint}>
              {guide.videoHint || 'Choose a chapter to jump to a prayer, then follow the lesson below for Arabic, transliteration and meaning.'}
            </AppText>
            {Array.isArray(guide.videoChapters) && guide.videoChapters.length > 0 ? (
              <>
                <AppText style={styles.videoChaptersLabel}>JUMP TO A PART</AppText>
                <View style={styles.videoChapters}>
                  {guide.videoChapters.map((chapter, index) => {
                    const selected = activeVideoChapter === index;
                    return (
                      <Press
                        key={chapter.title}
                        onPress={() => {
                          setVideoStart(chapter.seconds);
                          setActiveVideoChapter(index);
                          setVideoAutoplay(true);
                          setVideoStarted(true);
                        }}
                        style={[styles.videoChapter, selected && styles.videoChapterSelected]}
                        accessibilityRole="button"
                        accessibilityLabel={`Jump to ${chapter.title} at ${chapter.timestamp}`}
                        accessibilityState={{ selected }}
                      >
                        <AppText style={[styles.videoChapterTitle, selected && styles.videoChapterTitleSelected]}>{chapter.title}</AppText>
                        <AppText style={[styles.videoChapterTime, selected && styles.videoChapterTitleSelected]}>{chapter.timestamp}</AppText>
                      </Press>
                    );
                  })}
                </View>
              </>
            ) : null}
          </View>
        ) : null}
        {guide.id === 'prayer' ? (
          <View style={styles.prayerStepNavigator}>
            <View style={styles.prayerStepNavigatorHeader}>
              <AppText style={styles.prayerStepNavigatorTitle}>Steps</AppText>
              <AppText style={styles.prayerStepNavigatorCount}>{stepIndex + 1} / {guide.steps.length}</AppText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prayerStepList}>
              {guide.steps.map((item, index) => {
                const selected = index === stepIndex;
                return (
                  <Press
                    key={item.title}
                    onPress={() => setStepIndex(index)}
                    style={[styles.prayerStepChip, selected && styles.prayerStepChipSelected]}
                    accessibilityRole="button"
                    accessibilityLabel={`Go to step ${index + 1}: ${item.title}`}
                    accessibilityState={{ selected }}
                  >
                    <AppText style={[styles.prayerStepChipText, selected && styles.prayerStepChipTextSelected]}>{index + 1}</AppText>
                  </Press>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={guide.id === 'prayer' ? styles.prayerCurrentStepCard : null}>
          <View style={[styles.stepHeadingRow, guide.id === 'prayer' && styles.prayerStepHeadingRow]}>
            <View style={styles.stepIndex}><AppText style={styles.stepIndexText}>{String(stepIndex + 1).padStart(2, '0')}</AppText></View>
            <AppText style={[styles.stepTitle, guide.id === 'prayer' && styles.prayerStepTitle]}>{step.title}</AppText>
          </View>
          {guide.id === 'prayer' ? <PrayerStepIllustration type={step.visual} /> : null}
          {guide.id === 'wudu' ? <WuduStepIllustration type={step.visual} /> : null}
          <AppText style={[styles.stepBody, guide.id === 'prayer' && styles.prayerStepBody]}>{step.body}</AppText>
          {guide.id === 'prayer' && prayerRecitations.length > 0 ? (
            <>
              <View style={styles.prayerRecitationTabs}>
                {prayerRecitations.map((item) => {
                  const selected = item.key === activePrayerRecitation.key;
                  return (
                    <Press
                      key={item.key}
                      onPress={() => setPrayerRecitationMode(item.key)}
                      style={[styles.prayerRecitationTab, selected && styles.prayerRecitationTabSelected]}
                      accessibilityRole="tab"
                      accessibilityLabel={item.label}
                      accessibilityState={{ selected }}
                    >
                      <AppText style={[styles.prayerRecitationTabText, selected && styles.prayerRecitationTabTextSelected]}>{item.label}</AppText>
                    </Press>
                  );
                })}
              </View>
              <View style={styles.prayerRecitationCard}>
                {activePrayerRecitation ? (
                  <AppText style={activePrayerRecitation.style}>{activePrayerRecitation.value}</AppText>
                ) : null}
              </View>
            </>
          ) : (step.arabic || step.transliteration || step.translation) ? (
            <View style={styles.recitationCard}>
              {step.arabic ? <AppText style={styles.arabicLine}>{step.arabic}</AppText> : null}
              {step.transliteration ? <AppText style={styles.transliteration}>{step.transliteration}</AppText> : null}
              {step.translation ? <AppText style={styles.translation}>{step.translation}</AppText> : null}
            </View>
          ) : null}
          {guide.id !== 'prayer' || step.arabic || step.transliteration || step.translation ? (
            <View style={styles.tipCard}>
              <Icon name="information-circle-outline" size={20} color={COLORS.green} />
              <AppText style={styles.tipText}>
                {guide.id === 'prayer'
                  ? 'Take your time. Pronunciation grows with practice.'
                  : 'Transliteration is a learning aid. Listen, ask questions and learn pronunciation with a trusted teacher.'}
              </AppText>
            </View>
          ) : null}
        </View>
        <View style={styles.inlineResources}>
          <Eyebrow>KEEP LEARNING</Eyebrow>
          {!guide.videoId ? (
            <Press onPress={onVideo} style={styles.inlineResourceRow}>
              <View style={styles.inlineResourceIcon}><Icon name="logo-youtube" size={18} color={COLORS.danger} /></View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.inlineResourceTitle}>Watch a video guide</AppText>
                <AppText style={styles.inlineResourceSub}>Search trusted beginner resources on YouTube</AppText>
              </View>
              <Icon name="open-outline" size={18} color={COLORS.muted} />
            </Press>
          ) : null}
          <Press onPress={onArticle} style={styles.inlineResourceRow}>
            <View style={styles.inlineResourceIcon}><Icon name="newspaper-outline" size={18} color={COLORS.green} /></View>
            <View style={{ flex: 1 }}>
              <AppText style={styles.inlineResourceTitle}>Read the companion article</AppText>
              <AppText style={styles.inlineResourceSub}>A little more context, whenever you’re ready</AppText>
            </View>
            <Icon name="chevron-forward" size={18} color={COLORS.muted} />
          </Press>
        </View>
      </ScrollView>
      <View style={[styles.detailActions, guide.id === 'prayer' && styles.prayerGuideActions]}>
        <Press onPress={() => setStepIndex(Math.max(0, stepIndex - 1))} style={[styles.detailPrevious, first && styles.detailPreviousDisabled]} disabled={first}>
          <Icon name="arrow-back" size={20} color={first ? '#B7BEB8' : COLORS.green} />
        </Press>
        {last ? (
          <ActionButton
            label={completed ? 'Finished · revisit anytime' : 'Finish this guide'}
            icon={completed ? 'checkmark' : 'checkmark-circle-outline'}
            onPress={() => {
              onComplete();
              onBack();
            }}
            style={{ flex: 1 }}
          />
        ) : (
          <ActionButton label="Next step" icon="arrow-forward" onPress={() => setStepIndex(stepIndex + 1)} style={{ flex: 1 }} />
        )}
      </View>
    </View>
  );
}

function QuranScreen({
  showArabic,
  showTransliteration,
  showMeaning,
  readVerses,
  setShowArabic,
  setShowTransliteration,
  setShowMeaning,
  onExternal,
  onToggleVerse,
}) {
  const verses = [
    { arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', transliteration: 'Bismillahir-Rahmanir-Raheem', meaning: 'In the name of Allah, the Most Compassionate, the Most Merciful.' },
    { arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', transliteration: 'Alhamdu lillahi Rabbil-‘alameen', meaning: 'All praise is for Allah, Lord of all worlds.' },
    { arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', transliteration: 'Ar-Rahmanir-Raheem', meaning: 'The Most Compassionate, the Most Merciful.' },
    { arabic: 'مَالِكِ يَوْمِ الدِّينِ', transliteration: 'Maliki yawmid-deen', meaning: 'Master of the Day of Judgement.' },
    { arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', transliteration: 'Iyyaka na‘budu wa iyyaka nasta‘een', meaning: 'You alone we worship, and You alone we ask for help.' },
    { arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', transliteration: 'Ihdinas-siratal-mustaqeem', meaning: 'Guide us along the straight path.' },
    { arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', transliteration: 'Siratal-ladheena an‘amta ‘alayhim ghayril-maghdubi ‘alayhim wa lad-dalleen', meaning: 'The path of those You have blessed, not those who earned anger, or those who are astray.' },
  ];
  return (
    <Page>
      <ScreenTitle
        eyebrow="Read, listen, reflect"
        title="The Quran"
        description="Begin with Al-Fatihah, the opening chapter. Take one line at a time."
      />
      <LinearGradient colors={['#321D17', '#5A3B2A']} style={styles.quranWelcome}>
        <EditorialMotif />
        <View style={styles.quranWelcomeContent}>
          <Eyebrow light>THE OPENING · 1:1–7</Eyebrow>
          <AppText style={styles.quranWelcomeTitle}>Al-Fatihah</AppText>
          <AppText style={styles.quranWelcomeSub}>A prayer for guidance, recited in every unit of salah.</AppText>
          <AppText style={styles.quranPracticeCount}>{readVerses.length} of 7 lines practiced</AppText>
          <Press onPress={() => onExternal('https://quran.com/1')} style={styles.quranListen}>
            <Icon name="play-circle-outline" size={23} color={COLORS.white} />
            <AppText style={styles.quranListenText}>Listen to a recitation</AppText>
            <Icon name="open-outline" size={15} color={COLORS.white} />
          </Press>
        </View>
      </LinearGradient>
      <View style={styles.readingControls}>
        <AppText style={styles.controlsLabel}>DISPLAY</AppText>
        <View style={styles.readingToggleRow}>
          {[
            ['Arabic', showArabic, setShowArabic],
            ['Transliteration', showTransliteration, setShowTransliteration],
            ['Meaning', showMeaning, setShowMeaning],
          ].map(([label, visible, setter]) => (
            <Press
              key={label}
              onPress={() => setter(!visible)}
              style={[styles.readingToggle, visible && styles.readingToggleOn]}
              accessibilityRole="checkbox"
              accessibilityLabel={`Show ${label}`}
              accessibilityState={{ checked: visible }}
            >
              <Icon name={visible ? 'checkmark' : 'add'} size={13} color={visible ? COLORS.green : COLORS.muted} />
              <AppText style={[styles.readingToggleText, visible && styles.readingToggleTextOn]}>{label}</AppText>
            </Press>
          ))}
        </View>
      </View>
      <View style={styles.verseList}>
        {verses.map((verse, index) => (
          <Press
            key={index}
            onPress={() => onToggleVerse(index + 1)}
            style={[styles.verseCard, readVerses.includes(index + 1) && styles.verseCardRead]}
            accessibilityRole="checkbox"
            accessibilityLabel={`Mark Al-Fatihah line ${index + 1} ${readVerses.includes(index + 1) ? 'not practiced' : 'practiced'}`}
            accessibilityState={{ checked: readVerses.includes(index + 1) }}
          >
            <View style={styles.verseTopline}>
              <View style={styles.verseNumber}><AppText style={styles.verseNumberText}>{index + 1}</AppText></View>
              <AppText style={styles.verseReference}>AL-FATIHAH · {index + 1}</AppText>
              {readVerses.includes(index + 1) && <Icon name="checkmark-circle" size={18} color={COLORS.red} />}
            </View>
            {showArabic && <AppText style={styles.verseArabic}>{verse.arabic}</AppText>}
            {showTransliteration && <AppText style={styles.verseTransliteration}>{verse.transliteration}</AppText>}
            {showMeaning && <AppText style={styles.verseMeaning}>{verse.meaning}</AppText>}
          </Press>
        ))}
      </View>
      <View style={styles.tipCard}>
        <Icon name="heart-outline" size={20} color={COLORS.green} />
        <AppText style={styles.tipText}>Translations express meaning; they are not a replacement for the Arabic Quran. Pronunciation takes time — learn gently with a teacher.</AppText>
      </View>
      <ActionButton label="Open Quran.com" icon="open-outline" kind="secondary" onPress={() => onExternal('https://quran.com/1')} style={{ marginTop: 14 }} />
    </Page>
  );
}

function PrayerScreen({ user, schedule, now, todaysPrayers, onTogglePrayer, onLocation, locationBusy, onGuide, onPrayerGuide, onNotice }) {
  const next = schedule.entries.find((prayer) => prayer.time > now);
  const upcomingPrayer = next || (schedule.tomorrowFajr
    ? { ...PRAYERS[0], time: schedule.tomorrowFajr }
    : null);
  const completed = PRAYERS.filter((prayer) => todaysPrayers.includes(prayer.key)).length;
  const countdownSeconds = upcomingPrayer
    ? Math.max(0, Math.floor((upcomingPrayer.time.getTime() - now.getTime()) / 1000))
    : null;
  const countdown = countdownSeconds === null
    ? null
    : `${Math.floor(countdownSeconds / 3600)}h ${String(Math.floor((countdownSeconds % 3600) / 60)).padStart(2, '0')}m`;
  const [qiblaResult, setQiblaResult] = useState(null);
  const [qiblaBusy, setQiblaBusy] = useState(false);
  const [qiblaError, setQiblaError] = useState('');
  const [compassActive, setCompassActive] = useState(false);
  const [compassHeading, setCompassHeading] = useState(null);
  const [compassUsesTrueHeading, setCompassUsesTrueHeading] = useState(null);
  const [compassStatus, setCompassStatus] = useState('');
  const [hapticError, setHapticError] = useState('');
  const [qiblaExpanded, setQiblaExpanded] = useState(true);
  const [learningExpanded, setLearningExpanded] = useState(true);
  const [learningTab, setLearningTab] = useState('prayer');
  const qiblaRequest = useRef(0);
  const alignmentHapticActive = useRef(false);
  const alignmentPulse = useRef(new Animated.Value(0)).current;
  const qiblaResultIsCurrent = qiblaResult
    && qiblaResult.latitude === user.location.latitude
    && qiblaResult.longitude === user.location.longitude;
  const qiblaBearing = qiblaResultIsCurrent ? qiblaResult.direction : schedule.qibla;
  const qiblaCardinal = Number.isFinite(qiblaBearing)
    ? getCompassDirection(qiblaBearing).split('-').map((direction) => direction[0]).join('')
    : null;
  const distanceToKaaba = getDistanceToKaaba(user.location);
  const dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(now);
  const wuduGuide = GUIDES.find((guide) => guide.id === 'wudu');
  const wuduSteps = wuduGuide.steps.filter((step) => step.visual !== 'finish');
  const previousPrayer = [...schedule.entries].reverse().find((prayer) => prayer.time <= now) || null;
  const prayerInterval = previousPrayer && upcomingPrayer
    ? upcomingPrayer.time.getTime() - previousPrayer.time.getTime()
    : 0;
  const prayerIntervalProgress = prayerInterval > 0
    ? Math.min(1, Math.max(0, (now.getTime() - previousPrayer.time.getTime()) / prayerInterval))
    : 0;
  const activityDaySet = new Set(user.activityDays);
  const recentActivityDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - index));
    const key = localDateKey(date);
    return { key, active: activityDaySet.has(key) };
  });
  const currentStreak = getCurrentStreak(user.activityDays, localDateKey(now));
  const rhythmLabel = currentStreak > 0 ? `${currentStreak}-day rhythm` : 'Start a gentle rhythm';
  const qiblaSummary = Number.isFinite(qiblaBearing)
    ? `${Math.round(qiblaBearing)}° ${qiblaCardinal} · ${distanceToKaaba === null ? 'to Makkah' : `${Math.round(distanceToKaaba).toLocaleString()} km to Makkah`}`
    : 'Direction unavailable';
  const relativeQiblaDirection = Number.isFinite(qiblaBearing)
    ? (qiblaBearing - (compassHeading === null ? 0 : compassHeading) + 360) % 360
    : 0;
  const qiblaAlignmentAngle = Math.min(relativeQiblaDirection, 360 - relativeQiblaDirection);
  const liveCompassActive = compassActive && qiblaResultIsCurrent;
  const isQiblaAligned = liveCompassActive
    && qiblaResultIsCurrent
    && compassHeading !== null
    && qiblaAlignmentAngle <= QIBLA_ALIGNMENT_TOLERANCE;
  const shouldRearmAlignmentHaptic = !compassActive
    || !qiblaResultIsCurrent
    || compassHeading === null
    || qiblaAlignmentAngle > QIBLA_HAPTIC_REARM_TOLERANCE;
  useEffect(() => {
    if (shouldRearmAlignmentHaptic) {
      alignmentHapticActive.current = false;
      setHapticError('');
      return;
    }
    if (!isQiblaAligned) {
      setHapticError('');
      return;
    }
    if (alignmentHapticActive.current) return;
    alignmentHapticActive.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((error) => {
      const detail = error instanceof Error ? error.message : 'Please try again.';
      setHapticError(`Aligned with Qibla, but vibration failed. ${detail}`);
    });
  }, [isQiblaAligned, shouldRearmAlignmentHaptic]);
  useEffect(() => {
    if (!isQiblaAligned) {
      alignmentPulse.stopAnimation();
      alignmentPulse.setValue(0);
      return undefined;
    }
    const pulse = Animated.loop(Animated.timing(alignmentPulse, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }));
    pulse.start();
    return () => pulse.stop();
  }, [alignmentPulse, isQiblaAligned]);
  useEffect(() => {
    if (!compassActive || !qiblaResultIsCurrent || Platform.OS === 'web') return undefined;
    let active = true;
    let subscription = null;
    const updateHeading = ({ trueHeading, magHeading }) => {
      if (!active) return;
      const usesTrueHeading = Number.isFinite(trueHeading) && trueHeading >= 0;
      const rawHeading = usesTrueHeading ? trueHeading : magHeading;
      if (!Number.isFinite(rawHeading) || rawHeading < 0) return;
      const heading = (rawHeading + 360) % 360;
      setCompassUsesTrueHeading(usesTrueHeading);
      setCompassHeading((previous) => {
        if (previous === null) return heading;
        const difference = ((heading - previous + 540) % 360) - 180;
        return (previous + difference * 0.2 + 360) % 360;
      });
      setCompassStatus(usesTrueHeading
        ? 'Hold your phone flat and turn until the marker reaches the top.'
        : 'Using magnetic north; accuracy may vary near magnets.');
    };
    Location.watchHeadingAsync(updateHeading, (reason) => {
      if (active) setCompassStatus(`Compass update failed. ${reason}`);
    }).then((nextSubscription) => {
      if (active) subscription = nextSubscription;
      else nextSubscription.remove();
    }).catch((error) => {
      const detail = error instanceof Error ? error.message : 'Please try again.';
      if (active) setCompassStatus(`The live compass could not start. ${detail}`);
    });
    return () => {
      active = false;
      if (subscription) subscription.remove();
    };
  }, [compassActive, qiblaResultIsCurrent]);
  useEffect(() => () => {
    qiblaRequest.current += 1;
  }, []);
  const findQibla = async () => {
    const requestId = qiblaRequest.current + 1;
    qiblaRequest.current = requestId;
    setQiblaBusy(true);
    setQiblaError('');
    setQiblaResult(null);
    setCompassActive(false);
    setCompassHeading(null);
    setCompassUsesTrueHeading(null);
    setCompassStatus('');
    setHapticError('');
    try {
      const location = await onLocation();
      if (requestId !== qiblaRequest.current) return;
      if (!location) {
        setQiblaError('Location access is needed to find Qibla. Try again and allow location when asked.');
        return;
      }
      const { latitude, longitude } = location;
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
        || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        throw new Error('Your current location is unavailable. Update location and try again.');
      }
      const response = await fetch(`https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`);
      if (!response.ok) throw new Error(`AlAdhan returned HTTP ${response.status}.`);
      const result = await response.json();
      const direction = result && result.data && result.data.direction;
      if (!result || result.code !== 200 || !Number.isFinite(direction) || direction < 0 || direction >= 360) {
        throw new Error('AlAdhan returned an invalid Qibla direction.');
      }
      if (requestId !== qiblaRequest.current) return;
      setQiblaResult({ direction: Math.round(direction) % 360, latitude, longitude });
      if (Platform.OS === 'web') {
        setCompassStatus('Live compass and alignment vibration are available in the iOS and Android app.');
        return;
      }
      setCompassActive(true);
      setCompassStatus('Starting live compass...');
    } catch (error) {
      const detail = error instanceof TypeError
        ? 'Check your internet connection and try again.'
        : error instanceof Error ? error.message : 'Please try again.';
      if (requestId === qiblaRequest.current) setQiblaError(`The Qibla direction could not be loaded. ${detail}`);
    } finally {
      if (requestId === qiblaRequest.current) setQiblaBusy(false);
    }
  };
  const openMaps = async () => {
    const query = encodeURIComponent('mosque near me');
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      onNotice(`Maps could not be opened: ${error.message}`);
    }
  };
  return (
    <Page scrollStyle={styles.prayerScroll} contentStyle={styles.prayerPage} bottom={112}>
      <View style={styles.prayerNextSection}>
        <View style={styles.prayerNextTopline}>
          <AppText style={styles.prayerNextLabel}>NEXT PRAYER</AppText>
          <AppText style={styles.prayerDate}>{dateLabel}</AppText>
        </View>
        <AppText style={styles.prayerNextName}>{upcomingPrayer?.name || 'Prayer'}</AppText>
        <View style={styles.prayerCountdownPill}>
          <View style={styles.prayerCountdownDot} />
          <AppText style={styles.prayerCountdownText}>
            {countdown ? `in ${countdown}` : 'Prayer time unavailable'}
          </AppText>
          {upcomingPrayer ? <AppText style={styles.prayerCountdownTime}>· {formatTime(upcomingPrayer.time)}</AppText> : null}
        </View>
        {previousPrayer && upcomingPrayer && prayerInterval > 0 ? (
          <View style={styles.prayerInterval}>
            <View
              style={styles.prayerIntervalTrack}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(prayerIntervalProgress * 100) }}
              accessibilityLabel="Time until the next prayer"
            >
              <View style={[styles.prayerIntervalFill, { width: `${prayerIntervalProgress * 100}%` }]} />
            </View>
            <View style={styles.prayerIntervalLabels}>
              <AppText style={styles.prayerIntervalLabel}>{previousPrayer.name} {formatTimeCompact(previousPrayer.time)}</AppText>
              <AppText style={styles.prayerIntervalLabel}>{upcomingPrayer.name} {formatTimeCompact(upcomingPrayer.time)}</AppText>
            </View>
          </View>
        ) : null}
        <View style={styles.prayerLocationBar}>
          <Icon name="location-outline" size={13} color="#A69A94" />
          <AppText style={styles.prayerScheduleLocation} numberOfLines={1}>{user.location.label}</AppText>
          <Press onPress={onLocation} disabled={locationBusy} style={styles.prayerLocationButton} accessibilityLabel="Update prayer location">
            {locationBusy ? <ActivityIndicator size="small" color={PRAYER_HERO_COLOR} /> : null}
            <AppText style={styles.prayerLocationButtonText}>{locationBusy ? 'Finding' : 'Change'}</AppText>
          </Press>
        </View>

      </View>

      <View style={styles.prayerSchedulePanel}>
        <View style={styles.prayerScheduleHeading}>
          <AppText style={styles.prayerTodayTitle}>Today</AppText>
          <AppText style={styles.prayerCheckInCount}>{completed}/{PRAYERS.length}</AppText>
        </View>
        <View style={styles.prayerTimesList}>
          {PRAYERS.map((prayer) => {
            const entry = schedule.entries.find((item) => item.key === prayer.key);
            const done = todaysPrayers.includes(prayer.key);
            const isNext = prayer.key === next?.key;
            return (
              <Press
                key={prayer.key}
                onPress={() => onTogglePrayer(prayer.key)}
                style={[
                  styles.prayerTimeRow,
                  isNext && styles.prayerTimeRowNext,
                ]}
                accessibilityRole="checkbox"
                accessibilityLabel={`${prayer.name}, ${done ? 'marked complete' : 'not marked'}${isNext ? ', next prayer' : ''}, ${entry ? formatTime(entry.time) : 'time unavailable'}`}
                accessibilityState={{ checked: done }}
              >
                <AppText style={[styles.prayerTimeName, isNext && styles.prayerTimeNameNext]} numberOfLines={1}>
                  {prayer.name}
                </AppText>
                <AppText style={[styles.prayerTimeValue, isNext && styles.prayerTimeValueNext]} numberOfLines={1}>
                  {entry ? formatTimeCompact(entry.time) : '—'}
                </AppText>
                <View style={[styles.prayerTimeStatus, done && styles.prayerTimeStatusDone, isNext && styles.prayerTimeStatusNext]}>
                  {done ? <Icon name="checkmark" size={14} color={PRAYER_HERO_COLOR} /> : null}
                </View>
              </Press>
            );
          })}
        </View>
        <View style={styles.prayerRhythm}>
          <View style={styles.prayerRhythmLabel}>
            <Icon name="leaf-outline" size={14} color="#F5D6C7" />
            <AppText style={styles.prayerRhythmText}>{rhythmLabel}</AppText>
          </View>
          <View style={styles.prayerRhythmDots}>
            {recentActivityDays.map((day) => (
              <View key={day.key} style={[styles.prayerRhythmDot, day.active && styles.prayerRhythmDotActive]} />
            ))}
          </View>
        </View>
        {schedule.error ? <AppText style={styles.prayerScheduleError}>Prayer times could not be calculated: {schedule.error}</AppText> : null}
      </View>

      <View style={styles.qiblaCard}>
        <View style={styles.qiblaCardHeader}>
          <Press
            onPress={() => setQiblaExpanded((expanded) => !expanded)}
            style={styles.qiblaCardHeading}
            accessibilityRole="button"
            accessibilityLabel="Qibla compass"
            accessibilityState={{ expanded: qiblaExpanded }}
          >
            <AppText style={styles.qiblaCardTitle}>Qibla</AppText>
            <AppText style={styles.qiblaCardBearing}>{qiblaSummary}</AppText>
          </Press>
          <View style={styles.qiblaCardActions}>
            <Press
              onPress={findQibla}
              disabled={qiblaBusy || locationBusy}
              style={styles.qiblaRefreshButton}
              accessibilityRole="button"
              accessibilityLabel="Refresh live Qibla compass"
            >
              {qiblaBusy
                ? <ActivityIndicator size="small" color={PRAYER_HERO_COLOR} />
                : <Icon name="refresh" size={16} color={PRAYER_HERO_COLOR} />}
            </Press>
            <Press
              onPress={() => setQiblaExpanded((expanded) => !expanded)}
              style={styles.qiblaExpandButton}
              accessibilityRole="button"
              accessibilityLabel="Toggle Qibla compass"
              accessibilityState={{ expanded: qiblaExpanded }}
            >
              <Icon name={qiblaExpanded ? 'chevron-up' : 'chevron-down'} size={17} color="#8F817B" />
            </Press>
          </View>
        </View>

        {qiblaExpanded ? (
          <>
            <View style={styles.qiblaCompassStage}>
            <View
              style={styles.qiblaCompass}
              accessibilityRole="image"
              accessibilityLabel={`Compass rose. Qibla bearing is ${Number.isFinite(qiblaBearing) ? Math.round(qiblaBearing) : 'unavailable'} degrees from true north.${compassHeading === null ? '' : ` Device ${compassUsesTrueHeading ? 'true' : 'magnetic'} heading is ${Math.round(compassHeading) % 360} degrees.`}${isQiblaAligned ? ' You are facing Qibla.' : ''}`}
            >
              <Svg style={StyleSheet.absoluteFill} viewBox="0 0 240 240" pointerEvents="none">
                <Circle cx="120" cy="120" r="115" fill="#FFFFFF" stroke="#F3E9E4" strokeWidth="8" />
                <Circle cx="120" cy="120" r="88" fill="none" stroke="#F1EAE5" strokeWidth="1" />
                {QIBLA_COMPASS_TICKS.map((tick) => (
                  <Path
                    key={tick.key}
                    d={tick.path}
                    stroke={tick.major ? '#CBB2A8' : '#E5D8D1'}
                    strokeWidth={tick.major ? 2 : 1.5}
                    strokeLinecap="round"
                  />
                ))}
              </Svg>
              <View style={[styles.qiblaCompassRose, { transform: [{ rotate: `${compassHeading === null ? 0 : -compassHeading}deg` }] }]}>
                <AppText style={[styles.qiblaCompassCardinal, styles.qiblaCompassNorth]}>N</AppText>
                <AppText style={[styles.qiblaCompassCardinal, styles.qiblaCompassEast]}>E</AppText>
                <AppText style={[styles.qiblaCompassCardinal, styles.qiblaCompassSouth]}>S</AppText>
                <AppText style={[styles.qiblaCompassCardinal, styles.qiblaCompassWest]}>W</AppText>
              </View>
              <View pointerEvents="none" style={[styles.qiblaTargetIndicator, { transform: [{ rotate: `${relativeQiblaDirection}deg` }] }]}>
                <View style={styles.qiblaTargetMarker}>
                  <Icon name="arrow-up" size={17} color={COLORS.white} />
                </View>
              </View>
              {isQiblaAligned ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.qiblaAlignmentPulse,
                    {
                      opacity: alignmentPulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                      transform: [{ scale: alignmentPulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.3] }) }],
                    },
                  ]}
                />
              ) : null}
              <View style={[styles.qiblaCompassCenter, isQiblaAligned && styles.qiblaCompassCenterAligned]}>
                {isQiblaAligned ? (
                  <Icon name="checkmark" size={29} color={PRAYER_HERO_COLOR} />
                ) : (
                  <AppText style={styles.qiblaCompassDegrees}>
                    {Number.isFinite(qiblaBearing) ? `${Math.round(qiblaBearing)}°` : '—'}
                  </AppText>
                )}
                <AppText style={styles.qiblaCompassCenterText}>{isQiblaAligned ? 'Aligned' : 'to Qibla'}</AppText>
              </View>
              <View style={styles.qiblaNorthMarker} />
            </View>
            </View>

            <View style={styles.qiblaActions}>
            {liveCompassActive ? (
              <View style={[styles.qiblaStatus, isQiblaAligned && styles.qiblaStatusAligned]}>
                <Icon name={isQiblaAligned ? 'checkmark-circle' : 'navigate'} size={16} color={isQiblaAligned ? COLORS.white : PRAYER_HERO_COLOR} />
                <AppText style={[styles.qiblaStatusText, isQiblaAligned && styles.qiblaStatusTextAligned]} accessibilityLiveRegion="polite">
                  {isQiblaAligned ? 'You’re facing Qibla' : compassStatus || 'Turn gently until the marker reaches the top.'}
                </AppText>
              </View>
            ) : qiblaResultIsCurrent && Platform.OS === 'web' ? (
              <View style={styles.qiblaStatus}>
                <Icon name="phone-portrait-outline" size={16} color={PRAYER_HERO_COLOR} />
                <AppText style={styles.qiblaStatusText}>Live compass and vibration are available in the app.</AppText>
              </View>
            ) : (
              <Press
                onPress={findQibla}
                disabled={qiblaBusy || locationBusy}
                style={[styles.qiblaStartButton, styles.qiblaActionPrimary, (qiblaBusy || locationBusy) && styles.qiblaStartButtonDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Start live Qibla compass"
              >
                {qiblaBusy || locationBusy
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Icon name="navigate" size={16} color={COLORS.white} />}
                <AppText style={styles.qiblaStartButtonText}>{qiblaBusy ? 'Finding Qibla' : locationBusy ? 'Finding location' : 'Start live compass'}</AppText>
              </Press>
            )}
            </View>
            {hapticError ? <AppText style={styles.qiblaFeedbackNote} accessibilityLiveRegion="polite">{hapticError}</AppText> : null}
            {compassActive && compassStatus && !isQiblaAligned ? (
            <AppText style={styles.qiblaFeedbackNote} accessibilityLiveRegion="polite">{compassStatus}</AppText>
            ) : null}
            {qiblaError ? <AppText style={styles.qiblaError}>{qiblaError}</AppText> : null}
          </>
        ) : null}
      </View>
      <AppText style={styles.qiblaPrivacyNote}>Your location is shared only when you start or refresh the compass.</AppText>

      <View style={styles.prayerLearnSection}>
        <Press
          onPress={() => setLearningExpanded((expanded) => !expanded)}
          style={styles.prayerLearnHeader}
          accessibilityRole="button"
          accessibilityLabel="Learn to pray"
          accessibilityState={{ expanded: learningExpanded }}
        >
          <View style={styles.prayerLearnHeaderCopy}>
            <AppText style={styles.prayerLearnTitle}>Guides</AppText>
            <AppText style={styles.prayerLearnSubtitle}>Learn at your own pace.</AppText>
          </View>
          <View style={styles.prayerLearnHeaderActions}>
            <View style={styles.prayerNoRush}>
              <Icon name="leaf-outline" size={12} color={PRAYER_HERO_COLOR} />
              <AppText style={styles.prayerNoRushText}>No rush</AppText>
            </View>
            <View style={styles.prayerLearnExpandButton}>
              <Icon name={learningExpanded ? 'chevron-up' : 'chevron-down'} size={17} color="#8F817B" />
            </View>
          </View>
        </Press>

        {learningExpanded ? (
          <>
            <View style={styles.prayerLearnTabs}>
            {[
              { key: 'prayer', label: 'How to pray' },
              { key: 'wudu', label: 'Wudhu' },
              { key: 'vocabulary', label: 'Key vocab' },
            ].map((item) => {
              const selected = learningTab === item.key;
              return (
                <Press
                  key={item.key}
                  onPress={() => setLearningTab(item.key)}
                  style={[styles.prayerLearnTab, selected && styles.prayerLearnTabSelected]}
                  accessibilityRole="tab"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                >
                  <AppText style={[styles.prayerLearnTabText, selected && styles.prayerLearnTabTextSelected]}>{item.label}</AppText>
                </Press>
              );
            })}
            </View>

            {learningTab === 'prayer' ? (
            <View>
              <View style={styles.prayerWalkthroughHeading}>
                <AppText style={styles.prayerWalkthroughTitle}>Salah, step by step</AppText>
                <AppText style={styles.prayerWalkthroughHint}>Choose one</AppText>
              </View>
              <View style={styles.prayerWalkthroughList}>
                {PRAYER_WALKTHROUGHS.map((prayer) => {
                  const isNext = prayer.key === next?.key;
                  return (
                    <Press
                      key={prayer.key}
                      onPress={() => onPrayerGuide(prayer.key)}
                      style={[styles.prayerWalkthroughCard, isNext && styles.prayerWalkthroughCardNext]}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${prayer.name} prayer walkthrough, ${prayer.rakahs} rak‘ahs`}
                    >
                      <AppText style={[styles.prayerWalkthroughRakahs, isNext && styles.prayerWalkthroughRakahsNext]}>{prayer.rakahs}</AppText>
                      <View style={styles.prayerWalkthroughCopy}>
                        <AppText style={styles.prayerWalkthroughName}>{prayer.name}</AppText>
                        <AppText style={styles.prayerWalkthroughMeta}>{prayer.period} · {prayer.duration}</AppText>
                      </View>
                      {isNext ? (
                        <View style={styles.prayerWalkthroughNextBadge}>
                          <AppText style={styles.prayerWalkthroughNextText}>Next</AppText>
                        </View>
                      ) : null}
                      <Icon name="chevron-forward" size={17} color="#9B8F85" />
                    </Press>
                  );
                })}
              </View>
            </View>
            ) : learningTab === 'wudu' ? (
            <View style={styles.prayerLearningPanel}>
              <View style={styles.prayerLearningPanelHeader}>
                <View style={styles.prayerLearningPanelIcon}><Icon name="water-outline" size={20} color={PRAYER_HERO_COLOR} /></View>
                <View style={styles.prayerLearningPanelCopy}>
                  <AppText style={styles.prayerLearningPanelTitle}>Wudu</AppText>
                  <AppText style={styles.prayerLearningPanelDescription}>Before salah · {wuduSteps.length} steps</AppText>
                </View>
              </View>
              <View style={styles.wuduStepsList}>
                {wuduSteps.map((step, index) => (
                  <View key={step.title} style={styles.wuduStepRow}>
                    <AppText style={styles.wuduStepNumberText}>{String(index + 1).padStart(2, '0')}</AppText>
                    <AppText style={styles.wuduStepTitle} numberOfLines={1}>{step.title}</AppText>
                  </View>
                ))}
              </View>
              <Press onPress={() => onGuide('wudu')} style={styles.prayerLearningAction} accessibilityRole="button" accessibilityLabel="Open the full wudhu walkthrough">
                <Icon name="play" size={12} color={PRAYER_HERO_COLOR} />
                <AppText style={styles.prayerLearningActionText}>Walk me through it</AppText>
              </Press>
            </View>
            ) : (
            <View style={styles.prayerVocabularyList}>
              {PRAYER_VOCABULARY.map((item) => (
                <View key={item.term} style={styles.prayerVocabularyRow}>
                  <View style={styles.prayerVocabularyIcon}><Icon name="book-outline" size={16} color={PRAYER_HERO_COLOR} /></View>
                  <View style={styles.prayerVocabularyCopy}>
                    <AppText style={styles.prayerVocabularyTerm}>{item.term}</AppText>
                    <AppText style={styles.prayerVocabularyMeaning}>{item.meaning}</AppText>
                  </View>
                </View>
              ))}
            </View>
            )}
          </>
        ) : null}
      </View>

      <Press onPress={openMaps} style={styles.prayerMosqueLink} accessibilityRole="button" accessibilityLabel="Find a nearby mosque">
        <Icon name="location-outline" size={15} color={PRAYER_HERO_COLOR} />
        <AppText style={styles.prayerMosqueLinkText}>Find a nearby mosque</AppText>
        <Icon name="arrow-forward" size={14} color={PRAYER_HERO_COLOR} />
      </Press>
      <AppText style={styles.prayerDisclaimer}>Local mosque timetables may differ.</AppText>
    </Page>
  );
}

const communityWhatsAppLink = (message) => `https://wa.me/447976807268?text=${encodeURIComponent(`As-salamu alaykum! ${message}`)}`;
const normalizeCommunitySearch = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const COMMUNITY_EVENTS = [
  {
    id: 'walk',
    category: 'Outdoors',
    audience: 'WOMEN ONLY',
    availability: 'FREE TO JOIN',
    title: 'Sisters 5KM Walk, Run & Cycle',
    schedule: 'Every other Sunday · meet at 8:45am',
    venue: 'R2R Wellbeing Centre · E10 6AW',
    action: 'Ask to join on WhatsApp',
    url: 'https://wa.me/447976807268?text=As-salamu%20alaykum!%20I%27d%20like%20to%20join%20the%20Sisters%205KM%20Walk%2C%20Run%20%26%20Cycle%20group.',
    image: require('./assets/community-walk.jpg'),
  },
  {
    id: 'sisters-social',
    category: 'Social',
    audience: 'SISTERS ONLY',
    availability: 'FREE TO ATTEND',
    title: 'Sisters Friday Social',
    schedule: 'Last Friday of each month · 7:00–9:00pm',
    venue: 'R2R Wellbeing Centre',
    action: 'Let them know you’re coming',
    url: communityWhatsAppLink('I’d like to come to the Sisters Friday Social.'),
    icon: 'people-outline',
  },
  {
    id: 'brothers-social',
    category: 'Social',
    audience: 'BROTHERS ONLY',
    availability: 'FREE TO ATTEND',
    title: 'Brothers Friday Social',
    schedule: 'Last Friday of each month · 7:00–9:00pm',
    venue: 'R2R Wellbeing Centre',
    action: 'Let them know you’re coming',
    url: communityWhatsAppLink('I’d like to come to the Brothers Friday Social.'),
    icon: 'people-outline',
  },
  {
    id: 'wellbeing-cafe',
    category: 'Wellbeing',
    audience: 'OPEN TO ALL',
    availability: 'JUST COME ALONG',
    title: 'R2R Wellbeing Café',
    schedule: 'Tuesday 9:30am–3:00pm · Sunday 10:30am–3:00pm',
    venue: '736b Lea Bridge Road, Leyton',
    action: 'Get directions',
    url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('736b Lea Bridge Road, Leyton, London E10 6AW')}`,
    icon: 'cafe-outline',
    image: require('./assets/community-cafe.jpg'),
  },
];

function SupportScreen({ user, onExternal }) {
  const openMasjids = () => onExternal(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`mosque near ${user.location.label}`)}`);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const categories = ['All', 'Outdoors', 'Social', 'Wellbeing'];
  const normalizedQuery = normalizeCommunitySearch(searchQuery.trim());
  const matchingEvents = COMMUNITY_EVENTS.filter((event) => {
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    const searchableText = normalizeCommunitySearch(`${event.title} ${event.audience} ${event.schedule} ${event.venue}`);
    return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });
  const walkEvent = matchingEvents.find((event) => event.id === 'walk');
  const socialEvents = matchingEvents.filter((event) => event.category === 'Social');
  const cafeEvent = matchingEvents.find((event) => event.id === 'wellbeing-cafe');

  return (
    <Page scrollStyle={styles.homeScroll} contentStyle={styles.communityPage} bottom={112}>
      <View style={styles.communityHeader}>
        <Eyebrow>REVERT2REALITY · LONDON</Eyebrow>
        <AppText style={styles.communityPageTitle}>Discover Community</AppText>
        <AppText style={styles.communityPageSubtitle}>Find a welcoming place to meet, grow and feel at home.</AppText>
      </View>

      <View style={styles.communitySearch}>
        <Icon name="search-outline" size={19} color={COLORS.muted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search events and gatherings"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          returnKeyType="search"
          underlineColorAndroid="transparent"
          accessibilityLabel="Search community events"
          style={styles.communitySearchInput}
        />
        {searchQuery.length > 0 ? (
          <Press onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
            <Icon name="close-circle" size={18} color={COLORS.muted} />
          </Press>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.communityCategoryList}
        style={styles.communityCategoryScroller}
      >
        {categories.map((category) => (
          <Press
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={[styles.communityCategory, selectedCategory === category && styles.communityCategoryActive]}
            accessibilityLabel={`Show ${category} gatherings`}
            accessibilityState={{ selected: selectedCategory === category }}
          >
            <AppText style={[styles.communityCategoryText, selectedCategory === category && styles.communityCategoryTextActive]}>
              {category}
            </AppText>
          </Press>
        ))}
      </ScrollView>

      <SectionHeading
        title="Gather, grow, belong"
        action="All events"
        onPress={() => onExternal('https://revert2reality.co.uk/events')}
      />
      <AppText style={styles.communitySectionIntro}>Recurring gatherings in Leyton. Confirm current dates with Revert2Reality before travelling.</AppText>

      {walkEvent ? (
        <View style={styles.communityWalkCard}>
          <Image
            source={walkEvent.image}
            style={styles.communityWalkImage}
            resizeMode="cover"
            accessible={false}
          />
          <LinearGradient colors={['#1A17143D', '#1A1714E8']} style={StyleSheet.absoluteFill} />
          <View style={styles.communityPhotoContent}>
            <View style={styles.communityPhotoBadges}>
              <AppText style={styles.communityPhotoBadge}>{walkEvent.audience}</AppText>
              <AppText style={styles.communityPhotoBadge}>{walkEvent.availability}</AppText>
            </View>
            <View>
              <AppText style={styles.communityPhotoKicker}>OUTDOORS · SISTERS TOGETHER</AppText>
              <AppText style={styles.communityPhotoTitle}>5KM Walk, Run & Cycle</AppText>
              <View style={styles.communityPhotoDetail}>
                <Icon name="calendar-outline" size={14} color={COLORS.white} />
                <AppText style={styles.communityPhotoDetailText}>{walkEvent.schedule}</AppText>
              </View>
              <View style={styles.communityPhotoFooter}>
                <View style={styles.communityPhotoDetail}>
                  <Icon name="location-outline" size={14} color={COLORS.white} />
                  <AppText style={styles.communityPhotoDetailText}>{walkEvent.venue}</AppText>
                </View>
                <Press
                  onPress={() => onExternal(walkEvent.url)}
                  style={styles.communityPhotoAction}
                  accessibilityLabel={`${walkEvent.action}: ${walkEvent.title}`}
                >
                  <AppText style={styles.communityPhotoActionText}>Join</AppText>
                  <Icon name="logo-whatsapp" size={16} color={COLORS.red} />
                </Press>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {socialEvents.length > 0 ? (
        <>
          <View style={styles.communitySubheading}>
            <AppText style={styles.communitySubheadingTitle}>Friday socials</AppText>
            <AppText style={styles.communitySubheadingNote}>A relaxed evening, once a month</AppText>
          </View>
          <View style={styles.communitySocialGrid}>
            {socialEvents.map((event) => (
              <View
                key={event.id}
                style={[styles.communitySocialCard, event.id === 'sisters-social' ? styles.communitySocialCardSisters : styles.communitySocialCardBrothers]}
              >
                <View style={styles.communitySocialTop}>
                  <View style={styles.communitySocialIcon}>
                    <Icon name="people-outline" size={19} color={COLORS.red} />
                  </View>
                  <AppText style={styles.communitySocialAvailability}>{event.availability}</AppText>
                </View>
                <AppText style={styles.communitySocialAudience}>{event.audience}</AppText>
                <AppText style={styles.communitySocialTitle}>{event.title}</AppText>
                <AppText style={styles.communitySocialSchedule}>{event.schedule}</AppText>
                <AppText style={styles.communitySocialVenue}>{event.venue}</AppText>
                <Press
                  onPress={() => onExternal(event.url)}
                  style={styles.communitySocialAction}
                  accessibilityLabel={`${event.action}: ${event.audience.toLowerCase()} ${event.title}`}
                >
                  <AppText style={styles.communitySocialActionText}>WhatsApp RSVP</AppText>
                  <Icon name="arrow-forward" size={14} color={COLORS.red} />
                </Press>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {cafeEvent ? (
        <View style={styles.communityCafeCard}>
          <Image
            source={cafeEvent.image}
            style={styles.communityCafeImage}
            resizeMode="cover"
            accessible={false}
          />
          <LinearGradient colors={['#17171430', '#171714E8']} style={StyleSheet.absoluteFill} />
          <View style={styles.communityCafeContent}>
            <View style={styles.communityPhotoBadges}>
              <AppText style={styles.communityPhotoBadge}>{cafeEvent.audience}</AppText>
              <AppText style={styles.communityPhotoBadge}>{cafeEvent.availability}</AppText>
            </View>
            <View>
              <AppText style={styles.communityCafeKicker}>A WARM PLACE TO PAUSE</AppText>
              <AppText style={styles.communityCafeTitle}>{cafeEvent.title}</AppText>
              <AppText style={styles.communityCafeSchedule}>{cafeEvent.schedule}</AppText>
              <View style={styles.communityPhotoFooter}>
                <View style={styles.communityPhotoDetail}>
                  <Icon name="location-outline" size={14} color={COLORS.white} />
                  <AppText style={styles.communityPhotoDetailText}>{cafeEvent.venue}</AppText>
                </View>
                <Press
                  onPress={() => onExternal(cafeEvent.url)}
                  style={styles.communityPhotoAction}
                  accessibilityLabel={`Get directions to ${cafeEvent.title}`}
                >
                  <AppText style={styles.communityPhotoActionText}>Directions</AppText>
                  <Icon name="arrow-forward" size={14} color={COLORS.red} />
                </Press>
              </View>
            </View>
          </View>
        </View>
      ) : null}
      {matchingEvents.length === 0 ? (
        <View style={styles.communityEmptyState}>
          <Icon name="search-outline" size={22} color={COLORS.red} />
          <AppText style={styles.communityEmptyTitle}>No gatherings found</AppText>
          <AppText style={styles.communityEmptyText}>Try a different search or category.</AppText>
        </View>
      ) : null}

      <SectionHeading title="A little support, nearby" />
      <Press onPress={openMasjids} style={styles.communityLinkRow} accessibilityLabel={`Find a mosque near ${user.location.label}`}>
        <View style={[styles.communityLinkIcon, { backgroundColor: COLORS.rose }]}><Icon name="location-outline" size={19} color={COLORS.red} /></View>
        <View style={{ flex: 1 }}>
          <AppText style={styles.communityLinkTitle}>Find a mosque near you</AppText>
          <AppText style={styles.communityLinkSub}>Search in maps around {user.location.label}</AppText>
        </View>
        <Icon name="open-outline" size={17} color={COLORS.muted} />
      </Press>
      <Press onPress={() => onExternal('https://seekersguidance.org/')} style={styles.communityLinkRow}>
        <View style={[styles.communityLinkIcon, { backgroundColor: COLORS.peach }]}><Icon name="help-circle-outline" size={19} color={COLORS.red} /></View>
        <View style={{ flex: 1 }}>
          <AppText style={styles.communityLinkTitle}>Ask a learning question</AppText>
          <AppText style={styles.communityLinkSub}>Browse answers from SeekersGuidance</AppText>
        </View>
        <Icon name="open-outline" size={17} color={COLORS.muted} />
      </Press>

      <View style={styles.communityBoundaryNote}>
        <Icon name="shield-checkmark-outline" size={20} color={COLORS.red} />
        <AppText style={styles.communityBoundaryText}>Choose people who respect your privacy, boundaries and safety. You never owe anyone personal information or a quick decision.</AppText>
      </View>
      <AppText style={styles.disclaimer}>External links open outside the app. Revert2Reality does not control third-party content.</AppText>
    </Page>
  );
}

function TopicQuiz({ quiz, onComplete, completed }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = selectedOption === quiz.answerIndex;

  return (
    <View style={styles.topicQuizCard}>
      <Press
        onPress={() => setExpanded((current) => !current)}
        style={styles.topicQuizHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.topicQuizIcon}><Icon name="help-circle-outline" size={20} color={LEARN_COLORS.forest} /></View>
        <View style={{ flex: 1 }}>
          <AppText style={styles.topicQuizEyebrow}>{completed ? 'COMPLETED · OPTIONAL' : 'OPTIONAL · NO GRADES'}</AppText>
          <AppText style={styles.topicQuizTitle}>
            {expanded ? 'What did you take away?' : completed ? 'Quick check complete' : 'Try a quick check'}
          </AppText>
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={LEARN_COLORS.forest} />
      </Press>
      {expanded ? (
        <>
          <AppText style={styles.topicQuizQuestion}>{quiz.question}</AppText>
          <View style={styles.topicQuizOptions}>
            {quiz.options.map((option, index) => {
              const selected = index === selectedOption;
              const correctAnswer = submitted && index === quiz.answerIndex;
              const incorrectAnswer = submitted && selected && !isCorrect;
              return (
                <Press
                  key={option}
                  onPress={() => setSelectedOption(index)}
                  disabled={submitted}
                  style={[
                    styles.topicQuizOption,
                    selected && styles.topicQuizOptionSelected,
                    correctAnswer && styles.topicQuizOptionCorrect,
                    incorrectAnswer && styles.topicQuizOptionIncorrect,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={option}
                  accessibilityState={{ selected, disabled: submitted }}
                >
                  <View style={[
                    styles.topicQuizOptionMarker,
                    selected && styles.topicQuizOptionMarkerSelected,
                    correctAnswer && styles.topicQuizOptionMarkerCorrect,
                    incorrectAnswer && styles.topicQuizOptionMarkerIncorrect,
                  ]}>
                    {correctAnswer ? <Icon name="checkmark" size={13} color={COLORS.white} /> : null}
                  </View>
                  <AppText style={styles.topicQuizOptionText}>{option}</AppText>
                </Press>
              );
            })}
          </View>
          {submitted ? (
            <>
              <View
                style={[styles.topicQuizFeedback, isCorrect ? styles.topicQuizFeedbackCorrect : styles.topicQuizFeedbackRetry]}
                accessibilityLiveRegion="polite"
              >
                <Icon
                  name={isCorrect ? 'checkmark-circle-outline' : 'information-circle-outline'}
                  size={19}
                  color={isCorrect ? LEARN_COLORS.forest : COLORS.red}
                />
                <View style={styles.topicQuizFeedbackCopy}>
                  <AppText style={styles.topicQuizFeedbackTitle}>{isCorrect ? 'That is it.' : 'Good try. Here is the key idea.'}</AppText>
                  <AppText style={styles.topicQuizFeedbackText}>{quiz.explanation}</AppText>
                </View>
              </View>
              {!isCorrect ? (
                <Press
                  onPress={() => {
                    setSelectedOption(null);
                    setSubmitted(false);
                  }}
                  style={styles.topicQuizRetryButton}
                  accessibilityRole="button"
                >
                  <AppText style={styles.topicQuizRetryText}>Try again</AppText>
                </Press>
              ) : null}
            </>
          ) : selectedOption === null ? (
            <AppText style={styles.topicQuizPrompt}>Pick an answer to see the explanation.</AppText>
          ) : (
            <Press
              onPress={() => {
                setSubmitted(true);
                if (isCorrect) onComplete();
              }}
              style={styles.topicQuizCheckButton}
              accessibilityRole="button"
              accessibilityLabel="Check your answer"
            >
              <AppText style={styles.topicQuizCheckText}>Check answer</AppText>
              <Icon name="arrow-forward" size={15} color={COLORS.white} />
            </Press>
          )}
          <AppText style={styles.topicQuizFootnote}>No grades or pressure. Correct answers add to your learning progress.</AppText>
        </>
      ) : null}
    </View>
  );
}

function TopicKeyTerms({ terms }) {
  const [expandedTerm, setExpandedTerm] = useState(null);
  const [expanded, setExpanded] = useState(false);

  if (!Array.isArray(terms) || terms.length === 0) return null;

  return (
    <View style={styles.readerTermsSection}>
      <Press
        onPress={() => setExpanded((current) => !current)}
        style={styles.readerTermsToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View>
          <AppText style={styles.readerTermsTitle}>Explore key words</AppText>
          <AppText style={styles.readerTermsSubtitle}>{terms.length} words · tap to reveal meanings</AppText>
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={LEARN_COLORS.forest} />
      </Press>
      {expanded ? (
        <View style={styles.lessonTermsList}>
          {terms.map((item, index) => {
            const termExpanded = expandedTerm === item.term;
            return (
              <Press
                key={item.term}
                onPress={() => setExpandedTerm(termExpanded ? null : item.term)}
                style={[styles.lessonTermCard, termExpanded && styles.lessonTermCardExpanded]}
                accessibilityRole="button"
                accessibilityState={{ expanded: termExpanded }}
                accessibilityLabel={`${item.term}, ${termExpanded ? 'hide' : 'reveal'} meaning`}
              >
                <View style={styles.lessonTermRow}>
                  <AppText style={styles.lessonTermIndex}>{String(index + 1).padStart(2, '0')}</AppText>
                  <AppText style={styles.lessonTerm}>{item.term}</AppText>
                  <Icon name={termExpanded ? 'chevron-up' : 'chevron-down'} size={17} color={LEARN_COLORS.muted} />
                </View>
                {termExpanded ? (
                  <View style={styles.lessonTermMeaning}>
                    <View style={styles.lessonTermDivider} />
                    <AppText style={styles.lessonTermMeaningText}>{item.meaning}</AppText>
                  </View>
                ) : null}
              </Press>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function ArticleScreen(props) {
  const article = normalizeLearningArticle(props.article);
  return Array.isArray(article.modules)
    ? <TopicCourseScreen {...props} article={article} />
    : <ShortArticleScreen {...props} article={article} />;
}

function GuideVideoBlock({ guide, onVideo }) {
  const [videoStart, setVideoStart] = useState(0);
  const [activeChapter, setActiveChapter] = useState(null);
  const [videoAutoplay, setVideoAutoplay] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);

  useEffect(() => {
    setVideoStart(0);
    setActiveChapter(null);
    setVideoAutoplay(false);
    setVideoStarted(false);
  }, [guide.id]);

  return (
    <View style={styles.followAlongSection}>
      <View style={styles.followAlongHeading}>
        <View style={{ flex: 1 }}>
          <Eyebrow>WATCH & FOLLOW ALONG</Eyebrow>
          <AppText style={styles.followAlongTitle}>{guide.videoSectionTitle || 'See each step in motion'}</AppText>
        </View>
        {guide.videoDuration ? (
          <View style={styles.videoDuration}><AppText style={styles.videoDurationText}>{guide.videoDuration}</AppText></View>
        ) : null}
      </View>
      {guide.videoId ? (
        <View style={styles.followAlongPlayer}>
          {videoStarted ? (
            <PrayerVideoPlayer
              videoId={guide.videoId}
              startSeconds={videoStart}
              autoPlay={videoAutoplay}
              title={guide.videoTitle}
            />
          ) : (
            <View style={styles.videoThumbnail}>
              <Image
                source={{ uri: `https://i.ytimg.com/vi/${encodeURIComponent(guide.videoId)}/hqdefault.jpg` }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                accessibilityLabel={`${guide.videoTitle} video thumbnail`}
              />
              <LinearGradient
                pointerEvents="none"
                colors={['#111A1740', '#111A17A8']}
                style={StyleSheet.absoluteFill}
              />
              <Press
                onPress={() => {
                  setVideoStarted(true);
                  setVideoAutoplay(true);
                }}
                style={styles.videoPlayButton}
                accessibilityLabel={`Play the ${guide.title} video`}
              >
                <Icon name="play" size={25} color={COLORS.white} />
              </Press>
              <AppText style={styles.videoThumbnailCaption}>
                {guide.videoThumbnailCaption || 'WATCH THE FULL WALKTHROUGH'}
              </AppText>
            </View>
          )}
        </View>
      ) : null}
      <View style={styles.videoAttribution}>
        <Icon name="logo-youtube" size={17} color={COLORS.danger} />
        <View style={{ flex: 1 }}>
          <AppText style={styles.videoTitle}>{guide.videoTitle || 'Watch the full guide'}</AppText>
          <AppText style={styles.videoSource}>{guide.videoSource || 'Trusted learning resource'} · YouTube</AppText>
        </View>
      </View>
      {onVideo ? (
        <Press onPress={onVideo} style={styles.videoOpenLink} accessibilityLabel={`Open the full ${guide.title} video on YouTube`}>
          <AppText style={styles.videoOpenLinkText}>Open on YouTube</AppText>
          <Icon name="open-outline" size={15} color={COLORS.green} />
        </Press>
      ) : null}
      {guide.videoChapters?.length ? (
        <>
          <AppText style={styles.videoChaptersLabel}>JUMP TO A PART</AppText>
          <View style={styles.videoChapters}>
            {guide.videoChapters.map((chapter, index) => {
              const selected = activeChapter === index;
              return (
                <Press
                  key={chapter.title}
                  onPress={() => {
                    setVideoStart(chapter.seconds);
                    setActiveChapter(index);
                    setVideoAutoplay(true);
                    setVideoStarted(true);
                  }}
                  style={[styles.videoChapter, selected && styles.videoChapterSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`Jump to ${chapter.title} at ${chapter.timestamp}`}
                  accessibilityState={{ selected }}
                >
                  <AppText style={[styles.videoChapterTitle, selected && styles.videoChapterTitleSelected]}>{chapter.title}</AppText>
                  <AppText style={[styles.videoChapterTime, selected && styles.videoChapterTitleSelected]}>{chapter.timestamp}</AppText>
                </Press>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

function TopicCourseScreen({
  article,
  completedQuizzes,
  completedLearningLessons,
  onQuizComplete,
  onLearningLessonComplete,
  onCourseComplete,
  onBack,
  onSource,
  onVideo,
  onRelatedArticle,
  onRelatedGuide,
}) {
  const [view, setView] = useState('course');
  const [lessonIndex, setLessonIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [quizRewardEarned, setQuizRewardEarned] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const scrollRef = useRef(null);
  const modules = article.modules || [];
  const quizQuestions = article.quizQuestions?.length
    ? article.quizQuestions
    : (article.quiz ? [article.quiz] : []);
  const completedLessonSet = new Set(completedLearningLessons || []);
  if (article.completed) {
    modules.forEach((_, index) => completedLessonSet.add(`${article.id}:${index}`));
  } else {
    for (let index = 0; index < Math.min(article.resumeIndex || 0, modules.length); index += 1) {
      completedLessonSet.add(`${article.id}:${index}`);
    }
  }
  const completedLessonCount = modules.filter((_, index) => completedLessonSet.has(`${article.id}:${index}`)).length;
  const completedQuiz = completedQuizzes.includes(article.id);
  const completedPercent = modules.length ? (completedLessonCount / modules.length) * 100 : 0;
  const currentLesson = modules[lessonIndex];
  const currentQuizQuestion = quizQuestions[quizIndex];
  const currentLessonCompleted = completedLessonSet.has(`${article.id}:${lessonIndex}`);
  const firstIncomplete = modules.findIndex((_, index) => !completedLessonSet.has(`${article.id}:${index}`));
  const lessonXp = Number.isFinite(article.lessonXp) ? article.lessonXp : 10;
  const quizXp = Number.isFinite(article.quizXp) ? article.quizXp : 15;
  const completionXp = Number.isFinite(article.completionXp) ? article.completionXp : 0;
  const earnedXp = completedLessonCount * lessonXp
    + (completedQuiz ? quizXp : 0)
    + (article.completed ? completionXp : 0);
  const possibleXp = modules.length * lessonXp
    + (quizQuestions.length ? quizXp : 0)
    + completionXp;
  const allLessonsComplete = modules.length > 0 && completedLessonCount === modules.length;
  const courseCompleted = article.completed || (allLessonsComplete && (!quizQuestions.length || completedQuiz));

  useEffect(() => {
    setView('course');
    setLessonIndex(0);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    setQuizRewardEarned(false);
    setShowMore(false);
  }, [article.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [view, lessonIndex, quizIndex]);

  const showCourse = () => {
    setView('course');
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    setShowMore(false);
  };

  const startQuiz = () => {
    setQuizIndex(0);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    setQuizRewardEarned(!completedQuizzes.includes(article.id));
    setView('quiz');
  };

  const continueCourse = () => {
    if (firstIncomplete >= 0) {
      setLessonIndex(firstIncomplete);
      setShowMore(false);
      setView('lesson');
    } else if (quizQuestions.length && !completedQuiz) {
      startQuiz();
    } else if (modules.length) {
      setLessonIndex(0);
      setView('lesson');
    }
  };

  const completeLesson = () => {
    if (!currentLessonCompleted) onLearningLessonComplete?.(article.id, lessonIndex);
    const completesCourse = modules.every(
      (_, index) => index === lessonIndex || completedLessonSet.has(`${article.id}:${index}`),
    );
    if (completesCourse && !article.completed) onCourseComplete?.();
    const nextIncomplete = modules.findIndex(
      (_, index) => index > lessonIndex && !completedLessonSet.has(`${article.id}:${index}`),
    );
    if (nextIncomplete >= 0) {
      setLessonIndex(nextIncomplete);
      setShowMore(false);
    } else {
      showCourse();
    }
  };

  const checkAnswer = () => {
    if (selectedAnswer === null || !currentQuizQuestion) return;
    setAnswerFeedback(selectedAnswer === currentQuizQuestion.answerIndex ? 'correct' : 'incorrect');
  };

  const continueQuiz = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((index) => index + 1);
      setSelectedAnswer(null);
      setAnswerFeedback(null);
      return;
    }
    onQuizComplete(article.id);
    setView('complete');
  };

  const handleHeaderBack = () => {
    if (view === 'course') {
      onBack();
    } else {
      showCourse();
    }
  };

  return (
    <View style={styles.topicFlowRoot}>
      <View style={styles.topicFlowHeader}>
        <Press
          onPress={handleHeaderBack}
          style={styles.topicFlowHeaderButton}
          accessibilityLabel={view === 'course' ? 'Close course' : 'Back to course'}
        >
          <Icon name={view === 'course' ? 'close' : 'arrow-back'} size={21} color={COLORS.ink} />
        </Press>
        <View style={styles.topicFlowHeaderCopy}>
          <AppText style={styles.topicFlowHeaderTitle}>
            {view === 'course' ? 'LEARNING PATH' : article.label.toUpperCase()}
          </AppText>
          <AppText style={styles.topicFlowHeaderSubtitle}>
            {view === 'course' ? `${completedLessonCount} OF ${modules.length} LESSONS COMPLETE` : article.title}
          </AppText>
        </View>
        {view === 'course' ? (
          <View style={styles.topicFlowXpPill}>
            <Icon name="star" size={13} color={COLORS.red} />
            <AppText style={styles.topicFlowXpText}>{earnedXp} XP</AppText>
          </View>
        ) : (
          <View style={styles.topicFlowHeaderSpacer} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.topicFlowScroll}
        contentContainerStyle={styles.topicFlowContent}
        showsVerticalScrollIndicator={false}
      >
        {view === 'course' ? (
          <>
            <View style={styles.topicCourseHero}>
              <View style={styles.topicCourseEyebrowRow}>
                <View style={styles.topicCourseCategory}>
                  <AppText style={styles.topicCourseCategoryText}>{article.label.toUpperCase()}</AppText>
                </View>
                {completedQuiz || allLessonsComplete ? (
                  <View style={styles.topicCourseDonePill}>
                    <Icon name="checkmark-circle" size={14} color={COLORS.red} />
                    <AppText style={styles.topicCourseDoneText}>
                      {courseCompleted
                        ? 'COURSE COMPLETE'
                        : completedQuiz
                          ? 'QUIZ COMPLETE'
                          : 'LESSONS COMPLETE'}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <AppText style={styles.topicCourseTitle}>{article.courseTitle || article.title}</AppText>
              <AppText style={styles.topicCourseIntro}>{article.intro}</AppText>

              <View style={styles.topicCourseMetrics}>
                <View style={styles.topicCourseMetric}>
                  <AppText style={styles.topicCourseMetricValue}>{modules.length}</AppText>
                  <AppText style={styles.topicCourseMetricLabel}>LESSONS</AppText>
                </View>
                <View style={styles.topicCourseMetricDivider} />
                <View style={styles.topicCourseMetric}>
                  <AppText style={styles.topicCourseMetricValue}>{article.readMinutes} min</AppText>
                  <AppText style={styles.topicCourseMetricLabel}>AT YOUR PACE</AppText>
                </View>
                <View style={styles.topicCourseMetricDivider} />
                <View style={styles.topicCourseMetric}>
                  <AppText style={styles.topicCourseMetricValue}>
                    {courseCompleted ? '✓' : `+${Math.max(possibleXp - earnedXp, 0)}`}
                  </AppText>
                  <AppText style={styles.topicCourseMetricLabel}>{courseCompleted ? 'ALL EARNED' : 'XP TO EARN'}</AppText>
                </View>
              </View>

              <View style={styles.topicCourseProgressRow}>
                <AppText style={styles.topicCourseProgressLabel}>YOUR PROGRESS</AppText>
                <AppText style={styles.topicCourseProgressCount}>{completedLessonCount}/{modules.length}</AppText>
              </View>
              <View style={styles.topicCourseProgressTrack}>
                <View style={[styles.topicCourseProgressFill, { width: `${completedPercent}%` }]} />
              </View>
            </View>

            {article.spotlight ? (
              <View style={styles.topicSpotlightCard}>
                <View style={styles.topicSpotlightEyebrowRow}>
                  <Icon name="book-outline" size={15} color={COLORS.red} />
                  <AppText style={styles.topicSpotlightEyebrow}>A VERSE TO BEGIN</AppText>
                </View>
                <AppText style={styles.topicSpotlightArabic} accessibilityLabel="Quran verse in Arabic">
                  {article.spotlight.arabic}
                </AppText>
                <AppText style={styles.topicSpotlightTranslation}>{article.spotlight.translation}</AppText>
                <AppText style={styles.topicSpotlightSource}>{article.spotlight.source}</AppText>
              </View>
            ) : (
              <View style={styles.topicFocusCard}>
                <View style={styles.topicFocusIcon}>
                  <Icon name="sparkles-outline" size={19} color={COLORS.red} />
                </View>
                <View style={styles.topicFocusCopy}>
                  <AppText style={styles.topicFocusEyebrow}>A GENTLE START</AppText>
                  <AppText style={styles.topicFocusTitle}>{article.focus?.title || 'Start where you are'}</AppText>
                  <AppText style={styles.topicFocusText} numberOfLines={3}>
                    {article.focus?.body || article.intro}
                  </AppText>
                </View>
              </View>
            )}

            <View style={styles.topicSectionHeading}>
              <View>
                <AppText style={styles.topicSectionTitle}>Your learning path</AppText>
                <AppText style={styles.topicSectionSubtitle}>Choose a lesson and take it one step at a time.</AppText>
              </View>
              <AppText style={styles.topicSectionCount}>{modules.length} PARTS</AppText>
            </View>

            <View style={styles.topicLessonList}>
              {modules.map((module, index) => {
                const isComplete = completedLessonSet.has(`${article.id}:${index}`);
                const isNext = !isComplete && index === firstIncomplete;
                return (
                  <Press
                    key={`${article.id}-module-${index}`}
                    onPress={() => {
                      setLessonIndex(index);
                      setShowMore(false);
                      setView('lesson');
                    }}
                    style={[styles.topicLessonRow, isNext && styles.topicLessonRowNext]}
                    accessibilityLabel={`Open lesson ${index + 1}: ${module.title}`}
                  >
                    <View style={[styles.topicLessonNumber, isComplete && styles.topicLessonNumberDone, isNext && styles.topicLessonNumberNext]}>
                      {isComplete ? (
                        <Icon name="checkmark" size={15} color={COLORS.white} />
                      ) : (
                        <AppText style={[styles.topicLessonNumberText, isNext && styles.topicLessonNumberTextNext]}>
                          {String(index + 1).padStart(2, '0')}
                        </AppText>
                      )}
                    </View>
                    <View style={styles.topicLessonCopy}>
                      <AppText style={styles.topicLessonEyebrow}>
                        {isComplete ? 'COMPLETED' : isNext ? 'UP NEXT' : `LESSON ${String(index + 1).padStart(2, '0')}`}
                      </AppText>
                      <AppText style={styles.topicLessonTitle}>{module.title}</AppText>
                      {module.paragraphs?.[0] ? (
                        <AppText style={styles.topicLessonPreview} numberOfLines={2}>{module.paragraphs[0]}</AppText>
                      ) : null}
                    </View>
                    <Icon name="chevron-forward" size={18} color={isNext ? COLORS.red : COLORS.muted} />
                  </Press>
                );
              })}
            </View>

            {quizQuestions.length ? (
              <Press onPress={startQuiz} style={styles.topicFinalQuizCard}>
                <View style={styles.topicFinalQuizIcon}>
                  <Icon name={completedQuiz ? 'checkmark' : 'help-circle-outline'} size={20} color={COLORS.red} />
                </View>
                <View style={styles.topicFinalQuizCopy}>
                  <AppText style={styles.topicFinalQuizEyebrow}>{completedQuiz ? 'COMPLETED' : 'WHEN YOU’RE READY'}</AppText>
                  <AppText style={styles.topicFinalQuizTitle}>Quick knowledge check</AppText>
                  <AppText style={styles.topicFinalQuizSubtitle}>
                    {quizQuestions.length} {quizQuestions.length === 1 ? 'question' : 'questions'} · Try again any time
                  </AppText>
                </View>
                <Icon name="chevron-forward" size={18} color={COLORS.red} />
              </Press>
            ) : null}

            {article.terms ? <TopicKeyTerms terms={article.terms} /> : null}
            {article.importantNote ? (
              <View style={styles.topicImportantNote}>
                <Icon name="information-circle-outline" size={17} color={COLORS.red} />
                <AppText style={styles.topicImportantNoteText}>{article.importantNote}</AppText>
              </View>
            ) : null}
            {article.videoUrl ? (
              <GuideVideoBlock
                guide={article}
                onVideo={onVideo}
              />
            ) : null}
            {article.relatedArticleId && onRelatedArticle ? (
              <Press onPress={onRelatedArticle} style={styles.topicCourseSource}>
                <View style={styles.topicCourseSourceIcon}><Icon name="newspaper-outline" size={17} color={COLORS.red} /></View>
                <View style={styles.topicCourseSourceCopy}>
                  <AppText style={styles.topicCourseSourceTitle}>Read the companion article</AppText>
                  <AppText style={styles.topicCourseSourceSubtitle}>A little more context, whenever you’re ready</AppText>
                </View>
                <Icon name="chevron-forward" size={17} color={COLORS.muted} />
              </Press>
            ) : null}
            {article.relatedGuideId && onRelatedGuide ? (
              <Press onPress={onRelatedGuide} style={styles.topicCourseSource}>
                <View style={styles.topicCourseSourceIcon}><Icon name={article.relatedGuideIcon || 'book-outline'} size={17} color={COLORS.red} /></View>
                <View style={styles.topicCourseSourceCopy}>
                  <AppText style={styles.topicCourseSourceTitle}>{article.relatedGuideTitle || 'Explore the related guide'}</AppText>
                  <AppText style={styles.topicCourseSourceSubtitle}>A practical guide to build on this lesson</AppText>
                </View>
                <Icon name="chevron-forward" size={17} color={COLORS.muted} />
              </Press>
            ) : null}
            {article.source ? (
              <Press onPress={onSource} style={styles.topicCourseSource}>
                <View style={styles.topicCourseSourceIcon}><Icon name="open-outline" size={17} color={COLORS.red} /></View>
                <View style={styles.topicCourseSourceCopy}>
                  <AppText style={styles.topicCourseSourceTitle}>{article.sourceTitle || 'Explore the original guide'}</AppText>
                  <AppText style={styles.topicCourseSourceSubtitle}>{article.sourceSubtitle || 'Further reading, whenever you want it'}</AppText>
                </View>
                <Icon name="chevron-forward" size={17} color={COLORS.muted} />
              </Press>
            ) : null}
            <AppText style={styles.topicCourseDisclaimer}>
              {article.disclaimer || 'This is an educational introduction, not a personal religious ruling.'}
            </AppText>
          </>
        ) : null}

        {view === 'lesson' && currentLesson ? (
          <>
            <View style={styles.topicLessonProgress}>
              <View style={styles.topicLessonProgressTop}>
                <AppText style={styles.topicLessonProgressLabel}>
                  LESSON {String(lessonIndex + 1).padStart(2, '0')} OF {String(modules.length).padStart(2, '0')}
                </AppText>
                <View style={styles.topicLessonReward}>
                  <Icon name="star" size={12} color={COLORS.red} />
                  <AppText style={styles.topicLessonRewardText}>
                    {currentLessonCompleted ? (lessonXp ? 'XP EARNED' : 'COMPLETE') : lessonXp ? `+${lessonXp} XP` : 'LESSON'}
                  </AppText>
                </View>
              </View>
              <View style={styles.topicCourseProgressTrack}>
                <View style={[styles.topicCourseProgressFill, { width: `${((lessonIndex + 1) / modules.length) * 100}%` }]} />
              </View>
            </View>

            <AppText style={styles.topicLessonMainTitle}>{currentLesson.title}</AppText>
            {currentLesson.visualKind === 'prayer' ? (
              <PrayerStepIllustration type={currentLesson.visualType} />
            ) : null}
            {currentLesson.visualKind === 'wudu' ? (
              <WuduStepIllustration type={currentLesson.visualType} />
            ) : null}
            {currentLesson.arabicName ? (
              <View style={styles.topicArabicCard}>
                <AppText style={styles.topicArabicText}>{currentLesson.arabicName}</AppText>
                <AppText style={styles.topicArabicTransliteration}>{currentLesson.transliteration}</AppText>
                <AppText style={styles.topicArabicMeaning}>{currentLesson.meaning}</AppText>
              </View>
            ) : (
              <View style={styles.topicLessonIdeaCard}>
                <View style={styles.topicLessonIdeaIcon}><Icon name="sparkles-outline" size={18} color={COLORS.red} /></View>
                <View style={styles.topicLessonIdeaCopy}>
                  <AppText style={styles.topicLessonIdeaEyebrow}>THE KEY IDEA</AppText>
                  <AppText style={styles.topicLessonIdeaText} numberOfLines={4}>
                    {currentLesson.paragraphs?.[0] || article.intro}
                  </AppText>
                </View>
              </View>
            )}

            {(currentLesson.arabicName || (currentLesson.paragraphs || []).length > 1) ? (
              <View style={styles.topicLessonSection}>
                <AppText style={styles.topicLessonSectionEyebrow}>
                  {currentLesson.arabicName ? 'A LITTLE CONTEXT' : 'MORE TO EXPLORE'}
                </AppText>
                {currentLesson.arabicName && currentLesson.paragraphs?.[0] ? (
                  <AppText style={styles.topicLessonParagraph}>{currentLesson.paragraphs[0]}</AppText>
                ) : null}
                {showMore ? (currentLesson.paragraphs || []).slice(1).map((paragraph, index) => (
                  <AppText key={`lesson-extra-${index}`} style={styles.topicLessonParagraph}>{paragraph}</AppText>
                )) : null}
                {(currentLesson.paragraphs || []).length > 1 ? (
                  <Press
                    onPress={() => setShowMore((value) => !value)}
                    style={styles.topicLessonMoreButton}
                    accessibilityState={{ expanded: showMore }}
                  >
                    <AppText style={styles.topicLessonMoreText}>{showMore ? 'A little less' : 'Explore a little more'}</AppText>
                    <Icon name={showMore ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.red} />
                  </Press>
                ) : null}
              </View>
            ) : null}

            {currentLesson.points?.length ? (
              <View style={styles.topicLessonFactsCard}>
                <AppText style={styles.topicLessonSectionEyebrow}>REMEMBER</AppText>
                {currentLesson.points.map((point, index) => (
                  <View key={`lesson-point-${index}`} style={styles.topicLessonFactRow}>
                    <View style={styles.topicLessonFactIcon}>
                      <Icon name="checkmark" size={13} color={COLORS.red} />
                    </View>
                    <AppText style={styles.topicLessonFactText}>{point}</AppText>
                  </View>
                ))}
              </View>
            ) : null}

            {currentLesson.roles?.length ? (
              <View style={styles.topicLessonRoleSection}>
                <AppText style={styles.topicLessonSectionEyebrow}>ANGELS YOU MAY HEAR ABOUT</AppText>
                <View style={styles.topicLessonRoles}>
                  {currentLesson.roles.map((role) => (
                    <View key={role.name} style={styles.topicLessonRoleCard}>
                      <AppText style={styles.topicLessonRoleName}>{role.name}</AppText>
                      <AppText style={styles.topicLessonRoleTitle}>{role.role}</AppText>
                      <AppText style={styles.topicLessonRoleDetail}>{role.detail}</AppText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {currentLesson.quote ? (
              <View style={styles.topicLessonQuoteCard}>
                <View style={styles.topicLessonQuoteMark}><Icon name="book-outline" size={17} color={COLORS.red} /></View>
                <AppText style={styles.topicLessonQuoteText}>“{currentLesson.quote.text}”</AppText>
                <AppText style={styles.topicLessonQuoteSource}>{currentLesson.quote.source}</AppText>
              </View>
            ) : null}

            {currentLesson.note ? (
              <View style={styles.topicLessonNote}>
                <Icon name="information-circle-outline" size={17} color={COLORS.red} />
                <AppText style={styles.topicLessonNoteText}>{currentLesson.note}</AppText>
              </View>
            ) : null}

            {currentLesson.reflection ? (
              <View style={styles.topicReflectionCard}>
                <AppText style={styles.topicReflectionEyebrow}>A MOMENT TO REFLECT</AppText>
                <AppText style={styles.topicReflectionText}>{currentLesson.reflection}</AppText>
              </View>
            ) : null}
          </>
        ) : null}

        {view === 'quiz' && currentQuizQuestion ? (
          <View style={styles.topicQuizScreen}>
            <View style={styles.topicQuizScreenTop}>
              <View>
                <AppText style={styles.topicQuizScreenEyebrow}>QUICK KNOWLEDGE CHECK</AppText>
                <AppText style={styles.topicQuizScreenTitle}>A few gentle questions</AppText>
              </View>
              <View style={styles.topicQuizScreenXp}>
                <Icon name="star" size={12} color={COLORS.red} />
                <AppText style={styles.topicQuizScreenXpText}>{completedQuiz ? 'REVIEW' : '+15 XP'}</AppText>
              </View>
            </View>
            <View style={styles.topicQuizSegments}>
              {quizQuestions.map((question, index) => (
                <View
                  key={`quiz-progress-${index}`}
                  style={[
                    styles.topicQuizSegment,
                    index < quizIndex && styles.topicQuizSegmentDone,
                    index === quizIndex && styles.topicQuizSegmentActive,
                  ]}
                />
              ))}
            </View>
            <AppText style={styles.topicQuizQuestionCount}>
              QUESTION {String(quizIndex + 1).padStart(2, '0')} OF {String(quizQuestions.length).padStart(2, '0')}
            </AppText>
            <AppText style={styles.topicQuizScreenQuestion}>{currentQuizQuestion.question}</AppText>
            <View style={styles.topicQuizScreenOptions}>
              {currentQuizQuestion.options.map((option, index) => {
                const isCorrect = answerFeedback === 'correct' && index === currentQuizQuestion.answerIndex;
                const isWrong = answerFeedback === 'incorrect' && selectedAnswer === index;
                return (
                  <Press
                    key={`quiz-option-${index}`}
                    onPress={() => answerFeedback ? null : setSelectedAnswer(index)}
                    style={[
                      styles.topicQuizScreenOption,
                      selectedAnswer === index && styles.topicQuizScreenOptionSelected,
                      isCorrect && styles.topicQuizScreenOptionCorrect,
                      isWrong && styles.topicQuizScreenOptionWrong,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedAnswer === index, disabled: Boolean(answerFeedback) }}
                  >
                    <View style={[
                      styles.topicQuizScreenOptionMarker,
                      selectedAnswer === index && styles.topicQuizScreenMarkerSelected,
                      isCorrect && styles.topicQuizScreenMarkerCorrect,
                      isWrong && styles.topicQuizScreenMarkerWrong,
                    ]}>
                      {isCorrect ? <Icon name="checkmark" size={13} color={COLORS.white} /> : null}
                      {isWrong ? <Icon name="close" size={12} color={COLORS.white} /> : null}
                    </View>
                    <AppText style={styles.topicQuizScreenOptionText}>{option}</AppText>
                  </Press>
                );
              })}
            </View>
            {answerFeedback ? (
              <View style={[styles.topicQuizScreenFeedback, answerFeedback === 'correct' ? styles.topicQuizScreenFeedbackGood : styles.topicQuizScreenFeedbackRetry]}>
                <Icon
                  name={answerFeedback === 'correct' ? 'checkmark-circle' : 'refresh-circle'}
                  size={20}
                  color={answerFeedback === 'correct' ? COLORS.red : COLORS.muted}
                />
                <View style={styles.topicQuizScreenFeedbackCopy}>
                  <AppText style={styles.topicQuizScreenFeedbackTitle}>
                    {answerFeedback === 'correct' ? 'That’s right.' : 'Not quite — try again when you’re ready.'}
                  </AppText>
                  <AppText style={styles.topicQuizScreenFeedbackText}>{currentQuizQuestion.explanation}</AppText>
                </View>
              </View>
            ) : (
              <AppText style={styles.topicQuizScreenPrompt}>Choose an answer. There is no rush.</AppText>
            )}
          </View>
        ) : null}

        {view === 'complete' ? (
          <View style={styles.topicQuizComplete}>
            <View style={styles.topicQuizCompleteIcon}><Icon name="checkmark" size={28} color={COLORS.white} /></View>
            <AppText style={styles.topicQuizCompleteEyebrow}>
              {completedLessonCount === modules.length ? 'COURSE COMPLETE' : 'CHECK COMPLETE'}
            </AppText>
            <AppText style={styles.topicQuizCompleteTitle}>You did it, one step at a time.</AppText>
            <AppText style={styles.topicQuizCompleteText}>
              {completedLessonCount === modules.length
                ? 'You finished this learning path. Come back whenever you’d like to revisit a lesson.'
                : 'Your knowledge check is complete. You can finish the lessons or revisit this path whenever you’re ready.'}
            </AppText>
            <View style={styles.topicQuizCompleteReward}>
              <Icon name="star" size={16} color={COLORS.red} />
              <AppText style={styles.topicQuizCompleteRewardText}>
                {quizRewardEarned ? '+15 XP earned' : 'Progress saved'}
              </AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.topicFlowFooter}>
        {view === 'course' ? (
          <Press onPress={continueCourse} style={styles.topicFlowPrimaryButton}>
            <AppText style={styles.topicFlowPrimaryText}>
              {firstIncomplete >= 0
                ? (completedLessonCount ? 'Continue learning' : 'Begin learning')
                : quizQuestions.length && !completedQuiz
                  ? 'Take the quick check'
                  : 'Review a lesson'}
            </AppText>
            <Icon name="arrow-forward" size={17} color={COLORS.white} />
          </Press>
        ) : null}
        {view === 'lesson' ? (
          <View style={styles.topicFlowButtonRow}>
            <Press onPress={showCourse} style={styles.topicFlowSecondaryButton}>
              <AppText style={styles.topicFlowSecondaryText}>Course</AppText>
            </Press>
            <Press onPress={completeLesson} style={[styles.topicFlowPrimaryButton, styles.topicFlowPrimaryButtonFlex]}>
              <AppText style={styles.topicFlowPrimaryText}>
                {currentLessonCompleted
                  ? 'Continue'
                  : lessonXp
                    ? `Complete · +${lessonXp} XP`
                    : 'Complete this step'}
              </AppText>
              <Icon name="arrow-forward" size={17} color={COLORS.white} />
            </Press>
          </View>
        ) : null}
        {view === 'quiz' ? (
          answerFeedback === 'correct' ? (
            <Press onPress={continueQuiz} style={styles.topicFlowPrimaryButton}>
              <AppText style={styles.topicFlowPrimaryText}>
                {quizIndex < quizQuestions.length - 1 ? 'Next question' : 'Finish course'}
              </AppText>
              <Icon name="arrow-forward" size={17} color={COLORS.white} />
            </Press>
          ) : answerFeedback === 'incorrect' ? (
            <Press
              onPress={() => {
                setSelectedAnswer(null);
                setAnswerFeedback(null);
              }}
              style={styles.topicFlowPrimaryButton}
            >
              <AppText style={styles.topicFlowPrimaryText}>Try again</AppText>
              <Icon name="refresh" size={17} color={COLORS.white} />
            </Press>
          ) : (
            <Press
              onPress={checkAnswer}
              disabled={selectedAnswer === null}
              style={[styles.topicFlowPrimaryButton, selectedAnswer === null && styles.topicFlowButtonDisabled]}
            >
              <AppText style={styles.topicFlowPrimaryText}>Check answer</AppText>
              <Icon name="checkmark" size={17} color={COLORS.white} />
            </Press>
          )
        ) : null}
        {view === 'complete' ? (
          <Press onPress={showCourse} style={styles.topicFlowPrimaryButton}>
            <AppText style={styles.topicFlowPrimaryText}>Back to your course</AppText>
            <Icon name="arrow-forward" size={17} color={COLORS.white} />
          </Press>
        ) : null}
      </View>
    </View>
  );
}

function ShortArticleScreen({ article, completedQuizzes, onQuizComplete, onBack, onSource }) {
  const isTopicLesson = Array.isArray(article.modules);
  const sections = isTopicLesson
    ? article.modules
    : (article.paragraphs || []).map((paragraph) => ({ paragraphs: [paragraph] }));
  const [sectionIndex, setSectionIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [finished, setFinished] = useState(false);
  const scrollRef = useRef(null);
  const section = sections[sectionIndex];
  const firstParagraph = section?.paragraphs?.[0] || '';
  const additionalParagraphs = section?.paragraphs?.slice(1) || [];
  const hasDetails = firstParagraph.length > 220
    || additionalParagraphs.length > 0
    || (section?.points?.length || 0) > 0
    || Boolean(section?.note);
  const progress = sections.length ? ((sectionIndex + 1) / sections.length) * 100 : 0;

  useEffect(() => {
    setSectionIndex(0);
    setShowDetails(false);
    setFinished(false);
  }, [article.id, article.title]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [sectionIndex, finished]);

  const moveToSection = (index) => {
    setSectionIndex(index);
    setShowDetails(false);
  };

  return (
    <View style={[styles.detailRoot, styles.readerRoot]}>
      <View style={styles.detailHeader}>
        <Press onPress={onBack} style={styles.backButton} accessibilityLabel="Back to learning">
          <Icon name="arrow-back" size={21} color={COLORS.ink} />
        </Press>
        <View style={{ flex: 1 }}>
          <AppText style={styles.detailHeaderTitle}>{isTopicLesson ? 'Learning guide' : 'Short read'}</AppText>
          <AppText style={styles.detailHeaderStep}>{article.label.toUpperCase()}</AppText>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView ref={scrollRef} style={styles.detailScroll} contentContainerStyle={styles.readerContent} showsVerticalScrollIndicator={false}>
        {!finished ? (
          <>
            <AppText style={styles.readerEyebrow}>{isTopicLesson ? `${article.readMinutes} MIN · LEARN AT YOUR PACE` : `${article.label.toUpperCase()} · A SHORT READ`}</AppText>
            <AppText style={styles.readerTitle}>{article.title}</AppText>
            {isTopicLesson && article.intro ? (
              <AppText style={styles.readerIntro} numberOfLines={2}>{article.intro}</AppText>
            ) : null}

            <View style={styles.readerProgress}>
              <View style={styles.readerProgressRow}>
                <AppText style={styles.readerProgressLabel}>MOMENT {String(sectionIndex + 1).padStart(2, '0')} OF {String(sections.length).padStart(2, '0')}</AppText>
                <AppText style={styles.readerProgressHint}>ONE IDEA AT A TIME</AppText>
              </View>
              <View style={styles.readerProgressTrack}>
                <View style={[styles.readerProgressFill, { width: `${progress}%` }]} />
              </View>
            </View>

            {section ? (
              <View style={styles.readerStepCard}>
                {isTopicLesson ? (
                  <View style={styles.readerStepHeading}>
                    <View style={styles.readerStepMarker}>
                      <AppText style={styles.readerStepMarkerText}>{String(sectionIndex + 1).padStart(2, '0')}</AppText>
                    </View>
                    <View style={styles.readerStepHeadingCopy}>
                      <AppText style={styles.readerStepEyebrow}>A MOMENT TO LEARN</AppText>
                      <AppText style={styles.readerStepTitle}>{section.title}</AppText>
                    </View>
                  </View>
                ) : (
                  <View style={styles.readerThoughtMark}>
                    <Icon name="leaf-outline" size={18} color={LEARN_COLORS.forest} />
                  </View>
                )}
                <AppText
                  numberOfLines={!showDetails && firstParagraph.length > 220 ? 5 : undefined}
                  style={[styles.readerBody, isTopicLesson && styles.readerBodyWithHeading]}
                >
                  {firstParagraph}
                </AppText>

                {hasDetails ? (
                  <>
                    <Press
                      onPress={() => setShowDetails((current) => !current)}
                      style={styles.readerDetailsToggle}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: showDetails }}
                    >
                      <AppText style={styles.readerDetailsToggleText}>{showDetails ? 'A little less' : 'Explore this idea'}</AppText>
                      <Icon name={showDetails ? 'chevron-up' : 'chevron-down'} size={17} color={LEARN_COLORS.forest} />
                    </Press>
                    {showDetails ? (
                      <View style={styles.readerDetails}>
                        {additionalParagraphs.map((paragraph, index) => (
                          <AppText key={`detail-${index}`} style={styles.readerExtraParagraph}>{paragraph}</AppText>
                        ))}
                        {Array.isArray(section.points) ? (
                          <View style={styles.readerPointList}>
                            {section.points.map((point, index) => (
                              <View key={`point-${index}`} style={styles.readerPointRow}>
                                <View style={styles.readerPointDot} />
                                <AppText style={styles.readerPointText}>{point}</AppText>
                              </View>
                            ))}
                          </View>
                        ) : null}
                        {section.note ? (
                          <View style={styles.readerNote}>
                            <Icon name="information-circle-outline" size={17} color={LEARN_COLORS.forest} />
                            <AppText style={styles.readerNoteText}>{section.note}</AppText>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.readerFinishCard}>
              <View style={styles.readerFinishIcon}><Icon name="checkmark" size={21} color={LEARN_COLORS.forestDeep} /></View>
              <AppText style={styles.readerFinishEyebrow}>A MOMENT TO KEEP</AppText>
              <AppText style={styles.readerFinishTitle}>{article.focus?.title || 'A good place to pause'}</AppText>
              <AppText style={styles.readerFinishText}>
                {article.focus?.body || article.note || 'You can return to this whenever you are ready for another small step.'}
              </AppText>
            </View>
            {article.terms ? <TopicKeyTerms terms={article.terms} /> : null}
            {article.quiz ? (
              <TopicQuiz
                key={article.title}
                quiz={article.quiz}
                completed={completedQuizzes.includes(article.id)}
                onComplete={() => onQuizComplete(article.id)}
              />
            ) : null}
            <Press onPress={onSource} style={styles.readerSourceRow} accessibilityRole="button">
              <View style={styles.readerSourceIcon}><Icon name="open-outline" size={18} color={LEARN_COLORS.forest} /></View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.readerSourceTitle}>{article.sourceTitle || 'Explore a trusted source'}</AppText>
                <AppText style={styles.readerSourceSubtitle}>{article.sourceSubtitle || 'Further reading, whenever you want it'}</AppText>
              </View>
              <Icon name="chevron-forward" size={18} color={LEARN_COLORS.muted} />
            </Press>
            <AppText style={styles.readerDisclaimer}>
              {article.disclaimer || 'This is an educational introduction, not a personal religious ruling. Ask a qualified local teacher about individual questions.'}
            </AppText>
          </>
        )}
      </ScrollView>
      <View style={styles.readerFooter}>
        {!finished ? (
          <View style={styles.readerNavRow}>
            <Press
              onPress={() => moveToSection(sectionIndex - 1)}
              disabled={sectionIndex === 0}
              style={[styles.readerBackAction, sectionIndex === 0 && styles.readerActionDisabled]}
              accessibilityLabel="Previous idea"
              accessibilityState={{ disabled: sectionIndex === 0 }}
            >
              <Icon name="arrow-back" size={17} color={sectionIndex === 0 ? LEARN_COLORS.muted : LEARN_COLORS.forest} />
              <AppText style={[styles.readerBackActionText, sectionIndex === 0 && styles.readerDisabledText]}>Back</AppText>
            </Press>
            <Press
              onPress={() => sectionIndex < sections.length - 1 ? moveToSection(sectionIndex + 1) : setFinished(true)}
              style={styles.readerNextAction}
              accessibilityRole="button"
            >
              <AppText style={styles.readerNextActionText}>
                {sectionIndex < sections.length - 1 ? 'Next idea' : 'Finish reading'}
              </AppText>
              <Icon name="arrow-forward" size={17} color={LEARN_COLORS.card} />
            </Press>
          </View>
        ) : (
          <ActionButton label="Back to learning" icon="arrow-back" kind="secondary" onPress={onBack} />
        )}
      </View>
    </View>
  );
}

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'today', title: 'Today', icon: 'home-outline', selectedIcon: 'home' },
    { id: 'learn', title: 'Learn', icon: 'book-outline', selectedIcon: 'book' },
    { id: 'prayer', title: 'Prayer', icon: 'time-outline', selectedIcon: 'time' },
    { id: 'community', title: 'Community', icon: 'people-outline', selectedIcon: 'people' },
  ];
  const activeTab = active === 'quran' ? 'learn' : active;
  const selectedColor = activeTab === 'learn' ? LEARN_COLORS.forest : COLORS.red;
  return (
    <View style={styles.tabBar}>
      {tabs.map((item) => {
        const selected = item.id === activeTab;
        return (
          <Press
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.tabItem, selected && styles.tabItemSelected]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={item.title}
          >
            <View style={[styles.tabIconWrap, selected && styles.tabIconWrapSelected]}>
              <Icon name={selected ? item.selectedIcon : item.icon} size={20} color={selected ? selectedColor : COLORS.muted} />
            </View>
            <AppText style={[styles.tabLabel, selected && styles.tabLabelSelected, selected && activeTab === 'learn' && { color: LEARN_COLORS.forest }]}>{item.title}</AppText>
          </Press>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, height: '100%', width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: COLORS.canvas, paddingTop: TOP_INSET },
  lightPageRoot: { backgroundColor: '#FFFFFF' },
  mainContent: { flex: 1, minHeight: 0 },
  loading: { flex: 1, backgroundColor: '#321D17', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  loadingMark: { width: 58, height: 58, borderRadius: 18, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
  loadingBrand: { color: COLORS.white, fontSize: 10, fontWeight: '700', letterSpacing: 2.2, marginTop: 16 },
  loadingRule: { width: 30, height: 1, backgroundColor: COLORS.saffron, marginTop: 17 },
  loadingTagline: { color: '#F0E7DF', fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 18, marginTop: 12 },
  text: { color: COLORS.ink, fontSize: 15 },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.6 },
  page: { flex: 1, minHeight: 0 },
  pageContent: { paddingHorizontal: 22, paddingTop: 14 },
  button: { minHeight: 54, borderRadius: 28, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  buttonSecondary: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line },
  buttonQuiet: { backgroundColor: 'transparent' },
  buttonText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  buttonTextSecondary: { color: COLORS.green },
  surface: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 20, padding: 16 },
  eyebrow: { color: COLORS.red, fontSize: 11, letterSpacing: 1.2, fontWeight: '700', marginBottom: 8 },
  titleBlock: { marginBottom: 22 },
  title: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.7 },
  description: { color: COLORS.muted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  sectionTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.25 },
  textAction: { paddingVertical: 5, paddingLeft: 10 },
  textActionLabel: { color: COLORS.green, fontWeight: '700', fontSize: 13 },
  pill: { borderWidth: 1, borderColor: COLORS.line, borderRadius: 30, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: COLORS.paper },
  pillActive: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  pillText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: COLORS.white },
  progressTrack: { height: 6, backgroundColor: COLORS.line, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.red, borderRadius: 6 },
  notice: { marginHorizontal: 14, marginBottom: 6, borderRadius: 12, padding: 11, backgroundColor: '#F8ECE8', flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 2 },
  noticeText: { color: COLORS.danger, fontSize: 12, lineHeight: 17, flex: 1 },

  onboarding: { flex: 1, backgroundColor: COLORS.green },
  onboardingContent: { minHeight: '100%', paddingHorizontal: 24, paddingTop: TOP_INSET + 10, paddingBottom: 24 },
  onboardingDecor: { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: '#FFFFFF12', top: 105, right: -155 },
  brandTagline: { color: '#CAD8D1', fontSize: 12, marginTop: 3 },
  welcomeCopy: { marginTop: 35, marginBottom: 24 },
  welcomeTitle: { color: COLORS.white, fontSize: 44, lineHeight: 49, letterSpacing: -1.2, fontWeight: '700' },
  welcomeBody: { color: '#D4E0D9', fontSize: 16, lineHeight: 24, marginTop: 12, maxWidth: 380 },
  setupCard: { backgroundColor: COLORS.paper, borderRadius: 24, padding: 20 },
  setupTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '700', marginBottom: 18 },
  fieldLabel: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginBottom: 9 },
  nameInput: { height: 48, borderRadius: 13, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 14, color: COLORS.ink, fontSize: 15, marginBottom: 18, backgroundColor: '#FFFFFF' },
  choiceList: { gap: 8 },
  choiceRow: { minHeight: 48, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: COLORS.line, flexDirection: 'row', alignItems: 'center', gap: 11 },
  choiceSelected: { backgroundColor: COLORS.greenLight, borderColor: '#CAD8CA' },
  choiceText: { color: COLORS.ink, fontSize: 14, fontWeight: '600', flex: 1 },
  privateNote: { color: COLORS.muted, fontSize: 12, marginTop: 14 },
  welcomeFootnote: { color: '#D4E0D9', fontSize: 13, textAlign: 'center', marginTop: 20 },

  heroCard: { borderRadius: 25, minHeight: 248, padding: 21, overflow: 'hidden' },
  heroOrbitOuter: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: '#FFFFFF18', right: -84, top: -98 },
  heroOrbitInner: { position: 'absolute', width: 148, height: 148, borderRadius: 74, borderWidth: 1, borderColor: '#FFFFFF17', right: -48, top: -62 },
  heroTitle: { color: COLORS.white, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, fontWeight: '700', maxWidth: 310 },
  heroDescription: { color: '#D4E0D9', fontSize: 14, lineHeight: 20, marginTop: 5, maxWidth: 315 },
  heroProgress: { marginTop: 20 },
  heroProgressLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  heroProgressText: { color: '#E6ECE8', fontSize: 12, fontWeight: '600' },
  heroLink: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 17, paddingVertical: 4 },
  heroLinkText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  nextPrayerCard: { backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  nextPrayerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' },
  nextPrayerEyebrow: { color: COLORS.muted, fontSize: 10, letterSpacing: 0.7, fontWeight: '700' },
  nextPrayerName: { color: COLORS.ink, fontSize: 16, fontWeight: '700', marginTop: 3 },
  nextPrayerHint: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  lessonCard: { borderRadius: 19, padding: 14, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, flexDirection: 'row', alignItems: 'center', gap: 12 },
  lessonIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' },
  lessonCopy: { flex: 1 },
  lessonMeta: { color: COLORS.greenMid, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  lessonTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '700', marginTop: 4 },
  lessonSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  arrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.canvas, alignItems: 'center', justifyContent: 'center' },
  prayerSummary: { padding: 15 },
  prayerDots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prayerDotItem: { alignItems: 'center', width: 40 },
  prayerDot: { width: 27, height: 27, borderRadius: 14, borderWidth: 1.5, borderColor: '#D9DED6', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.paper },
  prayerDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D9DED6' },
  prayerDotDone: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  prayerDotLabel: { color: COLORS.muted, fontSize: 10, marginTop: 5 },
  prayerConnector: { height: 1, backgroundColor: COLORS.line, position: 'absolute', width: 24, top: 13, left: 32, zIndex: -1 },
  prayerConnectorDone: { backgroundColor: COLORS.greenMid },
  summaryNote: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 14 },
  homeFooter: { flexDirection: 'row', gap: 9, alignItems: 'center', marginTop: 22, paddingHorizontal: 3 },
  homeFooterText: { color: COLORS.greenMid, flex: 1, fontSize: 12, lineHeight: 18 },

  learnGameRoot: { flex: 1, minHeight: 0, backgroundColor: LEARN_COLORS.cream },
  learnGameScroll: { flex: 1, minHeight: 0, backgroundColor: LEARN_COLORS.cream },
  learnGameContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
  learnGameNav: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 17, padding: 4, backgroundColor: COLORS.canvas, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 15 },
  learnGameNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 0, minWidth: 0, minHeight: 36, borderRadius: 11 },
  learnGameNavItemSelected: { backgroundColor: LEARN_COLORS.forest },
  learnGameNavIcon: { alignItems: 'center', justifyContent: 'center' },
  learnGameNavLabel: { color: LEARN_COLORS.muted, fontSize: 8, fontWeight: '600' },
  learnGameNavLabelSelected: { color: '#FFFFFF', fontWeight: '700' },
  learnGameHeading: { marginBottom: 12 },
  learnGameEyebrow: { color: LEARN_COLORS.forest, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  learnGameTitle: { color: LEARN_COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 28, lineHeight: 34, marginTop: 4 },
  learnGameSubtitle: { color: LEARN_COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  learnStatsCard: { padding: 15, marginBottom: 16, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EEE4D7', borderRadius: 25 },
  learnStatsMetricRow: { minHeight: 82, flexDirection: 'row', alignItems: 'stretch' },
  learnStatsMetric: { flex: 1, minWidth: 0, position: 'relative', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 3 },
  learnStatsMetricDivider: { position: 'absolute', top: 3, right: 0, bottom: 3, width: 1, backgroundColor: '#EAE0D2' },
  learnStatsMetricValue: { maxWidth: '100%', color: LEARN_COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 20, lineHeight: 25, fontWeight: '500', textAlign: 'center' },
  learnStatsMetricLabel: { color: '#887B73', fontSize: 8, letterSpacing: 1.2, fontWeight: '700' },
  learnStatsDashedDivider: { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: '#E8DDD0', marginTop: 12, marginBottom: 15 },
  learnStatsWeek: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2 },
  learnStatsDay: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6 },
  learnStatsDayMark: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F6F2ED' },
  learnStatsDayMarkActive: { backgroundColor: '#F8E9DB' },
  learnStatsDayMarkOpportunity: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C99491', backgroundColor: '#FFFFFF' },
  learnStatsDayOpportunity: { color: LEARN_COLORS.forest, fontSize: 11, fontWeight: '700' },
  learnStatsDayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#D7CEC5' },
  learnStatsDayLabel: { color: '#80766F', fontSize: 10, fontWeight: '500' },
  learnStatsDayLabelToday: { color: LEARN_COLORS.forest, fontWeight: '700' },
  learnCurrentCard: { padding: 17, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: '#F0E4E1', borderRadius: 22, marginBottom: 23, shadowColor: '#9B2D2B', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  learnCurrentTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  learnCurrentHeading: { flex: 1, minWidth: 0 },
  learnCurrentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  learnCurrentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LEARN_COLORS.forest },
  learnCurrentEyebrow: { color: LEARN_COLORS.forest, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  learnCurrentStep: { color: '#A1958D', fontSize: 8, fontWeight: '600', letterSpacing: 0.5 },
  learnCurrentTitle: { color: LEARN_COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 20, lineHeight: 25, fontWeight: '500', marginTop: 7 },
  learnCurrentSubtitle: { color: LEARN_COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  learnRewardPill: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0, borderRadius: 12, backgroundColor: '#FBF1E9', paddingHorizontal: 9, paddingVertical: 6 },
  learnRewardPillText: { color: '#9B6A1C', fontSize: 9, fontWeight: '800' },
  learnCurrentProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 16 },
  learnCurrentTrack: { height: 7, flex: 1, borderRadius: 4, backgroundColor: '#F1EAE5', overflow: 'hidden' },
  learnCurrentFill: { height: '100%', borderRadius: 4, backgroundColor: LEARN_COLORS.forest },
  learnCurrentPercent: { color: LEARN_COLORS.forest, fontSize: 9, fontWeight: '800' },
  learnCurrentArrow: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: LEARN_COLORS.forest },
  learnMapHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  learnMapTitle: { color: LEARN_COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 19, lineHeight: 24 },
  learnMapSubtitle: { color: LEARN_COLORS.muted, fontSize: 9, marginTop: 2 },
  learnMapCount: { color: LEARN_COLORS.forest, fontSize: 11, fontWeight: '800' },
  learnMap: { height: 850, position: 'relative', marginTop: 2, marginBottom: 5 },
  learnMapDrawing: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  learnMapNode: { position: 'absolute', width: 96, alignItems: 'center' },
  learnMapStars: { height: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 },
  learnMapBadge: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  learnMapBadgeIcon: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  learnMapStep: { color: LEARN_COLORS.muted, fontSize: 7, lineHeight: 10, fontWeight: '800', letterSpacing: 0.7, marginTop: 3 },
  learnMapStepActive: { color: LEARN_COLORS.forest },
  learnMapNodeTitle: { color: LEARN_COLORS.ink, fontSize: 10, lineHeight: 13, fontWeight: '700', textAlign: 'center', marginTop: 3, maxWidth: 94 },
  learnMapNodeMeta: { color: LEARN_COLORS.muted, fontSize: 8, lineHeight: 11, marginTop: 3 },
  learnScoreCard: { minHeight: 143, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', borderRadius: 22, padding: 17, marginBottom: 16, overflow: 'hidden' },
  learnScoreCopy: { flex: 1 },
  learnScoreEyebrow: { color: '#F7EAE7', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  learnScoreValue: { color: '#FFFFFF', fontSize: 28, lineHeight: 34, fontWeight: '800', marginTop: 3 },
  learnScoreLabel: { color: '#F7EAE7', fontSize: 10 },
  learnScoreIcon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF1C' },
  learnScoreBottom: { width: '100%', marginTop: 15 },
  learnScoreTrack: { height: 6, borderRadius: 4, backgroundColor: '#FFFFFF38', overflow: 'hidden' },
  learnScoreFill: { height: '100%', borderRadius: 4, backgroundColor: LEARN_COLORS.gold },
  learnScoreNext: { color: '#F7EAE7', fontSize: 8, marginTop: 5 },
  learnPeriodSwitch: { flexDirection: 'row', padding: 4, backgroundColor: COLORS.canvas, borderRadius: 15, marginBottom: 13 },
  learnPeriodButton: { flex: 1, minHeight: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  learnPeriodButtonSelected: { backgroundColor: '#FFFFFF', shadowColor: LEARN_COLORS.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  learnPeriodText: { color: LEARN_COLORS.muted, fontSize: 10, fontWeight: '600' },
  learnPeriodTextSelected: { color: LEARN_COLORS.forest, fontWeight: '800' },
  learnActivityCard: { padding: 15, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 19, marginBottom: 12 },
  learnActivityHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  learnCardTitle: { color: LEARN_COLORS.ink, fontSize: 12, fontWeight: '800' },
  learnCardSubtitle: { color: LEARN_COLORS.muted, fontSize: 9, marginTop: 3 },
  learnActivityCount: { color: LEARN_COLORS.forest, fontSize: 9, fontWeight: '800' },
  learnActivityBars: { height: 86, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 12 },
  learnActivityDay: { flex: 1, alignItems: 'center', gap: 5 },
  learnActivityBarTrack: { width: 22, height: 54, justifyContent: 'flex-end', backgroundColor: COLORS.canvas, borderRadius: 9, overflow: 'hidden' },
  learnActivityBar: { height: 9, backgroundColor: COLORS.line, borderRadius: 9 },
  learnActivityBarActive: { height: 45, backgroundColor: LEARN_COLORS.forest },
  learnActivityLabel: { color: LEARN_COLORS.muted, fontSize: 8, fontWeight: '600' },
  learnStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  learnStatCard: { width: '48%', minHeight: 103, padding: 12, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 18 },
  learnStatIcon: { width: 29, height: 29, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: LEARN_COLORS.forestLight },
  learnStatValue: { color: LEARN_COLORS.ink, fontSize: 17, fontWeight: '800', marginTop: 7 },
  learnStatLabel: { color: LEARN_COLORS.muted, fontSize: 9, marginTop: 2 },
  learnExploreSwitch: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  learnExploreTab: { minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: LEARN_COLORS.line, backgroundColor: LEARN_COLORS.card, paddingHorizontal: 14 },
  learnExploreTabSelected: { backgroundColor: LEARN_COLORS.forest, borderColor: LEARN_COLORS.forest },
  learnExploreTabText: { color: LEARN_COLORS.muted, fontSize: 10, fontWeight: '700' },
  learnExploreTabTextSelected: { color: '#FFFFFF' },
  learnExploreGroup: { marginBottom: 15 },
  learnExploreList: { backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 17, paddingHorizontal: 12 },
  learnFilterRow: { gap: 8, paddingRight: 22, paddingBottom: 12 },
  learnFilterChip: { minHeight: 32, justifyContent: 'center', backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 17, paddingHorizontal: 11 },
  learnFilterChipActive: { backgroundColor: LEARN_COLORS.forest, borderColor: LEARN_COLORS.forest },
  learnFilterText: { color: LEARN_COLORS.muted, fontSize: 10, fontWeight: '600' },
  learnFilterTextActive: { color: '#FFFFFF' },
  learnGroupTitle: { color: LEARN_COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 16, marginBottom: 5 },
  learnGuideRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8, borderBottomWidth: 1, borderColor: LEARN_COLORS.line },
  learnGuideIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: LEARN_COLORS.forestLight },
  learnGuideIconComplete: { backgroundColor: LEARN_COLORS.goldLight },
  learnGuideCopy: { flex: 1, minWidth: 0 },
  learnGuideTitle: { color: LEARN_COLORS.ink, fontSize: 11, fontWeight: '700' },
  learnGuideSubtitle: { color: LEARN_COLORS.muted, fontSize: 9, marginTop: 2 },
  learnGuideDuration: { color: LEARN_COLORS.muted, fontSize: 9 },
  topicCategoryRow: { gap: 7, paddingRight: 22, marginBottom: 10 },
  topicCategoryChip: { minHeight: 34, justifyContent: 'center', backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 18, paddingHorizontal: 12 },
  topicCategoryChipActive: { backgroundColor: LEARN_COLORS.forest, borderColor: LEARN_COLORS.forest },
  topicCategoryText: { color: LEARN_COLORS.muted, fontSize: 10, fontWeight: '600' },
  topicCategoryTextActive: { color: '#FFFFFF' },
  topicList: { backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 18, paddingHorizontal: 12 },
  topicRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderColor: LEARN_COLORS.line },
  topicRowLast: { borderBottomWidth: 0 },
  topicRowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: LEARN_COLORS.forestLight, alignItems: 'center', justifyContent: 'center' },
  topicRowCopy: { flex: 1, minWidth: 0 },
  topicRowTitle: { color: LEARN_COLORS.ink, fontSize: 12, fontWeight: '700' },
  topicRowPreview: { color: LEARN_COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  learnAwardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 4 },
  learnAwardCard: { width: '48%', minHeight: 153, alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 18 },
  learnAwardCardEarned: { borderColor: '#E8C7C4', backgroundColor: '#FFFCFB' },
  learnAwardMedal: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  learnAwardMedalEarned: { transform: [{ scale: 1.04 }] },
  learnAwardIcon: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  learnAwardTitle: { color: LEARN_COLORS.ink, fontSize: 11, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  learnAwardStatus: { color: LEARN_COLORS.muted, fontSize: 8, lineHeight: 12, textAlign: 'center', marginTop: 3 },
  learnEncouragement: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, marginTop: 14, backgroundColor: LEARN_COLORS.goldLight, borderRadius: 15 },
  learnEncouragementText: { flex: 1, color: LEARN_COLORS.ink, fontSize: 10, lineHeight: 15 },
  learnProfileCard: { alignItems: 'center', padding: 20, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 20 },
  learnAvatar: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: LEARN_COLORS.forestLight, borderWidth: 3, borderColor: '#E8C7C4' },
  learnAvatarInitial: { color: LEARN_COLORS.forest, fontSize: 28, fontWeight: '800' },
  learnProfileName: { color: LEARN_COLORS.ink, fontSize: 15, fontWeight: '800', marginTop: 10 },
  learnProfileLevel: { color: LEARN_COLORS.forest, fontSize: 9, fontWeight: '800', letterSpacing: 0.6, marginTop: 4 },
  learnProfileStats: { flexDirection: 'row', justifyContent: 'space-between', gap: 7, marginTop: 11 },
  learnProfileStat: { flex: 1, minHeight: 85, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 6, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 15 },
  learnProfileStatValue: { color: LEARN_COLORS.ink, fontSize: 13, fontWeight: '800' },
  learnProfileStatLabel: { color: LEARN_COLORS.muted, fontSize: 7, textAlign: 'center' },
  learnProfileSectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 21, marginBottom: 9 },
  learnTextLink: { color: LEARN_COLORS.forest, fontSize: 10, fontWeight: '800' },
  learnProfileBadges: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, padding: 12, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 16 },
  learnProfileBadge: { flex: 1, alignItems: 'center', gap: 4 },
  learnProfileBadgeIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: COLORS.canvas },
  learnProfileBadgeIconEarned: { backgroundColor: LEARN_COLORS.forestLight },
  learnProfileBadgeLabel: { color: LEARN_COLORS.muted, fontSize: 7, maxWidth: '100%' },
  learnProfileAction: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, marginTop: 12, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 15 },
  learnProfileActionText: { flex: 1, color: LEARN_COLORS.ink, fontSize: 11, fontWeight: '700' },
  learnGameDisclaimer: { color: LEARN_COLORS.muted, fontSize: 8, textAlign: 'center', marginTop: 15, marginBottom: 2 },
  topicCategoryRow: { gap: 7, paddingRight: 22, marginBottom: 10 },
  topicCategoryChip: { minHeight: 34, justifyContent: 'center', backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 18, paddingHorizontal: 12 },
  topicCategoryChipActive: { backgroundColor: LEARN_COLORS.forest, borderColor: LEARN_COLORS.forest },
  topicCategoryText: { color: LEARN_COLORS.muted, fontSize: 10, fontWeight: '600' },
  topicCategoryTextActive: { color: '#FFFFFF' },
  topicList: { backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 18, paddingHorizontal: 12 },
  topicRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderColor: LEARN_COLORS.line },
  topicRowLast: { borderBottomWidth: 0 },
  topicRowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: LEARN_COLORS.forestLight, alignItems: 'center', justifyContent: 'center' },
  topicRowCopy: { flex: 1, minWidth: 0 },
  topicRowTitle: { color: LEARN_COLORS.ink, fontSize: 12, fontWeight: '700' },
  topicRowPreview: { color: LEARN_COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  disclaimer: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 16, marginBottom: 4 },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 7 : 9,
    paddingHorizontal: 5,
    paddingVertical: 6,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 24,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 7,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 54, borderRadius: 18, paddingVertical: 3 },
  tabItemSelected: { backgroundColor: 'transparent' },
  tabIconWrap: { width: 38, height: 26, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tabIconWrapSelected: { backgroundColor: 'transparent' },
  tabLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  tabLabelSelected: { color: COLORS.red, fontWeight: '700' },

  detailRoot: { flex: 1, minHeight: 0, backgroundColor: COLORS.canvas },
  prayerGuideRoot: { backgroundColor: '#FFFFFF' },
  prayerGuideActions: { backgroundColor: '#FFFFFF' },
  readerRoot: { backgroundColor: LEARN_COLORS.cream },
  detailScroll: { flex: 1, minHeight: 0 },
  detailHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  detailHeaderTitle: { color: COLORS.ink, textAlign: 'center', fontWeight: '700', fontSize: 15 },
  detailHeaderStep: { color: COLORS.muted, fontSize: 10, textAlign: 'center', marginTop: 3, letterSpacing: 0.8 },
  headerSpacer: { width: 40 },
  detailProgress: { paddingHorizontal: 22, paddingTop: 12 },
  detailContent: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 24 },
  prayerGuideIntro: { padding: 15, marginBottom: 12, backgroundColor: '#FBF1EF', borderRadius: 20 },
  prayerGuideEyebrow: { color: PRAYER_ACCENT, fontSize: 8, lineHeight: 12, letterSpacing: 1, fontWeight: '800' },
  prayerGuideIntroTitle: { color: COLORS.ink, fontSize: 19, lineHeight: 24, fontWeight: '700', marginTop: 3 },
  prayerGuideBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  prayerGuideBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFFFFF' },
  prayerGuideBadgeText: { color: PRAYER_HERO_COLOR, fontSize: 9, fontWeight: '600' },
  prayerGuideDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 9 },
  wuduGuideIntro: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, marginBottom: 12, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18 },
  wuduGuideIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.greenLight },
  prayerBeforeBegin: { marginBottom: 14 },
  prayerBeforeBeginTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  prayerBeforeBeginItems: { flexDirection: 'row', gap: 7 },
  prayerBeforeBeginItem: { flex: 1, minWidth: 0, alignItems: 'center', gap: 6, paddingVertical: 9, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1E8E4', borderRadius: 16 },
  prayerBeforeBeginIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#FBF1EF' },
  prayerBeforeBeginText: { color: COLORS.ink, fontSize: 9, fontWeight: '600', textAlign: 'center' },
  prayerRakahOverview: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, marginBottom: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7E1', borderRadius: 16 },
  prayerRakahOverviewIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FBF1EF' },
  prayerRakahOverviewCopy: { flex: 1, minWidth: 0 },
  prayerRakahOverviewTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  prayerRakahOverviewText: { color: COLORS.muted, fontSize: 9, lineHeight: 13, marginTop: 2 },
  prayerGuideVideo: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, marginBottom: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7E1', borderRadius: 17 },
  prayerGuideVideoIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FBF1EF' },
  prayerGuideVideoCopy: { flex: 1, minWidth: 0 },
  prayerGuideVideoTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  prayerGuideVideoMeta: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  prayerStepNavigator: { padding: 12, marginBottom: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7E1', borderRadius: 18 },
  prayerStepNavigatorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  prayerStepNavigatorTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '700' },
  prayerStepNavigatorCount: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  prayerStepList: { flexDirection: 'row', gap: 4 },
  prayerStepChip: { width: 28, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F8F5F1' },
  prayerStepChipSelected: { backgroundColor: PRAYER_HERO_COLOR },
  prayerStepChipText: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  prayerStepChipTextSelected: { color: '#FFFFFF' },
  prayerCurrentStepCard: { padding: 14, marginBottom: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7E1', borderRadius: 20 },
  prayerStepHeadingRow: { marginBottom: 11 },
  prayerStepTitle: { fontFamily: Platform.OS === 'android' ? 'sans-serif' : 'Arial', fontSize: 17, lineHeight: 23, fontWeight: '700' },
  prayerStepBody: { color: '#675D57', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  prayerRecitationTabs: { flexDirection: 'row', gap: 4, padding: 4, marginBottom: 9, backgroundColor: '#F8F5F1', borderRadius: 20 },
  prayerRecitationTab: { flex: 1, minHeight: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  prayerRecitationTabSelected: { backgroundColor: '#211D1A' },
  prayerRecitationTabText: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  prayerRecitationTabTextSelected: { color: '#FFFFFF' },
  prayerRecitationCard: { padding: 14, marginBottom: 0, backgroundColor: '#F8F5F1', borderRadius: 16, alignItems: 'center' },
  detailHero: { backgroundColor: COLORS.green, borderRadius: 22, padding: 20, overflow: 'hidden', marginBottom: 22 },
  editorialMotif: { position: 'absolute', top: 8, right: 8, width: 96, height: 96, opacity: 0.82 },
  detailHeroIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#FFFFFFE8', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  detailHeroTitle: { color: COLORS.white, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5, maxWidth: '84%' },
  detailHeroIntro: { color: '#E0E9E3', fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: '88%' },
  followAlongSection: { padding: 14, marginBottom: 23, backgroundColor: COLORS.paper, borderRadius: 20, borderWidth: 1, borderColor: COLORS.line },
  followAlongHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  followAlongTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 19, lineHeight: 24, fontWeight: '700' },
  videoDuration: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12, backgroundColor: COLORS.greenLight },
  videoDurationText: { color: COLORS.green, fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  followAlongPlayer: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderRadius: 15, backgroundColor: '#101412' },
  videoThumbnail: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  videoPlayButton: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: COLORS.red, borderWidth: 1, borderColor: '#FFFFFFA0' },
  videoThumbnailCaption: { position: 'absolute', left: 12, bottom: 11, color: COLORS.white, fontSize: 9, fontWeight: '700', letterSpacing: 0.9 },
  videoAttribution: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
  videoTitle: { color: COLORS.ink, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  videoSource: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  videoOpenLink: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingVertical: 5, marginTop: 4 },
  videoOpenLinkText: { color: COLORS.green, fontSize: 11, fontWeight: '700' },
  followAlongHint: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 9 },
  videoChaptersLabel: { color: COLORS.red, fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginTop: 14, marginBottom: 8 },
  videoChapters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  videoChapter: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.canvas },
  videoChapterSelected: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  videoChapterTitle: { color: COLORS.green, fontSize: 10, fontWeight: '600' },
  videoChapterTime: { color: COLORS.muted, fontSize: 9 },
  stepHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
  stepIndex: { width: 34, height: 34, borderRadius: 12, backgroundColor: COLORS.peach, alignItems: 'center', justifyContent: 'center' },
  stepIndexText: { color: COLORS.green, fontWeight: '700', fontSize: 12 },
  stepTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 21, fontWeight: '700', flex: 1 },
  prayerStepVisual: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11, paddingVertical: 9, marginBottom: 12, borderRadius: 16, backgroundColor: '#FBF1EF' },
  prayerStepArtwork: { width: 78, height: 66, alignItems: 'center', justifyContent: 'center' },
  prayerStepVisualCopy: { flex: 1 },
  prayerStepVisualTitle: { color: PRAYER_HERO_COLOR, fontSize: 12, fontWeight: '700' },
  prayerStepVisualHint: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  stepBody: { color: '#52615A', fontSize: 16, lineHeight: 25, marginBottom: 18 },
  recitationCard: { padding: 18, borderRadius: 18, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, marginBottom: 14, alignItems: 'center' },
  arabicLine: { color: COLORS.ink, textAlign: 'center', fontSize: 28, lineHeight: 52, writingDirection: 'rtl', marginBottom: 7 },
  transliteration: { color: COLORS.green, textAlign: 'center', fontWeight: '700', fontSize: 16, lineHeight: 24 },
  translation: { color: COLORS.muted, textAlign: 'center', fontSize: 14, lineHeight: 21, marginTop: 7 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 15, backgroundColor: COLORS.greenLight, padding: 14, marginBottom: 16 },
  tipText: { color: COLORS.green, fontSize: 12, lineHeight: 18, flex: 1 },
  inlineResources: { paddingTop: 5 },
  inlineResourceRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12, borderBottomWidth: 1, borderColor: COLORS.line },
  inlineResourceIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center' },
  inlineResourceTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '700' },
  inlineResourceSub: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  detailActions: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 25 : 16, backgroundColor: COLORS.canvas, borderTopWidth: 1, borderColor: COLORS.line },
  detailPrevious: { width: 52, height: 52, borderRadius: 18, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  detailPreviousDisabled: { opacity: 0.55 },

  quranWelcome: { borderRadius: 22, padding: 20, marginBottom: 16, overflow: 'hidden' },
  quranWelcomeContent: { position: 'relative', zIndex: 1 },
  quranWelcomeTitle: { color: COLORS.white, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontWeight: '700', fontSize: 30, marginTop: 1, maxWidth: '76%' },
  quranWelcomeSub: { color: '#D4E0D9', fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: '84%' },
  quranListen: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, marginTop: 12 },
  quranListenText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  readingControls: { marginBottom: 16, gap: 8 },
  controlsLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1.1 },
  readingToggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  readingToggle: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 6 },
  readingToggleOn: { backgroundColor: COLORS.greenLight, borderColor: '#D4DFD6' },
  readingToggleText: { color: COLORS.muted, fontSize: 11 },
  readingToggleTextOn: { color: COLORS.green, fontWeight: '700' },
  verseList: { borderTopWidth: 1, borderColor: COLORS.line },
  verseCard: { paddingVertical: 17, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: COLORS.line, borderRadius: 0, backgroundColor: 'transparent' },
  verseTopline: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  verseNumber: { width: 26, height: 26, borderRadius: 5, backgroundColor: '#EEECE4', alignItems: 'center', justifyContent: 'center' },
  verseNumberText: { color: COLORS.green, fontSize: 11, fontWeight: '700' },
  verseReference: { color: COLORS.muted, fontSize: 10, letterSpacing: 0.8, fontWeight: '700' },
  verseArabic: { color: COLORS.ink, fontSize: 25, textAlign: 'right', lineHeight: 46, writingDirection: 'rtl', marginBottom: 7 },
  verseTransliteration: { color: COLORS.green, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  verseMeaning: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 5 },

  prayerScroll: { backgroundColor: '#FFFFFF' },
  prayerPage: { paddingTop: 14, backgroundColor: '#FFFFFF' },
  prayerNextSection: { alignItems: 'center', marginBottom: 17 },
  prayerNextTopline: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prayerNextLabel: { color: '#9A6B64', fontSize: 9, letterSpacing: 2.2, fontWeight: '700' },
  prayerDate: { color: '#9B8F85', fontSize: 10 },
  prayerNextName: { color: COLORS.ink, fontSize: 58, lineHeight: 66, letterSpacing: -1.5, fontWeight: '700', textAlign: 'center', marginTop: 1 },
  prayerCountdownPill: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FBF1EF', marginTop: 5 },
  prayerCountdownDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D9A69B' },
  prayerCountdownText: { color: PRAYER_HERO_COLOR, fontSize: 11, fontWeight: '700' },
  prayerCountdownTime: { color: '#897D74', fontSize: 10 },
  prayerInterval: { width: '100%', marginTop: 21, marginBottom: 11, paddingHorizontal: 30 },
  prayerIntervalTrack: { height: 4, overflow: 'hidden', borderRadius: 2, backgroundColor: '#F4EBE8' },
  prayerIntervalFill: { height: '100%', borderRadius: 2, backgroundColor: PRAYER_HERO_COLOR },
  prayerIntervalLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 },
  prayerIntervalLabel: { color: '#9B8F85', fontSize: 9 },
  prayerLocationBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 28, marginTop: 2 },
  prayerScheduleLocation: { maxWidth: 160, color: '#897D74', fontSize: 10, fontWeight: '500' },
  prayerLocationButton: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 5 },
  prayerLocationButtonText: { color: PRAYER_HERO_COLOR, fontSize: 10, fontWeight: '700' },
  prayerSchedulePanel: { paddingHorizontal: 11, paddingTop: 13, paddingBottom: 12, marginBottom: 18, backgroundColor: PRAYER_HERO_COLOR, borderRadius: 25, shadowColor: '#672B26', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 13, elevation: 4 },
  prayerScheduleHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  prayerTodayTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  prayerCheckInCount: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  prayerTimesList: { width: '100%', flexDirection: 'row', gap: 3 },
  prayerTimeRow: { flex: 1, minWidth: 0, minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 1, paddingVertical: 7, borderRadius: 17 },
  prayerTimeRowNext: { backgroundColor: '#FFFFFF' },
  prayerTimeName: { color: '#F2D8D2', fontWeight: '500', fontSize: 9, textAlign: 'center' },
  prayerTimeNameNext: { color: PRAYER_HERO_COLOR, fontWeight: '700' },
  prayerTimeValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  prayerTimeValueNext: { color: PRAYER_HERO_COLOR, fontWeight: '700' },
  prayerTimeStatus: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', marginTop: 3, borderRadius: 19, borderWidth: 1.5, borderColor: '#FFFFFF65', backgroundColor: 'transparent' },
  prayerTimeStatusNext: { borderColor: '#F0D8D2', backgroundColor: '#FFFFFF' },
  prayerTimeStatusDone: { borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' },
  prayerRhythm: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 11, marginTop: 7, borderRadius: 15, backgroundColor: '#FFFFFF24' },
  prayerRhythmLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  prayerRhythmText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  prayerRhythmDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  prayerRhythmDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFFFFF5C' },
  prayerRhythmDotActive: { backgroundColor: '#FFFFFF' },
  prayerScheduleError: { color: '#FFE2D9', fontSize: 11, lineHeight: 16, marginTop: 9 },
  qiblaCard: { padding: 14, marginTop: 0, marginBottom: 7, backgroundColor: '#FBF1EF', borderRadius: 25 },
  qiblaCardHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8 },
  qiblaCardHeading: { flex: 1, minWidth: 0 },
  qiblaCardTitle: { color: COLORS.ink, fontSize: 18, lineHeight: 23, fontWeight: '700' },
  qiblaCardBearing: { color: '#8E8582', fontSize: 10, lineHeight: 14, marginTop: 1 },
  qiblaCardActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  qiblaExpandButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#FFFFFF' },
  qiblaCompassStage: { alignItems: 'center', marginTop: 10, marginBottom: 8 },
  qiblaCompass: { width: '100%', maxWidth: 300, aspectRatio: 1, borderRadius: 150, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', position: 'relative', shadowColor: '#843B2E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  qiblaCompassRose: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  qiblaCompassCardinal: { position: 'absolute', color: '#AA9B98', fontSize: 10, fontWeight: '700' },
  qiblaCompassNorth: { top: 17, left: 0, right: 0, color: PRAYER_HERO_COLOR, textAlign: 'center' },
  qiblaCompassEast: { top: '50%', right: 19, transform: [{ translateY: -7 }] },
  qiblaCompassSouth: { left: 0, right: 0, bottom: 17, textAlign: 'center' },
  qiblaCompassWest: { top: '50%', left: 19, transform: [{ translateY: -7 }] },
  qiblaTargetIndicator: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center' },
  qiblaTargetMarker: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginTop: 8, borderRadius: 12, backgroundColor: PRAYER_HERO_COLOR },
  qiblaAlignmentPulse: { position: 'absolute', width: 146, height: 146, borderRadius: 73, borderWidth: 2, borderColor: PRAYER_ACCENT },
  qiblaCompassCenter: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 56, backgroundColor: '#FBF1EF' },
  qiblaCompassCenterAligned: { backgroundColor: '#F5E9E5' },
  qiblaCompassDegrees: { color: COLORS.ink, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  qiblaCompassCenterText: { color: '#887B77', fontSize: 10, fontWeight: '500' },
  qiblaNorthMarker: { position: 'absolute', top: -4, left: '50%', width: 0, height: 0, marginLeft: -7, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: PRAYER_HERO_COLOR },
  qiblaActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qiblaRefreshButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#FFFFFF' },
  qiblaStatus: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 17, backgroundColor: '#FFFFFF' },
  qiblaStatusAligned: { backgroundColor: PRAYER_HERO_COLOR },
  qiblaStatusText: { flex: 1, color: PRAYER_HERO_COLOR, fontSize: 10, lineHeight: 14, fontWeight: '600', textAlign: 'center' },
  qiblaStatusTextAligned: { color: '#FFFFFF' },
  qiblaStartButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 17, backgroundColor: PRAYER_HERO_COLOR },
  qiblaActionPrimary: { flex: 1 },
  qiblaStartButtonDisabled: { opacity: 0.75 },
  qiblaStartButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  qiblaFeedbackNote: { color: '#887B77', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 8 },
  qiblaPrivacyNote: { color: '#897D74', fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 6, marginBottom: 19 },
  qiblaError: { color: COLORS.danger, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8 },
  prayerLearnSection: { marginTop: 1, marginBottom: 8 },
  prayerLearnHeader: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  prayerLearnHeaderCopy: { flex: 1, minWidth: 0 },
  prayerLearnTitle: { color: COLORS.ink, fontSize: 24, lineHeight: 30, fontWeight: '700' },
  prayerLearnSubtitle: { color: '#897D74', fontSize: 11, lineHeight: 16, marginTop: 2 },
  prayerLearnHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  prayerNoRush: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, borderRadius: 17, backgroundColor: '#FBF1EF' },
  prayerNoRushText: { color: PRAYER_HERO_COLOR, fontSize: 9, fontWeight: '600' },
  prayerLearnExpandButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEE6E0' },
  prayerLearnTabs: { flexDirection: 'row', gap: 4, padding: 5, marginBottom: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7E1', borderRadius: 28 },
  prayerLearnTab: { flex: 1, minWidth: 0, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderRadius: 23 },
  prayerLearnTabSelected: { backgroundColor: '#211D1A' },
  prayerLearnTabText: { color: '#8C827B', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  prayerLearnTabTextSelected: { color: '#FFFFFF' },
  prayerWalkthroughHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 9 },
  prayerWalkthroughTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '700' },
  prayerWalkthroughHint: { color: '#9B8F85', fontSize: 9 },
  prayerWalkthroughList: { gap: 7 },
  prayerWalkthroughCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFE7E1', borderRadius: 17 },
  prayerWalkthroughCardNext: { borderColor: '#DFC4BA', backgroundColor: '#FFFCFB' },
  prayerWalkthroughRakahs: { width: 31, height: 31, color: PRAYER_HERO_COLOR, backgroundColor: '#FBF1EF', borderRadius: 11, fontSize: 15, lineHeight: 31, textAlign: 'center', fontWeight: '700' },
  prayerWalkthroughRakahsNext: { color: '#FFFFFF', backgroundColor: PRAYER_HERO_COLOR },
  prayerWalkthroughCopy: { flex: 1, minWidth: 0 },
  prayerWalkthroughName: { color: COLORS.ink, fontSize: 12, fontWeight: '700' },
  prayerWalkthroughMeta: { color: '#897D74', fontSize: 9, lineHeight: 13, marginTop: 2 },
  prayerWalkthroughNextBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 12, backgroundColor: '#F5EAE5' },
  prayerWalkthroughNextText: { color: PRAYER_HERO_COLOR, fontSize: 8, fontWeight: '700' },
  prayerLearningPanel: { padding: 13, backgroundColor: '#FFFCFB', borderWidth: 1, borderColor: '#F1E6E2', borderRadius: 19 },
  prayerLearningPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 9 },
  prayerLearningPanelIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#FBF1EF' },
  prayerLearningPanelCopy: { flex: 1, minWidth: 0 },
  prayerLearningPanelTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '700' },
  prayerLearningPanelDescription: { color: '#897D74', fontSize: 10, marginTop: 2 },
  wuduStepsList: { borderTopWidth: 1, borderTopColor: '#F0E9E2' },
  wuduStepRow: { minHeight: 37, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#F0E9E2' },
  wuduStepNumberText: { width: 22, color: '#D2A69C', fontSize: 9, fontWeight: '700' },
  wuduStepTitle: { color: '#39312D', fontSize: 10, fontWeight: '500' },
  prayerLearningAction: { minHeight: 43, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 11, borderRadius: 15, backgroundColor: '#FBF1EF' },
  prayerLearningActionText: { color: PRAYER_HERO_COLOR, fontSize: 11, fontWeight: '700' },
  prayerVocabularyList: { backgroundColor: '#FFFCFB', borderWidth: 1, borderColor: '#EFE7E1', borderRadius: 19, paddingHorizontal: 13 },
  prayerVocabularyRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0E9E2' },
  prayerVocabularyIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#FBF1EF' },
  prayerVocabularyCopy: { flex: 1, minWidth: 0 },
  prayerVocabularyTerm: { color: COLORS.ink, fontSize: 12, fontWeight: '700' },
  prayerVocabularyMeaning: { color: '#897D74', fontSize: 10, lineHeight: 14, marginTop: 2 },
  prayerMosqueLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 8, paddingVertical: 8 },
  prayerMosqueLinkText: { color: PRAYER_HERO_COLOR, fontSize: 11, fontWeight: '600' },
  prayerDisclaimer: { color: '#9B8F85', fontSize: 9, lineHeight: 13, textAlign: 'center', marginTop: 2, marginBottom: 4 },

  communityPage: { paddingTop: 18, backgroundColor: '#FFFFFF' },
  communityHeader: { marginBottom: 16 },
  communityPageTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.5 },
  communityPageSubtitle: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  communitySearch: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: COLORS.canvas, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, paddingHorizontal: 13 },
  communitySearchInput: { flex: 1, minWidth: 0, color: COLORS.ink, fontSize: 13, paddingVertical: 0 },
  communityCategoryScroller: { flexGrow: 0, marginTop: 12 },
  communityCategoryList: { gap: 8, paddingRight: 22 },
  communityCategory: { minHeight: 36, justifyContent: 'center', backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 20, paddingHorizontal: 14 },
  communityCategoryActive: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  communityCategoryText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  communityCategoryTextActive: { color: COLORS.white },
  communitySectionIntro: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: -7, marginBottom: 12 },
  communityWalkCard: { height: 282, borderRadius: 22, backgroundColor: '#423C34', overflow: 'hidden' },
  communityWalkImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  communityPhotoContent: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'space-between', padding: 16 },
  communityPhotoBadges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  communityPhotoBadge: { color: COLORS.white, backgroundColor: '#211D1BC2', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, fontSize: 8, letterSpacing: 0.65, fontWeight: '700', overflow: 'hidden' },
  communityPhotoKicker: { color: '#F2C6C1', fontSize: 9, letterSpacing: 1, fontWeight: '700', marginBottom: 5 },
  communityPhotoTitle: { color: COLORS.white, fontSize: 23, lineHeight: 28, fontWeight: '700', letterSpacing: -0.4, maxWidth: '95%' },
  communityPhotoDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7, flex: 1 },
  communityPhotoDetailText: { color: '#F5F0E9', fontSize: 10, lineHeight: 14, flex: 1 },
  communityPhotoFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  communityPhotoAction: { minHeight: 37, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.paper, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8 },
  communityPhotoActionText: { color: COLORS.red, fontSize: 10, fontWeight: '700' },
  communitySubheading: { marginTop: 20, marginBottom: 10 },
  communitySubheadingTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '700' },
  communitySubheadingNote: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  communitySocialGrid: { flexDirection: 'row', gap: 10 },
  communitySocialCard: { flex: 1, minWidth: 0, minHeight: 226, borderRadius: 20, padding: 13, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.line },
  communitySocialCardSisters: { backgroundColor: '#FFF8F7' },
  communitySocialCardBrothers: { backgroundColor: COLORS.canvas },
  communitySocialTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  communitySocialIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFFFFFA8', alignItems: 'center', justifyContent: 'center' },
  communitySocialAvailability: { color: COLORS.red, fontSize: 7, letterSpacing: 0.45, fontWeight: '700', textAlign: 'right', flex: 1 },
  communitySocialAudience: { color: COLORS.red, fontSize: 8, letterSpacing: 0.6, fontWeight: '700', marginTop: 12 },
  communitySocialTitle: { color: COLORS.ink, fontSize: 14, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  communitySocialSchedule: { color: COLORS.ink, fontSize: 10, lineHeight: 15, marginTop: 6 },
  communitySocialVenue: { color: COLORS.muted, fontSize: 9, lineHeight: 13, marginTop: 6 },
  communitySocialAction: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, borderTopWidth: 1, borderColor: COLORS.line, marginTop: 11, paddingTop: 8 },
  communitySocialActionText: { color: COLORS.red, fontSize: 9, fontWeight: '700' },
  communityCafeCard: { height: 220, borderRadius: 20, backgroundColor: '#46443C', overflow: 'hidden', marginTop: 14 },
  communityCafeImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  communityCafeContent: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'space-between', padding: 15 },
  communityCafeKicker: { color: '#F2C6C1', fontSize: 8, letterSpacing: 1, fontWeight: '700', marginBottom: 4 },
  communityCafeTitle: { color: COLORS.white, fontSize: 20, lineHeight: 25, fontWeight: '700' },
  communityCafeSchedule: { color: '#F5F0E9', fontSize: 10, lineHeight: 15, marginTop: 5 },
  communityEmptyState: { alignItems: 'center', backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, padding: 22, marginTop: 8 },
  communityEmptyTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '700', marginTop: 8 },
  communityEmptyText: { color: COLORS.muted, fontSize: 11, marginTop: 4, textAlign: 'center' },
  communityLinkRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderColor: COLORS.line, paddingVertical: 10 },
  communityLinkIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  communityLinkTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '700' },
  communityLinkSub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  communityBoundaryNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.rose, borderRadius: 15, padding: 13, marginTop: 18 },
  communityBoundaryText: { color: COLORS.ink, fontSize: 12, lineHeight: 18, flex: 1 },

  readerContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 23, paddingBottom: 24 },
  readerEyebrow: { color: LEARN_COLORS.forest, fontSize: 9, letterSpacing: 0.9, fontWeight: '700' },
  readerTitle: { color: LEARN_COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 31, lineHeight: 37, fontWeight: '700', letterSpacing: -0.5, marginTop: 7 },
  readerIntro: { color: LEARN_COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 9 },
  readerProgress: { marginTop: 24, marginBottom: 14 },
  readerProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  readerProgressLabel: { color: LEARN_COLORS.forest, fontSize: 9, letterSpacing: 0.8, fontWeight: '700' },
  readerProgressHint: { color: LEARN_COLORS.muted, fontSize: 8, letterSpacing: 0.55, fontWeight: '700' },
  readerProgressTrack: { height: 5, backgroundColor: LEARN_COLORS.line, borderRadius: 3, overflow: 'hidden', marginTop: 9 },
  readerProgressFill: { height: '100%', backgroundColor: LEARN_COLORS.forest, borderRadius: 3 },
  readerStepCard: { backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 23, padding: 19 },
  readerStepHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  readerStepMarker: { width: 36, height: 36, borderRadius: 13, backgroundColor: LEARN_COLORS.forestLight, alignItems: 'center', justifyContent: 'center' },
  readerStepMarkerText: { color: LEARN_COLORS.forest, fontSize: 11, fontWeight: '700' },
  readerStepHeadingCopy: { flex: 1, minWidth: 0 },
  readerStepEyebrow: { color: LEARN_COLORS.forest, fontSize: 8, letterSpacing: 0.8, fontWeight: '700' },
  readerStepTitle: { color: LEARN_COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 19, lineHeight: 24, fontWeight: '700', marginTop: 2 },
  readerThoughtMark: { width: 36, height: 36, borderRadius: 13, backgroundColor: LEARN_COLORS.forestLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  readerBody: { color: LEARN_COLORS.ink, fontSize: 16, lineHeight: 25 },
  readerBodyWithHeading: { marginTop: 16 },
  readerDetailsToggle: { minHeight: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderColor: LEARN_COLORS.line, marginTop: 15 },
  readerDetailsToggleText: { color: LEARN_COLORS.forest, fontSize: 12, fontWeight: '700' },
  readerDetails: { gap: 10, paddingBottom: 3 },
  readerExtraParagraph: { color: LEARN_COLORS.muted, fontSize: 13, lineHeight: 20 },
  readerPointList: { gap: 9, marginTop: 2 },
  readerPointRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  readerPointDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LEARN_COLORS.gold, marginTop: 7 },
  readerPointText: { flex: 1, color: LEARN_COLORS.ink, fontSize: 13, lineHeight: 19 },
  readerNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: LEARN_COLORS.forestLight, borderRadius: 13, padding: 11, marginTop: 2 },
  readerNoteText: { flex: 1, color: LEARN_COLORS.ink, fontSize: 11, lineHeight: 17 },
  readerFinishCard: { backgroundColor: '#FFFCFB', borderWidth: 1, borderColor: '#E8C7C4', borderRadius: 23, padding: 21, marginBottom: 18 },
  readerFinishIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: LEARN_COLORS.goldLight, alignItems: 'center', justifyContent: 'center' },
  readerFinishEyebrow: { color: LEARN_COLORS.forest, fontSize: 8, letterSpacing: 0.9, fontWeight: '700', marginTop: 16 },
  readerFinishTitle: { color: LEARN_COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 23, lineHeight: 28, fontWeight: '700', marginTop: 5 },
  readerFinishText: { color: LEARN_COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
  readerTermsSection: { marginBottom: 8 },
  readerTermsToggle: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 10 },
  readerTermsTitle: { color: LEARN_COLORS.ink, fontSize: 13, fontWeight: '700' },
  readerTermsSubtitle: { color: LEARN_COLORS.muted, fontSize: 10, marginTop: 3 },
  readerSourceRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 10, marginTop: 15 },
  readerSourceIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: LEARN_COLORS.forestLight, alignItems: 'center', justifyContent: 'center' },
  readerSourceTitle: { color: LEARN_COLORS.ink, fontSize: 12, fontWeight: '700' },
  readerSourceSubtitle: { color: LEARN_COLORS.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  readerDisclaimer: { color: LEARN_COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 13, marginBottom: 8 },
  topicFlowRoot: { flex: 1, minHeight: 0, backgroundColor: COLORS.white },
  topicFlowHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 17, borderBottomWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white },
  topicFlowHeaderButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F5F2' },
  topicFlowHeaderCopy: { flex: 1, minWidth: 0 },
  topicFlowHeaderTitle: { color: COLORS.red, fontSize: 8, letterSpacing: 1, fontWeight: '800' },
  topicFlowHeaderSubtitle: { color: COLORS.ink, fontSize: 10, fontWeight: '600', marginTop: 3 },
  topicFlowHeaderSpacer: { width: 40 },
  topicFlowXpPill: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 16, backgroundColor: COLORS.rose, paddingHorizontal: 10 },
  topicFlowXpText: { color: COLORS.red, fontSize: 10, fontWeight: '800' },
  topicFlowScroll: { flex: 1 },
  topicFlowContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 26 },
  topicFlowFooter: { paddingHorizontal: 18, paddingTop: 11, paddingBottom: Platform.OS === 'ios' ? 23 : 15, borderTopWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white },
  topicFlowPrimaryButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 16, backgroundColor: COLORS.red, paddingHorizontal: 15 },
  topicFlowPrimaryButtonFlex: { flex: 1 },
  topicFlowPrimaryText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  topicFlowButtonRow: { flexDirection: 'row', gap: 10 },
  topicFlowSecondaryButton: { minWidth: 84, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white, paddingHorizontal: 15 },
  topicFlowSecondaryText: { color: COLORS.red, fontSize: 12, fontWeight: '700' },
  topicFlowButtonDisabled: { backgroundColor: '#D6B6B3' },
  topicCourseHero: { backgroundColor: '#8F2624', borderRadius: 25, padding: 19, marginBottom: 15, overflow: 'hidden' },
  topicCourseEyebrowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topicCourseCategory: { alignSelf: 'flex-start', borderRadius: 12, backgroundColor: '#FFFFFF20', paddingHorizontal: 9, paddingVertical: 6 },
  topicCourseCategoryText: { color: '#FFE7E2', fontSize: 8, letterSpacing: 0.75, fontWeight: '800' },
  topicCourseDonePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, backgroundColor: '#FFFFFFE8', paddingHorizontal: 8, paddingVertical: 6 },
  topicCourseDoneText: { color: COLORS.red, fontSize: 7, letterSpacing: 0.45, fontWeight: '800' },
  topicCourseTitle: { color: COLORS.white, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 27, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5, marginTop: 15 },
  topicCourseIntro: { color: '#F8E8E4', fontSize: 12, lineHeight: 18, marginTop: 7 },
  topicCourseMetrics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FFFFFF33', marginTop: 17, paddingVertical: 12 },
  topicCourseMetric: { flex: 1, minWidth: 0, alignItems: 'center' },
  topicCourseMetricDivider: { width: 1, height: 28, backgroundColor: '#FFFFFF40' },
  topicCourseMetricValue: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  topicCourseMetricLabel: { color: '#F4D6D1', fontSize: 7, letterSpacing: 0.55, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  topicCourseProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13 },
  topicCourseProgressLabel: { color: '#F4D6D1', fontSize: 8, letterSpacing: 0.8, fontWeight: '700' },
  topicCourseProgressCount: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  topicCourseProgressTrack: { height: 5, borderRadius: 3, backgroundColor: '#FFFFFF38', marginTop: 7, overflow: 'hidden' },
  topicCourseProgressFill: { height: '100%', borderRadius: 3, backgroundColor: '#F3C9A6' },
  topicSpotlightCard: { backgroundColor: '#FFF8F7', borderWidth: 1, borderColor: '#F0D8D5', borderRadius: 19, padding: 15, marginBottom: 22 },
  topicSpotlightEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  topicSpotlightEyebrow: { color: COLORS.red, fontSize: 8, letterSpacing: 0.8, fontWeight: '800' },
  topicSpotlightArabic: { color: COLORS.ink, fontSize: 20, lineHeight: 35, textAlign: 'right', marginTop: 12 },
  topicSpotlightTranslation: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 15, lineHeight: 22, marginTop: 10 },
  topicSpotlightSource: { color: COLORS.red, fontSize: 9, fontWeight: '700', marginTop: 9 },
  topicFocusCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: '#FFF8F7', borderWidth: 1, borderColor: '#F0D8D5', borderRadius: 19, padding: 14, marginBottom: 22 },
  topicFocusIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8E7E4' },
  topicFocusCopy: { flex: 1, minWidth: 0 },
  topicFocusEyebrow: { color: COLORS.red, fontSize: 8, letterSpacing: 0.8, fontWeight: '800' },
  topicFocusTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginTop: 4 },
  topicFocusText: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  topicSectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginBottom: 11 },
  topicSectionTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 20, lineHeight: 25, fontWeight: '700' },
  topicSectionSubtitle: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  topicSectionCount: { color: COLORS.red, fontSize: 8, letterSpacing: 0.7, fontWeight: '800', marginBottom: 3 },
  topicLessonList: { gap: 8, marginBottom: 17 },
  topicLessonRow: { minHeight: 77, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 17, paddingHorizontal: 11, paddingVertical: 10 },
  topicLessonRowNext: { borderColor: '#E8BDB9', backgroundColor: '#FFFCFB' },
  topicLessonNumber: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F2EE' },
  topicLessonNumberDone: { backgroundColor: COLORS.red },
  topicLessonNumberNext: { backgroundColor: COLORS.rose },
  topicLessonNumberText: { color: COLORS.muted, fontSize: 9, fontWeight: '800' },
  topicLessonNumberTextNext: { color: COLORS.red },
  topicLessonCopy: { flex: 1, minWidth: 0 },
  topicLessonEyebrow: { color: COLORS.red, fontSize: 7, letterSpacing: 0.7, fontWeight: '800' },
  topicLessonTitle: { color: COLORS.ink, fontSize: 12, lineHeight: 16, fontWeight: '700', marginTop: 3 },
  topicLessonPreview: { color: COLORS.muted, fontSize: 9, lineHeight: 13, marginTop: 3 },
  topicFinalQuizCard: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8F5F2', borderRadius: 17, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 15 },
  topicFinalQuizIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  topicFinalQuizCopy: { flex: 1, minWidth: 0 },
  topicFinalQuizEyebrow: { color: COLORS.red, fontSize: 7, letterSpacing: 0.75, fontWeight: '800' },
  topicFinalQuizTitle: { color: COLORS.ink, fontSize: 12, fontWeight: '700', marginTop: 3 },
  topicFinalQuizSubtitle: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  topicImportantNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFF8F7', borderRadius: 14, padding: 11, marginBottom: 8 },
  topicImportantNoteText: { flex: 1, color: COLORS.ink, fontSize: 10, lineHeight: 16 },
  topicCourseSource: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, paddingHorizontal: 11, marginTop: 12 },
  topicCourseSourceIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.rose },
  topicCourseSourceCopy: { flex: 1, minWidth: 0 },
  topicCourseSourceTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  topicCourseSourceSubtitle: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  topicCourseDisclaimer: { color: COLORS.muted, fontSize: 9, lineHeight: 14, marginTop: 10 },
  topicLessonProgress: { marginBottom: 18 },
  topicLessonProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topicLessonProgressLabel: { color: COLORS.red, fontSize: 8, letterSpacing: 0.8, fontWeight: '800' },
  topicLessonReward: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, backgroundColor: COLORS.rose, paddingHorizontal: 7, paddingVertical: 5 },
  topicLessonRewardText: { color: COLORS.red, fontSize: 8, fontWeight: '800' },
  topicLessonMainTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 27, lineHeight: 33, fontWeight: '700', letterSpacing: -0.4, marginBottom: 15 },
  topicArabicCard: { alignItems: 'center', backgroundColor: '#FFF8F7', borderWidth: 1, borderColor: '#F0D8D5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 17, marginBottom: 17 },
  topicArabicText: { color: COLORS.ink, fontSize: 24, lineHeight: 39, textAlign: 'center' },
  topicArabicTransliteration: { color: COLORS.red, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 7 },
  topicArabicMeaning: { color: COLORS.muted, fontSize: 10, textAlign: 'center', marginTop: 4 },
  topicLessonIdeaCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFF8F7', borderWidth: 1, borderColor: '#F0D8D5', borderRadius: 18, padding: 13, marginBottom: 17 },
  topicLessonIdeaIcon: { width: 33, height: 33, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  topicLessonIdeaCopy: { flex: 1, minWidth: 0 },
  topicLessonIdeaEyebrow: { color: COLORS.red, fontSize: 7, letterSpacing: 0.8, fontWeight: '800' },
  topicLessonIdeaText: { color: COLORS.ink, fontSize: 11, lineHeight: 17, marginTop: 4 },
  topicLessonSection: { marginBottom: 16 },
  topicLessonSectionEyebrow: { color: COLORS.red, fontSize: 8, letterSpacing: 0.8, fontWeight: '800', marginBottom: 8 },
  topicLessonParagraph: { color: COLORS.ink, fontSize: 13, lineHeight: 20, marginBottom: 7 },
  topicLessonMoreButton: { minHeight: 39, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: COLORS.line, marginTop: 3 },
  topicLessonMoreText: { color: COLORS.red, fontSize: 10, fontWeight: '700' },
  topicLessonFactsCard: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 18, padding: 13, marginBottom: 15 },
  topicLessonFactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 7 },
  topicLessonFactIcon: { width: 19, height: 19, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.rose, marginTop: 1 },
  topicLessonFactText: { flex: 1, color: COLORS.ink, fontSize: 11, lineHeight: 17 },
  topicLessonRoleSection: { marginBottom: 15 },
  topicLessonRoles: { flexDirection: 'row', gap: 8 },
  topicLessonRoleCard: { flex: 1, minWidth: 0, backgroundColor: '#FFF8F7', borderWidth: 1, borderColor: '#F0D8D5', borderRadius: 15, padding: 10 },
  topicLessonRoleName: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 15, fontWeight: '700' },
  topicLessonRoleTitle: { color: COLORS.red, fontSize: 9, fontWeight: '800', marginTop: 3 },
  topicLessonRoleDetail: { color: COLORS.muted, fontSize: 9, lineHeight: 13, marginTop: 4 },
  topicLessonQuoteCard: { backgroundColor: '#8F2624', borderRadius: 19, padding: 15, marginBottom: 14 },
  topicLessonQuoteMark: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white },
  topicLessonQuoteText: { color: COLORS.white, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 15, lineHeight: 22, marginTop: 10 },
  topicLessonQuoteSource: { color: '#F4D6D1', fontSize: 9, fontWeight: '700', marginTop: 8 },
  topicLessonNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFF8F7', borderRadius: 14, padding: 11, marginBottom: 14 },
  topicLessonNoteText: { flex: 1, color: COLORS.ink, fontSize: 10, lineHeight: 16 },
  topicReflectionCard: { backgroundColor: '#F8F5F2', borderRadius: 18, padding: 14, marginBottom: 12 },
  topicReflectionEyebrow: { color: COLORS.red, fontSize: 8, letterSpacing: 0.8, fontWeight: '800' },
  topicReflectionText: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 14, lineHeight: 20, marginTop: 6 },
  topicQuizScreen: { flex: 1, paddingTop: 5 },
  topicQuizScreenTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  topicQuizScreenEyebrow: { color: COLORS.red, fontSize: 8, letterSpacing: 0.8, fontWeight: '800' },
  topicQuizScreenTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 21, lineHeight: 26, fontWeight: '700', marginTop: 4 },
  topicQuizScreenXp: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 11, backgroundColor: COLORS.rose, paddingHorizontal: 8, paddingVertical: 6 },
  topicQuizScreenXpText: { color: COLORS.red, fontSize: 8, fontWeight: '800' },
  topicQuizSegments: { flexDirection: 'row', gap: 5, marginTop: 20 },
  topicQuizSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.line },
  topicQuizSegmentDone: { backgroundColor: '#D99991' },
  topicQuizSegmentActive: { backgroundColor: COLORS.red },
  topicQuizQuestionCount: { color: COLORS.red, fontSize: 8, letterSpacing: 0.8, fontWeight: '800', marginTop: 25 },
  topicQuizScreenQuestion: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 23, lineHeight: 29, fontWeight: '700', marginTop: 7, marginBottom: 17 },
  topicQuizScreenOptions: { gap: 9 },
  topicQuizScreenOption: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  topicQuizScreenOptionSelected: { borderColor: COLORS.red, backgroundColor: '#FFF8F7' },
  topicQuizScreenOptionCorrect: { borderColor: '#79A889', backgroundColor: '#F0F7F1' },
  topicQuizScreenOptionWrong: { borderColor: '#D8A5A0', backgroundColor: '#FFF4F2' },
  topicQuizScreenOptionMarker: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#D8D0CA' },
  topicQuizScreenMarkerSelected: { borderColor: COLORS.red, backgroundColor: COLORS.red },
  topicQuizScreenMarkerCorrect: { borderColor: '#557E61', backgroundColor: '#557E61' },
  topicQuizScreenMarkerWrong: { borderColor: COLORS.red, backgroundColor: COLORS.red },
  topicQuizScreenOptionText: { flex: 1, color: COLORS.ink, fontSize: 12, lineHeight: 17 },
  topicQuizScreenFeedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 15, padding: 11, marginTop: 15 },
  topicQuizScreenFeedbackGood: { backgroundColor: '#F0F7F1' },
  topicQuizScreenFeedbackRetry: { backgroundColor: '#FFF4F2' },
  topicQuizScreenFeedbackCopy: { flex: 1 },
  topicQuizScreenFeedbackTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  topicQuizScreenFeedbackText: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  topicQuizScreenPrompt: { color: COLORS.muted, fontSize: 10, marginTop: 13 },
  topicQuizComplete: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  topicQuizCompleteIcon: { width: 58, height: 58, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.red },
  topicQuizCompleteEyebrow: { color: COLORS.red, fontSize: 8, letterSpacing: 0.9, fontWeight: '800', marginTop: 17 },
  topicQuizCompleteTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 25, lineHeight: 31, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  topicQuizCompleteText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  topicQuizCompleteReward: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, backgroundColor: COLORS.rose, paddingHorizontal: 12, paddingVertical: 8, marginTop: 15 },
  topicQuizCompleteRewardText: { color: COLORS.red, fontSize: 11, fontWeight: '800' },
  readerFooter: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 16, borderTopWidth: 1, borderColor: LEARN_COLORS.line, backgroundColor: LEARN_COLORS.cream },
  readerNavRow: { flexDirection: 'row', gap: 10 },
  readerBackAction: { minWidth: 88, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 15, paddingHorizontal: 12 },
  readerActionDisabled: { backgroundColor: 'transparent', borderColor: 'transparent' },
  readerBackActionText: { color: LEARN_COLORS.forest, fontSize: 12, fontWeight: '700' },
  readerDisabledText: { color: LEARN_COLORS.muted },
  readerNextAction: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: LEARN_COLORS.forest, borderRadius: 15, paddingHorizontal: 16 },
  readerNextActionText: { color: LEARN_COLORS.card, fontSize: 13, fontWeight: '700' },
  articleContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 30 },
  articleTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.6, marginTop: 6 },
  articleRule: { width: 42, height: 1, borderRadius: 1, backgroundColor: COLORS.ink, marginVertical: 20 },
  articleParagraph: { color: '#52615A', fontSize: 16, lineHeight: 27, marginBottom: 17 },
  lessonLead: { color: '#625A53', fontSize: 14, lineHeight: 22, marginTop: 11, marginBottom: 19 },
  lessonFocusCard: { backgroundColor: '#241B17', borderRadius: 21, padding: 17, marginBottom: 25, overflow: 'hidden' },
  lessonFocusHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  lessonFocusEyebrow: { color: COLORS.saffron, fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  lessonFocusTitle: { color: COLORS.white, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 18, lineHeight: 23, fontWeight: '700', marginTop: 12 },
  lessonFocusText: { color: '#F2E8DF', fontSize: 12, lineHeight: 19, marginTop: 5 },
  lessonSectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 3, marginBottom: 15 },
  lessonSectionTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 21, lineHeight: 26, fontWeight: '700' },
  lessonSectionSubtitle: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  lessonSectionCount: { color: LEARN_COLORS.forest, fontSize: 8, letterSpacing: 0.8, fontWeight: '700', marginBottom: 3 },
  lessonTimeline: { marginBottom: 20 },
  lessonTimelineItem: { flexDirection: 'row', alignItems: 'stretch', gap: 11, marginBottom: 4 },
  lessonTimelineRail: { width: 26, alignItems: 'center', position: 'relative' },
  lessonTimelineMarker: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.peach, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  lessonTimelineMarkerText: { color: COLORS.red, fontSize: 8, fontWeight: '700' },
  lessonTimelineConnector: { position: 'absolute', top: 29, bottom: -8, left: 12, width: 1, backgroundColor: '#D9C9BD' },
  lessonTimelineContent: { flex: 1, minWidth: 0, paddingBottom: 22 },
  lessonPartLabel: { color: COLORS.red, fontSize: 8, letterSpacing: 0.8, fontWeight: '700', marginTop: 2 },
  lessonStepTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 16, lineHeight: 21, fontWeight: '700', marginTop: 3, marginBottom: 5 },
  lessonStepParagraph: { color: '#625A53', fontSize: 12, lineHeight: 19, marginTop: 5 },
  lessonStepPoints: { gap: 8, marginTop: 10 },
  lessonStepPoint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  lessonStepBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.red, marginTop: 6 },
  lessonStepPointText: { flex: 1, color: '#625A53', fontSize: 11, lineHeight: 17 },
  lessonStepNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: COLORS.rose, borderRadius: 12, padding: 10, marginTop: 10 },
  lessonStepNoteText: { flex: 1, color: COLORS.ink, fontSize: 10, lineHeight: 15 },
  lessonReminder: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 17, padding: 13, marginBottom: 25 },
  lessonReminderIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' },
  lessonReminderCopy: { flex: 1, minWidth: 0 },
  lessonReminderEyebrow: { color: COLORS.red, fontSize: 8, letterSpacing: 0.7, fontWeight: '700' },
  lessonReminderText: { color: '#625A53', fontSize: 11, lineHeight: 17, marginTop: 5 },
  lessonTermsSection: { marginBottom: 15 },
  lessonTermsList: { gap: 7 },
  lessonTermCard: { backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 14, overflow: 'hidden' },
  lessonTermCardExpanded: { borderColor: LEARN_COLORS.forest },
  lessonTermRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  lessonTermIndex: { color: LEARN_COLORS.forest, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 13, width: 26 },
  lessonTerm: { flex: 1, color: COLORS.ink, fontSize: 12, fontWeight: '700' },
  lessonTermMeaning: { paddingHorizontal: 12, paddingBottom: 12 },
  lessonTermDivider: { height: 1, backgroundColor: COLORS.line, marginBottom: 9 },
  lessonTermMeaningText: { color: LEARN_COLORS.muted, fontSize: 11, lineHeight: 17 },
  topicQuizCard: { padding: 13, marginTop: 10, marginBottom: 12, backgroundColor: LEARN_COLORS.card, borderWidth: 1, borderColor: LEARN_COLORS.line, borderRadius: 18 },
  topicQuizHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  topicQuizIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: LEARN_COLORS.card, alignItems: 'center', justifyContent: 'center' },
  topicQuizEyebrow: { color: LEARN_COLORS.forest, fontSize: 8, letterSpacing: 0.9, fontWeight: '700' },
  topicQuizTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '700', marginTop: 2 },
  topicQuizQuestion: { color: COLORS.ink, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 14, marginBottom: 9 },
  topicQuizOptions: { gap: 7 },
  topicQuizOption: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, borderRadius: 13 },
  topicQuizOptionSelected: { backgroundColor: LEARN_COLORS.forestLight, borderColor: LEARN_COLORS.forest },
  topicQuizOptionCorrect: { backgroundColor: LEARN_COLORS.forestLight, borderColor: LEARN_COLORS.forest },
  topicQuizOptionIncorrect: { backgroundColor: '#F8ECE8', borderColor: '#D9A69A' },
  topicQuizOptionMarker: { width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.line },
  topicQuizOptionMarkerSelected: { backgroundColor: LEARN_COLORS.forest, borderColor: LEARN_COLORS.forest },
  topicQuizOptionMarkerCorrect: { backgroundColor: LEARN_COLORS.forest, borderColor: LEARN_COLORS.forest },
  topicQuizOptionMarkerIncorrect: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  topicQuizOptionText: { flex: 1, color: COLORS.ink, fontSize: 11, lineHeight: 16 },
  topicQuizPrompt: { color: COLORS.muted, fontSize: 10, marginTop: 10 },
  topicQuizCheckButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10, backgroundColor: LEARN_COLORS.forest, borderRadius: 13, paddingHorizontal: 14 },
  topicQuizCheckText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  topicQuizFeedback: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 11, marginTop: 10, borderRadius: 13 },
  topicQuizFeedbackCorrect: { backgroundColor: LEARN_COLORS.forestLight },
  topicQuizFeedbackRetry: { backgroundColor: '#F8ECE8' },
  topicQuizFeedbackCopy: { flex: 1 },
  topicQuizFeedbackTitle: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  topicQuizFeedbackText: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  topicQuizRetryButton: { alignSelf: 'flex-start', minHeight: 34, justifyContent: 'center', paddingHorizontal: 5, marginTop: 2 },
  topicQuizRetryText: { color: LEARN_COLORS.forest, fontSize: 11, fontWeight: '700' },
  topicQuizFootnote: { color: COLORS.muted, fontSize: 9, textAlign: 'center', marginTop: 10 },
  articleBottom: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 16, borderTopWidth: 1, borderColor: COLORS.line },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 48, height: 48, borderRadius: 15, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
  brandMarkLight: { backgroundColor: COLORS.red },
  brandMonogram: { color: COLORS.white, fontWeight: '300', fontSize: 28, lineHeight: 34 },
  brandName: { color: COLORS.white, fontSize: 11, letterSpacing: 2.8, lineHeight: 16, fontWeight: '700' },
  mosqueArtwork: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, width: '100%', height: '100%' },
  mosqueCompactArtwork: { position: 'absolute', right: -16, bottom: -6, width: '74%', height: '84%', opacity: 0.8 },
  welcomeScreen: { flex: 1, backgroundColor: '#21130F', overflow: 'hidden' },
  welcomeGlow: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#D8B18F20', right: -120, top: '16%' },
  welcomeArchRing: { position: 'absolute', width: 370, height: 370, borderRadius: 185, borderWidth: 1, borderColor: '#FFFFFF16', right: -190, bottom: 78 },
  welcomeOverlay: { flex: 1, paddingHorizontal: 25, paddingTop: 24, paddingBottom: 22 },
  welcomeArtworkSlot: { flex: 1, minHeight: 120, position: 'relative' },
  welcomeMotif: { top: '20%', right: 18, width: 132, height: 132, opacity: 0.88 },
  welcomeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skipButton: { backgroundColor: '#FFFFFF18', borderWidth: 1, borderColor: '#FFFFFF38', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10 },
  skipText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  welcomeKicker: { color: '#E7C59D', fontSize: 9, letterSpacing: 1.7, fontWeight: '700', marginBottom: 9 },
  welcomeHeadlineLight: { color: COLORS.white, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 36, fontWeight: '400', lineHeight: 42 },
  welcomeHeadlineBrand: { color: COLORS.white, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 40, lineHeight: 45, fontWeight: '700', letterSpacing: -0.8 },
  welcomeAccent: { width: 38, height: 2, backgroundColor: COLORS.saffron, borderRadius: 2, marginTop: 16, marginBottom: 15 },
  welcomeMessage: { color: '#E8D0B2', fontSize: 17, lineHeight: 25, maxWidth: 310 },
  welcomeFeatures: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 25, marginBottom: 22, gap: 8 },
  welcomeFeature: { flex: 1, alignItems: 'center', gap: 8 },
  welcomeFeatureIcon: { width: 43, height: 43, borderRadius: 14, borderWidth: 1, borderColor: '#FFFFFF30', backgroundColor: '#FFFFFF16', alignItems: 'center', justifyContent: 'center' },
  welcomeFeatureText: { color: '#F6EDE4', textAlign: 'center', fontSize: 10, lineHeight: 14, fontWeight: '600' },
  welcomeButton: { minHeight: 56, borderRadius: 18, shadowColor: COLORS.red, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 9, elevation: 4 },
  backButtonLight: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF20', borderWidth: 1, borderColor: '#FFFFFF30', alignItems: 'center', justifyContent: 'center' },
  readyOverlay: { flex: 1, paddingHorizontal: 25, paddingTop: 22, paddingBottom: 22 },
  readyCheck: { width: 56, height: 56, borderRadius: 17, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: COLORS.red, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 9, elevation: 4 },
  readyTitle: { color: COLORS.white, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 39, lineHeight: 46, fontWeight: '700', letterSpacing: -0.5 },
  readyDescription: { color: '#F4E6D8', fontSize: 15, lineHeight: 23, marginTop: 3, marginBottom: 20 },
  readyPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF12', borderWidth: 1, borderColor: '#FFFFFF30', marginBottom: 14 },
  readyPreviewIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#FFFFFF18', borderWidth: 1, borderColor: '#FFFFFF26', alignItems: 'center', justifyContent: 'center' },
  readyPreviewMeta: { color: '#EAD4BC', fontSize: 10, letterSpacing: 0.6 },
  readyPreviewTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginTop: 4 },
  setupScreen: { flex: 1, minHeight: 0, backgroundColor: COLORS.canvas },
  setupScroll: { flex: 1, minHeight: 0 },
  setupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, height: 58 },
  setupBackButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: COLORS.paper, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  setupHeaderCenter: { flex: 1, alignItems: 'center' },
  setupHeaderEyebrow: { color: COLORS.red, fontSize: 9, letterSpacing: 1.5, fontWeight: '700', marginBottom: 3 },
  setupStepText: { color: COLORS.muted, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  setupSkip: { minWidth: 48, alignItems: 'flex-end', paddingVertical: 10 },
  setupSkipText: { color: COLORS.red, fontSize: 13, fontWeight: '700' },
  setupProgress: { flexDirection: 'row', gap: 6, paddingHorizontal: 22, marginTop: 5 },
  setupProgressSegment: { flex: 1, height: 4, borderRadius: 4, backgroundColor: '#E7DED5' },
  setupProgressSegmentActive: { backgroundColor: COLORS.red },
  setupContent: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 22 },
  setupIntro: { marginBottom: 20 },
  setupIntroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  setupEyebrowInline: { marginBottom: 0 },
  setupMotif: { position: 'relative', top: 0, right: 0, width: 42, height: 42, opacity: 1 },
  setupEyebrow: { color: COLORS.red, fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 9 },
  onboardingStepTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 31, lineHeight: 37, fontWeight: '700', letterSpacing: -0.65 },
  setupDescription: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  setupFooter: { paddingHorizontal: 22, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 14, backgroundColor: COLORS.canvas, borderTopWidth: 1, borderColor: COLORS.line },
  focusGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  focusTile: { width: '48%', minHeight: 112, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, backgroundColor: '#FFFEFC', padding: 13, justifyContent: 'flex-end' },
  focusTileSelected: { backgroundColor: '#F7EAE7', borderColor: '#D9B7AD' },
  focusIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.peach, marginBottom: 10 },
  focusIconSelected: { backgroundColor: '#EEDBD4' },
  focusTileTitle: { color: COLORS.ink, fontSize: 14, lineHeight: 19, fontWeight: '600', maxWidth: '92%' },
  focusTileTitleSelected: { color: COLORS.ink },
  focusCheck: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.paper },
  focusCheckSelected: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  setupHint: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 19 },
  setupHintDivider: { color: COLORS.saffron, fontWeight: '700' },
  journeyList: { gap: 10 },
  journeyChoice: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#FFFEFC', borderWidth: 1, borderColor: COLORS.line, borderRadius: 16 },
  journeyChoiceSelected: { backgroundColor: '#F7EAE7', borderColor: '#D9B7AD' },
  journeyIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.peach, alignItems: 'center', justifyContent: 'center' },
  journeyIconSelected: { backgroundColor: '#EEDBD4' },
  journeyChoiceTitle: { color: COLORS.ink, fontWeight: '600', fontSize: 14 },
  journeyChoiceTitleSelected: { color: COLORS.ink },
  journeyChoiceSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  journeyChoiceSubtitleSelected: { color: COLORS.muted },
  journeyRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  journeyRadioSelected: { borderColor: COLORS.red, backgroundColor: '#FFFFFF' },
  journeyRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red },
  privacyNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, paddingHorizontal: 13, marginTop: 17, borderRadius: 14, backgroundColor: '#F1ECE6' },
  privacyNoteText: { color: COLORS.greenMid, fontSize: 11, fontWeight: '600' },
  rhythmList: { gap: 10 },
  rhythmOption: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 13, paddingVertical: 12, backgroundColor: '#FFFEFC', borderWidth: 1, borderColor: COLORS.line, borderRadius: 16 },
  rhythmOptionSelected: { backgroundColor: '#F7EAE7', borderColor: '#D9B7AD' },
  rhythmNumber: { width: 50, height: 50, borderRadius: 15, backgroundColor: COLORS.peach, alignItems: 'center', justifyContent: 'center' },
  rhythmNumberSelected: { backgroundColor: COLORS.red },
  rhythmMinutes: { fontSize: 21, lineHeight: 23, fontWeight: '700', color: COLORS.ink },
  rhythmMinLabel: { fontSize: 8, lineHeight: 11, letterSpacing: 0.8, fontWeight: '700', color: COLORS.muted },
  rhythmMinutesSelected: { color: COLORS.white },
  rhythmMinLabelSelected: { color: '#FBE9E5' },
  rhythmName: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontWeight: '700', fontSize: 17 },
  rhythmNameSelected: { color: COLORS.red },
  rhythmNote: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  rhythmCheck: { width: 23, height: 23, borderRadius: 12, borderWidth: 1.5, borderColor: '#D9CFC5', alignItems: 'center', justifyContent: 'center' },
  rhythmCheckSelected: { backgroundColor: COLORS.red, borderColor: COLORS.red },
  weeklySummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginVertical: 17, padding: 11, borderRadius: 14, backgroundColor: '#F1ECE6' },
  weeklyMinutes: { color: COLORS.greenMid, fontSize: 12, fontWeight: '600' },
  reminderCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFEFC', padding: 13, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line },
  reminderIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { color: COLORS.ink, fontSize: 14, fontWeight: '700' },
  reminderSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  onboardingNotice: { color: '#FFE6D1', position: 'absolute', bottom: 8, left: 18, right: 18, textAlign: 'center', backgroundColor: '#21130FDD', padding: 10, borderRadius: 12, overflow: 'hidden' },

  homeScroll: { backgroundColor: '#FFFFFF' },
  homePage: { paddingTop: 12, backgroundColor: '#FFFFFF' },
  homeWelcome: { marginBottom: 27 },
  homeSalutation: { color: '#C92F25', fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 16, lineHeight: 23, fontStyle: 'italic' },
  homeHeadline: { color: '#1C1714', fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 34, lineHeight: 40, letterSpacing: -0.7, marginTop: 4 },
  homeIntro: { color: '#897D74', fontSize: 13, lineHeight: 20, marginTop: 7 },
  homePrayer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 10, minHeight: 48, paddingHorizontal: 9, paddingVertical: 7, marginBottom: 20, backgroundColor: COLORS.paper, borderRadius: 26, borderWidth: 1, borderColor: '#E8DED3' },
  homePrayerIcon: { width: 30, height: 30, borderRadius: 16, backgroundColor: '#F6ECE8', alignItems: 'center', justifyContent: 'center' },
  homePrayerCopy: { minWidth: 0 },
  homePrayerEyebrow: { color: '#93877E', fontSize: 8, lineHeight: 11, letterSpacing: 0.9, fontWeight: '700' },
  homePrayerDetail: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 1 },
  homePrayerName: { color: '#25211E', fontSize: 12, fontWeight: '700' },
  homePrayerTime: { color: '#25211E', fontSize: 11, fontWeight: '600' },
  homePrayerCountdown: { color: '#897D74', fontSize: 10 },
  homePackCard: { marginBottom: 18, overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#EAE3DC' },
  homePackImageFrame: { width: '100%', overflow: 'hidden' },
  homePackImage: { width: '100%' },
  homePackContent: { padding: 18 },
  homePackEyebrow: { color: '#C92F25', fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 19, lineHeight: 25, fontStyle: 'italic' },
  homePackTitle: { color: '#211B18', fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 27, lineHeight: 34, letterSpacing: -0.45, marginTop: 4 },
  homePackDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, marginBottom: 18 },
  homePackBadgePrimary: { borderRadius: 22, backgroundColor: '#F8EAE7', paddingHorizontal: 14, paddingVertical: 9 },
  homePackBadgePrimaryText: { color: '#A92C28', fontSize: 13, fontWeight: '600' },
  homePackBadge: { borderRadius: 22, backgroundColor: '#F5F2EE', paddingHorizontal: 14, paddingVertical: 9 },
  homePackBadgeText: { color: '#82776E', fontSize: 13, fontWeight: '500' },
  homePackButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 28, backgroundColor: '#C92F25', paddingHorizontal: 18 },
  homePackButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  homePackQuote: { alignItems: 'center', gap: 13, marginBottom: 18, paddingHorizontal: 24, paddingVertical: 28, borderRadius: 26, backgroundColor: '#F3EEE8' },
  homePackQuoteText: { color: '#28211D', fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 23, lineHeight: 31, textAlign: 'center' },
  homePackQuoteSource: { color: '#82776E', fontSize: 14, lineHeight: 20, marginTop: 1 },
  homeShahadaCard: { marginBottom: 18, padding: 18, backgroundColor: '#FBF8F5', borderRadius: 23, borderWidth: 1, borderColor: '#EEE7E0' },
  homeShahadaHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  homeShahadaIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#F5E9E5', alignItems: 'center', justifyContent: 'center' },
  homeShahadaHeading: { flex: 1 },
  homeShahadaEyebrow: { color: '#9B716A', fontSize: 8, letterSpacing: 1.3, fontWeight: '700' },
  homeShahadaTitle: { color: '#201A16', fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 23, lineHeight: 29, marginTop: 3 },
  homeShahadaArabicBlock: { marginTop: 15, marginBottom: 13, paddingVertical: 13, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#EEE7E0' },
  homeShahadaArabic: { color: '#51433B', textAlign: 'center', writingDirection: 'rtl', fontSize: 18, lineHeight: 34 },
  homeShahadaFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  homeShahadaFooterCopy: { flex: 1 },
  homeShahadaMeaning: { color: '#897D74', fontSize: 11, lineHeight: 17 },
  homeShahadaLink: { color: '#B8312F', fontSize: 12, fontWeight: '700', marginTop: 4 },
  homeShahadaArrow: { width: 31, height: 31, borderRadius: 16, backgroundColor: '#F5E9E5', alignItems: 'center', justifyContent: 'center' },
  homeExploreSection: { marginTop: 5, marginBottom: 15 },
  homeExploreHeading: { color: '#9B8F85', fontSize: 9, letterSpacing: 1.25, fontWeight: '700', marginBottom: 4 },
  homeExploreRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11 },
  homeExploreTitle: { flex: 1, color: '#39312D', fontSize: 13, fontWeight: '600' },
  homeExploreDivider: { height: 1, backgroundColor: '#F0E9E2', marginLeft: 30 },
  homeSupportLink: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', borderTopWidth: 1, borderColor: '#F0E9E2', paddingTop: 16, paddingBottom: 8 },
  homeSupportPrompt: { color: '#897D74', fontSize: 12 },
  homeSupportAction: { color: '#B8312F', fontSize: 12, fontWeight: '700' },

  roadmapPage: { paddingTop: 18 },
  roadmapHeader: { marginBottom: 20 },
  roadmapHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  roadmapEyebrow: { color: COLORS.muted, fontSize: 10, letterSpacing: 1.15, fontWeight: '700' },
  roadmapHeaderBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.peach, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6 },
  roadmapHeaderBadgeText: { color: COLORS.green, fontSize: 10, fontWeight: '700' },
  roadmapTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 31, lineHeight: 37, fontWeight: '700', letterSpacing: -0.5 },
  roadmapDescription: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  roadmapProgress: { backgroundColor: COLORS.green, borderRadius: 19, padding: 15, marginBottom: 22, overflow: 'hidden' },
  roadmapProgressContent: { position: 'relative', zIndex: 1 },
  roadmapProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  roadmapProgressCopy: { flex: 1 },
  roadmapProgressLabel: { color: '#E8DED7', fontSize: 8, letterSpacing: 0.9, fontWeight: '700' },
  roadmapProgressTitle: { color: COLORS.white, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 15, fontWeight: '700', marginTop: 3 },
  roadmapPercent: { color: COLORS.white, fontSize: 25, fontWeight: '700', marginLeft: 10 },
  roadmapProgressFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  roadmapProgressNote: { color: '#E8DED7', fontSize: 9 },
  roadmapJourneyIntro: { marginBottom: 8 },
  roadmapJourneyTitle: { color: COLORS.ink, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia', fontSize: 19, fontWeight: '700' },
  roadmapJourneySubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  roadmapTimeline: { marginBottom: 2 },
  roadmapStage: { flexDirection: 'row', alignItems: 'stretch', gap: 9 },
  roadmapMarkerColumn: { width: 19, alignItems: 'center', position: 'relative' },
  roadmapMarker: { width: 25, height: 25, borderRadius: 13, backgroundColor: COLORS.paper, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line, marginTop: 16, zIndex: 1 },
  roadmapMarkerDone: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  roadmapMarkerCurrent: { backgroundColor: COLORS.peach, borderWidth: 1.5, borderColor: COLORS.green },
  roadmapMarkerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  roadmapConnector: { position: 'absolute', top: 40, bottom: -8, width: 1, backgroundColor: COLORS.line },
  roadmapConnectorDone: { backgroundColor: COLORS.green },
  roadmapStageContent: { flex: 1, paddingVertical: 13, borderBottomWidth: 1, borderColor: COLORS.line },
  roadmapStageContentActive: { backgroundColor: COLORS.peach, borderBottomWidth: 0, borderRadius: 17, paddingHorizontal: 13, marginVertical: 6 },
  roadmapStageTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  roadmapStageLabel: { color: COLORS.muted, fontSize: 8, fontWeight: '700', letterSpacing: 0.75 },
  roadmapStageLabelActive: { color: COLORS.green },
  roadmapStageStatus: { color: COLORS.muted, fontSize: 7, letterSpacing: 0.45, fontWeight: '700', textAlign: 'right' },
  roadmapStageStatusDone: { color: COLORS.green },
  roadmapStageStatusActive: { color: COLORS.green },
  roadmapStageTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '700' },
  roadmapStageSubtitle: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  roadmapGuideNames: { marginTop: 7 },
  roadmapGuideRow: { minHeight: 27, flexDirection: 'row', alignItems: 'center', gap: 7 },
  roadmapGuideText: { color: COLORS.ink, fontSize: 11, flex: 1 },
  roadmapGuideTextDone: { color: COLORS.muted },
  roadmapGuideDuration: { color: COLORS.muted, fontSize: 9 },
  roadmapReaderProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 11 },
  roadmapReaderTrack: { height: 4, flex: 1, backgroundColor: COLORS.line, borderRadius: 3, overflow: 'hidden' },
  roadmapReaderFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 3 },
  roadmapReaderCount: { color: COLORS.muted, fontSize: 9, minWidth: 45, textAlign: 'right' },
  roadmapStageFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 },
  roadmapOpen: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  roadmapOpenActive: { color: COLORS.green },
  quranPracticeCount: { color: COLORS.saffron, fontSize: 11, marginTop: 10 },
  verseCardRead: { borderColor: COLORS.line, borderLeftWidth: 3, borderLeftColor: COLORS.green, backgroundColor: '#F3EFE5' },
});

export default App;
