import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomBarChart = ({ 
  data, 
  dataKey = 'revenue', 
  color = '#9CAF88', 
  title = 'Bar Chart',
  showGrid = true,
  cornerRadius = 4
}) => {
  // Custom tooltip with glass-morphism styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const formattedValue = dataKey === 'revenue' ? `$${value.toFixed(2)}` : value.toLocaleString();
      
      return (
        <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-lg font-semibold" style={{ color }}>
            {formattedValue}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format x-axis labels based on date format
  const formatXAxisLabel = (tickItem) => {
    if (tickItem.includes('-W')) {
      return tickItem.replace(/^\d{4}-W/, 'W');
    }
    if (tickItem.length === 7) { // YYYY-MM format
      const [year, month] = tickItem.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    if (tickItem.length === 10) { // YYYY-MM-DD format
      const date = new Date(tickItem);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return tickItem;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id={`barGradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.9}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.6}/>
            </linearGradient>
          </defs>
          
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#E5E7EB" 
              strokeOpacity={0.6}
            />
          )}
          
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={formatXAxisLabel}
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value) => 
              dataKey === 'revenue' ? `$${value}` : value.toString()
            }
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Bar 
            dataKey={dataKey} 
            fill={`url(#barGradient-${dataKey})`}
            radius={[cornerRadius, cornerRadius, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomBarChart;