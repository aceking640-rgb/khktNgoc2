// ======================================================
// SMART CLASSROOM - SUPABASE DASHBOARD
// Phòng 101
// ======================================================


// ======================================================
// 1. KẾT NỐI SUPABASE
// ======================================================

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ======================================================
// 2. CẤU HÌNH MẶC ĐỊNH
// ======================================================

const defaultAutoSettings = {
    fan: [
        { threshold: 26, level: 30 },
        { threshold: 28, level: 50 },
        { threshold: 30, level: 75 },
        { threshold: 32, level: 100 }
    ],

    light: [
        { threshold: 700, level: 0 },
        { threshold: 500, level: 25 },
        { threshold: 300, level: 60 },
        { threshold: 100, level: 100 }
    ]
};


// ======================================================
// 3. TRẠNG THÁI
// ======================================================

const state = {

    fan: {
        mode: 'auto',
        level: 0
    },

    light: {
        mode: 'auto',
        level: 0
    },

    temperature: 0,

    lightLux: 0,

    autoSettings: JSON.parse(
        JSON.stringify(defaultAutoSettings)
    ),

    deviceId: null,

    settingsId: null
};


// ======================================================
// 4. HÀM LẤY ELEMENT
// ======================================================

const $ = (id) => document.getElementById(id);


// ======================================================
// 5. KIỂM TRA ĐĂNG NHẬP
// ======================================================

async function checkLogin() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {

        window.location.href = 'index.html';

        return false;
    }

    return true;
}


// ======================================================
// 6. HIỂN THỊ TRẠNG THÁI KẾT NỐI
// ======================================================

function setConnectionStatus(text) {

    const element = $('connectionText');

    if (element) {
        element.textContent = text;
    }
}


// ======================================================
// 7. ĐỌC DEVICE_STATE TỪ SUPABASE
// ======================================================

async function loadDeviceState() {

    const {
        data,
        error
    } = await supabaseClient
        .from('device_state')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();


    if (error) {

        console.error(
            'Không đọc được device_state:',
            error
        );

        throw error;
    }


    if (!data) {

        throw new Error(
            'Chưa có dữ liệu trong bảng device_state.'
        );
    }


    state.deviceId = data.id;

    state.temperature =
        Number(data.temperature) || 0;

    state.lightLux =
        Number(data.light_level) || 0;

    state.fan.mode =
        data.fan_mode || 'auto';

    state.fan.level =
        Number(data.fan_level) || 0;

    state.light.mode =
        data.light_mode || 'auto';

    state.light.level =
        Number(data.light_level_output) || 0;
}


// ======================================================
// 8. ĐỌC CONTROL_SETTINGS
// ======================================================

async function loadControlSettings() {

    const {
        data,
        error
    } = await supabaseClient
        .from('control_settings')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();


    if (error) {

        console.error(
            'Không đọc được control_settings:',
            error
        );

        throw error;
    }


    if (!data) {

        throw new Error(
            'Chưa có dữ liệu trong bảng control_settings.'
        );
    }


    state.settingsId = data.id;


    // ----------------------------------------------
    // Nếu chưa có rules JSON thì dùng mặc định
    // ----------------------------------------------

    if (
        Array.isArray(data.fan_auto_rules) &&
        data.fan_auto_rules.length > 0
    ) {

        state.autoSettings.fan =
            data.fan_auto_rules;

    } else {

        state.autoSettings.fan =
            JSON.parse(
                JSON.stringify(defaultAutoSettings.fan)
            );
    }


    if (
        Array.isArray(data.light_auto_rules) &&
        data.light_auto_rules.length > 0
    ) {

        state.autoSettings.light =
            data.light_auto_rules;

    } else {

        state.autoSettings.light =
            JSON.parse(
                JSON.stringify(defaultAutoSettings.light)
            );
    }
}


// ======================================================
// 9. TÍNH AUTO QUẠT
// ======================================================

function autoFanLevel(temperature) {

    const points = [
        ...state.autoSettings.fan
    ].sort(
        (a, b) =>
            Number(a.threshold) -
            Number(b.threshold)
    );


    let level = 0;


    for (const point of points) {

        if (
            temperature >=
            Number(point.threshold)
        ) {

            level =
                Number(point.level) || 0;

        } else {

            break;
        }
    }


    return Math.max(
        0,
        Math.min(100, level)
    );
}


// ======================================================
// 10. TÍNH AUTO ĐÈN
// ======================================================

function autoLightLevel(lux) {

    const points = [
        ...state.autoSettings.light
    ].sort(
        (a, b) =>
            Number(b.threshold) -
            Number(a.threshold)
    );


    let level = 0;


    for (const point of points) {

        if (
            lux <=
            Number(point.threshold)
        ) {

            level =
                Number(point.level) || 0;
        }
    }


    return Math.max(
        0,
        Math.min(100, level)
    );
}


