(function () {
    'use strict';

    var root = document.documentElement;
    var body = document.body;
    var KEY = 'sstm-theme';
    var KEY_IMG = 'sstm-theme-bg';

    var DEFAULTS = { primary: '#1a5c3a', header: null, bg: '#ffffff', nav: 'horizontal' };
    var DEFAULT_DERIVED = { dark: '#0f3d26', light: '#2d8a5a', accent: '#3d9b6e' };

    var state = { primary: DEFAULTS.primary, header: DEFAULTS.header, bg: DEFAULTS.bg, nav: DEFAULTS.nav, image: '', flat: false };
    var imageLum = 0.5;
    var pickerTarget = null;

    function $(s, c) { return (c || document).querySelector(s); }
    function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

    function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

    function hexToRgb(hex) {
        hex = String(hex).replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
        var n = parseInt(hex, 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function rgbToHex(rgb) {
        return '#' + rgb.map(function (v) {
            return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
        }).join('');
    }
    function mix(a, b, t) {
        var A = hexToRgb(a), B = hexToRgb(b);
        return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
    }
    function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    function luminance(hexOrRgb) {
        var c = Array.isArray(hexOrRgb) ? hexOrRgb : hexToRgb(hexOrRgb);
        return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    }
    function contrast(a, b) {
        var la = luminance(a), lb = luminance(b);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    }
    function same(a, b) { return !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase(); }

    function rgbToHsl(rgb) {
        var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h *= 60;
        }
        return [h, s, l];
    }
    function hslToHex(h, s, l) {
        var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
        return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
    }

    function isDarkBg(bg) { return contrast(bg, '#1a1a1a') < contrast(bg, '#ffffff'); }

    function readablePrimary(primary, bg) {
        if (contrast(primary, bg) >= 4.5) return primary;
        var target = isDarkBg(bg) ? '#ffffff' : '#000000';
        for (var t = 0.08; t <= 1.001; t += 0.08) {
            var c = mix(primary, target, t);
            if (contrast(c, bg) >= 4.5) return c;
        }
        return target;
    }

    function set(el, map) {
        Object.keys(map).forEach(function (k) {
            if (map[k] === null || map[k] === undefined) el.style.removeProperty(k);
            else el.style.setProperty(k, map[k]);
        });
    }

    var bgStyleEl = null;
    function applyImageCss(scrim) {
        if (!bgStyleEl) {
            bgStyleEl = document.createElement('style');
            bgStyleEl.id = 'themeBgImage';
            document.head.appendChild(bgStyleEl);
        }
        bgStyleEl.textContent = state.image
            ? 'body.has-bg-image::before{background-image:linear-gradient(' + scrim + ',' + scrim + '),url("' + state.image + '");}'
            : '';
    }

    function effectiveBg() {
        if (state.image) return imageLum >= 0.5 ? '#ffffff' : '#0f172a';
        return state.bg === 'transparent' ? '#ffffff' : state.bg;
    }

    function palette() {
        var eff = effectiveBg();
        var dark = isDarkBg(eff);
        var isWhite = same(eff, '#ffffff');
        var p = { eff: eff, dark: dark };

        if (state.image) {
            p.pageBg = eff;
            p.surface = eff;
            p.surface2 = eff;
            p.solid = dark ? '#1e293b' : '#ffffff';
        } else if (dark) {
            p.pageBg = eff;
            p.surface = mix(eff, '#ffffff', 0.09);
            p.surface2 = mix(eff, '#ffffff', 0.045);
            p.solid = p.surface;
        } else if (isWhite) {
            p.pageBg = '#ffffff'; p.surface = '#ffffff'; p.surface2 = '#f8faf9'; p.solid = '#ffffff';
        } else {
            p.pageBg = eff;
            p.surface = mix(eff, '#ffffff', 0.6);
            p.surface2 = mix(eff, '#000000', 0.035);
            p.solid = p.surface;
        }

        if (dark) {
            p.text = '#f1f5f9'; p.text2 = '#cbd5e1'; p.text3 = '#94a3b8';
            p.footer = state.image ? '#0f172a' : mix(eff, '#000000', 0.45);
        } else {
            p.text = '#1a1a1a'; p.text2 = '#555555'; p.text3 = '#888888';
            p.footer = '#1a1a1a';
        }
        return p;
    }

    function headerColor(p) {
        if (state.header) return state.header;
        if (state.image) return 'transparent';
        return state.flat ? p.pageBg : '#ffffff';
    }

    function applyHeader(p) {
        var h = $('#header');
        if (!h) return;
        var color = headerColor(p);
        var scoped = ['--surface', '--text', '--text-2', '--text-3', '--primary-text'];

        if (color === 'transparent') {
            h.style.background = 'transparent';
            h.style.boxShadow = 'none';
            scoped.forEach(function (k) { h.style.removeProperty(k); });
            h.classList.remove('same-tone');
            h.style.removeProperty('--logo-invert');
            root.style.setProperty('--menu-bg', p.dark ? mix(p.eff, '#000000', 0.25) : '#ffffff');
        } else {
            var dark = isDarkBg(color);
            h.style.background = color;
            h.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
            set(h, {
                '--surface': color,
                '--text': dark ? '#f1f5f9' : '#1a1a1a',
                '--text-2': dark ? '#cbd5e1' : '#555555',
                '--text-3': dark ? '#94a3b8' : '#888888',
                '--primary-text': readablePrimary(state.primary, color)
            });
            h.style.setProperty('--logo-invert', dark ? 0 : 1);
            h.classList.toggle('same-tone', contrast(state.primary, color) < 1.6);
            root.style.setProperty('--menu-bg', color);
        }
    }

    function apply() {
        var p = palette();
        var pr = state.primary;
        var isDefaultPrimary = same(pr, DEFAULTS.primary);
        var rgb = hexToRgb(pr), hsl = rgbToHsl(rgb);

        var primaryDark = isDefaultPrimary ? DEFAULT_DERIVED.dark : mix(pr, '#000000', 0.35);
        var primaryLight = isDefaultPrimary ? DEFAULT_DERIVED.light : hslToHex(hsl[0], hsl[1] * 0.95, clamp(hsl[2] + 0.13, 0.1, 0.85));
        var accent = isDefaultPrimary ? DEFAULT_DERIVED.accent : hslToHex(hsl[0], clamp(hsl[1] * 0.78, 0, 1), clamp(hsl[2] + 0.2, 0.28, 0.8));
        var onPrimary = contrast(pr, '#ffffff') >= contrast(pr, '#111827') ? '#ffffff' : '#111827';

        var isDefaultLook = !state.image && same(p.eff, '#ffffff');
        var heroBg = isDefaultLook
            ? 'linear-gradient(135deg, #f0f9f4 0%, #ffffff 50%, #e8f5ef 100%)'
            : 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 9%, var(--page-bg)) 0%, var(--page-bg) 50%, color-mix(in srgb, var(--accent) 16%, var(--page-bg)) 100%)';

        var scrim = 'transparent';
        var textShadow = 'none';
        if (state.image) {
            scrim = p.dark ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.38)';
            textShadow = p.dark ? '0 1px 3px rgba(0,0,0,0.55)' : '0 1px 2px rgba(255,255,255,0.7)';
        }

        set(root, {
            '--primary': pr,
            '--primary-dark': primaryDark,
            '--primary-light': primaryLight,
            '--accent': accent,
            '--on-primary': onPrimary,
            '--primary-text': readablePrimary(pr, p.solid),
            '--page-bg': p.pageBg,
            '--surface': p.surface,
            '--surface-2': p.surface2,
            '--solid': p.solid,
            '--text': p.text,
            '--text-2': p.text2,
            '--text-3': p.text3,
            '--footer-bg': p.footer,
            '--hero-bg': heroBg,
            '--scrim': scrim,
            '--text-shadow': textShadow
        });

        root.style.setProperty('--logo-invert', p.dark ? 0 : 1);
        root.style.setProperty('--footer-invert', (state.flat || state.image) ? (p.dark ? 0 : 1) : 0);
        body.classList.toggle('has-bg-image', !!state.image);
        body.classList.toggle('flat', !!state.flat);
        body.classList.toggle('dark-mode', p.dark);
        body.classList.toggle('nav-vertical', state.nav === 'vertical');
        applyImageCss(scrim);
        applyHeader(p);
        syncControls(p);
    }

    function syncControls(p) {
        var hv = headerColor(p);
        $$('.primary-color').forEach(function (b) { b.classList.toggle('active', same(b.dataset.color, state.primary)); });
        $$('.header-color').forEach(function (b) { b.classList.toggle('active', same(b.dataset.header, hv) || (b.dataset.header === 'transparent' && hv === 'transparent')); });
        $$('.bg-swatch').forEach(function (b) {
            var on = !state.image && (b.dataset.bg === 'transparent' ? state.bg === 'transparent' : same(b.dataset.bg, state.bg));
            b.classList.toggle('active', on);
        });
        var mode = $('input[name="themeMode"][value="' + (p.dark ? 'dark' : 'light') + '"]');
        if (mode) mode.checked = true;
        var nav = $('input[name="navLayout"][value="' + state.nav + '"]');
        if (nav) nav.checked = true;

        var tile = $('.bg-upload-item');
        if (tile) {
            tile.style.backgroundImage = state.image ? 'url("' + state.image + '")' : '';
            tile.style.backgroundSize = 'cover';
            tile.style.backgroundPosition = 'center';
            tile.classList.toggle('has-preview', !!state.image);
        }
        var clear = $('#clearMenuBg');
        if (clear) clear.style.display = state.image ? '' : 'none';
    }

    function fileToDataUrl(file, maxDim, quality) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onerror = reject;
            reader.onload = function () {
                var img = new Image();
                img.onerror = reject;
                img.onload = function () {
                    var k = Math.min(1, maxDim / Math.max(img.width, img.height));
                    var c = document.createElement('canvas');
                    c.width = Math.max(1, Math.round(img.width * k));
                    c.height = Math.max(1, Math.round(img.height * k));
                    var x = c.getContext('2d');
                    x.fillStyle = '#ffffff';
                    x.fillRect(0, 0, c.width, c.height);
                    x.drawImage(img, 0, 0, c.width, c.height);
                    resolve(c.toDataURL('image/jpeg', quality));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function sampleLuminance(url) {
        return new Promise(function (resolve) {
            var img = new Image();
            img.onload = function () {
                try {
                    var c = document.createElement('canvas');
                    c.width = c.height = 32;
                    var x = c.getContext('2d');
                    x.drawImage(img, 0, 0, 32, 32);
                    var d = x.getImageData(0, 0, 32, 32).data, sum = 0;
                    for (var i = 0; i < d.length; i += 4) sum += luminance([d[i], d[i + 1], d[i + 2]]);
                    resolve(sum / (d.length / 4));
                } catch (e) { resolve(0.5); }
            };
            img.onerror = function () { resolve(0.5); };
            img.src = url;
        });
    }

    function setImage(dataUrl) {
        return sampleLuminance(dataUrl).then(function (l) {
            state.image = dataUrl;
            imageLum = l;
            apply();
        });
    }

    var toastTimer;
    function toast(msg, ok) {
        var t = $('#themeToast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'themeToast';
            t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:3000;padding:10px 18px;' +
                'border-radius:8px;color:#fff;font-size:14px;font-weight:600;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:90vw;font-family:inherit;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.background = ok === false ? '#dc2626' : '#16a34a';
        t.style.display = 'block';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.style.display = 'none'; }, 2400);
    }

    var panel = $('#switcherPanel');
    var overlay = $('#switcherOverlay');
    function openPanel() { panel.classList.add('active'); overlay.classList.add('active'); }
    function closePanel() {
        panel.classList.remove('active');
        overlay.classList.remove('active');
        closePicker();
    }
    $('#themeToggleBtn').addEventListener('click', openPanel);
    $('#themeToggleBtnMobile').addEventListener('click', openPanel);
    $('#closeSwitcher').addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });

    $$('.switcher-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            $$('.switcher-tab').forEach(function (t) { t.classList.remove('active'); });
            $$('.switcher-content').forEach(function (c) { c.classList.remove('active'); });
            tab.classList.add('active');
            $('#tab-' + tab.dataset.tab).classList.add('active');
            closePicker();
        });
    });

    $$('.primary-color').forEach(function (b) {
        b.addEventListener('click', function () { state.primary = b.dataset.color; apply(); });
    });
    $$('.header-color').forEach(function (b) {
        b.addEventListener('click', function () { state.header = b.dataset.header; apply(); });
    });
    $$('.bg-swatch').forEach(function (b) {
        b.addEventListener('click', function () {
            if (!b.dataset.bg) return;
            state.bg = b.dataset.bg;
            state.flat = !(same(b.dataset.bg, '#ffffff') || b.dataset.bg === 'transparent');
            state.image = '';
            apply();
        });
    });
    $$('input[name="themeMode"]').forEach(function (r) {
        r.addEventListener('change', function () {
            state.bg = r.value === 'dark' ? '#0f172a' : '#ffffff';
            state.header = null;
            state.flat = true;
            state.image = '';
            apply();
        });
    });
    $$('input[name="navLayout"]').forEach(function (r) {
        r.addEventListener('change', function () { state.nav = r.value; apply(); });
    });

    var upload = $('#bgImageUpload');
    if (upload) {
        upload.addEventListener('change', function () {
            var file = this.files && this.files[0];
            if (!file) return;
            fileToDataUrl(file, 1920, 0.82).then(function (url) {
                if (url.length > 1800000) return fileToDataUrl(file, 1280, 0.7);
                return url;
            }).then(setImage).catch(function () {
                toast('Could not read that image', false);
            });
            this.value = '';
        });
    }
    $('#clearMenuBg').addEventListener('click', function () { state.image = ''; apply(); });

    var popup = $('#colorPickerPopup');
    var native = $('#nativeColorPicker');
    function openPicker(target, current, btn) {
        pickerTarget = target;
        native.value = /^#[0-9a-f]{6}$/i.test(current) ? current : '#1a5c3a';
        var pr = panel.getBoundingClientRect(), br = btn.getBoundingClientRect();
        var top = br.bottom - pr.top + 8, left = br.left - pr.left;
        if (left + 200 > pr.width) left = pr.width - 210;
        if (left < 10) left = 10;
        if (top + 140 > pr.height) top = br.top - pr.top - 150;
        popup.style.top = top + 'px';
        popup.style.left = left + 'px';
        popup.classList.add('active');
    }
    function closePicker() { popup.classList.remove('active'); pickerTarget = null; }

    $('#openPrimaryPicker').addEventListener('click', function () { openPicker('primary', state.primary, this); });
    $('#openHeaderPicker').addEventListener('click', function () { openPicker('header', headerColor(palette()), this); });
    $('#openBgPicker').addEventListener('click', function () { openPicker('bg', state.image ? '#ffffff' : (state.bg === 'transparent' ? '#ffffff' : state.bg), this); });
    $('#cpCancel').addEventListener('click', closePicker);
    $('#cpApply').addEventListener('click', function () {
        var c = native.value;
        if (pickerTarget === 'primary') state.primary = c;
        else if (pickerTarget === 'header') state.header = c;
        else if (pickerTarget === 'bg') { state.bg = c; state.image = ''; state.flat = true; }
        closePicker();
        apply();
    });

    function save() {
        var ok = true;
        try {
            localStorage.setItem(KEY, JSON.stringify({
                primary: state.primary, header: state.header, bg: state.bg, nav: state.nav,
                hasImage: !!state.image, imageLum: imageLum, flat: !!state.flat
            }));
            if (state.image) localStorage.setItem(KEY_IMG, state.image);
            else localStorage.removeItem(KEY_IMG);
        } catch (e) { ok = false; }
        return ok;
    }

    $('#applyChanges').addEventListener('click', function () {
        var ok = save();
        closePanel();
        toast(ok ? 'Theme saved successfully' : 'Theme applied (could not be saved in this browser)', ok);
    });

    $('#resetSwitcher').addEventListener('click', function () {
        state = { primary: DEFAULTS.primary, header: DEFAULTS.header, bg: DEFAULTS.bg, nav: DEFAULTS.nav, image: '', flat: false };
        imageLum = 0.5;
        try { localStorage.removeItem(KEY); localStorage.removeItem(KEY_IMG); } catch (e) { }
        apply();
        toast('Theme reset to default', true);
    });

    (function load() {
        try {
            var s = JSON.parse(localStorage.getItem(KEY));
            if (s) {
                if (s.primary) state.primary = s.primary;
                if (s.header !== undefined) state.header = s.header;
                if (s.bg) state.bg = s.bg;
                if (s.nav) state.nav = s.nav;
                state.flat = !!s.flat;
                if (typeof s.imageLum === 'number') imageLum = s.imageLum;
                if (s.hasImage) state.image = localStorage.getItem(KEY_IMG) || '';
            }
        } catch (e) { }
        apply();
    })();
})();
