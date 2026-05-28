<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>เติมเครดิต — Super E-ED</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { font-family: 'IBM Plex Sans Thai', sans-serif; }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
    </style>
    <script>
        const token = localStorage.getItem("token");
        if (!token) window.location.href = "login.php";
    </script>
</head>
<body class="bg-slate-50 min-h-screen">

<!-- Navbar -->
<nav class="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
    <div class="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
            <a href="index.php" class="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition text-sm font-medium">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                กลับ
            </a>
            <span class="text-slate-200">|</span>
            <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                </div>
                <span class="font-bold text-slate-800 text-sm">เติมเครดิต</span>
            </div>
        </div>
        <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl min-w-[60px] text-center" id="nav-credit">฿0.00</span>
    </div>
</nav>

<div class="max-w-lg mx-auto px-4 py-6 space-y-4">

    <!-- Balance card -->
    <div class="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white fade-in">
        <p class="text-sm opacity-75 mb-1">เครดิตคงเหลือ</p>
        <p class="text-4xl font-bold" id="balance-main">฿0.00</p>
        <p class="text-xs opacity-50 mt-1" id="student-id-label"></p>
    </div>

    <!-- Card ข้อมูลการโอน -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 fade-in" style="animation-delay:80ms">
        <h2 class="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            โอนเงินมาที่
        </h2>

        <div class="flex gap-4 items-start">
            <!-- QR Code -->
            <div class="flex-shrink-0">
                <div class="w-28 h-28 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                    <img id="qr-img" class="hidden w-full h-full object-contain p-1" alt="QR PromptPay"/>
                    <div id="qr-placeholder" class="text-center p-2">
                        <svg class="w-8 h-8 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                        </svg>
                        <p class="text-xs text-slate-300 mt-1">QR Code</p>
                    </div>
                </div>
            </div>

            <!-- ข้อมูลบัญชี -->
            <div class="flex-1 space-y-2.5">
                <div>
                    <p class="text-xs text-slate-400">ธนาคาร</p>
                    <p class="text-sm font-semibold text-slate-800" id="info-bank">—</p>
                </div>
                <div>
                    <p class="text-xs text-slate-400">เลขบัญชี</p>
                    <div class="flex items-center gap-2">
                        <p class="text-sm font-bold text-slate-800 tracking-wider" id="info-account">—</p>
                        <button onclick="copyAccount()" class="text-xs text-indigo-500 hover:text-indigo-700 transition" title="คัดลอก">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div>
                    <p class="text-xs text-slate-400">ชื่อบัญชี</p>
                    <p class="text-sm font-semibold text-slate-800" id="info-name">—</p>
                </div>
            </div>
        </div>

        <p class="text-xs text-slate-400 mt-4 text-center">
            โอนเงินแล้วอัพโหลดสลิปด้านล่าง — ระบบจะเติมเครดิตให้อัตโนมัติ
        </p>
    </div>

    <!-- Upload form -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 fade-in" style="animation-delay:160ms">
        <h2 class="font-bold text-slate-800 mb-4">อัพโหลดสลิปโอนเงิน</h2>

        <label for="slip-file" class="block mb-4 cursor-pointer">
            <div class="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition">
                <div id="slip-preview-wrap" class="hidden mb-3">
                    <img id="slip-preview" class="max-h-52 mx-auto rounded-xl object-contain" alt="preview"/>
                </div>
                <div id="slip-placeholder">
                    <svg class="w-9 h-9 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p class="text-sm text-slate-500 font-medium">แตะเพื่อเลือกรูปสลิป</p>
                    <p class="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP ขนาดไม่เกิน 5MB</p>
                </div>
            </div>
        </label>
        <input id="slip-file" type="file" accept=".jpg,.jpeg,.png,.jfif,.webp" class="hidden" onchange="previewSlip(this)"/>

        <div id="slip-status" class="hidden rounded-xl px-4 py-3 text-sm font-medium mb-4"></div>

        <button onclick="submitSlip()" id="submit-btn"
            class="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-md shadow-indigo-200">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            <span id="submit-btn-text">ส่งสลิป</span>
        </button>
        <p class="text-xs text-slate-400 text-center mt-2">ระบบจะอ่านยอดเงินจากสลิปอัตโนมัติ</p>
    </div>

    <!-- History -->
    <div class="bg-white rounded-2xl border border-slate-100 p-5 fade-in" style="animation-delay:240ms">
        <h2 class="font-bold text-slate-800 mb-4">ประวัติล่าสุด</h2>
        <div id="history-list">
            <div class="flex items-center justify-center py-8 text-slate-400 gap-2">
                <svg class="w-4 h-4 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z"/>
                </svg>
                <span class="text-sm">กำลังโหลด...</span>
            </div>
        </div>
    </div>

</div>

