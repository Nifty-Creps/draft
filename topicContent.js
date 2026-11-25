export const TOPIC_LESSONS = {
  'topic-new-muslim-basics': {
    readMinutes: 5,
    modules: [
      {
        title: 'The shahada: the starting point',
        paragraphs: [
          'The shahada is a testimony that there is no god worthy of worship except Allah, and that Muhammad is the Messenger of Allah. It expresses the heart of Muslim belief; it is not a promise that you already know every rule.',
          'The two parts connect belief in one God with learning from the Prophet. If you have said the shahada, you can keep learning what it means throughout your life.',
        ],
      },
      {
        title: 'Build a practical foundation',
        paragraphs: [
          'A useful learning order is to understand your beliefs, learn purification for prayer, begin salah, and read or listen to a little Quran. A trusted person can help you connect the pieces.',
        ],
        points: [
          'Learn the purpose and basic shape of prayer.',
          'Use a short, reliable Quran translation or listen to recitation.',
          'Ask one clear question at a time.',
        ],
      },
      {
        title: 'Keep a sustainable pace',
        paragraphs: [
          'New practices take repetition. Arabic fluency, advanced discussions, and optional routines can wait while you establish the foundations. Gradual learning is not failure; it is a way to make practice steady.',
          'When a week feels full, separate what you understand to be required from extra activities you have added. Ask a qualified teacher how to prioritise rather than carrying pressure alone.',
        ],
      },
    ],
  },
  'topic-beliefs': {
    readMinutes: 5,
    modules: [
      {
        title: 'Belief in Allah',
        arabicName: 'الإيمان بالله',
        transliteration: 'Al-īmān billāh',
        meaning: 'Belief in Allah',
        paragraphs: [
          'Belief in Allah is the foundation of iman. Muslims believe Allah is one, unique, the Creator and Sustainer, and direct worship to Him alone.',
          'This belief shapes how Muslims turn to Allah in prayer, gratitude, forgiveness and personal dua.',
        ],
        points: [
          'Allah has no partner or equal.',
          'Muslims can speak to Allah directly in dua.',
          'Tawhid is the belief in the oneness of Allah.',
        ],
        reflection: 'What is one thing you would like to bring to Allah in dua?',
      },
      {
        title: 'Belief in the angels',
        arabicName: 'الإيمان بالملائكة',
        transliteration: 'Al-īmān bil-malāʾikah',
        meaning: 'Belief in the angels',
        paragraphs: [
          'Angels are honoured beings created by Allah from light. They belong to the unseen world, worship Allah, and carry out the tasks He gives them.',
          'The angel Jibril brought revelation to the prophets. Learning about angels is one part of believing in the unseen.',
        ],
        points: [
          'Angels worship Allah and carry out His commands.',
          'Belief in angels is part of the six articles of faith.',
        ],
        roles: [
          { name: 'Jibril', role: 'Revelation', detail: 'Brought revelation to the prophets.' },
          { name: 'Mika’il', role: 'Rain & provision', detail: 'Associated with provision by Allah’s command.' },
        ],
        quote: {
          text: 'They do not disobey Allah in what He commands them but do what they are commanded.',
          source: 'Quran · At-Tahrim 66:6',
        },
        reflection: 'How does remembering that angels are part of the unseen shape your understanding of faith?',
      },
      {
        title: 'Belief in the revealed books',
        arabicName: 'الإيمان بالكتب',
        transliteration: 'Al-īmān bil-kutub',
        meaning: 'Belief in the revealed books',
        paragraphs: [
          'Muslims believe Allah revealed guidance to His messengers. The Quran is the final revelation and the scripture Muslims recite and follow.',
          'Muslims also affirm the original revelations given before the Quran, including the Torah and the Gospel.',
        ],
        points: [
          'The Quran is the final revelation.',
          'Revelation guides people toward worshipping Allah and living with care.',
          'Muslims honour the revelations given to earlier prophets.',
        ],
        reflection: 'What would you like to learn or read from the Quran?',
      },
      {
        title: 'Belief in the messengers',
        arabicName: 'الإيمان بالرسل',
        transliteration: 'Al-īmān bir-rusul',
        meaning: 'Belief in the messengers',
        paragraphs: [
          'Muslims believe Allah sent messengers to guide people. They honour all of them, including Ibrahim, Musa and Isa (peace be upon them).',
          'Muslims believe Muhammad is the final Messenger. Prophets are respected and followed; worship is directed to Allah alone.',
        ],
        points: [
          'Messengers called people to worship Allah.',
          'Muslims respect all of Allah’s messengers.',
          'Muhammad is understood as the final Messenger.',
        ],
        reflection: 'Which prophet’s story would you like to explore next?',
      },
      {
        title: 'Belief in the Last Day',
        arabicName: 'الإيمان باليوم الآخر',
        transliteration: 'Al-īmān bil-yawm al-ākhir',
        meaning: 'Belief in the Last Day',
        paragraphs: [
          'Muslims believe that life does not end with this world and that people will be raised and held accountable by Allah.',
          'Belief in the Last Day can bring hope in Allah’s justice and encourage people to act with compassion and responsibility.',
        ],
        points: [
          'People will return to Allah.',
          'Allah’s knowledge, justice and mercy are central to this belief.',
          'Everyday choices and care for others matter.',
        ],
        reflection: 'What is one kind action you would like to carry into today?',
      },
      {
        title: 'Belief in divine decree',
        arabicName: 'الإيمان بالقدر',
        transliteration: 'Al-īmān bil-qadar',
        meaning: 'Belief in divine decree',
        paragraphs: [
          'Muslims believe that Allah knows all things and that nothing is outside His knowledge and decree.',
          'This belief does not remove human responsibility. People make choices and are accountable for them, while seeking Allah’s help and trusting Him through what they cannot control.',
        ],
        points: [
          'Allah’s knowledge encompasses all things.',
          'People remain responsible for their choices.',
          'Trust in Allah can sit alongside effort, prayer and seeking help.',
        ],
        note: 'Questions about divine decree can be deep. It is okay to explore them gradually with a trusted teacher.',
        reflection: 'What is within your control today, and what can you ask Allah to help you with?',
      },
    ],
  },
  'topic-five-pillars': {
    readMinutes: 6,
    modules: [
      {
        title: 'Five practices that hold up Muslim life',
        paragraphs: ['The five pillars are:'],
        points: [
          'Shahada: testimony of faith.',
          'Salah: the five daily prayers.',
          'Zakat: obligatory giving when its conditions are met.',
          'Sawm: fasting in Ramadan.',
          'Hajj: pilgrimage to Makkah for those able.',
        ],
      },
      {
        title: 'Begin with the foundations',
        paragraphs: [
          'For many new Muslims, prayer is the next practical pillar to learn after understanding the shahada. Zakat is not due in every circumstance, and hajj is connected to ability; specific conditions need individual guidance.',
          'For cash savings, a commonly taught zakat rate is 2.5% when qualifying wealth stays above the nisab for a lunar year. The calculation depends on what you own, so ask for help when it applies to you.',
          'The pillars are a lifelong framework, not five tasks to complete in your first week. Learning the meaning of each one helps the practices feel less like a checklist.',
        ],
      },
      {
        title: 'Belief and practice are related',
        paragraphs: [
          'The six articles of faith are beliefs, such as belief in Allah and the messengers. The five pillars are acts of worship. Both are central, but they answer different questions: what Muslims believe and how that faith is practised.',
        ],
        note: 'Questions about eligibility, health or finances are best discussed privately with a qualified teacher.',
      },
    ],
  },
  'topic-questions-and-doubts': {
    readMinutes: 5,
    modules: [
      {
        title: 'First, name the kind of question',
        paragraphs: ['A question is easier to work through when you know what kind it is. It may be about:'],
        points: [
          'Belief: what Muslims believe and why.',
          'Practice: what to do in prayer, fasting or purification.',
          'A source: whether a claim online is reliable.',
          'Wellbeing: whether fear, grief or loneliness is making something feel urgent.',
        ],
      },
      {
        title: 'Ask one clear question',
        paragraphs: [
          'Before searching widely, write down what you need to understand or decide. Include the practical context that matters, then ask a knowledgeable person who can explain the reasoning and sources.',
          'For a personal ruling, details can matter. You can share only what is needed and ask for a private conversation.',
        ],
      },
      {
        title: 'When faith feels different',
        paragraphs: [
          'Feelings naturally rise and fall; a quiet or difficult day does not by itself answer what you believe. Avoid comparing your inner life with polished posts or people who have practised for years.',
          'Keep a manageable routine and speak with someone you trust. If low mood or anxiety is affecting daily life, a health professional can help alongside spiritual support.',
        ],
      },
    ],
  },
  'topic-thinking-about-islam': {
    readMinutes: 4,
    modules: [
      {
        title: 'The central belief',
        paragraphs: [
          'Muslims believe in one God, Allah, who has no partner. They believe He sent prophets, including Abraham, Moses and Jesus, and that Muhammad is the final Messenger. The Quran is the revelation Muslims follow.',
          'Muslim life is also shaped by five central practices: the shahada, prayer, zakat, fasting Ramadan and hajj for those able.',
        ],
      },
      {
        title: 'Explore without pressure',
        paragraphs: [
          'Reading, listening and asking questions can all be part of exploring. You do not need to decide on a schedule set by another person or an app.',
          'If privacy matters, consider what information a resource request collects. Reading online or speaking to someone you already trust may feel more comfortable.',
        ],
      },
      {
        title: 'What the shahada means',
        paragraphs: [
          'The shahada is the testimony of faith: there is no god worthy of worship except Allah, and Muhammad is the Messenger of Allah. Saying it is meaningful when it reflects sincere belief; a specific venue is not what makes faith real.',
          'If you are considering it, you can ask a trusted Muslim or local teacher what the words mean and what support is available afterward.',
        ],
      },
    ],
  },
  'topic-why-muslims-differ': {
    readMinutes: 6,
    modules: [
      {
        title: 'A shared foundation',
        paragraphs: [
          'Muslims share central beliefs in Allah, revelation, the prophets, the Quran and worship. Differences you may notice in a mosque often concern how scholars understand a practical detail, not whether the other person is Muslim.',
          'For example, people may position their hands differently in prayer or follow different details of purification.',
        ],
      },
      {
        title: 'What is a madhhab?',
        paragraphs: [
          'A madhhab is a scholarly method for interpreting sources and answering practical questions. Among Sunni Muslims, four widely followed schools are Hanafi, Maliki, Shafi’i and Hanbali. Other Muslim traditions have their own scholarly histories.',
          'A school is not a separate religion. It provides a way for a learner to follow scholarship rather than having to derive every ruling alone.',
        ],
      },
      {
        title: 'A steady way to learn',
        paragraphs: [
          'As a beginner, you do not need to compare every school. Learning from one qualified, trustworthy local teacher can give you a coherent starting point; ask them when a detail is disputed.',
          'Avoid declaring another person’s prayer invalid based on a visible difference. If a practice worries you, ask for its evidence and context before changing your own routine.',
        ],
        note: 'The linked guide focuses on Sunni schools and is awaiting scholar review. Ask a teacher who understands your tradition.',
      },
    ],
  },
  'topic-prayer': {
    readMinutes: 6,
    modules: [
      {
        title: 'The five prayers and their times',
        paragraphs: ['The daily prayers follow the movement of the sun. Their times shift with the seasons and location.'],
        points: [
          'Fajr: dawn, before sunrise.',
          'Dhuhr: after the sun passes its highest point.',
          'Asr: afternoon.',
          'Maghrib: just after sunset.',
          'Isha: night, after twilight.',
        ],
        note: 'The obligatory units (rak’ahs) are: Fajr 2, Dhuhr 4, Asr 4, Maghrib 3 and Isha 4. Voluntary prayers are not included.',
      },
      {
        title: 'What happens in a rak’ah?',
        paragraphs: [
          'A rak’ah is one unit of prayer. A common pattern includes standing and recitation, bowing, rising, and two prostrations with a brief sitting between them. The prayer ends with a sitting and greeting of peace.',
          'The exact recitations and some movements have details that vary by school. Open the prayer guide in the Prayer tab for an illustrated two-unit walkthrough.',
        ],
      },
      {
        title: 'Learning while life carries on',
        paragraphs: [
          'Each prayer has a time window; it does not have to be performed at the exact minute the window opens. A local timetable or mosque can help you learn the times where you live.',
          'If you lose your place or pronunciation is still developing, pause and ask a teacher how to continue. Learning is a process, and the transliteration here is only a pronunciation aid.',
        ],
      },
    ],
  },
  'topic-purification': {
    readMinutes: 6,
    modules: [
      {
        title: 'Two dimensions of purification',
        paragraphs: [
          'Taharah means purification. It includes physical preparation for worship, such as wudu, and the ongoing effort to cultivate qualities like honesty and humility.',
          'Clean clothing and a clean place to pray are also part of preparing. Ritual washing is not a judgement on your worth or a demand for perfection.',
        ],
      },
      {
        title: 'Wudu: the common sequence',
        paragraphs: ['A commonly taught wudu sequence is:'],
        points: [
          'Make the intention in your heart; saying it aloud is not needed.',
          'Wash the hands, rinse the mouth and nose, then wash the face.',
          'Wash the arms including the elbows, wipe the head, then wash the feet including the ankles.',
          'Many people wash each area three times; details and minimum requirements vary by school.',
        ],
        note: 'Open the Wudu guide in the Prayer tab for a visual walkthrough. Ask a teacher to demonstrate if that helps.',
      },
      {
        title: 'Ghusl, tayammum and when to ask',
        paragraphs: [
          'Ghusl is a full-body ritual wash required in some circumstances. Tayammum is a dry purification method discussed when water is unavailable or cannot safely be used.',
          'Using the toilet, passing wind and deep sleep commonly require renewing wudu. Some other situations are treated differently across schools, so ask a teacher about a specific case or an accommodation.',
        ],
      },
    ],
  },
  'topic-fasting': {
    readMinutes: 6,
    modules: [
      {
        title: 'What Ramadan is',
        paragraphs: [
          'Ramadan is the ninth month of the Islamic lunar calendar. Muslims who are required and able fast from dawn until sunset, abstaining from food, drink and sexual activity during the fast. The month is also associated with prayer, Quran, generosity and community.',
          'The meal before dawn is often called suhoor; iftar is the meal that breaks the fast at sunset. People may gather with family or at a mosque, but a quiet first Ramadan is valid too.',
        ],
      },
      {
        title: 'The fast in everyday life',
        paragraphs: [
          'The fast is more than skipping meals: Muslims also try to guard their speech and behaviour and make room for worship. The intention is held in the heart; a special spoken formula is not needed.',
          'Accidental situations and questions about medicines, brushing teeth, travel or making up a missed day can have detailed rulings. Do not rely on a short summary for a personal case.',
        ],
      },
      {
        title: 'Exemptions and wellbeing',
        paragraphs: [
          'Islamic guidance recognises circumstances such as illness, travel, pregnancy, breastfeeding and menstruation; what to do can depend on the person and school of thought.',
          'If fasting could affect your health, medication or recovery, speak with a clinician and a qualified religious teacher before deciding. Never stop prescribed treatment without medical advice.',
        ],
      },
    ],
  },
  'topic-menstruation-and-worship': {
    readMinutes: 5,
    modules: [
      {
        title: 'A change in worship, not in worth',
        paragraphs: [
          'In common Sunni guidance, ritual prayer and fasting pause during menstruation. Ramadan fasts missed during this time are made up later; daily prayers missed during menstruation are not made up.',
          'This pause is a rule of worship, not a sign that someone is distant from Allah or unwelcome in the community.',
        ],
      },
      {
        title: 'Ways to stay connected',
        paragraphs: [
          'Personal dua, remembrance, listening to Quran, learning and acts of kindness are ways many women continue their connection with Allah.',
          'Questions about Quran recitation or touching a printed Quran, the end of a period, irregular bleeding and the timing of a prayer can have school-specific details.',
        ],
      },
      {
        title: 'Ask privately when you need to',
        paragraphs: [
          'A qualified female teacher or scholar can explain how a teaching applies to your circumstances. You can ask privately and share only the details needed.',
          'When bleeding ends, a full-body ritual wash (ghusl) is commonly taught before resuming prayer. Ask about your own situation if timing or health makes this unclear.',
        ],
        note: 'This is a sensitive topic and the linked source is awaiting scholar review. Nothing here is a personal ruling.',
      },
    ],
  },
  'topic-dua-and-dhikr': {
    readMinutes: 5,
    modules: [
      {
        title: 'Dua: speaking to Allah',
        paragraphs: [
          'Dua is personal supplication: asking Allah for help, guidance or forgiveness, or expressing gratitude. Unlike the set daily prayers, personal dua can be made in your own words and language.',
          'You do not need to memorise a long list before you can make dua. A simple, sincere request is a place to begin.',
        ],
      },
      {
        title: 'Dhikr: remembrance',
        paragraphs: ['Dhikr means remembering Allah. Short phrases often heard include:'],
        points: [
          'SubhanAllah: Allah is perfect and free from imperfection.',
          'Alhamdulillah: praise and thanks belong to Allah.',
          'Allahu akbar: Allah is greater.',
        ],
        note: 'Translations are brief explanations of meaning. Learn pronunciation and context from a teacher or reliable source.',
      },
      {
        title: 'Choose sources carefully',
        paragraphs: [
          'For a dua attributed to the Quran or the Prophet, look for a traceable reference rather than a quote image with no source. If you are unsure, you can ask Allah for the same thing in your own words.',
          'Remembrance can bring comfort, but it does not replace professional care when someone is in crisis or struggling to function.',
        ],
      },
    ],
  },
  'topic-quran': {
    readMinutes: 6,
    modules: [
      {
        title: 'What the Quran is',
        paragraphs: [
          'Muslims believe the Quran is the word of Allah revealed in Arabic to Prophet Muhammad through the Angel Jibril. It has 114 chapters, called surahs, made up of verses called ayat.',
          'The Quran is read, recited, listened to and studied. Muslims return to it throughout life rather than treating it as a book to finish quickly.',
        ],
      },
      {
        title: 'Translations and recitation',
        paragraphs: [
          'An English translation helps convey meaning, but it cannot carry every nuance of the Arabic text. If two translations differ, read the surrounding passage and consult a reliable explanation.',
          'Listening to a reciter can help you become familiar with the sound. Transliteration shows an approximate pronunciation; a teacher can help with sounds English letters do not capture.',
        ],
      },
      {
        title: 'A gentle place to begin',
        paragraphs: [
          'Many beginners start with Al-Fatihah, which is recited in prayer, and the short chapters Al-Ikhlas, Al-Falaq and An-Nas. Read a few lines, listen, and pause to reflect.',
          'If a verse feels difficult, do not build a conclusion from a screenshot or a single line. Check context, use a recognised commentary and ask someone qualified when it affects a real decision.',
        ],
      },
    ],
  },
  'topic-character': {
    readMinutes: 6,
    modules: [
      {
        title: 'Worship and character belong together',
        paragraphs: [
          'Islamic practice includes prayer and fasting, and also how a person treats others on an ordinary day. Kindness, fairness and honesty are not extras reserved for after someone has mastered worship.',
          'Small acts can matter: keeping a promise, helping a neighbour, speaking respectfully or admitting a mistake.',
        ],
      },
      {
        title: 'Patience and gratitude',
        paragraphs: [
          'Sabr (patience) is not pretending that pain does not exist. It can mean staying steady through a difficulty, continuing a good practice, or resisting an action that would harm someone.',
          'Shukr (gratitude) includes recognising good, giving thanks and using what you have responsibly. A quiet daily reflection on one thing you appreciate can help make gratitude concrete.',
        ],
      },
      {
        title: 'Honesty, trust and relationships',
        paragraphs: [
          'Amanah means being trustworthy with what people place in your care: a confidence, a responsibility, money or time. Sidq is truthfulness in speech and dealings.',
          'Good character includes family, parents, neighbours and people whose beliefs differ from yours. Avoid gossip and backbiting; if you have caused harm, take responsibility and try to repair it.',
        ],
      },
    ],
  },
  'topic-family-and-identity': {
    readMinutes: 5,
    modules: [
      {
        title: 'Keep the good in your story',
        paragraphs: [
          'Becoming Muslim does not require becoming another ethnicity or erasing your language, personality or family history. Faith can shape your life while you continue to value what is good in your background.',
          'Changing a name is not automatically required. If you have a specific question about a name or its meaning, ask a knowledgeable teacher rather than changing it out of panic.',
        ],
      },
      {
        title: 'Choose when and how to share',
        paragraphs: [
          'There is no single timeline for telling family or friends. Think about your safety, housing, finances and emotional support before deciding what to share.',
          'A calm explanation can stay personal: what you believe, that you are still learning, and that you hope to keep your relationship. You do not need to debate someone else’s beliefs.',
        ],
      },
      {
        title: 'Boundaries can be kind',
        paragraphs: [
          'You can decline a conversation, a meal or an invitation without insulting the people involved. A simple line such as “I care about you, and I would rather talk when we can both listen” can help.',
          'If pressure becomes threatening or unsafe, involve someone trustworthy and seek local professional support. Preserving safety is more urgent than winning an argument.',
        ],
      },
    ],
  },
  'topic-halal-living': {
    readMinutes: 6,
    modules: [
      {
        title: 'Start with clear food choices',
        paragraphs: [
          'Halal means permitted; haram means prohibited. Food is one common use of these words, but the principles also come up in money, work and social life.',
          'Many beginners start by avoiding pork and alcohol and choosing halal meat when it is available. Plant-based meals, beans and simple home cooking can make social meals easier while you learn.',
        ],
      },
      {
        title: 'Make social situations practical',
        paragraphs: [
          'Checking a menu or asking a host ahead of time can prevent stress. You can keep an explanation short: “I avoid pork and alcohol; I am happy to bring something if that helps.”',
          'You do not have to turn every meal into a debate. Kindness and clear communication often work better than trying to answer every question at once.',
        ],
      },
      {
        title: 'Some everyday questions are disputed',
        paragraphs: [
          'Questions about ingredients, handshakes, tattoos from before Islam, pets and financial products may involve different scholarly views. A custom in one community is not automatically a universal religious rule.',
          'Before making a costly or difficult change, ask a qualified teacher to explain the evidence and how it applies to your circumstances.',
        ],
      },
    ],
  },
  'topic-modesty': {
    readMinutes: 5,
    modules: [
      {
        title: 'Modesty includes more than clothes',
        paragraphs: [
          'Islamic teaching discusses modesty through clothing, behaviour, speech, gaze and how people treat each other. It applies to men and women, though practical dress guidance differs by person and context.',
          'The term awrah refers to parts of the body that are to be covered in a particular setting. What that means can vary between prayer and public settings and between schools of law.',
        ],
      },
      {
        title: 'Learn the principles behind practice',
        paragraphs: [
          'Many teachers describe suitable clothing as opaque and not so tight that it outlines the body. Specific requirements, including head covering and details for men, should be learned from a qualified teacher in the tradition you follow.',
          'Cultural garments are not all the same as religious requirements. Ask what the principle is and which details are matters of scholarly difference.',
        ],
      },
      {
        title: 'Make changes you can sustain',
        paragraphs: [
          'You do not need to buy a whole new wardrobe in a panic. Consider one practical change at a time, such as choosing a comfortable outfit for prayer or adjusting clothing for a particular setting.',
          'If work, sport, weather, disability or safety makes a guideline difficult, explain that context to a knowledgeable teacher and ask for practical advice.',
        ],
      },
    ],
  },
  'topic-prophet-muhammad': {
    readMinutes: 5,
    modules: [
      {
        title: 'Messenger, not someone to worship',
        paragraphs: [
          'Muslims believe Muhammad is the final Prophet and Messenger of Allah. They honour and love him, learn from his teaching and send peace upon him; worship belongs to Allah alone.',
          'The Prophet’s example connects belief to ordinary human life: family care, prayer, patience, honesty, mercy and service.',
        ],
      },
      {
        title: 'A simple map of the seerah',
        paragraphs: [
          'Seerah is the study of the Prophet’s life. Beginner accounts often describe a Makkah period centred on the call to worship one God, revelation and patience, followed by a Madinah period in which a community and its public responsibilities developed.',
          'Historical events need their setting. A reliable biography or teacher can help distinguish what happened, why it mattered and how scholars understand it.',
        ],
      },
      {
        title: 'Hadith and Sunnah',
        paragraphs: [
          'Hadith are reports of the Prophet’s words, actions, approvals and descriptions. Sunnah refers to his guidance and example as Muslims understand and follow it.',
          'Not every quote shared online is a sound hadith. Look for its collection and grading, and ask a knowledgeable person if a report will shape an important decision.',
        ],
      },
    ],
  },
  'topic-building-community': {
    readMinutes: 5,
    modules: [
      {
        title: 'Why community can help',
        paragraphs: [
          'A supportive Muslim community can offer companionship, prayer practice, answers to everyday questions and a sense of belonging. Even one reliable friend or mentor can make learning less solitary.',
          'It can take time to find the people you feel comfortable with. One difficult visit does not define Islam or every mosque.',
        ],
      },
      {
        title: 'Find a starting point',
        paragraphs: [
          'Look for a local mosque, a new-Muslim class or a convert support group. Call or message first and ask whether someone can welcome you or show you the basics.',
          'You can try more than one group. Location, language, accessibility, women’s or men’s spaces and the way questions are handled all affect whether a place feels workable for you.',
        ],
      },
      {
        title: 'Notice how support feels',
        paragraphs: [
          'Healthy support welcomes questions, respects privacy and allows you to set boundaries. A mentor should not demand secrecy, isolate you from family, pressure you into marriage or insist you change everything immediately.',
          'Choose relationships that help you grow while keeping your agency. You are allowed to say no and seek another source of support.',
        ],
      },
    ],
  },
  'topic-masjid-and-community': {
    readMinutes: 5,
    modules: [
      {
        title: 'What happens at a masjid?',
        paragraphs: [
          'A masjid is a place for prayer and often for learning, community events and service. Each mosque has its own culture, so one visit tells you about that place rather than about all Muslims.',
          'Many mosques offer classes, volunteer opportunities or new-Muslim support, but their capacity differs. Asking the office or imam is a reasonable first step.',
        ],
      },
      {
        title: 'A first visit, one step at a time',
        paragraphs: ['You can make the visit easier by asking about practical details before you go. At the mosque:'],
        points: [
          'Wear clean, modest clothing and take shoes off where others do.',
          'Keep your phone quiet and ask where to go if you are unsure.',
          'During prayer, follow the congregation as best you can; a host can explain afterwards.',
        ],
      },
      {
        title: 'Finding a mentor and raising concerns',
        paragraphs: [
          'A good mentor is patient, reliable and respectful of your pace. You can ask, “Is there someone who helps new Muslims learn the basics?”',
          'If a practical issue needs attention, start with the office or the person responsible and explain what would help. If you experience abuse, threats or coercion, seek support outside that setting too.',
        ],
      },
    ],
  },
  'topic-grief-and-loss': {
    readMinutes: 5,
    modules: [
      {
        title: 'Grief is not a measure of faith',
        paragraphs: [
          'Sadness, tears and a heavy heart are human responses to loss. Patience does not mean feeling nothing; it can mean holding pain without giving up on care, support or hope.',
          'Muslims may say “Inna lillahi wa inna ilayhi raji’un” when hearing of a death: “We belong to Allah, and to Him we return.” You do not need perfect words to be present.',
        ],
      },
      {
        title: 'How to support someone grieving',
        paragraphs: [
          'A short message, a meal, help with childcare or transport, and listening without trying to fix everything can be meaningful.',
          'Keep checking in after the first days. Grief does not end when visitors leave, and people may need different kinds of support.',
        ],
      },
      {
        title: 'When more help is needed',
        paragraphs: [
          'There are religious teachings about mourning, funeral practice and prayers for someone who has died. Details can depend on the relationship, the person’s faith and scholarly guidance; ask a local teacher about a personal case.',
          'If grief makes daily life feel unmanageable, a GP or counsellor can help. Faith and professional support can sit alongside each other.',
        ],
      },
    ],
  },
  'topic-end-of-life-decisions': {
    readMinutes: 5,
    modules: [
      {
        title: 'Plan for a time you cannot speak',
        paragraphs: [
          'Advance care planning is a conversation about what matters to you if illness leaves you unable to make or communicate a decision. It can include your values, the person you trust to represent them and questions you want clinicians to answer.',
          'Tell the person you choose what you believe and what kind of care you would want. The legal name and process for this role vary by country.',
        ],
      },
      {
        title: 'Separate the questions',
        paragraphs: [
          'Ask the medical team what a treatment is doing, what may happen if it continues or stops, and what comfort-focused care is available. Then ask a qualified religious teacher about the Islamic question that remains.',
          'Decisions about allowing an illness to take its course, withdrawing a treatment and deliberately ending a life are not identical questions. Their legal and religious analysis is complex and needs individual advice.',
        ],
      },
      {
        title: 'The source is not UK guidance',
        paragraphs: [
          'The linked article discusses Canadian law and Canadian systems. Its legal instructions do not transfer to the UK.',
          'For a real decision, speak with the treating clinicians, a qualified Islamic scholar and a UK solicitor where legal rights or documents are involved. For organ donation, check official guidance for your part of the UK and ask a scholar, since views and conditions differ.',
        ],
        note: 'This subject can feel heavy. You do not need to read further unless it is useful now. This app is not medical, legal or religious advice.',
      },
    ],
  },
  'topic-wills-and-inheritance': {
    readMinutes: 5,
    modules: [
      {
        title: 'Religious guidance and local law',
        paragraphs: [
          'Islamic inheritance has religious rules about relatives and estates. Civil law governs whether a will is valid and how an estate is administered. The two systems need careful coordination.',
          'The linked article discusses Canadian law and examples. UK rules are different, so do not use its percentages, forms or deadlines as UK instructions.',
        ],
      },
      {
        title: 'What a local adviser can help with',
        paragraphs: [
          'A UK-qualified solicitor can explain a valid will, executors, guardianship and local rules for your circumstances. A qualified scholar can explain the religious inheritance questions and how scholars calculate shares.',
          'Family structure, debts, dependants and property all matter. Online calculators and generic templates cannot replace advice based on those details.',
        ],
      },
      {
        title: 'Prepare before an appointment',
        paragraphs: [
          'You can make a list of the questions you want answered, the people who depend on you and any wishes you want to discuss. You do not need to solve every religious and legal detail before asking for help.',
          'This is a planning topic, not an emergency checklist. Return to it when it becomes relevant to your life.',
        ],
        note: 'The linked source is Canada-focused. For a UK plan, use local legal advice together with qualified religious guidance.',
      },
    ],
  },
};

