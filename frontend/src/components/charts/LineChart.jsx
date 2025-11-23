import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomLineChart = ({ 
  data, 
  dataKey = 'revenue', 
  color = '#F16623', 
  title = 'Line Chart',
  showGrid = true,
  strokeWidth = 3,
  formatPrice = (value) => `$${value.toFixed(2)}`
}) => {
  // Custom tooltip with glass-morphism styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      let formattedValue;
      
      if (dataKey === 'revenue') {
        formattedValue = formatPrice(value);
      } else if (dataKey === 'orderCount') {
        formattedValue = `${value.toLocaleString()} orders`;
      } else {
        formattedValue = value.toLocaleString();
      }
      
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
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
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
            tickFormatter={(value) => {
              if (dataKey === 'revenue') {
                return formatPrice(value);
              } else if (dataKey === 'orderCount') {
                return value.toString();
              } else {
                return value.toString();
              }
            }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color}
            strokeWidth={strokeWidth}
            dot={{ 
              fill: color, 
              strokeWidth: 2, 
              stroke: '#fff',
              r: 4 
            }}
            activeDot={{ 
              r: 6, 
              stroke: color,
              strokeWidth: 2,
              fill: '#fff'
            }}
            fill={`url(#gradient-${dataKey})`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomLineChart;