import {
  Type,
  AlignLeft,
  Image as ImageIcon,
  Images,
  Video,
  Link2,
  Mail,
  Phone as PhoneIcon,
  Hash,
  Calendar,
  ToggleLeft,
  Palette,
  ListChecks,
  Paperclip,
  Database,
  type LucideIcon,
} from "lucide-react";
import type { CMSFieldType } from "@/types";

export type CMSFieldTypeMeta = {
  type: CMSFieldType;
  label: string;
  groupLabel: "Basic" | "Media" | "Contact" | "Numeric" | "Choice" | "Relation";
  icon: LucideIcon;
  defaultValue: () => unknown;
  description: string;
};

export const FIELD_TYPE_REGISTRY: Record<CMSFieldType, CMSFieldTypeMeta> = {
  "plain-text": {
    type: "plain-text",
    label: "Testo semplice",
    groupLabel: "Basic",
    icon: Type,
    defaultValue: () => "",
    description: "Testo a riga singola o multi-riga",
  },
  "rich-text": {
    type: "rich-text",
    label: "Testo formattato",
    groupLabel: "Basic",
    icon: AlignLeft,
    defaultValue: () => "",
    description: "Editor con titoli, liste e link",
  },
  image: {
    type: "image",
    label: "Immagine",
    groupLabel: "Media",
    icon: ImageIcon,
    defaultValue: () => null,
    description: "Una immagine, max 4 MB",
  },
  "multi-image": {
    type: "multi-image",
    label: "Galleria",
    groupLabel: "Media",
    icon: Images,
    defaultValue: () => [],
    description: "Galleria di immagini",
  },
  "video-link": {
    type: "video-link",
    label: "Video",
    groupLabel: "Media",
    icon: Video,
    defaultValue: () => "",
    description: "URL YouTube o Vimeo",
  },
  link: {
    type: "link",
    label: "Link",
    groupLabel: "Basic",
    icon: Link2,
    defaultValue: () => "",
    description: "URL esterno",
  },
  email: {
    type: "email",
    label: "Email",
    groupLabel: "Contact",
    icon: Mail,
    defaultValue: () => "",
    description: "Indirizzo email",
  },
  phone: {
    type: "phone",
    label: "Telefono",
    groupLabel: "Contact",
    icon: PhoneIcon,
    defaultValue: () => "",
    description: "Numero di telefono",
  },
  number: {
    type: "number",
    label: "Numero",
    groupLabel: "Numeric",
    icon: Hash,
    defaultValue: () => 0,
    description: "Intero o decimale",
  },
  datetime: {
    type: "datetime",
    label: "Data / Ora",
    groupLabel: "Numeric",
    icon: Calendar,
    defaultValue: () => null,
    description: "Data o data e ora (ISO 8601)",
  },
  switch: {
    type: "switch",
    label: "Interruttore",
    groupLabel: "Basic",
    icon: ToggleLeft,
    defaultValue: () => false,
    description: "Booleano on/off",
  },
  color: {
    type: "color",
    label: "Colore",
    groupLabel: "Basic",
    icon: Palette,
    defaultValue: () => "#000000",
    description: "Colore (hex / rgb / hsl)",
  },
  option: {
    type: "option",
    label: "Opzione",
    groupLabel: "Choice",
    icon: ListChecks,
    defaultValue: () => "",
    description: "Elenco predefinito (a tendina)",
  },
  file: {
    type: "file",
    label: "File",
    groupLabel: "Media",
    icon: Paperclip,
    defaultValue: () => null,
    description: "PDF, documento o asset generico",
  },
  reference: {
    type: "reference",
    label: "Riferimento",
    groupLabel: "Relation",
    icon: Database,
    defaultValue: () => null,
    description: "Riferimento a un item di un'altra collezione",
  },
  "multi-reference": {
    type: "multi-reference",
    label: "Riferimenti multipli",
    groupLabel: "Relation",
    icon: Database,
    defaultValue: () => [],
    description: "Riferimenti multipli verso una collezione",
  },
};

export const FIELD_GROUP_LABELS_IT: Record<CMSFieldTypeMeta["groupLabel"], string> = {
  Basic: "Base",
  Media: "Media",
  Contact: "Contatti",
  Numeric: "Numeri & Date",
  Choice: "Scelte",
  Relation: "Relazioni",
};

export const ALL_FIELD_TYPES: CMSFieldType[] = Object.keys(
  FIELD_TYPE_REGISTRY,
) as CMSFieldType[];

export function getFieldTypeMeta(type: CMSFieldType): CMSFieldTypeMeta {
  return FIELD_TYPE_REGISTRY[type];
}

export function defaultValueFor(type: CMSFieldType): unknown {
  return FIELD_TYPE_REGISTRY[type].defaultValue();
}
