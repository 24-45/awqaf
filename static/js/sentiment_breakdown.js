/**
 * Sentiment Breakdown Visualization
 * يرسم توزيع المشاعر ويحدّث البطاقات الرقمية.
 */
(function () {
    'use strict';

    const DATA_URL = '/static/data/sentiment_breakdown.csv';
    const CHART_ID = 'sentiment-breakdown-chart';
    const SENTIMENT_LABELS = {
        positive: 'إيجابي',
        neutral: 'حيادي',
        negative: 'سلبي'
    };
    const SENTIMENT_COLORS = {
        positive: '#2f8762',
        neutral: '#9aa1ab',
        negative: '#d35b51'
    };

    document.addEventListener('DOMContentLoaded', initialise);

    async function initialise() {
        const data = await loadData();
        if (!data || !data.length) {
            console.warn('No sentiment data available for rendering.');
            return;
        }

        const total = data.reduce((sum, item) => sum + item.count, 0);
        updateStatBlocks(data, total);
        renderChart(data, total);
    }

    async function loadData() {
        try {
            const response = await fetch(DATA_URL, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const csv = await response.text();
            return parseCsv(csv);
        } catch (error) {
            console.error('Failed to load sentiment breakdown data:', error);
            return null;
        }
    }

    function parseCsv(csvText) {
        return csvText
            .trim()
            .split('\n')
            .slice(1)
            .map((line) => {
                const [sentiment, rawCount] = line.split(',');
                const key = sentiment ? sentiment.trim().toLowerCase() : '';
                const count = Number(rawCount);
                return key && Number.isFinite(count) ? { sentiment: key, count } : null;
            })
            .filter(Boolean);
    }

    function updateStatBlocks(data, total) {
        data.forEach((item) => {
            const countEl = document.querySelector(`[data-sentiment-count="${item.sentiment}"]`);
            if (countEl) {
                countEl.textContent = `${formatNumber(item.count)} تغريدة`;
            }

            const shareEl = document.querySelector(`[data-sentiment-share="${item.sentiment}"]`);
            if (shareEl) {
                const shareValue = total ? (item.count / total) * 100 : 0;
                shareEl.textContent = `${shareValue.toFixed(1)}% من الحديث العام`;
            }
        });
    }

    function renderChart(data, total) {
        const chartElement = document.getElementById(CHART_ID);
        if (!chartElement || typeof Plotly === 'undefined') {
            return;
        }

        const values = data.map((item) => item.count);
        const labels = data.map((item) => SENTIMENT_LABELS[item.sentiment] || item.sentiment);
        const colors = data.map((item) => SENTIMENT_COLORS[item.sentiment] || '#cccccc');

        const plotData = [
            {
                type: 'pie',
                values,
                labels,
                hole: 0.56,
                textinfo: 'label+percent',
                textposition: 'inside',
                sort: false,
                direction: 'clockwise',
                hovertemplate: '%{label}<br>%{value:,} تغريدة<br>%{percent}<extra></extra>',
                marker: {
                    colors,
                    line: {
                        color: '#ffffff',
                        width: 2
                    }
                },
                pull: data.map((item) => (item.sentiment === 'negative' ? 0.05 : 0)),
                rotation: -88
            }
        ];

        const layout = {
            margin: { t: 10, r: 10, b: 10, l: 10 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.5,
                y: -0.15,
                xanchor: 'center',
                font: {
                    family: 'Tajawal, sans-serif',
                    size: 12
                }
            },
            annotations: [
                {
                    x: 0.5,
                    y: 0.5,
                    xref: 'paper',
                    yref: 'paper',
                    showarrow: false,
                    align: 'center',
                    text: `<span style="font-size:22px;font-weight:700;">${formatNumber(total)}</span><br><span style="font-size:12px;">تغريدة</span>`
                }
            ],
            font: {
                family: 'Tajawal, sans-serif',
                size: 14,
                color: '#1c241e'
            }
        };

        const config = {
            responsive: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['toImage']
        };

        Plotly.newPlot(chartElement, plotData, layout, config);
        window.addEventListener('resize', () => Plotly.Plots.resize(chartElement));
    }

    function formatNumber(value) {
        return Number(value || 0).toLocaleString('en-US');
    }
})();
