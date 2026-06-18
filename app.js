document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Theme Toggler
    initTheme();

    // 2. Initialize Mobile Menu
    initMobileMenu();

    // 3. Initialize Scroll Animations (Intersection Observer)
    initScrollAnimations();

    // 4. Initialize Tax Simulator
    initTaxSimulator();

    // 5. Initialize Financial Health Quiz
    initQuiz();

    // 6. Initialize Client Portal Mock
    initClientPortal();

    // 7. Initialize Contact Form & Toast
    initContactForm();
});

/* ==========================================
   1. THEME SWITCHER
   ========================================== */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'dark'; // default to dark
    
    // Apply initial theme
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggleBtn.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        let newTheme = 'dark';
        
        if (activeTheme === 'dark') {
            newTheme = 'light';
        }
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update Chart colors if chart is initialized
        updateChartTheme(newTheme);
    });
}

/* ==========================================
   2. MOBILE NAV MENU
   ========================================== */
function initMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
        });
        
        // Close menu when clicking link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('mobile-open');
            });
        });
    }

    // Header shadow on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* ==========================================
   3. SCROLL ANIMATIONS (INTERSECTION OBSERVER)
   ========================================== */
function initScrollAnimations() {
    // Animate skill bars when in view
    const skillBars = document.querySelectorAll('.skill-bar');
    const skillObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const percent = bar.getAttribute('data-percent');
                bar.style.width = percent + '%';
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.1 });

    skillBars.forEach(bar => skillObserver.observe(bar));

    // Reveal elements on scroll
    const revealElements = document.querySelectorAll('.service-card, .testimonial-card, .tech-card, .about-details, .hero-content');
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => revealObserver.observe(el));
}

/* ==========================================
   4. TAX REGIME SIMULATOR
   ========================================== */
function initTaxSimulator() {
    const revenueInput = document.getElementById('sim-revenue');
    const payrollInput = document.getElementById('sim-payroll');
    const sectorInput = document.getElementById('sim-sector');
    
    const elementsToListen = [revenueInput, payrollInput, sectorInput];
    
    elementsToListen.forEach(element => {
        if (element) {
            element.addEventListener('input', calculateRegimes);
        }
    });

    // Run initial calculation
    calculateRegimes();
}

