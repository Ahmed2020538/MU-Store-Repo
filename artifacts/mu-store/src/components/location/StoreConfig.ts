import { useState, useEffect } from "react";

export interface StoreContact {
  storeName: string;
  addressEn: string;
  addressAr: string;
  googleMapsUrl: string;
  whatsappNumber: string;
  workingHours: string;
  mapEmbedUrl: string;
}

// Default: MU flagship in Cairo — edit coordinates to match the real address
const CAIRO_EMBED =
  "https://www.openstreetmap.org/export/embed.html?bbox=31.18%2C29.99%2C31.29%2C30.10&layer=mapnik&marker=30.0444%2C31.2357";

const DEFAULT: StoreContact = {
  storeName: "MU Store",
  addressEn: "Cairo, Egypt",
  addressAr: "القاهرة، مصر",
  googleMapsUrl: "https://maps.google.com/?q=MU+Store+Cairo+Egypt",
  whatsappNumber: "201000000000",
  workingHours: "Sun–Thu: 10am–8pm",
  mapEmbedUrl: CAIRO_EMBED,
};

export function useStoreContact(): StoreContact {
  const [data, setData] = useState<StoreContact>(DEFAULT);

  useEffect(() => {
    const cached = sessionStorage.getItem("mu_contact_cfg");
    const merge = (raw: Record<string, unknown>) => ({
      ...DEFAULT,
      storeName: String(raw.storeName ?? DEFAULT.storeName),
      addressEn: String(raw.addressEn ?? DEFAULT.addressEn),
      addressAr: String(raw.addressAr ?? DEFAULT.addressAr),
      googleMapsUrl: String(raw.googleMapsUrl ?? DEFAULT.googleMapsUrl) || DEFAULT.googleMapsUrl,
      whatsappNumber: String(raw.whatsappNumber ?? DEFAULT.whatsappNumber),
      workingHours: String(raw.workingHours ?? DEFAULT.workingHours),
      mapEmbedUrl: CAIRO_EMBED,
    });

    if (cached) { setData(merge(JSON.parse(cached))); return; }

    fetch("/api/settings/contact")
      .then(r => r.json())
      .then(d => { sessionStorage.setItem("mu_contact_cfg", JSON.stringify(d)); setData(merge(d)); })
      .catch(() => {});
  }, []);

  return data;
}
