export const PLATFORM_OFFERS = [
  ["Свой сайт", "7 дней знакомства — в подарок", "#/join"],
  ["Иммерсивные книги", "Внутрь новой истории", "#/library"],
  ["Английский A1", "Первый курс бесплатно", "#/languages/en"],
  ["Песня в подарок", "Для партнёров после первой оплаты", "#/songs"],
  ["A1 языка в подарок", "Любой язык, кроме английского", "#/languages"],
];

export function platformOffers(baseURL = "") {
  if (!baseURL) return PLATFORM_OFFERS.map((item) => [...item]);
  return PLATFORM_OFFERS.map(([title, subtitle, href]) => [
    title,
    subtitle,
    new URL(href, baseURL).href,
  ]);
}
