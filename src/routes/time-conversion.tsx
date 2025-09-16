import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/time-conversion')({
  component: RouteComponent,
})

interface TimeUnit {
  name: string
  symbol: string
  toSeconds: number
  category: string
}

const timeUnits: TimeUnit[] = [
  { name: 'Seconds', symbol: 's', toSeconds: 1, category: 'base' },
  { name: 'Minutes', symbol: 'min', toSeconds: 60, category: 'base' },
  { name: 'Hours', symbol: 'h', toSeconds: 3600, category: 'base' },
  { name: 'Days', symbol: 'd', toSeconds: 86400, category: 'base' },
  { name: 'Weeks', symbol: 'wk', toSeconds: 604800, category: 'base' },
  { name: 'Months', symbol: 'mo', toSeconds: 2592000, category: 'calendar' },
  { name: 'Years', symbol: 'yr', toSeconds: 31536000, category: 'calendar' },
  { name: 'Decades', symbol: 'dec', toSeconds: 315360000, category: 'calendar' },
  { name: 'Centuries', symbol: 'cent', toSeconds: 3153600000, category: 'calendar' },
  { name: 'Millennia', symbol: 'mill', toSeconds: 31536000000, category: 'calendar' },
  { name: 'Milliseconds', symbol: 'ms', toSeconds: 0.001, category: 'precision' },
  { name: 'Microseconds', symbol: 'μs', toSeconds: 0.000001, category: 'precision' },
  { name: 'Nanoseconds', symbol: 'ns', toSeconds: 0.000000001, category: 'precision' },
  { name: 'Picoseconds', symbol: 'ps', toSeconds: 0.000000000001, category: 'precision' },
  { name: 'Femtoseconds', symbol: 'fs', toSeconds: 0.000000000000001, category: 'precision' },
  { name: 'Attoseconds', symbol: 'as', toSeconds: 0.000000000000000001, category: 'precision' },
  { name: 'Planck Time', symbol: 'tP', toSeconds: 5.39e-44, category: 'scientific' },
  { name: 'Lunar Month', symbol: 'lunar', toSeconds: 2551442.8, category: 'astronomical' },
  { name: 'Solar Year', symbol: 'solar', toSeconds: 31556925.2, category: 'astronomical' },
  { name: 'Sidereal Day', symbol: 'sidereal', toSeconds: 86164.1, category: 'astronomical' },
  { name: 'Julian Year', symbol: 'julian', toSeconds: 31557600, category: 'astronomical' }
]

