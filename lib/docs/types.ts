export type PropDef = {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
};

export type ComponentDocs = {
  /** How to pass your own data and wire callbacks. */
  usage: string;
  props: PropDef[];
  /** Extra types worth documenting, shown under the props table. */
  types?: string;
};
