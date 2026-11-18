import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Colors, Fonts, RirColors, rirLabel } from '@/constants/theme';

type RirSliderProps = {
  value: number | null;
  onChange: (rir: number | null) => void;
  // This week's target RIR (mesocycles, later): draws a small dot under that segment.
  target?: number;
};

const TRACK_PADDING = 4;
const SEGMENT_COUNT = 5;
const MAX_INDEX = SEGMENT_COUNT - 1; // index 4 means "4+"
const SEGMENT_INDEXES = [0, 1, 2, 3, 4];
const RIR_SCALE = [...RirColors];
const TIMING = { duration: 240, easing: Easing.bezier(0.3, 0.7, 0.4, 1) };

// Any saved value above 4 shows as "4+" (D3).
const toIndex = (rir: number | null) =>
  rir === null ? null : clamp(Math.round(rir), 0, MAX_INDEX);

// Defined outside the component so worklets can hand it to the JS thread.
const selectionHaptic = () => {
  Haptics.selectionAsync();
};

// The segment under the finger. x is relative to the track, so remove its padding first.
function indexAt(x: number, segmentWidth: number) {
  'worklet';
  return clamp(Math.floor((x - TRACK_PADDING) / segmentWidth), 0, MAX_INDEX);
}

// While dragging, the highlight is centred under the finger, in segment units.
function followPosition(x: number, segmentWidth: number) {
  'worklet';
  return clamp((x - TRACK_PADDING) / segmentWidth - 0.5, 0, MAX_INDEX);
}

export function RirSlider({ value, onChange, target }: RirSliderProps) {
  const selectedIndex = toIndex(value);

  // Animation state only: which segment is selected always comes from `value`.
  const segmentWidth = useSharedValue(0);
  const position = useSharedValue(selectedIndex ?? 0); // in segments, fractional mid-drag
  const visible = useSharedValue(selectedIndex === null ? 0 : 1);
  const committed = useSharedValue(selectedIndex ?? -1); // `value` as seen by the UI thread
  const dragIndex = useSharedValue(-1);

  // Follow the parent's value (taps, drags, edit mode loading a set).
  useEffect(() => {
    committed.set(selectedIndex ?? -1);
    if (selectedIndex === null) {
      visible.set(withTiming(0, TIMING));
    } else {
      position.set(withTiming(selectedIndex, TIMING));
      visible.set(withTiming(1, TIMING));
    }
  }, [selectedIndex, committed, position, visible]);

  // Tapping the selected segment again clears it (D3). Shared by taps and screen readers.
  const selectSegment = (index: number) => {
    Haptics.selectionAsync();
    onChange(index === selectedIndex ? null : index);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    segmentWidth.set(
      (event.nativeEvent.layout.width - 2 * TRACK_PADDING) / SEGMENT_COUNT,
    );
  };

  const followFinger = (x: number) => {
    'worklet';
    const width = segmentWidth.get();
    if (width <= 0) return;
    position.set(followPosition(x, width));
    const index = indexAt(x, width);
    if (index !== dragIndex.get()) {
      dragIndex.set(index);
      scheduleOnRN(selectionHaptic);
    }
  };

  // Pan wins once the finger moves sideways; a vertical move fails it so a parent
  // ScrollView can scroll. Pan's onEnd only runs after it was active, so a tap can't fire it.
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onStart((event) => {
      dragIndex.set(committed.get());
      visible.set(withTiming(1, TIMING));
      followFinger(event.x);
    })
    .onUpdate((event) => {
      followFinger(event.x);
    })
    .onEnd((event, success) => {
      const width = segmentWidth.get();
      if (!success || width <= 0) {
        // Cancelled (e.g. the screen scrolled): go back to the saved value.
        const saved = committed.get();
        if (saved >= 0) position.set(withTiming(saved, TIMING));
        visible.set(withTiming(saved >= 0 ? 1 : 0, TIMING));
        return;
      }
      // Ending on the selected segment keeps it: only a tap clears.
      const index = indexAt(event.x, width);
      position.set(withTiming(index, TIMING));
      scheduleOnRN(onChange, index);
    });

  const tap = Gesture.Tap()
    .maxDistance(10)
    .onEnd((event, success) => {
      const width = segmentWidth.get();
      if (!success || width <= 0) return;
      scheduleOnRN(selectSegment, indexAt(event.x, width));
    });

  // Exclusive: the tap only activates once the pan has failed (finger lifted without dragging).
  const gesture = Gesture.Exclusive(pan, tap);

  const highlightStyle = useAnimatedStyle(() => {
    const width = segmentWidth.get();
    return {
      width,
      opacity: width > 0 ? visible.get() : 0,
      backgroundColor: interpolateColor(position.get(), SEGMENT_INDEXES, RIR_SCALE),
      transform: [{ translateX: position.get() * width }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.track} onLayout={handleLayout}>
        <Animated.View pointerEvents="none" style={[styles.highlight, highlightStyle]} />
        {SEGMENT_INDEXES.map((index) => (
          <Segment
            key={index}
            index={index}
            selected={index === selectedIndex}
            isTarget={index === target}
            position={position}
            visible={visible}
            segmentWidth={segmentWidth}
            onSelect={selectSegment}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

type SegmentProps = {
  index: number;
  selected: boolean;
  isTarget: boolean;
  position: SharedValue<number>;
  visible: SharedValue<number>;
  segmentWidth: SharedValue<number>;
  onSelect: (index: number) => void;
};

function Segment({
  index,
  selected,
  isTarget,
  position,
  visible,
  segmentWidth,
  onSelect,
}: SegmentProps) {
  const restColor = RirColors[index];
  const selectedColor = Colors.dark.onAccent;

  // How much of this segment the highlight covers (0..1), so the label and dot switch
  // to the dark color exactly as the highlight slides under them, mid-drag included.
  // A derived value (not a plain helper worklet) so Reanimated tracks the shared values it reads.
  const coverage = useDerivedValue(() => {
    const shown = segmentWidth.get() > 0 ? visible.get() : 0;
    return clamp(1 - Math.abs(position.get() - index), 0, 1) * shown;
  });

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(coverage.get(), [0, 1], [restColor, selectedColor]),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(coverage.get(), [0, 1], [restColor, selectedColor]),
  }));

  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`RIR ${rirLabel(index)}${isTarget ? " (this week's target)" : ''}`}
      // Gesture-handler taps don't fire for VoiceOver/TalkBack, so handle "activate" directly.
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') onSelect(index);
      }}
      style={styles.segment}
    >
      <Animated.Text style={[styles.label, labelStyle]}>{rirLabel(index)}</Animated.Text>
      {isTarget ? <Animated.View style={[styles.targetDot, dotStyle]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: TRACK_PADDING,
    borderRadius: 14,
    backgroundColor: Colors.dark.surface,
  },
  highlight: {
    position: 'absolute',
    top: TRACK_PADDING,
    left: TRACK_PADDING,
    height: 44,
    borderRadius: 10,
  },
  segment: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 20,
  },
  targetDot: {
    position: 'absolute',
    bottom: 5,
    left: '50%',
    marginLeft: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
