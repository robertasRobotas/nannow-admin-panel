import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { TrackingPin, TrackingPoint } from "@/types/Tracking";
import { getOrderStatusTitle } from "@/data/orderStatusOptions";

type LeafletMarkerState = {
  marker: LeafletLayer;
  popupHtml: string;
  styleKey: string;
};

type LeafletLayer = {
  setLatLng: (latLng: [number, number]) => void;
  bindPopup: (html: string) => LeafletLayer;
  openPopup?: () => void;
};

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => LeafletMap;
  fitBounds: (
    bounds: [number, number][],
    options?: { padding?: [number, number] },
  ) => LeafletMap;
  panTo: (center: [number, number]) => LeafletMap;
  getZoom: () => number;
  on: (eventName: string, handler: () => void) => LeafletMap;
  off: (eventName: string, handler: () => void) => LeafletMap;
  removeLayer: (layer: LeafletLayer) => void;
  remove: () => void;
};

type LeafletApi = {
  map: (container: HTMLElement) => LeafletMap;
  tileLayer: (
    urlTemplate: string,
    options: { maxZoom: number; attribution: string },
  ) => { addTo: (map: LeafletMap) => void };
  marker: (
    latLng: [number, number],
    options?: { icon?: unknown },
  ) => { addTo: (map: LeafletMap) => LeafletLayer };
  divIcon: (options: {
    className?: string;
    html: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
  }) => unknown;
  circleMarker: (
    latLng: [number, number],
    options: {
      radius: number;
      color: string;
      fillColor: string;
      fillOpacity: number;
      weight: number;
    },
  ) => { addTo: (map: LeafletMap) => LeafletLayer };
};

type OsmMapProps = {
  pins?: TrackingPin[];
  focusPoint?: TrackingPoint | null;
  focusLabel?: string;
  height?: number | string;
  zoom?: number;
};

