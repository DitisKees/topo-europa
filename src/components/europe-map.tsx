import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { COUNTRY_BY_ID, MICRO_IDS } from "@/data/countries";
import { europeMap, projectLonLat } from "@/data/europe-map";
import { cn } from "@/lib/utils";

const MIN_K = 1;
const MAX_K = 10;

export type CountryState = "idle" | "hovered" | "selected" | "correct" | "wrong" | "dim" | "atlas";

type Props = {
  interactive?: boolean;
  showCapitals?: boolean;
  capitalInteractive?: boolean;
  showTooltip?: boolean;
  countryState?: (id: string) => CountryState;
  onCountry?: (id: string) => void;
  onCapital?: (id: string) => void;
  className?: string;
  decorative?: boolean;
};

type View = { tx: number; ty: number; k: number };
type Point = { x: number; y: number };
type Pinch = { distance: number; cx: number; cy: number; moved: boolean };

export function EuropeMap({
  interactive = true,
  showCapitals = false,
  capitalInteractive = false,
  showTooltip = true,
  countryState,
  onCountry,
  onCapital,
  className,
  decorative = false,
}: Props) {
  const [view, setView] = useState<View>({ tx: 0, ty: 0, k: 1 });
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    tx: number;
    ty: number;
    moved: boolean;
  } | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<Pinch | null>(null);
  const ignoreClicksUntil = useRef(0);

  const shapes = europeMap.countries;
  const entries = useMemo(() => Object.entries(shapes), [shapes]);

  const toSvgPoint = useCallback((svg: SVGSVGElement, clientX: number, clientY: number): Point => {
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const point = svg.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      const local = point.matrixTransform(ctm.inverse());
      return { x: local.x, y: local.y };
    }

    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * europeMap.width,
      y: ((clientY - rect.top) / rect.height) * europeMap.height,
    };
  }, []);

  const getPinch = useCallback(
    (svg: SVGSVGElement): Pinch | null => {
      const [a, b] = Array.from(pointers.current.values());
      if (!a || !b) return null;
      const midpoint = toSvgPoint(svg, (a.x + b.x) / 2, (a.y + b.y) / 2);
      return {
        distance: Math.hypot(b.x - a.x, b.y - a.y),
        cx: midpoint.x,
        cy: midpoint.y,
        moved: false,
      };
    },
    [toSvgPoint],
  );

  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    setView((prev) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, prev.k * factor));
      const wx = (cx - prev.tx) / prev.k;
      const wy = (cy - prev.ty) / prev.k;
      return { k, tx: cx - wx * k, ty: cy - wy * k };
    });
  }, []);

  const onWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    if (decorative) return;
    event.preventDefault();
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const cx = ((event.clientX - rect.left) / rect.width) * europeMap.width;
    const cy = ((event.clientY - rect.top) / rect.height) * europeMap.height;
    zoomAt(cx, cy, event.deltaY < 0 ? 1.12 : 1 / 1.25);
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (decorative) return;

    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (pointers.current.size >= 2) {
      drag.current = null;
      pinch.current = getPinch(event.currentTarget);
      return;
    }

    pinch.current = null;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      tx: view.tx,
      ty: view.ty,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size >= 2) {
      const nextPinch = getPinch(event.currentTarget);
      const previousPinch = pinch.current;
      if (!nextPinch) return;
      if (!previousPinch || previousPinch.distance <= 0) {
        pinch.current = nextPinch;
        return;
      }

      const midpointShift = Math.hypot(nextPinch.cx - previousPinch.cx, nextPinch.cy - previousPinch.cy);
      const distanceShift = Math.abs(nextPinch.distance - previousPinch.distance);
      const moved = previousPinch.moved || midpointShift > 1 || distanceShift > 2;
      if (moved) ignoreClicksUntil.current = Date.now() + 300;

      const factor = nextPinch.distance / previousPinch.distance;
      setView((prev) => {
        const k = Math.min(MAX_K, Math.max(MIN_K, prev.k * factor));
        const wx = (previousPinch.cx - prev.tx) / prev.k;
        const wy = (previousPinch.cy - prev.ty) / prev.k;
        return {
          k,
          tx: nextPinch.cx - wx * k,
          ty: nextPinch.cy - wy * k,
        };
      });
      pinch.current = { ...nextPinch, moved };
      return;
    }

    const d = drag.current;
    if (!d || d.pointerId !== event.pointerId) return;
    const start = toSvgPoint(event.currentTarget, d.x, d.y);
    const current = toSvgPoint(event.currentTarget, event.clientX, event.clientY);
    const dx = current.x - start.x;
    const dy = current.y - start.y;
    if (Math.abs(event.clientX - d.x) + Math.abs(event.clientY - d.y) > 4) {
      d.moved = true;
      ignoreClicksUntil.current = Date.now() + 300;
    }
    setView((prev) => ({ ...prev, tx: d.tx + dx, ty: d.ty + dy }));
  };

  const endPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleCountry = (id: string) => {
    if (Date.now() < ignoreClicksUntil.current) return;
    if (!interactive || decorative) return;
    onCountry?.(id);
  };

  const handleCapital = (id: string) => {
    if (Date.now() < ignoreClicksUntil.current) return;
    onCapital?.(id);
  };

  const resetView = () => setView({ tx: 0, ty: 0, k: 1 });
  const hoverCountry = hover ? COUNTRY_BY_ID[hover] : undefined;

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${europeMap.width} ${europeMap.height}`}
        className="h-full w-full touch-none select-none"
        role={decorative ? "img" : "application"}
        aria-label="Kaart van Europa"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <rect className="map-water" width={europeMap.width} height={europeMap.height} />
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
          {entries.map(([id, shape]) => {
            const state = countryState?.(id) ?? (hover === id ? "hovered" : "idle");
            return (
              <path
                key={id}
                d={shape.d}
                data-iso={id}
                className={cn(
                  "land-path",
                  interactive && !decorative && "is-interactive",
                  state === "hovered" && "is-hovered",
                  state === "selected" && "is-selected",
                  state === "correct" && "is-correct",
                  state === "wrong" && "is-wrong",
                  state === "dim" && "is-dim",
                  state === "atlas" && "is-atlas-active",
                )}
                onPointerEnter={() => {
                  if (!decorative) setHover(id);
                }}
                onPointerLeave={() => setHover((h) => (h === id ? null : h))}
                onClick={() => handleCountry(id)}
              />
            );
          })}

          {MICRO_IDS.map((id) => {
            const shape = shapes[id];
            const country = COUNTRY_BY_ID[id];
            if (!shape || !country) return null;
            const r = 4.6 / view.k;
            const state = countryState?.(id) ?? (hover === id ? "hovered" : "idle");
            const fill =
              state === "correct"
                ? "var(--color-correct)"
                : state === "wrong"
                  ? "var(--color-wrong)"
                  : state === "selected" || state === "atlas"
                    ? "var(--color-primary)"
                    : state === "dim"
                      ? "var(--color-land-stroke)"
                      : "var(--color-ink)";
            return (
              <circle
                key={`${id}-dot`}
                data-iso={`${id}-dot`}
                cx={shape.cx}
                cy={shape.cy}
                r={r}
                fill={fill}
                stroke="var(--color-bg-elevated)"
                strokeWidth={1.2 / view.k}
                className={interactive && !decorative ? "cursor-pointer" : undefined}
                onPointerEnter={() => setHover(id)}
                onClick={() => handleCountry(id)}
              />
            );
          })}

          {showCapitals &&
            Object.keys(shapes).map((id) => {
              const country = COUNTRY_BY_ID[id];
              if (!country) return null;
              const pt = projectLonLat(country.capitalLon, country.capitalLat);
              const state = countryState?.(id) ?? "idle";
              const r = (capitalInteractive ? 5 : 3.1) / view.k;
              return (
                <circle
                  key={`${id}-cap`}
                  cx={pt.x}
                  cy={pt.y}
                  r={r}
                  className={cn(
                    "capital-dot",
                    capitalInteractive && "is-interactive",
                    state === "correct" && "is-correct",
                    state === "wrong" && "is-wrong",
                    state === "selected" && "is-target",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (capitalInteractive) handleCapital(id);
                  }}
                />
              );
            })}
        </g>
      </svg>

      {!decorative && (
        <div className="absolute right-3 bottom-3 flex gap-1.5">
          <MapBtn label="Zoom uit" onClick={() => zoomAt(europeMap.width / 2, europeMap.height / 2, 1 / 1.25)}>
            <Minus className="size-4" />
          </MapBtn>
          <MapBtn label="Zoom in" onClick={() => zoomAt(europeMap.width / 2, europeMap.height / 2, 1.25)}>
            <Plus className="size-4" />
          </MapBtn>
          <MapBtn label="Reset kaart" onClick={resetView}>
            <RotateCcw className="size-4" />
          </MapBtn>
        </div>
      )}

      {showTooltip && hoverCountry && !decorative && (
        <div className="pointer-events-none absolute top-3 left-3 rounded-[var(--radius-sm)] bg-bg-elevated/95 px-3 py-1.5 text-sm shadow-[var(--shadow-border)]">
          <span className="font-medium">{hoverCountry.name}</span>
          <span className="text-muted"> · {hoverCountry.capital}</span>
        </div>
      )}
    </div>
  );
}

function MapBtn({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-10 items-center justify-center rounded-[var(--radius-sm)] bg-bg-elevated/95 text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
    >
      {children}
    </button>
  );
}
