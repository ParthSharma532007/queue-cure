const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// State management
let queue = []; // Array of waiting patients
let serving = null; // Currently serving patient
let completedCount = 0;
let tokenCounter = 1;

// Configuration
let avgConsultationTimeSetting = 10; // Default: 10 mins (set by receptionist)
let actualConsultationTimes = []; // Array of actual consultation times (in minutes)

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Calculate rolling average
function getRollingAverage() {
  if (actualConsultationTimes.length === 0) {
    return avgConsultationTimeSetting;
  }
  const sum = actualConsultationTimes.reduce((a, b) => a + b, 0);
  return parseFloat((sum / actualConsultationTimes.length).toFixed(1));
}

// Calculate individual patient wait times (in minutes)
function calculateWaitTimes() {
  const avg = getRollingAverage();
  const now = Date.now();

  let remainingTime = avg;
  if (serving && serving.calledAt) {
    const timeSpent = (now - serving.calledAt) / (60 * 1000);
    remainingTime = Math.max(1, avg - timeSpent); // Minimum 1 minute remaining
  } else if (!serving) {
    remainingTime = 0; // If no one is being served, first in line gets seen immediately
  }

  return queue.map((patient, index) => {
    let waitTime = 0;
    if (index === 0) {
      waitTime = Math.round(remainingTime);
    } else {
      waitTime = Math.round(remainingTime + index * avg);
    }
    return {
      ...patient,
      estimatedWait: waitTime
    };
  });
}

function getAppState() {
  const rollingAverage = getRollingAverage();
  const queueWithWaits = calculateWaitTimes();
  return {
    queue: queueWithWaits,
    serving,
    completedCount,
    avgConsultationTimeSetting,
    rollingAverage,
    nextTokenNumber: tokenCounter
  };
}

function broadcastState() {
  io.emit('stateUpdate', getAppState());
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial state on connection
  socket.emit('stateUpdate', getAppState());

  // Add Patient
  socket.on('addPatient', (data) => {
    const { name } = data;
    if (!name || name.trim() === '') return;

    // Pad token number to 2 digits (e.g. 01, 02...)
    const tokenStr = tokenCounter.toString().padStart(2, '0');
    
    const newPatient = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      token: tokenStr,
      joinedAt: Date.now(),
      status: 'waiting'
    };

    queue.push(newPatient);
    tokenCounter++;

    broadcastState();
  });

  // Call Next
  socket.on('callNext', () => {
    const now = Date.now();

    // If there was a patient being served, calculate consultation duration
    if (serving) {
      const durationMs = now - serving.calledAt;
      const durationMins = durationMs / (60 * 1000);
      
      // Record consultation times (from 10 seconds up to 2 hours)
      if (durationMins >= 0.1 && durationMins <= 120) {
        actualConsultationTimes.push(durationMins);
        // Keep only last 5 actual times for a rolling average
        if (actualConsultationTimes.length > 5) {
          actualConsultationTimes.shift();
        }
      }
      completedCount++;
    }

    if (queue.length > 0) {
      serving = queue.shift();
      serving.calledAt = now;
      serving.status = 'serving';

      broadcastState();
      // Emit a separate call event for speech synthesis and chimes
      io.emit('patientCalled', {
        name: serving.name,
        token: serving.token
      });
    } else {
      serving = null;
      broadcastState();
    }
  });

  // Recall Current (triggers announcement again)
  socket.on('recallCurrent', () => {
    if (serving) {
      io.emit('patientCalled', {
        name: serving.name,
        token: serving.token
      });
    }
  });

  // Mark No Show
  socket.on('markNoShow', () => {
    if (serving) {
      serving = null;
      broadcastState();
    }
  });

  // Remove/Cancel patient from queue
  socket.on('removePatient', (id) => {
    queue = queue.filter(p => p.id !== id);
    broadcastState();
  });

  // Reorder queue
  socket.on('reorderQueue', (newOrderIds) => {
    if (!Array.isArray(newOrderIds)) return;
    
    const reordered = [];
    newOrderIds.forEach(id => {
      const found = queue.find(p => p.id === id);
      if (found) reordered.push(found);
    });

    queue.forEach(p => {
      if (!reordered.find(r => r.id === p.id)) {
        reordered.push(p);
      }
    });

    queue = reordered;
    broadcastState();
  });

  // Update Settings
  socket.on('updateSettings', (data) => {
    const { avgConsultationTime } = data;
    const value = parseInt(avgConsultationTime);
    if (!isNaN(value) && value > 0) {
      avgConsultationTimeSetting = value;
      broadcastState();
    }
  });

  // Reset queue (for start of day/demo reset)
  socket.on('resetQueue', () => {
    queue = [];
    serving = null;
    completedCount = 0;
    tokenCounter = 1;
    actualConsultationTimes = [];
    broadcastState();
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
