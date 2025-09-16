import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/data-storage-conversion')({
  component: RouteComponent,
})

interface DataUnit {
  name: string
  symbol: string
  toBytes: number
  category: string
}

const dataUnits: DataUnit[] = [
  { name: 'Bytes', symbol: 'B', toBytes: 1, category: 'base' },
  { name: 'Kilobytes', symbol: 'KB', toBytes: 1024, category: 'metric' },
  { name: 'Megabytes', symbol: 'MB', toBytes: 1024 * 1024, category: 'metric' },
  { name: 'Gigabytes', symbol: 'GB', toBytes: 1024 * 1024 * 1024, category: 'metric' },
  { name: 'Terabytes', symbol: 'TB', toBytes: 1024 * 1024 * 1024 * 1024, category: 'metric' },
  { name: 'Petabytes', symbol: 'PB', toBytes: 1024 * 1024 * 1024 * 1024 * 1024, category: 'metric' },
  { name: 'Exabytes', symbol: 'EB', toBytes: 1024 * 1024 * 1024 * 1024 * 1024 * 1024, category: 'metric' },
  { name: 'Zettabytes', symbol: 'ZB', toBytes: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024, category: 'metric' },
  { name: 'Yottabytes', symbol: 'YB', toBytes: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024, category: 'metric' },
  { name: 'Kibibytes', symbol: 'KiB', toBytes: 1024, category: 'binary' },
  { name: 'Mebibytes', symbol: 'MiB', toBytes: 1024 * 1024, category: 'binary' },
  { name: 'Gibibytes', symbol: 'GiB', toBytes: 1024 * 1024 * 1024, category: 'binary' },
  { name: 'Tebibytes', symbol: 'TiB', toBytes: 1024 * 1024 * 1024 * 1024, category: 'binary' },
  { name: 'Pebibytes', symbol: 'PiB', toBytes: 1024 * 1024 * 1024 * 1024 * 1024, category: 'binary' },
  { name: 'Exbibytes', symbol: 'EiB', toBytes: 1024 * 1024 * 1024 * 1024 * 1024 * 1024, category: 'binary' },
  { name: 'Zebibytes', symbol: 'ZiB', toBytes: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024, category: 'binary' },
  { name: 'Yobibytes', symbol: 'YiB', toBytes: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024, category: 'binary' },
  { name: 'Bits', symbol: 'b', toBytes: 0.125, category: 'base' },
  { name: 'Kilobits', symbol: 'Kb', toBytes: 128, category: 'metric' },
  { name: 'Megabits', symbol: 'Mb', toBytes: 128 * 1024, category: 'metric' },
  { name: 'Gigabits', symbol: 'Gb', toBytes: 128 * 1024 * 1024, category: 'metric' },
  { name: 'Terabits', symbol: 'Tb', toBytes: 128 * 1024 * 1024 * 1024, category: 'metric' },
  { name: 'Petabits', symbol: 'Pb', toBytes: 128 * 1024 * 1024 * 1024 * 1024, category: 'metric' },
  { name: 'Words (32-bit)', symbol: 'word', toBytes: 4, category: 'computer' },
  { name: 'Words (64-bit)', symbol: 'word64', toBytes: 8, category: 'computer' },
  { name: 'Nibbles', symbol: 'nibble', toBytes: 0.5, category: 'computer' }
]

