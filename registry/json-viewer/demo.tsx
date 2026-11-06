"use client";

import { JsonViewer, type JsonValue } from "./json-viewer";

const order: JsonValue = {
  id: "ord_7Kq2",
  status: "requires_review",
  customer: { name: "Mira Hoffmann", email: "mira@example.com", locale: "de-DE" },
  items: [
    { sku: "PLAN-TEAM", name: "Team plan", quantity: 5, price: 18 },
    { sku: "ADDON-SSO", name: "SSO add-on", quantity: 1, price: 40 },
    { sku: "ADDON-AUDIT", name: "Audit log", quantity: 1, price: 25 },
  ],
  totals: { subtotal: 155, tax: 29.45, currency: "EUR" },
  flags: { trial: false, coupon: null },
};

export default function JsonViewerDemo({ variant }: { variant?: string }) {
  return (
    <JsonViewer
      title="get_order"
      data={order}
      view={variant === "Raw" ? "raw" : "tree"}
      defaultDepth={2}
    />
  );
}
