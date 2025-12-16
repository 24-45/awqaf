document.addEventListener('DOMContentLoaded', () => {
    const chartCanvas = document.getElementById('news-mentions-trend');

    if (!chartCanvas) {
        return;
    }

    chartCanvas.height = 320;
    chartCanvas.style.height = '320px';
    chartCanvas.style.maxHeight = '320px';
    chartCanvas.style.width = '100%';

    const locales = 'en-US';
    const monthFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { month: 'short' });

    const formatNumber = (value) => {
        return value.toLocaleString(locales);
    };

    const formatMetric = (value) => {
        if (value >= 1000) {
            const rounded = (value / 1000).toFixed(2);
            return `${rounded.replace('.', ',')} ألف`;
        }
        return formatNumber(value);
    };

    const formatDay = (isoDate) => {
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        const date = new Date(isoDate);
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    // Create modal for peak details
    const createPeakModal = () => {
        const modal = document.createElement('div');
        modal.id = 'peak-detail-modal';
        modal.className = 'peak-modal-overlay';
        modal.innerHTML = `
            <div class="peak-modal-content">
                <button class="peak-modal-close" aria-label="إغلاق">&times;</button>
                <div class="peak-modal-header">
                    <span class="peak-modal-icon">📰</span>
                    <h3 class="peak-modal-title"></h3>
                </div>
                <div class="peak-modal-date"></div>
                <div class="peak-modal-count"></div>
                <p class="peak-modal-description"></p>
            </div>
        `;
        document.body.appendChild(modal);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        // Close button
        modal.querySelector('.peak-modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        });

        return modal;
    };

    const peakModal = createPeakModal();

    const showPeakModal = (peak) => {
        peakModal.querySelector('.peak-modal-title').textContent = peak.title;
        peakModal.querySelector('.peak-modal-date').textContent = `📅 ${peak.label}`;
        peakModal.querySelector('.peak-modal-count').textContent = `📊 ${formatNumber(peak.count)} خبر مُنشور`;
        peakModal.querySelector('.peak-modal-description').textContent = peak.description;
        peakModal.classList.add('active');
    };

    // Helper function to get base path for GitHub Pages
    const getBasePath = () => window.location.hostname.includes('github.io') ? '/awqaf' : '';

    // Function to parse CSV and create payload structure
    const parseCSVToPayload = (csvText) => {
        const lines = csvText.trim().split('\n');
        const series = [];
        let maxCount = 0;
        let maxDate = '';
        let totalCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 2) {
                const dateStr = parts[0].replace(/"/g, '').split(' ')[0];
                const count = parseInt(parts[1]) || 0;
                series.push({ date: dateStr, count });
                totalCount += count;
                if (count > maxCount) {
                    maxCount = count;
                    maxDate = dateStr;
                }
            }
        }

        // Find top peaks (top 3 days with highest counts) with event descriptions
        const peakEventsMap = {
            '2025-01-23': { title: 'مؤتمر ليب 2025', description: 'إطلاق منصة "أوقاف للخدمات الرقمية" خلال مؤتمر ليب 2025' },
            '2025-08-12': { title: 'استقبال أمير الشرقية', description: 'استقبال أمير المنطقة الشرقية لمنسوبي هيئة الأوقاف والإشادة بدعم القيادة' },
            '2025-08-11': { title: 'التقرير السنوي', description: 'إصدار التقرير السنوي للهيئة ومبادرة TEDxKAU بمشاركة مجتمعية فاعلة' },
            '2024-12-25': { title: 'الخدمات الرقمية', description: 'إتاحة خدمات الهيئة الرقمية عبر تطبيق توكلنا' },
            '2024-12-30': { title: 'مذكرة تفاهم', description: 'توقيع مذكرة تفاهم مع وزارة الثقافة لتعزيز التعاون في المجالات المشتركة' },
            '2025-10-18': { title: 'لائحة إنشاء الأوقاف', description: 'إصدار لائحة تنظيم إنشاء الأوقاف وجمع التبرعات بآليات شفافة' },
            '2025-02-06': { title: 'جدول المخالفات', description: 'إعلان جدول المخالفات والجزاءات للائحة تنظيم أعمال النظارة' },
            '2025-04-22': { title: 'مبادئ حوكمة الأوقاف', description: 'نشر مسودة مبادئ حوكمة الأوقاف والشفافية والمساءلة' }
        };
        
        const sortedByCount = [...series].sort((a, b) => b.count - a.count);
        const topPeaks = sortedByCount.slice(0, 3).map(item => {
            const eventInfo = peakEventsMap[item.date] || { 
                title: 'ذروة النشر', 
                description: `تم نشر ${item.count} خبر في هذا اليوم` 
            };
            return {
                date: item.date,
                label: formatDay(item.date),
                count: item.count,
                title: eventInfo.title,
                description: eventInfo.description
            };
        });

        // Calculate coverage days and zero days
        const coverageDays = series.filter(item => item.count > 0).length;
        const zeroDays = series.filter(item => item.count === 0).length;
        const highIntensityDays = series.filter(item => item.count >= 15).length;

        return {
            series,
            summary: { 
                total_mentions: totalCount, 
                daily_average: (totalCount / series.length).toFixed(1), 
                peak: maxCount,
                coverage_days: coverageDays,
                zero_days: zeroDays,
                high_intensity_days: highIntensityDays
            },
            top_peaks: topPeaks,
            top_months: [],
            top_topics: [],
            top_newspapers: []
        };
    };

    // Try API first, fallback to CSV
    const loadData = async () => {
        try {
            const response = await fetch('/api/news-mentions');
            if (!response.ok) throw new Error('API not available');
            return await response.json();
        } catch (e) {
            // Fallback to CSV - try multiple paths
            const basePath = getBasePath();
            const paths = [
                basePath + '/static/data/mentions_trend.csv',
                './static/data/mentions_trend.csv',
                'static/data/mentions_trend.csv'
            ];
            
            for (const path of paths) {
                try {
                    const csvResponse = await fetch(path);
                    if (csvResponse.ok) {
                        const csvText = await csvResponse.text();
                        return parseCSVToPayload(csvText);
                    }
                } catch (err) {
                    console.log('Failed to load from:', path);
                }
            }
            throw new Error('تعذر تحميل بيانات النشر الصحفي');
        }
    };

    loadData()
        .then((payload) => {
            const {
                series,
                summary,
                top_peaks: topPeaks,
                top_months: topMonths,
                top_topics: topTopics = [],
                top_newspapers: topNewspapers = [],
            } = payload;
            const peakDetails = new Map(
                topPeaks.flatMap((peak) => [
                    [peak.date, peak],
                    [peak.label, peak],
                ])
            );

            const peakIndexDetails = [];
            const highlightedIndices = new Set();

            const labels = series.map((item) => item.date);
            const counts = series.map((item) => item.count);

            topPeaks.forEach((peak) => {
                const index = labels.indexOf(peak.date);
                if (index !== -1) {
                    highlightedIndices.add(index);
                    peakIndexDetails.push({
                        index,
                        title: peak.title,
                        dateLabel: peak.label,
                    });
                }
            });

            // Store label bounding boxes for click detection
            const labelBoundingBoxes = [];

            const peakLabelsPlugin = {
                id: 'peakLabels',
                afterDatasetsDraw(chart, args, pluginOptions) {
                    const meta = chart.getDatasetMeta(0);
                    const { ctx, chartArea } = chart;
                    const { labels: labelConfigs = [] } = pluginOptions || {};

                    // Clear previous bounding boxes
                    labelBoundingBoxes.length = 0;

                    // Track occupied regions to avoid overlap
                    const occupiedRegions = [];

                    // Sort labels by x position to process left-to-right
                    const sortedConfigs = [...labelConfigs].sort((a, b) => {
                        const elA = meta.data[a.index];
                        const elB = meta.data[b.index];
                        if (!elA || !elB) return 0;
                        return elA.x - elB.x;
                    });

                    sortedConfigs.forEach((config, configIndex) => {
                        const element = meta.data[config.index];
                        if (!element) {
                            return;
                        }

                        const { x, y } = element.getProps(['x', 'y'], true);
                        const title = config.title || '';
                        if (!title) {
                            return;
                        }

                        ctx.save();
                        ctx.font = '600 12px "Tajawal", sans-serif';
                        const paddingX = 8;
                        const paddingY = 5;
                        const textWidth = ctx.measureText(title).width;
                        const boxWidth = textWidth + paddingX * 2;
                        const boxHeight = 26;

                        let boxX = x - boxWidth / 2;
                        let boxY = y - 38;

                        // Constrain horizontally
                        if (boxX < chartArea.left + 4) {
                            boxX = chartArea.left + 4;
                        } else if (boxX + boxWidth > chartArea.right - 4) {
                            boxX = chartArea.right - boxWidth - 4;
                        }

                        // Check for overlap with existing labels and offset vertically
                        let verticalOffset = 0;
                        let attempts = 0;
                        const maxAttempts = 5;

                        while (attempts < maxAttempts) {
                            const testY = boxY - verticalOffset;
                            let hasOverlap = false;

                            for (const region of occupiedRegions) {
                                const horizontalOverlap = !(boxX + boxWidth < region.x - 5 || boxX > region.x + region.width + 5);
                                const verticalOverlap = !(testY + boxHeight < region.y - 3 || testY > region.y + region.height + 3);

                                if (horizontalOverlap && verticalOverlap) {
                                    hasOverlap = true;
                                    break;
                                }
                            }

                            if (!hasOverlap) {
                                boxY = testY;
                                break;
                            }

                            verticalOffset += boxHeight + 6;
                            attempts++;
                        }

                        // If still at top boundary, push down
                        if (boxY < chartArea.top + 4) {
                            boxY = y + 12;
                        }

                        // Record this region as occupied
                        occupiedRegions.push({
                            x: boxX,
                            y: boxY,
                            width: boxWidth,
                            height: boxHeight,
                        });

                        const radius = 8;

                        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
                        ctx.strokeStyle = '#006C35';
                        ctx.lineWidth = 1;

                        ctx.beginPath();
                        ctx.moveTo(boxX + radius, boxY);
                        ctx.lineTo(boxX + boxWidth - radius, boxY);
                        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
                        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
                        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
                        ctx.lineTo(boxX + radius, boxY + boxHeight);
                        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
                        ctx.lineTo(boxX, boxY + radius);
                        ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
                        ctx.closePath();

                        ctx.fill();
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        const tailY = boxY > y ? boxY : boxY + boxHeight;
                        ctx.lineTo(x, tailY);
                        ctx.strokeStyle = 'rgba(0, 108, 53, 0.6)';
                        ctx.lineWidth = 1;
                        ctx.stroke();

                        ctx.fillStyle = '#004429';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(title, boxX + boxWidth / 2, boxY + boxHeight / 2);
                        ctx.restore();

                        // Store bounding box for click detection
                        labelBoundingBoxes.push({
                            x: boxX,
                            y: boxY,
                            width: boxWidth,
                            height: boxHeight,
                            index: config.index,
                            title: config.title,
                            dateLabel: config.dateLabel,
                        });
                    });
                },
            };

            // Crosshair plugin for vertical tracking line
            const crosshairPlugin = {
                id: 'crosshair',
                afterDraw(chart) {
                    if (chart.tooltip._active && chart.tooltip._active.length) {
                        const activePoint = chart.tooltip._active[0];
                        const { ctx, chartArea } = chart;
                        const x = activePoint.element.x;

                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x, chartArea.top);
                        ctx.lineTo(x, chartArea.bottom);
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = 'rgba(0, 108, 53, 0.3)';
                        ctx.setLineDash([4, 4]);
                        ctx.stroke();
                        ctx.restore();
                    }
                },
            };


            const gradient = chartCanvas.getContext('2d').createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(0, 80, 47, 0.25)');
            gradient.addColorStop(1, 'rgba(0, 80, 47, 0.02)');

            new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            data: counts,
                            borderColor: '#006C35',
                            borderWidth: 3,
                            pointRadius: (ctx) => (highlightedIndices.has(ctx.dataIndex) ? 6 : 0),
                            pointHoverRadius: (ctx) => (highlightedIndices.has(ctx.dataIndex) ? 9 : 6),
                            pointBackgroundColor: (ctx) => (highlightedIndices.has(ctx.dataIndex) ? '#ffffff' : '#006C35'),
                            pointBorderColor: (ctx) => (highlightedIndices.has(ctx.dataIndex) ? '#006C35' : '#006C35'),
                            pointBorderWidth: (ctx) => (highlightedIndices.has(ctx.dataIndex) ? 3 : 0),
                            tension: 0.35,
                            fill: {
                                target: 'origin',
                                above: gradient,
                            },
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        peakLabels: {
                            labels: peakIndexDetails,
                        },
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            rtl: true,
                            backgroundColor: '#ffffff',
                            titleColor: '#333333',
                            bodyColor: '#006C35',
                            titleFont: { family: 'Tajawal', weight: '600', size: 14 },
                            bodyFont: { family: 'Tajawal', weight: '500', size: 13 },
                            borderColor: 'rgba(0,108,53,0.2)',
                            borderWidth: 1,
                            padding: 14,
                            cornerRadius: 10,
                            displayColors: false,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            caretSize: 8,
                            caretPadding: 10,
                            callbacks: {
                                title: (items) => {
                                    if (!items.length) return '';
                                    const isoDate = labels[items[0].dataIndex];
                                    return `📅 ${formatDay(isoDate)}`;
                                },
                                label: (item) => {
                                    const lines = [`📰 عدد الأخبار: ${formatNumber(item.parsed.y)}`];
                                    return lines;
                                },
                                afterBody: (items) => {
                                    if (!items.length) return [];
                                    const isoDate = labels[items[0].dataIndex];
                                    const details = peakDetails.get(isoDate);
                                    if (details) {
                                        return [
                                            '',
                                            `🏷️ ${details.title}`,
                                            `(اضغط على العنوان للمزيد)`,
                                        ];
                                    }
                                    return [];
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 8,
                                color: '#6b746b',
                                font: {
                                    family: 'Tajawal',
                                    size: 11,
                                },
                                callback: (value, index, ticks) => {
                                    const date = new Date(labels[index]);
                                    const month = monthFormatter.format(date);
                                    const year = date.getFullYear();
                                    if (index === 0 || index === ticks.length - 1) {
                                        return `${month} ${year}`;
                                    }
                                    return month;
                                },
                            },
                            grid: { display: false },
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#6b746b',
                                font: {
                                    family: 'Tajawal',
                                    size: 11,
                                },
                                callback: (value) => formatNumber(value),
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.06)',
                                drawTicks: false,
                            },
                        },
                    },
                },
                plugins: [peakLabelsPlugin, crosshairPlugin],
            });

            // Click handler for peak labels
            chartCanvas.addEventListener('click', (event) => {
                const rect = chartCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                for (const box of labelBoundingBoxes) {
                    if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
                        const peak = peakDetails.get(labels[box.index]);
                        if (peak) {
                            showPeakModal(peak);
                        }
                        break;
                    }
                }
            });

            // Change cursor on hover over labels
            chartCanvas.addEventListener('mousemove', (event) => {
                const rect = chartCanvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                let isOverLabel = false;
                for (const box of labelBoundingBoxes) {
                    if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
                        isOverLabel = true;
                        break;
                    }
                }
                chartCanvas.style.cursor = isOverLabel ? 'pointer' : 'default';
            });

            const totalElement = document.getElementById('news-total-mentions');
            const dailyAvgElement = document.getElementById('news-daily-average');
            const coverageElement = document.getElementById('news-coverage-days');
            const intensityElement = document.getElementById('news-high-intensity');
            const chartTotalElement = document.getElementById('chart-total-news');

            // Update chart legend total
            if (chartTotalElement) {
                const totalK = (summary.total_mentions / 1000).toFixed(2);
                chartTotalElement.textContent = `${totalK}k`;
            }

            if (totalElement) {
                totalElement.textContent = formatMetric(summary.total_mentions);
                const totalFootnote = totalElement.nextElementSibling;
                if (totalFootnote) {
                    totalFootnote.textContent = `خلال ${formatNumber(series.length)} يوماً من الرصد`;
                }
            }

            if (dailyAvgElement) {
                dailyAvgElement.textContent = Number(summary.daily_average).toFixed(1).replace('.', ',');
            }

            if (coverageElement) {
                coverageElement.textContent = summary.coverage_days;
                const coverageFootnote = coverageElement.nextElementSibling;
                if (coverageFootnote) {
                    coverageFootnote.textContent = `مقابل ${summary.zero_days} يوم صامت`; 
                }
            }

            if (intensityElement) {
                intensityElement.textContent = summary.high_intensity_days;
                const intensityFootnote = intensityElement.nextElementSibling;
                if (intensityFootnote) {
                    intensityFootnote.textContent = `(+15 خبر) سجلت خلال ${summary.high_intensity_days} يوماً`;
                }
            }

            const peaksList = document.getElementById('news-top-peaks');
            if (peaksList) {
                peaksList.innerHTML = '';
                topPeaks.forEach((peak) => {
                    const item = document.createElement('div');
                    item.className = 'peak-item';

                    const header = document.createElement('div');
                    header.className = 'peak-item-header';

                    const dateBadge = document.createElement('span');
                    dateBadge.className = 'peak-date-badge';
                    dateBadge.textContent = peak.label;

                    const countBadge = document.createElement('span');
                    countBadge.className = 'peak-count-badge';
                    countBadge.textContent = `${peak.count} خبر`;

                    header.appendChild(dateBadge);
                    header.appendChild(countBadge);

                    const titleDiv = document.createElement('div');
                    titleDiv.className = 'peak-item-title';
                    titleDiv.textContent = peak.title;

                    const descP = document.createElement('p');
                    descP.className = 'peak-item-desc';
                    descP.textContent = peak.description;

                    item.appendChild(header);
                    item.appendChild(titleDiv);
                    item.appendChild(descP);
                    peaksList.appendChild(item);
                });
            }

            const monthlyContainer = document.getElementById('news-monthly-table');
            if (monthlyContainer) {
                monthlyContainer.innerHTML = '';
                const maxCount = topMonths.length > 0 ? topMonths[0].count : 1;

                topMonths.forEach((month, index) => {
                    const barItem = document.createElement('div');
                    barItem.className = 'monthly-bar-item';

                    const rank = document.createElement('span');
                    rank.className = 'monthly-rank';
                    rank.textContent = index + 1;

                    const label = document.createElement('span');
                    label.className = 'monthly-label';
                    label.textContent = month.label;

                    const barWrapper = document.createElement('div');
                    barWrapper.className = 'monthly-bar-wrapper';

                    const bar = document.createElement('div');
                    bar.className = 'monthly-bar';
                    const percentage = (month.count / maxCount) * 100;
                    bar.style.width = `${percentage}%`;

                    const value = document.createElement('span');
                    value.className = 'monthly-bar-value';
                    value.textContent = `${month.count} خبر`;

                    bar.appendChild(value);
                    barWrapper.appendChild(bar);

                    barItem.appendChild(rank);
                    barItem.appendChild(label);
                    barItem.appendChild(barWrapper);
                    monthlyContainer.appendChild(barItem);
                });
            }

            const topicsContainer = document.getElementById('news-top-topics');
            if (topicsContainer) {
                topicsContainer.innerHTML = '';

                if (!topTopics.length) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'topics-empty';
                    emptyState.textContent = 'لا تتوفر بيانات للموضوعات المتداولة حالياً.';
                    topicsContainer.appendChild(emptyState);
                } else {
                    const maxTopicCount = topTopics[0]?.count || 1;

                    topTopics.forEach((topic, index) => {
                        const item = document.createElement('div');
                        item.className = 'topic-item';

                        const rankBadge = document.createElement('span');
                        rankBadge.className = 'topic-rank';
                        rankBadge.textContent = index + 1;

                        const contentWrapper = document.createElement('div');
                        contentWrapper.className = 'topic-content';

                        const title = document.createElement('div');
                        title.className = 'topic-title';
                        title.textContent = topic.label;

                        const metaRow = document.createElement('div');
                        metaRow.className = 'topic-meta-row';

                        const barWrapper = document.createElement('div');
                        barWrapper.className = 'topic-bar-wrapper';

                        const bar = document.createElement('div');
                        bar.className = 'topic-bar';
                        const widthPercent = (topic.count / maxTopicCount) * 100;
                        bar.style.width = `${widthPercent}%`;

                        const percentage = document.createElement('span');
                        percentage.className = 'topic-percentage';
                        percentage.textContent = `${Number(topic.percentage).toFixed(1).replace('.', ',')}٪`;

                        const countTag = document.createElement('span');
                        countTag.className = 'topic-count-tag';
                        countTag.textContent = `${topic.count} خبر`;

                        barWrapper.appendChild(bar);
                        metaRow.appendChild(barWrapper);
                        metaRow.appendChild(percentage);

                        contentWrapper.appendChild(title);
                        contentWrapper.appendChild(metaRow);
                        contentWrapper.appendChild(countTag);

                        item.appendChild(rankBadge);
                        item.appendChild(contentWrapper);

                        topicsContainer.appendChild(item);
                    });
                }
            }

            const newspapersContainer = document.getElementById('news-top-newspapers');
            if (newspapersContainer) {
                newspapersContainer.innerHTML = '';

                if (!topNewspapers.length) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'press-empty-state';
                    emptyState.textContent = 'لا تتوفر بيانات كافية لعرض أبرز الصحف حالياً.';
                    newspapersContainer.appendChild(emptyState);
                } else {
                    // Compute max reach for relative scaling
                    const maxReach = Math.max(...topNewspapers.map((o) => Number(o.total_reach) || 0), 1);

                    topNewspapers.forEach((outlet, index) => {
                        const card = document.createElement('div');
                        card.className = 'press-leader-card';

                        // --- Header with rank, logo, name ---
                        const header = document.createElement('div');
                        header.className = 'press-leader-header';

                        const rankBadge = document.createElement('span');
                        rankBadge.className = 'press-rank-badge';
                        rankBadge.textContent = index + 1;

                        const logoWrapper = document.createElement('div');
                        logoWrapper.className = 'press-logo-wrapper';

                        const logoImg = document.createElement('img');
                        logoImg.className = 'press-logo';
                        logoImg.alt = outlet.name || 'شعار الصحيفة';
                        logoImg.loading = 'lazy';
                        logoImg.src = outlet.logo_url || '/static/images/icon.png';
                        logoImg.addEventListener('error', () => {
                            logoImg.src = '/static/images/icon.png';
                            logoImg.classList.add('press-logo-placeholder');
                        });
                        logoWrapper.appendChild(logoImg);

                        const headerText = document.createElement('div');
                        headerText.className = 'press-header-text';

                        const nameEl = document.createElement('span');
                        nameEl.className = 'press-source-name';
                        nameEl.textContent = outlet.name || 'مصدر صحفي';

                        const domainEl = document.createElement('span');
                        domainEl.className = 'press-source-domain';
                        domainEl.textContent = outlet.domain || '—';

                        headerText.appendChild(nameEl);
                        headerText.appendChild(domainEl);

                        header.appendChild(rankBadge);
                        header.appendChild(logoWrapper);
                        header.appendChild(headerText);

                        // --- Stats row with circular indicators ---
                        const statsRow = document.createElement('div');
                        statsRow.className = 'press-stats-row';

                        const reachPercent = Math.min(100, Math.round(((Number(outlet.total_reach) || 0) / maxReach) * 100));
                        const reachStat = document.createElement('div');
                        reachStat.className = 'press-stat-item';
                        reachStat.innerHTML = `
                            <div class="press-stat-ring" style="--progress: ${reachPercent}">
                                <span class="press-stat-value">${formatMetric(Number(outlet.total_reach) || 0)}</span>
                            </div>
                            <span class="press-stat-label">الوصول</span>
                        `;

                        const mentionsStat = document.createElement('div');
                        mentionsStat.className = 'press-stat-item';
                        mentionsStat.innerHTML = `
                            <div class="press-stat-box">
                                <span class="press-stat-big">${formatNumber(Number(outlet.mentions) || 0)}</span>
                                <span class="press-stat-unit">خبر</span>
                            </div>
                            <span class="press-stat-label">المواد</span>
                        `;

                        const dateStat = document.createElement('div');
                        dateStat.className = 'press-stat-item';
                        dateStat.innerHTML = `
                            <div class="press-stat-box press-stat-date">
                                <span class="press-stat-day">${outlet.latest_date ? new Date(outlet.latest_date).getDate() : '—'}</span>
                                <span class="press-stat-month">${outlet.latest_date ? new Intl.DateTimeFormat('ar-EG-u-nu-latn', { month: 'short' }).format(new Date(outlet.latest_date)) : ''}</span>
                            </div>
                            <span class="press-stat-label">آخر نشر</span>
                        `;

                        statsRow.appendChild(reachStat);
                        statsRow.appendChild(mentionsStat);
                        statsRow.appendChild(dateStat);

                        // --- Topics with progress bars ---
                        const topicsSection = document.createElement('div');
                        topicsSection.className = 'press-topics-section';

                        const topicsTitle = document.createElement('div');
                        topicsTitle.className = 'press-topics-title';
                        topicsTitle.textContent = 'أبرز الموضوعات';
                        topicsSection.appendChild(topicsTitle);

                        const topics = Array.isArray(outlet.top_topics)
                            ? outlet.top_topics
                            : [];

                        if (!topics.length) {
                            const topicsEmpty = document.createElement('div');
                            topicsEmpty.className = 'press-topics-empty';
                            topicsEmpty.textContent = 'لا تتوفر موضوعات بارزة لهذا المصدر.';
                            topicsSection.appendChild(topicsEmpty);
                        } else {
                            const topicsList = document.createElement('div');
                            topicsList.className = 'press-topics-bars';

                            topics.forEach((topic, ti) => {
                                const topicRow = document.createElement('div');
                                topicRow.className = 'press-topic-row';

                                const topicLabel = document.createElement('span');
                                topicLabel.className = 'press-topic-label';
                                topicLabel.textContent = topic.label;

                                const barWrapper = document.createElement('div');
                                barWrapper.className = 'press-topic-bar-wrapper';

                                const bar = document.createElement('div');
                                bar.className = 'press-topic-bar';
                                const percentValue = Number(topic.percentage) || 0;
                                bar.style.width = `${Math.min(100, percentValue * 2)}%`;
                                bar.style.setProperty('--bar-color', ti === 0 ? 'var(--digital-gold)' : ti === 1 ? 'var(--digital-green)' : '#6b9080');

                                const percentSpan = document.createElement('span');
                                percentSpan.className = 'press-topic-percent';
                                percentSpan.textContent = `${percentValue.toFixed(1).replace('.', ',')}٪`;

                                barWrapper.appendChild(bar);
                                topicRow.appendChild(topicLabel);
                                topicRow.appendChild(barWrapper);
                                topicRow.appendChild(percentSpan);
                                topicsList.appendChild(topicRow);
                            });

                            topicsSection.appendChild(topicsList);
                        }

                        card.appendChild(header);
                        card.appendChild(statsRow);
                        card.appendChild(topicsSection);

                        newspapersContainer.appendChild(card);
                    });
                }
            }

            const zeroFootnote = document.getElementById('news-zero-streak');
            if (zeroFootnote) {
                zeroFootnote.textContent = `أطول فترة صمت إعلامي امتدت ${summary.longest_zero_streak} يوماً متتالياً دون أي ذكر صحفي`;
            }

            const insightsContainer = document.getElementById('news-key-insights');
            if (insightsContainer) {
                const insights = [
                    `<strong>حجم التغطية:</strong> أظهرت البيانات تدفقاً إخبارياً غزيراً ومستمراً، حيث تتصدر صحف (سبق، عكاظ، الرياض، المدينة، الاقتصادية) المشهد. المعدل اليومي للنشر مرتفع (${Number(summary.daily_average).toFixed(1).replace('.', ',')} خبر/يوم)، مما يعكس نشاطاً عالياً للمركز الإعلامي للهيئة.`,
                    `<strong>النبرة الإيجابية:</strong> سادت في أخبار التدشين، الجوائز (مثل جائزة مكة للتميز)، والأرقام المالية الكبيرة (استعادة مليار ريال، نمو الأصول). الصحافة تحتفي بلغة "الإنجاز الوطني".`,
                    `<strong>النبرة الحيادية:</strong> وهي السمة الغالبة على معظم الأخبار، حيث تكتفي الصحف بنقل البيانات الرسمية (Press Releases) كما وردت من "واس" دون إضافة تحليلية أو نقدية.`,
                    `<strong>غياب النبرة التحليلية:</strong> يفتقر المشهد إلى مقالات الرأي العميقة أو التحقيقات التي تناقش "مستقبل الوقف" أو "تحديات النظار" بعمق، مما يجعل التغطية سطحية رغم كثافتها.`
                ];

                insightsContainer.innerHTML = '';
                insights.forEach((text) => {
                    const item = document.createElement('li');
                    item.innerHTML = text;
                    insightsContainer.appendChild(item);
                });
            }
        })
        .catch((error) => {
            console.error(error);
            const insightsContainer = document.getElementById('news-key-insights');
            if (insightsContainer) {
                insightsContainer.innerHTML = '';
                const item = document.createElement('li');
                item.textContent = 'تعذر تحميل بيانات النشر الصحفي. الرجاء المحاولة لاحقاً.';
                insightsContainer.appendChild(item);
            }
        });
});
