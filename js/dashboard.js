// ==============================
// SMART CLASSROOM - DEMO
// Chưa kết nối Supabase ở bước này.
// ==============================

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

function loadAutoSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('khktNgoc.autoSettings'));
        if (saved && Array.isArray(saved.fan) && Array.isArray(saved.light)) {
            return saved;
        }
    } catch (error) {
        console.warn('Không đọc được cài đặt AUTO đã lưu.', error);
    }

    return JSON.parse(JSON.stringify(defaultAutoSettings));
}

const state = {
    fan: { mode: 'auto', level: 80 },
    light: { mode: 'auto', level: 45 },
    temperature: 28.5,
    lightLux: 420,
    autoSettings: loadAutoSettings()
};

const $ = (id) => document.getElementById(id);

function autoFanLevel(temperature) {
    const points = [...state.autoSettings.fan].sort((a, b) => a.threshold - b.threshold);
    let level = 0;

    for (const point of points) {
        if (temperature >= point.threshold) {
            level = point.level;
        } else {
            break;
        }
    }

    return level;
}

function autoLightLevel(lux) {
    const points = [...state.autoSettings.light].sort((a, b) => b.threshold - a.threshold);
    let level = 0;

    for (const point of points) {
        if (lux <= point.threshold) {
            level = point.level;
        }
    }

    return level;
}

function renderAutoSettings() {
    const fanContainer = $('fanAutoSettings');
    const lightContainer = $('lightAutoSettings');

    fanContainer.innerHTML = state.autoSettings.fan.map((point, index) => `
        <div class="setting-input-row">
            <label>
                <input class="auto-number-input fan-temp-input" data-index="${index}" type="number" min="0" max="60" step="0.1" value="${point.threshold}">
                <span>°C</span>
            </label>
            <label>
                <input class="auto-number-input fan-level-input" data-index="${index}" type="number" min="0" max="100" step="1" value="${point.level}">
                <span>%</span>
            </label>
            <button class="remove-setting-btn" type="button" data-device="fan" data-action="remove-setting" data-index="${index}">Xóa</button>
        </div>
    `).join('');

    lightContainer.innerHTML = state.autoSettings.light.map((point, index) => `
        <div class="setting-input-row">
            <label>
                <input class="auto-number-input light-lux-input" data-index="${index}" type="number" min="0" max="10000" step="1" value="${point.threshold}">
                <span>lux</span>
            </label>
            <label>
                <input class="auto-number-input light-level-input" data-index="${index}" type="number" min="0" max="100" step="1" value="${point.level}">
                <span>%</span>
            </label>
            <button class="remove-setting-btn" type="button" data-device="light" data-action="remove-setting" data-index="${index}">Xóa</button>
        </div>
    `).join('');
}

function addAutoSetting(device) {
    const list = state.autoSettings[device];
    const last = list[list.length - 1];

    if (device === 'fan') {
        const nextThreshold = last ? Number(last.threshold) + 2 : 26;
        list.push({ threshold: Math.min(60, nextThreshold), level: last ? Number(last.level) : 30 });
    } else {
        const nextThreshold = last ? Math.max(0, Number(last.threshold) - 100) : 700;
        list.push({ threshold: nextThreshold, level: last ? Number(last.level) : 0 });
    }

    renderAutoSettings();
}

function removeAutoSetting(device, index) {
    const list = state.autoSettings[device];
    if (list.length <= 1) {
        alert('Mỗi thiết bị cần ít nhất 1 mốc AUTO.');
        return;
    }

    list.splice(index, 1);
    renderAutoSettings();
}