function calculateRegimes() {
    const rawRevenue = document.getElementById('sim-revenue').value;
    const rawPayroll = document.getElementById('sim-payroll').value;
    const sector = document.getElementById('sim-sector').value;

    const revenue = parseFloat(rawRevenue) || 0;
    const payroll = parseFloat(rawPayroll) || 0;

    // 1. SIMPLES NACIONAL
    let simplesTax = 0;
    let simplesNote = "";
    let isSimplesEligible = true;

    if (revenue > 4800000) {
        isSimplesEligible = false;
        simplesNote = "Faturamento excede o limite de R$ 4,8M/ano.";
    } else if (revenue === 0) {
        simplesTax = 0;
    } else {
        if (sector === 'commerce') {
            // Anexo I: 4% to 19%
            simplesTax = calculateSimplesBracket(revenue, [0.04, 0.073, 0.095, 0.107, 0.143, 0.19]);
        } else if (sector === 'industry') {
            // Anexo II: 4.5% to 30%
            simplesTax = calculateSimplesBracket(revenue, [0.045, 0.078, 0.10, 0.112, 0.147, 0.30]);
        } else { // services
            // "Fator R" logic: payroll / revenue
            const factorR = revenue > 0 ? (payroll / revenue) : 0;
            if (factorR >= 0.28) {
                // Anexo III: 6% to 33% (favorable)
                simplesTax = calculateSimplesBracket(revenue, [0.06, 0.112, 0.135, 0.16, 0.21, 0.33]);
                simplesNote = "Fator R favorável (Anexo III).";
            } else {
                // Anexo V: 15.5% to 30.5% (unfavorable)
                simplesTax = calculateSimplesBracket(revenue, [0.155, 0.18, 0.195, 0.22, 0.23, 0.305]);
                simplesNote = "Sujeito ao Anexo V (Fator R < 28%).";
            }
        }
    }

    // 2. LUCRO PRESUMIDO
    let lucroPresumidoTax = 0;
    let isLPEligible = true;
    let lpNote = "";

    if (revenue > 78000000) {
        isLPEligible = false;
        lpNote = "Faturamento excede R$ 78M/ano.";
    } else if (revenue === 0) {
        lucroPresumidoTax = 0;
    } else {
        // Presumption margin: Commerce/Industry 8%, Services 32%
        const presumptionRate = (sector === 'services') ? 0.32 : 0.08;
        const presumedProfit = revenue * presumptionRate;
        
        // IRPJ (15%) + CSLL (9%) = 24% of Presumed Profit
        // Surtax: 10% on profit exceeding 240k per year
        let irpjCsll = presumedProfit * 0.24;
        if (presumedProfit > 240000) {
            irpjCsll += (presumedProfit - 240000) * 0.10;
        }

        // PIS + COFINS: 3.65% of Revenue
        const pisCofins = revenue * 0.0365;

        // ISS or ICMS (avg 4%)
        const municipalStateTax = revenue * 0.04;

        lucroPresumidoTax = irpjCsll + pisCofins + municipalStateTax;
    }

    // 3. LUCRO REAL
    // Estimate actual profit based on a margin. If payroll is high, profit is lower.
    // Let's assume operational margin is 15% for commerce, 12% for industry, 25% for services (before payroll)
    let estimativeProfitMargin = (sector === 'services') ? 0.40 : 0.25;
    let estimatedProfit = (revenue * estimativeProfitMargin) - payroll;
    if (estimatedProfit < 0) estimatedProfit = 0;

    let lucroRealTax = 0;
    if (revenue === 0) {
        lucroRealTax = 0;
    } else {
        // IRPJ (15%) + CSLL (9%) = 24% of Real Profit. Surtax 10% on profit exceeding 240k/year
        let irpjCsll = estimatedProfit * 0.24;
        if (estimatedProfit > 240000) {
            irpjCsll += (estimatedProfit - 240000) * 0.10;
        }

        // PIS + COFINS non-cumulative (avg 7.5% net after inputs credit)
        const pisCofins = revenue * 0.075;

        // ISS/ICMS avg 4%
        const municipalStateTax = revenue * 0.04;

        lucroRealTax = irpjCsll + pisCofins + municipalStateTax;
    }

    // Update UI
    displayRegimeResult('simples', simplesTax, isSimplesEligible, simplesNote, revenue);
    displayRegimeResult('presumido', lucroPresumidoTax, isLPEligible, lpNote, revenue);
    displayRegimeResult('real', lucroRealTax, true, "Estimativa com Margem de " + Math.round(estimativeProfitMargin * 100) + "%", revenue);

    // Highlight recommended (cheapest eligible)
    highlightCheapestRegime(
        { id: 'simples', val: simplesTax, eligible: isSimplesEligible },
        { id: 'presumido', val: lucroPresumidoTax, eligible: isLPEligible },
        { id: 'real', val: lucroRealTax, eligible: true }
    );
}

function calculateSimplesBracket(revenue, brackets) {
    // Quick estimation based on brackets
    let rate = brackets[0];
    if (revenue > 3600000) rate = brackets[5];
    else if (revenue > 1800000) rate = brackets[4];
    else if (revenue > 720000) rate = brackets[3];
    else if (revenue > 360000) rate = brackets[2];
    else if (revenue > 180000) rate = brackets[1];
    return revenue * rate;
}

function displayRegimeResult(id, value, eligible, note, revenue) {
    const card = document.getElementById(`regime-${id}`);
    const priceEl = card.querySelector('.regime-price');
    const percentEl = card.querySelector('.regime-percent');
    const noteEl = card.querySelector('.regime-note');

    card.classList.remove('recommended');

    if (!eligible) {
        priceEl.textContent = "Inadequado";
        percentEl.textContent = note;
        noteEl.textContent = "Fora dos limites legais.";
    } else {
        const annualTax = value;
        const monthlyTax = value / 12;
        const taxPercentage = revenue > 0 ? (annualTax / revenue) * 100 : 0;

        priceEl.textContent = formatCurrency(monthlyTax) + "/mês";
        percentEl.textContent = `Imposto Anual: ${formatCurrency(annualTax)}`;
        noteEl.textContent = `Alíquota Efetiva: ${taxPercentage.toFixed(2)}% | ${note}`;
    }
}

