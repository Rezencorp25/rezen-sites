/**
 * PDF builder per Reports mensili (S8). React-PDF based, server-only.
 * Layout 8 pagine A4 portrait. Branding white-label da ReportPayload.branding.
 */

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import * as React from "react";
import type {
  ReportActionItem,
  ReportAeoSection,
  ReportAishSection,
  ReportGeoSection,
  ReportPayload,
  ReportSeoSection,
} from "./types";

const COLORS = {
  bg: "#FFFFFF",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#E5E7EB",
  surface: "#F9FAFB",
  good: "#10B981",
  bad: "#EF4444",
  warn: "#F59E0B",
  info: "#3B82F6",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    color: COLORS.text,
    fontFamily: "Helvetica",
    backgroundColor: COLORS.bg,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
  },
  pageHeaderText: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pageNum: {
    position: "absolute",
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: COLORS.muted,
  },
  h1: { fontSize: 24, fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 16, fontWeight: 700, marginBottom: 12, marginTop: 4 },
  h3: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  bodyMuted: { fontSize: 9, color: COLORS.muted, lineHeight: 1.4 },
  body: { fontSize: 10, lineHeight: 1.5 },
  // Cover
  cover: {
    flex: 1,
    justifyContent: "space-between",
    padding: 60,
  },
  coverTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  coverHero: { flexGrow: 1, justifyContent: "center" },
  coverTitle: { fontSize: 36, fontWeight: 700, marginBottom: 12 },
  coverSubtitle: { fontSize: 16, color: COLORS.muted },
  coverBrandBar: { height: 6, marginTop: 24, marginBottom: 24 },
  coverFooter: { fontSize: 8, color: COLORS.muted },
  // KPI tile
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 },
  kpiTile: {
    width: "50%",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  kpiTileInner: {
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    padding: 14,
    borderLeftWidth: 4,
  },
  kpiLabel: { fontSize: 8, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  kpiValue: { fontSize: 28, fontWeight: 700 },
  kpiUnit: { fontSize: 12, color: COLORS.muted },
  kpiDelta: { fontSize: 9, marginTop: 4 },
  // Tables
  table: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableHeaderCell: { fontSize: 7, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tableRowLast: { borderBottomWidth: 0 },
  tableCell: { fontSize: 9 },
  // Action items
  action: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  actionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  actionTitle: { fontSize: 11, fontWeight: 700 },
  badge: {
    fontSize: 7,
    fontWeight: 700,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

function PageHeader({ title, period, brand }: { title: string; period: string; brand: string }) {
  return (
    <View style={styles.pageHeader}>
      <Text style={styles.pageHeaderText}>{brand} · Report {period}</Text>
      <Text style={styles.pageHeaderText}>{title}</Text>
    </View>
  );
}

function Cover({ payload }: { payload: ReportPayload }) {
  return (
    <Page size="A4" style={[styles.page, styles.cover]}>
      <View style={styles.coverTop}>
        {payload.branding.logoUrl ? (
          <Image src={payload.branding.logoUrl} style={{ height: 40, objectFit: "contain" }} />
        ) : (
          <Text style={{ fontSize: 14, fontWeight: 700, color: payload.branding.primaryColor }}>
            {payload.branding.brandName}
          </Text>
        )}
        <Text style={styles.bodyMuted}>{payload.period.label}</Text>
      </View>

      <View style={styles.coverHero}>
        <Text style={styles.bodyMuted}>SEARCH & AI VISIBILITY REPORT</Text>
        <View style={[styles.coverBrandBar, { backgroundColor: payload.branding.primaryColor }]} />
        <Text style={styles.coverTitle}>{payload.branding.brandName}</Text>
        <Text style={styles.coverSubtitle}>{payload.domain}</Text>
        <Text style={[styles.coverSubtitle, { marginTop: 8 }]}>{payload.period.label}</Text>
      </View>

      <View>
        <Text style={styles.coverFooter}>
          Powered by REZEN Sites · Generato il{" "}
          {payload.generatedAt.toLocaleDateString("it-IT")}
        </Text>
      </View>
    </Page>
  );
}

function KpiTile({
  label,
  value,
  unit,
  delta,
  accent,
}: {
  label: string;
  value: number | string;
  unit?: string;
  delta: number | null;
  accent: string;
}) {
  return (
    <View style={styles.kpiTile}>
      <View style={[styles.kpiTileInner, { borderLeftColor: accent }]}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text>
          <Text style={styles.kpiValue}>{value}</Text>
          {unit && <Text style={styles.kpiUnit}>{unit}</Text>}
        </Text>
        {delta !== null && (
          <Text
            style={[
              styles.kpiDelta,
              { color: delta > 0 ? COLORS.good : delta < 0 ? COLORS.bad : COLORS.muted },
            ]}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} {delta > 0 ? "+" : ""}
            {delta} vs mese precedente
          </Text>
        )}
      </View>
    </View>
  );
}

function ExecutiveSummary({ payload }: { payload: ReportPayload }) {
  const { kpi } = payload;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Executive Summary" period={payload.period.label} brand={payload.branding.brandName} />
      <Text style={styles.h2}>Performance del mese</Text>
      <Text style={[styles.bodyMuted, { marginBottom: 16 }]}>
        Sintesi cross-modulo dei 4 KPI chiave: SEO Authority, Visibility organico, AI Visibility multi-LLM,
        Brand Sentiment AI. Le delta confrontano questo periodo con il mese precedente.
      </Text>

      <View style={styles.kpiGrid}>
        <KpiTile
          label="VF Authority Score"
          value={kpi.authorityScore}
          unit=" /100"
          delta={kpi.authorityDelta}
          accent={payload.branding.primaryColor}
        />
        <KpiTile
          label="SEO Visibility"
          value={kpi.visibilityScore.toFixed(1)}
          unit=" %"
          delta={kpi.visibilityDelta}
          accent={COLORS.info}
        />
        <KpiTile
          label="AI Visibility (4 LLM)"
          value={kpi.aiVisibilityScore.toFixed(1)}
          unit=" /100"
          delta={kpi.aiVisibilityDelta}
          accent={COLORS.good}
        />
        <KpiTile
          label="AI Brand Sentiment"
          value={kpi.brandSentiment > 0 ? `+${kpi.brandSentiment}` : `${kpi.brandSentiment}`}
          unit="  / -100,+100"
          delta={kpi.brandSentimentDelta}
          accent={kpi.brandSentiment >= 0 ? COLORS.good : COLORS.bad}
        />
      </View>

      <View style={{ marginTop: 24, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6 }}>
        <Text style={styles.h3}>Cosa contiene questo report</Text>
        <Text style={styles.body}>
          Le pagine seguenti analizzano in dettaglio: SEO classico (authority, ranking, traffico), AEO
          (presenza in SERP feature Google), GEO (visibilità su ChatGPT/Claude/Perplexity/Gemini), AI Search
          Health (leggibilità del sito da parte dei bot LLM) e una lista di azioni concrete priorizzate.
        </Text>
      </View>
      <Text style={styles.pageNum}>2</Text>
    </Page>
  );
}

function SeoPage({ payload, seo }: { payload: ReportPayload; seo: ReportSeoSection }) {
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="SEO Performance" period={payload.period.label} brand={payload.branding.brandName} />
      <Text style={styles.h2}>SEO · Authority & Ranking</Text>

      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <View style={{ flex: 1, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6, marginRight: 8 }}>
          <Text style={styles.kpiLabel}>VerumFlow Authority</Text>
          <Text style={styles.kpiValue}>{seo.authority.score}</Text>
          <Text style={styles.bodyMuted}>0-100 · formula: 0.55×LinkPower + 0.30×Traffic + 0.15×NaturalProfile</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.body}>LinkPower: <Text style={{ fontWeight: 700 }}>{seo.authority.linkPower}</Text></Text>
            <Text style={styles.body}>Traffic: <Text style={{ fontWeight: 700 }}>{seo.authority.traffic}</Text></Text>
            <Text style={styles.body}>Natural Profile: <Text style={{ fontWeight: 700 }}>{seo.authority.naturalProfile}</Text></Text>
          </View>
        </View>
        <View style={{ flex: 1, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6 }}>
          <Text style={styles.kpiLabel}>Visibility</Text>
          <Text style={styles.kpiValue}>{seo.visibilityPercent.toFixed(1)}%</Text>
          <Text style={styles.bodyMuted}>Stima curve CTR settoriali</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.body}>Click stimati: <Text style={{ fontWeight: 700 }}>{seo.estimatedTrafficClicks}</Text> /mese</Text>
            <Text style={styles.body}>Top 3: <Text style={{ fontWeight: 700 }}>{seo.distribution.top3}</Text> kw</Text>
            <Text style={styles.body}>Top 10: <Text style={{ fontWeight: 700 }}>{seo.distribution.top10}</Text> kw</Text>
            <Text style={styles.body}>Top 100: <Text style={{ fontWeight: 700 }}>{seo.distribution.top100}</Text> kw</Text>
          </View>
        </View>
      </View>

      <Text style={styles.h3}>Top {seo.topKeywords.length} keyword per click stimati</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={{ flex: 4 }}><Text style={styles.tableHeaderCell}>KEYWORD</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>VOL/MO</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>POS</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>CLICK</Text></View>
        </View>
        {seo.topKeywords.map((k, i) => (
          <View
            key={k.keyword}
            style={[styles.tableRow, i === seo.topKeywords.length - 1 ? styles.tableRowLast : {}]}
          >
            <View style={{ flex: 4 }}><Text style={styles.tableCell}>{k.keyword}</Text></View>
            <View style={{ flex: 1 }}><Text style={[styles.tableCell, { textAlign: "right" }]}>{k.searchVolume.toLocaleString("it-IT")}</Text></View>
            <View style={{ flex: 1 }}><Text style={[styles.tableCell, { textAlign: "right", fontWeight: 700 }]}>{k.position}</Text></View>
            <View style={{ flex: 1 }}><Text style={[styles.tableCell, { textAlign: "right" }]}>{k.estimatedClicks}</Text></View>
          </View>
        ))}
      </View>
      <Text style={styles.pageNum}>3</Text>
    </Page>
  );
}

