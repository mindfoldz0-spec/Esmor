import { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { AppIcon, Icons } from '@/components/app-icon';
import { Brand } from '@/constants/theme';
import type { RoutePoint, VehicleType } from '@/types/transport';

type HeadlessMapViewProps = {
  routePoints: RoutePoint[]; // [lon, lat][]
  vehiclePosition: { latitude: number; longitude: number };
  headingDegrees: number;
  vehicleType: VehicleType;
  sourcePoint: { latitude: number; longitude: number; name: string };
  destinationPoint: { latitude: number; longitude: number; name: string };
  phase: 'approaching_source' | 'en_route_mandi';
  progressPercent: number;
  width?: number;
  height?: number;
};

const VEHICLE_EMOJIS: Record<VehicleType, string> = {
  tata_ace: '🚚',
  bolero_pickup: '🛻',
  tractor: '🚜',
  three_wheeler: '🛺',
};

export function HeadlessMapView({
  routePoints,
  vehiclePosition,
  headingDegrees,
  vehicleType,
  sourcePoint,
  destinationPoint,
  phase,
  progressPercent,
  width = 340,
  height = 280,
}: HeadlessMapViewProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const padding = 34;

  // Calculate bounding box across route points and special markers
  const allLats = [
    ...routePoints.map((p) => p[1]),
    sourcePoint.latitude,
    destinationPoint.latitude,
    vehiclePosition.latitude,
  ];
  const allLons = [
    ...routePoints.map((p) => p[0]),
    sourcePoint.longitude,
    destinationPoint.longitude,
    vehiclePosition.longitude,
  ];

  const minLat = Math.min(...allLats);
  const maxLat = Math.max(...allLats);
  const minLon = Math.min(...allLons);
  const maxLon = Math.max(...allLons);

  const spanLat = Math.max(0.015, (maxLat - minLat) / zoomLevel);
  const spanLon = Math.max(0.015, (maxLon - minLon) / zoomLevel);

  // Center around vehicle or midpoint
  const midLat = (minLat + maxLat) / 2;
  const midLon = (minLon + maxLon) / 2;

  const project = (lon: number, lat: number) => {
    const x = padding + ((lon - (midLon - spanLon / 2)) / spanLon) * (width - 2 * padding);
    const y = height - padding - ((lat - (midLat - spanLat / 2)) / spanLat) * (height - 2 * padding);
    return { x: Math.max(padding - 20, Math.min(width - padding + 20, x)), y: Math.max(padding - 20, Math.min(height - padding + 20, y)) };
  };

  // Convert route coordinates to SVG path
  let fullPathD = '';
  let traveledPathD = '';
  const totalCount = routePoints.length;
  const traveledIdx = Math.floor((progressPercent / 100) * totalCount);

  routePoints.forEach((pt, i) => {
    const projected = project(pt[0], pt[1]);
    const cmd = i === 0 ? 'M' : 'L';
    fullPathD += `${cmd} ${projected.x.toFixed(1)} ${projected.y.toFixed(1)} `;

    if (i <= traveledIdx) {
      traveledPathD += `${cmd} ${projected.x.toFixed(1)} ${projected.y.toFixed(1)} `;
    }
  });

  const sourceProj = project(sourcePoint.longitude, sourcePoint.latitude);
  const destProj = project(destinationPoint.longitude, destinationPoint.latitude);
  const vehicleProj = project(vehiclePosition.longitude, vehiclePosition.latitude);

  const vehicleEmoji = VEHICLE_EMOJIS[vehicleType] || '🚚';

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#F5F0EB" />
            <Stop offset="50%" stopColor="#EFE8DE" />
            <Stop offset="100%" stopColor="#E8DFD3" />
          </LinearGradient>

          <LinearGradient id="roadRemaining" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#2563EB" />
            <Stop offset="100%" stopColor="#3B82F6" />
          </LinearGradient>

          <LinearGradient id="roadTraveled" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#34D399" />
          </LinearGradient>
        </Defs>

        {/* Realistic Headless Map Cartographic Base */}
        <Rect width={width} height={height} rx={16} fill="url(#bgGrad)" />

        {/* Topographic and Road Grid lines */}
        <Path
          d={`M 0 ${height * 0.3} Q ${width * 0.4} ${height * 0.25} ${width} ${height * 0.35}`}
          stroke="#E2D7C8"
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d={`M 0 ${height * 0.7} Q ${width * 0.6} ${height * 0.75} ${width} ${height * 0.65}`}
          stroke="#E2D7C8"
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d={`M ${width * 0.25} 0 Q ${width * 0.3} ${height * 0.5} ${width * 0.2} ${height}`}
          stroke="#E2D7C8"
          strokeWidth="1"
          strokeDasharray="4,4"
          fill="none"
        />
        <Path
          d={`M ${width * 0.75} 0 Q ${width * 0.7} ${height * 0.5} ${width * 0.8} ${height}`}
          stroke="#E2D7C8"
          strokeWidth="1"
          strokeDasharray="4,4"
          fill="none"
        />

        {/* Route Outer Casing */}
        {fullPathD.length > 0 && (
          <Path
            d={fullPathD}
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}

        {/* Remaining Road Route */}
        {fullPathD.length > 0 && (
          <Path
            d={fullPathD}
            stroke="url(#roadRemaining)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={phase === 'approaching_source' ? '6,3' : 'none'}
            fill="none"
          />
        )}

        {/* Traveled Route Section (Green) */}
        {traveledPathD.length > 0 && (
          <Path
            d={traveledPathD}
            stroke="url(#roadTraveled)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}

        {/* Source Point Pin (Green) */}
        <G x={sourceProj.x} y={sourceProj.y}>
          <Circle r="12" fill="rgba(16, 185, 129, 0.2)" />
          <Circle r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
          <SvgText
            x="0"
            y="-12"
            fill="#065F46"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle">
            {sourcePoint.name.split(',')[0].slice(0, 16)}
          </SvgText>
        </G>

        {/* Destination Point Pin (Red / Flag) */}
        <G x={destProj.x} y={destProj.y}>
          <Circle r="14" fill="rgba(239, 68, 68, 0.2)" />
          <Circle r="8" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
          <SvgText
            x="0"
            y="-14"
            fill="#991B1B"
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle">
            {destinationPoint.name.split(',')[0].slice(0, 16)}
          </SvgText>
        </G>

        {/* Moving Vehicle Marker with Radar Pulse & Bearing */}
        <G x={vehicleProj.x} y={vehicleProj.y}>
          {/* Radar beacon pulsing wave */}
          <Circle r="20" fill="rgba(37, 99, 235, 0.15)" />
          <Circle r="14" fill="rgba(37, 99, 235, 0.25)" />

          {/* Vehicle circular badge */}
          <Circle r="12" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />

          {/* Vehicle Emoji with Rotation Heading */}
          <G rotation={headingDegrees} origin="0, 0">
            <SvgText
              x="0"
              y="4.5"
              fontSize="12"
              textAnchor="middle">
              {vehicleEmoji}
            </SvgText>
          </G>

          {/* Live Vehicle Status Tag */}
          <Rect
            x="-26"
            y="15"
            width="52"
            height="15"
            rx="4"
            fill="rgba(22, 19, 31, 0.85)"
          />
          <SvgText
            x="0"
            y="26"
            fill="#FFFFFF"
            fontSize="8"
            fontWeight="bold"
            textAnchor="middle">
            {phase === 'approaching_source' ? 'पिकअप कडे' : 'मार्केट कडे'}
          </SvgText>
        </G>
      </Svg>

      {/* Map HUD Overlay: OSM Attribution & Zoom Controls */}
      <View style={styles.hudTop}>
        <View style={styles.osmBadge}>
          <AppIcon name={Icons.location} size={11} color="#64748B" />
          <Text style={styles.osmText}>OpenStreetMap • OSRM Live</Text>
        </View>

        <View style={styles.zoomControls}>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => setZoomLevel((z) => Math.min(2.2, z + 0.3))}
            accessibilityLabel="Zoom In">
            <Text style={styles.zoomBtnText}>+</Text>
          </Pressable>
          <Pressable
            style={styles.zoomBtn}
            onPress={() => setZoomLevel((z) => Math.max(0.7, z - 0.3))}
            accessibilityLabel="Zoom Out">
            <Text style={styles.zoomBtnText}>−</Text>
          </Pressable>
        </View>
      </View>

      {/* Phase indicator banner */}
      <View style={styles.phaseBanner}>
        <View
          style={[
            styles.phaseDot,
            phase === 'approaching_source' ? styles.dotApproach : styles.dotEnRoute,
          ]}
        />
        <Text style={styles.phaseText}>
          {phase === 'approaching_source'
            ? 'गाडी संकलन केंद्राकडे येत आहे (Approaching Source)'
            : 'मार्केट यार्डकडे प्रवास सुरू (En Route to Mandi)'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E8DFD3',
    position: 'relative',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(22, 19, 31, 0.1)',
    shadowColor: '#16131F',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  hudTop: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  osmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  osmText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  zoomControls: {
    flexDirection: 'row',
    gap: 4,
  },
  zoomBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  zoomBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Brand.ink,
    lineHeight: 16,
  },
  phaseBanner: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(22, 19, 31, 0.88)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotApproach: {
    backgroundColor: '#10B981',
  },
  dotEnRoute: {
    backgroundColor: '#3B82F6',
  },
  phaseText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
});