function RouteComponent() {
  const [values, setValues] = useState<{ [key: string]: string }>({})
  const [activeInput, setActiveInput] = useState<string>('B')
  const [fromUnit, setFromUnit] = useState<string>('B')
  const [toUnit, setToUnit] = useState<string>('KB')

  // Initialize with 1024 bytes and convert to all units
  useEffect(() => {
    convertDataStorage('1024', 'B')
  }, [])

  const convertDataStorage = (value: string, fromUnit: string) => {
    if (!value || isNaN(Number(value))) {
      // Clear all fields if input is invalid
      const clearedValues: { [key: string]: string } = {}
      dataUnits.forEach(unit => {
        clearedValues[unit.symbol] = ''
      })
      setValues(clearedValues)
      return
    }

    const fromUnitData = dataUnits.find(unit => unit.symbol === fromUnit)
    if (!fromUnitData) return

    const bytes = Number(value) * fromUnitData.toBytes
    const newValues: { [key: string]: string } = {}

    dataUnits.forEach(unit => {
      if (unit.symbol === fromUnit) {
        newValues[unit.symbol] = value
      } else {
        const convertedValue = bytes / unit.toBytes
        // Format data storage values appropriately - avoid scientific notation
        if (convertedValue >= 1000000000000) {
          // For very large numbers (TB+), show with commas and up to 2 decimal places
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          })
        } else if (convertedValue >= 1000000000) {
          // For large numbers (GB+), show with commas and up to 3 decimal places
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
          })
        } else if (convertedValue >= 1000000) {
          // For medium numbers (MB+), show with commas and up to 3 decimal places
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
          })
        } else if (convertedValue >= 1000) {
          // For small numbers (KB+), show with commas and up to 3 decimal places
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 3
          })
        } else if (convertedValue < 1) {
          // For numbers less than 1, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(6)
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
    convertDataStorage(value, unit)
  }

  const clearAll = () => {
    const clearedValues: { [key: string]: string } = {}
    dataUnits.forEach(unit => {
      clearedValues[unit.symbol] = ''
    })
    setValues(clearedValues)
    setActiveInput('B')
  }

  const setExample = (example: number) => {
    setActiveInput(fromUnit)
    convertDataStorage(example.toString(), fromUnit)
  }

  // const getDataSizeDescription = (bytes: number) => {
  //   if (bytes < 1024) return 'Very Small'
  //   if (bytes < 1024 * 1024) return 'Small'
  //   if (bytes < 1024 * 1024 * 1024) return 'Medium'
  //   if (bytes < 1024 * 1024 * 1024 * 1024) return 'Large'
  //   if (bytes < 1024 * 1024 * 1024 * 1024 * 1024) return 'Very Large'
  //   if (bytes < 1024 * 1024 * 1024 * 1024 * 1024 * 1024) return 'Huge'
  //   return 'Massive'
  // }

  const getDataContext = (bytes: number) => {
    if (bytes < 1024) return '📝 Text document'
    if (bytes < 1024 * 1024) return '📄 Small file'
    if (bytes < 10 * 1024 * 1024) return '🖼️ Image file'
    if (bytes < 100 * 1024 * 1024) return '🎵 Audio file'
    if (bytes < 1024 * 1024 * 1024) return '🎬 Video file'
    if (bytes < 10 * 1024 * 1024 * 1024) return '💾 Large video'
    if (bytes < 100 * 1024 * 1024 * 1024) return '🗄️ Database'
    return '🌐 Data center'
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Data Storage Converter</h1>
        <p className="text-gray-600">Convert between different data storage units instantly</p>
      </div>

      {/* From/To Selector with Input and Result */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Convert Data Storage</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* From Section */}
          <div className="flex-1 max-w-xs">
            {/* Input Field */}
            <label htmlFor="mainFromInput" className="block text-sm font-medium text-gray-700 mb-2">
              {dataUnits.find(u => u.symbol === fromUnit)?.name} ({fromUnit})
            </label>
            <input
              id="mainFromInput"
              type="text"
              value={values[fromUnit] || ''}
              onChange={(e) => handleInputChange(e.target.value, fromUnit)}
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
              placeholder="Enter size"
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
                  convertDataStorage(values[e.target.value], e.target.value)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {dataUnits.map(unit => (
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
              {dataUnits.find(u => u.symbol === toUnit)?.name} ({toUnit})
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
              {dataUnits.map(unit => (
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
          {[1024, 1048576, 1073741824, 1099511627776, 1125899906842624].map(value => (
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
        {dataUnits.map(unit => (
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

              {/* Data Context */}
              {values[unit.symbol] && !isNaN(Number(values[unit.symbol])) && (
                <div className="mt-2 text-sm">
                  <span className="font-medium text-gray-700">
                    {(() => {
                      const size = Number(values[unit.symbol]) * unit.toBytes
                      return getDataContext(size)
                    })()}
                  </span>
                </div>
              )}

              {/* Category Badge */}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${unit.category === 'base' ? 'bg-gray-100 text-gray-800' :
                  unit.category === 'metric' ? 'bg-green-100 text-green-800' :
                    unit.category === 'binary' ? 'bg-blue-100 text-blue-800' :
                      unit.category === 'computer' ? 'bg-purple-100 text-purple-800' :
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
          onClick={() => setExample(1024)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Reset to 1024 {fromUnit}
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
              <li>• Supports 25 different data units</li>
              <li>• Data context indicators</li>
              <li>• Responsive design for all devices</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Categories:</h4>
            <ul className="space-y-1">
              <li>• <span className="font-medium text-gray-700">Base:</span> B, b, nibble</li>
              <li>• <span className="font-medium text-green-700">Metric:</span> KB, MB, GB, TB, PB, EB, ZB, YB</li>
              <li>• <span className="font-medium text-blue-700">Binary:</span> KiB, MiB, GiB, TiB, PiB, EiB, ZiB, YiB</li>
              <li>• <span className="font-medium text-purple-700">Computer:</span> word, word64</li>
              <li>• <span className="font-medium text-red-700">Bits:</span> Kb, Mb, Gb, Tb, Pb</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
