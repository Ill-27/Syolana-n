export const lessons = {
  en: {
    name: "Английский",
    native: "English",
    code: "EN",
    title: "Знакомство и первые предложения",
    rule: "I am — «я есть / я являюсь», you are — «ты / вы есть», he / she is — «он / она есть». В русском «есть» обычно опускается: I am a writer — «Я писатель». Для вопроса перенесите am / is / are перед подлежащим: Are you a writer? Для отрицания добавьте not: I am not a teacher. Перед профессией в единственном числе обычно нужен a / an.",
    examples: [
      "I am a writer. — Я писатель.",
      "She is an artist. — Она художница.",
      "Are you a student? — Вы студент?",
    ],
    words: [
      ["hello", "привет"],
      ["a book", "книга"],
      ["a writer", "писатель"],
      ["an artist", "художник"],
      ["a student", "студент"],
      ["thank you", "спасибо"],
    ],
    questions: [
      { q: "I ___ a writer.", options: ["am", "is", "are"], answer: 0 },
      {
        q: "Она художница.",
        options: ["She are artist.", "She is an artist.", "She am an artist."],
        answer: 1,
      },
      {
        q: "Как спросить «Вы студент?»",
        options: ["You a student?", "Is you a student?", "Are you a student?"],
        answer: 2,
      },
    ],
  },
  es: {
    name: "Испанский",
    native: "Español",
    code: "ES",
    title: "Представляемся: ser и llamarse",
    rule: "Soy — «я являюсь», eres — «ты являешься», es — «он / она является». Для профессии используем ser: Soy escritora — «Я писательница». Перед профессией после ser обычно нет неопределённого артикля. Me llamo Marina — «Меня зовут Марина». Вопрос: ¿Cómo te llamas? Отрицание образуется с no перед глаголом: No soy profesora.",
    examples: [
      "Soy escritora. — Я писательница.",
      "Él es músico. — Он музыкант.",
      "Me llamo Marina. — Меня зовут Марина.",
    ],
    words: [
      ["hola", "привет"],
      ["el libro", "книга"],
      ["la escritora", "писательница"],
      ["el músico", "музыкант"],
      ["el / la estudiante", "студент / студентка"],
      ["gracias", "спасибо"],
    ],
    questions: [
      { q: "Yo ___ escritora.", options: ["es", "eres", "soy"], answer: 2 },
      {
        q: "«Меня зовут Марина»",
        options: ["Me llamo Marina.", "Soy llamo Marina.", "Te llamas Marina."],
        answer: 0,
      },
      {
        q: "Как сказать «Я не преподавательница»?",
        options: ["Soy no profesora.", "No soy profesora.", "No es profesora."],
        answer: 1,
      },
    ],
  },
  fr: {
    name: "Французский",
    native: "Français",
    code: "FR",
    title: "Первое знакомство: être и s’appeler",
    rule: "Je suis — «я являюсь», tu es — «ты являешься», il / elle est — «он / она является». Je suis artiste — «Я художник / художница». Перед профессией после être обычно нет неопределённого артикля. Je m’appelle Marina — «Меня зовут Марина». В письменном отрицании используем ne … pas: Je ne suis pas professeur.",
    examples: [
      "Je suis artiste. — Я художник / художница.",
      "Elle est étudiante. — Она студентка.",
      "Comment tu t’appelles ? — Как тебя зовут?",
    ],
    words: [
      ["bonjour", "здравствуйте / добрый день"],
      ["le livre", "книга"],
      ["l’artiste (m / f)", "художник / художница"],
      ["la musique", "музыка"],
      ["l’étudiant / l’étudiante", "студент / студентка"],
      ["merci", "спасибо"],
    ],
    questions: [
      { q: "Je ___ artiste.", options: ["es", "est", "suis"], answer: 2 },
      {
        q: "«Меня зовут Марина»",
        options: [
          "Je m’appelle Marina.",
          "Je est Marina.",
          "Tu m’appelle Marina.",
        ],
        answer: 0,
      },
      {
        q: "Верное письменное отрицание:",
        options: [
          "Je suis ne pas professeur.",
          "Je ne suis pas professeur.",
          "Je pas suis professeur.",
        ],
        answer: 1,
      },
    ],
  },
};
