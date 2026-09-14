<!DOCTYPE html>
<html lang="th">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>บทเรียน</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            font-family: 'IBM Plex Sans Thai', sans-serif;
        }

        .fade-in {
            animation: fadeIn 0.4s ease forwards;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(12px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .card-hover {
            transition: all 0.2s ease;
        }

        .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        ::-webkit-scrollbar {
            width: 6px;
        }

        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }

        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 99px;
        }

        .chapter-bar {
            transition: width 0.4s cubic-bezier(.4, 0, .2, 1);
        }

        .collapse-content {
            overflow: hidden;
            transition: max-height 0.35s cubic-bezier(.4, 0, .2, 1);
        }
    </style>
    <script>
        const token = localStorage.getItem("token");
        if (!token) window.location.href = "login.php";

        const params = new URLSearchParams(window.location.search);
        const course_id = params.get("course_id");
        const recid = params.get("recid");
        const name = decodeURIComponent(params.get("name") || `วิชา #${course_id}`);

        if (!course_id || !recid) window.location.href = "index.php";
    </script>
</head>

<body class="bg-slate-50 min-h-screen">

    <!-- Top Nav -->
    <nav class="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <a href="index.php" class="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    กลับ
                </a>
                <span class="text-slate-200">|</span>
                <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <span class="font-bold text-slate-800 text-sm truncate max-w-[180px] sm:max-w-xs" id="nav-course-name"></span>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-xs text-slate-400" id="nav-course-id"></span>
                <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl min-w-[60px] text-center" id="nav-credit">฿0.00</span>
                <a href="topup.php" class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    เติมเงิน
                </a>
            </div>
        </div>
    </nav>

    <div class="max-w-2xl mx-auto px-4 py-6">

        <!-- Summary cards -->
        <div class="grid grid-cols-3 gap-3 mb-6 fade-in">
            <div class="bg-white rounded-2xl border border-slate-100 p-4 text-center card-hover">
                <div class="text-xl font-bold text-slate-800" id="sum-score">—</div>
                <div class="text-xs text-slate-400 mt-0.5">คะแนนรวม</div>
            </div>
            <div class="bg-white rounded-2xl border border-slate-100 p-4 text-center card-hover">
                <div class="text-xl font-bold text-slate-800" id="sum-done">—</div>
                <div class="text-xs text-slate-400 mt-0.5">ผ่านแล้ว</div>
            </div>
            <div class="bg-white rounded-2xl border border-slate-100 p-4 text-center card-hover">
                <div class="text-xl font-bold text-slate-800" id="sum-chapters">—</div>
                <div class="text-xs text-slate-400 mt-0.5">บทเรียน</div>
            </div>
        </div>

        <!-- Auto button -->
        <div class="mb-4 fade-in" style="animation-delay:150ms">
            <div class="flex gap-2 mb-2">
                <button onclick="selectAll(true)"
                    class="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition">
                    เลือกทั้งหมด
                </button>
                <button onclick="selectAll(false)"
                    class="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition">
                    ยกเลิกทั้งหมด
                </button>
            </div>
            <button onclick="showPayModal()"
                id="auto-btn"
                class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-indigo-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span id="auto-btn-text">Auto ที่เลือก</span>
            </button>
            <p class="text-xs text-slate-400 text-center mt-2" id="auto-status"></p>
        </div>

        <!-- Modal ยืนยันชำระเงิน -->
        <div id="pay-modal" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div class="bg-white rounded-3xl w-full max-w-sm p-6 fade-in">
                <h3 class="font-bold text-slate-800 text-lg mb-1">ยืนยันการชำระเงิน</h3>
                <p class="text-sm text-slate-500 mb-4">ระบบจะหักเครดิตและทำ Auto ให้อัตโนมัติ</p>
                <div class="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">จำนวน task ที่เลือก</span>
                        <span class="font-semibold text-slate-800" id="modal-task-count">0</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">ราคาต่อ task</span>
                        <span class="font-semibold text-slate-800" id="modal-price">1 บาท</span>
                    </div>
                    <div class="h-px bg-slate-200"></div>
                    <div class="flex justify-between text-sm font-bold">
                        <span class="text-slate-700">รวม</span>
                        <span class="text-indigo-600" id="modal-total">0 บาท</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-slate-500">เครดิตคงเหลือหลังหัก</span>
                        <span id="modal-balance-after" class="font-semibold">— บาท</span>
                    </div>
                </div>
                <div id="modal-error" class="hidden text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4"></div>
                <div class="flex gap-3">
                    <button onclick="closePayModal()"
                        class="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm transition">
                        ยกเลิก
                    </button>
                    <button onclick="confirmPay()"
                        id="confirm-pay-btn"
                        class="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition">
                        ชำระ & Auto
                    </button>
                </div>
                <a href="topup.php" class="block text-center text-xs text-indigo-500 hover:underline mt-3">
                    เติมเครดิต →
                </a>
            </div>
        </div>

        <!-- Chapter list -->
        <div id="chapter-list">
            <div id="loading" class="flex items-center justify-center gap-3 py-16 text-slate-400">
                <svg class="w-5 h-5 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 100 20v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
                <span class="text-sm">กำลังโหลด...</span>
            </div>
        </div>

    </div>

    <script>
        let allChaptersData = [];
        document.getElementById("nav-course-name").textContent = name;
        document.getElementById("nav-course-id").textContent = `ID: ${course_id}`;

        // ── Fetch ────────────────────────────────────────────────────
        fetch(`https://e-ed.e-tech.ac.th/api/course/${course_id}/v2Items?recid=${recid}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            })
            .then(res => res.json())
            .then(result => {
                document.getElementById("loading")?.remove();
                if (!Array.isArray(result)) {
                    document.getElementById("chapter-list").innerHTML = errHTML("โหลดข้อมูลไม่สำเร็จ");
                    return;
                }
                allChaptersData = result;
                renderSummary(result);
                renderChapters(result);
            })
            .catch(err => {
                document.getElementById("loading")?.remove();
                document.getElementById("chapter-list").innerHTML = errHTML("เกิดข้อผิดพลาด: " + err.message);
            });

        // ── Summary ──────────────────────────────────────────────────
        function renderSummary(data) {
            let totalScore = 0,
                maxScore = 0;
            let doneTasks = 0,
                totalTasks = 0;
            data.forEach(ch => {
                (ch.child || []).forEach(item => {
                    if (item.item_type === "Q") {
                        totalScore += item.stu_score || 0;
                        maxScore += item.item_score || 0;
                        totalTasks++;
                        if (item.view_success === "Y") doneTasks++;
                    } else if (item.item_type === "M") {
                        totalTasks++;
                        if (item.view_success === "Y") doneTasks++;
                    }
                });
            });
            document.getElementById("sum-score").textContent = `${totalScore}/${maxScore}`;
            document.getElementById("sum-done").textContent = `${doneTasks}/${totalTasks}`;
            document.getElementById("sum-chapters").textContent = data.length;
        }

        function getProgress(items) {
            // นับทั้ง Quiz (Q) และ Media (M) รวมกัน
            const trackable = items.filter(i => i.item_type === "Q" || i.item_type === "M");
            if (trackable.length === 0) return null;
            return Math.round(trackable.filter(i => i.view_success === "Y").length / trackable.length * 100);
        }

        // ── Chapters ─────────────────────────────────────────────────
        function renderChapters(data) {
            const list = document.getElementById("chapter-list");
            list.innerHTML = data.map((chapter, i) => {
                if (!chapter.child) return "";
                const progress = getProgress(chapter.child);
                const allDone = progress === 100;
                const noQuiz = progress === null;
                const barColor = allDone ? "bg-emerald-500" : "bg-indigo-400";

                return `
            <div class="bg-white rounded-2xl border ${allDone ? "border-emerald-200" : "border-slate-100"} overflow-hidden card-hover mb-3 fade-in"
                style="animation-delay:${i * 60}ms">

                <div class="px-5 py-4 flex items-center justify-between cursor-pointer select-none"
                    onclick="toggleChapter(${i})">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0
                            ${allDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}">
                            ${allDone
                                ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`
                                : (i + 1)}
                        </div>
                        <div class="min-w-0">
                            <p class="font-semibold text-slate-800 text-sm leading-snug">${chapter.title}</p>
                            <p class="text-xs text-slate-400 mt-0.5">
                                ${noQuiz ? `${chapter.child.length} งาน` : `${progress}% เสร็จแล้ว · ${chapter.child.length} งาน`}
                            </p>
                        </div>
                    </div>
                    <svg id="chevron-${i}" class="w-4 h-4 text-slate-400 flex-shrink-0 ml-2 transition-transform duration-300"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>

                ${!noQuiz ? `
                <div class="h-0.5 bg-slate-100 mx-5">
                    <div class="${barColor} h-full chapter-bar rounded-full" style="width:${progress}%"></div>
                </div>` : ""}

                <div id="chapter-${i}" class="collapse-content" style="max-height:0">
                    <ul class="divide-y divide-slate-50 mt-1 pb-1">
                        ${chapter.child.map(item => renderItem(item)).join("")}
                    </ul>
                </div>
            </div>`;
            }).join("");
        }

        // ── Item row ─────────────────────────────────────────────────
        function renderItem(item) {
            const isLocked = item.can_view === "N";
            const isVideo = item.lesson_type === "Y";
            const isPDF = item.lesson_type === "F";
            // วิดีโอดูครบแล้ว = view_success === "Y"
            const videoDone = isVideo && item.view_success === "Y";

            // Icon
            let icon = "";
            if (item.lesson_type === "Pre" || item.lesson_type === "Post") {
                icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                            M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>`;
            } else if (isVideo) {
                icon = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
            } else if (isPDF) {
                icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>`;
            } else {
                icon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13
                            C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13
                            C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13
                            C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>`;
            }

            // Type badge
            let typeBadge = "";
            if (item.lesson_type === "Pre") {
                typeBadge = `<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">ก่อนเรียน</span>`;
            } else if (item.lesson_type === "Post") {
                typeBadge = `<span class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">หลังเรียน</span>`;
            }

            // Score badge (quiz)
            let scoreBadge = "";
            if (item.item_type === "Q") {
                const passed = item.view_success === "Y";
                const color = passed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200";
                scoreBadge = `<span class="text-xs font-semibold px-2 py-0.5 rounded-full border ${color}" id="qscore-${item.itemid}">${item.stu_score}/${item.item_score}</span>`;
            }

            // ── Quiz widget ───────────────────────────────────────────
            let quizWidget = "";
            if (item.item_type === "Q") {
                const isFull = (item.stu_score !== null && item.item_score !== null) &&
                    Number(item.stu_score) >= Number(item.item_score) &&
                    Number(item.item_score) > 0;
                if (isFull) {
                    quizWidget = `
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                            </svg>
                            เต็มแล้ว
                        </span>
                        <button onclick='doQuiz(${JSON.stringify(item)})' id="qbtn-${item.itemid}"
                            class="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-500 active:scale-95 transition-all flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            ส่งอีกรอบ
                        </button>
                    </div>`;
                } else {
                    quizWidget = `
                    <button onclick='doQuiz(${JSON.stringify(item)})' id="qbtn-${item.itemid}"
                        class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white transition-all flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                        ส่งคำตอบ
                    </button>`;
                }
            }

            // ── PDF/Media widget (item_type M = เนื้อหาทุกประเภท) ────
            let pdfWidget = "";
            if (item.item_type === "M") {
                const mediaDone = item.view_success === "Y";
                const isVDO = item.lesson_type === "Y";
                const label = isVDO ? "Mark วิดีโอ" : "Mark เนื้อหา";
                const doneLabel = isVDO ? "ดูครบแล้ว" : "อ่านครบแล้ว";
                const btnColor = isVDO ?
                    "bg-indigo-600 hover:bg-indigo-700" :
                    "bg-orange-500 hover:bg-orange-600";
                const btnIcon = isVDO ?
                    `<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>` :
                    `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
                if (mediaDone) {
                    pdfWidget = `
                    <div class="flex items-center gap-1.5" id="mwrap-${item.itemid}">
                        <span class="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                            </svg>
                            ${doneLabel}
                        </span>
                        <button onclick='markMedia(${JSON.stringify(item)})' id="mbtn-${item.itemid}"
                            class="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 active:scale-95 transition-all flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                            </svg>
                            Mark อีกรอบ
                        </button>
                    </div>`;
                } else {
                    pdfWidget = `
                    <button onclick='markMedia(${JSON.stringify(item)})' id="mbtn-${item.itemid}"
                        class="text-xs font-semibold px-3 py-1.5 rounded-xl ${btnColor} active:scale-95 text-white transition-all flex items-center gap-1">
                        ${btnIcon}
                        ${label}
                    </button>`;
                }
            }

            // ── Video widget (legacy — สำหรับ item_type ไม่ใช่ M เท่านั้น) ──
            let videoWidget = "";
            if (item.item_type !== "M") {
                if (videoDone) {
                    // ดูครบแล้ว → bar เต็ม + label สีเขียว
                    videoWidget = `
                    <div class="flex flex-col items-end gap-1">
                        <div class="w-24 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                            <div class="bg-emerald-500 h-full w-full rounded-full"></div>
                        </div>
                        <span class="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                            </svg>
                            ดูครบ 100%
                        </span>
                    </div>`;
                } else {
                    // ยังไม่ครบ → bar ว่าง + ปุ่ม Mark
                    videoWidget = `
                    <div class="flex flex-col items-end gap-1.5" id="vwrap-${item.itemid}">
                        <div class="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div class="bg-indigo-400 h-full rounded-full" style="width:0"
                                id="vbar-${item.itemid}"></div>
                        </div>
                        <button onclick='openVideo(${JSON.stringify(item)})' id="vbtn-${item.itemid}"
                            class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            Mark
                        </button>
                    </div>`;
                }
            } // end if(item_type !== M)
            return `
                <li class="px-5 py-3 flex items-center justify-between gap-3 ${isLocked ? "opacity-50" : ""}">
                    <div class="flex items-start gap-2.5 min-w-0">
                        <span class="mt-0.5 flex-shrink-0
                            ${videoDone ? "text-emerald-500" : isVideo ? "text-indigo-500" : isPDF ? "text-orange-500" : "text-slate-400"}">
                            ${icon}
                        </span>
                        <div class="min-w-0">
                            <p class="text-sm text-slate-700 leading-snug">${item.title}</p>
                            ${typeBadge ? `<div class="mt-1">${typeBadge}</div>` : ""}
                        </div>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0" id="item-action-${item.itemid}">
                        ${scoreBadge}
                        ${getItemActionHTML(item)}
                    </div>
                </li>`;
        }


        // ── Toggle collapse ──────────────────────────────────────────
        const openChapters = {};

        function toggleChapter(i) {
            const content = document.getElementById(`chapter-${i}`);
            const chevron = document.getElementById(`chevron-${i}`);
            if (!content) return;
            if (openChapters[i]) {
                content.style.maxHeight = "0";
                chevron.style.transform = "rotate(0deg)";
                openChapters[i] = false;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
                chevron.style.transform = "rotate(180deg)";
                openChapters[i] = true;
            }
        }

        // ── markMedia (ดึงทุก lesson แล้วยิงทีละตัว) ────────────────
        async function markMedia(item) {
            const btn = document.getElementById(`mbtn-${item.itemid}`);
            if (btn) {
                btn.innerHTML = "⏳...";
                btn.disabled = true;
            }

            const subjects = JSON.parse(localStorage.getItem("subjects")) || [];
            const subjectData = subjects.find(sub => sub.course_id == course_id);
            const openid = subjectData?.open_id;
            const student_id = localStorage.getItem("id_code");

            try {
                // ดึงทุก lesson ของ item
                const lessons = await fetch(
                    `https://e-ed.e-tech.ac.th/api/item/${item.itemid}/lessons?recid=${recid}`, {
                        headers: {
                            "Authorization": `Bearer ${token}`,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        }
                    }
                ).then(r => r.json());

                if (!Array.isArray(lessons) || lessons.length === 0) {
                    showToast("โหลด lessons ไม่สำเร็จ", "red");
                    resetMediaBtn(btn, item);
                    return;
                }

                // ยิงทุก lesson ทีละตัว
                let lastResult = null;
                for (const lesson of lessons) {
                    const isPDF = lesson.lesson_type === "F";
                    const isVDO = lesson.lesson_type === "Y";

                    // PDF → API ส่ง duration = 1 เสมอ ต้องใส่เวลาสมเหตุสมผลเอง
                    // VDO → ใช้ค่าจริงจาก API
                    let duration;
                    if (isVDO) {
                        duration = lesson.lenght_vdo || lesson.duration || 60;
                    } else {
                        // PDF / เนื้อหาอื่น: สุ่ม 45–90 วินาที (เหมือนอ่านจริง)
                        duration = Math.floor(Math.random() * 46) + 45;
                    }

                    // รอก่อนยิง: PDF รอ 5–9 วินาที, VDO รอ 2 วินาที
                    const waitSec = isPDF ?
                        Math.floor(Math.random() * 5) + 5 :
                        2;

                    // Countdown ใน button
                    if (btn) {
                        for (let s = waitSec; s > 0; s--) {
                            btn.innerHTML = isPDF ?
                                `📄 ${s}s...` :
                                `🎬 ${s}s...`;
                            await sleep(1000);
                        }
                        btn.innerHTML = "⏳ ส่ง...";
                    } else {
                        await sleep(waitSec * 1000);
                    }

                    const res = await fetch("https://e-ed.e-tech.ac.th/api/setLearnProgress", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        },
                        body: JSON.stringify({
                            recid: Number(recid),
                            openid: openid,
                            student_id: student_id,
                            itemid: lesson.itemid,
                            lessonid: lesson.lessonid,
                            lesson_type: lesson.lesson_type,
                            item_type: "M",
                            courseid: Number(course_id),
                            full_time: duration,
                            view_time: duration,
                            percent: 100
                        })
                    }).then(r => r.json());
                    console.log(`lesson ${lesson.lessonid} [${lesson.lesson_type}] duration=${duration}:`, res);
                    lastResult = res;
                }

                const isComplete = lastResult?.complete === "Y" || lastResult?.item_complete === "Y";

                // อัพเดต allChaptersData ด้วย เพื่อให้ progress bar ขยับทันที
                allChaptersData.forEach(ch => {
                    (ch.child || []).forEach(i => {
                        if (i.itemid === item.itemid) i.view_success = "Y";
                    });
                });
                // Re-render progress bar ของ chapter ที่มี item นี้
                allChaptersData.forEach((ch, idx) => {
                    if ((ch.child || []).some(i => i.itemid === item.itemid)) {
                        const progress = getProgress(ch.child);
                        const bar = document.querySelector(`#chapter-${idx} ~ div .chapter-bar, #chapter-${idx}`);
                        // อัพเดต subtitle
                        const subtitle = document.querySelector(
                            `[onclick="toggleChapter(${idx})"] .text-slate-400`
                        );
                        if (subtitle) {
                            subtitle.textContent = `${progress}% เสร็จแล้ว · ${ch.child.length} งาน`;
                        }
                    }
                });

                if (isComplete) {
                    showToast(`✓ Mark ครบ ${lessons.length} lesson แล้ว!`, "emerald");
                    const wrap = document.getElementById(`mwrap-${item.itemid}`);
                    const btnEl = document.getElementById(`mbtn-${item.itemid}`);
                    const target = wrap || btnEl;
                    if (target) {
                        target.outerHTML = `
                        <div class="flex items-center gap-1.5" id="mwrap-${item.itemid}">
                            <span class="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                                </svg>
                                ครบแล้ว
                            </span>
                            <button onclick='markMedia(${JSON.stringify(item)})' id="mbtn-${item.itemid}"
                                class="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 active:scale-95 transition-all flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                </svg>
                                Mark อีกรอบ
                            </button>
                        </div>`;
                    }
                } else {
                    // ถ้า API ไม่ return complete = Y ให้ลองต่อไป (บางระบบไม่ return field นี้)
                    showToast(`ส่งแล้ว ${lessons.length} lessons`, "emerald");
                    resetMediaBtn(btn, item);
                }
            } catch (err) {
                showToast("เกิดข้อผิดพลาด: " + err.message, "red");
                resetMediaBtn(btn, item);
            }
        }

        function resetMediaBtn(btn, item) {
            if (!btn) return;
            // icon ถูกต้องตาม lesson_type ของ item
            const isVDO = item?.lesson_type === "Y";
            btn.innerHTML = isVDO ?
                `<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Mark` :
                `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> Mark`;
            btn.disabled = false;
        }

        // ── openVideo (legacy wrapper) ────────────────────────────────
        function openVideo(item) {
            markMedia(item);
        }


        // ── Toast ────────────────────────────────────────────────────
        function showToast(msg, color = "emerald") {
            const colors = {
                emerald: "bg-emerald-600 text-white",
                red: "bg-red-600 text-white"
            };
            const t = document.createElement("div");
            t.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg ${colors[color]} fade-in`;
            t.textContent = msg;
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 3000);
        }

        // ── doAll ─────────────────────────────────────────────────────
        let allRunning = false;

        async function doAll(selectedIds = null) {
            if (allRunning) return;
            allRunning = true;

            const btn = document.getElementById("auto-btn");
            const btnText = document.getElementById("auto-btn-text");
            const status = document.getElementById("auto-status");
            btn.disabled = true;
            btn.classList.add("opacity-75");

            const subjects = JSON.parse(localStorage.getItem("subjects")) || [];
            const subjectData = subjects.find(sub => sub.course_id == course_id);
            const openid = subjectData?.open_id;
            const student_id = localStorage.getItem("id_code");

            // รวม item ทั้งหมดจาก allChaptersData
            const allItems = [];
            (allChaptersData || []).forEach(ch => {
                (ch.child || []).forEach(item => allItems.push(item));
            });

            const mediaItems = allItems.filter(i => i.item_type === "M" && (!selectedIds || selectedIds.includes(i.itemid)));
            const quizzes   = allItems.filter(i => i.item_type === "Q" && (!selectedIds || selectedIds.includes(i.itemid)));
            const total = mediaItems.length + quizzes.length;
            let done = 0;

            const setStatus = (msg) => {
                status.textContent = msg;
            };
            const tick = () => {
                done++;
                btnText.textContent = `กำลังทำ... ${done}/${total}`;
            };

            // ── Media & Video: ดึง lessons จริงแล้วยิงทุก lesson ───────
            for (const item of mediaItems) {
                const emoji = item.lesson_type === "Y" ? "🎬" : "📄";
                setStatus(`${emoji} ${item.title}`);
                try {
                    const lessons = await fetch(
                        `https://e-ed.e-tech.ac.th/api/item/${item.itemid}/lessons?recid=${recid}`, {
                            headers: {
                                "Authorization": `Bearer ${token}`,
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                            }
                        }
                    ).then(r => r.json());

                    if (Array.isArray(lessons) && lessons.length > 0) {
                        for (const lesson of lessons) {
                            const isPDF = lesson.lesson_type === "F";
                            const isVDO = lesson.lesson_type === "Y";

                            // PDF → API ส่ง duration = 1 เสมอ → inject เวลาสมเหตุสมผลเอง
                            let duration;
                            if (isVDO) {
                                duration = lesson.lenght_vdo || lesson.duration || 60;
                            } else {
                                duration = Math.floor(Math.random() * 46) + 45; // 45-90s
                            }

                            // รอก่อนยิง: PDF = 5-9 วินาที, VDO = 2 วินาที
                            const waitSec = isPDF ? Math.floor(Math.random() * 5) + 5 : 2;
                            for (let s = waitSec; s > 0; s--) {
                                setStatus(`${emoji} ${item.title} (⏱ ${s}s)`);
                                await sleep(1000);
                            }
                            setStatus(`${emoji} ${item.title} — ส่ง...`);

                            await fetch("https://e-ed.e-tech.ac.th/api/setLearnProgress", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${token}`,
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                                },
                                body: JSON.stringify({
                                    recid: Number(recid),
                                    openid,
                                    student_id,
                                    itemid: lesson.itemid,
                                    lessonid: lesson.lessonid,
                                    lesson_type: lesson.lesson_type,
                                    item_type: "M",
                                    courseid: Number(course_id),
                                    full_time: duration,
                                    view_time: duration,
                                    percent: 100
                                })
                            }).then(r => r.json());
                            await sleep(300);
                        }
                    } else {
                        // fallback: ไม่มี lessons → ยิง item โดยตรง (ใช้เวลาสมเหตุสมผล)
                        const waitSec = Math.floor(Math.random() * 5) + 5;
                        for (let s = waitSec; s > 0; s--) {
                            setStatus(`${emoji} ${item.title} (⏱ ${s}s)`);
                            await sleep(1000);
                        }
                        const fallbackDuration = Math.floor(Math.random() * 46) + 45;
                        await fetch("https://e-ed.e-tech.ac.th/api/setLearnProgress", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`,
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                            },
                            body: JSON.stringify({
                                recid: Number(recid),
                                openid,
                                student_id,
                                itemid: item.itemid,
                                lessonid: item.lessonid || item.itemid,
                                lesson_type: item.lesson_type,
                                item_type: "M",
                                courseid: Number(course_id),
                                full_time: fallbackDuration,
                                view_time: fallbackDuration,
                                percent: 100
                            })
                        }).then(r => r.json());
                    }

                    // อัพเดต allChaptersData ให้ progress bar ขยับ live
                    allChaptersData.forEach(ch => {
                        (ch.child || []).forEach(i => {
                            if (i.itemid === item.itemid) i.view_success = "Y";
                        });
                    });
                } catch (e) {
                    console.warn("media err", item.itemid, e);
                }
                tick();
                await sleep(300);
            }

            // ── Quizzes: ใช้ logic เดียวกับ doQuiz() ────────────────
            for (const item of quizzes) {
                setStatus(`📝 Quiz: ${item.title}`);
                try {
                    const quizData = await fetch(`https://e-ed.e-tech.ac.th/api/quiz/${item.itemid}/answer?token=${token}`, {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        }
                    }).then(r => r.json());

                    if (!Array.isArray(quizData) || quizData.length === 0) {
                        tick();
                        continue;
                    }

                    const ans = quizData.map(q => {
                        const correct = q.choices_show_answer?.find(c => c.answer === "Y");
                        return correct ? {
                            quizid: q.quizid,
                            quiz_type: q.quiz_type,
                            ans: correct.no
                        } : null;
                    }).filter(Boolean);

                    if (ans.length === 0) {
                        tick();
                        continue;
                    }

                    const quizResult = await fetch(
                        `https://e-ed.e-tech.ac.th/api/quiz/v2/${item.itemid}/sendAnswer?token=${token}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                            },
                            body: JSON.stringify({
                                recid: Number(recid),
                                itemid: item.itemid,
                                openid,
                                courseid: Number(course_id),
                                ans
                            })
                        }).then(r => r.json());

                    console.log(`quiz ${item.itemid}:`, quizResult);

                    // อัพเดต score badge ใน UI
                    const score = quizResult.score ?? quizResult.total_score ?? "?";
                    const maxScore = quizResult.full_score ?? quizResult.max_score ?? item.item_score;
                    const scoreBadgeEl = document.getElementById(`qscore-${item.itemid}`);
                    if (scoreBadgeEl) scoreBadgeEl.textContent = `${score}/${maxScore}`;

                    // setLearnProgress หลัง quiz
                    await fetch("https://e-ed.e-tech.ac.th/api/setLearnProgress", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        },
                        body: JSON.stringify({
                            recid: Number(recid),
                            openid,
                            student_id,
                            itemid: item.itemid,
                            lessonid: "",
                            lesson_type: item.lesson_type || "Post",
                            item_type: "Q",
                            courseid: Number(course_id),
                            full_time: 0,
                            view_time: 19,
                            percent: 100
                        })
                    }).then(r => r.json());

                } catch (e) {
                    console.warn("quiz err", item.itemid, e);
                }
                tick();
                await sleep(400);
            }

            // ── Done ─────────────────────────────────────────────────
            setStatus("✓ เสร็จหมดแล้ว! รีเฟรชเพื่อดูคะแนนล่าสุด");
            btnText.textContent = "✓ เสร็จแล้ว!";
            btn.classList.remove("opacity-75");
            btn.classList.add("from-emerald-600", "to-emerald-500");
            btn.classList.remove("from-violet-600", "to-indigo-600");
            allRunning = false;
            showToast("✓ Auto เสร็จทุกอย่างแล้ว!", "emerald");
        }

        function sleep(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

        // ── doQuiz ────────────────────────────────────────────────────
        function doQuiz(item) {
            const btn = document.getElementById(`qbtn-${item.itemid}`);
            if (btn) {
                btn.innerHTML = "⏳...";
                btn.disabled = true;
            }

            const subjects = JSON.parse(localStorage.getItem("subjects")) || [];
            const subjectData = subjects.find(sub => sub.course_id == course_id);
            const openid = subjectData?.open_id;

            // Step 1: ดึงคำตอบที่ถูกต้อง
            fetch(`https://e-ed.e-tech.ac.th/api/quiz/${item.itemid}/answer?token=${token}`, {
                        headers: {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        }
                    })
                .then(res => res.json())
                .then(quizzes => {
                    if (!Array.isArray(quizzes) || quizzes.length === 0) {
                        showToast("โหลดข้อสอบไม่สำเร็จ", "red");
                        resetQuizBtn(btn);
                        return;
                    }

                    // Step 2: สร้าง ans array จากคำตอบที่ถูก (answer === "Y")
                    const ans = quizzes.map(q => {
                        const correctChoice = q.choices_show_answer?.find(c => c.answer === "Y");
                        return {
                            quizid: q.quizid,
                            quiz_type: q.quiz_type,
                            ans: correctChoice?.no ?? null
                        };
                    }).filter(a => a.ans !== null);

                    if (ans.length === 0) {
                        showToast("ไม่พบคำตอบที่ถูกต้อง", "red");
                        resetQuizBtn(btn);
                        return;
                    }

                    // Step 3: ส่งคำตอบ
                    return fetch(`https://e-ed.e-tech.ac.th/api/quiz/v2/${item.itemid}/sendAnswer?token=${token}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        },
                        body: JSON.stringify({
                            recid: Number(recid),
                            itemid: item.itemid,
                            openid: openid,
                            courseid: Number(course_id),
                            ans: ans
                        })
                    });
                })
                .then(res => res?.json())
                .then(result => {
                    if (!result) return;
                    console.log("Quiz result:", result);

                    const score = result.score ?? result.total_score ?? "?";
                    const maxScore = result.full_score ?? result.max_score ?? item.item_score;
                    const isFull = Number(score) >= Number(maxScore) && Number(maxScore) > 0;

                    // อัพเดต score badge
                    const scoreBadgeEl = document.getElementById(`qscore-${item.itemid}`);
                    if (scoreBadgeEl) {
                        scoreBadgeEl.textContent = `${score}/${maxScore}`;
                        scoreBadgeEl.className = isFull ?
                            "text-xs font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "text-xs font-semibold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-500 border-slate-200";
                    }

                    // Step 4: ส่ง setLearnProgress เสมอ เพื่อให้ระบบนับว่าเสร็จ
                    const student_id = localStorage.getItem("id_code");
                    fetch(`https://e-ed.e-tech.ac.th/api/setLearnProgress`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${token}`,
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                            },
                            body: JSON.stringify({
                                recid: Number(recid),
                                openid: openid,
                                student_id: student_id,
                                itemid: item.itemid,
                                lessonid: "",
                                lesson_type: item.lesson_type || "Post",
                                item_type: "Q",
                                courseid: Number(course_id),
                                full_time: 0,
                                view_time: 19,
                                percent: 100
                            })
                        })
                        .then(r => r.json())
                        .then(pr => console.log("setLearnProgress:", pr))
                        .catch(e => console.warn("setLearnProgress error:", e));

                    if (isFull) {
                        showToast(`✓ เต็ม ${score}/${maxScore} คะแนน!`, "emerald");
                        if (btn) {
                            btn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> ส่งอีกรอบ`;
                            btn.disabled = false;
                        }
                    } else {
                        showToast(`ส่งแล้ว ได้ ${score}/${maxScore} คะแนน`, "emerald");
                        resetQuizBtn(btn);
                    }
                })
                .catch(err => {
                    showToast("เกิดข้อผิดพลาด: " + err.message, "red");
                    resetQuizBtn(btn);
                });
        }

        function resetQuizBtn(btn) {
            if (!btn) return;
            btn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> ส่งคำตอบ`;
            btn.disabled = false;
        }

        // ── Credit system ─────────────────────────────────────────────
        let currentCredit = 0;
        let pricePerTask  = 1;
        let paidItems     = new Set();

        async function checkMaintenance() {
            try {
                const student_id = localStorage.getItem("id_code") || '__check__';
                const res = await fetch("api/credit.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ student_id })
                }).then(r => r.json());
                if (res.maintenance) {
                    document.body.innerHTML = `<div class="min-h-screen flex items-center justify-center bg-slate-50"><div class="text-center p-8"><div class="text-5xl mb-4">🔧</div><h1 class="text-xl font-bold text-slate-800">ระบบปิดปรับปรุงชั่วคราว</h1><p class="text-slate-500 mt-2">กรุณากลับมาใหม่ในภายหลัง</p></div></div>`;
                }
            } catch(e) {}
        }

        async function loadCredit() {
            const student_id = localStorage.getItem("id_code");
            if (!student_id) return;
            const el = document.getElementById("nav-credit");
            if (el) el.textContent = "฿0.00";
            try {
                const res = await fetch("api/credit.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ student_id, course_id: parseInt(course_id) })
                }).then(r => r.json());
                if (res.maintenance) {
                    document.body.innerHTML = `<div class="min-h-screen flex items-center justify-center bg-slate-50"><div class="text-center p-8"><div class="text-5xl mb-4">🔧</div><h1 class="text-xl font-bold text-slate-800">ระบบปิดปรับปรุงชั่วคราว</h1><p class="text-slate-500 mt-2">กรุณากลับมาใหม่ในภายหลัง</p></div></div>`;
                    return;
                }
                currentCredit = res.balance ?? 0;
                pricePerTask  = res.price_per_task ?? 1;
                paidItems     = new Set((res.paid_items ?? []).map(Number));
                if (el) el.textContent = `฿${currentCredit.toFixed(2)}`;
                renderAllItems();
            } catch(e) {
                if (el) el.textContent = "฿0.00";
                console.warn("loadCredit error", e);
            }
        }
        checkMaintenance();
        loadCredit();

        function getItemActionHTML(item) {
            if (item.view_success === 'Y') {
                return `<span class="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                    </svg>
                    เสร็จแล้ว
                </span>`;
            }
            if (paidItems.has(item.itemid)) {
                const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
                return `<button onclick="runSingleItem(JSON.parse(this.dataset.item))" data-item="${itemJson}"
                    class="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 transition-all flex items-center gap-1">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    ส่งงาน
                </button>`;
            }
            return `<input type="checkbox" class="task-checkbox w-4 h-4 rounded accent-indigo-600 flex-shrink-0"
                data-itemid="${item.itemid}"
                data-type="${item.item_type}">`;
        }

        function renderAllItems() {
            (allChaptersData || []).forEach(ch => {
                (ch.child || []).forEach(item => {
                    const el = document.getElementById(`item-action-${item.itemid}`);
                    if (!el) return;
                    const scoreBadge = item.item_type === 'Q'
                        ? (() => {
                            const passed = item.view_success === 'Y';
                            const color  = passed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200';
                            return `<span class="text-xs font-semibold px-2 py-0.5 rounded-full border ${color}" id="qscore-${item.itemid}">${item.stu_score}/${item.item_score}</span>`;
                        })()
                        : '';
                    el.innerHTML = scoreBadge + getItemActionHTML(item);
                });
            });
        }

        async function runSingleItem(item) {
            const student_id = localStorage.getItem("id_code");
            if (item.item_type === 'M') {
                await markMedia(item);
            } else if (item.item_type === 'Q') {
                doQuiz(item);
                await sleep(2000);
            }
            await fetch("api/mark_ran.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_id, course_id: parseInt(course_id), item_ids: [item.itemid] })
            });
            paidItems.delete(item.itemid);
        }

        function getSelectedItemIds() {
            return [...document.querySelectorAll(".task-checkbox:checked")]
                .map(cb => parseInt(cb.dataset.itemid));
        }

        function selectAll(checked) {
            document.querySelectorAll(".task-checkbox").forEach(cb => cb.checked = checked);
        }

        function showPayModal() {
            const selected = getSelectedItemIds();
            if (selected.length === 0) {
                showToast("เลือก task ก่อนอย่างน้อย 1 อย่าง", "red");
                return;
            }
            const total    = selected.length * pricePerTask;
            const afterBal = currentCredit - total;
            document.getElementById("modal-task-count").textContent  = selected.length;
            document.getElementById("modal-price").textContent       = `${pricePerTask} บาท`;
            document.getElementById("modal-total").textContent       = `${total.toFixed(2)} บาท`;
            const balEl = document.getElementById("modal-balance-after");
            balEl.textContent = `${afterBal.toFixed(2)} บาท`;
            balEl.className   = afterBal >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-red-500";
            document.getElementById("modal-error").classList.add("hidden");
            document.getElementById("pay-modal").classList.remove("hidden");
        }

        function closePayModal() {
            document.getElementById("pay-modal").classList.add("hidden");
        }

        async function confirmPay() {
            const selected   = getSelectedItemIds();
            const student_id = localStorage.getItem("id_code");
            const btn        = document.getElementById("confirm-pay-btn");
            btn.textContent  = "กำลังตรวจสอบ...";
            btn.disabled     = true;

            try {
                const res = await fetch("api/spend.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        student_id,
                        task_count: selected.length,
                        course_id:  parseInt(course_id),
                        item_ids:   selected
                    })
                }).then(r => r.json());

                if (!res.success) {
                    const errEl = document.getElementById("modal-error");
                    errEl.textContent = res.error === "insufficient_credit"
                        ? `เครดิตไม่พอ — ต้องการ ${res.required} บาท มีแค่ ${res.balance} บาท (ขาด ${res.shortage} บาท)`
                        : (res.error ?? "เกิดข้อผิดพลาด");
                    errEl.classList.remove("hidden");
                    btn.textContent = "ชำระ & Auto";
                    btn.disabled    = false;
                    return;
                }

                currentCredit = res.new_balance;
                res.paid_items.forEach(id => paidItems.add(Number(id)));
                const navEl = document.getElementById("nav-credit");
                if (navEl) navEl.textContent = `฿${currentCredit.toFixed(2)}`;
                closePayModal();
                showToast(`✓ หัก ${res.charged} บาท · เครดิตเหลือ ${res.new_balance.toFixed(2)} บาท`, "emerald");

                renderAllItems();
                await doAll(selected);

                // Mark selected items as done in local data (quizzes aren't updated by doAll)
                selected.forEach(id => {
                    (allChaptersData || []).forEach(ch => {
                        (ch.child || []).forEach(item => {
                            if (item.itemid === id) item.view_success = 'Y';
                        });
                    });
                });

                await fetch("api/mark_ran.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ student_id, course_id: parseInt(course_id), item_ids: selected })
                });
                selected.forEach(id => paidItems.delete(id));
                renderAllItems();

            } catch(e) {
                document.getElementById("modal-error").textContent = "เชื่อมต่อ server ไม่ได้: " + e.message;
                document.getElementById("modal-error").classList.remove("hidden");
                btn.textContent = "ชำระ & Auto";
                btn.disabled    = false;
            }
        }

        function errHTML(msg) {
            return `<div class="flex flex-col items-center gap-2 py-16 text-red-400">
            <svg class="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm font-medium">${msg}</p>
        </div>`;
        }
    </script>
</body>

</html>