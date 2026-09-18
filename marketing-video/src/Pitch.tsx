import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import timings from "./timings.json";

const NAVY = "#0B1220";
const CARD = "#111C2E";
const LINE = "#1E2C45";
const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";
const SKY = "#38BDF8";
const AMBER = "#F59E0B";
const GREEN = "#22C55E";

const FONT =
  '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

type SceneId = keyof typeof timings.scenes;

const useSceneFrames = (id: SceneId) => {
  const { fps } = useVideoConfig();
  const scene = timings.scenes[id];
  return {
    from: Math.round(scene.start * fps),
    durationInFrames: Math.max(1, Math.round((scene.end - scene.start) * fps)),
  };
};

const FadeUp: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [28, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Pill: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <span
    style={{
      background: `${color}22`,
      color,
      border: `2px solid ${color}55`,
      borderRadius: 999,
      padding: "8px 22px",
      fontSize: 28,
      fontWeight: 600,
    }}
  >
    {label}
  </span>
);

const DeliveryRow: React.FC<{
  customer: string;
  address: string;
  status: "pending" | "delivered";
  dim?: boolean;
}> = ({ customer, address, status, dim }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: CARD,
      border: `2px solid ${LINE}`,
      borderRadius: 16,
      padding: "22px 28px",
      opacity: dim ? 0.35 : 1,
    }}
  >
    <div>
      <div style={{ fontSize: 32, fontWeight: 600, color: TEXT }}>{customer}</div>
      <div style={{ fontSize: 24, color: MUTED, marginTop: 6 }}>{address}</div>
    </div>
    <Pill
      label={status}
      color={status === "delivered" ? GREEN : AMBER}
    />
  </div>
);

const ProblemScene: React.FC = () => {
  const lines = [
    "Every morning, the same scramble.",
    "Who's taking what?",
    "Who already delivered?",
  ];
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        gap: 34,
        padding: 120,
      }}
    >
      {lines.map((line, i) => (
        <FadeUp key={line} delay={i * 26}>
          <div
            style={{
              fontSize: i === 0 ? 76 : 64,
              fontWeight: i === 0 ? 700 : 500,
              color: i === 0 ? TEXT : MUTED,
              textAlign: "center",
            }}
          >
            {line}
          </div>
        </FadeUp>
      ))}
    </AbsoluteFill>
  );
};

const ProductScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, mass: 0.7 } });
  const underline = interpolate(frame, [12, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${interpolate(s, [0, 1], [0.86, 1])})` }}>
        <div
          style={{
            fontSize: 104,
            fontWeight: 800,
            color: TEXT,
            letterSpacing: -2,
          }}
        >
          Delivery Run Sheet
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: SKY,
            marginTop: 26,
            width: `${underline * 100}%`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const RolesScene: React.FC = () => (
  <AbsoluteFill
    style={{
      flexDirection: "row",
      gap: 60,
      padding: "150px 120px",
      alignItems: "stretch",
    }}
  >
    <FadeUp style={{ flex: 1 }}>
      <div style={{ fontSize: 40, color: SKY, fontWeight: 700, marginBottom: 26 }}>
        Dispatcher
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <DeliveryRow customer="Rami H." address="Hamra, Beirut" status="pending" />
        <DeliveryRow customer="Layla K." address="Jounieh" status="delivered" />
        <DeliveryRow customer="Nadia S." address="Baabda" status="pending" />
      </div>
      <div style={{ fontSize: 28, color: MUTED, marginTop: 24 }}>
        Sees everything. Assigns in seconds.
      </div>
    </FadeUp>
    <FadeUp delay={20} style={{ flex: 1 }}>
      <div style={{ fontSize: 40, color: GREEN, fontWeight: 700, marginBottom: 26 }}>
        Driver
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <DeliveryRow customer="Rami H." address="Hamra, Beirut" status="pending" dim />
        <DeliveryRow customer="Layla K." address="Jounieh" status="delivered" dim />
        <DeliveryRow customer="Nadia S." address="Baabda" status="pending" />
      </div>
      <div style={{ fontSize: 28, color: MUTED, marginTop: 24 }}>
        Sees only their own runs.
      </div>
    </FadeUp>
  </AbsoluteFill>
);

const ActionsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flipped = frame > 60;
  const tap = spring({ frame: frame - 54, fps, config: { damping: 9 } });
  const whatsapp = spring({ frame: frame - 96, fps, config: { damping: 9 } });
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: 160 }}
    >
      <FadeUp style={{ width: "100%" }}>
        <div
          style={{
            background: CARD,
            border: `2px solid ${LINE}`,
            borderRadius: 24,
            padding: 48,
            display: "flex",
            flexDirection: "column",
            gap: 34,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 44, fontWeight: 700, color: TEXT }}>
                Nadia S.
              </div>
              <div style={{ fontSize: 30, color: MUTED, marginTop: 8 }}>
                Baabda · 2 boxes
              </div>
            </div>
            <div style={{ transform: `scale(${1 + tap * 0.12})` }}>
              <Pill
                label={flipped ? "delivered" : "pending"}
                color={flipped ? GREEN : AMBER}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div
              style={{
                flex: 1,
                background: flipped ? `${GREEN}22` : "#1B2740",
                border: `2px solid ${flipped ? GREEN : LINE}`,
                color: flipped ? GREEN : TEXT,
                borderRadius: 16,
                padding: "26px 0",
                textAlign: "center",
                fontSize: 34,
                fontWeight: 600,
              }}
            >
              {flipped ? "✓ Delivered" : "Mark delivered"}
            </div>
            <div
              style={{
                flex: 1,
                background: `${GREEN}${whatsapp > 0.2 ? "33" : "11"}`,
                border: `2px solid ${GREEN}`,
                color: GREEN,
                borderRadius: 16,
                padding: "26px 0",
                textAlign: "center",
                fontSize: 34,
                fontWeight: 600,
                transform: `scale(${1 + whatsapp * 0.06})`,
              }}
            >
              WhatsApp the driver
            </div>
          </div>
          <div style={{ fontSize: 28, color: MUTED }}>
            Message already written. Live weather on every stop.
          </div>
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const title = spring({ frame: frame - 44, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", gap: 30 }}
    >
      {["No spreadsheets.", "No group chats."].map((line, i) => (
        <FadeUp key={line} delay={i * 22}>
          <div
            style={{
              fontSize: 60,
              color: MUTED,
              textDecoration: "line-through",
              textDecorationColor: `${SKY}AA`,
            }}
          >
            {line}
          </div>
        </FadeUp>
      ))}
      <div
        style={{
          opacity: title,
          transform: `translateY(${interpolate(title, [0, 1], [30, 0])}px)`,
          textAlign: "center",
          marginTop: 30,
        }}
      >
        <div style={{ fontSize: 92, fontWeight: 800, color: TEXT }}>
          Delivery Run Sheet
        </div>
        <div style={{ fontSize: 46, color: SKY, marginTop: 20 }}>
          Your whole day, on one screen.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Pitch: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 20%, #13203A 0%, ${NAVY} 60%)`,
        fontFamily: FONT,
      }}
    >
      {timings.hasAudio ? <Audio src={staticFile("voiceover.mp3")} /> : null}
      <Scene id="problem" component={ProblemScene} />
      <Scene id="product" component={ProductScene} />
      <Scene id="roles" component={RolesScene} />
      <Scene id="actions" component={ActionsScene} />
      <Scene id="close" component={CloseScene} />
    </AbsoluteFill>
  );
};

const Scene: React.FC<{ id: SceneId; component: React.FC }> = ({
  id,
  component: Component,
}) => {
  const { from, durationInFrames } = useSceneFrames(id);
  const isLast = id === "close";
  return (
    <Sequence
      from={from}
      durationInFrames={isLast ? durationInFrames + 40 : durationInFrames}
    >
      <Component />
    </Sequence>
  );
};
