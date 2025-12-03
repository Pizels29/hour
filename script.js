// -----------------------------
// Data Initialization
// -----------------------------
let classes = JSON.parse(localStorage.getItem('classes') || '[]');
let streaks = JSON.parse(localStorage.getItem('streaks') || '{}');
let lastReselect = localStorage.getItem('lastReselect') || '';
let chosenClassObj = null;
let timerInterval = null;
let remainingSeconds = 3600; // default 1 hour
let isPaused = false;

// -----------------------------
// DOM Elements
// -----------------------------
const classesList = document.getElementById('classes-list');
const classNameInput = document.getElementById('class-name');
const nextTestInput = document.getElementById('next-test');
const confidenceInput = document.getElementById('confidence');
const chosenClassEl = document.getElementById('chosen-class');
const timerEl = document.getElementById('timer');
const pauseBtn = document.getElementById('pause-resume');
const classStreakEl = document.getElementById('class-streak');
const examDateDisplay = document.getElementById('exam-date-display');

// -----------------------------
// Helper Functions
// -----------------------------
function renderClasses() {
    const today = new Date();
    classesList.innerHTML = '';

    if(classes.length === 0) {
        classesList.innerHTML = '<p>No classes added yet.</p>';
        return;
    }

    // Filter out expired classes
    classes = classes.filter(c => new Date(c.nextTest) >= today);

    classes.forEach((c, index) => {
        const div = document.createElement('div');
        div.className = 'class-item';
        div.textContent = `${c.name} | Exam Date: ${c.nextTest} | Confidence: ${c.confidence}`;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => {
            classes.splice(index,1);
            localStorage.setItem('classes', JSON.stringify(classes));
            renderClasses();
        };
        div.appendChild(removeBtn);
        classesList.appendChild(div);
    });

    localStorage.setItem('classes', JSON.stringify(classes));
}

renderClasses();

// -----------------------------
// Add Class
// -----------------------------
document.getElementById('add-class').addEventListener('click', () => {
    const name = classNameInput.value.trim();
    const nextTest = nextTestInput.value;
    const confidence = parseInt(confidenceInput.value);

    if(!name || !nextTest || isNaN(confidence) || confidence < 1 || confidence > 10) {
        return alert('Fill all fields correctly! Confidence: 1-10');
    }

    classes.push({name, nextTest, confidence});
    localStorage.setItem('classes', JSON.stringify(classes));
    classNameInput.value = nextTestInput.value = confidenceInput.value = '';
    renderClasses();
});

// -----------------------------
// Weighted Random Class Selection
// -----------------------------
function selectClass() {
    if(classes.length === 0) return null;
    const today = new Date();

    let weights = classes.map(c => {
        const daysUntilTest = Math.max((new Date(c.nextTest) - today)/(1000*60*60*24), 0);
        return 1/(daysUntilTest + 1) + (10 - c.confidence);
    });

    const totalWeight = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*totalWeight;
    let cumulative = 0;

    for(let i=0;i<classes.length;i++){
        cumulative += weights[i];
        if(r <= cumulative) return classes[i];
    }

    return classes[0];
}

// -----------------------------
// Start Study Session
// -----------------------------
document.getElementById('start-session').addEventListener('click', () => {
    if(classes.length === 0) return alert('Add at least one class to start!');

    chosenClassObj = selectClass();
    chosenClassEl.textContent = chosenClassObj.name;
    examDateDisplay.textContent = `Exam Date: ${chosenClassObj.nextTest}`;

    // Load streak for this class
    const classKey = chosenClassObj.name;
    classStreakEl.textContent = streaks[classKey] || 0;

    // Switch sections
    document.getElementById('setup').style.display = 'none';
    document.getElementById('session').style.display = 'block';

    startTimer(3600);
});

// -----------------------------
// Timer Logic (Pause/Play Only)
// -----------------------------
function startTimer(seconds) {
    remainingSeconds = seconds;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        if(!isPaused){
            remainingSeconds--;
            updateTimerDisplay();

            if(remainingSeconds <= 0){
                clearInterval(timerInterval);
                completeSession();
            }
        }
    }, 1000);
}

function updateTimerDisplay(){
    const mins = Math.floor(remainingSeconds/60).toString().padStart(2,'0');
    const secs = (remainingSeconds%60).toString().padStart(2,'0');
    timerEl.textContent = `${mins}:${secs}`;
}

// Pause/Resume Button
pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
});

// -----------------------------
// Complete Session
// -----------------------------
function completeSession(){
    alert('Hour complete! Well done!');
    const classKey = chosenClassObj.name;
    streaks[classKey] = (streaks[classKey] || 0) + 1;
    localStorage.setItem('streaks', JSON.stringify(streaks));

    // Reset to home screen
    document.getElementById('session').style.display = 'none';
    document.getElementById('setup').style.display = 'block';
    chosenClassObj = null;
    remainingSeconds = 3600;
    isPaused = false;
    pauseBtn.textContent = 'Pause';
    renderClasses();
}
