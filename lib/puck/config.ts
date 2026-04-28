"use client";

import type { Config } from "@measured/puck";
import {
  Hero,
  Section,
  Heading,
  Paragraph,
  ImageBlock,
  ButtonBlock,
  Grid,
  CTA,
  FeatureList,
  PricingCard,
  Testimonial,
  FAQ,
  ContactForm,
  Footer,
  MapEmbed,
} from "./components";

export const puckConfig: Config = {
  components: {
    Hero,
    Section,
    Heading,
    Paragraph,
    Image: ImageBlock,
    Button: ButtonBlock,
    Grid,
    CTA,
    FeatureList,
    PricingCard,
    Testimonial,
    FAQ,
    ContactForm,
    Footer,
    MapEmbed,
  },
  categories: {
    layout: {
      title: "Layout",
      components: ["Section", "Grid", "Footer"],
    },
    content: {
      title: "Contenuto",
      components: ["Heading", "Paragraph", "Image", "Button"],
    },
    sections: {
      title: "Sezioni",
      components: ["Hero", "CTA", "FeatureList", "PricingCard", "Testimonial", "FAQ", "ContactForm", "MapEmbed"],
    },
  },
  root: {
    fields: {
      title: { type: "text", label: "Titolo pagina" },
    },
    defaultProps: { title: "Nuova pagina" },
  },
};