function highlightCheapestRegime(...regimes) {
    let cheapest = null;
    regimes.forEach(reg => {
        if (reg.eligible && reg.val > 0) {
            if (!cheapest || reg.val < cheapest.val) {
                cheapest = reg;
            }
        }
    });

    if (cheapest) {
        document.getElementById(`regime-${cheapest.id}`).classList.add('recommended');
    }
}

function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

/* ==========================================
   5. FINANCIAL HEALTH QUIZ
   ========================================== */
const quizQuestions = [
    {
        q: "Como é feito o planejamento tributário da sua empresa?",
        options: [
            { text: "Nunca fizemos, apenas pagamos as guias que o contador envia.", score: 0 },
            { text: "Fazemos uma vez por ano, de forma simples e superficial.", score: 2 },
            { text: "Temos um planejamento fiscal estratégico e dinâmico, revisado anualmente.", score: 4 }
        ]
    },
    {
        q: "Qual é a frequência de acompanhamento do seu Fluxo de Caixa?",
        options: [
            { text: "Olho o saldo bancário de vez em quando para pagar contas urgentes.", score: 0 },
            { text: "Temos uma planilha financeira estruturada, mas nem sempre atualizada.", score: 2 },
            { text: "Fazemos conciliação diária com relatórios automatizados de projeção.", score: 4 }
        ]
    },
    {
        q: "Sua empresa costuma pagar despesas pessoais dos sócios usando a conta jurídica?",
        options: [
            { text: "Sim, frequentemente misturamos as contas por facilidade.", score: 0 },
            { text: "Raramente, apenas despesas menores ou em emergências.", score: 2 },
            { text: "Nunca. Há separação absoluta entre patrimônio físico e jurídico.", score: 4 }
        ]
    },
    {
        q: "Como está a situação fiscal de certidões negativas da sua empresa (CND)?",
        options: [
            { text: "Temos pendências ativas na Receita ou parcelamentos em atraso.", score: 0 },
            { text: "Estão em dia, mas já estivemos irregulares por falta de controle.", score: 2 },
            { text: "100% regularizadas e monitoradas preventivamente todos os meses.", score: 4 }
        ]
    },
    {
        q: "Qual o seu nível de análise das demonstrações contábeis (DRE, Balanço)?",
        options: [
            { text: "Não recebo ou não sei analisar esses documentos contábeis.", score: 0 },
            { text: "Vejo apenas na declaração de imposto anual, sem usar para decisões.", score: 2 },
            { text: "Uso a DRE mensalmente como bússola para investimentos e controle de custos.", score: 4 }
        ]
    }
];

let currentQuestionIndex = 0;
let quizScore = 0;
let userAnswers = [];

function initQuiz() {
    const nextBtn = document.getElementById('quiz-next-btn');
    const prevBtn = document.getElementById('quiz-prev-btn');
    const restartBtn = document.getElementById('quiz-restart-btn');

    if (nextBtn) nextBtn.addEventListener('click', handleQuizNext);
    if (prevBtn) prevBtn.addEventListener('click', handleQuizPrev);
    if (restartBtn) restartBtn.addEventListener('click', restartQuiz);

    showQuizQuestion();
}

function showQuizQuestion() {
    const questionText = document.getElementById('quiz-question-text');
    const optionsContainer = document.getElementById('quiz-options-container');
    const currentNum = document.getElementById('quiz-current-num');
    const fillBar = document.getElementById('quiz-progress-fill');
    const prevBtn = document.getElementById('quiz-prev-btn');
    const nextBtn = document.getElementById('quiz-next-btn');

    if (!questionText) return;

    // Reset view if result view was active
    document.getElementById('quiz-qa-view').style.display = 'block';
    document.getElementById('quiz-result-view').style.display = 'none';

    // Update indicators
    currentNum.textContent = currentQuestionIndex + 1;
    const progressPercent = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
    fillBar.style.width = `${progressPercent}%`;

    // Navigation buttons visibility
    prevBtn.style.visibility = currentQuestionIndex === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = currentQuestionIndex === quizQuestions.length - 1 ? 'Finalizar Diagnóstico' : 'Próxima Pergunta';
    nextBtn.disabled = userAnswers[currentQuestionIndex] === undefined;

    // Load question and options
    const questionData = quizQuestions[currentQuestionIndex];
    questionText.textContent = questionData.q;
    optionsContainer.innerHTML = '';

    questionData.options.forEach((opt, idx) => {
        const optionEl = document.createElement('button');
        optionEl.className = 'quiz-option';
        if (userAnswers[currentQuestionIndex] === idx) {
            optionEl.classList.add('selected');
        }
        
        const letter = String.fromCharCode(65 + idx); // A, B, C...
        optionEl.innerHTML = `
            <span class="quiz-option-letter">${letter}</span>
            <span>${opt.text}</span>
        `;
        
        optionEl.addEventListener('click', () => selectQuizOption(idx));
        optionsContainer.appendChild(optionEl);
    });
}

