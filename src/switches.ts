import { app } from 'electron';

/** applies command line switches to the app based on the passed userprefs */
export function applyCommandLineSwitches(userPrefs: UserPrefs) {

	// works as a cli flag, but not w/ appendSwitch. why.
	// app.commandLine.appendSwitch("ozone-platform", "x11")

	app.commandLine.appendSwitch('disable-breakpad');
	app.commandLine.appendSwitch('disable-logging');
	app.commandLine.appendSwitch('disable-2d-canvas-clip-aa');
	app.commandLine.appendSwitch('disable-hang-monitor');
	app.commandLine.appendSwitch('no-pings');
	console.log('Removed useless features');

	// Don't require user gesture for autoplay (thanks Commander)
	app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
	
	if (userPrefs.safeFlags_disableBackgrounding) {
		app.commandLine.appendSwitch('disable-background-timer-throttling');
		app.commandLine.appendSwitch('disable-renderer-backgrounding');

		console.log('Applied flags to disable background throttling');
	}
	if (userPrefs.experimentalFlags_increaseLimits) {
		app.commandLine.appendSwitch('renderer-process-limit', '100');
		app.commandLine.appendSwitch('ignore-gpu-blocklist');

		console.log('Applied flags to increase limits');
	}
	if (userPrefs.experimentalFlags_experimental) {
		app.commandLine.appendSwitch('enable-native-gpu-memory-buffers'); // linux-specific
		app.commandLine.appendSwitch('ignore-gpu-blocklist');

		app.commandLine.appendSwitch('disable-best-effort-tasks');
		app.commandLine.appendSwitch('raise-timer-frequency');
		app.commandLine.appendSwitch('force-high-performance-gpu');
		console.log('Enabled Experiments');
	}
	if (userPrefs.safeFlags_gpuRasterizing) {
		// do they crash the game? not for me. do they actually help? yeah kind of. depending on your gpu etc.
		app.commandLine.appendSwitch('enable-gpu-rasterization');
		// app.commandLine.appendSwitch('disable-zero-copy');
		app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds');
		app.commandLine.appendSwitch('disable-software-rasterizer');
		console.log('GPU rasterization active');
	}

	if (userPrefs.fpsUncap) {
		app.commandLine.appendSwitch('disable-frame-rate-limit');
		app.commandLine.appendSwitch('disable-gpu-vsync');
		console.log('Removed FPS Cap');
	}

	if (userPrefs.inProcessGPU) {
		app.commandLine.appendSwitch('in-process-gpu');
		console.log('In Process GPU is active');
	}
}
