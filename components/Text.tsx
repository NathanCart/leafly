import { Text as DefaultText, View as DefaultView, TextInput, StyleSheet } from 'react-native';
type ThemeProps = {
	lightColor?: string;
	darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function Text(props: TextProps) {
	const { style, ...otherProps } = props;

	return (
		<DefaultText
			style={[
				{
					fontFamily: 'Quicksand_700Bold',
					overflow: 'hidden',
				},

				style,
			]}
			maxFontSizeMultiplier={1.1}
			{...otherProps}
		/>
	);
}
