import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/shoe-size-conversion')({
  component: RouteComponent,
})

interface ShoeSizeSystem {
  name: string
  country: string
  symbol: string
  toMM: (size: number) => number
  fromMM: (mm: number) => number
  minSize: number
  maxSize: number
  step: number
  category: string
}

const shoeSizeSystems: ShoeSizeSystem[] = [
  {
    name: 'US Men',
    country: 'United States',
    symbol: 'US M',
    toMM: (size) => (size * 25.4) + 22.86,
    fromMM: (mm) => (mm - 22.86) / 25.4,
    minSize: 6,
    maxSize: 16,
    step: 0.5,
    category: 'north-america'
  },
  {
    name: 'US Women',
    country: 'United States',
    symbol: 'US W',
    toMM: (size) => (size * 25.4) + 20.32,
    fromMM: (mm) => (mm - 20.32) / 25.4,
    minSize: 5,
    maxSize: 12,
    step: 0.5,
    category: 'north-america'
  },
  {
    name: 'UK',
    country: 'United Kingdom',
    symbol: 'UK',
    toMM: (size) => (size * 25.4) + 25.4,
    fromMM: (mm) => (mm - 25.4) / 25.4,
    minSize: 3,
    maxSize: 13,
    step: 0.5,
    category: 'europe'
  },
  {
    name: 'EU',
    country: 'European Union',
    symbol: 'EU',
    toMM: (size) => (size * 6.67) + 20.32,
    fromMM: (mm) => (mm - 20.32) / 6.67,
    minSize: 35,
    maxSize: 48,
    step: 1,
    category: 'europe'
  },
  {
    name: 'JP/CM',
    country: 'Japan/China',
    symbol: 'JP',
    toMM: (size) => size * 10,
    fromMM: (mm) => mm / 10,
    minSize: 22,
    maxSize: 30,
    step: 0.5,
    category: 'asia'
  },
  {
    name: 'AU',
    country: 'Australia',
    symbol: 'AU',
    toMM: (size) => (size * 25.4) + 25.4,
    fromMM: (mm) => (mm - 25.4) / 25.4,
    minSize: 3,
    maxSize: 13,
    step: 0.5,
    category: 'oceania'
  },
  {
    name: 'MX',
    country: 'Mexico',
    symbol: 'MX',
    toMM: (size) => (size * 25.4) + 22.86,
    fromMM: (mm) => (mm - 22.86) / 25.4,
    minSize: 6,
    maxSize: 16,
    step: 0.5,
    category: 'latin-america'
  },
  {
    name: 'BR',
    country: 'Brazil',
    symbol: 'BR',
    toMM: (size) => (size * 25.4) + 22.86,
    fromMM: (mm) => (mm - 22.86) / 25.4,
    minSize: 6,
    maxSize: 16,
    step: 0.5,
    category: 'latin-america'
  }
]

