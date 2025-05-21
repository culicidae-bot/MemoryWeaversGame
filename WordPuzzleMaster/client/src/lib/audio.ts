// Audio files
const audioFiles = {
  background: 'https://cdn.freesound.org/previews/499/499906_4679826-lq.mp3',
  correct: 'https://cdn.freesound.org/previews/146/146717_2615011-lq.mp3',
  error: 'https://cdn.freesound.org/previews/262/262313_3263906-lq.mp3',
  select: 'https://cdn.freesound.org/previews/521/521973_7724198-lq.mp3',
  shuffle: 'https://cdn.freesound.org/previews/442/442749_9159316-lq.mp3',
  success: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3',
  hint: 'https://cdn.freesound.org/previews/264/264828_3263906-lq.mp3',
  levelComplete: 'https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3'
};

// Audio elements for different sounds
const audioElements: Record<string, HTMLAudioElement | null> = {
  background: null,
  correct: null,
  error: null,
  select: null,
  shuffle: null, 
  success: null,
  hint: null,
  levelComplete: null
};

// Initialize all audio elements when needed
const initAudio = (type: keyof typeof audioFiles) => {
  if (!audioElements[type]) {
    const audio = new Audio(audioFiles[type]);
    
    // Set properties based on sound type
    if (type === 'background') {
      audio.loop = true;
      audio.volume = 0.4;
    } else {
      audio.volume = 0.7;
    }
    
    audioElements[type] = audio;
  }
  
  return audioElements[type];
};

// Play background music
export const playBackgroundMusic = () => {
  try {
    const music = initAudio('background');
    if (music) {
      // Only play if not already playing
      if (music.paused) {
        music.play().catch(error => {
          console.log('Background music could not play automatically:', error);
        });
      }
    }
  } catch (error) {
    console.error('Error playing background music:', error);
  }
};

// Pause background music
export const pauseBackgroundMusic = () => {
  const music = audioElements.background;
  if (music && !music.paused) {
    music.pause();
  }
};

// Play sound effects
export const playSoundEffect = (
  type: 'correct' | 'error' | 'select' | 'shuffle' | 'success' | 'hint' | 'levelComplete'
) => {
  try {
    // Get sound settings from localStorage
    const sfxEnabled = localStorage.getItem('sfxEnabled') !== 'false';
    
    if (!sfxEnabled) return;
    
    const sound = initAudio(type);
    if (sound) {
      // Reset to beginning if already playing
      sound.currentTime = 0;
      sound.play().catch(error => {
        console.log(`Sound effect ${type} could not play:`, error);
      });
    }
  } catch (error) {
    console.error(`Error playing sound effect ${type}:`, error);
  }
};

// Set sound settings
export const setSoundSettings = (settings: { music: boolean; sfx: boolean }) => {
  localStorage.setItem('musicEnabled', settings.music.toString());
  localStorage.setItem('sfxEnabled', settings.sfx.toString());
  
  if (settings.music) {
    playBackgroundMusic();
  } else {
    pauseBackgroundMusic();
  }
};

// Clean up audio resources
export const cleanupAudio = () => {
  Object.values(audioElements).forEach(audio => {
    if (audio) {
      audio.pause();
      audio.src = '';
    }
  });
};
