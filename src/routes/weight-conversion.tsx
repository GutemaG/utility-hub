import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/weight-conversion')({
  component: RouteComponent,
})

interface WeightUnit {
  name: string
  symbol: string
  toGrams: number
  category: string
}

const weightUnits: WeightUnit[] = [
  { name: 'Grams', symbol: 'g', toGrams: 1, category: 'metric' },
  { name: 'Kilograms', symbol: 'kg', toGrams: 1000, category: 'metric' },
  { name: 'Milligrams', symbol: 'mg', toGrams: 0.001, category: 'metric' },
  { name: 'Micrograms', symbol: 'µg', toGrams: 0.000001, category: 'metric' },
  { name: 'Pounds', symbol: 'lb', toGrams: 453.59237, category: 'imperial' },
  { name: 'Ounces', symbol: 'oz', toGrams: 28.349523125, category: 'imperial' },
  { name: 'Tons (US)', symbol: 'US ton', toGrams: 907184.74, category: 'imperial' },
  { name: 'Tons (UK)', symbol: 'UK ton', toGrams: 1016046.9088, category: 'imperial' },
  { name: 'Metric Tons', symbol: 't', toGrams: 1000000, category: 'metric' },
  { name: 'Stones', symbol: 'st', toGrams: 6350.29318, category: 'imperial' },
  { name: 'Carats', symbol: 'ct', toGrams: 0.2, category: 'jewelry' },
  { name: 'Grain', symbol: 'gr', toGrams: 0.06479891, category: 'imperial' },
  { name: 'Atomic Mass Unit', symbol: 'u', toGrams: 1.66053907e-24, category: 'scientific' },
  { name: 'Solar Mass', symbol: 'M☉', toGrams: 1.989e33, category: 'astronomical' },
  { name: 'Earth Mass', symbol: 'M⊕', toGrams: 5.972e27, category: 'astronomical' }
]

function RouteComponent() {
  const [values, setValues] = useState<{ [key: string]: string }>({})
  const [activeInput, setActiveInput] = useState<string>('g')
  const [fromUnit, setFromUnit] = useState<string>('g')
  const [toUnit, setToUnit] = useState<string>('kg')

  // Initialize with 1000 grams (1 kg)
  useEffect(() => {
    const initialValues: { [key: string]: string } = {}
    weightUnits.forEach(unit => {
      initialValues[unit.symbol] = '1000'
    })
    setValues(initialValues)
  }, [])

  const convertWeight = (value: string, fromUnit: string) => {
    if (!value || isNaN(Number(value))) {
      // Clear all fields if input is invalid
      const clearedValues: { [key: string]: string } = {}
      weightUnits.forEach(unit => {
        clearedValues[unit.symbol] = ''
      })
      setValues(clearedValues)
      return
    }

    const fromUnitData = weightUnits.find(unit => unit.symbol === fromUnit)
    if (!fromUnitData) return

    const grams = Number(value) * fromUnitData.toGrams
    const newValues: { [key: string]: string } = {}

    weightUnits.forEach(unit => {
      if (unit.symbol === fromUnit) {
        newValues[unit.symbol] = value
      } else {
        const convertedValue = grams / unit.toGrams
        // Format weight values appropriately - avoid scientific notation
        if (Math.abs(convertedValue) < 0.001 && convertedValue !== 0) {
          // For very small numbers, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(8)
        } else if (Math.abs(convertedValue) < 1) {
          // For numbers less than 1, show more decimal places
          newValues[unit.symbol] = convertedValue.toFixed(6)
        } else if (Math.abs(convertedValue) >= 1000000) {
          // For very large numbers, show with commas and up to 1 decimal place
          newValues[unit.symbol] = convertedValue.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
          })
        } else if (Math.abs(convertedValue) >= 1000) {
          // For large numbers, show with commas and up to 2 decimal places
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
    convertWeight(value, unit)
  }

  const clearAll = () => {
    const clearedValues: { [key: string]: string } = {}
    weightUnits.forEach(unit => {
      clearedValues[unit.symbol] = ''
    })
    setValues(clearedValues)
    setActiveInput('g')
  }

  const setExample = (example: number) => {
    setActiveInput(fromUnit)
    convertWeight(example.toString(), fromUnit)
  }

  const getWeightDescription = (grams: number) => {
    if (grams < 1) return 'Very Light'
    if (grams < 10) return 'Light'
    if (grams < 100) return 'Small'
    if (grams < 1000) return 'Medium'
    if (grams < 10000) return 'Heavy'
    if (grams < 1000000) return 'Very Heavy'
    return 'Extremely Heavy'
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Weight Converter</h1>
        <p className="text-gray-600">Convert between different weight units instantly</p>
      </div>

      {/* From/To Selector with Input and Result */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Convert Weight</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* From Section */}
          <div className="flex-1 max-w-xs">
            {/* Input Field */}
            <label htmlFor="mainFromInput" className="block text-sm font-medium text-gray-700 mb-2">
              {weightUnits.find(u => u.symbol === fromUnit)?.name} ({fromUnit})
            </label>
            <input
              id="mainFromInput"
              type="text"
              value={values[fromUnit] || ''}
              onChange={(e) => handleInputChange(e.target.value, fromUnit)}
              className="w-full px-3 py-2 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
              placeholder="Enter weight"
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
                  convertWeight(values[e.target.value], e.target.value)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {weightUnits.map(unit => (
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
              {weightUnits.find(u => u.symbol === toUnit)?.name} ({toUnit})
            </label>
            <div className="w-full px-3 py-2 text-lg bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono mb-3 overflow-auto">
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
              {weightUnits.map(unit => (
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
          {[1, 100, 1000, 5000, 10000].map(value => (
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
        {weightUnits.map(unit => (
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

              {/* Weight Context */}
              {values[unit.symbol] && !isNaN(Number(values[unit.symbol])) && (
                <div className="mt-2 text-sm">
                  <span className="font-medium text-gray-700">
                    {(() => {
                      const weight = Number(values[unit.symbol]) * unit.toGrams
                      return getWeightDescription(weight)
                    })()}
                  </span>
                </div>
              )}

              {/* Category Badge */}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${unit.category === 'metric' ? 'bg-green-100 text-green-800' :
                  unit.category === 'imperial' ? 'bg-blue-100 text-blue-800' :
                    unit.category === 'jewelry' ? 'bg-purple-100 text-purple-800' :
                      unit.category === 'scientific' ? 'bg-orange-100 text-orange-800' :
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
          onClick={() => setExample(1000)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Reset to 1000 {fromUnit}
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
              <li>• Supports 15 different weight units</li>
              <li>• Weight context indicators</li>
              <li>• Responsive design for all devices</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Categories:</h4>
            <ul className="space-y-1">
              <li>• <span className="font-medium text-green-700">Metric:</span> g, kg, mg, µg, t</li>
              <li>• <span className="font-medium text-blue-700">Imperial:</span> lb, oz, US ton, UK ton, st, gr</li>
              <li>• <span className="font-medium text-purple-700">Jewelry:</span> ct (carats)</li>
              <li>• <span className="font-medium text-orange-700">Scientific:</span> u (atomic mass)</li>
              <li>• <span className="font-medium text-red-700">Astronomical:</span> M☉, M⊕</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