function AeoPage({ payload, aeo }: { payload: ReportPayload; aeo: ReportAeoSection }) {
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="AEO · Answer Engine" period={payload.period.label} brand={payload.branding.brandName} />
      <Text style={styles.h2}>AEO · SERP Feature & Google AI Overviews</Text>

      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <View style={{ flex: 1, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6, marginRight: 8 }}>
          <Text style={styles.kpiLabel}>AEO Score</Text>
          <Text style={styles.kpiValue}>{aeo.aeoScore}</Text>
          <Text style={styles.bodyMuted}>/100 · % keyword in feature SERP</Text>
        </View>
        <View style={{ flex: 1, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6 }}>
          <Text style={styles.kpiLabel}>Feature di proprietà</Text>
          <Text style={styles.kpiValue}>{aeo.ownedFeatures}</Text>
          <Text style={styles.bodyMuted}>AI Overview / Snippet / PAA dove sei la fonte citata</Text>
        </View>
      </View>

      <Text style={styles.h3}>Mix SERP feature</Text>
      <View style={[styles.table, { marginBottom: 16 }]}>
        <View style={styles.tableHeader}>
          <View style={{ flex: 3 }}><Text style={styles.tableHeaderCell}>FEATURE</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>KEYWORD</Text></View>
        </View>
        {([
          ["AI Overview", aeo.serpFeatures.aiOverview],
          ["Featured Snippet", aeo.serpFeatures.featuredSnippet],
          ["People Also Ask", aeo.serpFeatures.paa],
          ["Knowledge Panel", aeo.serpFeatures.knowledgePanel],
        ] as Array<[string, number]>).map(([label, n], i, arr) => (
          <View key={label} style={[styles.tableRow, i === arr.length - 1 ? styles.tableRowLast : {}]}>
            <View style={{ flex: 3 }}><Text style={styles.tableCell}>{label}</Text></View>
            <View style={{ flex: 1 }}><Text style={[styles.tableCell, { textAlign: "right", fontWeight: 700 }]}>{n}</Text></View>
          </View>
        ))}
      </View>

      <Text style={styles.h3}>Top {aeo.topOpportunities.length} opportunità</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={{ flex: 4 }}><Text style={styles.tableHeaderCell}>KEYWORD</Text></View>
          <View style={{ flex: 2 }}><Text style={styles.tableHeaderCell}>FEATURE</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>EFFORT</Text></View>
        </View>
        {aeo.topOpportunities.map((o, i) => (
          <View key={`${o.keyword}-${i}`} style={[styles.tableRow, i === aeo.topOpportunities.length - 1 ? styles.tableRowLast : {}]}>
            <View style={{ flex: 4 }}><Text style={styles.tableCell}>{o.keyword}</Text></View>
            <View style={{ flex: 2 }}><Text style={styles.tableCell}>{o.feature}</Text></View>
            <View style={{ flex: 1 }}><Text style={[styles.tableCell, { textAlign: "right", textTransform: "uppercase", color: o.effort === "low" ? COLORS.good : o.effort === "medium" ? COLORS.warn : COLORS.bad }]}>{o.effort}</Text></View>
          </View>
        ))}
      </View>
      <Text style={styles.pageNum}>4</Text>
    </Page>
  );
}

