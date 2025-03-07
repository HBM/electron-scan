declare namespace Electron {
    interface NativeImage {}
}

// @ts-ignore
const electronRemote = require('@electron/remote');
const { desktopCapturer, dialog, Menu } = electronRemote;
// @ts-ignore
const { writeFile } = require('fs');

interface DesktopCapturerSource {
    id: string;
    name: string;
    thumbnail: Electron.NativeImage;
    display_id?: string;
    appIcon?: Electron.NativeImage;
}

console.log('Renderer script loading');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded - initializing screen recorder');
    // Buttons
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
    const videoSelectBtn = document.getElementById('videoSelectBtn') as HTMLButtonElement;

    if (!videoElement || !startBtn || !stopBtn || !videoSelectBtn) {
        console.error('Could not find all required elements:', {
            videoElement: !!videoElement,
            startBtn: !!startBtn,
            stopBtn: !!stopBtn,
            videoSelectBtn: !!videoSelectBtn
        });
        return;
    }

    // Initial button state
    startBtn.disabled = true;
    stopBtn.disabled = true;

    let mediaRecorder: MediaRecorder | null = null; // MediaRecorder instance to capture footage
    const recordedChunks: Blob[] = [];

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

    // Get available video sources
    async function getVideoSources(): Promise<void> {
        try {
            console.log('Getting video sources...');
            const inputSources = await desktopCapturer.getSources({
                types: ['window', 'screen']
            });

            console.log('Found sources:', inputSources.length);

            const videoOptionsMenu = Menu.buildFromTemplate(
                inputSources.map((source: DesktopCapturerSource) => {
                    return {
                        label: source.name,
                        click: () => selectSource(source)
                    };
                })
            );

            videoOptionsMenu.popup();
        } catch (err) {
            console.error('Error getting video sources:', err);
        }
    }

    // Function to start recording
    function startRecording(): void {
        console.log('Starting recording, recorder available:', !!mediaRecorder);
        if (!mediaRecorder) {
            console.error('No media source selected');
            return;
        }

        // Clear previous recording chunks
        recordedChunks.length = 0;
        console.log('Starting media recorder');

        try {
            mediaRecorder.start();
            startBtn.disabled = true;
            stopBtn.disabled = false;
            startBtn.classList.add('is-danger');
            startBtn.innerText = 'Recording';
            console.log('Recording started');
        } catch (err) {
            console.error('Error starting recording:', err);
        }
    }

    // Function to stop recording
    function stopRecording(): void {
        console.log('Stopping recording, recorder available:', !!mediaRecorder);
        if (!mediaRecorder) {
            console.error('No media source selected');
            return;
        }

        try {
            mediaRecorder.stop();
            startBtn.disabled = false;
            stopBtn.disabled = true;
            startBtn.classList.remove('is-danger');
            startBtn.innerText = 'Start';
            console.log('Recording stopped');
        } catch (err) {
            console.error('Error stopping recording:', err);
        }
    }

    // Change videoSource window to record
    async function selectSource(source: DesktopCapturerSource): Promise<void> {
        console.log('Source selected:', source.name);
        videoSelectBtn.innerText = source.name;

        try {
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

            console.log('Getting user media with constraints');
            // Create a Stream
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Stream obtained:', !!stream);

            // Preview source in a video element
            videoElement.srcObject = stream;
            videoElement.play();

            // Create Media Recorder
            const options = { mimeType: 'video/webm; codecs=vp9' };
            mediaRecorder = new MediaRecorder(stream, options);
            console.log('Media recorder created');

            // Register Event Handlers
            mediaRecorder.ondataavailable = handleDataAvailable;
            mediaRecorder.onstop = handleStop;

            // Enable start button
            startBtn.disabled = false;
            stopBtn.disabled = true;
        } catch (err) {
            console.error('Error selecting source:', err);
        }
    }

    // Captures all recorded chunks
    function handleDataAvailable(e: BlobEvent): void {
        console.log('Video data available, size:', e.data.size);
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    }

    // Save video file on stop
    async function handleStop(e: Event): Promise<void> {
        console.log('Handle stop called, chunks:', recordedChunks.length);
        if (recordedChunks.length === 0) {
            console.error('No recorded data available');
            return;
        }

        try {
            const blob = new Blob(recordedChunks, {
                type: 'video/webm; codecs=vp9'
            });

            console.log('Creating buffer from blob');
            const buffer = Buffer.from(await blob.arrayBuffer());

            console.log('Showing save dialog');
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
        } catch (err) {
            console.error('Error in handleStop:', err);
        }
    }
});