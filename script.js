const CATEGORIES = {
  Food: [],
  Transportation: [],
  Entertainment: [],
  Kids: ["Fees", "Toys", "Dresses", "Eating", "Other"],
  Grocery: [],
  Gifting: [],
  Electricity: [],
  Rent: [],
  Cosmetics: [],
  Health: [],
  Investment: [
    "Stock",
    "Mutual Fund",
    "PPF",
    "EPF",
    "FD",
    "RD",
    "Gold",
    "RealEstate",
  ],
  "Credit Card Bills": ["HDFC", "ICICI", "SBI", "Other"],
  Clothing: ["Vikas", "Shivani", "Parents", "Siblings"],
  Other: [],
};

// Application State
let STATE = {
  profiles: ["Vikas"],
  currentProfile: "Vikas",
  expenses: [],
  budgets: {}, // { "Food": 500, "Rent": 1000 }
  goalTarget: 0, // Annual spending limit
  monthlyIncome: 0, // Total monthly income
};

// Chart instances
let pieChartInstance = null;
let lineChartInstance = null;

const STORAGE_PREFIX = "ExpenseReport_";

// Elements
const el = {
  body: document.body,
  themeToggle: document.getElementById("theme-toggle"),
  profileSelect: document.getElementById("profile-select"),
  addProfileBtn: document.getElementById("add-profile-btn"),
  shareBtn: document.getElementById("share-btn"),

  // Form
  form: document.getElementById("expense-form"),
  formTitle: document.getElementById("form-title"),
  editId: document.getElementById("edit-id"),
  expName: document.getElementById("exp-name"),
  expAmount: document.getElementById("exp-amount"),
  expDate: document.getElementById("exp-date"),
  expCategory: document.getElementById("exp-category"),
  expSubcategory: document.getElementById("exp-subcategory"),
  expType: document.getElementById("exp-type"),
  expRecurring: document.getElementById("exp-recurring"),
  expNotes: document.getElementById("exp-notes"),
  expReceipt: document.getElementById("exp-receipt"),
  cancelEditBtn: document.getElementById("cancel-edit"),

  // Lists & Views
  expensesList: document.getElementById("expenses-list"),
  calendarView: document.getElementById("calendar-view"),
  viewListBtn: document.getElementById("view-list-btn"),
  viewCalendarBtn: document.getElementById("view-calendar-btn"),

  // Filters & Sorting
  searchInput: document.getElementById("search-input"),
  filterCategory: document.getElementById("filter-category"),
  filterMonth: document.getElementById("filter-month"),
  filterYear: document.getElementById("filter-year"),
  filterStart: document.getElementById("filter-start"),
  filterEnd: document.getElementById("filter-end"),
  sortSelect: document.getElementById("sort-select"),

  // Actions
  exportBtn: document.getElementById("export-csv-btn"),
  importInput: document.getElementById("import-csv-input"),

  // Stats
  statMonth: document.getElementById("stat-month-total"),
  statYear: document.getElementById("stat-year-total"),
  statAvgDaily: document.getElementById("stat-avg-daily"),
  statAvgMonthly: document.getElementById("stat-avg-monthly"),
  statHighest: document.getElementById("stat-highest"),
  statLowest: document.getElementById("stat-lowest"),
  statFixed: document.getElementById("stat-fixed"),
  statVariable: document.getElementById("stat-variable"),
  statMonthlyIncome: document.getElementById("stat-monthly-income"),
  statIncExpRatio: document.getElementById("stat-inc-exp-ratio"),

  // Budgets & Goals
  setBudgetBtn: document.getElementById("set-budget-btn"),
  budgetsList: document.getElementById("budgets-list"),
  setGoalBtn: document.getElementById("set-goal-btn"),
  goalDisplay: document.getElementById("goal-display"),
  goalEmpty: document.getElementById("goal-empty"),
  goalCurrentVal: document.getElementById("goal-current-val"),
  goalTargetVal: document.getElementById("goal-target-val"),
  goalProgressFill: document.getElementById("goal-progress-fill"),
  goalStatusText: document.getElementById("goal-status-text"),

  // Modals
  overlay: document.getElementById("modal-overlay"),
  modals: document.querySelectorAll(".modal"),
  closeModalBtns: document.querySelectorAll(".close-modal, .close-modal-btn"),

  modalProfile: document.getElementById("modal-profile"),
  newProfileName: document.getElementById("new-profile-name"),
  saveProfileBtn: document.getElementById("save-profile-btn"),

  modalBudget: document.getElementById("modal-budget"),
  budgetInputsContainer: document.getElementById("budget-inputs-container"),
  saveBudgetsBtn: document.getElementById("save-budgets-btn"),

  modalGoal: document.getElementById("modal-goal"),
  goalTargetInput: document.getElementById("goal-target-input"),
  saveGoalBtn: document.getElementById("save-goal-btn"),

  modalIncome: document.getElementById("modal-income"),
  incomeInput: document.getElementById("income-input"),
  setIncomeBtn: document.getElementById("set-income-btn"),
  saveIncomeBtn: document.getElementById("save-income-btn"),

  modalReceipt: document.getElementById("modal-receipt"),
  receiptImg: document.getElementById("receipt-image-preview"),
};