function GeoPage({ payload, geo }: { payload: ReportPayload; geo: ReportGeoSection }) {
  const sentTone =
    geo.sentimentScore >= 30 ? COLORS.good : geo.sentimentScore >= 0 ? COLORS.info : geo.sentimentScore >= -30 ? COLORS.warn : COLORS.bad;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="GEO · LLM Visibility" period={payload.period.label} brand={payload.branding.brandName} />
      <Text style={styles.h2}>GEO · Visibilità su ChatGPT, Claude, Perplexity, Gemini</Text>

      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <View style={{ flex: 1, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6, marginRight: 8 }}>
          <Text style={styles.kpiLabel}>AI Visibility Score</Text>
          <Text style={styles.kpiValue}>{geo.visibilityScore.toFixed(1)}</Text>
          <Text style={styles.bodyMuted}>media dei 4 LLM</Text>
        </View>
        <View style={{ flex: 1, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6, marginRight: 8 }}>
          <Text style={styles.kpiLabel}>Brand Sentiment</Text>
          <Text style={[styles.kpiValue, { color: sentTone }]}>
            {geo.sentimentScore > 0 ? `+${geo.sentimentScore}` : geo.sentimentScore}
          </Text>
          <Text style={styles.bodyMuted}>
            {geo.sentimentDistribution.positive}+ / {geo.sentimentDistribution.neutral}= / {geo.sentimentDistribution.negative}-
          </Text>
        </View>
        <View style={{ flex: 1, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6 }}>
          <Text style={styles.kpiLabel}>Citation Rate</Text>
          <Text style={styles.kpiValue}>{geo.citationRate.toFixed(1)}%</Text>
          <Text style={styles.bodyMuted}>{geo.totalCitations}/{geo.totalMentions} con link · target ≥40%</Text>
        </View>
      </View>

      <Text style={styles.h3}>Score per LLM</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={{ flex: 3 }}><Text style={styles.tableHeaderCell}>LLM</Text></View>
          <View style={{ flex: 2 }}><Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>SCORE</Text></View>
          <View style={{ flex: 2 }}><Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>MENTION</Text></View>
        </View>
        {geo.perLlm.map((l, i) => (
          <View key={l.llm} style={[styles.tableRow, i === geo.perLlm.length - 1 ? styles.tableRowLast : {}]}>
            <View style={{ flex: 3 }}><Text style={styles.tableCell}>{l.llm}</Text></View>
            <View style={{ flex: 2 }}><Text style={[styles.tableCell, { textAlign: "right", fontWeight: 700 }]}>{l.score}/100</Text></View>
            <View style={{ flex: 2 }}><Text style={[styles.tableCell, { textAlign: "right" }]}>{l.mentioned}/{l.total}</Text></View>
          </View>
        ))}
      </View>
      <Text style={styles.pageNum}>5</Text>
    </Page>
  );
}

