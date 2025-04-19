import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  withRepeat,
} from 'react-native-reanimated';
import { Leaf } from 'lucide-react-native';
import { COLORS } from '@/app/constants/colors';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  onAnimationComplete: () => void;
}

export function SuccessAnimation({ onAnimationComplete }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const leafRotation = useSharedValue(0);
  const leafScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);
  const sparkleScale = useSharedValue(0);

  const triggerHaptics = () => {
    if (Platform.OS === 'web') return;
    
    // Initial success feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Sequence of haptic effects
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 200);
    
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 400);
    
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 600);
  };

  useEffect(() => {
    triggerHaptics();

    // Main circle animation
    scale.value = withSequence(
      withTiming(1.2, { duration: 400, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }),
      withTiming(1, { duration: 200 }),
      withDelay(1500, withTiming(0, { duration: 300 }))
    );

    // Background opacity
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1500, withTiming(0, { duration: 300 }))
    );

    // Leaf animation
    leafRotation.value = withSequence(
      withSpring(720, { damping: 10, stiffness: 100 }),
      withRepeat(withTiming(360, { duration: 1000 }), 2, true)
    );
    
    leafScale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 100 }),
      withTiming(1, { duration: 500 }),
      withRepeat(withSpring(1.1, { damping: 5 }), 3, true)
    );

    // Sparkle animation
    sparkleScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(0.8, { duration: 300 })
      ),
      -1,
      true
    );

    // Text fade in with bounce
    textOpacity.value = withSequence(
      withDelay(300, withSpring(1.2, { damping: 12, stiffness: 100 })),
      withTiming(1, { duration: 200 }),
      withDelay(1000, withTiming(0, { duration: 300 }))
    );

    // Confetti fade in/out
    confettiOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1200, withTiming(0, { duration: 300 }))
    );

    // Trigger completion callback
    const timeout = setTimeout(() => {
      onAnimationComplete();
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const leafStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: leafScale.value },
      { rotate: `${leafRotation.value}deg` },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [
      { scale: interpolate(textOpacity.value, [0, 1.2, 1], [0.8, 1.2, 1]) },
    ],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
    opacity: interpolate(sparkleScale.value, [0.8, 1.2], [0.6, 1]),
  }));

  const Confetti = ({ style, delay = 0 }) => {
    const translateY = useSharedValue(0);
    const translateX = useSharedValue(0);
    const rotate = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
      translateY.value = withDelay(
        delay,
        withTiming(-SCREEN_HEIGHT * 0.3, { 
          duration: 1000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
      translateX.value = withDelay(
        delay,
        withTiming(Math.random() * 100 - 50, { 
          duration: 1000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
      rotate.value = withDelay(
        delay,
        withTiming(Math.random() * 360 + 360, { duration: 1000 })
      );
      scale.value = withSequence(
        withDelay(delay, withSpring(1.5)),
        withTiming(0, { duration: 500 })
      );
    }, []);

    const confettiStyle = useAnimatedStyle(() => ({
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value },
      ],
      opacity: confettiOpacity.value,
    }));

    return (
      <Animated.View style={[styles.confetti, style, confettiStyle]} />
    );
  };

  const Sparkle = ({ style, delay = 0 }) => {
    const sparkleOpacity = useSharedValue(0);

    useEffect(() => {
      sparkleOpacity.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 500 }),
          -1,
          true
        )
      );
    }, []);

    const sparkleAnimStyle = useAnimatedStyle(() => ({
      opacity: sparkleOpacity.value,
    }));

    return (
      <Animated.View 
        style={[
          styles.sparkle,
          style,
          sparkleAnimStyle,
          sparkleStyle,
        ]} 
      />
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.background, backgroundStyle]}>
        <Animated.View style={[styles.circle, circleStyle]}>
          <Animated.View style={[styles.iconContainer, leafStyle]}>
            <Leaf size={48} color="white" />
          </Animated.View>
        </Animated.View>

        <Animated.Text style={[styles.text, textStyle]}>
          Plant Added!
        </Animated.Text>

        {/* Sparkles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Sparkle
            key={`sparkle-${i}`}
            delay={i * 100}
            style={{
              top: `${30 + Math.random() * 40}%`,
              left: `${20 + (i * 60 / 8)}%`,
            }}
          />
        ))}

        {/* Confetti pieces */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Confetti
            key={`confetti-${i}`}
            delay={i * 50}
            style={{
              backgroundColor: [
                COLORS.primary,
                COLORS.secondary,
                COLORS.tertiary,
              ][i % 3],
              left: `${(i / 20) * 100}%`,
            }}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    bottom: '40%',
  },
  sparkle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#FFD700',
    borderRadius: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
});