// ======================================================
// 11. CẬP NHẬT AUTO
// ======================================================

function updateAutoLevels() {

    if (state.fan.mode === 'auto') {

        state.fan.level =
            autoFanLevel(
                state.temperature
            );
    }


    if (state.light.mode === 'auto') {

        state.light.level =
            autoLightLevel(
                state.lightLux
            );
    }
}


// ======================================================
// 12. GHI TRẠNG THÁI THIẾT BỊ VÀO SUPABASE
// ======================================================

async function saveDeviceState() {

    if (!state.deviceId) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from('device_state')
        .update({

            fan_mode:
                state.fan.mode,

            fan_level:
                state.fan.level,

            light_mode:
                state.light.mode,

            light_level_output:
                state.light.level

        })
        .eq(
            'id',
            state.deviceId
        );


    if (error) {

        console.error(
            'Không lưu được trạng thái thiết bị:',
            error
        );

        alert(
            'Không thể lưu trạng thái thiết bị lên Supabase.'
        );

        throw error;
    }
}


// ======================================================
// 13. RENDER SENSOR
// ======================================================

function renderSensors() {

    $('temperatureValue').textContent =
        `${state.temperature.toFixed(1)}°C`;


    $('lightValue').textContent =
        `${Math.round(state.lightLux)} lux`;


    $('temperatureStatus').textContent =
        state.temperature >= 32
            ? 'Nóng'
            : state.temperature >= 30
                ? 'Hơi nóng'
                : 'Bình thường';


    $('lightStatus').textContent =
        state.lightLux < 300
            ? 'Thiếu sáng'
            : state.lightLux >= 700
                ? 'Rất sáng'
                : 'Đủ sáng';
}


// ======================================================
// 14. RENDER THIẾT BỊ
// ======================================================

function renderDevice(device) {

    const isFan =
        device === 'fan';


    const data =
        state[device];


    const slider =
        isFan
            ? $('fanLevel')
            : $('deviceLightLevel');


    const stateText =
        isFan
            ? $('fanState')
            : $('deviceLightState');


    const levelText =
        isFan
            ? $('fanLevelText')
            : $('deviceLightLevelText');


    const modeText =
        isFan
            ? $('fanModeText')
            : $('lightModeText');


    const manualControls =
        isFan
            ? $('fanManualControls')
            : $('lightManualControls');


    slider.value =
        data.level;


    stateText.textContent =
        `${data.level}%`;


    levelText.textContent =
        `${data.level}%`;


    modeText.textContent =
        data.mode.toUpperCase();


    manualControls.classList.toggle(
        'disabled',
        data.mode !== 'manual'
    );


    document
        .querySelectorAll(
            `.mode-btn[data-device="${device}"]`
        )
        .forEach(
            btn => {

                btn.classList.toggle(
                    'active',
                    btn.dataset.mode ===
                    data.mode
                );
            }
        );
}


// ======================================================
// 15. RENDER AUTO SETTINGS
// ======================================================

function renderAutoSettings() {

    const fanContainer =
        $('fanAutoSettings');


    const lightContainer =
        $('lightAutoSettings');


    fanContainer.innerHTML =
        state.autoSettings.fan
            .map(
                (point, index) => `

                <div class="setting-input-row">

                    <label>

                        <input
                            class="auto-number-input fan-temp-input"
                            data-index="${index}"
                            type="number"
                            min="0"
                            max="60"
                            step="0.1"
                            value="${point.threshold}"
                        >

                        <span>°C</span>

                    </label>


                    <label>

                        <input
                            class="auto-number-input fan-level-input"
                            data-index="${index}"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value="${point.level}"
                        >

                        <span>%</span>

                    </label>


                    <button
                        class="remove-setting-btn"
                        type="button"
                        data-device="fan"
                        data-action="remove-setting"
                        data-index="${index}"
                    >
                        Xóa
                    </button>

                </div>

            `
            )
            .join('');


    lightContainer.innerHTML =
        state.autoSettings.light
            .map(
                (point, index) => `

                <div class="setting-input-row">

                    <label>

                        <input
                            class="auto-number-input light-lux-input"
                            data-index="${index}"
                            type="number"
                            min="0"
                            max="10000"
                            step="1"
                            value="${point.threshold}"
                        >

                        <span>lux</span>

                    </label>


                    <label>

                        <input
                            class="auto-number-input light-level-input"
                            data-index="${index}"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value="${point.level}"
                        >

                        <span>%</span>

                    </label>


                    <button
                        class="remove-setting-btn"
                        type="button"
                        data-device="light"
                        data-action="remove-setting"
                        data-index="${index}"
                    >
                        Xóa
                    </button>

                </div>

            `
            )
            .join('');
}


