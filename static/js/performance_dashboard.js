(() => {
    const cardsEl = document.getElementById('performance-metric-cards');
    if (!cardsEl) {
        return;
    }

    const METRICS = [
        {
            id: 'views',
            label: 'المشاهدات',
            labelShort: 'المشاهدات',
            file: 'views_timeseries.csv',
            color: '#3b82f6',
            colorLight: '#dbeafe',
            icon: '👁️',
            description: 'إجمالي مرات مشاهدة المحتوى',
            axis: 'y'
        },
        {
            id: 'reach',
            label: 'مدى الوصول',
            labelShort: 'الوصول',
            file: 'reach_timeseries.csv',
            color: '#f59e0b',
            colorLight: '#fef3c7',
            icon: '📢',
            description: 'عدد الحسابات الفريدة التي وصلها المحتوى',
            axis: 'y'
        },
        {
            id: 'impressions',
            label: 'الظهور التقديري',
            labelShort: 'الظهور',
            file: 'impressions_timeseries.csv',
            color: '#ec4899',
            colorLight: '#fce7f3',
            icon: '📊',
            description: 'عدد مرات ظهور المحتوى في الخلاصات',
            axis: 'y'
        },
        {
            id: 'authors',
            label: 'أيام النشر النشطة',
            labelShort: 'أيام النشر',
            file: 'authors_timeseries.csv',
            color: '#10b981',
            colorLight: '#d1fae5',
            icon: '📅',
            description: 'عدد الأيام التي تم فيها نشر محتوى',
            axis: 'y2'
        }
    ];

    const statusMessage = (message, isError = false) => {
        cardsEl.innerHTML = `<div class="chart-status${isError ? ' error' : ''}">${message}</div>`;
    };

    const sanitize = (text) => text.replace(/\ufeff/g, '');

    const formatArabicDate = (isoDate) => {
        if (!isoDate) return '—';
        const parsed = new Date(`${isoDate}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) return isoDate;
        return parsed.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatShortDate = (isoDate) => {
        if (!isoDate) return '—';
        const parsed = new Date(`${isoDate}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) return isoDate;
        return parsed.toLocaleDateString('ar-EG-u-nu-latn', {
            day: 'numeric',
            month: 'short'
        });
    };

    const compactFormatter = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1
    });

    const fullFormatter = new Intl.NumberFormat('en-US');

    const formatCompact = (value) => {
        if (value === null || typeof value === 'undefined') return '—';
        if (value === 0) return '0';
        return compactFormatter.format(value);
    };

    const formatFull = (value) => {
        if (value === null || typeof value === 'undefined') return '—';
        return fullFormatter.format(Math.round(value));
    };

    const parseMetricCsv = (rawText) => {
        const lines = sanitize(rawText)
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        const headerIdx = lines.findIndex((line) => /date/i.test(line) && /count/i.test(line));
        const dataLines = headerIdx >= 0 ? lines.slice(headerIdx + 1) : lines;

        const byDate = new Map();

        dataLines.forEach((line) => {
            const cleaned = line.replace(/"/g, '');
            const parts = cleaned
                .split(',')
                .map((item) => item.trim())
                .filter((item) => item.length > 0);

            if (parts.length < 2) return;

            const isoWithTime = parts[0];
            const isoDate = isoWithTime.split(' ')[0];
            const numeric = Number(parts[1].replace(/[^0-9.-]/g, ''));

            if (!isoDate || Number.isNaN(numeric)) return;

            byDate.set(isoDate, numeric);
        });

        const ordered = Array.from(byDate.entries()).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        let total = 0;
        let maxValue = 0;
        let maxDate = null;
        let minNonZero = Infinity;
        let activeDays = 0;
        let latest = null;

        ordered.forEach(([date, value]) => {
            total += value;
            if (value > 0) {
                activeDays++;
                if (value > maxValue) {
                    maxValue = value;
                    maxDate = date;
                }
                if (value < minNonZero) {
                    minNonZero = value;
                }
            }
            if (value !== null && value !== undefined) {
                latest = { date, value };
            }
        });

        const average = activeDays > 0 ? total / activeDays : 0;

        return { 
            byDate, 
            total, 
            latest, 
            maxValue, 
            maxDate, 
            minNonZero: minNonZero === Infinity ? 0 : minNonZero,
            activeDays,
            average,
            totalDays: ordered.length
        };
    };

    // Helper function to get base path for GitHub Pages
    const getBasePath = () => window.location.hostname.includes('github.io') ? '/awqaf' : '';

    const fetchMetric = (metric) => fetch(getBasePath() + `/static/data/${metric.file}?cache=${Date.now()}`)
        .then((response) => {
            if (!response.ok) throw new Error(`تعذر تحميل ملف ${metric.label}`);
            return response.text();
        })
        .then((text) => parseMetricCsv(text));

    const renderDashboard = (metricResults) => {
        const metricData = {};

        METRICS.forEach((metric, idx) => {
            const result = metricResults[idx];
            if (!result) return;
            metricData[metric.id] = result;
        });

        // Generate enhanced cards with rich statistics
        const cardsMarkup = METRICS.map((metric) => {
            const result = metricData[metric.id];
            if (!result) return '';

            const totalText = formatCompact(result.total || 0);
            const avgText = formatCompact(result.average || 0);
            const maxText = formatCompact(result.maxValue || 0);
            const maxDateText = result.maxDate ? formatShortDate(result.maxDate) : '—';
            const activityRate = result.totalDays > 0 
                ? Math.round((result.activeDays / result.totalDays) * 100) 
                : 0;

            return `
                <div class="dashboard-card-enhanced" data-metric="${metric.id}" style="--card-color: ${metric.color}; --card-bg: ${metric.colorLight};">
                    <div class="card-header-row">
                        <span class="card-icon">${metric.icon}</span>
                        <span class="card-label">${metric.label}</span>
                    </div>
                    <div class="card-main-value">${totalText}</div>
                    <div class="card-description">${metric.description}</div>
                    <div class="card-stats-row">
                        <div class="mini-stat">
                            <span class="mini-stat-value">${avgText}</span>
                            <span class="mini-stat-label">المتوسط</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-value">${maxText}</span>
                            <span class="mini-stat-label">الذروة</span>
                        </div>
                        <div class="mini-stat">
                            <span class="mini-stat-value">${activityRate}%</span>
                            <span class="mini-stat-label">النشاط</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <span class="peak-badge">📈 ${maxDateText}</span>
                    </div>
                </div>
            `;
        }).join('');

        cardsEl.innerHTML = cardsMarkup;
    };

    statusMessage('... جاري تحميل البيانات ...');

    Promise.all(METRICS.map((metric) => fetchMetric(metric)))
        .then((results) => renderDashboard(results))
        .catch((error) => {
            console.error('Performance dashboard error:', error);
            statusMessage(error.message || 'حدث خطأ غير متوقع', true);
        });
})();