const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const FALLBACK_AVATAR_URL = "/nannow-icon-black-64x64.svg";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const ensureLeafletLoaded = async (): Promise<LeafletApi | null> => {
  if (typeof window === "undefined") return null;
  const browserWindow = window as typeof window & { L?: LeafletApi };
  if (browserWindow.L) return browserWindow.L;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-leaflet='true']`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("leaflet-load-error")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS_URL;
    script.async = true;
    script.dataset.leaflet = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("leaflet-load-error"));
    document.body.appendChild(script);
  });

  return browserWindow.L ?? null;
};

const getPinPopupHtml = (pin: TrackingPin) => {
  if (pin.kind === "ORDER") {
    const avatarUrl = escapeHtml(pin.avatarUrl || FALLBACK_AVATAR_URL);
    const statusRaw = pin.orderStatus ?? "UNKNOWN";
    const statusTitle = getOrderStatusTitle(statusRaw, false);
    const startsAt = pin.orderStartsAt
      ? new Date(pin.orderStartsAt).toLocaleString()
      : "-";
    const endsAt = pin.orderEndsAt
      ? new Date(pin.orderEndsAt).toLocaleString()
      : "-";
    const totalPrice =
      typeof pin.orderTotalPrice === "number"
        ? `€${pin.orderTotalPrice.toFixed(2)}`
        : "-";
    const orderLink = pin.profileUrl
      ? `<a href="${escapeHtml(pin.profileUrl)}" style="margin-top:6px;color:#111827;font-size:12px;font-weight:700;text-decoration:underline;display:inline-block;">Open order</a>`
      : "";

    return `
      <div style="display:flex;gap:8px;align-items:flex-start;min-width:220px;">
        <img
          src="${avatarUrl}"
          alt=""
          style="width:34px;height:34px;border-radius:999px;object-fit:cover;border:1px solid #e5e7eb;flex-shrink:0;"
          onerror="this.onerror=null;this.src='${FALLBACK_AVATAR_URL}';"
        />
        <div style="display:grid;gap:3px;">
          <strong style="font-size:13px;line-height:1.2;">${escapeHtml(pin.label)}</strong>
          <div style="color:#6b7280;font-size:12px;">${startsAt} - ${endsAt}</div>
          <div style="font-size:12px;">Total: <strong>${totalPrice}</strong></div>
          <div style="font-size:12px;">Status: <strong>${escapeHtml(statusTitle)}</strong></div>
          ${orderLink}
        </div>
      </div>
    `;
  }

  const subtitle = pin.subtitle
    ? `<div style="color:#6b7280;font-size:12px;">${escapeHtml(pin.subtitle)}</div>`
    : "";
  const avatarUrl = escapeHtml(pin.avatarUrl || FALLBACK_AVATAR_URL);
  const profileLink = pin.profileUrl
    ? `<a href="${escapeHtml(pin.profileUrl)}" style="margin-top:6px;color:#111827;font-size:12px;font-weight:700;text-decoration:underline;display:inline-block;">Open profile</a>`
    : "";

  return `
    <div style="display:flex;gap:8px;align-items:flex-start;min-width:180px;">
      <img
        src="${avatarUrl}"
        alt=""
        style="width:32px;height:32px;border-radius:999px;object-fit:cover;border:1px solid #e5e7eb;flex-shrink:0;"
        onerror="this.onerror=null;this.src='${FALLBACK_AVATAR_URL}';"
      />
      <div style="display:grid;gap:2px;">
        <strong style="font-size:13px;line-height:1.2;">${escapeHtml(pin.label)}</strong>
        <div style="font-size:11px;font-weight:700;color:${pin.kind === "PROVIDER" ? "#1d4ed8" : "#15803d"}">${pin.kind}</div>
        ${subtitle}
        ${profileLink}
      </div>
    </div>
  `;
};

const getPinPalette = (pin: TrackingPin) => {
  if (pin.kind === "PROVIDER") {
    return {
      stroke: "#1e3a8a",
      fill: "#2563eb",
    };
  }
  if (pin.kind === "LAST_KNOWN_PROVIDER") {
    return {
      stroke: "#991b1b",
      fill: "#ef4444",
    };
  }
  if (pin.kind === "CLIENT") {
    return {
      stroke: "#14532d",
      fill: "#22c55e",
    };
  }

  const status = String(pin.orderStatus ?? "").toUpperCase();
  if (status === "PROVIDER_MARKED_AS_SERVICE_IN_PROGRESS") {
    return { stroke: "#155e75", fill: "#06b6d4" };
  }
  if (status === "NOT_STARTED_IN_TIME" || status === "NOT_ENDED_IN_TIME") {
    return { stroke: "#991b1b", fill: "#ef4444" };
  }
  if (status === "ORDER_CREATED" || status === "PROVIDER_OFFERED_SERVICE") {
    return { stroke: "#854d0e", fill: "#eab308" };
  }
  if (
    status === "BOTH_APPROVED" ||
    status === "PROVIDER_ACCEPTED_DIRECT_OFFER"
  ) {
    return { stroke: "#9a3412", fill: "#f97316" };
  }
  return { stroke: "#374151", fill: "#6b7280" };
};

const getOrderPinStyleKey = (pin: TrackingPin) =>
  String(pin.orderStatus ?? "").toUpperCase();

const getFocusPopupHtml = (label: string, point: TrackingPoint) => {
  const accuracy =
    typeof point.accuracy === "number"
      ? `<div>Accuracy: ${point.accuracy}m</div>`
      : "";
  const timestamp = point.timestamp
    ? `<div>${new Date(point.timestamp).toLocaleString()}</div>`
    : "";
  return `<div><strong>${label}</strong>${accuracy}${timestamp}</div>`;
};

const OsmMap = ({
  pins = [],
  focusPoint,
  focusLabel = "Live provider location",
  height = 560,
  zoom = 12,
}: OsmMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<Map<string, LeafletMarkerState>>(new Map());
  const focusMarkerRef = useRef<LeafletLayer | null>(null);
  const lastAutoFitSignatureRef = useRef("");
  const [mapReadyTick, setMapReadyTick] = useState(0);
  const [currentZoom, setCurrentZoom] = useState(zoom);

  const normalizedPins = useMemo(
    () =>
      pins.filter(
        (pin) =>
          Number.isFinite(pin.latitude) &&
          Number.isFinite(pin.longitude) &&
          Math.abs(pin.latitude) <= 90 &&
          Math.abs(pin.longitude) <= 180,
      ),
    [pins],
  );

  const renderedPins = useMemo(() => {
    const nonOrderPins = normalizedPins.filter((pin) => pin.kind !== "ORDER");
    const orderPins = normalizedPins.filter((pin) => pin.kind === "ORDER");

    if (currentZoom >= 15) {
      const grouped = new Map<string, TrackingPin[]>();
      orderPins.forEach((pin) => {
        const key = `${pin.latitude.toFixed(6)}:${pin.longitude.toFixed(6)}`;
        const current = grouped.get(key);
        if (current) {
          current.push(pin);
        } else {
          grouped.set(key, [pin]);
        }
      });

      const spread: TrackingPin[] = [];
      grouped.forEach((items) => {
        if (items.length === 1) {
          spread.push(items[0]);
          return;
        }
        const step = (2 * Math.PI) / items.length;
        const radius = 0.00018;
        items.forEach((pin, index) => {
          const angle = index * step;
          spread.push({
            ...pin,
            latitude: pin.latitude + radius * Math.sin(angle),
            longitude: pin.longitude + radius * Math.cos(angle),
          });
        });
      });

      return [...nonOrderPins, ...spread];
    }

    const grouped = new Map<string, TrackingPin[]>();
    orderPins.forEach((pin) => {
      const key = `${pin.latitude.toFixed(4)}:${pin.longitude.toFixed(4)}`;
      const current = grouped.get(key);
      if (current) {
        current.push(pin);
      } else {
        grouped.set(key, [pin]);
      }
    });

    const aggregatedOrders: TrackingPin[] = [];
    grouped.forEach((items, key) => {
      if (items.length === 1) {
        aggregatedOrders.push(items[0]);
        return;
      }
      const first = items[0];
      aggregatedOrders.push({
        ...first,
        id: `ORDER_GROUP:${key}`,
        label: `${items.length} active orders`,
        subtitle: "Zoom in to split pins",
        profileUrl: undefined,
        orderCount: items.length,
      });
    });

    return [...nonOrderPins, ...aggregatedOrders];
  }, [currentZoom, normalizedPins]);

  useEffect(() => {
    let isUnmounted = false;

    const init = async () => {
      const L = await ensureLeafletLoaded();
      if (!L || isUnmounted || !mapContainerRef.current || mapRef.current)
        return;

      mapRef.current = L.map(mapContainerRef.current).setView(
        [54.6872, 25.2797],
        zoom,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
      const onZoomEnd = () => {
        if (!mapRef.current) return;
        setCurrentZoom(mapRef.current.getZoom());
      };
      mapRef.current.on("zoomend", onZoomEnd);
      setCurrentZoom(mapRef.current.getZoom());
      setMapReadyTick((prev) => prev + 1);
    };

    void init();

    return () => {
      isUnmounted = true;
      const map = mapRef.current;
      if (map) {
        map.remove();
        mapRef.current = null;
      }
      markerLayerRef.current.clear();
      focusMarkerRef.current = null;
    };
  }, [zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as typeof window & { L?: LeafletApi }).L;
    if (!map || !L) return;

    const nextIds = new Set(renderedPins.map((pin) => pin.id));

    markerLayerRef.current.forEach((state, id) => {
      if (!nextIds.has(id)) {
        map.removeLayer(state.marker);
        markerLayerRef.current.delete(id);
      }
    });

    renderedPins.forEach((pin) => {
      const popupHtml = getPinPopupHtml(pin);
      const styleKey =
        pin.kind === "ORDER" ? getOrderPinStyleKey(pin) : pin.kind;
      const existing = markerLayerRef.current.get(pin.id);
      if (existing) {
        existing.marker.setLatLng([pin.latitude, pin.longitude]);
        if (
          existing.popupHtml !== popupHtml ||
          existing.styleKey !== styleKey
        ) {
          map.removeLayer(existing.marker);
          markerLayerRef.current.delete(pin.id);
        } else {
          return;
        }
      }

      if (!markerLayerRef.current.has(pin.id)) {
        const palette = getPinPalette(pin);
        const isAttentionOrder =
          pin.kind === "ORDER" &&
          (styleKey === "NOT_STARTED_IN_TIME" ||
            styleKey === "NOT_ENDED_IN_TIME");

        const marker =
          pin.kind === "ORDER"
            ? L.marker([pin.latitude, pin.longitude], {
                icon: L.divIcon({
                  className: "order-pin-icon",
                  html:
                    typeof pin.orderCount === "number" && pin.orderCount > 1
                      ? `<div class="${isAttentionOrder ? "order-pin-blink" : ""}" style="min-width:26px;height:26px;padding:0 6px;border-radius:6px;border:3px solid ${palette.stroke};background:${palette.fill};box-shadow:0 1px 4px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#111827;">${pin.orderCount}</div>`
                      : `<div class="${isAttentionOrder ? "order-pin-blink" : ""}" style="width:16px;height:16px;border-radius:3px;border:3px solid ${palette.stroke};background:${palette.fill};box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
                  iconSize:
                    typeof pin.orderCount === "number" && pin.orderCount > 1
                      ? [26, 26]
                      : [16, 16],
                  iconAnchor:
                    typeof pin.orderCount === "number" && pin.orderCount > 1
                      ? [13, 13]
                      : [8, 8],
                  popupAnchor:
                    typeof pin.orderCount === "number" && pin.orderCount > 1
                      ? [0, -13]
                      : [0, -8],
                }),
              }).addTo(map)
            : L.circleMarker([pin.latitude, pin.longitude], {
                radius: 10,
                color: palette.stroke,
                fillColor: palette.fill,
                fillOpacity: 0.95,
                weight: 3,
              }).addTo(map);
        marker.bindPopup(popupHtml);
        markerLayerRef.current.set(pin.id, { marker, popupHtml, styleKey });
      }
    });

    const sourcePinsSignature = normalizedPins
      .map(
        (pin) =>
          `${pin.id}:${pin.latitude.toFixed(6)}:${pin.longitude.toFixed(6)}`,
      )
      .sort()
      .join("|");
    const focusSignature = focusPoint
      ? `${focusPoint.latitude.toFixed(6)}:${focusPoint.longitude.toFixed(6)}`
      : "";
    const nextAutoFitSignature = `${sourcePinsSignature}::${focusSignature}`;
    const shouldAutoFit =
      lastAutoFitSignatureRef.current !== nextAutoFitSignature;

    if (shouldAutoFit) {
      lastAutoFitSignatureRef.current = nextAutoFitSignature;
      const bounds: [number, number][] = renderedPins.map((pin) => [
        pin.latitude,
        pin.longitude,
      ]);
      if (focusPoint) {
        bounds.push([focusPoint.latitude, focusPoint.longitude]);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [32, 32] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], zoom);
      }
    }
  }, [renderedPins, normalizedPins, focusPoint, zoom, mapReadyTick]);

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as typeof window & { L?: LeafletApi }).L;
    if (!map || !L) return;

    if (!focusPoint) {
      if (focusMarkerRef.current) {
        map.removeLayer(focusMarkerRef.current);
        focusMarkerRef.current = null;
      }
      return;
    }

    const popupHtml = getFocusPopupHtml(focusLabel, focusPoint);

    if (!focusMarkerRef.current) {
      focusMarkerRef.current = L.circleMarker(
        [focusPoint.latitude, focusPoint.longitude],
        {
          radius: 10,
          color: "#111827",
          fillColor: "#2563eb",
          fillOpacity: 0.85,
          weight: 2,
        },
      ).addTo(map);
      focusMarkerRef.current.bindPopup(popupHtml);
      focusMarkerRef.current.openPopup?.();
    } else {
      focusMarkerRef.current.setLatLng([
        focusPoint.latitude,
        focusPoint.longitude,
      ]);
      focusMarkerRef.current.bindPopup(popupHtml);
    }

    map.panTo([focusPoint.latitude, focusPoint.longitude]);
  }, [focusPoint, focusLabel, mapReadyTick]);

  return (
    <>
      <Head>
        <link rel="stylesheet" href={LEAFLET_CSS_URL} />
      </Head>
      <style jsx global>{`
        @keyframes orderPinBlink {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.35;
            transform: scale(1.08);
          }
        }
        .order-pin-blink {
          animation: orderPinBlink 1.1s ease-in-out infinite;
        }
      `}</style>
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: typeof height === "number" ? `${height}px` : height,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          backgroundColor: "#f8fafc",
        }}
      />
    </>
  );
};

export default OsmMap;