function AishPage({ payload, aish }: { payload: ReportPayload; aish: ReportAishSection }) {
  const allowed = aish.bots.filter((b) => b.status === "allowed").length;
  const blocked = aish.bots.filter((b) => b.status === "blocked").length;
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="AI Search Health" period={payload.period.label} brand={payload.branding.brandName} />
      <Text style={styles.h2}>AI Search Health · Leggibilità da parte dei bot LLM</Text>

      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        <View style={{ flex: 1, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6, marginRight: 8 }}>
          <Text style={styles.kpiLabel}>Score</Text>
          <Text style={styles.kpiValue}>{aish.score}</Text>
          <Text style={styles.bodyMuted}>0-100 · combina robots, sitemap, meta, llms.txt</Text>
        </View>
        <View style={{ flex: 1, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6, marginRight: 8 }}>
          <Text style={styles.kpiLabel}>Bot allowed</Text>
          <Text style={[styles.kpiValue, { color: COLORS.good }]}>{allowed}<Text style={styles.kpiUnit}>/{aish.bots.length}</Text></Text>
        </View>
        <View style={{ flex: 1, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6 }}>
          <Text style={styles.kpiLabel}>Bot bloccati</Text>
          <Text style={[styles.kpiValue, { color: blocked > 0 ? COLORS.bad : COLORS.muted }]}>{blocked}</Text>
        </View>
      </View>

      <Text style={styles.h3}>Stato per bot</Text>
      <View style={[styles.table, { marginBottom: 16 }]}>
        <View style={styles.tableHeader}>
          <View style={{ flex: 4 }}><Text style={styles.tableHeaderCell}>BOT</Text></View>
          <View style={{ flex: 2 }}><Text style={[styles.tableHeaderCell, { textAlign: "right" }]}>STATUS</Text></View>
        </View>
        {aish.bots.map((b, i) => {
          const tone =
            b.status === "allowed" ? COLORS.good : b.status === "blocked" ? COLORS.bad : b.status === "partial" ? COLORS.warn : COLORS.muted;
          return (
            <View key={b.bot} style={[styles.tableRow, i === aish.bots.length - 1 ? styles.tableRowLast : {}]}>
              <View style={{ flex: 4 }}><Text style={styles.tableCell}>{b.bot}</Text></View>
              <View style={{ flex: 2 }}><Text style={[styles.tableCell, { textAlign: "right", textTransform: "uppercase", fontWeight: 700, color: tone }]}>{b.status}</Text></View>
            </View>
          );
        })}
      </View>

      {aish.warnings.length > 0 && (
        <>
          <Text style={styles.h3}>Warnings ({aish.warnings.length})</Text>
          {aish.warnings.slice(0, 5).map((w, i) => {
            const tone = w.severity === "critical" ? COLORS.bad : w.severity === "warning" ? COLORS.warn : COLORS.info;
            return (
              <View key={`${w.severity}-${i}`} style={{ flexDirection: "row", marginBottom: 4 }}>
                <Text style={{ color: tone, fontWeight: 700, marginRight: 6 }}>•</Text>
                <Text style={styles.body}>{w.message}</Text>
              </View>
            );
          })}
        </>
      )}
      <Text style={styles.pageNum}>6</Text>
    </Page>
  );
}

