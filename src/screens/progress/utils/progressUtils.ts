import { Measurement, InitialMeasurement, ChartDataPoint, ChartYAxisData, UserActivity } from '../types';

const toDateKey = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
};

export const getCurrentWeight = (
  measurements: Measurement[],
  profileWeight?: number | null
): number | string => {
  const sortedMeasurements = [...measurements].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestMeasurement = sortedMeasurements[0];
  return latestMeasurement?.weight ?? profileWeight ?? '-';
};

export const getCurrentWaistSize = (
  measurements: Measurement[],
  profileWaistSize?: number | null
): number | string => {
  const sortedMeasurements = [...measurements].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestMeasurement = sortedMeasurements[0];
  return latestMeasurement?.waistSize ?? profileWaistSize ?? '-';
};

export const generateChartData = (
  initialMeasurements: InitialMeasurement | null,
  measurements: Measurement[],
  activities: UserActivity[] = []
): ChartDataPoint[] => {
  const chartData: ChartDataPoint[] = [];
  const durationByDateKey: Record<string, number> = {};
  activities.forEach((a) => {
    const key = toDateKey(a.date || a.createdAt);
    if (key) durationByDateKey[key] = (durationByDateKey[key] || 0) + (a.duration || 0);
  });

  // Add initial measurement if available
  if (initialMeasurements) {
    const weight = parseFloat(String(initialMeasurements.weight));
    const waistSize = parseFloat(String(initialMeasurements.waistSize));
    const dateKey = toDateKey(initialMeasurements.date);
    if (!isNaN(weight) && !isNaN(waistSize)) {
      chartData.push({
        date: initialMeasurements.date,
        weight: weight,
        waistSize: waistSize,
        notes: 'Mesure initiale',
        isInitial: true,
        activityMinutes: dateKey ? durationByDateKey[dateKey] : undefined,
      });
    }
  }

  // Add user measurements (sorted by date, oldest first for chart)
  const sortedMeasurements = [...measurements].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedMeasurements.forEach((measurement) => {
    const weight = parseFloat(String(measurement.weight));
    const waistSize = measurement.waistSize !== null && measurement.waistSize !== undefined
      ? parseFloat(String(measurement.waistSize))
      : null;
    const dateKey = toDateKey(measurement.createdAt || measurement.date);

    if (!isNaN(weight) && weight > 0) {
      chartData.push({
        date: measurement.createdAt,
        weight: weight,
        waistSize: waistSize !== null && !isNaN(waistSize) ? waistSize : 0,
        notes: measurement.notes || '',
        isInitial: false,
        activityMinutes: dateKey ? durationByDateKey[dateKey] : undefined,
      });
    }
  });

  return chartData;
};

export const getChartYAxisData = (chartData: ChartDataPoint[]): ChartYAxisData => {
  if (chartData.length === 0) {
    return {
      weightRange: { min: 0, max: 100 },
      waistRange: { min: 0, max: 100 },
      weightLabels: [100, 75, 50, 25, 0],
      waistLabels: [100, 75, 50, 25, 0],
    };
  }
  
  const weights = chartData.map(d => d.weight).filter(w => w != null);
  const waists = chartData.map(d => d.waistSize).filter(w => w != null);
  
  const weightMin = Math.min(...weights);
  const weightMax = Math.max(...weights);
  const waistMin = Math.min(...waists);
  const waistMax = Math.max(...waists);
  
  // Add some padding to the range
  const weightPadding = (weightMax - weightMin) * 0.1 || 5;
  const waistPadding = (waistMax - waistMin) * 0.1 || 5;
  
  const weightRange = {
    min: Math.max(0, weightMin - weightPadding),
    max: weightMax + weightPadding,
  };
  
  const waistRange = {
    min: Math.max(0, waistMin - waistPadding),
    max: waistMax + waistPadding,
  };
  
  // Generate 5 labels for each axis
  const weightLabels: number[] = [];
  const waistLabels: number[] = [];
  
  for (let i = 4; i >= 0; i--) {
    const weightValue = weightRange.min + (weightRange.max - weightRange.min) * (i / 4);
    const waistValue = waistRange.min + (waistRange.max - waistRange.min) * (i / 4);
    weightLabels.push(Math.round(weightValue));
    waistLabels.push(Math.round(waistValue));
  }
  
  return {
    weightRange,
    waistRange,
    weightLabels,
    waistLabels,
  };
};

