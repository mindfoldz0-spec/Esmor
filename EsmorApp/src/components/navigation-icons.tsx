import Svg, { Line, Path, Rect } from 'react-native-svg';

export type NavigationIconName = 'home' | 'explore' | 'activity';

type NavigationIconProps = {
  name: NavigationIconName;
  color: string;
  size?: number;
};

/**
 * Stroke icons for the bottom navigation.
 * They use the same hand-drawn outline language as the reference navigation.
 */
export function NavigationIcon({ name, color, size = 20 }: NavigationIconProps) {
  const strokeProps = {
    stroke: color,
    strokeWidth: 7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  if (name === 'home') {
    return (
      <Svg width={size} height={size} viewBox="0 0 104 100" fill="none">
        <Path
          d="M100.5 40.75V96.5H66V68.5V65H62.5H43H39.5V68.5V96.5H3.5V40.75L52 4.375L100.5 40.75Z"
          {...strokeProps}
        />
      </Svg>
    );
  }

  if (name === 'explore') {
    return (
      <Svg width={size} height={size} viewBox="0 0 104 100" fill="none">
        <Rect x={8} y={6} width={40} height={40} rx={12} {...strokeProps} />
        <Rect x={56} y={6} width={40} height={40} rx={12} {...strokeProps} />
        <Rect x={8} y={54} width={40} height={40} rx={12} {...strokeProps} />
        <Rect x={56} y={54} width={40} height={40} rx={12} {...strokeProps} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 104 100" fill="none">
      <Line x1={12} y1={88} x2={92} y2={88} {...strokeProps} />
      <Line x1={26} y1={82} x2={26} y2={56} {...strokeProps} />
      <Line x1={52} y1={82} x2={52} y2={28} {...strokeProps} />
      <Line x1={78} y1={82} x2={78} y2={44} {...strokeProps} />
    </Svg>
  );
}
