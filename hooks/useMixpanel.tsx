import { Mixpanel } from 'mixpanel-react-native';
import { useEffect } from 'react';
// import DeviceInfo from 'react-native-device-info';

export function useMixpanel(id: string) {
	useEffect(() => {
		(async () => {
			const mixpanel = new Mixpanel('6c74bb52adbfe583cdeb27186e855fff', false);
			mixpanel.init();

			console.log('Mixpanel initialized');
			mixpanel.track(id);
		})();
	}, []);
}
