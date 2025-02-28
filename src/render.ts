export {};

declare global {
    interface Window {
        testButtons: () => void;
    }
}

const { desktopCapturer, dialog, Menu } = require('@electron/remote');
const { writeFile } = require('fs');

interface DesktopCapturerSource {
    id: string;
    name: string;
    thumbnail: Electron.NativeImage;
    display_id?: string;
    appIcon?: Electron.NativeImage;
}

document.addEventListener('DOMContentLoaded', () => {
    // Buttons
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
    const videoSelectBtn = document.getElementById('videoSelectBtn') as HTMLButtonElement;

    // Initial button state
    startBtn.disabled = true;
    stopBtn.disabled = true;

    // Setup event handlers
    videoSelectBtn.addEventListener('click', () => {
        console.log('Video select button clicked');
        getVideoSources();
    });
    
    startBtn.addEventListener('click', () => {
        console.log('Start button clicked');
        startRecording();
    });
    
    stopBtn.addEventListener('click', () => {
        console.log('Stop button clicked');
        stopRecording();
    });

    // Add manual test
    window.testButtons = function() {
        console.log('Testing buttons');
        console.log('videoSelectBtn:', videoSelectBtn);
        console.log('startBtn:', startBtn);
        console.log('stopBtn:', stopBtn);
    };

    let mediaRecorder: MediaRecorder | null = null; // MediaRecorder instance to capture footage
    const recordedChunks: Blob[] = [];

    // Get available video sources
    async function getVideoSources(): Promise<void> {
        const inputSources = await desktopCapturer.getSources({
            types: ['window', 'screen']
        });

        const videoOptionsMenu = Menu.buildFromTemplate(
            inputSources.map((source: DesktopCapturerSource) => { // JS array map method
                return {
                    label: source.name,
                    click: () => selectSource(source)
                };
            })
        );

        videoOptionsMenu.popup();
    }

    // Function to start recording
    function startRecording(): void {
        if (!mediaRecorder) {
            console.error('No media source selected');
            return;
        }

        // Clear previous recording chunks
        recordedChunks.length = 0;

        mediaRecorder.start();
        startBtn.disabled = true;
        stopBtn.disabled = false;
        startBtn.classList.add('is-danger');
        startBtn.innerText = 'Recording';
    }

    // Function to stop recording
    function stopRecording(): void {
        if (!mediaRecorder) {
            console.error('No media source selected');
            return;
        }

        mediaRecorder.stop();
        startBtn.disabled = false;
        stopBtn.disabled = true;
        startBtn.classList.remove('is-danger');
        startBtn.innerText = 'Start';
    }

    // Change videoSource window to record
    async function selectSource(source: DesktopCapturerSource): Promise<void> {
        videoSelectBtn.innerText = source.name;

        const constraints: MediaStreamConstraints = {
            audio: false,
            video: {
                // @ts-ignore: Electron-specific properties
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: source.id
                }
            } as MediaTrackConstraints
        };

        // Create a Stream
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Preview source in a video element
        videoElement.srcObject = stream;
        videoElement.play();

        // Create Media Recorder
        const options = { mimeType: 'video/webm; codecs=vp9' };
        mediaRecorder = new MediaRecorder(stream, options);

        // Register Event Handlers
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.onstop = handleStop;

        // Enable start button
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }

    // Captures all recorded chunks
    function handleDataAvailable(e: BlobEvent): void {
        console.log('video data available');
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    }

    // Save video file on stop
    async function handleStop(e: Event): Promise<void> {
        if (recordedChunks.length === 0) {
            console.error('No recorded data available');
            return;
        }

        const blob = new Blob(recordedChunks, {
            type: 'video/webm; codecs=vp9'
        });

        const buffer = Buffer.from(await blob.arrayBuffer());

        const { filePath, canceled } = await dialog.showSaveDialog({
            buttonLabel: 'Save video',
            defaultPath: `vid-${Date.now()}.webm`,
            filters: [{
                name: 'WebM files',
                extensions: ['webm']
            }]
        });

        if (canceled || !filePath) {
            console.log('Save canceled');
            return;
        }

        console.log('Saving to:', filePath);

        writeFile(filePath, buffer, (err: any) => {
            if (err) {
                console.error('Failed to save video:', err);
            } else {
                console.log('Video saved successfully!');
                recordedChunks.length = 0; // Clear the chunks after successful save
            }
        });
    }
});

(window as any).testButtons = function() {
    console.log('Testing buttons from global scope');
};