function readAutoSettingInputs() {
    document.querySelectorAll('.fan-temp-input').forEach((input) => {
        const index = Number(input.dataset.index);
        const value = Number(input.value);
        state.autoSettings.fan[index].threshold = Number.isFinite(value) ? Math.max(0, Math.min(60, value)) : 0;
    });
    document.querySelectorAll('.fan-level-input').forEach((input) => {
        const index = Number(input.dataset.index);
        const value = Number(input.value);
        state.autoSettings.fan[index].level = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    });

    document.querySelectorAll('.light-lux-input').forEach((input) => {
        const index = Number(input.dataset.index);
        const value = Number(input.value);
        state.autoSettings.light[index].threshold = Number.isFinite(value) ? Math.max(0, Math.min(10000, value)) : 0;
    });
    document.querySelectorAll('.light-level-input').forEach((input) => {
        const index = Number(input.dataset.index);
        const value = Number(input.value);
        state.autoSettings.light[index].level = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    });
}

function saveAutoSettings() {
    readAutoSettingInputs();
    localStorage.setItem('khktNgoc.autoSettings', JSON.stringify(state.autoSettings));
    render();
    alert('Đã lưu cài đặt AUTO trên trình duyệt.');
}

function updateAutoLevels() {
    if (state.fan.mode === 'auto') {
        state.fan.level = autoFanLevel(state.temperature);
    }
    if (state.light.mode === 'auto') {
        state.light.level = autoLightLevel(state.lightLux);
    }
}

function renderDevice(device) {
    const isFan = device === 'fan';
    const data = state[device];
    const slider = isFan ? $('fanLevel') : $('deviceLightLevel');
    const stateText = isFan ? $('fanState') : $('deviceLightState');
    const levelText = isFan ? $('fanLevelText') : $('deviceLightLevelText');
    const modeText = isFan ? $('fanModeText') : $('lightModeText');
    const manualControls = isFan ? $('fanManualControls') : $('lightManualControls');

    slider.value = data.level;
    stateText.textContent = `${data.level}%`;
    levelText.textContent = `${data.level}%`;
    modeText.textContent = data.mode.toUpperCase();
    manualControls.classList.toggle('disabled', data.mode !== 'manual');

    document.querySelectorAll(`.mode-btn[data-device="${device}"]`).forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === data.mode);
    });
}

function renderSensors() {
    $('temperatureValue').textContent = `${state.temperature.toFixed(1)}°C`;
    $('lightValue').textContent = `${Math.round(state.lightLux)} lux`;

    $('temperatureStatus').textContent = state.temperature >= 32 ? 'Nóng' : state.temperature >= 30 ? 'Hơi nóng' : 'Bình thường';
    $('lightStatus').textContent = state.lightLux < 300 ? 'Thiếu sáng' : state.lightLux >= 700 ? 'Rất sáng' : 'Đủ sáng';
}

function render() {
    updateAutoLevels();
    renderSensors();
    renderDevice('fan');
    renderDevice('light');
}

function setMode(device, mode) {
    state[device].mode = mode;
    render();
}

function setManualLevel(device, level) {
    if (state[device].mode !== 'manual') return;
    state[device].level = Number(level);
    renderDevice(device);
}

$('fanLevel').addEventListener('input', (e) => {
    if (state.fan.mode === 'manual') {
        state.fan.level = Number(e.target.value);
        renderDevice('fan');
    }
});

$('deviceLightLevel').addEventListener('input', (e) => {
    if (state.light.mode === 'manual') {
        state.light.level = Number(e.target.value);
        renderDevice('light');
    }
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.device, btn.dataset.mode));
});

document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => setManualLevel(btn.dataset.device, btn.dataset.level));
});

$('addFanSetting').addEventListener('click', () => addAutoSetting('fan'));
$('addLightSetting').addEventListener('click', () => addAutoSetting('light'));

document.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action="remove-setting"]');
    if (!button) return;

    const device = button.dataset.device;
    const index = Number(button.dataset.index);
    removeAutoSetting(device, index);
});

$('saveFanSettings').addEventListener('click', saveAutoSettings);
$('saveLightSettings').addEventListener('click', saveAutoSettings);

$('logoutBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});

function updateClock() {
    const now = new Date();
    $('clock').textContent = now.toLocaleTimeString('vi-VN');
}

setInterval(updateClock, 1000);
updateClock();
renderAutoSettings();
render();
