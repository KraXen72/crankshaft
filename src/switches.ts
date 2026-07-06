import { app } from 'electron';

/** applies command line switches to the app based on the passed userprefs */
export function applyCommandLineSwitches(userPrefs: UserPrefs) {
	// app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform,WaylandWindowDecorations');
	// app.commandLine.appendSwitch('ozone-platform', 'wayland');

	// app.commandLine.appendSwitch('ozone-platform-hint', 'auto');

	if (userPrefs.safeFlags_removeUselessFeatures) {
		app.commandLine.appendSwitch('disable-breakpad');
		app.commandLine.appendSwitch('disable-print-preview');
		app.commandLine.appendSwitch('disable-metrics-repo');
		app.commandLine.appendSwitch('disable-metrics');
		app.commandLine.appendSwitch('disable-2d-canvas-clip-aa');
		app.commandLine.appendSwitch('disable-bundled-ppapi-flash');
		app.commandLine.appendSwitch('disable-logging');
		app.commandLine.appendSwitch('disable-component-update');
		app.commandLine.appendSwitch('no-pings');

		if (process.platform === 'darwin') app.commandLine.appendSwitch('disable-dev-shm-usage');

		console.log('Removed useless features');
	}
	if (userPrefs.safeFlags_helpfulFlags) {
		app.commandLine.appendSwitch('disable-background-timer-throttling');
		app.commandLine.appendSwitch('disable-renderer-backgrounding');

		// Don't require user gesture for autoplay (thanks Commander)
		app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

		console.log('Applied helpful flags');
	}
	if (userPrefs.experimentalFlags_increaseLimits) {
		app.commandLine.appendSwitch('renderer-process-limit', '100');
		app.commandLine.appendSwitch('ignore-gpu-blocklist');

		console.log('Applied flags to increase limits');
	}
	if (userPrefs.experimentalFlags_experimental) {
		// do they crash the game? not for me. do they actually help? ¯\_(ツ)_/¯
		app.commandLine.appendSwitch('enable-native-gpu-memory-buffers'); // linux-specific
		app.commandLine.appendSwitch('ignore-gpu-blocklist');
		// disable-canvas-aa

		console.log('Enabled Experiments');
	}
	if (userPrefs.safeFlags_gpuRasterizing) {
		// do they crash the game? not for me. do they actually help? yeah kind of. depending on your gpu etc.
		app.commandLine.appendSwitch('enable-gpu-rasterization');
		app.commandLine.appendSwitch('disable-zero-copy'); // this is really important, otherwise the game crashes. // <- probably not a good idea
		console.log('GPU rasterization active');
	}

	if (userPrefs.fpsUncap) {
		app.commandLine.appendSwitch('disable-frame-rate-limit');
		app.commandLine.appendSwitch('disable-gpu-vsync');
		app.commandLine.appendSwitch('max-gum-fps', '9999');
		app.commandLine.appendSwitch('enable-features', 'ImplLatencyRecovery,MainLatencyRecovery');
		console.log('Removed FPS Cap');
	}

	if (userPrefs['angle-backend'] !== 'default') {
		if (userPrefs['angle-backend'] === 'vulkan') {
			app.commandLine.appendSwitch('use-vulkan');
			app.commandLine.appendSwitch('enable-features', 'Vulkan');
		}

		app.commandLine.appendSwitch('use-angle', userPrefs['angle-backend'] as string);

		console.log(`Using Angle: ${userPrefs['angle-backend']}`);
	}
	if (userPrefs.inProcessGPU) {
		app.commandLine.appendSwitch('in-process-gpu');
		console.log('In Process GPU is active');
	}
}
