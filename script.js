import { gsap } from "gsap";

document.addEventListener('DOMContentLoaded', () => {

    // --- Smooth Scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Daily Training Log ---
    const logForm = document.getElementById('training-log-form');
    const logEntriesContainer = document.getElementById('log-entries');
    const streakCounter = document.getElementById('streak-counter');
    const medal = document.getElementById('medal');
    const medalStatus = document.getElementById('medal-status');
    
    let logs = JSON.parse(localStorage.getItem('colossusLogs')) || [];
    let streak = parseInt(localStorage.getItem('colossusStreak')) || 0;
    let lastLogDate = localStorage.getItem('colossusLastLogDate');

    function updateStreak() {
        const today = new Date().toDateString();
        if (lastLogDate) {
            const lastDate = new Date(lastLogDate);
            const todayDate = new Date(today);
            const diffTime = todayDate - lastDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                streak++;
            } else if (diffDays > 1) {
                streak = 1; // Reset streak if a day was missed
            }
            // if diffDays is 0, do nothing, already logged today
        } else {
            streak = 1; // First log
        }
        
        lastLogDate = today;
        localStorage.setItem('colossusStreak', streak);
        localStorage.setItem('colossusLastLogDate', lastLogDate);
        streakCounter.textContent = streak;

        if (streak >= 7) {
            medal.classList.remove('medal-locked');
            medal.classList.add('medal-unlocked');
            medalStatus.textContent = "Medal of 'Sacred Silence' Unlocked!";
        }
    }

    function renderLogs() {
        logEntriesContainer.innerHTML = '';
        logs.slice(0, 5).forEach(log => { // Show last 5
            const entryDiv = document.createElement('div');
            entryDiv.className = 'log-entry';
            entryDiv.innerHTML = `
                <p><strong>Thought/Reaction:</strong> ${log.thought}</p>
                <p><strong>Self-Transformation:</strong> ${log.reflection}</p>
                <small class="text-white-50">${new Date(log.date).toLocaleString()}</small>
            `;
            logEntriesContainer.appendChild(entryDiv);
        });
    }

    logForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const thought = document.getElementById('critical-thought').value;
        const reflection = document.getElementById('reflective-response').value;
        
        const newLog = {
            thought,
            reflection,
            date: new Date().toISOString()
        };

        const today = new Date().toDateString();
        if (lastLogDate !== today) {
            updateStreak();
        }

        logs.unshift(newLog);
        localStorage.setItem('colossusLogs', JSON.stringify(logs));
        renderLogs();
        logForm.reset();
    });

    // Initial load
    streakCounter.textContent = streak;
    if (streak >= 7) {
        medal.classList.remove('medal-locked');
        medal.classList.add('medal-unlocked');
        medalStatus.textContent = "Medal of 'Sacred Silence' Unlocked!";
    }
    renderLogs();


    // --- Inner Mirror Wheel ---
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spin-btn');
    const wheelResult = document.getElementById('wheel-result');
    let segments = [];
    let spinning = false;

    const colors = ["#e8d5a2", "#f0e6ce", "#c5a669", "#fff8e7"];

    async function generateSegments() {
        spinBtn.disabled = true;
        spinBtn.textContent = "Awakening the Mirror...";
        try {
            const completion = await websim.chat.completions.create({
                messages: [{
                    role: "system",
                    content: `You are an AI for a self-help app about overcoming criticism. Generate 8 concepts that represent inner flaws or shadows that people project onto others when they criticize. Examples: Pride, Insecurity, Unhealed Trauma, Fear of Failure. Respond with a JSON array of 8 strings.`,
                }, {
                    role: "user",
                    content: "Generate 8 concepts for the Inner Mirror Wheel."
                }],
                json: true,
            });
            segments = JSON.parse(completion.content);
            setupWheel();
        } catch (error) {
            console.error("Failed to generate wheel segments:", error);
            segments = ["Insecurity", "Fear", "Pride", "Impatience", "Envy", "Control", "Ignorance", "Past Trauma"];
            setupWheel();
        } finally {
            spinBtn.disabled = false;
            spinBtn.textContent = "Spin the Mirror";
        }
    }

    function setupWheel() {
        wheel.innerHTML = '';
        const segmentAngle = 360 / segments.length;
        segments.forEach((text, i) => {
            const segmentEl = document.createElement('div');
            segmentEl.className = 'wheel-segment';
            segmentEl.style.backgroundColor = colors[i % colors.length];
            segmentEl.style.transform = `rotate(${segmentAngle * i}deg) skewY(${90 - segmentAngle}deg)`;
            
            const textEl = document.createElement('span');
            textEl.textContent = text;
            textEl.style.transform = `skewY(-${90 - segmentAngle}deg) rotate(${segmentAngle / 2}deg)`;
            segmentEl.appendChild(textEl);
            wheel.appendChild(segmentEl);
        });
    }

    spinBtn.addEventListener('click', () => {
        if (spinning || segments.length === 0) return;
        spinning = true;
        wheelResult.textContent = '';
        wheelResult.style.backgroundColor = 'transparent';

        const randomSpins = Math.floor(Math.random() * 5) + 5; // 5-9 full spins
        const stopAngle = Math.floor(Math.random() * 360);
        const totalRotation = (360 * randomSpins) + stopAngle;

        const currentRotation = gsap.getProperty(wheel, "rotation");

        gsap.to(wheel, {
            rotation: currentRotation + totalRotation,
            duration: 5,
            ease: "power3.out",
            onComplete: () => {
                const finalRotation = (currentRotation + totalRotation) % 360;
                const segmentAngle = 360 / segments.length;
                const winningIndex = Math.floor((360 - finalRotation + (segmentAngle / 2)) % 360 / segmentAngle);
                const winningSegment = segments[winningIndex];
                
                wheelResult.textContent = `You are projecting: ${winningSegment}`;
                gsap.fromTo(wheelResult, {opacity: 0, y: 20, backgroundColor: 'transparent'}, {opacity: 1, y: 0, backgroundColor: 'rgba(197, 166, 105, 0.1)', duration: 0.5});
                
                spinning = false;
            }
        });
    });
    
    generateSegments();
});