// ======================================================
// 16. ĐỌC INPUT AUTO
// ======================================================

function readAutoSettingInputs() {

    document
        .querySelectorAll('.fan-temp-input')
        .forEach(input => {

            const index =
                Number(input.dataset.index);

            const value =
                Number(input.value);


            state.autoSettings.fan[index]
                .threshold =
                Number.isFinite(value)
                    ? Math.max(
                        0,
                        Math.min(60, value)
                    )
                    : 0;
        });


    document
        .querySelectorAll('.fan-level-input')
        .forEach(input => {

            const index =
                Number(input.dataset.index);

            const value =
                Number(input.value);


            state.autoSettings.fan[index]
                .level =
                Number.isFinite(value)
                    ? Math.max(
                        0,
                        Math.min(100, value)
                    )
                    : 0;
        });


    document
        .querySelectorAll('.light-lux-input')
        .forEach(input => {

            const index =
                Number(input.dataset.index);

            const value =
                Number(input.value);


            state.autoSettings.light[index]
                .threshold =
                Number.isFinite(value)
                    ? Math.max(
                        0,
                        Math.min(10000, value)
                    )
                    : 0;
        });


    document
        .querySelectorAll('.light-level-input')
        .forEach(input => {

            const index =
                Number(input.dataset.index);

            const value =
                Number(input.value);


            state.autoSettings.light[index]
                .level =
                Number.isFinite(value)
                    ? Math.max(
                        0,
                        Math.min(100, value)
                    )
                    : 0;
        });
}


// ======================================================
// 17. LƯU AUTO SETTINGS VÀO SUPABASE
// ======================================================

async function saveAutoSettings() {

    readAutoSettingInputs();


    if (!state.settingsId) {

        alert(
            'Chưa có ID cài đặt Supabase.'
        );

        return;
    }


    const {
        error
    } = await supabaseClient
        .from('control_settings')
        .update({

            fan_auto_rules:
                state.autoSettings.fan,

            light_auto_rules:
                state.autoSettings.light

        })
        .eq(
            'id',
            state.settingsId
        );


    if (error) {

        console.error(
            'Không lưu được AUTO settings:',
            error
        );

        alert(
            'Không thể lưu cài đặt AUTO lên Supabase.'
        );

        return;
    }


    updateAutoLevels();

    await saveDeviceState();

    render();

    alert(
        'Đã lưu cài đặt AUTO lên Supabase.'
    );
}


// ======================================================
// 18. THÊM MỐC AUTO
// ======================================================

function addAutoSetting(device) {

    const list =
        state.autoSettings[device];


    const last =
        list[list.length - 1];


    if (device === 'fan') {

        const nextThreshold =
            last
                ? Number(last.threshold) + 2
                : 26;


        list.push({

            threshold:
                Math.min(
                    60,
                    nextThreshold
                ),

            level:
                last
                    ? Number(last.level)
                    : 30
        });

    } else {

        const nextThreshold =
            last
                ? Math.max(
                    0,
                    Number(last.threshold) - 100
                )
                : 700;


        list.push({

            threshold:
                nextThreshold,

            level:
                last
                    ? Number(last.level)
                    : 0
        });
    }


    renderAutoSettings();
}


// ======================================================
// 19. XÓA MỐC AUTO
// ======================================================

function removeAutoSetting(
    device,
    index
) {

    const list =
        state.autoSettings[device];


    if (list.length <= 1) {

        alert(
            'Mỗi thiết bị cần ít nhất 1 mốc AUTO.'
        );

        return;
    }


    list.splice(index, 1);

    renderAutoSettings();
}


// ======================================================
// 20. ĐỔI AUTO / MANUAL
// ======================================================

async function setMode(
    device,
    mode
) {

    state[device].mode =
        mode;


    updateAutoLevels();

    render();


    try {

        await saveDeviceState();

    } catch (error) {

        console.error(error);
    }
}


// ======================================================
// 21. ĐIỀU CHỈNH MANUAL
// ======================================================

async function setManualLevel(
    device,
    level
) {

    if (
        state[device].mode !==
        'manual'
    ) {

        return;
    }


    state[device].level =
        Number(level);


    renderDevice(device);


    try {

        await saveDeviceState();

    } catch (error) {

        console.error(error);
    }
}


// ======================================================
// 22. RENDER TOÀN BỘ
// ======================================================

