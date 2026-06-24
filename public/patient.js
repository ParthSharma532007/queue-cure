const socket = io();

// DOM Elements
const connStatus = document.getElementById('connection-status');
const servingDisplay = document.getElementById('serving-display');
const patientQueueBody = document.getElementById('patient-queue-body');
const queueBadge = document.getElementById('queue-badge');
const myTokenSelect = document.getElementById('my-token-select');
const personalResult = document.getElementById('personal-result');

// Personal Card Elements
const pTokenBadge = document.getElementById('p-token-badge');
const pStatusBadge = document.getElementById('p-status-badge');
const pWelcomeName = document.getElementById('p-welcome-name');
const pPositionInfo = document.getElementById('p-position-info');
const pTimeInfo = document.getElementById('p-time-info');
const pClockInfo = document.getElementById('p-clock-info');

const stepQueue = document.getElementById('step-queue');
const stepNext = document.getElementById('step-next');
const stepCabin = document.getElementById('step-cabin');

const voiceToggle = document.getElementById('voice-toggle');

// Local cached state
let appState = null;
let mySelectedToken = localStorage.getItem('my_clinic_token') || '';

// Connection states
socket.on('connect', () => {
  connStatus.textContent = 'Live Connected';
  connStatus.parentElement.querySelector('.status-dot').style.backgroundColor = 'var(--success)';
});

socket.on('disconnect', () => {
  connStatus.textContent = 'Connection lost. Reconnecting...';
  connStatus.parentElement.querySelector('.status-dot').style.backgroundColor = 'var(--danger)';
});

// Update logic
socket.on('stateUpdate', (state) => {
  appState = state;
  updateServingDisplay(state.serving);
  updateQueueBoard(state.queue);
  populateTokenDropdown(state.queue, state.serving);
  updatePersonalTracker();
});

// Play audio & voice chime on patientCalled
socket.on('patientCalled', (data) => {
  if (voiceToggle.checked) {
    playChime();
    
    // Slight delay after chime before speaking to make it clear and premium
    setTimeout(() => {
      speakToken(data.token, data.name);
    }, 850);
  }
});

// Update serving header banner
function updateServingDisplay(serving) {
  if (!serving) {
    servingDisplay.innerHTML = `
      <div class="empty-serving">Waiting for next patient...</div>
    `;
    return;
  }
  
  servingDisplay.innerHTML = `
    <div class="serving-token">#${serving.token}</div>
    <div class="serving-name">${serving.name}</div>
    <div style="font-size: 0.95rem; opacity: 0.8; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-top: 0.5rem;">
      Please proceed to doctor's cabin
    </div>
  `;
}

// Format Clock Time (e.g. 5:45 PM)
function formatClockTime(timestamp) {
  const d = new Date(timestamp);
  let hrs = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  hrs = hrs ? hrs : 12; // 0 should be 12
  return `${hrs}:${mins} ${ampm}`;
}

// Update the general board listing
function updateQueueBoard(queue) {
  patientQueueBody.innerHTML = '';
  queueBadge.textContent = `${queue.length} Patients Waiting`;
  
  if (queue.length === 0) {
    patientQueueBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          No patients waiting in queue.
        </td>
      </tr>
    `;
    return;
  }

  queue.forEach((patient, index) => {
    const tr = document.createElement('tr');
    const isNext = index === 0;
    
    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--primary);">#${patient.token}</td>
      <td style="font-weight: 600;">${patient.name}</td>
      <td style="font-weight: 700; color: ${isNext ? 'var(--success-dark)' : 'var(--text-main)'};">
        ~${patient.estimatedWait} mins
      </td>
      <td>
        <span style="display: inline-block; padding: 0.2rem 0.6rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; 
          background: ${isNext ? 'var(--primary-light)' : '#f1f5f9'};
          color: ${isNext ? 'var(--primary)' : 'var(--text-secondary)'};">
          ${isNext ? 'Next Up' : 'Waiting'}
        </span>
      </td>
    `;
    patientQueueBody.appendChild(tr);
  });
}

// Populate Token Selector Dropdown
function populateTokenDropdown(queue, serving) {
  // Store currently selected value
  const activeVal = myTokenSelect.value || mySelectedToken;
  
  myTokenSelect.innerHTML = '<option value="">-- Choose Token --</option>';
  
  // List serving patient first
  if (serving) {
    const opt = document.createElement('option');
    opt.value = serving.token;
    opt.textContent = `Token #${serving.token} (${serving.name}) [Serving]`;
    myTokenSelect.appendChild(opt);
  }
  
  // List waiting queue
  queue.forEach(patient => {
    const opt = document.createElement('option');
    opt.value = patient.token;
    opt.textContent = `Token #${patient.token} (${patient.name})`;
    myTokenSelect.appendChild(opt);
  });

  // Restore selection
  if (activeVal) {
    myTokenSelect.value = activeVal;
  }
}

