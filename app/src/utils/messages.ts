// Messages drôles de l'application, en français et en arabe égyptien
// Le ton : direct, franc, taquin sur les choix d'aliments, jamais sur le corps ni la valeur de la personne.

export type Language = 'fr' | 'ar-EG';

export type MessageEvent =
  | 'newFood'
  | 'entryAdded'
  | 'oneOff'
  | 'healthImported'
  | 'overBudget'
  | 'underBudget'
  | 'emptyDay'
  | 'proteinGoal'
  | 'carbsOver'
  | 'sodiumOver'
  | 'missingBurned';

const LANGUAGE_KEY = 'language';

export const MESSAGES: Record<Language, Record<MessageEvent, string[]>> = {
  fr: {
    newFood: [
      'Bah dis donc, tu consommes hein 👀',
      'Un nouvel aliment ? Ton frigo vient de perdre la bataille.',
      'Encore un nouveau ? Ta bibliothèque commence à te juger.',
      'Ajouté. Il va falloir lui trouver une place dans le budget.',
      'Nouvelle recrue dans la bibliothèque. Elle est calorique, je préviens.'
    ],
    entryAdded: [
      'Noté. Je ne dirai rien à personne. Enfin presque.',
      'Hop, dans le journal. Les calories, elles, n\'oublient jamais.',
      'Ajouté. Ton toi de demain te remercie (ou te demande des comptes).',
      'C\'est dans le journal. Il a tout vu, tout entendu.',
      'Mange tranquille, mais écris-le. C\'est la règle.'
    ],
    oneOff: [
      'Le biscuit du pote ? Compté. Il n\'est pas gratuit, lui.',
      'Un petit extra ? Ça compte aussi, désolé.',
      'Les calories offertes par les autres, c\'est quand même les tiennes.',
      'Un « juste un petit bout » de plus. Enregistré.'
    ],
    healthImported: [
      'Santé importé. Au moins ta montre, elle, bosse.',
      'Dépense récupérée. Tu peux manger en paix (un peu).',
      'Les chiffres de Santé sont là. Impossible de tricher.',
      'Importé ! Ta montre peut enfin se reposer.'
    ],
    overBudget: [
      'Budget dépassé. C\'est pas la fin du monde, c\'est le début du cardio.',
      'Les calories t\'ont dit bonjour. Elles sont restées dîner.',
      'Dépassé. Demain, on se rattrape, hein ? Hein ?',
      'Tu as explosé le budget. Au moins, c\'était bon ?'
    ],
    underBudget: [
      'Il te reste de la marge. Utilise-la bien : une vraie assiette, pas un paquet de biscuits.',
      'Tu as encore de la place. Un vrai repas, pas un grignotage honteux.',
      'Marge disponible. Le dessert attend, mais le steak d\'abord.'
    ],
    emptyDay: [
      'Journal vide. Soit tu jeûnes, soit t\'as oublié. Je parie sur l\'oubli.',
      'Rien d\'écrit aujourd\'hui ? Ton frigo sait des choses, lui.',
      'Page blanche. T\'as mangé quoi, au juste ?'
    ],
    proteinGoal: [
      'Objectif protéines atteint. Le muscle applaudit.',
      'Protéines validées. Maintenant, mange aussi un légume, par pitié.',
      'Les protéines sont là. Fais pas le malin pour autant.'
    ],
    carbsOver: [
      'Glucides au plafond. Ton corps retient déjà l\'eau, je le sens.',
      'Plafond de glucides dépassé. Le pain te fait un clin d\'œil.',
      'Trop de glucides. L\'eau adore ça, elle reste.'
    ],
    sodiumOver: [
      'Tu as salé ta journée. Littéralement.',
      'Sodium au plafond. Bois de l\'eau, pas du bouillon.',
      'Trop de sel. Ton verre d\'eau t\'attend.'
    ],
    missingBurned: [
      'T\'as oublié d\'importer Santé hier. Ta montre a bossé pour rien.',
      'Hier : calories mangées, brûlées introuvables. Ça sent l\'oubli.',
      'La dépense d\'hier manque. Le raccourci t\'en veut.'
    ]
  },
  'ar-EG': {
    newFood: [
      'يا ساتر يا عم، إنت بتاكل كتير ولا إيه؟ 👀',
      'أكلة جديدة؟ التلاجة خسرت المعركة.',
      'كمان واحد جديد؟ المكتبة بتبصلك بشك.',
      'اتضاف. دلوقتي لازم نلاقيله مكان في الميزانية.',
      'عضو جديد في المكتبة. حاسب، سعراته كتير.'
    ],
    entryAdded: [
      'اتسجل. مش هقول لحد… تقريباً 😏',
      'اتحط في الدفتر. السعرات عمرها ما بتنسى.',
      'اتضاف. إنت بكرة هتشكرني (أو هتحاسبني).',
      'الدفتر شاف كل حاجة وسمع كل حاجة.',
      'كُل براحتك بس سجّل. دي القاعدة.'
    ],
    oneOff: [
      'بسكوتة صاحبك؟ اتحسبت. مش ببلاش على فكرة.',
      'حاجة صغيرة زيادة؟ برضه بتتحسب، معلش.',
      'السعرات اللي الناس بتدهالك بتتحسب عليك برضه.',
      '«لقمة صغيرة بس» كمان واحدة. اتسجلت.'
    ],
    healthImported: [
      'بيانات الصحة وصلت. على الأقل ساعتك بتشتغل هي.',
      'المصروف اتجاب. كُل في سلام (شوية).',
      'أرقام الصحة وصلت. مفيش غش.',
      'اتستورد! ساعتك تقدر ترتاح دلوقتي.'
    ],
    overBudget: [
      'عديت الميزانية. مش آخر الدنيا، دي بداية الكارديو.',
      'السعرات سلمت عليك وقعدت تتعشى.',
      'عديت. بكرة نعوّض، صح؟ صح؟',
      'الميزانية انفجرت. على الأقل كانت حلوة؟'
    ],
    underBudget: [
      'لسه عندك مساحة. استخدمها صح: أكلة حقيقية، مش علبة بسكوت.',
      'لسه فيه مكان. وجبة حقيقية، مش تسالي.',
      'فيه ميزانية. الحلويات تستنى، الأكل الأول.'
    ],
    emptyDay: [
      'الدفتر فاضي. يا إما صايم يا إما نسيت. أنا شايف إنك نسيت.',
      'مفيش حاجة متسجلة النهارده؟ التلاجة عارفة حاجات.',
      'صفحة بيضا. أكلت إيه بالظبط؟'
    ],
    proteinGoal: [
      'هدف البروتين تحقق. العضلة بتصقف.',
      'البروتين تمام. دلوقتي كُل خضار كمان، بالله عليك.',
      'البروتين وصل. بس متتشاطرش.'
    ],
    carbsOver: [
      'الكارب عدّى الحد. جسمك بدأ يحتفظ بالمية، حاسس بيها.',
      'عدّيت سقف الكارب. العيش بيغمزلك.',
      'كارب كتير. المية بتحب كده وبتقعد.'
    ],
    sodiumOver: [
      'إنت ملّحت يومك. حرفياً.',
      'الصوديوم عدّى الحد. اشرب مية.',
      'ملح كتير. كوباية المية مستنياك.'
    ],
    missingBurned: [
      'نسيت تستورد الصحة امبارح. ساعتك اشتغلت على الفاضي.',
      'امبارح: سعرات الأكل موجودة والحرق مش لاقيينه. ريحة نسيان.',
      'مصروف امبارح ناقص. الاختصار زعلان منك.'
    ]
  }
};

export function getLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return stored === 'ar-EG' ? 'ar-EG' : 'fr';
  } catch {
    return 'fr';
  }
}

export function setLanguage(language: Language): void {
  localStorage.setItem(LANGUAGE_KEY, language);
}

export const isRtl = (language: Language): boolean => language === 'ar-EG';

const hash = (seed: string) => {
  let value = 0;
  for (let i = 0; i < seed.length; i++) value = (value * 31 + seed.charCodeAt(i)) >>> 0;
  return value;
};

/** Une phrase pour l'événement. Avec une graine, le choix est stable (même phrase toute la journée) */
export function pickMessage(event: MessageEvent, language: Language = getLanguage(), seed?: string): string {
  const list = MESSAGES[language][event];
  const index = seed !== undefined ? hash(`${event}:${seed}`) % list.length : Math.floor(Math.random() * list.length);
  return list[index];
}
