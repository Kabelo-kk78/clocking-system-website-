import { useState } from 'react'
import { BarChart3, Download, Loader2, AlertCircle, FileText } from 'lucide-react'
import { generateDailyReport, generateWeeklyReport, generateMonthlyReport, exportCSV } from '../../services/reportService'
import { todayISO, formatDateNice } from '../../utils/dateUtils'

export default function AdminReports() {
  const [type, setType] = useState('daily')
  const [date, setDate] = useState(todayISO())
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      let result
      if (type === 'daily') {
        result = await generateDailyReport(date)
      } else if (type === 'weekly') {
        result = await generateWeeklyReport(date)
      } else {
        result = await generateMonthlyReport(date)
      }
      setReport(result)
    } catch (err) {
      setError(err.message || 'Failed to generate report.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!report) return
    const filename = `${type}_report_${report.range?.start || date}.csv`
    exportCSV(report.rows || [], filename)
  }

  const summaryCards = report?.summary ? [
    { label: 'Total Employees', value: report.summary.totalEmployees },
    { label: 'Present', value: report.summary.present },
    { label: 'Absent', value: report.summary.absent },
    { label: 'Late', value: report.summary.late }
  ] : []

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Generate daily, weekly and monthly attendance reports</p>
        </div>
        {report?.rows?.length > 0 && (
          <button onClick={handleExport} className="btn-secondary">
            <Download size={18} />
            Export CSV
          </button>
        )}
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Report Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field"
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <BarChart3 size={18} />}
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm mb-6">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="card">
          <div className="flex items-center justify-center gap-3 text-gray-500 py-8">
            <Loader2 size={24} className="animate-spin text-brand-600" />
            <span>Generating report...</span>
          </div>
        </div>
      )}

      {report && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {summaryCards.map((card) => (
              <div key={card.label} className="card !p-4">
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-brand-600" />
              <div>
                <h2 className="font-semibold text-gray-900 capitalize">{type} Report</h2>
                <p className="text-xs text-gray-500">
                  {report.range?.start && formatDateNice(report.range.start)} – {report.range?.end && formatDateNice(report.range.end)}
                </p>
              </div>
            </div>

            {report.rows?.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">No data available for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {Object.keys(report.rows[0] || {}).map((col) => (
                        <th key={col} className="px-4 py-3">{col.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-4 py-3 text-gray-700">{val ?? '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}