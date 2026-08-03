import dayjs from 'dayjs'

export function generateNo(type: string, sequence: number = 1): string {
  const prefixMap: Record<string, string> = {
    project: 'PJ',
    template: 'TPL',
  }
  const prefix = prefixMap[type] || 'XX'
  const date = dayjs().format('YYYYMMDD')
  const seq = String(sequence).padStart(4, '0')
  return `${prefix}${date}${seq}`
}