function selectQuizOption(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;
    
    // Highlight selected
    const options = document.querySelectorAll('.quiz-option');
    options.forEach((opt, idx) => {
        if (idx === optionIndex) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });

    // Enable next button
    document.getElementById('quiz-next-btn').disabled = false;
}

function handleQuizNext() {
    if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex++;
        showQuizQuestion();
    } else {
        // Calculate score and show results
        calculateAndShowQuizResults();
    }
}

function handleQuizPrev() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuizQuestion();
    }
}

function calculateAndShowQuizResults() {
    quizScore = 0;
    userAnswers.forEach((ansIdx, qIdx) => {
        quizScore += quizQuestions[qIdx].options[ansIdx].score;
    });

    document.getElementById('quiz-qa-view').style.display = 'none';
    const resultView = document.getElementById('quiz-result-view');
    resultView.style.display = 'flex';

    const scoreNum = document.getElementById('quiz-score-num');
    const resultTitle = document.getElementById('quiz-result-title');
    const resultDesc = document.getElementById('quiz-result-desc');
    const resultIconContainer = document.getElementById('quiz-result-icon-container');

    scoreNum.textContent = `${quizScore} / 20 pontos`;

    let iconHtml = "";
    let statusClass = "";

    if (quizScore <= 7) {
        statusClass = "critical";
        iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        resultTitle.textContent = "Nível Crítico (Alto Risco)";
        resultTitle.style.color = "#ef4444";
        resultDesc.textContent = "A saúde financeira e tributária da sua empresa está em perigo. A falta de controles básicos e de planejamento está custando caro e expondo o seu CNPJ a riscos reais de multas e autuações fiscais. Recomenda-se uma consultoria contábil emergencial.";
    } else if (quizScore <= 14) {
        statusClass = "warning";
        iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        resultTitle.textContent = "Nível de Atenção (Regular)";
        resultTitle.style.color = "var(--accent-gold)";
        resultDesc.textContent = "Sua empresa tem processos que funcionam, mas ainda há vulnerabilidades relevantes. Sem análises periódicas de DRE e um planejamento tributário desenhado de forma séria, você pode estar perdendo competitividade e deixando dinheiro na mesa. Podemos otimizar seus custos.";
    } else {
        statusClass = "success";
        iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        resultTitle.textContent = "Gestão Excelente (Saudável)";
        resultTitle.style.color = "var(--accent-success)";
        resultDesc.textContent = "Parabéns! Sua empresa demonstra maturidade na gestão contábil e fiscal. A correta separação patrimonial e o monitoramento preventivo são diferenciais que blindam o negócio. O próximo passo é sofisticar sua contabilidade com inteligência de BI. Agende uma conversa para explorarmos melhorias de escala.";
    }

    resultIconContainer.className = `quiz-result-icon ${statusClass}`;
    resultIconContainer.innerHTML = iconHtml;
}

function restartQuiz() {
    currentQuestionIndex = 0;
    quizScore = 0;
    userAnswers = [];
    showQuizQuestion();
}

/* ==========================================
   6. CLIENT PORTAL DEMO
   ========================================== */
let clientChartInstance = null;

function initClientPortal() {
    const portalNavs = document.querySelectorAll('.portal-nav-link');
    const portalViews = document.querySelectorAll('.portal-view-content');

    portalNavs.forEach(nav => {
        nav.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = nav.getAttribute('data-target');

            // Switch active link
            portalNavs.forEach(n => n.classList.remove('active'));
            nav.classList.add('active');

            // Switch view
            portalViews.forEach(v => {
                v.style.display = 'none';
                if (v.id === `portal-${targetView}`) {
                    v.style.display = 'block';
                }
            });

            // Re-render chart if switching to dashboard
            if (targetView === 'dashboard') {
                renderClientChart();
            }
        });
    });

    // Render chart initially
    renderClientChart();
}