// Initialize Application
function init() {
  loadTheme();
  loadGlobalData();
  populateSelects();
  attachEventListeners();

  switchProfile(STATE.currentProfile, true);

  // Default form date
  el.expDate.valueAsDate = new Date();
  el.filterYear.value = new Date().getFullYear();
}

function loadGlobalData() {
  const profiles = localStorage.getItem("ExpenseReport_Global_Profiles");
  if (profiles) {
    STATE.profiles = JSON.parse(profiles);
  }
  const current = localStorage.getItem("ExpenseReport_Global_CurrentProfile");
  if (current && STATE.profiles.includes(current)) {
    STATE.currentProfile = current;
  }
}

function saveGlobalData() {
  localStorage.setItem(
    "ExpenseReport_Global_Profiles",
    JSON.stringify(STATE.profiles),
  );
  localStorage.setItem(
    "ExpenseReport_Global_CurrentProfile",
    STATE.currentProfile,
  );
}

function loadProfileData(profileName) {
  const data = localStorage.getItem(STORAGE_PREFIX + profileName);
  if (data) {
    const parsed = JSON.parse(data);
    STATE.expenses = parsed.expenses || [];
    STATE.budgets = parsed.budgets || {};
    STATE.goalTarget = parsed.goalTarget || 0;
    STATE.monthlyIncome = parsed.monthlyIncome || 0;
  } else {
    STATE.expenses = [];
    STATE.budgets = {};
    STATE.goalTarget = 0;
    STATE.monthlyIncome = 0;
  }
  checkRecurring();
  updateUI();
}

function saveProfileData() {
  const data = {
    expenses: STATE.expenses,
    budgets: STATE.budgets,
    goalTarget: STATE.goalTarget,
    monthlyIncome: STATE.monthlyIncome,
  };
  localStorage.setItem(
    STORAGE_PREFIX + STATE.currentProfile,
    JSON.stringify(data),
  );
  updateUI();
}

function switchProfile(profileName, initial = false) {
  STATE.currentProfile = profileName;
  saveGlobalData();
  populateProfileSelect();
  loadProfileData(profileName);
  if (!initial) showToast(`Switched to profile: ${profileName}`, "success");
}

// Populate Dropdowns
function populateSelects() {
  // Categories
  el.expCategory.innerHTML = '<option value="">Select Category</option>';
  el.filterCategory.innerHTML = '<option value="">All Categories</option>';
  Object.keys(CATEGORIES).forEach((cat) => {
    el.expCategory.innerHTML += `<option value="${cat}">${cat}</option>`;
    el.filterCategory.innerHTML += `<option value="${cat}">${cat}</option>`;
  });

  // Subcategories handled dynamically

  // Months
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  el.filterMonth.innerHTML = '<option value="">All Months</option>';
  months.forEach((m, idx) => {
    const val = String(idx + 1).padStart(2, "0");
    el.filterMonth.innerHTML += `<option value="${val}">${m}</option>`;
  });
}

function populateProfileSelect() {
  el.profileSelect.innerHTML = "";
  STATE.profiles.forEach((p) => {
    const btn = document.createElement("option");
    btn.value = p;
    btn.textContent = p;
    if (p === STATE.currentProfile) btn.selected = true;
    el.profileSelect.appendChild(btn);
  });
}

