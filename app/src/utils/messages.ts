// Messages drôles de l'application.
// Le ton : direct, franc, taquin sur les choix d'aliments, jamais sur le corps ni la valeur de la personne.

import { getLanguage, setLanguage, isRtl, type Language } from '../i18n';

export type { Language };

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

export const MESSAGES: Record<Language, Record<MessageEvent, string[]>> = {
  fr: {
    newFood: [
      'Bah dis donc, tu consommes hein 👀',
      'Un nouvel aliment ? Ton frigo vient de perdre la bataille.',
      'Encore un nouveau ? Ta bibliothèque commence à te juger.',
      'Ajouté. Il va falloir lui trouver une place dans le budget.',
      'Nouvelle recrue dans la bibliothèque. Elle est calorique, je préviens.',
      'Bravo, un aliment de plus à regretter en beauté.',
      'Tu les collectionnes, ou tu comptes vraiment les manger ?',
      'Nouvel aliment ajouté. Ta balance retient son souffle.'
    ],
    entryAdded: [
      'Noté. Je ne dirai rien à personne. Enfin presque.',
      'Hop, dans le journal. Les calories, elles, n\'oublient jamais.',
      'Ajouté. Ton toi de demain te remercie (ou te demande des comptes).',
      'C\'est dans le journal. Il a tout vu, tout entendu.',
      'Mange tranquille, mais écris-le. C\'est la règle.',
      'Ah oui, très raisonnable. Je note, hein, je juge pas. Beaucoup.',
      'Inscrit au registre des bonnes intentions du soir.',
      "Dans le journal. Les preuves s'accumulent."
    ],
    oneOff: [
      'Le biscuit du pote ? Compté. Il n\'est pas gratuit, lui.',
      'Un petit extra ? Ça compte aussi, désolé.',
      'Les calories offertes par les autres, c\'est quand même les tiennes.',
      'Un « juste un petit bout » de plus. Enregistré.',
      '« Juste un » : la phrase la plus menteuse de la cuisine.',
      'Un extra non planifié. Le budget, lui, avait prévu autre chose.',
      'Offert par la maison, facturé par ton objectif.'
    ],
    healthImported: [
      'Santé importé. Au moins ta montre, elle, bosse.',
      'Dépense récupérée. Tu peux manger en paix (un peu).',
      'Les chiffres de Santé sont là. Impossible de tricher.',
      'Importé ! Ta montre peut enfin se reposer.',
      'Ta montre a enfin servi à quelque chose, comme quoi.',
      'Chiffres reçus. On va voir si tu méritais ce dessert.',
      "Santé importé. Les mensonges sportifs s'arrêtent ici."
    ],
    overBudget: [
      'Budget dépassé. C\'est pas la fin du monde, c\'est le début du cardio.',
      'Les calories t\'ont dit bonjour. Elles sont restées dîner.',
      'Dépassé. Demain, on se rattrape, hein ? Hein ?',
      'Tu as explosé le budget. Au moins, c\'était bon ?',
      "Objectif dépassé, mais pas celui qu'on visait.",
      'Félicitations, tu as battu ton record de gourmandise.',
      "Le budget est parti sans laisser d'adresse."
    ],
    underBudget: [
      'Il te reste de la marge. Utilise-la bien : une vraie assiette, pas un paquet de biscuits.',
      'Tu as encore de la place. Un vrai repas, pas un grignotage honteux.',
      'Marge disponible. Le dessert attend, mais le steak d\'abord.',
      'Il reste de la marge : miracle, ou oubli de tout noter ?',
      'De la place au budget. Ne la gâche pas avec un « petit truc ».'
    ],
    emptyDay: [
      'Journal vide. Soit tu jeûnes, soit t\'as oublié. Je parie sur l\'oubli.',
      'Rien d\'écrit aujourd\'hui ? Ton frigo sait des choses, lui.',
      'Page blanche. T\'as mangé quoi, au juste ?',
      "Aucune entrée. Le courage de ne rien avouer, j'admire.",
      'Journal vide : la discrétion est un art, mais pas pour une sèche.'
    ],
    proteinGoal: [
      'Objectif protéines atteint. Le muscle applaudit.',
      'Protéines validées. Maintenant, mange aussi un légume, par pitié.',
      'Les protéines sont là. Fais pas le malin pour autant.',
      'Protéines OK. Tu mérites une médaille en poulet.',
      'Objectif protéines : fait. Un miracle de plus au compteur.'
    ],
    carbsOver: [
      'Glucides au plafond. Ton corps retient déjà l\'eau, je le sens.',
      'Plafond de glucides dépassé. Le pain te fait un clin d\'œil.',
      'Trop de glucides. L\'eau adore ça, elle reste.',
      'Glucides en vacances au-dessus du plafond. Tu les as invités ?',
      'Le riz et les pâtes te remercient pour cette générosité.'
    ],
    sodiumOver: [
      'Tu as salé ta journée. Littéralement.',
      'Sodium au plafond. Bois de l\'eau, pas du bouillon.',
      'Trop de sel. Ton verre d\'eau t\'attend.',
      'Une pincée de sel ? Plutôt une saline entière.',
      'Sodium excessif. La mer Morte a appelé, elle te veut dans son équipe.'
    ],
    missingBurned: [
      'T\'as oublié d\'importer Santé hier. Ta montre a bossé pour rien.',
      'Hier : calories mangées, brûlées introuvables. Ça sent l\'oubli.',
      'La dépense d\'hier manque. Le raccourci t\'en veut.',
      'Hier : un mystère. Combien as-tu brûlé ? Personne ne sait.',
      "Santé n'a rien reçu. Ta montre fait la grève."
    ]
  },
  'ar-EG': {
    newFood: [
      'يا ساتر يا عم، إنت بتاكل كتير ولا إيه؟ 👀',
      'أكلة جديدة؟ التلاجة خسرت المعركة.',
      'كمان واحد جديد؟ المكتبة بتبصلك بشك.',
      'اتضاف. دلوقتي لازم نلاقيله مكان في الميزانية.',
      'عضو جديد في المكتبة. حاسب، سعراته كتير.',
      'برافو، أكلة جديدة تندم عليها بشياكة.',
      'بتجمعهم ولا ناوي تاكلهم فعلاً؟',
      'اتضافت أكلة. الميزان بيحبس نفسه.'
    ],
    entryAdded: [
      'اتسجل. مش هقول لحد… تقريباً 😏',
      'اتحط في الدفتر. السعرات عمرها ما بتنسى.',
      'اتضاف. إنت بكرة هتشكرني (أو هتحاسبني).',
      'الدفتر شاف كل حاجة وسمع كل حاجة.',
      'كُل براحتك بس سجّل. دي القاعدة.',
      'أيوه طبعاً، معقول جداً. أنا بسجل بس، مش بحكم. كتير.',
      'اتكتبت في سجل النوايا الحسنة بتاع الليل.',
      'في الدفتر. الأدلة بتتراكم.'
    ],
    oneOff: [
      'بسكوتة صاحبك؟ اتحسبت. مش ببلاش على فكرة.',
      'حاجة صغيرة زيادة؟ برضه بتتحسب، معلش.',
      'السعرات اللي الناس بتدهالك بتتحسب عليك برضه.',
      '«لقمة صغيرة بس» كمان واحدة. اتسجلت.',
      '«واحدة بس»: أكتر جملة كدابة في المطبخ.',
      'حاجة زيادة من غير تخطيط. الميزانية كانت مخططة لحاجة تانية.',
      'هدية من البيت، فاتورتها على هدفك.'
    ],
    healthImported: [
      'بيانات الصحة وصلت. على الأقل ساعتك بتشتغل هي.',
      'الحرق اتجاب. كُل في سلام (شوية).',
      'أرقام الصحة وصلت. مفيش غش.',
      'اتستورد! ساعتك تقدر ترتاح دلوقتي.',
      'ساعتك أخيراً نفعت في حاجة.',
      'الأرقام وصلت. نشوف هتستاهل التحلية دي ولا لأ.',
      'اتستورد. الكدب الرياضي خلص هنا.'
    ],
    overBudget: [
      'عديت الميزانية. مش آخر الدنيا، دي بداية الكارديو.',
      'السعرات سلمت عليك وقعدت تتعشى.',
      'عديت. بكرة نعوّض، صح؟ صح؟',
      'الميزانية انفجرت. على الأقل كانت حلوة؟',
      'عديت الهدف، بس مش الهدف اللي كنا بنقصده.',
      'مبروك، كسرت رقمك القياسي في الشراهة.',
      'الميزانية مشيت من غير ما تسيب عنوان.'
    ],
    underBudget: [
      'لسه عندك مساحة. استخدمها صح: أكلة حقيقية، مش علبة بسكوت.',
      'لسه فيه مكان. وجبة حقيقية، مش تسالي.',
      'فيه ميزانية. الحلويات تستنى، الأكل الأول.',
      'لسه فيه مساحة: معجزة، ولا نسيت تسجل؟',
      'فيه مكان في الميزانية. متضيعوش على «حاجة صغيرة».'
    ],
    emptyDay: [
      'الدفتر فاضي. يا إما صايم يا إما نسيت. أنا شايف إنك نسيت.',
      'مفيش حاجة متسجلة النهارده؟ التلاجة عارفة حاجات.',
      'صفحة بيضا. أكلت إيه بالظبط؟',
      'مفيش تسجيلات. شجاعة إنك متعترفش بحاجة، بحترمها.',
      'الدفتر فاضي. الكتمان فن، بس مش في الدايت.'
    ],
    proteinGoal: [
      'هدف البروتين تحقق. العضلة بتصقف.',
      'البروتين تمام. دلوقتي كُل خضار كمان، بالله عليك.',
      'البروتين وصل. بس متتشاطرش.',
      'البروتين تمام. تستاهل ميدالية فراخ.',
      'هدف البروتين اتحقق. معجزة كمان في العداد.'
    ],
    carbsOver: [
      'الكارب عدّى الحد. جسمك بدأ يحتفظ بالمية، حاسس بيها.',
      'عدّيت سقف الكارب. العيش بيغمزلك.',
      'كارب كتير. المية بتحب كده وبتقعد.',
      'الكارب في إجازة فوق السقف. إنت اللي عزمتهم؟',
      'الرز والمكرونة بيشكروك على الكرم ده.'
    ],
    sodiumOver: [
      'إنت ملّحت يومك. حرفياً.',
      'الصوديوم عدّى الحد. اشرب مية.',
      'ملح كتير. كوباية المية مستنياك.',
      'رشة ملح؟ دي ملاحة كاملة.',
      'الصوديوم زيادة. البحر الميت اتصل وعايزك في فريقه.'
    ],
    missingBurned: [
      'نسيت تستورد الصحة امبارح. ساعتك اشتغلت على الفاضي.',
      'امبارح: سعرات الأكل موجودة والحرق مش لاقيينه. ريحة نسيان.',
      'حرق امبارح ناقص. الاختصار زعلان منك.',
      'امبارح لغز. حرقت كام؟ محدش عارف.',
      'الصحة ملقتش حاجة. ساعتك مضربة.'
    ]
  },
  en: {
    newFood: ['New food added. Your fridge is getting interesting.', 'One more thing on the menu.', 'Your food library has a new regular.'],
    entryAdded: ['Logged. Your future self has the receipt.', 'On the record.', 'Another meal in the books.'],
    oneOff: ['Logged for today. A guest appearance.', 'One-off food, officially on the record.', 'Today’s special is logged.'],
    healthImported: ['Health data imported. Your watch did its homework.', 'Your activity data is in.', 'Your watch and your journal are caught up.'],
    overBudget: ['Over today’s budget. It happens.', 'That’s over the limit for today.', 'Today’s log is over budget.'],
    underBudget: ['Still room in today’s budget.', 'You’ve got calories left today.', 'Some of today’s budget is still available.'],
    emptyDay: ['Your journal is waiting for its first meal.', 'Nothing logged yet.', 'An empty page, for now.'],
    proteinGoal: ['Protein goal reached.', 'Protein is covered for today.', 'That’s today’s protein goal checked off.'],
    carbsOver: ['Carbs are over today’s limit.', 'The carbs showed up in force today.', 'Carbs went past the daily target.'],
    sodiumOver: ['Sodium is above today’s limit.', 'The salt shaker had a busy day.', 'Today’s sodium total is over the limit.'],
    missingBurned: ['Yesterday’s calories burned are still missing.', 'Your watch may have yesterday’s burn data.', 'Log yesterday’s burn to complete the day.']
  }
};

// La langue est gérée par le module de traduction ; on la réexporte pour les appels existants
export { getLanguage, setLanguage, isRtl };

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
