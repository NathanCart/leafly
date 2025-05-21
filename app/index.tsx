import { ActivityIndicator, View } from 'react-native';
import 'react-native-get-random-values';
import { COLORS } from './constants/colors';
export default function Index() {
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: 'white',
				height: '100%',
				width: '100%',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<ActivityIndicator size="large" color={COLORS.primary} />
		</View>
	);
}
