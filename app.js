// MBTI 웹 애플리케이션 상태 및 비즈니스 로직 (20문항 간편 모드 & 40문항 정밀 모드 지원)

(function () {
  // 상태 변수
  let currentMode = "full"; // 'quick' (20문항) 또는 'full' (40문항)
  let activeQuestions = [];
  let currentQuestionIndex = 0;
  let userAnswers = [];
  let isNavigating = false;

  // DOM 요소 참조
  const startScreen = document.getElementById("start-screen");
  const quizScreen = document.getElementById("quiz-screen");
  const loadingScreen = document.getElementById("loading-screen");
  const resultScreen = document.getElementById("result-screen");

  const btnModeQuick = document.getElementById("btn-mode-quick");
  const btnModeFull = document.getElementById("btn-mode-full");
  const btnPrev = document.getElementById("btn-prev");
  const btnRestart = document.getElementById("btn-restart");
  const btnShare = document.getElementById("btn-share");
  const themeToggle = document.getElementById("theme-toggle");

  const quizModeBadge = document.getElementById("quiz-mode-badge");
  const progressPercent = document.getElementById("progress-percent");
  const progressBar = document.getElementById("progress-bar");
  const questionNumber = document.getElementById("question-number");
  const questionText = document.getElementById("question-text");
  const scaleButtons = document.querySelectorAll(".scale-btn");

  // 결과 화면 요소들
  const resultType = document.getElementById("result-type");
  const resultTitle = document.getElementById("result-title");
  const resultBadge = document.getElementById("result-badge");
  const resultTags = document.getElementById("result-tags");
  const resultSummary = document.getElementById("result-summary");
  const resultDescriptions = document.getElementById("result-descriptions");
  const radarChartContainer = document.getElementById("radar-chart-container");
  const barsContainer = document.getElementById("dimension-bars-container");
  const toastMessage = document.getElementById("toast-message");

  // 테마 초기화
  function initTheme() {
    const savedTheme = localStorage.getItem("mbti_theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(initialTheme);

    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      setTheme(next);
      if (!resultScreen.classList.contains("hidden")) {
        const lastScores = calculateScores();
        renderRadarChart(lastScores.radarValues);
      }
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mbti_theme", theme);
    const icon = themeToggle.querySelector("i");
    if (theme === "dark") {
      icon.className = "fa-solid fa-sun text-amber-400";
    } else {
      icon.className = "fa-solid fa-moon text-slate-600";
    }
  }

  // 화면 전환 도우미
  function showScreen(screenToShow) {
    [startScreen, quizScreen, loadingScreen, resultScreen].forEach((screen) => {
      if (screen === screenToShow) {
        screen.classList.remove("hidden");
        screen.classList.add("animate-fade-in");
      } else {
        screen.classList.add("hidden");
        screen.classList.remove("animate-fade-in");
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 모드별 문항 구성
  // 간편 모드: 각 지표(EI, SN, TF, JP) 앞 5문항씩 총 20문항
  // 정확 모드: 전체 40문항
  function setupQuestionsForMode(mode) {
    currentMode = mode;
    if (mode === "quick") {
      const dimensions = ["EI", "SN", "TF", "JP"];
      const selected = [];
      dimensions.forEach((dim) => {
        const dimQuestions = ALL_QUESTIONS_DATA.filter((q) => q.dimension === dim).slice(0, 5);
        selected.push(...dimQuestions);
      });
      activeQuestions = selected;
    } else {
      activeQuestions = [...ALL_QUESTIONS_DATA];
    }

    currentQuestionIndex = 0;
    userAnswers = new Array(activeQuestions.length).fill(null);
  }

  // 질문 렌더링
  function renderQuestion() {
    const question = activeQuestions[currentQuestionIndex];
    const total = activeQuestions.length;
    const currentNum = currentQuestionIndex + 1;

    // 모드 배지 갱신
    if (quizModeBadge) {
      quizModeBadge.textContent = currentMode === "quick" ? "간편 모드 (20문항)" : "정확 모드 (40문항)";
    }

    // 진행률 갱신 (예: 3 / 20 또는 3 / 40)
    const percent = Math.round((currentNum / total) * 100);
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    questionNumber.textContent = `${currentNum} / ${total}`;

    // 질문 텍스트
    questionText.textContent = question.question;

    // 이전 버튼 가시성
    if (currentQuestionIndex === 0) {
      btnPrev.classList.add("invisible");
    } else {
      btnPrev.classList.remove("invisible");
    }

    // 기존 답변 선택 상태 복원
    const previousScore = userAnswers[currentQuestionIndex];
    scaleButtons.forEach((btn) => {
      const score = parseInt(btn.dataset.score, 10);
      if (score === previousScore) {
        btn.classList.add("selected", "ring-2", "ring-indigo-500");
      } else {
        btn.classList.remove("selected", "ring-2", "ring-indigo-500");
      }
    });

    isNavigating = false;
  }

  // 5점 척도 선택 핸들러
  function handleSelectScore(score) {
    if (isNavigating) return;
    isNavigating = true;

    userAnswers[currentQuestionIndex] = score;

    scaleButtons.forEach((btn) => {
      if (parseInt(btn.dataset.score, 10) === score) {
        btn.classList.add("selected", "ring-2", "ring-indigo-500");
      } else {
        btn.classList.remove("selected", "ring-2", "ring-indigo-500");
      }
    });

    // 250ms 후 자동 다음 문항 또는 결과 연출
    setTimeout(() => {
      if (currentQuestionIndex < activeQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
      } else {
        // 마지막 문항 완료: 요구사항 1.5초 두근거림 대기 연출 시작
        startLoadingAnimation();
      }
    }, 250);
  }

  // 1.5초 두근거림 대기 연출
  function startLoadingAnimation() {
    showScreen(loadingScreen);

    // 1.5초(1500ms) 후 결과 화면으로 전환
    setTimeout(() => {
      displayResults();
    }, 1500);
  }

  // 점수 계산 로직
  // 간편 모드(지표당 5문항, 5~25점): 15점 초과면 target, 15점 이하면 opposite
  // 정확 모드(지표당 10문항, 10~50점): 30점 초과면 target, 30점 이하면 opposite
  function calculateScores() {
    const rawSums = { EI: 0, SN: 0, TF: 0, JP: 0 };

    activeQuestions.forEach((q, idx) => {
      const score = userAnswers[idx] || 3;
      rawSums[q.dimension] += score;
    });

    const isQuick = currentMode === "quick";
    const threshold = isQuick ? 15 : 30; // 기준 점수
    const minScore = isQuick ? 5 : 10;
    const maxScore = isQuick ? 25 : 50;
    const range = maxScore - minScore; // 20 또는 40

    // 각 지표 판정 (> threshold -> target, <= threshold -> opposite)
    const mbti = [
      rawSums.EI > threshold ? "E" : "I",
      rawSums.SN > threshold ? "S" : "N",
      rawSums.TF > threshold ? "T" : "F",
      rawSums.JP > threshold ? "J" : "P"
    ].join("");

    // 비율 계산 (0% ~ 100%, threshold일 때 정확히 50%)
    const calcPercent = (sum) => Math.min(100, Math.max(0, Math.round(((sum - minScore) / range) * 100)));

    const targetPercent = {
      E: calcPercent(rawSums.EI),
      S: calcPercent(rawSums.SN),
      T: calcPercent(rawSums.TF),
      J: calcPercent(rawSums.JP)
    };

    const oppositePercent = {
      I: 100 - targetPercent.E,
      N: 100 - targetPercent.S,
      F: 100 - targetPercent.T,
      P: 100 - targetPercent.J
    };

    // 6각형 레이더 차트 수치 [외향성(E), 직관력(N), 논리력(T), 계획성(J), 공감력(F), 현실감각(S)]
    const radarValues = {
      "외향성(E)": targetPercent.E,
      "직관력(N)": oppositePercent.N,
      "논리력(T)": targetPercent.T,
      "계획성(J)": targetPercent.J,
      "공감력(F)": oppositePercent.F,
      "현실감각(S)": targetPercent.S
    };

    return {
      mbti,
      rawSums,
      threshold,
      targetPercent,
      oppositePercent,
      radarValues
    };
  }

  // 6각형 SVG 레이더 차트 동적 생성
  function renderRadarChart(radarValues) {
    const keys = Object.keys(radarValues); // 6개 항목
    const size = 380;
    const center = size / 2;
    const maxRadius = 120;
    const totalAxes = keys.length; // 6

    const getCoordinates = (radius, angleIndex) => {
      const angle = (Math.PI * 2 / totalAxes) * angleIndex - Math.PI / 2;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      };
    };

    let svgHtml = `
      <svg class="radar-svg mx-auto" viewBox="0 0 ${size} ${size}" width="100%" height="auto">
        <defs>
          <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.65" />
            <stop offset="50%" stop-color="#8b5cf6" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#ec4899" stop-opacity="0.65" />
          </linearGradient>
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
    `;

    // 1. 가이드 정육각형 그리드 (25%, 50%, 75%, 100%)
    const levels = [0.25, 0.5, 0.75, 1.0];
    levels.forEach((level) => {
      const points = [];
      for (let i = 0; i < totalAxes; i++) {
        const coord = getCoordinates(maxRadius * level, i);
        points.push(`${coord.x},${coord.y}`);
      }
      const isOuter = level === 1.0;
      svgHtml += `
        <polygon points="${points.join(" ")}" 
          fill="${level === 1.0 ? "rgba(99, 102, 241, 0.03)" : "none"}" 
          stroke="var(--radar-grid)" 
          stroke-width="${isOuter ? 1.5 : 1}" 
          stroke-dasharray="${isOuter ? "none" : "3,3"}" />
      `;
    });

    // 2. 중심 축 라인 6개
    for (let i = 0; i < totalAxes; i++) {
      const outerCoord = getCoordinates(maxRadius, i);
      svgHtml += `
        <line x1="${center}" y1="${center}" x2="${outerCoord.x}" y2="${outerCoord.y}" 
          stroke="var(--radar-grid)" stroke-width="1.2" />
      `;
    }

    // 3. 사용자 데이터 다각형 생성
    const dataPoints = [];
    const pointCoords = [];

    keys.forEach((key, i) => {
      const rawVal = radarValues[key];
      const safeVal = Math.max(12, rawVal);
      const radius = (safeVal / 100) * maxRadius;
      const coord = getCoordinates(radius, i);
      dataPoints.push(`${coord.x.toFixed(1)},${coord.y.toFixed(1)}`);
      pointCoords.push({ ...coord, val: rawVal, key });
    });

    svgHtml += `
      <polygon class="radar-polygon" points="${dataPoints.join(" ")}" 
        fill="url(#radarGrad)" 
        filter="url(#radarGlow)" />
    `;

    // 4. 데이터 꼭짓점 포인트 원
    pointCoords.forEach((pt) => {
      svgHtml += `
        <circle class="radar-point" cx="${pt.x}" cy="${pt.y}" r="4.5" />
      `;
    });

    // 5. 라벨 및 퍼센트 텍스트 (꼭짓점 바깥 배치)
    const labelDistance = maxRadius + 24;
    keys.forEach((key, i) => {
      const labelCoord = getCoordinates(labelDistance, i);
      const val = radarValues[key];

      let textAnchor = "middle";
      let dy = "0.35em";
      if (Math.abs(labelCoord.x - center) > 10) {
        textAnchor = labelCoord.x > center ? "start" : "end";
      }
      if (labelCoord.y < center - 40) {
        dy = "-0.4em";
      } else if (labelCoord.y > center + 40) {
        dy = "1em";
      }

      svgHtml += `
        <g transform="translate(${labelCoord.x}, ${labelCoord.y})">
          <text text-anchor="${textAnchor}" dy="${dy}" fill="var(--radar-text)" font-size="12" font-weight="700">
            ${key}
            <tspan fill="var(--primary)" font-weight="800"> ${val}%</tspan>
          </text>
        </g>
      `;
    });

    svgHtml += `</svg>`;
    radarChartContainer.innerHTML = svgHtml;
  }

  // 4가지 지표별 비율 막대 그래프 렌더링
  function renderDimensionBars(calculated) {
    const thresh = calculated.threshold;
    const dims = [
      {
        leftLabel: "외향형 E",
        leftVal: calculated.targetPercent.E,
        rightLabel: "I 내향형",
        rightVal: calculated.oppositePercent.I,
        winner: calculated.rawSums.EI > thresh ? "left" : "right"
      },
      {
        leftLabel: "감각형 S",
        leftVal: calculated.targetPercent.S,
        rightLabel: "N 직관형",
        rightVal: calculated.oppositePercent.SN > thresh ? "left" : "right",
        winner: calculated.rawSums.SN > thresh ? "left" : "right"
      },
      {
        leftLabel: "사고형 T",
        leftVal: calculated.targetPercent.T,
        rightLabel: "F 감정형",
        rightVal: calculated.oppositePercent.F,
        winner: calculated.rawSums.TF > thresh ? "left" : "right"
      },
      {
        leftLabel: "판단형 J",
        leftVal: calculated.targetPercent.J,
        rightLabel: "P 인식형",
        rightVal: calculated.oppositePercent.P,
        winner: calculated.rawSums.JP > thresh ? "left" : "right"
      }
    ];

    barsContainer.innerHTML = dims
      .map(
        (dim) => `
        <div class="mb-4">
          <div class="flex justify-between items-center text-sm font-semibold mb-1">
            <span class="${dim.winner === "left" ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-slate-500 dark:text-slate-400"}">
              ${dim.leftLabel} <span class="text-xs">(${dim.leftVal}%)</span>
            </span>
            <span class="${dim.winner === "right" ? "text-pink-600 dark:text-pink-400 font-extrabold" : "text-slate-500 dark:text-slate-400"}">
              <span class="text-xs">(${dim.rightVal}%)</span> ${dim.rightLabel}
            </span>
          </div>
          <div class="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
            <div class="h-full bg-indigo-500 transition-all duration-700" style="width: ${dim.leftVal}%"></div>
            <div class="h-full bg-pink-500 transition-all duration-700" style="width: ${dim.rightVal}%"></div>
          </div>
        </div>
      `
      )
      .join("");
  }

  // 결과 화면 데이터 바인딩
  function displayResults() {
    const calculated = calculateScores();
    const profile = MBTI_PROFILES[calculated.mbti] || {
      type: calculated.mbti,
      title: "매력적인 성향의 소유자",
      badge: "유니크한 개성",
      tags: ["#매력", "#잠재력"],
      summary: "자신만의 고유한 밸런스와 잠재력을 발휘하는 특별한 유형입니다.",
      descriptions: ["다양한 상황에서 유연하게 대처합니다."]
    };

    resultType.textContent = profile.type;
    resultTitle.textContent = profile.title;
    resultBadge.textContent = profile.badge;
    resultSummary.textContent = profile.summary;

    resultTags.innerHTML = profile.tags
      .map(
        (tag) => `
        <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
          ${tag}
        </span>
      `
      )
      .join("");

    resultDescriptions.innerHTML = profile.descriptions
      .map(
        (desc) => `
        <li class="flex items-start text-sm text-slate-700 dark:text-slate-300">
          <i class="fa-solid fa-circle-check text-indigo-500 dark:text-indigo-400 mr-2.5 mt-0.5 text-xs flex-shrink-0"></i>
          <span>${desc}</span>
        </li>
      `
      )
      .join("");

    renderDimensionBars(calculated);
    renderRadarChart(calculated.radarValues);
    showScreen(resultScreen);
  }

  // 토스트 메시지
  function showToast(msg) {
    toastMessage.textContent = msg;
    toastMessage.classList.remove("opacity-0", "translate-y-4");
    toastMessage.classList.add("opacity-100", "translate-y-0");
    setTimeout(() => {
      toastMessage.classList.remove("opacity-100", "translate-y-0");
      toastMessage.classList.add("opacity-0", "translate-y-4");
    }, 2200);
  }

  // 이벤트 리스너 등록
  function initEvents() {
    // 1) 간편 모드 (20문항) 시작 버튼
    btnModeQuick.addEventListener("click", () => {
      setupQuestionsForMode("quick");
      showScreen(quizScreen);
      renderQuestion();
    });

    // 2) 정확 모드 (40문항) 시작 버튼
    btnModeFull.addEventListener("click", () => {
      setupQuestionsForMode("full");
      showScreen(quizScreen);
      renderQuestion();
    });

    // 5점 척도 버튼 클릭
    scaleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const score = parseInt(btn.dataset.score, 10);
        handleSelectScore(score);
      });
    });

    // 이전 질문 버튼
    btnPrev.addEventListener("click", () => {
      if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
      }
    });

    // 다시 테스트하기 버튼
    btnRestart.addEventListener("click", () => {
      showScreen(startScreen);
    });

    // 결과 공유하기 버튼
    btnShare.addEventListener("click", () => {
      const type = resultType.textContent;
      const shareText = `나의 MBTI 테스트 결과는 [${type}] 입니다! 당신의 성향 레이더 차트도 확인해보세요.`;

      if (navigator.share) {
        navigator
          .share({
            title: "MBTI 성향 분석 테스트",
            text: shareText,
            url: window.location.href
          })
          .catch(() => {
            copyToClipboard();
          });
      } else {
        copyToClipboard();
      }
    });

    function copyToClipboard() {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          showToast("🔗 테스트 링크가 클립보드에 복사되었습니다!");
        })
        .catch(() => {
          showToast("링크 복사에 실패했습니다.");
        });
    }
  }

  // 초기화 실행
  initTheme();
  initEvents();
})();