// Event Listeners
function attachEventListeners() {
  // Form
  el.form.addEventListener("submit", handleFormSubmit);
  el.expCategory.addEventListener("change", handleCategoryChange);
  el.cancelEditBtn.addEventListener("click", cancelEdit);

  // Filters & Sorting
  [
    el.searchInput,
    el.filterCategory,
    el.filterMonth,
    el.filterYear,
    el.filterStart,
    el.filterEnd,
    el.sortSelect,
  ].forEach((input) => input.addEventListener("input", renderList));

  // Profile
  el.profileSelect.addEventListener("change", (e) =>
    switchProfile(e.target.value),
  );
  el.addProfileBtn.addEventListener("click", () => openModal(el.modalProfile));
  el.saveProfileBtn.addEventListener("click", handleAddProfile);

  // Theme & Share
  el.themeToggle.addEventListener("click", toggleTheme);
  el.shareBtn.addEventListener("click", handleShare);

  // Import/Export
  el.exportBtn.addEventListener("click", exportCSV);
  el.importInput.addEventListener("change", importCSV);

  // Modals & Overlay
  el.overlay.addEventListener("click", closeAllModals);
  el.closeModalBtns.forEach((btn) =>
    btn.addEventListener("click", closeAllModals),
  );

  // Budgets & Goals Modals
  el.setBudgetBtn.addEventListener("click", openBudgetsModal);
  el.saveBudgetsBtn.addEventListener("click", saveBudgets);

  el.setGoalBtn.addEventListener("click", openGoalModal);
  el.saveGoalBtn.addEventListener("click", saveGoal);

  el.setIncomeBtn.addEventListener("click", openIncomeModal);
  el.saveIncomeBtn.addEventListener("click", saveIncome);

  // View Toggles
  el.viewListBtn.addEventListener("click", () => {
    el.calendarView.classList.add("hidden");
    el.expensesList.classList.remove("hidden");
    el.viewListBtn.classList.add("active");
    el.viewCalendarBtn.classList.remove("active");
  });
  el.viewCalendarBtn.addEventListener("click", () => {
    el.expensesList.classList.add("hidden");
    el.calendarView.classList.remove("hidden");
    el.viewCalendarBtn.classList.add("active");
    el.viewListBtn.classList.remove("active");
    renderCalendar();
  });

  // Calendar Handlers
  document.getElementById("cal-prev").addEventListener("click", () => {
    currentCalMonth.setMonth(currentCalMonth.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    currentCalMonth.setMonth(currentCalMonth.getMonth() + 1);
    renderCalendar();
  });
}

// Logic Functions
function handleCategoryChange() {
  const cat = el.expCategory.value;
  const subs = CATEGORIES[cat] || [];
  el.expSubcategory.innerHTML = '<option value="">Select Subcategory</option>';
  if (subs.length > 0) {
    subs.forEach((sub) => {
      el.expSubcategory.innerHTML += `<option value="${sub}">${sub}</option>`;
    });
    el.expSubcategory.disabled = false;
  } else {
    el.expSubcategory.disabled = true;
  }
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const id = el.editId.value || Date.now().toString();
  const name = el.expName.value.trim();
  const amount = parseFloat(el.expAmount.value);
  const date = el.expDate.value;
  const category = el.expCategory.value;
  const subcategory = el.expSubcategory.value;
  const type = el.expType.value;
  const recurring = el.expRecurring.value;
  const notes = el.expNotes.value.trim();

  let receiptBase64 = null;
  if (el.expReceipt.files && el.expReceipt.files[0]) {
    try {
      receiptBase64 = await getBase64(el.expReceipt.files[0]);
    } catch (err) {
      showToast("Failed to process image. It might be too large.", "danger");
      return;
    }
  }

  const expenseObj = {
    id,
    name,
    amount,
    date,
    category,
    subcategory,
    type,
    recurring,
    notes,
    lastAddedDate: date, // for recurring check
  };

  if (el.editId.value) {
    // Keep old receipt if no new one
    const existing = STATE.expenses.find((x) => x.id === id);
    if (!receiptBase64 && existing) expenseObj.receipt = existing.receipt;
    else expenseObj.receipt = receiptBase64;

    STATE.expenses = STATE.expenses.map((ex) =>
      ex.id === id ? expenseObj : ex,
    );
    showToast("Expense updated.");
  } else {
    expenseObj.receipt = receiptBase64;
    STATE.expenses.push(expenseObj);
    showToast("Expense added.");
  }

  saveProfileData();
  cancelEdit(); // resets form
}

function cancelEdit() {
  el.form.reset();
  el.editId.value = "";
  el.formTitle.innerText = "Add Expense";
  el.cancelEditBtn.classList.add("hidden");
  el.expDate.valueAsDate = new Date();
  el.expSubcategory.disabled = true;
  el.expSubcategory.innerHTML = '<option value="">Select Subcategory</option>';
}

function editExpense(id) {
  const ex = STATE.expenses.find((x) => x.id === id);
  if (!ex) return;

  el.editId.value = ex.id;
  el.expName.value = ex.name;
  el.expAmount.value = ex.amount;
  el.expDate.value = ex.date;
  el.expCategory.value = ex.category;
  handleCategoryChange();
  el.expSubcategory.value = ex.subcategory || "";
  el.expType.value = ex.type;
  el.expRecurring.value = ex.recurring || "None";
  el.expNotes.value = ex.notes || "";

  el.formTitle.innerText = "Edit Expense";
  el.cancelEditBtn.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteExpense(id) {
  if (!confirm("Are you sure?")) return;
  STATE.expenses = STATE.expenses.filter((x) => x.id !== id);
  saveProfileData();
  showToast("Expense deleted.", "warning");
}

function viewReceipt(base64Str) {
  if (!base64Str) return;
  el.receiptImg.src = base64Str;
  openModal(el.modalReceipt);
}

// UI Updates
function updateUI() {
  renderList();
  if (!el.calendarView.classList.contains("hidden")) renderCalendar();
  updateDashboard();
  renderCharts();
  renderBudgets();
  renderGoal();
}

function getFilteredAndSortedExpenses() {
  let filtered = [...STATE.expenses];

  // Search
  const q = el.searchInput.value.toLowerCase();
  if (q)
    filtered = filtered.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        x.category.toLowerCase().includes(q),
    );

  // Category
  const cat = el.filterCategory.value;
  if (cat) filtered = filtered.filter((x) => x.category === cat);

  // Month & Year Filter
  const filterYr = el.filterYear.value;
  const filterMo = el.filterMonth.value;
  if (filterYr || filterMo) {
    filtered = filtered.filter((x) => {
      const [y, m] = x.date.split("-");
      let match = true;
      if (filterYr && y !== filterYr) match = false;
      if (filterMo && m !== filterMo) match = false;
      return match;
    });
  }

  // Custom Date Bounds
  const start = el.filterStart.value;
  const end = el.filterEnd.value;
  if (start) filtered = filtered.filter((x) => x.date >= start);
  if (end) filtered = filtered.filter((x) => x.date <= end);

  // Sorting
  const sortVal = el.sortSelect.value;
  filtered.sort((a, b) => {
    if (sortVal === "date-desc") return new Date(b.date) - new Date(a.date);
    if (sortVal === "date-asc") return new Date(a.date) - new Date(b.date);
    if (sortVal === "amount-desc") return b.amount - a.amount;
    if (sortVal === "amount-asc") return a.amount - b.amount;
    if (sortVal === "category") return a.category.localeCompare(b.category);
    return 0;
  });

  return filtered;
}

function renderList() {
  const list = getFilteredAndSortedExpenses();
  el.expensesList.innerHTML = "";

  if (list.length === 0) {
    el.expensesList.innerHTML = `<p class="empty-state" style="padding:1rem; text-align:center;">No expenses found.</p>`;
    return;
  }

  list.forEach((ex) => {
    const item = document.createElement("div");
    item.className = "expense-item";

    let subcat = ex.subcategory ? ` / ${ex.subcategory}` : "";
    let typeBadge =
      ex.type === "Fixed"
        ? `<span class="exp-cat-badge" style="background:rgba(239, 68, 68, 0.1); color:var(--danger)">Fixed</span>`
        : "";
    let recBadge =
      ex.recurring && ex.recurring !== "None"
        ? `<span class="exp-cat-badge" title="Recurring"><i class="ri-repeat-2-line"></i></span>`
        : "";
    let receiptBtn = ex.receipt
      ? `<button class="icon-btn" onclick="viewReceipt('${ex.receipt}')" title="View Receipt"><i class="ri-image-line"></i></button>`
      : "";
    let notesIcon = ex.notes
      ? `<i class="ri-file-list-3-line" title="${ex.notes}"></i>`
      : "";

    item.innerHTML = `
            <div class="exp-info-left">
                <span class="exp-name">${ex.name} ${notesIcon}</span>
                <span class="exp-meta">
                    <span><i class="ri-calendar-line"></i> ${ex.date}</span>
                    <span class="exp-cat-badge">${ex.category}${subcat}</span>
                    ${typeBadge}
                    ${recBadge}
                </span>
            </div>
            <div class="exp-info-right">
                <span class="exp-amount">₹${ex.amount.toFixed(2)}</span>
                <div class="exp-actions">
                    ${receiptBtn}
                    <button class="icon-btn" onclick="editExpense('${ex.id}')"><i class="ri-pencil-line"></i></button>
                    <button class="icon-btn" onclick="deleteExpense('${ex.id}')"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
        `;
    el.expensesList.appendChild(item);
  });
}

function updateDashboard() {
  const now = new Date();
  const curYearStr = now.getFullYear().toString();
  const curMonthStr = String(now.getMonth() + 1).padStart(2, "0");

  let monthTotal = 0;
  let yearTotal = 0;
  let fixedTotal = 0;
  let varTotal = 0;
  let highest = null;
  let lowest = null;

  // For daily average, calculate days so far in month
  const daysInMonth = now.getDate(); // e.g. if today is 15th, divid by 15
  const monthsElapsed = now.getMonth() + 1;

  STATE.expenses.forEach((ex) => {
    const [y, m] = ex.date.split("-");
    const isCurMonth = y === curYearStr && m === curMonthStr;
    const isCurYear = y === curYearStr;
    const amt = ex.amount;

    if (isCurYear) yearTotal += amt;

    if (isCurMonth) {
      monthTotal += amt;
      if (ex.type === "Fixed") fixedTotal += amt;
      else varTotal += amt;

      if (!highest || amt > highest.amount) highest = ex;
      if (!lowest || amt < lowest.amount) lowest = ex;
    }
  });

  el.statMonth.innerText = `₹${monthTotal.toFixed(2)}`;
  el.statYear.innerText = `₹${yearTotal.toFixed(2)}`;
  el.statFixed.innerText = `₹${fixedTotal.toFixed(2)}`;
  el.statVariable.innerText = `₹${varTotal.toFixed(2)}`;

  const avgDaily = monthTotal / Math.max(1, daysInMonth);
  const avgMonthly = yearTotal / Math.max(1, monthsElapsed);
  el.statAvgDaily.innerText = `₹${avgDaily.toFixed(2)}`;
  el.statAvgMonthly.innerText = `₹${avgMonthly.toFixed(2)}`;

  el.statHighest.innerText = highest ? `₹${highest.amount.toFixed(2)}` : "-";
  el.statHighest.title = highest ? highest.name : "";
  el.statLowest.innerText = lowest ? `₹${lowest.amount.toFixed(2)}` : "-";
  el.statLowest.title = lowest ? lowest.name : "";

  el.statMonthlyIncome.innerText = `₹${(STATE.monthlyIncome || 0).toFixed(2)}`;
  if (STATE.monthlyIncome > 0) {
    const ratio = (monthTotal / STATE.monthlyIncome) * 100;
    el.statIncExpRatio.innerText = `${ratio.toFixed(1)}%`;
    if (ratio >= 100) el.statIncExpRatio.style.color = "var(--danger)";
    else if (ratio > 80) el.statIncExpRatio.style.color = "var(--warning)";
    else el.statIncExpRatio.style.color = "var(--success)";
  } else {
    el.statIncExpRatio.innerText = "-";
    el.statIncExpRatio.style.color = "inherit";
  }
}

// Charts
function renderCharts() {
  const now = new Date();
  const curYearStr = now.getFullYear().toString();
  const curMonthStr = String(now.getMonth() + 1).padStart(2, "0");

  const colors = [
    "#4f46e5",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
    "#64748b",
  ];

  // Pie Chart (Current Month Category Distribution)
  let catSums = {};
  Object.keys(CATEGORIES).forEach((c) => (catSums[c] = 0));

  STATE.expenses.forEach((ex) => {
    const [y, m] = ex.date.split("-");
    if (y === curYearStr && m === curMonthStr) {
      if (catSums[ex.category] !== undefined) catSums[ex.category] += ex.amount;
      else catSums[ex.category] = ex.amount;
    }
  });

  let pieLabels = [];
  let pieData = [];
  let pColors = [];
  let cIdx = 0;
  for (let c in catSums) {
    if (catSums[c] > 0) {
      pieLabels.push(c);
      pieData.push(catSums[c]);
      pColors.push(colors[cIdx % colors.length]);
      cIdx++;
    }
  }

  if (pieChartInstance) pieChartInstance.destroy();
  const pieCtx = document.getElementById("pieChart").getContext("2d");
  pieChartInstance = new Chart(pieCtx, {
    type: "doughnut",
    data: {
      labels: pieLabels.length ? pieLabels : ["No Data"],
      datasets: [
        {
          data: pieData.length ? pieData : [1],
          backgroundColor: pieData.length ? pColors : ["#e5e7eb"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { color: getVariableColor("--text-primary") },
        },
      },
    },
  });

  // Line Chart (Current Year Monthly Trend)
  let monthSums = Array(12).fill(0);
  STATE.expenses.forEach((ex) => {
    const [y, m] = ex.date.split("-");
    if (y === curYearStr) {
      monthSums[parseInt(m) - 1] += ex.amount;
    }
  });

  if (lineChartInstance) lineChartInstance.destroy();
  const lineCtx = document.getElementById("lineChart").getContext("2d");
  lineChartInstance = new Chart(lineCtx, {
    type: "line",
    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          label: "Monthly Expenses",
          data: monthSums,
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: getVariableColor("--text-secondary") },
          grid: { color: getVariableColor("--border-color") },
        },
        x: {
          ticks: { color: getVariableColor("--text-secondary") },
          grid: { color: getVariableColor("--border-color", "transparent") },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function getVariableColor(varName, fallback = "#000") {
  return (
    getComputedStyle(document.body).getPropertyValue(varName).trim() || fallback
  );
}

// Goals & Budgets
function renderBudgets() {
  el.budgetsList.innerHTML = "";

  // Calculate current month spending per category
  const now = new Date();
  const curYearStr = now.getFullYear().toString();
  const curMonthStr = String(now.getMonth() + 1).padStart(2, "0");

  let spentPerCat = {};
  STATE.expenses.forEach((ex) => {
    const [y, m] = ex.date.split("-");
    if (y === curYearStr && m === curMonthStr) {
      spentPerCat[ex.category] = (spentPerCat[ex.category] || 0) + ex.amount;
    }
  });

  let hasBudgets = false;
  for (let cat in STATE.budgets) {
    const limit = STATE.budgets[cat];
    if (!limit) continue;
    hasBudgets = true;
    const spent = spentPerCat[cat] || 0;
    const pct = Math.min((spent / limit) * 100, 100);
    let colorClass = pct > 90 ? "danger" : pct > 75 ? "warning" : "";

    // Notify if exceeding
    if (spent > limit) {
      // Only show toast if user recently opened app or added expense, tracking dismissed state is overkill for demo
      // showToast(`Budget exceeded for ${cat}!`, 'danger');
    }

    const rem = limit - spent;
    const html = `
            <div class="goal-item">
                <div class="goal-info">
                    <span class="goal-name">${cat}</span>
                    <span class="goal-values"><span class="${rem < 0 ? "req" : ""}">${rem >= 0 ? "₹" + rem.toFixed(0) + " left" : "Overspent"}</span> / ₹${limit}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${colorClass}" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    el.budgetsList.insertAdjacentHTML("beforeend", html);
  }

  if (!hasBudgets) {
    el.budgetsList.innerHTML = `<p class="empty-state">No budgets set.</p>`;
  }
}

function renderGoal() {
  if (!STATE.goalTarget) {
    el.goalDisplay.style.display = "none";
    el.goalEmpty.style.display = "block";
    return;
  }
  el.goalDisplay.style.display = "block";
  el.goalEmpty.style.display = "none";

  const curYearStr = new Date().getFullYear().toString();
  let yearTotal = STATE.expenses
    .filter((x) => x.date.startsWith(curYearStr))
    .reduce((s, x) => s + x.amount, 0);

  el.goalCurrentVal.textContent = `₹${yearTotal.toFixed(0)}`;
  el.goalTargetVal.textContent = `₹${STATE.goalTarget}`;

  const pct = Math.min((yearTotal / STATE.goalTarget) * 100, 100);
  el.goalProgressFill.style.width = pct + "%";

  let status = "";
  if (yearTotal > STATE.goalTarget) {
    el.goalProgressFill.className = "progress-fill danger";
    status = "You have exceeded your annual spending limit!";
  } else if (pct > 80) {
    el.goalProgressFill.className = "progress-fill warning";
    status = "Approaching spending limit. Be careful.";
  } else {
    el.goalProgressFill.className = "progress-fill";
    status = "On track. Great job!";
  }
  el.goalStatusText.textContent = status;
}

function openBudgetsModal() {
  el.budgetInputsContainer.innerHTML = "";
  Object.keys(CATEGORIES).forEach((cat) => {
    const val = STATE.budgets[cat] || "";
    const html = `
            <div class="budget-input-row">
                <label>${cat}</label>
                <input type="number" step="1" min="0" data-cat="${cat}" value="${val}" placeholder="Limit">
            </div>
        `;
    el.budgetInputsContainer.insertAdjacentHTML("beforeend", html);
  });
  openModal(el.modalBudget);
}

function saveBudgets() {
  const inputs = el.budgetInputsContainer.querySelectorAll("input");
  inputs.forEach((inp) => {
    const cat = inp.getAttribute("data-cat");
    const val = parseFloat(inp.value);
    if (!isNaN(val) && val > 0) STATE.budgets[cat] = val;
    else delete STATE.budgets[cat];
  });
  saveProfileData();
  closeAllModals();
  showToast("Budgets saved.");
}

function openGoalModal() {
  el.goalTargetInput.value = STATE.goalTarget || "";
  openModal(el.modalGoal);
}

function saveGoal() {
  const val = parseFloat(el.goalTargetInput.value);
  STATE.goalTarget = !isNaN(val) ? val : 0;
  saveProfileData();
  closeAllModals();
  showToast("Financial goal saved.");
}

function openIncomeModal() {
  el.incomeInput.value = STATE.monthlyIncome || "";
  openModal(el.modalIncome);
}

function saveIncome() {
  const val = parseFloat(el.incomeInput.value);
  STATE.monthlyIncome = !isNaN(val) ? val : 0;
  saveProfileData();
  closeAllModals();
  showToast("Monthly income saved.");
}

// Recurring check logic
function checkRecurring() {
  const today = new Date().toISOString().split("T")[0];
  let newExpensesAdded = false;

  STATE.expenses.forEach((ex) => {
    if (!ex.recurring || ex.recurring === "None") return;

    let lastDate = new Date(ex.lastAddedDate || ex.date);
    let current = new Date(today);

    while (true) {
      // Determine next date
      let nextDate = new Date(lastDate);
      if (ex.recurring === "Daily") nextDate.setDate(nextDate.getDate() + 1);
      else if (ex.recurring === "Weekly")
        nextDate.setDate(nextDate.getDate() + 7);
      else if (ex.recurring === "Monthly")
        nextDate.setMonth(nextDate.getMonth() + 1);
      else if (ex.recurring === "Yearly")
        nextDate.setFullYear(nextDate.getFullYear() + 1);

      if (nextDate <= current) {
        // Time to add!
        const nextDateStr = nextDate.toISOString().split("T")[0];
        const clone = {
          ...ex,
          id: Date.now().toString() + Math.random(),
          date: nextDateStr,
          lastAddedDate: nextDateStr,
        };
        STATE.expenses.push(clone);
        // Update original lastAddedDate
        ex.lastAddedDate = nextDateStr;
        lastDate = nextDate;
        newExpensesAdded = true;
      } else {
        break;
      }
    }
  });

  if (newExpensesAdded) {
    showToast("Auto-added recurring expenses.", "success");
    saveProfileData(); // This persists the changes
  }
}

// Calendar View Logic
let currentCalMonth = new Date();
function renderCalendar() {
  const y = currentCalMonth.getFullYear();
  const m = currentCalMonth.getMonth();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  document.getElementById("cal-month-year").textContent =
    `${monthNames[m]} ${y}`;

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const grid = document.getElementById("cal-grid");
  grid.innerHTML = "";

  // blanks
  for (let i = 0; i < firstDay; i++) {
    grid.innerHTML += `<div class="cal-day empty"></div>`;
  }

  // Gather sum per day for current profile & month
  let dailySums = {};
  STATE.expenses.forEach((ex) => {
    const d = new Date(ex.date);
    if (d.getFullYear() === y && d.getMonth() === m) {
      const dayNum = d.getDate();
      dailySums[dayNum] = (dailySums[dayNum] || 0) + ex.amount;
    }
  });

  const todayDate = new Date();
  const isThisMonth =
    todayDate.getFullYear() === y && todayDate.getMonth() === m;

  for (let i = 1; i <= daysInMonth; i++) {
    let isToday = isThisMonth && todayDate.getDate() === i;
    let sum = dailySums[i] ? `₹${dailySums[i].toFixed(0)}` : "";

    grid.innerHTML += `
            <div class="cal-day ${isToday ? "today" : ""}">
                <span class="date-num">${i}</span>
                <span class="day-total">${sum}</span>
            </div>
        `;
  }
}

// Import / Export CSV
function exportCSV() {
  if (STATE.expenses.length === 0) {
    showToast("No data to export", "warning");
    return;
  }
  const headers = [
    "ID",
    "Name",
    "Amount",
    "Date",
    "Category",
    "Subcategory",
    "Type",
    "Recurring",
    "Notes",
  ];
  const rows = [headers.join(",")];

  STATE.expenses.forEach((e) => {
    // Enclose text fields in quotes to handle commas
    let r = [
      e.id,
      `"${(e.name || "").replace(/"/g, '""')}"`,
      e.amount,
      e.date,
      e.category,
      e.subcategory || "",
      e.type,
      e.recurring || "",
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ];
    rows.push(r.join(","));
  });

  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ExpenseReport_${STATE.currentProfile}.csv`;
  a.click();
  showToast("CSV Exported successfully.");
}

function importCSV(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    const text = evt.target.result;
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) return; // Only header or empty

    let added = 0;
    // Parse simple CSV (Basic logic, doesn't fully handle complex comma escaping, fine for demo)
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/; // match commas not inside quotes

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i]
        .split(regex)
        .map((s) => s.replace(/^"|"$/g, "").trim());
      // Expected cols based on export: ID, Name, Amount, Date, Category, Subcategory, Type, Recurring, Notes
      if (row.length >= 4) {
        // Ensure date and amount are valid
        if (!isNaN(parseFloat(row[2])) && row[3].length > 0) {
          STATE.expenses.push({
            id: row[0] || Date.now().toString() + i,
            name: row[1],
            amount: parseFloat(row[2]),
            date: row[3],
            category: row[4] || "Other",
            subcategory: row[5] || "",
            type: row[6] || "Variable",
            recurring: row[7] || "None",
            notes: row[8] || "",
            lastAddedDate: row[3],
          });
          added++;
        }
      }
    }
    if (added > 0) {
      saveProfileData();
      showToast(`Imported ${added} expenses.`);
    }
  };
  reader.readAsText(file);
  e.target.value = ""; // Reset
}

// Global Actions & Utilities
function handleAddProfile() {
  const name = el.newProfileName.value.trim();
  if (name && !STATE.profiles.includes(name)) {
    STATE.profiles.push(name);
    closeAllModals();
    switchProfile(name);
  } else {
    showToast("Invalid or duplicate name.", "warning");
  }
  el.newProfileName.value = "";
}

function handleShare() {
  if (navigator.share) {
    // generate a summary
    const curYearStr = new Date().getFullYear().toString();
    let yearTotal = STATE.expenses
      .filter((x) => x.date.startsWith(curYearStr))
      .reduce((s, x) => s + x.amount, 0);

    navigator
      .share({
        title: "My Expense Report",
        text: `I've spent ₹${yearTotal.toFixed(2)} this year so far! Tracked via ExpenseReport App.`,
        url: window.location.href,
      })
      .catch(console.error);
  } else {
    const text = `I've tracked ${STATE.expenses.length} expenses in ${STATE.currentProfile} profile across ExpenseReport.`;
    navigator.clipboard.writeText(text);
    showToast("Summary copied to clipboard!");
  }
}

function loadTheme() {
  const isDark = localStorage.getItem("ExpenseReport_Theme") === "dark";
  if (isDark) document.body.classList.add("dark");
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("ExpenseReport_Theme", isDark ? "dark" : "light");
  if (pieChartInstance) renderCharts(); // re-render charts for colors
}

// Modals
function openModal(modalEl) {
  el.overlay.classList.remove("hidden");
  modalEl.classList.remove("hidden");
}
function closeAllModals() {
  el.overlay.classList.add("hidden");
  el.modals.forEach((m) => m.classList.add("hidden"));
}

// Toasts
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "ri-check-line";
  if (type === "warning") icon = "ri-error-warning-line";
  if (type === "danger") icon = "ri-close-circle-line";

  toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease reverse forwards";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// File to Base64
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// Run
document.addEventListener("DOMContentLoaded", init);