export const TOPIC_TERMS = {
  'topic-new-muslim-basics': [
    { term: 'Shahada', meaning: 'The testimony of faith in Allah and His Messenger.' },
    { term: 'Salah', meaning: 'The formal prayers performed at five daily times.' },
    { term: 'Wudu', meaning: 'Ritual washing commonly performed before prayer.' },
  ],
  'topic-beliefs': [
    { term: 'Tawhid', meaning: 'Belief in Allah\'s oneness and worshipping Him alone.' },
    { term: 'Risalah', meaning: 'The message and guidance brought by the prophets.' },
    { term: 'Akhirah', meaning: 'The afterlife and the Last Day.' },
  ],
  'topic-five-pillars': [
    { term: 'Zakat', meaning: 'Obligatory giving when its conditions are met.' },
    { term: 'Nisab', meaning: 'The qualifying wealth threshold used in zakat calculations.' },
    { term: 'Hajj', meaning: 'The pilgrimage to Makkah for those who are able.' },
  ],
  'topic-questions-and-doubts': [
    { term: 'Context', meaning: 'The details around a question that can affect its answer.' },
    { term: 'Source', meaning: 'The text or evidence a religious explanation relies on.' },
    { term: 'Qualified teacher', meaning: 'A knowledgeable person able to explain a topic and its limits.' },
  ],
  'topic-thinking-about-islam': [
    { term: 'Allah', meaning: 'The Arabic word for God, used by Muslims for the one Creator.' },
    { term: 'Islam', meaning: 'A faith centred on worshipping one God and following His guidance.' },
    { term: 'Shahada', meaning: 'The testimony of faith in Allah and His Messenger.' },
  ],
  'topic-why-muslims-differ': [
    { term: 'Madhhab', meaning: 'A scholarly method for understanding practical religious questions.' },
    { term: 'Fiqh', meaning: 'Scholarly understanding of practical Islamic rulings.' },
    { term: 'Sunnah', meaning: 'The Prophet\'s example and guidance as Muslims understand it.' },
  ],
  'topic-prayer': [
    { term: 'Salah', meaning: 'The formal prayers performed at five daily times.' },
    { term: 'Rak\'ah', meaning: 'One unit in a formal prayer, with a set sequence of movements.' },
    { term: 'Qibla', meaning: 'The direction of prayer toward the Kaaba in Makkah.' },
  ],
  'topic-purification': [
    { term: 'Taharah', meaning: 'Purification, including ritual preparation for worship.' },
    { term: 'Wudu', meaning: 'Ritual washing commonly performed before prayer.' },
    { term: 'Tayammum', meaning: 'A dry purification method discussed when water cannot be used.' },
  ],
  'topic-fasting': [
    { term: 'Sawm', meaning: 'Fasting, especially the fast observed during Ramadan.' },
    { term: 'Suhoor', meaning: 'The meal eaten before dawn during Ramadan.' },
    { term: 'Iftar', meaning: 'The meal that breaks the fast at sunset.' },
  ],
  'topic-menstruation-and-worship': [
    { term: 'Hayd', meaning: 'The Arabic term commonly used for menstruation.' },
    { term: 'Qada', meaning: 'Making up an act of worship later when required.' },
    { term: 'Ghusl', meaning: 'A full-body ritual wash required in some circumstances.' },
  ],
  'topic-dua-and-dhikr': [
    { term: 'Dua', meaning: 'Personal supplication: asking Allah, thanking Him or speaking to Him.' },
    { term: 'Dhikr', meaning: 'Remembering Allah through words, worship and reflection.' },
    { term: 'Tasbih', meaning: 'Glorifying Allah, often through short phrases of remembrance.' },
  ],
  'topic-quran': [
    { term: 'Surah', meaning: 'A chapter of the Quran.' },
    { term: 'Ayah', meaning: 'A verse of the Quran; the word can also mean a sign.' },
    { term: 'Tafsir', meaning: 'Scholarly explanation and interpretation of the Quran.' },
  ],
  'topic-character': [
    { term: 'Sabr', meaning: 'Patience and steadiness through difficulty or effort.' },
    { term: 'Shukr', meaning: 'Gratitude expressed through thanks and responsible action.' },
    { term: 'Amanah', meaning: 'A trust or responsibility placed in someone\'s care.' },
  ],
  'topic-family-and-identity': [
    { term: 'Family ties', meaning: 'Relationships with relatives that Islam encourages treating with care.' },
    { term: 'Boundaries', meaning: 'Personal limits that can help keep relationships respectful and safe.' },
    { term: 'Privacy', meaning: 'Your choice about when and with whom to share personal information.' },
  ],
  'topic-halal-living': [
    { term: 'Halal', meaning: 'Permitted according to Islamic teaching.' },
    { term: 'Haram', meaning: 'Prohibited according to Islamic teaching.' },
    { term: 'Scholarly difference', meaning: 'A question on which qualified scholars may reach different conclusions.' },
  ],
  'topic-modesty': [
    { term: 'Haya', meaning: 'A sense of modesty and propriety in Islamic teaching.' },
    { term: 'Awrah', meaning: 'Areas of the body to cover in a given setting; details vary.' },
    { term: 'Hijab', meaning: 'A term used for covering and modesty, with details explained by scholars.' },
  ],
  'topic-prophet-muhammad': [
    { term: 'Seerah', meaning: 'The study of Prophet Muhammad\'s life.' },
    { term: 'Hadith', meaning: 'A report describing the Prophet\'s words, actions or approvals.' },
    { term: 'Sunnah', meaning: 'The Prophet\'s example and guidance as Muslims understand it.' },
  ],
  'topic-building-community': [
    { term: 'Ummah', meaning: 'The wider community of Muslims.' },
    { term: 'Masjid', meaning: 'A mosque and place of Muslim prayer and community.' },
    { term: 'Mentor', meaning: 'A trusted person who supports learning without taking away your agency.' },
  ],
  'topic-masjid-and-community': [
    { term: 'Masjid', meaning: 'A mosque and place of Muslim prayer and community.' },
    { term: 'Imam', meaning: 'A person who leads prayer; many also teach or support a community.' },
    { term: 'Jama\'ah', meaning: 'A congregation gathered for prayer.' },
  ],
  'topic-grief-and-loss': [
    { term: 'Sabr', meaning: 'Patience and steadiness through difficulty.' },
    { term: 'Janazah', meaning: 'The funeral prayer and related Muslim funeral rites.' },
    { term: 'Dua', meaning: 'Personal supplication, including asking for mercy and support.' },
  ],
  'topic-end-of-life-decisions': [
    { term: 'Advance care planning', meaning: 'A conversation about your care wishes if you cannot speak for yourself.' },
    { term: 'Comfort-focused care', meaning: 'Care that prioritises relief of symptoms and distress.' },
    { term: 'Decision-maker', meaning: 'A person authorised under local rules to help make care decisions.' },
  ],
  'topic-wills-and-inheritance': [
    { term: 'Mirath', meaning: 'Islamic inheritance guidance for an estate and its heirs.' },
    { term: 'Wasiyyah', meaning: 'A bequest or will discussed in Islamic inheritance guidance.' },
    { term: 'Executor', meaning: 'A person named to administer an estate under local law.' },
  ],
};
