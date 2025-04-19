import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
  useColorScheme,
} from 'react-native';
import { COLORS } from '../app/constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  fullWidth?: boolean;
  style?: any;
}

export function Button({
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  fullWidth = false,
  style,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getBackgroundColor = () => {
    if (disabled) return isDark ? '#2A2A2A' : COLORS.button.disabled;
    
    switch (variant) {
      case 'primary':
        return COLORS.button.primary;
      case 'secondary':
        return isDark ? '#2A3A30' : '#E6F2E8';
      case 'tertiary':
        return 'transparent';
      case 'danger':
        return isDark ? '#5A2A2A' : '#FFE8E0';
      default:
        return COLORS.button.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return isDark ? '#666666' : '#999999';
    
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'secondary':
        return COLORS.primary;
      case 'tertiary':
        return isDark ? '#E0E0E0' : '#283618';
      case 'danger':
        return '#D27D4C';
      default:
        return '#FFFFFF';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getBorderRadius = () => {
    switch (size) {
      case 'small':
        return 8;
      case 'large':
        return 16;
      default:
        return 12;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: getBorderRadius(),
          opacity: (disabled || loading) ? 0.7 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        variant === 'tertiary' && styles.tertiary,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size={getIconSize()} />
      ) : (
        <View style={[
          styles.content,
          { flexDirection: iconPosition === 'left' ? 'row' : 'row-reverse' }
        ]}>
          {icon && (
            <View style={[
              styles.iconContainer,
              { marginRight: iconPosition === 'left' ? 8 : 0, marginLeft: iconPosition === 'right' ? 8 : 0 }
            ]}>
              {icon}
            </View>
          )}
          <Text style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
            }
          ]}>
            {children}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tertiary: {
    shadowOpacity: 0,
    elevation: 0,
  },
});