<script>
    const student_id = localStorage.getItem("id_code");
    if (!student_id) window.location.href = "login.php";
    document.getElementById("student-id-label").textContent = `รหัส: ${student_id}`;

    async function loadPaymentInfo() {
        try {
            const res = await fetch("api/payment_info.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({})
            }).then(r => r.json());

            document.getElementById("info-bank").textContent    = res.bank_name    || "—";
            document.getElementById("info-account").textContent = res.account_no   || "—";
            document.getElementById("info-name").textContent    = res.account_name || "—";

            if (res.qr_image) {
                const img = document.getElementById("qr-img");
                img.src = res.qr_image;
                img.classList.remove("hidden");
                document.getElementById("qr-placeholder").classList.add("hidden");
            }
        } catch(e) {
            console.warn("loadPaymentInfo error:", e);
        }
    }

    function copyAccount() {
        const acct = document.getElementById("info-account").textContent;
        navigator.clipboard.writeText(acct.replace(/-/g, '')).then(() => {
            showSlipStatus("approved", `คัดลอกเลขบัญชีแล้ว: ${acct}`);
            setTimeout(() => document.getElementById("slip-status").classList.add("hidden"), 2000);
        });
    }

    async function loadNavCredit() {
        const el = document.getElementById("nav-credit");
        if (el) el.textContent = "฿0.00";
        try {
            const res = await fetch("api/credit.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_id })
            }).then(r => r.json());
            const bal = (res.balance ?? 0).toFixed(2);
            if (el) el.textContent = `฿${bal}`;
            document.getElementById("balance-main").textContent = `฿${bal}`;
            renderHistory(res.history ?? []);
        } catch(e) {
            if (el) el.textContent = "฿0.00";
            document.getElementById("balance-main").textContent = "฿0.00";
            document.getElementById("history-list").innerHTML = `<p class="text-sm text-slate-400 text-center py-4">ไม่สามารถโหลดได้</p>`;
        }
    }
    loadPaymentInfo();
    loadNavCredit();

    function renderHistory(history) {
        const el = document.getElementById("history-list");
        if (!history.length) {
            el.innerHTML = `<p class="text-sm text-slate-400 text-center py-6">ยังไม่มีประวัติ</p>`;
            return;
        }
        el.innerHTML = history.map(tx => {
            const isTopup    = tx.type === 'topup';
            const amtColor   = isTopup ? 'text-emerald-600' : 'text-slate-700';
            const sign       = isTopup ? '+' : '-';
            const typeLabel  = isTopup ? 'เติมเครดิต' : 'ใช้งาน';
            const typeCls    = isTopup ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500';
            const stColor    = tx.status === 'completed' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-red-400';
            const stLabel    = tx.status === 'completed' ? 'สำเร็จ' : tx.status === 'pending' ? 'รอดำเนินการ' : 'ถูกปฏิเสธ';
            const date       = new Date(tx.created_at).toLocaleString('th-TH', { dateStyle:'short', timeStyle:'short' });
            return `
            <div class="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div class="flex items-center gap-3 min-w-0">
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${typeCls}">${typeLabel}</span>
                    <div class="min-w-0">
                        <p class="text-xs text-slate-600 font-medium truncate">${tx.description || '—'}</p>
                        <p class="text-xs text-slate-400">${date} · <span class="${stColor}">${stLabel}</span></p>
                    </div>
                </div>
                <span class="font-bold text-sm flex-shrink-0 ml-2 ${amtColor}">${sign}${parseFloat(tx.amount).toFixed(2)}</span>
            </div>`;
        }).join("");
    }

    function previewSlip(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById("slip-preview").src = e.target.result;
            document.getElementById("slip-preview-wrap").classList.remove("hidden");
            document.getElementById("slip-placeholder").classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }

    async function submitSlip() {
        const file = document.getElementById("slip-file").files[0];
        if (!file) { showSlipStatus("error", "กรุณาเลือกรูปสลิปก่อน"); return; }

        const form = new FormData();
        form.append("student_id", student_id);
        form.append("slip", file);

        const btn     = document.getElementById("submit-btn");
        const btnText = document.getElementById("submit-btn-text");
        btn.disabled  = true;
        btnText.textContent = "กำลังตรวจสลิป...";

        try {
            const res = await fetch("api/topup_slip.php", { method: "POST", body: form }).then(r => r.json());

            if (res.success || res.status === 'approved') {
                showSlipStatus("approved", res.message);
                loadNavCredit();
            } else if (res.status === 'pending') {
                showSlipStatus("pending", res.message);
            } else {
                showSlipStatus("rejected", res.message ?? "เกิดข้อผิดพลาด");
            }
        } catch(e) {
            showSlipStatus("error", "เชื่อมต่อ server ไม่ได้");
        } finally {
            btn.disabled = false;
            btnText.textContent = "ส่งสลิป";
        }
    }

    function showSlipStatus(type, msg) {
        const el = document.getElementById("slip-status");
        const styles = {
            approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
            pending:  "bg-yellow-50 text-yellow-700 border border-yellow-200",
            rejected: "bg-red-50 text-red-600 border border-red-200",
            error:    "bg-red-50 text-red-600 border border-red-200",
        };
        el.className = `rounded-xl px-4 py-3 text-sm font-medium mb-4 ${styles[type] ?? styles.error}`;
        el.textContent = msg;
        el.classList.remove("hidden");
    }
</script>
</body>
</html>
