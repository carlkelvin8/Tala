import * as React from "react"
import { Card } from "./card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import { cn } from "../../lib/utils"

export type ResponsiveColumn<T> = {
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
  cardLabel?: string
}

type ResponsiveTableCardsProps<T> = {
  data: T[]
  columns: ResponsiveColumn<T>[]
  rowKey: (row: T) => string
  renderTitle?: (row: T) => React.ReactNode
  renderActions?: (row: T) => React.ReactNode
  className?: string
}

export function ResponsiveTableCards<T>({
  data,
  columns,
  rowKey,
  renderTitle,
  renderActions,
  className
}: ResponsiveTableCardsProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3 md:hidden">
        {data.map((row) => (
          <Card key={rowKey(row)} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold text-slate-900">{renderTitle ? renderTitle(row) : rowKey(row)}</div>
              {renderActions && <div>{renderActions(row)}</div>}
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              {columns.map((column) => (
                <div key={column.header} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {column.cardLabel ?? column.header}
                  </span>
                  <div className="text-right text-slate-700">{column.cell(row)}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.header}>{column.header}</TableHead>
              ))}
              {renderActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((column) => (
                  <TableCell key={column.header} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
                {renderActions && <TableCell className="text-right">{renderActions(row)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
