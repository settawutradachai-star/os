<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel — Super E-ED</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { font-family: 'IBM Plex Sans Thai', sans-serif; }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .tab-btn.active { background:#4f46e5; color:#fff; }
        .tab-btn { transition: background 0.15s, color 0.15s; }
    </style>
</head>
<body class="bg-slate-100 min-h-screen">

<!-- ───────────── LOGIN ───────────── -->
<div id="login-screen" class="min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl border border-slate-100 p-8 w-full max-w-sm shadow-sm fade-in">
        <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 mx-auto">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
        </div>
        <h1 class="text-xl font-bold text-slate-800 text-center mb-1">Admin Panel</h1>
        <p class="text-sm text-slate-400 text-center mb-6">Super E-ED</p>
        <input type="password" id="admin-pass" placeholder="รหัสผ่าน admin"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 mb-3"
            onkeydown="if(event.key==='Enter') doLogin()">
        <button onclick="doLogin()"
            class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition">
            เข้าสู่ระบบ
        </button>
        <p id="login-error" class="text-red-500 text-sm text-center mt-3 hidden">รหัสผ่านไม่ถูกต้อง</p>
    </div>
</div>

<!-- ───────────── MAIN APP ───────────── -->
<div id="app" class="hidden min-h-screen flex">

    <!-- Sidebar (desktop) -->
    <aside class="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 fixed h-full z-40">
        <div class="p-5 border-b border-slate-100">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
                <div>
                    <div class="text-sm font-bold text-slate-800">Super E-ED</div>
                    <div class="text-xs text-slate-400">Admin</div>
                </div>
            </div>
        </div>
        <nav class="flex-1 p-3 space-y-1">
            <button class="tab-btn active w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5" onclick="switchTab('dashboard',this)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                Dashboard
            </button>
            <button class="tab-btn w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 text-slate-600" onclick="switchTab('slips',this)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                สลิป
                <span id="badge-pending" class="ml-auto text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 font-bold hidden">0</span>
            </button>
            <button class="tab-btn w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 text-slate-600" onclick="switchTab('users',this)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                ผู้ใช้
            </button>
            <button class="tab-btn w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 text-slate-600" onclick="switchTab('transactions',this)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                ธุรกรรม
            </button>
            <button class="tab-btn w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 text-slate-600" onclick="switchTab('settings',this)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                ตั้งค่า
            </button>
            <button class="tab-btn w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 text-slate-600" onclick="switchTab('stuck',this)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Stuck Tasks
            </button>
        </nav>
        <div class="p-3 border-t border-slate-100">
            <button onclick="doLogout()" class="w-full px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                ออกจากระบบ
            </button>
        </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 md:ml-56 pb-20 md:pb-0">

        <!-- Mobile header -->
        <div class="md:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between sticky top-0 z-30">
            <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <span class="font-bold text-slate-800 text-sm">Admin Panel</span>
            </div>
            <button onclick="doLogout()" class="text-xs text-slate-400 hover:text-red-500 transition">ออก</button>
        </div>

        <!-- Tab panels -->
        <div class="p-4 md:p-6 max-w-5xl mx-auto">

            <!-- Dashboard -->
            <div id="tab-dashboard" class="fade-in">
                <h2 class="text-lg font-bold text-slate-800 mb-4">Dashboard</h2>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6" id="dash-cards">
                    <div class="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                        <div class="text-2xl font-bold text-indigo-600" id="dash-users">—</div>
                        <div class="text-xs text-slate-400 mt-0.5">ผู้ใช้ทั้งหมด</div>
                    </div>
                    <div class="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                        <div class="text-2xl font-bold text-emerald-600" id="dash-credit">—</div>
                        <div class="text-xs text-slate-400 mt-0.5">เครดิตรวม (฿)</div>
                    </div>
                    <div class="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                        <div class="text-2xl font-bold text-amber-600" id="dash-pending">—</div>
                        <div class="text-xs text-slate-400 mt-0.5">สลิปรอตรวจ</div>
                    </div>
                    <div class="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                        <div class="text-2xl font-bold text-blue-600" id="dash-topup">—</div>
                        <div class="text-xs text-slate-400 mt-0.5">เติมเงินวันนี้ (฿)</div>
                    </div>
                    <div class="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                        <div class="text-2xl font-bold text-purple-600" id="dash-spend">—</div>
                        <div class="text-xs text-slate-400 mt-0.5">ใช้จ่ายวันนี้ (฿)</div>
                    </div>
                    <div class="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                        <div class="text-2xl font-bold text-red-500" id="dash-stuck">—</div>
                        <div class="text-xs text-slate-400 mt-0.5">Stuck Tasks</div>
                    </div>
                </div>
                <button onclick="loadDashboard()" class="text-sm text-indigo-600 hover:underline">รีเฟรช</button>
            </div>

            <!-- Slips -->
            <div id="tab-slips" class="fade-in hidden">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 class="text-lg font-bold text-slate-800">สลิป</h2>
                    <div class="flex gap-2 flex-wrap">
                        <select id="slip-status" onchange="loadSlips(1)" class="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400">
                            <option value="pending">รอตรวจ</option>
                            <option value="approved">อนุมัติแล้ว</option>
                            <option value="rejected">ปฏิเสธแล้ว</option>
                        </select>
                        <input id="slip-search" type="text" placeholder="ค้นหา รหัสนักศึกษา" onkeydown="if(event.key==='Enter') loadSlips(1)"
                            class="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 w-44">
                        <button onclick="loadSlips(1)" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">ค้นหา</button>
                    </div>
                </div>
                <div id="slips-list" class="space-y-3"></div>
                <div id="slips-pagination" class="flex justify-center gap-2 mt-4"></div>
            </div>

            <!-- Users -->
            <div id="tab-users" class="fade-in hidden">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 class="text-lg font-bold text-slate-800">ผู้ใช้</h2>
                    <div class="flex gap-2">
                        <input id="user-search" type="text" placeholder="ค้นหา รหัสนักศึกษา" onkeydown="if(event.key==='Enter') loadUsers(1)"
                            class="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 w-44">
                        <button onclick="loadUsers(1)" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">ค้นหา</button>
                    </div>
                </div>
                <div id="users-list" class="space-y-2"></div>
                <div id="users-pagination" class="flex justify-center gap-2 mt-4"></div>

                <!-- User detail panel -->
                <div id="user-detail" class="hidden mt-6 bg-white rounded-2xl border border-slate-100 p-5">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <div class="font-bold text-slate-800" id="ud-sid"></div>
                            <div class="text-sm text-slate-400">เครดิต: <span id="ud-balance" class="font-semibold text-emerald-600"></span></div>
                        </div>
                        <button onclick="document.getElementById('user-detail').classList.add('hidden')" class="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
                    </div>
                    <!-- Adjust credit -->
                    <div class="bg-slate-50 rounded-xl p-4 mb-4">
                        <div class="text-sm font-semibold text-slate-700 mb-2">ปรับเครดิต</div>
                        <div class="flex gap-2">
                            <input type="number" id="adj-amount" placeholder="จำนวน (บวก/ลบ)" step="0.01"
                                class="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400">
                            <input type="text" id="adj-note" placeholder="หมายเหตุ"
                                class="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400">
                            <button onclick="adjustCredit()" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">ยืนยัน</button>
                        </div>
                        <p id="adj-msg" class="text-sm mt-2 hidden"></p>
                    </div>
                    <!-- History -->
                    <div class="text-sm font-semibold text-slate-700 mb-2">ประวัติธุรกรรม</div>
                    <div id="ud-history" class="space-y-1.5 max-h-64 overflow-y-auto"></div>
                </div>
            </div>

            <!-- Transactions -->
            <div id="tab-transactions" class="fade-in hidden">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 class="text-lg font-bold text-slate-800">ธุรกรรม</h2>
                    <div class="flex gap-2 flex-wrap">
                        <select id="txn-type" onchange="loadTxn(1)" class="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400">
                            <option value="">ทั้งหมด</option>
                            <option value="topup">เติมเงิน</option>
                            <option value="spend">ใช้จ่าย</option>
                        </select>
                        <input id="txn-search" type="text" placeholder="รหัสนักศึกษา" onkeydown="if(event.key==='Enter') loadTxn(1)"
                            class="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 w-40">
                        <button onclick="loadTxn(1)" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">ค้นหา</button>
                        <button onclick="exportCSV('transactions')" class="text-sm border border-indigo-200 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-50 transition">Export CSV</button>
                    </div>
                </div>
                <div id="txn-list" class="space-y-1.5"></div>
                <div id="txn-pagination" class="flex justify-center gap-2 mt-4"></div>
            </div>

            <!-- Settings -->
            <div id="tab-settings" class="fade-in hidden">
                <h2 class="text-lg font-bold text-slate-800 mb-4">ตั้งค่า</h2>
                <div class="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-1.5">ราคาต่อ Task (฿)</label>
                        <div class="flex gap-2">
                            <input type="number" id="setting-price" step="0.01" min="0.01"
                                class="w-40 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400">
                            <button onclick="savePrice()" class="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">บันทึก</button>
                        </div>
                    </div>
                    <div class="flex items-center justify-between py-3 border-t border-slate-100">
                        <div>
                            <div class="text-sm font-semibold text-slate-700">โหมดปิดปรับปรุง</div>
                            <div class="text-xs text-slate-400">เมื่อเปิด ผู้ใช้จะเห็นหน้าปิดปรับปรุงและไม่สามารถทำรายการได้</div>
                        </div>
                        <button id="maint-toggle" onclick="toggleMaintenance()"
                            class="relative inline-flex h-7 w-13 items-center rounded-full transition-colors focus:outline-none bg-slate-200 px-1">
                            <span id="maint-knob" class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform translate-x-0"></span>
                        </button>
                    </div>
                    <p id="settings-msg" class="text-sm hidden"></p>
                </div>

                <div class="mt-6 bg-white rounded-2xl border border-slate-100 p-6">
                    <h3 class="text-sm font-semibold text-slate-700 mb-3">Export ข้อมูล</h3>
                    <div class="flex gap-2 flex-wrap">
                        <button onclick="exportCSV('transactions')" class="text-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition">Transactions CSV</button>
                        <button onclick="exportCSV('slip_uploads')" class="text-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition">Slips CSV</button>
                        <button onclick="exportCSV('users')" class="text-sm border border-slate-200 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-50 transition">Users CSV</button>
                    </div>
                </div>
            </div>

            <!-- Stuck Tasks -->
            <div id="tab-stuck" class="fade-in hidden">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold text-slate-800">Stuck Tasks</h2>
                    <button onclick="loadStuck()" class="text-sm text-indigo-600 hover:underline">รีเฟรช</button>
                </div>
                <p class="text-sm text-slate-400 mb-4">Tasks ที่จ่ายแล้วแต่ยังไม่ถูก run หลัง 10 นาที</p>
                <div id="stuck-list" class="space-y-2"></div>
            </div>

        </div>
    </main>

    <!-- Mobile bottom tabs -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-40">
        <button onclick="switchTab('dashboard',this)" class="mob-tab-btn flex-1 flex flex-col items-center py-2.5 text-indigo-600 active-mob">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span class="text-[10px] mt-0.5">หน้าหลัก</span>
        </button>
        <button onclick="switchTab('slips',this)" class="mob-tab-btn flex-1 flex flex-col items-center py-2.5 text-slate-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span class="text-[10px] mt-0.5">สลิป</span>
        </button>
        <button onclick="switchTab('users',this)" class="mob-tab-btn flex-1 flex flex-col items-center py-2.5 text-slate-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <span class="text-[10px] mt-0.5">ผู้ใช้</span>
        </button>
        <button onclick="switchTab('transactions',this)" class="mob-tab-btn flex-1 flex flex-col items-center py-2.5 text-slate-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            <span class="text-[10px] mt-0.5">ธุรกรรม</span>
        </button>
        <button onclick="switchTab('settings',this)" class="mob-tab-btn flex-1 flex flex-col items-center py-2.5 text-slate-400">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <span class="text-[10px] mt-0.5">ตั้งค่า</span>
        </button>
    </nav>
</div>

<script>
let adminToken = '';
let currentTab = 'dashboard';
let maintEnabled = false;
let currentUserSid = '';

// ─── Auth ────────────────────────────────────────────────────────────────────

async function doLogin() {
    const pass = document.getElementById('admin-pass').value.trim();
    if (!pass) return;
    try {
        const res = await api('admin_auth.php', { password: pass }, false);
        if (res.token) {
            adminToken = res.token;
            sessionStorage.setItem('admin_token', adminToken);
            showApp();
        } else {
            document.getElementById('login-error').classList.remove('hidden');
        }
    } catch(e) {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

function doLogout() {
    sessionStorage.removeItem('admin_token');
    adminToken = '';
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    loadDashboard();
    loadSlips(1);
    loadSettings();
}

// ─── API helper ──────────────────────────────────────────────────────────────

async function api(endpoint, body = {}, useToken = true) {
    if (useToken) body.token = adminToken;
    const res = await fetch('api/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.error === 'unauthorized') { doLogout(); throw new Error('unauthorized'); }
    return data;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function switchTab(name, btn) {
    // hide all panels
    document.querySelectorAll('[id^="tab-"]').forEach(el => el.classList.add('hidden'));
    document.getElementById('tab-' + name).classList.remove('hidden');
    // desktop sidebar active state
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active', 'text-white');
        b.classList.add('text-slate-600');
    });
    // mobile bottom active state
    document.querySelectorAll('.mob-tab-btn').forEach(b => b.classList.replace('text-indigo-600','text-slate-400'));

    if (btn) {
        btn.classList.add('active');
        btn.classList.remove('text-slate-600');
        // mobile: re-color current
        if (btn.classList.contains('mob-tab-btn')) {
            btn.classList.replace('text-slate-400', 'text-indigo-600');
        }
    }
    currentTab = name;
    if (name === 'dashboard') loadDashboard();
    if (name === 'slips')     loadSlips(1);
    if (name === 'users')     loadUsers(1);
    if (name === 'transactions') loadTxn(1);
    if (name === 'settings')  loadSettings();
    if (name === 'stuck')     loadStuck();
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

async function loadDashboard() {
    try {
        const d = await api('admin_action.php', { action: 'dashboard' });
        document.getElementById('dash-users').textContent   = d.users;
        document.getElementById('dash-credit').textContent  = parseFloat(d.total_credit).toFixed(2);
        document.getElementById('dash-pending').textContent = d.pending_slips;
        document.getElementById('dash-topup').textContent   = parseFloat(d.today_topup).toFixed(2);
        document.getElementById('dash-spend').textContent   = parseFloat(d.today_spend).toFixed(2);
        document.getElementById('dash-stuck').textContent   = d.stuck_tasks;
        // badge
        const badge = document.getElementById('badge-pending');
        if (d.pending_slips > 0) {
            badge.textContent = d.pending_slips;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    } catch(e) { console.error(e); }
}

// ─── Slips ───────────────────────────────────────────────────────────────────

let slipPage = 1;

async function loadSlips(page) {
    slipPage = page;
    const status = document.getElementById('slip-status').value;
    const search = document.getElementById('slip-search').value.trim();
    try {
        const d = await api('admin_action.php', { action: 'list_slips', status, search, page });
        const list = document.getElementById('slips-list');
        if (!d.slips || d.slips.length === 0) {
            list.innerHTML = '<div class="text-center text-slate-400 py-8 text-sm">ไม่มีข้อมูล</div>';
        } else {
            list.innerHTML = d.slips.map(renderSlipCard).join('');
        }
        renderPagination('slips-pagination', d.page, d.total_pages, loadSlips);
    } catch(e) { console.error(e); }
}

function renderSlipCard(s) {
    const statusColors = { pending: 'bg-amber-50 text-amber-700', approved: 'bg-emerald-50 text-emerald-700', rejected: 'bg-red-50 text-red-700' };
    const statusTh     = { pending: 'รอตรวจ', approved: 'อนุมัติ', rejected: 'ปฏิเสธ' };
    const isPending    = s.status === 'pending';
    return `
    <div class="bg-white rounded-2xl border border-slate-100 p-4">
        <div class="flex items-start justify-between gap-2 mb-2">
            <div>
                <div class="font-semibold text-slate-800 text-sm">${esc(s.student_id)}</div>
                <div class="text-xs text-slate-400 mt-0.5">${fmtDate(s.created_at)} · #${s.id}</div>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-xl ${statusColors[s.status]}">${statusTh[s.status]}</span>
        </div>
        <div class="flex gap-4 text-sm mb-3">
            <div><span class="text-slate-400">จำนวน </span><span class="font-bold text-emerald-600">฿${parseFloat(s.amount).toFixed(2)}</span></div>
            ${s.slipok_ref ? `<div><span class="text-slate-400">Ref </span><span class="font-mono text-xs text-slate-600">${esc(s.slipok_ref)}</span></div>` : ''}
            ${s.receiver_account ? `<div><span class="text-slate-400">บัญชี </span><span class="text-xs text-slate-600">${esc(s.receiver_account)}</span></div>` : ''}
        </div>
        ${s.note ? `<div class="text-xs text-slate-400 mb-3">หมายเหตุ: ${esc(s.note)}</div>` : ''}
        ${isPending ? `
        <div class="flex gap-2">
            <button onclick="approveSlip(${s.id})" class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition">อนุมัติ</button>
            <button onclick="rejectSlip(${s.id})" class="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition">ปฏิเสธ</button>
        </div>` : ''}
    </div>`;
}

async function approveSlip(id) {
    if (!confirm('อนุมัติสลิปนี้?')) return;
    try {
        const d = await api('admin_action.php', { action: 'approve_slip', slip_id: id });
        if (d.success) { loadSlips(slipPage); loadDashboard(); }
        else alert(d.error || 'เกิดข้อผิดพลาด');
    } catch(e) {}
}

async function rejectSlip(id) {
    const note = prompt('เหตุผลที่ปฏิเสธ (ไม่บังคับ):') ?? '';
    try {
        const d = await api('admin_action.php', { action: 'reject_slip', slip_id: id, note });
        if (d.success) { loadSlips(slipPage); loadDashboard(); }
    } catch(e) {}
}

// ─── Users ───────────────────────────────────────────────────────────────────

let userPage = 1;

async function loadUsers(page) {
    userPage = page;
    const q = document.getElementById('user-search').value.trim();
    try {
        const d = await api('admin_action.php', { action: 'search_user', q, page });
        const list = document.getElementById('users-list');
        if (!d.users || d.users.length === 0) {
            list.innerHTML = '<div class="text-center text-slate-400 py-8 text-sm">ไม่พบผู้ใช้</div>';
        } else {
            list.innerHTML = d.users.map(u => `
            <div class="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center justify-between cursor-pointer hover:border-indigo-200 transition"
                onclick="openUserDetail('${esc(u.student_id)}')">
                <div>
                    <div class="font-medium text-slate-800 text-sm">${esc(u.student_id)}</div>
                    <div class="text-xs text-slate-400">สมัคร ${fmtDate(u.created_at)}</div>
                </div>
                <div class="font-bold text-emerald-600 text-sm">฿${parseFloat(u.credit_balance).toFixed(2)}</div>
            </div>`).join('');
        }
        renderPagination('users-pagination', d.page, d.total_pages, loadUsers);
    } catch(e) { console.error(e); }
}

async function openUserDetail(sid) {
    currentUserSid = sid;
    document.getElementById('user-detail').classList.remove('hidden');
    document.getElementById('ud-sid').textContent = sid;
    document.getElementById('ud-balance').textContent = '...';
    document.getElementById('ud-history').innerHTML = '<div class="text-slate-400 text-xs">กำลังโหลด...</div>';
    document.getElementById('adj-msg').classList.add('hidden');
    try {
        const d = await api('admin_action.php', { action: 'get_user_history', student_id: sid });
        document.getElementById('ud-balance').textContent = '฿' + parseFloat(d.user.credit_balance).toFixed(2);
        document.getElementById('ud-history').innerHTML = (d.transactions || []).map(t => `
            <div class="flex justify-between text-xs px-3 py-2 bg-slate-50 rounded-lg">
                <span class="text-slate-500">${fmtDate(t.created_at)} · ${t.description || ''}</span>
                <span class="font-semibold ${t.type==='topup'?'text-emerald-600':'text-red-500'}">${t.type==='topup'?'+':'-'}฿${parseFloat(t.amount).toFixed(2)}</span>
            </div>`).join('') || '<div class="text-slate-400 text-xs">ยังไม่มีประวัติ</div>';
    } catch(e) { console.error(e); }
}

async function adjustCredit() {
    const amount = parseFloat(document.getElementById('adj-amount').value);
    const note   = document.getElementById('adj-note').value.trim() || 'Admin adjust';
    const msg    = document.getElementById('adj-msg');
    if (isNaN(amount) || amount === 0) { showMsg(msg, 'กรุณาใส่จำนวน', 'red'); return; }
    try {
        const d = await api('admin_action.php', { action: 'adjust_credit', student_id: currentUserSid, amount, note });
        if (d.success) {
            showMsg(msg, `สำเร็จ เครดิตใหม่: ฿${parseFloat(d.new_balance).toFixed(2)}`, 'green');
            document.getElementById('ud-balance').textContent = '฿' + parseFloat(d.new_balance).toFixed(2);
            document.getElementById('adj-amount').value = '';
            loadUsers(userPage);
        } else {
            showMsg(msg, d.error || 'เกิดข้อผิดพลาด', 'red');
        }
    } catch(e) { showMsg(msg, 'เกิดข้อผิดพลาด', 'red'); }
}

// ─── Transactions ─────────────────────────────────────────────────────────────

let txnPage = 1;

async function loadTxn(page) {
    txnPage = page;
    const type   = document.getElementById('txn-type').value;
    const search = document.getElementById('txn-search').value.trim();
    try {
        const d = await api('admin_action.php', { action: 'list_transactions', type, student_id: search, page });
        const list = document.getElementById('txn-list');
        if (!d.transactions || d.transactions.length === 0) {
            list.innerHTML = '<div class="text-center text-slate-400 py-8 text-sm">ไม่มีข้อมูล</div>';
        } else {
            list.innerHTML = d.transactions.map(t => `
            <div class="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium text-slate-800">${esc(t.student_id)}</div>
                    <div class="text-xs text-slate-400">${fmtDate(t.created_at)} · ${t.description||''}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-sm ${t.type==='topup'?'text-emerald-600':'text-red-500'}">${t.type==='topup'?'+':'-'}฿${parseFloat(t.amount).toFixed(2)}</div>
                    <div class="text-xs text-slate-400">${t.status}</div>
                </div>
            </div>`).join('');
        }
        renderPagination('txn-pagination', d.page, d.total_pages, loadTxn);
    } catch(e) { console.error(e); }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function loadSettings() {
    try {
        const d = await api('admin_action.php', { action: 'get_settings' });
        const s = d.settings || {};
        if (s.price_per_task) document.getElementById('setting-price').value = parseFloat(s.price_per_task).toFixed(2);
        maintEnabled = (s.maintenance_mode === '1');
        updateMaintToggle();
    } catch(e) {}
}

async function savePrice() {
    const price = parseFloat(document.getElementById('setting-price').value);
    const msg   = document.getElementById('settings-msg');
    if (isNaN(price) || price <= 0) { showMsg(msg, 'ราคาต้องมากกว่า 0', 'red'); return; }
    try {
        const d = await api('admin_action.php', { action: 'save_settings', price_per_task: price });
        if (d.success) showMsg(msg, 'บันทึกราคาแล้ว', 'green');
        else showMsg(msg, d.error || 'เกิดข้อผิดพลาด', 'red');
    } catch(e) { showMsg(msg, 'เกิดข้อผิดพลาด', 'red'); }
}

async function toggleMaintenance() {
    maintEnabled = !maintEnabled;
    updateMaintToggle();
    const msg = document.getElementById('settings-msg');
    try {
        const d = await api('admin_action.php', { action: 'save_settings', maintenance_mode: maintEnabled });
        if (d.success) showMsg(msg, maintEnabled ? 'เปิดโหมดปิดปรับปรุงแล้ว' : 'ปิดโหมดปรับปรุงแล้ว', maintEnabled ? 'amber' : 'green');
        else { maintEnabled = !maintEnabled; updateMaintToggle(); showMsg(msg, d.error || 'เกิดข้อผิดพลาด', 'red'); }
    } catch(e) { maintEnabled = !maintEnabled; updateMaintToggle(); }
}

function updateMaintToggle() {
    const btn  = document.getElementById('maint-toggle');
    const knob = document.getElementById('maint-knob');
    if (maintEnabled) {
        btn.classList.replace('bg-slate-200', 'bg-indigo-500');
        knob.classList.replace('translate-x-0', 'translate-x-6');
    } else {
        btn.classList.replace('bg-indigo-500', 'bg-slate-200');
        knob.classList.replace('translate-x-6', 'translate-x-0');
    }
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

async function exportCSV(table) {
    try {
        const d = await api('admin_action.php', { action: 'export_csv', table });
        if (!d.csv) { alert('ไม่มีข้อมูล'); return; }
        const blob = new Blob(["﻿" + d.csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${table}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    } catch(e) { alert('Export ล้มเหลว'); }
}

// ─── Stuck Tasks ──────────────────────────────────────────────────────────────

async function loadStuck() {
    try {
        const d = await api('admin_action.php', { action: 'list_stuck_tasks' });
        const list = document.getElementById('stuck-list');
        if (!d.tasks || d.tasks.length === 0) {
            list.innerHTML = '<div class="text-center text-slate-400 py-8 text-sm">ไม่มี stuck tasks</div>';
        } else {
            list.innerHTML = d.tasks.map(t => `
            <div class="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium text-slate-800">${esc(t.student_id)}</div>
                    <div class="text-xs text-slate-400">Course ${t.course_id} · Item ${t.itemid} · จ่ายเมื่อ ${fmtDate(t.paid_at)}</div>
                </div>
                <button onclick="refundTask(${t.id}, this)" class="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl hover:bg-amber-100 font-semibold transition">คืนเงิน</button>
            </div>`).join('');
        }
    } catch(e) { console.error(e); }
}

async function refundTask(id, btn) {
    if (!confirm('คืนเงินให้ task นี้?')) return;
    btn.disabled = true;
    btn.textContent = '...';
    try {
        const d = await api('admin_action.php', { action: 'refund_task', task_id: id });
        if (d.success) { loadStuck(); loadDashboard(); }
        else { alert(d.error || 'เกิดข้อผิดพลาด'); btn.disabled = false; btn.textContent = 'คืนเงิน'; }
    } catch(e) { btn.disabled = false; btn.textContent = 'คืนเงิน'; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(s) {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

function showMsg(el, text, color) {
    const colors = { green: 'text-emerald-600', red: 'text-red-600', amber: 'text-amber-600' };
    el.textContent = text;
    el.className = `text-sm ${colors[color] || 'text-slate-600'}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

function renderPagination(containerId, current, total, loadFn) {
    const el = document.getElementById(containerId);
    if (!el || total <= 1) { if(el) el.innerHTML=''; return; }
    let html = '';
    if (current > 1) html += `<button onclick="${loadFn.name}(${current-1})" class="px-3 py-1.5 text-sm rounded-xl border border-slate-200 hover:bg-slate-50">← ก่อน</button>`;
    html += `<span class="px-3 py-1.5 text-sm text-slate-500">${current} / ${total}</span>`;
    if (current < total) html += `<button onclick="${loadFn.name}(${current+1})" class="px-3 py-1.5 text-sm rounded-xl border border-slate-200 hover:bg-slate-50">ถัดไป →</button>`;
    el.innerHTML = html;
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────

(function init() {
    const saved = sessionStorage.getItem('admin_token');
    if (saved) {
        adminToken = saved;
        showApp();
    }
})();
</script>
</body>
</html>
