import { GrowthBook, GrowthBookProvider, useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { install } from 'react-native-quick-crypto'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useGrowthBookDevTools } from 'rozenite-growthbook-plugin'

install()

const gb = new GrowthBook({
	attributes: {
		age: 28,
		country: 'US',
		id: 'user-123',
		loggedIn: true,
		plan: 'pro',
	},
	clientKey: 'test-client-key',
	features: {
		'banner-text': {
			defaultValue: 'Welcome to the app!',
		},
		'dark-mode': {
			defaultValue: false,
			rules: [
				{
					condition: { country: 'US' },
					force: true,
				},
			],
		},
		'max-items': {
			defaultValue: 10,
		},
		'new-checkout-flow': {
			defaultValue: false,
			rules: [
				{
					coverage: 1,
					hashAttribute: 'id',
					key: 'new-checkout-experiment',
					meta: [
						{ key: 'control', name: 'Control' },
						{ key: 'variant', name: 'New Flow' },
					],
					variations: [false, true],
					weights: [0.5, 0.5],
				},
			],
		},
		'price-config': {
			defaultValue: { currency: 'USD', showDecimals: true },
		},
	},
	trackingCallback: (experiment, result) => {
		// oxlint-disable-next-line no-console
		console.log('Experiment tracked:', experiment.key, result.variationId)
	},
})

function DevToolsBridge() {
	useGrowthBookDevTools({ gb })

	return null
}

function FeatureDisplay() {
	const isDarkMode = useFeatureIsOn('dark-mode')
	const bannerText = useFeatureValue('banner-text', 'Default')
	const maxItems = useFeatureValue('max-items', 10)
	const newCheckout = useFeatureIsOn('new-checkout-flow')
	const priceConfig = useFeatureValue('price-config', {
		currency: 'USD',
		showDecimals: true,
	})

	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>Feature Flags</Text>

			<FeatureCard name="dark-mode" value={isDarkMode} type="boolean" />
			<FeatureCard name="banner-text" value={bannerText} type="string" />
			<FeatureCard name="max-items" value={maxItems} type="number" />
			<FeatureCard name="new-checkout-flow" value={newCheckout} type="boolean" />
			<FeatureCard name="price-config" value={JSON.stringify(priceConfig)} type="object" />
		</View>
	)
}

function FeatureCard({ name, value, type }: { name: string; value: unknown; type: string }) {
	return (
		<View style={styles.card}>
			<Text style={styles.cardName}>{name}</Text>
			<View style={styles.cardRow}>
				<Text style={styles.cardType}>{type}</Text>
				<Text style={styles.cardValue}>{String(value)}</Text>
			</View>
		</View>
	)
}

export function App() {
	const [ready, setReady] = useState(false)

	useEffect(() => {
		void gb.init({ timeout: 1000 }).then(() => {
			setReady(true)
		})
	}, [])

	if (!ready) {
		return (
			<SafeAreaProvider>
				<SafeAreaView style={styles.container}>
					<Text style={styles.loading}>Loading GrowthBook...</Text>
				</SafeAreaView>
			</SafeAreaProvider>
		)
	}

	return (
		<SafeAreaProvider>
			<GrowthBookProvider growthbook={gb}>
				<DevToolsBridge />
				<SafeAreaView style={styles.container}>
					<ScrollView contentContainerStyle={styles.scrollContent}>
						<Text style={styles.title}>GrowthBook Plugin Example</Text>
						<Text style={styles.subtitle}>
							Open Rozenite DevTools to inspect features, experiments, and attributes.
						</Text>
						<FeatureDisplay />
					</ScrollView>
				</SafeAreaView>
			</GrowthBookProvider>
		</SafeAreaProvider>
	)
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#222240',
		borderColor: '#333355',
		borderRadius: 8,
		borderWidth: 1,
		marginBottom: 8,
		padding: 16,
	},
	cardName: {
		color: '#e0e0f0',
		fontFamily: 'monospace',
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 4,
	},
	cardRow: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	cardType: {
		backgroundColor: '#1a1a2e',
		borderRadius: 4,
		color: '#8888aa',
		fontSize: 12,
		overflow: 'hidden',
		paddingHorizontal: 8,
		paddingVertical: 2,
	},
	cardValue: {
		color: '#a8db8f',
		fontFamily: 'monospace',
		fontSize: 14,
	},
	container: {
		backgroundColor: '#1a1a2e',
		flex: 1,
	},
	loading: {
		color: '#8888aa',
		fontSize: 16,
		marginTop: 100,
		textAlign: 'center',
	},
	scrollContent: {
		padding: 20,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		color: '#6366f1',
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
	},
	subtitle: {
		color: '#8888aa',
		fontSize: 14,
		marginBottom: 24,
	},
	title: {
		color: '#e0e0f0',
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
	},
})
