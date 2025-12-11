/**
 * Post Types Analysis for Media Performance Report
 * تحليل أنواع المنشورات لتقرير الأداء الإعلامي
 */

(function() {
    'use strict';

    // Helper function to get base path for GitHub Pages
    const getBasePath = () => window.location.hostname.includes('github.io') ? '/awqaf' : '';

    // Store chart reference and data globally for interactivity
    let chartInstance = null;
    let chartData = null;
    let chartTotals = null;
    let activeFilter = null;

    // Load and parse the Post Type Trend CSV data
    async function loadPostTypesData() {
        try {
            console.log('Loading post types data...');
            const response = await fetch(getBasePath() + '/static/data/post_type_trend.csv');
            console.log('Response status:', response.status);
            const csvText = await response.text();
            console.log('CSV text length:', csvText.length);
            console.log('CSV first 200 chars:', csvText.substring(0, 200));
            return parsePostTypeTrendCSV(csvText);
        } catch (error) {
            console.error('Error loading post types data:', error);
            return null;
        }
    }

    // Parse the special format of Post Type Trend CSV
    function parsePostTypeTrendCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const data = {
            all: [],
            reposts: [],
            original: [],
            quotes: [],
            replies: []
        };
        
        let currentType = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and headers
            if (!line || line === 'Mention Type Trend' || line === 'Date,Count') continue;
            
            // Check for section headers
            if (line === 'All') {
                currentType = 'all';
                continue;
            } else if (line === 'Reposts') {
                currentType = 'reposts';
                continue;
            } else if (line === 'Original Posts') {
                currentType = 'original';
                continue;
            } else if (line === 'Quote Posts') {
                currentType = 'quotes';
                continue;
            } else if (line === 'Replies') {
                currentType = 'replies';
                continue;
            }
            
            // Parse data lines - handle trailing comma
            if (currentType && line.startsWith('"')) {
                const match = line.match(/"([^"]+)",(\d+),?/);
                if (match) {
                    const dateStr = match[1].split(' ')[0]; // Extract date part only
                    const count = parseInt(match[2], 10);
                    data[currentType].push({ date: dateStr, count: count });
                    console.log(`Parsed ${currentType}: ${dateStr} = ${count}`);
                }
            }
        }
        
        return data;
    }

    // Calculate totals from parsed data
    function calculateTotals(data) {
        const totals = {
            all: 0,
            original: 0,
            repost: 0,
            quote: 0,
            reply: 0
        };
        
        if (data.all) totals.all = data.all.reduce((sum, d) => sum + d.count, 0);
        if (data.original) totals.original = data.original.reduce((sum, d) => sum + d.count, 0);
        if (data.reposts) totals.repost = data.reposts.reduce((sum, d) => sum + d.count, 0);
        if (data.quotes) totals.quote = data.quotes.reduce((sum, d) => sum + d.count, 0);
        if (data.replies) totals.reply = data.replies.reduce((sum, d) => sum + d.count, 0);
        
        totals.total = totals.original + totals.repost + totals.quote + totals.reply;
        
        return totals;
    }

    // Format number with English numerals and commas
    function formatNumber(num) {
        return num.toLocaleString('en-US');
    }

    // Update UI with totals
    function updateTotalsUI(totals) {
        const total = totals.all || totals.total || 1;

        // Update total count first
        const totalEl = document.getElementById('total-posts-count');
        if (totalEl) totalEl.textContent = formatNumber(totals.all || totals.total);

        // Update values with English numerals
        const elements = {
            'original-posts-count': totals.original,
            'reposts-count': totals.repost,
            'quotes-count': totals.quote,
            'replies-count': totals.reply
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = formatNumber(value);
        });

        // Update progress bars with animation
        setTimeout(() => {
            const bars = {
                'original-posts-bar': totals.original,
                'reposts-bar': totals.repost,
                'quotes-bar': totals.quote,
                'replies-bar': totals.reply
            };

            Object.entries(bars).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.style.width = `${(value / total) * 100}%`;
            });
        }, 300);
    }

    // Setup interactive card click handlers
    function setupCardInteractivity() {
        const cardTypeMap = {
            'original': 0,
            'repost': 1,
            'quote': 2,
            'reply': 3
        };

        document.querySelectorAll('.post-type-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', function() {
                const cardType = this.classList.contains('original') ? 'original' :
                                 this.classList.contains('repost') ? 'repost' :
                                 this.classList.contains('quote') ? 'quote' : 'reply';
                
                const traceIndex = cardTypeMap[cardType];
                
                // Toggle active state
                if (activeFilter === cardType) {
                    // Reset to show all
                    activeFilter = null;
                    document.querySelectorAll('.post-type-card').forEach(c => {
                        c.classList.remove('card-dimmed');
                        c.classList.remove('card-active');
                    });
                    // Show all traces
                    const chartContainer = document.getElementById('post-types-daily-chart');
                    if (chartContainer) {
                        Plotly.restyle(chartContainer, {'visible': true}, [0, 1, 2, 3]);
                    }
                } else {
                    // Filter to show only selected type
                    activeFilter = cardType;
                    document.querySelectorAll('.post-type-card').forEach(c => {
                        c.classList.add('card-dimmed');
                        c.classList.remove('card-active');
                    });
                    this.classList.remove('card-dimmed');
                    this.classList.add('card-active');
                    
                    // Update chart to highlight selected trace
                    const chartContainer = document.getElementById('post-types-daily-chart');
                    if (chartContainer) {
                        const visibility = [0, 1, 2, 3].map(i => i === traceIndex);
                        Plotly.restyle(chartContainer, {'visible': visibility.map(v => v ? true : 'legendonly')});
                    }
                }
            });
        });
    }

    // Create daily stacked bar chart using Plotly
    function createDailyChart(data) {
        const chartContainer = document.getElementById('post-types-daily-chart');
        if (!chartContainer) return;

        const MIN_CHART_HEIGHT = 520;
        const ensureChartDimensions = () => {
            const computedStyle = window.getComputedStyle(chartContainer);
            const parsedHeight = parseInt(computedStyle.height, 10);
            const currentHeight = chartContainer.clientHeight || (Number.isNaN(parsedHeight) ? 0 : parsedHeight);

            chartContainer.style.minHeight = `${MIN_CHART_HEIGHT}px`;
            if (!currentHeight || currentHeight < MIN_CHART_HEIGHT) {
                chartContainer.style.height = `${MIN_CHART_HEIGHT}px`;
            } else {
                chartContainer.style.height = 'auto';
            }

            if (!chartContainer.style.width) {
                chartContainer.style.width = '100%';
            }
        };

        ensureChartDimensions();

        // Get all unique dates from ALL data and sort them
        const allDates = new Set();
        ['all', 'original', 'reposts', 'quotes', 'replies'].forEach(type => {
            if (data[type]) {
                data[type].forEach(d => allDates.add(d.date));
            }
        });
        const dates = Array.from(allDates).sort();

        // Create lookup maps for each type
        const createLookup = (arr) => {
            const map = {};
            if (arr) arr.forEach(d => map[d.date] = d.count);
            return map;
        };

        const allMap = createLookup(data.all);
        const originalMap = createLookup(data.original);
        const repostsMap = createLookup(data.reposts);
        const quotesMap = createLookup(data.quotes);
        const repliesMap = createLookup(data.replies);

        // Calculate total values for each date
        const totalValues = dates.map(d => allMap[d] || 0);
        
        // Peak topics mapping based on date analysis
        const peakEvents = [
            {
                date: '2025-02-10',
                label: 'منصة أوقاف - تكريم الشركاء',
                detail: '10 فبراير 2025: الترويج لخدمات "منصة أوقاف" وتكريم الشركاء التنمويين.',
                ay: -45
            },
            {
                date: '2025-02-19',
                label: 'ملتقى نمو للاستدامة المالية',
                detail: '19 فبراير 2025: تنظيم "ملتقى نمو" لتعزيز الاستدامة المالية في القطاع الوقفي.',
                ay: -60
            },
            {
                date: '2025-03-06',
                label: 'شراكة متحف القرآن الكريم',
                detail: '6 مارس 2025: الشراكة الاستراتيجية في افتتاح "متحف القرآن الكريم" بمكة المكرمة.',
                ay: -45
            },
            {
                date: '2025-03-10',
                label: 'إطلاق حملة #لكل_وقف_وواقف',
                detail: '10 مارس 2025: إطلاق حملة "#لكل_وقف_وواقف" عبر منصة أوقاف الرقمية.',
                ay: -70
            },
            {
                date: '2025-06-06',
                label: 'حملة جمعية رافد',
                detail: '6 يونيو 2025: حملة ترويجية ومسابقات مع جمعية رافد للأوقاف لدعم المشاركة المجتمعية.',
                ay: -35
            },
            {
                date: '2025-07-15',
                label: 'حملة #أوقفها_للأبد',
                detail: '15 يوليو 2025: إطلاق حملة "#أوقفها_للأبد_تتحرك_للأبد" لتعزيز مفهوم الاستدامة الوقفية.',
                ay: -55
            },
            {
                date: '2025-09-24',
                label: 'مسابقة أوقاف وطن',
                detail: '24 سبتمبر 2025: مسابقة أوقاف وطن مع جمعية رافد للأوقاف ضمن احتفالات اليوم الوطني.',
                ay: -75
            },
            {
                date: '2025-10-18',
                label: 'لائحة إنشاء الأوقاف',
                detail: '18 أكتوبر 2025: إصدار لائحة إنشاء الأوقاف وتمويلها عبر جمع التبرعات.',
                ay: -50
            },
            {
                date: '2025-10-22',
                label: 'جائزة وقفية عالمية',
                detail: '22 أكتوبر 2025: دخول الهيئة موسوعة "غينيس" لأكبر جائزة وقفية عالمية.',
                ay: -70
            },
            {
                date: '2025-10-30',
                label: 'الندوة الفقهية الوقفية',
                detail: '30 أكتوبر 2025: تنظيم الندوة الفقهية الوقفية الثانية لمناقشة التشريعات الحديثة.',
                ay: -55
            }
        ];

        // Find peaks - use predefined events directly
        const peaks = peakEvents
            .map(event => {
                const idx = dates.indexOf(event.date);
                if (idx === -1) return null;
                return {
                    date: event.date,
                    value: totalValues[idx] || 0,
                    index: idx,
                    event
                };
            })
            .filter(Boolean);

        // Format dates for display (English format)
        const formattedDates = dates.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const traces = [
            // Total line (المجموع) - shown prominently with dashed line
            {
                x: dates,
                y: totalValues,
                customdata: formattedDates,
                name: `الكل (${formatNumber(totalValues.reduce((a, b) => a + b, 0))})`,
                mode: 'lines+markers',
                line: { 
                    color: '#00502F',
                    width: 4,
                    shape: 'spline',
                    smoothing: 1.2,
                    dash: 'dashdot'
                },
                marker: {
                    color: '#00502F',
                    size: 6,
                    opacity: 0.9,
                    symbol: 'diamond'
                },
                hovertemplate: '<b>%{customdata}</b><br><span style="color:#00502F">◆</span> الكل: <b>%{y:,}</b><extra></extra>'
            },
            {
                x: dates,
                y: dates.map(d => originalMap[d] || 0),
                customdata: formattedDates,
                name: `منشورات الحساب (${formatNumber(dates.reduce((sum, d) => sum + (originalMap[d] || 0), 0))})`,
                mode: 'lines+markers',
                line: { 
                    color: '#3498db',
                    width: 3,
                    shape: 'spline',
                    smoothing: 1.2
                },
                marker: {
                    color: '#3498db',
                    size: 4,
                    opacity: 0.8
                },
                fill: 'tonexty',
                fillcolor: 'rgba(52, 152, 219, 0.15)',
                hovertemplate: '<b>%{customdata}</b><br><span style="color:#3498db">●</span> منشورات الحساب: <b>%{y:,}</b><extra></extra>'
            },
            {
                x: dates,
                y: dates.map(d => repostsMap[d] || 0),
                customdata: formattedDates,
                name: `إعادات النشر (${formatNumber(dates.reduce((sum, d) => sum + (repostsMap[d] || 0), 0))})`,
                mode: 'lines+markers',
                line: { 
                    color: '#e74c3c',
                    width: 3,
                    shape: 'spline',
                    smoothing: 1.2
                },
                marker: {
                    color: '#e74c3c',
                    size: 4,
                    opacity: 0.8
                },
                fill: 'tonexty',
                fillcolor: 'rgba(231, 76, 60, 0.15)',
                hovertemplate: '<b>%{customdata}</b><br><span style="color:#e74c3c">●</span> إعادات النشر: <b>%{y:,}</b><extra></extra>'
            },
            {
                x: dates,
                y: dates.map(d => quotesMap[d] || 0),
                customdata: formattedDates,
                name: `الاقتباسات (${formatNumber(dates.reduce((sum, d) => sum + (quotesMap[d] || 0), 0))})`,
                mode: 'lines+markers',
                line: { 
                    color: '#27ae60',
                    width: 3,
                    shape: 'spline',
                    smoothing: 1.2
                },
                marker: {
                    color: '#27ae60',
                    size: 4,
                    opacity: 0.8
                },
                fill: 'tonexty',
                fillcolor: 'rgba(39, 174, 96, 0.15)',
                hovertemplate: '<b>%{customdata}</b><br><span style="color:#27ae60">●</span> الاقتباسات: <b>%{y:,}</b><extra></extra>'
            },
            {
                x: dates,
                y: dates.map(d => repliesMap[d] || 0),
                customdata: formattedDates,
                name: `الردود (${formatNumber(dates.reduce((sum, d) => sum + (repliesMap[d] || 0), 0))})`,
                mode: 'lines+markers',
                line: { 
                    color: '#9b59b6',
                    width: 3,
                    shape: 'spline',
                    smoothing: 1.2
                },
                marker: {
                    color: '#9b59b6',
                    size: 4,
                    opacity: 0.8
                },
                fill: 'tonexty',
                fillcolor: 'rgba(155, 89, 182, 0.15)',
                hovertemplate: '<b>%{customdata}</b><br><span style="color:#9b59b6">●</span> الردود: <b>%{y:,}</b><extra></extra>'
            }
        ];

        // Create annotations for peaks
        const annotations = peaks.map(({ event, index, value }) => ({
            x: dates[index],
            y: value,
            xref: 'x',
            yref: 'y',
            text: event.label,
            hovertext: event.detail,
            showarrow: true,
            arrowhead: 2,
            arrowsize: 1,
            arrowwidth: 1.5,
            arrowcolor: '#00502F',
            ax: typeof event.ax === 'number' ? event.ax : 0,
            ay: typeof event.ay === 'number' ? event.ay : -40,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            bordercolor: '#00502F',
            borderwidth: 1,
            borderpad: 4,
            font: {
                family: 'Tajawal, Arial, sans-serif',
                size: 10,
                color: '#00502F'
            },
            hoverlabel: {
                bgcolor: 'rgba(0, 80, 47, 0.92)',
                bordercolor: '#ffffff',
                font: {
                    family: 'Tajawal, Arial, sans-serif',
                    size: 11,
                    color: '#fdfdfd'
                },
                align: 'right'
            },
            captureevents: true
        }));

        const chartHeight = Math.max(MIN_CHART_HEIGHT, chartContainer.clientHeight || 0);

        const layout = {
            margin: { l: 60, r: 30, t: 30, b: 60 },
            paper_bgcolor: 'rgba(255,255,255,0.95)',
            plot_bgcolor: 'rgba(248,250,252,0.5)',
            font: {
                family: 'Tajawal, Arial, sans-serif',
                size: 12,
                color: '#374151'
            },
            annotations: annotations,
            xaxis: {
                tickangle: -45,
                tickfont: { size: 11, color: '#6b7280', family: 'Tajawal, Arial, sans-serif' },
                showgrid: true,
                gridcolor: 'rgba(229, 231, 235, 0.8)',
                gridwidth: 1,
                zeroline: false,
                tickformat: '%d/%m',
                nticks: Math.min(12, dates.length),
                showline: true,
                linecolor: '#d1d5db',
                linewidth: 1,
                title: {
                    text: 'التاريخ',
                    font: { size: 12, color: '#9ca3af', family: 'Tajawal, Arial, sans-serif' },
                    standoff: 20
                }
            },
            yaxis: {
                rangemode: 'tozero',
                tickfont: { size: 11, color: '#6b7280', family: 'Tajawal, Arial, sans-serif' },
                gridcolor: 'rgba(229, 231, 235, 0.6)',
                gridwidth: 1,
                zeroline: true,
                zerolinecolor: '#e5e7eb',
                zerolinewidth: 1,
                showline: true,
                linecolor: '#d1d5db',
                linewidth: 1,
                title: {
                    text: 'عدد المنشورات',
                    font: { size: 12, color: '#9ca3af', family: 'Tajawal, Arial, sans-serif' },
                    standoff: 20
                }
            },
            legend: {
                orientation: 'h',
                x: 0.5,
                y: -0.25,
                xanchor: 'center',
                font: {
                    size: 10,
                    family: 'Tajawal, Arial, sans-serif',
                    color: '#4b5563'
                },
                bgcolor: 'rgba(255,255,255,0.95)',
                bordercolor: '#e5e7eb',
                borderwidth: 1,
                itemsizing: 'constant',
                itemwidth: 30
            },
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: 'rgba(255,255,255,0.95)',
                bordercolor: '#e5e7eb',
                borderwidth: 1,
                font: { family: 'Tajawal, Arial, sans-serif', size: 11, color: '#374151' },
                align: 'right'
            },
            showlegend: true,
            autosize: true,
            height: chartHeight
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'select2d', 'lasso2d', 'autoScale2d', 'toggleSpikelines'],
            modeBarButtonsToAdd: ['resetScale2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'post_types_chart_awqaf',
                height: 500,
                width: 900,
                scale: 2
            }
        };

        // Clear loading state
        chartContainer.innerHTML = '';
        
        Plotly.newPlot(chartContainer, traces, layout, config).then(() => {
            // Ensure container constraints remain enforced after Plotly initialization
            ensureChartDimensions();

            // Force resize to ensure proper display
            setTimeout(() => {
                Plotly.Plots.resize(chartContainer);
            }, 100);
        });

        if (!chartContainer.dataset.dimensionsListenerAttached) {
            const handleResize = () => {
                ensureChartDimensions();
                Plotly.Plots.resize(chartContainer);
            };
            window.addEventListener('resize', handleResize);
            chartContainer.dataset.dimensionsListenerAttached = 'true';
        }
        
        // Add chart hover events to highlight corresponding cards
        chartContainer.on('plotly_hover', function(data) {
            if (data.points && data.points.length > 0) {
                const traceIndices = data.points.map(p => p.curveNumber);
                highlightCards(traceIndices);
            }
        });
        
        chartContainer.on('plotly_unhover', function() {
            resetCardHighlights();
        });
        
        // Store reference
        chartInstance = chartContainer;
    }
    
    // Highlight cards based on trace indices
    function highlightCards(traceIndices) {
        const cardClasses = ['original', 'repost', 'quote', 'reply'];
        if (!activeFilter) {
            document.querySelectorAll('.post-type-card').forEach((card, index) => {
                if (traceIndices.includes(index)) {
                    card.classList.add('card-hover-highlight');
                } else {
                    card.classList.remove('card-hover-highlight');
                }
            });
        }
    }
    
    // Reset card highlights
    function resetCardHighlights() {
        if (!activeFilter) {
            document.querySelectorAll('.post-type-card').forEach(card => {
                card.classList.remove('card-hover-highlight');
            });
        }
    }

    // Initialize
    async function init() {
        console.log('Post Types Analysis initializing...');
        const chartContainer = document.getElementById('post-types-daily-chart');
        console.log('Chart container found:', !!chartContainer);
        if (!chartContainer) return; // Not on the right page

        const data = await loadPostTypesData();
        console.log('Data loaded:', data);
        console.log('Original posts count:', data?.original?.length || 0);
        console.log('Reposts count:', data?.reposts?.length || 0);
        console.log('Quotes count:', data?.quotes?.length || 0);
        
        if (!data) {
            chartContainer.innerHTML = '<p style="text-align: center; color: #666;">لا توجد بيانات متاحة</p>';
            return;
        }

        // Store data globally
        chartData = data;
        chartTotals = calculateTotals(data);
        
        console.log('Totals:', chartTotals);
        updateTotalsUI(chartTotals);
        createDailyChart(data);
        setupCardInteractivity();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
