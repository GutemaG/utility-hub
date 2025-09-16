import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/speed-conversion')({
  component: RouteComponent,
})

interface SpeedUnit {
  name: string
  symbol: string
  toMetersPerSecond: number
  category: string
}

const speedUnits: SpeedUnit[] = [
  { name: 'Meters per Second', symbol: 'm/s', toMetersPerSecond: 1, category: 'metric' },
  { name: 'Kilometers per Hour', symbol: 'km/h', toMetersPerSecond: 0.277778, category: 'metric' },
  { name: 'Miles per Hour', symbol: 'mph', toMetersPerSecond: 0.44704, category: 'imperial' },
  { name: 'Knots', symbol: 'kn', toMetersPerSecond: 0.514444, category: 'nautical' },
  { name: 'Feet per Second', symbol: 'ft/s', toMetersPerSecond: 0.3048, category: 'imperial' },
  { name: 'Kilometers per Second', symbol: 'km/s', toMetersPerSecond: 1000, category: 'metric' },
  { name: 'Centimeters per Second', symbol: 'cm/s', toMetersPerSecond: 0.01, category: 'metric' },
  { name: 'Mach Number', symbol: 'M', toMetersPerSecond: 343, category: 'scientific' },
  { name: 'Speed of Light', symbol: 'c', toMetersPerSecond: 299792458, category: 'scientific' },
  { name: 'Speed of Sound', symbol: 'vs', toMetersPerSecond: 343, category: 'scientific' },
  { name: 'Yards per Second', symbol: 'yd/s', toMetersPerSecond: 0.9144, category: 'imperial' },
  { name: 'Inches per Second', symbol: 'in/s', toMetersPerSecond: 0.0254, category: 'imperial' },
  { name: 'Miles per Second', symbol: 'mi/s', toMetersPerSecond: 1609.344, category: 'imperial' },
  { name: 'Nautical Miles per Hour', symbol: 'nmi/h', toMetersPerSecond: 0.514444, category: 'nautical' },
  { name: 'Furlongs per Fortnight', symbol: 'fur/ftn', toMetersPerSecond: 0.0001663095, category: 'historical' },
  { name: 'Beard Seconds', symbol: 'beard-s', toMetersPerSecond: 5.08e-9, category: 'scientific' }
]

