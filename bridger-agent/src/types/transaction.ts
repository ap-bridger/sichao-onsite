export type Category = {
  id: number
  name: string
}

export type Vendor = {
  id: number
  name: string
  lastUsed: number
}

export type Transaction = {
  id: number
  date: number
  amount: number
  description: string
  from: Vendor
  predictedCategory: Category
  actualCategory: Category
  bankAcct: number
  status: 'Pending' | 'Excluded' | 'Posted'
  requireInfo: boolean
}