function render() {

    updateAutoLevels();

    renderSensors();

    renderDevice('fan');

    renderDevice('light');

    renderAutoSettings();
}


// ======================================================
// 23. SLIDER QUẠT
// ======================================================

$('fanLevel')
    .addEventListener(
        'input',
        async (event) => {

            if (
                state.fan.mode !==
                'manual'
            ) {

                return;
            }


            state.fan.level =
                Number(event.target.value);


            renderDevice('fan');


            await saveDeviceState();
        }
    );


// ======================================================
// 24. SLIDER ĐÈN
// ======================================================

$('deviceLightLevel')
    .addEventListener(
        'input',
        async (event) => {

            if (
                state.light.mode !==
                'manual'
            ) {

                return;
            }


            state.light.level =
                Number(event.target.value);


            renderDevice('light');


            await saveDeviceState();
        }
    );


// ======================================================
// 25. NÚT AUTO / MANUAL
// ======================================================

document
    .querySelectorAll('.mode-btn')
    .forEach(btn => {

        btn.addEventListener(
            'click',
            () => {

                setMode(
                    btn.dataset.device,
                    btn.dataset.mode
                );
            }
        );
    });


// ======================================================
// 26. NÚT NHANH
// ======================================================

document
    .querySelectorAll('.quick-btn')
    .forEach(btn => {

        btn.addEventListener(
            'click',
            () => {

                setManualLevel(
                    btn.dataset.device,
                    btn.dataset.level
                );
            }
        );
    });


// ======================================================
// 27. THÊM MỐC
// ======================================================

$('addFanSetting')
    .addEventListener(
        'click',
        () => addAutoSetting('fan')
    );


$('addLightSetting')
    .addEventListener(
        'click',
        () => addAutoSetting('light')
    );


// ======================================================
// 28. XÓA MỐC
// ======================================================

document.addEventListener(
    'click',
    event => {

        const button =
            event.target.closest(
                '[data-action="remove-setting"]'
            );


        if (!button) {
            return;
        }


        removeAutoSetting(
            button.dataset.device,
            Number(button.dataset.index)
        );
    }
);


// ======================================================
// 29. LƯU CÀI ĐẶT
// ======================================================

$('saveFanSettings')
    .addEventListener(
        'click',
        saveAutoSettings
    );


$('saveLightSettings')
    .addEventListener(
        'click',
        saveAutoSettings
    );


// ======================================================
// 30. ĐĂNG XUẤT
// ======================================================

$('logoutBtn')
    .addEventListener(
        'click',
        async () => {

            await supabaseClient.auth.signOut();

            window.location.href =
                'index.html';
        }
    );


// ======================================================
// 31. ĐỒNG HỒ
// ======================================================

function updateClock() {

    const now =
        new Date();


    $('clock').textContent =
        now.toLocaleTimeString(
            'vi-VN'
        );
}


setInterval(
    updateClock,
    1000
);

updateClock();


// ======================================================
// 32. REALTIME
// ======================================================

function subscribeRealtime() {

    supabaseClient
        .channel('device-state-realtime')

        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'device_state'
            },

            async () => {

                try {

                    await loadDeviceState();

                    render();

                } catch (error) {

                    console.error(
                        'Realtime update error:',
                        error
                    );
                }
            }
        )

        .subscribe();


    supabaseClient
        .channel('control-settings-realtime')

        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'control_settings'
            },

            async () => {

                try {

                    await loadControlSettings();

                    render();

                } catch (error) {

                    console.error(
                        'Realtime settings error:',
                        error
                    );
                }
            }
        )

        .subscribe();
}


// ======================================================
// 33. KHỞI ĐỘNG DASHBOARD
// ======================================================

async function initDashboard() {

    try {

        // Kiểm tra đăng nhập
        const loggedIn =
            await checkLogin();


        if (!loggedIn) {
            return;
        }


        setConnectionStatus(
            'Đang kết nối Supabase...'
        );


        // Đọc database
        await loadDeviceState();

        await loadControlSettings();


        // Tính AUTO
        updateAutoLevels();


        // Hiển thị
        render();


        // Kết nối realtime
        subscribeRealtime();


        setConnectionStatus(
            'Đã kết nối Supabase'
        );


        console.log(
            'Smart Classroom Dashboard đã kết nối Supabase.'
        );

    } catch (error) {

        console.error(
            'Dashboard initialization error:',
            error
        );


        setConnectionStatus(
            'Lỗi kết nối'
        );


        alert(
            'Không thể kết nối dữ liệu Supabase. ' +
            'Hãy kiểm tra Console để xem lỗi.'
        );
    }
}


// ======================================================
// 34. CHẠY
// ======================================================

initDashboard();