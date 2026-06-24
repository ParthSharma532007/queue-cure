const socket = io();

// DOM Elements
const connStatus = document.getElementById('connection-status');
const patientNameInput = document.getElementById('patient-name');
const intakeForm = document.getElementById('intake-form');

const statServing = document.getElementById('stat-serving');
const statWaiting = document.getElementById('stat-waiting');
const statAvgTime = document.getElementById('stat-avg-time');
const statCompleted = document.getElementById('stat-completed');

const activeToken = document.getElementById('active-token');
const activeName = document.getElementById('active-name');

const btnCallNext = document.getElementById('btn-call-next');
const btnRecall = document.getElementById('btn-recall');
const btnNoShow = document.getElementById('btn-no-show');
const btnReset = document.getElementById('btn-reset');

const consultationSlider = document.getElementById('consultation-slider');
const sliderVal = document.getElementById('slider-val');
const engineStatus = document.getElementById('engine-status');

const queueCount = document.getElementById('queue-count');
const queueBody = document.getElementById('queue-body');
const toastContainer = document.getElementById('toast-container');

// Local cached state
let currentQueue = [];
let currentServing = null;
let currentSliderValue = 10;

// Socket connection feedback
socket.on('connect', () => {
  connStatus.textContent = 'Live Connected';
  connStatus.parentElement.querySelector('.status-dot').style.backgroundColor = 'var(--success)';
  showToast('Connected to live server', 'success');
});

socket.on('disconnect', () => {
  connStatus.textContent = 'Disconnected. Retrying...';
  connStatus.parentElement.querySelector('.status-dot').style.backgroundColor = 'var(--danger)';
  showToast('Lost server connection', 'error');
});

// Toast notification helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>💬</span> ${message}`;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Intake logic (Speed optimization: under 1 second workflow)
intakeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = patientNameInput.value.trim();
  if (name) {
    socket.emit('addPatient', { name });
    patientNameInput.value = '';
    patientNameInput.focus(); // Re-focus instantly for rapid entry
  }
});

// Doctor Controls
btnCallNext.addEventListener('click', () => {
  socket.emit('callNext');
});

btnRecall.addEventListener('click', () => {
  socket.emit('recallCurrent');
});

btnNoShow.addEventListener('click', () => {
  if (currentServing) {
    socket.emit('markNoShow');
  } else {
    showToast('No active patient to mark as no-show', 'error');
  }
});

btnReset.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the entire queue and reset token counts? This cannot be undone.')) {
    socket.emit('resetQueue');
  }
});

// Settings adjustment
consultationSlider.addEventListener('input', (e) => {
  const val = e.target.value;
  sliderVal.textContent = `${val} mins`;
  socket.emit('updateSettings', { avgConsultationTime: val });
});

// Socket State updates
socket.on('stateUpdate', (state) => {
  const { queue, serving, completedCount, avgConsultationTimeSetting, rollingAverage, nextTokenNumber } = state;
  
  currentQueue = queue;
  currentServing = serving;

  // Update Stats Counters
  statServing.textContent = serving ? `#${serving.token}` : '-';
  statWaiting.textContent = queue.length;
  statCompleted.textContent = completedCount;

  // Show active cabin state
  if (serving) {
    activeToken.textContent = `#${serving.token}`;
    activeName.textContent = serving.name;
    activeToken.style.color = 'var(--success-dark)';
  } else {
    activeToken.textContent = '-';
    activeName.textContent = 'No Patient Active';
    activeToken.style.color = 'var(--text-muted)';
  }

  // Update target timing display
  consultationSlider.value = avgConsultationTimeSetting;
  sliderVal.textContent = `${avgConsultationTimeSetting} mins`;
  
  if (rollingAverage === avgConsultationTimeSetting) {
    statAvgTime.textContent = `${avgConsultationTimeSetting}m`;
    engineStatus.textContent = `Using manual target setting (${avgConsultationTimeSetting}m)`;
  } else {
    statAvgTime.textContent = `${rollingAverage}m`;
    engineStatus.textContent = `Using real-time data: ${rollingAverage}m average based on actual consultations.`;
  }

  // Render wait list body
  queueCount.textContent = `${queue.length} waiting`;
  renderQueueTable(queue);
});

// Helper to format timestamp
function formatTime(timestamp) {
  const d = new Date(timestamp);
  const hrs = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${hrs}:${mins}`;
}

// Queue Table Renderer
function renderQueueTable(queue) {
  queueBody.innerHTML = '';
  
  if (queue.length === 0) {
    queueBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          No patients in queue. Type a name above to add.
        </td>
      </tr>
    `;
    return;
  }

  queue.forEach((patient, index) => {
    const tr = document.createElement('tr');
    
    // Action permissions
    const isFirst = index === 0;
    const isLast = index === queue.length - 1;

    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--primary);">#${patient.token}</td>
      <td style="font-weight: 600;">${patient.name}</td>
      <td style="color: var(--text-secondary); font-size: 0.85rem;">${formatTime(patient.joinedAt)}</td>
      <td style="font-weight: 700; color: ${patient.estimatedWait <= 5 ? 'var(--success-dark)' : 'var(--text-main)'};">
        ${patient.estimatedWait} mins
      </td>
      <td>
        <div style="display: flex; gap: 0.25rem; justify-content: center;">
          <button class="btn btn-secondary btn-icon" onclick="movePatient(${index}, -1)" ${isFirst ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>▲</button>
          <button class="btn btn-secondary btn-icon" onclick="movePatient(${index}, 1)" ${isLast ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>▼</button>
        </div>
      </td>
      <td style="text-align: center;">
        <button class="btn btn-secondary btn-icon delete" onclick="removePatient('${patient.id}')">✕</button>
      </td>
    `;
    queueBody.appendChild(tr);
  });
}

// Order mutation functions
window.movePatient = (index, direction) => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= currentQueue.length) return;

  // Swap elements in order
  const ids = currentQueue.map(p => p.id);
  const temp = ids[index];
  ids[index] = ids[targetIndex];
  ids[targetIndex] = temp;

  socket.emit('reorderQueue', ids);
};

window.removePatient = (id) => {
  if (confirm('Remove this patient from the waiting queue?')) {
    socket.emit('removePatient', id);
  }
};

// Keyboard shortcut helper for busy receptionists
document.addEventListener('keydown', (e) => {
  // Ctrl + Shift + Space calls the next patient
  if (e.ctrlKey && e.shiftKey && e.code === 'Space') {
    e.preventDefault();
    socket.emit('callNext');
    showToast('Keyboard command triggered: Call Next', 'info');
  }
});
