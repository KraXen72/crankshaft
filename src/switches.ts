import { app } from 'electron';

/// <reference path="global.d.ts" />

/** applies command line switches to the app based on the passed userprefs */
export function applyCommandLineSwitches(userPrefs: UserPrefs) {
	if (userPrefs.safeFlags_removeUselessFeatures) {
		app.commandLine.appendSwitch('disable-breakpad');
		app.commandLine.appendSwitch('disable-print-preview');
		app.commandLine.appendSwitch('disable-metrics-repo');
		app.commandLine.appendSwitch('disable-metrics');
		app.commandLine.appendSwitch('disable-2d-canvas-clip-aa');
		app.commandLine.appendSwitch('disable-bundled-ppapi-flash');
		app.commandLine.appendSwitch('disable-logging');
		app.commandLine.appendSwitch('disable-hang-monitor');
		app.commandLine.appendSwitch('disable-component-update');

		if (process.platform === 'darwin') app.commandLine.appendSwitch('disable-dev-shm-usage');

		console.log('Removed useless features');
	}
	if (userPrefs.safeFlags_helpfulFlags) {
		app.commandLine.appendSwitch('enable-javascript-harmony');
		app.commandLine.appendSwitch('enable-future-v8-vm-features');
		app.commandLine.appendSwitch('enable-webgl'); // might be useless since this is default but ensure
		app.commandLine.appendSwitch('enable-webgl2-compute-context');
		app.commandLine.appendSwitch('disable-background-timer-throttling');
		app.commandLine.appendSwitch('disable-renderer-backgrounding');

		// Don't require user gesture for autoplay (thanks Commander)
		app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');


		console.log('Applied helpful flags');
	}
	if (userPrefs.experimentalFlags_increaseLimits) {
		app.commandLine.appendSwitch('renderer-process-limit', '100');
		app.commandLine.appendSwitch('max-active-webgl-contexts', '100');
		app.commandLine.appendSwitch('webrtc-max-cpu-consumption-percentage', '100');
		app.commandLine.appendSwitch('ignore-gpu-blacklist');

		console.log('Applied flags to increase limits');
	}
	if (userPrefs.experimentalFlags_lowLatency) {
		app.commandLine.appendSwitch('enable-highres-timer'); // supposedly lowers latency
		app.commandLine.appendSwitch('enable-quic'); // enables an experimental low-latency protocol
		app.commandLine.appendSwitch('enable-accelerated-2d-canvas');

		console.log('Applied latency-reducing flags');
	}
	if (userPrefs.experimentalFlags_experimental) {
		// do they crash the game? not for me. do they actually help? ¯\_(ツ)_/¯
		app.commandLine.appendSwitch('disable-low-end-device-mode');
		app.commandLine.appendSwitch('enable-accelerated-video-decode');
		app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
		app.commandLine.appendSwitch('high-dpi-support', '1');
		app.commandLine.appendSwitch('ignore-gpu-blacklist');
		app.commandLine.appendSwitch('no-pings');
		app.commandLine.appendSwitch('no-proxy-server');

		// disable-canvas-aa

		console.log('Enabled Experiments');
	}
	if (userPrefs.safeFlags_gpuRasterizing) {
		// do they crash the game? not for me. do they actually help? yeah kind of. depending on your gpu etc.
		app.commandLine.appendSwitch('enable-gpu-rasterization');
		app.commandLine.appendSwitch('enable-oop-rasterization');
		app.commandLine.appendSwitch('disable-zero-copy'); // this is really important, otherwise the game crashes.
		console.log('GPU rasterization active');
	}

	if (userPrefs.fpsUncap) {
		app.commandLine.appendSwitch('disable-frame-rate-limit');
		app.commandLine.appendSwitch('disable-gpu-vsync');
		app.commandLine.appendSwitch('max-gum-fps', '9999');
		console.log('Removed FPS Cap');
	}

	if (userPrefs['angle-backend'] !== 'default') {
		if (userPrefs['angle-backend'] === 'vulkan') {
			app.commandLine.appendSwitch('use-angle', 'vulkan');
			app.commandLine.appendSwitch('use-vulkan');
			app.commandLine.appendSwitch('--enable-features=Vulkan');

			console.log('VULKAN INITIALIZED');
		} else {
			app.commandLine.appendSwitch('use-angle', userPrefs['angle-backend'] as string);

			console.log(`Using Angle: ${userPrefs['angle-backend']}`);
		}
	}
	if (userPrefs.inProcessGPU) {
		app.commandLine.appendSwitch('in-process-gpu');
		console.log('In Process GPU is active');
	}
}
