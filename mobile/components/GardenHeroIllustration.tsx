import Svg, { Path, Ellipse, Circle, G } from "react-native-svg";

/**
 * Abstract garden hero for login/welcome.
 * Minimal, serene: soft hills, simple plants, sun.
 * Apple HIG–friendly, not decorative clutter.
 */
export default function GardenHeroIllustration({
  width = 280,
  height = 180,
}: {
  width?: number;
  height?: number;
}) {
  const vb = "0 0 280 180";
  return (
    <Svg width={width} height={height} viewBox={vb} fill="none">
      {/* Sky gradient simulated with light ellipse */}
      <Ellipse cx={140} cy={50} rx={160} ry={80} fill="#E8EDE6" opacity={0.6} />

      {/* Sun */}
      <Circle cx={220} cy={45} r={22} fill="#F5E6C8" opacity={0.9} />
      <Circle cx={220} cy={45} r={18} fill="#FDF8F0" />

      {/* Soft hills */}
      <Path
        d="M0 120 Q70 80 140 100 T280 90 L280 180 L0 180 Z"
        fill="#D4E0D0"
        opacity={0.85}
      />
      <Path
        d="M0 140 Q100 100 200 120 T280 110 L280 180 L0 180 Z"
        fill="#C5D4BE"
        opacity={0.9}
      />
      <Path
        d="M0 160 Q120 130 240 150 L280 145 L280 180 L0 180 Z"
        fill="#B5C8AC"
      />

      {/* Abstract plants — simple leaf shapes */}
      <G opacity={0.9}>
        <Path
          d="M60 140 Q55 100 70 85 Q85 100 80 140 Z"
          fill="#5B7A4A"
          opacity={0.8}
        />
        <Path
          d="M85 145 Q80 110 95 95 Q108 112 102 145 Z"
          fill="#6B8B5A"
          opacity={0.75}
        />
        <Path
          d="M200 130 Q195 95 212 82 Q225 98 218 130 Z"
          fill="#5B7A4A"
          opacity={0.8}
        />
        <Path
          d="M175 135 Q170 105 182 92 Q192 108 188 135 Z"
          fill="#4A7C59"
          opacity={0.85}
        />
      </G>

      {/* Water drop accent */}
      <Ellipse
        cx={140}
        cy={115}
        rx={12}
        ry={16}
        fill="#A8D4E0"
        opacity={0.5}
      />
      <Ellipse
        cx={140}
        cy={112}
        rx={6}
        ry={8}
        fill="#C5E5EE"
        opacity={0.6}
      />
    </Svg>
  );
}
