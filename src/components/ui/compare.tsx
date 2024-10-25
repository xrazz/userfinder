import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, XCircle } from "lucide-react"

export default function ProfessionalComparisonChart() {
  const comparisonData = [
    { feature: "Cost", traditional: "$100", userFinder: "$10" },
    { feature: "Reach", traditional: "Broad, less targeted", userFinder: "Highly targeted, organic" },
    { feature: "User Intent", traditional: "Variable", userFinder: "Actively seeking solutions" },
    { feature: "Engagement", traditional: "Passive viewers", userFinder: "Active conversations" },
    { feature: "Efficiency", traditional: "Lower ROI", userFinder: "Higher ROI" },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4 text-center">Traditional Ads vs UserFinder AI</h2>
      
      {/* Mobile view */}
      <div className="md:hidden space-y-6">
        {comparisonData.map((row, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-lg">{row.feature}</h3>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <XCircle className="w-4 h-4 text-destructive mr-2" />
                <span className="text-sm">Traditional</span>
              </div>
              <span className="text-sm">{row.traditional}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm">UserFinder AI</span>
              </div>
              <span className="text-sm">{row.userFinder}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Feature</TableHead>
              <TableHead className="w-1/3">Traditional Ads</TableHead>
              <TableHead className="w-1/3">UserFinder AI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisonData.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{row.feature}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 text-destructive mr-2" />
                    {row.traditional}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                    {row.userFinder}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="mt-4 text-sm text-muted-foreground text-center">
        UserFinder AI provides a more cost-effective and targeted approach to app promotion, 
        connecting you directly with users actively seeking solutions like yours.
      </p>
    </div>
  )
}