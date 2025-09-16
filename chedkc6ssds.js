// Timer links for steps 1 & 2
        const TIMER_LINKS = [
            "https://www.revenuecpmgate.com/c65pftb4?key=6a2f8b9ff4cb8cc2290878d3a07c2bc3",
            "https://otieu.com/4/9530906"
        ];

        // Referrer-based shortlinks for steps 3-5
        const REF_LINKS = {
            3: "https://shrinkme.top/15AqF16",
            4: "https://cuty.io/EQ44zZOl3",
            5: "http://bc.vc/Z3glKZi"
        };

        // Expected referrers (hostnames compared)
        const EXPECTED_REFERRERS = {
            3: "https://en.mrproblogger.com",
            4: "https://cuttlinks.com/go/EQ44zZOl3",
            5: "https://bcvc.ink/Z3glKZi"
        };

        // Minimum time (ms) since redirect to consider the return valid
        const MIN_RETURN_MS = 2500;

        // UI & Storage Helpers
        const btn = i => document.getElementById(`btn-${i}`);
        const statusEl = i => document.getElementById(`status-${i}`);
        const noteEl = i => document.getElementById(`note-${i}`);
        const stepWrap = i => document.getElementById(`step-${i}`);
        const message = document.getElementById('message');
        const unlockBtn = document.getElementById('unlockBtn');
        const verifyBlogBtn = document.getElementById('verifyBlogBtn');
        const blogUrlInput = document.getElementById('blogUrl');
        const urlInputContainer = document.getElementById('url-input-container');
        const progress = document.getElementById('progress');
        const progressText = document.getElementById('progressText');

        function readFlag(k) { return sessionStorage.getItem(k) === 'true'; }
        function setFlag(k, v) { sessionStorage.setItem(k, v ? 'true' : 'false'); }
        function setExpected(step) { 
            sessionStorage.setItem('expectedStep', String(step)); 
            sessionStorage.setItem('expected_ts', String(Date.now())); 
        }
        function clearExpected() { 
            sessionStorage.removeItem('expectedStep'); 
            sessionStorage.removeItem('expected_ts'); 
        }

        // Generate a secure verification token with timestamp
        function generateToken() {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            return `v2_${timestamp}_${random}`;
        }

        // Compare hostnames
        function refMatches(expectedRef, actualRef) {
            try {
                if (!actualRef) return false;
                const aHost = new URL(actualRef).hostname.toLowerCase();
                const eHost = new URL(expectedRef).hostname.toLowerCase();
                return aHost === eHost;
            } catch (e) {
                return actualRef.indexOf(expectedRef) !== -1;
            }
        }

        // Random wait between 8 and 16 seconds
        function randomWaitSeconds() { return Math.floor(Math.random() * (16 - 8 + 1)) + 8; }

        // Timer-based Step Logic (1 & 2)
        const timerState = { interval: null, windowRef: null };

        function startTimerStep(step) {
            if (![1, 2].includes(step)) return;
            if (readFlag(`step${step}_done`)) return;
            const link = TIMER_LINKS[step - 1];
            if (!link) { noteEl(step).textContent = 'Link missing for this step.'; return; }

            const waitSeconds = randomWaitSeconds();
            btn(step).textContent = `Step ${step} — ${waitSeconds}s`;
            btn(step).disabled = true;
            noteEl(step).innerHTML = 'Opening link in a new tab...';

            // Open popup/tab
            const win = window.open(link, `_blank`);
            timerState.windowRef = win;

            if (!win) {
                // Popup blocked
                btn(step).textContent = 'Popup blocked — Retry';
                btn(step).disabled = false;
                noteEl(step).textContent = 'Popup blocked. Allow popups for this site and retry.';
                return;
            }

            let remaining = waitSeconds;
            noteEl(step).innerHTML = `Leave the opened tab open. Counting down <span class="countdown">${remaining}s</span>...`;

            timerState.interval = setInterval(() => {
                if (!timerState.windowRef) {
                    clearInterval(timerState.interval);
                    timerState.interval = null;
                    return;
                }
                
                if (timerState.windowRef.closed) {
                    clearInterval(timerState.interval);
                    timerState.interval = null;
                    timerState.windowRef = null;
                    btn(step).textContent = 'Error — Tab closed. Retry';
                    btn(step).disabled = false;
                    noteEl(step).textContent = 'You closed the opened tab before the timer finished. Please retry.';
                    return;
                }
                
                remaining -= 1;
                btn(step).textContent = `Step ${step} — ${remaining}s`;
                noteEl(step).innerHTML = `Keep the opened tab open. <span class="countdown">${remaining}s</span> remaining...`;
                
                if (remaining <= 0) {
                    clearInterval(timerState.interval);
                    timerState.interval = null;
                    setFlag(`step${step}_done`, true);
                    noteEl(step).textContent = `Step ${step} verified locally. You may keep the opened tab open.`;
                    btn(step).textContent = `Step ${step} Completed`;
                    updateUI();
                }
            }, 1000);
        }

        // On page load check if the user returned from a shortlink
        (function checkReturnOnLoad() {
            try {
                const expectedStep = sessionStorage.getItem('expectedStep');
                if (expectedStep) {
                    const expected_ts = Number(sessionStorage.getItem('expected_ts') || '0');
                    const elapsed = Date.now() - expected_ts;
                    const ref = document.referrer || '';
                    const expectedRef = EXPECTED_REFERRERS[expectedStep];
                    const ok = elapsed >= MIN_RETURN_MS && refMatches(expectedRef, ref);
                    
                    if (ok) {
                        setFlag(`step${expectedStep}_done`, true);
                        clearExpected();
                        message.textContent = `Step ${expectedStep} verified successfully (referrer match).`;
                        message.className = 'message success';
                    } else {
                        clearExpected();
                        message.textContent = `Return not accepted for Step ${expectedStep}. Make sure you come back from the expected shortlink and wait a moment before returning.`;
                        message.className = 'message error';
                    }
                }
            } catch (e) {
                console.error('checkReturnOnLoad error', e);
            } finally {
                updateUI();
            }
        })();


        // UI Update Logic
        function updateUI() {
            let completedCount = 0;
            for (let i = 1; i <= 5; i++) {
                const done = readFlag(`step${i}_done`);
                const prevDone = i === 1 ? true : readFlag(`step${i - 1}_done`);
                const stepEl = stepWrap(i);
                
                if (done) {
                    statusEl(i).textContent = 'Completed';
                    stepEl.classList.add('completed');
                    stepEl.classList.remove('active');
                    stepEl.querySelector('.step-content').style.display = 'none';
                    completedCount++;
                } else {
                    statusEl(i).textContent = prevDone ? 'Pending' : 'Locked';
                    stepEl.classList.remove('completed');
                    if (prevDone) {
                        stepEl.classList.add('active');
                        stepEl.querySelector('.step-content').style.display = 'block';
                    } else {
                        stepEl.classList.remove('active');
                        stepEl.querySelector('.step-content').style.display = 'none';
                    }
                }

                const allow = (i === 1 || prevDone) && !done;
                btn(i).disabled = !allow;
            }

            const percent = Math.round((completedCount / 5) * 100);
            progress.style.width = percent + '%';
            progressText.textContent = `${percent}% Complete`;

            if (completedCount === 0) {
                message.textContent = 'Ready — start with Step 1.';
                message.className = 'message';
            } else if (completedCount > 0 && completedCount < 5) {
                message.textContent = `Progress: ${completedCount}/5 steps complete.`;
                message.className = 'message';
            } else {
                message.textContent = 'All steps complete — Click "Unlock Download Page" to enter your blog URL.';
                message.className = 'message success';
            }

            if (completedCount === 5) {
                unlockBtn.disabled = false;
                
            } else {
                unlockBtn.disabled = true;
                
            }
        }

        // Hook up Click Handlers
        btn(1).addEventListener('click', () => { startTimerStep(1); });
        btn(2).addEventListener('click', () => { startTimerStep(2); });

        [3, 4, 5].forEach(i => {
            btn(i).addEventListener('click', () => {
                if (i !== 3 && !readFlag(`step${i - 1}_done`)) return;
                setExpected(i);
                noteEl(i).textContent = 'Opening shortlink in this tab. After completing the shortlink flow, return to this page.';
                location.href = REF_LINKS[i];
            });
        });

        // Unlock button to show URL input
        unlockBtn.addEventListener('click', () => {
            if (!(readFlag('step1_done') && readFlag('step2_done') && readFlag('step3_done') && 
                  readFlag('step4_done') && readFlag('step5_done'))) return;
            
            unlockBtn.classList.add('hidden');
            urlInputContainer.classList.remove('hidden');
            message.textContent = 'Enter your blog post URL and click "Unlock" to continue.';
            message.className = 'message';
        });

        // Verify blog URL and redirect with token
        verifyBlogBtn.addEventListener('click', () => {
            const blogUrl = blogUrlInput.value.trim();
            
            if (!blogUrl) {
                message.textContent = 'Please enter a valid blog post URL.';
                message.className = 'message error';
                return;
            }
            
            try {
                // Validate URL format
                const url = new URL(blogUrl);
                
                // Generate verification token with timestamp
                const token = generateToken();
                const timestamp = Date.now();
                
                // Redirect to blog page with token as URL parameters
                // Using both query string and fragment identifier for compatibility
                const separator = blogUrl.includes('?') ? '&' : '?';
                window.location.href = `${blogUrl}${separator}source=verification&timestamp=${timestamp}&token=${encodeURIComponent(token)}`;
                
            } catch (e) {
                message.textContent = 'Please enter a valid URL.';
                message.className = 'message error';
            }
        });

        // Step header toggles (click to expand/collapse)
        document.querySelectorAll('.step-header').forEach(h => {
            h.addEventListener('click', () => {
                const step = Number(h.getAttribute('data-step'));
                const el = stepWrap(step).querySelector('.step-content');
                if (readFlag(`step${step}_done`)) return;
                el.style.display = (el.style.display === 'block') ? 'none' : 'block';
            });
            
            h.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') { 
                    ev.preventDefault(); 
                    h.click(); 
                }
            });
        });



// Add paste functionality
document.getElementById('pasteBtn').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('blogUrl').value = text;
    } catch (err) {
        alert('Unable to read clipboard. Please paste manually.');
        console.error('Failed to read clipboard contents: ', err);
    }
});




        // Run initial UI update
        updateUI();
