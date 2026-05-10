/**
 * CMS types — Webflow-style.
 *
 * Allineato 1:1 al brief soci (foto 5: 16 field types).
 * Mapping naming: kebab-case interno, label IT-friendly esposta in UI via lib/cms/field-types.ts.
 */

export type CMSFieldType =
  | "plain-text"
  | "rich-text"
  | "image"
  | "multi-image"
  | "video-link"
  | "link"
  | "email"
  | "phone"
  | "number"
  | "datetime"
  | "switch"
  | "color"
  | "option"
  | "file"
  | "reference"
  | "multi-reference";

export type CMSValidationRule = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  multiline?: boolean;
};

export type CMSOptionChoice = {
  id: string;
  label: string;
};

export type CMSField = {
  id: string;
  name: string;
  type: CMSFieldType;
  required: boolean;
  helpText?: string;
  isEditable?: boolean;
  validation?: CMSValidationRule;
  referenceCollectionId?: string;
  optionChoices?: CMSOptionChoice[];
};

export type CMSItemStatus =
  | "draft"
  | "queued"
  | "published"
  | "scheduled"
  | "archived";

export type CMSCollectionLimits = {
  maxFields: number;
  maxItems: number;
  maxReferenceFields: number;
};

export const DEFAULT_COLLECTION_LIMITS: CMSCollectionLimits = {
  maxFields: 60,
  maxItems: 5000,
  maxReferenceFields: 20,
};

export type CMSCollection = {
  id: string;
  hashId: string;
  projectId: string;
  name: string;
  displayName: string;
  singularName: string;
  pluralName: string;
  slug: string;
  fields: CMSField[];
  limits?: CMSCollectionLimits;
  createdAt: Date;
  updatedAt?: Date;
};

export type CMSItemFieldData = Record<string, unknown>;

export type CMSItemVersion = {
  id: string;
  snapshotAt: Date;
  data: CMSItemFieldData;
  publishedFromStatus: CMSItemStatus;
};

export type CMSItem = {
  id: string;
  collectionId: string;
  projectId: string;
  status: CMSItemStatus;
  draftData: CMSItemFieldData;
  liveData?: CMSItemFieldData;
  scheduledPublishAt?: Date;
  lastPublishedAt?: Date;
  archivedAt?: Date;
  /**
   * Snapshot history popolata dalla CF `cmsItemOnWrite` su ogni publish.
   * In mock locale il cms-store mantiene gli ultimi 20 snapshot.
   */
  versions?: CMSItemVersion[];
  createdAt: Date;
  updatedAt: Date;
};

export const BAKED_IN_FIELDS: ReadonlyArray<CMSField> = [
  {
    id: "name",
    name: "Name",
    type: "plain-text",
    required: true,
    isEditable: false,
    validation: { maxLength: 256 },
  },
  {
    id: "slug",
    name: "Slug",
    type: "plain-text",
    required: true,
    isEditable: false,
    validation: { maxLength: 256, pattern: "^[a-z0-9-]+$" },
  },
];

export function isReferenceField(type: CMSFieldType): boolean {
  return type === "reference" || type === "multi-reference";
}