function ActionsPage({ payload, actions }: { payload: ReportPayload; actions: ReportActionItem[] }) {
  const sevColor = { high: COLORS.bad, medium: COLORS.warn, low: COLORS.info };
  const sevLabel = { high: "HIGH", medium: "MEDIUM", low: "LOW" };
  const effLabel = { low: "LOW EFFORT", medium: "MEDIUM EFFORT", high: "HIGH EFFORT" };
  const srcLabel = { seo: "SEO", aeo: "AEO", geo: "GEO", aish: "AI SEARCH" };

  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Action Items" period={payload.period.label} brand={payload.branding.brandName} />
      <Text style={styles.h2}>Top {actions.length} azioni concrete del mese</Text>
      <Text style={[styles.bodyMuted, { marginBottom: 12 }]}>
        Selezionate per impatto stimato (severity × inverse effort). Eseguibili sul sito senza modifiche backend.
      </Text>

      {actions.length === 0 ? (
        <View style={{ padding: 14, backgroundColor: COLORS.surface, borderRadius: 6 }}>
          <Text style={styles.body}>Nessuna azione critica per questo periodo. Il sito performa bene in tutti i moduli.</Text>
        </View>
      ) : (
        actions.map((a, i) => (
          <View key={i} style={[styles.action, { borderLeftColor: sevColor[a.severity] }]}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <View style={{ flexDirection: "row" }}>
                <Text style={[styles.badge, { backgroundColor: sevColor[a.severity] + "20", color: sevColor[a.severity], marginRight: 4 }]}>
                  {srcLabel[a.source]} · {sevLabel[a.severity]}
                </Text>
                <Text style={[styles.badge, { backgroundColor: COLORS.border, color: COLORS.text }]}>
                  {effLabel[a.effort]}
                </Text>
              </View>
            </View>
            <Text style={styles.body}>{a.detail}</Text>
          </View>
        ))
      )}
      <Text style={styles.pageNum}>7</Text>
    </Page>
  );
}

