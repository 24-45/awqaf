const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } = Recharts;

const data = [{ date: '2024-11-06', count: 3 }, { date: '2024-11-07', count: 1 }, { date: '2024-11-08', count: 1 }, { date: '2024-11-09', count: 0 }, { date: '2024-11-10', count: 0 }, { date: '2024-11-11', count: 2 }, { date: '2024-11-12', count: 1 }, { date: '2024-11-13', count: 4 }, { date: '2024-11-14', count: 0 }, { date: '2024-11-15', count: 1 }, { date: '2024-11-16', count: 0 }, { date: '2024-11-17', count: 0 }, { date: '2024-11-18', count: 2 }, { date: '2024-11-19', count: 1 }, { date: '2024-11-20', count: 0 }, { date: '2024-11-21', count: 0 }, { date: '2024-11-22', count: 1 }, { date: '2024-11-23', count: 0 }, { date: '2024-11-24', count: 5 }, { date: '2024-11-25', count: 0 }, { date: '2024-11-26', count: 2 }, { date: '2024-11-27', count: 1 }, { date: '2024-11-28', count: 2 }, { date: '2024-11-29', count: 1 }, { date: '2024-11-30', count: 0 }, { date: '2024-12-01', count: 1 }, { date: '2024-12-02', count: 0 }, { date: '2024-12-03', count: 2 }, { date: '2024-12-04', count: 2 }, { date: '2024-12-05', count: 5 }, { date: '2024-12-06', count: 1 }, { date: '2024-12-07', count: 0 }, { date: '2024-12-08', count: 0 }, { date: '2024-12-09', count: 2 }, { date: '2024-12-10', count: 3 }, { date: '2024-12-11', count: 5 }, { date: '2024-12-12', count: 1 }, { date: '2024-12-13', count: 1 }, { date: '2024-12-14', count: 0 }, { date: '2024-12-15', count: 0 }, { date: '2024-12-16', count: 1 }, { date: '2024-12-17', count: 1 }, { date: '2024-12-18', count: 2 }, { date: '2024-12-19', count: 1 }, { date: '2024-12-20', count: 1 }, { date: '2024-12-21', count: 0 }, { date: '2024-12-22', count: 1 }, { date: '2024-12-23', count: 2 }, { date: '2024-12-24', count: 2 }, { date: '2024-12-25', count: 4 }, { date: '2024-12-26', count: 1 }, { date: '2024-12-27', count: 1 }, { date: '2024-12-28', count: 1 }, { date: '2024-12-29', count: 1 }, { date: '2024-12-30', count: 1 }, { date: '2024-12-31', count: 2 }, { date: '2025-01-01', count: 1 }, { date: '2025-01-02', count: 1 }, { date: '2025-01-03', count: 1 }, { date: '2025-01-04', count: 0 }, { date: '2025-01-05', count: 3 }, { date: '2025-01-06', count: 1 }, { date: '2025-01-07', count: 1 }, { date: '2025-01-08', count: 1 }, { date: '2025-01-09', count: 0 }, { date: '2025-01-10', count: 0 }, { date: '2025-01-11', count: 1 }, { date: '2025-01-12', count: 0 }, { date: '2025-01-13', count: 1 }, { date: '2025-01-14', count: 9 }, { date: '2025-01-15', count: 4 }, { date: '2025-01-16', count: 6 }, { date: '2025-01-17', count: 1 }, { date: '2025-01-18', count: 0 }, { date: '2025-01-19', count: 1 }, { date: '2025-01-20', count: 1 }, { date: '2025-01-21', count: 1 }, { date: '2025-01-22', count: 1 }, { date: '2025-01-23', count: 1 }, { date: '2025-01-24', count: 1 }, { date: '2025-01-25', count: 2 }, { date: '2025-01-26', count: 1 }, { date: '2025-01-27', count: 1 }, { date: '2025-01-28', count: 0 }, { date: '2025-01-29', count: 1 }, { date: '2025-01-30', count: 5 }, { date: '2025-01-31', count: 2 }, { date: '2025-02-01', count: 2 }, { date: '2025-02-02', count: 1 }, { date: '2025-02-03', count: 1 }, { date: '2025-02-04', count: 1 }, { date: '2025-02-05', count: 1 }, { date: '2025-02-06', count: 2 }, { date: '2025-02-07', count: 1 }, { date: '2025-02-08', count: 0 }, { date: '2025-02-09', count: 3 }, { date: '2025-02-10', count: 4 }, { date: '2025-02-11', count: 1 }, { date: '2025-02-12', count: 4 }, { date: '2025-02-13', count: 3 }, { date: '2025-02-14', count: 1 }, { date: '2025-02-15', count: 1 }, { date: '2025-02-16', count: 1 }, { date: '2025-02-17', count: 0 }, { date: '2025-02-18', count: 4 }, { date: '2025-02-19', count: 11 }, { date: '2025-02-20', count: 2 }, { date: '2025-02-21', count: 0 }, { date: '2025-02-22', count: 4 }, { date: '2025-02-23', count: 0 }, { date: '2025-02-24', count: 1 }, { date: '2025-02-25', count: 0 }, { date: '2025-02-26', count: 2 }, { date: '2025-02-27', count: 0 }, { date: '2025-02-28', count: 4 }, { date: '2025-03-01', count: 0 }, { date: '2025-03-02', count: 2 }, { date: '2025-03-03', count: 0 }, { date: '2025-03-04', count: 0 }, { date: '2025-03-05', count: 4 }, { date: '2025-03-06', count: 3 }, { date: '2025-03-07', count: 4 }, { date: '2025-03-08', count: 0 }, { date: '2025-03-09', count: 1 }, { date: '2025-03-10', count: 2 }, { date: '2025-03-11', count: 3 }, { date: '2025-03-12', count: 1 }, { date: '2025-03-13', count: 5 }, { date: '2025-03-14', count: 4 }, { date: '2025-03-15', count: 0 }, { date: '2025-03-16', count: 3 }, { date: '2025-03-17', count: 1 }];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: '#fff',
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                textAlign: 'right',
                direction: 'rtl',
                fontFamily: 'Tajawal, sans-serif'
            }}>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{`التاريخ: ${label}`}</p>
                <p style={{ margin: '5px 0 0', color: '#006C35', fontWeight: 'bold', fontSize: '1rem' }}>
                    {`العدد: ${payload[0].value}`}
                </p>
            </div>
        );
    }
    return null;
};

const DailyActivityChart = () => {
    return (
        <div style={{ width: '100%', height: 400, direction: 'ltr' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 10,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: '#666' }}
                        tickMargin={10}
                        minTickGap={30}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#006C35"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#006C35', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Brush
                        dataKey="date"
                        height={30}
                        stroke="#006C35"
                        fill="#f0f9f4"
                        tickFormatter={() => ''}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

// Mount the component
const rootElement = document.getElementById('daily-activity-chart-root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<DailyActivityChart />);
}
