export type Category = { id: string; name: string }
export type Vendor = { id: string; name: string; lastTimeUsed: string | null }
export type CategoryAllocation = { categoryId: string; amountCents: number }

export type Transaction = {
  id: string
  bankAccountId: string
  date: string
  amountCents: number
  description: string
  predictedVendorId: string | null
  actualVendorId: string | null
  predictedCategory: CategoryAllocation[]
  actualCategory: CategoryAllocation[] | null
  status: 'Pending' | 'Posted' | 'Excluded'
  needsInfo: boolean
}