function FooterPage({ payload }: { payload: ReportPayload }) {
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="Legenda & Risorse" period={payload.period.label} brand={payload.branding.brandName} />
      <Text style={styles.h2}>Glossario metriche</Text>

      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h3}>VerumFlow Authority Score (0-100)</Text>
        <Text style={styles.body}>
          Score composito SEO: 0.55 × LinkPower (Domain Rank DataForSEO) + 0.30 × Traffic (ETV stimato) + 0.15 × Natural Profile
          (referring domains - spam score).
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h3}>SEO Visibility (%)</Text>
        <Text style={styles.body}>
          Stima della % di click totali catturati. Calcolata su curve CTR settoriali aggiustate per SERP feature
          (AI Overview ×0.6, Featured Snippet ×0.7, Ads pack ×0.8).
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h3}>AI Visibility Score (0-100)</Text>
        <Text style={styles.body}>
          Media dei 4 score per-LLM (ChatGPT, Perplexity, Gemini, Claude). Score per-LLM = % query in cui il brand
          è citato nella risposta. Cadenza fetch settimanale.
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h3}>AI Brand Sentiment (-100, +100)</Text>
        <Text style={styles.body}>
          Aggregato cross-LLM del sentiment delle mention del brand. Score = (positive - negative) / total × 100.
          Sotto 0 indica reputation a rischio.
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h3}>Citation Rate (%)</Text>
        <Text style={styles.body}>
          % delle mention che includono link cliccabile (citation) vs solo testo. Citation porta traffico
          diretto, mention testuale solo brand awareness. Target ≥40%.
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={styles.h3}>AI Search Health (0-100)</Text>
        <Text style={styles.body}>
          Misura quanto i 11 bot LLM principali (GPTBot, ClaudeBot, PerplexityBot, Google-Extended ecc.)
          possono leggere il sito. Combina robots.txt, sitemap.xml, meta noai/noimageai, llms.txt.
        </Text>
      </View>

      <View style={{ marginTop: 24, padding: 14, backgroundColor: COLORS.surface, borderRadius: 6 }}>
        <Text style={styles.bodyMuted}>
          Dashboard live con dettagli drill-down e dati aggiornati settimanalmente:{"\n"}
          rezen-sites.app / projects / {payload.projectId}
        </Text>
        <Text style={[styles.bodyMuted, { marginTop: 8 }]}>
          Powered by REZEN Sites · VerumFlow · {payload.generatedAt.getFullYear()}
        </Text>
      </View>
      <Text style={styles.pageNum}>8</Text>
    </Page>
  );
}

function ReportDocument({ payload }: { payload: ReportPayload }) {
  return (
    <Document
      title={`REZEN Report — ${payload.branding.brandName} ${payload.period.label}`}
      author="REZEN Sites"
      creator="REZEN Sites · VerumFlow"
    >
      <Cover payload={payload} />
      <ExecutiveSummary payload={payload} />
      {payload.seo && <SeoPage payload={payload} seo={payload.seo} />}
      {payload.aeo && <AeoPage payload={payload} aeo={payload.aeo} />}
      {payload.geo && <GeoPage payload={payload} geo={payload.geo} />}
      {payload.aish && <AishPage payload={payload} aish={payload.aish} />}
      <ActionsPage payload={payload} actions={payload.actions} />
      <FooterPage payload={payload} />
    </Document>
  );
}

/**
 * Renderizza il PDF in Buffer Node. Usato dalle Cloud Functions per upload Storage.
 */
export async function renderReportPdf(payload: ReportPayload): Promise<Buffer> {
  const instance = pdf(<ReportDocument payload={payload} />);
  const stream = await instance.toBuffer();
  // @react-pdf/renderer toBuffer ritorna NodeJS.ReadableStream — converto in Buffer
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks);
}