function renderClientChart() {
    const canvas = document.getElementById('client-financial-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Get colors based on theme
    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
    const successColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-success').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();

    // Destroy existing chart to prevent overlay bug
    if (clientChartInstance) {
        clientChartInstance.destroy();
    }

    // Chart.js requires global registration or cdn import
    if (typeof Chart === 'undefined') {
        // Fallback: draw inside Canvas directly using standard canvas API in case CDN fails
        drawFallbackChart(ctx, canvas, primaryColor, successColor, textColor, gridColor);
        return;
    }

    clientChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [
                {
                    label: 'Faturamento',
                    data: [120000, 145000, 132000, 158000, 172000, 195000],
                    backgroundColor: primaryColor,
                    borderRadius: 4,
                },
                {
                    label: 'Lucro Líquido',
                    data: [24000, 31000, 27500, 34800, 39500, 48000],
                    backgroundColor: successColor,
                    borderRadius: 4,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // We use custom legends in HTML
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor,
                        drawTicks: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            family: 'Plus Jakarta Sans',
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        color: gridColor,
                        drawTicks: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            family: 'Plus Jakarta Sans',
                            size: 11
                        },
                        callback: function(value) {
                            return 'R$ ' + (value / 1000) + 'k';
                        }
                    }
                }
            }
        }
    });
}

function updateChartTheme() {
    // Re-render chart to pick up new CSS variables
    setTimeout(() => {
        renderClientChart();
    }, 100);
}

function drawFallbackChart(ctx, canvas, primaryColor, successColor, textColor, gridColor) {
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = textColor;
    ctx.font = '12px Plus Jakarta Sans';
    ctx.fillText("Painel Financeiro Integrado", 20, 30);
    
    // Draw simple bars manually if Chart.js is not loaded
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const revenue = [120, 145, 132, 158, 172, 195];
    const profit = [24, 31, 27, 34, 39, 48];
    
    const barWidth = 15;
    const chartHeight = 120;
    const startX = 50;
    const startY = 160;
    
    // Draw axes
    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + 300, startY);
    ctx.stroke();
    
    for (let i = 0; i < months.length; i++) {
        const x = startX + i * 45;
        
        // Revenue bar
        const rHeight = (revenue[i] / 200) * chartHeight;
        ctx.fillStyle = primaryColor;
        ctx.fillRect(x, startY - rHeight, barWidth, rHeight);
        
        // Profit bar
        const pHeight = (profit[i] / 200) * chartHeight;
        ctx.fillStyle = successColor;
        ctx.fillRect(x + barWidth + 2, startY - pHeight, barWidth, pHeight);
        
        // Label
        ctx.fillStyle = textColor;
        ctx.font = '10px Plus Jakarta Sans';
        ctx.fillText(months[i], x + 5, startY + 15);
    }
}

/* ==========================================
   7. CONTACT FORM & TOAST NOTIFICATION
   ========================================== */
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Simulate form submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin" style="animation: spin 1s linear infinite; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg> Enviando...
            `;

            // Style animation spinner dynamically
            if (!document.getElementById('spin-style')) {
                const style = document.createElement('style');
                style.id = 'spin-style';
                style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
                document.head.appendChild(style);
            }

            setTimeout(() => {
                showToast("Mensagem enviada com sucesso! Lucas entrará em contato em breve.", "success");
                contactForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }, 1500);
        });
    }
}

function showToast(message, type = "success") {
    // Create toast container if not exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    
    const icon = type === 'success' 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Fade out after 4 seconds
    setTimeout(() => {
        toast.style.animation = "toastOut 0.5s ease forwards";
        
        // Add toastOut keyframes if not exist
        if (!document.getElementById('toast-out-style')) {
            const style = document.createElement('style');
            style.id = 'toast-out-style';
            style.innerHTML = `@keyframes toastOut { to { transform: translateY(-30px); opacity: 0; } }`;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 4000);
}

// Global exposure for simulator tabs switching
window.switchTab = function(tabName) {
    // Switch active button
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('active');
        }
    });

    // Switch active view
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `tab-${tabName}`) {
            content.classList.add('active');
        }
    });
}
