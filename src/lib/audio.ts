export async function playPCMAudio(base64Data: string, sampleRate: number = 24000) {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  const audioBuffer = audioContext.createBuffer(1, bytes.length / 2, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Convert 16-bit PCM to float32
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < channelData.length; i++) {
    channelData[i] = view.getInt16(i * 2, true) / 32768;
  }

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  
  return { source, audioContext };
}
