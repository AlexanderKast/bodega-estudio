// Fixture con tells a propósito: test-lint.mjs verifica que el linter los detecte todos.
import { Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { arrive, leave } from "../../studio/src/lib/motion";

export const Malo: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 30], [0, 400]); // AI-01
  const c = Easing.bezier(0.25, 0.1, 0.25, 1); // CURVE-01
  const e = Easing.inOut(Easing.ease); // AI-06
  const s = spring({ frame, fps: 30, config: { damping: 4, stiffness: 200 } }); // AI-10
  const out = leave(frame, 40, 10, "arrive"); // AI-05
  const slow = arrive(frame, 0, 60); // T-01
  const fuera = interpolate(frame, [0, 20], [0, 1], { easing: Easing.bezier(0.16, 1, 0.3, 1) }); // KIT-01
  return (
    <div style={{ background: "#000", fontFamily: "Inter", transition: "ease-in-out" }}>
      <div style={{ background: "linear-gradient(90deg, #7C3AED, #06B6D4)", transform: "scale(0)" }} />
      <div style={{ backdropFilter: "blur(20px)" }} />
      <div style={{ backdropFilter: "blur(20px)" }} />
      <Item delay={10} />
      <Item delay={10} />
      <Item delay={10} />
      {x + c(0) + e(0) + s + out + slow + fuera}
    </div>
  );
};
const Item: React.FC<{ delay: number }> = () => null;

// F-01: fuente que nadie carga.
export const SinCargar: React.FC = () => <div style={{ fontFamily: "Montserrat Alternates" }}>texto</div>;
