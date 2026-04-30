export type KpiKey =
  | "pagesPublished"
  | "organicTraffic"
  | "adsenseRevenue"
  | "seoScore";

export const KPI_DEFINITIONS: Record<KpiKey, string> = {
  pagesPublished:
    "Numero di pagine attualmente pubblicate sull'ambiente live del progetto. Include solo pagine in stato published, esclude draft e archived.",
  organicTraffic:
    "Sessioni mensili (ultimi 30gg) provenienti da search organico. Fonte: Google Search Console del sito collegato. Esclude traffico paid, direct e referral.",
  adsenseRevenue:
    "Ricavi AdSense degli ultimi 30 giorni. Mostrati solo se il progetto ha AdSense attivo collegato. Per progetti senza AdSense (es. landing lead-gen pure) il valore è 0 e va interpretato come N/A.",
  seoScore:
    "Indice aggregato 0-100 calcolato come media ponderata: posizionamento keyword principali (40%), site health Lighthouse SEO (30%), backlink profile authority (20%), copertura indexing (10%).",
};