function RouteComponent() {
  const [values, setValues] = useState<{ [key: string]: string }>({})
  const [activeInput, setActiveInput] = useState<string>('US M')
  const [fromUnit, setFromUnit] = useState<string>('US M')
  const [toUnit, setToUnit] = useState<string>('EU')
  const [footLengthMM, setFootLengthMM] = useState<number>(0)

  // Initialize with US Men size 9
  useEffect(() => {
    const initialValues: { [key: string]: string } = {}
    shoeSizeSystems.forEach(system => {
      initialValues[system.symbol] = '9'
    })
    setValues(initialValues)
    setFootLengthMM(shoeSizeSystems[0].toMM(9))
  }, [])

  const convertShoeSize = (value: string, fromUnit: string) => {
    if (!value || isNaN(Number(value))) {
      // Clear all fields if input is invalid
      const clearedValues: { [key: string]: string } = {}
      shoeSizeSystems.forEach(system => {
        clearedValues[system.symbol] = ''
      })
      setValues(clearedValues)
      setFootLengthMM(0)
      return
    }

    const fromSystem = shoeSizeSystems.find(system => system.symbol === fromUnit)
    if (!fromSystem) return

    const mm = fromSystem.toMM(Number(value))
    setFootLengthMM(mm)

    const newValues: { [key: string]: string } = {}

    shoeSizeSystems.forEach(system => {
      if (system.symbol === fromUnit) {
        newValues[system.symbol] = value
      } else {
        const convertedSize = system.fromMM(mm)
        // Round to appropriate decimal places based on step
        const roundedSize = Math.round(convertedSize / system.step) * system.step
        newValues[system.symbol] = roundedSize.toFixed(system.step < 1 ? 1 : 0)
      }
    })

    setValues(newValues)
  }

  const handleInputChange = (value: string, unit: string) => {
    setActiveInput(unit)
    convertShoeSize(value, unit)
  }

  const clearAll = () => {
    const clearedValues: { [key: string]: string } = {}
    shoeSizeSystems.forEach(system => {
      clearedValues[system.symbol] = ''
    })
    setValues(clearedValues)
    setFootLengthMM(0)
    setActiveInput('US M')
  }

  const setExample = (example: number) => {
    setActiveInput(fromUnit)
    convertShoeSize(example.toString(), fromUnit)
  }

  // const getSizeRange = (system: ShoeSizeSystem) => {
  //   const sizes = []
  //   for (let size = system.minSize; size <= system.maxSize; size += system.step) {
  //     sizes.push(size)
  //   }
  //   return sizes
  // }

  const getFootLengthDescription = (mm: number) => {
    if (mm < 200) return 'Toddler'
    if (mm < 230) return 'Children'
    if (mm < 250) return 'Youth'
    if (mm < 270) return 'Small Adult'
    if (mm < 290) return 'Medium Adult'
    if (mm < 310) return 'Large Adult'
    return 'Extra Large Adult'
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Shoe Size Converter</h1>
        <p className="text-gray-600">Convert between international shoe sizing systems and foot length</p>
      </div>

      {/* From/To Selector with Input and Result */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Convert Shoe Size</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* From Section */}
          <div className="flex-1 max-w-xs">
            {/* Input Field */}
            <label htmlFor="mainFromInput" className="block text-sm font-medium text-gray-700 mb-2">
              {shoeSizeSystems.find(u => u.symbol === fromUnit)?.name} Size
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
              From System
            </label>
            <select
              id="fromUnit"
              value={fromUnit}
              onChange={(e) => {
                setFromUnit(e.target.value)
                setActiveInput(e.target.value)
                if (values[e.target.value]) {
                  convertShoeSize(values[e.target.value], e.target.value)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {shoeSizeSystems.map(system => (
                <option key={system.symbol} value={system.symbol}>
                  {system.name} ({system.country})
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
              {shoeSizeSystems.find(u => u.symbol === toUnit)?.name} Size
            </label>
            <div className="w-full px-3 py-2 text-lg bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-mono mb-3">
              {values[toUnit] || '0'}
            </div>

            {/* To Unit Dropdown */}
            <label htmlFor="toUnit" className="block text-sm font-medium text-gray-700 mb-2">
              To System
            </label>
            <select
              id="toUnit"
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {shoeSizeSystems.map(system => (
                <option key={system.symbol} value={system.symbol}>
                  {system.name} ({system.country})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Foot Length Display */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Foot Length</h3>
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {footLengthMM.toFixed(1)} mm
          </div>
          <div className="text-lg text-gray-700 mb-3">
            {getFootLengthDescription(footLengthMM)}
          </div>
          <div className="text-sm text-gray-600">
            ≈ {(footLengthMM / 25.4).toFixed(2)} inches
          </div>
        </div>
      </div>

      {/* Quick Examples */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Examples</h3>
        <div className="flex flex-wrap gap-2">
          {[7, 9, 10, 11, 12].map(value => (
            <button
              key={value}
              onClick={() => setExample(value)}
              className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              Size {value} {fromUnit}
            </button>
          ))}
        </div>
      </div>

      {/* Conversion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {shoeSizeSystems.map(system => (
          <div
            key={system.symbol}
            className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-200 ${activeInput === system.symbol
              ? 'border-blue-500 shadow-blue-100'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{system.name}</h3>
                <span className="text-sm text-gray-500 font-mono">{system.symbol}</span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={values[system.symbol] || ''}
                  onChange={(e) => handleInputChange(e.target.value, system.symbol)}
                  className={`w-full px-3 py-2 text-lg border rounded-lg focus:outline-none focus:ring-2 transition-all ${activeInput === system.symbol
                    ? 'border-blue-500 focus:ring-blue-500 focus:border-blue-500'
                    : 'border-gray-300 focus:ring-gray-500 focus:border-gray-500'
                    }`}
                  placeholder="0"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                  {system.symbol}
                </div>
              </div>

              {/* Size Range Info */}
              <div className="mt-2 text-xs text-gray-600">
                Range: {system.minSize} - {system.maxSize} ({system.step === 0.5 ? '0.5' : '1'} step)
              </div>

              {/* Category Badge */}
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${system.category === 'north-america' ? 'bg-blue-100 text-blue-800' :
                  system.category === 'europe' ? 'bg-green-100 text-green-800' :
                    system.category === 'asia' ? 'bg-purple-100 text-purple-800' :
                      system.category === 'oceania' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                  }`}>
                  {system.country}
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
          onClick={() => setExample(9)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Reset to Size 9 {fromUnit}
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
              <li>• Supports 8 international sizing systems</li>
              <li>• Shows foot length in millimeters</li>
              <li>• Responsive design for all devices</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Regions:</h4>
            <ul className="space-y-1">
              <li>• <span className="font-medium text-blue-700">North America:</span> US Men/Women, MX, BR</li>
              <li>• <span className="font-medium text-green-700">Europe:</span> UK, EU</li>
              <li>• <span className="font-medium text-purple-700">Asia:</span> JP/CM</li>
              <li>• <span className="font-medium text-orange-700">Oceania:</span> AU</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
