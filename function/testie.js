// Referrer-based shortlinks for steps 3-5
        const REF_LINKS = {
            3: "https://shrinkme.top/kdl1",
            4: "https://fc-lc.xyz/kdl2",
            5: "http://bc.vc/ss74Igj"
        };

        // Expected referrers (hostnames compared)
        const EXPECTED_REFERRERS = {
            3: "https://en.mrproblogger.com",
            4: "https://jobzhub.store",
            5: "https://bcvc.ink/ss74Igj"
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
                        message.textContent = `Step ${expectedStep - 2} verified successfully (referrer match).`;
                        message.className = 'message success';
                    } else {
                        clearExpected();
                        message.textContent = `Return not accepted for Step ${expectedStep - 2}. Make sure you come back from the expected shortlink and wait a moment before returning.`;
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
            const totalSteps = 3; // now only 3 steps

            for (let i = 3; i <= 5; i++) {
                const done = readFlag(`step${i}_done`);
                const prevDone = i === 3 ? true : readFlag(`step${i - 1}_done`);
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

                const allow = (i === 3 || prevDone) && !done;
                btn(i).disabled = !allow;
            }

            const percent = Math.round((completedCount / totalSteps) * 100);
            progress.style.width = percent + '%';
            progressText.textContent = `${percent}% Complete`;

            if (completedCount === 0) {
                message.textContent = 'Ready — start with Step 1.';
                message.className = 'message';
            } else if (completedCount > 0 && completedCount < totalSteps) {
                message.textContent = `Progress: ${completedCount}/${totalSteps} steps complete.`;
                message.className = 'message';
            } else {
                message.textContent = 'All steps complete — Click "Unlock Download Page" to enter your blog URL.';
                message.className = 'message success';
            }

            if (completedCount === totalSteps) {
                unlockBtn.disabled = false;
            } else {
                unlockBtn.disabled = true;
            }
        }

        // Hook up Click Handlers
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
            if (!(readFlag('step3_done') && readFlag('step4_done') && readFlag('step5_done'))) return;
            
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
                const url = new URL(blogUrl);
                const token = generateToken();
                const timestamp = Date.now();
                const separator = blogUrl.includes('?') ? '&' : '?';
                window.location.href = `${blogUrl}${separator}source=verification&timestamp=${timestamp}&token=${encodeURIComponent(token)}`;
            } catch (e) {
                message.textContent = 'Please enter a valid URL.';
                message.className = 'message error';
            }
        });

        // Step header toggles
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

        // Paste button
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