function RouteComponent() {
  const [values, setValues] = useState<{ [key: string]: string }>({})
  const [activeInput, setActiveInput] = useState<string>('m/s')
  const [fromUnit, setFromUnit] = useState<string>('m/s')
  const [toUnit, setToUnit] = useState<string>('km/h')

  // Initialize with 10 m/s and convert to all units
  useEffect(() => {
    convertSpeed('10', 'm/s')
  }, [])

  const convertSpeed = (value: string, fromUnit: string) => {
    if (!value || isNaN(Number(value))) {
      // Clear all fields if input is invalid
      const clearedValues: { [key: string]: string } = {}
      speedUnits.forEach(unit => {
        clearedValues[unit.symbol] = ''
      })
      setValues(clearedValues)
      return
    }

    const fromUnitData = speedUnits.find(unit => unit.symbol === fromUnit)
    if (!fromUnitData) return

    const metersPerSecond = Number(value) * fromUnitData.toMetersPerSecond
    const newValues: { [key: string]: string } = {}

    speedUnits.forEach(unit => {
      if (unit.symbol === fromUnit) {
        newValues[unit.symbol] = value
      } else {
        const convertedValue = metersPerSecond / unit.toMetersPerSecond
        // Format speed values appropriately - avoid scientific notation
        if (Math.abs(convertedValue) < 0.000001 && convertedValue !== 0) {
          // For very small numbers, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(12)
        } else if (Math.abs(convertedValue) < 0.001 && convertedValue !== 0) {
          // For very small numbers, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(9)
        } else if (Math.abs(convertedValue) < 1) {
          // For numbers less than 1, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(6)
        } else if (Math.abs(convertedValue) >= 1000000000) {
          // For very large numbers, show with commas and up to 1 decimal place
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
          })
        } else if (Math.abs(convertedValue) >= 1000000) {
          // For large numbers, show with commas and up to 2 decimal places
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          })
        } else if (Math.abs(convertedValue) >= 1000) {
          // For medium numbers, show with commas and up to 2 decimal places
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          })
        } else {
          // For regular numbers, show up to 3 decimal places
          newValues[unit.symbol] = convertedValue.toFixed(3)
        }
      }
    })

    setValues(newValues)
  }

  const handleInputChange = (value: string, unit: string) => {
    setActiveInput(unit)
    convertSpeed(value, unit)
  }

  const clearAll = () => {
    const clearedValues: { [key: string]: string } = {}
    speedUnits.forEach(unit => {
      clearedValues[unit.symbol] = ''
    })
    setValues(clearedValues)
    setActiveInput('m/s')
  }

  const setExample = (example: number) => {
    setActiveInput(fromUnit)
    convertSpeed(example.toString(), fromUnit)
  }

  // const getSpeedDescription = (metersPerSecond: number) => {
  //   if (metersPerSecond < 0.1) return 'Very Slow'
  //   if (metersPerSecond < 1) return 'Slow'
  //   if (metersPerSecond < 10) return 'Walking Speed'
  //   if (metersPerSecond < 30) return 'Running Speed'
  //   if (metersPerSecond < 100) return 'Vehicle Speed'
  //   if (metersPerSecond < 1000) return 'High Speed'
  //   if (metersPerSecond < 10000) return 'Very High Speed'
  //   return 'Extreme Speed'
  // }

  const getSpeedContext = (metersPerSecond: number) => {
    if (metersPerSecond < 0.1) return '🐌 Snail pace'
    if (metersPerSecond < 1) return '🚶 Walking'
    if (metersPerSecond < 5) return '🏃 Running'
    if (metersPerSecond < 15) return '🚴 Cycling'
    if (metersPerSecond < 30) return '🚗 City driving'
    if (metersPerSecond < 50) return '🛣️ Highway speed'
    if (metersPerSecond < 100) return '✈️ Aircraft takeoff'
    if (metersPerSecond < 343) return '🚀 Subsonic'
    if (metersPerSecond < 1000) return '⚡ Supersonic'
    return '🌌 Hypersonic'
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Speed Converter</h1>
        <p className="text-gray-600">Convert between different speed units instantly</p>
      </div>

      {/* From/To Selector with Input and Result */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Convert Speed</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* From Section */}
          <div className="flex-1 max-w-xs">
            {/* Input Field */}
            <label htmlFor="mainFromInput" className="block text-sm font-medium text-gray-700 mb-2">
              {speedUnits.find(u => u.symbol === fromUnit)?.name} ({fromUnit})
            </label>
            <input
              id="mainFromInput"
              type="text"
              value={values[fromUnit] || ''}
              onChange={(e) => handleInputChange(e.target.value, fromUnit)}
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
              placeholder="Enter speed"
            />

            {/* From Unit Dropdown */}
            <label htmlFor="fromUnit" className="block text-sm font-medium text-gray-700 mb-2">
              From Unit
            </label>
            <select
              id="fromUnit"
              value={fromUnit}
              onChange={(e) => {
                setFromUnit(e.target.value)
                setActiveInput(e.target.value)
                if (values[e.target.value]) {
                  convertSpeed(values[e.target.value], e.target.value)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {speedUnits.map(unit => (
                <option key={unit.symbol} value={unit.symbol}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Arrow Icon */}
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>

          {/* To Section */}
          <div className="flex-1 max-w-xs">
            {/* Result Display */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {speedUnits.find(u => u.symbol === toUnit)?.name} ({toUnit})
            </label>
            <div className="w-full px-3 py-2 text-lg bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono mb-3">
              {values[toUnit] || '0'}
            </div>

            {/* To Unit Dropdown */}
            <label htmlFor="toUnit" className="block text-sm font-medium text-gray-700 mb-2">
              To Unit
            </label>
            <select
              id="toUnit"
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {speedUnits.map(unit => (
                <option key={unit.symbol} value={unit.symbol}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>



      {/* Quick Examples */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Examples</h3>
        <div className="flex flex-wrap gap-2">
          {[1, 5, 10, 50, 100, 1000].map(value => (
            <button
              key={value}
              onClick={() => setExample(value)}
              className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              {value} {fromUnit}
            </button>
          ))}
        </div>
      </div>

      {/* Conversion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-4">
        {speedUnits.map(unit => (
          <div
            key={unit.symbol}
            className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-200 ${activeInput === unit.symbol
              ? 'border-blue-500 shadow-blue-100'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{unit.name}</h3>
                <span className="text-sm text-gray-500 font-mono">{unit.symbol}</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={values[unit.symbol] || ''}
                  onChange={(e) => handleInputChange(e.target.value, unit.symbol)}
                  className={`w-full px-3 py-2 text-lg border rounded-lg focus:outline-none focus:ring-2 transition-all ${activeInput === unit.symbol
                    ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500'
                    : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                    }`}
                  placeholder="0"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                  {unit.symbol}
                </div>
              </div>

              {/* Speed Context */}
              {values[unit.symbol] && !isNaN(Number(values[unit.symbol])) && (
                <div className="mt-2 text-sm">
                  <span className="font-medium text-gray-700">
                    {(() => {
                      const speed = Number(values[unit.symbol]) * unit.toMetersPerSecond
                      return getSpeedContext(speed)
                    })()}
                  </span>
                </div>
              )}

              {/* Category Badge */}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${unit.category === 'metric' ? 'bg-green-100 text-green-800' :
                  unit.category === 'imperial' ? 'bg-blue-100 text-blue-800' :
                    unit.category === 'nautical' ? 'bg-purple-100 text-purple-800' :
                      unit.category === 'scientific' ? 'bg-orange-100 text-orange-800' :
                        unit.category === 'historical' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                  }`}>
                  {unit.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={clearAll}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={() => setExample(10)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Reset to 10 {fromUnit}
        </button>
      </div>

      {/* Information */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
            <ul className="space-y-1">
              <li>• Real-time conversion as you type</li>
              <li>• Supports 16 different speed units</li>
              <li>• Speed context indicators</li>
              <li>• Responsive design for all devices</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Categories:</h4>
            <ul className="space-y-1">
              <li>• <span className="font-medium text-green-700">Metric:</span> m/s, km/h, km/s, cm/s</li>
              <li>• <span className="font-medium text-blue-700">Imperial:</span> mph, ft/s, yd/s, in/s, mi/s</li>
              <li>• <span className="font-medium text-purple-700">Nautical:</span> kn, nmi/h</li>
              <li>• <span className="font-medium text-orange-700">Scientific:</span> M, c, vs, beard-s</li>
              <li>• <span className="font-medium text-yellow-700">Historical:</span> fur/ftn</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