// Track Token Selector changes
myTokenSelect.addEventListener('change', (e) => {
  mySelectedToken = e.target.value;
  localStorage.setItem('my_clinic_token', mySelectedToken);
  updatePersonalTracker();
});

// Update custom tracking details card
function updatePersonalTracker() {
  if (!mySelectedToken || !appState) {
    personalResult.style.display = 'none';
    return;
  }

  personalResult.style.display = 'block';
  pTokenBadge.textContent = `Token #${mySelectedToken}`;

  const { queue, serving } = appState;
  
  // Check if serving
  if (serving && serving.token === mySelectedToken) {
    pWelcomeName.textContent = `Hi ${serving.name}`;
    pStatusBadge.textContent = 'In Cabin';
    pStatusBadge.style.color = 'var(--success-dark)';
    pPositionInfo.innerHTML = '🎉 <strong>It is your turn!</strong> Please enter the doctor\'s cabin immediately.';
    pTimeInfo.textContent = 'Wait Time: 0 mins';
    pClockInfo.textContent = '';
    
    // Stepper state
    stepQueue.className = 'step completed';
    stepNext.className = 'step completed';
    stepCabin.className = 'step active';
    return;
  }

  // Check waiting list
  const queueIndex = queue.findIndex(p => p.token === mySelectedToken);
  
  if (queueIndex !== -1) {
    const patient = queue[queueIndex];
    pWelcomeName.textContent = `Hi ${patient.name}`;
    
    const isNext = queueIndex === 0;
    pStatusBadge.textContent = isNext ? 'Next Up' : 'In Queue';
    pStatusBadge.style.color = isNext ? 'var(--primary)' : 'var(--text-secondary)';
    
    if (isNext) {
      pPositionInfo.innerHTML = '👉 You are <strong>next in line</strong>. Please wait outside the cabin door.';
      stepQueue.className = 'step completed';
      stepNext.className = 'step active';
      stepCabin.className = 'step';
    } else {
      pPositionInfo.innerHTML = `You have <strong>${queueIndex} patient${queueIndex > 1 ? 's' : ''}</strong> ahead of you.`;
      stepQueue.className = 'step active';
      stepNext.className = 'step';
      stepCabin.className = 'step';
    }

    pTimeInfo.textContent = `Estimated Wait: ~${patient.estimatedWait} mins`;
    
    // Calculate exact clock time
    const appointmentTimeMs = Date.now() + (patient.estimatedWait * 60 * 1000);
    pClockInfo.textContent = `Approx. Appointment Time: ${formatClockTime(appointmentTimeMs)}`;
  } else {
    // Not found in active queue
    pWelcomeName.textContent = 'Token Inactive';
    pStatusBadge.textContent = 'Completed / Cancelled';
    pStatusBadge.style.color = 'var(--text-muted)';
    pPositionInfo.textContent = 'Your token is not in today\'s active waiting directory. It may have been completed, marked as no-show, or deleted.';
    pTimeInfo.textContent = 'Wait Time: --';
    pClockInfo.textContent = '';
    
    stepQueue.className = 'step';
    stepNext.className = 'step';
    stepCabin.className = 'step';
  }
}

// Synth Chime using Web Audio API
function playChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  
  try {
    const ctx = new AudioContext();
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.type = 'sine';
    // Arpeggiated C-Major Chord (C5 -> E5 -> G5)
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(261.63, ctx.currentTime); // C4 support note
    
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    
    osc1.stop(ctx.currentTime + 0.9);
    osc2.stop(ctx.currentTime + 0.9);
  } catch (err) {
    console.error('AudioContext error:', err);
  }
}

// Text-to-Speech Token Announcement
function speakToken(token, name) {
  if (!('speechSynthesis' in window)) return;
  
  // Cancel any ongoing speech so it does not queue up
  window.speechSynthesis.cancel();
  
  const textToSpeak = `Token number ${parseInt(token)}, ${name}. Please proceed to doctor's cabin.`;
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  
  // Set clean parameters
  utterance.rate = 0.95; // Slightly slower for readability
  utterance.pitch = 1.0;
  
  // Try to find a local english voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.lang.includes('en-IN') || voice.lang.includes('en-GB') || voice.lang.includes('en-US')
  );
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  window.speechSynthesis.speak(utterance);
}
// Trigger voice initialization on page load (speech synthesis sometimes needs user-interaction or quick load triggers)
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}
