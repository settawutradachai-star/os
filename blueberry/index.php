<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>วิชาของฉัน</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { font-family: 'IBM Plex Sans Thai', sans-serif; }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
    </style>
    <script>
        const token     = localStorage.getItem("token");
        const year      = localStorage.getItem("year");
        const term      = localStorage.getItem("term");
        const id_code   = localStorage.getItem("id_code");
        const full_name = localStorage.getItem("full_name");
        const id_class  = localStorage.getItem("id_class");
        const subjects  = JSON.parse(localStorage.getItem("subjects") || "[]");

        if (!token || !year || !term || !id_code) {
            localStorage.clear();
            window.location.href = "login.php";
        }
    </script>
</head>
<body class="bg-slate-50 min-h-screen">

<!-- Top Nav -->
<nav class="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
    <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
            </div>
            <span class="font-bold text-slate-800 text-sm">Super E-ED</span>
        </div>
        <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500 hidden sm:block" id="nav-student"></span>
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl min-w-[60px] text-center" id="nav-credit">฿0.00</span>
            <a href="topup.php" class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                เติมเงิน
            </a>
            <button onclick="doLogout()" class="text-xs text-slate-500 hover:text-red-500 transition flex items-center gap-1 ml-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                ออกจากระบบ
            </button>
        </div>
    </div>
</nav>

<div class="max-w-3xl mx-auto px-4 py-6">

    <!-- Header -->
    <div class="mb-6 fade-in">
        <h1 class="text-xl font-bold text-slate-800">วิชาของฉัน</h1>
        <p class="text-sm text-slate-400 mt-0.5" id="sub-info"></p>
    </div>

    <!-- Subject grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="subjects-grid">
        <!-- filled by JS -->
    </div>

</div>

<script>
    // ── Init ─────────────────────────────────────────────────────
    document.getElementById("nav-student").textContent = full_name || id_code;
    document.getElementById("sub-info").textContent =
        `${full_name || id_code} · ${id_class || ""} · ปี ${year} เทอม ${term}`;

    const grid = document.getElementById("subjects-grid");

    // ── openCourse ────────────────────────────────────────────────
    async function openCourse(sub) {
        const nameTh = sub.name_th || sub.name_en || "";
        let recid = sub.recid;

        // ถ้ายังไม่มี recid ต้อง register ก่อนแล้วเอา recid จาก response
        if (!recid) {
            try {
                const res = await fetch(`https://e-ed.e-tech.ac.th/api/course/${sub.course_id}/register`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        host_id:  1,
                        open_id:  sub.open_id,
                        courseid: sub.course_id
                    })
                });
                const data = await res.json();
                console.log("register response:", data);
                // เอา recid จาก response (ลอง field ต่างๆ)
                recid = data.recid || data.id || data.open_recid || data.data?.recid || "";
            } catch(e) {
                console.warn("register error", e);
            }
        }

        if (!recid) {
            alert("ไม่สามารถเข้าวิชาได้ กรุณาลองใหม่อีกครั้ง (recid not found)");
            console.error("recid still empty after register");
            return;
        }

        window.location.href = `work.php?course_id=${sub.course_id}&recid=${recid}&name=${encodeURIComponent(nameTh)}`;
    }

    if (subjects.length === 0) {
        grid.innerHTML = `
            <div class="col-span-2 flex flex-col items-center gap-2 py-16 text-slate-400">
                <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p class="text-sm font-medium">ไม่พบรายวิชา</p>
            </div>`;
    } else {
        grid.innerHTML = subjects.map((sub, i) => {
            const nameTh = sub.name_th || sub.name_en || "ไม่มีชื่อ";
            const nameEn = sub.name_en || "";
            const code   = sub.code || sub.course_id;

            return `
            <div data-idx="${i}" role="button"
                class="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4 card-hover cursor-pointer fade-in"
                style="animation-delay:${i * 50}ms">

                <div class="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                </div>

                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-slate-800 text-sm leading-snug truncate">${nameTh}</p>
                    <p class="text-xs text-slate-400 mt-0.5 truncate">${nameEn}</p>
                    <span class="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        รหัส ${code}
                    </span>
                </div>

                <svg class="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
            </div>`;
        }).join("");

        // event delegation — ฟัง click ที่ grid แล้วหา data-idx
        grid.addEventListener("click", e => {
            const card = e.target.closest("[data-idx]");
            if (!card) return;
            const idx = parseInt(card.dataset.idx);
            openCourse(subjects[idx]);
        });
    }

    async function loadNavCredit() {
        const student_id = localStorage.getItem("id_code");
        const el = document.getElementById("nav-credit");
        if (!student_id || !el) return;
        el.textContent = "฿0.00";
        try {
            const res = await fetch("api/credit.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_id })
            }).then(r => r.json());
            el.textContent = `฿${(res.balance ?? 0).toFixed(2)}`;
        } catch(e) {
            el.textContent = "฿0.00";
        }
    }
    loadNavCredit();

    function doLogout() {
        localStorage.clear();
        window.location.href = "login.php";
    }
</script>
</body>
</html>