function RouteComponent() {
  const [values, setValues] = useState<{ [key: string]: string }>({})
  const [activeInput, setActiveInput] = useState<string>('s')
  const [fromUnit, setFromUnit] = useState<string>('s')
  const [toUnit, setToUnit] = useState<string>('min')

  // Initialize with 3600 seconds (1 hour) and convert to all units
  useEffect(() => {
    convertTime('3600', 's')
  }, [])

  const convertTime = (value: string, fromUnit: string) => {
    if (!value || isNaN(Number(value))) {
      const clearedValues: { [key: string]: string } = {}
      timeUnits.forEach(unit => {
        clearedValues[unit.symbol] = ''
      })
      setValues(clearedValues)
      return
    }

    const fromUnitData = timeUnits.find(unit => unit.symbol === fromUnit)
    if (!fromUnitData) return

    const seconds = Number(value) * fromUnitData.toSeconds
    const newValues: { [key: string]: string } = {}

    timeUnits.forEach(unit => {
      if (unit.symbol === fromUnit) {
        newValues[unit.symbol] = value
      } else {
        const convertedValue = seconds / unit.toSeconds
        if (Math.abs(convertedValue) < 0.000001 && convertedValue !== 0) {
          newValues[unit.symbol] = convertedValue.toFixed(15)
        } else if (Math.abs(convertedValue) < 0.001 && convertedValue !== 0) {
          newValues[unit.symbol] = convertedValue.toFixed(9)
        } else if (Math.abs(convertedValue) < 1) {
          newValues[unit.symbol] = convertedValue.toFixed(6)
        } else if (Math.abs(convertedValue) >= 1000000000) {
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
          })
        } else if (Math.abs(convertedValue) >= 1000000) {
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          })
        } else if (Math.abs(convertedValue) >= 1000) {
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          })
        } else {
          newValues[unit.symbol] = convertedValue.toFixed(3)
        }
      }
    })

    setValues(newValues)
  }

  const handleInputChange = (value: string, unit: string) => {
    setActiveInput(unit)
    convertTime(value, unit)
  }

  const clearAll = () => {
    const clearedValues: { [key: string]: string } = {}
    timeUnits.forEach(unit => {
      clearedValues[unit.symbol] = ''
    })
    setValues(clearedValues)
    setActiveInput('s')
  }

  const setExample = (example: number) => {
    setActiveInput(fromUnit)
    convertTime(example.toString(), fromUnit)
  }

  // const getTimeDescription = (seconds: number) => {
  //   if (seconds < 1) return 'Very Short'
  //   if (seconds < 60) return 'Short'
  //   if (seconds < 3600) return 'Minutes'
  //   if (seconds < 86400) return 'Hours'
  //   if (seconds < 2592000) return 'Days'
  //   if (seconds < 31536000) return 'Months'
  //   if (seconds < 315360000) return 'Years'
  //   if (seconds < 3153600000) return 'Centuries'
  //   return 'Millennia'
  // }

  const getTimeContext = (seconds: number) => {
    if (seconds < 0.001) return '⚡ Ultra-fast'
    if (seconds < 1) return '🚀 Very fast'
    if (seconds < 60) return '⏱️ Quick'
    if (seconds < 3600) return '⏰ Minutes'
    if (seconds < 86400) return '🌅 Daily'
    if (seconds < 2592000) return '📅 Monthly'
    if (seconds < 31536000) return '📆 Yearly'
    if (seconds < 315360000) return '🕰️ Decade'
    if (seconds < 3153600000) return '🏛️ Century'
    return '🏺 Ancient'
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Time Converter</h1>
        <p className="text-gray-600">Convert between different time units instantly</p>
      </div>

      {/* From/To Selector with Input and Result */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Convert Time</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* From Section */}
          <div className="flex-1 max-w-xs">
            <label htmlFor="mainFromInput" className="block text-sm font-medium text-gray-700 mb-2">
              {timeUnits.find(u => u.symbol === fromUnit)?.name} ({fromUnit})
            </label>
            <input
              id="mainFromInput"
              type="text"
              value={values[fromUnit] || ''}
              onChange={(e) => handleInputChange(e.target.value, fromUnit)}
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
              placeholder="Enter time"
            />

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
                  convertTime(values[e.target.value], e.target.value)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeUnits.map(unit => (
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {timeUnits.find(u => u.symbol === toUnit)?.name} ({toUnit})
            </label>
            <div className="w-full px-3 py-2 text-lg bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono mb-3">
              {values[toUnit] || '0'}
            </div>

            <label htmlFor="toUnit" className="block text-sm font-medium text-gray-700 mb-2">
              To Unit
            </label>
            <select
              id="toUnit"
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeUnits.map(unit => (
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
          {[60, 3600, 86400, 31536000, 315360000].map(value => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeUnits.map(unit => (
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

              {/* Time Context */}
              {values[unit.symbol] && !isNaN(Number(values[unit.symbol])) && (
                <div className="mt-2 text-sm">
                  <span className="font-medium text-gray-700">
                    {(() => {
                      const time = Number(values[unit.symbol]) * unit.toSeconds
                      return getTimeContext(time)
                    })()}
                  </span>
                </div>
              )}

              {/* Category Badge */}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${unit.category === 'base' ? 'bg-green-100 text-green-800' :
                  unit.category === 'calendar' ? 'bg-blue-100 text-blue-800' :
                    unit.category === 'precision' ? 'bg-purple-100 text-purple-800' :
                      unit.category === 'astronomical' ? 'bg-orange-100 text-orange-800' :
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
          onClick={() => setExample(3600)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Reset to 3600 {fromUnit}
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
              <li>• Supports 21 different time units</li>
              <li>• Time context indicators</li>
              <li>• Responsive design for all devices</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Categories:</h4>
            <ul className="space-y-1">
              <li>• <span className="font-medium text-green-700">Base:</span> s, min, h, d, wk</li>
              <li>• <span className="font-medium text-blue-700">Calendar:</span> mo, yr, dec, cent, mill</li>
              <li>• <span className="font-medium text-purple-700">Precision:</span> ms, μs, ns, ps, fs, as</li>
              <li>• <span className="font-medium text-orange-700">Astronomical:</span> lunar, solar, sidereal, julian</li>
              <li>• <span className="font-medium text-red-700">Scientific:</span> tP (Planck Time)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
