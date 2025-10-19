export const playSound = (type) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  if (type === 'newOrder') {
    // Suono per nuovo ordine (ding ding)
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.3);
  } 
  else if (type === 'ready') {
    // Suono per ordine pronto (beep beep)
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.2);
    
    osc.frequency.value = 1200;
    osc.start(audioContext.currentTime + 0.25);
    osc.stop(audioContext.currentTime + 0.45);
  }
};
