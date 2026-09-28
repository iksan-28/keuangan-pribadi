const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "123456";

const $ = (id) => document.getElementById(id);
const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");

$("date").value = new Date().toISOString().slice(0, 10);

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = $("username").value.trim();
  const password = $("password").value;

  if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
    sessionStorage.setItem("loggedIn", "true");
    sessionStorage.setItem("username", username);
    showApp();
  } else {
    $("loginMessage").textContent =
      "Username atau password salah. Akses ditolak.";
    $("password").value = "";
  }
});

function showApp() {
  $("loginPage").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("userName").textContent = sessionStorage.getItem("username") || "Admin";
  render();
}

if (sessionStorage.getItem("loggedIn") === "true") showApp();

$("logoutBtn").addEventListener("click", () => {
  sessionStorage.clear();
  $("app").classList.add("hidden");
  $("loginPage").classList.remove("hidden");
  $("password").value = "";
});

document.querySelectorAll("[data-page]").forEach((btn) => {
  btn.addEventListener("click", () => openPage(btn.dataset.page));
});

function openPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
  $(page + "Page").classList.remove("hidden");

  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));
  const active = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (active) active.classList.add("active");

  $("pageTitle").textContent =
    page === "dashboard"
      ? "Dashboard"
      : page === "transactions"
        ? "Transaksi"
        : "Laporan";
}

$("transactionForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const transaction = {
    id: Date.now(),
    type: $("type").value,
    description: $("description").value.trim(),
    amount: Number($("amount").value),
    date: $("date").value,
  };

  transactions.unshift(transaction);
  save();
  e.target.reset();
  $("date").value = new Date().toISOString().slice(0, 10);
  render();
});

function save() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function calculate() {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return { income, expense, balance: income - expense };
}

function render() {
  const total = calculate();
  $("income").textContent = formatRupiah(total.income);
  $("expense").textContent = formatRupiah(total.expense);
  $("balance").textContent = formatRupiah(total.balance);

  $("reportIncome").textContent = formatRupiah(total.income);
  $("reportExpense").textContent = formatRupiah(total.expense);
  $("reportBalance").textContent = formatRupiah(total.balance);

  renderRecent();
  renderTable();

  $("reportText").textContent = transactions.length
    ? `Terdapat ${transactions.length} transaksi yang tersimpan. Saldo dihitung dari total pemasukan dikurangi total pengeluaran.`
    : "Belum ada transaksi. Tambahkan pemasukan atau pengeluaran melalui Dashboard.";
}

function renderRecent() {
  const list = $("recentTransactions");
  const recent = transactions.slice(0, 5);

  if (!recent.length) {
    list.innerHTML = `<p style="color:#8992a2">Belum ada transaksi.</p>`;
    return;
  }

  list.innerHTML = recent
    .map(
      (t) => `
    <div class="transaction-item">
      <div>
        <b>${escapeHTML(t.description)}</b>
        <small>${formatDate(t.date)}</small>
      </div>
      <span class="${t.type === "income" ? "plus" : "minus"}">
        ${t.type === "income" ? "+" : "-"} ${formatRupiah(t.amount)}
      </span>
    </div>
  `,
    )
    .join("");
}

function renderTable() {
  const table = $("transactionTable");

  if (!transactions.length) {
    table.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#8992a2">Belum ada transaksi.</td></tr>`;
    return;
  }

  table.innerHTML = transactions
    .map(
      (t) => `
    <tr>
      <td>${formatDate(t.date)}</td>
      <td>${escapeHTML(t.description)}</td>
      <td>${t.type === "income" ? "Pemasukan" : "Pengeluaran"}</td>
      <td class="${t.type === "income" ? "plus" : "minus"}">
        ${t.type === "income" ? "+" : "-"} ${formatRupiah(t.amount)}
      </td>
      <td><button class="delete-btn" onclick="deleteTransaction(${t.id})">Hapus</button></td>
    </tr>
  `,
    )
    .join("");
}

function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  save();
  render();
}

$("clearTransactions").addEventListener("click", () => {
  if (!transactions.length) return;
  if (confirm("Hapus semua transaksi?")) {
    transactions = [];
    save();
    render();
  }
});

function formatDate(date) {
  return new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHTML(text) {
  return text.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
}
