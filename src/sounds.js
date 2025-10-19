export const playSound = (type) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    
    if (type === 'newOrder') {
      // Due bip per nuovo ordine
      [800, 600].forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.15);
        
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.15);
      });
    } 
    else if (type === 'ready') {
      // Tre bip per ordine pronto
      [1000, 1200, 1000].forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.1);
        
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.1);
      });
    }
  } catch (error) {
    console.log('Suono non disponibile');
  }
};
